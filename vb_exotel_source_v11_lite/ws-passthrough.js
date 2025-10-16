/**
 * Passthrough WebSocket Echo Server for Exotel
 * 
 * Simple echo server that immediately returns received audio
 * Perfect for testing Exotel connectivity and protocol compliance
 * 
 * Usage: node ws-passthrough.js
 * URL: ws://34.143.154.188:8765?sample-rate=8000
 */

const WebSocket = require('ws');
const http = require('http');

// Configuration
const WS_PORT = 8765;

console.log('[Passthrough] Starting Exotel Passthrough Echo Server...');

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'exotel-passthrough', 
      mode: 'echo' 
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Exotel Passthrough Echo Server\n');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const connectionId = `conn_${Date.now()}`;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sampleRate = url.searchParams.get('sample-rate') || '8000'; // Exotel default: 8kHz
  
  console.log(`\n[${connectionId}] 🔌 WebSocket connected`);
  console.log(`[${connectionId}] Sample rate: ${sampleRate} Hz (Exotel default)`);
  console.log(`[${connectionId}] Remote IP: ${req.socket.remoteAddress}`);

  let streamSid = null;
  let callSid = null;
  let mediaCount = 0;

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const event = data.event;

      console.log(`[${connectionId}] 📨 Received: ${event}`);

      switch (event) {
        case 'connected':
          console.log(`[${connectionId}] 🎉 CONNECTED EVENT`);
          // No response needed for connected event
          break;

        case 'start':
          streamSid = data.stream_sid;
          const startData = data.start || {};
          callSid = startData.call_sid || 'unknown';
          const accountSid = startData.account_sid || 'unknown';
          const from = startData.from || 'unknown';
          const to = startData.to || 'unknown';
          const mediaFormat = startData.media_format || {};

          console.log(`[${connectionId}] 🚀 START EVENT`);
          console.log(`[${connectionId}]    Stream SID: ${streamSid}`);
          console.log(`[${connectionId}]    Call SID: ${callSid}`);
          console.log(`[${connectionId}]    Account: ${accountSid}`);
          console.log(`[${connectionId}]    From: ${from} → To: ${to}`);
          console.log(`[${connectionId}]    Format: ${mediaFormat.encoding} @ ${mediaFormat.sample_rate}Hz`);
          break;

        case 'media':
          const mediaData = data.media || {};
          const payload = mediaData.payload || '';
          const chunk = mediaData.chunk || 'N/A';
          const timestamp = mediaData.timestamp || 'N/A';
          mediaCount++;

          console.log(`[${connectionId}] 🎵 MEDIA #${mediaCount} - Chunk ${chunk}, ${payload.length} bytes, ts=${timestamp}`);

          // IMMEDIATE ECHO: Send the same audio back
          const echoResponse = {
            event: 'media',
            stream_sid: streamSid,
            media: {
              payload: payload  // Echo back exactly what we received
            }
          };

          ws.send(JSON.stringify(echoResponse));
          console.log(`[${connectionId}] 🔊 ECHO sent - ${payload.length} bytes`);
          break;

        case 'mark':
          const markData = data.mark || {};
          const markName = markData.name || 'unknown';

          console.log(`[${connectionId}] 📍 MARK EVENT - ${markName}`);

          // Acknowledge mark event
          const markResponse = {
            event: 'mark',
            stream_sid: streamSid,
            mark: {
              name: markName
            }
          };

          ws.send(JSON.stringify(markResponse));
          console.log(`[${connectionId}] ✅ MARK acknowledged`);
          break;

        case 'dtmf':
          const dtmfData = data.dtmf || {};
          const digit = dtmfData.digit || 'unknown';
          const duration = dtmfData.duration || 'N/A';

          console.log(`[${connectionId}] 🔢 DTMF EVENT - Digit: ${digit}, Duration: ${duration}ms`);

          // Acknowledge DTMF
          const dtmfResponse = {
            event: 'dtmf',
            stream_sid: streamSid,
            dtmf: {
              digit: digit,
              duration: duration
            }
          };

          ws.send(JSON.stringify(dtmfResponse));
          console.log(`[${connectionId}] ✅ DTMF acknowledged`);
          break;

        case 'clear':
          console.log(`[${connectionId}] 🧹 CLEAR EVENT - Stop playback`);

          // Acknowledge clear
          const clearResponse = {
            event: 'clear',
            stream_sid: streamSid
          };

          ws.send(JSON.stringify(clearResponse));
          console.log(`[${connectionId}] ✅ CLEAR acknowledged`);
          break;

        case 'stop':
          const stopData = data.stop || {};
          const reason = stopData.reason || 'unknown';

          console.log(`[${connectionId}] 🛑 STOP EVENT - Reason: ${reason}`);
          console.log(`[${connectionId}] 📊 Total media packets: ${mediaCount}`);
          break;

        default:
          console.log(`[${connectionId}] ❓ Unknown event: ${event}`);
          console.log(`[${connectionId}] Data: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error(`[${connectionId}] ❌ Error processing message:`, error.message);
      console.error(`[${connectionId}] Raw message:`, message.toString());
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`[${connectionId}] 👋 Connection closed`);
    console.log(`[${connectionId}]    Code: ${code}`);
    console.log(`[${connectionId}]    Reason: ${reason || 'none'}`);
    console.log(`[${connectionId}]    Media packets received: ${mediaCount}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[${connectionId}] ❌ WebSocket error:`, error.message);
  });

  // Send initial connected acknowledgment (not in docs but helps debug)
  console.log(`[${connectionId}] ✅ Connection established, waiting for events...`);
});

// Start server
server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`\n✅ Exotel Passthrough Echo Server running!`);
  console.log(`   WebSocket URL: ws://34.143.154.188:${WS_PORT}`);
  console.log(`   Health Check: http://34.143.154.188:${WS_PORT}/health`);
  console.log(`\n📞 Configure in Exotel VoiceBot applet:`);
  console.log(`   ws://34.143.154.188:${WS_PORT}`);
  console.log(`   (Default sample rate: 8000 Hz)`);
  console.log(`\n🔍 Waiting for Exotel connections...\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Passthrough] Shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('[Passthrough] Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n[Passthrough] Caught SIGINT, shutting down...');
  wss.close(() => {
    server.close(() => {
      console.log('[Passthrough] Server closed');
      process.exit(0);
    });
  });
});
