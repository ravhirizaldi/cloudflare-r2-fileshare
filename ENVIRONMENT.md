# Environment Configuration Guide

This guide explains how to set up environment variables for both the frontend (Vue.js) and backend (Cloudfla- **`.env` fi### **What Should Be Committed

- **`.env.example` files (with placeholder values)
- **`wrangler.jsonc.example` (with placeholder values)
- Configuration code that reads from environment variablesith real credentials
- **`.dev.vars` files
- **`wrangler.jsonc` with real resource IDs
- Any files containing:orkers) components of the R2 File Share application.

## Frontend Configuration (vue-file-share)

### Environment Files

1. **`.env.example`** - Template file showing all available environment variables
2. **`.env`** - Your local development environment variables
3. **`.env.production`** - Production environment variables

### Available Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8787` | `https://your-worker.your-domain.workers.dev` |
| `VITE_API_TIMEOUT` | API request timeout in milliseconds | `30000` | `30000` |
| `VITE_APP_TITLE` | Application title | `R2 File Share` | `My File Share App` |
| `VITE_MAX_FILE_SIZE` | Maximum file size in bytes | `100000000` | `100000000` |
| `VITE_ALLOWED_FILE_TYPES` | Allowed file types | `*` | `image/*,application/pdf` |

### Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   ```bash
   # API Configuration
   VITE_API_BASE_URL=https://file-gateway.it-dev-635.workers.dev
   VITE_API_TIMEOUT=30000
   
   # App Configuration
   VITE_APP_TITLE=R2 File Share (Development)
   VITE_MAX_FILE_SIZE=100000000
   VITE_ALLOWED_FILE_TYPES=*
   
   # Environment
   NODE_ENV=development
   ```

3. For production, create `.env.production`:
   ```bash
   # API Configuration
   VITE_API_BASE_URL=https://your-production-worker.workers.dev
   VITE_API_TIMEOUT=30000
   
   # App Configuration
   VITE_APP_TITLE=R2 File Share
   VITE_MAX_FILE_SIZE=100000000
   VITE_ALLOWED_FILE_TYPES=*
   
   # Environment
   NODE_ENV=production
   ```

## Backend Configuration (worker-gateway)

### Environment Files

1. **`.env.example`** - Template file for environment variables
2. **`.dev.vars`** - Local development variables (used by Wrangler)
3. **`wrangler.jsonc.example`** - Template for Cloudflare configuration

### Available Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | None | `your-super-secret-key-here` |
| `CORS_ORIGIN` | Allowed CORS origin | None | `http://localhost:5173` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `104857600` | `104857600` |
| `DEFAULT_EXPIRY_HOURS` | Default file expiry in hours | `24` | `24` |
| `MAX_DOWNLOADS_DEFAULT` | Default maximum downloads | `10` | `10` |

### Setup Instructions

1. Copy the example files:
   ```bash
   cp .env.example .env
   cp wrangler.jsonc.example wrangler.jsonc
   ```

2. Create `.dev.vars` for local development:
   ```bash
   # JWT Configuration
   JWT_SECRET=super-secret-jwt-key-for-development-only-change-this-in-production-1234567890
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   
   # File Configuration
   MAX_FILE_SIZE=104857600
   DEFAULT_EXPIRY_HOURS=24
   MAX_DOWNLOADS_DEFAULT=10
   
   # Environment
   NODE_ENV=development
   ```

3. Update `wrangler.jsonc` with your Cloudflare resources:
   ```jsonc
   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "name": "your-worker-name",
     "main": "src/index.js",
     "compatibility_date": "2025-09-23",
     "observability": {
       "enabled": true
     },
     "vars": {
       "CORS_ORIGIN": "http://localhost:5173",
       "MAX_FILE_SIZE": "104857600",
       "DEFAULT_EXPIRY_HOURS": "24"
     },
     "r2_buckets": [
       {
         "binding": "MY_BUCKET",
         "bucket_name": "your-actual-bucket-name",
         "preview_bucket_name": "your-actual-bucket-name"
       }
     ],
     "kv_namespaces": [
       {
         "binding": "TOKENS",
         "id": "your-actual-kv-namespace-id",
         "preview_id": "your-actual-kv-namespace-id"
       }
     ],
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "your-actual-database-name",
         "database_id": "your-actual-database-id"
       }
     ]
   }
   ```

## Security Considerations

### What Should Never Be Committed

- `.env` files with real credentials
- `.dev.vars` files
- `wrangler.toml` with real resource IDs
- Any files containing:
  - JWT secrets
  - Database IDs
  - Bucket names
  - KV namespace IDs
  - Production URLs

### What Should Be Committed

- `.env.example` files (with placeholder values)
- `wrangler.toml.example` (with placeholder values)
- Configuration code that reads from environment variables

## Development Workflow

1. **Initial Setup:**
   ```bash
   # Frontend
   cd vue-file-share
   cp .env.example .env
   # Edit .env with your values
   npm run dev
   
   # Backend
   cd ../worker-gateway
   cp .env.example .env
   cp wrangler.jsonc.example wrangler.jsonc
   # Edit both files with your values
   npm run dev
   ```

2. **Working with Different Environments:**
   - Development: Uses `.env` and `.dev.vars`
   - Production: Uses `.env.production` and production wrangler.jsonc

3. **Deploying:**
   ```bash
   # Backend
   npm run deploy
   
   # Frontend (build for production)
   npm run build
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `CORS_ORIGIN` in backend matches frontend URL
   - Check that both development and production environments are configured

2. **API Connection Issues:**
   - Verify `VITE_API_BASE_URL` points to the correct backend URL
   - Check that the backend is running and accessible

3. **File Upload Issues:**
   - Verify `MAX_FILE_SIZE` configuration
   - Check that R2 bucket permissions are correct

### Environment Variable Debugging

You can check loaded environment variables in the browser console:
```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
console.log('Environment:', import.meta.env.MODE)
```

## Best Practices

1. **Never hardcode sensitive values**
2. **Use different configurations for different environments**
3. **Keep example files up to date**
4. **Use descriptive variable names**
5. **Document all environment variables**
6. **Validate environment variables on startup**

This setup ensures that your application is secure, configurable, and ready for deployment across different environments.
