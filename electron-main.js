// Electron main process — wraps the HTML game in a desktop window
// so it can be packaged into a standalone .exe (or .app / AppImage).
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#14161b',
    title: "JRZ's Shooter Game",
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null); // hide the default File/Edit/View menu bar
  win.loadFile(path.join(__dirname, 'index.html'));

  // Uncomment for debugging:
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
