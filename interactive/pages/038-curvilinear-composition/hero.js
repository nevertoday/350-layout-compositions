// 038 曲线构图 · 开场「丝带流束织曲台」交互与 2D 开放宣纸渲染引擎
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { getMedallion, onMedallionReady } from "./medallion.js";
import {
  clamp,
  evaluate,
  FLOW_MODES,
  INITIAL_BROKEN,
  PRESETS,
  PRINCIPLE_NODES,
  SCENES,
} from "./model.js";

// 颜色全部逐像素采自 038 原海报
const COL = {
  cream: "#FDF3E8",
  creamSoft: "#FFF9F2",
  peachArch: "#FCDED3",
  ribbonMainA: "#F2B6A6",
  ribbonMainB: "#F8D4C7",
  ribbonMainC: "#FCE5DC",
  ribbonWarnA: "#DF7566",
  ribbonWarnB: "#F0A899",
  compStroke: "#EAA896",
  compWarn: "#C7433E",
  maroon: "#4B090B",
  maroonMid: "#6D2627",
  maroonLine: "rgba(91, 21, 22, 0.44)",
  coral: "#EE876E",
  coralDeep: "#B33324",
  iconBg: "#F7CBBF",
  iconBgWarn: "#F9D6D2",
  ok: "#15614B",
  okBg: "#E6F4EE",
  warn: "#B51F24",
  warnBg: "#FDEAE8",
  clay: "#CA8475",
  clayDeep: "#975749",
};

// 按法向量构造变宽丝带多边形并填充，真实还原 038 原海报粗细渐收的柔粉丝带
function drawVariableRibbon(ctx, pts, widths, W, H, minDim, fillStyle, strokeStyle) {
  const n = pts.length;
  if (n < 2) return;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    let dx = (next.u - prev.u) * W;
    let dy = (next.v - prev.v) * H;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    const hw = widths[i] * minDim * 0.5;
    const x = p.u * W;
    const y = p.v * H;
    left.push([x + nx * hw, y + ny * hw]);
    right.push([x - nx * hw, y - ny * hw]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// 沿着真实采样的 polyline 插值一点与切线方向，用于光滴和箭头
function sampleAlong(pts, tNorm) {
  const f = clamp(tNorm, 0, 1) * (pts.length - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(pts.length - 1, i0 + 1);
  const k = f - i0;
  const u = pts[i0].u + (pts[i1].u - pts[i0].u) * k;
  const v = pts[i0].v + (pts[i1].v - pts[i0].v) * k;
  const pA = pts[Math.max(0, i0 - 1)];
  const pB = pts[Math.min(pts.length - 1, i0 + 1)];
  return { u, v, du: pB.u - pA.u, dv: pB.v - pA.v };
}

function drawArrowhead(ctx, x, y, ang, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.72, -size * 0.54);
  ctx.lineTo(-size * 0.42, 0);
  ctx.lineTo(-size * 0.72, size * 0.54);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// 原海报 5 枚小圆徽内置矢量图标
function drawPrincipleGlyph(ctx, icon, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, r * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = r * 0.52;
  if (icon === "leaf") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, s * 0.75);
    ctx.quadraticCurveTo(-s * 0.8, -s * 0.65, s * 0.75, -s * 0.75);
    ctx.quadraticCurveTo(s * 0.7, s * 0.75, -s * 0.75, s * 0.75);
    ctx.fill();
    ctx.strokeStyle = "#F7CBBF";
    ctx.lineWidth = Math.max(1.1, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.55);
    ctx.lineTo(s * 0.32, -s * 0.32);
    ctx.stroke();
  } else if (icon === "wave") {
    for (const dy of [-s * 0.5, 0, s * 0.5]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, dy);
      ctx.bezierCurveTo(-s * 0.35, dy - s * 0.42, s * 0.35, dy + s * 0.42, s * 0.9, dy);
      ctx.stroke();
    }
  } else if (icon === "pulse") {
    const hs = [0.22, 0.55, 0.95, 0.45, 0.78, 0.32, 0.22];
    const step = (s * 1.8) / (hs.length - 1);
    hs.forEach((h, i) => {
      const px = -s * 0.9 + i * step;
      ctx.beginPath();
      ctx.moveTo(px, -s * h);
      ctx.lineTo(px, s * h);
      ctx.stroke();
    });
  } else if (icon === "spiral") {
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * Math.PI * 3.8;
      const rr = (i / 36) * s * 0.9;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 3 种场景的圆窗焦点主图：原海报实裁照片 / 护肤精华瓶 / 流线展馆拱厅
function drawFocalMedallion(ctx, scene, cx, cy, rad, ok, hovered) {
  ctx.save();
  // 外层原海报柔桃光晕圈
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 1.15, 0, Math.PI * 2);
  ctx.fillStyle = ok ? "rgba(247, 203, 191, 0.42)" : "rgba(238, 135, 110, 0.25)";
  ctx.fill();

  // 原海报外沿细虚线双弧箭
  ctx.save();
  ctx.strokeStyle = ok ? "rgba(91, 21, 22, 0.48)" : "rgba(181, 31, 36, 0.62)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 1.26, -Math.PI * 0.26, Math.PI * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 1.26, Math.PI * 0.72, Math.PI * 1.26);
  ctx.stroke();
  ctx.setLineDash([]);
  // 外弧两端小箭头
  const a1 = -Math.PI * 0.26;
  drawArrowhead(ctx, cx + Math.cos(a1) * rad * 1.26, cy + Math.sin(a1) * rad * 1.26, a1 - Math.PI / 2, 5.5, COL.maroonMid);
  const a2 = Math.PI * 0.28;
  drawArrowhead(ctx, cx + Math.cos(a2) * rad * 1.26, cy + Math.sin(a2) * rad * 1.26, a2 + Math.PI / 2, 5.5, COL.maroonMid);
  ctx.restore();

  // 柔和奶油白内描边
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF8F1";
  ctx.fill();

  // 主图裁切圆
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (scene === "poster") {
    const med = getMedallion();
    if (med) {
      ctx.drawImage(med, cx - rad, cy - rad, rad * 2, rad * 2);
    } else {
      // 极短加载期优雅兜底：陶瓶红花矢量态
      const g = ctx.createRadialGradient(cx - rad * 0.25, cy - rad * 0.25, rad * 0.1, cx, cy, rad);
      g.addColorStop(0, "#E4A495");
      g.addColorStop(1, "#BA7263");
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      ctx.fillStyle = "#F5E5DD";
      ctx.fillRect(cx - rad, cy + rad * 0.48, rad * 2, rad * 0.6);
      // 弯花枝
      ctx.strokeStyle = "#5B5536";
      ctx.lineWidth = Math.max(2, rad * 0.032);
      ctx.beginPath();
      ctx.moveTo(cx + rad * 0.18, cy + rad * 0.12);
      ctx.quadraticCurveTo(cx + rad * 0.04, cy - rad * 0.38, cx - rad * 0.34, cy - rad * 0.44);
      ctx.stroke();
      // 花头
      ctx.fillStyle = "#F08C74";
      ctx.beginPath();
      ctx.arc(cx - rad * 0.38, cy - rad * 0.42, rad * 0.20, 0, Math.PI * 2);
      ctx.fill();
      // 陶瓶
      ctx.fillStyle = "#E8B7A7";
      ctx.beginPath();
      ctx.ellipse(cx + rad * 0.20, cy + rad * 0.40, rad * 0.26, rad * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === "skincare") {
    // 护肤精华瓶 · 柔光暖陶背景
    const bg = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad);
    bg.addColorStop(0, "#F9E2D5");
    bg.addColorStop(0.65, "#E8B7A4");
    bg.addColorStop(1, "#C68371");
    ctx.fillStyle = bg;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    // 丝绸光弧背景
    ctx.strokeStyle = "rgba(255, 248, 240, 0.55)";
    ctx.lineWidth = rad * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx - rad * 1.1, cy + rad * 0.35);
    ctx.bezierCurveTo(cx - rad * 0.3, cy - rad * 0.5, cx + rad * 0.35, cy + rad * 0.55, cx + rad * 1.1, cy - rad * 0.2);
    ctx.stroke();
    // 托盘台面
    ctx.fillStyle = "#FDF4EC";
    ctx.fillRect(cx - rad, cy + rad * 0.46, rad * 2, rad * 0.6);
    // 磨砂琥珀精华瓶
    const bw = rad * 0.46;
    const bh = rad * 0.72;
    const bx = cx - bw * 0.5;
    const by = cy - bh * 0.22;
    const bottleG = ctx.createLinearGradient(bx, by, bx + bw, by);
    bottleG.addColorStop(0, "#8E3427");
    bottleG.addColorStop(0.38, "#CA6954");
    bottleG.addColorStop(1, "#5C1B17");
    ctx.fillStyle = bottleG;
    roundRect(ctx, bx, by, bw, bh, rad * 0.12);
    ctx.fill();
    // 瓶标（克制直线卡片）
    ctx.fillStyle = "#FDF5EC";
    ctx.fillRect(bx + bw * 0.14, by + bh * 0.26, bw * 0.72, bh * 0.46);
    ctx.fillStyle = "#4B090B";
    ctx.fillRect(bx + bw * 0.25, by + bh * 0.40, bw * 0.50, 2);
    ctx.fillStyle = "#B33324";
    ctx.fillRect(bx + bw * 0.32, by + bh * 0.52, bw * 0.36, 1.5);
    // 滴管盖
    ctx.fillStyle = "#3B1312";
    roundRect(ctx, cx - bw * 0.24, by - rad * 0.24, bw * 0.48, rad * 0.26, rad * 0.06);
    ctx.fill();
  } else {
    // 流线展馆 · 拱券中庭
    const bg = ctx.createLinearGradient(cx, cy - rad, cx, cy + rad);
    bg.addColorStop(0, "#F6E4DA");
    bg.addColorStop(0.6, "#E5C2B4");
    bg.addColorStop(1, "#B88476");
    ctx.fillStyle = bg;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    // 层叠流线建筑穹顶
    const layers = [
      { y: -0.32, amp: 0.36, col: "#FFF7F0" },
      { y: -0.06, amp: 0.40, col: "#F6D5C7" },
      { y: 0.22, amp: 0.32, col: "#DC9E8D" },
      { y: 0.48, amp: 0.24, col: "#8D4A3F" },
    ];
    layers.forEach((L) => {
      ctx.beginPath();
      ctx.moveTo(cx - rad * 1.1, cy + rad * 1.1);
      ctx.lineTo(cx - rad * 1.1, cy + rad * L.y);
      ctx.bezierCurveTo(
        cx - rad * 0.35,
        cy + rad * (L.y - L.amp),
        cx + rad * 0.35,
        cy + rad * (L.y + L.amp * 0.65),
        cx + rad * 1.1,
        cy + rad * (L.y - 0.14)
      );
      ctx.lineTo(cx + rad * 1.1, cy + rad * 1.1);
      ctx.closePath();
      ctx.fillStyle = L.col;
      ctx.fill();
    });
    // 远景人物剪影（无五官）
    ctx.fillStyle = "#3B0D10";
    ctx.beginPath();
    ctx.arc(cx + rad * 0.12, cy + rad * 0.46, rad * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + rad * 0.06, cy + rad * 0.72);
    ctx.quadraticCurveTo(cx + rad * 0.12, cy + rad * 0.50, cx + rad * 0.18, cy + rad * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 焦点外圈细环（拖移高亮）
  ctx.beginPath();
  ctx.arc(cx, cy, rad + 1, 0, Math.PI * 2);
  ctx.strokeStyle = hovered ? COL.maroon : ok ? "rgba(75, 9, 11, 0.32)" : COL.warn;
  ctx.lineWidth = hovered ? 2.6 : ok ? 1.5 : 2.2;
  ctx.stroke();

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 绘制画布上的交互式红色纠错小签（可点击就地修）
function drawActionPill(ctx, cx, cy, text, bg, fg, W, H) {
  ctx.save();
  ctx.font = '600 12px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(text).width;
  const pw = tw + 22;
  const ph = 26;
  const x = clamp(cx - pw / 2, 10, W - pw - 10);
  const y = clamp(cy - ph / 2, 10, H - ph - 10);
  roundRect(ctx, x, y, pw, ph, 13);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + pw / 2, y + ph / 2 + 0.5);
  ctx.restore();
  return { x, y, w: pw, h: ph };
}

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // 活体状态（从 0/4 错态起步，绝不先给答案）
  const state = {
    scene: INITIAL_BROKEN.scene,
    smooth: INITIAL_BROKEN.smooth,
    flowMode: INITIAL_BROKEN.flowMode,
    thicknessRatio: INITIAL_BROKEN.thicknessRatio,
    spacingGrad: INITIAL_BROKEN.spacingGrad,
    focus: { ...INITIAL_BROKEN.focus },
    terminal: { ...INITIAL_BROKEN.terminal },
  };

  let dropletsPlaying = true;
  let lastEval = evaluate(state);
  let hoverTarget = ""; // "focus" | "terminal" | "untangle" | "snapFocus" | ""
  let dragMode = ""; // "sweep" | "focus" | "terminal"
  let dragStart = null;
  let hitZones = { focus: null, terminal: null, untangle: null, snapFocus: null };

  // DOM 缓存
  const els = {
    archPath: document.getElementById("hero-arch-path"),
    subPath: document.getElementById("hero-sub-path"),
    topStatus: document.getElementById("hero-top-status"),
    diagCard: document.getElementById("diag-card"),
    diagBadge: document.getElementById("diag-badge"),
    diagHeadline: document.getElementById("diag-headline"),
    diagBody: document.getElementById("diag-body"),
    diagAction: document.getElementById("diag-action"),
    mSmooth: document.getElementById("m-smooth"),
    mRatio: document.getElementById("m-ratio"),
    mSpacing: document.getElementById("m-spacing"),
    mMiss: document.getElementById("m-miss"),
    mGrade: document.getElementById("m-grade"),
    kpDirectionTag: document.getElementById("kp-direction-tag"),
    kpThicknessTag: document.getElementById("kp-thickness-tag"),
    kpSpacingTag: document.getElementById("kp-spacing-tag"),
    kpEndpointTag: document.getElementById("kp-endpoint-tag"),
    kpRows: {
      direction: document.querySelector('[data-kp-row="direction"]'),
      thickness: document.querySelector('[data-kp-row="thickness"]'),
      spacing: document.querySelector('[data-kp-row="spacing"]'),
      endpoint: document.querySelector('[data-kp-row="endpoint"]'),
    },
    inSmooth: document.getElementById("in-smooth"),
    inSmoothVal: document.getElementById("in-smooth-val"),
    inRatio: document.getElementById("in-ratio"),
    inRatioVal: document.getElementById("in-ratio-val"),
    inSpacing: document.getElementById("in-spacing"),
    inSpacingVal: document.getElementById("in-spacing-val"),
    btnFlowBtns: [...document.querySelectorAll("[data-flow]")],
    btnScenes: [...document.querySelectorAll("[data-scene]")],
    btnPresets: [...document.querySelectorAll("[data-preset]")],
    btnSnapFocus: document.getElementById("btn-snap-focus"),
    btnMissFocus: document.getElementById("btn-miss-focus"),
    btnPause: document.getElementById("btn-droplet-toggle"),
    sceneNote: document.getElementById("hero-scene-note"),
  };

  // 同步刊头自示范活体大标「曲线构图」的弯拱曲率
  function syncHeaderArch() {
    if (!els.archPath || !els.subPath) return;
    // smooth=0 时近乎平直（y=86），smooth=1 时像 038 原海报一样向上舒展拱起（控制点 y=22）
    const bend = state.smooth * 54;
    const subBend = state.smooth * 44;
    const cy1 = (88 - bend).toFixed(1);
    const cy2 = (128 - subBend).toFixed(1);
    els.archPath.setAttribute("d", `M 24,96 Q 230,${cy1} 436,96`);
    els.subPath.setAttribute("d", `M 36,132 Q 230,${cy2} 424,132`);
  }

  function syncUI() {
    lastEval = evaluate(state);
    const { passedCount, allOk, checks, metrics, diagnosis } = lastEval;

    syncHeaderArch();

    // 顶栏状态徽
    if (els.topStatus) {
      els.topStatus.textContent = allOk ? "4/4 柔和贯通" : `${passedCount}/4 待理顺`;
      els.topStatus.dataset.ok = allOk ? "1" : "0";
    }

    // 诊单区
    if (els.diagCard) els.diagCard.dataset.ok = allOk ? "1" : "0";
    if (els.diagBadge) els.diagBadge.textContent = diagnosis.badge;
    if (els.diagHeadline) els.diagHeadline.textContent = diagnosis.headline;
    if (els.diagBody) els.diagBody.textContent = diagnosis.body;
    if (els.diagAction) els.diagAction.textContent = diagnosis.action;

    // 实测指标（全部来自 model.js 单真源）
    if (els.mSmooth) els.mSmooth.textContent = `${metrics.maxTurnDeg.toFixed(0)}° / ${metrics.smoothPct}%`;
    if (els.mRatio) els.mRatio.textContent = `${metrics.measuredRatio.toFixed(1)}×`;
    if (els.mSpacing) els.mSpacing.textContent = `${metrics.gapVarPct}%`;
    if (els.mMiss) els.mMiss.textContent = `${metrics.missPct}%`;
    if (els.mGrade) els.mGrade.textContent = `${metrics.flowGrade}（示意）`;

    // 左下原海报构图要点 4 行实时状态
    const setRow = (key, el, check) => {
      if (el) el.textContent = check.tag;
      const row = els.kpRows[key];
      if (row) row.dataset.ok = check.ok ? "1" : "0";
    };
    setRow("direction", els.kpDirectionTag, checks.direction);
    setRow("thickness", els.kpThicknessTag, checks.thickness);
    setRow("spacing", els.kpSpacingTag, checks.spacing);
    setRow("endpoint", els.kpEndpointTag, checks.endpoint);

    // 控件数值同步
    if (els.inSmooth) els.inSmooth.value = String(Math.round(state.smooth * 100));
    if (els.inSmoothVal) els.inSmoothVal.textContent = `${Math.round(state.smooth * 100)}%`;
    if (els.inRatio) els.inRatio.value = String(Math.round(state.thicknessRatio * 100));
    if (els.inRatioVal) els.inRatioVal.textContent = `${state.thicknessRatio.toFixed(1)}×`;
    if (els.inSpacing) els.inSpacing.value = String(Math.round(state.spacingGrad));
    if (els.inSpacingVal) els.inSpacingVal.textContent = `${Math.round(state.spacingGrad)}%`;

    els.btnFlowBtns.forEach((b) => {
      const on = b.dataset.flow === state.flowMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    els.btnScenes.forEach((b) => {
      const on = b.dataset.scene === state.scene;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (els.sceneNote) els.sceneNote.textContent = SCENES[state.scene].caption;
  }

  let cssW = 800;
  let cssH = 440;
  let curDpr = 1;
  // 双层离屏缓存：bgLayer 缓存宣纸底与 5 枚原理圆徽文字；sceneLayer 缓存静态丝带与主图
  // 常规播放每帧只需 1 次 drawImage + 3 颗光滴，软件渲染与慢手机均可稳守 ≥ 55 fps
  const bgLayer = document.createElement("canvas");
  const bgCtx = bgLayer.getContext("2d");
  const sceneLayer = document.createElement("canvas");
  const sceneCtx = sceneLayer.getContext("2d");
  let bgKey = "";
  let sceneDirty = true;
  let uiDirty = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = pixelRatio(window.innerWidth < 768 ? 1.5 : 2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph || cssW !== rect.width || cssH !== rect.height || curDpr !== dpr) {
      cssW = rect.width;
      cssH = rect.height;
      curDpr = dpr;
      canvas.width = pw;
      canvas.height = ph;
      bgLayer.width = pw;
      bgLayer.height = ph;
      sceneLayer.width = pw;
      sceneLayer.height = ph;
      bgKey = "";
      sceneDirty = true;
      return true;
    }
    return false;
  }

  function ensureBgLayer(W, H, compact, principleStatus) {
    const nextKey = `${W}x${H}@${curDpr}:${PRINCIPLE_NODES.map((n) => (principleStatus[n.id] ? "1" : "0")).join("")}`;
    if (bgKey === nextKey) return;
    bgKey = nextKey;
    const g = bgCtx;
    g.setTransform(curDpr, 0, 0, curDpr, 0, 0);

    // 1. 原海报暖杏宣纸开放底面 + 顶部与右下柔桃弧晕
    g.fillStyle = COL.cream;
    g.fillRect(0, 0, W, H);

    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, H * 0.24);
    g.quadraticCurveTo(W * 0.54, H * 0.02, 0, H * 0.30);
    g.closePath();
    g.fillStyle = "rgba(252, 222, 211, 0.56)";
    g.fill();

    g.beginPath();
    g.moveTo(W * 0.62, H);
    g.quadraticCurveTo(W * 0.78, H * 0.76, W, H * 0.68);
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = "rgba(252, 222, 211, 0.34)";
    g.fill();

    // 2. 5 枚原海报圆徽与中文/英文标签（离屏缓存，避免每帧重复光栅化文字）
    PRINCIPLE_NODES.forEach((node) => {
      const nx = node.u * W;
      const ny = node.v * H;
      const ok = principleStatus[node.id];
      const nr = compact ? 16 : 21;

      g.beginPath();
      g.arc(nx, ny, nr, 0, Math.PI * 2);
      g.fillStyle = ok ? COL.iconBg : COL.iconBgWarn;
      g.fill();
      g.strokeStyle = ok ? "rgba(75, 9, 11, 0.18)" : "rgba(181, 31, 36, 0.55)";
      g.lineWidth = ok ? 1 : 1.5;
      g.stroke();

      drawPrincipleGlyph(g, node.icon, nx, ny, nr, ok ? COL.maroon : COL.warn);

      g.textBaseline = "middle";
      if (compact) {
        g.font = '600 11px "Noto Sans SC", sans-serif';
        g.fillStyle = ok ? COL.maroon : COL.warn;
        g.textAlign = "center";
        g.fillText(node.title, nx, ny + nr + 11);
      } else {
        const alignRight = node.u > 0.78;
        const tx = alignRight ? nx - nr - 10 : nx + nr + 10;
        g.textAlign = alignRight ? "right" : "left";
        g.font = '700 13px "Noto Sans SC", sans-serif';
        g.fillStyle = ok ? COL.maroon : COL.warn;
        g.fillText(node.title, tx, ny - 6);
        g.font = '500 10px "Outfit", sans-serif';
        g.fillStyle = ok ? "#7E4A49" : COL.warn;
        g.fillText(node.en, tx, ny + 9);
      }
    });
  }

  function rebuildSceneLayer(W, H, minDim, compact) {
    const ev = lastEval;
    const { ribbons, principleStatus, checks, metrics } = ev;
    ensureBgLayer(W, H, compact, principleStatus);

    const g = sceneCtx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(bgLayer, 0, 0);
    g.setTransform(curDpr, 0, 0, curDpr, 0, 0);

    const fx = state.focus.u * W;
    const fy = state.focus.v * H;
    const fRad = clamp(minDim * (compact ? 0.205 : 0.225), 54, 112);

    // 5 枚圆徽到焦点圆窗的柔和虚线弧联系
    PRINCIPLE_NODES.forEach((node) => {
      const nx = node.u * W;
      const ny = node.v * H;
      const ok = principleStatus[node.id];
      const dFocus = Math.hypot(nx - fx, ny - fy);
      if (dFocus < fRad + 26) return;
      g.beginPath();
      const mx = (nx + fx) * 0.5 + (ny - fy) * 0.14;
      const my = (ny + fy) * 0.5 - (nx - fx) * 0.14;
      g.moveTo(nx, ny);
      g.quadraticCurveTo(mx, my, fx + ((nx - fx) / (dFocus || 1)) * (fRad * 1.28), fy + ((ny - fy) / (dFocus || 1)) * (fRad * 1.28));
      g.strokeStyle = ok ? "rgba(109, 38, 39, 0.22)" : "rgba(181, 31, 36, 0.32)";
      g.lineWidth = 1;
      g.setLineDash([3, 4]);
      g.stroke();
    });
    g.setLineDash([]);

    // 两条伴随丝带与主丝带（单真源）
    const isTangled = state.flowMode === "tangled" || metrics.crossings > 0;
    const mainGrad = g.createLinearGradient(0, 0, W, H);
    if (!checks.direction.ok) {
      mainGrad.addColorStop(0, COL.ribbonWarnA);
      mainGrad.addColorStop(0.55, COL.ribbonWarnB);
      mainGrad.addColorStop(1, "#F4C2B5");
    } else {
      mainGrad.addColorStop(0, COL.ribbonMainA);
      mainGrad.addColorStop(0.55, COL.ribbonMainB);
      mainGrad.addColorStop(1, COL.ribbonMainC);
    }

    const comp1Color = isTangled ? "rgba(199, 67, 62, 0.66)" : "rgba(234, 168, 150, 0.68)";
    const comp2Color = "rgba(238, 178, 160, 0.56)";

    drawVariableRibbon(g, ribbons.comp2.pts, ribbons.comp2.widths, W, H, minDim, comp2Color, null);
    drawVariableRibbon(
      g,
      ribbons.comp1.pts,
      ribbons.comp1.widths,
      W,
      H,
      minDim,
      comp1Color,
      isTangled ? "rgba(155, 28, 32, 0.45)" : null
    );
    drawVariableRibbon(
      g,
      ribbons.main.pts,
      ribbons.main.widths,
      W,
      H,
      minDim,
      mainGrad,
      "rgba(180, 92, 78, 0.16)"
    );

    // 细酒红虚线引导弧
    g.beginPath();
    ribbons.main.pts.forEach((p, i) => {
      const x = p.u * W;
      const y = p.v * H;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.strokeStyle = checks.direction.ok ? "rgba(91, 21, 22, 0.36)" : "rgba(181, 31, 36, 0.55)";
    g.lineWidth = 1.25;
    g.setLineDash([5, 5]);
    g.stroke();
    g.setLineDash([]);

    // 中央真实原海报陶瓶花艺圆窗
    drawFocalMedallion(g, state.scene, fx, fy, fRad, checks.endpoint.ok, hoverTarget === "focus" || dragMode === "focus");
    hitZones.focus = { cx: fx, cy: fy, r: fRad + 6 };

    if (state.scene !== "poster" && !compact) {
      g.save();
      const bx = W - 188;
      const by = H - 64;
      g.fillStyle = "rgba(255, 249, 242, 0.88)";
      g.fillRect(bx, by, 170, 48);
      g.strokeStyle = "rgba(75, 9, 11, 0.45)";
      g.lineWidth = 1;
      g.strokeRect(bx, by, 170, 48);
      g.fillStyle = COL.maroon;
      g.font = '700 11px "Outfit", sans-serif';
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText(state.scene === "skincare" ? "SERUM NO.038 · 50ML" : "CURVE PAVILION · 05.12–08.30", bx + 10, by + 10);
      g.fillStyle = "#6B3637";
      g.font = '500 11px "Noto Sans SC", sans-serif';
      g.fillText(state.scene === "skincare" ? "直线铭牌稳住柔丝重心" : "直线展期锚定流线穹顶", bx + 10, by + 26);
      g.restore();
    }

    // 终点磁针手柄
    const tx = state.terminal.u * W;
    const ty = state.terminal.v * H;
    const endDistPx = Math.hypot(tx - fx, ty - fy);
    const termR = hoverTarget === "terminal" || dragMode === "terminal" ? 13 : 10.5;
    hitZones.terminal = { cx: tx, cy: ty, r: 22 };

    if (!checks.endpoint.ok) {
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(tx, ty);
      g.strokeStyle = "rgba(181, 31, 36, 0.72)";
      g.lineWidth = 1.6;
      g.setLineDash([4, 4]);
      g.stroke();
      g.setLineDash([]);
      const ang = Math.atan2(ty - fy, tx - fx);
      drawArrowhead(g, tx - Math.cos(ang) * 14, ty - Math.sin(ang) * 14, ang, 7, COL.warn);
    }

    if (endDistPx > 14 || hoverTarget === "terminal" || dragMode === "terminal") {
      g.beginPath();
      g.arc(tx, ty, termR, 0, Math.PI * 2);
      g.fillStyle = checks.endpoint.ok ? COL.ok : COL.warn;
      g.fill();
      g.strokeStyle = "#FFF9F2";
      g.lineWidth = 2.4;
      g.stroke();
      g.beginPath();
      g.arc(tx, ty, 3, 0, Math.PI * 2);
      g.fillStyle = "#FFF9F2";
      g.fill();
    }

    // 可点纠偏红标
    hitZones.untangle = null;
    hitZones.snapFocus = null;
    if (isTangled && metrics.crossPoint) {
      const px = metrics.crossPoint.u * W;
      const py = metrics.crossPoint.v * H;
      hitZones.untangle = drawActionPill(g, px, py - 18, `× 逆流打结 · 点此解结`, COL.warn, "#FFF9F2", W, H);
    }
    if (!checks.endpoint.ok && metrics.missPct > 9) {
      const pillX = compact ? tx - 44 : tx;
      hitZones.snapFocus = drawActionPill(g, pillX, ty - 26, `× 偏焦 ${metrics.missPct}% · 点此归焦`, COL.warn, "#FFF9F2", W, H);
    }

    // 左上轻巧单行实测胶囊
    const chipText = `柔滑 ${metrics.smoothPct}% · 粗细 ${metrics.measuredRatio.toFixed(1)}× · 间距 ${metrics.gapVarPct}%`;
    g.font = '500 11px "DM Mono", "Noto Sans SC", monospace';
    const cw = g.measureText(chipText).width + 20;
    roundRect(g, 12, 12, cw, 26, 13);
    g.fillStyle = "rgba(255, 249, 242, 0.88)";
    g.fill();
    g.strokeStyle = "rgba(75, 9, 11, 0.18)";
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = COL.maroon;
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.fillText(chipText, 22, 25.5);

    sceneDirty = false;
  }

  let phaseT = 0;

  function render(t, dt, { still }) {
    resize();
    if (uiDirty) {
      syncUI();
      uiDirty = false;
    }
    if (!still && dropletsPlaying) phaseT += dt;
    const W = cssW;
    const H = cssH;
    const minDim = Math.min(W, H);
    const compact = W < 540;

    if (sceneDirty) rebuildSceneLayer(W, H, minDim, compact);

    // 1. 一次整图拷贝静态层
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(sceneLayer, 0, 0);
    ctx.setTransform(curDpr, 0, 0, curDpr, 0, 0);

    // 2. 仅绘制 3 颗沿主丝带滑行的视线光滴（极低绘制开销）
    const { ribbons, checks } = lastEval;
    const speed = checks.direction.ok ? 0.22 : 0.15;
    const basePhase = still ? 0.38 : (phaseT * speed) % 1;
    const rDot = compact ? 4.2 : 5.2;
    const haloCol = checks.direction.ok ? "rgba(238, 135, 110, 0.28)" : "rgba(181, 31, 36, 0.26)";
    const coreCol = checks.direction.ok ? COL.maroon : COL.warn;

    for (let k = 0; k < 3; k++) {
      const uT = (basePhase + k * 0.33) % 1;
      const sp = sampleAlong(ribbons.main.pts, uT);
      const px = sp.u * W;
      const py = sp.v * H;
      ctx.beginPath();
      ctx.arc(px, py, rDot * 1.85, 0, Math.PI * 2);
      ctx.fillStyle = haloCol;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, rDot, 0, Math.PI * 2);
      ctx.fillStyle = coreCol;
      ctx.fill();
    }
  }

  const stage = loop(canvas, render);

  function update(deferDraw = false) {
    sceneDirty = true;
    if (deferDraw && !reducedMotion.matches && dropletsPlaying) {
      // 拖动中合并到下一 rAF 帧统一更新 DOM 与画布，杜绝单帧双画
      uiDirty = true;
      return;
    }
    syncUI();
    uiDirty = false;
    stage.draw();
  }

  onMedallionReady(() => {
    sceneDirty = true;
    stage.draw();
  });

  // ---------- 指针与触摸交互（保证手机竖滑不卡页面、横拖顺滑 60fps） ----------
  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top, w: r.width, h: r.height };
  }

  function inRect(pt, rect) {
    return rect && pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
  }

  function hitTest(pt) {
    if (inRect(pt, hitZones.untangle)) return "untangle";
    if (inRect(pt, hitZones.snapFocus)) return "snapFocus";
    if (hitZones.terminal && Math.hypot(pt.x - hitZones.terminal.cx, pt.y - hitZones.terminal.cy) <= hitZones.terminal.r) {
      return "terminal";
    }
    if (hitZones.focus && Math.hypot(pt.x - hitZones.focus.cx, pt.y - hitZones.focus.cy) <= hitZones.focus.r) {
      return "focus";
    }
    return "sweep";
  }

  function startPointer(pt, isTouch) {
    const hit = hitTest(pt);
    if (hit === "untangle") {
      state.flowMode = "organic";
      update();
      return false;
    }
    if (hit === "snapFocus") {
      state.terminal = { u: state.focus.u, v: state.focus.v };
      update();
      return false;
    }
    dragMode = isTouch && hit === "sweep" ? "pending-sweep" : hit;
    dragStart = { x: pt.x, y: pt.y, smooth0: state.smooth, w: pt.w, h: pt.h };
    return hit === "focus" || hit === "terminal";
  }

  function movePointer(pt) {
    if (!dragMode || !dragStart) {
      hoverTarget = hitTest(pt);
      canvas.style.cursor =
        hoverTarget === "untangle" || hoverTarget === "snapFocus"
          ? "pointer"
          : hoverTarget === "focus" || hoverTarget === "terminal"
            ? "grab"
            : "ew-resize";
      return false;
    }
    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (dragMode === "pending-sweep") {
      if (Math.hypot(dx, dy) < 6) return false;
      if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
        dragMode = "sweep";
      } else {
        dragMode = "";
        dragStart = null;
        return false;
      }
    }
    if (dragMode === "sweep") {
      // 横拖直接连续熨平/折硬曲线，支持全幅单手操作
      const span = Math.max(140, dragStart.w * 0.55);
      state.smooth = clamp(dragStart.smooth0 + dx / span, 0.04, 1);
      update(true);
      return true;
    }
    if (dragMode === "terminal") {
      let u = clamp(pt.x / pt.w, 0.08, 0.92);
      let v = clamp(pt.y / pt.h, 0.08, 0.92);
      // 靠近焦点圆心时轻轻吸附
      if (Math.hypot(u - state.focus.u, v - state.focus.v) < 0.055) {
        u = state.focus.u;
        v = state.focus.v;
      }
      state.terminal = { u, v };
      update(true);
      return true;
    }
    if (dragMode === "focus") {
      const wasLocked = Math.hypot(state.terminal.u - state.focus.u, state.terminal.v - state.focus.v) < 0.025;
      const u = clamp(pt.x / pt.w, 0.12, 0.88);
      const v = clamp(pt.y / pt.h, 0.12, 0.88);
      state.focus = { u, v };
      if (wasLocked) state.terminal = { u, v };
      update(true);
      return true;
    }
    return false;
  }

  function endPointer() {
    if (dragMode) {
      dragMode = "";
      dragStart = null;
      update(false);
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    startPointer(toLocal(e), false);
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragMode) {
      const r = canvas.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        movePointer({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
      }
      return;
    }
    movePointer(toLocal(e));
  });
  window.addEventListener("mouseup", endPointer);

  // 原生 touch 事件（兼容 tools/perf.mjs 的 dispatchTouchEvent 与真机触屏）
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const locked = startPointer(toLocal(e), true);
      if (locked) e.preventDefault();
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length || !dragMode) return;
      const consumed = movePointer(toLocal(e));
      if (consumed) e.preventDefault();
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", endPointer);
  canvas.addEventListener("touchcancel", endPointer);

  // 键盘无障碍操作
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) state.terminal.u = clamp(state.terminal.u + 0.04, 0.08, 0.92);
      else state.smooth = clamp(state.smooth + 0.08, 0.04, 1);
      update();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.shiftKey) state.terminal.u = clamp(state.terminal.u - 0.04, 0.08, 0.92);
      else state.smooth = clamp(state.smooth - 0.08, 0.04, 1);
      update();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (e.shiftKey) state.terminal.v = clamp(state.terminal.v - 0.04, 0.08, 0.92);
      else state.thicknessRatio = clamp(state.thicknessRatio + 0.25, 1.0, 5.2);
      update();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (e.shiftKey) state.terminal.v = clamp(state.terminal.v + 0.04, 0.08, 0.92);
      else state.thicknessRatio = clamp(state.thicknessRatio - 0.25, 1.0, 5.2);
      update();
    } else if (e.key === " ") {
      e.preventDefault();
      dropletsPlaying = !dropletsPlaying;
      if (els.btnPause) {
        els.btnPause.textContent = dropletsPlaying ? "暂停光滴" : "流动光滴";
        els.btnPause.setAttribute("aria-pressed", String(!dropletsPlaying));
      }
      stage.draw();
    }
  });

  // ---------- 绑定构图要点卡片与预设控件 ----------
  els.inSmooth?.addEventListener("input", () => {
    state.smooth = clamp(Number(els.inSmooth.value) / 100, 0.04, 1);
    update();
  });
  els.inRatio?.addEventListener("input", () => {
    state.thicknessRatio = clamp(Number(els.inRatio.value) / 100, 1.0, 5.2);
    update();
  });
  els.inSpacing?.addEventListener("input", () => {
    state.spacingGrad = clamp(Number(els.inSpacing.value), 0, 100);
    update();
  });
  els.btnFlowBtns.forEach((b) => {
    b.addEventListener("click", () => {
      if (FLOW_MODES[b.dataset.flow]) {
        state.flowMode = b.dataset.flow;
        update();
      }
    });
  });
  els.btnScenes.forEach((b) => {
    b.addEventListener("click", () => {
      if (SCENES[b.dataset.scene]) {
        state.scene = b.dataset.scene;
        update();
      }
    });
  });
  els.btnSnapFocus?.addEventListener("click", () => {
    state.focus = { u: clamp(state.focus.u, 0.24, 0.76), v: clamp(state.focus.v, 0.24, 0.76) };
    state.terminal = { u: state.focus.u, v: state.focus.v };
    update();
  });
  els.btnMissFocus?.addEventListener("click", () => {
    state.terminal = { u: 0.85, v: 0.84 };
    update();
  });
  els.btnPresets.forEach((b) => {
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.preset];
      if (!p) return;
      state.smooth = p.state.smooth;
      state.flowMode = p.state.flowMode;
      state.thicknessRatio = p.state.thicknessRatio;
      state.spacingGrad = p.state.spacingGrad;
      state.focus = { ...p.state.focus };
      state.terminal = { ...p.state.terminal };
      update();
    });
  });
  els.btnPause?.addEventListener("click", () => {
    dropletsPlaying = !dropletsPlaying;
    els.btnPause.textContent = dropletsPlaying ? "暂停光滴" : "流动光滴";
    els.btnPause.setAttribute("aria-pressed", String(!dropletsPlaying));
    stage.draw();
  });

  window.addEventListener("resize", () => {
    sceneDirty = true;
    stage.draw();
  });

  // 初始同步并首帧渲染
  syncUI();
  stage.draw();
  if (reducedMotion.matches) stage.draw();
}
