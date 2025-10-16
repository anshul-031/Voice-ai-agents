# Exotel Campaign - Quick Reference

## 🚀 Quick Start

### 1. Environment Setup (.env.local)

```env
EXOTEL_AUTH_KEY=0057eb80c8954c57fd04a706cced7204a55e78f1171edb43
EXOTEL_AUTH_TOKEN=0462a5eeaeaaa40839a50e5cd9b5c1332315639ece950f8c
EXOTEL_SUBDOMAIN=api.exotel.com
EXOTEL_ACCOUNT_SID=pelocal2
EXOTEL_CALLER_ID=918047495133
EXOTEL_URL=http://my.exotel.com/pelocal2/exoml/start_voice/1044171
```

### 2. Usage Steps

1. Go to **Dashboard → Campaigns**
2. Click **"Start"** button
3. Confirm dialog
4. Monitor progress in real-time
5. View details by clicking **"View"**

---

## 📂 Key Files

| File                                   | Purpose                 |
| -------------------------------------- | ----------------------- |
| `lib/exotel.ts`                        | Exotel API integration  |
| `app/api/campaigns/start/route.ts`     | Start campaign endpoint |
| `components/CampaignsTable.tsx`        | UI with Start button    |
| `components/CampaignContactsModal.tsx` | Contact status view     |
| `models/Campaign.ts`                   | Campaign schema         |
| `models/CampaignContact.ts`            | Contact schema          |

---

## 🔑 Key Functions

### Exotel Integration

```typescript
// Trigger single call
await triggerExotelCall({
  phoneNumber: "9876543210",
  contactName: "John Doe",
  contactId: "contact-id",
});

// Trigger bulk calls
await triggerBulkCalls(contacts, onProgress, delay);
```

### API Endpoint

```typescript
POST /api/campaigns/start
Body: { "campaign_id": "..." }
```

### Dashboard Handler

```typescript
handleStartCampaign(campaign) {
  // Confirms and starts campaign
}
```

---

## 📊 Database Fields

### Campaign

- `total_contacts`: Total to call
- `calls_completed`: Successful calls
- `calls_failed`: Failed calls
- `started_at`: Start timestamp

### CampaignContact

- `call_status`: pending | initiated | completed | failed
- `call_sid`: Exotel call ID
- `call_started_at`: Call start time
- `call_ended_at`: Call end time
- `call_error`: Error message

---

## 🎨 UI Components

### Start Button

```tsx
<button
  onClick={() => onStartCampaign(campaign)}
  disabled={campaign.status === "running" && !!campaign.started_at}
>
  Start
</button>
```

### Progress Display

```tsx
{
  campaign.total_contacts && (
    <span>
      {calls_completed}/{total_contacts}
      {calls_failed && <span>({calls_failed} failed)</span>}
    </span>
  );
}
```

### Call Status Badge

```tsx
<span className={statusColor}>
  {status === "completed"
    ? "✓ Completed"
    : status === "initiated"
    ? "⟳ In Progress"
    : status === "failed"
    ? "✕ Failed"
    : "○ Pending"}
</span>
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm run test:coverage

# Run specific tests
npm run test:unit -- __tests__/lib/exotel.test.ts
npm run test:unit -- __tests__/api/campaigns-start.test.ts
npm run test:unit:components -- CampaignsTable

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 🔧 Configuration

### Call Delay

Default: 2000ms (2 seconds)
Located in: `triggerBulkCalls()` function

### Phone Number Format

Input: `9876543210` or `09876543210` or `919876543210`
Output: `919876543210` (automatically formatted)

---

## ⚠️ Common Issues

### Campaign Already Running

**Error**: "Campaign is already running"
**Solution**: Wait for current execution to complete

### No Contacts Found

**Error**: "No contacts found for this campaign"
**Solution**: Upload contacts via Edit → CSV Upload

### Invalid Phone Number

**Error**: "Invalid phone number format"
**Solution**: Ensure 10-digit numbers in CSV (91 prefix auto-added)

---

## 📈 Monitoring

### Campaign Progress

- View in **Progress** column of campaigns table
- Format: `45/100 (5 failed)`

### Individual Call Status

- Click **View** button on campaign
- See detailed status for each contact
- Check error messages for failed calls

---

## 🎯 Status Lifecycle

```
Campaign: stopped → running → completed
Contact: pending → initiated → completed/failed
```

---

## 🔐 Security Notes

- All credentials in environment variables
- Server-side API calls only
- No client-side credential exposure
- Campaign ownership validation via user_id

---

## 📞 Support

For issues or questions:

1. Check error logs in browser console
2. View detailed error in contact modal
3. Check campaign status in database
4. Verify environment variables are set

---

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Exotel account credentials verified
- [ ] Test with sample contacts
- [ ] Monitor first campaign execution
- [ ] Check call completion rates
- [ ] Verify error handling
- [ ] Set up production monitoring

---

**Last Updated**: October 16, 2025
