import {
    copyProgram,
    gl,
    executeProgram,
    matMulProgram,
    showProgram,
    canvas,
} from "./init";

export default class Matrix {
    context: WebGL2RenderingContext;
    buffer: WebGLFramebuffer;
    texture: WebGLTexture;
    colCount: number;
    rowCount: number;
    /**
     * @param colCount number of columns
     * @param rowCount number of rows
     * @param floatData matrix data in row-major order. Filled with 0 if undefined.
     */
    constructor(colCount: number, rowCount: number, floatData?: Float32Array) {
        //initialize
        this.colCount = colCount;
        this.rowCount = rowCount;
        this.texture = gl.createTexture();
        this.buffer = gl.createFramebuffer();

        //generate&format data
        const data = floatData ?? new Float32Array(this.colCount * this.rowCount).fill(0);
        if (data.constructor !== Float32Array) {
            console.error("IMPROPER DATA TYPE");
        }
        if (data.length != this.colCount * this.rowCount) {
            console.error(`IMPROPERLY SIZED DATA: ${data.length} != ${this.colCount * this.rowCount}`);
        }

        //upload data
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R32F,
            this.colCount,
            this.rowCount,
            0,
            gl.RED,
            gl.FLOAT,
            data
        );
    }

    private static unbindOut(program: WebGLProgram) {
        gl.useProgram(program);
        const widthUniformLocation = gl.getUniformLocation(program, "width");
        const heightUniformLocation = gl.getUniformLocation(program, "height");
        gl.uniform1f(widthUniformLocation, canvas.width);
        gl.uniform1f(heightUniformLocation, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
    }

    public bindOut(program: WebGLProgram) {
        gl.useProgram(program);
        gl.viewport(0, 0, this.colCount, this.rowCount);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.texture,
            0
        );
        const widthUniformLocation = gl.getUniformLocation(program, "width");
        const heightUniformLocation = gl.getUniformLocation(program, "height");
        gl.uniform1f(widthUniformLocation, this.colCount);
        gl.uniform1f(heightUniformLocation, this.rowCount);
        gl.useProgram(null);
    }

    public bindIn(index: number, program: WebGLProgram) {
        gl.useProgram(program);
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
        gl.useProgram(null);
    }

    public readData() {
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.texture,
            0
        );
        gl.readBuffer(gl.COLOR_ATTACHMENT0)
        const out = new Float32Array(this.colCount * this.rowCount)
        gl.readPixels(0, 0, this.colCount, this.rowCount, gl.RED, gl.FLOAT, out);
        return out;
    }

    /**
     * Displays floating point values to canvas
     */
    public show() {
        this.bindIn(0, showProgram);
        Matrix.unbindOut(showProgram);
        executeProgram(showProgram);
    }

    /**
     * Copies data into target matrix
     */
    public copy(): Matrix {
        const result = new Matrix(this.colCount, this.rowCount);
        result.bindOut(copyProgram);
        this.bindIn(0, copyProgram);

        executeProgram(copyProgram);
        return result;
    }

    /**
     * Returns the matrix product with the given Matrix
     */
    public mul(rhs: Matrix): Matrix {
        if (this.colCount != rhs.rowCount) {
            console.error("Incompatible dimensions for mul");
        }
        const result = new Matrix(rhs.colCount, this.rowCount);

        this.bindIn(0, matMulProgram);
        rhs.bindIn(1, matMulProgram);
        result.bindOut(matMulProgram);
        executeProgram(matMulProgram);

        return result;
    }
}