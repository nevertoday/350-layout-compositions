// 审稿：页面过了 build / check / gate 之后，让 Claude（claude -p）一张张看截图、读页面，判断好不好。
// 不好就给出具体可改的点，batch.mjs 把它们交回给 Gemini 改。batch.mjs 每页都重新读这个文件。
//   reviewArgs(id)  -> claude 的命令行参数
//   verdict(out)    -> { pass: boolean, points: string[] }（读输出最后一个 JSON）
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { context } from "./gate.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SHOTS = join(ROOT, ".build/shots");

export function reviewArgs(id, { round = 1, previous = [] } = {}) {
  const dir = readdirSync(join(ROOT, "pages")).find((d) => d.startsWith(`${id}-`));
  const shots = existsSync(SHOTS) ? readdirSync(SHOTS).filter((f) => f.startsWith(`${id}-`)).sort().map((f) => join(SHOTS, f)) : [];
  const prompt = `你是这套「350 种排版 · 互动版」的主编，审 ${id} 这一页。作者是另一个模型，你的意见会原样交给它去改。

先读 ${join(ROOT, "BRIEF.md")} 和 ${join(ROOT, "GUIDE.md")}（标准都在里面）。然后：
1. 看原海报 ${join(ROOT, "pages", dir, "poster.webp")}。
2. 用 Read 一张张看这一页的截图（每张都看，tour 是整页一屏一屏往下）：
${shots.map((s) => `   ${s}`).join("\n")}
3. 读页面源码 ${join(ROOT, "pages", dir)}/（index.html、page.json、主要的 js）。
4. ${context(id)}
   挑其中三四页的 1440 截图看一眼，对比这一页是不是在重复它们。

按这几条判断，每条都要真看过才下结论：
- 像不像这张海报：配色、字体气质、图形母题、版式节奏。
- 和最近的页明显不同吗：开场玩法、版式骨架、配色、字体。只是换了颜色的同一种玩法算重复。
- 开场玩具：是不是真在演示「这一种」排版的道理，玩起来有没有意思、读数有没有说清「为什么」；手机竖屏第一屏能看到它的大半吗。
- 排版和审美：字号层级、对齐、留白；有没有挤、压字、溢出、截断、大块空白、看不清的小字、低对比度。
- 内容：讲清为什么而不只是是什么；来源具体可查（人名、书名、年份）；有「什么时候别用」和带理由的练习；有没有空话套话、凑字数、编的数字、明显的事实错误。
- 画人有没有画五官（不许）。

${round > 1 ? `这是第 ${round} 轮。上一轮提的意见是：
${previous.map((p, i) => `${i + 1}. ${p}`).join("\n")}
这一轮先逐条核对它们改到了没有；没改到或改坏了的照提。新问题只提硬伤：事实错误、看不清或被截断、手机上用不了、和别的页明显重复；其余小毛病不再提，能放行就放行。
` : ""}只有具体、值得改一轮的问题才提；挑剔细枝末节不算。好就放行。
最后一行只输出一个 JSON（不要代码块）：
{"verdict":"pass" 或 "revise","points":["……"]}
revise 时 points 最多 6 条，按重要性排，每条写清：在哪（第几节 / 哪个控件 / 哪个尺寸的截图）、哪里不好、怎么改。pass 时 points 可以写 0–2 条小建议。`;
  return ["-p", prompt, "--model", "opus", "--allowedTools", "Read", "Glob", "Grep", "--output-format", "text"];
}

export function verdict(out) {
  // 意见里常有 CSS 的 { }，不能用正则配括号：从最后一个 {"verdict" 起，往后逐个 } 试着 JSON.parse
  const at = out.lastIndexOf('{"verdict"');
  if (at >= 0) {
    for (let end = out.indexOf("}", at); end >= 0; end = out.indexOf("}", end + 1)) {
      try {
        const j = JSON.parse(out.slice(at, end + 1));
        if (j.verdict === "pass" || j.verdict === "revise") return { pass: j.verdict === "pass", points: Array.isArray(j.points) ? j.points.map(String) : [] };
      } catch {}
    }
  }
  return { pass: true, points: [], unparsed: true };
}
