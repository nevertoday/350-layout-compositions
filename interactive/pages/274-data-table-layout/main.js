// No. 274 数据表格布局 —— 页面入口（main.js）
import { reducedMotion } from "../../lib/stage.js";
import { initHero } from "./hero.js";
import { initLabs } from "./labs.js";

function initReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  document.documentElement.classList.add("js-ready");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.01, rootMargin: "120px 0px" }
  );
  nodes.forEach((n) => io.observe(n));
}

initHero();
initLabs();
initReveal();
