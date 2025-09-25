# R2 File Share - Advanced Temporary File Sharing Platform

A cutting-edge, secure file sharing platform with **Anti-Download Manager Technology** and **Streaming Downloads**. Built with Vue 3 frontend and Cloudflare Workers backend featuring advanced download manager bypass, real-time progress tracking, and enterprise-grade security.

## 🚀 Project Overview

R2 File Share is a next-generation full-stack application that revolutionizes temporary file sharing with advanced protection against download manager interference, streaming downloads, and intelligent file handling. Perfect for sharing sensitive files, large media, software distributions, and any content that needs secure, temporary access.

### 🎯 Key Innovations

- 🛡️ **Multi-Layer Download Manager Protection** - Advanced bypass system for IDM/FDM and similar tools
- 🌊 **Streaming Downloads** - Real-time progress tracking with resume capability for files of any size
- 🎭 **Smart File Masking** - Automatic protection for executable files with transparent restoration
- ⚡ **High Performance** - Edge-distributed infrastructure with global CDN
- 🔒 **Enterprise Security** - JWT authentication, file access control, and automatic cleanup

### 🏗️ Architecture

- **Frontend**: Vue 3 + Vite 7 + Tailwind CSS v4 with modern component architecture
- **Backend**: Cloudflare Workers with edge computing and global distribution
- **Storage**: Cloudflare R2 with intelligent file management and streaming support
- **Database**: Cloudflare D1 (SQLite) for metadata and user management
- **Cache**: Cloudflare KV for high-speed token validation and session management
- **Security**: JWT-based authentication with bcrypt password hashing
- **CDN**: Global edge network for optimal download speeds

## ⭐ Core Features

### 🛡️ Anti-Download Manager Technology
Our **5-layer defense system** completely bypasses Internet Download Manager and similar tools:

1. **🎭 File Masking** - Executable files automatically renamed with safe extensions during upload
2. **🕵️ Request Disguising** - Anti-detection headers that make downloads appear as web browsing
3. **🛡️ Server Response Masking** - Protected files served as `text/plain` content (IDM ignores text files)
4. **🎪 Client-Side Evasion** - Multiple fallback strategies with data URL conversion
5. **🧪 Detection Avoidance** - Random delays and steganographic downloads


### 🌊 Streaming Downloads
Advanced streaming technology for optimal performance:

- **📊 Real-time Progress** - Live updates with percentage, speed, and ETA
- **🔄 Resume Capability** - HTTP range requests support interrupted downloads
- **⚡ Memory Efficient** - Stream processing without loading entire files
- **📱 Cross-platform** - Works seamlessly on desktop and mobile

### 🔐 Security & Authentication
Enterprise-grade security features:

- **JWT Authentication** - Secure token-based user sessions
- **Password Protection** - Bcrypt hashing with salt rounds
- **File Access Control** - Users can only access their own files
- **Temporary Links** - Automatic expiration prevents unauthorized access
- **Download Limits** - Configurable limits or unlimited access
- **CORS Protection** - Secure cross-origin resource sharing

### 📁 File Management
Intelligent file handling system:

- **Drag & Drop Upload** - Modern interface with multiple file support
- **Smart File Detection** - Automatic identification of file types needing protection
- **Metadata Tracking** - Download counts, expiration dates, and file status
- **Batch Operations** - Upload multiple files simultaneously
- **Auto Cleanup** - Scheduled removal of expired files

### 🎨 Modern User Interface
Beautiful, responsive design built with latest technologies:

- **Vue 3 Composition API** - Modern reactive framework
- **Tailwind CSS v4** - Latest utility-first styling
- **Component Architecture** - Reusable, maintainable components
- **Mobile Responsive** - Perfect experience on all devices
- **Toast Notifications** - Real-time feedback and status updates

## 🏗️ Project Architecture

```
r2-fileshare/
├── vue-file-share/           # Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable Vue components
│   │   │   ├── FileUpload.vue       # Advanced drag & drop with progress
│   │   │   ├── FilesList.vue        # File management dashboard
│   │   │   ├── FileStats.vue        # Real-time statistics
│   │   │   └── AdminPanel.vue       # Admin controls
│   │   ├── views/           # Page components
│   │   │   ├── Dashboard.vue        # Main application interface
│   │   │   ├── Download.vue         # Advanced download page
│   │   │   └── Login.vue            # Authentication
│   │   ├── services/        # API integration
│   │   │   └── api.js              # Anti-IDM download logic
│   │   ├── stores/          # State management
│   │   │   ├── files.js            # File operations store
│   │   │   └── auth.js             # Authentication store
│   │   └── composables/     # Reusable logic
│   │       ├── useToast.js         # Notification system
│   │       ├── useFileIcon.js      # File type icons
│   │       └── useOptimizedFiles.js # Performance optimizations
│   └── config/
│       └── performance.js          # Performance monitoring
│
└── worker-gateway/          # Backend API (Cloudflare Workers)
    ├── src/
    │   ├── index.js        # Main worker with scheduled cleanup
    │   ├── routes/
    │   │   ├── auth.js     # JWT authentication system
    │   │   ├── files.js    # Advanced file handling with Anti-IDM
    │   │   └── admin.js    # Administrative functions
    │   └── helpers/
    │       ├── auth.js     # Authentication utilities
    │       ├── crypto.js   # Cryptographic functions
    │       ├── cleanup.js  # Automatic file cleanup
    │       └── audit.js    # Security auditing
    ├── schema.sql          # Database schema with optimizations
    └── test/               # Comprehensive test suite
        └── index.spec.js   # Anti-IDM and streaming tests
```

## 📡 API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| POST | `/auth/register` | Create new user account | Username validation, password hashing, audit logging |
| POST | `/auth/login` | Authenticate user | JWT token generation, session management, login tracking |
| GET | `/me` | Get user profile | Token validation, user info, role-based access |

### File Management Endpoints
| Method | Endpoint | Description | Special Features |
|--------|----------|-------------|------------------|
| POST | `/upload` | Upload files | Auto-masking executables, progress tracking, audit logging |
| GET | `/myfiles` | List user files | Pagination, filtering, status indicators, sorting |
| GET | `/r/{token}` | Download files | **Anti-IDM protection**, streaming support, download history |
| GET | `/status/{token}` | File information (auth required) | Expiry status, download count, detailed metadata |
| GET | `/public-status/{token}` | Public file info | Safe metadata without authentication |
| DELETE | `/files/bulk-delete` | Delete multiple files | Bulk operations, soft delete, audit trail |

### Administrative Endpoints
| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| DELETE | `/delete/{token}` | Delete single file | Soft delete, owner/admin authorization, audit logging |
| GET | `/stats/{token}` | File statistics | Download analytics, usage metrics, historical data |
| GET | `/user/stats` | User statistics | Personal file analytics, storage usage, activity summary |
| GET | `/admin/audit` | Audit trail | System-wide activity logs, security monitoring |
| POST | `/admin/restore/{token}` | Restore deleted file | Admin-only file recovery, audit logging |

### Advanced Parameters
- `unlimited=true` - Remove download limits for important files
- `expiry=1d|1h|30m|1week|1month` - Custom expiration periods (supports seconds, minutes, hours, days, weeks, months)
- `originalName` - Handle masked executable files and restore original names
- `page=N&limit=N` - Pagination controls for file listings
- `hard=true` - Permanent deletion (admin only)
- `reason=string` - Deletion reason for audit trail


## 🌊 Streaming Technology

### Advanced Download System
Our streaming implementation provides enterprise-grade download capabilities:

#### Real-Time Progress Tracking
```javascript
// Live progress updates with detailed metrics
onProgress: {
  loaded: 2048000,        // Bytes downloaded
  total: 10240000,        // Total file size
  progress: 20,           // Percentage (0-100)
  speed: '1.2 MB/s',      // Current download speed
  eta: '00:06:32',        // Estimated time remaining
  startTime: timestamp    // For speed calculations
}
```

#### HTTP Range Request Support
```javascript
// Server supports resumable downloads
Range: bytes=1024000-    // Resume from 1MB
→ 206 Partial Content
Content-Range: bytes 1024000-10239999/10240000
```

#### Memory Optimization
- **Streaming Processing**: Files processed in chunks, not loaded entirely
- **Garbage Collection**: Automatic cleanup of processed chunks
- **Memory Monitoring**: Prevents browser memory overflow
- **Large File Support**: Handles 10GB+ files efficiently

### Technical Implementation

#### For Normal Files (XMLHttpRequest)
```javascript
const xhr = new XMLHttpRequest()
xhr.onprogress = (e) => onProgress({
  loaded: e.loaded,
  total: e.total,
  progress: Math.round((e.loaded / e.total) * 100)
})
```

#### For Protected Files (Fetch + ReadableStream)
```javascript
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // Process chunk and update progress
  processChunk(value)
  updateProgress(bytesRead, totalSize)
}
```
## 🗄️ Database Schema & Performance

### Optimized Database Design
```sql
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  unlimited INTEGER DEFAULT 0,
  max_downloads INTEGER,
  downloads INTEGER DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  file_size INTEGER,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,
  deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  last_login INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Download history table to track who downloaded what
CREATE TABLE IF NOT EXISTS download_history (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  downloaded_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  ip_address TEXT,
  user_agent TEXT,
  browser_info TEXT,
  country TEXT,
  user_id TEXT,
  download_duration INTEGER,
  bytes_downloaded INTEGER,
  success INTEGER DEFAULT 1,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (user_id) REFERENCES users(username)
);

CREATE INDEX IF NOT EXISTS idx_download_history_file_id ON download_history(file_id);
CREATE INDEX IF NOT EXISTS idx_download_history_downloaded_at ON download_history(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_download_history_ip ON download_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_download_history_user_id ON download_history(user_id);

-- Expired files history to track expired files
CREATE TABLE IF NOT EXISTS expired_files_history (
  id TEXT PRIMARY KEY,
  original_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  owner TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  file_size INTEGER,
  created_at INTEGER,
  expired_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  total_downloads INTEGER DEFAULT 0,
  expiry_reason TEXT -- 'time_expired', 'download_limit_reached', 'manual_deletion'
);

CREATE INDEX IF NOT EXISTS idx_expired_files_owner ON expired_files_history(owner);
CREATE INDEX IF NOT EXISTS idx_expired_files_expired_at ON expired_files_history(expired_at);

-- File statistics table for aggregated stats
CREATE TABLE IF NOT EXISTS file_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  stat_date TEXT NOT NULL, -- YYYY-MM-DD format
  download_count INTEGER DEFAULT 0,
  unique_ips INTEGER DEFAULT 0,
  bytes_transferred INTEGER DEFAULT 0,
  UNIQUE(file_id, stat_date),
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE INDEX IF NOT EXISTS idx_file_stats_file_id ON file_stats(file_id);
CREATE INDEX IF NOT EXISTS idx_file_stats_date ON file_stats(stat_date);

-- Audit trail table for all system actions
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  user_id TEXT,
  action TEXT NOT NULL, -- 'upload', 'download', 'delete', 'login', 'register', 'view_stats', etc.
  resource_type TEXT, -- 'file', 'user', 'system'
  resource_id TEXT, -- file_id, username, etc.
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON string with additional details
  success INTEGER DEFAULT 1,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(resource_type, resource_id);
```

### KV Cache Strategy
```javascript
// Token metadata cached in Cloudflare KV for fast lookups
const cacheKey = `tokens:${token}`
const cached = await env.TOKENS.get(cacheKey, 'json')

// Cache structure
{
  id: "token123",
  filename: "document.pdf",
  originalName: "document.pdf",  // For masked files
  mime: "application/pdf",
  size: 2048000,
  isExecutable: false,
  owner: "username",
  expiresAt: 1727234567890
}
```

## ⚙️ Configuration & Deployment

### Cloudflare Resources Setup
```toml
# wrangler.toml configuration
[vars]
CORS_ORIGIN = "https://your-domain.com"
MAX_FILE_SIZE = "104857600"              # 100MB limit
DEFAULT_EXPIRY_HOURS = "24" 
MAX_DOWNLOADS_DEFAULT = "5"
JWT_SECRET = "your-super-secret-key"
CLEANUP_ENABLED = "true"                 # Automatic cleanup
PERFORMANCE_MONITORING = "true"         # Performance tracking

# Cloudflare R2 Bucket
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "r2-fileshare-production"

# KV Namespace for token caching
[[kv_namespaces]]
binding = "TOKENS"
id = "your-kv-namespace-id"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "r2-fileshare-db"
database_id = "your-d1-database-id"

# Scheduled cleanup (every hour)
[triggers]
crons = ["0 * * * *"]
```

### Environment Variables
| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `CORS_ORIGIN` | Frontend domain | `*` | Set to your domain in production |
| `MAX_FILE_SIZE` | Upload limit | `100MB` | Increase for larger files |
| `DEFAULT_EXPIRY_HOURS` | File expiration | `24` | Default expiry period |
| `MAX_DOWNLOADS_DEFAULT` | Download limit | `5` | Per-file download limit |
| `JWT_SECRET` | Token signing | Required | Use strong random key |
| `CLEANUP_ENABLED` | Auto cleanup | `true` | Disable for debugging |

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ with npm
- Cloudflare account with Workers, R2, D1, and KV enabled
- Wrangler CLI: `npm install -g wrangler`

### 1. Repository Setup
```bash
git clone <your-repository-url>
cd r2-fileshare
```

### 2. Backend Deployment
```bash
cd worker-gateway

# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create Cloudflare resources
wrangler d1 create r2-fileshare-db
wrangler r2 bucket create r2-fileshare-storage
wrangler kv namespace create "TOKENS"

# Update wrangler.toml with resource IDs
# Initialize database
wrangler d1 execute r2-fileshare-db --file=schema.sql

# Deploy backend
npm run deploy
```

### 3. Frontend Setup
```bash
cd ../vue-file-share

# Install dependencies
npm install

# Update API endpoint in src/services/api.js
# Point to your deployed Worker URL

# Start development
npm run dev

# Or build for production
npm run build
```

### 4. Access Your Application
- **Development**: http://localhost:5173
- **API**: https://your-worker.your-subdomain.workers.dev
- **Production**: Deploy frontend to your preferred hosting service

## 🔒 Security & Compliance

### Security Features
- **🔐 Authentication**: JWT with secure token validation
- **🛡️ Authorization**: Role-based access control (user/admin)
- **🔒 Password Security**: Bcrypt hashing with salt rounds
- **⏰ Session Management**: Automatic token expiration and refresh
- **🚫 Access Control**: Users can only access their own files
- **🧹 Auto Cleanup**: Expired files automatically removed
- **📝 audit Logging**: Security events tracked and logged

### Manual Testing Checklist
- [ ] **Anti-IDM Protection**: Upload `.exe` file, verify download works with IDM
- [ ] **Streaming**: Test 100MB+ file with progress tracking
- [ ] **Mobile Compatibility**: Test on iOS/Android devices
- [ ] **Browser Support**: Test on Chrome, Firefox, Safari, Edge
- [ ] **Network Conditions**: Test on slow/unstable connections
- [ ] **Security**: Verify unauthorized access prevention

## 🛠️ Advanced Configuration

### Custom Anti-IDM Settings
```javascript
// config/antiIDM.js
export default {
  detectionDelay: 150,        // Random delay range (ms)
  maxRetries: 3,              // Fallback attempts
  enableSteganography: true,  // Hide downloads as web content
  protectedExtensions: [      // Custom executable extensions
    '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app'
  ],
  fallbackStrategies: [       // Ordered fallback methods
    'dataUrl', 'hiddenFrame', 'newWindow', 'blobUrl'
  ]
}
```

### Performance Tuning
```javascript
// config/performance.js
export default {
  chunkSize: 1024 * 1024,     // 1MB chunks for large files
  progressUpdateFreq: 100,     // Progress updates every 100ms
  cacheTimeout: 3600,         // KV cache timeout (1 hour)
  cleanupInterval: 3600,      // Cleanup every hour
  maxConcurrentUploads: 3,    // Parallel upload limit
  preloadCriticalComponents: true
}
```

### Customization Options
```javascript
// config/app.js
export default {
  branding: {
    name: "Your File Share",
    logo: "/path/to/logo.svg",
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981"
    }
  },
  features: {
    allowAnonymous: false,      // Require login
    maxFileSize: "100MB",       // Upload limit
    defaultExpiry: "1d",        // Default expiration
    enablePublicSharing: true,  // Public download links
    enableComments: false       // File comments/notes
  },
  ui: {
    theme: "auto",              // auto, light, dark
    language: "en",             // Internationalization
    density: "comfortable"      // compact, comfortable, spacious
  }
}
```

## � Documentation & Resources

### 📖 Complete Documentation
- **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Comprehensive environment setup guide
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation with examples

### 🎯 Specialized Guides
- **[Vue Frontend Guide](./vue-file-share/README.md)** - Frontend development and customization
- **[Worker Gateway Guide](./worker-gateway/README.md)** - Backend API and deployment details
- **[Performance Guide](./vue-file-share/PERFORMANCE.md)** - Optimization strategies and metrics
- **[Deployment Guide](./vue-file-share/DEPLOYMENT.md)** - Production deployment best practices

### 🔧 Development Resources
```bash
# Documentation generation
npm run docs:generate        # Auto-generate API docs
npm run docs:serve          # Serve docs locally
npm run docs:build          # Build documentation site

# Code quality tools
npm run lint:all            # Lint entire project
npm run format:all          # Format all code
npm run type-check          # TypeScript validation
npm run audit:security      # Security vulnerability scan
```

### Third-Party Licenses
- All dependencies properly licensed and attributed
- No GPL or copyleft restrictions
- Enterprise-friendly license terms
- Full compliance with open source standards

---

**🌟 Star this repository if you find it useful!**

**🔗 Share with your team and contribute to the project!**

**📧 Questions? Open an issue or start a discussion!**
