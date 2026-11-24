// npm run perf [-- <label>]：手机竖屏 390×844、DPR 3、触屏、CPU 降速 4× 和 6×，量每页开场画面 8 秒的帧率，再把其余画布滚进来各量 4 秒。
// 软件渲染（悲观地模拟慢手机的显卡）：FLAGS="--use-angle=swiftshader --enable-unsafe-swiftshader" npm run perf；只量某几页：ONLY=004,005。
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, sleep } from "./cdp.mjs";
const [label = "now", ratesArg = "4,6", heroArg = "8", dir = new URL("../dist", import.meta.url).pathname] = process.argv.slice(2);
const rates = ratesArg.split(",").map(Number), heroS = +heroArg;
const PROBE = `(() => {
  window.__draws = 0;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (C) for (const m of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
    const f = C.prototype[m]; if (f) C.prototype[m] = function (...a) { window.__draws++; return f.apply(this, a); };
  }
  window.__sample = (ms) => new Promise((res) => {
    const t = []; const d0 = window.__draws; const end = performance.now() + ms;
    const tick = (now) => { t.push(now); if (now < end) requestAnimationFrame(tick); else res({ t, draws: window.__draws - d0 }); };
    requestAnimationFrame(tick);
  });
})();`;
const stats = ({ t, draws }) => {
  const iv = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
  const q = (p) => iv[Math.min(iv.length - 1, Math.floor(p * iv.length))];
  const frames = iv.length;
  return { medFps: +(1000 / q(0.5)).toFixed(1), p95ms: +q(0.95).toFixed(1), maxMs: +iv[iv.length - 1].toFixed(0), frames, drawsPerFrame: +(draws / Math.max(1, frames)).toFixed(1) };
};
const rows = [];
const files = readdirSync(dir).filter((f) => /^(?!000-)\d{3}-.*\.html$/.test(f) && (!process.env.ONLY || process.env.ONLY.split(",").includes(f.slice(0, 3)))).sort();
let gpu = "";
for (const rate of rates) for (const f of files) {
  const b = await launch(process.env.FLAGS ? process.env.FLAGS.split(" ") : []);
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
  await b.open(pathToFileURL(join(dir, f)).href, { w: 390, h: 844, dpr: 3, mobile: true });
  if (!gpu) gpu = await b.js(`(() => { const c = document.createElement("canvas").getContext("webgl"); const e = c && c.getExtension("WEBGL_debug_renderer_info"); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) + " | " + c.getParameter(e.UNMASKED_VENDOR_WEBGL) : "no debug info"; })()`);
  await b.send("Emulation.setCPUThrottlingRate", { rate });
  await sleep(500);
  const hero = stats(await b.js(`__sample(${heroS * 1000})`));
  rows.push({ label, rate, page: f.slice(0, 3), section: "hero", ...hero });
  const n = await b.js(`[...document.querySelectorAll("canvas")].length`);
  for (let i = 1; i < n; i++) {
    const name = await b.js(`(() => { const c = document.querySelectorAll("canvas")[${i}]; c.scrollIntoView({ block: "center" }); return (c.id || c.closest("section")?.id || "canvas" + ${i}); })()`);
    await sleep(1200);
    const s = stats(await b.js(`__sample(4000)`));
    rows.push({ label, rate, page: f.slice(0, 3), section: name, ...s });
  }
  await b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  if (b.errors.length) console.error(f, "ERRORS", b.errors.slice(0, 3));
  b.kill();
}
console.log("GPU:", gpu);
console.table(rows);
writeFileSync(join(dir, `../.build/perf-${label}.json`), JSON.stringify({ gpu, rows }, null, 1));
