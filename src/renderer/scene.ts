import { Camera } from './camera'
import { Node, Mesh } from './node'
import { Shader } from './shader'
import * as interfaces from '../interfaces'


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
    node?: Node;

    constructor(gl: WebGL2RenderingContext) {
        // setup scene
        this.camera = new Camera();
        this.camera.setScreenSize(gl.canvas.clientWidth, gl.canvas.clientHeight);
    }

    loadGltf(gl: WebGL2RenderingContext, data: interfaces.LoadData, shader: Shader)
    {
        if(this.node){
            // clear
            this.node.release(gl);
        }
        this.node = Node.fromGltf(gl, data, shader);
    }

    resize(w: number, h: number) {
        this.camera.setScreenSize(w, h);
    }

    update(nowSeconds: number) {
        if(this.node){
            this.node.update(nowSeconds);
        }
    }

    draw(gl: WebGL2RenderingContext) {
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        if (resizeCanvas(gl.canvas)) {
            this.camera.setScreenSize(gl.canvas.width, gl.canvas.height);
        }
        
        this.camera.setup(gl);
        if(this.node){
            this.node.draw(gl, this.camera);
        }
    }
}
