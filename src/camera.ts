import { mat4 } from 'gl-matrix'


export class Camera {
    projectionMatrix: mat4;
    aspect = 1;
    fovY = (45 * Math.PI) / 180; // in radians
    zNear = 0.1;
    zFar = 100.0;

    constructor() {
        this.projectionMatrix = mat4.create();
    }

    setScreenSize(w: number, h: number)
    {
        this.aspect = w/h;
        this.update();
    }

    update()
    {
        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(this.projectionMatrix, this.fovY, this.aspect, this.zNear, this.zFar);
    }
}
