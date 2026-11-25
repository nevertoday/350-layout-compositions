import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  WORLD,
  CORE_CENTER,
  createInitialState,
  evaluateCluster,
  evaluateLattice,
  evaluateTugOfWar,
} from "./model.js";

const COLORS = {
  paper: "#F5EFE8",
  light: "#FBF8F4",
  ink: "#0D1935",
  ink2: "#3A3D58",
  indigo: "#3F2E94",
  lavender: "#896BC2",
  lilac: "#BCABDE",
  paleDot: "#C4B4E4",
  cream: "#F5EFE6",
  err: "#C63D2F",
  ok: "#1B6B4F",
  grid: "#DFD6EB",
};

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
}

// ==================== HERO 主舞台：引力成簇工作台 ====================
const state = createInitialState();
const heroWrap = document.getElementById("hero-canvas-wrap");
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");

const rail = document.getElementById("gravity-rail");
const railFill = document.getElementById("rail-fill");
const railThumb = document.getElementById("rail-thumb");
const pullReadout = document.getElementById("pull-readout");

const diagBox = document.getElementById("diag-box");
const diagBadge = document.getElementById("diag-badge");
const diagScore = document.getElementById("diag-score");
const diagHeadline = document.getElementById("diag-headline");
const diagReason = document.getElementById("diag-reason");
const diagAction = document.getElementById("diag-action");

const mSep = document.getElementById("m-sep");
const mGap = document.getElementById("m-gap");
const mWeight = document.getElementById("m-weight");
const mScale = document.getElementById("m-scale");

const selName = document.getElementById("sel-name");
const btnToggleRole = document.getElementById("btn-toggle-role");
const btnToggleShell = document.getElementById("btn-toggle-shell");
const btnToggleMesh = document.getElementById("btn-toggle-mesh");
const btnReset = document.getElementById("btn-reset");
const btnErrPack = document.getElementById("btn-err-pack");
const btnErrRival = document.getElementById("btn-err-rival");
const btnErrCrush = document.getElementById("btn-err-crush");

const mobilePill = document.getElementById("mobile-status-pill");
const mobilePillText = document.getElementById("mobile-pill-text");
const miniLiveSvg = document.getElementById("mini-live-svg");
const pmcLiveFoot = document.getElementById("pmc-live-foot");

const badgeEls = {
  grouping: document.querySelector('[data-check="grouping"]'),
  focus: document.querySelector('[data-check="focus"]'),
  hierarchy: document.querySelector('[data-check="hierarchy"]'),
  proximity: document.querySelector('[data-check="proximity"]'),
};
const chkVals = {
  grouping: document.getElementById("chk-grouping"),
  focus: document.getElementById("chk-focus"),
  hierarchy: document.getElementById("chk-hierarchy"),
  proximity: document.getElementById("chk-proximity"),
};

// 平滑动画渲染缓存（所有交互立刻更新逻辑真源，渲染层以自然缓动跟上；still 模式直接一步到位）
let evalCache = evaluateCluster(state);
const animPos = new Map();
for (const it of evalCache.items) animPos.set(it.id, { x: it.x, y: it.y });
let animShell = { x: evalCache.shell.x, y: evalCache.shell.y, r: evalCache.shell.r, alpha: 0.08 };
let heroIntro = 0; // 0..1 温和开场淡入展开，每一帧都清晰完整
let draggingItemId = null;
let dragOffset = { x: 0, y: 0 };
let pointerMoved = false;
let heroTransform = { scale: 1, ox: 0, oy: 0, cw: 800, ch: 600 };

// 离屏预编译静态点阵网格路径，避免每帧 266 次单独 fillRect 调用
const GRID_PATH = typeof Path2D !== "undefined" ? new Path2D() : null;
if (GRID_PATH) {
  for (let gx = 40; gx <= WORLD.w - 40; gx += 40) {
    for (let gy = 40; gy <= WORLD.h - 40; gy += 40) {
      GRID_PATH.rect(gx - 0.9, gy - 0.9, 1.8, 1.8);
    }
  }
}

let heroDirty = true;

function resizeHeroCanvas() {
  const rect = heroWrap.getBoundingClientRect();
  // 窄屏/高 DPR 手机控制在 1.5 以兼顾锐利与软件渲染满帧
  const dpr = window.innerWidth <= 900 ? pixelRatio(1.5) : pixelRatio(2);
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(180, Math.round(rect.height));
  if (heroCanvas.width !== Math.round(w * dpr) || heroCanvas.height !== Math.round(h * dpr)) {
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
  }
  const scale = Math.min(w / WORLD.w, h / WORLD.h);
  const ox = (w - WORLD.w * scale) * 0.5;
  const oy = (h - WORLD.h * scale) * 0.5;
  heroTransform = { scale, ox, oy, cw: w, ch: h, dpr };
  heroDirty = true;
}

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => resizeHeroCanvas()).observe(heroWrap);
}
resizeHeroCanvas();

function clientToWorld(clientX, clientY) {
  const rect = heroCanvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    x: (sx - heroTransform.ox) / heroTransform.scale,
    y: (sy - heroTransform.oy) / heroTransform.scale,
  };
}

function drawDots3x3(ctx, cx, cy, r, fill) {
  const step = r * 0.68;
  const dotR = r * 0.21;
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      const px = cx + col * step;
      const py = cy + row * step;
      ctx.moveTo(px + dotR, py);
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

function drawItemShape(ctx, it, x, y, inCore, isSelected, shellVisible) {
  let fill = COLORS.lilac;
  if (it.tone === "lavender-core") {
    fill = inCore && shellVisible ? COLORS.lavender : "#6F53B5";
  } else if (it.tone === "cream-core") {
    fill = inCore && shellVisible ? COLORS.cream : COLORS.indigo;
  } else if (it.tone === "lilac-core") {
    fill = inCore && shellVisible ? "#8E70C9" : "#9E84D4";
  } else if (it.tone === "white-dots") {
    fill = inCore && shellVisible ? "#FFFFFF" : COLORS.indigo;
  } else if (it.tone === "indigo-sat") {
    fill = COLORS.indigo;
  } else if (it.tone === "pale-sat") {
    fill = inCore && shellVisible ? "#B49CE0" : COLORS.lilac;
  } else if (it.tone === "pale-dots") {
    fill = inCore && shellVisible ? "#E4D9F8" : COLORS.paleDot;
  }

  ctx.save();
  if (it.shape === "square") {
    ctx.fillStyle = fill;
    ctx.fillRect(x - it.r, y - it.r, it.r * 2, it.r * 2);
    if (!shellVisible && it.tone === "cream-core") {
      ctx.strokeStyle = COLORS.indigo;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - it.r, y - it.r, it.r * 2, it.r * 2);
    }
  } else if (it.shape === "circle") {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, it.r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawDots3x3(ctx, x, y, it.r, fill);
  }

  // 选中态外框（锐利平面虚线选框）
  if (isSelected) {
    ctx.strokeStyle = inCore && shellVisible ? "#FFFFFF" : COLORS.ink;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    const pad = it.r + 7;
    if (it.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, pad, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(x - pad, y - pad, pad * 2, pad * 2);
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function updateMiniLiveSvg(ev) {
  miniLiveSvg.textContent = "";
  const sx = 110 / WORLD.w;
  const sy = 72 / WORLD.h;
  const s = Math.min(sx, sy);
  const ox = (110 - WORLD.w * s) * 0.5;
  const oy = (72 - WORLD.h * s) * 0.5;

  if (state.showShell && ev.shell.formed) {
    miniLiveSvg.append(
      svgEl("circle", {
        cx: (ox + ev.shell.x * s).toFixed(1),
        cy: (oy + ev.shell.y * s).toFixed(1),
        r: (ev.shell.r * s).toFixed(1),
        fill: COLORS.indigo,
        opacity: ev.passCount === 4 ? "1" : "0.82",
      })
    );
  }
  for (let i = 0; i < ev.items.length; i++) {
    const it = ev.items[i];
    const inCore = ev.coreSet.has(i);
    const x = ox + it.x * s;
    const y = oy + it.y * s;
    const r = Math.max(2.4, it.r * s);
    const fill =
      inCore && state.showShell && ev.shell.formed
        ? it.tone === "cream-core" || it.tone === "white-dots"
          ? "#F5EFE6"
          : COLORS.lavender
        : it.tone === "indigo-sat"
        ? COLORS.indigo
        : COLORS.lilac;
    if (it.shape === "square") {
      miniLiveSvg.append(svgEl("rect", { x: (x - r).toFixed(1), y: (y - r).toFixed(1), width: (r * 2).toFixed(1), height: (r * 2).toFixed(1), fill }));
    } else {
      miniLiveSvg.append(svgEl("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill }));
    }
  }
  pmcLiveFoot.textContent =
    ev.passCount === 4
      ? "元素成簇，关系清晰，重点突出"
      : ev.status === "error"
      ? ev.badge.replace(/^错态 · /, "")
      : `已亮 ${ev.passCount}/4 项原则`;
}

function syncHeroUI() {
  evalCache = evaluateCluster(state);
  const ev = evalCache;

  // 更新拨轨 UI（通过 --pct 确保滑块在 0% 和 100% 时完全留在轨内不压字）
  const pct = Math.round(state.pull);
  rail.style.setProperty("--pct", String(pct / 100));
  rail.setAttribute("aria-valuenow", String(pct));

  let zoneWord = "散落平权";
  if (pct >= 84) zoneWord = "过挤塌缩";
  else if (pct >= 66) zoneWord = "经验甜区";
  else if (pct >= 30) zoneWord = "聚拢中";
  pullReadout.textContent = `${pct}% · ${zoneWord}`;

  // 更新诊断盒
  diagBox.dataset.status = ev.status;
  diagBadge.textContent = ev.badge;
  diagScore.textContent = `${ev.passCount} / 4`;
  diagHeadline.textContent = ev.headline;
  diagReason.textContent = ev.reason;
  diagAction.textContent = ev.actionHint;

  mSep.textContent = ev.sepRatio > 0 ? `${ev.sepRatio.toFixed(1)}×` : "0.0×";
  mGap.textContent = `${Math.round(ev.minGlobalGap)}`;
  mWeight.textContent = `${Math.round(ev.focusShare * 100)}%`;
  mScale.textContent = `${ev.scaleRatio.toFixed(1)}×`;

  // 更新顶栏原海报四枚原则灯
  badgeEls.grouping.dataset.pass = String(ev.checks.grouping);
  chkVals.grouping.textContent = ev.checks.grouping
    ? `主簇 ${ev.coreItems.length} 件`
    : ev.hasRivalCluster
    ? "双簇争锋"
    : ev.coreItems.length >= 8
    ? `${ev.coreItems.length}/9 全塞满`
    : `主簇 ${ev.coreItems.length} 件`;

  badgeEls.focus.dataset.pass = String(ev.checks.focus);
  chkVals.focus.textContent = `${Math.round(ev.focusShare * 100)}% 权重`;

  badgeEls.hierarchy.dataset.pass = String(ev.checks.hierarchy);
  chkVals.hierarchy.textContent = ev.checks.hierarchy
    ? `${ev.scaleRatio.toFixed(1)}× 级差`
    : !ev.anchorInCore
    ? "缺主角锚"
    : `${ev.scaleRatio.toFixed(1)}× 偏平`;

  badgeEls.proximity.dataset.pass = String(ev.checks.proximity);
  chkVals.proximity.textContent =
    ev.minGlobalGap < 8
      ? `黏连 (${Math.round(ev.minGlobalGap)})`
      : `${ev.sepRatio.toFixed(1)}× 分离`;

  // 手机顶栏紧凑状态丸
  mobilePill.dataset.status = ev.status;
  mobilePillText.textContent = `${ev.passCount}/4 ${ev.badge.split(" · ")[1] || ev.badge}`;

  // 选中件操作钮
  const selIdx = ev.items.findIndex((it) => it.id === state.selectedId);
  const selItem = ev.items[selIdx >= 0 ? selIdx : 0];
  const selInCore = ev.coreSet.has(selIdx) || (ev.coreItems.length === 0 && !!state.membership[selItem.id]);
  selName.textContent = selItem.name;
  btnToggleRole.textContent = selInCore ? "移出弱化区" : "收进主簇";

  btnToggleShell.setAttribute("aria-pressed", String(state.showShell));
  btnToggleShell.textContent = state.showShell ? "底圆壳：显" : "底圆壳：隐";
  btnToggleMesh.setAttribute("aria-pressed", String(state.showMesh));
  btnToggleMesh.textContent = state.showMesh ? "实测距网：开" : "实测距网：关";

  updateMiniLiveSvg(ev);
  heroDirty = true;
}

function renderHeroFrame(t, dt, { still }) {
  const { scale, ox, oy, cw, ch, dpr } = heroTransform;
  const ctx = heroCtx;
  const ev = evalCache;

  // 平滑插值位置与底圆；仅在动画未收敛或状态脏时重绘，避免静置空转浪费软件渲染帧率
  let moving = false;
  if (still) {
    heroIntro = 1;
    for (const it of ev.items) animPos.set(it.id, { x: it.x, y: it.y });
    animShell = {
      x: ev.shell.x,
      y: ev.shell.y,
      r: ev.shell.r,
      alpha: ev.shell.formed ? 1 : 0,
    };
    moving = true;
  } else {
    if (heroIntro < 1) {
      heroIntro = Math.min(1, heroIntro + (dt || 0.016) * 1.9);
      moving = true;
    }
    const k = Math.min(1, (dt || 0.016) * 14);
    for (const it of ev.items) {
      const cur = animPos.get(it.id) || { x: it.x, y: it.y };
      if (draggingItemId === it.id) {
        if (cur.x !== it.x || cur.y !== it.y) moving = true;
        cur.x = it.x;
        cur.y = it.y;
      } else {
        const dx = it.x - cur.x;
        const dy = it.y - cur.y;
        if (Math.abs(dx) > 0.12 || Math.abs(dy) > 0.12) {
          cur.x += dx * k;
          cur.y += dy * k;
          moving = true;
        } else {
          cur.x = it.x;
          cur.y = it.y;
        }
      }
      animPos.set(it.id, cur);
    }
    const targetAlpha = ev.shell.formed ? 1 : 0;
    if (
      Math.abs(ev.shell.x - animShell.x) > 0.12 ||
      Math.abs(ev.shell.y - animShell.y) > 0.12 ||
      Math.abs(ev.shell.r - animShell.r) > 0.12 ||
      Math.abs(targetAlpha - animShell.alpha) > 0.005
    ) {
      animShell.x += (ev.shell.x - animShell.x) * k;
      animShell.y += (ev.shell.y - animShell.y) * k;
      animShell.r += (ev.shell.r - animShell.r) * k;
      animShell.alpha += (targetAlpha - animShell.alpha) * k;
      moving = true;
    } else {
      animShell.x = ev.shell.x;
      animShell.y = ev.shell.y;
      animShell.r = ev.shell.r;
      animShell.alpha = targetAlpha;
    }
  }

  if (!heroDirty && !moving) return;
  heroDirty = false;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cw, ch);

  // 纸底
  ctx.fillStyle = COLORS.light;
  ctx.fillRect(0, 0, cw, ch);

  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  // 纸面定位网格点（单次 Path2D 填充）
  ctx.fillStyle = "#DFD6EC";
  if (GRID_PATH) {
    ctx.fill(GRID_PATH);
  }

  // 原海报标志性的外围两条断续细虚线弧轨（围绕主簇核心）
  ctx.save();
  ctx.strokeStyle = "#5B4E8A";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([5, 6]);
  const orbitR = animShell.r + 74;
  ctx.beginPath();
  ctx.arc(animShell.x, animShell.y, orbitR, -Math.PI * 0.78, Math.PI * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(animShell.x, animShell.y, orbitR * 0.92, Math.PI * 0.52, Math.PI * 1.12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 共同区域：电光靛紫主簇大底圆（未成簇时显示淡虚线引导环）
  const shellVisible = state.showShell && animShell.alpha > 0.25;
  ctx.save();
  if (state.showShell && animShell.alpha > 0.02) {
    ctx.globalAlpha = animShell.alpha * (ev.status === "error" && ev.coreItems.length >= 8 ? 0.85 : 1);
    ctx.fillStyle = COLORS.indigo;
    ctx.beginPath();
    ctx.arc(animShell.x, animShell.y, animShell.r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 虚线空环：要么尚未成簇，要么用户关闭了共同区域底圆（纯邻近验真模式）
    ctx.strokeStyle = state.showShell ? COLORS.lilac : COLORS.indigo;
    ctx.lineWidth = state.showShell ? 1.8 : 1.4;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(animShell.x, animShell.y, animShell.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // 若开启实测距网，绘制最小生成树（MST）连线与关键分离比桥
  if (state.showMesh) {
    ctx.save();
    for (const e of ev.mst) {
      const a = animPos.get(ev.items[e.u].id);
      const b = animPos.get(ev.items[e.v].id);
      const bothCore = ev.coreSet.has(e.u) && ev.coreSet.has(e.v);
      const isColliding = e.gap < 8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      if (isColliding) {
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([]);
      } else if (bothCore) {
        ctx.strokeStyle = shellVisible ? "rgba(245, 239, 232, 0.72)" : COLORS.indigo;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
      } else {
        ctx.strokeStyle = "rgba(137, 107, 194, 0.55)";
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 5]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 标出最关键的「簇外最近桥」实测距离
    if (ev.nearestBridge && ev.outerItems.length > 0 && ev.coreItems.length >= 2) {
      const a = animPos.get(ev.items[ev.nearestBridge.u].id);
      const b = animPos.get(ev.items[ev.nearestBridge.v].id);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const label = `外距 ${Math.max(0, Math.round(ev.dOutMin))}`;
      ctx.font = '600 12px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = "rgba(251, 248, 244, 0.94)";
      ctx.fillRect(mx - tw / 2, my - 10, tw, 20);
      ctx.strokeStyle = ev.checks.proximity ? COLORS.ok : COLORS.indigo;
      ctx.lineWidth = 1;
      ctx.strokeRect(mx - tw / 2, my - 10, tw, 20);
      ctx.fillStyle = ev.checks.proximity ? COLORS.ok : COLORS.indigo;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my + 0.5);
    }
    ctx.restore();
  }

  // 绘制全部 9 枚几何元素
  for (let i = 0; i < ev.items.length; i++) {
    const it = ev.items[i];
    const p = animPos.get(it.id);
    const inCore = ev.coreSet.has(i);
    drawItemShape(ctx, it, p.x, p.y, inCore, it.id === state.selectedId, shellVisible);
  }

  // 绘制碰撞冲突警示圆（仅在真实过挤/重叠时出现）
  if (ev.collisions.length > 0) {
    ctx.save();
    for (const c of ev.collisions) {
      const a = animPos.get(ev.items[c.u].id);
      const b = animPos.get(ev.items[c.v].id);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      ctx.fillStyle = COLORS.err;
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - 3.5, my - 3.5);
      ctx.lineTo(mx + 3.5, my + 3.5);
      ctx.moveTo(mx + 3.5, my - 3.5);
      ctx.lineTo(mx - 3.5, my + 3.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 复刻 061 原海报标志性的两条竖向细虚线引注：「强聚焦区」与「弱化区」（垫暖白衬底防止虚线穿字）
  ctx.save();
  const strongReady = ev.passCount === 4;
  // 顶部「强聚焦区」引注
  const topAnchorX = Math.min(540, Math.max(240, animShell.x - 62));
  const topAnchorY = Math.max(96, animShell.y - animShell.r);
  ctx.strokeStyle = strongReady ? COLORS.indigo : "#7E71A8";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(topAnchorX, 34);
  ctx.lineTo(topAnchorX, topAnchorY);
  ctx.stroke();
  ctx.setLineDash([]);

  const topHead = strongReady
    ? "强聚焦区 · 已成立"
    : state.showShell
    ? "强聚焦区 · 待聚拢"
    : "纯邻近验证（无底圆）";
  const topSub = strongReady
    ? "元素紧密组合，形成视觉中心"
    : `当前分离比 ${ev.sepRatio.toFixed(1)}×（经验 ≥1.8×）`;
  ctx.fillStyle = "rgba(251, 248, 244, 0.94)";
  ctx.fillRect(topAnchorX + 8, 18, 212, 42);

  ctx.fillStyle = strongReady ? COLORS.indigo : "#8E7FC0";
  ctx.beginPath();
  ctx.arc(topAnchorX, 31, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 13.5px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(topHead, topAnchorX + 14, 30);
  ctx.font = '400 12px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.ink2;
  ctx.fillText(topSub, topAnchorX + 14, 49);

  // 底部「弱化区」引注（垫暖白衬底，避开左下操作提示）
  const botX = Math.min(500, Math.max(330, animShell.x - 10));
  const botY = Math.min(534, animShell.y + animShell.r + 74);
  if (botY < 540) {
    ctx.strokeStyle = "#8E7FC0";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(botX, botY);
    ctx.lineTo(botX, 544);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = "rgba(251, 248, 244, 0.94)";
  ctx.fillRect(botX + 8, 536, 260, 42);
  ctx.fillStyle = strongReady ? COLORS.indigo : "#8E7FC0";
  ctx.beginPath();
  ctx.arc(botX, 548, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 13.5px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(`弱化区 · 外围 ${ev.outerItems.length} 件`, botX + 14, 548);
  ctx.font = '400 12px "Noto Sans SC", sans-serif';
  ctx.fillStyle = COLORS.ink2;
  ctx.fillText("远离主簇，视觉权重降低，避免干扰核心信息", botX + 14, 567);
  ctx.restore();

  ctx.restore();
}

const heroLoop = loop(heroWrap, renderHeroFrame);

// ==================== HERO 交互：拨轨 + 画布直拖 + 按钮 ====================
// 交互触发时只标记 heroDirty；reducedMotion 下仍直接调用 draw() 立刻刷新静态帧
function requestHeroDraw() {
  heroDirty = true;
  if (reducedMotion.matches) heroLoop.draw();
}

function setPullValue(val, clearManual = false) {
  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  // 靠近原海报最佳甜区中心 74% 时轻微吸附（±1%），方便精确体验
  const next = Math.abs(clamped - 74) <= 1 ? 74 : clamped;
  if (next === state.pull && !clearManual) return;
  state.pull = next;
  if (clearManual) {
    for (const k of Object.keys(state.manual)) state.manual[k] = null;
  }
  syncHeroUI();
  requestHeroDraw();
}

let railDragging = false;
function updateRailFromClientX(clientX) {
  const rect = rail.getBoundingClientRect();
  const innerW = Math.max(1, rect.width - 36);
  const pct = ((clientX - (rect.left + 18)) / innerW) * 100;
  setPullValue(pct, false);
}

rail.addEventListener("pointerdown", (e) => {
  railDragging = true;
  rail.setPointerCapture(e.pointerId);
  updateRailFromClientX(e.clientX);
});

rail.addEventListener("pointermove", (e) => {
  if (!railDragging) return;
  updateRailFromClientX(e.clientX);
});

const endRail = () => {
  railDragging = false;
};
rail.addEventListener("pointerup", endRail);
rail.addEventListener("pointercancel", endRail);

rail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setPullValue(state.pull + (e.shiftKey ? 10 : 4));
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setPullValue(state.pull - (e.shiftKey ? 10 : 4));
  }
});

// 画布直接点选与拖拽任意元素
function hitTestItem(wx, wy) {
  const ev = evalCache;
  for (let i = ev.items.length - 1; i >= 0; i--) {
    const it = ev.items[i];
    const p = animPos.get(it.id) || it;
    const hitR = it.r + 10;
    if (it.shape === "circle") {
      if (Math.hypot(wx - p.x, wy - p.y) <= hitR) return it;
    } else {
      if (Math.abs(wx - p.x) <= hitR && Math.abs(wy - p.y) <= hitR) return it;
    }
  }
  return null;
}

heroCanvas.addEventListener("pointerdown", (e) => {
  const pt = clientToWorld(e.clientX, e.clientY);
  const hit = hitTestItem(pt.x, pt.y);
  if (!hit) return;
  e.preventDefault();
  draggingItemId = hit.id;
  pointerMoved = false;
  state.selectedId = hit.id;
  const p = animPos.get(hit.id) || hit;
  dragOffset = { x: p.x - pt.x, y: p.y - pt.y };
  heroCanvas.classList.add("is-dragging");
  heroCanvas.setPointerCapture(e.pointerId);
  syncHeroUI();
  heroLoop.draw();
});

heroCanvas.addEventListener("pointermove", (e) => {
  if (!draggingItemId) return;
  pointerMoved = true;
  const pt = clientToWorld(e.clientX, e.clientY);
  state.manual[draggingItemId] = {
    x: pt.x + dragOffset.x,
    y: pt.y + dragOffset.y,
  };
  // 同步当前坐标是否位于聚核附近，供按钮文案对齐
  const distToCore = Math.hypot(
    state.manual[draggingItemId].x - CORE_CENTER.x,
    state.manual[draggingItemId].y - CORE_CENTER.y
  );
  state.membership[draggingItemId] = distToCore < 190;
  syncHeroUI();
  heroLoop.draw();
});

const endCanvasDrag = () => {
  if (!draggingItemId) return;
  draggingItemId = null;
  heroCanvas.classList.remove("is-dragging");
};
heroCanvas.addEventListener("pointerup", endCanvasDrag);
heroCanvas.addEventListener("pointercancel", endCanvasDrag);

btnToggleRole.addEventListener("click", () => {
  const id = state.selectedId;
  const ev = evalCache;
  const idx = ev.items.findIndex((it) => it.id === id);
  const currentlyInCore = ev.coreSet.has(idx) || (ev.coreItems.length === 0 && !!state.membership[id]);
  state.membership[id] = !currentlyInCore;
  state.manual[id] = null;
  if (state.pull < 66) state.pull = 74;
  syncHeroUI();
  heroLoop.draw();
});

btnToggleShell.addEventListener("click", () => {
  state.showShell = !state.showShell;
  syncHeroUI();
  heroLoop.draw();
});

btnToggleMesh.addEventListener("click", () => {
  state.showMesh = !state.showMesh;
  syncHeroUI();
  heroLoop.draw();
});

btnReset.addEventListener("click", () => {
  const fresh = createInitialState();
  Object.assign(state, fresh);
  syncHeroUI();
  heroLoop.draw();
});

// 三个经典错态一键演练（验证每一种玩错态都真实由几何触发）
btnErrPack.addEventListener("click", () => {
  for (const k of Object.keys(state.membership)) {
    state.membership[k] = true;
    state.manual[k] = null;
  }
  state.pull = 72;
  syncHeroUI();
  heroLoop.draw();
});

btnErrRival.addEventListener("click", () => {
  const fresh = createInitialState();
  Object.assign(state, fresh);
  state.pull = 74;
  // 把外围 3 件紧凑但不互撞地抱成第二团，真实造出抢戏第二簇
  state.manual["sat-indigo"] = { x: 142, y: 252 };
  state.manual["sat-sq"] = { x: 136, y: 368 };
  state.manual["sat-orb"] = { x: 238, y: 342 };
  syncHeroUI();
  heroLoop.draw();
});

btnErrCrush.addEventListener("click", () => {
  const fresh = createInitialState();
  Object.assign(state, fresh);
  state.pull = 96;
  syncHeroUI();
  heroLoop.draw();
});

window.addEventListener("resize", () => {
  resizeHeroCanvas();
  requestHeroDraw();
});
syncHeroUI();
heroLoop.draw();

// ==================== 01 节：四条铁律可视化透视 ====================
const pDiagram = document.getElementById("p-diagram");
const pCaption = document.getElementById("p-caption");
const pTabs = [...document.querySelectorAll(".tab-card")];

const P_COPY = {
  focus: [
    "视觉聚焦 · 把高对比体量集中进一处",
    "当 5 件高饱和、高反差元素抱紧，其余 4 件降调并退到外围，视线首落点立刻被大圆牢牢吸住，不再漫无目的游走。",
  ],
  group: [
    "群组关系 · 靠外距与内距的悬殊比例划清界线",
    "簇内元素平均净隙小、外围卫星隔着宽阔护城河——哪怕没有任何文字标签，大脑也会自动把圈内 5 件归成一家人。",
  ],
  hier: [
    "主次层级 · 进圈之后还要分出「一大带多小」",
    "主视觉大方块面积约是最小收尾块的 7 倍，亮白圆承担次高对比落点，3×3 点阵负责节奏收尾，进簇一眼就能按序读完。",
  ],
  dense: [
    "信息集中 · 把 9 次零散跳跃压缩成 2 步阅读",
    "分散排布时，眼睛要在 9 个孤立点之间反复跳转；聚成「主簇 + 弱化区」后，首眼直抓核心整体，次眼才扫向辅注。",
  ],
};

function drawPrincipleDiagram(mode) {
  pDiagram.textContent = "";
  const g = svgEl("g");

  // 基础背景与原海报同源构图
  g.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 390, fill: COLORS.light }));
  const cx = 310;
  const cy = 198;

  // 外围虚线弧
  g.append(
    svgEl("circle", {
      cx,
      cy,
      r: 162,
      fill: "none",
      stroke: "#9B8CC4",
      "stroke-width": 1.2,
      "stroke-dasharray": "5 5",
    })
  );

  // 聚焦模式下的注意力热晕
  if (mode === "focus") {
    g.append(svgEl("circle", { cx, cy, r: 146, fill: COLORS.indigo, opacity: "0.10" }));
    g.append(svgEl("circle", { cx, cy, r: 128, fill: COLORS.indigo, opacity: "0.16" }));
  }

  // 主簇底圆
  g.append(svgEl("circle", { cx, cy, r: 112, fill: COLORS.indigo }));

  // 簇内 5 件
  const coreNodes = [
    { kind: "rect", x: 242, y: 128, w: 80, h: 80, fill: COLORS.lavender, lx: 282, ly: 168, rank: "1" },
    { kind: "circle", cx: 364, cy: 150, r: 26, fill: COLORS.cream, lx: 364, ly: 150, rank: "2" },
    { kind: "circle", cx: 370, cy: 214, r: 20, fill: "#8E70C9", lx: 370, ly: 214, rank: "3" },
    { kind: "dots", cx: 298, cy: 252, fill: "#FFFFFF", lx: 298, ly: 252, rank: "4" },
    { kind: "rect", x: 344, y: 248, w: 30, h: 30, fill: COLORS.lavender, lx: 359, ly: 263, rank: "5" },
  ];

  // 外围 4 件
  const outerNodes = [
    { kind: "circle", cx: 148, cy: 96, r: 22, fill: COLORS.indigo },
    { kind: "rect", x: 96, y: 268, w: 50, h: 50, fill: COLORS.lilac },
    { kind: "circle", cx: 472, cy: 306, r: 24, fill: COLORS.lilac },
    { kind: "dots", cx: 476, cy: 92, fill: COLORS.lilac },
  ];

  for (const n of outerNodes) {
    if (n.kind === "rect") {
      g.append(svgEl("rect", { x: n.x, y: n.y, width: n.w, height: n.h, fill: n.fill }));
    } else if (n.kind === "circle") {
      g.append(svgEl("circle", { cx: n.cx, cy: n.cy, r: n.r, fill: n.fill }));
    } else {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          g.append(svgEl("circle", { cx: n.cx + c * 11, cy: n.cy + r * 11, r: 3.3, fill: n.fill }));
        }
      }
    }
  }

  for (const n of coreNodes) {
    if (n.kind === "rect") {
      g.append(svgEl("rect", { x: n.x, y: n.y, width: n.w, height: n.h, fill: n.fill }));
    } else if (n.kind === "circle") {
      g.append(svgEl("circle", { cx: n.cx, cy: n.cy, r: n.r, fill: n.fill }));
    } else {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          g.append(svgEl("circle", { cx: n.cx + c * 12, cy: n.cy + r * 12, r: 3.8, fill: n.fill }));
        }
      }
    }
  }

  // 模式专属标注图层
  if (mode === "focus") {
    g.append(svgEl("line", { x1: 24, y1: 202, x2: 192, y2: 202, stroke: COLORS.indigo, "stroke-width": 2 }));
    g.append(svgEl("polygon", { points: "194,202 184,197 184,207", fill: COLORS.indigo }));
    g.append(svgEl("text", { x: 24, y: 188, fill: COLORS.indigo, "font-size": 13, "font-weight": 700 }, "第一眼吸力"));
    g.append(svgEl("text", { x: 24, y: 220, fill: COLORS.ink2, "font-size": 11.5 }, "高对比核心区"));
  } else if (mode === "group") {
    // 簇内短距 vs 簇外长距
    g.append(svgEl("line", { x1: 322, y1: 162, x2: 338, y2: 154, stroke: "#FFFFFF", "stroke-width": 2.4 }));
    g.append(svgEl("line", { x1: 170, y1: 106, x2: 242, y2: 146, stroke: COLORS.err, "stroke-width": 2, "stroke-dasharray": "4 3" }));
    g.append(svgEl("rect", { x: 146, y: 138, width: 92, height: 22, fill: COLORS.light, stroke: COLORS.err }));
    g.append(svgEl("text", { x: 192, y: 153, fill: COLORS.err, "font-size": 11.5, "font-weight": 700, "text-anchor": "middle" }, "簇外距 3.2×"));
    g.append(svgEl("rect", { x: 292, y: 100, width: 78, height: 21, fill: COLORS.light, stroke: COLORS.indigo }));
    g.append(svgEl("text", { x: 331, y: 114, fill: COLORS.indigo, "font-size": 11.5, "font-weight": 700, "text-anchor": "middle" }, "簇内距 1.0×"));
  } else if (mode === "hier") {
    for (const n of coreNodes) {
      g.append(svgEl("circle", { cx: n.lx, cy: n.ly, r: 12, fill: COLORS.ink, stroke: "#FFFFFF", "stroke-width": 1.8 }));
      g.append(svgEl("text", { x: n.lx, y: n.ly + 4, fill: "#FFFFFF", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, n.rank));
    }
    g.append(svgEl("text", { x: 24, y: 42, fill: COLORS.ink, "font-size": 13, "font-weight": 700 }, "簇内读序：1 主块 → 2 亮圆 → 3→4→5 辅件"));
  } else if (mode === "dense") {
    // 2 步大跳路径示意
    g.append(svgEl("path", { d: "M 54 64 Q 180 120 286 172", fill: "none", stroke: COLORS.ok, "stroke-width": 2.6, "stroke-dasharray": "6 4" }));
    g.append(svgEl("path", { d: "M 352 248 Q 422 270 462 296", fill: "none", stroke: COLORS.ok, "stroke-width": 2, "stroke-dasharray": "6 4" }));
    g.append(svgEl("circle", { cx: 54, cy: 64, r: 12, fill: COLORS.ok }));
    g.append(svgEl("text", { x: 54, y: 68, fill: "#FFFFFF", "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "入"));
    g.append(svgEl("rect", { x: 22, y: 344, width: 220, height: 28, fill: "#E7F4EF", stroke: COLORS.ok }));
    g.append(svgEl("text", { x: 132, y: 362, fill: COLORS.ok, "font-size": 12, "font-weight": 700, "text-anchor": "middle" }, "9 次散乱扫视 → 压缩为 2 步"));
  }

  pDiagram.append(g);
  const [title, desc] = P_COPY[mode];
  pCaption.querySelector("strong").textContent = title;
  pCaption.querySelector("span").textContent = desc;
}

for (const btn of pTabs) {
  btn.addEventListener("click", () => {
    for (const b of pTabs) b.setAttribute("aria-selected", String(b === btn));
    drawPrincipleDiagram(btn.dataset.p);
  });
}
drawPrincipleDiagram("focus");

// ==================== 02 节：纯距离律点阵翻面仪 ====================
const latCanvas = document.getElementById("lattice-canvas");
const latCtx = latCanvas.getContext("2d");
const rngDx = document.getElementById("rng-dx");
const rngDy = document.getElementById("rng-dy");
const dxVal = document.getElementById("dx-val");
const dyVal = document.getElementById("dy-val");
const latKicker = document.getElementById("lat-kicker");
const latTitle = document.getElementById("lat-title");
const latDetail = document.getElementById("lat-detail");
const latPin = document.getElementById("lat-pin");

let latState = { dx: 52, dy: 52 };
let latDirty = true;

function renderLattice(force = false) {
  if (!latDirty && !force) return;
  latDirty = false;
  const { dx, dy } = latState;
  const ev = evaluateLattice(dx, dy);
  dxVal.textContent = String(dx);
  dyVal.textContent = String(dy);

  const kickerMap = {
    ambiguous: "示意倾向 · 双稳态摇摆",
    rows: `示意倾向 · 横排占优（${Math.round(50 + ev.bias * 49)}%）`,
    cols: `示意倾向 · 竖列占优（${Math.round(50 + ev.bias * 49)}%）`,
  };
  latKicker.textContent = kickerMap[ev.mode];
  latTitle.textContent = ev.title;
  latDetail.textContent = ev.detail;

  // 指针位置：左端 10% 横排，中间 50% 双稳态，右端 90% 竖列
  const pinPct =
    ev.mode === "rows" ? 50 - ev.bias * 40 : ev.mode === "cols" ? 50 + ev.bias * 40 : 50;
  latPin.style.left = `${pinPct.toFixed(1)}%`;

  const dpr = window.innerWidth <= 900 ? pixelRatio(1.5) : pixelRatio(2);
  const w = 520;
  const h = 340;
  if (latCanvas.width !== Math.round(w * dpr) || latCanvas.height !== Math.round(h * dpr)) {
    latCanvas.width = Math.round(w * dpr);
    latCanvas.height = Math.round(h * dpr);
  }
  const ctx = latCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);

  const cols = 5;
  const rows = 5;
  const totalW = (cols - 1) * dx;
  const totalH = (rows - 1) * dy;
  const startX = (w - totalW) * 0.5;
  const startY = (h - totalH) * 0.5;

  // 绘制感知分组胶囊底色（强度按纯距离律示意倾向渐变）
  if (ev.mode === "rows") {
    ctx.fillStyle = `rgba(63, 46, 148, ${(0.08 + ev.bias * 0.14).toFixed(3)})`;
    for (let r = 0; r < rows; r++) {
      const y = startY + r * dy;
      ctx.beginPath();
      ctx.roundRect(startX - 18, y - 16, totalW + 36, 32, 16);
      ctx.fill();
    }
  } else if (ev.mode === "cols") {
    ctx.fillStyle = `rgba(137, 107, 194, ${(0.1 + ev.bias * 0.16).toFixed(3)})`;
    for (let c = 0; c < cols; c++) {
      const x = startX + c * dx;
      ctx.beginPath();
      ctx.roundRect(x - 16, startY - 18, 32, totalH + 36, 16);
      ctx.fill();
    }
  }

  // 单次路径批量绘制 25 枚等大实心点
  ctx.fillStyle = COLORS.indigo;
  ctx.beginPath();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * dx;
      const y = startY + r * dy;
      ctx.moveTo(x + 8.5, y);
      ctx.arc(x, y, 8.5, 0, Math.PI * 2);
    }
  }
  ctx.fill();

  // 在左上第一个单元标注实时 dx / dy 标尺
  ctx.strokeStyle = COLORS.ink2;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(startX, startY - 24);
  ctx.lineTo(startX + dx, startY - 24);
  ctx.moveTo(startX - 24, startY);
  ctx.lineTo(startX - 24, startY + dy);
  ctx.stroke();

  ctx.font = '600 11.5px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "center";
  ctx.fillText(`dx ${dx}`, startX + dx * 0.5, startY - 30);
  ctx.textAlign = "right";
  ctx.fillText(`dy ${dy}`, startX - 30, startY + dy * 0.5 + 4);

  ctx.restore();
}

const latLoop = loop(latCanvas, (_t, _dt, { still }) => renderLattice(still));
rngDx.addEventListener("input", () => {
  latState.dx = Number(rngDx.value);
  latDirty = true;
  latLoop.draw();
});
rngDy.addEventListener("input", () => {
  latState.dy = Number(rngDy.value);
  latDirty = true;
  latLoop.draw();
});
for (const b of document.querySelectorAll("[data-lat]")) {
  b.addEventListener("click", () => {
    const [x, y] = b.dataset.lat.split(",").map(Number);
    latState = { dx: x, dy: y };
    rngDx.value = String(x);
    rngDy.value = String(y);
    latDirty = true;
    latLoop.draw();
  });
}
renderLattice(true);

// ==================== 03 节：共同区域 vs 邻近三力拔河 ====================
const tugSvg = document.getElementById("tug-svg");
const btnTugProx = document.getElementById("tug-prox");
const btnTugReg = document.getElementById("tug-reg");
const btnTugSim = document.getElementById("tug-sim");
const tugWinner = document.getElementById("tug-winner");
const tugGrouping = document.getElementById("tug-grouping");
const tugText = document.getElementById("tug-text");

const tugState = { proximity: true, region: true, similarity: false };

function renderTug() {
  tugSvg.textContent = "";
  const ev = evaluateTugOfWar(tugState);

  btnTugProx.setAttribute("aria-pressed", String(tugState.proximity));
  btnTugReg.setAttribute("aria-pressed", String(tugState.region));
  btnTugSim.setAttribute("aria-pressed", String(tugState.similarity));

  tugWinner.textContent = ev.winner;
  tugGrouping.textContent = ev.grouping;
  tugText.textContent = ev.text;

  // 6 枚圆点横坐标：等距 vs 两两拉近 (0,1)(2,3)(4,5)，保证两个底框之间留出清晰缝隙不相交
  const xs = tugState.proximity
    ? [112, 184, 392, 464, 672, 744]
    : [130, 254, 378, 502, 626, 750];
  const cy = 108;

  // 共同区域底圆框：[1,2] 与 [3,4] 跨界套住，检验 Palmer (1992)
  if (tugState.region) {
    const pairs = [
      [xs[1], xs[2]],
      [xs[3], xs[4]],
    ];
    for (const [x1, x2] of pairs) {
      const pad = 33;
      tugSvg.append(
        svgEl("rect", {
          x: x1 - pad,
          y: cy - 48,
          width: x2 - x1 + pad * 2,
          height: 96,
          rx: 48,
          fill: "rgba(188, 171, 222, 0.22)",
          stroke: "#BCABDE",
          "stroke-width": 2.2,
        })
      );
      tugSvg.append(
        svgEl(
          "text",
          {
            x: (x1 + x2) * 0.5,
            y: cy - 58,
            fill: "#D8CEFA",
            "font-size": 12,
            "font-weight": 600,
            "text-anchor": "middle",
          },
          "共同区域底框"
        )
      );
    }
  }

  // 距离配对底层虚线标记
  if (tugState.proximity) {
    for (const [a, b] of [
      [0, 1],
      [2, 3],
      [4, 5],
    ]) {
      tugSvg.append(
        svgEl("line", {
          x1: xs[a],
          y1: cy + 56,
          x2: xs[b],
          y2: cy + 56,
          stroke: "#8AD6CB",
          "stroke-width": 2,
        })
      );
      tugSvg.append(
        svgEl(
          "text",
          {
            x: (xs[a] + xs[b]) * 0.5,
            y: cy + 74,
            fill: "#B7EAE3",
            "font-size": 11.5,
            "font-weight": 600,
            "text-anchor": "middle",
          },
          "近邻"
        )
      );
    }
  }

  // 绘制 6 个圆点与编号
  const simColors = ["#F5EFE8", "#F5EFE8", "#8AD6CB", "#8AD6CB", "#FFAE9E", "#FFAE9E"];
  for (let i = 0; i < 6; i++) {
    const fill = tugState.similarity ? simColors[i] : "#F5EFE8";
    tugSvg.append(svgEl("circle", { cx: xs[i], cy, r: 24, fill }));
    tugSvg.append(
      svgEl(
        "text",
        {
          x: xs[i],
          y: cy + 5,
          fill: COLORS.ink,
          "font-size": 15,
          "font-weight": 700,
          "text-anchor": "middle",
        },
        String(i + 1)
      )
    );
  }
}

btnTugProx.addEventListener("click", () => {
  tugState.proximity = !tugState.proximity;
  renderTug();
});
btnTugReg.addEventListener("click", () => {
  tugState.region = !tugState.region;
  renderTug();
});
btnTugSim.addEventListener("click", () => {
  tugState.similarity = !tugState.similarity;
  renderTug();
});
for (const b of document.querySelectorAll("[data-tug]")) {
  b.addEventListener("click", () => {
    const [p, r, s] = b.dataset.tug.split(",").map((v) => v === "1");
    tugState.proximity = p;
    tugState.region = r;
    tugState.similarity = s;
    renderTug();
  });
}
renderTug();

// ==================== 04 节：12 条天气信息工作记忆组块切分器 ====================
const WEATHER_ITEMS = [
  { k: "城市", v: "杭州", g4: "核心气温", g2: "出门体感" },
  { k: "气温", v: "21°C", g4: "核心气温", g2: "出门体感" },
  { k: "体感", v: "20°C", g4: "核心气温", g2: "出门体感" },
  { k: "风向", v: "东南风", g4: "风与水汽", g2: "出门体感" },
  { k: "风速", v: "3 级", g4: "风与水汽", g2: "出门体感" },
  { k: "湿度", v: "58%", g4: "风与水汽", g2: "出门体感" },
  { k: "空气", v: "优 32", g4: "空气与能见", g2: "环境与天光" },
  { k: "PM2.5", v: "14", g4: "空气与能见", g2: "环境与天光" },
  { k: "能见度", v: "16 km", g4: "空气与能见", g2: "环境与天光" },
  { k: "紫外线", v: "中等", g4: "日照时段", g2: "环境与天光" },
  { k: "日出", v: "05:38", g4: "日照时段", g2: "环境与天光" },
  { k: "日落", v: "18:42", g4: "日照时段", g2: "环境与天光" },
];

const CHUNK_META = {
  12: [
    "12 个独立散件 · 远超单眼 4 组块工作记忆上限",
    "每条数据自己占一小格，没有语义归并。人眼必须像点名一样逐格翻找「湿度」「日落」，阅读节奏支离破碎。",
  ],
  6: [
    "6 个中等碎簇 · 略好于散件，但分类粒度仍偏细",
    "6 组已开始逼近记忆容量上沿，视线仍需要在半打标题之间来回比对，适合高密度工具栏，不适合一眼抓重点。",
  ],
  4: [
    "4 个语义簇 · 刚好落在人脑单眼工作记忆舒适区",
    "核心气温、风与水汽、空气能见、日照时段各成一簇。12 条零碎读数被压缩成 4 个一眼可吞咽的组块，找任何一项只需先定位簇、再读内部。",
  ],
  2: [
    "2 个宽泛大簇 · 宏观简洁，但单簇内部偏长",
    "只分「出门体感」与「环境天光」两组，总览极轻，但在每组 6 条里查找具体数值时，内部扫描时间会略有上升。",
  ],
  1: [
    "1 整坨全塞满 · 分类边界消失，退回拥挤清查",
    "把 12 条毫无留白地挤进同一个大框，等于根本没有分组——这跟开场玩具里「9/9 全员成坨」犯的是同一个错。",
  ],
};

const chunkBoard = document.getElementById("chunk-board");
const chunkTitle = document.getElementById("chunk-title");
const chunkDesc = document.getElementById("chunk-desc");
const stepBtns = [...document.querySelectorAll(".step-btn")];

function renderChunks(count) {
  chunkBoard.dataset.chunks = String(count);
  chunkBoard.textContent = "";

  let groups = [];
  if (count === 12) {
    groups = WEATHER_ITEMS.map((it) => ({ title: "", items: [it] }));
  } else if (count === 6) {
    const names = ["定位与温度", "体感与风向", "风速与湿度", "空气指数", "能见与紫外", "日出日落"];
    for (let i = 0; i < 6; i++) {
      groups.push({ title: names[i], items: WEATHER_ITEMS.slice(i * 2, i * 2 + 2) });
    }
  } else if (count === 4) {
    const map = new Map();
    for (const it of WEATHER_ITEMS) {
      if (!map.has(it.g4)) map.set(it.g4, []);
      map.get(it.g4).push(it);
    }
    groups = [...map.entries()].map(([title, items]) => ({ title, items }));
  } else if (count === 2) {
    const map = new Map();
    for (const it of WEATHER_ITEMS) {
      if (!map.has(it.g2)) map.set(it.g2, []);
      map.get(it.g2).push(it);
    }
    groups = [...map.entries()].map(([title, items]) => ({ title, items }));
  } else {
    groups = [{ title: "全部 12 项挤在一起", items: WEATHER_ITEMS }];
  }

  for (const grp of groups) {
    const box = document.createElement("div");
    box.className = "chunk-group";
    if (grp.title) {
      const hd = document.createElement("div");
      hd.className = "cg-head";
      hd.textContent = grp.title;
      box.append(hd);
    }
    const list = document.createElement("div");
    list.className = "cg-items";
    for (const it of grp.items) {
      const span = document.createElement("span");
      span.className = "cg-item";
      span.textContent = it.k;
      const b = document.createElement("b");
      b.textContent = it.v;
      span.append(b);
      list.append(span);
    }
    box.append(list);
    chunkBoard.append(box);
  }

  chunkTitle.textContent = CHUNK_META[count][0];
  chunkDesc.textContent = CHUNK_META[count][1];
}

for (const btn of stepBtns) {
  btn.addEventListener("click", () => {
    const n = Number(btn.dataset.chunks);
    for (const b of stepBtns) b.setAttribute("aria-pressed", String(b === btn));
    renderChunks(n);
  });
}
renderChunks(4);

// ==================== 05 节：真实版面分割对比幕（Curtain Compare） ====================
const curtainViewport = document.getElementById("curtain-viewport");
const curtainBefore = document.getElementById("curtain-before");
const curtainAfter = document.getElementById("curtain-after");
const curtainDivider = document.getElementById("curtain-divider");
const curtainNote = document.getElementById("curtain-note");
const sceneTabs = [...document.querySelectorAll("[data-scene]")];

let curtainPct = 42;
let currentScene = "poster";

const SCENES = {
  poster: {
    note: "<strong>展览海报改法：</strong>把主标题、副题与核心图形靠拢成右侧强聚焦视觉簇；展期、地点、票务打包成紧凑信息簇，中间让出 2.5 倍宽的呼吸留白。",
    beforeSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#F5EFE8"/>
        <text x="54" y="76" fill="#0D1935" font-size="22" font-weight="900">城市声景特展</text>
        <text x="410" y="74" fill="#3A3D58" font-size="14">2026.05.12 — 07.30</text>
        <circle cx="340" cy="186" r="46" fill="#896BC2"/>
        <rect x="64" y="168" width="110" height="34" fill="#BCABDE"/>
        <text x="119" y="190" fill="#0D1935" font-size="13" text-anchor="middle">免费预约</text>
        <text x="480" y="192" fill="#3A3D58" font-size="13">西岸艺仓 3 号馆</text>
        <text x="64" y="316" fill="#3A3D58" font-size="13">四十组空间录音装置</text>
        <text x="448" y="316" fill="#3F2E94" font-size="13" font-weight="700">策展人：林序</text>
      </svg>`,
    afterSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#FBF8F4"/>
        <!-- 右侧强聚焦视觉簇（图文紧抱但不互压） -->
        <circle cx="556" cy="186" r="92" fill="#3F2E94"/>
        <rect x="502" y="136" width="58" height="58" fill="#896BC2"/>
        <circle cx="590" cy="158" r="19" fill="#F5EFE6"/>
        <circle cx="586" cy="218" r="15" fill="#BCABDE"/>
        <text x="292" y="114" fill="#0D1935" font-size="25" font-weight="900">城市声景特展</text>
        <text x="292" y="140" fill="#3F2E94" font-size="13" font-weight="700">四十组空间录音装置</text>
        <!-- 下方轻巧弱化信息簇（拉开 2.5× 呼吸留白） -->
        <line x1="292" y1="258" x2="424" y2="258" stroke="#3F2E94" stroke-width="2"/>
        <text x="292" y="284" fill="#0D1935" font-size="14" font-weight="700">2026.05.12 — 07.30</text>
        <text x="292" y="306" fill="#3A3D58" font-size="12.5">西岸艺仓 3 号馆 · 免费预约</text>
        <circle cx="88" cy="108" r="18" fill="#BCABDE"/>
        <rect x="74" y="274" width="32" height="32" fill="#E1D8F1"/>
      </svg>`,
  },
  card: {
    note: "<strong>手机信息卡改法：</strong>把封面图、标题与标签紧扣在上部主簇，价格与下单操作并拢在底部行动簇；旧版每行都等距平均撑开，看不出哪两行属于同一决策。",
    beforeSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#F5EFE8"/>
        <rect x="190" y="22" width="300" height="336" fill="#FBF8F4" stroke="#CFC4DF" stroke-width="1.5"/>
        <rect x="214" y="42" width="252" height="84" fill="#BCABDE"/>
        <text x="214" y="164" fill="#0D1935" font-size="17" font-weight="700">手冲咖啡滤杯套装</text>
        <text x="214" y="206" fill="#3A3D58" font-size="13">高硼硅玻璃 · 1–2 人份</text>
        <text x="214" y="252" fill="#3F2E94" font-size="18" font-weight="700">¥ 168</text>
        <text x="214" y="294" fill="#3A3D58" font-size="12.5">48 小时内发货 · 7 天退换</text>
        <rect x="214" y="314" width="252" height="30" fill="#3F2E94"/>
        <text x="340" y="334" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">加入购物车</text>
      </svg>`,
    afterSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#FBF8F4"/>
        <rect x="190" y="22" width="300" height="336" fill="#FFFFFF" stroke="#0D1935" stroke-width="1.8"/>
        <!-- 认知主簇：图 + 题 + 规格紧贴 -->
        <rect x="210" y="38" width="260" height="114" fill="#3F2E94"/>
        <circle cx="340" cy="95" r="32" fill="#F5EFE6"/>
        <text x="210" y="180" fill="#0D1935" font-size="18" font-weight="900">手冲咖啡滤杯套装</text>
        <text x="210" y="202" fill="#3A3D58" font-size="12.5">高硼硅玻璃 · 1–2 人份 · 48h 发货</text>
        <!-- 决策留白沟后：底部价格 + 行动簇紧扣 -->
        <rect x="210" y="274" width="260" height="66" fill="#F5EFE8" stroke="#CFC4DF"/>
        <text x="226" y="306" fill="#3F2E94" font-size="22" font-weight="900">¥ 168</text>
        <text x="226" y="326" fill="#3A3D58" font-size="11.5">7 天无理由退换</text>
        <rect x="344" y="288" width="114" height="38" fill="#3F2E94"/>
        <text x="401" y="312" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">立即加购</text>
      </svg>`,
  },
  dash: {
    note: "<strong>指标摘要页改法：</strong>把「本周转化率」做成最大数字主簇压住左半区，三条次级对照指标聚拢在右侧浅底辅簇中；旧版 6 个同尺寸小格子摊满画面，核心结论被淹没。",
    beforeSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#F5EFE8"/>
        ${[0, 1, 2, 3, 4, 5]
          .map((i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = 44 + col * 204;
            const y = 52 + row * 148;
            const labels = ["访客数", "转化率", "客单价", "复购率", "跳出率", "停留时长"];
            const vals = ["14,280", "4.8%", "¥216", "28%", "39%", "3m 12s"];
            return `<rect x="${x}" y="${y}" width="184" height="124" fill="#FBF8F4" stroke="#CFC4DF" stroke-width="1.5"/>
              <text x="${x + 18}" y="${y + 42}" fill="#3A3D58" font-size="13">${labels[i]}</text>
              <text x="${x + 18}" y="${y + 84}" fill="#0D1935" font-size="24" font-weight="700">${vals[i]}</text>`;
          })
          .join("")}
      </svg>`,
    afterSvg: `
      <svg viewBox="0 0 680 380" aria-hidden="true">
        <rect width="680" height="380" fill="#FBF8F4"/>
        <!-- 左侧单一核心主簇 -->
        <rect x="44" y="48" width="320" height="284" fill="#3F2E94"/>
        <text x="76" y="100" fill="#D8CEFA" font-size="14" font-weight="600">核心北极星 · 本周转化率</text>
        <text x="76" y="208" fill="#FFFFFF" font-size="76" font-weight="900">4.8%</text>
        <text x="76" y="256" fill="#F5EFE8" font-size="14">较上周 +0.9% · 访客 14,280 人</text>
        <text x="76" y="284" fill="#BCABDE" font-size="12.5">客单价 ¥216（主漏斗健康）</text>
        <!-- 右侧弱化辅指标簇 -->
        <rect x="412" y="48" width="224" height="284" fill="#F5EFE8" stroke="#CFC4DF" stroke-width="1.5"/>
        <text x="434" y="88" fill="#3F2E94" font-size="13" font-weight="700">辅助监测簇</text>
        <line x1="434" y1="102" x2="614" y2="102" stroke="#CFC4DF"/>
        <text x="434" y="142" fill="#3A3D58" font-size="13">复购率</text>
        <text x="614" y="142" fill="#0D1935" font-size="19" font-weight="700" text-anchor="end">28%</text>
        <text x="434" y="206" fill="#3A3D58" font-size="13">跳出率</text>
        <text x="614" y="206" fill="#0D1935" font-size="19" font-weight="700" text-anchor="end">39%</text>
        <text x="434" y="270" fill="#3A3D58" font-size="13">平均停留</text>
        <text x="614" y="270" fill="#0D1935" font-size="19" font-weight="700" text-anchor="end">3m 12s</text>
      </svg>`,
  },
};

function applyCurtainPct(p) {
  curtainPct = Math.max(10, Math.min(90, Math.round(p)));
  curtainBefore.style.clipPath = `inset(0 ${100 - curtainPct}% 0 0)`;
  curtainDivider.style.left = `${curtainPct}%`;
  curtainDivider.setAttribute("aria-valuenow", String(curtainPct));
}

function renderScene(key) {
  currentScene = key;
  curtainBefore.innerHTML = SCENES[key].beforeSvg;
  curtainAfter.innerHTML = SCENES[key].afterSvg;
  curtainNote.innerHTML = SCENES[key].note;
  applyCurtainPct(curtainPct);
}

for (const tab of sceneTabs) {
  tab.addEventListener("click", () => {
    for (const t of sceneTabs) t.setAttribute("aria-selected", String(t === tab));
    renderScene(tab.dataset.scene);
  });
}

let curtainDragging = false;
function updateCurtainFromClient(clientX) {
  const rect = curtainViewport.getBoundingClientRect();
  applyCurtainPct(((clientX - rect.left) / Math.max(1, rect.width)) * 100);
}
curtainDivider.addEventListener("pointerdown", (e) => {
  curtainDragging = true;
  curtainDivider.setPointerCapture(e.pointerId);
  updateCurtainFromClient(e.clientX);
});
curtainDivider.addEventListener("pointermove", (e) => {
  if (!curtainDragging) return;
  updateCurtainFromClient(e.clientX);
});
const endCurtain = () => {
  curtainDragging = false;
};
curtainDivider.addEventListener("pointerup", endCurtain);
curtainDivider.addEventListener("pointercancel", endCurtain);
curtainDivider.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    applyCurtainPct(curtainPct - 5);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    applyCurtainPct(curtainPct + 5);
  }
});
renderScene("poster");

// ==================== 06 节：什么时候别用聚类（4 组反例动态切换） ====================
const antiCards = [...document.querySelectorAll(".anti-card")];

function renderAntiSvg(card) {
  const idx = Number(card.dataset.anti);
  const fixed = card.dataset.fixed === "true";
  const svg = card.querySelector(".anti-svg");
  const btn = card.querySelector(".anti-toggle");
  btn.textContent = fixed ? "回看硬聚翻车" : "看对症解法";
  btn.setAttribute("aria-pressed", String(fixed));
  svg.textContent = "";

  const tag = fixed ? "对症解法" : "硬聚翻车";
  const tagColor = fixed ? COLORS.ok : COLORS.err;

  if (idx === 0) {
    // 色卡目录：硬聚偏心 vs 棋盘平权
    if (!fixed) {
      svg.append(svgEl("circle", { cx: 102, cy: 62, r: 46, fill: COLORS.indigo, opacity: "0.14" }));
      const pts = [[82, 46, 26], [116, 48, 22], [96, 76, 22], [202, 34, 14], [228, 72, 14], [190, 88, 14]];
      pts.forEach(([x, y, s], i) => {
        svg.append(svgEl("rect", { x: x - s / 2, y: y - s / 2, width: s, height: s, fill: i < 3 ? COLORS.indigo : COLORS.lilac }));
      });
    } else {
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          svg.append(svgEl("rect", { x: 46 + c * 46, y: 24 + r * 42, width: 32, height: 32, fill: (r + c) % 2 === 0 ? COLORS.indigo : COLORS.lavender }));
        }
      }
    }
  } else if (idx === 1) {
    // 画册留白：挤成促销坨 vs 062 分散呼吸
    if (!fixed) {
      svg.append(svgEl("rect", { x: 76, y: 20, width: 108, height: 82, fill: COLORS.indigo, opacity: "0.14" }));
      [[90, 32, 36, 26], [130, 32, 42, 26], [90, 62, 46, 30], [140, 62, 32, 30]].forEach(([x, y, w, h]) => {
        svg.append(svgEl("rect", { x, y, width: w, height: h, fill: COLORS.lavender }));
      });
    } else {
      [[34, 24, 38, 28], [112, 18, 42, 30], [188, 36, 40, 28], [68, 72, 44, 30], [156, 74, 38, 26]].forEach(([x, y, w, h]) => {
        svg.append(svgEl("rect", { x, y, width: w, height: h, fill: COLORS.indigo, opacity: "0.78" }));
      });
    }
  } else if (idx === 2) {
    // 流程步骤：抱团失序 vs 清晰阶梯步进
    if (!fixed) {
      svg.append(svgEl("circle", { cx: 130, cy: 60, r: 44, fill: COLORS.indigo, opacity: "0.14" }));
      [[112, 46, "1"], [146, 44, "3"], [118, 76, "4"], [148, 74, "2"]].forEach(([x, y, n]) => {
        svg.append(svgEl("circle", { cx: x, cy: y, r: 13, fill: COLORS.indigo }));
        svg.append(svgEl("text", { x, y: y + 4, fill: "#FFFFFF", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, n));
      });
    } else {
      for (let i = 0; i < 4; i++) {
        const x = 44 + i * 56;
        const y = 84 - i * 16;
        if (i < 3) {
          svg.append(svgEl("line", { x1: x + 14, y1: y - 4, x2: x + 42, y2: y - 12, stroke: COLORS.ok, "stroke-width": 2 }));
        }
        svg.append(svgEl("circle", { cx: x, cy: y, r: 13, fill: COLORS.indigo }));
        svg.append(svgEl("text", { x, y: y + 4, fill: "#FFFFFF", "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, String(i + 1)));
      }
    }
  } else {
    // 极简两元素：硬加底圆点阵画蛇添足 vs 纯净留白
    if (!fixed) {
      svg.append(svgEl("circle", { cx: 130, cy: 60, r: 48, fill: COLORS.indigo, opacity: "0.16", stroke: COLORS.err, "stroke-dasharray": "4 3" }));
      svg.append(svgEl("rect", { x: 100, y: 42, width: 60, height: 14, fill: COLORS.indigo }));
      svg.append(svgEl("circle", { cx: 130, cy: 76, r: 12, fill: COLORS.lavender }));
      svg.append(svgEl("circle", { cx: 48, cy: 36, r: 7, fill: COLORS.lilac }));
      svg.append(svgEl("circle", { cx: 214, cy: 84, r: 7, fill: COLORS.lilac }));
    } else {
      svg.append(svgEl("rect", { x: 84, y: 42, width: 92, height: 14, fill: COLORS.indigo }));
      svg.append(svgEl("rect", { x: 102, y: 66, width: 56, height: 8, fill: COLORS.lavender }));
    }
  }

  svg.append(svgEl("rect", { x: 8, y: 8, width: 46, height: 15, fill: fixed ? "#E7F4EF" : "#FCEFEB", stroke: tagColor, "stroke-width": 0.9 }));
  svg.append(svgEl("text", { x: 31, y: 18.5, fill: tagColor, "font-size": 8.5, "font-weight": 700, "text-anchor": "middle" }, tag));
}

for (const card of antiCards) {
  renderAntiSvg(card);
  card.querySelector(".anti-toggle").addEventListener("click", () => {
    card.dataset.fixed = card.dataset.fixed === "true" ? "false" : "true";
    renderAntiSvg(card);
  });
}

// ==================== 07 节：练一练（A/B/C/D 单变量中性辨析） ====================
const quizCards = [...document.querySelectorAll(".quiz-card")];
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");

const QUIZ_EXPLAIN = {
  A: [
    "再看一眼：A 落入了「等距散落」错态",
    "6 项元素均匀摊在四周，相邻净距彼此几乎一样（分离比约 1.1×）。没有成簇的视觉落点，读者必须一格格扫描全页才知道展名、展期和场馆的关系。",
  ],
  B: [
    "差一点：B 犯了「双簇平权争锋」的毛病",
    "虽然上下各聚成了一团，但两团的视觉面积和密度几乎 1:1 平权，上半主视觉与下半场馆票务互相抢戏，眼睛在两坨之间左右为难。",
  ],
  C: [
    "选对了！C 是唯一同时满足「紧聚、护城河与主次」的聚类版面",
    "主器物图形、展名与展期紧抱在左上形成强聚焦主簇（体量主次清晰、簇内不贴死）；场馆与票务打包成右下轻巧弱化簇，中间让出 2.4× 呼吸沟，第一眼零负担抓住重点。",
  ],
  D: [
    "再想想：D 掉进了「全员塞满 + 过挤黏连」的坑",
    "6 项内容全部硬塞进画心一个大圆里，既没有外围弱化反衬，内部文字与图形又彼此贴边挤压，看起来沉重发堵、读序混乱。",
  ],
};

function drawQuizPoster(choice, revealed) {
  const svg = document.getElementById(`quiz-svg-${choice}`);
  svg.textContent = "";
  svg.append(svgEl("rect", { width: 240, height: 300, fill: COLORS.light }));

  if (choice === "A") {
    // 均分分散
    svg.append(svgEl("circle", { cx: 56, cy: 52, r: 22, fill: COLORS.indigo }));
    svg.append(svgEl("rect", { x: 130, y: 40, width: 82, height: 14, fill: COLORS.ink }));
    svg.append(svgEl("rect", { x: 32, y: 142, width: 72, height: 10, fill: COLORS.lavender }));
    svg.append(svgEl("rect", { x: 144, y: 138, width: 64, height: 22, fill: COLORS.lilac }));
    svg.append(svgEl("rect", { x: 34, y: 238, width: 78, height: 12, fill: COLORS.ink2 }));
    svg.append(svgEl("rect", { x: 146, y: 232, width: 60, height: 22, fill: COLORS.indigo }));
    if (revealed) {
      svg.append(svgEl("line", { x1: 78, y1: 52, x2: 130, y2: 52, stroke: COLORS.err, "stroke-width": 1.8, "stroke-dasharray": "3 3" }));
      svg.append(svgEl("line", { x1: 56, y1: 74, x2: 56, y2: 142, stroke: COLORS.err, "stroke-width": 1.8, "stroke-dasharray": "3 3" }));
      svg.append(svgEl("rect", { x: 16, y: 268, width: 208, height: 22, fill: "#FCEFEB", stroke: COLORS.err }));
      svg.append(svgEl("text", { x: 120, y: 283, fill: COLORS.err, "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "分散平权 · 分离比 1.1×"));
    }
  } else if (choice === "B") {
    // 上下双簇 1:1 平权争锋
    svg.append(svgEl("rect", { x: 24, y: 24, width: 192, height: 104, fill: COLORS.indigo }));
    svg.append(svgEl("circle", { cx: 68, cy: 76, r: 24, fill: COLORS.cream }));
    svg.append(svgEl("rect", { x: 106, y: 58, width: 92, height: 14, fill: "#FFFFFF" }));
    svg.append(svgEl("rect", { x: 106, y: 80, width: 68, height: 9, fill: COLORS.lilac }));

    svg.append(svgEl("rect", { x: 24, y: 156, width: 192, height: 104, fill: COLORS.indigo }));
    svg.append(svgEl("rect", { x: 42, y: 184, width: 76, height: 14, fill: "#FFFFFF" }));
    svg.append(svgEl("rect", { x: 42, y: 208, width: 98, height: 10, fill: COLORS.lilac }));
    svg.append(svgEl("circle", { cx: 180, cy: 206, r: 22, fill: COLORS.lavender }));
    if (revealed) {
      svg.append(svgEl("rect", { x: 16, y: 268, width: 208, height: 22, fill: "#FCEFEB", stroke: COLORS.err }));
      svg.append(svgEl("text", { x: 120, y: 283, fill: COLORS.err, "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "双簇 1:1 争锋 · 主次不明"));
    }
  } else if (choice === "C") {
    // 正确聚类：左上强聚焦主簇（主次清晰不互压） + 宽呼吸沟 + 右下轻巧弱化簇
    svg.append(svgEl("circle", { cx: 104, cy: 102, r: 68, fill: COLORS.indigo }));
    svg.append(svgEl("rect", { x: 58, y: 66, width: 46, height: 46, fill: COLORS.lavender }));
    svg.append(svgEl("circle", { cx: 132, cy: 82, r: 15, fill: COLORS.cream }));
    svg.append(svgEl("rect", { x: 64, y: 124, width: 76, height: 11, fill: "#FFFFFF" }));
    svg.append(svgEl("rect", { x: 64, y: 140, width: 50, height: 7, fill: COLORS.lilac }));
    // 右下轻量弱化簇（场馆+票务）
    svg.append(svgEl("rect", { x: 142, y: 224, width: 72, height: 9, fill: COLORS.ink }));
    svg.append(svgEl("rect", { x: 158, y: 239, width: 56, height: 7, fill: COLORS.lavender }));
    svg.append(svgEl("circle", { cx: 46, cy: 236, r: 10, fill: COLORS.lilac }));
    if (revealed) {
      svg.append(svgEl("line", { x1: 146, y1: 158, x2: 168, y2: 220, stroke: COLORS.ok, "stroke-width": 2, "stroke-dasharray": "4 3" }));
      svg.append(svgEl("rect", { x: 16, y: 268, width: 208, height: 22, fill: "#E7F4EF", stroke: COLORS.ok }));
      svg.append(svgEl("text", { x: 120, y: 283, fill: COLORS.ok, "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "正确聚类 · 分离比 2.4×"));
    }
  } else {
    // D：6 件全硬塞进中央一圈黏连
    svg.append(svgEl("circle", { cx: 120, cy: 142, r: 78, fill: COLORS.indigo }));
    svg.append(svgEl("rect", { x: 66, y: 88, width: 56, height: 56, fill: COLORS.lavender }));
    svg.append(svgEl("circle", { cx: 124, cy: 112, r: 24, fill: COLORS.cream }));
    svg.append(svgEl("rect", { x: 74, y: 132, width: 96, height: 14, fill: "#FFFFFF" }));
    svg.append(svgEl("rect", { x: 68, y: 144, width: 88, height: 14, fill: COLORS.lilac }));
    svg.append(svgEl("rect", { x: 86, y: 158, width: 76, height: 20, fill: "#8E70C9" }));
    svg.append(svgEl("circle", { cx: 156, cy: 154, r: 18, fill: COLORS.lilac }));
    if (revealed) {
      svg.append(svgEl("rect", { x: 16, y: 268, width: 208, height: 22, fill: "#FCEFEB", stroke: COLORS.err }));
      svg.append(svgEl("text", { x: 120, y: 283, fill: COLORS.err, "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, "全员成坨 · 黏连无反衬"));
    }
  }
}

for (const c of ["A", "B", "C", "D"]) drawQuizPoster(c, false);

for (const btn of quizCards) {
  btn.addEventListener("click", () => {
    const pick = btn.dataset.choice;
    const ok = pick === "C";
    for (const c of ["A", "B", "C", "D"]) drawQuizPoster(c, true);
    for (const b of quizCards) {
      const ch = b.dataset.choice;
      b.setAttribute("aria-pressed", String(ch === pick));
      b.dataset.state = ch === "C" ? "right" : ch === pick ? "wrong" : "";
    }
    quizVerdict.dataset.result = ok ? "right" : "wrong";
    qvTitle.textContent = QUIZ_EXPLAIN[pick][0];
    qvBody.textContent = QUIZ_EXPLAIN[pick][1];
  });
}

// ==================== 08 节：原海报灯箱（复用 #poster.src，可放大拖拽 Esc 关） ====================
const posterImg = document.getElementById("poster");
const posterTrigger = document.getElementById("poster-trigger");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbPct = document.getElementById("lb-pct");
const lbZoomIn = document.getElementById("lb-zoom-in");
const lbZoomOut = document.getElementById("lb-zoom-out");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbPanning = false;
let lbStart = { x: 0, y: 0, tx: 0, ty: 0 };

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbPct.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterTrigger.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.setAttribute("aria-expanded", "false");
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbZoomIn.addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
lbZoomOut.addEventListener("click", () => {
  lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2));
  if (lbScale <= 1) {
    lbTx = 0;
    lbTy = 0;
  }
  applyLbTransform();
});

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1) {
    closeLightbox();
    return;
  }
  lbPanning = true;
  lbStage.classList.add("is-panning");
  lbStage.setPointerCapture(e.pointerId);
  lbStart = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbPanning) return;
  lbTx = lbStart.tx + (e.clientX - lbStart.x);
  lbTy = lbStart.ty + (e.clientY - lbStart.y);
  applyLbTransform();
});

const endPan = () => {
  lbPanning = false;
  lbStage.classList.remove("is-panning");
};
lbStage.addEventListener("pointerup", endPan);
lbStage.addEventListener("pointercancel", endPan);

lbStage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    lbScale = Math.max(0.7, Math.min(3, +(lbScale + delta).toFixed(2)));
    applyLbTransform();
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
