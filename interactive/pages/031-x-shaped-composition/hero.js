// 031 X形构图 · 开场活体 X 剪刀楔形剪切舞台（2D Canvas + 原海报双栏实时联动）
import { loop, pixelRatio } from "../../lib/stage.js";
import { BANDS, PRESETS, clamp, createInitialState, evaluateState } from "./model.js";

const COLORS = {
  paper: "#F2EADF",
  paperWarm: "#FAF6F0",
  ink: "#11110F",
  inkMuted: "#3A4440",
  orange: "#F36C46",
  orangeDark: "#B53816",
  orangeSoft: "rgba(243, 108, 70, 0.24)",
  teal: "#226762",
  tealDeep: "#093D3B",
  tealText: "#155752",
  tealLine: "rgba(34, 103, 98, 0.45)",
  alert: "#B0251C",
  alertBg: "rgba(176, 37, 28, 0.14)",
  grid: "rgba(17, 17, 15, 0.06)",
};

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = createInitialState();
  // 平滑插值态用于预设切换的顺滑手势动画；拖动时即时跟手无延迟
  let dragging = null; // null | "focus" | "angle" | "balance"
  let pointerStart = null;
  let dragAxisLock = null; // null | "h" | "v"
  let lastGeo = null;
  let cssW = 900;
  let cssH = 480;
  let dpr = 1;
  let introProgress = 0;

  // DOM 引用
  const elTopBadge = document.getElementById("hero-top-badge");
  const elTitleX = document.getElementById("title-live-x");
  const elDiagTag = document.getElementById("diag-tag");
  const elDiagHeadline = document.getElementById("diag-headline");
  const elDiagWhy = document.getElementById("diag-why");
  const elDiagFix = document.getElementById("diag-fix");
  const elDiagCard = document.getElementById("diag-card");
  const elReadAngle = document.getElementById("read-angle");
  const elReadRatio = document.getElementById("read-ratio");
  const elReadChannel = document.getElementById("read-channel");
  const elReadFocus = document.getElementById("read-focus");
  const elReadTension = document.getElementById("read-tension");

  const rangeAngle = document.getElementById("ctrl-angle");
  const rangeBalance = document.getElementById("ctrl-balance");
  const rangeChannel = document.getElementById("ctrl-channel");
  const valAngle = document.getElementById("val-angle");
  const valBalance = document.getElementById("val-balance");
  const valChannel = document.getElementById("val-channel");
  const btnBlocker = document.getElementById("btn-blocker");
  const btnFlow = document.getElementById("btn-flow");
  const btnCross = document.getElementById("btn-cross");

  const sceneBtns = [...document.querySelectorAll("[data-scene]")];
  const modeBtns = [...document.querySelectorAll("[data-mode]")];
  const presetBtns = [...document.querySelectorAll("[data-preset]")];
  const dimCards = [...document.querySelectorAll("[data-dim]")];

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(220, Math.round(r.height));
    dpr = pixelRatio(cssW < 500 ? 2 : 2);
    const pw = Math.round(cssW * dpr);
    const ph = Math.round(cssH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  // 更新所有 DOM 读数、示范大字 X 与原海报四枚检核条（单真源！）
  function syncDOM(geo) {
    if (elTopBadge) {
      elTopBadge.textContent = geo.isSolved
        ? "4 / 4 X轴立稳"
        : `${geo.passedCount} / 4 待校 X 轴`;
      elTopBadge.dataset.state = geo.isSolved ? "ok" : "warn";
    }

    // 示范标题里的大 X 两条笔画随剪刀夹角实时转动！
    if (elTitleX) {
      const a = state.mode === "single" ? 45 : clamp(geo.angle, 22, 130);
      const half = a * 0.5;
      const stroke1 = elTitleX.querySelector(".tx-a");
      const stroke2 = elTitleX.querySelector(".tx-b");
      if (stroke1) stroke1.setAttribute("transform", `rotate(${(half - 45).toFixed(1)} 50 50)`);
      if (stroke2) {
        if (state.mode === "single") {
          stroke2.setAttribute("opacity", "0.14");
          stroke2.setAttribute("transform", "rotate(0 50 50)");
        } else if (state.mode === "parallel") {
          stroke2.setAttribute("opacity", "0.85");
          stroke2.setAttribute("transform", `translate(18 0) rotate(${(half - 45 + 90).toFixed(1)} 50 50)`);
        } else {
          stroke2.setAttribute("opacity", "1");
          stroke2.setAttribute("transform", `rotate(${(45 - half).toFixed(1)} 50 50)`);
        }
      }
    }

    if (elDiagCard) elDiagCard.dataset.solved = geo.isSolved ? "true" : "false";
    if (elDiagTag) {
      elDiagTag.textContent = geo.isSolved
        ? geo.primary.tag
        : `错态 · ${geo.primary.tag} (${geo.passedCount}/4)`;
    }
    if (elDiagHeadline) elDiagHeadline.textContent = geo.primary.headline;
    if (elDiagWhy) elDiagWhy.textContent = geo.primary.why;
    if (elDiagFix) elDiagFix.textContent = geo.primary.fix;

    if (elReadAngle) {
      elReadAngle.textContent = state.mode === "parallel" ? "平行" : `${Math.round(geo.angle)}°`;
      elReadAngle.dataset.ok = geo.dims.tension.ok ? "true" : "false";
    }
    if (elReadRatio) {
      elReadRatio.textContent = state.mode === "single" ? "单侧" : `${geo.wedgeRatio.toFixed(2)}:1`;
      elReadRatio.dataset.ok = geo.dims.balance.ok ? "true" : "false";
    }
    if (elReadChannel) {
      elReadChannel.textContent = `${Math.round(geo.channelShare * 100)}%`;
      elReadChannel.dataset.ok = geo.dims.sightlines.ok ? "true" : "false";
    }
    if (elReadFocus) {
      elReadFocus.textContent = state.mode === "parallel" ? "无交点" : `偏 ${Math.round(geo.focusOffset * 100)}%`;
      elReadFocus.dataset.ok = geo.dims.focus.ok ? "true" : "false";
    }
    if (elReadTension) elReadTension.textContent = geo.tensionLevel;

    // 同步原生滑杆与按钮状态
    if (rangeAngle && document.activeElement !== rangeAngle) rangeAngle.value = String(Math.round(state.angle));
    if (rangeBalance && document.activeElement !== rangeBalance) rangeBalance.value = String(Math.round(state.balance * 100));
    if (rangeChannel && document.activeElement !== rangeChannel) rangeChannel.value = String(Math.round(state.channel * 1000));
    if (valAngle) valAngle.textContent = `${Math.round(state.angle)}°`;
    if (valBalance) {
      const p = Math.round(state.balance * 100);
      valBalance.textContent = Math.abs(p) <= 4 ? "左右对等" : p < 0 ? `偏左 ${Math.abs(p)}%` : `偏右 ${p}%`;
    }
    if (valChannel) valChannel.textContent = `${Math.round(geo.channelShare * 100)}%`;

    if (btnBlocker) {
      btnBlocker.textContent = state.blocker ? "清通道障 (1)" : "放回通道障";
      btnBlocker.dataset.active = state.blocker ? "warn" : "ok";
      btnBlocker.setAttribute("aria-pressed", state.blocker ? "true" : "false");
    }
    if (btnFlow) {
      btnFlow.textContent = state.flow ? "视线流：开" : "视线流：关";
      btnFlow.setAttribute("aria-pressed", state.flow ? "true" : "false");
    }
    if (btnCross) {
      const tag = state.crossX > 0.68 ? "交点：贴边"
        : Math.hypot(state.crossX - 0.5, state.crossY - 0.5) > 0.045 ? "交点：偏交"
        : "交点：居中";
      btnCross.textContent = tag;
      btnCross.dataset.state = state.crossX > 0.68 ? "warn" : "ok";
    }

    for (const b of sceneBtns) {
      const on = b.dataset.scene === state.scene;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    }
    for (const b of modeBtns) {
      const on = b.dataset.mode === state.mode;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    }

    for (const card of dimCards) {
      const key = card.dataset.dim;
      const info = geo.dims[key];
      if (!info) continue;
      card.dataset.ok = info.ok ? "true" : "false";
      card.classList.toggle("is-highlighted", state.highlightDim === key);
      const badge = card.querySelector(".tb-status");
      if (badge) badge.textContent = info.badge;
    }
  }

  // ---------- 绘制函数 ----------
  function drawPoly(pts) {
    if (!pts || pts.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function drawArrowHead(x, y, vx, vy, size, color) {
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const px = -uy;
    const py = ux;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * size + px * size * 0.54, y - uy * size + py * size * 0.54);
    ctx.lineTo(x - ux * size - px * size * 0.54, y - uy * size - py * size * 0.54);
    ctx.closePath();
    ctx.fill();
  }

  function drawDashedAxisWithArrows(seg, color, lineW, arrowSize) {
    if (!seg) return;
    const [p0, p1] = seg;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy);
    if (len < 20) return;
    const ux = dx / len;
    const uy = dy / len;
    const inset = Math.min(26, len * 0.08);
    const sx = p0[0] + ux * inset;
    const sy = p0[1] + uy * inset;
    const ex = p1[0] - ux * inset;
    const ey = p1[1] - uy * inset;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(sx - ux * 4, sy - uy * 4, -ux, -uy, arrowSize, color);
    drawArrowHead(ex + ux * 4, ey + uy * 4, ux, uy, arrowSize, color);
    ctx.restore();
  }

  // 根据 3 种题材渲染背景肌理与双楔材质
  function drawSceneLayers(geo, ease) {
    const { w, h, cx, cy, cosA, sinA } = geo;
    const shiftOut = (1 - ease) * w * 0.32;

    // 纸面底色
    if (state.scene === "overpass") {
      ctx.fillStyle = "#E8EFEA";
    } else if (state.scene === "sprint") {
      ctx.fillStyle = "#F5EFE6";
    } else {
      ctx.fillStyle = COLORS.paper;
    }
    ctx.fillRect(0, 0, w, h);

    // 极淡建筑/版面标尺细网
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const step = w < 500 ? 32 : 44;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();

    // 绘制左右赤橘双楔（带开场切入动画）
    const drawWedge = (pts, offsetX, fill, stripeColor) => {
      if (!pts || pts.length < 3) return;
      ctx.save();
      ctx.translate(offsetX, 0);
      drawPoly(pts);
      ctx.fillStyle = fill;
      ctx.fill();

      // 不同题材下的克制几何纹理，保持纯粹平面美学不杂乱
      if (state.scene === "sprint") {
        ctx.clip();
        ctx.strokeStyle = stripeColor;
        ctx.lineWidth = 2;
        for (let i = -h; i < w + h; i += 24) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + h * 0.6, h);
          ctx.stroke();
        }
      } else if (state.scene === "overpass") {
        ctx.clip();
        ctx.strokeStyle = "rgba(9, 61, 59, 0.16)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < w; i += 26) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.stroke();
        }
      }

      // 高亮「平衡」维度时描强边界
      if (state.highlightDim === "balance" || !geo.dims.balance.ok) {
        drawPoly(pts);
        ctx.strokeStyle = geo.dims.balance.ok ? COLORS.tealDeep : COLORS.alert;
        ctx.lineWidth = state.highlightDim === "balance" ? 3 : 1.5;
        ctx.setLineDash(geo.dims.balance.ok ? [] : [6, 4]);
        ctx.stroke();
      }
      ctx.restore();
    };

    const fillLeft = state.scene === "overpass" ? "#226762"
      : state.scene === "sprint" ? "#E85B35"
      : COLORS.orange;
    const fillRight = state.scene === "overpass" ? "#226762"
      : state.scene === "sprint" ? "#F36C46"
      : COLORS.orange;

    drawWedge(geo.leftWedge, -shiftOut, fillLeft, "rgba(255,255,255,0.14)");
    drawWedge(geo.rightWedge, shiftOut, fillRight, "rgba(17,17,15,0.10)");

    // 题材专属叠加物（纯几何抽象，绝不画五官！）
    if (state.scene === "overpass") {
      // 城市立交双桥栏杆透视线（沿双对角通道边缘）
      const drawDeckEdge = (seg, dx, dy) => {
        if (!seg) return;
        ctx.save();
        ctx.strokeStyle = "#F36C46";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(seg[0][0] + dx, seg[0][1] + dy);
        ctx.lineTo(seg[1][0] + dx, seg[1][1] + dy);
        ctx.stroke();
        ctx.restore();
      };
      const off = Math.min(w, h) * 0.045;
      drawDeckEdge(geo.axis1, -sinA * off, cosA * off);
      drawDeckEdge(geo.axis1, sinA * off, -cosA * off);
      if (geo.axis2) {
        drawDeckEdge(geo.axis2, sinA * off, cosA * off);
        drawDeckEdge(geo.axis2, -sinA * off, -cosA * off);
      }
    } else if (state.scene === "sprint") {
      // 运动海报：上下通道的几何赛道排标（无人物五官）
      ctx.save();
      ctx.fillStyle = "rgba(17, 17, 15, 0.78)";
      ctx.font = `700 ${w < 500 ? 11 : 13}px "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("VELOCITY AXIS · 031", cx, Math.max(22, h * 0.09));
      ctx.fillText("COUNTER-LOCKED DIAGONALS", cx, Math.min(h - 14, h * 0.93));
      ctx.restore();
    }
  }

  function drawSightlineParticles(geo, t) {
    if (!state.flow) return;
    const { cx, cy, axis1, axis2, blockerPos } = geo;
    const rays = [];
    if (axis1) {
      rays.push({ from: axis1[0], to: [cx, cy], blocked: false });
      rays.push({ from: axis1[1], to: [cx, cy], blocked: false });
    }
    if (axis2 && state.mode === "x") {
      rays.push({ from: axis2[0], to: [cx, cy], blocked: false });
      rays.push({ from: axis2[1], to: [cx, cy], blocked: state.blocker });
    }
    if (state.mode === "parallel" && axis2) {
      // 平行时粒子沿平行轨溜出画面
      const pRays = [
        { from: axis1[0], to: axis1[1] },
        { from: axis2[1], to: axis2[0] },
      ];
      ctx.save();
      for (let i = 0; i < pRays.length; i++) {
        for (let k = 0; k < 3; k++) {
          const u = ((t * 0.38 + k / 3 + i * 0.17) % 1);
          const x = pRays[i].from[0] + (pRays[i].to[0] - pRays[i].from[0]) * u;
          const y = pRays[i].from[1] + (pRays[i].to[1] - pRays[i].from[1]) * u;
          ctx.fillStyle = COLORS.alert;
          ctx.beginPath();
          ctx.arc(x, y, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    ctx.save();
    for (let rIdx = 0; rIdx < rays.length; rIdx++) {
      const ray = rays[rIdx];
      for (let k = 0; k < 2; k++) {
        let u = (t * 0.44 + k * 0.5 + rIdx * 0.13) % 1;
        let x, y, hitStop = false;
        if (ray.blocked && u > 0.42) {
          // 撞到阻断块反弹停滞
          const bounce = 0.42 - (u - 0.42) * 0.35;
          u = Math.max(0.18, bounce);
          hitStop = true;
        }
        x = ray.from[0] + (ray.to[0] - ray.from[0]) * u;
        y = ray.from[1] + (ray.to[1] - ray.from[1]) * u;
        const alpha = Math.sin(clamp(u, 0.05, 0.95) * Math.PI);
        ctx.fillStyle = hitStop ? COLORS.alert : (geo.isSolved ? COLORS.tealDeep : COLORS.teal);
        ctx.globalAlpha = 0.32 + alpha * 0.65;
        ctx.beginPath();
        ctx.arc(x, y, hitStop ? 5 : 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 如果单斜，演示一个顺着尾端溜出画框的红色脱轨点
    if (state.mode === "single" && axis1) {
      const u = (t * 0.5) % 1;
      const x = axis1[0][0] + (axis1[1][0] - axis1[0][0]) * u;
      const y = axis1[0][1] + (axis1[1][1] - axis1[0][1]) * u;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = COLORS.alert;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    void blockerPos;
  }

  function drawAngleArc(geo) {
    if (state.mode !== "x") return;
    const { cx, cy, angle, dims } = geo;
    const r = clamp(Math.min(geo.w, geo.h) * 0.145, 34, 62);
    const half = (angle * 0.5) * Math.PI / 180;
    const arcColor = dims.tension.ok ? COLORS.tealDeep : COLORS.alert;

    ctx.save();
    // 右侧夹角扇弧
    ctx.fillStyle = dims.tension.ok ? "rgba(34, 103, 98, 0.11)" : "rgba(176, 37, 28, 0.14)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -half, half);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = arcColor;
    ctx.lineWidth = state.highlightDim === "tension" ? 3 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -half, half);
    ctx.stroke();

    // 角度读数小签（固定落在右侧弧外偏下方，与右上通道阻断块完全错开）
    const lx = clamp(cx + r + 26, 48, geo.w - 48);
    const ly = clamp(cy + (geo.w < 560 ? 22 : 16), 34, geo.h - 38);
    ctx.fillStyle = "#FAF6F0";
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 1.4;
    const tw = 46;
    const th = 22;
    ctx.fillRect(lx - tw / 2, ly - th / 2, tw, th);
    ctx.strokeRect(lx - tw / 2, ly - th / 2, tw, th);
    ctx.fillStyle = arcColor;
    ctx.font = `500 12px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(angle)}°`, lx, ly + 0.5);
    ctx.restore();
  }

  function drawBlocker(geo) {
    if (!state.blocker || state.mode !== "x") return;
    const [bx, by] = geo.blockerPos;
    const bw = geo.w < 500 ? 78 : 94;
    const bh = 30;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-0.18);
    ctx.fillStyle = "#1E1F1E";
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = COLORS.alert;
    ctx.lineWidth = 2;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = "#FAF6F0";
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("× 点此清障", 0, 0.5);
    ctx.restore();
  }

  function drawFocusAndCross(geo, t) {
    const { cx, cy, fx, fy, w, h, dims } = geo;
    const coreR = clamp(Math.min(w, h) * 0.088, 22, 40);

    // 若焦圆脱位，先在真实交汇点画一个醒目的「空心交汇」虚环 + 连线提示拖回
    if (state.mode !== "parallel" && !dims.focus.ok) {
      ctx.save();
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(cx - 32, cy - 11, 64, 22);
      ctx.strokeStyle = COLORS.alert;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 32, cy - 11, 64, 22);
      ctx.fillStyle = COLORS.alert;
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("交汇空心", cx, cy + 0.5);
      ctx.restore();
    }

    // 1:1 复刻原海报「视觉焦点 FOCAL POINT」顶竖引线（连在交汇点或焦圆正上方）
    const labelAnchorX = dims.focus.ok ? fx : cx;
    const labelAnchorY = dims.focus.ok ? fy : cy;
    const topY = Math.max(46, labelAnchorY - coreR - (w < 500 ? 34 : 52));
    if (labelAnchorY - coreR > 54) {
      ctx.save();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(labelAnchorX, topY + 12);
      ctx.lineTo(labelAnchorX, labelAnchorY - coreR - 8);
      ctx.stroke();

      ctx.fillStyle = COLORS.ink;
      ctx.font = `700 ${w < 500 ? 12 : 14}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("视觉焦点", labelAnchorX, topY - 4);
      ctx.fillStyle = COLORS.inkMuted;
      ctx.font = `600 10px "Sora", sans-serif`;
      ctx.fillText("FOCAL POINT", labelAnchorX, topY + 9);
      ctx.restore();
    }

    // 绘制可直拖的深松石青双层焦圆（1:1 复刻 031 原海报焦圆！）
    ctx.save();
    // 外层松石青细虚线圆环
    const ringR = coreR * 1.32 + (geo.isSolved ? Math.sin(t * 2.2) * 1.5 : 0);
    ctx.strokeStyle = dims.focus.ok ? COLORS.teal : COLORS.alert;
    ctx.lineWidth = state.highlightDim === "focus" ? 2.5 : 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(fx, fy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 焦圆白衬边（在赤橘楔上也能清晰切离）
    ctx.fillStyle = COLORS.paperWarm;
    ctx.beginPath();
    ctx.arc(fx, fy, coreR + 3, 0, Math.PI * 2);
    ctx.fill();

    // 焦圆主环：原海报实采 #226762
    ctx.fillStyle = COLORS.teal;
    ctx.beginPath();
    ctx.arc(fx, fy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // 焦圆深核：原海报实采 #093D3B
    ctx.fillStyle = COLORS.tealDeep;
    ctx.beginPath();
    ctx.arc(fx, fy, coreR * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // 内部交叉虚线小刻痕（呼应原海报焦圆内部纹理）
    ctx.strokeStyle = "rgba(9, 61, 59, 0.65)";
    ctx.lineWidth = 1.6;
    const arm = coreR * 0.86;
    ctx.beginPath();
    ctx.moveTo(fx - arm * geo.cosA, fy - arm * geo.sinA);
    ctx.lineTo(fx + arm * geo.cosA, fy + arm * geo.sinA);
    ctx.moveTo(fx - arm * geo.cosA, fy + arm * geo.sinA);
    ctx.lineTo(fx + arm * geo.cosA, fy - arm * geo.sinA);
    ctx.stroke();

    // 若未落锁，在焦圆下方标明「拖回交点」
    if (!dims.focus.ok) {
      ctx.fillStyle = COLORS.alert;
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("拖回交点", fx, fy + ringR + 4);
    }
    ctx.restore();
  }

  function drawWedgeBadges(geo) {
    const { w, h, areaL, areaR, dims } = geo;
    const total = w * h;
    const pctL = Math.round((areaL / total) * 100);
    const pctR = Math.round((areaR / total) * 100);
    if (w < 340) return;

    const pill = (x, y, text, warn) => {
      ctx.save();
      ctx.font = `500 11px "DM Mono", monospace`;
      const tw = ctx.measureText(text).width + 14;
      const th = 22;
      ctx.fillStyle = warn ? "#B0251C" : "rgba(17, 17, 15, 0.82)";
      ctx.fillRect(x, y, tw, th);
      ctx.fillStyle = "#FAF6F0";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + 7, y + th / 2 + 0.5);
      ctx.restore();
    };

    const warnBal = !dims.balance.ok;
    pill(12, h - 34, `左楔 ${pctL}%`, warnBal && geo.heavierSide === "left");
    const rText = `右楔 ${pctR}%`;
    ctx.font = `500 11px "DM Mono", monospace`;
    const rW = ctx.measureText(rText).width + 14;
    pill(w - rW - 12, h - 34, rText, warnBal && geo.heavierSide === "right");
  }

  function drawScene(t, dt, { still }) {
    resize();
    if (still) {
      introProgress = 1;
    } else if (introProgress < 1) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) / 0.72);
    }
    const ease = 1 - Math.pow(1 - introProgress, 3);
    const geo = evaluateState(state, cssW, cssH);
    lastGeo = geo;

    ctx.save();
    ctx.scale(dpr, dpr);

    drawSceneLayers(geo, ease);

    // 两条双向深松石青虚线轴（高对比实采色）
    const axisColor = state.highlightDim === "sightlines" && !geo.dims.sightlines.ok
      ? COLORS.alert
      : COLORS.tealDeep;
    const lineW = state.highlightDim === "sightlines" ? 3 : 2.2;
    const arrowSz = cssW < 500 ? 10 : 12;
    drawDashedAxisWithArrows(geo.axis1, axisColor, lineW, arrowSz);
    if (geo.axis2) drawDashedAxisWithArrows(geo.axis2, axisColor, lineW, arrowSz);

    // 流动视线粒子
    if (!still) drawSightlineParticles(geo, t);

    // 夹角弧标、阻断块、深松石焦圆与左右楔面积签
    drawAngleArc(geo);
    drawBlocker(geo);
    drawFocusAndCross(geo, still ? 0 : t);
    drawWedgeBadges(geo);

    // 顶部细微引导提示（加极薄暖米底条，确保压在赤橘楔角上也清晰可读）
    if (cssW >= 340) {
      const hint = "横拖开合 X 剪刀角 · 直拖深青焦圆归位";
      ctx.save();
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const hw = ctx.measureText(hint).width + 14;
      ctx.fillStyle = "rgba(250, 246, 240, 0.90)";
      ctx.fillRect(8, 8, hw, 22);
      ctx.fillStyle = "#11110F";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(hint, 15, 19.5);
      ctx.restore();
    }

    ctx.restore();
  }

  const runner = loop(canvas, drawScene);

  function updateAndDraw() {
    resize();
    const geo = evaluateState(state, cssW, cssH);
    lastGeo = geo;
    syncDOM(geo);
    runner.draw();
  }

  // ---------- 指针与触屏交互（兼容鼠标 + 触屏水平拖 + 不锁竖向滚页） ----------
  function getLocalPt(ev) {
    const r = canvas.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    return [clientX - r.left, clientY - r.top];
  }

  function hitTest(x, y) {
    const geo = lastGeo || evaluateState(state, cssW, cssH);
    // 1. 先检查是否点中阻断块
    if (state.blocker && state.mode === "x") {
      const [bx, by] = geo.blockerPos;
      if (Math.abs(x - bx) <= 54 && Math.abs(y - by) <= 24) return "blocker";
    }
    // 2. 检查是否按在深松石青焦圆上（扩大触摸热区）
    const coreR = clamp(Math.min(geo.w, geo.h) * 0.09, 24, 42);
    if (Math.hypot(x - geo.fx, y - geo.fy) <= coreR * 1.48) return "focus";
    // 3. 其余任意处横向拖动调整 X 剪刀夹角
    return "angle";
  }

  function onStart(ev, isTouch) {
    const [x, y] = getLocalPt(ev);
    const hit = hitTest(x, y);
    if (hit === "blocker") {
      if (!isTouch) ev.preventDefault();
      state.blocker = false;
      state.highlightDim = null;
      updateAndDraw();
      return;
    }
    dragging = hit;
    dragAxisLock = hit === "focus" ? "both" : null;
    pointerStart = {
      x,
      y,
      angle: state.angle,
      fx: state.focusX,
      fy: state.focusY,
      cx: state.crossX,
      cy: state.crossY,
    };
    if (!isTouch) ev.preventDefault();
  }

  function onMove(ev, isTouch) {
    if (!dragging || !pointerStart) return;
    const [x, y] = getLocalPt(ev);
    const dx = x - pointerStart.x;
    const dy = y - pointerStart.y;

    if (isTouch && dragging === "angle") {
      if (!dragAxisLock && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragAxisLock = Math.abs(dx) >= Math.abs(dy) * 0.85 ? "h" : "v";
      }
      if (dragAxisLock === "v") {
        // 让手机自然竖滑滚动页面
        dragging = null;
        return;
      }
      if (ev.cancelable) ev.preventDefault();
    } else if (isTouch && dragging === "focus") {
      if (ev.cancelable) ev.preventDefault();
    }

    if (dragging === "focus") {
      let nx = clamp(pointerStart.fx + dx / cssW, 0.10, 0.90);
      let ny = clamp(pointerStart.fy + dy / cssH, 0.12, 0.88);
      // 靠近当前交汇中心时轻柔吸附
      if (state.mode !== "parallel" && Math.hypot(nx - state.crossX, ny - state.crossY) < 0.042) {
        nx = state.crossX;
        ny = state.crossY;
      }
      state.focusX = nx;
      state.focusY = ny;
      updateAndDraw();
    } else if (dragging === "angle") {
      if (state.mode !== "x") state.mode = "x";
      const nextAngle = clamp(pointerStart.angle + (dx / Math.max(220, cssW * 0.45)) * 75, 16, 148);
      state.angle = nextAngle;
      updateAndDraw();
    }
  }

  function onEnd() {
    dragging = null;
    pointerStart = null;
    dragAxisLock = null;
  }

  canvas.addEventListener("mousedown", (e) => onStart(e, false));
  window.addEventListener("mousemove", (e) => {
    if (dragging) onMove(e, false);
  });
  window.addEventListener("mouseup", onEnd);

  canvas.addEventListener("mousemove", (e) => {
    if (dragging) return;
    const [x, y] = getLocalPt(e);
    const hit = hitTest(x, y);
    canvas.style.cursor = hit === "blocker" ? "pointer" : hit === "focus" ? "grab" : "ew-resize";
  });

  // 显式监听原生 touch 事件，兼容 perf.mjs 的 CDP dispatchTouchEvent 与真实移动端触屏
  canvas.addEventListener("touchstart", (e) => onStart(e, true), { passive: false });
  canvas.addEventListener("touchmove", (e) => onMove(e, true), { passive: false });
  canvas.addEventListener("touchend", onEnd);
  canvas.addEventListener("touchcancel", onEnd);

  // 键盘支持：焦点在画布上时支持方向键调夹角与配平，WASD 挪焦圆
  canvas.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 8 : 3;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.mode = "x";
      state.angle = clamp(state.angle + step, 16, 148);
      updateAndDraw();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.mode = "x";
      state.angle = clamp(state.angle - step, 16, 148);
      updateAndDraw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.balance = clamp(state.balance + 0.08, -0.8, 0.8);
      updateAndDraw();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.balance = clamp(state.balance - 0.08, -0.8, 0.8);
      updateAndDraw();
    } else if (/^[wasd]$/i.test(e.key)) {
      e.preventDefault();
      const d = 0.04;
      if (e.key.toLowerCase() === "a") state.focusX = clamp(state.focusX - d, 0.1, 0.9);
      if (e.key.toLowerCase() === "d") state.focusX = clamp(state.focusX + d, 0.1, 0.9);
      if (e.key.toLowerCase() === "w") state.focusY = clamp(state.focusY - d, 0.12, 0.88);
      if (e.key.toLowerCase() === "s") state.focusY = clamp(state.focusY + d, 0.12, 0.88);
      if (Math.hypot(state.focusX - state.crossX, state.focusY - state.crossY) < 0.045) {
        state.focusX = state.crossX;
        state.focusY = state.crossY;
      }
      updateAndDraw();
    } else if (e.key === "Enter" || e.key === " ") {
      if (state.blocker) {
        e.preventDefault();
        state.blocker = false;
        updateAndDraw();
      }
    }
  });

  // 滑杆绑定
  if (rangeAngle) {
    rangeAngle.addEventListener("input", () => {
      if (state.mode !== "x") state.mode = "x";
      state.angle = Number(rangeAngle.value);
      updateAndDraw();
    });
  }
  if (rangeBalance) {
    rangeBalance.addEventListener("input", () => {
      state.balance = Number(rangeBalance.value) / 100;
      updateAndDraw();
    });
  }
  if (rangeChannel) {
    rangeChannel.addEventListener("input", () => {
      state.channel = Number(rangeChannel.value) / 1000;
      updateAndDraw();
    });
  }

  // 阻断开关、视线流开关
  if (btnBlocker) {
    btnBlocker.addEventListener("click", () => {
      state.blocker = !state.blocker;
      updateAndDraw();
    });
  }
  if (btnFlow) {
    btnFlow.addEventListener("click", () => {
      state.flow = !state.flow;
      updateAndDraw();
    });
  }
  if (btnCross) {
    btnCross.addEventListener("click", () => {
      if (state.crossX > 0.68) {
        state.crossX = 0.50;
        state.crossY = 0.50;
      } else if (Math.hypot(state.crossX - 0.5, state.crossY - 0.5) > 0.045) {
        state.crossX = 0.72;
        state.crossY = 0.48;
      } else {
        state.crossX = 0.55;
        state.crossY = 0.44;
      }
      updateAndDraw();
    });
  }

  // 题材切换
  for (const btn of sceneBtns) {
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      updateAndDraw();
    });
  }

  // 结构模式切换（单斜 / 平行 / 双斜 X）
  for (const btn of modeBtns) {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      updateAndDraw();
    });
  }

  // 方案预设（经典对称解 / 动感偏交解 / 锋刃紧凑解 / 复原 0/4 错态）
  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      Object.assign(state, p);
      state.highlightDim = null;
      updateAndDraw();
    });
  }

  // 右栏原海报「张力与平衡」四条检核卡点击高亮对应几何维度
  for (const card of dimCards) {
    card.addEventListener("click", () => {
      const key = card.dataset.dim;
      state.highlightDim = state.highlightDim === key ? null : key;
      updateAndDraw();
    });
  }

  window.addEventListener("resize", updateAndDraw);
  // 首帧同步 DOM 与画布
  updateAndDraw();

  return { state, updateAndDraw };
}
