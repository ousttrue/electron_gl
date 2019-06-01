import { mat4, vec3 } from 'gl-matrix'


export class Camera {

    screenWidth = 500;
    screenHeight = 500;

    // projection
    projectionMatrix: mat4;
    aspect = 1;
    fovY = (45 * Math.PI) / 180; // in radians
    zNear = 0.1;
    zFar = 100.0;

    // view
    viewMatrix: mat4;
    yaw = 0;
    pitch = 0;
    distance = -10;
    shiftX = 0;
    shiftY = 0;

    constructor() {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.updateView();
    }

    setScreenSize(w: number, h: number) {
        this.screenWidth = w;
        this.screenHeight = h;
        this.aspect = w / h;
        this.updateProjection();
    }

    dolly(d: number) {
        if (d > 0) {
            this.distance *= 1.1;
        }
        else if (d < 0) {
            this.distance *= 0.9;
        }
        this.updateView();
    }

    yawPitch(yaw: number, pitch: number) {
        this.yaw += (yaw / this.screenHeight) * 3.14;
        this.pitch += (pitch / this.screenHeight) * 3.14;
        this.updateView();
    }

    shift(dx: number, dy: number) {
        this.shiftX += dx / this.screenHeight * this.distance * this.fovY;
        this.shiftY += dy / this.screenHeight * this.distance * this.fovY;
        this.updateView();
    }

    updateView() {
        mat4.identity(this.viewMatrix);

        const translation = vec3.fromValues(this.shiftX, this.shiftY, this.distance);
        mat4.translate(this.viewMatrix, this.viewMatrix, translation);

        mat4.rotateX(this.viewMatrix, this.viewMatrix, this.pitch);
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.yaw);
    }

    updateProjection() {
        mat4.perspective(this.projectionMatrix, this.fovY, this.aspect, this.zNear, this.zFar);
    }
}
