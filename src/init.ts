export const canvasWidth = 512;
export const canvasHeight = 512;
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

export const renderTexture = loadProgram(
  `#version 300 es
precision highp float;
layout (location=0) in vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 1.0, 1.0);
}
`,
  `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex;
uniform float width;
uniform float height;
out vec4 fragColor;

float toFloat(uvec4 data){
  uint fullValue =
  (data.x) +
  (data.y << 8) +
  (data.z << 16) +
  (data.w << 24);
  float value = uintBitsToFloat(fullValue & 0x7fffffffu);
  if((fullValue & 0x80000000u) != 0u) value = -value;
  return value;
}

void main() {
    vec2 texelCoords = gl_FragCoord.xy / vec2(width, height);
    uvec4 rawdata = texture(tex, texelCoords);
    float value = toFloat(rawdata);
    // do whatever you want 
    if(value > 0.0){
        fragColor = vec4(value, 0.0, 0.0, 1.0);
    } else {
        fragColor = vec4(0.0, -value, -value, 1.0);
    }
}
`
);

export const copyTexture = loadProgram(
  `#version 300 es
precision highp float;
layout (location=0) in vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 1.0, 1.0);
}
`,
  `#version 300 es
precision highp float;
precision lowp usampler2D;
uniform usampler2D tex;
uniform float width0;
uniform float height0;
uniform float width;
uniform float height;
out uvec4 fragColor;
void main() {
    fragColor = texture(tex, gl_FragCoord.xy / vec2(width, height));
}
`
);
export const fillMesh = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
