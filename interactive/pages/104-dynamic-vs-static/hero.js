// 104 动静对比 —— 开场「动静九宫破格台」渲染与交互
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  EMPIRICAL,
  TILE_SHARDS,
  computeStageMetrics,
  createAllStaticState,
  createInitialHeroState,
  diagnoseHero,
  pointToPolar,
  polarToOrb,
} from "./model.js";

const COLORS = {
  bg: "#010833",
  gridStroke: "rgba(112, 199, 171, 0.22)",
  mint: "#70C7AB",
  mintOrb: "#76CEB3",
  mintHi: "#94E4CA",
  ivory: "#EEECE1",
  orange: "#EB5F33",
  orangeHi: "#FF7B54",
  warn: "#F4C453",
  dimText: "rgba(214, 232, 230, 0.78)",
};

export function initHero() {
  const stageEl = document.getElementById("hero-stage");
  const canvas = document.getElementById("hero-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const handle = document.getElementById("orb-handle");
  const orbTag = document.getElementById("orb-tag");
  const titleDyn = document.getElementById("title-dyn");

  const miniGrid = document.getElementById("mini-grid");
  const miniCells = [...miniGrid.querySelectorAll(".mcell")];
  const dockRatioTag = document.getElementById("dock-ratio-tag");
  const btnReset = document.getElementById("btn-reset-chaos");
  const btnStatic = document.getElementById("btn-all-static");
  const btnPause = document.getElementById("btn-pause");

  const chkRatio = document.getElementById("chk-ratio");
  const chkAngle = document.getElementById("chk-angle");
  const chkReach = document.getElementById("chk-reach");
  const valRatio = document.getElementById("val-ratio");
  const valAngle = document.getElementById("val-angle");
  const valReach = document.getElementById("val-reach");

  const badgeEl = document.getElementById("hero-badge");
  const diagTitle = document.getElementById("hero-diag-title");
  const diagText = document.getElementById("hero-diag-text");

  let state = createInitialHeroState();
  let diagCache = diagnoseHero(state);
  let metrics = computeStageMetrics(800, 460);
  let dragging = false;
  let dragRect = null;
  let domDirty = false;
  let lastHandleKey = "";
  let lastHandleSize = 0;

  // 平滑动画插值值，保证拖拽和切换时手感和 0.9s 截屏一样利落
  const anim = {
    angle: state.angle,
    reach: state.reach,
    tileOut: state.tiles.map((v) => (v ? 1 : 0)),
  };

  function resize() {
    const r = stageEl.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(220, Math.round(r.height));
    // 手机小屏像素比限 1.5（GUIDE.md 性能建议），桌面保持最高 2
    const dpr = pixelRatio(w < 700 ? 1.5 : 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    metrics = computeStageMetrics(w, h);
    lastHandleKey = "";
    syncHandlePosition();
  }

  function syncHandlePosition() {
    const dynCount = diagCache.dynamicCount;
    const pos = polarToOrb(metrics, anim.angle, anim.reach);
    const xStr = pos.x.toFixed(1);
    const yStr = pos.y.toFixed(1);
    const size = Math.max(54, Math.min(82, Math.round(metrics.orbR * 2.05)));
    const tagText = dynCount === 0 ? "全静" : `${Math.round(state.angle)}°`;
    const key = `${xStr}|${yStr}|${size}|${dynCount === 0 ? 1 : 0}|${tagText}`;
    if (key === lastHandleKey) return;
    lastHandleKey = key;
    handle.style.transform = `translate3d(${xStr}px, ${yStr}px, 0) translate(-50%, -50%)`;
    if (size !== lastHandleSize) {
      lastHandleSize = size;
      handle.style.width = `${size}px`;
      handle.style.height = `${size}px`;
    }
    handle.classList.toggle("is-dormant", dynCount === 0);
    if (orbTag.textContent !== tagText) orbTag.textContent = tagText;
  }

  let lastTilesKey = "";
  let lastDiagKey = "";
  let lastTitleCode = "";

  function syncDOM() {
    domDirty = false;
    const d = diagnoseHero(state);
    diagCache = d;

    const tilesKey = `${state.tiles.map((v) => (v ? 1 : 0)).join("")}|${state.paused ? 1 : 0}`;
    if (tilesKey !== lastTilesKey) {
      lastTilesKey = tilesKey;
      miniCells.forEach((btn, i) => {
        const isDyn = state.tiles[i];
        btn.setAttribute("aria-pressed", String(isDyn));
        btn.textContent = isDyn ? "动" : "静";
      });
      dockRatioTag.textContent = `静 ${d.staticCount} / 9`;
      btnPause.setAttribute("aria-pressed", String(state.paused));
      btnPause.textContent = state.paused ? "恢复流动" : "暂停流动";
    }

    if (titleDyn && d.code !== lastTitleCode) {
      lastTitleCode = d.code;
      if (d.dynamicCount === 0) {
        titleDyn.style.setProperty("--dyn-rot", "0deg");
        titleDyn.style.setProperty("--dyn-x", "0px");
        titleDyn.style.setProperty("--dyn-y", "0px");
      } else if (d.code === "balanced") {
        titleDyn.style.setProperty("--dyn-rot", "-5deg");
        titleDyn.style.setProperty("--dyn-x", "2px");
        titleDyn.style.setProperty("--dyn-y", "-2px");
      } else if (d.dynamicCount >= 4) {
        titleDyn.style.setProperty("--dyn-rot", "-9deg");
        titleDyn.style.setProperty("--dyn-x", "4px");
        titleDyn.style.setProperty("--dyn-y", "-3px");
      } else {
        titleDyn.style.setProperty("--dyn-rot", "-3deg");
        titleDyn.style.setProperty("--dyn-x", "1px");
        titleDyn.style.setProperty("--dyn-y", "-1px");
      }
    }

    const diagKey = `${d.code}|${d.angleDeg}|${d.reachPct}|${d.staticCount}`;
    if (diagKey !== lastDiagKey) {
      lastDiagKey = diagKey;
      const setChk = (el, ok) => {
        el.classList.toggle("is-ok", ok);
        const mark = el.querySelector(".chk-mark");
        if (mark) mark.textContent = ok ? "✓" : "×";
      };
      setChk(chkRatio, d.okRatio);
      setChk(chkAngle, d.okAngle);
      setChk(chkReach, d.okReach);

      valRatio.textContent = `${d.staticPct}%（${d.staticCount}/9）`;
      valAngle.textContent = d.dynamicCount === 0 ? "无破格" : `${d.angleDeg}°（${EMPIRICAL.angleMin}°–${EMPIRICAL.angleMax}°）`;
      valReach.textContent = d.dynamicCount === 0 ? "0%" : `${d.reachPct}%（48%–86%）`;

      badgeEl.dataset.level = d.level;
      badgeEl.textContent = d.badge;
      diagTitle.textContent = d.headline;
      diagText.textContent = d.reason;
    }

    syncHandlePosition();
  }

  // 绘制圆点引注线（支持水平直连或单折肘线，确保始终精确指在真实主体上）
  function drawLeader(x1, y1, x2, y2, align, title, line1, line2, active) {
    ctx.save();
    const lineCol = active ? COLORS.ivory : "rgba(240, 239, 230, 0.36)";
    const titleCol = active ? COLORS.mintHi : "rgba(148, 228, 202, 0.56)";
    const bodyCol = active ? "#E2ECEA" : "rgba(210, 224, 224, 0.56)";

    ctx.strokeStyle = lineCol;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (Math.abs(y2 - y1) > 8) {
      const kneeX = align === "left" ? Math.min(x2 - 22, x1 + Math.abs(y2 - y1) * 0.45) : Math.max(x2 + 22, x1 - Math.abs(y2 - y1) * 0.45);
      ctx.lineTo(kneeX, y2);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = active ? COLORS.ivory : COLORS.orangeHi;
    ctx.beginPath();
    ctx.arc(x1, y1, 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = align;
    const tx = align === "right" ? x2 - 10 : x2 + 10;
    ctx.font = `700 15px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = titleCol;
    ctx.fillText(title, tx, y2 + 5);

    ctx.font = `400 12px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = bodyCol;
    ctx.fillText(line1, tx, y2 + 24);
    ctx.fillText(line2, tx, y2 + 41);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (domDirty) syncDOM();
    const m = metrics;
    const d = diagCache;
    const frozen = still || state.paused;
    const phase = frozen ? 0.35 : t;

    // 缓动步进；still 或拖动中直接到位
    const k = still || dragging ? 1 : Math.min(1, dt * 14);
    anim.angle += (state.angle - anim.angle) * k;
    anim.reach += (state.reach - anim.reach) * k;
    const tk = still ? 1 : Math.min(1, dt * 12);
    for (let i = 0; i < 9; i++) {
      const target = state.tiles[i] ? 1 : 0;
      const diff = target - anim.tileOut[i];
      anim.tileOut[i] = Math.abs(diff) < 0.004 ? target : anim.tileOut[i] + diff * tk;
    }

    syncHandlePosition();

    // 1. 纯深靛夜蓝底（严格忠实于 104 原海报哑光深蓝底面，零多余全屏过绘）
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, m.W, m.H);

    // 画框安全区细参考框（冲撞边缘时亮橘红提示）
    const framePad = 12;
    ctx.strokeStyle = d.code === "edge-crash" ? COLORS.orangeHi : "rgba(112, 199, 171, 0.16)";
    ctx.lineWidth = d.code === "edge-crash" ? 2 : 1;
    ctx.strokeRect(framePad, framePad, m.W - framePad * 2, m.H - framePad * 2);

    // 2. 经验斜角舒适带（30°–60° 微弱扇面标尺）
    if (d.dynamicCount > 0) {
      const rArc = m.rMax * 0.86;
      const a1 = (-EMPIRICAL.angleMax * Math.PI) / 180;
      const a2 = (-EMPIRICAL.angleMin * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(m.pivotX, m.pivotY);
      ctx.arc(m.pivotX, m.pivotY, rArc, a1, a2, false);
      ctx.closePath();
      ctx.fillStyle = d.okAngle ? "rgba(112, 199, 171, 0.08)" : "rgba(235, 95, 51, 0.06)";
      ctx.fill();

      ctx.strokeStyle = d.okAngle ? "rgba(112, 199, 171, 0.30)" : "rgba(244, 196, 83, 0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      for (const deg of [EMPIRICAL.angleMin, EMPIRICAL.angleMax]) {
        const rad = (deg * Math.PI) / 180;
        ctx.moveTo(m.pivotX, m.pivotY);
        ctx.lineTo(m.pivotX + Math.cos(rad) * rArc, m.pivotY - Math.sin(rad) * rArc);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. 暗场薄荷虚线张力环（原海报标志图形：「空间张力」）
    ctx.beginPath();
    ctx.arc(m.ghostX, m.ghostY, m.ghostR, 0, Math.PI * 2);
    ctx.strokeStyle = d.callouts.tension ? COLORS.mintHi : "rgba(112, 199, 171, 0.36)";
    ctx.lineWidth = d.callouts.tension ? 1.8 : 1.2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = frozen ? 0 : -phase * 14;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // 4. 3×3 静态薄荷绿方格阵列（合批绘制虚线空槽与实心方砖，减少绘图调用）
    ctx.strokeStyle = "rgba(112, 199, 171, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      if (anim.tileOut[i] <= 0.05) continue;
      const x = m.gridX + (i % 3) * (m.cell + m.gap);
      const y = m.gridY + Math.floor(i / 3) * (m.cell + m.gap);
      ctx.rect(x + 1, y + 1, m.cell - 2, m.cell - 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 9; i++) {
      const out = anim.tileOut[i];
      if (out >= 0.98) continue;
      const x = m.gridX + (i % 3) * (m.cell + m.gap);
      const y = m.gridY + Math.floor(i / 3) * (m.cell + m.gap);
      if (out > 0.01) ctx.globalAlpha = 1 - out;
      ctx.fillStyle = COLORS.mint;
      ctx.fillRect(x, y, m.cell, m.cell);
      ctx.fillStyle = "rgba(240, 239, 230, 0.22)";
      ctx.fillRect(x, y, m.cell, 2);
      if (out > 0.01) ctx.globalAlpha = 1;
    }

    // 5. 多余破格方块的冲突散飞碎片
    const activeIndices = [];
    for (let i = 0; i < 9; i++) if (anim.tileOut[i] > 0.05) activeIndices.push(i);

    if (activeIndices.length >= 2) {
      const extras = activeIndices.slice(1);
      for (const idx of extras) {
        const out = anim.tileOut[idx];
        const shard = TILE_SHARDS[idx];
        const ox = m.gridX + (idx % 3) * (m.cell + m.gap) + m.cell * 0.5;
        const oy = m.gridY + Math.floor(idx / 3) * (m.cell + m.gap) + m.cell * 0.5;

        const baseAngle = anim.angle + shard.dAngle * (activeIndices.length >= 3 ? 1.15 : 0.45);
        const rad = (baseAngle * Math.PI) / 180;
        const drift = frozen ? 0 : Math.sin(phase * 2.2 + idx * 1.4) * m.U * 0.015;
        const dist = (m.U * 0.24 * shard.distMul + drift) * out;
        const sx = ox + Math.cos(rad) * dist;
        const sy = oy - Math.sin(rad) * dist;

        ctx.strokeStyle = shard.color === "orange" ? "rgba(235, 95, 51, 0.7)" : "rgba(238, 236, 225, 0.48)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(((-baseAngle + shard.spin * 0.4) * Math.PI) / 180);
        const sz = m.cell * (activeIndices.length >= 4 ? 0.56 : 0.42) * out;
        ctx.fillStyle = shard.color === "orange" ? COLORS.orange : shard.color === "ivory" ? COLORS.ivory : COLORS.mintOrb;
        ctx.globalAlpha = activeIndices.length >= 4 ? 0.88 : 0.72;
        ctx.fillRect(-sz * 0.5, -sz * 0.38, sz, sz * 0.76);
        ctx.restore();
      }
    }

    // 6. 主破格动势：左下流线尾焰 + 象牙锥形光束 + 合批斜向速度线 + 薄荷大圆球 + 橘红发射点
    const orb = polarToOrb(metrics, anim.angle, anim.reach);
    const hasMotion = activeIndices.length > 0;

    if (hasMotion) {
      const dx = orb.x - m.pivotX;
      const dy = orb.y - m.pivotY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      // 6a. 左下弯曲汇入的流线弧
      const tailCurves = [
        { offY: 10, spread: 0.34, color: COLORS.ivory, w: 3.4 },
        { offY: 22, spread: 0.40, color: COLORS.mint, w: 1.6 },
        { offY: 32, spread: 0.30, color: COLORS.orange, w: 2.0 },
        { offY: -6, spread: 0.28, color: "rgba(112, 199, 171, 0.55)", w: 1.1 },
      ];
      for (const c of tailCurves) {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = c.w;
        ctx.beginPath();
        const startX = m.pivotX - m.U * c.spread;
        const startY = m.pivotY + c.offY;
        const ctrlX = m.pivotX - m.U * (c.spread * 0.38);
        const ctrlY = m.pivotY + c.offY * 0.9;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, m.pivotX - ux * m.pivotR * 0.6, m.pivotY - uy * m.pivotR * 0.6);
        ctx.stroke();
      }

      // 6b. 平行速度线束按三色合批绘制（3 次 stroke 代替 16 次）
      const streakCount = 8 + Math.round(anim.reach * 6);
      const groups = [
        { color: "rgba(238, 236, 225, 0.72)", width: 1.15, segs: [] },
        { color: COLORS.mint, width: 1.2, segs: [] },
        { color: COLORS.orange, width: 2.2, segs: [] },
      ];
      for (let s = 0; s < streakCount; s++) {
        const lane = ((s % 7) - 3) * (m.orbR * 0.58);
        const travel = frozen ? (s * 0.13) % 1 : ((phase * (0.55 + (s % 3) * 0.22) + s * 0.17) % 1);
        const segStart = len * (0.12 + travel * 0.65);
        const segLen = m.U * (0.14 + (s % 4) * 0.065) * (0.6 + anim.reach * 0.5);
        const x1 = m.pivotX + ux * segStart + nx * lane;
        const y1 = m.pivotY + uy * segStart + ny * lane;
        const gIdx = s % 5 === 0 ? 2 : s % 3 === 0 ? 1 : 0;
        groups[gIdx].segs.push(x1, y1, x1 + ux * segLen, y1 + uy * segLen);
      }
      for (const g of groups) {
        if (!g.segs.length) continue;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = g.width;
        ctx.beginPath();
        for (let i = 0; i < g.segs.length; i += 4) {
          ctx.moveTo(g.segs[i], g.segs[i + 1]);
          ctx.lineTo(g.segs[i + 2], g.segs[i + 3]);
        }
        ctx.stroke();
      }

      // 漂浮薄荷/橘红/象牙小圆点
      const sparks = [
        { along: 0.78, side: -1.45, r: 4.5, col: COLORS.mint },
        { along: 1.05, side: -1.10, r: 5.0, col: COLORS.orange },
        { along: 0.58, side: 1.35, r: 3.5, col: COLORS.ivory },
      ];
      for (const sp of sparks) {
        ctx.fillStyle = sp.col;
        ctx.beginPath();
        ctx.arc(m.pivotX + ux * len * sp.along + nx * m.orbR * sp.side, m.pivotY + uy * len * sp.along + ny * m.orbR * sp.side, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6c. 暖象牙锥形主光束
      const r0 = m.pivotR * 0.42;
      const r1 = m.orbR * 0.78;
      ctx.fillStyle = COLORS.ivory;
      ctx.beginPath();
      ctx.moveTo(m.pivotX + nx * r0, m.pivotY + ny * r0);
      ctx.lineTo(orb.x + nx * r1, orb.y + ny * r1);
      ctx.lineTo(orb.x - nx * r1, orb.y - ny * r1);
      ctx.lineTo(m.pivotX - nx * r0, m.pivotY - ny * r0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(2, 8, 54, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.pivotX, m.pivotY);
      ctx.lineTo(orb.x, orb.y);
      ctx.stroke();

      // 6d. 右上薄荷大圆球
      ctx.fillStyle = COLORS.mintOrb;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, m.orbR, 0, Math.PI * 2);
      ctx.fill();

      if (d.code === "balanced") {
        ctx.strokeStyle = COLORS.ivory;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, m.orbR + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(235, 95, 51, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, m.orbR * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6e. 左下橘红发射支点
    ctx.fillStyle = COLORS.orange;
    ctx.beginPath();
    ctx.arc(m.pivotX, m.pivotY, m.pivotR, 0, Math.PI * 2);
    ctx.fill();

    // 7. 宽屏下绘制原海报四条白点引注（随实时状态明暗呼应）
    if (m.wide) {
      const leftAnchorX = m.gridX + m.cell * 0.35;
      const leftAnchorY = m.gridY + m.cell * 0.5;
      const leftEndX = Math.max(150, m.gridX - m.U * 0.14);
      drawLeader(
        leftAnchorX, leftAnchorY, leftEndX, leftAnchorY,
        "right",
        "稳定的结构",
        "规则 · 均衡 · 秩序",
        "提供视觉支撑",
        d.callouts.structure
      );

      const rightTextX = Math.min(m.W - 168, m.cx + m.U * 0.52);
      const topY = Math.max(54, Math.min(m.H * 0.28, orb.y - 6));
      drawLeader(
        orb.x + m.orbR * 0.72, orb.y - m.orbR * 0.52, rightTextX, topY,
        "left",
        "打破平衡",
        "偏离 · 突破 · 冲击",
        "制造视觉焦点",
        d.callouts.breakout
      );

      const midY = m.cy - m.U * 0.02;
      const midAnchorX = hasMotion ? (m.pivotX + orb.x) * 0.55 + m.U * 0.08 : m.cx + m.U * 0.15;
      const midAnchorY = hasMotion ? (m.pivotY + orb.y) * 0.52 : midY;
      drawLeader(
        midAnchorX, midAnchorY, rightTextX, midY,
        "left",
        "方向与速度",
        "对角线 · 运动轨迹",
        "传递动感与能量",
        d.callouts.velocity
      );

      const botY = Math.min(m.H - 64, m.ghostY + m.U * 0.04);
      drawLeader(
        m.ghostX + m.ghostR * 0.95, m.ghostY, rightTextX, botY,
        "left",
        "空间张力",
        "动静相斥 · 相生",
        "形成强烈对比",
        d.callouts.tension
      );
    }
  }

  const runner = loop(stageEl, render);

  // ---------- 交互绑定 ----------
  function toggleTile(idx) {
    state.tiles[idx] = !state.tiles[idx];
    syncDOM();
    runner.draw();
  }

  // 点击画布上的 3×3 九宫格任意一格
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const m = metrics;
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = m.gridX + col * (m.cell + m.gap);
      const y = m.gridY + row * (m.cell + m.gap);
      if (px >= x - 4 && px <= x + m.cell + 4 && py >= y - 4 && py <= y + m.cell + 4) {
        toggleTile(i);
        return;
      }
    }
  });

  // 下方 3×3 矩阵按钮
  miniCells.forEach((btn, i) => {
    btn.addEventListener("click", () => toggleTile(i));
  });

  // 破格圆球手柄拖拽（缓存包围盒避免 pointermove 强制回流，DOM 与绘制统一合入 rAF 帧）
  function updateFromClient(clientX, clientY) {
    const r = dragRect || stageEl.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    // 如果处于全静态，用户拖动圆球时自动唤醒最靠近右上角的一格破局
    if (state.tiles.every((v) => !v)) {
      state.tiles[2] = true;
    }
    const polar = pointToPolar(metrics, px, py);
    if (polar.angle === state.angle && polar.reach === state.reach) return;
    state.angle = polar.angle;
    state.reach = polar.reach;
    anim.angle = polar.angle;
    anim.reach = polar.reach;
    domDirty = true;
    if (reducedMotion.matches) {
      syncDOM();
      runner.draw();
    }
  }

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragRect = stageEl.getBoundingClientRect();
    e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch {}
    handle.focus({ preventScroll: true });
    updateFromClient(e.clientX, e.clientY);
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateFromClient(e.clientX, e.clientY);
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    dragRect = null;
    if (domDirty) syncDOM();
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // 键盘微调圆球：左右改仰角、上下改冲距
  handle.addEventListener("keydown", (e) => {
    const stepA = e.shiftKey ? 5 : 2;
    const stepR = e.shiftKey ? 0.08 : 0.04;
    let handled = true;
    if (e.key === "ArrowLeft") state.angle = Math.min(84, state.angle + stepA);
    else if (e.key === "ArrowRight") state.angle = Math.max(8, state.angle - stepA);
    else if (e.key === "ArrowUp") state.reach = Math.min(0.96, +(state.reach + stepR).toFixed(2));
    else if (e.key === "ArrowDown") state.reach = Math.max(0.22, +(state.reach - stepR).toFixed(2));
    else handled = false;
    if (handled) {
      e.preventDefault();
      if (state.tiles.every((v) => !v)) state.tiles[2] = true;
      anim.angle = state.angle;
      anim.reach = state.reach;
      syncDOM();
      runner.draw();
    }
  });

  btnReset.addEventListener("click", () => {
    state = createInitialHeroState();
    syncDOM();
    runner.draw();
  });

  btnStatic.addEventListener("click", () => {
    state = createAllStaticState();
    syncDOM();
    runner.draw();
  });

  btnPause.addEventListener("click", () => {
    state.paused = !state.paused;
    syncDOM();
    runner.draw();
  });

  // 窗口缩放重算
  const ro = new ResizeObserver(() => {
    resize();
    runner.draw();
  });
  ro.observe(stageEl);

  resize();
  syncDOM();
  // 首帧立绘，避免任何空白闪烁
  render(0, 0, { still: reducedMotion.matches });
}
