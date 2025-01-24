import { useContext, useEffect } from "react";
import { createProgram } from "../lib/gl";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { gridUnitsToScreenSpace } from "@/lib/curve2d/coords";

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

  void main() {
      // actually the thickness value divided by 2
      float thickness = 1.0;

      vec2 worldCoords = gl_FragCoord.xy - u_resolution / 2.0;
      vec2 pos = worldCoords - (u_translation * u_scale);

      if ((-thickness <= pos.x && pos.x <= thickness)
        || (-thickness <= pos.y && pos.y <= thickness)) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
      }

      float pixelsPerUnit = u_resolution.y * u_scale / 2.0;
      vec2 grid = mod(pos, pixelsPerUnit);
      if ((-thickness <= grid.x && grid.x <= thickness)
        || (-thickness <= grid.y && grid.y <= thickness)) {
            gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
            return;
      }
      discard;
  }
`;

export function Curve2DGrid() {
  const ctx = useContext(Curve2DContext);

  const drawTicks = (state: Curve2DState) => {
    const { xmin, xmax, ymin, ymax } = state.canvasRange;
    const { ctx2d } = state;
    ctx2d.font = "12px sans-serif";
    ctx2d.textAlign = "left";
    for (let i = Math.floor(xmin); i <= Math.ceil(xmax); i++) {
      const [x, y] = gridUnitsToScreenSpace(state, i, 0);
      // magic numbers are some padding that seems to work fine
      ctx2d.fillText("" + i, x + 5, y + 15);
    }
    ctx2d.textAlign = "right";
    for (let i = Math.floor(ymin); i <= Math.ceil(ymax); i++) {
      const [x, y] = gridUnitsToScreenSpace(state, 0, i);
      if (i === 0) {
        // only need one mark on the origin
        continue;
      }
      ctx2d.fillText("" + i, x - 5, y);
    }
  };

  const render = (program: WebGLProgram, state: Curve2DState) => {
    const { gl } = state;
    gl.useProgram(program);
    _setUniforms(program, state);
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

    drawTicks(state);
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
