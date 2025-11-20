# Wormhole 🌀

A P2P desktop portal for video streaming and file transfer. Make file sharing feel physical and sci-fi!

## What is Wormhole?

Wormhole creates a circular "portal" window on your desktop that connects directly to a friend's portal via peer-to-peer technology. See each other through your webcams and transfer files by literally dragging them into the portal - they'll emerge on your friend's screen!

## Features

- 🎥 **Live Video Feed**: See your friend through the circular portal using your webcam
- 📁 **Physical File Transfer**: Drag and drop files directly into the portal
- 🔒 **P2P Connection**: Direct peer-to-peer connection (no server storage)
- 🌈 **Sci-Fi Aesthetic**: Beautiful circular portal with glowing effects and animations
- 🚀 **Fast Transfer**: Files transfer directly between peers using WebRTC
- 💫 **Visual Effects**: File "suck-in" and "emerge" animations for immersive experience

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Running the Signaling Server

The signaling server helps establish P2P connections. You need to run it first:

```bash
npm run server
```

Leave this running in a terminal window. You should see:
```
🌀 Wormhole Signaling Server running on ws://localhost:3000
```

### Running the Application

In a **new terminal window**, start the Electron app:

```bash
npm start
```

### Connecting with a Friend

**Option 1: Create a Portal**
1. Click "Create Portal"
2. You'll get a 6-character code (e.g., "ABC123")
3. Share this code with your friend
4. Wait for them to join

**Option 2: Join a Portal**
1. Get the room code from your friend
2. Enter the code in the input field
3. Click "Join Portal"
4. You'll connect automatically!

### Sending Files

Once connected:
1. Simply drag any file from your file explorer
2. Drop it into the circular portal window
3. Watch the file get "sucked into" the portal
4. Your friend will see it "emerge" on their side
5. The file will be saved to their chosen location

## Technical Details

### Architecture

- **Electron**: Desktop application framework
- **WebRTC**: Peer-to-peer video and data transfer
- **WebSocket**: Signaling server for connection establishment
- **HTML5 Canvas**: Visual effects and animations

### How It Works

1. **Signaling**: The WebSocket server helps peers find each other using room codes
2. **Connection**: WebRTC establishes a direct P2P connection between peers
3. **Video**: Webcam streams are sent directly peer-to-peer
4. **Files**: Files are chunked (64KB chunks) and sent through WebRTC data channels
5. **Visual Magic**: Canvas effects and CSS animations create the sci-fi portal aesthetic

### File Transfer Limits

- **Recommended**: Files under 1GB work best
- **Performance**: Transfer speed depends on your internet connection
- **Reliability**: Files are chunked for reliable transfer even on slower connections

## Development

### Run Both Server and App

For convenience, you can run both the signaling server and the app with:

```bash
npm run dev
```

### Project Structure

```
wormhole/
├── main.js              # Electron main process
├── index.html           # Main app UI
├── styles.css           # Portal styling
├── server.js            # WebSocket signaling server
├── src/
│   ├── effects.js       # Visual effects (particles, animations)
│   ├── fileTransfer.js  # File chunking and transfer logic
│   ├── webrtc.js        # WebRTC connection management
│   └── ui.js            # UI event handlers
└── package.json
```

## Future Enhancements

- 🔊 Audio support for voice chat
- 🎨 Customizable portal themes
- 📊 Transfer speed indicators
- 🔐 End-to-end encryption for files
- 🌍 Public STUN/TURN server configuration
- 📱 Mobile companion app
- 👥 Multi-user portals (more than 2 people)
- 💬 Text chat overlay

## Troubleshooting

**"Failed to connect to signaling server"**
- Make sure the signaling server is running (`npm run server`)
- Check that port 3000 is not in use by another application

**"Failed to access camera"**
- Grant camera permissions when prompted
- Check your browser/OS privacy settings
- Ensure your webcam is not in use by another application

**"Connection failed"**
- Check your firewall settings
- Some restrictive networks may block WebRTC connections
- Try a different network or configure TURN servers

**File transfer is slow**
- Speed depends on both peers' internet connections
- Large files (>100MB) may take time
- Consider compressing files before transfer

## License

MIT

---

Built with ❤️ using Electron and WebRTC
