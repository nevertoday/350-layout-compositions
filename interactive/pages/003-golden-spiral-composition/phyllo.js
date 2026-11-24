// 第 04 节：向日葵花盘。种子 n 放在 (c·√n, n·转角) 上（Vogel 模型）。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

const GOLDEN = 360 * (1 - 2 / (1 + Math.sqrt(5)));

export function phyllo() {
  const canvas = document.getElementById("phy");
  const ctx = canvas.getContext("2d");
  const range = document.getElementById("phy-angle");
  const out = document.getElementById("phy-out");
  const name = document.getElementById("phy-name");
  const presets = [...document.querySelectorAll("[data-angle]")];
  const fams = [...document.querySelectorAll("[data-fam]")];

  const st = { angle: GOLDEN, shown: reducedMotion.matches ? 1 : 0, fam: 0, from: GOLDEN, to: GOLDEN, k: 1, dirty: true };
  let N = 900, size = 0;

  const resize = () => {
    const w = canvas.clientWidth;
    if (!w) return;
    const pr = pixelRatio();
    canvas.width = canvas.height = Math.round(w * pr);
    size = w;
    N = w < 380 ? 620 : w < 560 ? 900 : 1300;
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    st.dirty = true;
  };

  // 旋臂着色：把 F 条旋臂按绕中心的方向排好，隔一条亮一条
  let famRank = null;
  const ranks = () => {
    if (!st.fam) return null;
    const a = st.angle / 360;
    const order = Array.from({ length: st.fam }, (_, j) => j).sort((p, q) => ((p * a) % 1) - ((q * a) % 1));
    const r = new Uint8Array(st.fam);
    order.forEach((j, i) => (r[j] = i % 2));
    return r;
  };

  const draw = () => {
    if (!size) return;
    ctx.clearRect(0, 0, size, size);
    const R = size / 2, c = (R * 0.94) / Math.sqrt(N), dotR = c * 0.5;
    const count = Math.floor(N * st.shown);
    const rad = (st.angle * Math.PI) / 180;
    for (let n = 1; n <= count; n++) {
      const r = c * Math.sqrt(n), t = n * rad, f = n / N;
      let fill;
      if (famRank) fill = famRank[n % st.fam] ? "#ffd98f" : "#4a3a22";
      else fill = `hsl(${40 - f * 8} ${78 - f * 20}% ${82 - f * 34}%)`;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(R + r * Math.cos(t), R + r * Math.sin(t), dotR * (0.55 + 0.45 * Math.sqrt(f)), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const label = () => {
    const a = st.angle;
    out.textContent = `${a.toFixed(3)}°`;
    const near = (x, e = 0.0006) => Math.abs(a - x) < e;
    name.textContent = near(GOLDEN) ? "黄金角" : near(137) ? "差了半度" : near(144) ? "2/5 圈" : near(90) ? "1/4 圈" : near(180) ? "半圈" : near(120) ? "1/3 圈" : `一圈的 ${(a / 360).toFixed(4)}`;
    range.value = a;
    range.setAttribute("aria-valuetext", `${a.toFixed(3)} 度，${name.textContent}`);
    presets.forEach((b) => b.setAttribute("aria-pressed", String(near(+b.dataset.angle, 0.0011))));
  };

  const view = loop(canvas, (t, dt) => {
    if (st.shown < 1) { st.shown = Math.min(1, st.shown + dt / 1.8); st.dirty = true; }
    if (st.k < 1) {
      st.k = Math.min(1, st.k + dt / 0.9);
      const e = st.k < 0.5 ? 4 * st.k ** 3 : 1 - (-2 * st.k + 2) ** 3 / 2;
      st.angle = st.from + (st.to - st.from) * e;
      famRank = ranks();
      label();
      st.dirty = true;
    }
    if (st.dirty) { st.dirty = false; draw(); }
  });
  const redraw = () => { st.dirty = true; view.draw(); };

  const goTo = (a) => {
    if (reducedMotion.matches) { st.angle = a; st.k = 1; famRank = ranks(); label(); return redraw(); }
    st.from = st.angle; st.to = a; st.k = 0;
  };
  range.addEventListener("input", () => { st.k = 1; st.angle = +range.value; famRank = ranks(); label(); redraw(); });
  presets.forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.angle === 137.508 ? GOLDEN : +b.dataset.angle)));
  fams.forEach((b) => b.addEventListener("click", () => {
    st.fam = +b.dataset.fam;
    fams.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    famRank = ranks();
    redraw();
  }));
  new ResizeObserver(() => { resize(); redraw(); }).observe(canvas);
  // 第一次滚到这里时让种子一粒粒长出来
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting && !reducedMotion.matches) { st.shown = 0; obs.disconnect(); } }, { threshold: 0.35 }).observe(canvas);
  label();
}
