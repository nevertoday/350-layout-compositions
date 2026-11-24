// 图鉴的「显示」设置：一个对象 { view, cols, group }，存在 localStorage（xxd-layout-view）。
// 这个文件原样内联在图鉴网格的第一个子元素里（index.astro），在网格画出来之前把设置写到网格上，不闪；
// 同时挂在 window.XxdLayoutView 上给 atlas-page.js 用。读进来的东西只在 parse() 这里校验和夹到范围里，别处都信它。
//   view   grid（海报 + 名称）| wall（只有海报，悬停看名称）| list（小图 + 名称、英文名、一句定义、分类）
//   cols   每行几张：宽屏 2–6（缺省 4），窄屏 1–3（缺省 2）；列表视图不用
//   group  category（按分类）| theme（按主题）| none（不分组）
window.XxdLayoutView = (() => {
  const KEY = "xxd-layout-view";
  const VIEWS = ["grid", "wall", "list"];
  const GROUPS = ["category", "theme", "none"];
  const narrow = matchMedia("(max-width: 639px)");
  const range = () => (narrow.matches ? { min: 1, max: 3, cols: 2 } : { min: 2, max: 6, cols: 4 });
  const defaults = () => ({ view: "grid", cols: range().cols, group: "category" });
  function parse(raw) {
    const d = defaults();
    const r = range();
    const v = raw && typeof raw === "object" ? raw : {};
    const n = Math.round(Number(v.cols));
    return {
      view: VIEWS.includes(v.view) ? v.view : d.view,
      cols: Number.isFinite(n) ? Math.min(r.max, Math.max(r.min, n)) : d.cols,
      group: GROUPS.includes(v.group) ? v.group : d.group,
    };
  }
  function read() {
    try { return parse(JSON.parse(localStorage.getItem(KEY))); } catch { return parse(null); }
  }
  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  }
  function apply(root, p) {
    root.dataset.view = p.view;
    root.dataset.group = p.group;
    root.style.setProperty("--cols", String(p.cols));
  }
  return { range, defaults, parse, read, save, apply, narrow };
})();
window.XxdLayoutView.apply(document.currentScript.parentElement, window.XxdLayoutView.read());
