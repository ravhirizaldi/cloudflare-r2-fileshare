# R2 File Share 📁✨

Hey there! 👋 

Ever needed to ### First-time setup tips 💡

- Make sure you have a Cloudflare account and Wrangler CLI set up
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

Don't worry, it's easier than it looks. Just follow these steps and you'll have your own file-sharing platform running in no time:

```bash
# First, grab the code
git clone <your-repo-url>
cd r2-fileshare

# Set up the backend (this is where the magic happens)
cd worker-gateway
npm install

# Create the database (just run this once)
wrangler d1 execute r2-fileshare-db --file=schema.sql

# Deploy to Cloudflare (this might take a minute)
npm run deploy

# Now for the frontend (the pretty part)
cd ../vue-file-share
npm install

# Fire it up and see it in action!
npm run dev
```

That's it! Your file-sharing app should now be running locally. Head to `http://localhost:5173` and start uploading some files to test it out.

### First-time setup tips �

- Make sure you have a Cloudflare account and Wrangler CLI set up
- You'll need to configure your `wrangler.toml` file with your own account details
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
