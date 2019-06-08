import { Shader } from './shader'
import { Texture } from './texture'
import { Camera } from './camera'
import { Gltf, GltfMaterial } from '../gltf'


export interface ResourceManager {
    getShader: (name: string) => Shader;

    getWhiteTexture: () => Texture;

    addTexture: (gltf: Gltf, texture: Texture) => void;
    releaseTextures: (gltf: Gltf) => void;

    imageFromUriAsync: (uri: string) => Promise<HTMLImageElement>;
    imageFromBytesAsync: (bytes: Uint8Array) => Promise<HTMLImageElement>;
}


export class Material {
    shader: Shader;
    texture: Texture;

    constructor(shader: Shader, texture: Texture) {
        this.shader = shader;
        this.texture = texture;
    }

    setupShader(gl: WebGL2RenderingContext, camera: Camera): boolean {
        if (!this.shader.use(gl)) {
            return false;
        }
        this.shader.setTexture(gl, this.texture.texture);
        this.shader.setCameraMatrix(gl, camera.projectionMatrix, camera.viewMatrix);
        return true;
    }

    static fromGltf(resource: ResourceManager, textures: Texture[], gltf: Gltf, src: GltfMaterial): Material {
        const shader = resource.getShader("unlit");
        let texture = src.pbrMetallicRoughness.baseColorTexture
            ? textures[src.pbrMetallicRoughness.baseColorTexture.index]
            : resource.getWhiteTexture()
            ;
        return new Material(shader, texture);
    }
}
