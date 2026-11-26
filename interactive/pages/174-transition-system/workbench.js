// 174 过渡系统 · 开场「四屏透视过渡通道与光流检验台」2D Canvas
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { PAL, clamp, lerp, mixHex, rgba } from "./palette.js";
import { MORPH_NAMES, SPECIMENS, computeGeometry, evaluate, stagePalette } from "./model.js";

// 绘制可插值的方↔圆方↔正圆图形（morph: 0=硬方, 0.5=圆方, 1=正圆）
function traceMorphShape(ctx, cx, cy, r, morph) {
  if (morph >= 0.96) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    return;
  }
  const half = r * lerp(0.92, 1.0, morph);
  const rad = clamp(morph * half, 0, half);
  const x = cx - half;
  const y = cy - half;
  const s = half * 2;
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + s - rad, y);
  ctx.quadraticCurveTo(x + s, y, x + s, y + rad);
  ctx.lineTo(x + s, y + s - rad);
  ctx.quadraticCurveTo(x + s, y + s, x + s - rad, y + s);
  ctx.lineTo(x + rad, y + s);
  ctx.quadraticCurveTo(x, y + s, x, y + s - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawPanelQuad(ctx, p, fillStyle, strokeStyle, highlight) {
  ctx.beginPath();
  ctx.moveTo(p.x, p.yTL);
  ctx.lineTo(p.x + p.w, p.yTR);
  ctx.lineTo(p.x + p.w, p.yBR);
  ctx.lineTo(p.x, p.yBL);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = highlight ? 1.8 : 1;
    ctx.stroke();
  }
}

function drawDashedArrow(ctx, x1, y1, x2, y2, broken, label, compact) {
  ctx.save();
  ctx.strokeStyle = broken ? PAL.errLight : PAL.ink;
  ctx.fillStyle = broken ? PAL.errLight : PAL.ink;
  ctx.lineWidth = broken ? 1.8 : 1.3;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  if (broken) {
    const mx = (x1 + x2) * 0.5;
    ctx.lineTo(mx - 4, y1);
    ctx.moveTo(mx + 4, y2);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 箭头头部
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = compact ? 5.5 : 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
  ctx.stroke();

  if (broken && label && !compact) {
    ctx.font = '700 10px "Space Mono", monospace';
    const tw = ctx.measureText(label).width + 10;
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5 - 16;
    ctx.fillStyle = PAL.errLight;
    ctx.fillRect(mx - tw * 0.5, my - 9, tw, 17);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mx, my);
  }
  ctx.restore();
}

// 1:1 复刻原海报的跨屏立体暖色渐融光带（从第 3 屏流向第 4 屏盘旋成焦点巨瓣，并向左下淡出收束）
function drawFlowRibbon(ctx, geom, state, colors, intro, compact) {
  const p2 = geom.panels[2];
  const p3 = geom.panels[3];
  const r3 = geom.radii[3];
  const r2 = geom.radii[2];
  const focusCx = p3.cx + p3.w * 0.04;
  const focusCy = p3.cy + p3.hAvg * 0.02;

  // 若连贯度不足导致裂口，光带在第 3–4 屏交界处真的撕裂断开
  const gap = geom.bridgeGapPx;
  const bridgeEndX = p3.x - gap * 0.35;
  const startX = p2.cx + r2 * 0.45;
  const startY = p2.cy + r2 * 0.25;

  // 计算扫入动画进度（0.9 秒截图时已基本展开，确保任何瞬间都好看）
  const sweep = clamp(intro, 0.25, 1);

  ctx.save();
  // 1) 右屏后侧巨型暖金焦点弧瓣 + 向下向左优雅回流的立体宽带（完全对应原海报右下主体）
  const blobR = r3 * (0.98 + 0.16 * clamp(state.cohesion, 0, 1)) * sweep;
  const tailX = geom.padX + geom.usableW * 0.14;
  const tailY = geom.h * 0.94;

  // 下方宽阔渐淡尾带（原海报左下至右中盘旋光带）
  const gradRibbon = ctx.createLinearGradient(tailX, tailY, focusCx + blobR * 0.6, focusCy - blobR * 0.8);
  if (state.colorMode === "gradient") {
    gradRibbon.addColorStop(0, rgba(PAL.coralSoft, 0.04));
    gradRibbon.addColorStop(0.28, rgba(PAL.coral, 0.62));
    gradRibbon.addColorStop(0.62, rgba(PAL.orange, 0.94));
    gradRibbon.addColorStop(1, rgba(PAL.gold, 0.98));
  } else if (state.colorMode === "clash") {
    gradRibbon.addColorStop(0, rgba(PAL.clashA, 0.08));
    gradRibbon.addColorStop(0.45, rgba(PAL.clashB, 0.72));
    gradRibbon.addColorStop(1, rgba(PAL.clashD, 0.92));
  } else {
    gradRibbon.addColorStop(0, rgba(PAL.flatGray, 0.05));
    gradRibbon.addColorStop(0.55, rgba(PAL.flatGray, 0.56));
    gradRibbon.addColorStop(1, rgba("#7B748A", 0.82));
  }

  // 主体宽幅流动缎带（当有裂口时，右端被裁断后缩并标出红虚线缺口）
  const ribbonAlpha = gap > 0 ? 0.55 : 0.96;
  ctx.globalAlpha = ribbonAlpha;
  ctx.fillStyle = gradRibbon;
  ctx.beginPath();
  // 焦点巨瓣外弧（高饱和金→橙→珊瑚）
  const topArchY = focusCy - blobR * 1.12;
  const rightApexX = focusCx + blobR * 0.92;
  const rightLowY = focusCy + blobR * 1.18;
  ctx.moveTo(tailX, tailY);
  ctx.bezierCurveTo(
    lerp(tailX, focusCx, 0.34), tailY - geom.usableH * 0.28,
    focusCx - blobR * 0.55, focusCy + blobR * 0.45,
    focusCx - blobR * 0.36, topArchY + blobR * 0.25
  );
  ctx.bezierCurveTo(
    focusCx + blobR * 0.05, topArchY - blobR * 0.28,
    rightApexX + blobR * 0.24, focusCy - blobR * 0.52,
    rightApexX, focusCy + blobR * 0.14
  );
  ctx.bezierCurveTo(
    rightApexX - blobR * 0.08, rightLowY,
    focusCx - blobR * 0.32, focusCy + blobR * 1.02,
    p3.x + 2, p3.yBL + 4
  );
  ctx.bezierCurveTo(
    lerp(tailX, p3.x, 0.58), geom.h * 0.96,
    lerp(tailX, p3.x, 0.30), geom.h * 0.98,
    tailX + geom.usableW * 0.12, tailY + 12
  );
  ctx.closePath();
  ctx.fill();

  // 2) 第 3 屏圆群流出并汇入第 4 屏的过渡桥接颈部
  if (gap === 0) {
    const neckGrad = ctx.createLinearGradient(startX, startY, focusCx, focusCy);
    neckGrad.addColorStop(0, rgba(colors[2], 0.30));
    neckGrad.addColorStop(0.55, rgba(mixHex(colors[2], colors[3], 0.55), 0.72));
    neckGrad.addColorStop(1, rgba(colors[3], 0.96));
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(startX, startY - r2 * 0.48);
    ctx.bezierCurveTo(
      lerp(startX, focusCx, 0.45), startY - r2 * 0.12,
      p3.x - 10, focusCy - blobR * 0.38,
      focusCx - blobR * 0.22, focusCy - blobR * 0.72
    );
    ctx.lineTo(focusCx - blobR * 0.05, focusCy + blobR * 0.35);
    ctx.bezierCurveTo(
      p3.x - 12, focusCy + blobR * 0.25,
      lerp(startX, focusCx, 0.48), startY + r2 * 0.62,
      startX - r2 * 0.15, startY + r2 * 0.58
    );
    ctx.closePath();
    ctx.fill();

    // 焦点高光内瓣（模拟原海报丝带翻转出的柔和亮桃白光泽）
    const innerGrad = ctx.createLinearGradient(focusCx - blobR * 0.35, topArchY, focusCx + blobR * 0.25, focusCy + blobR * 0.45);
    innerGrad.addColorStop(0, "rgba(255,244,234,0.72)");
    innerGrad.addColorStop(0.55, rgba(colors[3], 0.48));
    innerGrad.addColorStop(1, rgba(colors[2], 0.0));
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(focusCx - blobR * 0.05, focusCy - blobR * 0.15, blobR * 0.48, blobR * 0.72, -0.14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 裂口状态：绘制在第 3 屏右缘戛然而止的残带 + 醒目红色断层标尺
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = rgba(colors[2], 0.45);
    ctx.beginPath();
    ctx.moveTo(startX, startY - r2 * 0.36);
    ctx.lineTo(bridgeEndX - 10, startY + 2);
    ctx.lineTo(bridgeEndX - 16, startY + r2 * 0.44);
    ctx.lineTo(startX, startY + r2 * 0.36);
    ctx.closePath();
    ctx.fill();

    // 红色断层双虚线与裂口读数
    const gx1 = p2.x + p2.w + 2;
    const gx2 = p3.x - 2;
    const gy = (p2.cy + p3.cy) * 0.5;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = PAL.errLight;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(gx1, gy - 26);
    ctx.lineTo(gx1, gy + 26);
    ctx.moveTo(gx2, gy - 26);
    ctx.lineTo(gx2, gy + 26);
    ctx.stroke();
    ctx.setLineDash([]);

    const lbl = compact ? `裂 ${gap}px` : `断连 ${gap}px`;
    ctx.font = '700 10px "Space Mono", monospace';
    const tw = ctx.measureText(lbl).width + 10;
    const mx = (gx1 + gx2) * 0.5;
    ctx.fillStyle = PAL.errLight;
    ctx.fillRect(mx - tw * 0.5, gy - 10, tw, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl, mx, gy);
  }
  ctx.restore();
}

// 渲染「原海报 · 几何光带」标本的四屏内容
function drawPosterSpecimen(ctx, geom, state, colors, compact) {
  const { panels, radii, overlapRatio } = geom;

  // 第 1 屏：起点单形
  {
    const p = panels[0], r = radii[0];
    ctx.fillStyle = colors[0];
    traceMorphShape(ctx, p.cx, p.cy, r, state.morphs[0]);
    ctx.fill();
  }

  // 第 2 屏：双形交叠（交叠距离随连贯度实时缩放）
  {
    const p = panels[1], r = radii[1];
    const sep = lerp(r * 1.18, r * 0.44, clamp(overlapRatio, 0, 1));
    const rA = r * 0.88;
    const rB = r * 0.96;
    ctx.save();
    ctx.fillStyle = rgba(colors[0], 0.86);
    traceMorphShape(ctx, p.cx - sep * 0.52, p.cy, rA, lerp(state.morphs[0], state.morphs[1], 0.5));
    ctx.fill();
    ctx.fillStyle = rgba(colors[1], 0.84);
    traceMorphShape(ctx, p.cx + sep * 0.52, p.cy + r * 0.04, rB, state.morphs[1]);
    ctx.fill();
    // 交叠区光学增亮感（用纯 alpha 叠画代替 multiply，避免软件渲染 flush 管线）
    if (sep < rA + rB - 2) {
      ctx.fillStyle = rgba("#DE5F28", 0.32);
      traceMorphShape(ctx, p.cx, p.cy + r * 0.02, Math.min(rA, rB) * 0.52, state.morphs[1]);
      ctx.fill();
    }
    ctx.restore();
  }

  // 第 3 屏：四连渐增叠加列（1:1 复刻原海报第 3 块面板的渐大叠加圆链）
  {
    const p = panels[2], r = radii[2];
    const count = 4;
    const spread = lerp(p.w * 0.36, p.w * 0.22, clamp(overlapRatio, 0, 1));
    const startX = p.cx - spread;
    const endX = p.cx + spread * 0.72;
    for (let k = 0; k < count; k++) {
      const f = k / (count - 1);
      const rk = lerp(r * 0.34, r * 1.0, f);
      const xk = lerp(startX, endX, f);
      const yk = p.cy + lerp(-r * 0.06, r * 0.08, f);
      const alpha = lerp(0.38, 0.92, f);
      const col = mixHex(colors[0], colors[2], f);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      traceMorphShape(ctx, xk, yk, rk, lerp(state.morphs[1], state.morphs[2], f));
      ctx.fill();
      ctx.restore();
    }
  }

  // 第 4 屏：焦点几何锚环（在熔流光带之上给出清晰形态轮廓与比例锚点）
  {
    const p = panels[3], r = radii[3];
    const cx = p.cx + p.w * 0.04;
    const cy = p.cy + p.hAvg * 0.02;
    ctx.save();
    ctx.strokeStyle = rgba(PAL.ink, 0.22);
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);
    traceMorphShape(ctx, cx, cy, r, state.morphs[3]);
    ctx.stroke();
    ctx.setLineDash([]);
    // 中心轻锚点
    ctx.fillStyle = rgba("#FFFBF4", 0.92);
    ctx.beginPath();
    ctx.arc(cx, cy, compact ? 3.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 渲染「字阶 · 错层排印」标本（致敬 Kimberly Elam 错层带状过渡）
function drawTypeSpecimen(ctx, geom, state, colors, compact) {
  const { panels, radii, overlapRatio } = geom;
  const spec = SPECIMENS.type.stages;
  for (let i = 0; i < 4; i++) {
    const p = panels[i];
    const r = radii[i];
    const col = colors[i];
    const cx = p.cx;
    const cy = p.cy;
    const m = state.morphs[i];

    ctx.save();
    // 形态色块底带（随 morphs 切换硬切矩形 / 圆角卡 / 胶囊）
    const bandW = clamp(r * 2.1, p.w * 0.36, p.w * 0.86);
    const bandH = clamp(r * 0.88, 16, p.hAvg * 0.34);
    const rad = m * (bandH * 0.5);
    const shiftX = (i - 1.5) * lerp(14, 4, clamp(overlapRatio, 0, 1)) * (compact ? 0.45 : 0.8);

    // 绘制多条错层文字带（从 1 条逐步增厚到焦点巨标带）
    const lines = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : 2;
    for (let ln = 0; ln < lines; ln++) {
      const ly = cy + (ln - (lines - 1) * 0.5) * (bandH * 0.58 + 5);
      const lx = cx - bandW * 0.5 + shiftX + (ln % 2 === 0 ? -4 : 6);
      const lw = bandW * (ln === lines - 1 ? 1 : 0.78);
      const lh = bandH * (i === 3 ? 0.62 : 0.42);
      ctx.fillStyle = ln === lines - 1 ? col : rgba(col, 0.36);
      ctx.beginPath();
      ctx.roundRect(lx, ly - lh * 0.5, lw, lh, Math.min(rad, lh * 0.5));
      ctx.fill();
    }

    // 居中标示真实字号层次（从比例单真源换算为示意字号）
    const pt = Math.round(clamp(10 + state.scales[i] * 14, 12, 46));
    const fontPx = clamp(Math.round(r * 0.46), compact ? 10 : 11, compact ? 16 : 24);
    ctx.fillStyle = PAL.ink;
    ctx.font = `${i >= 2 ? 900 : 700} ${fontPx}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = i === 0 ? "轻序" : i === 1 ? "错层承接" : i === 2 ? "阶梯加粗" : "焦点大标";
    ctx.fillText(text, cx, cy - bandH * 0.72 - 6);

    ctx.fillStyle = PAL.inkMuted;
    ctx.font = '700 10px "Space Mono", monospace';
    ctx.fillText(`${pt}pt`, cx, cy + bandH * 0.85 + 8);
    ctx.restore();
  }
}

// 渲染「产品 · 叙事长廊」标本
function drawProductSpecimen(ctx, geom, state, colors, compact) {
  const { panels, radii } = geom;
  const spec = SPECIMENS.product.stages;
  for (let i = 0; i < 4; i++) {
    const p = panels[i];
    const r = radii[i];
    const m = state.morphs[i];
    const col = colors[i];
    const cw = clamp(r * 2.05, p.w * 0.42, p.w * 0.86);
    const ch = clamp(r * 1.65, 34, p.hAvg * 0.68);
    const rad = m * Math.min(cw, ch) * 0.32;

    ctx.save();
    ctx.fillStyle = i === 3 ? PAL.darkRoom : "#FBF9FD";
    ctx.strokeStyle = i === 3 ? col : rgba(PAL.ink, 0.22);
    ctx.lineWidth = i === 3 ? 2 : 1.2;
    ctx.beginPath();
    ctx.roundRect(p.cx - cw * 0.5, p.cy - ch * 0.5, cw, ch, rad);
    ctx.fill();
    ctx.stroke();

    // 卡片顶色条/徽章
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(p.cx - cw * 0.36, p.cy - ch * 0.30, cw * 0.72, Math.max(6, ch * 0.16), rad * 0.5);
    ctx.fill();

    // 卡内文字
    ctx.fillStyle = i === 3 ? "#FFFFFF" : PAL.ink;
    ctx.font = `700 ${clamp(Math.round(r * 0.34), 10, compact ? 13 : 16)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spec[i].title, p.cx, p.cy + ch * 0.08);

    if (!compact || i === 3) {
      ctx.fillStyle = i === 3 ? PAL.goldBright : PAL.inkMuted;
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillText(spec[i].tag, p.cx, p.cy + ch * 0.30);
    }
    ctx.restore();
  }
}

export function mountWorkbench(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  const pulse = { active: false, progress: 0, bouncePhase: 0, msg: "" };
  let intro = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let lastSizeKey = "";
  let lastGeom = null;
  let lastEval = null;
  let morphBtnRects = [];
  let hoverStage = -1;

  // 拖拽状态机：区分「竖拖改某屏尺度」与「横拖改跨屏连贯度」
  const drag = {
    active: false,
    pointerId: null,
    mode: null, // "pending" | "cohesion" | "scale"
    stageIdx: -1,
    startX: 0,
    startY: 0,
    startCohesion: 0,
    startScale: 0,
    moved: false,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(300, Math.round(rect.width));
    const ch = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(cw < 560 ? 1.5 : 2);
    const key = `${cw}x${ch}@${dpr}`;
    if (key !== lastSizeKey || canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      lastSizeKey = key;
      dirty = true;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: cw, h: ch };
  }

  function render(t, dt, { still }) {
    if (still && intro < 1) {
      intro = 1;
      dirty = true;
    } else if (!still && intro < 1) {
      intro = clamp(intro + dt * 2.1, 0, 1);
      dirty = true;
    }

    // 视线光球推进逻辑
    if (pulse.active && !still) {
      dirty = true;
      const ev = lastEval || evaluate(state, computeGeometry(state, 900, 420));
      const stopNorm = ev.pulseStopStage === -1 ? 1.0 : (ev.pulseStopStage + 0.08) / 3.2;
      pulse.progress += dt * 0.52;
      if (ev.pulseStopStage !== -1 && pulse.progress >= stopNorm) {
        pulse.progress = stopNorm;
        pulse.bouncePhase += dt * 7;
        pulse.msg = ev.pulseStopMsg;
        if (pulse.bouncePhase > 7.5) {
          pulse.active = false;
          pulse.progress = 0;
          pulse.bouncePhase = 0;
        }
      } else if (pulse.progress >= 1.08) {
        pulse.active = false;
        pulse.progress = 0;
        pulse.bouncePhase = 0;
      }
    }

    const { w, h } = resize();
    if (!dirty) return;
    dirty = false;

    const compact = w < 560;
    const geom = computeGeometry(state, w, h);
    const ev = evaluate(state, geom);
    lastGeom = geom;
    lastEval = ev;

    // 1. 冷丁香雾白纯色铺底（与原海报底色一致，且零全屏像素插值开销）
    ctx.fillStyle = PAL.mistBg;
    ctx.fillRect(0, 0, w, h);

    // 极细结构基线（标尺开启时显示起点→焦点透视顶底辅助线）
    if (state.showGuides) {
      ctx.save();
      ctx.strokeStyle = rgba(PAL.ink, 0.10);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      const p0 = geom.panels[0], p3 = geom.panels[3];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.yTL);
      ctx.lineTo(p3.x + p3.w, p3.yTR);
      ctx.moveTo(p0.x, p0.yBL);
      ctx.lineTo(p3.x + p3.w, p3.yBR);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 2. 四块透视序列展板
    const panelFills = [PAL.panel1, PAL.panel2, PAL.panel3, PAL.panel4Top];
    const specStages = SPECIMENS[state.specimen].stages;
    morphBtnRects = [];

    for (let i = 0; i < 4; i++) {
      const p = geom.panels[i];
      const reveal = clamp(intro * 1.4 - i * 0.12, 0.15, 1);
      ctx.save();
      ctx.globalAlpha = reveal;

      let panelFill = panelFills[i];
      if (!compact) {
        const pg = ctx.createLinearGradient(p.x, p.yTL, p.x + p.w, p.yBR);
        pg.addColorStop(0, panelFills[i]);
        pg.addColorStop(1, i === 3 ? PAL.panel4Bot : mixHex(panelFills[i], "#DDD8E8", 0.35));
        panelFill = pg;
      }

      const isSel = state.selectedStage === i || hoverStage === i;
      const hasStageErr = ev.defects.some((d) => d.stage === i);
      const stroke = hasStageErr
        ? rgba(PAL.errLight, 0.72)
        : isSel
        ? rgba(PAL.ink, 0.55)
        : rgba(PAL.panelStroke, 0.52);

      drawPanelQuad(ctx, p, panelFill, stroke, isSel || hasStageErr);

      // 面板顶部编号与阶段名（窄屏与第 4 屏自动避让右上状态胶囊，绝不撞字）
      const tightPanel = p.w < 118;
      const topLabelY = i === 3 ? Math.max(36, p.yTL - 6) : Math.min(p.yTL, p.yTR) - 6;
      ctx.fillStyle = PAL.inkMuted;
      ctx.font = `700 ${tightPanel ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(tightPanel ? `${specStages[i].code}${specStages[i].name}` : `${specStages[i].code} ${specStages[i].name}`, p.x + 4, topLabelY);

      // 实时尺度读数：宽屏放面板外右上角（第 4 屏放面板内左上角以彻底避开顶右红章）；窄屏放面板内底左角
      const rel = i === 0 ? "1.00×" : `${(geom.radii[i] / Math.max(1, geom.radii[0])).toFixed(2)}×`;
      ctx.fillStyle = hasStageErr ? PAL.errLight : PAL.ink;
      if (tightPanel) {
        ctx.font = '700 10px "Space Mono", "Noto Sans SC", monospace';
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(rel, p.x + 6, Math.min(p.yBL, p.yBR) - 5);
      } else if (i === 3) {
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(rel, p.x + 10, p.yTL + 8);
      } else {
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(rel, p.x + p.w - 4, topLabelY);
      }
      ctx.restore();
    }

    const colors = stagePalette(state.colorMode);

    // 3. 在第 4 屏上先铺跨屏立体暖色熔流光带（仅原海报与产品模式绘制全幅光带，字阶模式用轻流带）
    if (state.specimen === "poster") {
      drawFlowRibbon(ctx, geom, state, colors, intro, compact);
      drawPosterSpecimen(ctx, geom, state, colors, compact);
    } else if (state.specimen === "type") {
      ctx.save();
      ctx.globalAlpha = 0.38;
      drawFlowRibbon(ctx, geom, state, colors, intro, compact);
      ctx.restore();
      drawTypeSpecimen(ctx, geom, state, colors, compact);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.42;
      drawFlowRibbon(ctx, geom, state, colors, intro, compact);
      ctx.restore();
      drawProductSpecimen(ctx, geom, state, colors, compact);
    }

    // 4. 屏间虚线引导箭（第 1→2、2→3）与比例标尺
    for (let i = 0; i < 2; i++) {
      const a = geom.panels[i], b = geom.panels[i + 1];
      const stepR = geom.stepRatios[i];
      const isBadStep = stepR < 1.03 || stepR > 2.55;
      const lbl = stepR < 1.03 ? `倒挂 ×${stepR.toFixed(2)}` : stepR > 2.55 ? `断崖 ×${stepR.toFixed(2)}` : "";
      drawDashedArrow(ctx, a.x + a.w + 3, a.cy, b.x - 3, b.cy, isBadStep, lbl, compact);
    }

    // 第 3→4 屏比例异常标注（如断崖或倒挂）
    if (geom.stepRatios[2] < 1.03 || geom.stepRatios[2] > 2.55) {
      const a = geom.panels[2], b = geom.panels[3];
      const mx = (a.x + a.w + b.x) * 0.5;
      const my = Math.min(a.yTR, b.yTL) + 18;
      const txt = geom.stepRatios[2] < 1.03 ? `倒挂 ×${geom.stepRatios[2].toFixed(2)}` : `断崖 ×${geom.stepRatios[2].toFixed(2)}`;
      ctx.save();
      ctx.font = '700 10px "Space Mono", monospace';
      const tw = ctx.measureText(txt).width + 10;
      ctx.fillStyle = PAL.errLight;
      ctx.fillRect(mx - tw * 0.5, my - 9, tw, 18);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, mx, my);
      ctx.restore();
    }

    // 5. 每屏底沿可点击形态徽标（□ / ▢ / ○）与纵拖微提示点
    for (let i = 0; i < 4; i++) {
      const p = geom.panels[i];
      const mInfo = MORPH_NAMES[state.morphs[i]] || MORPH_NAMES[1];
      const btnW = compact ? 36 : 54;
      const btnH = 22;
      const bx = p.cx - btnW * 0.5;
      const by = Math.max(p.yBL, p.yBR) + 8;
      const safeBy = Math.min(by, h - btnH - 6);
      morphBtnRects.push({ i, x: bx, y: safeBy, w: btnW, h: btnH });

      ctx.save();
      ctx.fillStyle = state.selectedStage === i ? PAL.ink : rgba("#FFFFFF", 0.84);
      ctx.strokeStyle = state.selectedStage === i ? PAL.ink : rgba(PAL.ink, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, safeBy, btnW, btnH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = state.selectedStage === i ? "#FFFFFF" : PAL.ink;
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(compact ? mInfo.sym : `${mInfo.sym} ${mInfo.label}`, bx + btnW * 0.5, safeBy + btnH * 0.5 + 0.5);
      ctx.restore();

      // 选中屏顶部微弱上下箭头指示可纵拖尺度
      if (state.selectedStage === i && state.showGuides) {
        const nodeY = p.cy - geom.radii[i] - 8;
        ctx.save();
        ctx.fillStyle = PAL.ink;
        ctx.font = '700 10px "Space Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText("↕", p.cx, Math.max(p.yTL + 12, nodeY));
        ctx.restore();
      }
    }

    // 6. 画布左上 & 右上极简实测状态徽（单真源数字）
    ctx.save();
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
    ctx.textBaseline = "middle";
    const metaText = compact
      ? `连贯 ${ev.metrics.cohesionPct} · 首尾 ${ev.metrics.totalRatioText}`
      : `连贯 ${ev.metrics.cohesionPct} · 首尾 ${ev.metrics.totalRatioText} · 形态 ${ev.metrics.morphSeq} · ${ev.metrics.bridgeText}`;
    ctx.fillStyle = PAL.inkMuted;
    ctx.textAlign = "left";
    ctx.fillText(metaText, geom.padX, 16);

    const badgeText = ev.badge;
    const bw = ctx.measureText(badgeText).width + 16;
    const bx = w - geom.padX - bw;
    ctx.fillStyle = ev.isSolved ? PAL.okLight : PAL.errLight;
    ctx.fillRect(bx, 6, bw, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, bx + bw * 0.5, 16.5);
    ctx.restore();

    // 7. 视线脉冲光球实测动画
    if (pulse.active) {
      const pts = geom.nodes;
      const seg = clamp(pulse.progress * 3, 0, 3);
      const idx = Math.min(2, Math.floor(seg));
      const localT = seg - idx;
      let px = lerp(pts[idx].x, pts[idx + 1].x, localT);
      let py = lerp(pts[idx].y, pts[idx + 1].y, localT);
      const isBlocked = ev.pulseStopStage !== -1 && pulse.bouncePhase > 0;
      if (isBlocked) {
        px += Math.sin(pulse.bouncePhase * 3.2) * 8;
      }

      ctx.save();
      // 轨迹虚线
      ctx.strokeStyle = isBlocked ? PAL.errLight : PAL.gold;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k <= idx; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.lineTo(px, py);
      ctx.stroke();

      // 光晕球
      const glow = ctx.createRadialGradient(px, py, 2, px, py, 22);
      glow.addColorStop(0, isBlocked ? PAL.errLight : "#FFFFFF");
      glow.addColorStop(0.4, isBlocked ? rgba(PAL.errLight, 0.72) : rgba(PAL.gold, 0.88));
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isBlocked ? PAL.errLight : PAL.ink;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // 撞停气泡
      if (isBlocked && pulse.msg) {
        ctx.font = '700 11px "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(pulse.msg).width + 16;
        const tx = clamp(px, geom.padX + tw * 0.5, w - geom.padX - tw * 0.5);
        const ty = Math.max(38, py - 28);
        ctx.fillStyle = PAL.errLight;
        ctx.fillRect(tx - tw * 0.5, ty - 11, tw, 22);
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pulse.msg, tx, ty);
      }
      ctx.restore();
    }
  }

  const ctrl = loop(canvas, render);

  function localPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function hitPanel(x, y) {
    if (!lastGeom) return -1;
    for (const p of lastGeom.panels) {
      if (x >= p.x - 6 && x <= p.x + p.w + 6 && y >= Math.min(p.yTL, p.yTR) - 10 && y <= Math.max(p.yBL, p.yBR) + 10) {
        return p.index;
      }
    }
    return -1;
  }

  function hitMorphBtn(x, y) {
    for (const b of morphBtnRects) {
      if (x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4) {
        return b.i;
      }
    }
    return -1;
  }

  function markDirtyAndDraw() {
    dirty = true;
    ctrl.draw();
  }

  function cycleMorph(idx) {
    const cur = state.morphs[idx];
    state.morphs[idx] = cur === 0 ? 0.5 : cur === 0.5 ? 1 : 0;
    state.selectedStage = idx;
    onChange("morph");
    markDirtyAndDraw();
  }

  function onStart(clientX, clientY, pointerId) {
    const { x, y } = localPos(clientX, clientY);
    const mb = hitMorphBtn(x, y);
    if (mb !== -1) {
      cycleMorph(mb);
      return false;
    }
    const pi = hitPanel(x, y);
    if (pi !== -1) state.selectedStage = pi;
    drag.active = true;
    drag.pointerId = pointerId;
    drag.mode = "pending";
    drag.stageIdx = pi;
    drag.startX = x;
    drag.startY = y;
    drag.startCohesion = state.cohesion;
    drag.startScale = pi !== -1 ? state.scales[pi] : 1;
    drag.moved = false;
    return true;
  }

  function onMove(clientX, clientY) {
    const { x, y } = localPos(clientX, clientY);
    if (!drag.active) {
      const pi = hitPanel(x, y);
      if (pi !== hoverStage) {
        hoverStage = pi;
        markDirtyAndDraw();
      }
      return;
    }
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (drag.mode === "pending" && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      // 垂直意图明显且按在展板上 → 改该屏比例尺度；否则横向拖动 → 连续改写跨屏连贯度
      if (drag.stageIdx !== -1 && Math.abs(dy) > Math.abs(dx) * 1.18) {
        drag.mode = "scale";
      } else {
        drag.mode = "cohesion";
      }
    }
    if (drag.mode === "cohesion") {
      const width = Math.max(240, canvas.getBoundingClientRect().width);
      let next = clamp(drag.startCohesion + (dx / (width * 0.65)), 0.16, 1.0);
      // 靠近 0.80 经典衔接带轻吸附
      if (Math.abs(next - 0.80) < 0.018) next = 0.80;
      state.cohesion = Number(next.toFixed(3));
      onChange("cohesion");
      dirty = true;
    } else if (drag.mode === "scale" && drag.stageIdx !== -1) {
      let next = clamp(drag.startScale - dy / 95, 0.42, 2.55);
      state.scales[drag.stageIdx] = Number(next.toFixed(2));
      onChange("scale");
      dirty = true;
    }
  }

  function onEnd() {
    if (!drag.active) return;
    if (!drag.moved && drag.stageIdx !== -1) {
      onChange("select");
      markDirtyAndDraw();
    }
    drag.active = false;
    drag.pointerId = null;
    drag.mode = null;
  }

  // 同时支持 PointerEvent 和原生 TouchEvent（兼容 perf.mjs 的 CDP Input.dispatchTouchEvent）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交给 touch 事件处理，避免双触发
    if (onStart(e.clientX, e.clientY, e.pointerId)) {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    onMove(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    onEnd();
  });
  canvas.addEventListener("pointercancel", onEnd);

  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    onStart(t0.clientX, t0.clientY, t0.identifier);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!drag.active || !e.touches.length) return;
    const t0 = e.touches[0];
    onMove(t0.clientX, t0.clientY);
    if (drag.mode === "cohesion") e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", onEnd, { passive: true });
  canvas.addEventListener("touchcancel", onEnd, { passive: true });

  // 键盘操作
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.cohesion = clamp(Number((state.cohesion + 0.05).toFixed(2)), 0.16, 1.0);
      onChange("cohesion");
      markDirtyAndDraw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.cohesion = clamp(Number((state.cohesion - 0.05).toFixed(2)), 0.16, 1.0);
      onChange("cohesion");
      markDirtyAndDraw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = state.selectedStage;
      state.scales[i] = clamp(Number((state.scales[i] + 0.12).toFixed(2)), 0.42, 2.55);
      onChange("scale");
      markDirtyAndDraw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = state.selectedStage;
      state.scales[i] = clamp(Number((state.scales[i] - 0.12).toFixed(2)), 0.42, 2.55);
      onChange("scale");
      markDirtyAndDraw();
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      state.selectedStage = Number(e.key) - 1;
      onChange("select");
      markDirtyAndDraw();
    } else if (e.key === "m" || e.key === "M") {
      cycleMorph(state.selectedStage);
    } else if (e.key === " ") {
      e.preventDefault();
      firePulse();
    }
  });

  function firePulse() {
    pulse.active = true;
    pulse.progress = 0;
    pulse.bouncePhase = 0;
    pulse.msg = "";
    markDirtyAndDraw();
  }

  return {
    draw: () => markDirtyAndDraw(),
    firePulse,
    getSnapshot: () => ({ geom: lastGeom, ev: lastEval }),
  };
}
