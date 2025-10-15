# 🚀 Quick Start: Telephony Integration

## 5-Minute Setup Guide

### Step 1: Import Phone Number (Dashboard)
```
Dashboard → Phone Number → Import Phone Number
```

Fill in:
- **Phone Number**: +919876543210
- **Display Name**: Support Line
- **Provider**: Exotel

### Step 2: Exotel Configuration
```
API Key: [from Exotel dashboard]
API Token: [from Exotel dashboard]
SID: [your account SID]
Domain: api.in.exotel.com
Region: in (India)
```

### Step 3: Link Agent
```
Select Agent: [Choose your AI agent]
```

### Step 4: Copy Webhook URL
After saving, copy the **HTTPS Webhook URL**:
```
https://your-domain.com/api/telephony/webhook/phone_xxxxx
```

### Step 5: Configure Exotel
1. Go to https://my.exotel.com
2. Navigate to: **App Bazaar → Your App**
3. Set **Answer URL** = [Your Webhook URL]
4. Set **HTTP Method** = POST
5. Click **Save**

### Step 6: Test!
📱 Call your Exotel number from your mobile phone  
🎉 AI should answer and handle the conversation

---

## 📋 Checklist

- [ ] Exotel account active
- [ ] Phone number purchased from Exotel
- [ ] API credentials from Exotel dashboard
- [ ] AI agent created in dashboard
- [ ] Phone number imported in system
- [ ] Webhook URL copied
- [ ] Exotel portal configured
- [ ] Test call successful

---

## 🆘 Quick Troubleshooting

### Webhook Not Working?
- ✅ Check URL is HTTPS (not HTTP)
- ✅ Verify URL in Exotel portal is correct
- ✅ Ensure phone number is "active" in dashboard
- ✅ Check server logs for errors

### Agent Not Responding?
- ✅ Verify agent is linked to phone number
- ✅ Check agent has valid prompt
- ✅ Confirm LLM API keys are configured

### Multiple Sessions in Logs?
- ✅ Frontend must generate session ID once per call
- ✅ Use same session ID for all messages in call
- ✅ See TELEPHONY_SETUP.md for details

---

## 🔗 Useful Links

- **Full Documentation**: See `TELEPHONY_SETUP.md`
- **Exotel Docs**: https://developer.exotel.com
- **Dashboard**: `/dashboard → Phone Number`
- **Call Logs**: `/dashboard → Call Logs`

---

## 🎯 Common Use Cases

### Customer Support
```
Phone: +91 800 000 0001
Agent: Customer Support Agent
Prompt: "You are a helpful support agent..."
```

### Lead Generation
```
Phone: +91 800 000 0002
Agent: Sales Agent
Prompt: "You are a friendly sales representative..."
```

### Appointment Booking
```
Phone: +91 800 000 0003
Agent: Booking Agent
Prompt: "You help customers book appointments..."
```

---

## 💡 Pro Tips

1. **Test First**: Use a test number before production
2. **Monitor Logs**: Check Call Logs regularly
3. **Backup Config**: Save Exotel credentials securely
4. **Link Wisely**: Different numbers can have different agents
5. **Update Prompts**: Refine agent prompts based on call logs

---

**Need Help?** Check `TELEPHONY_SETUP.md` for detailed guide!
