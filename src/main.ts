import { mat4 } from "gl-matrix";
import { Model } from "./model";
import { Shader, initShaderProgram } from "./shader";
import { Camera } from "./camera";
import *  as cube from "./cube";

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aColorPosition;

varying lowp vec4 vColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aColorPosition;
}
`;

const fsSource = `
varying lowp vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;


function drawScene(gl: WebGLRenderingContext,
  shader: Shader, camera: Camera, model: Model) {
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

  model.draw(gl, shader.vertexPosition, shader.colorPosition);
}

class Scene {

  then = 0;
  gl: WebGLRenderingContext;
  camera: Camera;
  model: Model;
  shader: Shader;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    // setup scene
    this.camera = new Camera(this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);

    this.model = new Model(this.gl);
    this.model.setData(this.gl, cube);

    this.shader = initShaderProgram(this.gl, vsSource, fsSource);
  }

  onFrame(now: number) {
    const deltaTime = now - this.then;
    this.then = now;

    this.model.update(deltaTime);

    drawScene(this.gl, this.shader, this.camera, this.model);
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
