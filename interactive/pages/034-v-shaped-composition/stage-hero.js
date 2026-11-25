// 034 V形构图 — 开场「V形聚光剧场调光台」2D Canvas 渲染与直接操控
// 纯 2D Canvas，不依赖 WebGL（nowebgl 下 100% 完整），通过 lib/stage.js 省电循环。

import { loop, pixelRatio } from "../../lib/stage.js";
import { FIELD, SCENES, clamp, solveGeometry } from "./model.js";

const COLORS = {
  bgDeep: "#14091B",
  bgMid: "#1B0D24",
  bgGlow: "rgba(214, 62, 118, 0.16)",
  beamDark: "rgba(96, 28, 62, 0.72)",
  beamMid: "#CF4172",
  beamLight: "#F6CBA5",
  champagne: "#F8D1AE",
  champagneSoft: "rgba(248, 209, 174, 0.72)",
  magenta: "#D93D76",
  magentaBright: "#F26A99",
  err: "#FF7F73",
  errBg: "rgba(184, 34, 48, 0.24)",
  ok: "#72E3B8",
  okGlow: "rgba(114, 227, 184, 0.22)",
  gridLine: "rgba(248, 209, 174, 0.065)",
};

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let W = 800;
  let H = 460;
  let dpr = 1;
  let hitTargets = { leftHandle: null, rightHandle: null, focal: null, rebels: [] };

  // 平滑视觉插值（让切换预设与开场每一帧都流畅，still 时一步到位）
  const anim = {
    leftDeg: state.leftDeg,
    rightDeg: state.rightDeg,
    focalX: state.focalX,
    focalY: state.focalY,
    focalWeight: state.focalWeight,
    intro: 0,
  };

  let needResize = true;
  function measure() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(280, Math.round(r.width));
    H = Math.max(240, Math.round(r.height));
    dpr = pixelRatio(W <= 540 ? 1.25 : 1.75);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    needResize = false;
  }
  const ro = new ResizeObserver(() => { needResize = true; });
  ro.observe(canvas);

  // 物理场坐标 (x ∈ [-halfW, halfW], y ∈ [0, 1]) <-> 像素坐标 (px, py)
  // 关键：保持 X 与 Y 同比例尺，彻底杜绝任何屏幕上圆变椭圆或角度畸变！
  const toPx = (nx, ny) => ({
    x: W * 0.5 + nx * H,
    y: ny * H,
  });
  const toNorm = (px, py) => ({
    x: (px - W * 0.5) / H,
    y: py / H,
  });

  function drawWingBeam(outer, apex, sideSign, g, isOk, t) {
    // 把光束沿着 (outer -> apex) 方向绘制成 034 原海报同款的「暗紫红底带 + 亮品红主光束 + 香槟桃金锋利外沿」三层叠光
    const dx = apex.x - outer.x;
    const dy = apex.y - outer.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // 外法向（朝画布外侧展开厚度）
    const nx = -uy * sideSign;
    const ny = ux * sideSign;

    // 向下穿出谷底微许，交汇成锐尖
    const tip = { x: apex.x + ux * (H * 0.015), y: apex.y + uy * (H * 0.015) };
    // 顶部展宽按原海报比例：上宽下收成锋芒楔形
    const wTopOuter = H * 0.145;
    const wTopMain = H * 0.088;
    const wTopEdge = H * 0.014;
    const wTip = H * 0.008;

    // 1. 暗紫红外层幕带
    ctx.beginPath();
    ctx.moveTo(outer.x - nx * (wTopOuter * 0.45), outer.y - ny * (wTopOuter * 0.45));
    ctx.lineTo(outer.x + nx * wTopOuter, outer.y + ny * wTopOuter);
    ctx.lineTo(tip.x + nx * (wTip * 1.4), tip.y + ny * (wTip * 1.4));
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fillStyle = g.isUp ? "rgba(130, 56, 78, 0.42)" : COLORS.beamDark;
    ctx.fill();

    // 2. 主品红聚光光束（平涂三层叠色，忠实还原原海报版画利落感且极省软件光栅开销）
    ctx.beginPath();
    ctx.moveTo(outer.x, outer.y);
    ctx.lineTo(outer.x + nx * wTopMain, outer.y + ny * wTopMain);
    ctx.lineTo(tip.x + nx * wTip, tip.y + ny * wTip);
    ctx.lineTo(tip.x, tip.y);
    ctx.closePath();
    ctx.fillStyle = g.isUp ? "rgba(226, 102, 114, 0.78)" : (isOk ? "#DC4578" : "#CF4072");
    ctx.fill();

    // 3. 香槟桃金锋利外沿镶边（还原 034 原海报标志细节）
    ctx.beginPath();
    ctx.moveTo(outer.x + nx * wTopMain, outer.y + ny * wTopMain);
    ctx.lineTo(outer.x + nx * (wTopMain + wTopEdge), outer.y + ny * (wTopMain + wTopEdge));
    ctx.lineTo(tip.x + nx * (wTip + 2.5), tip.y + ny * (wTip + 2.5));
    ctx.lineTo(tip.x + nx * wTip, tip.y + ny * wTip);
    ctx.closePath();
    ctx.fillStyle = COLORS.beamLight;
    ctx.fill();

    // 4. 内侧香槟虚线导轨 + 箭头（原海报经典双虚线箭头）
    if (state.showGuides) {
      const inset = H * 0.048;
      const p1 = { x: outer.x - nx * inset + ux * (len * 0.14), y: outer.y - ny * inset + uy * (len * 0.14) };
      const p2 = { x: tip.x - nx * (inset * 0.35) - ux * (len * 0.18), y: tip.y - ny * (inset * 0.35) - uy * (len * 0.18) };
      ctx.save();
      ctx.strokeStyle = COLORS.champagneSoft;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -(t * 28);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 导轨箭头尖
      const ah = 7;
      ctx.fillStyle = COLORS.champagne;
      ctx.beginPath();
      ctx.moveTo(p2.x + ux * 4, p2.y + uy * 4);
      ctx.lineTo(p2.x - ux * ah + nx * 4.5, p2.y - uy * ah + ny * 4.5);
      ctx.lineTo(p2.x - ux * ah - nx * 4.5, p2.y - uy * ah - ny * 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSceneBackdrop(g, apexPx, focalPx, t) {
    // 轻量双层舞台聚光晕（避开昂贵全屏径向渐变）
    ctx.fillStyle = g.passed === 4 ? "rgba(220, 56, 116, 0.13)" : "rgba(209, 67, 117, 0.08)";
    ctx.beginPath();
    ctx.arc(focalPx.x, focalPx.y, H * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.passed === 4 ? "rgba(248, 209, 174, 0.08)" : "rgba(209, 67, 117, 0.06)";
    ctx.beginPath();
    ctx.arc(focalPx.x, focalPx.y, H * 0.17, 0, Math.PI * 2);
    ctx.fill();

    // 极细腻的舞台制图参考线（中轴 + 底焦舒适纵深带 58%–85%）
    ctx.save();
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();

    if (state.showGuides && !g.isUp) {
      const yMin = 0.58 * H;
      const yMax = 0.85 * H;
      ctx.fillStyle = "rgba(248, 209, 174, 0.03)";
      ctx.fillRect(0, yMin, W, yMax - yMin);
      ctx.strokeStyle = "rgba(248, 209, 174, 0.16)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(16, yMin);
      ctx.lineTo(W - 16, yMin);
      ctx.moveTo(16, yMax);
      ctx.lineTo(W - 16, yMax);
      ctx.stroke();
      ctx.setLineDash([]);
      if (W >= 540) {
        ctx.fillStyle = "rgba(248, 209, 174, 0.42)";
        ctx.font = `500 11px "Noto Serif SC", serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("重心下沉甜区（58%–85%）", 18, yMax - 6);
      }
    }

    // 不同题材的专属环境母题
    if (state.scene === "launch") {
      // 发布会暗紫大屏地平线 + 观众席暗剪影弧线（无五官）
      const floorY = H * 0.84;
      ctx.strokeStyle = "rgba(248, 209, 174, 0.16)";
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(W, floorY);
      ctx.stroke();

      // 两侧微弱斜屏条纹
      ctx.fillStyle = "rgba(248, 209, 174, 0.045)";
      for (let i = 0; i < 4; i++) {
        const y = H * (0.14 + i * 0.12);
        ctx.fillRect(W * 0.5 - H * 0.22, y, H * 0.44, 1);
      }
      // 底部一排极克制的观众肩头剪影（无五官）
      ctx.fillStyle = "#0F0615";
      const count = Math.max(8, Math.floor(W / 62));
      for (let i = 0; i <= count; i++) {
        const sx = (i / count) * W;
        const distCenter = Math.abs(sx - W * 0.5) / (W * 0.5);
        if (distCenter < 0.24) continue; // 中央让给主舞台展台
        const sy = H + 4;
        ctx.beginPath();
        ctx.arc(sx, sy - 16, 15, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy - 33, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (state.scene === "ceremony") {
      // 颁奖礼深紫穹顶拱肋与礼仪地毯透视线
      const steps = 5;
      ctx.strokeStyle = "rgba(248, 209, 174, 0.09)";
      for (let i = 1; i <= steps; i++) {
        const r = H * (0.16 + i * 0.11);
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.72, r, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      }
      // 中心红毯光带
      ctx.fillStyle = "rgba(209, 67, 117, 0.08)";
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - H * 0.04, H * 0.76);
      ctx.lineTo(W * 0.5 + H * 0.04, H * 0.76);
      ctx.lineTo(W * 0.5 + H * 0.16, H);
      ctx.lineTo(W * 0.5 - H * 0.16, H);
      ctx.closePath();
      ctx.fill();
    } else {
      // 原海报模式：在谷心轻绘 034 原海报标志性的 4 阶下沉关键词阶梯（汇聚 ▼ 聚焦 ▼ 仪式感 ▼ 重心下沉）
      const words = [
        { zh: "汇聚", en: "CONVERGENCE" },
        { zh: "聚焦", en: "FOCUS" },
        { zh: "仪式感", en: "CEREMONY" },
        { zh: "重心下沉", en: "VISUAL WEIGHT" },
      ];
      const topY = g.isUp ? H * 0.36 : H * 0.10;
      const safeBottom = g.isUp ? H * 0.88 : Math.min(H * 0.62, apexPx.y - 54);
      const availSpan = Math.max(0, safeBottom - topY);
      const stepH = Math.min(H * 0.105, 48, availSpan / 3.2);
      const axisX = W * 0.5 + clamp(g.apexX * 0.28, -0.10, 0.10) * H;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const isCompact = W < 440 || H < 300;

      words.forEach((w, idx) => {
        const y = topY + idx * Math.max(28, stepH);
        // 自动避让交点光环与高焦点，彻底杜绝穿字叠压
        if (!g.isUp && y > safeBottom) return;
        if (Math.hypot(axisX - focalPx.x, y - focalPx.y) < H * 0.15) return;
        if (Math.hypot(axisX - apexPx.x, y - apexPx.y) < H * 0.15) return;
        const active = g.passed >= idx + 1;
        ctx.fillStyle = active ? "rgba(248, 209, 174, 0.92)" : "rgba(232, 203, 174, 0.44)";
        ctx.font = `700 ${isCompact ? 11 : 13.5}px "Noto Serif SC", serif`;
        ctx.fillText(w.zh, axisX, y);
        if (!isCompact && stepH >= 38) {
          ctx.fillStyle = active ? "rgba(232, 203, 174, 0.65)" : "rgba(186, 166, 148, 0.34)";
          ctx.font = `500 9px "Space Grotesk", sans-serif`;
          ctx.fillText(w.en, axisX, y + 12);
        }
        // 小玫红三角 ▼（倒 V 时朝上 ▲）
        const triY = y + (isCompact || stepH < 38 ? 13 : 22);
        if (!g.isUp && triY > safeBottom + 6) return;
        ctx.fillStyle = g.isUp ? COLORS.err : (active ? COLORS.magentaBright : "rgba(209, 67, 117, 0.55)");
        ctx.beginPath();
        if (g.isUp) {
          ctx.moveTo(axisX, triY - 4);
          ctx.lineTo(axisX - 4.5, triY + 3);
          ctx.lineTo(axisX + 4.5, triY + 3);
        } else {
          ctx.moveTo(axisX, triY + 4);
          ctx.lineTo(axisX - 4.5, triY - 3);
          ctx.lineTo(axisX + 4.5, triY - 3);
        }
        ctx.closePath();
        ctx.fill();
      });
    }

    // 流动的视线光粒（合批一次 fill 减少 draw call）
    const particleCount = W < 480 ? 3 : 5;
    const lOut = toPx(g.leftOuter.x, g.leftOuter.y);
    const rOut = toPx(g.rightOuter.x, g.rightOuter.y);
    ctx.fillStyle = "rgba(248, 209, 174, 0.78)";
    ctx.beginPath();
    for (let i = 0; i < particleCount; i++) {
      const phase = ((t * 0.32) + i / particleCount) % 1;
      for (const start of [lOut, rOut]) {
        const px = start.x + (apexPx.x - start.x) * phase;
        const py = start.y + (apexPx.y - start.y) * phase;
        ctx.moveTo(px + 2.2, py);
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  function drawSunburstAndRings(centerPx, radius, isOk, isErr, t) {
    ctx.save();
    // 034 原海报标志性细放射线（单路径一次 stroke，零循环开销）
    const rays = 32;
    ctx.strokeStyle = isOk
      ? "rgba(248, 209, 174, 0.18)"
      : isErr
        ? "rgba(255, 127, 115, 0.15)"
        : "rgba(209, 67, 117, 0.15)";
    ctx.lineWidth = 1;
    const rot = t * 0.08;
    ctx.beginPath();
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + rot;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      ctx.moveTo(centerPx.x + ca * (radius * 1.15), centerPx.y + sa * (radius * 1.15));
      ctx.lineTo(centerPx.x + ca * (radius * 2.5), centerPx.y + sa * (radius * 2.5));
    }
    ctx.stroke();

    // 外圈细实线圆
    ctx.strokeStyle = isOk ? "rgba(114, 227, 184, 0.55)" : "rgba(232, 203, 174, 0.34)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(centerPx.x, centerPx.y, radius * 1.52, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈虚线香槟圆
    ctx.strokeStyle = isOk ? COLORS.ok : COLORS.champagne;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerPx.x, centerPx.y, radius * 1.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawFocalSubject(focalPx, g, t) {
    const baseR = Math.min(H * 0.088, 42) * anim.focalWeight;
    const isOk = g.checks.okFocal && !g.isUp;
    const isMiss = !g.checks.okFocal;

    // 1. 先画理论交点的空靶环（若焦点尚未对准交点，清晰标出「视线落在此处扑空」）
    const apexPx = toPx(g.apexX, g.apexY);
    if (g.apexY <= 1.02 && g.apexY >= -0.02) {
      drawSunburstAndRings(apexPx, Math.min(H * 0.084, 40), isOk && g.passed === 4, isMiss, t);
      if (!g.checks.okFocalAlign && !g.isUp) {
        ctx.save();
        // 连线标出焦点与交点的真实错位距
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(apexPx.x, apexPx.y);
        ctx.lineTo(focalPx.x, focalPx.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 空靶提示文字（紧凑不撞两侧离心框）
        ctx.fillStyle = "rgba(20, 9, 27, 0.9)";
        const text = W < 480 ? "空谷交点" : "空谷交点·拖焦入靶";
        const pillW = W < 480 ? 68 : 112;
        const pillH = 22;
        const py = clamp(apexPx.y + (H < 300 ? 28 : 38), 24, H - 22);
        const px = clamp(apexPx.x, pillW / 2 + 10, W - pillW / 2 - 10);
        ctx.fillRect(px - pillW / 2, py - pillH / 2, pillW, pillH);
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1;
        ctx.strokeRect(px - pillW / 2, py - pillH / 2, pillW, pillH);
        ctx.fillStyle = COLORS.err;
        ctx.font = `600 11px "Noto Serif SC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, px, py);
        ctx.restore();
      }
    }

    // 2. 绘制主体焦点（随三题材换形态，全保等比正形！）
    ctx.save();
    ctx.translate(focalPx.x, focalPx.y);

    if (state.scene === "launch") {
      // 发布会发光底座 + 极简硬件主体 + 无五官剪影立人
      ctx.fillStyle = "rgba(248, 209, 174, 0.18)";
      ctx.beginPath();
      ctx.ellipse(0, baseR * 0.55, baseR * 1.15, baseR * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isOk ? COLORS.ok : COLORS.champagne;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 发光产品立板
      const grad = ctx.createLinearGradient(-baseR * 0.5, -baseR * 0.7, baseR * 0.5, baseR * 0.5);
      grad.addColorStop(0, "#F8D1AE");
      grad.addColorStop(0.5, "#D93D76");
      grad.addColorStop(1, "#6C1E46");
      ctx.fillStyle = grad;
      ctx.fillRect(-baseR * 0.44, -baseR * 0.68, baseR * 0.88, baseR * 1.16);
      ctx.strokeStyle = COLORS.champagne;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-baseR * 0.44, -baseR * 0.68, baseR * 0.88, baseR * 1.16);

      // 无五官极简演讲者剪影立于展台旁
      const px = -baseR * 0.78;
      ctx.fillStyle = "#F8D1AE";
      ctx.beginPath();
      ctx.arc(px, baseR * 0.04, baseR * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - baseR * 0.13, baseR * 0.52);
      ctx.lineTo(px - baseR * 0.1, baseR * 0.18);
      ctx.lineTo(px + baseR * 0.1, baseR * 0.18);
      ctx.lineTo(px + baseR * 0.13, baseR * 0.52);
      ctx.closePath();
      ctx.fill();
    } else if (state.scene === "ceremony") {
      // 颁奖典礼几何奖杯与星芒底座
      ctx.fillStyle = "rgba(217, 61, 118, 0.22)";
      ctx.beginPath();
      ctx.ellipse(0, baseR * 0.62, baseR * 1.05, baseR * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createLinearGradient(0, -baseR, 0, baseR * 0.6);
      grad.addColorStop(0, "#FFEBD2");
      grad.addColorStop(0.55, "#F29C8E");
      grad.addColorStop(1, "#D14375");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -baseR * 0.92);
      ctx.lineTo(baseR * 0.42, -baseR * 0.25);
      ctx.lineTo(baseR * 0.18, baseR * 0.34);
      ctx.lineTo(baseR * 0.5, baseR * 0.58);
      ctx.lineTo(-baseR * 0.5, baseR * 0.58);
      ctx.lineTo(-baseR * 0.18, baseR * 0.34);
      ctx.lineTo(-baseR * 0.42, -baseR * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#FFF0DB";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      // 034 原海报标志：45° 旋转切面品红菱形焦晶（无渐变开销，切面更锐利）
      ctx.fillStyle = "#EB5A8B";
      ctx.beginPath();
      ctx.moveTo(0, -baseR);
      ctx.lineTo(baseR, 0);
      ctx.lineTo(0, baseR);
      ctx.lineTo(-baseR, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#BE2D62";
      ctx.beginPath();
      ctx.moveTo(0, -baseR);
      ctx.lineTo(baseR, 0);
      ctx.lineTo(0, baseR);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isOk ? COLORS.ok : (isMiss ? COLORS.err : COLORS.champagne);
      ctx.lineWidth = isMiss ? 2 : 1.5;
      ctx.stroke();

      // 内嵌极细香槟菱框
      ctx.strokeStyle = "rgba(248, 209, 174, 0.55)";
      ctx.lineWidth = 1;
      const ir = baseR * 0.64;
      ctx.beginPath();
      ctx.moveTo(0, -ir);
      ctx.lineTo(ir, 0);
      ctx.lineTo(0, ir);
      ctx.lineTo(-ir, 0);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // 焦点下方原海报同款标注「视觉焦点 / FOCAL POINT」（左右 clamp 防止窄屏擦边裁字）
    const sceneMeta = SCENES[state.scene];
    const labelText = isMiss ? `${sceneMeta.focalName}（拖回交点）` : sceneMeta.focalName;
    const labelY = clamp(focalPx.y + baseR + 20, 26, H - 14);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isOk ? COLORS.ok : (isMiss ? COLORS.err : "#F26A99");
    ctx.font = `700 ${W < 440 ? 12 : 14}px "Noto Serif SC", serif`;
    const halfLabelW = ctx.measureText(labelText).width * 0.5 + 10;
    const labelX = clamp(focalPx.x, halfLabelW, W - halfLabelW);
    ctx.fillText(labelText, labelX, labelY);
    if (W >= 460 && labelY + 15 < H - 4) {
      ctx.fillStyle = "rgba(232, 203, 174, 0.62)";
      ctx.font = `500 10px "Space Grotesk", sans-serif`;
      ctx.fillText(`—  ${sceneMeta.focalEn}  —`, labelX, labelY + 15);
    }
    ctx.restore();

    hitTargets.focal = { x: focalPx.x, y: focalPx.y, r: Math.max(30, baseR * 1.25) };
  }

  function drawHandlesAndRebels(g) {
    // 左右光翼可拖拽圆柄
    const lh = toPx(g.leftHandle.x, g.leftHandle.y);
    const rh = toPx(g.rightHandle.x, g.rightHandle.y);
    const asymErr = !g.checks.okSym;

    const drawHandle = (pt, deg, side) => {
      ctx.save();
      ctx.fillStyle = "#180C1E";
      ctx.strokeStyle = asymErr ? COLORS.err : COLORS.champagne;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 双向旋转箭头简符
      ctx.fillStyle = asymErr ? COLORS.err : COLORS.champagne;
      ctx.font = `500 10px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(deg)}°`, pt.x, pt.y + 0.5);

      // 上方小说明签（桌面端显示，绝不撞菱形焦点）
      if (W >= 540) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(248, 209, 174, 0.82)";
        ctx.font = `500 11px "Noto Serif SC", serif`;
        ctx.fillText(side === "left" ? "拖左翼" : "拖右翼", pt.x, pt.y - 24);
      }
      ctx.restore();
    };

    drawHandle(lh, state.leftDeg, "left");
    drawHandle(rh, state.rightDeg, "right");
    hitTargets.leftHandle = { x: lh.x, y: lh.y, r: 24 };
    hitTargets.rightHandle = { x: rh.x, y: rh.y, r: 24 };

    // 两枚离心逆向干扰块（置于左右下翼开阔外侧，永不与交点或焦点碰撞）
    hitTargets.rebels = [];
    const bw = W < 440 ? 92 : 116;
    const bh = H < 300 ? 36 : 42;

    g.rebelSpots.forEach((spot, idx) => {
      const active = state.rebels[idx];
      const cx = spot.side === "left"
        ? Math.max(bw * 0.5 + 12, Math.min(W * 0.22, W * 0.5 - H * 0.36))
        : Math.min(W - bw * 0.5 - 12, Math.max(W * 0.78, W * 0.5 + H * 0.36));
      const cy = clamp(H * (g.isUp ? 0.34 : 0.79), bh * 0.5 + 16, H - bh * 0.5 - 14);

      ctx.save();
      if (active) {
        // 错态红虚框 + 向外逃逸箭头
        ctx.fillStyle = COLORS.errBg;
        ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        ctx.strokeStyle = COLORS.err;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
        ctx.setLineDash([]);

        ctx.fillStyle = "#FFD2CC";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${W < 440 ? 11 : 12}px "Noto Serif SC", serif`;
        ctx.fillText(`${spot.side === "left" ? "↖ " : ""}${spot.label}${spot.side === "right" ? " ↗" : ""}`, cx, cy - 7);
        ctx.fillStyle = COLORS.err;
        ctx.font = `500 10px "Noto Serif SC", serif`;
        ctx.fillText(spot.sub, cx, cy + 9);
      } else {
        // 归顺态：低调的香槟细引线朝向底部交点
        const apexPx = toPx(g.apexX, g.apexY);
        const ang = Math.atan2(apexPx.y - cy, apexPx.x - cx);
        ctx.strokeStyle = "rgba(114, 227, 184, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(ang) * 18, cy - Math.sin(ang) * 18);
        ctx.lineTo(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18);
        ctx.stroke();
        ctx.fillStyle = COLORS.ok;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18, 3, 0, Math.PI * 2);
        ctx.fill();
        if (W >= 540) {
          ctx.fillStyle = "rgba(114, 227, 184, 0.78)";
          ctx.font = `500 11px "Noto Serif SC", serif`;
          ctx.textAlign = "center";
          ctx.fillText("已归顺向底", cx, cy - 12);
        }
      }
      ctx.restore();

      hitTargets.rebels.push({
        id: idx,
        x: cx - bw / 2,
        y: cy - bh / 2,
        w: bw,
        h: bh,
        active,
      });
    });

    // 右上角轻量实时夹角标牌（实算度数）
    ctx.save();
    const hudText = `夹角 ${Math.round(g.vAngle)}° · ${g.passed}/4`;
    ctx.font = `500 12px "DM Mono", monospace`;
    const tw = ctx.measureText(hudText).width + 22;
    const hx = W - tw - 14;
    const hy = 12;
    ctx.fillStyle = "rgba(18, 8, 23, 0.84)";
    ctx.fillRect(hx, hy, tw, 28);
    ctx.strokeStyle = g.passed === 4 ? COLORS.ok : (g.tone === "error" ? COLORS.err : COLORS.champagne);
    ctx.lineWidth = 1;
    ctx.strokeRect(hx, hy, tw, 28);
    ctx.fillStyle = g.passed === 4 ? COLORS.ok : (g.tone === "error" ? "#FFB3AA" : COLORS.champagne);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, hx + tw / 2, hy + 14.5);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (needResize) measure();

    // 平滑趋近（still 或手动拖动时即时响应）
    const k = still || dragging ? 1 : Math.min(1, dt * 11 || 0.25);
    anim.leftDeg += (state.leftDeg - anim.leftDeg) * k;
    anim.rightDeg += (state.rightDeg - anim.rightDeg) * k;
    anim.focalX += (state.focalX - anim.focalX) * k;
    anim.focalY += (state.focalY - anim.focalY) * k;
    anim.focalWeight += (state.focalWeight - anim.focalWeight) * k;
    anim.intro = still ? 1 : Math.min(1, anim.intro + (dt || 0.04) * 1.8);

    const drawState = {
      ...state,
      leftDeg: anim.leftDeg,
      rightDeg: anim.rightDeg,
      focalX: anim.focalX,
      focalY: anim.focalY,
      focalWeight: anim.focalWeight,
    };
    const g = solveGeometry(drawState);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深李紫夜幕底色（纯色铺底极省软件渲染带宽）
    ctx.fillStyle = COLORS.bgDeep;
    ctx.fillRect(0, 0, W, H);

    const apexPx = toPx(g.apexX, g.apexY);
    const focalPx = toPx(drawState.focalX, drawState.focalY);
    const leftOuterPx = toPx(g.leftOuter.x, g.leftOuter.y);
    const rightOuterPx = toPx(g.rightOuter.x, g.rightOuter.y);

    drawSceneBackdrop(g, apexPx, focalPx, still ? 0.6 : t);

    // 绘制左右双斜光翼
    drawWingBeam(leftOuterPx, apexPx, -1, g, g.passed === 4, still ? 0 : t);
    drawWingBeam(rightOuterPx, apexPx, +1, g, g.passed === 4, still ? 0 : t);

    // 若已开导轨，画 V 谷内角小弧线标记
    if (state.showGuides && g.apexY <= 0.98 && g.apexY >= 0.02) {
      const arcR = Math.min(H * 0.14, 58);
      const aL = Math.atan2(leftOuterPx.y - apexPx.y, leftOuterPx.x - apexPx.x);
      const aR = Math.atan2(rightOuterPx.y - apexPx.y, rightOuterPx.x - apexPx.x);
      ctx.save();
      ctx.strokeStyle = g.checks.okAngle ? "rgba(114, 227, 184, 0.7)" : "rgba(248, 209, 174, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (g.isUp) {
        ctx.arc(apexPx.x, apexPx.y, arcR, aR, aL, false);
      } else {
        ctx.arc(apexPx.x, apexPx.y, arcR, aL, aR, false);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawFocalSubject(focalPx, g, still ? 0 : t);
    drawHandlesAndRebels(g);

    ctx.restore();
  }

  // ---------- 指针与触屏交互（兼容鼠标 + 单指横拖不锁页面竖滚） ----------
  let dragging = null; // null | "left" | "right" | "focal" | "sweep"
  let startPt = null;
  let startSnapshot = null;
  let pointerMoved = false;

  const getLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function hitTest(pt) {
    // 1. 优先命中逆向红框（点击归顺）
    for (const rb of hitTargets.rebels) {
      if (pt.x >= rb.x && pt.x <= rb.x + rb.w && pt.y >= rb.y && pt.y <= rb.y + rb.h) {
        return { kind: "rebel", id: rb.id };
      }
    }
    // 2. 命中菱形焦点
    if (hitTargets.focal && Math.hypot(pt.x - hitTargets.focal.x, pt.y - hitTargets.focal.y) <= hitTargets.focal.r) {
      return { kind: "focal" };
    }
    // 3. 命中左右光翼圆柄
    if (hitTargets.leftHandle && Math.hypot(pt.x - hitTargets.leftHandle.x, pt.y - hitTargets.leftHandle.y) <= hitTargets.leftHandle.r) {
      return { kind: "left" };
    }
    if (hitTargets.rightHandle && Math.hypot(pt.x - hitTargets.rightHandle.x, pt.y - hitTargets.rightHandle.y) <= hitTargets.rightHandle.r) {
      return { kind: "right" };
    }
    // 4. 画布其余区域：横向拖同步开合双翼夹角（适配 perf 横拖与直觉扫动）
    return { kind: "sweep" };
  }

  function startPointer(pt, pointerId) {
    const hit = hitTest(pt);
    startPt = pt;
    pointerMoved = false;
    startSnapshot = {
      leftDeg: state.leftDeg,
      rightDeg: state.rightDeg,
      focalX: state.focalX,
      focalY: state.focalY,
    };
    dragging = hit;
    if (pointerId != null && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(pointerId); } catch {}
    }
  }

  function movePointer(pt) {
    if (!dragging || !startPt) return;
    const dx = pt.x - startPt.x;
    const dy = pt.y - startPt.y;
    if (Math.hypot(dx, dy) > 4) pointerMoved = true;

    if (dragging.kind === "focal") {
      const n = toNorm(pt.x, pt.y);
      const maxX = Math.max(0.45, (W / H) * 0.44);
      state.focalX = clamp(n.x, -maxX, maxX);
      state.focalY = clamp(n.y, 0.22, 0.88);
      // 接近真实解析交点时轻吸附
      const g = solveGeometry(state);
      if (!g.isUp && Math.hypot(state.focalX - g.apexX, state.focalY - g.apexY) < 0.045) {
        state.focalX = g.apexX;
        state.focalY = clamp(g.apexY, 0.24, 0.88);
      }
      onChange();
    } else if (dragging.kind === "left") {
      // 向右拖增大左翼倾角（变宽），向左拖变陡
      const deltaDeg = (dx / Math.max(180, W * 0.42)) * 52;
      state.leftDeg = clamp(startSnapshot.leftDeg + deltaDeg, FIELD.minTilt, FIELD.maxTilt);
      if (Math.abs(state.leftDeg - state.rightDeg) < 2) state.leftDeg = state.rightDeg;
      onChange();
    } else if (dragging.kind === "right") {
      // 向左拖增大右翼倾角（对称外张），向右拖变陡
      const deltaDeg = (-dx / Math.max(180, W * 0.42)) * 52;
      state.rightDeg = clamp(startSnapshot.rightDeg + deltaDeg, FIELD.minTilt, FIELD.maxTilt);
      if (Math.abs(state.rightDeg - state.leftDeg) < 2) state.rightDeg = state.leftDeg;
      onChange();
    } else if (dragging.kind === "sweep") {
      // 画布任意处横拖：同步调节双翼开合夹角
      const deltaDeg = (dx / Math.max(160, W * 0.48)) * 34;
      state.leftDeg = clamp(startSnapshot.leftDeg + deltaDeg, FIELD.minTilt, FIELD.maxTilt);
      state.rightDeg = clamp(startSnapshot.rightDeg + deltaDeg, FIELD.minTilt, FIELD.maxTilt);
      onChange();
    }
  }

  function endPointer(pt) {
    if (!dragging) return;
    if (dragging.kind === "rebel" && !pointerMoved) {
      state.rebels[dragging.id] = !state.rebels[dragging.id];
      onChange();
    } else if (dragging.kind === "sweep" && !pointerMoved && pt) {
      // 轻点某处如果刚好在焦点外且很近空谷交点，把焦点吸引过去方便触屏用户
      const g = solveGeometry(state);
      const apexPx = toPx(g.apexX, g.apexY);
      if (!g.isUp && Math.hypot(pt.x - apexPx.x, pt.y - apexPx.y) < 42) {
        state.focalX = g.apexX;
        state.focalY = clamp(g.apexY, 0.24, 0.88);
        onChange();
      }
    }
    dragging = null;
    startPt = null;
    startSnapshot = null;
  }

  // 同时支持 PointerEvents 和 TouchEvents（perf.mjs 通过 CDP dispatchTouchEvent 触发）
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由 touch 事件以便横向判定不锁竖滚
    const pt = getLocal(e);
    startPointer(pt, e.pointerId);
    if (dragging.kind !== "rebel") e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const pt = getLocal(e);
    if (dragging) {
      movePointer(pt);
    } else {
      const h = hitTest(pt);
      canvas.style.cursor = h.kind === "rebel" ? "pointer" : h.kind === "focal" ? "grab" : "ew-resize";
    }
  });
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch" || !dragging) return;
    endPointer(getLocal(e));
  });

  // 触屏：横向主导或命中特定把手时拦截，竖向滑动放行页面滚动
  let touchMode = null; // null | "pending" | "drag" | "scroll"
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    startPointer(pt, null);
    touchMode = dragging.kind === "focal" || dragging.kind === "left" || dragging.kind === "right" ? "drag" : "pending";
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!dragging || !e.touches.length || touchMode === "scroll") return;
    const t0 = e.touches[0];
    const r = canvas.getBoundingClientRect();
    const pt = { x: t0.clientX - r.left, y: t0.clientY - r.top };
    if (touchMode === "pending") {
      const dx = Math.abs(pt.x - startPt.x);
      const dy = Math.abs(pt.y - startPt.y);
      if (dy > dx + 6 && dy > 8) {
        touchMode = "scroll";
        dragging = null;
        return;
      }
      if (dx > 4) touchMode = "drag";
    }
    if (touchMode === "drag") {
      e.preventDefault();
      movePointer(pt);
    }
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    if (dragging) endPointer(startPt);
    touchMode = null;
  });

  // 键盘操作：←/→ 调双翼夹角，↑/↓ 调底焦纵深，R 复原，Space 切正/倒 V
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.leftDeg = clamp(state.leftDeg - 2, FIELD.minTilt, FIELD.maxTilt);
      state.rightDeg = clamp(state.rightDeg - 2, FIELD.minTilt, FIELD.maxTilt);
      onChange();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      state.leftDeg = clamp(state.leftDeg + 2, FIELD.minTilt, FIELD.maxTilt);
      state.rightDeg = clamp(state.rightDeg + 2, FIELD.minTilt, FIELD.maxTilt);
      onChange();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.focalY = clamp(state.focalY - 0.03, 0.24, 0.88);
      onChange();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.focalY = clamp(state.focalY + 0.03, 0.24, 0.88);
      onChange();
    }
  });

  const handle = loop(canvas, render);
  window.addEventListener("resize", () => handle.draw());

  return {
    draw: () => handle.draw(),
    snapAnim: () => {
      anim.leftDeg = state.leftDeg;
      anim.rightDeg = state.rightDeg;
      anim.focalX = state.focalX;
      anim.focalY = state.focalY;
      anim.focalWeight = state.focalWeight;
      handle.draw();
    },
  };
}
