"use client";

import {
  Curve2D,
  Curve2DCurve,
  Curve2DGrid,
  Curve2DLineSegment,
  Curve2DMark,
  Curve2DMarkClosestFunc,
  type Curve2DMarkRef,
} from "easyplot";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import Link from "next/link";
import { useRef } from "react";

function ExampleCurve() {
  const transform = Curve2DMarkClosestFunc((x) => {
    const y = Math.sqrt(x ** 3 - x);
    return [y, -y];
  });

  const refR = useRef<Curve2DMarkRef>(null);
  const refNegR = useRef<Curve2DMarkRef>(null);
  const P = useRef<[number, number]>([-0.5, Math.sqrt(0.375)]);
  const Q = useRef<[number, number]>([0, 0]);
  const R = useRef<[number, number]>([2, -Math.sqrt(6)]);
  const negR = useRef<[number, number]>([2, Math.sqrt(6)]);

  const calc = () => {
    const [xp, yp] = P.current;
    const [xq, yq] = Q.current;
    const lambda = (yp - yq) / (xp - xq);
    const xr = lambda ** 2 - xp - xq;
    const yr = lambda * (xp - xr) - yp;
    R.current[0] = xr;
    R.current[1] = -yr;
    negR.current[0] = xr;
    negR.current[1] = yr;
    refR.current?.move(xr, -yr);
    refNegR.current?.move(xr, yr);
  };

  return (
    <Curve2D width={500} height={500} bgColor={[0.94, 0.98, 1.0, 1]}>
      <Curve2DCurve
        fun={(x) => Math.sqrt(x ** 3 - x)}
        config={{ color: [1, 0, 0, 1], hover: true }}
      />
      <Curve2DCurve
        fun={(x) => -Math.sqrt(x ** 3 - x)}
        config={{ color: [1, 0, 0, 1], hover: true }}
      />
      <Curve2DMark
        initialPos={P.current}
        label="P"
        transform={transform}
        movable
        onMove={(x, y) => {
          P.current[0] = x;
          P.current[1] = y;
          calc();
        }}
      />
      <Curve2DMark
        initialPos={Q.current}
        label="Q"
        transform={transform}
        movable
        onMove={(x, y) => {
          Q.current[0] = x;
          Q.current[1] = y;
          calc();
        }}
      />
      <Curve2DMark initialPos={R.current} label="R" ref={refR} />
      <Curve2DMark initialPos={negR.current} label="-R" ref={refNegR} />
      <Curve2DLineSegment from={P} to={R} config={{ color: [0, 1, 0, 1] }} />
      <Curve2DLineSegment
        from={R}
        to={negR}
        config={{ dashed: true, color: [1, 0, 1, 1] }}
      />
      <Curve2DGrid />
    </Curve2D>
  );
}

function Header() {
  return (
    <div className="w-screen h-[80vh] bg-gradient-to-l from-sky-50 to to-slate-300 flex items-center justify-center">
      <div className="grid grid-cols-2 space-x-4">
        <div style={{ width: 500, height: 500 }} className="self-center">
          <h1 className="text-6xl font-mono">Easyplot</h1>
          <p className="text-xl py-4">
            A lightweight mathematics visualization library for React. Test it
            out on the right!
          </p>

          <div className="pb-4 [&_pre]:h-[300px]">
            <DynamicCodeBlock
              lang="ts"
              code={`// elliptic curve addition visualization (some details omitted)
// try dragging the points on the right >>>
<Curve2D width={500} height={500}>
    <Curve2DCurve fun={(x) => Math.sqrt(x ** 3 - x)} />
    <Curve2DCurve fun={(x) => -Math.sqrt(x ** 3 - x)} />
    <Curve2DMark
      initialPos={P.current}
      label="P"
      transform={transform}
      movable
      onMove={(x, y) => { P.current[0] = x; P.current[1] = y; calc(); }}
    />
    <Curve2DMark
      initialPos={Q.current}
      label="Q"
      transform={transform}
      movable
      onMove={(x, y) => { Q.current[0] = x; Q.current[1] = y; calc(); }}
    />
    <Curve2DMark initialPos={[1, 0]} label="R" ref={refR} />
    <Curve2DMark initialPos={[1, 0]} label="-R" ref={refNegR} />
    <Curve2DLineSegment from={P} to={R} />
    <Curve2DLineSegment from={R} to={negR} />
    <Curve2DGrid />
  </Curve2D>

  const transform = Curve2DMarkClosestFunc((x) => {
    const y = Math.sqrt(x ** 3 - x);
    return [y, -y];
  });

  const calc = () => {
    const [xp, yp] = P.current;
    const [xq, yq] = Q.current;
    const lambda = (yp - yq) / (xp - xq);
    const xr = lambda ** 2 - xp - xq;
    const yr = lambda * (xp - xr) - yp;
    R.current[0] = xr;
    R.current[1] = -yr;
    negR.current[0] = xr;
    negR.current[1] = yr;
    refR.current?.move(xr, -yr);
    refNegR.current?.move(xr, yr);
  };

`}
            />
          </div>

          <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition">
            <Link href="/docs">Install & Docs</Link>
          </button>
        </div>

        <div style={{ width: 500, height: 500 }}>
          <ExampleCurve />
        </div>
      </div>
    </div>
  );
}

function Card({ title, content }: { title: string; content: string }) {
  return (
    <div className="prose">
      <h2 className="text-xl">{title}</h2>
      <p>{content}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="pt-4">
      <Header />

      <div className="w-screen h-[80dvh] m-16">
        <div className="container">
          <h1 className="text-4xl">Why easyplot?</h1>

          <div className="grid grid-cols-3">
            <Card
              title="It's performant"
              content="Written in webgl-2 with no regard for backwards compatibility, easyplot is blazingly fast."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
