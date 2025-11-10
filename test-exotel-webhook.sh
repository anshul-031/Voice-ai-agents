#!/bin/bash

# Exotel Webhook Testing Script
# This script helps you test your Exotel webhook endpoint

echo "🧪 Exotel Webhook Tester"
echo "========================"
echo ""

# Configuration - UPDATE THESE VALUES
WEBHOOK_URL="${1:-http://localhost:3000/api/telephony/webhook/phone_test_123}"
FROM_NUMBER="919876543210"
TO_NUMBER="919999999999"

echo "📍 Testing webhook: $WEBHOOK_URL"
echo ""

# Test 1: Check if webhook endpoint is accessible
echo "1️⃣  Testing GET request (webhook status check)..."
echo "----------------------------------------------------"
curl -s -X GET "$WEBHOOK_URL" | jq '.' 2>/dev/null || curl -s -X GET "$WEBHOOK_URL"
echo ""
echo ""

# Test 2: Simulate Exotel POST request (form-urlencoded)
echo "2️⃣  Testing POST request (simulated Exotel call)..."
echo "----------------------------------------------------"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test_$(date +%s)" \
  -d "From=$FROM_NUMBER" \
  -d "To=$TO_NUMBER" \
  -d "Status=in-progress" \
  -d "Direction=inbound" \
  -d "CallType=client")

echo "$RESPONSE"
echo ""
echo ""

# Test 3: Check if response is valid XML
echo "3️⃣  Validating XML response..."
echo "----------------------------------------------------"
if echo "$RESPONSE" | grep -q "<?xml"; then
    echo "✅ Valid XML response detected"
    echo ""
    echo "XML Content:"
    echo "$RESPONSE" | head -20
else
    echo "❌ Invalid response - Expected XML but got something else"
    echo "Response: $RESPONSE"
fi
echo ""
echo ""

# Test 4: Check for common issues
echo "4️⃣  Checking for common issues..."
echo "----------------------------------------------------"

if echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  Error detected in response:"
    echo "$RESPONSE" | grep -o "error[^<]*"
fi

if echo "$RESPONSE" | grep -q "Phone number not found"; then
    echo "❌ Issue: Phone number not found in database"
    echo "   → Make sure you've imported the phone number in the dashboard"
    echo "   → Check that the webhook URL matches the one in your database"
fi

if echo "$RESPONSE" | grep -q "No agent configured"; then
    echo "❌ Issue: No agent linked to phone number"
    echo "   → Go to Dashboard → Phone Numbers"
    echo "   → Edit your phone number and link it to an agent"
fi

if echo "$RESPONSE" | grep -q "<Say>"; then
    echo "✅ Response contains <Say> verb - webhook is working!"
fi

if echo "$RESPONSE" | grep -q "<Hangup"; then
    echo "✅ Response contains <Hangup/> - call will end properly"
fi

echo ""
echo ""

# Summary
echo "📊 Test Summary"
echo "----------------------------------------------------"
echo "Webhook URL: $WEBHOOK_URL"
echo "Test Call From: $FROM_NUMBER"
echo "Test Call To: $TO_NUMBER"
echo ""
echo "Next Steps:"
echo "1. If all tests pass, update this URL in your Exotel Dashboard"
echo "2. In Exotel: Settings → Phone Numbers → Answer URL"
echo "3. Make sure to use POST method"
echo "4. Test with a real call"
echo ""
echo "Need help? Check EXOTEL_TROUBLESHOOTING.md"
