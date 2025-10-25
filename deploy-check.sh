#!/bin/bash

echo "🚀 Preparing Vercel deployment for VB Exotel..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check for build errors
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps for Vercel deployment:"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import your GitHub repository: https://github.com/Pelocal-Fintech/vb_exotel"
    echo "3. Set environment variables in Vercel dashboard:"
    echo "   - GOOGLE_API_KEY"
    echo "   - MONGODB_URI"
    echo "   - Any other API keys you're using"
    echo "4. Deploy!"
    echo ""
    echo "💡 Environment variables template available in .env.example"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi