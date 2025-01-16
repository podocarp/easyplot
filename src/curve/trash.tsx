import React, { useEffect, useRef } from "react";
import { createProgram } from "../lib/gl";

type Curve2DState = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  curveProg: WebGLProgram;
  gridProg: WebGLProgram;

  isDragging: boolean;
  translation: [number, number];
  lastMousePosition: [number, number];
  /** A scale of `n` implies that there should be `n` y-coordinate grid ticks
   * visible on the canvas. Of course some may be clipped off depending on
   * the translation but you get the idea. */
  scale: number;
};

const gridVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }
`;
const gridFragmentShader = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform float u_scale;

  void main() {
      float gridSpacing = u_resolution.y / u_scale;
      float thickness = 2.0;

      vec2 centeredPosition = gl_FragCoord.xy - u_resolution / 2.0;
      vec2 translatedPosition = centeredPosition + u_translation;
      vec2 grid = mod(translatedPosition, gridSpacing);
      if (grid.x <= thickness || grid.y <= thickness) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
      } else {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
  }
`;

function drawGrid(state: Curve2DState) {
  const { gl, canvas, gridProg: program, translation, scale } = state;

  gl.useProgram(program);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
  const translationUniform = gl.getUniformLocation(program, "u_translation");
  const scaleUniform = gl.getUniformLocation(program, "u_scale");

  gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
  gl.uniform2fv(translationUniform, translation);
  gl.uniform1f(scaleUniform, scale);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const curveVertexShader = `
    attribute vec2 a_position;
    uniform vec2 u_translation;
    uniform vec2 u_resolution;
    uniform float u_scale;

    void main() {
      vec2 translationNDC = (u_translation / u_resolution) * 2.0;
      vec2 pos = a_position / u_scale * 2.0 - translationNDC;
      gl_Position = vec4(pos, 0, 1);
    }
`;

const curveFragmentShader = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
`;

function drawCurve(state: Curve2DState) {
  const { gl, curveProg: program, translation, canvas, scale } = state;

  gl.useProgram(program);
  const points = [];
  for (let x = -1; x <= 1; x += 0.01) {
    const y = Math.sin(2 * Math.PI * x);
    points.push(x, y);
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
  const translationUniform = gl.getUniformLocation(program, "u_translation");
  const scaleUniform = gl.getUniformLocation(program, "u_scale");
  gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
  gl.uniform2fv(translationUniform, translation);
  gl.uniform1f(scaleUniform, scale);

  gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
}

function WebGLCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curveState = useRef<Curve2DState>(undefined);

  const render = () => {
    if (!curveState.current) {
      return;
    }
    const { gl } = curveState.current;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawGrid(curveState.current);
    drawCurve(curveState.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl");
    if (!gl) {
      throw Error("WebGL not supported");
    }

    const curveProg = createProgram(gl, curveVertexShader, curveFragmentShader);
    const gridProg = createProgram(gl, gridVertexShader, gridFragmentShader);

    curveState.current = {
      gl,
      canvas,
      gridProg,
      curveProg,
      isDragging: false,
      translation: [0, 0],
      lastMousePosition: [0, 0],
      scale: 3,
    };

    render();
  });

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={(event) => {
        if (!curveState.current) {
          return;
        }
        curveState.current.isDragging = true;
        curveState.current.lastMousePosition = [event.clientX, event.clientY];
      }}
      onMouseUp={() => {
        if (!curveState.current) {
          return;
        }
        curveState.current.isDragging = false;
      }}
      onMouseMove={(event) => {
        if (curveState.current && curveState.current.isDragging) {
          const [lastX, lastY] = curveState.current.lastMousePosition;
          const deltaX = event.clientX - lastX;
          const deltaY = event.clientY - lastY;
          curveState.current.translation[0] -= deltaX;
          curveState.current.translation[1] += deltaY;
          curveState.current.lastMousePosition = [event.clientX, event.clientY];
          render();
        }
      }}
      onWheel={(event) => {
        if (!curveState.current) {
          return;
        }
        let scale = curveState.current.scale;
        const zoomFactor = 1.02;
        if (event.deltaY < 0) {
          // Zoom in
          scale /= zoomFactor;
        } else {
          // Zoom out
          scale *= zoomFactor;
        }

        if (scale < 0.1) {
          scale = 0.1;
        }
        if (scale > 100) {
          scale = 100;
        }

        curveState.current.scale = scale;
        render();
      }}
    />
  );
}

export default WebGLCurve;
