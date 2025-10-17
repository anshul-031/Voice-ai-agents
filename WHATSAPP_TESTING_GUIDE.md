# WhatsApp Integration Testing Guide

## Complete Step-by-Step Process to Test WhatsApp Integration

This guide will walk you through the entire process of setting up and testing the WhatsApp integration with your Voice AI Agent.

---

## Prerequisites

Before you begin, ensure you have:
- ✅ A deployed application with a public HTTPS URL (WhatsApp requires HTTPS)
- ✅ A Facebook/Meta Business Account
- ✅ A phone number to use with WhatsApp Business
- ✅ Your application is running and accessible

---

## Part 1: Set Up Meta Business App (15-20 minutes)

### Step 1: Create a Meta Developer Account

1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Click **"Get Started"** in the top right
3. Log in with your Facebook account (or create one)
4. Complete the registration process
5. Verify your email address if prompted

### Step 2: Create a New App

1. Once logged in, click **"My Apps"** in the top navigation
2. Click **"Create App"** button
3. Select **"Business"** as the app type
4. Click **"Next"**
5. Fill in the app details:
   - **App Name**: e.g., "Voice AI Agent WhatsApp"
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one
6. Click **"Create App"**
7. Complete security check if prompted

### Step 3: Add WhatsApp Product to Your App

1. In your app dashboard, scroll down to find **"Add a Product"**
2. Find **"WhatsApp"** in the product list
3. Click **"Set Up"** button next to WhatsApp
4. You'll be taken to the WhatsApp setup page

### Step 4: Get Test Phone Number (Temporary)

Meta provides a test phone number for initial testing:

1. In **WhatsApp > Getting Started** section
2. You'll see **"Test number"** with a phone number
3. Note: This test number can only send messages to up to 5 pre-registered numbers
4. Click **"Add phone number"** and enter YOUR phone number (the one you'll use for testing)
5. You'll receive a verification code on WhatsApp
6. Enter the code to verify

### Step 5: Collect Required Credentials

Now collect all the credentials you need:

#### 5.1 App ID and App Secret
1. Click on **"Settings"** in the left sidebar
2. Click **"Basic"**
3. Copy the **"App ID"** - Save this
4. Click **"Show"** next to **"App Secret"**
5. Enter your Facebook password
6. Copy the **"App Secret"** - Save this

#### 5.2 Business Account ID
1. Go back to **WhatsApp** in the left sidebar
2. Click **"Getting Started"**
3. Look for **"Business Account ID"** or **"WhatsApp Business Account ID"**
4. Copy this ID - Save this

#### 5.3 Access Token
1. Still in **WhatsApp > Getting Started**
2. Find **"Temporary access token"** section
3. Click **"Copy"** to copy the token
4. ⚠️ **Important**: Temporary tokens expire in 24 hours
5. Save this token for now (we'll use it for testing)
6. Later, you'll need to generate a permanent token (see below)

#### 5.4 Phone Number ID
1. In **WhatsApp > Getting Started**
2. Find **"Phone Number ID"** (NOT the phone number itself)
3. Copy this ID - Save this
4. It looks like: `123456789012345`

**Summary - You should now have:**
```
✅ App ID: 1234567890123456
✅ App Secret: abc123xyz789...
✅ Business Account ID: 9876543210987654
✅ Access Token: EAABsbCS...
✅ Phone Number ID: 123456789012345
```

---

## Part 2: Configure Your Voice AI Agent (5 minutes)

### Step 6: Add WhatsApp Configuration to Your Agent

1. Open your Voice AI Agent application
2. Navigate to **Dashboard** or **Agents** page
3. Click on the agent you want to connect to WhatsApp (or create a new one)
4. Scroll down to find **"WhatsApp Integration"** section
5. Click **"Configure"** button

### Step 7: Enter WhatsApp Credentials

Fill in the form with the credentials you collected:

1. **App ID**: Paste the App ID from Step 5.1
2. **App Secret**: Paste the App Secret from Step 5.1
3. **Business Account ID**: Paste the Business Account ID from Step 5.2
4. **Access Token**: Paste the Access Token from Step 5.3
5. **Phone Number ID**: Paste the Phone Number ID from Step 5.4

### Step 8: Copy Webhook URL

1. After entering the credentials, you'll see a **"Webhook URL"** field
2. It will look like:
   ```
   https://your-domain.com/api/whatsapp/webhook/[some-agent-id]
   ```
3. Click the **"Copy"** button next to the URL
4. **Save this URL** - you'll need it in the next step

### Step 9: Note the Verify Token

You'll also see:
```
Verify Token: pelocal_verify_token_2025
```

**Save this token** - you'll need it in the next step.

---

## Part 3: Configure Webhook in Meta Dashboard (5 minutes)

### Step 10: Set Up Webhook in Meta

1. Go back to [Meta for Developers](https://developers.facebook.com)
2. Open your app
3. Navigate to **WhatsApp > Configuration** in the left sidebar

### Step 11: Add Webhook URL

1. Find the **"Webhook"** section
2. Click **"Edit"** button
3. In the dialog that appears:
   - **Callback URL**: Paste the Webhook URL from Step 8
   - **Verify Token**: Enter `pelocal_verify_token_2025`
4. Click **"Verify and Save"**

**Expected Result:**
- ✅ You should see a green checkmark or "Success" message
- ✅ The webhook URL should be saved

**If verification fails:**
- Check that your application is publicly accessible (not localhost)
- Check that the URL uses HTTPS
- Check that the verify token matches exactly: `pelocal_verify_token_2025`
- Check your application logs for any errors

### Step 12: Subscribe to Webhook Events

1. Still in **WhatsApp > Configuration**
2. Find **"Webhook fields"** section
3. Click **"Manage"** or **"Edit"**
4. Find and enable **"messages"** checkbox
5. Click **"Save"** or **"Done"**

**You must subscribe to:**
- ✅ **messages** (required to receive user messages)

Optional (for future enhancements):
- ☐ message_status (to track delivery status)
- ☐ message_template_status_update
- ☐ messaging_handovers

---

## Part 4: Test the Integration (10 minutes)

### Step 13: Test Using the "Send Test Message" Feature

1. Go back to your Voice AI Agent application
2. In the WhatsApp Integration configuration panel
3. Make sure all credentials are filled in
4. Click the **"Send Test Message"** button
5. Enter a phone number (with country code, e.g., `+919876543210`)
   - ⚠️ This must be one of the numbers you added to the test number in Step 4
6. Click **"Send"**

**Expected Result:**
- ✅ You should see a success message: "Test message 'hi check' sent successfully"
- ✅ You should receive a WhatsApp message on your phone saying: **"hi check"**

**If you don't receive the message:**
- Check that the phone number is in international format (+country code + number)
- Verify the phone number was added to the test number's allowlist (Step 4)
- Check the Access Token is valid (not expired)
- Check your application logs for errors

### Step 14: Enable WhatsApp Integration

1. If the test message worked, toggle the **"Enable WhatsApp"** switch to ON
2. The status should change from ❌ to ✅
3. Click **"Save Configuration"** button

**Expected Result:**
- ✅ Configuration saved successfully
- ✅ WhatsApp integration is now active

### Step 15: Test Two-Way Conversation

Now test the actual AI conversation:

1. Open WhatsApp on your phone
2. Find the conversation with the test number
3. Send any message, for example:
   - "Hello"
   - "What can you do?"
   - "Tell me about your services"

**Expected Result:**
- ✅ Your message appears in WhatsApp as "Delivered" (1 checkmark) then "Read" (2 checkmarks)
- ✅ Within 2-5 seconds, you receive a response from the AI agent
- ✅ The response is relevant to your message
- ✅ It follows the agent's configured prompt/personality

### Step 16: Test Conversation Context

Send a follow-up message to test conversation memory:

1. Send a message: "My name is John"
2. Wait for AI response
3. Send: "What is my name?"

**Expected Result:**
- ✅ The AI should remember your name and respond accordingly
- ✅ This proves conversation history is working

### Step 17: Test Multiple Messages

Send several messages in quick succession:

1. "Hello"
2. "How are you?"
3. "What can you help me with?"

**Expected Result:**
- ✅ All messages are processed
- ✅ Responses come back in order
- ✅ No messages are lost

---

## Part 5: Verify Backend Functionality (5 minutes)

### Step 18: Check Application Logs

Monitor your application logs while testing:

```bash
# If using PM2
pm2 logs

# If using Docker
docker logs -f [container-name]

# If running directly
# Check your terminal output
```

**Look for these log entries:**

When receiving a message:
```
[WhatsApp Webhook] Incoming message: {...}
[WhatsApp Webhook] Processing message from +1234567890: Hello
```

When sending a response:
```
[WhatsApp] Message sent successfully: {...}
[WhatsApp Webhook] Response sent to +1234567890
```

**If you see errors:**
- Note the error message
- Check the specific issue (API errors, database connection, etc.)

### Step 19: Check Database (Optional)

If you want to verify data is being stored:

1. Connect to your MongoDB database
2. Check the `chats` collection
3. Look for entries with `sessionId` like: `whatsapp_1234567890_[agentId]`

**Expected Result:**
- ✅ You should see chat messages stored
- ✅ Both user messages (`source: "user"`) and AI responses (`source: "ai"`)
- ✅ Timestamps are correct

### Step 20: Test Error Handling

Test that errors are handled gracefully:

1. In Meta dashboard, temporarily change the webhook URL to something invalid
2. Try sending a message from WhatsApp
3. Check that your app doesn't crash

Then:
4. Restore the correct webhook URL
5. Send another message
6. Verify it works again

---

## Part 6: Production Setup (Optional but Recommended)

### Step 21: Generate Permanent Access Token

The temporary token expires in 24 hours. For production:

1. In Meta Dashboard, go to **WhatsApp > Getting Started**
2. Find **"Generate a permanent token"** or similar
3. Follow the steps to create a System User
4. Generate a permanent token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the permanent token
6. Update your agent configuration with the new token

### Step 22: Add Your Own Phone Number (Production)

To use your own business phone number instead of the test number:

1. In Meta Dashboard, go to **WhatsApp > Getting Started**
2. Click **"Add phone number"**
3. Follow the verification process
4. Update the Phone Number ID in your agent configuration

### Step 23: Submit App for Review (Production)

To send messages to any WhatsApp user (not just test numbers):

1. Your app needs to be reviewed by Meta
2. Go to **App Review > Permissions and Features**
3. Request **"whatsapp_business_messaging"** permission
4. Provide required information about your use case
5. Wait for approval (usually 1-3 days)

---

## Troubleshooting Guide

### Issue: Webhook Verification Failed

**Symptoms:**
- Error when saving webhook URL in Meta dashboard
- "Verification failed" message

**Solutions:**
1. Check webhook URL is publicly accessible
2. Verify URL uses HTTPS (not HTTP)
3. Ensure verify token exactly matches: `pelocal_verify_token_2025`
4. Check application logs for incoming verification request
5. Test webhook endpoint manually:
   ```bash
   curl "https://your-domain.com/api/whatsapp/webhook/[agentId]?hub.mode=subscribe&hub.verify_token=pelocal_verify_token_2025&hub.challenge=test123"
   ```
   Should return: `test123`

### Issue: Test Message Not Received

**Symptoms:**
- "Send Test Message" shows success but no WhatsApp message arrives

**Solutions:**
1. Verify phone number is in correct format: `+[country code][number]`
2. Check phone number is added to test number allowlist
3. Verify Access Token is valid (check Meta dashboard)
4. Check Phone Number ID is correct
5. Look at application logs for API errors
6. Try with a different phone number

### Issue: No Response to Messages

**Symptoms:**
- You send a message via WhatsApp but AI doesn't respond

**Solutions:**
1. Check webhook is configured and verified (green checkmark)
2. Verify "messages" is subscribed in webhook fields
3. Check WhatsApp is enabled in agent configuration
4. Look at application logs for:
   - Incoming webhook calls
   - LLM processing
   - Response sending
5. Verify agent has a valid prompt configured
6. Check Gemini API key is configured in `.env.local`

### Issue: Conversation History Not Working

**Symptoms:**
- AI doesn't remember previous messages

**Solutions:**
1. Check MongoDB connection is working
2. Verify `Chat` model is correctly saving messages
3. Look for session ID in database: `whatsapp_[phone]_[agentId]`
4. Check application logs for database errors

### Issue: Access Token Expired

**Symptoms:**
- Messages stopped working after 24 hours
- API error: "Invalid OAuth access token"

**Solutions:**
1. Generate a new temporary token from Meta dashboard
2. Update agent configuration with new token
3. For production, switch to permanent token (Step 21)

---

## Checklist Summary

Use this checklist to ensure everything is configured correctly:

### Meta Dashboard Setup
- [ ] Created Meta Developer account
- [ ] Created Business App
- [ ] Added WhatsApp product
- [ ] Collected App ID
- [ ] Collected App Secret
- [ ] Collected Business Account ID
- [ ] Collected Access Token
- [ ] Collected Phone Number ID
- [ ] Added test phone number for receiving messages

### Webhook Configuration
- [ ] Webhook URL configured in Meta dashboard
- [ ] Webhook verification successful (green checkmark)
- [ ] Subscribed to "messages" webhook field
- [ ] Verify token matches: `pelocal_verify_token_2025`

### Agent Configuration
- [ ] WhatsApp Integration section found
- [ ] All 5 credentials entered correctly
- [ ] Test message sent successfully
- [ ] WhatsApp enabled (toggle ON)
- [ ] Configuration saved

### Functionality Tests
- [ ] Test message received on WhatsApp
- [ ] Sent message to AI, received response
- [ ] Follow-up message shows conversation context
- [ ] Multiple messages all processed correctly
- [ ] Application logs show no errors
- [ ] Database stores conversation history

---

## Expected Timeline

- **Meta Setup**: 15-20 minutes (first time)
- **Agent Configuration**: 5 minutes
- **Webhook Setup**: 5 minutes
- **Testing**: 10 minutes
- **Total**: ~35-40 minutes

---

## Support Resources

- **Meta WhatsApp API Documentation**: https://developers.facebook.com/docs/whatsapp
- **WhatsApp Business Platform**: https://business.whatsapp.com/
- **Meta for Developers Support**: https://developers.facebook.com/support/

---

## Next Steps After Successful Testing

Once everything works:

1. ✅ **Generate permanent access token** for production use
2. ✅ **Add your business phone number** (optional)
3. ✅ **Submit app for review** to message unlimited users
4. ✅ **Monitor usage** and conversation quality
5. ✅ **Set up alerts** for webhook failures
6. ✅ **Backup your credentials** securely

---

## Success Indicators

You'll know everything is working when:

✅ Test message delivers instantly
✅ AI responds to your messages within 2-5 seconds
✅ Conversation context is maintained across messages
✅ Application logs show no errors
✅ Database stores all messages correctly
✅ Multiple users can chat simultaneously (if tested)

---

**Congratulations!** 🎉 Your WhatsApp integration is now live and working!

Your users can now chat with your AI agent directly through WhatsApp, making it accessible to billions of WhatsApp users worldwide.
