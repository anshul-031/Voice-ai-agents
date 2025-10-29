# 🚀 WhatsApp Integration - Visual Quick Start

## Your Platform is READY! Here's How to Connect WhatsApp in 25 Minutes

---

## 📱 Part 1: The Platform UI (What You'll See)

### Step 1: Open Your Dashboard
```
┌─────────────────────────────────────────────────┐
│  🏠 Dashboard                          👤 User  │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  📞 Voice Agents                                │
│  📊 Call Logs                                   │
│  📢 Campaigns                                   │
│  ☎️  Phone Numbers                              │
│  💬 WhatsApp Numbers  ← CLICK HERE!            │
│  📚 Agent Knowledge                             │
│  🔐 API Keys                                    │
│  💳 Billing                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 2: WhatsApp Numbers Page (Empty State)
```
┌─────────────────────────────────────────────────┐
│  WhatsApp Numbers                               │
├─────────────────────────────────────────────────┤
│                                                 │
│              📱                                 │
│      No WhatsApp numbers yet                    │
│                                                 │
│   Add a WhatsApp business number to            │
│   route inbound messages through your           │
│   configured voice agents.                      │
│                                                 │
│   ┌──────────────────────────────┐             │
│   │  ➕ Add WhatsApp Number      │ ← CLICK!    │
│   └──────────────────────────────┘             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 3: Add WhatsApp Number Modal (The Form)
```
┌───────────────────────────────────────────────────────┐
│  Add WhatsApp Number                              ✕   │
├───────────────────────────────────────────────────────┤
│                                                       │
│  WhatsApp Number *                                    │
│  ┌─────────────────────────────────────────────┐     │
│  │ +1-555-123-4567                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  Display Name *                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │ Customer Support                            │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  Phone Number ID *        Status                      │
│  ┌──────────────────┐    ┌──────────────────┐        │
│  │ 123456789012345  │    │ ▼ Active         │        │
│  └──────────────────┘    └──────────────────┘        │
│                                                       │
│  Link to Agent (Optional)                             │
│  ┌─────────────────────────────────────────────┐     │
│  │ ▼ Support Agent                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Meta Credentials                          │      │
│  │                                            │      │
│  │  App ID *           App Secret *           │      │
│  │  ┌──────────────┐   ┌──────────────┐      │      │
│  │  │ 987654321098 │   │ ●●●●●●●●●●●● │      │      │
│  │  └──────────────┘   └──────────────┘      │      │
│  │                                            │      │
│  │  Business ID *      Access Token *         │      │
│  │  ┌──────────────┐   ┌──────────────┐      │      │
│  │  │ 111222333444 │   │ ●●●●●●●●●●●● │      │      │
│  │  └──────────────┘   └──────────────┘      │      │
│  │                                            │      │
│  │  Graph API Version                         │      │
│  │  ┌──────────────┐                          │      │
│  │  │ v20.0        │                          │      │
│  │  └──────────────┘                          │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  💡 Tip: Configure the Meta webhook URL shown         │
│     on the WhatsApp numbers list page.                │
│                                                       │
│                                                       │
│  ┌─────────┐  ┌────────────────────────────┐         │
│  │ Cancel  │  │ Add WhatsApp Number        │← CLICK! │
│  └─────────┘  └────────────────────────────┘         │
└───────────────────────────────────────────────────────┘
```

### Step 4: WhatsApp Numbers List (After Adding)
```
┌─────────────────────────────────────────────────────────────┐
│  WhatsApp Numbers                   ➕ Add WhatsApp Number  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────┐  ┌──────────────────────┐   │
│  │ 📱 Customer Support       │  │ 📱 Sales Line        │   │
│  │ +1-555-123-4567          │  │ +1-555-987-6543      │   │
│  │                           │  │                      │   │
│  │ Linked Agent:             │  │ Linked Agent:        │   │
│  │   Support Agent           │  │   Sales Agent        │   │
│  │                           │  │                      │   │
│  │ Status: 🟢 Active         │  │ Status: 🟢 Active    │   │
│  │                           │  │                      │   │
│  │ Phone Number ID:          │  │ Phone Number ID:     │   │
│  │   123456789012345         │  │   543219876543210    │   │
│  │                           │  │                      │   │
│  │ Webhook URL:              │  │ Webhook URL:         │   │
│  │ https://your-domain.com/  │  │ https://your-doma... │   │
│  │ api/meta-webhook          │  │                      │   │
│  │ 📋 Copy  🔗 Open          │  │ 📋 Copy  🔗 Open     │   │
│  │                           │  │                      │   │
│  │ Last: 2 hours ago         │  │ Last: 5 min ago      │   │
│  │                           │  │                      │   │
│  │ 🔄 Refresh  ✏️ Edit  🗑️   │  │ 🔄  ✏️  🗑️          │   │
│  └───────────────────────────┘  └──────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Part 2: Getting Meta Credentials (15 minutes)

### Visual Flow Chart
```
Start
  │
  ├─► 1. Go to developers.facebook.com
  │      Create App → Select "Business"
  │      ↓
  │      Get: App ID, App Secret
  │      (Settings → Basic)
  │
  ├─► 2. Add WhatsApp Product
  │      WhatsApp → Getting Started
  │      ↓
  │      Get: Phone Number ID
  │      Get: Temporary Access Token
  │
  ├─► 3. Get Business ID
  │      business.facebook.com
  │      Business Settings
  │      ↓
  │      Copy Business ID from top
  │
  └─► 4. Create System User Token (Production)
         Business Settings → Users → System Users
         Create user → Generate token
         ↓
         Get: Permanent Access Token
         
All Done! You have 5 credentials ✓
```

### Credentials Checklist
```
┌──────────────────────────────────────────┐
│  Credentials You Need to Collect        │
├──────────────────────────────────────────┤
│  ☐ App ID          (from Settings)      │
│  ☐ App Secret      (from Settings)      │
│  ☐ Phone Number ID (from WhatsApp tab)  │
│  ☐ Business ID     (from Business Settings) │
│  ☐ Access Token    (from System User)   │
└──────────────────────────────────────────┘
```

---

## ⚙️ Part 3: Meta Webhook Configuration (3 minutes)

### In Meta Developer Console
```
┌─────────────────────────────────────────────────────┐
│  WhatsApp → Configuration                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Webhook                                     [Edit] │ ← Click
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Callback URL *                             │   │
│  │  ┌───────────────────────────────────────┐  │   │
│  │  │ https://your-domain.com/api/meta-...  │  │   │
│  │  └───────────────────────────────────────┘  │   │
│  │                                             │   │
│  │  Verify Token *                             │   │
│  │  ┌───────────────────────────────────────┐  │   │
│  │  │ your_secure_verify_token_here_123     │  │   │
│  │  └───────────────────────────────────────┘  │   │
│  │                                             │   │
│  │  [Verify and Save]  ← Click                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Webhook fields                                     │
│  ☑ messages          ← Must be checked!            │
│  ☐ message_status                                   │
│  ☐ message_template_status                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Part 4: Testing Flow (2 minutes)

### Test Message Journey
```
1. You (on phone)
   │
   ├─► Send WhatsApp message
   │   "Hello, I need help with my order"
   │
   ▼
   
2. Meta WhatsApp API
   │
   ├─► Receives your message
   │
   ├─► Sends webhook POST to your platform
   │   POST https://your-domain.com/api/meta-webhook
   │
   ▼
   
3. Your Platform
   │
   ├─► /api/meta-webhook receives it
   │
   ├─► Finds WhatsApp number config
   │   (Matches Phone Number ID)
   │
   ├─► Gets linked agent
   │   (e.g., "Support Agent")
   │
   ├─► Calls AI (Gemini/GPT)
   │   With agent prompt + knowledge
   │
   ├─► Generates response
   │   "Hi! I'd be happy to help with your order..."
   │
   ├─► Sends back to Meta API
   │   POST to graph.facebook.com
   │
   ▼
   
4. Meta WhatsApp API
   │
   ├─► Delivers AI response
   │
   ▼
   
5. You receive reply!
   📱 "Hi! I'd be happy to help with your order.
       Can you provide your order number?"
   
✅ SUCCESS!
```

---

## 📋 Part 5: Complete Checklist (25 minutes total)

### Before You Start
```
☐ Platform deployed and accessible via HTTPS
☐ Meta Business Account created
☐ Meta Developer Account created
☐ WhatsApp Business Account set up
☐ Phone number verified with WhatsApp
```

### Setup Steps
```
□ Meta Setup (15 min)
  ├─ ☐ Create Meta app (2 min)
  ├─ ☐ Add WhatsApp product (2 min)
  ├─ ☐ Copy App ID & Secret (1 min)
  ├─ ☐ Copy Phone Number ID (1 min)
  ├─ ☐ Get Business ID (1 min)
  ├─ ☐ Generate Access Token (3 min)
  └─ ☐ All 5 credentials collected ✓ (5 min buffer)

□ Platform Setup (5 min)
  ├─ ☐ Set META_WEBHOOK_VERIFY_TOKEN in .env.local (1 min)
  ├─ ☐ Navigate to WhatsApp Numbers (1 min)
  ├─ ☐ Click "Add WhatsApp Number" (1 min)
  ├─ ☐ Fill in form with credentials (1 min)
  └─ ☐ Save configuration (1 min)

□ Meta Webhook (3 min)
  ├─ ☐ Copy webhook URL from platform (1 min)
  ├─ ☐ Paste in Meta webhook settings (1 min)
  └─ ☐ Verify webhook (green checkmark) (1 min)

□ Testing (2 min)
  ├─ ☐ Send test message (30 sec)
  ├─ ☐ Receive AI response (30 sec)
  └─ ☐ Verify in platform logs (1 min)

✅ Total: ~25 minutes
```

---

## 🎯 What Each Field Means (Quick Reference)

```
┌────────────────────────────────────────────────────────┐
│ Field              │ What It Is                        │
├────────────────────────────────────────────────────────┤
│ WhatsApp Number    │ Your business phone               │
│                    │ Example: +1-555-123-4567          │
├────────────────────────────────────────────────────────┤
│ Display Name       │ Internal label                    │
│                    │ Example: "Support Bot"            │
├────────────────────────────────────────────────────────┤
│ Phone Number ID    │ Meta's ID for your number         │
│                    │ Example: 123456789012345          │
│                    │ From: WhatsApp → Getting Started  │
├────────────────────────────────────────────────────────┤
│ Status             │ Active = messages processed       │
│                    │ Inactive = messages ignored       │
├────────────────────────────────────────────────────────┤
│ Linked Agent       │ Which AI agent handles messages   │
│                    │ Optional (can use default)        │
├────────────────────────────────────────────────────────┤
│ App ID             │ Your Meta app identifier          │
│                    │ From: Settings → Basic            │
├────────────────────────────────────────────────────────┤
│ App Secret         │ Meta app secret key               │
│                    │ From: Settings → Basic → Show     │
│                    │ ⚠️ Keep this SECRET!              │
├────────────────────────────────────────────────────────┤
│ Business ID        │ Your Meta Business ID             │
│                    │ From: business.facebook.com       │
├────────────────────────────────────────────────────────┤
│ Access Token       │ API authentication token          │
│                    │ From: System User (permanent)     │
│                    │ ⚠️ Keep this SECRET!              │
├────────────────────────────────────────────────────────┤
│ Graph API Version  │ Meta API version                  │
│                    │ Default: v20.0 (usually ok)       │
└────────────────────────────────────────────────────────┘
```

---

## 🚨 Common Mistakes to Avoid

```
❌ WRONG                           ✅ CORRECT
─────────────────────────────────────────────────────────
Using http://                     Using https://
(Meta requires HTTPS)             (Secure connection)

Temporary token in production     System User token
(Expires in 24 hours)             (Never expires)

Different verify tokens           Same verify token
(Platform vs Meta mismatch)       (Must match exactly)

Not subscribing to "messages"     "messages" field checked
(Webhook won't receive msgs)      (Required for messages)

Phone number without +            Phone number with +
(Format: 1234567890)              (Format: +1234567890)

Webhook URL with trailing /       Webhook URL without /
(.../api/meta-webhook/)           (.../api/meta-webhook)
```

---

## 📚 Where to Find Help

```
Issue                          → Check This Document
────────────────────────────────────────────────────────
"I don't know where to click" → WHATSAPP_UI_GUIDE.md
"Webhook won't verify"        → WHATSAPP_TROUBLESHOOTING.md
"Need full setup guide"       → WHATSAPP_INTEGRATION_GUIDE.md
"Want quick 5-step setup"     → QUICK_WHATSAPP_SETUP.md
"What's implemented?"         → WHATSAPP_SUMMARY.md
"General platform help"       → README.md
```

---

## 🎉 You're Ready!

Your platform has **everything built in** - you just need to connect it to Meta!

**Start here**: [Quick Setup Guide (5 steps)](QUICK_WHATSAPP_SETUP.md)

**Questions?** All guides are in the `docs/` folder!

**Good luck!** 🚀💬
