import { useContext, useEffect, useRef } from "react";
import { _setUniforms, Curve2DContext, Curve2DState } from "./Base";
import { createProgram } from "../lib/gl";
import { Curve2DCrosshair } from "./Crosshair";

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
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
`;

export function Curve2DCurve({
  fun,
  steps = 100,
  showCrosshair,
}: {
  /** The function to plot */
  fun: (x: number) => number;
  steps?: number;
  showCrosshair?: boolean;
}) {
  const ctx = useContext(Curve2DContext);
  const points = useRef<number[]>([]);

  const render = (program: WebGLProgram, state: Curve2DState) => {
    if (!program) {
      return;
    }
    const { gl } = state;

    gl.useProgram(program);
    _setUniforms(program, state);

    const { xmax, xmin } = state.canvasRange;

    points.current = [];
    const stepsize = (xmax - xmin) / steps;
    for (let i = 0; i < steps; i++) {
      const x = xmin + stepsize * i;
      const y = fun(x);
      points.current.push(x, y);
    }

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

    gl.drawArrays(gl.LINE_STRIP, 0, steps);
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
    ctx.registerRender("curve", 0, factory);
  });

  return <>{showCrosshair && <Curve2DCrosshair points={points} />}</>;
}
