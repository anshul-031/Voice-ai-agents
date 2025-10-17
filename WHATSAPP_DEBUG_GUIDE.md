# WhatsApp Test Message Troubleshooting Guide

## Problem: "Test message sent successfully" but NOT receiving messages

This guide will help you debug why test messages show success but don't arrive.

---

## Step 1: Check Server Logs

**IMPORTANT:** Run this command and keep it open while testing:

```bash
# If using npm run dev
npm run dev

# If using PM2
pm2 logs --lines 100

# If using Docker
docker logs -f [container-name]
```

### What to Look For:

When you click "Send Test Message", you should see logs like this:

```
[WhatsApp Test] Request received: { 
  hasAccessToken: true,
  accessTokenLength: 200,
  phoneNumberId: '123456789012345',
  recipientPhone: '+919876543210'
}
[WhatsApp Test] API URL: https://graph.facebook.com/v18.0/123456789012345/messages
[WhatsApp Test] Payload: { messaging_product: 'whatsapp', to: '+919876543210', ... }
[WhatsApp Test] Response status: 200
[WhatsApp Test] Response data: { ... }
[WhatsApp Test] ✅ SUCCESS - Message sent!
```

### Common Error Patterns:

#### ❌ Error 1: Invalid Phone Number
```
[WhatsApp Test] API Error: {
  status: 400,
  errorMessage: "Invalid parameter",
  errorCode: 100
}
```
**Fix:** Phone number must be in format `+[country code][number]` (e.g., `+919876543210`, not `9876543210`)

#### ❌ Error 2: Invalid Access Token
```
[WhatsApp Test] API Error: {
  status: 401,
  errorMessage: "Invalid OAuth access token",
  errorCode: 190
}
```
**Fix:** Access token expired or incorrect. Get a new token from Meta dashboard.

#### ❌ Error 3: Phone Number Not Registered
```
[WhatsApp Test] API Error: {
  status: 400,
  errorMessage: "Phone number not registered",
  errorCode: 131026
}
```
**Fix:** For test numbers, you must add the recipient phone to the allowlist first.

#### ❌ Error 4: Invalid Phone Number ID
```
[WhatsApp Test] API Error: {
  status: 400,
  errorMessage: "Invalid phone number",
  errorCode: 131031
}
```
**Fix:** Check that you're using the Phone Number ID (not the actual phone number).

---

## Step 2: Verify Meta Configuration

### 2.1 Check Access Token

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Open your app
3. Go to **WhatsApp > Getting Started**
4. Look for **"Temporary access token"**
5. Copy the token
6. **IMPORTANT:** Temporary tokens expire in 24 hours!

**Test if token is valid:**
```bash
# Replace YOUR_TOKEN and YOUR_PHONE_NUMBER_ID
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID?access_token=YOUR_TOKEN"
```

Expected response:
```json
{
  "verified_name": "Your Business Name",
  "display_phone_number": "+1 XXX-XXX-XXXX",
  "id": "123456789012345"
}
```

If you get an error, your token is invalid or expired.

### 2.2 Check Phone Number ID

The Phone Number ID is NOT the phone number itself!

**Correct:**
- Phone Number ID: `123456789012345` ✅

**Incorrect:**
- Phone number: `+1234567890` ❌
- Phone number: `1234567890` ❌

**To find your Phone Number ID:**
1. Go to **WhatsApp > Getting Started**
2. Look for **"Phone Number ID"** field (usually below the phone number)
3. It should be a long number like `123456789012345`

### 2.3 Add Recipient to Test Allowlist

If using Meta's test number, you can only message 5 pre-registered numbers.

**To add a number:**
1. Go to **WhatsApp > Getting Started**
2. Scroll to **"To"** section
3. Click **"Manage phone number list"** or **"Add phone number"**
4. Enter the phone number (with country code): `+919876543210`
5. You'll receive a verification code on WhatsApp
6. Enter the code to verify

**Important:** You can only add 5 numbers for testing!

---

## Step 3: Test Using Meta's API Explorer

Let's verify your credentials work directly with Meta's API:

### 3.1 Using Meta's Test Tool

1. Go to your app in Meta for Developers
2. Navigate to **WhatsApp > Getting Started**
3. Find the **"Send a test message"** section
4. Enter a recipient phone number
5. Click **"Send message"**

**If this works:**
- ✅ Your credentials are correct
- ✅ The phone number is valid
- ✅ Problem is in our app code

**If this doesn't work:**
- ❌ Issue is with Meta configuration
- Check access token
- Check phone number is in allowlist
- Check phone number format

### 3.2 Using cURL (Advanced)

Test the API directly:

```bash
# Replace these values:
# YOUR_PHONE_NUMBER_ID = Your Phone Number ID from Meta
# YOUR_ACCESS_TOKEN = Your access token from Meta
# RECIPIENT_PHONE = Phone to send to (e.g., +919876543210)

curl -X POST \
  "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_PHONE",
    "type": "text",
    "text": {
      "body": "hi check from curl"
    }
  }'
```

**Expected Success Response:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+919876543210",
      "wa_id": "919876543210"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLM..."
    }
  ]
}
```

**If you get success but still no message:**
- Check WhatsApp on the phone
- Make sure phone has internet connection
- Try restarting WhatsApp app
- Check if number is actually registered with WhatsApp

---

## Step 4: Common Issues & Solutions

### Issue 1: Shows Success But No Message

**Symptom:** API returns 200 OK, but no WhatsApp message arrives

**Possible Causes:**

1. **Phone number not in allowlist (for test numbers)**
   - Solution: Add number in Meta dashboard (Step 2.3)

2. **Phone number doesn't have WhatsApp**
   - Solution: Verify number has WhatsApp installed and active

3. **Network delay**
   - Solution: Wait 2-3 minutes, messages sometimes delayed

4. **Wrong phone number entered**
   - Solution: Double-check the number you're sending to

### Issue 2: Invalid Phone Number Format

**Symptoms:**
- Error: "Invalid parameter"
- Error code: 100 or 131026

**Solutions:**

✅ **Correct formats:**
```
+919876543210  (India)
+14155552671   (USA)
+447911123456  (UK)
+861234567890  (China)
```

❌ **Incorrect formats:**
```
9876543210     (Missing country code)
919876543210   (Missing +)
+91 9876543210 (Has space)
+91-9876543210 (Has dash)
```

### Issue 3: Access Token Expired

**Symptoms:**
- Error: "Invalid OAuth access token"
- Error code: 190
- Worked yesterday but not today

**Solution:**
1. Go to Meta Dashboard
2. Get a NEW temporary token (they expire in 24 hours)
3. Update your agent configuration
4. For production, use permanent token (see WHATSAPP_PUBLIC_SETUP_GUIDE.md)

### Issue 4: Rate Limiting

**Symptoms:**
- First message works
- Subsequent messages fail
- Error: "Too many messages sent"

**Solution:**
- Test numbers have message limits
- Wait 5-10 minutes between test messages
- Don't send more than 5-10 messages per hour during testing

---

## Step 5: Debug Checklist

Use this checklist to systematically check everything:

### Meta Configuration
- [ ] Meta Developer account created
- [ ] App created with WhatsApp product
- [ ] Using correct App ID
- [ ] Using correct App Secret
- [ ] Using correct Business Account ID
- [ ] Access token copied correctly (no spaces)
- [ ] Access token is not expired (< 24 hours old)
- [ ] Phone Number ID is correct (not phone number itself)
- [ ] Test number has allowlist configured
- [ ] Recipient phone added to allowlist
- [ ] Recipient phone verified with code

### Phone Number Format
- [ ] Starts with `+` symbol
- [ ] Includes country code
- [ ] No spaces or dashes
- [ ] Correct length for country
- [ ] Example tested: `+919876543210`

### Application Configuration
- [ ] Agent has WhatsApp configuration saved
- [ ] All 5 fields filled in correctly
- [ ] WhatsApp enabled toggle is ON
- [ ] Configuration saved successfully
- [ ] Server is running
- [ ] No errors in server logs

### Testing Steps
- [ ] Server logs visible while testing
- [ ] Clicked "Send Test Message"
- [ ] Entered phone number with + and country code
- [ ] Checked server logs for response
- [ ] Checked Meta dashboard for message delivery status
- [ ] Checked WhatsApp on phone
- [ ] Waited 2-3 minutes for delivery

---

## Step 6: Get Detailed Error Information

Run this test to get full error details:

### 6.1 Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to Console tab
3. Click "Send Test Message"
4. Look for the API response

You should see something like:
```json
{
  "success": true,
  "message": "Test message 'hi check' sent successfully! Check your WhatsApp.",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [...],
    "messages": [...]
  },
  "messageId": "wamid.HBgLMT..."
}
```

If you see `success: false`, look at the `error` and `details` fields.

### 6.2 Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "Send Test Message"
4. Find the request to `/api/whatsapp/test`
5. Click on it to see Request and Response

**Check Request Payload:**
```json
{
  "accessToken": "EAABs...",
  "phoneNumberId": "123456789012345",
  "recipientPhone": "+919876543210"
}
```

Make sure all three fields are present and correct.

---

## Step 7: Compare with Meta's Working Example

Since you said Meta platform can send "hello world" successfully, let's compare:

### What Meta Does (Working):
1. Uses YOUR access token
2. Uses YOUR phone number ID
3. Sends to YOUR test number
4. Message arrives ✅

### What We Need to Match:
1. Use SAME access token → Copy exact token from Meta dashboard
2. Use SAME phone number ID → Copy exact ID from Meta dashboard
3. Use SAME recipient phone → Format: +[country code][number]
4. Use SAME API endpoint → `https://graph.facebook.com/v18.0/{phoneNumberId}/messages`

### Verify These Match:

1. **Access Token:**
   - Meta's test tool uses a token (shown on page)
   - Your app should use THE SAME token
   - Copy it fresh from Meta dashboard

2. **Phone Number ID:**
   - Look at Meta's test tool
   - It shows the Phone Number ID it's using
   - Make sure your config uses THE SAME ID

3. **Recipient Phone:**
   - Use the EXACT format Meta accepts
   - Include + and country code
   - No spaces, no dashes

---

## Step 8: Live Debug Session

Let's debug together. Run these commands:

### 8.1 Start Your Server with Logs

```bash
cd /home/pelocal/pelocal/pelocal_voice_ai_agent
npm run dev
```

### 8.2 Test and Capture Logs

1. Keep terminal open
2. Go to your app in browser
3. Click "Send Test Message"
4. Enter phone: `+919876543210` (use your actual number)
5. Watch terminal output

**Copy ALL the log output and share it**

Look for lines starting with:
- `[WhatsApp Test]`
- Any errors or warnings

### 8.3 Example of What to Look For

**✅ GOOD logs (working):**
```
[WhatsApp Test] Request received: { hasAccessToken: true, ... }
[WhatsApp Test] Response status: 200
[WhatsApp Test] ✅ SUCCESS - Message sent!
```

**❌ BAD logs (not working):**
```
[WhatsApp Test] Request received: { hasAccessToken: true, ... }
[WhatsApp Test] Response status: 400
[WhatsApp Test] API Error: { errorMessage: "Invalid phone number" }
```

---

## Quick Fix Checklist

Try these in order:

1. ✅ **Generate fresh access token**
   - Go to Meta Dashboard
   - Copy NEW temporary token
   - Update agent config
   - Try again

2. ✅ **Verify phone number format**
   - Must start with `+`
   - Must have country code
   - Example: `+919876543210`
   - Try again

3. ✅ **Add phone to allowlist**
   - Meta Dashboard > WhatsApp > Getting Started
   - Add phone number
   - Verify with code
   - Try again

4. ✅ **Check Phone Number ID**
   - Make sure it's the ID, not the phone number
   - Should be 15 digits
   - Copy from Meta Dashboard
   - Try again

5. ✅ **Test with Meta's tool first**
   - Use Meta's "Send test message" button
   - If that works, credentials are fine
   - If that fails, fix Meta setup first

---

## Still Not Working?

If you've tried everything above and it's still not working, please provide:

1. **Server logs** from when you click "Send Test Message"
2. **Browser console** output (F12 → Console)
3. **Network tab** showing the API request/response (F12 → Network)
4. **Screenshots** of:
   - Your WhatsApp config in the app
   - Meta dashboard showing phone number ID
   - Any error messages

With this information, we can pinpoint the exact issue!

---

## Summary

**Most common issue:** Using test number but phone not in allowlist

**Quick fix:**
1. Go to Meta Dashboard > WhatsApp > Getting Started
2. Click "Manage phone number list"
3. Add your phone number
4. Verify with code
5. Try again

**Second most common:** Wrong phone number format or expired token

**Quick fix:**
1. Format phone as: `+[country code][number]`
2. Get fresh access token from Meta Dashboard
3. Update config
4. Try again

**Run the test again and check your server logs to see the exact error!**
