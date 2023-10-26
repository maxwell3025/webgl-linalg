export const canvasWidth = 256;
export const canvasHeight = 256;
const canvas = document.createElement("canvas");
canvas.setAttribute("width", `${canvasWidth}`);
canvas.setAttribute("height", `${canvasHeight}`);
document.querySelector("body").appendChild(canvas);
export const gl = canvas.getContext("webgl2");
if (gl === null) {
    console.error("Could not get a WebGL2 Context!");
}
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function loadProgram(vsSource, fsSource) {
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
const encodeDecode = `
float decodeFloat(uvec4 data){
  uint fullValue =
  (data.x) +
  (data.y << 8) +
  (data.z << 16) +
  (data.w << 24);
  float value = intBitsToFloat(int(fullValue));
  return value;
}

uvec4 encodeFloat(float value){
  uint fullValue = uint(floatBitsToInt(value));
  return uvec4(
    fullValue >> 0 & 0xffu,
    fullValue >> 8 & 0xffu,
    fullValue >> 16 & 0xffu,
    fullValue >> 24 & 0xffu
  );
}

`;
export const renderTexture = loadProgram(vertexPassthrough, `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex0;
uniform float width;
uniform float height;
out vec4 fragColor;

${encodeDecode}

void main() {
  vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
  texelCoords.y = 1.0 - texelCoords.y;
  uvec4 rawdata = texture(tex0, texelCoords);
  float value = decodeFloat(rawdata);
  if(value > 0.0){
    fragColor = vec4(value, 0.0, 0.0, 1.0);
  } else {
    fragColor = vec4(0.0, -value, -value, 1.0);
  }
}
`);
export const debugChannel = [0, 1, 2, 3].map(channel => loadProgram(vertexPassthrough, `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex0;
uniform float width;
uniform float height;
out vec4 fragColor;

${encodeDecode}

void main() {
  vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
  texelCoords.y = 1.0 - texelCoords.y;
  float channelValue = float(texture(tex0, texelCoords).${['x', 'y', 'z', 'w'][channel]}) / 255.0;
  fragColor = vec4(channelValue, channelValue, channelValue, 1.0);
}
`));
export const copyTexture = loadProgram(vertexPassthrough, `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex0;
uniform float width0;
uniform float height0;
uniform float width;
uniform float height;
out uvec4 fragColor;

${encodeDecode}

void main() {
  vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
  fragColor = texture(tex0, texelCoords);
}
`);
export const matMul = loadProgram(vertexPassthrough, `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex0;
uniform usampler2D tex1;
uniform float width0;
uniform float height0;
uniform float width1;
uniform float height1;
uniform float width;
uniform float height;
out uvec4 fragColor;

${encodeDecode}

void main() {
  int col = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y);
  float sum = 0.0;
  int i = 0;
  while(i < int(width1)){
    float lhsValue = decodeFloat(
      texture(tex0, vec2(
        (float(i)) / width0, //col
        (float(row)) / height0 //row
      ))
    );
    float rhsValue = decodeFloat(
      texture(tex1, vec2(
        (float(col)) / width1, //row
        (float(i)) / height1 //row
      ))
    );
    sum = sum + lhsValue * rhsValue;
    i++;
  }
  fragColor = encodeFloat(sum);
}
`);
const fillMesh = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);
export function executeProgram(program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.useProgram(null);
}
//# sourceMappingURL=init.js.map