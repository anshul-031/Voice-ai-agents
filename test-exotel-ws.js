#!/usr/bin/env node
/**
 * Test script to simulate Exotel WebSocket connection and events
 * Tests the complete STT -> LLM -> TTS pipeline
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_URL = process.env.WS_URL || 'ws://localhost:3000/api/exotel/ws-static?sample-rate=8000&CallSid=test123&From=+919999999999&To=+918888888888';
const TEST_TIMEOUT = 60000; // 60 seconds

// ANSI colors for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, label, ...args) {
  console.log(`${color}[${label}]${colors.reset}`, ...args);
}

function generateTestAudioBase64() {
  // Generate a simple PCM16LE mono audio (silence)
  // In real scenario, this would be actual speech audio from Exotel
  const sampleRate = 8000;
  const durationMs = 100; // 100ms chunk
  const samplesCount = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = Buffer.alloc(samplesCount * 2); // 16-bit = 2 bytes per sample
  
  // Fill with some varying values (simulated audio)
  for (let i = 0; i < samplesCount; i++) {
    const sample = Math.floor(Math.sin(i * 0.1) * 1000); // Simple sine wave
    buffer.writeInt16LE(sample, i * 2);
  }
  
  return buffer.toString('base64');
}

async function testExotelWebSocket() {
  log(colors.cyan, 'TEST', 'Starting Exotel WebSocket test');
  log(colors.blue, 'INFO', 'Target URL:', WS_URL);

  const results = {
    connected: false,
    startReceived: false,
    mediaChunksSent: 0,
    mediaResponsesReceived: 0,
    errors: [],
    warnings: [],
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      log(colors.red, 'ERROR', 'Test timeout after', TEST_TIMEOUT / 1000, 'seconds');
      results.errors.push('Test timeout');
      ws.close();
      resolve(results);
    }, TEST_TIMEOUT);

    log(colors.blue, 'INFO', 'Connecting to WebSocket...');
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      log(colors.green, 'SUCCESS', 'WebSocket connection established');
      results.connected = true;

      // Wait a bit for the server to send 'connected' event
      setTimeout(() => {
        // Send 'start' event
        log(colors.blue, 'SEND', 'Sending start event...');
        const startEvent = {
          event: 'start',
          sequence_number: 1,
          start: {
            stream_sid: 'test_stream_' + Date.now(),
            account_sid: 'test_account',
            call_sid: 'test123',
          },
        };
        ws.send(JSON.stringify(startEvent));
      }, 500);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        log(colors.cyan, 'RECV', 'Event:', message.event);

        if (message.event === 'connected') {
          log(colors.green, 'SUCCESS', 'Received connected event from server');
        }

        if (message.event === 'mark') {
          const markName = message.mark?.name;
          log(colors.cyan, 'RECV', 'Mark:', markName);
          
          if (markName === 'start-ack') {
            results.startReceived = true;
            log(colors.green, 'SUCCESS', 'Start acknowledged by server');
            
            // Now send some media chunks
            log(colors.blue, 'SEND', 'Sending media chunks...');
            sendMediaChunks(ws, results);
          }
          
          if (markName === 'bot-tts') {
            log(colors.green, 'SUCCESS', 'Bot TTS playback completed!');
            // Test passed - bot responded with audio
            clearTimeout(timeout);
            setTimeout(() => {
              ws.close();
              resolve(results);
            }, 1000);
          }
        }

        if (message.event === 'media') {
          results.mediaResponsesReceived++;
          if (results.mediaResponsesReceived === 1) {
            log(colors.green, 'SUCCESS', 'Received first media response from bot');
          }
        }

        if (message.event === 'clear') {
          log(colors.yellow, 'WARN', 'Server sent clear event (possible error)');
          results.warnings.push('Server sent clear event');
        }
      } catch (err) {
        log(colors.red, 'ERROR', 'Failed to parse message:', err.message);
        results.errors.push('Message parse error: ' + err.message);
      }
    });

    ws.on('error', (err) => {
      log(colors.red, 'ERROR', 'WebSocket error:', err.message);
      results.errors.push('WebSocket error: ' + err.message);
    });

    ws.on('close', (code, reason) => {
      log(colors.yellow, 'INFO', 'WebSocket closed. Code:', code, 'Reason:', reason.toString());
      clearTimeout(timeout);
      
      // Give a moment to ensure all results are captured
      setTimeout(() => resolve(results), 100);
    });

    function sendMediaChunks(ws, results) {
      // Send multiple media chunks to simulate Exotel audio stream
      // Need to send enough audio to trigger processing (~2 seconds at 8kHz)
      const chunksToSend = 30; // Send 30 chunks of ~100ms each = ~3 seconds
      let chunkNum = 0;
      let seqNum = 2;

      const interval = setInterval(() => {
        if (chunkNum >= chunksToSend || ws.readyState !== WebSocket.OPEN) {
          clearInterval(interval);
          log(colors.blue, 'INFO', 'Finished sending', chunkNum, 'media chunks');
          return;
        }

        const mediaEvent = {
          event: 'media',
          sequence_number: seqNum++,
          media: {
            chunk: chunkNum,
            timestamp: Date.now().toString(),
            payload: generateTestAudioBase64(),
          },
        };

        ws.send(JSON.stringify(mediaEvent));
        results.mediaChunksSent++;
        chunkNum++;

        if (chunkNum % 10 === 0) {
          log(colors.blue, 'SEND', 'Sent', chunkNum, 'media chunks...');
        }
      }, 150); // Send a chunk every 150ms
    }
  });
}

// Run the test
(async () => {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, 'TEST', 'EXOTEL WEBSOCKET INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');

  try {
    const results = await testExotelWebSocket();

    console.log('\n' + '='.repeat(60));
    log(colors.cyan, 'RESULTS', 'TEST SUMMARY');
    console.log('='.repeat(60));
    
    log(colors.blue, 'INFO', 'Connected:', results.connected ? colors.green + 'YES' + colors.reset : colors.red + 'NO' + colors.reset);
    log(colors.blue, 'INFO', 'Start Acknowledged:', results.startReceived ? colors.green + 'YES' + colors.reset : colors.red + 'NO' + colors.reset);
    log(colors.blue, 'INFO', 'Media Chunks Sent:', results.mediaChunksSent);
    log(colors.blue, 'INFO', 'Media Responses Received:', results.mediaResponsesReceived);
    
    if (results.warnings.length > 0) {
      log(colors.yellow, 'WARN', 'Warnings:', results.warnings.length);
      results.warnings.forEach(w => log(colors.yellow, 'WARN', '-', w));
    }
    
    if (results.errors.length > 0) {
      log(colors.red, 'ERROR', 'Errors:', results.errors.length);
      results.errors.forEach(e => log(colors.red, 'ERROR', '-', e));
    }

    const success = results.connected && 
                   results.startReceived && 
                   results.mediaChunksSent > 0 && 
                   results.errors.length === 0;

    console.log('\n' + '='.repeat(60));
    if (success) {
      log(colors.green, 'SUCCESS', '✓ All tests passed!');
      console.log('='.repeat(60) + '\n');
      process.exit(0);
    } else {
      log(colors.red, 'FAILED', '✗ Some tests failed');
      console.log('='.repeat(60) + '\n');
      process.exit(1);
    }
  } catch (err) {
    log(colors.red, 'ERROR', 'Test failed with exception:', err);
    process.exit(1);
  }
})();
