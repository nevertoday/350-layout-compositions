// 网站的全部数据只从这里来：读 v2/catalog.json（350 种）、v2/taxonomy.json（分类和二级主题，由 scripts/import-350.py --emit-taxonomy 导出）
// 和 src/data/poster-text.json（海报上抄下来的文字，可能还没有）。在这里校验、清洗，导出普通对象；别的文件不读这三个文件。
// 多语言（I18N.md）：界面文字 src/i18n/ui/<code>.json、内容译文 src/i18n/content/<code>.json 也只在这里读，
// atlasFor(code) 给出那种语言下同样形状的数据。顶层导出的 categories、layouts 等是源语言（简体中文）的。
// 页面（Astro）、生成图片（scripts/build-images.mjs）、检查（scripts/check-site.mjs）、翻译的输入（scripts/i18n-source.mjs）都 import 这一个模块。
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LOCALES, SOURCE } from "../i18n/locales.js";

const SITE = process.cwd().endsWith("/site") ? process.cwd() : resolve(process.cwd(), "site");
const REPO = resolve(SITE, "..");
const TEXT_FILE = process.env.XXD_POSTER_TEXT ? resolve(process.env.XXD_POSTER_TEXT) : join(SITE, "src/data/poster-text.json");
// 译文默认在 src/i18n（翻译流水线写）；XXD_I18N_DIR 指到别处的一套（里面同样是 ui/ 和 content/），不动流水线的文件也能试
const I18N_DIR = process.env.XXD_I18N_DIR ? resolve(process.env.XXD_I18N_DIR) : join(SITE, "src/i18n");
const RAW = "https://raw.githubusercontent.com/nevertoday/350-layout-compositions/main/";
export const REPO_URL = "https://github.com/nevertoday/350-layout-compositions";

const fail = (msg) => { throw new Error(`atlas.js：${msg}`); };
const readJson = (file) => {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch (e) { fail(`${file} 读不出来：${e.message}`); }
};
const rangeOf = (ids) => `${ids[0]}–${ids[ids.length - 1]}`;

// ---------- 界面文字 ----------
// 占位 {n}、HTML 标签：译文里要和中文一样多、一样的（顺序可以不同）
const shapeOf = (s) => [...s.matchAll(/\{\w+\}|<\/?[a-z]+/g)].map((m) => m[0]).sort().join(" ");
const UI_ZH = readJson(join(SITE, "src/i18n/ui/zh.json"));
for (const [k, v] of Object.entries(UI_ZH)) if (typeof v !== "string" || !v) fail(`ui/zh.json 的 ${k} 不是非空字符串`);

// t(key, vars)：取一条界面文字，填上 {占位}。没有这条是页面写错了键，直接报错
function translator(dict) {
  return (key, vars = {}) => {
    const s = dict[key];
    if (s === undefined) fail(`ui/zh.json 里没有 ${key}`);
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  };
}
const zhT = translator(UI_ZH);
export const UI_KEYS = Object.keys(UI_ZH);

// ---------- 海报文字的清洗 ----------
// 抄录时多行合成一行、换行处加了空格：中文标点后面的空格去掉，空白收成一个。
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/([，。、；：！？])\s+/g, "$1").trim();

// 英文名：海报上是全大写，换成标题式大小写。短的虚词小写（第一个词除外），缩写保持大写。
const SMALL = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "of", "in", "on", "at", "to", "by", "with", "within", "vs", "via", "as", "from", "into", "per"]);
const ACRONYMS = new Set(["UI", "UX", "CSS", "HTML", "CJK", "2D", "3D", "PPT", "KPI", "CTA", "FAQ", "API", "RTL", "LTR", "SVG", "OK"]);
export function titleCase(s) {
  return clean(s).split(" ").filter(Boolean).map((word, i) =>
    word.split(/([-–—/])/).map((part, j) => {
      if (/^[-–—/]$/.test(part) || !part) return part;
      const up = part.toUpperCase();
      if (ACRONYMS.has(up)) return up;
      const low = part.toLowerCase();
      if (i > 0 && j === 0 && SMALL.has(low)) return low;
      return low.charAt(0).toUpperCase() + low.slice(1);
    }).join(""),
  ).join(" ");
}

function parseText(id, t) {
  if (typeof t !== "object" || t === null) fail(`poster-text.json 里 ${id} 不是对象`);
  const list = (v, field) => {
    if (v == null) return [];
    if (!Array.isArray(v)) fail(`poster-text.json 里 ${id}.${field} 不是数组`);
    return v;
  };
  const points = list(t.points, "points")
    .map((p) => ({ title: clean(p?.title), body: clean(p?.body), en: clean(p?.en) }))
    .filter((p) => p.title || p.body);
  const items = list(t.usage, "usage").map(clean).filter(Boolean);
  // term 是页面语言里的词（源语言就是 zh），en 是海报上印的英文
  const keywords = list(t.keywords, "keywords")
    .map((k) => ({ zh: clean(k?.zh), en: clean(k?.en) }))
    .filter((k) => k.zh || k.en)
    .map((k) => ({ ...k, term: k.zh }));
  return {
    nameEn: titleCase(t.title_en),
    summary: clean(t.summary),
    points,
    usage: { title: clean(t.usage_title), items },
    keywords,
    notes: list(t.other_text, "other_text").map(clean).filter(Boolean),
  };
}

const NO_TEXT = { nameEn: "", summary: "", points: [], usage: { title: "", items: [] }, keywords: [], notes: [] };

// 构图提示词：贴在作图提示词末尾用，用页面的语言写。名称（+ 海报英文名）+ 定义 + 要点标题。
// 名称就是英文名时（en）不再括一遍；英文名末尾的 Composition 去掉，「构图：」已经说了
function promptOf(t, l) {
  const en = l.nameEn.replace(/ Composition$/, "");
  const name = l.name === l.nameEn ? en : en ? t("detail.nameWithEn", { name: l.name, en }) : l.name;
  const parts = [t("prompt.head", { name })];
  if (l.summary) parts.push(/[.!?…。！？؟]$/.test(l.summary) ? l.summary : l.summary + t("prompt.end"));
  if (l.points.length) parts.push(t("prompt.points", { points: l.points.map((p) => p.title || p.body).join(t("prompt.sep")) }));
  // 句号是全角的（中文、日文）句子之间不空格，别的语言空一格
  return parts.join(/^[。！？]/.test(t("prompt.end")) ? "" : " ");
}

// 搜索用的文字：页面上看得见的字 + 中文原名 + 海报英文名 + 编号
const haystackOf = (l, cat, sub) => [...new Set([
  l.id, l.name, l.nameZh, l.nameEn, cat.name, sub.name, l.summary,
  ...l.points.flatMap((p) => [p.title, p.body, p.en]),
  l.usage.title, ...l.usage.items,
  ...l.keywords.flatMap((k) => [k.term, k.en]),
  ...l.notes,
].filter(Boolean))].join(" ").toLowerCase();

// ---------- 读取和校验 ----------
const catalog = readJson(join(REPO, "v2/catalog.json"));
const taxonomy = readJson(join(REPO, "v2/taxonomy.json"));
const texts = existsSync(TEXT_FILE) ? readJson(TEXT_FILE) : {};

if (!Array.isArray(catalog) || !catalog.length) fail("v2/catalog.json 不是非空数组");
if (!Array.isArray(taxonomy?.categories) || !taxonomy.categories.length) fail("v2/taxonomy.json 没有 categories");

export const categories = taxonomy.categories.map((c) => {
  if (!/^\d\d-[a-z0-9-]+$/.test(c.slug) || !c.title) fail(`分类写法不对：${JSON.stringify(c.slug)}`);
  return {
    slug: c.slug,
    no: c.slug.slice(0, 2),
    name: c.title,
    blurb: c.description,
    range: "",
    count: 0,
    subs: c.subcategories.map((s) => ({ slug: s.slug, name: s.title, blurb: s.description, range: "", ids: [], start: s.start, end: s.end })),
  };
});
const catBySlug = new Map(categories.map((c) => [c.slug, c]));
const subBySlug = new Map(categories.flatMap((c) => c.subs.map((s) => [s.slug, s])));
if (catBySlug.size !== categories.length) fail("taxonomy.json 里分类重名");
if (subBySlug.size !== categories.reduce((n, c) => n + c.subs.length, 0)) fail("taxonomy.json 里二级主题重名");

const raw = (path) => RAW + path.split("/").map(encodeURIComponent).join("/");
// 图片命名只在这里定：第一版 <id>，第二版 <id>-2；缩略图 /t/，大图 /p/。地址带源图 sha256 的前 8 位，源图换了地址就换。
const rendition = (key, path, sha) => {
  if (!/^[0-9a-f]{64}$/.test(String(sha))) fail(`${key} 的 sha256 不对`);
  const v = `?v=${sha.slice(0, 8)}`;
  return { key, src: path, sha256: sha, thumb: `/t/${key}.webp${v}`, full: `/p/${key}.webp${v}`, png: raw(path) };
};

// 生成图片用：每张源图（第一版、第二版）在仓库里的路径、sha256，和输出文件名用的 key
export const imageSources = [];
const seen = new Set();
export const layouts = catalog.map((e) => {
  const id = e.id;
  if (!/^\d{3}$/.test(id)) fail(`编号写法不对：${JSON.stringify(id)}`);
  if (seen.has(id)) fail(`编号重复：${id}`);
  seen.add(id);
  if (!e.name) fail(`${id} 没有名称`);
  const cat = catBySlug.get(e.category_slug);
  if (!cat) fail(`${id} 的分类 ${JSON.stringify(e.category_slug)} 不在 taxonomy.json 里`);
  const sub = cat.subs.find((s) => s.slug === e.subcategory_slug);
  if (!sub) fail(`${id} 的二级主题 ${JSON.stringify(e.subcategory_slug)} 不属于 ${cat.slug}`);
  if (+id < sub.start || +id > sub.end) fail(`${id} 不在 ${sub.slug} 的编号区间 ${sub.start}–${sub.end} 里`);
  if (!e.image || !(e.width > 0) || !(e.height > 0)) fail(`${id} 缺图片或尺寸`);
  if (Boolean(e.variant_image) !== Boolean(e.variant_sha256)) fail(`${id} 的第二版字段不全`);
  sub.ids.push(id);
  const t = texts[id] ? parseText(id, texts[id]) : NO_TEXT;
  const first = rendition(id, e.image, e.sha256);
  const second = e.variant_image ? rendition(`${id}-2`, e.variant_image, e.variant_sha256) : undefined;
  const layout = {
    id,
    name: e.name,
    nameZh: e.name,
    nameEn: t.nameEn,
    lang: SOURCE.lang, // 这一种的文字实际是什么语言（译文缺的时候是中文）
    cat: cat.slug,
    sub: sub.slug,
    summary: t.summary,
    points: t.points,
    usage: t.usage,
    keywords: t.keywords,
    notes: t.notes,
    img: { w: e.width, h: e.height, thumb: first.thumb, full: first.full, png: first.png },
    ...(second && { second: { thumb: second.thumb, full: second.full, png: second.png } }),
  };
  layout.prompt = promptOf(zhT, layout);
  layout.search = haystackOf(layout, cat, sub);
  for (const r of [first, second]) if (r) imageSources.push({ key: r.key, src: r.src, sha256: r.sha256 });
  return layout;
});
layouts.forEach((l, i) => {
  if (i > 0) l.prev = layouts[i - 1].id;
  if (i < layouts.length - 1) l.next = layouts[i + 1].id;
});

for (const id of Object.keys(texts)) if (!seen.has(id)) fail(`poster-text.json 里有目录里没有的编号：${id}`);

for (const c of categories) {
  for (const s of c.subs) {
    if (!s.ids.length) fail(`二级主题 ${s.slug} 一张都没有`);
    s.range = rangeOf(s.ids);
    delete s.start;
    delete s.end;
  }
  const ids = c.subs.flatMap((s) => s.ids);
  if (!ids.length) fail(`分类 ${c.slug} 一张都没有`);
  c.count = ids.length;
  c.range = rangeOf(ids);
}

export const layoutById = new Map(layouts.map((l) => [l.id, l]));
export const categoryBySlug = catBySlug;
export const stats = {
  layouts: layouts.length,
  categories: categories.length,
  subs: subBySlug.size,
  seconds: layouts.filter((l) => l.second).length,
};

// ---------- 别的语言 ----------
// atlasFor(code) 给出一种语言下的全部数据，形状和上面导出的一样，另外每种版式有 nameZh（中文原名）、nameEn（海报英文名）、
// lang（它的文字实际是什么语言）；关键词的 term 是这种语言的词。用到时才读译文：只要中文的脚本（i18n-source.mjs）不受译文影响。
// 译文在这里校验：内容的数组长度、空不空都要和中文一一对应，不对就报错。界面文字的占位和标签和中文对不上、中文已经没有这个键的，
// 是中文改过、译文还是旧的：那一条不用，先用中文（算在提示里）。
// 译文缺某一种版式、某个分类：那一处先用中文（lang 是 zh-CN），构建时一行提示；整个语言没有译文文件：不生成页面，一行提示。
const SOURCE_ATLAS = { locale: SOURCE, t: zhT, categories, categoryBySlug: catBySlug, layouts, layoutById, stats };

function localize(loc, uiFile, contentFile) {
  const where = (s) => `${loc.code} 的译文 ${s}`;
  const ui = readJson(uiFile);
  if (typeof ui !== "object" || ui === null || Array.isArray(ui)) fail(where("ui 不是对象"));
  const usable = {};
  for (const [k, v] of Object.entries(ui)) {
    if (typeof v !== "string" || !v.trim()) fail(where(`ui.${k} 不是非空字符串`));
    if (k in UI_ZH && shapeOf(v) === shapeOf(UI_ZH[k])) usable[k] = v;
  }
  const t = translator({ ...UI_ZH, ...usable });
  const missing = { ui: UI_KEYS.filter((k) => !(k in usable)).length, taxonomy: 0, layouts: 0 };

  const content = readJson(contentFile);
  const tax = content?.taxonomy ?? {};
  const lay = content?.layouts ?? {};
  if (typeof tax !== "object" || typeof lay !== "object") fail(where("content 的 taxonomy、layouts 不是对象"));
  const str = (v, src, at) => {
    if (typeof v !== "string") fail(where(`${at} 不是字符串`));
    const s = clean(v);
    if (!src !== !s) fail(where(`${at}：${src ? "中文有字，译文是空的" : "中文是空的，译文却有字"}`));
    return s;
  };
  const arr = (v, src, at) => {
    if (!Array.isArray(v) || v.length !== src.length) fail(where(`${at} 应该是 ${src.length} 项，译文是 ${Array.isArray(v) ? `${v.length} 项` : typeof v}`));
    return v;
  };

  // 分类、二级主题：name、blurb
  const known = new Set([...catBySlug.keys(), ...subBySlug.keys()]);
  for (const slug of Object.keys(tax)) if (!known.has(slug)) fail(where(`taxonomy 多了不认识的 ${slug}`));
  const named = (x) => {
    const tr = tax[x.slug];
    if (!tr) { missing.taxonomy++; return { ...x, lang: SOURCE.lang }; }
    return { ...x, name: str(tr.name, x.name, `${x.slug}.name`), blurb: str(tr.blurb ?? "", x.blurb ?? "", `${x.slug}.blurb`), lang: loc.lang };
  };
  const cats = categories.map((c) => ({ ...named(c), subs: c.subs.map(named) }));
  const catMap = new Map(cats.map((c) => [c.slug, c]));

  // 版式
  for (const id of Object.keys(lay)) if (!layoutById.has(id)) fail(where(`layouts 多了目录里没有的 ${id}`));
  const list = layouts.map((src) => {
    const tr = lay[src.id];
    if (!tr) { missing.layouts++; return src; } // 整种用中文：名称、文字、提示词都是中文的
    const at = (f) => `${src.id}.${f}`;
    if (typeof tr !== "object" || !tr.usage || typeof tr.usage !== "object") fail(where(`${at("usage")} 不是对象`));
    const l = {
      ...src,
      // en 的名称就是海报上印的英文名（I18N.md）
      name: loc.code === "en" && src.nameEn ? src.nameEn : str(tr.name, src.name, at("name")),
      summary: str(tr.summary ?? "", src.summary, at("summary")),
      points: arr(tr.points, src.points, at("points")).map((p, i) => ({
        title: str(p?.title ?? "", src.points[i].title, at(`points[${i}].title`)),
        body: str(p?.body ?? "", src.points[i].body, at(`points[${i}].body`)),
        en: src.points[i].en,
      })),
      usage: {
        title: str(tr.usage.title ?? "", src.usage.title, at("usage.title")),
        items: arr(tr.usage.items, src.usage.items, at("usage.items")).map((s, i) => str(s, src.usage.items[i], at(`usage.items[${i}]`))),
      },
      keywords: arr(tr.keywords, src.keywords, at("keywords")).map((s, i) => ({ ...src.keywords[i], term: str(s, src.keywords[i].zh, at(`keywords[${i}]`)) })),
      notes: arr(tr.notes, src.notes, at("notes")).map((s, i) => str(s, src.notes[i], at(`notes[${i}]`))),
      lang: loc.lang,
    };
    const cat = catMap.get(l.cat);
    l.prompt = promptOf(t, l);
    l.search = haystackOf(l, cat, cat.subs.find((s) => s.slug === l.sub));
    return l;
  });
  return { locale: loc, t, categories: cats, categoryBySlug: catMap, layouts: list, layoutById: new Map(list.map((l) => [l.id, l])), stats, missing };
}

let built;
function buildAll() {
  const out = new Map([[SOURCE.code, SOURCE_ATLAS]]);
  const skipped = [];
  const partial = [];
  for (const loc of LOCALES) {
    if (loc === SOURCE) continue;
    const ui = join(I18N_DIR, "ui", `${loc.code}.json`);
    const content = join(I18N_DIR, "content", `${loc.code}.json`);
    const absent = [[ui, "ui"], [content, "content"]].filter(([f]) => !existsSync(f)).map(([, k]) => `${k}/${loc.code}.json`);
    if (absent.length) { skipped.push(`${loc.code}（没有 ${absent.join("、")}）`); continue; }
    const a = localize(loc, ui, content);
    out.set(loc.code, a);
    const m = a.missing;
    const gaps = [m.layouts && `${m.layouts} 种版式`, m.taxonomy && `${m.taxonomy} 个分类或主题`, m.ui && `${m.ui} 条界面文字`].filter(Boolean);
    if (gaps.length) partial.push(`${loc.code} 缺 ${gaps.join("、")}`);
  }
  if (skipped.length) console.warn(`[i18n] 先不生成这些语言：${skipped.join("，")}`);
  if (partial.length) console.warn(`[i18n] 译文不全，缺的先用中文：${partial.join("；")}`);
  return out;
}

// 有译文、要生成页面的语言，按语言表的顺序；第一个是源语言
export function atlases() {
  built ??= buildAll();
  return [...built.values()];
}
export function atlasFor(code) {
  const a = (built ??= buildAll()).get(code);
  if (!a) fail(`没有 ${code} 这种语言（或者它还没有译文）`);
  return a;
}
