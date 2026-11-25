// 批量的两样规矩，batch.mjs 每页都重新读这个文件（改了不用重启批量）：
//   context(id)       给作者看的「最近做完的页」：开场截图路径、concept、字体 —— 让它避开
//   gate(id, report)  build + check 过了之后再查一遍有没有偷懒、有没有抄；返回问题列表，空的才提交
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PAGES = join(ROOT, "pages");
const RECENT = 12;

const dirOf = (id) => readdirSync(PAGES).find((d) => d.startsWith(`${id}-`));
const pageJson = (dir) => JSON.parse(readFileSync(join(PAGES, dir, "page.json"), "utf8"));
const fontNames = (dir) => [...new Set(pageJson(dir).fonts.map((f) => f.name))];

// 按提交时间从新到旧的页（不含 000 模板）
// before：只算这个时间（毫秒）之前提交的页。字体规则按这一页开工时看到的为准，
// 不然 6 个作者同时做，开工时没人用的字体，交稿时可能刚被别人用掉，白白打回。
function recent(exceptId, before = Infinity) {
  const out = execFileSync("git", ["log", "--diff-filter=A", "--format=@%ct", "--name-only", "--", "pages/*/page.json"], { cwd: ROOT }).toString();
  const dirs = [];
  let t = 0;
  for (const line of out.split("\n").filter(Boolean)) {
    if (line.startsWith("@")) { t = Number(line.slice(1)) * 1000; continue; }
    const d = line.split("/").at(-2);
    if (t < before && !dirs.includes(d)) dirs.push(d);
  }
  return dirs.filter((d) => !d.startsWith("000-") && !d.startsWith(`${exceptId}-`) && existsSync(join(PAGES, d, "page.json"))).slice(0, RECENT);
}
// 这一页开工的时间：批量给它写的第一份日志
function startedAt(id) {
  const dir = join(ROOT, ".build/batch");
  const times = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(`${id}-`) && f.endsWith(".log")).map((f) => statSync(join(dir, f)).birthtimeMs) : [];
  return times.length ? Math.min(...times) : Infinity;
}

export function context(id) {
  const lines = recent(id).map((d) => {
    const c = pageJson(d).concept;
    const what = c ? `开场：${c.toy}；版式：${c.layout}；样子：${c.look}` : "（没写 concept，看截图）";
    return `- ${d.slice(0, 3)} 截图 ${join(ROOT, ".build/shots", `${d.slice(0, 3)}-1440x900.png`)} 和 -390x844.png；${what}；字体 ${fontNames(d).join("+")}`;
  });
  return `最近做完的 ${lines.length} 页（开工前先看它们的截图，你的开场玩法、版式骨架、配色、字体都要明显不同）：\n${lines.join("\n")}`;
}

// ---------- 查 ----------
const cjk = (s) => (s.match(/[一-鿿]/g) || []).join("");
function pageText(dir) {
  const d = join(PAGES, dir);
  return readdirSync(d).filter((f) => /\.(html|js)$/.test(f)).map((f) => readFileSync(join(d, f), "utf8")).join("\n");
}
const SHINGLE = 20;
// 页名（列兄弟页、导航时各页都会写）和页脚固定字不算抄：比对前先抹掉，长的先抹
const NAMES = (() => {
  const cat = JSON.parse(readFileSync(join(ROOT, "../v2/catalog.json"), "utf8")).map((c) => c.name);
  const pt = Object.values(JSON.parse(readFileSync(join(ROOT, "../site/src/data/poster-text.json"), "utf8"))).map((t) => t.title);
  return [...new Set([...cat, ...pt, "全部 350 种排版", "在线版", "海报", "源文件"].filter((n) => n && n.length >= 2))].sort((a, b) => b.length - a.length);
})();
const stripNames = (s) => NAMES.reduce((acc, n) => acc.split(n).join(" "), s);
function shingles(text) {
  const s = cjk(stripNames(text)), set = new Set();
  for (let i = 0; i + SHINGLE <= s.length; i += 2) set.add(s.slice(i, i + SHINGLE));
  return set;
}

export function gate(id, report) {
  const problems = [];
  const dir = dirOf(id);
  if (!dir) return ["没有 pages/<编号>-*/ 目录"];
  const pj = pageJson(dir);
  const html = readFileSync(join(PAGES, dir, "index.html"), "utf8");
  const text = pageText(dir);

  const c = pj.concept || {};
  if (!["toy", "layout", "look"].every((k) => typeof c[k] === "string" && c[k].trim().length >= 6)) problems.push('page.json 缺 concept（toy / layout / look 三句话）');
  const h2 = (text.match(/<h2[\s>]/g) || []).length;
  if (h2 < 6) problems.push(`大节只有 ${h2} 个 h2，至少 6 个`);
  if (!/别用|不适合|慎用|不要用|不宜|什么时候不|什么时候别|何时别|反例|失效/.test(text)) problems.push("没有「什么时候别用」");
  if (!/练习|练一练|小测|挑一挑|选一选/.test(text)) problems.push("没有小练习");
  if (!/id="poster"/.test(html)) problems.push('没有原海报 <img id="poster">');
  if (!/layout\.xiaoxiaodong\.ai/.test(text)) problems.push("页脚没有在线版地址");
  if (/准星/.test(text)) problems.push("出现了「准星」：这个开场已经用烂了，换一种玩法");

  const probe = join(ROOT, ".build/probe", id);
  if (!existsSync(probe) || readdirSync(probe).length === 0) problems.push(`没有交互脚本 .build/probe/${id}/`);
  const urls = new Set((report.match(/https?:\/\/[^\s)）」>`'"、，]+/g) || []).filter((u) => !/xiaoxiaodong\.ai|localhost|127\.0\.0\.1/.test(u)));
  if (urls.size < 3) problems.push(`报告里核实用的网址只有 ${urls.size} 个，至少 3 个`);

  const others = recent(id, startedAt(id));
  const usedRecently = new Set(others.flatMap(fontNames));
  if (others.length && fontNames(dir).every((n) => usedRecently.has(n))) problems.push(`字体 ${fontNames(dir).join("+")} 全是最近 ${others.length} 页用过的，至少换一款没用过的`);

  const mine = shingles(text);
  for (const d of readdirSync(PAGES).filter((d) => /^\d{3}-/.test(d) && d !== dir && !d.startsWith("000-") && existsSync(join(PAGES, d, "index.html")))) {
    let same = 0;
    for (const s of shingles(pageText(d))) if (mine.has(s)) same++;
    if (same > 15) problems.push(`和 ${d.slice(0, 3)} 有 ${same} 段 20 字以上的文字一样：自己写`);
  }
  return problems;
}
