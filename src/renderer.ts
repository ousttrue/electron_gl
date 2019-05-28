import { mat4 } from "gl-matrix";
import { Model } from "./model";
import { Shader, initShaderProgram } from "./shader";
import { Camera } from "./camera";
import *  as cube from "./cube";

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


//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl: WebGLRenderingContext, url: string) {
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

function drawScene(gl: WebGLRenderingContext,
  shader: Shader, camera: Camera, model: Model, texture: WebGLTexture) {
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // clear
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // setup pipeline
  shader.use(gl);

  gl.uniformMatrix4fv(
    shader.projectionMatrix,
    false,
    camera.projectionMatrix
  );

  gl.uniformMatrix4fv(
    shader.modelViewMatrix,
    false,
    model.modelViewMatrix
  );

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(shader.uSampler, 0);

  model.draw(gl, shader.vertexPosition, shader.colorPosition, shader.textureCoord);
}

class Scene {

  then = 0;
  gl: WebGLRenderingContext;
  camera: Camera;
  model: Model;
  shader: Shader;
  texture: WebGLTexture;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    // setup scene
    this.camera = new Camera(this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);

    this.model = new Model(this.gl);
    this.model.setData(this.gl, cube);

    this.shader = initShaderProgram(this.gl, vsSource, fsSource);

    //this.texture = loadTexture(gl, 'cubetexture.png');
    this.texture = loadTexture(gl, 'https://mdn.github.io/webgl-examples/tutorial/sample6/cubetexture.png');
  }

  onFrame(now: number) {
    const deltaTime = now - this.then;
    this.then = now;

    this.model.update(deltaTime);

    drawScene(this.gl, this.shader, this.camera, this.model, this.texture);
  }
}

window.onload = function (e) {
  const canvas = <HTMLCanvasElement>document.querySelector("#glCanvas");
  if (!canvas) {
    throw ("no canvas");
  }

  const gl = canvas.getContext("webgl")!;
  if (!gl) {
    throw (
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
  }

  const scene = new Scene(gl);
  function render(now: number) {
    scene.onFrame(now * 0.001);
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
};
