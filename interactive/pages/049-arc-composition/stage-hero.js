// 049 弧形构图 · 开场主角玩具：「弓弦弯弧·挥弧造势台」2D Canvas
// 1:1 承袭 049 原海报淡紫雾纸、深靛收锋大弧箭头、暮湾落日孤舟与杏金视线光彗。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, computeArcGeometry, evaluateArc } from "./model.js";

const PALETTE = {
  sheet: "#EFE6F3",
  indigoDark: "#241354",
  indigoDeep: "#180B42",
  indigoMid: "#4E3889",
  lilacSoft: "#C0ACE2",
  lilacMist: "#D9CEE9",
  peachSun: "#F9BBA2",
  peachDeep: "#EE987C",
  peachBright: "#FFE2D2",
  riverCream: "#FBECE8",
  mountainBack: "#7A5FA0",
  mountainFront: "#3A2468",
  waterTop: "#7B5CA3",
  waterBot: "#40286E",
  okTeal: "#136B58",
  okMint: "#6FE3C4",
  errRose: "#B82348",
  errBright: "#FF7B98",
};

export function createHeroStage(canvas, getState, onPatch, onCometDone) {
  const ctx = canvas.getContext("2d");
  let cssW = 640;
  let cssH = 520;
  let padX = 24;
  let padY = 20;
  let boxSize = 480;
  let boxX = 80;
  let boxY = 20;

  // 视线光彗动画状态（0..1，-1 表示休眠）
  let cometProgress = -1;
  let cometStumbled = false;
  let idleTime = 0;
  let dragMode = null; // null | "bend" | "focus" | "p0" | "p1"
  let activePointerId = null;
  let pointerStart = null;
  let startBulge = 0;
  let startAngle = 0;
  let hoverTarget = null;

  let dprCur = 1;
  let layoutReady = false;
  let dirty = true;
  let introDone = false;

  // 等比映射：把归一化 [0..1, 0..1] 映射到画布内的严格正方形，确保圆弧永不压扁成椭圆！
  // 手机窄屏按 GUIDE.md 建议压在 1.5 DPR，消除软件渲染过度填充开销
  function syncLayout() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(rect.width || 600));
    cssH = Math.max(240, Math.round(rect.height || 480));
    dprCur = pixelRatio(cssW <= 500 ? 1.5 : 2);
    const targetW = Math.round(cssW * dprCur);
    const targetH = Math.round(cssH * dprCur);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dprCur, 0, 0, dprCur, 0, 0);
    padX = Math.max(14, cssW * 0.04);
    padY = Math.max(14, cssH * 0.04);
    boxSize = Math.min(cssW - padX * 2, cssH - padY * 2);
    boxX = (cssW - boxSize) * 0.5;
    boxY = (cssH - boxSize) * 0.5;
    layoutReady = true;
    dirty = true;
  }

  const toPx = (u, v) => ({ x: boxX + u * boxSize, y: boxY + v * boxSize });
  const toNorm = (x, y) => ({ u: (x - boxX) / boxSize, v: (y - boxY) / boxSize });

  // 绘制变宽收锋书法丝带路径
  function drawTaperedRibbon(pts, baseThick, tipThick, color, alpha = 1) {
    if (pts.length < 2) return;
    const leftSide = [];
    const rightSide = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const t = p.t;
      // 自然的起粗收细曲线：起步饱满，中段有力，末端轻扬收锋
      const halfW = (baseThick * (1 - t * 0.72) + tipThick * (t * 0.72)) * 0.5;
      const px = toPx(p.u, p.v);
      leftSide.push({ x: px.x + p.nx * halfW, y: px.y + p.ny * halfW });
      rightSide.push({ x: px.x - p.nx * halfW, y: px.y - p.ny * halfW });
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(leftSide[0].x, leftSide[0].y);
    for (let i = 1; i < leftSide.length; i++) ctx.lineTo(leftSide[i].x, leftSide[i].y);
    for (let i = rightSide.length - 1; i >= 0; i--) ctx.lineTo(rightSide[i].x, rightSide[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 绘制原海报同款尖锐矢量箭头
  function drawArrowHead(endPt, size, color) {
    const px = toPx(endPt.u, endPt.v);
    const ang = Math.atan2(endPt.ty, endPt.tx);
    ctx.save();
    ctx.translate(px.x, px.y);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size * 0.85, 0);
    ctx.lineTo(-size * 0.75, -size * 0.52);
    ctx.lineTo(-size * 0.36, 0);
    ctx.lineTo(-size * 0.75, size * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 场景 1：原海报·暮湾归舟（1:1 致敬 049.webp 的暮色湾岸、落日、紫山、孤舟与弯河）
  function drawBayScene(state, ev, t) {
    const { geo } = ev;
    const focusPx = toPx(state.focus.u, state.focus.v);

    // 淡紫暮雾理想画幅底衬（纯色分层极速光栅化，零软件渲染渐变开销）
    ctx.save();
    roundRectPath(boxX + 4, boxY + 4, boxSize - 8, boxSize - 8, 22);
    ctx.fillStyle = "#E7DCEF";
    ctx.fill();
    // 若跨幅局促，用极淡虚线画出原海报 84% 理想大弧轮廓作对比参照
    if (!ev.checks.c2_span) {
      ctx.strokeStyle = "rgba(74, 50, 143, 0.24)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(boxX + boxSize * 0.08, boxY + boxSize * 0.86);
      ctx.quadraticCurveTo(boxX + boxSize * 0.34, boxY + boxSize * 0.16, boxX + boxSize * 0.88, boxY + boxSize * 0.14);
      ctx.stroke();
    }
    ctx.restore();

    // 凹侧弧形湾窗裁切域（随大弧实时舒展或收紧！）
    const pts = geo.points;
    const pocketRadius = boxSize * (0.28 + state.span * 0.14);
    const clipCx = boxX + geo.cradleIdeal.u * boxSize;
    const clipCy = boxY + geo.cradleIdeal.v * boxSize;

    ctx.save();
    ctx.beginPath();
    // 沿着弧线本身 + 凹侧柔和圆弧闭合形成原海报标志性的「弯帆弧窗」
    const first = toPx(pts[0].u, pts[0].v);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = toPx(pts[i].u, pts[i].v);
      ctx.lineTo(p.x, p.y);
    }
    // 从末端向凹侧弯出回环底边
    const last = toPx(pts[pts.length - 1].u, pts[pts.length - 1].v);
    const cDepth = boxSize * clamp(Math.abs(state.bulge) * 0.44 + 0.34, 0.28, 0.62);
    const ctrl2x = last.x + geo.concaveDir.x * cDepth * 0.85;
    const ctrl2y = last.y + geo.concaveDir.y * cDepth * 0.85;
    const ctrl1x = first.x + geo.concaveDir.x * cDepth * 0.95;
    const ctrl1y = first.y + geo.concaveDir.y * cDepth * 0.95;
    ctx.bezierCurveTo(ctrl2x, ctrl2y, ctrl1x, ctrl1y, first.x, first.y);
    ctx.closePath();
    ctx.clip();

    // 暮色天空分层纯色块（贴合 049 原海报版画质感，软渲染帧率翻倍）
    ctx.fillStyle = "#8C6FA8";
    ctx.fillRect(boxX - 20, boxY - 20, boxSize + 40, boxSize + 40);
    ctx.fillStyle = "#C399AE";
    ctx.fillRect(boxX - 20, boxY + boxSize * 0.34, boxSize + 40, boxSize * 0.3);

    // 远山与暮紫海岸山脊（稳锚在弧窗中下部，不随拖拽太阳而上下剧烈跳动）
    const bayMidY = boxY + clamp(geo.cradleIdeal.v, 0.40, 0.66) * boxSize;
    const horY = clamp(bayMidY + boxSize * 0.06, boxY + boxSize * 0.48, boxY + boxSize * 0.70);
    ctx.fillStyle = "#7D62A1";
    ctx.beginPath();
    ctx.moveTo(boxX - 30, horY);
    ctx.quadraticCurveTo(boxX + boxSize * 0.25, horY - boxSize * 0.08, boxX + boxSize * 0.46, horY - boxSize * 0.01);
    ctx.quadraticCurveTo(boxX + boxSize * 0.72, horY - boxSize * 0.16, boxX + boxSize + 30, horY - boxSize * 0.04);
    ctx.lineTo(boxX + boxSize + 30, horY + 12);
    ctx.lineTo(boxX - 30, horY + 12);
    ctx.closePath();
    ctx.fill();

    // 右侧深紫陡岸山影（复刻 049 原海报右侧山峰）
    ctx.fillStyle = "#483179";
    ctx.beginPath();
    ctx.moveTo(boxX + boxSize * 0.34, horY + 4);
    ctx.quadraticCurveTo(boxX + boxSize * 0.56, horY - boxSize * 0.14, boxX + boxSize * 0.69, horY - boxSize * 0.19);
    ctx.quadraticCurveTo(boxX + boxSize * 0.84, horY - boxSize * 0.15, boxX + boxSize + 30, horY - boxSize * 0.06);
    ctx.lineTo(boxX + boxSize + 30, horY + boxSize * 0.42);
    ctx.lineTo(boxX + boxSize * 0.34, horY + boxSize * 0.42);
    ctx.closePath();
    ctx.fill();

    // 水面暮紫分层
    ctx.fillStyle = "#6F4E94";
    ctx.fillRect(boxX - 20, horY, boxSize + 40, boxSize);
    ctx.fillStyle = "#3E266B";
    ctx.fillRect(boxX - 20, horY + boxSize * 0.16, boxSize + 40, boxSize);

    // 发光弯曲落日河道（复刻原海报中下部 S 无折返顺滑光带，稳锚在湾心水域）
    const riverTopX = clamp(
      boxX + geo.cradleIdeal.u * boxSize * 0.6 + focusPx.x * 0.4,
      boxX + boxSize * 0.30,
      boxX + boxSize * 0.72,
    );
    ctx.fillStyle = "#FBD2BF";
    ctx.beginPath();
    ctx.moveTo(riverTopX - boxSize * 0.014, horY);
    ctx.quadraticCurveTo(
      riverTopX + boxSize * 0.15,
      horY + boxSize * 0.10,
      first.x + boxSize * 0.12,
      boxY + boxSize * 0.94,
    );
    ctx.lineTo(first.x - boxSize * 0.06, boxY + boxSize * 0.94);
    ctx.quadraticCurveTo(
      riverTopX + boxSize * 0.05,
      horY + boxSize * 0.11,
      riverTopX - boxSize * 0.04,
      horY,
    );
    ctx.closePath();
    ctx.fill();

    // 左下暗紫礁石剪影
    ctx.fillStyle = "#24134F";
    ctx.beginPath();
    ctx.moveTo(boxX - 20, horY + boxSize * 0.04);
    ctx.quadraticCurveTo(boxX + boxSize * 0.14, horY + boxSize * 0.05, boxX + boxSize * 0.30, horY + boxSize * 0.24);
    ctx.lineTo(boxX + boxSize * 0.22, boxY + boxSize + 20);
    ctx.lineTo(boxX - 20, boxY + boxSize + 20);
    ctx.closePath();
    ctx.fill();

    // 细微水波反光横纹
    ctx.strokeStyle = "rgba(255, 224, 204, 0.34)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const wy = horY + boxSize * (0.04 + i * 0.036);
      const ww = boxSize * (0.16 - i * 0.018);
      const drift = Math.sin(t * 1.1 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(focusPx.x - ww * 0.55 + drift, wy);
      ctx.lineTo(focusPx.x + ww * 0.45 + drift, wy);
      ctx.stroke();
    }

    ctx.restore();

    // 若没有裁进湾窗内（例如用户故意把焦点拖到了凸背外侧），也要完整画出落日孤舟以直观展示「凸背弹飞」错态！
    drawSunAndBoat(focusPx, ev, t);

    // 返回用于后续高亮参考
    return { clipCx, clipCy, pocketRadius };
  }

  function drawSunAndBoat(focusPx, ev, t) {
    const r = boxSize * 0.105;
    // 落日柔和光晕（轻量双层同心半透圆，比每帧径向渐变在软件渲染快数倍）
    ctx.fillStyle = "rgba(249, 187, 162, 0.22)";
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(249, 187, 162, 0.30)";
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r * 1.24, 0, Math.PI * 2);
    ctx.fill();

    // 杏桃落日主体
    ctx.fillStyle = "#F6B59C";
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 224, 204, 0.45)";
    ctx.beginPath();
    ctx.arc(focusPx.x - r * 0.12, focusPx.y - r * 0.22, r * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // 两只极简剪影归鸟（复刻 049 原海报落日右上飞鸟）
    ctx.strokeStyle = PALETTE.indigoDeep;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    const flap = Math.sin(t * 2.2) * 1.4;
    const birds = [
      { ox: r * 0.22, oy: -r * 0.34, s: r * 0.18 },
      { ox: r * 0.48, oy: -r * 0.18, s: r * 0.14 },
    ];
    for (const b of birds) {
      ctx.beginPath();
      ctx.moveTo(focusPx.x + b.ox - b.s, focusPx.y + b.oy + flap);
      ctx.quadraticCurveTo(focusPx.x + b.ox - b.s * 0.35, focusPx.y + b.oy - b.s * 0.55, focusPx.x + b.ox, focusPx.y + b.oy);
      ctx.quadraticCurveTo(focusPx.x + b.ox + b.s * 0.35, focusPx.y + b.oy - b.s * 0.55, focusPx.x + b.ox + b.s, focusPx.y + b.oy + flap);
      ctx.stroke();
    }

    // 落日下方深靛孤舟剪影
    const bx = focusPx.x - r * 0.38;
    const by = focusPx.y + r * 1.12;
    ctx.fillStyle = PALETTE.indigoDeep;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.32, by);
    ctx.lineTo(bx + r * 0.34, by);
    ctx.lineTo(bx + r * 0.22, by + r * 0.12);
    ctx.lineTo(bx - r * 0.22, by + r * 0.12);
    ctx.closePath();
    ctx.fill();
    // 帆
    ctx.beginPath();
    ctx.moveTo(bx, by - r * 0.02);
    ctx.lineTo(bx, by - r * 0.42);
    ctx.lineTo(bx + r * 0.22, by - r * 0.04);
    ctx.closePath();
    ctx.fill();

    // 焦点交互外环（错态时呈绯梅虚环，成立时呈柔和杏白细环）
    ctx.save();
    const isErr = ev.cradleStatus !== "cradled" || ev.isFlat;
    ctx.strokeStyle = isErr ? PALETTE.errRose : "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = hoverTarget === "focus" || dragMode === "focus" ? 2.4 : 1.5;
    if (isErr) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 场景 2：建筑·石拱长桥（沿实绘大弧排布拱石，凹侧托起桥下灯舟）
  function drawBridgeScene(state, ev, t) {
    const { geo } = ev;
    const focusPx = toPx(state.focus.u, state.focus.v);
    const waterY = boxY + boxSize * 0.64;

    // 柔和暮空背景框
    ctx.save();
    roundRectPath(boxX + 6, boxY + 6, boxSize - 12, boxSize - 12, 20);
    ctx.clip();

    ctx.fillStyle = "#E7DCF0";
    ctx.fillRect(boxX, boxY, boxSize, waterY - boxY);
    ctx.fillStyle = "#4F3682";
    ctx.fillRect(boxX, waterY, boxSize, boxSize - (waterY - boxY));

    // 远岸薄雾塔影
    ctx.fillStyle = "rgba(88, 63, 134, 0.28)";
    ctx.beginPath();
    ctx.moveTo(boxX, waterY);
    ctx.quadraticCurveTo(boxX + boxSize * 0.35, waterY - boxSize * 0.11, boxX + boxSize * 0.7, waterY - boxSize * 0.05);
    ctx.lineTo(boxX + boxSize, waterY - boxSize * 0.09);
    ctx.lineTo(boxX + boxSize, waterY);
    ctx.closePath();
    ctx.fill();

    // 沿实绘弧线绘制石拱券块（拱石切向随大弧实时转动）
    const pts = geo.points;
    if (state.continuity !== "dashed") {
      ctx.strokeStyle = "rgba(42, 25, 90, 0.24)";
      ctx.lineWidth = 1.2;
      for (let i = 3; i < pts.length - 3; i += 4) {
        const p = pts[i];
        const px = toPx(p.u, p.v);
        ctx.beginPath();
        ctx.moveTo(px.x - p.nx * 14, px.y - p.ny * 14);
        ctx.lineTo(px.x + p.nx * 14, px.y + p.ny * 14);
        ctx.stroke();
      }
    }

    // 桥下水面金色波纹
    ctx.strokeStyle = "rgba(255, 210, 186, 0.38)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const y = waterY + 14 + i * 16;
      const w = boxSize * (0.28 - i * 0.024);
      const off = Math.sin(t * 1.4 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(focusPx.x - w * 0.5 + off, y);
      ctx.lineTo(focusPx.x + w * 0.5 + off, y);
      ctx.stroke();
    }
    ctx.restore();

    // 焦点：桥下暖光灯舟
    const r = boxSize * 0.078;
    const glow = ctx.createRadialGradient(focusPx.x, focusPx.y, 4, focusPx.x, focusPx.y, r * 2.2);
    glow.addColorStop(0, "rgba(252, 196, 164, 0.85)");
    glow.addColorStop(1, "rgba(252, 196, 164, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFC9AE";
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 小船剪影
    ctx.fillStyle = PALETTE.indigoDeep;
    ctx.beginPath();
    ctx.moveTo(focusPx.x - r * 0.95, focusPx.y + r * 0.52);
    ctx.quadraticCurveTo(focusPx.x, focusPx.y + r * 0.95, focusPx.x + r * 0.95, focusPx.y + r * 0.52);
    ctx.lineTo(focusPx.x + r * 0.7, focusPx.y + r * 0.82);
    ctx.lineTo(focusPx.x - r * 0.7, focusPx.y + r * 0.82);
    ctx.closePath();
    ctx.fill();

    const isErr = ev.cradleStatus !== "cradled" || ev.isFlat;
    ctx.save();
    ctx.strokeStyle = isErr ? PALETTE.errRose : "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = hoverTarget === "focus" || dragMode === "focus" ? 2.4 : 1.4;
    if (isErr) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 场景 3：海报·流光展讯（1:1 对应 049.webp 底栏左一「海报设计」迷你标本）
  function drawPosterScene(state, ev) {
    const focusPx = toPx(state.focus.u, state.focus.v);
    const pw = boxSize * 0.82;
    const ph = boxSize * 0.94;
    const px = boxX + (boxSize - pw) * 0.5;
    const py = boxY + (boxSize - ph) * 0.5;

    ctx.save();
    roundRectPath(px, py, pw, ph, 16);
    ctx.fillStyle = "#2E1A66";
    ctx.fill();

    // 模拟海报左上排印区与左下小字区
    ctx.fillStyle = "rgba(239, 230, 243, 0.85)";
    ctx.fillRect(px + pw * 0.1, py + ph * 0.1, pw * 0.34, 9);
    ctx.fillStyle = "rgba(192, 172, 226, 0.55)";
    ctx.fillRect(px + pw * 0.1, py + ph * 0.1 + 17, pw * 0.24, 5);
    ctx.fillRect(px + pw * 0.1, py + ph * 0.1 + 27, pw * 0.29, 5);

    ctx.fillStyle = "rgba(192, 172, 226, 0.45)";
    ctx.fillRect(px + pw * 0.1, py + ph * 0.84, pw * 0.22, 4);
    ctx.fillRect(px + pw * 0.1, py + ph * 0.84 + 10, pw * 0.15, 4);
    ctx.restore();

    // 焦点：海报内的薰衣草主焦圆光
    const r = boxSize * 0.095;
    const orb = ctx.createRadialGradient(focusPx.x - r * 0.25, focusPx.y - r * 0.25, r * 0.15, focusPx.x, focusPx.y, r);
    orb.addColorStop(0, "#FCD1B8");
    orb.addColorStop(0.6, "#C5B2E6");
    orb.addColorStop(1, "#8A6FC4");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r, 0, Math.PI * 2);
    ctx.fill();

    const isErr = ev.cradleStatus !== "cradled" || ev.isFlat;
    ctx.save();
    ctx.strokeStyle = isErr ? PALETTE.errBright : "#FFC4AA";
    ctx.lineWidth = hoverTarget === "focus" || dragMode === "focus" ? 2.4 : 1.5;
    if (isErr) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(focusPx.x, focusPx.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 主绘制函数（脏值按需重绘：开场 0.9 秒进场 + 拖拽 + 光彗飞行时逐帧重绘，静置省电零空转）
  function render(t, dt, { still }) {
    if (!layoutReady) syncLayout();
    const introActive = !still && t < 0.85;
    const cometActive = !still && cometProgress >= 0;
    if (!dirty && !introActive && !cometActive && !still) {
      return;
    }
    dirty = false;
    if (!introActive) introDone = true;

    ctx.setTransform(dprCur, 0, 0, dprCur, 0, 0);
    const state = getState();
    const ev = evaluateArc(state);
    const { geo } = ev;

    if (!still) {
      idleTime = t;
      if (cometProgress >= 0) {
        const speed = ev.isKinked ? 0.42 : 0.58;
        cometProgress += dt * speed;
        if (cometProgress >= 1.15) {
          cometProgress = -1;
          cometStumbled = false;
          dirty = true;
          if (onCometDone) onCometDone();
        }
      }
    }

    // 1. 柔和原海报淡紫雾纸背景（无厚黑框）
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = PALETTE.sheet;
    ctx.fillRect(0, 0, cssW, cssH);

    // 极淡的几何构造辅弧底纹（与 049 原海报右侧虚线弧呼应）
    ctx.save();
    ctx.strokeStyle = "rgba(110, 91, 145, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(boxX + boxSize * 0.5, boxY + boxSize * 0.52, boxSize * 0.44, -Math.PI * 0.72, Math.PI * 0.45);
    ctx.stroke();
    ctx.restore();

    // 2. 绘制当前题材背景与焦点
    if (state.scene === "bay") drawBayScene(state, ev, still ? 0 : idleTime);
    else if (state.scene === "bridge") drawBridgeScene(state, ev, still ? 0 : idleTime);
    else drawPosterScene(state, ev);

    // 3. 若用户点了左侧胶囊词/右侧圆徽，高亮对应几何层
    if (state.highlightLayer) {
      drawHighlightOverlay(state, ev);
    }

    // 4. 绘制伴生韵律细弧（当 taper >= 1.35 且非折角/虚断时出现，呼应原海报内外双弧）
    const pts = geo.points;
    const isPosterDark = state.scene === "poster";
    const mainColor = isPosterDark ? "#F9BBA2" : PALETTE.indigoDark;
    const echoColor = isPosterDark ? "rgba(192, 172, 226, 0.58)" : "rgba(244, 177, 159, 0.85)";

    if (state.continuity === "taper" && ev.taperRatio >= 1.35) {
      // 外侧细杏桃伴弧（偏移至外沿，增加原海报的节奏回响）
      const echoPts = pts
        .filter((p) => p.t >= 0.08 && p.t <= 0.92)
        .map((p) => ({
          ...p,
          u: p.u - p.nx * 0.036,
          v: p.v - p.ny * 0.036,
        }));
      ctx.save();
      ctx.strokeStyle = echoColor;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      echoPts.forEach((p, i) => {
        const px = toPx(p.u, p.v);
        if (i === 0) ctx.moveTo(px.x, px.y);
        else ctx.lineTo(px.x, px.y);
      });
      ctx.stroke();
      // 末端圆点（复刻 049 原海报标题下与右上伴弧的圆点收尾！）
      const lastE = echoPts[echoPts.length - 1];
      if (lastE) {
        const ep = toPx(lastE.u, lastE.v);
        ctx.fillStyle = isPosterDark ? "#C0ACE2" : "#7E67B8";
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. 绘制核心大弧主脊
    const tipThick = Math.max(3.2, boxSize * 0.009);
    const rootThick = tipThick * clamp(state.taper, 1.0, 3.6);

    if (state.continuity === "dashed") {
      // 原海报 TIPS × 宽缺口断续虚弧
      ctx.save();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = (rootThick + tipThick) * 0.48;
      ctx.lineCap = "round";
      ctx.setLineDash([16, 22]);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const px = toPx(p.u, p.v);
        if (i === 0) ctx.moveTo(px.x, px.y);
        else ctx.lineTo(px.x, px.y);
      });
      ctx.stroke();
      ctx.restore();
    } else if (state.continuity === "kinked") {
      // 原海报 TIPS 第 4 个图示（×）生硬折角段
      drawTaperedRibbon(pts, rootThick, tipThick, mainColor, 1);
      // 标注两处硬折拐角警示圆环
      const kIdxA = Math.round((pts.length - 1) * 0.4);
      const kIdxB = Math.round((pts.length - 1) * 0.6);
      ctx.save();
      ctx.strokeStyle = PALETTE.errRose;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      for (const ki of [kIdxA, kIdxB]) {
        const kp = toPx(pts[ki].u, pts[ki].v);
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // 顺滑连贯 / 粗细韵律收锋主弧
      drawTaperedRibbon(pts, rootThick, tipThick, mainColor, 1);
      drawArrowHead(pts[pts.length - 1], Math.max(12, tipThick * 3.1), mainColor);
    }

    // 6. 可视化几何诊错标注（紧贴实绘对象，一眼看懂错在哪）
    drawDiagnostics(state, ev);

    // 7. 绘制视线光彗（播放中，或 reduced-motion 时画静态轨迹）
    if (still || cometProgress >= 0) {
      drawSightlineComet(state, ev, still ? 0.62 : cometProgress, still);
    }

    // 8. 绘制三个直接操控节点（弓脊拉弯柄 + 起止跨幅端点）
    drawHandles(state, ev);
  }

  function drawHighlightOverlay(state, ev) {
    const { geo } = ev;
    const hl = state.highlightLayer;
    ctx.save();
    if (hl === "enclose") {
      // 标出凹侧弯心包围区
      const ideal = toPx(geo.cradleIdeal.u, geo.cradleIdeal.v);
      ctx.fillStyle = "rgba(19, 107, 88, 0.14)";
      ctx.strokeStyle = PALETTE.okTeal;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(ideal.x, ideal.y, boxSize * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (hl === "sweep") {
      // 标出跨幅弦线尺
      const p0 = toPx(geo.p0.u, geo.p0.v);
      const p1 = toPx(geo.p1.u, geo.p1.v);
      ctx.strokeStyle = "#A83E24";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    } else if (hl === "direction" || hl === "flow") {
      // 沿弧线画出方向箭簇（按实绘点数比例取样，杜绝越界）
      const lastIdx = geo.points.length - 1;
      ctx.strokeStyle = "#A83E24";
      ctx.lineWidth = 2.2;
      for (const frac of [0.22, 0.5, 0.78]) {
        const pt = geo.points[Math.round(lastIdx * frac)];
        if (!pt) continue;
        const px = toPx(pt.u, pt.v);
        const ang = Math.atan2(pt.ty, pt.tx);
        ctx.save();
        ctx.translate(px.x, px.y);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-6, -5);
        ctx.lineTo(4, 0);
        ctx.lineTo(-6, 5);
        ctx.stroke();
        ctx.restore();
      }
    } else if (hl === "rhythm") {
      // 标出起止粗细剖面线（按实绘点数比例取样）
      const lastIdx = geo.points.length - 1;
      for (const frac of [0.1, 0.5, 0.9]) {
        const pt = geo.points[Math.round(lastIdx * frac)];
        if (!pt) continue;
        const px = toPx(pt.u, pt.v);
        ctx.strokeStyle = "#4B3391";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(px.x - pt.nx * 16, px.y - pt.ny * 16);
        ctx.lineTo(px.x + pt.nx * 16, px.y + pt.ny * 16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawDiagnostics(state, ev) {
    const focusPx = toPx(state.focus.u, state.focus.v);
    const nearPx = toPx(ev.nearest.u, ev.nearest.v);

    // 凸背弹飞或弧脊斩焦时，在接触点画绯梅短连线（角标与底栏提示已由零开销 HTML 叠层渲染）
    if (ev.cradleStatus === "sliced" || ev.cradleStatus === "convex") {
      ctx.save();
      ctx.strokeStyle = PALETTE.errRose;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(focusPx.x, focusPx.y);
      ctx.lineTo(nearPx.x, nearPx.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSightlineComet(state, ev, progress, isStill) {
    const pts = ev.geo.points;
    const p = clamp(progress, 0, 1);

    // 若为折角错态且过半：彗星在折角处炸出绯梅火花并偏飞！
    const stumbleAt = 0.5;
    const stumbled = ev.isKinked && p > stumbleAt;
    const effectiveP = stumbled ? stumbleAt : p;

    const idxF = effectiveP * (pts.length - 1);
    const i0 = Math.floor(idxF);
    const i1 = Math.min(pts.length - 1, i0 + 1);
    const f = idxF - i0;
    const cur = {
      u: pts[i0].u + (pts[i1].u - pts[i0].u) * f,
      v: pts[i0].v + (pts[i1].v - pts[i0].v) * f,
      nx: pts[i0].nx,
      ny: pts[i0].ny,
      tx: pts[i0].tx,
      ty: pts[i0].ty,
    };

    // 光彗贴着大弧凹侧内缘滑行
    const innerOff = 0.028;
    let cx = toPx(cur.u + cur.nx * innerOff, cur.v + cur.ny * innerOff).x;
    let cy = toPx(cur.u + cur.nx * innerOff, cur.v + cur.ny * innerOff).y;

    // 若折角撞断，彗星沿前半切线直飞出画
    if (stumbled) {
      const overshoot = (p - stumbleAt) * boxSize * 0.65;
      const pre = pts[Math.floor(pts.length * 0.42)];
      cx += pre.tx * overshoot;
      cy += pre.ty * overshoot;
    }

    // 拖尾丝带
    ctx.save();
    ctx.strokeStyle = stumbled || ev.isDashed ? "rgba(255, 123, 152, 0.72)" : "rgba(255, 196, 170, 0.85)";
    ctx.lineWidth = isStill ? 2.2 : 3.2;
    ctx.lineCap = "round";
    if (isStill) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    const startI = Math.max(0, i0 - 16);
    for (let i = startI; i <= i0; i++) {
      const pt = pts[i];
      const tp = toPx(pt.u + pt.nx * innerOff, pt.v + pt.ny * innerOff);
      if (i === startI) ctx.moveTo(tp.x, tp.y);
      else ctx.lineTo(tp.x, tp.y);
    }
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 彗星头部光珠（零渐变分配）
    ctx.fillStyle = stumbled ? "rgba(255, 123, 152, 0.35)" : "rgba(255, 196, 170, 0.38)";
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stumbled ? "#FF7B98" : "#FFC4AA";
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 折角火花
    if (stumbled && !isStill) {
      const kp = toPx(pts[Math.floor(pts.length / 2)].u, pts[Math.floor(pts.length / 2)].v);
      ctx.strokeStyle = PALETTE.errRose;
      ctx.lineWidth = 1.8;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + p * 6;
        const dist = 6 + (p - stumbleAt) * 32;
        ctx.beginPath();
        ctx.moveTo(kp.x + Math.cos(a) * 6, kp.y + Math.sin(a) * 6);
        ctx.lineTo(kp.x + Math.cos(a) * dist, kp.y + Math.sin(a) * dist);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawHandles(state, ev) {
    const { geo } = ev;
    const ap = toPx(geo.apex.u, geo.apex.v);
    const p0 = toPx(geo.p0.u, geo.p0.v);
    const p1 = toPx(geo.p1.u, geo.p1.v);

    // 弓脊主控节点（可直拖拉弯）
    drawHandleDot(ap.x, ap.y, hoverTarget === "bend" || dragMode === "bend" ? 9 : 7.5, "#FFC4AA", PALETTE.indigoDeep);
    // 端点跨幅小控点
    drawHandleDot(p0.x, p0.y, hoverTarget === "p0" || dragMode === "p0" ? 7 : 5.5, "#EFE6F3", PALETTE.indigoDeep);
    drawHandleDot(p1.x, p1.y, hoverTarget === "p1" || dragMode === "p1" ? 7 : 5.5, "#EFE6F3", PALETTE.indigoDeep);
  }

  function drawHandleDot(x, y, r, fill, stroke) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 命中检测：优先识别焦点、弧脊柄、两端点；空白区默认直接「拉弓弯弧」
  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const state = getState();
    const geo = computeArcGeometry(state);
    const focusPx = toPx(state.focus.u, state.focus.v);
    const apPx = toPx(geo.apex.u, geo.apex.v);
    const p0Px = toPx(geo.p0.u, geo.p0.v);
    const p1Px = toPx(geo.p1.u, geo.p1.v);

    if (Math.hypot(x - apPx.x, y - apPx.y) <= 24) return "bend";
    if (Math.hypot(x - focusPx.x, y - focusPx.y) <= boxSize * 0.13) return "focus";
    if (Math.hypot(x - p0Px.x, y - p0Px.y) <= 22) return "p0";
    if (Math.hypot(x - p1Px.x, y - p1Px.y) <= 22) return "p1";
    return "bend"; // 空白区横拖直接弯弧，对触屏和 perf.mjs 左右拖都极顺滑！
  }

  let dragRect = null;

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    dragRect = canvas.getBoundingClientRect();
    const x = e.clientX - dragRect.left;
    const y = e.clientY - dragRect.top;
    const state = getState();
    dragMode = hitTest(e.clientX, e.clientY);
    activePointerId = e.pointerId;
    pointerStart = { x, y, locked: e.pointerType !== "touch" || dragMode !== "bend" };
    startBulge = state.bulge;
    startAngle = state.chordAngleDeg;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    canvas.style.cursor = "grabbing";
  }

  function onPointerMove(e) {
    if (!dragMode || e.pointerId !== activePointerId) {
      if (e.pointerType === "mouse") {
        const hit = hitTest(e.clientX, e.clientY);
        if (hit !== hoverTarget) {
          hoverTarget = hit;
          canvas.style.cursor = hit === "focus" ? "move" : "grab";
          dirty = true;
        }
      }
      return;
    }

    const rect = dragRect || canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - pointerStart.x;
    const dy = y - pointerStart.y;
    // 触屏在空白区时，仅横向明显移动才锁死弯弧，纵滑交给页面滚动（GUIDE.md 触屏规矩）
    if (!pointerStart.locked) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.35) {
        dragMode = null;
        activePointerId = null;
        return;
      }
      pointerStart.locked = true;
    }
    if (e.cancelable) e.preventDefault();

    const state = getState();
    if (dragMode === "focus") {
      const n = toNorm(x, y);
      onPatch({
        focus: {
          u: clamp(n.u, 0.08, 0.92),
          v: clamp(n.v, 0.08, 0.92),
        },
      });
    } else if (dragMode === "bend") {
      // 横拖或沿弧法向拉弓：同时对横拖极其灵敏（满足手势直觉与 perf.mjs 横向拖动测试）
      const rad = (startAngle * Math.PI) / 180;
      const ux = Math.sin(rad);
      const uy = -Math.cos(rad);
      // 混合横向推拉与法向拉弓分量，保证无论拱向如何，横拖都丝滑改弯度
      const normalPull = (dx * ux + dy * uy) / (boxSize * 0.44);
      const horizPull = (dx / (boxSize * 0.55)) * (Math.abs(ux) < 0.35 ? 0.85 : 0.45);
      const nextBulge = clamp(startBulge + normalPull * 0.78 + horizPull * 0.52, -1.42, 1.42);
      // 若开场是 kinked 并且用户拖拉了较大弯度，保留模式让用户真能看到「折角变大仍旧是折角」，直到主动切顺滑或点纠偏！
      onPatch({ bulge: Number(nextBulge.toFixed(3)) });
    } else if (dragMode === "p0" || dragMode === "p1") {
      const n = toNorm(x, y);
      const geo = computeArcGeometry(state);
      const anchor = dragMode === "p0" ? geo.p1 : geo.p0;
      const vx = dragMode === "p0" ? anchor.u - n.u : n.u - anchor.u;
      const vy = dragMode === "p0" ? anchor.v - n.v : n.v - anchor.v;
      const dist = Math.hypot(vx, vy);
      const nextSpan = clamp(dist / 0.96, 0.30, 0.94);
      const nextAngle = Math.round((Math.atan2(vy, vx) * 180) / Math.PI);
      onPatch({
        span: Number(nextSpan.toFixed(2)),
        chordAngleDeg: nextAngle,
      });
    }
  }

  function onPointerUp(e) {
    if (e.pointerId !== activePointerId) return;
    dragMode = null;
    dragRect = null;
    activePointerId = null;
    canvas.style.cursor = "grab";
    dirty = true;
    if (reducedMotion.matches) runner.draw();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // 键盘操作（canvas 可获焦）
  canvas.addEventListener("keydown", (e) => {
    const state = getState();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onPatch({ bulge: Number(clamp(state.bulge + 0.08, -1.42, 1.42).toFixed(2)) });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPatch({ bulge: Number(clamp(state.bulge - 0.08, -1.42, 1.42).toFixed(2)) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPatch({ span: Number(clamp(state.span + 0.05, 0.30, 0.94).toFixed(2)) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPatch({ span: Number(clamp(state.span - 0.05, 0.30, 0.94).toFixed(2)) });
    } else if (e.key === " ") {
      e.preventDefault();
      launchComet();
    }
  });

  const runner = loop(canvas, render);
  const ro = new ResizeObserver(() => {
    syncLayout();
    runner.draw();
  });
  ro.observe(canvas);

  function launchComet() {
    dirty = true;
    if (reducedMotion.matches) {
      cometProgress = 0.65;
      runner.draw();
      return;
    }
    cometProgress = 0;
    cometStumbled = false;
  }

  return {
    markDirty: () => { dirty = true; },
    draw: () => { dirty = true; runner.draw(); },
    launchComet,
    isCometRunning: () => cometProgress >= 0,
  };
}
