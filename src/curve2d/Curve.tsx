import { useContext, useEffect } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";

const curveVertexShader = `
    attribute vec2 a_position;
    uniform vec2 u_translation;
    uniform vec2 u_resolution;
    uniform float u_scale;

    void main() {
      vec2 worldCoords = a_position * u_resolution / 2.0;
      vec2 actualCoords = worldCoords + u_translation;
      actualCoords *= u_scale;
      vec2 pos = actualCoords / (u_resolution / 2.0);

      gl_Position = vec4(pos, 0, 1);
    }
`;

const curveFragmentShader = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
`;

export function Curve2DCurve() {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const { gl } = state;
    gl.useProgram(program);
    _setUniforms(program, state);

    const points = [];
    for (let x = -1; x <= 1; x += 0.01) {
      const y = Math.sin(2 * Math.PI * x);
      points.push(x, y);
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  };

  const factory = (state: Curve2DState) => {
    const program = createProgram(
      state.gl,
      curveVertexShader,
      curveFragmentShader
    );
    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender("curve", factory);
  });

  return <></>;
}
