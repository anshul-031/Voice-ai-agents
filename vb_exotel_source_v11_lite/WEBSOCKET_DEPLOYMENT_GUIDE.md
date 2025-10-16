# Deployment Guide: Railway vs Render vs Fly.io

## 🚀 Quick Comparison for WebSocket Hosting

| Platform | WebSocket Support | Free Tier | Setup Time | Difficulty |
|----------|------------------|-----------|------------|------------|
| **Railway** | ✅ Full | $5/month credit | 2 min | ⭐ Easy |
| **Render** | ✅ Full | 750 hrs/month | 3 min | ⭐ Easy |
| **Fly.io** | ✅ Full | 3 apps free | 5 min | ⭐⭐ Medium |
| **Vercel** | ⚠️ Limited | Unlimited | 1 min | ⭐ Easy |

---

## 🎯 Recommended: Railway.app

### Why Railway?
- ✅ True WebSocket support (no timeouts)
- ✅ Auto-detects Next.js
- ✅ GitHub integration (auto-deploy on push)
- ✅ Simple environment variable management
- ✅ Free $5/month credit (plenty for testing)
- ✅ Great for voice/real-time applications

### Quick Setup Steps

1. **Sign up:** https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select repository:** `Pelocal-Fintech/vb_exotel`
4. **Add environment variables:**
   ```
   ASSEMBLYAI_API_KEY=your_key
   GEMINI_API_KEY=your_key
   DEEPGRAM_API_KEY=your_key
   MONGODB_URI=your_uri (optional)
   ```
5. **Deploy** → Wait ~2 minutes
6. **Get your URL:** `https://vb-exotel-production.up.railway.app`

### WebSocket URL for Exotel
```
wss://vb-exotel-production.up.railway.app/api/exotel/ws-static?sample-rate=8000
```

---

## 🔄 Alternative: Render.com

### Why Render?
- ✅ True WebSocket support
- ✅ 750 free hours/month (enough for 24/7 testing)
- ✅ Auto-deploy from GitHub
- ✅ Good documentation

### Quick Setup Steps

1. **Sign up:** https://render.com
2. **New Web Service**
3. **Connect GitHub:** `Pelocal-Fintech/vb_exotel`
4. **Configure:**
   - Name: `vb-exotel`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add environment variables** (same 3-4 keys)
6. **Create Web Service**
7. **Get your URL:** `https://vb-exotel.onrender.com`

### WebSocket URL for Exotel
```
wss://vb-exotel.onrender.com/api/exotel/ws-static?sample-rate=8000
```

---

## ⚡ Advanced: Fly.io

### Why Fly.io?
- ✅ Global edge network
- ✅ True WebSocket support
- ✅ 3 free apps
- ⚠️ Requires CLI setup

### Quick Setup Steps

1. **Install Fly CLI:** https://fly.io/docs/hands-on/install-flyctl/
2. **Sign up:** `fly auth signup`
3. **Launch app:**
   ```bash
   cd c:\Users\Window\Desktop\AnshulBot\vb_exotel
   fly launch
   ```
4. **Set secrets:**
   ```bash
   fly secrets set ASSEMBLYAI_API_KEY=your_key
   fly secrets set GEMINI_API_KEY=your_key
   fly secrets set DEEPGRAM_API_KEY=your_key
   ```
5. **Deploy:** `fly deploy`
6. **Get URL:** `https://vb-exotel.fly.dev`

### WebSocket URL for Exotel
```
wss://vb-exotel.fly.dev/api/exotel/ws-static?sample-rate=8000
```

---

## 🔧 What About Vercel?

### Current Limitation
Vercel Edge Functions have **~25 second WebSocket timeout** and may not properly handle WebSocket upgrades from external services like Exotel.

### Use Vercel For
- ✅ Dashboard UI (keep it on Vercel)
- ✅ HTTP APIs (config-status, etc.)
- ✅ Static hosting

### Don't Use Vercel For
- ❌ Long-lived WebSocket connections
- ❌ Real-time voice streaming
- ❌ Telephony integrations

---

## 🎯 My Recommendation

**For Exotel Integration:**
1. **Deploy WebSocket on Railway** (easiest, most reliable)
2. **Keep dashboard on Vercel** (optional, but Vercel is great for UI)

**WebSocket URL for Exotel:**
```
wss://YOUR_RAILWAY_DOMAIN/api/exotel/ws-static?sample-rate=8000
```

This gives you the best of both worlds:
- Railway handles voice/WebSocket (reliable, no timeouts)
- Vercel handles UI/dashboard (fast, free)

---

## 📊 Cost Comparison

| Platform | Free Tier | After Free | Best For |
|----------|-----------|------------|----------|
| Railway | $5 credit/month | $0.000463/GB-hour | Testing & Production |
| Render | 750 hrs/month | $7/month | Light production |
| Fly.io | 3 free apps | Pay as you go | Global apps |
| Vercel | Unlimited (hobby) | $20/month (Pro) | UI/Dashboard only |

---

## ✅ Quick Start Checklist

- [ ] Choose platform (Railway recommended)
- [ ] Create account
- [ ] Connect GitHub repository
- [ ] Add 3-4 environment variables
- [ ] Deploy (auto)
- [ ] Copy new WebSocket URL
- [ ] Update Exotel Stream applet
- [ ] Test call
- [ ] Check logs for `[Exotel WS]` messages

**Estimated setup time:** 5-10 minutes for Railway! 🚀
