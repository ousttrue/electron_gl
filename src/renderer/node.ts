import { VAO } from './vao'
import { Shader } from './shader'
import { Texture } from './texture'
import { Camera } from './camera'
import * as interfaces from '../interfaces'
import * as cube from '../cube'
import * as gltf from '../gltf'




export class Material {
    shader: Shader;
    texture: Texture;

    constructor(gl: WebGL2RenderingContext, shader: Shader) {
        this.shader = shader;
        this.texture = new Texture(gl);
    }

    release(gl: WebGL2RenderingContext) {
        this.shader.release(gl);
        this.texture.release(gl);
    }

    setupShader(gl: WebGL2RenderingContext, camera: Camera) {
        this.shader.use(gl);
        this.shader.setTexture(gl, this.texture.texture);
        this.shader.setCameraMatrix(gl, camera.projectionMatrix, camera.viewMatrix);
    }
}


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


export class Node {

    // 1 Mesh X N Submesh: Shared buffer. Single vao
    // N Mesh X 1 Submesh: Independent buffer. multi vao
    // 1 Mesh x 1 Submesh: Both are the same
    meshes: Mesh[] = [];

    children: Node[] = [];

    release(gl: WebGL2RenderingContext) {
        for (const child of this.children) {
            child.release(gl);
        }

        for (const mesh of this.meshes) {
            mesh.release(gl);
        }
    }

    static fromMesh(mesh: Mesh) {
        const node = new Node();
        node.meshes.push(mesh);
        return node;
    }

    static fromGltf(gl: WebGL2RenderingContext, src: interfaces.LoadData, shader: Shader) {
        const node = new Node();
        const value = <gltf.Gltf>JSON.parse(src.json);

        const material = new Material(gl, shader);

        for (const gltfMesh of value.meshes) {

            if (gltf.hasSharedVertexBuffer(gltfMesh)) {

                const vao = new VAO(gl);
                const data = interfaces.LoadDataToModel(value, gltfMesh, gltfMesh.primitives[0], src.bin);
                vao.setData(gl, data);
                vao.bindLocation(gl, shader.locationMap);
                const mesh = new Mesh(vao);

                for (const gltfPrim of gltfMesh.primitives) {
                    const indexAccessor = value.accessors[gltfPrim.indices];
                    const indexElementSize = gltf.getComponentByteSize(indexAccessor.componentType);
                    const offset = indexAccessor.byteOffset / indexElementSize;
                    const submesh = new Submesh(material, offset, indexAccessor.count);
                    mesh.submeshes.push(submesh);
                }

                node.meshes.push(mesh);

            }
            else {
                // each primitive has Mesh
                for (const gltfPrim of gltfMesh.primitives) {
                    const vao = new VAO(gl);
                    const data = interfaces.LoadDataToModel(value, gltfMesh, gltfMesh.primitives[0], src.bin);
                    vao.setData(gl, data);
                    vao.bindLocation(gl, shader.locationMap);
                    const mesh = new Mesh(vao);

                    if (data.indices) {

                        const indexAccessor = value.accessors[gltfPrim.indices];
                        const indexElementSize = gltf.getComponentByteSize(indexAccessor.componentType);
                        const offset = indexAccessor.byteOffset / indexElementSize;
                        const submesh = new Submesh(material, offset, indexAccessor.count);
                        mesh.submeshes.push(submesh);

                    }
                    else {
                        throw new Error('not implemented')
                    }

                    node.meshes.push(mesh);
                }
            }
        }
        return node;
    }

    update(deltaTime: number) {

    }

    draw(gl: WebGL2RenderingContext, camera: Camera) {
        for (const mesh of this.meshes) {
            mesh.draw(gl, camera);
        }
    }
}
