# R2 File Share - Worker Gateway

Cloudflare Workers-based backend API for the R2 File Share platform, featuring advanced anti-IDM protection and streaming downloads.

## 🚀 Overview

This Cloudflare Workers application provides a secure, scalable backend for temporary file sharing with automatic cleanup, download limits, and advanced protection against download manager interference.

## ⭐ Key Features

### Core Features
- 🔐 **JWT Authentication** - Secure user registration and login
- 📁 **File Storage** - Cloudflare R2 integration with metadata tracking  
- 🔗 **Temporary Links** - Secure download tokens with expiration
- 📊 **Download Limits** - Configurable limits or unlimited access
- 🧹 **Auto Cleanup** - Scheduled removal of expired files
- ⚡ **KV Caching** - Fast token lookup and validation

### Advanced Features
- 🛡️ **Anti-IDM Protection** - Multi-layer bypass for download managers
- 🌊 **Streaming Support** - HTTP range requests and progress tracking
- 🎭 **File Masking** - Smart disguising of executable files
- 📈 **Performance Monitoring** - Request tracking and optimization

## 🛡️ Anti-IDM Technology

### Server-Side Implementation

The worker implements sophisticated techniques to prevent Internet Download Manager (IDM) interference:

#### File Masking System
```javascript
// Upload handler processes masked files
const originalName = form.get('originalName')
const displayName = originalName || file.name

// Store with masked filename but preserve original
const meta = {
  key,
  name: displayName,              // Original name for display
  originalName: originalName,     // Track if file was masked
  // ... other metadata
}
```

#### Response Masking
```javascript
// Different headers for executable vs normal files
const isExecutable = meta.originalName && 
  meta.originalName.toLowerCase().endsWith('.exe')

const antiIDMHeaders = isExecutable ? {
  'Content-Type': 'text/plain',           // IDM ignores text files
  'X-Content-Type-Options': 'nosniff',
  // No Content-Disposition for executables
} : {
  'Content-Type': meta.mime,
  'Content-Disposition': `attachment; filename="${meta.name}"`,
}
```

#### Custom Headers
- `X-Is-Executable`: Indicates if file needs special client handling
- `X-Original-Name`: Provides original filename for restoration
- `X-File-Name`: Current filename (may be masked)
- Anti-cache headers to prevent IDM analysis

## 🌊 Streaming Downloads

### HTTP Range Support
```javascript
// Support for resumable downloads
if (range) {
  const parts = range.replace(/bytes=/, '').split('-')
  const start = parseInt(parts[0], 10)
  const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1
  
  // Return partial content with proper headers
  return new Response(rangeObj.body, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${contentLength}`,
      'Content-Length': chunkSize.toString(),
      'Accept-Ranges': 'bytes',
      // ... additional headers
    }
  })
}
```

### Progress Tracking Headers
- `X-File-Size`: Total file size for progress calculation
- `Content-Length`: Current chunk size
- `Accept-Ranges`: Indicates range request support

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user account |
| POST | `/auth/login` | Authenticate user (returns JWT) |
| GET | `/me` | Get current user profile |

### File Management  
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload files with optional masking |
| GET | `/myfiles` | List user's files (paginated) |
| GET | `/r/{token}` | Download file by token |
| GET | `/status/{token}` | Get file status and metadata |
| GET | `/public-status/{token}` | Get public file information |

### Request Parameters

#### Upload
- `unlimited=true` - Remove download limits
- `expiry=1d` - Set expiration (1h, 30m, 1d, 1month, etc.)
- `originalName` - Original filename for masked files

#### File Listing
- `page=1` - Page number for pagination  
- `limit=10` - Items per page

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user'
);

-- Files table  
CREATE TABLE files (
  id TEXT PRIMARY KEY,           -- Download token
  owner TEXT NOT NULL,           -- Username
  filename TEXT NOT NULL,        -- Display filename (original)
  key TEXT NOT NULL,             -- R2 storage key (may be masked)
  mime TEXT,                     -- Content type
  unlimited INTEGER DEFAULT 0,   -- Unlimited downloads flag
  max_downloads INTEGER,         -- Download limit
  downloads INTEGER DEFAULT 0,   -- Current download count
  expires_at INTEGER             -- Expiration timestamp
);
```

## ⚙️ Configuration

### Environment Variables (`wrangler.toml`)
```toml
[vars]
CORS_ORIGIN = "https://your-frontend-domain.com"
MAX_FILE_SIZE = "104857600"        # 100MB
DEFAULT_EXPIRY_HOURS = "24" 
MAX_DOWNLOADS_DEFAULT = "5"
JWT_SECRET = "your-secret-key"
```

### Cloudflare Resources
```toml
# R2 Bucket for file storage
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "your-r2-bucket"

# KV for token caching  
[[kv_namespaces]]
binding = "TOKENS"
id = "your-kv-namespace-id"

# D1 for metadata storage
[[d1_databases]]
binding = "DB"  
database_name = "your-d1-database"
database_id = "your-d1-database-id"

# Scheduled cleanup
[triggers]
crons = ["0 * * * *"]  # Every hour
```

## 🔧 Development

### Setup
```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create resources
wrangler d1 create r2-fileshare-db
wrangler r2 bucket create r2-fileshare-bucket  
wrangler kv namespace create "TOKENS"

# Initialize database
wrangler d1 execute r2-fileshare-db --file=schema.sql

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm run test

# Test specific features
npm run test -- anti-idm
npm run test -- streaming
```

### Deployment
```bash
# Deploy to production
npm run deploy

# Deploy with custom config
wrangler deploy --config wrangler.prod.toml
```

## 🧹 Automatic Cleanup

The worker includes a scheduled cleanup job that runs hourly:

```javascript
// Cleanup expired files
export default {
  async scheduled(event, env, ctx) {
    const now = Date.now()
    
    // Find expired files
    const expired = await env.DB.prepare(
      `SELECT id, key FROM files WHERE expires_at < ? AND expires_at IS NOT NULL`
    ).bind(now).all()
    
    // Delete from storage and database
    for (const file of expired.results) {
      await env.MY_BUCKET.delete(file.key)
      await env.TOKENS.delete(`tokens:${file.id}`)
      await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(file.id).run()
    }
  }
}
```

## 🔒 Security Features

- **Password Hashing** - Secure bcrypt-style hashing
- **JWT Validation** - Token-based authentication
- **File Access Control** - Users can only access their own files  
- **Rate Limiting** - Built-in Cloudflare protection
- **CORS Configuration** - Proper cross-origin headers
- **Input Validation** - Sanitization of all user inputs

## 📈 Performance Optimizations

- **KV Caching** - Token metadata cached for fast lookups
- **Streaming Responses** - No memory buffering for large files
- **HTTP/2** - Native Cloudflare Workers support
- **Global Distribution** - Cloudflare's edge network
- **Automatic Scaling** - Serverless architecture

## 🐛 Debugging

### Development Logs
```bash
# View live logs
wrangler tail

# Filter by request type
wrangler tail --format pretty --grep "upload"
```

### Common Issues

**CORS Errors**: Check `CORS_ORIGIN` environment variable  
**Database Issues**: Verify D1 binding and schema  
**Storage Problems**: Confirm R2 bucket permissions  
**Auth Failures**: Validate JWT secret configuration

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
