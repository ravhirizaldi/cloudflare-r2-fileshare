# Production Deployment Guide

This guide covers deploying the R2 File Share frontend with all advanced features including anti-IDM protection and streaming downloads.

## 🚀 Quick Deploy

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder** to your hosting service
3. **Configure backend URL** via environment variables
4. **Test anti-IDM features** with executable files

## 🛡️ Anti-IDM Features in Production

The built application includes all anti-IDM protection:

### Client-Side Features
- ✅ **File masking** for executables during upload
- ✅ **Smart download detection** based on file types  
- ✅ **Multiple fallback strategies** for reliable downloads
- ✅ **Progress tracking** with streaming support

### Browser Compatibility
- ✅ **Chrome/Edge** - Full support including fetch streams
- ✅ **Firefox** - Full support with XMLHttpRequest fallback
- ✅ **Safari** - Supports core features, graceful degradation
- ✅ **Mobile browsers** - Optimized for touch interfaces

## Testing with Live Server

After building the application, you can test it locally using Live Server:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Serve with Live Server**:
   - Install Live Server extension in VS Code
   - Right-click on `dist/index.html` and select "Open with Live Server"
   - Or configure VS Code to use `./dist` as the Live Server root (already configured in `.vscode/settings.json`)

## Build Configuration

The application is configured with:
- **Relative base path** (`base: './'`) for compatibility with different hosting scenarios
- **Environment variable replacement** in HTML templates
- **Optimized asset bundling** with proper MIME types
- **Code splitting** for better loading performance

## Common Issues

### MIME Type Errors
If you see MIME type errors in the browser console, ensure:
- The web server is properly serving CSS files with `text/css` MIME type
- Asset paths are relative (`./assets/`) not absolute (`/assets/`)
- The build was completed successfully

### Environment Variables Not Replaced
If you see `%VITE_APP_TITLE%` in the browser:
- Ensure `.env` file exists with `VITE_APP_TITLE=Your App Name`
- Rebuild the application after changing environment variables
- Check that the Vite HTML transform plugin is working

## Deployment

The built files in the `dist/` directory can be deployed to any static hosting service:
- Vercel, Netlify, GitHub Pages
- Apache, Nginx, or other web servers  
- CDN services

### Web Server Configuration

Make sure to configure your web server to:
1. **SPA Routing**: Serve `index.html` for all routes (SPA fallback)
2. **MIME Types**: Set proper types for CSS and JS files
3. **Compression**: Enable gzip compression for performance
4. **Security Headers**: Add CORS headers for API requests

### Environment Variables

Configure these variables for production:

```bash
VITE_API_BASE_URL=https://your-worker.workers.dev
VITE_APP_TITLE=R2 File Share
VITE_API_TIMEOUT=30000
```

### Testing Checklist

After deployment, verify:

- ✅ **File Upload**: Test with various file types
- ✅ **Executable Protection**: Upload `.exe` files, check console logs
- ✅ **Download Progress**: Test with large files (>10MB) 
- ✅ **IDM Bypass**: Test with download manager installed
- ✅ **Mobile Support**: Test on mobile devices
- ✅ **CORS**: Verify API calls work from production domain

## 🔧 Advanced Configuration

### CSP Headers (Optional)
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  connect-src 'self' https://your-worker.workers.dev;
  blob: data:
```

### Performance Headers
```
Cache-Control: public, max-age=31536000, immutable (for assets)
Cache-Control: no-cache (for index.html)
```
