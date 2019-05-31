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
    indices: number;
}


export interface Mesh extends ChildOfRootProperty {
    primitives: Primitive[]
}

export enum ComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126,
}

export enum ValueType {
    SCALAR = 'SCALAR',
    VEC2 = 'VEC2',
    VEC3 = 'VEC3',
    VEC4 = 'VEC4',
    MAT2 = 'MAT2',
    MAT3 = 'MAT3',
    MAT4 = 'MAT4',
}

function getComponentCount(type: ValueType)
{
    switch(type)
    {
        case ValueType.SCALAR:
            return 1;

        case ValueType.VEC2:
            return 2;

        case ValueType.VEC3:
            return 3;

        case ValueType.VEC4:
        case ValueType.MAT2:
            return 4;

        case ValueType.MAT3:
            return 9;

        case ValueType.MAT4:
            return 16;

        default:
            throw new Error(`unknown valueType: ${type}`);
    }
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

export function getFloatArray(gltf: Gltf, accessorIndex: number, bin: Uint8Array): Float32Array {
    const accessor = gltf.accessors[accessorIndex];
    const view = gltf.bufferViews[accessor.bufferView];
    const segment = bin.subarray(view.byteOffset, view.byteLength + view.byteLength);

    if (accessor.componentType != ComponentType.FLOAT) {
        throw new Error(`attribute componentType is not FLOAT: ${accessor.componentType}`)
    }

    const componentCount = getComponentCount(accessor.type);
    const begin = accessor.byteOffset / 4;
    return new Float32Array(segment.buffer).subarray(begin, begin + accessor.count * componentCount);
}

export function getIndices(gltf: Gltf, prim: Primitive, bin: Uint8Array): Uint16Array | Uint32Array {
    const accessor = gltf.accessors[prim.indices];
    const view = gltf.bufferViews[accessor.bufferView];
    const segment = bin.subarray(view.byteOffset, view.byteLength + view.byteLength);

    switch (accessor.componentType) {
        case ComponentType.UNSIGNED_SHORT:
            {
                const begin = accessor.byteOffset / 2;
                return new Uint16Array(segment.buffer).subarray(begin, begin + accessor.count);
            }

        case ComponentType.UNSIGNED_INT:
            {
                const begin = accessor.byteOffset / 4;
                return new Uint32Array(segment.buffer).subarray(begin, begin + accessor.count);
            }

        default:
            throw new Error(`unknown componentType: ${accessor.componentType}`);
    }
}
