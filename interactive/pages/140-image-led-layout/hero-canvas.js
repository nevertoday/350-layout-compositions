// 140 图片主导版式 · 开场 2D Canvas 杂志封面裁切与引线排布台（离线精灵缓存 + 脏标记按需重绘）
// 1:1 承袭 140 原海报海青→钴蓝→午夜大气场、明暗质感巨球、右下冰川斜切面、左下朱红圆点与柠檬黄细引线。
import { pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, evaluateLayout } from "./model.js";

function makeGrainTile() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  let seed = 1402026;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = (seed >>> 24) & 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 16;
  }
  g.putImageData(img, 0, 0);
  return c;
}

const GRAIN_TILE = makeGrainTile();
const SPRITE_CACHE = new Map();

// 将每种题材的球体/穹顶/表盘（含外光晕与光学微粒质感）离线烘焙成 400×400 精灵图，每帧仅 1 次 drawImage！
function getSubjectSprite(id) {
  if (SPRITE_CACHE.has(id)) return SPRITE_CACHE.get(id);
  const size = 400;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const cx = size * 0.5;
  const cy = size * 0.5;
  const rr = size * 0.42; // 留出 0.16*size 外光晕安全边

  const halo = g.createRadialGradient(
    cx - rr * 0.42, cy - rr * 0.36, rr * 0.35,
    cx, cy, rr * 1.18
  );
  halo.addColorStop(0, "rgba(77, 161, 235, 0.28)");
  halo.addColorStop(0.7, "rgba(0, 51, 127, 0.14)");
  halo.addColorStop(1, "rgba(0, 25, 89, 0)");
  g.fillStyle = halo;
  g.beginPath();
  g.arc(cx, cy, rr * 1.18, 0, Math.PI * 2);
  g.fill();

  g.save();
  g.beginPath();
  g.arc(cx, cy, rr, 0, Math.PI * 2);
  g.clip();

  if (id === "poster140") {
    const base = g.createRadialGradient(
      cx - rr * 0.72, cy - rr * 0.52, rr * 0.06,
      cx + rr * 0.12, cy + rr * 0.08, rr * 1.38
    );
    base.addColorStop(0.0, "#A8DCFF");
    base.addColorStop(0.16, "#4DA1EB");
    base.addColorStop(0.36, "#0B58BA");
    base.addColorStop(0.56, "#002364");
    base.addColorStop(0.74, "#010A24");
    base.addColorStop(1.0, "#010205");
    g.fillStyle = base;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);

    const rim = g.createRadialGradient(
      cx - rr * 0.86, cy - rr * 0.44, rr * 0.04,
      cx - rr * 0.35, cy - rr * 0.15, rr * 0.92
    );
    rim.addColorStop(0, "rgba(182, 232, 255, 0.56)");
    rim.addColorStop(0.42, "rgba(50, 148, 232, 0.24)");
    rim.addColorStop(1, "rgba(0, 20, 64, 0)");
    g.fillStyle = rim;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  } else if (id === "dome") {
    const base = g.createRadialGradient(
      cx - rr * 0.42, cy - rr * 0.38, rr * 0.08,
      cx + rr * 0.15, cy + rr * 0.12, rr * 1.25
    );
    base.addColorStop(0, "#D4ECFA");
    base.addColorStop(0.22, "#4B97D8");
    base.addColorStop(0.52, "#073578");
    base.addColorStop(0.84, "#020E28");
    base.addColorStop(1, "#01040B");
    g.fillStyle = base;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);

    const ox = cx - rr * 0.22;
    const oy = cy - rr * 0.2;
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2 - 0.5;
      g.strokeStyle = i % 2 === 0 ? "rgba(188, 228, 252, 0.34)" : "rgba(5, 22, 58, 0.55)";
      g.lineWidth = rr * 0.022;
      g.beginPath();
      g.moveTo(ox, oy);
      g.quadraticCurveTo(
        ox + Math.cos(ang + 0.45) * rr * 0.65,
        oy + Math.sin(ang + 0.45) * rr * 0.65,
        ox + Math.cos(ang + 0.15) * rr * 1.35,
        oy + Math.sin(ang + 0.15) * rr * 1.35
      );
      g.stroke();
    }
    for (const frac of [0.16, 0.36, 0.60, 0.84]) {
      g.strokeStyle = frac < 0.4 ? "rgba(218, 240, 255, 0.55)" : "rgba(110, 180, 238, 0.28)";
      g.lineWidth = frac === 0.16 ? rr * 0.03 : rr * 0.014;
      g.beginPath();
      g.arc(ox, oy, rr * frac, 0, Math.PI * 2);
      g.stroke();
    }
    const eye = g.createRadialGradient(ox, oy, 0, ox, oy, rr * 0.17);
    eye.addColorStop(0, "#F4FAFF");
    eye.addColorStop(0.7, "#85C9F7");
    eye.addColorStop(1, "rgba(75, 151, 216, 0)");
    g.fillStyle = eye;
    g.beginPath();
    g.arc(ox, oy, rr * 0.17, 0, Math.PI * 2);
    g.fill();
  } else {
    const bezel = g.createLinearGradient(cx - rr, cy - rr, cx + rr, cy + rr);
    bezel.addColorStop(0, "#9ED4FA");
    bezel.addColorStop(0.28, "#2570BE");
    bezel.addColorStop(0.62, "#041B49");
    bezel.addColorStop(1, "#01040B");
    g.fillStyle = bezel;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);

    const dialR = rr * 0.86;
    const dial = g.createRadialGradient(cx - dialR * 0.45, cy - dialR * 0.45, dialR * 0.05, cx + dialR * 0.1, cy + dialR * 0.1, dialR * 1.18);
    dial.addColorStop(0, "#1D68B8");
    dial.addColorStop(0.38, "#052259");
    dial.addColorStop(0.75, "#020A1E");
    dial.addColorStop(1, "#010308");
    g.fillStyle = dial;
    g.beginPath();
    g.arc(cx, cy, dialR, 0, Math.PI * 2);
    g.fill();

    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const major = i % 5 === 0;
      const rIn = dialR * (major ? 0.80 : 0.88);
      const rOut = dialR * 0.94;
      g.strokeStyle = major ? "rgba(216, 238, 255, 0.82)" : "rgba(130, 186, 235, 0.35)";
      g.lineWidth = major ? rr * 0.016 : 1;
      g.beginPath();
      g.moveTo(cx + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn);
      g.lineTo(cx + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut);
      g.stroke();
    }
    const subX = cx - dialR * 0.24, subY = cy - dialR * 0.14, subR = dialR * 0.28;
    g.strokeStyle = "rgba(248, 240, 38, 0.58)";
    g.lineWidth = rr * 0.012;
    g.beginPath();
    g.arc(subX, subY, subR, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(subX, subY, subR * 0.56, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "#E8F4FF";
    g.lineWidth = rr * 0.022;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx - dialR * 0.56, cy - dialR * 0.36);
    g.stroke();
    g.strokeStyle = "#F8F026";
    g.lineWidth = rr * 0.01;
    g.beginPath();
    g.moveTo(cx + dialR * 0.14, cy + dialR * 0.14);
    g.lineTo(cx - dialR * 0.36, cy - dialR * 0.64);
    g.stroke();
    g.fillStyle = "#E22F16";
    g.beginPath();
    g.arc(cx, cy, rr * 0.036, 0, Math.PI * 2);
    g.fill();
  }

  const pat = g.createPattern(GRAIN_TILE, "repeat");
  if (pat) {
    g.fillStyle = pat;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  g.restore();

  const out = { canvas: c, radiusRatio: 0.42 };
  SPRITE_CACHE.set(id, out);
  return out;
}

export function createHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let dpr = 1;
  let width = 800;
  let height = 600;
  let bgCache = null;
  let bgW = 0, bgH = 0;
  let intro = 0;
  let dirty = true;
  let lastGeo = null;
  let hoverTarget = null;
  let drag = null;

  function touch() {
    dirty = true;
  }

  function markDirty(immediate = false) {
    dirty = true;
    if (immediate || reducedMotion.matches) onChange();
  }

  function ensureBackdrop(w, h) {
    if (bgCache && bgW === w && bgH === h) return bgCache;
    bgW = w;
    bgH = h;
    bgCache = document.createElement("canvas");
    bgCache.width = w;
    bgCache.height = h;
    const g = bgCache.getContext("2d", { alpha: false });
    const bg = g.createLinearGradient(0, 0, w * 0.85, h);
    bg.addColorStop(0.0, "#0C9C9B");
    bg.addColorStop(0.28, "#007BA6");
    bg.addColorStop(0.62, "#00337F");
    bg.addColorStop(1.0, "#001447");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const glow = g.createRadialGradient(w * 0.08, h * 0.14, 10, w * 0.15, h * 0.2, w * 0.65);
    glow.addColorStop(0, "rgba(26, 206, 198, 0.42)");
    glow.addColorStop(0.55, "rgba(0, 132, 168, 0.12)");
    glow.addColorStop(1, "rgba(0, 25, 89, 0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    return bgCache;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    // 手机上按 GUIDE 限制像素比（1.25），保证软渲染下仍有充裕帧率；桌面保持 2× 锐利
    const nextDpr = window.innerWidth <= 680 ? pixelRatio(1.25) : pixelRatio(2);
    const nextW = Math.round(rect.width);
    const nextH = Math.round(rect.height);
    const pw = Math.round(nextW * nextDpr);
    const ph = Math.round(nextH * nextDpr);
    if (nextW !== width || nextH !== height || nextDpr !== dpr || canvas.width !== pw || canvas.height !== ph) {
      dpr = nextDpr;
      width = nextW;
      height = nextH;
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
      return true;
    }
    return false;
  }

  function drawDiagonalIcePlane(g, geo) {
    const { w, h, cutLine } = geo;
    if (state.cutDepth <= 0.005) return;

    g.save();
    g.beginPath();
    g.moveTo(cutLine.p1.x, cutLine.p1.y);
    g.lineTo(cutLine.p2.x, cutLine.p2.y);
    if (cutLine.p2.y <= 1) g.lineTo(w, 0);
    g.lineTo(w, h);
    if (cutLine.p1.x <= 1) g.lineTo(0, h);
    g.closePath();

    const grad = g.createLinearGradient(cutLine.p1.x, cutLine.p1.y, w, h);
    grad.addColorStop(0.0, "#DCE8F2");
    grad.addColorStop(0.36, "#B8D3E8");
    grad.addColorStop(0.72, "#4D9BE0");
    grad.addColorStop(1.0, "#0970C6");
    g.fillStyle = grad;
    g.fill();

    g.strokeStyle = state.activeDim === "cropping" ? "#F8F026" : "rgba(255, 255, 255, 0.72)";
    g.lineWidth = state.activeDim === "cropping" ? 2.4 : 1.1;
    g.beginPath();
    g.moveTo(cutLine.p1.x, cutLine.p1.y);
    g.lineTo(cutLine.p2.x, cutLine.p2.y);
    g.stroke();

    if (state.showGuides) {
      const mx = cutLine.mid.x, my = cutLine.mid.y;
      const isHot = hoverTarget === "cut" || (drag && drag.kind === "cut");
      g.fillStyle = isHot ? "#F8F026" : "#041536";
      g.strokeStyle = "#F8F026";
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(mx, my, isHot ? 11 : 9, 0, Math.PI * 2);
      g.fill();
      g.stroke();

      g.strokeStyle = isHot ? "#041536" : "#F8F026";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(mx - 4, my - 4);
      g.lineTo(mx + 4, my + 4);
      g.moveTo(mx - 4, my - 4);
      g.lineTo(mx - 4, my - 0.5);
      g.moveTo(mx - 4, my - 4);
      g.lineTo(mx - 0.5, my - 4);
      g.moveTo(mx + 4, my + 4);
      g.lineTo(mx + 4, my + 0.5);
      g.moveTo(mx + 4, my + 4);
      g.lineTo(mx + 0.5, my + 4);
      g.stroke();
    }
    g.restore();
  }

  function drawEditorialLayer(g, geo, reveal) {
    const { w, h, sub, masthead, c0Box, boxes, leaders, crossings, verm, dims } = geo;
    const compact = w < 460;
    const cs = state.copyScale;

    // 1. 左下朱红圆点
    g.save();
    const hotVerm = hoverTarget === "vermilion" || (drag && drag.kind === "vermilion");
    if (hotVerm) {
      g.strokeStyle = "#F8F026";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(verm.x, verm.y, verm.r + 5, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = "#E22F16";
    g.beginPath();
    g.arc(verm.x, verm.y, verm.r, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // 2. 四条柠檬黄注释引线与实景锚点
    const crossedIds = new Set();
    for (const cr of crossings) {
      crossedIds.add(cr.a);
      crossedIds.add(cr.b);
    }

    for (const ld of leaders) {
      const isBad = crossedIds.has(ld.id);
      const isHi = state.activeDim === "annotation"
        || (ld.id === "c1" && state.activeDim === "priority")
        || (ld.id === "c3" && state.activeDim === "cropping")
        || (ld.id === "c0" && state.activeDim === "center");
      g.save();
      g.strokeStyle = isBad ? "#FF6F59" : "#F8F026";
      g.lineWidth = isHi ? 2.4 : isBad ? 2.0 : 1.5;
      if (ld.dashed) g.setLineDash([5, 4]);
      const tx = ld.from.x + (ld.to.x - ld.from.x) * reveal;
      const ty = ld.from.y + (ld.to.y - ld.from.y) * reveal;
      g.beginPath();
      g.moveTo(ld.from.x, ld.from.y);
      g.lineTo(tx, ty);
      g.stroke();
      g.setLineDash([]);

      g.fillStyle = isBad ? "#FF6F59" : "#F8F026";
      g.beginPath();
      g.arc(tx, ty, isHi ? 5 : 4, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    for (const cr of crossings) {
      g.save();
      g.fillStyle = "#C92410";
      g.strokeStyle = "#FFFFFF";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cr.x, cr.y, 10, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.strokeStyle = "#FFFFFF";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cr.x - 4, cr.y - 4);
      g.lineTo(cr.x + 4, cr.y + 4);
      g.moveTo(cr.x + 4, cr.y - 4);
      g.lineTo(cr.x - 4, cr.y + 4);
      g.stroke();
      g.restore();
    }

    // 3. 左上角刊头
    g.save();
    const titlePx = clamp(Math.round(w * 0.056 * (0.88 + 0.12 * cs)), 19, 44);
    const subPx = clamp(Math.round(titlePx * 0.34), 10, 14);
    g.fillStyle = "#FFFFFF";
    g.font = `900 ${titlePx}px "Noto Sans SC", sans-serif`;
    g.textBaseline = "top";
    g.fillText(sub.titleZh, masthead.x, masthead.y);
    g.fillStyle = "rgba(222, 245, 250, 0.92)";
    g.font = `600 ${subPx}px "Unbounded", "Noto Sans SC", sans-serif`;
    g.fillText(sub.titleEn, masthead.x + 1, masthead.y + titlePx * 1.15);
    g.restore();

    // 4. 右上视觉中心
    g.save();
    const c0TitlePx = clamp(Math.round(w * 0.021), 11, 16);
    const c0EnPx = clamp(Math.round(w * 0.013), 10, 11);
    g.fillStyle = "#FFFFFF";
    g.font = `700 ${c0TitlePx}px "Noto Sans SC", sans-serif`;
    g.textBaseline = "top";
    g.fillText(sub.c0.zh, c0Box.x, c0Box.y);
    g.fillStyle = "rgba(218, 238, 255, 0.88)";
    g.font = `500 ${c0EnPx}px "DM Mono", monospace`;
    g.fillText(sub.c0.en, c0Box.x, c0Box.y + c0TitlePx * 1.28);
    g.restore();

    // 5. 三枚可拖注释卡
    const calloutDefs = [
      { id: "c1", data: sub.c1 },
      { id: "c2", data: sub.c2 },
      { id: "c3", data: sub.c3 },
    ];
    for (const item of calloutDefs) {
      const b = boxes[item.id];
      const isHot = hoverTarget === item.id || (drag && drag.kind === item.id);
      const centerU = b.cx / w, centerV = b.cy / h;
      const onBrightIce = (centerU + centerV) >= geo.cutLine.thresh && (centerU + centerV) < geo.cutLine.thresh + 0.42;
      const dSub = Math.hypot(b.cx - geo.cx, b.cy - geo.cy);
      const overlapsSubject = dSub < geo.r * 0.92 && (centerU + centerV) < geo.cutLine.thresh;
      const isCrossed = crossedIds.has(item.id);
      const warn = overlapsSubject || isCrossed || (!dims.center.ok && dims.center.code === "bloat");

      g.save();
      if (warn || isHot || state.copyScale > 1.08) {
        g.fillStyle = warn
          ? "rgba(180, 32, 16, 0.24)"
          : isHot
            ? "rgba(4, 21, 54, 0.52)"
            : "rgba(4, 21, 54, 0.28)";
        g.fillRect(b.x, b.y, b.w, b.h);
        g.strokeStyle = warn ? "#FF6F59" : "#F8F026";
        g.lineWidth = isHot ? 1.8 : 1.1;
        g.setLineDash(warn ? [4, 3] : []);
        g.strokeRect(b.x, b.y, b.w, b.h);
        g.setLineDash([]);
      } else if (state.showGuides) {
        g.strokeStyle = onBrightIce ? "rgba(4, 21, 54, 0.35)" : "rgba(248, 240, 38, 0.35)";
        g.lineWidth = 1;
        const m = 6;
        g.beginPath();
        g.moveTo(b.x, b.y + m); g.lineTo(b.x, b.y); g.lineTo(b.x + m, b.y);
        g.moveTo(b.x + b.w - m, b.y + b.h); g.lineTo(b.x + b.w, b.y + b.h); g.lineTo(b.x + b.w, b.y + b.h - m);
        g.stroke();
      }

      const padX = Math.max(6, b.w * 0.06);
      const padY = Math.max(5, b.h * 0.08);
      const hSize = clamp(Math.round((compact ? 11.5 : 14) * (0.85 + 0.15 * cs)), 11, 20);
      const eSize = clamp(Math.round(hSize * 0.66), 10, 12);
      const bSize = clamp(Math.round(hSize * 0.78), 10, 15);
      const textMain = onBrightIce && !warn ? "#041536" : "#FFFFFF";
      const textSub = onBrightIce && !warn ? "#173A6B" : "rgba(218, 240, 252, 0.88)";

      g.textBaseline = "top";
      g.fillStyle = textMain;
      g.font = `700 ${hSize}px "Noto Sans SC", sans-serif`;
      g.fillText(item.data.zh, b.x + padX, b.y + padY, b.w - padX * 2);

      g.fillStyle = textSub;
      g.font = `500 ${eSize}px "DM Mono", monospace`;
      g.fillText(item.data.en, b.x + padX, b.y + padY + hSize * 1.18, b.w - padX * 2);

      const barY = b.y + padY + hSize * 1.18 + eSize * 1.32;
      g.fillStyle = onBrightIce && !warn ? "#00449E" : "#F8F026";
      g.fillRect(b.x + padX, barY, Math.min(26, b.w * 0.22), 2);

      g.fillStyle = textMain;
      g.font = `400 ${bSize}px "Noto Sans SC", sans-serif`;
      g.fillText(item.data.body, b.x + padX, barY + 6, b.w - padX * 2);

      if (overlapsSubject) {
        const tagText = "× 盖住主图";
        g.font = `700 11px "Noto Sans SC", sans-serif`;
        const tw = g.measureText(tagText).width + 12;
        g.fillStyle = "#C92410";
        g.fillRect(b.x, Math.max(4, b.y - 20), tw, 18);
        g.fillStyle = "#FFFFFF";
        g.fillText(tagText, b.x + 6, Math.max(7, b.y - 17));
      }
      g.restore();
    }
  }

  function drawGlanceOverlay(g, geo) {
    if (state.glanceRemaining <= 0) return;
    const progress = 1 - state.glanceRemaining / state.glanceDuration;
    const { w, h, cx, cy, r, verm, boxes, dims } = geo;

    g.save();
    if (progress < 0.22) {
      const flashAlpha = Math.sin((progress / 0.22) * Math.PI) * 0.45;
      g.fillStyle = `rgba(2, 11, 36, ${flashAlpha.toFixed(3)})`;
      g.fillRect(0, 0, w, h);
    }

    const pts = dims.priority.ok && dims.center.ok
      ? [
          { x: cx - r * 0.34, y: cy - r * 0.24, label: "1 视觉中心" },
          { x: verm.x, y: verm.y, label: "2 朱红配重" },
          { x: boxes.c1.cx, y: boxes.c1.cy, label: "3 引线注记" },
          { x: boxes.c3.cx, y: boxes.c3.cy, label: "4 裁切说明" },
        ]
      : [
          { x: boxes.c1.cx, y: boxes.c1.cy, label: "1 被文字截胡" },
          { x: boxes.c3.cx, y: boxes.c3.cy, label: "2 视线撞车" },
          { x: cx, y: cy, label: "3 迟到主图" },
        ];

    const col = geo.passCount === 4 ? "#F8F026" : "#FF6F59";
    const segs = pts.length - 1;
    const activeProg = clamp((progress - 0.08) / 0.78, 0, 1);
    const totalF = activeProg * segs;

    g.strokeStyle = col;
    g.lineWidth = 2.4;
    g.setLineDash([6, 4]);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < segs; i++) {
      const f = clamp(totalF - i, 0, 1);
      if (f <= 0) break;
      g.lineTo(
        pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        pts[i].y + (pts[i + 1].y - pts[i].y) * f
      );
    }
    g.stroke();
    g.setLineDash([]);

    for (let i = 0; i < pts.length; i++) {
      if (totalF + 0.15 < i) continue;
      const p = pts[i];
      g.fillStyle = col;
      g.beginPath();
      g.arc(p.x, p.y, 12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#041536";
      g.font = `700 11px "DM Mono", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(i + 1), p.x, p.y);
      g.textAlign = "left";
      g.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = g.measureText(p.label).width + 12;
      const lx = clamp(p.x + 15, 8, w - tw - 8);
      const ly = clamp(p.y - 10, 8, h - 24);
      g.fillStyle = "rgba(4, 21, 54, 0.90)";
      g.fillRect(lx, ly, tw, 20);
      g.strokeStyle = col;
      g.lineWidth = 1;
      g.strokeRect(lx, ly, tw, 20);
      g.fillStyle = "#FFFFFF";
      g.fillText(p.label, lx + 6, ly + 10);
    }
    g.restore();
  }

  function render(t, dt, { still }) {
    resize();
    const animating = (!still && intro < 1) || (!still && state.glanceRemaining > 0);
    if (!dirty && !animating && !still) {
      return null; // 静置且无变化时不空耗重绘
    }

    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.0);
    }
    if (state.glanceRemaining > 0 && !still) {
      state.glanceRemaining = Math.max(0, state.glanceRemaining - Math.max(dt, 0.016));
    }
    dirty = false;

    const reveal = 1 - Math.pow(1 - intro, 3);
    const geo = evaluateLayout(state, width, height);
    lastGeo = geo;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 离线海青→钴蓝→午夜大气底图（单次 drawImage）
    ctx.drawImage(ensureBackdrop(width, height), 0, 0, width, height);

    // 2. 离线烘焙主图精灵（单次 drawImage，含外光晕与质感微粒；radiusRatio = rr / size，故 drawHalf = rr / (2 * radiusRatio)）
    const sprite = getSubjectSprite(geo.sub.id);
    const rr = geo.r * (0.94 + 0.06 * reveal);
    const drawHalf = rr / (sprite.radiusRatio * 2);
    ctx.drawImage(sprite.canvas, geo.cx - drawHalf, geo.cy - drawHalf, drawHalf * 2, drawHalf * 2);

    if (!geo.dims.cropping.ok && geo.dims.cropping.code === "timid") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 111, 89, 0.65)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.25;
      const pad = Math.max(10, rr * 0.12);
      ctx.strokeRect(geo.cx - rr - pad, geo.cy - rr - pad, (rr + pad) * 2, (rr + pad) * 2);
      ctx.restore();
    }

    // 3. 右下冰川斜切面
    drawDiagonalIcePlane(ctx, geo);

    // 4. 朱红圆点 + 柠檬黄引线 + 刊头与三枚可拖注释卡
    drawEditorialLayer(ctx, geo, reveal);

    // 5. 13ms 瞬闪眼动覆盖层
    drawGlanceOverlay(ctx, geo);

    ctx.restore();
    return geo;
  }

  function hitTest(px, py) {
    if (!lastGeo) return "canvas";
    const { boxes, verm, cutLine } = lastGeo;
    for (const id of ["c1", "c2", "c3"]) {
      const b = boxes[id];
      if (px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 6 && py <= b.y + b.h + 6) return id;
    }
    if (Math.hypot(px - verm.x, py - verm.y) <= verm.r + 14) return "vermilion";
    if (Math.hypot(px - cutLine.mid.x, py - cutLine.mid.y) <= 22) return "cut";
    const dCut = Math.abs((px / width + py / height) - cutLine.thresh);
    if (dCut < 0.045 && state.cutDepth > 0.04) return "cut";
    return "canvas";
  }

  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function startDrag(clientX, clientY, pointerId, isTouch) {
    const { x, y } = localPos(clientX, clientY);
    const kind = hitTest(x, y);
    drag = {
      kind,
      pointerId,
      isTouch,
      startX: x,
      startY: y,
      startScale: state.scale,
      startCut: state.cutDepth,
      startCallout: kind.startsWith("c") && state.callouts[kind] ? { ...state.callouts[kind] } : null,
      startVerm: { ...state.vermilion },
      locked: kind !== "canvas" || !isTouch,
    };
  }

  function moveDrag(clientX, clientY) {
    const { x, y } = localPos(clientX, clientY);
    if (!drag) {
      const h = hitTest(x, y);
      if (h !== hoverTarget) {
        hoverTarget = h;
        canvas.style.cursor = h === "canvas" ? "ew-resize" : h === "cut" ? "nwse-resize" : "grab";
        markDirty(false);
      }
      return false;
    }
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.locked) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return false;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        drag = null;
        return false;
      }
      drag.locked = true;
    }

    if (drag.kind === "canvas") {
      const nextScale = clamp(drag.startScale + (dx / Math.max(220, width * 0.65)) * 1.15, 0.40, 1.82);
      state.scale = Math.round(nextScale * 100) / 100;
      const tRight = clamp((state.scale - 0.66) / 0.62, 0, 1);
      state.cx = Math.round((0.52 + tRight * 0.12) * 1000) / 1000;
    } else if (drag.kind === "cut") {
      const delta = -(dx / width + dy / height) * 0.55;
      state.cutDepth = Math.round(clamp(drag.startCut + delta, 0.02, 0.60) * 100) / 100;
    } else if (drag.kind === "vermilion") {
      state.vermilion.u = clamp(drag.startVerm.u + dx / width, 0.08, 0.92);
      state.vermilion.v = clamp(drag.startVerm.v + dy / height, 0.16, 0.92);
    } else if (drag.startCallout && state.callouts[drag.kind]) {
      state.callouts[drag.kind].u = clamp(drag.startCallout.u + dx / width, 0.08, 0.92);
      state.callouts[drag.kind].v = clamp(drag.startCallout.v + dy / height, 0.18, 0.90);
    }
    markDirty(false); // 交给当前 RAF 帧合并绘制，避免单帧双绘拖慢软渲染
    return true;
  }

  function endDrag() {
    if (drag) {
      drag = null;
      markDirty(false);
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    startDrag(e.clientX, e.clientY, e.pointerId, false);
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    moveDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    endDrag();
    canvas.style.cursor = "ew-resize";
  });
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    startDrag(t0.clientX, t0.clientY, t0.identifier, true);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!drag || !e.touches.length) return;
    const t0 = e.touches[0];
    const moved = moveDrag(t0.clientX, t0.clientY);
    if (moved && drag && drag.locked) e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", endDrag, { passive: true });
  canvas.addEventListener("touchcancel", endDrag, { passive: true });

  window.addEventListener("resize", () => markDirty(false));

  return {
    render,
    touch,
    markDirty,
    getGeo: () => lastGeo || evaluateLayout(state, width, height),
  };
}
