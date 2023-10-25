const hello = new Float32Array([-1.0, -0.5, 0.0, 0.5, 1.0])
const out = new Uint8Array(hello.buffer)
console.log([...out].map(x => `0x${x.toString(16)}u`))