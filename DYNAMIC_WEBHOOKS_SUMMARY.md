# ✅ Dynamic Webhook URLs - Working!

## 🎉 Summary

Your webhook URLs are now **fully dynamic** based on the domain used to access the API!

## 🧪 Test Results

```bash
# Test 1: localhost
curl http://localhost:3000/api/phone-numbers?userId=mukul
Result: "webhookUrl": "http://localhost:3000/api/telephony/webhook/phone_1762705985796_0jqg6tv3b"

# Test 2: mukul.com
curl -H "Host: mukul.com" -H "X-Forwarded-Proto: https" http://localhost:3000/api/phone-numbers?userId=mukul
Result: "webhookUrl": "https://mukul.com/api/telephony/webhook/phone_1762705985796_0jqg6tv3b"

# Test 3: anshul.com
curl -H "Host: anshul.com" -H "X-Forwarded-Proto: https" http://localhost:3000/api/phone-numbers?userId=mukul
Result: "webhookUrl": "https://anshul.com/api/telephony/webhook/phone_1762705985796_0jqg6tv3b"
```

✅ **Notice**: Same phone identifier (`phone_1762705985796_0jqg6tv3b`), different domains!

## 📝 What Changed

### File: `app/api/phone-numbers/route.ts`

**Before:**
```typescript
const resolveOrigins = (request: NextRequest) => {
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const baseHttp = envOrigin && !isPlaceholderHost(envOrigin)
        ? envOrigin  // Env variable was FIRST
        : buildRequestOrigin(request);  // Request headers were FALLBACK
    // ...
};
```

**After:**
```typescript
const resolveOrigins = (request: NextRequest) => {
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const requestOrigin = buildRequestOrigin(request);
    
    const baseHttp = requestOrigin && !isPlaceholderHost(requestOrigin)
        ? requestOrigin  // Request headers are FIRST now!
        : envOrigin && !isPlaceholderHost(envOrigin)
            ? envOrigin  // Env variable is FALLBACK
            : requestOrigin;
    // ...
};
```

## 🚀 How to Use

### For Exotel Integration

When you deploy to a new domain:

1. **Deploy your app** (e.g., to `new-domain.com`)
2. **Get the webhook URL**:
   ```bash
   curl https://new-domain.com/api/phone-numbers?userId=mukul | jq -r '.phoneNumbers[0].webhookUrl'
   ```
3. **Update Exotel Dashboard**:
   - Go to https://my.exotel.com
   - Settings → Phone Numbers → Your Number
   - Update Answer URL with the webhook URL from step 2
   - Set Method to POST
   - Save

That's it! No environment variable changes needed!

### For Multiple Domains

You can use the **same phone number** with **multiple domains**:

- Production: `https://api.mycompany.com/api/telephony/webhook/phone_XXX`
- Staging: `https://staging.mycompany.com/api/telephony/webhook/phone_XXX`
- Development: `http://localhost:3000/api/telephony/webhook/phone_XXX`

Just update the Exotel Answer URL to point to whichever domain you want to use!

### For Development with ngrok

```bash
# Start ngrok
ngrok http 3000
# Output: https://abc123.ngrok-free.app

# Get webhook URL
curl https://abc123.ngrok-free.app/api/phone-numbers?userId=mukul | jq -r '.phoneNumbers[0].webhookUrl'
# Result: https://abc123.ngrok-free.app/api/telephony/webhook/phone_XXX

# Update Exotel with that URL
# Test by calling your phone number!
```

## 💡 Benefits

1. **No configuration changes** when deploying to new domains
2. **Same phone identifier** works across all domains
3. **Easy testing** with localhost, ngrok, staging, production
4. **Multi-tenant support** - different clients can use different domains
5. **Environment variable is optional** (just a fallback)

## 📚 Documentation

- Full guide: `DOMAIN_CHANGE_GUIDE.md`
- ngrok setup: `NGROK_SETUP.md`
- Exotel integration: `EXOTEL_INTEGRATION_GUIDE.md`

## 🔧 Troubleshooting

### Webhook URL still shows old domain

**Solution**: The API generates URLs dynamically, so just call it with the new domain:
```bash
curl https://new-domain.com/api/phone-numbers?userId=mukul
```

### Want to update stored URLs in database

**Solution**: Run the update script:
```bash
npm run update-webhooks
```

This updates the database records (optional, for consistency).

### Vercel deployment

Vercel automatically sets the correct headers (`x-forwarded-host`, `x-forwarded-proto`), so it just works!

## ✅ Status

- [x] Dynamic URL generation implemented
- [x] Tested with multiple domains
- [x] Build passing
- [x] Documentation updated
- [x] Ready for production!

---

**Built with ❤️ for flexible, multi-domain webhook support**
