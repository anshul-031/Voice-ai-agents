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
const API_BASE_URL = 'http://localhost:8009'; // Next.js API server
const SAMPLE_RATE = 8000; // Exotel default sample rate

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
  const sampleRate = SAMPLE_RATE; // Exotel default; no query param needed
  const callSid = url.searchParams.get('CallSid') || url.searchParams.get('call_sid') || 'unknown';
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

  // Send initial response to Exotel
  ws.send(JSON.stringify({ event: 'connected', protocol: 'exotel-stream', version: '1.0' }));

  console.log(`[Exotel WS] Sent 'connected' event`);

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
  const data = JSON.parse(message.toString());
  const event = data.event;

      switch (event) {
        case 'start': {
          streamSid = data.stream_sid || data.streamSid || streamSid;
          const start = data.start || {};
          const custom = start.custom_parameters || start.customParameters || {};
          console.log(`[Exotel WS] Call started:`, {
            streamSid,
            callSid: start.call_sid,
            from: custom.From || custom.from,
            to: custom.To || custom.to,
          });
          break;
        }

        case 'media':
          // Accumulate audio data
          if ((data.media && data.media.payload) || (data.media && data.media.payload === '')) {
            const payload = data.media.payload || '';
            const audioChunk = base64ToUint8(payload);
            audioBuffer = Buffer.concat([audioBuffer, Buffer.from(audioChunk)]);
            totalBytes += audioChunk.length;
            mediaCount++;

            // Process audio every 3 seconds (24000 bytes at 8kHz)
            const CHUNK_SIZE = 24000;
            if (audioBuffer.length >= CHUNK_SIZE && !isProcessing) {
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
                  }),
                });

                if (!llmResponse.ok) {
                  throw new Error(`LLM failed: ${llmResponse.status}`);
                }

                const llmData = await llmResponse.json();
                const llmText = llmData.llmText || llmData.text || 'I apologize, I did not understand that.';

                console.log(`[Exotel WS] LLM response: "${llmText}"`);

                // Step 3: Text-to-Speech
                console.log(`[Exotel WS] Calling TTS API...`);
                const ttsResponse = await fetch(`${API_BASE_URL}/api/tts`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: llmText }),
                });

                if (!ttsResponse.ok) {
                  throw new Error(`TTS failed: ${ttsResponse.status}`);
                }

                const ttsData = await ttsResponse.json();
                const audioBase64 = ttsData.audioData || ttsData.audio;

                if (!audioBase64) {
                  throw new Error('TTS returned no audio');
                }

                // Convert TTS audio to mulaw format for Exotel
                const audioBuffer = Buffer.from(audioBase64, 'base64');
                const mulawAudio = audioBuffer.toString('base64');

                // Send audio back to Exotel
                const mediaMessage = {
                  event: 'media',
                  stream_sid: streamSid,
                  media: { payload: mulawAudio },
                };

                ws.send(JSON.stringify(mediaMessage));
                console.log(`[Exotel WS] TTS audio sent to Exotel: ${mulawAudio.length} chars`);

                // Send mark event
                const markMessage = {
                  event: 'mark',
                  stream_sid: streamSid,
                  mark: { name: `response_${Date.now()}` },
                };

                ws.send(JSON.stringify(markMessage));
                console.log(`[Exotel WS] Mark event sent`);

              } catch (error) {
                console.error(`[Exotel WS] Pipeline error:`, error.message);
              }

              isProcessing = false;
            }
          }
          break;

        case 'mark':
          console.log(`[Exotel WS] Mark acknowledged:`, data.mark?.name);
          break;

        case 'stop':
          console.log(`[Exotel WS] Call ended`, {
            streamSid: data.streamSid,
            mediaCount,
            totalBytes,
          });
          break;

        default:
          console.log(`[Exotel WS] Unknown event:`, event);
      }
    } catch (error) {
      console.error(`[Exotel WS] Error processing message:`, error.message);
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
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
