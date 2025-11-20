// File transfer handling with chunking
class FileTransfer {
    constructor() {
        this.CHUNK_SIZE = 64 * 1024; // 64KB chunks
        this.sendingFiles = new Map();
        this.receivingFiles = new Map();
        this.dataChannel = null;
    }

    setDataChannel(channel) {
        this.dataChannel = channel;
        this.setupDataChannelHandlers();
    }

    setupDataChannelHandlers() {
        if (!this.dataChannel) return;

        this.dataChannel.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                // Binary data chunk
                this.handleChunk(event.data);
            }
        });
    }

    // Send a file
    async sendFile(file) {
        const fileId = this.generateFileId();
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

        // Store file info
        this.sendingFiles.set(fileId, {
            file,
            currentChunk: 0,
            totalChunks,
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Send file metadata
        this.sendMessage({
            type: 'file-start',
            fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            totalChunks
        });

        // Show progress
        window.ui.showTransferProgress(0);

        // Start sending chunks
        this.sendNextChunk(fileId);
    }

    async sendNextChunk(fileId) {
        const fileInfo = this.sendingFiles.get(fileId);
        if (!fileInfo) return;

        const { file, currentChunk, totalChunks } = fileInfo;

        if (currentChunk >= totalChunks) {
            // Transfer complete
            this.sendMessage({ type: 'file-end', fileId });
            this.sendingFiles.delete(fileId);
            window.ui.hideTransferProgress();
            return;
        }

        // Read chunk
        const start = currentChunk * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Convert to array buffer
        const arrayBuffer = await chunk.arrayBuffer();

        // Send chunk header first
        this.sendMessage({
            type: 'file-chunk',
            fileId,
            chunkIndex: currentChunk,
            size: arrayBuffer.byteLength
        });

        // Then send the actual chunk data
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(arrayBuffer);
        }

        // Update progress
        const progress = ((currentChunk + 1) / totalChunks) * 100;
        window.ui.showTransferProgress(progress);

        // Move to next chunk
        fileInfo.currentChunk++;

        // Send next chunk with small delay to avoid overwhelming the channel
        setTimeout(() => this.sendNextChunk(fileId), 10);
    }

    handleMessage(data) {
        switch (data.type) {
            case 'file-start':
                this.handleFileStart(data);
                break;
            case 'file-chunk':
                this.handleChunkMetadata(data);
                break;
            case 'file-end':
                this.handleFileEnd(data);
                break;
        }
    }

    handleFileStart(data) {
        const { fileId, name, size, mimeType, totalChunks } = data;

        this.receivingFiles.set(fileId, {
            name,
            size,
            mimeType,
            totalChunks,
            chunks: [],
            receivedChunks: 0,
            expectingChunk: true,
            nextChunkIndex: 0
        });

        console.log(`Receiving file: ${name} (${this.formatBytes(size)})`);
        window.ui.showTransferProgress(0);
    }

    handleChunkMetadata(data) {
        const fileInfo = this.receivingFiles.get(data.fileId);
        if (!fileInfo) return;

        // Mark that we're expecting binary data for this chunk
        fileInfo.expectingChunk = true;
        fileInfo.nextChunkIndex = data.chunkIndex;
        fileInfo.nextChunkSize = data.size;
    }

    handleChunk(arrayBuffer) {
        // Find which file is expecting this chunk
        for (const [fileId, fileInfo] of this.receivingFiles.entries()) {
            if (fileInfo.expectingChunk) {
                fileInfo.chunks[fileInfo.nextChunkIndex] = arrayBuffer;
                fileInfo.receivedChunks++;
                fileInfo.expectingChunk = false;

                // Update progress
                const progress = (fileInfo.receivedChunks / fileInfo.totalChunks) * 100;
                window.ui.showTransferProgress(progress);

                break;
            }
        }
    }

    async handleFileEnd(data) {
        const fileInfo = this.receivingFiles.get(data.fileId);
        if (!fileInfo) return;

        // Combine all chunks
        const blob = new Blob(fileInfo.chunks, { type: fileInfo.mimeType });

        // Save file
        await this.saveFile(blob, fileInfo.name);

        // Cleanup
        this.receivingFiles.delete(data.fileId);
        window.ui.hideTransferProgress();

        // Show file received animation
        window.portalEffects.fileEmergeAnimation();
        document.getElementById('file-name').textContent = fileInfo.name;
    }

    async saveFile(blob, fileName) {
        const { ipcRenderer } = require('electron');

        // Convert blob to buffer
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Array.from(new Uint8Array(arrayBuffer));

        // Use Electron's save dialog
        const result = await ipcRenderer.invoke('save-file', {
            name: fileName,
            buffer
        });

        if (result.success) {
            console.log('File saved to:', result.path);
        }
    }

    sendMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    generateFileId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

window.fileTransfer = new FileTransfer();
