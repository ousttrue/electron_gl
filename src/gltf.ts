// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md

export interface Asset {
    version: string; // "2.0"
    generator?: string;
    copyright?: string;
}

export interface Primitive {
    attributes: { [key: string]: number };
}

export interface Mesh {
    primitives: Primitive[]
}

export enum ComponentType {
    UNSIGNED_SHORT = 5123,
}

export enum ValueType {
    SCALAR = 'SCALAR',
}

export interface Accessor {
    bufferView: number,
    byteOffset: number,
    componentType: ComponentType,
    count: number,
    max: number[],
    min: number[],
    type: ValueType
}

export interface Gltf {
    asset: Asset;
    meshes: Mesh[];
    accessors: Accessor[];
}
