# Capitol Conquest - Multiplayer Deployment Guide

## Quick Start for Local Development

1. **Start the backend server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the frontend:**
   ```bash
   # From the root directory
   python3 -m http.server 8080
   # OR using Node.js
   npx http-server -p 8080
   ```

3. **Test multiplayer:**
   - Open http://localhost:8080 in two browser tabs
   - Select "🌐 Multiplayer Online" in both tabs
   - Players will be automatically matched

## Production Deployment

### Option 1: Heroku (Recommended)

1. **Create a Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Deploy the server:**
   ```bash
   # From the server directory
   git subtree push --prefix server heroku main
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. **Update frontend configuration:**
   - Edit `src/NetworkManager.js`
   - Change server URL to: `https://your-app-name.herokuapp.com`

### Option 2: Railway

1. **Connect your GitHub repository** to Railway
2. **Deploy the server** from the `/server` directory
3. **Set environment variables:**
   - `NODE_ENV=production`
4. **Update frontend** with the Railway URL

### Option 3: DigitalOcean App Platform

1. **Create a new app** from your GitHub repository
2. **Configure build settings:**
   - Source Directory: `/server`
   - Build Command: `npm install`
   - Run Command: `npm start`
3. **Set environment variables:**
   - `NODE_ENV=production`

### Option 4: AWS EC2

1. **Launch an EC2 instance** (Ubuntu 20.04 LTS recommended)
2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup:**
   ```bash
   git clone your-repo-url
   cd capitol-conquest/server
   npm install
   ```

4. **Use PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "capitol-conquest"
   pm2 startup
   pm2 save
   ```

5. **Configure reverse proxy with Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Frontend Deployment

### GitHub Pages (Current Setup)
Your frontend is already deployed at: https://maksimluzik.github.io/capitol-conquest/

**To enable multiplayer:**
1. Deploy your server using one of the options above
2. Update `src/NetworkManager.js` with your server URL
3. Commit and push changes to GitHub

### Alternative Frontend Hosting

#### Netlify
1. **Connect your GitHub repository**
2. **Configure build settings:**
   - Build directory: `/` (root)
   - No build command needed (static files)
3. **Add custom domain** if desired

#### Vercel
1. **Import your GitHub repository**
2. **Configure project settings:**
   - Framework: Other
   - Build command: (leave empty)
   - Output directory: `/`

## Configuration Updates

### Update Server URL in Frontend

Edit `src/NetworkManager.js`:

```javascript
getServerUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    } else {
        // Replace with your production server URL
        return 'https://your-server-domain.com';
    }
}
```

### Update CORS Settings

Edit `server/server.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://maksimluzik.github.io', 'https://your-custom-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  credentials: true
}));
```

## Testing Multiplayer

### Local Testing
```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start frontend  
python3 -m http.server 8080

# Open two browser tabs to localhost:8080
# Select multiplayer in both tabs
```

### Production Testing
1. **Health check:** Visit `https://your-server-url/health`
2. **Frontend test:** Open your game URL in two different browsers/devices
3. **Connection test:** Check browser console for connection messages

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Verify server CORS settings match your frontend domain
   - Check both app and Socket.IO CORS configuration

2. **Connection Failed:**
   - Verify server is running and accessible
   - Check firewall settings (port 3001 or your custom port)
   - Ensure WebSocket support is enabled

3. **Players Not Matching:**
   - Check server logs for errors
   - Verify Socket.IO client is connecting successfully
   - Test with browser developer tools network tab

### Logs and Monitoring

**Server logs:**
```bash
# For PM2 deployments
pm2 logs capitol-conquest

# For Heroku
heroku logs --tail

# For direct Node.js
node server.js
```

**Frontend debugging:**
- Open browser developer tools
- Check Console tab for network errors
- Monitor Network tab for WebSocket connections

## Security Considerations

1. **Rate Limiting:** Already implemented (100 requests per 15 minutes)
2. **Input Validation:** Move validation happens server-side
3. **CORS Protection:** Configure for your specific domains
4. **Environment Variables:** Never commit sensitive data to git
5. **HTTPS:** Use HTTPS in production for secure WebSocket connections

## Performance Optimization

1. **CDN:** Use a CDN for static assets
2. **Gzip:** Enable compression on your server
3. **Caching:** Implement appropriate cache headers
4. **Connection Pooling:** Consider Redis for session storage in high-traffic scenarios
