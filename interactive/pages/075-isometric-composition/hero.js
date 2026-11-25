// 075 等距构图 · 开场「等角模块化搭积木 × 三轴校准台」渲染与直操引擎
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  ISO_PITCH,
  ISO_YAWS,
  PRESETS,
  clonePresetVoxels,
  createInitialState,
  diagnose,
  normAngle,
  projectPoint,
  snapAngles,
  viewVector,
} from "./model.js";

const PALETTE = {
  bg: "#92F7DF",
  grid: "rgba(18, 128, 104, 0.24)",
  gridIso: "rgba(83, 18, 166, 0.22)",
  ink: "#070C14",
  cream: "#FAF5CE",
  creamShade: "#EFE8B3",
  violet: "#7C28E6",
  violetDark: "#5E19B8",
  mint: "#3DB698",
  mintDark: "#2A8F76",
  indigo: "#141842",
  indigoMid: "#222966",
  err: "#B31B34",
  errSoft: "rgba(179, 27, 52, 0.16)",
  ok: "#0F5E4B",
};

// 按三面在屏幕上的朝向稳定分配原海报三色明暗纪律（顶亮、左深、右中）
function faceColor(tone, dir, rightSign, leftSign) {
  if (dir === "py") {
    if (tone === "indigo") return "#2B3275";
    return PALETTE.cream;
  }
  const isLeftFace = dir === leftSign;
  if (tone === "cream") {
    return isLeftFace ? "#F4EEC1" : "#3DB698";
  }
  if (tone === "indigo") {
    return isLeftFace ? "#141842" : "#222966";
  }
  if (tone === "violet") {
    return isLeftFace ? PALETTE.violet : PALETTE.mint;
  }
  // mint 块保持左紫右翠或左翠暗右翠明，统一海报紫+翠+奶的节奏
  return isLeftFace ? PALETTE.violet : PALETTE.mint;
}

// 2D 仿射变换在任意投影平行四边形面上绘制原海报立体字（「等」「距」「构」「图」）
function drawFaceGlyph(ctx, char, pTL, pTR, pBL, fillColor) {
  const ux = pTR.sx - pTL.sx;
  const uy = pTR.sy - pTL.sy;
  const vx = pBL.sx - pTL.sx;
  const vy = pBL.sy - pTL.sy;
  const area = Math.abs(ux * vy - uy * vx);
  if (area < 120) return;

  ctx.save();
  ctx.transform(ux / 100, uy / 100, vx / 100, vy / 100, pTL.sx, pTL.sy);
  ctx.fillStyle = fillColor;
  ctx.font = '900 72px "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, 50, 54);
  ctx.restore();
}

// 2D 点是否在凸多边形内（用于精确射线拾取任意点击的方块面）
function pointInPoly(px, py, pts) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const cross = (b.sx - a.sx) * (py - a.sy) - (b.sy - a.sy) * (px - a.sx);
    if (Math.abs(cross) < 1e-4) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (sign !== s) return false;
  }
  return sign !== 0;
}

// 2D 投影后的有向面积（判断面是否朝向观察者）
function signedArea2D(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.sx * b.sy - b.sx * a.sy;
  }
  return sum * 0.5;
}

// 绘制单个标准体素（支持普通块、拱门、阶梯、偏轴游离块）
function buildVoxelFaces(v, center, projOpts, extraRotY = 0, animScale = 1) {
  const { x, y, z, tone, arch, stair, glyphLeft, glyphRight } = v;
  const localPts = (dx, dy, dz) => {
    const lx = (dx - 0.5) * animScale;
    const ly = (dy - 0.5) * animScale;
    const lz = (dz - 0.5) * animScale;
    let rx = lx;
    let rz = lz;
    if (extraRotY !== 0) {
      const c = Math.cos(extraRotY);
      const s = Math.sin(extraRotY);
      rx = lx * c - lz * s;
      rz = lx * s + lz * c;
    }
    return projectPoint(
      {
        x: x + 0.5 + rx - center.x,
        y: y + 0.5 + ly - center.y,
        z: z + 0.5 + rz - center.z,
      },
      projOpts
    );
  };

  // 若是阶梯模块，拆成 4 级等距台阶子盒，视觉 1:1 呼应原海报
  if (stair) {
    const steps = [];
    for (let i = 0; i < 4; i++) {
      const h0 = 0;
      const h1 = (4 - i) / 4;
      const z0 = i / 4;
      const z1 = (i + 1) / 4;
      steps.push(buildBoxFaces(localPts, 0, 1, h0, h1, z0, z1, tone, v, false, null, null, projOpts));
    }
    return steps.flat();
  }

  return buildBoxFaces(localPts, 0, 1, 0, 1, 0, 1, tone, v, arch, glyphLeft, glyphRight, projOpts);
}

function buildBoxFaces(localPts, x0, x1, y0, y1, z0, z1, tone, voxel, arch, glyphLeft, glyphRight, projOpts) {
  const p000 = localPts(x0, y0, z0);
  const p100 = localPts(x1, y0, z0);
  const p110 = localPts(x1, y1, z0);
  const p010 = localPts(x0, y1, z0);
  const p001 = localPts(x0, y0, z1);
  const p101 = localPts(x1, y0, z1);
  const p111 = localPts(x1, y1, z1);
  const p011 = localPts(x0, y1, z1);

  // 决定当前视向下哪个方向算“左面”、哪个算“右面”
  const vv = viewVector(projOpts.yaw, projOpts.pitch);
  const visX = vv.x >= 0 ? "px" : "nx";
  const visZ = vv.z >= 0 ? "pz" : "nz";
  // 比较 +X 中心与 +Z 中心的屏幕 X 坐标以区分视觉左/右面
  const cxPos = (p100.sx + p111.sx) * 0.5;
  const czPos = (p001.sx + p111.sx) * 0.5;
  const rightDir = (visX === "px" ? cxPos : (p000.sx + p011.sx) * 0.5) >= (visZ === "pz" ? czPos : (p000.sx + p110.sx) * 0.5) ? visX : visZ;
  const leftDir = rightDir === visX ? visZ : visX;

  // 顶点顺序统一满足从外看逆时针（在屏幕 +Y 向下坐标系下 signedArea2D < 0 为朝向观察者）
  const rawFaces = [
    { dir: "py", normal: [0, 1, 0], pts: [p010, p011, p111, p110], glyph: null },
    { dir: "px", normal: [1, 0, 0], pts: [p111, p101, p100, p110], glyph: glyphRight || null },
    { dir: "nx", normal: [-1, 0, 0], pts: [p010, p000, p001, p011], glyph: null },
    { dir: "pz", normal: [0, 0, 1], pts: [p011, p001, p101, p111], glyph: glyphLeft || null },
    { dir: "nz", normal: [0, 0, -1], pts: [p110, p100, p000, p010], glyph: null },
  ];

  const out = [];
  for (const f of rawFaces) {
    if (signedArea2D(f.pts) >= -0.5) continue; // 背面剔除
    const color = faceColor(tone, f.dir, rightDir, leftDir);
    out.push({
      ...f,
      color,
      voxel,
      arch: arch && f.dir === leftDir,
    });
  }
  return out;
}

export function initHero() {
  const canvas = document.getElementById("iso-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  let state = createInitialState("poster");
  let hoverHit = null;
  let popMap = new Map(); // key -> { t0 }
  let introT = 0;

  // UI 元素
  const ui = {
    statusBadge: document.getElementById("hero-status-badge"),
    mobileMiniAngles: document.getElementById("mobile-mini-angles"),
    diagBadge: document.getElementById("diag-badge"),
    diagTitle: document.getElementById("diag-title"),
    diagBody: document.getElementById("diag-body"),
    diagTip: document.getElementById("diag-tip"),
    diagCard: document.getElementById("diag-card"),
    mAngles: document.getElementById("m-angles"),
    mScale: document.getElementById("m-scale"),
    mRatio: document.getElementById("m-ratio"),
    mBlocks: document.getElementById("m-blocks"),
    // 原海报右上活体 120° 三轴量角器 SVG
    triAxisSvg: document.getElementById("tri-axis-svg"),
    triCaption: document.getElementById("tri-caption"),
    triScaleBar: document.getElementById("tri-scale-readout"),
    // 标题旁自示范迷你立方体 SVG
    titleCubeSvg: document.getElementById("title-cube-svg"),
    // 左侧四枚原海报紫环要点实况
    ptAngle: document.getElementById("pt-angle-state"),
    ptScale: document.getElementById("pt-scale-state"),
    ptModule: document.getElementById("pt-module-state"),
    ptSystem: document.getElementById("pt-system-state"),
    // 右缘「等距逻辑」引注状态
    logicStatus: document.getElementById("logic-status"),
    // 控件
    perspRange: document.getElementById("ctrl-persp"),
    perspVal: document.getElementById("ctrl-persp-val"),
    pitchRange: document.getElementById("ctrl-pitch"),
    pitchVal: document.getElementById("ctrl-pitch-val"),
    yawRange: document.getElementById("ctrl-yaw"),
    yawVal: document.getElementById("ctrl-yaw-val"),
    btnFixRogue: document.getElementById("btn-fix-rogue"),
    btnGrid: document.getElementById("btn-toggle-grid"),
    btnToolAdd: document.getElementById("btn-tool-add"),
    btnToolRemove: document.getElementById("btn-tool-remove"),
    presetBtns: [...document.querySelectorAll("[data-hero-preset]")],
    actionBtns: [...document.querySelectorAll("[data-hero-action]")],
  };

  let hitList = []; // 最后一帧按绘制顺序保存的可点击面列表
  let lastUnitScale = 56;
  let dpr = 1;
  let cssW = 720;
  let cssH = 480;

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(240, Math.round(r.width));
    cssH = Math.max(200, Math.round(r.height));
    dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    lastUnitScale = Math.min(cssW / 7.2, cssH / 6.2);
  }

  // 更新标题旁自示范迷你立方体 SVG（真按当前投影矩阵变形状）
  function updateTitleCube() {
    if (!ui.titleCubeSvg) return;
    const opts = { yaw: state.yaw, pitch: state.pitch, persp: state.persp * 0.6, scale: 17, cx: 24, cy: 25 };
    const pt = (x, y, z) => projectPoint({ x: x - 0.5, y: y - 0.5, z: z - 0.5 }, opts);
    const faces = buildBoxFaces(pt, 0, 1, 0, 1, 0, 1, "violet", null, false, null, null, opts);
    ui.titleCubeSvg.innerHTML = faces
      .map(
        (f) =>
          `<polygon points="${f.pts.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ")}" fill="${f.color}" stroke="#070C14" stroke-width="1.3" stroke-linejoin="round"/>`
      )
      .join("");
  }

  // 更新原海报右上细虚线框「等角原理」120° 活体三轴量角器
  function updateTriAxis(diag) {
    if (!ui.triAxisSvg) return;
    const cx = 86;
    const cy = 62;
    const R = 48;
    const { aY, rightAxis, leftAxis, angYR, angYL, angRL } = diag.axes;

    const end = (a) => ({ x: cx + a.dx * R, y: cy + a.dy * R });
    const eY = end(aY);
    const eR = end(rightAxis);
    const eL = end(leftAxis);

    const arrowHead = (p) => {
      const ang = Math.atan2(p.y - cy, p.x - cx);
      const len = 7.5;
      const a1 = ang + 2.65;
      const a2 = ang - 2.65;
      return `M${(p.x + Math.cos(a1) * len).toFixed(1)},${(p.y + Math.sin(a1) * len).toFixed(1)} L${p.x.toFixed(1)},${p.y.toFixed(1)} L${(p.x + Math.cos(a2) * len).toFixed(1)},${(p.y + Math.sin(a2) * len).toFixed(1)}`;
    };

    const ringStroke = diag.okAngles ? "#0F5E4B" : "#7C28E6";
    const lblColor = diag.okAngles ? "#0F5E4B" : "#5312A6";

    ui.triAxisSvg.innerHTML = `
      <circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${ringStroke}" stroke-width="1.2" stroke-dasharray="3 2.5"/>
      <line x1="${cx}" y1="${cy}" x2="${eY.x.toFixed(1)}" y2="${eY.y.toFixed(1)}" stroke="#070C14" stroke-width="1.8"/>
      <line x1="${cx}" y1="${cy}" x2="${eR.x.toFixed(1)}" y2="${eR.y.toFixed(1)}" stroke="#070C14" stroke-width="1.8"/>
      <line x1="${cx}" y1="${cy}" x2="${eL.x.toFixed(1)}" y2="${eL.y.toFixed(1)}" stroke="#070C14" stroke-width="1.8"/>
      <path d="${arrowHead(eY)} ${arrowHead(eR)} ${arrowHead(eL)}" fill="none" stroke="#070C14" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${cx}" cy="${cy}" r="2.6" fill="#070C14"/>
      <text x="${cx + 30}" y="${cy - 18}" fill="${lblColor}" font-family="'Space Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">${angYR.toFixed(0)}°</text>
      <text x="${cx - 30}" y="${cy - 18}" fill="${lblColor}" font-family="'Space Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">${angYL.toFixed(0)}°</text>
      <text x="${cx}" y="${cy + 36}" fill="${lblColor}" font-family="'Space Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">${angRL.toFixed(0)}°</text>
    `;

    if (ui.triCaption) {
      ui.triCaption.textContent = diag.okAngles
        ? "三轴已锁死 120° · 缩短比同为 0.816"
        : `当前 ${angYR.toFixed(0)}° / ${angYL.toFixed(0)}° / ${angRL.toFixed(0)}° · 尚未等角`;
    }
    if (ui.triScaleBar) {
      ui.triScaleBar.textContent = `轴比 ${diag.axes.scaleY.toFixed(2)} : ${diag.axes.scaleR.toFixed(2)} : ${diag.axes.scaleL.toFixed(2)}`;
    }
  }

  function syncUI() {
    const diag = diagnose(state, lastUnitScale);

    if (ui.statusBadge) {
      ui.statusBadge.textContent = diag.badge;
      ui.statusBadge.dataset.state = diag.severity;
    }
    if (ui.mobileMiniAngles) {
      ui.mobileMiniAngles.textContent = `${diag.axes.angYR.toFixed(0)}°/${diag.axes.angYL.toFixed(0)}° · 汇聚 ${Math.round(state.persp * 100)}%`;
    }
    if (ui.diagCard) ui.diagCard.dataset.state = diag.severity;
    if (ui.diagBadge) ui.diagBadge.textContent = diag.badge;
    if (ui.diagTitle) ui.diagTitle.textContent = diag.headline;
    if (ui.diagBody) ui.diagBody.textContent = diag.body;
    if (ui.diagTip) ui.diagTip.textContent = diag.nextTip;

    if (ui.mAngles) {
      ui.mAngles.textContent = `${diag.axes.angYR.toFixed(0)}° / ${diag.axes.angYL.toFixed(0)}° / ${diag.axes.angRL.toFixed(0)}°`;
      ui.mAngles.dataset.state = diag.okAngles ? "ok" : "err";
    }
    if (ui.mScale) {
      ui.mScale.textContent = `${diag.axes.scaleY.toFixed(2)} : ${diag.axes.scaleR.toFixed(2)} : ${diag.axes.scaleL.toFixed(2)}`;
      ui.mScale.dataset.state = diag.okAngles ? "ok" : "err";
    }
    if (ui.mRatio) {
      ui.mRatio.textContent = `${diag.fb.ratio.toFixed(2)} : 1`;
      ui.mRatio.dataset.state = diag.okPersp ? "ok" : "err";
    }
    if (ui.mBlocks) {
      ui.mBlocks.textContent = `${state.voxels.length + (state.rogueFixed ? 0 : 1)} 块 · ${state.rogueFixed ? "全贴网" : "1 偏轴"}`;
      ui.mBlocks.dataset.state = diag.okModular ? "ok" : "err";
    }

    if (ui.ptAngle) {
      ui.ptAngle.textContent = diag.okAngles ? "120° 锁定" : `偏 ${diag.axes.maxAngleDev.toFixed(0)}°`;
      ui.ptAngle.dataset.state = diag.okAngles ? "ok" : "err";
    }
    if (ui.ptScale) {
      ui.ptScale.textContent = diag.okPersp ? "1.00 : 1" : `近大 ${diag.fb.ratio.toFixed(2)}×`;
      ui.ptScale.dataset.state = diag.okPersp ? "ok" : "err";
    }
    if (ui.ptModule) {
      ui.ptModule.textContent = diag.okModular ? `${state.voxels.length} 块对齐` : "1 块偏 +18°";
      ui.ptModule.dataset.state = diag.okModular ? "ok" : "err";
    }
    if (ui.ptSystem) {
      ui.ptSystem.textContent = diag.score === 3 ? "可扩展" : `${diag.score}/3 就绪`;
      ui.ptSystem.dataset.state = diag.score === 3 ? "ok" : "err";
    }
    if (ui.logicStatus) {
      ui.logicStatus.textContent = diag.okPersp && diag.okModular ? "三轴全平行" : diag.okPersp ? "仍有 1 块偏轴" : "存在透视收敛";
      ui.logicStatus.dataset.state = diag.okPersp && diag.okModular ? "ok" : "err";
    }

    if (ui.perspRange) ui.perspRange.value = String(Math.round(state.persp * 100));
    if (ui.perspVal) ui.perspVal.textContent = `${Math.round(state.persp * 100)}%`;
    if (ui.pitchRange) ui.pitchRange.value = String(state.pitch.toFixed(1));
    if (ui.pitchVal) ui.pitchVal.textContent = `${state.pitch.toFixed(1)}°`;
    if (ui.yawRange) ui.yawRange.value = String(Math.round(normAngle(state.yaw)));
    if (ui.yawVal) ui.yawVal.textContent = `${Math.round(normAngle(state.yaw))}°`;

    if (ui.btnFixRogue) {
      ui.btnFixRogue.disabled = state.rogueFixed;
      ui.btnFixRogue.textContent = state.rogueFixed ? "偏轴块已归位" : "归位偏轴块 (+18°)";
    }
    if (ui.btnGrid) {
      ui.btnGrid.setAttribute("aria-pressed", String(state.showGrid));
      ui.btnGrid.textContent = state.showGrid ? "等角网格：开" : "等角网格：关";
    }
    if (ui.btnToolAdd && ui.btnToolRemove) {
      ui.btnToolAdd.setAttribute("aria-pressed", String(state.tool === "add"));
      ui.btnToolRemove.setAttribute("aria-pressed", String(state.tool === "remove"));
    }
    for (const b of ui.presetBtns) {
      b.setAttribute("aria-pressed", String(b.dataset.heroPreset === state.preset));
    }

    updateTitleCube();
    updateTriAxis(diag);
  }

  function render(t, dt, { still }) {
    resize();
    if (!still) introT = Math.min(1, introT + (dt || 0) * 1.6);
    else introT = 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 原海报薄荷青蓝图纸底色
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const preset = PRESETS[state.preset] || PRESETS.poster;
    const center = preset.center;
    const unitScale = Math.min(cssW / 7.2, cssH / 6.2);
    lastUnitScale = unitScale;
    const cx = cssW * 0.5;
    const cy = cssH * 0.54;
    const projOpts = { yaw: state.yaw, pitch: state.pitch, persp: state.persp, scale: unitScale, cx, cy };

    const diag = diagnose(state, unitScale);

    // 2. 地面 30°/150° 等角蓝图网格（与实绘世界地板共投影，单真源）
    if (state.showGrid) {
      ctx.save();
      ctx.strokeStyle = diag.okAngles && diag.okPersp ? PALETTE.gridIso : PALETTE.grid;
      ctx.lineWidth = 1;
      const gMin = -2;
      const gMax = 5;
      for (let i = gMin; i <= gMax; i++) {
        const a1 = projectPoint({ x: i - center.x, y: -center.y, z: gMin - center.z }, projOpts);
        const a2 = projectPoint({ x: i - center.x, y: -center.y, z: gMax - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(a1.sx, a1.sy);
        ctx.lineTo(a2.sx, a2.sy);
        ctx.stroke();

        const b1 = projectPoint({ x: gMin - center.x, y: -center.y, z: i - center.z }, projOpts);
        const b2 = projectPoint({ x: gMax - center.x, y: -center.y, z: i - center.z }, projOpts);
        ctx.beginPath();
        ctx.moveTo(b1.sx, b1.sy);
        ctx.lineTo(b2.sx, b2.sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. 若透视汇聚 > 2.5%，画出向外收拢的莓红透视警报线，直观暴露平行线失效
    if (state.persp > 0.025) {
      ctx.save();
      ctx.strokeStyle = "rgba(179, 27, 52, 0.52)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      const extPairs = [
        [
          { x: -center.x, y: 0 - center.y, z: -center.z },
          { x: 4.6 - center.x, y: 0 - center.y, z: -center.z },
        ],
        [
          { x: -center.x, y: 0 - center.y, z: 3 - center.z },
          { x: 4.6 - center.x, y: 0 - center.y, z: 3 - center.z },
        ],
        [
          { x: -center.x, y: 0 - center.y, z: -center.z },
          { x: -center.x, y: 0 - center.y, z: 4.6 - center.z },
        ],
        [
          { x: 3 - center.x, y: 0 - center.y, z: -center.z },
          { x: 3 - center.x, y: 0 - center.y, z: 4.6 - center.z },
        ],
      ];
      for (const [p0, p1] of extPairs) {
        const s0 = projectPoint(p0, projOpts);
        const s1 = projectPoint(p1, projOpts);
        ctx.beginPath();
        ctx.moveTo(s0.sx, s0.sy);
        ctx.lineTo(s1.sx, s1.sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 严格无穿帮画家排序：按视向象限拓扑层序 + 相机深度排序所有标准块与游离块
    const vv = viewVector(state.yaw, state.pitch);
    const sxSign = vv.x >= 0 ? 1 : -1;
    const szSign = vv.z >= 0 ? 1 : -1;

    const renderQueue = state.voxels.map((v) => ({
      v,
      isRogue: false,
      layer: sxSign * v.x + v.y + szSign * v.z,
      zc: projectPoint({ x: v.x + 0.5 - center.x, y: v.y + 0.5 - center.y, z: v.z + 0.5 - center.z }, projOpts).zc,
    }));

    // 偏轴游离块（未修复时）
    const rogueTarget = preset.rogueTarget;
    if (!state.rogueFixed) {
      const rv = { x: rogueTarget.x + 0.45, y: rogueTarget.y + 0.32, z: rogueTarget.z + 0.4, tone: "violet" };
      renderQueue.push({
        v: rv,
        isRogue: true,
        layer: sxSign * rv.x + rv.y + szSign * rv.z,
        zc: projectPoint({ x: rv.x + 0.5 - center.x, y: rv.y + 0.5 - center.y, z: rv.z + 0.5 - center.z }, projOpts).zc,
      });
    }

    renderQueue.sort((a, b) => {
      if (Math.abs(a.layer - b.layer) > 0.001) return a.layer - b.layer;
      return a.zc - b.zc;
    });

    // 5. 绘制所有方块与表面立体字、拱门、游离警报框
    hitList = [];
    const now = performance.now();

    for (const item of renderQueue) {
      const { v, isRogue } = item;
      const key = isRogue ? "rogue" : `${v.x},${v.y},${v.z}`;
      let animScale = 1;
      const pop = popMap.get(key);
      if (pop) {
        const p = Math.min(1, (now - pop.t0) / 220);
        animScale = 0.65 + 0.35 * (1 - (1 - p) ** 3);
        if (p >= 1) popMap.delete(key);
      }

      const rotY = isRogue ? 18 * (Math.PI / 180) : 0;
      const faces = buildVoxelFaces(v, center, projOpts, rotY, animScale);

      // 若是悬空偏轴块，先在地面画一条红色错位投影虚框提示
      if (isRogue) {
        const gPts = [
          projectPoint({ x: rogueTarget.x - center.x, y: -center.y, z: rogueTarget.z - center.z }, projOpts),
          projectPoint({ x: rogueTarget.x + 1 - center.x, y: -center.y, z: rogueTarget.z - center.z }, projOpts),
          projectPoint({ x: rogueTarget.x + 1 - center.x, y: -center.y, z: rogueTarget.z + 1 - center.z }, projOpts),
          projectPoint({ x: rogueTarget.x - center.x, y: -center.y, z: rogueTarget.z + 1 - center.z }, projOpts),
        ];
        ctx.save();
        ctx.fillStyle = PALETTE.errSoft;
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        gPts.forEach((p, idx) => (idx ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      for (const f of faces) {
        const isHover =
          hoverHit &&
          ((isRogue && hoverHit.isRogue) ||
            (!isRogue &&
              !hoverHit.isRogue &&
              hoverHit.voxel.x === v.x &&
              hoverHit.voxel.y === v.y &&
              hoverHit.voxel.z === v.z &&
              hoverHit.dir === f.dir));

        ctx.beginPath();
        f.pts.forEach((p, idx) => (idx ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
        ctx.closePath();

        ctx.fillStyle = f.color;
        ctx.fill();

        if (isHover) {
          ctx.fillStyle = isRogue
            ? "rgba(179, 27, 52, 0.25)"
            : state.tool === "remove"
              ? "rgba(179, 27, 52, 0.28)"
              : "rgba(255, 255, 255, 0.34)";
          ctx.fill();
        }

        ctx.strokeStyle = isRogue ? PALETTE.err : PALETTE.ink;
        ctx.lineWidth = isRogue ? 2 : 1.35;
        ctx.lineJoin = "round";
        ctx.stroke();

        // 绘制原海报底层拱门洞口
        if (f.arch) {
          const [tl, bl, br, tr] = f.pts;
          const lerp = (a, b, u) => ({ sx: a.sx + (b.sx - a.sx) * u, sy: a.sy + (b.sy - a.sy) * u });
          const bL = lerp(bl, br, 0.26);
          const bR = lerp(bl, br, 0.74);
          const mL = lerp(bL, lerp(tl, tr, 0.26), 0.7);
          const mR = lerp(bR, lerp(tl, tr, 0.74), 0.7);
          ctx.beginPath();
          ctx.moveTo(bL.sx, bL.sy);
          ctx.lineTo(mL.sx, mL.sy);
          ctx.lineTo(mR.sx, mR.sy);
          ctx.lineTo(bR.sx, bR.sy);
          ctx.closePath();
          ctx.fillStyle = PALETTE.indigo;
          ctx.fill();
        }

        // 绘制原海报立体等距汉字（「等」「距」「构」「图」）
        if (f.glyph) {
          const [pTL, pBL, , pTR] = f.pts;
          drawFaceGlyph(ctx, f.glyph, pTL, pTR, pBL, PALETTE.ink);
        }

        hitList.push({
          pts: f.pts,
          voxel: v,
          dir: f.dir,
          normal: f.normal,
          isRogue,
        });
      }

      // 游离块头上画清楚的「偏轴 +18° · 点归位」红签
      if (isRogue) {
        const topPt = projectPoint({ x: v.x + 0.5 - center.x, y: v.y + 1.35 - center.y, z: v.z + 0.5 - center.z }, projOpts);
        drawPillTag(ctx, topPt.sx, Math.max(24, topPt.sy), "偏轴 +18° · 点归位", PALETTE.err, "#FFFFFF");
      }
    }

    // 6. 画出实测前后两枚标准立方体的像素卡尺标线（当视野足够宽时，清楚呈现近远对比）
    drawFrontBackCaliper(ctx, state, center, projOpts, diag);

    // 7. 顶沿轻标相机参数与近远实测像素（窄屏自动两行排布，绝不重叠）
    ctx.save();
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "top";
    const hudLeft = `YAW ${Math.round(normAngle(state.yaw))}° · PITCH ${state.pitch.toFixed(1)}° · PERSP ${Math.round(state.persp * 100)}%`;
    const hudRight = `前 ${diag.fb.nearH.toFixed(1)}px / 后 ${diag.fb.farH.toFixed(1)}px (${diag.fb.ratio.toFixed(2)}:1)`;
    if (cssW < 470) {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(7, 12, 20, 0.8)";
      ctx.fillText(hudLeft, 12, 10);
      ctx.fillStyle = diag.okPersp ? PALETTE.ok : PALETTE.err;
      ctx.fillText(hudRight, 12, 26);
    } else {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(7, 12, 20, 0.8)";
      ctx.fillText(hudLeft, 14, 12);
      ctx.textAlign = "right";
      ctx.fillStyle = diag.okPersp ? PALETTE.ok : PALETTE.err;
      ctx.fillText(hudRight, cssW - 14, 12);
    }
    ctx.restore();

    ctx.restore();
  }

  function drawPillTag(c, x, y, text, bg, fg) {
    c.save();
    c.font = '700 11px "Noto Sans SC", sans-serif';
    const w = c.measureText(text).width + 16;
    const h = 22;
    const rx = Math.max(10, Math.min(cssW - w - 10, x - w / 2));
    const ry = Math.max(44, Math.min(cssH - h - 10, y - h / 2));
    c.fillStyle = bg;
    c.beginPath();
    c.roundRect(rx, ry, w, h, 4);
    c.fill();
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, rx + w / 2, ry + h / 2 + 0.5);
    c.restore();
  }

  function drawFrontBackCaliper(c, st, center, projOpts, diag) {
    if (!st.voxels.length || cssW < 520) return;
    // 在画布左外缘与右外缘之外安静画出远/近实测高度标尺条，绝不压住方块与「等距构」立体字
    const col = diag.okPersp ? PALETTE.ok : PALETTE.err;
    const drawSideBar = (xPos, pxH, title) => {
      const yMid = cssH * 0.62;
      const y0 = yMid - pxH * 0.5;
      const y1 = yMid + pxH * 0.5;
      c.save();
      c.strokeStyle = col;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(xPos, y0);
      c.lineTo(xPos, y1);
      c.moveTo(xPos - 5, y0);
      c.lineTo(xPos + 5, y0);
      c.moveTo(xPos - 5, y1);
      c.lineTo(xPos + 5, y1);
      c.stroke();

      c.font = '700 10.5px "Space Mono", "Noto Sans SC", monospace';
      const label = `${title} ${pxH.toFixed(1)}px`;
      const tw = c.measureText(label).width + 12;
      const bx = xPos < cssW * 0.5 ? xPos + 9 : xPos - 9 - tw;
      c.fillStyle = "rgba(245, 254, 251, 0.92)";
      c.strokeStyle = col;
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(bx, yMid - 10, tw, 20, 4);
      c.fill();
      c.stroke();
      c.fillStyle = col;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(label, bx + tw * 0.5, yMid + 0.5);
      c.restore();
    };
    drawSideBar(22, diag.fb.farH, "最远模块");
    drawSideBar(cssW - 22, diag.fb.nearH, "最近模块");
  }

  const runner = loop(canvas, render);

  function triggerRedraw() {
    syncUI();
    runner.draw();
  }

  // ---------- 指针与触屏直操（拖拽旋转 + 点击加/删/归位模块） ----------
  let dragging = false;
  let moved = 0;
  let startX = 0;
  let startY = 0;
  let startYaw = 0;
  let startPitch = 0;
  let activePointerType = "mouse";

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitTest(px, py) {
    for (let i = hitList.length - 1; i >= 0; i--) {
      if (pointInPoly(px, py, hitList[i].pts)) return hitList[i];
    }
    return null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startY = e.clientY;
    startYaw = state.yaw;
    startPitch = state.pitch;
    activePointerType = e.pointerType || "mouse";
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) {
      const pos = canvasPos(e);
      const hit = hitTest(pos.x, pos.y);
      if (hit !== hoverHit) {
        hoverHit = hit;
        canvas.style.cursor = hit ? "pointer" : "grab";
        runner.draw();
      }
      return;
    }
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    moved = Math.max(moved, Math.hypot(dx, dy));

    const nextYaw = normAngle(startYaw - dx * 0.42);
    // 触屏只取横向旋方位角，把纵向滑动让给页面滚动（遵循 GUIDE.md 触屏规矩）
    const nextPitch = activePointerType === "touch" ? state.pitch : Math.max(8, Math.min(68, startPitch + dy * 0.28));
    const snapped = snapAngles(nextYaw, nextPitch);
    state.yaw = snapped.yaw;
    state.pitch = snapped.pitch;
    triggerRedraw();
  });

  function finishPointer(e) {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}

    // 未拖动即视为精准点选体素面
    if (moved < 6) {
      const pos = canvasPos(e);
      const hit = hitTest(pos.x, pos.y);
      if (hit) {
        if (hit.isRogue) {
          fixRogueBlock();
        } else if (state.tool === "remove" || e.altKey || e.shiftKey) {
          if (state.voxels.length > 3) {
            state.voxels = state.voxels.filter((v) => !(v.x === hit.voxel.x && v.y === hit.voxel.y && v.z === hit.voxel.z));
            triggerRedraw();
          }
        } else {
          const nx = hit.voxel.x + hit.normal[0];
          const ny = hit.voxel.y + hit.normal[1];
          const nz = hit.voxel.z + hit.normal[2];
          if (nx >= -1 && nx <= 4 && ny >= 0 && ny <= 4 && nz >= -1 && nz <= 4) {
            const exists = state.voxels.some((v) => v.x === nx && v.y === ny && v.z === nz);
            if (!exists) {
              const tones = ["cream", "violet", "mint"];
              const tone = tones[(state.voxels.length + nx + ny + nz) % tones.length];
              state.voxels.push({ x: nx, y: ny, z: nz, tone });
              state.addedCount++;
              popMap.set(`${nx},${ny},${nz}`, { t0: performance.now() });
              triggerRedraw();
            }
          }
        }
      }
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", () => {
    if (!dragging && hoverHit) {
      hoverHit = null;
      runner.draw();
    }
  });

  // 键盘精调（方向键旋方位与俯角，Enter 归位偏轴块）
  canvas.addEventListener("keydown", (e) => {
    let handled = true;
    if (e.key === "ArrowLeft") state.yaw = snapAngles(state.yaw + 4, state.pitch).yaw;
    else if (e.key === "ArrowRight") state.yaw = snapAngles(state.yaw - 4, state.pitch).yaw;
    else if (e.key === "ArrowUp") state.pitch = snapAngles(state.yaw, state.pitch + 2).pitch;
    else if (e.key === "ArrowDown") state.pitch = snapAngles(state.yaw, state.pitch - 2).pitch;
    else if (e.key === "Enter" || e.key === " ") {
      if (!state.rogueFixed) fixRogueBlock();
    } else handled = false;
    if (handled) {
      e.preventDefault();
      triggerRedraw();
    }
  });

  function fixRogueBlock() {
    if (state.rogueFixed) return;
    state.rogueFixed = true;
    const target = (PRESETS[state.preset] || PRESETS.poster).rogueTarget;
    if (!state.voxels.some((v) => v.x === target.x && v.y === target.y && v.z === target.z)) {
      state.voxels.push({ ...target });
      popMap.set(`${target.x},${target.y},${target.z}`, { t0: performance.now() });
    }
    triggerRedraw();
  }

  // ---------- 控件绑定 ----------
  if (ui.perspRange) {
    ui.perspRange.addEventListener("input", () => {
      state.persp = Number(ui.perspRange.value) / 100;
      triggerRedraw();
    });
  }
  if (ui.pitchRange) {
    ui.pitchRange.addEventListener("input", () => {
      const val = Number(ui.pitchRange.value);
      state.pitch = Math.abs(val - ISO_PITCH) <= 1.2 ? ISO_PITCH : val;
      triggerRedraw();
    });
  }
  if (ui.yawRange) {
    ui.yawRange.addEventListener("input", () => {
      const val = Number(ui.yawRange.value);
      state.yaw = snapAngles(val, state.pitch).yaw;
      triggerRedraw();
    });
  }
  if (ui.btnFixRogue) ui.btnFixRogue.addEventListener("click", fixRogueBlock);
  if (ui.btnGrid) {
    ui.btnGrid.addEventListener("click", () => {
      state.showGrid = !state.showGrid;
      triggerRedraw();
    });
  }
  if (ui.btnToolAdd) {
    ui.btnToolAdd.addEventListener("click", () => {
      state.tool = "add";
      triggerRedraw();
    });
  }
  if (ui.btnToolRemove) {
    ui.btnToolRemove.addEventListener("click", () => {
      state.tool = "remove";
      triggerRedraw();
    });
  }

  for (const btn of ui.presetBtns) {
    btn.addEventListener("click", () => {
      const id = btn.dataset.heroPreset;
      const keepPose = { yaw: state.yaw, pitch: state.pitch, persp: state.persp, rogueFixed: state.rogueFixed, tool: state.tool, showGrid: state.showGrid };
      state = {
        ...keepPose,
        preset: id,
        voxels: clonePresetVoxels(id),
        addedCount: 0,
      };
      if (state.rogueFixed) {
        const rt = PRESETS[id].rogueTarget;
        if (!state.voxels.some((v) => v.x === rt.x && v.y === rt.y && v.z === rt.z)) state.voxels.push({ ...rt });
      }
      triggerRedraw();
    });
  }

  for (const btn of ui.actionBtns) {
    btn.addEventListener("click", () => {
      const act = btn.dataset.heroAction;
      if (act === "iso45") {
        state.yaw = 45;
        state.pitch = ISO_PITCH;
        state.persp = 0;
        fixRogueBlock();
      } else if (act === "iso135") {
        state.yaw = 135;
        state.pitch = ISO_PITCH;
        state.persp = 0;
        fixRogueBlock();
      } else if (act === "pixel21") {
        state.yaw = 45;
        state.pitch = 30;
        state.persp = 0;
        fixRogueBlock();
      } else if (act === "err-wide") {
        state.yaw = 34;
        state.pitch = 22;
        state.persp = 0.62;
      } else if (act === "err-flat") {
        state.yaw = 45;
        state.pitch = 10;
        state.persp = 0;
      } else if (act === "reset") {
        state = createInitialState(state.preset);
      }
      triggerRedraw();
    });
  }

  window.addEventListener("resize", () => {
    resize();
    triggerRedraw();
  });

  // 首次计算真实像素尺度后再同步 UI 与渲染，保证画布卡尺与诊单数字 100% 同源一致
  resize();
  syncUI();
  runner.draw();

  return {
    getState: () => state,
    redraw: triggerRedraw,
  };
}
