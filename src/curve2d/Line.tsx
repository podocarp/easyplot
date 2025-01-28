import { useRef } from "react";
import { Curve2DMark } from "./Mark";
import { Curve2DCurveGeneric } from "./CurveGeneric";

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
      <Curve2DMark
        x={from[0]}
        y={from[1]}
        _id={`mark-1-${id}`}
        text={fromLabel}
      />
      <Curve2DMark x={to[0]} y={to[1]} _id={`mark-2-${id}`} text={toLabel} />
      <Curve2DCurveGeneric points={points} color={color} id={id} />
    </>
  );
}
