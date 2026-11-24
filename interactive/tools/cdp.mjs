// Throwaway CDP helper: launch own headless Chrome (own profile, own process group), kill it on exit.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];
const killAll = () => procs.forEach((k) => k());
process.on("exit", killAll);
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => process.exit(130));
export async function launch(extra = []) {
  const profile = mkdtempSync(join(tmpdir(), "xxd-perf-chrome-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", ...extra, "about:blank"], { stdio: "ignore", detached: true });
  const kill = () => { try { process.kill(-proc.pid, "SIGKILL"); } catch {} try { rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch {} };
  procs.push(kill);
  let port;
  for (let i = 0; i < 100 && !port; i++) { try { port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch { await sleep(100); } }
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
  const js = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const errors = [];
  for (const d of ["Page", "Runtime"]) await send(`${d}.enable`);
  on("Runtime.exceptionThrown", ({ exceptionDetails: e }) => errors.push((e.exception?.description || e.text || "").split("\n")[0]));
  on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error") errors.push(args.map((a) => a.value ?? a.description).join(" ")); });
  async function open(url, v) {
    await send("Emulation.setDeviceMetricsOverride", { width: v.w, height: v.h, deviceScaleFactor: v.dpr, mobile: v.mobile, screenOrientation: v.w > v.h ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 } });
    await send("Emulation.setTouchEmulationEnabled", v.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    let loaded; const p = new Promise((r) => (loaded = r)); on("Page.loadEventFired", () => loaded());
    await send("Page.navigate", { url });
    await Promise.race([p, sleep(20000)]);
    await js(`document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))`);
  }
  return { send, js, open, kill, errors, pid: proc.pid };
}
