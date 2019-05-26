import { mat4 } from "gl-matrix";
import { Model } from "./model";
import { Shader, initShaderProgram } from "./shader";

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


class Camera {
  projectionMatrix: mat4;

  constructor(w: number, h: number) {
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = w / h;
    const zNear = 0.1;
    const zFar = 100.0;
    this.projectionMatrix = mat4.create();
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
  }
}

function drawScene(gl: WebGLRenderingContext, shader: Shader, camera: Camera, model: Model) {
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

function main() {
  console.log("main");
  const canvas = <HTMLCanvasElement>document.querySelector("#glCanvas");
  if (canvas === null) {
    console.log("no canvas");
    return;
  }
  console.log(canvas);

  // Initialize the GL context
  const gl = canvas.getContext("webgl");
  // Only continue if WebGL is available and working
  if (gl === null) {
    console.error(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }
  console.log(gl);

  const shader = initShaderProgram(gl, vsSource, fsSource);

  const model = new Model(gl);
  model.setPositions(gl, [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]);
  model.setColors(gl, [
    1.0, 1.0, 1.0, 1.0,    // white
    1.0, 0.0, 0.0, 1.0,    // red
    0.0, 1.0, 0.0, 1.0,    // green
    0.0, 0.0, 1.0, 1.0,    // blue
  ]);

  const camera = new Camera(gl.canvas.clientWidth, gl.canvas.clientHeight);

  drawScene(gl, shader, camera, model);
}

window.onload = function (e) {
  main();
};