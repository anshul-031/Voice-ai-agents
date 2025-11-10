#!/bin/bash

echo "🔍 Exotel Connection Diagnostic Tool"
echo "===================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3000/api/config-status > /dev/null 2>&1; then
    echo "   ✅ Server is running on localhost:3000"
else
    echo "   ❌ Server is NOT running!"
    echo "   → Please run: npm run dev"
    exit 1
fi
echo ""

# Get phone numbers from API
echo "2. Fetching phone numbers from database..."
PHONE_RESPONSE=$(curl -s http://localhost:3000/api/phone-numbers?userId=mukul)
echo "$PHONE_RESPONSE" | jq '.' 2>/dev/null || echo "$PHONE_RESPONSE"
echo ""

# Extract webhook URLs
echo "3. Extracting webhook URLs..."
WEBHOOK_URLS=$(echo "$PHONE_RESPONSE" | jq -r '.phoneNumbers[].webhookUrl' 2>/dev/null)

if [ -z "$WEBHOOK_URLS" ]; then
    echo "   ❌ No phone numbers found in database!"
    echo "   → Go to Dashboard → Phone Numbers → Add Phone Number"
    exit 1
fi

echo "   Found webhook URLs:"
echo "$WEBHOOK_URLS" | while read url; do
    echo "   - $url"
done
echo ""

# Test each webhook
echo "4. Testing webhooks..."
echo "$WEBHOOK_URLS" | while read url; do
    if [ ! -z "$url" ]; then
        PHONE_ID=$(echo "$url" | sed 's/.*webhook\///')
        echo "   Testing: $PHONE_ID"
        
        # Test GET
        GET_RESPONSE=$(curl -s "$url")
        if echo "$GET_RESPONSE" | grep -q "active"; then
            echo "   ✅ GET request works"
        else
            echo "   ❌ GET request failed"
        fi
        
        # Test POST (simulate Exotel call)
        POST_RESPONSE=$(curl -s -X POST "$url" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "CallSid=diagnostic_test_$(date +%s)" \
            -d "From=919876543210" \
            -d "To=919999999999" \
            -d "Status=in-progress" \
            -d "Direction=inbound")
        
        if echo "$POST_RESPONSE" | grep -q "<?xml"; then
            echo "   ✅ POST request works - XML response:"
            echo "$POST_RESPONSE" | head -5 | sed 's/^/      /'
            
            if echo "$POST_RESPONSE" | grep -q "error"; then
                echo "   ⚠️  Response contains error"
            fi
        else
            echo "   ❌ POST request failed"
            echo "      Response: $POST_RESPONSE"
        fi
        echo ""
    fi
done

echo ""
echo "5. Checking Exotel Configuration Requirements"
echo "----------------------------------------------"
echo ""
echo "For Exotel to work, you need:"
echo ""
echo "✓ Server must be publicly accessible (not just localhost)"
echo "  → Use ngrok or deploy to a server"
echo ""
echo "✓ In Exotel Dashboard, set Answer URL to your webhook:"
echo "  → Settings → Phone Numbers → [Your Number]"
echo "  → Answer URL: [Your webhook URL from above]"
echo "  → Method: POST"
echo ""
echo "✓ Your webhook URL must be HTTPS (Exotel requires SSL)"
echo "  → http://localhost:3000/... will NOT work from Exotel"
echo "  → You need: https://your-domain.com/..."
echo ""
echo ""
echo "6. Next Steps"
echo "-------------"
echo "If localhost tests work but real calls don't:"
echo ""
echo "Option A: Use ngrok for testing"
echo "  1. Install: npm install -g ngrok"
echo "  2. Run: ngrok http 3000"
echo "  3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
echo "  4. In Exotel, set Answer URL to:"
echo "     https://abc123.ngrok.io/api/telephony/webhook/[phone_id]"
echo ""
echo "Option B: Deploy to production"
echo "  1. Deploy your app to Vercel/Netlify/Railway etc."
echo "  2. Use the production HTTPS URL in Exotel"
echo ""
echo "Need more help? Check EXOTEL_TROUBLESHOOTING.md"
