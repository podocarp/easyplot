import { useContext, useEffect } from "react";
import { createProgram } from "../lib/gl";
import { setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { drawMarker } from "@/lib/curve2d/tooltip";
import { toExponential } from "@/lib/math/general";

const gridVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }
`;
const gridFragmentShader = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform float u_scale;
  uniform float u_major_divisions;
  uniform float u_minor_divisions;

  void main() {
      // actually the thickness value divided by 2
      float thickness = 1.0;

      vec2 worldCoords = gl_FragCoord.xy - u_resolution / 2.0;
      vec2 pos = worldCoords - (u_translation * u_scale);

      if ((-thickness <= pos.x && pos.x <= thickness)
        || (-thickness <= pos.y && pos.y <= thickness)) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8);
            return;
      }

      float pixelsPerUnit = u_resolution.y * u_scale / 2.0;
      vec2 grid = mod(pos, pixelsPerUnit * u_major_divisions);
      if ((-thickness <= grid.x && grid.x <= thickness)
        || (-thickness <= grid.y && grid.y <= thickness)) {
            gl_FragColor = vec4(0.5, 0.5, 0.5, 0.8);
            return;
      }
      grid = mod(pos, pixelsPerUnit * u_minor_divisions);
      if ((-thickness <= grid.x && grid.x <= thickness)
        || (-thickness <= grid.y && grid.y <= thickness)) {
            gl_FragColor = vec4(0.5, 0.5, 0.5, 0.1);
            return;
      }
      discard;
  }
`;

// configuration in the format of
// number of ticks, major division width, minor division width
const divisions = [
  [1, 0.2, 0.05],
  [2, 0.5, 0.1],
  [5, 1, 0.2],
  [10, 2, 0.5],
];

function calcDivisions(visibleTicks: number) {
  const { mantissa, exponent } = toExponential(visibleTicks, 10);
  const mul = 10 ** exponent;

  const i = divisions.findIndex((elem) => elem[0] > mantissa);
  const elem = divisions[i - 1];
  return [elem[1] * mul, elem[2] * mul, exponent];
}

function closest(n: number, d: number) {
  return Math.trunc(n / d) * d;
}

function trunc(n: number, digits: number) {
  const base = 10 ** digits;
  return Math.round(n * base) / base;
}

export function Curve2DGrid() {
  const ctx = useContext(Curve2DContext);

  const drawTicks = (state: Curve2DState, division: number, prec: number) => {
    const { xmin, xmax, ymin, ymax } = state.canvasRange;
    for (let i = closest(xmin, division); i <= Math.ceil(xmax); i += division) {
      const [x, y] = gridUnitsToScreenSpace(state, i, 0);
      drawMarker(state, trunc(i, prec).toString(10), x, y + 12);
    }
    for (let i = closest(ymin, division); i <= Math.ceil(ymax); i += division) {
      const [x, y] = gridUnitsToScreenSpace(state, 0, i);
      if (-10e-6 <= i && i <= 10e-6) {
        // only need one mark on the origin
        continue;
      }
      drawMarker(state, trunc(i, prec).toString(10), x - 10, y);
    }
  };

  const render = (program: WebGLProgram, state: Curve2DState) => {
    const { gl, scale } = state;
    gl.useProgram(program);
    setUniforms(program, state);

    const [maj, min, base] = calcDivisions(2 / scale);
    const majDivLocation = gl.getUniformLocation(program, "u_major_divisions");
    gl.uniform1f(majDivLocation, maj);
    const minDivLocation = gl.getUniformLocation(program, "u_minor_divisions");
    gl.uniform1f(minDivLocation, min);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      // prettier-ignore
      new Float32Array([
        -1, -1,  // Bottom-left
        1, -1,  // Bottom-right
        1, 1,  // Top-right
        -1, -1,  // Bottom-left
        1, 1,  // Top-right
        -1, 1,  // Top-left
      ]),
      gl.STATIC_DRAW
    );
    const positionAttribute = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    drawTicks(state, maj, Math.abs(base) + 1);
  };

  const factory = (state: Curve2DState) => {
    const program = createProgram(
      state.gl,
      gridVertexShader,
      gridFragmentShader
    );
    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender("grid", -100, factory);
  });

  return <></>;
}
