import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  DRILL_OPTIONS,
  createHeroState,
  clamp,
  buildCircleGeometry,
  buildTriangleGeometry,
  buildSquareGeometry,
  evaluateHero,
  evaluateCornerPuzzle,
  codeLabel,
} from "./model.js";

const COLORS = {
  paper: "#FEFAF4",
  sand: "#EFE8DC",
  darkroom: "#0D2C20",
  darkroomSub: "#143B2C",
  ink: "#0A0A0A",
  inkMuted: "#5E574C",
  orange: "#E45004",
  orangeDark: "#B53B00",
  green: "#105838",
  greenBright: "#6CE4B2",
  pink: "#EC70A0",
  pinkDark: "#A22658",
  taupe: "#BCB098",
  taupeBright: "#E2D7C3",
  err: "#C0261C",
  errDark: "#FF8C82",
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ============================================================
// 0. 开场主角：双层残笔显影台（单真源 2D Canvas + 直拖 + 直点修错）
// ============================================================

const heroState = createHeroState();
const heroCanvas = $("#hero-canvas");
const heroCtx = heroCanvas.getContext("2d");
let heroHitTargets = [];
let heroUiDirty = false;
let lastHeroSyncKey = "";
let lastDragDomMs = 0;
let heroSize = { w: 0, h: 0 };

function measureHeroCanvas() {
  const r = heroCanvas.getBoundingClientRect();
  if (r.width >= 20 && r.height >= 20) {
    heroSize = { w: r.width, h: r.height };
  }
}
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(measureHeroCanvas).observe(heroCanvas);
}

function getActiveGap() {
  if (heroState.focus === "circle") return heroState.circle.gap;
  if (heroState.focus === "triangle") return heroState.triangle.gap;
  if (heroState.focus === "square") return heroState.square.gap;
  return (heroState.circle.gap + heroState.triangle.gap + heroState.square.gap) / 3;
}

function setActiveGap(nextGap) {
  const g = clamp(nextGap, 0, 0.8);
  if (heroState.focus === "circle") {
    heroState.circle.gap = g;
  } else if (heroState.focus === "triangle") {
    heroState.triangle.gap = g;
  } else if (heroState.focus === "square") {
    heroState.square.gap = g;
  } else {
    heroState.circle.gap = g;
    heroState.triangle.gap = g;
    heroState.square.gap = g;
  }
}

function updateTitleEmblem(ev) {
  const cGap = ev.shapes.circle.gapRatio;
  const tGap = ev.shapes.triangle.gapRatio;
  const sGap = ev.shapes.square.gapRatio;
  const c = buildCircleGeometry({ gap: cGap, drift: 0 }, 21, 21, 14);
  const cPaths = c.arcs
    .map((a) => {
      const x1 = a.cx + Math.cos(a.start) * a.r;
      const y1 = a.cy + Math.sin(a.start) * a.r;
      const x2 = a.cx + Math.cos(a.end) * a.r;
      const y2 = a.cy + Math.sin(a.end) * a.r;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${a.r} ${a.r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${COLORS.orange}" stroke-width="3.6"/>`;
    })
    .join("");
  $("#emblem-circle").innerHTML = cPaths;

  const t = buildTriangleGeometry({ gap: tGap, tilt: 0 }, 66, 22, 15);
  const tPaths = t.edges
    .map(
      (e) =>
        `<line x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}" x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}" stroke="${COLORS.green}" stroke-width="3.6"/>`
    )
    .join("");
  $("#emblem-triangle").innerHTML = tPaths;

  const sq = buildSquareGeometry({ gap: sGap, cutMode: heroState.square.cutMode }, 111, 21, 13);
  const sPaths = sq.paths
    .map((pts) => {
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      return `<path d="${d}" fill="none" stroke="${COLORS.pink}" stroke-width="3.6"/>`;
    })
    .join("");
  $("#emblem-square").innerHTML = sPaths;
}

function syncHeroUI(force = false) {
  const key = [
    heroState.focus,
    Math.round(heroState.circle.gap * 100),
    Math.round(heroState.circle.drift * 100),
    Math.round(heroState.triangle.gap * 100),
    Math.round(heroState.triangle.tilt),
    Math.round(heroState.square.gap * 100),
    heroState.square.cutMode,
  ].join("|");
  if (!force && key === lastHeroSyncKey) return;
  lastHeroSyncKey = key;

  const ev = evaluateHero(heroState);
  const activeGapPct = Math.round(getActiveGap() * 100);

  // 顶栏实况胶囊
  const pill = $("#hero-top-pill");
  pill.dataset.tone = ev.tone;
  pill.textContent = ev.passed === 3 ? "3 / 3 闭合成立" : `${ev.passed} / 3 崩散待修`;

  // 滑杆与读数
  $("#gap-slider").value = String(activeGapPct);
  $("#gap-readout").textContent = `${activeGapPct}%`;

  const focusNames = { all: "联调：三形同步", circle: "单调：橘色断圆", triangle: "单调：松绿断三角", square: "单调：蔷薇粉断方" };
  $("#hero-focus-label").textContent = focusNames[heroState.focus];

  // 右翼原海报斜箭注栏实时联动
  $("#note-physical-text").textContent = ev.physicalNote;
  $("#note-mental-text").textContent = ev.mentalNote;

  // 单真源诊单卡
  const card = $("#verdict-card");
  card.dataset.tone = ev.tone;
  $("#verdict-icon").textContent = ev.passed === 3 ? "✓" : "!";
  $("#verdict-tag").textContent = ev.statusTag;
  $("#verdict-headline").textContent = ev.headline;
  $("#verdict-reason").textContent = ev.reason;
  $("#verdict-hint").textContent = ev.hint;

  $("#m-gap").textContent = `${Math.round(ev.avgGap * 100)}%`;
  $("#m-corner").textContent = `${ev.avgCorner}%`;
  $("#m-align").textContent = `${ev.maxAlignErr}°`;
  $("#m-pass").textContent = `${ev.passed} / 3`;

  // 四关键词实时检核章
  for (const [key, item] of Object.entries(ev.pillars)) {
    const el = $(`#pillar-${key}`);
    el.dataset.ok = String(item.ok);
    $(`#pillar-${key}-val`).textContent = item.badge;
  }

  // 快捷修错按钮状态同步
  const btnDrift = $("#btn-fix-drift");
  const isDrifted = heroState.circle.drift > 0.01;
  btnDrift.textContent = isDrifted ? `橘弧偏心 ${Math.round(heroState.circle.drift * 100)}% · 归圆` : "橘弧已归圆 ✓";
  btnDrift.classList.toggle("is-fixed", !isDrifted);

  const btnTilt = $("#btn-fix-tilt");
  const isTilted = Math.abs(heroState.triangle.tilt) > 1;
  btnTilt.textContent = isTilted ? `三角歪 ${Math.abs(heroState.triangle.tilt)}° · 对顶` : "三角已对顶 ✓";
  btnTilt.classList.toggle("is-fixed", !isTilted);

  const btnSq = $("#btn-flip-square");
  const sqLabels = { corners: "方框：切掉四角 → 改切直边", oneSide: "方框：单侧豁口 → 改切直边", sides: "方框：留四角 ✓" };
  btnSq.textContent = sqLabels[heroState.square.cutMode];
  btnSq.classList.toggle("is-fixed", heroState.square.cutMode === "sides");

  if (!dragInfo || !dragInfo.moved) updateTitleEmblem(ev);
}

// 绘制单枚圆角文字标签（画布内辅助标注）
function drawPillLabel(ctx, cx, cy, text, bg, fg, border = null, compact = false) {
  ctx.save();
  ctx.font = compact ? '700 10.5px "Noto Sans SC", sans-serif' : '700 11.5px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(text).width;
  const pw = tw + (compact ? 11 : 14);
  const ph = compact ? 20 : 22;
  const x = cx - pw / 2;
  const y = cy - ph / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, ph / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
  return { x, y, w: pw, h: ph };
}

function drawHeroFrame(t, _dt, { still }) {
  if (heroUiDirty) {
    const now = performance.now();
    if (!dragInfo || !dragInfo.moved || now - lastDragDomMs >= 140) {
      heroUiDirty = false;
      lastDragDomMs = now;
      syncHeroUI();
    }
  }
  if (heroSize.w < 20 || heroSize.h < 20) measureHeroCanvas();
  const w = heroSize.w;
  const h = heroSize.h;
  if (w < 20 || h < 20) return;
  const dpr = pixelRatio(w <= 640 ? 1.5 : 2);
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
  }
  const ctx = heroCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  const compact = w < 460;
  const splitTop = h * 0.52;
  const splitBot = h * 0.63;
  const upperCy = splitTop * 0.49;
  const lowerCy = splitBot + (h - splitBot) * 0.52;
  const xs = [w * 0.185, w * 0.5, w * 0.815];
  const R = Math.min(w * 0.114, splitTop * 0.325);
  const Rlow = Math.min(w * 0.092, (h - splitBot) * 0.295);
  const strokeW = Math.max(5.5, R * 0.175);
  const intro = still ? 1 : clamp(0.45 + (t / 0.55) * 0.55, 0.45, 1);
  const pulse = still ? 0 : Math.sin(t * 3.4) * 0.5 + 0.5;
  const dashFlow = still ? 0 : -(t * 22) % 14;

  // 1. 上舱：暖象牙原纸（物理实墨）
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, splitTop);

  // 2. 中带：暖砂三虚箭分界带
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(0, splitTop, w, splitBot - splitTop);
  ctx.strokeStyle = "#D4C9B5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, splitTop);
  ctx.lineTo(w, splitTop);
  ctx.moveTo(0, splitBot);
  ctx.lineTo(w, splitBot);
  ctx.stroke();

  // 3. 下舱：深松墨暗房（大脑隐形补全显影室）
  ctx.fillStyle = COLORS.darkroom;
  ctx.fillRect(0, splitBot, w, h - splitBot);

  // 舱室角标
  ctx.font = compact ? '700 10.5px "Space Grotesk", "Noto Sans SC", sans-serif' : '700 11px "Space Grotesk", "Noto Sans SC", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.inkMuted;
  ctx.fillText("物理纸面 · PHYSICAL INK", 12, 8);
  ctx.fillStyle = COLORS.taupeBright;
  ctx.fillText("大脑补全显影 · MENTAL CLOSURE", 12, splitBot + 7);

  // 高亮当前单调选中栏
  if (heroState.focus !== "all") {
    const idx = heroState.focus === "circle" ? 0 : heroState.focus === "triangle" ? 1 : 2;
    const colW = w * 0.30;
    ctx.fillStyle = "rgba(228, 80, 4, 0.05)";
    ctx.fillRect(xs[idx] - colW / 2, 0, colW, splitTop);
    ctx.fillStyle = "rgba(108, 228, 178, 0.06)";
    ctx.fillRect(xs[idx] - colW / 2, splitBot, colW, h - splitBot);
  }

  // 构建三形几何（与 model.js 同一套坐标）
  const cGeo = buildCircleGeometry(heroState.circle, xs[0], upperCy, R);
  const tGeo = buildTriangleGeometry(heroState.triangle, xs[1], upperCy, R);
  const sGeo = buildSquareGeometry(heroState.square, xs[2], upperCy, R * 0.88);
  const geos = [cGeo, tGeo, sGeo];

  heroHitTargets = [];

  // 绘制三道原海报竖向虚线箭头 ↓ ↓ ↓（停在下舱顶边不挡标题字）
  for (let i = 0; i < 3; i++) {
    const g = geos[i];
    const ax = xs[i];
    const ay0 = splitTop - 4;
    const ay1 = splitBot + 3;
    ctx.save();
    ctx.strokeStyle = g.ok ? COLORS.green : COLORS.err;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = dashFlow;
    ctx.beginPath();
    ctx.moveTo(ax, ay0);
    ctx.lineTo(ax, ay1 - 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = g.ok ? COLORS.green : COLORS.err;
    ctx.beginPath();
    ctx.moveTo(ax, ay1);
    ctx.lineTo(ax - 4.5, ay1 - 6.5);
    ctx.lineTo(ax + 4.5, ay1 - 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 中带中央提示当前缺口
  const avgGapPct = Math.round(getActiveGap() * 100);
  drawPillLabel(
    ctx,
    w * 0.5,
    (splitTop + splitBot) / 2,
    `↔ 横拖削笔 · 缺口 ${avgGapPct}%`,
    COLORS.ink,
    COLORS.paper,
    null,
    compact
  );

  // ---------- 绘制上舱：三种题材共用同一套闭合几何 ----------
  // 1) 橘色圆 / 负空间熊猫徽 / UI 进度环
  ctx.save();
  if (heroState.motif === "emblem") {
    // 极简负空间熊猫几何构成（仅黑块耳朵与斑块，无五官面具感）
    const er = R * 0.28;
    const driftShift = cGeo.driftRatio * R;
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(xs[0] - R * 0.62, upperCy - R * 0.68, er, 0, Math.PI * 2);
    ctx.arc(xs[0] + R * 0.62 + driftShift * 0.8, upperCy - R * 0.68 - driftShift * 0.5, er, 0, Math.PI * 2);
    ctx.fill();
    // 简约肩部黑带
    ctx.beginPath();
    ctx.arc(xs[0], upperCy + R * 0.12, R * 0.72, Math.PI * 0.18, Math.PI * 0.82);
    ctx.lineWidth = strokeW * 0.9;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
  } else if (heroState.motif === "ui") {
    ctx.fillStyle = COLORS.sand;
    ctx.beginPath();
    ctx.arc(xs[0], upperCy, R * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 ${Math.max(12, R * 0.34)}px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(cGeo.inkRatio * 100)}%`, xs[0], upperCy);
  }

  // 画橘圆四弧
  ctx.lineWidth = strokeW;
  ctx.lineCap = "butt";
  for (const arc of cGeo.arcs) {
    const span = (arc.end - arc.start) * intro;
    const mid = (arc.start + arc.end) / 2;
    ctx.strokeStyle = arc.drifted ? COLORS.err : heroState.motif === "emblem" ? COLORS.ink : COLORS.orange;
    ctx.beginPath();
    ctx.arc(arc.cx, arc.cy, arc.r, mid - span / 2, mid + span / 2);
    ctx.stroke();
    if (arc.drifted) {
      // 原位虚环对比
      ctx.save();
      ctx.strokeStyle = "rgba(192,38,28,0.45)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(xs[0], upperCy, R, arc.start, arc.end);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();

  // 2) 松绿三角 / 条纹字母 A / 警示三角图标
  ctx.save();
  if (heroState.motif === "emblem") {
    // 借鉴 Paul Rand 条纹原理的横条纹几何三角 A（缺口控制白缝宽度，倾斜控制错切）
    const bars = 7;
    const topY = upperCy - R * 0.96;
    const botY = upperCy + R * 0.82;
    const totalH = botY - topY;
    const slotH = totalH / bars;
    const barH = Math.max(2.5, slotH * (1 - clamp(tGeo.gapRatio * 0.95, 0.04, 0.82)));
    const shear = Math.tan((tGeo.tiltDeg * Math.PI) / 180) * 0.45;
    for (let i = 0; i < bars; i++) {
      const fy = (i + 0.5) / bars;
      const y = topY + i * slotH;
      const halfW = R * 0.96 * fy;
      const dx = (i % 2 === 0 ? 1 : -1) * shear * R * 0.45;
      ctx.fillStyle = Math.abs(tGeo.tiltDeg) > 8 && i % 2 === 0 ? COLORS.err : COLORS.green;
      if (i === 4) {
        // 横杠全连
        ctx.fillRect(xs[1] - halfW + dx, y, halfW * 2, barH);
      } else if (i >= 2) {
        const legW = Math.max(8, R * 0.26);
        ctx.fillRect(xs[1] - halfW + dx, y, legW, barH);
        ctx.fillRect(xs[1] + halfW - legW + dx, y, legW, barH);
      } else {
        ctx.fillRect(xs[1] - halfW + dx, y, Math.max(10, halfW * 2), barH);
      }
    }
  } else {
    if (heroState.motif === "ui") {
      // 中心感叹号几何块
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(xs[1] - 3, upperCy - R * 0.24, 6, R * 0.42);
      ctx.beginPath();
      ctx.arc(xs[1], upperCy + R * 0.36, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = strokeW;
    ctx.lineCap = "butt";
    for (const e of tGeo.edges) {
      const mx = (e.x1 + e.x2) / 2;
      const my = (e.y1 + e.y2) / 2;
      const x1 = mx + (e.x1 - mx) * intro;
      const y1 = my + (e.y1 - my) * intro;
      const x2 = mx + (e.x2 - mx) * intro;
      const y2 = my + (e.y2 - my) * intro;
      ctx.strokeStyle = e.tilted ? COLORS.err : COLORS.green;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (e.tilted) {
        // 延长线脱靶提示
        ctx.save();
        ctx.strokeStyle = "rgba(192,38,28,0.65)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x1 - e.ux * R * 0.85, e.y1 - e.uy * R * 0.85);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  ctx.restore();

  // 3) 蔷薇粉方 / 负空间字母 H 标 / UI 删边信息卡
  ctx.save();
  if (heroState.motif === "emblem") {
    const hHalf = R * 0.44;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(xs[2] - hHalf, upperCy - hHalf, hHalf * 0.42, hHalf * 2);
    ctx.fillRect(xs[2] + hHalf * 0.58, upperCy - hHalf, hHalf * 0.42, hHalf * 2);
    ctx.fillRect(xs[2] - hHalf * 0.55, upperCy - hHalf * 0.18, hHalf * 1.1, hHalf * 0.36);
  } else if (heroState.motif === "ui") {
    // 卡片内部排版线
    const cw = R * 1.18;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(xs[2] - cw * 0.42, upperCy - R * 0.36, cw * 0.58, 6);
    ctx.fillStyle = COLORS.taupe;
    ctx.fillRect(xs[2] - cw * 0.42, upperCy - R * 0.1, cw * 0.84, 4);
    ctx.fillRect(xs[2] - cw * 0.42, upperCy + R * 0.12, cw * 0.68, 4);
    ctx.fillStyle = COLORS.orange;
    ctx.fillRect(xs[2] - cw * 0.42, upperCy + R * 0.34, cw * 0.36, 7);
  }

  ctx.lineWidth = strokeW;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.strokeStyle = COLORS.pink;
  for (const pts of sGeo.paths) {
    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
  if (sGeo.code === "cornersCut") {
    // 保留原海报蔷薇粉直边，用鲜明赤红虚框与红叉标出 4 处被切掉的拐角
    const { x0, y0, x1, y1 } = sGeo.bounds;
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 2;
    for (const [cx0, cy0] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) {
      ctx.beginPath();
      ctx.moveTo(cx0 - 6, cy0 - 6);
      ctx.lineTo(cx0 + 6, cy0 + 6);
      ctx.moveTo(cx0 + 6, cy0 - 6);
      ctx.lineTo(cx0 - 6, cy0 + 6);
      ctx.stroke();
    }
  } else if (sGeo.code === "oneSideBreach") {
    const { x1, y0, y1 } = sGeo.bounds;
    ctx.save();
    ctx.strokeStyle = COLORS.err;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 上舱可点击错态热区与热区登记
  geos.forEach((g, idx) => {
    const cx = xs[idx];
    const tagY = upperCy + R + (compact ? 17 : 19);
    let action = "focus";
    let label = `${Math.round(g.gapRatio * 100)}% · ${g.tier}`;
    let bg = "#E6F4EC";
    let fg = COLORS.green;
    let border = COLORS.green;

    if (!g.ok) {
      bg = "#FDECEB";
      fg = COLORS.err;
      border = COLORS.err;
      if (g.code === "drifted") {
        action = "fix-drift";
        label = compact ? "偏心·归圆" : "偏心 · 点此归圆";
      } else if (g.code === "misaligned") {
        action = "fix-tilt";
        label = compact ? `歪${Math.abs(g.tiltDeg)}°·对顶` : `歪 ${Math.abs(g.tiltDeg)}° · 点此对顶`;
      } else if (g.code === "cornersCut") {
        action = "fix-square";
        label = compact ? "切角·改切边" : "切四角 · 点此改切边";
      } else if (g.code === "oneSideBreach") {
        action = "fix-square";
        label = compact ? "豁口·均切" : "单侧豁口 · 点此均切";
      } else if (g.code === "sealed") {
        label = `死封 ${Math.round(g.gapRatio * 100)}%`;
      } else {
        label = `溃散 ${Math.round(g.gapRatio * 100)}%`;
      }
    }

    const box = drawPillLabel(ctx, cx, Math.min(splitTop - 13, tagY), label, bg, fg, border, compact);
    // 整个图形区域 + 标签都可点
    heroHitTargets.push({
      kind: g.kind,
      action,
      x: cx - R * 1.15,
      y: upperCy - R * 1.15,
      w: R * 2.3,
      h: Math.max(R * 2.3, box.y + box.h - (upperCy - R * 1.15)),
    });
  });

  // ---------- 绘制下舱：深松绿脑补显影室 ----------
  const dashW = Math.max(3.4, Rlow * 0.13);
  geos.forEach((g, idx) => {
    const cx = xs[idx];
    ctx.save();
    if (g.ok) {
      // 柔和的闭合浮现光晕
      ctx.fillStyle = "rgba(226, 215, 195, 0.08)";
      if (idx === 0) {
        ctx.beginPath();
        ctx.arc(cx, lowerCy, Rlow, 0, Math.PI * 2);
        ctx.fill();
      } else if (idx === 1) {
        ctx.beginPath();
        ctx.moveTo(cx, lowerCy - Rlow * 1.02);
        ctx.lineTo(cx + Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.lineTo(cx - Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(cx - Rlow * 0.86, lowerCy - Rlow * 0.86, Rlow * 1.72, Rlow * 1.72);
      }

      // 118 原海报标志性暖砂虚线补全轮廓
      ctx.strokeStyle = COLORS.taupeBright;
      ctx.lineWidth = dashW;
      ctx.setLineDash(heroState.showMindRays ? [8, 5] : []);
      ctx.beginPath();
      if (idx === 0) {
        ctx.arc(cx, lowerCy, Rlow, 0, Math.PI * 2);
      } else if (idx === 1) {
        ctx.moveTo(cx, lowerCy - Rlow * 1.02);
        ctx.lineTo(cx + Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.lineTo(cx - Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.closePath();
      } else {
        ctx.rect(cx - Rlow * 0.86, lowerCy - Rlow * 0.86, Rlow * 1.72, Rlow * 1.72);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      drawPillLabel(ctx, cx, h - 15, compact ? "✓ 已闭合" : "✓ 大脑已闭合", "#174A36", COLORS.greenBright, COLORS.greenBright, compact);
    } else if (g.code === "sealed") {
      // 死画封死态：纯实线无脑补参与
      ctx.strokeStyle = "#E8B968";
      ctx.lineWidth = dashW;
      ctx.beginPath();
      if (idx === 0) ctx.arc(cx, lowerCy, Rlow, 0, Math.PI * 2);
      else if (idx === 1) {
        ctx.moveTo(cx, lowerCy - Rlow * 1.02);
        ctx.lineTo(cx + Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.lineTo(cx - Rlow * 0.94, lowerCy + Rlow * 0.8);
        ctx.closePath();
      } else ctx.rect(cx - Rlow * 0.86, lowerCy - Rlow * 0.86, Rlow * 1.72, Rlow * 1.72);
      ctx.stroke();
      drawPillLabel(ctx, cx, h - 15, compact ? "全封" : "全封 · 无需脑补", "#3B2D10", "#F6CF7D", "#E8B968", compact);
    } else {
      // 脑补断裂：按真实错因画断掉的虚线投影
      ctx.strokeStyle = `rgba(255, 140, 130, ${0.58 + pulse * 0.3})`;
      ctx.lineWidth = Math.max(2.2, dashW * 0.72);
      ctx.setLineDash([5, 6]);
      if (idx === 0) {
        const sub = buildCircleGeometry(heroState.circle, cx, lowerCy, Rlow);
        for (const a of sub.arcs) {
          ctx.beginPath();
          ctx.arc(a.cx, a.cy, a.r, a.start, a.end);
          ctx.stroke();
        }
      } else if (idx === 1) {
        const sub = buildTriangleGeometry(heroState.triangle, cx, lowerCy, Rlow);
        for (const e of sub.edges) {
          ctx.beginPath();
          ctx.moveTo(e.x1, e.y1);
          ctx.lineTo(e.x2, e.y2);
          ctx.stroke();
        }
      } else {
        const sub = buildSquareGeometry(heroState.square, cx, lowerCy, Rlow * 0.86);
        for (const pts of sub.paths) {
          ctx.beginPath();
          pts.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      drawPillLabel(ctx, cx, h - 15, `× ${codeLabel(g.code)}`, "#3F1714", COLORS.errDark, COLORS.errDark, compact);
    }
    ctx.restore();
  });

  ctx.restore();
}

const heroLoop = loop(heroCanvas, drawHeroFrame);

// 指针/触屏横向直拖削笔 + 点击红标直修
let dragInfo = null;

function canvasCoords(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const r = heroCanvas.getBoundingClientRect();
  heroSize = { w: r.width, h: r.height };
  dragInfo = {
    id: e.pointerId,
    left: r.left,
    top: r.top,
    startX: e.clientX - r.left,
    startY: e.clientY - r.top,
    w: r.width,
    startGap: getActiveGap(),
    moved: false,
  };
  try {
    heroCanvas.setPointerCapture(e.pointerId);
  } catch {}
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const px = e.clientX - dragInfo.left;
  const py = e.clientY - dragInfo.top;
  const dx = px - dragInfo.startX;
  const dy = py - dragInfo.startY;
  if (!dragInfo.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
  if (Math.abs(dx) >= Math.abs(dy) * 0.7 || dragInfo.moved) {
    dragInfo.moved = true;
    const delta = dx / Math.max(180, dragInfo.w * 0.75);
    setActiveGap(dragInfo.startGap + delta);
    heroUiDirty = true;
    if (reducedMotion.matches) {
      syncHeroUI();
      heroLoop.draw();
    }
  }
});

function finishHeroPointer(e) {
  if (!dragInfo || e.pointerId !== dragInfo.id) return;
  const wasMoved = dragInfo.moved;
  const pt = { x: e.clientX - dragInfo.left, y: e.clientY - dragInfo.top };
  dragInfo = null;
  if (wasMoved) {
    syncHeroUI(true);
    return;
  }

  // 未拖动 → 当作点击修错或选中聚焦
  const hit = heroHitTargets.find(
    (t) => pt.x >= t.x && pt.x <= t.x + t.w && pt.y >= t.y && pt.y <= t.y + t.h
  );
  if (!hit) return;

  if (hit.action === "fix-drift") {
    heroState.circle.drift = 0;
  } else if (hit.action === "fix-tilt") {
    heroState.triangle.tilt = 0;
  } else if (hit.action === "fix-square") {
    heroState.square.cutMode = "sides";
  } else {
    heroState.focus = heroState.focus === hit.kind ? "all" : hit.kind;
    $$("[data-focus]").forEach((b) => b.classList.toggle("is-active", b.dataset.focus === heroState.focus));
  }
  syncHeroUI();
  heroLoop.draw();
}

heroCanvas.addEventListener("pointerup", finishHeroPointer);
heroCanvas.addEventListener("pointercancel", () => {
  dragInfo = null;
});

// 题材切换、滑杆、聚焦、快捷修复、预设按钮
$$("[data-motif]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.motif = btn.dataset.motif;
    $$("[data-motif]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    heroLoop.draw();
  });
});

$("#btn-toggle-rays").addEventListener("click", (e) => {
  heroState.showMindRays = !heroState.showMindRays;
  e.currentTarget.setAttribute("aria-pressed", String(heroState.showMindRays));
  e.currentTarget.textContent = heroState.showMindRays ? "脑补虚线：开" : "脑补虚线：关";
  heroLoop.draw();
});

$("#gap-slider").addEventListener("input", (e) => {
  setActiveGap(Number(e.target.value) / 100);
  syncHeroUI();
  heroLoop.draw();
});

$$("[data-focus]").forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.focus = btn.dataset.focus;
    $$("[data-focus]").forEach((b) => b.classList.toggle("is-active", b === btn));
    syncHeroUI();
    heroLoop.draw();
  });
});

$("#btn-fix-drift").addEventListener("click", () => {
  heroState.circle.drift = heroState.circle.drift > 0.01 ? 0 : 0.24;
  syncHeroUI();
  heroLoop.draw();
});

$("#btn-fix-tilt").addEventListener("click", () => {
  heroState.triangle.tilt = Math.abs(heroState.triangle.tilt) > 1 ? 0 : 28;
  syncHeroUI();
  heroLoop.draw();
});

$("#btn-flip-square").addEventListener("click", () => {
  heroState.square.cutMode = heroState.square.cutMode === "sides" ? "corners" : "sides";
  syncHeroUI();
  heroLoop.draw();
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    heroState.focus = "all";
    heroState.circle = { ...p.circle };
    heroState.triangle = { ...p.triangle };
    heroState.square = { ...p.square };
    $$("[data-focus]").forEach((b) => b.classList.toggle("is-active", b.dataset.focus === "all"));
    $$("[data-preset]").forEach((b) => b.classList.toggle("is-selected", b === btn));
    syncHeroUI();
    heroLoop.draw();
  });
});

// 全局键盘操作（不抢输入框焦点）
window.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  if (!$("#lightbox").hidden) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    setActiveGap(getActiveGap() - 0.02);
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    setActiveGap(getActiveGap() + 0.02);
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "r" || e.key === "R") {
    heroState.circle.drift = 0;
    heroState.triangle.tilt = 0;
    heroState.square.cutMode = "sides";
    syncHeroUI();
    heroLoop.draw();
  } else if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "0") {
    const map = { "0": "all", "1": "circle", "2": "triangle", "3": "square" };
    heroState.focus = map[e.key];
    $$("[data-focus]").forEach((b) => b.classList.toggle("is-active", b.dataset.focus === heroState.focus));
    syncHeroUI();
    heroLoop.draw();
  }
});

// ============================================================
// 1. 01 节：拐角 vs 直边 8 段点击交互台
// ============================================================

const cornerSegs = [false, true, false, true, false, true, false, true]; // 初始：留四边 50%，0/4 拐角

function renderCornerPuzzle() {
  const res = evaluateCornerPuzzle(cornerSegs);
  $$("#corner-puzzle-svg .seg-hit").forEach((el) => {
    const i = Number(el.dataset.seg);
    const on = cornerSegs[i];
    el.classList.toggle("is-on", on);
    el.classList.toggle("is-corner", i % 2 === 0);
    el.setAttribute("aria-pressed", String(on));
  });
  const tag = $("#c01-status");
  tag.dataset.tone = res.tone;
  tag.textContent = `${res.cornersOn}/4 拐角 · ${res.inkPct}% 墨 · ${res.grade}`;
  $("#c01-explain").textContent = res.explain;
}

$$("#corner-puzzle-svg .seg-hit").forEach((el) => {
  const toggle = () => {
    const i = Number(el.dataset.seg);
    cornerSegs[i] = !cornerSegs[i];
    renderCornerPuzzle();
  };
  el.addEventListener("click", toggle);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});

$("#c01-keep-corners").addEventListener("click", () => {
  [true, false, true, false, true, false, true, false].forEach((v, i) => (cornerSegs[i] = v));
  renderCornerPuzzle();
});
$("#c01-keep-sides").addEventListener("click", () => {
  [false, true, false, true, false, true, false, true].forEach((v, i) => (cornerSegs[i] = v));
  renderCornerPuzzle();
});
$("#c01-full").addEventListener("click", () => {
  cornerSegs.fill(true);
  renderCornerPuzzle();
});

// ============================================================
// 2. 02 节：卡尼萨旋盘转角台（显形补全 vs 藏形遮挡）
// ============================================================

const kCanvas = $("#kanizsa-canvas");
const kCtx = kCanvas.getContext("2d");
const kState = {
  mode: "modal", // "modal" | "amodal"
  targetAngles: [0, 0, 0],
  curAngles: [0, 0, 0],
  blockBar: false,
  amodalXray: 0, // 0 实遮挡 | 1 半透 X 光 | 2 意外真相
};

function updateKanizsaReadout() {
  if (kState.mode === "modal") {
    const maxA = Math.max(...kState.targetAngles.map((a) => Math.abs(((a % 360) + 540) % 360 - 180)));
    const aligned = kState.targetAngles.every((a) => Math.abs(((a + 180) % 360 + 360) % 360 - 180) <= 6);
    if (aligned && !kState.blockBar) {
      $("#k02-readout").textContent =
        "三枚缺口圆饼（0°）精准指向中心，纸面明明没有任何新线条，眼睛却在中央「凭空看见」一枚比纸更亮的白色正三角浮在最上层。";
    } else if (aligned && kState.blockBar) {
      $("#k02-readout").textContent =
        "三枚缺口虽然对准，但横插的一道橘色实线直接切碎了隐形边界的连续性，中央白三角的主观轮廓立刻变淡、塌回背景。";
    } else {
      $("#k02-readout").textContent =
        `缺口朝向出现偏转（当前三饼角度：${kState.targetAngles.map((a) => `${Math.round(a)}°`).join(" / ")}）。缺口一旦不再共线对齐，主观白三角瞬间消失，只剩三块普通的残缺圆饼。`;
    }
  } else {
    const msgs = [
      "松绿竖条压在前景：大脑毫不犹豫地把左右两截橘环和粉块在竖条背后补连成完整圆与整块矩形——这就是「藏形补全」。",
      "把竖条调成半透明 X 光：我们刚才在脑子里默认补出来的，正是背后最简单、最规整的延续路径（考夫卡的简洁律）。",
      "掀开意外真相：其实背后也可以是断开的怪异折线！藏形补全本质上是大脑基于日常经验做出的高概率推断，排版里正靠这份直觉做叠图景深。",
    ];
    $("#k02-readout").textContent = msgs[kState.amodalXray];
  }
}

function drawKanizsa(t, dt, { still }) {
  const rect = kCanvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const dpr = pixelRatio(2);
  const w = rect.width;
  const h = rect.height;
  if (kCanvas.width !== Math.round(w * dpr) || kCanvas.height !== Math.round(h * dpr)) {
    kCanvas.width = Math.round(w * dpr);
    kCanvas.height = Math.round(h * dpr);
  }
  const ctx = kCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  // 缓动角度
  for (let i = 0; i < 3; i++) {
    if (still || dt === 0) kState.curAngles[i] = kState.targetAngles[i];
    else kState.curAngles[i] += (kState.targetAngles[i] - kState.curAngles[i]) * Math.min(1, dt * 10);
  }

  ctx.fillStyle = "#F7F2E8";
  ctx.fillRect(0, 0, w, h);

  if (kState.mode === "modal") {
    const cx = w * 0.5;
    const cy = h * 0.56;
    const triR = Math.min(w, h) * 0.285;
    const discR = triR * 0.36;
    // 三个顶点（上、右下、左下）
    const verts = [
      { x: cx, y: cy - triR, baseAng: Math.PI / 2, color: COLORS.green },
      { x: cx + triR * Math.cos(Math.PI / 6), y: cy + triR * Math.sin(Math.PI / 6), baseAng: -Math.PI * (5 / 6), color: COLORS.orange },
      { x: cx - triR * Math.cos(Math.PI / 6), y: cy + triR * Math.sin(Math.PI / 6), baseAng: -Math.PI / 6, color: COLORS.pink },
    ];

    // 背后弱线框倒三角（经典卡尼萨反衬结构）
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy + triR * 0.92);
    ctx.lineTo(cx - triR * 0.88, cy - triR * 0.44);
    ctx.lineTo(cx + triR * 0.88, cy - triR * 0.44);
    ctx.closePath();
    ctx.stroke();

    // 画三枚缺口圆饼
    verts.forEach((v, i) => {
      const rot = (kState.curAngles[i] * Math.PI) / 180;
      const mouthCenter = v.baseAng + rot;
      const mouthHalf = Math.PI / 6; // 60° 缺口对应正三角内角
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.arc(v.x, v.y, discR, mouthCenter + mouthHalf, mouthCenter + Math.PI * 2 - mouthHalf);
      ctx.closePath();
      ctx.fill();
    });

    // 若精准对齐且未阻断，叠加真实微提亮（模拟白色主观纸片盖住背后倒三角边）
    const maxErr = Math.max(...kState.curAngles.map((a) => Math.abs(((a + 180) % 360 + 360) % 360 - 180)));
    if (maxErr < 8) {
      const strength = clamp(1 - maxErr / 8, 0, 1) * (kState.blockBar ? 0.35 : 1);
      ctx.save();
      ctx.fillStyle = `rgba(255, 253, 249, ${(0.88 * strength).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (kState.blockBar) {
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, cy);
      ctx.lineTo(w * 0.86, cy);
      ctx.stroke();
    }

    // 标出可点角度小标签（严格限在画布安全边距内）
    const kCompact = w < 420;
    verts.forEach((v, i) => {
      const ang = Math.round(((kState.targetAngles[i] % 360) + 360) % 360);
      const pillY = clamp(v.y + (i === 0 ? -discR - 14 : discR + 15), 14, h - 14);
      drawPillLabel(ctx, v.x, pillY, `${ang}° · 点转`, COLORS.paper, COLORS.ink, COLORS.taupe, kCompact);
    });
  } else {
    // 藏形补全（遮挡叠层）
    const cx = w * 0.5;
    const cy = h * 0.52;
    const barW = Math.min(w * 0.22, 118);
    const barH = h * 0.72;
    const ringR = Math.min(w, h) * 0.26;

    // 背后图形：左侧穿过的橘圆环 + 下方粉红横条
    if (kState.amodalXray === 2) {
      // 意外真相：背后其实是截断的锯齿，并非连贯图形
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx - barW * 0.25, cy - 16, ringR, Math.PI * 0.58, Math.PI * 1.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + barW * 0.25, cy - 16, ringR, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();

      ctx.fillStyle = COLORS.pink;
      ctx.fillRect(cx - ringR * 1.5, cy + ringR * 0.55, ringR * 1.15, 28);
      ctx.fillRect(cx + ringR * 0.35, cy + ringR * 0.55, ringR * 1.15, 28);

      // 标出背后的空断
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(cx - barW * 0.32, cy - ringR * 0.9, barW * 0.64, ringR * 1.85);
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy - 16, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = COLORS.pink;
      ctx.fillRect(cx - ringR * 1.5, cy + ringR * 0.55, ringR * 3, 28);
    }

    // 前景遮挡松绿竖条
    ctx.save();
    ctx.globalAlpha = kState.amodalXray === 0 ? 1 : kState.amodalXray === 1 ? 0.38 : 0.22;
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(cx - barW / 2, cy - barH / 2, barW, barH);
    ctx.restore();
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - barW / 2, cy - barH / 2, barW, barH);

    drawPillLabel(
      ctx,
      cx,
      cy - barH / 2 - 14,
      kState.amodalXray === 0 ? "前景遮挡层（实底）" : kState.amodalXray === 1 ? "半透 X 光：按简洁律连贯" : "掀开真相：背后其实断开",
      COLORS.ink,
      COLORS.paper
    );
  }

  ctx.restore();
}

const kanizsaLoop = loop(kCanvas, drawKanizsa);

kCanvas.addEventListener("click", (e) => {
  if (kState.mode !== "modal") return;
  const pt = canvasCoords(kCanvas, e.clientX, e.clientY);
  const cx = pt.w * 0.5;
  const cy = pt.h * 0.56;
  const triR = Math.min(pt.w, pt.h) * 0.285;
  const verts = [
    { x: cx, y: cy - triR },
    { x: cx + triR * Math.cos(Math.PI / 6), y: cy + triR * Math.sin(Math.PI / 6) },
    { x: cx - triR * Math.cos(Math.PI / 6), y: cy + triR * Math.sin(Math.PI / 6) },
  ];
  let best = -1;
  let bestD = Infinity;
  verts.forEach((v, i) => {
    const d = Math.hypot(pt.x - v.x, pt.y - v.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  if (best >= 0 && bestD < triR * 0.65) {
    kState.targetAngles[best] = (kState.targetAngles[best] + 45) % 360;
    $$("[data-kangle]").forEach((b) => b.classList.remove("is-active"));
    updateKanizsaReadout();
    kanizsaLoop.draw();
  }
});

$$("[data-kmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    kState.mode = btn.dataset.kmode;
    $$("[data-kmode]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $("#k02-modal-bar").classList.toggle("is-hidden", kState.mode !== "modal");
    $("#k02-amodal-bar").classList.toggle("is-hidden", kState.mode !== "amodal");
    updateKanizsaReadout();
    kanizsaLoop.draw();
  });
});

$$("[data-kangle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const a = Number(btn.dataset.kangle);
    kState.targetAngles = [a, a, a];
    $$("[data-kangle]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateKanizsaReadout();
    kanizsaLoop.draw();
  });
});

$("#btn-k-bar").addEventListener("click", (e) => {
  kState.blockBar = !kState.blockBar;
  e.currentTarget.setAttribute("aria-pressed", String(kState.blockBar));
  e.currentTarget.textContent = kState.blockBar ? "横插阻断线：开" : "横插阻断线：关";
  updateKanizsaReadout();
  kanizsaLoop.draw();
});

$$("[data-axray]").forEach((btn) => {
  btn.addEventListener("click", () => {
    kState.amodalXray = Number(btn.dataset.axray);
    $$("[data-axray]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateKanizsaReadout();
    kanizsaLoop.draw();
  });
});

// ============================================================
// 3. 03 节：深松绿暗室 · 杂波寻环仪（含真实毫秒测速）
// ============================================================

const clutterCanvas = $("#clutter-canvas");
const clutterCtx = clutterCanvas.getContext("2d");

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const c03 = {
  type: "closed", // "closed" | "gapped" | "open"
  gapPct: 26,
  noiseCount: 130,
  reveal: true,
  seed: 11801,
  tx: 0.62,
  ty: 0.48,
  testing: false,
  testStart: 0,
  closedMs: null,
  openMs: null,
};

function getTargetSegments(w, h) {
  const cx = w * c03.tx;
  const cy = h * c03.ty;
  const r = Math.min(w, h) * 0.19;
  const n = 12;
  const effectiveGap = c03.type === "gapped" ? Math.max(54, c03.gapPct) : c03.gapPct;
  const dashLen = Math.max(6, ((2 * Math.PI * r) / n) * (1 - effectiveGap / 100));
  const segs = [];

  if (c03.type === "open") {
    // 12 段等长同曲率敞口 S 曲线，不围成封闭环
    const startX = clamp(cx - r * 1.45, 36, w - r * 2.9 - 36);
    const stepX = (r * 2.9) / (n - 1);
    for (let i = 0; i < n; i++) {
      const x = startX + i * stepX;
      const phase = (i / (n - 1)) * Math.PI * 1.7;
      const y = cy + Math.sin(phase) * r * 0.65;
      const dy = Math.cos(phase) * r * 0.65 * ((Math.PI * 1.7) / (r * 2.9));
      const ang = Math.atan2(dy, 1);
      segs.push({ x, y, ang, len: dashLen });
    }
  } else {
    for (let i = 0; i < n; i++) {
      const theta = (i / n) * Math.PI * 2;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      const ang = theta + Math.PI / 2;
      segs.push({ x, y, ang, len: dashLen });
    }
  }
  return { cx, cy, r, segs };
}

function drawClutter() {
  const rect = clutterCanvas.getBoundingClientRect();
  if (rect.width < 20) return;
  const dpr = pixelRatio(2);
  const w = rect.width;
  const h = rect.height;
  if (clutterCanvas.width !== Math.round(w * dpr) || clutterCanvas.height !== Math.round(h * dpr)) {
    clutterCanvas.width = Math.round(w * dpr);
    clutterCanvas.height = Math.round(h * dpr);
  }
  const ctx = clutterCtx;
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#081D15";
  ctx.fillRect(0, 0, w, h);

  const target = getTargetSegments(w, h);
  const rand = mulberry32(c03.seed);
  const baseLen = target.segs[0].len;

  // 背景杂波短线（与目标短线同粗同色，避免色彩作弊）
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#8EB2A0";
  for (let i = 0; i < c03.noiseCount; i++) {
    const x = 18 + rand() * (w - 36);
    const y = 18 + rand() * (h - 36);
    const ang = rand() * Math.PI;
    // 避开直接压死目标线段中心
    if (target.segs.some((s) => Math.hypot(s.x - x, s.y - y) < 12)) continue;
    const dx = Math.cos(ang) * baseLen * 0.5;
    const dy = Math.sin(ang) * baseLen * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
  }

  // 目标轮廓短线
  ctx.strokeStyle = c03.reveal ? COLORS.orange : "#8EB2A0";
  ctx.lineWidth = c03.reveal ? 3.2 : 2.6;
  for (const s of target.segs) {
    const dx = Math.cos(s.ang) * s.len * 0.5;
    const dy = Math.sin(s.ang) * s.len * 0.5;
    ctx.beginPath();
    ctx.moveTo(s.x - dx, s.y - dy);
    ctx.lineTo(s.x + dx, s.y + dy);
    ctx.stroke();
  }

  if (c03.reveal && c03.type !== "open") {
    ctx.strokeStyle = "rgba(226, 215, 195, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(target.cx, target.cy, target.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (c03.testing) {
    drawPillLabel(ctx, w * 0.5, 22, "测速中：直接点击你找到的目标轮廓", COLORS.orange, COLORS.paper);
  }
  ctx.restore();
}

function updateClutterReadout() {
  const names = { closed: "闭合圆环", gapped: "大缺口环", open: "同长敞口线" };
  const desc = {
    closed: `当前目标为「闭合圆环」（12 段短线首尾环抱，缺口 ${c03.gapPct}%）。混入 ${c03.noiseCount} 条同粗杂线时，整圈轮廓依然容易整体浮起。`,
    gapped: `当前目标为「大缺口环」（缺口强制拉宽到 ${Math.max(54, c03.gapPct)}%）。一旦跨距越界，闭合协同效应急剧减弱，圆环开始融进杂波。`,
    open: `当前目标为「同长敞口线」（同样 12 段、同样平滑曲率，但首尾不闭合）。你可以亲手测速，体会它比闭合环更难一眼抓出。`,
  };
  if (!c03.testing) $("#c03-readout").textContent = desc[c03.type];
  $("#c03-gap-val").textContent = `${c03.gapPct}%`;
  $("#c03-noise-val").textContent = `${c03.noiseCount} 条`;
  $("#btn-clutter-reveal").setAttribute("aria-pressed", String(c03.reveal));
  $("#btn-clutter-reveal").textContent = c03.reveal ? "透视真身：开" : "透视真身：关";
  $("#t-closed").textContent = c03.closedMs == null ? "—" : `${c03.closedMs} ms`;
  $("#t-open").textContent = c03.openMs == null ? "—" : `${c03.openMs} ms`;
  if (c03.closedMs != null && c03.openMs != null) {
    const diff = c03.openMs - c03.closedMs;
    $("#t-note").textContent =
      diff > 0
        ? `你本次本机实测：闭合环（${c03.closedMs} ms）比敞口线（${c03.openMs} ms）快了 ${diff} ms，亲身印证了 Kovács & Julesz (1993) 的闭合优势。`
        : `你本次本机实测：闭合环 ${c03.closedMs} ms，敞口线 ${c03.openMs} ms（单次测速会受落点运气影响，可多测两轮观察趋势）。`;
  }
}

$$("[data-ctype]").forEach((btn) => {
  btn.addEventListener("click", () => {
    c03.type = btn.dataset.ctype;
    c03.testing = false;
    $$("[data-ctype]").forEach((b) => b.classList.toggle("is-active", b === btn));
    updateClutterReadout();
    drawClutter();
  });
});

$("#c03-gap").addEventListener("input", (e) => {
  c03.gapPct = Number(e.target.value);
  updateClutterReadout();
  drawClutter();
});

$("#c03-noise").addEventListener("input", (e) => {
  c03.noiseCount = Number(e.target.value);
  updateClutterReadout();
  drawClutter();
});

$("#btn-clutter-reveal").addEventListener("click", () => {
  c03.reveal = !c03.reveal;
  c03.testing = false;
  updateClutterReadout();
  drawClutter();
});

$("#btn-clutter-test").addEventListener("click", () => {
  c03.seed = (c03.seed + 97) % 99991;
  const r = mulberry32(c03.seed + 7);
  c03.tx = 0.28 + r() * 0.44;
  c03.ty = 0.30 + r() * 0.42;
  c03.reveal = false;
  c03.testing = true;
  c03.testStart = performance.now();
  $("#c03-readout").textContent = "计时已开始！请在上方深绿杂波场中直接点击你找到的轮廓位置。";
  updateClutterReadout();
  drawClutter();
});

clutterCanvas.addEventListener("click", (e) => {
  if (!c03.testing) return;
  const pt = canvasCoords(clutterCanvas, e.clientX, e.clientY);
  const target = getTargetSegments(pt.w, pt.h);
  const hit =
    c03.type === "open"
      ? target.segs.some((s) => Math.hypot(pt.x - s.x, pt.y - s.y) < 32)
      : Math.hypot(pt.x - target.cx, pt.y - target.cy) < target.r + 30;
  if (hit) {
    const elapsed = Math.max(1, Math.round(performance.now() - c03.testStart));
    c03.testing = false;
    c03.reveal = true;
    if (c03.type === "open") c03.openMs = elapsed;
    else c03.closedMs = elapsed;
    updateClutterReadout();
    $("#c03-readout").textContent = `命中！本次找到「${c03.type === "open" ? "同长敞口线" : "闭合圆环"}」实测用时 ${elapsed} ms，已亮显目标位置。`;
    drawClutter();
  } else {
    $("#c03-readout").textContent = "还没点中目标位置，再仔细扫一眼——实在找不到可点「透视真身」揭晓。";
  }
});

// ============================================================
// 4. 04 节：历史溯源四幕结构透视器
// ============================================================

const SPECIMENS = {
  wertheimer: {
    title: "1923 · 韦特海默括号实验：闭合可以压过邻近",
    desc: "两根距离更近的竖线若背对背开口（] [），人眼反倒会把更远但相对合拢的括号（[ ]）优先看成一组——闭合围合的力量在不少情境下能盖过单纯的距离近。",
    svg(xray) {
      const pairs = [56, 154, 252, 350];
      const ink = pairs
        .map(
          (x) => `
          <path d="M${x + 14} 58 H${x} V182 H${x + 14}" fill="none" stroke="${COLORS.ink}" stroke-width="6"/>
          <path d="M${x + 56} 58 H${x + 70} V182 H${x + 56}" fill="none" stroke="${COLORS.ink}" stroke-width="6"/>`
        )
        .join("");
      const guide = xray
        ? pairs
            .map(
              (x) =>
                `<rect x="${x}" y="58" width="70" height="124" fill="rgba(16,88,56,0.08)" stroke="${COLORS.orange}" stroke-width="2" stroke-dasharray="6 5"/>`
            )
            .join("")
        : "";
      return `${guide}${ink}`;
    },
  },
  kanizsa: {
    title: "1955 · 卡尼萨主观轮廓：缺口对齐催生无形边",
    desc: "四个带 90° 缺口的深绿圆饼朝内对齐时，大脑不仅补全轮廓，还会把中央白方形感知为「浮在圆饼上方且更亮一层」的前景卡片。",
    svg(xray) {
      const discs = [
        [135, 62, 0],
        [285, 62, 90],
        [285, 178, 180],
        [135, 178, 270],
      ];
      const ink = discs
        .map(
          ([cx, cy, rot]) =>
            `<path d="M0 0 L34 0 A34 34 0 1 1 0 34 Z" transform="translate(${cx} ${cy}) rotate(${rot})" fill="${COLORS.green}"/>`
        )
        .join("");
      const guide = xray
        ? `<rect x="135" y="62" width="150" height="116" fill="rgba(228,80,4,0.08)" stroke="${COLORS.orange}" stroke-width="2.5" stroke-dasharray="7 5"/>`
        : "";
      return `${ink}${guide}`;
    },
  },
  stripes: {
    title: "1972 · 条纹字母原理：横切白缝不拆散外轮廓",
    desc: "借鉴保罗·兰德为 IBM 打造的八道横条纹思路：等距水平切口把沉重字面切轻，但每一条的左右端头精准对齐，大脑沿垂直外轮廓瞬间闭合出整字。",
    svg(xray) {
      let bars = "";
      for (let i = 0; i < 8; i++) {
        const y = 46 + i * 19;
        // 几何字母 E 的 8 条横纹示范
        const w = i === 0 || i === 1 || i === 3 || i === 4 || i === 6 || i === 7 ? 156 : 52;
        bars += `<rect x="132" y="${y}" width="${w}" height="10" fill="${COLORS.ink}"/>`;
      }
      const guide = xray
        ? `<path d="M132 46 H288 V75 H184 V103 H288 V132 H184 V160 H288 V189 H132 Z" fill="none" stroke="${COLORS.orange}" stroke-width="2.5" stroke-dasharray="6 4"/>`
        : "";
      return `${bars}${guide}`;
    },
  },
  negspace: {
    title: "1986 · 负空间删框原理：用色块位置托出白轮廓",
    desc: "借鉴 1986 年 Landor 优化 WWF 标志的减法思路：删去白色顶部与背部的封闭描边，只保留高对比深色区块，观者的视觉系统会自动把纸白补成连贯闭合体。",
    svg(xray) {
      // 原创极简几何猫头/圆盾负空间轮廓演示（无恐怖拟真人五官）
      const ink = `
        <path d="M138 66 L166 42 L182 74 Z" fill="${COLORS.ink}"/>
        <path d="M282 66 L254 42 L238 74 Z" fill="${COLORS.ink}"/>
        <path d="M126 146 A88 76 0 0 0 294 146 L272 178 A72 52 0 0 1 148 178 Z" fill="${COLORS.green}"/>
        <rect x="196" y="122" width="28" height="16" rx="8" fill="${COLORS.orange}"/>`;
      const guide = xray
        ? `<ellipse cx="210" cy="128" rx="86" ry="74" fill="none" stroke="${COLORS.pink}" stroke-width="2.5" stroke-dasharray="7 5"/>`
        : "";
      return `${ink}${guide}`;
    },
  },
};

let currentSpec = "wertheimer";
let specXray = false;

function renderSpecimen() {
  const s = SPECIMENS[currentSpec];
  $("#history-svg").innerHTML = s.svg(specXray);
  $("#spec-title").textContent = s.title;
  $("#spec-desc").textContent = s.desc;
  $("#btn-spec-xray").setAttribute("aria-pressed", String(specXray));
  $("#btn-spec-xray").textContent = specXray ? "叠加脑补虚线：开" : "叠加脑补虚线：关";
}

$$("[data-spec]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentSpec = btn.dataset.spec;
    $$("[data-spec]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderSpecimen();
  });
});

$("#btn-spec-xray").addEventListener("click", () => {
  specXray = !specXray;
  renderSpecimen();
});

// ============================================================
// 5. 05 节：三场景「全封 vs 留缺」压力切换
// ============================================================

const STRESS_COPY = {
  uicard: {
    openBtn: "当前：四角留缺",
    closedBtn: "当前：四面实框",
    openNote: "大块信息卡片不需要四面死封的黑框；保住四角锚点与齐整排版，版面噪音立刻下降一半。",
    closedNote: "四面粗黑实框在卡片密排时会叠加出厚重网格牢笼感；在留白充足的编辑排版里可以放心瘦身。",
  },
  tinyicon: {
    openBtn: "当前：过度留缺",
    closedBtn: "当前：实线封口",
    openNote: "缩到 14–16px 后像素格太少，刻意断口像渲染出错或锯齿碎边，徒增辨认迟疑——小图标老实封口更稳。",
    closedNote: "换成实线封口后，16px 下保存、刷新、告警三个符号轮廓一眼即认，零额外脑补负担。",
  },
  signage: {
    openBtn: "当前：断边警示",
    closedBtn: "当前：实线强框",
    openNote: "紧急疏散牌、危险警示与表单输入框要求零毫秒零歧义，绝不能把封闭警示框或点击区边框切碎。",
    closedNote: "闭合粗框配高对比底色，在弱光或一瞥之间直接划出不可逾越的警告边界，安全场景绝不玩留缺。",
  },
};

$$("[data-stress-btn]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.stressBtn;
    const card = btn.closest(".stress-card");
    const nextOpen = card.dataset.open !== "true";
    card.dataset.open = String(nextOpen);
    btn.setAttribute("aria-pressed", String(nextOpen));
    btn.textContent = nextOpen ? STRESS_COPY[key].openBtn : STRESS_COPY[key].closedBtn;
    $(`#note-${key}`).textContent = nextOpen ? STRESS_COPY[key].openNote : STRESS_COPY[key].closedNote;

    if (key === "uicard") {
      $("#demo-uicard .mock-card-frame").classList.toggle("is-open-frame", nextOpen);
    } else if (key === "tinyicon") {
      $("#demo-tinyicon .tiny-strip").classList.toggle("is-broken-tiny", nextOpen);
    } else if (key === "signage") {
      $("#demo-signage .mock-sign").classList.toggle("is-open-sign", nextOpen);
    }
  });
});

// ============================================================
// 6. 06 节：眼力小测（四选项等墨量 62% 单变量盲选）
// ============================================================

let drillPicked = null;

function buildDrillOptionSvg(opt, revealed) {
  const half = 54;
  const cx = 90;
  const cy = 90;
  const x0 = cx - half;
  const x1 = cx + half;
  const y0 = cy - half;
  const y1 = cy + half;
  const side = half * 2;
  const inkStroke = COLORS.ink;
  let shapes = "";
  let overlay = "";

  if (opt.cutMode === "sides") {
    const arm = side * (1 - opt.gap) * 0.5;
    shapes = `
      <path d="M${x0} ${y0 + arm} V${y0} H${x0 + arm}" fill="none" stroke="${inkStroke}" stroke-width="8"/>
      <path d="M${x1 - arm} ${y0} H${x1} V${y0 + arm}" fill="none" stroke="${inkStroke}" stroke-width="8"/>
      <path d="M${x1} ${y1 - arm} V${y1} H${x1 - arm}" fill="none" stroke="${inkStroke}" stroke-width="8"/>
      <path d="M${x0 + arm} ${y1} H${x0} V${y1 - arm}" fill="none" stroke="${inkStroke}" stroke-width="8"/>`;
    if (revealed) {
      overlay = `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" fill="none" stroke="${COLORS.green}" stroke-width="2" stroke-dasharray="5 4"/>`;
    }
  } else if (opt.cutMode === "corners") {
    const seg = side * (1 - opt.gap);
    const pad = (side - seg) / 2;
    shapes = `
      <line x1="${x0 + pad}" y1="${y0}" x2="${x1 - pad}" y2="${y0}" stroke="${inkStroke}" stroke-width="8"/>
      <line x1="${x1}" y1="${y0 + pad}" x2="${x1}" y2="${y1 - pad}" stroke="${inkStroke}" stroke-width="8"/>
      <line x1="${x1 - pad}" y1="${y1}" x2="${x0 + pad}" y2="${y1}" stroke="${inkStroke}" stroke-width="8"/>
      <line x1="${x0}" y1="${y1 - pad}" x2="${x0}" y2="${y0 + pad}" stroke="${inkStroke}" stroke-width="8"/>`;
    if (revealed) {
      overlay = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
        .map(([px, py]) => `<circle cx="${px}" cy="${py}" r="8" fill="none" stroke="${COLORS.err}" stroke-width="2" stroke-dasharray="3 2"/>`)
        .join("");
    }
  } else if (opt.cutMode === "skewed") {
    const arm = side * (1 - opt.gap) * 0.5;
    const corners = [
      { cx: x0, cy: y0, d: `M${x0} ${y0 + arm} V${y0} H${x0 + arm}`, rot: -opt.tiltDeg },
      { cx: x1, cy: y0, d: `M${x1 - arm} ${y0} H${x1} V${y0 + arm}`, rot: opt.tiltDeg },
      { cx: x1, cy: y1, d: `M${x1} ${y1 - arm} V${y1} H${x1 - arm}`, rot: -opt.tiltDeg },
      { cx: x0, cy: y1, d: `M${x0 + arm} ${y1} H${x0} V${y1 - arm}`, rot: opt.tiltDeg },
    ];
    shapes = corners
      .map(
        (c) =>
          `<path d="${c.d}" transform="rotate(${c.rot} ${c.cx} ${c.cy})" fill="none" stroke="${inkStroke}" stroke-width="8"/>`
      )
      .join("");
    if (revealed) {
      overlay = `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" fill="none" stroke="${COLORS.err}" stroke-width="1.8" stroke-dasharray="4 4"/>`;
    }
  } else {
    // oneSide：总墨量同样为 62%，但缺口全集中在右侧与右下角
    const cutTotal = side * 4 * opt.gap; // 1.52 * side
    const extra = Math.max(0, cutTotal - side);
    const topEnd = x1 - extra * 0.5;
    const botEnd = x1 - extra * 0.5;
    shapes = `<path d="M${topEnd} ${y0} H${x0} V${y1} H${botEnd}" fill="none" stroke="${inkStroke}" stroke-width="8"/>`;
    if (revealed) {
      overlay = `<line x1="${x1}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${COLORS.err}" stroke-width="2.5" stroke-dasharray="5 5"/>`;
    }
  }

  return `<svg class="drill-svg" viewBox="0 0 180 180" aria-hidden="true">${overlay}${shapes}</svg>`;
}

function renderDrill() {
  const grid = $("#drill-grid");
  const revealed = drillPicked !== null;
  grid.innerHTML = DRILL_OPTIONS.map((opt) => {
    const isPicked = drillPicked === opt.id;
    let cls = "drill-opt";
    if (revealed) {
      if (isPicked && opt.correct) cls += " is-picked-ok";
      else if (isPicked && !opt.correct) cls += " is-picked-err";
      else if (opt.correct) cls += " is-revealed-ok";
    }
    return `
      <button type="button" class="${cls}" data-drill-opt="${opt.id}" role="radio" aria-checked="${isPicked}">
        <span class="drill-opt-label">${opt.label}</span>
        ${buildDrillOptionSvg(opt, revealed)}
        <span class="drill-opt-note">${revealed ? (opt.correct ? "✓ 拐角完整 + 笔端共线" : opt.id === "B" ? "× 四拐角被切" : opt.id === "C" ? "× 角臂偏转错轨" : "× 右侧整边大豁口") : "保留 62% 实墨"}</span>
      </button>`;
  }).join("");

  $$("[data-drill-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      drillPicked = btn.dataset.drillOpt;
      renderDrill();
      const picked = DRILL_OPTIONS.find((o) => o.id === drillPicked);
      const fb = $("#drill-feedback");
      fb.dataset.tone = picked.correct ? "ok" : "err";
      fb.innerHTML = `<p><strong>你选了 ${picked.label}：</strong>${picked.verdict}</p>`;
    });
  });
}

$("#btn-drill-reset").addEventListener("click", () => {
  drillPicked = null;
  const fb = $("#drill-feedback");
  delete fb.dataset.tone;
  fb.innerHTML = '<p class="fb-placeholder">点选任意一版，四张图会同时显影虚线延长线，揭晓每版的几何成败。</p>';
  renderDrill();
});

// ============================================================
// 7. 07 节：原海报灯箱（复用 #poster.src，支持放大、拖拽、Esc 关闭）
// ============================================================

const lb = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
let lbZoom = 1;
let lbPan = { x: 0, y: 0 };
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbZoom})`;
  $("#lb-zoom-val").textContent = `${Math.round(lbZoom * 100)}%`;
}

function openLightbox() {
  lbImg.src = $("#poster").src;
  lbZoom = 1;
  lbPan = { x: 0, y: 0 };
  applyLbTransform();
  lb.hidden = false;
  $("#lb-close").focus();
}

function closeLightbox() {
  lb.hidden = true;
  $("#poster-open").focus();
}

$("#poster-open").addEventListener("click", openLightbox);
$("#lb-close").addEventListener("click", closeLightbox);
$("#lb-zoom-in").addEventListener("click", () => {
  lbZoom = clamp(lbZoom + 0.25, 0.6, 3);
  applyLbTransform();
});
$("#lb-zoom-out").addEventListener("click", () => {
  lbZoom = clamp(lbZoom - 0.25, 0.6, 3);
  applyLbTransform();
});
$("#lb-reset").addEventListener("click", () => {
  lbZoom = 1;
  lbPan = { x: 0, y: 0 };
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbZoom = clamp(lbZoom + (e.deltaY < 0 ? 0.15 : -0.15), 0.6, 3);
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLightbox();
    return;
  }
  lbDrag = { id: e.pointerId, x: e.clientX - lbPan.x, y: e.clientY - lbPan.y };
  lbStage.classList.add("is-dragging");
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbPan.x = e.clientX - lbDrag.x;
  lbPan.y = e.clientY - lbDrag.y;
  applyLbTransform();
});

lbStage.addEventListener("pointerup", () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

// 窗口尺寸变化时重绘 2D 画布
window.addEventListener("resize", () => {
  measureHeroCanvas();
  heroLoop.draw();
  kanizsaLoop.draw();
  drawClutter();
});

// ============================================================
// 初始化渲染
// ============================================================
measureHeroCanvas();
syncHeroUI(true);
heroLoop.draw();
renderCornerPuzzle();
updateKanizsaReadout();
kanizsaLoop.draw();
updateClutterReadout();
drawClutter();
renderSpecimen();
renderDrill();
