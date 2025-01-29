import { createProgram } from "@/lib/gl";
import { Curve2DContext, Curve2DState, setUniforms } from "./Base";
import { useContext, useEffect } from "react";
import { binSearchPointX } from "@/lib/curve2d/points";
import { distSq, gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { drawTooltip } from "@/lib/curve2d/tooltip";
import { drawCircle } from "@/lib/curve2d/circle";
import { toExponential } from "@/lib/math/general";
import { EventHandlerOptions } from "@/lib/events";

const curveVertexShader = `
    uniform vec2 u_translation;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform float width;

    attribute vec2 a_position;
    attribute vec2 pointA, pointB;
    float pixelsPerUnit = u_resolution.y / 2.0 * u_scale;
    vec2 reshalf = u_resolution / 2.0;

    vec2 toClipspace(in vec2 point) {
      point *= pixelsPerUnit;
      point += u_translation * u_scale;
      point /= reshalf;
      return point;
    }

    void main() {
      vec2 A = toClipspace(pointA);
      vec2 B = toClipspace(pointB);
      vec2 AB = B - A;
      vec2 normal = normalize(vec2(-AB.y, AB.x));

      // a_position.x is either 0 or 1
      vec2 point = A + AB * a_position.x;
      // a_position.y is either 0.5 or -0.5
      point += normal * width * a_position.y;
      gl_Position = vec4(point, 1, 1);
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
  [1, 0.8, 0, 1],
  [0, 1, 1, 1],
  [1, 0, 1, 1],
  [0, 0, 0, 1],
];

function getNextCurveColor() {
  const color = curveDefaultColors[curveNum % curveDefaultColors.length];
  curveNum++;
  return color;
}

/** Tests if the mouse is close to any point, and draws a tooltip if so.
 * Otherwise returns false and does nothing. */
function tryHover(state: Curve2DState, points: number[]) {
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
    return true;
  }
  return false;
}

/** A generic plotter; just draws the lines its given and nothing else. */
export function Curve2DCurveGeneric({
  color,
  points,
  id,
  hover,
  width = 4,
}: {
  /** Coordinates in grid space to draw, in x1 y1 x2 y2 format. */
  points: React.RefObject<number[]>;
  id: string;
  color?: [number, number, number, number];
  /** Whether to show a tooltip when the mouse is close to a point. */
  hover?: boolean;
  /** Width of the line in pixels*/
  width?: number;
}) {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (points.current.length < 4) {
      return;
    }
    const { gl } = state;
    gl.useProgram(program);

    setUniforms(program, state);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const pointALocation = gl.getAttribLocation(program, "pointA");
    const pointBLocation = gl.getAttribLocation(program, "pointB");

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      // prettier-ignore
      new Float32Array([
        0, -0.5,
        1, -0.5,
        1, 0.5,
        0, -0.5,
        1, 0.5,
        0, 0.5,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribDivisor(positionLocation, 0);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(points.current),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(pointALocation);
    gl.vertexAttribDivisor(pointALocation, 1);
    gl.vertexAttribPointer(pointALocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(pointBLocation);
    gl.vertexAttribDivisor(pointBLocation, 1);
    gl.vertexAttribPointer(
      pointBLocation,
      2,
      gl.FLOAT,
      false,
      0,
      Float32Array.BYTES_PER_ELEMENT * 2
    );

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, points.current.length / 2 - 1);

    if (hover) {
      tryHover(state, points.current);
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

    const widthLocation = gl.getUniformLocation(program, "width");
    gl.uniform1f(widthLocation, (2 / gl.canvas.height) * width);

    return () => render(program, state);
  };

  const key = `curve-generic-${id}`;
  useEffect(() => {
    ctx.registerRender(key, 1000, factory);
    ctx.registerEventHandler("onMouseMove", `${key}-hover`, () => {
      if (!hover || ctx.state.current === undefined) {
        return EventHandlerOptions.nothingDone;
      }
      if (!tryHover(ctx.state.current, points.current)) {
        return EventHandlerOptions.nothingDone;
      }
    });
  });

  return <></>;
}
