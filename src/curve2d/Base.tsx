import { createContext, useRef } from "react";

export type Curve2DState = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;

  isDragging: boolean;
  /** Simply put, this is the offset position of the origin in pixels, when the
   * scale is 1. */
  translation: [number, number];
  lastMousePosition: [number, number];
  /** A scale of n implies the top y coordinate is 1/n and bottom is -1/n if
   * everything is centered. */
  scale: number;
};

export function _setUniforms(program: WebGLProgram, state: Curve2DState) {
  const { gl, canvas, translation, scale } = state;
  const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
  const translationUniform = gl.getUniformLocation(program, "u_translation");
  const scaleUniform = gl.getUniformLocation(program, "u_scale");

  gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
  gl.uniform2fv(translationUniform, translation);
  gl.uniform1f(scaleUniform, scale);
}

export type Curve2DElements = {
  state?: Curve2DState;
  /** used to register your render function with the curve */
  registerRender: (key: string, factory: Curve2DRenderFuncFactory) => void;
};

export type Curve2DRenderFuncFactory = (
  state: Curve2DState
) => Curve2DRenderFunc;
export type Curve2DRenderFunc = () => void;

export const Curve2DContext = createContext<Curve2DElements>({
  registerRender: () => {},
});

export function Curve2D({ children }: { children: React.ReactNode }) {
  const curveState = useRef<Curve2DState>(undefined);

  const renderFactories: Map<string, Curve2DRenderFuncFactory> = new Map();
  const renderFunctions: Map<string, Curve2DRenderFunc> = new Map();
  const registerRender = (key: string, factory: Curve2DRenderFuncFactory) => {
    renderFactories.set(key, factory);
    render();
  };

  const render = () => {
    if (!curveState.current) {
      return;
    }
    const { gl } = curveState.current;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const [key, factory] of renderFactories.entries()) {
      let func = renderFunctions.get(key);
      if (func) {
        func();
      } else {
        func = factory(curveState.current);
        renderFunctions.set(key, func);
        func();
      }
    }
  };

  const callbackRef = (canvas: HTMLCanvasElement) => {
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw Error("WebGL not supported");
    }

    renderFunctions.clear();

    curveState.current = {
      gl,
      canvas,
      isDragging: false,
      translation: [0, 0],
      lastMousePosition: [0, 0],
      scale: 0.1,
    };

    render();
  };

  return (
    <Curve2DContext.Provider
      value={{ state: curveState.current, registerRender: registerRender }}
    >
      <canvas
        ref={callbackRef}
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
            curveState.current.translation[0] +=
              deltaX / curveState.current.scale;
            curveState.current.translation[1] -=
              deltaY / curveState.current.scale;

            curveState.current.lastMousePosition = [
              event.clientX,
              event.clientY,
            ];
            render();
          }
        }}
        onWheel={(event) => {
          if (!curveState.current) {
            return;
          }
          let scale = curveState.current.scale;
          const zoomFactor = 1.03;
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
      >
        {children}
      </canvas>
    </Curve2DContext.Provider>
  );
}
