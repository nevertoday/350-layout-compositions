// 检查构建好的 dist/：可以反复跑，有问题退出码是 1。
//   · 首页、关于、404 都在；目录里每个编号都有详情页，详情页正好这么多
//   · 每个页面里指向本站文件的 src / href / og:image / url(...)，在 dist 里都找得到
//   · 每个页面正好一个 h1
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { layouts } from "../src/data/atlas.js";

const DIST = join(process.cwd(), "dist");
const SITE = "https://layout.xiaoxiaodong.ai";
const problems = [];
const bad = (msg) => problems.push(msg);

if (!existsSync(DIST)) { console.error("✗ 没有 dist/：先 npm run build"); process.exit(1); }

const pages = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) pages.push(p.slice(DIST.length));
  }
};
walk(DIST);

for (const must of ["/index.html", "/about/index.html", "/404.html"]) if (!pages.includes(must)) bad(`缺页面 ${must}`);
const detail = new Set(pages.map((p) => p.match(/^\/(\d{3})\/index\.html$/)?.[1]).filter(Boolean));
for (const l of layouts) if (!detail.has(l.id)) bad(`编号 ${l.id} 没有详情页`);
const ids = new Set(layouts.map((l) => l.id));
for (const id of detail) if (!ids.has(id)) bad(`多出来的详情页 /${id}/（目录里没有这个编号）`);

// 站内地址 → dist 里的文件。/a/ → /a/index.html，/a → /a 或 /a/index.html；? 和 # 后面不管
const resolveLocal = (url) => {
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  if (path.endsWith("/")) return join(DIST, path, "index.html");
  const file = join(DIST, path);
  return existsSync(file) && statSync(file).isFile() ? file : join(DIST, path, "index.html");
};
const ATTR = /\s(?:src|href|content)="([^"]*)"|url\(\s*(?:&quot;|["'])?([^"')&]+)/g;
let links = 0;
const checked = new Map();
for (const page of pages) {
  const html = readFileSync(join(DIST, page), "utf8");
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(`${page} 有 ${h1} 个 h1`);
  for (const m of html.matchAll(ATTR)) {
    let url = (m[1] ?? m[2] ?? "").replace(/&amp;/g, "&");
    if (url.startsWith(SITE)) url = url.slice(SITE.length) || "/";
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    links++;
    if (!checked.has(url)) checked.set(url, existsSync(resolveLocal(url)));
    if (!checked.get(url)) bad(`${page} → ${url} 不存在`);
  }
}

const size = (dir) => readdirSync(dir).reduce((n, f) => n + statSync(join(dir, f)).size, 0);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`页面 ${pages.length} 个（详情 ${detail.size} / 目录 ${layouts.length}），站内链接 ${links} 处（不同地址 ${checked.size} 个），` +
  `图片 t ${mb(size(join(DIST, "t")))} · p ${mb(size(join(DIST, "p")))}`);
if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`✗ ${p}`);
  if (problems.length > 40) console.error(`… 一共 ${problems.length} 处`);
  process.exit(1);
}
console.log("✓ 检查通过：每个编号都有详情页，站内链接都在，每页一个 h1");
