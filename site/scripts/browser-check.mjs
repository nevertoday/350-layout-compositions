// 在真浏览器里看网站：无头 Chrome（临时配置目录，跑完删掉、Chrome 关掉），通过 DevTools 协议驱动。
//   node scripts/browser-check.mjs [网站地址] [截图目录]
// 先 npx astro preview --port 4420 --host 127.0.0.1（不加 --host 只听 IPv6），跑完自己关。做这几件事：
//   1. 截图：/、/001/、/196/、/about/、/ar/、选了分类和主题的图鉴、往下滚过的图鉴，和图鉴的三种视图（网格、海报墙、列表），1440 和 390 宽，亮色和暗色；
//      别的语言（构建里有的）：/en/、/en/001/、/ja/001/、/de/、/ar/001/，1440 和 390 宽，亮色
//   2. 外框：会员站的图标条（当前是「开源」）、栏目标签（当前的有 aria-current）、顶栏里没有站名标志和搜索框
//   3. 筛选（简体中文和英文各一遍）：在分类右边的搜索框打字、切分类、点主题、收藏一张、切到「收藏」、刷新、后退，每一步记下网址和看得见的卡片数，不对就退出码 1
//   4. 「显示」：换海报墙、按 = 加一列、刷新后还在（localStorage）；换列表时每行张数不能调、看得到一句定义；恢复默认
//   5. 详情页切第二版、打开查看器、→ 翻页；从图鉴点进详情时缩略图放大成大图，减少动效时不放大
//   6. 「更多」菜单：外观切到暗色；语言子菜单在详情页换到英文，落在同一个编号；在图鉴换语言带上分类；
//      浏览器是英文时简体中文首页出横幅，关掉就不再出；阿拉伯文从右往左（图标条在右、大图在右、面包屑的箭头翻过来、← 是下一张）
//   7. 互动版：/001/ 点「互动版」落到 /001/play/，页面画出来了（有画布）、没有报错和 console.error；图鉴里 001 的卡片有标记；
//      /en/001/ 的入口是英文的、注明是中文页面（hreflang=zh-CN），点进去是同一页
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://127.0.0.1:4420").replace(/\/$/, "");
await fetch(BASE + "/").then((r) => { if (!r.ok) throw new Error(`${BASE} 返回 ${r.status}`); }).catch((e) => {
  console.error(`连不上 ${BASE}：先 npm run preview（${e.message}）`);
  process.exit(1);
});
const SHOTS = process.argv[3] || join(process.cwd(), ".build/shots");
const CHROME = process.env.CHROME_EXE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(SHOTS, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "xxd-layout-chrome-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore", detached: true });
const cleanup = () => {
  try { process.kill(-chrome.pid, "SIGKILL"); } catch {}
  try { chrome.kill("SIGKILL"); } catch {}
  rmSync(profile, { recursive: true, force: true });
};
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));

// ---------- 最小的 CDP 客户端 ----------
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(t.webSocketDebuggerUrl);
  } catch { await sleep(200); }
}
if (!ws) throw new Error("Chrome 没起来");
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
const waiters = [];
const errors = []; // 页面里抛出的 JS 异常
const consoleErrors = []; // console.error，只在互动版那一段查（{ url, text }）
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
  } else if (msg.method) {
    if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
    for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg.params); }
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const js = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
await send("Runtime.enable");

async function setView(width, scheme) {
  const mobile = width < 600;
  await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
}
async function go(url) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await settle();
}
// 等看得见的图片都加载完
async function settle() {
  for (let i = 0; i < 60; i++) {
    const ok = await js(`[...document.images].filter((im) => { const r = im.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).every((im) => im.complete)`);
    if (ok) break;
    await sleep(100);
  }
  await sleep(250);
}
async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  const file = join(SHOTS, `${name}.png`);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

// ---------- 1. 截图 ----------
// [名字, 地址, 往下滚多少, 「显示」设置（不写就是缺省）]
const pages = [
  ["home", "/"], ["001", "/001/"], ["196", "/196/"], ["about", "/about/"], ["ar", "/ar/"],
  ["category", "/?c=01-composition-logic&s=classic-rules"], ["scrolled", "/?c=05-web-ui", 2400],
  ["view-grid", "/#atlas", 0, { view: "grid" }], ["view-wall", "/#atlas", 0, { view: "wall", group: "none" }], ["view-list", "/#atlas", 0, { view: "list", group: "theme" }],
];
const has = async (path) => (await fetch(BASE + path)).ok;
const localePages = [];
for (const path of ["/en/", "/en/001/", "/ja/001/", "/de/", "/ar/001/"]) if (await has(path)) localePages.push([path.replace(/^\/|\/$/g, "").replace("/", "-"), path]);
const files = [];
for (const width of [1440, 390]) {
  for (const scheme of ["light", "dark"]) {
    await setView(width, scheme);
    for (const [name, path, y, view] of [...pages, ...(scheme === "light" ? localePages : [])]) {
      await go(BASE + "/404.html");
      await js(view ? `localStorage.setItem("xxd-layout-view", ${JSON.stringify(JSON.stringify(view))})` : `localStorage.removeItem("xxd-layout-view")`);
      await go(BASE + path);
      if (y) { await js(`scrollTo(0, ${y})`); await settle(); }
      files.push(await shot(`${name}-${width}-${scheme}`));
    }
  }
}
console.log(`截图 ${files.length} 张：${SHOTS}`);

// ---------- 2. 筛选 ----------
await setView(1440, "light");
const visible = () => js(`document.querySelectorAll("#atlas-grid .atlas-card:not([hidden])").length`);
const url = () => js(`location.pathname + decodeURIComponent(location.search)`);
async function click(selector) {
  const box = await js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) throw new Error(`找不到 ${selector}`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
  await sleep(50);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
  await sleep(150);
}
const steps = [];
const failures = [];
async function step(label, expect) {
  const row = { label, url: await url(), cards: await visible() };
  steps.push(row);
  const problem = expect(row);
  if (problem) failures.push(`${label}：${problem}（网址 ${row.url}，卡片 ${row.cards}）`);
}

// 一种语言的图鉴（base 是它的首页）里走一遍筛选；term 是这种语言里能搜到「网格系统」那几张的词
async function filterFlow(base, term) {
  const at = (s) => `[${base}] ${s}`;
  await go(BASE + base);
  await js(`localStorage.clear()`);
  await go(BASE + base);
  await step(at("打开图鉴"), (r) => (r.cards === 350 && r.url === base ? "" : `应该是 ${base} 和 350 张`));
  await click("#atlas-q");
  await send("Input.insertText", { text: term });
  await sleep(200);
  await step(at(`搜索「${term}」`), (r) => (r.url === `${base}?q=${term}` && r.cards > 0 && r.cards < 350 ? "" : "网址应带 q，卡片变少"));
  const searched = steps.at(-1).cards;
  await click('#atlas-tabs [data-value="04-type-grid-cjk"]');
  await step(at("切到分类 04"), (r) => (r.url === `${base}?c=04-type-grid-cjk&q=${term}` && r.cards > 0 && r.cards <= searched ? "" : "网址应带 c 和 q"));
  await click('.atlas-subs__group[data-cat="04-type-grid-cjk"] [data-sub="grid-systems"]');
  await step(at("点主题 grid-systems"), (r) => (r.url === `${base}?c=04-type-grid-cjk&s=grid-systems&q=${term}` && r.cards > 0 ? "" : "网址应带 s"));
  const first = await js(`document.querySelector("#atlas-grid .atlas-card:not([hidden])").dataset.id`);
  await click(`#atlas-grid .atlas-card[data-id="${first}"] .atlas-fav`);
  const stored = await js(`localStorage.getItem("xxd-layout-fav")`);
  const pressed = await js(`document.querySelector('#atlas-grid .atlas-card[data-id="${first}"] .atlas-fav').getAttribute("aria-pressed")`);
  steps.push({ label: at(`收藏 ${first}`), url: await url(), cards: await visible(), stored, pressed });
  if (stored !== JSON.stringify([first]) || pressed !== "true") failures.push(at(`收藏没存上：localStorage=${stored}，aria-pressed=${pressed}`));
  await click('#atlas-tabs [data-value="fav"]');
  await step(at("切到「收藏」"), (r) => (r.url === `${base}?fav=1&q=${term}` && r.cards === 1 ? "" : "应该只剩收藏的 1 张"));
  const reloaded = once("Page.loadEventFired");
  await send("Page.reload");
  await reloaded;
  await settle();
  await step(at("刷新"), (r) => (r.url === `${base}?fav=1&q=${term}` && r.cards === 1 ? "" : "刷新后应该还是收藏的 1 张"));
  const restored = await js(`({ tab: document.querySelector('#atlas-tabs [aria-selected="true"]').dataset.value, q: document.getElementById("atlas-q").value, count: document.getElementById("atlas-count").textContent })`);
  steps.at(-1).restored = restored;
  if (restored.tab !== "fav" || restored.q !== term) failures.push(at(`刷新后界面没恢复：${JSON.stringify(restored)}`));
  await js(`history.back()`);
  await sleep(300);
  await step(at("后退"), (r) => (r.url === `${base}?c=04-type-grid-cjk&s=grid-systems&q=${term}` ? "" : "后退应回到主题"));
  await click("#atlas-q");
  await js(`document.getElementById("atlas-q").select()`);
  await send("Input.insertText", { text: "zzzz" });
  await sleep(200);
  const empty = await js(`!document.getElementById("atlas-empty").hidden && document.getElementById("atlas-empty-title").textContent`);
  await step(at("搜不到"), (r) => (r.cards === 0 && empty ? "" : "应该显示空状态"));
  steps.at(-1).empty = empty;
}
// ---------- 2. 外框 ----------
await go(BASE + "/196/");
const frame = await js(`({
  rail: !!document.querySelector(".frame-rail"),
  tab: document.querySelector(".frame-tab[aria-current]")?.getAttribute("href"),
  tabState: document.querySelector(".frame-tab[aria-current]")?.getAttribute("aria-current"),
  logo: !!document.querySelector(".frame-head .xxd-logo, .site-brand"),
  headerSearch: !!document.querySelector(".frame-head input"),
})`);
steps.push({ label: "外框", ...frame });
if (frame.rail) failures.push("不该再有会员站的图标条");
if (frame.tab !== "/" || frame.tabState !== "true") failures.push(`详情页的当前栏目应该是图鉴（aria-current=true）：${frame.tab} ${frame.tabState}`);
if (frame.logo || frame.headerSearch) failures.push("顶栏里不该有站名标志和搜索框");

// ---------- 3. 筛选 ----------
await filterFlow("/", "网格");
if (await has("/en/")) await filterFlow("/en/", "grid");

// ---------- 4. 「显示」 ----------
const gridState = () => js(`(() => { const g = document.getElementById("atlas-grid"); const first = g.querySelector(".atlas-card:not([hidden])"); return {
  view: g.dataset.view, group: g.dataset.group, cols: g.style.getPropertyValue("--cols"),
  columns: getComputedStyle(g).gridTemplateColumns.split(" ").length,
  stored: localStorage.getItem("xxd-layout-view"),
  colsDisabled: document.getElementById("view-cols").disabled,
  summaryShown: first.querySelector(".atlas-card__sum")?.getBoundingClientRect().height > 0,
  captionShown: getComputedStyle(first.querySelector(".atlas-card__cap")).opacity,
}; })()`);
async function press(key, code) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: key });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await sleep(150);
}
await go(BASE + "/");
await js(`localStorage.clear()`);
await go(BASE + "/");
const shown = await gridState();
await click("#atlas-view-btn");
await sleep(200);
const popOpen = await js(`document.getElementById("atlas-view").matches(":popover-open")`);
await click('#view-view [data-value="wall"]');
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await js(`document.activeElement.blur()`);
await press("=", "Equal");
const wall = await gridState();
const reloaded = once("Page.loadEventFired");
await send("Page.reload");
await reloaded;
await settle();
const wallAfter = await gridState();
await click("#atlas-view-btn");
await click('#view-view [data-value="list"]');
const list = await gridState();
await click("#view-reset");
const reset = await gridState();
steps.push({ label: "显示", popOpen, shown, wall, wallAfter, list, reset });
if (shown.view !== "grid" || shown.cols !== "4" || shown.columns !== 4 || shown.group !== "category") failures.push(`缺省应该是网格、每行 4 张、按分类：${JSON.stringify(shown)}`);
if (!popOpen) failures.push("点「显示」没打开弹出层");
if (wall.view !== "wall" || wall.cols !== "5" || wall.columns !== 5) failures.push(`换海报墙、按 = 以后应该是海报墙每行 5 张：${JSON.stringify(wall)}`);
if (wall.captionShown !== "0") failures.push(`海报墙平时不显示名称：${wall.captionShown}`);
if (wallAfter.view !== "wall" || wallAfter.cols !== "5" || JSON.parse(wallAfter.stored || "{}").view !== "wall") failures.push(`刷新后「显示」设置没留住：${JSON.stringify(wallAfter)}`);
if (list.view !== "list" || list.columns !== 1 || !list.colsDisabled || !list.summaryShown) failures.push(`列表应该一列、看得到一句定义、每行张数不能调：${JSON.stringify(list)}`);
if (reset.view !== "grid" || reset.cols !== "4" || reset.group !== "category") failures.push(`恢复默认没回到网格、4 张、按分类：${JSON.stringify(reset)}`);
await js(`localStorage.clear()`);

// 详情页：切第二版、打开查看器、→ 翻页
await go(BASE + "/196/");
await click('#poster-version [data-value="1"]');
const v2 = await js(`document.getElementById("poster").getAttribute("src")`);
await click("#poster-open");
await sleep(300);
const viewer = await js(`!!document.querySelector("dialog.xxd-viewer[open]") && document.querySelector("dialog.xxd-viewer img").getAttribute("src")`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(300);
const nav = once("Page.loadEventFired");
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await Promise.race([nav, sleep(3000)]);
const after = await js(`location.pathname`);
steps.push({ label: "详情 196", second: v2, viewer, arrowRight: after });
if (!/196-2\.webp/.test(v2 || "")) failures.push(`第二版没切过去：${v2}`);
if (!/196-2\.webp/.test(viewer || "")) failures.push(`查看器没打开第二版：${viewer}`);
if (after !== "/197/") failures.push(`→ 没翻到 197：${after}`);

// 跨页过渡：从图鉴点进 001，新页面上要有 poster 这一组的旧图和新图（缩略图放大成大图）；减少动效时没有过渡
await send("Page.addScriptToEvaluateOnNewDocument", { source: `addEventListener("pagereveal", (e) => { window.__vt = e.viewTransition ? e.viewTransition.ready.then(() => document.getAnimations().map((a) => a.effect && a.effect.pseudoElement).filter(Boolean), () => []) : null; });` });
async function morph(reduce) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }] });
  await go(BASE + "/");
  const loaded = once("Page.loadEventFired");
  await click('#atlas-grid .atlas-card[data-id="001"] .atlas-card__link');
  await loaded;
  return js(`Promise.resolve(window.__vt).then((x) => x && [...new Set(x)].filter((p) => p.includes("poster")))`);
}
const vt = await morph(false);
const vtReduced = await morph(true);
steps.push({ label: "跨页过渡", normal: vt, reducedMotion: vtReduced });
if (!vt || !vt.includes("::view-transition-old(poster)") || !vt.includes("::view-transition-new(poster)")) failures.push(`缩略图没有放大成大图：${JSON.stringify(vt)}`);
if (vtReduced) failures.push(`减少动效时还有过渡：${JSON.stringify(vtReduced)}`);

// ---------- 6. 「更多」菜单：外观、语言 ----------
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
await go(BASE + "/001/");
await js(`localStorage.clear()`);
await go(BASE + "/001/");
await click("#frame-more-btn");
await click('#frame-theme [data-value="dark"]');
await sleep(200);
const dark = await js(`({ theme: window.XxdTheme.read().theme, applied: document.documentElement.dataset.theme, checked: document.querySelector('#frame-theme [aria-checked="true"]')?.dataset.value })`);
await go(BASE + "/001/");
dark.afterReload = await js(`document.documentElement.dataset.theme`);
steps.push({ label: "外观切到暗色", ...dark });
if (dark.theme !== "dark" || dark.applied !== "dark" || dark.checked !== "dark" || dark.afterReload !== "dark") failures.push(`「更多」里切到暗色没生效或没存下：${JSON.stringify(dark)}`);
await js(`localStorage.clear()`);

async function pickLanguage(code) {
  await click("#frame-more-btn");
  await sleep(200);
  await click('#frame-more [data-submenu="frame-langs"]');
  await sleep(200);
  const open = await js(`document.getElementById("frame-langs").matches(":popover-open")`);
  const nav = once("Page.loadEventFired");
  await click(`#frame-langs [data-lang="${code}"]`);
  await Promise.race([nav, sleep(3000)]);
  await settle();
  return open;
}
if (await has("/en/")) {
  await setView(1440, "light");
  // 详情页换语言：落在同一个编号，记下选的语言
  await go(BASE + "/196/");
  await js(`localStorage.clear()`);
  const menuOpen = await pickLanguage("en");
  const landed = await js(`({ path: location.pathname, lang: document.documentElement.lang, chosen: localStorage.getItem("xxd-layout-lang") })`);
  steps.push({ label: "详情页换到英文", menuOpen, ...landed });
  if (!menuOpen) failures.push("点语言按钮没打开菜单");
  if (landed.path !== "/en/196/" || landed.lang !== "en") failures.push(`详情页换到英文应该落在 /en/196/（lang=en）：${landed.path}（lang=${landed.lang}）`);
  if (landed.chosen !== "en") failures.push(`换语言没记下来：${landed.chosen}`);
  // 图鉴换语言：带上分类和主题，不带搜索词（那是另一种语言的字）
  await go(BASE + "/?c=05-web-ui&q=网格");
  await pickLanguage("en");
  const carried = await js(`location.pathname + location.search`);
  steps.push({ label: "图鉴换到英文", carried });
  if (carried !== "/en/?c=05-web-ui") failures.push(`图鉴换语言应该带上分类、不带搜索词：${carried}`);

  // 浏览器首选英文：简体中文首页出英文横幅，指向 /en/；关掉以后刷新不再出。浏览器首选中文：不出
  const ua = await js(`navigator.userAgent`);
  const banner = () => js(`(() => { const b = document.getElementById("lang-banner"); return b && !b.hidden ? { lang: b.lang, text: document.getElementById("lang-banner-text").textContent, href: document.getElementById("lang-banner-go").getAttribute("href") } : null; })()`);
  await send("Emulation.setUserAgentOverride", { userAgent: ua, acceptLanguage: "en-US,en,zh-CN" });
  await go(BASE + "/");
  await js(`localStorage.clear()`);
  await go(BASE + "/");
  const shown = await banner();
  if (shown) { await click("#lang-banner-close"); await sleep(400); }
  await go(BASE + "/");
  const afterClose = await banner();
  await send("Emulation.setUserAgentOverride", { userAgent: ua, acceptLanguage: "zh-CN,zh,en" });
  await js(`localStorage.clear()`);
  await go(BASE + "/");
  const zhBrowser = await banner();
  steps.push({ label: "语言横幅", shown, afterClose, zhBrowser });
  if (!shown || shown.lang !== "en" || shown.href !== "/en/") failures.push(`浏览器是英文时首页应该出英文横幅：${JSON.stringify(shown)}`);
  if (afterClose) failures.push("关掉横幅后刷新又出来了");
  if (zhBrowser) failures.push(`浏览器是中文时不该出横幅：${JSON.stringify(zhBrowser)}`);
}
if (await has("/ar/196/")) {
  // 阿拉伯文从右往左：大图在右、面包屑的箭头翻过来、卡片的星标在左上；← 是下一张
  await setView(1440, "light");
  await go(BASE + "/ar/196/");
  const rtl = await js(`(() => {
    const r = (el) => el.getBoundingClientRect();
    const poster = r(document.getElementById("poster")), info = r(document.querySelector(".detail-info"));
    const card = document.querySelector(".detail-related .atlas-card"), star = r(card.querySelector(".atlas-fav"));
    return {
      dir: document.documentElement.dir,
      direction: getComputedStyle(document.body).direction,
      posterOnRight: poster.left > info.left,
      chevron: getComputedStyle(document.querySelector(".xxd-breadcrumbs > li + li"), "::before").transform,
      starOnLeft: star.left - r(card).left < r(card).right - star.right,
    };
  })()`);
  const nav = once("Page.loadEventFired");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await Promise.race([nav, sleep(3000)]);
  rtl.arrowLeft = await js(`location.pathname`);
  steps.push({ label: "阿拉伯文", ...rtl });
  if (rtl.dir !== "rtl" || rtl.direction !== "rtl") failures.push(`阿拉伯文应该从右往左：dir=${rtl.dir}，direction=${rtl.direction}`);
  if (!rtl.posterOnRight) failures.push("阿拉伯文的大图应该在右边");
  if (!/^matrix\(-1,/.test(rtl.chevron)) failures.push(`阿拉伯文面包屑的箭头没有翻过来：${rtl.chevron}`);
  if (!rtl.starOnLeft) failures.push("阿拉伯文卡片的星标应该在左上");
  if (rtl.arrowLeft !== "/ar/197/") failures.push(`阿拉伯文里 ← 应该翻到下一张 /ar/197/：${rtl.arrowLeft}`);
}

// ---------- 7. 互动版 ----------
await setView(1440, "light");
await go(BASE + "/");
const cardMark = await js(`document.querySelector('#atlas-grid .atlas-card[data-id="001"] .atlas-card__play')?.getAttribute("aria-label") ?? null`);
const unmarked = await js(`document.querySelector('#atlas-grid .atlas-card[data-id="004"] .atlas-card__play') === null`);
steps.push({ label: "图鉴卡片的互动版标记", cardMark, unmarked });
if (!cardMark) failures.push("图鉴里 001 的卡片没有互动版标记");
if (!unmarked) failures.push("没有互动版的 004 卡片却有标记");
// 点入口，落到互动版：有画布、没有报错
async function playFrom(path) {
  await go(BASE + path);
  const entry = await js(`(() => { const a = document.getElementById("play"); return a && { href: a.getAttribute("href"), hreflang: a.getAttribute("hreflang"), text: a.textContent.replace(/\\s+/g, " ").trim() }; })()`);
  if (!entry) return { entry };
  const before = { errors: errors.length, console: consoleErrors.length };
  const loaded = once("Page.loadEventFired");
  await click("#play");
  await Promise.race([loaded, sleep(5000)]);
  let canvas = 0;
  for (let i = 0; i < 30 && !canvas; i++) { canvas = await js(`[...document.querySelectorAll("canvas")].filter((c) => c.width > 0 && c.height > 0).length`); if (!canvas) await sleep(100); }
  await sleep(500);
  return { entry, landed: await js(`location.pathname`), title: await js(`document.title`), canvas, errors: errors.slice(before.errors), console: consoleErrors.slice(before.console) };
}
const zhPlay = await playFrom("/001/");
files.push(await shot("001-play-1440-light"));
steps.push({ label: "互动版（简体中文）", ...zhPlay });
if (!zhPlay.entry) failures.push("/001/ 没有互动版入口");
else {
  if (zhPlay.entry.href !== "/001/play/" || zhPlay.entry.hreflang !== null || !zhPlay.entry.text.startsWith("互动版")) failures.push(`/001/ 的互动版入口不对：${JSON.stringify(zhPlay.entry)}`);
  if (zhPlay.landed !== "/001/play/") failures.push(`点「互动版」应该落到 /001/play/：${zhPlay.landed}`);
  if (!zhPlay.canvas) failures.push("/001/play/ 没有画出画布");
  if (zhPlay.console.length) failures.push(`/001/play/ 有 console.error：${zhPlay.console.join(" | ")}`);
}
await go(BASE + "/196/");
const noEntry = await js(`document.getElementById("play") === null`);
if (!noEntry) failures.push("没有互动版的 /196/ 却有入口");
if (await has("/en/001/")) {
  const enPlay = await playFrom("/en/001/");
  steps.push({ label: "互动版（英文）", ...enPlay });
  if (!enPlay.entry) failures.push("/en/001/ 没有互动版入口");
  else {
    if (enPlay.entry.href !== "/001/play/" || enPlay.entry.hreflang !== "zh-CN") failures.push(`/en/001/ 的入口应该指 /001/play/、hreflang=zh-CN：${JSON.stringify(enPlay.entry)}`);
    if (/\p{Script=Han}/u.test(enPlay.entry.text) || !/chinese/i.test(enPlay.entry.text)) failures.push(`/en/001/ 的入口应该是英文、注明中文：${enPlay.entry.text}`);
    if (enPlay.landed !== "/001/play/" || !enPlay.canvas) failures.push(`/en/001/ 点进去应该是画出来的 /001/play/：${enPlay.landed}，画布 ${enPlay.canvas}`);
  }
  await go(BASE + "/en/001/");
  await js(`document.getElementById("play").scrollIntoView({ block: "center" })`);
  files.push(await shot("en-001-play-entry-1440-light"));
}
// 手机上入口的样子
await setView(390, "light");
await go(BASE + "/001/");
await js(`document.getElementById("play").scrollIntoView({ block: "center" })`);
await settle();
files.push(await shot("001-play-entry-390-light"));

for (const s of steps) console.log(JSON.stringify(s));
for (const e of errors) failures.push(`页面报错：${String(e).split("\n")[0]}`);
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  process.exit(1);
}
console.log("✓ 浏览器检查通过");
process.exit(0);
