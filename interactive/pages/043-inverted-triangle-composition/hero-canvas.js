// 043 倒三角构图 · 开场「冰山吃水漏斗 · V翼收束与落点托衡台」2D 画布
// 离屏缓存四套主题实景底图，确保拖动时每帧只做一次裁切合成 + 清晰矢量叠层，低端机与软渲染均可稳跑 60fps。

import { STAGE_W, STAGE_H, TOP_Y, BOTTOM_Y, APERTURE_H, clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const BG_DARK = "#10171A";
const CYAN = "#6ECDF0";
const CYAN_BRIGHT = "#8CE4FF";
const CYAN_DIM = "rgba(110, 205, 240, 0.34)";
const CORAL = "#FF7B66";
const MINT = "#5EE6B8";

// 为 4 个原海报应用场景分别离屏预绘高质感全幅底图（horizonNorm 变化时只重绘该场景缓存）
function renderSceneBuffer(scene, horizonNorm) {
  const buf = document.createElement("canvas");
  buf.width = STAGE_W;
  buf.height = STAGE_H;
  const g = buf.getContext("2d");
  const hy = horizonNorm * STAGE_H;

  if (scene === "iceberg") {
    // 1:1 致敬 043 原海报极地冰山：上方风暴银灰天幕 + 阳光冰峰 + 水线倒影 + 深渊翡翠冰基
    const sky = g.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#4E6173");
    sky.addColorStop(0.45, "#748697");
    sky.addColorStop(0.88, "#A5B5C2");
    sky.addColorStop(1, "#C3D0DA");
    g.fillStyle = sky;
    g.fillRect(0, 0, STAGE_W, hy);

    // 柔和极地云层带
    const clouds = [
      [250, hy - 140, 240, 44, "rgba(215,227,236,0.28)"],
      [730, hy - 125, 250, 48, "rgba(204,218,230,0.26)"],
      [480, hy - 190, 310, 52, "rgba(63,82,99,0.25)"],
      [180, hy - 65, 190, 30, "rgba(229,237,242,0.34)"],
      [810, hy - 70, 210, 32, "rgba(220,231,238,0.30)"],
    ];
    for (const [cx, cy, rx, ry, col] of clouds) {
      const rg = g.createRadialGradient(cx, cy, 6, cx, cy, rx);
      rg.addColorStop(0, col);
      rg.addColorStop(1, "rgba(116,134,151,0)");
      g.fillStyle = rg;
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }

    // 远景冰礁薄雾线
    g.fillStyle = "rgba(182, 200, 214, 0.45)";
    g.beginPath();
    g.moveTo(0, hy);
    g.lineTo(140, hy - 10);
    g.lineTo(290, hy - 4);
    g.lineTo(740, hy - 14);
    g.lineTo(860, hy - 6);
    g.lineTo(STAGE_W, hy);
    g.closePath();
    g.fill();

    // 水上冰山主峰（多折面晶锐雕刻，左侧受光雪白，右侧冷蓝背光）
    const peakTop = hy - 156;
    const drawPoly = (pts, fill) => {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.fill();
    };
    // 主峰整体轮廓底影
    drawPoly([
      [272, hy], [332, hy - 48], [380, hy - 76], [428, hy - 118],
      [482, hy - 138], [520, peakTop], [566, hy - 116], [608, hy - 72],
      [664, hy - 58], [728, hy - 8], [735, hy],
    ], "#8BA7BC");
    // 受光左侧雪脊
    drawPoly([
      [285, hy], [336, hy - 46], [386, hy - 72], [434, hy - 114],
      [486, hy - 134], [520, peakTop], [504, hy - 62], [452, hy],
    ], "#EDF4F8");
    // 中央高亮主峰脊面
    drawPoly([
      [446, hy], [486, hy - 134], [520, peakTop], [534, hy - 74], [512, hy],
    ], "#DCEAF3");
    // 右侧冰蓝阴影折面
    drawPoly([
      [520, peakTop], [566, hy - 116], [608, hy - 72], [584, hy - 22], [512, hy], [534, hy - 74],
    ], "#5B819C");
    // 右肩小副峰受光 + 背光
    drawPoly([
      [582, hy], [608, hy - 72], [658, hy - 56], [646, hy],
    ], "#C5DAE8");
    drawPoly([
      [658, hy - 56], [716, hy - 16], [728, hy], [646, hy],
    ], "#4A6E87");
    // 左前碎冰棱面阴影
    drawPoly([
      [350, hy], [384, hy - 68], [418, hy - 46], [434, hy],
    ], "#99B5C9");
    drawPoly([
      [476, hy], [494, hy - 76], [514, hy - 54], [512, hy],
    ], "#7095B0");

    // 水下深海渐变（采自原海报 #113B4F → #032738 → #04131D）
    const sea = g.createLinearGradient(0, hy, 0, STAGE_H);
    sea.addColorStop(0, "#17485E");
    sea.addColorStop(0.28, "#0C2E40");
    sea.addColorStop(0.68, "#051925");
    sea.addColorStop(1, "#030E16");
    g.fillStyle = sea;
    g.fillRect(0, hy, STAGE_W, STAGE_H - hy);

    // 水下光柱散射（由水面斜向深渊收束）
    const rays = g.createLinearGradient(500, hy, 500, STAGE_H);
    rays.addColorStop(0, "rgba(110, 205, 240, 0.24)");
    rays.addColorStop(0.65, "rgba(25, 92, 122, 0.08)");
    rays.addColorStop(1, "rgba(3, 14, 22, 0)");
    g.fillStyle = rays;
    g.beginPath();
    g.moveTo(270, hy);
    g.lineTo(730, hy);
    g.lineTo(545, BOTTOM_Y * STAGE_H);
    g.lineTo(455, BOTTOM_Y * STAGE_H);
    g.closePath();
    g.fill();

    // 水下巨型冰基（倒锥形深海冰体，层次锐利）
    const keelBottom = Math.min(STAGE_H - 36, hy + 305);
    drawPoly([
      [276, hy], [726, hy], [684, hy + 88], [622, hy + 168],
      [564, hy + 242], [500, keelBottom], [442, hy + 236],
      [378, hy + 158], [318, hy + 76],
    ], "#062130");
    // 水下冰体受光青蓝折面
    drawPoly([
      [365, hy], [506, hy], [492, hy + 120], [500, keelBottom],
      [448, hy + 216], [412, hy + 128],
    ], "#134760");
    drawPoly([
      [430, hy], [524, hy], [510, hy + 96], [468, hy + 178], [446, hy + 94],
    ], "#236884");
    drawPoly([
      [524, hy], [612, hy], [578, hy + 124], [526, hy + 218], [500, keelBottom], [510, hy + 96],
    ], "#0A2D40");
    // 水下冷青冰脉反光
    drawPoly([
      [458, hy + 14], [494, hy + 12], [486, hy + 94], [468, hy + 132],
    ], "rgba(126, 210, 238, 0.34)");
    drawPoly([
      [528, hy + 22], [562, hy + 18], [546, hy + 102], [522, hy + 84],
    ], "rgba(77, 158, 189, 0.24)");

    // 锐利波光海平线
    const wl = g.createLinearGradient(0, hy - 4, 0, hy + 14);
    wl.addColorStop(0, "rgba(218, 240, 250, 0.85)");
    wl.addColorStop(0.32, "rgba(110, 205, 240, 0.55)");
    wl.addColorStop(1, "rgba(12, 46, 64, 0)");
    g.fillStyle = wl;
    g.fillRect(0, hy - 3, STAGE_W, 18);
    g.strokeStyle = "rgba(232, 247, 255, 0.62)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, hy);
    g.lineTo(STAGE_W, hy);
    g.stroke();

  } else if (scene === "stage") {
    // 戏剧舞台：宽阔黑曜天幕 + 顶部灯光桁架 + 双束向下收束的冰青追光 + 立于足尖的无五官舞者剪影
    const bg = g.createLinearGradient(0, 0, 0, STAGE_H);
    bg.addColorStop(0, "#1B2A35");
    bg.addColorStop(0.42, "#121D24");
    bg.addColorStop(1, "#070D11");
    g.fillStyle = bg;
    g.fillRect(0, 0, STAGE_W, STAGE_H);

    // 顶部桁架与聚光灯阵列（烘托上方宽阔空间）
    g.strokeStyle = "rgba(110, 205, 240, 0.22)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(110, hy - 140);
    g.lineTo(890, hy - 140);
    g.moveTo(110, hy - 122);
    g.lineTo(890, hy - 122);
    g.stroke();
    for (let x = 160; x <= 840; x += 68) {
      g.fillStyle = "rgba(162, 224, 248, 0.48)";
      g.fillRect(x - 10, hy - 122, 20, 8);
    }

    // 宽口向下收拢的冷青体积光锥
    const cone = g.createLinearGradient(500, hy - 120, 500, BOTTOM_Y * STAGE_H);
    cone.addColorStop(0, "rgba(148, 224, 250, 0.36)");
    cone.addColorStop(0.45, "rgba(92, 186, 222, 0.16)");
    cone.addColorStop(1, "rgba(110, 205, 240, 0.32)");
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(180, hy - 120);
    g.lineTo(820, hy - 120);
    g.lineTo(548, BOTTOM_Y * STAGE_H);
    g.lineTo(452, BOTTOM_Y * STAGE_H);
    g.closePath();
    g.fill();

    // 剧场幕布垂褶光影
    g.strokeStyle = "rgba(180, 232, 250, 0.08)";
    g.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(500 + i * 95, hy - 120);
      g.lineTo(500 + i * 16, BOTTOM_Y * STAGE_H);
      g.stroke();
    }

    // 舞台地平线
    g.strokeStyle = "rgba(110, 205, 240, 0.35)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, hy + 88);
    g.lineTo(STAGE_W, hy + 88);
    g.stroke();

    // 无五官芭蕾独舞剪影（双臂舒展成上宽 V 字，足尖立于正下方）
    const figY = hy + 26;
    g.fillStyle = "#DCEEF6";
    // 头部剪影（纯圆，绝不画五官）
    g.beginPath();
    g.arc(500, figY - 98, 16, 0, Math.PI * 2);
    g.fill();
    // 舒展双臂呈倒三角上翼
    g.strokeStyle = "#DCEEF6";
    g.lineWidth = 9;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(500, figY - 72);
    g.quadraticCurveTo(445, figY - 95, 396, figY - 122);
    g.moveTo(500, figY - 72);
    g.quadraticCurveTo(555, figY - 95, 604, figY - 122);
    g.stroke();
    // 舞裙与纤长躯干（向下收尖至足尖）
    g.beginPath();
    g.moveTo(486, figY - 78);
    g.lineTo(514, figY - 78);
    g.lineTo(510, figY - 28);
    g.lineTo(556, figY - 10);
    g.lineTo(444, figY - 10);
    g.lineTo(490, figY - 28);
    g.closePath();
    g.fill();
    // 支立足尖长腿
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(498, figY - 12);
    g.lineTo(500, figY + 116);
    g.moveTo(506, figY - 12);
    g.quadraticCurveTo(534, figY + 26, 514, figY + 62);
    g.stroke();

  } else if (scene === "diving") {
    // 运动瞬间：高台跳水（开阔场馆天光 + 上方悬挑跳台 + 高速下坠气幕 + 无五官垂直入水剪影）
    const sky = g.createLinearGradient(0, 0, 0, hy + 135);
    sky.addColorStop(0, "#46637A");
    sky.addColorStop(0.55, "#6D8FA8");
    sky.addColorStop(1, "#A8C6DA");
    g.fillStyle = sky;
    g.fillRect(0, 0, STAGE_W, hy + 135);

    // 泳池深蓝水面
    const pool = g.createLinearGradient(0, hy + 135, 0, STAGE_H);
    pool.addColorStop(0, "#10465E");
    pool.addColorStop(0.5, "#072636");
    pool.addColorStop(1, "#04131C");
    g.fillStyle = pool;
    g.fillRect(0, hy + 135, STAGE_W, STAGE_H - (hy + 135));

    // 上方左右对称跳台挑檐与高空弧顶，形成广阔上方空间
    g.fillStyle = "#1E303D";
    g.fillRect(90, hy - 122, 230, 14);
    g.fillRect(680, hy - 122, 230, 14);
    g.strokeStyle = "rgba(230, 245, 255, 0.35)";
    g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(160 + i * 136, hy - 165);
      g.lineTo(500 + (i - 2.5) * 24, hy + 145);
      g.stroke();
    }

    // 向下俯冲速度气流线（增强倒三角动势）
    const wake = g.createLinearGradient(500, hy - 110, 500, hy + 140);
    wake.addColorStop(0, "rgba(224, 244, 255, 0.04)");
    wake.addColorStop(0.65, "rgba(130, 224, 255, 0.28)");
    wake.addColorStop(1, "rgba(130, 224, 255, 0.55)");
    g.fillStyle = wake;
    g.beginPath();
    g.moveTo(350, hy - 110);
    g.lineTo(650, hy - 110);
    g.lineTo(524, hy + 138);
    g.lineTo(476, hy + 138);
    g.closePath();
    g.fill();

    // 无五官跳水运动员笔直入水剪影（头朝下双臂伸直如利箭）
    const dy = hy + 38;
    g.fillStyle = "#0F1C24";
    // 双腿并拢向上
    g.beginPath();
    g.moveTo(490, dy - 108);
    g.lineTo(510, dy - 108);
    g.lineTo(514, dy - 26);
    g.lineTo(486, dy - 26);
    g.closePath();
    g.fill();
    // 躯干与伸直双臂向下收成锋利尖点
    g.beginPath();
    g.moveTo(484, dy - 26);
    g.lineTo(516, dy - 26);
    g.lineTo(508, dy + 44);
    g.lineTo(500, dy + 92);
    g.lineTo(492, dy + 44);
    g.closePath();
    g.fill();
    // 头部纯圆剪影（无五官）
    g.beginPath();
    g.arc(500, dy + 28, 12, 0, Math.PI * 2);
    g.fill();

    // 池面高光线与水花圆弧
    g.strokeStyle = "rgba(170, 232, 255, 0.78)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, hy + 135);
    g.lineTo(STAGE_W, hy + 135);
    g.stroke();

  } else {
    // 产品展示：顶光柔幕 + 暗岩双斜翼阴影 + 晶面香氛瓶与底端高光倒影
    const topGlow = g.createRadialGradient(500, hy - 95, 24, 500, hy - 70, 420);
    topGlow.addColorStop(0, "#D3E8F2");
    topGlow.addColorStop(0.45, "#6F93AA");
    topGlow.addColorStop(0.85, "#233B4B");
    topGlow.addColorStop(1, "#0F1D26");
    g.fillStyle = topGlow;
    g.fillRect(0, 0, STAGE_W, hy + 55);

    const floor = g.createLinearGradient(0, hy + 55, 0, STAGE_H);
    floor.addColorStop(0, "#102330");
    floor.addColorStop(0.5, "#08151E");
    floor.addColorStop(1, "#040A0E");
    g.fillStyle = floor;
    g.fillRect(0, hy + 55, STAGE_W, STAGE_H - (hy + 55));

    // 台面水平反射线
    g.strokeStyle = "rgba(148, 224, 250, 0.45)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, hy + 55);
    g.lineTo(STAGE_W, hy + 55);
    g.stroke();

    // 棱面水晶香氛瓶（宽肩倒梯轮廓，呼应倒三角母题）
    const by = hy + 54;
    // 顶部黑曜石瓶盖
    g.fillStyle = "#16232C";
    g.fillRect(468, by - 166, 64, 34);
    g.fillStyle = "#6ECDF0";
    g.fillRect(474, by - 132, 52, 6);
    // 宽肩倒梯形晶透瓶身
    const glass = g.createLinearGradient(418, by - 124, 582, by);
    glass.addColorStop(0, "rgba(220, 244, 255, 0.92)");
    glass.addColorStop(0.42, "rgba(130, 206, 236, 0.72)");
    glass.addColorStop(0.75, "rgba(42, 108, 138, 0.85)");
    glass.addColorStop(1, "rgba(16, 48, 66, 0.95)");
    g.fillStyle = glass;
    g.beginPath();
    g.moveTo(418, by - 124);
    g.lineTo(582, by - 124);
    g.lineTo(548, by);
    g.lineTo(452, by);
    g.closePath();
    g.fill();
    // 瓶身折面高光与铭牌
    g.fillStyle = "rgba(255, 255, 255, 0.46)";
    g.beginPath();
    g.moveTo(432, by - 116);
    g.lineTo(466, by - 116);
    g.lineTo(476, by - 10);
    g.lineTo(458, by - 10);
    g.closePath();
    g.fill();
    g.fillStyle = "#0F1A22";
    g.fillRect(462, by - 88, 76, 36);
    g.fillStyle = "#DCEEF6";
    g.font = '600 13px "Manrope", sans-serif';
    g.textAlign = "center";
    g.fillText("GLACIER", 500, by - 66);

    // 镜面台下方的深渊倒影（向下收尖至底端光点）
    const refl = g.createLinearGradient(500, by, 500, BOTTOM_Y * STAGE_H);
    refl.addColorStop(0, "rgba(110, 205, 240, 0.42)");
    refl.addColorStop(0.65, "rgba(38, 102, 132, 0.16)");
    refl.addColorStop(1, "rgba(110, 205, 240, 0.04)");
    g.fillStyle = refl;
    g.beginPath();
    g.moveTo(452, by + 2);
    g.lineTo(548, by + 2);
    g.lineTo(506, BOTTOM_Y * STAGE_H);
    g.lineTo(494, BOTTOM_Y * STAGE_H);
    g.closePath();
    g.fill();
  }

  return buf;
}

export function createHeroStage(canvas, { getState, onChange, onSelectZone }) {
  const ctx = canvas.getContext("2d");
  let cachedKey = "";
  let cachedBuf = null;
  let activeDrag = null; // null | 'open' | 'tl' | 'tr' | 'apex' | 'horizon'
  let dragStart = null;
  let hoverHandle = null;
  let lastSizeKey = "";

  function ensureSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(300, Math.round(rect.width * dpr));
    const h = Math.max(220, Math.round(rect.height * dpr));
    const key = `${w}x${h}`;
    if (key !== lastSizeKey) {
      canvas.width = w;
      canvas.height = h;
      lastSizeKey = key;
    }
    return { w, h };
  }

  function getSceneBuffer(scene, horizonY) {
    const qH = Math.round(horizonY * 200) / 200;
    const key = `${scene}:${qH}`;
    if (key !== cachedKey || !cachedBuf) {
      cachedBuf = renderSceneBuffer(scene, qH);
      cachedKey = key;
    }
    return cachedBuf;
  }

  function getViewportTransform(w, h) {
    // 严格等比缩放（sx === sy），绝不把圆拉成椭圆；多余高/宽无缝填满深渊底色
    const scale = Math.min(w / STAGE_W, h / STAGE_H);
    const ox = (w - STAGE_W * scale) / 2;
    const oy = (h - STAGE_H * scale) / 2;
    return { scale, ox, oy };
  }

  function clientToNorm(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / STAGE_W, rect.height / STAGE_H);
    const ox = (rect.width - STAGE_W * scale) / 2;
    const oy = (rect.height - STAGE_H * scale) / 2;
    return {
      x: (e.clientX - rect.left - ox) / Math.max(1, STAGE_W * scale),
      y: (e.clientY - rect.top - oy) / Math.max(1, STAGE_H * scale),
    };
  }

  function hitTest(nx, ny, ev) {
    const { tl, tr, bl, br } = ev.pts;
    const apex = { x: (bl.x + br.x) / 2, y: BOTTOM_Y };
    const dist = (a, b) => Math.hypot((a.x - b.x) * STAGE_W, (a.y - b.y) * STAGE_H);
    const p = { x: nx, y: ny };
    const r = 46;
    if (dist(p, apex) < r) return "apex";
    if (dist(p, tl) < r) return "tl";
    if (dist(p, tr) < r) return "tr";
    const hy = ev.state.horizonY;
    if (Math.abs((ny - hy) * STAGE_H) < 22 && nx > Math.min(tl.x, bl.x) + 0.04 && nx < Math.max(tr.x, br.x) - 0.04) {
      return "horizon";
    }
    return "open";
  }

  // 主绘制函数（由 lib/stage.js 的 loop() 驱动；still=true 时跳过开场展开直接画稳态）
  function draw(t, ev, { still = false } = {}) {
    const { w, h } = ensureSize();
    const dpr = pixelRatio(2);
    const { scale, ox, oy } = getViewportTransform(w, h);
    const cssScale = scale / dpr;

    // 透明清空画布，让冰山倒三角无缝浮在 .hero 深渊黑曜渐变上（零硬边方盒感，1:1 呼应原海报）
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    // 开场前 0.55 秒细腻水纹唤醒，但绝不自动改答案（画面始终真实反映当前几何状态）
    const intro = still ? 1 : clamp(t / 0.55, 0, 1);
    const ease = 1 - Math.pow(1 - intro, 3);

    const { tl, tr, bl, br } = ev.px;
    const apexPx = { x: (bl.x + br.x) / 2, y: BOTTOM_Y * STAGE_H };
    const isFault = !ev.ok;
    const accent = ev.ok ? CYAN : ev.faultId === "off_axis_tip" || ev.faultId === "inverted_flip" ? CORAL : CYAN;
    const guideStroke = ev.ok ? CYAN_BRIGHT : isFault ? "rgba(255, 138, 118, 0.85)" : CYAN;

    // 2. 底部水面同心涟漪（致敬 043 原海报底部水纹；偏心倾覆时涟漪歪斜警示！）
    const rippleCount = 5;
    const ripplePhase = still ? 0.35 : (t * 0.42) % 1;
    const tiltShift = ev.metrics.absPlumb > 10 ? Math.sign(ev.metrics.plumbOffsetPct) * 26 : 0;
    const anchorIntensity =
      ev.state.anchorLevel === "off" ? 0.14 :
      ev.state.anchorLevel === "soft" ? 0.42 :
      ev.state.anchorLevel === "glare" ? 0.95 : 0.72;

    for (let i = 0; i < rippleCount; i++) {
      const p = (i + ripplePhase) / rippleCount;
      const rx = 28 + p * 170;
      const ry = 6 + p * 27;
      const alpha = (1 - p) * anchorIntensity * 0.46 * ease;
      ctx.strokeStyle = ev.metrics.absPlumb > 10
        ? `rgba(255, 123, 102, ${alpha.toFixed(3)})`
        : `rgba(110, 205, 240, ${alpha.toFixed(3)})`;
      ctx.lineWidth = i === 0 ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.ellipse(apexPx.x + tiltShift * p, apexPx.y + 16 + p * 8, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. 裁切并绘制实景内容于当前多边形取景窗内
    const buf = getSceneBuffer(ev.state.scene, ev.state.horizonY);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(buf, 0, 0, STAGE_W, STAGE_H);

    // 若顶部留白不足（压顶窒息），在上沿绘制警示斜纹条
    if (ev.metrics.headroomPct < 13 && ev.state.showGuides) {
      ctx.fillStyle = "rgba(255, 123, 102, 0.22)";
      ctx.fillRect(tl.x, tl.y, tr.x - tl.x, 30);
    }

    // 吃水线微细标尺（悬浮或拖动时高亮）
    if (ev.state.showGuides) {
      const hy = ev.state.horizonY * STAGE_H;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = hoverHandle === "horizon" || activeDrag === "horizon"
        ? CYAN_BRIGHT
        : "rgba(220, 244, 255, 0.34)";
      ctx.lineWidth = hoverHandle === "horizon" || activeDrag === "horizon" ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(STAGE_W, hy);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 4. 取景窗外缘冷青细线与原海报同款「双向外延虚线箭头」
    ctx.save();
    // 顶部横线
    ctx.strokeStyle = "rgba(180, 224, 242, 0.42)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.stroke();

    // 若底口未收尖，标示底口敞开警示红虚线
    if (ev.state.bottomMouth > 0.055) {
      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = CORAL;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(bl.x, bl.y);
      ctx.lineTo(br.x, br.y);
      ctx.stroke();
      ctx.restore();
    }

    // 左右斜边外延虚线 + 顶角外指双箭头（1:1 复刻 043 原海报核心视觉母题！）
    const drawRayWing = (topPt, botPt) => {
      const dx = topPt.x - botPt.x;
      const dy = topPt.y - botPt.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const ext = 38 * ease;
      const tipX = topPt.x + ux * ext;
      const tipY = topPt.y + uy * ext;

      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = ev.ok ? CYAN_BRIGHT : guideStroke;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(botPt.x, botPt.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.restore();

      // 顶角箭簇
      const headLen = 13;
      const ang = Math.atan2(uy, ux);
      ctx.strokeStyle = ev.ok ? CYAN_BRIGHT : guideStroke;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(tipX - headLen * Math.cos(ang - 0.55), tipY - headLen * Math.sin(ang - 0.55));
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(tipX - headLen * Math.cos(ang + 0.55), tipY - headLen * Math.sin(ang + 0.55));
      ctx.stroke();
    };
    drawRayWing(tl, bl);
    drawRayWing(tr, br);
    ctx.restore();

    // 4.5 实时视线收束流光（沿左右内壁下落，直观演示收束、散底、反转外溢与漏底四种视觉力学）
    if (ev.state.showGuides) {
      const flowColor = ev.ok
        ? "rgba(140, 228, 255, 0.85)"
        : ev.state.bottomMouth > 0.055 || ev.metrics.convergeDeg < -4 || ev.state.anchorLevel === "off"
          ? "rgba(255, 138, 118, 0.82)"
          : "rgba(110, 205, 240, 0.72)";
      const phases = still ? [0.28, 0.64] : [0, 0.33, 0.66].map((o) => (t * 0.44 + o) % 1);

      const drawWallFlow = (topPt, botPt, sideSign) => {
        const dx = botPt.x - topPt.x;
        const dy = botPt.y - topPt.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;
        // 向内偏 14px 贴壁滑行
        const inX = -sideSign * 14;

        ctx.strokeStyle = flowColor;
        ctx.fillStyle = flowColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        for (const p of phases) {
          const tPos = 0.10 + p * 0.82;
          const x = topPt.x + dx * tPos + inX * (1 - tPos * 0.55);
          const y = topPt.y + dy * tPos;
          const alpha = Math.sin(p * Math.PI) * 0.88 * ease;
          ctx.globalAlpha = clamp(alpha, 0.18, 0.92);
          ctx.beginPath();
          ctx.moveTo(x - ux * 16, y - uy * 16);
          ctx.lineTo(x, y);
          ctx.stroke();

          // 极简方向尖簇
          const ang = Math.atan2(uy, ux);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 7 * Math.cos(ang - 0.52), y - 7 * Math.sin(ang - 0.52));
          ctx.lineTo(x - 7 * Math.cos(ang + 0.52), y - 7 * Math.sin(ang + 0.52));
          ctx.closePath();
          ctx.fill();
        }

        // 若底口敞开，在底沿标出视线向左右散开的警示箭
        if (ev.state.bottomMouth > 0.055) {
          ctx.globalAlpha = 0.78 * ease;
          const sx = botPt.x + inX * 0.6;
          const sy = botPt.y + 12;
          const dir = sideSign;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + dir * 24, sy);
          ctx.stroke();
        }
      };

      ctx.save();
      drawWallFlow(tl, bl, -1);
      drawWallFlow(tr, br, 1);

      // 若已收尖但落点隐没，绘制视线穿透底尖漏出画框的警示虚矢
      if (ev.state.bottomMouth <= 0.055 && ev.state.anchorLevel === "off") {
        ctx.globalAlpha = 0.85 * ease;
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(apexPx.x, apexPx.y + 12);
        ctx.lineTo(apexPx.x, apexPx.y + 62);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = CORAL;
        ctx.beginPath();
        ctx.moveTo(apexPx.x, apexPx.y + 68);
        ctx.lineTo(apexPx.x - 6, apexPx.y + 56);
        ctx.lineTo(apexPx.x + 6, apexPx.y + 56);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. 视觉重心点 G + 重力垂线 + 力矩倾覆弧（只在开启参考线时渲染，真源来自 ev.metrics）
    if (ev.state.showGuides) {
      const gx = ev.metrics.visualCx * STAGE_W;
      const gy = ev.metrics.visualCy * STAGE_H;
      const ux = ev.metrics.upperMassX * STAGE_W;

      // 重心垂线
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = ev.metrics.absPlumb > 10 ? "rgba(255, 123, 102, 0.78)" : "rgba(110, 205, 240, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ux, gy);
      ctx.lineTo(ux, BOTTOM_Y * STAGE_H);
      ctx.stroke();
      ctx.restore();

      // 若偏心，标出水平偏移横杠；超出安全锥则绘制力矩倾覆弧与实测倾角
      if (ev.metrics.absPlumb >= 4) {
        ctx.strokeStyle = ev.metrics.absPlumb > 10 ? CORAL : "#F3C46B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux, BOTTOM_Y * STAGE_H);
        ctx.lineTo(apexPx.x, BOTTOM_Y * STAGE_H);
        ctx.stroke();
      }
      if (ev.metrics.absPlumb > 10) {
        const sign = Math.sign(ev.metrics.plumbOffsetPct);
        const tiltArcR = 34;
        const startA = -Math.PI / 2;
        const endA = startA - sign * 0.72;
        ctx.save();
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(apexPx.x, apexPx.y, tiltArcR, Math.min(startA, endA), Math.max(startA, endA));
        ctx.stroke();
        const tiltFont = Math.round(clamp(12 / Math.max(0.42, cssScale), 13, 22));
        ctx.font = `700 ${tiltFont}px "Space Mono", monospace`;
        ctx.fillStyle = CORAL;
        ctx.textAlign = sign < 0 ? "right" : "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`倾覆 ${Math.abs(Math.round(ev.metrics.tiltDeg))}°`, apexPx.x + sign * 42, apexPx.y - 16);
        ctx.restore();
      }

      // 视觉重心标记圆环（简洁空心重心环 + G 标）
      ctx.fillStyle = "rgba(16, 23, 26, 0.80)";
      ctx.strokeStyle = ev.ok ? MINT : accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#EEF4F7";
      ctx.font = '700 12px "Space Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("G", gx, gy + 0.5);

      // 底部收束角标注（当底口收敛时画小弧线 + 实测角度）
      if (ev.state.bottomMouth <= 0.08 && ev.metrics.convergeDeg > 8) {
        const aL = Math.atan2(tl.y - apexPx.y, tl.x - apexPx.x);
        const aR = Math.atan2(tr.y - apexPx.y, tr.x - apexPx.x);
        ctx.strokeStyle = ev.pillars.guidance.ok ? "rgba(140, 228, 255, 0.65)" : "rgba(255, 123, 102, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(apexPx.x, apexPx.y, 44, aL, aR);
        ctx.stroke();

        const degFont = Math.round(clamp(12.5 / Math.max(0.45, cssScale), 14, 24));
        ctx.fillStyle = ev.pillars.guidance.ok ? CYAN_BRIGHT : CORAL;
        ctx.font = `700 ${degFont}px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${ev.metrics.convergeDeg}°`, apexPx.x, apexPx.y - 50);
      }
    }

    // 6. 底部聚焦落点（根据 anchorLevel 真实绘制隐没 / 微光 / 强对比 / 过曝夺主）
    if (ev.state.anchorLevel === "glare") {
      const glare = ctx.createRadialGradient(apexPx.x, apexPx.y, 8, apexPx.x, apexPx.y, 132);
      glare.addColorStop(0, "rgba(235, 251, 255, 0.98)");
      glare.addColorStop(0.38, "rgba(110, 205, 240, 0.76)");
      glare.addColorStop(1, "rgba(110, 205, 240, 0)");
      ctx.fillStyle = glare;
      ctx.beginPath();
      ctx.arc(apexPx.x, apexPx.y, 132, 0, Math.PI * 2);
      ctx.fill();
    } else if (ev.state.anchorLevel === "focus") {
      const glow = ctx.createRadialGradient(apexPx.x, apexPx.y, 3, apexPx.x, apexPx.y, 44);
      glow.addColorStop(0, "rgba(180, 242, 255, 0.96)");
      glow.addColorStop(0.42, "rgba(110, 205, 240, 0.45)");
      glow.addColorStop(1, "rgba(110, 205, 240, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(apexPx.x, apexPx.y, 44, 0, Math.PI * 2);
      ctx.fill();
    } else if (ev.state.anchorLevel === "soft") {
      const soft = ctx.createRadialGradient(apexPx.x, apexPx.y, 2, apexPx.x, apexPx.y, 26);
      soft.addColorStop(0, "rgba(140, 218, 244, 0.60)");
      soft.addColorStop(1, "rgba(110, 205, 240, 0)");
      ctx.fillStyle = soft;
      ctx.beginPath();
      ctx.arc(apexPx.x, apexPx.y, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 底部落点实心/空心节点（可拖拽把手）
    const apexHot = hoverHandle === "apex" || activeDrag === "apex";
    const dotR = ev.state.anchorLevel === "glare" ? 26 : ev.state.anchorLevel === "focus" ? 12 : ev.state.anchorLevel === "soft" ? 9 : 8;
    ctx.beginPath();
    ctx.arc(apexPx.x, apexPx.y, dotR, 0, Math.PI * 2);
    if (ev.state.anchorLevel === "off") {
      ctx.fillStyle = "#18242C";
      ctx.fill();
      ctx.strokeStyle = apexHot ? CYAN_BRIGHT : "rgba(255, 123, 102, 0.88)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = ev.metrics.absPlumb > 10 ? CORAL : CYAN_BRIGHT;
      ctx.fill();
      if (apexHot) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
    }

    // 顶角双拖拽圆环把手（低调精致，悬停高亮）
    for (const [id, pt] of [["tl", tl], ["tr", tr]]) {
      const hot = hoverHandle === id || activeDrag === id;
      ctx.fillStyle = hot ? CYAN_BRIGHT : "#10171A";
      ctx.strokeStyle = hot ? "#FFFFFF" : CYAN;
      ctx.lineWidth = hot ? 2.5 : 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, hot ? 9 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 顶部角标：按当前缩放反算安全字号，保证手机竖屏也清晰易读且不遮主体
    const hudPx = Math.round(clamp(11.5 / Math.max(0.36, cssScale), 14, 27));
    ctx.font = `400 ${hudPx}px "Space Mono", monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(196, 218, 230, 0.92)";
    const leftHud = cssScale < 0.45
      ? `TOP ${ev.metrics.topSpanPct}% · V ${ev.metrics.convergeDeg}°`
      : `TOP ${ev.metrics.topSpanPct}% · BASE ${ev.metrics.mouthPct}% · V ${ev.metrics.convergeDeg}°`;
    ctx.fillText(leftHud, 12, 10);

    ctx.textAlign = "right";
    ctx.fillStyle = ev.ok ? MINT : CORAL;
    ctx.fillText(ev.badgeText, STAGE_W - 12, 10);

    ctx.restore();
  }

  // ---------- 统一指针交互（配合 CSS touch-action: pan-y，触屏竖滑滚页、横滑流畅驱动倒三角） ----------
  let touchLocked = null; // null | 'x'

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = clientToNorm(e);
    const st = getState();
    const ev = st.eval;
    const handle = hitTest(p.x, p.y, ev);
    activeDrag = handle;
    touchLocked = e.pointerType === "mouse" ? "x" : handle !== "open" ? "x" : null;
    dragStart = {
      clientX: e.clientX,
      clientY: e.clientY,
      state: { ...ev.state },
    };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    if (handle === "apex" && onSelectZone) onSelectZone("point");
    else if (handle === "horizon" && onSelectZone) onSelectZone("open");
    else if ((handle === "tl" || handle === "tr") && onSelectZone) onSelectZone("guide");
  }

  function onPointerMove(e) {
    const p = clientToNorm(e);
    const st = getState();
    if (!activeDrag || !dragStart) {
      const h = hitTest(p.x, p.y, st.eval);
      const nextHover = h === "open" ? null : h;
      if (nextHover !== hoverHandle) {
        hoverHandle = nextHover;
        canvas.style.cursor = h === "horizon" ? "ns-resize" : "ew-resize";
      }
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dxPx = e.clientX - dragStart.clientX;
    const dyPx = e.clientY - dragStart.clientY;

    if (!touchLocked) {
      if (Math.hypot(dxPx, dyPx) < 4) return;
      if (Math.abs(dyPx) > Math.abs(dxPx) * 1.35) {
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
        activeDrag = null;
        dragStart = null;
        return;
      }
      touchLocked = "x";
    }

    const dxNorm = dxPx / Math.max(180, rect.width);
    const dyNorm = dyPx / Math.max(160, rect.height);
    const s0 = dragStart.state;

    if (activeDrag === "open") {
      // 横拖开放区：向右展开上翼 + 收拢底口（穿过经典倒三角）；向左退回直筒/反转正三角
      const nextTop = clamp(s0.topSpan + dxNorm * 0.85, 0.14, 0.90);
      let nextMouth = clamp(s0.bottomMouth - dxNorm * 1.25, 0.0, 0.68);
      if (nextMouth < 0.035) nextMouth = 0;
      const nextApex = nextMouth === 0 && Math.abs(s0.apexX - 0.5) < 0.13
        ? clamp(s0.apexX + (0.5 - s0.apexX) * clamp(dxNorm * 2.2, 0, 1), 0.22, 0.78)
        : s0.apexX;
      onChange({ topSpan: nextTop, bottomMouth: nextMouth, apexX: nextApex });
    } else if (activeDrag === "tl" || activeDrag === "tr") {
      const half = Math.abs(p.x - 0.5);
      let nextTop = clamp(half * 2, 0.12, 0.90);
      if (Math.abs(nextTop - 0.76) < 0.02) nextTop = 0.76;
      onChange({ topSpan: nextTop });
    } else if (activeDrag === "apex") {
      let nextApex = clamp(p.x, 0.22, 0.78);
      if (Math.abs(nextApex - 0.5) < 0.018) nextApex = 0.5;
      const nextMouth = dyNorm < -0.05 ? clamp(s0.bottomMouth + dyNorm * 1.4, 0, 0.64) : s0.bottomMouth;
      onChange({ apexX: nextApex, bottomMouth: nextMouth < 0.03 ? 0 : nextMouth });
    } else if (activeDrag === "horizon") {
      let nextH = clamp(p.y, 0.27, 0.64);
      if (Math.abs(nextH - 0.45) < 0.015) nextH = 0.45;
      onChange({ horizonY: nextH });
    }
  }

  function onPointerUp(e) {
    if (activeDrag) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    activeDrag = null;
    dragStart = null;
    touchLocked = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  return { draw };
}
