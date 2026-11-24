// 起无头 Chrome 的唯一入口（check.mjs、tools/perf.mjs 都用它）：
//   - 临时配置目录叫 xxd-<工具名>-<本进程 PID>-XXXXXX，一看就知道是谁起的；
//   - Chrome 自成一个进程组，起来就打印它的 PID；
//   - 本进程怎么结束都连进程组一起杀掉：跑完、Ctrl-C、SIGTERM、SIGHUP、未捕获的异常和 Promise 拒绝。
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const CHROME = process.env.CHROME_EXE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = new Set();
process.on("exit", () => procs.forEach((k) => k()));
for (const [s, n] of [["SIGINT", 2], ["SIGTERM", 15], ["SIGHUP", 1]]) process.on(s, () => process.exit(128 + n));
// 不接住的话 Node 直接退出，不触发 "exit"，Chrome 就留下来了
for (const ev of ["uncaughtException", "unhandledRejection"]) process.on(ev, (e) => { console.error(e); process.exit(1); });

export async function launch(tool, extra = []) {
  const profile = mkdtempSync(join(tmpdir(), `xxd-${tool}-${process.pid}-`));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", ...extra, "about:blank"], { stdio: "ignore", detached: true });
  console.error(`[xxd-${tool}] Chrome PID ${proc.pid}（进程组 ${proc.pid}，配置 ${profile}）`);
  const kill = () => {
    if (!procs.delete(kill)) return;
    try { process.kill(-proc.pid, "SIGKILL"); } catch {}
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {}
  };
  procs.add(kill);
  let port;
  for (let i = 0; i < 100 && !port; i++) { try { port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch { await sleep(100); } }
  if (!port) throw new Error("Chrome 没起来");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
  let seq = 0; const pending = new Map(); const listeners = new Map();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
    else if (msg.method) for (const fn of listeners.get(msg.method) || []) fn(msg.params);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) || []), fn]);
  const once = (method) => new Promise((resolve) => {
    const fn = (params) => { listeners.set(method, listeners.get(method).filter((f) => f !== fn)); resolve(params); };
    on(method, fn);
  });
  const js = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  // 出错和 console.error 记在 errors 里；open() 按 { w, h, dpr, mobile } 设好屏幕再打开（check.mjs 有自己的 open）
  const errors = [];
  for (const d of ["Page", "Runtime"]) await send(`${d}.enable`);
  on("Runtime.exceptionThrown", ({ exceptionDetails: e }) => errors.push((e.exception?.description || e.text || "").split("\n")[0]));
  on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error") errors.push(args.map((a) => a.value ?? a.description).join(" ")); });
  async function open(url, v) {
    await send("Emulation.setDeviceMetricsOverride", { width: v.w, height: v.h, deviceScaleFactor: v.dpr, mobile: v.mobile, screenOrientation: v.w > v.h ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 } });
    await send("Emulation.setTouchEmulationEnabled", v.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await Promise.race([loaded, sleep(20000)]);
    await js(`document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))`);
  }
  return { send, on, once, js, open, errors, kill, pid: proc.pid };
}
