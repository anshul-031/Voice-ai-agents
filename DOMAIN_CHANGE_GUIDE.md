# Domain Change Guide

This guide explains how webhook URLs are dynamically generated and how to work with multiple domains.

## 🌐 **Dynamic Domain Support (NEW!)**

Your webhook URLs are now **automatically generated** based on the domain used to access the API!

### How It Works

When you call the API (e.g., `GET /api/phone-numbers`), the system:
1. **Uses the request domain** (from `Host` and `X-Forwarded-Proto` headers)
2. **Falls back to** `NEXT_PUBLIC_APP_URL` if request headers are missing
3. **Generates webhook URLs** matching that domain

### Examples

```bash
# Request from mukul.com
curl -H "Host: mukul.com" https://mukul.com/api/phone-numbers?userId=mukul
# Returns: "webhookUrl": "https://mukul.com/api/telephony/webhook/phone_XXX"

# Request from anshul.com
curl -H "Host: anshul.com" https://anshul.com/api/phone-numbers?userId=mukul
# Returns: "webhookUrl": "https://anshul.com/api/telephony/webhook/phone_XXX"

# Request from localhost
curl http://localhost:3000/api/phone-numbers?userId=mukul
# Returns: "webhookUrl": "http://localhost:3000/api/telephony/webhook/phone_XXX"
```

**The phone identifier (`phone_XXX`) stays the same**, only the domain changes!

---

## 🔄 When You Deploy to a New Domain

### Option 1: No Configuration Needed! (Recommended)

Since webhook URLs are dynamic, you can:
1. Deploy to any domain (Vercel, custom domain, etc.)
2. **No need to update `.env.local`** or run scripts
3. Just update Exotel Dashboard with the new webhook URL

The API will automatically return URLs matching your current domain!

### Option 2: Set a Default Domain (Optional)

If you want a fallback or default domain when headers are missing:

#### Step 1: Update Environment Variable

Edit your `.env.local` file and change `NEXT_PUBLIC_APP_URL`:

```bash
# Old domain
NEXT_PUBLIC_APP_URL=https://old-domain.vercel.app/

# New domain
NEXT_PUBLIC_APP_URL=https://new-domain.com/
```

**Note:** This is only used as a fallback. The API prefers the request domain.

**Important:** 
- Include the protocol (`https://`)
- Include trailing slash (`/`)
- No port number for production

#### Step 2: Run Update Script (Only if you want to persist URLs in DB)

> ⚠️ **Note**: This step is optional since URLs are now generated dynamically!

This will update the stored URLs in your database:

```bash
npm run update-webhooks
```

The script will:
- ✅ Read the domain from `.env.local`
- ✅ Update all stored webhook URLs in the database
- ✅ Update all websocket URLs
- ✅ Preserve phone identifiers (so URLs remain consistent)

**When to run this:**
- If you want the database to show the "canonical" domain
- For consistency in database records
- Not required for functionality (dynamic generation works regardless)

#### Step 3: Update Exotel Dashboard

**This is the ONLY required step when changing domains!**

For **each phone number** in your database:

1. Log in to **Exotel Dashboard**: https://my.exotel.com
2. Go to **Settings → Phone Numbers**
3. Select your phone number (e.g., `08047359585`)
4. Update **Answer URL** to the new webhook URL:
   ```
   https://new-domain.com/api/telephony/webhook/phone_XXXXX
   ```
   
   > 💡 **Tip**: Get the exact URL by calling:
   > ```bash
   > curl https://new-domain.com/api/phone-numbers?userId=mukul | jq '.phoneNumbers[0].webhookUrl'
   > ```

5. Ensure **Method** is set to **POST**
6. **Save** changes

#### Step 4: Test

Make a test call to your phone number and verify:
- Call connects (not just rings)
- You hear the greeting
- Check application logs for incoming webhook

---

## 📋 Quick Reference

### Current Configuration

Run this to see your current setup:

```bash
npm run update-webhooks
```

Output will show:
- Current domain from `.env.local`
- All phone numbers found
- New webhook URLs

### Manual Domain Check

```bash
echo "Current domain: $(grep NEXT_PUBLIC_APP_URL .env.local)"
```

### Verify Phone Numbers

```bash
curl http://localhost:3000/api/phone-numbers?userId=mukul | jq
```

---

## 🛠️ Dynamic URL Generation

### How It Works

The system generates URLs dynamically in three ways:

#### 1. **At Runtime (GET requests) - PRIMARY METHOD**
When you fetch phone numbers via API, URLs are regenerated based on:
- **Request headers** (`Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`) - **PREFERRED**
- Or `NEXT_PUBLIC_APP_URL` environment variable (fallback)

This means the same phone number can have different URLs depending on which domain you use!

```javascript
// In app/api/phone-numbers/route.ts
const resolveOrigins = (request: NextRequest) => {
    const requestOrigin = buildRequestOrigin(request); // From headers
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
    
    // Prefer request origin, fallback to env
    const baseHttp = requestOrigin || envOrigin;
    // ...
};
```

#### 2. **At Creation (POST requests)**
When you create a new phone number, URLs are saved with:
- Current domain from request headers (preferred)
- Or `NEXT_PUBLIC_APP_URL` (fallback)
- Unique identifier (`phone_TIMESTAMP_RANDOM`)

**Note**: Even if stored URLs are old, they get regenerated on GET requests!

#### 3. **Manual Update (Script)**
When you want to update stored URLs in the database, run:
```bash
npm run update-webhooks
```

This updates the database records (optional, for consistency).

### Environment Priority

1. **Request Headers** (Host, X-Forwarded-Host, X-Forwarded-Proto) - **FIRST**
2. **NEXT_PUBLIC_APP_URL** from `.env.local` - **FALLBACK**
3. **Stored in DB** - Used only if both above fail (rare)

---

## 🔐 Security Notes

- Webhook URLs are **public** (Exotel needs to access them)
- WebSocket URLs require authentication in your app
- Phone identifiers (`phone_XXXXX`) are random and unique
- Never expose sensitive credentials in URLs

---

## 🐛 Troubleshooting

### Issue: Calls still go to old domain

**Solution:**
1. Verify `.env.local` has the new domain
2. Run `npm run update-webhooks` again
3. Check Exotel Dashboard → Answer URL
4. Restart your application

### Issue: Script fails with MongoDB error

**Solution:**
```bash
# Check MongoDB connection
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
```

### Issue: New phone numbers still use old domain

**Solution:**
1. Restart your Next.js server
2. Clear `.next` cache: `rm -rf .next`
3. Verify environment: `printenv | grep NEXT_PUBLIC`

### Issue: Webhook returns 404

**Solution:**
- Ensure identifier matches database
- Check URL format: `/api/telephony/webhook/phone_XXXXX`
- Verify phone number is active in database

---

## 📝 Examples

### Localhost Development with ngrok

```bash
# 1. Set localhost in .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000/

# 2. Start app
npm run dev

# 3. Start ngrok
ngrok http 3000

# 4. Update .env.local with ngrok URL
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app/

# 5. Update webhooks
npm run update-webhooks

# 6. Update Exotel with ngrok webhook URL
```

### Vercel Deployment

```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Get deployment URL (e.g., https://my-app.vercel.app)

# 3. Update .env.local
NEXT_PUBLIC_APP_URL=https://my-app.vercel.app/

# 4. Update webhooks
npm run update-webhooks

# 5. Update Exotel Dashboard

# 6. Also add to Vercel Environment Variables:
# Go to Vercel Dashboard → Settings → Environment Variables
# Add: NEXT_PUBLIC_APP_URL = https://my-app.vercel.app/
```

### Custom Domain

```bash
# 1. Add custom domain in Vercel (e.g., api.mycompany.com)

# 2. Update .env.local
NEXT_PUBLIC_APP_URL=https://api.mycompany.com/

# 3. Update webhooks
npm run update-webhooks

# 4. Update Exotel Dashboard

# 5. Test with custom domain
curl https://api.mycompany.com/api/phone-numbers?userId=mukul
```

---

## ✅ Best Practices

1. **Always update environment variable first**
2. **Then run the update script**
3. **Then update Exotel Dashboard**
4. **Test immediately after changes**
5. **Keep a log of domain changes**
6. **Use HTTPS in production**
7. **Document your current webhook URLs**

---

## 🚀 Automation Ideas

### Automatic Exotel Update (Future Enhancement)

You could automate Exotel Dashboard updates using their API:

```typescript
// Example: Update Exotel phone config via API
const updateExotelWebhook = async (phoneNumber: string, webhookUrl: string) => {
    const response = await fetch(
        `https://api.exotel.com/v1/Accounts/${SID}/IncomingPhoneNumbers/${phoneNumber}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `Url=${encodeURIComponent(webhookUrl)}`,
        }
    );
    return response.json();
};
```

Add this to `scripts/update-webhook-urls.ts` for fully automated updates!

---

**Made with ❤️ for seamless domain changes**
