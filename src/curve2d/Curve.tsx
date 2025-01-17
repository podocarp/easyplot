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

      gl_Position = vec4(pos, 0, 1);
    }
`;

const curveFragmentShader = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
`;

export function Curve2DCurve({
  fun,
  steps = 100,
}: {
  /** The function to plot */
  fun: (x: number) => number;
  steps?: number;
}) {
  const ctx = useContext(Curve2DContext);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const {
      gl,
      translation: [transx],
      scale,
    } = state;
    const canvasWidthHalf = gl.canvas.width / 2;
    const canvasHeightHalf = gl.canvas.height / 2;

    gl.useProgram(program);
    _setUniforms(program, state);

    // number of pixels that make up one unit (grid square) on the graph
    const pixelsPerUnit = canvasHeightHalf * scale;
    const transInPixels = (transx * scale) / pixelsPerUnit;
    const xRangeInUnits = [
      -canvasWidthHalf / pixelsPerUnit - transInPixels,
      canvasWidthHalf / pixelsPerUnit - transInPixels,
    ];

    const points = [];
    const stepsize = (xRangeInUnits[1] - xRangeInUnits[0]) / steps;
    for (let i = 0; i < steps; i++) {
      const x = xRangeInUnits[0] + stepsize * i;
      const y = fun(x);
      points.push(x, y);
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  };

  const factory = (state: Curve2DState) => {
    const program = createProgram(
      state.gl,
      curveVertexShader,
      curveFragmentShader
    );
    return () => render(program, state);
  };

  useEffect(() => {
    ctx.registerRender("curve", factory);
  });

  return <></>;
}
