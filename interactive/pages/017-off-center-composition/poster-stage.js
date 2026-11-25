// 通栏活体海报纯平涂 2D SVG 舞台（零 3D、零高光阴影、零紫光晕，严格忠实于 017.webp 扁平几何质感）。
// 实时绘制：左下暗弧、偏置虚线十字与珊瑚交点、画心 +、5×5 白点阵、45° 珊瑚斜线、纯平涂珊瑚圆、
// 以及由五组元素共同算出的「合成视觉重心」与直接连向版面标注的折线引线。

import { PALETTE } from "./palette.js";

const NS = "http://www.w3.org/2000/svg";
const make = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

export function createPosterStage(host) {
  let W = 1160;
  let H = 610;

  const svg = make("svg", {
    class: "poster-svg",
    viewBox: `0 0 ${W} ${H}`,
    "aria-hidden": "true",
  });

  // 纯平涂深靛紫底（无任何径向光晕或渐变）
  const bgRect = make("rect", { x: 0, y: 0, width: W, height: H, fill: PALETTE.bg });

  // 1. 左下午夜紫四分之一厚弧 + 隐去时的虚线轮廓提示
  const arcGhost = make("path", {
    fill: "none",
    stroke: PALETTE.axisSoft,
    "stroke-width": 1.2,
    "stroke-dasharray": "5 5",
    visibility: "hidden",
  });
  const arcFill = make("path", {
    fill: PALETTE.arc,
    stroke: PALETTE.arcStroke,
    "stroke-width": 1.2,
  });

  // 2. 偏置白色虚线十字轴 + 珊瑚交点环（原海报特征）
  const axesG = make("g");
  const axisV = make("line", {
    stroke: PALETTE.axis,
    "stroke-width": 1.3,
    "stroke-dasharray": "8 7",
  });
  const axisH = make("line", {
    stroke: PALETTE.axis,
    "stroke-width": 1.3,
    "stroke-dasharray": "8 7",
  });
  const pivotOuter = make("circle", { r: 7.5, fill: PALETTE.coral });
  const pivotInner = make("circle", { r: 2.8, fill: PALETTE.bg });
  axesG.append(axisV, axisH, pivotOuter, pivotInner);

  // 3. 右上 5×5 白点阵（含关闭时的极细虚线框）
  const dotsBox = make("rect", {
    fill: "none",
    stroke: PALETTE.axisSoft,
    "stroke-width": 1,
    "stroke-dasharray": "4 4",
  });
  const dotsG = make("g");

  // 4. 右下 45° 珊瑚斜线群（含关闭时的虚线三角轮廓）
  const hatchesGhost = make("polygon", {
    fill: "none",
    stroke: PALETTE.coralSoft,
    "stroke-width": 1,
    "stroke-dasharray": "4 4",
  });
  const hatchesG = make("g", {
    stroke: PALETTE.coral,
    "stroke-width": 1.7,
    "stroke-linecap": "butt",
  });

  // 5. 纯平涂珊瑚红主圆（零高光、零阴影、零渐变） + 拖动时淡显的等距参考环
  const circleGuide = make("circle", {
    fill: "none",
    stroke: PALETTE.axisSoft,
    "stroke-width": 1.1,
    "stroke-dasharray": "4 4",
    visibility: "hidden",
  });
  const coralCircle = make("circle", {
    fill: PALETTE.coral,
  });

  // 6. 几何画心 +、画心→合成重心拉力连线、合成视觉重心几何符号、直连版面标注的折线引线
  const centerG = make("g");
  const centerCross = make("path", {
    fill: "none",
    stroke: PALETTE.axis,
    "stroke-width": 1.2,
  });
  const centerLabel = make("text", {
    fill: PALETTE.inkDim,
    "font-size": 11,
    "font-family": "Chivo, Noto Sans SC, sans-serif",
    "letter-spacing": "0.06em",
  });
  centerLabel.textContent = "画心";
  centerG.append(centerCross, centerLabel);

  const pullLine = make("line", {
    stroke: PALETTE.coralHot,
    "stroke-width": 1.6,
    "stroke-dasharray": "4 3",
  });

  // 引线：从合成重心点引出折线直达版面左侧（桌面）或底沿（手机）的标注区
  const leaderLine = make("polyline", {
    fill: "none",
    stroke: PALETTE.ink,
    "stroke-width": 1.4,
    "stroke-opacity": 0.85,
  });
  const leaderDot = make("circle", {
    r: 3.2,
    fill: PALETTE.ink,
  });

  // 经典工程「重心」平涂四分圆标（纯几何象限填色）
  const cogG = make("g");
  const cogHalo = make("circle", {
    r: 13.5,
    fill: PALETTE.bg,
    stroke: PALETTE.ink,
    "stroke-width": 1.6,
  });
  const cogQ1 = make("path", { d: "M 0 0 L 0 -9.5 A 9.5 9.5 0 0 1 9.5 0 Z", fill: PALETTE.coral });
  const cogQ3 = make("path", { d: "M 0 0 L 0 9.5 A 9.5 9.5 0 0 1 -9.5 0 Z", fill: PALETTE.coral });
  const cogQ2 = make("path", { d: "M 0 0 L 9.5 0 A 9.5 9.5 0 0 1 0 9.5 Z", fill: PALETTE.ink });
  const cogQ4 = make("path", { d: "M 0 0 L -9.5 0 A 9.5 9.5 0 0 1 0 -9.5 Z", fill: PALETTE.ink });
  const cogRing = make("circle", { r: 9.5, fill: "none", stroke: PALETTE.bg, "stroke-width": 1.2 });
  cogG.append(cogHalo, cogQ1, cogQ2, cogQ3, cogQ4, cogRing);

  svg.append(
    bgRect,
    arcGhost,
    arcFill,
    axesG,
    dotsBox,
    dotsG,
    hatchesGhost,
    hatchesG,
    circleGuide,
    coralCircle,
    centerG,
    pullLine,
    leaderLine,
    leaderDot,
    cogG
  );
  host.append(svg);

  // 计算当前画幅下的核心像素度量，返回给 main.js 用于对齐所有原生可点击/可拖 DOM 热区
  function computeMetrics(info) {
    const isPortrait = W / H < 1.15;
    const isShortLand = H <= 300 && W > H;
    const s = info.state;
    const a = info.anchors;

    // 基准边：控制主圆与暗弧在不同宽高比下都不挤、不压字
    const base = isPortrait ? Math.min(W, H) : Math.min(W * 0.62, H);

    // 1. 珊瑚主圆中心与半径（竖屏按原海报相对幅宽收精半径，确保圆稳居交点右上方且不贴重心符号）
    const cx = a.circle.u * W;
    const cy = a.circle.v * H;
    const cr = s.circleR * base * (isPortrait ? 0.72 : 1.04);

    // 2. 左下暗弧半径（左下角为圆心 (0, H)）
    const arcMaxOut = isPortrait ? Math.min(W * 0.43, H * 0.38) : isShortLand ? Math.min(W * 0.16, H * 0.36) : Math.min(W * 0.27, H * 0.39);
    const arcIn = arcMaxOut * 0.44;
    const arcOut = s.arcThick <= 0.01 ? arcIn : arcIn + (arcMaxOut - arcIn) * (0.18 + 0.82 * s.arcThick);

    // 暗弧边缘拖柄落在 45° 对角外沿上（零厚度时留在内沿位置方便拉出）
    const gripR = s.arcThick <= 0.01 ? arcIn + 14 : arcOut;
    const arcGripX = Math.cos(Math.PI / 4) * gripR;
    const arcGripY = H - Math.sin(Math.PI / 4) * gripR;

    // 3. 5×5 点阵矩形（稳居右上角，远离圆与标题）
    const dotStep = isPortrait ? Math.min(11, W * 0.03) : isShortLand ? 10 : Math.min(14, base * 0.025);
    const dotSpan = dotStep * 4;
    const padEdge = isPortrait ? 18 : isShortLand ? 16 : 26;
    const dotX0 = W - padEdge - dotSpan;
    const dotY0 = isPortrait ? 18 : isShortLand ? 14 : 24;

    // 4. 右下 45° 斜线三角区域
    const hSize = isPortrait ? Math.min(72, W * 0.2) : isShortLand ? Math.min(64, H * 0.24) : Math.min(116, base * 0.21);
    const hx0 = W - padEdge - hSize;
    const hy0 = H - padEdge;

    // 5. 合成重心与画心坐标
    const gx = info.gx * W;
    const gy = info.gy * H;
    const midX = W * 0.5;
    const midY = H * 0.5;

    return {
      W,
      H,
      isPortrait,
      isShortLand,
      base,
      cx,
      cy,
      cr,
      arcIn,
      arcOut,
      arcMaxOut,
      arcGripX,
      arcGripY,
      dotStep,
      dotSpan,
      dotX0,
      dotY0,
      hSize,
      hx0,
      hy0,
      gx,
      gy,
      midX,
      midY,
      crossX: a.crosshair.u * W,
      crossY: a.crosshair.v * H,
    };
  }

  function resize(w, h) {
    W = Math.max(240, Math.round(w || 1160));
    H = Math.max(180, Math.round(h || 610));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    bgRect.setAttribute("width", W);
    bgRect.setAttribute("height", H);
  }

  function render(info, { dragging = "", calloutAnchor = null } = {}) {
    const m = computeMetrics(info);
    const s = info.state;

    // 1. 左下暗弧
    const ghostR = m.arcIn + (m.arcMaxOut - m.arcIn) * 0.62;
    arcGhost.setAttribute(
      "d",
      `M 0 ${m.H - ghostR} A ${ghostR} ${ghostR} 0 0 1 ${ghostR} ${m.H}`
    );
    arcGhost.setAttribute("visibility", s.arcThick <= 0.02 ? "visible" : "hidden");

    if (s.arcThick <= 0.01) {
      arcFill.setAttribute("visibility", "hidden");
    } else {
      arcFill.setAttribute("visibility", "visible");
      arcFill.setAttribute(
        "d",
        `M 0 ${m.H - m.arcOut} A ${m.arcOut} ${m.arcOut} 0 0 1 ${m.arcOut} ${m.H} L ${m.arcIn} ${m.H} A ${m.arcIn} ${m.arcIn} 0 0 0 0 ${m.H - m.arcIn} Z`
      );
      arcFill.setAttribute("stroke", dragging === "arc" ? PALETTE.coralHot : PALETTE.arcStroke);
      arcFill.setAttribute("stroke-width", dragging === "arc" ? "2" : "1.2");
    }

    // 2. 偏置白色虚线十字轴（桌面/横屏横轴从左侧读数块右缘外起笔，绝不穿过左侧读数文字，也更忠于原海报）
    const padAxis = m.isPortrait ? 14 : 20;
    const axisHStart = m.isPortrait
      ? padAxis
      : calloutAnchor
        ? Math.min(m.crossX - 34, Math.max(padAxis, calloutAnchor.x + 6))
        : Math.min(m.crossX - 34, m.W * 0.40);
    axisV.setAttribute("x1", m.crossX.toFixed(1));
    axisV.setAttribute("y1", padAxis);
    axisV.setAttribute("x2", m.crossX.toFixed(1));
    axisV.setAttribute("y2", m.H - padAxis);
    axisH.setAttribute("x1", axisHStart.toFixed(1));
    axisH.setAttribute("y1", m.crossY.toFixed(1));
    axisH.setAttribute("x2", m.W - padAxis);
    axisH.setAttribute("y2", m.crossY.toFixed(1));
    pivotOuter.setAttribute("cx", m.crossX.toFixed(1));
    pivotOuter.setAttribute("cy", m.crossY.toFixed(1));
    pivotInner.setAttribute("cx", m.crossX.toFixed(1));
    pivotInner.setAttribute("cy", m.crossY.toFixed(1));

    // 3. 5×5 白点阵
    dotsBox.setAttribute("x", (m.dotX0 - 7).toFixed(1));
    dotsBox.setAttribute("y", (m.dotY0 - 7).toFixed(1));
    dotsBox.setAttribute("width", (m.dotSpan + 14).toFixed(1));
    dotsBox.setAttribute("height", (m.dotSpan + 14).toFixed(1));
    dotsBox.setAttribute("visibility", s.showDots ? "hidden" : "visible");

    if (dotsG.childElementCount !== 25) {
      dotsG.replaceChildren();
      for (let i = 0; i < 25; i++) dotsG.append(make("circle", { fill: PALETTE.ink }));
    }
    const dotR = m.isPortrait ? 2.1 : 2.5;
    dotsG.setAttribute("visibility", s.showDots ? "visible" : "hidden");
    if (s.showDots) {
      let idx = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const d = dotsG.children[idx++];
          d.setAttribute("cx", (m.dotX0 + c * m.dotStep).toFixed(1));
          d.setAttribute("cy", (m.dotY0 + r * m.dotStep).toFixed(1));
          d.setAttribute("r", dotR);
        }
      }
    }

    // 4. 右下 45° 珊瑚斜线群
    hatchesGhost.setAttribute(
      "points",
      `${m.hx0.toFixed(1)},${m.hy0.toFixed(1)} ${(m.hx0 + m.hSize).toFixed(1)},${(m.hy0 - m.hSize).toFixed(1)} ${(m.hx0 + m.hSize).toFixed(1)},${m.hy0.toFixed(1)}`
    );
    hatchesGhost.setAttribute("visibility", s.showHatches ? "hidden" : "visible");

    const lineCount = 9;
    if (hatchesG.childElementCount !== lineCount) {
      hatchesG.replaceChildren();
      for (let i = 0; i < lineCount; i++) hatchesG.append(make("line"));
    }
    hatchesG.setAttribute("visibility", s.showHatches ? "visible" : "hidden");
    if (s.showHatches) {
      for (let i = 0; i < lineCount; i++) {
        const t = i / (lineCount - 1);
        const l = hatchesG.children[i];
        l.setAttribute("x1", (m.hx0 + t * m.hSize).toFixed(1));
        l.setAttribute("y1", m.hy0.toFixed(1));
        l.setAttribute("x2", (m.hx0 + m.hSize).toFixed(1));
        l.setAttribute("y2", (m.hy0 - (1 - t) * m.hSize).toFixed(1));
      }
    }

    // 5. 纯平涂珊瑚红主圆
    coralCircle.setAttribute("cx", m.cx.toFixed(1));
    coralCircle.setAttribute("cy", m.cy.toFixed(1));
    coralCircle.setAttribute("r", m.cr.toFixed(1));
    circleGuide.setAttribute("cx", m.cx.toFixed(1));
    circleGuide.setAttribute("cy", m.cy.toFixed(1));
    circleGuide.setAttribute("r", (m.cr + 7).toFixed(1));
    circleGuide.setAttribute("visibility", dragging === "circle" ? "visible" : "hidden");

    // 6. 画心 + 与拉力连线（文字置于 + 上方，绝不与偏置水平虚线打架）
    centerCross.setAttribute(
      "d",
      `M ${(m.midX - 8).toFixed(1)} ${m.midY.toFixed(1)} H ${(m.midX + 8).toFixed(1)} M ${m.midX.toFixed(1)} ${(m.midY - 8).toFixed(1)} V ${(m.midY + 8).toFixed(1)}`
    );
    centerLabel.setAttribute("x", (m.midX - 11).toFixed(1));
    centerLabel.setAttribute("y", (m.midY - 12).toFixed(1));
    centerLabel.setAttribute("visibility", info.ecc > 0.045 ? "visible" : "hidden");

    pullLine.setAttribute("x1", m.midX.toFixed(1));
    pullLine.setAttribute("y1", m.midY.toFixed(1));
    pullLine.setAttribute("x2", m.gx.toFixed(1));
    pullLine.setAttribute("y2", m.gy.toFixed(1));
    pullLine.setAttribute("visibility", info.ecc > 0.02 ? "visible" : "hidden");

    // 7. 合成重心符号（根据三态微调描边色；竖屏略精巧以留出与珊瑚圆的呼吸间隙）
    const cogAccent =
      info.zone === "over" ? PALETTE.amber : info.zone === "center" ? PALETTE.inkMute : PALETTE.coral;
    cogQ1.setAttribute("fill", cogAccent);
    cogQ3.setAttribute("fill", cogAccent);
    cogHalo.setAttribute("stroke", info.zone === "over" ? PALETTE.amber : PALETTE.ink);
    const cogScale = m.isPortrait ? 0.88 : 1;
    cogG.setAttribute("transform", `translate(${m.gx.toFixed(1)} ${m.gy.toFixed(1)}) scale(${cogScale})`);

    // 8. 折线引线：桌面端连到海报左侧标注区右沿；手机竖屏斜折避开竖向虚线轴（至少错开 24px 以上）再落底沿
    if (m.isPortrait) {
      const rightMax = Math.min(m.W - 32, m.hx0 - 16);
      const rightMin = m.crossX + 36;
      const leftMin = Math.max(32, m.arcOut + 14);
      const leftMax = m.crossX - 28;
      let targetX;
      if (m.gx >= m.crossX - 4 || leftMin > leftMax) {
        targetX = clampPt(Math.max(m.gx + 26, rightMin), rightMin, Math.max(rightMin, rightMax));
      } else {
        targetX = clampPt(Math.min(m.gx - 22, leftMax), leftMin, leftMax);
      }
      const bendY = clampPt(m.gy + 28, m.gy + 18, m.H - 28);
      leaderLine.setAttribute(
        "points",
        `${m.gx.toFixed(1)},${m.gy.toFixed(1)} ${targetX.toFixed(1)},${bendY.toFixed(1)} ${targetX.toFixed(1)},${m.H}`
      );
      leaderDot.setAttribute("cx", targetX.toFixed(1));
      leaderDot.setAttribute("cy", (m.H - 2).toFixed(1));
    } else {
      const tx = calloutAnchor ? calloutAnchor.x : m.W * 0.37;
      const ty = calloutAnchor ? calloutAnchor.y : m.H * 0.56;
      const elbowX = tx + Math.min(48, Math.max(18, (m.gx - tx) * 0.34));
      leaderLine.setAttribute(
        "points",
        `${tx.toFixed(1)},${ty.toFixed(1)} ${elbowX.toFixed(1)},${ty.toFixed(1)} ${m.gx.toFixed(1)},${m.gy.toFixed(1)}`
      );
      leaderDot.setAttribute("cx", tx.toFixed(1));
      leaderDot.setAttribute("cy", ty.toFixed(1));
    }

    return m;
  }

  return { resize, render, computeMetrics };
}

function clampPt(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
