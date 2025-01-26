import { useContext, useEffect } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";
import { binSearchPointX } from "@/lib/curve2d/points";
import {
  clipSpaceToScreenSpace,
  gridUnitsToClipSpace,
} from "@/lib/curve2d/coords";
import { drawTooltip } from "@/lib/curve2d/tooltip";

const crosshairVertexShader = `
attribute vec2 a_position;
varying float v_length;

void main() {
  gl_Position = vec4(a_position, 1, 1);
  if (a_position.x == -1.0 || a_position.y == -1.0) {
    v_length = 100.0;
  } else {
    v_length = 0.0;
  }
}
`;
const crosshairFragmentShader = `
precision mediump float;
varying float v_length;
void main() {
  if (mod(v_length, 5.0) >= 2.0) {
    gl_FragColor = vec4(0.1, 0.1, 0.1, 0.5);
  } else {
    discard;
  }
}
`;

function drawLine(program: WebGLProgram, state: Curve2DState) {
  const {
    gl,
    mouse: { clipX },
  } = state;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      clipX, // vertical line
      -1,
      clipX,
      1,
    ]),
    gl.STATIC_DRAW
  );

  const positionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, 2);
}

function processPoints(state: Curve2DState, points: number[]) {
  const {
    mouse: { clipX },
  } = state;
  const nearestPointIndex = binSearchPointX(points, state.mouse.gridX);
  const nearestX = points[nearestPointIndex];
  const nearestY = points[nearestPointIndex + 1];
  const [_, nearestYClip] = gridUnitsToClipSpace(state, 0, nearestY);

  const [tx, ty] = clipSpaceToScreenSpace(state, clipX, nearestYClip);
  drawTooltip(
    state,
    `(${nearestX !== undefined ? nearestX.toFixed(2) : "-"}, ${nearestY !== undefined ? nearestY.toFixed(2) : "-"})`,
    tx,
    ty,
    4
  );
}

export function Curve2DCrosshair() {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    drawLine(program, state);
    state._points.values().forEach((points) => processPoints(state, points));
  };

  const factory = (state: Curve2DState) => {
    const program = createProgram(
      state.gl,
      crosshairVertexShader,
      crosshairFragmentShader
    );
    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender("crosshair", 1, factory);
  });

  return <></>;
}
