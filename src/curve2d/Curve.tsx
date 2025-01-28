import { useContext, useEffect, useRef } from "react";
import { Curve2DContext, Curve2DState } from "./Base";
import { Curve2DCurveGeneric } from "./CurveGeneric";

export function Curve2DCurve({
  fun,
  steps = 100,
  color,
  hover = true,
  _id,
}: {
  /** The function to plot. */
  fun: (x: number) => number;
  /** The approximate number of points to plot.*/
  steps?: number;
  color?: [number, number, number, number];
  hover?: boolean;
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const points = useRef<number[]>([]);
  const id = `curve-${_id}`;

  let prevKey = "";
  let prevPoints: number[] = [];
  const calcPoints = (state: Curve2DState) => {
    const { xmax, xmin, ymax, ymin } = state.canvasRange;
    const key = `${xmax}-${xmin}-${ymax}-${ymin}`;
    if (key === prevKey) {
      return prevPoints;
    }

    const points = [];
    // approximate step size
    const defaultStepSize = (xmax - xmin) / steps;
    let stepSize = defaultStepSize;

    let prevy = 0;
    for (let x = xmin; x <= xmax; ) {
      const y = fun(x);
      if (y > ymax || y < ymin) {
        points.push(x, NaN);
      } else {
        points.push(x, y);
      }

      let gradient = Math.abs((prevy - y) / stepSize);
      if (gradient < 1) {
        gradient = 1;
      }
      if (gradient > 1000) {
        gradient = 1000;
      }
      stepSize = defaultStepSize / gradient;
      prevy = y;
      x += stepSize;
    }

    prevPoints = points;
    prevKey = key;

    return points;
  };

  const render = (state: Curve2DState) => {
    const { _points } = state;

    points.current = calcPoints(state);
    _points.set(id, points.current);
  };

  const factory = (state: Curve2DState) => {
    return () => render(state);
  };

  useEffect(() => {
    ctx.registerRender(id, 10, factory);
  });

  return (
    <Curve2DCurveGeneric points={points} color={color} hover={hover} id={id} />
  );
}
