// 开场：一座黄环雕塑，一个 3:4 的取景框。拖画面平移，滚轮/双指/滑杆缩放，小地图上拖框；
// 读数是真量出来的：主体占画面多少、露出多少、切过几条边、比例尺（人）还在不在。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { EDGE_NAMES, clamp, cropDistance, easeInOut, lerpCrop, makeMask, measure, rectOf } from "./model.js";
import { C, RING, drawRingWorld, paintRingMask } from "./worlds.js";

const ASPECT = 3 / 4;
const H_MIN = 220, H_MAX = RING.H;
export const PRESETS = [
  { id: "wide", crop: { cx: 1250, cy: 940, h: 1700 } },
  { id: "fit", crop: { cx: 1200, cy: 910, h: 1250 } },
  { id: "bleed", crop: { cx: 1200, cy: 900, h: 700 } },
  { id: "poster", crop: { cx: 840, cy: 900, h: 700 } },
  { id: "over", crop: { cx: 905, cy: 870, h: 220 } },
];
const byId = (id) => PRESETS.find((p) => p.id === id);

const $ = (id) => document.getElementById(id);
const pct = (v) => `${Math.round(v * 100)}%`;
const list = (idx) => idx.map((i) => EDGE_NAMES[i]).join("、");

export function clampCrop(c) {
  const h = clamp(c.h, H_MIN, H_MAX), w = h * ASPECT;
  return { cx: clamp(c.cx, w / 2, RING.W - w / 2), cy: clamp(c.cy, h / 2, RING.H - h / 2), h };
}

// 人（比例尺）有多少在框里
function personIn(crop) {
  const r = rectOf(crop, ASPECT), b = RING.personBox;
  const ix = Math.max(0, Math.min(r.x1, b.x1) - Math.max(r.x0, b.x0)), iy = Math.max(0, Math.min(r.y1, b.y1) - Math.max(r.y0, b.y0));
  return (ix * iy) / ((b.x1 - b.x0) * (b.y1 - b.y0));
}

// 这一刀在干什么
export function judge(m, crop) {
  const cutI = m.edges.flatMap((e, i) => (e === "cut" ? [i] : []));
  const nearI = m.edges.flatMap((e, i) => (e === "near" ? [i] : []));
  const scale = personIn(crop) > 0.5;
  if (m.visible > 0.985) {
    if (nearI.length) return { chip: "将贴未贴", kind: "warn", text: `环离${list(nearI)}边只差一线，像被画框夹住，看着别扭。要么退开一点，要么干脆切出去。` };
    if (m.fill < 0.3) return { chip: "远景", kind: "space", text: `环只占画面 ${pct(m.fill)}，四周的蓝比环还多，画面讲的是「环和它周围」。${scale ? "旁边的人告诉你它有两层楼高。" : ""}这是留白的做法。` };
    return { chip: "装下", kind: "ok", text: `整个环都在，四边都还有余地。完整、安静，可冲击力还没出来。${scale ? "" : "人已经出了画，看不出它多大了。"}` };
  }
  if (m.visible < 0.12 || m.fill > 0.94) return { chip: "过头了", kind: "bad", text: `满是满了，只剩一片黄和一点蓝，认不出是环，也看不出多大。填满不是越满越好。` };
  if (nearI.length) return { chip: "犹豫的边", kind: "warn", text: `${list(cutI)}边切得果断，${list(nearI)}边却差一线没碰到，这条边显得犹豫。挪一点，让它要么切过、要么离开。` };
  if (m.visible < 0.55) return { chip: "局部", kind: "good", text: `只露出 ${pct(m.visible)} 的环，剩下几道大弧和色块，形状本身成了主体。黄其实只占画面 ${pct(m.fill)}，可 ${cutI.length} 条边都被它冲破，看着比实际满。海报就是这样裁的。${scale ? "" : "没有参照物，它可以是一枚戒指，也可以是一座楼。"}` };
  return { chip: "冲出画框", kind: "good", text: `切过${list(cutI)} ${cutI.length} 条边。眼睛会在框外把环补完整，画面像装不下它，张力就出来了。` };
}

export function initHero() {
  const view = $("view"), canvas = $("view-canvas"), map = $("map");
  const g = canvas.getContext("2d"), gm = map.getContext("2d");
  const mask = makeMask(RING.W, RING.H, 4, paintRingMask);
  const presetBtns = [...document.querySelectorAll("[data-crop]")];
  const zoom = $("zoom");

  let crop = { ...byId("wide").crop };
  let tween = null;
  let dirty = true;
  let started = false;
  let lastRead = "";

  const hToZoom = (h) => Math.round((1 - Math.log(h / H_MIN) / Math.log(H_MAX / H_MIN)) * 1000);
  const zoomToH = (v) => H_MIN * Math.pow(H_MAX / H_MIN, 1 - v / 1000);

  const set = (c) => {
    crop = clampCrop(c);
    dirty = true;
    stage.draw();
  };
  const go = (to, dur = 0.8) => {
    tween = { from: { ...crop }, to: clampCrop(to), t: 0, dur };
    dirty = true;
    stage.draw();
  };
  const snap = () => {
    let best = null, bd = 0.17;
    for (const p of PRESETS) {
      const d = cropDistance(crop, p.crop);
      if (d < bd) { bd = d; best = p; }
    }
    if (best && bd > 0.004) go(best.crop, 0.35);
  };

  const sizes = () => {
    const pr = pixelRatio();
    for (const c of [canvas, map]) {
      const r = c.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * pr)), h = Math.max(1, Math.round(r.height * pr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    }
    dirty = true;
  };

  const drawView = () => {
    const r = rectOf(crop, ASPECT), s = canvas.height / r.h;
    g.setTransform(s, 0, 0, s, -r.x0 * s, -r.y0 * s);
    drawRingWorld(g);
  };
  const drawMap = () => {
    const s = map.width / RING.W;
    gm.setTransform(s, 0, 0, s, 0, 0);
    drawRingWorld(gm);
    const r = rectOf(crop, ASPECT);
    gm.fillStyle = "rgba(0, 14, 60, 0.6)";
    gm.beginPath();
    gm.rect(0, 0, RING.W, RING.H);
    gm.rect(r.x0, r.y0, r.w, r.h);
    gm.fill("evenodd");
    gm.strokeStyle = C.white;
    gm.lineWidth = 2 / s;
    gm.strokeRect(r.x0, r.y0, r.w, r.h);
  };
  const read = () => {
    const m = measure(mask, crop, ASPECT);
    const j = judge(m, crop);
    const key = `${Math.round(m.fill * 100)}|${Math.round(m.visible * 100)}|${m.edges}|${j.chip}|${j.text}`;
    if (key === lastRead) return;
    lastRead = key;
    $("m-fill").textContent = Math.round(m.fill * 100);
    $("m-vis").textContent = Math.round(m.visible * 100);
    $("m-cut").textContent = m.cut ? `切过 ${m.cut} 条边` : m.near ? "有边差一线" : "没碰边";
    m.edges.forEach((e, i) => ($(`e${i}`).dataset.s = e));
    $("m-scale").textContent = personIn(crop) > 0.5 ? "在画里" : "出画了";
    const chip = $("chip");
    chip.textContent = j.chip;
    chip.dataset.kind = j.kind;
    $("verdict").textContent = j.text;
    $("fillbar").style.transform = `scaleX(${m.fill.toFixed(3)})`;
    for (const b of presetBtns) b.setAttribute("aria-pressed", String(cropDistance(crop, byId(b.dataset.crop).crop) < 0.02));
    if (document.activeElement !== zoom) zoom.value = hToZoom(crop.h);
  };

  const stage = loop(view, (t, dt, { still }) => {
    if (!started) {
      started = true;
      if (still) crop = { ...byId("poster").crop };
      else tween = { from: { ...crop }, to: byId("poster").crop, t: -0.45, dur: 2.6 };
    }
    if (tween) {
      tween.t += still ? 1e9 : dt;
      const k = clamp(tween.t / tween.dur, 0, 1);
      crop = lerpCrop(tween.from, tween.to, easeInOut(k));
      if (k >= 1) tween = null;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    drawView();
    drawMap();
    read();
  });

  new ResizeObserver(() => { sizes(); stage.draw(); }).observe(view);
  sizes();

  // ---- 拖画面：像在相机后面挪 ----
  const pts = new Map();
  let grab = null;
  const startGrab = () => {
    const p = [...pts.values()];
    grab = { crop: { ...crop }, p0: p[0], d0: p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0, n: p.length };
  };
  view.addEventListener("pointerdown", (e) => {
    if (e.target === map || (e.pointerType === "mouse" && e.button !== 0)) return;
    tween = null;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    view.setPointerCapture(e.pointerId);
    view.classList.add("grabbing");
    startGrab();
  });
  view.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId) || !grab) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.values()];
    const k = grab.crop.h / canvas.getBoundingClientRect().height;
    if (p.length > 1 && grab.n > 1) {
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      set({ ...grab.crop, h: grab.crop.h * (grab.d0 / Math.max(10, d)) });
    } else {
      set({ ...grab.crop, cx: grab.crop.cx - (p[0].x - grab.p0.x) * k, cy: grab.crop.cy - (p[0].y - grab.p0.y) * k });
    }
  });
  const release = (e) => {
    if (!pts.delete(e.pointerId)) return;
    if (pts.size) { startGrab(); return; }
    grab = null;
    view.classList.remove("grabbing");
    snap();
  };
  view.addEventListener("pointerup", release);
  view.addEventListener("pointercancel", release);

  // 滚轮：触控板双指捏合（ctrlKey）随时可用；普通滚轮要先点一下画面，免得滚页面时被它吃掉
  let wheelTimer = 0;
  view.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && document.activeElement !== view) return;
    e.preventDefault();
    tween = null;
    const r = canvas.getBoundingClientRect(), rc = rectOf(crop, ASPECT);
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    const wx = rc.x0 + fx * rc.w, wy = rc.y0 + fy * rc.h;
    const h = clamp(crop.h * Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), H_MIN, H_MAX);
    set({ cx: wx - (fx - 0.5) * h * ASPECT, cy: wy - (fy - 0.5) * h, h });
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(snap, 260);
  }, { passive: false });

  view.addEventListener("keydown", (e) => {
    const step = crop.h * 0.05;
    const moves = { ArrowLeft: [-step, 0, 1], ArrowRight: [step, 0, 1], ArrowUp: [0, -step, 1], ArrowDown: [0, step, 1], "+": [0, 0, 1 / 1.12], "=": [0, 0, 1 / 1.12], "-": [0, 0, 1.12], _: [0, 0, 1.12] };
    const mv = moves[e.key];
    if (!mv) return;
    e.preventDefault();
    tween = null;
    set({ cx: crop.cx + mv[0], cy: crop.cy + mv[1], h: crop.h * mv[2] });
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(snap, 500);
  });

  // ---- 小地图：在全景上拖框 ----
  let mapGrab = null;
  const toWorld = (e) => {
    const r = map.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * RING.W, y: ((e.clientY - r.top) / r.height) * RING.H };
  };
  map.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    tween = null;
    const p = toWorld(e), r = rectOf(crop, ASPECT);
    const inside = p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1;
    mapGrab = inside ? { dx: crop.cx - p.x, dy: crop.cy - p.y } : { dx: 0, dy: 0 };
    map.setPointerCapture(e.pointerId);
    set({ ...crop, cx: p.x + mapGrab.dx, cy: p.y + mapGrab.dy });
  });
  map.addEventListener("pointermove", (e) => {
    if (!mapGrab) return;
    const p = toWorld(e);
    set({ ...crop, cx: p.x + mapGrab.dx, cy: p.y + mapGrab.dy });
  });
  const mapUp = () => { if (mapGrab) { mapGrab = null; snap(); } };
  map.addEventListener("pointerup", mapUp);
  map.addEventListener("pointercancel", mapUp);

  for (const b of presetBtns) b.addEventListener("click", () => go(byId(b.dataset.crop).crop, reducedMotion.matches ? 0.001 : 0.8));
  zoom.addEventListener("input", () => { tween = null; set({ ...crop, h: zoomToH(+zoom.value) }); });
  zoom.addEventListener("change", snap);
}
