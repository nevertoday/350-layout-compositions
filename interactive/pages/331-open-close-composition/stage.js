// 331 开合构图 — 开场「双扉开合·纳景泄气台」2D 解析三维透视画布
// 1:1 承袭 331 原海报暖米原纸 × 炽烈朱橘红双折门 × 中央主体圆 × 上下虚线打开箭
// 纯 2D Canvas 渲染，GPU 与 SwiftShader 软件渲染皆稳 60fps，关掉 WebGL 零降级差异。

import { computeGeometry, evaluate, PORTAL, THEMES, clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const COL = {
  paper: "#FCF6E6",
  paperDeep: "#F2E6CE",
  vermilion: "#F64D16",
  vermilionDeep: "#D83B0A",
  vermilionLight: "#FF7647",
  vermilionText: "#B82E06",
  ink: "#12110F",
  inkSoft: "#48443D",
  dash: "#666057",
  ok: "#156343",
  warn: "#B0220C",
  // 宋画·峡谷云门配色
  scrollPaper: "#F5ECD7",
  scrollInkDark: "#24221E",
  scrollInkMid: "#474139",
  scrollOchre: "#A55B2D",
  scrollMist: "rgba(252, 246, 230, 0.88)",
  // 书封配色
  coverGround: "#FAF2E1",
  coverPanel: "#181512",
  coverAccent: "#F64D16",
};

export function createHeroStage(canvas, { getState, onPatch, onInspect }) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;

  // 平滑插值状态（拖动时跟手，预设切换时优雅缓动）
  const anim = {
    leftAngle: getState().leftAngle,
    rightAngle: getState().rightAngle,
    topShut: getState().topShut ? 1 : 0,
    botShut: getState().botShut ? 1 : 0,
    intro: 0,
  };

  // 点击热区（每帧同步实绘坐标，绝不硬编码）
  let hitZones = {
    topVent: null,
    botVent: null,
    quickFix: null,
    leftDoor: null,
    rightDoor: null,
    portalBox: null,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    dpr = pixelRatio(2);
    const nw = Math.round(rect.width * dpr);
    const nh = Math.round(rect.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    w = rect.width;
    h = rect.height;
    return true;
  }

  // 把归一化门框 [0..1]×[0..1] 等比映射进画布（绝不拉伸变形，确保圆永远是正圆且宽屏有气势！）
  function getPortalBox() {
    const compact = h < 330 || w < 520;
    const padY = compact ? Math.max(26, h * 0.085) : Math.max(20, h * 0.055);
    const usableH = Math.max(120, h - padY * 2);
    const aspect = w < 480 ? 1.06 : 1.32;
    const maxBoxW = w < 480 ? w - 16 : Math.min(w - 140, usableH * 1.62);
    let boxW = Math.min(maxBoxW, usableH * aspect);
    let boxH = Math.min(usableH, boxW / aspect);
    if (w >= 960) {
      // 宽屏下让门框稳健舒展，避免缩成中间一小块
      boxH = usableH;
      boxW = Math.min(w - 150, boxH * 1.42);
    }
    const ox = (w - boxW) * 0.5;
    const oy = (h - boxH) * 0.5;
    return { ox, oy, bw: boxW, bh: boxH };
  }

  const px = (box, u) => box.ox + u * box.bw;
  const py = (box, v) => box.oy + v * box.bh;
  // 与 model.js 单真源对齐的主体半径（严格取等比像素值，永远是正圆）
  const subjectRadiusPx = (box, g) => Math.min(g.subject.r * box.bw, box.bh * 0.135);

  function drawDashedArrow(x1, y1, x2, y2, color, headSize = 7, dash = [5, 5]) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.45;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.setLineDash([]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2 - headSize * Math.cos(ang - 0.52), y2 - headSize * Math.sin(ang - 0.52));
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headSize * Math.cos(ang + 0.52), y2 - headSize * Math.sin(ang + 0.52));
    ctx.stroke();
    ctx.restore();
  }

  // 绘制实时视线吐纳射线流（撞上门扉折返护心；遇开口顺势逸出画外）
  function drawSightlineFlow(box, g, topShutVal, botShutVal, t, evalRes, theme) {
    const cx = px(box, g.subject.cx);
    const cy = py(box, g.subject.cy);
    const r = subjectRadiusPx(box, g);
    const xL = px(box, g.left.innerX);
    const xR = px(box, g.right.innerX);
    const yT = py(box, Math.max(g.left.innerTop, g.right.innerTop));
    const yB = py(box, Math.min(g.left.innerBot, g.right.innerBot));

    const flowColor = theme === "scroll" ? "rgba(165, 91, 45, 0.55)" : "rgba(246, 77, 22, 0.44)";
    const trapColor = "rgba(176, 34, 12, 0.58)";
    const dashOffset = -(t * 28) % 24;

    ctx.save();
    // 1) 左右侧壁「合」的向内收束折返弧线（只有门翼具备一定宽幅时显现）
    const leftStrength = clamp(g.left.width / 0.18, 0, 1);
    const rightStrength = clamp(g.right.width / 0.18, 0, 1);

    if (leftStrength > 0.12) {
      ctx.strokeStyle = evalRes.ok ? flowColor : trapColor;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = dashOffset;
      for (const offsetY of [-0.14, 0, 0.14]) {
        const wy = cy + box.bh * offsetY;
        const startX = Math.max(xL + 4, cx - r - 8);
        const ctrlX = xL + Math.max(8, (cx - xL) * 0.25);
        ctx.beginPath();
        ctx.moveTo(xL + 3, wy);
        ctx.quadraticCurveTo(ctrlX, wy + (cy - wy) * 0.45, Math.max(xL + 6, cx - r - 6), cy + (wy - cy) * 0.22);
        ctx.stroke();
      }
    }
    if (rightStrength > 0.12) {
      ctx.strokeStyle = evalRes.ok ? flowColor : trapColor;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = dashOffset;
      for (const offsetY of [-0.14, 0, 0.14]) {
        const wy = cy + box.bh * offsetY;
        const ctrlX = xR - Math.max(8, (xR - cx) * 0.25);
        ctx.beginPath();
        ctx.moveTo(xR - 3, wy);
        ctx.quadraticCurveTo(ctrlX, wy + (cy - wy) * 0.45, Math.min(xR - 6, cx + r + 6), cy + (wy - cy) * 0.22);
        ctx.stroke();
      }
    }

    // 若门翼过浅（全开浅露），画出向外泄散的水平失守虚线
    if (leftStrength <= 0.12) {
      drawDashedArrow(cx - r - 6, cy, box.ox + 8, cy, trapColor, 6, [4, 5]);
    }
    if (rightStrength <= 0.12) {
      drawDashedArrow(cx + r + 6, cy, box.ox + box.bw - 8, cy, trapColor, 6, [4, 5]);
    }

    // 2) 上下气口「开」的外逸流线（打开时舒展逸向画外；封死时撞梁回弹）
    const ventSpread = Math.min((xR - xL) * 0.24, box.bw * 0.12);
    const drawVerticalFlow = (isTop, shutVal) => {
      const dir = isTop ? -1 : 1;
      const borderY = isTop ? yT : yB;
      const outerY = isTop ? Math.max(14, box.oy - 4) : Math.min(h - 14, box.oy + box.bh + 4);

      ctx.strokeStyle = shutVal > 0.5 ? trapColor : flowColor;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = shutVal > 0.5 ? -dashOffset : dashOffset;

      for (const sx of [-1, 1]) {
        const bx = cx + sx * ventSpread * 0.55;
        ctx.beginPath();
        if (shutVal < 0.5) {
          // 顺畅穿出气口并微微张开
          ctx.moveTo(cx + sx * r * 0.35, cy + dir * (r + 5));
          ctx.quadraticCurveTo(bx, borderY, bx + sx * ventSpread * 0.7, outerY + dir * 2);
        } else {
          // 撞上封闸折回画框内
          const hitY = borderY - dir * 5;
          ctx.moveTo(cx + sx * r * 0.32, cy + dir * (r + 4));
          ctx.lineTo(bx, hitY);
          ctx.lineTo(bx - sx * 12, hitY - dir * 16);
        }
        ctx.stroke();
      }
    };

    drawVerticalFlow(true, topShutVal);
    drawVerticalFlow(false, botShutVal);
    ctx.restore();
  }

  // 绘制三种题材的中央景致与门翼纹理
  function drawDoorLeaf(box, leaf, theme, isLeft, intro) {
    const p = leaf.poly;
    // 开场渐入动画：轻微从外枢推入至目标角度，每一刻都完整好看
    const x0 = px(box, p[0].x);
    const y0 = py(box, p[0].y);
    const x1 = px(box, p[1].x);
    const y1 = py(box, p[1].y);
    const x2 = px(box, p[2].x);
    const y2 = py(box, p[2].y);
    const x3 = px(box, p[3].x);
    const y3 = py(box, p[3].y);

    if (Math.abs(x1 - x0) < 2) {
      // 门翼已退平：只绘一条极细外柱线，直观呈现「无合浅露」
      ctx.save();
      ctx.strokeStyle = theme === "scroll" ? COL.scrollInkMid : COL.vermilion;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x3, y3);
      ctx.stroke();
      ctx.restore();
      return { x0, y0, x1, y1, x2, y2, x3, y3 };
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();

    if (theme === "poster") {
      // 1:1 复刻原海报纯净炽烈朱橘红透视折门，仅在最内缘添极克制的折光阴影显体积
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, COL.vermilion);
      grad.addColorStop(0.84, "#F44813");
      grad.addColorStop(1, "#DF3C0B");
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (theme === "scroll") {
      // 宋画峡谷：深松烟崖壁 + 山脊皱擦层理
      const grad = ctx.createLinearGradient(x0, y0, x1, y2);
      grad.addColorStop(0, "#1D1B18");
      grad.addColorStop(0.55, "#332E27");
      grad.addColorStop(1, "#5C5142");
      ctx.fillStyle = grad;
      ctx.fill();

      // 崖壁层峦剪影纹（裁切在门翼内）
      ctx.clip();
      ctx.fillStyle = "rgba(165, 91, 45, 0.24)";
      ctx.beginPath();
      ctx.moveTo(x0, y3);
      ctx.lineTo(x0, y0 + (y3 - y0) * 0.32);
      ctx.lineTo((x0 + x1) * 0.5, y1 + (y2 - y1) * 0.18);
      ctx.lineTo(x1, y1 + (y2 - y1) * 0.48);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(245, 236, 215, 0.16)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const f = i / 5;
        ctx.beginPath();
        ctx.moveTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + 12);
        ctx.lineTo(x0 + (x1 - x0) * f, y3 + (y2 - y3) * f - 12);
        ctx.stroke();
      }
    } else {
      // 书封折门海报：玄黑建筑护翼 + 内侧朱橘书脊光带
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, "#171412");
      grad.addColorStop(1, "#2A2420");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.clip();
      // 内侧朱橘折光条
      ctx.fillStyle = COL.vermilion;
      const stripW = Math.max(4, Math.abs(x1 - x0) * 0.12);
      ctx.fillRect(isLeft ? x1 - stripW : x1, Math.min(y0, y1), stripW, Math.max(y3, y2) - Math.min(y0, y1));

      // 竖向建筑排印装饰线
      ctx.fillStyle = "rgba(250, 243, 227, 0.22)";
      const lx = x0 + (x1 - x0) * 0.34;
      ctx.fillRect(lx, y0 + 26, 2, (y3 - y0) * 0.42);
      ctx.fillRect(lx + (isLeft ? 8 : -8), y0 + 26, 1, (y3 - y0) * 0.26);
    }

    // 柔和门枢拉手刻度（暗示门翼可横向推拉）
    const gripX = x0 + (x1 - x0) * 0.78;
    const gripY = (y1 + y2) * 0.5;
    if (Math.abs(x1 - x0) > 22) {
      ctx.strokeStyle = theme === "poster" ? "rgba(252, 246, 230, 0.65)" : "rgba(250, 243, 227, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(gripX, gripY - 14);
      ctx.lineTo(gripX, gripY + 14);
      ctx.stroke();
    }

    ctx.restore();
    return { x0, y0, x1, y1, x2, y2, x3, y3 };
  }

  function drawSubject(box, g, theme, evalRes) {
    const cx = px(box, g.subject.cx);
    const cy = py(box, g.subject.cy);
    const r = subjectRadiusPx(box, g);
    const pinched = g.minClearancePct < 3;
    const aperturePx = px(box, g.right.innerX) - px(box, g.left.innerX);

    ctx.save();
    if (theme === "poster") {
      // 原海报朱红主体圆
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = COL.vermilion;
      ctx.fill();

      // 若被门锋夹挤，描一圈警示虚环提示压迫感
      if (pinched) {
        ctx.strokeStyle = COL.ink;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 只有中庭宽度容得下文字时才直接在门内绘制，避免被门扇裁切文字（狭缝时会在门扇外层绘清晰短标）
      const labelY = cy + r + Math.max(19, r * 0.52);
      if (aperturePx >= 98 && labelY + 18 < py(box, Math.min(g.left.innerBot, g.right.innerBot)) + 20) {
        ctx.textAlign = "center";
        ctx.fillStyle = COL.ink;
        ctx.font = `700 ${w < 440 ? 13 : 15}px "Noto Sans SC", sans-serif`;
        ctx.fillText(THEMES.poster.subjectName, cx, labelY);
        ctx.fillStyle = COL.inkSoft;
        ctx.font = `400 ${w < 440 ? 11 : 12}px "Noto Sans SC", sans-serif`;
        ctx.fillText(
          evalRes.ok ? "被包围，受保护" : g.wingAreaPct < 14 ? "失护持，易飘散" : "缺气口，难吐纳",
          cx,
          labelY + 18
        );
      }
    } else if (theme === "scroll") {
      // 宋画峡谷远峰 + 一点朱印旭日 + 云气孤亭（纯几何剪影无人物五官）
      const mW = r * 2.15;
      const mH = r * 1.65;
      ctx.fillStyle = "rgba(36, 34, 30, 0.14)";
      ctx.beginPath();
      ctx.moveTo(cx - mW * 0.9, cy + mH * 0.55);
      ctx.quadraticCurveTo(cx - mW * 0.3, cy - mH * 0.35, cx, cy - mH * 0.72);
      ctx.quadraticCurveTo(cx + mW * 0.35, cy - mH * 0.25, cx + mW * 0.9, cy + mH * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3E382F";
      ctx.beginPath();
      ctx.moveTo(cx - mW * 0.55, cy + mH * 0.55);
      ctx.lineTo(cx - mW * 0.16, cy - mH * 0.18);
      ctx.lineTo(cx + mW * 0.04, cy - mH * 0.58);
      ctx.lineTo(cx + mW * 0.25, cy - mH * 0.08);
      ctx.lineTo(cx + mW * 0.58, cy + mH * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COL.scrollMist;
      ctx.fillRect(cx - mW * 0.72, cy + mH * 0.06, mW * 1.44, mH * 0.16);

      ctx.beginPath();
      ctx.arc(cx + r * 0.42, cy - r * 0.55, r * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = COL.vermilion;
      ctx.fill();

      if (aperturePx >= 98) {
        ctx.textAlign = "center";
        ctx.fillStyle = COL.ink;
        ctx.font = `700 ${w < 440 ? 12 : 14}px "Noto Sans SC", sans-serif`;
        ctx.fillText("云谷远峰", cx, cy + mH * 0.55 + 20);
        ctx.fillStyle = COL.inkSoft;
        ctx.font = `400 11px "Noto Sans SC", sans-serif`;
        ctx.fillText(evalRes.ok ? "峰回路转，云合水分" : "气脉未畅", cx, cy + mH * 0.55 + 36);
      }
    } else {
      // 书封·折门海报题材：中央建筑书封主视觉
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.18, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = COL.vermilion;
      ctx.fill();

      ctx.strokeStyle = COL.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.9, cy + r * 0.78);
      ctx.lineTo(cx + r * 0.9, cy + r * 0.78);
      ctx.stroke();

      if (aperturePx >= 98) {
        ctx.textAlign = "center";
        ctx.fillStyle = COL.ink;
        ctx.font = `900 ${w < 440 ? 14 : 17}px "Noto Sans SC", sans-serif`;
        ctx.fillText("造园与构图", cx, cy + r * 1.18);
        ctx.fillStyle = COL.inkSoft;
        ctx.font = `600 10px "Syne", sans-serif`;
        ctx.fillText("SPACE & TENSION · 2026", cx, cy + r * 1.52);
      }
    }
    ctx.restore();
  }

  function drawVent(box, g, isTop, shutVal) {
    const xL = px(box, g.left.innerX);
    const xR = px(box, g.right.innerX);
    const yL = py(box, isTop ? g.left.innerTop : g.left.innerBot);
    const yR = py(box, isTop ? g.right.innerTop : g.right.innerBot);
    const midX = (xL + xR) * 0.5;
    const midY = (yL + yR) * 0.5;
    const dir = isTop ? -1 : 1;

    ctx.save();
    // 1) 原海报水平虚线边界（连接左右两扇门的内角）
    ctx.strokeStyle = shutVal > 0.5 ? COL.vermilionDeep : COL.dash;
    ctx.lineWidth = shutVal > 0.5 ? 2 : 1.3;
    ctx.setLineDash(shutVal > 0.5 ? [] : [5, 5]);
    ctx.beginPath();
    ctx.moveTo(xL, yL);
    ctx.lineTo(xR, yR);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2) 当封口关闭时，绘一道实心朱橘闸门横梁封堵气口
    if (shutVal > 0.02 && xR - xL > 8) {
      const barH = Math.max(12, box.bh * 0.058) * shutVal;
      const barY = isTop ? Math.min(yL, yR) - barH : Math.max(yL, yR);
      ctx.fillStyle = COL.vermilion;
      ctx.fillRect(xL, barY, xR - xL, barH);

      // 斜纹封锁线（明确标示「已封死」）
      ctx.save();
      ctx.beginPath();
      ctx.rect(xL, barY, xR - xL, barH);
      ctx.clip();
      ctx.strokeStyle = "rgba(252, 246, 230, 0.35)";
      ctx.lineWidth = 1.2;
      for (let sx = xL - barH; sx < xR + barH; sx += 11) {
        ctx.beginPath();
        ctx.moveTo(sx, barY + barH);
        ctx.lineTo(sx + barH, barY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3) 可点按的「打开 / 已封口·点开」标签与原海报同款竖向虚线箭头
    const arrowLen = Math.max(18, Math.min(34, box.bh * 0.088));
    if (shutVal < 0.5) {
      drawDashedArrow(midX, midY, midX, midY + dir * arrowLen, COL.dash, 6, [4, 4]);
    }
    const labelY = isTop
      ? Math.max(16, midY - arrowLen - (shutVal > 0.5 ? 10 : 12))
      : Math.min(h - 14, midY + arrowLen + (shutVal > 0.5 ? 14 : 16));

    const pillText = shutVal > 0.5 ? (isTop ? "上口已封 · 点此打开" : "下口已封 · 点此打开") : "打开";
    ctx.font = `700 ${w < 440 ? 11.5 : 12.5}px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(pillText).width;
    const pw = tw + 18;
    const ph = 24;
    const rx = midX - pw * 0.5;
    const ry = labelY - ph * 0.5;

    if (shutVal > 0.5) {
      // 封死态用清晰朱红底白字可点标签
      ctx.fillStyle = COL.vermilionText;
      ctx.fillRect(rx, ry, pw, ph);
      ctx.fillStyle = "#FCF6E6";
    } else {
      // 打开态还原原海报纯洁暖米底朱红字（加极轻外框暗示可点击切回封口）
      ctx.fillStyle = "rgba(252, 246, 230, 0.92)";
      ctx.fillRect(rx, ry, pw, ph);
      ctx.strokeStyle = "rgba(184, 46, 6, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, pw, ph);
      ctx.fillStyle = COL.vermilionText;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, midX, labelY + 0.5);
    ctx.restore();

    const hit = { x: rx - 8, y: Math.min(ry - 6, midY - 18), w: pw + 16, h: ph + 32 };
    if (isTop) hitZones.topVent = hit;
    else hitZones.botVent = hit;
  }

  function drawFlankArrows(box, g) {
    const midY = py(box, 0.5);
    const xOuterL = px(box, g.left.xHinge);
    const xInnerL = px(box, g.left.innerX);
    const xOuterR = px(box, g.right.xHinge);
    const xInnerR = px(box, g.right.innerX);

    const showLabels = w >= 420;
    const leftEdge = Math.max(12, box.ox - (showLabels ? 44 : 6));
    const rightEdge = Math.min(w - 12, box.ox + box.bw + (showLabels ? 44 : 6));

    ctx.save();
    // 原海报左右向内虚线「包围 ---->」与「<---- 包围」
    const leftArrowEnd = Math.min(xInnerL - 10, xOuterL + Math.max(24, (xInnerL - xOuterL) * 0.78));
    const rightArrowEnd = Math.max(xInnerR + 10, xOuterR - Math.max(24, (xOuterR - xInnerR) * 0.78));

    if (g.left.width > 0.04) {
      drawDashedArrow(leftEdge + (showLabels ? 36 : 4), midY, Math.max(leftEdge + 52, leftArrowEnd), midY, COL.ink, 6.5, [4, 4]);
    }
    if (g.right.width > 0.04) {
      drawDashedArrow(rightEdge - (showLabels ? 36 : 4), midY, Math.min(rightEdge - 52, rightArrowEnd), midY, COL.ink, 6.5, [4, 4]);
    }

    if (showLabels) {
      ctx.fillStyle = COL.ink;
      ctx.font = `700 13px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("包围", leftEdge, midY);
      ctx.textAlign = "right";
      ctx.fillText("包围", rightEdge, midY);
    }

    // 外枢角标放在底角外沿（避开顶部「上口已封」标签，任何宽高比下永不撞车！）
    ctx.font = `500 11px "IBM Plex Mono", monospace`;
    ctx.fillStyle = COL.inkSoft;
    ctx.textBaseline = "top";
    const footY = Math.min(h - 18, py(box, g.left.outerBot) + 5);
    ctx.textAlign = "left";
    ctx.fillText(`L ${Math.round(g.left.angle)}°`, xOuterL, footY);
    ctx.textAlign = "right";
    ctx.fillText(`R ${Math.round(g.right.angle)}°`, xOuterR, footY);

    ctx.restore();
  }

  function render(t, dt, { still }) {
    if (!resize()) return;
    const state = getState();

    // 平滑缓动：still（减少动态效果）直接一步到位
    const k = still ? 1 : Math.min(1, dt * 14);
    anim.leftAngle += (state.leftAngle - anim.leftAngle) * k;
    anim.rightAngle += (state.rightAngle - anim.rightAngle) * k;
    anim.topShut += ((state.topShut ? 1 : 0) - anim.topShut) * k;
    anim.botShut += ((state.botShut ? 1 : 0) - anim.botShut) * k;
    anim.intro = still ? 1 : Math.min(1, anim.intro + dt * 2.2);

    const drawState = {
      ...state,
      leftAngle: anim.leftAngle,
      rightAngle: anim.rightAngle,
    };
    const g = computeGeometry(drawState);
    const evalRes = evaluate(state);
    const box = getPortalBox();
    hitZones.portalBox = box;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 满幅暖米纸底（随题材微调纸色，融于整页无盒感）
    ctx.fillStyle = state.theme === "scroll" ? COL.scrollPaper : state.theme === "cover" ? COL.coverGround : COL.paper;
    ctx.fillRect(0, 0, w, h);

    // 极克制的四角建筑角标（无重框，像测绘展纸）
    ctx.strokeStyle = "rgba(38, 41, 38, 0.22)";
    ctx.lineWidth = 1;
    const m = 10;
    const tk = 10;
    for (const [cx0, cy0, sx, sy] of [
      [m, m, 1, 1],
      [w - m, m, -1, 1],
      [m, h - m, 1, -1],
      [w - m, h - m, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx0, cy0 + sy * tk);
      ctx.lineTo(cx0, cy0);
      ctx.lineTo(cx0 + sx * tk, cy0);
      ctx.stroke();
    }

    // 2. 中庭柔和景深底面（让双扉折入后显出庭院纵深）
    const xL = px(box, g.left.innerX);
    const xR = px(box, g.right.innerX);
    const yT = py(box, Math.min(g.left.innerTop, g.right.innerTop));
    const yB = py(box, Math.max(g.left.innerBot, g.right.innerBot));
    if (xR > xL + 4) {
      ctx.fillStyle = state.theme === "scroll" ? "rgba(255, 252, 244, 0.55)" : "rgba(255, 253, 247, 0.52)";
      ctx.fillRect(xL, yT, xR - xL, yB - yT);
    }

    // 3. 实时视线吐纳射线流
    if (state.showRays) {
      drawSightlineFlow(box, g, anim.topShut, anim.botShut, still ? 0 : t, evalRes, state.theme);
    }

    // 4. 中央主体焦点（严格等比正圆 / 宋画远峰 / 书封主标）
    drawSubject(box, g, state.theme, evalRes);

    // 5. 左右透视折门（1:1 原海报梯形双翼，永远画在主体外层形成真实遮挡/逼塞感！）
    hitZones.leftDoor = drawDoorLeaf(box, g.left, state.theme, true, anim.intro);
    hitZones.rightDoor = drawDoorLeaf(box, g.right, state.theme, false, anim.intro);

    // 6. 上下气口虚线与可点按封闸
    drawVent(box, g, true, anim.topShut);
    drawVent(box, g, false, anim.botShut);

    // 6b. 若门缝过窄（狭缝夹挤主体），在门扇外层给一个干净不裁字的警示浮签
    const aperturePx = xR - xL;
    if (aperturePx < 98) {
      const cx = px(box, g.subject.cx);
      const cy = py(box, g.subject.cy);
      const r = subjectRadiusPx(box, g);
      const tagText = "主体受夹挤 · 向右推开双扉";
      ctx.font = `700 11.5px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(tagText).width;
      const pw = tw + 16;
      const ph = 24;
      const ty = Math.min(py(box, Math.min(g.left.innerBot, g.right.innerBot)) - ph - 6, cy + r + 14);
      ctx.fillStyle = "rgba(18, 17, 15, 0.88)";
      ctx.fillRect(cx - pw * 0.5, ty, pw, ph);
      ctx.fillStyle = "#FCF6E6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagText, cx, ty + ph * 0.5 + 0.5);
    }

    // 7. 原海报左右「包围 → / ← 包围」虚线引导箭
    drawFlankArrows(box, g);

    // 8. 顶沿极简实测角标（只在宽敞画布左上显示，窄屏/横屏手机避免撞上顶部封口标签）
    if (w >= 580) {
      ctx.fillStyle = COL.inkSoft;
      ctx.font = `500 11px "IBM Plex Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`中庭 ${g.aperturePct}% · 围合 ${g.wingAreaPct}% · 气口 ${g.openVents}/2`, 22, 16);
    }

    ctx.restore();
  }

  // ===== 交互：横拖推拉门扉（兼顾触屏竖向滚页） + 直点上下封口 =====
  let drag = null;

  function localPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function inRect(pt, r) {
    return r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pt = localPos(e);
    const state = getState();

    // 优先检测是否点中顶部或底部气口闸门
    if (inRect(pt, hitZones.topVent)) {
      onPatch({ topShut: !state.topShut });
      return;
    }
    if (inRect(pt, hitZones.botVent)) {
      onPatch({ botShut: !state.botShut });
      return;
    }

    // 决定拖动哪扇门：联动模式两扇齐动；独扇模式按点击左右半区选门
    const side = state.linked ? "both" : pt.x < w * 0.5 ? "left" : "right";
    drag = {
      id: e.pointerId,
      startX: pt.x,
      startY: pt.y,
      locked: false,
      side,
      initLeft: state.leftAngle,
      initRight: state.rightAngle,
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = localPos(e);
    if (!drag || drag.id !== e.pointerId) {
      // 鼠标悬停指针反馈
      const overVent = inRect(pt, hitZones.topVent) || inRect(pt, hitZones.botVent);
      canvas.style.cursor = overVent ? "pointer" : "ew-resize";
      return;
    }
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    // 触屏：若用户明显竖滑则让给页面滚动
    if (!drag.locked) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.4 && e.pointerType === "touch") {
        drag = null;
        return;
      }
      if (Math.abs(dx) > 3) drag.locked = true;
    }
    if (!drag.locked) return;

    // 灵敏度：横拖半个画布宽度大约推完整个开合角行程
    const degPerPx = 92 / Math.max(180, w * 0.45);
    const delta = dx * degPerPx;

    if (drag.side === "both") {
      // 在左半边往左拉是推开门，或者统一：向右横拖统一推开双扉（与 data-perf-drag 左右摆动完全自然吻合！）
      const next = clamp(drag.initLeft + delta, PORTAL.minAngle, PORTAL.maxAngle);
      onPatch({ leftAngle: next, rightAngle: next });
    } else if (drag.side === "left") {
      // 独扇左扉：往左推开角度增大，往右合拢角度减小
      const next = clamp(drag.initLeft - delta, PORTAL.minAngle, PORTAL.maxAngle);
      onPatch({ leftAngle: next });
    } else {
      // 独扇右扉：往右推开角度增大，往左合拢角度减小
      const next = clamp(drag.initRight + delta, PORTAL.minAngle, PORTAL.maxAngle);
      onPatch({ rightAngle: next });
    }
  });

  const endDrag = (e) => {
    if (drag && drag.id === e.pointerId) {
      drag = null;
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 键盘无障碍操控（方向键推拉双扉、上下键启闭气口、空格切联动）
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({
        leftAngle: clamp(state.leftAngle + step, PORTAL.minAngle, PORTAL.maxAngle),
        rightAngle: clamp(state.rightAngle + step, PORTAL.minAngle, PORTAL.maxAngle),
      });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({
        leftAngle: clamp(state.leftAngle - step, PORTAL.minAngle, PORTAL.maxAngle),
        rightAngle: clamp(state.rightAngle - step, PORTAL.minAngle, PORTAL.maxAngle),
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ topShut: !state.topShut });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ botShut: !state.botShut });
    } else if (e.key === " ") {
      e.preventDefault();
      onPatch({ linked: !state.linked });
    }
  });

  return { render };
}
