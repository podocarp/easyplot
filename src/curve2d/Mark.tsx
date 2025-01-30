import { useContext, useEffect, useRef } from "react";
import { Curve2DContext, Curve2DState } from "./Base";
import { drawCircle } from "@/lib/curve2d/circle";
import {
  gridUnitsToScreenSpace,
  screenSpaceToGridUnits,
} from "@/lib/curve2d/coords";
import { drawMarker } from "@/lib/curve2d/tooltip";
import { EventHandlerOptions } from "@/lib/events";

function close(ax: number, ay: number, bx: number, by: number, radius: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by) <= radius;
}

const radius = 5;

export function Curve2DMarkMarkClosestX(
  fun: (x: number) => number
): Curve2DMarkMoveFunc {
  return (x: number) => {
    const y = fun(x);
    return [x, y];
  };
}

export type Curve2DMarkMoveFunc = (x: number, y: number) => [number, number];

/** Draws circle at a point on the curve. */
export function Curve2DMark({
  x,
  y,
  text,
  move,
  _id,
}: {
  x: number;
  y: number;
  text?: string;
  /** If true, the point can be dragged by the cursor. Alternatively, a function
   * can be provided that takes in the cursor position and returns the new
   * position of the point. Coordinates are in *grid units*. */
  move?: boolean | Curve2DMarkMoveFunc;
  _id?: number | string;
}) {
  const { registerRender, registerEventHandler, setCursor, state } =
    useContext(Curve2DContext);
  const gridPos = useRef<[number, number]>([x, y]);
  const screenPos = useRef<[number, number]>([0, 0]);

  const setGridPos = (gridx: number, gridy: number) => {
    if (state.current) {
      gridPos.current[0] = gridx;
      gridPos.current[1] = gridy;
      screenPos.current = gridUnitsToScreenSpace(state.current, gridx, gridy);
    }
  };

  const setScreenPos = (screenX: number, screenY: number) => {
    if (state.current) {
      screenPos.current[0] = screenX;
      screenPos.current[1] = screenY;
      gridPos.current = screenSpaceToGridUnits(state.current, screenX, screenY);
    }
  };

  const factory = (state: Curve2DState) => {
    return () => {
      setGridPos(gridPos.current[0], gridPos.current[1]); // update screenpos
      drawCircle(state, screenPos.current[0], screenPos.current[1], radius);
      if (text) {
        drawMarker(
          state,
          text,
          screenPos.current[0] + radius + 16,
          screenPos.current[1]
        );
      }
    };
  };

  let isDragging = false;
  const handleDrag = () => {
    if (state.current === undefined) {
      return EventHandlerOptions.nothingDone;
    }

    const { canvasX, canvasY } = state.current.mouse;
    if (!isDragging) {
      isDragging = close(
        canvasX,
        canvasY,
        screenPos.current[0],
        screenPos.current[1],
        radius
      );
    }

    if (isDragging) {
      if (typeof move === "function") {
        const [gx, gy] = screenSpaceToGridUnits(
          state.current,
          canvasX,
          canvasY
        );
        const [x, y] = move(gx, gy);
        setGridPos(x, y);
      } else {
        setScreenPos(canvasX, canvasY);
      }
      return (
        EventHandlerOptions.preventDefault | EventHandlerOptions.stopPropagation
      );
    }

    return EventHandlerOptions.nothingDone;
  };

  const endDrag = () => {
    isDragging = false;
    return EventHandlerOptions.nothingDone;
  };

  const handleMouse = () => {
    if (state.current === undefined) {
      return;
    }
    const { canvasX, canvasY } = state.current.mouse;
    if (
      close(
        canvasX,
        canvasY,
        screenPos.current[0],
        screenPos.current[1],
        radius
      )
    ) {
      setCursor("grab");
    }
  };

  const key = `mark-${_id}`;
  useEffect(() => {
    registerRender(key, 10, factory);
    if (move !== undefined) {
      registerEventHandler("onMouseMove", `${key}-hover`, handleMouse);
      registerEventHandler("onDrag", `${key}-drag`, handleDrag);
      registerEventHandler("endDrag", `${key}-enddrag`, endDrag);
    }
  });

  return <></>;
}
