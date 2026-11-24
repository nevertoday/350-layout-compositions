// 导出翻译的输入 .cache/i18n/source.json：站点在 zh 下显示的全部文字，取自 atlas.js 和 src/i18n/ui/zh.json。
// taxonomy：8 个分类和 33 个二级主题的 {name, blurb}；layouts：每种版式要翻译的文字（nameEn 只作上下文）；
// tree：分类 → 二级主题 → 编号，translate.py 用它分组；ui：界面文字，ui/zh.json 还没有时为 null；
// locales：src/i18n/locales.js 里的语言代码（还没有这个文件时为 null）。
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { categories, layouts } from "../src/data/atlas.js";

const SITE = resolve(import.meta.dirname, "..");
const UI_FILE = join(SITE, "src/i18n/ui/zh.json");
const OUT_DIR = join(SITE, ".cache/i18n");
const OUT = join(OUT_DIR, "source.json");

const taxonomy = {};
const tree = {};
for (const c of categories) {
  taxonomy[c.slug] = { name: c.name, blurb: c.blurb };
  tree[c.slug] = {};
  for (const s of c.subs) {
    taxonomy[s.slug] = { name: s.name, blurb: s.blurb };
    tree[c.slug][s.slug] = s.ids;
  }
}

const shown = {};
for (const l of layouts) {
  shown[l.id] = {
    name: l.name,
    nameEn: l.nameEn,
    summary: l.summary,
    points: l.points.map((p) => ({ title: p.title, body: p.body })),
    usage: { title: l.usage.title, items: l.usage.items },
    keywords: l.keywords.map((k) => k.zh),
    notes: l.notes,
  };
}

const ui = existsSync(UI_FILE) ? JSON.parse(readFileSync(UI_FILE, "utf8")) : null;
const LOCALES_FILE = join(SITE, "src/i18n/locales.js");
const locales = existsSync(LOCALES_FILE) ? (await import(LOCALES_FILE)).LOCALES.map((l) => l.code) : null;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT + ".tmp", JSON.stringify({ locales, taxonomy, layouts: shown, tree, ui }, null, 1) + "\n");
renameSync(OUT + ".tmp", OUT);
console.log(`${OUT}: ${Object.keys(taxonomy).length} taxonomy, ${Object.keys(shown).length} layouts, ui ${ui ? Object.keys(ui).length + " keys" : "null (no src/i18n/ui/zh.json yet)"}, locales ${locales ? locales.join(",") : "null"}`);
