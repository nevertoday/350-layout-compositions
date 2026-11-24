import { reducedMotion, webgl } from "../../lib/stage.js";
import { compose } from "./compose.js";
import { hero } from "./hero.js";
import { phyllo } from "./phyllo.js";
import { B, EYE, ORIENTS, PHI, QUARTER, TH0, logR, maxGap, orient, spiral, square, svgPath, toFrame } from "./spiral.js";

const NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
};
const GLOW = `<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

// ---------- 首屏 ----------
const stage = $("stage");
let heroOk = false;
if (webgl()) {
  try {
    hero({ stage, play: $("play"), depth: $("depth"), depthOut: $("depth-out"), reset: $("reset") });
    heroOk = true;
  } catch {
    stage.replaceChildren();
  }
}
if (!heroOk) heroFallback();
if (reducedMotion.matches) $("play").hidden = true;

// 没有 WebGL：一张静止的金色螺旋，内容不少
function heroFallback() {
  document.body.classList.add("no-gl");
  $("hero-ctrl").hidden = true;
  const portrait = innerWidth / innerHeight < 1.05;
  const o = portrait ? ORIENTS[4] : ORIENTS[0];
  const [w, h] = portrait ? [618, 1000] : [1000, 618];
  const f = (p) => { const [u, v] = orient(toFrame(p), o); return [u * w, v * h]; };
  const svg = el("svg", { viewBox: `-30 -30 ${w + 60} ${h + 60}`, class: "hero-svg", "aria-hidden": "true" }, stage);
  svg.innerHTML = `<defs>${GLOW}<radialGradient id="eyeglow"><stop offset="0" stop-color="#fff1cf"/><stop offset=".3" stop-color="#f6c66e" stop-opacity=".5"/><stop offset="1" stop-color="#f6c66e" stop-opacity="0"/></radialGradient></defs>
    <path d="${Array.from({ length: 10 }, (_, k) => svgPath(square(k), f) + "Z").join("")}" fill="none" stroke="#c79a52" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="${svgPath(spiral(TH0, TH0 - 12 * QUARTER, 900), f)}" fill="none" stroke="#f2c26b" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="${f([0, 0])[0]}" cy="${f([0, 0])[1]}" r="60" fill="url(#eyeglow)"/>`;
}

// ---------- 01 两条螺旋 ----------
{
  const svg = $("two-svg");
  svg.setAttribute("viewBox", "-14 -14 1028 646");
  const f = ([x, y]) => { const [u, v] = toFrame([x, y]); return [u * 1000, v * 618.034]; };
  svg.innerHTML = `<defs>${GLOW}</defs>`;
  el("path", { d: Array.from({ length: 10 }, (_, k) => svgPath(square(k), f) + "Z").join(""), class: "t-sq" }, svg);
  const fill = el("path", { class: "t-fill" }, svg);
  const ghost = el("path", { class: "t-ghost" }, svg);
  const main = el("path", { class: "t-main", filter: "url(#glow)" }, svg);
  for (let k = 0; k < 7; k++) {
    const [x, y] = f(square(k)[0]);
    el("circle", { cx: x, cy: y, r: Math.max(2, 6 - k * 0.7), class: "t-knot" }, svg);
  }
  const [ex, ey] = f([0, 0]);
  el("circle", { cx: ex, cy: ey, r: 5, class: "t-eye" }, svg);
  const lab = (x, y, s, anchor = "middle") => { const t = el("text", { x, y, class: "t-lab", "text-anchor": anchor }, svg); t.textContent = s; };
  lab(500, -1, "φ");
  lab(-2, 318, "1", "end");

  const T1 = TH0 - 10 * QUARTER, N = 10 * 90;
  const st = { mix: 0, gap: 1 };
  const draw = () => {
    const E = st.gap;
    const log = spiral(TH0, T1, N, 0), arc = spiral(TH0, T1, N, E);
    const cur = spiral(TH0, T1, N, st.mix * E), other = spiral(TH0, T1, N, (1 - st.mix) * E);
    main.setAttribute("d", svgPath(cur, f));
    ghost.setAttribute("d", svgPath(other, f));
    fill.setAttribute("d", svgPath([...log, ...arc.reverse()], f) + "Z");
  };
  const btns = [...document.querySelectorAll("[data-mix]")];
  let raf = 0;
  btns.forEach((b) => b.addEventListener("click", () => {
    const to = +b.dataset.mix, from = st.mix, t0 = performance.now();
    btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    cancelAnimationFrame(raf);
    const step = (now) => {
      const k = reducedMotion.matches ? 1 : Math.min(1, (now - t0) / 700);
      st.mix = from + (to - from) * (1 - (1 - k) ** 3);
      draw();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }));
  const gap = $("gap");
  gap.addEventListener("input", () => {
    st.gap = +gap.value;
    $("gap-out").textContent = `×${st.gap}`;
    gap.setAttribute("aria-valuetext", `放大 ${st.gap} 倍`);
    draw();
  });
  $("gap-max").textContent = `${(maxGap * 100).toFixed(1)}%`;
  draw();
}

// ---------- 01 曲率 ----------
{
  const svg = $("curv-svg");
  const X = (s) => 48 + s * 92, Y = (lk) => 172 - lk * 62; // s：往里转了几个 90°；lk：ln(曲率)
  const c0 = -Math.log(logR(TH0)) - 0.5 * Math.log(1 + B * B);
  const logLine = Array.from({ length: 51 }, (_, i) => { const s = i / 10; return [X(s), Y(c0 + s * Math.log(PHI) + 0.32)]; });
  let stairs = "";
  for (let k = 0; k < 5; k++) stairs += `${k ? "L" : "M"}${X(k)} ${Y(k * Math.log(PHI) + 0.32)}H${X(k + 1)}`;
  let grid = "";
  for (let k = 0; k <= 5; k++) grid += `M${X(k)} 18V178`;
  svg.innerHTML = `
    <path d="${grid}" class="c-grid"/>
    <path d="M48 178H516M48 178V12" class="c-axis"/>
    <path d="${stairs}" class="c-stairs"/>
    <path d="${svgPath(logLine)}" class="c-line"/>
    <text x="52" y="200" class="c-tx">往里转 →　每格 90°</text>
    <text x="40" y="22" class="c-tx" text-anchor="end">紧</text>
    <text x="40" y="176" class="c-tx" text-anchor="end">松</text>
    <g class="c-key"><path d="M300 194h22" class="c-line"/><text x="328" y="199">对数螺线</text><path d="M408 194h22" class="c-stairs"/><text x="436" y="199">拼圆</text></g>`;
}

// ---------- 02 构图工具 ----------
compose();

// ---------- 03 和三分法比 ----------
{
  const svg = $("thirds-svg");
  svg.setAttribute("viewBox", "-40 -116 1080 846");
  const H = 1000 / PHI;
  const e1 = 1 - EYE;
  const v = (x) => `M${x} 0V${H}`, hz = (y) => `M0 ${y}H1000`;
  const spiralFaint = svgPath(spiral(TH0, TH0 - 10 * QUARTER, 700), (p) => { const [a, b] = toFrame(p); return [a * 1000, b * H]; });
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const eyes = [[e1, e1], [EYE, e1], [e1, EYE], [EYE, EYE]];
  const thirds = [[1 / 3, 1 / 3], [2 / 3, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 2 / 3]];
  svg.innerHTML = `<defs>${GLOW}</defs>
    <rect width="1000" height="${H}" class="h-frame"/>
    <path d="${spiralFaint}" class="h-spiral"/>
    <g data-l="g"><path d="${v(1000 / PHI / PHI)}${v(1000 / PHI)}${hz(H / PHI / PHI)}${hz(H / PHI)}" class="h-gold"/>
      <text x="${1000 / PHI / PHI}" y="-66" class="h-lab g">${pct(1 / PHI / PHI)}</text><text x="${1000 / PHI}" y="-66" class="h-lab g">${pct(1 / PHI)}</text></g>
    <g data-l="t"><path d="${v(1000 / 3)}${v(2000 / 3)}${hz(H / 3)}${hz((2 * H) / 3)}" class="h-third"/>
      ${thirds.map(([x, y]) => `<circle cx="${x * 1000}" cy="${y * H}" r="11" class="h-tp"/>`).join("")}
      <text x="${1000 / 3}" y="-18" class="h-lab t">33.3%</text><text x="${2000 / 3}" y="-18" class="h-lab t">66.7%</text></g>
    <g data-l="e">${eyes.map(([x, y]) => `<circle cx="${x * 1000}" cy="${y * H}" r="30" class="h-halo"/><circle cx="${x * 1000}" cy="${y * H}" r="9" class="h-eye" filter="url(#glow)"/>`).join("")}
      <text x="${e1 * 1000}" y="${H + 62}" class="h-lab e">${pct(e1)}</text><text x="${EYE * 1000}" y="${H + 62}" class="h-lab e">${pct(EYE)}</text></g>`;
  document.querySelectorAll("[data-layer]").forEach((b) => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    svg.querySelector(`[data-l="${b.dataset.layer}"]`).classList.toggle("off", !on);
  }));
}

// ---------- 04 向日葵 + 三个误会 ----------
phyllo();
{
  const spiralPts = (b, turns, R, cx, cy, rot = 0) => {
    const t1 = turns * 2 * Math.PI, pts = [];
    for (let i = 0; i <= 300; i++) {
      const t = (t1 * i) / 300, r = R * Math.exp(b * (t - t1));
      pts.push([cx + r * Math.cos(-t + rot), cy + r * Math.sin(-t + rot)]);
    }
    return svgPath(pts);
  };
  $("m-shell").innerHTML = `<path d="${spiralPts(B, 2.2, 62, 100, 72)}" class="m-gold"/><path d="${spiralPts(Math.log(1.33) / QUARTER, 3.2, 62, 100, 72, 0.6)}" class="m-pale"/>`;
  let dots = "";
  for (let n = 1; n < 260; n++) {
    const r = 3.9 * Math.sqrt(n), t = n * 2.39996;
    dots += `<circle cx="${(100 + r * Math.cos(t)).toFixed(1)}" cy="${(70 + r * Math.sin(t)).toFixed(1)}" r="${(1.1 + n / 260).toFixed(2)}"/>`;
  }
  $("m-sun").innerHTML = `<g class="m-dots">${dots}</g>`;
  $("m-storm").innerHTML = [0, Math.PI].map((r) => `<path d="${spiralPts(0.42, 1.1, 44, 52, 70, r)}" class="m-pale"/><path d="${spiralPts(0.16, 2, 40, 150, 70, r)}" class="m-pale"/>`).join("") + `<circle cx="52" cy="70" r="5" class="m-core"/><circle cx="150" cy="70" r="5" class="m-core"/>`;
}

// ---------- 06 原海报 ----------
{
  const dlg = $("viewer"), img = $("viewer-img"), scroll = $("viewer-scroll"), poster = $("poster");
  const levels = [1, 1.5, 2, 3];
  let z = 0;
  const apply = () => {
    const base = Math.min(scroll.clientWidth, (scroll.clientHeight * 1086) / 1448);
    img.style.width = `${Math.round(base * levels[z])}px`;
    $("zoom-out-val").textContent = `${levels[z] * 100}%`;
    $("zoom-out").disabled = z === 0;
    $("zoom-in").disabled = z === levels.length - 1;
  };
  $("poster-open").addEventListener("click", () => {
    if (!img.src) img.src = poster.currentSrc || poster.src;
    z = 0;
    dlg.showModal();
    apply();
  });
  $("zoom-in").addEventListener("click", () => { z = Math.min(levels.length - 1, z + 1); apply(); });
  $("zoom-out").addEventListener("click", () => { z = Math.max(0, z - 1); apply(); });
  $("viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  let pan = null;
  scroll.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { pan = { x: e.clientX, y: e.clientY, l: scroll.scrollLeft, t: scroll.scrollTop }; scroll.setPointerCapture(e.pointerId); } });
  scroll.addEventListener("pointermove", (e) => { if (pan) { scroll.scrollLeft = pan.l - (e.clientX - pan.x); scroll.scrollTop = pan.t - (e.clientY - pan.y); } });
  scroll.addEventListener("pointerup", () => (pan = null));
}
