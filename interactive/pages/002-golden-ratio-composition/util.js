import { reducedMotion } from "../../lib/stage.js";

export const PHI = (1 + Math.sqrt(5)) / 2;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 机械感的缓动：两头慢、中间匀，像绘图仪的笔
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function svg(tag, attrs = {}, parent) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  parent?.append(node);
  return node;
}

// 一次性的过渡；减少动态效果时直接跳到终点。返回取消函数。
export function tween(ms, fn) {
  if (reducedMotion.matches || ms <= 0) {
    fn(1, 1);
    return () => {};
  }
  let raf = 0;
  let start = 0;
  const step = (now) => {
    start ||= now;
    const p = Math.min(1, (now - start) / ms);
    fn(ease(p), p);
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// 黄金矩形（宽 φ、高 1）一层层切正方形：左、上、右、下轮流，每步记下切出的正方形和剩下的矩形
export function goldenCuts(n) {
  let x = 0, y = 0, w = PHI, h = 1;
  const steps = [];
  for (let i = 0; i < n; i++) {
    let sq;
    if (i % 4 === 0) { sq = { x, y, s: h }; x += h; w -= h; }
    else if (i % 4 === 1) { sq = { x, y, s: w }; y += w; h -= w; }
    else if (i % 4 === 2) { sq = { x: x + w - h, y, s: h }; w -= h; }
    else { sq = { x, y: y + h - w, s: w }; h -= w; }
    steps.push({ ...sq, rest: { x, y, w, h } });
  }
  return steps;
}

// 屏幕坐标 → SVG 的 viewBox 坐标
export function toSvg(el, e) {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(el.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}

// 在 SVG 上按住拖动；move 收到 viewBox 坐标
export function drag(el, move) {
  let active = false;
  el.addEventListener("pointerdown", (e) => {
    active = true;
    el.setPointerCapture(e.pointerId);
    move(toSvg(el, e), e);
  });
  el.addEventListener("pointermove", (e) => active && move(toSvg(el, e), e));
  const stop = () => (active = false);
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointercancel", stop);
}

export const setRange = (input, v) => {
  input.value = v;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
