/* eslint-disable no-console */
export const runtime = 'edge';

// Next.js Edge route that upgrades to WebSocket for Exotel bidirectional stream
// Follows Exotel message schema: connected/start/media/dtmf/stop/mark

import { base64ToUint8, concatUint8, muLawToPCM16, uint8ToBase64, wavFromPCM16 } from '@/lib/audio';
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
  // Exotel default sample rate is 8000; honor query if provided
  const sampleRate = Number(searchParams.get('sample-rate') || '8000');

  const { 0: client, 1: server } = new (globalThis as any).WebSocketPair();

  // Track stream metadata
  let seq = 0;
  let streamSid: string | null = null;
  let lastChunk = 0;
  let processing = false;
  let playingTTS = false;
  let agentPrompt = '';
  const incomingPcmChunks: Uint8Array[] = [];
  const PROCESS_THRESHOLD_BYTES = Math.max(3200, Math.round(sampleRate * 2 * 2)); // ~2s of audio at given rate

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

  async function processBuffersAndRespond() {
    if (processing) return;
    if (incomingPcmChunks.length === 0) return;
    if (playingTTS) return; // do not STT while playback to avoid echo
    processing = true;
    try {
      const pcm = concatUint8(incomingPcmChunks.splice(0, incomingPcmChunks.length));
      if (pcm.length < 320) return; // too small

      // Build WAV for STT
      const wav = wavFromPCM16(pcm, sampleRate);

      // Send to our upload-audio endpoint as JSON base64 (avoids Blob/FormData on Edge)
      const baseHttp = `${originUrl.protocol}//${originUrl.host}`;
      const wavBase64 = uint8ToBase64(wav);
      const sttRes = await fetch(`${baseHttp}/api/upload-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: wavBase64 })
      });
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

      // Call LLM for response text
      const llmRes = await fetch(`${baseHttp}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText, prompt: agentPrompt || '' })
      });
      if (!llmRes.ok) {
        console.warn('[Exotel WS] LLM failed', llmRes.status);
        return;
      }
      const llmJson = await llmRes.json();
      const botText: string = (llmJson.llmText || '').toString().trim();
      if (!botText) return;

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
      // Prefer mulawBase64, convert to PCM16 as Exotel expects PCM16LE in both directions
      const mulawB64: string = ttsJson.mulawBase64 || '';
      const audioB64: string = ttsJson.audioData || '';
      if (!mulawB64 && !audioB64) return;

      let pcm16: Uint8Array | null = null;
      if (mulawB64) {
        const mu = base64ToUint8(mulawB64);
        pcm16 = muLawToPCM16(mu);
      } else {
        // If only WAV was returned in audioData, it may already be PCM16; extract PCM block
        const wav = base64ToUint8(audioB64);
        // Minimal parse to data chunk, reusing existing pcm16FromWav logic by local parse to keep imports small
        // Simple PCM16 parse
        const dv = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
        if (String.fromCharCode(...wav.slice(0, 4)) === 'RIFF' && String.fromCharCode(...wav.slice(8, 12)) === 'WAVE') {
          let off = 12;
          while (off + 8 <= wav.length) {
            const id = String.fromCharCode(wav[off], wav[off + 1], wav[off + 2], wav[off + 3]);
            const size = dv.getUint32(off + 4, true);
            if (id === 'data') {
              pcm16 = wav.slice(off + 8, off + 8 + size);
              break;
            }
            off += 8 + size;
          }
        }
      }
      if (!pcm16) return;

      // Chunk size in multiples of 320 bytes. Default to ~100ms (3200 bytes) per Exotel docs.
      const preferred = 3200; // ~100ms at 8kHz PCM16 mono
      const bytesPerMs = (sampleRate * 2) / 1000; // 2 bytes per sample (16-bit)
      const chunks: Uint8Array[] = [];
      const size = Math.max(320, Math.round(preferred / 320) * 320);
      for (let i = 0; i < pcm16.length; i += size) chunks.push(pcm16.slice(i, i + size));

      playingTTS = true;
      for (const c of chunks) {
        const payload = uint8ToBase64(c);
        (server as WebSocket).send(textFrame({
          event: 'media',
          sequence_number: ++seq,
          stream_sid: streamSid,
          media: { chunk: ++lastChunk, timestamp: Date.now().toString(), payload },
        }));
        // Pace based on content duration: duration_ms = bytes / bytesPerMs
        const durationMs = Math.max(20, Math.round(c.length / bytesPerMs));
        await sleep(durationMs);
      }
      // notify playback marker
      (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'bot-tts' } }));
      playingTTS = false;
    } catch (err) {
      console.error('[Exotel WS] Processing error', err);
    } finally {
      processing = false;
      playingTTS = false;
    }
  }

  (server as WebSocket).addEventListener('message', async (event) => {
    try {
      const data = typeof event.data === 'string' ? event.data : await (event.data as Blob).text();
      const msg = JSON.parse(data);

      if (msg.event === 'start') {
        streamSid = msg.start?.stream_sid || msg.stream_sid || streamSid || `exotel_${Date.now()}`;
        seq = (msg.sequence_number ?? 0) as number;
        // Load agent prompt from custom parameters or URL (agent_id)
        try {
          const custom = msg.start?.custom_parameters || msg.start?.customParameters || {};
          const url = new URL(req.url);
          const agentHint = custom?.agent_id || custom?.agentId || url.searchParams.get('agent_id') || url.searchParams.get('agentId');
          if (agentHint) {
            const res = await fetch(`${url.protocol}//${url.host}/api/voice-agents/${agentHint}`);
            if (res.ok) {
              const j = await res.json();
              agentPrompt = (j?.agent?.prompt || '').toString();
            }
          }
          if (!agentPrompt) {
            const list = await fetch(`${url.protocol}//${url.host}/api/voice-agents?userId=mukul`);
            if (list.ok) {
              const j = await list.json();
              const first = Array.isArray(j?.agents) && j.agents.length > 0 ? j.agents[0] : null;
              agentPrompt = (first?.prompt || '').toString();
            }
          }
        } catch {}
        // Optionally, send an acknowledgement
        (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'start-ack' } }));
        return;
      }

      if (msg.event === 'media') {
        // Incoming audio payload base64 (PCM16LE mono)
        const payloadB64: string = msg.media?.payload || '';
        if (payloadB64) {
          if (playingTTS) return; // ignore mic input while we are speaking
          lastChunk = (msg.media?.chunk ?? lastChunk) as number;
          const bytes = base64ToUint8(payloadB64);
          incomingPcmChunks.push(bytes);
          const total = incomingPcmChunks.reduce((s, c) => s + c.length, 0);
          if (total >= PROCESS_THRESHOLD_BYTES) {
            // Fire and forget; mutex ensures single run at a time
            processBuffersAndRespond();
          }
        }
        return;
      }

      if (msg.event === 'dtmf') {
        // You may handle DTMF during call (e.g., interrupt / clear)
        return;
      }

      if (msg.event === 'stop') {
        try { (server as WebSocket).send(textFrame({ event: 'mark', sequence_number: ++seq, stream_sid: streamSid, mark: { name: 'stopped' } })); } catch {}
        try { (server as WebSocket).close(1000, 'bye'); } catch {}
        return;
      }
    } catch {
      try { (server as WebSocket).send(textFrame({ event: 'clear', stream_sid: streamSid })); } catch {}
    }
  });

  (server as WebSocket).addEventListener('close', () => {
    // cleanup resources if any
  });

  // @ts-ignore - webSocket is supported in Edge runtime ResponseInit
  return new Response(null, { status: 101, webSocket: client });
}
