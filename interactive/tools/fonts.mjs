// npm run fonts：列出每页的字体搭配（只看字体，不管字重），和编号相邻的页面一样的标出来。挑字体前先看一眼。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fontSet, fontTwin, listPages, ROOT } from "../build.mjs";

const FONTS = JSON.parse(readFileSync(join(ROOT, "fonts.json"), "utf8"));
const dirs = listPages().filter((d) => !d.startsWith("000-"));
for (const d of dirs) {
  const twin = fontTwin(d, dirs);
  console.log(`${d.slice(0, 3)}  ${fontSet(d).map((n) => FONTS[n].family).join(" + ")}${twin ? `  ⚠ 和 ${twin.slice(0, 3)} 一样` : ""}`);
}
