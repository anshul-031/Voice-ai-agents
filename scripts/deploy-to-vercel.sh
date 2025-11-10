#!/bin/bash

# 🚀 Deploy Fixed Code to Vercel
# This script helps you deploy the latest fixes to your Vercel production

echo "🚀 Deploying Fixed Webhook Code to Vercel"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Run this script from the project root directory"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo ""
    echo "   Install it:"
    echo "   npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI is installed"
echo ""

# Show current deployment URL
CURRENT_URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d'=' -f2)
echo "📍 Current production URL: $CURRENT_URL"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    echo "   Commit your changes before deploying:"
    echo "   git add ."
    echo "   git commit -m 'Fix webhook ObjectId casting and dynamic URLs'"
    echo "   git push origin exotel-mukul"
    echo ""
    read -p "   Continue deployment anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DEPLOYMENT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Fix errors before deploying"
    exit 1
fi

echo ""
echo "✅ Build successful"
echo ""

echo "2️⃣  Deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IMPORTANT: UPDATE VERCEL ENVIRONMENT VARIABLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Go to Vercel Dashboard and add these environment variables:"
echo ""
echo "1. MONGODB_URI"
echo "   Value: mongodb+srv://mukulrai_db_user:rxHzQuYtSUFN6DHM@cluster0.nnefrop.mongodb.net/..."
echo ""
echo "2. ASSEMBLYAI_API_KEY"
echo "   Value: (from .env.local)"
echo ""
echo "3. GEMINI_API_KEY"
echo "   Value: (from .env.local)"
echo ""
echo "4. DEEPGRAM_API_KEY"
echo "   Value: (from .env.local)"
echo ""
echo "5. SARVAM_API_KEY"
echo "   Value: (from .env.local)"
echo ""
echo "6. NEXT_PUBLIC_APP_URL"
echo "   Value: https://voice-ai-agents-exotel-mukul.vercel.app/"
echo ""
echo "7. META_WEBHOOK_VERIFY_TOKEN"
echo "   Value: (from .env.local)"
echo ""
echo "8. NEXT_PUBLIC_META_WHATSAPP_API_URL"
echo "   Value: (from .env.local)"
echo ""
echo "9. NEXT_PUBLIC_META_WHATSAPP_API_TOKEN"
echo "   Value: (from .env.local)"
echo ""
echo "10. WHATSAPP_VOICE_AGENT_ID"
echo "    Value: (from .env.local)"
echo ""
echo "After adding variables, redeploy or wait for automatic redeployment"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "3️⃣  Get your production webhook URL:"
echo ""
echo "    curl https://voice-ai-agents-exotel-mukul.vercel.app/api/phone-numbers?userId=mukul | jq -r '.phoneNumbers[0].webhookUrl'"
echo ""

echo "4️⃣  Update Exotel Dashboard:"
echo "    - Go to: https://my.exotel.com"
echo "    - Settings → Phone Numbers → 08047359585"
echo "    - Update Answer URL with the webhook URL from step 3"
echo "    - Method: POST"
echo "    - Save"
echo ""

echo "5️⃣  Test by calling 08047359585"
echo ""

echo "6️⃣  Monitor Vercel logs:"
echo "    - Go to: https://vercel.com/dashboard"
echo "    - Select your project"
echo "    - Click 'Logs' tab"
echo "    - Make a test call and watch for webhook hits"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Deployment complete! Follow the steps above to finish setup."
echo ""
