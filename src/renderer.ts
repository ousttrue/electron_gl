import { ipcRenderer, remote } from 'electron'
import { Scene } from './renderer/scene'
import { Texture } from './renderer/texture'
import { RPC } from './rpc';
import * as interfaces from "./interfaces";
import { Shader } from './renderer/shader';
import { Gltf, GltfTexture } from './gltf';
import { ResourceManager } from './renderer/material';


class GltfResource {
  textures: Texture[] = [];
  uriMap: { [uri: string]: Texture } = {}

  console() {

  }

  release(gl: WebGL2RenderingContext) {
    for (const texture of this.textures) {
      texture.release(gl);
    }
  }

  async getTexture(gl: WebGL2RenderingContext, uri: string) {

  }
}


class Renderer {
  gl: WebGL2RenderingContext;
  scene: Scene;
  last = 0;
  rpc = new RPC();
  mouseX = 0;
  mouseY = 0;

  whiteTexture: Texture;

  shaderMap: { [key: string]: Shader } = {
  }
  gltfList: Gltf[] = [];
  resourceMap: { [key: number]: GltfResource } = {
  }

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.whiteTexture = new Texture(gl, new Uint8Array([255, 255, 255, 255]));
    this.scene = new Scene(gl);

    this.rpc.methodMap['shaderSource'] = async (name: string, source: string) => {
      console.log('shaderSource');

      const key = name.substring(0, name.length - 3);
      const shaderType = name.substring(name.length - 2);

      let shader = this.getShader(key);
      shader.setSource(this.gl, shaderType, source);
    }

    gl.canvas.addEventListener('pointerdown', e => this.onMouseDown(gl.canvas, e));
    gl.canvas.addEventListener('pointerup', e => this.onMouseUp(gl.canvas, e));
    gl.canvas.addEventListener('pointermove', e => this.onMouseMove(gl.canvas, e));
    gl.canvas.addEventListener('wheel', e => this.onMouseWheel(gl.canvas, e));

    ipcRenderer.on('rpc', async (e: Electron.Event, value: any) => {
      const response = await this.rpc.dispatchAsync(value);
      if (response) {
        e.sender.send('rpc', response);
      }
    });
    this.startAsync();
  }

  getShader(name: string): Shader {
    let source = this.shaderMap[name];
    if (!source) {
      source = new Shader(this.gl, name);
      this.shaderMap[name] = source;
    }
    return source;
  }

  getIndex(gltf: Gltf) {
    for (let i = 0; i < this.gltfList.length; ++i) {
      if (this.gltfList[i] == gltf) {
        return i;
      }
    }
    throw new Error('gltf not found');
  }

  addTexture(gltf: Gltf, texture: Texture) {
    const index = this.getIndex(gltf);
    let resource = this.resourceMap[index];
    if (resource == null) {
      resource = new GltfResource();
      this.resourceMap[index] = resource;
    }
    resource.textures.push(texture);
  }

  releaseTextures(gltf: Gltf) {
    const index = this.getIndex(gltf);
    let resource = this.resourceMap[index];
    resource.release(this.gl);
    delete this.resourceMap[index];
  }

  getWhiteTexture(): Texture {
    return this.whiteTexture;
  }

  async imageFromUriAsync(uri: string): Promise<HTMLImageElement> {
    const image = new Image();
    return image;
  }

  async imageFromBytesAsync(mime: string, bytes: Uint8Array): Promise<HTMLImageElement> {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      const blob = new Blob([bytes], { type: mime });
      image.src = window.URL.createObjectURL(blob);
    });
    return <Promise<HTMLImageElement>>promise;
  }

  onMouseDown(canvas: HTMLCanvasElement, e: PointerEvent) {
    //console.log(`down ${e.buttons}`);
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }

  onMouseUp(canvas: HTMLCanvasElement, e: PointerEvent) {
    //console.log(`up ${e.buttons}`);
    canvas.setPointerCapture(e.pointerId);
  }

  onMouseMove(canvas: HTMLCanvasElement, e: PointerEvent) {
    if (e.buttons == 0) {
      return;
    }
    //console.log(this, e.clientX, e.clientY);
    const dx = e.clientX - this.mouseX;
    this.mouseX = e.clientX;
    const dy = e.clientY - this.mouseY;
    this.mouseY = e.clientY;
    if (e.buttons & 1) {
      //console.log(`left: ${dx}, ${dy}`)
    }
    if (e.buttons & 2) {
      this.scene.camera.yawPitch(dx, dy);
    }
    if (e.buttons & 4) {
      this.scene.camera.shift(-dx, dy);
    }
  }

  onMouseWheel(canvas: HTMLCanvasElement, e: MouseWheelEvent) {
    //console.log(this, e.deltaY);
    this.scene.camera.dolly(e.deltaY);
  }

  async startAsync() {
    const request = this.rpc.createRequest('getModel');
    ipcRenderer.send('rpc', request[0]);
    const data: interfaces.LoadData = await request[1];

    this.scene.loadGltf(this.gl, data, this);
  }

  async loadAsync(path: string) {
    const request = this.rpc.createRequest('getModel', path);
    ipcRenderer.send('rpc', request[0]);
    const data: interfaces.LoadData = await request[1];

    this.scene.loadGltf(this.gl, data, this);
  }

  onFrame(nowSeconds: number) {
    const deltaTime = nowSeconds - this.last;
    this.last = nowSeconds;
    this.scene.update(deltaTime);
    this.scene.draw(this.gl);
  }
}
let renderer: Renderer;


window.onload = function (e) {
  const canvas = <HTMLCanvasElement>document.querySelector("#glCanvas");
  if (!canvas) {
    throw ("no canvas");
  }

  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2")!;
  if (!gl) {
    throw (
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
  }

  renderer = new Renderer(gl);


  const { Menu, MenuItem } = remote;
  const menu = Menu.getApplicationMenu()!;
  //const menu = new Menu()
  for (const menuItem of menu.items) {
    if (menuItem.label == 'File') {
      const onClick = () => {
        remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
          properties: ['openFile'],
          title: 'open model',
          defaultPath: '.',
          filters: [
            { name: 'gltf', extensions: ['gltf', 'glb', 'vrm', 'vci'] },
          ]
        }, async (fileNames) => {
          if (fileNames) {
            await renderer.loadAsync(fileNames[0]);
          }
        });
      };
      const subMenu = (<any>menuItem).submenu;
      subMenu.insert(0, new MenuItem({ type: 'separator' }))
      subMenu.insert(0, new MenuItem({
        label: 'Open', click() {
          console.log('item 1 clicked');
          onClick();
        }
      }))
    }
  }
  Menu.setApplicationMenu(menu);

  function render(now: number) {
    renderer.onFrame(now * 0.001);
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
};
