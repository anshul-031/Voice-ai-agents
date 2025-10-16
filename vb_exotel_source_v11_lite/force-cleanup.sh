#!/bin/bash

# Force cleanup all processes on ports 8009 (Next.js) and 8765 (WebSocket)
# This is needed when PM2 restart fails to clean up properly

echo "🧹 Force Cleanup - Killing ALL processes on ports 8009 and 8765"
echo "================================================================"

# Function to kill processes on a specific port
kill_port() {
  local port=$1
  echo ""
  echo "Checking port $port..."
  
  # Find all PIDs using the port
  pids=$(lsof -ti:$port 2>/dev/null)
  
  if [ -z "$pids" ]; then
    echo "✅ Port $port is already free"
    return 0
  fi
  
  echo "Found processes on port $port: $pids"
  
  # Try graceful kill first
  echo "Attempting graceful shutdown (SIGTERM)..."
  for pid in $pids; do
    kill -15 $pid 2>/dev/null && echo "  Sent SIGTERM to PID $pid"
  done
  
  # Wait 2 seconds
  sleep 2
  
  # Check if still running
  pids=$(lsof -ti:$port 2>/dev/null)
  
  if [ -z "$pids" ]; then
    echo "✅ Port $port is now free"
    return 0
  fi
  
  # Force kill if still running
  echo "Processes still running. Force killing (SIGKILL)..."
  for pid in $pids; do
    kill -9 $pid 2>/dev/null && echo "  Sent SIGKILL to PID $pid"
  done
  
  # Wait 1 second
  sleep 1
  
  # Final check
  pids=$(lsof -ti:$port 2>/dev/null)
  
  if [ -z "$pids" ]; then
    echo "✅ Port $port is now free"
    return 0
  else
    echo "❌ ERROR: Could not free port $port. Processes still running: $pids"
    return 1
  fi
}

# Stop PM2 first
echo ""
echo "Step 1: Stopping PM2 processes..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
echo "✅ PM2 processes stopped and deleted"

# Kill port 8009 (Next.js)
kill_port 8009

# Kill port 8765 (WebSocket)
kill_port 8765

## Note: HTTP passthrough is served by Next.js on 8009; no separate 8080 service

# Final verification
echo ""
echo "================================================================"
echo "Final Verification:"
echo "================================================================"

port_8009=$(lsof -ti:8009 2>/dev/null)
port_8765=$(lsof -ti:8765 2>/dev/null)

if [ -z "$port_8009" ] && [ -z "$port_8765" ]; then
  echo "✅ SUCCESS: Ports 8009 and 8765 are free!"
  echo ""
  echo "You can now run: bash deploy.sh"
  exit 0
else
  echo "❌ FAILED: Some ports are still in use"
  [ -n "$port_8009" ] && echo "  Port 8009 still in use by: $port_8009"
  [ -n "$port_8765" ] && echo "  Port 8765 still in use by: $port_8765"
  echo ""
  echo "Try rebooting the VM: sudo reboot"
  exit 1
fi
