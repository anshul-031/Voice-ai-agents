# Exotel Local Testing Setup with ngrok

## Problem
Your Exotel number is trying to reach `https://pelocal-voice-ai-agents.vercel.app` but you're developing on `localhost:3000`.

**Exotel cannot access localhost!** You need a public URL.

---

## Solution: Use ngrok

### Step 1: Install ngrok
```bash
# Option 1: Using npm
npm install -g ngrok

# Option 2: Download from https://ngrok.com/download
```

### Step 2: Start Your App
```bash
npm run dev
# Server should be running on http://localhost:3000
```

### Step 3: Start ngrok (in a new terminal)
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123def456.ngrok-free.app -> http://localhost:3000
```

### Step 4: Get Your Webhook URL

Your webhook URL will be:
```
https://abc123def456.ngrok-free.app/api/telephony/webhook/phone_1762705985796_0jqg6tv3b
```

**Important:** Replace `abc123def456` with your actual ngrok subdomain!

### Step 5: Update Exotel Dashboard

1. Go to **Exotel Dashboard** (https://my.exotel.com)
2. Navigate to **Settings → Phone Numbers → 08047359585**
3. Find **"Answer URL"** or **"Passthru Applet URL"**
4. Update to your ngrok webhook URL:
   ```
   https://abc123def456.ngrok-free.app/api/telephony/webhook/phone_1762705985796_0jqg6tv3b
   ```
5. Ensure method is **POST**
6. **Save**

### Step 6: Test with Real Call

1. Make sure ngrok is running
2. Make sure your app is running (`npm run dev`)
3. Call **08047359585**
4. Watch your terminal for logs!

---

## Expected Logs

When call comes in, you should see:
```
[Exotel Webhook] Incoming call for phone ID: phone_1762705985796_0jqg6tv3b
[Exotel Webhook] Received data: { CallSid: '...', From: '...', To: '...' }
[Exotel Webhook] Found phone number: { id: '...', number: '08047359585' }
[Exotel Webhook] Using agent: { id: '...', name: '...' }
[Exotel Webhook] Generated XML response...
```

---

## Testing Without Real Call

Test your ngrok URL:
```bash
# Replace with your actual ngrok URL
curl -X POST https://abc123def456.ngrok-free.app/api/telephony/webhook/phone_1762705985796_0jqg6tv3b \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test_123" \
  -d "From=919876543210" \
  -d "To=08047359585" \
  -d "Status=in-progress"
```

Expected response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>नमस्ते। मैं आपकी सहायता के लिए यहां हूं।</Say>
    <Pause length="1"/>
    ...
</Response>
```

---

## Important Notes

1. **ngrok URL changes** every time you restart ngrok
   - You'll need to update Exotel each time
   - Or use a paid ngrok account for static URLs

2. **Keep both terminals running:**
   - Terminal 1: `npm run dev`
   - Terminal 2: `ngrok http 3000`

3. **MongoDB must be accessible:**
   - Make sure your MongoDB connection works
   - Check `.env.local` has correct `MONGODB_URI`

---

## Alternative: Test on Vercel

If you want to test without ngrok:

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Your webhook will be:**
   ```
   https://your-project.vercel.app/api/telephony/webhook/phone_1762705985796_0jqg6tv3b
   ```

3. **Update in Exotel Dashboard**

4. **Test by calling the number**

---

## Quick Test Command

After setting up ngrok, run this to test:

```bash
# Get your ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# Test the webhook
curl -X POST "$NGROK_URL/api/telephony/webhook/phone_1762705985796_0jqg6tv3b" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test_$(date +%s)" \
  -d "From=919876543210" \
  -d "To=08047359585" \
  -d "Status=in-progress"
```

---

## Troubleshooting

### ngrok not found
```bash
npm install -g ngrok
# or download from https://ngrok.com/download
```

### Call still not connecting
- Check ngrok is running
- Check ngrok URL is updated in Exotel
- Check your app is running
- Check MongoDB is connected
- Look at terminal logs during call

### "Phone number not found" error
- The phone ID in URL must match database
- Your phone ID: `phone_1762705985796_0jqg6tv3b`
- Don't change this!

---

## Success Checklist

- [ ] ngrok installed
- [ ] App running (`npm run dev`)
- [ ] ngrok running (`ngrok http 3000`)
- [ ] ngrok URL copied
- [ ] Exotel Answer URL updated with ngrok URL
- [ ] Method set to POST in Exotel
- [ ] Test call made to 08047359585
- [ ] Greeting heard!

---

**Your webhook works locally! Now make it accessible to Exotel using ngrok!** 🚀
