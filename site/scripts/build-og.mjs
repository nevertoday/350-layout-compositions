// 每种版式两张分享卡片（1200×630，X / 微信等的 summary_large_image 大图）：
//   public/og/<id>.jpg       详情页 /<id>/：左边编号、标题、一句话，右边整张海报（X 会把竖图裁成中间一条，所以不直接用海报）
//   public/og/<id>-play.jpg  互动版 /<id>/play/：左边同样的字加「互动版」，右边是互动页 1440×900 的真实画面，左下压一张小海报
// 互动页的 og: 标签由 interactive/build.mjs 写进页面，指向这里的 -play.jpg。
// 可以反复跑：.build/og.json 记着每张卡用的输入（海报、互动页 HTML、文字、模板）的 sha256，对得上就跳过；
// 先渲染到临时文件再改名；目录里多出来的旧卡会删掉。无头 Chrome 用 interactive/tools/cdp.mjs，进程结束时连配置目录一起清掉。
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { categories, layouts, playPages } from "../src/data/atlas.js";
import { launch, sleep } from "../../interactive/tools/cdp.mjs";

const SITE = process.cwd();
const OUT = join(SITE, "public/og");
const TMP = join(SITE, ".build/og-tmp");
const MANIFEST = join(SITE, ".build/og.json");
const VERSION = "3"; // 改了模板就加一，全部重画
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1].split(",") : null;

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(readFileSync(MANIFEST, "utf8")); } catch {}
const save = () => { writeFileSync(MANIFEST + ".tmp", JSON.stringify(manifest, null, 1)); renameSync(MANIFEST + ".tmp", MANIFEST); };
const sha = (...parts) => { const h = createHash("sha256"); for (const p of parts) h.update(p); return h.digest("hex"); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`;

const subName = new Map(categories.flatMap((c) => c.subs.map((s) => [`${c.slug}/${s.slug}`, `${c.name} · ${s.name}`])));
const playById = new Map(playPages.map((p) => [p.id, p.file]));
// 海报上的标题带空格（「全图页 幻灯片版式」），换行就落在空格上
const POSTER_TEXT = JSON.parse(readFileSync(join(SITE, "src/data/poster-text.json"), "utf8"));
const titleOf = (l) => POSTER_TEXT[l.id]?.title || l.nameZh || l.name;

// 标题按字数挑字号：一行放得下（字号不小于 54）就一行，否则两行
const titleSize = (name, width) => {
  const units = [...name].reduce((n, ch) => n + (/[\u0000-\u00ff]/.test(ch) ? 0.55 : 1), 0);
  const one = Math.min(76, Math.floor(width / units / 2) * 2);
  if (one >= 54) return one;
  return Math.max(38, Math.min(68, Math.floor((width * 1.8) / units / 2) * 2));
};
// 海报上的一句话按版面断过行，汉字之间留着空格
const tidy = (s) => String(s || "").replace(/([\u3000-\u9fff\uff00-\uffef])\s+(?=[\u3000-\u9fff\uff00-\uffef])/g, "$1");

const STYLE = `
  :root { --p:#fdfcfb; --ink:#111111; --muted:#5f5d59; --line:#ccc9c5; --wash:#f1eee9;
    --font:"Avenir Next","PingFang SC",-apple-system,sans-serif; --mono:ui-monospace,"SF Mono",Menlo,monospace; }
  * { box-sizing:border-box; }
  html,body { margin:0; width:1200px; height:630px; overflow:hidden; background:var(--p); color:var(--ink); font-family:var(--font); }
  .card { display:grid; width:1200px; height:630px; }
  .left { padding:48px 44px 40px 48px; display:flex; flex-direction:column; justify-content:space-between; border-right:1px solid var(--line); min-width:0; }
  .brand { display:flex; align-items:center; gap:12px; font-size:17px; font-weight:600; }
  .mark { width:28px; height:28px; background:var(--ink); display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:6px; }
  .mark span { background:var(--p); }
  .mark span:nth-child(2){opacity:.7} .mark span:nth-child(3){opacity:.45} .mark span:nth-child(4){opacity:.22}
  .kicker { display:flex; align-items:center; gap:10px; font:500 15px/1.4 var(--mono); color:var(--muted); letter-spacing:.02em; margin-bottom:18px; }
  .no { color:var(--ink); font-weight:600; }
  .tag { background:var(--ink); color:var(--p); font:600 15px/1 var(--font); padding:7px 10px; letter-spacing:.04em; }
  h1 { margin:0; font-weight:600; line-height:1.12; letter-spacing:-.01em; word-break:keep-all; overflow-wrap:anywhere; text-wrap:balance; }
  .en { margin-top:14px; font:500 15px/1.4 var(--mono); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
  .lead { margin:22px 0 0; font-size:21px; line-height:1.5; color:var(--muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .meta { display:flex; justify-content:space-between; gap:16px; padding-top:20px; border-top:1px solid var(--line); font:500 15px/1.4 var(--mono); color:var(--muted); }
  .meta b { color:var(--ink); font-weight:600; }
  .right { background:var(--wash); position:relative; overflow:hidden; display:grid; place-items:center; }
  .poster { height:566px; width:auto; border:1px solid var(--line); display:block; }
  .shot { width:676px; height:423px; border:1px solid var(--line); display:block; object-fit:cover; object-position:top; }
  .mini { position:absolute; left:26px; bottom:26px; width:132px; border:1px solid var(--line); display:block; }
`;

function card(l, { play, shot }) {
  const left = play ? 452 : 560;
  const name = titleOf(l);
  const size = titleSize(name, left - 92);
  const thumb = dataUrl(join(SITE, "public/t", `${l.id}.webp`), "image/webp");
  const right = play
    ? `<img class="shot" src="${shot}" alt="" /><img class="mini" src="${thumb}" alt="" />`
    : `<img class="poster" src="${dataUrl(join(SITE, "public/p", `${l.id}.webp`), "image/webp")}" alt="" />`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><style>${STYLE}</style></head><body>
  <div class="card" style="grid-template-columns:${left}px 1fr">
    <div class="left">
      <div class="brand"><span class="mark"><span></span><span></span><span></span><span></span></span><span>小小东 · 350 种排版</span></div>
      <div>
        <div class="kicker"><span class="no">No.${l.id}</span>${play ? `<span class="tag">互动版</span>` : `<span>${esc(subName.get(`${l.cat}/${l.sub}`) || "")}</span>`}</div>
        <h1 style="font-size:${size}px">${esc(name)}</h1>
        <div class="en">${esc(l.nameEn || "")}</div>
        ${l.summary ? `<p class="lead">${esc(tidy(l.summary))}</p>` : ""}
      </div>
      <div class="meta"><b>layout.xiaoxiaodong.ai/${l.id}${play ? "/play" : ""}</b><span>${play ? "上手玩" : "CC BY 4.0"}</span></div>
    </div>
    <div class="right">${right}</div>
  </div></body></html>`;
}

const jobs = [];
for (const l of layouts) {
  if (only && !only.includes(l.id)) continue;
  const text = JSON.stringify([titleOf(l), l.nameEn, l.summary, subName.get(`${l.cat}/${l.sub}`)]);
  const poster = readFileSync(join(SITE, "public/p", `${l.id}.webp`));
  jobs.push({ l, out: `${l.id}.jpg`, key: sha(VERSION, STYLE, text, poster) });
  const html = playById.get(l.id);
  if (html) jobs.push({ l, out: `${l.id}-play.jpg`, play: html, key: sha(VERSION, STYLE, text, poster, readFileSync(html)) });
}
const want = new Set(jobs.map((j) => j.out));
if (!only) for (const f of readdirSync(OUT)) if (!want.has(f)) { rmSync(join(OUT, f)); delete manifest[f]; }
const todo = jobs.filter((j) => manifest[j.out] !== j.key || !existsSync(join(OUT, j.out)));
console.log(`分享卡片：${jobs.length} 张，要画 ${todo.length} 张`);
if (!todo.length) { save(); process.exit(0); }

const chrome = await launch("og");
const shoot = async (format, quality) => Buffer.from((await chrome.send("Page.captureScreenshot", { format, quality })).data, "base64");
let n = 0;
for (const job of todo) {
  let shot;
  if (job.play) {
    await chrome.open(pathToFileURL(job.play).href, { w: 1440, h: 900, dpr: 1, mobile: false });
    await sleep(2500); // 开场动画走完
    shot = `data:image/jpeg;base64,${(await shoot("jpeg", 88)).toString("base64")}`;
  }
  const page = join(TMP, `${job.out}.html`);
  writeFileSync(page, card(job.l, { play: !!job.play, shot }));
  await chrome.open(pathToFileURL(page).href, { w: 1200, h: 630, dpr: 1, mobile: false });
  writeFileSync(join(OUT, job.out + ".tmp"), await shoot("jpeg", 86));
  renameSync(join(OUT, job.out + ".tmp"), join(OUT, job.out));
  rmSync(page);
  manifest[job.out] = job.key;
  if (++n % 20 === 0) { save(); console.log(`  ${n}/${todo.length}`); }
}
save();
chrome.kill();
console.log(`分享卡片：画好 ${n} 张`);
