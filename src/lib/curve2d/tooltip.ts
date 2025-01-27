import { Curve2DState } from "@/curve2d/Base";

/** Attempts to draw a tooltip at the given coordinates. Defaults to top left
 * corner of the tooltip being at the given coordinates, but the tooltip will be
 * repositioned appropriately to fit into the canvas. */
export function drawTooltip(
  state: Curve2DState,
  text: string,
  canvasX: number,
  canvasY: number,
  padding: number = 0,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const { ctx2d } = state;
  ctx2d.textAlign = "left";
  ctx2d.font = "14px sans-serif";
  ctx2d.textBaseline = "top";
  const tooltipWidth = ctx2d.measureText(text).width + 2 * padding;
  const tooltipHeight = 14 * 1.3 + 2 * padding; // this seems to work fine

  const x = canvasX;
  const y = canvasY;

  ctx2d.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx2d.strokeStyle = "gray";
  state.ctx2d.beginPath();
  ctx2d.rect(x + offsetX, y + offsetY, tooltipWidth, tooltipHeight);
  ctx2d.fill();
  ctx2d.stroke();
  ctx2d.fillStyle = "black";
  ctx2d.fillText(text, x + padding + offsetX, y + padding + offsetY);
}

export function drawMarker(
  state: Curve2DState,
  text: string,
  canvasX: number,
  canvasY: number
) {
  const { ctx2d } = state;
  const padding = 2;
  ctx2d.font = "12px sans-serif";
  ctx2d.textAlign = "center";
  ctx2d.textBaseline = "middle";

  const tooltipWidth = ctx2d.measureText(text).width + 2 * padding;
  const tooltipHeight = 12 * 1.3 + 2 * padding;

  ctx2d.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx2d.fillRect(
    canvasX - tooltipWidth / 2,
    canvasY - tooltipHeight / 2,
    tooltipWidth,
    tooltipHeight
  );
  ctx2d.fillStyle = "black";
  ctx2d.fillText(text, canvasX, canvasY);
}
