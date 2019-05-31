import { mat4 } from 'gl-matrix'
import { Model } from './interfaces'

export class VBO {
  vbo: WebGLBuffer;
  bufferType: number = 0;
  elementType: number = 0;
  elementCount: number = 0;
  count: number = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.vbo = gl.createBuffer()!;
  }

  setup(gl: WebGL2RenderingContext, location: number) {
    const stride = 0; // how many bytes to get from one set of values to the next
    const offset = 0; // how many bytes inside the buffer to start from

    gl.bindBuffer(this.bufferType, this.vbo);
    gl.vertexAttribPointer(
      location,
      this.elementCount,
      this.elementType,
      false,
      stride,
      offset
    );
    gl.enableVertexAttribArray(location);
  }

  drawElements(gl: WebGL2RenderingContext) {
    gl.bindBuffer(this.bufferType, this.vbo);
    gl.drawElements(gl.TRIANGLES, this.count, this.elementType, 0);
  }

  // float2, 3, 4
  setData(gl: WebGL2RenderingContext, elementCount: number, values: number[]) {
    this.count = values.length / elementCount;
    this.bufferType = gl.ARRAY_BUFFER;
    this.elementType = gl.FLOAT;
    this.elementCount = elementCount;
    gl.bindBuffer(this.bufferType, this.vbo);
    gl.bufferData(this.bufferType, new Float32Array(values), gl.STATIC_DRAW);
  }

  // short[] or int[]
  setIndexData(gl: WebGL2RenderingContext, elementType: number, values: number[]) {
    this.count = values.length;
    this.bufferType = gl.ELEMENT_ARRAY_BUFFER;
    this.elementType = elementType;
    this.elementCount = 1;
    gl.bindBuffer(this.bufferType, this.vbo);
    switch (this.elementType) {
      case gl.UNSIGNED_SHORT:
        gl.bufferData(this.bufferType,
          new Uint16Array(values), gl.STATIC_DRAW);
        break;

      case gl.UNSIGNED_INT:
        gl.bufferData(this.bufferType,
          new Uint32Array(values), gl.STATIC_DRAW);
        break;

      default:
        throw new Error('invalid element type: ');
    }
  }
}

export class VAO {
  vao: WebGLVertexArrayObject;
  // locationMap : {[semantics: number]: number} = {}

  indexBuffer?: VBO;
  vertexAttributes: {[semantics: number]: VBO} = [];

  modelViewMatrix: mat4;
  rotation = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.vao = gl.createVertexArray()!;

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

  setData(gl: WebGL2RenderingContext, model: Model, locationMap: { [semantics: number]: number }) {
    // create VBO
    for (const semantics in model.vertices) {
      const attr = model.vertices[semantics];
      const vbo = new VBO(gl);
      vbo.setData(gl, attr.elementCount, attr.values);
      this.vertexAttributes[semantics] = vbo;
    }
    this.indexBuffer = new VBO(gl);
    this.indexBuffer.setIndexData(gl, gl.UNSIGNED_SHORT, model.indices);

    // this.locationMap = locationMap;
    // bind VAO
    gl.bindVertexArray(this.vao);
    for (const semantics in this.vertexAttributes)
    {
      const attr = this.vertexAttributes[semantics];
      if(semantics in locationMap){
        attr.setup(gl, locationMap[semantics]);
      }
    }
    gl.bindVertexArray(null);
  }

  draw(gl: WebGL2RenderingContext) {
    // for (const semantics in this.vertexAttributes)
    // {
    //   const attr = this.vertexAttributes[semantics];
    //   if(semantics in this.locationMap){
    //     attr.setup(gl, this.locationMap[semantics]);
    //   }
    // }
    gl.bindVertexArray(this.vao);

    if (this.indexBuffer) {
      this.indexBuffer.drawElements(gl);
    }
  }
}
