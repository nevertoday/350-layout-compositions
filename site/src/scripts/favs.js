// 收藏：一组编号，存在这个浏览器的 localStorage（xxd-layout-fav）。存不了（无痕、禁用存储）也照常能点，只是不留。
// 页面上所有 [data-fav="<编号>"] 的按钮都由这里同步：aria-pressed、读屏名字；点了就切换。
const KEY = "xxd-layout-fav";
const listeners = new Set();
let memory = null;

export function favs() {
  if (memory) return memory;
  try { memory = new Set(JSON.parse(localStorage.getItem(KEY) || "[]").filter((id) => /^\d{3}$/.test(id))); } catch { memory = new Set(); }
  return memory;
}

function save(id, on) {
  try { localStorage.setItem(KEY, JSON.stringify([...favs()].sort())); } catch {}
  sync();
  for (const fn of listeners) fn(id, on);
}

export function setFav(id, on) {
  const set = favs();
  if (on === set.has(id)) return;
  if (on) set.add(id); else set.delete(id);
  save(id, on);
}

// fn(id, on)：这个页面里点的才有 id；别的标签页改的不带
export function onFavChange(fn) { listeners.add(fn); }

export function sync(root = document) {
  const set = favs();
  for (const b of root.querySelectorAll("[data-fav]")) {
    const on = set.has(b.dataset.fav);
    b.setAttribute("aria-pressed", String(on));
    if (b.dataset.name) b.setAttribute("aria-label", `${on ? "取消收藏" : "收藏"} ${b.dataset.name}`);
    const label = b.querySelector("[data-fav-label]");
    if (label) label.textContent = on ? "已收藏" : "收藏";
  }
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fav]");
  if (!b) return;
  e.preventDefault();
  setFav(b.dataset.fav, !favs().has(b.dataset.fav));
});
// 别的标签页改了收藏，这里跟着变
addEventListener("storage", (e) => {
  if (e.key !== KEY) return;
  memory = null;
  sync();
  for (const fn of listeners) fn();
});
sync();
