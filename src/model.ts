import { mat4 } from 'gl-matrix'

export class Model {
  positionBuffer: WebGLBuffer;
  modelViewMatrix: mat4;

  constructor(gl: WebGLRenderingContext) {
    this.positionBuffer = gl.createBuffer()!;

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    this.modelViewMatrix = mat4.create();
    mat4.translate(
      this.modelViewMatrix, // destination matrix
      this.modelViewMatrix, // matrix to translate
      [-0.0, 0.0, -6.0]
    ); // amount to translate
  }

  setPositions(gl: WebGLRenderingContext, positions: number[]) {
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }

  draw(gl: WebGLRenderingContext, positionAttr: number) {
    console.log("draw model");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.vertexAttribPointer(
      positionAttr,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(positionAttr);

    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
