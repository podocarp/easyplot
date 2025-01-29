"use client";

import {
  Curve2D,
  Curve2DCurve,
  Curve2DGrid,
  Curve2DVerticalCursor,
} from "easyplot";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import Link from "next/link";

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

          <div className="pb-4">
            <DynamicCodeBlock
              lang="ts"
              code={`// it's as simple as
<Curve2D width={500} height={500} bgColor={[0.94, 0.98, 1.0, 1]}>
  <Curve2DCurve fun={(x) => 1 / x} />
  <Curve2DGrid />
</Curve2D>`}
            />
          </div>

          <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition">
            <Link href="/docs">Install & Docs</Link>
          </button>
        </div>

        <div style={{ width: 500, height: 500 }}>
          <Curve2D width={500} height={500} bgColor={[0.94, 0.98, 1.0, 1]}>
            <Curve2DCurve fun={(x) => Math.sqrt(x ** 3 - x)} hover />
            <Curve2DVerticalCursor />
            <Curve2DGrid />
          </Curve2D>
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
