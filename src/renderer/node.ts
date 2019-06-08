import { VAO } from './vao'
import { Material, ResourceManager } from './material'
import { Texture } from './texture'
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

    static fromGltf(gl: WebGL2RenderingContext, src: interfaces.LoadData, resource: ResourceManager) {
        const node = new Node();
        const value = <gltf.Gltf>JSON.parse(src.json);

        const textures: Texture[] = [];
        if (value.textures && value.images) {
            for (const gltfTexture of value.textures) {
                //const sampler = value.samplers[gltfTexture.sampler];
                const image = value.images[gltfTexture.source];
                const texture = new Texture(gl);
                textures.push(texture);

                if (image.uri) {
                    resource.imageFromUriAsync(image.uri).then(img => {
                        texture.setPixels(gl, img);
                    });
                }
                else if (image.bufferView != undefined) {
                    const view = value.bufferViews[image.bufferView];
                    let offset = 0;
                    if (view.byteOffset) {
                        offset = view.byteOffset;
                    }
                    const bytes = src.bin.subarray(offset, offset + view.byteLength);
                    resource.imageFromBytesAsync(image.mimeType, bytes).then(img => {
                        texture.setPixels(gl, img);
                    });
                }
                else {
                    console.error(`no image uri and bufferView`);
                }
            }
        }

        const materials: Material[] = [];
        for (const gltfMaterial of value.materials) {
            const material = Material.fromGltf(resource, textures, value, gltfMaterial);
            materials.push(material);
        }

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
                    const submesh = new Submesh(vao, materials[gltfPrim.material], offset, indexAccessor.count);
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
                        const submesh = new Submesh(vao, materials[gltfPrim.material], offset, indexAccessor.count);
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
