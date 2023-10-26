import {
    canvasHeight,
    canvasWidth,
    copyProgram,
    showChannelProgram,
    gl,
    executeProgram,
    matMulProgram,
    showProgram,
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
        const data = floatData
            ? new Uint8Array(floatData.buffer)
            : new Uint8Array(colCount * rowCount * 4).fill(0);
        if (data.constructor !== Uint8Array) {
            console.error("IMPROPER DATA TYPE");
        }
        if (data.length != colCount * rowCount * 4) {
            console.error("IMPROPERLY SIZED DATA");
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
            gl.RGBA8UI,
            colCount,
            rowCount,
            0,
            gl.RGBA_INTEGER,
            gl.UNSIGNED_BYTE,
            data
        );
    }

    private static unbindOut(program: WebGLProgram) {
        gl.useProgram(program);
        const widthUniformLocation = gl.getUniformLocation(program, "width");
        const heightUniformLocation = gl.getUniformLocation(program, "height");
        gl.uniform1f(widthUniformLocation, canvasWidth);
        gl.uniform1f(heightUniformLocation, canvasHeight);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
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

    /**
     * displays floating point values to canvas
     */
    public showRaw(channel: number) {
        this.bindIn(0, showChannelProgram[channel]);
        Matrix.unbindOut(showChannelProgram[channel]);
        gl.useProgram(null);

        executeProgram(showChannelProgram[channel]);
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