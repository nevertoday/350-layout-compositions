// 开场：一个画框，一个会看你鼠标的头。状态只有 head / look / shot（见 model.js），
// 三维和 SVG 两种画法共用同一套把手、测量线、读数。
import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import { createHead3D } from "./hero3d.js";
import { placedHead } from "./head2d.js";
import { PRESETS, SHOTS, clamp, describe, facingLabel, gaze, pct, placeHead, placeLook, radius, room } from "./model.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";

function createFlat(host) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "flat-head");
  svg.setAttribute("aria-hidden", "true");
  host.prepend(svg);
  let W = 1, H = 1;
  return {
    kind: "flat",
    resize(w, h) {
      W = w;
      H = h;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    },
    render({ u, v, R, yaw, pitch, eye }) {
      svg.innerHTML = placedHead(u * W, v * H, R * H, yaw, pitch, { eye });
    },
  };
}

export function initHero() {
  const stage = $("stage");
  const overlay = $("overlay");
  const headBtn = $("head-handle");
  const lookBtn = $("look-handle");
  const view = webgl() ? createHead3D(stage) : createFlat(stage);
  stage.classList.add(view.kind === "3d" ? "is-3d" : "is-flat");

  const state = { head: { ...PRESETS.classic.head }, look: { ...PRESETS.classic.look }, shot: "medium" };
  let W = 1, H = 1, A = 1.5;
  // 画面上正在显示的样子：朝目标缓动过去；开场时先正脸看着你，再转向前方的空白
  const anim = { u: state.head.u, v: state.head.v, yaw: 0, pitch: 0, eye: 0, R: 0.19 };
  let hold = reducedMotion.matches ? 0 : 0.7;
  let dragging = null;
  let dirty = true;

  const parts = {
    guides: overlay.querySelector(".guides"),
    gaze: overlay.querySelector(".gaze-line"),
    ticks: overlay.querySelector(".ticks"),
    bars: overlay.querySelector(".bars"),
    lb: overlay.querySelector(".lab-behind"),
    ll: overlay.querySelector(".lab-lead"),
  };
  const glow = $("glow");

  function resize() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    A = W / H;
    view.resize(W, H);
    overlay.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = [1 / 3, 2 / 3];
    parts.guides.setAttribute("d", g.map((x) => `M${x * W} 0V${H}M0 ${x * H}H${W}`).join(""));
    state.head = placeHead(state.head, radius(state.shot, A));
    dirty = true;
    update();
  }

  // 测量线、视线、光晕、把手：都按「正在显示」的姿态画，跟着头一起动
  function drawOverlay() {
    const R = radius(state.shot, A);
    const head = { u: anim.u, v: anim.v };
    const rm = room(head, anim.yaw, R);
    const s = Math.abs(Math.sin(anim.yaw));
    const hx = head.u * W, hy = head.v * H;
    const Rp = R.v * H;
    // 视线：从眼睛前面一点出发，到他看的那个点
    const ex = hx + Math.sin(anim.yaw) * 0.82 * Rp, ey = hy - Math.sin(anim.pitch) * 0.28 * Rp - 0.04 * Rp;
    const lx = state.look.u * W, ly = state.look.v * H;
    parts.gaze.setAttribute("d", `M${ex.toFixed(1)} ${ey.toFixed(1)}L${lx.toFixed(1)} ${ly.toFixed(1)}`);
    parts.gaze.style.opacity = rm.facing ? 1 : 0.35;
    // 光晕在目光前方那片空白的中间
    const dir = rm.facing || 0;
    const reach = dir > 0 ? (1 - rm.right) * W : dir < 0 ? rm.left * W : 0;
    const gx = dir ? ex + dir * reach * 0.55 : hx;
    glow.style.setProperty("--gx", `${(gx / W) * 100}%`);
    glow.style.setProperty("--gy", `${((ey + (ly - ey) * 0.3) / H) * 100}%`);
    glow.style.setProperty("--gs", `${Math.max(0.35, (reach / W) * 1.3 + 0.2) * 100}%`);
    glow.style.opacity = (0.25 + 0.75 * s).toFixed(2);
    // 底下的尺寸线：脑后一段、前方一段
    const by = H - Math.max(16, H * 0.05);
    const L = rm.left * W, Rr = rm.right * W;
    parts.ticks.setAttribute("d", `M${L.toFixed(1)} ${(hy + Rp * 0.4).toFixed(1)}V${by + 6}M${Rr.toFixed(1)} ${(hy + Rp * 0.4).toFixed(1)}V${by + 6}`);
    const leftIsLead = rm.facing < 0;
    const segs = [
      { a: 0, b: Math.max(0, L), lead: leftIsLead },
      { a: Math.min(W, Rr), b: W, lead: rm.facing > 0 },
    ];
    parts.bars.innerHTML = segs.map((g) => `<path class="${g.lead ? "bar-lead" : "bar-back"}" d="M${g.a.toFixed(1)} ${by}H${g.b.toFixed(1)}M${g.a.toFixed(1)} ${by - 5}V${by + 5}M${g.b.toFixed(1)} ${by - 5}V${by + 5}"/>`).join("");
    const label = (el, g, text) => {
      const w = g.b - g.a;
      el.textContent = text;
      const half = text.length * 4 + 4;
      el.setAttribute("x", clamp(g.a + w / 2, half + 2, W - half - 2).toFixed(1));
      el.setAttribute("y", by - 9);
      el.style.opacity = w > 46 ? 1 : 0;
    };
    const lead = rm.facing ? rm.lead : null;
    if (rm.facing === 0) {
      label(parts.lb, segs[0], pct(rm.left));
      label(parts.ll, segs[1], pct(1 - rm.right));
    } else {
      const [lg, bg] = leftIsLead ? [segs[0], segs[1]] : [segs[1], segs[0]];
      label(parts.ll, lg, `前方 ${pct(lead)}`);
      label(parts.lb, bg, `脑后 ${pct(rm.behind)}`);
    }
    parts.ll.classList.toggle("is-lead", rm.facing !== 0);
    // 把手
    const hr = Math.max(22, Rp * 1.05);
    headBtn.style.cssText = `width:${hr * 2}px;height:${hr * 2}px;transform:translate(${hx - hr}px,${hy - hr}px)`;
    // 他看的点可以在画框外面，把手停在框边上，免得拖不回来
    lookBtn.style.transform = `translate(${clamp(lx, 14, W - 14) - 22}px,${clamp(ly, 14, H - 14) - 22}px)`;
    lookBtn.classList.toggle("outside", lx < 0 || lx > W || ly < 0 || ly > H);
  }

  function update() {
    const d = describe(state, A);
    $("ro-facing").textContent = facingLabel(d.yaw);
    $("ro-lead").textContent = d.room.facing ? pct(d.room.lead) : "—";
    $("ro-behind").textContent = d.room.facing ? pct(d.room.behind) : "—";
    $("ro-tag").textContent = d.verdict.tag;
    $("ro-tag").dataset.kind = d.verdict.kind;
    $("ro-text").textContent = d.verdict.text;
    $("ro-note").textContent = d.note;
    $("ro-note").hidden = !d.note;
    $("hud-shot").textContent = `${SHOTS[state.shot].label} · ${SHOTS[state.shot].en}`;
    $("hud-face").textContent = facingLabel(d.yaw);
    headBtn.setAttribute("aria-label", `头的位置：横 ${pct(state.head.u)}，竖 ${pct(state.head.v)}。${d.verdict.tag}`);
    lookBtn.setAttribute("aria-label", `他看的地方：横 ${pct(state.look.u)}，竖 ${pct(state.look.v)}。${facingLabel(d.yaw)}`);
    for (const b of document.querySelectorAll("[data-preset]")) b.setAttribute("aria-pressed", String(matches(PRESETS[b.dataset.preset])));
    dirty = true;
    lp.draw();
  }
  const near = (a, b) => Math.abs(a.u - b.u) < 0.005 && Math.abs(a.v - b.v) < 0.005;
  const matches = (p) => near(p.head, state.head) && near(placeLook(p.look), state.look);

  const ease = (dt, rate) => 1 - Math.exp(-dt * rate);
  const lp = loop(stage, (t, dt, { still }) => {
    const R = radius(state.shot, A);
    const g = gaze(state.head, state.look, R, A);
    if (hold > 0 && !still) {
      hold -= dt;
      if (hold <= 0) stage.classList.add("ready");
    }
    const k = still || hold <= 0 ? (still ? 1 : ease(dt, 5.5)) : 0;
    const kp = still || dragging === "head" ? 1 : ease(dt, 8);
    const before = anim.yaw + anim.pitch + anim.u + anim.v + anim.eye + anim.R;
    anim.yaw += (g.yaw - anim.yaw) * k;
    anim.pitch += (g.pitch - anim.pitch) * k;
    // 眼珠先到，头后到：眼珠转的是两者之差（最多 30°）
    const eyeWant = hold > 0 && !still ? 0 : clamp(g.yaw - anim.yaw, -0.5, 0.5);
    anim.eye += (eyeWant - anim.eye) * (still ? 1 : ease(dt, 14));
    anim.u += (state.head.u - anim.u) * kp;
    anim.v += (state.head.v - anim.v) * kp;
    anim.R += (R.v - anim.R) * (still ? 1 : ease(dt, 7));
    const after = anim.yaw + anim.pitch + anim.u + anim.v + anim.eye + anim.R;
    if (!dirty && Math.abs(after - before) < 1e-5) return;
    dirty = Math.abs(after - before) > 1e-5;
    view.render({ u: anim.u, v: anim.v, R: anim.R, yaw: anim.yaw, pitch: anim.pitch, eye: anim.eye, eyeV: 0 });
    drawOverlay();
  });
  if (reducedMotion.matches) stage.classList.add("ready");
  reducedMotion.addEventListener("change", () => stage.classList.add("ready"));

  // 鼠标在画框里移动：他看向鼠标
  const toFrame = (e) => {
    const r = stage.getBoundingClientRect();
    return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
  };
  const skipIntro = () => {
    if (hold > 0) {
      hold = 0;
      stage.classList.add("ready");
    }
  };
  stage.addEventListener("pointermove", (e) => {
    // 鼠标停在两个把手上时不跟：不然绿点会跑到鼠标底下，把头挡住抓不到
    if (e.pointerType !== "mouse" || dragging || e.target === headBtn || lookBtn.contains(e.target)) return;
    skipIntro();
    state.look = placeLook(toFrame(e));
    update();
  });

  // 两个把手：拖动或方向键
  const handle = (btn, which) => {
    let off = null;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      skipIntro();
      btn.setPointerCapture(e.pointerId);
      btn.focus({ preventScroll: true });
      const p = toFrame(e);
      const cur = state[which];
      off = { u: cur.u - p.u, v: cur.v - p.v };
      dragging = which;
      btn.classList.add("dragging");
    });
    btn.addEventListener("pointermove", (e) => {
      if (!off) return;
      const p = toFrame(e);
      move(which, { u: p.u + off.u, v: p.v + off.v });
    });
    const stop = () => {
      off = null;
      dragging = null;
      btn.classList.remove("dragging");
    };
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointercancel", stop);
    btn.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.06 : 0.02;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (e.key === "Home") {
        e.preventDefault();
        preset("classic");
        return;
      }
      if (!d) return;
      e.preventDefault();
      skipIntro();
      const cur = state[which];
      // 被三分线吸住时一步可能还在吸附圈里，就多走几步
      for (let i = 1; i < 6; i++) {
        const next = { u: cur.u + d[0] * i, v: cur.v + d[1] * i };
        const placed = which === "head" ? placeHead(next, radius(state.shot, A)) : placeLook(next);
        if (!near(placed, cur) || i === 5) {
          move(which, next);
          break;
        }
      }
    });
  };
  const move = (which, p) => {
    state[which] = which === "head" ? placeHead(p, radius(state.shot, A)) : placeLook(p);
    update();
  };
  handle(headBtn, "head");
  handle(lookBtn, "look");

  const preset = (name) => {
    skipIntro();
    const p = PRESETS[name];
    state.head = placeHead(p.head, radius(state.shot, A));
    state.look = placeLook(p.look);
    update();
  };
  for (const b of document.querySelectorAll("[data-preset]")) b.addEventListener("click", () => preset(b.dataset.preset));
  $("shot").addEventListener("change", (e) => {
    skipIntro();
    state.shot = e.target.value;
    state.head = placeHead(state.head, radius(state.shot, A));
    update();
  });

  new ResizeObserver(resize).observe(stage);
  resize();
}
