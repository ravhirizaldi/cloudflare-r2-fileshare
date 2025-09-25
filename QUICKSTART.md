# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Cloudflare account (for backend deployment)

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd r2-fileshare
```

### 2. Frontend Setup
```bash
cd vue-file-share

# Interactive setup (recommended)
npm install
npm run setup

# OR manual setup
cp .env.example .env
# Edit .env with your configuration
```

### 3. Backend Setup
```bash
cd ../worker-gateway

# Manual setup
cp .env.example .dev.vars
cp wrangler.jsonc.example wrangler.jsonc
# Edit both files with your Cloudflare resource IDs

npm install
```

### 4. Validate Configuration
```bash
cd ../vue-file-share
npm run env:validate
```

### 5. Start Development
```bash
# Terminal 1 - Frontend
cd vue-file-share
npm run dev
# Runs on http://localhost:5173

# Terminal 2 - Backend  
cd worker-gateway
npm run dev
# Runs on http://localhost:8787
```

### 6. Access Your App
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787

### 7. Test Anti-IDM Features
```bash
# Upload a .exe file to test anti-IDM protection
# Check browser console for masking logs
# Download should work even with IDM installed
```

## 🛡️ Anti-IDM Features Ready

Your setup includes advanced protection against download managers:

✅ **File Masking** - Executable files automatically disguised  
✅ **Request Disguising** - Anti-detection download headers  
✅ **Response Masking** - Server-side protection  
✅ **Streaming Support** - Progress tracking with large files  
✅ **Multiple Fallbacks** - Reliable downloads in all scenarios

## 🔧 Configuration Summary

Your `.env` file should look like:
```bash
VITE_API_BASE_URL=https://your-worker.workers.dev
VITE_APP_TITLE=Your App Name
```

Your `.dev.vars` file should contain:
```bash
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:5173
```

## 📚 Need More Help?

- Read [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed configuration
- Check [README.md](./README.md) for full documentation
- Validate your setup: `npm run env:validate`

## 🎯 What's Configured

✅ **Environment variables** instead of hardcoded URLs  
✅ **Separate dev/prod configurations**  
✅ **Secure credential management**  
✅ **Automatic validation scripts**  
✅ **Interactive setup process**  

Ready to build! 🚀
