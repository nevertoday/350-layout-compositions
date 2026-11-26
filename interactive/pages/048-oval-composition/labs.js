// 048 椭圆构图 · 各节专题交互：
//   01 钉绳双焦离心率画布（Canvas）
//   02 五重语言竖帘对照器（Curtain + Lens）
//   03 历代椭圆骨架蓝图步进器（5-Era SVG Blueprint）
//   04 五类场景顺形留白检验台（Domain + Margin Toggle）
//   05 什么时候别用反例对照开关
//   06 双轮单变量眼力小练习
//   07 原海报放大拖动看图灯箱

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp } from "./model.js";

const TAU = Math.PI * 2;

/* ==================== 01 钉绳双焦与离心率实验台 ==================== */
export function mountStringLab() {
  const canvas = document.getElementById("string-canvas");
  const eccInput = document.getElementById("string-ecc");
  const eccVal = document.getElementById("string-ecc-val");
  const ratioOut = document.getElementById("string-ratio");
  const fociOut = document.getElementById("string-foci");
  const sumOut = document.getElementById("string-sum");
  const regimeTitle = document.getElementById("string-regime-title");
  const regimeBody = document.getElementById("string-regime-body");
  const regimePill = document.getElementById("string-regime-pill");
  const pauseBtn = document.getElementById("string-pause");
  if (!canvas || !eccInput) return;

  const ctx = canvas.getContext("2d");
  const gridCanvas = document.createElement("canvas");
  const gridCtx = gridCanvas.getContext("2d");
  let gridKey = "";
  let ecc = 0.70; // 初始对应 1.40:1 优雅区间
  let theta = 0.65;
  let playing = !reducedMotion.matches;
  let dragging = null; // "pin" | "nib"
  let cssW = 560;
  let cssH = 340;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(220, Math.round(r.height));
    dpr = pixelRatio(window.innerWidth <= 900 ? 1.5 : 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    const k = `${cssW}x${cssH}@${dpr}`;
    if (k !== gridKey) {
      gridKey = k;
      gridCanvas.width = Math.round(cssW * dpr);
      gridCanvas.height = Math.round(cssH * dpr);
      gridCtx.save();
      gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridCtx.fillStyle = "#FFFBF8";
      gridCtx.fillRect(0, 0, cssW, cssH);
      gridCtx.strokeStyle = "rgba(64, 40, 63, 0.06)";
      gridCtx.lineWidth = 1;
      for (let x = 24; x < cssW; x += 24) {
        gridCtx.beginPath(); gridCtx.moveTo(x, 0); gridCtx.lineTo(x, cssH); gridCtx.stroke();
      }
      for (let y = 24; y < cssH; y += 24) {
        gridCtx.beginPath(); gridCtx.moveTo(0, y); gridCtx.lineTo(cssW, y); gridCtx.stroke();
      }
      gridCtx.restore();
    }
  }

  function metrics() {
    const cx = cssW * 0.5;
    const cy = cssH * 0.50;
    const a = Math.min(cssW * 0.40, cssH * 0.42); // 半长轴固定且上下留足边距，确保正圆与任意椭圆都在框内完整呼吸
    const b = a * Math.sqrt(Math.max(0.06, 1 - ecc * ecc));
    const c = a * ecc;
    const ratio = a / b;
    const px = cx + a * Math.cos(theta);
    const py = cy + b * Math.sin(theta);
    const d1 = Math.hypot(px - (cx - c), py - cy);
    const d2 = Math.hypot(px - (cx + c), py - cy);
    return { cx, cy, a, b, c, ratio, px, py, d1, d2 };
  }

  function syncText() {
    const m = metrics();
    eccVal.textContent = ecc.toFixed(2);
    ratioOut.textContent = `${m.ratio.toFixed(2)} : 1`;
    fociOut.textContent = `${Math.round((m.c / m.a) * 100)}% 半长轴`;
    sumOut.textContent = `d1 + d2 = 2a（恒定）`;

    let pill = "";
    let tone = "good";
    let title = "";
    let body = "";
    if (ecc < 0.42) {
      pill = "近圆态 · 偏静态";
      tone = "warn";
      title = "两枚图钉几乎叠成一点，方向感还没拉开";
      body = `此时长短轴比只有 ${m.ratio.toFixed(2)}:1，两枚焦点挤在中央，和 047 圆形构图几乎没有拉开差距——视线向心静止，缺少椭圆特有的方向牵引。`;
    } else if (ecc <= 0.76) {
      pill = "优雅舒展区（经验优选）";
      tone = "good";
      title = "双焦清晰分开，弧线柔和且内腔宽裕";
      body = `此时长短轴比约 ${m.ratio.toFixed(2)}:1，两枚焦点分别落在长轴中段附近：一端托住视觉主体，另一端留给标题或呼吸空白，既有包裹感又有柔和流动。`;
    } else if (ecc <= 0.88) {
      pill = "修长动感区";
      tone = "good";
      title = "长轴拉长、曲率变锐，画面呈现鲜明速度与优雅";
      body = `此时长短轴比达到 ${m.ratio.toFixed(2)}:1，正如原海报所说更富舒展或修长动感；但数学焦点已靠近两端弧尖，排主体时要稍微往内收回，别紧撞边缘。`;
    } else {
      pill = "过扁窄缝 · 警戒区";
      tone = "bad";
      title = "短轴被压扁，原海报「越扁越舒展」在这里撞到边界";
      body = `长短轴比飙到 ${m.ratio.toFixed(2)}:1 后，内部空间变成一道细缝，文字和图像都会被迫贴壁。椭圆的「扁平舒展」和「修长动感」都只在适度区间内成立。`;
    }
    regimePill.textContent = pill;
    regimePill.dataset.tone = tone;
    regimeTitle.textContent = title;
    regimeBody.textContent = body;
  }

  function draw(t, dt, { still }) {
    resize();
    if (!still && playing && !dragging) {
      theta = (theta + (dt || 0.016) * 0.72) % TAU;
    }
    const m = metrics();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(gridCanvas, 0, 0, cssW, cssH);

    // 固定参考正圆虚线（对照椭圆从正圆压扁而来）
    ctx.strokeStyle = "rgba(168, 194, 190, 0.45)";
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(m.cx, m.cy, m.a, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    // 长短轴线
    ctx.strokeStyle = "rgba(64, 40, 63, 0.22)";
    ctx.beginPath();
    ctx.moveTo(m.cx - m.a - 14, m.cy);
    ctx.lineTo(m.cx + m.a + 14, m.cy);
    ctx.moveTo(m.cx, m.cy - m.b - 14);
    ctx.lineTo(m.cx, m.cy + m.b + 14);
    ctx.stroke();

    // 椭圆主体轮廓
    const bad = ecc < 0.42 || ecc > 0.88;
    ctx.fillStyle = bad ? "rgba(176, 42, 62, 0.06)" : "rgba(45, 111, 106, 0.07)";
    ctx.strokeStyle = bad ? "#B02A3E" : "#2D6F6A";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(m.cx, m.cy, m.a, m.b, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // 绷紧的双绳 d1 与 d2（直接从 F1、F2 牵到笔尖）
    ctx.strokeStyle = "#D8727B";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(m.cx - m.c, m.cy);
    ctx.lineTo(m.px, m.py);
    ctx.lineTo(m.cx + m.c, m.cy);
    ctx.stroke();

    // 两段绳长标签
    ctx.fillStyle = "#8C2F3C";
    ctx.font = `600 11px "Chivo", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const r1 = (m.d1 / (2 * m.a) * 100).toFixed(0);
    const r2 = (100 - Number(r1)).toFixed(0);
    ctx.fillText(`d1 ${r1}%`, (m.cx - m.c + m.px) / 2, (m.cy + m.py) / 2 - 9);
    ctx.fillText(`d2 ${r2}%`, (m.cx + m.c + m.px) / 2, (m.cy + m.py) / 2 - 9);

    // 两枚珊瑚图钉 F1 / F2
    for (const [fx, name] of [[m.cx - m.c, "F1"], [m.cx + m.c, "F2"]]) {
      ctx.fillStyle = "#3B2136";
      ctx.beginPath();
      ctx.arc(fx, m.cy, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#FCEFE8";
      ctx.beginPath();
      ctx.arc(fx, m.cy, 2.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#3B2136";
      ctx.font = `700 11px "Chivo", sans-serif`;
      ctx.fillText(name, fx, m.cy + 18);
    }

    // 笔尖点
    ctx.fillStyle = "#2D6F6A";
    ctx.strokeStyle = "#FFFBF8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(m.px, m.py, 7.5, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // 顶角提示
    ctx.fillStyle = "#5A4254";
    ctx.font = `600 11px "Chivo", "Noto Serif SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`a/b = ${m.ratio.toFixed(2)}:1   e = ${ecc.toFixed(2)}`, 14, 18);

    ctx.restore();
  }

  const ctl = loop(canvas, draw);
  syncText();

  eccInput.addEventListener("input", () => {
    ecc = clamp(Number(eccInput.value), 0.05, 0.94);
    syncText();
    ctl.draw();
  });

  pauseBtn?.addEventListener("click", () => {
    playing = !playing;
    pauseBtn.textContent = playing ? "暂停笔尖绕行" : "继续笔尖绕行";
    ctl.draw();
  });

  // 在画布上直接拖 F1/F2 图钉或拖笔尖
  canvas.addEventListener("pointerdown", (ev) => {
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const m = metrics();
    if (Math.hypot(x - m.px, y - m.py) < 26) {
      dragging = "nib";
    } else if (Math.hypot(x - (m.cx - m.c), y - m.cy) < 26 || Math.hypot(x - (m.cx + m.c), y - m.cy) < 26) {
      dragging = "pin";
    } else {
      dragging = "pin";
    }
    canvas.setPointerCapture(ev.pointerId);
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const m = metrics();
    if (dragging === "nib") {
      theta = Math.atan2((y - m.cy) / Math.max(20, m.b), (x - m.cx) / Math.max(20, m.a));
    } else {
      ecc = clamp(Math.abs(x - m.cx) / m.a, 0.05, 0.94);
      eccInput.value = ecc.toFixed(2);
      syncText();
    }
    ctl.draw();
  });

  const end = () => { dragging = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  window.addEventListener("resize", () => ctl.draw());
}

/* ==================== 02 五重视觉语言 · 竖帘对照器 ==================== */
const QUALITIES = {
  softness: {
    zh: "柔和",
    en: "SOFTNESS",
    quote: "曲线过渡，减少视觉冲突，舒适自然。",
    leftNote: "左（硬直角框）：视线每到 90° 转角必须急刹转向，视觉摩擦感强。",
    rightNote: "右（椭圆柔弧）：切线方向处处连续渐变，眼动滑行流畅无撞角。",
    takeaway: "把矩形的四个直角熔成连续弧线后，即便信息量相同，观者的生理紧绷感也会显著回落。",
  },
  enclosure: {
    zh: "包裹",
    en: "ENCLOSURE",
    quote: "形成视觉容器，突出主体，增强聚焦。",
    leftNote: "左（零散平铺）：元素和四周空白混作一片，没有明确的怀抱边界。",
    rightNote: "右（椭圆容器）：连续闭环把山影、孤舟与留白拢进同一视觉容器中。",
    takeaway: "格式塔心理学中的「闭合律」让大脑自动把椭圆内部认作完整一体的舞台，主体无需放大也能跳出来。",
  },
  guidance: {
    zh: "引导",
    en: "GUIDANCE",
    quote: "顺应椭圆的方向，自然引导视线流动。",
    leftNote: "左（水平僵排）：视线上来只能左右横跳，缺少主次纵深推进。",
    rightNote: "右（长轴双焦）：沿斜向长轴从下焦孤舟牵引至上焦标题，动线浑然天成。",
    takeaway: "长轴就是椭圆藏在曲率里的指路箭头：横放舒展、竖放升腾、斜放优雅流动。",
  },
  elegance: {
    zh: "优雅",
    en: "ELEGANCE",
    quote: "比例修长，节奏舒缓，传达高级与平衡之美。",
    leftNote: "左（粗笨方格）：四边等距切分，秩序有余而韵律偏硬。",
    rightNote: "右（修长椭环）：约 1.4:1 的比例配深紫梅新月厚沿，厚薄交替自带节奏。",
    takeaway: "椭圆的曲率从短轴的平缓渐变为长轴两端的紧凑，本身就藏着慢—快—慢的古典韵律。",
  },
  flow: {
    zh: "流动",
    en: "FLOW",
    quote: "连续的曲线节奏，带来动态与生命力。",
    leftNote: "左（断续折线）：视线读完底角便停滞出框，缺乏回旋余味。",
    rightNote: "右（外弧回环）：配合两道珊瑚虚线导流弧，视线读完标题顺势回落孤舟。",
    takeaway: "闭合椭圆配上外围呼应的轻盈弧线，能让观者在画面里多停留一圈，形成温柔的视线闭环。",
  },
};

export function mountCurtainLab() {
  const stage = document.getElementById("curtain-stage");
  const range = document.getElementById("curtain-range");
  const veil = document.getElementById("curtain-after");
  const handle = document.getElementById("curtain-handle");
  const pctLabel = document.getElementById("curtain-pct");
  const quoteEl = document.getElementById("curtain-quote");
  const leftEl = document.getElementById("curtain-left-note");
  const rightEl = document.getElementById("curtain-right-note");
  const takeEl = document.getElementById("curtain-takeaway");
  const btns = [...document.querySelectorAll("[data-quality]")];
  if (!stage || !range || !veil || !handle) return;

  let split = 54;

  function applySplit(v) {
    split = clamp(v, 8, 92);
    range.value = String(Math.round(split));
    veil.style.clipPath = `inset(0 0 0 ${split}%)`;
    handle.style.left = `${split}%`;
    pctLabel.textContent = `椭圆覆盖 ${Math.round(100 - split)}%`;
  }

  function selectQuality(key) {
    const q = QUALITIES[key] || QUALITIES.softness;
    btns.forEach((b) => {
      const on = b.dataset.quality === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stage.dataset.lens = key;
    quoteEl.textContent = `「${q.quote}」`;
    leftEl.textContent = q.leftNote;
    rightEl.textContent = q.rightNote;
    takeEl.textContent = q.takeaway;
  }

  applySplit(split);
  selectQuality("softness");

  range.addEventListener("input", () => applySplit(Number(range.value)));
  btns.forEach((b) => b.addEventListener("click", () => selectQuality(b.dataset.quality)));

  let dragging = false;
  const moveFromEvent = (ev) => {
    const r = stage.getBoundingClientRect();
    const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    applySplit((x / Math.max(1, r.width)) * 100);
  };
  stage.addEventListener("pointerdown", (ev) => {
    dragging = true;
    stage.setPointerCapture(ev.pointerId);
    moveFromEvent(ev);
  });
  stage.addEventListener("pointermove", (ev) => { if (dragging) moveFromEvent(ev); });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });
}

/* ==================== 03 历代椭圆骨架透视廊 ==================== */
const ERAS = {
  serlio: {
    year: "1545",
    name: "塞利奥《建筑全书》第一卷",
    place: "巴黎 · Il primo libro d'architettura",
    ratio: "四心圆规作图 · 约 1.38:1",
    desc: "意大利建筑理论家塞巴斯蒂亚诺·塞利奥（Sebastiano Serlio）在 1545 年出版的第一卷几何篇里，首次用木刻图示公开了用圆规画不同比例椭圆（四心卵圆）的实用方法，把过去秘传的石匠几何变成欧洲建筑与版面设计的通用语言。",
    svg: `<svg viewBox="0 0 420 260" aria-label="1545 塞利奥四心椭圆作图示意">
      <rect x="12" y="12" width="396" height="236" fill="none" stroke="rgba(247,161,168,0.22)" stroke-dasharray="4 4"/>
      <line x1="40" y1="130" x2="380" y2="130" stroke="rgba(247,161,168,0.38)" stroke-dasharray="5 4"/>
      <line x1="210" y1="24" x2="210" y2="236" stroke="rgba(247,161,168,0.38)" stroke-dasharray="5 4"/>
      <circle cx="152" cy="130" r="78" fill="none" stroke="rgba(126,205,197,0.45)" stroke-dasharray="4 4"/>
      <circle cx="268" cy="130" r="78" fill="none" stroke="rgba(126,205,197,0.45)" stroke-dasharray="4 4"/>
      <line x1="210" y1="42" x2="152" y2="130" stroke="rgba(247,161,168,0.55)" stroke-width="1.2"/>
      <line x1="210" y1="42" x2="268" y2="130" stroke="rgba(247,161,168,0.55)" stroke-width="1.2"/>
      <line x1="210" y1="218" x2="152" y2="130" stroke="rgba(247,161,168,0.55)" stroke-width="1.2"/>
      <line x1="210" y1="218" x2="268" y2="130" stroke="rgba(247,161,168,0.55)" stroke-width="1.2"/>
      <ellipse cx="210" cy="130" rx="136" ry="90" fill="rgba(126,205,197,0.10)" stroke="#7ECDC5" stroke-width="2.5"/>
      <circle cx="152" cy="130" r="5" fill="#F7A1A8"/><circle cx="268" cy="130" r="5" fill="#F7A1A8"/>
      <circle cx="210" cy="42" r="4.5" fill="#FCEFE8"/><circle cx="210" cy="218" r="4.5" fill="#FCEFE8"/>
      <text x="152" y="150" fill="#F7A1A8" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">O1</text>
      <text x="268" y="150" fill="#F7A1A8" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">O2</text>
      <text x="224" y="45" fill="#FCEFE8" font-size="11" font-family="Chivo, sans-serif">O3</text>
      <text x="224" y="222" fill="#FCEFE8" font-size="11" font-family="Chivo, sans-serif">O4</text>
    </svg>`,
  },
  hilliard: {
    year: "1570s",
    name: "希利亚德的都铎椭圆细密画",
    place: "伦敦 · V&A 国家肖像细密画馆藏",
    ratio: "竖立肖像盒 · 约 1.28:1",
    desc: "英国宫廷细密画大师尼古拉斯·希利亚德（Nicholas Hilliard）在 1570 年代起确立了经典的随身椭圆肖像盒：画在羊皮纸上的微型肖像嵌进可贴身佩戴的椭圆金匣，弧框恰好贴合头肩线条，完全省去了矩形画框多余的四个生硬角落。",
    svg: `<svg viewBox="0 0 420 260" aria-label="1570年代 希利亚德椭圆肖像盒结构示意">
      <ellipse cx="210" cy="130" rx="84" ry="108" fill="none" stroke="rgba(247,161,168,0.45)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <ellipse cx="210" cy="130" rx="72" ry="96" fill="rgba(247,161,168,0.10)" stroke="#F7A1A8" stroke-width="2.6"/>
      <ellipse cx="210" cy="130" rx="64" ry="88" fill="none" stroke="rgba(252,239,232,0.45)" stroke-width="1"/>
      <circle cx="210" cy="96" r="24" fill="none" stroke="#7ECDC5" stroke-dasharray="3 3" stroke-width="1.4"/>
      <path d="M174 202 Q180 156 202 146 L202 132 C188 124 186 102 195 88 C202 78 218 78 225 88 C234 102 232 124 218 132 L218 146 Q240 156 246 202 Z" fill="rgba(252,239,232,0.82)"/>
      <circle cx="210" cy="96" r="4" fill="#F7A1A8"/>
      <text x="296" y="100" fill="#7ECDC5" font-size="11" font-family="Chivo, sans-serif">上焦区 · 头部落位</text>
      <line x1="236" y1="96" x2="290" y2="96" stroke="#7ECDC5" stroke-width="1"/>
      <text x="296" y="182" fill="#F7A1A8" font-size="11" font-family="Chivo, sans-serif">贴合肩颈弧线</text>
      <line x1="248" y1="178" x2="290" y2="178" stroke="#F7A1A8" stroke-width="1"/>
    </svg>`,
  },
  borromini: {
    year: "1638–1641",
    name: "博罗米尼 · 四喷泉圣卡洛教堂",
    place: "罗马 · San Carlo alle Quattro Fontane",
    ratio: "纵贯椭圆穹顶 · 约 1.52:1",
    desc: "弗朗切斯科·博罗米尼（Francesco Borromini）在极其狭小的罗马街角用地里，用起伏波浪的椭圆平面与 1638–1641 年间落成的高耸蜂窝椭圆穹顶，彻底取代文艺复兴时期静止的正圆穹顶——让光线与空间沿着主轴向前流动升腾。",
    svg: `<svg viewBox="0 0 420 260" aria-label="1638 博罗米尼四喷泉圣卡洛教堂椭圆穹顶平面">
      <line x1="50" y1="130" x2="370" y2="130" stroke="rgba(247,161,168,0.35)" stroke-dasharray="5 4"/>
      <line x1="210" y1="22" x2="210" y2="238" stroke="rgba(247,161,168,0.35)" stroke-dasharray="5 4"/>
      <ellipse cx="210" cy="130" rx="134" ry="86" fill="rgba(126,205,197,0.09)" stroke="#7ECDC5" stroke-width="2.4"/>
      <ellipse cx="210" cy="130" rx="104" ry="64" fill="none" stroke="rgba(126,205,197,0.55)" stroke-width="1.3" stroke-dasharray="5 4"/>
      <ellipse cx="210" cy="130" rx="68" ry="42" fill="none" stroke="rgba(247,161,168,0.75)" stroke-width="1.4"/>
      <ellipse cx="210" cy="130" rx="28" ry="18" fill="rgba(252,239,232,0.22)" stroke="#FCEFE8" stroke-width="1.6"/>
      <path d="M76 130 C76 80 128 54 162 56 C188 58 196 42 210 42 C224 42 232 58 258 56 C292 54 344 80 344 130 C344 180 292 206 258 204 C232 202 224 218 210 218 C196 218 188 202 162 204 C128 206 76 180 76 130 Z" fill="none" stroke="#F7A1A8" stroke-width="1.6"/>
      <text x="210" y="246" fill="#FCEFE8" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">起伏壁面 + 纵长椭圆穹顶（打破正圆静止对称）</text>
    </svg>`,
  },
  bernini: {
    year: "1656–1667",
    name: "贝尼尼 · 圣彼得广场椭圆柱廊",
    place: "梵蒂冈 · Piazza San Pietro",
    ratio: "横向怀抱椭圆 · Piazza Obliqua",
    desc: "吉安·洛伦佐·贝尼尼（Gian Lorenzo Bernini）以方尖碑为中心展开巨大的横向椭圆广场，两侧四排立柱弯成宏阔弧臂——他将其喻为「张开怀抱的双臂」。这正是 048 海报所说「包裹」与「引导」在真实空间里的经典原型。",
    svg: `<svg viewBox="0 0 420 260" aria-label="1656 贝尼尼圣彼得广场横向椭圆柱廊平面">
      <path d="M126 52 L294 52 L274 96 L146 96 Z" fill="rgba(252,239,232,0.08)" stroke="rgba(252,239,232,0.45)" stroke-width="1.4"/>
      <text x="210" y="76" fill="#FCEFE8" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">梯形前庭 · 聚向主立面</text>
      <path d="M140 100 A138 72 0 0 0 140 220" fill="none" stroke="#7ECDC5" stroke-width="12" stroke-linecap="round" opacity="0.28"/>
      <path d="M280 100 A138 72 0 0 1 280 220" fill="none" stroke="#7ECDC5" stroke-width="12" stroke-linecap="round" opacity="0.28"/>
      <path d="M140 100 A138 72 0 0 0 140 220" fill="none" stroke="#7ECDC5" stroke-width="2.4" stroke-dasharray="4 4"/>
      <path d="M280 100 A138 72 0 0 1 280 220" fill="none" stroke="#7ECDC5" stroke-width="2.4" stroke-dasharray="4 4"/>
      <circle cx="210" cy="160" r="6" fill="#FCEFE8"/>
      <circle cx="144" cy="160" r="4.5" fill="#F7A1A8"/>
      <circle cx="276" cy="160" r="4.5" fill="#F7A1A8"/>
      <text x="144" y="182" fill="#F7A1A8" font-size="10.5" text-anchor="middle" font-family="Chivo, sans-serif">喷泉 F1</text>
      <text x="276" y="182" fill="#F7A1A8" font-size="10.5" text-anchor="middle" font-family="Chivo, sans-serif">喷泉 F2</text>
      <text x="210" y="144" fill="#FCEFE8" font-size="10.5" text-anchor="middle" font-family="Chivo, sans-serif">方尖碑</text>
    </svg>`,
  },
  arnheim: {
    year: "1982",
    name: "阿恩海姆《中心的力量》",
    place: "加州大学出版社 · The Power of the Center",
    ratio: "向心 × 离心双焦力场",
    desc: "艺术心理学家鲁道夫·阿恩海姆（Rudolf Arnheim）在 1982 年出版的《中心的力量》里指出：正圆和正方形把重心锁死在唯一的绝对中央，而椭圆凭借拉长的轴线与双焦点释放出方向张力——这解释了为什么椭圆构图既稳定包裹、又绝不死板。",
    svg: `<svg viewBox="0 0 420 260" aria-label="1982 阿恩海姆椭圆双焦力场示意">
      <g transform="rotate(-24 210 130)">
        <ellipse cx="210" cy="130" rx="136" ry="82" fill="rgba(247,161,168,0.08)" stroke="#F7A1A8" stroke-width="2.4"/>
        <line x1="74" y1="130" x2="346" y2="130" stroke="rgba(126,205,197,0.55)" stroke-dasharray="5 4"/>
        <circle cx="136" cy="130" r="24" fill="rgba(126,205,197,0.22)" stroke="#7ECDC5" stroke-width="1.8"/>
        <circle cx="284" cy="130" r="18" fill="rgba(247,161,168,0.22)" stroke="#F7A1A8" stroke-width="1.8"/>
        <path d="M164 130 L260 130" stroke="#FCEFE8" stroke-width="1.8" stroke-dasharray="3 3"/>
        <circle cx="136" cy="130" r="4" fill="#7ECDC5"/>
        <circle cx="284" cy="130" r="4" fill="#F7A1A8"/>
      </g>
      <text x="148" y="218" fill="#7ECDC5" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">主锚点 · 稳重落脚</text>
      <text x="292" y="66" fill="#F7A1A8" font-size="11" text-anchor="middle" font-family="Chivo, sans-serif">副锚点 · 呼应牵引</text>
    </svg>`,
  },
};

export function mountHistoryStepper() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const yr = document.getElementById("era-year");
  const title = document.getElementById("era-title");
  const place = document.getElementById("era-place");
  const ratio = document.getElementById("era-ratio");
  const desc = document.getElementById("era-desc");
  const svgBox = document.getElementById("era-svg");
  if (!btns.length || !svgBox) return;

  function show(key) {
    const e = ERAS[key] || ERAS.serlio;
    btns.forEach((b) => {
      const on = b.dataset.era === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    yr.textContent = e.year;
    title.textContent = e.name;
    place.textContent = e.place;
    ratio.textContent = e.ratio;
    desc.textContent = e.desc;
    svgBox.innerHTML = e.svg;
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("serlio");
}

/* ==================== 04 五类应用场景 × 顺形留白检验台 ==================== */
const DOMAINS = {
  photo: {
    label: "摄影构图",
    noteGood: "镜头前景花枝或暗角自然围成柔弧椭圆，主人物或孤舟落在偏心焦区，四角暗退而不硬切曲线。",
    noteBad: "强行套上硬边椭圆形遮罩并放大顶破画框，上下弧顶被裁平，显得生硬像廉价贴图。",
    goodSvg: `<svg viewBox="0 0 360 220" aria-label="摄影构图顺形留白示例">
      <rect width="360" height="220" fill="#F9ECE6"/>
      <ellipse cx="180" cy="110" rx="134" ry="84" fill="#D4E2DE" stroke="#2D6F6A" stroke-width="2"/>
      <path d="M46 132 Q118 70 184 108 Q250 84 314 132 L314 194 L46 194 Z" fill="#5A837E" clip-path="url(#d-clip-p1)"/>
      <defs><clipPath id="d-clip-p1"><ellipse cx="180" cy="110" rx="134" ry="84"/></clipPath></defs>
      <ellipse cx="136" cy="128" rx="22" ry="6" fill="#1F3B3A"/>
      <circle cx="242" cy="76" r="14" fill="#FCEFE8"/>
      <text x="180" y="210" fill="#1E5954" font-size="11" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">完整椭圆窗 + 四周顺形透气</text>
    </svg>`,
    badSvg: `<svg viewBox="0 0 360 220" aria-label="摄影构图硬切破环反例">
      <rect width="360" height="220" fill="#F9ECE6"/>
      <defs><clipPath id="d-clip-p2"><rect x="10" y="10" width="340" height="200"/></clipPath></defs>
      <g clip-path="url(#d-clip-p2)">
        <ellipse cx="180" cy="110" rx="166" ry="126" fill="#D4E2DE" stroke="#B02A3E" stroke-width="2.5"/>
        <ellipse cx="180" cy="110" rx="22" ry="6" fill="#1F3B3A"/>
      </g>
      <line x1="110" y1="10" x2="250" y2="10" stroke="#B02A3E" stroke-width="3.5"/>
      <line x1="110" y1="210" x2="250" y2="210" stroke="#B02A3E" stroke-width="3.5"/>
      <text x="180" y="28" fill="#B02A3E" font-size="11" font-weight="700" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 上下弧顶被画幅直接削平</text>
    </svg>`,
  },
  poster: {
    label: "海报设计",
    noteGood: "斜置椭圆主窗与标题字组错落呼吸，外圈细虚弧牵引视线从主题顺流到底部展期信息。",
    noteBad: "椭圆左右贴死裁切线，四角还硬塞满矩形公告栏，曲线轮廓被切割得支离破碎。",
    goodSvg: `<svg viewBox="0 0 360 220" aria-label="海报设计顺形留白示例">
      <rect width="360" height="220" fill="#FCEFE8"/>
      <g transform="rotate(-18 196 112)">
        <ellipse cx="204" cy="114" rx="100" ry="64" fill="#F6CFCB"/>
        <ellipse cx="196" cy="112" rx="100" ry="64" fill="#E6EFEA" stroke="#3B2136" stroke-width="2.2"/>
      </g>
      <rect x="26" y="42" width="66" height="10" rx="5" fill="#3B2136"/>
      <rect x="26" y="60" width="46" height="6" rx="3" fill="#D8727B"/>
      <circle cx="164" cy="126" r="18" fill="#2D6F6A"/>
      <rect x="206" y="80" width="54" height="8" rx="4" fill="#3B2136"/>
      <rect x="206" y="94" width="42" height="5" rx="2.5" fill="#745B6D"/>
      <text x="180" y="208" fill="#1E5954" font-size="11" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">斜置椭圆完整呼吸 · 图文双焦平衡</text>
    </svg>`,
    badSvg: `<svg viewBox="0 0 360 220" aria-label="海报设计硬切反例">
      <rect width="360" height="220" fill="#FCEFE8"/>
      <ellipse cx="180" cy="110" rx="140" ry="86" fill="#E6EFEA" stroke="#B02A3E" stroke-width="2"/>
      <rect x="14" y="14" width="118" height="54" fill="rgba(176,42,62,0.16)" stroke="#B02A3E" stroke-dasharray="4 3"/>
      <rect x="228" y="152" width="118" height="54" fill="rgba(176,42,62,0.16)" stroke="#B02A3E" stroke-dasharray="4 3"/>
      <text x="73" y="45" fill="#B02A3E" font-size="10.5" font-weight="700" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 硬角切入弧缘</text>
      <text x="287" y="182" fill="#B02A3E" font-size="10.5" font-weight="700" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 破坏包裹感</text>
    </svg>`,
  },
  magazine: {
    label: "杂志排版",
    noteGood: "跨页正文借 CSS shape-outside 或手调逐行缩进顺着椭圆外弧绕排，图文像流水一样贴合。",
    noteBad: "放了椭圆插图却仍用死板直角文字盒围在外面，四角漏出巨大三角死白、行尾参差割裂。",
    goodSvg: `<svg viewBox="0 0 360 220" aria-label="杂志排版顺形绕排示例">
      <rect width="360" height="220" fill="#FDF8F4"/>
      <line x1="180" y1="12" x2="180" y2="208" stroke="rgba(64,40,63,0.18)"/>
      <ellipse cx="120" cy="110" rx="68" ry="84" fill="#DCE9E5" stroke="#2D6F6A" stroke-width="2"/>
      <g fill="#5A4254">
        <rect x="196" y="42" width="132" height="6" rx="3"/>
        <rect x="206" y="58" width="122" height="6" rx="3"/>
        <rect x="214" y="74" width="114" height="6" rx="3"/>
        <rect x="218" y="90" width="110" height="6" rx="3"/>
        <rect x="220" y="106" width="108" height="6" rx="3"/>
        <rect x="218" y="122" width="110" height="6" rx="3"/>
        <rect x="212" y="138" width="116" height="6" rx="3"/>
        <rect x="202" y="154" width="126" height="6" rx="3"/>
        <rect x="192" y="170" width="136" height="6" rx="3"/>
      </g>
      <text x="180" y="208" fill="#1E5954" font-size="11" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">文字左缘顺椭圆外弧阶梯绕排</text>
    </svg>`,
    badSvg: `<svg viewBox="0 0 360 220" aria-label="杂志排版直角文字盒反例">
      <rect width="360" height="220" fill="#FDF8F4"/>
      <ellipse cx="114" cy="110" rx="68" ry="84" fill="#DCE9E5" stroke="#B02A3E" stroke-width="2"/>
      <rect x="188" y="34" width="148" height="152" fill="none" stroke="#B02A3E" stroke-dasharray="4 3"/>
      <g fill="#5A4254">
        <rect x="196" y="44" width="132" height="6" rx="3"/>
        <rect x="196" y="60" width="132" height="6" rx="3"/>
        <rect x="196" y="76" width="132" height="6" rx="3"/>
        <rect x="196" y="92" width="132" height="6" rx="3"/>
        <rect x="196" y="108" width="132" height="6" rx="3"/>
        <rect x="196" y="124" width="132" height="6" rx="3"/>
        <rect x="196" y="140" width="132" height="6" rx="3"/>
        <rect x="196" y="156" width="132" height="6" rx="3"/>
      </g>
      <text x="180" y="208" fill="#B02A3E" font-size="11" font-weight="700" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 中腰贴死、上下漏出尴尬大三角空洞</text>
    </svg>`,
  },
  ui: {
    label: "界面设计",
    noteGood: "用在香氛、冥想、艺术导览等低密度引导页：一枚完整椭圆视窗配下方单行按钮，亲和从容。",
    noteBad: "把导航栏、输入表单和多列数据卡全塞进椭圆里，边角按钮要么被裁切、要么挤成一团。",
    goodSvg: `<svg viewBox="0 0 360 220" aria-label="界面设计椭圆引导卡示例">
      <rect width="360" height="220" fill="#EEF4F2"/>
      <rect x="112" y="12" width="136" height="196" rx="18" fill="#FFF8F4" stroke="#3B2136" stroke-width="2"/>
      <ellipse cx="180" cy="88" rx="46" ry="56" fill="#D5E4E0" stroke="#2D6F6A" stroke-width="1.8"/>
      <circle cx="172" cy="100" r="11" fill="#3B2136"/>
      <rect x="140" y="156" width="80" height="7" rx="3.5" fill="#3B2136"/>
      <rect x="148" y="172" width="64" height="20" rx="10" fill="#2D6F6A"/>
      <text x="180" y="185" fill="#FFF8F4" font-size="9.5" text-anchor="middle" font-family="Chivo, sans-serif">开始体验</text>
    </svg>`,
    badSvg: `<svg viewBox="0 0 360 220" aria-label="界面设计椭圆塞表单反例">
      <rect width="360" height="220" fill="#EEF4F2"/>
      <rect x="112" y="12" width="136" height="196" rx="18" fill="#FFF8F4" stroke="#B02A3E" stroke-width="2"/>
      <ellipse cx="180" cy="108" rx="58" ry="80" fill="rgba(176,42,62,0.08)" stroke="#B02A3E" stroke-width="1.8"/>
      <rect x="118" y="54" width="124" height="16" fill="#FCEFE8" stroke="#B02A3E"/>
      <rect x="118" y="80" width="124" height="16" fill="#FCEFE8" stroke="#B02A3E"/>
      <rect x="118" y="106" width="124" height="16" fill="#FCEFE8" stroke="#B02A3E"/>
      <rect x="118" y="132" width="124" height="16" fill="#FCEFE8" stroke="#B02A3E"/>
      <text x="180" y="200" fill="#B02A3E" font-size="10" font-weight="700" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 表单四角冲破椭圆弧线</text>
    </svg>`,
  },
  package: {
    label: "包装设计",
    noteGood: "香水瓶、茶罐或蜂蜜瓶的经典椭圆贴标：双层细环围住品名与产地，顺瓶身曲面显得克制高级。",
    noteBad: "把超长成分说明硬挤进过扁椭圆标里，上下字行贴边打架，反而显得局促廉价。",
    goodSvg: `<svg viewBox="0 0 360 220" aria-label="包装设计椭圆瓶贴示例">
      <rect width="360" height="220" fill="#FCEFE8"/>
      <rect x="130" y="34" width="100" height="166" rx="20" fill="#2D6F6A"/>
      <rect x="158" y="14" width="44" height="22" rx="4" fill="#3B2136"/>
      <ellipse cx="180" cy="120" rx="38" ry="52" fill="#FFF8F4" stroke="#D8727B" stroke-width="2"/>
      <ellipse cx="180" cy="120" rx="32" ry="45" fill="none" stroke="#3B2136" stroke-width="0.9"/>
      <text x="180" y="108" fill="#3B2136" font-size="13" font-weight="700" text-anchor="middle" font-family="Noto Serif SC, serif">青岚</text>
      <text x="180" y="128" fill="#A83B48" font-size="9" text-anchor="middle" font-family="Chivo, sans-serif">NO.048</text>
      <line x1="164" y1="138" x2="196" y2="138" stroke="#D8727B"/>
    </svg>`,
    badSvg: `<svg viewBox="0 0 360 220" aria-label="包装设计过扁塞字反例">
      <rect width="360" height="220" fill="#FCEFE8"/>
      <rect x="130" y="34" width="100" height="166" rx="20" fill="#2D6F6A"/>
      <rect x="158" y="14" width="44" height="22" rx="4" fill="#3B2136"/>
      <ellipse cx="180" cy="120" rx="46" ry="20" fill="#FFF8F4" stroke="#B02A3E" stroke-width="2"/>
      <rect x="140" y="108" width="80" height="5" fill="#B02A3E"/>
      <rect x="136" y="117" width="88" height="5" fill="#B02A3E"/>
      <rect x="142" y="126" width="76" height="5" fill="#B02A3E"/>
      <text x="180" y="182" fill="#FFF8F4" font-size="10" text-anchor="middle" font-family="Chivo, Noto Serif SC, sans-serif">× 过扁贴标挤死字行</text>
    </svg>`,
  },
};

export function mountDomainLab() {
  const btns = [...document.querySelectorAll("[data-domain]")];
  const modeBtns = [...document.querySelectorAll("[data-margin-demo]")];
  const svgWrap = document.getElementById("domain-svg");
  const noteEl = document.getElementById("domain-note");
  const statusEl = document.getElementById("domain-status");
  if (!btns.length || !svgWrap) return;

  let curDomain = "photo";
  let curMode = "good";

  function render() {
    const d = DOMAINS[curDomain] || DOMAINS.photo;
    btns.forEach((b) => {
      const on = b.dataset.domain === curDomain;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.marginDemo === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    svgWrap.innerHTML = curMode === "good" ? d.goodSvg : d.badSvg;
    noteEl.textContent = curMode === "good" ? d.noteGood : d.noteBad;
    statusEl.textContent = curMode === "good" ? `${d.label} · 顺形留白成立` : `${d.label} · 切边/硬角失格`;
    statusEl.dataset.tone = curMode === "good" ? "good" : "bad";
  }

  btns.forEach((b) => b.addEventListener("click", () => { curDomain = b.dataset.domain; render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { curMode = b.dataset.marginDemo; render(); }));
  render();
}

/* ==================== 05 什么时候别用 · 反例换方切换 ==================== */
export function mountAvoidToggle() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("[data-avoid-flip]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const showFix = card.dataset.state !== "fix";
      card.dataset.state = showFix ? "fix" : "bad";
      btn.setAttribute("aria-pressed", String(showFix));
      btn.textContent = showFix ? "看回误用椭圆的反例" : "看换对构图后的样子";
    });
  });
}

/* ==================== 06 眼力小练习（双轮单变量四选一） ==================== */
const QUIZ_ROUNDS = [
  {
    id: 1,
    prompt: "第 1 题（唯一变量：孤舟主体与标题在椭圆里的落位）——四张海报用完全相同的 1.42:1 斜置椭圆、完全相同的完整留白和字号，哪一张的双焦呼应最从容？",
    correct: "A",
    options: [
      {
        key: "A",
        label: "方案 A",
        sub: "组合一",
        reason: "正确。孤舟稳落在左下焦区、标题块呼应于右上焦区，沿椭圆长轴拉出轻盈的对角张力，弧缘四周也都有清晰呼吸余量。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="方案 A">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <g transform="rotate(-32 100 75)">
            <ellipse cx="100" cy="75" rx="76" ry="52" fill="#DAE6E2" stroke="#3B2136" stroke-width="1.8"/>
            ${reveal ? `<line x1="28" y1="75" x2="172" y2="75" stroke="#1E5954" stroke-dasharray="3 3"/><circle cx="62" cy="75" r="14" fill="none" stroke="#1E5954" stroke-width="1.2"/><circle cx="138" cy="75" r="14" fill="none" stroke="#1E5954" stroke-width="1.2"/>` : ""}
          </g>
          <ellipse cx="70" cy="96" rx="16" ry="4.5" fill="#183232"/>
          <path d="M72 94 L76 84 L80 94 Z" fill="#183232"/>
          <rect x="110" y="42" width="42" height="7" rx="3" fill="#3B2136"/>
          <rect x="110" y="53" width="32" height="4" rx="2" fill="#745B6D"/>
          <rect x="110" y="60" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "B",
        label: "方案 B",
        sub: "组合二",
        reason: "不够理想。孤舟钉在几何死正中、标题紧贴其正上方，既浪费了椭圆独有的双焦张力，也让左右两半显得空荡滞重。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="方案 B">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <g transform="rotate(-32 100 75)">
            <ellipse cx="100" cy="75" rx="76" ry="52" fill="#DAE6E2" stroke="#3B2136" stroke-width="1.8"/>
            ${reveal ? `<circle cx="100" cy="75" r="16" fill="none" stroke="#B02A3E" stroke-dasharray="3 2" stroke-width="1.5"/>` : ""}
          </g>
          <ellipse cx="100" cy="84" rx="16" ry="4.5" fill="#183232"/>
          <path d="M102 82 L106 72 L110 82 Z" fill="#183232"/>
          <rect x="79" y="50" width="42" height="7" rx="3" fill="#3B2136"/>
          <rect x="84" y="61" width="32" height="4" rx="2" fill="#745B6D"/>
          <rect x="86" y="68" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "C",
        label: "方案 C",
        sub: "组合三",
        reason: "单侧失重。孤舟和标题块挤在左下同一侧焦区，右上大片区域完全落空，整枚椭圆像船头压水一样向一侧倾斜。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="方案 C">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <g transform="rotate(-32 100 75)">
            <ellipse cx="100" cy="75" rx="76" ry="52" fill="#DAE6E2" stroke="#3B2136" stroke-width="1.8"/>
            ${reveal ? `<circle cx="62" cy="75" r="24" fill="rgba(176,42,62,0.14)" stroke="#B02A3E" stroke-dasharray="3 2"/>` : ""}
          </g>
          <ellipse cx="66" cy="100" rx="16" ry="4.5" fill="#183232"/>
          <path d="M68 98 L72 88 L76 98 Z" fill="#183232"/>
          <rect x="46" y="64" width="42" height="7" rx="3" fill="#3B2136"/>
          <rect x="46" y="75" width="32" height="4" rx="2" fill="#745B6D"/>
          <rect x="46" y="82" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "D",
        label: "方案 D",
        sub: "组合四",
        reason: "孤舟被推得太靠下端弧尖，紧贴着椭圆内壁，破坏了柔和包裹所必需的弧缘缓冲空间。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="方案 D">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <g transform="rotate(-32 100 75)">
            <ellipse cx="100" cy="75" rx="76" ry="52" fill="#DAE6E2" stroke="#3B2136" stroke-width="1.8"/>
            ${reveal ? `<circle cx="34" cy="75" r="14" fill="rgba(176,42,62,0.16)" stroke="#B02A3E" stroke-width="1.5"/>` : ""}
          </g>
          <ellipse cx="44" cy="112" rx="16" ry="4.5" fill="#183232"/>
          <path d="M46 110 L50 100 L54 110 Z" fill="#183232"/>
          <rect x="112" y="42" width="42" height="7" rx="3" fill="#3B2136"/>
          <rect x="112" y="53" width="32" height="4" rx="2" fill="#745B6D"/>
          <rect x="112" y="60" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
    ],
  },
  {
    id: 2,
    prompt: "第 2 题（唯一变量：椭圆长短轴比例与弧缘尺度）——四张封面的双焦位置与色彩完全一致，哪一张最符合椭圆构图的比例与顺形留白要求？",
    correct: "B",
    options: [
      {
        key: "A",
        label: "方案 A",
        sub: "轴比 1.04 : 1",
        reason: "过于接近正圆（1.04:1），缺乏椭圆应有的长短轴落差，看起来像没画圆的圆形构图。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="第 2 题 方案 A">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <ellipse cx="100" cy="75" rx="56" ry="54" fill="#E8D8D7" stroke="${reveal ? "#B02A3E" : "#3B2136"}" stroke-width="1.8"/>
          <circle cx="80" cy="84" r="12" fill="#2D6F6A"/>
          <rect x="104" y="52" width="34" height="6" rx="3" fill="#3B2136"/>
          <rect x="104" y="62" width="26" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "B",
        label: "方案 B",
        sub: "轴比 1.46 : 1（内收）",
        reason: "正确。1.46:1 的比例既有鲜明长轴方向又保留充裕内腔，四周留白顺应椭圆曲线完整无切口。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="第 2 题 方案 B">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <ellipse cx="100" cy="75" rx="76" ry="52" fill="#E8D8D7" stroke="${reveal ? "#1E5954" : "#3B2136"}" stroke-width="2"/>
          <circle cx="68" cy="82" r="12" fill="#2D6F6A"/>
          <rect x="108" y="58" width="38" height="6" rx="3" fill="#3B2136"/>
          <rect x="108" y="68" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "C",
        label: "方案 C",
        sub: "轴比 1.46 : 1（满幅）",
        reason: "比例本身不错，但尺度拉得太大，上下弧顶被外框直接削平，违反了「避免切割曲线完整性」的要点。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="第 2 题 方案 C">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <ellipse cx="100" cy="75" rx="116" ry="82" fill="#E8D8D7" stroke="${reveal ? "#B02A3E" : "#3B2136"}" stroke-width="2"/>
          ${reveal ? `<line x1="40" y1="2" x2="160" y2="2" stroke="#B02A3E" stroke-width="4"/><line x1="40" y1="148" x2="160" y2="148" stroke="#B02A3E" stroke-width="4"/>` : ""}
          <circle cx="64" cy="84" r="12" fill="#2D6F6A"/>
          <rect x="108" y="54" width="38" height="6" rx="3" fill="#3B2136"/>
          <rect x="108" y="64" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
      {
        key: "D",
        label: "方案 D",
        sub: "轴比 2.65 : 1",
        reason: "长短轴比被拉到 2.65:1，短轴过窄把主体和标题压迫得紧贴上下弧线，舒展反而变成了窒息感。",
        svg: (reveal) => `<svg viewBox="0 0 200 150" aria-label="第 2 题 方案 D">
          <rect width="200" height="150" fill="#FCEFE8"/>
          <ellipse cx="100" cy="75" rx="88" ry="33" fill="#E8D8D7" stroke="${reveal ? "#B02A3E" : "#3B2136"}" stroke-width="1.8"/>
          <circle cx="64" cy="78" r="12" fill="#2D6F6A"/>
          <rect x="106" y="64" width="38" height="6" rx="3" fill="#3B2136"/>
          <rect x="106" y="74" width="28" height="4" rx="2" fill="#745B6D"/>
        </svg>`,
      },
    ],
  },
];

export function mountQuiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  const roundBtns = [...document.querySelectorAll("[data-quiz-round]")];
  if (!grid || !promptEl) return;

  let roundIdx = 0;
  const picked = {};

  function render() {
    const q = QUIZ_ROUNDS[roundIdx];
    const chosen = picked[q.id] || null;

    roundBtns.forEach((b, i) => {
      const on = i === roundIdx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    promptEl.textContent = q.prompt;
    grid.innerHTML = q.options.map((opt) => {
      const isChosen = chosen === opt.key;
      const isRight = opt.key === q.correct;
      let cls = "quiz-card";
      if (chosen) {
        if (isRight) cls += " is-right";
        else if (isChosen) cls += " is-wrong";
      }
      return `<button type="button" class="${cls}" data-choice="${opt.key}" aria-pressed="${isChosen}">
        <span class="quiz-plate">${opt.svg(Boolean(chosen))}</span>
        <span class="quiz-meta">
          <strong>${opt.label}</strong>
          <span>${opt.sub}</span>
        </span>
      </button>`;
    }).join("");

    grid.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[q.id] = btn.dataset.choice;
        render();
      });
    });

    if (!chosen) {
      feedback.dataset.state = "idle";
      feedback.innerHTML = `<p>点击上面四张构图板中的任意一张作答，页面会立刻叠加双焦与弧缘辅助线并给出判断依据。</p>`;
    } else {
      const sel = q.options.find((o) => o.key === chosen);
      const right = q.options.find((o) => o.key === q.correct);
      const ok = chosen === q.correct;
      feedback.dataset.state = ok ? "ok" : "miss";
      feedback.innerHTML = ok
        ? `<p><strong>判断准确（${sel.label}）：</strong>${sel.reason}</p>`
        : `<p><strong>你选了 ${sel.label}：</strong>${sel.reason}</p><p><strong>更合适的是 ${right.label}：</strong>${right.reason}</p>`;
    }
  }

  roundBtns.forEach((b, i) => b.addEventListener("click", () => { roundIdx = i; render(); }));
  render();
}

/* ==================== 07 原海报放大、拖动、Esc 关闭看图灯箱 ==================== */
export function mountPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const modal = document.getElementById("poster-lightbox");
  const bigImg = document.getElementById("lightbox-img");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const closeBtn = document.getElementById("lb-close");
  const stage = document.getElementById("lb-stage");
  if (!posterImg || !modal || !bigImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = null;

  function updateTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!bigImg.src) bigImg.src = posterImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    updateTransform();
    modal.hidden = false;
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  posterImg.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (ev) => { if (ev.target === modal || ev.target === stage) close(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !modal.hidden) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = clamp(scale + 0.3, 0.7, 3.2); updateTransform(); });
  zoomOutBtn?.addEventListener("click", () => { scale = clamp(scale - 0.3, 0.7, 3.2); updateTransform(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; updateTransform(); });

  stage.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    scale = clamp(scale + (ev.deltaY < 0 ? 0.16 : -0.16), 0.7, 3.2);
    updateTransform();
  }, { passive: false });

  bigImg.addEventListener("pointerdown", (ev) => {
    ev.stopPropagation();
    dragging = { x: ev.clientX - tx, y: ev.clientY - ty };
    bigImg.setPointerCapture(ev.pointerId);
  });
  bigImg.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    tx = ev.clientX - dragging.x;
    ty = ev.clientY - dragging.y;
    updateTransform();
  });
  const stop = () => { dragging = null; };
  bigImg.addEventListener("pointerup", stop);
  bigImg.addEventListener("pointercancel", stop);
}
