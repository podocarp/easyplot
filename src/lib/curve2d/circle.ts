import { Curve2DState } from "@/curve2d/Base";

export function drawCircle(
  state: Curve2DState,
  canvasX: number,
  canvasY: number,
  radius: number = 5
) {
  state.ctx2d.fillStyle = "white";
  state.ctx2d.strokeStyle = "black";
  state.ctx2d.beginPath();
  state.ctx2d.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
  state.ctx2d.fill();
  state.ctx2d.stroke();
}
