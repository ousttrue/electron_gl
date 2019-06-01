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

    link(gl: WebGL2RenderingContext): WebGLProgram {
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
    projectionMatrix: WebGLUniformLocation;
    modelViewMatrix: WebGLUniformLocation;
    uSampler: WebGLUniformLocation;
    constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
        this.program = program;
        this.projectionMatrix = gl.getUniformLocation(this.program, "uProjectionMatrix")!;
        this.modelViewMatrix = gl.getUniformLocation(this.program, "uModelViewMatrix")!;
        this.uSampler = gl.getUniformLocation(this.program, 'uSampler')!;
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
    }
}

export function initShaderProgram(
    gl: WebGL2RenderingContext,
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
