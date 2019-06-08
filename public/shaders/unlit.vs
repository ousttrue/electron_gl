attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying highp vec2 vTextureCoord;
//attribute vec4 aColorPosition;
// varying lowp vec4 vColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  // vColor = aColorPosition;
  vTextureCoord = aTextureCoord;
}
