// 这种语言的界面文字和首页地址：Site.astro 写在 #site-ui 里（ui/<code>.json 里键以 js. 开头的那些，这里去掉 js.）。
const ui = JSON.parse(document.getElementById("site-ui").textContent);

export const base = ui.base;
export const t = (key, vars = {}) => (ui.t[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
