// 322 一河两岸式构图 · 高性能 2D Canvas 活体江岸画卷与底部联动缩略图
// 纸纹与静态背景按尺寸缓存到离屏画布，确保 6× CPU 限速与软件渲染下拖动稳定 ≥ 50fps。
import { pixelRatio } from "../../lib/stage.js";
import { V_BOT, V_TOP, clamp, riverAt } from "./model.js";

// ---------- 离屏宣纸底纹缓存 ----------
function makePaperPattern(scene) {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const x = c.getContext("2d");
  if (scene === "city") {
    x.fillStyle = "#102331";
    x.fillRect(0, 0, 160, 160);
    x.fillStyle = "rgba(180,215,235,0.035)";
    for (let i = 0; i < 180; i++) {
      x.fillRect((i * 73) % 160, (i * 41) % 160, 2, 1);
    }
  } else if (scene === "editorial") {
    x.fillStyle = "#F5F7F8";
    x.fillRect(0, 0, 160, 160);
    x.strokeStyle = "rgba(10,77,101,0.055)";
    x.lineWidth = 1;
    for (let g = 0; g < 160; g += 20) {
      x.beginPath();
      x.moveTo(g + 0.5, 0);
      x.lineTo(g + 0.5, 160);
      x.stroke();
    }
  } else {
    // 322 原海报烟雨冷宣纸细纤维纹理
    x.fillStyle = "#E4E9EB";
    x.fillRect(0, 0, 160, 160);
    for (let i = 0; i < 240; i++) {
      const px = (i * 67 + 13) % 160;
      const py = (i * 43 + 29) % 160;
      x.fillStyle = i % 2 === 0 ? "rgba(9,75,100,0.028)" : "rgba(255,255,255,0.22)";
      x.fillRect(px, py, (i % 4) + 1, 1);
    }
  }
  return c;
}

// ---------- 绘制原海报风江南山、树、亭、舟（无五官剪影） ----------
function drawInkPeak(ctx, x, y, s, alpha, isNight) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, -56 * s, 0, 10 * s);
  if (isNight) {
    g.addColorStop(0, "#3A5F78");
    g.addColorStop(1, "#183344");
  } else {
    g.addColorStop(0, "#5B7482");
    g.addColorStop(0.55, "#7E94A0");
    g.addColorStop(1, "rgba(182,197,204,0.35)");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-46 * s, 8 * s);
  ctx.quadraticCurveTo(-24 * s, -48 * s, -8 * s, -44 * s);
  ctx.quadraticCurveTo(6 * s, -58 * s, 20 * s, -22 * s);
  ctx.quadraticCurveTo(34 * s, -28 * s, 48 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // 折带皴脊线（极简干笔韵味）
  ctx.strokeStyle = isNight ? "rgba(180,220,240,0.28)" : "rgba(18,52,66,0.38)";
  ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.beginPath();
  ctx.moveTo(-16 * s, -34 * s);
  ctx.lineTo(-4 * s, -22 * s);
  ctx.lineTo(10 * s, -26 * s);
  ctx.moveTo(4 * s, -40 * s);
  ctx.lineTo(14 * s, -14 * s);
  ctx.stroke();
  ctx.restore();
}

function drawInkTrees(ctx, x, y, s, alpha, isNight) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  // 坡岸土石
  ctx.fillStyle = isNight ? "#244354" : "#5F747D";
  ctx.beginPath();
  ctx.ellipse(0, 6 * s, 34 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const specs = [
    { dx: -14, h: 42, r: 14 },
    { dx: 4, h: 52, r: 17 },
    { dx: 19, h: 32, r: 11 },
  ];
  ctx.strokeStyle = isNight ? "#122430" : "#1C353F";
  ctx.lineCap = "round";
  for (const sp of specs) {
    ctx.lineWidth = Math.max(1.2, 2.2 * s);
    ctx.beginPath();
    ctx.moveTo(sp.dx * s, 4 * s);
    ctx.quadraticCurveTo((sp.dx - 2) * s, -sp.h * 0.5 * s, sp.dx * s, -sp.h * s);
    ctx.stroke();
    // 水墨松叶团
    ctx.fillStyle = isNight ? "#2A566B" : "#2D4C59";
    ctx.beginPath();
    ctx.ellipse(sp.dx * s, -sp.h * s, sp.r * s, sp.r * 0.58 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isNight ? "#3D7791" : "#496D7B";
    ctx.beginPath();
    ctx.ellipse((sp.dx - 4) * s, (-sp.h - 4) * s, sp.r * 0.68 * s, sp.r * 0.42 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawInkPavilion(ctx, x, y, s, alpha, isNight, highlightError = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  // 台基
  ctx.fillStyle = highlightError ? "#8A2B24" : isNight ? "#C79C5B" : "#294652";
  ctx.fillRect(-20 * s, 0, 40 * s, 6 * s);

  // 亭柱
  ctx.strokeStyle = highlightError ? "#A82D24" : isNight ? "#EED29F" : "#17313C";
  ctx.lineWidth = Math.max(1.3, 2 * s);
  for (const cx of [-13, -5, 5, 13]) {
    ctx.beginPath();
    ctx.moveTo(cx * s, 0);
    ctx.lineTo(cx * s, -19 * s);
    ctx.stroke();
  }
  // 栏杆
  ctx.beginPath();
  ctx.moveTo(-15 * s, -6 * s);
  ctx.lineTo(15 * s, -6 * s);
  ctx.stroke();

  // 双层飞檐
  ctx.fillStyle = highlightError ? "#A82D24" : isNight ? "#D9AD6A" : "#103240";
  const roof = (ry, rw, rh) => {
    ctx.beginPath();
    ctx.moveTo(-rw * s, ry * s);
    ctx.quadraticCurveTo(-rw * 0.45 * s, (ry - rh * 0.45) * s, 0, (ry - rh) * s);
    ctx.quadraticCurveTo(rw * 0.45 * s, (ry - rh * 0.45) * s, rw * s, ry * s);
    ctx.quadraticCurveTo(0, (ry - rh * 0.18) * s, -rw * s, ry * s);
    ctx.closePath();
    ctx.fill();
  };
  roof(-18, 25, 11);
  roof(-29, 17, 11);
  // 宝顶
  ctx.beginPath();
  ctx.arc(0, -42 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // 夜景暖灯
  if (isNight && !highlightError) {
    ctx.fillStyle = "rgba(255, 222, 145, 0.85)";
    ctx.beginPath();
    ctx.arc(0, -12 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 轻柔倒影（水面呼应）
  if (!highlightError) {
    ctx.globalAlpha = alpha * 0.16;
    ctx.fillStyle = isNight ? "#EBC57A" : "#175B75";
    ctx.fillRect(-16 * s, 8 * s, 32 * s, 4 * s);
    ctx.fillRect(-11 * s, 14 * s, 22 * s, 3 * s);
  }
  ctx.restore();
}

function drawInkBoat(ctx, x, y, s, alpha, isNight, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.globalAlpha = alpha;
  // 船身
  ctx.fillStyle = isNight ? "#D6B274" : "#143847";
  ctx.beginPath();
  ctx.moveTo(-24 * s, 0);
  ctx.quadraticCurveTo(0, 10 * s, 26 * s, -2 * s);
  ctx.quadraticCurveTo(6 * s, 3 * s, -24 * s, 0);
  ctx.closePath();
  ctx.fill();
  // 篷顶
  ctx.fillStyle = isNight ? "#8E6E3B" : "#3E6575";
  ctx.beginPath();
  ctx.arc(-4 * s, -1 * s, 8 * s, Math.PI, 0);
  ctx.fill();
  // 无五官蓑笠摆渡剪影（仅斗笠与披肩轮廓，绝不画五官）
  ctx.fillStyle = isNight ? "#F2D59B" : "#0D2B38";
  ctx.beginPath();
  ctx.moveTo(9 * s, -2 * s);
  ctx.lineTo(13 * s, -12 * s);
  ctx.lineTo(17 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6 * s, -12 * s);
  ctx.lineTo(13 * s, -17 * s);
  ctx.lineTo(20 * s, -12 * s);
  ctx.closePath();
  ctx.fill();
  // 轻桨与水波
  ctx.strokeStyle = isNight ? "rgba(235,210,160,0.65)" : "rgba(20,56,71,0.55)";
  ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.beginPath();
  ctx.moveTo(14 * s, -8 * s);
  ctx.lineTo(25 * s, 7 * s);
  ctx.stroke();
  ctx.restore();
}

// 现代城河夜航母题元素
function drawCityMotif(ctx, id, x, y, s, alpha, isErr = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  if (id === "peak") {
    // 玻璃摩天塔群
    const cols = [
      [-22, -46, 14],
      [-5, -58, 16],
      [14, -38, 12],
    ];
    for (const [bx, bh, bw] of cols) {
      ctx.fillStyle = "#19384D";
      ctx.fillRect(bx * s, bh * s, bw * s, -bh * s + 6 * s);
      ctx.fillStyle = "rgba(244,210,136,0.75)";
      for (let wy = bh + 6; wy < -4; wy += 8) {
        ctx.fillRect((bx + 3) * s, wy * s, (bw - 6) * s, 2.2 * s);
      }
    }
  } else if (id === "pavilion") {
    // 老城灯塔 / 暖光廊屋
    ctx.fillStyle = isErr ? "#B83B32" : "#22465D";
    ctx.fillRect(-18 * s, -26 * s, 36 * s, 30 * s);
    ctx.fillStyle = isErr ? "#FF9285" : "#F3CA7C";
    ctx.fillRect(-12 * s, -18 * s, 8 * s, 8 * s);
    ctx.fillRect(4 * s, -18 * s, 8 * s, 8 * s);
    ctx.fillStyle = isErr ? "#9E2A22" : "#D6A154";
    ctx.beginPath();
    ctx.moveTo(-22 * s, -26 * s);
    ctx.lineTo(0, -40 * s);
    ctx.lineTo(22 * s, -26 * s);
    ctx.closePath();
    ctx.fill();
  } else if (id === "trees") {
    // 滨水暖灯林荫带
    ctx.fillStyle = "#1E4B59";
    for (const dx of [-16, 0, 16]) {
      ctx.beginPath();
      ctx.arc(dx * s, -14 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#F5D085";
    for (const dx of [-10, 8]) {
      ctx.beginPath();
      ctx.arc(dx * s, -3 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === "boat") {
    // 夜航游船与灯轨
    ctx.fillStyle = "#E8C37A";
    ctx.beginPath();
    ctx.moveTo(-20 * s, 0);
    ctx.lineTo(20 * s, 0);
    ctx.lineTo(13 * s, 6 * s);
    ctx.lineTo(-14 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFF1C8";
    ctx.fillRect(-10 * s, -5 * s, 20 * s, 4 * s);
  }
  ctx.restore();
}

// 双栏画册版式母题元素
function drawEditorialMotif(ctx, id, x, y, s, alpha, isErr = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  const accent = isErr ? "#A82D24" : "#0A4D65";
  const warm = isErr ? "#F3D3CF" : "#DCCDB2";
  if (id === "peak") {
    // 大图版块
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.fillRect(-30 * s, -36 * s, 60 * s, 44 * s);
    ctx.strokeRect(-30 * s, -36 * s, 60 * s, 44 * s);
    ctx.fillStyle = "#59879A";
    ctx.fillRect(-25 * s, -31 * s, 50 * s, 28 * s);
    ctx.fillStyle = warm;
    ctx.beginPath();
    ctx.moveTo(-25 * s, -3 * s);
    ctx.lineTo(-6 * s, -22 * s);
    ctx.lineTo(12 * s, -3 * s);
    ctx.closePath();
    ctx.fill();
  } else if (id === "pavilion") {
    // 主标题 + 提要卡
    ctx.fillStyle = isErr ? "#FDF2F1" : "#FFFFFF";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-28 * s, -30 * s, 56 * s, 38 * s);
    ctx.strokeRect(-28 * s, -30 * s, 56 * s, 38 * s);
    ctx.fillStyle = accent;
    ctx.fillRect(-22 * s, -23 * s, 32 * s, 6 * s);
    ctx.fillStyle = "rgba(16,29,35,0.45)";
    ctx.fillRect(-22 * s, -12 * s, 44 * s, 3 * s);
    ctx.fillRect(-22 * s, -6 * s, 38 * s, 3 * s);
    ctx.fillRect(-22 * s, 0 * s, 28 * s, 3 * s);
  } else if (id === "trees") {
    // 正文段落栏
    ctx.fillStyle = "#0A4D65";
    ctx.fillRect(-26 * s, -24 * s, 18 * s, 4 * s);
    ctx.fillStyle = "rgba(16,29,35,0.52)";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-26 * s, (-15 + i * 7) * s, (50 - (i === 3 ? 16 : 0)) * s, 2.8 * s);
    }
  } else if (id === "boat") {
    // 旁注标签与引文小块
    ctx.fillStyle = warm;
    ctx.fillRect(-22 * s, -12 * s, 44 * s, 18 * s);
    ctx.fillStyle = "#0A4D65";
    ctx.fillRect(-16 * s, -6 * s, 24 * s, 3 * s);
    ctx.fillRect(-16 * s, 0 * s, 30 * s, 2.5 * s);
  }
  ctx.restore();
}

export function createHeroRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const patterns = new Map();
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  let bgKey = "";
  let cachedGradsKey = "";
  let sandGrad = null;
  let riverGrad = null;
  let cachedChipText = "";
  let cachedChipW = 140;
  let width = 0;
  let height = 0;
  let dpr = 1;

  function ensureSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(100, Math.round(rect.width));
    const h = Math.max(100, Math.round(rect.height));
    // 手机窄屏像素比上限 1.5（遵循 GUIDE.md 性能规矩，软件渲染减半像素量仍保持锐利）
    const r = pixelRatio(w <= 480 ? 1.5 : 2);
    if (w !== width || h !== height || r !== dpr) {
      width = w;
      height = h;
      dpr = r;
      canvas.width = Math.round(w * r);
      canvas.height = Math.round(h * r);
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      bgKey = "";
      cachedGradsKey = "";
    }
  }

  function getPattern(scene) {
    if (!patterns.has(scene)) {
      patterns.set(scene, bgCtx.createPattern(makePaperPattern(scene), "repeat"));
    }
    return patterns.get(scene);
  }

  // 静态宣纸底面 + 远山 + 柔雾 + 湖际细波缓存到离屏画布，拖动河道时 1 次 drawImage 完成
  function ensureBackdrop(state) {
    const dfBucket = Math.round(state.depthFade * 20);
    const key = `${width}x${height}@${dpr}:${state.scene}:${dfBucket}`;
    if (key === bgKey) return;
    bgKey = key;

    const W = width;
    const H = height;
    const baseUnit = Math.min(W, H) / 420;
    const isNight = state.scene === "city";
    const isEditorial = state.scene === "editorial";
    const horizonY = V_TOP * H;

    bgCtx.save();
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.fillStyle = getPattern(state.scene) || (isNight ? "#102331" : "#E4E9EB");
    bgCtx.fillRect(0, 0, W, H);

    if (isEditorial) {
      bgCtx.fillStyle = "rgba(10,77,101,0.06)";
      bgCtx.fillRect(0, 0, W, horizonY);
      bgCtx.strokeStyle = "rgba(10,77,101,0.18)";
      bgCtx.lineWidth = 1;
      bgCtx.beginPath();
      bgCtx.moveTo(W * 0.06, horizonY * 0.72);
      bgCtx.lineTo(W * 0.94, horizonY * 0.72);
      bgCtx.stroke();
      bgCtx.fillStyle = "rgba(10,77,101,0.58)";
      bgCtx.font = `600 ${Math.max(10, Math.round(11 * baseUnit))}px "IBM Plex Sans", sans-serif`;
      bgCtx.textAlign = "left";
      bgCtx.fillText("FOLIO 01 · LEFT COLUMN", W * 0.06, horizonY * 0.56);
      bgCtx.textAlign = "right";
      bgCtx.fillText("RIGHT COLUMN · FOLIO 02", W * 0.94, horizonY * 0.56);
    } else {
      const skyGrad = bgCtx.createLinearGradient(0, 0, 0, horizonY * 1.45);
      if (isNight) {
        skyGrad.addColorStop(0, "#0A1824");
        skyGrad.addColorStop(1, "#163549");
      } else {
        skyGrad.addColorStop(0, "#EAEFF1");
        skyGrad.addColorStop(1, "#D5E0E5");
      }
      bgCtx.fillStyle = skyGrad;
      bgCtx.fillRect(0, 0, W, horizonY * 1.45);

      const mistOpacity = clamp(0.45 - state.depthFade * 0.22, 0.18, 0.65);
      bgCtx.save();
      bgCtx.globalAlpha = mistOpacity;
      bgCtx.fillStyle = isNight ? "#22465D" : "#8EA1AD";
      bgCtx.beginPath();
      bgCtx.moveTo(0, horizonY * 1.25);
      bgCtx.quadraticCurveTo(W * 0.11, horizonY * 0.12, W * 0.27, horizonY * 0.92);
      bgCtx.quadraticCurveTo(W * 0.38, horizonY * 0.68, W * 0.45, horizonY * 1.15);
      bgCtx.lineTo(0, horizonY * 1.25);
      bgCtx.fill();

      bgCtx.beginPath();
      bgCtx.moveTo(W, horizonY * 1.25);
      bgCtx.quadraticCurveTo(W * 0.89, horizonY * 0.16, W * 0.72, horizonY * 0.94);
      bgCtx.quadraticCurveTo(W * 0.62, horizonY * 0.72, W * 0.55, horizonY * 1.15);
      bgCtx.lineTo(W, horizonY * 1.25);
      bgCtx.fill();
      bgCtx.restore();

      const fog = bgCtx.createLinearGradient(0, horizonY * 0.6, 0, horizonY * 1.44);
      if (isNight) {
        fog.addColorStop(0, "rgba(22,53,73,0)");
        fog.addColorStop(0.55, "rgba(38,85,112,0.45)");
        fog.addColorStop(1, "rgba(16,35,49,0)");
      } else {
        fog.addColorStop(0, "rgba(232,238,240,0)");
        fog.addColorStop(0.52, "rgba(244,248,250,0.85)");
        fog.addColorStop(1, "rgba(228,233,235,0)");
      }
      bgCtx.fillStyle = fog;
      bgCtx.fillRect(0, horizonY * 0.6, W, horizonY * 0.85);

      bgCtx.strokeStyle = isNight ? "rgba(115,205,227,0.12)" : "rgba(74,107,120,0.14)";
      bgCtx.lineWidth = 1;
      bgCtx.beginPath();
      for (let i = 0; i < 4; i++) {
        const wy = horizonY * (1.04 + i * 0.12);
        bgCtx.moveTo(W * 0.03, wy);
        bgCtx.lineTo(W * 0.34, wy);
        bgCtx.moveTo(W * 0.66, wy);
        bgCtx.lineTo(W * 0.97, wy);
      }
      bgCtx.stroke();
    }
    bgCtx.restore();
  }

  function ensureGrads(scene) {
    const gKey = `${height}:${scene}`;
    if (gKey === cachedGradsKey) return;
    cachedGradsKey = gKey;
    const H = height;
    const horizonY = V_TOP * H;
    const isNight = scene === "city";
    const isEditorial = scene === "editorial";

    sandGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    if (isNight) {
      sandGrad.addColorStop(0, "rgba(180,145,86,0.22)");
      sandGrad.addColorStop(1, "rgba(222,184,118,0.55)");
    } else if (isEditorial) {
      sandGrad.addColorStop(0, "rgba(220,205,178,0.26)");
      sandGrad.addColorStop(1, "rgba(220,205,178,0.48)");
    } else {
      sandGrad.addColorStop(0, "rgba(235,226,209,0.55)");
      sandGrad.addColorStop(0.45, "#DFD1B7");
      sandGrad.addColorStop(1, "#D5C6AA");
    }

    riverGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    if (isNight) {
      riverGrad.addColorStop(0, "#1E4C66");
      riverGrad.addColorStop(0.55, "#0B354B");
      riverGrad.addColorStop(1, "#062130");
    } else if (isEditorial) {
      riverGrad.addColorStop(0, "rgba(89,135,154,0.16)");
      riverGrad.addColorStop(1, "rgba(23,91,117,0.28)");
    } else {
      riverGrad.addColorStop(0, "#9EB6C2");
      riverGrad.addColorStop(0.18, "#4A7D92");
      riverGrad.addColorStop(0.58, "#1A5973");
      riverGrad.addColorStop(1, "#124A61");
    }
  }

  function draw(state, ev, t, { still = false, hoverSlot = null, hoverBlocker = false, dragging = false } = {}) {
    ensureSize();
    ensureBackdrop(state);
    ensureGrads(state.scene);

    const W = width;
    const H = height;
    const baseUnit = Math.min(W, H) / 420;
    const isNight = state.scene === "city";
    const isEditorial = state.scene === "editorial";

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 1. 一次 blit 铺入缓存的宣纸底面、远山与柔雾
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.scale(dpr, dpr);

    // 2. 右上角远鸟（轻柔漂移）
    if (!isNight && !isEditorial) {
      const drift = still ? 0 : Math.sin(t * 0.8) * 3;
      ctx.strokeStyle = "rgba(42,67,78,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const birds = [
        [0.84, 0.09, 5],
        [0.88, 0.075, 6],
        [0.92, 0.11, 5],
        [0.81, 0.13, 4],
        [0.77, 0.17, 3.5],
      ];
      for (const [bx, by, bs] of birds) {
        const px = bx * W + drift;
        const py = by * H + drift * 0.3;
        ctx.moveTo(px - bs, py + 1.5);
        ctx.quadraticCurveTo(px - bs * 0.4, py - 2.5, px, py + 1);
        ctx.quadraticCurveTo(px + bs * 0.4, py - 2.5, px + bs, py + 1.5);
      }
      ctx.stroke();
    }

    // 3. 暖砂洲岸 + 4. 中心河道主水体（步长减半，保持平滑同时减少光栅顶点开销）
    const samples = ev.samples;
    const drawBand = (leftFn, rightFn, fillStyle) => {
      ctx.beginPath();
      for (let i = 0; i < samples.length; i += 2) {
        const x = leftFn(samples[i]) * W;
        const y = samples[i].v * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const last = samples[samples.length - 1];
      ctx.lineTo(leftFn(last) * W, last.v * H);
      ctx.lineTo(rightFn(last) * W, last.v * H);
      for (let i = samples.length - 2; i >= 0; i -= 2) {
        ctx.lineTo(rightFn(samples[i]) * W, samples[i].v * H);
      }
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    };

    drawBand((s) => s.leftSand, (s) => s.rightSand, sandGrad);
    drawBand((s) => s.leftWater, (s) => s.rightWater, riverGrad);

    // 5. 水际双白线（合并为 2 次描边调用）
    const edgeColor = isEditorial ? "rgba(10,77,101,0.45)" : "rgba(242,246,248,0.82)";
    const innerEdgeColor = isEditorial ? "rgba(10,77,101,0.22)" : "rgba(242,246,248,0.36)";
    const strokePair = (inset, color, lw) => {
      ctx.beginPath();
      for (let i = 0; i < samples.length; i += 2) {
        const s = samples[i];
        const x = (s.leftWater + inset * s.hw) * W;
        const y = s.v * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = 0; i < samples.length; i += 2) {
        const s = samples[i];
        const x = (s.rightWater - inset * s.hw) * W;
        const y = s.v * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
    };
    strokePair(0, edgeColor, 1.8);
    strokePair(0.14, innerEdgeColor, 1.1);

    // 6. 中轴虚线水脉与原海报三白点节点（视线流动 / 中心分隔 / 开合有度）
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i].cx * W;
      const y = samples[i].v * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = still || state.centerBlocker ? 0 : -t * 22;
    ctx.strokeStyle = state.centerBlocker
      ? "rgba(255,148,136,0.75)"
      : isEditorial
        ? "rgba(10,77,101,0.52)"
        : "rgba(242,246,248,0.78)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);

    // 河尾箭头
    const tail = samples[samples.length - 1];
    const tx = tail.cx * W;
    const ty = H - 10;
    ctx.fillStyle = state.centerBlocker
      ? "#FF9488"
      : isEditorial
        ? "#0A4D65"
        : "#F2F6F8";
    ctx.beginPath();
    ctx.moveTo(tx, ty + 4);
    ctx.lineTo(tx - 5, ty - 5);
    ctx.lineTo(tx + 5, ty - 5);
    ctx.closePath();
    ctx.fill();

    // 河道三白点（复刻原海报三段呼吸点）
    const marks = [
      { p: 0.24, label: "视线流动", ok: ev.checks.flowOk && ev.checks.depthOk },
      { p: 0.54, label: "中心分隔", ok: ev.checks.channelOk },
      { p: 0.80, label: "开合有度", ok: ev.checks.flowOk },
    ];
    for (const m of marks) {
      const pt = riverAt(m.p, state);
      const mx = pt.cx * W;
      const my = pt.v * H;
      if (m.p === 0.54 && state.centerBlocker) continue;
      ctx.fillStyle = m.ok
        ? isEditorial
          ? "#0A4D65"
          : "#F5F9FA"
        : isEditorial
          ? "#A82D24"
          : "#FFD2CC";
      ctx.beginPath();
      ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
      ctx.fill();
      if (W >= 340) {
        ctx.font = `500 ${Math.max(10, Math.round(11 * baseUnit))}px "LXGW WenKai", serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = isEditorial ? "#0A4D65" : "rgba(244,249,251,0.92)";
        ctx.fillText(m.label, mx, my + 17);
      }
    }
    ctx.restore();

    // 7. 绘制左右两岸 6 处岸位景物
    for (const slot of ev.slots) {
      const sx = slot.u * W;
      const sy = slot.v * H;
      const isHover = hoverSlot && hoverSlot.side === slot.side && hoverSlot.tier === slot.tier;
      const drawScale = slot.scale * baseUnit * 0.92;

      // 槽位交互底圈（淡淡的宣纸点位，提示可直接点击替换）
      ctx.save();
      ctx.strokeStyle = isHover
        ? isNight
          ? "#F2D392"
          : "#094B64"
        : isNight
          ? "rgba(220,205,178,0.22)"
          : "rgba(9,75,100,0.20)";
      ctx.lineWidth = isHover ? 1.8 : 1;
      ctx.setLineDash(slot.motifId === "empty" ? [3, 3] : []);
      ctx.beginPath();
      ctx.ellipse(sx, sy + 6 * baseUnit, 24 * baseUnit, 8 * baseUnit, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      if (slot.motifId === "empty") {
        // 空岸极简小点与「+」提示
        ctx.save();
        ctx.fillStyle = isHover
          ? isNight
            ? "#F2D392"
            : "#094B64"
          : isNight
            ? "rgba(235,242,245,0.48)"
            : "rgba(9,75,100,0.42)";
        ctx.font = `500 ${Math.max(10, Math.round(11 * baseUnit))}px "LXGW WenKai", serif`;
        ctx.textAlign = "center";
        ctx.fillText(`+ ${slot.tierName}`, sx, sy + 9 * baseUnit);
        ctx.restore();
      } else {
        if (state.scene === "city") {
          drawCityMotif(ctx, slot.motifId, sx, sy, drawScale, slot.alpha);
        } else if (state.scene === "editorial") {
          drawEditorialMotif(ctx, slot.motifId, sx, sy, drawScale, slot.alpha);
        } else {
          if (slot.motifId === "peak") drawInkPeak(ctx, sx, sy, drawScale, slot.alpha, false);
          else if (slot.motifId === "trees") drawInkTrees(ctx, sx, sy, drawScale, slot.alpha, false);
          else if (slot.motifId === "pavilion") drawInkPavilion(ctx, sx, sy, drawScale, slot.alpha, false);
          else if (slot.motifId === "boat")
            drawInkBoat(ctx, sx, sy, drawScale, slot.alpha, false, slot.side === "left" ? 1 : -1);
        }
        if (isHover) {
          ctx.save();
          ctx.fillStyle = isNight ? "#0B2433" : "rgba(255,255,255,0.92)";
          ctx.strokeStyle = isNight ? "#F2D392" : "#094B64";
          ctx.lineWidth = 1;
          const tw = 68;
          ctx.fillRect(sx - tw / 2, sy + 14 * baseUnit, tw, 18);
          ctx.strokeRect(sx - tw / 2, sy + 14 * baseUnit, tw, 18);
          ctx.fillStyle = isNight ? "#F2D392" : "#094B64";
          ctx.font = `500 11px "LXGW WenKai", serif`;
          ctx.textAlign = "center";
          ctx.fillText(`${slot.motif.short} · 点换`, sx, sy + 14 * baseUnit + 13);
          ctx.restore();
        }
      }
    }

    // 8. 若存在河心错置堵物，绘出醒目但克制的警示虚框与可点击标签
    if (state.centerBlocker) {
      const mid = riverAt(0.5, state);
      const bx = mid.cx * W;
      const by = mid.v * H + 8 * baseUnit;
      const bs = baseUnit * 1.15;
      ctx.save();
      ctx.fillStyle = isNight ? "rgba(168,45,36,0.28)" : "rgba(168,45,36,0.14)";
      ctx.strokeStyle = hoverBlocker ? "#FF7B6B" : "#C93B30";
      ctx.lineWidth = hoverBlocker ? 2.2 : 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(bx, by - 14 * bs, 38 * bs, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      if (state.scene === "city") drawCityMotif(ctx, "pavilion", bx, by, bs, 0.98, true);
      else if (state.scene === "editorial") drawEditorialMotif(ctx, "pavilion", bx, by, bs, 0.98, true);
      else drawInkPavilion(ctx, bx, by, bs, 0.98, false, true);

      // 点击移岸提示签
      const pillW = Math.min(W * 0.44, 134);
      const pillH = 22;
      ctx.save();
      ctx.fillStyle = "#A82D24";
      ctx.beginPath();
      ctx.roundRect(bx - pillW / 2, by + 12 * bs, pillW, pillH, 11);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `500 11px "LXGW WenKai", serif`;
      ctx.textAlign = "center";
      ctx.fillText("堵心主体 · 点击移岸", bx, by + 12 * bs + 15);
      ctx.restore();
    } else {
      // 拨河手势微标（仅在水脉通畅时放在中下河心偏右，提示可横向拨河）
      const mid = riverAt(0.5, state);
      const hx = mid.cx * W;
      const hy = mid.v * H - 24 * baseUnit;
      ctx.save();
      ctx.fillStyle = dragging
        ? "#094B64"
        : isEditorial
          ? "rgba(10,77,101,0.88)"
          : "rgba(9,45,62,0.72)";
      ctx.beginPath();
      ctx.roundRect(hx - 48, hy - 11, 96, 22, 11);
      ctx.fill();
      ctx.fillStyle = "#F5F9FA";
      ctx.font = `500 11px "LXGW WenKai", serif`;
      ctx.textAlign = "center";
      ctx.fillText(dragging ? "拨水塑势中…" : "↔ 横拖拨弯河道", hx, hy + 4);
      ctx.restore();
    }

    // 9. 左上角微读数（极简透明宣纸标牌，单真源实时数据，缓存文字宽避免每帧排版量测）
    const chipText = `${ev.badge} · 曲折 ${ev.sinuosity.toFixed(2)}× · 宽幅 ${Math.round(state.riverWidth * 100)}%`;
    ctx.save();
    ctx.font = `500 11px "Space Mono", "LXGW WenKai", monospace`;
    if (chipText !== cachedChipText) {
      cachedChipText = chipText;
      cachedChipW = Math.min(W - 20, ctx.measureText(chipText).width + 20);
    }
    const cw = Math.min(W - 20, cachedChipW);
    ctx.fillStyle = isNight ? "rgba(9,36,48,0.84)" : "rgba(244,247,249,0.88)";
    ctx.strokeStyle = ev.allOk
      ? isNight
        ? "#6EE0C2"
        : "#0B5E4E"
      : isNight
        ? "#E5CCA0"
        : "rgba(10,77,101,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(10, 10, cw, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ev.allOk ? (isNight ? "#6EE0C2" : "#0B5E4E") : isNight ? "#F2F5F7" : "#0A3A4D";
    ctx.textAlign = "left";
    ctx.fillText(chipText, 20, 26);
    ctx.restore();

    ctx.restore();
  }

  // 坐标命中检测：判断点击了堵心阁、6 处岸位之一还是河道
  function hitTest(clientX, clientY, state, ev) {
    const rect = canvas.getBoundingClientRect();
    const u = (clientX - rect.left) / Math.max(1, rect.width);
    const v = (clientY - rect.top) / Math.max(1, rect.height);
    if (state.centerBlocker) {
      const mid = riverAt(0.5, state);
      if (Math.hypot(u - mid.cx, v - mid.v) < 0.13) {
        return { kind: "blocker" };
      }
    }
    let best = null;
    for (const s of ev.slots) {
      const d = Math.hypot((u - s.u) * 1.0, (v - s.v) * 1.15);
      if (d < 0.115 && (!best || d < best.d)) best = { kind: "slot", slot: s, d };
    }
    if (best) return best;
    return { kind: "river", u, v };
  }

  return { draw, hitTest };
}

// ---------- 底部右侧联动矢量缩略图（1:1 呼应 322 原海报右下角示意图） ----------
export function renderMiniSchematic(svg, state, ev) {
  if (!svg) return;
  const W = 180;
  const H = 104;
  const samples = ev.samples;

  const mapY = (v) => ((v - V_TOP) / (V_BOT - V_TOP)) * (H - 8) + 4;
  let dRiver = "";
  for (let i = 0; i < samples.length; i += 2) {
    const x = samples[i].leftWater * W;
    const y = mapY(samples[i].v);
    dRiver += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  for (let i = samples.length - 1; i >= 0; i -= 2) {
    dRiver += `L${(samples[i].rightWater * W).toFixed(1)},${mapY(samples[i].v).toFixed(1)}`;
  }
  dRiver += "Z";

  let dCenter = "";
  for (let i = 0; i < samples.length; i += 3) {
    const x = samples[i].cx * W;
    const y = mapY(samples[i].v);
    dCenter += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }

  const circles = ev.slots
    .map((s) => {
      const cx = s.u * W;
      const cy = mapY(s.v);
      if (s.motifId === "empty") {
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="none" stroke="#9AA9B1" stroke-dasharray="2 2" stroke-width="1"/>`;
      }
      const r = clamp(4 + s.weight * 4.2, 4.5, 11.5);
      const fill = ev.isMirrorClone ? "#C25B4A" : "#C9B08B";
      const op = clamp(0.35 + s.alpha * 0.65, 0.35, 1);
      // 呼应小箭（指向或背向河道）
      const arrowStart = s.side === "left" ? cx + r + 3 : cx - r - 3;
      const arrowEnd = s.side === "left" ? Math.min(cx + r + 15, W * 0.42) : Math.max(cx - r - 15, W * 0.58);
      const arrow =
        Math.abs(arrowEnd - arrowStart) > 5
          ? `<line x1="${arrowStart.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${arrowEnd.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#0A4D65" stroke-width="1" stroke-dasharray="${s.tier === 1 ? "" : "2 2"}"/>`
          : "";
      return `${arrow}<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" fill-opacity="${op.toFixed(2)}" stroke="#8F7346" stroke-width="0.8"/>`;
    })
    .join("");

  const blocker = state.centerBlocker
    ? `<rect x="${(W * 0.5 - 8).toFixed(1)}" y="${(H * 0.5 - 8).toFixed(1)}" width="16" height="16" rx="2" fill="#A82D24" stroke="#FFF" stroke-width="1.2"/>`
    : "";

  svg.innerHTML = `
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="3" fill="#EEF2F4" stroke="#0A4D65" stroke-width="1"/>
    <path d="${dRiver}" fill="#175B75"/>
    <path d="${dCenter}" fill="none" stroke="#EAF2F5" stroke-width="1.2" stroke-dasharray="3 3"/>
    ${circles}
    ${blocker}
  `;
}
