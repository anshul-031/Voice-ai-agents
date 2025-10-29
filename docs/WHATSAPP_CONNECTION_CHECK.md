# 🎯 Quick Answer: How to Check WhatsApp Connection

## ✅ **Simple 30-Second Check**

### Method 1: Send a Test Message (EASIEST)

1. **Open WhatsApp** on your phone
2. **Send a message** to your WhatsApp Business number:
   ```
   Hello
   ```
3. **Wait 5-10 seconds**
4. **Did you get an AI response?**
   - ✅ **YES** = Everything is working! 🎉
   - ❌ **NO** = See [Troubleshooting](#troubleshooting) below

---

## 🖥️ **Check on Your Platform Dashboard**

### Step 1: Open WhatsApp Numbers

1. Log into your platform
2. Go to **Dashboard → WhatsApp Numbers** (in sidebar)

### Step 2: Look at Your Number Card

You'll see something like this:

```
┌─────────────────────────────────────────┐
│ 📱 Customer Support                     │
│ +1-555-123-4567                         │
│                                         │
│ Linked Agent: Support Agent        ← ✓ │
│ Connection Status: 🟢 Connected & Ready  │ ← ✓
│ Status: 🟢 Active                   ← ✓ │
│ Phone Number ID: 123456...         ← ✓ │
│ Last: 2 min ago                    ← ✓ │
└─────────────────────────────────────────┘
```

### What to Check:

| Field | What It Should Show | Meaning |
|-------|---------------------|---------|
| **Linked Agent** | Agent name (e.g., "Support Agent") | ✅ Agent is connected |
| **Connection Status** | 🟢 "Connected & Ready" | ✅ Ready to receive messages |
| **Status** | 🟢 Active | ✅ Number is enabled |
| **Last Interaction** | Recent timestamp | ✅ Receiving messages |

### Connection Status Indicators:

- **🟢 Connected & Ready** (green, pulsing dot)
  - Agent is linked
  - Status is Active
  - **Ready to handle messages!** ✅

- **🟡 Agent Linked (Inactive)** (yellow dot)
  - Agent is linked but status is Inactive
  - **Won't respond to messages** ⚠️
  - Fix: Click Edit → Set status to "Active"

- **🟡 No Agent Linked** (yellow dot)
  - No agent configured
  - **Won't respond to messages** ⚠️
  - Fix: Click Edit → Select an agent

---

## 🔍 **Quick Visual Check**

### ✅ Working Configuration Looks Like:

```
Phone Number: +1-555-123-4567
Display Name: Support Line
Linked Agent: Customer Support Agent     ← Shows actual agent name
Connection Status: 🟢 Connected & Ready   ← Green pulsing dot
Status: 🟢 Active                         ← Green badge
Phone Number ID: 123456789012345         ← Has a value
```

### ❌ NOT Working - Missing Agent:

```
Linked Agent: Not linked                 ← No agent!
Connection Status: 🟡 No Agent Linked     ← Yellow warning
```

### ⚠️ NOT Working - Inactive:

```
Linked Agent: Support Agent              ← Agent exists
Connection Status: 🟡 Agent Linked (Inactive)  ← But inactive!
Status: ⚫ Inactive                       ← Gray badge
```

---

## 🧪 Complete Test Procedure

### Test 1: Basic Message (1 minute)

```
You: "Hello"
     ↓
Wait 5-10 seconds
     ↓
Bot: "Hi! How can I help you today?"
     ↓
✅ WORKING!
```

### Test 2: Check Dashboard (30 seconds)

```
1. Go to WhatsApp Numbers
2. Find your number card
3. Check "Connection Status"
   - 🟢 Green = Working
   - 🟡 Yellow = Not configured
```

### Test 3: Send Multiple Messages (2 minutes)

```
Message 1: "Hi"          → Get response
Message 2: "What can you do?" → Get response
Message 3: "Thank you"   → Get response
     ↓
✅ All 3 responded = WORKING!
```

---

## 🚨 Troubleshooting

### Problem: No Response to Messages

**Check 1**: Is agent linked?
```
Dashboard → WhatsApp Numbers
Look at "Linked Agent" field
- Shows agent name? ✅ Good
- Shows "Not linked"? ❌ Fix: Click Edit → Select agent
```

**Check 2**: Is status Active?
```
Look at status badge
- 🟢 Active? ✅ Good
- ⚫ Inactive? ❌ Fix: Click Edit → Set to Active
```

**Check 3**: Is webhook verified in Meta?
```
Meta App → WhatsApp → Configuration
Look for webhook section
- Green checkmark ✓? ✅ Good
- Red X or no checkmark? ❌ Fix: Re-verify webhook
```

**Check 4**: Is "messages" subscribed?
```
Meta App → WhatsApp → Configuration
Webhook fields:
- ✅ messages checked? ✅ Good
- ☐ messages unchecked? ❌ Fix: Check the box
```

### Problem: Shows "No Agent Linked"

**Fix**:
1. Click **Edit** (✏️) on the WhatsApp number
2. In "Link to Agent" dropdown:
   - **See agents**? Select one → Save
   - **Empty dropdown**? Create an agent first:
     - Go to **Voice Agents** section
     - Click "Add Voice Agent"
     - Fill in name and prompt
     - Save
     - Go back and link it

### Problem: Shows "Agent Linked (Inactive)"

**Fix**:
1. Click **Edit** (✏️) on the WhatsApp number
2. Change **Status** dropdown from "Inactive" to "Active"
3. Click **Save**
4. Should now show "🟢 Connected & Ready"

---

## 📋 Quick Checklist

Before testing, ensure:

- [ ] WhatsApp number added in platform
- [ ] Agent created (in Voice Agents section)
- [ ] Agent linked to WhatsApp number
- [ ] Status is "Active" (not Inactive)
- [ ] Webhook verified in Meta (green ✓)
- [ ] "messages" field subscribed in Meta

If all 6 are checked ✅, send a test message!

---

## 🎓 What Each Status Means

### Connection Status Field

| Status | Dot Color | Meaning | Action Needed |
|--------|-----------|---------|---------------|
| 🟢 Connected & Ready | Green (pulsing) | Fully configured and active | None - send test message! |
| 🟡 Agent Linked (Inactive) | Yellow | Agent configured but inactive | Change status to Active |
| 🟡 No Agent Linked | Yellow | No agent configured | Link an agent |

### Status Badge

| Badge | Meaning | Messages |
|-------|---------|----------|
| 🟢 Active | Number is enabled | Will be processed ✅ |
| ⚫ Inactive | Number is disabled | Will be ignored ❌ |

---

## 💡 Pro Tips

1. **Look for the green dot** 🟢 - If you see "Connected & Ready" with a pulsing green dot, you're good to go!

2. **Agent name should show** - If you see "Not linked" instead of an agent name, that's the problem

3. **Test immediately** - Don't wait! Send a test message right after setup

4. **Check "Last Interaction"** - This updates every time you send a message (great way to verify)

5. **Browser console** - Press F12 and look for `"Loaded agents: X"` when opening the modal

---

## 📞 Still Stuck?

### For detailed troubleshooting:
→ [Complete Testing Guide](WHATSAPP_TESTING_GUIDE.md)

### For setup help:
→ [Integration Guide](../WHATSAPP_INTEGRATION_GUIDE.md)

### For fixing issues:
→ [Troubleshooting Guide](WHATSAPP_TROUBLESHOOTING.md)

---

## ✨ Summary

**The easiest way to check:**

1. **Look at dashboard** → See "🟢 Connected & Ready"
2. **Send WhatsApp message** → Get AI response within 10 seconds
3. **Check "Last Interaction"** → Shows recent timestamp

**All 3 true = You're connected!** 🎉
