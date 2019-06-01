import { mat4 } from "gl-matrix";
import * as interfaces from "../interfaces";


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

export class Shader {
    program: WebGLProgram;
    projectionMatrix: WebGLUniformLocation = 0;
    modelViewMatrix: WebGLUniformLocation = 0;
    uSampler: WebGLUniformLocation = 0;
    locationMap: {[semantics: number]: number} = {};
    _refCount = 1;

    constructor(gl: WebGL2RenderingContext) {
        this.program = gl.createProgram()!;
    }

    addRef(){ ++this._refCount;}

    release(gl: WebGL2RenderingContext) {
        --this._refCount;
        if(this._refCount<=0){
            gl.deleteProgram(this.program);
        }
    }

    load(gl: WebGL2RenderingContext,
        vsSource: string,
        fsSource: string
    ) {
        const loader = new ShaderLoader(gl);
        try {
            loader.loadVertexShader(gl, vsSource);
            loader.loadFragmentShader(gl, fsSource);
            loader.link(gl, this.program);
            this.projectionMatrix = gl.getUniformLocation(this.program, "uProjectionMatrix")!;
            this.modelViewMatrix = gl.getUniformLocation(this.program, "uModelViewMatrix")!;
            this.uSampler = gl.getUniformLocation(this.program, 'uSampler')!;

            {
                const location = gl.getAttribLocation(this.program, "aVertexPosition");
                if (location >= 0) this.locationMap[interfaces.Semantics.POSITION] = location;
            }
            {
                const location = gl.getAttribLocation(this.program, "aColorPosition");
                if (location >= 0) this.locationMap[interfaces.Semantics.COLOR] = location;
            }
            {
                const location = gl.getAttribLocation(this.program, 'aTextureCoord');
                if (location >= 0) this.locationMap[interfaces.Semantics.UV] = location;
            }

        } finally {
            loader.release(gl);
        }
    }

    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
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
