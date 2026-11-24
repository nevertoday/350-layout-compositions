// 海报放大看：同一张图（只内联一次），在对话框里按倍数放大，滚动或拖动查看
export function initPoster() {
  const poster = document.getElementById("poster");
  const dialog = document.getElementById("zoom");
  const view = document.getElementById("zoom-view");
  const img = document.getElementById("zoom-img");
  const level = document.getElementById("zoom-level");
  let k = 1;

  const set = (next, cx = 0.5, cy = 0.5) => {
    const fx = (view.scrollLeft + view.clientWidth * cx) / view.scrollWidth;
    const fy = (view.scrollTop + view.clientHeight * cy) / view.scrollHeight;
    k = Math.min(4, Math.max(1, next));
    img.style.setProperty("--k", k);
    level.textContent = `${Math.round(k * 100)}%`;
    view.scrollLeft = fx * view.scrollWidth - view.clientWidth * cx;
    view.scrollTop = fy * view.scrollHeight - view.clientHeight * cy;
  };

  const open = () => {
    img.src ||= poster.src;
    dialog.showModal();
    set(1);
  };
  document.getElementById("poster-open").addEventListener("click", open);
  poster.addEventListener("click", open);
  document.getElementById("zoom-in").addEventListener("click", () => set(k * 1.5));
  document.getElementById("zoom-out").addEventListener("click", () => set(k / 1.5));
  document.getElementById("zoom-close").addEventListener("click", () => dialog.close());
  img.addEventListener("click", (e) => {
    const r = view.getBoundingClientRect();
    set(k >= 4 ? 1 : k * 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  let pan = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || k === 1) return;
    pan = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, moved: false };
  });
  view.addEventListener("pointermove", (e) => {
    if (!pan) return;
    pan.moved ||= Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 4;
    view.scrollLeft = pan.l - (e.clientX - pan.x);
    view.scrollTop = pan.t - (e.clientY - pan.y);
  });
  view.addEventListener("click", (e) => { if (pan?.moved) e.stopPropagation(); pan = null; }, true);
  view.addEventListener("pointerup", () => setTimeout(() => (pan = null)));
}
