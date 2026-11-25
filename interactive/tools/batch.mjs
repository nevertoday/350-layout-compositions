// 批量做互动页：node tools/batch.mjs [起 止] —— 默认 016 到 350。
//   - 队列切成 WORKERS 段连续编号，每段一个作者从头往后做：相邻编号先后完成，选字体时前一页已经在了。
//   - 每页交给 agy（Gemini，MODEL），说明在 BRIEF.md；超过 90 分钟连同它起的进程（含无头 Chrome）一起杀掉。
//   - 作者说做完了不算数：这里自己 build + check 过了才提交这一页；不过就把失败的输出交给下一个作者接着做，最多 ATTEMPTS 次。
//   - 已经提交过的编号跳过，所以随时可以停、再从头跑。停：touch .build/batch/STOP（做完手上这页就停）。
//   - 每提交 DEPLOY_EVERY 页、以及全部做完时，跑 tools/release.mjs 上线。
// 记录：.build/batch/run.log（一行一件事），results.jsonl，每页作者的输出 <编号>-<第几次>.log。
import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // interactive/
const REPO = join(ROOT, "..");
const OUT = join(ROOT, ".build/batch");
mkdirSync(OUT, { recursive: true });

const MODEL = process.env.MODEL || "gemini-4-neon-xhigh";
const WORKERS = Number(process.env.WORKERS || 4);
const ATTEMPTS = 3;
const AUTHOR_MS = 90 * 60_000;
const DEPLOY_EVERY = Number(process.env.DEPLOY_EVERY || 20);
const AGY = "/Users/admin/.local/bin/agy";
const [from = "016", to = "350"] = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toTimeString().slice(0, 8);
const log = (msg) => { const line = `${stamp()} ${msg}`; console.log(line); appendFileSync(join(OUT, "run.log"), line + "\n"); };
const record = (o) => appendFileSync(join(OUT, "results.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n");
const stopped = () => existsSync(join(OUT, "STOP"));

// ---------- 数据：每个编号是什么、同一小类还有谁 ----------
const catalog = JSON.parse(readFileSync(join(REPO, "v2/catalog.json"), "utf8"));
const text = JSON.parse(readFileSync(join(REPO, "site/src/data/poster-text.json"), "utf8"));
const byId = new Map(catalog.map((c) => [c.id, c]));
const ids = catalog.map((c) => c.id).filter((id) => id >= from && id <= to).sort();

const pageDir = (id) => readdirSync(join(ROOT, "pages")).find((d) => d.startsWith(`${id}-`));
const committed = (id) => execFileSync("git", ["ls-files", "--", `pages/${id}-*/index.html`], { cwd: ROOT }).toString().trim() !== "";

async function prompt(id, retry) {
  const { context } = await import(`./gate.mjs?${Date.now()}`);
  const c = byId.get(id), t = text[id];
  const peers = catalog.filter((p) => p.subcategory_slug === c.subcategory_slug && p.id !== id).map((p) => `${p.id} ${p.name}`).join("、");
  return [
    `先完整读 ${join(ROOT, "BRIEF.md")}，那是你的通用任务说明，全部照做。工作区 ${REPO}。`,
    `你要做的编号是 ${id}「${t.title} ${t.title_en}」，属于「${c.category} / ${c.subcategory}」。`,
    t.summary ? `海报上的总述：${t.summary.replace(/\s+/g, " ")}` : "",
    peers ? `同一小类的其他编号（各有一页，不要重讲它们的重点；提到时一句话链接到 https://layout.xiaoxiaodong.ai/<编号>/play/）：${peers}。` : "",
    context(id),
    retry ? `\n这一页上次没有做完：${retry.reason}。pages/${pageDir(id) ?? `${id}-*`}/ 里是上次留下的东西，先看懂再接着做完，不要从零重写能用的部分。上次检查输出的最后几行：\n${retry.tail}` : "",
    `做完写报告，最后一行写「完成」。`,
  ].filter(Boolean).join("\n");
}

// ---------- 子进程：带时限，超时连子孙一起杀 ----------
function tree(pid) {
  const kids = new Map();
  for (const line of execFileSync("ps", ["-axo", "pid=,ppid="]).toString().trim().split("\n")) {
    const [p, pp] = line.trim().split(/\s+/).map(Number);
    if (!kids.has(pp)) kids.set(pp, []);
    kids.get(pp).push(p);
  }
  const out = [], todo = [pid];
  while (todo.length) { const p = todo.pop(); out.push(p); todo.push(...(kids.get(p) || [])); }
  return out;
}
async function killTree(pid) {
  const pids = tree(pid);
  for (const p of pids) try { process.kill(p, "SIGTERM"); } catch {}
  await sleep(5000);
  for (const p of tree(pid).concat(pids)) try { process.kill(p, "SIGKILL"); } catch {}
}
function run(cmd, args, { ms, file, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", timedOut = false;
    const take = (b) => { out += b; if (file) appendFileSync(file, b); };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    const timer = setTimeout(() => { timedOut = true; killTree(child.pid); }, ms);
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, out, timedOut }); });
  });
}
const tail = (s, n = 25) => s.trim().split("\n").slice(-n).join("\n");

// ---------- 内存：低于 15% 空闲就等 ----------
async function roomToRun() {
  for (;;) {
    const free = Number(execFileSync("memory_pressure").toString().match(/free percentage: (\d+)/)?.[1] ?? 100);
    if (free >= 15) return;
    log(`内存只剩 ${free}%，等 2 分钟`);
    await sleep(120_000);
  }
}

// ---------- git 操作排队（提交和上线时的 rebase / push 不能撞） ----------
let gitChain = Promise.resolve();
export const withGit = (fn) => (gitChain = gitChain.then(fn, fn));

// 上线前在本工作区（排着 git 的队）：跟上 origin/main，确认线上没有 main 以外的东西，推上去；
// 构建和 deploy 交给 release.mjs，在另一个干净的工作区里按这个提交做（正在写的页不会混进去）。
const git = (...a) => execFileSync("git", a, { cwd: ROOT }).toString().trim();
const sha1 = (s) => execFileSync("shasum", { input: s }).toString().slice(0, 12);
async function pushForRelease() {
  git("fetch", "-q", "origin");
  try { git("rebase", "-q", "origin/main"); } catch (e) { try { git("rebase", "--abort"); } catch {} throw new Error(`rebase 冲突：${e.message.split("\n")[0]}`); }
  const live = sha1(await (await fetch("https://layout.xiaoxiaodong.ai/site.css", { cache: "no-store" })).text());
  const known = git("log", "-20", "--format=%H", "origin/main", "--", "site/public/site.css").split("\n").map((h) => sha1(git("show", `${h}:site/public/site.css`)));
  if (!known.includes(live)) throw new Error(`线上的 site.css（${live}）不是 main 上的任何一版，可能有人从别处部署过`);
  git("push", "-q", "origin", "HEAD:main");
  return git("rev-parse", "HEAD");
}

let sinceDeploy = 0, releasing = null;
function maybeRelease(force = false) {
  if (releasing || (!force && sinceDeploy < DEPLOY_EVERY)) return releasing;
  const n = sinceDeploy;
  sinceDeploy = 0;
  log(`上线：新提交 ${n} 页`);
  releasing = withGit(pushForRelease)
    .then((sha) => run("node", ["tools/release.mjs", sha], { ms: 60 * 60_000, file: join(OUT, "release.log") }))
    .then((r) => { if (r.code !== 0) throw new Error(tail(r.out, 3).replace(/\n/g, " | ")); log(`上线完成：${tail(r.out, 1)}`); })
    .catch((e) => { log(`上线没做成：${e.message}`); sinceDeploy += n; })
    .finally(() => { releasing = null; });
  return releasing;
}

// ---------- 一页 ----------
async function page(id) {
  if (committed(id)) return;
  let retry = null;
  for (let attempt = 1, flaky = 0; attempt <= ATTEMPTS; ) {
    if (stopped()) return;
    await roomToRun();
    const started = Date.now();
    const file = join(OUT, `${id}-${attempt}.log`);
    log(`${id} 开始（第 ${attempt} 次）`);
    const a = await run(AGY, ["-p", await prompt(id, retry), "--model", MODEL, "--dangerously-skip-permissions", "--disable-slash-commands"], { ms: AUTHOR_MS, file });
    const minutes = Math.round((Date.now() - started) / 60_000);
    // 三分钟内就退出、连目录都没有：多半是额度、网络，不算一次，歇一会儿再来
    if (!a.timedOut && minutes < 3 && !pageDir(id)) {
      if (++flaky > 6) { log(`${id} agy 一直起不来，跳过：${tail(a.out, 2)}`); record({ id, ok: false, why: "agy" }); return; }
      log(`${id} agy ${minutes} 分钟就退出了，歇 10 分钟：${tail(a.out, 2).replace(/\n/g, " | ")}`);
      await sleep(10 * 60_000);
      continue;
    }
    const b = await run("npm", ["run", "build", "--", "--only", id], { ms: 10 * 60_000 });
    const c = b.code === 0 ? await run("npm", ["run", "check", "--", "--only", id], { ms: 15 * 60_000 }) : null;
    const { gate } = await import(`./gate.mjs?${Date.now()}`);
    const problems = b.code === 0 && c.code === 0 ? gate(id, a.out) : [];
    const ok = b.code === 0 && c.code === 0 && problems.length === 0;
    if (ok) {
      const p = await run("node", ["tools/perf.mjs", `batch${id}`], { ms: 10 * 60_000, env: { ONLY: id } });
      const fps = (p.out.match(/'(hero|drag[^']*)'\s*│\s*([\d.]+)/g) || []).map((m) => Number(m.split("│")[1])).filter(Number.isFinite);
      const dir = pageDir(id), t = text[id];
      const name = t.title_en.toLowerCase().replace(/ composition$/, "").replace(/[^a-z0-9]+/g, " ").trim();
      await withGit(() => {
        execFileSync("git", ["add", "--", `pages/${dir}`], { cwd: ROOT });
        execFileSync("git", ["commit", "-q", "-m", `Add the interactive ${name} page`, "--", `pages/${dir}`], { cwd: ROOT });
      });
      const minFps = fps.length ? Math.min(...fps) : null;
      log(`${id} ✓ 提交（${minutes} 分钟${a.timedOut ? "，作者超时被停" : ""}，最低 ${minFps ?? "?"} 帧${minFps !== null && minFps < 40 ? " ⚠ 低于 40" : ""}）`);
      record({ id, ok: true, attempt, minutes, timedOut: a.timedOut, minFps, said: /完成\s*$/.test(a.out.trim()) });
      sinceDeploy++;
      maybeRelease();
      return;
    }
    const reason = a.timedOut ? "作者 90 分钟没做完被停了" : b.code !== 0 ? "build 没过" : c.code !== 0 ? "check 没过" : `自查没过：${problems.join("；")}`;
    log(`${id} ✗ ${reason}（${minutes} 分钟）`);
    retry = { reason, tail: problems.length ? problems.map((p) => `- ${p}`).join("\n") : tail((c ?? b).out) };
    attempt++;
  }
  record({ id, ok: false, why: retry?.reason });
  log(`${id} 放弃：${ATTEMPTS} 次都没过，目录留着等人看`);
}

// ---------- 分段，开跑 ----------
const segments = Array.from({ length: WORKERS }, (_, k) => ids.slice(Math.round((k * ids.length) / WORKERS), Math.round(((k + 1) * ids.length) / WORKERS)));
log(`开跑 ${MODEL}：${ids.length} 个编号，${WORKERS} 段 ${segments.map((s) => `${s[0]}–${s.at(-1)}`).join(" ")}，每 ${DEPLOY_EVERY} 页上线一次`);
await Promise.all(segments.map(async (seg) => { for (const id of seg) { if (stopped()) break; await page(id); } }));
await releasing;
if (sinceDeploy) await maybeRelease(true);
const all = readFileSync(join(OUT, "results.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
log(`结束${stopped() ? "（STOP）" : ""}：这一段还没提交的 ${ids.filter((id) => !committed(id)).join(" ") || "无"}；记录里放弃的 ${all.filter((r) => !r.ok).map((r) => r.id).join(" ") || "无"}`);
