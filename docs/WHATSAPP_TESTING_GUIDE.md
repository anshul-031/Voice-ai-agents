# 🧪 WhatsApp Integration - Testing & Verification Guide

## How to Verify Your WhatsApp Number is Connected to Your Agent

This guide shows you **exactly how to test** that your WhatsApp integration is working correctly.

---

## 🎯 Quick Verification Checklist

Before testing, ensure these are complete:

- [ ] **Platform**: WhatsApp number added in Dashboard
- [ ] **Meta**: Webhook verified (green checkmark)
- [ ] **Agent**: Agent created and linked to WhatsApp number
- [ ] **Meta**: "messages" field subscribed in webhook settings

---

## 📱 Method 1: Send a Test Message (Recommended)

This is the **most reliable** way to verify everything is working.

### Step 1: Send a WhatsApp Message

1. **Open WhatsApp** on your phone or computer
2. **Start a new chat** with your WhatsApp Business number
3. **Send a simple message**:
   ```
   Hello, can you help me?
   ```

### Step 2: Wait for Response (5-10 seconds)

If everything is working, you should receive an **AI-generated response** within 5-10 seconds.

✅ **Success looks like**:
```
You: Hello, can you help me?

Bot: Hi! I'd be happy to help you. How can I assist you today?
```

❌ **If you don't get a response**: See [Troubleshooting](#troubleshooting) below

---

## 🖥️ Method 2: Check Platform Dashboard

### Step 1: View Your WhatsApp Numbers

1. Open your platform
2. Go to **Dashboard → WhatsApp Numbers**
3. Find your WhatsApp number card

### Step 2: Verify Configuration

On the number card, check:

```
┌─────────────────────────────────────┐
│ 📱 Customer Support                 │
│ +1-555-123-4567                     │
│                                     │
│ Linked Agent: Support Agent    ← ✓ │
│ Status: 🟢 Active              ← ✓ │
│ Phone Number ID: 123456...     ← ✓ │
│ Last: 2 min ago                ← ✓ │
└─────────────────────────────────────┘
```

✅ **What to verify**:
- **Linked Agent**: Shows your agent's name (not "Not linked")
- **Status**: Shows green "Active" badge
- **Phone Number ID**: Has a value
- **Last Interaction**: Updates after sending a test message

---

## 🔍 Method 3: Check Browser Console

### Step 1: Open Developer Tools

1. In your platform, press **F12** (or right-click → Inspect)
2. Click the **Console** tab
3. Keep it open

### Step 2: Open WhatsApp Number Modal

1. Click **"Add WhatsApp Number"** or **Edit** an existing number
2. **Watch the console** for this message:
   ```
   Loaded agents: 3
   ```

✅ **Success**: You see a number greater than 0
❌ **Problem**: You see "Loaded agents: 0" → [Create an agent first](#no-agents-available)

### Step 3: Check Network Tab

1. Click the **Network** tab in Developer Tools
2. Reload the WhatsApp Numbers page
3. Look for these requests:
   - `GET /api/whatsapp-numbers?userId=mukul` - Should return 200
   - `GET /api/voice-agents?userId=mukul` - Should return 200

✅ **Success**: Both show status 200 and return data
❌ **Problem**: 404 or 500 errors → See [API Errors](#api-errors)

---

## 📊 Method 4: Check Server Logs

### If Using Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Click **Logs** tab
4. Send a WhatsApp test message
5. **Watch for**:
   ```
   POST /api/meta-webhook
   [WhatsApp Service] Processing message from +1234567890
   [WhatsApp Service] Agent found: Support Agent
   [WhatsApp Service] Generated response: ...
   [WhatsApp Service] Sent reply successfully
   ```

### If Using Local Development

1. Open your terminal where `npm run dev` is running
2. Send a WhatsApp test message
3. **Watch for similar logs** as above

✅ **Success**: You see message processing logs
❌ **Problem**: No logs appear → [Webhook not configured](#webhook-not-receiving)

---

## 🔔 Method 5: Check Database (Advanced)

If you have database access:

### Check WhatsApp Numbers Collection

```javascript
// MongoDB query
db.whatsappnumbers.find({ phoneNumber: /YOUR_NUMBER/ }).pretty()
```

**Verify**:
```json
{
  "_id": "...",
  "phoneNumber": "+15551234567",
  "phoneNumberId": "123456789012345",
  "displayName": "Support Line",
  "linkedAgentId": "6789abc...",     ← Should have a value
  "status": "active",                 ← Should be "active"
  "webhookUrl": "/api/meta-webhook",
  "metaConfig": {
    "appId": "...",
    "accessToken": "...",             ← Should be masked/present
    // ...
  }
}
```

### Check Messages Collection

After sending a test message:

```javascript
// MongoDB query
db.whatsappmessages.find().sort({ createdAt: -1 }).limit(5).pretty()
```

**You should see**:
```json
[
  {
    "direction": "outbound",          ← Bot's reply
    "messageType": "text",
    "textBody": "Hi! I'd be happy to help...",
    "status": "sent",
    "createdAt": "2025-10-27T..."
  },
  {
    "direction": "inbound",           ← Your message
    "messageType": "text", 
    "textBody": "Hello, can you help me?",
    "createdAt": "2025-10-27T..."
  }
]
```

✅ **Success**: You see both inbound and outbound messages
❌ **Problem**: Only inbound or no messages → See [No Response Sent](#no-response-sent)

---

## ✅ What "Working" Looks Like

### Complete Flow (End-to-End)

```
1. You send WhatsApp message
   ↓
2. Meta receives it
   ↓
3. Meta sends webhook to your platform
   POST https://your-domain.com/api/meta-webhook
   ↓
4. Platform logs show:
   "Processing message from +1234567890"
   ↓
5. Platform finds your WhatsApp number config
   "Found WhatsApp number: Support Line"
   ↓
6. Platform gets linked agent
   "Agent found: Support Agent"
   ↓
7. Platform generates AI response
   "Generated response: Hi! I'd be happy..."
   ↓
8. Platform sends reply via Meta API
   "Sent reply successfully"
   ↓
9. You receive AI response in WhatsApp
   ✅ WORKING!
```

### Dashboard Updates

After test message:
- **"Last Interaction"** timestamp updates
- **Message count** increases (if displayed)
- **Database** has new message records

---

## 🚨 Troubleshooting

### Issue: No Response Received

#### Possible Cause 1: Webhook Not Verified

**Check**:
1. Go to Meta App → WhatsApp → Configuration
2. Look at Webhook section
3. Should have **green checkmark** ✓

**Fix**:
```
1. Click "Edit" on Webhook
2. Enter: https://your-domain.com/api/meta-webhook
3. Enter verify token (from .env.local)
4. Click "Verify and Save"
```

#### Possible Cause 2: Messages Field Not Subscribed

**Check**:
1. In Meta webhook configuration
2. Look for "Webhook fields"
3. ✅ **"messages"** should be checked

**Fix**: Check the "messages" field and save

#### Possible Cause 3: No Agent Linked

**Check**:
1. Dashboard → WhatsApp Numbers
2. Find your number
3. Look at "Linked Agent" field

**Shows**: "Not linked"

**Fix**:
```
1. Click Edit (✏️) on the number
2. Select an agent from "Link to Agent" dropdown
3. If dropdown is empty, create an agent first:
   - Go to Voice Agents section
   - Click "Add Voice Agent"
   - Fill in title and prompt
   - Save
4. Go back and link the agent
```

#### Possible Cause 4: Invalid Access Token

**Check**:
1. Try sending message
2. Check server logs for errors like:
   ```
   Error: Invalid access token
   ```

**Fix**:
```
1. Generate new System User token in Meta
2. Edit WhatsApp number in platform
3. Enter new Access Token
4. Save
```

#### Possible Cause 5: Agent Has No Prompt

**Check**:
1. Go to Voice Agents
2. Edit the linked agent
3. Check if "Initial Prompt" is filled

**Fix**:
```
1. Add a prompt like:
   "You are a helpful customer support assistant.
    Answer questions politely and concisely."
2. Save agent
3. Test again
```

---

## 🧪 Detailed Testing Scenarios

### Test 1: Basic Response

**Send**: "Hello"
**Expected**: Friendly greeting from agent

**Verify**:
- ✅ Response received within 10 seconds
- ✅ Response matches agent's personality (from prompt)
- ✅ "Last Interaction" updates on dashboard

### Test 2: Knowledge Base (If Configured)

**Setup**: Upload a CSV to your agent with product info

**Send**: "What products do you have?"
**Expected**: Response includes information from the CSV

**Verify**:
- ✅ Agent uses knowledge from uploaded files
- ✅ Response is relevant to your business
- ✅ Information is accurate

### Test 3: Multiple Messages (Conversation)

**Send**:
```
Message 1: "Hi, I need help"
Message 2: "What are your hours?"
Message 3: "Thank you"
```

**Expected**: 
- Response to each message
- Conversation context maintained
- Polite responses

**Verify**:
- ✅ All 3 messages get responses
- ✅ Agent remembers context (if configured)
- ✅ 3 inbound + 3 outbound messages in database

### Test 4: Different Agents

**If you have multiple WhatsApp numbers**:

1. Configure Number 1 with Agent A (Sales)
2. Configure Number 2 with Agent B (Support)
3. Message Number 1: Should get sales-focused response
4. Message Number 2: Should get support-focused response

**Verify**:
- ✅ Each number uses its linked agent
- ✅ Responses match agent prompts
- ✅ No cross-contamination

### Test 5: Status Toggle

**Test**:
1. Set WhatsApp number status to "Inactive"
2. Send a message
3. Should get **no response** (webhook still receives but doesn't process)
4. Set back to "Active"
5. Send another message
6. Should get **normal response**

**Verify**:
- ✅ Inactive numbers don't respond
- ✅ Active numbers respond normally
- ✅ Easy to enable/disable without deleting

---

## 📋 Pre-Flight Checklist

Before testing, verify:

### Platform Configuration
- [ ] WhatsApp number added
- [ ] Display name set
- [ ] Phone Number ID entered correctly
- [ ] Status is "Active"
- [ ] Agent is linked (shows agent name)
- [ ] Meta credentials saved

### Meta Configuration
- [ ] Webhook URL configured
- [ ] Webhook verified (green ✓)
- [ ] Verify token matches .env.local
- [ ] "messages" field subscribed
- [ ] Phone number added to app

### Agent Configuration
- [ ] Agent created
- [ ] Initial prompt filled in
- [ ] LLM model selected
- [ ] Agent status active (if applicable)

### Environment
- [ ] META_WEBHOOK_VERIFY_TOKEN in .env.local
- [ ] Platform deployed (HTTPS)
- [ ] Domain accessible publicly

---

## 🎯 Quick Tests (Do These First)

### 1-Minute Test
```
1. Open WhatsApp
2. Message your business number: "test"
3. Wait 10 seconds
4. Got a response? ✅ WORKING!
```

### 3-Minute Test
```
1. Send message "Hello"
2. Check platform dashboard
3. "Last Interaction" updated? ✅ WORKING!
```

### 5-Minute Test
```
1. Send 3 different messages
2. Check browser console (F12)
3. Check server logs
4. Check database
5. All show activity? ✅ WORKING!
```

---

## 📸 Visual Verification Guide

### Dashboard Should Show

```
┌─────────────────────────────────────┐
│ 💬 WhatsApp Numbers                 │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Support Line                 │ │
│ │ +1-555-123-4567                 │ │
│ │                                 │ │
│ │ Linked Agent: Support Agent ✓   │ │
│ │ Status: 🟢 Active           ✓   │ │
│ │ Phone Number ID: 123...     ✓   │ │
│ │                                 │ │
│ │ Webhook URL:                    │ │
│ │ https://domain.com/api/meta-w...│ │
│ │ 📋 Copy  🔗 Open                │ │
│ │                                 │ │
│ │ Last: Just now              ✓   │ │
│ │                                 │ │
│ │ 🔄 Refresh  ✏️ Edit  🗑️       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Meta Dashboard Should Show

```
┌─────────────────────────────────────┐
│ WhatsApp → Configuration            │
├─────────────────────────────────────┤
│                                     │
│ Webhook                         ✓   │ ← Green checkmark
│ https://your-domain.com/api/...     │
│                                     │
│ Webhook fields:                     │
│ ✅ messages                         │ ← Must be checked
│ ☐ message_status                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎓 Understanding Test Results

### Successful Test = All These True

1. ✅ Message sent from WhatsApp
2. ✅ Response received in WhatsApp (5-10 sec)
3. ✅ Dashboard "Last Interaction" updates
4. ✅ Server logs show processing
5. ✅ Database has message records
6. ✅ Response quality is good (matches agent prompt)

### Partial Success Scenarios

**Scenario A**: Message sent, no response
- Problem: Webhook, agent, or credentials
- See: [No Response Received](#issue-no-response-received)

**Scenario B**: Response slow (30+ seconds)
- Problem: LLM model too slow or server overload
- Fix: Choose faster model (Gemini Flash)

**Scenario C**: Response generic (not using knowledge)
- Problem: Knowledge files not loaded or agent prompt
- Fix: Check knowledge uploaded, review prompt

**Scenario D**: Can't find number on dashboard
- Problem: Not saved or wrong userId
- Fix: Re-add number, check userId=mukul

---

## 🔧 Debugging Tools

### Browser Console Commands

```javascript
// Check if agents loaded
console.log('Agents:', agents);

// Test API manually
fetch('/api/voice-agents?userId=mukul')
  .then(r => r.json())
  .then(d => console.log('Agents:', d.agents));

fetch('/api/whatsapp-numbers?userId=mukul')
  .then(r => r.json())
  .then(d => console.log('Numbers:', d.whatsappNumbers));
```

### cURL Test Webhook

```bash
# Test webhook endpoint
curl "https://your-domain.com/api/meta-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123"

# Should return: test123
```

### Test Message Send (Advanced)

```bash
# Send via Meta API directly
curl -X POST \
  "https://graph.facebook.com/v20.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_NUMBER",
    "type": "text",
    "text": {
      "body": "Test message"
    }
  }'
```

---

## ✨ Pro Tips

1. **Test immediately after setup** - Don't wait!
2. **Keep browser console open** - Catch errors early
3. **Check logs first** - They tell you what's happening
4. **Use simple test messages** - "hello" or "test"
5. **Verify webhook URL** - Copy from platform, paste in Meta
6. **Double-check agent link** - Most common issue
7. **Test with multiple messages** - Ensure consistency
8. **Monitor "Last Interaction"** - Quick visual verification
9. **Save credentials carefully** - Typos cause failures
10. **Use System User tokens** - For production stability

---

## 📞 Still Not Working?

If you've tried everything and it's still not working:

### Final Checklist

1. [ ] **Platform accessible** via HTTPS (not localhost)
2. [ ] **Webhook verified** in Meta (green checkmark)
3. [ ] **"messages" subscribed** in Meta webhook fields
4. [ ] **Agent exists** and has a prompt
5. [ ] **Agent linked** to WhatsApp number (shows name)
6. [ ] **Status is Active** (green badge)
7. [ ] **Access token valid** (not expired)
8. [ ] **Phone Number ID correct** (from Meta)
9. [ ] **Verify token matches** (.env.local = Meta settings)
10. [ ] **No server errors** in logs

### Get Help

1. **Review**: [Troubleshooting Guide](WHATSAPP_TROUBLESHOOTING.md)
2. **Check**: Server logs for specific errors
3. **Verify**: All credentials are correct
4. **Test**: Webhook with cURL command
5. **Examine**: Database for records

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ WhatsApp messages get instant AI replies
2. ✅ Dashboard shows "Last Interaction" updating
3. ✅ Server logs show message processing
4. ✅ Database fills with conversation records
5. ✅ Agent name shows in WhatsApp number card
6. ✅ Responses match agent's configuration
7. ✅ Knowledge base information included (if configured)
8. ✅ Multiple messages maintain conversation
9. ✅ Webhook shows verified in Meta
10. ✅ No errors in browser console or server logs

**When all 10 are true, you have a fully working WhatsApp AI agent!** 🚀

---

## 📚 Related Guides

- **Setup**: [Complete Integration Guide](../WHATSAPP_INTEGRATION_GUIDE.md)
- **Quick Start**: [5-Step Setup](QUICK_WHATSAPP_SETUP.md)
- **UI Help**: [Platform Walkthrough](WHATSAPP_UI_GUIDE.md)
- **Problems**: [Troubleshooting](WHATSAPP_TROUBLESHOOTING.md)
- **Overview**: [Documentation Index](README.md)
