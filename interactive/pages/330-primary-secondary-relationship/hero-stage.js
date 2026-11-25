// 330 主宾关系构图 · 开场主宾星轨 2D 开放画布
// 无框融纸绘于 #E7E3E0 暖麻原纸之上，支持：
//   1. 横拖画布空白区连续推拉主宾体量反差（兼容 perf.mjs data-perf-drag 水平触摸测试）
//   2. 直接拖动主体 / 次要元素 / 细节点缀重排位置
//   3. 点击画布红标一步纠偏，或点选任意圆切换精调层级
//   4. 切换原海报三圆 / 宋画群峰 / 展讯海报三题材，始终读 model.js 单一真源

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  MEDIUMS,
  TIER_KEYS,
  TIER_META,
  clamp,
  evaluate,
  applyContrastDrag,
  fixTopIssue,
} from "./model.js";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function quadPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function mountHeroStage(canvas, state, { onChange }) {
  const ctx = canvas.getContext("2d");
  let cssW = 760;
  let cssH = 470;
  let lastReport = evaluate(state, cssW, cssH);
  let intro = reducedMotion.matches ? 1 : 0;
  let phase = 0;

  // 指针交互状态
  let dragMode = null; // null | "node" | "contrast"
  let dragTier = null;
  let dragMoved = false;
  let startX = 0;
  let startY = 0;
  let prevX = 0;
  let prevY = 0;
  let conflictHitBox = null;
  let hoverTarget = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = pixelRatio(2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    lastReport = evaluate(state, cssW, cssH);
  }

  function pointerCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function hitTestNode(x, y, report) {
    // 从小到大优先命中，避免细节点缀被大圆吞掉点击
    const order = ["detail", "secondary", "primary"];
    for (const k of order) {
      const n = report.nodes[k];
      const hitR = Math.max(n.R, 22);
      if (Math.hypot(x - n.x, y - n.y) <= hitR) return k;
    }
    return null;
  }

  function hitConflictBox(x, y) {
    if (!conflictHitBox) return false;
    const b = conflictHitBox;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  // ---------- 辅助绘制 ----------
  function drawCornerTicks(w, h) {
    const pad = 10;
    const len = 12;
    ctx.save();
    ctx.strokeStyle = "rgba(18, 35, 61, 0.22)";
    ctx.lineWidth = 1;
    const corners = [
      [pad, pad, 1, 1],
      [w - pad, pad, -1, 1],
      [pad, h - pad, 1, -1],
      [w - pad, h - pad, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * len, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMoatRing(P, report, reveal) {
    if (!state.showMoat) return;
    const moatR = P.R * (1.16 + 0.04 * reveal);
    const crowded = report.issues.some((i) => i.code === "crowded_collide" || i.code === "host_choked");
    ctx.save();
    ctx.beginPath();
    ctx.arc(P.x, P.y, moatR, 0, Math.PI * 2);
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = crowded ? "rgba(184, 33, 18, 0.45)" : "rgba(18, 35, 61, 0.16)";
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbitArc(report, reveal, tPhase, isStill) {
    if (!state.showOrbit) return;
    const { primary: P, secondary: S, detail: D } = report.nodes;
    const { start, ctrl, tail } = report.orbit;
    const broken = report.issues.some((i) => i.code === "arc_broken" || i.code === "crowded_collide");
    const clash = report.tiedTop || report.issues.some((i) => i.code === "color_clash");

    ctx.save();
    ctx.lineCap = "round";

    // 主虚线弧：起笔 → 次要元素 → 弧底 → 细节点缀 → 末梢
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(
      (start.x + S.x) * 0.5 - (S.x <= P.x ? 8 : -8),
      (start.y + S.y) * 0.5,
      S.x,
      S.y
    );
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, D.x, D.y);
    ctx.lineTo(tail.x, tail.y);

    ctx.setLineDash(broken ? [4, 9] : [7, 7]);
    ctx.lineDashOffset = isStill ? 0 : -tPhase * 12;
    ctx.lineWidth = broken ? 1.8 : 1.5;
    ctx.strokeStyle = broken
      ? "rgba(184, 33, 18, 0.62)"
      : clash
      ? "rgba(157, 20, 16, 0.48)"
      : "rgba(18, 35, 61, 0.68)";
    ctx.stroke();

    // 视线游动脉冲点：秩序成立时从 主 → 宾 → 点 顺流；争焦时在 主 ⇄ 宾 间往返拉锯
    if (!isStill && reveal > 0.6) {
      ctx.setLineDash([]);
      if (clash) {
        const osc = 0.5 + 0.5 * Math.sin(tPhase * 3.4);
        const bx = P.x + (S.x - P.x) * osc;
        const by = P.y + (S.y - P.y) * osc;
        // 双强拉锯虚线
        ctx.beginPath();
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(S.x, S.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(184, 33, 18, 0.42)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.warn;
        ctx.fill();
      } else {
        const u = (tPhase * 0.28) % 1;
        let pt;
        if (u < 0.35) {
          const k = u / 0.35;
          pt = { x: P.x + (S.x - P.x) * k, y: P.y + (S.y - P.y) * k };
        } else {
          const k = (u - 0.35) / 0.65;
          pt = quadPoint(S, ctrl, D, k);
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = report.ok ? PALETTE.ok : PALETTE.ink;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- 题材 1：1:1 原海报三圆 ----------
  function drawPosterMedium(report, reveal) {
    const m = MEDIUMS.poster;
    const { primary: P, secondary: S, detail: D } = report.nodes;
    const compact = report.w < 460;

    // 1. 主体大圆
    const pR = P.R * (0.82 + 0.18 * reveal);
    ctx.save();
    ctx.beginPath();
    ctx.arc(P.x, P.y, pR, 0, Math.PI * 2);
    ctx.fillStyle = P.ink.hex;
    ctx.fill();

    // 选中态外圈微标
    if (state.activeTier === "primary") {
      ctx.beginPath();
      ctx.arc(P.x, P.y, pR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.32)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 圆内字（随圆半径自适应，严格留出行距绝不重影或溢圆）
    ctx.fillStyle = P.ink.textOn;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const titleSz = clamp(pR * 0.29, 14, compact ? 28 : 42);
    const hasSub = pR > 76;
    const hasEn = pR > 44;
    const titleY = hasSub ? P.y - titleSz * 0.42 : hasEn ? P.y - titleSz * 0.22 : P.y;
    ctx.font = `900 ${titleSz}px "Noto Sans SC", sans-serif`;
    ctx.fillText(m.primaryTitle, P.x, titleY);

    if (hasEn) {
      const enSz = clamp(pR * 0.088, 9, 13);
      ctx.font = `600 ${enSz}px "Manrope", sans-serif`;
      ctx.fillStyle = P.ink.id === "ochre" ? "rgba(18,35,61,0.85)" : "rgba(255,249,246,0.92)";
      ctx.fillText(m.primaryEn, P.x, titleY + titleSz * 0.68 + 6);
    }
    if (hasSub) {
      // 原海报细横线
      const ruleY = titleY + titleSz * 0.68 + 20;
      ctx.beginPath();
      ctx.moveTo(P.x - 16, ruleY);
      ctx.lineTo(P.x + 16, ruleY);
      ctx.strokeStyle = P.ink.id === "ochre" ? "rgba(18,35,61,0.45)" : "rgba(255,249,246,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const subSz = clamp(pR * 0.092, 10, 14);
      ctx.font = `400 ${subSz}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = P.ink.id === "ochre" ? "rgba(18,35,61,0.88)" : "rgba(255,249,246,0.9)";
      ctx.fillText(m.primarySub, P.x, ruleY + 18);
    }
    ctx.restore();

    // 2. 次要元素圆
    const sR = S.R * (0.78 + 0.22 * reveal);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S.x, S.y, sR, 0, Math.PI * 2);
    ctx.fillStyle = S.ink.hex;
    ctx.fill();
    if (state.activeTier === "secondary") {
      ctx.beginPath();
      ctx.arc(S.x, S.y, sR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.36)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    // 当次要元素膨胀很大时在圆内轻标「宾」，提示体量越界
    if (sR >= 32) {
      ctx.fillStyle = S.ink.textOn;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${clamp(sR * 0.34, 12, 24)}px "Noto Sans SC", sans-serif`;
      ctx.fillText(S.ink.id === "crimson" ? "争主!" : "次要", S.x, S.y);
    }
    ctx.restore();

    // 3. 细节点缀圆
    const dR = D.R * (0.75 + 0.25 * reveal);
    ctx.save();
    ctx.beginPath();
    ctx.arc(D.x, D.y, dR, 0, Math.PI * 2);
    ctx.fillStyle = D.ink.hex;
    ctx.fill();
    if (state.activeTier === "detail") {
      ctx.beginPath();
      ctx.arc(D.x, D.y, dR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.36)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();

    // 原海报标注：次要元素 & 细节点缀（自动避让边缘）
    drawCalloutLabel(S, m.secondaryTitle, m.secondaryEn, m.secondarySub, "left", report, compact);
    drawCalloutLabel(D, m.detailTitle, m.detailEn, m.detailSub, "right", report, compact);
  }

  function drawCalloutLabel(node, zh, en, sub, preferSide, report, compact) {
    ctx.save();
    if (compact) {
      // 窄屏端把「次要元素」固定锚在左下角、「细节点缀」固定锚在右下角，绝不互相撞字
      const alignLeft = preferSide === "left";
      const lx = alignLeft ? 18 : report.w - 18;
      const ly = report.h - 46;
      ctx.textAlign = alignLeft ? "left" : "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 12px "Noto Sans SC", sans-serif`;
      ctx.fillText(zh, lx, ly);

      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `600 9px "Manrope", sans-serif`;
      ctx.fillText(en, lx, ly + 15);

      const barX = alignLeft ? lx : lx - 16;
      ctx.fillStyle = PALETTE.crimsonDeep;
      ctx.fillRect(barX, ly + 28, 16, 2);
      ctx.restore();
      return;
    }

    const margin = 16;
    const blockW = 132;
    let alignLeft = preferSide === "right";
    let lx;
    if (preferSide === "left") {
      if (node.x - node.R - blockW - 14 > margin) {
        lx = node.x - node.R - 14;
        alignLeft = false;
      } else {
        lx = margin;
        alignLeft = true;
      }
    } else {
      if (node.x + node.R + blockW + 14 < report.w - margin) {
        lx = node.x + node.R + 14;
        alignLeft = true;
      } else {
        lx = report.w - margin;
        alignLeft = false;
      }
    }
    const belowFallback =
      (preferSide === "left" && node.x - node.R - blockW - 14 <= margin) ||
      (preferSide === "right" && node.x + node.R + blockW + 14 >= report.w - margin);
    const ly = belowFallback
      ? clamp(node.y + node.R + 14, 28, report.h - 60)
      : clamp(node.y - 16, 28, report.h - 60);

    ctx.textAlign = alignLeft ? "left" : "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 14px "Noto Sans SC", sans-serif`;
    ctx.fillText(zh, lx, ly);

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `600 10px "Manrope", sans-serif`;
    ctx.fillText(en, lx, ly + 19);

    const barX = alignLeft ? lx : lx - 18;
    ctx.fillStyle = PALETTE.crimsonDeep;
    ctx.fillRect(barX, ly + 34, 18, 2);

    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `400 11px "Noto Sans SC", sans-serif`;
    ctx.fillText(sub, lx, ly + 40);
    ctx.restore();
  }

  // ---------- 题材 2：宋画群峰朝揖（纯山水剪影，无人物五官） ----------
  function drawSongMedium(report, reveal) {
    const { primary: P, secondary: S, detail: D } = report.nodes;
    const scale = 0.85 + 0.15 * reveal;

    // 淡淡宣纸远雾带
    ctx.save();
    const fogY = report.h * 0.72;
    const grad = ctx.createLinearGradient(0, fogY - 40, 0, fogY + 55);
    grad.addColorStop(0, "rgba(231, 227, 224, 0)");
    grad.addColorStop(0.5, "rgba(249, 247, 244, 0.65)");
    grad.addColorStop(1, "rgba(231, 227, 224, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, fogY - 40, report.w, 95);

    // 主峰（大山堂堂，随 P.R 与 P.ink 实时变化）
    const pR = P.R * scale;
    ctx.save();
    // 淡淡圆镜框托住主峰范围，使几何包络一目了然
    ctx.beginPath();
    ctx.arc(P.x, P.y, pR, 0, Math.PI * 2);
    ctx.fillStyle = P.ink.id === "crimson" ? "rgba(179, 21, 24, 0.13)" : "rgba(24, 39, 61, 0.12)";
    ctx.fill();
    ctx.strokeStyle = P.ink.hex;
    ctx.lineWidth = state.activeTier === "primary" ? 2 : 1;
    ctx.stroke();

    // 峻拔主峰轮廓
    ctx.beginPath();
    ctx.moveTo(P.x - pR * 0.88, P.y + pR * 0.62);
    ctx.quadraticCurveTo(P.x - pR * 0.45, P.y - pR * 0.2, P.x - pR * 0.08, P.y - pR * 0.82);
    ctx.quadraticCurveTo(P.x + pR * 0.04, P.y - pR * 0.96, P.x + pR * 0.16, P.y - pR * 0.74);
    ctx.quadraticCurveTo(P.x + pR * 0.56, P.y - pR * 0.1, P.x + pR * 0.88, P.y + pR * 0.62);
    ctx.closePath();
    ctx.fillStyle = P.ink.hex;
    ctx.fill();

    // 山脊阳面折线
    ctx.beginPath();
    ctx.moveTo(P.x + pR * 0.02, P.y - pR * 0.86);
    ctx.lineTo(P.x - pR * 0.14, P.y - pR * 0.15);
    ctx.lineTo(P.x + pR * 0.12, P.y + pR * 0.55);
    ctx.strokeStyle = "rgba(249, 247, 244, 0.42)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 题款红印「主」
    if (pR > 40) {
      ctx.fillStyle = "#FFF9F6";
      ctx.font = `400 ${clamp(pR * 0.28, 16, 30)}px "Ma Shan Zheng", "Noto Sans SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("主", P.x, P.y + pR * 0.18);
    }
    ctx.restore();

    // 辅岭（倾斜朝向主峰）
    const sR = S.R * scale;
    const tilt = S.x < P.x ? 1 : -1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(S.x - sR * 1.15, S.y + sR * 0.55);
    ctx.quadraticCurveTo(S.x + tilt * sR * 0.25, S.y - sR * 0.95, S.x + sR * 1.1, S.y + sR * 0.55);
    ctx.closePath();
    ctx.fillStyle = S.ink.hex;
    ctx.fill();
    if (state.activeTier === "secondary") {
      ctx.beginPath();
      ctx.arc(S.x, S.y, sR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("辅岭 · 宾", S.x, S.y + sR * 0.55 + 16);
    ctx.restore();

    // 孤舟点景（纯船影，无人物五官）
    const dR = Math.max(11, D.R * scale);
    ctx.save();
    ctx.fillStyle = D.ink.hex;
    // 舟身弧
    ctx.beginPath();
    ctx.moveTo(D.x - dR * 1.25, D.y);
    ctx.quadraticCurveTo(D.x, D.y + dR * 0.72, D.x + dR * 1.25, D.y);
    ctx.lineTo(D.x + dR * 0.95, D.y + dR * 0.18);
    ctx.quadraticCurveTo(D.x, D.y + dR * 0.42, D.x - dR * 0.95, D.y + dR * 0.18);
    ctx.closePath();
    ctx.fill();
    // 篷顶剪影
    ctx.beginPath();
    ctx.arc(D.x - dR * 0.1, D.y, dR * 0.42, Math.PI, 0);
    ctx.fill();
    // 水波细线
    ctx.beginPath();
    ctx.moveTo(D.x - dR * 1.5, D.y + dR * 0.55);
    ctx.lineTo(D.x + dR * 1.4, D.y + dR * 0.55);
    ctx.strokeStyle = "rgba(18, 35, 61, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (state.activeTier === "detail") {
      ctx.beginPath();
      ctx.arc(D.x, D.y, dR + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("孤舟 · 点", D.x, D.y + dR + 14);
    ctx.restore();

    ctx.restore();
  }

  // ---------- 题材 3：现代展讯海报 ----------
  function drawExhibitMedium(report, reveal) {
    const m = MEDIUMS.exhibit;
    const { primary: P, secondary: S, detail: D } = report.nodes;
    const scale = 0.85 + 0.15 * reveal;

    // 纸内微弱排印参考线
    ctx.save();
    ctx.strokeStyle = "rgba(18, 35, 61, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, report.w - 36, report.h - 36);

    // 主体：主视觉陶碗圆印海报核
    const pR = P.R * scale;
    ctx.beginPath();
    ctx.arc(P.x, P.y, pR, 0, Math.PI * 2);
    ctx.fillStyle = P.ink.hex;
    ctx.fill();
    if (state.activeTier === "primary") {
      ctx.beginPath();
      ctx.arc(P.x, P.y, pR + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(18, 35, 61, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // 简约器物轮廓剪影（无人物）
    ctx.fillStyle = P.ink.textOn;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hSz = clamp(pR * 0.29, 13, 36);
    ctx.font = `900 ${hSz}px "Noto Sans SC", sans-serif`;
    ctx.fillText(m.primaryTitle, P.x, P.y - hSz * 0.25);
    if (pR > 46) {
      ctx.font = `600 ${clamp(pR * 0.085, 9, 12)}px "Manrope", sans-serif`;
      ctx.fillText(m.primaryEn, P.x, P.y + hSz * 0.42);
    }

    // 次要元素：展期信息方笺（面积等同 π S.R²，保证与圆面积单真源一致！）
    const sSide = Math.sqrt(Math.PI) * S.R * scale;
    const sW = sSide * 1.25;
    const sH = sSide / 1.25;
    ctx.fillStyle = S.ink.hex;
    ctx.fillRect(S.x - sW / 2, S.y - sH / 2, sW, sH);
    if (state.activeTier === "secondary") {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(S.x - sW / 2 - 4, S.y - sH / 2 - 4, sW + 8, sH + 8);
    }
    ctx.fillStyle = S.ink.textOn;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${clamp(sH * 0.24, 10, 18)}px "Space Mono", monospace`;
    ctx.fillText(m.secondaryTitle, S.x, S.y - sH * 0.14);
    if (sH > 40) {
      ctx.font = `400 ${clamp(sH * 0.17, 9, 12)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("东馆三厅", S.x, S.y + sH * 0.2);
    }

    // 细节点缀：方形小印章（面积等同 π D.R²）
    const dSide = Math.max(16, Math.sqrt(Math.PI) * D.R * scale);
    ctx.fillStyle = D.ink.hex;
    ctx.fillRect(D.x - dSide / 2, D.y - dSide / 2, dSide, dSide);
    if (state.activeTier === "detail") {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(D.x - dSide / 2 - 4, D.y - dSide / 2 - 4, dSide + 8, dSide + 8);
    }
    ctx.fillStyle = D.ink.textOn;
    ctx.font = `700 ${clamp(dSide * 0.42, 9, 14)}px "Noto Sans SC", sans-serif`;
    ctx.fillText("展", D.x, D.y + 1);
    ctx.restore();
  }

  // ---------- 冲突就地标签（可点一步纠偏） ----------
  function drawConflictPill(report) {
    conflictHitBox = null;
    if (report.ok || !report.issues.length) return;
    const top = report.issues[0];
    const targetNode = report.nodes[top.target] || report.nodes.secondary;
    const label = top.tag;

    ctx.save();
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(label).width;
    const pw = tw + 22;
    const ph = 28;
    const px = clamp(targetNode.x - pw / 2, 12, report.w - pw - 12);
    const py = clamp(targetNode.y - targetNode.R - ph - 12, 12, report.h - ph - 12);

    ctx.fillStyle = "#12233D";
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 4);
    ctx.fill();
    ctx.strokeStyle = "#F37678";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#FFF8F5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px + pw / 2, py + ph / 2 + 0.5);
    ctx.restore();

    conflictHitBox = { x: px, y: py, w: pw, h: ph };
  }

  // ---------- 主帧绘制 ----------
  function render(t, dt, { still }) {
    resize();
    if (still) {
      intro = 1;
    } else {
      intro = Math.min(1, intro + dt * 1.45);
      phase += dt;
    }
    const reveal = easeOutCubic(intro);
    const report = evaluate(state, cssW, cssH);
    lastReport = report;

    const dpr = pixelRatio(2);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 直接铺满原海报暖麻展纸色（无黑框）
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极轻的纸面四角定位短线
    drawCornerTicks(cssW, cssH);

    // 左上角轻印实况读数条（纯几何单真源）
    ctx.save();
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = "rgba(18, 35, 61, 0.72)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hud = `1:2 ${report.ratioPS.toFixed(1)}× · 2:3 ${report.ratioSD.toFixed(1)}× · ${report.gazeOrder}`;
    ctx.fillText(hud, 24, 18);
    ctx.restore();

    drawMoatRing(report.nodes.primary, report, reveal);
    drawOrbitArc(report, reveal, phase, still);

    if (state.medium === "song") {
      drawSongMedium(report, reveal);
    } else if (state.medium === "exhibit") {
      drawExhibitMedium(report, reveal);
    } else {
      drawPosterMedium(report, reveal);
    }

    drawConflictPill(report);
    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  // ---------- 指针与触摸交互（触屏保留纵向滚动，水平与点拖元素走画布） ----------
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const pt = pointerCoords(e);
    startX = prevX = pt.x;
    startY = prevY = pt.y;
    dragMoved = false;

    if (hitConflictBox(pt.x, pt.y)) {
      dragMode = "conflict";
      return;
    }
    const hit = hitTestNode(pt.x, pt.y, lastReport);
    if (hit) {
      dragMode = "node";
      dragTier = hit;
      state.activeTier = hit;
      if (canvas.setPointerCapture && e.pointerId !== undefined) {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
      onChange(evaluate(state, cssW, cssH));
      ctrl.draw();
    } else {
      dragMode = "contrast";
      if (canvas.setPointerCapture && e.pointerId !== undefined) {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
      }
    }
  }

  function onMove(e) {
    const pt = pointerCoords(e);
    if (!dragMode) {
      const overPill = hitConflictBox(pt.x, pt.y);
      const overNode = hitTestNode(pt.x, pt.y, lastReport);
      const nextHover = overPill ? "pointer" : overNode ? "grab" : "ew-resize";
      if (hoverTarget !== nextHover) {
        hoverTarget = nextHover;
        canvas.style.cursor = nextHover;
      }
      return;
    }

    const dx = pt.x - prevX;
    const dy = pt.y - prevY;
    if (Math.hypot(pt.x - startX, pt.y - startY) > 4) dragMoved = true;

    if (dragMode === "node" && dragTier) {
      if (e.cancelable) e.preventDefault();
      const node = state[dragTier];
      node.u = clamp(node.u + dx / Math.max(1, cssW), 0.06, 0.94);
      node.v = clamp(node.v + dy / Math.max(1, cssH), 0.08, 0.92);
      prevX = pt.x;
      prevY = pt.y;
      onChange(evaluate(state, cssW, cssH));
      ctrl.draw();
    } else if (dragMode === "contrast") {
      // 仅取横向拖动驱动主宾反差，纵向手势留给页面自然滚动
      if (Math.abs(pt.x - startX) >= Math.abs(pt.y - startY) * 0.65 || !e.touches) {
        if (e.cancelable) e.preventDefault();
        applyContrastDrag(state, dx / Math.max(140, cssW * 0.72));
        prevX = pt.x;
        prevY = pt.y;
        onChange(evaluate(state, cssW, cssH));
        ctrl.draw();
      }
    }
  }

  function onUp(e) {
    if (dragMode === "conflict" && !dragMoved) {
      fixTopIssue(state, lastReport);
      onChange(evaluate(state, cssW, cssH));
      ctrl.draw();
    }
    if (canvas.releasePointerCapture && e.pointerId !== undefined) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    dragMode = null;
    dragTier = null;
  }

  // 同时监听 Pointer 与 Touch（确保 perf.mjs 的 Input.dispatchTouchEvent 顺滑触发重绘）
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const pt = pointerCoords(e);
      startX = prevX = pt.x;
      startY = prevY = pt.y;
      dragMoved = false;
      if (hitConflictBox(pt.x, pt.y)) {
        dragMode = "conflict";
        return;
      }
      const hit = hitTestNode(pt.x, pt.y, lastReport);
      if (hit) {
        dragMode = "node";
        dragTier = hit;
        state.activeTier = hit;
      } else {
        dragMode = "contrast";
      }
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || !dragMode) return;
      onMove(e);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => {
    if (dragMode === "conflict" && !dragMoved) {
      fixTopIssue(state, lastReport);
      onChange(evaluate(state, cssW, cssH));
      ctrl.draw();
    }
    dragMode = null;
    dragTier = null;
  });

  // 键盘精细操控（方向键微调选中圆位置，[ / ] 调半径，1/2/3 切层）
  canvas.addEventListener("keydown", (e) => {
    const key = e.key;
    const node = state[state.activeTier];
    const meta = TIER_META[state.activeTier];
    let handled = true;
    if (key === "ArrowLeft") node.u = clamp(node.u - 0.025, 0.06, 0.94);
    else if (key === "ArrowRight") node.u = clamp(node.u + 0.025, 0.06, 0.94);
    else if (key === "ArrowUp") node.v = clamp(node.v - 0.025, 0.08, 0.92);
    else if (key === "ArrowDown") node.v = clamp(node.v + 0.025, 0.08, 0.92);
    else if (key === "]" || key === "+" || key === "=") node.r = clamp(node.r + 0.018, meta.minR, meta.maxR);
    else if (key === "[" || key === "-") node.r = clamp(node.r - 0.018, meta.minR, meta.maxR);
    else if (key === "1") state.activeTier = "primary";
    else if (key === "2") state.activeTier = "secondary";
    else if (key === "3") state.activeTier = "detail";
    else handled = false;

    if (handled) {
      e.preventDefault();
      onChange(evaluate(state, cssW, cssH));
      ctrl.draw();
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
    onChange(evaluate(state, cssW, cssH));
  });
  ro.observe(canvas);

  resize();
  ctrl.draw();

  return {
    sync() {
      resize();
      ctrl.draw();
      return evaluate(state, cssW, cssH);
    },
    getReport() {
      return evaluate(state, cssW, cssH);
    },
  };
}

// 1:1 复刻原海报暖砂长笺右侧的动态微缩示意图：[虚线方框内的主体圆] → [次要圆 / 细节点缀]
export function renderMiniSchematic(svgEl, report) {
  if (!svgEl) return;
  const { primary: P, secondary: S, detail: D } = report.nodes;
  // 按真实半径比例映射进 116×58 视窗，直观反馈当前体量与颜色
  const scale = 19 / Math.max(0.24, Math.max(P.r, S.r, 0.24));
  const rP = clamp(P.r * scale, 6, 20);
  const rS = clamp(S.r * scale, 3.2, 16);
  const rD = clamp(D.r * scale, 2.2, 11);

  const pCircle = svgEl.querySelector('[data-mini="primary"]');
  const sCircle = svgEl.querySelector('[data-mini="secondary"]');
  const dCircle = svgEl.querySelector('[data-mini="detail"]');
  const arrow = svgEl.querySelector('[data-mini="arrow"]');
  if (pCircle) {
    pCircle.setAttribute("r", rP.toFixed(1));
    pCircle.setAttribute("fill", P.ink.hex);
  }
  if (sCircle) {
    sCircle.setAttribute("r", rS.toFixed(1));
    sCircle.setAttribute("fill", S.ink.hex);
  }
  if (dCircle) {
    dCircle.setAttribute("r", rD.toFixed(1));
    dCircle.setAttribute("fill", D.ink.hex);
  }
  if (arrow) {
    arrow.setAttribute("stroke", report.ok ? PALETTE.ink : PALETTE.warn);
  }
}
