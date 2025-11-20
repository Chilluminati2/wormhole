# Wormhole Signaling Server Deployment Guide

## Deploying to Render

Follow these steps to deploy your Wormhole signaling server to Render:

### Step 1: Prepare Your Files

You need to upload these files to Render:
1. `server.js` - The signaling server code
2. `server-package.json` - Rename this to `package.json` when uploading

### Step 2: Create a Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up for a free account (you can use GitHub, GitLab, or email)

### Step 3: Deploy the Server

#### Option A: Deploy from GitHub (Recommended)

1. **Create a GitHub repository** for just the server:
   - Create a new repo called `wormhole-server`
   - Upload `server.js` and rename `server-package.json` to `package.json`
   - Commit and push

2. **On Render Dashboard:**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `wormhole-server` repository
   - Configure:
     - **Name**: `wormhole-signaling`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free
   - Click "Create Web Service"

#### Option B: Deploy Manually (Simpler but less automated)

1. **On Render Dashboard:**
   - Click "New +" → "Web Service"
   - Choose "Build and deploy from a Git repository" or use manual deploy
   
2. **If you don't want to use Git:**
   - Use Render's Blueprint feature or
   - Use their CLI tool to deploy

### Step 4: Get Your Server URL

Once deployed, Render will give you a URL like:
```
https://wormhole-signaling.onrender.com
```

**Important**: 
- Copy this URL
- Replace `https://` with `wss://` (WebSocket Secure)
- Your WebSocket URL will be: `wss://wormhole-signaling.onrender.com`

### Step 5: Update the Electron App

You'll need to update the `src/webrtc.js` file in your Electron app:

**Change this line (around line 18):**
```javascript
this.signalingServerUrl = 'ws://localhost:3000';
```

**To:**
```javascript
this.signalingServerUrl = 'wss://wormhole-signaling.onrender.com';
```
(Replace with your actual Render URL)

### Step 6: Rebuild and Test

1. Stop your local signaling server
2. Restart the Electron app
3. It should now connect to your Render server
4. Share the new app with your friend!

---

## Alternative: Quick Deploy Files

If you want to deploy quickly, here's a minimal setup:

### Create these files in a new folder:

**package.json:**
```json
{
  "name": "wormhole-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0"
  }
}
```

**server.js:** (copy from your existing server.js)

Then push to GitHub and deploy!

---

## Troubleshooting

**Server not starting?**
- Check Render logs for errors
- Make sure `PORT` environment variable is being used

**Can't connect from app?**
- Verify you're using `wss://` (not `ws://`)
- Check that the server URL is correct
- Look for CORS issues in Render logs

**Free tier limitations:**
- Render free tier spins down after 15 minutes of inactivity
- First connection after spin-down takes ~30 seconds
- Consider upgrading to paid tier ($7/mo) for always-on

---

## Next Steps

After deployment, you can:
1. Monitor your server at [render.com/dashboard](https://render.com/dashboard)
2. Check logs for active connections
3. See the health endpoint at: `https://your-url.onrender.com/health`
