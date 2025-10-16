# 🚀 Exotel WebSocket Server - Deployment Package V3

## 📦 What's Included

This package contains the **complete solution** for Exotel WebSocket integration with proper protocol compliance and troubleshooting tools.

### **Core Files:**
1. **`ws-passthrough.js`** - Simple echo server for immediate testing
2. **`ws-server.js`** - Full AI pipeline (STT → LLM → TTS) - *needs fixes*
3. **`restart-clean.sh`** - PM2 cleanup and deployment script
4. **`test-exotel-protocol.js`** - Local protocol compliance test

### **Documentation:**
5. **`RCA_AND_FIX.md`** - Root cause analysis and fix guide
6. **`VM_DEPLOYMENT_FINAL.md`** - This file (deployment instructions)

---

## 🎯 Quick Start (5 Minutes)

### **Step 1: Upload to VM**
```bash
# On your local machine (Windows PowerShell):
scp ws-passthrough.js restart-clean.sh test-exotel-protocol.js RCA_AND_FIX.md mridul_sokhi@34.143.154.188:~/vb_exotel/

# Or manually upload these 4 files to: /home/mridul_sokhi/vb_exotel/
```

### **Step 2: SSH to VM**
```bash
ssh mridul_sokhi@34.143.154.188
cd /home/mridul_sokhi/vb_exotel
```

### **Step 3: Make Script Executable**
```bash
chmod +x restart-clean.sh
```

### **Step 4: Run Clean Restart**
```bash
bash restart-clean.sh
```

**Expected Output:**
```
🧹 Exotel WS Server - Clean Restart Script
==========================================
Step 1: Stopping all PM2 processes...
Step 2: Deleting PM2 processes...
Step 3: Cleaning up zombie processes on port 8765...
✅ Killed zombie processes
Step 4: Verifying port 8765 is free...
✅ Port 8765 is available
Step 5: Starting Next.js API server on port 8009...
Step 6: Starting WebSocket server...
Step 7: Checking PM2 status...
┌────┬──────────────┬─────────┬─────────┬──────┬────────┬
│ id │ name         │ status  │ restart │ cpu  │ memory │
├────┼──────────────┼─────────┼─────────┼──────┼────────┤
│ 0  │ nextjs-api   │ online  │ 0       │ 0%   │ 75mb   │
│ 1  │ exotel-ws    │ online  │ 0       │ 0%   │ 8mb    │
└────┴──────────────┴─────────┴─────────┴──────┴────────┘

✅ Clean restart complete!

WebSocket URL for Exotel:
ws://34.143.154.188:8765?sample-rate=8000
```

### **Step 5: Monitor Logs**
```bash
pm2 logs exotel-ws --lines 50
```

**Expected Logs (Waiting State)**:
```
✅ Exotel Passthrough Echo Server running!
   WebSocket URL: ws://34.143.154.188:8765
   Health Check: http://34.143.154.188:8765/health

📞 Configure in Exotel VoiceBot applet:
   ws://34.143.154.188:8765?sample-rate=8000

🔍 Waiting for Exotel connections...
```

### **Step 6: Configure Exotel**
1. Login to Exotel dashboard
2. Navigate to your flow with **VoiceBot** applet
3. Set URL: `ws://34.143.154.188:8765?sample-rate=8000`
4. Save configuration

### **Step 7: Make Test Call**
Call your Exotel number and watch logs in real-time:

```bash
pm2 logs exotel-ws --lines 100
```

**Expected Logs (During Call)**:
```
[conn_1736800001234] 🔌 WebSocket connected
[conn_1736800001234] Sample rate: 8000 Hz
[conn_1736800001234] Remote IP: 203.0.113.42
[conn_1736800001234] 📨 Received: connected
[conn_1736800001234] 🎉 CONNECTED EVENT
[conn_1736800001234] 📨 Received: start
[conn_1736800001234] 🚀 START EVENT
[conn_1736800001234]    Stream SID: stream_abc123xyz
[conn_1736800001234]    Call SID: call_def456uvw
[conn_1736800001234]    From: +1234567890 → To: +0987654321
[conn_1736800001234]    Format: raw/slin @ 8000Hz
[conn_1736800001234] 📨 Received: media
[conn_1736800001234] 🎵 MEDIA #1 - Chunk 1, 320 bytes, ts=20
[conn_1736800001234] 🔊 ECHO sent - 320 bytes
[conn_1736800001234] 📨 Received: media
[conn_1736800001234] 🎵 MEDIA #2 - Chunk 2, 320 bytes, ts=40
[conn_1736800001234] 🔊 ECHO sent - 320 bytes
...
[conn_1736800001234] 📨 Received: stop
[conn_1736800001234] 🛑 STOP EVENT - Reason: callended
[conn_1736800001234] 📊 Total media packets: 157
[conn_1736800001234] 👋 Connection closed
```

---

## ✅ Success Criteria

### **1. Server Health Check**
```bash
# PM2 status
pm2 status
# Both processes should show "online"

# Port check
sudo netstat -tulpn | grep 8765
# Should show: node process on 0.0.0.0:8765

# HTTP health check
curl http://34.143.154.188:8765/health
# Should return: {"status":"ok","service":"exotel-passthrough","mode":"echo"}
```

### **2. Call Flow Validation**
During test call, logs must show:
- ✅ `🔌 WebSocket connected` - Exotel connected
- ✅ `🚀 START EVENT` with call details
- ✅ `🎵 MEDIA` events (multiple)
- ✅ `🔊 ECHO sent` responses
- ✅ `🛑 STOP EVENT` when call ends

### **3. Audio Verification**
You should **hear your own voice echoed back** during the call with slight delay.

---

## 🔧 Troubleshooting

### **Problem: Port 8765 still in use**
```bash
# Find process
sudo lsof -i :8765

# Kill it
sudo kill -9 <PID>

# Restart
bash restart-clean.sh
```

### **Problem: PM2 shows "errored" status**
```bash
# Check error logs
pm2 logs exotel-ws --err --lines 50

# Common fixes:
# 1. Port conflict → Run restart-clean.sh again
# 2. Module not found → npm install
# 3. Syntax error → Check file integrity
```

### **Problem: No logs during call**
Possible causes:
1. **GCP Firewall**: Port 8765 not opened
   - Open GCP Console → VPC Network → Firewall
   - Create rule: Allow TCP on port 8765 from any IP

2. **Wrong URL**: Check Exotel configuration
   - Must be: `ws://34.143.154.188:8765?sample-rate=8000`
   - NOT `wss://` (no SSL for testing)

3. **Server crashed**: Check PM2 status
   ```bash
   pm2 status
   # If "errored", run restart-clean.sh
   ```

4. **Network issue**: Test connectivity
   ```bash
   curl http://34.143.154.188:8765/health
   # Should return JSON with status:ok
   ```

### **Problem: Call connects but disconnects immediately**
Check logs for:
```bash
pm2 logs exotel-ws --lines 100
```

Look for:
- ❌ Error messages (protocol mismatch)
- ❌ Missing `START EVENT` (Exotel not sending)
- ❌ No `MEDIA` events (audio not flowing)

If you see connection but no START:
- Verify Exotel applet type is **VoiceBot** not Stream
- Check URL format in Exotel (no typos)

---

## 📊 Protocol Compliance Notes

### **Field Names: snake_case vs camelCase**
Exotel uses **snake_case** for all field names:

✅ **CORRECT**:
```javascript
{
  event: "media",
  stream_sid: "stream_abc",    // ← snake_case
  sequence_number: 123,         // ← snake_case
  media: { ... }
}
```

❌ **WRONG**:
```javascript
{
  event: "media",
  streamSid: "stream_abc",      // ← camelCase (WRONG!)
  sequenceNumber: 123,          // ← camelCase (WRONG!)
  media: { ... }
}
```

### **Audio Format**
- **Encoding**: `raw/slin` (PCM16, signed linear)
- **Sample Rate**: 8000 Hz (or 16000/24000)
- **Bit Depth**: 16-bit
- **Endianness**: Little-endian
- **Transport**: Base64 encoded
- **Chunk Size**: ~320 bytes (20ms @ 8kHz)

For passthrough testing, **just echo back the exact payload**:
```javascript
// Receive from Exotel
const payload = data.media.payload;

// Send back to Exotel (no conversion needed)
ws.send(JSON.stringify({
  event: 'media',
  stream_sid: streamSid,
  media: { payload: payload }  // ← Same payload
}));
```

---

## 🧪 Local Testing (Optional)

Before deploying, you can test protocol compliance locally:

### **On Windows (Local Machine)**:
```powershell
# Terminal 1: Start passthrough server
npm run ws:passthrough

# Terminal 2: Run protocol test
npm run ws:test
```

**Expected Test Output**:
```
🧪 Exotel Protocol Compliance Test
=====================================

✅ Connected to WebSocket server

📤 Sending: CONNECTED
📤 Sending: START
📤 Sending: MEDIA_1
📨 Received response for MEDIA_1
✅ MEDIA_1 - PASS

📤 Sending: MEDIA_2
📨 Received response for MEDIA_2
✅ MEDIA_2 - PASS

📤 Sending: MARK
📨 Received response for MARK
✅ MARK - PASS

...

=====================================
📊 Test Results
=====================================
✅ Passed: 5
❌ Failed: 0
📈 Total: 5

🎉 All tests passed! Server is protocol compliant.
```

---

## 📈 Next Steps After Passthrough Works

### **1. Fix Full AI Pipeline** (Optional)
If you need STT → LLM → TTS instead of simple echo:
- Review `RCA_AND_FIX.md` for fixes needed
- Update `ws-server.js` with correct field names
- Test locally before deploying

### **2. Open GCP Firewall**
```bash
# Via gcloud (if you have auth):
gcloud compute firewall-rules create allow-exotel-ws \
  --allow tcp:8765 \
  --source-ranges 0.0.0.0/0 \
  --description "Exotel WebSocket Server"

# Or via GCP Console:
# VPC Network → Firewall → CREATE FIREWALL RULE
# - Name: allow-exotel-ws
# - Direction: Ingress
# - Action: Allow
# - Targets: All instances
# - Source IP ranges: 0.0.0.0/0 (or Exotel IPs only)
# - Protocols: TCP on port 8765
```

### **3. Production Hardening**
- Switch to WSS (secure WebSocket)
- Add authentication (API keys)
- Implement rate limiting
- Set up monitoring/alerts
- Use process manager (PM2 already configured)
- Add logging aggregation
- Configure SSL certificates

---

## 📁 File Structure After Deployment

```
/home/mridul_sokhi/vb_exotel/
├── ws-passthrough.js        ← Simple echo server (USE THIS FIRST)
├── ws-server.js             ← Full AI pipeline (needs fixes)
├── restart-clean.sh         ← Deployment script
├── test-exotel-protocol.js  ← Local test script
├── RCA_AND_FIX.md           ← Troubleshooting guide
├── VM_DEPLOYMENT_FINAL.md   ← This file
├── package.json
├── next.config.ts
├── .env                     ← API keys (keep secure!)
└── ... (other Next.js files)
```

---

## 🆘 Emergency Commands

### **Nuclear Option: Complete Reset**
```bash
# Kill everything
pm2 kill
sudo killall node

# Verify port is free
sudo netstat -tulpn | grep 8765
# Should show nothing

# Start fresh
cd /home/mridul_sokhi/vb_exotel
bash restart-clean.sh
```

### **Check What's Actually Running**
```bash
# All node processes
ps aux | grep node

# Processes on port 8765
sudo lsof -i :8765

# PM2 processes
pm2 list
```

### **Network Debugging**
```bash
# Watch network traffic on port 8765
sudo tcpdump -i any port 8765 -n

# Make test call and watch connection attempts
# You should see SYN/ACK packets if Exotel is connecting
```

### **Real-time Log Monitoring**
```bash
# Follow logs in real-time
pm2 logs exotel-ws

# Or with tail
tail -f /root/.pm2/logs/exotel-ws-out.log
tail -f /root/.pm2/logs/exotel-ws-error.log
```

---

## ✉️ Support

If you encounter issues:
1. Check `RCA_AND_FIX.md` for common problems
2. Review PM2 logs: `pm2 logs exotel-ws --lines 100`
3. Verify server health: `curl http://34.143.154.188:8765/health`
4. Test port availability: `sudo netstat -tulpn | grep 8765`

---

## 📝 Version History

- **V3 (Current)**: Passthrough echo server + protocol fixes
- **V2**: Initial WebSocket server (had protocol issues)
- **V1**: Next.js Edge runtime (doesn't work on VMs)

---

**🎉 You're all set! Make a test call and watch the magic happen!**
