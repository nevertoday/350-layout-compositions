// 开场看样灯台 2D Canvas 渲染器
// 严格读取 model.js 的单真源评估结果，绘制实体对开杂志跨页、四角裁切线、3mm 出血框、
// 书脊中缝立体阴影、三套题材特写画面、静区/长文排印与可直点的红笔批注。

import { SPREAD_ASPECT, SPREAD_W_MM, SPREAD_H_MM, BLEED_MM, evaluateSpread } from "./model.js";

const PALETTE = {
  tableBg: "#002321",
  tableGrid: "rgba(241, 231, 212, 0.045)",
  paperTeal: "#013230",
  paperTealDeep: "#002826",
  cream: "#F1E7D4",
  creamBright: "#F7F0E2",
  creamMuted: "rgba(241, 231, 212, 0.72)",
  gold: "#F0AF03",
  goldDeep: "#C98D00",
  goldBright: "#FAD04D",
  danger: "#C93522",
  dangerSoft: "rgba(201, 53, 34, 0.24)",
  dangerBright: "#FF846B",
  pass: "#6FE3B5",
  inkDark: "#032220",
};

// 计算画布内对开杂志纸张的精确屏幕像素矩形（保持 440:297 等比，绝不拉伸变形）
export function computeLayout(width, height, isCompact) {
  const padTop = isCompact ? 34 : 38;
  const padBottom = isCompact ? 50 : 54; // 底部留给实体「中缝避让标尺」轨
  const padSide = isCompact ? 16 : 44;

  const availW = Math.max(120, width - padSide * 2);
  const availH = Math.max(100, height - padTop - padBottom);

  let spreadW = availW;
  let spreadH = spreadW / SPREAD_ASPECT;
  if (spreadH > availH) {
    spreadH = availH;
    spreadW = spreadH * SPREAD_ASPECT;
  }

  const x = (width - spreadW) * 0.5;
  const y = padTop + (availH - spreadH) * 0.48;
  const bleedPxX = (BLEED_MM / SPREAD_W_MM) * spreadW;
  const bleedPxY = (BLEED_MM / SPREAD_H_MM) * spreadH;

  // 底沿「中缝避让横向平移尺」的屏幕矩形（支持直接拖滑）
  const railH = 26;
  const railRect = {
    x,
    y: y + spreadH + (isCompact ? 14 : 18),
    w: spreadW,
    h: railH,
  };

  return {
    spread: { x, y, w: spreadW, h: spreadH },
    bleedPxX,
    bleedPxY,
    rail: railRect,
  };
}

// 绘制题材一：1:1 承袭 163 原海报的暖奶白巨环与镉金黄斜楔
function drawPosterStory(ctx, spread, ev) {
  const cx = spread.x + ev.subjU * spread.w;
  const cy = spread.y + ev.subjV * spread.h;
  const R = ev.drawnRV * spread.h;

  // 底层深松黛绿纸基
  ctx.fillStyle = PALETTE.paperTeal;
  ctx.fillRect(spread.x - 40, spread.y - 40, spread.w + 80, spread.h + 80);

  // 镉金黄斜楔（忠实 163 原海报的锋利纯色丝网压印，极速零渐变开销）
  ctx.beginPath();
  const apexX = cx - R * 0.14;
  const apexY = cy + R * 0.20;
  const footLeftX = apexX - R * 0.92;
  const footY = spread.y + spread.h + 40;
  const footRightX = spread.x + spread.w + 80;
  ctx.moveTo(footLeftX, footY);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(footRightX, apexY + (footRightX - apexX) * 0.56);
  ctx.lineTo(footRightX, footY);
  ctx.closePath();
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();

  // 暖奶白厚环（原海报标志巨环：外径 R，内径 0.49R，严格正圆！）
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.arc(cx, cy, R * 0.49, 0, Math.PI * 2, true);
  ctx.fillStyle = PALETTE.cream;
  ctx.fill("evenodd");

  // 极细温润印刷纸边暗角
  ctx.strokeStyle = "rgba(1, 50, 48, 0.14)";
  ctx.lineWidth = Math.max(1, R * 0.006);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.49, 0, Math.PI * 2);
  ctx.stroke();
}

// 绘制题材二：器物特写 · 曜变茶碗与金缮裂纹（同样忠实松绿×暖奶白×镉金三色系统）
function drawBowlStory(ctx, spread, ev) {
  const cx = spread.x + ev.subjU * spread.w;
  const cy = spread.y + ev.subjV * spread.h;
  const R = ev.drawnRV * spread.h;

  // 深松茶席底
  ctx.fillStyle = "#012C2A";
  ctx.fillRect(spread.x - 40, spread.y - 40, spread.w + 80, spread.h + 80);

  // 窗台斜切暖金光束（铺在茶席右下角）
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.85, spread.y + spread.h + 40);
  ctx.lineTo(cx + R * 0.25, cy - R * 0.25);
  ctx.lineTo(spread.x + spread.w + 80, cy + R * 0.45);
  ctx.lineTo(spread.x + spread.w + 80, spread.y + spread.h + 40);
  ctx.closePath();
  const beam = ctx.createLinearGradient(cx - R * 0.4, cy, cx + R * 1.1, spread.y + spread.h);
  beam.addColorStop(0, "rgba(240, 175, 3, 0.88)");
  beam.addColorStop(1, "rgba(201, 141, 0, 0.58)");
  ctx.fillStyle = beam;
  ctx.fill();
  ctx.restore();

  // 茶碗底投影
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + R * 0.06, cy + R * 0.08, R * 1.02, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 18, 17, 0.48)";
  ctx.fill();

  // 茶碗外缘暖奶白釉唇
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  const rimGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.32, R * 0.1, cx, cy, R);
  rimGrad.addColorStop(0, "#F7F0E2");
  rimGrad.addColorStop(0.72, "#E4D7BE");
  rimGrad.addColorStop(1, "#BFB095");
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // 碗腔深松青黑釉面
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
  const glaze = ctx.createRadialGradient(cx - R * 0.22, cy - R * 0.2, R * 0.05, cx, cy, R * 0.88);
  glaze.addColorStop(0, "#144B47");
  glaze.addColorStop(0.55, "#042E2C");
  glaze.addColorStop(1, "#001B1A");
  ctx.fillStyle = glaze;
  ctx.fill();

  // 手工拉坯同心弦纹（特写放大后极有质感）
  ctx.strokeStyle = "rgba(241, 231, 212, 0.12)";
  ctx.lineWidth = Math.max(1, R * 0.008);
  for (let i = 1; i <= 7; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * (0.24 + i * 0.082), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 碗底茶涡
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#083C38";
  ctx.fill();

  // 视觉焦心：贯穿碗沿到碗心的金缮（Kintsugi）金色修补脉络
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const fx = spread.x + ev.focalU * spread.w;
  const fy = spread.y + ev.focalV * spread.h;

  // 外辉
  ctx.strokeStyle = "rgba(240, 175, 3, 0.34)";
  ctx.lineWidth = Math.max(4, R * 0.06);
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.78, cy - R * 0.56);
  ctx.lineTo(fx - R * 0.22, fy - R * 0.14);
  ctx.lineTo(fx, fy);
  ctx.lineTo(cx + R * 0.36, cy + R * 0.28);
  ctx.lineTo(cx + R * 0.88, cy + R * 0.44);
  ctx.stroke();

  // 实金主裂
  ctx.strokeStyle = "#FAD04D";
  ctx.lineWidth = Math.max(2, R * 0.026);
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.78, cy - R * 0.56);
  ctx.lineTo(fx - R * 0.22, fy - R * 0.14);
  ctx.lineTo(fx, fy);
  ctx.lineTo(cx + R * 0.36, cy + R * 0.28);
  ctx.lineTo(cx + R * 0.88, cy + R * 0.44);
  ctx.stroke();

  // 金缮细支裂
  ctx.lineWidth = Math.max(1.2, R * 0.015);
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx - R * 0.14, fy + R * 0.32);
  ctx.lineTo(fx - R * 0.32, fy + R * 0.58);
  ctx.moveTo(fx - R * 0.05, fy - R * 0.03);
  ctx.lineTo(fx + R * 0.22, fy - R * 0.28);
  ctx.stroke();

  // 焦心金漆厚点
  ctx.fillStyle = "#FFF1BE";
  ctx.beginPath();
  ctx.arc(fx, fy, Math.max(2.2, R * 0.022), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 绘制题材三：建筑纪实 · 穹顶天窗与光柱（极简纯几何 + 远景背影剪影，绝无五官）
function drawOculusStory(ctx, spread, ev) {
  const cx = spread.x + ev.subjU * spread.w;
  const cy = spread.y + ev.subjV * spread.h;
  const R = ev.drawnRV * spread.h;

  ctx.fillStyle = "#002624";
  ctx.fillRect(spread.x - 40, spread.y - 40, spread.w + 80, spread.h + 80);

  // 混凝土穹顶放射拱肋
  ctx.save();
  ctx.strokeStyle = "rgba(241, 231, 212, 0.11)";
  ctx.lineWidth = Math.max(1.2, R * 0.014);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.46, cy + Math.sin(a) * R * 0.46);
    ctx.lineTo(cx + Math.cos(a) * R * 1.9, cy + Math.sin(a) * R * 1.9);
    ctx.stroke();
  }
  // 穹顶外环层阶
  for (const mult of [1.02, 1.32, 1.62]) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * mult, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(241, 231, 212, 0.16)";
    ctx.stroke();
  }

  // 镉金黄斜切光柱（从穹顶天窗直泄地面）
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.46, cy + R * 0.08);
  ctx.lineTo(cx + R * 0.42, cy - R * 0.20);
  ctx.lineTo(cx + R * 0.95, spread.y + spread.h + 50);
  ctx.lineTo(cx - R * 1.25, spread.y + spread.h + 50);
  ctx.closePath();
  const shaft = ctx.createLinearGradient(cx, cy - R * 0.3, cx, spread.y + spread.h);
  shaft.addColorStop(0, "rgba(240, 175, 3, 0.92)");
  shaft.addColorStop(0.55, "rgba(240, 175, 3, 0.72)");
  shaft.addColorStop(1, "rgba(201, 141, 0, 0.42)");
  ctx.fillStyle = shaft;
  ctx.fill();

  // 巨型混凝土天窗圈口
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.arc(cx, cy, R * 0.48, 0, Math.PI * 2, true);
  ctx.fillStyle = "#EFE5D2";
  ctx.fill("evenodd");

  // 天窗内壁暗影厚沿（立体进深）
  ctx.beginPath();
  ctx.arc(cx + R * 0.05, cy + R * 0.05, R * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = "#013230";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - R * 0.04, cy - R * 0.04, R * 0.41, 0, Math.PI * 2);
  ctx.fillStyle = "#F7F1E4";
  ctx.fill();

  // 底端极微小纯剪影背影（只建立建筑宏大尺度感，绝不画任何五官细节）
  const px = cx - R * 0.14;
  const py = Math.min(spread.y + spread.h - 14, cy + R * 0.78);
  const ph = Math.max(12, R * 0.14);
  ctx.fillStyle = "#012422";
  // 头部小圆 + 斗篷背影梯形（无五官）
  ctx.beginPath();
  ctx.arc(px, py - ph * 0.84, ph * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px - ph * 0.22, py - ph * 0.64);
  ctx.lineTo(px + ph * 0.22, py - ph * 0.64);
  ctx.lineTo(px + ph * 0.14, py);
  ctx.lineTo(px - ph * 0.14, py);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 绘制文字区域（精炼标题短注 / 240字压图长文 / 无字），坐标直接取自 ev.textRect
function drawSpreadTypography(ctx, spread, ev, state) {
  if (state.textLoad === "none" || !ev.textRect) return;
  const r = {
    x: spread.x + ev.textRect.u0 * spread.w,
    y: spread.y + ev.textRect.v0 * spread.h,
    w: (ev.textRect.u1 - ev.textRect.u0) * spread.w,
    h: (ev.textRect.v1 - ev.textRect.v0) * spread.h,
  };
  const scale = spread.h / 380;

  ctx.save();
  if (state.textLoad === "wall") {
    // 压图长文错态：半透明暗纸条衬底+双栏密排灰线和真实摘要，一眼看出喧宾夺主
    ctx.fillStyle = "rgba(1, 36, 34, 0.86)";
    ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    ctx.strokeStyle = "rgba(255, 132, 107, 0.65)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    ctx.setLineDash([]);

    // 挤小的大标题
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `900 ${Math.max(11, Math.round(16 * scale))}px "Noto Sans SC", sans-serif`;
    ctx.fillText(ev.story.title + " · 专题深度报道", r.x + 6, r.y + Math.max(14, 18 * scale));

    // 双栏密集正文行模拟：合并到单次 beginPath + fill，60 根灰条只耗 1 次绘制调用
    const colGap = Math.max(8, 12 * scale);
    const colW = (r.w - 12 - colGap) * 0.5;
    const startY = r.y + Math.max(24, 32 * scale);
    const lineH = Math.max(5.5, 8.2 * scale);
    const lines = Math.floor((r.h - (startY - r.y) - 10) / lineH);
    const barH = Math.max(2.2, 3.2 * scale);

    ctx.fillStyle = "rgba(241, 231, 212, 0.52)";
    ctx.beginPath();
    for (let c = 0; c < 2; c++) {
      const lx = r.x + 6 + c * (colW + colGap);
      for (let i = 0; i < lines; i++) {
        const ly = startY + i * lineH;
        const frac = i % 5 === 4 ? 0.68 : i % 3 === 0 ? 0.95 : 0.88;
        ctx.rect(lx, ly, colW * frac, barH);
      }
    }
    ctx.fill();
    ctx.restore();
    return;
  }

  // 精炼题注模式（1:1 呼应 163 原海报的左侧排印语言）
  const clash = state.textPlace === "over";
  if (clash) {
    // 撞焦态描虚线警告框
    ctx.strokeStyle = "rgba(255, 132, 107, 0.85)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.3;
    ctx.strokeRect(r.x - 5, r.y - 5, r.w + 10, r.h + 10);
    ctx.setLineDash([]);
  }

  // 眉标 + 短金杠
  const eyebrowSize = Math.max(8, Math.round(9.5 * scale));
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `600 ${eyebrowSize}px "IBM Plex Mono", monospace`;
  ctx.fillText(ev.story.issue, r.x, r.y + eyebrowSize);
  ctx.fillRect(r.x, r.y + eyebrowSize + 5, Math.max(14, 22 * scale), 2);

  // 堆叠粗黑主标（像 163 原海报「特写 / 跨页」两行大字！）
  const parts = ev.story.title.split(" ");
  const titleSize = Math.max(18, Math.round(42 * scale));
  ctx.fillStyle = PALETTE.creamBright;
  ctx.font = `900 ${titleSize}px "Noto Sans SC", sans-serif`;
  let curY = r.y + eyebrowSize + 14 * scale + titleSize;
  for (const part of parts) {
    ctx.fillText(part, r.x, curY);
    curY += titleSize * 1.06;
  }

  // 英文副标（镉金黄 Big Shoulders）
  const enSize = Math.max(10, Math.round(16 * scale));
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 ${enSize}px "Big Shoulders", sans-serif`;
  ctx.fillText(ev.story.titleEn, r.x, curY - titleSize * 0.65);

  // 左侧竖金杠 + 极简两行短注
  const deckY = curY - titleSize * 0.35;
  const deckSize = Math.max(8.5, Math.round(10.5 * scale));
  const maxDeckW = Math.max(80, r.w - 14);
  ctx.font = `400 ${deckSize}px "Noto Sans SC", sans-serif`;
  const wrapped = wrapText(ctx, ev.story.deck, maxDeckW);
  const deckLineH = deckSize * 1.52;
  const deckH = wrapped.length * deckLineH;

  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(r.x, deckY, 2.5, Math.max(22, deckH));

  ctx.fillStyle = "rgba(241, 231, 212, 0.88)";
  wrapped.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, r.x + 9, deckY + deckSize + idx * deckLineH);
  });

  // 原海报标志底角金色三峰波浪徽
  const waveY = Math.min(r.y + r.h - 4, deckY + deckH + 16 * scale);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = Math.max(1.4, 2 * scale);
  ctx.beginPath();
  const wx = r.x;
  const ww = Math.max(22, 34 * scale);
  const amp = Math.max(2.2, 3.2 * scale);
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const px = wx + t * ww;
    const py = waveY + Math.sin(t * Math.PI * 5) * amp;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function wrapText(ctx, text, maxW) {
  const lines = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 绘制真实实体印刷裁切角线、出血线、中缝立体折痕与吞图警示区
function drawPhysicalChrome(ctx, layout, ev, state, hoverRail) {
  const { spread, bleedPxX, bleedPxY, rail } = layout;
  const spineX = spread.x + spread.w * 0.5;

  // 1. 书页外投影（双层实体无模糊压印投影，既锐利又有纸厚，在慢速软渲染下稳跑 60 帧）
  ctx.fillStyle = "rgba(0, 10, 9, 0.34)";
  ctx.fillRect(spread.x + 8, spread.y + 10, spread.w, spread.h);
  ctx.fillStyle = "rgba(0, 10, 9, 0.24)";
  ctx.fillRect(spread.x + 3, spread.y + 4, spread.w, spread.h);
  ctx.fillStyle = PALETTE.paperTeal;
  ctx.fillRect(spread.x, spread.y, spread.w, spread.h);

  // 2. 出血线（3mm 虚线外框，在裁切线外圈）
  if (state.showGuides) {
    ctx.save();
    ctx.strokeStyle = state.bleed ? "rgba(240, 175, 3, 0.55)" : "rgba(241, 231, 212, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      spread.x - bleedPxX,
      spread.y - bleedPxY,
      spread.w + bleedPxX * 2,
      spread.h + bleedPxY * 2
    );
    ctx.setLineDash([]);

    // 四角标准印刷裁切线（Crop Marks）
    const tick = 10;
    const gap = 4;
    ctx.strokeStyle = "rgba(241, 231, 212, 0.62)";
    ctx.lineWidth = 1;
    const corners = [
      [spread.x, spread.y, -1, -1],
      [spread.x + spread.w, spread.y, 1, -1],
      [spread.x, spread.y + spread.h, -1, 1],
      [spread.x + spread.w, spread.y + spread.h, 1, 1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * gap, cy);
      ctx.lineTo(cx + dx * (gap + tick), cy);
      ctx.moveTo(cx, cy + dy * gap);
      ctx.lineTo(cx, cy + dy * (gap + tick));
      ctx.stroke();
    }
    // 中缝上下折痕标记（Fold Marks）
    ctx.strokeStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(spineX, spread.y - gap);
    ctx.lineTo(spineX, spread.y - gap - tick);
    ctx.moveTo(spineX, spread.y + spread.h + gap);
    ctx.lineTo(spineX, spread.y + spread.h + gap + tick);
    ctx.stroke();
    ctx.restore();
  }

  // 3. 顶部看样微眉标（宽屏完整展示左页码/中间参数/右页码；窄屏仅居中显示核心参数，绝不重叠！）
  ctx.save();
  ctx.font = '600 10.5px "IBM Plex Mono", monospace';
  ctx.textBaseline = "bottom";
  const midInfo = spread.w < 430
    ? `ZOOM ${ev.zoom.toFixed(2)}× · BLEED ${ev.bleedEdges}/4 · SPINE ${ev.spineDistMm}mm`
    : `ZOOM ${ev.zoom.toFixed(2)}×  ·  BLEED ${ev.bleedEdges}/4  ·  SPINE ${ev.spineDistMm}mm`;

  if (spread.w >= 460) {
    ctx.fillStyle = "rgba(241, 231, 212, 0.72)";
    ctx.textAlign = "left";
    ctx.fillText("P.42  VERSO", spread.x, spread.y - 10);
    ctx.textAlign = "right";
    ctx.fillText("RECTO  P.43", spread.x + spread.w, spread.y - 10);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = ev.passedCount === 3 ? PALETTE.pass : PALETTE.goldBright;
  ctx.fillText(midInfo, spineX, spread.y - 10);
  ctx.restore();

  // 3b. 宽屏灯台左右翼（仅当两侧余量充足时渲染，消除 1440/2560 大屏两侧空荡，增强真实印厂看样台感）
  const flankW = spread.x - 24;
  if (flankW >= 150) {
    drawLightTableFlanks(ctx, layout, ev, state, flankW);
  }

  // 4. 底沿一体式「中缝避让横向平移尺」（可直接左右拖滑移动焦心！）
  ctx.save();
  ctx.fillStyle = "rgba(0, 22, 20, 0.9)";
  ctx.fillRect(rail.x, rail.y, rail.w, rail.h);
  ctx.strokeStyle = hoverRail ? PALETTE.gold : "rgba(241, 231, 212, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(rail.x, rail.y, rail.w, rail.h);

  // 标尺中缝危险红区
  const railSpineX = rail.x + rail.w * 0.5;
  const dangerW = ev.gutterHalfU * rail.w * 2;
  ctx.fillStyle = ev.gutterHit ? "rgba(201, 53, 34, 0.55)" : "rgba(201, 53, 34, 0.28)";
  ctx.fillRect(railSpineX - dangerW * 0.5, rail.y + 1, dangerW, rail.h - 2);

  // 中线刻度
  ctx.strokeStyle = "rgba(241, 231, 212, 0.45)";
  ctx.beginPath();
  ctx.moveTo(railSpineX, rail.y);
  ctx.lineTo(railSpineX, rail.y + rail.h);
  ctx.stroke();

  // 左右提示字
  ctx.font = '500 10px "Noto Sans SC", sans-serif';
  ctx.fillStyle = "rgba(241, 231, 212, 0.68)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("← 左页焦心", rail.x + 8, rail.y + rail.h * 0.5);
  ctx.textAlign = "right";
  ctx.fillText("右页焦心 →", rail.x + rail.w - 8, rail.y + rail.h * 0.5);

  // 焦心实体推块（显示焦心当前位置，标色反映是否安全避脊）
  const knobX = rail.x + ev.focusU * rail.w;
  ctx.fillStyle = ev.gutterHit ? PALETTE.danger : PALETTE.gold;
  ctx.fillRect(knobX - 18, rail.y + 3, 36, rail.h - 6);
  ctx.fillStyle = ev.gutterHit ? "#FFF4EE" : PALETTE.inkDark;
  ctx.font = '700 10px "IBM Plex Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText(`${ev.spineDistMm}mm`, knobX, rail.y + rail.h * 0.5 + 0.5);
  ctx.restore();
}

// 主渲染入口：返回所有可点击热区（红笔批注、底沿中缝尺），供 main.js 精确命中检测
export function renderHeroSpread(ctx, width, height, state, anim) {
  const isCompact = width < 560;
  const ev = evaluateSpread(state);
  const layout = computeLayout(width, height, isCompact);
  const { spread, bleedPxX, bleedPxY } = layout;

  // 清屏并铺上深松灯台微网格
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = PALETTE.tableBg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = PALETTE.tableGrid;
  ctx.lineWidth = 1;
  const step = 28;
  ctx.beginPath();
  for (let gx = step; gx < width; gx += step) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
  }
  for (let gy = step; gy < height; gy += step) {
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
  }
  ctx.stroke();

  // 先绘杂志外投影、裁切角线、出血虚线框与底沿中缝标尺
  drawPhysicalChrome(ctx, layout, ev, state, anim.hoverRail);

  // 裁切到对开双页净尺寸（开启出血时轻微露出 3mm 半透明出血提示边）
  if (state.bleed && state.showGuides) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      spread.x - bleedPxX,
      spread.y - bleedPxY,
      spread.w + bleedPxX * 2,
      spread.h + bleedPxY * 2
    );
    ctx.clip();
    ctx.globalAlpha = 0.32;
    drawStoryContent(ctx, spread, ev);
    ctx.restore();
  }

  // 主双页净成品裁切区域
  ctx.save();
  ctx.beginPath();
  ctx.rect(spread.x, spread.y, spread.w, spread.h);
  ctx.clip();

  // 双页纸基
  ctx.fillStyle = PALETTE.paperTeal;
  ctx.fillRect(spread.x, spread.y, spread.w, spread.h);

  // 主图像裁切区域（不开出血时被硬框锁死在白框/留白内！）
  const imgClip = {
    x: spread.x + ev.clipRect.u0 * spread.w,
    y: spread.y + ev.clipRect.v0 * spread.h,
    w: (ev.clipRect.u1 - ev.clipRect.u0) * spread.w,
    h: (ev.clipRect.v1 - ev.clipRect.v0) * spread.h,
  };

  if (!state.bleed) {
    // 没开出血时绘制显眼的常规杂志留白页边和装框，一眼暴露「普通内页感」
    ctx.fillStyle = "#F1E7D4";
    ctx.fillRect(spread.x, spread.y, spread.w, spread.h);
    ctx.fillStyle = PALETTE.paperTeal;
    ctx.fillRect(imgClip.x, imgClip.y, imgClip.w, imgClip.h);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(imgClip.x, imgClip.y, imgClip.w, imgClip.h);
  ctx.clip();
  drawStoryContent(ctx, spread, ev);
  ctx.restore();

  if (!state.bleed) {
    ctx.strokeStyle = "rgba(1, 50, 48, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(imgClip.x, imgClip.y, imgClip.w, imgClip.h);
  }

  // 文字层（严格与 ev.textRect 单真源一致）
  drawSpreadTypography(ctx, spread, ev, state);

  // 极细页眉页脚书眉（杂志真实感）
  ctx.fillStyle = state.bleed ? "rgba(241, 231, 212, 0.46)" : "rgba(4, 36, 34, 0.56)";
  ctx.font = '500 9.5px "IBM Plex Mono", monospace';
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(ev.story.folioLeft, spread.x + 14, spread.y + 10);
  ctx.textAlign = "right";
  ctx.fillText(ev.story.folioRight, spread.x + spread.w - 14, spread.y + 10);

  // 实体书脊中缝阴影与装订吞图透视带
  const spineX = spread.x + spread.w * 0.5;
  const shadowHalf = state.binding === "perfect" ? Math.max(14, spread.w * 0.042) : Math.max(7, spread.w * 0.018);
  const spineGrad = ctx.createLinearGradient(spineX - shadowHalf, 0, spineX + shadowHalf, 0);
  spineGrad.addColorStop(0, "rgba(0, 10, 9, 0)");
  spineGrad.addColorStop(0.35, state.binding === "perfect" ? "rgba(0, 10, 9, 0.28)" : "rgba(0, 10, 9, 0.14)");
  spineGrad.addColorStop(0.5, state.binding === "perfect" ? "rgba(0, 8, 7, 0.62)" : "rgba(0, 8, 7, 0.32)");
  spineGrad.addColorStop(0.65, state.binding === "perfect" ? "rgba(0, 10, 9, 0.24)" : "rgba(0, 10, 9, 0.12)");
  spineGrad.addColorStop(1, "rgba(0, 10, 9, 0)");
  ctx.fillStyle = spineGrad;
  ctx.fillRect(spineX - shadowHalf, spread.y, shadowHalf * 2, spread.h);

  // 中缝折痕实体细线
  ctx.strokeStyle = "rgba(241, 231, 212, 0.24)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(spineX, spread.y);
  ctx.lineTo(spineX, spread.y + spread.h);
  ctx.stroke();

  // 中缝装订吞图带提示（开启参考线或发生压缝冲突时显形）
  if (state.showGuides || ev.gutterHit) {
    const swallowW = ev.gutterHalfU * spread.w * 2;
    ctx.fillStyle = ev.gutterHit ? "rgba(201, 53, 34, 0.32)" : "rgba(240, 175, 3, 0.10)";
    ctx.fillRect(spineX - swallowW * 0.5, spread.y, swallowW, spread.h);
    ctx.strokeStyle = ev.gutterHit ? "rgba(255, 132, 107, 0.85)" : "rgba(240, 175, 3, 0.45)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spineX - swallowW * 0.5, spread.y);
    ctx.lineTo(spineX - swallowW * 0.5, spread.y + spread.h);
    ctx.moveTo(spineX + swallowW * 0.5, spread.y);
    ctx.lineTo(spineX + swallowW * 0.5, spread.y + spread.h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 焦心位置指示小环（干净的编辑部对焦圆环，非十字瞄准器）
  const fx = spread.x + ev.focalU * spread.w;
  const fy = spread.y + ev.focalV * spread.h;
  const pulse = 1 + Math.sin(anim.t * 3.2) * 0.08;
  ctx.save();
  ctx.strokeStyle = ev.gutterHit ? PALETTE.dangerBright : PALETTE.goldBright;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(fx, fy, 9 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ev.gutterHit ? PALETTE.dangerBright : PALETTE.goldBright;
  ctx.beginPath();
  ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 绘制可直点的红笔看样批注胶囊，并记录精准屏幕热区
  const hitBoxes = [];
  ctx.save();
  const tagFontSize = isCompact ? 10.5 : 11.5;
  ctx.font = `600 ${tagFontSize}px "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ev.annotations.forEach((ann, idx) => {
    const tw = ctx.measureText(ann.label).width;
    const bw = tw + 18;
    const bh = isCompact ? 24 : 26;
    let bx = spread.x + ann.u * spread.w - bw * 0.5;
    let by = spread.y + ann.v * spread.h - bh * 0.5 + idx * 0;
    bx = Math.max(spread.x + 8, Math.min(spread.x + spread.w - bw - 8, bx));
    by = Math.max(spread.y + 24, Math.min(spread.y + spread.h - bh - 10, by));

    // 避开相互重叠
    for (const prev of hitBoxes) {
      if (Math.abs(by - prev.y) < bh + 4 && Math.abs(bx - prev.x) < Math.max(bw, prev.w)) {
        by = Math.min(spread.y + spread.h - bh - 10, prev.y + prev.h + 6);
      }
    }

    ctx.fillStyle = PALETTE.danger;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#FFE5DE";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    ctx.fillStyle = "#FFF7F4";
    ctx.fillText(ann.label, bx + bw * 0.5, by + bh * 0.5 + 0.5);

    hitBoxes.push({ x: bx, y: by, w: bw, h: bh, patch: ann.patch, id: ann.id });
  });
  ctx.restore();

  // 裁切区域外框复原
  ctx.restore();

  // 纸张极细外描边（清晰界定裁切成品边界）
  ctx.strokeStyle = ev.passedCount === 3 ? "rgba(111, 227, 181, 0.62)" : "rgba(241, 231, 212, 0.34)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(spread.x + 0.5, spread.y + 0.5, spread.w - 1, spread.h - 1);

  return { layout, ev, hitBoxes };
}

function drawLightTableFlanks(ctx, layout, ev, state, flankW) {
  const { spread } = layout;
  const cardW = Math.min(188, flankW - 22);
  const leftX = spread.x - cardW - 22;
  const rightX = spread.x + spread.w + 22;
  const topY = spread.y;

  // 实体书页厚叠边提示（左右各绘 3 道极细纸页侧切线，模拟摊开的厚杂志）
  ctx.save();
  ctx.strokeStyle = "rgba(241, 231, 212, 0.24)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(spread.x - i * 3, spread.y + i * 2);
    ctx.lineTo(spread.x - i * 3, spread.y + spread.h - i * 2);
    ctx.moveTo(spread.x + spread.w + i * 3, spread.y + i * 2);
    ctx.lineTo(spread.x + spread.w + i * 3, spread.y + spread.h - i * 2);
    ctx.stroke();
  }

  // 左翼：实体开本与印厂规格卡 + 纵向毫米标尺
  ctx.fillStyle = "rgba(1, 38, 36, 0.84)";
  ctx.fillRect(leftX, topY, cardW, 134);
  ctx.strokeStyle = "rgba(27, 90, 86, 0.9)";
  ctx.strokeRect(leftX + 0.5, topY + 0.5, cardW - 1, 133);

  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(leftX, topY, cardW, 3);
  ctx.font = '600 10px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("PRINT PROOF SPEC", leftX + 12, topY + 12);

  const specs = [
    ["OPEN TRIM", "440 × 297 mm"],
    ["BLEED", state.bleed ? "+3 mm ON" : "0 mm BOXED"],
    ["BINDING", state.binding === "perfect" ? "PERFECT ±14mm" : "SADDLE ±4mm"],
    ["SUBJECT", `${ev.coveragePct}% AREA`],
  ];
  specs.forEach(([k, v], i) => {
    const sy = topY + 34 + i * 23;
    ctx.fillStyle = "rgba(198, 214, 206, 0.72)";
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    ctx.fillText(k, leftX + 12, sy);
    ctx.fillStyle = i === 1 && !state.bleed ? PALETTE.dangerBright : PALETTE.cream;
    ctx.font = '600 10.5px "IBM Plex Mono", monospace';
    ctx.textAlign = "right";
    ctx.fillText(v, leftX + cardW - 12, sy - 0.5);
    ctx.textAlign = "left";
  });

  // 左翼下半：297mm 竖向印刷刻度尺
  const rulerX = leftX + cardW - 18;
  const rTop = topY + 150;
  const rBot = spread.y + spread.h;
  if (rBot - rTop > 70) {
    ctx.strokeStyle = "rgba(241, 231, 212, 0.32)";
    ctx.beginPath();
    ctx.moveTo(rulerX, rTop);
    ctx.lineTo(rulerX, rBot);
    for (let i = 0; i <= 6; i++) {
      const ty = rTop + ((rBot - rTop) * i) / 6;
      ctx.moveTo(rulerX - (i % 3 === 0 ? 10 : 5), ty);
      ctx.lineTo(rulerX, ty);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(198, 214, 206, 0.65)";
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    ctx.fillText("297mm", leftX + 12, rTop + 2);
    ctx.fillText("SCALE 1:1", leftX + 12, rBot - 12);
  }

  // 右翼：画外脑补透视微窗（实时显示主体越出纸边的虚拟画外轮廓与留存率）
  const boxH = 166;
  ctx.fillStyle = "rgba(1, 38, 36, 0.84)";
  ctx.fillRect(rightX, topY, cardW, boxH);
  ctx.strokeStyle = "rgba(27, 90, 86, 0.9)";
  ctx.strokeRect(rightX + 0.5, topY + 0.5, cardW - 1, boxH - 1);
  ctx.fillStyle = ev.passedCount === 3 ? PALETTE.pass : PALETTE.gold;
  ctx.fillRect(rightX, topY, cardW, 3);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '600 10px "IBM Plex Mono", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("OFF-PAGE SILHOUETTE", rightX + 12, topY + 12);

  // 微缩画外虚线示意框
  const mw = cardW - 44;
  const mh = mw / SPREAD_ASPECT;
  const mx = rightX + 22;
  const my = topY + 46;
  const mcx = mx + ev.subjU * mw;
  const mcy = my + ev.subjV * mh;
  const mr = ev.drawnRV * mh;

  // 虚线画外延展圆（裁剪在右翼卡片内防溢出）
  ctx.save();
  ctx.beginPath();
  ctx.rect(rightX + 4, topY + 28, cardW - 8, boxH - 54);
  ctx.clip();
  ctx.strokeStyle = "rgba(240, 175, 3, 0.62)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(mcx, mcy, mr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 纸内净实线圆
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, mw, mh);
  ctx.clip();
  ctx.fillStyle = "#002321";
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = Math.max(2, mr * 0.45);
  ctx.beginPath();
  ctx.arc(mcx, mcy, mr * 0.76, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 净裁切线框与中缝
  ctx.strokeStyle = "rgba(241, 231, 212, 0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.strokeStyle = ev.gutterHit ? PALETTE.dangerBright : "rgba(241, 231, 212, 0.3)";
  ctx.beginPath();
  ctx.moveTo(mx + mw * 0.5, my);
  ctx.lineTo(mx + mw * 0.5, my + mh);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = PALETTE.cream;
  ctx.font = '600 10.5px "Noto Sans SC", sans-serif';
  ctx.fillText(`轮廓留存 ${ev.visibleSubjectPct}%`, rightX + 12, topY + boxH - 22);

  // 右翼下半：实时三枚色票条（标出 163 原海报三色系统）
  const swY = topY + boxH + 14;
  if (spread.y + spread.h - swY >= 52) {
    ctx.fillStyle = "rgba(198, 214, 206, 0.72)";
    ctx.font = '600 9.5px "IBM Plex Mono", monospace';
    ctx.fillText("INK PALETTE · 163", rightX, swY);
    const chips = [
      ["#013230", "TEAL"],
      ["#F1E7D4", "CREAM"],
      ["#F0AF03", "GOLD"],
    ];
    const cw = (cardW - 12) / 3;
    chips.forEach(([hex, name], i) => {
      const cx = rightX + i * (cw + 6);
      ctx.fillStyle = hex;
      ctx.fillRect(cx, swY + 16, cw, 16);
      ctx.strokeStyle = "rgba(241, 231, 212, 0.28)";
      ctx.strokeRect(cx + 0.5, swY + 16.5, cw - 1, 15);
      ctx.fillStyle = "rgba(198, 214, 206, 0.72)";
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.fillText(name, cx, swY + 37);
    });
  }
  ctx.restore();
}

function drawStoryContent(ctx, spread, ev) {
  if (ev.story.id === "bowl") drawBowlStory(ctx, spread, ev);
  else if (ev.story.id === "oculus") drawOculusStory(ctx, spread, ev);
  else drawPosterStory(ctx, spread, ev);
}
