export const canvas = document.createElement("canvas");
canvas.setAttribute("width", `0`);
canvas.setAttribute("height", `0`);

export const gl = canvas.getContext("webgl2");
if (gl === null) {
  console.error("Could not get a WebGL2 Context!");
}

export const floatExtension = gl.getExtension("EXT_color_buffer_float");
if (floatExtension === null) {
  console.error("Extension EXT_color_buffer_float not supported");
}

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

function loadShader(type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function loadProgram(vsSource: string, fsSource: string) {
  const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

const vertexPassthrough = `#version 300 es
precision highp float;
layout (location=0) in vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 1.0, 1.0);
}
`;

export const showProgram = loadProgram(
  vertexPassthrough,
  `#version 300 es
precision highp float;
uniform sampler2D tex0;
uniform float width;
uniform float height;
out vec4 fragColor;

void main() {
  vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
  float value = texture(tex0, texelCoords).x;
  if(value > 0.0){
    fragColor = vec4(value, 0.0, 0.0, 1.0);
  } else {
    fragColor = vec4(0.0, -value, -value, 1.0);
  }
}
`
);

export const copyProgram = loadProgram(
  vertexPassthrough,
  `#version 300 es
precision highp float;
uniform sampler2D tex0;
uniform float width0;
uniform float height0;
uniform float width;
uniform float height;
out float fragColor;

void main() {
  vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
  fragColor = texture(tex0, texelCoords).x;
}
`
);

export const matMulProgram = loadProgram(
  vertexPassthrough,
  `#version 300 es
precision highp float;
uniform sampler2D tex0;
uniform sampler2D tex1;
uniform float width0;
uniform float height0;
uniform float width1;
uniform float height1;
uniform float width;
uniform float height;
out float fragColor;

void main() {
  int col = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y);
  float sum = 0.0;
  int i = 0;
  while(i < int(width1)){
    float lhsValue = texture(tex0, vec2(
      (float(i)) / width0, //col
      (float(row)) / height0 //row
    )).x;
    float rhsValue = texture(tex1, vec2(
      (float(col)) / width1, //row
      (float(i)) / height1 //row
    )).x;
    sum = sum + lhsValue * rhsValue;
    i++;
  }
  fragColor = sum;
}
`
);

const fillMesh = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

export function executeProgram(program: WebGLProgram) {
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
  gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.useProgram(null);
}
