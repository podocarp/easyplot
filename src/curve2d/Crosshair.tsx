import { useContext, useEffect } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";
import { binSearchPointX } from "@/lib/curve2d/points";
import { gridUnitsToClipSpace } from "@/lib/curve2d/coords";

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

export function Curve2DCrosshair({
  points,
}: {
  /** An array of points, as a series of x1 y1 x2 y2 ... coordinates  */
  points: React.RefObject<number[]>;
}) {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const { gl, mouse } = state;

    gl.useProgram(program);
    _setUniforms(program, state);

    const nearestPointIndex = binSearchPointX(
      points.current,
      state.mouse.gridX
    );
    const nearestY = points.current[nearestPointIndex + 1];
    const [_, nearestYClip] = gridUnitsToClipSpace(state, 0, nearestY);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, // horizontal line
        nearestYClip,
        1,
        nearestYClip,
        mouse.clipX, // vertical line
        -1,
        mouse.clipX,
        1,
      ]),
      gl.STATIC_DRAW
    );

    const positionAttribute = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, 4);
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
