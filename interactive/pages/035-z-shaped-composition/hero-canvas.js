// 开场 2D Canvas 渲染与直接操控：Z 轨眼动编排台
// 1:1 化用 035 原海报奶油暖象牙纸底、实心朱橘红 Z 路径、白色虚线方向箭、
// 四枚红圈白底蓝图标圆徽与斜切浅暖灰底带；支持横拖调 Z 跨度（data-perf-drag）、
// 直拖圆徽调位/互换、直点中路红块清场、直点断桥缺口接通。

import { pixelRatio } from "../../lib/stage.js";
import {
  clamp,
  evaluate,
  ROLES,
  SLOT_NAMES,
  SPAN_MAX,
  SPAN_MIN,
} from "./model.js";

const C = {
  paper: "#FBF4E8",
  paperBright: "#FFFBF2",
  band: "#EFE9DF",
  grid: "rgba(0, 43, 147, 0.065)",
  red: "#FA4718",
  redDark: "#C12B06",
  redSoft: "rgba(250, 71, 24, 0.12)",
  blue: "#002B93",
  blueDeep: "#0E1D42",
  blueMuted: "#47587E",
  err: "#B51D29",
  errBg: "#FDF0EC",
  ok: "#0B6B68",
  white: "#FFFFFF",
};

// 严格按物理等比 r 绘制 035 原海报四枚皇家钴蓝矢量图标（绝不画五官人脸）
function drawRoleIcon(ctx, role, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (role === "entry") {
    // 原海报左上：简洁蓝眼（仅几何瞳环与三根睫线，非写实五官）
    const w = r * 0.62;
    const h = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(0, -h * 1.45, w, 0);
    ctx.quadraticCurveTo(0, h * 1.45, -w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.8, r * 0.09);
    for (const a of [-0.46, 0, 0.46]) {
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * r * 0.42, -r * 0.38 - Math.cos(a) * r * 0.02);
      ctx.lineTo(Math.sin(a) * r * 0.54, -r * 0.56);
      ctx.stroke();
    }
  } else if (role === "progress") {
    // 原海报中右：阶梯柱状图 + 上升折箭
    const bw = r * 0.16;
    const gap = r * 0.09;
    const heights = [r * 0.24, r * 0.38, r * 0.54];
    const base = r * 0.42;
    const startX = -bw * 1.5 - gap;
    heights.forEach((bh, idx) => {
      ctx.fillRect(startX + idx * (bw + gap), base - bh, bw, bh);
    });
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(-r * 0.44, r * 0.04);
    ctx.lineTo(-r * 0.08, -r * 0.12);
    ctx.lineTo(r * 0.38, -r * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.18, -r * 0.44);
    ctx.lineTo(r * 0.42, -r * 0.44);
    ctx.lineTo(r * 0.38, -r * 0.2);
    ctx.stroke();
  } else if (role === "pivot") {
    // 原海报左下：双弧循环转折箭
    const rr = r * 0.44;
    ctx.lineWidth = Math.max(2, r * 0.11);
    ctx.beginPath();
    ctx.arc(0, 0, rr, -Math.PI * 0.85, Math.PI * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rr * 0.72, -rr * 0.18);
    ctx.lineTo(rr * 1.0, rr * 0.14);
    ctx.lineTo(rr * 1.22, -rr * 0.16);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, rr, Math.PI * 0.15, Math.PI * 1.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-rr * 0.72, rr * 0.18);
    ctx.lineTo(-rr * 1.0, -rr * 0.14);
    ctx.lineTo(-rr * 1.22, rr * 0.16);
    ctx.stroke();
  } else {
    // 原海报右下：同心靶心 + 右上射入之箭
    ctx.lineWidth = Math.max(1.8, r * 0.095);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(r * 0.56, -r * 0.56);
    ctx.lineTo(r * 0.08, -r * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.34, -r * 0.56);
    ctx.lineTo(r * 0.56, -r * 0.56);
    ctx.lineTo(r * 0.56, -r * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

// 绘制带白色虚线方向箭的实心朱橘红路径段
function drawTrackSegment(ctx, x1, y1, x2, y2, width, dashPhase, isError) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;
  const ang = Math.atan2(dy, dx);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 轻微暖底投影，复刻原海报厚实彩带感
  ctx.strokeStyle = "rgba(14, 29, 66, 0.08)";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1 + 4);
  ctx.lineTo(x2, y2 + 4);
  ctx.stroke();

  // 主体实心橘红带
  ctx.strokeStyle = isError ? "rgba(250, 71, 24, 0.58)" : C.red;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 内部白色虚线引导线（留出两端节点半径）
  const pad = Math.min(len * 0.22, width * 0.9);
  if (len > pad * 2 + 12) {
    const ux = dx / len;
    const uy = dy / len;
    const sx = x1 + ux * pad;
    const sy = y1 + uy * pad;
    const ex = x2 - ux * pad;
    const ey = y2 - uy * pad;

    ctx.strokeStyle = C.white;
    ctx.lineWidth = Math.max(2, width * 0.095);
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -dashPhase;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex - ux * 8, ey - uy * 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // 末端白色锐三角箭头
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.fillStyle = C.white;
    const ah = Math.max(6, width * 0.25);
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(-ah * 1.15, -ah * 0.68);
    ctx.lineTo(-ah * 0.8, 0);
    ctx.lineTo(-ah * 1.15, ah * 0.68);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// 爵士夜题材中的极简无五官萨克斯剪影（沿斜桥方向吹奏）
function drawJazzSilhouette(ctx, x1, y1, x2, y2, scale, active) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.translate(mx, my);
  ctx.globalAlpha = active ? 0.18 : 0.07;
  ctx.fillStyle = C.blue;
  // 抽象侧影帽檐 + 乐手肩背剪影（严格无五官）
  ctx.beginPath();
  ctx.arc(scale * 16, -scale * 28, scale * 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(scale * 0, -scale * 36, scale * 32, scale * 4);
  ctx.beginPath();
  ctx.moveTo(scale * 4, -scale * 14);
  ctx.quadraticCurveTo(scale * 30, -scale * 12, scale * 34, scale * 36);
  ctx.lineTo(-scale * 4, scale * 36);
  ctx.quadraticCurveTo(-scale * 8, scale * 4, scale * 4, -scale * 14);
  ctx.closePath();
  ctx.fill();
  // 斜向萨克斯号角剪影指向左下
  ctx.rotate(ang - Math.PI * 0.72);
  ctx.lineWidth = scale * 7;
  ctx.strokeStyle = C.red;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -scale * 16);
  ctx.lineTo(0, scale * 22);
  ctx.quadraticCurveTo(0, scale * 36, -scale * 15, scale * 32);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-scale * 18, scale * 28, scale * 9, 0, Math.PI * 2);
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.restore();
}

// 密排文本墙（textLoad === "dense" 时叠加，视觉说明为什么会塌缩成 F 形）
function drawDenseTextWall(ctx, W, H) {
  ctx.save();
  const left = W * 0.09;
  const width = W * 0.82;
  const top = H * 0.15;
  const rows = 11;
  const gap = (H * 0.7) / rows;
  ctx.fillStyle = "rgba(14, 29, 66, 0.13)";
  for (let i = 0; i < rows; i++) {
    const y = top + i * gap;
    const isHead = i === 0 || i === 4 || i === 8;
    const h = isHead ? Math.max(7, H * 0.022) : Math.max(4, H * 0.012);
    const w = isHead ? width * 0.46 : width * (0.78 + ((i * 19) % 18) * 0.01);
    ctx.fillStyle = isHead ? "rgba(0, 43, 147, 0.25)" : "rgba(14, 29, 66, 0.12)";
    ctx.fillRect(left, y, w, h);
  }
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createHeroCanvas(canvas, getState, mutate) {
  const ctx = canvas.getContext("2d");
  let W = 800;
  let H = 480;
  let lastEv = null;
  let hitTargets = { nodes: [], distractor: null, bridgeGap: null };
  let hoverTarget = null;
  let drag = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    W = Math.max(280, Math.round(rect.width));
    H = Math.max(220, Math.round(rect.height));
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(t, _dt, { still }) {
    resize();
    const state = getState();
    const ev = evaluate(state);
    lastEv = ev;

    const unit = Math.min(W, H);
    const compact = W < 540 || H < 310;
    const yShift = compact ? 0.03 : 0;
    const ptsPx = ev.pts.map((p) => ({
      ...p,
      x: p.u * W,
      y: clamp(p.v + yShift, 0.16, 0.86) * H,
    }));
    const [p0, p1, p2, p3] = ptsPx;

    // 1. 奶油暖象牙原纸底
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // 2. 原海报标志性斜切浅暖灰底带（左/右交替切入，实时跟随四站高度）
    const bandH = Math.max(54, H * 0.2);
    const skew = Math.min(54, W * 0.055);
    ctx.fillStyle = C.band;
    // 右上斜切带
    ctx.beginPath();
    ctx.moveTo(Math.max(p1.x - skew * 0.5, W * 0.55), p1.y - bandH * 0.48);
    ctx.lineTo(W, p1.y - bandH * 0.48);
    ctx.lineTo(W, p1.y + bandH * 0.52);
    ctx.lineTo(Math.max(p1.x - skew * 1.4, W * 0.48), p1.y + bandH * 0.52);
    ctx.closePath();
    ctx.fill();

    // 左中斜切带
    const midY = (p0.v + p2.v) * 0.5 * H;
    ctx.beginPath();
    ctx.moveTo(0, midY - bandH * 0.46);
    ctx.lineTo(W * 0.44, midY - bandH * 0.46);
    ctx.lineTo(W * 0.36, midY + bandH * 0.52);
    ctx.lineTo(0, midY + bandH * 0.52);
    ctx.closePath();
    ctx.fill();

    // 下段整条斜切底带（承托左下与右下）
    ctx.beginPath();
    ctx.moveTo(0, p2.y - bandH * 0.46);
    ctx.lineTo(W, p3.y - bandH * 0.46);
    ctx.lineTo(W, p3.y + bandH * 0.54);
    ctx.lineTo(0, p2.y + bandH * 0.54);
    ctx.closePath();
    ctx.fill();

    // 3. 轻出版坐标线 + 经验横跨参考带（极克制）
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 5;
    for (let i = 1; i < cols; i++) {
      const gx = (W / cols) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const gy = (H / rows) * j;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }
    ctx.restore();

    // 4. 场景层叠加（爵士夜剪影 / 密排文本墙 / SaaS 首屏框架）
    if (state.textLoad === "dense") {
      drawDenseTextWall(ctx, W, H);
    } else if (state.scene === "jazz") {
      drawJazzSilhouette(ctx, p1.x, p1.y, p2.x, p2.y, unit / 320, state.bridge);
    } else if (state.scene === "saas") {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 43, 147, 0.14)";
      ctx.lineWidth = 1.25;
      roundRectPath(ctx, W * 0.04, H * 0.07, W * 0.92, H * 0.86, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.04, p0.y + Math.max(28, unit * 0.11));
      ctx.lineTo(W * 0.96, p0.y + Math.max(28, unit * 0.11));
      ctx.stroke();
      ctx.restore();
    }

    // 5. 实心朱橘红 Z 路径三段（上横、对角桥、下横）
    const trackW = clamp(unit * 0.095, 22, 42);
    const dashPhase = still ? 0 : t * 28;
    const trackMuted = state.textLoad === "dense";

    // 上横段 P0 -> P1
    drawTrackSegment(ctx, p0.x, p0.y, p1.x, p1.y, trackW, dashPhase, trackMuted);
    // 下横段 P2 -> P3
    drawTrackSegment(ctx, p2.x, p2.y, p3.x, p3.y, trackW, dashPhase, trackMuted);

    // 对角桥段 P1 -> P2
    hitTargets.bridgeGap = null;
    if (state.bridge) {
      drawTrackSegment(ctx, p1.x, p1.y, p2.x, p2.y, trackW, dashPhase, trackMuted);
    } else {
      // 断桥可点击缺口
      const bx = (p1.x + p2.x) / 2;
      const by = (p1.y + p2.y) / 2;
      ctx.save();
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 缺口提示胶囊（按真实字宽动态撑开，绝不贴边溢出）
      const labelY = state.distractor ? by + Math.max(38, unit * 0.13) : by;
      const labelX = state.distractor ? bx - Math.min(28, W * 0.05) : bx;
      const gapText = "× 对角桥断开 · 点此接通";
      ctx.font = `700 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      const bw = Math.ceil(ctx.measureText(gapText).width) + 22;
      const bh = 28;
      const gx = clamp(labelX - bw / 2, 10, W - bw - 10);
      const gy = clamp(labelY - bh / 2, 34, H - bh - 10);
      hitTargets.bridgeGap = { x: gx, y: gy, w: bw, h: bh };
      ctx.fillStyle = C.errBg;
      ctx.strokeStyle = C.err;
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, gx, gy, bw, bh, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.err;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gapText, gx + bw / 2, gy + bh / 2 + 0.5);
      ctx.restore();
    }

    // 6. 中路抢戏干扰块（可直点清场）
    hitTargets.distractor = null;
    if (state.distractor) {
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2 - (state.bridge ? 0 : Math.max(12, unit * 0.035));
      const dw = compact ? 136 : 168;
      const dh = compact ? 52 : 62;
      const rx = clamp(mx - dw / 2, 14, W - dw - 14);
      const ry = clamp(my - dh / 2, 14, H - dh - 14);
      hitTargets.distractor = { x: rx, y: ry, w: dw, h: dh };

      ctx.save();
      // 警戒斜纹卡
      ctx.fillStyle = C.errBg;
      roundRectPath(ctx, rx, ry, dw, dh, 6);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(181, 29, 41, 0.12)";
      ctx.lineWidth = 6;
      for (let sx = -dh; sx < dw + dh; sx += 18) {
        ctx.beginPath();
        ctx.moveTo(rx + sx, ry);
        ctx.lineTo(rx + sx - dh, ry + dh);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = hoverTarget === "distractor" ? C.red : C.err;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      roundRectPath(ctx, rx, ry, dw, dh, 6);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.err;
      ctx.font = `700 ${compact ? 12 : 13}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const dTitle = state.scene === "jazz" ? "抢戏浮窗：限时抽奖" : state.scene === "saas" ? "抢戏横幅：立即领券" : "中路抢戏干扰块";
      ctx.fillText(dTitle, rx + dw / 2, ry + dh * 0.36);
      ctx.font = `600 ${compact ? 10.5 : 11.5}px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = C.redDark;
      ctx.fillText("点此清场 · 让开斜桥", rx + dw / 2, ry + dh * 0.72);
      ctx.restore();
    }

    // 7. 实绘四枚红圈白底蓝图标圆徽 + 原海报风折线引注标签
    const baseR = clamp(unit * 0.082, 22, 36);
    hitTargets.nodes = [];

    ptsPx.forEach((p, idx) => {
      const roleKey = p.role;
      const role = ROLES[roleKey];
      const wMul = ev.weights[idx];
      const r = clamp(baseR * wMul, 19, 43);
      const isSelected = state.selectedSlot === idx;
      const isWrongPos =
        (idx === 0 && roleKey !== "entry") ||
        (idx === 3 && roleKey !== "cta");

      hitTargets.nodes.push({ idx, x: p.x, y: p.y, r: Math.max(r + 6, 26) });

      ctx.save();
      // 轻柔纸面阴影
      ctx.shadowColor = "rgba(14, 29, 66, 0.16)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // 外圈厚朱橘红（或错位深绛赤）
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isWrongPos ? C.err : C.red;
      ctx.fill();
      ctx.shadowColor = "transparent";

      // 选中环
      if (isSelected || hoverTarget === `node-${idx}`) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 内部纯白圆底
      const innerR = r * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, innerR, 0, Math.PI * 2);
      ctx.fillStyle = C.white;
      ctx.fill();

      // 皇家钴蓝矢量图标
      drawRoleIcon(ctx, roleKey, p.x, p.y, innerR, isWrongPos ? C.err : C.blue);

      // 站点编号小角标（①②③④）
      const badgeX = p.x - r * 0.72;
      const badgeY = p.y - r * 0.72;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 10, 0, Math.PI * 2);
      ctx.fillStyle = isWrongPos ? C.err : C.blue;
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = `700 10.5px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), badgeX, badgeY + 0.5);

      // 站点文本卡片标签（放在圆徽外侧，确保绝不互相重叠或出画框）
      const labelTitle =
        state.scene === "jazz"
          ? role.jazzTitle
          : state.scene === "saas"
            ? role.saasTitle
            : role.title;
      const labelSub =
        state.scene === "jazz"
          ? role.jazzSub
          : state.scene === "saas"
            ? role.saasSub
            : role.en;

      const onRight = idx === 1 || idx === 3;
      const spaceOuter = onRight ? W - (p.x + r) : p.x - r;
      const putBelow = compact || spaceOuter < 118;

      ctx.font = `700 ${compact ? 11.5 : 13}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(labelTitle).width;

      if (putBelow) {
        const labelFull = isWrongPos ? `${labelTitle}（错位）` : labelTitle;
        const fw = ctx.measureText(labelFull).width;
        // 若右上节点上方会撞到右上角 HUD 徽章（y < 38），自动改置节点下方清爽避让
        let ty = idx < 2 ? p.y - r - 14 : p.y + r + 15;
        if (idx === 1 && ty < 40) ty = p.y + r + 14;
        const tx = clamp(p.x, fw / 2 + 10, W - fw / 2 - 10);
        ctx.fillStyle = "rgba(251, 244, 232, 0.94)";
        roundRectPath(ctx, tx - fw / 2 - 6, ty - 10, fw + 12, 20, 3);
        ctx.fill();
        ctx.fillStyle = isWrongPos ? C.err : C.blueDeep;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labelFull, tx, ty);
      } else {
        // 原海报风蓝圆点 + 水平引线 + 主副标
        const dir = onRight ? 1 : -1;
        const dotX = p.x + dir * (r + 10);
        const lineEnd = p.x + dir * (r + 28);
        ctx.strokeStyle = isWrongPos ? C.err : C.blue;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(dotX, p.y);
        ctx.lineTo(lineEnd, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(dotX, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isWrongPos ? C.err : C.blue;
        ctx.fill();

        const tx = lineEnd + dir * 7;
        ctx.textAlign = onRight ? "left" : "right";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = isWrongPos ? C.err : C.blue;
        ctx.font = `800 13.5px "Noto Sans SC", sans-serif`;
        ctx.fillText(labelTitle, tx, p.y - 3);
        ctx.fillStyle = isWrongPos ? C.redDark : C.blueMuted;
        ctx.font = `600 10.5px "Outfit", "Noto Sans SC", sans-serif`;
        ctx.fillText(isWrongPos ? "站位倒置 · 可互换" : labelSub, tx, p.y + 13);
      }
      ctx.restore();
    });

    // 8. 实时预测眼动扫视轨迹 + 动态脉冲瞳环
    if (state.showGaze && ev.gazePoints.length >= 2) {
      const gpx = ev.gazePoints.map((g) => ({ ...g, x: g.u * W, y: g.v * H }));
      const isOk = ev.kind === "pass";
      const gazeCol = isOk ? C.blue : C.err;

      ctx.save();
      ctx.strokeStyle = isOk ? "rgba(0, 43, 147, 0.72)" : "rgba(181, 29, 41, 0.85)";
      ctx.lineWidth = isOk ? 2.2 : 2.6;
      ctx.setLineDash(isOk ? [4, 5] : [8, 4]);
      ctx.beginPath();
      gpx.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 计算探针当前位置（still 时停在路径 68% 处清晰展现运动感）
      let totalLen = 0;
      const segs = [];
      for (let i = 0; i < gpx.length - 1; i++) {
        const l = Math.hypot(gpx[i + 1].x - gpx[i].x, gpx[i + 1].y - gpx[i].y);
        segs.push(l);
        totalLen += l;
      }
      const prog = still ? 0.68 : ((t * 0.28) % 1);
      let remain = prog * totalLen;
      let px = gpx[0].x;
      let py = gpx[0].y;
      for (let i = 0; i < segs.length; i++) {
        if (remain <= segs[i] || i === segs.length - 1) {
          const frac = segs[i] > 0.001 ? clamp(remain / segs[i], 0, 1) : 0;
          px = gpx[i].x + (gpx[i + 1].x - gpx[i].x) * frac;
          py = gpx[i].y + (gpx[i + 1].y - gpx[i].y) * frac;
          break;
        }
        remain -= segs[i];
      }

      // 探针脉冲外圈 + 实心聚焦环
      const pulse = still ? 1 : 0.88 + 0.22 * Math.sin(t * 5);
      ctx.beginPath();
      ctx.arc(px, py, 13 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = isOk ? "rgba(0, 43, 147, 0.16)" : "rgba(181, 29, 41, 0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = gazeCol;
      ctx.stroke();

      // 如果是错态（跳角/截胡/退化F/滑出），在末段外侧水平方向画标，绝不遮盖图标或上下文字标签
      if (!isOk) {
        const last = gpx[gpx.length - 1];
        const nearNode = hitTargets.nodes.find((n) => Math.hypot(last.x - n.x, last.y - n.y) < n.r * 0.9);
        const mx = nearNode ? clamp(last.x + nearNode.r + 6, 16, W - 16) : clamp(last.x, 16, W - 16);
        const my = nearNode ? clamp(last.y, 36, H - 16) : clamp(last.y, 36, H - 16);
        ctx.fillStyle = C.err;
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.white;
        ctx.font = `700 10px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(last.tag.slice(0, 2), mx, my + 0.5);
      }
      ctx.restore();
    }

    // 9. 顶部单行实时 HUD 标尺（横跨百分比 + 斜角 + 达标计数，不遮挡节点）
    ctx.save();
    const hudText = `横跨 ${Math.round(ev.effectiveSpan * 100)}% · 斜角 ${ev.diagAngle}° · ${ev.passCount}/4`;
    ctx.font = `600 ${compact ? 10.5 : 11.5}px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    const hw = ctx.measureText(hudText).width + 20;
    const hx = W - hw - 10;
    const hy = 8;
    ctx.fillStyle = ev.passCount === 4 ? "rgba(11, 107, 104, 0.94)" : "rgba(14, 29, 66, 0.90)";
    roundRectPath(ctx, hx, hy, hw, 22, 4);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hudText, hx + hw / 2, hy + 11.5);

    // 左上角横拖引导标
    if (!compact) {
      const hint = "↔ 左右横拖画布展收 Z 跨度 · 拖节点互换 · 点红块纠错";
      ctx.font = `500 11px "Noto Sans SC", sans-serif`;
      ctx.fillStyle = C.blueMuted;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(hint, 12, hy + 12);
    }
    ctx.restore();
  }

  function ptFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(x, y) {
    if (hitTargets.distractor) {
      const d = hitTargets.distractor;
      if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) return { type: "distractor" };
    }
    if (hitTargets.bridgeGap) {
      const b = hitTargets.bridgeGap;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { type: "bridgeGap" };
    }
    for (const n of hitTargets.nodes) {
      if (Math.hypot(x - n.x, y - n.y) <= n.r) return { type: "node", idx: n.idx };
    }
    return { type: "canvas" };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pt = ptFromEvent(e);
    const hit = hitTest(pt.x, pt.y);
    const s = getState();
    drag = {
      id: e.pointerId,
      hit,
      startX: pt.x,
      startY: pt.y,
      startSpan: s.span,
      startOffset: hit.type === "node" ? { ...s.offsets[hit.idx] } : null,
      moved: false,
    };
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = ptFromEvent(e);
    if (!drag) {
      const hit = hitTest(pt.x, pt.y);
      hoverTarget = hit.type === "node" ? `node-${hit.idx}` : hit.type === "canvas" ? null : hit.type;
      canvas.style.cursor =
        hit.type === "distractor" || hit.type === "bridgeGap"
          ? "pointer"
          : hit.type === "node"
            ? "grab"
            : "ew-resize";
      return;
    }
    if (e.pointerId !== drag.id) return;
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;

    if (drag.hit.type === "node" && drag.moved) {
      const idx = drag.hit.idx;
      mutate((s) => {
        s.selectedSlot = idx;
        s.offsets[idx] = {
          du: clamp(drag.startOffset.du + dx / W, -0.14, 0.14),
          dv: clamp(drag.startOffset.dv + dy / H, -0.12, 0.12),
        };
      });
    } else if (drag.hit.type === "canvas" || (drag.hit.type !== "node" && drag.moved)) {
      // 横向直拖实时展收 Z 形跨度（perf.mjs 自动横拖也会平滑触发真实重算与重绘！）
      const deltaSpan = (dx / Math.max(220, W * 0.65)) * 0.65;
      mutate((s) => {
        s.span = clamp(drag.startSpan + deltaSpan, SPAN_MIN, SPAN_MAX);
      });
    }
  });

  function finishDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const pt = ptFromEvent(e);
    const { hit, moved } = drag;
    drag = null;

    if (!moved) {
      if (hit.type === "distractor") {
        mutate((s) => { s.distractor = false; });
      } else if (hit.type === "bridgeGap") {
        mutate((s) => { s.bridge = true; });
      } else if (hit.type === "node") {
        // 点击节点：若此前已选中另一站且两站不同，若其中之一错位则直接互换，或选中供微调
        mutate((s) => {
          const prev = s.selectedSlot;
          if (prev !== hit.idx) {
            const tmp = s.roles[prev];
            s.roles[prev] = s.roles[hit.idx];
            s.roles[hit.idx] = tmp;
            s.selectedSlot = hit.idx;
          } else {
            s.selectedSlot = hit.idx;
          }
        });
      }
    } else if (hit.type === "node") {
      // 拖到另一圆徽附近松手 → 互换角色并归位偏移
      const dropTarget = hitTargets.nodes.find((n) => n.idx !== hit.idx && Math.hypot(pt.x - n.x, pt.y - n.y) < n.r * 1.45);
      if (dropTarget) {
        mutate((s) => {
          const a = hit.idx;
          const b = dropTarget.idx;
          const tmp = s.roles[a];
          s.roles[a] = s.roles[b];
          s.roles[b] = tmp;
          s.offsets[a] = { du: 0, dv: 0 };
          s.offsets[b] = { du: 0, dv: 0 };
          s.selectedSlot = b;
        });
      }
    }
  }

  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);

  // 补充触屏兜底监听，确保 perf.mjs 的 dispatchTouchEvent 在任何模式下都顺滑触发重绘
  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const tc = e.touches[0];
    if (!tc) return;
    const rect = canvas.getBoundingClientRect();
    touchStart = { x: tc.clientX - rect.left, y: tc.clientY - rect.top, span: getState().span };
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchStart) return;
    const tc = e.touches[0];
    if (!tc) return;
    const rect = canvas.getBoundingClientRect();
    const dx = tc.clientX - rect.left - touchStart.x;
    const dy = tc.clientY - rect.top - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy) * 0.8) {
      const deltaSpan = (dx / Math.max(200, W * 0.6)) * 0.65;
      mutate((s) => {
        s.span = clamp(touchStart.span + deltaSpan, SPAN_MIN, SPAN_MAX);
      });
    }
  }, { passive: true });
  canvas.addEventListener("touchend", () => { touchStart = null; }, { passive: true });

  return { render, getLastEval: () => lastEv };
}
