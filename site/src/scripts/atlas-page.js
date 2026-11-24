// 图鉴页：筛选状态只有一个对象 state，网址（<这种语言的首页>?c=&s=&q=&fav=1）和网格大小（localStorage）都从它来，
// 改了就调一次 render()。卡片本身都在 HTML 里，这里只藏、只显示。
import { favs, onFavChange, setFav, sync as syncFavs } from "./favs.js";
import { base, t } from "./ui.js";

const X = window.Xxd;
const data = JSON.parse(document.getElementById("atlas-data").textContent);
const SUBS = new Map(Object.entries(data.cats)); // 分类 → 它的二级主题
const SIZES = ["s", "m", "l"];
const SIZE_KEY = "xxd-layout-grid";

const $ = (id) => document.getElementById(id);
const grid = $("atlas-grid");
const tabs = $("atlas-tabs");
const input = $("site-q");
const cards = [...grid.querySelectorAll(".atlas-card")].map((el) => {
  const sub = el.closest(".atlas-sub");
  const cat = el.closest(".atlas-cat");
  return { el, id: el.dataset.id, sub: sub.dataset.sub, cat: cat.dataset.cat, hay: data.items[el.dataset.id][1] };
});
const subEls = [...grid.querySelectorAll(".atlas-sub")];
const catEls = [...grid.querySelectorAll(".atlas-cat")];

// ---------- 状态 ⇄ 网址 ----------
// scope：all（全部）、fav（收藏）或一个分类的 slug；sub 只在选了分类时有意义
function fromUrl(search) {
  const p = new URLSearchParams(search);
  const q = (p.get("q") || "").trim();
  if (p.get("fav") === "1") return { scope: "fav", sub: "", q };
  const c = p.get("c");
  if (c && SUBS.has(c)) return { scope: c, sub: SUBS.get(c).includes(p.get("s")) ? p.get("s") : "", q };
  return { scope: "all", sub: "", q };
}
function toUrl(s) {
  const p = new URLSearchParams();
  if (s.scope === "fav") p.set("fav", "1");
  else if (s.scope !== "all") {
    p.set("c", s.scope);
    if (s.sub) p.set("s", s.sub);
  }
  if (s.q) p.set("q", s.q);
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
function readSize() {
  try { const v = localStorage.getItem(SIZE_KEY); return SIZES.includes(v) ? v : "m"; } catch { return "m"; }
}

let state = { ...fromUrl(location.search), size: readSize() };

// 筛不出东西时说什么、给哪个下一步（下一步就是另一个 state）
function emptyState(s, favCount) {
  const q = { q: s.q };
  if (s.scope === "fav" && !favCount) {
    return { title: t("empty.noFavs.title"), text: t("empty.noFavs.text"), action: { label: t("empty.noFavs.action"), next: { scope: "all", sub: "", q: "" } } };
  }
  if (s.scope === "fav") return { title: t("empty.inFavs.title", q), text: t("empty.inFavs.text"), action: { label: t("empty.clear"), next: { q: "" } } };
  if (s.scope !== "all") return { title: t("empty.inCat.title", q), text: t("empty.inCat.text"), action: { label: t("empty.inCat.action"), next: { scope: "all", sub: "" } } };
  return { title: t("empty.all.title", q), text: t("empty.all.text"), action: { label: t("empty.clear"), next: { q: "" } } };
}

// ---------- 渲染：state → 页面 ----------
function render() {
  const s = state;
  const fav = favs();
  const terms = s.q.toLowerCase().split(/\s+/).filter(Boolean);
  const perSub = new Map();
  let shown = 0;
  for (const c of cards) {
    const ok = (s.scope === "all" || s.scope === "fav" || c.cat === s.scope)
      && (!s.sub || c.sub === s.sub)
      && (s.scope !== "fav" || fav.has(c.id))
      && terms.every((t) => c.hay.includes(t));
    c.el.hidden = !ok;
    if (ok) { shown++; perSub.set(c.sub, (perSub.get(c.sub) || 0) + 1); }
  }
  for (const el of subEls) el.hidden = !perSub.get(el.dataset.sub);
  for (const el of catEls) el.hidden = !el.querySelector(":scope > .atlas-sub:not([hidden])");

  // 工具条
  for (const t of tabs.querySelectorAll('[role="tab"]')) {
    const on = t.dataset.value === s.scope;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  }
  X?.moveInk?.(tabs);
  for (const g of document.querySelectorAll(".atlas-subs__group")) {
    g.hidden = g.dataset.cat !== s.scope;
    if (!g.hidden) for (const b of g.querySelectorAll("[data-sub]")) b.setAttribute("aria-pressed", String(b.dataset.sub === s.sub));
  }
  $("atlas-favbar").hidden = !(s.scope === "fav" && fav.size);
  $("atlas-subs").hidden = !(SUBS.has(s.scope) || (s.scope === "fav" && fav.size));
  const favCount = $("atlas-fav-count");
  favCount.hidden = !fav.size;
  favCount.textContent = String(fav.size);
  $("atlas-count").textContent = t(s.q ? "found" : "count", { n: shown });
  for (const b of $("atlas-size").querySelectorAll('[role="radio"]')) {
    const on = b.dataset.value === s.size;
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on ? 0 : -1;
  }
  document.documentElement.dataset.grid = s.size;

  const empty = shown ? null : emptyState(s, fav.size);
  $("atlas-empty").hidden = !empty;
  if (empty) {
    $("atlas-empty-title").textContent = empty.title;
    $("atlas-empty-text").textContent = empty.text;
    $("atlas-empty-action").textContent = empty.action.label;
  }
  if (input.value.trim() !== s.q) input.value = s.q;
}

// 改状态：网址跟着变。打字用 replace（不刷一串历史），切分类、主题用 push（后退能回去）
function set(patch, { history = "push" } = {}) {
  const prev = state;
  state = { ...state, ...patch };
  if (patch.scope && patch.scope !== prev.scope && !("sub" in patch)) state.sub = "";
  if (patch.size !== undefined) { try { localStorage.setItem(SIZE_KEY, state.size); } catch {} }
  const url = toUrl(state);
  if (url !== location.pathname + location.search) {
    if (history === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }
  render();
  if (patch.scope !== undefined || patch.sub !== undefined) keepToolbarInView();
}

// 切了分类、主题后，如果已经往下滚过，回到网格开头（工具条贴在顶上，正好在它下面）
function keepToolbarInView() {
  const bar = $("atlas-bar");
  const top = grid.getBoundingClientRect().top + scrollY - bar.offsetHeight - document.querySelector(".site-top").offsetHeight;
  if (scrollY > top) scrollTo({ top, behavior: "instant" });
}

// ---------- 事件 ----------
tabs.addEventListener("xxd:change", (e) => set({ scope: e.detail.value }));
$("atlas-subs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-sub]");
  if (b) set({ sub: b.dataset.sub });
});
$("atlas-size").addEventListener("xxd:change", (e) => set({ size: e.detail.value }, { history: "replace" }));
$("atlas-empty-action").addEventListener("click", () => set(emptyState(state, favs().size).action.next));
$("site-search").addEventListener("submit", (e) => e.preventDefault());
X?.bindSearch(input, { onQuery: (q) => { if (q !== state.q) set({ q }, { history: "replace" }); } });
addEventListener("popstate", () => { state = { ...fromUrl(location.search), size: state.size }; render(); });

$("atlas-fav-copy").addEventListener("click", async (e) => {
  const ids = [...favs()].sort();
  const text = ids.map((id) => `${id} ${data.items[id][0]}`).join("\n");
  const ok = await X.copyText(text);
  X.toast(ok ? t("favs.copied", { n: ids.length }) : t("copyFailed"), { tone: ok ? "success" : "danger" });
  e.currentTarget?.blur?.();
});
onFavChange((id, on) => {
  render();
  // 在「收藏」里取消一张，它会马上消失：给一个撤销
  if (state.scope === "fav" && !on && id) X?.toast(t("favs.removed", { name: data.items[id][0] }), { action: { label: t("undo"), onClick: () => setFav(id, true) } });
});

// ---------- 跨页过渡：点进详情时，这张缩略图放大成详情页的大图；从详情页回来时缩回去 ----------
const DETAIL = new RegExp(`^${base}(\\d{3})/$`);
const thumbOf = (url) => {
  const m = url && new URL(url, location.href).pathname.match(DETAIL);
  return m ? grid.querySelector(`.atlas-card[data-id="${m[1]}"]:not([hidden]) img`) : null;
};
const nameFor = (img, vt) => {
  if (!img || !vt) return;
  img.style.viewTransitionName = "poster";
  vt.finished.finally(() => { img.style.viewTransitionName = ""; });
};
addEventListener("pageswap", (e) => nameFor(thumbOf(e.activation?.entry?.url), e.viewTransition));
addEventListener("pagereveal", (e) => nameFor(thumbOf(window.navigation?.activation?.from?.url), e.viewTransition));

render();
syncFavs();
