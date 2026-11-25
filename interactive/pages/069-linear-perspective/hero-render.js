// 069 线性透视 · 首屏建筑广场与双联蓝图渲染器（纯 2D Canvas，零 shadowBlur，软硬件皆 60fps）
import { clamp, REF_FOCAL } from "./model.js";

// 预生成轻质混凝土颗粒离屏纹理（仅生成一次，零逐帧像素开销）
let grainPatternCache = null;
function getConcretePattern(ctx) {
  if (grainPatternCache) return grainPatternCache;
  const off = document.createElement("canvas");
  off.width = 96;
  off.height = 96;
  const g = off.getContext("2d");
  // 确定性伪随机，保证截屏与多次刷新完全一致
  let seed = 69069;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(rand() * 96);
    const y = Math.floor(rand() * 96);
    const bright = rand() > 0.5;
    g.fillStyle = bright ? "rgba(255,255,255,0.10)" : "rgba(18,28,34,0.06)";
    g.fillRect(x, y, rand() > 0.7 ? 2 : 1, 1);
  }
  grainPatternCache = ctx.createPattern(off, "repeat");
  return grainPatternCache;
}

const CYAN = "#04A5D5";
const CYAN_DEEP = "#066E8E";
const CYAN_RUNNER = "#249BB9";
const CYAN_RUNNER_HI = "#0BA9D8";
const ERR_RED = "#C42B1F";
const OK_TEAL = "#0C7A5C";
const INK = "#0D1519";

// 渲染主建筑透视广场（1:1 化用 069 原海报 + 3 套场景题材）
// reveal ∈ [0, 1] 为开场射线展开进度，pulse ∈ [0, 1] 为轻微呼吸相位
export function renderPlaza(ctx, W, H, state, geo, { reveal = 1, pulse = 0, hoverNode = null, dragNode = null } = {}) {
  const {
    vpMainU,
    horizonV,
    vpWallU,
    vpWallV,
    monoliths,
    floorCrossVs,
    runnerHalfWidth,
    vpGap,
    dims,
    score,
  } = geo;

  const vpX = vpMainU * W;
  const vpY = horizonV * H;
  const wvpX = vpWallU * W;
  const wvpY = vpWallV * H;

  const isCompact = W < 540;
  const fontScale = isCompact ? 0.88 : 1;

  // 1. 建筑冷雾天幕（逐像素致敬 069 原海报上段 #ECECEE → #D8DDE1）
  const skyGrad = ctx.createLinearGradient(0, 0, W, vpY);
  if (state.scene === "metro") {
    skyGrad.addColorStop(0, "#DFE5EA");
    skyGrad.addColorStop(0.55, "#CFD7DD");
    skyGrad.addColorStop(1, "#C3CDD4");
  } else if (state.scene === "florence") {
    skyGrad.addColorStop(0, "#F0F1EE");
    skyGrad.addColorStop(0.6, "#E1E5E7");
    skyGrad.addColorStop(1, "#D5DCE0");
  } else {
    skyGrad.addColorStop(0, "#F1F3F5");
    skyGrad.addColorStop(0.55, "#E3E7EA");
    skyGrad.addColorStop(1, "#D8DEE2");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, vpY + 1);

  // 2. 混凝土地坪面（原海报中下段 #D1D7DB → #AEB6BC）
  const floorGrad = ctx.createLinearGradient(0, vpY, 0, H);
  floorGrad.addColorStop(0, "#D4DBDF");
  floorGrad.addColorStop(0.35, "#C5CDD2");
  floorGrad.addColorStop(1, "#A8B2B8");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, vpY, W, H - vpY);

  // 轻质混凝土颗粒质感层（静态展示时绘制，拖拽过程中跳过大面积 pattern 填充以保软渲染 60fps）
  if (!dragNode && W <= 1800) {
    const pat = getConcretePattern(ctx);
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // 3. 地铁场景的顶部弧拱微背景（烘托长通道感，不喧宾夺主）
  if (state.scene === "metro") {
    ctx.save();
    for (let i = 4; i >= 0; i--) {
      const m = monoliths[i];
      const rx = Math.max(12, Math.abs(vpX - m.innerNearU * W) * 1.15);
      const ry = Math.max(10, Math.abs(vpY - m.topNearV * H) * 1.12);
      ctx.beginPath();
      ctx.ellipse(vpX, m.floorNearV * H - ry * 0.48, rx, ry, 0, Math.PI, 0);
      ctx.strokeStyle = `rgba(18, 42, 54, ${0.10 + (4 - i) * 0.055})`;
      ctx.lineWidth = i === 0 ? 2.4 : 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. 地面网格线（纵线汇聚到主灭点，横缝按当前 depthLaw 呈现真 1/z 或错误等距）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, vpY, W, H - vpY);
  ctx.clip();

  // 4a. 地面纵向辐射透视线
  const groundRayOffsets = [-1.45, -1.05, -0.72, -0.45, -0.24, 0.24, 0.45, 0.72, 1.05, 1.45];
  ctx.strokeStyle = "rgba(4, 165, 213, 0.34)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const off of groundRayOffsets) {
    const bx = vpX + off * W;
    const ex = vpX + (bx - vpX) * reveal;
    const ey = vpY + (H - vpY) * reveal;
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(ex, ey);
  }
  ctx.stroke();

  // 4b. 地坪横缝（合批单路径绘制，零逐行 stroke 开销）
  ctx.lineWidth = 1;
  ctx.strokeStyle = dims.depth.ok ? "rgba(4, 140, 184, 0.28)" : "rgba(196, 43, 31, 0.30)";
  ctx.beginPath();
  for (let k = 0; k < floorCrossVs.length; k++) {
    const y = floorCrossVs[k] * H;
    if (y <= vpY + 2) continue;
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  // 4c. 标志性青色中轴引导道（1:1 化用 069 原海报中央青带 + 白色虚线中轴 + 白色 ↑ 箭头）
  const runHalfPx = runnerHalfWidth * W;
  const runGrad = ctx.createLinearGradient(0, vpY, 0, H);
  runGrad.addColorStop(0, "rgba(11, 169, 216, 0.25)");
  runGrad.addColorStop(0.28, CYAN_RUNNER);
  runGrad.addColorStop(1, CYAN_RUNNER_HI);

  ctx.beginPath();
  ctx.moveTo(vpX, vpY);
  ctx.lineTo(vpX - runHalfPx, H);
  ctx.lineTo(vpX + runHalfPx, H);
  ctx.closePath();
  ctx.fillStyle = runGrad;
  ctx.fill();

  // 青道边线
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vpX, vpY);
  ctx.lineTo(vpX - runHalfPx, H);
  ctx.moveTo(vpX, vpY);
  ctx.lineTo(vpX + runHalfPx, H);
  ctx.stroke();

  // 中央白色透视虚线（节距随 1/z 变短）
  ctx.strokeStyle = "rgba(246, 250, 252, 0.86)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(vpX, vpY + 8);
  ctx.lineTo(vpX, H - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // 底部白色前进箭头 ↑（与原海报一致，轻微随 pulse 上浮 2px 表达视线推进）
  const arrowY = H - (isCompact ? 18 : 24) - Math.sin(pulse * Math.PI * 2) * 1.8;
  const arrowS = isCompact ? 6.5 : 8.5;
  ctx.strokeStyle = "#F7FBFD";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(vpX, arrowY + arrowS * 0.9);
  ctx.lineTo(vpX, arrowY - arrowS * 0.7);
  ctx.moveTo(vpX - arrowS * 0.75, arrowY - arrowS * 0.05);
  ctx.lineTo(vpX, arrowY - arrowS * 0.85);
  ctx.lineTo(vpX + arrowS * 0.75, arrowY - arrowS * 0.05);
  ctx.stroke();

  ctx.restore();

  // 5. 全景辐射青色透视辅助射线（开场动态展开，贯穿整幅画面，还原 069 原海报精髓）
  if (state.showRays) {
    ctx.save();
    const rayAngles = [-164, -148, -132, -114, -95, -72, -48, -28, -14, 14, 30, 50];
    ctx.strokeStyle = "rgba(4, 165, 213, 0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const maxLen = Math.hypot(W, H) * reveal;
    for (const deg of rayAngles) {
      const rad = (deg * Math.PI) / 180;
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.cos(rad) * maxLen, vpY + Math.sin(rad) * maxLen);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 6. 左侧建筑体块列（由远到近绘制，保证自然遮挡层次；原海报深黑混凝土→浅雾灰）
  // 并在原海报风格下为每个近中景体块叠加细青色结构网格线
  for (let i = monoliths.length - 1; i >= 0; i--) {
    const m = monoliths[i];
    const xInNear = m.innerNearU * W;
    const xInFar = m.innerFarU * W;
    const xOutNear = Math.max(-W * 0.15, m.outerNearU * W);
    const yBotNear = m.floorNearV * H;
    const yBotFar = m.floorFarV * H;
    const yTopNear = m.topNearV * H;
    const yTopFar = m.topFarV * H;

    // 地面接触微影
    ctx.fillStyle = `rgba(12, 24, 30, ${(0.18 * (1 - i * 0.16)).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(xInNear, yBotNear);
    ctx.lineTo(xInFar, yBotFar);
    ctx.lineTo(xInFar + (xInFar - xInNear) * 0.22, yBotFar + 2);
    ctx.lineTo(xInNear + Math.max(8, (xInNear - xOutNear) * 0.14), yBotNear + 4);
    ctx.closePath();
    ctx.fill();

    // 正立面（朝观众侧，较深或较亮构成体积转折）
    ctx.fillStyle = m.frontCss;
    ctx.beginPath();
    ctx.rect(xOutNear, yTopNear, Math.max(1, xInNear - xOutNear), Math.max(1, yBotNear - yTopNear));
    ctx.fill();

    // 内侧纵深面（沿退行射线收束向 wallVP）
    ctx.fillStyle = m.sideCss;
    ctx.beginPath();
    ctx.moveTo(xInNear, yTopNear);
    ctx.lineTo(xInFar, yTopFar);
    ctx.lineTo(xInFar, yBotFar);
    ctx.lineTo(xInNear, yBotNear);
    ctx.closePath();
    ctx.fill();

    // 若视平线高过体块顶面，绘制可见的顶面
    if (yTopFar < yTopNear - 1) {
      const xOutFar = xOutNear + (wvpX - xOutNear) * ((xInFar - xInNear) / Math.max(1, wvpX - xInNear));
      ctx.fillStyle = m.sideCss;
      ctx.beginPath();
      ctx.moveTo(xOutNear, yTopNear);
      ctx.lineTo(xInNear, yTopNear);
      ctx.lineTo(xInFar, yTopFar);
      ctx.lineTo(xOutFar, yTopFar);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fill();
    }

    // 佛罗伦萨回廊：在内侧立面切出半圆拱门洞
    if (state.scene === "florence") {
      const midX = (xInNear + xInFar) * 0.5;
      const archBot = (yBotNear + yBotFar) * 0.5;
      const archTop = (yTopNear + yTopFar) * 0.5;
      const archH = Math.max(6, archBot - archTop);
      const archW = Math.max(4, Math.abs(xInFar - xInNear) * 0.54);
      ctx.fillStyle = "rgba(220, 228, 233, 0.55)";
      ctx.beginPath();
      ctx.moveTo(midX - archW * 0.5, archBot);
      ctx.lineTo(midX - archW * 0.5, archBot - archH * 0.52);
      ctx.ellipse(midX, archBot - archH * 0.52, archW * 0.5, archH * 0.22, 0, Math.PI, 0);
      ctx.lineTo(midX + archW * 0.5, archBot);
      ctx.closePath();
      ctx.fill();
    }

    // 标志性青色建筑网格覆盖（原海报最前景巨块上的青色棋盘线）
    const lineColor = dims.vanishing.ok
      ? `rgba(4, 175, 224, ${m.gridAlpha.toFixed(2)})`
      : `rgba(218, 62, 46, ${Math.min(0.9, m.gridAlpha + 0.1).toFixed(2)})`;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = i === 0 ? 1.25 : 0.9;

    // 轮廓描边
    ctx.beginPath();
    ctx.moveTo(xInNear, yTopNear);
    ctx.lineTo(xInFar, yTopFar);
    ctx.lineTo(xInFar, yBotFar);
    ctx.lineTo(xInNear, yBotNear);
    ctx.closePath();
    ctx.stroke();

    // 正立面与侧面细分格子（前 3 块画细网格）
    if (i <= 2) {
      ctx.beginPath();
      const rows = 4;
      for (let r = 1; r < rows; r++) {
        const f = r / rows;
        const yN = yTopNear + (yBotNear - yTopNear) * f;
        const yF = yTopFar + (yBotFar - yTopFar) * f;
        ctx.moveTo(xOutNear, yN);
        ctx.lineTo(xInNear, yN);
        ctx.lineTo(xInFar, yF);
      }
      const cols = 3;
      for (let c = 1; c < cols; c++) {
        const f = c / cols;
        const gx = xInNear + (xInFar - xInNear) * f;
        const gyT = yTopNear + (yTopFar - yTopNear) * f;
        const gyB = yBotNear + (yBotFar - yBotNear) * f;
        ctx.moveTo(gx, gyT);
        ctx.lineTo(gx, gyB);
      }
      ctx.stroke();
    }
  }

  // 7. 右侧建筑对称参考立柱轮廓（轻量线框，让宽屏右半同时呈现双侧走廊空间感而不遮挡留白）
  ctx.save();
  ctx.strokeStyle = "rgba(4, 150, 198, 0.28)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const m = monoliths[i];
    const distFromVp = vpX - m.innerNearU * W;
    if (distFromVp <= 10) continue;
    const rx = vpX + distFromVp * 1.04;
    if (rx > W - 6) continue;
    // 用主灭点镜像右侧柱高（当墙灭点跑偏时，两侧立刻形成明显对比！）
    const mirrorRatio = (rx - vpX) / Math.max(1, W * 0.42);
    const botY = vpY + (H - vpY) * clamp(mirrorRatio * 0.78, 0.06, 0.92);
    const topY = vpY - (vpY) * clamp(mirrorRatio * 0.46, 0.04, 0.76);
    ctx.beginPath();
    ctx.moveTo(rx, topY);
    ctx.lineTo(rx, botY);
    ctx.stroke();
    // 柱脚微标点
    ctx.fillStyle = "rgba(4, 150, 198, 0.45)";
    ctx.fillRect(rx - 2, botY - 2, 4, 4);
  }
  ctx.restore();

  // 8. 墙面实际退行射线（直接从首块顶角/底角延伸到 wallVP，直观暴露灭点是否分叉！）
  const frontM = monoliths[0];
  const fInX = frontM.innerNearU * W;
  const fTopY = frontM.topNearV * H;
  const fBotY = frontM.floorNearV * H;

  ctx.save();
  ctx.strokeStyle = dims.vanishing.ok ? CYAN : ERR_RED;
  ctx.lineWidth = dims.vanishing.ok ? 1.5 : 1.9;
  ctx.setLineDash(dims.vanishing.ok ? [] : [7, 4]);
  ctx.beginPath();
  ctx.moveTo(fInX, fTopY);
  ctx.lineTo(wvpX, wvpY);
  ctx.moveTo(fInX, fBotY);
  ctx.lineTo(wvpX, wvpY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 9. 水平虚线「视平线 (HORIZON LINE)」（原海报标志符号）
  ctx.save();
  ctx.strokeStyle = dims.direction.ok ? CYAN_DEEP : ERR_RED;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(12, vpY);
  ctx.lineTo(W - 12, vpY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 右端视平线标注牌（高对比底牌，绝不被底图干扰）
  const hLabel = isCompact ? `视平线 ${Math.round(horizonV * 100)}%` : `视平线 HORIZON LINE · ${Math.round(horizonV * 100)}%`;
  ctx.font = `600 ${Math.round(11 * fontScale)}px "JetBrains Mono", "Noto Sans SC", sans-serif`;
  const hTw = ctx.measureText(hLabel).width;
  const hx = W - hTw - 22;
  const hy = Math.max(16, vpY - 24);
  ctx.fillStyle = "rgba(246, 248, 250, 0.92)";
  ctx.fillRect(hx - 6, hy - 12, hTw + 12, 18);
  ctx.strokeStyle = "rgba(6, 110, 142, 0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hx - 6, hy - 12, hTw + 12, 18);
  ctx.fillStyle = CYAN_DEEP;
  ctx.fillText(hLabel, hx, hy + 1);
  ctx.restore();

  // 10. 主灭点节点（大道汇聚点 · 青色靶环）与错位墙面灭点节点（可直拖）
  const drawNode = (x, y, { color, ringColor, active, label, sublabel, above }) => {
    const r = active ? 11 : 8.5;
    // 外柔光环（不用 shadowBlur，用双层半透环）
    ctx.beginPath();
    ctx.arc(x, y, r + 7 + Math.sin(pulse * Math.PI * 2) * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = ringColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#F6F8FA";
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (label) {
      ctx.font = `700 ${Math.round(11.5 * fontScale)}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 14;
      const bh = 22;
      const bx = clamp(x - bw / 2, 10, W - bw - 10);
      const by = above ? Math.max(10, y - r - bh - 10) : Math.min(H - bh - 10, y + r + 10);
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, bx + 7, by + 15);
      if (sublabel && !isCompact) {
        ctx.font = `500 10.5px "JetBrains Mono", monospace`;
        const sw = ctx.measureText(sublabel).width;
        const sx = clamp(x - sw / 2, 10, W - sw - 10);
        const sy = above ? by - 6 : by + bh + 13;
        ctx.fillStyle = INK;
        ctx.fillText(sublabel, sx, sy);
      }
    }
  };

  // 若墙面灭点未合拢，画出红虚线偏差向量
  if (!dims.vanishing.ok) {
    ctx.save();
    ctx.strokeStyle = ERR_RED;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(wvpX, wvpY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 主灭点（青色）
    drawNode(vpX, vpY, {
      color: CYAN_DEEP,
      ringColor: "rgba(4, 165, 213, 0.22)",
      active: hoverNode === "mainVP" || dragNode === "mainVP",
      label: isCompact ? "大道灭点" : "主灭点（拖移改视点）",
      above: false,
    });

    // 错位墙面灭点（朱红高亮提示直接拖拽）
    drawNode(wvpX, wvpY, {
      color: ERR_RED,
      ringColor: "rgba(196, 43, 31, 0.22)",
      active: hoverNode === "wallVP" || dragNode === "wallVP",
      label: isCompact ? `拖回主灭点 Δ${Math.round(vpGap * 100)}%` : `左墙灭点偏离 ${Math.round(vpGap * 100)}% · 拖向主灭点`,
      above: wvpY <= vpY,
    });
  } else {
    // 已合拢：单一青色/松青灭点（可拖移探索正中/偏心/高低视平线）
    drawNode(vpX, vpY, {
      color: score === 4 ? OK_TEAL : CYAN_DEEP,
      ringColor: score === 4 ? "rgba(12, 122, 92, 0.22)" : "rgba(4, 165, 213, 0.22)",
      active: hoverNode === "mainVP" || dragNode === "mainVP",
      label: score === 4 ? (isCompact ? "单灭点成立 · 可拖" : "共享消失点 · 拖移试偏心/高低视点") : "灭点已合拢",
      above: false,
    });
  }

  // 11. 左上角极简工程铭牌（不遮主景，读数来自单真源）
  ctx.save();
  const hud = `${score}/4 · FOV ${Math.round(geo.fovDeg)}° (${geo.equivMm}mm) · 高比 ${geo.heightRatio.toFixed(1)}×`;
  ctx.font = `500 ${Math.round(11 * fontScale)}px "JetBrains Mono", "Noto Sans SC", monospace`;
  const hudW = ctx.measureText(hud).width + 18;
  ctx.fillStyle = "rgba(4, 15, 18, 0.86)";
  ctx.fillRect(12, 12, hudW, 24);
  ctx.fillStyle = score === 4 ? "#4CE0B3" : "#38C9F2";
  ctx.fillRect(12, 12, 3, 24);
  ctx.fillStyle = "#F0F5F8";
  ctx.fillText(hud, 22, 28);
  ctx.restore();

  // 返回命中坐标（归一化），供 pointer 交互直接命中
  return { vpX, vpY, wvpX, wvpY };
}

// 渲染底右双联活体蓝图（1:1 复刻 069 原海报「线性透视示意图」 ⇄ 「阿尔贝蒂视觉金字塔」俯视剖面）
export function renderBlueprint(ctx, W, H, state, geo) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#F6F7FA";
  ctx.fillRect(0, 0, W, H);

  // 外围细制图框线（致敬原海报白框线稿）
  ctx.strokeStyle = "#C9D4DC";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  if (state.blueprintTab === "pyramid") {
    renderPyramidView(ctx, W, H, state, geo);
  } else {
    renderPosterDiagramView(ctx, W, H, state, geo);
  }
}

// 蓝图模式 A：原海报「线性透视示意图」（6 座青色线框立方体实时随主画布透视参数联动！）
function renderPosterDiagramView(ctx, W, H, state, geo) {
  const padX = 18;
  const padY = 18;
  const iw = W - padX * 2;
  const ih = H - padY * 2;

  const vpX = padX + geo.vpMainU * iw;
  const vpY = padY + clamp(geo.horizonV * 0.62, 0.16, 0.56) * ih;
  const wvpX = padX + geo.vpWallU * iw;
  const wvpY = padY + clamp(geo.vpWallV * 0.62, 0.10, 0.62) * ih;

  // 视平线
  ctx.strokeStyle = "rgba(4, 165, 213, 0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, vpY);
  ctx.lineTo(W - padX, vpY);
  ctx.stroke();

  // 背景辐射线
  ctx.strokeStyle = "rgba(4, 165, 213, 0.16)";
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const bx = padX + (iw * i) / 8;
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(bx, H - padY);
  }
  ctx.stroke();

  // 6 座原海报经典分布线框方盒（3 左 + 3 右，按当前 FOV / depthLaw / wallVP 同步投射）
  const dFactor = clamp(geo.d / REF_FOCAL, 0.36, 2.2);
  const depthScale = (base) => {
    if (state.depthLaw === "true") return clamp(base / Math.pow(dFactor, 0.42), 0.12, 0.52);
    if (state.depthLaw === "linear") return 0.16;
    return -0.14; // 反透视反向张开
  };

  const boxes = [
    // [xCenterNorm, yCenterNorm, wNorm, hNorm, baseRecede, useWallVp]
    [0.16, 0.54, 0.15, 0.24, 0.34, true],
    [0.37, 0.68, 0.12, 0.26, 0.28, true],
    [0.42, 0.43, 0.06, 0.12, 0.26, true],
    [0.57, 0.40, 0.055, 0.10, 0.26, false],
    [0.64, 0.68, 0.12, 0.24, 0.30, false],
    [0.82, 0.52, 0.14, 0.22, 0.34, false],
  ];

  const mainStroke = geo.dims.vanishing.ok ? "#0A8FB8" : "#0A8FB8";
  for (const [cxN, cyN, wN, hN, rec, isLeft] of boxes) {
    const cx = padX + cxN * iw;
    const cy = padY + cyN * ih;
    const bw = wN * iw;
    const bh = hN * ih;
    const x1 = cx - bw / 2;
    const y1 = cy - bh / 2;
    const x2 = cx + bw / 2;
    const y2 = cy + bh / 2;

    const tx = isLeft ? wvpX : vpX;
    const ty = isLeft ? wvpY : vpY;
    const k = depthScale(rec);
    const rx1 = x1 + (tx - x1) * k;
    const ry1 = y1 + (ty - y1) * k;
    const rx2 = x2 + (tx - x2) * k;
    const ry2 = y2 + (ty - y2) * k;

    // 淡青延射线指向对应灭点
    ctx.strokeStyle = isLeft && !geo.dims.vanishing.ok ? "rgba(196,43,31,0.38)" : "rgba(4,165,213,0.28)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(tx, ty);
    ctx.moveTo(x2, y2);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // 远面（虚/浅）
    ctx.strokeStyle = isLeft && !geo.dims.vanishing.ok ? "rgba(196,43,31,0.55)" : "rgba(4,165,213,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx1, ry1, rx2 - rx1, ry2 - ry1);

    // 4 条纵棱
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(rx1, ry1);
    ctx.moveTo(x2, y1); ctx.lineTo(rx2, ry1);
    ctx.moveTo(x2, y2); ctx.lineTo(rx2, ry2);
    ctx.moveTo(x1, y2); ctx.lineTo(rx1, ry2);
    ctx.stroke();

    // 近面（实线）
    ctx.strokeStyle = isLeft && !geo.dims.vanishing.ok ? ERR_RED : mainStroke;
    ctx.lineWidth = 1.35;
    ctx.strokeRect(x1, y1, bw, bh);
  }

  // 主灭点圆点
  ctx.beginPath();
  ctx.arc(vpX, vpY, 4, 0, Math.PI * 2);
  ctx.fillStyle = CYAN;
  ctx.fill();

  if (!geo.dims.vanishing.ok) {
    ctx.beginPath();
    ctx.arc(wvpX, wvpY, 4, 0, Math.PI * 2);
    ctx.fillStyle = ERR_RED;
    ctx.fill();
  }
}

// 蓝图模式 B：阿尔贝蒂「视觉金字塔」俯视光路剖面（直击 1/z 压缩与视距 FOV 原理）
function renderPyramidView(ctx, W, H, state, geo) {
  const padX = 22;
  const padY = 22;
  const eyeX = padX + 26;
  const eyeY = H * 0.56;

  // 画面平面（画窗位置随焦距 d 伸缩：广角画窗离眼近，望远画窗离眼远）
  const planeOffset = clamp(44 + (geo.d / REF_FOCAL) * 34, 34, Math.min(130, W * 0.34));
  const planeX = eyeX + planeOffset;
  const planeHalfH = Math.min(H * 0.34, 58);

  // 视锥包络线
  const coneEndX = W - padX;
  const slope = planeHalfH / planeOffset;
  const farHalfH = Math.min(H * 0.44, slope * (coneEndX - eyeX));
  ctx.fillStyle = geo.dims.direction.ok ? "rgba(4, 165, 213, 0.08)" : "rgba(196, 43, 31, 0.08)";
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(coneEndX, eyeY - farHalfH);
  ctx.lineTo(coneEndX, eyeY + farHalfH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = geo.dims.direction.ok ? "rgba(4, 165, 213, 0.55)" : "rgba(196, 43, 31, 0.60)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(coneEndX, eyeY - farHalfH);
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(coneEndX, eyeY + farHalfH);
  ctx.stroke();
  ctx.setLineDash([]);

  // 真实 3D 等距体块在俯视图里的位置（展示「三维里其实等距，投到画窗上才越远越密！」）
  const startWorldX = planeX + 24;
  const worldSpan = Math.max(60, W - padX - startWorldX - 10);
  const blockW = worldSpan / 6.2;
  const wallY = eyeY - Math.min(34, H * 0.22);

  for (let i = 0; i < 5; i++) {
    const bx = startWorldX + i * (worldSpan / 5);
    // 真实 3D 方块（俯视永远等大等距！）
    ctx.fillStyle = geo.monoliths[i].frontCss;
    ctx.fillRect(bx, wallY - 12, Math.max(8, blockW * 0.65), 12);

    // 从方块前角连向观察眼 E 的投射线
    ctx.strokeStyle = "rgba(6, 110, 142, 0.48)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY);
    ctx.lineTo(bx, wallY);
    ctx.stroke();

    // 投射线穿破「画窗（Picture Plane）」的交点——直观展示 1/z 越往后越挤！
    const tPlane = (planeX - eyeX) / Math.max(1, bx - eyeX);
    const hitY = eyeY + (wallY - eyeY) * tPlane;
    ctx.beginPath();
    ctx.arc(planeX, hitY, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = CYAN;
    ctx.fill();
  }

  // 垂直画窗线（Alberti's Finestra）
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(planeX, eyeY - planeHalfH);
  ctx.lineTo(planeX, eyeY + planeHalfH);
  ctx.stroke();

  // 观察眼点 E
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = geo.dims.direction.ok ? CYAN_DEEP : ERR_RED;
  ctx.fill();

  // 清晰制图标注
  ctx.font = `600 10.5px "Noto Sans SC", "JetBrains Mono", sans-serif`;
  ctx.fillStyle = INK;
  ctx.fillText("眼位 E", eyeX - 10, eyeY + 18);
  ctx.fillStyle = CYAN_DEEP;
  ctx.fillText(`画窗 · FOV ${Math.round(geo.fovDeg)}°`, planeX - 18, Math.max(22, eyeY - planeHalfH - 6));
  ctx.fillStyle = "#46545C";
  ctx.fillText("三维里体块等距 → 画窗交点自动按 1/z 收紧", Math.min(startWorldX, W - 216), H - 14);
}
