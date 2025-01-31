import { useContext, useEffect, useRef } from "react";
import { Curve2DContext, Curve2DState } from "./Base";
import {
  Curve2DCommonConfigurations,
  Curve2DCurveGeneric,
} from "./CurveGeneric";

type Coord = [number, number] | React.RefObject<[number, number]>;

export function Curve2DLineSegment({
  /** The start coordinate to draw from in grid units. If you pass a ref to
   * both `from` and `to`, the curve will update in the next rerender. Will not
   * work if only one of them is a ref.*/
  from,
  /** The end coordinate to draw from in grid units. If you pass a ref to
   * both `from` and `to`, the curve will update in the next rerender. Will not
   * work if only one of them is a ref.*/
  to,
  config,
  _id,
}: {
  from: Coord;
  to: Coord;
  config?: Curve2DCommonConfigurations;
  _id?: number;
}) {
  let defaultPoints: number[] | React.RefObject<[number, number]>[] = [];
  if ("current" in from && "current" in to) {
    defaultPoints = [from, to];
  }
  if ("current" in to !== "current" in from) {
    if ("current" in to) {
      defaultPoints[0] = to.current[0];
      defaultPoints[1] = to.current[1];
    } else {
      defaultPoints[0] = to[0];
      defaultPoints[1] = to[1];
    }
    if ("current" in from) {
      defaultPoints[2] = from.current[0];
      defaultPoints[3] = from.current[1];
    } else {
      defaultPoints[2] = from[0];
      defaultPoints[3] = from[1];
    }

    console.warn(
      "Passing only one ref to Curve2DLineSegment will not allow it to update on change."
    );
  }
  const id = `curve-lineseg-${_id}`;
  return (
    <>
      <Curve2DCurveGeneric {...config} points={defaultPoints} id={id} />
    </>
  );
}

/** Draws a straght line given by the vector equation: start + t * dir, with t
 * in [0, infty]. */
export function Curve2DRay({
  from,
  dir,
  config,
  _id,
}: {
  from: [number, number];
  dir: [number, number];
  config?: Curve2DCommonConfigurations;
  fromLabel?: string;
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const points = useRef<number[]>([from[0], from[1], 0, 0]);
  const id = `curve-lineseg-${_id}`;

  const factory = (state: Curve2DState) => {
    return () => {
      // this guarantees the target is somewhere off screen
      points.current[2] = from[0] + (10 * dir[0]) / state.scale;
      points.current[3] = from[1] + (10 * dir[1]) / state.scale;
    };
  };

  useEffect(() => {
    ctx.registerRender(`curve-ray-${id}`, 100, factory);
  });

  return (
    <>
      <Curve2DCurveGeneric {...config} points={points} id={id} />
    </>
  );
}

/** Draws a straight line given by the vector equation: start + t * dir, with t
 * in [-infty, infty]. */
export function Curve2DLine({
  from,
  dir,
  config,
  _id,
}: {
  from: [number, number];
  dir: [number, number];
  config?: Curve2DCommonConfigurations;
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const points = useRef<number[]>([0, 0, 0, 0]);
  const id = `curve-lineseg-${_id}`;

  const factory = (state: Curve2DState) => {
    return () => {
      points.current = [
        from[0] - (10 * dir[0]) / state.scale,
        from[1] - (10 * dir[1]) / state.scale,
        from[0] + (10 * dir[0]) / state.scale,
        from[1] + (10 * dir[1]) / state.scale,
      ];
    };
  };

  useEffect(() => {
    ctx.registerRender(`curve-line-${id}`, 100, factory);
  });

  return (
    <>
      <Curve2DCurveGeneric {...config} points={points} id={id} />
    </>
  );
}
