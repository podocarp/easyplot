import { drawCircle } from "@/lib/curve2d/circle";
import { gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { binSearchPointX } from "@/lib/curve2d/points";
import { drawTooltip } from "@/lib/curve2d/tooltip";
import { useContext, useEffect } from "react";
import { createProgram } from "../lib/gl";
import { Curve2DContext, Curve2DState } from "./Base";

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

function drawLine(
  program: WebGLProgram,
  state: Curve2DState,
  horiz: boolean = false
) {
  const {
    gl,
    mouse: { clipX, clipY },
  } = state;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  if (horiz) {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, clipY, 1, clipY]),
      gl.STATIC_DRAW
    );
  } else {
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([clipX, -1, clipX, 1]),
      gl.STATIC_DRAW
    );
  }

  const positionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, 2);
}

function processPoints(state: Curve2DState, points: number[]) {
  const { mouse } = state;

  const nearestPointIndex = binSearchPointX(points, mouse.gridX);
  const nearestX = points[nearestPointIndex];
  const nearestY = points[nearestPointIndex + 1];

  const [tx, ty] = gridUnitsToScreenSpace(state, nearestX, nearestY);
  drawCircle(state, tx, ty, 4);
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

export function Curve2DVerticalCursor() {
  const { registerRender, registerEventHandler } = useContext(Curve2DContext);

  const factory = (state: Curve2DState) => {
    const program = createProgram(
      state.gl,
      crosshairVertexShader,
      crosshairFragmentShader
    );
    return () => {
      drawLine(program, state);
      state._points.values().forEach((points) => processPoints(state, points));
    };
  };

  let lastMouseX = 0;
  useEffect(() => {
    registerRender("cursor-vert", 1, factory);
    registerEventHandler(
      "onMouseMove",
      "cursor-vert-mousemove",
      ({ mouseX }) => {
        if (mouseX === undefined || lastMouseX === mouseX) {
          return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        lastMouseX = mouseX;
        // don't need to do anything else, the render function will be called
        // automatically
      }
    );
  });

  return <></>;
}
