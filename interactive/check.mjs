// 在真浏览器里打开 dist/*.html（file://，和收到文件的人双击一样），一页一页查：
//   node check.mjs              全部
//   node check.mjs --only 001   只查这几页（逗号分隔）
// 无头 Chrome（临时配置目录、自己的端口，跑完连进程组一起关），断网。每页查：
//   1. 六种屏幕：不横向溢出、有 viewport meta、没有报错、没有任何网络请求、内联字体都解得开；有 WebGL 画布的话滚完整页后每块都不是空白
//   2. 减少动态效果（1440×900、390×844）：同上，画布也要画出静止的一帧
//   3. 关掉 WebGL 再开一个 Chrome（1440×900、390×844）：没有报错、不溢出、正文还看得见
// 截图在 .build/shots/：<id>-<宽>x<高>.png、<id>-full.png（滚完以后的整页）、<id>-reduced-*.png、<id>-nowebgl-*.png
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const SHOTS = join(ROOT, ".build/shots");
const CHROME = process.env.CHROME_EXE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZE_TARGET = 2.5 * 1024 * 1024;
const VIEWPORTS = [
  { width: 1440, height: 900, dpr: 1, mobile: false },
  { width: 1024, height: 1366, dpr: 2, mobile: true },
  { width: 768, height: 1024, dpr: 2, mobile: true },
  { width: 390, height: 844, dpr: 3, mobile: true },
  { width: 844, height: 390, dpr: 3, mobile: true },
  { width: 2560, height: 1440, dpr: 1, mobile: false },
];
const SHORT = [VIEWPORTS[0], VIEWPORTS[3]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? (args[onlyAt + 1] || "").split(",").filter(Boolean) : null;
const files = (existsSync(DIST) ? readdirSync(DIST) : []).filter((f) => /^\d{3}-.*\.html$/.test(f) && (!only || only.includes(f.slice(0, 3)))).sort();
if (!files.length) {
  console.error(`dist/ 里没有${only ? ` ${only.join(", ")} 的` : ""}页面：先 npm run build${only ? ` -- --only ${only.join(",")}` : ""}`);
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

// 每页测试前注入：记下页面开过的 WebGL 画布，并让它保留画面，好读回像素
const PROBE = `(() => {
  window.__gl = [];
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const gl = /^(webgl2?|experimental-webgl)$/.test(type);
    const ctx = get.call(this, type, gl ? { ...opts, preserveDrawingBuffer: true } : opts);
    if (gl) window.__gl.push({ canvas: this, ok: !!ctx });
    return ctx;
  };
})();`;

// ---------- Chrome ----------
const browsers = [];
process.on("exit", () => browsers.forEach((b) => b.kill()));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));

async function launch(extra = []) {
  const profile = mkdtempSync(join(tmpdir(), "xxd-interactive-chrome-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", ...extra, "about:blank"], { stdio: "ignore", detached: true });
  const kill = () => {
    try { process.kill(-proc.pid, "SIGKILL"); } catch {}
    rmSync(profile, { recursive: true, force: true });
  };
  browsers.push({ kill });
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try { port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch { await sleep(100); }
  }
  if (!port) throw new Error("Chrome 没起来");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
  let seq = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) for (const fn of listeners.get(msg.method) || []) fn(msg.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) || []), fn]);
  const once = (method) => new Promise((resolve) => {
    const fn = (params) => { listeners.set(method, listeners.get(method).filter((f) => f !== fn)); resolve(params); };
    on(method, fn);
  });
  const js = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  // 每页的问题记在 page.problems 里，打开下一页前清空
  const page = { url: "", problems: [] };
  for (const domain of ["Page", "Runtime", "Network", "Log"]) await send(`${domain}.enable`);
  await send("Network.setBlockedURLs", { urls: ["http://*", "https://*", "ws://*", "wss://*"] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
  on("Network.requestWillBeSent", ({ request }) => {
    if (!/^(data|blob|about):/.test(request.url) && request.url !== page.url) page.problems.push(`网络请求 ${request.url.slice(0, 120)}`);
  });
  on("Network.webSocketCreated", ({ url }) => page.problems.push(`WebSocket ${url}`));
  on("Runtime.exceptionThrown", ({ exceptionDetails: e }) => page.problems.push(`异常 ${(e.exception?.description || e.text || "").split("\n")[0]}`));
  on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type === "error" || type === "assert") page.problems.push(`console.${type} ${args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`);
  });
  on("Log.entryAdded", ({ entry }) => { if (entry.level === "error") page.problems.push(`浏览器报错 ${entry.text.slice(0, 200)}`); });

  async function open(file, view, reduced) {
    await send("Emulation.setDeviceMetricsOverride", { width: view.width, height: view.height, deviceScaleFactor: view.dpr, mobile: view.mobile, screenOrientation: view.width > view.height ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 } });
    await send("Emulation.setTouchEmulationEnabled", view.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
    page.url = pathToFileURL(file).href;
    page.problems = [];
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: page.url });
    if ((await Promise.race([loaded.then(() => true), sleep(20000)])) !== true) page.problems.push("20 秒没加载完");
    await js(`document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))`);
    await sleep(900);
  }
  async function shot(name, full = false) {
    const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
    writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, "base64"));
  }
  return { send, js, open, shot, page, kill };
}

// ---------- 每种情况查什么 ----------
const overflow = (b) => b.js(`(() => { const w = document.scrollingElement.scrollWidth; return w > innerWidth ? w + " > " + innerWidth : ""; })()`);
const scrollThrough = (b) =>
  b.js(`(async () => {
    const step = Math.max(200, innerHeight * 0.8);
    for (let y = 0; y < document.scrollingElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo(0, document.scrollingElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
  })()`);
// 每块接在页面上的 WebGL 画布：缩到 32×32 读像素，颜色只有一种就算空白
const glCanvases = (b) =>
  b.js(`window.__gl.filter((g) => g.canvas.isConnected).map(({ canvas, ok }) => {
    if (!ok) return { ok, colors: 0 };
    const c = document.createElement("canvas"); c.width = c.height = 32;
    const x = c.getContext("2d"); x.drawImage(canvas, 0, 0, 32, 32);
    const d = x.getImageData(0, 0, 32, 32).data, seen = new Set();
    for (let i = 0; i < d.length; i += 4) seen.add(((d[i] >> 3) << 16) | ((d[i + 1] >> 3) << 8) | (d[i + 2] >> 3) | ((d[i + 3] >> 6) << 24));
    return { ok, colors: seen.size };
  })`);
const readable = (b) => b.js(`document.body.innerText.replace(/\\s+/g, "").length`);

async function visit(b, file, view, { reduced = false, name, full = false, webgl = true }) {
  const issues = [];
  await b.open(file, view, reduced);
  if (!(await b.js(`!!document.querySelector('meta[name="viewport"]')`))) issues.push("没有 viewport meta");
  const before = await overflow(b);
  if (before) issues.push(`横向溢出 ${before}`);
  await b.shot(name);
  await scrollThrough(b);
  const after = await overflow(b);
  if (after && !before) issues.push(`滚到底后横向溢出 ${after}`);
  const gl = await glCanvases(b);
  if (webgl) {
    if (gl.some((g) => !g.ok)) issues.push("WebGL 画布没建起来");
    else if (gl.some((g) => g.colors < 2)) issues.push(`WebGL 画布是空白（${gl.map((g) => g.colors).join("/")} 种颜色）`);
  } else if (gl.some((g) => g.ok)) issues.push("关了 WebGL 还建出了 WebGL 画布：检查没生效");
  const broken = await b.js(`Promise.allSettled([...document.fonts].map((f) => f.load())).then(() => [...document.fonts].filter((f) => f.status === "error").map((f) => f.family + " " + f.weight + " " + f.style))`);
  if (broken.length) issues.push(`字体解不开：${broken.join("、")}`);
  const chars = await readable(b);
  if (chars < 20) issues.push(`看得见的字只有 ${chars} 个`);
  if (full) {
    await b.js(`scrollTo(0, 0)`);
    await sleep(300);
    await b.shot(name.replace(/-\d+x\d+$/, "-full"), true);
  }
  issues.push(...b.page.problems);
  return { issues, gl: gl.length };
}

// ---------- 跑 ----------
const started = Date.now();
const rows = files.map((f) => ({ id: f.slice(0, 3), file: f, bytes: statSync(join(DIST, f)).size, cells: {}, failures: [] }));
for (const r of rows) for (const f of readdirSync(SHOTS)) if (f.startsWith(`${r.id}-`)) rmSync(join(SHOTS, f));
const record = (row, label, { issues, gl }) => {
  row.cells[label] = issues.length ? "✗" : gl ? `✓ gl${gl}` : "✓";
  for (const issue of new Set(issues)) row.failures.push({ label, issue });
};
const tag = (v) => `${v.width}x${v.height}`;

const normal = await launch();
if (!(await normal.js(`!!document.createElement("canvas").getContext("webgl2")`))) throw new Error("无头 Chrome 开不了 WebGL，查不了画布");
for (const r of rows) {
  const file = join(DIST, r.file);
  for (const v of VIEWPORTS) record(r, tag(v), await visit(normal, file, v, { name: `${r.id}-${tag(v)}`, full: v === VIEWPORTS[0] }));
  for (const v of SHORT) record(r, `reduced ${tag(v)}`, await visit(normal, file, v, { reduced: true, name: `${r.id}-reduced-${tag(v)}` }));
}
normal.kill();

const nogl = await launch(["--disable-webgl", "--disable-3d-apis"]);
if (await nogl.js(`!!(document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl"))`)) throw new Error("--disable-webgl 没生效");
for (const r of rows) for (const v of SHORT) record(r, `nowebgl ${tag(v)}`, await visit(nogl, join(DIST, r.file), v, { webgl: false, name: `${r.id}-nowebgl-${tag(v)}` }));
nogl.kill();

// ---------- 报告 ----------
const labels = Object.keys(rows[0].cells);
const header = ["页面", "大小", ...labels];
const table = rows.map((r) => [r.file, `${(r.bytes / 1024 / 1024).toFixed(2)} MB${r.bytes > SIZE_TARGET ? " ⚠" : ""}`, ...labels.map((l) => r.cells[l])]);
const widths = header.map((h, i) => Math.max(...[h, ...table.map((t) => t[i])].map((s) => [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0))));
const pad = (s, w) => s + " ".repeat(Math.max(0, w - [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0)));
for (const line of [header, ...table]) console.log(line.map((s, i) => pad(s, widths[i])).join("  "));
console.log(`\n截图：${SHOTS}（${((Date.now() - started) / 1000).toFixed(1)} 秒）`);
for (const r of rows) if (r.bytes > SIZE_TARGET) console.log(`⚠ ${r.file} 超过 2.5 MB 的目标`);
const failed = rows.filter((r) => r.failures.length);
for (const r of failed) {
  const where = new Map();
  for (const { label, issue } of r.failures) where.set(issue, [...(where.get(issue) || []), label]);
  for (const [issue, labels] of where) console.error(`✗ ${r.file}  ${issue}  [${labels.length === Object.keys(r.cells).length ? "全部" : labels.join("、")}]`);
}
console.log(failed.length ? `\n${failed.length} 页没通过` : "\n✓ 全部通过");
process.exit(failed.length ? 1 : 0);
