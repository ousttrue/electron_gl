import * as glb from './glb';
import * as gltf from './gltf';


export interface LoadData {
    url: string;
    data: Buffer;
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

export function LoadDataToModel(data: Uint8Array, utf8decoder: (src: Uint8Array)=>string): Model
{
    const [gltf_bin, bin] = glb.parseGlb(new DataView(data.buffer));
    const value = <gltf.Gltf>JSON.parse(new TextDecoder('utf-8').decode(gltf_bin));

    const mesh = value.meshes[0];
    const prim = mesh.primitives[0];

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
