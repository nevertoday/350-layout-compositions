// 137 通版跨页 · 开场主角玩具：跨缝通流·装订接缝台（2D Canvas, data-perf-drag）
// 与 model.js 共享唯一几何真源，零写死常量，零重型滤镜，确保慢手机软件渲染高帧率。

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  actualRibbonY,
  baseRibbonY,
  clamp,
  ribbonSlope,
} from "./model.js";

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_EN = '"Unbounded", "Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", "Noto Sans SC", monospace';

export function mountHeroCanvas(canvas, getState, getEval, onMutate, onPulseDone) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0;
  let H = 0;
  let dpr = 1;
  let dirty = true;
  let introT = 0;
  let introDone = false;

  // 薄荷光流演练状态
  let pulse = {
    active: false,
    x: 0,
    broken: false,
    breakTimer: 0,
    sparks: [],
  };

  // 拖拽状态
  let drag = null; // { mode: "ribbon"|"seam"|"title", pointerId, startX, startY, origSpan, origShear, origTitle, moved }
  let hitZones = {
    spread: { x: 0, y: 0, w: 0, h: 0 },
    seamNode: { x: 0, y: 0, r: 22 },
    titleBox: { x: 0, y: 0, w: 0, h: 0 },
    spineBadge: { x: 0, y: 0, w: 0, h: 0 },
    leftWing: { x: 0, y: 0, r: 22 },
    rightWing: { x: 0, y: 0, r: 22 },
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(260, Math.round(rect.width));
    const ch = Math.max(220, Math.round(rect.height));
    const cap = cw <= 480 ? 1.5 : 2;
    const nextDpr = pixelRatio(cap);
    if (cw !== W || ch !== H || nextDpr !== dpr) {
      W = cw;
      H = ch;
      dpr = nextDpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function triggerPulse() {
    const ev = getEval();
    pulse = {
      active: true,
      x: ev.startX,
      broken: false,
      breakTimer: 0,
      sparks: [],
    };
    dirty = true;
  }

  function markDirty() {
    dirty = true;
  }

  // 计算严格等比（真实出版跨页画幅）的跨页区域与底部物理纸弧剖面区域
  // 宽屏充分利用画布宽度（零大块左右黑边），窄屏保持等比不拉扁
  function computeRegions() {
    const compact = W < 540;
    const padX = compact ? 12 : 22;
    const topBarH = compact ? 30 : 34;
    const profileH = compact ? Math.round(H * 0.24) : Math.min(84, Math.round(H * 0.175));
    const bottomPad = compact ? 8 : 10;
    const availW = W - padX * 2;
    const availH = H - topBarH - profileH - bottomPad - 10;

    // 宽屏采用舒展画册跨页比例（~1.92:1），紧凑屏采用标准杂志双页（~1.58:1），严格等比不拉伸
    const targetAspect = compact ? 1.56 : 1.92;
    let sw = availW;
    let sh = sw / targetAspect;
    if (sh > availH) {
      sh = availH;
      sw = sh * targetAspect;
    }
    const sx = Math.round((W - sw) * 0.5);
    const sy = Math.round(topBarH + (availH - sh) * 0.5);
    const py = sy + sh + 8;

    return {
      compact,
      topBarH,
      spread: { x: sx, y: sy, w: sw, h: sh },
      profile: { x: sx, y: py, w: sw, h: Math.max(54, H - py - bottomPad) },
    };
  }

  // 绘制圆角矩形路径
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // 构建单侧（左页或右页）S 形色带多边形点阵
  function traceRibbonHalf(sp, x0, x1, seamShear, ribbonWidth) {
    const steps = 28;
    const upper = [];
    const lower = [];
    for (let i = 0; i <= steps; i++) {
      const nx = x0 + ((x1 - x0) * i) / steps;
      const cy = actualRibbonY(nx, seamShear);
      const swell = 0.92 + 0.16 * Math.exp(-Math.pow((nx - 0.52) / 0.28, 2));
      const halfH = ribbonWidth * swell * 0.5;
      const px = sp.x + nx * sp.w;
      upper.push([px, sp.y + (cy - halfH) * sp.h]);
      lower.push([px, sp.y + (cy + halfH) * sp.h]);
    }
    ctx.beginPath();
    ctx.moveTo(upper[0][0], upper[0][1]);
    for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i][0], upper[i][1]);
    for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
    ctx.closePath();
  }

  // 绘制冰川/建筑标本的底场几何元素（不画人物五官）
  function drawSpecimenBackdrop(sp, state, ev) {
    const { spec } = ev;
    const splitRight = state.unifyGround !== "unified";
    const midX = sp.x + sp.w * 0.5;

    if (spec.id === "poster") {
      // 137 原海报标志元素：右上双波浪 + 左上微缩总述提示线 + 左下 8×4 薄荷点阵
      const wx = sp.x + sp.w * 0.855;
      const wy = sp.y + sp.h * 0.088;
      const ww = sp.w * 0.095;
      ctx.strokeStyle = PALETTE.mint;
      ctx.lineWidth = Math.max(1.3, sp.w * 0.0022);
      ctx.lineCap = "round";
      for (let row = 0; row < 2; row++) {
        ctx.beginPath();
        const ry = wy + row * (sp.h * 0.028);
        for (let k = 0; k <= 24; k++) {
          const t = k / 24;
          const x = wx + t * ww;
          const y = ry + Math.sin(t * Math.PI * 4) * (sp.h * 0.011);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // 右上微缩英文四词
      const tagSize = Math.max(7, Math.round(sp.h * 0.031));
      ctx.font = `500 ${tagSize}px ${FONT_MONO}`;
      ctx.fillStyle = "rgba(163, 231, 190, 0.78)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      spec.rightTag.forEach((word, i) => {
        ctx.fillText(word, wx, wy + sp.h * 0.075 + i * (tagSize * 1.38));
      });

      // 左上原海报标头微影（自示范左页起始区）
      const lx = sp.x + sp.w * 0.055;
      const ly = sp.y + sp.h * 0.085;
      ctx.fillStyle = PALETTE.mintBar;
      ctx.fillRect(lx, ly + sp.h * 0.145, sp.w * 0.048, Math.max(2, sp.h * 0.009));
      const capSize = Math.max(8, Math.round(sp.h * 0.033));
      ctx.font = `500 ${capSize}px ${FONT_ZH}`;
      ctx.fillStyle = "rgba(163, 231, 190, 0.76)";
      spec.leftCaption.forEach((line, i) => {
        ctx.fillText(line, lx, ly + sp.h * 0.175 + i * (capSize * 1.45));
      });
      // 左上微缩双行标题影
      const miniTitle = Math.max(12, Math.round(sp.h * 0.075));
      ctx.font = `900 ${miniTitle}px ${FONT_ZH}`;
      ctx.fillStyle = "rgba(252, 243, 244, 0.88)";
      ctx.fillText("通版", lx, ly - sp.h * 0.01);
      ctx.fillText("跨页", lx, ly + miniTitle * 1.02 - sp.h * 0.01);

      // 左下 8×4 薄荷点阵（1:1 复刻原海报）
      const dx0 = sp.x + sp.w * 0.055;
      const dy0 = sp.y + sp.h * 0.875;
      const gapX = sp.w * 0.0165;
      const gapY = sp.h * 0.024;
      const dotR = Math.max(1.2, sp.w * 0.0022);
      ctx.fillStyle = PALETTE.mintDots;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.beginPath();
          ctx.arc(dx0 + c * gapX, dy0 + r * gapY, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    if (spec.id === "glacier") {
      // 地理摄影·冰川全景：左右贯通的冰脊剪影 + 经纬标尺
      const drawRidge = (side) => {
        ctx.save();
        ctx.beginPath();
        if (side === "left") ctx.rect(sp.x, sp.y, sp.w * 0.5, sp.h);
        else ctx.rect(midX, sp.y, sp.w * 0.5, sp.h);
        ctx.clip();

        const shearPx = side === "right" ? ev.seamShear * sp.h * 0.55 : 0;
        const pts = [
          [0.0, 0.62], [0.14, 0.44], [0.27, 0.53], [0.42, 0.34],
          [0.54, 0.41], [0.68, 0.25], [0.83, 0.38], [1.0, 0.28],
        ];
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y + sp.h);
        for (const [nx, ny] of pts) {
          ctx.lineTo(sp.x + nx * sp.w, sp.y + ny * sp.h + shearPx);
        }
        ctx.lineTo(sp.x + sp.w, sp.y + sp.h);
        ctx.closePath();
        ctx.fillStyle = side === "right" && splitRight ? "rgba(116, 102, 114, 0.34)" : "rgba(110, 96, 180, 0.22)";
        ctx.fill();

        // 冰原等高虚线
        ctx.strokeStyle = "rgba(154, 230, 199, 0.28)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y + sp.h * 0.36 + shearPx);
        ctx.lineTo(sp.x + sp.w, sp.y + sp.h * 0.36 + shearPx);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      };
      drawRidge("left");
      drawRidge("right");

      // 左上科考标注
      const lx = sp.x + sp.w * 0.05;
      const ly = sp.y + sp.h * 0.08;
      ctx.font = `500 ${Math.max(8, Math.round(sp.h * 0.032))}px ${FONT_MONO}`;
      ctx.fillStyle = PALETTE.mint;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("66°33'N · PANORAMA", lx, ly);
      return;
    }

    // architecture：建筑展册·长卷立面
    const drawElevation = (side) => {
      ctx.save();
      ctx.beginPath();
      if (side === "left") ctx.rect(sp.x, sp.y, sp.w * 0.5, sp.h);
      else ctx.rect(midX, sp.y, sp.w * 0.5, sp.h);
      ctx.clip();

      const shearPx = side === "right" ? ev.seamShear * sp.h * 0.5 : 0;
      const baseLine = sp.y + sp.h * 0.72 + shearPx;
      ctx.strokeStyle = side === "right" && splitRight ? "rgba(176, 156, 168, 0.34)" : "rgba(163, 231, 190, 0.26)";
      ctx.lineWidth = 1.2;
      // 贯穿水平屋檐与地平线
      ctx.beginPath();
      ctx.moveTo(sp.x + sp.w * 0.04, baseLine);
      ctx.lineTo(sp.x + sp.w * 0.96, baseLine);
      ctx.moveTo(sp.x + sp.w * 0.04, baseLine - sp.h * 0.38);
      ctx.lineTo(sp.x + sp.w * 0.96, baseLine - sp.h * 0.38);
      ctx.stroke();
      // 节奏柱列
      for (let i = 0; i < 12; i++) {
        const px = sp.x + sp.w * (0.08 + i * 0.076);
        ctx.fillStyle = side === "right" && splitRight ? "rgba(146, 130, 145, 0.16)" : "rgba(163, 231, 190, 0.11)";
        ctx.fillRect(px, baseLine - sp.h * 0.38, sp.w * 0.016, sp.h * 0.38);
      }
      ctx.restore();
    };
    drawElevation("left");
    drawElevation("right");
  }

  // 绘制底部实时实体书脊纸弧剖面
  function drawSpineProfile(prof, state, ev) {
    const { bind } = ev;
    const midX = prof.x + prof.w * 0.5;
    const topY = prof.y + 4;
    const h = prof.h - 6;

    // 剖面舱底
    ctx.fillStyle = "#170736";
    ctx.fillRect(prof.x, topY, prof.w, h);
    ctx.strokeStyle = PALETTE.indigoBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(prof.x + 0.5, topY + 0.5, prof.w - 1, h - 1);

    // 左侧小标题
    const labelSize = W < 540 ? 9 : 10;
    ctx.font = `500 ${labelSize}px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.mint;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`BOOK PROFILE · ${bind.label} (${bind.openAngle}°)`, prof.x + 10, topY + 7);

    // 右侧吞缝读数
    ctx.textAlign = "right";
    ctx.fillStyle = bind.id === "perfect" ? PALETTE.danger : bind.id === "saddle" ? PALETTE.warn : PALETTE.ok;
    ctx.fillText(`折谷损耗 ≈ ${bind.gutterMm}mm`, prof.x + prof.w - 10, topY + 7);

    // 绘制纸弧剖面（真实反映胶装深V谷 vs 骑马订微弯 vs 锁线平摊 178°）
    const curveBaseY = topY + h * 0.52;
    const maxDip = h * 0.36;
    const dipPx = (bind.dipDepth / 0.085) * maxDip;
    const curveLeft = prof.x + 14;
    const curveRight = prof.x + prof.w - 14;
    const halfSpan = (curveRight - curveLeft) * 0.5;
    const dangerPx = bind.dangerHalfNorm * (curveRight - curveLeft);

    // 装订折谷暗区阴影柱
    ctx.fillStyle = bind.id === "perfect" ? "rgba(255, 107, 127, 0.22)" : "rgba(163, 231, 190, 0.14)";
    ctx.fillRect(midX - dangerPx, topY + 22, dangerPx * 2, h - 26);

    // 纸张厚度双弧线
    const drawPageCurve = (yOffset, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const u = i / N; // 0..1
        const px = curveLeft + u * (curveRight - curveLeft);
        const d = Math.abs(u - 0.5) * 2; // 0 at spine, 1 at outer edge
        // 真实书页曲线：靠书脊急剧下折，中部拱起，外切微微平落
        const valley = Math.exp(-Math.pow(d / 0.22, 1.5)) * dipPx;
        const arch = Math.sin(d * Math.PI) * (dipPx * 0.26);
        const py = curveBaseY - arch + valley + yOffset;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    drawPageCurve(4, "rgba(136, 111, 167, 0.45)", 1.5);
    drawPageCurve(0, PALETTE.cream, 2.2);

    // 把每个标题字符投影到纸弧上，让用户一眼看到哪几个字掉进了 V 谷！
    ev.glyphBoxes.forEach((g) => {
      if (g.isSpace) return;
      const u = clamp(g.cx, 0.04, 0.96);
      const px = curveLeft + u * (curveRight - curveLeft);
      const d = Math.abs(u - 0.5) * 2;
      const valley = Math.exp(-Math.pow(d / 0.22, 1.5)) * dipPx;
      const arch = Math.sin(d * Math.PI) * (dipPx * 0.26);
      const py = curveBaseY - arch + valley;

      ctx.fillStyle = g.overlapSpine ? PALETTE.danger : PALETTE.rose;
      ctx.beginPath();
      ctx.arc(px, py, g.overlapSpine ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 中缝钉/胶脊标
    ctx.strokeStyle = PALETTE.spineDot;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, topY + 20);
    ctx.lineTo(midX, topY + h - 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function render(t, dt, { still }) {
    resize();
    if (!still) {
      if (!introDone) {
        introT = Math.min(1, introT + (dt || 0.016) * 2.6);
        if (introT >= 1) introDone = true;
        dirty = true;
      }
      if (pulse.active) {
        const ev = getEval();
        const step = (dt || 0.016) * 0.52;
        if (!pulse.broken) {
          const prevX = pulse.x;
          pulse.x += step;
          // 过中缝时检查是否错牙撞断！
          if (prevX < 0.5 && pulse.x >= 0.5 && ev.absShearMm > 6) {
            pulse.x = 0.5;
            pulse.broken = true;
            pulse.breakTimer = 0.65;
            pulse.sparks = Array.from({ length: 7 }, (_, i) => {
              const ang = -Math.PI * 0.65 + (i / 6) * Math.PI * 1.3;
              return { vx: Math.cos(ang) * 70, vy: Math.sin(ang) * 70, x: 0, y: 0 };
            });
          } else if (pulse.x >= ev.endX) {
            pulse.active = false;
            if (onPulseDone) onPulseDone(ev.score === 4);
          }
        } else {
          pulse.breakTimer -= dt || 0.016;
          pulse.sparks.forEach((s) => {
            s.x += s.vx * (dt || 0.016);
            s.y += s.vy * (dt || 0.016);
          });
          if (pulse.breakTimer <= 0) {
            pulse.active = false;
            if (onPulseDone) onPulseDone(false);
          }
        }
        dirty = true;
      }
    } else {
      introT = 1;
      introDone = true;
      pulse.active = false;
    }

    if (!dirty && !still) return;
    dirty = false;

    const state = getState();
    const ev = getEval();
    const { spec, bind } = ev;
    const { compact, spread: sp, profile: prof } = computeRegions();
    hitZones.spread = sp;
    const midX = sp.x + sp.w * 0.5;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 整体深紫靛工作台底色（与原海报无框融为一体）
    ctx.fillStyle = PALETTE.indigoDeep;
    ctx.fillRect(0, 0, W, H);

    // 细微印刷裁切十字角标
    ctx.strokeStyle = "rgba(136, 111, 167, 0.35)";
    ctx.lineWidth = 1;
    const cm = 7;
    [
      [sp.x, sp.y],
      [sp.x + sp.w, sp.y],
      [sp.x, sp.y + sp.h],
      [sp.x + sp.w, sp.y + sp.h],
    ].forEach(([cx, cy]) => {
      const sx = cx === sp.x ? -1 : 1;
      const sy = cy === sp.y ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + sx * 3, cy);
      ctx.lineTo(cx + sx * (3 + cm), cy);
      ctx.moveTo(cx, cy + sy * 3);
      ctx.lineTo(cx, cy + sy * (3 + cm));
      ctx.stroke();
    });

    // 2. 顶沿页码与可点击装订工艺签
    const topTextY = Math.round(sp.y - (compact ? 18 : 20));
    const metaFont = compact ? 9.5 : 10.5;
    ctx.font = `500 ${metaFont}px ${FONT_MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(252, 243, 244, 0.72)";
    ctx.textAlign = "left";
    ctx.fillText(compact ? "VERSO 左页" : "VERSO 左页 · 210×280mm", sp.x, topTextY);
    ctx.textAlign = "right";
    ctx.fillText(compact ? "RECTO 右页" : "RECTO 右页 · 210×280mm", sp.x + sp.w, topTextY);

    // 书脊顶部的交互工艺按钮（点按切工艺）
    const bindLabel = `装订：${bind.label} ${bind.gutterMm}mm · 切工艺`;
    ctx.font = `500 ${compact ? 9.5 : 10.5}px ${FONT_ZH}`;
    const bw = ctx.measureText(bindLabel).width + 16;
    const bh = 20;
    const bx = Math.round(midX - bw / 2);
    const by = Math.round(topTextY - bh / 2);
    hitZones.spineBadge = { x: bx - 4, y: by - 4, w: bw + 8, h: bh + 8 };
    roundRect(bx, by, bw, bh, 2);
    ctx.fillStyle = bind.id === "perfect" ? "rgba(255, 107, 127, 0.18)" : "rgba(163, 231, 190, 0.16)";
    ctx.fill();
    ctx.strokeStyle = bind.id === "perfect" ? PALETTE.danger : PALETTE.mint;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = bind.id === "perfect" ? "#FFB3BE" : PALETTE.mint;
    ctx.textAlign = "center";
    ctx.fillText(bindLabel, midX, topTextY + 0.5);

    // 3. 左右双页开本底场（统一 vs 割裂）
    ctx.save();
    ctx.beginPath();
    ctx.rect(sp.x, sp.y, sp.w, sp.h);
    ctx.clip();

    // 左页底场
    ctx.fillStyle = spec.groundLeft;
    ctx.fillRect(sp.x, sp.y, sp.w * 0.5, sp.h);

    // 右页底场（错态时呈灰褐割裂感）
    const isSplit = state.unifyGround !== "unified";
    ctx.fillStyle = isSplit ? spec.groundRightSplit : spec.groundRightUnified;
    ctx.fillRect(midX, sp.y, sp.w * 0.5, sp.h);

    // 标本固有背景图层（波浪、点阵、冰脊或建筑立面）
    drawSpecimenBackdrop(sp, state, ev);

    // 若底场割裂，在右页底部边缘提示可点统一（与上方细正文拉开安全间距，绝不重叠）
    if (isSplit) {
      ctx.strokeStyle = "rgba(255, 107, 127, 0.65)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(midX + 6, sp.y + 6, sp.w * 0.5 - 12, sp.h - 12);
      ctx.setLineDash([]);
      const spTxt = "× 底场割裂 · 点此统一通底";
      ctx.font = `600 ${compact ? 9 : 10.5}px ${FONT_ZH}`;
      const tw = ctx.measureText(spTxt).width + 14;
      const sxBadge = sp.x + sp.w - tw - 10;
      const syBadge = sp.y + sp.h - 24;
      roundRect(sxBadge, syBadge, tw, 18, 2);
      ctx.fillStyle = "rgba(27, 9, 62, 0.92)";
      ctx.fill();
      ctx.strokeStyle = PALETTE.danger;
      ctx.stroke();
      ctx.fillStyle = "#FFB3BE";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spTxt, sxBadge + tw / 2, syBadge + 9.5);
    }

    // 4. 绘制贯穿左右双页的 S 形电光玫粉通流带（单真源几何）
    // 左页半段
    ctx.save();
    ctx.beginPath();
    ctx.rect(sp.x, sp.y, sp.w * 0.5, sp.h);
    ctx.clip();
    traceRibbonHalf(sp, ev.startX, 0.5, 0, ev.ribbonWidth);
    ctx.fillStyle = spec.ribbonFill;
    ctx.fill();
    if (state.highlightDim === "through" || state.highlightDim === "extended") {
      ctx.strokeStyle = PALETTE.mint;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    // 右页半段（带真实 seamShear 错牙与裂底灰化）
    ctx.save();
    ctx.beginPath();
    ctx.rect(midX, sp.y, sp.w * 0.5, sp.h);
    ctx.clip();
    traceRibbonHalf(sp, 0.5, ev.endX, ev.seamShear, ev.ribbonWidth);
    ctx.fillStyle = isSplit ? spec.ribbonSplitRight : spec.ribbonFill;
    ctx.fill();
    if (state.highlightDim === "through" || state.highlightDim === "extended") {
      ctx.strokeStyle = PALETTE.mint;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    // 若延展不足（困在页框内），画出左右页外缘空洞警示线
    if (ev.spanReach < 0.84 && state.showGuides) {
      ctx.strokeStyle = "rgba(255, 184, 108, 0.72)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const lx = sp.x + ev.startX * sp.w;
      const rx = sp.x + ev.endX * sp.w;
      ctx.beginPath();
      ctx.moveTo(lx, sp.y + 8);
      ctx.lineTo(lx, sp.y + sp.h - 8);
      ctx.moveTo(rx, sp.y + 8);
      ctx.lineTo(rx, sp.y + sp.h - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. 书脊真实物理弯折阴影（越厚的胶装折谷越暗越宽）
    const valleyHalfPx = bind.dangerHalfNorm * sp.w;
    const grad = ctx.createLinearGradient(midX - valleyHalfPx * 1.4, 0, midX + valleyHalfPx * 1.4, 0);
    const darkAlpha = bind.id === "perfect" ? 0.56 : bind.id === "saddle" ? 0.25 : 0.11;
    grad.addColorStop(0, "rgba(10, 2, 26, 0)");
    grad.addColorStop(0.35, `rgba(10, 2, 26, ${darkAlpha * 0.55})`);
    grad.addColorStop(0.5, `rgba(8, 1, 20, ${darkAlpha})`);
    grad.addColorStop(0.65, `rgba(10, 2, 26, ${darkAlpha * 0.55})`);
    grad.addColorStop(1, "rgba(10, 2, 26, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(midX - valleyHalfPx * 1.4, sp.y, valleyHalfPx * 2.8, sp.h);

    // 书脊危险折谷参考虚框（打开参考线或有字符压脊时显现）
    if (state.showGuides || ev.trappedGlyphs.length > 0 || ev.bodyTrapped) {
      ctx.fillStyle = ev.trappedGlyphs.length > 0 || ev.bodyTrapped ? "rgba(255, 107, 127, 0.16)" : "rgba(163, 231, 190, 0.08)";
      ctx.fillRect(midX - valleyHalfPx, sp.y, valleyHalfPx * 2, sp.h);
    }

    // 137 原海报核心母题：贯通顶底的书脊细点虚线
    ctx.strokeStyle = PALETTE.spineDot;
    ctx.lineWidth = 1.15;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, sp.y);
    ctx.lineTo(midX, sp.y + sp.h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. 沿 S 形通流逐字排布跨页大标（单真源坐标 + 真实书脊挤压形变！）
    const headlineSize = Math.max(16, Math.round(sp.h * 0.145 * clamp(ev.ribbonWidth / 0.27, 0.72, 1.18)));
    let tMinX = Infinity, tMaxX = -Infinity, tMinY = Infinity, tMaxY = -Infinity;

    ev.glyphBoxes.forEach((g) => {
      if (g.isSpace) return;
      const gx = sp.x + g.cx * sp.w;
      const gy = sp.y + g.cy * sp.h;
      const slope = ribbonSlope(g.cx, ev.seamShear);
      const angle = Math.atan2(slope * sp.h, sp.w);

      tMinX = Math.min(tMinX, gx - headlineSize * 0.55);
      tMaxX = Math.max(tMaxX, gx + headlineSize * 0.55);
      tMinY = Math.min(tMinY, gy - headlineSize * 0.65);
      tMaxY = Math.max(tMaxY, gy + headlineSize * 0.65);

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);
      // 落入胶装折谷时，字符真实横向压扁，直观呈现装订吃字！
      ctx.scale(g.pinchFactor, 1);
      ctx.font = `900 ${headlineSize}px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = g.overlapSpine ? "#FFD2DA" : spec.inkOnRibbon;
      ctx.fillText(g.ch, 0, 0);

      if (g.overlapSpine) {
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(-headlineSize * 0.52, -headlineSize * 0.56, headlineSize * 1.04, headlineSize * 1.12);
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // 英文副标题按左右页分别裁剪绘制（错牙时随右页一起真实断阶，不跨缝撞上错牙标签）
    const subCx = clamp(0.5 + ev.titleOffset, 0.2, 0.8);
    const subFont = `600 ${Math.max(8, Math.round(sp.h * 0.035))}px ${FONT_EN}`;
    [
      { clipX: sp.x, clipW: sp.w * 0.5, shear: 0 },
      { clipX: midX, clipW: sp.w * 0.5, shear: ev.seamShear },
    ].forEach(({ clipX, clipW, shear }) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipX, sp.y, clipW, sp.h);
      ctx.clip();
      const subCy = baseRibbonY(subCx) + shear;
      const subAngle = Math.atan2(ribbonSlope(subCx, shear) * sp.h, sp.w);
      ctx.translate(sp.x + subCx * sp.w, sp.y + subCy * sp.h);
      ctx.rotate(subAngle);
      ctx.font = subFont;
      ctx.fillStyle = "rgba(252, 243, 244, 0.90)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(spec.subEn, 0, headlineSize * 0.62);
      ctx.restore();
    });

    hitZones.titleBox = {
      x: tMinX - 4,
      y: tMinY - 4,
      w: Math.max(54, tMaxX - tMinX + 8),
      h: Math.max(34, tMaxY - tMinY + 8),
    };

    // 如果有字压脊，在标题上方亮出简洁红签
    if (ev.trappedGlyphs.length > 0) {
      const warnTxt = `× 压脊吞字：横拖标题避开 ${bind.gutterMm}mm 折谷`;
      ctx.font = `600 ${compact ? 9 : 10}px ${FONT_ZH}`;
      const ww = ctx.measureText(warnTxt).width + 14;
      const wx = clamp(midX - ww / 2, sp.x + 8, sp.x + sp.w - ww - 8);
      const wy = Math.max(sp.y + 8, tMinY - 28);
      roundRect(wx, wy, ww, 19, 2);
      ctx.fillStyle = "rgba(27, 9, 62, 0.92)";
      ctx.fill();
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#FFB3BE";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTxt, wx + ww / 2, wy + 9.5);
    }

    // 7. 细小正文行（放在 y=0.815，上下均与错牙标签和底角割裂签留出清晰气口）
    const bodyFontSize = Math.max(8.5, Math.round(sp.h * 0.032));
    ctx.font = `400 ${bodyFontSize}px ${FONT_ZH}`;
    if (state.bodyCross) {
      const byLine = sp.y + sp.h * 0.815;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = ev.bodyTrapped ? "rgba(255, 179, 190, 0.94)" : "rgba(252, 243, 244, 0.78)";
      ctx.fillText(spec.bodySample, midX, byLine);
      if (ev.bodyTrapped) {
        const bw2 = Math.min(sp.w * 0.60, ctx.measureText(spec.bodySample).width + 14);
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(midX - bw2 / 2, byLine - 10, bw2, 20);
        ctx.setLineDash([]);
      }
    } else {
      // 安全落位：分置右页底栏避开书脊
      const rxText = midX + Math.max(22, valleyHalfPx + 14);
      const ryText = sp.y + sp.h * 0.80;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(163, 231, 190, 0.88)";
      ctx.fillText("安全栏正文：", rxText, ryText);
      ctx.fillStyle = "rgba(252, 243, 244, 0.78)";
      ctx.fillText(spec.bodySample.slice(0, 14), rxText, ryText + bodyFontSize * 1.42);
    }

    // 8. 中缝接缝错牙指示线与可拖动「接缝节点」（直接操纵！）
    const lyPx = sp.y + ev.leftExitY * sp.h;
    const ryPx = sp.y + ev.rightEntryY * sp.h;
    hitZones.seamNode = { x: midX, y: ryPx, r: 22 };

    if (ev.absShearMm > 6) {
      // 垂直错牙断阶线
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(midX, lyPx);
      ctx.lineTo(midX, ryPx);
      ctx.stroke();

      // 左页出口点（固定基准）
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(midX, lyPx, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 右页入口「接缝节点」（用户上下拖它即可缝合/撕开中缝）
    const nodeColor = ev.absShearMm <= 6 ? PALETTE.ok : PALETTE.danger;
    ctx.fillStyle = PALETTE.indigoDeep;
    ctx.beginPath();
    ctx.arc(midX, ryPx, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = nodeColor;
    ctx.font = `700 11px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↕", midX, ryPx + 0.5);

    // 接缝节点毫米签：放在左页中缝下方净空区（y 贴齐 ryPx + 14，绝不压英文副标）
    if (state.showGuides || ev.absShearMm > 6) {
      const sTag = ev.absShearMm <= 6 ? `✓ 接缝 0mm` : `↕ 错牙 ${ev.shearMm > 0 ? "+" : ""}${ev.shearMm}mm`;
      ctx.font = `600 ${compact ? 9 : 10}px ${FONT_MONO}`;
      const stw = ctx.measureText(sTag).width + 12;
      const stx = clamp(midX - stw - 14, sp.x + 8, midX - stw - 8);
      const sty = clamp(ev.absShearMm > 6 ? Math.min(ryPx - 9, sp.y + sp.h * 0.61) : ryPx - 9, sp.y + 8, sp.y + sp.h - 58);
      roundRect(stx, sty, stw, 18, 2);
      ctx.fillStyle = "rgba(27, 9, 62, 0.92)";
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = ev.absShearMm <= 6 ? PALETTE.mint : "#FFB3BE";
      ctx.textAlign = "center";
      ctx.fillText(sTag, stx + stw / 2, sty + 9.5);
    }

    // 9. 左右端延展翼手柄（提示可直接横拖拉展至外切边）
    const leftTipX = sp.x + ev.startX * sp.w;
    const leftTipY = sp.y + baseRibbonY(ev.startX) * sp.h;
    const rightTipX = sp.x + ev.endX * sp.w;
    const rightTipY = sp.y + actualRibbonY(ev.endX, ev.seamShear) * sp.h;
    hitZones.leftWing = { x: leftTipX, y: leftTipY, r: 22 };
    hitZones.rightWing = { x: rightTipX, y: rightTipY, r: 22 };

    if (ev.spanReach < 0.97) {
      [
        [leftTipX, leftTipY, "←"],
        [rightTipX, rightTipY, "→"],
      ].forEach(([tx, ty, arrow]) => {
        const cx = clamp(tx, sp.x + 12, sp.x + sp.w - 12);
        const cy = clamp(ty, sp.y + 14, sp.y + sp.h - 14);
        ctx.fillStyle = PALETTE.indigoDeep;
        ctx.beginPath();
        ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.mint;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.fillStyle = PALETTE.mint;
        ctx.font = `700 10px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(arrow, cx, cy + 0.5);
      });
    }

    // 10. 中心线薄荷引导虚弧（开场微显 + 空格薄荷光流演练）
    if (state.showGuides && introT > 0.1) {
      ctx.save();
      ctx.globalAlpha = 0.52 * introT;
      ctx.strokeStyle = PALETTE.mint;
      ctx.lineWidth = 1.15;
      ctx.setLineDash([5, 5]);
      // 左半中心线
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const nx = ev.startX + ((0.499 - ev.startX) * i) / 20;
        const px = sp.x + nx * sp.w;
        const py = sp.y + baseRibbonY(nx) * sp.h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // 右半中心线
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const nx = 0.501 + ((ev.endX - 0.501) * i) / 20;
        const px = sp.x + nx * sp.w;
        const py = sp.y + actualRibbonY(nx, ev.seamShear) * sp.h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 11. 演练薄荷光流彗星（Space 或按钮触发）
    if (pulse.active) {
      const px = sp.x + pulse.x * sp.w;
      const py = sp.y + actualRibbonY(pulse.x < 0.5 ? pulse.x : Math.max(0.501, pulse.x), pulse.x < 0.5 ? 0 : ev.seamShear) * sp.h;
      if (!pulse.broken) {
        // 尾迹点
        for (let k = 1; k <= 8; k++) {
          const tx = Math.max(ev.startX, pulse.x - k * 0.015);
          const tpx = sp.x + tx * sp.w;
          const tpy = sp.y + actualRibbonY(tx, tx < 0.5 ? 0 : ev.seamShear) * sp.h;
          ctx.fillStyle = `rgba(163, 231, 190, ${0.85 - k * 0.09})`;
          ctx.beginPath();
          ctx.arc(tpx, tpy, Math.max(1.5, 6 - k * 0.55), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 撞断在中缝错牙处：迸裂红星 + 提示
        const breakY = sp.y + ev.leftExitY * sp.h;
        pulse.sparks.forEach((s) => {
          ctx.fillStyle = PALETTE.danger;
          ctx.beginPath();
          ctx.arc(midX + s.x, breakY + s.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.font = `700 11px ${FONT_ZH}`;
        ctx.fillStyle = "#FFD2DA";
        ctx.textAlign = "center";
        ctx.fillText("× 光流在中缝错牙处撞断", midX, breakY - 18);
      }
    }

    ctx.restore(); // 结束跨页裁剪

    // 跨页外框细边
    ctx.strokeStyle = ev.score === 4 ? "rgba(163, 231, 190, 0.58)" : "rgba(136, 111, 167, 0.55)";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(sp.x + 0.5, sp.y + 0.5, sp.w - 1, sp.h - 1);

    // 12. 底部实时实体书脊纸弧剖面
    drawSpineProfile(prof, state, ev);

    ctx.restore();
  }

  // ---------- 指针与触屏交互（兼容手机纵滑不卡页面 + perf 中心横拖！） ----------
  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function inBox(pt, box) {
    return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = toLocal(e);
    const state = getState();

    // 1. 点中书脊顶部工艺签：直接循环切换装订工艺
    if (inBox(pt, hitZones.spineBadge)) {
      const order = ["perfect", "saddle", "layflat"];
      const next = order[(order.indexOf(state.binding) + 1) % order.length];
      onMutate({ binding: next });
      return;
    }

    // 2. 抓住中缝接缝节点：上下拖对齐错牙
    let mode = "ribbon";
    if (dist(pt.x, pt.y, hitZones.seamNode.x, hitZones.seamNode.y) <= hitZones.seamNode.r) {
      mode = "seam";
    } else if (
      dist(pt.x, pt.y, hitZones.leftWing.x, hitZones.leftWing.y) <= hitZones.leftWing.r ||
      dist(pt.x, pt.y, hitZones.rightWing.x, hitZones.rightWing.y) <= hitZones.rightWing.r
    ) {
      mode = "ribbon";
    } else if (inBox(pt, hitZones.titleBox)) {
      mode = "title";
    } else {
      mode = "ribbon";
    }

    drag = {
      mode,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: pt.x,
      startY: pt.y,
      origSpan: state.spanReach,
      origShear: state.seamShear,
      origTitle: state.titleOffset,
      moved: false,
      axisLocked: null,
    };
    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    }
  }

  function onPointerMove(e) {
    const pt = toLocal(e);
    if (!drag || e.pointerId !== drag.pointerId) {
      // 鼠标悬停更新光标样式
      if (e.pointerType === "mouse") {
        if (inBox(pt, hitZones.spineBadge)) canvas.style.cursor = "pointer";
        else if (dist(pt.x, pt.y, hitZones.seamNode.x, hitZones.seamNode.y) <= hitZones.seamNode.r) canvas.style.cursor = "ns-resize";
        else if (inBox(pt, hitZones.titleBox)) canvas.style.cursor = "ew-resize";
        else canvas.style.cursor = "grab";
      }
      return;
    }

    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    const sp = hitZones.spread;
    if (sp.w < 10) return;

    // 触屏下若在开放区竖向滑动为主（非接缝节点），让位给页面纵向滚动
    if (drag.pointerType === "touch" && drag.mode !== "seam" && !drag.axisLocked) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        drag = null;
        return;
      }
      if (Math.abs(dx) > 6) drag.axisLocked = "x";
    }

    if (drag.mode === "seam") {
      // 在中缝节点上：竖向为主调错牙 ΔY，横向为主平滑切换为拉展贯穿度
      if (!drag.axisLocked && Math.hypot(dx, dy) > 6) {
        drag.axisLocked = Math.abs(dx) > Math.abs(dy) * 1.25 ? "x" : "y";
      }
      if (drag.axisLocked === "x") {
        let nextSpan = clamp(drag.origSpan + (dx / (sp.w * 0.46)) * 0.72, 0.36, 1.0);
        if (nextSpan > 0.975) nextSpan = 1.0;
        onMutate({ spanReach: Number(nextSpan.toFixed(3)) });
      } else {
        let nextShear = clamp(drag.origShear + dy / sp.h, -0.26, 0.26);
        if (Math.abs(nextShear) < 0.016) nextShear = 0; // 靠近 0mm 轻吸附
        onMutate({ seamShear: Number(nextShear.toFixed(3)) });
      }
      return;
    }

    if (drag.mode === "title") {
      let nextTitle = clamp(drag.origTitle + dx / sp.w, -0.26, 0.26);
      if (Math.abs(nextTitle) < 0.012) nextTitle = 0; // 字间隙骑缝轻吸附
      onMutate({ titleOffset: Number(nextTitle.toFixed(3)) });
      return;
    }

    // 开放区/色带横拖：拉展贯穿延展度，同时微调上下（鼠标）可辅助对齐
    const deltaSpan = (dx / (sp.w * 0.48)) * 0.65;
    let nextSpan = clamp(drag.origSpan + deltaSpan, 0.36, 1.0);
    if (nextSpan > 0.975) nextSpan = 1.0;
    const patch = { spanReach: Number(nextSpan.toFixed(3)) };
    if (drag.pointerType === "mouse" && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 0.9) {
      let nextShear = clamp(drag.origShear + dy / sp.h, -0.26, 0.26);
      if (Math.abs(nextShear) < 0.016) nextShear = 0;
      patch.seamShear = Number(nextShear.toFixed(3));
    }
    onMutate(patch);
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const pt = toLocal(e);
    const wasMoved = drag.moved;
    const sp = hitZones.spread;
    drag = null;

    if (!wasMoved && inBox(pt, sp)) {
      const state = getState();
      // 点击右页空白底场：直接切换统一/割裂底场
      if (pt.x > sp.x + sp.w * 0.52 && !inBox(pt, hitZones.titleBox)) {
        onMutate({ unifyGround: state.unifyGround === "unified" ? "split" : "unified" });
      }
    }
  }

  // 同时支持原生 touchstart/touchmove（确保 perf.mjs 的 Input.dispatchTouchEvent 在任何场景都 100% 流畅触发！）
  let touchDrag = null;
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    const state = getState();
    let mode = "ribbon";
    if (dist(pt.x, pt.y, hitZones.seamNode.x, hitZones.seamNode.y) <= hitZones.seamNode.r) mode = "seam";
    else if (inBox(pt, hitZones.titleBox)) mode = "title";
    touchDrag = {
      mode,
      startX: pt.x,
      startY: pt.y,
      origSpan: state.spanReach,
      origShear: state.seamShear,
      origTitle: state.titleOffset,
      locked: null,
    };
  }

  function onTouchMove(e) {
    if (!touchDrag || e.touches.length !== 1) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const dx = t0.clientX - r.left - touchDrag.startX;
    const dy = t0.clientY - r.top - touchDrag.startY;
    const sp = hitZones.spread;
    if (sp.w < 10) return;

    if (!touchDrag.locked) {
      if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 4) touchDrag.locked = "x";
      else if (touchDrag.mode === "seam" && Math.abs(dy) > 4) touchDrag.locked = "y";
      else if (Math.abs(dy) > Math.abs(dx) * 1.4 && Math.abs(dy) > 8) {
        touchDrag = null; // 放行页面垂直滚动
        return;
      }
    }
    if (!touchDrag.locked) return;
    e.preventDefault();

    if (touchDrag.mode === "seam" && touchDrag.locked === "y") {
      let nextShear = clamp(touchDrag.origShear + dy / sp.h, -0.26, 0.26);
      if (Math.abs(nextShear) < 0.016) nextShear = 0;
      onMutate({ seamShear: Number(nextShear.toFixed(3)) });
    } else if (touchDrag.mode === "title") {
      let nextTitle = clamp(touchDrag.origTitle + dx / sp.w, -0.26, 0.26);
      if (Math.abs(nextTitle) < 0.012) nextTitle = 0;
      onMutate({ titleOffset: Number(nextTitle.toFixed(3)) });
    } else {
      let nextSpan = clamp(touchDrag.origSpan + (dx / (sp.w * 0.46)) * 0.72, 0.36, 1.0);
      if (nextSpan > 0.975) nextSpan = 1.0;
      onMutate({ spanReach: Number(nextSpan.toFixed(3)) });
    }
  }

  function onTouchEnd() {
    touchDrag = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  const ctrl = loop(canvas, render);
  resize();
  ctrl.draw();

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
    triggerPulse,
  };
}
