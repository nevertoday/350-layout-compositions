// 生成站点品牌静态图：public/og-cover.png（1200×630 分享卡片）与 public/apple-touch-icon.png（180×180 主屏图标）。
// 用本机无头 Chrome 渲染，风格与 xxd-ui-kit 的暖纸、墨色、直角、细线严格一致。
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SITE = process.cwd();
const CHROME = process.env.CHROME_EXE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9344;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const thumbData = (id) => `data:image/webp;base64,${readFileSync(join(SITE, "public/t", `${id}.webp`)).toString("base64")}`;
const SAMPLES = ["001", "015", "065", "119", "196", "285"];

const ogHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
  :root {
    --p: #fdfcfb;
    --paper: #ffffff;
    --ink: #111111;
    --muted: #6d6b67;
    --line: #ccc9c5;
    --wash: #f6f4f1;
    --font: "Avenir Next", "PingFang SC", -apple-system, sans-serif;
    --mono: ui-monospace, "SF Mono", Menlo, monospace;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--p); color: var(--ink); font-family: var(--font); }
  .card {
    display: grid; grid-template-columns: 540px 660px; width: 1200px; height: 630px;
    border: 1px solid var(--line);
  }
  .left {
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 52px 48px; border-right: 1px solid var(--line); background: var(--p);
  }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 18px; font-weight: 600; letter-spacing: 0.01em; }
  .mark {
    width: 32px; height: 32px; background: var(--ink); display: grid;
    grid-template-columns: 1fr 1fr; gap: 4px; padding: 6px;
  }
  .mark span { background: var(--paper); display: block; }
  .mark span:nth-child(2) { opacity: 0.72; }
  .mark span:nth-child(3) { opacity: 0.46; }
  .mark span:nth-child(4) { opacity: 0.22; }
  h1 { margin: 0; font-size: 62px; line-height: 1.12; font-weight: 600; letter-spacing: -0.02em; }
  .lead { margin: 20px 0 0; font-size: 22px; line-height: 1.5; color: var(--muted); font-weight: 400; }
  .meta { display: flex; flex-direction: column; gap: 10px; padding-top: 24px; border-top: 1px solid var(--line); }
  .stats { font-size: 16px; color: var(--ink); font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .domain { font-size: 15px; color: var(--muted); font-family: var(--mono); }
  .right {
    display: grid; grid-template-columns: repeat(3, 186px); grid-template-rows: repeat(2, 248px);
    place-content: center; gap: 16px; padding: 24px; background: var(--wash);
  }
  .tile {
    width: 186px; height: 248px; border: 1px solid var(--line); background: var(--paper); overflow: hidden;
  }
  .tile img { width: 100%; height: 100%; object-fit: contain; display: block; }
</style>
</head>
<body>
  <div class="card">
    <div class="left">
      <div class="brand">
        <span class="mark"><span></span><span></span><span></span><span></span></span>
        <span>小小东 · 版式工具箱</span>
      </div>
      <div>
        <h1>350 种排版</h1>
        <p class="lead">构图逻辑、视觉原则、出版广告、字体网格、网页 UI、影视构图、中国传统与演示文稿。</p>
      </div>
      <div class="meta">
        <div class="stats">350 种版式 · 8 个分类 · 33 个主题 · CC BY 4.0</div>
        <div class="domain">layout.xiaoxiaodong.ai</div>
      </div>
    </div>
    <div class="right">
      ${SAMPLES.map((id) => `<div class="tile"><img src="${thumbData(id)}" alt="" /></div>`).join("")}
    </div>
  </div>
</body>
</html>`;

const iconHtml = `<!doctype html>
<html>
<head><meta charset="utf-8" /><style>html,body{margin:0;width:180px;height:180px;overflow:hidden;}svg{display:block;width:180px;height:180px;}</style></head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
    <rect fill="#111111" width="18" height="18"/>
    <rect fill="#ffffff" x="4" y="4" width="4" height="4"/>
    <rect fill="#ffffff" x="10" y="4" width="4" height="4" opacity=".7"/>
    <rect fill="#ffffff" x="4" y="10" width="4" height="4" opacity=".45"/>
    <rect fill="#ffffff" x="10" y="10" width="4" height="4" opacity=".22"/>
  </svg>
</body>
</html>`;

const profile = mkdtempSync(join(tmpdir(), "xxd-brand-chrome-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"], { stdio: "ignore", detached: true });
const cleanup = () => {
  try { process.kill(-chrome.pid, "SIGKILL"); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  rmSync(profile, { recursive: true, force: true });
};
process.on("exit", cleanup);

let ws;
for (let i = 0; i < 40 && !ws; i++) {
  try {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(t.webSocketDebuggerUrl);
  } catch { await sleep(150); }
}
if (!ws) throw new Error("Chrome 启动失败");
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let seq = 0;
const pending = new Map();
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });

async function renderPng(html, width, height, outPath) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const htmlFile = join(profile, `${width}x${height}.html`);
  writeFileSync(htmlFile, html);
  await send("Page.navigate", { url: `file://${htmlFile}` });
  await sleep(500);
  const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  writeFileSync(outPath, Buffer.from(data, "base64"));
}

await send("Page.enable");
await renderPng(ogHtml, 1200, 630, join(SITE, "public/og-cover.png"));
await renderPng(iconHtml, 180, 180, join(SITE, "public/apple-touch-icon.png"));
console.log("✓ 生成 public/og-cover.png (1200×630) 与 public/apple-touch-icon.png (180×180)");
process.exit(0);
