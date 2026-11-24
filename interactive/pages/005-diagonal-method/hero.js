// 开场：一条黄色光带绕画面中心转，倾角 0–90°；圆、方、三角沿着它从近端流向箭头，近大远小。
// 状态只有 angle（度）和 paused；画法是 2D canvas，不需要 WebGL。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { angleZone, clamp, snapAngle } from "./geo.js";

const C = { green: "#025D41", deep: "#00472F", cream: "#F9F0DF", yellow: "#FCBF07", mint: "#9ED36A", shadow: "rgba(0,36,22,0.32)" };
const $ = (id) => document.getElementById(id);

export function initHero() {
  const stage = $("hero-stage"), canvas = $("hero-canvas"), handle = $("hero-handle"), range = $("hero-range");
  const ctx = canvas.getContext("2d");
  const state = { angle: +range.value, paused: false, flow: 0 };
  let W = 0, H = 0, dpr = 1;

  // 中心出发沿方向 (dx, dy) 走到画框边的距离
  const toEdge = (dx, dy) => Math.min(dx ? W / 2 / Math.abs(dx) : Infinity, dy ? H / 2 / Math.abs(dy) : Infinity);

  function geometry() {
    const a = (state.angle * Math.PI) / 180;
    const d = [Math.cos(a), -Math.sin(a)], n = [Math.sin(a), Math.cos(a)];
    const m = Math.min(W, H), edge = toEdge(d[0], d[1]);
    const head = m * 0.1;
    const farL = edge - head * 1.25, nearL = edge * 1.12;
    const cx = W / 2, cy = H / 2;
    return {
      d, n, m, head, a,
      near: [cx - d[0] * nearL, cy - d[1] * nearL],
      far: [cx + d[0] * farL, cy + d[1] * farL],
      w0: m * 0.34, w1: m * 0.085,
    };
  }

  const at = (g, t) => [g.near[0] + (g.far[0] - g.near[0]) * t, g.near[1] + (g.far[1] - g.near[1]) * t];

  function shape(kind, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    if (kind === 0) ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    else if (kind === 1) ctx.rect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84);
    else {
      ctx.moveTo(s * 0.55, 0);
      ctx.lineTo(-s * 0.4, -s * 0.5);
      ctx.lineTo(-s * 0.4, s * 0.5);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }

  const COUNT = 6;
  function frame(_t, dt) {
    if (!W) return;
    if (!state.paused) state.flow += dt * 0.055;
    const g = geometry();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.green;
    ctx.fillRect(0, 0, W, H);

    // 参照：过中心的一横一竖
    ctx.strokeStyle = "rgba(249,240,223,0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // 远侧几条细线，和光带平行（海报右边那几道）
    ctx.strokeStyle = "rgba(158,211,106,0.22)";
    ctx.beginPath();
    for (let i = 1; i <= 7; i++) {
      const o = g.w0 * 0.5 + i * g.m * 0.028 + i * i * 1.2;
      const ox = g.n[0] * o, oy = g.n[1] * o, L = Math.hypot(W, H);
      ctx.moveTo(W / 2 + ox - g.d[0] * L, H / 2 + oy - g.d[1] * L);
      ctx.lineTo(W / 2 + ox + g.d[0] * L, H / 2 + oy + g.d[1] * L);
    }
    ctx.stroke();

    // 光带：近端宽、远端窄，再加箭头
    const [nx, ny] = g.n;
    ctx.fillStyle = C.yellow;
    ctx.beginPath();
    ctx.moveTo(g.near[0] + nx * g.w0 / 2, g.near[1] + ny * g.w0 / 2);
    ctx.lineTo(g.far[0] + nx * g.w1 / 2, g.far[1] + ny * g.w1 / 2);
    ctx.lineTo(g.far[0] + nx * g.w1 * 1.35, g.far[1] + ny * g.w1 * 1.35);
    ctx.lineTo(g.far[0] + g.d[0] * g.head, g.far[1] + g.d[1] * g.head);
    ctx.lineTo(g.far[0] - nx * g.w1 * 1.35, g.far[1] - ny * g.w1 * 1.35);
    ctx.lineTo(g.far[0] - nx * g.w1 / 2, g.far[1] - ny * g.w1 / 2);
    ctx.lineTo(g.near[0] - nx * g.w0 / 2, g.near[1] - ny * g.w0 / 2);
    ctx.closePath();
    ctx.fill();
    // 光带靠下的一半暗一点，像海报那样有个面
    ctx.fillStyle = "rgba(214,150,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(g.near[0], g.near[1]);
    ctx.lineTo(g.far[0], g.far[1]);
    ctx.lineTo(g.far[0] + nx * g.w1 / 2, g.far[1] + ny * g.w1 / 2);
    ctx.lineTo(g.near[0] + nx * g.w0 / 2, g.near[1] + ny * g.w0 / 2);
    ctx.closePath();
    ctx.fill();

    // 中线虚线，跟着流
    ctx.strokeStyle = "rgba(249,240,223,0.9)";
    ctx.lineWidth = Math.max(1.5, g.m * 0.005);
    ctx.setLineDash([g.m * 0.018, g.m * 0.022]);
    ctx.lineDashOffset = -state.flow * g.m * 3;
    ctx.beginPath();
    ctx.moveTo(g.near[0], g.near[1]);
    ctx.lineTo(g.far[0], g.far[1]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 圆、方、三角，从近到远
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT + state.flow) % 1;
      items.push({ t, i });
    }
    items.sort((p, q) => q.t - p.t); // 远的先画，近的压在上面
    for (const { t, i } of items) {
      const k = Math.pow(t, 0.85);
      const [x, y] = at(g, k);
      const w = g.w0 + (g.w1 - g.w0) * k;
      const s = w * 0.62;
      const fade = clamp((0.97 - t) / 0.07, 0, 1);
      const kind = i % 3;
      const rot = kind === 2 ? -g.a : -g.a + Math.PI / 4 * (kind === 1 ? 1 : 0) + t * 0.6;
      ctx.globalAlpha = fade;
      ctx.fillStyle = C.shadow;
      shape(kind, x + s * 0.07, y + s * 0.09, s, rot);
      ctx.fillStyle = i % 2 ? C.cream : C.deep;
      shape(kind, x, y, s, rot);
    }
    ctx.globalAlpha = 1;
  }

  const { draw } = loop(stage, frame);
  const redraw = () => { if (state.paused || reducedMotion.matches) draw(); };

  function placeHandle() {
    if (!W) return;
    const g = geometry();
    const tip = [g.far[0] + g.d[0] * g.head * 0.45, g.far[1] + g.d[1] * g.head * 0.45];
    handle.style.transform = `translate(${tip[0]}px, ${tip[1]}px)`;
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = pixelRatio();
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    placeHandle();
    draw();
  }
  new ResizeObserver(resize).observe(stage);

  // 读数、标题台阶、量角器
  const title = $("title"), deg = $("hero-deg"), zone = $("hero-zone"), text = $("hero-text");
  const needle = $("g-needle"), band = $("g-band");
  const R = 80, O = [10, 90];
  const pt = (a) => [O[0] + R * Math.cos((a * Math.PI) / 180), O[1] - R * Math.sin((a * Math.PI) / 180)];
  {
    const [x1, y1] = pt(30), [x2, y2] = pt(60);
    band.setAttribute("d", `M${O[0]} ${O[1]}L${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`);
  }

  function setAngle(a, { snap = true } = {}) {
    a = clamp(snap ? snapAngle(a) : Math.round(a), 0, 90);
    state.angle = a;
    range.value = a;
    const z = angleZone(a);
    deg.textContent = `${a}°`;
    zone.textContent = z.label;
    zone.dataset.zone = z.key;
    text.textContent = z.text;
    const [x, y] = pt(a);
    needle.setAttribute("d", `M${O[0]} ${O[1]}L${x.toFixed(1)} ${y.toFixed(1)}`);
    title.style.setProperty("--rise", Math.min(Math.tan((a * Math.PI) / 180), 2.2).toFixed(3));
    handle.setAttribute("aria-valuenow", String(a));
    handle.setAttribute("aria-valuetext", `${a}°，${z.label}`);
    placeHandle();
    redraw();
  }

  range.addEventListener("input", () => setAngle(+range.value, { snap: false }));
  for (const b of document.querySelectorAll("[data-angle]")) b.addEventListener("click", () => setAngle(+b.dataset.angle));
  const pause = $("hero-pause");
  pause.addEventListener("click", () => {
    state.paused = !state.paused;
    pause.setAttribute("aria-pressed", String(state.paused));
    pause.textContent = state.paused ? "继续流动" : "暂停流动";
  });

  // 拖：触屏只认箭头上的把手；鼠标在画面任何地方都行
  let dragging = null;
  const fromPointer = (e) => {
    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2, y = r.top + r.height / 2 - e.clientY;
    // 光带是一条过中心的线，拖哪一头都行；落在 90°–180° 之间就夹到近的那一端
    let a = ((((Math.atan2(y, x) * 180) / Math.PI) % 180) + 180) % 180;
    if (a > 90) a = a > 135 ? 0 : 90;
    setAngle(a);
  };
  const start = (e) => {
    dragging = e.pointerId;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
    fromPointer(e);
    e.preventDefault();
  };
  handle.addEventListener("pointerdown", start);
  stage.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && e.target !== handle && !handle.contains(e.target)) start(e); });
  stage.addEventListener("pointermove", (e) => { if (dragging === e.pointerId) fromPointer(e); });
  const end = (e) => { if (dragging === e.pointerId) { dragging = null; stage.classList.remove("dragging"); } };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 5 : 1;
    const k = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: 10, PageDown: -10 }[e.key];
    if (k !== undefined) setAngle(state.angle + k, { snap: false });
    else if (e.key === "Home") setAngle(0);
    else if (e.key === "End") setAngle(90);
    else return;
    e.preventDefault();
  });

  setAngle(state.angle);
}
