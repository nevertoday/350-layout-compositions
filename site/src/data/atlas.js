// 网站的全部数据只从这里来：读 v2/catalog.json（350 种）、v2/taxonomy.json（分类和二级主题，由 scripts/import-350.py --emit-taxonomy 导出）
// 和 src/data/poster-text.json（海报上抄下来的文字，可能还没有）。在这里校验、清洗，导出普通对象；别的文件不读这三个文件。
// 页面（Astro）、生成图片（scripts/build-images.mjs）、检查（scripts/check-site.mjs）都 import 这一个模块。
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SITE = process.cwd().endsWith("/site") ? process.cwd() : resolve(process.cwd(), "site");
const REPO = resolve(SITE, "..");
const TEXT_FILE = process.env.XXD_POSTER_TEXT ? resolve(process.env.XXD_POSTER_TEXT) : join(SITE, "src/data/poster-text.json");
const RAW = "https://raw.githubusercontent.com/nevertoday/350-layout-compositions/main/";
export const REPO_URL = "https://github.com/nevertoday/350-layout-compositions";

const fail = (msg) => { throw new Error(`atlas.js：${msg}`); };
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const rangeOf = (ids) => `${ids[0]}–${ids[ids.length - 1]}`;

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
  const keywords = list(t.keywords, "keywords")
    .map((k) => ({ zh: clean(k?.zh), en: clean(k?.en) }))
    .filter((k) => k.zh || k.en);
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

// 构图提示词：贴在作图提示词末尾用。名称 + 英文名 + 定义 + 要点标题。
function promptOf(name, t) {
  const en = t.nameEn.replace(/ Composition$/, "");
  const parts = [`构图：${name}${en ? `（${en}）` : ""}。`];
  if (t.summary) parts.push(/[。！？]$/.test(t.summary) ? t.summary : `${t.summary}。`);
  if (t.points.length) parts.push(`要点：${t.points.map((p) => p.title || p.body).join("；")}。`);
  return parts.join("");
}

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
    nameEn: t.nameEn,
    cat: cat.slug,
    sub: sub.slug,
    summary: t.summary,
    points: t.points,
    usage: t.usage,
    keywords: t.keywords,
    notes: t.notes,
    img: { w: e.width, h: e.height, thumb: first.thumb, full: first.full, png: first.png },
    ...(second && { second: { thumb: second.thumb, full: second.full, png: second.png } }),
    prompt: promptOf(e.name, t),
  };
  layout.search = [
    id, layout.name, layout.nameEn, cat.name, sub.name, layout.summary,
    ...layout.points.flatMap((p) => [p.title, p.body, p.en]),
    layout.usage.title, ...layout.usage.items,
    ...layout.keywords.flatMap((k) => [k.zh, k.en]),
    ...layout.notes,
  ].filter(Boolean).join(" ").toLowerCase();
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
  withText: layouts.filter((l) => l.summary || l.points.length).length,
};
