"use client";

import { Curve2D, Curve2DCurve, Curve2DGrid } from "easyplot";

export default function Home() {
  return (
    <div>
      Hello world
      <Curve2D>
        <Curve2DGrid />
        <Curve2DCurve fun={(x) => Math.atan(x)} />
      </Curve2D>
    </div>
  );
}
