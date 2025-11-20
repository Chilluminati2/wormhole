const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Store active rooms: roomCode -> { peer1: ws, peer2: ws }
const rooms = new Map();

console.log(`🌀 Wormhole Signaling Server running on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('✓ New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('✗ Client disconnected');
        // Clean up rooms when a peer disconnects
        removeFromRooms(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleMessage(ws, data) {
    const { type, roomCode, payload } = data;

    switch (type) {
        case 'create-room':
            createRoom(ws, roomCode);
            break;

        case 'join-room':
            joinRoom(ws, roomCode);
            break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
            // Forward signaling messages to the other peer in the room
            forwardToPeer(ws, roomCode, { type, payload });
            break;

        default:
            console.log('Unknown message type:', type);
    }
}

function createRoom(ws, roomCode) {
    if (rooms.has(roomCode)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room already exists' }));
        return;
    }

    rooms.set(roomCode, { peer1: ws, peer2: null });
    ws.roomCode = roomCode;
    ws.send(JSON.stringify({ type: 'room-created', roomCode }));
    console.log(`📦 Room created: ${roomCode}`);
}

function joinRoom(ws, roomCode) {
    const room = rooms.get(roomCode);

    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
    }

    if (room.peer2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
        return;
    }

    room.peer2 = ws;
    ws.roomCode = roomCode;

    // Notify both peers that they're connected
    room.peer1.send(JSON.stringify({ type: 'peer-joined' }));
    ws.send(JSON.stringify({ type: 'room-joined', roomCode }));
    console.log(`🔗 Peer joined room: ${roomCode}`);
}

function forwardToPeer(ws, roomCode, message) {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Determine which peer is sending and forward to the other
    const targetPeer = room.peer1 === ws ? room.peer2 : room.peer1;

    if (targetPeer && targetPeer.readyState === WebSocket.OPEN) {
        targetPeer.send(JSON.stringify(message));
    }
}

function removeFromRooms(ws) {
    if (!ws.roomCode) return;

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    // Notify the other peer if there is one
    const otherPeer = room.peer1 === ws ? room.peer2 : room.peer1;
    if (otherPeer && otherPeer.readyState === WebSocket.OPEN) {
        otherPeer.send(JSON.stringify({ type: 'peer-disconnected' }));
    }

    // Remove the room
    rooms.delete(ws.roomCode);
    console.log(`🗑️  Room deleted: ${ws.roomCode}`);
}

// Health check endpoint for Render
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            activeRooms: rooms.size,
            uptime: process.uptime()
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Wormhole Signaling Server is running');
    }
});

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(PORT, () => {
    console.log(`📡 HTTP/WebSocket server listening on port ${PORT}`);
});
