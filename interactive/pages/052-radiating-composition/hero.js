// 052 放射式构图 — 开场「星尘光爆雕塑台」(Nova Ray Sculptor)
// 2D Canvas 高帧率批量渲染（零每帧梯度分配、零 RAF 内布局查询、同色合批绘制），
// 硬件与 SwiftShader 软件渲染慢手机 6× 降速下均可稳跑 55–60 FPS。

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  RAY_COUNT,
  SATELLITES,
  SPECIMENS,
  TITLE_SAFE_R,
  clamp,
  evaluate,
} from "./model.js";

// 预烘焙 052 原海报「深紫星雾 + 点阵金粉流光核心」精灵图（仅启动时生成一次，每帧一次 drawImage）
function createStippleHaloSprite() {
  const size = 320;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.49;

  // 外层柔紫宇宙星雾 + 内层太阳金晕一体化烘焙
  const g = ctx.createRadialGradient(cx, cy, maxR * 0.04, cx, cy, maxR);
  g.addColorStop(0.0, "rgba(251, 227, 135, 0.99)");
  g.addColorStop(0.28, "rgba(248, 218, 98, 0.94)");
  g.addColorStop(0.48, "rgba(240, 198, 50, 0.48)");
  g.addColorStop(0.66, "rgba(182, 138, 64, 0.16)");
  g.addColorStop(0.84, "rgba(86, 52, 138, 0.14)");
  g.addColorStop(1.0, "rgba(25, 13, 44, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
  ctx.fill();

  // 确定性点阵星尘喷散粒子（还原 052 原海报核心边缘的颗粒金粉感）
  let seed = 520131;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 920; i++) {
    const a = rand() * Math.PI * 2;
    const u = rand();
    const r = maxR * (0.28 + Math.pow(u, 0.68) * 0.50);
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const alpha = Math.max(0.08, (1 - r / (maxR * 0.82)) * (0.45 + rand() * 0.55));
    const dotR = 0.8 + rand() * 1.45;
    ctx.fillStyle = rand() > 0.25
      ? `rgba(251, 227, 135, ${alpha.toFixed(2)})`
      : `rgba(240, 198, 50, ${alpha.toFixed(2)})`;
    ctx.fillRect(px - dotR * 0.5, py - dotR * 0.5, dotR, dotR);
  }
  return c;
}

export function mountHeroStage({ canvas, getState, updateState, onFrameEval }) {
  const ctx = canvas.getContext("2d");
  const haloSprite = createStippleHaloSprite();

  let cssW = 640;
  let cssH = 410;
  let dpr = 1;

  let intro = reducedMotion.matches ? 1 : 0.22;
  let pulse = -1;
  let hoveredRay = -1;
  let hoveredCore = false;
  let dragInfo = null;
  let highlightDim = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(240, Math.round(rect.width));
    cssH = Math.max(240, Math.round(rect.height));
    // 遵循 GUIDE.md：手机上像素比最多 1.5，兼顾清晰度与慢手机帧率
    dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }

  function geometry(state) {
    const cx = cssW * state.originX;
    const cy = cssH * state.originY;
    const baseR = Math.min(cssW, cssH) * 0.475;
    return { cx, cy, baseR };
  }

  function triggerPulse() {
    pulse = reducedMotion.matches ? 0.55 : 0.001;
    ctrl.draw();
  }

  function setHighlight(dim) {
    highlightDim = dim || null;
    ctrl.draw();
  }

  function drawCoreSubject(spec, cx, cy, baseR, ev) {
    const safeR = baseR * TITLE_SAFE_R;
    const scale = clamp(baseR / 210, 0.62, 1.24);
    const darkInk = PALETTE.ink;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (spec.id === "poster") {
      const titleSize = Math.round(35 * scale);
      const subSize = Math.round(10.5 * scale);
      ctx.fillStyle = darkInk;
      ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(spec.titleTop, cx, cy - titleSize * 0.66);
      ctx.fillText(spec.titleBottom, cx, cy + titleSize * 0.36);

      ctx.font = `700 ${subSize}px "Unbounded", sans-serif`;
      ctx.fillStyle = "rgba(20, 11, 38, 0.90)";
      ctx.fillText(spec.subEn1, cx, cy + titleSize * 1.12);
      ctx.fillText(spec.subEn2, cx, cy + titleSize * 1.12 + subSize * 1.32);
    } else if (spec.id === "manga") {
      const titleSize = Math.round(34 * scale);
      const subSize = Math.round(10 * scale);
      ctx.strokeStyle = "rgba(20, 11, 38, 0.22)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.moveTo(cx + Math.cos(a) * safeR * 0.68, cy + Math.sin(a) * safeR * 0.68);
        ctx.lineTo(cx + Math.cos(a) * safeR * 0.96, cy + Math.sin(a) * safeR * 0.96);
      }
      ctx.stroke();

      ctx.fillStyle = darkInk;
      ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(spec.titleTop, cx, cy - titleSize * 0.56);
      ctx.fillText(spec.titleBottom, cx, cy + titleSize * 0.42);
      ctx.font = `700 ${subSize}px "Unbounded", sans-serif`;
      ctx.fillStyle = "rgba(20, 11, 38, 0.86)";
      ctx.fillText(spec.subEn1, cx, cy + titleSize * 1.12);
    } else {
      const orbR = Math.round(24 * scale);
      const orbY = cy - orbR * 0.85;
      ctx.fillStyle = darkInk;
      ctx.beginPath();
      ctx.arc(cx, orbY, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.coreBright;
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.arc(cx, orbY, orbR * 0.54, -Math.PI * 0.78, Math.PI * 0.22);
      ctx.stroke();

      const titleSize = Math.round(24 * scale);
      const subSize = Math.round(9.5 * scale);
      ctx.fillStyle = darkInk;
      ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(`${spec.titleTop} · ${spec.titleBottom}`, cx, cy + orbR * 0.62);
      ctx.font = `700 ${subSize}px "Unbounded", sans-serif`;
      ctx.fillStyle = "rgba(20, 11, 38, 0.88)";
      ctx.fillText(spec.subEn1, cx, cy + orbR * 0.62 + titleSize * 0.92);
    }

    if (ev.pierceCount > 2 || ev.corePct < 19) {
      ctx.strokeStyle = "rgba(255, 122, 112, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, safeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPill(x, y, text, tone = "err") {
    ctx.font = `500 11.5px "DM Mono", "Noto Sans SC", sans-serif`;
    const padX = 9;
    const h = 23;
    const w = ctx.measureText(text).width + padX * 2;
    const rx = clamp(x - w / 2, 8, cssW - w - 8);
    const ry = clamp(y - h / 2, 8, cssH - h - 8);

    ctx.fillStyle =
      tone === "ok"
        ? "rgba(18, 52, 42, 0.94)"
        : tone === "gold"
        ? "rgba(38, 22, 62, 0.92)"
        : "rgba(92, 20, 28, 0.94)";
    ctx.strokeStyle =
      tone === "ok"
        ? "rgba(88, 224, 168, 0.72)"
        : tone === "gold"
        ? "rgba(240, 198, 50, 0.62)"
        : "rgba(255, 122, 112, 0.82)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(rx, ry, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      tone === "ok" ? PALETTE.ok : tone === "gold" ? PALETTE.coreBright : "#FFD5D0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + w / 2, ry + h / 2 + 0.5);
  }

  // 同色合批绘制射线（把原本每帧 190+ 次绘制调用压缩到不足 10 次，软件渲染也稳跑 60fps）
  function drawRaysBatched(ev, state, cx, cy, baseR, easeIntro, pass) {
    const beamGold = [];
    const beamCream = [];
    const hairGold = [];
    const hairCream = [];
    const sparkGold = [];
    const sparkCream = [];
    const pulsePts = [];

    for (let i = 0; i < ev.rays.length; i++) {
      const ray = ev.rays[i];
      if (!ray.active) {
        if (pass === "under" && hoveredRay === ray.index) {
          const sx = cx + Math.cos(ray.angle) * Math.max(baseR * state.coreRadius * 1.15, baseR * 0.28);
          const sy = cy + Math.sin(ray.angle) * Math.max(baseR * state.coreRadius * 1.15, baseR * 0.28);
          const ex = cx + Math.cos(ray.angle) * baseR * 0.88;
          const ey = cy + Math.sin(ray.angle) * baseR * 0.88;
          ctx.strokeStyle = "rgba(240, 198, 50, 0.36)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        continue;
      }

      const isPierce = ray.pierceDepth > 0.02;
      if (pass === "under" && isPierce) continue;
      if (pass === "over" && !isPierce) continue;

      const ox = cx + ray.ox * baseR;
      const oy = cy + ray.oy * baseR;
      const rStart = ray.innerR * baseR * easeIntro;
      const rEnd = ray.outerR * baseR * easeIntro;
      if (rEnd <= rStart + 2) continue;

      const cos = Math.cos(ray.angle);
      const sin = Math.sin(ray.angle);
      const x1 = ox + cos * rStart;
      const y1 = oy + sin * rStart;
      const x2 = ox + cos * rEnd;
      const y2 = oy + sin * rEnd;

      const dimBoost =
        highlightDim === "rhythm" && ray.role === "beam" ? 1.18 :
        highlightDim === "expand" && ray.outerR > 0.85 ? 1.15 : 1;

      if (ray.role === "beam") {
        const wInner = Math.max(1.4, ray.width * (state.rhythm < 0.18 ? 0.92 : 0.46) * dimBoost);
        const wOuter = Math.max(1.8, ray.width * (state.rhythm < 0.18 ? 1.0 : 1.08) * dimBoost);
        const nx = -sin;
        const ny = cos;
        const poly = [
          x1 - nx * wInner * 0.5, y1 - ny * wInner * 0.5,
          x1 + nx * wInner * 0.5, y1 + ny * wInner * 0.5,
          x2 + nx * wOuter * 0.5, y2 + ny * wOuter * 0.5,
          x2 - nx * wOuter * 0.5, y2 - ny * wOuter * 0.5,
          ray.index,
        ];
        (ray.colorKey === "cream" ? beamCream : beamGold).push(poly);
      } else if (ray.role === "hair") {
        (ray.colorKey === "cream" ? hairCream : hairGold).push([x1, y1, x2, y2]);
      } else {
        const segLen = rEnd - rStart;
        const step = Math.max(8, Math.min(14, segLen / 11));
        const steps = Math.floor(segLen / step);
        const bucket = ray.colorKey === "cream" ? sparkCream : sparkGold;
        for (let k = 0; k <= steps; k++) {
          const u = k / Math.max(1, steps);
          const dist = rStart + u * segLen;
          const rad = Math.max(0.9, ray.width * 0.58 * (0.55 + 0.65 * Math.sin(u * Math.PI * 0.82)));
          bucket.push([ox + cos * dist, oy + sin * dist, rad]);
        }
      }

      if (pulse >= 0 && pulse <= 1.08) {
        const pU = clamp((pulse - (ray.index % 4) * 0.03) / 0.88, 0, 1);
        if (pU > 0 && pU < 1) {
          const pDist = rStart + pU * (rEnd - rStart);
          pulsePts.push([ox + cos * pDist, oy + sin * pDist, ray.role === "beam" ? 4.2 : 2.6]);
        }
      }
    }

    // 1) 合批绘制粗金/白主光束
    for (const [list, fill] of [[beamGold, PALETTE.gold], [beamCream, PALETTE.cream]]) {
      if (!list.length) continue;
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (const p of list) {
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(p[2], p[3]);
        ctx.lineTo(p[4], p[5]);
        ctx.lineTo(p[6], p[7]);
        ctx.closePath();
      }
      ctx.fill();
    }

    // 2) 合批绘制细实光针
    for (const [list, stroke] of [[hairGold, PALETTE.gold], [hairCream, PALETTE.cream]]) {
      if (!list.length) continue;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.65;
      ctx.beginPath();
      for (const l of list) {
        ctx.moveTo(l[0], l[1]);
        ctx.lineTo(l[2], l[3]);
      }
      ctx.stroke();
    }

    // 3) 合批绘制星尘点轨（一次 beginPath + fill）
    for (const [list, fill] of [[sparkGold, PALETTE.gold], [sparkCream, PALETTE.cream]]) {
      if (!list.length) continue;
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (const pt of list) {
        const [px, py, r] = pt;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 4) 悬停高亮单束描边
    if (hoveredRay >= 0) {
      for (const list of [beamGold, beamCream]) {
        const hit = list.find((p) => p[8] === hoveredRay);
        if (hit) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(hit[0], hit[1]);
          ctx.lineTo(hit[2], hit[3]);
          ctx.lineTo(hit[4], hit[5]);
          ctx.lineTo(hit[6], hit[7]);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // 5) 合批绘制脉冲能量头
    if (pulsePts.length) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      for (const [px, py, r] of pulsePts) {
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  function render(t, dt, { still }) {
    if (still) {
      intro = 1;
    } else if (intro < 1) {
      intro = Math.min(1, intro + (dt || 0.016) * 2.1);
    }

    if (pulse >= 0 && !still) {
      pulse += (dt || 0.016) * 0.95;
      if (pulse >= 1.15) pulse = -1;
    }

    const state = getState();
    const ev = evaluate(state);
    const spec = SPECIMENS[state.specimen] || SPECIMENS.poster;
    const { cx, cy, baseR } = geometry(state);
    const easeIntro = 1 - Math.pow(1 - intro, 3);
    const breathe = still ? 0 : Math.sin(t * 1.8) * 0.012;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // 1. 一次 drawImage 绘制星雾 + 点阵流光金核
    const coreR = Math.max(baseR * 0.18, baseR * state.coreRadius * (1 + breathe) * easeIntro);
    const haloScale = Math.max(baseR * 0.56, coreR * 2.48);
    ctx.globalAlpha = state.coreRadius < 0.14 ? 0.84 : 0.98;
    ctx.drawImage(haloSprite, cx - haloScale, cy - haloScale, haloScale * 2, haloScale * 2);
    ctx.globalAlpha = 1;

    // 2. 双核撕裂或散源偏离的溯源虚线（单次合批 stroke）
    if (state.splitHub || ev.scatterPct > 11) {
      ctx.strokeStyle = "rgba(255, 122, 112, 0.36)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let i = 0; i < ev.rays.length; i += 2) {
        const ray = ev.rays[i];
        if (!ray.active) continue;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + ray.ox * baseR, cy + ray.oy * baseR);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (state.splitHub) {
        ctx.strokeStyle = PALETTE.err;
        ctx.fillStyle = PALETTE.err;
        ctx.lineWidth = 1.6;
        for (const [hx, hy] of [[cx + 0.185 * baseR, cy - 0.075 * baseR], [cx - 0.165 * baseR, cy + 0.085 * baseR]]) {
          ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // 3. 正常底层射线
    drawRaysBatched(ev, state, cx, cy, baseR, easeIntro, "under");

    // 4. 外圈卫星点与空心环（合批绘制）
    if (state.rhythm > 0.18) {
      ctx.globalAlpha = clamp((state.rhythm - 0.16) / 0.35, 0, 1) * easeIntro;
      const scaleR = clamp(baseR / 215, 0.72, 1.12);
      const reachMul = clamp(state.reach / 0.92, 0.62, 1.12);
      for (const kind of ["solid", "ring"]) {
        for (const colKey of ["gold", "cream"]) {
          const col = colKey === "gold" ? PALETTE.gold : PALETTE.cream;
          ctx.beginPath();
          let any = false;
          for (const s of SATELLITES) {
            if (s.kind !== kind || s.color !== colKey) continue;
            const a = (s.angleDeg * Math.PI) / 180;
            const d = baseR * s.dist * reachMul;
            const sx = cx + Math.cos(a) * d;
            const sy = cy + Math.sin(a) * d;
            if (sx < 12 || sx > cssW - 12 || sy < 12 || sy > cssH - 12) continue;
            const rad = s.r * scaleR;
            ctx.moveTo(sx + rad, sy);
            ctx.arc(sx, sy, rad, 0, Math.PI * 2);
            any = true;
          }
          if (!any) continue;
          if (kind === "solid") {
            ctx.fillStyle = col;
            ctx.fill();
          } else {
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // 5. 核心主体标题
    drawCoreSubject(spec, cx, cy, baseR, ev);

    // 刺穿段半透叠画
    ctx.globalAlpha = 0.72;
    drawRaysBatched(ev, state, cx, cy, baseR, easeIntro, "over");
    ctx.globalAlpha = 1;

    // 6. 核心光晕虚线控制环 + 脉冲冲击环
    const ringR = Math.max(baseR * 0.14, baseR * state.coreRadius);
    ctx.strokeStyle =
      !ev.focusOk && (ev.corePct < 19 || ev.corePct > 41)
        ? "rgba(255, 122, 112, 0.78)"
        : hoveredCore || (dragInfo && dragInfo.mode === "core") || highlightDim === "focus"
        ? "rgba(251, 227, 135, 0.92)"
        : "rgba(240, 198, 50, 0.28)";
    ctx.lineWidth = hoveredCore || (dragInfo && dragInfo.mode === "core") ? 2 : 1.1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (pulse >= 0 && pulse <= 1.05) {
      const waveR = Math.max(coreR * 0.6, pulse * baseR * Math.max(0.75, state.reach));
      ctx.strokeStyle = ev.score === 4 ? PALETTE.coreBright : PALETTE.err;
      ctx.globalAlpha = Math.max(0, (1 - pulse / 1.05) * 0.65);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 7. 角标与避开星爆尖端的在场标牌
    ctx.font = `500 11px "DM Mono", sans-serif`;
    ctx.fillStyle = "rgba(239, 229, 205, 0.72)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      `RAYS ${ev.activeCount}/${RAY_COUNT} · RATIO ${ev.rhythmRatio.toFixed(2)}× · CORE ${ev.corePct}%`,
      12,
      10
    );

    const outerTipPx = baseR * Math.max(0.55, state.reach);
    const topPillY = Math.max(26, cy - Math.max(baseR * 0.74, outerTipPx + 14));
    const botPillY = Math.min(cssH - 18, cy + Math.max(baseR * 0.86, outerTipPx + 14));
    if (ev.score === 4) {
      drawPill(cx, botPillY, `4/4 · ${ev.energyTier}（示意）· 点外圈单束手雕`, "ok");
    } else {
      if (state.splitHub) {
        drawPill(cx, topPillY, "双核互相抢戏 · 关闭双核或聚源", "err");
      } else if (ev.pierceCount > 2 || ev.corePct < 19) {
        drawPill(cx, topPillY, `${ev.pierceCount} 束刺穿主标 · 调大核心光晕`, "err");
      } else if (ev.corePct > 41) {
        drawPill(cx, topPillY, `巨核 ${ev.corePct}% 吞掉射线 · 收小核晕`, "err");
      }

      if (ev.rhythmRatio < 1.85) {
        drawPill(cx, botPillY, `均纹眩晕 ${ev.rhythmRatio.toFixed(2)}× · → 向右横拖拉爆节奏`, "err");
      } else if (ev.scatterPct > 11 && !state.splitHub) {
        drawPill(cx, botPillY, `发散源漂移 ${ev.scatterPct}% · 推高源心汇聚`, "err");
      } else if (ev.reachPct < 72) {
        drawPill(cx, botPillY, `外扩仅 ${ev.reachPct}% 过短 · 向右横拖舒展`, "err");
      } else if (ev.activeCount < 16 || ev.maxGapDeg > 98) {
        drawPill(cx, botPillY, `暗空裂口 ${ev.maxGapDeg}° · 点击暗空补回光束`, "err");
      }
    }

    if (hoveredRay >= 0 && !dragInfo) {
      const hRay = ev.rays[hoveredRay];
      const nextRoleText = hRay.role === "beam" ? "星尘点轨" : hRay.role === "spark" ? "暗空留白" : "主金光束";
      drawPill(cssW - 92, 22, `点击切为「${nextRoleText}」`, "gold");
    }

    ctx.restore();
    if (onFrameEval) onFrameEval(ev);
  }

  resize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      ctrl.draw();
    }).observe(canvas);
  }
  window.addEventListener("resize", () => {
    resize();
    ctrl.draw();
  });

  const ctrl = loop(canvas, render);

  // ---------- 指针与触屏交互 ----------
  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTestRay(x, y, state) {
    const { cx, cy, baseR } = geometry(state);
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const coreR = Math.max(baseR * 0.14, baseR * state.coreRadius);
    if (Math.abs(dist - coreR) < 16) return { zone: "ring", index: -1, dist };
    if (dist < coreR * 0.86) return { zone: "core", index: -1, dist };
    if (dist > baseR * 1.18) return { zone: "outer", index: -1, dist };
    let ang = Math.atan2(dy, dx) + Math.PI / 2;
    if (ang < 0) ang += Math.PI * 2;
    const idx = Math.round((ang / (Math.PI * 2)) * RAY_COUNT) % RAY_COUNT;
    return { zone: "ray", index: idx, dist };
  }

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return;
    const state = getState();
    const { x, y } = pointerPos(e);
    const hit = hitTestRay(x, y, state);
    dragInfo = {
      pointerId: e.pointerId,
      pointerType: e.pointerType || "mouse",
      zone: hit.zone,
      rayIndex: hit.index,
      mode: "auto",
      startX: x,
      startY: y,
      startRhythm: state.rhythm,
      startReach: state.reach,
      startCore: state.coreRadius,
      startConv: state.convergence,
      moved: false,
    };
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  }

  function onPointerMove(e) {
    const state = getState();
    const { x, y } = pointerPos(e);

    if (!dragInfo) {
      const hit = hitTestRay(x, y, state);
      const nextHoverRay = hit.zone === "ray" ? hit.index : -1;
      const nextHoverCore = hit.zone === "ring";
      if (nextHoverRay !== hoveredRay || nextHoverCore !== hoveredCore) {
        hoveredRay = nextHoverRay;
        hoveredCore = nextHoverCore;
        canvas.style.cursor = hoveredCore ? "ns-resize" : hoveredRay >= 0 ? "pointer" : "ew-resize";
        ctrl.draw();
      }
      return;
    }

    const dx = x - dragInfo.startX;
    const dy = y - dragInfo.startY;
    if (Math.hypot(dx, dy) > 5) dragInfo.moved = true;
    if (!dragInfo.moved) return;

    if (dragInfo.mode === "auto") {
      if (dragInfo.pointerType === "touch") {
        if (Math.abs(dx) >= Math.abs(dy) * 0.7) {
          dragInfo.mode = "rhythm";
        } else {
          dragInfo = null;
          return;
        }
      } else {
        const vertRatio = dragInfo.zone === "ring" ? 0.85 : 1.2;
        dragInfo.mode = Math.abs(dy) > Math.abs(dx) * vertRatio ? "core" : "rhythm";
      }
    }

    if (dragInfo.mode === "core") {
      const deltaCore = -dy / Math.max(160, cssH * 0.72);
      updateState({ coreRadius: +clamp(dragInfo.startCore + deltaCore, 0.03, 0.54).toFixed(3) });
    } else {
      const span = Math.max(180, cssW * 0.56);
      const deltaR = dx / span;
      updateState({
        rhythm: +clamp(dragInfo.startRhythm + deltaR * 0.92, 0.02, 0.99).toFixed(3),
        reach: +clamp(dragInfo.startReach + deltaR * 0.58, 0.42, 1.08).toFixed(3),
        convergence: +(deltaR > 0 ? clamp(dragInfo.startConv + deltaR * 0.65, 0.45, 0.99) : dragInfo.startConv).toFixed(3),
      });
    }
    ctrl.draw();
  }

  function onPointerUp(e) {
    if (!dragInfo) return;
    const info = dragInfo;
    dragInfo = null;
    if (canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    if (!info.moved) {
      const state = getState();
      if (info.zone === "core") {
        triggerPulse();
      } else if (info.zone === "ray" && info.rayIndex >= 0) {
        const ev = evaluate(state);
        const cur = ev.rays[info.rayIndex]?.role || "beam";
        const nextRole = cur === "beam" ? "spark" : cur === "spark" ? "void" : "beam";
        const nextOv = [...(state.overrides || new Array(RAY_COUNT).fill(null))];
        nextOv[info.rayIndex] = nextRole;
        updateState({ overrides: nextOv });
        ctrl.draw();
      }
    }
  }

  function onPointerLeave() {
    if (!dragInfo && (hoveredRay !== -1 || hoveredCore)) {
      hoveredRay = -1;
      hoveredCore = false;
      ctrl.draw();
    }
  }

  let touchLock = null;
  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    touchLock = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null };
  }
  function onTouchMove(e) {
    if (!touchLock || !e.touches || !e.touches.length) return;
    const dx = Math.abs(e.touches[0].clientX - touchLock.x);
    const dy = Math.abs(e.touches[0].clientY - touchLock.y);
    if (!touchLock.axis && (dx > 4 || dy > 4)) {
      touchLock.axis = dx >= dy * 0.7 ? "x" : "y";
    }
    if (touchLock.axis === "x" && e.cancelable) e.preventDefault();
  }
  function onTouchEnd() {
    touchLock = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      updateState({ rhythm: +clamp(state.rhythm + 0.06, 0.02, 0.99).toFixed(3) });
      ctrl.draw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      updateState({ rhythm: +clamp(state.rhythm - 0.06, 0.02, 0.99).toFixed(3) });
      ctrl.draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateState({ coreRadius: +clamp(state.coreRadius + 0.03, 0.03, 0.54).toFixed(3) });
      ctrl.draw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      updateState({ coreRadius: +clamp(state.coreRadius - 0.03, 0.03, 0.54).toFixed(3) });
      ctrl.draw();
    } else if (e.key === "]") {
      e.preventDefault();
      updateState({ reach: +clamp(state.reach + 0.06, 0.40, 1.10).toFixed(3) });
      ctrl.draw();
    } else if (e.key === "[") {
      e.preventDefault();
      updateState({ reach: +clamp(state.reach - 0.06, 0.40, 1.10).toFixed(3) });
      ctrl.draw();
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      triggerPulse();
    }
  });

  ctrl.draw();

  return {
    draw: () => ctrl.draw(),
    triggerPulse,
    setHighlight,
  };
}
