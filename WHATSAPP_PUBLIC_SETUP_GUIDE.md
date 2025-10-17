# WhatsApp Public Bot Setup Guide

## Making Your WhatsApp Bot Publicly Accessible

This guide explains how to set up your WhatsApp bot so that **ANYONE** can message your WhatsApp number and receive AI-powered responses from your agent.

---

## Overview

By default, WhatsApp test numbers can only send messages to 5 pre-registered phone numbers. To make your bot public:

1. **Add your own business phone number** to WhatsApp Business API
2. **Get Meta app approval** for `whatsapp_business_messaging` permission
3. **Generate permanent access token**
4. **Configure your agent** with the new credentials

**Timeline:** 2-5 business days (mostly waiting for Meta approval)

---

## Part 1: Add Your Own Business Phone Number (30 minutes)

### Prerequisites

You'll need:
- ✅ A phone number you own (can receive SMS/calls)
- ✅ This number should NOT already be registered with WhatsApp
- ✅ A Facebook Business Manager account
- ✅ Your Meta app from initial setup

### Step 1: Access Phone Number Setup

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Open your WhatsApp-enabled app
3. Click **WhatsApp** in the left sidebar
4. Click **Getting Started** or **Phone Numbers**

### Step 2: Add Phone Number

1. Look for **"Add phone number"** button (usually at the top right)
2. Click **"Add phone number"**
3. Choose one of these options:

   **Option A: Use an existing number (Recommended)**
   - Select **"Use an existing phone number"**
   - Choose your country code
   - Enter your phone number
   - Click **"Next"**

   **Option B: Get a new number from Meta**
   - Select **"Get a new phone number"**
   - Choose your country
   - Select an available number
   - Complete purchase (may have costs)

### Step 3: Verify Your Phone Number

1. You'll receive a verification code via:
   - SMS (text message), or
   - Voice call
2. Enter the 6-digit code
3. Click **"Verify"**

**Important Notes:**
- ⚠️ Once verified, this number can ONLY be used with WhatsApp Business API
- ⚠️ You cannot use this number with regular WhatsApp app anymore
- ⚠️ Make sure this is the number you want to use for your business

### Step 4: Display Name Setup

1. After verification, set your **Display Name**
   - This is the name users will see when they chat with your bot
   - Example: "Customer Support Bot", "AI Assistant", "Your Company Name"
2. Click **"Continue"** or **"Save"**

### Step 5: Get New Phone Number ID

1. After adding the number, you'll see it in the phone numbers list
2. Click on the phone number to see details
3. Copy the **Phone Number ID** (not the phone number itself)
4. It looks like: `123456789012345`
5. **Save this** - you'll need it later

---

## Part 2: Generate Permanent Access Token (15 minutes)

Temporary tokens expire in 24 hours. For production, you need a permanent token.

### Step 6: Create System User

1. In Meta for Developers, go to your app
2. Navigate to **Business Settings** (gear icon) or use this link:
   - Go to [business.facebook.com](https://business.facebook.com)
3. In the left menu, click **Users** → **System Users**
4. Click **"Add"** button
5. Fill in details:
   - **System User Name**: e.g., "WhatsApp Bot System User"
   - **Role**: Choose **Admin** (or Employee if you prefer)
6. Click **"Create System User"**

### Step 7: Generate Token

1. After creating the system user, click on the user name
2. Click **"Generate New Token"** or **"Add Assets"**
3. In the dialog:
   - **App**: Select your WhatsApp app
   - **Token Expiration**: Select **"Never"** (permanent token)
   - **Permissions**: Check these boxes:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
4. Click **"Generate Token"**
5. **IMPORTANT**: Copy the token NOW and save it securely
   - You won't be able to see it again
   - Store it in a password manager or secure location
6. Click **"OK"** or **"Done"**

### Step 8: Assign Phone Number to System User

1. In Business Settings, go to **Accounts** → **WhatsApp Accounts**
2. Find your WhatsApp Business Account
3. Click on it to expand
4. Find your phone number in the list
5. Click **"Assign to System User"** or **"Add People"**
6. Select the system user you created in Step 6
7. Grant permissions:
   - ✅ Manage WhatsApp Business Account
   - ✅ Manage Templates
8. Click **"Assign"** or **"Save"**

---

## Part 3: Submit App for Review (30 minutes setup, 2-5 days approval)

To send messages to ANY WhatsApp user (not just 5 test numbers), Meta must review and approve your app.

### Step 9: Prepare Business Information

Before submitting, gather:
- ✅ Business name and description
- ✅ Privacy policy URL (required)
- ✅ Terms of service URL (optional but recommended)
- ✅ App icon (1024x1024px, PNG)
- ✅ Use case description (what will your bot do?)

**Privacy Policy Requirements:**
- Must be hosted on a publicly accessible URL
- Must describe how you collect, use, and share user data
- Must mention WhatsApp messaging
- If you don't have one, you can use free generators or templates

### Step 10: Complete App Review Submission

1. In your Meta app dashboard, click **App Review** in left sidebar
2. Click **Permissions and Features** tab
3. Find **"whatsapp_business_messaging"** in the list
4. Click **"Request Advanced Access"** button

### Step 11: Fill Out Review Form

You'll need to provide:

1. **App Details**
   - App name
   - App description (explain what your bot does)
   - Upload app icon (1024x1024px)

2. **Platform**
   - Select: ☑️ **Web**
   - Add your website URL

3. **Privacy Policy**
   - Enter your privacy policy URL
   - Terms of service URL (if available)

4. **Use Case Description**
   - Explain in detail what your bot will do
   - Example:
     ```
     Our AI-powered chatbot provides instant customer support 
     and answers to frequently asked questions. Users can ask 
     questions about our products/services and receive automated 
     responses 24/7. The bot maintains conversation context to 
     provide relevant answers. All conversations are stored 
     securely and used only to improve service quality.
     ```

5. **Screenshots/Demo** (if requested)
   - Take screenshots showing:
     - A user sending a message to your bot
     - The bot responding
     - Example conversations
   - Or provide a video demo (< 2 minutes)

6. **Test Credentials** (if requested)
   - Provide a test phone number they can message
   - Explain what to expect when they message

### Step 12: Submit for Review

1. Review all information carefully
2. Check all required fields are filled
3. Click **"Submit for Review"**
4. You'll receive a confirmation

**What Happens Next:**
- Meta will review your submission (usually 1-5 business days)
- You may receive questions or requests for more information
- Once approved, you'll get an email notification
- The permission status will change to **"Approved"**

---

## Part 4: Update Your Agent Configuration (5 minutes)

Once your app is approved and you have your permanent token:

### Step 13: Update Agent Settings

1. Open your Voice AI Agent application
2. Go to the agent with WhatsApp configured
3. Click **"Configure"** in WhatsApp Integration section
4. Update these fields:
   - **Access Token**: Replace with your new permanent token (from Step 7)
   - **Phone Number ID**: Replace with your business number ID (from Step 5)
5. Keep the same:
   - App ID
   - App Secret
   - Business Account ID
6. Click **"Save Configuration"**

### Step 14: Update Webhook (if needed)

The webhook should still work, but verify:

1. Go to Meta Dashboard → WhatsApp → Configuration
2. Check that webhook URL is still configured
3. Verify it's subscribed to **"messages"**
4. If anything changed, re-save the webhook configuration

---

## Part 5: Test Public Access (10 minutes)

### Step 15: Test with Different Numbers

Now test with phone numbers that were NOT in your test allowlist:

1. Ask friends/colleagues to message your WhatsApp business number
2. Use different devices/numbers
3. They should:
   - Open WhatsApp
   - Add your business number as a contact (optional)
   - Send a message to your business number
4. They should receive AI responses immediately

### Step 16: Verify Unlimited Messaging

Before approval, you could only message 5 numbers. Now:

1. Test with 10+ different phone numbers
2. All should work without restrictions
3. Check that all conversations are logged
4. Verify conversation history works for each user

---

## Important Production Considerations

### Message Limits

WhatsApp has rate limits to prevent spam:

**Free Tier (New Business Accounts):**
- Start with: **250 business-initiated conversations per day**
- User-initiated conversations: **1,000 per day**
- Limits increase automatically based on quality rating

**Quality Rating:**
- Meta monitors your message quality
- High block/report rates = lower limits
- Good engagement = higher limits
- Check: WhatsApp Dashboard → Analytics → Quality

### Conversation Types

WhatsApp distinguishes between:

1. **User-initiated**: User messages you first (your use case)
   - ✅ FREE for most use cases
   - ✅ Bot can respond within 24 hours
   - ✅ Your current implementation works for this

2. **Business-initiated**: You message user first
   - ⚠️ Requires approved message templates
   - ⚠️ May have costs
   - ⚠️ Not covered in current implementation

### Costs

As of 2025:
- **User-initiated conversations**: Usually free
- **Business-initiated conversations**: Varies by country ($0.01 - $0.10 per conversation)
- Check current pricing: [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

### Best Practices

1. **Response Time**
   - Keep responses under 5 seconds
   - Current implementation is optimized for this

2. **Message Quality**
   - Don't send spam or promotional content
   - Provide value in responses
   - Allow users to opt-out

3. **Privacy**
   - Store user data securely (already done)
   - Don't share user data without consent
   - Follow GDPR/privacy laws

4. **Monitoring**
   - Set up alerts for webhook failures
   - Monitor response times
   - Check daily message volumes
   - Review quality ratings weekly

---

## Troubleshooting

### App Review Rejected

**Common reasons:**
1. **Incomplete information** → Fill all required fields
2. **Privacy policy missing** → Add a proper privacy policy
3. **Unclear use case** → Provide detailed description and examples
4. **Test credentials don't work** → Make sure test number is accessible

**What to do:**
- Read the rejection email carefully
- Address all mentioned issues
- Resubmit the review
- Response time: 1-2 days for resubmission

### Phone Number Verification Failed

**Solutions:**
1. Make sure number can receive SMS/calls
2. Try voice call verification instead of SMS
3. Check number isn't already registered with WhatsApp
4. Use a different phone number
5. Contact Meta support if persistent

### Still Limited to Test Numbers After Approval

**Solutions:**
1. Check that "whatsapp_business_messaging" shows "Approved"
2. Verify you're using the permanent token (not temporary)
3. Confirm phone number is from "Add phone number" not "Test number"
4. Wait 15-30 minutes for changes to propagate
5. Try regenerating access token

### Messages Not Delivering to Public

**Solutions:**
1. Check app is approved (not "In Review" or "Rejected")
2. Verify permanent access token is configured
3. Check business phone number ID is correct
4. Look for API errors in application logs
5. Verify webhook is still configured correctly
6. Check message rate limits haven't been hit

---

## Verification Checklist

Before going public, verify:

### Meta Setup
- [ ] Own business phone number added (not test number)
- [ ] Phone number verified successfully
- [ ] Display name configured
- [ ] System user created
- [ ] Permanent access token generated (never expires)
- [ ] Phone number assigned to system user
- [ ] App review submitted
- [ ] "whatsapp_business_messaging" approved
- [ ] App status is "Live" (not "Development")

### Application Setup
- [ ] Permanent access token updated in agent
- [ ] Business phone number ID updated in agent
- [ ] Webhook still configured and verified
- [ ] "messages" subscribed in webhook fields
- [ ] Application is running on public HTTPS URL
- [ ] Database connection working
- [ ] LLM API key configured

### Testing
- [ ] Test with non-allowlist phone number
- [ ] Multiple different numbers can message bot
- [ ] All receive responses within seconds
- [ ] Conversation history works per user
- [ ] No errors in application logs
- [ ] Rate limits not exceeded

---

## Timeline Summary

| Step | Time Required |
|------|---------------|
| Add business phone number | 30 minutes |
| Generate permanent token | 15 minutes |
| Submit app for review | 30 minutes |
| **⏰ Wait for approval** | **2-5 business days** |
| Update agent configuration | 5 minutes |
| Test public access | 10 minutes |
| **Total active time** | **1.5 hours** |
| **Total calendar time** | **2-5 days** |

---

## What Happens After Approval

Once approved, your WhatsApp bot becomes publicly accessible:

✅ **Anyone can message** your business WhatsApp number
✅ **Unlimited unique users** can chat with your bot
✅ **Automatic AI responses** powered by your agent
✅ **Conversation history** maintained per user
✅ **24/7 availability** without human intervention
✅ **Scales automatically** to handle multiple conversations

---

## Next Steps

1. **Monitor Usage**
   - Check Meta Analytics dashboard daily
   - Review conversation quality
   - Monitor response times

2. **Improve Bot**
   - Analyze common questions
   - Update agent prompts based on feedback
   - Add more capabilities

3. **Promote Your Bot**
   - Share WhatsApp number on website
   - Add to social media profiles
   - Include in email signatures
   - Create QR code for easy access

4. **Set Up Alerts**
   - Webhook failure notifications
   - High error rate alerts
   - Daily usage reports

---

## Support

If you need help:
- **Meta Support**: https://developers.facebook.com/support/
- **WhatsApp Business Help**: https://business.whatsapp.com/support
- **Community**: https://developers.facebook.com/community/

---

## Success! 🎉

Once everything is set up:

📱 Share your WhatsApp number: **"Message us on WhatsApp at +[your number]"**

🤖 Your AI agent will handle all conversations automatically

🌍 Available to billions of WhatsApp users worldwide

💬 Scaling from 5 test users to unlimited public access!

---

**Your WhatsApp bot is now truly public and production-ready!**
