import { Shader } from './shader'
import { Texture } from './texture'
import { Camera } from './camera'

export class Material {
    shader: Shader;
    texture: Texture;

    constructor(gl: WebGL2RenderingContext, shader: Shader) {
        this.shader = shader;
        this.texture = new Texture(gl);
    }

    release(gl: WebGL2RenderingContext) {
        this.shader.release(gl);
        this.texture.release(gl);
    }

    setupShader(gl: WebGL2RenderingContext, camera: Camera) {
        this.shader.use(gl);
        this.shader.setTexture(gl, this.texture.texture);
        this.shader.setCameraMatrix(gl, camera.projectionMatrix, camera.viewMatrix);
    }
}