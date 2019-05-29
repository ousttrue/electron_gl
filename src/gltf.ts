// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md

export interface Primitive {
    attributes: {}
}

export interface Mesh {
    primitives: Primitive[]
}

export interface Gltf {
    meshes: Mesh[];
}