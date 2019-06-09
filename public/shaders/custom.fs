varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  //gl_FragColor = vColor;
  //gl_FragColor = texture2D(uSampler, vTextureCoord);
  gl_FragColor = vec4(1, 0, 0, 1);
}
