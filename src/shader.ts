class ShaderLoader {
    vs: WebGLShader;
    fs: WebGLShader;
    constructor(gl: WebGLRenderingContext) {
        this.vs = gl.createShader(gl.VERTEX_SHADER)!;
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    }
    release(gl: WebGLRenderingContext) {
        gl.deleteShader(this.vs);
        gl.deleteShader(this.fs);
    }
    _loadShader(gl: WebGLRenderingContext, shader: WebGLShader, src: string) {
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "An error occurred compiling the shaders: " +
            gl.getShaderInfoLog(shader);
        }
    }

    loadVertexShader(gl: WebGLRenderingContext, src: string) {
        this._loadShader(gl, this.vs, src);
    }

    loadFragmentShader(gl: WebGLRenderingContext, src: string) {
        this._loadShader(gl, this.fs, src);
    }

    link(gl: WebGLRenderingContext): WebGLProgram {
        const program = gl.createProgram()!;
        gl.attachShader(program, this.vs);
        gl.attachShader(program, this.fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            throw "Unable to initialize the shader program";
        }
        return program;
    }
}

export class Shader {
    program: WebGLProgram;
    vertexPosition: number;
    colorPosition: number;
    projectionMatrix: WebGLUniformLocation;
    modelViewMatrix: WebGLUniformLocation;
    constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
        this.program = program;
        this.vertexPosition = gl.getAttribLocation(this.program, "aVertexPosition")!;
        this.colorPosition = gl.getAttribLocation(this.program, "aColorPosition")!;
        this.projectionMatrix = gl.getUniformLocation(this.program, "uProjectionMatrix")!;
        this.modelViewMatrix = gl.getUniformLocation(this.program, "uModelViewMatrix")!;
    }
    use(gl: WebGLRenderingContext) {
        gl.useProgram(this.program);
    }
}

export function initShaderProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
): Shader {
    const loader = new ShaderLoader(gl);
    try {
        loader.loadVertexShader(gl, vsSource);
        loader.loadFragmentShader(gl, fsSource);
        const program = loader.link(gl);
        return new Shader(gl, program);
    } finally {
        loader.release(gl);
    }
}
