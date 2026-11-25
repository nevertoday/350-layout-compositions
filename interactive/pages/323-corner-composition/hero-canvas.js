// 323 边角式构图 — 开场活体 2D Canvas「一角定盘·扇弧定向仪」
// 1:1 承袭原海报漆墨松黑 × 竹芽青黄 × 象牙绢白视觉语言，支持三套皮层、横拖旋转定向、直点四角与对角热区。
import { loop, pixelRatio } from "../../lib/stage.js";
import { CORNERS, evaluate, normDeg } from "./model.js";

const PALETTE = {
  bg: "#050F0A",
  bgSong: "#08140F",
  bgModern: "#07110C",
  grid: "rgba(243, 233, 204, 0.06)",
  cream: "#F3E9CC",
  creamSoft: "rgba(243, 233, 204, 0.78)",
  creamMuted: "rgba(243, 233, 204, 0.36)",
  lime: "#A9C72E",
  limeBright: "#C2DF46",
  limeDim: "rgba(169, 199, 46, 0.28)",
  warn: "#FF6F5E",
  warnFill: "rgba(255, 111, 94, 0.16)",
  ink: "#050F0A",
  sage: "#294032",
  sageLight: "#4B6854",
};

const PAD = 18;

export function mountHeroCanvas(canvas, getState, onPatch) {
  const ctx = canvas.getContext("2d");
  let W = 640;
  let H = 480;
  let dpr = 1;
  let intro = 0;
  let hoverTarget = "";
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartAngle = 0;
  let dragMoved = false;
  let touchMode = null; // 'horiz' | 'scroll' | null
  let dirty = true;
  let lastPulseAt = 0;

  // 文本宽度缓存，避免每帧重复 measureText
  const widthCache = new Map();
  function textW(font, str) {
    const k = font + "|" + str;
    let v = widthCache.get(k);
    if (v === undefined) {
      ctx.font = font;
      v = ctx.measureText(str).width;
      if (widthCache.size > 64) widthCache.clear();
      widthCache.set(k, v);
    }
    return v;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 手机窄屏限制 DPR ≤ 1.5（GUIDE.md 性能建议），桌面保持 ≤ 2
    dpr = rect.width <= 520 ? pixelRatio(1.5) : pixelRatio(2);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dirty = true;
  }

  function frameRect() {
    const pad = Math.max(12, Math.min(PAD, Math.round(W * 0.028)));
    return { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
  }

  function hitSpots(ev, fr) {
    const spots = [];
    const hitR = Math.max(26, Math.min(38, fr.w * 0.065));
    for (const id of ["tl", "tr", "bl", "br", "center"]) {
      const c = CORNERS[id];
      spots.push({
        kind: "corner",
        id,
        x: fr.x + c.ax * fr.w,
        y: fr.y + c.ay * fr.h,
        r: id === "center" ? hitR * 0.85 : hitR,
      });
    }
    if (ev.corner.id !== "center") {
      spots.push({
        kind: "echo",
        id: "echo",
        x: fr.x + ev.corner.oppX * fr.w,
        y: fr.y + ev.corner.oppY * fr.h,
        r: Math.max(36, fr.w * 0.095),
      });
    }
    return spots;
  }

  function pickSpot(px, py) {
    const fr = frameRect();
    const state = getState();
    const ev = evaluate(state, fr.w / fr.h);
    const spots = hitSpots(ev, fr);
    // 优先检测对角块（当重块警示时更易点击清除）
    const echoSpot = spots.find((s) => s.kind === "echo");
    if (echoSpot && Math.hypot(px - echoSpot.x, py - echoSpot.y) <= echoSpot.r) return echoSpot;
    for (const s of spots) {
      if (s.kind === "corner" && Math.hypot(px - s.x, py - s.y) <= s.r) return s;
    }
    return null;
  }

  function drawArrowHead(x, y, rad, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.52);
    ctx.lineTo(-size, size * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDashedArrow(x1, y1, x2, y2, color, dash = [6, 6], width = 1.6, headSize = 10, phase = 0) {
    const rad = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 8) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = -phase;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(rad) * (headSize * 0.7), y2 - Math.sin(rad) * (headSize * 0.7));
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(x2, y2, rad, headSize, color);
    ctx.restore();
  }

  function drawGridAndFrame(fr, state, ev) {
    ctx.fillStyle = state.theme === "song" ? PALETTE.bgSong : state.theme === "modern" ? PALETTE.bgModern : PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    // 全部底格合并为单次 stroke，极大降低软件渲染开销
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cols = 8;
    const rows = 6;
    for (let i = 1; i < cols; i++) {
      const gx = fr.x + (fr.w * i) / cols;
      ctx.moveTo(gx, fr.y);
      ctx.lineTo(gx, fr.y + fr.h);
    }
    for (let j = 1; j < rows; j++) {
      const gy = fr.y + (fr.h * j) / rows;
      ctx.moveTo(fr.x, gy);
      ctx.lineTo(fr.x + fr.w, gy);
    }
    ctx.stroke();

    // 隐性对角骨架（打开引导线时显现）
    if (state.showGuides) {
      ctx.strokeStyle = "rgba(243, 233, 204, 0.09)";
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(fr.x, fr.y);
      ctx.lineTo(fr.x + fr.w, fr.y + fr.h);
      ctx.moveTo(fr.x + fr.w, fr.y);
      ctx.lineTo(fr.x, fr.y + fr.h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 外框极细边界线
    ctx.strokeStyle = ev.ok ? "rgba(169, 199, 46, 0.34)" : "rgba(243, 233, 204, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(fr.x, fr.y, fr.w, fr.h);
  }

  // 绘制原海报几何皮层：三层同心四分之一圆扇（完全忠实 323 原海报！）
  function drawPosterTheme(fr, state, ev, ease) {
    const cx = fr.x + ev.corner.ax * fr.w;
    const cy = fr.y + ev.corner.ay * fr.h;
    const R = ev.R * fr.h * ease;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fr.x, fr.y, fr.w, fr.h);
    ctx.clip();

    // 1. 外层象牙绢扇
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 2. 中层竹芽青扇（错态满溢时外缘带微朱砂警戒圈）
    ctx.fillStyle = ev.faultId === "mass_overflow" ? "#B8C74A" : PALETTE.lime;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.56, 0, Math.PI * 2);
    ctx.fill();

    // 3. 最内漆墨反抠芯
    ctx.fillStyle = PALETTE.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // 满溢或过小时的柔红虚线边界提示
    if (ev.faultId === "mass_overflow" || ev.faultId === "mass_tiny") {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // 绘制南宋「马一角」山径写意皮层（无五官高士背影剪影 + 斜崖巨石 + 随角度转向的垂柳松枝）
  function drawSongTheme(fr, state, ev, ease) {
    const cx = fr.x + ev.corner.ax * fr.w;
    const cy = fr.y + ev.corner.ay * fr.h;
    const R = ev.R * fr.h * ease;
    const rad = (ev.deg * Math.PI) / 180;
    const dirX = ev.corner.ax === 1 ? -1 : ev.corner.ax === 0 ? 1 : 0;
    const dirY = ev.corner.ay === 1 ? -1 : ev.corner.ay === 0 ? 1 : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fr.x, fr.y, fr.w, fr.h);
    ctx.clip();

    // 远山薄雾弧（极淡墨青雾气衬托夜月绢韵）
    const mistGrad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.45);
    mistGrad.addColorStop(0, "rgba(169, 199, 46, 0.14)");
    mistGrad.addColorStop(0.55, "rgba(243, 233, 204, 0.08)");
    mistGrad.addColorStop(1, "rgba(5, 15, 10, 0)");
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // 1. 斧劈皴斜崖巨石（占据一角底座，面积严格匹配 R）
    ctx.fillStyle = "#1E3026";
    ctx.beginPath();
    if (ev.corner.id === "center") {
      ctx.ellipse(cx, cy, R * 1.05, R * 0.72, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dirX * R * 1.12, cy);
      ctx.lineTo(cx + dirX * R * 0.88, cy + dirY * R * 0.34);
      ctx.lineTo(cx + dirX * R * 0.56, cy + dirY * R * 0.62);
      ctx.lineTo(cx + dirX * R * 0.28, cy + dirY * R * 0.88);
      ctx.lineTo(cx, cy + dirY * R * 1.04);
      ctx.closePath();
    }
    ctx.fill();

    // 岩体象牙高光斧劈棱面
    ctx.fillStyle = PALETTE.cream;
    ctx.globalAlpha = 0.86;
    ctx.beginPath();
    if (ev.corner.id === "center") {
      ctx.moveTo(cx - R * 0.65, cy + R * 0.15);
      ctx.lineTo(cx - R * 0.12, cy - R * 0.45);
      ctx.lineTo(cx + R * 0.58, cy - R * 0.1);
      ctx.lineTo(cx + R * 0.1, cy + R * 0.35);
      ctx.closePath();
    } else {
      ctx.moveTo(cx + dirX * R * 0.12, cy + dirY * R * 0.12);
      ctx.lineTo(cx + dirX * R * 0.94, cy + dirY * R * 0.08);
      ctx.lineTo(cx + dirX * R * 0.64, cy + dirY * R * 0.42);
      ctx.lineTo(cx + dirX * R * 0.18, cy + dirY * R * 0.72);
      ctx.closePath();
    }
    ctx.fill();
    ctx.globalAlpha = 1;

    // 2. 苍劲斜枝（顺着用户旋动的 angle 方向探出！）
    const rootX = ev.corner.id === "center" ? cx : cx + dirX * R * 0.34;
    const rootY = ev.corner.id === "center" ? cy : cy + dirY * R * 0.34;
    const branchLen = Math.max(58, R * 0.98);
    const tipX = rootX + Math.cos(rad) * branchLen;
    const tipY = rootY + Math.sin(rad) * branchLen;
    const ctrlX = rootX + Math.cos(rad - 0.22) * branchLen * 0.55;
    const ctrlY = rootY + Math.sin(rad - 0.22) * branchLen * 0.55;

    ctx.strokeStyle = PALETTE.lime;
    ctx.lineWidth = Math.max(3, R * 0.032);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.stroke();

    // 副枝与细柳条（柔垂下挂）
    const subX = rootX + Math.cos(rad + 0.18) * branchLen * 0.68;
    const subY = rootY + Math.sin(rad + 0.18) * branchLen * 0.68;
    ctx.lineWidth = Math.max(1.8, R * 0.018);
    ctx.beginPath();
    ctx.moveTo(ctrlX, ctrlY);
    ctx.lineTo(subX, subY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(169, 199, 46, 0.72)";
    ctx.lineWidth = 1.25;
    for (let k = 0; k < 5; k++) {
      const f = 0.35 + k * 0.15;
      const bx = (1 - f) * (1 - f) * rootX + 2 * (1 - f) * f * ctrlX + f * f * tipX;
      const by = (1 - f) * (1 - f) * rootY + 2 * (1 - f) * f * ctrlY + f * f * tipY;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + Math.cos(rad) * 8, by + 16, bx + Math.cos(rad) * 4, by + 26 + (k % 2) * 8);
      ctx.stroke();
    }

    // 3. 无五官高士剪影背影（站在石径上，纯剪影无五官，微倾朝向 angle）
    const sx = ev.corner.id === "center" ? cx : cx + dirX * R * 0.54;
    const sy = ev.corner.id === "center" ? cy + R * 0.05 : cy + dirY * R * 0.42;
    const figH = Math.max(24, Math.min(44, R * 0.24));
    const lean = Math.cos(rad) >= 0 ? 1 : -1;

    ctx.save();
    ctx.translate(sx, sy);
    // 宽袖白袍剪影（绝不画眼睛、鼻、嘴）
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.moveTo(-figH * 0.24, figH * 0.48);
    ctx.quadraticCurveTo(-figH * 0.18, -figH * 0.04, -figH * 0.07 + lean * 2, -figH * 0.28);
    ctx.lineTo(figH * 0.12 + lean * 3, -figH * 0.24);
    ctx.quadraticCurveTo(figH * 0.26, figH * 0.06, figH * 0.22, figH * 0.48);
    ctx.closePath();
    ctx.fill();
    // 漆纱笼冠与圆首纯剪影（无任何五官）
    ctx.fillStyle = "#102018";
    ctx.beginPath();
    ctx.arc(lean * 2, -figH * 0.4, figH * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-figH * 0.1 + lean * 2, -figH * 0.56, figH * 0.2, figH * 0.13);
    ctx.restore();

    ctx.restore();
  }

  // 绘制当代暗夜建筑展海报皮层
  function drawModernTheme(fr, state, ev, ease) {
    const cx = fr.x + ev.corner.ax * fr.w;
    const cy = fr.y + ev.corner.ay * fr.h;
    const R = ev.R * fr.h * ease;
    const rad = (ev.deg * Math.PI) / 180;
    const dirX = ev.corner.ax === 1 ? -1 : ev.corner.ax === 0 ? 1 : 0;
    const dirY = ev.corner.ay === 1 ? -1 : ev.corner.ay === 0 ? 1 : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(fr.x, fr.y, fr.w, fr.h);
    ctx.clip();

    // 光锥束（顺着 angle 投射出微亮建筑光域）
    const beamLen = Math.hypot(fr.w, fr.h) * 0.72;
    const spread = 0.2;
    const beamGrad = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, beamLen);
    beamGrad.addColorStop(0, ev.vectorKind === "escape" ? "rgba(255,111,94,0.22)" : "rgba(169,199,46,0.20)");
    beamGrad.addColorStop(1, "rgba(5,15,10,0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, beamLen, rad - spread, rad + spread);
    ctx.closePath();
    ctx.fill();

    // 阶梯几何建筑体块（精准压角）
    if (ev.corner.id === "center") {
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(cx - R * 0.86, cy - R * 0.62, R * 1.72, R * 1.24);
      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(cx - R * 0.44, cy - R * 0.34, R * 0.88, R * 0.68);
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(cx - R * 0.18, cy - R * 0.14, R * 0.36, R * 0.28);
    } else {
      // 外体块（象牙白混凝土立面）
      const bw = R * 0.92;
      const bh = R * 0.86;
      const rx = dirX < 0 ? cx - bw : cx;
      const ry = dirY < 0 ? cy - bh : cy;
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(rx, ry, bw, bh);

      // 阶梯切口（竹芽青立面）
      const iw = bw * 0.6;
      const ih = bh * 0.56;
      const irx = dirX < 0 ? cx - iw : cx;
      const iry = dirY < 0 ? cy - ih : cy;
      ctx.fillStyle = PALETTE.lime;
      ctx.fillRect(irx, iry, iw, ih);

      // 内阴影门洞
      const dw = bw * 0.26;
      const dh = bh * 0.26;
      const drx = dirX < 0 ? cx - dw : cx;
      const dry = dirY < 0 ? cy - dh : cy;
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(drx, dry, dw, dh);

      // 细建筑窗线
      ctx.strokeStyle = "rgba(5, 15, 10, 0.26)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const lx = rx + (bw * i) / 4;
        ctx.beginPath();
        ctx.moveTo(lx, ry);
        ctx.lineTo(lx, ry + bh);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 绘制对角空域（空寂 / 轻度虚应 / 抢戏重块）
  function drawDiagonalEcho(fr, state, ev) {
    if (ev.corner.id === "center") return;
    const ex = fr.x + ev.corner.oppX * fr.w;
    const ey = fr.y + ev.corner.oppY * fr.h;

    ctx.save();
    if (state.echo === "heavy") {
      // 笨重抢戏块（警示朱砂虚框 + 实色大块，直观表现边角瓦解）
      const bw = fr.w * 0.34;
      const bh = fr.h * 0.34;
      const x0 = ex - bw * 0.5;
      const y0 = ey - bh * 0.5;
      ctx.fillStyle = "rgba(243, 233, 204, 0.22)";
      ctx.fillRect(x0, y0, bw, bh);
      ctx.fillStyle = PALETTE.warnFill;
      ctx.fillRect(x0, y0, bw, bh);

      // 斜纹警示
      ctx.strokeStyle = "rgba(255, 111, 94, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = -bh; k < bw + bh; k += 14) {
        const sx = Math.max(x0, x0 + k);
        const sy = y0 + Math.max(0, -k);
        const tx = Math.min(x0 + bw, x0 + k + bh);
        const ty = y0 + Math.min(bh, bw - k);
        if (tx > sx) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
        }
      }
      ctx.stroke();

      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x0, y0, bw, bh);
      ctx.setLineDash([]);

      ctx.fillStyle = "#FFE6E1";
      const fSize = Math.max(11, Math.min(14, Math.round(W * 0.019)));
      ctx.font = `700 ${fSize}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("对角抢戏重块", ex, ey - fSize * 0.72);
      ctx.fillStyle = "#FFC2B8";
      ctx.font = `500 ${Math.max(10.5, fSize - 1.5)}px "Noto Sans SC", sans-serif`;
      ctx.fillText("点此卸除", ex, ey + fSize * 0.78);
    } else if (state.echo === "light") {
      // 轻度虚应（按皮层呈现：原海报微签 / 南宋飞鸟诗题 / 现代展讯小排）
      if (state.theme === "song") {
        // 两只小剪影飞鸟 + 极简书法落款
        ctx.strokeStyle = PALETTE.cream;
        ctx.lineWidth = 1.6;
        for (const [ox, oy, s] of [[-20, -8, 8], [-4, -18, 6]]) {
          ctx.beginPath();
          ctx.moveTo(ex + ox - s, ey + oy + 2);
          ctx.quadraticCurveTo(ex + ox - s * 0.4, ey + oy - 4, ex + ox, ey + oy + 1);
          ctx.quadraticCurveTo(ex + ox + s * 0.4, ey + oy - 4, ex + ox + s, ey + oy + 2);
          ctx.stroke();
        }
        ctx.fillStyle = PALETTE.creamSoft;
        ctx.font = `400 ${Math.max(18, Math.round(W * 0.03))}px "Zhi Mang Xing", "Noto Sans SC", serif`;
        ctx.textAlign = "center";
        ctx.fillText("一", ex + 18, ey - 2);
        ctx.fillText("角", ex + 18, ey + 20);
        // 朱红小印
        ctx.fillStyle = "#C94836";
        ctx.fillRect(ex + 13, ey + 30, 10, 10);
      } else if (state.theme === "modern") {
        ctx.fillStyle = PALETTE.lime;
        ctx.fillRect(ex - 26, ey - 16, 20, 2);
        ctx.fillStyle = PALETTE.cream;
        ctx.font = `600 ${Math.max(10, Math.round(W * 0.017))}px "Manrope", sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText("NO.323 / VOID", ex - 26, ey - 2);
        ctx.fillStyle = PALETTE.creamMuted;
        ctx.font = `400 ${Math.max(10, Math.round(W * 0.015))}px "DM Mono", monospace`;
        ctx.fillText("AUTUMN ARCHIVE", ex - 26, ey + 14);
      } else {
        // 原海报风格轻虚应：竹芽青细 L 标 + 微字
        ctx.strokeStyle = PALETTE.lime;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ex - 20, ey - 4);
        ctx.lineTo(ex - 20, ey - 16);
        ctx.lineTo(ex - 8, ey - 16);
        ctx.stroke();
        ctx.fillStyle = PALETTE.creamSoft;
        ctx.font = `500 ${Math.max(10, Math.round(W * 0.016))}px "DM Mono", monospace`;
        ctx.textAlign = "left";
        ctx.fillText("ECHO · 4%", ex - 12, ey + 2);
        ctx.fillStyle = PALETTE.limeDim;
        ctx.beginPath();
        ctx.arc(ex - 20, ey - 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // 完全空寂：仅在悬停或重角缺应时给极浅点虚圆提示可点放虚应
      ctx.strokeStyle = ev.faultId === "echo_missing_heavy"
        ? "rgba(255, 111, 94, 0.55)"
        : hoverTarget === "echo" ? "rgba(169, 199, 46, 0.45)" : "rgba(243, 233, 204, 0.14)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(ex, ey, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ev.faultId === "echo_missing_heavy" ? "#FFB3A8" : "rgba(243, 233, 204, 0.42)";
      ctx.font = `500 ${Math.max(10, Math.round(W * 0.015))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ev.faultId === "echo_missing_heavy" ? "+ 点加轻虚应" : "留白空域", ex, ey);
    }
    ctx.restore();
  }

  // 绘制原海报同款「三支虚线方向箭」+ 旋转手柄光环
  function drawVectors(fr, state, ev, t, ease) {
    const cx = fr.x + ev.corner.ax * fr.w;
    const cy = fr.y + ev.corner.ay * fr.h;
    const phase = (t * 28) % 24;

    if (ev.corner.id === "center") {
      // 中心态：四向均等短虚线，说明无方向引导
      ctx.save();
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 5]);
      const arm = Math.min(fr.w, fr.h) * 0.24 * ease;
      for (const a of [0, 90, 180, 270]) {
        const r = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(r) * arm, cy + Math.sin(r) * arm);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    const dirX = ev.corner.ax === 1 ? -1 : 1;
    const dirY = ev.corner.ay === 1 ? -1 : 1;

    // 1. 沿水平/垂直两条边界的象牙白细虚线箭（1:1 呼应原海报底边与右边双箭）
    const edgeXLen = fr.w * 0.64 * ease;
    const edgeYLen = fr.h * 0.72 * ease;
    drawDashedArrow(cx, cy, cx + dirX * edgeXLen, cy, PALETTE.creamSoft, [6, 6], 1.3, 9, 0);
    drawDashedArrow(cx, cy, cx, cy + dirY * edgeYLen, PALETTE.creamSoft, [6, 6], 1.3, 9, 0);

    // 2. 入腹理想扇区微光提示（仅开引导线时显示）
    const idealRad = (ev.idealDeg * Math.PI) / 180;
    if (state.showGuides) {
      const fanR = Math.min(fr.w, fr.h) * 0.44;
      ctx.save();
      ctx.beginPath();
      ctx.rect(fr.x, fr.y, fr.w, fr.h);
      ctx.clip();
      ctx.fillStyle = ev.vectorKind === "inward" ? "rgba(169, 199, 46, 0.08)" : "rgba(169, 199, 46, 0.05)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, fanR, idealRad - (35 * Math.PI) / 180, idealRad + (35 * Math.PI) / 180);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. 核心可旋主方向箭（随 angle 360° 转动！）
    const rad = (ev.deg * Math.PI) / 180;
    const isEscape = ev.vectorKind === "escape";
    const isSkim = ev.vectorKind === "skim";
    const arrowColor = isEscape ? PALETTE.warn : isSkim ? "#E8C05A" : PALETTE.limeBright;

    // 从角点画向方向端：外逃时画短红箭直指外墙并在内侧标示角度环，入腹时直穿画面腹地！
    if (isEscape) {
      // 在角点内侧一点起笔，朝外框画刺眼警示红箭
      const startX = cx + dirX * Math.min(fr.w, fr.h) * 0.24;
      const startY = cy + dirY * Math.min(fr.w, fr.h) * 0.24;
      const escapeLen = Math.min(fr.w, fr.h) * 0.3;
      const endX = startX + Math.cos(rad) * escapeLen;
      const endY = startY + Math.sin(rad) * escapeLen;
      drawDashedArrow(startX, startY, endX, endY, PALETTE.warn, [6, 4], 2.4, 12, phase);

      // 撞墙逃逸警告圆环与提示牌
      ctx.save();
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(endX, endY, 12 + Math.sin(t * 5) * 2.5, 0, Math.PI * 2);
      ctx.stroke();

      const label = "视线外逃 · 横拖扳入画内";
      const fSize = Math.max(11, Math.min(13.5, Math.round(W * 0.0165)));
      const font = `600 ${fSize}px "Noto Sans SC", sans-serif`;
      const pillW = Math.ceil(textW(font, label)) + 22;
      const pillH = 28;
      const lx = Math.max(fr.x + pillW * 0.5 + 10, Math.min(fr.x + fr.w - pillW * 0.5 - 10, startX + dirX * 56));
      const ly = Math.max(fr.y + pillH * 0.5 + 10, Math.min(fr.y + fr.h - pillH * 0.5 - 10, startY + dirY * 44));
      ctx.fillStyle = "rgba(38, 12, 10, 0.94)";
      ctx.fillRect(lx - pillW * 0.5, ly - pillH * 0.5, pillW, pillH);
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(lx - pillW * 0.5, ly - pillH * 0.5, pillW, pillH);
      ctx.fillStyle = "#FFD8D2";
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx, ly + 0.5);
      ctx.restore();
    } else {
      const diagLen = Math.hypot(fr.w, fr.h);
      const maxRay = Math.min(diagLen * 0.68, Math.max(ev.R * fr.h + 72, ev.ray.t * fr.h * 0.84)) * ease;
      const tipX = Math.max(fr.x + 12, Math.min(fr.x + fr.w - 12, cx + Math.cos(rad) * maxRay));
      const tipY = Math.max(fr.y + 12, Math.min(fr.y + fr.h - 12, cy + Math.sin(rad) * maxRay));
      drawDashedArrow(cx, cy, tipX, tipY, arrowColor, [7, 6], 2.2, 13, phase);

      // 旋转端点光环（提示可左右拖动）
      ctx.save();
      ctx.strokeStyle = arrowColor;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = dragging ? 0.9 : 0.45;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 绘制四角与正中静默角座（可直点迁角）
  function drawCornerAnchors(fr, state, ev) {
    const spots = hitSpots(ev, fr).filter((s) => s.kind === "corner");
    ctx.save();
    for (const s of spots) {
      const active = state.corner === s.id;
      const hovered = hoverTarget === s.id;
      const isCenter = s.id === "center";
      const ox = s.id.includes("l") ? 14 : s.id.includes("r") ? -14 : 0;
      const oy = s.id.includes("t") ? 14 : s.id.includes("b") ? -14 : 0;
      const bx = s.x + ox;
      const by = s.y + oy;

      ctx.fillStyle = active
        ? isCenter ? PALETTE.warn : PALETTE.lime
        : hovered ? "rgba(169, 199, 46, 0.35)" : "rgba(243, 233, 204, 0.14)";
      ctx.strokeStyle = active ? PALETTE.ink : hovered ? PALETTE.lime : "rgba(243, 233, 204, 0.34)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, active ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 未选中角给极小清晰文字提示，避免拥挤
      if (!active && (hovered || !isCenter)) {
        ctx.fillStyle = hovered ? PALETTE.limeBright : "rgba(243, 233, 204, 0.52)";
        ctx.font = `500 ${Math.max(10, Math.round(W * 0.015))}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = s.id.includes("r") ? "right" : s.id.includes("l") ? "left" : "center";
        ctx.textBaseline = "middle";
        const tx = bx + (s.id.includes("r") ? -12 : s.id.includes("l") ? 12 : 0);
        const ty = isCenter ? by + 16 : by;
        ctx.fillText(CORNERS[s.id].short, tx, ty);
      }
    }
    ctx.restore();
  }

  // 顶部正中精简浮标（避开四角角座与对角重块，零遮挡）
  function drawCornerHUD(fr, state, ev) {
    const text = `${ev.corner.short} ${ev.massPct}% · 留白 ${ev.voidPct}% · ${ev.deg}°`;
    const fSize = Math.max(11, Math.min(12.5, Math.round(W * 0.0155)));
    const font = `500 ${fSize}px "DM Mono", "Noto Sans SC", monospace`;
    const tw = Math.ceil(textW(font, text)) + 18;
    const rx = Math.round(fr.x + (fr.w - tw) * 0.5);
    const ry = ev.corner.id === "tl" || ev.corner.id === "tr" ? fr.y + fr.h - 32 : fr.y + 8;

    ctx.fillStyle = "rgba(5, 15, 10, 0.88)";
    ctx.fillRect(rx, ry, tw, 24);
    ctx.strokeStyle = ev.ok ? "rgba(169, 199, 46, 0.55)" : "rgba(255, 111, 94, 0.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, tw, 24);

    ctx.fillStyle = ev.ok ? PALETTE.cream : "#FFD0C9";
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rx + 9, ry + 12.5);
  }

  function render(t, dt, { still }) {
    if (still) {
      intro = 1;
      dirty = true;
    } else if (intro < 1) {
      intro = Math.min(1, intro + Math.max(0.016, dt || 0.016) * 1.15);
      dirty = true;
    }

    // 减少动画时直接一帧到位；正常状态下只在开场展开或 dirty（交互/状态变化）时全帧重绘，静置时按 12Hz 低功耗微脉冲
    if (!dirty && intro >= 1 && t - lastPulseAt < 0.085) {
      return;
    }
    dirty = false;
    lastPulseAt = t;

    const ease = 1 - Math.pow(1 - intro, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fr = frameRect();
    const state = getState();
    const ev = evaluate(state, fr.w / fr.h);

    drawGridAndFrame(fr, state, ev);
    if (state.theme === "song") drawSongTheme(fr, state, ev, ease);
    else if (state.theme === "modern") drawModernTheme(fr, state, ev, ease);
    else drawPosterTheme(fr, state, ev, ease);

    drawDiagonalEcho(fr, state, ev);
    drawVectors(fr, state, ev, still ? 0 : t, ease);
    drawCornerAnchors(fr, state, ev);
    drawCornerHUD(fr, state, ev);
  }

  // 指针与触摸统一交互：横拖旋转方向角（顺畅响应 perf.mjs 横向 touchMove），轻点角落切换锚点或对角虚应
  function localXY(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function applyClick(px, py) {
    const spot = pickSpot(px, py);
    if (!spot) return false;
    const st = getState();
    if (spot.kind === "corner") {
      if (spot.id === st.corner) return false;
      // 切换角落时保留用户探索感：如果是从错态切到另一角且未修好，自动保持相对方向偏角方便继续体验；若已进入正中则保持角度
      const fr = frameRect();
      const aspect = fr.w / fr.h;
      const oldEv = evaluate(st, aspect);
      const patch = { corner: spot.id };
      if (spot.id !== "center" && st.corner !== "center") {
        // 保持与新理想角的同样偏移，这样用户换角时不会突然自动作弊过关！
        const newIdeal = evaluate({ ...st, corner: spot.id }, aspect).idealDeg;
        const signed = ((st.angle - oldEv.idealDeg + 540) % 360) - 180;
        patch.angle = normDeg(newIdeal + signed);
      }
      onPatch(patch);
      return true;
    }
    if (spot.kind === "echo") {
      const next = st.echo === "heavy" ? "light" : st.echo === "light" ? "none" : "light";
      onPatch({ echo: next });
      return true;
    }
    return false;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触摸走原生 touch 事件以保证手机竖滑与横向旋转不冲突
    const { x, y } = localXY(e.clientX, e.clientY);
    dragging = true;
    dragMoved = false;
    dragStartX = x;
    dragStartY = y;
    dragStartAngle = getState().angle;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const { x, y } = localXY(e.clientX, e.clientY);
    if (!dragging) {
      const s = pickSpot(x, y);
      hoverTarget = s ? s.id : "";
      canvas.style.cursor = s ? "pointer" : "ew-resize";
      return;
    }
    const dx = x - dragStartX;
    const dy = y - dragStartY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;
    if (dragMoved) {
      const st = getState();
      if (st.corner === "center") {
        onPatch({ corner: "br", angle: normDeg(dragStartAngle + dx * 0.7) });
      } else {
        onPatch({ angle: normDeg(dragStartAngle + dx * 0.72) });
      }
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") return;
    if (!dragging) return;
    dragging = false;
    if (!dragMoved) {
      const { x, y } = localXY(e.clientX, e.clientY);
      applyClick(x, y);
    }
  });

  canvas.addEventListener("pointerleave", () => {
    hoverTarget = "";
    if (!dragging) canvas.style.cursor = "ew-resize";
  });

  // 触屏：横向拖旋转主箭头，纵向划动不抢页面滚屏！同时完全兼容 tools/perf.mjs 的 Input.dispatchTouchEvent
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const { x, y } = localXY(t0.clientX, t0.clientY);
    dragStartX = x;
    dragStartY = y;
    dragStartAngle = getState().angle;
    dragMoved = false;
    touchMode = null;
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches.length) return;
    const t0 = e.touches[0];
    const { x, y } = localXY(t0.clientX, t0.clientY);
    const dx = x - dragStartX;
    const dy = y - dragStartY;
    if (!touchMode && Math.hypot(dx, dy) > 4) {
      touchMode = Math.abs(dx) >= Math.abs(dy) ? "horiz" : "scroll";
    }
    if (touchMode === "horiz") {
      if (e.cancelable) e.preventDefault();
      dragMoved = true;
      const st = getState();
      const nextAngle = normDeg(dragStartAngle + dx * 0.85);
      if (st.corner === "center") {
        onPatch({ corner: "br", angle: nextAngle });
      } else {
        onPatch({ angle: nextAngle });
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!dragMoved && e.changedTouches.length) {
      const t0 = e.changedTouches[0];
      const { x, y } = localXY(t0.clientX, t0.clientY);
      applyClick(x, y);
    }
    touchMode = null;
  }, { passive: true });

  // 键盘支持（画布聚焦后左右旋转角度、上下调占比）
  canvas.addEventListener("keydown", (e) => {
    const st = getState();
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({ angle: normDeg(st.angle - 6) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({ angle: normDeg(st.angle + 6) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ mass: Math.min(0.70, +(st.mass + 0.03).toFixed(2)) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ mass: Math.max(0.10, +(st.mass - 0.03).toFixed(2)) });
    }
  });

  resize();
  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    resize();
    ctrl.draw();
  });
  ro.observe(canvas);

  return {
    getAspect() {
      return W && H ? W / H : 4 / 3;
    },
    draw() {
      dirty = true;
      // 仅在减少动态效果（rAF 已停转）时立即同步重绘；正常动画由下一帧 rAF 合并渲染，避免同帧双绘
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) ctrl.draw();
    },
  };
}
