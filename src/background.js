"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";
require("@electron/remote/main").initialize();
const Store = require("electron-store");

Store.initRenderer();

// Auto Update

const { autoUpdater } = require("electron-updater")

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

let win = null;

function createWindow(devPath, prodPath) {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + devPath);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL(`app://./${prodPath}`);
  }

  win.on("closed", () => {
    win = null;
  });

  return win;
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  win = createWindow("", "index.html");

  autoUpdater.checkForUpdatesAndNotify()
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

const { Server } = require("socket.io");

const io = new Server(5050, {
  allowEIO3: true,
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("socket Conectado", socket.id);

  socket.on("nuevo-totem", (data) => {
    socket.totem = data;
    win.webContents.send("nuevo-totem", socket.totem);
  });

  socket.on("disconnect", () => {
    console.log(`Socket Desconectado ${socket.id}`);
    win.webContents.send("remove-totem", { socket_id: socket.id });
  });

  socket.on("callServer", (data) => {
    win.webContents.send("calling", data);
  });
});

ipcMain.handle("get-sockets", async () => {
  let sockets = await io.fetchSockets();
  console.log(sockets.totem);

  return sockets.map((s) => {
    if (s.totem) {
      return s.totem;
    } else {
      return {};
    }
  });
});

ipcMain.on("disconnect-totem", (event, data) => {
  io.to(data.socket_id).emit("stop_streaming");
});

ipcMain.on("reload-totem",(event,data)=>{
  io.to(data.socket_id).emit("reloadTotem")
})

const dispatch = (data) => {
  win.webContents.send('win-message', data)
}

autoUpdater.on('checking-for-update', () => {
  dispatch({msg:'Checking for update...',status:0})
})

autoUpdater.on('update-available', (info) => {
  dispatch({msg:'Update available.',status:1})
})

autoUpdater.on('update-not-available', (info) => {
  dispatch('Update not available.')
})

autoUpdater.on('error', (err) => {
  dispatch('Error in auto-updater. ' + err)
})

autoUpdater.on('download-progress', (progressObj) => {
    win.webContents.send('download-progress', progressObj.percent)
})

autoUpdater.on('update-downloaded', (info) => {
  dispatch({msg:'Update downloaded',state:2})
})