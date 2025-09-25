# R2 File Share - Temporary File Sharing Platform

A modern, secure file sharing platform built with Vue 3 frontend and Cloudflare Workers backend. Share files with temporary download links, user authentication, and automatic cleanup.

## 🚀 Project Overview

R2 File Share is a full-stack application that allows users to upload files and share them via temporary download links. The platform features user authentication, file expiration management, download limits, and automatic cleanup of expired files.

### Architecture

- **Frontend**: Vue 3 + Vite application with modern UI/UX
- **Backend**: Cloudflare Workers API with D1 database, R2 storage, and KV cache
- **Storage**: Cloudflare R2 for file storage
- **Database**: Cloudflare D1 (SQLite) for metadata
- **Cache**: Cloudflare KV for temporary token storage
- **Authentication**: JWT-based authentication system

## 📁 Project Structure

```
r2-fileshare/
├── file-gateway/           # Backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.js        # Main worker entry point
│   │   ├── routes/         # API route handlers
│   │   │   ├── auth.js     # Authentication routes
│   │   │   └── files.js    # File management routes
│   │   └── helpers/        # Utility functions
│   │       ├── auth.js     # Auth helpers
│   │       ├── cleanup.js  # File cleanup utilities
│   │       └── crypto.js   # Cryptographic functions
│   ├── schema.sql          # Database schema
│   ├── wrangler.toml       # Cloudflare configuration
│   └── package.json        # Backend dependencies
│
└── r2-temporary-share/     # Frontend (Vue 3)
    ├── src/
    │   ├── components/     # Reusable Vue components
    │   ├── views/          # Page components
    │   ├── stores/         # Pinia state management
    │   ├── services/       # API services
    │   ├── composables/    # Vue composables
    │   └── router/         # Vue Router configuration
    ├── vite.config.js      # Vite configuration
    └── package.json        # Frontend dependencies
```

## 🔧 Backend (file-gateway)

### Technology Stack

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare R2 Buckets
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV (for token storage)
- **Testing**: Vitest with Workers pool

### Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📁 **File Upload** - Store files in Cloudflare R2 with metadata tracking
- 🔗 **Temporary Links** - Generate secure download tokens with expiration
- 📊 **Download Limits** - Configurable download limits or unlimited access
- 🧹 **Automatic Cleanup** - Scheduled job to remove expired files
- 📈 **File Tracking** - Monitor download counts and file status
- ⚡ **Token Caching** - Fast token lookup using Cloudflare KV
- 🛡️ **Anti-IDM Protection** - Advanced bypass for download managers (IDM)
- 🌊 **Streaming Downloads** - Progress tracking with real-time updates
- 🎭 **Smart File Masking** - Executable files disguised to prevent interference

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Authenticate user (returns JWT) |
| GET | `/me` | Get user profile |
| POST | `/upload` | Upload files (supports `unlimited=true` param) |
| GET | `/myfiles` | List user's files with pagination |
| GET | `/r/{token}` | Download file by token |
| GET | `/status/{token}` | Get file status (expiry, downloads remaining) |

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user'
);

-- Files table
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL,
  mime TEXT,
  unlimited INTEGER DEFAULT 0,
  max_downloads INTEGER,
  downloads INTEGER DEFAULT 0,
  expires_at INTEGER
);
```

### Development Commands

```bash
cd file-gateway

# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to Cloudflare
npm run deploy

# Run tests
npm run test
```

### Configuration

Edit `wrangler.jsonc` to configure your Cloudflare resources:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "r2-fileshare",
  "main": "src/index.js",
  "compatibility_date": "2025-09-23",
  "observability": {
    "enabled": true
  },
  "vars": {
    "CORS_ORIGIN": "http://localhost:5173",
    "MAX_FILE_SIZE": "104857600",
    "DEFAULT_EXPIRY_HOURS": "24",
    "MAX_DOWNLOADS_DEFAULT": "10"
  },
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",
      "bucket_name": "your-bucket-name",
      "preview_bucket_name": "your-bucket-name"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "TOKENS",
      "id": "your-kv-namespace-id",
      "preview_id": "your-kv-namespace-id"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "your-database-name",
      "database_id": "your-database-id"
    }
  ],
  "triggers": {
    "crons": [
      "0 * * * *"
    ]
  }
}
```

## 🎨 Frontend (r2-temporary-share)

### Technology Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Icons**: Heroicons Vue
- **Notifications**: Vue Toastification
- **Code Quality**: ESLint 9 + Prettier 3

### Features

- 🎨 **Modern UI/UX** - Beautiful, responsive interface with Tailwind CSS
- 🔐 **User Authentication** - Login/register with JWT tokens
- 📁 **File Upload** - Drag & drop interface with multiple file support
- 📊 **File Management** - View uploaded files, download counts, and expiration
- 🔗 **Link Sharing** - Copy download links with one click
- ⚡ **Performance Optimized** - Code splitting, lazy loading, and preloading
- 🌙 **Responsive Design** - Works on desktop and mobile devices
- 🛡️ **Anti-IDM Technology** - Multi-layer bypass for download manager interference
- 🌊 **Streaming Downloads** - Real-time progress with resume capability
- 🎭 **Executable Protection** - Smart masking for .exe, .msi, and other executables

### Key Components

- `FileUpload.vue` - Drag & drop file upload interface
- `FilesList.vue` - File management dashboard with status indicators
- `Dashboard.vue` - Main application interface
- `Download.vue` - File download page with status checking

### Performance Optimizations

- **Code Splitting**: Vendor libraries separated from app code
- **Lazy Loading**: Route components loaded on demand
- **Component Preloading**: Critical components preloaded for faster navigation
- **Bundle Analysis**: Optimized chunk sizes for better loading
- **Development Monitoring**: Performance tracking during development

### Development Commands

```bash
cd r2-temporary-share

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

### CORS Configuration

The frontend handles CORS using Vite's proxy feature:

- **Development**: API calls proxied through `/api` to avoid CORS issues
- **Production**: Direct calls to the Cloudflare Workers API
- **Configuration**: See `vite.config.js` for proxy setup

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Cloudflare account with Workers, R2, and D1 enabled
- Wrangler CLI installed (`npm install -g wrangler`)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd r2-fileshare
   ```

2. **Backend Setup**
   ```bash
   cd file-gateway
   npm install
   
   # Login to Cloudflare
   wrangler login
   
   # Create D1 database
   wrangler d1 create r2-fileshare-db
   
   # Create R2 bucket
   wrangler r2 bucket create mybucket
   
   # Create KV namespace
   wrangler kv namespace create "TOKENS"
   
   # Update wrangler.jsonc with your resources
   # Run database migrations
   wrangler d1 execute r2-fileshare-db --file=schema.sql
   
   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd r2-temporary-share
   npm install
   
   # Update API endpoint in src/services/api.js if needed
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8787

### Deployment

1. **Deploy Backend**
   ```bash
   cd file-gateway
   npm run deploy
   ```

2. **Deploy Frontend**
   ```bash
   cd r2-temporary-share
   npm run build
   # Deploy the dist/ folder to your preferred hosting service
   ```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt-style password hashing
- **File Access Control** - Users can only access their own files
- **Temporary Links** - Download links expire automatically
- **Download Limits** - Configurable limits to prevent abuse
- **CORS Protection** - Proper CORS headers for secure API access

## 🛡️ Anti-IDM Technology

This platform features advanced protection against Internet Download Manager (IDM) and similar download accelerators that can interfere with file downloads, especially executable files.

### Multi-Layer Defense System

#### 🎭 Layer 1: File Masking
- Executable files (`.exe`, `.msi`, `.dmg`, etc.) are automatically renamed with safe extensions (`.tmp`)
- Original filenames stored in metadata for restoration during download
- IDM ignores files with safe extensions during upload detection

#### 🕵️ Layer 2: Request Disguising  
- Different download strategies for executable vs. normal files
- Executable downloads use `fetch()` with anti-detection headers:
  - `Content-Type: application/json` instead of file download types
  - Browser-like `Accept` headers to mimic web browsing
  - `Sec-Fetch-Mode: no-cors` to avoid preflight requests

#### 🛡️ Layer 3: Server Response Masking
- Executable files served with `Content-Type: text/plain` (IDM ignores text)
- No `Content-Disposition: attachment` headers for executables
- Anti-cache headers prevent IDM analysis
- Custom `X-Is-Executable` header for client processing

#### 🎪 Layer 4: Client-Side Evasion
- Multiple fallback download techniques:
  - Hidden data URL method with random delays
  - Multiple retry attempts with exponential backoff  
  - New window fallback for stubborn cases
  - DOM manipulation to hide download links

#### 🧪 Layer 5: Detection Avoidance
- Random delays between attempts (50-200ms)
- FileReader conversion to data URLs for local processing
- Multiple download strategies tried in sequence
- Steganographic downloads (appears as web content)

### How It Works

```
Upload:    program.exe → program.tmp (stored safely)
Download:  /r/token → Server: Content-Type: text/plain
Response:  IDM sees text, ignores completely  
Client:    Receives blob → data URL → downloads as program.exe
```

### Supported File Types

**Protected Executables:**
- `.exe` - Windows executables
- `.msi` - Windows installers  
- `.dmg` - macOS disk images
- `.pkg` - macOS packages
- `.deb` - Debian packages
- `.rpm` - Red Hat packages
- `.app` - macOS applications

**Normal Files** (standard download):
- Documents, images, videos, archives, etc.

## 🌊 Streaming Downloads

## 🌊 Streaming Downloads

The platform provides advanced streaming download capabilities with real-time progress tracking and resume support.

### Features

- **Real-time Progress** - Live updates of download progress with percentage and speed
- **Large File Support** - Efficiently handles files of any size through streaming
- **Resume Capability** - Supports HTTP range requests for download resumption  
- **Memory Efficient** - Streams data directly without loading entire file in memory
- **Cross-browser Support** - Works with modern browsers using standard APIs

### Technical Implementation

- **XMLHttpRequest** for normal files with progress events
- **Fetch API** with ReadableStream for executable files
- **HTTP Range Requests** supported on server for resumable downloads
- **Blob URLs** for final download trigger
- **Data URLs** for anti-IDM executable downloads

### Progress Tracking

```javascript
onProgress: {
  loaded: 1024000,     // Bytes downloaded
  total: 5120000,      // Total file size  
  progress: 20         // Percentage (0-100)
}
```

## 📈 Monitoring & Cleanup

- **Scheduled Cleanup** - Automatic removal of expired files
- **Download Tracking** - Monitor file usage and download counts
- **File Status API** - Check file availability and expiration
- **Performance Monitoring** - Track component loading and API response times

## 🛠️ Development

### Project Highlights

- **Modern Stack** - Latest versions of Vue 3, Vite 7, and Cloudflare Workers
- **TypeScript Ready** - Easy to migrate to TypeScript if needed
- **Performance Optimized** - Code splitting and lazy loading implemented
- **Developer Experience** - Hot reload, linting, and formatting configured
- **Production Ready** - Optimized builds and deployment configurations

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

For support and questions, please open an issue on the repository or contact the development team.
