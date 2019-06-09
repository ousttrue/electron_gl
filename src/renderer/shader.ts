import { mat4 } from "gl-matrix";
import * as interfaces from "../interfaces";
import { GltfVertexAttributeSemantics } from '../gltf'
import { timingSafeEqual } from "crypto";


class ShaderLoader {
    vs: WebGLShader;
    fs: WebGLShader;
    constructor(gl: WebGL2RenderingContext) {
        this.vs = gl.createShader(gl.VERTEX_SHADER)!;
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    }
    release(gl: WebGL2RenderingContext) {
        gl.deleteShader(this.vs);
        gl.deleteShader(this.fs);
    }
    _loadShader(gl: WebGL2RenderingContext, shader: WebGLShader, src: string) {
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "An error occurred compiling the shaders: " +
            gl.getShaderInfoLog(shader);
        }
    }

    loadVertexShader(gl: WebGL2RenderingContext, src: string) {
        this._loadShader(gl, this.vs, src);
    }

    loadFragmentShader(gl: WebGL2RenderingContext, src: string) {
        this._loadShader(gl, this.fs, src);
    }

    link(gl: WebGL2RenderingContext, program: WebGLProgram) {
        gl.attachShader(program, this.vs);
        gl.attachShader(program, this.fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            throw "Unable to initialize the shader program";
        }
    }
}


const attributeMap: { [key: string]: string } =
{
    "aVertexPosition": GltfVertexAttributeSemantics.POSITION,
    "aColorPosition": GltfVertexAttributeSemantics.COLOR0,
    "aTextureCoord": GltfVertexAttributeSemantics.UV0,
};


export class Shader {
    program: WebGLProgram;
    name: string;

    vs?: string;
    fs?: string;
    initialized = false;

    projectionMatrix: WebGLUniformLocation = 0;
    modelViewMatrix: WebGLUniformLocation = 0;
    uSampler: WebGLUniformLocation = 0;
    locationMap: { [semantics: string]: number } = {};

    constructor(gl: WebGL2RenderingContext, name: string) {
        this.program = gl.createProgram()!;
        this.name = name;
    }

    release(gl: WebGL2RenderingContext) {
        gl.deleteProgram(this.program);
        this.initialized = false;
    }

    setSource(gl: WebGL2RenderingContext, shaderType: string, source: string) {
        switch (shaderType) {
            case "vs":
                this.vs = source;
                break;

            case "fs":
                this.fs = source;
                break;

            default:
                console.error(`unknown shaderType: ${shaderType}`)
                break;
        }

        if (!this.vs || !this.fs) {
            return;
        }
        if(this.initialized){
            console.info(`clear shader: ${this.name}`);
            this.release(gl);
            this.program = gl.createProgram()!;
        }

        const loader = new ShaderLoader(gl);
        try {
            loader.loadVertexShader(gl, this.vs);
            loader.loadFragmentShader(gl, this.fs);
            loader.link(gl, this.program);
            this.projectionMatrix = gl.getUniformLocation(this.program, "uProjectionMatrix")!;
            this.modelViewMatrix = gl.getUniformLocation(this.program, "uModelViewMatrix")!;
            this.uSampler = gl.getUniformLocation(this.program, 'uSampler')!;

            for (const key in attributeMap) {
                const location = gl.getAttribLocation(this.program, key);
                const semantic = attributeMap[key];
                if (location >= 0) this.locationMap[semantic] = location;
            }

            this.initialized = true;
        } finally {
            loader.release(gl);
        }
    }

    use(gl: WebGL2RenderingContext): boolean {
        if (!this.initialized) {
            return false;
        }
        gl.useProgram(this.program);
        return true;
    }

    setTexture(gl: WebGL2RenderingContext, texture: WebGLTexture) {
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        {
            // Bind the texture to texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Tell the shader we bound the texture to texture unit 0
            gl.uniform1i(this.uSampler, 0);
        }
    }

    setCameraMatrix(gl: WebGL2RenderingContext, projection: mat4, view: mat4) {
        gl.uniformMatrix4fv(
            this.projectionMatrix,
            false,
            projection
        );

        gl.uniformMatrix4fv(
            this.modelViewMatrix,
            false,
            view
        );
    }
}
