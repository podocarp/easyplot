import { drawCircle } from "@/lib/curve2d/circle";
import { distSq, gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { binSearchPointX } from "@/lib/curve2d/points";
import { drawTooltip } from "@/lib/curve2d/tooltip";
import { EventHandlerOptions } from "@/lib/events";
import { createProgram } from "@/lib/gl";
import { toExponential } from "@/lib/math/general";
import { useContext, useEffect } from "react";
import { Curve2DContext, Curve2DState, setUniforms } from "./Base";

const curveVertexShader = `
    uniform vec2 u_translation;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform float width;

    attribute vec2 a_position;
    attribute vec2 pointA, pointB;
    float pixelsPerUnit = u_resolution.y / 2.0 * u_scale;
    vec2 reshalf = u_resolution / 2.0;

    attribute float a_dist;
    varying float display;

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

      display = a_dist * pixelsPerUnit + a_position.x * length(AB) * reshalf.x;
    }
`;

const curveFragmentShaderDashed = `
    precision mediump float;
    varying float display;
    uniform vec4 u_color;
    void main() {
      if (mod(display, 30.0) < 20.0) {
        gl_FragColor = u_color;
      } else {
        discard;
      }
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

export type Curve2DCommonConfigurations = {
  color?: [number, number, number, number];
  /** Whether to show a tooltip when the mouse is close to a point. */
  hover?: boolean;
  /** Width of the line in pixels*/
  width?: number;
  /** Whether to draw as a dashed line. */
  dashed?: boolean;
};

type Curve2DPoints =
  | number[]
  | React.RefObject<number[]>
  | React.RefObject<[number, number]>[];

function toPoints(points: Curve2DPoints): number[] {
  if (Array.isArray(points)) {
    if (points.length === 0) {
      return [];
    }
    if (typeof points[0] === "number") {
      return points as number[];
    }
    return (points as React.RefObject<[number, number]>[]).flatMap(
      (p) => p.current
    );
  } else {
    return points.current;
  }
}

function getArcLength(points: number[]): number[] {
  let prevx = points[0];
  let prevy = points[1];
  let len = 0;
  const distances = [];
  for (let i = 2; i < points.length - 1; i += 2) {
    const dist = Math.sqrt(
      (prevx - points[i]) ** 2 + (prevy - points[i + 1]) ** 2
    );
    if (!isNaN(dist)) {
      len += dist;
    }
    distances.push(len);
    prevx = points[i];
    prevy = points[i + 1];
  }
  return distances;
}

/** A generic plotter; just draws the lines its given and nothing else. */
export function Curve2DCurveGeneric({
  color,
  points,
  id,
  hover,
  dashed,
  width = 4,
}: {
  /** Coordinates in grid space to draw, in x1 y1 x2 y2 format. */
  points: Curve2DPoints;
  id: string;
} & Curve2DCommonConfigurations) {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    const { gl } = state;
    gl.useProgram(program);

    setUniforms(program, state);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const pointALocation = gl.getAttribLocation(program, "pointA");
    const pointBLocation = gl.getAttribLocation(program, "pointB");
    const distLocation = gl.getAttribLocation(program, "a_dist");

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

    const convertedPoints = toPoints(points);
    const distances = getArcLength(convertedPoints);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(convertedPoints.concat(distances)),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(pointALocation);
    gl.vertexAttribDivisor(pointALocation, 1);
    gl.vertexAttribPointer(
      pointALocation,
      2,
      gl.FLOAT,
      false,
      0,
      Float32Array.BYTES_PER_ELEMENT * 0
    );

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

    gl.enableVertexAttribArray(distLocation);
    gl.vertexAttribDivisor(distLocation, 1);
    gl.vertexAttribPointer(
      distLocation,
      1,
      gl.FLOAT,
      false,
      0,
      Float32Array.BYTES_PER_ELEMENT * convertedPoints.length
    );

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, convertedPoints.length / 2 - 1);
  };

  const factory = (state: Curve2DState) => {
    const { gl } = state;
    const program = createProgram(
      gl,
      curveVertexShader,
      dashed ? curveFragmentShaderDashed : curveFragmentShader
    );
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
    if (hover) {
      ctx.registerEventHandler("onMouseMove", `${key}-hover`, ({ state }) => {
        if (ctx.state.current === undefined) {
          return;
        }
        if (tryHover(state, toPoints(points))) {
          return EventHandlerOptions.stopPropagation;
        }
      });
    }
  });

  return <></>;
}
