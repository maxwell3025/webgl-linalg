import { Matrix } from "../..";

const N = 4;
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
    const outRow: number[] = [];
    for (let colNum = 0; colNum < b[0].length; colNum++) {
      outRow.push(
        leftRow.reduce((sum, aEntry, aCol) => sum + aEntry * b[aCol][colNum], 0)
      );
    }
    return outRow;
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
    matrixA.show();
  },
  () => {
    label.innerText = "B";
    matrixB.show();
  },
  () => {
    label.innerText = "C";

    const before = new Date().getTime();
    let matrixC = matrixA.copy();
    matrixC = matrixC.mul(matrixB);
    const after = new Date().getTime();
    console.log(after - before);

    const before2 = new Date().getTime();
    let matrixCList = matrixAList.map((row) => row.map((elem) => elem));
    matrixCList = matMulList(matrixCList, matrixBList);
    const after2 = new Date().getTime();
    console.log(after2 - before2);

    matrixC.show();
  },
];

let index = 0;
setInterval(() => {
  index = (index + 1) % loopArray.length;
  loopArray[index]();
}, 2000);
