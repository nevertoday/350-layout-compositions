// 102 形状对比 · 入口脚本
import { reducedMotion } from "../../lib/stage.js";
import { initHeroBench } from "./hero-bench.js";
import {
  initChaosLab,
  initEmotionLab,
  initHistoryLab,
  initPopoutLab,
  initPosterLightbox,
  initPracticeLab,
  initUiRefactorLab,
} from "./labs.js";

const bench = initHeroBench();

initPopoutLab();
initEmotionLab();
initHistoryLab();
initUiRefactorLab();
initChaosLab();
initPracticeLab();
initPosterLightbox();

// 01 节「去雕琢台试 ↑」快捷跳转：聚焦对应组对话与手柄并回到雕琢台
document.querySelectorAll("[data-jump-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.jumpMode;
    bench?.focusMode(mode);
    document.getElementById("bench-stage")?.scrollIntoView({ block: "center" });
    document.getElementById(`handle-${mode}`)?.focus({ preventScroll: true });
  });
});

// 轻量滚动渐显（开启减少动态效果时不隐藏任何元素）
const reveals = [...document.querySelectorAll(".reveal")];
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal-ready");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.06, rootMargin: "0px 0px -24px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}
