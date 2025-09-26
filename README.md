# R2 File Share 📁✨

Hey there! 👋 

Ever needed to ### First-time setup tips 💡

- Make surThat's it! Your file-sharing app should now be running locally. Head to `http://localhost:5173` and start uploading some files to test it out.

### First-time setup tips 💡

- **Cloudflare account needed**: Make sure you have a Cloudflare account and the Wrangler CLI installed
- **Configuration files**: The `wrangler.jsonc.example` and `.env.example` files show you exactly what to fill in
- **Resource IDs**: When you create the D1, R2, and KV resources, Wrangler will give you IDs to paste into your config
- **Environment variables**: Don't forget to set up both the backend (`.dev.vars`) and frontend (`.env`) environment files
- **Detailed guide**: Check the `ENVIRONMENT.md` file if you need more detailed setup instructions or get stuck

### Common gotchas 🤔

- Make sure your worker URL in the frontend `.env` matches your actual deployed worker
- The D1 database needs to be created AND have the schema applied
- KV namespace IDs are different for preview and production - use the same ID for both initially
- If uploads fail, check that your R2 bucket name matches what's in `wrangler.jsonc`ave a Cloudflare account and Wrangler CLI set up
- You'll need to configure your `wrangler.jsonc` file with your own account details (there's a `wrangler.jsonc.example` to get you started)
- The database will be empty initially, so create an account to get started
- Check the `ENVIRONMENT.md` file for detailed setup instructions if you get stucky share a file with someone but didn't want to deal with the hassle of email attachments or sketchy file-sharing sites? Yeah, me too. That's why I built this little file-sharing app using Vue 3 and Cloudflare Workers.

It's pretty straightforward - just drag and drop your files, get a shareable link, and boom! Your files are available for download. The best part? Everything expires automatically, so you don't have to worry about your files floating around the internet forever.

## ✨ What it does (the cool stuff)

- **Drag & drop uploads** - No complicated forms, just drag your files and watch the magic happen
- **Smart download links** - Set expiration times and download limits because security matters
- **Resume downloads** - Internet died halfway through? No problem, just continue where you left off
- **Anti-bot protection** - Keeps those pesky download managers from hammering your files
- **User accounts** - Sign up once, keep track of all your shared files
- **Auto-cleanup** - Files expire and get deleted automatically, keeping things tidy

## 🛠️ Built with (the nerdy stuff)

I picked these tools because they're fast, reliable, and honestly just fun to work with:

- **Frontend**: Vue 3 + Vite + Tailwind CSS (because who doesn't love hot reload and utility classes?)
- **Backend**: Cloudflare Workers (serverless is the way to go)
- **Database**: Cloudflare D1 (SQLite in the cloud - surprisingly awesome)
- **File Storage**: Cloudflare R2 (like S3 but cheaper and faster)
- **Authentication**: JWT tokens with bcrypt hashing (keeping your passwords safe)

## 🚀 Getting started (let's do this!)

Alright, I won't lie - there are a few steps to get everything set up with Cloudflare, but I promise it's worth it! Just follow along and you'll have your own file-sharing platform running in no time:

### Step 1: Get the code
```bash
# First, grab the code
git clone <your-repo-url>
cd r2-fileshare
```

### Step 2: Set up Cloudflare resources
You'll need to create some resources in your Cloudflare dashboard first:

```bash
# Make sure you're logged into Wrangler
wrangler login

# Create a D1 database
wrangler d1 create your-database-name

# Create an R2 bucket
wrangler r2 bucket create your-bucket-name

# Create a KV namespace for tokens
wrangler kv:namespace create "TOKENS"
```

### Step 3: Configure the backend
```bash
cd worker-gateway
npm install

# Copy the config files
cp .env.example .dev.vars
cp wrangler.jsonc.example wrangler.jsonc
```

Now edit your `wrangler.jsonc` file with the IDs you got from step 2. Don't worry, there's an example file to guide you!

### Step 4: Set up the database
```bash
# Create the database tables (only run this once!)
wrangler d1 execute your-database-name --file=schema.sql
```

### Step 5: Deploy the backend
```bash
# Deploy to Cloudflare (this might take a minute)
npm run deploy
```

### Step 6: Set up the frontend
```bash
# Now for the frontend (the pretty part)
cd ../vue-file-share
npm install

# Copy the environment file and update it with your worker URL
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your deployed worker URL

# Fire it up and see it in action!
npm run dev
```

That's it! Your file-sharing app should now be running locally. Head to `http://localhost:5173` and start uploading some files to test it out.

### First-time setup tips �

- Make sure you have a Cloudflare account and Wrangler CLI set up
- You'll need to configure your `wrangler.jsonc` file with your own account details
- The database will be empty initially, so create an account to get started
- Check the `ENVIRONMENT.md` file for detailed setup instructions if you get stuck

## 🔐 Security stuff (because I care about your data)

I know security can be boring, but here's why you can trust this thing with your files:

- **Your passwords are safe** - They're hashed with bcrypt, so even I can't see them
- **Tokens expire** - No permanent access tokens floating around
- **Your files are yours** - You can only see and download files you uploaded
- **Auto-cleanup** - Expired files get deleted automatically, no manual cleanup needed
- **No tracking** - I don't collect any weird data about you or your files

## 🐛 Something broken? Need help?

Hey, stuff happens! If you run into issues:

1. Check the browser console for any error messages
2. Make sure your Cloudflare setup is correct
3. Verify that your environment variables are set properly
4. Try the classic "turn it off and on again" (seriously, it works)

Found a bug or have an idea for a cool feature? Open an issue or send a pull request! I'm always happy to make this thing better.

## 🎯 What's next?

I'm always tinkering with this project. Here are some things I'm thinking about adding:

- File preview for images and documents
- Bulk upload and download
- File compression options
- Custom branding options
- Mobile app (maybe?)

If any of these sound cool to you, or if you have other ideas, let me know!

## 📄 License

MIT License - basically, do whatever you want with this code. Use it, modify it, sell it, give it away - I don't care. Just don't blame me if something goes wrong! 😄

---

Made with ❤️ and way too much coffee. If this helped you out, consider giving it a star! ⭐
