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

export enum Semantics {
    POSITION = 0,
    NORMAL = 1,
    UV = 2,
    COLOR = 3,
}

export interface Model {
    indices: Uint16Array|Uint32Array,
    vertices: { [semantics: number]: VertexAttribute },
}

export function LoadDataToModel(value: gltf.Gltf, mesh: gltf.GltfMesh, prim: gltf.GltfPrimitive, bin: Uint8Array): Model
{
    const vertices: {[semantics: number]: VertexAttribute} = {}
    vertices[Semantics.POSITION] = {
      elementCount: 3,
      values: gltf.getFloatArray(value, prim.attributes['POSITION'], bin)
    }
    const model: Model = {
      indices: gltf.getIndices(value, prim, bin),
      vertices: vertices,
    }
    return model;
}
