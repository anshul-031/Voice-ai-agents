# PowerShell deployment check script
Write-Host "🚀 Preparing Vercel deployment for VB Exotel..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

# Check for build errors
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps for Vercel deployment:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Import your GitHub repository: https://github.com/Pelocal-Fintech/vb_exotel" -ForegroundColor White
    Write-Host "3. Set environment variables in Vercel dashboard:" -ForegroundColor White
    Write-Host "   - GOOGLE_API_KEY" -ForegroundColor White
    Write-Host "   - MONGODB_URI" -ForegroundColor White
    Write-Host "   - Any other API keys you're using" -ForegroundColor White
    Write-Host "4. Deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Environment variables template available in .env.example" -ForegroundColor Yellow
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}