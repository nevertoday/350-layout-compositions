// 033 L形构图 · 开场「活体 L 形角尺构筑台」2D Canvas 与互动控制
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PRESETS,
  RANGES,
  THEMES,
  clamp,
  createInitialState,
  evaluate,
  pct,
} from "./model.js";

const COL = {
  paper: "#FAF7ED",
  grid: "rgba(110, 105, 68, 0.11)",
  gridStrong: "rgba(110, 105, 68, 0.22)",
  red: "#A53625",
  redDark: "#872719",
  redSoft: "rgba(165, 54, 37, 0.14)",
  olive: "#6E6944",
  oliveDeep: "#4E4A2D",
  halo: "#ECE4D2",
  ink: "#262320",
  inkMuted: "#6B645A",
  dash: "#7E786D",
  danger: "#C2271D",
  dangerFill: "rgba(194, 39, 29, 0.10)",
  ok: "#1B6648",
  okFill: "rgba(27, 102, 72, 0.11)",
  white: "#FAF7ED",
};

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const state = createInitialState();
  let intro = 0; // 0..1 开场画入进度（保持每帧完整好看）
  let dragMode = null; // "elbow" | "armTip" | "focus" | "pillarSlide" | "pending"
  let activePointer = null;
  let downPt = null;
  let startPillarW = state.pillarW;
  let hoverTarget = null;

  // 缓存画布尺寸与离屏宣纸网格底图，避免每帧触发布局回流
  let cssW = 720;
  let cssH = 540;
  let dpr = 1;
  let bgCache = null;
  let dirtyUI = true;
  let dirtyDraw = true;
  let lastEvData = null;
  let lastSyncAt = 0;

  const setText = (el, val) => {
    if (el && el.textContent !== val) el.textContent = val;
  };
  const setAttr = (el, name, val) => {
    if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
  };
  const setData = (el, key, val) => {
    if (el && el.dataset[key] !== val) el.dataset[key] = val;
  };

  // 绑定界面元素
  const elStatusPill = document.getElementById("top-status-pill");
  const elDiagTag = document.getElementById("diag-tag");
  const elDiagHead = document.getElementById("diag-head");
  const elDiagReason = document.getElementById("diag-reason");
  const elDiagAction = document.getElementById("diag-action");
  const elArmArrowLine = document.getElementById("arm-arrow-line");
  const elArmSpanVal = document.getElementById("arm-span-val");
  const elHeroGlyphL = document.getElementById("hero-glyph-l");

  const elM = {
    pillar: document.getElementById("m-pillar"),
    span: document.getElementById("m-span"),
    voidPct: document.getElementById("m-void"),
    balance: document.getElementById("m-balance"),
  };

  const elBadge = {
    boundary: document.getElementById("badge-boundary"),
    direction: document.getElementById("badge-direction"),
    voidSpace: document.getElementById("badge-void"),
    stability: document.getElementById("badge-stability"),
  };

  const elPillarLed = {
    boundary: document.getElementById("led-boundary"),
    direction: document.getElementById("led-direction"),
    voidSpace: document.getElementById("led-void"),
    stability: document.getElementById("led-stability"),
  };

  const inpPillar = document.getElementById("ctrl-pillar");
  const inpSpan = document.getElementById("ctrl-span");
  const inpBase = document.getElementById("ctrl-base");
  const valPillar = document.getElementById("val-pillar");
  const valSpan = document.getElementById("val-span");
  const valBase = document.getElementById("val-base");
  const btnJoint = document.getElementById("btn-joint");
  const btnClearClutter = document.getElementById("btn-clear-clutter");
  const btnFocusReset = document.getElementById("btn-focus-sweet");
  const btnFlow = document.getElementById("btn-flow");
  const btnFlip = document.getElementById("btn-flip");

  // 坐标互转：屏幕画布像素 <-> 规范左 L 坐标 (u, v)
  const PAD = 16;
  const stageBox = () => ({
    x: PAD,
    y: PAD,
    w: Math.max(120, cssW - PAD * 2),
    h: Math.max(120, cssH - PAD * 2),
  });

  const toScreenX = (u, box) => box.x + (state.flip === "right" ? 1 - u : u) * box.w;
  const toScreenY = (v, box) => box.y + v * box.h;
  const toScreenRect = (r, box) => {
    const x1 = toScreenX(r.x, box);
    const x2 = toScreenX(r.x + r.w, box);
    return {
      x: Math.min(x1, x2),
      y: toScreenY(r.y, box),
      w: Math.abs(x2 - x1),
      h: r.h * box.h,
    };
  };

  const pointerToCanonical = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;
    const box = stageBox();
    const rawU = clamp((px - box.x) / box.w, 0, 1);
    const v = clamp((py - box.y) / box.h, 0, 1);
    const u = state.flip === "right" ? 1 - rawU : rawU;
    return { u, v, px, py };
  };

  function buildBgCache() {
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const octx = off.getContext("2d");
    octx.scale(dpr, dpr);
    octx.fillStyle = COL.paper;
    octx.fillRect(0, 0, cssW, cssH);

    const box = stageBox();
    const cols = 12;
    const rows = 9;
    octx.strokeStyle = COL.grid;
    octx.lineWidth = 1;
    octx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const gx = Math.round(box.x + (box.w * i) / cols) + 0.5;
      octx.moveTo(gx, box.y);
      octx.lineTo(gx, box.y + box.h);
    }
    for (let j = 0; j <= rows; j++) {
      const gy = Math.round(box.y + (box.h * j) / rows) + 0.5;
      octx.moveTo(box.x, gy);
      octx.lineTo(box.x + box.w, gy);
    }
    octx.stroke();

    octx.strokeStyle = "rgba(38, 35, 32, 0.22)";
    octx.lineWidth = 1;
    octx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
    bgCache = off;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const isNarrow = window.innerWidth <= 844 || matchMedia("(pointer: coarse)").matches;
    const nextDpr = pixelRatio(isNarrow ? 1.25 : 2);
    const nextW = rect.width;
    const nextH = rect.height;
    const bw = Math.round(nextW * nextDpr);
    const bh = Math.round(nextH * nextDpr);
    if (canvas.width !== bw || canvas.height !== bh || dpr !== nextDpr) {
      cssW = nextW;
      cssH = nextH;
      dpr = nextDpr;
      canvas.width = bw;
      canvas.height = bh;
      buildBgCache();
      dirtyDraw = true;
    }
  }

  // 同步所有 DOM 读数、徽章、联动巨型 L 字形与滑杆（仅在值变化时写入，零多余重排）
  function syncUI(evData) {
    const { metrics, checks, passed, statusKind, tag, headline, reason, action } = evData;

    setText(elStatusPill, statusKind === "ok" ? "4 / 4 构图成立" : `${passed} / 4 待校角尺`);
    setData(elStatusPill, "state", statusKind);
    setText(elDiagTag, tag);
    setData(elDiagTag, "state", statusKind);
    setText(elDiagHead, headline);
    setText(elDiagReason, reason);
    setText(elDiagAction, action);

    setText(elArmSpanVal, `延展 ${pct(metrics.baseSpan)}`);
    if (elArmArrowLine) {
      const ratio = clamp((metrics.baseSpan - 0.34) / 0.66, 0.18, 1);
      const tf = `scaleX(${ratio.toFixed(3)})`;
      if (elArmArrowLine.style.transform !== tf) elArmArrowLine.style.transform = tf;
    }

    if (elHeroGlyphL) {
      const stemRatio = clamp(0.24 + (metrics.pillarW - 0.24) * 0.55, 0.18, 0.40).toFixed(3);
      const footRatio = clamp(0.20 + (metrics.baseH - 0.15) * 0.50, 0.15, 0.34).toFixed(3);
      if (elHeroGlyphL.style.getPropertyValue("--l-stem-r") !== stemRatio) {
        elHeroGlyphL.style.setProperty("--l-stem-r", stemRatio);
      }
      if (elHeroGlyphL.style.getPropertyValue("--l-foot-r") !== footRatio) {
        elHeroGlyphL.style.setProperty("--l-foot-r", footRatio);
      }
      setData(elHeroGlyphL, "broken", state.jointBroken ? "true" : "false");
    }

    setText(elM.pillar, `${pct(metrics.pillarW)} · 厚 ${pct(metrics.baseH)}`);
    setText(elM.span, state.jointBroken ? `断缝 · ${pct(metrics.baseSpan)}` : pct(metrics.baseSpan));
    setText(elM.voidPct, pct(metrics.netVoid));
    setText(elM.balance, metrics.balanceTier);

    for (const key of ["boundary", "direction", "voidSpace", "stability"]) {
      const chk = checks[key];
      const okStr = chk.ok ? "true" : "false";
      setText(elBadge[key], chk.badge);
      setData(elBadge[key], "ok", okStr);
      setData(elPillarLed[key], "ok", okStr);
      setText(elPillarLed[key], chk.ok ? "稳" : "校");
    }

    const pStr = String(Math.round(metrics.pillarW * 100));
    const sStr = String(Math.round(metrics.baseSpan * 100));
    const bStr = String(Math.round(metrics.baseH * 100));
    if (inpPillar && inpPillar.value !== pStr) inpPillar.value = pStr;
    if (inpSpan && inpSpan.value !== sStr) inpSpan.value = sStr;
    if (inpBase && inpBase.value !== bStr) inpBase.value = bStr;
    setText(valPillar, pct(metrics.pillarW));
    setText(valSpan, pct(metrics.baseSpan));
    setText(valBase, pct(metrics.baseH));

    setText(btnJoint, state.jointBroken ? "咬合转角断缝" : "试错：断开拐角");
    setData(btnJoint, "active", state.jointBroken ? "alert" : "ok");
    const cnt = metrics.clutterCount;
    setText(btnClearClutter, cnt > 0 ? `清退杂块 (${cnt})` : "试错：填入杂物");
    setData(btnClearClutter, "active", cnt > 0 ? "alert" : "ok");
    setText(btnFocusReset, checks.stability.ok ? "试错：焦点贴墙" : "归位焦点至杆秤区");
    setData(btnFocusReset, "active", checks.stability.ok ? "ok" : "alert");
    setText(btnFlow, state.flowOn ? "视线流：开" : "视线流：关");
    setAttr(btnFlow, "aria-pressed", state.flowOn ? "true" : "false");
    setText(btnFlip, state.flip === "left" ? "朝向：标准左 L" : "朝向：镜像反 L");
    setAttr(btnFlip, "aria-pressed", state.flip === "right" ? "true" : "false");
  }

  // 根据不同题材绘制 L 实体内的质地与视觉层次（全部轻量化 2D 向量，软件渲染极快）
  function drawSolidTheme(rP, rB, box) {
    const theme = state.theme;
    const isFlip = state.flip === "right";

    if (theme === "poster") {
      // 1:1 原海报砖红实块 + 内嵌极简白色 L 建筑标线与右向长白箭
      ctx.fillStyle = COL.red;
      ctx.fillRect(rP.x, rP.y, rP.w, rP.h);
      ctx.fillRect(rB.x, rB.y, rB.w, rB.h);

      // 柱内极轻白框角标（呼应原海报左柱白字气质）
      ctx.save();
      ctx.strokeStyle = "rgba(250, 247, 237, 0.24)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rP.x + 8, rP.y + 8, Math.max(8, rP.w - 16), Math.max(8, rP.h - 16));

      // 柱顶宽标与底梁方向长白箭
      ctx.fillStyle = "rgba(250, 247, 237, 0.90)";
      const fontSize = clamp(Math.round(rP.w * 0.44), 16, 48);
      ctx.font = `900 ${fontSize}px "Archivo", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("L", rP.x + rP.w * 0.5, rP.y + 14);

      // 底梁内原海报标志白色长箭
      const arrowY = rB.y + rB.h * 0.5;
      const padA = 14;
      if (rB.w > 48) {
        const ax0 = isFlip ? rB.x + rB.w - padA : rB.x + padA;
        const ax1 = isFlip ? rB.x + padA + 10 : rB.x + rB.w - padA - 10;
        ctx.strokeStyle = "rgba(250, 247, 237, 0.92)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax0, arrowY);
        ctx.lineTo(ax1, arrowY);
        ctx.stroke();

        const dir = isFlip ? -1 : 1;
        ctx.fillStyle = COL.white;
        ctx.beginPath();
        ctx.moveTo(ax1 + dir * 10, arrowY);
        ctx.lineTo(ax1 - dir * 2, arrowY - 6);
        ctx.lineTo(ax1 - dir * 2, arrowY + 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (theme === "landscape") {
      // 南宋马远「一角」山水风格：深墨褐山崖竖壁 + 近岸松影 + 底部石矶溪岸横延
      // 淡远山雾底
      ctx.save();
      const grad = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
      grad.addColorStop(0, "rgba(236, 228, 210, 0.35)");
      grad.addColorStop(1, "rgba(250, 247, 237, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(box.x, box.y, box.w, box.h);

      // 竖崖实体（砖红暗崖叠墨层，保留原海报色系识别）
      ctx.fillStyle = "#4A3A31";
      ctx.beginPath();
      if (!isFlip) {
        ctx.moveTo(rP.x, rP.y);
        ctx.lineTo(rP.x + rP.w * 0.78, rP.y);
        ctx.lineTo(rP.x + rP.w, rP.y + rP.h * 0.24);
        ctx.lineTo(rP.x + rP.w * 0.88, rP.y + rP.h * 0.56);
        ctx.lineTo(rP.x + rP.w, rP.y + rP.h);
        ctx.lineTo(rP.x, rP.y + rP.h);
      } else {
        ctx.moveTo(rP.x + rP.w, rP.y);
        ctx.lineTo(rP.x + rP.w * 0.22, rP.y);
        ctx.lineTo(rP.x, rP.y + rP.h * 0.24);
        ctx.lineTo(rP.x + rP.w * 0.12, rP.y + rP.h * 0.56);
        ctx.lineTo(rP.x, rP.y + rP.h);
        ctx.lineTo(rP.x + rP.w, rP.y + rP.h);
      }
      ctx.closePath();
      ctx.fill();

      // 崖面朱褐岩纹层
      ctx.fillStyle = "rgba(165, 54, 37, 0.65)";
      ctx.fillRect(isFlip ? rP.x + rP.w * 0.28 : rP.x, rP.y, rP.w * 0.72, rP.h);

      // 崖顶斜探苍松枝（不越出边界太多，点出马远意韵）
      const treeX = isFlip ? rP.x + rP.w * 0.16 : rP.x + rP.w * 0.84;
      const treeY = rP.y + rP.h * 0.24;
      const dir = isFlip ? -1 : 1;
      ctx.strokeStyle = "#262320";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(treeX - dir * 10, treeY + 26);
      ctx.quadraticCurveTo(treeX + dir * 18, treeY + 2, treeX + dir * 42, treeY + 12);
      ctx.stroke();
      ctx.fillStyle = "#545032";
      for (const [ox, oy, rad] of [
        [24, 4, 10],
        [38, 10, 12],
        [14, -4, 9],
      ]) {
        ctx.beginPath();
        ctx.ellipse(treeX + dir * ox, treeY + oy, rad * 1.4, rad * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 底部溪岸横坪
      ctx.fillStyle = "#6E6944";
      ctx.fillRect(rB.x, rB.y, rB.w, rB.h);
      ctx.fillStyle = "rgba(165, 54, 37, 0.76)";
      ctx.fillRect(rB.x, rB.y + rB.h * 0.34, rB.w, rB.h * 0.66);

      // 溪水细波纹
      ctx.strokeStyle = "rgba(250, 247, 237, 0.48)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const wy = rB.y + rB.h * (0.28 + i * 0.26);
        ctx.beginPath();
        ctx.moveTo(rB.x + 12, wy);
        ctx.lineTo(rB.x + rB.w - 14, wy);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 静物书瓶题材：红陶高颈花瓶 + 精装厚书竖柱 + 原木托盘横底
    ctx.save();
    // 竖柱书脊与陶瓶块
    ctx.fillStyle = "#912F20";
    ctx.fillRect(rP.x, rP.y, rP.w, rP.h);
    // 书脊横肋线
    ctx.fillStyle = "#A53625";
    ctx.fillRect(rP.x + 4, rP.y + 4, Math.max(4, rP.w - 8), rP.h - 8);
    ctx.strokeStyle = "rgba(236, 228, 210, 0.42)";
    ctx.lineWidth = 1.5;
    for (const fy of [0.14, 0.2, 0.78, 0.84]) {
      ctx.beginPath();
      ctx.moveTo(rP.x + 8, rP.y + rP.h * fy);
      ctx.lineTo(rP.x + rP.w - 8, rP.y + rP.h * fy);
      ctx.stroke();
    }
    // 剪影高颈瓶轮廓（极简优雅）
    const vx = rP.x + rP.w * 0.5;
    const vw = Math.min(rP.w * 0.58, 54);
    ctx.fillStyle = "rgba(250, 247, 237, 0.16)";
    ctx.beginPath();
    ctx.roundRect(vx - vw * 0.22, rP.y + rP.h * 0.28, vw * 0.44, rP.h * 0.18, 4);
    ctx.roundRect(vx - vw * 0.48, rP.y + rP.h * 0.43, vw * 0.96, rP.h * 0.31, 14);
    ctx.fill();

    // 底部原木长桌托盘
    ctx.fillStyle = "#7D3022";
    ctx.fillRect(rB.x, rB.y, rB.w, rB.h);
    ctx.fillStyle = "#A53625";
    ctx.fillRect(rB.x, rB.y + 4, rB.w, Math.max(4, rB.h - 8));
    // 桌面高光边
    ctx.fillStyle = "rgba(236, 228, 210, 0.42)";
    ctx.fillRect(rB.x, rB.y, rB.w, 3);
    ctx.restore();
  }

  // 绘制右上灰橄榄视觉焦点（随题材微变图形，保持原海报标志暖沙晕 + 虚线圆环 + 折线标牌）
  function drawFocus(fx, fy, frPx, evData, t) {
    const ok = evData.checks.stability.ok;
    const danger =
      evData.checks.stability.badge.includes("焦") ||
      evData.checks.stability.badge.includes("杆秤");

    ctx.save();
    // 外层虚线圆环（1:1 原海报视觉焦点环）
    ctx.beginPath();
    ctx.arc(fx, fy, frPx * 1.48, 0, Math.PI * 2);
    ctx.fillStyle = danger ? "rgba(194, 39, 29, 0.08)" : COL.halo;
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = hoverTarget === "focus" || dragMode === "focus" ? 2 : 1.3;
    ctx.strokeStyle = danger ? COL.danger : ok ? COL.ok : COL.olive;
    ctx.stroke();
    ctx.setLineDash([]);

    // 核心主体
    if (state.theme === "landscape") {
      // 远空寒月 / 小圆印
      ctx.beginPath();
      ctx.arc(fx, fy, frPx * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = danger ? COL.danger : COL.olive;
      ctx.fill();
      // 月下一笔轻舟弧
      ctx.strokeStyle = COL.paper;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy + frPx * 0.08, frPx * 0.36, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (state.theme === "stilllife") {
      // 单枝果影（极简几何圆果 + 细叶）
      ctx.beginPath();
      ctx.arc(fx, fy + 2, frPx * 0.64, 0, Math.PI * 2);
      ctx.fillStyle = danger ? COL.danger : COL.olive;
      ctx.fill();
      ctx.strokeStyle = COL.oliveDeep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fx, fy - frPx * 0.6);
      ctx.lineTo(fx + 5, fy - frPx * 0.96);
      ctx.stroke();
    } else {
      // 原海报标志灰橄榄实心方块
      const sq = frPx * 1.18;
      ctx.fillStyle = danger ? COL.danger : COL.olive;
      ctx.fillRect(fx - sq / 2, fy - sq / 2, sq, sq);
    }

    // 拖动呼吸脉冲细圈（轻克制）
    if (ok && t > 0) {
      const pulse = (t * 0.7) % 1;
      ctx.beginPath();
      ctx.arc(fx, fy, frPx * (1.48 + pulse * 0.34), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(27, 102, 72, ${(1 - pulse) * 0.35})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 原海报折线引出标签「视觉焦点」：在窄画布紧贴焦点上方并带纸底，彻底避开杂块叠字
    const fLabel =
      cssW < 460
        ? (danger ? "焦点·拖空区" : THEMES[state.theme].focusTag)
        : THEMES[state.theme].focusTag + (danger ? " · 拖向空区" : "");
    ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
    const labelDir = fy < 96 ? 1 : -1;
    const tw = ctx.measureText(fLabel).width;

    if (cssW < 460) {
      const ly = fy + labelDir * (frPx * 1.55 + 12);
      const bx = clamp(fx - tw / 2 - 5, PAD + 4, cssW - PAD - tw - 14);
      const by = labelDir < 0 ? ly - 15 : ly + 2;
      ctx.fillStyle = "rgba(250, 247, 237, 0.94)";
      ctx.fillRect(bx, by, tw + 10, 16);
      ctx.fillStyle = danger ? COL.danger : COL.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(fLabel, bx + 5, by + 8);
    } else {
      const goLeft = fx > cssW - PAD - 125;
      const lx = fx + (goLeft ? -14 : 14);
      const ly = fy + labelDir * (frPx * 1.55 + 10);
      ctx.strokeStyle = danger ? COL.danger : COL.inkMuted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy + labelDir * frPx * 1.48);
      ctx.lineTo(lx, ly);
      ctx.lineTo(lx + (goLeft ? -56 : 56), ly);
      ctx.stroke();

      ctx.fillStyle = danger ? COL.danger : COL.ink;
      ctx.textAlign = goLeft ? "right" : "left";
      ctx.textBaseline = labelDir < 0 ? "bottom" : "top";
      ctx.fillText(fLabel, lx + (goLeft ? -4 : 4), ly + (labelDir < 0 ? -3 : 3));
    }
    ctx.restore();
  }

  // 绘制每帧画面（零布局读取、离屏贴网格底、拖动期间合帧不重复画）
  function drawFrame(t, dt, { still }) {
    if (!bgCache) resize();
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(dt, 0.016) * 2.1);
    }
    if (!dirtyDraw && !dirtyUI && intro >= 1 && !state.flowOn && !still) return;

    const ease = 1 - Math.pow(1 - intro, 3);
    if (dirtyUI || !lastEvData) {
      lastEvData = evaluate(state);
      const nowMs = performance.now();
      // 拖动中 DOM 读数按 ~120ms 节流刷新（松手立刻同步），避免软件渲染下每帧整页 DOM 回流拖累帧率
      if (activePointer === null || nowMs - lastSyncAt >= 120 || still) {
        syncUI(lastEvData);
        lastSyncAt = nowMs;
        dirtyUI = false;
      }
    }
    dirtyDraw = false;

    const evData = lastEvData;
    const { geo, metrics, checks } = evData;
    const box = stageBox();

    ctx.save();
    // 1. 直接贴回预烘焙宣纸+网格底图（单次 drawImage，软件渲染极快）
    if (bgCache) ctx.drawImage(bgCache, 0, 0);
    ctx.scale(dpr, dpr);

    // 2. 留白呼吸区高光底垫（成立时微显清透暖光，堵死时隐退）
    const rVoid = toScreenRect(geo.voidRect, box);
    if (checks.voidSpace.ok) {
      ctx.fillStyle = "rgba(27, 102, 72, 0.035)";
      ctx.fillRect(rVoid.x, rVoid.y, rVoid.w, rVoid.h);
    }

    // 3. 原海报标志双虚线箭头导轨（垂直下行 + 水平延伸）
    const guideU = clamp(geo.pillar.w + geo.voidRect.w * 0.34, 0.30, 0.72);
    const guideV = clamp(1 - geo.base.h - 0.12, 0.42, 0.78);
    const gvx = toScreenX(guideU, box);
    const ghy = toScreenY(guideV, box);
    const gEndX = toScreenX(0.95, box);

    ctx.save();
    ctx.strokeStyle = COL.dash;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    // 竖向虚线（从上向下）
    ctx.beginPath();
    ctx.moveTo(gvx, box.y + 12);
    ctx.lineTo(gvx, ghy - 22);
    ctx.stroke();
    // 横向虚线（向左或向右延伸）
    ctx.beginPath();
    ctx.moveTo(gvx - (state.flip === "right" ? -26 : 26), ghy);
    ctx.lineTo(gEndX, ghy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 两个小实心三角箭尖
    ctx.fillStyle = COL.ink;
    ctx.beginPath();
    ctx.moveTo(gvx, ghy - 14);
    ctx.lineTo(gvx - 4, ghy - 23);
    ctx.lineTo(gvx + 4, ghy - 23);
    ctx.closePath();
    ctx.fill();

    const dirSign = state.flip === "right" ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(gEndX + dirSign * 6, ghy);
    ctx.lineTo(gEndX - dirSign * 3, ghy - 4);
    ctx.lineTo(gEndX - dirSign * 3, ghy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. L 实心建筑角尺（随开场 ease 从边界展开，但开场 0.9s 已完全展开就位）
    const animPillar = {
      ...geo.pillar,
      h: geo.pillar.h * (0.45 + 0.55 * ease),
    };
    const animBase = {
      ...geo.base,
      w: geo.base.w * (0.45 + 0.55 * ease),
    };
    const rP = toScreenRect(animPillar, box);
    const rB = toScreenRect(animBase, box);
    drawSolidTheme(rP, rB, box);

    // 柱宽/底厚错态警示边（仅在偏离参考带时画清晰虚线警戒）
    if (!checks.boundary.ok) {
      ctx.save();
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rP.x + 2, rP.y + 2, rP.w - 4, rP.h - 4);
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (!checks.direction.ok && !state.jointBroken) {
      ctx.save();
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rB.x + 2, rB.y + 2, rB.w - 4, rB.h - 4);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. 拐角断缝可点红框（如果当前是断开态）
    if (geo.gapRect) {
      const rG = toScreenRect(geo.gapRect, box);
      ctx.save();
      ctx.fillStyle = COL.dangerFill;
      ctx.fillRect(rG.x, rG.y, rG.w, rG.h);
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rG.x + 1, rG.y + 1, Math.max(4, rG.w - 2), Math.max(4, rG.h - 2));
      ctx.setLineDash([]);

      // 断缝提示药丸：放在断缝右偏上方空隙或框内，避免与拐角把手与焦点叠字
      const cxG = rG.x + rG.w * 0.5;
      const cyG = rG.y + rG.h * 0.5;
      const pillW = 86;
      const pillH = 22;
      const pxG = clamp(cxG - pillW / 2 + (state.flip === "right" ? -18 : 18), box.x + 4, box.x + box.w - pillW - 4);
      const pyG = Math.max(box.y + 6, rG.y - pillH - 12);
      ctx.fillStyle = COL.danger;
      ctx.fillRect(pxG, pyG, pillW, pillH);
      ctx.fillStyle = COL.white;
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("断缝 · 点此咬合", pxG + pillW / 2, pyG + pillH / 2 + 0.5);
      ctx.beginPath();
      ctx.moveTo(cxG, cyG);
      ctx.lineTo(pxG + pillW / 2, pyG + pillH);
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // 6. 右上留白冗余杂块（零 clip 轻量化矢量，软件渲染满帧）
    const clutterNames = THEMES[state.theme].clutterLabels;
    for (const c of geo.clutterRects) {
      if (!c.active) continue;
      const rC = toScreenRect(c, box);
      ctx.fillStyle = COL.dangerFill;
      ctx.fillRect(rC.x, rC.y, rC.w, rC.h);
      ctx.strokeStyle = COL.danger;
      ctx.lineWidth = hoverTarget === `clutter-${c.idx}` ? 2.4 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(rC.x + 0.5, rC.y + 0.5, rC.w - 1, rC.h - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = COL.danger;
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelTxt = rC.w < 104 ? "× 点清杂块" : `× ${clutterNames[c.idx]}`;
      ctx.fillText(labelTxt, rC.x + rC.w / 2, rC.y + rC.h / 2);
    }

    // 7. 视线流粒子路径（展示「竖向沉降 → 90° 转折 → 底梁延展 → 回望右上焦」）
    if (state.flowOn) {
      const p0 = { x: toScreenX(geo.pillar.w * 0.5, box), y: toScreenY(0.14, box) };
      const p1 = { x: toScreenX(geo.pillar.w * 0.5, box), y: toScreenY(1 - geo.base.h * 0.5, box) };
      const p2 = { x: toScreenX(geo.effectiveSpan * 0.9, box), y: toScreenY(1 - geo.base.h * 0.5, box) };
      const p3 = { x: toScreenX(geo.focus.u, box), y: toScreenY(geo.focus.v, box) };

      ctx.save();
      ctx.strokeStyle = evData.statusKind === "ok" ? "rgba(27, 102, 72, 0.52)" : "rgba(194, 39, 29, 0.36)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      if (!state.jointBroken) {
        ctx.lineTo(p2.x, p2.y);
        ctx.quadraticCurveTo(
          (p2.x + p3.x) * 0.5 + (state.flip === "right" ? -28 : 28),
          (p2.y + p3.y) * 0.5,
          p3.x,
          p3.y
        );
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3 枚沿路径游走的轻克制光点
      const pts = state.jointBroken ? [p0, p1] : [p0, p1, p2, p3];
      for (let k = 0; k < 3; k++) {
        const phase = ((still ? 0.35 : t * 0.28) + k / 3) % 1;
        const segTotal = pts.length - 1;
        const scaled = phase * segTotal;
        const si = Math.min(segTotal - 1, Math.floor(scaled));
        const f = scaled - si;
        const a = pts[si];
        const b = pts[si + 1];
        const px = a.x + (b.x - a.x) * f;
        const py = a.y + (b.y - a.y) * f;
        ctx.beginPath();
        ctx.arc(px, py, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = evData.statusKind === "ok" ? COL.ok : COL.danger;
        ctx.fill();
        ctx.strokeStyle = COL.white;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 8. 灰橄榄视觉焦点（始终压在最清晰交互层）
    const fx = toScreenX(geo.focus.u, box);
    const fy = toScreenY(geo.focus.v, box);
    const frPx = clamp(Math.min(box.w, box.h) * geo.focus.r, 15, 28);
    drawFocus(fx, fy, frPx, evData, still ? 0 : t);

    // 9. 两个实体直操角尺把手：内拐角（调柱宽+底厚）与底梁右端箭尖（调延展）
    const ex = toScreenX(geo.elbow.u, box);
    const ey = toScreenY(geo.elbow.v, box);
    ctx.save();
    const isElbowActive = dragMode === "elbow" || hoverTarget === "elbow";
    ctx.fillStyle = isElbowActive ? COL.ink : COL.white;
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, isElbowActive ? 11 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 十字角尺标
    ctx.strokeStyle = isElbowActive ? COL.white : COL.red;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey);
    ctx.lineTo(ex + 4, ey);
    ctx.moveTo(ex, ey - 4);
    ctx.lineTo(ex, ey + 4);
    ctx.stroke();

    // 内拐角尺寸微读数：落在竖柱内部底端，白字清爽、彻底与断缝红标零重叠
    if (rP.w >= 72) {
      ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
      ctx.fillStyle = "rgba(250, 247, 237, 0.94)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`柱 ${pct(metrics.pillarW)} · 底 ${pct(metrics.baseH)}`, rP.x + rP.w * 0.5, rP.y + rP.h - 10);
    }

    // 底梁箭尖把手
    const tx = toScreenX(geo.armTip.u, box);
    const ty = toScreenY(geo.armTip.v, box);
    const isTipActive = dragMode === "armTip" || hoverTarget === "armTip";
    ctx.fillStyle = isTipActive ? COL.ink : COL.white;
    ctx.strokeStyle = COL.redDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx - 6, ty - 14, 12, 28, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 10. 右上角精简实测角标（净空与重心状态，绝不遮挡画面）
    ctx.save();
    const chipW = 148;
    const chipH = 24;
    const chipX = state.flip === "right" ? box.x + 10 : box.x + box.w - chipW - 10;
    const chipY = box.y + 10;
    ctx.fillStyle = "rgba(250, 247, 237, 0.92)";
    ctx.strokeStyle = evData.statusKind === "ok" ? "rgba(27, 102, 72, 0.45)" : "rgba(194, 39, 29, 0.40)";
    ctx.lineWidth = 1;
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.strokeRect(chipX + 0.5, chipY + 0.5, chipW - 1, chipH - 1);
    ctx.fillStyle = evData.statusKind === "ok" ? COL.ok : COL.danger;
    ctx.font = `700 10.5px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`净空 ${pct(metrics.netVoid)} · ${evData.passed}/4`, chipX + chipW / 2, chipY + chipH / 2 + 0.5);
    ctx.restore();

    ctx.restore();
  }

  const runner = loop(canvas, drawFrame);
  // 交互更新：点击/按键立刻同步 UI，连续拖动时合帧至下一 rAF 重绘（消除双重绘制与同步回流）
  const update = (immediate = true) => {
    dirtyUI = true;
    dirtyDraw = true;
    if (immediate) {
      lastEvData = evaluate(state);
      syncUI(lastEvData);
      dirtyUI = false;
      runner.draw();
    }
  };
  const scheduleDragUpdate = () => {
    dirtyUI = true;
    dirtyDraw = true;
  };

  // 命中检测
  function hitTest(pt) {
    const geo = evaluate(state).geo;
    const box = stageBox();
    const fx = toScreenX(geo.focus.u, box);
    const fy = toScreenY(geo.focus.v, box);
    const frPx = clamp(Math.min(box.w, box.h) * geo.focus.r, 15, 28);
    if (Math.hypot(pt.px - fx, pt.py - fy) <= frPx * 1.65) return "focus";

    const ex = toScreenX(geo.elbow.u, box);
    const ey = toScreenY(geo.elbow.v, box);
    if (Math.hypot(pt.px - ex, pt.py - ey) <= 24) return "elbow";

    const tx = toScreenX(geo.armTip.u, box);
    const ty = toScreenY(geo.armTip.v, box);
    if (Math.abs(pt.px - tx) <= 20 && Math.abs(pt.py - ty) <= 26) return "armTip";

    if (geo.gapRect) {
      const rG = toScreenRect(geo.gapRect, box);
      if (pt.px >= rG.x - 14 && pt.px <= rG.x + rG.w + 14 && pt.py >= rG.y - 34 && pt.py <= rG.y + rG.h + 10) {
        return "gap";
      }
    }

    for (const c of geo.clutterRects) {
      if (!c.active) continue;
      const rC = toScreenRect(c, box);
      if (pt.px >= rC.x && pt.px <= rC.x + rC.w && pt.py >= rC.y && pt.py <= rC.y + rC.h) {
        return `clutter-${c.idx}`;
      }
    }
    return "canvas";
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const pt = pointerToCanonical(ev);
    const hit = hitTest(pt);

    if (hit === "gap") {
      state.jointBroken = false;
      update();
      return;
    }
    if (hit.startsWith("clutter-")) {
      const idx = Number(hit.split("-")[1]);
      state.clutter[idx] = false;
      update();
      return;
    }

    activePointer = ev.pointerId;
    downPt = pt;
    startPillarW = state.pillarW;

    if (hit === "focus" || hit === "elbow" || hit === "armTip") {
      dragMode = hit;
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
      ev.preventDefault();
    } else {
      // 空白区域按下：允许触屏纵向滚屏，一旦横向位移大于纵向即接管直拖调节竖柱宽（兼容 perf 横拖测试）
      dragMode = "pending";
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = pointerToCanonical(ev);
    if (activePointer === null) {
      hoverTarget = hitTest(pt);
      canvas.style.cursor =
        hoverTarget === "gap" || hoverTarget.startsWith("clutter-")
          ? "pointer"
          : hoverTarget === "elbow"
            ? "move"
            : hoverTarget === "armTip"
              ? "ew-resize"
              : hoverTarget === "focus"
                ? "grab"
                : "ew-resize";
      return;
    }
    if (ev.pointerId !== activePointer) return;

    if (dragMode === "pending") {
      const dx = pt.px - downPt.px;
      const dy = pt.py - downPt.py;
      if (Math.hypot(dx, dy) < 4) return;
      if (Math.abs(dx) >= Math.abs(dy) * 0.75 || ev.pointerType === "mouse") {
        dragMode = "pillarSlide";
        try { canvas.setPointerCapture(ev.pointerId); } catch {}
      } else {
        activePointer = null;
        dragMode = null;
        return;
      }
    }

    if (dragMode === "elbow") {
      state.pillarW = clamp(pt.u, RANGES.pillarW.min, RANGES.pillarW.max);
      state.baseH = clamp(1 - pt.v, RANGES.baseH.min, RANGES.baseH.max);
      scheduleDragUpdate();
    } else if (dragMode === "armTip") {
      state.baseSpan = clamp(pt.u, RANGES.baseSpan.min, RANGES.baseSpan.max);
      scheduleDragUpdate();
    } else if (dragMode === "focus") {
      state.focus.u = clamp(pt.u, 0.06, 0.94);
      state.focus.v = clamp(pt.v, 0.07, 0.91);
      scheduleDragUpdate();
    } else if (dragMode === "pillarSlide") {
      const box = stageBox();
      const du = ((pt.px - downPt.px) / box.w) * (state.flip === "right" ? -1 : 1);
      state.pillarW = clamp(startPillarW + du * 0.85, RANGES.pillarW.min, RANGES.pillarW.max);
      scheduleDragUpdate();
    }
  });

  const endDrag = (ev) => {
    if (ev.pointerId !== activePointer) return;
    activePointer = null;
    dragMode = null;
    try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    update(true);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘直操（画布聚焦时可精准微调全部核心维度）
  canvas.addEventListener("keydown", (ev) => {
    let handled = true;
    if (ev.key === "ArrowRight") state.pillarW = clamp(state.pillarW + 0.02, RANGES.pillarW.min, RANGES.pillarW.max);
    else if (ev.key === "ArrowLeft") state.pillarW = clamp(state.pillarW - 0.02, RANGES.pillarW.min, RANGES.pillarW.max);
    else if (ev.key === "ArrowUp") state.baseH = clamp(state.baseH + 0.02, RANGES.baseH.min, RANGES.baseH.max);
    else if (ev.key === "ArrowDown") state.baseH = clamp(state.baseH - 0.02, RANGES.baseH.min, RANGES.baseH.max);
    else if (ev.key === "]") state.baseSpan = clamp(state.baseSpan + 0.04, RANGES.baseSpan.min, RANGES.baseSpan.max);
    else if (ev.key === "[") state.baseSpan = clamp(state.baseSpan - 0.04, RANGES.baseSpan.min, RANGES.baseSpan.max);
    else if (ev.key === " ") {
      if (state.jointBroken) state.jointBroken = false;
      else if (state.clutter.some(Boolean)) state.clutter = [false, false];
      else state.jointBroken = true;
    } else handled = false;
    if (handled) {
      ev.preventDefault();
      update();
    }
  });

  // 底部四栏微调控件与头部快捷切换
  if (inpPillar) {
    inpPillar.addEventListener("input", () => {
      state.pillarW = clamp(Number(inpPillar.value) / 100, RANGES.pillarW.min, RANGES.pillarW.max);
      update();
    });
  }
  if (inpSpan) {
    inpSpan.addEventListener("input", () => {
      state.baseSpan = clamp(Number(inpSpan.value) / 100, RANGES.baseSpan.min, RANGES.baseSpan.max);
      update();
    });
  }
  if (inpBase) {
    inpBase.addEventListener("input", () => {
      state.baseH = clamp(Number(inpBase.value) / 100, RANGES.baseH.min, RANGES.baseH.max);
      update();
    });
  }
  if (btnJoint) {
    btnJoint.addEventListener("click", () => {
      state.jointBroken = !state.jointBroken;
      update();
    });
  }
  if (btnClearClutter) {
    btnClearClutter.addEventListener("click", () => {
      const hasAny = state.clutter.some(Boolean);
      state.clutter = hasAny ? [false, false] : [true, true];
      update();
    });
  }
  if (btnFocusReset) {
    btnFocusReset.addEventListener("click", () => {
      const evData = evaluate(state);
      if (evData.checks.stability.ok) {
        state.focus = { u: clamp(state.pillarW + 0.04, 0.25, 0.62), v: 0.72 };
      } else {
        state.focus = {
          u: clamp(state.pillarW + (1 - state.pillarW) * 0.68, 0.56, 0.84),
          v: clamp((1 - state.baseH) * 0.42, 0.24, 0.50),
        };
      }
      update();
    });
  }
  if (btnFlow) {
    btnFlow.addEventListener("click", () => {
      state.flowOn = !state.flowOn;
      update();
    });
  }
  if (btnFlip) {
    btnFlip.addEventListener("click", () => {
      state.flip = state.flip === "left" ? "right" : "left";
      update();
    });
  }

  // 题材切换按钮
  for (const btn of document.querySelectorAll("[data-hero-theme]")) {
    btn.addEventListener("click", () => {
      const val = btn.dataset.heroTheme;
      if (!THEMES[val]) return;
      state.theme = val;
      for (const b of document.querySelectorAll("[data-hero-theme]")) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      }
      update();
    });
  }

  // 预设方案与试错按钮
  for (const btn of document.querySelectorAll("[data-hero-preset]")) {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.heroPreset];
      if (!p) return;
      state.pillarW = p.state.pillarW;
      state.baseH = p.state.baseH;
      state.baseSpan = p.state.baseSpan;
      state.jointBroken = p.state.jointBroken;
      state.clutter = [...p.state.clutter];
      state.focus = { ...p.state.focus };
      state.flip = p.state.flip;
      update();
    });
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      runner.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    resize();
    runner.draw();
  }, { passive: true });
  resize();
  update(true);
}
