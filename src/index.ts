import {
  canvasHeight,
  canvasWidth,
  fillMesh,
  gl,
  renderTexture,
} from "./init.js";

function bindDefaultTarget() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export class Matrix {
  context: WebGL2RenderingContext;
  buffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
  constructor(width: number, height: number, floatData?: Float32Array) {
    this.width = width;
    this.height = height;
    const data = new Uint8Array(
      (
        floatData ??
        new Float32Array(width * height).map(() => Math.random() * 2 - 1)
      ).buffer
    );
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (data.constructor !== Uint8Array) {
      console.error("IMPROPER DATA TYPE");
    }
    if (data.length != width * height * 4) {
      console.error("IMPROPERLY SIZED DATA");
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8UI,
      width,
      height,
      0,
      gl.RGBA_INTEGER,
      gl.UNSIGNED_BYTE,
      data
    );
    this.buffer = gl.createFramebuffer();
  }

  public bindTarget() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
  }
  public bind(index: number) {
    const widthUniformLocation = gl.getUniformLocation(
      renderTexture,
      `width${index}`
    );
    const heightUniformLocation = gl.getUniformLocation(
      renderTexture,
      `height${index}`
    );
    gl.uniform1f(widthUniformLocation, this.width);
    gl.uniform1f(heightUniformLocation, this.height);
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }
  /**
   * displays floating point values to canvas
   */
  public display() {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    const aVertexPosition = gl.getAttribLocation(
      renderTexture,
      "aVertexPosition"
    );
    gl.useProgram(renderTexture);
    const widthUniformLocation = gl.getUniformLocation(renderTexture, "width");
    const heightUniformLocation = gl.getUniformLocation(
      renderTexture,
      "height"
    );
    gl.uniform1f(widthUniformLocation, canvasWidth);
    gl.uniform1f(heightUniformLocation, canvasHeight);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0);
    bindDefaultTarget();

    console.log("debug rendering");
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  /**
   * TODO
   */
  public executeCopy(target: Matrix) {
    target.bindTarget();
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    const aVertexPosition = gl.getAttribLocation(
      renderTexture,
      "aVertexPosition"
    );
    gl.useProgram(renderTexture);
    const widthUniformLocation = gl.getUniformLocation(renderTexture, "width");
    const heightUniformLocation = gl.getUniformLocation(
      renderTexture,
      "height"
    );
    gl.uniform1f(widthUniformLocation, target.width);
    gl.uniform1f(heightUniformLocation, target.height);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0);

    console.log("copying");
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

const matrixA = new Matrix(
  3,
  3,
  new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0])
);
const matrixB = new Matrix(
  4,
  4,
  new Float32Array([0, 0, -1, 1, 0, 0, 0, 0, 1, 0, -0.5, 0, 0, 0.5, 0, 0])
);
// matrixA.executeCopy(matrixB);
setTimeout(() => {
  matrixB.display();
}, 0);
setTimeout(() => {
  matrixA.display();
}, 1000);
setTimeout(() => {
  gl.clear(gl.COLOR_BUFFER_BIT);
}, 2000);
setInterval(() => {
  setTimeout(() => {
    matrixB.display();
  }, 0);
  setTimeout(() => {
    matrixA.display();
  }, 1000);
  setTimeout(() => {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }, 2000);
}, 3000);
