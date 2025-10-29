# WhatsApp Integration Guide

## Overview
This guide will walk you through connecting your AI voice agent to a WhatsApp Business number using Meta's WhatsApp Business API. Once configured, users can message your WhatsApp number and receive automated AI-powered responses.

---

## Prerequisites

Before you begin, ensure you have:

1. **Meta Business Account** - Create at [business.facebook.com](https://business.facebook.com)
2. **WhatsApp Business Account** - Set up through Meta Business Suite
3. **Meta Developer Account** - Register at [developers.facebook.com](https://developers.facebook.com)
4. **WhatsApp Business Phone Number** - A verified phone number for your business
5. **Your Platform Deployed** - This application must be publicly accessible (for webhooks)

---

## Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name**: Your application name (e.g., "My AI Agent Platform")
   - **App Contact Email**: Your business email
   - **Business Account**: Select your Meta Business Account
5. Click **"Create App"**

---

## Step 2: Add WhatsApp Product to Your App

1. From your app dashboard, find **"Add Products to Your App"**
2. Click **"Set Up"** on the **WhatsApp** product
3. Select your **WhatsApp Business Account** (or create a new one)
4. Add a phone number or use the test number provided by Meta

---

## Step 3: Get Your API Credentials

You'll need these credentials to connect your WhatsApp number in the platform:

### 3.1 App ID and App Secret
1. In your Meta app dashboard, go to **Settings → Basic**
2. Copy your **App ID**
3. Click **"Show"** next to **App Secret** and copy it (keep this secure!)

### 3.2 Phone Number ID
1. In your app dashboard, go to **WhatsApp → Getting Started**
2. Under **"Send and receive messages"**, find your **Phone Number ID**
3. Copy this ID (looks like: `123456789012345`)

### 3.3 Business ID
1. In Meta Business Suite, go to **Business Settings**
2. Copy your **Business ID** from the top of the page

### 3.4 Access Token
1. In your app dashboard, go to **WhatsApp → Getting Started**
2. Under **"Temporary access token"**, copy the token
3. **Important**: For production, generate a **System User Token**:
   - Go to **Business Settings → Users → System Users**
   - Create a system user with **"Admin"** role
   - Generate a token with `whatsapp_business_messaging` permission
   - This token doesn't expire and is recommended for production

---

## Step 4: Configure Webhook in Meta

### 4.1 Get Your Webhook URL
1. Log into your AI Agent Platform
2. Navigate to **WhatsApp Numbers** section
3. The webhook URL format is:
   ```
   https://your-domain.com/api/meta-webhook
   ```
   Replace `your-domain.com` with your actual deployed URL

### 4.2 Set Up Webhook in Meta
1. In your Meta app dashboard, go to **WhatsApp → Configuration**
2. Click **"Edit"** in the Webhook section
3. Enter your webhook details:
   - **Callback URL**: `https://your-domain.com/api/meta-webhook`
   - **Verify Token**: Any secure string (e.g., `my_secure_verify_token_123`)
   - Click **"Verify and Save"**

4. **Subscribe to Webhook Fields**:
   - Check **"messages"** - Required for receiving messages
   - Optionally check other fields like **"message_status"**

---

## Step 5: Add WhatsApp Number in Platform

Now that you have all the credentials, add your WhatsApp number to the platform:

### 5.1 Open the Add WhatsApp Number Modal
1. Log into your platform
2. Navigate to **Dashboard → WhatsApp Numbers**
3. Click **"Add WhatsApp Number"** button

### 5.2 Fill in the Form

#### Basic Information
- **WhatsApp Number**: Your business phone number (e.g., `+1-234-567-8900`)
- **Display Name**: A friendly name (e.g., `"Support WhatsApp"` or `"Customer Service"`)
- **Phone Number ID**: The ID from Step 3.2
- **Status**: Select `Active`

#### Link to Agent (Optional)
- **Link to Agent**: Select which AI voice agent should handle messages
  - If you don't select an agent, the system will use the default agent configured in environment variables

#### Meta Credentials
- **App ID**: From Step 3.1
- **App Secret**: From Step 3.1
- **Business ID**: From Step 3.3
- **Access Token**: From Step 3.4
- **Graph API Version**: Use `v20.0` (or latest version)

### 5.3 Save Configuration
1. Review all information
2. Click **"Add WhatsApp Number"**
3. You should see a success message

---

## Step 6: Test Your Integration

### 6.1 Send a Test Message
1. From any WhatsApp account, send a message to your WhatsApp Business number
2. Example: "Hello, I need help with my order"

### 6.2 Verify the Response
- Your AI agent should automatically respond based on its configuration
- Check the conversation history in your platform dashboard
- Monitor logs for any errors

### 6.3 Troubleshooting
If messages aren't working:

1. **Check Webhook Status**:
   - In Meta app dashboard → WhatsApp → Configuration
   - Ensure webhook is verified (green checkmark)

2. **Verify Webhook URL**:
   - Ensure your platform is publicly accessible
   - Test the webhook endpoint: `https://your-domain.com/api/meta-webhook`

3. **Check Credentials**:
   - Verify all credentials are correct
   - Ensure access token has proper permissions

4. **Review Platform Logs**:
   - Check server logs for webhook receipt
   - Look for any error messages

5. **Check Agent Configuration**:
   - Ensure the linked agent has a valid prompt
   - Verify LLM, STT, and TTS models are configured

---

## How It Works

### Message Flow
1. **User sends WhatsApp message** → WhatsApp Business API
2. **Meta sends webhook** → Your platform (`/api/meta-webhook`)
3. **Platform receives message** → Identifies WhatsApp number and linked agent
4. **AI processes message** → Generates response using configured LLM
5. **Platform sends reply** → Via Meta WhatsApp API
6. **User receives response** → In WhatsApp conversation

### Database Storage
- All messages are stored in `WhatsAppMessage` collection
- Conversation history is maintained per user
- Session management tracks ongoing conversations

### Agent Knowledge Integration
If you've added knowledge files (CSV/text) to your agent:
- The agent will use this knowledge to provide more accurate responses
- Knowledge is included in the AI prompt context
- Responses will be more specific to your business/use case

---

## Advanced Configuration

### Environment Variables
For system-wide configuration, set these in your `.env.local`:

```bash
# WhatsApp Configuration
WHATSAPP_VOICE_AGENT_ID=your-default-agent-id
NEXT_PUBLIC_META_WHATSAPP_API_URL=https://graph.facebook.com/v20.0
NEXT_PUBLIC_META_WHATSAPP_API_TOKEN=your-system-user-token
```

### Multiple WhatsApp Numbers
You can add multiple WhatsApp numbers:
- Each number can be linked to a different agent
- Each number has its own Meta credentials
- Messages are routed based on the recipient phone number ID

### Custom Webhook Paths
The webhook URL is automatically generated as:
```
https://your-domain.com/api/meta-webhook
```

When you view your WhatsApp numbers in the dashboard, the full webhook URL is displayed for easy copying.

---

## Security Best Practices

1. **Keep Credentials Secret**:
   - Never commit App Secret or Access Tokens to version control
   - Use environment variables for sensitive data
   - Rotate tokens regularly

2. **Use System User Tokens**:
   - For production, always use System User tokens (don't expire)
   - Temporary tokens expire in 24 hours

3. **Verify Webhook Requests**:
   - The platform validates webhook signatures from Meta
   - Only accept requests from Meta's IP ranges

4. **HTTPS Required**:
   - Meta requires HTTPS for webhook URLs
   - Ensure your platform has a valid SSL certificate

---

## Limitations & Quotas

### Meta WhatsApp Business API Limits
- **Free Tier**: 1,000 conversations/month
- **Rate Limits**: Varies by tier (check Meta documentation)
- **Message Templates**: Required for business-initiated conversations (after 24 hours)

### Platform Limits
- **Message History**: Stored indefinitely (monitor database size)
- **Concurrent Sessions**: Limited by server resources
- **Response Time**: Depends on LLM provider latency

---

## FAQ

### Q: Can I use a personal WhatsApp number?
**A:** No, you must use a WhatsApp Business number registered through Meta Business.

### Q: Do I need to pay for WhatsApp Business API?
**A:** Meta provides 1,000 free conversations per month. Beyond that, charges apply based on conversation volume and country.

### Q: How do I handle message templates?
**A:** Templates are required for business-initiated messages. Currently, this platform handles user-initiated conversations (24-hour window).

### Q: Can I test without a production Meta app?
**A:** Yes, use Meta's test phone numbers and temporary tokens for development/testing.

### Q: What happens if my webhook goes down?
**A:** Meta will retry webhook delivery. Messages may be delayed but not lost. Monitor webhook health.

### Q: Can I customize the AI responses?
**A:** Yes! Edit your voice agent's prompt in the platform to customize behavior and responses.

### Q: How do I see conversation history?
**A:** Navigate to Dashboard → Call Logs (will show WhatsApp conversations alongside phone calls).

---

## Support & Resources

### Meta Resources
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Meta Business Suite](https://business.facebook.com)

### Platform Documentation
- Check `PROJECT_SUMMARY.md` for technical details
- Review API routes in `app/api/` directory
- Examine models in `models/` directory

### Getting Help
1. Check server logs for error messages
2. Verify all credentials are correct
3. Test webhook connectivity
4. Review Meta app configuration
5. Contact platform support if issues persist

---

## Summary Checklist

Before going live, ensure:

- [ ] Meta app created with WhatsApp product
- [ ] WhatsApp Business number verified
- [ ] App ID, App Secret, Business ID collected
- [ ] System User token generated (for production)
- [ ] Phone Number ID obtained
- [ ] Platform deployed with HTTPS
- [ ] Webhook configured in Meta app
- [ ] Webhook verified successfully
- [ ] WhatsApp number added in platform
- [ ] AI agent configured and linked
- [ ] Test message sent and received
- [ ] Conversation logged in platform

**You're all set! Your AI agent is now connected to WhatsApp! 🎉**
