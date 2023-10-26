export declare const canvasWidth = 256;
export declare const canvasHeight = 256;
export declare const gl: WebGL2RenderingContext;
export declare const renderTexture: WebGLProgram;
export declare const debugChannel: WebGLProgram[];
export declare const copyTexture: WebGLProgram;
export declare const matMul: WebGLProgram;
export declare function executeProgram(program: WebGLProgram): void;
