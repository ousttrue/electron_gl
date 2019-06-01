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
  setData(gl: WebGL2RenderingContext, elementCount: number, values: Float32Array) {
    this.count = values.length / elementCount;
    this.bufferType = gl.ARRAY_BUFFER;
    this.elementType = gl.FLOAT;
    this.elementCount = elementCount;
    gl.bindBuffer(this.bufferType, this.vbo);
    gl.bufferData(this.bufferType, values, gl.STATIC_DRAW);
  }

  // short[] or int[]
  setIndexData(gl: WebGL2RenderingContext, values: Uint16Array | Uint32Array) {
    this.count = values.length;
    this.bufferType = gl.ELEMENT_ARRAY_BUFFER;
    this.elementCount = 1;
    gl.bindBuffer(this.bufferType, this.vbo);
    if (values instanceof Uint16Array) {
      this.elementType = gl.UNSIGNED_SHORT;
      gl.bufferData(this.bufferType,
        values, gl.STATIC_DRAW);
    }
    else if (values instanceof Uint32Array) {
      this.elementType = gl.UNSIGNED_INT;
      gl.bufferData(this.bufferType,
        values, gl.STATIC_DRAW);
    }
    else {
      throw new Error('invalid element type: ');
    }
  }
}

export class VAO {
  vao: WebGLVertexArrayObject;
  // locationMap : {[semantics: number]: number} = {}

  indexBuffer?: VBO;
  vertexAttributes: { [semantics: number]: VBO } = [];

  constructor(gl: WebGL2RenderingContext) {
    this.vao = gl.createVertexArray()!;
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
    this.indexBuffer.setIndexData(gl, model.indices);

    // this.locationMap = locationMap;
    // bind VAO
    gl.bindVertexArray(this.vao);
    for (const semantics in this.vertexAttributes) {
      const attr = this.vertexAttributes[semantics];
      if (semantics in locationMap) {
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
