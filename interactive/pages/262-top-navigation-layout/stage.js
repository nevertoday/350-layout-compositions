// 262 顶部导航布局 · 顶栏导航装配与寻路实测台（2D Canvas）
// 1:1 承袭 262 原海报深海午夜蓝顶栏 + 松青品牌块 + 亮海青底线 + 薄荷圆双峰青日画风
// 支持：直点切页、左右拖排入口、上下拖进出次级托盘、横拖预算标尺压测 390-1180px、Space 寻路实测

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  evaluateNav,
  estimateItemWidth,
  getDisplayedTopIds,
  RESPONSIVES,
  SITES,
  VARIANTS,
} from "./model.js";

const PAL = {
  paper: "#FCF9F3",
  paperCard: "#FFFFFF",
  paperMint: "#EDF4F1",
  paperSoft: "#F3F6F4",
  navy: "#041B36",
  navyDeep: "#03152A",
  navyCard: "#0A294B",
  teal: "#02777D",
  tealDark: "#025957",
  tealText: "#015D63",
  cyan: "#1ACEBF",
  cyanSoft: "#38DDD0",
  mintDisc: "#E0ECE8",
  mintLine: "#C8DAD4",
  mtnNavy: "#032D50",
  mtnTeal: "#077A81",
  sunTeal: "#1C9293",
  ink: "#091E36",
  inkMuted: "#475E6E",
  bad: "#C42E24",
  badBg: "#FDECEB",
  badBright: "#FF7B72",
  ok: "#047864",
  okBg: "#E6F5F0",
  okBright: "#2FE0C0",
};

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawSplitCircleLogo(ctx, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.8, r * 0.17);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.86, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = PAL.teal;
  ctx.lineWidth = Math.max(1.6, r * 0.16);
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.15, cy);
  ctx.lineTo(cx + r * 1.15, cy);
  ctx.stroke();
  ctx.restore();
}

function drawMiniIcon(ctx, kind, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.45;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const r = s * 0.5;
  if (kind === "home") {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.05);
    ctx.lineTo(cx, cy - r * 0.95);
    ctx.lineTo(cx + r, cy - r * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(cx - r * 0.65, cy - r * 0.1, r * 1.3, r * 0.95);
    ctx.stroke();
  } else if (kind === "book") {
    ctx.beginPath();
    ctx.rect(cx - r * 0.85, cy - r * 0.72, r * 0.85, r * 1.44);
    ctx.rect(cx, cy - r * 0.72, r * 0.85, r * 1.44);
    ctx.stroke();
  } else if (kind === "grid") {
    const q = r * 0.72;
    ctx.strokeRect(cx - q - 1, cy - q - 1, q * 0.88, q * 0.88);
    ctx.strokeRect(cx + 1, cy - q - 1, q * 0.88, q * 0.88);
    ctx.strokeRect(cx - q - 1, cy + 1, q * 0.88, q * 0.88);
    ctx.strokeRect(cx + 1, cy + 1, q * 0.88, q * 0.88);
  } else if (kind === "folder") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.85, cy - r * 0.65);
    ctx.lineTo(cx - r * 0.15, cy - r * 0.65);
    ctx.lineTo(cx + r * 0.08, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.85, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.85, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.85, cy + r * 0.7);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "user") {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.35, r * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.95, r * 0.72, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    // junk / secondary doc dot-tag
    ctx.beginPath();
    ctx.rect(cx - r * 0.65, cy - r * 0.75, r * 1.3, r * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.2);
    ctx.moveTo(cx - r * 0.3, cy + r * 0.22);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPosterMountains(ctx, cx, cy, r) {
  ctx.save();
  // 薄荷浅绿圆底
  ctx.fillStyle = PAL.mintDisc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 青绿太阳
  ctx.fillStyle = PAL.sunTeal;
  ctx.beginPath();
  ctx.arc(cx + r * 0.42, cy - r * 0.25, r * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // 深海蓝远山
  ctx.fillStyle = PAL.mtnNavy;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.02, cy + r * 0.94);
  ctx.lineTo(cx - r * 0.14, cy - r * 0.12);
  ctx.lineTo(cx + r * 0.78, cy + r * 0.94);
  ctx.closePath();
  ctx.fill();

  // 松青前山与浅波脚
  ctx.fillStyle = PAL.mtnTeal;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.02, cy + r * 0.94);
  ctx.lineTo(cx + r * 0.56, cy + r * 0.18);
  ctx.lineTo(cx + r * 1.05, cy + r * 0.94);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.teal;
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.04, cy + r * 0.96);
  ctx.quadraticCurveTo(cx - r * 0.42, cy + r * 0.62, cx + r * 0.18, cy + r * 0.88);
  ctx.quadraticCurveTo(cx + r * 0.65, cy + r * 0.72, cx + r * 1.06, cy + r * 0.96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createNavStage(canvas, getState, setState, onAction) {
  const ctx = canvas.getContext("2d");
  let W = 900;
  let H = 460;
  let dpr = 1;

  // 实时命中表（每次绘制更新，确保视觉与点击/拖拽坐标 100% 一致）
  let hit = {
    browser: { x: 0, y: 0, w: 0, h: 0 },
    bar: { x: 0, y: 0, w: 0, h: 0 },
    brand: { x: 0, y: 0, w: 0, h: 0 },
    menuBtn: null,
    drawerItems: [],
    navPills: [],
    dockBox: { x: 0, y: 0, w: 0, h: 0 },
    dockPills: [],
    rulerBar: { x: 0, y: 0, w: 0, h: 0 },
    resizeHandle: { x: 0, y: 0, w: 0, h: 0 },
  };

  // 交互拖拽状态
  let drag = null;
  let hoverId = null;
  let toast = { text: "", tone: "ok", until: 0, shown: false };
  let ripple = { x: 0, y: 0, t: 0, active: false };
  let dirty = true;

  // Space 模拟寻路实测动画
  let wayfind = {
    active: false,
    t: 0,
    stepIdx: 0,
    steps: [],
    cursorX: 0,
    cursorY: 0,
    hesitate: false,
    note: "",
  };

  function markDirty() {
    dirty = true;
    if (reducedMotion.matches) ctrl.draw();
  }

  function showToast(text, tone = "info") {
    toast = { text, tone, until: performance.now() + 2600, shown: true };
    markDirty();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = pixelRatio(rect.width < 620 ? 1.5 : 2);
    W = rect.width;
    H = rect.height;
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  function startWayfinding() {
    const st = getState();
    const ev = evaluateNav(st);
    const targets = ["courses", "projects", "profile", "home"];
    wayfind = {
      active: true,
      t: 0,
      stepIdx: 0,
      steps: targets.map((id) => ({
        id,
        label: ev.site.items[id]?.label || "首页",
        inTop: st.topIds.includes(id),
      })),
      cursorX: hit.brand.x + hit.brand.w * 0.5,
      cursorY: hit.bar.y + hit.bar.h * 0.5,
      hesitate: false,
      note: "开始寻路实测：依次前往核心入口再回首页…",
    };
    ctrl.draw();
  }

  function stepWayfinding(dt) {
    if (!wayfind.active) return;
    const st = getState();
    const ev = evaluateNav(st);
    const stepDur = ev.passCount === 4 ? 0.92 : 1.38;
    wayfind.t += dt;
    const idx = Math.floor(wayfind.t / stepDur);
    if (idx >= wayfind.steps.length) {
      wayfind.active = false;
      wayfind.hesitate = false;
      showToast(
        ev.passCount === 4
          ? "寻路实测通过：4 步零迷失，视线与指针一路顺滑直达"
          : `寻路实测受阻：${ev.diag.headline}`,
        ev.passCount === 4 ? "ok" : "bad"
      );
      return;
    }
    const localP = (wayfind.t - idx * stepDur) / stepDur;
    const curStep = wayfind.steps[idx];

    // 找目标坐标
    let tx = hit.bar.x + hit.bar.w * 0.5;
    let ty = hit.bar.y + hit.bar.h * 0.5;
    let found = true;
    if (curStep.id === "home" && (!st.topIds.includes("home") || idx === wayfind.steps.length - 1)) {
      tx = hit.brand.x + hit.brand.w * 0.5;
      ty = hit.brand.y + hit.brand.h * 0.5;
      found = st.brandHome || st.topIds.includes("home");
    } else {
      const pill = hit.navPills.find((p) => p.id === curStep.id);
      if (pill) {
        tx = pill.x + pill.w * 0.5;
        ty = pill.y + pill.h * 0.5;
      } else if (hit.menuBtn) {
        tx = hit.menuBtn.x + hit.menuBtn.w * 0.5;
        ty = hit.menuBtn.y + hit.menuBtn.h * 0.5;
      } else {
        found = false;
        tx = hit.dockBox.x + hit.dockBox.w * 0.5;
        ty = hit.dockBox.y + hit.dockBox.h * 0.45;
      }
    }

    // 如果未达标，添加轻微犹豫扫视抖动表现认知迟疑
    const jitter = !found || !ev.checks.overview.ok || !ev.checks.guidance.ok
      ? Math.sin(wayfind.t * 14) * (1 - localP) * 18
      : 0;
    wayfind.hesitate = !found || ev.passCount < 4;
    const ease = 1 - Math.pow(1 - Math.min(1, localP * 1.6), 3);
    wayfind.cursorX += (tx + jitter - wayfind.cursorX) * Math.min(1, dt * 10 + ease * 0.25);
    wayfind.cursorY += (ty - wayfind.cursorY) * Math.min(1, dt * 10 + ease * 0.25);

    if (idx !== wayfind.stepIdx) {
      wayfind.stepIdx = idx;
      if (found) {
        setState({ activeId: curStep.id, pageSwitches: st.pageSwitches + 1 }, { silent: false });
        ripple = { x: tx, y: ty, t: 0.01, active: true };
      }
    }
    wayfind.note = found
      ? ev.checks.orientation.ok
        ? `步骤 ${idx + 1}/4：直达「${curStep.label}」· 定位清晰`
        : `步骤 ${idx + 1}/4：切到「${curStep.label}」，但缺少稳定高亮锚点`
      : `步骤 ${idx + 1}/4：顶栏找不到「${curStep.label}」，被迫四处摸索！`;
  }

  function drawFrame(t, dt, { still }) {
    resize();
    if (W < 20 || H < 20) return;

    const now = performance.now();
    if (toast.shown && now >= toast.until) {
      toast.shown = false;
      toast.text = "";
      dirty = true;
    }

    if (!still) {
      if (wayfind.active && dt > 0) {
        stepWayfinding(dt);
        dirty = true;
      }
      if (ripple.active) {
        ripple.t += dt > 0 ? dt * 2.4 : 0.05;
        if (ripple.t >= 1) ripple.active = false;
        dirty = true;
      }
    }

    if (!still && !dirty) return;
    dirty = false;

    const st = getState();
    const ev = evaluateNav(st);
    const compactCanvas = W < 620;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 画布浅暖瓷底 + 极细建筑网格线
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(2, 119, 125, 0.065)";
    ctx.lineWidth = 1;
    const gridStep = compactCanvas ? 28 : 36;
    ctx.beginPath();
    for (let x = gridStep; x < W; x += gridStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = gridStep; y < H; y += gridStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();

    const pad = compactCanvas ? 10 : 16;

    // 1) 顶部「视口宽度与水平预算标尺」
    const rulerH = compactCanvas ? 30 : 32;
    const rulerX = pad;
    const rulerY = pad;
    const rulerW = W - pad * 2;
    hit.rulerBar = { x: rulerX, y: rulerY, w: rulerW, h: rulerH };

    roundRect(ctx, rulerX, rulerY, rulerW, rulerH, 6);
    ctx.fillStyle = PAL.paperMint;
    ctx.fill();
    ctx.strokeStyle = PAL.mintLine;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 预算进度条
    const ratio = (st.simWidth - 390) / (1180 - 390);
    const fillW = Math.max(24, ratio * (rulerW - 8));
    roundRect(ctx, rulerX + 4, rulerY + 4, fillW, rulerH - 8, 4);
    ctx.fillStyle = st.simWidth < 640 && !ev.checks.access.ok
      ? "rgba(196, 46, 36, 0.16)"
      : "rgba(2, 119, 125, 0.14)";
    ctx.fill();

    // 标尺文字
    ctx.font = `600 ${compactCanvas ? 10.5 : 11.5}px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = PAL.navy;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const devLabel = st.simWidth < 640 ? "手机 390–639" : st.simWidth < 920 ? "平板" : "桌面";
    ctx.fillText(`视口 ${st.simWidth}px (${devLabel})`, rulerX + 10, rulerY + rulerH / 2);

    ctx.textAlign = "right";
    const budgetPct = Math.round(ev.curBar.fillRatio * 100);
    const budgetOk = ev.checks.overview.ok && ev.curBar.overflowPx === 0;
    ctx.fillStyle = budgetOk ? PAL.tealText : PAL.bad;
    ctx.fillText(
      compactCanvas
        ? `${ev.count}项 · 占宽 ${budgetPct}%`
        : `一级入口 ${ev.count} 项 · 占宽 ${budgetPct}% · ${ev.curBar.rows} 行 · 栏高 ${ev.curBar.effectiveBarHeight}px`,
      rulerX + rulerW - 10,
      rulerY + rulerH / 2
    );

    // 2) 计算模拟浏览器主框 + 右侧/底部收纳托盘几何
    const stageTop = rulerY + rulerH + (compactCanvas ? 8 : 12);
    const stageH = H - stageTop - pad;

    let browserAreaW, dockX, dockY, dockW, dockH;
    if (compactCanvas) {
      dockH = Math.max(92, Math.min(116, stageH * 0.28));
      browserAreaW = W - pad * 2;
      dockX = pad;
      dockW = W - pad * 2;
      dockY = H - pad - dockH;
    } else {
      dockW = Math.max(210, Math.min(260, W * 0.23));
      browserAreaW = W - pad * 2 - dockW - 14;
      dockX = W - pad - dockW;
      dockY = stageTop;
      dockH = stageH;
    }

    const browserMaxH = compactCanvas ? dockY - stageTop - 8 : stageH;

    // 根据 simWidth (390..1180) 真实缩放模拟浏览器框架的显示宽度
    const minVisW = Math.min(browserAreaW, compactCanvas ? Math.max(220, browserAreaW * 0.68) : Math.max(280, browserAreaW * 0.36));
    const visBrowserW = Math.round(minVisW + ratio * (browserAreaW - minVisW));
    const browserX = Math.round(pad + (browserAreaW - visBrowserW) / 2);
    const browserY = stageTop;
    const browserH = browserMaxH;

    hit.browser = { x: browserX, y: browserY, w: visBrowserW, h: browserH };
    hit.dockBox = { x: dockX, y: dockY, w: dockW, h: dockH };

    // 浏览器轻量无模糊硬投影与底板（软件渲染零 Gaussian blur 开销）
    roundRect(ctx, browserX, browserY + 4, visBrowserW, browserH, 10);
    ctx.fillStyle = "rgba(4, 27, 54, 0.07)";
    ctx.fill();
    roundRect(ctx, browserX, browserY, visBrowserW, browserH, 10);
    ctx.fillStyle = PAL.paperCard;
    ctx.fill();

    roundRect(ctx, browserX, browserY, visBrowserW, browserH, 10);
    ctx.strokeStyle = ev.passCount === 4 ? "rgba(2, 119, 125, 0.35)" : "rgba(4, 27, 54, 0.22)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // 3) 绘制模拟浏览器内部（裁剪在圆角框内）
    ctx.save();
    roundRect(ctx, browserX, browserY, visBrowserW, browserH, 10);
    ctx.clip();

    // 3a) 核心主角：顶部导航栏（1:1 承袭 262 原海报松青左品牌块 + 深海午夜蓝导航轨）
    const curBar = ev.curBar;
    const scaleX = visBrowserW / st.simWidth;
    const drawBarH = Math.min(browserH * 0.46, Math.max(36, curBar.effectiveBarHeight * (compactCanvas ? 0.86 : 0.96)));
    const barX = browserX;
    const barY = browserY;
    const barW = visBrowserW;
    hit.bar = { x: barX, y: barY, w: barW, h: drawBarH };

    // 深海午夜蓝主底
    ctx.fillStyle = PAL.navy;
    ctx.fillRect(barX, barY, barW, drawBarH);

    // 左侧松青品牌块（复刻海报左块）
    const drawBrandW = compactCanvas
      ? Math.max(46, Math.min(barW * 0.20, 62))
      : Math.max(58, Math.min(barW * 0.26, curBar.brandW * Math.max(0.76, Math.min(1.04, scaleX))));
    hit.brand = { x: barX, y: barY, w: drawBrandW, h: drawBarH };
    ctx.fillStyle = st.brandHome ? PAL.teal : "#32495E";
    ctx.fillRect(barX, barY, drawBrandW, drawBarH);

    // 品牌区双半圆白标
    const logoR = Math.min(12.5, drawBarH * 0.24, drawBrandW * 0.26);
    const logoCx = drawBrandW > 96 ? barX + 24 : barX + drawBrandW * 0.5;
    const logoCy = barY + drawBarH * 0.5;
    drawSplitCircleLogo(ctx, logoCx, logoCy, logoR);
    if (drawBrandW > 96) {
      ctx.font = `700 12.5px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(ev.site.brandName, barX + 43, logoCy + (st.brandHome ? 0 : -5));
      if (!st.brandHome) {
        ctx.font = `500 9.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PAL.badBright;
        ctx.fillText("未链首页", barX + 43, logoCy + 9);
      }
    }

    // 原则高亮光晕（用户点击 4 枚原则卡时点亮对应区域）
    if (st.highlightPrinciple === "access") {
      ctx.strokeStyle = PAL.cyan;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(barX + 1.5, barY + 1.5, drawBrandW - 3, drawBarH - 3);
    }

    // 3b) 绘制导航项（实时单真源位置）
    hit.navPills = [];
    hit.menuBtn = null;
    hit.drawerItems = [];

    const navZoneX = barX + drawBrandW + 6;
    const navZoneW = barW - drawBrandW - 12;

    const drawNavItem = (item, x, y, w, h, isGhost = false, isOverflowClipped = false) => {
      const isActive = item.id === st.activeId;
      const isJunk = item.role === "junk";
      const isHover = hoverId === item.id;
      const showActive = isActive && st.feedback !== "none";

      ctx.save();
      if (isGhost) ctx.globalAlpha = 0.28;

      // 当前状态背景反馈（胶囊 / 悬浮）
      if (showActive && st.feedback === "pill") {
        roundRect(ctx, x, y + 2, w, h - 4, 6);
        ctx.fillStyle = "rgba(26, 206, 191, 0.22)";
        ctx.fill();
        ctx.strokeStyle = PAL.cyan;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      } else if (isHover && !isGhost) {
        roundRect(ctx, x, y + 2, w, h - 4, 6);
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();
      }

      // 杂项警示虚线框（让用户一眼看出哪几项是混入的页脚杂项）
      if (isJunk) {
        roundRect(ctx, x + 0.5, y + 2, w - 1, h - 4, 4);
        ctx.setLineDash([3, 2.5]);
        ctx.strokeStyle = "rgba(255, 123, 114, 0.85)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 图标与文字（按槽宽自适应字号并用 maxWidth 绝不碰撞邻项）
      const textColor = showActive
        ? PAL.cyanSoft
        : isJunk
          ? "#FFB0AA"
          : "#F0F6FA";
      const baseSize = compactCanvas || curBar.rows > 1 ? 11 : 12.2;
      const showIcon = w >= 66;
      const availTextW = Math.max(18, showIcon ? w - 26 : w - 6);
      const estCharW = availTextW / Math.max(2, item.label.length);
      const fontSize = Math.max(8.5, Math.min(baseSize, estCharW * 1.02));
      ctx.font = `${showActive ? 700 : 500} ${fontSize.toFixed(1)}px "Noto Sans SC", sans-serif`;
      if (showIcon) {
        drawMiniIcon(ctx, item.icon, x + 12, y + h / 2, 10.5, textColor);
      }
      ctx.fillStyle = textColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = showIcon ? "left" : "center";
      ctx.fillText(item.label, showIcon ? x + 22 : x + w / 2, y + h / 2 + 0.5, availTextW);

      // 亮青底线 / 顶边色条
      if (showActive && st.feedback === "underline") {
        ctx.fillStyle = PAL.cyan;
        ctx.fillRect(x + 5, y + h - 3, Math.max(10, w - 10), 3);
      } else if (showActive && st.feedback === "topbar") {
        ctx.fillStyle = PAL.cyan;
        ctx.fillRect(x + 4, barY, Math.max(10, w - 8), 3.5);
      }

      if (isOverflowClipped) {
        ctx.fillStyle = "rgba(196, 46, 36, 0.26)";
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
    };

    if (curBar.isMobile && curBar.collapsedMode === "drawer") {
      // 手机抽屉折叠模式：中间显当前位置芯片，右侧清晰「菜单」按钮（矢量三杠，零缺字）
      const chipText = `当前：${ev.activeItem.label}`;
      ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = st.feedback === "none" ? "#B8C7D6" : PAL.cyanSoft;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chipText, navZoneX + 4, barY + drawBarH / 2, Math.max(40, navZoneW - 86));

      const btnW = 70;
      const btnH = Math.min(34, drawBarH - 12);
      const bx = barX + barW - btnW - 10;
      const by = barY + (drawBarH - btnH) / 2;
      hit.menuBtn = { x: bx, y: by, w: btnW, h: btnH };
      roundRect(ctx, bx, by, btnW, btnH, 6);
      ctx.fillStyle = st.drawerOpen ? PAL.teal : "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = PAL.cyan;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(st.drawerOpen ? "关闭 ×" : "菜单", bx + 11, by + btnH / 2 + 0.5);
      if (!st.drawerOpen) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(bx + 44, by + btnH / 2 + k * 4.5);
          ctx.lineTo(bx + 58, by + btnH / 2 + k * 4.5);
          ctx.stroke();
        }
      }
    } else if (curBar.isMobile && curBar.collapsedMode === "priority") {
      // 手机优先级+更多模式
      const moreW = 62;
      const btnH = Math.min(34, drawBarH - 10);
      const by = barY + (drawBarH - btnH) / 2;
      let cx = navZoneX;
      for (const id of curBar.visibleIds) {
        const item = ev.site.items[id];
        const iw = Math.min(82, Math.max(58, (navZoneW - moreW - 12) / Math.max(1, curBar.visibleIds.length)));
        const isDraggingThis = drag && drag.kind === "nav" && drag.id === id;
        drawNavItem(item, cx, by, iw, btnH, isDraggingThis);
        hit.navPills.push({ id, x: cx, y: by, w: iw, h: btnH });
        cx += iw + 6;
      }
      const bx = barX + barW - moreW - 10;
      hit.menuBtn = { x: bx, y: by, w: moreW, h: btnH };
      roundRect(ctx, bx, by, moreW, btnH, 6);
      ctx.fillStyle = st.drawerOpen ? PAL.teal : "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = PAL.cyan;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`更多(${curBar.hiddenIds.length})`, bx + moreW / 2, by + btnH / 2 + 0.5);
    } else if (curBar.isMobile && curBar.collapsedMode === "overflow") {
      // 手机硬挤不折叠：真实画出右侧溢出裁切与红色警示带
      const pillH = Math.min(34, drawBarH - 12);
      const py = barY + (drawBarH - pillH) / 2;
      let cx = navZoneX;
      for (const id of curBar.visibleIds) {
        const item = ev.site.items[id];
        const iw = Math.round(estimateItemWidth(item, true) * 0.92);
        const clipped = cx + iw > barX + barW - 4;
        const isDraggingThis = drag && drag.kind === "nav" && drag.id === id;
        drawNavItem(item, cx, py, iw, pillH, isDraggingThis, clipped);
        hit.navPills.push({ id, x: cx, y: py, w: iw, h: pillH });
        cx += iw + 5;
      }
      // 右缘红警告标
      ctx.fillStyle = PAL.bad;
      ctx.fillRect(barX + barW - 4, barY, 4, drawBarH);
      roundRect(ctx, barX + barW - 88, barY + drawBarH - 22, 82, 18, 4);
      ctx.fillStyle = PAL.bad;
      ctx.fill();
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`右侧溢 ${curBar.overflowPx}px`, barX + barW - 47, barY + drawBarH - 13);
    } else {
      // 桌面 / 平板完整排布（严格遵循 3 种布局变体 + 真实折行）
      const rows = curBar.rows;
      const rowH = rows > 1 ? Math.floor((drawBarH - 12) / rows) : Math.min(36, drawBarH - 12);
      const splitMode = st.variant === "split";
      const rightReserve = splitMode ? Math.min(navZoneW * 0.34, 152) : 0;
      const mainZoneW = Math.max(120, navZoneW - rightReserve);

      // 逐行绘制主区入口
      curBar.rowList.forEach((rowItems, rIdx) => {
        const rawW = rowItems.reduce((a, b) => a + b.w, 0) + Math.max(0, rowItems.length - 1) * 8;
        const fitScale = Math.min(1, mainZoneW / Math.max(1, rawW));
        const usedW = rawW * fitScale;
        const ry = rows > 1
          ? barY + 6 + rIdx * rowH
          : barY + (drawBarH - rowH) / 2;

        let startX = navZoneX;
        if (st.variant === "center" || st.variant === "split") {
          startX = navZoneX + Math.max(0, (mainZoneW - usedW) / 2);
        } else if (st.variant === "right") {
          startX = navZoneX + Math.max(0, mainZoneW - usedW);
        }

        let cx = startX;
        for (const it of rowItems) {
          const item = ev.site.items[it.id];
          const iw = Math.round(it.w * fitScale);
          const isDraggingThis = drag && drag.kind === "nav" && drag.id === it.id;
          drawNavItem(item, cx, ry, iw, rowH - 2, isDraggingThis);
          hit.navPills.push({ id: it.id, x: cx, y: ry, w: iw, h: rowH - 2 });
          cx += iw + Math.round(8 * fitScale);
        }
      });

      // 三段式右侧操作区（搜索/铃铛图标 + utility 项）
      if (splitMode) {
        const utilX = barX + barW - rightReserve - 6;
        // 细竖分隔线
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(utilX - 6, barY + 12);
        ctx.lineTo(utilX - 6, barY + drawBarH - 12);
        ctx.stroke();

        // 搜索图标
        const cy = barY + drawBarH / 2;
        ctx.strokeStyle = "#BBD1DE";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(utilX + 10, cy - 1, 4.8, 0, Math.PI * 2);
        ctx.moveTo(utilX + 13.5, cy + 2.5);
        ctx.lineTo(utilX + 17, cy + 6);
        ctx.stroke();

        let ux = utilX + 26;
        for (const id of curBar.rightIds) {
          const item = ev.site.items[id];
          const iw = Math.min(rightReserve - 26, Math.round(estimateItemWidth(item, true) * 0.96));
          const isDraggingThis = drag && drag.kind === "nav" && drag.id === id;
          drawNavItem(item, ux, cy - 16, iw, 32, isDraggingThis);
          hit.navPills.push({ id, x: ux, y: cy - 16, w: iw, h: 32 });
          ux += iw + 6;
        }
      }

      // 折行警示贴纸
      if (rows > 1) {
        roundRect(ctx, barX + barW - 126, barY + drawBarH - 21, 118, 17, 4);
        ctx.fillStyle = PAL.bad;
        ctx.fill();
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`超载折成 ${rows} 行 · ${curBar.effectiveBarHeight}px`, barX + barW - 67, barY + drawBarH - 12.5);
      }
    }

    // 3c) 模拟浏览器下方活体内容区（真正随点击顶栏切页变化！）
    const bodyY = barY + drawBarH;
    const bodyH = browserH - drawBarH;
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(browserX, bodyY, visBrowserW, bodyH);

    // 如果顶栏折行或过厚，画出红色「侵占首屏带」
    if (curBar.effectiveBarHeight > 80) {
      ctx.fillStyle = "rgba(196, 46, 36, 0.08)";
      ctx.fillRect(browserX, bodyY, visBrowserW, 18);
      ctx.font = `600 10px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PAL.bad;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`↑ 顶栏膨胀到 ${curBar.effectiveBarHeight}px，首屏内容被向下挤压`, browserX + 14, bodyY + 9);
    }

    const active = ev.activeItem;
    const contentTop = bodyY + (curBar.effectiveBarHeight > 80 ? 24 : 14);
    const innerPad = compactCanvas ? 14 : 22;

    // 位置状态眉标（演示：页面内容已变，但若顶栏无高亮用户就会迷失）
    ctx.font = `600 10.5px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = PAL.tealText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const pathSlug = `/${ev.site.id}/${active.id}`;
    const metaLabel = visBrowserW < 420 ? `PAGE · ${active.label}` : `CURRENT PAGE · ${active.label}  (${pathSlug})`;
    ctx.fillText(metaLabel, browserX + innerPad, contentTop);

    // 缺少定位高亮时的温和提示标签
    if (!ev.checks.orientation.ok) {
      const warnMsg = st.feedback === "none" ? "↑ 顶栏未标亮当前页" : "↑ 切页时顶栏移位";
      ctx.font = `600 10px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(warnMsg).width + 14;
      if (visBrowserW > tw + 150) {
        roundRect(ctx, browserX + visBrowserW - innerPad - tw, contentTop - 2, tw, 18, 4);
        ctx.fillStyle = PAL.badBg;
        ctx.fill();
        ctx.fillStyle = PAL.bad;
        ctx.textAlign = "center";
        ctx.fillText(warnMsg, browserX + visBrowserW - innerPad - tw / 2, contentTop + 2);
      }
    }

    // 页面主标题与副文
    const titleY = contentTop + 20;
    const showVisualRight = visBrowserW > 460 && bodyH > 140;
    const textMaxW = showVisualRight ? visBrowserW - innerPad * 2 - 130 : visBrowserW - innerPad * 2;

    ctx.font = `800 ${compactCanvas ? 14.5 : 17.5}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.navy;
    ctx.textAlign = "left";
    ctx.fillText(active.pageTitle, browserX + innerPad, titleY, textMaxW);

    ctx.font = `400 ${compactCanvas ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.inkMuted;
    const sub1 = active.pageSub.slice(0, Math.floor(textMaxW / 12.2));
    const sub2 = active.pageSub.slice(sub1.length, sub1.length + Math.floor(textMaxW / 12.2));
    ctx.fillText(sub1, browserX + innerPad, titleY + 25, textMaxW);
    if (sub2) ctx.fillText(sub2, browserX + innerPad, titleY + 41, textMaxW);

    // 原海报右侧薄荷圆双峰与青日图（紧贴标题右侧，严格位于卡片带上方零遮挡）
    if (showVisualRight) {
      const vx = browserX + visBrowserW - innerPad - 52;
      const vy = titleY + 28;
      if (active.hero === "mountains") {
        drawPosterMountains(ctx, vx, vy, 30);
      } else if (active.hero === "courses") {
        const tiers = [
          { w: 28, col: PAL.tealDark },
          { w: 50, col: PAL.teal },
          { w: 72, col: PAL.mintLine },
        ];
        tiers.forEach((tr, i) => {
          roundRect(ctx, vx - tr.w / 2, vy - 24 + i * 17, tr.w, 13, 3);
          ctx.fillStyle = tr.col;
          ctx.fill();
        });
      } else if (active.hero === "resources") {
        const s = 22;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => {
          roundRect(ctx, vx + dx * 14 - s / 2, vy + dy * 13 - s / 2, s, s * 0.85, 4);
          ctx.fillStyle = i === 0 ? PAL.teal : i === 3 ? PAL.navy : PAL.mintDisc;
          ctx.fill();
        });
      } else if (active.hero === "projects") {
        [30, 46, 36].forEach((bh, i) => {
          roundRect(ctx, vx - 34 + i * 24, vy + 24 - bh, 18, bh, 3);
          ctx.fillStyle = i === 1 ? PAL.teal : i === 2 ? PAL.navy : PAL.mintLine;
          ctx.fill();
        });
      } else {
        ctx.beginPath();
        ctx.arc(vx, vy, 25, 0, Math.PI * 2);
        ctx.strokeStyle = PAL.mintDisc;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(vx, vy, 25, -Math.PI / 2, Math.PI * 0.9);
        ctx.strokeStyle = PAL.teal;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.font = `700 11px "DM Mono", monospace`;
        ctx.fillStyle = PAL.navy;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("72%", vx, vy);
      }
    }

    // 下方三张活体内容微卡
    const cardsY = titleY + (sub2 ? 64 : 52);
    if (cardsY + 42 < browserY + browserH - 8) {
      const cardList = active.cards || ["核心模块", "内容区", "操作入口"];
      const cols = visBrowserW < 340 ? 2 : 3;
      const cGap = 10;
      const cW = (visBrowserW - innerPad * 2 - cGap * (cols - 1)) / cols;
      const cH = Math.min(60, browserY + browserH - cardsY - 12);
      for (let i = 0; i < cols; i++) {
        const cx = browserX + innerPad + i * (cW + cGap);
        roundRect(ctx, cx, cardsY, cW, cH, 6);
        ctx.fillStyle = PAL.paperCard;
        ctx.fill();
        ctx.strokeStyle = PAL.mintLine;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = i === 0 ? PAL.teal : PAL.mintDisc;
        ctx.fillRect(cx + 10, cardsY + 10, 22, 4);
        ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = PAL.navy;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(cardList[i] || "", cx + 10, cardsY + 20, cW - 18);
        if (cH > 48) {
          ctx.fillStyle = "#D4E0DC";
          ctx.fillRect(cx + 10, cardsY + 38, cW * 0.68, 4);
        }
      }
    }

    // 3d) 手机抽屉/更多展开浮层（真实可点切页！）
    if (curBar.isMobile && st.drawerOpen && curBar.hiddenIds.length > 0) {
      const panelW = Math.min(visBrowserW - 24, 192);
      const itemH = 28;
      const panelH = Math.min(bodyH - 12, curBar.hiddenIds.length * itemH + 14);
      const px = barX + barW - panelW - 10;
      const py = barY + drawBarH + 4;

      roundRect(ctx, px, py, panelW, panelH, 8);
      ctx.fillStyle = PAL.navy;
      ctx.fill();
      ctx.strokeStyle = PAL.cyan;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      curBar.hiddenIds.forEach((id, i) => {
        const iy = py + 7 + i * itemH;
        if (iy + itemH > py + panelH) return;
        const item = ev.site.items[id];
        const isAct = id === st.activeId && st.feedback !== "none";
        if (isAct) {
          roundRect(ctx, px + 6, iy + 2, panelW - 12, itemH - 4, 4);
          ctx.fillStyle = "rgba(26, 206, 191, 0.2)";
          ctx.fill();
        }
        ctx.font = `${isAct ? 700 : 500} 11.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = isAct ? PAL.cyanSoft : "#EAF2F8";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, px + 16, iy + itemH / 2);
        hit.drawerItems.push({ id, x: px, y: iy, w: panelW, h: itemH });
      });
    }

    // 点击水波纹反馈
    if (ripple.active) {
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, 6 + ripple.t * 28, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(26, 206, 191, ${(1 - ripple.t) * 0.85})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore(); // 结束模拟浏览器裁剪

    // 右侧边缘拉伸手柄（绘在裁剪区外，清晰浮在右边框线上）
    const hW = 10;
    const hH = 44;
    const hx = browserX + visBrowserW - 5;
    const hy = browserY + browserH * 0.56 - hH / 2;
    hit.resizeHandle = { x: hx - 8, y: hy - 10, w: hW + 16, h: hH + 20 };
    roundRect(ctx, hx, hy, hW, hH, 5);
    ctx.fillStyle = PAL.teal;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hx + 3.5, hy + 14);
    ctx.lineTo(hx + 3.5, hy + hH - 14);
    ctx.moveTo(hx + 6.5, hy + 14);
    ctx.lineTo(hx + 6.5, hy + hH - 14);
    ctx.stroke();

    // 4) 绘制「次级 / 页脚收纳托盘」
    const isDropTarget = drag && drag.kind === "nav" && isPointIn(drag.x, drag.y, hit.dockBox);
    roundRect(ctx, dockX, dockY, dockW, dockH, 10);
    ctx.fillStyle = isDropTarget ? "#E0F2EE" : PAL.paperSoft;
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = isDropTarget ? PAL.teal : "#A9C0BA";
    ctx.lineWidth = isDropTarget ? 2 : 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.navy;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("次级 / 页脚收纳托盘", dockX + 12, dockY + 10);

    ctx.font = `500 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PAL.inkMuted;
    ctx.fillText(
      isDropTarget ? "松手即可移出顶栏 → 释放横宽" : "拖出顶栏杂项至此 · 点击可放回",
      dockX + 12,
      dockY + 27
    );

    // 渲染托盘内的收纳标签
    hit.dockPills = [];
    const dpTop = dockY + 45;
    let dx = dockX + 12;
    let dy = dpTop;
    const dpH = 26;
    if (ev.dockItems.length === 0) {
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = PAL.inkMuted;
      ctx.fillText("托盘为空（10 项全塞在顶栏里）", dockX + 12, dpTop + 8);
    } else {
      for (const item of ev.dockItems) {
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        const pw = Math.min(dockW - 24, Math.ceil(ctx.measureText(item.label).width) + 26);
        if (dx + pw > dockX + dockW - 10) {
          dx = dockX + 12;
          dy += dpH + 6;
        }
        if (dy + dpH > dockY + dockH - 6) break;

        const isCoreMissing = item.role === "core";
        roundRect(ctx, dx, dy, pw, dpH, 5);
        ctx.fillStyle = isCoreMissing ? PAL.badBg : "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = isCoreMissing ? PAL.bad : "#B8CBC6";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isCoreMissing ? PAL.bad : PAL.navy;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${isCoreMissing ? "↑ " : "+ "}${item.label}`, dx + pw / 2, dy + dpH / 2 + 0.5);
        hit.dockPills.push({ id: item.id, x: dx, y: dy, w: pw, h: dpH });
        dx += pw + 6;
      }
    }

    // 5) 拖拽中的悬浮胶囊与插入提示线
    if (drag && (drag.kind === "nav" || drag.kind === "dock") && drag.moved) {
      const item = ev.site.items[drag.id];
      if (item) {
        const pw = Math.max(76, estimateItemWidth(item, true));
        const ph = 32;
        const px = drag.x - pw / 2;
        const py = drag.y - ph / 2;
        roundRect(ctx, px, py + 4, pw, ph, 6);
        ctx.fillStyle = "rgba(4, 27, 54, 0.22)";
        ctx.fill();
        roundRect(ctx, px, py, pw, ph, 6);
        ctx.fillStyle = item.role === "junk" ? PAL.bad : PAL.teal;
        ctx.fill();
        ctx.font = `700 12px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.label, px + pw / 2, py + ph / 2 + 0.5);
      }
    }

    // 6) 模拟寻路指针与顶部状态条（Space 触发）
    if (wayfind.active) {
      const cx = wayfind.cursorX;
      const cy = wayfind.cursorY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = wayfind.hesitate ? "rgba(196, 46, 36, 0.22)" : "rgba(26, 206, 191, 0.26)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = wayfind.hesitate ? PAL.badBright : PAL.cyan;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 浮标文字
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(wayfind.note).width + 20;
      const bx = Math.max(pad, Math.min(W - pad - tw, cx - tw / 2));
      const by = Math.max(stageTop + 4, cy + 20);
      roundRect(ctx, bx, by, tw, 24, 5);
      ctx.fillStyle = PAL.navy;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(wayfind.note, bx + tw / 2, by + 12.5);
      ctx.restore();
    }

    // 7) 轻量操作吐司提示
    if (toast.text && performance.now() < toast.until) {
      ctx.save();
      ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
      const tw = Math.min(W - pad * 2, ctx.measureText(toast.text).width + 24);
      const tx = Math.round((W - tw) / 2);
      const ty = H - pad - 34;
      roundRect(ctx, tx, ty, tw, 26, 6);
      ctx.fillStyle = toast.tone === "bad" ? PAL.bad : toast.tone === "ok" ? PAL.tealDark : PAL.navy;
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(toast.text, tx + tw / 2, ty + 13.5);
      ctx.restore();
    }

    ctx.restore();
  }

  function isPointIn(x, y, box) {
    return box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  }

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const { x, y } = getCoords(e);
    wayfind.active = false;

    // 1. 手机抽屉内项目点击
    for (const di of hit.drawerItems) {
      if (isPointIn(x, y, di)) {
        const st = getState();
        setState({ activeId: di.id, drawerOpen: false, pageSwitches: st.pageSwitches + 1 });
        ripple = { x, y, t: 0.01, active: true };
        return;
      }
    }

    // 2. 手机菜单/更多按钮
    if (hit.menuBtn && isPointIn(x, y, hit.menuBtn)) {
      const st = getState();
      setState({ drawerOpen: !st.drawerOpen });
      return;
    }

    // 3. 品牌区点击
    if (isPointIn(x, y, hit.brand)) {
      const st = getState();
      if (st.brandHome) {
        setState({ activeId: "home", drawerOpen: false, pageSwitches: st.pageSwitches + 1 });
        ripple = { x, y, t: 0.01, active: true };
        showToast("已通过左上品牌区一键返回首页", "ok");
      } else {
        showToast("品牌区未链接回首页！请在控台开启「品牌回首页」", "bad");
      }
      return;
    }

    // 4. 顶栏导航项（支持点击切页 + 左右拖排 + 拖出至托盘）
    for (const pill of hit.navPills) {
      if (isPointIn(x, y, pill)) {
        drag = { kind: "nav", id: pill.id, startX: x, startY: y, x, y, moved: false };
        canvas.setPointerCapture?.(e.pointerId);
        return;
      }
    }

    // 5. 收纳托盘项目（点击或拖回顶栏）
    for (const dp of hit.dockPills) {
      if (isPointIn(x, y, dp)) {
        drag = { kind: "dock", id: dp.id, startX: x, startY: y, x, y, moved: false };
        canvas.setPointerCapture?.(e.pointerId);
        return;
      }
    }

    // 6. 视口宽度标尺 / 右缘拉伸柄 / 空白画布横拖（同时保证 perf 中心横拖流畅响应！）
    const st = getState();
    if (isPointIn(x, y, hit.rulerBar)) {
      const ratio = Math.max(0, Math.min(1, (x - hit.rulerBar.x) / Math.max(1, hit.rulerBar.w)));
      setState({ simWidth: Math.round(390 + ratio * (1180 - 390)) });
      drag = { kind: "ruler", startX: x, startY: y, x, y, startW: st.simWidth, moved: true };
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }

    drag = { kind: "width", startX: x, startY: y, x, y, startW: st.simWidth, moved: false };
    canvas.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    const { x, y } = getCoords(e);
    if (!drag) {
      let found = null;
      for (const pill of hit.navPills) {
        if (isPointIn(x, y, pill)) { found = pill.id; break; }
      }
      if (found !== hoverId) {
        hoverId = found;
        canvas.style.cursor = found ? "grab" : isPointIn(x, y, hit.resizeHandle) || isPointIn(x, y, hit.rulerBar) ? "ew-resize" : isPointIn(x, y, hit.brand) || hit.dockPills.some((p) => isPointIn(x, y, p)) ? "pointer" : "default";
        markDirty();
      }
      return;
    }

    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
    drag.x = x;
    drag.y = y;

    if (drag.kind === "ruler") {
      const ratio = Math.max(0, Math.min(1, (x - hit.rulerBar.x) / Math.max(1, hit.rulerBar.w)));
      setState({ simWidth: Math.round(390 + ratio * (1180 - 390)) });
      return;
    }

    if (drag.kind === "width") {
      if (Math.abs(dx) > 2) {
        const nextW = Math.max(390, Math.min(1180, Math.round(drag.startW + dx * 2.1)));
        if (nextW !== getState().simWidth) setState({ simWidth: nextW });
        else markDirty();
      }
      return;
    }

    if (drag.kind === "nav" && drag.moved) {
      // 在顶栏区域内左右拖动实时交换槽位
      const st = getState();
      if (y <= hit.bar.y + hit.bar.h + 24 && !isPointIn(x, y, hit.dockBox)) {
        for (const p of hit.navPills) {
          if (p.id !== drag.id && x >= p.x && x <= p.x + p.w && y >= p.y - 6 && y <= p.y + p.h + 6) {
            const arr = [...st.topIds];
            const a = arr.indexOf(drag.id);
            const b = arr.indexOf(p.id);
            if (a !== -1 && b !== -1 && a !== b) {
              [arr[a], arr[b]] = [arr[b], arr[a]];
              setState({ topIds: arr });
            }
            break;
          }
        }
      }
      markDirty();
      return;
    }

    markDirty();
  }

  function onPointerUp(e) {
    if (!drag) return;
    const { x, y } = getCoords(e);
    const cur = drag;
    drag = null;
    const st = getState();
    const site = SITES[st.siteId];

    if (cur.kind === "nav") {
      if (!cur.moved) {
        // 真实点击切页！
        setState({ activeId: cur.id, drawerOpen: false, pageSwitches: st.pageSwitches + 1 });
        ripple = { x, y, t: 0.01, active: true };
        onAction?.("navigate", cur.id);
      } else if (isPointIn(x, y, hit.dockBox) || y > hit.bar.y + hit.bar.h + 56) {
        // 拖出顶栏进次级托盘
        if (st.topIds.length > 1) {
          const topIds = st.topIds.filter((id) => id !== cur.id);
          const dockIds = st.dockIds.includes(cur.id) ? st.dockIds : [...st.dockIds, cur.id];
          setState({ topIds, dockIds });
          const item = site.items[cur.id];
          showToast(
            item.role === "junk"
              ? `已将杂项「${item.label}」退回次级/页脚`
              : `已移出核心入口「${item.label}」`,
            item.role === "junk" ? "ok" : "bad"
          );
        }
      }
      markDirty();
      return;
    }

    if (cur.kind === "dock") {
      // 点击托盘项或拖回顶栏 → 放回顶栏
      if (!cur.moved || !isPointIn(x, y, hit.dockBox)) {
        const dockIds = st.dockIds.filter((id) => id !== cur.id);
        const topIds = st.topIds.includes(cur.id) ? st.topIds : [...st.topIds, cur.id];
        setState({ topIds, dockIds });
        const item = site.items[cur.id];
        showToast(`已将「${item.label}」放回顶部导航`, item.role === "junk" ? "bad" : "ok");
      }
      markDirty();
      return;
    }

    markDirty();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => { drag = null; markDirty(); });

  const ctrl = loop(canvas, drawFrame);
  new ResizeObserver(() => { resize(); markDirty(); }).observe(canvas);

  return {
    draw: () => markDirty(),
    startWayfinding: () => { startWayfinding(); markDirty(); },
    showToast,
  };
}
