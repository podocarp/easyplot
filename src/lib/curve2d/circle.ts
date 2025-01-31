import { Curve2DState } from "@/curve2d/Base";

export function drawCircle(
  state: Curve2DState,
  canvasX: number,
  canvasY: number,
  radius: number = 5
) {
  const { ctx2d, dpiratio: ratio } = state;
  ctx2d.shadowBlur = 3;
  ctx2d.shadowColor = "gray";
  ctx2d.fillStyle = "white";
  ctx2d.strokeStyle = "black";
  ctx2d.lineWidth = 1;
  ctx2d.beginPath();
  ctx2d.arc(canvasX / ratio, canvasY / ratio, radius, 0, 2 * Math.PI);
  ctx2d.fill();
  ctx2d.stroke();
}
