import {
  Children,
  createContext,
  useRef,
  cloneElement,
  isValidElement,
} from "react";
import { ZPainter } from "../lib/zpainter";
import {
  clipSpaceToGridUnits,
  screenSpaceToClipSpace,
} from "@/lib/curve2d/coords";

export type Curve2DState = {
  gl: WebGL2RenderingContext;
  /** The canvas the graph is drawn on. Prefer using this over gl.canvas since
   * it is typed more strictly. */
  canvas: HTMLCanvasElement;

  ctx2d: CanvasRenderingContext2D;
  canvas2d: HTMLCanvasElement;

  /** Simply put, this is the offset position of the origin in pixels, when the
   * scale is 1. When the scale is not 1 the offset becomes a little
   * complicated. */
  translation: [number, number];
  /** A scale of n implies the top y coordinate is 1/n and bottom is -1/n if
   * everything is centered. The number of pixels each grid unit takes up is
   * thus `canvas.height / 2 * scale`. */
  scale: number;
  /** The up/downscaling of the canvas, mainly for hi-dpi displays. */
  dpiratio: number;

  mouse: {
    /** Mouse position on the canvas in clip space, from (-1, -1) on the bottom
     * left corner to (1 , 1) on the top right corner. */
    clipX: number;
    /** Mouse position on the canvas in clip space, from (-1, -1) on the bottom
     * left corner to (1 , 1) on the top right corner. */
    clipY: number;
    /** Mouse position on the canvas in terms of grid unit coordinates. */
    gridX: number;
    /** Mouse position on the canvas in terms of grid unit coordinates. */
    gridY: number;
    /** Mouse position on the canvas in terms of pixels with origin at top left
     * corner. */
    canvasX: number;
    /** Mouse position on the canvas in terms of pixels with origin at top left
     * corner. */
    canvasY: number;
  };

  canvasRange: {
    /** Range of the current canvas view in terms of grid units. */
    xmax: number;
    /** Range of the current canvas view in terms of grid units. */
    xmin: number;
    /** Range of the current canvas view in terms of grid units. */
    ymax: number;
    /** Range of the current canvas view in terms of grid units. */
    ymin: number;
  };

  _isDragging: boolean;
  /** Mouse position on the canvas in pixels. You should not really need to use
   * this. Instead, consider using `mousePosition` . */
  _lastMousePos: [number, number];
  /** The points to be displayed. */
  _points: Map<string, number[]>;
};

export function setUniforms(program: WebGLProgram, state: Curve2DState) {
  const { gl, canvas, translation, scale, mouse } = state;
  const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
  const translationUniform = gl.getUniformLocation(program, "u_translation");
  const scaleUniform = gl.getUniformLocation(program, "u_scale");
  const mouseUniform = gl.getUniformLocation(program, "u_mouse");

  gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
  gl.uniform2fv(translationUniform, translation);
  gl.uniform1f(scaleUniform, scale);
  gl.uniform2f(mouseUniform, mouse.clipX, mouse.clipY);
}

export type Curve2DElements = {
  state?: Curve2DState;
  /** used to register your render function with the curve */
  registerRender: (
    key: string,
    zindex: number,
    factory: Curve2DRenderFuncFactory
  ) => void;
};

export type Curve2DRenderFuncFactory = (
  state: Curve2DState
) => Curve2DRenderFunc;
export type Curve2DRenderFunc = () => void;

export const Curve2DContext = createContext<Curve2DElements>({
  registerRender: () => {},
});

/** Returns the displayable range of the current canvas view in terms of grid
 * units. */
function updateCanvasRange(state: Curve2DState) {
  const {
    canvas,
    translation: [transx, transy],
    scale,
  } = state;
  const canvasWidthHalf = canvas.width / 2;
  const canvasHeightHalf = canvas.height / 2;
  const pixelsPerUnit = canvasHeightHalf * scale;
  const transxInUnits = transx / canvasHeightHalf;
  const transyInUnits = transy / canvasHeightHalf;

  state.canvasRange.xmax = canvasWidthHalf / pixelsPerUnit - transxInUnits;
  state.canvasRange.xmin = -canvasWidthHalf / pixelsPerUnit - transxInUnits;
  state.canvasRange.ymax = canvasHeightHalf / pixelsPerUnit - transyInUnits;
  state.canvasRange.ymin = -canvasHeightHalf / pixelsPerUnit - transyInUnits;
}

/** Converts _lastMousePos to clip space mousePosition */
function updateMousePos(state: Curve2DState) {
  // clientXY is reported in screen space coordinates, not canvas space,
  // so we need to offset it by the canvas rect
  const { x: canvasX, y: canvasY } = state.canvas.getClientRects()[0];
  const { dpiratio: ratio } = state;
  state.mouse.canvasX = (state._lastMousePos[0] - canvasX) * ratio;
  state.mouse.canvasY = (state._lastMousePos[1] - canvasY) * ratio;

  const [clipX, clipY] = screenSpaceToClipSpace(
    state,
    state.mouse.canvasX,
    state.mouse.canvasY
  );
  state.mouse.clipX = clipX;
  state.mouse.clipY = clipY;

  const [gridX, gridY] = clipSpaceToGridUnits(
    state,
    state.mouse.clipX,
    state.mouse.clipY
  );
  state.mouse.gridX = gridX;
  state.mouse.gridY = gridY;
}

function handleDrag(state: Curve2DState, mouseX: number, mouseY: number) {
  const [lastX, lastY] = state._lastMousePos;
  const deltaX = mouseX - lastX;
  const deltaY = mouseY - lastY;
  state.translation[0] += (deltaX / state.scale) * state.dpiratio;
  state.translation[1] -= (deltaY / state.scale) * state.dpiratio;
}

function handleZoom(state: Curve2DState, delta: number) {
  let scale = state.scale;
  const zoomFactor = 1.03;
  if (delta < 0) {
    // Zoom in
    scale /= zoomFactor;
  } else {
    // Zoom out
    scale *= zoomFactor;
  }

  if (scale < 0.01) {
    scale = 0.01;
  }
  if (scale > 100) {
    scale = 100;
  }

  state.scale = scale;
}

export function Curve2D({
  width = 800,
  height = 600,
  bgColor = [1, 1, 1, 1],
  children,
}: {
  width?: number;
  height?: number;
  /** Background color in rgba format. Each element is in [0, 1]. */
  bgColor?: [number, number, number, number];
  children: React.ReactNode;
}) {
  const ratio = window.devicePixelRatio;
  const curveState = useRef<Curve2DState>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const painter = new ZPainter<Curve2DState>();
  const registerRender = (
    key: string,
    zindex: number,
    factory: Curve2DRenderFuncFactory
  ) => {
    painter.register(key, zindex, factory);
    render();
  };

  const render = () => {
    if (!curveState.current) {
      return;
    }
    const { gl, ctx2d } = curveState.current;
    gl.clearColor(...bgColor);
    gl.clear(gl.COLOR_BUFFER_BIT);
    ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height);
    ctx2d.fillStyle = "black";
    ctx2d.fillRect(0, 0, 1, 1);

    painter.render(curveState.current);
  };

  const init = () => {
    const canvas = canvasRef.current;
    const canvas2d = canvas2DRef.current;
    if (!canvas || !canvas2d) {
      return;
    }

    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false });
    if (!gl) {
      throw Error("WebGL not supported");
    }
    const ctx2d = canvas2d.getContext("2d");
    if (!ctx2d) {
      throw Error("Canvas not supported!");
    }

    ctx2d.setTransform(ratio, 0, 0, ratio, 0, 0);
    painter.clear();

    curveState.current = {
      gl,
      canvas,
      ctx2d,
      canvas2d,
      _isDragging: false,
      _lastMousePos: [0, 0],
      _points: new Map(),
      translation: [0, 0],
      dpiratio: ratio,
      mouse: {
        clipX: 0,
        clipY: 0,
        gridX: 0,
        gridY: 0,
        canvasX: 0,
        canvasY: 0,
      },
      scale: 0.4,
      canvasRange: {
        xmax: -1.2,
        xmin: 1.2,
        ymax: -1.2,
        ymin: 1.2,
      },
    };

    updateCanvasRange(curveState.current);
    render();
  };

  return (
    <Curve2DContext.Provider
      value={{ state: curveState.current, registerRender: registerRender }}
    >
      <div
        className="relative"
        onMouseDown={() => {
          if (!curveState.current) {
            return;
          }
          curveState.current._isDragging = true;
        }}
        onMouseUp={() => {
          if (!curveState.current) {
            return;
          }
          curveState.current._isDragging = false;
        }}
        onMouseMove={(event) => {
          if (!curveState.current) {
            return;
          }
          if (curveState.current._isDragging) {
            handleDrag(curveState.current, event.clientX, event.clientY);
          }
          curveState.current._lastMousePos = [event.clientX, event.clientY];
          updateMousePos(curveState.current);
          updateCanvasRange(curveState.current);
          render();
        }}
        ref={(r) => {
          // have to do this roundabout way because standard react event
          // handlers are passive and don't allow preventDefault.
          r?.addEventListener("wheel", (event) => {
            event.preventDefault();
            if (!curveState.current) {
              return;
            }
            handleZoom(curveState.current, event.deltaY);
            updateCanvasRange(curveState.current);
            render();
          });
        }}
      >
        {Children.map(
          children,
          (child, i) =>
            isValidElement(child) &&
            cloneElement(child, { _id: i } as Partial<unknown>)
        )}
        <canvas
          ref={(r) => {
            canvasRef.current = r;
            init();
          }}
          width={width * ratio}
          height={height * ratio}
          style={{ width: `${width}px`, height: `${height}px` }}
          className="absolute top-0 left-0"
        ></canvas>
        <canvas
          ref={(r) => {
            canvas2DRef.current = r;
            init();
          }}
          width={width * ratio}
          height={height * ratio}
          style={{ width: `${width}px`, height: `${height}px` }}
          className="absolute top-0 left-0"
        />
      </div>
    </Curve2DContext.Provider>
  );
}
