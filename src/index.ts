import {
  canvasHeight,
  canvasWidth,
  copyTexture,
  debugChannel,
  fillMesh,
  gl,
  matMul,
  renderTexture,
} from "./init.js";

function bindDefaultTarget() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export class Matrix {
  context: WebGL2RenderingContext;
  buffer: WebGLFramebuffer;
  texture: WebGLTexture;
  colCount: number;
  rowCount: number;
  /**
   * @param colCount number of columns
   * @param rowCount number of rows
   * @param floatData matrix data in row-major order. Filled with random values in [-1, 1) if undefined.
   */
  constructor(colCount: number, rowCount: number, floatData?: Float32Array) {
    this.colCount = colCount;
    this.rowCount = rowCount;
    const data = new Uint8Array(
      (
        floatData ??
        new Float32Array(colCount * rowCount).map(() => Math.random() * 2 - 1)
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
    if (data.length != colCount * rowCount * 4) {
      console.error("IMPROPERLY SIZED DATA");
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8UI,
      colCount,
      rowCount,
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
  public bind(index: number, program: WebGLProgram) {
    const bindingUniformLocation = gl.getUniformLocation(
      program,
      `tex${index}`
    )
    const widthUniformLocation = gl.getUniformLocation(
      program,
      `width${index}`
    );
    const heightUniformLocation = gl.getUniformLocation(
      program,
      `height${index}`
    );
    gl.uniform1f(widthUniformLocation, this.colCount);
    gl.uniform1f(heightUniformLocation, this.rowCount);
    gl.uniform1i(bindingUniformLocation, index);
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }
  /**
   * displays floating point values to canvas
   */
  public displayChannel(channel: number) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    const aVertexPosition = gl.getAttribLocation(
      debugChannel[channel],
      "aVertexPosition"
    );
    gl.useProgram(debugChannel[channel]);
    const widthUniformLocation = gl.getUniformLocation(debugChannel[channel], "width");
    const heightUniformLocation = gl.getUniformLocation(debugChannel[channel], "height");
    gl.uniform1f(widthUniformLocation, canvasWidth);
    gl.uniform1f(heightUniformLocation, canvasHeight);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0, debugChannel[channel]);
    bindDefaultTarget();

    console.log("debug rendering");
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
    this.bind(0, renderTexture);
    bindDefaultTarget();

    console.log("debug rendering");
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  /**
   * Copies data into target matrix
   */
  public copy(): Matrix {
    const result = new Matrix(this.colCount, this.rowCount)
    result.bindTarget();
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    const aVertexPosition = gl.getAttribLocation(
      renderTexture,
      "aVertexPosition"
    );
    gl.useProgram(copyTexture);
    const widthUniformLocation = gl.getUniformLocation(copyTexture, "width");
    const heightUniformLocation = gl.getUniformLocation(copyTexture, "height");
    gl.uniform1f(widthUniformLocation, result.colCount);
    gl.uniform1f(heightUniformLocation, result.rowCount);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0, renderTexture);

    console.log("copying");
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return result;
  }
  public mul(rhs: Matrix): Matrix{
    if (this.colCount != rhs.rowCount){
      console.error("Incompatible Dimensions!");
    }
    const result = new Matrix(rhs.colCount, this.rowCount)
    result.bindTarget()

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    const aVertexPosition = gl.getAttribLocation(
      matMul,
      "aVertexPosition"
    );
    gl.useProgram(matMul);
    const widthUniformLocation = gl.getUniformLocation(matMul, "width");
    const heightUniformLocation = gl.getUniformLocation(matMul, "height");
    gl.uniform1f(widthUniformLocation, result.colCount);
    gl.uniform1f(heightUniformLocation, result.rowCount);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);


    this.bind(0, matMul);
    rhs.bind(1, matMul);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return result;
  }
}

// --------------------- TESTS -----------------------

const matrixA = new Matrix(3, 4, new Float32Array([
  0, 1, 0,
  1, 0, 0,
  0, 0, 1,
  0, 0, 0
]));

const matrixB = new Matrix(4, 3, new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
]));

const matrixC = matrixA.mul(matrixB);

// ----------------- Display -------------------

const label = document.createElement("div")
document.body.appendChild(label);
const loopArray = [
  () => {
    label.innerText = 'A';
    matrixA.display();
  },
  () => {
    label.innerText = 'B';
    matrixB.display();
  },
  () => {
    label.innerText = 'C';
    matrixC.display();
  },
  // () => {
  //   label.innerText = 'C0';
  //   matrixC.displayChannel(0);
  // },
  // () => {
  //   label.innerText = 'C1';
  //   matrixC.displayChannel(1);
  // },
  // () => {
  //   label.innerText = 'C2';
  //   matrixC.displayChannel(2);
  // },
  // () => {
  //   label.innerText = 'C3';
  //   matrixC.displayChannel(3);
  // },
];
let index = 0;
setInterval(() => {
  index = (index + 1) % loopArray.length;
  loopArray[index]();
}, 1000);
