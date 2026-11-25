// 025 汇聚线构图 · 正文 01–08 节交互实验模块
// 每节采用不同控件与视觉载体（相邻两节不复刻同一种控件）：
// 01 庞佐错觉卡尺仪（2D Canvas + 夹角滑杆 + 一键平移叠尺）
// 02 3×3 消失点方位与视平高程点选矩阵（双联 SVG：侧视高程剖面 + 正面透视图）
// 03 三层纵深剥离独立开关 + 柱列跨数阶梯（2D Canvas 实时透视隧道）
// 04 原海报三示例 X 光透视切镜（三幅独立画面/骨架/标注切签 SVG）
// 05 历史拉线复原标签台（四时代史料几何剖析 + 显隐拉线开关 SVG）
// 06 错用病例翻牌对照（三例强制汇聚 vs 合适构图一键切换 SVG）
// 07 单变量盲测小练习（两题 × 四中性方案实时 SVG + 答后透视射线检验）
// 08 原海报灯箱（滚轮/按钮缩放、鼠标/触控拖拽、Esc 关闭）

import { clamp, computeDepthSlices, PALETTE } from "./model.js";
import { loop, pixelRatio } from "../../lib/stage.js";

// ============================================================
// SECTION 01 · 庞佐错觉卡尺实验室 (2D Canvas)
// ============================================================
export function initPonzoLab() {
  const canvas = document.getElementById("ponzo-canvas");
  const range = document.getElementById("ponzo-angle");
  const angleVal = document.getElementById("ponzo-angle-val");
  const compareBtn = document.getElementById("ponzo-compare");
  const readout = document.getElementById("ponzo-readout");
  if (!canvas || !range) return;

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dpr = 1;
  let convDeg = Number(range.value) || 46; // 0° 平行 → 62° 强烈汇聚
  let overlayTarget = 0; // 0 = 原位分置，1 = 上杠平移下落与下杠重合比长
  let overlayProg = 0;
  let dirty = true;

  const updateCopy = () => {
    angleVal.textContent = `${convDeg}°`;
    if (overlayTarget === 1) {
      readout.innerHTML =
        `<strong>卡尺重合实测：两根朱红横杠严格同为 100% 等长。</strong>` +
        `刚才看上去「上长下短」，完全是两侧汇聚线强行启动了大脑的尺寸恒常性补偿——你把上方横杠当成了“更远处的物体”，于是脑内自动把它放大。`;
    } else if (convDeg < 8) {
      readout.innerHTML =
        `<strong>当前夹角 ${convDeg}°（近乎平行）：错觉几乎消失。</strong>` +
        `两条侧线不再明显收束，上下两根横杠立刻显出同样长短。把滑杆往右推到 40° 以上，再点「放上卡尺比长」验证。`;
    } else if (convDeg < 28) {
      readout.innerHTML =
        `<strong>当前夹角 ${convDeg}°（轻度汇聚）：上方横杠已开始显长。</strong>` +
        `汇聚线一出现，画面的二维平面就被大脑翻译成纵深轨道，越靠近汇点的元素在同等像素下显得越有体量。`;
    } else {
      readout.innerHTML =
        `<strong>当前夹角 ${convDeg}°（强烈汇聚）：上方朱红横杠明显显得更长、更远。</strong>` +
        `实际上两根横杠像素宽度完全相等。点一下「放上卡尺比长」，看上方横杠垂直滑下重合。`;
    }
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(260, Math.round(r.width));
    const nh = Math.max(200, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  };

  const render = (_t, dt, { still }) => {
    resize();
    if (still) {
      overlayProg = overlayTarget;
    } else if (Math.abs(overlayProg - overlayTarget) > 0.002) {
      overlayProg += (overlayTarget - overlayProg) * Math.min(1, Math.max(dt, 0.016) * 8.5);
      if (Math.abs(overlayProg - overlayTarget) <= 0.002) overlayProg = overlayTarget;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 浅羊皮制图纸底
    ctx.fillStyle = PALETTE.vellum;
    ctx.fillRect(0, 0, w, h);

    // 淡灰等分制图网格
    ctx.strokeStyle = "rgba(4, 31, 64, 0.06)";
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }

    const cx = w * 0.5;
    const topY = h * 0.10;
    const botY = h * 0.90;
    const spanY = botY - topY;
    // 按夹角算上下轨道半宽
    const halfRad = (convDeg * 0.5 * Math.PI) / 180;
    const baseHalf = Math.min(w * 0.34, 190);
    const shrink = Math.min(baseHalf * 0.84, Math.tan(halfRad) * spanY * 0.56);
    const topHalf = Math.max(24, baseHalf - shrink);
    const botHalf = baseHalf + shrink * 0.32;

    // 枕木横线（按 1/z 递进增强深度暗示）
    const sleeperCount = 11;
    ctx.strokeStyle = "rgba(4, 31, 64, 0.22)";
    for (let i = 0; i < sleeperCount; i++) {
      const f = i / (sleeperCount - 1);
      const t = convDeg > 4 ? Math.pow(f, 1.55) : f; // 越汇聚，越近密远疏反转→上方更密
      const y = topY + t * spanY;
      const hw = topHalf + t * (botHalf - topHalf);
      ctx.lineWidth = 1 + t * 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - hw - 10 * t, y);
      ctx.lineTo(cx + hw + 10 * t, y);
      ctx.stroke();
    }

    // 两条普鲁士蓝汇聚轨道线
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - topHalf, topY);
    ctx.lineTo(cx - botHalf, botY);
    ctx.moveTo(cx + topHalf, topY);
    ctx.lineTo(cx + botHalf, botY);
    ctx.stroke();

    // 延伸虚线指向消失点
    if (convDeg >= 8) {
      const slope = (botHalf - topHalf) / spanY;
      const vpY = topY - topHalf / Math.max(0.01, slope);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(234, 88, 47, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - topHalf, topY);
      ctx.lineTo(cx, Math.max(-40, vpY));
      ctx.moveTo(cx + topHalf, topY);
      ctx.lineTo(cx, Math.max(-40, vpY));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 两条像素宽度完全相等的朱红横杠
    const barW = Math.min(w * 0.30, 148);
    const barH = 11;
    const upperY0 = topY + spanY * 0.23;
    const lowerY = topY + spanY * 0.75;
    const upperY = upperY0 + (lowerY - barH - 4 - upperY0) * overlayProg;

    // 卡尺垂直参考线（比长时出现）
    if (overlayProg > 0.03) {
      ctx.save();
      ctx.strokeStyle = `rgba(15, 107, 92, ${(overlayProg * 0.85).toFixed(2)})`;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - barW * 0.5, upperY0 - 14);
      ctx.lineTo(cx - barW * 0.5, lowerY + 22);
      ctx.moveTo(cx + barW * 0.5, upperY0 - 14);
      ctx.lineTo(cx + barW * 0.5, lowerY + 22);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 上方横杠虚影（记录原位）
    if (overlayProg > 0.05) {
      ctx.strokeStyle = "rgba(181, 52, 17, 0.35)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - barW * 0.5, upperY0 - barH * 0.5, barW, barH);
      ctx.setLineDash([]);
    }

    // 绘制两根绝对等长的朱红横杠
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(cx - barW * 0.5, upperY - barH * 0.5, barW, barH);
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(cx - barW * 0.5, lowerY - barH * 0.5, barW, barH);

    // 标注文字固定靠右清净区并用细虚线引出，任何夹角都不撞轨线
    const labelX = w - 14;
    ctx.strokeStyle = "rgba(4, 31, 64, 0.32)";
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + barW * 0.5 + 4, upperY);
    ctx.lineTo(labelX - 58, upperY);
    ctx.moveTo(cx + barW * 0.5 + 4, lowerY);
    ctx.lineTo(labelX - 58, lowerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `500 11.5px "DM Mono", monospace`;
    ctx.fillStyle = PALETTE.navy;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const pxLabel = `${Math.round(barW)}px`;
    ctx.fillText(`A ${pxLabel}`, labelX, upperY);
    ctx.fillText(`B ${pxLabel}`, labelX, lowerY);

    ctx.restore();
  };

  const ctrl = loop(canvas, render);
  range.addEventListener("input", () => {
    convDeg = Number(range.value);
    updateCopy();
    dirty = true;
    ctrl.draw();
  });

  compareBtn?.addEventListener("click", () => {
    overlayTarget = overlayTarget === 0 ? 1 : 0;
    compareBtn.setAttribute("aria-pressed", String(overlayTarget === 1));
    compareBtn.textContent = overlayTarget === 1 ? "复位上下横杠" : "放上卡尺比长";
    updateCopy();
    dirty = true;
    ctrl.draw();
  });

  new ResizeObserver(() => {
    dirty = true;
    ctrl.draw();
  }).observe(canvas);

  updateCopy();
  ctrl.draw();
}

// ============================================================
// SECTION 02 · 3×3 消失点方位与视平高程矩阵 (SVG 双联联动)
// ============================================================
const VP_ZONES = {
  "high-left": {
    u: 0.28, v: 0.24, eyeH: "高视平（约 76% 站高）",
    title: "高位偏左 · 俯瞰展开",
    mood: "地面、路面或桌面大面积展开，主体落左前方，右侧留出宽阔斜向通途。",
    use: "适合城市大道航拍、街景纵深、建筑庭院总览。",
  },
  "high-center": {
    u: 0.50, v: 0.24, eyeH: "高视平（约 76% 站高）",
    title: "高位居中 · 宏大铺陈",
    mood: "左右严格对称且地面占据四分之三画幅，像站在高台俯瞰一条仪式通道。",
    use: "适合礼仪大道、梯田长阶、大型空间俯拍。",
  },
  "high-right": {
    u: 0.72, v: 0.24, eyeH: "高视平（约 76% 站高）",
    title: "高位偏右 · 远眺导流",
    mood: "顺应从左向右的阅读习惯，视线由左下近景一路爬升收束进右上远方。",
    use: "适合杂志跨页、长廊导视、公路旅行主图。",
  },
  "mid-left": {
    u: 0.30, v: 0.44, eyeH: "标准平视（约 56% 人眼高）",
    title: "平视偏左 · 左侧主廊",
    mood: "贴近日常站立视角，右侧建筑墙面大面积展开，用来承接图文或留白很从容。",
    use: "适合左图右文海报、展厅导览视觉。",
  },
  "mid-center": {
    u: 0.50, v: 0.46, eyeH: "标准平视（约 54% 人眼高）",
    title: "平视正中 · 对称走廊",
    mood: "经典单点对称隧道：极具仪式感、沉浸感与心理压迫力，把观者直接钉在通道轴心。",
    use: "适合电影中轴长镜头、教堂穹顶走廊、建筑中轴入口。",
  },
  "mid-right": {
    u: 0.59, v: 0.37, eyeH: "标准偏高（025 原海报同款）",
    title: "偏心右翼 · 原海报经典态",
    mood: "025 原海报正是这一布局：左翼深海蓝墙体厚重托起大标题，右翼窗列迅疾收束，张力与留白兼得。",
    use: "适合图文并重海报、网页首屏、建筑宣传页。",
  },
  "low-left": {
    u: 0.30, v: 0.72, eyeH: "低机位仰视（约 28% 低角度）",
    title: "低位偏左 · 仰望高墙",
    mood: "地平线压得很低，右侧墙体与天空高耸拔起，赋予建筑强烈的纪念碑气势。",
    use: "适合摩天大楼、高挑美术馆中庭、人物英雄仰拍。",
  },
  "low-center": {
    u: 0.50, v: 0.74, eyeH: "低机位仰视（约 26% 低角度）",
    title: "低位居中 · 巍峨殿堂",
    mood: "顶部穹顶与梁柱向画面下方剧烈合拢，观者仿佛置身巨构脚下，肃穆而有压迫感。",
    use: "适合标志建筑主视觉、高大桥梁、科幻通道。",
  },
  "low-right": {
    u: 0.70, v: 0.72, eyeH: "低机位仰视（约 28% 低角度）",
    title: "低位偏右 · 跃升动势",
    mood: "视线从左下地面压低切入，顺斜梁猛然拔高，既保留仰视气势又打破死板对称。",
    use: "适合品牌运动海报、现代建筑立面特写。",
  },
};

export function initZoneMatrix() {
  const btns = [...document.querySelectorAll("[data-zone]")];
  const frontSvg = document.getElementById("zone-front-svg");
  const sideSvg = document.getElementById("zone-side-svg");
  const titleEl = document.getElementById("zone-title");
  const moodEl = document.getElementById("zone-mood");
  const useEl = document.getElementById("zone-use");
  const metaEl = document.getElementById("zone-meta");
  if (!btns.length || !frontSvg || !sideSvg) return;

  const drawZone = (key) => {
    const z = VP_ZONES[key] || VP_ZONES["mid-right"];
    btns.forEach((b) => {
      const active = b.dataset.zone === key;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });

    const W = 420;
    const H = 260;
    const vx = +(z.u * W).toFixed(1);
    const vy = +(z.v * H).toFixed(1);

    // 构造严格咬合顶梁与底缘的 6 根 1/z 递进右墙立柱（避免最右柱压在画框边线上）
    const topEndY = Math.max(0, vy - 180);
    const botEndY = Math.min(H, vy + 150);
    const pillars = [];
    for (let i = 0; i < 6; i++) {
      const f = (i + 0.32) / 5.8;
      const t = 1 - 1 / (1 + f * 3.8);
      const x = W - (W - vx) * t;
      const yTop = topEndY + (vy - topEndY) * t;
      const yBot = botEndY + (vy - botEndY) * t;
      const sw = Math.max(1.2, (1 - t) * 5.0);
      pillars.push(`<line x1="${x.toFixed(1)}" y1="${yTop.toFixed(1)}" x2="${x.toFixed(1)}" y2="${yBot.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="${sw.toFixed(1)}" />`);
    }

    // 主朱红通道底边随消失点水平自然牵引
    const rL = clamp(vx - 95, -20, W * 0.72);
    const rR = clamp(vx + 95, W * 0.28, W + 20);
    // 左壁三角阴影
    const leftEdgeTopX = Math.max(0, vx - 155);
    const leftEdgeBotY = clamp(vy + 95, H * 0.35, H);

    frontSvg.innerHTML = `
      <rect width="${W}" height="${H}" fill="${PALETTE.paper}" />
      <polygon points="0,0 ${leftEdgeTopX.toFixed(1)},0 ${vx},${vy} 0,${leftEdgeBotY.toFixed(1)}" fill="${PALETTE.navy}" />
      <polygon points="${vx},${vy} ${rL.toFixed(1)},${H} ${rR.toFixed(1)},${H}" fill="${PALETTE.vermilion}" />
      <line x1="${vx}" y1="${vy}" x2="${W}" y2="${topEndY.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="5" />
      <line x1="${vx}" y1="${vy}" x2="${W}" y2="${botEndY.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="2.5" />
      ${pillars.join("")}
      <line x1="0" y1="${vy}" x2="${W}" y2="${vy}" stroke="${PALETTE.navy}" stroke-width="1" stroke-dasharray="5 5" opacity="0.5" />
      <circle cx="${vx}" cy="${vy}" r="11" fill="none" stroke="${PALETTE.vermilionInk}" stroke-width="1.5" />
      <circle cx="${vx}" cy="${vy}" r="6.5" fill="${PALETTE.vellum}" />
      <circle cx="${vx}" cy="${vy}" r="4.5" fill="${PALETTE.vermilion}" />
      <rect x="10" y="10" width="128" height="22" fill="${PALETTE.navy}" />
      <text x="18" y="25" fill="${PALETTE.cream}" font-family="DM Mono, monospace" font-size="11">VP ${Math.round(z.u * 100)}% · ${Math.round(z.v * 100)}%</text>
    `;

    // 侧视相机高程剖面图（直观证明：消失点高度 = 机位视线高度！）
    const SW = 260;
    const SH = 124;
    const groundY = 104;
    const ceilY = 20;
    const camY = ceilY + z.v * (groundY - ceilY);
    sideSvg.innerHTML = `
      <rect width="${SW}" height="${SH}" fill="${PALETTE.vellum}" />
      <line x1="12" y1="${ceilY}" x2="${SW - 12}" y2="${ceilY}" stroke="${PALETTE.navy}" stroke-width="2" />
      <line x1="12" y1="${groundY}" x2="${SW - 12}" y2="${groundY}" stroke="${PALETTE.navy}" stroke-width="2.5" />
      <line x1="48" y1="${camY.toFixed(1)}" x2="${SW - 18}" y2="${camY.toFixed(1)}" stroke="${PALETTE.vermilion}" stroke-width="1.6" stroke-dasharray="5 4" />
      <polygon points="48,${camY.toFixed(1)} ${SW - 18},${ceilY + 4} ${SW - 18},${groundY - 4}" fill="${PALETTE.vermilion}" opacity="0.14" />
      <rect x="26" y="${(camY - 8).toFixed(1)}" width="22" height="16" fill="${PALETTE.navy}" />
      <polygon points="48,${(camY - 5).toFixed(1)} 56,${(camY - 9).toFixed(1)} 56,${(camY + 9).toFixed(1)} 48,${(camY + 5).toFixed(1)}" fill="${PALETTE.vermilion}" />
      <line x1="37" y1="${(camY + 8).toFixed(1)}" x2="31" y2="${groundY}" stroke="${PALETTE.navy}" stroke-width="1.6" />
      <line x1="37" y1="${(camY + 8).toFixed(1)}" x2="43" y2="${groundY}" stroke="${PALETTE.navy}" stroke-width="1.6" />
      <circle cx="${SW - 18}" cy="${camY.toFixed(1)}" r="4.5" fill="${PALETTE.vermilion}" />
      <text x="64" y="${Math.max(34, camY - 8).toFixed(1)}" fill="${PALETTE.vermilionInk}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">视平线高度 = 消失点高度</text>
      <text x="16" y="118" fill="${PALETTE.slate}" font-family="DM Mono, monospace" font-size="10">SIDE ELEVATION · CAMERA EYE LEVEL</text>
    `;

    titleEl.textContent = z.title;
    moodEl.textContent = z.mood;
    useEl.textContent = z.use;
    metaEl.textContent = `${z.eyeH} · X ${Math.round(z.u * 100)}% / Y ${Math.round(z.v * 100)}%`;
  };

  btns.forEach((b) => b.addEventListener("click", () => drawZone(b.dataset.zone)));
  drawZone("mid-right");
}

// ============================================================
// SECTION 03 · 三层纵深剥离台（2D Canvas + 独立层开关 + 跨数阶梯）
// ============================================================
export function initDepthLayersLab() {
  const canvas = document.getElementById("depth-canvas");
  const layerChecks = [...document.querySelectorAll("[data-depth-layer]")];
  const stepBtns = [...document.querySelectorAll("[data-depth-steps]")];
  const spacingBtns = [...document.querySelectorAll("[data-depth-spacing]")];
  const readout = document.getElementById("depth-readout");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const cfg = {
    rays: true,
    ribs: true,
    tone: true,
    steps: 10,
    spacing: "progressive",
  };
  let w = 0;
  let h = 0;
  let dpr = 1;
  let dirty = true;

  const updateReadout = (ratio) => {
    const activeCount = (cfg.rays ? 1 : 0) + (cfg.ribs ? 1 : 0) + (cfg.tone ? 1 : 0);
    if (!cfg.rays && !cfg.ribs) {
      readout.innerHTML =
        `<strong>纵深线索全关（${activeCount}/3 层）：空间瞬间消失。</strong>重新打开「轮廓汇聚线」和「1/z 递进柱列」，观察三维走廊如何一步步立起来。`;
    } else if (cfg.rays && !cfg.ribs) {
      readout.innerHTML =
        `<strong>只有外轮廓斜线，没有内部递进柱列：画面塌成了扁平的二维 X 形或三角形。</strong>斜线只交代了方向，真正把“距离感”填进平面里的，是按 1/z 逐层缩密的重复构件。`;
    } else if (cfg.ribs && cfg.spacing === "uniform") {
      readout.innerHTML =
        `<strong>当前为平面等距排布（近远跨度比 1.00×）：看着像贴在斜框上的装饰格子。</strong>把排布切回「1/z 递进」，立刻比较大脑对纵深可信度的判断。`;
    } else if (!cfg.tone) {
      readout.innerHTML =
        `<strong>已有几何递进（近远比 ${ratio.toFixed(1)}×），但关闭了近浓远淡衰减。</strong>远处线条与近处同样刺黑，深处容易糊成黑团；开启空气明暗衰减后，远近层次立刻分明。`;
    } else {
      readout.innerHTML =
        `<strong>三层纵深全部就位（${cfg.steps} 跨 · 近远比 ${ratio.toFixed(1)}×）：轮廓汇聚指明去向，1/z 柱列量出距离，近实远虚拉开空气层。</strong>这正是原海报「前景至背景，层层递进」背后的完整几何机制。`;
    }
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(260, Math.round(r.width));
    const nh = Math.max(220, Math.round(r.height));
    const ndpr = pixelRatio(2);
    if (nw !== w || nh !== h || ndpr !== dpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    }
  };

  const render = () => {
    resize();
    if (!dirty) return;
    dirty = false;

    const info = computeDepthSlices(32, cfg.spacing, cfg.steps);
    updateReadout(info.depthRatio);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 深蓝暗板制图舱底
    ctx.fillStyle = PALETTE.navyDeep;
    ctx.fillRect(0, 0, w, h);

    const vp = { x: w * 0.5, y: h * 0.48 };
    const padX = w * 0.04;
    const padY = h * 0.05;
    const corners = [
      { x: padX, y: padY },
      { x: w - padX, y: padY },
      { x: w - padX, y: h - padY },
      { x: padX, y: h - padY },
    ];

    // 尽头朱红门框（仅作空间尽头参照）
    const endW = w * 0.10;
    const endH = h * 0.24;
    ctx.fillStyle = cfg.tone ? "rgba(234, 88, 47, 0.22)" : "rgba(234, 88, 47, 0.85)";
    ctx.fillRect(vp.x - endW * 0.5, vp.y - endH * 0.5, endW, endH);
    ctx.strokeStyle = PALETTE.vermilion;
    ctx.lineWidth = 2;
    ctx.strokeRect(vp.x - endW * 0.5, vp.y - endH * 0.5, endW, endH);

    // 层 1：四角轮廓汇聚线
    if (cfg.rays) {
      ctx.strokeStyle = cfg.tone ? "rgba(239, 226, 210, 0.72)" : PALETTE.cream;
      ctx.lineWidth = 1.8;
      for (const c of corners) {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(vp.x, vp.y);
        ctx.stroke();
      }
      // 地面两条朱红导轨线
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.30, h - padY);
      ctx.lineTo(vp.x, vp.y + endH * 0.5);
      ctx.moveTo(w * 0.70, h - padY);
      ctx.lineTo(vp.x, vp.y + endH * 0.5);
      ctx.stroke();
    }

    // 层 2：递进矩形建筑框架（由近及远按 1/z 或等距分布）
    if (cfg.ribs) {
      for (let i = 0; i < info.slices.length; i++) {
        const t = info.slices[i] * 0.86; // 停在门框之前
        const x1 = padX + (vp.x - endW * 0.5 - padX) * t;
        const x2 = w - padX - (w - padX - (vp.x + endW * 0.5)) * t;
        const y1 = padY + (vp.y - endH * 0.5 - padY) * t;
        const y2 = h - padY - (h - padY - (vp.y + endH * 0.5)) * t;

        // 层 3：近浓远淡 + 线宽递减
        const alpha = cfg.tone ? clamp(0.95 - t * 0.72, 0.20, 0.95) : 0.92;
        const lw = cfg.tone ? Math.max(1, (1 - t) * 3.4) : 2.2;

        if (cfg.tone) {
          ctx.fillStyle = `rgba(239, 226, 210, ${(0.03 * (1 - t)).toFixed(3)})`;
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        }
        ctx.strokeStyle = `rgba(239, 226, 210, ${alpha.toFixed(2)})`;
        ctx.lineWidth = lw;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }

    // 左上实时比例牌
    ctx.fillStyle = "rgba(4, 31, 64, 0.92)";
    ctx.fillRect(14, 14, 198, 26);
    ctx.strokeStyle = "rgba(234, 88, 47, 0.75)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14.5, 14.5, 197, 25);
    ctx.font = `500 12px "DM Mono", monospace`;
    ctx.fillStyle = PALETTE.cream;
    ctx.textBaseline = "middle";
    ctx.fillText(
      `STEPS ${cfg.steps} · RATIO ${info.depthRatio.toFixed(2)}x`,
      24,
      27.5
    );
    ctx.restore();
  };

  const ctrl = loop(canvas, render);

  layerChecks.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.depthLayer;
      cfg[k] = !cfg[k];
      btn.setAttribute("aria-pressed", String(cfg[k]));
      btn.classList.toggle("is-on", cfg[k]);
      const st = btn.querySelector(".lt-state");
      if (st) st.textContent = cfg[k] ? "开" : "关";
      dirty = true;
      ctrl.draw();
    });
  });

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      cfg.steps = Number(btn.dataset.depthSteps);
      stepBtns.forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-pressed", String(active));
        b.classList.toggle("is-active", active);
      });
      dirty = true;
      ctrl.draw();
    });
  });

  spacingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      cfg.spacing = btn.dataset.depthSpacing;
      spacingBtns.forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-pressed", String(active));
        b.classList.toggle("is-active", active);
      });
      dirty = true;
      ctrl.draw();
    });
  });

  new ResizeObserver(() => {
    dirty = true;
    ctrl.draw();
  }).observe(canvas);

  ctrl.draw();
}

// ============================================================
// SECTION 04 · 原海报三示例 X 光透视切镜（画面 / 骨架 / 拆解）
// ============================================================
const ARCHETYPE_NOTES = {
  road: {
    art: "原海报示例①：灰蓝远山 + 深海蓝路面 + 白色双道线向正中朱红落日收束，下宽上尖构成强烈远景导流。",
    xray: "透视骨架：2 条主车道边线 + 2 条路肩斜线呈对称等腰三角，全部锁定在 50% × 48% 的地平线落日下方。",
    note: "为何奏效：道路自带天然的平行双轨，不需要人工添加装饰线；落日稳坐汇点正上方，给远景一个情感句号。",
  },
  arch: {
    art: "原海报示例②：左右对称灰色墙廊配浅色地面与天花折线，层层缩窄至尽头一扇亮朱红门洞。",
    xray: "透视骨架：顶角、踢脚、门梁 6 条结构斜线 + 1/z 渐密地面横缝构成封闭盒状透视，把视线压成单行道。",
    note: "为何奏效：建筑廊道同时具备「四面闭合汇聚」与「明暗反差门洞」，纵深压迫感比开阔公路更强。",
  },
  light: {
    art: "原海报示例③：普鲁士深蓝暗底上，5 道宽窄有致的暖白光束斜贯画幅，汇聚向右上偏心朱红光源。",
    xray: "透视骨架：无任何实体墙或路面，仅凭明暗边界线就能建立 80% × 17% 偏心消失点与强斜向拉扯。",
    note: "为何奏效：打破“汇聚线=画马路”的刻板印象——窗光、树影、人群朝向，只要方向统一指向一点，全都是汇聚线。",
  },
};

export function initArchetypeCards() {
  const cards = [...document.querySelectorAll("[data-archetype]")];
  cards.forEach((card) => {
    const key = card.dataset.archetype;
    const btns = [...card.querySelectorAll("[data-view]")];
    const caption = card.querySelector(".arch-caption");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.view;
        card.dataset.mode = mode;
        btns.forEach((b) => {
          const active = b === btn;
          b.setAttribute("aria-pressed", String(active));
          b.classList.toggle("is-active", active);
        });
        if (caption && ARCHETYPE_NOTES[key]) {
          caption.textContent = ARCHETYPE_NOTES[key][mode];
        }
      });
    });
  });
}

// ============================================================
// SECTION 05 · 历史构图拉线复原仪（核实史料 + 几何示意图）
// ============================================================
const HISTORY_DATA = {
  alberti: {
    year: "1435 / 1436",
    who: "阿尔贝蒂 · 《论绘画》",
    title: "把单点汇聚写成第一部几何手册",
    body: "继布鲁内莱斯基（约 1415 年）在佛罗伦萨圣乔凡尼洗礼堂门前用镜面实验验证线性透视后，莱昂·巴蒂斯塔·阿尔贝蒂在拉丁文《De pictura》（1435）与意大利文《Della pittura》（1436）中，首次系统写出了「中心点」（punto centrico）和地砖方格的画法：地面平行线汇于视平线一点，横线按距离逐排收密。",
    cite: "史料核实：Encyclopaedia Britannica · De pictura / Linear perspective",
    draw(showLines) {
      const tiles = [];
      const vx = 220;
      const vy = 76;
      // 7 条垂直进深正交线
      for (let i = -3; i <= 3; i++) {
        const bx = vx + i * 68;
        tiles.push(`<line x1="${bx}" y1="226" x2="${vx}" y2="${vy}" stroke="${PALETTE.navy}" stroke-width="${i === 0 ? 1.8 : 1.3}" />`);
      }
      // 7 条按 1/z 渐密横线
      for (let j = 0; j < 7; j++) {
        const f = j / 6;
        const t = 1 - 1 / (1 + f * 3.4);
        const y = 226 - (226 - vy) * t * 0.88;
        const hw = 204 * (1 - t * 0.88);
        tiles.push(`<line x1="${(vx - hw).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(vx + hw).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="1.2" />`);
      }
      const guides = showLines
        ? `<line x1="16" y1="${vy}" x2="424" y2="${vy}" stroke="${PALETTE.vermilion}" stroke-width="1.6" stroke-dasharray="5 4" />
           <line x1="16" y1="226" x2="356" y2="${vy}" stroke="${PALETTE.vermilion}" stroke-width="1.4" stroke-dasharray="3 3" />
           <circle cx="${vx}" cy="${vy}" r="6" fill="${PALETTE.vermilion}" />
           <text x="${vx + 10}" y="${vy - 8}" fill="${PALETTE.vermilionInk}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">中心点 punto centrico</text>`
        : "";
      return `
        <rect width="440" height="244" fill="${PALETTE.vellum}" />
        <rect x="16" y="16" width="408" height="210" fill="${PALETTE.paper}" stroke="${PALETTE.navy}" stroke-width="1.5" />
        ${tiles.join("")}
        ${guides}
      `;
    },
  },
  leonardo: {
    year: "1495–1498",
    who: "达·芬奇 · 《最后的晚餐》",
    title: "一颗钉在基督右太阳穴的定位钉",
    body: "在米兰圣玛丽亚感恩修道院食堂壁画中，修复学者在基督右太阳穴附近的灰泥里发现了真实的定位钉孔——达·芬奇从这颗钉子拉出细绳，定出藻井顶格、两侧挂毯与三扇背景窗的全部透视线，让整座食堂的空间延长进壁画，视线毫无偏差地聚向核心人物。",
    cite: "史料核实：Museo del Cenacolo Vinciano · Santa Maria delle Grazie",
    draw(showLines) {
      const vx = 220;
      const vy = 104;
      const guides = showLines
        ? `<g stroke="${PALETTE.vermilion}" stroke-width="1.4" stroke-dasharray="5 3">
             <line x1="16" y1="20" x2="${vx}" y2="${vy}" />
             <line x1="424" y1="20" x2="${vx}" y2="${vy}" />
             <line x1="16" y1="68" x2="${vx}" y2="${vy}" />
             <line x1="424" y1="68" x2="${vx}" y2="${vy}" />
             <line x1="16" y1="158" x2="${vx}" y2="${vy}" />
             <line x1="424" y1="158" x2="${vx}" y2="${vy}" />
           </g>
           <circle cx="${vx}" cy="${vy}" r="8" fill="none" stroke="${PALETTE.vermilion}" stroke-width="1.8" />
           <circle cx="${vx}" cy="${vy}" r="3.5" fill="${PALETTE.vermilion}" />
           <text x="${vx + 12}" y="${vy - 10}" fill="${PALETTE.vermilionInk}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">定位钉孔（唯一汇点）</text>`
        : "";
      return `
        <rect width="440" height="244" fill="${PALETTE.vellum}" />
        <rect x="16" y="18" width="408" height="208" fill="${PALETTE.paper}" stroke="${PALETTE.navy}" stroke-width="1.5" />
        <polygon points="16,18 424,18 332,68 108,68" fill="rgba(4,31,64,0.12)" stroke="${PALETTE.navy}" stroke-width="1.2" />
        <polygon points="16,18 108,68 108,162 16,186" fill="rgba(4,31,64,0.06)" stroke="${PALETTE.navy}" stroke-width="1.2" />
        <polygon points="424,18 332,68 332,162 424,186" fill="rgba(4,31,64,0.06)" stroke="${PALETTE.navy}" stroke-width="1.2" />
        <rect x="108" y="68" width="224" height="94" fill="${PALETTE.vellum}" stroke="${PALETTE.navy}" stroke-width="1.2" />
        <rect x="184" y="78" width="72" height="66" fill="rgba(4,31,64,0.15)" stroke="${PALETTE.navy}" stroke-width="1.2" />
        <rect x="128" y="84" width="38" height="54" fill="rgba(4,31,64,0.10)" />
        <rect x="274" y="84" width="38" height="54" fill="rgba(4,31,64,0.10)" />
        <rect x="44" y="156" width="352" height="32" fill="${PALETTE.navy}" />
        <polygon points="220,96 196,156 244,156" fill="${PALETTE.vermilion}" opacity="0.82" />
        <circle cx="220" cy="102" r="9" fill="${PALETTE.navy}" />
        ${guides}
      `;
    },
  },
  ukie: {
    year: "18 世纪江户",
    who: "浮绘（Uki-e）· 奥村政信与歌川丰春",
    title: "单点透视跨海进入东方木刻版画",
    body: "18 世纪日本江户浮世绘吸收经荷兰传入的西洋铜版画透视法，诞生了以夸张纵深闻名的「浮绘」。奥村政信在歌舞伎剧场内景中让两列观众席、梁木与花道猛烈汇向舞台深处，随后歌川丰春将其拓展到城市街景与风景版画。",
    cite: "史料核实：The Metropolitan Museum of Art & Encyclopaedia Britannica · Uki-e",
    draw(showLines) {
      const vx = 220;
      const vy = 84;
      const rafters = [];
      for (let i = 0; i < 6; i++) {
        const f = i / 5;
        const t = 1 - 1 / (1 + f * 3.0);
        const y = 20 + (vy - 20) * t * 0.72;
        const lx = 16 + (vx - 54 - 16) * t;
        const rx = 424 - (424 - (vx + 54)) * t;
        rafters.push(`<line x1="${lx.toFixed(1)}" y1="${y.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="${(2.4 - t * 1.4).toFixed(1)}" />`);
      }
      const guides = showLines
        ? `<g stroke="${PALETTE.vermilion}" stroke-width="1.5" stroke-dasharray="5 3">
             <line x1="16" y1="226" x2="${vx}" y2="${vy}" />
             <line x1="424" y1="226" x2="${vx}" y2="${vy}" />
             <line x1="118" y1="226" x2="${vx}" y2="${vy}" />
             <line x1="322" y1="226" x2="${vx}" y2="${vy}" />
           </g>
           <circle cx="${vx}" cy="${vy}" r="6" fill="${PALETTE.vermilion}" />
           <text x="${vx + 10}" y="${vy - 6}" fill="${PALETTE.vermilionInk}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">花道与席位同汇舞台</text>`
        : "";
      return `
        <rect width="440" height="244" fill="${PALETTE.vellum}" />
        <rect x="16" y="18" width="408" height="208" fill="${PALETTE.paper}" stroke="${PALETTE.navy}" stroke-width="1.5" />
        <polygon points="16,18 424,18 ${vx + 54},${vy - 18} ${vx - 54},${vy - 18}" fill="rgba(4,31,64,0.10)" />
        ${rafters.join("")}
        <polygon points="16,226 118,226 ${vx - 30},${vy + 18} ${vx - 54},${vy + 18}" fill="${PALETTE.navy}" opacity="0.88" />
        <polygon points="424,226 322,226 ${vx + 30},${vy + 18} ${vx + 54},${vy + 18}" fill="${PALETTE.navy}" opacity="0.88" />
        <polygon points="118,226 158,226 ${vx - 14},${vy + 18} ${vx - 30},${vy + 18}" fill="${PALETTE.vermilion}" opacity="0.72" />
        <rect x="${vx - 54}" y="${vy - 18}" width="108" height="36" fill="${PALETTE.vellum}" stroke="${PALETTE.navy}" stroke-width="1.5" />
        ${guides}
      `;
    },
  },
  gibson: {
    year: "1911 & 1950",
    who: "庞佐（1911）与吉布森（1950）",
    title: "从画室法则走进现代视觉心理学",
    body: "意大利心理学家马里奥·庞佐（Mario Ponzo）在 1911 年前后以汇聚轨线演示了著名的尺寸错觉；1950 年，詹姆斯·吉布森（James J. Gibson）在《视觉世界的知觉》（The Perception of the Visual World）中提出地表「纹理梯度」理论，阐明线性透视并非人造惯例，而是视网膜直接读取地面密度渐变的天然能力。",
    cite: "史料核实：The Illusions Index (Ponzo) & Britannica · James J. Gibson (1950)",
    draw(showLines) {
      const dots = [];
      const vx = 220;
      const vy = 66;
      // 模拟吉布森地表纹理梯度：越靠地平线，点越密越小
      for (let row = 0; row < 8; row++) {
        const f = row / 7;
        const t = Math.pow(f, 1.75);
        const y = vy + 14 + t * 144;
        const r = 1.6 + t * 4.8;
        const spread = 24 + t * 172;
        for (let k = -4; k <= 4; k++) {
          const x = vx + (k / 4) * spread;
          dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${PALETTE.navy}" opacity="${(0.32 + t * 0.65).toFixed(2)}" />`);
        }
      }
      const guides = showLines
        ? `<line x1="16" y1="${vy}" x2="424" y2="${vy}" stroke="${PALETTE.vermilion}" stroke-width="1.5" stroke-dasharray="5 4" />
           <line x1="24" y1="224" x2="${vx}" y2="${vy}" stroke="${PALETTE.vermilion}" stroke-width="1.6" />
           <line x1="416" y1="224" x2="${vx}" y2="${vy}" stroke="${PALETTE.vermilion}" stroke-width="1.6" />
           <circle cx="${vx}" cy="${vy}" r="5.5" fill="${PALETTE.vermilion}" />
           <text x="26" y="${vy - 10}" fill="${PALETTE.vermilionInk}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">纹理梯度越近地平线越细密</text>`
        : "";
      return `
        <rect width="440" height="244" fill="${PALETTE.vellum}" />
        <rect x="16" y="18" width="408" height="208" fill="${PALETTE.paper}" stroke="${PALETTE.navy}" stroke-width="1.5" />
        ${dots.join("")}
        ${guides}
      `;
    },
  },
};

export function initHistoryTabs() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const svg = document.getElementById("history-svg");
  const toggleBtn = document.getElementById("history-lines-toggle");
  const yearEl = document.getElementById("hist-year");
  const titleEl = document.getElementById("hist-title");
  const bodyEl = document.getElementById("hist-body");
  const citeEl = document.getElementById("hist-cite");
  if (!tabs.length || !svg) return;

  let current = "alberti";
  let showLines = true;

  const render = () => {
    const item = HISTORY_DATA[current];
    tabs.forEach((t) => {
      const active = t.dataset.era === current;
      t.setAttribute("aria-pressed", String(active));
      t.classList.toggle("is-active", active);
    });
    svg.innerHTML = item.draw(showLines);
    yearEl.textContent = `${item.year} · ${item.who}`;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    citeEl.textContent = item.cite;
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", String(showLines));
      toggleBtn.textContent = showLines ? "隐藏透视拉线" : "显示透视拉线";
    }
  };

  tabs.forEach((t) => t.addEventListener("click", () => { current = t.dataset.era; render(); }));
  toggleBtn?.addEventListener("click", () => { showLines = !showLines; render(); });
  render();
}

// ============================================================
// SECTION 06 · 什么时候别用汇聚线（错用病例一键修复对照）
// ============================================================
const MISUSE_CASES = [
  {
    id: "compare",
    badLabel: "强加汇聚：双品对比被扭成主从",
    goodLabel: "改用平行并列：两方案平权易读",
    badText: "硬给产品对比卡片加上斜向汇聚透视后，左卡被扯大、右卡被压小，读者下意识以为左侧更重要，破坏了公平对比。",
    goodText: "撤掉汇聚斜线，改用平直的「024 平行线构图」或等宽双栏，两款产品权重齐平，参数逐行对齐一目了然。",
    draw(fixed) {
      if (!fixed) {
        return `
          <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
          <polygon points="18,22 146,44 146,144 18,156" fill="${PALETTE.paper}" />
          <polygon points="164,48 258,64 258,128 164,140" fill="#B5B0AC" />
          <line x1="18" y1="22" x2="296" y2="74" stroke="${PALETTE.vermilionBright}" stroke-width="1.5" stroke-dasharray="4 3" />
          <line x1="18" y1="156" x2="296" y2="118" stroke="${PALETTE.vermilionBright}" stroke-width="1.5" stroke-dasharray="4 3" />
          <text x="32" y="94" fill="${PALETTE.navy}" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700">方案甲（显大）</text>
          <text x="172" y="98" fill="${PALETTE.navy}" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700">方案乙（压小）</text>
        `;
      }
      return `
        <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
        <rect x="24" y="28" width="118" height="114" fill="${PALETTE.paper}" />
        <rect x="158" y="28" width="118" height="114" fill="${PALETTE.paper}" />
        <line x1="24" y1="62" x2="276" y2="62" stroke="${PALETTE.okDark}" stroke-width="1.4" stroke-dasharray="4 3" />
        <text x="52" y="98" fill="${PALETTE.navy}" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700">方案甲</text>
        <text x="188" y="98" fill="${PALETTE.navy}" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700">方案乙</text>
      `;
    },
  },
  {
    id: "facade",
    badLabel: "仰拍汇聚：建筑立面梯形倾倒",
    goodLabel: "改用正立面垂直：比例严谨平静",
    badText: "拍摄或绘制建筑立面档案时若斜仰汇聚，原本端庄的窗格韵律会向上收尖，立面显得东倒西歪、比例失真。",
    goodText: "退远机位或做透视校正，改用平直垂直线构图，建筑立面的窗格比例、对称秩序和沉静气质才站得住。",
    draw(fixed) {
      if (!fixed) {
        return `
          <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
          <polygon points="78,20 222,20 264,154 36,154" fill="${PALETTE.paper}" />
          <line x1="114" y1="20" x2="96" y2="154" stroke="${PALETTE.navy}" stroke-width="2" />
          <line x1="186" y1="20" x2="204" y2="154" stroke="${PALETTE.navy}" stroke-width="2" />
          <line x1="64" y1="64" x2="236" y2="64" stroke="${PALETTE.navy}" stroke-width="1.6" />
          <line x1="48" y1="110" x2="252" y2="110" stroke="${PALETTE.navy}" stroke-width="1.6" />
          <line x1="36" y1="154" x2="150" y2="-40" stroke="${PALETTE.vermilionBright}" stroke-width="1.4" stroke-dasharray="4 3" />
          <line x1="264" y1="154" x2="150" y2="-40" stroke="${PALETTE.vermilionBright}" stroke-width="1.4" stroke-dasharray="4 3" />
        `;
      }
      return `
        <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
        <rect x="64" y="22" width="172" height="130" fill="${PALETTE.paper}" />
        <line x1="120" y1="22" x2="120" y2="152" stroke="${PALETTE.navy}" stroke-width="2" />
        <line x1="180" y1="22" x2="180" y2="152" stroke="${PALETTE.navy}" stroke-width="2" />
        <line x1="64" y1="65" x2="236" y2="65" stroke="${PALETTE.navy}" stroke-width="1.6" />
        <line x1="64" y1="108" x2="236" y2="108" stroke="${PALETTE.navy}" stroke-width="1.6" />
        <line x1="56" y1="22" x2="56" y2="152" stroke="${PALETTE.okDark}" stroke-width="1.4" stroke-dasharray="4 3" />
        <line x1="244" y1="22" x2="244" y2="152" stroke="${PALETTE.okDark}" stroke-width="1.4" stroke-dasharray="4 3" />
      `;
    },
  },
  {
    id: "group",
    badLabel: "透视斜列：后排成员沦为背景噪点",
    goodLabel: "改用水平舒展：每位人物清晰可见",
    badText: "需要平等呈现多位受访者或团队剪影时，如果硬排在一条剧烈缩小的汇聚线上，越往后越像路人甲，视觉地位极度失衡。",
    goodText: "改用平展的水平阵型，让所有人物处于近似景深层，眼神与姿态彼此平等对话。",
    draw(fixed) {
      const fig = (x, y, s, col) =>
        `<circle cx="${x}" cy="${y - s * 0.85}" r="${(s * 0.16).toFixed(1)}" fill="${col}" />
         <polygon points="${(x - s * 0.24).toFixed(1)},${(y - s * 0.64).toFixed(1)} ${(x + s * 0.24).toFixed(1)},${(y - s * 0.64).toFixed(1)} ${(x + s * 0.16).toFixed(1)},${y} ${(x - s * 0.16).toFixed(1)},${y}" fill="${col}" />`;
      if (!fixed) {
        return `
          <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
          <line x1="24" y1="150" x2="262" y2="72" stroke="${PALETTE.vermilionBright}" stroke-width="1.6" stroke-dasharray="4 3" />
          <line x1="24" y1="36" x2="262" y2="72" stroke="${PALETTE.vermilionBright}" stroke-width="1.6" stroke-dasharray="4 3" />
          ${fig(64, 144, 92, PALETTE.paper)}
          ${fig(138, 120, 58, "#C4B9AD")}
          ${fig(192, 102, 36, "#9A938C")}
          ${fig(232, 88, 22, "#7C7874")}
        `;
      }
      return `
        <rect width="300" height="170" fill="${PALETTE.navyDeep}" />
        <line x1="24" y1="142" x2="276" y2="142" stroke="${PALETTE.okDark}" stroke-width="1.6" stroke-dasharray="4 3" />
        ${fig(66, 142, 74, PALETTE.paper)}
        ${fig(122, 142, 74, PALETTE.paper)}
        ${fig(178, 142, 74, PALETTE.paper)}
        ${fig(234, 142, 74, PALETTE.paper)}
      `;
    },
  },
];

export function initMisuseCards() {
  const host = document.getElementById("misuse-grid");
  if (!host) return;
  const fixedMap = { compare: false, facade: false, group: false };

  const renderCard = (item) => {
    const fixed = fixedMap[item.id];
    const el = host.querySelector(`[data-misuse="${item.id}"]`);
    if (!el) return;
    el.classList.toggle("is-fixed", fixed);
    el.querySelector(".misuse-svg").innerHTML = item.draw(fixed);
    el.querySelector(".misuse-status").textContent = fixed ? item.goodLabel : item.badLabel;
    el.querySelector(".misuse-desc").textContent = fixed ? item.goodText : item.badText;
    const btn = el.querySelector(".misuse-btn");
    btn.setAttribute("aria-pressed", String(fixed));
    btn.textContent = fixed ? "看回误用原状" : "切回合适构图";
  };

  for (const item of MISUSE_CASES) {
    const el = host.querySelector(`[data-misuse="${item.id}"]`);
    el?.querySelector(".misuse-btn")?.addEventListener("click", () => {
      fixedMap[item.id] = !fixedMap[item.id];
      renderCard(item);
    });
    renderCard(item);
  }
}

// ============================================================
// SECTION 07 · 小练习：两道单变量盲测（中性标签 A/B/C/D + 答后透视射线验证）
// ============================================================
function makeCorridorQuizSvg({ disp, target, reveal }) {
  const W = 280;
  const H = 186;
  const vp = { x: 168, y: 72 };
  const vpL = { x: vp.x - 54 * disp, y: vp.y - 24 * disp };
  const vpC = { x: vp.x + 8 * disp, y: vp.y + 30 * disp };
  const vpR = { x: vp.x + 56 * disp, y: vp.y - 16 * disp };

  // 1/z 递进右柱
  const cols = [];
  for (let i = 0; i < 6; i++) {
    const f = i / 5;
    const t = 1 - 1 / (1 + f * 3.8);
    const x = W - (W - vpR.x) * t;
    const y1 = 10 + (vpR.y - 10) * t;
    const y2 = 166 + (vpR.y - 166) * t;
    cols.push(`<line x1="${x.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${PALETTE.navy}" stroke-width="${Math.max(1.2, (1 - t) * 4.5).toFixed(1)}" />`);
  }

  let subject = "";
  if (target === "locked") {
    subject = `<rect x="${vp.x - 12}" y="${vp.y - 16}" width="24" height="32" fill="${PALETTE.navy}" />
               <rect x="${vp.x - 8}" y="${vp.y - 12}" width="16" height="26" fill="${PALETTE.vermilion}" />
               <circle cx="${vp.x}" cy="${vp.y - 1}" r="3.2" fill="${PALETTE.navy}" />
               <polygon points="${vp.x - 5},${vp.y + 3} ${vp.x + 5},${vp.y + 3} ${vp.x + 3},${vp.y + 14} ${vp.x - 3},${vp.y + 14}" fill="${PALETTE.navy}" />`;
  } else if (target === "offset") {
    subject = `<rect x="44" y="122" width="24" height="32" fill="${PALETTE.navy}" />
               <rect x="48" y="126" width="16" height="26" fill="${PALETTE.vermilion}" />
               <circle cx="56" cy="137" r="3.2" fill="${PALETTE.navy}" />
               <polygon points="51,141 61,141 59,152 53,152" fill="${PALETTE.navy}" />`;
  }

  const overlay = reveal
    ? `<g stroke="${disp > 0 ? PALETTE.vermilionInk : PALETTE.okLight}" stroke-width="1.3" stroke-dasharray="4 3">
         <line x1="0" y1="138" x2="${vpL.x}" y2="${vpL.y}" />
         <line x1="106" y1="${H}" x2="${vpC.x}" y2="${vpC.y}" />
         <line x1="230" y1="${H}" x2="${vpC.x}" y2="${vpC.y}" />
         <line x1="${W}" y1="10" x2="${vpR.x}" y2="${vpR.y}" />
       </g>
       <circle cx="${vpL.x}" cy="${vpL.y}" r="3.5" fill="${disp > 0 ? PALETTE.vermilionInk : PALETTE.okLight}" />
       <circle cx="${vpC.x}" cy="${vpC.y}" r="3.5" fill="${disp > 0 ? PALETTE.vermilionInk : PALETTE.okLight}" />
       <circle cx="${vpR.x}" cy="${vpR.y}" r="3.5" fill="${disp > 0 ? PALETTE.vermilionInk : PALETTE.okLight}" />`
    : "";

  return `
    <rect width="${W}" height="${H}" fill="${PALETTE.paper}" />
    <polygon points="0,0 82,0 ${vpL.x},${vpL.y} 0,138" fill="${PALETTE.navy}" />
    <polygon points="${vpC.x},${vpC.y} 106,${H} 230,${H}" fill="${PALETTE.vermilion}" opacity="0.88" />
    <line x1="${vpR.x}" y1="${vpR.y}" x2="${W}" y2="10" stroke="${PALETTE.navy}" stroke-width="4.5" />
    <line x1="${vpR.x}" y1="${vpR.y}" x2="${W}" y2="166" stroke="${PALETTE.navy}" stroke-width="2" />
    ${cols.join("")}
    ${subject}
    ${overlay}
  `;
}

function makeRoadQuizSvg({ focalMm, spacing, reveal }) {
  const W = 280;
  const H = 186;
  const vp = { x: 158, y: 78 };
  const halfW = focalMm >= 120 ? 16 : focalMm <= 16 ? 156 : 74;
  const sliceInfo = computeDepthSlices(focalMm, spacing, 7);

  const dashes = [];
  for (let i = 0; i < sliceInfo.slices.length - 1; i++) {
    const t0 = sliceInfo.slices[i];
    const t1 = sliceInfo.slices[i + 1];
    const y0 = H - (H - vp.y) * t0;
    const y1 = H - (H - vp.y) * (t0 + (t1 - t0) * 0.54);
    const lw = Math.max(1.5, (1 - t0) * 7.5);
    dashes.push(`<line x1="${vp.x}" y1="${y0.toFixed(1)}" x2="${vp.x}" y2="${y1.toFixed(1)}" stroke="${PALETTE.vermilion}" stroke-width="${lw.toFixed(1)}" />`);
    // 两侧小路标柱
    const lx = vp.x - (halfW + 16) * (1 - t0);
    const rx = vp.x + (halfW + 16) * (1 - t0);
    const ph = Math.max(3, (1 - t0) * 20);
    dashes.push(`<line x1="${lx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(y0 - ph).toFixed(1)}" stroke="${PALETTE.cream}" stroke-width="${Math.max(1, (1 - t0) * 2.5).toFixed(1)}" />`);
    dashes.push(`<line x1="${rx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${(y0 - ph).toFixed(1)}" stroke="${PALETTE.cream}" stroke-width="${Math.max(1, (1 - t0) * 2.5).toFixed(1)}" />`);
  }

  const overlay = reveal
    ? `<line x1="${vp.x - halfW}" y1="${H}" x2="${vp.x}" y2="${vp.y}" stroke="${PALETTE.okDark}" stroke-width="1.5" stroke-dasharray="4 3" />
       <line x1="${vp.x + halfW}" y1="${H}" x2="${vp.x}" y2="${vp.y}" stroke="${PALETTE.okDark}" stroke-width="1.5" stroke-dasharray="4 3" />
       <rect x="8" y="8" width="128" height="20" fill="rgba(4,31,64,0.88)" />
       <text x="14" y="21" fill="${PALETTE.cream}" font-family="DM Mono, monospace" font-size="10">${focalMm}mm · ${spacing === "uniform" ? "等距 1.0x" : `递进 ${sliceInfo.depthRatio.toFixed(1)}x`}</text>`
    : "";

  return `
    <rect width="${W}" height="${vp.y}" fill="${PALETTE.paper}" />
    <polygon points="0,${vp.y} 42,58 96,68 158,64 218,52 280,68 280,${vp.y}" fill="#8A95A3" />
    <rect y="${vp.y}" width="${W}" height="${H - vp.y}" fill="${PALETTE.navy}" />
    <circle cx="${vp.x}" cy="${vp.y - 16}" r="14" fill="${PALETTE.vermilion}" />
    <polygon points="${vp.x},${vp.y} ${vp.x - halfW},${H} ${vp.x + halfW},${H}" fill="#0F305A" />
    <line x1="${vp.x}" y1="${vp.y}" x2="${vp.x - halfW}" y2="${H}" stroke="${PALETTE.cream}" stroke-width="2.5" />
    <line x1="${vp.x}" y1="${vp.y}" x2="${vp.x + halfW}" y2="${H}" stroke="${PALETTE.cream}" stroke-width="2.5" />
    ${dashes.join("")}
    ${overlay}
  `;
}

const QUIZ_ROUNDS = [
  {
    id: 0,
    stem: "第 1 题：同一条 35mm 建筑石廊，四幅只差「线条汇点与焦点落位」这一个变量，哪一幅最成立？",
    answer: "C",
    options: [
      { key: "A", draw: (rev) => makeCorridorQuizSvg({ disp: 0.44, target: "locked", reveal: rev }), why: "左壁、路面、右柱列各自指向不同假汇点，射线半途打架，空间秩序破裂。" },
      { key: "B", draw: (rev) => makeCorridorQuizSvg({ disp: 0, target: "empty", reveal: rev }), why: "线条精准汇向一点，但终点一片空白，视线冲进去扑了个空。" },
      { key: "C", draw: (rev) => makeCorridorQuizSvg({ disp: 0, target: "locked", reveal: rev }), why: "所有结构线严密收束至偏心消失点，朱红光门与远行剪影正坐镇汇点核心，聚力最完整。" },
      { key: "D", draw: (rev) => makeCorridorQuizSvg({ disp: 0, target: "offset", reveal: rev }), why: "线条全力指向中右消失点，唯一朱红主角却被丢在左下角落，构图与主角互抢视线。" },
    ],
  },
  {
    id: 1,
    stem: "第 2 题：同一条远景公路与偏心落日，四幅只差「汇聚张角与沿线疏密递进」这一个变量，哪一幅纵深最真？",
    answer: "D",
    options: [
      { key: "A", draw: (rev) => makeRoadQuizSvg({ focalMm: 135, spacing: "progressive", reveal: rev }), why: "135mm 长焦把道路压成近乎平行的窄条，失去了汇聚纵深拉扯力。" },
      { key: "B", draw: (rev) => makeRoadQuizSvg({ focalMm: 35, spacing: "uniform", reveal: rev }), why: "外框角度虽够，但路面虚线与两侧路标按平面等距（1.0×）排布，一眼看穿是扁平贴纸。" },
      { key: "C", draw: (rev) => makeRoadQuizSvg({ focalMm: 14, spacing: "progressive", reveal: rev }), why: "14mm 极广角把近端路面猛烈撑破底角，前景边缘畸变过猛，反而分散了远方落日的焦点。" },
      { key: "D", draw: (rev) => makeRoadQuizSvg({ focalMm: 35, spacing: "progressive", reveal: rev }), why: "35mm 汇聚张角稳健舒展，路面标段与路标按真实 1/z 由疏变密，纵深感自然立起。" },
    ],
  },
];

export function initPracticeQuiz() {
  const stemEl = document.getElementById("quiz-stem");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  const roundBtns = [...document.querySelectorAll("[data-quiz-round]")];
  const retryBtn = document.getElementById("quiz-retry");
  if (!stemEl || !gridEl || !fbEl) return;

  let roundIdx = 0;
  let picked = null;

  const render = () => {
    const q = QUIZ_ROUNDS[roundIdx];
    const revealed = picked !== null;
    stemEl.textContent = q.stem;

    roundBtns.forEach((b) => {
      const active = Number(b.dataset.quizRound) === roundIdx;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });

    gridEl.innerHTML = q.options
      .map((opt) => {
        const isPicked = picked === opt.key;
        const isCorrect = opt.key === q.answer;
        let cls = "quiz-card";
        if (revealed && isCorrect) cls += " is-correct";
        else if (revealed && isPicked && !isCorrect) cls += " is-wrong";
        else if (isPicked) cls += " is-picked";
        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.key}" aria-pressed="${isPicked}">
            <svg viewBox="0 0 280 186" aria-hidden="true">${opt.draw(revealed)}</svg>
            <span class="quiz-label">方案 ${opt.key}</span>
          </button>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.quizOpt;
        render();
      });
    });

    if (!revealed) {
      fbEl.className = "quiz-feedback";
      fbEl.innerHTML = `<p>先凭第一眼直觉点选上方任意一幅方案，选完后四幅图会同步叠加透视校验射线并逐幅拆解。</p>`;
    } else {
      const ok = picked === q.answer;
      fbEl.className = `quiz-feedback ${ok ? "is-ok" : "is-warn"}`;
      fbEl.innerHTML = `
        <p class="quiz-verdict"><strong>${ok ? `判断准确：方案 ${q.answer} 最成立。` : `你选了方案 ${picked}，最成立的是方案 ${q.answer}。`}</strong></p>
        <ul class="quiz-explain">
          ${q.options
            .map(
              (o) =>
                `<li class="${o.key === q.answer ? "is-ans" : ""}"><b>方案 ${o.key}${o.key === q.answer ? "（最优）" : ""}：</b>${o.why}</li>`
            )
            .join("")}
        </ul>
      `;
    }
  };

  roundBtns.forEach((b) =>
    b.addEventListener("click", () => {
      roundIdx = Number(b.dataset.quizRound);
      picked = null;
      render();
    })
  );

  retryBtn?.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// ============================================================
// SECTION 08 · 原海报灯箱（缩放、鼠标/触控拖拽、Esc 关闭）
// ============================================================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const scaleEl = document.getElementById("lb-scale");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!openBtn || !posterImg || !box || !lbImg || !vp) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (scaleEl) scaleEl.textContent = `${Math.round(scale * 100)}%`;
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  const open = () => {
    if (!lbImg.src) lbImg.src = posterImg.src; // 复用页面唯一海报，不二次内联
    box.hidden = false;
    document.body.classList.add("lb-open");
    reset();
    closeBtn?.focus();
  };

  const close = () => {
    if (box.hidden) return;
    box.hidden = true;
    document.body.classList.remove("lb-open");
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  resetBtn?.addEventListener("click", reset);
  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 0.7, 3.5);
    apply();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 0.7, 3.5);
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  });

  vp.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(+(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2), 0.7, 3.5);
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && scale <= 1.02) {
      close();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    vp.setPointerCapture?.(e.pointerId);
  });

  vp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });

  const end = () => { dragging = false; };
  vp.addEventListener("pointerup", end);
  vp.addEventListener("pointercancel", end);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
