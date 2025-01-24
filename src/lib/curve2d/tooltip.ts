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
  offset: number = 0
) {
  const {
    ctx2d,
    canvasRange: { width, height },
  } = state;
  ctx2d.textAlign = "left";
  ctx2d.font = "14px sans-serif";
  ctx2d.textBaseline = "top";
  const tooltipWidth = ctx2d.measureText(text).width + 2 * padding;
  const tooltipHeight = 14 * 1.25 + 2 * padding; // this seems to work fine

  let x = canvasX;
  let y = canvasY;

  const botLeftOOB = canvasY + tooltipHeight > height;
  const topRightOOB = canvasX + tooltipWidth > width;
  const botRightOOB = canvasY + tooltipHeight > height;

  if (topRightOOB && botRightOOB) {
    x = x - tooltipWidth;
    y = y - tooltipHeight;
  } else if (topRightOOB) {
    x = x - tooltipWidth - padding;
  } else if (botLeftOOB) {
    y = y - tooltipHeight - padding;
  }

  ctx2d.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx2d.fillRect(x + offset, y + offset, tooltipWidth, tooltipHeight);
  ctx2d.fillStyle = "black";
  ctx2d.fillText(text, x + padding + offset, y + padding + offset);
}
