# Telephony Service Integration Guide

## Overview

This guide explains how to integrate your voice bot builder with telephony service providers like Exotel to enable real phone call capabilities.

## Features

- ✅ Import and manage phone numbers from Exotel
- ✅ Link phone numbers to specific AI agents
- ✅ Receive webhook URLs for Exotel configuration
- ✅ Handle incoming calls through HTTP webhooks
- ✅ Real-time call logging and session management
- ✅ Support for multiple regions (India, USA, Singapore, UAE)

## Setup Process

### 1. Import a Phone Number

1. **Navigate to Dashboard** → Click "Phone Number" in the sidebar
2. **Click "Import Phone Number"**
3. **Fill in the details:**
   - **Phone Number**: Your Exotel number (e.g., +919876543210)
   - **Display Name**: Friendly name (e.g., "Support Line", "Sales Number")
   - **Provider**: Select "Exotel"

4. **Exotel Configuration:**
   - **API Key**: Your Exotel API Key
   - **API Token**: Your Exotel API Token
   - **SID (Account SID)**: Your Exotel Account SID
   - **App ID** (Optional): Exotel App ID if you have one
   - **Domain**: Exotel API domain (default: `api.in.exotel.com`)
   - **Region**: Select your region:
     - `in` - India
     - `us` - USA
     - `sg` - Singapore
     - `ae` - UAE

5. **Link to Agent** (Optional):
   - Select an AI agent to handle calls to this number
   - If not selected, the system will use the most recent agent

6. **Click "Import Phone Number"**

### 2. Configure Exotel Portal

After importing, you'll receive two URLs:

#### A. HTTPS Webhook URL
```
https://your-domain.com/api/telephony/webhook/{phone_id}
```

**Configure in Exotel:**
1. Log in to your Exotel Dashboard
2. Go to **App Bazaar** → **Your App**
3. Set **Answer URL** to the HTTPS Webhook URL
4. Set HTTP Method to **POST**
5. Save the configuration

#### B. WebSocket URL (For Real-Time Streaming)
```
wss://your-domain.com/api/telephony/ws/{phone_id}
```

**Note:** WebSocket support requires additional server setup. For production, consider:
- Deploying a separate WebSocket server
- Using Exotel's HTTP callback approach
- See "WebSocket Setup" section below

### 3. Test the Integration

1. **Call your Exotel number** from your mobile phone
2. **The system will:**
   - Receive the webhook from Exotel
   - Find the linked agent
   - Greet the caller
   - Handle the conversation using AI

3. **Monitor the call** in:
   - Dashboard → Call Logs (view all calls)
   - Dashboard → Chat History (view conversation details)

## How It Works

### Call Flow

```
[Caller] → [Exotel] → [Your Webhook] → [AI Agent] → [TTS] → [Exotel] → [Caller]
```

1. **Incoming Call**: User calls your Exotel number
2. **Webhook Trigger**: Exotel sends a POST request to your webhook URL
3. **Agent Selection**: System finds the linked agent for that number
4. **Session Creation**: A unique session ID is generated for the call
5. **AI Processing**:
   - User speech → STT (Speech-to-Text)
   - Text → LLM (AI Processing)
   - AI Response → TTS (Text-to-Speech)
   - Audio → Sent back to caller
6. **Call Logging**: All conversations are logged in the database

### Data Flow

```typescript
// Exotel sends webhook with:
{
  CallSid: "unique_call_id",
  From: "+919876543210",      // Caller
  To: "+911234567890",        // Your Exotel number
  Status: "in-progress",
  // ... other parameters
}

// Your system responds with XML:
<Response>
  <Say>Hello! Please wait...</Say>
  <Connect>
    <Stream url="wss://your-domain.com/ws/123">
      <Parameter name="sessionId" value="session_123" />
    </Stream>
  </Connect>
</Response>
```

## API Reference

### Phone Numbers API

#### GET /api/phone-numbers
Fetch all phone numbers for a user.

**Query Parameters:**
- `userId` (optional): User ID (default: 'mukul')

**Response:**
```json
{
  "success": true,
  "phoneNumbers": [
    {
      "id": "...",
      "phoneNumber": "+919876543210",
      "displayName": "Support Line",
      "provider": "exotel",
      "linkedAgentId": "agent_123",
      "webhookUrl": "https://...",
      "websocketUrl": "wss://...",
      "status": "active"
    }
  ]
}
```

#### POST /api/phone-numbers
Import a new phone number.

**Body:**
```json
{
  "phoneNumber": "+919876543210",
  "displayName": "Support Line",
  "provider": "exotel",
  "exotelConfig": {
    "apiKey": "your_api_key",
    "apiToken": "your_api_token",
    "sid": "your_account_sid",
    "appId": "optional_app_id",
    "domain": "api.in.exotel.com",
    "region": "in"
  },
  "linkedAgentId": "agent_id"
}
```

#### PUT /api/phone-numbers
Update a phone number.

**Body:**
```json
{
  "id": "phone_id",
  "displayName": "New Name",
  "linkedAgentId": "new_agent_id",
  "status": "active"
}
```

#### DELETE /api/phone-numbers?id={phone_id}
Delete a phone number.

### Webhook API

#### POST /api/telephony/webhook/[phoneId]
Receives incoming call webhooks from Exotel.

**Exotel sends:**
- Form data or JSON with call parameters
- CallSid, From, To, Status, etc.

**Your system responds:**
- XML response (TwiML-like format)
- Instructs Exotel on how to handle the call

## WebSocket Setup (Advanced)

For real-time audio streaming, you need a WebSocket server. Here's how:

### Option 1: Separate WebSocket Server (Recommended)

Create `websocket-server.js`:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const phoneId = extractPhoneIdFromUrl(req.url);
  
  ws.on('message', async (audioData) => {
    // 1. Decode audio from Exotel format
    const audioBuffer = Buffer.from(audioData);
    
    // 2. Speech-to-Text
    const text = await sttService.transcribe(audioBuffer);
    
    // 3. Get AI response
    const response = await llmService.generate(text);
    
    // 4. Text-to-Speech
    const audio = await ttsService.synthesize(response);
    
    // 5. Send audio back to Exotel
    ws.send(audio);
  });
  
  ws.on('close', () => {
    console.log('Call ended');
  });
});
```

Run: `node websocket-server.js`

### Option 2: Use HTTP Callbacks

Instead of WebSocket, use Exotel's HTTP callback approach:
- Record the call
- Get recording URL
- Process offline
- Call back the customer if needed

## Session ID Management

### Problem: Multiple Session IDs

The system was creating new session IDs on every message, causing fragmented call logs.

### Solution: Consistent Session ID

**Frontend must:**
1. Generate a session ID when starting a call
2. Send the same session ID with every message in that call
3. Generate a new session ID only for new calls

**Example (in VoiceAIAgent.tsx):**
```typescript
// ✅ Correct: Generate once per call
const [sessionId, setSessionId] = useState('');

useEffect(() => {
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  setSessionId(newSessionId);
}, []); // Empty dependency array

// Always use the same sessionId for all messages in this call
```

**LLM API behavior:**
- If `sessionId` is provided → Use it (no new ID generated)
- If `sessionId` is missing → Generate new one (only as fallback)

### Best Practices

1. **Web Calls**: Generate session ID when user clicks "Start Call"
2. **Phone Calls**: Use Exotel's `CallSid` as session ID prefix
3. **Text Chat**: Generate session ID when opening chat interface
4. **Persistence**: Keep session ID in state for the entire conversation

## Troubleshooting

### Issue: Webhook not receiving calls

**Check:**
1. Webhook URL is correctly configured in Exotel portal
2. Your server is accessible from the internet (use ngrok for local testing)
3. HTTPS is enabled (Exotel requires HTTPS)
4. Phone number is active in database

### Issue: Agent not responding

**Check:**
1. Phone number is linked to an agent
2. Agent has a valid prompt configured
3. LLM API keys are configured (.env.local)
4. TTS service is working

### Issue: Multiple session IDs in call logs

**Fix:**
1. Ensure frontend generates session ID once per call
2. Check VoiceAIAgent component for session ID generation
3. Verify session ID is passed to all API calls

### Issue: WebSocket connection fails

**Solution:**
- Use HTTP webhook approach instead
- Deploy separate WebSocket server
- Check WebSocket support in your hosting platform

## Environment Variables

Add to `.env.local`:

```bash
# App URL (required for webhook URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Exotel Configuration (optional, can be set per-number in UI)
EXOTEL_API_KEY=your_api_key
EXOTEL_API_TOKEN=your_api_token
EXOTEL_SID=your_account_sid

# AI Services (required)
GEMINI_API_KEY=your_gemini_key
# ... other service keys
```

## Security Considerations

1. **API Keys**: Never expose Exotel credentials in frontend
2. **Webhook Verification**: Validate webhooks are from Exotel
3. **HTTPS**: Always use HTTPS for webhooks
4. **Rate Limiting**: Implement rate limiting on webhook endpoint
5. **Authentication**: Add API key verification for webhooks

## Cost Optimization

1. **Message Filtering**: Only save chats with >2 messages (already implemented)
2. **Recording**: Disable recording for non-critical calls
3. **Caching**: Cache AI responses for common queries
4. **Monitoring**: Track costs per call in dashboard

## Next Steps

1. ✅ Import your first phone number
2. ✅ Link it to an agent
3. ✅ Configure webhook in Exotel portal
4. ✅ Test with a real call
5. 📊 Monitor calls in Call Logs
6. 🔧 Optimize based on usage patterns

## Support

For issues or questions:
- Check Exotel documentation: https://developer.exotel.com
- Review call logs in Dashboard
- Check server logs for webhook errors
- Contact your Exotel support team

---

**Last Updated**: October 14, 2025
**Version**: 1.0.0
