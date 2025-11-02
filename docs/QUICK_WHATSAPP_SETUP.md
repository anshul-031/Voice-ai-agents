# Quick WhatsApp Setup Checklist

## 🚀 Quick Start (5 Steps)

### Step 1: Meta Developer Setup (5 minutes)
1. Go to https://developers.facebook.com/apps
2. Create new app → Select "Business" type
3. Add "WhatsApp" product to your app
4. Copy these credentials:
   - App ID (Settings → Basic)
   - App Secret (Settings → Basic)
   - Phone Number ID (WhatsApp → Getting Started)

### Step 2: Get Access Token (2 minutes)
1. In WhatsApp → Getting Started
2. Copy **Temporary access token** (for testing)
3. **For Production**: Create System User Token:
   - Business Settings → Users → System Users
   - Create user with Admin role
   - Generate token with `whatsapp_business_messaging` permission

### Step 3: Get Business ID (1 minute)
1. Open Meta Business Suite: https://business.facebook.com
2. Go to Business Settings
3. Copy your Business ID from the top

### Step 4: Configure Webhook (3 minutes)
1. In Meta app → WhatsApp → Configuration
2. Click "Edit" under Webhook
3. Enter:
   - **Callback URL**: `https://your-domain.com/api/meta-webhook`
   - **Verify Token**: `your_secure_verify_token_here_123` (match your .env)
4. Subscribe to fields: `messages`

### Step 5: Add Number in Platform (2 minutes)
1. Open your platform → Dashboard → WhatsApp Numbers
2. Click "Add WhatsApp Number"
3. Fill in the form with credentials from Steps 1-3
4. Click "Add WhatsApp Number"

## ✅ Verification

Send a message to your WhatsApp Business number and verify:
- [ ] Message received by platform (check logs)
- [ ] AI agent processes message
- [ ] Response sent back to WhatsApp
- [ ] You see the reply in WhatsApp

## 📋 Credentials Summary

You need these 5 credentials:

| Credential | Where to Find | Example |
|------------|---------------|---------|
| App ID | Meta App → Settings → Basic | `123456789012345` |
| App Secret | Meta App → Settings → Basic | `a1b2c3d4...` |
| Phone Number ID | Meta App → WhatsApp → Getting Started | `987654321098765` |
| Business ID | Meta Business Settings | `111222333444555` |
| Access Token | WhatsApp → Getting Started (or System User) | `EAAxxxxx...` |

## 🔧 Environment Variables

Add to your `.env.local`:

```bash
# Required for webhook verification
META_WEBHOOK_VERIFY_TOKEN=your_secure_verify_token_here_123

# Optional: Default agent for WhatsApp
WHATSAPP_VOICE_AGENT_ID=your-agent-id
```

## 🌐 Webhook URL Format

Your webhook URL will be:
```
https://your-deployed-domain.com/api/meta-webhook
```

**Important**: 
- Must be HTTPS (not HTTP)
- Must be publicly accessible
- Must match the URL in Meta webhook settings

## 🎯 Common Issues & Fixes

### Issue: Webhook verification fails
**Fix**: Ensure `META_WEBHOOK_VERIFY_TOKEN` in `.env.local` matches the verify token in Meta settings

### Issue: Messages not received
**Fix**: 
1. Check webhook is verified (green checkmark in Meta)
2. Ensure platform is deployed and accessible
3. Check server logs for incoming webhooks

### Issue: No response sent
**Fix**:
1. Verify access token has correct permissions
2. Check agent is linked to WhatsApp number
3. Verify all Meta credentials are correct

### Issue: Agent not responding correctly
**Fix**:
1. Check agent prompt is configured
2. Verify LLM model is selected
3. Ensure knowledge files are uploaded (if needed)

## 📚 Full Documentation

For detailed step-by-step instructions, see:
- [WHATSAPP_INTEGRATION_GUIDE.md](../WHATSAPP_INTEGRATION_GUIDE.md)

## 💡 Pro Tips

1. **Testing**: Use Meta's test numbers before going live
2. **Tokens**: Use System User tokens for production (don't expire)
3. **Monitoring**: Check logs regularly for webhook health
4. **Security**: Never commit credentials to version control
5. **Agents**: Create specific agents for WhatsApp with appropriate prompts

---

**Need Help?** 
- Check Meta docs: https://developers.facebook.com/docs/whatsapp
- Review platform logs for errors
- Verify all credentials are correct
