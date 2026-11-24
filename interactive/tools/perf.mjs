// npm run perf [-- <label>]：手机竖屏 390×844、DPR 3、触屏、CPU 降速 4× 和 6×，每页量三段：
//   hero  打开后 8 秒（开场动画 + 静置）；
//   drag  手指在开场的主角玩具上左右来回拖 4 秒（ACTIVE=秒数 可改），量「动起来」时的帧率；
//   其余每块画布滚进来各 4 秒。
// 拖哪里：页面上有 data-perf-drag 的元素就从它中心起拖；没有就拖 .hero 里第一块够大（≥ 40px）的 canvas / svg，再没有就拖整页第一块。
// 列的意思：fps 是 requestAnimationFrame 的帧率中位数（主线程忙不忙）；drew 是其中真的画了东西的帧
//   （调了 WebGL 或 2D 画布的绘制、或者改了 DOM），只在变化时重画的页面静置时 drew 接近 0，这时的 fps 说明不了画得快不快，看 drag 那行。
// 软件渲染（悲观地模拟慢手机的显卡）：FLAGS="--use-angle=swiftshader --enable-unsafe-swiftshader" npm run perf；只量某几页：ONLY=004,005。
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, sleep } from "./cdp.mjs";
const [label = "now", ratesArg = "4,6", heroArg = "8", dir = new URL("../dist", import.meta.url).pathname] = process.argv.slice(2);
const rates = ratesArg.split(",").map(Number), heroS = +heroArg, activeS = +(process.env.ACTIVE || 4);
const PROBE = `(() => {
  window.__calls = 0;
  window.__dom = 0;
  const hook = (C, names) => { if (C) for (const m of names) { const f = C.prototype[m]; if (f) C.prototype[m] = function (...a) { window.__calls++; return f.apply(this, a); }; } };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) hook(C, ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced", "drawRangeElements"]);
  hook(window.CanvasRenderingContext2D, ["fill", "stroke", "fillRect", "strokeRect", "clearRect", "fillText", "strokeText", "drawImage", "putImageData"]);
  new MutationObserver((list) => (window.__dom += list.length)).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  window.__sample = (ms) => new Promise((res) => {
    const t = [], drew = []; const c0 = window.__calls; let c = c0, d = window.__dom; const end = performance.now() + ms;
    const tick = (now) => {
      t.push(now); drew.push(window.__calls !== c || window.__dom !== d); c = window.__calls; d = window.__dom;
      if (now < end) requestAnimationFrame(tick); else res({ t, drew, calls: window.__calls - c0 });
    };
    requestAnimationFrame(tick);
  });
})();`;
// 开场的主角玩具在哪、从哪起拖、左右拖多远
const TARGET = `(() => {
  const big = (el) => { const r = el.getBoundingClientRect(); return r.width >= 40 && r.height >= 40; };
  const el = document.querySelector("[data-perf-drag]") || [...document.querySelectorAll(".hero canvas, .hero svg")].find(big) || [...document.querySelectorAll("canvas, svg")].find(big);
  if (!el) return null;
  let r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) { el.scrollIntoView({ block: "nearest" }); r = el.getBoundingClientRect(); }
  let host = el;
  while (host.getBoundingClientRect().width < 200 && host.parentElement) host = host.parentElement;
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const a = Math.min(host.getBoundingClientRect().width * 0.3, x - 10, innerWidth - 10 - x);
  const hit = document.elementFromPoint(x, y);
  const name = (e) => e ? (e.id ? "#" + e.id : e.tagName.toLowerCase() + (e.classList[0] ? "." + e.classList[0] : "")) : "-";
  return { x, y, a, name: name(el), stray: el.contains(hit) ? "" : name(hit) };
})()`;
const stats = ({ t, drew, calls }) => {
  const iv = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
  const q = (p) => iv[Math.min(iv.length - 1, Math.floor(p * iv.length))];
  const frames = iv.length, n = drew.slice(1).filter(Boolean).length;
  return { fps: +(1000 / q(0.5)).toFixed(1), p95ms: +q(0.95).toFixed(1), maxMs: +iv[iv.length - 1].toFixed(0), frames, drew: n, callsPerDrew: +(calls / Math.max(1, n)).toFixed(1) };
};
// 一根手指从 (x, y) 起左右来回拖 ms 毫秒，两秒一个来回；按 60 Hz 的钟点发 touchmove（不是「发完再等 16 毫秒」，那样只有 30 来 Hz）
async function drag(b, { x, y, a }, ms) {
  const touch = (type, px) => b.send("Input.dispatchTouchEvent", { type, touchPoints: px == null ? [] : [{ x: px, y, id: 1 }] });
  await touch("touchStart", x);
  const t0 = Date.now();
  for (let k = 1; Date.now() - t0 < ms; k++) {
    await sleep(Math.max(0, t0 + k * 16.7 - Date.now()));
    await touch("touchMove", x + a * Math.sin(((Date.now() - t0) / 2000) * 2 * Math.PI));
  }
  await touch("touchEnd");
}
const rows = [];
const files = readdirSync(dir).filter((f) => /^(?!000-)\d{3}-.*\.html$/.test(f) && (!process.env.ONLY || process.env.ONLY.split(",").includes(f.slice(0, 3)))).sort();
let gpu = "";
for (const rate of rates) for (const f of files) {
  const b = await launch("perf", process.env.FLAGS ? process.env.FLAGS.split(" ") : []);
  await b.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
  await b.open(pathToFileURL(join(dir, f)).href, { w: 390, h: 844, dpr: 3, mobile: true });
  if (!gpu) gpu = await b.js(`(() => { const c = document.createElement("canvas").getContext("webgl"); const e = c && c.getExtension("WEBGL_debug_renderer_info"); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) + " | " + c.getParameter(e.UNMASKED_VENDOR_WEBGL) : "no debug info"; })()`);
  await b.send("Emulation.setCPUThrottlingRate", { rate });
  await sleep(500);
  const page = f.slice(0, 3);
  rows.push({ label, rate, page, section: "hero", ...stats(await b.js(`__sample(${heroS * 1000})`)) });
  const target = await b.js(TARGET);
  if (target) {
    await sleep(300);
    const sampled = b.js(`__sample(${activeS * 1000})`);
    await drag(b, target, activeS * 1000);
    rows.push({ label, rate, page, section: `drag ${target.name}${target.stray && ` (按到的是 ${target.stray})`}`, ...stats(await sampled) });
    await sleep(600);
  }
  const n = await b.js(`[...document.querySelectorAll("canvas")].length`);
  for (let i = 1; i < n; i++) {
    const name = await b.js(`(() => { const c = document.querySelectorAll("canvas")[${i}]; c.scrollIntoView({ block: "center" }); return (c.id || c.closest("section")?.id || "canvas" + ${i}); })()`);
    await sleep(1200);
    rows.push({ label, rate, page, section: name, ...stats(await b.js(`__sample(4000)`)) });
  }
  await b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  if (b.errors.length) console.error(f, "ERRORS", b.errors.slice(0, 3));
  b.kill();
}
console.log("GPU:", gpu);
console.table(rows);
writeFileSync(join(dir, `../.build/perf-${label}.json`), JSON.stringify({ gpu, rows }, null, 1));
