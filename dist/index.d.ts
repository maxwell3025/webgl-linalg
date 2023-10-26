export declare class Matrix {
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
    constructor(colCount: number, rowCount: number, floatData?: Float32Array);
    bindOut(program: WebGLProgram): void;
    bindIn(index: number, program: WebGLProgram): void;
    /**
     * displays floating point values to canvas
     */
    displayChannel(channel: number): void;
    /**
     * displays floating point values to canvas
     */
    display(): void;
    /**
     * Copies data into target matrix
     */
    copy(): Matrix;
    /**
     *
     */
    mul(rhs: Matrix): Matrix;
}
