import { ipcRenderer, remote } from 'electron'
import { Scene } from './renderer/scene'
import { RPC } from './rpc';
import * as interfaces from "./interfaces";


const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying highp vec2 vTextureCoord;
//attribute vec4 aColorPosition;
// varying lowp vec4 vColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  // vColor = aColorPosition;
  vTextureCoord = aTextureCoord;
}
`;

const fsSource = `
// varying lowp vec4 vColor;
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {
  //gl_FragColor = vColor;
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;


class Renderer {
  gl: WebGL2RenderingContext;
  scene: Scene;
  last = 0;
  rpc = new RPC();
  mouseX = 0;
  mouseY = 0;

  constructor(gl: WebGL2RenderingContext) {
    gl.canvas.addEventListener('pointerdown', e => this.onMouseDown(gl.canvas, e));
    gl.canvas.addEventListener('pointerup', e => this.onMouseUp(gl.canvas, e));
    gl.canvas.addEventListener('pointermove', e => this.onMouseMove(gl.canvas, e));
    gl.canvas.addEventListener('wheel', e => this.onMouseWheel(gl.canvas, e));

    this.gl = gl;
    this.scene = new Scene(gl, vsSource, fsSource);
    ipcRenderer.on('rpc', async (e: Electron.Event, value: any) => {
      const response = await this.rpc.dispatchAsync(value);
      if (response) {
        e.sender.send('rpc', response);
      }
    });
    this.startAsync();
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

    const model = interfaces.LoadDataToModel(data);
    this.scene.loadGltf(this.gl, model);
  }

  async loadAsync(path: string) {
    const request = this.rpc.createRequest('getModel', path);
    ipcRenderer.send('rpc', request[0]);
    const data: interfaces.LoadData = await request[1];

    const model = interfaces.LoadDataToModel(data);
    this.scene.loadGltf(this.gl, model);
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
