// 324 截景式构图 —— 主舞台 2D Canvas（活体双 L 裁景刀窗 × 硫酸纸画外显影台）+ 实时海报解剖小图
import { loop, pixelRatio } from "../../lib/stage.js";
import { FRAME_ASPECT, evaluateCrop } from "./model.js";

const COLORS = {
  vermilion: "#F4410E",
  vermilionVeil: "#7E1F06",
  inkPaper: "#F4E9D7",
  inkVeil: "#B6A48D",
  streetGround: "#1B1917",
  streetVeil: "#0E0D0C",
  matteOff: "#141110",
  ivory: "#F5E8D6",
  carbon: "#161616",
  ok: "#5ED8A5",
  warnEdge: "#FFD166",
};

// 在指定坐标系内绘制对应题材的主体（画内实绘与画外硫酸纸幽影共用同一套几何坐标，绝对单真源）
function drawSubjectGeometry(ctx, subjectId, cx, cy, scalePx, ghost) {
  ctx.save();
  ctx.translate(cx, cy);

  if (subjectId === "poster") {
    const outerR = 0.45 * scalePx;
    const coreX = 0.055 * scalePx;
    const coreY = 0.03 * scalePx;
    const coreR = 0.17 * scalePx;

    if (ghost) {
      ctx.fillStyle = "rgba(245, 232, 214, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(245, 232, 214, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(22, 22, 22, 0.34)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 232, 214, 0.45)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // 1:1 复刻 324 原海报暖象牙大圆环 + 松烟炭黑内核
      ctx.fillStyle = COLORS.ivory;
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.carbon;
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (subjectId === "ink") {
    const u = scalePx;
    const rockPath = () => {
      ctx.beginPath();
      ctx.moveTo(-0.44 * u, 0.40 * u);
      ctx.lineTo(-0.45 * u, -0.14 * u);
      ctx.lineTo(-0.24 * u, -0.34 * u);
      ctx.lineTo(0.06 * u, -0.25 * u);
      ctx.lineTo(0.24 * u, -0.02 * u);
      ctx.lineTo(0.20 * u, 0.42 * u);
      ctx.closePath();
    };
    const branchPath = () => {
      ctx.beginPath();
      ctx.moveTo(-0.08 * u, 0.04 * u);
      ctx.quadraticCurveTo(0.10 * u, -0.08 * u, 0.47 * u, -0.28 * u);
      ctx.moveTo(0.10 * u, -0.06 * u);
      ctx.quadraticCurveTo(0.20 * u, -0.22 * u, 0.32 * u, -0.34 * u);
      ctx.moveTo(0.18 * u, -0.11 * u);
      ctx.quadraticCurveTo(0.32 * u, -0.08 * u, 0.45 * u, -0.11 * u);
    };
    const blossoms = [
      [0.10 * u, -0.06 * u, 0.046 * u],
      [0.18 * u, -0.13 * u, 0.036 * u],
      [0.04 * u, -0.12 * u, 0.030 * u],
      [0.29 * u, -0.22 * u, 0.034 * u],
      [0.39 * u, -0.24 * u, 0.028 * u],
      [0.24 * u, -0.29 * u, 0.024 * u],
      [0.37 * u, -0.10 * u, 0.026 * u],
    ];

    if (ghost) {
      rockPath();
      ctx.fillStyle = "rgba(22, 22, 22, 0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(22, 22, 22, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();

      branchPath();
      ctx.lineWidth = Math.max(2, 0.028 * u);
      ctx.strokeStyle = "rgba(22, 22, 22, 0.45)";
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      rockPath();
      ctx.fillStyle = COLORS.carbon;
      ctx.fill();

      // 巨石亮面斧劈皴块
      ctx.beginPath();
      ctx.moveTo(-0.24 * u, -0.34 * u);
      ctx.lineTo(0.06 * u, -0.25 * u);
      ctx.lineTo(0.10 * u, 0.08 * u);
      ctx.lineTo(-0.16 * u, 0.14 * u);
      ctx.lineTo(-0.30 * u, -0.08 * u);
      ctx.closePath();
      ctx.fillStyle = "#2A2623";
      ctx.fill();

      // 飞白石脊棱线
      ctx.strokeStyle = "rgba(245, 232, 214, 0.36)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-0.24 * u, -0.34 * u);
      ctx.lineTo(-0.14 * u, 0.14 * u);
      ctx.lineTo(0.20 * u, 0.08 * u);
      ctx.stroke();

      // 苍劲斜出梅枝
      branchPath();
      ctx.strokeStyle = COLORS.carbon;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(3, 0.036 * u);
      ctx.stroke();

      // 朱砂梅花（聚焦在石梅交结核心周围）
      for (const [bx, by, br] of blossoms) {
        ctx.fillStyle = COLORS.vermilion;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.ivory;
        ctx.beginPath();
        ctx.arc(bx, by, br * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (subjectId === "street") {
    const u = scalePx;
    const drawBike = (strokeColor, fillColor, accentColor, isGhost) => {
      const wheelR = 0.175 * u;
      const lw = Math.max(2.2, 0.028 * u);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const wx of [-0.28 * u, 0.27 * u]) {
        const wy = 0.17 * u;
        ctx.beginPath();
        ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(2.5, 0.032 * u);
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        if (!isGhost) {
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "rgba(245, 232, 214, 0.35)";
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 4 + 0.3;
            ctx.beginPath();
            ctx.moveTo(wx - Math.cos(a) * wheelR * 0.85, wy - Math.sin(a) * wheelR * 0.85);
            ctx.lineTo(wx + Math.cos(a) * wheelR * 0.85, wy + Math.sin(a) * wheelR * 0.85);
            ctx.stroke();
          }
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(wx, wy, 0.03 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-0.28 * u, 0.17 * u);
      ctx.lineTo(-0.04 * u, 0.17 * u);
      ctx.lineTo(0.14 * u, -0.06 * u);
      ctx.lineTo(-0.14 * u, -0.06 * u);
      ctx.closePath();
      ctx.moveTo(0.27 * u, 0.17 * u);
      ctx.lineTo(0.14 * u, -0.10 * u);
      ctx.lineTo(0.25 * u, -0.10 * u);
      ctx.stroke();

      // 无五官前倾骑手剪影（纯几何侧影，不画五官）
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(0.08 * u, -0.275 * u, 0.072 * u, 0.056 * u, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-0.20 * u, -0.08 * u);
      ctx.quadraticCurveTo(-0.08 * u, -0.26 * u, 0.06 * u, -0.19 * u);
      ctx.lineTo(0.02 * u, -0.06 * u);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = Math.max(3, 0.042 * u);
      ctx.beginPath();
      ctx.moveTo(0.02 * u, -0.17 * u);
      ctx.lineTo(0.19 * u, -0.10 * u);
      ctx.moveTo(-0.14 * u, -0.07 * u);
      ctx.lineTo(-0.03 * u, 0.04 * u);
      ctx.lineTo(-0.05 * u, 0.16 * u);
      ctx.stroke();
    };

    if (ghost) {
      ctx.setLineDash([6, 5]);
      drawBike("rgba(245, 232, 214, 0.48)", "rgba(245, 232, 214, 0.24)", "rgba(244, 65, 14, 0.55)", true);
      ctx.setLineDash([]);
    } else {
      drawBike(COLORS.ivory, COLORS.ivory, COLORS.vermilion, false);
    }
  }

  ctx.restore();
}

function drawOutwardArrow(ctx, x0, y0, dx, dy, len, color, width = 3) {
  const x1 = x0 + dx * len;
  const y1 = y0 + dy * len;
  const head = Math.min(13, len * 0.36);
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(angle - 0.52), y1 - head * Math.sin(angle - 0.52));
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(angle + 0.52), y1 - head * Math.sin(angle + 0.52));
  ctx.stroke();
  ctx.restore();
}

function drawBadgePill(ctx, cx, cy, text, bg, fg, border = null) {
  ctx.save();
  ctx.font = '600 11.5px "JetBrains Mono", "Noto Sans SC", monospace';
  const tw = ctx.measureText(text).width;
  const pw = tw + 18;
  const ph = 23;
  const x = Math.round(cx - pw / 2);
  const y = Math.round(cy - ph / 2);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, pw, ph);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

export function mountHeroStage(canvas, state, onChange) {
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let frameRect = { x: 40, y: 40, w: 240, h: 180 };
  let introProgress = 0;

  let disp = { cx: state.cx, cy: state.cy, scale: state.scale };
  let isDragging = false;
  let dragMode = null; // "slide" | "edge-left" | "edge-right" | "edge-top" | "edge-bottom" | "corner"
  let dragCornerSign = { sx: 1, sy: 1 };
  let dragStart = null;
  let uiDirty = false;
  let isStillMode = false;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function computeWindowRect(cur) {
    // 裁景刀窗随贴近倍率真实收紧/放宽，并随切位在画稿上微微滑移，且始终保持 4:3 绝不变形
    const padX = Math.max(30, Math.round(w * 0.085));
    const padTop = h < 260 ? 50 : Math.max(44, Math.round(h * 0.125));
    const padBot = h < 260 ? 22 : Math.max(30, Math.round(h * 0.095));
    const maxW = Math.max(120, w - padX * 2);
    const maxH = Math.max(96, h - padTop - padBot);
    const baseH = Math.min(maxH * 0.84, (maxW * 0.84) / FRAME_ASPECT);

    const rawH = baseH * Math.pow(1.0 / cur.scale, 0.34);
    const fh = clamp(rawH, Math.min(maxH, Math.max(108, h * 0.44)), maxH);
    const fw = fh * FRAME_ASPECT;

    // 刀窗在画布内随切位反向滑移，形成「在静止画稿上推拉裁景窗」的物理手感
    const slackX = Math.max(0, (w - fw) / 2 - 18);
    const slackY = Math.max(0, (maxH - fh) / 2);
    const shiftX = clamp((0.5 - cur.cx) * fw * 0.36, -slackX, slackX);
    const shiftY = clamp((0.5 - cur.cy) * fh * 0.36, -slackY, slackY);

    return {
      x: Math.round((w - fw) / 2 + shiftX),
      y: Math.round(padTop + (maxH - fh) / 2 + shiftY),
      w: Math.round(fw),
      h: Math.round(fh),
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = pixelRatio(window.innerWidth <= 768 ? 1.5 : 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    frameRect = computeWindowRect(disp);
  }

  function render(t, dt, { still }) {
    isStillMode = still;
    if (uiDirty) {
      uiDirty = false;
      onChange();
    }
    resize();
    if (!w || !h) return;

    if (still) {
      introProgress = 1;
      disp.cx = state.cx;
      disp.cy = state.cy;
      disp.scale = state.scale;
    } else {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
      const lerp = isDragging ? 1 : Math.min(1, (dt || 0.016) * 12);
      disp.cx += (state.cx - disp.cx) * lerp;
      disp.cy += (state.cy - disp.cy) * lerp;
      disp.scale += (state.scale - disp.scale) * lerp;
    }

    frameRect = computeWindowRect(disp);
    const evalState = isDragging ? state : { ...state, cx: disp.cx, cy: disp.cy, scale: disp.scale };
    const info = evaluateCrop(evalState);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 铺展画稿底台（开启画外硫酸纸时呈现同色系半透明画外遮幅，关闭时纯黑落刀预览）
    const isInk = state.subject === "ink";
    if (state.xray) {
      ctx.fillStyle = state.subject === "poster"
        ? COLORS.vermilionVeil
        : isInk
          ? COLORS.inkVeil
          : COLORS.streetVeil;
    } else {
      ctx.fillStyle = COLORS.matteOff;
    }
    ctx.fillRect(0, 0, w, h);

    const { x: fx, y: fy, w: fw, h: fh } = frameRect;
    const ruleInk = state.xray && isInk ? "rgba(22, 22, 22, 0.16)" : "rgba(245, 232, 214, 0.12)";
    const labelInk = state.xray && isInk ? "rgba(22, 22, 22, 0.78)" : "rgba(245, 232, 214, 0.80)";

    // 制图台边沿裁切刻度与四条延伸裁线
    if (state.xray) {
      ctx.strokeStyle = ruleInk;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, 0); ctx.lineTo(fx, h);
      ctx.moveTo(fx + fw, 0); ctx.lineTo(fx + fw, h);
      ctx.moveTo(0, fy); ctx.lineTo(w, fy);
      ctx.moveTo(0, fy + fh); ctx.lineTo(w, fy + fh);
      ctx.stroke();

      // 上下边缘毫米标尺短刻
      ctx.beginPath();
      for (let gx = 20; gx < w - 16; gx += 24) {
        ctx.moveTo(gx, h - 6); ctx.lineTo(gx, h);
      }
      ctx.stroke();
    }

    // 顶角轻量标尺文字（实时与下方诊单绝对同源）
    ctx.font = '600 11px "JetBrains Mono", "Noto Sans SC", monospace';
    ctx.fillStyle = labelInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`倍率 ${disp.scale.toFixed(2)}× · 截除 ${Math.round(info.cutRatio * 100)}%`, 12, 10);

    ctx.textAlign = "right";
    ctx.fillText(state.xray ? "画外硫酸纸 HORS-CHAMP" : "纯画内实看（已裁离）", w - 12, 10);

    // 主体几何中心与尺寸（与 model.js 归一化坐标系 1:1 严格一致）
    const subCx = fx + disp.cx * fw;
    const subCy = fy + disp.cy * fh;
    const scalePx = disp.scale * fh;

    // 2. 先在画外硫酸纸层绘制被截除部分的幽影轮廓
    if (state.xray) {
      ctx.save();
      drawSubjectGeometry(ctx, state.subject, subCx, subCy, scalePx, true);
      ctx.restore();
    }

    // 3. 裁剪进入双 L 裁景刀窗，绘制 100% 锐利饱和的画内实景
    ctx.save();
    ctx.beginPath();
    ctx.rect(fx, fy, fw, fh);
    ctx.clip();

    ctx.fillStyle = state.subject === "poster"
      ? COLORS.vermilion
      : isInk
        ? COLORS.inkPaper
        : COLORS.streetGround;
    ctx.fillRect(fx, fy, fw, fh);

    if (state.subject === "street") {
      ctx.strokeStyle = "rgba(244, 65, 14, 0.30)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy + fh * 0.78);
      ctx.lineTo(fx + fw, fy + fh * 0.78);
      ctx.stroke();
    }

    drawSubjectGeometry(ctx, state.subject, subCx, subCy, scalePx, false);

    // 潘氏题材：空阔一侧轻盖一枚朱砂印「截」
    if (isInk) {
      const sealX = info.clearLeft > info.clearRight ? fx + 16 : fx + fw - 38;
      const sealY = fy + 14;
      ctx.fillStyle = COLORS.vermilion;
      ctx.fillRect(sealX, sealY, 22, 22);
      ctx.fillStyle = COLORS.ivory;
      ctx.font = '400 14px "Ma Shan Zheng", "Noto Sans SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("截", sealX + 11, sealY + 11.5);
    }

    // 焦核被劈或切中关节时，在核心处标出警告虚环
    if (info.code === "focus_severed") {
      const kX = fx + info.coreU * fw;
      const kY = fy + info.coreV * fh;
      ctx.strokeStyle = COLORS.warnEdge;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(kX, kY, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // 4. 绘制双 L 裁景刀窗（1:1 化用 324 原海报底左的白色虚线框 + 四边可拖拽刀刃刻度）
    const ease = 1 - (1 - introProgress) ** 3;
    const bladeStroke = isInk && state.xray ? COLORS.carbon : COLORS.ivory;
    ctx.save();
    ctx.strokeStyle = info.pass ? bladeStroke : (info.code === "tangent" ? COLORS.warnEdge : bladeStroke);
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = still ? 0 : (1 - ease) * 36;
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
    ctx.setLineDash([]);

    // 四角加粗 L 形取景裁尺转角（强化物理裁切尺手感）
    const arm = 15;
    ctx.strokeStyle = info.pass ? COLORS.ok : (isInk && state.xray ? COLORS.carbon : COLORS.ivory);
    ctx.lineWidth = 3.2;
    const corners = [
      [fx, fy, 1, 1],
      [fx + fw, fy, -1, 1],
      [fx, fy + fh, 1, -1],
      [fx + fw, fy + fh, -1, -1],
    ];
    for (const [cx0, cy0, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx0 + sx * arm, cy0);
      ctx.lineTo(cx0, cy0);
      ctx.lineTo(cx0, cy0 + sy * arm);
      ctx.stroke();
    }

    // 四条切刃中点轻量抓握刻痕（合并单次路径绘制，降低绘制调用开销）
    const gripBg = isInk && state.xray ? COLORS.carbon : COLORS.ivory;
    const gripInk = isInk && state.xray ? COLORS.ivory : COLORS.carbon;
    ctx.beginPath();
    ctx.rect(fx - 4, fy + fh / 2 - 13, 8, 26);
    ctx.rect(fx + fw - 4, fy + fh / 2 - 13, 8, 26);
    ctx.rect(fx + fw / 2 - 13, fy - 4, 26, 8);
    ctx.rect(fx + fw / 2 - 13, fy + fh - 4, 26, 8);
    ctx.fillStyle = gripBg;
    ctx.fill();
    ctx.strokeStyle = gripInk;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 5. 切边外延矢量箭头（324 原海报标志性的跨框外延白箭 →）
    const pulse = still ? 0 : Math.sin(t * 2.8) * 3;
    if (info.cutEdgeCount > 0 && info.cutEdgeCount < 4) {
      const { x: vx, y: vy } = info.extendVec;
      let ax = fx + fw / 2;
      let ay = fy + fh / 2;
      if (Math.abs(vx) >= Math.abs(vy)) {
        ax = vx >= 0 ? fx + fw : fx;
        ay = clamp(subCy, fy + 34, fy + fh - 34);
      } else {
        ay = vy >= 0 ? fy + fh : fy;
        ax = clamp(subCx, fx + 40, fx + fw - 40);
      }
      const arrowCol = info.pass
        ? (isInk && state.xray ? COLORS.carbon : COLORS.ivory)
        : COLORS.warnEdge;
      drawOutwardArrow(ctx, ax - vx * 10, ay - vy * 10, vx, vy, 34 + pulse, arrowCol, 3);
    }

    // 6. 擦边冲突高亮段（精准落在问题刃线上，绝不遮挡画面中央的黑圆核！）
    if (info.code === "tangent" && info.tangentEdges.length > 0) {
      const edge = info.tangentEdges[0];
      let tx = fx + fw;
      let ty = clamp(subCy, fy + 32, fy + fh - 32);
      if (edge === "左框") tx = fx;
      else if (edge === "上框") { tx = clamp(subCx, fx + 48, fx + fw - 48); ty = fy; }
      else if (edge === "下框") { tx = clamp(subCx, fx + 48, fx + fw - 48); ty = fy + fh; }

      ctx.strokeStyle = COLORS.warnEdge;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      if (edge === "左框" || edge === "右框") {
        ctx.moveTo(tx, ty - 30); ctx.lineTo(tx, ty + 30);
      } else {
        ctx.moveTo(tx - 34, ty); ctx.lineTo(tx + 34, ty);
      }
      ctx.stroke();
    }

    // 7. 顶沿轻量实况标牌（落在刀窗上沿之外且避开顶刃中点抓握块，100% 不遮盖主体图形！）
    const pillY = Math.max(18, fy - 20);
    if (info.code === "tangent" && info.tangentEdges.length > 0) {
      drawBadgePill(ctx, fx + fw / 2, pillY, `${info.tangentEdges[0]}擦切 · 拖右刃左切或横拖入画`, COLORS.carbon, COLORS.warnEdge, COLORS.warnEdge);
    } else if (!info.pass) {
      drawBadgePill(ctx, fx + fw / 2, pillY, `${info.badge.replace(/^\d\/\d\s*/, "")} · 拖刀刃或画布调节`, COLORS.carbon, COLORS.warnEdge, COLORS.warnEdge);
    } else {
      drawBadgePill(ctx, fx + fw / 2, pillY, `截除 ${Math.round(info.cutRatio * 100)}% · ${info.extendLabel}`, COLORS.carbon, COLORS.ok, COLORS.ok);
    }

    ctx.restore();
    ctx.restore();
  }

  const ctrl = loop(canvas, render);

  // ---------- 命中检测：四角 L 刀标 / 四条虚线切刃 / 窗口滑动 ----------
  function detectHit(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const lx = clientX - r.left;
    const ly = clientY - r.top;
    const { x: fx, y: fy, w: fw, h: fh } = frameRect;

    const corners = [
      { x: fx, y: fy, sx: -1, sy: -1 },
      { x: fx + fw, y: fy, sx: 1, sy: -1 },
      { x: fx, y: fy + fh, sx: -1, sy: 1 },
      { x: fx + fw, y: fy + fh, sx: 1, sy: 1 },
    ];
    for (const c of corners) {
      if (Math.hypot(lx - c.x, ly - c.y) <= 20) {
        return { mode: "corner", sx: c.sx, sy: c.sy, cursor: c.sx * c.sy > 0 ? "nwse-resize" : "nesw-resize" };
      }
    }

    if (ly >= fy - 10 && ly <= fy + fh + 10) {
      if (Math.abs(lx - fx) <= 15) return { mode: "edge-left", cursor: "ew-resize" };
      if (Math.abs(lx - (fx + fw)) <= 15) return { mode: "edge-right", cursor: "ew-resize" };
    }
    if (lx >= fx - 10 && lx <= fx + fw + 10) {
      if (Math.abs(ly - fy) <= 15) return { mode: "edge-top", cursor: "ns-resize" };
      if (Math.abs(ly - (fy + fh)) <= 15) return { mode: "edge-bottom", cursor: "ns-resize" };
    }
    return { mode: "slide", cursor: "grab" };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏交由下方 passive touch 通道单一处理，避免双份重绘
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const hit = detectHit(e.clientX, e.clientY);
    isDragging = true;
    dragMode = hit.mode;
    dragCornerSign = { sx: hit.sx || 1, sy: hit.sy || 1 };
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      cx: state.cx,
      cy: state.cy,
      scale: state.scale,
      pointerType: e.pointerType,
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (!isDragging || !dragStart) {
      if (e.pointerType === "mouse") {
        canvas.style.cursor = detectHit(e.clientX, e.clientY).cursor;
      }
      return;
    }
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const fw = Math.max(120, frameRect.w);
    const fh = Math.max(100, frameRect.h);

    if (dragMode === "corner") {
      // 往内推四角 L 刃 = 收紧窗口 = 贴近倍率增大；往外拉 = 放宽窗口 = 贴近倍率减小
      const inward = -(dx * dragCornerSign.sx + dy * dragCornerSign.sy) / Math.max(180, fh);
      state.scale = clamp(+(dragStart.scale + inward * 1.15).toFixed(3), 0.55, 2.35);
    } else if (dragMode === "edge-right") {
      // 右刃向左推入：直接切进主体右侧（同时收紧倍率并令主体向右侧切出）
      const pushIn = -dx / fw;
      state.cx = clamp(+(dragStart.cx + pushIn * 0.72).toFixed(4), -0.35, 1.38);
      state.scale = clamp(+(dragStart.scale + pushIn * 0.95).toFixed(3), 0.55, 2.35);
    } else if (dragMode === "edge-left") {
      const pushIn = dx / fw;
      state.cx = clamp(+(dragStart.cx - pushIn * 0.72).toFixed(4), -0.35, 1.38);
      state.scale = clamp(+(dragStart.scale + pushIn * 0.95).toFixed(3), 0.55, 2.35);
    } else if (dragMode === "edge-top") {
      const pushIn = dy / fh;
      state.cy = clamp(+(dragStart.cy - pushIn * 0.72).toFixed(4), -0.25, 1.25);
      state.scale = clamp(+(dragStart.scale + pushIn * 0.95).toFixed(3), 0.55, 2.35);
    } else if (dragMode === "edge-bottom") {
      const pushIn = -dy / fh;
      state.cy = clamp(+(dragStart.cy + pushIn * 0.72).toFixed(4), -0.25, 1.25);
      state.scale = clamp(+(dragStart.scale + pushIn * 0.95).toFixed(3), 0.55, 2.35);
    } else {
      // 在画布内横拖滑移：主体与刀窗顺滑交错切过
      const du = dx / fw;
      state.cx = clamp(+(dragStart.cx + du * 1.15).toFixed(4), -0.35, 1.38);
      const dv = dy / fh;
      state.cy = clamp(+(dragStart.cy + dv * 1.1).toFixed(4), -0.25, 1.25);
    }

    disp.cx = state.cx;
    disp.cy = state.cy;
    disp.scale = state.scale;
    if (isStillMode) {
      onChange();
      ctrl.draw();
    } else {
      uiDirty = true;
    }
  });

  const endDrag = (e) => {
    if (e && e.pointerType === "touch") return;
    if (!isDragging) return;
    isDragging = false;
    dragMode = null;
    dragStart = null;
    if (uiDirty) {
      uiDirty = false;
      onChange();
    }
    try { if (e && e.pointerId != null) canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // 原始 touch 事件监听：单通道合帧更新，避免和 pointermove 重复重绘，保证慢手机软渲染也能稳定高帧率
  let touchOrigin = null;
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const pt = e.touches[0];
    touchOrigin = { x: pt.clientX, y: pt.clientY, cx: state.cx, cy: state.cy };
    isDragging = true;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchOrigin || !e.touches.length) return;
    const pt = e.touches[0];
    const dx = pt.clientX - touchOrigin.x;
    const dy = pt.clientY - touchOrigin.y;
    if (Math.abs(dx) >= Math.abs(dy) * 0.65 || Math.abs(dx) > 4) {
      const du = dx / Math.max(120, frameRect.w);
      state.cx = clamp(+(touchOrigin.cx + du * 1.15).toFixed(4), -0.35, 1.38);
      disp.cx = state.cx;
      if (isStillMode) {
        onChange();
        ctrl.draw();
      } else {
        uiDirty = true;
      }
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    touchOrigin = null;
    isDragging = false;
    if (uiDirty) {
      uiDirty = false;
      onChange();
    }
  }, { passive: true });

  // 键盘方向键与 + / - 精调
  canvas.addEventListener("keydown", (e) => {
    let handled = true;
    const step = e.shiftKey ? 0.08 : 0.035;
    if (e.key === "ArrowRight") state.cx = clamp(+(state.cx + step).toFixed(4), -0.35, 1.38);
    else if (e.key === "ArrowLeft") state.cx = clamp(+(state.cx - step).toFixed(4), -0.35, 1.38);
    else if (e.key === "ArrowDown") state.cy = clamp(+(state.cy + step).toFixed(4), -0.25, 1.25);
    else if (e.key === "ArrowUp") state.cy = clamp(+(state.cy - step).toFixed(4), -0.25, 1.25);
    else if (e.key === "+" || e.key === "=") state.scale = clamp(+(state.scale + 0.08).toFixed(3), 0.55, 2.35);
    else if (e.key === "-" || e.key === "_") state.scale = clamp(+(state.scale - 0.08).toFixed(3), 0.55, 2.35);
    else handled = false;
    if (handled) {
      e.preventDefault();
      onChange();
      ctrl.draw();
    }
  });

  window.addEventListener("resize", () => ctrl.draw());

  return { draw: ctrl.draw };
}

// 1:1 联动更新 324 原海报底左的白虚线解剖小图（SVG，实时镜像主舞台状态）
export function updateMiniDiagram(svgEl, state, info) {
  if (!svgEl) return;
  const bx = 12, by = 14, bw = 76, bh = 96;
  const cx = bx + state.cx * bw;
  const cy = by + state.cy * bh;
  const r = 0.45 * state.scale * Math.min(bw, bh);
  const coreX = cx + info.subj.coreOffset.x * state.scale * Math.min(bw, bh);
  const coreY = cy + info.subj.coreOffset.y * state.scale * Math.min(bw, bh);
  const coreR = Math.max(4, 0.16 * state.scale * Math.min(bw, bh));

  const circle = svgEl.querySelector("#mini-body");
  const core = svgEl.querySelector("#mini-core");
  const ghost = svgEl.querySelector("#mini-ghost");
  const arrow = svgEl.querySelector("#mini-arrow");

  if (circle) {
    circle.setAttribute("cx", cx.toFixed(1));
    circle.setAttribute("cy", cy.toFixed(1));
    circle.setAttribute("r", r.toFixed(1));
  }
  if (ghost) {
    ghost.setAttribute("cx", cx.toFixed(1));
    ghost.setAttribute("cy", cy.toFixed(1));
    ghost.setAttribute("r", r.toFixed(1));
  }
  if (core) {
    core.setAttribute("cx", coreX.toFixed(1));
    core.setAttribute("cy", coreY.toFixed(1));
    core.setAttribute("r", coreR.toFixed(1));
  }
  if (arrow) {
    if (info.cutEdgeCount > 0 && info.cutEdgeCount < 4) {
      const vx = info.extendVec.x;
      const vy = info.extendVec.y;
      let ax = bx + bw;
      let ay = by + bh * 0.66;
      if (Math.abs(vx) >= Math.abs(vy)) {
        ax = vx >= 0 ? bx + bw : bx;
        ay = Math.max(by + 16, Math.min(by + bh - 16, cy));
      } else {
        ay = vy >= 0 ? by + bh : by;
        ax = Math.max(bx + 16, Math.min(bx + bw - 16, cx));
      }
      const x1 = ax + vx * 16;
      const y1 = ay + vy * 16;
      const ang = Math.atan2(vy, vx);
      const h1x = x1 - 6 * Math.cos(ang - 0.55);
      const h1y = y1 - 6 * Math.sin(ang - 0.55);
      const h2x = x1 - 6 * Math.cos(ang + 0.55);
      const h2y = y1 - 6 * Math.sin(ang + 0.55);
      arrow.setAttribute("d", `M${(ax - vx * 5).toFixed(1)} ${(ay - vy * 5).toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} M${h1x.toFixed(1)} ${h1y.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${h2x.toFixed(1)} ${h2y.toFixed(1)}`);
      arrow.style.opacity = "1";
    } else {
      arrow.style.opacity = "0.2";
    }
  }
}
