// 030 十字构图 · 开场活体十字轴网调校台（2D Canvas + 真实拖动/触摸/键盘交互）
// 1:1 化用 030 原海报的冷雾图纸、贯通渐隐钢青蓝十字带、白色轴心虚线、冰蓝光晕、黑核白环与四臂配重节点。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { LIMITS, PRESETS, THEMES, clamp, createBrokenState, evaluate } from "./model.js";

const COLORS = {
  paperTop: "#EDF2F6",
  paperMid: "#E6ECF1",
  paperLow: "#DDE6EF",
  axisMain: "#3D7ABC",
  axisSoft: "#588FC8",
  axisDanger: "#B42822",
  halo: "#CFE1F2",
  haloOk: "#CBE5E4",
  haloErr: "#F1D4D2",
  coreBlack: "#1B1D1E",
  white: "#FFFFFF",
  cream: "#FAF8EC",
  ink: "#1A2634",
  muted: "#45596E",
  ok: "#0E6B5A",
  err: "#B42822",
  line: "rgba(61, 122, 188, 0.45)",
};

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = createBrokenState("poster");
  let animIntro = 0; // 开场绘线动画 0..1
  let needsRedraw = true;
  let uiDirty = false;
  let dragging = null; // { kind: 'core' | 'arm' | 'angle', arm?, startX, startAngle, pointerId }
  let hoverTarget = null;
  let cssW = 800;
  let cssH = 440;
  let curDpr = 1;
  // 离屏缓存冷雾底纸与微网格，避免每帧重复径向渐变与几十条网格线重绘
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";
  let lastMiniSig = "";

  // DOM 引用
  const els = {
    topBadge: document.getElementById("top-status-badge"),
    diagTag: document.getElementById("diag-tag"),
    diagTitle: document.getElementById("diag-title"),
    diagWhy: document.getElementById("diag-why"),
    diagAction: document.getElementById("diag-action"),
    mAngle: document.getElementById("m-angle"),
    mCore: document.getElementById("m-core"),
    mReach: document.getElementById("m-reach"),
    mBalance: document.getElementById("m-balance"),
    heroStem: document.getElementById("hero-vert-stem"),
    cornerBadges: {
      focus: document.getElementById("c-badge-focus"),
      direction: document.getElementById("c-badge-direction"),
      stability: document.getElementById("c-badge-stability"),
      tension: document.getElementById("c-badge-tension"),
    },
    cornerBoxes: {
      focus: document.getElementById("corner-focus"),
      direction: document.getElementById("corner-direction"),
      stability: document.getElementById("corner-stability"),
      tension: document.getElementById("corner-tension"),
    },
    // 工具条控件
    angleRange: document.getElementById("ctrl-angle"),
    angleVal: document.getElementById("val-angle"),
    reachRange: document.getElementById("ctrl-reach"),
    reachVal: document.getElementById("val-reach"),
    scaleRange: document.getElementById("ctrl-scale"),
    scaleVal: document.getElementById("val-scale"),
    btnHub: document.getElementById("btn-hub-y"),
    btnClutter: document.getElementById("btn-clutter"),
    btnBalanceArms: document.getElementById("btn-arms-toggle"),
    btnGuides: document.getElementById("btn-guides"),
    btnBroken: document.getElementById("btn-reset-broken"),
    btnClassic: document.getElementById("btn-preset-classic"),
    btnLever: document.getElementById("btn-preset-lever"),
    themeBtns: [...document.querySelectorAll("[data-hero-theme]")],
    // 底部原海报三图解联动卡
    miniFocus: document.getElementById("mini-svg-focus"),
    miniDir: document.getElementById("mini-svg-direction"),
    miniTens: document.getElementById("mini-svg-tension"),
    miniCards: [...document.querySelectorAll("[data-mini-card]")],
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(240, Math.round(r.height));
    // 手机竖屏像素比上限 1.5（清晰且显著减轻软件渲染像素填充开销）
    curDpr = pixelRatio(cssW <= 640 ? 1.5 : 2);
    const pw = Math.round(cssW * curDpr);
    const ph = Math.round(cssH * curDpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      bgKey = "";
    }
    needsRedraw = true;
  }

  function ensureBgCache(g) {
    const key = `${canvas.width}x${canvas.height}|${state.hubY}|${state.guides ? 1 : 0}`;
    if (bgKey === key) return;
    bgKey = key;
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx.save();
    bgCtx.setTransform(curDpr, 0, 0, curDpr, 0, 0);
    const bgGrad = bgCtx.createRadialGradient(g.cx, g.cy, g.minSide * 0.05, g.cx, g.cy, Math.max(cssW, cssH) * 0.72);
    bgGrad.addColorStop(0, COLORS.paperTop);
    bgGrad.addColorStop(0.62, COLORS.paperMid);
    bgGrad.addColorStop(1, COLORS.paperLow);
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, cssW, cssH);

    if (state.guides) {
      bgCtx.strokeStyle = "rgba(61, 122, 188, 0.09)";
      bgCtx.lineWidth = 1;
      const step = Math.max(28, Math.round(g.minSide / 12));
      bgCtx.beginPath();
      for (let x = g.cx % step; x < cssW; x += step) {
        bgCtx.moveTo(x + 0.5, 0);
        bgCtx.lineTo(x + 0.5, cssH);
      }
      for (let y = g.cy % step; y < cssH; y += step) {
        bgCtx.moveTo(0, y + 0.5);
        bgCtx.lineTo(cssW, y + 0.5);
      }
      bgCtx.stroke();
    }
    bgCtx.restore();
  }

  // 计算画布里的几何基准（确保横竖比例不管怎么变，圆核永远是真圆、四臂严格按实际画布延伸）
  function geom() {
    const cx = cssW * 0.5;
    const cy = cssH * state.hubY;
    const minSide = Math.min(cssW, cssH);
    const coreR = minSide * state.coreScale * 0.5;
    const rad = (state.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // 水平轴向沿 (cos, sin)，垂直轴向沿 (-sin, cos)
    // 轴带视觉上贯通全幅；四臂可交互节点在桌面避开左右四角注记区，确保 0 重叠
    const maxArmH = cssW * 0.47;
    const nodeMaxH = cssW >= 1120 ? Math.max(150, Math.min(cssW * 0.42, cssW * 0.5 - 295)) : cssW * 0.44;
    const maxArmV = Math.min(cy, cssH - cy) * 0.90;
    const armLenH = maxArmH * state.reach;
    const armLenV = maxArmV * state.reach;
    const coreX = state.core.u * cssW;
    const coreY = state.core.v * cssH;

    // 计算四臂节点中心像素坐标
    const armPos = {
      E: { x: cx + cos * nodeMaxH * state.nodes.E.r, y: cy + sin * nodeMaxH * state.nodes.E.r, maxL: nodeMaxH, vx: cos, vy: sin },
      W: { x: cx - cos * nodeMaxH * state.nodes.W.r, y: cy - sin * nodeMaxH * state.nodes.W.r, maxL: nodeMaxH, vx: -cos, vy: -sin },
      N: { x: cx + sin * maxArmV * state.nodes.N.r, y: cy - cos * maxArmV * state.nodes.N.r, maxL: maxArmV, vx: sin, vy: -cos },
      S: { x: cx - sin * maxArmV * state.nodes.S.r, y: cy + cos * maxArmV * state.nodes.S.r, maxL: maxArmV, vx: -sin, vy: cos },
    };

    const clutPos = state.clutter.map((c) => ({
      ...c,
      x: cx + c.dx * minSide,
      y: cy + c.dy * minSide,
      r: Math.max(12, minSide * 0.036),
    }));

    return { cx, cy, minSide, coreR, rad, cos, sin, maxArmH, maxArmV, armLenH, armLenV, coreX, coreY, armPos, clutPos };
  }

  // 更新 DOM 读数、四角徽章、三枚底带微缩图解与滑杆
  function syncUI() {
    const ev = evaluate(state);
    // 顶眉徽章
    if (els.topBadge) {
      els.topBadge.textContent = ev.ok ? "4 / 4 十字成立" : `${ev.score} / 4 待校十字`;
      els.topBadge.dataset.state = ev.ok ? "ok" : "warn";
    }
    // 顶部通天竖轴是否微微跟画布角度呼应颜色
    if (els.heroStem) {
      els.heroStem.dataset.ok = ev.stabilityOk ? "1" : "0";
    }
    // 底部钢青蓝诊单
    if (els.diagTag) {
      els.diagTag.textContent = ev.verdict.tag;
      els.diagTag.dataset.state = ev.ok ? "ok" : "err";
    }
    if (els.diagTitle) els.diagTitle.textContent = ev.verdict.title;
    if (els.diagWhy) els.diagWhy.textContent = ev.verdict.why;
    if (els.diagAction) els.diagAction.textContent = ev.verdict.action;

    if (els.mAngle) els.mAngle.textContent = ev.readouts.angleText;
    if (els.mCore) els.mCore.textContent = ev.readouts.coreText;
    if (els.mReach) els.mReach.textContent = ev.readouts.reachText;
    if (els.mBalance) els.mBalance.textContent = ev.readouts.balanceText;

    // 四角原海报注记联动
    for (const key of ["focus", "direction", "stability", "tension"]) {
      const b = els.cornerBadges[key];
      const box = els.cornerBoxes[key];
      if (b) {
        b.textContent = ev.corners[key].badge;
        b.dataset.state = ev.corners[key].ok ? "ok" : "err";
      }
      if (box) {
        box.dataset.state = ev.corners[key].ok ? "ok" : "err";
        box.classList.toggle("is-hl", state.highlight === key);
      }
    }

    // 工具条同步
    if (els.angleRange) els.angleRange.value = String(Math.round(state.angle));
    if (els.angleVal) els.angleVal.textContent = `${state.angle > 0 ? "+" : ""}${Math.round(state.angle)}°`;
    if (els.reachRange) els.reachRange.value = String(Math.round(state.reach * 100));
    if (els.reachVal) els.reachVal.textContent = `${Math.round(state.reach * 100)}%`;
    if (els.scaleRange) els.scaleRange.value = String(Math.round(state.coreScale * 100));
    if (els.scaleVal) els.scaleVal.textContent = `${Math.round(state.coreScale * 100)}%`;

    if (els.btnHub) {
      const lift = state.hubY < 0.49;
      els.btnHub.textContent = lift ? "交汇：光学微提 47%" : "交汇：几何居中 50%";
      els.btnHub.setAttribute("aria-pressed", String(lift));
    }
    if (els.btnClutter) {
      els.btnClutter.textContent = ev.clutterCount > 0 ? `清杂块 (${ev.clutterCount})` : "核心已清净";
      els.btnClutter.dataset.warn = ev.clutterCount > 0 ? "1" : "0";
    }
    if (els.btnBalanceArms) {
      const allOn = ev.activeCount === 4;
      els.btnBalanceArms.textContent = allOn ? "四臂节点：全开" : `补全空臂 (${ev.activeCount}/4)`;
      els.btnBalanceArms.dataset.warn = allOn ? "0" : "1";
    }
    if (els.btnGuides) {
      els.btnGuides.textContent = state.guides ? "标线：开" : "标线：关";
      els.btnGuides.setAttribute("aria-pressed", String(state.guides));
    }
    for (const b of els.themeBtns) {
      const active = b.dataset.heroTheme === state.theme;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }

    // 同步底部原海报三枚白框微缩图解（完全由单真源几何驱动）
    syncMiniDiagrams(ev);
  }

  function syncMiniDiagrams(ev) {
    const miniSig = [
      Math.round(state.angle),
      Math.round(state.core.u * 50),
      Math.round(state.core.v * 50),
      Math.round(state.coreScale * 100),
      Math.round(state.hubY * 100),
      Math.round(state.reach * 100),
      ev.focusOk ? 1 : 0,
      ev.directionOk ? 1 : 0,
      ev.tensionOk ? 1 : 0,
      state.highlight || "",
      ["N", "S", "W", "E"].map((k) => `${state.nodes[k].active ? 1 : 0}:${Math.round(state.nodes[k].r * 50)}:${Math.round(state.nodes[k].w * 20)}`).join(","),
    ].join("|");
    if (miniSig === lastMiniSig) return;
    lastMiniSig = miniSig;

    // 1. 中心聚焦图解（64x64 viewBox）：展示黑核相对交汇点的实时位置与大小
    if (els.miniFocus) {
      const gx = 32 + (state.core.u - 0.5) * 44;
      const gy = 32 + (state.core.v - 0.5) * 44;
      const gr = clamp(state.coreScale * 38, 4.5, 16);
      const hy = 32 + (state.hubY - 0.5) * 44;
      const rot = state.angle;
      els.miniFocus.innerHTML = `
        <g transform="rotate(${rot.toFixed(1)} 32 ${hy.toFixed(1)})">
          <line x1="4" y1="${hy.toFixed(1)}" x2="60" y2="${hy.toFixed(1)}" stroke="rgba(255,255,255,0.65)" stroke-width="1.2"/>
          <line x1="32" y1="4" x2="32" y2="60" stroke="rgba(255,255,255,0.65)" stroke-width="1.2"/>
        </g>
        <circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${gr.toFixed(1)}" fill="${ev.focusOk ? "#FAF8EC" : "#FFB4AC"}" stroke="${ev.focusOk ? "none" : "#FFFFFF"}" stroke-width="1.2"/>
      `;
    }
    // 2. 轴向引导图解：展示四向箭头的实际延伸长度与倾角
    if (els.miniDir) {
      const len = 8 + state.reach * 18;
      const rot = state.angle;
      const c = ev.directionOk ? "#FAF8EC" : "#FFB4AC";
      els.miniDir.innerHTML = `
        <g transform="rotate(${rot.toFixed(1)} 32 32)" stroke="${c}" fill="${c}" stroke-width="1.4" stroke-linecap="round">
          <line x1="32" y1="${(32 - len).toFixed(1)}" x2="32" y2="${(32 + len).toFixed(1)}" stroke-dasharray="3 2.5"/>
          <line x1="${(32 - len).toFixed(1)}" y1="32" x2="${(32 + len).toFixed(1)}" y2="32" stroke-dasharray="3 2.5"/>
          <polygon points="32,${(32 - len - 3).toFixed(1)} 29,${(32 - len + 2).toFixed(1)} 35,${(32 - len + 2).toFixed(1)}" stroke="none"/>
          <polygon points="32,${(32 + len + 3).toFixed(1)} 29,${(32 + len - 2).toFixed(1)} 35,${(32 + len - 2).toFixed(1)}" stroke="none"/>
          <polygon points="${(32 - len - 3).toFixed(1)},32 ${(32 - len + 2).toFixed(1)},29 ${(32 - len + 2).toFixed(1)},35" stroke="none"/>
          <polygon points="${(32 + len + 3).toFixed(1)},32 ${(32 + len - 2).toFixed(1)},29 ${(32 + len - 2).toFixed(1)},35" stroke="none"/>
        </g>
      `;
    }
    // 3. 平衡张力图解：展示四臂配重点的实时开启与远近重量
    if (els.miniTens) {
      const c = ev.tensionOk ? "#FAF8EC" : "#FFB4AC";
      const pts = [
        { k: "N", x: 32, y: 32 - state.nodes.N.r * 23 },
        { k: "S", x: 32, y: 32 + state.nodes.S.r * 23 },
        { k: "W", x: 32 - state.nodes.W.r * 23, y: 32 },
        { k: "E", x: 32 + state.nodes.E.r * 23, y: 32 },
      ];
      const dots = pts
        .map((p) => {
          const n = state.nodes[p.k];
          if (!n.active) return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="none" stroke="rgba(255,255,255,0.45)" stroke-dasharray="2 2"/>`;
          const rr = 2.6 + n.w * 2.1;
          return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${c}"/>`;
        })
        .join("");
      els.miniTens.innerHTML = `
        <line x1="6" y1="32" x2="58" y2="32" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
        <line x1="32" y1="6" x2="32" y2="58" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
        <circle cx="32" cy="32" r="5.5" fill="#FAF8EC"/>
        ${dots}
      `;
    }
    for (const card of els.miniCards) {
      const k = card.dataset.miniCard;
      const ok = k === "focus" ? ev.focusOk : k === "direction" ? ev.directionOk : ev.tensionOk;
      card.dataset.state = ok ? "ok" : "err";
      card.classList.toggle("is-hl", state.highlight === k);
    }
  }

  // 主 2D Canvas 绘制
  function render(t, dt, { still }) {
    if (still) {
      animIntro = 1;
    } else if (animIntro < 1) {
      animIntro = Math.min(1, animIntro + Math.max(dt, 0.016) * 1.45);
      needsRedraw = true;
    }
    if (uiDirty) {
      uiDirty = false;
      syncUI();
    }
    // 仅在开场绘线或交互变动时重画，静置零无效重绘（省电且保持满帧）
    if (!needsRedraw) return;
    needsRedraw = false;

    const ev = evaluate(state);
    const g = geom();
    const ease = 1 - Math.pow(1 - animIntro, 3);

    // 1–2. 直接复用离屏缓存的冷雾底纸与微网格
    ensureBgCache(g);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.scale(curDpr, curDpr);

    // 真正的 90° 参考基准灰虚线（当轴歪斜时，一眼看出偏了多少度！）
    if (state.guides && (Math.abs(state.angle) > 0.5 || state.highlight === "stability")) {
      ctx.save();
      ctx.strokeStyle = Math.abs(state.angle) > LIMITS.angleTol ? "rgba(180, 40, 34, 0.36)" : "rgba(14, 107, 90, 0.35)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(16, g.cy);
      ctx.lineTo(cssW - 16, g.cy);
      ctx.moveTo(g.cx, 12);
      ctx.lineTo(g.cx, cssH - 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. 主题专属建筑背景图层（在十字轴底下，绝不喧宾夺主）
    if (state.theme === "atrium") {
      drawAtriumBackdrop(ctx, g, cssW, cssH);
    } else if (state.theme === "crossing") {
      drawCrossingBackdrop(ctx, g, cssW, cssH);
    }

    // 4. 中央冰蓝光晕圆（原海报标志性中心柔光晕！）
    const haloR = g.minSide * 0.255 * (0.4 + 0.6 * ease);
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, haloR, 0, Math.PI * 2);
    ctx.fillStyle = ev.ok
      ? "rgba(196, 224, 240, 0.72)"
      : "rgba(207, 225, 242, 0.66)";
    ctx.fill();
    if (state.highlight === "focus") {
      ctx.strokeStyle = COLORS.axisMain;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
    }
    ctx.restore();

    // 5. 四条原海报风格「羽化渐隐钢青蓝十字带 + 白色轴心虚线」
    // 始终保留 030 原海报标志性清澈钢青蓝基因，错态改用清晰红色基准线、倾角弧与断口线精准警示
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.rad);

    const bandW = clamp(g.minSide * 0.108, 30, 56);
    const halfH = g.armLenH * ease;
    const halfV = g.armLenV * ease;
    const bandRGB = ev.stabilityOk ? "61, 122, 188" : "74, 124, 178";

    // 横轴羽化蓝带
    const hGrad = ctx.createLinearGradient(-halfH, 0, halfH, 0);
    hGrad.addColorStop(0, `rgba(${bandRGB}, 0)`);
    hGrad.addColorStop(0.16, `rgba(${bandRGB}, 0.84)`);
    hGrad.addColorStop(0.5, `rgba(${bandRGB}, 0.96)`);
    hGrad.addColorStop(0.84, `rgba(${bandRGB}, 0.84)`);
    hGrad.addColorStop(1, `rgba(${bandRGB}, 0)`);
    ctx.fillStyle = hGrad;
    ctx.fillRect(-halfH, -bandW / 2, halfH * 2, bandW);

    // 竖轴羽化蓝带
    const vGrad = ctx.createLinearGradient(0, -halfV, 0, halfV);
    vGrad.addColorStop(0, `rgba(${bandRGB}, 0)`);
    vGrad.addColorStop(0.16, `rgba(${bandRGB}, 0.84)`);
    vGrad.addColorStop(0.5, `rgba(${bandRGB}, 0.96)`);
    vGrad.addColorStop(0.84, `rgba(${bandRGB}, 0.84)`);
    vGrad.addColorStop(1, `rgba(${bandRGB}, 0)`);
    ctx.fillStyle = vGrad;
    ctx.fillRect(-bandW / 2, -halfV, bandW, halfV * 2);

    // 若短截成孤立小加号，在截断端绘清晰红色断口标记，让人一眼懂为什么算「短截」
    if (state.reach < LIMITS.reachMin && state.guides) {
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // 左右断口
      ctx.moveTo(-halfH, -bandW * 0.62); ctx.lineTo(-halfH, bandW * 0.62);
      ctx.moveTo(halfH, -bandW * 0.62); ctx.lineTo(halfH, bandW * 0.62);
      // 上下断口
      ctx.moveTo(-bandW * 0.62, -halfV); ctx.lineTo(bandW * 0.62, -halfV);
      ctx.moveTo(-bandW * 0.62, halfV); ctx.lineTo(bandW * 0.62, halfV);
      ctx.stroke();
    }

    // 居中白色虚线（1:1 复刻原海报穿过十字中心的白虚线！）
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(-halfH * 0.96, 0);
    ctx.lineTo(halfH * 0.96, 0);
    ctx.moveTo(0, -halfV * 0.96);
    ctx.lineTo(0, halfV * 0.96);
    ctx.stroke();
    ctx.setLineDash([]);

    // 延伸引导箭头（标线开启或高亮 direction 时呈现四向延展箭头，不做无意义抖动）
    if (state.guides) {
      const arrowAlpha = state.highlight === "direction" ? 0.95 : 0.76;
      const arrowCol = ev.directionOk ? `rgba(255,255,255,${arrowAlpha})` : `rgba(255,220,215,${arrowAlpha})`;
      drawArrowTip(ctx, halfH * 0.86, 0, 0, arrowCol);
      drawArrowTip(ctx, -halfH * 0.86, 0, Math.PI, arrowCol);
      drawArrowTip(ctx, 0, -halfV * 0.84, -Math.PI / 2, arrowCol);
      drawArrowTip(ctx, 0, halfV * 0.84, Math.PI / 2, arrowCol);
    }

    // 轴斜扇角标尺（当轴线歪斜时直接在交汇点旁画角度弧，直观明了）
    if (Math.abs(state.angle) > 0.8) {
      const arcR = haloR * 0.76;
      ctx.rotate(-g.rad); // 回到水平坐标系画夹角
      ctx.strokeStyle = Math.abs(state.angle) > LIMITS.angleTol ? COLORS.err : COLORS.ok;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const a0 = state.angle > 0 ? 0 : g.rad;
      const a1 = state.angle > 0 ? g.rad : 0;
      ctx.arc(0, 0, arcR, a0, a1);
      ctx.stroke();
      ctx.fillStyle = Math.abs(state.angle) > LIMITS.angleTol ? COLORS.err : COLORS.ok;
      ctx.font = '600 12px "IBM Plex Sans", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(`${state.angle > 0 ? "+" : ""}${Math.round(state.angle)}°`, arcR + 7, state.angle > 0 ? 14 : -6);
      ctx.rotate(g.rad);
    }
    ctx.restore();

    // 6. 原海报四角优雅折线虚线引注（仅在桌面宽屏四角注记浮于画布之上时绘制，避免平板无角注处悬空）
    if (window.innerWidth > 1120 && cssW >= 1040) {
      drawCornerLeaders(ctx, g, cssW, cssH, ev);
    }

    // 7. 交汇中心空心提示环（如果黑核脱位，在真实交汇点显出空心虚线靶环，一眼看出「交汇处空了」）
    if (ev.coreDist > LIMITS.coreDistTol) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.coreR * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fill();
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.err;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("交汇空心", g.cx, g.cy);

      // 画一条红虚线连到脱位的黑核，示意拉回来
      ctx.strokeStyle = "rgba(180, 40, 34, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(g.cx, g.cy);
      ctx.lineTo(g.coreX, g.coreY);
      ctx.stroke();
      ctx.restore();
    }

    // 8. 核周干扰杂块（点击可清净）
    for (const c of g.clutPos) {
      if (!c.active) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = "#B42822";
      ctx.fillRect(-c.r, -c.r * 0.72, c.r * 2, c.r * 1.44);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-c.r, -c.r * 0.72, c.r * 2, c.r * 1.44);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 11px "IBM Plex Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×", 0, 0.5);
      ctx.restore();
    }

    // 9. 四条轴臂上的可拖拽次要配重节点（含空臂虚线槽位，点按即开启/拖移）
    const armKeys = ["N", "S", "W", "E"];
    const armLabelMap = THEMES[state.theme].armNames;
    for (const k of armKeys) {
      const node = state.nodes[k];
      const p = g.armPos[k];
      const nr = clamp(g.minSide * (0.025 + node.w * 0.017), 11, 24);
      const isSelected = state.selectedArm === k;
      const isBadPos = node.active && (node.r < LIMITS.nodeInnerMin || node.r > LIMITS.nodeOuterMax);

      ctx.save();
      if (!node.active) {
        // 空置臂位：绘可点击虚线圆槽，邀请用户补回平衡
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.fill();
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COLORS.err;
        ctx.font = '700 13px "IBM Plex Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", p.x, p.y + 0.5);
        if (cssW >= 460) {
          ctx.font = '600 10px "Noto Sans SC", sans-serif';
          ctx.fillText("点此配重", p.x, p.y + 23);
        }
      } else {
        // 激活的臂节点
        ctx.beginPath();
        ctx.arc(p.x, p.y, nr + 4, 0, Math.PI * 2);
        ctx.fillStyle = isBadPos
          ? "rgba(180, 40, 34, 0.2)"
          : isSelected
            ? "rgba(29, 84, 144, 0.2)"
            : "rgba(255, 255, 255, 0.55)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = isBadPos ? COLORS.err : state.theme === "crossing" ? "#1E3A5F" : COLORS.white;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 2.2;
        ctx.strokeStyle = isBadPos ? COLORS.white : COLORS.ink;
        ctx.stroke();

        // 内核点表示权重强弱
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3.5, nr * 0.38), 0, Math.PI * 2);
        ctx.fillStyle = isBadPos ? COLORS.white : state.theme === "crossing" ? COLORS.cream : COLORS.axisMain;
        ctx.fill();

        // 紧凑坐标小签（显示距心%）
        if (cssW >= 420) {
          const ly = k === "N" ? p.y - nr - 11 : k === "S" ? p.y + nr + 13 : p.y - nr - 10;
          ctx.font = '600 10px "IBM Plex Sans", "Noto Sans SC", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const txt = `${armLabelMap[k].slice(0, 2)} ${Math.round(node.r * 100)}%`;
          const tw = ctx.measureText(txt).width + 10;
          ctx.fillStyle = isBadPos ? COLORS.err : "rgba(24, 26, 26, 0.82)";
          ctx.fillRect(p.x - tw / 2, ly - 8, tw, 16);
          ctx.fillStyle = COLORS.white;
          ctx.fillText(txt, p.x, ly + 0.5);
        }
      }
      ctx.restore();
    }

    // 10. 主角：中心黑核 + 纯白厚环（1:1 还原 030 原海报最具辨识度的视觉锚点！）
    ctx.save();
    const ringOuter = g.coreR + Math.max(6, g.coreR * 0.24);
    // 轻盈建筑投影（用两层半透明叠圆替代高开销 shadowBlur，软件渲染提速数倍）
    ctx.beginPath();
    ctx.arc(g.coreX, g.coreY + 3, ringOuter + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(18, 36, 58, 0.08)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(g.coreX, g.coreY + 2, ringOuter + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(18, 36, 58, 0.12)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(g.coreX, g.coreY, ringOuter, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.white;
    ctx.fill();

    // 若核径超标或偏核，给白环外描醒目提示圈
    if (!ev.focusOk && (ev.coreDist > LIMITS.coreDistTol || state.coreScale > LIMITS.coreScaleMax || state.coreScale < LIMITS.coreScaleMin)) {
      ctx.strokeStyle = COLORS.err;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    } else if (ev.focusOk) {
      ctx.strokeStyle = "rgba(61, 122, 188, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 纯黑主核（不同题材绘入极简克制建筑/城市抽象纹，绝不杂乱、绝无人物五官）
    ctx.beginPath();
    ctx.arc(g.coreX, g.coreY, g.coreR, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.coreBlack;
    ctx.fill();

    if (state.theme === "atrium") {
      // 穹顶采光井同心肋环
      ctx.strokeStyle = "rgba(250, 248, 236, 0.32)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(g.coreX, g.coreY, g.coreR * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(g.coreX, g.coreY, g.coreR * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(250, 248, 236, 0.78)";
      ctx.fill();
    } else if (state.theme === "crossing") {
      // 城市环岛碑柱顶视
      ctx.strokeStyle = "rgba(250, 248, 236, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(g.coreX, g.coreY, g.coreR * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(g.coreX - 4, g.coreY - 4, 8, 8);
    } else if (hoverTarget === "core" || (dragging && dragging.kind === "core")) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(g.coreX, g.coreY, g.coreR * 0.68, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 若脱位，在黑核上标注简短「拖回中心」提示
    if (ev.coreDist > LIMITS.coreDistTol && g.coreR >= 22) {
      ctx.fillStyle = COLORS.cream;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("拖回中心", g.coreX, g.coreY);
    }
    ctx.restore();

    // 11. 底部悬臂力矩平衡微尺（直观呈现左右力矩倾覆与归平）
    drawTorqueMeter(ctx, cssW, cssH, ev);

    ctx.restore();
  }

  function drawAtriumBackdrop(ctx, g, w, h) {
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.rad);
    ctx.strokeStyle = "rgba(61, 122, 188, 0.2)";
    ctx.lineWidth = 1.2;
    const s = g.minSide * 0.42;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.strokeRect(-s * 0.72, -s * 0.72, s * 1.44, s * 1.44);
    // 四角建筑实墙暗面
    const corner = s * 0.34;
    ctx.fillStyle = "rgba(26, 38, 52, 0.06)";
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.fillRect(sx > 0 ? s - corner : -s, sy > 0 ? s - corner : -s, corner, corner);
      }
    }
    ctx.restore();
  }

  function drawCrossingBackdrop(ctx, g, w, h) {
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.rad);
    const pad = clamp(g.minSide * 0.14, 46, 76);
    ctx.fillStyle = "rgba(26, 38, 52, 0.065)";
    ctx.strokeStyle = "rgba(26, 38, 52, 0.14)";
    ctx.lineWidth = 1;
    // 四个街区建筑体块（对称分布于四象限，烘托十字大道）
    const bw = Math.max(60, w * 0.24);
    const bh = Math.max(46, h * 0.24);
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const rx = sx > 0 ? pad : -pad - bw;
        const ry = sy > 0 ? pad : -pad - bh;
        ctx.fillRect(rx, ry, bw, bh);
        ctx.strokeRect(rx, ry, bw, bh);
      }
    }
    ctx.restore();
  }

  function drawArrowTip(ctx, x, y, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4.5);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 1:1 复刻 030 原海报四角的蓝色折线虚线引注（端点小圆从四角注记内沿伸出 → 横折 → 45° 斜指中央冰蓝光晕）
  function drawCornerLeaders(ctx, g, w, h, ev) {
    const haloR = g.minSide * 0.275;
    const sidePad = w >= 1120 ? 270 : w * 0.24;
    const elbowPad = w >= 1120 ? 336 : w * 0.31;
    const topY = w >= 1120 ? 64 : h * 0.22;
    const botY = w >= 1120 ? h - 64 : h * 0.78;
    const pts = [
      { key: "focus", sx: sidePad, sy: topY, mx: elbowPad, my: topY, ex: g.cx - haloR * 0.72, ey: g.cy - haloR * 0.65 },
      { key: "direction", sx: w - sidePad, sy: topY, mx: w - elbowPad, my: topY, ex: g.cx + haloR * 0.72, ey: g.cy - haloR * 0.65 },
      { key: "stability", sx: sidePad, sy: botY, mx: elbowPad, my: botY, ex: g.cx - haloR * 0.72, ey: g.cy + haloR * 0.65 },
      { key: "tension", sx: w - sidePad, sy: botY, mx: w - elbowPad, my: botY, ex: g.cx + haloR * 0.72, ey: g.cy + haloR * 0.65 },
    ];
    for (const p of pts) {
      const ok = ev.corners[p.key].ok;
      const hl = state.highlight === p.key;
      ctx.save();
      ctx.strokeStyle = ok ? (hl ? "#1D5490" : "rgba(61, 122, 188, 0.72)") : "rgba(180, 40, 34, 0.78)";
      ctx.lineWidth = hl ? 2.2 : 1.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.mx, p.my);
      ctx.lineTo(p.ex, p.ey);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, hl ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ok ? "#3D7ABC" : COLORS.err;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTorqueMeter(ctx, w, h, ev) {
    const mw = Math.min(200, w * 0.44);
    const x0 = w * 0.5 - mw / 2;
    const y0 = h - 18;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.fillRect(x0 - 8, y0 - 9, mw + 16, 18);
    ctx.strokeStyle = "rgba(61, 122, 188, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 - 8, y0 - 9, mw + 16, 18);

    // 标尺基线
    ctx.strokeStyle = "rgba(26, 38, 52, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + mw, y0);
    ctx.moveTo(w * 0.5, y0 - 5);
    ctx.lineTo(w * 0.5, y0 + 5);
    ctx.stroke();

    // 中心达标安全带
    const safeW = mw * LIMITS.lrImbalanceMax;
    ctx.fillStyle = "rgba(14, 107, 90, 0.22)";
    ctx.fillRect(w * 0.5 - safeW, y0 - 3, safeW * 2, 6);

    // 实时力矩游标
    const pos = clamp(ev.lrSigned, -1, 1);
    const px = w * 0.5 + pos * (mw * 0.48);
    ctx.beginPath();
    ctx.arc(px, y0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = ev.tensionOk ? COLORS.ok : COLORS.err;
    ctx.fill();
    ctx.restore();
  }

  // 命中测试：优先杂块 → 黑核 → 四臂节点 → 空白画布（旋转轴角）
  function hitTest(x, y) {
    const g = geom();
    for (const c of g.clutPos) {
      if (c.active && Math.hypot(x - c.x, y - c.y) <= c.r + 10) {
        return { kind: "clutter", id: c.id };
      }
    }
    if (Math.hypot(x - g.coreX, y - g.coreY) <= g.coreR + 14) {
      return { kind: "core" };
    }
    for (const k of ["N", "S", "W", "E"]) {
      const p = g.armPos[k];
      if (Math.hypot(x - p.x, y - p.y) <= 24) {
        return { kind: "arm", arm: k };
      }
    }
    return { kind: "angle" };
  }

  function pointerXY(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e) {
    const { x, y } = pointerXY(e);
    const hit = hitTest(x, y);
    if (hit.kind === "clutter") {
      const target = state.clutter.find((c) => c.id === hit.id);
      if (target) target.active = false;
      needsRedraw = true;
      syncUI();
      runner.draw();
      return;
    }
    if (hit.kind === "arm" && !state.nodes[hit.arm].active) {
      state.nodes[hit.arm].active = true;
      state.nodes[hit.arm].r = 0.60;
      state.nodes[hit.arm].w = 1.00;
      state.selectedArm = hit.arm;
      needsRedraw = true;
      syncUI();
      runner.draw();
    }
    dragging = {
      kind: hit.kind,
      arm: hit.arm || null,
      startX: x,
      startY: y,
      startAngle: state.angle,
      pointerId: e.pointerId,
    };
    if (hit.kind === "arm") state.selectedArm = hit.arm;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    needsRedraw = true;
  }

  function onPointerMove(e) {
    const { x, y } = pointerXY(e);
    if (!dragging) {
      const h = hitTest(x, y);
      hoverTarget = h.kind;
      canvas.style.cursor = h.kind === "clutter" ? "pointer" : h.kind === "angle" ? "ew-resize" : "grab";
      return;
    }
    const g = geom();
    if (dragging.kind === "core") {
      let u = clamp(x / cssW, 0.14, 0.86);
      let v = clamp(y / cssH, 0.16, 0.84);
      // 靠近交汇点轻柔吸附
      if (Math.hypot(u - 0.5, v - state.hubY) < 0.04) {
        u = 0.5;
        v = state.hubY;
      }
      state.core.u = u;
      state.core.v = v;
    } else if (dragging.kind === "arm" && dragging.arm) {
      const p = g.armPos[dragging.arm];
      const proj = (x - g.cx) * p.vx + (y - g.cy) * p.vy;
      let r = clamp(proj / p.maxL, 0.18, 0.94);
      // 靠近黄金平衡点 0.60 极轻吸附
      if (Math.abs(r - 0.60) < 0.025) r = 0.60;
      state.nodes[dragging.arm].r = r;
    } else if (dragging.kind === "angle") {
      const dx = x - dragging.startX;
      let next = clamp(dragging.startAngle + dx * 0.16, -32, 32);
      if (Math.abs(next) < 1.8) next = 0;
      state.angle = next;
    }
    needsRedraw = true;
    uiDirty = true;
    if (reducedMotion.matches) {
      uiDirty = false;
      syncUI();
      runner.draw();
    }
  }

  function onPointerUp(e) {
    if (!dragging) return;
    try {
      canvas.releasePointerCapture(dragging.pointerId);
    } catch {}
    dragging = null;
    needsRedraw = true;
    if (uiDirty) {
      uiDirty = false;
      syncUI();
    }
    if (reducedMotion.matches) runner.draw();
  }

  // 触屏兼容（供 perf.mjs 的 touchStart/touchMove 以及手机单指横拖流畅重画，同时纵向划动不抢页面滚动！）
  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      const x = t.clientX - r.left;
      const y = t.clientY - r.top;
      const hit = hitTest(x, y);
      touchDrag = {
        kind: hit.kind,
        arm: hit.arm || null,
        id: hit.id,
        startX: x,
        startY: y,
        startAngle: state.angle,
        locked: hit.kind === "core" || hit.kind === "arm" ? "drag" : null,
      };
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDrag || e.touches.length !== 1) return;
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      const x = t.clientX - r.left;
      const y = t.clientY - r.top;
      const dx = x - touchDrag.startX;
      const dy = y - touchDrag.startY;
      if (!touchDrag.locked) {
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          touchDrag.locked = Math.abs(dx) >= Math.abs(dy) ? "drag" : "scroll";
        } else {
          return;
        }
      }
      if (touchDrag.locked === "scroll") return;
      e.preventDefault();
      const g = geom();
      if (touchDrag.kind === "core") {
        let u = clamp(x / cssW, 0.14, 0.86);
        let v = clamp(y / cssH, 0.16, 0.84);
        if (Math.hypot(u - 0.5, v - state.hubY) < 0.045) {
          u = 0.5;
          v = state.hubY;
        }
        state.core.u = u;
        state.core.v = v;
      } else if (touchDrag.kind === "arm" && touchDrag.arm) {
        if (!state.nodes[touchDrag.arm].active) state.nodes[touchDrag.arm].active = true;
        const p = g.armPos[touchDrag.arm];
        const proj = (x - g.cx) * p.vx + (y - g.cy) * p.vy;
        state.nodes[touchDrag.arm].r = clamp(proj / p.maxL, 0.18, 0.94);
      } else {
        let next = clamp(touchDrag.startAngle + dx * 0.22, -32, 32);
        if (Math.abs(next) < 1.5) next = 0;
        state.angle = next;
      }
      needsRedraw = true;
      uiDirty = true;
      if (reducedMotion.matches) {
        uiDirty = false;
        syncUI();
        runner.draw();
      }
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchend",
    () => {
      touchDrag = null;
      if (uiDirty) {
        uiDirty = false;
        syncUI();
      }
    },
    { passive: true },
  );

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // 键盘操作：画布聚焦时 ←/→ 调轴角，↑/↓ 调轴臂延伸度，Enter 归核或清杂块（绝不使用「Home 归中」）
  canvas.addEventListener("keydown", (e) => {
    let handled = true;
    if (e.key === "ArrowLeft") state.angle = clamp(state.angle - 2, -32, 32);
    else if (e.key === "ArrowRight") state.angle = clamp(state.angle + 2, -32, 32);
    else if (e.key === "ArrowUp") state.reach = clamp(state.reach + 0.06, 0.38, 1.0);
    else if (e.key === "ArrowDown") state.reach = clamp(state.reach - 0.06, 0.38, 1.0);
    else if (e.key === "Enter" || e.key === " ") {
      state.core.u = 0.5;
      state.core.v = state.hubY;
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      if (Math.abs(state.angle) < 1.5) state.angle = 0;
      needsRedraw = true;
      syncUI();
      runner.draw();
    }
  });

  // 绑定工具条控件
  if (els.angleRange) {
    els.angleRange.addEventListener("input", () => {
      let v = Number(els.angleRange.value);
      if (Math.abs(v) <= 1) v = 0;
      state.angle = v;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.reachRange) {
    els.reachRange.addEventListener("input", () => {
      state.reach = Number(els.reachRange.value) / 100;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.scaleRange) {
    els.scaleRange.addEventListener("input", () => {
      state.coreScale = Number(els.scaleRange.value) / 100;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.btnHub) {
    els.btnHub.addEventListener("click", () => {
      const wasAligned = Math.hypot(state.core.u - 0.5, state.core.v - state.hubY) <= LIMITS.coreDistTol;
      state.hubY = state.hubY < 0.49 ? 0.50 : 0.47;
      if (wasAligned) state.core.v = state.hubY;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.btnClutter) {
    els.btnClutter.addEventListener("click", () => {
      const hasAny = state.clutter.some((c) => c.active);
      state.clutter.forEach((c) => {
        c.active = !hasAny;
      });
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.btnBalanceArms) {
    els.btnBalanceArms.addEventListener("click", () => {
      const allOn = Object.values(state.nodes).every((n) => n.active);
      if (allOn) {
        // 切换为「远轻近重」配重，或切回对称
        const lever = Math.abs(state.nodes.W.w - state.nodes.E.w) > 0.2;
        if (!lever) {
          state.nodes.W = { active: true, r: 0.48, w: 1.32 };
          state.nodes.E = { active: true, r: 0.76, w: 0.84 };
          state.nodes.N = { active: true, r: 0.54, w: 0.90 };
          state.nodes.S = { active: true, r: 0.66, w: 1.05 };
        } else {
          state.nodes.W = { active: true, r: 0.60, w: 1.00 };
          state.nodes.E = { active: true, r: 0.60, w: 1.00 };
          state.nodes.N = { active: true, r: 0.58, w: 0.95 };
          state.nodes.S = { active: true, r: 0.62, w: 1.05 };
        }
      } else {
        state.nodes.W = { active: true, r: 0.60, w: 1.00 };
        state.nodes.E = { active: true, r: 0.60, w: 1.00 };
        state.nodes.N = { active: true, r: 0.58, w: 0.95 };
        state.nodes.S = { active: true, r: 0.62, w: 1.05 };
      }
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  if (els.btnGuides) {
    els.btnGuides.addEventListener("click", () => {
      state.guides = !state.guides;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }
  function applyPreset(fn) {
    const next = fn(state.theme);
    Object.assign(state, next);
    needsRedraw = true;
    syncUI();
    runner.draw();
  }
  if (els.btnBroken) els.btnBroken.addEventListener("click", () => applyPreset(PRESETS.broken));
  if (els.btnClassic) els.btnClassic.addEventListener("click", () => applyPreset(PRESETS.classic));
  if (els.btnLever) els.btnLever.addEventListener("click", () => applyPreset(PRESETS.lever));

  for (const b of els.themeBtns) {
    b.addEventListener("click", () => {
      state.theme = b.dataset.heroTheme;
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }

  // 四角注记按钮点击：高亮对应维度
  for (const key of ["focus", "direction", "stability", "tension"]) {
    const box = els.cornerBoxes[key];
    if (box) {
      box.addEventListener("click", () => {
        state.highlight = state.highlight === key ? null : key;
        needsRedraw = true;
        syncUI();
        runner.draw();
      });
    }
  }

  // 底带原海报三枚白框图解点击：智能演示或修正对应维度（若已错则修正该项；若已对则故意压测该项！）
  for (const card of els.miniCards) {
    card.addEventListener("click", () => {
      const k = card.dataset.miniCard;
      const ev = evaluate(state);
      state.highlight = k;
      if (k === "focus") {
        if (!ev.focusOk) {
          state.core = { u: 0.5, v: state.hubY };
          state.coreScale = 0.22;
          state.clutter.forEach((c) => (c.active = false));
          for (const ak of ["N", "S", "W", "E"]) {
            if (state.nodes[ak].active && state.nodes[ak].r < LIMITS.nodeInnerMin) state.nodes[ak].r = 0.58;
          }
        } else {
          // 已达标再点：故意压测「核膨吞臂」
          state.coreScale = 0.36;
        }
      } else if (k === "direction") {
        if (!ev.directionOk) {
          state.reach = 0.96;
          for (const ak of ["N", "S", "W", "E"]) {
            if (state.nodes[ak].active) state.nodes[ak].r = clamp(state.nodes[ak].r, 0.54, 0.72);
          }
          if (ev.activeCount < 2) {
            state.nodes.W.active = true;
            state.nodes.E.active = true;
          }
        } else {
          // 已达标再点：故意压测「短截孤号」
          state.reach = 0.48;
        }
      } else if (k === "tension") {
        if (!ev.tensionOk) {
          state.angle = 0;
          state.nodes.W = { active: true, r: 0.48, w: 1.32 };
          state.nodes.E = { active: true, r: 0.76, w: 0.84 };
          state.nodes.N = { active: true, r: 0.54, w: 0.90 };
          state.nodes.S = { active: true, r: 0.66, w: 1.05 };
        } else {
          // 已达标再点：故意压测「单臂倾覆」
          state.nodes.W.active = false;
          state.nodes.S.active = false;
          state.nodes.E = { active: true, r: 0.82, w: 1.45 };
        }
      }
      needsRedraw = true;
      syncUI();
      runner.draw();
    });
  }

  new ResizeObserver(() => {
    resize();
    runner.draw();
  }).observe(canvas);

  resize();
  syncUI();
  const runner = loop(canvas, render);
  runner.draw();

  return { state, evaluate: () => evaluate(state), syncUI, draw: () => runner.draw() };
}
