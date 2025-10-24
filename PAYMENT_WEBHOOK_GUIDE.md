# Payment Webhook Implementation Guide

## Overview
The payment webhook endpoint (`/api/payment-webhook`) handles incoming payment notifications with phone number extraction and acknowledgment. It's designed to receive payment events and confirm receipt of the customer's phone number.

## Endpoint Details

### POST /api/payment-webhook
**Purpose**: Accept payment notifications with phone number and send acknowledgment

**Request Format**:
```json
{
  "phone_number": "+919876543210",
  "amount": 500,
  "transactionId": "txn_001",
  "status": "success"
}
```

**Supported Phone Number Fields**:
- `phone_number` (snake_case - primary)
- `phoneNumber` (camelCase - alternative)

**Phone Number Validation**:
- Format: Regex `/^[\d\s\-\+\(\)]{10,}$/`
- Minimum 10 digits/characters
- Supports: digits, spaces, hyphens, plus sign, parentheses
- Examples:
  - `+919876543210` ✅
  - `+91 98765 43210` ✅
  - `(91) 9876-543210` ✅
  - `9876543210` ✅
  - `invalid` ❌
  - `123` ❌ (too short)

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Phone number +919876543210 received",
  "phoneNumber": "+919876543210",
  "timestamp": "2025-10-15T10:30:00.000Z",
  "transactionId": "txn_001"
}
```

**Error Responses**:

| Status | Error | Message |
|--------|-------|---------|
| 400 | MISSING_PHONE_NUMBER | Phone number is required |
| 400 | INVALID_PHONE_FORMAT | Invalid phone number format |
| 400 | INVALID_JSON | Invalid JSON in request body |
| 500 | INTERNAL_ERROR | Unexpected error processing request |

### GET /api/payment-webhook
**Purpose**: Health check for webhook service

**Response** (200 OK):
```json
{
  "service": "Payment Webhook Handler",
  "status": "operational",
  "version": "1.0.0",
  "endpoints": {
    "post": "POST /api/payment-webhook - Accepts payment notifications with phone number",
    "get": "GET /api/payment-webhook - Health check endpoint"
  }
}
```

## Usage Examples

### Using cURL

**Successful Request**:
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

**Using camelCase**:
```bash
curl -X POST https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "amount": 500
  }'
```

**Health Check**:
```bash
curl https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone_number: '+919876543210',
    amount: 500,
    transactionId: 'txn_001',
    status: 'success'
  })
});

const data = await response.json();
console.log(data);
// {
//   success: true,
//   message: 'Phone number +919876543210 received',
//   phoneNumber: '+919876543210',
//   timestamp: '2025-10-15T10:30:00.000Z'
// }
```

### Using Python

```python
import requests
import json

url = 'https://pelocal-voice-ai-agents.vercel.app/api/payment-webhook'
payload = {
    'phone_number': '+919876543210',
    'amount': 500,
    'transactionId': 'txn_001',
    'status': 'success'
}

response = requests.post(url, json=payload)
print(response.json())
```

## Response Validation

### Timestamp Format
- All responses include a timestamp in ISO 8601 format
- Example: `2025-10-15T10:30:00.000Z`
- UTC timezone is used

### TransactionId
- Optional in request, optional in response
- Only included in response if provided in request
- Useful for tracking and correlation

### Phone Number Confirmation
- The response always includes the confirmed phone number
- Matches the input phone number (with validation applied)
- Use for confirmation and logging

## Test Coverage

The webhook implementation includes comprehensive tests:

```
Payment Webhook
  ✓ phone number validation (3 tests)
  ✓ webhook response structure (2 tests)
  ✓ webhook endpoint documentation (2 tests)
  ✓ payload handling (2 tests)
  Total: 9 tests passing
```

### Running Tests

```bash
# Run only payment webhook tests
npm run test -- __tests__/api/payment-webhook.test.ts

# Run with coverage
npm run test:coverage -- __tests__/api/payment-webhook.test.ts

# Run all tests
npm run test
```

## Integration Points

### Database Integration (Optional)
The webhook can be extended to save phone numbers to database:

```typescript
// Example enhancement
import { PhoneNumber } from '@/models';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const phoneNumber = body.phone_number || body.phoneNumber;
  
  // Validate
  if (!isValidPhone(phoneNumber)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
  }
  
  // Optional: Save to database
  await PhoneNumber.create({
    phone: phoneNumber,
    received_from: 'webhook',
    received_at: new Date(),
    transaction_id: body.transactionId
  });
  
  return NextResponse.json({
    success: true,
    message: `Phone number ${phoneNumber} received`,
    phoneNumber,
    timestamp: new Date().toISOString()
  });
}
```

## Error Handling Best Practices

1. **Always validate input**: Phone number format is checked server-side
2. **Return meaningful errors**: Error codes and messages help debugging
3. **Log requests**: All requests are logged with `[Payment Webhook]` prefix
4. **Handle malformed JSON**: Invalid JSON returns 400 status
5. **Graceful degradation**: Unexpected errors return 500 with message

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for production
2. **Authentication**: Consider adding API key validation for production
3. **HTTPS**: Always use HTTPS in production (enforced by deployment)
4. **Logging**: Log all webhook calls for audit trail
5. **PII Protection**: Phone numbers should be handled as PII

## Deployment Notes

- **Environment**: Deployed with Next.js 15.5.4 using Turbopack
- **Route**: `/api/payment-webhook` (Next.js App Router)
- **Build Size**: ~181 B (route handler), 102 kB (total bundle)
- **Performance**: Responds in <100ms (excluding I/O)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Not Found | Verify endpoint path: `/api/payment-webhook` |
| 400 Bad Request | Check phone number format, ensure valid JSON |
| 500 Internal Error | Check server logs, verify request format |
| Timeout | Check network connectivity, server status |

## Version History

- **v1.0.0** (Oct 15, 2025)
  - Initial implementation
  - Phone number validation with regex
  - Timestamp tracking
  - Health check endpoint
  - Comprehensive test coverage

## Related Endpoints

- `/api/phone-numbers` - Manage phone numbers
- `/api/meta-webhook` - WhatsApp webhook handler
- `/api/campaigns` - Campaign management

## Contact & Support

For issues or questions about the payment webhook, refer to:
- Implementation: `app/api/payment-webhook/route.ts`
- Tests: `__tests__/api/payment-webhook.test.ts`
- Branch: `anshul_webhook`
