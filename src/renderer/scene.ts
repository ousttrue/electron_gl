import { Camera } from './camera'
import { VAO } from './model'
import { Shader, initShaderProgram } from './shader'
import { loadTexture } from './texture'
import * as interfaces from '../interfaces'
import * as cube from '../cube'


function resizeCanvas(canvas: HTMLCanvasElement): boolean {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth ||
        canvas.height != displayHeight) {

        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        return true;
    }
    else {
        return false;
    }
}


export class Scene {

    camera: Camera;
    model: VAO;
    shader: Shader;
    texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {

        // setup scene
        this.camera = new Camera();
        this.camera.setScreenSize(gl.canvas.clientWidth, gl.canvas.clientHeight);

        this.shader = initShaderProgram(gl, vsSource, fsSource);

        const locationMap: { [semantics: number]: number } = {};
        {
            const location = gl.getAttribLocation(this.shader.program, "aVertexPosition");
            if (location >= 0) locationMap[interfaces.Semantics.POSITION] = location;
        }
        {
            const location = gl.getAttribLocation(this.shader.program, "aColorPosition");
            if (location >= 0) locationMap[interfaces.Semantics.COLOR] = location;
        }
        {
            const location = gl.getAttribLocation(this.shader.program, 'aTextureCoord');
            if (location >= 0) locationMap[interfaces.Semantics.UV] = location;
        }

        this.model = new VAO(gl);
        this.model.setData(gl, cube.model, locationMap);

        //this.texture = loadTexture(gl, 'cubetexture.png');
        this.texture = loadTexture(gl, 'https://mdn.github.io/webgl-examples/tutorial/sample6/cubetexture.png');
    }

    loadGltf(gl: WebGL2RenderingContext, model: interfaces.Model) {
        const locationMap: { [semantics: number]: number } = {};
        {
            const location = gl.getAttribLocation(this.shader.program, "aVertexPosition");
            if (location >= 0) locationMap[interfaces.Semantics.POSITION] = location;
        }
        {
            const location = gl.getAttribLocation(this.shader.program, "aColorPosition");
            if (location >= 0) locationMap[interfaces.Semantics.COLOR] = location;
        }
        {
            const location = gl.getAttribLocation(this.shader.program, 'aTextureCoord');
            if (location >= 0) locationMap[interfaces.Semantics.UV] = location;
        }

        //this.model.release();
        this.model = new VAO(gl);
        this.model.setData(gl, model, locationMap);
    }

    resize(w: number, h: number) {
        this.camera.setScreenSize(w, h);
    }

    update(deltaTime: number) {
        //this.model.update(deltaTime);
    }

    draw(gl: WebGL2RenderingContext) {
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        // clear
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (resizeCanvas(gl.canvas)) {
            this.camera.setScreenSize(gl.canvas.width, gl.canvas.height);
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // setup pipeline
        this.shader.use(gl);

        gl.uniformMatrix4fv(
            this.shader.projectionMatrix,
            false,
            this.camera.projectionMatrix
        );

        gl.uniformMatrix4fv(
            this.shader.modelViewMatrix,
            false,
            this.camera.viewMatrix
        );

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(this.shader.uSampler, 0);

        this.model.draw(gl);
    }
}
