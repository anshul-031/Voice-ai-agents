# WhatsApp Integration for Voice AI Agents

## Overview

This feature allows users to connect their WhatsApp Business account to any Voice AI Agent. Once configured, users can chat with the AI agent through WhatsApp, and the agent will respond using the configured LLM (Gemini).

## Features

- ✅ Configure WhatsApp Business credentials per agent
- ✅ Receive and respond to WhatsApp messages automatically
- ✅ Send test message "hi check" to verify configuration
- ✅ Full conversation history maintained in database
- ✅ Secure webhook verification
- ✅ Visual configuration UI with status indicators

## Setup Instructions

### 1. Create a Meta Business App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details and create the app

### 2. Add WhatsApp Product

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Follow the setup wizard to:
   - Verify your business
   - Add a phone number
   - Get your test number or add your own

### 3. Get Your Credentials

You'll need the following credentials (all found in the WhatsApp dashboard):

- **App ID**: Found in App Settings → Basic
- **App Secret**: Found in App Settings → Basic (click "Show")
- **Business Account ID**: Found in WhatsApp → Getting Started
- **Access Token**: Found in WhatsApp → Getting Started → Temporary access token (or create a permanent one)
- **Phone Number ID**: Found in WhatsApp → Getting Started → Phone Number ID

### 4. Configure in the Agent

1. Open your Voice AI Agent in the dashboard
2. Scroll to the "WhatsApp Integration" section
3. Click "Configure"
4. Fill in all the credentials:
   - App ID
   - App Secret
   - Business Account ID
   - Access Token
   - Phone Number ID
5. Enable WhatsApp by toggling the switch
6. Click "Save Configuration"

### 5. Set Up Webhook in Meta Dashboard

1. Copy the Webhook URL shown in the configuration panel:
   ```
   https://your-domain.com/api/whatsapp/webhook/[agentId]
   ```

2. Go to your Meta App → WhatsApp → Configuration
3. Click "Edit" next to "Webhook"
4. Paste the Webhook URL
5. Enter the Verify Token: `pelocal_verify_token_2025`
6. Click "Verify and Save"

7. Subscribe to webhook fields:
   - Click "Manage" next to Webhook Fields
   - Subscribe to: `messages`

### 6. Test the Connection

1. In the agent configuration, click "Send Test Message"
2. Enter a phone number (with country code, e.g., +919876543210)
3. You should receive a message saying "hi check"
4. If successful, you're all set!

## How It Works

### Message Flow

```
User (WhatsApp) → Meta Platform → Your Webhook
                                      ↓
                                  Agent LLM
                                      ↓
                                 Response
                                      ↓
Meta Platform ← Your Server ← WhatsApp API
     ↓
User (WhatsApp)
```

### Webhook Processing

1. **Incoming Message**:
   - WhatsApp sends message to `/api/whatsapp/webhook/[agentId]`
   - System retrieves agent configuration and conversation history
   - Message is sent to LLM with agent's prompt
   - LLM response is sent back to WhatsApp

2. **Conversation History**:
   - Each conversation is tracked by `sessionId`: `whatsapp_[phoneNumber]_[agentId]`
   - Last 20 messages are included in context
   - History is stored in MongoDB Chat collection

## API Endpoints

### Webhook Endpoint

**GET** `/api/whatsapp/webhook/[agentId]`
- Used by Meta to verify webhook
- Requires correct verify token

**POST** `/api/whatsapp/webhook/[agentId]`
- Receives incoming WhatsApp messages
- Processes messages through LLM
- Sends responses back to user

### Test Endpoint

**POST** `/api/whatsapp/test`
```json
{
  "accessToken": "your_access_token",
  "phoneNumberId": "your_phone_number_id",
  "recipientPhone": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "Test message 'hi check' sent successfully",
  "data": { /* Meta API response */ }
}
```

## Database Schema

### VoiceAgent Model Extension

```typescript
{
  // ... existing fields
  whatsappConfig: {
    appId: String,
    appSecret: String,
    businessId: String,
    accessToken: String,
    phoneNumber: String,
    enabled: Boolean
  }
}
```

## Security Considerations

1. **Credentials Storage**: 
   - App Secret and Access Token are stored in MongoDB
   - Consider encrypting these fields in production

2. **Webhook Verification**:
   - All webhook requests are verified with token
   - Verify token is configurable via environment variable

3. **Rate Limiting**:
   - Consider adding rate limiting to prevent abuse
   - WhatsApp has its own rate limits

## Troubleshooting

### Test Message Not Received

1. **Check Credentials**: Ensure all credentials are correct
2. **Check Phone Number Format**: Must include country code (e.g., +91...)
3. **Check Access Token**: Temporary tokens expire quickly, use permanent tokens
4. **Check WhatsApp Limits**: Free tier has message limits

### Webhook Not Receiving Messages

1. **Verify Webhook URL**: Must be publicly accessible HTTPS URL
2. **Check Webhook Subscription**: Ensure "messages" field is subscribed
3. **Check Verify Token**: Must match exactly: `pelocal_verify_token_2025`
4. **Check Logs**: Server logs show incoming webhook requests

### Messages Not Getting Responses

1. **Check Agent Configuration**: Ensure WhatsApp is enabled
2. **Check LLM API**: Ensure Gemini API key is configured
3. **Check Conversation History**: Database connection issues
4. **Check Server Logs**: Look for error messages

## Environment Variables

Add to your `.env.local`:

```bash
# Optional: Custom webhook verify token
WHATSAPP_VERIFY_TOKEN=pelocal_verify_token_2025
```

## Limitations

1. **Media Messages**: Currently only text messages are supported
2. **Templates**: Custom message templates not yet supported
3. **Group Chats**: Only 1-on-1 conversations supported
4. **Rich Messages**: Buttons, lists, and other rich features coming soon

## Future Enhancements

- [ ] Support for media messages (images, audio, video)
- [ ] Message templates
- [ ] Quick reply buttons
- [ ] Group chat support
- [ ] Message analytics
- [ ] Auto-response rules
- [ ] PDF attachment sending via WhatsApp
- [ ] Voice message support

## Example Use Cases

1. **Customer Support Bot**: Answer common questions 24/7
2. **Appointment Scheduling**: Book appointments via WhatsApp
3. **Order Tracking**: Check order status through chat
4. **FAQ Assistant**: Instant answers to frequently asked questions
5. **Lead Generation**: Qualify leads through conversation

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Verify all credentials in Meta dashboard
4. Check Meta's [WhatsApp Business API documentation](https://developers.facebook.com/docs/whatsapp)

---

**Note**: This integration uses WhatsApp Business API which requires a verified business account. Free tier accounts have limited messaging capabilities.
