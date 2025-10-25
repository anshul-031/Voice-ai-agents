# Payment Webhook - Vercel Deployment Summary

**Updated**: October 24, 2025

## Production Endpoint

**Vercel Domain**: `https://pelocal-voice-ai-agents.vercel.app`  
**Webhook URL**: `https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook`

---

## Quick Reference

### POST Request (Send Payment Notification)

```bash
curl -X POST https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "amount": 500,
    "transactionId": "txn_001",
    "status": "success"
  }'
```

### GET Request (Health Check)

```bash
curl https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook
```

### JavaScript Integration

```javascript
const response = await fetch('https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone_number: '+919876543210',
    amount: 500,
    transactionId: 'txn_001'
  })
});

const data = await response.json();
console.log(data);
```

---

## Response Format

### Success (200 OK)
```json
{
  "success": true,
  "message": "Phone number +919876543210 received",
  "phoneNumber": "+919876543210",
  "timestamp": "2025-10-24T10:30:00.000Z",
  "transactionId": "txn_001"
}
```

### Error (400/500)
```json
{
  "success": false,
  "message": "Phone number is required",
  "error": "MISSING_PHONE_NUMBER",
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

---

## Phone Number Validation

✅ **Valid Formats**:
- `+919876543210` (International format)
- `+91 98765 43210` (With spaces)
- `(91) 9876-543210` (With parentheses and hyphens)
- `9876543210` (Plain numbers)

❌ **Invalid Formats**:
- `invalid` (Non-numeric characters)
- `123` (Too short, requires 10+ characters)

---

## Integration Examples

### Payment Provider Integration

```javascript
// When payment is processed, notify the webhook
async function notifyPaymentWebhook(phoneNumber, transactionId, amount) {
  const payload = {
    phone_number: phoneNumber,
    transactionId: transactionId,
    amount: amount,
    status: 'success'
  };

  const response = await fetch(
    'https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  return await response.json();
}
```

### Error Handling

```javascript
try {
  const response = await fetch(
    'https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    }
  );

  const data = await response.json();

  if (!data.success) {
    console.error('Webhook error:', data.error, data.message);
  } else {
    console.log('Payment notification sent:', data.phoneNumber);
  }
} catch (error) {
  console.error('Failed to notify webhook:', error);
}
```

---

## Testing

### Local Development (localhost)
```bash
# For local testing, use:
curl -X POST http://localhost:3000/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919876543210"}'
```

### Production (Vercel)
```bash
# For production, use:
curl -X POST https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919876543210"}'
```

---

## Documentation Links

- **Detailed Guide**: See `PAYMENT_WEBHOOK_GUIDE.md`
- **Implementation Details**: See `PAYMENT_WEBHOOK_COMPLETION.md`
- **Source Code**: `app/api/payment-webhook/route.ts`
- **Tests**: `__tests__/api/payment-webhook.test.ts`

---

## Support

For issues or questions:
1. Check the detailed guide: `PAYMENT_WEBHOOK_GUIDE.md`
2. Review implementation: `app/api/payment-webhook/route.ts`
3. Run tests: `npm run test -- __tests__/api/payment-webhook.test.ts`
4. Check build: `npm run build`

---

**Status**: ✅ Deployed to Vercel  
**Branch**: `anshul_webhook`  
**Last Updated**: October 24, 2025
