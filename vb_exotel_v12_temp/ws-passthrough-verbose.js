/**
 * Enhanced Passthrough WebSocket Echo Server for Exotel
 * 
 * ULTRA-VERBOSE logging to debug call disconnections
 * Logs every single event, byte, and state change
 * 
 * Usage: node ws-passthrough-verbose.js
 * URL: ws://34.143.154.188:8765
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_PORT = 8765;
const LOG_FILE = path.join(__dirname, 'exotel-verbose.log');

// Ensure log file exists (PM2 sometimes sets a different CWD)
try {
  fs.closeSync(fs.openSync(LOG_FILE, 'a'));
} catch (e) {
  // If creation fails, we'll still try to log to console
}

// Utility: Log to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${message}`;
  console.log(logLine);
  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n');
  } catch (e) {
    // Avoid hard-crash if file path is unavailable
  }
}

log('='.repeat(80));
log('🚀 ENHANCED EXOTEL PASSTHROUGH ECHO SERVER STARTING');
log('='.repeat(80));

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  log(`[HTTP] ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const health = { 
      status: 'ok', 
      service: 'exotel-passthrough-verbose', 
      mode: 'echo',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    res.end(JSON.stringify(health, null, 2));
    log(`[HTTP] Health check responded: ${JSON.stringify(health)}`);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Exotel Passthrough Echo Server (Verbose Mode)\n');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true,
  handleProtocols: (protocols, request) => {
    try {
      log(`[UPGRADE] Requested subprotocols: ${JSON.stringify(protocols)}`);
    } catch {}
    // Prefer Exotel's protocol if offered
    const preferred = protocols && (protocols.includes('exotel-stream') ? 'exotel-stream' : protocols[0]);
    if (preferred) {
      log(`[UPGRADE] Selected subprotocol: ${preferred}`);
      return preferred;
    }
    // No subprotocols requested
    return false;
  }
});

log(`[SERVER] WebSocket server created`);

// Log incoming upgrade (WebSocket handshake) attempts for deeper diagnostics
server.on('upgrade', (req, socket, head) => {
  try {
    const remoteIP = req.socket.remoteAddress;
    const remotePort = req.socket.remotePort;
    log(`[UPGRADE] WebSocket handshake requested: ${req.method} ${req.url} from ${remoteIP}:${remotePort}`);
    log(`[UPGRADE] Headers: ${JSON.stringify(req.headers)}`);
  } catch (e) {
    log(`[UPGRADE] Error logging upgrade: ${e.message}`);
  }
});

// Track all connections
let connectionCounter = 0;
const activeConnections = new Map();

wss.on('listening', () => {
  log(`[SERVER] ✅ Server listening on port ${WS_PORT}`);
  log(`[SERVER] WebSocket URL: ws://34.143.154.188:${WS_PORT}`);
  log(`[SERVER] Health Check: http://34.143.154.188:${WS_PORT}/health`);
  log(`[SERVER] Log file: ${LOG_FILE}`);
  log('[SERVER] 🔍 Waiting for Exotel connections...');
  log('='.repeat(80));
});

wss.on('error', (error) => {
  log(`[SERVER] ❌ ERROR: ${error.message}`);
  log(`[SERVER] Error stack: ${error.stack}`);
});

// Log response headers just before they are sent (handshake stage)
wss.on('headers', (headers, req) => {
  try {
    log(`[UPGRADE] Response headers: ${JSON.stringify(headers)}`);
  } catch {}
});

wss.on('connection', (ws, req) => {
  connectionCounter++;
  const connectionId = `CONN_${connectionCounter}_${Date.now()}`;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const remoteIP = req.socket.remoteAddress;
  const remotePort = req.socket.remotePort;
  
  log('\n' + '='.repeat(80));
  log(`[${connectionId}] 🎉🎉🎉 NEW WEBSOCKET CONNECTION`);
  log(`[${connectionId}] Remote: ${remoteIP}:${remotePort}`);
  log(`[${connectionId}] URL: ${req.url}`);
  log(`[${connectionId}] Headers: ${JSON.stringify(req.headers)}`);
  log('='.repeat(80));

  // Connection state
  const connState = {
    id: connectionId,
    startTime: new Date(),
    remoteIP,
    remotePort,
    streamSid: null,
    callSid: null,
    accountSid: null,
    from: null,
    to: null,
    mediaCount: 0,
    echoCount: 0,
    dtmfCount: 0,
    markCount: 0,
    lastActivity: new Date()
  };

  activeConnections.set(connectionId, connState);

  // Log current state
  log(`[${connectionId}] Active connections: ${activeConnections.size}`);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      connState.lastActivity = new Date();
      const messageStr = message.toString();
      
      log(`[${connectionId}] 📨 RAW MESSAGE (${messageStr.length} bytes): ${messageStr}`);

      const data = JSON.parse(messageStr);
      const event = data.event;

      log(`[${connectionId}] 📋 PARSED EVENT: ${event}`);
      log(`[${connectionId}] 📋 FULL DATA: ${JSON.stringify(data, null, 2)}`);

      switch (event) {
        case 'connected':
          log(`[${connectionId}] ✅✅✅ CONNECTED EVENT RECEIVED`);
          log(`[${connectionId}] Protocol: ${data.protocol || 'unknown'}`);
          log(`[${connectionId}] Version: ${data.version || 'unknown'}`);
          
          // Send acknowledgment (optional)
          const connectedAck = {
            event: 'connected',
            protocol: 'exotel-stream',
            version: '1.0'
          };
          ws.send(JSON.stringify(connectedAck));
          log(`[${connectionId}] 📤 Sent connected acknowledgment`);
          break;

        case 'start':
          connState.streamSid = data.stream_sid;
          const startData = data.start || {};
          connState.callSid = startData.call_sid || 'unknown';
          connState.accountSid = startData.account_sid || 'unknown';
          connState.from = startData.from || 'unknown';
          connState.to = startData.to || 'unknown';
          const mediaFormat = startData.media_format || {};
          const customParams = startData.custom_parameters || {};

          log(`[${connectionId}] 🚀🚀🚀 START EVENT RECEIVED`);
          log(`[${connectionId}]    📞 Call Details:`);
          log(`[${connectionId}]       Stream SID: ${connState.streamSid}`);
          log(`[${connectionId}]       Call SID: ${connState.callSid}`);
          log(`[${connectionId}]       Account SID: ${connState.accountSid}`);
          log(`[${connectionId}]       From: ${connState.from}`);
          log(`[${connectionId}]       To: ${connState.to}`);
          log(`[${connectionId}]    🎵 Media Format:`);
          log(`[${connectionId}]       Encoding: ${mediaFormat.encoding || 'unknown'}`);
          log(`[${connectionId}]       Sample Rate: ${mediaFormat.sample_rate || 'unknown'} Hz`);
          log(`[${connectionId}]       Channels: ${mediaFormat.channels || 'unknown'}`);
          log(`[${connectionId}]    ⚙️ Custom Parameters: ${JSON.stringify(customParams)}`);
          
          // Send start acknowledgment
          const startAck = {
            event: 'start',
            stream_sid: connState.streamSid,
            status: 'ready'
          };
          ws.send(JSON.stringify(startAck));
          log(`[${connectionId}] 📤 Sent start acknowledgment`);
          break;

        case 'media':
          connState.mediaCount++;
          const mediaData = data.media || {};
          const payload = mediaData.payload || '';
          const chunk = mediaData.chunk || 'N/A';
          const timestamp = mediaData.timestamp || 'N/A';
          const sequenceNumber = data.sequence_number || 'N/A';

          log(`[${connectionId}] 🎵 MEDIA PACKET #${connState.mediaCount}`);
          log(`[${connectionId}]    Sequence: ${sequenceNumber}`);
          log(`[${connectionId}]    Chunk: ${chunk}`);
          log(`[${connectionId}]    Timestamp: ${timestamp}`);
          log(`[${connectionId}]    Payload size: ${payload.length} bytes`);
          log(`[${connectionId}]    Payload preview: ${payload.substring(0, 50)}...`);

          // IMMEDIATE ECHO: Send the same audio back
          connState.echoCount++;
          const echoResponse = {
            event: 'media',
            stream_sid: connState.streamSid,
            media: {
              payload: payload
            }
          };

          ws.send(JSON.stringify(echoResponse));
          log(`[${connectionId}] 🔊 ECHO #${connState.echoCount} sent - ${payload.length} bytes`);
          break;

        case 'mark':
          connState.markCount++;
          const markData = data.mark || {};
          const markName = markData.name || 'unknown';

          log(`[${connectionId}] 📍 MARK EVENT #${connState.markCount}`);
          log(`[${connectionId}]    Name: ${markName}`);

          // Acknowledge mark event
          const markResponse = {
            event: 'mark',
            stream_sid: connState.streamSid,
            mark: {
              name: markName
            }
          };

          ws.send(JSON.stringify(markResponse));
          log(`[${connectionId}] ✅ MARK acknowledged`);
          break;

        case 'dtmf':
          connState.dtmfCount++;
          const dtmfData = data.dtmf || {};
          const digit = dtmfData.digit || 'unknown';
          const duration = dtmfData.duration || 'N/A';

          log(`[${connectionId}] 🔢 DTMF EVENT #${connState.dtmfCount}`);
          log(`[${connectionId}]    Digit: ${digit}`);
          log(`[${connectionId}]    Duration: ${duration}ms`);

          // Acknowledge DTMF
          const dtmfResponse = {
            event: 'dtmf',
            stream_sid: connState.streamSid,
            dtmf: {
              digit: digit,
              duration: duration
            }
          };

          ws.send(JSON.stringify(dtmfResponse));
          log(`[${connectionId}] ✅ DTMF acknowledged`);
          break;

        case 'clear':
          log(`[${connectionId}] 🧹 CLEAR EVENT - Stop playback requested`);

          // Acknowledge clear
          const clearResponse = {
            event: 'clear',
            stream_sid: connState.streamSid
          };

          ws.send(JSON.stringify(clearResponse));
          log(`[${connectionId}] ✅ CLEAR acknowledged`);
          break;

        case 'stop':
          log(`[${connectionId}] 🛑 STOP EVENT - Call ending`);
          log(`[${connectionId}] 📊 Session Statistics:`);
          log(`[${connectionId}]    Duration: ${(Date.now() - connState.startTime.getTime()) / 1000}s`);
          log(`[${connectionId}]    Media packets: ${connState.mediaCount}`);
          log(`[${connectionId}]    Echo responses: ${connState.echoCount}`);
          log(`[${connectionId}]    DTMF events: ${connState.dtmfCount}`);
          log(`[${connectionId}]    Mark events: ${connState.markCount}`);

          // Acknowledge stop
          const stopResponse = {
            event: 'stop',
            stream_sid: connState.streamSid
          };

          ws.send(JSON.stringify(stopResponse));
          log(`[${connectionId}] ✅ STOP acknowledged`);
          break;

        default:
          log(`[${connectionId}] ⚠️ UNKNOWN EVENT: ${event}`);
          log(`[${connectionId}] Raw data: ${JSON.stringify(data)}`);
          break;
      }
    } catch (error) {
      log(`[${connectionId}] ❌ MESSAGE ERROR: ${error.message}`);
      log(`[${connectionId}] Error stack: ${error.stack}`);
      log(`[${connectionId}] Raw message: ${message.toString()}`);
    }
  });

  // Handle connection close
  ws.on('close', (code, reason) => {
    const duration = (Date.now() - connState.startTime.getTime()) / 1000;
    log('\n' + '='.repeat(80));
    log(`[${connectionId}] 🔌 CONNECTION CLOSED`);
    log(`[${connectionId}] Code: ${code}`);
    log(`[${connectionId}] Reason: ${reason || 'No reason provided'}`);
    log(`[${connectionId}] Duration: ${duration}s`);
    log(`[${connectionId}] 📊 Final Statistics:`);
    log(`[${connectionId}]    Call SID: ${connState.callSid}`);
    log(`[${connectionId}]    From: ${connState.from} → To: ${connState.to}`);
    log(`[${connectionId}]    Media packets: ${connState.mediaCount}`);
    log(`[${connectionId}]    Echo responses: ${connState.echoCount}`);
    log(`[${connectionId}]    DTMF events: ${connState.dtmfCount}`);
    log(`[${connectionId}]    Mark events: ${connState.markCount}`);
    log('='.repeat(80));

    activeConnections.delete(connectionId);
    log(`[SERVER] Active connections: ${activeConnections.size}`);
  });

  // Handle connection errors
  ws.on('error', (error) => {
    log(`[${connectionId}] ❌ WEBSOCKET ERROR: ${error.message}`);
    log(`[${connectionId}] Error stack: ${error.stack}`);
  });

  // Handle pong (keepalive)
  ws.on('pong', () => {
    connState.lastActivity = new Date();
    log(`[${connectionId}] 💓 PONG received (keepalive)`);
  });
});

// Start server
server.listen(WS_PORT, '0.0.0.0', () => {
  log(`[SERVER] HTTP server bound to 0.0.0.0:${WS_PORT}`);
});

// Keepalive ping every 30 seconds
setInterval(() => {
  log(`[SERVER] 💓 Keepalive check - Active connections: ${activeConnections.size}`);
  
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);

// Error handlers
process.on('uncaughtException', (error) => {
  log(`[PROCESS] ❌ UNCAUGHT EXCEPTION: ${error.message}`);
  log(`[PROCESS] Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`[PROCESS] ❌ UNHANDLED REJECTION: ${reason}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('[PROCESS] 🛑 SIGTERM received - shutting down gracefully');
  server.close(() => {
    log('[PROCESS] ✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('[PROCESS] 🛑 SIGINT received - shutting down gracefully');
  server.close(() => {
    log('[PROCESS] ✅ Server closed');
    process.exit(0);
  });
});
