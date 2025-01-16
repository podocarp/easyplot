function compileShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
) {
  const shader = gl.createShader(type);
  if (shader === null) {
    console.error("could not create shader", source);
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: string,
  fragmentShader: string
) {
  const v = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  if (v === null) {
    throw Error("Cannot compile vertex shader.");
  }
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (f === null) {
    throw Error("Cannot compile fragment shader.");
  }

  const program = gl.createProgram();
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw Error(`Cannot link program: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}
