import { mat4 } from 'gl-matrix'

export class Model {
  positionBuffer: WebGLBuffer;
  colorBuffer: WebGLBuffer;
  modelViewMatrix: mat4;
  squareRotation = 0;

  constructor(gl: WebGLRenderingContext) {
    this.positionBuffer = gl.createBuffer()!;
    this.colorBuffer = gl.createBuffer()!;

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    this.modelViewMatrix = mat4.create();
    mat4.translate(
      this.modelViewMatrix, // destination matrix
      this.modelViewMatrix, // matrix to translate
      [-0.0, 0.0, -6.0]
    ); // amount to translate

  }

  update(deltaTime: number) {
    this.squareRotation = deltaTime;
    mat4.rotate(this.modelViewMatrix,  // destination matrix
      this.modelViewMatrix,  // matrix to rotate
      this.squareRotation,   // amount to rotate in radians
      [0, 0, 1]);       // axis to rotate around
  }

  setPositions(gl: WebGLRenderingContext, positions: number[]) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }

  setColors(gl: WebGLRenderingContext, colors: number[]) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }

  draw(gl: WebGLRenderingContext, positionLocation: number, colorLocation: number) {

    {
      const numComponents = 2; // pull out 2 values per iteration
      const type = gl.FLOAT; // the data in the buffer is 32bit floats
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set of values to the next
      const offset = 0; // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.vertexAttribPointer(
        positionLocation,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      gl.enableVertexAttribArray(positionLocation);
    }

    {
      const numComponents = 4;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.vertexAttribPointer(
        colorLocation,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(colorLocation);
    }

    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
  }
}
