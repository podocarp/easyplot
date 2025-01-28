import { useContext, useEffect, useRef } from "react";
import { Curve2DMark } from "./Mark";
import { Curve2DCurveGeneric } from "./CurveGeneric";
import { Curve2DContext, Curve2DState } from "./Base";

export function Curve2DLineSegment({
  from,
  to,
  color,
  fromLabel,
  toLabel,
  _id,
}: {
  from: [number, number];
  to: [number, number];
  color?: [number, number, number, number];
  fromLabel?: string;
  toLabel?: string;
  _id?: number;
}) {
  const points = useRef<number[]>([from[0], from[1], to[0], to[1]]);
  const id = `curve-lineseg-${_id}`;

  return (
    <>
      {fromLabel && (
        <Curve2DMark
          x={from[0]}
          y={from[1]}
          _id={`mark-1-${id}`}
          text={fromLabel}
        />
      )}
      {toLabel && (
        <Curve2DMark x={to[0]} y={to[1]} _id={`mark-2-${id}`} text={toLabel} />
      )}
      <Curve2DCurveGeneric points={points} color={color} id={id} />
    </>
  );
}

export function Curve2DRay({
  from,
  dir,
  color,
  fromLabel,
  _id,
}: {
  from: [number, number];
  dir: [number, number];
  color?: [number, number, number, number];
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
      {fromLabel && (
        <Curve2DMark
          x={from[0]}
          y={from[1]}
          _id={`mark-1-${id}`}
          text={fromLabel}
        />
      )}
      <Curve2DCurveGeneric points={points} color={color} id={id} />
    </>
  );
}

export function Curve2DLine({
  from,
  dir,
  color,
  _id,
}: {
  from: [number, number];
  dir: [number, number];
  color?: [number, number, number, number];
  _id?: number;
}) {
  const ctx = useContext(Curve2DContext);
  const points = useRef<number[]>([from[0], from[1], 0, 0]);
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
      <Curve2DCurveGeneric points={points} color={color} id={id} />
    </>
  );
}
