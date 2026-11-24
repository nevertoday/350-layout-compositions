// 把 pages/<id>-<slug>/ 打成一个能双击打开的 HTML：dist/<id>-<slug>.html。
//   node build.mjs              全部页面，再打 dist/350-layout-interactive.zip
//   node build.mjs --only 001   只打这几页（逗号分隔），不打 zip
//   node build.mjs --force      不用缓存
// JS 和 CSS 用 esbuild 打包内联；字体按页面里出现的字裁成 woff2 内联；本地图片变成 data URI。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const PAGES = join(ROOT, "pages");
export const DIST = join(ROOT, "dist");
const FONT_CACHE = join(ROOT, ".cache/fonts");
const SUBSET_CACHE = join(ROOT, ".cache/subsets");
const PAGE_CACHE = join(ROOT, ".build/cache");
const POSTERS = process.env.POSTER_DIR || "/Users/admin/Desktop/js/350-layout-redesign/site/public/p";
const ZIP = "350-layout-interactive.zip";
const FONTS = JSON.parse(readFileSync(join(ROOT, "fonts.json"), "utf8"));

const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif", ".ico": "image/x-icon" };
const assetLoaders = Object.fromEntries(Object.keys(MIME).map((ext) => [ext, "dataurl"]));
// 不管页面写没写到，这些字都留着：ASCII、Latin-1、常用标点和箭头、全角标点
const BASE_CHARS = [[0x20, 0x7e], [0xa0, 0xff], [0x2010, 0x2027], [0x2030, 0x203a], [0x2190, 0x2193], [0x3000, 0x303f], [0xff01, 0xff65]]
  .map(([a, b]) => String.fromCodePoint(...Array.from({ length: b - a + 1 }, (_, i) => a + i)))
  .join("");

const sha = (...parts) => {
  const h = createHash("sha256");
  for (const p of parts) h.update(typeof p === "string" ? p : p ?? "").update("\0");
  return h.digest("hex");
};
function writeAtomic(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}
const filesUnder = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => join(e.parentPath, e.name))
    .sort();

// ---------- page.json ----------
export function listPages(only) {
  const dirs = existsSync(PAGES) ? readdirSync(PAGES).filter((d) => /^\d{3}-[a-z0-9-]+$/.test(d)).sort() : [];
  if (!only) return dirs;
  const picked = dirs.filter((d) => only.includes(d.slice(0, 3)));
  const missing = only.filter((id) => !picked.some((d) => d.startsWith(id)));
  if (missing.length) throw new Error(`没有这些页面：${missing.join(", ")}（pages/ 下要有 <id>-<slug>/）`);
  return picked;
}

function readPage(dirName) {
  const dir = join(PAGES, dirName);
  const where = `pages/${dirName}/page.json`;
  const page = JSON.parse(readFileSync(join(dir, "page.json"), "utf8"));
  const fail = (msg) => { throw new Error(`${where}：${msg}`); };
  if (page.id !== dirName.slice(0, 3)) fail(`id 应该是 "${dirName.slice(0, 3)}"`);
  if (typeof page.title !== "string" || typeof page.title_en !== "string") fail("要有 title 和 title_en");
  if (!Array.isArray(page.fonts)) fail("fonts 要是数组");
  for (const f of page.fonts) {
    const entry = FONTS[f.name];
    if (!entry) fail(`fonts.json 里没有字体 "${f.name}"，可选：${Object.keys(FONTS).join(", ")}`);
    const style = f.style || "normal";
    for (const w of f.weights || [400]) {
      if (!entry.files.some((file) => (file.style || "normal") === style && covers(file.weight, w)))
        fail(`${f.name} 没有 ${style} ${w}，有：${entry.files.map((x) => `${x.style || "normal"} ${[].concat(x.weight).join("–")}`).join("、")}`);
    }
  }
  if (!existsSync(join(dir, "index.html"))) fail("同目录要有 index.html");
  return { ...page, dir, dirName, poster: page.poster === true };
}
// 一页的字体搭配：只看用了哪几种字体，不管字重和正斜
export const fontSet = (dirName) => [...new Set(JSON.parse(readFileSync(join(PAGES, dirName, "page.json"), "utf8")).fonts.map((f) => f.name))].sort();
// 编号前后相邻的页面（id ± 1）字体搭配和这页一模一样，就返回那一页的目录名
export function fontTwin(dirName, dirs = listPages()) {
  const mine = fontSet(dirName).join(" ");
  const id = +dirName.slice(0, 3);
  return dirs.find((d) => Math.abs(+d.slice(0, 3) - id) === 1 && d.slice(0, 3) !== "000" && fontSet(d).join(" ") === mine);
}

const covers = (range, w) => (Array.isArray(range) ? w >= range[0] && w <= range[1] : range === w);

// ---------- 字体 ----------
function fontSource(file) {
  const url = new URL(file.url);
  const dir = join(FONT_CACHE, sha(file.url).slice(0, 12));
  const downloaded = join(dir, decodeURIComponent(basename(url.pathname)));
  const target = file.zip ? join(dir, basename(file.zip)) : downloaded;
  if (existsSync(target)) return target;
  mkdirSync(dir, { recursive: true });
  if (!existsSync(downloaded)) {
    console.log(`  下载 ${file.url}`);
    const tmp = `${downloaded}.${process.pid}.tmp`;
    execFileSync("curl", ["-fsSL", "--retry", "2", "-o", tmp, file.url], { stdio: "inherit" });
    renameSync(tmp, downloaded);
  }
  if (file.zip) writeAtomic(target, execFileSync("unzip", ["-p", downloaded, file.zip], { maxBuffer: 1 << 30 }));
  return target;
}

// 页面要的每个字体 → 要裁的文件和轴范围
function fontJobs(page, text) {
  const jobs = [];
  for (const f of page.fonts) {
    const entry = FONTS[f.name];
    const style = f.style || "normal";
    const weights = f.weights || [400];
    const byFile = new Map();
    for (const w of weights) {
      const file = entry.files.find((x) => (x.style || "normal") === style && covers(x.weight, w));
      byFile.set(file, [...(byFile.get(file) || []), w]);
    }
    for (const [file, ws] of byFile) {
      const limits = { ...(f.axes || {}) };
      if (Array.isArray(file.weight)) limits.wght = [Math.min(...ws), Math.max(...ws)];
      const key = sha(file.url, file.zip, JSON.stringify(limits), text, readFileSync(join(ROOT, "subset.py"), "utf8")).slice(0, 20);
      jobs.push({ family: entry.family, license: entry.license, style, file, limits, out: join(SUBSET_CACHE, `${key}.woff2`), meta: join(SUBSET_CACHE, `${key}.json`) });
    }
  }
  return jobs;
}

function subsetFonts(jobs, text) {
  const todo = jobs.filter((j) => !existsSync(j.out) || !existsSync(j.meta));
  if (todo.length) {
    mkdirSync(SUBSET_CACHE, { recursive: true });
    const input = JSON.stringify(todo.map((j) => ({ src: fontSource(j.file), out: j.out, text, limits: j.limits })));
    const out = execFileSync("uv", ["run", "-q", "--no-project", "--with", "fonttools", "--with", "brotli", "python", "-I", join(ROOT, "subset.py")], { input, maxBuffer: 1 << 26 });
    JSON.parse(out).forEach((r, i) => writeAtomic(todo[i].meta, JSON.stringify(r)));
  }
  return jobs.map((j) => ({ ...j, ...JSON.parse(readFileSync(j.meta, "utf8")) }));
}

const fontFace = (f) =>
  `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${[].concat(f.weight).join(" ")};font-display:block;src:url(data:font/woff2;base64,${readFileSync(f.out).toString("base64")}) format("woff2")}`;

// ---------- HTML ----------
const LOCAL = /^(?![a-z][a-z0-9+.-]*:|\/\/|#)/i;
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find((v) => v !== undefined);

const decodeEntities = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

async function bundle(entry, kind) {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    minify: true,
    treeShaking: true,
    legalComments: "eof",
    charset: "utf8", // 汉字原样输出（默认会转成 \uXXXX，裁字体时就漏掉）
    loader: assetLoaders,
    logLevel: "silent",
    ...(kind === "js" ? { format: "iife", target: "es2022", platform: "browser" } : { target: "chrome100" }),
  });
  return result.outputFiles[0].text;
}

// 本地图片 → data URI；页面引用的文件不存在就报错（双击打开时它也不会在）
function inlineAssets(html, page) {
  return html.replace(/(\s(?:src|href|poster)\s*=\s*)("([^"]*)"|'([^']*)')/gi, (all, lead, _q, a, b) => {
    const ref = a ?? b;
    if (!ref || !LOCAL.test(ref)) return all;
    const file = join(page.dir, ref.split(/[?#]/)[0]);
    const type = MIME[extname(file).toLowerCase()];
    if (!type) return all;
    if (!existsSync(file)) throw new Error(`pages/${page.dirName}/index.html 引用了不存在的文件 ${ref}`);
    return `${lead}"data:${type};base64,${readFileSync(file).toString("base64")}"`;
  });
}

function inputsKey(page) {
  const three = JSON.parse(readFileSync(join(ROOT, "node_modules/three/package.json"), "utf8")).version;
  const files = [...filesUnder(page.dir), ...(existsSync(join(ROOT, "lib")) ? filesUnder(join(ROOT, "lib")) : [])];
  const fonts = JSON.stringify(page.fonts.map((f) => FONTS[f.name]));
  return sha(three, esbuild.version, fonts, ...["build.mjs", "subset.py"].map((f) => readFileSync(join(ROOT, f))), ...files.flatMap((f) => [relative(ROOT, f), readFileSync(f)]));
}

export async function buildPage(dirName, { force = false } = {}) {
  const started = Date.now();
  const page = readPage(dirName);
  const posterFile = join(page.dir, "poster.webp");
  if (page.poster && !existsSync(posterFile)) {
    const src = join(POSTERS, `${page.id}.webp`);
    if (!existsSync(src)) throw new Error(`page.json 写了 poster:true，但找不到 ${src}（可以用 POSTER_DIR 指别的目录）`);
    copyFileSync(src, posterFile);
  }
  const out = join(DIST, `${dirName}.html`);
  const cacheFile = join(PAGE_CACHE, `${page.id}.json`);
  const key = inputsKey(page);
  if (!force && existsSync(out) && existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (cached.key === key) return { ...cached.report, cached: true, ms: Date.now() - started };
  }

  let html = readFileSync(join(page.dir, "index.html"), "utf8");
  const styles = [];
  const scripts = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = attr(tag, "href");
    if (/stylesheet/i.test(attr(tag, "rel") || "") && href && LOCAL.test(href)) {
      styles.push(await bundle(join(page.dir, href), "css"));
      html = html.replace(tag, () => "");
    }
  }
  for (const [tag] of html.matchAll(/<script\b[^>]*>\s*<\/script>/gi)) {
    const src = attr(tag, "src");
    if (src && LOCAL.test(src)) {
      scripts.push(await bundle(join(page.dir, src), "js"));
      html = html.replace(tag, () => "");
    }
  }
  html = inlineAssets(html, page);

  const pageText = decodeEntities(html.replace(/data:[^"')\s]+/g, "")) + styles.join("") + scripts.join("") + readFileSync(join(page.dir, "page.json"), "utf8");
  const text = [...new Set(BASE_CHARS + pageText.replace(/[\u0000-\u001f]/g, ""))].sort().join("");
  const fonts = subsetFonts(fontJobs(page, text), text);

  const credits = [...new Set(fonts.map((f) => `${f.family} (${f.license})`)), ...(scripts.some((s) => /three/i.test(s)) ? ["three.js (MIT)"] : [])];
  const head = `<style>${fonts.map(fontFace).join("")}${styles.join("")}</style>`;
  const body = scripts.map((s) => `<script>${s.replace(/<\/script/gi, "<\\/script")}</script>`).join("");
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error(`pages/${dirName}/index.html 要有 </head> 和 </body>`);
  html = html
    .replace(/<\/head>/i, () => `${head}</head>`)
    .replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${body}</body>`)
    .replace(/^(\s*<!doctype[^>]*>)?/i, (d) => `${d || "<!doctype html>"}\n<!-- 350 种排版 · ${page.id} ${page.title} · ${credits.join(" · ")} -->`);
  writeAtomic(out, html);

  const report = {
    id: page.id,
    file: relative(ROOT, out),
    title: page.title,
    bytes: Buffer.byteLength(html),
    chars: text.length,
    fonts: fonts.map((f) => ({ family: f.family, style: f.style, weight: f.weight, bytes: f.size })),
    js: scripts.reduce((n, s) => n + s.length, 0),
    css: styles.reduce((n, s) => n + s.length, 0),
    poster: page.poster ? statSync(posterFile).size : 0,
    credits,
  };
  writeAtomic(cacheFile, JSON.stringify({ key, report }));
  return { ...report, cached: false, ms: Date.now() - started };
}

// ---------- zip ----------
function buildZip(dirs) {
  const shipped = dirs.filter((d) => !d.startsWith("000-"));
  const live = new Set(dirs.map((d) => `${d}.html`));
  for (const f of readdirSync(DIST)) if (f.endsWith(".html") && !live.has(f)) rmSync(join(DIST, f));
  for (const f of readdirSync(PAGE_CACHE)) if (!dirs.some((d) => f === `${d.slice(0, 3)}.json`)) rmSync(join(PAGE_CACHE, f));
  const rows = shipped.map((d) => JSON.parse(readFileSync(join(PAGE_CACHE, `${d.slice(0, 3)}.json`), "utf8")).report);
  const credits = [...new Set(rows.flatMap((r) => r.credits))];
  const readme = [
    "350 种排版 · 互动版",
    "",
    "每个 .html 文件是一页。双击就能用浏览器打开（Chrome、Edge、Safari、Firefox 都行）。",
    "不用联网，不用装任何东西，字体和图片都在文件里。",
    "手机上：先把文件存到「文件」App（安卓是「文件管理」），再点开，选浏览器打开。",
    "",
    ...rows.map((r) => `${basename(r.file)}    ${r.title}`),
    "",
    `用到的字体和代码：${credits.join("、")}`,
    "",
  ].join("\r\n");
  const stage = join(ROOT, ".build/zip");
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  writeFileSync(join(stage, "打开方式.txt"), "﻿" + readme);
  for (const d of shipped) copyFileSync(join(DIST, `${d}.html`), join(stage, `${d}.html`));
  const tmp = join(DIST, `${ZIP}.${process.pid}.tmp`);
  execFileSync("uv", ["run", "-q", "--no-project", "python", "-I", "-m", "zipfile", "-c", tmp, ...readdirSync(stage).sort()], { cwd: stage });
  renameSync(tmp, join(DIST, ZIP));
  rmSync(stage, { recursive: true, force: true });
  return { file: join(DIST, ZIP), pages: shipped.length, bytes: statSync(join(DIST, ZIP)).size };
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
export function describe(r) {
  const fonts = r.fonts.map((f) => `${f.family} ${f.style === "italic" ? "italic " : ""}${[].concat(f.weight).join("–")} ${kb(f.bytes)}`).join("，");
  return `${r.file}  ${kb(r.bytes)}  ${r.cached ? "（缓存）" : `${r.ms} ms`}\n    JS ${kb(r.js)} · CSS ${kb(r.css)} · 海报 ${kb(r.poster)} · ${r.chars} 个字\n    字体：${fonts || "无"}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const onlyAt = args.indexOf("--only");
  const only = onlyAt >= 0 ? (args[onlyAt + 1] || "").split(",").filter(Boolean) : null;
  const force = args.includes("--force");
  const dirs = listPages(only);
  if (!dirs.length) throw new Error("pages/ 下还没有页面");
  mkdirSync(DIST, { recursive: true });
  const all = listPages();
  for (const d of dirs) {
    console.log(describe(await buildPage(d, { force })));
    const twin = d.startsWith("000-") ? null : fontTwin(d, all);
    if (twin) console.warn(`  ⚠ 字体搭配和相邻的 ${twin} 一样（${fontSet(d).join(" + ")}）：换一套，npm run fonts 看各页用了什么`);
  }
  if (!only) {
    const z = buildZip(dirs);
    console.log(`${relative(ROOT, z.file)}  ${z.pages} 页  ${kb(z.bytes)}`);
  }
}
