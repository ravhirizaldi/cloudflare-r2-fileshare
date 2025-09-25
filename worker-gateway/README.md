# Worker Gateway - Backend API

The Cloudflare Workers backend for R2 File Share, providing secure file storage, Anti-IDM protection, and streaming downloads.

## � Quick Setup

```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create resources
wrangler d1 create r2-fileshare-db
wrangler r2 bucket create r2-fileshare-storage
wrangler kv namespace create "TOKENS"

# Initialize database
wrangler d1 execute r2-fileshare-db --file=schema.sql

# Configure wrangler.toml with your resource IDs

# Deploy
npm run deploy
```

## 🛠️ Development

```bash
npm run dev    # Start development server
npm test       # Run tests
npm run deploy # Deploy to production
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | Authentication |
| GET | `/me` | User profile |
| POST | `/upload` | File upload with masking |
| GET | `/myfiles` | List user files |
| GET | `/r/{token}` | Download with Anti-IDM |
| GET | `/status/{token}` | File status |

## ⚙️ Configuration

Edit `wrangler.toml`:

```toml
[vars]
CORS_ORIGIN = "https://your-domain.com"
MAX_FILE_SIZE = "104857600"
JWT_SECRET = "your-secret-key"
```

---

**📚 Full Documentation**: See [main README](../README.md) for complete features and setup guide.

