// 在真浏览器里看网站：无头 Chrome（临时配置目录，跑完删掉、Chrome 关掉），通过 DevTools 协议驱动。
//   node scripts/browser-check.mjs [网站地址] [截图目录]
// 先 npm run preview（4420 端口），跑完自己关。做两件事：
//   1. 截图：/、/001/、/196/、/about/、选了分类和主题的图鉴、往下滚过的图鉴，1440 和 390 宽，亮色和暗色
//   2. 筛选：打字搜索、切分类、点主题、收藏一张、切到「收藏」、刷新、后退，每一步记下网址和看得见的卡片数，不对就退出码 1
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://127.0.0.1:4420").replace(/\/$/, "");
const SHOTS = process.argv[3] || join(process.cwd(), ".build/shots");
const CHROME = process.env.CHROME_EXE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(SHOTS, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "xxd-layout-chrome-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore", detached: true });
const cleanup = () => {
  try { process.kill(-chrome.pid, "SIGKILL"); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  rmSync(profile, { recursive: true, force: true });
};
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));

// ---------- 最小的 CDP 客户端 ----------
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(t.webSocketDebuggerUrl);
  } catch { await sleep(200); }
}
if (!ws) throw new Error("Chrome 没起来");
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
const waiters = [];
const errors = []; // 页面里抛出的 JS 异常
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
  } else if (msg.method) {
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
    for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg.params); }
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const js = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
await send("Runtime.enable");

async function setView(width, scheme) {
  const mobile = width < 600;
  await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
}
async function go(url) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await settle();
}
// 等看得见的图片都加载完
async function settle() {
  for (let i = 0; i < 60; i++) {
    const ok = await js(`[...document.images].filter((im) => { const r = im.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).every((im) => im.complete)`);
    if (ok) break;
    await sleep(100);
  }
  await sleep(250);
}
async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  const file = join(SHOTS, `${name}.png`);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

// ---------- 1. 截图 ----------
const pages = [["home", "/"], ["001", "/001/"], ["196", "/196/"], ["about", "/about/"], ["category", "/?c=01-composition-logic&s=classic-rules"], ["scrolled", "/?c=05-web-ui", 1600]];
const files = [];
for (const width of [1440, 390]) {
  for (const scheme of ["light", "dark"]) {
    await setView(width, scheme);
    for (const [name, path, y] of pages) {
      await go(BASE + path);
      if (y) { await js(`scrollTo(0, ${y})`); await settle(); }
      files.push(await shot(`${name}-${width}-${scheme}`));
    }
  }
}
console.log(`截图 ${files.length} 张：${SHOTS}`);

// ---------- 2. 筛选 ----------
await setView(1440, "light");
const visible = () => js(`document.querySelectorAll("#atlas-grid .atlas-card:not([hidden])").length`);
const url = () => js(`location.pathname + decodeURIComponent(location.search)`);
async function click(selector) {
  const box = await js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) throw new Error(`找不到 ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
  await sleep(50);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await sleep(150);
}
const steps = [];
const failures = [];
async function step(label, expect) {
  const row = { label, url: await url(), cards: await visible() };
  steps.push(row);
  const problem = expect(row);
  if (problem) failures.push(`${label}：${problem}（网址 ${row.url}，卡片 ${row.cards}）`);
}

await go(BASE + "/");
await js(`localStorage.clear()`);
await go(BASE + "/");
await step("打开图鉴", (r) => (r.cards === 350 && r.url === "/" ? "" : "应该是 / 和 350 张"));
await click("#site-q");
await send("Input.insertText", { text: "网格" });
await sleep(200);
await step("搜索「网格」", (r) => (r.url === "/?q=网格" && r.cards > 0 && r.cards < 350 ? "" : "网址应带 q，卡片变少"));
const searched = steps.at(-1).cards;
await click('#atlas-tabs [data-value="04-type-grid-cjk"]');
await step("切到「字体、网格与东亚文字」", (r) => (r.url === "/?c=04-type-grid-cjk&q=网格" && r.cards > 0 && r.cards <= searched ? "" : "网址应带 c 和 q"));
await click('.atlas-subs__group[data-cat="04-type-grid-cjk"] [data-sub="grid-systems"]');
await step("点主题「网格系统」", (r) => (r.url === "/?c=04-type-grid-cjk&s=grid-systems&q=网格" && r.cards > 0 ? "" : "网址应带 s"));
const first = await js(`document.querySelector("#atlas-grid .atlas-card:not([hidden])").dataset.id`);
await click(`#atlas-grid .atlas-card[data-id="${first}"] .atlas-fav`);
const stored = await js(`localStorage.getItem("xxd-layout-fav")`);
const pressed = await js(`document.querySelector('#atlas-grid .atlas-card[data-id="${first}"] .atlas-fav').getAttribute("aria-pressed")`);
steps.push({ label: `收藏 ${first}`, url: await url(), cards: await visible(), stored, pressed });
if (stored !== JSON.stringify([first]) || pressed !== "true") failures.push(`收藏没存上：localStorage=${stored}，aria-pressed=${pressed}`);
await click('#atlas-tabs [data-value="fav"]');
await step("切到「收藏」", (r) => (r.url === "/?fav=1&q=网格" && r.cards === 1 ? "" : "应该只剩收藏的 1 张"));
const reloaded = once("Page.loadEventFired");
await send("Page.reload");
await reloaded;
await settle();
await step("刷新", (r) => (r.url === "/?fav=1&q=网格" && r.cards === 1 ? "" : "刷新后应该还是收藏的 1 张"));
const restored = await js(`({ tab: document.querySelector('#atlas-tabs [aria-selected="true"]').dataset.value, q: document.getElementById("site-q").value, count: document.getElementById("atlas-count").textContent })`);
steps.at(-1).restored = restored;
if (restored.tab !== "fav" || restored.q !== "网格") failures.push(`刷新后界面没恢复：${JSON.stringify(restored)}`);
await js(`history.back()`);
await sleep(300);
await step("后退", (r) => (r.url === "/?c=04-type-grid-cjk&s=grid-systems&q=网格" ? "" : "后退应回到主题"));
await click("#site-q");
await js(`document.getElementById("site-q").select()`);
await send("Input.insertText", { text: "zzzz" });
await sleep(200);
const empty = await js(`!document.getElementById("atlas-empty").hidden && document.getElementById("atlas-empty-title").textContent`);
await step("搜不到", (r) => (r.cards === 0 && empty ? "" : "应该显示空状态"));
steps.at(-1).empty = empty;

// 详情页：切第二版、打开查看器、→ 翻页
await go(BASE + "/196/");
await click('#poster-version [data-value="1"]');
const v2 = await js(`document.getElementById("poster").getAttribute("src")`);
await click("#poster-open");
await sleep(300);
const viewer = await js(`!!document.querySelector("dialog.xxd-viewer[open]") && document.querySelector("dialog.xxd-viewer img").getAttribute("src")`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(300);
const nav = once("Page.loadEventFired");
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await Promise.race([nav, sleep(3000)]);
const after = await js(`location.pathname`);
steps.push({ label: "详情 196", second: v2, viewer, arrowRight: after });
if (!/196-2\.webp/.test(v2 || "")) failures.push(`第二版没切过去：${v2}`);
if (!/196-2\.webp/.test(viewer || "")) failures.push(`查看器没打开第二版：${viewer}`);
if (after !== "/197/") failures.push(`→ 没翻到 197：${after}`);

for (const s of steps) console.log(JSON.stringify(s));
for (const e of errors) failures.push(`页面报错：${String(e).split("\n")[0]}`);
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  process.exit(1);
}
console.log("✓ 浏览器检查通过");
process.exit(0);
