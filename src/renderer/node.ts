import { VAO } from './vao'
import { Shader } from './shader'
import { Material } from './material'
import { Camera } from './camera'
import { Mesh, Submesh } from './mesh'
import * as interfaces from '../interfaces'
import * as gltf from '../gltf'


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

                const data = interfaces.LoadDataToModel(value, gltfMesh, gltfMesh.primitives[0], src.bin);
                const mesh = new Mesh();
                mesh.vertices.setData(gl, data);

                for (const gltfPrim of gltfMesh.primitives) {
                    const indexAccessor = value.accessors[gltfPrim.indices];
                    const indexElementSize = gltf.getComponentByteSize(indexAccessor.componentType);
                    let offset = 0;
                    if (indexAccessor.byteOffset != undefined) {
                        offset = indexAccessor.byteOffset / indexElementSize;
                    }
                    const vao = new VAO(gl);
                    const submesh = new Submesh(vao, material, offset, indexAccessor.count);
                    mesh.submeshes.push(submesh);
                }

                node.meshes.push(mesh);

            }
            else {
                // each primitive has Mesh
                for (const gltfPrim of gltfMesh.primitives) {
                    const data = interfaces.LoadDataToModel(value, gltfMesh, gltfMesh.primitives[0], src.bin);
                    const mesh = new Mesh();
                    mesh.vertices.setData(gl, data);

                    if (data.indices) {

                        const indexAccessor = value.accessors[gltfPrim.indices];
                        const indexElementSize = gltf.getComponentByteSize(indexAccessor.componentType);
                        let offset = 0;
                        if (indexAccessor.byteOffset != undefined) {
                            offset = indexAccessor.byteOffset / indexElementSize;
                        }
                        const vao = new VAO(gl);
                        const submesh = new Submesh(vao, material, offset, indexAccessor.count);
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
