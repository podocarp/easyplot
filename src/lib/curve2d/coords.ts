import type { Curve2DState } from "@/curve2d/Base";

/** Takes grid units and converts into clip space [-1, 1] */
export function gridUnitsToClipSpace(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  const { xmax, xmin, ymax, ymin } = state.canvasRange;

  const ratioX = (x - xmin) / (xmax - xmin);
  const ratioY = (y - ymin) / (ymax - ymin);
  return [ratioX * 2 - 1, ratioY * 2 - 1];
}

export function clipSpaceToGridUnits(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  // translate from (-1, 1) to (0, 1)
  const normx = (x + 1) / 2;
  const normy = (y + 1) / 2;
  const { xmax, xmin, ymax, ymin } = state.canvasRange;
  return [xmin + (xmax - xmin) * normx, ymin + (ymax - ymin) * normy];
}

export function clipSpaceToScreenSpace(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  // convert from [-1, 1] to [0, 1]
  const normx = (x + 1) / 2;
  const normy = (1 - y) / 2;
  const { height, width } = state.canvas;
  return [height * normx, width * normy];
}

/** Takes grid units and converts into screen space (canvas coordinates) with
 * upper left corner at (0, 0) and bottom right corner at (width, height). */
export function gridUnitsToScreenSpace(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  const [clipx, clipy] = gridUnitsToClipSpace(state, x, y);
  return clipSpaceToScreenSpace(state, clipx, clipy);
}

export function screenSpaceToClipSpace(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  const { width, height } = state.canvas;
  return [x / (width / 2) - 1, 1 - y / (height / 2)];
}

export function screenSpaceToGridUnits(
  state: Curve2DState,
  x: number,
  y: number
): [number, number] {
  const [clipx, clipy] = screenSpaceToClipSpace(state, x, y);
  return clipSpaceToGridUnits(state, clipx, clipy);
}

export function distSq(x1: number, y1: number, x2: number, y2: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}
