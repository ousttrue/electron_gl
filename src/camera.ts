import { mat4 } from 'gl-matrix'


export class Camera {
    projectionMatrix: mat4;

    constructor(w: number, h: number) {
        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = w / h;
        const zNear = 0.1;
        const zFar = 100.0;
        this.projectionMatrix = mat4.create();
        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
    }
}
