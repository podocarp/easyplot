import type { Curve2DState } from "@/curve2d/Base";

/** Takes grid units and converts into clip space [-1, 1] */
export function gridUnitsToClipSpace(
  state: Curve2DState,
  x: number,
  y: number
) {
  const { xmax, xmin, ymax, ymin } = state.canvasRange;

  const ratioX = (x - xmin) / (xmax - xmin);
  const ratioY = (y - ymin) / (ymax - ymin);
  return [ratioX * 2 - 1, ratioY * 2 - 1];
}
