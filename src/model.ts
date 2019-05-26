import { mat4 } from 'gl-matrix'

export class Model {
  positionBuffer: WebGLBuffer;
  colorBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  modelViewMatrix: mat4;
  rotation = 0;
  vertexCount = 0;
  indexCount = 0;
  indexType = 0;

  constructor(gl: WebGLRenderingContext) {
    this.indexBuffer = gl.createBuffer()!;
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
    this.rotation = deltaTime;
    // mat4.rotate(this.modelViewMatrix,  // destination matrix
    //   this.modelViewMatrix,  // matrix to rotate
    //   this.rotation,   // amount to rotate in radians
    //   [0, 0, 1]);       // axis to rotate around

    mat4.rotate(this.modelViewMatrix, this.modelViewMatrix,
      this.rotation * .7, [0, 1, 0]);
  }

  setData(gl: WebGLRenderingContext, data: any) {
    this.setIndices(gl, data.indices);
    this.setVertices(gl, data.positions, data.colors);
  }

  setVertices(gl: WebGLRenderingContext, positions: number[], colors: number[]) {
    this.vertexCount = positions.length / 3;
    if (this.vertexCount != colors.length / 4) {
      throw "different positions and colors";
    }

    // positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // colors
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }

  setIndices(gl: WebGLRenderingContext, indices: number[]) {
    this.indexType = gl.UNSIGNED_SHORT;
    this.indexCount = indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);
  }

  draw(gl: WebGLRenderingContext, positionLocation: number, colorLocation: number) {

    {
      const numComponents = 3; // pull out 2 values per iteration
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
  }
}
