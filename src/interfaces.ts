import * as glb from './glb';
import * as gltf from './gltf';


export interface LoadData {
    // gltf or glb url
    url: string;

    // gltf json
    json: string;

    // gltf first buffer or glb binary chunk
    bin: Uint8Array;
}

export interface VertexAttribute {
    elementCount: number; // 1, 2, 3, 4
    values: Float32Array;
}

export interface Model {
    indices: Uint16Array | Uint32Array,
    vertices: { [semantics: string]: VertexAttribute },
}

export function LoadDataToModel(value: gltf.Gltf, mesh: gltf.GltfMesh, prim: gltf.GltfPrimitive, bin: Uint8Array): Model {
    const vertices: { [semantics: string]: VertexAttribute } = {}

    for (const key in prim.attributes) {
        const attrib = prim.attributes[key];
        const accessor = value.accessors[attrib];
        vertices[key] = {
            elementCount: gltf.getComponentCount(accessor.type),
            values: gltf.getFloatArray(value, attrib, bin)
        }
    }

    const model: Model = {
        indices: gltf.getIndices(value, prim, bin),
        vertices: vertices,
    }
    return model;
}
