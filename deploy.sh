#!/bin/bash
# Complete Deployment Script for Exotel WebSocket Server
# This script deploys the entire vb_exotel project

echo "🚀 Exotel VB Project - Complete Deployment"
echo "=========================================="

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found!"
  echo "Please run this script from the vb_exotel directory"
  exit 1
fi

# Step 2: Stop all PM2 processes
echo ""
echo "Step 1: Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || true

# Wait for processes to stop
sleep 2

# Step 3: Delete PM2 processes
echo ""
echo "Step 2: Deleting PM2 processes..."
pm2 delete all 2>/dev/null || true

# Wait for cleanup
sleep 2

# Step 4: Kill any zombie node processes on port 8765
echo ""
echo "Step 3: Cleaning up zombie processes on port 8765..."
PORT_PIDS=$(sudo lsof -t -i:8765 2>/dev/null)

if [ -n "$PORT_PIDS" ]; then
  echo "Found processes holding port 8765: $PORT_PIDS"
  sudo kill -9 $PORT_PIDS
  echo "✅ Killed zombie processes"
  sleep 1
else
  echo "✅ Port 8765 is clean"
fi

# Step 5: Verify port is free
echo ""
echo "Step 4: Verifying port 8765 is free..."
if sudo netstat -tulpn | grep -q 8765; then
  echo "❌ Port 8765 is still in use!"
  sudo netstat -tulpn | grep 8765
  echo ""
  echo "Please manually kill the process and run this script again."
  exit 1
else
  echo "✅ Port 8765 is available"
fi

## Note: HTTP passthrough is served by Next.js API on port 8009; no separate 8080 service

# Step 6: Install/update dependencies
echo ""
echo "Step 5: Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Step 7: Build Next.js project
echo ""
echo "Step 6: Building Next.js project..."
if [ ! -d ".next" ]; then
  echo "Building project..."
  npm run build
else
  echo "✅ Project already built"
fi

# Step 8: Start Next.js API server
echo ""
echo "Step 7: Starting Next.js API server on port 8009..."
# If something is already listening on 8009, skip starting another instance
if sudo lsof -ti:8009 >/dev/null 2>&1; then
  echo "Detected an existing process on port 8009. Skipping PM2 start for nextjs-api."
else
  pm2 start npm --name "nextjs-api" -- run start:8009
fi

# Wait for Next.js to start
sleep 3

# Step 9: Start WebSocket server (prefer full pipeline; fallback to verbose echo)
echo ""
echo "Step 8: Starting WebSocket server..."
touch exotel-verbose.log 2>/dev/null || true
if [ -f "ws-server.js" ]; then
  echo "Using FULL PIPELINE server (STT → LLM → TTS)..."
  pm2 start ws-server.js --name "exotel-ws" --time
elif [ -f "ws-passthrough-verbose.js" ]; then
  echo "Using VERBOSE passthrough echo server (ultra-detailed logging)..."
  pm2 start ws-passthrough-verbose.js --name "exotel-ws" --time
else
  echo "Using standard passthrough echo server..."
  pm2 start ws-passthrough.js --name "exotel-ws" --time
fi

# Wait for WS server to start
sleep 2

# Step 9: Check status
echo ""
echo "Step 9: Checking PM2 status..."
pm2 status

echo ""
echo "Step 10: Checking recent logs..."
pm2 logs --lines 10 --nostream

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo ""
echo "WebSocket URL for Exotel:"
echo "ws://34.143.154.188:8765"
echo "(Uses default sample rate: 8000 Hz)"
echo ""
echo "HTTP Passthru (Next.js API on 8009):"
echo "POST http://34.143.154.188:8009/api/exotel/passthru            (Static; returns { ok: true })"
echo ""
echo "Monitor logs with:"
echo "  pm2 logs exotel-ws"
echo "  pm2 logs nextjs-api"
echo ""
echo "Health check:"
echo "  curl http://34.143.154.188:8765/health"
echo "=========================================="
