# 🎨 Collaborative Drawing Board

A real-time collaborative drawing application that allows multiple users to draw together on a shared canvas. Features live cursor tracking and CRDT-based synchronization using Yjs, similar to Figma's collaborative approach.

## ✨ Features

- **Real-time Collaboration**: Multiple users can draw simultaneously on the same canvas
- **Live Cursor Tracking**: See other users' cursors and their movements in real-time
- **CRDT Synchronization**: Conflict-free replicated data types (Yjs) ensure consistent state across all clients
- **Drawing Tools**:
  - Rectangle
  - Square
  - Circle
  - Select tool
- **Customization**: Change fill color, stroke color, and stroke width
- **User Presence**: See how many users are currently active
- **Auto-sync**: All changes are automatically synchronized across all connected clients

## 🛠️ Technology Stack

- **Frontend**:
  - HTML5 Canvas for drawing
  - Vanilla JavaScript
  - Yjs (CRDT library)
  - WebSockets for real-time communication

- **Backend**:
  - Node.js
  - Express.js
  - WebSocket (ws)
  - y-websocket for CRDT synchronization

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🚀 Installation & Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd colab-test
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:3000`
   - Open the same URL in multiple browser tabs or devices to test collaboration

## 🌐 Deployment Instructions

### Option 1: Deploy to Heroku

1. **Create a Heroku account** at https://heroku.com

2. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**:
   ```bash
   heroku login
   ```

4. **Create a new Heroku app**:
   ```bash
   heroku create your-app-name
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Open your app**:
   ```bash
   heroku open
   ```

Your app will be available at `https://your-app-name.herokuapp.com`

### Option 2: Deploy to Railway

1. **Create account** at https://railway.app

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

3. **Login**:
   ```bash
   railway login
   ```

4. **Initialize and deploy**:
   ```bash
   railway init
   railway up
   ```

5. **Add domain**:
   - Go to your Railway dashboard
   - Click on your project
   - Go to Settings > Domains
   - Generate a domain

### Option 3: Deploy to Render

1. **Create account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select "Node" environment
   - Build command: `npm install`
   - Start command: `npm start`

3. **Deploy**:
   - Render will automatically deploy your app
   - You'll get a URL like `https://your-app.onrender.com`

### Option 4: Deploy to DigitalOcean App Platform

1. **Create account** at https://digitalocean.com

2. **Create new app**:
   - Go to App Platform
   - Connect your GitHub repository
   - DigitalOcean will auto-detect Node.js

3. **Configure**:
   - Build command: `npm install`
   - Run command: `npm start`
   - Port: 3000

4. **Deploy**:
   - Click "Create Resources"
   - Wait for deployment

### Option 5: Deploy to your own VPS (Ubuntu/Debian)

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd colab-test
   npm install
   ```

4. **Install PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   ```

5. **Start the app**:
   ```bash
   pm2 start server.js --name drawing-board
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx** (optional, for domain and SSL):
   ```bash
   sudo apt-get install nginx
   ```

   Create Nginx config at `/etc/nginx/sites-available/drawing-board`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/drawing-board /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt** (optional):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📱 Usage

1. **Open the app** in your browser
2. **Select a drawing tool** from the toolbar (Rectangle, Square, or Circle)
3. **Click and drag** on the canvas to draw shapes
4. **Customize** colors and stroke width using the toolbar controls
5. **Share the URL** with friends - they'll see your drawings in real-time!
6. **Watch cursors** - you'll see other users' cursors moving on the canvas

## 🎯 How It Works

### CRDT (Conflict-free Replicated Data Types)

This project uses **Yjs**, a CRDT implementation, which ensures that:
- All users see the same state eventually
- No conflicts occur when multiple users draw simultaneously
- Changes are merged automatically without requiring a central authority
- The system works even with network delays or temporary disconnections

### Real-time Synchronization

1. **Canvas State**: Stored in a Yjs Array that's synchronized across all clients
2. **Cursor Positions**: Sent via WebSocket messages for real-time updates
3. **User Presence**: Tracked on the server and broadcast to all clients

## 🔧 Configuration

You can modify the following in `server.js`:
- **PORT**: Change the port number (default: 3000)
- **Colors**: Modify the random color palette

In `public/app.js`:
- **Canvas size**: Modify width/height in `index.html`
- **Default colors**: Change default fill and stroke colors

## 🐛 Troubleshooting

- **Port already in use**: Change the PORT in server.js or kill the process using port 3000
- **WebSocket connection fails**: Check your firewall settings
- **Shapes not syncing**: Ensure WebSocket connection is established (check browser console)

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Support

If you have questions or need help with deployment, please open an issue on GitHub.

---

**Enjoy collaborative drawing!** 🎨✨
