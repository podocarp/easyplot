import { useContext, useEffect } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";

const curveVertexShader = `
    attribute vec2 a_position;
    uniform vec2 u_translation;
    uniform vec2 u_resolution;
    uniform float u_scale;

    void main() {
      float pixelsPerUnit = u_resolution.y / 2.0 * u_scale;
      vec2 pixelCoords = a_position * pixelsPerUnit;
      vec2 actualCoords = pixelCoords + u_translation * u_scale;
      vec2 pos = actualCoords / u_resolution * 2.0;

      gl_Position = vec4(pos, 1, 1);
    }
`;

const curveFragmentShader = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
`;

const defaultColors = [
  [1, 0, 0, 1],
  [0, 1, 0, 1],
  [0, 0, 1, 1],
];

export function Curve2DCurve({
  fun,
  steps = 100,
  color,
  _id,
}: {
  /** The function to plot. */
  fun: (x: number) => number;
  /** The approximate number of points to plot.*/
  steps?: number;
  color?: [number, number, number, number];
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const key = `curve-${_id}`;

  let prevXmax = 0;
  let prevXmin = 0;
  let prevPoints: number[] = [];

  const calcPoints = (xmin: number, xmax: number) => {
    if (xmax === prevXmax && xmin === prevXmin) {
      return prevPoints;
    }

    const points = [];
    // approximate step size
    const stepSize = (xmax - xmin) / steps;
    for (let x = xmin; x <= xmax; x += stepSize) {
      const y = fun(x);
      points.push(x, y);
    }

    prevPoints = points;
    prevXmax = xmax;
    prevXmin = xmin;

    return points;
  };

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const { gl, _points } = state;

    gl.useProgram(program);
    _setUniforms(program, state);

    const { xmax, xmin } = state.canvasRange;

    const points = calcPoints(xmin, xmax);
    _points.set(key, points);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, steps);
  };

  const factory = (state: Curve2DState) => {
    const { gl } = state;
    const program = createProgram(gl, curveVertexShader, curveFragmentShader);
    gl.useProgram(program);
    const colorLocation = gl.getUniformLocation(program, "u_color");
    if (color) {
      gl.uniform4fv(colorLocation, color);
    } else {
      const color = defaultColors[_id || 0 % defaultColors.length];
      gl.uniform4fv(colorLocation, color);
    }

    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender(key, 0, factory);
  });

  return <></>;
}
