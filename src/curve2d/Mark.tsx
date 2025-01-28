import { useContext, useEffect } from "react";
import { Curve2DContext, Curve2DState } from "./Base";
import { drawCircle } from "@/lib/curve2d/circle";
import { gridUnitsToScreenSpace } from "@/lib/curve2d/coords";
import { drawMarker } from "@/lib/curve2d/tooltip";

/** Draws circle at a point on the curve. */
export function Curve2DMark({
  x,
  y,
  text,
  _id,
}: {
  x: number;
  y: number;
  text?: string;
  _id?: number | string;
}) {
  const ctx = useContext(Curve2DContext);
  const render = (state: Curve2DState) => {
    const [sx, sy] = gridUnitsToScreenSpace(state, x, y);
    drawCircle(state, sx, sy, 4);
    if (text) {
      drawMarker(state, text, sx + 16, sy);
    }
  };
  const factory = (state: Curve2DState) => {
    return () => render(state);
  };
  useEffect(() => {
    ctx.registerRender(`mark-${_id}`, 10, factory);
  });

  return <></>;
}
