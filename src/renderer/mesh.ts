import { Material } from './material'
import { VAO } from './vao'
import { Camera } from './camera'
import * as cube from '../cube'
import { Vertices } from './vbo';


export class Submesh {

    vao: VAO;
    material: Material;
    offset: number;
    count: number;

    constructor(vao: VAO, material: Material, offset: number, count: number) {
        this.vao = vao;
        this.material = material;
        this.offset = offset;
        this.count = count;
    }

    release(gl: WebGL2RenderingContext) {
        this.material.release(gl);
        this.vao.release(gl);
    }
}


export class Mesh {

    vertices: Vertices;
    submeshes: Submesh[] = [];

    constructor()
    {
        this.vertices = new Vertices();
    }

    release(gl: WebGL2RenderingContext) {
        for (const submesh of this.submeshes) {
            submesh.release(gl);
        }
    }

    static createCube(gl: WebGL2RenderingContext, material: Material): Mesh {
        const mesh = new Mesh();
        mesh.vertices.setData(gl, cube.model);

        const vao = new VAO(gl);
        mesh.submeshes.push(new Submesh(vao, material, 0, cube.model.indices.length));

        return mesh;
    }

    draw(gl: WebGL2RenderingContext, camera: Camera) {

        for (const submesh of this.submeshes) {
            submesh.material.setupShader(gl, camera);
            submesh.vao.bindLocation(gl, this.vertices, submesh.material.shader.locationMap);

            if (this.vertices.indexBuffer) {
                this.vertices.indexBuffer.drawElements(gl, submesh.offset, submesh.count);
            }
            else {
                // without index buffer
                this.vertices.draw(gl, submesh.offset, submesh.count);
            }
        }
    }
}
