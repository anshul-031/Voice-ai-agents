/**
 * Standalone WebSocket Server for Exotel Integration
 * 
 * This server handles Exotel Stream/VoiceBot WebSocket connections
 * and processes the audio pipeline: STT → LLM → TTS
 * 
 * Usage: node ws-server.js
 * WebSocket URL: ws://34.143.154.188:8765
 */

const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');

// Configuration
const WS_PORT = 8765;
// Prefer IPv4 loopback to avoid ::1 (IPv6) resolution issues
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8009'; // Next.js API server
const SAMPLE_RATE = 8000; // Exotel default sample rate
// Process smaller STT windows to reduce first-response latency (bytes of PCM16LE @ 8k = 2 bytes/sample)
const STT_CHUNK_BYTES = Math.max(3200, parseInt(process.env.STT_CHUNK_BYTES || '8000', 10) || 8000);
// Optional quick greeting to keep call alive while first STT/LLM runs
const EXOTEL_GREETING = process.env.EXOTEL_GREETING || '';
const AGENT_PROMPT = process.env.AGENT_PROMPT || process.env.INITIAL_PROMPT || '';
// Timing/keepalive tuning knobs
const EXOTEL_PRE_SEND_DELAY_MS = Math.max(0, parseInt(process.env.EXOTEL_PRE_SEND_DELAY_MS || '150', 10) || 150);
// Optional flags to include additional fields; default to minimal payloads per provider strictness
const EXOTEL_INCLUDE_TIMESTAMP = (process.env.EXOTEL_INCLUDE_TIMESTAMP || 'false').toLowerCase() === 'true';
const EXOTEL_SEND_MARKS = (process.env.EXOTEL_SEND_MARKS || 'false').toLowerCase() === 'true';
// Per Exotel docs, media must be PCM16LE; keepalive (if enabled) uses PCM16 silence.
// Default ON to prevent inactivity closures until first playback is sent.
const EXOTEL_KEEPALIVE = (process.env.EXOTEL_KEEPALIVE || 'false').toLowerCase() === 'true';
const EXOTEL_KEEPALIVE_MS = Math.max(20, parseInt(process.env.EXOTEL_KEEPALIVE_MS || '200', 10) || 200);
const EXOTEL_KEEPALIVE_GAP_MS = Math.max(200, parseInt(process.env.EXOTEL_KEEPALIVE_GAP_MS || '800', 10) || 800);

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'exotel-ws-server' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Exotel WebSocket Server Running\nConnect via WebSocket to this endpoint.');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log(`[WS Server] Starting Exotel WebSocket server...`);

// Helper: Convert base64 audio to Uint8Array
function base64ToUint8(base64) {
  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}

// Helper: Create WAV file from PCM16 audio
function wavFromPCM16(pcm16Data, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm16Data.length;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // fmt chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  pcm16Data.copy(buffer, offset);

  return buffer;
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Honor sample-rate if provided as query; may be overridden by start.media_format later
  const parsedRate = parseInt(url.searchParams.get('sample-rate') || '', 10);
  let sampleRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : SAMPLE_RATE;
  let callSid = url.searchParams.get('CallSid') || url.searchParams.get('call_sid') || 'unknown';
  const from = url.searchParams.get('From') || url.searchParams.get('from') || 'unknown';
  const to = url.searchParams.get('To') || url.searchParams.get('to') || 'unknown';

  console.log(`\n[Exotel WS] New connection:`, {
    callSid,
    from,
    to,
    sampleRate: `${sampleRate} Hz (Exotel default: 8000)`,
    ip: req.socket.remoteAddress,
  });

  // Connection state
  let audioBuffer = Buffer.alloc(0);
  let mediaCount = 0;
  let totalBytes = 0;
  let streamSid = null;
  let isProcessing = false;
  let isPlayingTTS = false;
  let stopped = false;
  let closed = false;
  // Removed sequenceNumber usage to keep payload minimal
  let agentPrompt = '';
  let firstPlaybackSent = false;
  let keepaliveActive = false;
  let keepaliveLoopPromise = null;
  let streamStartMs = 0;
  // keepaliveTimer removed (no outbound silent frames to avoid provider disconnects)

  async function fetchAgentPrompt(agentIdHint) {
    try {
      if (agentIdHint) {
        const byId = await fetch(`${API_BASE_URL}/api/voice-agents/${agentIdHint}`);
        if (byId.ok) {
          const j = await byId.json();
          const p = j?.agent?.prompt;
          if (p && typeof p === 'string') return p;
        }
      }
      // Fallback: latest agent for default user (sorted by lastUpdated desc in API)
      const list = await fetch(`${API_BASE_URL}/api/voice-agents?userId=mukul`);
      if (list.ok) {
        const j = await list.json();
        const first = Array.isArray(j?.agents) && j.agents.length > 0 ? j.agents[0] : null;
        const p = first?.prompt;
        if (p && typeof p === 'string') return p;
      }
    } catch (e) {
      console.warn('[Exotel WS] Could not fetch agent prompt', e?.message || e);
    }
    return '';
  }

  // Do not send any unsolicited 'connected' event; Exotel will send it first.
  // Respond to ping to keep connection alive
  ws.on('ping', () => { try { ws.pong(); } catch (_) {} });

  async function sendAudioToExotel(bytes, bytesPerSample, label = 'tts') {
    if (!bytes || !bytes.length) return false;
    if (closed || stopped || ws.readyState !== WebSocket.OPEN) return false;
    if (!streamSid) {
      // Wait briefly for 'start' event to arrive
      for (let i = 0; i < 20 && !streamSid && !closed && !stopped; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!streamSid) {
        console.warn('[Exotel WS] No streamSid yet; skipping playback to avoid protocol violation');
        return false;
      }
    }
  // Exotel expects PCM16LE frames in multiples of 320 bytes, min ~100ms (3200 bytes), max 100k
  // We'll compute a preferred size around 3200 and clamp to [3200, 100000] and multiples of 320.
  const preferred = 3200;
  const minSize = 3200;
  const maxSize = 100000;
  let size = preferred;
  // Round to multiple of 320
  size = Math.max(320, Math.round(size / 320) * 320);
  size = Math.min(Math.max(size, minSize), maxSize);
  const bytesPerMs = (sampleRate * bytesPerSample) / 1000;
    let total = 0;
    // Small delay after start to ensure remote is ready
    if (EXOTEL_PRE_SEND_DELAY_MS > 0) {
      await new Promise((r) => setTimeout(r, EXOTEL_PRE_SEND_DELAY_MS));
    }
    isPlayingTTS = true;
  console.log(`[Exotel WS] Sending ${label} PCM16 bytes: ${bytes.length}, chunkSize: ${size}, sampleRate: ${sampleRate}`);
    for (let i = 0, chunkIdx = 0; i < bytes.length; i += size, chunkIdx++) {
      if (closed || stopped || ws.readyState !== WebSocket.OPEN) break;
      let frame = bytes.slice(i, i + size);
      // Exotel requires all chunks to be multiples of 320 bytes, and min 3200 bytes
      const minSize = 3200;
      const nextMultiple = Math.max(minSize, Math.ceil(frame.length / 320) * 320);
      if (frame.length < nextMultiple) {
        frame = Buffer.concat([frame, Buffer.alloc(nextMultiple - frame.length, 0x00)]);
      }
      const payloadB64 = frame.toString('base64');
      // Build minimal media message; include timestamp only if expressly enabled
      const mediaMessage = {
        event: 'media',
        stream_sid: streamSid,
        media: EXOTEL_INCLUDE_TIMESTAMP
          ? { payload: payloadB64, timestamp: String(Math.max(0, Date.now() - (streamStartMs || Date.now()))) }
          : { payload: payloadB64 },
      };
      try {
        ws.send(JSON.stringify(mediaMessage));
      } catch (e) {
        console.error(`[Exotel WS] Failed to send media (${label}):`, e?.message || e);
        break;
      }
      total += frame.length;
      const durationMs = Math.max(20, Math.round(frame.length / bytesPerMs));
      await new Promise((r) => setTimeout(r, durationMs));
    }
    if (EXOTEL_SEND_MARKS && total > 0 && !closed && !stopped && ws.readyState === WebSocket.OPEN) {
      try {
        const markMessage = {
          event: 'mark',
          stream_sid: streamSid,
          mark: { name: `${label}_${Date.now()}` },
        };
        ws.send(JSON.stringify(markMessage));
        console.log(`[Exotel WS] Mark event sent (${label})`);
      } catch (e) {
        console.warn('[Exotel WS] Failed to send mark:', e?.message || e);
      }
    }
    isPlayingTTS = false;
    if (total > 0) firstPlaybackSent = true;
    console.log(`[Exotel WS] ${label.toUpperCase()} audio sent to Exotel in chunks, ${total} bytes`);
    return total > 0;
  }

  // Generate PCM16LE silence buffer for the given milliseconds
  function makePcm16Silence(ms = EXOTEL_KEEPALIVE_MS) {
    const samples = Math.max(1, Math.round((sampleRate * ms) / 1000));
    let buf = Buffer.alloc(samples * 2, 0x00); // 16-bit LE zeros
    // Ensure at least 3200 bytes and multiple of 320
    const minBytes = 3200;
    if (buf.length < minBytes) buf = Buffer.concat([buf, Buffer.alloc(minBytes - buf.length, 0x00)]);
    const rem = buf.length % 320;
    return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(320 - rem, 0x00)]);
  }

  // Periodic keepalive: send short silence until first playback is sent
  async function startKeepaliveLoop() {
    // Only run if explicitly enabled
    if (!EXOTEL_KEEPALIVE) return;
    if (keepaliveActive) return;
    keepaliveActive = true;
    console.log('[Exotel WS] Keepalive loop started');
    keepaliveLoopPromise = (async () => {
      while (keepaliveActive && !firstPlaybackSent && !closed && !stopped && ws.readyState === WebSocket.OPEN) {
        // Do not interfere when actively playing TTS
        if (!isPlayingTTS) {
          try {
            const buf = makePcm16Silence(EXOTEL_KEEPALIVE_MS);
            await sendAudioToExotel(buf, 2, 'keepalive');
          } catch (e) {
            console.warn('[Exotel WS] Keepalive send failed:', e?.message || e);
          }
        }
        // Wait before next keepalive burst
        const loops = Math.max(1, Math.round(EXOTEL_KEEPALIVE_GAP_MS / 100));
        for (let i = 0; i < loops && keepaliveActive && !firstPlaybackSent && !closed && !stopped; i++) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      console.log('[Exotel WS] Keepalive loop stopped');
    })();
  }
  function stopKeepaliveLoop() {
    keepaliveActive = false;
  }

  async function ttsTextAndPlay(text, label = 'tts') {
    // Step 3: Text-to-Speech
    console.log(`[Exotel WS] Calling TTS API...`);
    const ttsResponse = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.status}`);
    }

    const ttsData = await ttsResponse.json();
    const mulawBase64 = ttsData.mulawBase64 || '';
    const audioBase64 = ttsData.audioData || ttsData.audio || '';

    if (!mulawBase64 && !audioBase64) {
      throw new Error('TTS returned no audio');
    }

    // Always send PCM16LE to Exotel per docs
    let outBytes = null;
    let outBps = 2; // bytes per sample for PCM16LE
    // µ-law byte to PCM16 helper
    function muLawByteToLinear16(b) {
      b = (~b) & 0xff;
      const sign = b & 0x80;
      const exponent = (b >> 4) & 0x07;
      const mantissa = b & 0x0F;
      let t = ((mantissa << 3) + 0x84) << exponent;
      return sign ? (0x84 - t) : (t - 0x84);
    }
    function muLawToPCM16(buf) {
      const out = Buffer.alloc(buf.length * 2);
      for (let i = 0; i < buf.length; i++) out.writeInt16LE(muLawByteToLinear16(buf[i]), i * 2);
      return out;
    }
    if (mulawBase64) {
      const mu = Buffer.from(mulawBase64, 'base64');
      outBytes = muLawToPCM16(mu); outBps = 2;
    } else if (audioBase64) {
      const wav = Buffer.from(audioBase64, 'base64');
      // Parse WAV header
      if (wav.slice(0, 4).toString('ascii') === 'RIFF' && wav.slice(8, 12).toString('ascii') === 'WAVE') {
        let off = 12;
        let audioFormat = 1; // PCM
        let fmtFound = false;
        let dataOffset = -1;
        let dataSize = 0;
        while (off + 8 <= wav.length) {
          const id = wav.slice(off, off + 4).toString('ascii');
          const size = wav.readUInt32LE(off + 4);
          if (id === 'fmt ') {
            fmtFound = true;
            audioFormat = wav.readUInt16LE(off + 8); // 1=PCM, 7=µ-law
          } else if (id === 'data') {
            dataOffset = off + 8; dataSize = size; break;
          }
          off += 8 + size;
        }
        if (dataOffset >= 0) {
          const data = wav.slice(dataOffset, dataOffset + dataSize);
          if (fmtFound && audioFormat === 7) {
            // µ-law encoded within WAV; convert to PCM16LE
            outBytes = muLawToPCM16(data); outBps = 2;
          } else {
            // Assume PCM16LE
            outBytes = data; outBps = 2;
          }
        }
      } else {
        // Not a WAV; assume raw PCM16 already
        outBytes = wav; outBps = 2;
      }
    }

    if (!outBytes) throw new Error('Could not prepare audio for Exotel playback');
    await sendAudioToExotel(outBytes, outBps, label);
  }

  // Keepalive via outbound media is disabled to avoid provider disconnects

  console.log(`[Exotel WS] WebSocket ready; awaiting provider 'start'`);

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
  const data = JSON.parse(message.toString());
  const event = data.event;

      switch (event) {
        case 'connected':
          // Some providers may echo a connected event; safe to ignore
          console.log(`[Exotel WS] Peer sent 'connected'`);
          break;
        case 'start': {
          streamSid = data.stream_sid || data.streamSid || streamSid;
          const start = data.start || {};
          const custom = start.custom_parameters || start.customParameters || {};
          if (start.call_sid) {
            callSid = start.call_sid;
          }
          // Capture stream start time and override sample rate if provided by Exotel
          streamStartMs = Date.now();
          try {
            const fmt = start.media_format || {};
            const sr = parseInt(fmt.sample_rate || fmt.sampleRate || '', 10);
            if (Number.isFinite(sr) && sr > 0) sampleRate = sr;
          } catch {}
          // Start keepalive only if enabled
          firstPlaybackSent = false;
          if (EXOTEL_KEEPALIVE) startKeepaliveLoop();

          // Try to resolve agent prompt from custom params or URL query (agent_id / agentId) in background
          (async () => {
            try {
              const agentIdFromCustom = custom.agent_id || custom.agentId || custom.AGENT_ID || custom.AGENTId;
              const agentIdFromQuery = url.searchParams.get('agent_id') || url.searchParams.get('agentId');
              const hint = agentIdFromCustom || agentIdFromQuery;
              const prompt = await fetchAgentPrompt(hint);
              if (prompt) {
                agentPrompt = prompt;
                console.log('[Exotel WS] Loaded agent prompt (chars):', agentPrompt.length);
              } else {
                console.log('[Exotel WS] No agent prompt found; proceeding without system prompt');
              }
            } catch (e) {
              console.warn('[Exotel WS] Failed fetching agent prompt:', e?.message || e);
            }
          })();
          console.log(`[Exotel WS] Call started:`, {
            streamSid,
            callSid: start.call_sid,
            from: custom.From || custom.from,
            to: custom.To || custom.to,
          });

          // Optional quick greeting to keep the call open
          if (EXOTEL_GREETING && !isPlayingTTS && !stopped && ws.readyState === WebSocket.OPEN) {
            try { await ttsTextAndPlay(EXOTEL_GREETING, 'greeting'); } catch (e) { console.warn('[Exotel WS] Greeting TTS failed:', e?.message || e); }
          }
          break;
        }

        case 'media':
          // Accumulate audio data
          if (data.media && typeof data.media.payload === 'string' && data.media.payload.length > 0) {
            const payload = data.media.payload || '';
            const audioChunk = base64ToUint8(payload);
            audioBuffer = Buffer.concat([audioBuffer, Buffer.from(audioChunk)]);
            totalBytes += audioChunk.length;
            mediaCount++;

            // Process audio after STT_CHUNK_BYTES to reduce latency
            const CHUNK_SIZE = STT_CHUNK_BYTES;
            // If we're currently playing TTS back to the caller, skip STT to avoid echo/feedback
            if (isPlayingTTS) {
              // Optionally drain buffer to avoid backlog
              if (audioBuffer.length > CHUNK_SIZE * 2) {
                audioBuffer = audioBuffer.slice(-CHUNK_SIZE);
              }
              break;
            }

            if (audioBuffer.length >= CHUNK_SIZE && !isProcessing && !stopped && !closed) {
              isProcessing = true;
              const processingBuffer = audioBuffer.slice(0, CHUNK_SIZE);
              audioBuffer = audioBuffer.slice(CHUNK_SIZE);

              console.log(`[Exotel WS] Processing audio chunk: ${processingBuffer.length} bytes`);

              // Process audio pipeline: STT → LLM → TTS
              try {
                // Step 1: Speech-to-Text
                const wavFile = wavFromPCM16(processingBuffer, sampleRate);
                const wavBase64 = wavFile.toString('base64');

                console.log(`[Exotel WS] Calling STT API...`);
                const sttResponse = await fetch(`${API_BASE_URL}/api/upload-audio`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audio: wavBase64 }),
                });

                if (!sttResponse.ok) {
                  throw new Error(`STT failed: ${sttResponse.status}`);
                }

                const sttData = await sttResponse.json();
                const transcription = sttData.text || '';

                if (!transcription.trim()) {
                  console.log(`[Exotel WS] No speech detected, skipping...`);
                  isProcessing = false;
                  return;
                }

                console.log(`[Exotel WS] Transcription: "${transcription}"`);

                // Step 2: LLM Processing
                console.log(`[Exotel WS] Calling LLM API...`);
                const llmResponse = await fetch(`${API_BASE_URL}/api/llm`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userText: transcription,
                    sessionId: callSid,
                    prompt: agentPrompt,
                  }),
                });

                if (!llmResponse.ok) {
                  throw new Error(`LLM failed: ${llmResponse.status}`);
                }

                const llmData = await llmResponse.json();
                const llmText = llmData.llmText || llmData.text || 'I apologize, I did not understand that.';

                console.log(`[Exotel WS] LLM response: "${llmText}"`);

                await ttsTextAndPlay(llmText, 'response');

              } catch (error) {
                console.error(`[Exotel WS] Pipeline error:`, error.message);
                isPlayingTTS = false;
              }

              isProcessing = false;
            }
          }
          break;

        case 'mark':
          console.log(`[Exotel WS] Mark acknowledged:`, data.mark?.name);
          break;

        case 'stop':
          stopped = true;
          stopKeepaliveLoop();
          console.log(`[Exotel WS] Call ended`, {
            streamSid: data.streamSid || data.stream_sid || streamSid,
            mediaCount,
            totalBytes,
          });
          break;

        default:
          console.log(`[Exotel WS] Unknown event:`, event);
      }
    } catch (error) {
      console.error(`[Exotel WS] Error processing message:`, error.message);
      // Ignore and continue; Exotel may send pings or protocol variations
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    stopped = true; closed = true;
    stopKeepaliveLoop();
    console.log(`[Exotel WS] Connection closed:`, {
      code,
      reason: reason.toString(),
      callSid,
      mediaCount,
      totalBytes,
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[Exotel WS] WebSocket error:`, error.message);
  });
});

// Start server
server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`\n✅ Exotel WebSocket Server running!`);
  console.log(`   WebSocket URL: ws://34.143.154.188:${WS_PORT}`);
  console.log(`   Health Check: http://34.143.154.188:${WS_PORT}/health`);
  console.log(`\n📞 Configure in Exotel Stream applet:`);
  console.log(`   ws://34.143.154.188:${WS_PORT}`);
  console.log(`   (Default sample rate: 8000 Hz)`);
  console.log(`\n🔍 Waiting for connections...\n`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('[WS Server] Shutting down...');
  wss.close(() => {
    server.close(() => {
      console.log('[WS Server] Server closed');
      process.exit(0);
    });
  });
});
