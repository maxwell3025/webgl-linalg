import { Matrix, matMulCanvas } from "../..";

matMulCanvas.setAttribute("width", "512")
matMulCanvas.setAttribute("height", "512")
// document.body.appendChild(matMulCanvas);

const startTime = new Date().getTime();
function debugMsg(msg: string) {
  console.debug(`[${(new Date().getTime() - startTime)}]\t${msg}`)
}
const N = 1024;
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
function genRandomMatrix() {
  return new Array(N).fill(0).map(() => new Array(N).fill(0).map(() => Math.random() * 2 - 1))
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
    const outRow: number[] = [];
    for (let colNum = 0; colNum < b[0].length; colNum++) {
      outRow.push(
        leftRow.reduce((sum, aEntry, aCol) => sum + aEntry * b[aCol][colNum], 0)
      );
    }
    return outRow;
  });
}

debugMsg('Generating random matrices')
const matrixAList = genRandomMatrix();
const matrixBList = genRandomMatrix();
debugMsg('Uploading to GPU')
const matrixA = new Matrix(N, N, new Float32Array(matrixAList.flat()));
const matrixB = new Matrix(N, N, new Float32Array(matrixBList.flat()));

// ----------------- Display -------------------

document.body.appendChild(document.createElement("div")).innerText = `N = ${N}`
const loopArray = [
  () => {
    const before = new Date().getTime();
    let matrixC = matrixA.copy();
    for (let i = 0; i < 16; i++) {
      matrixC = matrixC.mul(matrixB);
    }
    matrixC.readData();
    const after = new Date().getTime();
    debugMsg(`GPU: ${after - before} ms`);
  },
];

debugMsg("Displaying results")
loopArray[0]();
let index = 0;
setInterval(() => {
  index = (index + 1) % loopArray.length;
  loopArray[index]();
}, 5000);
