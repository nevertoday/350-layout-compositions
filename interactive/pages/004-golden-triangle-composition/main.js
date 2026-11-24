import { hero } from "./hero.js";
import { buildSteps, ratioLab, similar } from "./sections.js";
import { quiz, thumbs } from "./figures.js";

const $ = (id) => document.getElementById(id);

hero();
buildSteps();
similar();
ratioLab();
thumbs();
quiz();

// ---------- 08 原海报：点开放大、拖动、Esc 关 ----------
{
  const dlg = $("viewer"), img = $("viewer-img"), scroll = $("viewer-scroll"), poster = $("poster");
  const levels = [1, 1.5, 2, 3];
  let z = 0;
  const apply = () => {
    const base = Math.min(scroll.clientWidth, (scroll.clientHeight * 1086) / 1448);
    img.style.width = `${Math.round(base * levels[z])}px`;
    $("zoom-val").textContent = `${levels[z] * 100}%`;
    $("zoom-out").disabled = z === 0;
    $("zoom-in").disabled = z === levels.length - 1;
  };
  $("poster-open").addEventListener("click", () => {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    z = 0;
    dlg.showModal();
    document.documentElement.classList.add("noscroll");
    apply();
  });
  dlg.addEventListener("close", () => document.documentElement.classList.remove("noscroll"));
  $("zoom-in").addEventListener("click", () => { z = Math.min(levels.length - 1, z + 1); apply(); });
  $("zoom-out").addEventListener("click", () => { z = Math.max(0, z - 1); apply(); });
  $("viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  let pan = null;
  scroll.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    e.preventDefault();
    pan = { x: e.clientX, y: e.clientY, l: scroll.scrollLeft, t: scroll.scrollTop };
    scroll.setPointerCapture(e.pointerId);
  });
  scroll.addEventListener("pointermove", (e) => {
    if (!pan) return;
    scroll.scrollLeft = pan.l - (e.clientX - pan.x);
    scroll.scrollTop = pan.t - (e.clientY - pan.y);
  });
  scroll.addEventListener("pointerup", () => (pan = null));
  addEventListener("resize", () => dlg.open && apply());
}
