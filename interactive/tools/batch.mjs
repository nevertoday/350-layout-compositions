// 批量做互动页：node tools/batch.mjs [起 止] —— 默认 016 到 350。
//   - 队列切成 WORKERS 段连续编号，每段一个作者从头往后做：相邻编号先后完成，选字体时前一页已经在了。
//   - 每页交给 agy（Gemini，MODEL），说明在 BRIEF.md；超过 90 分钟连同它起的进程（含无头 Chrome）一起杀掉。
//   - 作者说做完了不算数：这里自己 build + check 过了才提交这一页；不过就把失败的输出交给下一个作者接着做，最多 ATTEMPTS 次。
//   - 已经提交过的编号跳过，所以随时可以停、再从头跑。停：touch .build/batch/STOP（做完手上这页就停）。
//   - 每提交 DEPLOY_EVERY 页、以及全部做完时，跑 tools/release.mjs 上线。
// 记录：.build/batch/run.log（一行一件事），results.jsonl，每页作者的输出 <编号>-<第几次>.log。
import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // interactive/
const REPO = join(ROOT, "..");
const OUT = join(ROOT, ".build/batch");
mkdirSync(OUT, { recursive: true });

const MODEL = process.env.MODEL || "gemini-4-neon-xhigh";
const WORKERS = Number(process.env.WORKERS || 8);
const ATTEMPTS = 4;
const REVIEWS = 2;
// Claude 审方案、审成品：用户说省算力，默认关掉；REVIEW=1 再打开。自动检查（build / check / gate）照常
const REVIEW = process.env.REVIEW === "1";
const CLAUDE = "/opt/homebrew/bin/claude";
const AUTHOR_MS = 90 * 60_000;
const DEPLOY_EVERY = Number(process.env.DEPLOY_EVERY || 20);
const AGY = "/Users/admin/.local/bin/agy";
const [from = "016", to = "350"] = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toTimeString().slice(0, 8);
// 磁盘满时写日志会抛 ENOSPC，不能让整批因此退出
const append = (file, text) => { try { appendFileSync(file, text); } catch (e) { console.error(`写不进 ${file}：${e.code}`); } };
const log = (msg) => { const line = `${stamp()} ${msg}`; console.log(line); append(join(OUT, "run.log"), line + "\n"); };
const record = (o) => append(join(OUT, "results.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n");
const stopped = () => existsSync(join(OUT, "STOP"));

// ---------- 数据：每个编号是什么、同一小类还有谁 ----------
const catalog = JSON.parse(readFileSync(join(REPO, "v2/catalog.json"), "utf8"));
const text = JSON.parse(readFileSync(join(REPO, "site/src/data/poster-text.json"), "utf8"));
const byId = new Map(catalog.map((c) => [c.id, c]));
const ids = catalog.map((c) => c.id).filter((id) => id >= from && id <= to).sort();

const pageDir = (id) => readdirSync(join(ROOT, "pages")).find((d) => d.startsWith(`${id}-`));
const committed = (id) => execFileSync("git", ["ls-files", "--", `pages/${id}-*/index.html`], { cwd: ROOT }).toString().trim() !== "";

async function prompt(id, retry, stage = "build") {
  const { context } = await import(`./gate.mjs?${Date.now()}`);
  const c = byId.get(id), t = text[id];
  const peers = catalog.filter((p) => p.subcategory_slug === c.subcategory_slug && p.id !== id).map((p) => `${p.id} ${p.name}`).join("、");
  return [
    `先完整读 ${join(ROOT, "BRIEF.md")}，那是你的通用任务说明，全部照做。工作区 ${REPO}。`,
    `你要做的编号是 ${id}「${t.title} ${t.title_en}」，属于「${c.category} / ${c.subcategory}」。`,
    t.summary ? `海报上的总述：${t.summary.replace(/\s+/g, " ")}` : "",
    peers ? `同一小类的其他编号（各有一页，不要重讲它们的重点；提到时一句话链接到 https://layout.xiaoxiaodong.ai/<编号>/play/）：${peers}。` : "",
    context(id),
    stage === "plan"
      ? `\n这一步只出方案，不写页面代码、不 build：先 npm run new -- ${id}，再照 BRIEF「先写方案」写 pages/<编号>-*/PLAN.md，并把 concept 写进 page.json。主编看过方案才开始做页面。`
      : retry?.plan
      ? `\n方案已经写在 pages/${pageDir(id)}/PLAN.md。主编看过方案，意见如下；先按意见改好 PLAN.md，再照方案把整页做完：\n${retry.tail}`
      : retry?.review
      ? `\n这一页已经做出来了，在 pages/${pageDir(id)}/。${retry.reason}，下面是主编的意见。逐条改好（改不了的在报告里说明为什么），不要从零重写。改完 build + check，看和这几条有关的截图；改了交互才重跑交互脚本，改了动画或 3D 才重跑 perf（提交前批量自己还会完整查一遍、测一次帧率）：\n${retry.tail}`
      : retry ? `\n这一页上次没有做完：${retry.reason}。pages/${pageDir(id) ?? `${id}-*`}/ 里是上次留下的东西，先看懂再接着做完，不要从零重写能用的部分。上次检查输出的最后几行：\n${retry.tail}` : "",
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
    const take = (b) => { out += b; if (file) append(file, b); };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    const timer = setTimeout(() => { timedOut = true; killTree(child.pid); }, ms);
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, out, timedOut }); });
  });
}
const tail = (s, n = 25) => s.trim().split("\n").slice(-n).join("\n");

// ---------- 内存低于 15% 空闲、磁盘少于 10 GB 就等 ----------
const diskFreeGB = () => Number(execFileSync("df", ["-k", ROOT]).toString().trim().split("\n").at(-1).split(/\s+/)[3]) / 1048576;
async function roomToRun() {
  for (;;) {
    const disk = diskFreeGB();
    if (disk < 10) { log(`⚠ 磁盘只剩 ${disk.toFixed(1)} GB，等 5 分钟`); await sleep(300_000); continue; }
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
  const known = git("log", "-20", "--format=%H", "origin/main", "--", "site/public/site.css").split("\n").map((h) => sha1(execFileSync("git", ["show", `${h}:site/public/site.css`], { cwd: ROOT }))); // 原样的字节，不能 trim
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
// 一页的流程：作者做 → 自己 build / check / gate → 过了就请 Claude 审稿（最多 REVIEWS 轮）→ 不好就把意见交回作者改。
// 作者最多跑 ATTEMPTS 次；两轮审稿后的修改不再审，只要 build / check / gate 过了就提交。
// 新规矩（page.json 有 concept）之前提交的页：不重做，先过 gate 和审稿，不好再交给作者改。
const hasConcept = (id) => { try { return !!JSON.parse(readFileSync(join(ROOT, "pages", pageDir(id), "page.json"), "utf8")).concept; } catch { return false; } };
// 每个编号同一时间只有一个作者：.build/batch/lock/<编号>（开跑时清掉上一轮留下的）
const LOCKS = join(OUT, "lock");
const FOLLOWUP = join(OUT, "followup.txt"); // 审稿没审成就提交了的编号，下次开跑先补审
async function page(id) {
  try { mkdirSync(join(LOCKS, id), { recursive: false }); } catch { return; }
  try { await makePage(id); } finally { rmSync(join(LOCKS, id), { recursive: true, force: true }); }
}
async function makePage(id) {
  const revisit = committed(id);
  const followup = existsSync(FOLLOWUP) && readFileSync(FOLLOWUP, "utf8").split("\n").includes(id);
  if (revisit && hasConcept(id) && !followup) return;
  if (followup) writeFileSync(FOLLOWUP, readFileSync(FOLLOWUP, "utf8").split("\n").filter((x) => x && x !== id).map((x) => x + "\n").join(""));
  let retry = null, reviews = 0, flaky = 0, skipAuthor = revisit, lastPoints = [];
  // 上一轮批量被打断时做到一半的页：接着做，不从零开始
  const built = existsSync(join(OUT, `${id}-1.log`)); // 动手做过页面没有（只写过方案的不算）
  if (!revisit && pageDir(id) && built) {
    retry = { reason: "上一轮批量被打断了", tail: "（没有检查输出）" };
    // 被打断前主编已经给过意见的，把最近一轮意见一起交过去
    const last = readdirSync(OUT).filter((f) => new RegExp(`^${id}-review-\\d+\\.log$`).test(f)).sort().at(-1);
    if (last) {
      const { verdict } = await import(`./review.mjs?${Date.now()}`);
      const v = verdict(readFileSync(join(OUT, last), "utf8"));
      if (!v.pass && v.points.length) retry = { review: true, reason: "上一轮批量被打断了，主编之前的意见还没改完", tail: v.points.map((p, i) => `${i + 1}. ${p}`).join("\n") };
    }
  }
  const notes = [];
  if (revisit) log(`${id} 回头查（新规矩之前提交的）`);
  // 新页先出方案、过主编这一关再动手：构思上的问题（玩法撞车、答案先给、练习太易）在这里改最便宜
  if (!revisit && !built && !stopped()) {
    const hasPlan = () => pageDir(id) && existsSync(join(ROOT, "pages", pageDir(id), "PLAN.md"));
    if (!REVIEW) {
      // 不审方案：被打断前已经审过的，把那次意见交过去；没审过的就让作者自己写 PLAN.md 接着做
      const reviewed = join(OUT, `${id}-planreview.log`);
      if (hasPlan() && existsSync(reviewed)) {
        const { verdict } = await import(`./review.mjs?${Date.now()}`);
        const v = verdict(readFileSync(reviewed, "utf8"));
        if (!v.unparsed && v.points.length) retry = { plan: true, tail: v.points.map((p, i) => `${i + 1}. ${p}`).join("\n") };
      }
    } else {
    if (!hasPlan()) {
      await roomToRun();
      log(`${id} 先写方案`);
      await run(AGY, ["-p", await prompt(id, null, "plan"), "--model", MODEL, "--dangerously-skip-permissions", "--disable-slash-commands"], { ms: 25 * 60_000, file: join(OUT, `${id}-plan.log`) });
    }
    if (hasPlan()) {
      const { planReviewArgs, verdict } = await import(`./review.mjs?${Date.now()}`);
      const reviewed = join(OUT, `${id}-planreview.log`);
      // 被打断前方案已经审过的，沿用那次的意见
      const r = existsSync(reviewed) && /"verdict"/.test(readFileSync(reviewed, "utf8")) ? { code: 0, out: readFileSync(reviewed, "utf8") } : await run(CLAUDE, planReviewArgs(id), { ms: 15 * 60_000, file: reviewed });
      const v = r.code === 0 ? verdict(r.out) : { pass: true, points: [] };
      log(`${id} 方案${v.pass ? "通过" : `要改 ${v.points.length} 条`}${v.points[0] ? `：${v.points[0].slice(0, 50)}…` : ""}`);
      notes.push(...v.points.map((p) => `方案：${p}`));
      retry = { plan: true, tail: v.points.length ? v.points.map((p, i) => `${i + 1}. ${p}`).join("\n") : "（方案通过，没有意见，照方案做）" };
    } else log(`${id} 没写出 PLAN.md，直接做页面`);
    }
  }
  for (let attempt = 1; attempt <= ATTEMPTS; ) {
    if (stopped()) return;
    await roomToRun();
    const started = Date.now();
    const file = join(OUT, `${id}-${attempt}.log`);
    let a = { out: existsSync(join(OUT, `${id}-1.log`)) ? readFileSync(join(OUT, `${id}-1.log`), "utf8") : "", timedOut: false, code: 0 };
    if (!skipAuthor) {
    log(`${id} 开始（第 ${attempt} 次${retry?.review ? "，按审稿意见改" : ""}）`);
    a = await run(AGY, ["-p", await prompt(id, retry), "--model", MODEL, "--dangerously-skip-permissions", "--disable-slash-commands"], { ms: AUTHOR_MS, file });
    }
    const minutes = Math.round((Date.now() - started) / 60_000);
    const authored = !skipAuthor;
    if (skipAuthor) { skipAuthor = false; attempt--; }
    // 三分钟内就退出、连目录都没有：多半是额度、网络，不算一次，歇一会儿再来
    if (authored && !a.timedOut && minutes < 3 && (!pageDir(id) || retry?.review || retry?.plan)) {
      if (++flaky > 6) { log(`${id} agy 一直起不来，跳过：${tail(a.out, 2)}`); record({ id, ok: false, why: "agy" }); return; }
      log(`${id} agy ${minutes} 分钟就退出了，歇 10 分钟：${tail(a.out, 2).replace(/\n/g, " | ")}`);
      await sleep(10 * 60_000);
      continue;
    }
    attempt++;
    const b = await run("npm", ["run", "build", "--", "--only", id], { ms: 10 * 60_000 });
    const c = b.code === 0 ? await run("npm", ["run", "check", "--", "--only", id], { ms: 15 * 60_000 }) : null;
    const { gate } = await import(`./gate.mjs?${Date.now()}`);
    const problems = b.code === 0 && c.code === 0 ? gate(id, (existsSync(join(OUT, `${id}-1.log`)) ? readFileSync(join(OUT, `${id}-1.log`), "utf8") : "") + a.out) : [];
    if (b.code !== 0 || c.code !== 0 || problems.length) {
      const reason = a.timedOut ? "作者 90 分钟没做完被停了" : b.code !== 0 ? "build 没过" : c.code !== 0 ? "check 没过" : `自查没过：${problems.join("；")}`;
      log(`${id} ✗ ${reason}（${minutes} 分钟）`);
      retry = { review: revisit, reason: revisit ? `这一页是新规矩之前做的，${reason}` : reason, tail: problems.length ? problems.map((p) => `- ${p}`).join("\n") : tail((c ?? b).out) };
      continue;
    }
    if (REVIEW && reviews < REVIEWS && attempt <= ATTEMPTS) {
      reviews++;
      const { reviewArgs, verdict } = await import(`./review.mjs?${Date.now()}`);
      // 网络断、超时：隔 1、3、10 分钟再审；都不行才放行，并记进 followup.txt，下次开跑时补审
      let r, v;
      for (const wait of [0, 1, 3, 10]) {
        if (wait) { log(`${id} 审稿没出结果（${r.timedOut ? "超时" : `退出码 ${r.code}`}），${wait} 分钟后再审`); await sleep(wait * 60_000); }
        r = await run(CLAUDE, reviewArgs(id, { round: reviews, previous: lastPoints }), { ms: 20 * 60_000, file: join(OUT, `${id}-review-${reviews}.log`) });
        v = r.code === 0 ? verdict(r.out) : { pass: true, points: [], failed: true };
        if (!v.failed && !v.unparsed) break;
      }
      if (v.failed || v.unparsed) { log(`${id} ⚠ 审稿四次都没出结果，先放行，记进 followup.txt 等补审`); appendFileSync(FOLLOWUP, id + "\n"); }
      notes.push(...v.points.map((p) => `第 ${reviews} 轮：${p}`));
      lastPoints = v.points;
      if (!v.pass) {
        log(`${id} ↺ 审稿第 ${reviews} 轮要改 ${v.points.length} 条：${v.points[0]?.slice(0, 60) ?? ""}…`);
        retry = { review: true, reason: `主编审稿（第 ${reviews} 轮）认为还不够好`, tail: v.points.map((p, i) => `${i + 1}. ${p}`).join("\n") };
        continue;
      }
    }
    await commitPage(id, { started, minutes, timedOut: a.timedOut, reviews, notes, revisit });
    return;
  }
  record({ id, ok: false, why: retry?.reason });
  log(`${id} 放弃：${ATTEMPTS} 次都没过，目录留着等人看`);
}

async function commitPage(id, { minutes, timedOut, reviews, notes, revisit }) {
  if (revisit && !execFileSync("git", ["status", "--porcelain", "--", `pages/${pageDir(id)}`], { cwd: ROOT }).toString().trim()) {
    log(`${id} ✓ 回头查通过，没改动`);
    record({ id, ok: true, revisit, reviews, notes });
    return;
  }
  const p = await run("node", ["tools/perf.mjs", `batch${id}`], { ms: 10 * 60_000, env: { ONLY: id } });
  const fps = (p.out.match(/'(hero|drag[^']*)'\s*│\s*([\d.]+)/g) || []).map((m) => Number(m.split("│")[1])).filter(Number.isFinite);
  const dir = pageDir(id), t = text[id];
  const name = t.title_en.toLowerCase().replace(/ composition$/, "").replace(/[^a-z0-9]+/g, " ").trim();
  await withGit(() => {
    execFileSync("git", ["add", "--", `pages/${dir}`], { cwd: ROOT });
    execFileSync("git", ["commit", "-q", "-m", `${revisit ? "Revise" : "Add"} the interactive ${name} page`, "--", `pages/${dir}`], { cwd: ROOT });
  });
  const minFps = fps.length ? Math.min(...fps) : null;
  log(`${id} ✓ 提交（审稿 ${reviews} 轮${timedOut ? "，作者超时被停" : ""}，最低 ${minFps ?? "?"} 帧${minFps !== null && minFps < 40 ? " ⚠ 低于 40" : ""}）`);
  record({ id, ok: true, reviews, timedOut, minFps, notes });
  sinceDeploy++;
  maybeRelease();
}

// ---------- 分段，开跑 ----------
rmSync(LOCKS, { recursive: true, force: true });
mkdirSync(LOCKS, { recursive: true });
const segments = Array.from({ length: WORKERS }, (_, k) => ids.slice(Math.round((k * ids.length) / WORKERS), Math.round(((k + 1) * ids.length) / WORKERS)));
log(`开跑 ${MODEL}：${ids.length} 个编号，${WORKERS} 段 ${segments.map((s) => `${s[0]}–${s.at(-1)}`).join(" ")}，每 ${DEPLOY_EVERY} 页上线一次`);
await Promise.all(segments.map(async (seg) => { for (const id of seg) { if (stopped()) break; await page(id); } }));
await releasing;
if (sinceDeploy) await maybeRelease(true);
const all = readFileSync(join(OUT, "results.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
log(`结束${stopped() ? "（STOP）" : ""}：这一段还没提交的 ${ids.filter((id) => !committed(id)).join(" ") || "无"}；记录里放弃的 ${all.filter((r) => !r.ok).map((r) => r.id).join(" ") || "无"}`);
