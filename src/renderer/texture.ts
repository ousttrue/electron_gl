function isPowerOf2(value: number): boolean {
    return (value & (value - 1)) == 0;
}


function loadImageAsync(url: string): Promise<HTMLImageElement> {
    const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = function () {
            resolve(image);
        };
        image.crossOrigin = "anonymous";
        image.src = url;
    });
    return <Promise<HTMLImageElement>>promise;
}


export class Texture {
    texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, color?: Uint8Array) {
        this.texture = gl.createTexture()!;

        // Because images have to be download over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        if(!color){
            color = new Uint8Array([0, 0, 255, 255]);
        }
        this.setPixels(gl, color);
    }

    setPixels(gl: WebGL2RenderingContext, image: Uint8Array | HTMLImageElement) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        if (image instanceof Uint8Array) {
            const border = 0;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                1, 1, border, srcFormat, srcType,
                image);
        }
        else if (image instanceof HTMLImageElement) {
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);
        }
        else {
            throw new Error(`unknown image: ${image}`);
        }
    }

    release(gl: WebGL2RenderingContext) {
        gl.deleteTexture(this.texture);
    }

    async loadImageAsync(gl: WebGL2RenderingContext, url: string) {

        const image = await loadImageAsync(url);
        this.setPixels(gl, image);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
}
