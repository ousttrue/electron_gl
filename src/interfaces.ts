export interface LoadModel {
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
