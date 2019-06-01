import { ipcRenderer, remote } from 'electron'
import { mat4 } from "gl-matrix";
import { VAO } from "./model";
import { Shader, initShaderProgram } from "./shader";
import { Camera } from "./camera";
import *  as cube from "./cube";
import { RPC } from './rpc';
import { parseGlb } from "./glb";
import * as interfaces from "./interfaces";
import * as gltf from "./gltf";
import { timingSafeEqual } from 'crypto';

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


function resizeCanvas(canvas: HTMLCanvasElement): boolean {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth ||
    canvas.height != displayHeight) {

    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    return true;
  }
  else {
    return false;
  }
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl: WebGL2RenderingContext, url: string) {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };

  image.crossOrigin = "anonymous";
  image.src = url;

  return texture;
}

function isPowerOf2(value: number): boolean {
  return (value & (value - 1)) == 0;
}


class Scene {

  camera: Camera;
  model: VAO;
  shader: Shader;
  texture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext) {

    // setup scene
    this.camera = new Camera();
    this.camera.setScreenSize(gl.canvas.clientWidth, gl.canvas.clientHeight);

    this.shader = initShaderProgram(gl, vsSource, fsSource);

    const locationMap: { [semantics: number]: number } = {};
    {
      const location = gl.getAttribLocation(this.shader.program, "aVertexPosition");
      if (location >= 0) locationMap[interfaces.Semantics.POSITION] = location;
    }
    {
      const location = gl.getAttribLocation(this.shader.program, "aColorPosition");
      if (location >= 0) locationMap[interfaces.Semantics.COLOR] = location;
    }
    {
      const location = gl.getAttribLocation(this.shader.program, 'aTextureCoord');
      if (location >= 0) locationMap[interfaces.Semantics.UV] = location;
    }

    this.model = new VAO(gl);
    this.model.setData(gl, cube.model, locationMap);

    //this.texture = loadTexture(gl, 'cubetexture.png');
    this.texture = loadTexture(gl, 'https://mdn.github.io/webgl-examples/tutorial/sample6/cubetexture.png');
  }

  loadGltf(gl: WebGL2RenderingContext, model: interfaces.Model) {
    const locationMap: { [semantics: number]: number } = {};
    {
      const location = gl.getAttribLocation(this.shader.program, "aVertexPosition");
      if (location >= 0) locationMap[interfaces.Semantics.POSITION] = location;
    }
    {
      const location = gl.getAttribLocation(this.shader.program, "aColorPosition");
      if (location >= 0) locationMap[interfaces.Semantics.COLOR] = location;
    }
    {
      const location = gl.getAttribLocation(this.shader.program, 'aTextureCoord');
      if (location >= 0) locationMap[interfaces.Semantics.UV] = location;
    }

    //this.model.release();
    this.model = new VAO(gl);
    this.model.setData(gl, model, locationMap);
  }

  resize(w: number, h: number) {
    this.camera.setScreenSize(w, h);
  }

  update(deltaTime: number) {
    //this.model.update(deltaTime);
  }

  draw(gl: WebGL2RenderingContext) {
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (resizeCanvas(gl.canvas)) {
      this.camera.setScreenSize(gl.canvas.width, gl.canvas.height);
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // setup pipeline
    this.shader.use(gl);

    gl.uniformMatrix4fv(
      this.shader.projectionMatrix,
      false,
      this.camera.projectionMatrix
    );

    gl.uniformMatrix4fv(
      this.shader.modelViewMatrix,
      false,
      this.camera.viewMatrix
    );

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(this.shader.uSampler, 0);

    this.model.draw(gl);
  }
}

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
    this.scene = new Scene(gl);
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

  async loadAsync(path: string){
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

  const openButton = <HTMLButtonElement>document.querySelector("#open");
  openButton.addEventListener('click', () => {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      title: 'open model',
      defaultPath: '.',
      filters: [
          {name: 'glb', extensions: ['glb', 'vrm', 'vci']},
          {name: 'gltf', extensions: ['gltf']}
      ]
  }, async (fileNames) => {
    if(fileNames){
      await renderer.loadAsync(fileNames[0]);
    }
  });
  });

  function render(now: number) {
    renderer.onFrame(now * 0.001);
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
};
