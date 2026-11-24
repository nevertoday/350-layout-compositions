// 01 画法、02 四块同形、03 画幅：三张图都从 armature() 取点。
import { reducedMotion } from "../../lib/stage.js";
import { armature, dist, edgeAt, footAt, lerp, pathOf, rightMark } from "./geo.js";

const $ = (id) => document.getElementById(id);
const f1 = (n) => n.toFixed(1);
const deg = (r) => (r * 180) / Math.PI;
const PHI = (1 + Math.sqrt(5)) / 2;
const pct = (x) => `${(x * 100).toFixed(1)}%`;
// 按显示出来的一位小数相减，读者自己算也对得上
const gap = (fu) => Math.abs(33.3 - +(fu * 100).toFixed(1)).toFixed(1);

// 一段 0→1 的缓动动画；减少动态效果时直接跳到终点
function tween(ms, fn, done) {
  if (reducedMotion.matches) { fn(1); done?.(); return () => {}; }
  let raf = 0;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    fn(k);
    if (k < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// ---------- 01 画法 ----------
const STEP_TEXT = [
  "",
  "从画框的一个角拉到对角，这是主斜线。画面的动势从这里来：从左下往右上，读起来像上坡；反过来像下坡。",
  "从剩下的一个角，向主斜线作垂线。两条线在这里成直角相交，交点叫垂足——海报上说的「强交点」。",
  "第四个角也作一条。两条垂线互相平行，各落一个垂足，把主斜线分成三段。主体放在垂足附近。",
  "画框被切成四个直角三角形，直角都在垂足上。大的两块一样大，小的两块一样大；下一节会看到，四块其实是同一个形状。",
];

export function buildSteps() {
  const svg = $("build-svg");
  const W = 600, H = 400, g = armature(W, H, "rise"), m = H;
  svg.setAttribute("viewBox", "-34 -34 668 468");
  const [p0, p1] = g.perps;
  const tri = g.tris.map((t, i) => `<path class="tri tri-${i}" d="${pathOf([t.r, t.a, t.b])}"/>`).join("");
  const nums = g.tris.map((t, i) => {
    const c = [(t.r[0] + t.a[0] + t.b[0]) / 3, (t.r[1] + t.a[1] + t.b[1]) / 3];
    return `<g class="tri-num" transform="translate(${f1(c[0])} ${f1(c[1])})"><circle r="15"/><text dy="0.36em" font-size="16">${i + 1}</text></g>`;
  }).join("");
  const mid = lerp(g.A, g.C, 0.18);
  svg.innerHTML = `
    <rect class="b-frame" width="${W}" height="${H}"/>
    <g class="b-fade" data-s="4">${tri}${nums}</g>
    <line class="diag" x1="${g.A[0]}" y1="${g.A[1]}" x2="${g.C[0]}" y2="${g.C[1]}" pathLength="1" stroke-dasharray="1" data-draw/>
    <text class="b-lab y b-fade" data-s="1" x="${f1(mid[0] + 18)}" y="${f1(mid[1] + 22)}" transform="rotate(${f1(-deg(g.theta))} ${f1(mid[0] + 18)} ${f1(mid[1] + 22)})">主斜线</text>
    ${[p0, p1].map((p, i) => `<g class="b-fade" data-s="${i + 2}">
      <line class="perp" x1="${p.corner[0]}" y1="${p.corner[1]}" x2="${f1(p.foot[0])}" y2="${f1(p.foot[1])}"/>
      <path class="rmark" d="${rightMark(p.foot, g.C, p.corner, 16)}"/>
      <circle class="foot-ring" cx="${f1(p.foot[0])}" cy="${f1(p.foot[1])}" r="13"/><circle class="foot-dot" cx="${f1(p.foot[0])}" cy="${f1(p.foot[1])}" r="5"/>
      <text class="b-lab y" x="${f1(p.foot[0] + (i ? -22 : 22))}" y="${f1(p.foot[1] + (i ? -16 : 30))}" text-anchor="${i ? "end" : "start"}">垂足</text>
    </g>`).join("")}
    <g class="b-corner">${[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join("")}</g>`;
  const diag = svg.querySelector("[data-draw]");
  const tabs = [...document.querySelectorAll("#steps [data-step]")];
  let cancel = () => {};
  const show = (n, focus = false) => {
    tabs.forEach((b) => {
      const on = +b.dataset.step === n;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    svg.querySelectorAll(".b-fade").forEach((el) => (el.style.opacity = +el.dataset.s <= n && (el.dataset.s !== "4" || n === 4) ? 1 : 0));
    $("step-text").textContent = STEP_TEXT[n];
    cancel();
    if (n === 1) cancel = tween(700, (k) => diag.setAttribute("stroke-dashoffset", String(1 - (1 - (1 - k) ** 3))));
    else diag.setAttribute("stroke-dashoffset", "0");
  };
  tabs.forEach((b) => {
    b.addEventListener("click", () => show(+b.dataset.step));
    b.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      show(((+b.dataset.step - 1 + d + 4) % 4) + 1, true);
    });
  });
  // 滚到这一节时从第 1 步画起
  let seen = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !seen) { seen = true; show(1); } }, { threshold: 0.4 }).observe(svg);
  show(4);
}

// ---------- 02 四块同形 ----------
export function similar() {
  const svg = $("sim-svg"), btn = $("sim-btn");
  const W = 600, H = 400, g = armature(W, H, "rise");
  svg.setAttribute("viewBox", "-30 -30 660 460");
  const unit = (v) => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l]; };
  // 每块：直角顶点 R、长直角边端点 L、短直角边端点 S
  const parts = g.tris.map((t) => {
    const [L, S] = dist(t.r, t.a) >= dist(t.r, t.b) ? [t.a, t.b] : [t.b, t.a];
    const e1 = unit([L[0] - t.r[0], L[1] - t.r[1]]), e2 = unit([S[0] - t.r[0], S[1] - t.r[1]]);
    return { R: t.r, a: dist(t.r, L), b: dist(t.r, S), ang: Math.atan2(e1[1], e1[0]), hand: Math.sign(e1[0] * e2[1] - e1[1] * e2[0]) };
  });
  const ref = parts[2]; // 右下那块（开场里的山）不动，其它三块叠上去
  const order = [1, 2, 0, 3]; // 先画大的
  svg.innerHTML = `<rect class="sim-frame" width="${W}" height="${H}"/>${order.map((i) => `<path class="sim-tri sim-${i}" data-i="${i}"/>`).join("")}<g class="sim-labs"></g>`;
  const paths = Object.fromEntries(order.map((i) => [i, svg.querySelector(`[data-i="${i}"]`)]));
  const labs = svg.querySelector(".sim-labs");
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const draw = (k) => {
    parts.forEach((p, i) => {
      const ki = Math.min(1, Math.max(0, (k * 1.36 - (i === 2 ? 0 : [0.12, 0.24, 0, 0.36][i]))));
      const e = 1 - (1 - ki) ** 3;
      const R = lerp(p.R, ref.R, e);
      const a = p.ang + angDiff(p.ang, ref.ang) * e;
      const e1 = [Math.cos(a), Math.sin(a)];
      const s = p.hand + (ref.hand - p.hand) * e; // 经过 0 就是翻面
      const n = [-e1[1] * s, e1[0] * s];
      paths[i].setAttribute("d", pathOf([R, [R[0] + e1[0] * p.a, R[1] + e1[1] * p.a], [R[0] + n[0] * p.b, R[1] + n[1] * p.b]]));
    });
    labs.style.opacity = Math.max(0, (k - 0.85) / 0.15);
  };
  // 叠好以后标出三个角
  const t = Math.atan(H / W);
  const R = ref.R, Lp = g.tris[2].a, Sp = g.tris[2].b;
  const cen = [(R[0] + Lp[0] + Sp[0]) / 3, (R[1] + Lp[1] + Sp[1]) / 3];
  const out = (p, d) => { const v = [p[0] - cen[0], p[1] - cen[1]], l = Math.hypot(...v); return [p[0] + (v[0] / l) * d, p[1] + (v[1] / l) * d + 5]; };
  const [lx, ly] = out(R, 30), [ax, ay] = out(dist(R, Lp) >= dist(R, Sp) ? Lp : Sp, 34), [bx, by] = out(dist(R, Lp) >= dist(R, Sp) ? Sp : Lp, 34);
  labs.innerHTML = `<text class="sim-ang" x="${f1(lx)}" y="${f1(ly)}">90°</text><text class="sim-ang" x="${f1(ax)}" y="${f1(ay)}">${deg(t).toFixed(1)}°</text><text class="sim-ang" x="${f1(bx)}" y="${f1(by)}">${(90 - deg(t)).toFixed(1)}°</text>`;
  $("sim-read").innerHTML = `每块的三个角：<b>90°</b> · <b>${deg(t).toFixed(1)}°</b> · <b>${(90 - deg(t)).toFixed(1)}°</b>　大块 : 小块（边长）= <b>3 : 2</b>`;
  let k = 0, cancel = () => {};
  draw(0);
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "摊开" : "叠起来";
    const from = k, to = on ? 1 : 0;
    cancel();
    cancel = tween(1500 * Math.abs(to - from) + 1, (x) => { k = from + (to - from) * x; draw(k); });
  });
}

// ---------- 03 画幅 ----------
const PRESETS = [[1, "1 : 1"], [4 / 3, "4 : 3"], [1.5, "3 : 2"], [PHI, "φ : 1"], [16 / 9, "16 : 9"], [2.39, "2.39 : 1"]];

export function ratioLab() {
  const svg = $("ratio-svg"), input = $("ratio"), chips = [...document.querySelectorAll(".presets .chip")];
  svg.setAttribute("viewBox", "0 0 640 440");
  // 窄屏上整张图缩得很小：字号按渲染宽度放大（k），画框相应让出底下几行字的位置
  let cur = 1.5;
  const name = (r) => PRESETS.find(([v]) => Math.abs(v - r) < 0.006)?.[1] ?? `${r.toFixed(2)} : 1`;
  const draw = (r) => {
    cur = r;
    const scale = svg.getBoundingClientRect().width / 640 || 1;
    const k = Math.min(2, Math.max(1, 12 / (14 * scale)));
    const fs = 14 * k, BX = 40, BY = 16 + fs * 1.6, BW = 560, BH = 440 - BY - fs * 4.6 - 18;
    const fw = r >= BW / BH ? BW : BH * r, fh = fw / r;
    const x0 = BX + (BW - fw) / 2, y0 = BY + (BH - fh) / 2;
    const g = armature(fw, fh, "rise");
    const T = ([x, y]) => [x0 + x, y0 + y];
    const fu = footAt(r), eu = edgeAt(r);
    const gold = Math.abs(r - PHI) < 0.006;
    let s = `<rect class="r-frame" x="${f1(x0)}" y="${f1(y0)}" width="${f1(fw)}" height="${f1(fh)}"/>`;
    for (const q of [1 / 3, 2 / 3]) s += `<path class="r-third-ln" d="M${f1(x0 + fw * q)} ${f1(y0)}v${f1(fh)}M${f1(x0)} ${f1(y0 + fh * q)}h${f1(fw)}"/>`;
    if (gold) {
      const sx = x0 + fw * eu;
      s += `<rect x="${f1(sx)}" y="${f1(y0)}" width="${f1(fw - fw * eu)}" height="${f1(fh)}" fill="rgba(255,203,10,0.1)"/><path class="r-tick" d="M${f1(sx)} ${f1(y0)}v${f1(fh)}"/><text class="r-lab" x="${f1(sx + (fw - fw * eu) / 2)}" y="${f1(y0 + fh / 2 + 48)}">正方形</text>`;
    }
    g.perps.forEach((p) => (s += `<line class="r-ext" x1="${f1(T(p.foot)[0])}" y1="${f1(T(p.foot)[1])}" x2="${f1(T(p.end)[0])}" y2="${f1(T(p.end)[1])}"/>`));
    s += `<line class="diag" x1="${f1(T(g.A)[0])}" y1="${f1(T(g.A)[1])}" x2="${f1(T(g.C)[0])}" y2="${f1(T(g.C)[1])}"/>`;
    g.perps.forEach((p) => {
      const [cx, cy] = T(p.corner), [fx, fy] = T(p.foot);
      s += `<line class="perp" x1="${f1(cx)}" y1="${f1(cy)}" x2="${f1(fx)}" y2="${f1(fy)}"/>`;
      if (r > 1.02) s += `<path class="rmark" d="${rightMark(T(p.foot), T(g.C), T(p.corner), 11)}"/>`;
    });
    for (const [u, v] of [[1 / 3, 1 / 3], [2 / 3, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 2 / 3]]) s += `<circle class="r-third" cx="${f1(x0 + fw * u)}" cy="${f1(y0 + fh * v)}" r="7"/>`;
    g.perps.forEach((p) => {
      const [fx, fy] = T(p.foot);
      s += `<circle class="foot-ring" cx="${f1(fx)}" cy="${f1(fy)}" r="11"/><circle class="foot-dot" cx="${f1(fx)}" cy="${f1(fy)}" r="4.5"/>`;
    });
    // 上面标三分线，下面标垂足、延长点
    const top = y0 - fs * 0.7, bot = y0 + fh, row1 = bot + fs * 1.6, row2 = bot + fs * 3;
    s += `<text class="r-lab w" x="${f1(x0 + fw / 3)}" y="${f1(top)}">33.3%</text><text class="r-lab w" x="${f1(x0 + (fw * 2) / 3)}" y="${f1(top)}">66.7%</text>`;
    if (r > 1.02) {
      s += `<path class="r-tick" d="M${f1(x0 + fw * fu)} ${f1(bot)}v8M${f1(x0 + fw * (1 - fu))} ${f1(bot)}v8"/>`;
      s += `<text class="r-lab" x="${f1(x0 + fw * fu)}" y="${f1(row1)}">${pct(fu)}</text><text class="r-lab" x="${f1(x0 + fw * (1 - fu))}" y="${f1(row1)}">${pct(1 - fu)}</text>`;
      const ex = x0 + fw * eu;
      s += `<circle class="r-gold" cx="${f1(ex)}" cy="${f1(bot)}" r="${gold ? 7 : 4}"/><text class="r-lab w" x="${f1(ex)}" y="${f1(row2)}">延长 ${pct(eu)}</text>`;
      if (gold) s += `<g class="r-badge" transform="translate(${f1(ex)} ${f1(row2 + fs * 0.5)})"><rect x="${f1(-4.2 * fs)}" y="0" width="${f1(8.4 * fs)}" height="${f1(1.7 * fs)}"/><text y="${f1(1.2 * fs)}" font-size="${f1(fs * 0.95)}">黄金分割点</text></g>`;
    } else {
      s += `<text class="r-lab" x="${f1(x0 + fw / 2)}" y="${f1(row1)}">两个垂足都在 50%</text>`;
    }
    svg.innerHTML = s;
    svg.style.setProperty("--fs", `${fs}px`);
    $("ratio-out").textContent = name(r);
    $("r-foot").textContent = r > 1.02 ? `${pct(fu)} · ${pct(1 - fu)}` : "50% · 50%";
    $("r-third").textContent = `差 ${gap(fu)} 点`;
    $("r-edge").textContent = r > 1.02 ? pct(eu) : "对角";
    $("r-theta").textContent = `${deg(Math.atan(1 / r)).toFixed(1)}°`;
    $("r-note").innerHTML = note(r, fu);
    chips.forEach((c) => c.setAttribute("aria-pressed", String(Math.abs(PRESETS[+c.dataset.p][0] - r) < 0.006)));
    input.setAttribute("aria-valuetext", `${name(r)}，垂足在长边的 ${pct(fu)}`);
  };
  const set = (r) => { input.value = String(r); draw(r); };
  input.addEventListener("input", () => {
    let r = +input.value;
    const near = PRESETS.find(([v]) => Math.abs(v - r) < 0.012);
    if (near) r = near[0];
    draw(r);
  });
  chips.forEach((c) => c.addEventListener("click", () => set(PRESETS[+c.dataset.p][0])));
  new ResizeObserver(() => draw(cur)).observe(svg);
  set(1.5);
}

function note(r, fu) {
  const p = (x) => (x * 100).toFixed(1);
  if (r <= 1.02) return "正方形：两条垂线都穿过正中，两个垂足合成一个点，四个三角形变成一个 X。没有偏心的落点，黄金三角帮不上忙。";
  if (Math.abs(r - PHI) < 0.006) return `画框正好是 φ 时，垂线延长落在长边的 38.2%——黄金分割点。它切下来的一块是正方形，剩下的小矩形还是 φ（<a href="https://layout.xiaoxiaodong.ai/002/play/" target="_blank" rel="noopener">No. 002</a>）。「黄金三角」只在这里，才真和黄金分割沾上边。`;
  if (r < 1.25) return `接近正方形：垂足挤向中心（${p(fu)}%），四块三角形大小差不多，斜线很陡。有了动势，落点却不够偏。`;
  if (r <= 1.56) return `垂足离三分点很近，只差 ${gap(fu)} 个百分点。用相机里的三分线去对，位置差不多就是它；黄金三角多给的，是一条斜线和两条垂线，让你拿景物去对。`;
  if (r <= 1.85) return `垂足退到 ${p(fu)}%，比三分点更靠边。三角形更细长，斜线更平；主体离边近了，前面留出的空间更大。`;
  return `画面越宽，垂足越贴边（${p(fu)}%），斜线也越平，冲劲反而弱了。主体被挤到边上时，宁可往里松一点，别死守垂足。`;
}
