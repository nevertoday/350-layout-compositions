import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ACTOR_IDS,
  SCENARIOS,
  GAZE_CYCLE,
  clonePreset,
  clamp,
  unprojectPoint,
  evaluateStage,
  projectFormation03,
} from "./model.js";

// ===========================================================================
// 全局配色真源（与 style.css 一致，逐像素实采自 303 原海报）
// ===========================================================================
const COL = {
  navy0: "#010443",
  navy1: "#060a54",
  navyLine: "#495088",
  lime: "#c7d94b",
  limeHi: "#d8e85c",
  limeDim: "#8ea038",
  cream: "#ecdfc5",
  creamSoft: "#d5cab3",
  bad: "#ff7a6b",
  good: "#66e39f",
};

// ===========================================================================
// 1. 主舞台状态与 2D Canvas 渲染（午夜剧场三人三角调度台）
// ===========================================================================
const heroState = {
  scenario: "stage",
  selected: "lead",
  activeLayer: null, // 'triangle' | 'hierarchy' | 'gaze' | 'stability' | 'story' | null
  ...clonePreset("opening"),
  // 视线演播脉冲
  pulse: { active: false, t: 0, dur: 2.8 },
  // 极短开场显影（0.55s 内全部就位，保证 check 0.9s 截图完全清晰）
  intro: 0,
  dirtyDraw: true,
  dirtyUI: true,
};

let evalCache = evaluateStage(heroState);
let lastDomCache = {};
let stageGradCache = { w: 0, h: 0, grad: null };

const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const ui = {
  status: document.getElementById("hero-status"),
  titleTri: document.getElementById("hero-title-tri"),
  titlePoly: document.getElementById("title-tri-poly"),
  titlePts: [
    document.getElementById("title-tri-p0"),
    document.getElementById("title-tri-p1"),
    document.getElementById("title-tri-p2"),
  ],
  hudScenario: document.getElementById("hud-scenario"),
  hudYaw: document.getElementById("hud-yaw"),
  yawSlider: document.getElementById("yaw-slider"),
  yawVal: document.getElementById("yaw-val"),
  actorTabs: [...document.querySelectorAll("#actor-tabs .actor-tab")],
  lightBtns: [...document.querySelectorAll("#light-group .mini-btn")],
  pointRows: [...document.querySelectorAll("#points-list .point-row")],
  scenarioBtns: [...document.querySelectorAll("#scenario-grid .sc-btn")],
  scenarioNote: document.getElementById("scenario-note"),
  diagCard: document.getElementById("diag-card"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagAction: document.getElementById("diag-action"),
  btnFix: document.getElementById("btn-fix"),
  checklistItems: [...document.querySelectorAll("#poster-checklist li")],
  starSvg: document.getElementById("poster-star"),
  mArea: document.getElementById("m-area"),
  mRank: document.getElementById("m-rank"),
  mTilt: document.getElementById("m-tilt"),
  mGaze: document.getElementById("m-gaze"),
};

// 按原海报质感绘制无五官酸黄绿剪影人物（绝不画眼、鼻、嘴）
function drawFacelessFigure(ctx, x, y, h, kind, facingDir, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  const s = h / 120; // 基准 120px 身高坐标

  // 头部（无五官纯椭圆轮廓，略随朝向微倾）
  const headTilt = facingDir * 2.4 * s;
  ctx.beginPath();
  ctx.ellipse(headTilt, -104 * s, 8.2 * s, 10.2 * s, facingDir * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 颈部
  ctx.fillRect(-3.2 * s, -95 * s, 6.4 * s, 7 * s);

  if (kind === "coat") {
    // 侧点 A：原海报左翼大衣/长裙侧影轮廓
    ctx.beginPath();
    ctx.moveTo(-12 * s, -88 * s);
    ctx.quadraticCurveTo(0, -91 * s, 12 * s, -88 * s);
    ctx.lineTo(15.5 * s, -62 * s);
    ctx.lineTo(13 * s, -48 * s);
    ctx.lineTo(16.5 * s, -20 * s);
    ctx.lineTo(-15.5 * s, -20 * s);
    ctx.lineTo(-13 * s, -50 * s);
    ctx.lineTo(-16 * s, -64 * s);
    ctx.closePath();
    ctx.fill();
    // 双腿与鞋底剪影
    ctx.fillRect(-8.5 * s, -22 * s, 6.2 * s, 21 * s);
    ctx.fillRect(2.5 * s, -22 * s, 6.2 * s, 21 * s);
  } else if (kind === "suit") {
    // 侧点 B：原海报右翼修身西装剪影
    ctx.beginPath();
    ctx.moveTo(-15 * s, -87 * s);
    ctx.quadraticCurveTo(0, -90 * s, 15 * s, -87 * s);
    ctx.lineTo(18 * s, -54 * s);
    ctx.lineTo(13 * s, -49 * s);
    ctx.lineTo(11.5 * s, -40 * s);
    ctx.lineTo(10.5 * s, -1 * s);
    ctx.lineTo(3 * s, -1 * s);
    ctx.lineTo(0.8 * s, -38 * s);
    ctx.lineTo(-0.8 * s, -38 * s);
    ctx.lineTo(-3 * s, -1 * s);
    ctx.lineTo(-10.5 * s, -1 * s);
    ctx.lineTo(-11.5 * s, -40 * s);
    ctx.lineTo(-13 * s, -49 * s);
    ctx.lineTo(-18 * s, -54 * s);
    ctx.closePath();
    ctx.fill();
  } else {
    // 顶点主体：原海报正中挺拔立姿剪影
    ctx.beginPath();
    ctx.moveTo(-16 * s, -87 * s);
    ctx.quadraticCurveTo(0, -90.5 * s, 16 * s, -87 * s);
    ctx.lineTo(19.5 * s, -56 * s);
    ctx.lineTo(14.5 * s, -44 * s);
    ctx.lineTo(11.5 * s, -44 * s);
    ctx.lineTo(9.5 * s, -1 * s);
    ctx.lineTo(2.4 * s, -1 * s);
    ctx.lineTo(0.6 * s, -40 * s);
    ctx.lineTo(-0.6 * s, -40 * s);
    ctx.lineTo(-2.4 * s, -1 * s);
    ctx.lineTo(-9.5 * s, -1 * s);
    ctx.lineTo(-11.5 * s, -44 * s);
    ctx.lineTo(-14.5 * s, -44 * s);
    ctx.lineTo(-19.5 * s, -56 * s);
    ctx.closePath();
    ctx.fill();
  }

  // 脚底微阴影，锚固在椭圆站位盘上
  ctx.fillStyle = "rgba(1, 4, 67, 0.72)";
  ctx.beginPath();
  ctx.ellipse(-5.5 * s, -0.5 * s, 5.2 * s, 2.2 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(5.5 * s, -0.5 * s, 5.2 * s, 2.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 场景氛围背景极简剪影（随底部 5 个原海报场景切换）
function drawScenarioBackdrop(ctx, w, h, scenario) {
  ctx.save();
  ctx.strokeStyle = "rgba(199, 217, 75, 0.12)";
  ctx.fillStyle = "rgba(199, 217, 75, 0.045)";
  ctx.lineWidth = 1;

  if (scenario === "stage") {
    // 剧场追光束（按尺寸缓存渐变，避免每帧重复创建）与弧形台沿
    if (stageGradCache.w !== w || stageGradCache.h !== h || !stageGradCache.grad) {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.04, 8, w * 0.5, h * 0.45, w * 0.52);
      grad.addColorStop(0, "rgba(199, 217, 75, 0.10)");
      grad.addColorStop(1, "rgba(1, 4, 67, 0)");
      stageGradCache = { w, h, grad };
    }
    ctx.fillStyle = stageGradCache.grad;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.88, w * 0.46, h * 0.09, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else if (scenario === "landscape") {
    // 远山剪影线
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w * 0.18, h * 0.44);
    ctx.lineTo(w * 0.36, h * 0.56);
    ctx.lineTo(w * 0.56, h * 0.34);
    ctx.lineTo(w * 0.78, h * 0.50);
    ctx.lineTo(w, h * 0.40);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (scenario === "dialogue") {
    // 圆桌俯视弧与吊灯微晕
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.66, w * 0.24, h * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h * 0.11);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.125, 10, Math.PI, 0);
    ctx.stroke();
  } else if (scenario === "family") {
    // 三级合影台阶横线
    for (const ry of [0.46, 0.64, 0.82]) {
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * ry);
      ctx.lineTo(w * 0.92, h * ry);
      ctx.stroke();
    }
  } else if (scenario === "street") {
    // 街头透视线与远端路灯
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.92);
    ctx.lineTo(w * 0.48, h * 0.32);
    ctx.lineTo(w * 0.95, h * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.86, h * 0.86);
    ctx.lineTo(w * 0.86, h * 0.16);
    ctx.lineTo(w * 0.79, h * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function actorColor(light) {
  if (light >= 0.9) return COL.limeHi;
  if (light >= 0.6) return COL.lime;
  return COL.limeDim;
}

function gazeTargetPoint(actor, nodes, w, h) {
  if (ACTOR_IDS.includes(actor.gaze)) {
    const t = nodes[actor.gaze];
    return { x: t.headX * w, y: t.headY * h, escapes: false };
  }
  const dir = actor.gaze === "outL" ? -1 : 1;
  return {
    x: dir < 0 ? w * 0.02 : w * 0.98,
    y: clamp(actor.headY * h - h * 0.03, h * 0.08, h * 0.85),
    escapes: true,
  };
}

function drawArrowHead(ctx, x1, y1, x2, y2, size, color) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(x2, y2);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.52);
  ctx.lineTo(-size * 0.78, 0);
  ctx.lineTo(-size, size * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeroCanvas(t, dt, { still }) {
  // 按帧合并 UI 更新，避免高速触控拖动在每帧内多次触发 DOM 重排与双次重绘
  if (heroState.dirtyUI) {
    heroState.dirtyUI = false;
    syncHeroUI();
  }
  const animActive = (!still && heroState.intro < 1) || heroState.pulse.active;
  if (!still && !animActive && !heroState.dirtyDraw) return;
  heroState.dirtyDraw = false;

  const rect = heroCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  // 手机窄屏限制最高 1.5 DPR（与 GUIDE 性能建议一致），保障软件渲染流畅 ≥40fps
  const dpr = pixelRatio(rect.width <= 440 ? 1.5 : 2);
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);
  if (heroCanvas.width !== cw || heroCanvas.height !== ch) {
    heroCanvas.width = cw;
    heroCanvas.height = ch;
  }

  if (still) {
    heroState.intro = 1;
  } else if (heroState.intro < 1) {
    heroState.intro = Math.min(1, heroState.intro + Math.max(dt, 0.016) * 2.2);
  }

  if (heroState.pulse.active) {
    heroState.pulse.t += still ? 0.45 : dt;
    if (heroState.pulse.t >= heroState.pulse.dur) {
      heroState.pulse.active = false;
      heroState.pulse.t = 0;
    }
  }

  const ctx = heroCtx;
  const w = rect.width;
  const h = rect.height;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const ev = evalCache;
  const nodes = ev.nodes;
  const list = ev.list;
  const layer = heroState.activeLayer;

  // 1. 场景氛围剪影与中轴参考虚线
  drawScenarioBackdrop(ctx, w, h, heroState.scenario);

  // 安全边距微框（仅当贴边报错或点开稳定层时突出显示）
  if (ev.isEdgeCramped || layer === "stability") {
    ctx.save();
    ctx.strokeStyle = ev.isEdgeCramped ? "rgba(255,122,107,0.55)" : "rgba(199,217,75,0.28)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(w * 0.045, h * 0.045, w * 0.91, h * 0.91);
    ctx.restore();
  }

  // 中轴平衡参照线
  ctx.save();
  ctx.strokeStyle = Math.abs(ev.tiltX) > 0.115 || layer === "stability"
    ? "rgba(255, 122, 107, 0.34)"
    : "rgba(199, 217, 75, 0.14)";
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.10);
  ctx.lineTo(w * 0.5, h * 0.90);
  ctx.stroke();
  ctx.restore();

  // 2. 发光暖米三角形主体（1:1 承袭 303 原海报视觉核心！）
  const p0 = nodes.lead;
  const p1 = nodes.sideA;
  const p2 = nodes.sideB;
  const triReveal = 0.65 + 0.35 * heroState.intro;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.sx * w, p0.sy * h);
  ctx.lineTo(p1.sx * w, p1.sy * h);
  ctx.lineTo(p2.sx * w, p2.sy * h);
  ctx.closePath();

  const triFill = ev.isCollinear || ev.hasOcclusion || ev.isDispersed
    ? `rgba(255, 122, 107, ${0.22 * triReveal})`
    : `rgba(236, 223, 197, ${0.84 * triReveal})`;
  ctx.fillStyle = triFill;
  ctx.fill();

  ctx.strokeStyle = ev.principles.triangle.pass
    ? (layer === "triangle" ? COL.limeHi : COL.lime)
    : COL.bad;
  ctx.lineWidth = layer === "triangle" ? 2.8 : 2.0;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.restore();

  // 若处于共线塌缩态，额外画一条醒目红带与标签提示面积塌缩
  if (ev.isCollinear) {
    ctx.save();
    ctx.strokeStyle = COL.bad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.min(p0.sx, p1.sx, p2.sx) * w, ((p0.sy + p1.sy + p2.sy) / 3) * h);
    ctx.lineTo(Math.max(p0.sx, p1.sx, p2.sx) * w, ((p0.sy + p1.sy + p2.sy) / 3) * h);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 中央视觉重心 `+`（原海报同款十字标 + 偏斜拉线）
  const cx = ev.centroid.sx * w;
  const cy = ev.centroid.sy * h;
  const plusCol = ev.principles.stability.pass ? COL.lime : COL.bad;
  if (Math.abs(ev.tiltX) > 0.115 || layer === "stability") {
    ctx.save();
    ctx.strokeStyle = plusCol;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = ev.principles.triangle.pass && !ev.isCollinear ? "#8f9e22" : plusCol;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();
  ctx.restore();

  // 4. 按景深 sy 从后到前排序绘制脚下酸黄绿椭圆站盘与无五官剪影人物
  const sorted = [...list].sort((a, b) => a.sy - b.sy);
  for (const n of sorted) {
    const px = n.sx * w;
    const py = n.sy * h;
    const figH = n.height * h;
    const rx = Math.max(26, n.discRx * w);
    const ry = Math.max(9, n.discRy * h);
    const isSel = heroState.selected === n.id;

    // 主光光晕（高亮表现「亮度建立主次」）
    if (n.light >= 0.9 || layer === "hierarchy") {
      const glowR = figH * (n.light >= 0.9 ? 0.92 : 0.52);
      const g = ctx.createRadialGradient(px, py - figH * 0.52, 4, px, py - figH * 0.52, glowR);
      g.addColorStop(0, n.light >= 0.9 ? "rgba(216, 232, 92, 0.24)" : "rgba(199, 217, 75, 0.10)");
      g.addColorStop(1, "rgba(1, 4, 67, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py - figH * 0.52, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 脚下酸黄绿椭圆站位盘（1:1 复刻原海报）
    ctx.save();
    ctx.fillStyle = actorColor(n.light);
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isSel) {
      ctx.strokeStyle = COL.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px, py, rx + 5, ry + 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 计算面朝左右微倾
    const gt = gazeTargetPoint(n, nodes, w, h);
    const dir = gt.x < px - 8 ? -1 : gt.x > px + 8 ? 1 : 0;

    // 人物剪影
    drawFacelessFigure(ctx, px, py, figH, n.silhouette, dir, actorColor(n.light), 1);
  }

  // 4b. 脚盘编号微标（带防碰撞垂直错位，窄屏采用精简称呼，杜绝文字叠压）
  const labelPlaced = [];
  const byX = [...list].sort((a, b) => a.sx - b.sx);
  for (const n of byX) {
    const px = n.sx * w;
    const py = n.sy * h;
    const ry = Math.max(9, n.discRy * h);
    const isSel = heroState.selected === n.id;
    const numTxt = n.id === "lead" ? "①" : n.id === "sideA" ? "②" : "③";
    const shortName = w < 520
      ? (n.id === "lead" ? "顶点" : n.id === "sideA" ? "侧 A" : "侧 B")
      : n.name;
    let ly = py + ry + 6;
    for (const prev of labelPlaced) {
      if (Math.abs(px - prev.x) < (w < 520 ? 54 : 84) && Math.abs(ly - prev.y) < 16) {
        ly = prev.y + 16;
      }
    }
    ly = Math.min(h - 16, ly);
    labelPlaced.push({ x: px, y: ly });
    ctx.save();
    ctx.font = `700 ${w < 520 ? 11.5 : 12}px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isSel ? COL.limeHi : COL.cream;
    ctx.fillText(`${numTxt} ${shortName}`, px, ly);
    ctx.restore();
  }

  // 5. 视线虚线箭头与「演播视线循环」脉冲
  for (const n of list) {
    const startX = n.headX * w;
    const startY = n.headY * h;
    const tgt = gazeTargetPoint(n, nodes, w, h);
    const dx = tgt.x - startX;
    const dy = tgt.y - startY;
    const d = Math.hypot(dx, dy) || 1;
    // 起止略微离头，避免挡住头部剪影
    const padStart = 14;
    const padEnd = tgt.escapes ? 6 : 18;
    const sx = startX + (dx / d) * padStart;
    const sy = startY + (dy / d) * padStart;
    const ex = tgt.x - (dx / d) * padEnd;
    const ey = tgt.y - (dy / d) * padEnd;

    const col = tgt.escapes
      ? COL.bad
      : layer === "gaze" || heroState.pulse.active
        ? COL.limeHi
        : "rgba(199, 217, 75, 0.72)";

    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = tgt.escapes || layer === "gaze" ? 2.2 : 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();

    drawArrowHead(ctx, sx, sy, ex, ey, tgt.escapes ? 9 : 7.5, col);
  }

  // 演播视线脉冲光点
  if (heroState.pulse.active) {
    const segDur = heroState.pulse.dur / 3;
    const idx = Math.min(2, Math.floor(heroState.pulse.t / segDur));
    const localP = (heroState.pulse.t - idx * segDur) / segDur;
    // 按视线链推进（从主键 primary 出发）
    const chain = [ev.primary];
    for (let k = 0; k < 2; k++) {
      const cur = chain[chain.length - 1];
      if (ACTOR_IDS.includes(cur.gaze)) chain.push(nodes[cur.gaze]);
      else break;
    }
    const activeNode = chain[Math.min(idx, chain.length - 1)];
    const sx = activeNode.headX * w;
    const sy = activeNode.headY * h;
    const tgt = gazeTargetPoint(activeNode, nodes, w, h);
    const px = sx + (tgt.x - sx) * localP;
    const py = sy + (tgt.y - sy) * localP;

    ctx.save();
    const pCol = tgt.escapes ? COL.bad : COL.limeHi;
    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(px, py, tgt.escapes ? 7 * (1 - localP * 0.6) : 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 6. 叠撞告警红框（若发生重叠遮挡）
  if (ev.hasOcclusion && ev.overlapPair) {
    const [a, b] = ev.overlapPair;
    const x0 = Math.min(a.box.left, b.box.left) * w - 6;
    const y0 = Math.min(a.box.top, b.box.top) * h - 6;
    const x1 = Math.max(a.box.right, b.box.right) * w + 6;
    const y1 = Math.max(a.box.bottom, b.box.bottom) * h + 6;
    ctx.save();
    ctx.strokeStyle = COL.bad;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = COL.bad;
    ctx.fillRect(x0, Math.max(4, y0 - 22), 118, 20);
    ctx.fillStyle = COL.navy0;
    ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`× 重叠遮挡 ${Math.round(ev.maxOverlap * 100)}%`, x0 + 6, Math.max(14, y0 - 12));
    ctx.restore();
  }

  // 7. 原海报风格折线引出标注（固定抬升到上空留白区，绝不压住任何人物头肩）
  if (w >= 460) {
    const topActor = [...list].sort((a, b) => a.sy - b.sy)[0];
    const minHeadY = Math.min(...list.map((n) => (n.sy - n.height) * h));
    const goRight = topActor.sx <= 0.62;
    const anchorX = topActor.sx * w + (goRight ? 16 : -16);
    const anchorY = (topActor.sy - topActor.height * 0.78) * h;
    const callY = clamp(minHeadY - 26, 44, h * 0.36);
    const kneeX = topActor.sx * w + (goRight ? 54 : -54);
    const endX = kneeX + (goRight ? 28 : -28);

    ctx.save();
    ctx.strokeStyle = ev.isCollinear ? COL.bad : COL.lime;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(kneeX, callY);
    ctx.lineTo(endX, callY);
    ctx.stroke();

    ctx.fillStyle = COL.cream;
    ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = goRight ? "left" : "right";
    ctx.textBaseline = "bottom";
    const tx = endX + (goRight ? 8 : -8);
    ctx.fillText(ev.isCollinear ? "缺顶点 · 向上拖高撑开三角" : `${ev.primary.name}（当前主焦）`, tx, callY - 2);
    ctx.fillStyle = COL.creamSoft;
    ctx.font = `400 11.5px "Chivo", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(`三角面积 ${ev.areaPct}% · 权重比 ${ev.rankRatio.toFixed(2)}×`, tx, callY + 3);
    ctx.restore();
  }

  ctx.restore();
}

function setTextDiff(key, el, val) {
  if (lastDomCache[key] !== val) {
    lastDomCache[key] = val;
    el.textContent = val;
  }
}

function setClassDiff(key, el, val) {
  if (lastDomCache[key] !== val) {
    lastDomCache[key] = val;
    el.className = val;
  }
}

// 同步所有 DOM 探针、清单、诊单与自示范标题微三角（仅在值变化时写 DOM，避免拖帧开销）
function syncHeroUI() {
  evalCache = evaluateStage(heroState);
  const ev = evalCache;
  const sc = SCENARIOS[heroState.scenario];

  // 顶栏状态章 & 自示范微三角
  setTextDiff("st", ui.status, ev.statusShort);
  setClassDiff("stC", ui.status, `status-stamp ${ev.score === 5 ? "is-good" : "is-bad"}`);

  const triBad = !ev.principles.triangle.pass;
  if (lastDomCache.triBad !== triBad) {
    lastDomCache.triBad = triBad;
    ui.titleTri.classList.toggle("is-bad", triBad);
  }
  const mapX = (u) => (8 + u * 72).toFixed(1);
  const mapY = (v) => (6 + v * 44).toFixed(1);
  const pts = [ev.nodes.lead, ev.nodes.sideA, ev.nodes.sideB];
  const polyStr = pts.map((p) => `${mapX(p.sx)},${mapY(p.sy)}`).join(" ");
  if (lastDomCache.poly !== polyStr) {
    lastDomCache.poly = polyStr;
    ui.titlePoly.setAttribute("points", polyStr);
    pts.forEach((p, i) => {
      ui.titlePts[i].setAttribute("cx", mapX(p.sx));
      ui.titlePts[i].setAttribute("cy", mapY(p.sy));
    });
  }

  // HUD
  setTextDiff("hSc", ui.hudScenario, `${sc.label} · ${sc.en}`);
  const yawInt = Math.round(heroState.cameraYaw);
  const yawTxt = `${yawInt > 0 ? "+" : ""}${yawInt}°`;
  setTextDiff("hYaw", ui.hudYaw, `CAM ${yawTxt}`);
  if (lastDomCache.yawV !== yawInt) {
    lastDomCache.yawV = yawInt;
    ui.yawSlider.value = String(yawInt);
    ui.yawVal.textContent = yawTxt;
  }
  setTextDiff("scN", ui.scenarioNote, sc.note);

  // 演员选中与主光态
  ui.actorTabs.forEach((btn) => {
    const id = btn.dataset.actor;
    const n = ev.nodes[id];
    const num = id === "lead" ? "①" : id === "sideA" ? "②" : "③";
    setTextDiff(`at_${id}`, btn, `${num} ${n.name}`);
    const on = id === heroState.selected;
    if (lastDomCache[`atOn_${id}`] !== on) {
      lastDomCache[`atOn_${id}`] = on;
      btn.classList.toggle("is-active", on);
    }
  });
  const selActor = heroState.actors[heroState.selected];
  ui.lightBtns.forEach((btn, i) => {
    const val = Number(btn.dataset.light);
    const on = Math.abs(selActor.light - val) < 0.08;
    if (lastDomCache[`lt_${i}`] !== on) {
      lastDomCache[`lt_${i}`] = on;
      btn.classList.toggle("is-active", on);
    }
  });

  // 左侧五项构图要点实时探针
  ui.pointRows.forEach((row) => {
    const key = row.dataset.layer;
    const p = ev.principles[key];
    const badge = row.querySelector("[data-badge]");
    setTextDiff(`pb_${key}`, badge, p.badge);
    setClassDiff(`pbC_${key}`, badge, `point-badge ${p.pass ? "is-good" : "is-bad"}`);
    const on = heroState.activeLayer === key;
    if (lastDomCache[`pr_${key}`] !== on) {
      lastDomCache[`pr_${key}`] = on;
      row.classList.toggle("is-active", on);
      row.setAttribute("aria-pressed", String(on));
    }
  });

  // 底部 5 场景按钮
  ui.scenarioBtns.forEach((btn) => {
    const key = btn.dataset.scenario;
    const active = key === heroState.scenario;
    if (lastDomCache[`sc_${key}`] !== active) {
      lastDomCache[`sc_${key}`] = active;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  });

  // 中栏单真源诊单 + 5 项原海报检查清单
  setClassDiff("dcC", ui.diagCard, `diag-card ${ev.score === 5 ? "is-good" : ""}`);
  setTextDiff("dT", ui.diagTitle, ev.headline);
  setTextDiff("dB", ui.diagBody, ev.reason);
  setTextDiff("dA", ui.diagAction, ev.action);
  setTextDiff("dF", ui.btnFix, ev.fixLabel);

  ui.checklistItems.forEach((li) => {
    const key = li.dataset.check;
    const item = ev.checklist.find((c) => c.key === key);
    if (lastDomCache[`ck_${key}`] !== item.pass) {
      lastDomCache[`ck_${key}`] = item.pass;
      li.classList.toggle("is-pass", item.pass);
      li.querySelector(".chk-dot").textContent = item.pass ? "✓" : "×";
    }
  });

  // 右栏八芒星与四读数
  const rot = `rotate(${ev.score * 18}deg)`;
  if (lastDomCache.rot !== rot) {
    lastDomCache.rot = rot;
    ui.starSvg.style.transform = rot;
  }
  setTextDiff("mA", ui.mArea, `${ev.areaPct}%`);
  setTextDiff("mR", ui.mRank, `${ev.rankRatio.toFixed(2)}×`);
  setTextDiff("mT", ui.mTilt, ev.tiltPct <= 2 ? "居中 0%" : `${ev.tiltDir} ${ev.tiltPct}%`);
  setTextDiff("mG", ui.mGaze, ev.gazeLabel);
}

function requestHeroRedraw(immediate = false) {
  heroState.dirtyUI = true;
  heroState.dirtyDraw = true;
  if (immediate || reducedMotion.matches) {
    heroLoop.draw();
  }
}

const heroLoop = loop(heroCanvas, drawHeroCanvas);
requestHeroRedraw(true);

// ===========================================================================
// 2. 主舞台交互：指针直拖人物 / 点击切视线 / 空场横拖绕拍机位 / 键盘操控
// ===========================================================================
let dragInfo = null;

function canvasPointerPos(e) {
  const r = heroCanvas.getBoundingClientRect();
  return {
    x: e.clientX - r.left,
    y: e.clientY - r.top,
    w: r.width,
    h: r.height,
  };
}

function hitTestActor(px, py, w, h) {
  // 从前到后（sy 从大到小）优先命中前景人物
  const list = [...evalCache.list].sort((a, b) => b.sy - a.sy);
  for (const n of list) {
    const padX = Math.max(26, n.width * w * 0.85);
    const left = n.sx * w - padX;
    const right = n.sx * w + padX;
    const top = n.box.top * h - 12;
    const bottom = n.sy * h + 26;
    if (px >= left && px <= right && py >= top && py <= bottom) {
      return n.id;
    }
  }
  return null;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const { x, y, w, h } = canvasPointerPos(e);
  const hit = hitTestActor(x, y, w, h);
  heroCanvas.setPointerCapture(e.pointerId);
  if (hit) {
    heroState.selected = hit;
    const n = evalCache.nodes[hit];
    dragInfo = {
      mode: "actor",
      actorId: hit,
      startX: x,
      startY: y,
      offsetX: x - n.sx * w,
      offsetY: y - n.sy * h,
      moved: false,
      pointerId: e.pointerId,
    };
    requestHeroRedraw(true);
  } else {
    dragInfo = {
      mode: "orbit",
      startX: x,
      startY: y,
      startYaw: heroState.cameraYaw,
      moved: false,
      pointerId: e.pointerId,
    };
  }
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || e.pointerId !== dragInfo.pointerId) return;
  const { x, y, w, h } = canvasPointerPos(e);
  const distMoved = Math.hypot(x - dragInfo.startX, y - dragInfo.startY);
  if (distMoved > 5) dragInfo.moved = true;
  if (!dragInfo.moved) return;

  if (dragInfo.mode === "actor") {
    const sx = clamp((x - dragInfo.offsetX) / w, 0.08, 0.92);
    const sy = clamp((y - dragInfo.offsetY) / h, 0.22, 0.86);
    const { u, v } = unprojectPoint(sx, sy, heroState.cameraYaw);
    heroState.actors[dragInfo.actorId].u = u;
    heroState.actors[dragInfo.actorId].v = v;
    requestHeroRedraw(false);
  } else if (dragInfo.mode === "orbit") {
    // 空白处横拖绕拍机位，实时透视旋转三点（合并至下一动画帧单次绘制）
    const deltaDeg = ((x - dragInfo.startX) / Math.max(180, w)) * 84;
    heroState.cameraYaw = clamp(dragInfo.startYaw + deltaDeg, -42, 42);
    requestHeroRedraw(false);
  }
});

function finishDrag(e) {
  if (!dragInfo || e.pointerId !== dragInfo.pointerId) return;
  if (dragInfo.mode === "actor" && !dragInfo.moved) {
    // 轻点人物切换视线目标
    cycleActorGaze(dragInfo.actorId);
  } else if (dragInfo.moved) {
    requestHeroRedraw(true);
  }
  dragInfo = null;
}

heroCanvas.addEventListener("pointerup", finishDrag);
heroCanvas.addEventListener("pointercancel", finishDrag);

function cycleActorGaze(id) {
  const seq = GAZE_CYCLE[id];
  const cur = heroState.actors[id].gaze;
  const next = seq[(seq.indexOf(cur) + 1) % seq.length];
  heroState.actors[id].gaze = next;
  requestHeroRedraw(true);
}

function triggerGazePulse() {
  heroState.pulse.active = true;
  heroState.pulse.t = 0;
  requestHeroRedraw(true);
}

// 绑定主控条、场景、预设与原则高亮
ui.actorTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.selected = btn.dataset.actor;
    requestHeroRedraw(true);
  });
});

ui.lightBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.actors[heroState.selected].light = Number(btn.dataset.light);
    requestHeroRedraw(true);
  });
});

document.getElementById("btn-cycle-gaze").addEventListener("click", () => {
  cycleActorGaze(heroState.selected);
});

ui.yawSlider.addEventListener("input", () => {
  heroState.cameraYaw = Number(ui.yawSlider.value);
  requestHeroRedraw(false);
});

document.getElementById("btn-play-gaze").addEventListener("click", triggerGazePulse);

ui.pointRows.forEach((row) => {
  row.addEventListener("click", () => {
    const key = row.dataset.layer;
    heroState.activeLayer = heroState.activeLayer === key ? null : key;
    requestHeroRedraw(true);
  });
});

ui.scenarioBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    heroState.scenario = btn.dataset.scenario;
    requestHeroRedraw(true);
  });
});

document.querySelectorAll("#preset-chips .chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = clonePreset(btn.dataset.preset);
    heroState.cameraYaw = p.cameraYaw;
    heroState.actors = p.actors;
    requestHeroRedraw(true);
  });
});

ui.btnFix.addEventListener("click", () => {
  const ft = evalCache.fixType;
  if (ft === "playGaze") {
    triggerGazePulse();
    return;
  }
  if (ft === "closeGaze") {
    heroState.actors.lead.gaze = "sideA";
    heroState.actors.sideA.gaze = "sideB";
    heroState.actors.sideB.gaze = "lead";
    triggerGazePulse();
    return;
  }
  const p = clonePreset("posterPyramid");
  heroState.cameraYaw = p.cameraYaw;
  heroState.actors = p.actors;
  triggerGazePulse();
});

document.getElementById("btn-reset-opening").addEventListener("click", () => {
  const p = clonePreset("opening");
  heroState.cameraYaw = p.cameraYaw;
  heroState.actors = p.actors;
  heroState.activeLayer = null;
  requestHeroRedraw(true);
});

// 键盘操控（不抢输入框、灯箱开启时先关灯箱）
window.addEventListener("keydown", (e) => {
  if (!lightbox.hidden) {
    if (e.key === "Escape") closeLightbox();
    return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const heroRect = heroCanvas.getBoundingClientRect();
  const heroInView = heroRect.bottom > 60 && heroRect.top < window.innerHeight - 60;
  if (!heroInView) return;

  const step = e.shiftKey ? 0.045 : 0.022;
  const act = heroState.actors[heroState.selected];
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    act.u = clamp(act.u - step, 0.09, 0.91);
    requestHeroRedraw(true);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    act.u = clamp(act.u + step, 0.09, 0.91);
    requestHeroRedraw(true);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    act.v = clamp(act.v - step, 0.23, 0.85);
    requestHeroRedraw(true);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    act.v = clamp(act.v + step, 0.23, 0.85);
    requestHeroRedraw(true);
  } else if (e.key === " ") {
    e.preventDefault();
    triggerGazePulse();
  }
});

// ===========================================================================
// 3. 01 节：三时代史例几何透视 X-Ray 翻页板
// ===========================================================================
const ERAS = {
  renaissance: {
    caption: "达·芬奇《圣母子与圣安妮》（约 1503–1519，卢浮宫 INV 776）：三人头肩锁定紧凑正三角，视线顺斜边自顶向下再折返。",
    pts: [
      { x: 245, y: 74, r: 16, h: 166, label: "圣安妮（顶点）" },
      { x: 186, y: 152, r: 14, h: 112, label: "圣母（中轴转折）" },
      { x: 306, y: 204, r: 12, h: 68, label: "圣婴（底角呼应）" },
    ],
    tri: "245,64 136,268 352,268",
    gaze: [[245, 78, 198, 146], [192, 158, 294, 200], [302, 200, 204, 162]],
  },
  studio: {
    caption: "丹尼尔·阿里洪（1976）与史蒂文·D·卡茨（1991）片场 A 形调度：三人错开纵深与高差，中轴留出透视通道，镜头正反打稳定不越轴。",
    pts: [
      { x: 242, y: 84, r: 13, h: 120, label: "后景主讲" },
      { x: 116, y: 160, r: 15, h: 122, label: "前景左翼 A" },
      { x: 368, y: 160, r: 15, h: 122, label: "前景右翼 B" },
    ],
    tri: "242,84 116,250 368,250",
    gaze: [[132, 156, 228, 92], [352, 156, 256, 92], [242, 92, 134, 154]],
  },
  depth: {
    caption: "大卫·波德维尔《光影之迹》（2005）纵深长镜头例：前景近侧主角与远景二人构成斜三角，不动剪刀就能在同一镜头内演完博弈。",
    pts: [
      { x: 132, y: 126, r: 19, h: 160, label: "前景主焦" },
      { x: 312, y: 114, r: 11, h: 98, label: "远景对手" },
      { x: 382, y: 168, r: 14, h: 108, label: "中景旁观" },
    ],
    tri: "132,262 312,188 382,256",
    gaze: [[154, 128, 298, 116], [312, 120, 156, 130], [368, 164, 156, 134]],
  },
};

let activeEra = "renaissance";
let eraXray = true;
const eraSvg = document.getElementById("era-svg");
const eraCaption = document.getElementById("era-caption");
const btnEraXray = document.getElementById("btn-era-xray");

function renderEra() {
  const e = ERAS[activeEra];
  eraCaption.textContent = e.caption;
  const figs = e.pts.map((p) => {
    const ly = Math.min(294, p.y + p.h * 0.72 + 19);
    const pillW = p.label.length * 12 + 14;
    return `
      <g>
        <ellipse cx="${p.x}" cy="${p.y + p.h * 0.72}" rx="${p.r * 2.1}" ry="${p.r * 0.52}" fill="#c7d94b" opacity="0.88" />
        <circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="#c7d94b" />
        <path d="M${p.x - p.r * 1.25},${p.y + p.r * 1.15} Q${p.x},${p.y + p.r * 0.8} ${p.x + p.r * 1.25},${p.y + p.r * 1.15} L${p.x + p.r * 1.15},${p.y + p.h * 0.72} L${p.x - p.r * 1.15},${p.y + p.h * 0.72} Z" fill="#c7d94b" />
        <rect x="${p.x - pillW / 2}" y="${ly - 12}" width="${pillW}" height="17" fill="#010443" opacity="0.92" />
        <text x="${p.x}" y="${ly}" text-anchor="middle" fill="#ecdfc5" font-size="11.5" font-family="Noto Sans SC, sans-serif">${p.label}</text>
      </g>
    `;
  }).join("");

  const xray = eraXray ? `
    <polygon points="${e.tri}" fill="rgba(236,223,197,0.22)" stroke="#d8e85c" stroke-width="2" stroke-dasharray="6 4" />
    ${e.gaze.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff7a6b" stroke-width="1.8" stroke-dasharray="4 4" />`).join("")}
    <line x1="240" y1="20" x2="240" y2="286" stroke="rgba(199,217,75,0.28)" stroke-dasharray="3 5" />
  ` : "";

  eraSvg.innerHTML = `
    <rect x="0" y="0" width="480" height="310" fill="#010443" />
    ${xray}
    ${figs}
  `;
}

document.querySelectorAll(".era-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeEra = tab.dataset.era;
    document.querySelectorAll(".era-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderEra();
  });
});

btnEraXray.addEventListener("click", () => {
  eraXray = !eraXray;
  btnEraXray.setAttribute("aria-pressed", String(eraXray));
  btnEraXray.textContent = `几何透视线：${eraXray ? "开" : "关"}`;
  renderEra();
});
renderEra();

// ===========================================================================
// 4. 02 节：主次三杠杆权重混音台（大小 / 亮度 / 高度）
// ===========================================================================
const mxScale = document.getElementById("mx-scale");
const mxLum = document.getElementById("mx-lum");
const mxElev = document.getElementById("mx-elev");
const mixerSvg = document.getElementById("mixer-svg");
const mixerVerdict = document.getElementById("mixer-verdict");

function renderMixer() {
  const sc = Number(mxScale.value);
  const lum = Number(mxLum.value);
  const elev = Number(mxElev.value);

  document.getElementById("mx-scale-val").textContent = `${sc.toFixed(2)}×`;
  document.getElementById("mx-lum-val").textContent = `+${lum}%`;
  document.getElementById("mx-elev-val").textContent = `${elev >= 0 ? "+" : ""}${elev}px`;

  // 示意视觉权重：大小平方效应 × 亮度对比 × 高位势能
  const sideW = 1.0;
  const leadW = (sc * sc * 0.62 + 0.38) * (1 + lum / 100) * (1 + elev / 145);
  const total = leadW + sideW * 2;
  const pctM = Math.round((leadW / total) * 100);
  const pctSide = Math.round(((100 - pctM) / 2));

  document.getElementById("bar-m").style.width = `${pctM}%`;
  document.getElementById("bar-a").style.width = `${pctSide}%`;
  document.getElementById("bar-b").style.width = `${pctSide}%`;
  document.getElementById("pct-m").textContent = `${pctM}%`;
  document.getElementById("pct-a").textContent = `${pctSide}%`;
  document.getElementById("pct-b").textContent = `${pctSide}%`;

  if (pctM < 38) mixerVerdict.textContent = "三者拉平 · 缺乏主角";
  else if (pctM > 64) mixerVerdict.textContent = "强主光领衔 · 聚焦极强";
  else mixerVerdict.textContent = "主角领衔 · 层次分明";

  const baseFoot = 208;
  const leadFoot = baseFoot - elev;
  const leadH = 92 * sc;
  const sideH = 92;
  const sideColor = lum > 35 ? "#8b9c3a" : "#b8ca47";
  const leadColor = lum > 20 ? "#e2f068" : "#c7d94b";

  const fig = (x, foot, fh, col, lbl) => {
    const s = fh / 100;
    return `
      <ellipse cx="${x}" cy="${foot}" rx="${24 * s}" ry="${6.5 * s}" fill="${col}" />
      <circle cx="${x}" cy="${foot - 86 * s}" r="${9 * s}" fill="${col}" />
      <path d="M${x - 14 * s},${foot - 74 * s} Q${x},${foot - 78 * s} ${x + 14 * s},${foot - 74 * s} L${x + 12 * s},${foot - 2 * s} L${x - 12 * s},${foot - 2 * s} Z" fill="${col}" />
      <text x="${x}" y="${Math.min(242, foot + 20)}" text-anchor="middle" fill="#ecdfc5" font-size="12" font-family="Noto Sans SC, sans-serif">${lbl}</text>
    `;
  };

  mixerSvg.innerHTML = `
    <rect width="520" height="250" fill="#010443" />
    <ellipse cx="260" cy="${leadFoot - leadH * 0.45}" rx="${68 + lum * 0.7}" ry="${62 + lum * 0.5}" fill="rgba(216,232,92,${0.04 + lum * 0.0028})" />
    <polygon points="260,${leadFoot} 118,${baseFoot} 402,${baseFoot}" fill="rgba(236,223,197,0.22)" stroke="#c7d94b" stroke-width="1.6" stroke-dasharray="6 4" />
    ${fig(118, baseFoot, sideH, sideColor, "配角 A")}
    ${fig(402, baseFoot, sideH, sideColor, "配角 B")}
    ${fig(260, leadFoot, leadH, leadColor, `主角 (${pctM}%)`)}
  `;
}

[mxScale, mxLum, mxElev].forEach((el) => el.addEventListener("input", renderMixer));
renderMixer();

// ===========================================================================
// 5. 03 节：深午夜蓝暗室 — 俯视机位平面图 ⇄ 银幕画幅同步推演
// ===========================================================================
const sec03State = { formation: "A", cam: "master", focal: 35 };
const planCanvas = document.getElementById("canvas-plan03");
const frameCanvas = document.getElementById("canvas-frame03");
const planCtx = planCanvas.getContext("2d");
const frameCtx = frameCanvas.getContext("2d");

function renderSec03() {
  const res = projectFormation03(sec03State.formation, sec03State.cam, sec03State.focal);
  document.getElementById("focal03-val").textContent = `${sec03State.focal}mm`;
  document.getElementById("plan03-desc").textContent = `${res.form.desc} ${res.cam.note}。`;
  document.getElementById("frame03-meta").textContent = `${sec03State.focal}mm · 尺比 ${res.sizeRatio.toFixed(2)}×`;
  const vEl = document.getElementById("frame03-verdict");
  vEl.textContent = res.verdict;
  vEl.className = `bp-foot is-${res.tone}`;

  drawPlan03(res);
  drawFrame03(res);
}

function sizeCanvas2d(c) {
  const r = c.getBoundingClientRect();
  if (r.width < 10 || r.height < 10) return null;
  const dpr = pixelRatio(2);
  const cw = Math.round(r.width * dpr);
  const ch = Math.round(r.height * dpr);
  if (c.width !== cw || c.height !== ch) {
    c.width = cw;
    c.height = ch;
  }
  return { w: r.width, h: r.height, dpr };
}

function drawPlan03(res) {
  const sz = sizeCanvas2d(planCanvas);
  if (!sz) return;
  const { w, h, dpr } = sz;
  const ctx = planCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COL.navy0;
  ctx.fillRect(0, 0, w, h);

  // 地板坐标映射：wx in [-2.1, 1.5], wz in [-1.4, 2.0]
  const toX = (wx) => w * 0.56 + wx * (w * 0.24);
  const toY = (wz) => h * 0.72 - wz * (h * 0.31);

  // 网格线
  ctx.strokeStyle = "rgba(199, 217, 75, 0.08)";
  ctx.lineWidth = 1;
  for (let gx = -2; gx <= 2; gx += 0.5) {
    ctx.beginPath();
    ctx.moveTo(toX(gx), 0);
    ctx.lineTo(toX(gx), h);
    ctx.stroke();
  }
  for (let gz = -1; gz <= 2; gz += 0.5) {
    ctx.beginPath();
    ctx.moveTo(0, toY(gz));
    ctx.lineTo(w, toY(gz));
    ctx.stroke();
  }

  // 机位视锥扇形
  const camX = toX(res.effCx);
  const camY = toY(res.effCz);
  const tgtX = toX(res.cam.tx);
  const tgtY = toY(res.cam.tz);
  const ang = Math.atan2(tgtY - camY, tgtX - camX);
  const halfFov = clamp((42 / res.focalMm) * 0.62, 0.16, 0.62);

  ctx.save();
  ctx.fillStyle = "rgba(236, 223, 197, 0.11)";
  ctx.strokeStyle = "rgba(199, 217, 75, 0.55)";
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(camX, camY);
  ctx.lineTo(camX + Math.cos(ang - halfFov) * w * 0.9, camY + Math.sin(ang - halfFov) * w * 0.9);
  ctx.lineTo(camX + Math.cos(ang + halfFov) * w * 0.9, camY + Math.sin(ang + halfFov) * w * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 三人俯视连线
  const pts = res.form.actors.map((a) => ({ x: toX(a.wx), y: toY(a.wz), a }));
  ctx.save();
  ctx.strokeStyle = COL.lime;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[2].x, pts[2].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 机位图标
  ctx.save();
  ctx.translate(camX, camY);
  ctx.rotate(ang);
  ctx.fillStyle = COL.cream;
  ctx.fillRect(-10, -7, 16, 14);
  ctx.beginPath();
  ctx.moveTo(6, -5);
  ctx.lineTo(14, -9);
  ctx.lineTo(14, 9);
  ctx.lineTo(6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 三位演员俯视肩圆
  for (const p of pts) {
    ctx.fillStyle = actorColor(p.a.light);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.navy0;
    ctx.font = `800 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.a.label, p.x, p.y);
  }
  ctx.restore();
}

function drawFrame03(res) {
  const sz = sizeCanvas2d(frameCanvas);
  if (!sz) return;
  const { w, h, dpr } = sz;
  const ctx = frameCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COL.navy0;
  ctx.fillRect(0, 0, w, h);

  // 地平线与安全框
  ctx.strokeStyle = "rgba(199, 217, 75, 0.14)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.46);
  ctx.lineTo(w, h * 0.46);
  ctx.stroke();

  // 银幕投影三角面
  const pr = res.projected;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pr[0].sx * w, pr[0].sy * h);
  ctx.lineTo(pr[1].sx * w, pr[1].sy * h);
  ctx.lineTo(pr[2].sx * w, pr[2].sy * h);
  ctx.closePath();
  ctx.fillStyle = res.tone === "bad" ? "rgba(255, 122, 107, 0.22)" : "rgba(236, 223, 197, 0.28)";
  ctx.fill();
  ctx.strokeStyle = res.tone === "bad" ? COL.bad : COL.lime;
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // 从远到近画剪影
  const byDepth = [...pr].sort((a, b) => b.depth - a.depth);
  for (const p of byDepth) {
    const px = p.sx * w;
    const py = p.sy * h;
    const fh = h * 0.36 * p.scale;
    const kind = p.id === "A" ? "standing" : p.id === "B" ? "coat" : "suit";
    ctx.fillStyle = actorColor(p.light);
    ctx.beginPath();
    ctx.ellipse(px, py, fh * 0.28, fh * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFacelessFigure(ctx, px, py, fh, kind, 0, actorColor(p.light), 1);
  }
  ctx.restore();
}

document.querySelectorAll("#form03-tabs .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    sec03State.formation = btn.dataset.form;
    document.querySelectorAll("#form03-tabs .seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderSec03();
  });
});

document.querySelectorAll("#cam03-tabs .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    sec03State.cam = btn.dataset.cam;
    document.querySelectorAll("#cam03-tabs .seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderSec03();
  });
});

document.getElementById("focal03-slider").addEventListener("input", (e) => {
  sec03State.focal = Number(e.target.value);
  renderSec03();
});

// 使用 ResizeObserver 保证 03 节双画布随视口改变清晰重绘
const ro03 = new ResizeObserver(() => renderSec03());
ro03.observe(planCanvas);
ro03.observe(frameCanvas);
renderSec03();

// ===========================================================================
// 6. 04 节：三角形态连续翻转与权力偏斜台
// ===========================================================================
const morphFlip = document.getElementById("morph-flip");
const morphSkew = document.getElementById("morph-skew");
const morphSvg = document.getElementById("morph-svg");

function renderMorph() {
  const flip = Number(morphFlip.value); // -100（倒三角）.. +100（正三角）
  const skew = Number(morphSkew.value); // -60..+60

  document.getElementById("morph-flip-val").textContent =
    flip > 15 ? `正立 +${flip}%` : flip < -15 ? `倒尖 ${flip}%` : "水平趋平";
  document.getElementById("morph-skew-val").textContent =
    Math.abs(skew) < 8 ? "居中 0%" : `${skew > 0 ? "右偏" : "左偏"} ${Math.abs(skew)}%`;

  // 三个顶点在 460×280 内的连续形变
  const apexY = 148 - flip * 0.88;
  const baseY = 148 + flip * 0.72;
  const apexX = 230 + skew * 1.65;
  const leftX = 115 + Math.max(0, skew) * 0.75;
  const rightX = 345 + Math.min(0, skew) * 0.75;

  const baseW = Math.abs(rightX - leftX);
  const height = Math.max(12, Math.abs(baseY - apexY));
  const ratio = (baseW / height).toFixed(2);
  document.getElementById("morph-ratio").textContent = `底宽 / 顶高 = ${ratio}`;

  // 心理张力与解读
  let tag = "正三角 · 稳固庇护";
  let title = "宽底正三角：秩序、权威与安稳";
  let desc = "重心稳稳压在底边中段，下方两位主体托住上方顶点。适合家庭合影、团队领衔、经典英雄群像，观感笃定而不紧张。";
  let useTxt = "家庭合影、舞台主唱定场、经典团队群像";
  let riskTxt = "左右完全等距对称易显拘谨，微调侧角高低或转身更有生气";
  let tension = 22;
  let tLabel = "沉稳";
  let fillCol = "#115e37";

  if (Math.abs(flip) <= 18) {
    tag = "平线过渡 · 僵持队列";
    title = "近水平共线：三角面积即将塌缩";
    desc = "当顶点与底边拉平到同一高度，三角形退化成呆板横排。若非刻意拍审讯或冷峻队列，应及时拉开高差。";
    useTxt = "仪式检阅、冷幽默平推镜头、刻意疏离的僵持戏";
    riskTxt = "日常对话与合影排成横线，会立刻暴露新手证件照感";
    tension = 55;
    tLabel = "僵滞";
    fillCol = "#a82417";
  } else if (flip < -18) {
    tag = "倒三角 · 悬疑压迫";
    title = "倒立尖角：头重脚轻的危机感";
    desc = "两位主体悬在高处压向底部单点，几何上随时可能倾倒。悬疑片、对峙与审判戏常用倒三角制造无声压迫，但不适合温馨合影。";
    useTxt = "心理惊悚、高台审视、孤胆主角迎战两位强敌";
    riskTxt = "底端孤点若再偏离中轴且偏暗，整幅画面会发飘倾倒";
    tension = 88;
    tLabel = "紧绷";
    fillCol = "#a82417";
  } else if (Math.abs(skew) >= 34) {
    tag = skew < 0 ? "2 对 1 偏心 · 结盟施压" : "不等边斜三角 · 动势流动";
    title = skew < 0 ? "2 对 1 偏心三角：联盟与孤立一目了然" : "不等边斜三角：最自然的电影纪实节奏";
    desc = skew < 0
      ? "两人的间距收紧成同盟，把第三人孤立在另一端，哪怕不用正反打特写，观众一眼就能读懂权力倾斜。"
      : "打破刻板左右对称后，视线沿着长短不一的斜边流动，既保留三角稳固感，又多了生活气息与推进动势。";
    useTxt = skew < 0 ? "三方谈判、法庭质询、背叛与孤立戏码" : "街头纪实、咖啡馆三人闲聊、实景行走长镜头";
    riskTxt = skew < 0 ? "孤立一方需借高光或高位配重，避免整体重心一边倒" : "注意近景人物不要遮挡中后景角色的视线通道";
    tension = 62;
    tLabel = "活跃";
    fillCol = "#070c42";
  }

  document.getElementById("morph-tag").textContent = tag;
  document.getElementById("morph-title").textContent = title;
  document.getElementById("morph-desc").textContent = desc;
  document.getElementById("morph-use").textContent = useTxt;
  document.getElementById("morph-risk").textContent = riskTxt;
  const bar = document.getElementById("morph-tension-fill");
  bar.style.width = `${tension}%`;
  bar.style.background = fillCol;
  document.getElementById("morph-tension-label").textContent = tLabel;

  const cx = (apexX + leftX + rightX) / 3;
  const cy = (apexY + baseY + baseY) / 3;
  const triCol = flip < -18 || Math.abs(flip) <= 18 ? "#ff7a6b" : "#c7d94b";

  morphSvg.innerHTML = `
    <rect width="460" height="280" fill="#010443" />
    <line x1="230" y1="16" x2="230" y2="264" stroke="rgba(199,217,75,0.18)" stroke-dasharray="4 5" />
    <polygon points="${apexX},${apexY} ${leftX},${baseY} ${rightX},${baseY}" fill="rgba(236,223,197,0.78)" stroke="${triCol}" stroke-width="2.4" stroke-dasharray="7 5" />
    <path d="M${cx - 8},${cy} H${cx + 8} M${cx},${cy - 8} V${cy + 8}" stroke="#010443" stroke-width="2.2" />
    <g fill="#c7d94b">
      <circle cx="${apexX}" cy="${apexY}" r="11" />
      <circle cx="${leftX}" cy="${baseY}" r="9" />
      <circle cx="${rightX}" cy="${baseY}" r="9" />
    </g>
    <text x="${apexX}" y="${apexY + 4}" text-anchor="middle" fill="#010443" font-size="11" font-weight="800">主</text>
    <text x="${leftX}" y="${baseY + 4}" text-anchor="middle" fill="#010443" font-size="10" font-weight="800">A</text>
    <text x="${rightX}" y="${baseY + 4}" text-anchor="middle" fill="#010443" font-size="10" font-weight="800">B</text>
  `;
}

[morphFlip, morphSkew].forEach((el) => el.addEventListener("input", renderMorph));
document.querySelectorAll("#archetype-list .arch-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    morphFlip.value = btn.dataset.flip;
    morphSkew.value = btn.dataset.skew;
    document.querySelectorAll("#archetype-list .arch-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
    renderMorph();
  });
});
renderMorph();

// ===========================================================================
// 7. 05 节：片场脚本适切性判断翻牌
// ===========================================================================
document.querySelectorAll("#decision-grid .dec-card").forEach((card) => {
  const ans = card.dataset.answer;
  const res = card.querySelector(".dec-res");
  card.querySelectorAll(".dec-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ok = btn.dataset.pick === ans;
      card.querySelectorAll(".dec-btn").forEach((b) => {
        b.classList.remove("is-right", "is-wrong");
        if (b === btn) b.classList.add(ok ? "is-right" : "is-wrong");
      });
      res.hidden = false;
    });
  });
});

// ===========================================================================
// 8. 06 节：导演小测验（单一变量四选一，中性标签镜头 A/B/C/D）
// ===========================================================================
const QUIZ_ROUNDS = [
  {
    prompt: "舞台全景需同时交代「居中领队的主导权」与「三人的稳固同盟」。下面四帧的灯位、剪影尺度与朝向完全一致，<strong>只差三人的站位坐标</strong>——哪一帧最成立？",
    correct: 1,
    options: [
      {
        label: "镜头 A",
        pts: [[65, 118], [130, 116], [195, 119]],
        gaze: [[65, 92, 122, 92], [130, 92, 187, 92], [195, 92, 138, 92]],
        why: "镜头 A 的三人站在同一高度上，三角面积近乎归零，画面退化成呆板的水平排队，缺乏空间纵深与主次承托。",
      },
      {
        label: "镜头 B",
        pts: [[130, 62], [68, 134], [192, 134]],
        gaze: [[130, 38, 76, 108], [68, 110, 184, 110], [192, 110, 138, 42]],
        why: "正确！镜头 B 让居中领队落在高位顶点，两翼略低内收形成宽底正三角，重心稳居中轴，主次与同盟感一帧读清。",
      },
      {
        label: "镜头 C",
        pts: [[130, 56], [22, 144], [238, 144]],
        gaze: [[130, 32, 32, 118], [22, 120, 228, 120], [238, 120, 140, 36]],
        why: "镜头 C 的左右两人被拉到画框最边缘，不仅贴边挤压，三人间的视觉纽带也因跨度过大而散架。",
      },
      {
        label: "镜头 D",
        pts: [[182, 64], [136, 134], [228, 134]],
        gaze: [[182, 40, 144, 108], [136, 110, 220, 110], [228, 110, 190, 42]],
        why: "镜头 D 虽然围出了三角形，但三人整体缩在右半区，画面重心大幅右倾，左侧空出大片失衡盲区。",
      },
    ],
  },
  {
    prompt: "换一个单一变量：下面四帧的<strong>三人正三角站位与主光完全相同，只差三人的视线方向</strong>——哪一帧把观者目光最自然地留在三人互动里？",
    correct: 2,
    options: [
      {
        label: "镜头 A",
        pts: [[130, 62], [68, 134], [192, 134]],
        gaze: [[130, 38, 14, 38], [68, 110, 10, 104], [192, 110, 14, 104]],
        why: "镜头 A 全员望向左侧画外，观众注意力会立刻顺着视线滑出画框左沿，三人之间的内部互动完全悬空。",
      },
      {
        label: "镜头 B",
        pts: [[130, 62], [68, 134], [192, 134]],
        gaze: [[130, 38, 246, 36], [68, 110, 182, 110], [192, 110, 78, 110]],
        why: "镜头 B 下方两人对望，却把顶点主角晾在一旁望向画外，原本应统摄全场的顶点角色与对话断联。",
      },
      {
        label: "镜头 C",
        pts: [[130, 62], [68, 134], [192, 134]],
        gaze: [[130, 38, 76, 104], [68, 110, 182, 110], [192, 110, 138, 44]],
        why: "正确！镜头 C 的三条视线首尾相连构成顺时针闭环，观者目光在三位角色之间自然循环流转，叙事连贯紧密。",
      },
      {
        label: "镜头 D",
        pts: [[130, 62], [68, 134], [192, 134]],
        gaze: [[130, 38, 130, 8], [68, 110, 12, 122], [192, 110, 248, 122]],
        why: "镜头 D 三人背向各自朝外张望，视线呈放射状把注意力往三个方向甩出画外，画面关系彻底解体。",
      },
    ],
  },
];

let quizRound = 0;
const quizSolved = [null, null];
const quizGrid = document.getElementById("quiz-grid");
const quizPrompt = document.getElementById("quiz-prompt");
const quizFeedback = document.getElementById("quiz-feedback");
const qfHead = document.getElementById("qf-head");
const qfBody = document.getElementById("qf-body");
const quizProgress = document.getElementById("quiz-progress");

function quizSvgMarkup(opt) {
  const poly = opt.pts.map(([x, y]) => `${x},${y}`).join(" ");
  const figs = opt.pts.map(([x, y], i) => {
    const col = i === 0 ? "#d8e85c" : "#b8ca47";
    return `
      <ellipse cx="${x}" cy="${y}" rx="17" ry="4.5" fill="${col}" />
      <circle cx="${x}" cy="${y - 26}" r="5.2" fill="${col}" />
      <path d="M${x - 7},${y - 20} Q${x},${y - 22} ${x + 7},${y - 20} L${x + 6},${y - 1} L${x - 6},${y - 1} Z" fill="${col}" />
    `;
  }).join("");
  const arrows = opt.gaze.map(([x1, y1, x2, y2]) => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ax1 = x2 - 7 * Math.cos(ang - 0.5);
    const ay1 = y2 - 7 * Math.sin(ang - 0.5);
    const ax2 = x2 - 7 * Math.cos(ang + 0.5);
    const ay2 = y2 - 7 * Math.sin(ang + 0.5);
    return `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c7d94b" stroke-width="1.6" stroke-dasharray="4 3" />
      <polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" fill="#c7d94b" />
    `;
  }).join("");
  return `
    <svg viewBox="0 0 260 164" aria-hidden="true">
      <rect width="260" height="164" fill="#010443" />
      <line x1="130" y1="10" x2="130" y2="154" stroke="rgba(199,217,75,0.16)" stroke-dasharray="3 4" />
      <polygon points="${poly}" fill="rgba(236,223,197,0.28)" stroke="#c7d94b" stroke-width="1.5" stroke-dasharray="5 4" />
      ${figs}
      ${arrows}
    </svg>
  `;
}

function renderQuiz() {
  const q = QUIZ_ROUNDS[quizRound];
  const picked = quizSolved[quizRound];
  quizPrompt.innerHTML = q.prompt;
  const doneCount = quizSolved.filter((v) => v !== null).length;
  quizProgress.textContent = `${doneCount} / ${QUIZ_ROUNDS.length} 已答`;

  quizGrid.innerHTML = q.options.map((opt, idx) => {
    let cls = "q-opt";
    let stateTxt = "点击选择";
    if (picked !== null) {
      if (idx === q.correct) {
        cls += " is-correct";
        stateTxt = "✓ 成立";
      } else if (idx === picked) {
        cls += " is-wrong";
        stateTxt = "× 欠妥";
      } else {
        stateTxt = "备选";
      }
    }
    return `
      <button type="button" class="${cls}" data-idx="${idx}">
        ${quizSvgMarkup(opt)}
        <div class="q-opt-label">
          <span>${opt.label}</span>
          <span class="q-opt-state">${stateTxt}</span>
        </div>
      </button>
    `;
  }).join("");

  quizGrid.querySelectorAll(".q-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizSolved[quizRound] = Number(btn.dataset.idx);
      renderQuiz();
    });
  });

  if (picked !== null) {
    const ok = picked === q.correct;
    quizFeedback.hidden = false;
    quizFeedback.className = `quiz-feedback ${ok ? "is-good" : "is-bad"}`;
    qfHead.textContent = ok
      ? `回答正确：${q.options[picked].label} 最成立`
      : `再看一眼：你选了 ${q.options[picked].label}，本题最成立的是 ${q.options[q.correct].label}`;
    qfBody.textContent = ok
      ? q.options[picked].why
      : `${q.options[picked].why} 对比来看，${q.options[q.correct].why}`;
  } else {
    quizFeedback.hidden = true;
  }
}

document.querySelectorAll(".q-round").forEach((btn) => {
  btn.addEventListener("click", () => {
    quizRound = Number(btn.dataset.round);
    document.querySelectorAll(".q-round").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderQuiz();
  });
});
renderQuiz();

// ===========================================================================
// 9. 07 节：原海报全屏灯箱（放大 / 拖拽平移 / Esc 关闭，复用 #poster.src）
// ===========================================================================
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbViewport = document.getElementById("lb-viewport");
const posterEl = document.getElementById("poster");
let lbState = { scale: 1, tx: 0, ty: 0, drag: null };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbState.tx}px, ${lbState.ty}px) scale(${lbState.scale})`;
  document.getElementById("lb-zoom-reset").textContent = `${Math.round(lbState.scale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterEl.src;
  lbState = { scale: 1, tx: 0, ty: 0, drag: null };
  applyLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale + 0.35, 1, 3.2);
  applyLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbState.scale = clamp(lbState.scale - 0.35, 1, 3.2);
  if (lbState.scale === 1) { lbState.tx = 0; lbState.ty = 0; }
  applyLbTransform();
});
document.getElementById("lb-zoom-reset").addEventListener("click", () => {
  lbState.scale = 1; lbState.tx = 0; lbState.ty = 0;
  applyLbTransform();
});

lbViewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbState.scale = clamp(lbState.scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
  if (lbState.scale === 1) { lbState.tx = 0; lbState.ty = 0; }
  applyLbTransform();
}, { passive: false });

lbViewport.addEventListener("pointerdown", (e) => {
  lbViewport.setPointerCapture(e.pointerId);
  lbState.drag = { x: e.clientX - lbState.tx, y: e.clientY - lbState.ty, id: e.pointerId };
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbState.drag || lbState.drag.id !== e.pointerId) return;
  lbState.tx = e.clientX - lbState.drag.x;
  lbState.ty = e.clientY - lbState.drag.y;
  applyLbTransform();
});
lbViewport.addEventListener("pointerup", () => { lbState.drag = null; });
lbViewport.addEventListener("pointercancel", () => { lbState.drag = null; });

// 监听窗口变化保证主舞台即时适配 DPR 与尺寸
const roHero = new ResizeObserver(() => requestHeroRedraw(true));
roHero.observe(heroCanvas);
if (reducedMotion.matches) requestHeroRedraw(true);
