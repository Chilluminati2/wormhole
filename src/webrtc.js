// WebRTC connection management
class WebRTCConnection {
    constructor() {
        this.pc = null;
        this.ws = null;
        this.localStream = null;
        this.dataChannel = null;
        this.roomCode = null;
        this.isInitiator = false;

        // STUN servers for NAT traversal
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.signalingServerUrl = 'ws://localhost:3000';
    }

    // Connect to signaling server
    connectToSignalingServer() {
        this.ws = new WebSocket(this.signalingServerUrl);

        this.ws.addEventListener('open', () => {
            console.log('Connected to signaling server');
            window.ui.updateStatus('Connected to server', '🔗');
        });

        this.ws.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            await this.handleSignalingMessage(data);
        });

        this.ws.addEventListener('close', () => {
            console.log('Disconnected from signaling server');
            window.ui.updateStatus('Disconnected', '❌');
            this.cleanup();
        });

        this.ws.addEventListener('error', (error) => {
            console.error('Signaling server error:', error);
            window.ui.showError('Failed to connect to signaling server. Make sure server is running.');
        });
    }

    // Create a new room
    async createRoom() {
        this.roomCode = this.generateRoomCode();
        this.isInitiator = true;

        this.connectToSignalingServer();

        // Wait for connection then create room
        await this.waitForConnection();
        this.sendSignaling({ type: 'create-room', roomCode: this.roomCode });
    }

    // Join existing room
    async joinRoom(roomCode) {
        this.roomCode = roomCode.toUpperCase();
        this.isInitiator = false;

        this.connectToSignalingServer();

        // Wait for connection then join room
        await this.waitForConnection();
        this.sendSignaling({ type: 'join-room', roomCode: this.roomCode });
    }

    async waitForConnection() {
        return new Promise((resolve) => {
            if (this.ws.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                this.ws.addEventListener('open', resolve, { once: true });
            }
        });
    }

    // Handle signaling messages
    async handleSignalingMessage(data) {
        console.log('Signaling message:', data.type);

        switch (data.type) {
            case 'room-created':
                window.ui.showRoomCode(this.roomCode);
                window.ui.updateStatus('Waiting for peer...', '⏳');
                break;

            case 'room-joined':
                window.ui.updateStatus('Room joined, connecting...', '⏳');
                this.startCall();
                break;

            case 'peer-joined':
                window.ui.updateStatus('Peer joined, connecting...', '⏳');
                this.startCall();
                break;

            case 'offer':
                await this.handleOffer(data.payload);
                break;

            case 'answer':
                await this.handleAnswer(data.payload);
                break;

            case 'ice-candidate':
                await this.handleIceCandidate(data.payload);
                break;

            case 'peer-disconnected':
                window.ui.updateStatus('Peer disconnected', '❌');
                this.cleanup();
                break;

            case 'error':
                window.ui.showError(data.message);
                break;
        }
    }

    // Start WebRTC call
    async startCall() {
        // Create peer connection
        this.pc = new RTCPeerConnection(this.config);

        // Set up ICE candidate handling
        this.pc.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                this.sendSignaling({
                    type: 'ice-candidate',
                    roomCode: this.roomCode,
                    payload: event.candidate
                });
            }
        });

        // Handle connection state changes
        this.pc.addEventListener('connectionstatechange', () => {
            console.log('Connection state:', this.pc.connectionState);

            if (this.pc.connectionState === 'connected') {
                window.ui.updateStatus('Connected', '✅');
                window.ui.hideConnectionControls();
                window.portalEffects.start();
                window.portalEffects.setGlowIntensity(1);
            } else if (this.pc.connectionState === 'disconnected' ||
                this.pc.connectionState === 'failed') {
                window.ui.updateStatus('Connection lost', '❌');
                this.cleanup();
            }
        });

        // Handle incoming tracks (peer video)
        this.pc.addEventListener('track', (event) => {
            console.log('Received remote track');
            const peerVideo = document.getElementById('peer-video');
            peerVideo.srcObject = event.streams[0];
        });

        // Get local video stream
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false // Can be enabled later
            });

            // Add local stream to peer connection
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });

            // Show local preview (optional)
            document.getElementById('local-video').srcObject = this.localStream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            window.ui.showError('Failed to access camera. Please grant permission.');
        }

        // Create data channel for file transfer
        if (this.isInitiator) {
            this.dataChannel = this.pc.createDataChannel('fileTransfer');
            this.setupDataChannel();
        } else {
            this.pc.addEventListener('datachannel', (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            });
        }

        // Create and send offer (initiator only)
        if (this.isInitiator) {
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this.sendSignaling({
                type: 'offer',
                roomCode: this.roomCode,
                payload: offer
            });
        }
    }

    setupDataChannel() {
        this.dataChannel.addEventListener('open', () => {
            console.log('Data channel opened');
            window.fileTransfer.setDataChannel(this.dataChannel);
        });

        this.dataChannel.addEventListener('close', () => {
            console.log('Data channel closed');
        });
    }

    async handleOffer(offer) {
        if (!this.pc) {
            await this.startCall();
        }

        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.sendSignaling({
            type: 'answer',
            roomCode: this.roomCode,
            payload: answer
        });
    }

    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async handleIceCandidate(candidate) {
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    sendSignaling(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    cleanup() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        window.portalEffects.stop();
        window.portalEffects.setGlowIntensity(0.6);
    }

    disconnect() {
        this.cleanup();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.roomCode = null;
        this.isInitiator = false;
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}

window.webrtc = new WebRTCConnection();
