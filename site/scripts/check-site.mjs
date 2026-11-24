// 检查构建好的 dist/：可以反复跑，有问题退出码是 1。用和构建时一样的译文（构建时设了 XXD_I18N_DIR，这里也设）。
//   · 每种有译文的语言（atlas.js 的 atlases()）：首页、关于、404 都在；目录里每个编号都有详情页，详情页正好这么多
//   · 每个页面的 <html lang dir> 是它那种语言的；hreflang 列齐每种语言和 x-default，每个都指到存在的页面，那一页的 lang 也对得上
//   · 拉丁、谚文、西里尔、阿拉伯文的页面（en ko es fr de pt ru ar）：看得见的字里没有汉字，写明是用汉字的语言（lang="zh-CN"，
//     语言菜单里的 zh-Hant、ja）的元素里面除外
//     （看得见的字 = 正文和 <title> 的文字、placeholder / aria-label / title / alt / 提示和复制后的提示，加上给浏览器的界面文字 #site-ui）
//   · 每个页面里指向本站文件的 src / href / og:image / url(...)，在 dist 里都找得到
//   · 每个页面正好一个 h1
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { atlases } from "../src/data/atlas.js";
import { LOCALES } from "../src/i18n/locales.js";

const DIST = join(process.cwd(), "dist");
const SITE = "https://layout.xiaoxiaodong.ai";
const HAN_FREE = new Set(["en", "ko", "es", "fr", "de", "pt", "ru", "ar"]);
const HAN = /\p{Script=Han}/u;
const HAN_LANGS = new Set(LOCALES.filter((l) => /^(zh|ja)\b/.test(l.lang)).map((l) => l.lang)); // 用汉字写的语言
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
const pageSet = new Set(pages);

// ---------- 每种语言的页面都在 ----------
const built = atlases();
const localeOf = (page) => LOCALES.find((l) => l.path && page.startsWith(`/${l.path}/`)) ?? LOCALES[0];
let detailCount = 0;
for (const A of built) {
  const b = A.locale.base;
  for (const must of ["index.html", "about/index.html", "404.html"]) if (!pageSet.has(b + must)) bad(`缺页面 ${b + must}`);
  const detail = new Set(pages.filter((p) => localeOf(p) === A.locale).map((p) => p.slice(b.length).match(/^(\d{3})\/index\.html$/)?.[1]).filter(Boolean));
  for (const l of A.layouts) if (!detail.has(l.id)) bad(`${A.locale.code}：编号 ${l.id} 没有详情页`);
  const ids = new Set(A.layouts.map((l) => l.id));
  for (const id of detail) if (!ids.has(id)) bad(`多出来的详情页 ${b}${id}/（目录里没有这个编号）`);
  detailCount += detail.size;
}
const builtCodes = new Set(built.map((A) => A.locale.code));
for (const l of LOCALES) if (!builtCodes.has(l.code) && l.path && existsSync(join(DIST, l.path))) bad(`${l.code} 没有译文，dist 里却有 /${l.path}/（dist 是旧的？）`);

// ---------- 读 HTML：一个够用的标签切分器（Astro 的输出是规整的） ----------
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const VISIBLE_ATTRS = ["placeholder", "aria-label", "title", "alt", "data-tooltip", "data-copy-done", "data-copy-toast"];
const attrsOf = (tag) => Object.fromEntries([...tag.matchAll(/\s([a-zA-Z:-]+)(?:="([^"]*)")?/g)].map((m) => [m[1].toLowerCase(), (m[2] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&")]));
const snippet = (s) => s.replace(/\s+/g, " ").trim().slice(0, 60);
// 看得见的字里不在「用汉字的语言」元素里的汉字；返回前几处
function hanLeaks(html) {
  const leaks = [];
  const stack = []; // { tag, lang }
  const langHere = () => { for (let i = stack.length - 1; i >= 0; i--) if (stack[i].lang) return stack[i].lang; return ""; };
  const TOKEN = /<!--[\s\S]*?-->|<!doctype[^>]*>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^>]*)?)>|([^<]+)/gi;
  for (let m; (m = TOKEN.exec(html)) && leaks.length < 5;) {
    const [, close, rawName, rest, text] = m;
    if (text !== undefined) {
      if (HAN.test(text) && !HAN_LANGS.has(langHere())) leaks.push(`「${snippet(text)}」`);
      continue;
    }
    if (!rawName) continue;
    const name = rawName.toLowerCase();
    if (close) {
      const i = stack.map((s) => s.tag).lastIndexOf(name);
      if (i >= 0) stack.length = i;
      continue;
    }
    const a = attrsOf(rest || "");
    if (name === "script" || name === "style") {
      const end = html.indexOf(`</${name}>`, TOKEN.lastIndex);
      const body = html.slice(TOKEN.lastIndex, end);
      TOKEN.lastIndex = end + name.length + 3;
      if (a.id === "site-ui") for (const [k, v] of Object.entries(JSON.parse(body).t)) if (HAN.test(v)) leaks.push(`#site-ui ${k}「${snippet(v)}」`);
      continue;
    }
    const entry = { tag: name, lang: a.lang };
    const lang = a.lang || langHere();
    for (const k of VISIBLE_ATTRS) if (a[k] && HAN.test(a[k]) && !HAN_LANGS.has(lang)) leaks.push(`<${name} ${k}>「${snippet(a[k])}」`);
    if (!VOID.has(name) && !/\/\s*$/.test(rest || "")) stack.push(entry);
  }
  return leaks;
}

// 站内地址 → dist 里的文件。/a/ → /a/index.html，/a → /a 或 /a/index.html；? 和 # 后面不管
const resolveLocal = (url) => {
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  if (path.endsWith("/")) return join(DIST, path, "index.html");
  const file = join(DIST, path);
  return existsSync(file) && statSync(file).isFile() ? file : join(DIST, path, "index.html");
};
const htmlLangOf = new Map(); // dist 文件 → <html lang>
const headOf = (file) => {
  if (!htmlLangOf.has(file)) htmlLangOf.set(file, existsSync(file) ? attrsOf(readFileSync(file, "utf8").match(/<html([^>]*)>/)?.[1] ?? "").lang : undefined);
  return htmlLangOf.get(file);
};

const ATTR = /\s(?:src|href|content)="([^"]*)"|url\(\s*(?:&quot;|["'])?([^"')&]+)/g;
let links = 0;
let alternates = 0;
let leakPages = 0;
const checked = new Map();
for (const page of pages) {
  const html = readFileSync(join(DIST, page), "utf8");
  const loc = localeOf(page);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(`${page} 有 ${h1} 个 h1`);

  const root = attrsOf(html.match(/<html([^>]*)>/)?.[1] ?? "");
  if (root.lang !== loc.lang || root.dir !== loc.dir) bad(`${page} 的 <html lang="${root.lang}" dir="${root.dir}">，应该是 lang="${loc.lang}" dir="${loc.dir}"`);

  // hreflang：404 没有；别的页列齐每种语言 + x-default，各自指到那种语言的同一页
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
  const is404 = page.endsWith("/404.html");
  if (is404 && alts.length) bad(`${page} 是 404，不该有 hreflang`);
  if (!is404) {
    const want = [...built.map((A) => A.locale.lang), "x-default"].sort().join(" ");
    const got = alts.map((a) => a.lang).sort().join(" ");
    if (got !== want) bad(`${page} 的 hreflang 是 ${got || "（没有）"}，应该是 ${want}`);
    for (const a of alts) {
      alternates++;
      if (!a.href.startsWith(SITE + "/")) { bad(`${page} 的 hreflang ${a.lang} 不是本站地址：${a.href}`); continue; }
      const file = resolveLocal(a.href.slice(SITE.length));
      const lang = headOf(file);
      const expect = a.lang === "x-default" ? LOCALES[0].lang : a.lang;
      if (lang === undefined) bad(`${page} 的 hreflang ${a.lang} → ${a.href} 不存在`);
      else if (lang !== expect) bad(`${page} 的 hreflang ${a.lang} → ${a.href}，那一页是 lang="${lang}"`);
    }
  }

  if (HAN_FREE.has(loc.code)) {
    const leaks = hanLeaks(html);
    if (leaks.length) { leakPages++; if (leakPages <= 12) bad(`${page} 有没译的中文：${leaks.join("、")}`); }
  }

  for (const m of html.matchAll(ATTR)) {
    let url = (m[1] ?? m[2] ?? "").replace(/&amp;/g, "&");
    if (url.startsWith(SITE)) url = url.slice(SITE.length) || "/";
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    links++;
    if (!checked.has(url)) checked.set(url, existsSync(resolveLocal(url)));
    if (!checked.get(url)) bad(`${page} → ${url} 不存在`);
  }
}
if (leakPages > 12) bad(`… 有没译中文的页面一共 ${leakPages} 个`);

const size = (dir) => readdirSync(dir).reduce((n, f) => n + statSync(join(dir, f)).size, 0);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(`语言 ${built.length} 种（${built.map((A) => A.locale.code).join(" ")}），页面 ${pages.length} 个（详情 ${detailCount}），站内链接 ${links} 处（不同地址 ${checked.size} 个），` +
  `hreflang ${alternates} 处，图片 t ${mb(size(join(DIST, "t")))} · p ${mb(size(join(DIST, "p")))}`);
if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`✗ ${p}`);
  if (problems.length > 40) console.error(`… 一共 ${problems.length} 处`);
  process.exit(1);
}
console.log("✓ 检查通过：每种语言的每一页都在，lang 和 hreflang 对得上，拉丁、谚文、西里尔、阿拉伯文的页面没有漏译的中文，站内链接都在，每页一个 h1");
