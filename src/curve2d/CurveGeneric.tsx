import { createProgram } from "@/lib/gl";
import { Curve2DContext, Curve2DState, setUniforms } from "./Base";
import { useContext, useEffect } from "react";
import { binSearchPointX } from "@/lib/curve2d/points";
import { distSq, gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { drawTooltip } from "@/lib/curve2d/tooltip";
import { drawCircle } from "@/lib/curve2d/circle";
import { toExponential } from "@/lib/math/general";

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

let curveNum = 0;
const curveDefaultColors = [
  [1, 0, 0, 1],
  [0, 1, 0, 1],
  [0, 0, 1, 1],
  [1, 1, 0, 1],
  [0, 1, 1, 1],
  [1, 0, 1, 1],
  [0, 0, 0, 1],
];

function getNextCurveColor() {
  const color = curveDefaultColors[curveNum % curveDefaultColors.length];
  curveNum++;
  return color;
}

function drawHover(state: Curve2DState, points: number[]) {
  const {
    mouse: { gridX, gridY },
    scale,
  } = state;

  const radius = 0.05 * scale;
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
    const precision = Math.abs(toExponential(scale, 10).exponent) + 2;
    const [tx, ty] = gridUnitsToScreenSpace(state, nearestX, nearestY);
    drawCircle(state, tx, ty, 4);
    drawTooltip(
      state,
      `(${nearestX !== undefined ? nearestX.toFixed(precision) : "-"}, ${nearestY !== undefined ? nearestY.toFixed(precision) : "-"})`,
      tx,
      ty,
      4,
      8,
      -12
    );
  }
}

/** A generic plotter; just draws the lines its given and nothing else. */
export function Curve2DCurveGeneric({
  color,
  points,
  id,
  hover,
}: {
  /** Coordinates in grid space to draw, in x1 y1 x2 y2 format. */
  points: React.RefObject<number[]>;
  id: string;
  color?: [number, number, number, number];
  hover?: boolean;
}) {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    const { gl } = state;

    gl.useProgram(program);
    setUniforms(program, state);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(points.current),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, points.current.length / 2);

    if (hover) {
      drawHover(state, points.current);
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
      gl.uniform4fv(colorLocation, getNextCurveColor());
    }

    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender(`curve-generic-${id}`, 1000, factory);
  });

  return <></>;
}
