# R2 Temporary File Share

A modern Vue 3 file sharing application with temporary download links, built with Vite and Tailwind CSS v4.

## Features

- 🔐 **User Authentication** - JWT-based username/password system
- 📁 **File Upload** - Drag & drop interface with multiple file support
- 🔗 **Temporary Links** - Secure download links with expiration dates
- 📊 **File Management** - Track downloads, file status, and expiration
- 🎨 **Modern UI** - Beautiful, responsive interface with Tailwind CSS
- ⚡ **Fast Development** - Vite 7 for lightning-fast builds
- 🛡️ **Anti-IDM Protection** - Advanced bypass for download manager interference
- 🌊 **Streaming Downloads** - Real-time progress with resume capability
- 🎭 **Smart File Masking** - Automatic protection for executable files

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Code Quality**: ESLint 9 + Prettier 3

## Backend API

The app connects to: `https://file-gateway.it-dev-635.workers.dev`

### API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Authenticate user (returns JWT)
- `GET /me` - Fetch user profile
- `POST /upload` - Upload files (multipart/form-data)
- `GET /myfiles` - List user's files
- `GET /r/{token}` - Download files by token
- `GET /status/{token}` - Get file status (validity, expiry, download count)

## Development

```bash
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

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── FileUpload.vue   # Drag & drop file upload
│   ├── FilesList.vue    # File management interface
│   └── Toast.vue        # Toast notifications
├── views/               # Page components
│   ├── Home.vue         # Landing page
│   ├── Login.vue        # Login form
│   ├── Register.vue     # Registration form
│   ├── Dashboard.vue    # Main app interface
│   └── Download.vue     # File download page
├── stores/              # Pinia stores
│   ├── auth.js          # Authentication state
│   └── files.js         # File management state
├── services/            # API services
│   └── api.js           # Axios configuration & API calls
├── composables/         # Vue composables
│   └── useToast.js      # Toast notifications
├── router/              # Vue Router configuration
│   └── index.js         # Routes & navigation guards
└── main.js              # App entry point
```

## Key Features Implementation

### Authentication

- JWT token stored in localStorage
- Route guards for protected pages
- Automatic token refresh handling
- Username-based login system

### File Upload

- Drag & drop interface
- Multiple file selection
- Progress feedback
- Error handling
- **Automatic executable masking** - `.exe`, `.msi` files disguised as `.tmp`
- **Smart file detection** - Identifies files that need protection

### File Management

- Paginated file listing
- Download link generation
- File status tracking
- Copy-to-clipboard functionality
- **Real-time download progress** - Live updates during downloads
- **Anti-IDM download system** - Bypass download manager interference

### Streaming Downloads

- **Progress Tracking** - Real-time download progress with percentage
- **Large File Support** - Efficient streaming for any file size
- **Resume Capability** - HTTP range request support
- **Cross-browser Compatibility** - Works with all modern browsers
- **Smart Fallbacks** - Multiple download strategies for reliability

### UI/UX

- Responsive design
- Toast notifications
- Loading states
- Error boundaries
- Modern Tailwind CSS styling

## CORS Handling

The application uses Vite's proxy feature to handle CORS issues during development:

- **Development**: API calls are proxied through `/api` to avoid CORS
- **Production**: Direct calls to the backend API
- **Configuration**: See `vite.config.js` for proxy setup

## 🛡️ Anti-IDM Technology

This application features cutting-edge protection against Internet Download Manager (IDM) and similar download accelerators that can interfere with file downloads.

### How It Works

1. **Upload Protection**: Executable files are automatically renamed with safe extensions
2. **Download Disguise**: Protected files are requested using anti-detection techniques  
3. **Response Masking**: Server responds with `text/plain` content type for executables
4. **Client Processing**: Files are converted to data URLs for safe download
5. **Fallback Systems**: Multiple strategies ensure successful downloads

### Implementation Details

**File Upload (`api.js`):**
```javascript
// Automatic masking for executable files
_maskExecutableFile: (file) => {
  if (isExecutable(file.name)) {
    return new File([file], file.name.replace(/\.[^.]+$/, '.tmp'))
  }
}
```

**Download System:**
```javascript
// Different strategies for executable vs normal files
downloadWithProgress: (token, onProgress) => {
  // Check file type and use appropriate download method
  // Executable files use fetch() with anti-detection headers
  // Normal files use XMLHttpRequest for progress tracking
}
```

### Supported File Types

**Protected**: `.exe`, `.msi`, `.dmg`, `.pkg`, `.deb`, `.rpm`, `.app`  
**Standard**: All other file types (documents, images, videos, etc.)

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Ensure the development server is running (`npm run dev`)
2. API calls should use `/api` prefix in development
3. Check `vite.config.js` proxy configuration
4. For production, ensure backend has proper CORS headers
