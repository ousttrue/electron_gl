import { Vertices } from './vbo'


export class VAO {
  vao: WebGLVertexArrayObject;
  bound = false;

  constructor(gl: WebGL2RenderingContext) {
    this.vao = gl.createVertexArray()!;
  }

  release(gl: WebGL2RenderingContext) {
    gl.deleteVertexArray(this.vao);
  }

  bindLocation(gl: WebGL2RenderingContext, vertices: Vertices, locationMap: { [semantics: number]: number }) {
    // bind VAO
    gl.bindVertexArray(this.vao);
    if (!this.bound) {
      this.bound = true;
      for (const semantics in vertices.vertexAttributes) {
        const attr = vertices.vertexAttributes[semantics];
        if (semantics in locationMap) {
          attr.setup(gl, locationMap[semantics]);
        }
      }
    }
    //gl.bindVertexArray(null);
  }
}
