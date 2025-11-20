const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 450,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Make window circular (handled in CSS with overflow hidden)
    mainWindow.setShape([
        { x: 0, y: 0, width: 450, height: 450 }
    ]);

    mainWindow.loadFile('index.html');

    // Enable dragging the window
    mainWindow.setMovable(true);

    // Open DevTools for debugging (remove in production)
    // mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers for file operations
ipcMain.handle('save-file', async (event, fileData) => {
    try {
        const { name, buffer } = fileData;

        // Show save dialog
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: name,
            buttonLabel: 'Save File'
        });

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        // Convert buffer back to Buffer and save
        const bufferData = Buffer.from(buffer);
        fs.writeFileSync(filePath, bufferData);

        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, error: error.message };
    }
});

// Get app path for downloads
ipcMain.handle('get-downloads-path', () => {
    return app.getPath('downloads');
});
