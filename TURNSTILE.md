# Cloudflare Turnstile Integration

This file-sharing application includes Cloudflare Turnstile integration for bot protection on login, registration, and download pages.

## Setup

### 1. Get Turnstile Site Key and Secret Key

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) 
2. Navigate to "Turnstile"
3. Create a new site
4. Copy your **Site Key** and **Secret Key**

### 2. Frontend Configuration

Add the site key to your `.env` file:

```bash
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key-here
```

### 3. Backend Configuration

Store the secret key in your KV namespace:

```bash
# Production secret key
wrangler kv:key put --namespace-id="your-kv-namespace-id" "TURNSTILE_SECRET_KEY" "your-turnstile-secret-key"

# Development secret key (for testing with dummy tokens)
wrangler kv:key put --namespace-id="your-kv-namespace-id" "TURNSTILE_SECRET_KEY_DEV" "1x0000000000000000000000000000000000000000"

# Or using the Cloudflare Dashboard:
# 1. Go to Workers & Pages > KV
# 2. Select your TOKENS namespace (this is the binding name in wrangler.jsonc)
# 3. Create keys: TURNSTILE_SECRET_KEY and TURNSTILE_SECRET_KEY_DEV
```

## Testing

### Official Cloudflare Test Keys

For testing purposes, you can use Cloudflare's test keys:

- **Site Key (always passes)**: `1x00000000000000000000FF`
- **Site Key (always fails)**: `2x00000000000000000000FF`
- **Site Key (forces interactive challenge)**: `3x00000000000000000000FF`

**Secret Key (for testing)**: `1x0000000000000000000000000000000000000000`

### Development Mode

The backend also supports development/dummy tokens like `XXXX.DUMMY.TOKEN.XXXX`. When such tokens are detected:

1. The system looks for `TURNSTILE_SECRET_KEY_DEV` in KV storage
2. If found, it validates the token using development logic (currently returns `true`)
3. If not found, falls back to regular validation

This allows developers to test the integration without needing real Turnstile widgets.

## How it Works

### Login & Registration
- Turnstile widget appears below the form fields
- Form submission is blocked until user completes the challenge
- Backend validates the token before processing authentication

### Downloads
- Turnstile widget appears before the download button
- Download button is disabled until verification is complete
- Token is passed to the download endpoint for validation

### Backend Validation
- All tokens are validated against Cloudflare's siteverify endpoint
- Invalid or missing tokens result in 403 Forbidden responses
- If Turnstile is not configured (no secret key in KV), validation is bypassed

## Customization

### Styling
The Turnstile widget uses these CSS classes:
- `.cf-turnstile` - The widget container
- Add custom CSS to match your theme

### Widget Options
Modify `useTurnstile.js` to customize:
- `theme`: 'light', 'dark', or 'auto'
- `size`: 'normal', 'compact'
- Language and other options

## Troubleshooting

### Widget Not Loading
1. Check if site key is correct
2. Verify domain is allowed in Turnstile settings
3. Check browser console for errors

### Validation Failing
1. Verify secret key is stored in KV correctly
2. Check backend logs for validation errors
3. Ensure tokens aren't being reused (they expire after use)

### KV Binding Issues
If you see errors like `Cannot read properties of undefined (reading 'get')`:
1. Verify your `wrangler.jsonc` has the correct KV namespace binding:
   ```jsonc
   "kv_namespaces": [
     {
       "binding": "TOKENS",
       "id": "your-actual-kv-namespace-id"
     }
   ]
   ```
2. Make sure you've deployed with `npm run deploy` after updating wrangler.jsonc
3. Check that your KV namespace exists in the Cloudflare dashboard
3. Ensure tokens aren't being reused (they expire after use)

### Performance
- Turnstile widgets are loaded asynchronously
- Failed verifications require page refresh
- Consider implementing retry logic for network issues

## Security Notes

- Never expose your secret key in frontend code
- Store the secret key securely in KV storage
- Turnstile tokens are single-use and time-limited
- Consider rate limiting for additional protection
