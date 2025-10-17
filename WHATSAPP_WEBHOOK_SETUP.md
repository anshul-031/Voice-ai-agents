# ✅ Test Message Works, But Can't Chat Back

## Your Situation
- ✅ Test message "hi check" **WORKS** (received it!)
- ❌ When you **reply** to the bot on WhatsApp, **no response**
- ❌ Bot doesn't seem to receive your messages

## The Problem
Your **webhook is not configured** yet! The webhook is what tells Meta to send incoming messages to your server.

**Currently:**
```
You → WhatsApp → Meta → ❌ (No webhook) → Messages get lost
```

**After webhook setup:**
```
You → WhatsApp → Meta → ✅ Your Webhook → AI Agent → Response back to you
```

---

## 🚀 IMMEDIATE FIX (5 minutes)

### Step 1: Get Your Webhook URL

1. Open your agent page in browser
2. Go to **WhatsApp Integration** section
3. Click **"Configure"** (if not already open)
4. You should see **"Webhook URL"** field
5. It will look like:
   ```
   https://your-domain.com/api/whatsapp/webhook/[agentId]
   ```
6. Click the **"Copy"** button to copy it
7. **IMPORTANT**: Your app must be on a **public HTTPS URL** (not localhost!)

### Step 2: Configure Webhook in Meta Dashboard

1. Go to: https://developers.facebook.com
2. Open your app
3. Click **"WhatsApp"** in left sidebar
4. Click **"Configuration"** (NOT "Getting Started")
5. Find the **"Webhook"** section
6. Click **"Edit"** button

### Step 3: Enter Webhook Details

In the dialog that appears:

1. **Callback URL**: Paste your webhook URL from Step 1
   ```
   https://your-domain.com/api/whatsapp/webhook/[agentId]
   ```

2. **Verify Token**: Enter exactly:
   ```
   pelocal_verify_token_2025
   ```

3. Click **"Verify and Save"**

**Expected Result:**
- ✅ Green checkmark or "Success" message
- ✅ Webhook URL is saved

**If verification fails:**
- Check your app is on public HTTPS URL (not http:// or localhost)
- Check the verify token is exactly: `pelocal_verify_token_2025`
- Check your server is running

### Step 4: Subscribe to Messages

1. Still in **WhatsApp > Configuration**
2. Scroll down to **"Webhook fields"** section
3. Click **"Manage"** or **"Edit"**
4. Find **"messages"** checkbox
5. Make sure it's **CHECKED** ✅
6. Click **"Save"** or **"Done"**

### Step 5: Test Two-Way Chat!

1. Open WhatsApp on your phone
2. Find the conversation with the test number (where you got "hi check")
3. Send a message: **"Hello"**
4. Within 2-5 seconds, you should get an AI response! 🎉

---

## 🔍 If You're Using Localhost (Local Development)

### The Problem
WhatsApp webhooks **REQUIRE** a public HTTPS URL. They **CANNOT** reach `localhost` or `http://`.

### Quick Solutions

#### Option A: Use ngrok (Fastest - 2 minutes)

1. **Install ngrok**:
   ```bash
   # Download from: https://ngrok.com/download
   # Or install with:
   sudo snap install ngrok  # Linux
   brew install ngrok       # Mac
   ```

2. **Start your app**:
   ```bash
   npm run dev
   # App runs on http://localhost:3000
   ```

3. **Create ngrok tunnel** (in new terminal):
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** shown:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Your webhook URL becomes**:
   ```
   https://abc123.ngrok.io/api/whatsapp/webhook/[agentId]
   ```

6. **Use this URL** in Meta Dashboard webhook configuration

#### Option B: Deploy to Production

Deploy your app to:
- Vercel
- Railway
- Heroku
- DigitalOcean
- AWS
- Any hosting with HTTPS

Then use your production URL for the webhook.

---

## 📊 Verification Checklist

### Before Testing Two-Way Chat:

**Meta Dashboard:**
- [ ] Webhook URL configured in WhatsApp > Configuration
- [ ] Webhook shows green checkmark (verified successfully)
- [ ] "messages" field is subscribed (checked)
- [ ] Verify token is: `pelocal_verify_token_2025`

**Your Application:**
- [ ] App is running (npm run dev or production)
- [ ] Using public HTTPS URL (not localhost, unless using ngrok)
- [ ] WhatsApp integration is enabled in agent
- [ ] All credentials saved correctly

**Ready to Test:**
- [ ] Can send test message successfully ✅ (you already did this!)
- [ ] Webhook is configured ✅ (after following steps above)
- [ ] Server logs visible (run `npm run dev` in terminal)

---

## 🧪 Testing Two-Way Conversation

### Step 1: Start Server with Logs

```bash
cd /home/pelocal/pelocal/pelocal_voice_ai_agent
npm run dev
```

Keep terminal open to see logs!

### Step 2: Send Message on WhatsApp

1. Open WhatsApp on your phone
2. Go to conversation with test number
3. Send: **"Hello"**

### Step 3: Check Server Logs

You should see:

```
[WhatsApp Webhook] Incoming message: { ... }
[WhatsApp Webhook] Processing message from +919876543210: Hello
[LLM] Processing: Hello
[WhatsApp] Message sent successfully
[WhatsApp Webhook] Response sent to +919876543210
```

### Step 4: Check WhatsApp

Within 2-5 seconds, you should receive AI response!

---

## 🔴 Common Issues

### Issue 1: Webhook Verification Failed

**Error:** "The callback URL or verify token couldn't be verified"

**Solutions:**

1. **Check URL is HTTPS**:
   - ✅ `https://your-domain.com/...`
   - ❌ `http://your-domain.com/...`
   - ❌ `http://localhost:3000/...`

2. **Check Verify Token**:
   - Must be EXACTLY: `pelocal_verify_token_2025`
   - No extra spaces
   - Case-sensitive

3. **Check Server is Running**:
   ```bash
   # Test webhook manually
   curl "https://your-domain.com/api/whatsapp/webhook/[agentId]?hub.mode=subscribe&hub.verify_token=pelocal_verify_token_2025&hub.challenge=test123"
   # Should return: test123
   ```

4. **Check Agent ID is Correct**:
   - URL should have your actual agent ID
   - Copy it from your agent page URL

### Issue 2: Messages Received But No Response

**Symptoms:** You send message, logs show it's received, but no response back

**Solutions:**

1. **Check WhatsApp is Enabled**:
   - Agent config → WhatsApp Integration
   - Toggle should be ON (green)

2. **Check Agent Has a Prompt**:
   - Your agent needs a prompt/system message
   - Without it, LLM might not respond

3. **Check Gemini API Key**:
   - File: `.env.local`
   - Variable: `GEMINI_API_KEY=...`
   - Must be valid

4. **Check Server Logs for Errors**:
   ```bash
   # Look for error messages
   [WhatsApp Webhook] Error: ...
   [LLM] Error: ...
   ```

### Issue 3: Webhook Not Receiving Messages

**Symptoms:** Webhook verified OK, but no logs when you send messages

**Solutions:**

1. **Check "messages" is Subscribed**:
   - Meta Dashboard → WhatsApp → Configuration
   - Webhook fields → "messages" must be CHECKED ✅

2. **Check Webhook is Active**:
   - Should show green checkmark
   - Should show your webhook URL

3. **Re-verify Webhook**:
   - Edit webhook
   - Save again
   - Check for success message

4. **Check You're Messaging the Right Number**:
   - Must message the test number
   - Not your own business number

---

## 📝 Step-by-Step Webhook Setup (Detailed)

### Part 1: Prepare Webhook URL

#### If Using Localhost + ngrok:

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Copy the HTTPS URL shown (e.g., https://abc123.ngrok.io)
```

Your webhook URL:
```
https://abc123.ngrok.io/api/whatsapp/webhook/[your-agent-id]
```

#### If Using Production:

Your webhook URL:
```
https://your-domain.com/api/whatsapp/webhook/[your-agent-id]
```

### Part 2: Configure in Meta

1. **Open Meta Developer Console**:
   - Go to: https://developers.facebook.com
   - Click on your app

2. **Navigate to Configuration**:
   - Left sidebar → Click "WhatsApp"
   - Top tabs → Click "Configuration" (not "Getting Started")

3. **Edit Webhook**:
   - Find "Webhook" section
   - Click "Edit" button

4. **Enter Details**:
   ```
   Callback URL: https://your-url.com/api/whatsapp/webhook/[agentId]
   Verify Token: pelocal_verify_token_2025
   ```

5. **Click "Verify and Save"**:
   - Meta will call your webhook to verify
   - Should see success message

6. **Subscribe to Fields**:
   - Find "Webhook fields" section
   - Click "Manage"
   - Check ✅ "messages"
   - Click "Save"

### Part 3: Test End-to-End

1. **Check webhook is verified** (green checkmark in Meta)
2. **Start server** with logs visible
3. **Send WhatsApp message**: "Hello"
4. **Watch terminal** for webhook logs
5. **Check WhatsApp** for AI response

---

## 🎯 Debug Logs to Look For

### When You Send a WhatsApp Message:

**✅ GOOD logs (working):**
```
[WhatsApp Webhook] Incoming message: {
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "text": { "body": "Hello" }
        }]
      }
    }]
  }]
}
[WhatsApp Webhook] Processing message from +919876543210: Hello
[WhatsApp Webhook] Response sent to +919876543210
```

**❌ BAD - No logs at all:**
- Webhook not configured
- "messages" not subscribed
- Webhook URL wrong

**❌ BAD - Error logs:**
```
[WhatsApp Webhook] Agent not found
[WhatsApp Webhook] WhatsApp not enabled
[LLM] API key not configured
```

---

## 🔧 Quick Test Commands

### Test 1: Check Webhook Endpoint

```bash
# Replace [agentId] with your actual agent ID
curl "https://your-domain.com/api/whatsapp/webhook/[agentId]?hub.mode=subscribe&hub.verify_token=pelocal_verify_token_2025&hub.challenge=test123"

# Expected output: test123
```

If this doesn't return "test123", webhook endpoint has issues.

### Test 2: Check Server is Accessible

```bash
curl -I https://your-domain.com

# Should return: HTTP/2 200
```

### Test 3: Check Agent Exists

```bash
curl https://your-domain.com/api/voice-agents/[agentId]

# Should return agent JSON with whatsappConfig
```

---

## ✅ Success Checklist

You'll know two-way chat is working when:

1. ✅ You send "Hello" on WhatsApp
2. ✅ Terminal shows webhook logs
3. ✅ Terminal shows LLM processing
4. ✅ Terminal shows response sent
5. ✅ You receive AI response on WhatsApp within 5 seconds
6. ✅ You can continue the conversation (AI remembers context)

---

## 📞 Final Check

After setting up webhook, verify:

**Meta Dashboard:**
- [ ] WhatsApp > Configuration
- [ ] Webhook section shows ✅ green checkmark
- [ ] Webhook URL is your correct URL
- [ ] "messages" field is subscribed ✅

**Your App:**
- [ ] Server is running on public HTTPS URL
- [ ] WhatsApp integration enabled
- [ ] Agent has a prompt configured
- [ ] Gemini API key in .env.local

**Test:**
- [ ] Send "Hello" on WhatsApp
- [ ] See webhook logs in terminal
- [ ] Receive AI response on WhatsApp

---

## 🎉 After Webhook Setup

Once webhook is configured:

1. **Anyone in your allowlist** can chat with bot
2. **Conversations are maintained** (bot remembers context)
3. **Responses are instant** (2-5 seconds)
4. **Multiple users** can chat simultaneously
5. **All messages logged** in MongoDB

---

## 🆘 Still Not Working?

If you've configured webhook and it's still not working:

1. **Share your server logs** when you send a WhatsApp message
2. **Screenshot Meta Dashboard** showing webhook configuration
3. **Confirm your app URL** (using localhost + ngrok? or production?)

**Most common issue:** Using localhost without ngrok - webhooks cannot reach localhost!

---

## 📚 Summary

**You've completed:**
- ✅ Meta account setup
- ✅ Credentials configured
- ✅ Test message works

**You need to do:**
- ⚠️ Configure webhook in Meta Dashboard (5 minutes)
- ⚠️ Subscribe to "messages" field
- ⚠️ Make sure app is on public HTTPS URL

**Then you'll have:**
- 🎉 Full two-way WhatsApp chat
- 🎉 AI-powered conversations
- 🎉 Context-aware responses

---

**Follow the webhook setup steps above, and you'll be chatting with your AI agent via WhatsApp in 5 minutes!** 🚀
