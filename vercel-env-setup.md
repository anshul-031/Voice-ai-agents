# Install Vercel CLI first: npm i -g vercel

# Set environment variables using CLI
vercel env add GOOGLE_API_KEY
# Enter your API key when prompted

vercel env add MONGODB_URI  
# Enter your MongoDB connection string when prompted

# List all environment variables
vercel env ls

# Pull environment variables to local .env.local (for development)
vercel env pull .env.local