// 022 垂直构图 · 开场大画幅移轴立面构图台渲染与交互
// 100% 忠实于 022 原海报墨绿 × 暖米 × 哑金建筑版画语言，并完全由 model.js 实算驱动。

import { ASPECTS, EMPIRICAL, evaluateHero, projectPoint } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const PALETTE = {
  paper: "#F5ECDF",
  paperWarm: "#EFE4D3",
  deepGreen: "#1B4B3F",
  midGreen: "#25584B",
  sidebarGreen: "#10372E",
  charcoal: "#1E261F",
  sand: "#EAE0CF",
  taupe: "#CFC2AD",
  cream: "#F1E8DA",
  gold: "#D39939",
  goldLine: "#D9B266",
  goldGlow: "#E1B867",
  stairTop: "#F3EBDD",
  stairRiser: "#DFD1BC",
  alert: "#B83D28",
  alertSoft: "rgba(184, 61, 40, 0.22)",
  guideOk: "rgba(211, 153, 57, 0.72)",
  guideMuted: "rgba(16, 55, 46, 0.22)",
};

function toneColor(tone) {
  switch (tone) {
    case "deepGreen": return PALETTE.deepGreen;
    case "midGreen": return PALETTE.midGreen;
    case "charcoal": return PALETTE.charcoal;
    case "sand": return PALETTE.sand;
    case "taupe": return PALETTE.taupe;
    case "cream": return PALETTE.cream;
    default: return PALETTE.deepGreen;
  }
}

// 计算当前画幅在 canvas 内部居中裁切后的实体取景框矩形
export function computeFrameRect(w, h, aspectKey) {
  const asp = (ASPECTS[aspectKey] || ASPECTS["3:4"]).ratio;
  const padX = Math.max(12, Math.round(w * 0.035));
  const padY = Math.max(12, Math.round(h * 0.03));
  const availW = Math.max(80, w - padX * 2);
  const availH = Math.max(80, h - padY * 2);
  let fw = availW;
  let fh = fw / asp;
  if (fh > availH) {
    fh = availH;
    fw = fh * asp;
  }
  const fx = (w - fw) / 2;
  const fy = (h - fh) / 2;
  return { fx, fy, fw, fh };
}

function drawQuad(ctx, p0, p1, p2, p3, fill, stroke = null, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function toScreen(pt, rect) {
  return { x: rect.fx + pt.u * rect.fw, y: rect.fy + pt.v * rect.fh };
}

// 绘纪念碑建筑群底部：深绿斜肩稳基 + 白色门框 + 发光金门 + 逐级退进暖白阶梯（忠实原海报）
function drawMonumentBase(ctx, state, rect, reveal) {
  const P = (X, Y, Z) => toScreen(projectPoint(X, Y, Z, state), rect);

  // 阶梯前的暖石广场地坪（让底座稳扎画框下沿，移轴推过头时自然随底座下沉）
  const plaza = [
    P(-0.92, -0.18, 1.05),
    P(0.92, -0.18, 1.05),
    P(0.84, 0.02, 1.36),
    P(-0.84, 0.02, 1.36),
  ];
  drawQuad(ctx, ...plaza, "#E6D9C5");

  // 左右深绿斜肩基座（原海报下端深绿三角肩部）
  const shoulderL = [
    P(-0.78, -0.02, 1.34),
    P(-0.18, -0.02, 1.34),
    P(-0.18, 0.44 * reveal, 1.40),
    P(-0.78, 0.24 * reveal, 1.38),
  ];
  const shoulderR = [
    P(0.18, -0.02, 1.34),
    P(0.78, -0.02, 1.34),
    P(0.78, 0.24 * reveal, 1.38),
    P(0.18, 0.44 * reveal, 1.40),
  ];
  drawQuad(ctx, ...shoulderL, PALETTE.deepGreen);
  drawQuad(ctx, ...shoulderR, PALETTE.deepGreen);

  // 门洞外白框（原海报标志性暖白矩形门框）
  const frameOuter = [
    P(-0.17, 0.26, 1.39),
    P(0.17, 0.26, 1.39),
    P(0.17, 0.66 * reveal, 1.39),
    P(-0.17, 0.66 * reveal, 1.39),
  ];
  const frameInner = [
    P(-0.125, 0.28, 1.395),
    P(0.125, 0.28, 1.395),
    P(0.125, 0.62 * reveal, 1.395),
    P(-0.125, 0.62 * reveal, 1.395),
  ];
  drawQuad(ctx, ...frameOuter, PALETTE.stairTop);
  drawQuad(ctx, ...frameInner, PALETTE.deepGreen);

  // 内侧哑金发光门洞
  const goldDoor = [
    P(-0.048, 0.37, 1.41),
    P(0.048, 0.37, 1.41),
    P(0.048, 0.535 * reveal, 1.41),
    P(-0.048, 0.535 * reveal, 1.41),
  ];
  const dg = ctx.createLinearGradient(goldDoor[2].x, goldDoor[2].y, goldDoor[0].x, goldDoor[0].y);
  dg.addColorStop(0, PALETTE.gold);
  dg.addColorStop(1, "#EAD19A");
  drawQuad(ctx, ...goldDoor, dg);

  // 14 级由近到远拾级而上的暖白阶梯（按透视真实收窄）
  const steps = 14;
  for (let i = steps - 1; i >= 0; i--) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const zNear = 1.12 + t0 * 0.29;
    const zFar = 1.12 + t1 * 0.29;
    const yBot = t0 * 0.39 * reveal;
    const yTop = t1 * 0.39 * reveal;
    const halfW0 = 0.44 - t0 * 0.35;
    const halfW1 = 0.44 - t1 * 0.35;

    // 踢面（正面略暖灰影）
    const riser = [
      P(-halfW0, yBot, zNear),
      P(halfW0, yBot, zNear),
      P(halfW0, yTop, zNear),
      P(-halfW0, yTop, zNear),
    ];
    drawQuad(ctx, ...riser, i % 2 === 0 ? PALETTE.stairRiser : "#E4D7C4");

    // 踏面（顶面亮米白）
    const tread = [
      P(-halfW0, yTop, zNear),
      P(halfW0, yTop, zNear),
      P(halfW1, yTop, zFar),
      P(-halfW1, yTop, zFar),
    ];
    drawQuad(ctx, ...tread, PALETTE.stairTop);
  }
}

// 绘针叶林题材（呼应原海报底栏「景观摄影 · 树林」）
function drawForestColumns(ctx, evaluated, state, rect, reveal) {
  const P = (X, Y, Z) => toScreen(projectPoint(X, Y, Z, state), rect);
  // 林地稳固厚基台（暗松绿山坡底基）
  drawQuad(
    ctx,
    P(-0.85, -0.04, 1.25),
    P(0.85, -0.04, 1.25),
    P(0.85, 0.30 * reveal, 1.45),
    P(-0.85, 0.30 * reveal, 1.45),
    PALETTE.sidebarGreen
  );
  drawQuad(
    ctx,
    P(-0.85, -0.04, 1.12),
    P(0.85, -0.04, 1.12),
    P(0.85, 0.16 * reveal, 1.28),
    P(-0.85, 0.16 * reveal, 1.28),
    PALETTE.charcoal
  );

  // 按远到近绘高耸针叶树（主干严格垂直 + 层层针叶三角冠）
  const sorted = [...evaluated.projected].sort((a, b) => b.z - a.z);
  for (const col of sorted) {
    const h = col.h * reveal;
    const trunkHalf = col.w * 0.16;
    const bl = P(col.x - trunkHalf, 0.04, col.z);
    const br = P(col.x + trunkHalf, 0.04, col.z);
    const tl = P(col.x - trunkHalf * 0.65, h * 0.96, col.z);
    const tr = P(col.x + trunkHalf * 0.65, h * 0.96, col.z);
    drawQuad(ctx, bl, br, tr, tl, col.tone === "taupe" || col.tone === "sand" ? "#5A6B5F" : PALETTE.charcoal);

    // 4 层叠加针叶尖冠
    const fill = toneColor(col.tone === "sand" || col.tone === "cream" ? "midGreen" : col.tone);
    const tiers = 4;
    for (let k = 0; k < tiers; k++) {
      const yBase = 0.28 * h + (k / tiers) * (h * 0.54);
      const yTip = Math.min(h, yBase + h * 0.28);
      const span = col.w * (1.28 - k * 0.22);
      const pL = P(col.x - span, yBase, col.z);
      const pR = P(col.x + span, yBase, col.z);
      const pT = P(col.x, yTip, col.z);
      ctx.beginPath();
      ctx.moveTo(pL.x, pL.y);
      ctx.lineTo(pR.x, pR.y);
      ctx.lineTo(pT.x, pT.y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (col.goldLine && state.rhythm === "stepped") {
      const gBot = P(col.x, 0.12, col.z - 0.01);
      const gTop = P(col.x, h * 0.99, col.z - 0.01);
      ctx.strokeStyle = PALETTE.goldLine;
      ctx.lineWidth = Math.max(1.2, rect.fw * 0.0038);
      ctx.beginPath();
      ctx.moveTo(gBot.x, gBot.y);
      ctx.lineTo(gTop.x, gTop.y);
      ctx.stroke();
    }
  }
}

// 绘音乐海报题材（呼应原海报底栏「平面设计 · 音乐海报」竖向琴键与音柱）
function drawMusicColumns(ctx, evaluated, state, rect, reveal) {
  const P = (X, Y, Z) => toScreen(projectPoint(X, Y, Z, state), rect);
  const sorted = [...evaluated.projected].sort((a, b) => b.z - a.z);

  for (const col of sorted) {
    const h = col.h * reveal;
    const xL = col.x - col.w / 2;
    const xR = col.x + col.w / 2;
    const p0 = P(xL, 0.22, col.z);
    const p1 = P(xR, 0.22, col.z);
    const p2 = P(xR, h, col.z);
    const p3 = P(xL, h, col.z);
    drawQuad(ctx, p0, p1, p2, p3, toneColor(col.tone));

    // 黑键/音管切口细白/细金条
    if (col.tone === "charcoal" || col.tone === "deepGreen") {
      const keyBot = P(col.x - col.w * 0.16, h * 0.48, col.z - 0.01);
      const keyBotR = P(col.x + col.w * 0.16, h * 0.48, col.z - 0.01);
      const keyTopR = P(col.x + col.w * 0.16, h * 0.94, col.z - 0.01);
      const keyTopL = P(col.x - col.w * 0.16, h * 0.94, col.z - 0.01);
      drawQuad(ctx, keyBot, keyBotR, keyTopR, keyTopL, col.isPrimary ? PALETTE.gold : PALETTE.paperWarm);
    }
  }

  // 底部厚重钢琴底座（黑白琴键带稳稳托底）
  drawQuad(
    ctx,
    P(-0.76, 0.0, 1.24),
    P(0.76, 0.0, 1.24),
    P(0.76, 0.38 * reveal, 1.38),
    P(-0.76, 0.38 * reveal, 1.38),
    PALETTE.sidebarGreen
  );
  const keyCount = 11;
  for (let i = 0; i < keyCount; i++) {
    const kx0 = -0.62 + (i / keyCount) * 1.24;
    const kx1 = kx0 + (1.24 / keyCount) * 0.84;
    drawQuad(
      ctx,
      P(kx0, 0.05, 1.22),
      P(kx1, 0.05, 1.22),
      P(kx1, 0.31 * reveal, 1.34),
      P(kx0, 0.31 * reveal, 1.34),
      i === 5 ? PALETTE.gold : PALETTE.stairTop
    );
  }
}

export function renderHeroCanvas(canvas, state, evaluated, reveal = 1) {
  const dpr = pixelRatio(2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 舞台背景（取景框外围深绿暗舱，切换 1:1 / 16:9 时显出真实画幅裁切）
  ctx.fillStyle = "#162A24";
  ctx.fillRect(0, 0, cssW, cssH);

  const rect = computeFrameRect(cssW, cssH, state.aspect);

  // 画框内暖米宣纸天空底
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.fx, rect.fy, rect.fw, rect.fh);
  ctx.clip();

  const skyGrad = ctx.createLinearGradient(0, rect.fy, 0, rect.fy + rect.fh);
  skyGrad.addColorStop(0, PALETTE.paper);
  skyGrad.addColorStop(0.72, "#F2E7D6");
  skyGrad.addColorStop(1, "#E7DAC5");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(rect.fx, rect.fy, rect.fw, rect.fh);

  // 微弱垂直制图暗格（4 等分细参考线，不抢戏）
  ctx.strokeStyle = "rgba(16, 55, 46, 0.075)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gx = Math.round(rect.fx + (rect.fw * i) / 4) + 0.5;
    ctx.beginPath();
    ctx.moveTo(gx, rect.fy);
    ctx.lineTo(gx, rect.fy + rect.fh);
    ctx.stroke();
  }

  // 右上角原海报同款哑金圆日（正圆！绝不因画幅压扁，舒展悬于右上天空不被柱体遮挡）
  const sunAnchor = toScreen(projectPoint(0.56, 2.02, 1.88, state), rect);
  const sunR = Math.min(rect.fw, rect.fh) * 0.064;
  const sunX = Math.min(rect.fx + rect.fw - sunR * 1.55, Math.max(rect.fx + rect.fw * 0.72, sunAnchor.x));
  const sunY = Math.max(rect.fy + sunR * 1.65, Math.min(rect.fy + rect.fh * 0.28, sunAnchor.y));
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();

  // 按题材绘制主体柱群
  if (state.scene === "forest") {
    drawForestColumns(ctx, evaluated, state, rect, reveal);
  } else if (state.scene === "music") {
    drawMusicColumns(ctx, evaluated, state, rect, reveal);
  } else {
    // 纪念碑建筑群：按景深 z 从远到近绘制各立柱
    const sorted = [...evaluated.projected].sort((a, b) => b.z - a.z);
    for (const col of sorted) {
      const h = col.h * reveal;
      const xL = col.x - col.w / 2;
      const xR = col.x + col.w / 2;
      const p0 = toScreen(projectPoint(xL, 0, col.z, state), rect);
      const p1 = toScreen(projectPoint(xR, 0, col.z, state), rect);
      const p2 = toScreen(projectPoint(xR, h, col.z, state), rect);
      const p3 = toScreen(projectPoint(xL, h, col.z, state), rect);
      drawQuad(ctx, p0, p1, p2, p3, toneColor(col.tone));

      // 原海报主塔与右次塔上的贯通细哑金垂线
      if (col.goldLine) {
        const gBot = toScreen(projectPoint(col.x, 0.24, col.z - 0.005, state), rect);
        const gTop = toScreen(projectPoint(col.x, h * 0.94, col.z - 0.005, state), rect);
        ctx.strokeStyle = PALETTE.goldLine;
        ctx.lineWidth = Math.max(1.3, rect.fw * 0.004);
        ctx.beginPath();
        ctx.moveTo(gBot.x, gBot.y);
        ctx.lineTo(gTop.x, gTop.y);
        ctx.stroke();
      }
    }
    drawMonumentBase(ctx, state, rect, reveal);
  }

  // ===== 叠加光学取景校验线：铅垂对照线 + 顶部留白尺 =====
  const plumbOk = evaluated.principles.dignity.ok;
  const headroomOk = evaluated.principles.ascent.ok;
  const refBot = toScreen(projectPoint(-0.56, 0, 1.46, state), rect);
  const refTop = toScreen(projectPoint(-0.56, 1.72 * reveal, 1.46, state), rect);

  // 左侧绝对 90° 铅垂基准虚线 vs 当前实测柱边线
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = plumbOk ? PALETTE.guideOk : "rgba(16, 55, 46, 0.45)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(refBot.x, rect.fy + 10);
  ctx.lineTo(refBot.x, rect.fy + rect.fh - 10);
  ctx.stroke();

  if (!plumbOk) {
    // 红色实测歪斜线，清晰暴露垂线偏离 90° 的夹角
    ctx.setLineDash([]);
    ctx.strokeStyle = PALETTE.alert;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(refBot.x, refBot.y);
    ctx.lineTo(refTop.x, refTop.y);
    ctx.stroke();

    // 偏角扇形浅红填充
    ctx.fillStyle = PALETTE.alertSoft;
    ctx.beginPath();
    ctx.moveTo(refBot.x, refBot.y);
    ctx.lineTo(refTop.x, refTop.y);
    ctx.lineTo(refBot.x, refTop.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 顶部净留白度量标尺（右上内侧细线标尺）
  const topY = rect.fy + Math.max(0, Math.min(rect.fh, (evaluated.headroomPct / 100) * rect.fh));
  const meterX = rect.fx + rect.fw - 16;
  ctx.save();
  ctx.strokeStyle = headroomOk ? PALETTE.gold : PALETTE.alert;
  ctx.lineWidth = 1.5;
  if (evaluated.headroomPct > 1) {
    ctx.beginPath();
    ctx.moveTo(meterX, rect.fy + 2);
    ctx.lineTo(meterX, topY);
    ctx.moveTo(meterX - 5, rect.fy + 2);
    ctx.lineTo(meterX + 5, rect.fy + 2);
    ctx.moveTo(meterX - 5, topY);
    ctx.lineTo(meterX + 5, topY);
    ctx.stroke();
  } else {
    // 削顶红警横带
    ctx.fillStyle = "rgba(184, 61, 40, 0.85)";
    ctx.fillRect(rect.fx, rect.fy, rect.fw, 5);
  }
  ctx.restore();

  // 底部失根红警横带（如果移轴推过头导致阶梯掉出）
  if (evaluated.doorBaseV > EMPIRICAL.baseDoorMaxV) {
    ctx.fillStyle = "rgba(184, 61, 40, 0.85)";
    ctx.fillRect(rect.fx, rect.fy + rect.fh - 5, rect.fw, 5);
  }

  // 光学取景折角线（极细建筑取景器四角）
  const cLen = Math.min(18, rect.fw * 0.06);
  ctx.strokeStyle = plumbOk && headroomOk ? PALETTE.gold : "rgba(16, 55, 46, 0.55)";
  ctx.lineWidth = 1.5;
  const corners = [
    [rect.fx + 8, rect.fy + 8, 1, 1],
    [rect.fx + rect.fw - 8, rect.fy + 8, -1, 1],
    [rect.fx + 8, rect.fy + rect.fh - 8, 1, -1],
    [rect.fx + rect.fw - 8, rect.fy + rect.fh - 8, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * cLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * cLen);
    ctx.stroke();
  }

  // 精简角标读数（画框左上：实时机背仰角 / 顶部留白，字体 ≥ 11px，高对比深绿底）
  const tagText = `仰角 ${state.pitchDeg >= 0 ? "+" : ""}${state.pitchDeg.toFixed(1)}° · 顶白 ${Math.round(evaluated.headroomPct)}%`;
  ctx.font = '600 11px "Noto Sans SC", sans-serif';
  const tw = ctx.measureText(tagText).width + 16;
  ctx.fillStyle = evaluated.passCount === 4 ? PALETTE.sidebarGreen : "rgba(16, 55, 46, 0.92)";
  ctx.fillRect(rect.fx + 10, rect.fy + 10, tw, 22);
  ctx.fillStyle = evaluated.passCount === 4 ? PALETTE.goldGlow : "#F5ECDF";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, rect.fx + 18, rect.fy + 21);

  ctx.restore();

  // 取景框锐利外框（0px 圆角，贴合原海报建筑制图语言）
  ctx.strokeStyle = evaluated.passCount === 4 ? PALETTE.gold : "#355F53";
  ctx.lineWidth = evaluated.passCount === 4 ? 2 : 1;
  ctx.strokeRect(Math.round(rect.fx) + 0.5, Math.round(rect.fy) + 0.5, Math.round(rect.fw), Math.round(rect.fh));
}

// 绑定开场全部指针/触摸/键盘交互（底沿俯仰拨尺 data-perf-drag + 侧边移轴竖轨 + 画布直拖）
export function bindHeroControls({
  canvas,
  pitchTrack,
  pitchKnob,
  shiftTrack,
  shiftKnob,
  state,
  onChange,
}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function setPitch(rawDeg, allowSnap = true) {
    let deg = clamp(rawDeg, -10, 22);
    if (allowSnap && Math.abs(deg) <= EMPIRICAL.pitchSnapDeg) deg = 0;
    state.pitchDeg = Math.round(deg * 10) / 10;
    onChange();
  }

  function setShift(rawVal) {
    state.shift = Math.round(clamp(rawVal, 0, 1) * 100) / 100;
    onChange();
  }

  // 1. 底部俯仰拨尺（data-perf-drag，支持鼠标 + 触摸左右拖 + 点击跳位 + 方向键）
  function pitchFromClientX(clientX) {
    const r = pitchTrack.getBoundingClientRect();
    const t = clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
    return -10 + t * 32; // -10° .. +22°
  }

  let pitchDragging = false;
  pitchTrack.addEventListener("pointerdown", (e) => {
    pitchDragging = true;
    pitchTrack.setPointerCapture?.(e.pointerId);
    setPitch(pitchFromClientX(e.clientX));
  });
  pitchTrack.addEventListener("pointermove", (e) => {
    if (!pitchDragging) return;
    setPitch(pitchFromClientX(e.clientX));
  });
  const endPitch = () => { pitchDragging = false; };
  pitchTrack.addEventListener("pointerup", endPitch);
  pitchTrack.addEventListener("pointercancel", endPitch);

  // 兼容 CDP dispatchTouchEvent（tools/perf.mjs 发原生 touchStart/touchMove）
  pitchTrack.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    pitchDragging = true;
    setPitch(pitchFromClientX(e.touches[0].clientX));
  }, { passive: true });
  pitchTrack.addEventListener("touchmove", (e) => {
    if (!pitchDragging || !e.touches.length) return;
    e.preventDefault();
    setPitch(pitchFromClientX(e.touches[0].clientX));
  }, { passive: false });
  pitchTrack.addEventListener("touchend", endPitch, { passive: true });

  pitchKnob.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 2.5 : 0.5;
    if (e.key === "ArrowLeft") { e.preventDefault(); setPitch(state.pitchDeg - step); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setPitch(state.pitchDeg + step); }
  });

  // 2. 右侧前组移轴竖轨（上推=升移=shift 增大）
  function shiftFromClientY(clientY) {
    const r = shiftTrack.getBoundingClientRect();
    const t = 1 - clamp((clientY - r.top) / Math.max(1, r.height), 0, 1);
    return t;
  }

  let shiftDragging = false;
  shiftTrack.addEventListener("pointerdown", (e) => {
    shiftDragging = true;
    shiftTrack.setPointerCapture?.(e.pointerId);
    setShift(shiftFromClientY(e.clientY));
  });
  shiftTrack.addEventListener("pointermove", (e) => {
    if (!shiftDragging) return;
    setShift(shiftFromClientY(e.clientY));
  });
  const endShift = () => { shiftDragging = false; };
  shiftTrack.addEventListener("pointerup", endShift);
  shiftTrack.addEventListener("pointercancel", endShift);

  shiftTrack.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    shiftDragging = true;
    setShift(shiftFromClientY(e.touches[0].clientY));
  }, { passive: true });
  shiftTrack.addEventListener("touchmove", (e) => {
    if (!shiftDragging || !e.touches.length) return;
    e.preventDefault();
    setShift(shiftFromClientY(e.touches[0].clientY));
  }, { passive: false });
  shiftTrack.addEventListener("touchend", endShift, { passive: true });

  shiftKnob.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.08 : 0.02;
    if (e.key === "ArrowUp") { e.preventDefault(); setShift(state.shift + step); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setShift(state.shift - step); }
  });

  // 3. 画布直拖：鼠标拖动（左右掰仰角、上下推移轴），触屏仅在明显横滑时改仰角不拦垂直滚屏！
  let canvasDrag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏滚屏优先，靠专属拨尺与移轴轨操作
    canvasDrag = { x: e.clientX, y: e.clientY, pitch0: state.pitchDeg, shift0: state.shift };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!canvasDrag) return;
    const dx = e.clientX - canvasDrag.x;
    const dy = e.clientY - canvasDrag.y;
    const w = Math.max(120, canvas.clientWidth);
    const h = Math.max(120, canvas.clientHeight);
    let nextPitch = clamp(canvasDrag.pitch0 + (dx / w) * 26, -10, 22);
    if (Math.abs(nextPitch) <= EMPIRICAL.pitchSnapDeg) nextPitch = 0;
    const nextShift = clamp(canvasDrag.shift0 - (dy / h) * 1.1, 0, 1);
    state.pitchDeg = Math.round(nextPitch * 10) / 10;
    state.shift = Math.round(nextShift * 100) / 100;
    onChange();
  });
  const endCanvas = () => { canvasDrag = null; };
  canvas.addEventListener("pointerup", endCanvas);
  canvas.addEventListener("pointercancel", endCanvas);
}
