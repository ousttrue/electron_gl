import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import fetch from 'node-fetch';
import { RPC } from "./rpc";
import * as interfaces from "./interfaces";
import * as glb from "./glb";
import * as fs from "fs";
import { generateKeyPairSync } from "crypto";
import { Gltf } from "./gltf";
import { isBuffer } from "util";

let mainWindow: BrowserWindow | null;

const rpc = new RPC();
ipcMain.on('rpc', async (e: Electron.Event, value: any) => {
  const response = await rpc.dispatchAsync(value);
  if (response) {
    e.sender.send('rpc', response);
  }
});

async function getAsync(pathOrUri: string): Promise<Buffer> {
  if (pathOrUri.startsWith('http:') || pathOrUri.startsWith('https:')) {
    // from net work
    const response = await fetch(pathOrUri);
    const body = await response.buffer();
    return body;
  }
  else {
    // from file system
    const promise = new Promise<Buffer>((resolve, reject) => {
      fs.readFile(pathOrUri, null, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    });
    const body = await promise;
    return body;
  }
}

rpc.methodMap['getModel'] = async function (pathOrUri?: string): Promise<interfaces.LoadData> {
  if (!pathOrUri) {
    // default
    pathOrUri = 'https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Box/glTF-Binary/Box.glb';
  }
  const body = await getAsync(pathOrUri);

  try {   
    const [gltf_bin, bin] = glb.parseGlb(new DataView(body.buffer, body.byteOffset, body.byteLength));
    return {
      url: pathOrUri,
      json: new TextDecoder('utf-8').decode(gltf_bin),
      bin: bin,
    };
  }
  catch(ex){
    const gltf_utf8 = new TextDecoder('utf-8').decode(body);
    const parsed = <Gltf>JSON.parse(gltf_utf8);

    // get buffers[0]
    const buffer = parsed.buffers[0];
    if (!buffer.uri) {
      throw new Error('no uri');
    }
    const bin_path = path.join(path.dirname(pathOrUri), buffer.uri);
    const bin = await getAsync(bin_path);

    return {
      url: pathOrUri,
      json: gltf_utf8,
      bin: bin
    };
  }
}

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: { nodeIntegration: true }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
