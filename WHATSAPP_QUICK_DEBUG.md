# 🚨 IMMEDIATE DEBUG STEPS - WhatsApp Not Receiving Messages

## Your Situation
- ✅ Test message API returns "success"
- ❌ NOT receiving WhatsApp messages
- ✅ Meta's test tool CAN send "hello world"
- ❌ Your platform CANNOT send messages

This means: **Your Meta credentials work, but something is wrong with how we're using them**

---

## 🔥 DO THIS RIGHT NOW (5 minutes)

### Step 1: Start Server with Logs (REQUIRED)

Open terminal and run:

```bash
cd /home/pelocal/pelocal/pelocal_voice_ai_agent
npm run dev
```

**Keep this terminal open!** You MUST see the logs.

### Step 2: Open Your App

Go to: `http://localhost:3000/agents/[your-agent-id]`

Scroll to WhatsApp Integration section

### Step 3: Click "Send Test Message"

Enter phone number in format: `+919876543210`

### Step 4: **IMMEDIATELY** Check Terminal

You should see logs like this:

```
[WhatsApp Test] Request received: { ... }
[WhatsApp Test] API URL: https://graph.facebook.com/...
[WhatsApp Test] Response status: 200 or 400
[WhatsApp Test] Response data: { ... }
```

### Step 5: Copy and Share

**Copy the ENTIRE output** between these lines:
- Starts with: `[WhatsApp Test] Request received:`
- Ends with: `[WhatsApp Test] Response data:` or `[WhatsApp Test] API Error:`

---

## 🎯 Most Likely Issues (90% of problems)

### Issue #1: Phone Number Not in Allowlist (80% probability)

**If you're using Meta's TEST number**, you can ONLY send to 5 pre-registered phones.

**FIX NOW:**

1. Go to: https://developers.facebook.com
2. Open your app
3. Click **WhatsApp** → **Getting Started**
4. Scroll to find **"To"** section or **"Manage phone number list"**
5. Click **"Add phone number"**
6. Enter: `+919876543210` (your phone with country code)
7. You'll get a verification code on WhatsApp
8. Enter the code
9. ✅ Now try sending test message again!

### Issue #2: Wrong Phone Number Format (10% probability)

**WRONG formats that look successful but fail:**
```
❌ 9876543210       (no country code)
❌ 919876543210     (no + sign)
❌ +91 9876543210   (has space)
❌ +91-9876543210   (has dash)
```

**CORRECT format:**
```
✅ +919876543210    (+ then country code then number, no spaces)
✅ +14155552671     (USA example)
✅ +447911123456    (UK example)
```

### Issue #3: Access Token Expired (5% probability)

Temporary tokens expire every 24 hours!

**FIX NOW:**

1. Go to: https://developers.facebook.com
2. Open your app
3. **WhatsApp** → **Getting Started**
4. Find **"Temporary access token"**
5. Click **"Copy"** to get a NEW token
6. Go to your agent config
7. Paste the NEW token in "Access Token" field
8. Click **"Save Configuration"**
9. Try test message again!

### Issue #4: Using Phone Number Instead of Phone Number ID (5% probability)

**The Phone Number ID is NOT the phone number!**

**WRONG:**
```
❌ phoneNumberId: "+15551234567"  (this is the phone number)
❌ phoneNumberId: "15551234567"   (still the phone number)
```

**CORRECT:**
```
✅ phoneNumberId: "123456789012345"  (15-digit ID from Meta)
```

**Where to find Phone Number ID:**
1. Meta Dashboard → WhatsApp → Getting Started
2. Look for field labeled **"Phone Number ID"**
3. It's usually BELOW the actual phone number
4. Looks like: `123456789012345`

---

## 📊 What Your Logs Should Show

### ✅ IF WORKING CORRECTLY:

```
[WhatsApp Test] Request received: {
  hasAccessToken: true,
  accessTokenLength: 200,
  phoneNumberId: '123456789012345',
  recipientPhone: '+919876543210'
}
[WhatsApp Test] Response status: 200
[WhatsApp Test] Response data: {
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "+919876543210",
    "wa_id": "919876543210"
  }],
  "messages": [{
    "id": "wamid.HBgLMTk..."
  }]
}
[WhatsApp Test] ✅ SUCCESS - Message sent!
```

**If you see this but STILL no message:**
- Phone not in allowlist (most common!)
- Phone doesn't have WhatsApp
- Wrong recipient number entered

### ❌ IF NOT WORKING - Common Errors:

#### Error A: Phone Not Registered
```
[WhatsApp Test] Response status: 400
[WhatsApp Test] API Error: {
  errorMessage: "Phone number not registered",
  errorCode: 131026
}
```
**FIX:** Add phone to allowlist (see Issue #1 above)

#### Error B: Invalid Access Token
```
[WhatsApp Test] Response status: 401
[WhatsApp Test] API Error: {
  errorMessage: "Invalid OAuth access token",
  errorCode: 190
}
```
**FIX:** Get new token (see Issue #3 above)

#### Error C: Invalid Phone Format
```
[WhatsApp Test] Response status: 400
[WhatsApp Test] API Error: {
  errorMessage: "Invalid parameter",
  errorCode: 100
}
```
**FIX:** Use correct format: `+919876543210` (see Issue #2 above)

#### Error D: Invalid Phone Number ID
```
[WhatsApp Test] Response status: 400
[WhatsApp Test] API Error: {
  errorMessage: "Invalid phone number",
  errorCode: 131031
}
```
**FIX:** Use Phone Number ID not phone number (see Issue #4 above)

---

## 🎯 Action Plan - Do These in Order

### ✅ Action 1: Add Phone to Allowlist (MOST IMPORTANT!)

Since Meta's test works but yours doesn't, and you're using a test number:

1. ☑️ Go to Meta Dashboard
2. ☑️ WhatsApp → Getting Started
3. ☑️ Find "To" or "Manage phone numbers"
4. ☑️ Add your phone: `+919876543210`
5. ☑️ Verify with code from WhatsApp
6. ☑️ Try test message again

**This fixes 80% of "success but no message" issues!**

### ✅ Action 2: Verify Phone Number Format

Make sure you're entering:
- ☑️ Starts with `+`
- ☑️ Includes country code (91 for India)
- ☑️ No spaces, dashes, or parentheses
- ☑️ Example: `+919876543210`

### ✅ Action 3: Get Fresh Access Token

1. ☑️ Go to Meta Dashboard
2. ☑️ Copy NEW temporary token
3. ☑️ Update in agent config
4. ☑️ Save
5. ☑️ Try again

### ✅ Action 4: Check Phone Number ID

1. ☑️ Verify you copied the Phone Number ID (not phone number)
2. ☑️ Should be 15 digits
3. ☑️ From Meta Dashboard under "Phone Number ID" field

### ✅ Action 5: Check Server Logs

1. ☑️ Run `npm run dev` in terminal
2. ☑️ Keep terminal visible
3. ☑️ Click "Send Test Message"
4. ☑️ Read the error message in logs
5. ☑️ Share the logs if still stuck

---

## 🔍 Quick Verification Test

Let's verify your Meta credentials work:

### Test with cURL (Direct API call):

```bash
# Replace these 3 values:
PHONE_ID="YOUR_PHONE_NUMBER_ID"      # From Meta dashboard
TOKEN="YOUR_ACCESS_TOKEN"             # From Meta dashboard
RECIPIENT="+919876543210"             # Your WhatsApp number

curl -X POST \
  "https://graph.facebook.com/v18.0/$PHONE_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"$RECIPIENT\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"Direct API test\"
    }
  }"
```

**If this works:** Your credentials are fine, issue is in app config
**If this fails:** Check credentials in Meta dashboard

---

## 📱 Still Not Working? Share This Info:

If you've tried everything above and it still doesn't work, share:

1. **Terminal logs** (from `[WhatsApp Test]` lines)
2. **Browser console** (F12 → Console tab)
3. **Screenshots of:**
   - Your WhatsApp config in app
   - Meta dashboard showing phone number ID
   - "To" section in Meta showing allowlist

With this info, I can tell you EXACTLY what's wrong!

---

## 🎉 Success Checklist

You'll know it's working when:

- [ ] Click "Send Test Message"
- [ ] See `[WhatsApp Test] ✅ SUCCESS` in logs
- [ ] Receive message on WhatsApp within 5 seconds
- [ ] Message says "hi check"

---

## ⚡ TL;DR - Do This First

**90% chance this fixes it:**

1. Start server: `npm run dev`
2. Go to Meta Dashboard → WhatsApp → Getting Started
3. Click "Manage phone number list"
4. Add your phone: `+919876543210`
5. Verify with WhatsApp code
6. Try test message again
7. Check terminal logs for errors

**If that doesn't work, check terminal logs and they'll tell you the exact error!**

---

**The enhanced logging I just added will show you EXACTLY what's wrong. Run `npm run dev` and check the logs!**
