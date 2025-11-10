#!/bin/bash

# 🔧 Quick Fix for Exotel 401 Error
# This script helps you set up ngrok and update your webhook URL

echo "🔍 Exotel 401 Error - Quick Diagnosis & Fix"
echo "=========================================="
echo ""

# Check if server is running
if curl -s http://localhost:3000/api/config-status > /dev/null 2>&1 ; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is NOT running on port 3000"
    echo "   Run: npm run dev"
    echo ""
    exit 1
fi

# Check current webhook URL
echo ""
echo "📋 Current Configuration:"
echo ""
WEBHOOK_URL=$(curl -s http://localhost:3000/api/phone-numbers?userId=mukul | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['phoneNumbers'][0]['webhookUrl'])" 2>/dev/null)
echo "   Webhook URL: $WEBHOOK_URL"

if [[ "$WEBHOOK_URL" == http://localhost:3000/* ]] || [[ "$WEBHOOK_URL" == *localhost* ]]; then
    echo ""
    echo "❌ PROBLEM FOUND: Your webhook URL uses 'localhost'"
    echo "   Exotel CANNOT reach localhost - it's only accessible on your computer!"
    echo ""
    echo "🔧 SOLUTION: Use ngrok to create a public URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  STEP-BY-STEP FIX"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Check if ngrok is installed
    if command -v ngrok &> /dev/null; then
        echo "✅ ngrok is installed"
        echo ""
        echo "1️⃣  Start ngrok (in a NEW terminal):"
        echo "    ngrok http 3000"
        echo ""
        echo "2️⃣  Copy the HTTPS URL from ngrok output"
        echo "    Example: https://abc123.ngrok-free.app"
        echo ""
        echo "3️⃣  Update .env.local with ngrok URL:"
        echo "    NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app/"
        echo ""
        echo "4️⃣  Restart your server:"
        echo "    Ctrl+C (stop server)"
        echo "    npm run dev"
        echo ""
        echo "5️⃣  Get your new webhook URL:"
        echo "    curl http://localhost:3000/api/phone-numbers?userId=mukul | jq -r '.phoneNumbers[0].webhookUrl'"
        echo ""
        echo "6️⃣  Update Exotel Dashboard:"
        echo "    - Go to: https://my.exotel.com"
        echo "    - Settings → Phone Numbers → 08047359585"
        echo "    - Update Answer URL with your ngrok webhook URL"
        echo "    - Method: POST"
        echo "    - Save"
        echo ""
        echo "7️⃣  Test by calling 08047359585"
        echo ""
    else
        echo "❌ ngrok is NOT installed"
        echo ""
        echo "   Install ngrok:"
        echo "   npm install -g ngrok"
        echo ""
        echo "   Then follow steps 1-7 above"
        echo ""
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 For detailed guide, see: NGROK_SETUP.md"
    echo ""
    
elif [[ "$WEBHOOK_URL" == https://*.vercel.app/* ]]; then
    echo ""
    echo "✅ Webhook URL uses Vercel (public URL)"
    echo ""
    echo "🔍 Checking if Exotel can reach it..."
    echo ""
    
    # Test if the webhook is accessible
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "CallSid=test&From=919999999999&To=08047359585" 2>&1)
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Webhook is accessible and returns 200"
        echo ""
        echo "🔧 The 401 error is likely from Exotel configuration:"
        echo ""
        echo "1️⃣  Check Exotel Dashboard Answer URL:"
        echo "    - Go to: https://my.exotel.com"
        echo "    - Settings → Phone Numbers → 08047359585"
        echo "    - Verify Answer URL matches: $WEBHOOK_URL"
        echo "    - Verify Method is: POST"
        echo "    - Save if changed"
        echo ""
        echo "2️⃣  Check if HTTP Basic Auth is configured:"
        echo "    - Some Exotel setups require username/password"
        echo "    - If yes, you need to modify the webhook to accept auth"
        echo ""
        echo "3️⃣  Check Exotel logs:"
        echo "    - Go to Exotel Dashboard → Logs"
        echo "    - Look for webhook call attempts"
        echo "    - Check the exact error message"
        echo ""
    else
        echo "❌ Webhook returned: $RESPONSE"
        echo "   Expected: 200"
        echo ""
        echo "   This webhook may not be deployed correctly"
        echo "   Check your Vercel deployment"
        echo ""
    fi
    
elif [[ "$WEBHOOK_URL" == https://*.ngrok-free.app/* ]] || [[ "$WEBHOOK_URL" == https://*.ngrok.io/* ]]; then
    echo ""
    echo "✅ Webhook URL uses ngrok (public URL)"
    echo ""
    echo "🔍 Checking if ngrok is running..."
    
    # Test if ngrok is accessible
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" 2>&1)
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "405" ]; then
        echo "✅ ngrok URL is accessible"
        echo ""
        echo "🔧 Next steps:"
        echo ""
        echo "1️⃣  Verify Exotel Dashboard Answer URL:"
        echo "    - Go to: https://my.exotel.com"
        echo "    - Settings → Phone Numbers → 08047359585"
        echo "    - Answer URL should be: $WEBHOOK_URL"
        echo "    - Method: POST"
        echo "    - Save"
        echo ""
        echo "2️⃣  Test by calling 08047359585"
        echo ""
        echo "3️⃣  Watch logs in your terminal for webhook hits"
        echo ""
    else
        echo "❌ ngrok URL is NOT accessible (response: $RESPONSE)"
        echo ""
        echo "   Is ngrok still running?"
        echo "   Check the terminal where you ran: ngrok http 3000"
        echo ""
        echo "   If not, start it again and update .env.local"
        echo ""
    fi
    
else
    echo ""
    echo "✅ Webhook URL uses custom domain"
    echo "   URL: $WEBHOOK_URL"
    echo ""
    echo "   Make sure this URL is publicly accessible from Exotel servers"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COMMON CAUSES OF 401 ERROR FROM EXOTEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Webhook URL is localhost (not accessible from internet)"
echo "2. Webhook URL in Exotel Dashboard doesn't match actual URL"
echo "3. Exotel configured with HTTP Basic Auth (username/password required)"
echo "4. Server/ngrok is down or not accessible"
echo "5. Firewall blocking Exotel's IP addresses"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
