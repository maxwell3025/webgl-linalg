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
  constructor(
    colCount: number,
    rowCount: number,
    floatData?: Float32Array | number
  ) {
    this.colCount = colCount;
    this.rowCount = rowCount;
    const data = new Uint8Array(
      (typeof floatData === "object"
        ? floatData
        : new Float32Array(colCount * rowCount).map(
            () => floatData ?? Math.random() * 2 - 1
          )
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
    );
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
    const widthUniformLocation = gl.getUniformLocation(
      debugChannel[channel],
      "width"
    );
    const heightUniformLocation = gl.getUniformLocation(
      debugChannel[channel],
      "height"
    );
    gl.uniform1f(widthUniformLocation, canvasWidth);
    gl.uniform1f(heightUniformLocation, canvasHeight);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0, debugChannel[channel]);
    bindDefaultTarget();

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

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  /**
   * Copies data into target matrix
   */
  public copy(): Matrix {
    const result = new Matrix(this.colCount, this.rowCount);
    result.bindTarget();
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    gl.useProgram(copyTexture);
    const aVertexPosition = gl.getAttribLocation(
      copyTexture,
      "aVertexPosition"
    );
    const widthUniformLocation = gl.getUniformLocation(copyTexture, "width");
    const heightUniformLocation = gl.getUniformLocation(copyTexture, "height");
    gl.uniform1f(widthUniformLocation, result.colCount);
    gl.uniform1f(heightUniformLocation, result.rowCount);
    gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);
    this.bind(0, copyTexture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return result;
  }
  public mul(rhs: Matrix): Matrix {
    if (this.colCount != rhs.rowCount) {
      console.error("Incompatible Dimensions!");
    }
    const result = new Matrix(rhs.colCount, this.rowCount);
    result.bindTarget();

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillMesh, gl.STATIC_DRAW, 0);

    gl.useProgram(matMul);
    const aVertexPosition = gl.getAttribLocation(matMul, "aVertexPosition");
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
const N = 256;
//from https://stackoverflow.com/questions/12556685/is-there-a-javascript-implementation-of-the-inverse-error-function-akin-to-matl
function erfinv(x: number) {
  var z;
  var a = 0.147;
  var the_sign_of_x;
  if (0 == x) {
    the_sign_of_x = 0;
  } else if (x > 0) {
    the_sign_of_x = 1;
  } else {
    the_sign_of_x = -1;
  }

  if (0 != x) {
    var ln_1minus_x_sqrd = Math.log(1 - x * x);
    var ln_1minusxx_by_a = ln_1minus_x_sqrd / a;
    var ln_1minusxx_by_2 = ln_1minus_x_sqrd / 2;
    var ln_etc_by2_plus2 = ln_1minusxx_by_2 + 2 / (Math.PI * a);
    var first_sqrt = Math.sqrt(
      ln_etc_by2_plus2 * ln_etc_by2_plus2 - ln_1minusxx_by_a
    );
    var second_sqrt = Math.sqrt(first_sqrt - ln_etc_by2_plus2);
    z = second_sqrt * the_sign_of_x;
  } else {
    z = 0;
  }
  return z;
}
function genRandomOrthogonal() {
  function genRandomVector() {
    return new Array(N).fill(0).map(() => erfinv(Math.random() * 2 - 1));
    // return new Array(N).map(() => Math.random() * 2 - 1);
  }
  function dot(vec1: number[], vec2: number[]) {
    return vec1.reduce((sum, value, index) => sum + value * vec2[index], 0);
  }
  function normalize(vec: number[]) {
    const mag = 1.0 / Math.sqrt(dot(vec, vec));
    return vec.map((x) => x * mag);
  }
  const output: number[][] = [];
  for (let i = 0; i < N; i++) {
    let newRow = normalize(genRandomVector());
    output.forEach((oldRow) => {
      const similarity = dot(newRow, oldRow);
      const error = oldRow.map((x) => x * similarity);
      newRow = newRow.map((value, index) => value - error[index]);
      newRow = normalize(newRow);
    });
    output.push(newRow);
  }
  return output;
}

function matMulList(a: number[][], b: number[][]) {
  return a.map((leftRow) => {
    const outRow = [];
    for (let colNum = 0; colNum < b[0].length; colNum++) {
      outRow.push(
        leftRow.reduce((sum, aEntry, aCol) => sum + aEntry * b[aCol][colNum], 0)
      );
    }
    return outRow
  });
}

const matrixAList = genRandomOrthogonal();
const matrixBList = genRandomOrthogonal();
const matrixA = new Matrix(N, N, new Float32Array(matrixAList.flat()));
const matrixB = new Matrix(N, N, new Float32Array(matrixBList.flat()));

// ----------------- Display -------------------

const label = document.createElement("div");
document.body.appendChild(label);
const loopArray = [
  () => {
    label.innerText = "A";
    matrixA.display();
  },
  () => {
    label.innerText = "B";
    matrixB.display();
  },
  () => {
    label.innerText = "C";

    const before = new Date().getTime();
    let matrixC = matrixA.copy();
    matrixC = matrixC.mul(matrixB);
    const after = new Date().getTime();
    console.log(after - before);

    const before2 = new Date().getTime();
    let matrixCList = matrixAList.map(row => row.map(elem => elem));
    matrixCList = matMulList(matrixCList, matrixBList);
    const after2 = new Date().getTime();
    console.log(after2 - before2);

    matrixC.display();
  },
];
let index = 0;
setInterval(() => {
  index = (index + 1) % loopArray.length;
  loopArray[index]();
}, 2000);
