import { Material } from './material'
import { VAO } from './vao'
import { Camera } from './camera'
import * as cube from '../cube'


export class Submesh {

    material: Material;
    offset: number;
    count: number;

    constructor(material: Material, offset: number, count: number) {
        this.material = material;
        this.offset = offset;
        this.count = count;
    }

    release(gl: WebGL2RenderingContext) {
        this.material.release(gl);
    }
}


export class Mesh {

    submeshes: Submesh[] = [];
    vao: VAO;

    constructor(vao: VAO) {
        this.vao = vao;
    }

    release(gl: WebGL2RenderingContext) {
        for (const submesh of this.submeshes) {
            submesh.release(gl);
        }

        this.vao.release(gl);
    }

    static createCube(gl: WebGL2RenderingContext, material: Material): Mesh {
        const vao = new VAO(gl);
        vao.setData(gl, cube.model);

        const mesh = new Mesh(vao);
        mesh.submeshes.push(new Submesh(material, 0, cube.model.indices.length));

        return mesh;
    }

    draw(gl: WebGL2RenderingContext, camera: Camera) {
        this.vao.bind(gl);

        for (const submesh of this.submeshes) {
            submesh.material.setupShader(gl, camera);

            if (this.vao.indexBuffer) {
                this.vao.indexBuffer.drawElements(gl, submesh.offset, submesh.count);
            }
            else {
                // without index buffer
                this.vao.draw(gl, submesh.offset, submesh.count);
            }
        }
    }
}
