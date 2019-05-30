// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md

interface Property {
    extensions?: { [name: string]: any };
    extras?: { [name: string]: any }
}

interface ChildOfRootProperty extends Property {
    name?: string;
}

export interface Asset extends Property {
    version: string; // "2.0"
    generator?: string;
    copyright?: string;
}

export interface Primitive {
    attributes: { [key: string]: number };
}

export interface Mesh extends ChildOfRootProperty {
    primitives: Primitive[]
}

export enum ComponentType {
    UNSIGNED_SHORT = 5123,
}

export enum ValueType {
    SCALAR = 'SCALAR',
}

export interface Accessor extends ChildOfRootProperty {
    bufferView: number;
    byteOffset: number;
    componentType: ComponentType;
    count: number;
    max: number[];
    min: number[];
    type: ValueType;
}

export enum BufferViewTarget {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963,
}

export interface BufferView extends ChildOfRootProperty {
    buffer: number;
    byteOffset: number;
    byteLength: number;
    target: BufferViewTarget;
}

export interface Buffer extends ChildOfRootProperty {
    uri?: string;
    byteLength: number;
}

export interface Gltf {
    asset: Asset;
    meshes: Mesh[];
    accessors: Accessor[];
    bufferViews: BufferView[];
    buffers: Buffer[];
}
