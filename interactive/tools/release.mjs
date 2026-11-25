// 把某个已推到 main 的提交上线：node tools/release.mjs <sha>
// 在单独的工作区 ../350-layout-deploy 里检出这个提交（只有提交过的页），构建网站、检查、wrangler deploy，
// 再确认每个互动页线上能打开，最后把 zip 拷到桌面。前面的 fetch / rebase / 线上比对 / push 由 batch.mjs 做。
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const DEPLOY = join(REPO, "../350-layout-deploy");
const sha = process.argv[2];
if (!/^[0-9a-f]{7,40}$/.test(sha || "")) throw new Error("用法：node tools/release.mjs <sha>");
const sh = (cmd, args, cwd) => { console.log(`$ ${cmd} ${args.join(" ")}  (${cwd})`); execFileSync(cmd, args, { cwd, stdio: "inherit" }); };

if (!existsSync(DEPLOY)) sh("git", ["worktree", "add", "--detach", DEPLOY, sha], REPO);
else sh("git", ["checkout", "-q", "--detach", sha], DEPLOY);
for (const d of ["site", "interactive"]) if (!existsSync(join(DEPLOY, d, "node_modules"))) sh("npm", ["ci", "--no-audit", "--no-fund"], join(DEPLOY, d));

const site = join(DEPLOY, "site");
sh("npm", ["run", "build"], site);
sh("npm", ["run", "check"], site);
sh("npx", ["wrangler", "deploy"], site);

const ids = readdirSync(join(DEPLOY, "interactive/pages")).map((d) => d.slice(0, 3)).filter((id) => /^\d{3}$/.test(id) && id !== "000");
const bad = [];
for (const id of ids) {
  const r = await fetch(`https://layout.xiaoxiaodong.ai/${id}/play/`, { method: "HEAD", cache: "no-store" });
  if (r.status !== 200) bad.push(`${id}:${r.status}`);
}
if (bad.length) throw new Error(`这些互动页线上打不开：${bad.join(" ")}`);
copyFileSync(join(DEPLOY, "interactive/dist/350-layout-interactive.zip"), join(homedir(), "Desktop/350种排版-互动版.zip"));
console.log(`${sha.slice(0, 7)} 已上线，互动页 ${ids.length} 个（${ids[0]}–${ids.at(-1)}），桌面 zip 已更新`);
