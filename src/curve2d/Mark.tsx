import { drawCircle } from "@/lib/curve2d/circle";
import {
  gridUnitsToScreenSpace,
  screenSpaceToGridUnits,
} from "@/lib/curve2d/coords";
import { drawMarker } from "@/lib/curve2d/tooltip";
import { EventHandlerOptions } from "@/lib/events";
import { useContext, useEffect, useImperativeHandle, useRef } from "react";
import { Curve2DContext, Curve2DState } from "./Base";

function close(ax: number, ay: number, bx: number, by: number, radius: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by) <= radius;
}

/** A mark transform helper function. The transform function returned by this
 * function makes the mark move to the closest `y` coordinate returned by `func`.
 * For example, you can use this to make the mark stay on the path of a curve
 * as the cursor moves left to right.*/
export function Curve2DMarkClosestFunc(
  func: (x: number) => number[] | number
): Curve2DMarkMoveFunc {
  return (coords) => {
    const [x, y] = coords;
    const candidates = func(x);
    let newY = NaN;

    if (Array.isArray(candidates)) {
      let mindist = Infinity;
      for (const candidate of candidates) {
        if (isNaN(candidate)) {
          continue;
        }
        const dist = Math.abs(candidate - y);
        if (dist < mindist) {
          newY = candidate;
          mindist = dist;
        }
      }
    }

    if (isNaN(newY)) {
      return false;
    }
    coords[1] = newY;
  };
}

export type Curve2DMarkMoveFunc = (pos: [number, number]) => false | void;

export type Curve2DMarkRef = {
  /** Call this function to move the mark to the given grid coordinates. */
  move: (x: number, y: number) => void;
  /** Returns the current position of the mark in grid units. */
  pos: () => [number, number];
};

export type Curve2DMarkProps = {
  /** Initial position of the mark in grid units. */
  initialPos: [number, number];
  /** If empty, will not show this point on the canvas. If you only want to
   * display the circle but not the text, just use an empty string. */
  label?: string;
  radius?: number;
  /** If set, the mark can be dragged by the mouse. For more control over where
   * the point can be moved to, see the `transform` field. */
  movable?: boolean;
  /** Function called when mark is moved. */
  onMove?: (x: number, y: number) => void;
  /** A callback triggered when the point is moved. The argument is an array
   * containing the new xy coordinates of the mark, in grid units. You should
   * modify the array elements directly if you want to move the mark. The
   * function can also return `false` to denote that the point should not move
   * this call. See the Curve2DMarkxxx helpers.
   */
  transform?: Curve2DMarkMoveFunc;
  ref?: React.RefObject<Curve2DMarkRef | null>;
  _id?: number | string;
};

/** Draws circle at a point on the curve. */
export function Curve2DMark({
  initialPos: [initialX, initialY],
  label,
  movable,
  onMove,
  radius = 6,
  transform,
  ref,
  _id,
}: Curve2DMarkProps) {
  const { registerRender, registerEventHandler, setCursor, state } =
    useContext(Curve2DContext);
  const gridPos = useRef<[number, number]>([initialX, initialY]);
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

  useImperativeHandle(ref, () => ({
    move: (x, y) => {
      setGridPos(x, y);
    },
    pos: () => [gridPos.current[0], gridPos.current[1]],
  }));

  const factory = (state: Curve2DState) => {
    return () => {
      setGridPos(gridPos.current[0], gridPos.current[1]); // update screenpos
      drawCircle(state, screenPos.current[0], screenPos.current[1], radius);
      if (label) {
        drawMarker(
          state,
          label,
          screenPos.current[0] + radius + 16,
          screenPos.current[1],
          "left"
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
      if (transform) {
        const pos = screenSpaceToGridUnits(state.current, canvasX, canvasY);
        if (transform(pos) !== false) {
          setGridPos(pos[0], pos[1]);
          if (onMove !== undefined) {
            onMove(pos[0], pos[1]);
          }
        }
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
    if (movable !== undefined) {
      registerEventHandler("onMouseMove", `${key}-hover`, handleMouse);
      registerEventHandler("onDrag", `${key}-drag`, handleDrag);
      registerEventHandler("endDrag", `${key}-enddrag`, endDrag);
    }
  });

  return <></>;
}
