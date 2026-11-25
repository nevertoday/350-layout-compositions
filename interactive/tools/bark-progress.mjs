// 批量每做完 4 页发一次 Bark：node tools/bark-progress.mjs <批量进程 PID>
// 跟着 .build/batch/run.log 往下读「✓ 提交」「✓ 回头查通过」，攒够 4 个就推一条；批量进程没了再推一条收尾。
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NOTIFY = "/Users/admin/.claude/skills/xxd-notify/scripts/xxd_notify.py";
const PID = Number(process.argv[2]);
const EVERY = 4;
const text = JSON.parse(readFileSync(join(ROOT, "../site/src/data/poster-text.json"), "utf8"));

// 按新规矩做完的：016–350 里 page.json 有 concept 且已提交
function doneCount() {
  return readdirSync(join(ROOT, "pages")).filter((d) => {
    const id = d.slice(0, 3);
    if (!/^\d{3}$/.test(id) || id < "016") return false;
    try { return JSON.parse(execFileSync("git", ["show", `HEAD:./pages/${d}/page.json`], { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString()).concept; } catch { return false; }
  }).length;
}
function bark(status, title, body) {
  try { execFileSync("/opt/homebrew/bin/python3", [NOTIFY, "send", "-s", status, "-t", title, "-b", body, "--subtitle", "350 种排版 · 互动页批量", "--url", "https://layout.xiaoxiaodong.ai/"], { stdio: "ignore" }); } catch {}
}

let batch = [];
const tail = spawn("tail", ["-n0", "-F", join(ROOT, ".build/batch/run.log")]);
let rest = "";
tail.stdout.on("data", (b) => {
  const lines = (rest + b).split("\n");
  rest = lines.pop();
  for (const line of lines) {
    const m = line.match(/ (\d{3}) ✓ (提交|回头查通过)/);
    if (!m) continue;
    batch.push(m[1]);
    if (batch.length < EVERY) continue;
    const n = doneCount();
    bark("progress", `互动页又做完 ${EVERY} 页（${n}/335）`, [...batch.map((id) => `${id} ${text[id]?.title ?? ""}`), `016–350 已完成 ${n} 页，还剩 ${335 - n} 页`].join("\n"));
    batch = [];
  }
});
const timer = setInterval(() => {
  try { process.kill(PID, 0); return; } catch {}
  clearInterval(timer);
  const n = doneCount();
  const last = readFileSync(join(ROOT, ".build/batch/run.log"), "utf8").trim().split("\n").at(-1).slice(0, 120);
  bark(n >= 335 ? "done" : "stop", n >= 335 ? "互动页 335 页全部做完" : `互动页批量停了（${n}/335）`, [batch.length ? `最后几页：${batch.join(" ")}` : "", `016–350 已完成 ${n} 页`, last].filter(Boolean).join("\n"));
  tail.kill();
  process.exit(0);
}, 30_000);
