const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = process.env.PORT || 6767;

function startServer() {
  // Spawn the existing server.js so Electron can open the web UI
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: 'inherit'
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const url = `http://localhost:${SERVER_PORT}`;
  mainWindow.loadURL(url);

  // Optional: comment out in production
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();

  // Wait briefly for server to start before loading
  setTimeout(() => {
    createWindow();
  }, 800);
});

app.on('window-all-closed', () => {
  // On macOS it's common for applications and their menu bar to stay active until the user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      // ignore
    }
  }
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
