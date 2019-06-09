import * as path from "path";
import * as fs from "fs";
import { JsonRpcNotify } from "./rpc";


export class Watcher {
  watchPath: string;
  contents: Electron.WebContents;
  dataMap: {[key: string]: string} = {}

  constructor(watchPath: string, c: Electron.WebContents) {
    this.watchPath = watchPath;
    this.contents = c;
    fs.readdir(this.watchPath, (err, files) => this.onFiles(err, files));
    fs.watch(this.watchPath, { recursive: true }, (event, filename) => this.onWatch(event, filename));
  }

  onWatch(event: string, filename: string) {
    this.sendFile(path.join(this.watchPath, filename));
  }

  onFiles(err: NodeJS.ErrnoException | null, files: string[]) {
    if (err) {
      console.error(err);
      return;
    }

    for (const filename of files) {
      this.sendFile(path.join(this.watchPath, filename));
    }
  }

  sendFile(filename: string) {
    console.info(`readFile: ${filename}`);
    fs.readFile(filename, { encoding: 'utf-8' }, (err, data) => this.onRead(err, path.basename(filename), data));
  }

  onRead(err: NodeJS.ErrnoException | null, filename: string, data: string) {
    if (err) {
      console.error(err);
      return;
    }

    const last = this.dataMap[filename];
    if(last==data){
        console.info(`already send: ${filename}`)
        return;
    }
    this.dataMap[filename] = data;

    console.info(`onRead: ${filename}`)
    const notify = new JsonRpcNotify('shaderSource', [filename, data])
    this.contents.send('rpc', notify);
  }
};
