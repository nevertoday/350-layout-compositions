// 每页都要守的几条规矩，写成一个小模块：import { loop, webgl, pixelRatio, reducedMotion } from "../../lib/stage.js";

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export const pixelRatio = (max = 2) => Math.min(window.devicePixelRatio || 1, max);

// 能不能开 WebGL。不能时页面要换成静态的样子（CSS、SVG 或 2D canvas），内容照样完整。
export function webgl() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// 只在 el 出现在屏幕上、标签页可见、没开「减少动态效果」时每帧调 frame(t, dt, { still })；t 是累计秒数，停的时候不走。
// 交互改了状态以后调返回的 draw() 重画一帧。
// 要不要直接画终点（跳过开场动画、缓动一步到位）只看 still：still 为 true 表示后面不会再有帧（开了减少动态效果）。
// dt 为 0 不是信号：每次开始转的第一帧、平时调 draw() 都是 0，拿它当「跳到终点」会把开场动画吞掉。
export function loop(el, frame) {
  let onScreen = false;
  let raf = 0;
  let last = 0;
  let t = 0;
  const running = () => onScreen && !document.hidden && !reducedMotion.matches;
  const tick = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    t += dt;
    frame(t, dt, { still: false });
    raf = running() ? requestAnimationFrame(tick) : 0;
  };
  const draw = () => frame(t, 0, { still: reducedMotion.matches });
  const update = () => {
    if (running() && !raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else if (!running() && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
    if (onScreen && reducedMotion.matches) draw();
  }).observe(el);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", () => {
    update();
    draw();
  });
  return { draw };
}
