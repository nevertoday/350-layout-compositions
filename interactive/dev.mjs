// 边改边看：node dev.mjs，打开 http://127.0.0.1:4430/（PORT 可改）
// 打开某页时现打这一页（和 npm run build 是同一份产物），pages/ 或 lib/ 一改，打开着的页面自动刷新。
// 端口上已经有一个 dev 在跑，就直接用它、不再起第二个。谁起的谁关：Ctrl-C，或 kill 它打印的 PID。
import { readFileSync, watch } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { buildPage, describe, listPages, PAGES, ROOT } from "./build.mjs";

const PORT = Number(process.env.PORT || 4430);
const URL_BASE = `http://127.0.0.1:${PORT}/`;

const running = await fetch(`${URL_BASE}__dev`).then((r) => r.ok, () => false);
if (running) {
  console.log(`已经有一个 dev 在跑：${URL_BASE}（用它就行，不用再起）`);
  process.exit(0);
}

const clients = new Set();
let timer;
for (const dir of [PAGES, join(ROOT, "lib")]) {
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => clients.forEach((res) => res.write("data: reload\n\n")), 150);
  });
}
const RELOAD = `<script>new EventSource("/__events").onmessage = () => location.reload();</script>`;
const page = (res, status, html) => res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(html);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, URL_BASE).pathname);
  if (path === "/__dev") return res.end("xxd-interactive-dev");
  if (path === "/__events") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
    clients.add(res);
    return req.on("close", () => clients.delete(res));
  }
  const dirs = listPages();
  if (path === "/") return page(res, 200, `<!doctype html><meta charset="utf-8"><title>dev</title><ul>${dirs.map((d) => `<li><a href="/${d}.html">${d}</a>`).join("")}</ul>${RELOAD}`);
  const dir = dirs.find((d) => path === `/${d}.html`);
  if (!dir) return page(res, 404, "没有这一页");
  try {
    const report = await buildPage(dir);
    if (!report.cached) console.log(describe(report));
    page(res, 200, readFileSync(join(ROOT, report.file), "utf8").replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${RELOAD}</body>`));
  } catch (e) {
    page(res, 500, `<!doctype html><meta charset="utf-8"><pre style="white-space:pre-wrap">${String(e.stack || e).replace(/</g, "&lt;")}</pre>${RELOAD}`);
  }
}).listen(PORT, "127.0.0.1", () => console.log(`dev：${URL_BASE}  PID ${process.pid}  （用完自己关：kill ${process.pid}）`));
