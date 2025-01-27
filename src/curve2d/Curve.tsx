import { useContext, useEffect } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";
import { binSearchPointX } from "@/lib/curve2d/points";
import { distSq, gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { drawTooltip } from "@/lib/curve2d/tooltip";
import { drawCircle } from "@/lib/curve2d/circle";

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
  steps = 1000,
  color,
  hover = true,
  _id,
}: {
  /** The function to plot. */
  fun: (x: number) => number;
  /** The approximate number of points to plot.*/
  steps?: number;
  color?: [number, number, number, number];
  hover?: boolean;
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const key = `curve-${_id}`;

  let prevXmax = 0;
  let prevXmin = 0;
  let prevPoints: number[] = [];
  const calcPoints = (state: Curve2DState) => {
    const { xmax, xmin, ymax, ymin } = state.canvasRange;
    if (xmax === prevXmax && xmin === prevXmin) {
      return prevPoints;
    }

    const points = [];
    // approximate step size
    const stepSize = (xmax - xmin) / steps;

    const prevy = 0;
    for (let x = xmin; x <= xmax; ) {
      const y = fun(x);
      if (y > ymax || y < ymin) {
        points.push(x, NaN);
      } else {
        points.push(x, y);
      }

      const gradient = (prevy - y) / stepSize;
      if (gradient < 10) {
        x += stepSize;
      } else {
        let multiplier = gradient / 10;
        if (multiplier > 10) {
          multiplier = 10;
        }
        x += stepSize / multiplier;
      }
    }

    prevPoints = points;
    prevXmax = xmax;
    prevXmin = xmin;

    return points;
  };

  const drawHover = (points: number[], state: Curve2DState) => {
    const {
      mouse: { gridX, gridY },
      scale,
    } = state;

    const radius = 0.1 * scale;
    const startIndex = binSearchPointX(points, gridX - radius);
    let mindist = Infinity;
    let nearestX = 0;
    let nearestY = 0;
    for (let i = startIndex; points[i] < gridX + radius; i += 2) {
      const dist = distSq(points[i], points[i + 1], gridX, gridY);
      if (dist < radius && dist < mindist) {
        mindist = dist;
        nearestX = points[i];
        nearestY = points[i + 1];
      }
    }

    if (mindist != Infinity) {
      const [tx, ty] = gridUnitsToScreenSpace(state, nearestX, nearestY);
      drawCircle(state, tx, ty);
      drawTooltip(
        state,
        `(${nearestX !== undefined ? nearestX.toFixed(2) : "-"}, ${nearestY !== undefined ? nearestY.toFixed(2) : "-"})`,
        tx,
        ty,
        4,
        8,
        -12
      );
    }
  };

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const { gl, _points } = state;

    gl.useProgram(program);
    _setUniforms(program, state);

    const points = calcPoints(state);
    _points.set(key, points);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);

    if (hover) {
      drawHover(points, state);
    }
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
