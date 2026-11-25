// 补审一页（批量里审稿没审成就提交了的）：node tools/followup.mjs <编号>
// 审稿 → 要改就交给 Gemini 改 → build / check / gate 过了再提交；补完从 followup.txt 里划掉。
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { reviewArgs, verdict } from "./review.mjs";
import { gate } from "./gate.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, ".build/batch");
const id = process.argv[2];
if (!/^\d{3}$/.test(id || "")) throw new Error("用法：node tools/followup.mjs <编号>");
const dir = readdirSync(join(ROOT, "pages")).find((d) => d.startsWith(`${id}-`));
const sh = (cmd, args, ms, file) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", timeout: ms, maxBuffer: 1 << 28, killSignal: "SIGKILL" });
  if (file) writeFileSync(file, (r.stdout || "") + (r.stderr || ""));
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
};
const say = (m) => console.log(`${new Date().toTimeString().slice(0, 8)} ${id} ${m}`);

let v;
for (const wait of [0, 1, 3]) {
  if (wait) spawnSync("sleep", [String(wait * 60)]);
  const r = sh("/opt/homebrew/bin/claude", reviewArgs(id), 20 * 60_000, join(OUT, `${id}-review-followup.log`));
  v = verdict(r.out);
  if (r.code === 0 && !v.unparsed) break;
  v = null;
}
if (!v) { say("补审还是没出结果，留在 followup.txt"); process.exit(1); }
const drop = () => { const f = join(OUT, "followup.txt"); if (existsSync(f)) writeFileSync(f, readFileSync(f, "utf8").split("\n").filter((x) => x && x !== id).map((x) => x + "\n").join("")); };
if (v.pass) { say("补审通过"); drop(); process.exit(0); }
say(`补审要改 ${v.points.length} 条，交给 Gemini`);

const prompt = `先完整读 ${join(ROOT, "BRIEF.md")}，那是你的通用任务说明，全部照做。工作区 ${join(ROOT, "..")}。
这一页 ${id} 已经做出来了，在 pages/${dir}/。主编审稿认为还不够好，下面是意见。逐条改好（改不了的在报告里说明为什么），不要从零重写；改完照 BRIEF 的「做完的标准」重新 build、check、看截图、跑交互脚本和 perf：
${v.points.map((p, i) => `${i + 1}. ${p}`).join("\n")}
做完写报告，最后一行写「完成」。`;
const a = sh("/Users/admin/.local/bin/agy", ["-p", prompt, "--model", "gemini-4-neon-xhigh", "--dangerously-skip-permissions", "--disable-slash-commands"], 90 * 60_000, join(OUT, `${id}-followup.log`));
const b = sh("npm", ["run", "build", "--", "--only", id], 10 * 60_000);
const c = b.code === 0 ? sh("npm", ["run", "check", "--", "--only", id], 15 * 60_000) : { code: 1, out: "" };
const first = existsSync(join(OUT, `${id}-1.log`)) ? readFileSync(join(OUT, `${id}-1.log`), "utf8") : "";
const problems = b.code === 0 && c.code === 0 ? gate(id, first + a.out) : ["build 或 check 没过"];
if (problems.length) { say(`改完没过：${problems.join("；")}，没提交`); process.exit(1); }
// 批量也在提交，撞上 index.lock 就等一下再来
for (let i = 0; i < 10; i++) {
  if (sh("git", ["add", "--", `pages/${dir}`]).code === 0) break;
  spawnSync("sleep", ["3"]);
}
const name = JSON.parse(readFileSync(join(ROOT, "pages", dir, "page.json"), "utf8")).title_en.toLowerCase().replace(/ composition$/, "").replace(/[^a-z0-9]+/g, " ").trim();
for (let i = 0; i < 10; i++) {
  if (sh("git", ["commit", "-q", "-m", `Revise the interactive ${name} page`, "--", `pages/${dir}`]).code === 0) break;
  spawnSync("sleep", ["3"]);
}
drop();
say("按补审意见改完，已提交");
