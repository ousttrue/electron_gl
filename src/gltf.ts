import { WritableOptions } from "stream";

// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md

interface Property {
    extensions?: { [name: string]: any };
    extras?: { [name: string]: any }
}

interface ChildOfRootProperty extends Property {
    name?: string;
}

export interface GltfAsset extends Property {
    version: string; // "2.0"
    generator?: string;
    copyright?: string;
}

export enum GltfVertexAttributeSemantics {
    POSITION = 'POSITION', // 3
    NORMAL = 'NORMAL', // 3
    TANGENT = 'TANGENT', // 4
    UV0 = 'TEXCOORD_0', // 2
    UV1 = 'TEXCOORD_1', // 2
    COLOR0 = 'COLOR_0', // 3 or 4
    JOINTS0 = 'JOINTS_0', // 4
    WEIGHTS0 = 'WEIGHTS_0', // 4
}

// export const GltfSemanticElementCountMap: { [semantic: string]: number } = {}
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.Position] = 3;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.Normal] = 3;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.Tangent] = 4;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.UV0] = 2;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.UV1] = 2;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.COLOR0] = 4;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.JOINTS0] = 4;
// GltfSemanticElementCountMap[GltfVertexAttributeSemantics.WEIGHTS0] = 4;

export interface GltfPrimitive {
    attributes: { [key: string]: number };
    indices: number;
    material: number;
}


export interface GltfMesh extends ChildOfRootProperty {
    primitives: GltfPrimitive[]
}

export enum GltfComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126,
}


export function getComponentByteSize(componentTye: GltfComponentType) {
    switch (componentTye) {
        case GltfComponentType.UNSIGNED_SHORT:
            return 2;

        case GltfComponentType.UNSIGNED_INT:
            return 4;

        default:
            throw new Error(`invalid index type: ${componentTye}`);
    }
}


export enum GltfValueType {
    SCALAR = 'SCALAR',
    VEC2 = 'VEC2',
    VEC3 = 'VEC3',
    VEC4 = 'VEC4',
    MAT2 = 'MAT2',
    MAT3 = 'MAT3',
    MAT4 = 'MAT4',
}

export function getComponentCount(type: GltfValueType) {
    switch (type) {
        case GltfValueType.SCALAR:
            return 1;

        case GltfValueType.VEC2:
            return 2;

        case GltfValueType.VEC3:
            return 3;

        case GltfValueType.VEC4:
        case GltfValueType.MAT2:
            return 4;

        case GltfValueType.MAT3:
            return 9;

        case GltfValueType.MAT4:
            return 16;

        default:
            throw new Error(`unknown valueType: ${type}`);
    }
}

export interface GltfAccessor extends ChildOfRootProperty {
    bufferView: number;
    byteOffset?: number;
    componentType: GltfComponentType;
    count: number;
    max?: number[];
    min?: number[];
    type: GltfValueType;
}

export enum GltfBufferViewTarget {
    ARRAY_BUFFER = 34962,
    ELEMENT_ARRAY_BUFFER = 34963,
}

export interface GltfBufferView extends ChildOfRootProperty {
    buffer: number;
    byteOffset?: number;
    byteLength: number;
    target?: GltfBufferViewTarget;
}

export interface GltfBuffer extends ChildOfRootProperty {
    uri?: string;
    byteLength: number;
}

export enum GltfAlphaMode {
    OPAQUE = 'OPAQUE',
    MASK = 'MASK',
    BLEND = 'BLEND',
}

export interface GltfTextureInfo {
    index: number;
    texCoord?: number; // TEXCOORD_0, TEXCOORD_1, ...
}

export interface GltfPbrMetallicRoughness {
    baseColorFactor: [number, number, number, number]; // default: [1, 1, 1, 1]
    baseColorTexture?: GltfTextureInfo;
    metallicFactor: number; // default: 1
    roughnessFactor: number; // default: 1
    metallicRoughnessTexture?: GltfTextureInfo;
}

export interface GltfNormalTexture extends GltfTextureInfo {
    scale: number; // default: 1.0
}

export interface GltfOcclusionTexture extends GltfTextureInfo {
    strength: number; // default: 1.0
}

export interface GltfMaterial extends ChildOfRootProperty {
    pbrMetallicRoughness: GltfPbrMetallicRoughness;
    normalTexture?: GltfNormalTexture;
    occlusionTexture?: GltfOcclusionTexture;
    emissiveTexture?: GltfTextureInfo;
    emissiveFactor: [number, number, number]; // default: [0, 0, 0]
    alphaMode: GltfAlphaMode; // default: Opaque
    alphaCutoff: number; // default: 0.5
    doubleSided: boolean; // default: false
}

export interface GltfTexture extends ChildOfRootProperty {
    sampler: number;
    source: number;
}

export enum GltfMagFilter {
    NEAREST = 9728,
    LINEAR = 9729,
}

export enum GltfMinFilter {
    NEAREST = 9728,
    LINEAR = 9729,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987,
}

export enum GltfWrapMode {
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648,
    REPEAT = 10497,
}

export interface GltfSampler extends ChildOfRootProperty {
    magFilter: GltfMagFilter; //
    minFilter: GltfMinFilter;
    wrapS: GltfWrapMode; // default: REPEAT
    wrapT: GltfWrapMode; // default: REPEAT
}

export enum GltfMimeType {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
}

export interface GltfImage extends ChildOfRootProperty {
    uri?: string;
    mimeType: GltfMimeType;
    bufferView?: number;
}

export interface Gltf {
    asset: GltfAsset;
    meshes: GltfMesh[];
    accessors: GltfAccessor[];
    bufferViews: GltfBufferView[];
    buffers: GltfBuffer[];
    materials: GltfMaterial[];
    textures?: GltfTexture[];
    samplers?: GltfSampler[];
    images?: GltfImage[];
}

export function getFloatArray(gltf: Gltf, accessorIndex: number, bin: Uint8Array): Float32Array {
    const accessor = gltf.accessors[accessorIndex];
    const view = gltf.bufferViews[accessor.bufferView];
    let offset = 0;
    if (view.byteOffset != undefined) {
        offset = view.byteOffset;
    }
    const segment = bin.subarray(offset, offset + view.byteLength);

    if (accessor.componentType != GltfComponentType.FLOAT) {
        throw new Error(`attribute componentType is not FLOAT: ${accessor.componentType}`)
    }

    const componentCount = getComponentCount(accessor.type);
    let begin = 0;
    if (accessor.byteOffset != undefined) {
        begin = accessor.byteOffset / 4;
    }
    return new Float32Array(segment.buffer, segment.byteOffset, segment.byteLength / 4).subarray(begin, begin + accessor.count * componentCount);
}

export function getIndices(gltf: Gltf, prim: GltfPrimitive, bin: Uint8Array): Uint16Array | Uint32Array {
    const accessor = gltf.accessors[prim.indices];
    if (accessor.type != GltfValueType.SCALAR) {
        throw new Error(`${accessor.type} is not SCALAR`);
    }
    const view = gltf.bufferViews[accessor.bufferView];
    let offset = 0;
    if (view.byteOffset != undefined) {
        offset = view.byteOffset;
    }
    const segment = bin.subarray(offset, offset + view.byteLength);
    let begin = 0;
    switch (accessor.componentType) {
        case GltfComponentType.UNSIGNED_SHORT:
            {
                if (accessor.byteOffset != undefined) {
                    begin = accessor.byteOffset / 2;
                }
                return new Uint16Array(segment.buffer, segment.byteOffset, segment.byteLength / 2).subarray(begin, begin + accessor.count);
            }

        case GltfComponentType.UNSIGNED_INT:
            {
                if (accessor.byteOffset != undefined) {
                    begin = accessor.byteOffset / 4;
                }
                return new Uint32Array(segment.buffer, segment.byteOffset, segment.byteLength / 4).subarray(begin, begin + accessor.count);
            }

        default:
            throw new Error(`unknown componentType: ${accessor.componentType}`);
    }
}

export function hasSharedVertexBuffer(mesh: GltfMesh): boolean {
    if (mesh.primitives.length <= 1) {
        return true;
    }

    const first = mesh.primitives[0].attributes;

    for (let i = 1; i < mesh.primitives.length; ++i) {
        const current = mesh.primitives[i].attributes;

        if (first.length != current.length) {
            //console.debug(`${first.length} != ${current.length}`);
            return false;
        }

        for (let key in first) {
            if (!(key in current)) {
                //console.debug(`${key} !in ${current}`);
                return false;
            }
            if (first[key] != current[key]) {
                //console.debug(`${key}: ${first[key]} != ${current[key]}`);
                return false;
            }
        }
    }
    return true;
}
