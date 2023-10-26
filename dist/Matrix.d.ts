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
    constructor(colCount: number, rowCount: number, floatData?: Float32Array);
    private static unbindOut;
    bindOut(program: WebGLProgram): void;
    bindIn(index: number, program: WebGLProgram): void;
    /**
     * displays floating point values to canvas
     */
    showRaw(channel: number): void;
    /**
     * Displays floating point values to canvas
     */
    show(): void;
    /**
     * Copies data into target matrix
     */
    copy(): Matrix;
    /**
     * Returns the matrix product with the given Matrix
     */
    mul(rhs: Matrix): Matrix;
}
