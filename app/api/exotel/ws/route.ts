export const runtime = 'edge';

// Next.js Edge route that upgrades to WebSocket for Exotel bidirectional stream
// Follows Exotel message schema: connected/start/media/dtmf/stop/mark

import { base64ToUint8, concatUint8, pcm16FromWav, splitForExotel, uint8ToBase64, wavFromPCM16 } from '@/lib/audio';
import type { NextRequest } from 'next/server';

function textFrame(obj: any) {
  return JSON.stringify(obj);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  // Exotel defaults to 8000 Hz sample rate unless configured otherwise
  const sampleRate = Number(searchParams.get('sample-rate') || '8000');
  const callSid = searchParams.get('CallSid') || searchParams.get('callSid') || undefined;
  const from = searchParams.get('From') || searchParams.get('from') || undefined;
  const to = searchParams.get('To') || searchParams.get('to') || undefined;

  const { 0: client, 1: server } = new (globalThis as any).WebSocketPair();

  // Track stream metadata
  let seq = 0;
  let streamSid: string | null = null;
  let lastChunk = 0;
  let processing = false;
  const incomingPcmChunks: Uint8Array[] = [];
  const PROCESS_THRESHOLD_BYTES = Math.max(3200, Math.round(sampleRate * 2 * 2)); // ~2s of audio at given rate
  let mediaCount = 0;
  let bytesReceived = 0;

  // @ts-ignore - accept is available on Edge runtime WebSocket
  (server as any).accept();

  // On connection, Exotel will send 'connected' then 'start' events.
  // We echo a 'connected' for clarity (not strictly required by Exotel).
  try {
    (server as WebSocket).send(textFrame({ event: 'connected' }));
  } catch {
    // ignore if send fails
  }

  const originUrl = new URL(req.url);
  console.log('[Exotel WS] accepted upgrade', {
    path: originUrl.pathname,
    sampleRate,
    callSid,
    from,
    to,
  });

  async function processBuffersAndRespond() {
    if (processing) return;
    if (incomingPcmChunks.length === 0) return;
    processing = true;
    try {
      const pcm = concatUint8(incomingPcmChunks.splice(0, incomingPcmChunks.length));
      if (pcm.length < 320) return; // too small

      // Build WAV for STT
  const wav = wavFromPCM16(pcm, sampleRate);

      // Send to our upload-audio endpoint via form-data
  const form = new FormData();
  // Ensure BlobPart is a concrete ArrayBuffer (not SharedArrayBuffer)
  const ab = new ArrayBuffer(wav.byteLength);
  new Uint8Array(ab).set(wav);
  form.append('audio', new Blob([ab], { type: 'audio/wav' }), 'chunk.wav');

      const baseHttp = `${originUrl.protocol}//${originUrl.host}`;
      console.log('[Exotel WS] STT request', { baseHttp, bytes: wav.byteLength });
      const sttRes = await fetch(`${baseHttp}/api/upload-audio`, { method: 'POST', body: form });
      if (!sttRes.ok) {
        console.warn('[Exotel WS] STT failed', sttRes.status);
        return;
      }
      const sttJson = await sttRes.json();
      const userText: string = (sttJson.text || '').toString().trim();
      if (!userText) {
        console.log('[Exotel WS] Empty STT result, skipping TTS');
        return;
      }
      console.log('[Exotel WS] STT text', { len: userText.length, preview: userText.slice(0, 120) });

      // Call LLM for response text
      const llmRes = await fetch(`${baseHttp}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText, prompt: '' })
      });
      if (!llmRes.ok) {
        console.warn('[Exotel WS] LLM failed', llmRes.status);
        return;
      }
      const llmJson = await llmRes.json();
      const botText: string = (llmJson.llmText || '').toString().trim();
      if (!botText) return;
      console.log('[Exotel WS] LLM text', { len: botText.length, preview: botText.slice(0, 120) });

      // TTS the bot text
      const ttsRes = await fetch(`${baseHttp}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: botText })
      });
      if (!ttsRes.ok) {
        console.warn('[Exotel WS] TTS failed', ttsRes.status);
        return;
      }
      const ttsJson = await ttsRes.json();
      const base64Audio: string = ttsJson.audioData;
      if (!base64Audio) return;

      // Convert to PCM16 for Exotel
      const wavBytes = base64ToUint8(base64Audio);
      const { pcm: ttsPcm /*, sampleRate: ttsRate */ } = pcm16FromWav(wavBytes);
      const chunks = splitForExotel(ttsPcm, 3200); // ~100ms-ish
      console.log('[Exotel WS] TTS ready', { pcmBytes: ttsPcm.length, chunks: chunks.length });

      for (const c of chunks) {
        const payload = uint8ToBase64(c);
        (server as WebSocket).send(textFrame({
          event: 'media',
          sequence_number: ++seq,
          stream_sid: streamSid,
          media: { chunk: ++lastChunk, timestamp: Date.now().toString(), payload },
        }));
        // small pacing to avoid buffer overrun
        await sleep(20);
      }
      // notify playback marker
      (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'bot-tts' } }));
    } catch (err) {
      console.error('[Exotel WS] Processing error', err);
    } finally {
      processing = false;
    }
  }

  (server as WebSocket).addEventListener('message', async (event) => {
    try {
      const data = typeof event.data === 'string' ? event.data : await (event.data as Blob).text();
      const msg = JSON.parse(data);

      if (msg.event === 'start') {
        streamSid = msg.start?.stream_sid || msg.stream_sid || streamSid || `exotel_${Date.now()}`;
        seq = (msg.sequence_number ?? 0) as number;
        console.log('[Exotel WS] start', { streamSid, seq });
        // Optionally, send an acknowledgement
        (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'start-ack' } }));
        return;
      }

      if (msg.event === 'media') {
        // Incoming audio payload base64 (PCM16LE mono)
        const payloadB64: string = msg.media?.payload || '';
        if (payloadB64) {
          lastChunk = (msg.media?.chunk ?? lastChunk) as number;
          const bytes = base64ToUint8(payloadB64);
          incomingPcmChunks.push(bytes);
          mediaCount += 1;
          bytesReceived += bytes.length;
          const total = incomingPcmChunks.reduce((s, c) => s + c.length, 0);
          if (mediaCount % 25 === 0) {
            console.log('[Exotel WS] media', { mediaCount, queuedBytes: total, bytesReceived });
          }
          if (total >= PROCESS_THRESHOLD_BYTES) {
            // Fire and forget; mutex ensures single run at a time
            processBuffersAndRespond();
          }
        }
        return;
      }

      if (msg.event === 'dtmf') {
        // You may handle DTMF during call (e.g., interrupt / clear)
        console.log('[Exotel WS] dtmf', { digit: msg.dtmf?.digit, duration: msg.dtmf?.duration });
        return;
      }

      if (msg.event === 'stop') {
        console.log('[Exotel WS] stop received');
        try { (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'stopped' } })); } catch {}
        try { (server as WebSocket).close(1000, 'bye'); } catch {}
        return;
      }
    } catch (err) {
      console.warn('[Exotel WS] message parse error', err);
      try { (server as WebSocket).send(textFrame({ event: 'clear', stream_sid: streamSid })); } catch {}
    }
  });

  (server as WebSocket).addEventListener('close', () => {
    // cleanup resources if any
    console.log('[Exotel WS] connection closed');
  });

  // @ts-ignore - webSocket is supported in Edge runtime ResponseInit
  return new Response(null, { status: 101, webSocket: client });
}
