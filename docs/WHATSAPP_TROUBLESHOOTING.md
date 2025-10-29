# WhatsApp Integration - Troubleshooting Guide

## 🔍 Common Issues & Solutions

This guide helps you diagnose and fix common WhatsApp integration issues.

---

## Issue 1: Webhook Verification Fails

### Symptoms
- ❌ Red X or error in Meta webhook settings
- Error: "The callback URL or verify token couldn't be validated"
- Webhook shows as "Not Verified"

### Root Causes & Solutions

#### Cause A: Verify Token Mismatch
**Problem**: The verify token in Meta doesn't match your `.env.local`

**Solution**:
1. Open your `.env.local` file
2. Find `META_WEBHOOK_VERIFY_TOKEN=your_secure_verify_token_here_123`
3. Copy the exact value (e.g., `your_secure_verify_token_here_123`)
4. Go to Meta → WhatsApp → Configuration → Webhook
5. Enter the EXACT SAME token in "Verify Token" field
6. Click "Verify and Save"

#### Cause B: Platform Not Accessible
**Problem**: Your platform isn't publicly accessible via HTTPS

**Solution**:
1. Ensure your app is deployed (not running on localhost)
2. Verify HTTPS is enabled (Meta requires HTTPS)
3. Test webhook URL in browser: `https://your-domain.com/api/meta-webhook`
4. Should see: `"MISSING_PARAMETERS"` (this is correct!)

#### Cause C: Incorrect Webhook URL
**Problem**: Webhook URL has typos or wrong format

**Solution**:
1. Correct format: `https://your-domain.com/api/meta-webhook`
2. NOT: `http://` (must be HTTPS)
3. NOT: `https://localhost:3000/api/meta-webhook` (localhost won't work)
4. NOT: `https://your-domain.com/api/meta-webhook/` (no trailing slash)

#### Cause D: Firewall/Security Blocking Meta
**Problem**: Server firewall blocks Meta's verification request

**Solution**:
1. Ensure your hosting allows incoming requests from Meta's IP ranges
2. Check server logs for blocked requests
3. Whitelist Meta's webhook IPs if needed

### Verification Test
Run this in your browser:
```
https://your-domain.com/api/meta-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123
```

**Expected Response**: Should display `test123`

---

## Issue 2: Messages Not Received

### Symptoms
- User sends message to WhatsApp Business number
- No response received
- Platform doesn't log the message

### Diagnosis Steps

#### Step 1: Check Webhook Subscription
1. Go to Meta App → WhatsApp → Configuration
2. Under "Webhook fields", ensure **"messages"** is checked ✅
3. If not checked, check it and save

#### Step 2: Check Platform Logs
1. Access your server/deployment logs
2. Look for incoming POST requests to `/api/meta-webhook`
3. If you see requests: Good! Webhook is working
4. If no requests: Webhook not configured correctly in Meta

#### Step 3: Check WhatsApp Number Status
1. In platform, go to WhatsApp Numbers
2. Find your number card
3. Check status badge:
   - 🟢 **Active**: Should work
   - ⚫ **Inactive**: Change to Active

#### Step 4: Verify Phone Number ID
1. In platform, check "Phone Number ID" field
2. In Meta, go to WhatsApp → Getting Started
3. Verify the Phone Number ID matches exactly
4. If different, edit in platform with correct ID

### Solutions

#### Solution A: Re-subscribe Webhook
1. Meta App → WhatsApp → Configuration
2. Uncheck "messages" field
3. Save changes
4. Re-check "messages" field
5. Save again
6. Test by sending message

#### Solution B: Check Environment Variables
```bash
# Required in .env.local
META_WEBHOOK_VERIFY_TOKEN=your_token_here

# Optional but recommended
WHATSAPP_VOICE_AGENT_ID=your-default-agent-id
```

#### Solution C: Verify Deployment
1. Ensure latest code is deployed
2. Restart your application server
3. Clear any caches
4. Test webhook endpoint manually

---

## Issue 3: No Response Sent (Message Received But No Reply)

### Symptoms
- Platform receives message (logs show it)
- Message saved to database
- But no reply sent to WhatsApp user

### Diagnosis Steps

#### Step 1: Check Access Token
**Problem**: Invalid or expired access token

**Test**:
```bash
curl -X GET "https://graph.facebook.com/v20.0/me?access_token=YOUR_ACCESS_TOKEN"
```

**Expected**: Returns app info
**If Error**: Token is invalid/expired

**Solution**:
1. Create a System User token (doesn't expire)
2. Go to Business Settings → Users → System Users
3. Create user with Admin role
4. Generate token with `whatsapp_business_messaging` permission
5. Update in platform (Edit WhatsApp Number)

#### Step 2: Check Agent Configuration
1. In platform, check which agent is linked
2. If "Not linked", either:
   - Link an agent in WhatsApp number settings, OR
   - Set `WHATSAPP_VOICE_AGENT_ID` in `.env.local`
3. Verify the agent has:
   - Valid prompt configured
   - LLM model selected
   - Status is active

#### Step 3: Check Meta Credentials
1. In platform, edit WhatsApp number
2. Verify all Meta credentials are correct:
   - App ID
   - App Secret
   - Business ID
   - Access Token
   - Graph API Version

#### Step 4: Check API Permissions
1. Go to Meta App → App Review → Permissions and Features
2. Ensure `whatsapp_business_messaging` permission is approved
3. For production, submit for app review if needed

### Solutions

#### Solution A: Update Access Token
1. Generate new System User token
2. Edit WhatsApp number in platform
3. Enter new access token
4. Save changes
5. Test by sending message

#### Solution B: Link Agent
1. Edit WhatsApp number
2. Select agent from "Link to Agent" dropdown
3. Save changes
4. OR set in `.env.local`:
```bash
WHATSAPP_VOICE_AGENT_ID=your-agent-id-here
```

#### Solution C: Check Phone Number API Limit
- Meta has rate limits for sending messages
- Free tier: Limited messages per day
- Check Meta Business Manager for quota usage

---

## Issue 4: Wrong/Unexpected Responses

### Symptoms
- Messages received and replied
- But responses don't make sense
- Responses not in expected format

### Diagnosis

#### Check Agent Prompt
1. Go to Dashboard → Voice Agents
2. Find the linked agent
3. Edit the agent
4. Review the "Initial Prompt" field

### Solutions

#### Solution A: Customize Agent Prompt
Create a WhatsApp-specific prompt:

```
You are a helpful WhatsApp assistant for [Your Business Name].

Context: You are responding to customers via WhatsApp messaging.

Your role:
- Provide helpful, concise responses
- Use friendly, conversational tone
- Keep responses short (WhatsApp users prefer brevity)
- If you don't know something, admit it honestly

Available information:
[Your business information, FAQs, policies, etc.]

Remember:
- Respond in the same language as the user
- Be professional but friendly
- Don't use markdown or special formatting
- Use emojis sparingly and appropriately
```

#### Solution B: Add Knowledge Files
1. Edit the agent
2. Scroll to "Knowledge Base" section
3. Upload CSV or text files with:
   - Product information
   - FAQs
   - Company policies
   - Common answers

#### Solution C: Test in Playground
1. Use the agent in the main chat interface
2. Test various messages
3. Refine prompt based on results
4. Then test via WhatsApp

---

## Issue 5: Slow Response Time

### Symptoms
- Messages received
- Response sent
- But takes 10+ seconds

### Diagnosis & Solutions

#### Cause A: LLM Model Too Slow
**Solution**: Choose a faster LLM model
1. Edit agent
2. Try different models:
   - Fast: Gemini 1.5 Flash
   - Balanced: GPT-3.5 Turbo
   - Slow but better: GPT-4, Claude

#### Cause B: Large Knowledge Base
**Solution**: Optimize knowledge files
1. Keep knowledge files under 100KB total
2. Remove unnecessary information
3. Use concise, well-structured data

#### Cause C: Server Resources
**Solution**: Scale up hosting
1. Check server CPU/memory usage
2. Upgrade hosting plan if needed
3. Consider serverless functions for scaling

---

## Issue 6: Duplicate Messages

### Symptoms
- User sends one message
- Receives multiple identical responses
- Logs show message processed multiple times

### Diagnosis

#### Check Webhook Configuration
**Problem**: Multiple webhooks configured

**Solution**:
1. Go to Meta App → WhatsApp → Configuration
2. Ensure only ONE webhook URL is configured
3. Delete any duplicate webhooks

#### Check for Multiple Platform Instances
**Problem**: Multiple app instances running

**Solution**:
1. Ensure only one deployment is active
2. Stop any local development servers
3. Check for duplicate Vercel/Heroku deployments

---

## Issue 7: "WhatsApp number already exists" Error

### Symptoms
- Trying to add WhatsApp number
- Get error: "WhatsApp number already exists"
- Can't add the number

### Solutions

#### Solution A: Number Already Configured
1. Go to WhatsApp Numbers list
2. Search for the number (including country code)
3. If exists, edit it instead of creating new
4. Or delete old one and re-add

#### Solution B: Normalization Issue
**Problem**: Number stored with different formatting

**Try**:
- If you entered: `+1-555-123-4567`
- Try: `+15551234567` (no hyphens)
- Or vice versa

#### Solution C: Check Database
If you have database access:
```javascript
// In MongoDB
db.whatsappnumbers.find({ phoneNumber: { $regex: "5551234567" } })
```

Delete duplicate if found.

---

## Issue 8: Authentication/Login Issues

### Symptoms
- Can't access WhatsApp Numbers page
- Redirected to login
- "Unauthorized" errors

### Solutions

#### Solution A: Login Required
1. Ensure you're logged into the platform
2. Check session isn't expired
3. Clear browser cookies and re-login

#### Solution B: User ID Mismatch
**Current Limitation**: Platform uses hardcoded `userId=mukul`

**Temporary Fix**:
- Use the same user account
- Or modify code to use dynamic user ID

**Future Fix**: Implement proper authentication

---

## Issue 9: Webhook URL Shows as Relative Path

### Symptoms
- Webhook URL shows as `/api/meta-webhook`
- Should show full URL like `https://domain.com/api/meta-webhook`

### Solution

#### Set Environment Variable
1. Edit `.env.local`
2. Add or update:
```bash
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```
3. Redeploy application
4. Refresh WhatsApp Numbers page

---

## Issue 10: Can't Copy Webhook URL

### Symptoms
- Clicking copy icon doesn't work
- "Copied!" message doesn't appear

### Solutions

#### Solution A: Browser Permissions
1. Allow clipboard access in browser
2. Click the 🔓 icon in address bar
3. Enable clipboard permissions

#### Solution B: Manual Copy
1. Click the 🔗 external link icon
2. Copy URL from browser address bar
3. Or right-click webhook URL text and copy

#### Solution C: Use Different Browser
- Try Chrome, Firefox, or Edge
- Some browsers have better clipboard support

---

## Diagnostic Tools

### Test Webhook Manually

```bash
# Test GET (verification)
curl "https://your-domain.com/api/meta-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"

# Expected: Returns "test"
```

### Test Message Sending

```bash
# Test POST (send message via Meta API)
curl -X POST \
  "https://graph.facebook.com/v20.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_PHONE_NUMBER",
    "type": "text",
    "text": {
      "body": "Test message"
    }
  }'
```

### Check Database

```javascript
// Check WhatsApp numbers
db.whatsappnumbers.find({}).pretty()

// Check recent messages
db.whatsappmessages.find({}).sort({ createdAt: -1 }).limit(10).pretty()

// Check agents
db.voiceagents.find({}).pretty()
```

### Monitor Logs

```bash
# If using Vercel
vercel logs

# If using PM2
pm2 logs

# If using Docker
docker logs <container-name>

# If using systemd
journalctl -u your-service -f
```

---

## Getting Help

If you're still stuck after trying these solutions:

### 1. Check Logs First
- Server/application logs
- Browser console (F12)
- Meta app dashboard errors

### 2. Verify Configuration
- All credentials correct?
- Webhook verified in Meta?
- Environment variables set?
- Agent properly configured?

### 3. Test Each Component
- Webhook endpoint responding?
- Database accessible?
- Agent generating responses?
- Meta API credentials valid?

### 4. Review Documentation
- [WhatsApp Integration Guide](WHATSAPP_INTEGRATION_GUIDE.md)
- [Quick Setup Guide](QUICK_WHATSAPP_SETUP.md)
- [UI Walkthrough](WHATSAPP_UI_GUIDE.md)
- [Meta WhatsApp Docs](https://developers.facebook.com/docs/whatsapp)

### 5. Common Checklist
- [ ] Webhook URL is HTTPS
- [ ] Verify token matches in Meta and `.env.local`
- [ ] Webhook subscribed to "messages" field
- [ ] WhatsApp number status is "Active"
- [ ] Access token is valid and has permissions
- [ ] Agent is linked and configured
- [ ] Platform is deployed and accessible
- [ ] No firewall blocking Meta requests

---

## Error Messages Reference

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "VERIFICATION_FAILED" | Verify token mismatch | Check `META_WEBHOOK_VERIFY_TOKEN` |
| "MISSING_PARAMETERS" | Missing webhook params | Normal for direct browser access |
| "WhatsApp number already exists" | Duplicate number | Edit existing or delete first |
| "Failed to fetch WhatsApp numbers" | Database error | Check MongoDB connection |
| "Invalid access token" | Token expired/wrong | Generate new System User token |
| "phoneNumberId is required" | Missing Phone Number ID | Get from Meta WhatsApp settings |
| "Failed to create WhatsApp number" | Server error | Check server logs |
| "(#100) Param to must be a valid WhatsApp user" | Invalid recipient | Check phone number format |

---

## Pro Tips

1. **Always Use System User Tokens**: Temporary tokens expire in 24 hours
2. **Test Locally First**: Use ngrok to test webhooks locally
3. **Monitor Webhook Health**: Set up alerts for webhook failures
4. **Keep Credentials Secure**: Never commit to version control
5. **Use Separate Numbers for Test/Prod**: Avoid mixing environments
6. **Document Your Setup**: Keep notes on which credentials go where
7. **Regular Testing**: Send test messages periodically to ensure it's working
8. **Check Meta Status**: [Meta Status Page](https://status.fb.com/)

---

**Still Need Help?**
- Review the [complete integration guide](WHATSAPP_INTEGRATION_GUIDE.md)
- Check [Meta's troubleshooting docs](https://developers.facebook.com/docs/whatsapp/troubleshooting)
- Examine your server logs carefully
- Test each component individually
