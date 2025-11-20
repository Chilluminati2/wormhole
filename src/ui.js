// UI management and event handlers
class UI {
    constructor() {
        this.statusOverlay = document.getElementById('status-overlay');
        this.connectionControls = document.getElementById('connection-controls');
        this.roomCodeDisplay = document.getElementById('room-code-display');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create room button
        document.getElementById('create-room-btn').addEventListener('click', () => {
            window.webrtc.createRoom();
        });

        // Join room button
        document.getElementById('join-room-btn').addEventListener('click', () => {
            const roomCode = document.getElementById('room-code-input').value.trim();
            if (roomCode.length === 6) {
                window.webrtc.joinRoom(roomCode);
            } else {
                this.showError('Please enter a valid 6-character room code');
            }
        });

        // Enter key in room code input
        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('join-room-btn').click();
            }
        });

        // Drag and drop file handling
        const portalContainer = document.getElementById('portal-container');
        const dropZone = document.getElementById('drop-zone');

        portalContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.webrtc.dataChannel && window.webrtc.dataChannel.readyState === 'open') {
                dropZone.classList.remove('hidden');
                dropZone.classList.add('show');
            }
        });

        portalContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only hide if leaving the portal container
            if (e.target === portalContainer) {
                dropZone.classList.remove('show');
                setTimeout(() => dropZone.classList.add('hidden'), 300);
            }
        });

        portalContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            dropZone.classList.remove('show');

            if (window.webrtc.dataChannel && window.webrtc.dataChannel.readyState === 'open') {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];

                    // Show suck-in animation
                    window.portalEffects.fileSuckInAnimation(() => {
                        dropZone.classList.add('hidden');
                        // Send file
                        window.fileTransfer.sendFile(file);
                    });
                }
            } else {
                dropZone.classList.add('hidden');
                this.showError('Not connected to peer');
            }
        });

        // Settings button (placeholder)
        document.getElementById('settings-btn').addEventListener('click', () => {
            // Future: Show settings panel
            console.log('Settings clicked');
        });

        // Close button
        document.getElementById('close-btn').addEventListener('click', () => {
            if (confirm('Close Wormhole?')) {
                window.close();
            }
        });
    }

    updateStatus(text, icon = '🌀') {
        document.getElementById('status-text').textContent = text;
        document.getElementById('status-icon').textContent = icon;
    }

    showRoomCode(code) {
        this.connectionControls.style.display = 'none';
        this.roomCodeDisplay.style.display = 'block';
        document.getElementById('room-code').textContent = code;
    }

    hideConnectionControls() {
        this.statusOverlay.classList.remove('show');
        setTimeout(() => {
            this.connectionControls.style.display = 'flex';
            this.roomCodeDisplay.style.display = 'none';
        }, 300);
    }

    showConnectionControls() {
        this.statusOverlay.classList.add('show');
        this.connectionControls.style.display = 'flex';
        this.roomCodeDisplay.style.display = 'none';
    }

    showTransferProgress(percent) {
        const progressEl = document.getElementById('transfer-progress');
        const progressText = document.getElementById('progress-text');
        const progressCircle = document.querySelector('.progress-ring-circle');

        progressEl.classList.remove('hidden');
        progressEl.classList.add('show');

        progressText.textContent = Math.round(percent) + '%';

        // Update circle (339.292 is the circumference of the circle)
        const circumference = 339.292;
        const offset = circumference - (percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    hideTransferProgress() {
        const progressEl = document.getElementById('transfer-progress');
        progressEl.classList.remove('show');
        setTimeout(() => progressEl.classList.add('hidden'), 300);
    }

    showError(message) {
        // Simple alert for now, could be improved with custom modal
        alert(message);
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();

    // Start portal effects in idle mode
    window.portalEffects.start();
    window.portalEffects.setGlowIntensity(0.6);
});
