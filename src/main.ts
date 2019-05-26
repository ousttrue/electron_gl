function main() {
  const canvas = <HTMLCanvasElement>document.querySelector("#glCanvas");
  if (canvas === null) {
    console.log("no canvas");
    return;
  }
  console.log(canvas);

  // Initialize the GL context
  const gl = canvas.getContext("webgl");
  console.log(gl);

  // Only continue if WebGL is available and working
  if (gl === null) {
    console.error(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();
