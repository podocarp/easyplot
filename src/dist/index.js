import r, { useRef as e, useEffect as o } from "react";
function t() {
  const t = e(null);
  return (
    o(() => {
      const r = t.current;
      if (null === r) return;
      const e = r.getContext("webgl");
      if (!e) return void console.error("WebGL not supported");
      const o = (r, o) => {
          const t = e.createShader(r);
          return null === t
            ? (console.error("could not create shader", o), null)
            : (e.shaderSource(t, o),
              e.compileShader(t),
              e.getShaderParameter(t, e.COMPILE_STATUS)
                ? t
                : (console.error(e.getShaderInfoLog(t)),
                  e.deleteShader(t),
                  null));
        },
        n = o(
          e.VERTEX_SHADER,
          "\n      attribute vec2 a_position;\n      void main() {\n        gl_Position = vec4(a_position, 0, 1);\n      }\n    "
        );
      if (null === n)
        return void console.error("Cannot compile vertex shader.");
      const a = o(
        e.FRAGMENT_SHADER,
        "\n      precision mediump float;\n      void main() {\n        gl_FragColor = vec4(1, 0, 0, 1); // Red color\n      }\n    "
      );
      if (null === a)
        return void console.error("Cannot compile fragment shader.");
      const c = e.createProgram();
      if (
        (e.attachShader(c, n),
        e.attachShader(c, a),
        e.linkProgram(c),
        !e.getProgramParameter(c, e.LINK_STATUS))
      )
        return void console.error(e.getProgramInfoLog(c));
      e.useProgram(c);
      const i = [];
      for (let r = 0; r <= 1; r += 0.01) {
        const e = 2 * r - 1,
          o = Math.sin(2 * Math.PI * r);
        i.push(e, o);
      }
      const l = e.createBuffer();
      e.bindBuffer(e.ARRAY_BUFFER, l),
        e.bufferData(e.ARRAY_BUFFER, new Float32Array(i), e.STATIC_DRAW);
      const s = e.getAttribLocation(c, "a_position");
      e.enableVertexAttribArray(s),
        e.vertexAttribPointer(s, 2, e.FLOAT, !1, 0, 0),
        e.clearColor(0, 0, 0, 1),
        e.clear(e.COLOR_BUFFER_BIT),
        e.drawArrays(e.LINE_STRIP, 0, i.length / 2);
    }, []),
    r.createElement("canvas", { ref: t, width: 800, height: 600 })
  );
}
export { t as WebGLCurve };
//# sourceMappingURL=index.js.map
