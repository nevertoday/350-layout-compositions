import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  SPECIMENS,
  SOLUTIONS,
  FAIL_PRESETS,
  SCULPT_TOKENS,
  createState,
  clamp,
  computeLayout,
  auditLayout,
  evaluateSculpt,
} from "./model.js";

// ==================== 共享色板（取自 178 原海报） ====================
const C = {
  plum: "#330935",
  plumDeep: "#250627",
  plumLine: "#66296A",
  rose: "#FCB1CF",
  peach: "#FDAF95",
  peachHi: "#FFC8B5",
  champagne: "#FFF9CE",
  white: "#FFF4FA",
  muted: "#E8CEE0",
  err: "#FF788B",
  ok: "#7EE8B8",
};

// ==================== 开场主角：中轴铸排仪 ====================
function initHeroTypesetter() {
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d");
  const state = createState();

  // DOM 句柄
  const elHeroStatus = document.getElementById("hero-status");
  const elTriadAxis = document.getElementById("triad-axis");
  const elTriadContour = document.getElementById("triad-contour");
  const elTriadLength = document.getElementById("triad-length");
  const elReadAxis = document.getElementById("read-axis");
  const elReadContour = document.getElementById("read-contour");
  const elReadLength = document.getElementById("read-length");

  const elAuditStrip = document.getElementById("audit-strip");
  const elAuditBadge = document.getElementById("audit-badge");
  const elAuditGrade = document.getElementById("audit-grade");
  const elAuditHier = document.getElementById("audit-hier");
  const elAuditHeadline = document.getElementById("audit-headline");
  const elAuditDetail = document.getElementById("audit-detail");
  const elAuditAction = document.getElementById("audit-action");

  const rngMeasure = document.getElementById("rng-measure");
  const rngCy = document.getElementById("rng-cy");
  const rngScale = document.getElementById("rng-scale");
  const rngLines = document.getElementById("rng-lines");
  const outMeasure = document.getElementById("out-measure");
  const outCy = document.getElementById("out-cy");
  const outScale = document.getElementById("out-scale");
  const outLines = document.getElementById("out-lines");

  const btnPunct = document.getElementById("btn-punct");
  const btnGuides = document.getElementById("btn-guides");
  const btnCalibrate = document.getElementById("btn-calibrate");
  const btnReset = document.getElementById("btn-reset");
  const btnSweep = document.getElementById("btn-sweep");
  const btnSweepSm = document.getElementById("btn-sweep-sm");
  const specBtns = [...document.querySelectorAll("[data-specimen]")];
  const alignBtns = [...document.querySelectorAll("[data-align]")];
  const solBtns = [...document.querySelectorAll("[data-solution]")];
  const failBtns = [...document.querySelectorAll("[data-fail]")];

  let cssW = 900;
  let cssH = 430;
  let dpr = 1;
  let cachedLayout = null;
  let cachedAudit = null;
  let needsRecompute = true;
  let needsDraw = true;
  let domDirty = true;
  let lastDomSync = 0;

  // 回扫验视光束状态
  const sweep = { active: false, progress: 0 };
  // 轻柔入场进度（t=0 时也保证完整可见，只做细线舒展）
  let intro = reducedMotion.matches ? 1 : 0;

  // 字体测量器（带按字号分桶的字宽缓存，拖动 60Hz 时零重复排版开销）
  const fontFor = (px, kind) => {
    if (kind === "title") return `400 ${px}px "ZCOOL XiaoWei", "Noto Serif SC", serif`;
    if (kind === "sub") return `700 ${px}px "Chivo", "Noto Serif SC", sans-serif`;
    return `400 ${px}px "Noto Serif SC", serif`;
  };
  const widthCache = new Map();
  let lastFontCss = "";
  const measureFn = (text, px, kind) => {
    const key = `${kind}:${px}:${text}`;
    const hit = widthCache.get(key);
    if (hit !== undefined) return hit;
    const f = fontFor(px, kind);
    if (f !== lastFontCss) {
      ctx.font = f;
      lastFontCss = f;
    }
    const w = ctx.measureText(text).width;
    if (widthCache.size > 1600) widthCache.clear();
    widthCache.set(key, w);
    return w;
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    const nextDpr = pixelRatio(w <= 500 ? 1.5 : 2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      needsRecompute = true;
      needsDraw = true;
    }
  }

  function recompute() {
    cachedLayout = computeLayout(state, cssW, cssH, measureFn);
    cachedAudit = auditLayout(cachedLayout, state);
    needsRecompute = false;
    domDirty = true;
    needsDraw = true;
  }

  function syncDom() {
    if (!cachedLayout || !cachedAudit) return;
    domDirty = false;
    const a = cachedAudit;
    const m = cachedLayout.metrics;

    elHeroStatus.textContent = a.badge;
    elHeroStatus.classList.toggle("is-ok", a.ok);

    elReadAxis.textContent = a.pillars.axis.tag;
    elTriadAxis.classList.toggle("is-ok", a.pillars.axis.ok);
    elReadContour.textContent = a.pillars.contour.tag;
    elTriadContour.classList.toggle("is-ok", a.pillars.contour.ok);
    elReadLength.textContent = a.pillars.length.tag;
    elTriadLength.classList.toggle("is-ok", a.pillars.length.ok);

    elAuditStrip.classList.toggle("is-ok", a.ok);
    elAuditBadge.textContent = a.badge;
    elAuditGrade.textContent = a.poiseGrade;
    elAuditHier.textContent = `层级 ${m.scaleRatio.toFixed(2)}× · 起笔散差 ${Math.round(m.startXSpread)}px`;
    elAuditHeadline.textContent = a.headline;
    elAuditDetail.textContent = a.detail;
    elAuditAction.textContent = a.action;

    rngMeasure.value = String(Math.round(state.measure * 100));
    outMeasure.textContent = `${Math.round(state.measure * 100)}%`;
    rngCy.value = String(Math.round(state.centerY * 100));
    outCy.textContent = `${Math.round(state.centerY * 100)}%`;
    rngScale.value = String(Math.round(state.scaleRatio * 100));
    outScale.textContent = `${state.scaleRatio.toFixed(2)}×`;
    rngLines.value = String(Math.round(state.targetLines));
    outLines.textContent = `${m.lineCount} 行`;

    btnPunct.textContent = `标点悬出：${state.opticalPunct ? "开" : "关"}`;
    btnPunct.setAttribute("aria-pressed", String(state.opticalPunct));
    btnPunct.classList.toggle("is-active", state.opticalPunct);

    btnGuides.textContent = `中轴包络：${state.showGuides ? "开" : "关"}`;
    btnGuides.setAttribute("aria-pressed", String(state.showGuides));
    btnGuides.classList.toggle("is-active", state.showGuides);

    specBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.specimen === state.specimen));
    alignBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.align === state.align));
  }

  function applyPatch(patch) {
    Object.assign(state, patch);
    needsRecompute = true;
    needsDraw = true;
    runner.draw();
  }

  function triggerSweep() {
    sweep.active = true;
    sweep.progress = 0;
    needsDraw = true;
    runner.draw();
  }

  // 离屏预绘双层香槟点阵环精灵图（1 次 drawImage 替代软件渲染每帧高开销虚线弧细分，6× CPU 降速拖动亦稳 50–60fps）
  const ringSprite = { canvas: null, key: "" };
  function getRingSprite(r1, r2) {
    const pad = 8;
    const half = Math.ceil(r2 + pad);
    const key = `${Math.round(r1 * 2)}:${Math.round(r2 * 2)}:${dpr}`;
    if (ringSprite.key === key && ringSprite.canvas) return { c: ringSprite.canvas, half };
    const off = ringSprite.canvas || document.createElement("canvas");
    const size = half * 2;
    off.width = Math.round(size * dpr);
    off.height = Math.round(size * dpr);
    const octx = off.getContext("2d");
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, size, size);
    const paintRing = (radius, count, alpha) => {
      octx.fillStyle = C.champagne;
      octx.globalAlpha = alpha;
      octx.beginPath();
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = half + Math.cos(a) * radius;
        const y = half + Math.sin(a) * radius;
        octx.moveTo(x + 1.35, y);
        octx.arc(x, y, 1.35, 0, Math.PI * 2);
      }
      octx.fill();
    };
    paintRing(r1, 46, 0.72);
    paintRing(r2, 68, 0.56);
    ringSprite.canvas = off;
    ringSprite.key = key;
    return { c: off, half };
  }

  // 沿居中排布逐字符分散（仅用于用户切到「两端对齐」对比时）
  function drawJustifiedLine(text, x, y, targetW) {
    const chars = [...text];
    if (chars.length <= 1) {
      ctx.fillText(text, x, y);
      return;
    }
    const rawW = ctx.measureText(text).width;
    const gap = Math.max(0, (targetW - rawW) / (chars.length - 1));
    let curX = x;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], curX, y);
      curX += ctx.measureText(chars[i]).width + gap;
    }
  }

  function drawScene(t, dt, { still }) {
    if (needsRecompute) recompute();
    if (domDirty) {
      const now = performance.now();
      // 拖动中大幅节流 DOM 回流（画布 HUD 已实时 60fps 反馈），松手或按钮点击立即同步
      if (!dragMode || now - lastDomSync > 320) {
        syncDom();
        lastDomSync = now;
      }
    }

    if (still) {
      intro = 1;
      if (sweep.active) {
        sweep.progress = 0.65;
      }
    } else {
      if (intro < 1) {
        intro = Math.min(1, intro + (dt || 0.016) * 1.8);
        needsDraw = true;
      }
      if (sweep.active) {
        sweep.progress += (dt || 0.016) * 0.42;
        if (sweep.progress >= 1) {
          sweep.active = false;
          sweep.progress = 0;
        }
        needsDraw = true;
      }
    }

    // 微弱的星点环缓转保持舞台呼吸，同时开销极低
    const ringRot = still ? 0 : t * 0.045;
    if (!needsDraw && still) return;

    const L = cachedLayout;
    const A = cachedAudit;
    const W = L.width;
    const H = L.height;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 深绛梅紫底场 + 轻盈双层中心光晕（零逐帧渐变重算，软件渲染满帧）
    ctx.fillStyle = C.plum;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(88, 28, 94, 0.22)";
    ctx.beginPath();
    ctx.arc(L.discX, L.discY, Math.min(W, H) * 0.44, 0, Math.PI * 2);
    ctx.fill();

    // 四角细建筑 L 刻度
    ctx.strokeStyle = "rgba(253, 175, 149, 0.34)";
    ctx.lineWidth = 1;
    const ck = 12;
    const m = 10;
    ctx.beginPath();
    ctx.moveTo(m, m + ck); ctx.lineTo(m, m); ctx.lineTo(m + ck, m);
    ctx.moveTo(W - m - ck, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + ck);
    ctx.moveTo(m, H - m - ck); ctx.lineTo(m, H - m); ctx.lineTo(m + ck, H - m);
    ctx.moveTo(W - m - ck, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - ck);
    ctx.stroke();

    // 2. 真实垂直铅垂基准线 + 光学/几何水平参考线
    if (state.showGuides) {
      // 真正画幅 50% 垂直中轴
      ctx.save();
      ctx.strokeStyle = Math.abs(state.axisOffset) > 0.032 ? "rgba(255, 120, 139, 0.5)" : "rgba(253, 175, 149, 0.26)";
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L.trueMidX, 16);
      ctx.lineTo(L.trueMidX, H - 16);
      ctx.stroke();

      // 50% 几何水平参考线 vs 44% 视觉参考刻度
      const geoY = H * 0.5;
      const optY = H * 0.44;
      ctx.strokeStyle = "rgba(255, 249, 206, 0.13)";
      ctx.beginPath();
      ctx.moveTo(18, geoY);
      ctx.lineTo(W - 18, geoY);
      ctx.stroke();

      // 两侧标注 44% 视觉区短刻度
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(126, 232, 184, 0.45)";
      ctx.beginPath();
      ctx.moveTo(14, optY); ctx.lineTo(26, optY);
      ctx.moveTo(W - 26, optY); ctx.lineTo(W - 14, optY);
      ctx.stroke();

      ctx.font = `500 10.5px "DM Mono", monospace`;
      ctx.fillStyle = "rgba(232, 206, 224, 0.72)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (!L.compact) {
        ctx.fillText("视觉 44%", 30, optY);
        ctx.fillText("几何 50%", 30, geoY + 10);
      }

      // 如果脱轴，画红色偏差标尺（放在标题正上方，避开顶部 HUD）
      if (Math.abs(state.axisOffset) > 0.032) {
        const barY = Math.max(36, L.titleY - L.titlePx * 0.68 - 4);
        ctx.strokeStyle = C.err;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(L.trueMidX, barY);
        ctx.lineTo(L.axisX, barY);
        ctx.stroke();
        ctx.fillStyle = C.err;
        ctx.textAlign = "center";
        ctx.fillText(`脱轴 ${state.axisOffset > 0 ? "+" : ""}${L.metrics.axisOffsetPct}%`, (L.trueMidX + L.axisX) * 0.5, barY - 9);
      }
      ctx.restore();
    }

    // 3. 1:1 承袭 178 原海报核心：双层香槟点阵环 + 四向锚点 + 暖蜜桃实心圆盘
    const ease = 0.7 + 0.3 * intro;
    const r1 = L.ring1R * ease;
    const r2 = L.ring2R * ease;
    const discR = L.discR * (0.86 + 0.14 * intro);

    // 柔和外圈光晕层（无 shadowBlur，快且干净）
    ctx.fillStyle = A.pillars.axis.ok ? "rgba(253, 175, 149, 0.09)" : "rgba(255, 120, 139, 0.10)";
    ctx.beginPath();
    ctx.arc(L.discX, L.discY, r1 * 0.92, 0, Math.PI * 2);
    ctx.fill();

    // 双层香槟星点环（使用离屏精灵图 1 次 drawImage 绘制）
    const sp = getRingSprite(r1, r2);
    ctx.save();
    ctx.translate(L.discX, L.discY);
    if (ringRot) ctx.rotate(ringRot);
    ctx.drawImage(sp.c, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
    ctx.restore();

    // 四向细轴线与蜜桃锚点（忠实原海报十字放射锚）
    const pinDist = r2 + Math.max(26, discR * 0.62);
    ctx.save();
    ctx.strokeStyle = A.pillars.axis.ok ? "rgba(253, 175, 149, 0.62)" : "rgba(255, 120, 139, 0.72)";
    ctx.lineWidth = 1;
    // 左右水平轴
    ctx.beginPath();
    ctx.moveTo(L.discX - pinDist + 8, L.discY);
    ctx.lineTo(L.discX - discR - 8, L.discY);
    ctx.moveTo(L.discX + discR + 8, L.discY);
    ctx.lineTo(L.discX + pinDist - 8, L.discY);
    // 上下短轴
    ctx.moveTo(L.discX, L.discY - r2 - 10);
    ctx.lineTo(L.discX, L.discY - discR - 8);
    ctx.moveTo(L.discX, L.discY + discR + 8);
    ctx.lineTo(L.discX, L.discY + r2 + 12);
    ctx.stroke();

    // 左右圆点
    ctx.fillStyle = A.pillars.axis.ok ? C.peach : C.err;
    const pinR = L.compact ? 4.2 : 5.2;
    for (const [px, py] of [
      [L.discX - pinDist, L.discY],
      [L.discX + pinDist, L.discY],
    ]) {
      ctx.beginPath();
      ctx.arc(px, py, pinR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 招牌蜜桃实心圆盘（可拖动校心）
    ctx.save();
    ctx.fillStyle = C.peach;
    ctx.beginPath();
    ctx.arc(L.discX, L.discY, discR, 0, Math.PI * 2);
    ctx.fill();

    // 若轴心或高度有误，在圆盘内刻极简校准提示；4/4 达标时还原原海报纯净无字圆盘
    if (!A.pillars.axis.ok) {
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(L.discX, L.discY, discR + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.plumDeep;
      const smallDisc = discR < 22;
      ctx.font = `700 ${smallDisc ? 10 : L.compact ? 10.5 : 11.5}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const discHint = Math.abs(state.axisOffset) > 0.032
        ? (smallDisc ? "拖正" : "拖回中轴")
        : state.centerY > 0.495
          ? (smallDisc ? "↑上提" : "↑ 拖高上提")
          : state.centerY < 0.37
            ? (smallDisc ? "↓下调" : "↓ 拖回悬稳")
            : (smallDisc ? "标点" : "校标点悬出");
      ctx.fillText(discHint, L.discX, L.discY);
    } else if (state.showGuides) {
      // 极细腻内刻中心微点，提示仍可拖动
      ctx.fillStyle = "rgba(51, 9, 53, 0.25)";
      ctx.beginPath();
      ctx.arc(L.discX, L.discY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. 上方主标题 + 窄高英文副标 + 蜜桃细横线（随 centerY 与 scaleRatio 实时联排）
    ctx.save();
    ctx.textAlign = state.align === "left" ? "left" : state.align === "right" ? "right" : "center";
    const headX = state.align === "left" ? L.colLeft : state.align === "right" ? L.colRight : L.axisX;

    ctx.font = fontFor(L.titlePx, "title");
    ctx.fillStyle = C.rose;
    ctx.textBaseline = "middle";
    ctx.fillText(L.spec.title, headX, L.titleY);

    ctx.font = fontFor(L.subPx, "sub");
    ctx.fillStyle = C.white;
    ctx.fillText(L.spec.subtitle, headX, L.subY);

    // 居中细横线
    const ruleW = clamp(L.subW * 0.42, 34, 82);
    ctx.strokeStyle = C.peach;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (state.align === "left") {
      ctx.moveTo(headX, L.dividerY);
      ctx.lineTo(headX + ruleW, L.dividerY);
    } else if (state.align === "right") {
      ctx.moveTo(headX - ruleW, L.dividerY);
      ctx.lineTo(headX, L.dividerY);
    } else {
      ctx.moveTo(headX - ruleW * 0.5, L.dividerY);
      ctx.lineTo(headX + ruleW * 0.5, L.dividerY);
    }
    ctx.stroke();
    ctx.restore();

    // 5. 居中正文栏双翼轮廓包络 + 可拖栏宽钳 `◁ ▷`
    if (L.lines.length) {
      const topY = L.lines[0].y - L.bodyPx * 0.85;
      const botY = L.lines[L.lines.length - 1].y + L.bodyPx * 0.82;
      const midClampY = (topY + botY) * 0.5;

      // 左右栏宽边界细线与可拖剪影钳
      if (state.showGuides) {
        ctx.save();
        ctx.strokeStyle = "rgba(253, 175, 149, 0.34)";
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.colLeft, topY);
        ctx.lineTo(L.colLeft, botY);
        ctx.moveTo(L.colRight, topY);
        ctx.lineTo(L.colRight, botY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 两侧矢量钳柄（外置贴靠虚线栏框外缘，绝不遮压正文首尾字）
        for (const [cx, dir] of [
          [L.colLeft - 13, -1],
          [L.colRight + 13, 1],
        ]) {
          ctx.fillStyle = C.plumDeep;
          ctx.strokeStyle = C.peach;
          ctx.lineWidth = 1.2;
          ctx.fillRect(cx - 9, midClampY - 12, 18, 24);
          ctx.strokeRect(cx - 9, midClampY - 12, 18, 24);
          ctx.fillStyle = C.peach;
          ctx.beginPath();
          ctx.moveTo(cx + dir * 4, midClampY);
          ctx.lineTo(cx - dir * 3, midClampY - 4.5);
          ctx.lineTo(cx - dir * 3, midClampY + 4.5);
          ctx.closePath();
          ctx.fill();
        }

        // 宽屏双翼对称留白刻度（直观量化左翼与右翼留白是否等宽平衡）
        if (!L.compact && L.colLeft > 110 && W - L.colRight > 110) {
          const leftWing = Math.round(L.colLeft - 14);
          const rightWing = Math.round(W - 14 - L.colRight);
          const wingBalanced = Math.abs(leftWing - rightWing) <= 18;
          ctx.save();
          ctx.strokeStyle = wingBalanced ? "rgba(126, 232, 184, 0.28)" : "rgba(255, 120, 139, 0.36)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(22, midClampY); ctx.lineTo(L.colLeft - 28, midClampY);
          ctx.moveTo(L.colRight + 28, midClampY); ctx.lineTo(W - 22, midClampY);
          ctx.stroke();
          ctx.font = `500 10.5px "DM Mono", monospace`;
          ctx.fillStyle = wingBalanced ? "rgba(210, 252, 232, 0.72)" : "rgba(255, 214, 220, 0.82)";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`左翼 ${leftWing}px`, (22 + L.colLeft - 28) * 0.5, midClampY - 5);
          ctx.fillText(`右翼 ${rightWing}px`, (L.colRight + 28 + W - 22) * 0.5, midClampY - 5);
          ctx.restore();
        }

        // 双翼实绘轮廓包络线（连接每一行真实的 startX 与 endX）
        if (L.lines.length >= 2) {
          ctx.strokeStyle = A.pillars.contour.ok && A.pillars.length.ok ? "rgba(126, 232, 184, 0.58)" : "rgba(255, 120, 139, 0.72)";
          ctx.lineWidth = 1.3;
          // 左翼折线
          ctx.beginPath();
          L.lines.forEach((ln, i) => {
            const px = ln.startX - 5;
            if (i === 0) ctx.moveTo(px, ln.y);
            else ctx.lineTo(px, ln.y);
          });
          ctx.stroke();
          // 右翼折线
          ctx.beginPath();
          L.lines.forEach((ln, i) => {
            const px = ln.endX + 5;
            if (i === 0) ctx.moveTo(px, ln.y);
            else ctx.lineTo(px, ln.y);
          });
          ctx.stroke();

          // 每行起笔锚点（直观暴露居中长文起笔左右乱跳 vs 左对齐竖直锁死）
          L.lines.forEach((ln) => {
            ctx.fillStyle = A.pillars.length.ok ? C.champagne : C.err;
            ctx.beginPath();
            ctx.arc(ln.startX - 5, ln.y, 2.6, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();
      }

      // 6. 实绘正文行 + 孤字标注 + 尾标点悬出显影
      ctx.save();
      ctx.font = fontFor(L.bodyPx, "body");
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      L.lines.forEach((ln, idx) => {
        const isOrphanLine = L.metrics.hasOrphan && idx === L.lines.length - 1;
        if (isOrphanLine) {
          // 红色虚线框 + 交互提示
          ctx.save();
          ctx.fillStyle = "rgba(255, 120, 139, 0.18)";
          ctx.strokeStyle = C.err;
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.2;
          const bx = ln.startX - 7;
          const by = ln.y - L.bodyPx * 0.7;
          const bw = ln.drawnW + 14;
          const bh = L.bodyPx * 1.4;
          ctx.fillRect(bx, by, bw, bh);
          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]);
          // 旁侧小签
          const tagX = ln.endX + 14;
          if (tagX + 66 < W - 8) {
            ctx.fillStyle = C.err;
            ctx.fillRect(tagX, ln.y - 9, 64, 18);
            ctx.fillStyle = "#1F0410";
            ctx.font = `700 10.5px "Noto Serif SC", serif`;
            ctx.textAlign = "center";
            ctx.fillText("点此修孤字", tagX + 32, ln.y + 0.5);
          }
          ctx.restore();
          ctx.font = fontFor(L.bodyPx, "body");
          ctx.textAlign = "left";
        }

        // 绘制本行真实文字
        ctx.fillStyle = isOrphanLine ? "#FFD6DC" : C.white;
        if (state.align === "justify" && idx < L.lines.length - 1) {
          drawJustifiedLine(ln.text, ln.startX, ln.y, L.measurePx);
        } else if (ln.punctShift > 0) {
          // 主体字与尾标点分色渲染，直接复用 model.js 预存字宽，绘制零 measureText 开销
          ctx.fillText(ln.bodyPart, ln.startX, ln.y);
          ctx.fillStyle = state.opticalPunct ? C.ok : C.peach;
          ctx.fillText(ln.punctPart, ln.startX + ln.bodyPartW, ln.y);
        } else {
          ctx.fillText(ln.text, ln.startX, ln.y);
        }
      });
      ctx.restore();

      // 7. 视线回扫光束动画（按 Space 触发）
      if (sweep.active && L.lines.length >= 1) {
        drawSweepBeam(L, sweep.progress);
      }
    }

    // 8. 顶角微型遥测条（紧凑屏精简字段，绝不与右侧徽章或脱轴标尺相撞）
    ctx.save();
    ctx.font = `500 ${W < 540 ? 10.5 : 11}px "DM Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 244, 250, 0.85)";
    const hud =
      W < 540
        ? `栏宽 ${L.metrics.measurePct}% · Y ${L.metrics.centerYPct}% · ${L.metrics.lineCount}行`
        : `栏宽 ${L.metrics.measurePct}% · 视觉 Y ${L.metrics.centerYPct}% · ${L.metrics.lineCount} 行 · 散差 ${Math.round(L.metrics.startXSpread)}px`;
    ctx.fillText(hud, 16, 13);

    ctx.textAlign = "right";
    ctx.fillStyle = A.ok ? C.ok : C.err;
    ctx.fillText(A.badge, W - 16, 13);
    ctx.restore();

    ctx.restore();
    // 若动画全部静止且无待更新状态，仅靠轻转星点环继续以低成本重画
    needsDraw = false;
  }

  function drawSweepBeam(L, progress) {
    const lines = L.lines;
    const segs = [];
    for (let i = 0; i < lines.length; i++) {
      segs.push({ type: "read", x0: lines[i].startX, y0: lines[i].y, x1: lines[i].endX, y1: lines[i].y, len: Math.max(20, lines[i].drawnW) });
      if (i < lines.length - 1) {
        const dx = lines[i + 1].startX - lines[i].endX;
        const dy = lines[i + 1].y - lines[i].y;
        segs.push({
          type: "sweep",
          x0: lines[i].endX,
          y0: lines[i].y,
          x1: lines[i + 1].startX,
          y1: lines[i + 1].y,
          jumpX: Math.abs(lines[i + 1].startX - lines[i].startX),
          len: Math.hypot(dx, dy) * 0.7,
        });
      }
    }
    const total = segs.reduce((s, g) => s + g.len, 0) || 1;
    const dist = progress * total;

    ctx.save();
    let acc = 0;
    let headX = lines[0].startX;
    let headY = lines[0].y;
    let headSweep = false;

    for (const seg of segs) {
      const nextAcc = acc + seg.len;
      const frac = clamp((dist - acc) / seg.len, 0, 1);
      if (frac > 0) {
        const ex = seg.x0 + (seg.x1 - seg.x0) * frac;
        const ey = seg.y0 + (seg.y1 - seg.y0) * frac;
        ctx.beginPath();
        if (seg.type === "read") {
          ctx.strokeStyle = "rgba(253, 175, 149, 0.75)";
          ctx.lineWidth = 2.4;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = seg.jumpX > 14 ? "rgba(255, 120, 139, 0.85)" : "rgba(126, 232, 184, 0.82)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 3]);
        }
        ctx.moveTo(seg.x0, seg.y0);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // 若该次换行起笔跳动明显，到达下一起点时打一个红色搜寻涟漪
        if (seg.type === "sweep" && frac >= 0.96 && seg.jumpX > 14) {
          ctx.setLineDash([]);
          ctx.strokeStyle = C.err;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(seg.x1, seg.y1, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
        headX = ex;
        headY = ey;
        headSweep = seg.type === "sweep";
      }
      acc = nextAcc;
    }

    // 光珠
    ctx.setLineDash([]);
    ctx.fillStyle = headSweep ? C.champagne : C.peach;
    ctx.beginPath();
    ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.plumDeep;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // ==================== 画布直接拖拽与点行手修 ====================
  let dragMode = null; // "disc" | "clampL" | "clampR" | "measure"
  let dragStart = null;
  let moved = false;

  function canvasPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (!cachedLayout) return;
    const pt = canvasPoint(ev);
    const L = cachedLayout;
    moved = false;

    const distDisc = Math.hypot(pt.x - L.discX, pt.y - L.discY);
    if (distDisc <= L.discR + 10) {
      dragMode = "disc";
    } else if (Math.abs(pt.x - (L.colLeft - 13)) <= 24 && pt.y >= L.bodyStartY - 24) {
      dragMode = "clampL";
    } else if (Math.abs(pt.x - (L.colRight + 13)) <= 24 && pt.y >= L.bodyStartY - 24) {
      dragMode = "clampR";
    } else {
      dragMode = "measure";
    }
    dragStart = {
      x: pt.x,
      y: pt.y,
      measure: state.measure,
      centerY: state.centerY,
      axisOffset: state.axisOffset,
    };
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!dragMode || !dragStart || !cachedLayout) return;
    const pt = canvasPoint(ev);
    const dx = pt.x - dragStart.x;
    const dy = pt.y - dragStart.y;
    if (Math.hypot(dx, dy) > 4) moved = true;
    const L = cachedLayout;

    if (dragMode === "disc") {
      // 拖动中央蜜桃盘：纵横同时校准，靠近正中轻吸附
      let nextAxis = clamp(dragStart.axisOffset + dx / L.innerW, -0.14, 0.14);
      if (Math.abs(nextAxis) < 0.015) nextAxis = 0;
      let nextCy = clamp(dragStart.centerY + dy / L.height, 0.32, 0.62);
      if (Math.abs(nextCy - 0.44) < 0.012) nextCy = 0.44;
      state.axisOffset = nextAxis;
      state.centerY = nextCy;
    } else if (dragMode === "clampL") {
      state.measure = clamp(dragStart.measure - (dx * 2) / L.typographicMaxW, 0.34, 0.88);
      state.orphanForce = false;
    } else if (dragMode === "clampR") {
      state.measure = clamp(dragStart.measure + (dx * 2) / L.typographicMaxW, 0.34, 0.88);
      state.orphanForce = false;
    } else {
      // 水平横拖画布：流畅调节居中栏宽（也完美响应 perf.mjs 横向触控拖动）
      state.measure = clamp(dragStart.measure + (dx * 1.45) / L.typographicMaxW, 0.34, 0.88);
      if (Math.abs(dx) > 10) state.orphanForce = false;
    }
    // 仅标记脏位由 rAF 单次合批重画（reducedMotion 时立即补画），避免拖动时每帧双画
    needsRecompute = true;
    needsDraw = true;
    if (reducedMotion.matches) runner.draw();
  });

  function endDrag(ev) {
    if (!dragMode) return;
    const pt = canvasPoint(ev);
    // 如果是轻点（没有拖动），检测是否点在了任意一行文字（尤其是孤字尾行）上
    if (!moved && cachedLayout) {
      const L = cachedLayout;
      const hitLine = L.lines.find(
        (ln) => Math.abs(pt.y - ln.y) <= L.bodyLeading * 0.55 && pt.x >= ln.startX - 24 && pt.x <= ln.endX + 86
      );
      if (hitLine) {
        if (state.orphanForce) {
          state.orphanForce = false;
          state.measure = clamp(state.measure + 0.04, 0.48, 0.78);
        } else {
          // 循环微调手修断行偏移，让点击文字行实时改变断行轮廓
          state.lineNudge = state.lineNudge >= 2 ? -1 : state.lineNudge + 1;
        }
        needsRecompute = true;
        needsDraw = true;
        runner.draw();
      }
    }
    dragMode = null;
    dragStart = null;
    if (domDirty) syncDom();
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    dragMode = null;
    dragStart = null;
    if (domDirty) syncDom();
  });

  // 键盘无障碍操作（方向键微调，Space 回扫验视）
  canvas.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      state.axisOffset = clamp(state.axisOffset - 0.015, -0.14, 0.14);
      if (Math.abs(state.axisOffset) < 0.012) state.axisOffset = 0;
      needsRecompute = true;
      runner.draw();
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      state.axisOffset = clamp(state.axisOffset + 0.015, -0.14, 0.14);
      if (Math.abs(state.axisOffset) < 0.012) state.axisOffset = 0;
      needsRecompute = true;
      runner.draw();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      state.centerY = clamp(state.centerY - 0.02, 0.32, 0.62);
      needsRecompute = true;
      runner.draw();
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      state.centerY = clamp(state.centerY + 0.02, 0.32, 0.62);
      needsRecompute = true;
      runner.draw();
    } else if (ev.key === " ") {
      ev.preventDefault();
      triggerSweep();
    }
  });

  // 全局 Space 快捷键（焦点不在按钮/输入框时触发回扫验视）
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== " ") return;
    const tag = document.activeElement?.tagName;
    if (tag === "BUTTON" || tag === "INPUT" || tag === "A" || !document.getElementById("lightbox").hidden) return;
    if (window.scrollY < 480) {
      ev.preventDefault();
      triggerSweep();
    }
  });

  // 滑轨与按钮绑定
  rngMeasure.addEventListener("input", () => {
    applyPatch({ measure: Number(rngMeasure.value) / 100, orphanForce: false });
  });
  rngCy.addEventListener("input", () => {
    applyPatch({ centerY: Number(rngCy.value) / 100 });
  });
  rngScale.addEventListener("input", () => {
    applyPatch({ scaleRatio: Number(rngScale.value) / 100 });
  });
  rngLines.addEventListener("input", () => {
    applyPatch({ targetLines: Number(rngLines.value), orphanForce: false });
  });

  btnPunct.addEventListener("click", () => applyPatch({ opticalPunct: !state.opticalPunct }));
  btnGuides.addEventListener("click", () => applyPatch({ showGuides: !state.showGuides }));
  btnCalibrate.addEventListener("click", () => applyPatch(SOLUTIONS.poster_classic.patch));
  btnReset.addEventListener("click", () => applyPatch(createState()));
  btnSweep.addEventListener("click", triggerSweep);
  btnSweepSm.addEventListener("click", triggerSweep);

  specBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyPatch({ specimen: btn.dataset.specimen }));
  });
  alignBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyPatch({ align: btn.dataset.align }));
  });
  solBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sol = SOLUTIONS[btn.dataset.solution];
      if (sol) applyPatch(sol.patch);
    });
  });
  failBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = FAIL_PRESETS[btn.dataset.fail];
      if (f) applyPatch(f.patch);
    });
  });

  window.addEventListener("resize", () => {
    resize();
    if (reducedMotion.matches) runner.draw();
  });
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) runner.draw();
    }).observe(canvas);
  }

  const runner = loop(canvas, drawScene);
  document.fonts.ready.then(() => {
    widthCache.clear();
    lastFontCss = "";
    needsRecompute = true;
    needsDraw = true;
    if (reducedMotion.matches) runner.draw();
  });
  resize();
  recompute();
  syncDom();
  runner.draw();
}

// ==================== 01 居中 vs 左齐 回扫赛跑对照画布 ====================
function initRaceCanvas() {
  const canvas = document.getElementById("race-canvas");
  const ctx = canvas.getContext("2d");
  const btns = [...document.querySelectorAll("[data-race]")];
  const btnReplay = document.getElementById("btn-race-play");
  const elCenterSpread = document.getElementById("rm-center-spread");
  const elVerdict = document.getElementById("rm-verdict");

  const TEXTS = {
    2: ["将文字与元素在视觉中心对齐，建立清晰层级，", "强化信息焦点，传达稳定与秩序感。"],
    4: [
      "将文字与元素在视觉中心对齐，",
      "建立清晰层级与优雅留白，",
      "让短句如碑铭般凝练，",
      "传达稳定与秩序感。",
    ],
    8: [
      "居中排版把每一行的中点对齐同一条垂直轴线，",
      "非常适合标题与扉页，",
      "但当你把一整篇说明文或散文全部设为居中，",
      "每一行左端起点就会忽远忽近，",
      "眼睛读完一行斜向回扫寻找下一行起笔时，",
      "无法依赖固定边距自动落位，",
      "不得不在空气中来回试探，",
      "阅读速度与专注度随之下降。",
    ],
  };

  let mode = 2;
  let phase = 0;
  let cssW = 800;
  let cssH = 300;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    const h = Math.max(260, Math.round(r.height));
    const nextDpr = pixelRatio(w <= 500 ? 1.5 : 2);
    if (w !== cssW || h !== cssH || nextDpr !== dpr) {
      cssW = w;
      cssH = h;
      dpr = nextDpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
  }

  function updateMetrics(spreadPx) {
    elCenterSpread.textContent = `${Math.round(spreadPx)} px`;
    if (mode === 2) {
      elVerdict.textContent = "2 行短句：居中几乎无回扫负担，且对称聚焦胜出";
    } else if (mode === 4) {
      elVerdict.textContent = "4 行请柬：已达居中舒适上限，靠清晰断行维持秩序";
    } else {
      elVerdict.textContent = `8 行散文：起笔左右跳动 ${Math.round(spreadPx)}px，左齐单线锚定明显更省眼`;
    }
  }

  function drawRace(t, dt, { still }) {
    resize();
    const lines = TEXTS[mode];
    const stacked = cssW < 560;
    const pad = 16;
    const colW = stacked ? cssW - pad * 2 : (cssW - pad * 3) / 2;
    const bodyPx = clamp(Math.round(mode === 8 ? (stacked ? 11.5 : 13) : (stacked ? 13 : 14.5)), 11, 15);
    const leading = Math.round(bodyPx * (mode === 8 ? 1.52 : 1.9));

    if (still) {
      phase = 0.72;
    } else {
      phase = (phase + (dt || 0.016) * (mode === 8 ? 0.16 : 0.28)) % 1;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.plum;
    ctx.fillRect(0, 0, cssW, cssH);

    const panels = stacked
      ? [
          { kind: "center", label: "居中排版 · 起笔游移", x: pad, y: 12, w: colW, h: cssH * 0.48 - 14 },
          { kind: "left", label: "左对齐（176）· 起笔锁死", x: pad, y: cssH * 0.52, w: colW, h: cssH * 0.46 - 10 },
        ]
      : [
          { kind: "center", label: "居中排版 · 起笔游移", x: pad, y: 16, w: colW, h: cssH - 32 },
          { kind: "left", label: "左对齐（176）· 起笔锁死", x: pad * 2 + colW, y: 16, w: colW, h: cssH - 32 },
        ];

    ctx.font = `400 ${bodyPx}px "Noto Serif SC", serif`;
    let centerSpread = 0;

    for (const p of panels) {
      ctx.fillStyle = C.plumDeep;
      ctx.strokeStyle = C.plumLine;
      ctx.lineWidth = 1;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // 小栏标
      ctx.font = `500 11.5px "DM Mono", monospace`;
      ctx.fillStyle = p.kind === "center" ? C.rose : C.ok;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(p.label, p.x + 12, p.y + 10);

      // 计算每行位置
      ctx.font = `400 ${bodyPx}px "Noto Serif SC", serif`;
      const blockH = (lines.length - 1) * leading;
      const startY = p.y + 34 + Math.max(8, (p.h - 44 - blockH) * 0.5);
      const padIn = 14;
      const coords = lines.map((text, idx) => {
        const w = Math.min(p.w - padIn * 2, ctx.measureText(text).width);
        const sx = p.kind === "center" ? p.x + (p.w - w) * 0.5 : p.x + padIn;
        return { text, sx, ex: sx + w, y: startY + idx * leading, w };
      });

      if (p.kind === "center") {
        const sxs = coords.map((c) => c.sx);
        centerSpread = Math.max(...sxs) - Math.min(...sxs);
      }

      // 锚定参考线
      ctx.save();
      ctx.strokeStyle = p.kind === "center" ? "rgba(255, 120, 139, 0.5)" : "rgba(126, 232, 184, 0.65)";
      ctx.lineWidth = p.kind === "left" ? 1.5 : 1.1;
      if (p.kind === "center") {
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        coords.forEach((c, i) => (i === 0 ? ctx.moveTo(c.sx - 4, c.y) : ctx.lineTo(c.sx - 4, c.y)));
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(coords[0].sx - 5, coords[0].y - 8);
        ctx.lineTo(coords[0].sx - 5, coords[coords.length - 1].y + 8);
        ctx.stroke();
      }
      ctx.restore();

      // 回扫斜线
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.1;
      for (let i = 0; i < coords.length - 1; i++) {
        ctx.strokeStyle = p.kind === "center" && mode >= 8 ? "rgba(255, 120, 139, 0.55)" : "rgba(253, 175, 149, 0.42)";
        ctx.beginPath();
        ctx.moveTo(coords[i].ex, coords[i].y);
        ctx.lineTo(coords[i + 1].sx, coords[i + 1].y);
        ctx.stroke();
      }
      ctx.restore();

      // 绘制文字与起笔点
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      coords.forEach((c) => {
        ctx.fillStyle = C.white;
        ctx.fillText(c.text, c.sx, c.y, p.w - padIn * 2);
        ctx.fillStyle = p.kind === "center" && mode >= 8 ? C.err : C.ok;
        ctx.beginPath();
        ctx.arc(c.sx - 4, c.y, 2.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 奔跑视线点（左齐版回扫无停顿；8行居中版每次回扫落点有微滞停顿）
      const activeIdx = Math.min(coords.length - 1, Math.floor(phase * coords.length));
      const localP = (phase * coords.length) % 1;
      const cur = coords[activeIdx];
      const gx = cur.sx + (cur.ex - cur.sx) * localP;
      ctx.fillStyle = p.kind === "center" ? C.peach : C.ok;
      ctx.beginPath();
      ctx.arc(gx, cur.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    updateMetrics(centerSpread);
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = Number(b.dataset.race);
      phase = 0;
      btns.forEach((x) => x.classList.toggle("is-active", x === b));
      runner.draw();
    });
  });

  btnReplay.addEventListener("click", () => {
    phase = 0;
    runner.draw();
  });

  const runner = loop(canvas, drawRace);
  window.addEventListener("resize", () => runner.draw());
  runner.draw();
}

// ==================== 02 四时代历史碑帖展台 ====================
function initEraShowcase() {
  const ERAS = {
    trajan: {
      plateClass: "is-stone",
      heading: "罗马图拉真柱基座碑铭（公元 113 年）",
      body: "落成于罗马广场的图拉真柱大理石基座上，六行罗马大写碑体（capitalis monumentalis）严格居中排布。石匠还做了一项精妙的光学补偿：自上而下略微缩小字高，让站在地面仰望的观者看到整齐匀称的字列。对称居中从此与「纪念碑般的永恒秩序」绑在了一起。",
      takeaway: "给今天排版的启示：居中从诞生之初就是为仰望、宣告与庄重服务的，从来不是为了追赶阅读速度。",
      plateHtml: `
        <span class="ep-kicker">ROME · 113 AD · MARBLE INSCRIPTION</span>
        <div class="ep-lines" style="font-family:var(--f-monument);letter-spacing:0.04em;">
          <span class="ep-line" style="font-size:16.5px;">SENATVS·POPVLVSQVE·ROMANVS</span>
          <span class="ep-line" style="font-size:15px;">IMP·CAESARI·DIVI·NERVAE·F·NERVAE</span>
          <span class="ep-line" style="font-size:14px;">TRAIANO·AVG·GERM·DACICO·PONTIF</span>
          <span class="ep-line" style="font-size:12.6px;">MAXIMO·TRIB·POT·XVII·IMP·VI·COS·VI·PP</span>
          <span class="ep-line" style="font-size:12.4px;">AD·DECLARANDVM·QVANTAE·ALTITVDINIS</span>
          <span class="ep-line" style="font-size:11.6px;">MONS·ET·LOCVS·TANTIS·OPERIBVS·SIT·EGESTVS</span>
        </div>
      `,
    },
    aldus: {
      plateClass: "is-aldus",
      heading: "威尼斯阿尔杜斯《寻爱绮梦》（1499 年）",
      body: "威尼斯印刷家阿尔杜斯·马努提乌斯在 1499 年 12 月印出《寻爱绮梦》（Hypnerotomachia Poliphili），选用弗朗切斯科·格里福刻制的罗马体，并把居中倒金字塔（漏斗形）尾题与版画、宽阔留白融为一体，确立了文艺复兴时期欧洲典籍扉页与卷尾的对称范式。",
      takeaway: "给今天排版的启示：短句逐行向内收束成「漏斗轮廓」，能自然引导视线安静落定。",
      plateHtml: `
        <span class="ep-kicker">VENICE · DEC 1499 · ALDUS MANUTIUS</span>
        <div class="ep-lines" style="font-family:var(--f-monument);letter-spacing:0.06em;">
          <span class="ep-line" style="font-size:18px;">HYPNEROTOMACHIA POLIPHILI</span>
          <span class="ep-line" style="font-size:15px;font-style:italic;">UBI HUMANA OMNIA NON NISI</span>
          <span class="ep-line" style="font-size:14px;font-style:italic;">SOMNIUM ESSE DOCET</span>
          <span class="ep-line" style="font-size:13px;">VENETIIS · M · IID</span>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true" style="margin-top:4px;"><polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6"/></svg>
        </div>
      `,
    },
    bodoni: {
      plateClass: "is-bodoni",
      heading: "帕尔马博多尼《字体手册》（1818 年）",
      body: "意大利印刷大师詹巴蒂斯塔·博多尼去世后，由其遗孀与工坊于 1818 年在帕尔马整理出版两卷本《字体手册》（Manuale Tipografico）。博多尼以高反差粗细笔画、宽阔的象牙留白与严格居中对称，把古典居中扉页推向新古典建筑般的理性巅峰。",
      takeaway: "给今天排版的启示：去掉多余花饰后，字号层级、宽字距与四面留白本身就足以撑起居中气场。",
      plateHtml: `
        <span class="ep-kicker">PARMA · 1818 · MANUALE TIPOGRAFICO</span>
        <div class="ep-lines">
          <span class="ep-big">MANUALE</span>
          <span class="ep-big">TIPOGRAFICO</span>
          <span class="ep-rule"></span>
          <span class="ep-line" style="font-size:12px;letter-spacing:0.22em;">GIAMBATTISTA BODONI</span>
          <span class="ep-line" style="font-size:11.5px;">MDCCCXVIII</span>
        </div>
      `,
    },
    tschichold: {
      plateClass: "is-tschichold",
      heading: "扬·奇肖尔德的「叛逆与回归」（1928 → 1947）",
      body: "1928 年，年轻的扬·奇肖尔德出版《新字体排印》（Die neue Typographie），猛烈抨击僵化呆板的居中扉页，主张用现代主义非对称排版释放活力；然而在 1947–1949 年重塑英国企鹅图书及晚年文集《书的形态》（The Form of the Book, 1991）中，他又郑重回归了古典居中扉页与比例秩序。",
      takeaway: "给今天排版的启示：居中与非对称没有高下之分——快节奏信息与长文走非对称，庄重扉页与礼仪短句归中轴。",
      plateHtml: `
        <span class="ep-kicker">JAN TSCHICHOLD · 1928 vs 1947</span>
        <div class="ep-split">
          <div class="ep-mini is-asym">
            <strong>1928 非对称</strong><br>左轴切入<br>功能层级<br>现代张力
          </div>
          <div class="ep-mini is-sym">
            <strong>1947 企鹅回归</strong><br>古典中轴<br>比例留白<br>静谧扉页
          </div>
        </div>
      `,
    },
  };

  const tabs = [...document.querySelectorAll(".era-tab")];
  const elPlate = document.getElementById("era-plate");
  const elHeading = document.getElementById("era-heading");
  const elBody = document.getElementById("era-body");
  const elTakeaway = document.getElementById("era-takeaway");

  function selectEra(key) {
    const item = ERAS[key] || ERAS.trajan;
    elPlate.className = `era-plate ${item.plateClass}`;
    elPlate.innerHTML = item.plateHtml;
    elHeading.textContent = item.heading;
    elBody.textContent = item.body;
    elTakeaway.innerHTML = `<strong>给今天排版的启示：</strong>${item.takeaway.replace(/^给今天排版的启示：/, "")}`;
    tabs.forEach((t) => {
      const on = t.dataset.era === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => selectEra(t.dataset.era)));
  selectEra("trajan");
}

// ==================== 03 双联光学透视仪 ====================
function initOpticalLab() {
  const rng = document.getElementById("rng-curtain");
  const optLayer = document.getElementById("curtain-opt-layer");
  const handle = document.getElementById("curtain-handle");

  function updateCurtain() {
    const v = clamp(Number(rng.value), 10, 90);
    optLayer.style.clipPath = `inset(0 0 0 ${v}%)`;
    handle.style.left = `${v}%`;
  }
  rng.addEventListener("input", updateCurtain);
  updateCurtain();

  const btnPunct = document.getElementById("btn-opt-punct");
  const lab = document.getElementById("punct-lab");
  const readout = document.getElementById("pl-readout");
  let optical = false;

  btnPunct.addEventListener("click", () => {
    optical = !optical;
    lab.classList.toggle("is-optical", optical);
    btnPunct.classList.toggle("is-active", optical);
    btnPunct.setAttribute("aria-pressed", String(optical));
    btnPunct.textContent = optical ? "当前：标点光学悬出（已开）" : "切换：标点光学悬出";
    readout.innerHTML = optical
      ? "当前：<strong>标点光学悬出</strong> — 把行尾「。」「！」右侧空腔微幅探出对齐线，肉眼看到的汉字墨迹重新骑死在中轴上。"
      : "当前：<strong>机械边框居中</strong> — 末尾「。」右侧半格空腔被算进总宽，整行笔画向左悄悄漂移约 0.25em。";
  });
}

// ==================== 04 手修断行塑形板 ====================
function initLineSculptor() {
  const strip = document.getElementById("token-strip");
  const linesEl = document.getElementById("sp-lines");
  const badgeEl = document.getElementById("sv-badge");
  const noteEl = document.getElementById("sv-note");
  const presetBtns = [...document.querySelectorAll("[data-sp]")];

  // 开场故意给一个末行仅剩「秩序」2 字的孤尾坏态，引导用户亲手点剪口修复
  let breaks = new Set([10]);

  const PRESETS = {
    trapezoid: [6],            // 倒梯形双行：秋季器物雕塑年展·以静默（12字） / 中轴回应空间与秩序（9字）
    funnel: [3, 8],            // 倒金字塔三行：秋季器物雕塑年展（8字） / ·以静默中轴回应（8字→或[4,8] 9/7/5字）
    diamond: [2, 7, 9],        // 菱形四行
    orphan: [10],              // 复原孤尾
  };
  PRESETS.funnel = [4, 8];     // 秋季器物雕塑年展·(9) / 以静默中轴回应(7) / 空间与秩序(5)

  function render() {
    strip.innerHTML = "";
    SCULPT_TOKENS.forEach((tok, i) => {
      const sp = document.createElement("span");
      sp.className = "tk-word";
      sp.textContent = tok;
      strip.appendChild(sp);

      if (i < SCULPT_TOKENS.length - 1) {
        const cut = document.createElement("button");
        cut.type = "button";
        const isOn = breaks.has(i);
        cut.className = `tk-cut${isOn ? " is-break" : ""}`;
        cut.textContent = isOn ? "断" : "丨";
        cut.setAttribute("aria-pressed", String(isOn));
        cut.setAttribute("aria-label", isOn ? `取消「${tok}」后的换行` : `在「${tok}」后插入换行`);
        cut.addEventListener("click", () => {
          if (breaks.has(i)) breaks.delete(i);
          else breaks.add(i);
          render();
        });
        strip.appendChild(cut);
      }
    });

    const res = evaluateSculpt(breaks);
    linesEl.innerHTML = "";
    res.lines.forEach((ln, idx) => {
      const div = document.createElement("div");
      const isOrph = !res.ok && res.kind === "孤字吊尾" && idx === res.lines.length - 1;
      div.className = `sp-line${isOrph ? " is-orphan" : ""}`;
      div.textContent = ln;
      linesEl.appendChild(div);
    });

    badgeEl.textContent = res.kind;
    badgeEl.classList.toggle("is-ok", res.ok);
    noteEl.textContent = res.note;
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = PRESETS[btn.dataset.sp];
      if (list) {
        breaks = new Set(list);
        render();
      }
    });
  });

  render();
}

// ==================== 05 六场景正反诊牌矩阵 ====================
function initScenarioMatrix() {
  const DATA = {
    titlepage: {
      ok: true,
      badge: "适合居中",
      title: "书籍扉页与章首页",
      why: "整页只有书名、副题、作者与出版印记四五项极短元素，四周留白宽阔。居中排布把纸面变成剧场正门，让读者在翻入正文前先停顿一秒。",
      alt: "要点：主次字号拉开 2× 以上，并把视觉重心上提至画幅 42%–46%（经验值）。",
      html: `<div class="mini-h">建筑的静默</div><div class="mini-rule"></div><div>第三章 · 比例与光</div><div style="font-size:12px;color:#E8CEE0;margin-top:6px;">二〇二六年版</div>`,
    },
    invite: {
      ok: true,
      badge: "适合居中",
      title: "请柬、证书与碑铭",
      why: "婚礼请柬、荣誉证书、音乐会节目单与建筑铭牌追求庄严、礼仪与纪念感，读者逐句品读而非速览，居中对称恰好放大这份郑重。",
      alt: "要点：把长段交通或入场须知移到背面左对齐，正面只留 3–4 行核心信息。",
      html: `<div style="font-size:11.5px;letter-spacing:0.18em;color:#FDAF95;">INVITATION</div><div class="mini-h" style="margin-top:4px;">暮色室内乐</div><div class="mini-rule"></div><div>拾壹月廿四 · 晚八时</div>`,
    },
    hero: {
      ok: true,
      badge: "适合居中",
      title: "海报主标与单句引言",
      why: "展板主标题、网页首屏大宣言或 1–3 行核心金句需要在一秒内锁死注意力，四周匀称留白就像一束聚光灯打在正中央。",
      alt: "要点：超过两行时亲手修断行，严防最后一行掉出 1–2 个孤字。",
      html: `<div class="mini-h">居中自有分量</div><div class="mini-rule"></div><div style="font-size:13px;">让第一眼直接停在核心</div>`,
    },
    longprose: {
      ok: false,
      badge: "不要居中",
      title: "长篇正文与产品说明",
      why: "一旦段落超过 5 行，每行左侧起笔点都在左右漂移。眼睛读完一行斜向回扫时失去统一落点，极易跳行疲劳，整块文字还会像埃伦·卢普顿批评的「墓碑」般沉闷。",
      alt: "替代方案：长段正文改用 176 左对齐右参差，或书刊宽栏下的 179 两端对齐。",
      html: `<p class="mini-bad-p">当一整段超过六行的产品说明被硬设为居中对齐时，每一行左侧起笔都在不断漂移，读者每读完一行都要在参差锯齿里重新寻找下一行开头，原本想营造的高级感瞬间变成了阅读障碍。</p>`,
    },
    table: {
      ok: false,
      badge: "不要居中",
      title: "参数表格与价目清单",
      why: "表格的核心是快速纵向扫读与比大小。把数字居中后，个位、十位与小数点左右错开，一眼根本比不出 ¥ 9.50 与 ¥ 1,280.00 的量级差距。",
      alt: "替代方案：表头文字用 176 左对齐，数值列用 177 右对齐（末位对齐）。",
      html: `<div class="mini-table">陶瓷杯 · ¥ 9.50<br>手工茶壶 · ¥ 1,280.00<br>胡桃木托盘 · ¥ 145.00</div>`,
    },
    bullets: {
      ok: false,
      badge: "不要居中",
      title: "项目符号列表与目录",
      why: "居中列表会让前面的圆点、序号随每行字数长短东倒西歪，失去清单原本的层级锚定与快速扫描功能。",
      alt: "替代方案：改用 176 左对齐，多行词条配合 185 悬挂缩进把序号留在走廊外。",
      html: `<ul class="mini-bullets"><li>预约入场</li><li>馆内请勿使用闪光灯与三脚架</li><li>展厅三层提供语音导览</li></ul>`,
    },
  };

  const cards = [...document.querySelectorAll(".sc-card")];
  const elSpec = document.getElementById("sd-specimen");
  const elBadge = document.getElementById("sd-badge");
  const elTitle = document.getElementById("sd-title");
  const elWhy = document.getElementById("sd-why");
  const elAlt = document.getElementById("sd-alt");

  function select(key) {
    const d = DATA[key] || DATA.titlepage;
    elSpec.innerHTML = d.html;
    elBadge.textContent = d.badge;
    elBadge.classList.toggle("is-no", !d.ok);
    elTitle.textContent = d.title;
    elWhy.textContent = d.why;
    elAlt.textContent = d.alt;
    cards.forEach((c) => {
      const on = c.dataset.sc === key;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", String(on));
    });
  }

  cards.forEach((c) => c.addEventListener("click", () => select(c.dataset.sc)));
  select("titlepage");
}

// ==================== 06 眼力小测：四选一 ====================
function initQuiz() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = document.getElementById("quiz-feedback");
  const elTitle = document.getElementById("qf-title");
  const elBody = document.getElementById("qf-body");
  const elList = document.getElementById("qf-list");

  const CORRECT = "C";
  const REASONS = [
    "方案 A（孤字吊尾）：首行塞进 17 字，末行只吊着「开幕」两字，像断了底座的碑铭。",
    "方案 B（头轻脚重）：把间隔符「·」丢到次行开头，上行仅 6 字、下行拉出 13 字，视觉压底发沉。",
    "方案 C（正确 · 倒梯形语义断行）：按「日期＋场馆 / 展厅开幕」自然停顿，12 字接 7 字温柔收束，呼应上方圆徽。",
    "方案 D（碎行过载）：一句短副标硬切成 5 行，眼睛被迫来回回扫四次，节奏支离破碎。",
  ];

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const pick = card.dataset.choice;
      const right = pick === CORRECT;
      cards.forEach((c) => {
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        if (c === card) c.classList.add("is-picked");
        if (c.dataset.choice === CORRECT) c.classList.add("is-correct");
        else if (c === card) c.classList.add("is-wrong");
      });

      fb.hidden = false;
      fb.classList.toggle("is-wrong", !right);
      elTitle.textContent = right
        ? "答对了！方案 C 的语义断行与倒梯形轮廓最稳"
        : `你选了方案 ${pick}，更稳的是方案 C`;
      elBody.textContent = right
        ? "四张请柬只差一个变量——副标题的断行切口。你一眼就避开了孤尾、压底与碎行。"
        : "四张请柬的字体、字号和留白完全一致，但不同的断行位置直接决定了居中剪影的稳重度：";
      elList.innerHTML = REASONS.map((r) => `<li>${r}</li>`).join("");
    });
  });
}

// ==================== 07 原海报放大灯箱 ====================
function initLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.7, 3.5);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.7, 3.5);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      scale = clamp(scale + (ev.deltaY < 0 ? 0.18 : -0.18), 0.7, 3.5);
      applyTransform();
    },
    { passive: false }
  );

  lbStage.addEventListener("pointerdown", (ev) => {
    if (ev.target === lbStage && scale <= 1.02) {
      close();
      return;
    }
    drag = { x: ev.clientX - tx, y: ev.clientY - ty };
    lbStage.classList.add("is-dragging");
    try {
      lbStage.setPointerCapture(ev.pointerId);
    } catch {}
  });

  lbStage.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    tx = ev.clientX - drag.x;
    ty = ev.clientY - drag.y;
    applyTransform();
  });

  const endLbDrag = () => {
    drag = null;
    lbStage.classList.remove("is-dragging");
  };
  lbStage.addEventListener("pointerup", endLbDrag);
  lbStage.addEventListener("pointercancel", endLbDrag);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !lb.hidden) close();
  });
}

// ==================== 启动 ====================
initHeroTypesetter();
initRaceCanvas();
initEraShowcase();
initOpticalLab();
initLineSculptor();
initScenarioMatrix();
initQuiz();
initLightbox();
