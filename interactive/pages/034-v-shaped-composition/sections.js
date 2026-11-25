// 034 V形构图 — 正文各节独立交互模块
// 相邻两节不共用同一种控件做同一件事：
//   01 四态视线轨迹对比（按钮切态 + SVG 眼动轨迹）
//   02 正 V / 倒 V 物理翻转与底焦配重（翻转开关 + 底部配重档位 + SVG 力学平衡）
//   03 夹角与情绪暗室（连续滑杆 26°–145° + 2D Canvas 聚光纵深剖面）
//   04 四类仪式场景与 X 光 V 骨架（4 题材微海报 Tabs + 透视开关）
//   05 适用性自查清单（原生 checkbox 勾选 + 实时选型建议）
//   06 眼力小练习（2 道单变量单选辨析 + 几何标线揭晓）
//   07 原海报放大拖拽灯箱（draggable=false + 滚轮/按钮缩放 + Esc 关闭）

import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

/* ================= 01 视线轨迹对比 ================= */
const FLOW_MODES = {
  scatter: {
    name: "散落无导线",
    tier: "四散游移",
    paths: 4,
    note: "画面缺少斜向牵引，眼睛会在几个体量相近的色块间来回跳动，底部焦点没有获得优先权。",
    svg: `
      <rect x="46" y="42" width="68" height="44" fill="#D9C6CE" stroke="#8C6776" stroke-width="1.5"/>
      <rect x="278" y="54" width="64" height="42" fill="#D9C6CE" stroke="#8C6776" stroke-width="1.5"/>
      <rect x="64" y="168" width="56" height="38" fill="#D9C6CE" stroke="#8C6776" stroke-width="1.5"/>
      <polygon points="200,174 220,194 200,214 180,194" fill="#D14375"/>
      <path class="flow-ray" d="M80 64 Q180 40 310 75 Q240 135 92 186 Q150 155 200 194" fill="none" stroke="#9A1C4B" stroke-width="2" stroke-dasharray="6 5"/>
      <circle cx="80" cy="64" r="4.5" fill="#9A1C4B"/>
      <circle cx="310" cy="75" r="4.5" fill="#9A1C4B"/>
      <circle cx="92" cy="186" r="4.5" fill="#9A1C4B"/>
    `,
  },
  single: {
    name: "单条斜线",
    tier: "单侧外滑",
    paths: 1,
    note: "单条斜线确实能产生动势，但视线滑到底部后没有另一侧斜线兜住，容易顺着惯性直接溜出右下角。",
    svg: `
      <polygon points="26,20 72,20 230,224 214,224" fill="#D14375" opacity="0.28"/>
      <line x1="48" y1="22" x2="296" y2="236" stroke="#9A1C4B" stroke-width="2.5"/>
      <polygon points="200,174 220,194 200,214 180,194" fill="#D14375"/>
      <path class="flow-ray" d="M58 32 L200 194 L322 232" fill="none" stroke="#A81E2C" stroke-width="2.2" stroke-dasharray="6 5"/>
      <polygon points="326,233 313,225 316,238" fill="#A81E2C"/>
      <text x="318" y="214" text-anchor="end" font-size="11" fill="#A81E2C">惯性滑出画外</text>
    `,
  },
  parallel: {
    name: "平行双线",
    tier: "直穿不聚",
    paths: 2,
    note: "两条竖直平行线只是圈出一条走廊，通道上下同宽，视线向下穿过画面却不会在底部压缩聚拢。",
    svg: `
      <rect x="116" y="18" width="14" height="214" fill="#D14375" opacity="0.24"/>
      <rect x="270" y="18" width="14" height="214" fill="#D14375" opacity="0.24"/>
      <line x1="123" y1="22" x2="123" y2="230" stroke="#9A1C4B" stroke-width="2"/>
      <line x1="277" y1="22" x2="277" y2="230" stroke="#9A1C4B" stroke-width="2"/>
      <polygon points="200,174 220,194 200,214 180,194" fill="#D14375"/>
      <path class="flow-ray" d="M142 30 L142 224 M258 30 L258 224" fill="none" stroke="#9A1C4B" stroke-width="2" stroke-dasharray="6 5"/>
      <polygon points="142,229 137,218 147,218" fill="#9A1C4B"/>
      <polygon points="258,229 253,218 263,218" fill="#9A1C4B"/>
    `,
  },
  vee: {
    name: "V 形双线汇聚",
    tier: "强力锁焦",
    paths: 2,
    note: "左右两条斜线互为镜像夹持，各自的定向张力在底部相抵并叠加为向心锁焦力，视线沿着收窄通道稳稳停在底焦上。",
    svg: `
      <polygon points="18,22 66,22 200,194 186,194" fill="#D14375" opacity="0.32"/>
      <polygon points="382,22 334,22 200,194 214,194" fill="#D14375" opacity="0.32"/>
      <line x1="42" y1="22" x2="196" y2="190" stroke="#9A1C4B" stroke-width="2.4"/>
      <line x1="358" y1="22" x2="204" y2="190" stroke="#9A1C4B" stroke-width="2.4"/>
      <circle cx="200" cy="194" r="34" fill="none" stroke="#13664E" stroke-width="1.4" stroke-dasharray="4 4"/>
      <polygon points="200,170 224,194 200,218 176,194" fill="#D14375"/>
      <path class="flow-ray" d="M76 42 L182 174 M324 42 L218 174" fill="none" stroke="#13664E" stroke-width="2.2" stroke-dasharray="6 5"/>
      <polygon points="185,178 174,172 183,164" fill="#13664E"/>
      <polygon points="215,178 226,172 217,164" fill="#13664E"/>
      <text x="200" y="242" text-anchor="middle" font-size="11" font-weight="700" fill="#13664E">双线相抵 · 稳停焦心</text>
    `,
  },
};

export function initSection01() {
  const btns = [...document.querySelectorAll("[data-flow-btn]")];
  const svg = document.getElementById("flow-svg");
  const tierEl = document.getElementById("flow-tier");
  const titleEl = document.getElementById("flow-title");
  const descEl = document.getElementById("flow-desc");
  if (!svg || !btns.length) return;

  function render(key) {
    const m = FLOW_MODES[key] || FLOW_MODES.vee;
    btns.forEach((b) => {
      const active = b.dataset.flowBtn === key;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });
    svg.innerHTML = m.svg;
    tierEl.textContent = m.tier;
    tierEl.dataset.state = key === "vee" ? "ok" : "warn";
    titleEl.textContent = m.name;
    descEl.textContent = m.note;
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.flowBtn)));
  render("scatter"); // 不先给答案，开场先看散落无导线，鼓励点选对比
}

/* ================= 02 温和订正：正 V 上宽下窄与重心物理 ================= */
export function initSection02() {
  const orientBtns = [...document.querySelectorAll("[data-v-orient]")];
  const baseBtns = [...document.querySelectorAll("[data-v-base]")];
  const svg = document.getElementById("gravity-svg");
  const statusEl = document.getElementById("gravity-status");
  const titleEl = document.getElementById("gravity-title");
  const descEl = document.getElementById("gravity-desc");
  if (!svg) return;

  const st = { orient: "v-down", base: "none" }; // 默认展示「正 V + 空尖」摇晃态，呼应订正主题

  function render() {
    orientBtns.forEach((b) => {
      const on = b.dataset.vOrient === st.orient;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    baseBtns.forEach((b) => {
      const on = b.dataset.vBase === st.base;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });

    const isDown = st.orient === "v-down";
    const tilt = isDown ? (st.base === "none" ? -11 : st.base === "light" ? -5 : 0) : 0;
    const isStable = !isDown || st.base === "heavy";

    const geom = isDown
      ? `
        <g transform="rotate(${tilt} 200 186)">
          <polygon points="72,34 114,34 206,184 194,184" fill="#D14375" opacity="0.82"/>
          <polygon points="328,34 286,34 194,184 206,184" fill="#D14375" opacity="0.82"/>
          <line x1="72" y1="34" x2="328" y2="34" stroke="#9A1C4B" stroke-width="1.5" stroke-dasharray="4 4"/>
          <text x="200" y="24" text-anchor="middle" font-size="11" fill="#553F54">上宽 256 单位（视觉体量在上）</text>
          ${st.base === "none" ? `<circle cx="200" cy="186" r="5" fill="#A81E2C"/>` : ""}
          ${st.base === "light" ? `<polygon points="200,174 212,186 200,198 188,186" fill="#C73E6C" opacity="0.7"/>` : ""}
          ${st.base === "heavy" ? `
            <circle cx="200" cy="186" r="34" fill="none" stroke="#13664E" stroke-width="1.5" stroke-dasharray="4 4"/>
            <polygon points="200,160 226,186 200,212 174,186" fill="#D14375" stroke="#231026" stroke-width="1.5"/>
          ` : ""}
        </g>
        <line x1="40" y1="214" x2="360" y2="214" stroke="#553F54" stroke-width="1.5"/>
        <text x="200" y="236" text-anchor="middle" font-size="11" font-weight="700" fill="${isStable ? "#13664E" : "#A81E2C"}">
          ${st.base === "none" ? "尖端悬空独撑 · 稍偏即晃（倾角 -11°）" : st.base === "light" ? "底焦偏轻 · 仍感头重脚轻（倾角 -5°）" : "对称夹持 + 实焦压底 · 稳重且有仪式悬念"}
        </text>
      `
      : `
        <g>
          <polygon points="194,42 206,42 114,212 72,212" fill="#7E4266" opacity="0.72"/>
          <polygon points="206,42 194,42 286,212 328,212" fill="#7E4266" opacity="0.72"/>
          <line x1="72" y1="212" x2="328" y2="212" stroke="#13664E" stroke-width="2"/>
          <polygon points="200,34 214,48 200,62 186,48" fill="#13664E"/>
          <text x="200" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#13664E">视线向上升腾至顶点</text>
          <text x="200" y="236" text-anchor="middle" font-size="11" fill="#553F54">真正「底宽上窄」的是倒 V / 金字塔（∧）——靠宽底天然抗重力</text>
        </g>
      `;

    svg.innerHTML = geom;
    if (!isDown) {
      statusEl.textContent = "倒 V（∧）· 宽底天然稳";
      statusEl.dataset.state = "neutral";
      titleEl.textContent = "这才是「底宽上窄」：天然稳重，但视线往顶上走";
      descEl.textContent = "倒 V 形像山峰与金字塔，不用底部加焦点也站得极稳；但它的视觉动势朝上爬升，适合表现崇高、纪念碑感，而不是把注意力压到底部展品上。";
    } else if (st.base === "none") {
      statusEl.textContent = "正 V（∨）空尖 · 头重脚轻";
      statusEl.dataset.state = "err";
      titleEl.textContent = "正 V 是「上宽下窄」——底部空尖其实立不住";
      descEl.textContent = "原海报把正 V 写成「底宽上窄」是顺手说反了一点。正 V 像倒立的陀螺：上方两条斜翼宽阔沉重，若底部没有实质焦点托住，画面反而带着摇晃的不安定感。";
    } else if (st.base === "light") {
      statusEl.textContent = "正 V（∨）轻点 · 勉强拉住";
      statusEl.dataset.state = "warn";
      titleEl.textContent = "底焦太小，仍压不住上方双翼冲下来的分量";
      descEl.textContent = "底部放了一枚小图标，虽然接住了交点，但体量远小于上方斜翼与标题，视觉重量依然浮在半空，像针尖顶着重物。";
    } else {
      statusEl.textContent = "正 V（∨）实焦 · 对称锁稳";
      statusEl.dataset.state = "ok";
      titleEl.textContent = "正 V 的稳重，靠「对称夹持 + 底焦压舱」共同换来";
      descEl.textContent = "把视觉重量真正沉到底部焦点上，再用左右对称的斜翼把尖端夹正——既有向下俯冲的悬念张力，又有被稳稳接住的托底感，这正是仪式感的由来。";
    }
  }

  orientBtns.forEach((b) => b.addEventListener("click", () => { st.orient = b.dataset.vOrient; render(); }));
  baseBtns.forEach((b) => b.addEventListener("click", () => { st.base = b.dataset.vBase; render(); }));
  render();
}

/* ================= 03 夹角一变，情绪全变（深李紫聚光暗室 Canvas） ================= */
export function initSection03() {
  const canvas = document.getElementById("angle-canvas");
  const slider = document.getElementById("angle-range");
  const valEl = document.getElementById("angle-val");
  const moodEl = document.getElementById("angle-mood");
  const copyWidthEl = document.getElementById("angle-copy-band");
  const descEl = document.getElementById("angle-desc");
  const presetBtns = [...document.querySelectorAll("[data-angle-preset]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let deg = Number(slider.value) || 68;

  function classify(a) {
    if (a < 42) {
      return {
        mood: "尖锐紧绷",
        tone: "err",
        copyBand: "极窄（容字受限）",
        desc: "低于 42° 时 V 谷像锋利楔子直扎画底。Larson 等人（2009）发现尖锐下指 V 会诱发大脑警觉反应，适合悬疑、竞技预告，却不适合温和礼仪。",
      };
    }
    if (a <= 76) {
      return {
        mood: "庄重聚焦",
        tone: "ok",
        copyBand: "均衡（容标题+标语）",
        desc: "54°–76° 是发布会与颁奖礼最常用的庄重甜区：双斜线有清晰俯冲势能，中央 V 谷既能安放层级文字，底部交点也稳稳落在黄金下沉区。",
      };
    }
    if (a <= 104) {
      return {
        mood: "开阔礼遇",
        tone: "ok",
        copyBand: "宽展（容大标题组）",
        desc: "78°–104° 像展开的剧场大幕，锋利度下降、包容感增强。适合横向宽屏大屏、汽车或建筑发布，留出从容的顶部标题呼吸空间。",
      };
    }
    return {
      mood: "散淡失势",
      tone: "warn",
      copyBand: "浅平（交点上浮）",
      desc: "超过 105° 后两条斜线接近平躺，向下汇聚的向量迅速衰减，画面逐渐退化成普通水平分割，V 形特有的仪式聚焦几乎消失。",
    };
  }

  function updateUI() {
    const info = classify(deg);
    valEl.textContent = `${Math.round(deg)}°`;
    moodEl.textContent = info.mood;
    moodEl.dataset.tone = info.tone;
    copyWidthEl.textContent = info.copyBand;
    descEl.textContent = info.desc;
    presetBtns.forEach((b) => {
      const match = Math.abs(Number(b.dataset.anglePreset) - deg) <= 3;
      b.classList.toggle("is-active", match);
      b.setAttribute("aria-pressed", String(match));
    });
  }

  let aW = 560;
  let aH = 300;
  let aDpr = 1;
  let aNeedResize = true;
  function measureAngle() {
    const r = canvas.getBoundingClientRect();
    aW = Math.max(260, Math.round(r.width));
    aH = Math.max(200, Math.round(r.height));
    aDpr = pixelRatio(aW <= 540 ? 1.25 : 1.75);
    if (canvas.width !== Math.round(aW * aDpr) || canvas.height !== Math.round(aH * aDpr)) {
      canvas.width = Math.round(aW * aDpr);
      canvas.height = Math.round(aH * aDpr);
    }
    aNeedResize = false;
  }
  new ResizeObserver(() => { aNeedResize = true; }).observe(canvas);

  function drawFrame(t, _dt, { still }) {
    if (aNeedResize) measureAngle();
    const W = aW;
    const H = aH;
    const dpr = aDpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#120818";
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    // 随夹角实时计算交点深浅：越尖越深、越宽越浅
    const halfRad = (deg * 0.5 * Math.PI) / 180;
    const pivotY = H * 0.22;
    const pivotSpan = Math.min(W * 0.34, H * 0.56);
    const rawApexY = pivotY + pivotSpan / Math.max(0.2, Math.tan(halfRad));
    const apexY = clamp(rawApexY, H * 0.44, H * 0.92);

    // 轻量单圆底光（免除软件光栅径向渐变）
    const info = classify(deg);
    ctx.fillStyle = info.tone === "err" ? "rgba(255, 118, 108, 0.16)" : "rgba(220, 56, 116, 0.16)";
    ctx.beginPath();
    ctx.arc(cx, apexY, H * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // 中央文字安全谷高亮区
    const topHalfW = Math.min(W * 0.46, (apexY - H * 0.14) * Math.tan(halfRad));
    ctx.fillStyle = "rgba(248, 209, 174, 0.06)";
    ctx.beginPath();
    ctx.moveTo(cx - topHalfW, H * 0.14);
    ctx.lineTo(cx + topHalfW, H * 0.14);
    ctx.lineTo(cx, apexY);
    ctx.closePath();
    ctx.fill();

    // 画两条实测角度斜光束
    const rayLen = Math.hypot(W, H);
    const lx = cx - Math.sin(halfRad) * rayLen;
    const ly = apexY - Math.cos(halfRad) * rayLen;
    const rx = cx + Math.sin(halfRad) * rayLen;
    const ry = apexY - Math.cos(halfRad) * rayLen;

    const beamColor = info.tone === "err" ? "#FF8478" : info.tone === "warn" ? "#C48A9E" : "#DC3874";
    for (const [ex, ey, s] of [[lx, ly, -1], [rx, ry, 1]]) {
      const dx = apexY === ey ? 1 : cx - ex;
      const dy = apexY - ey;
      const l = Math.hypot(dx, dy) || 1;
      const nx = (-dy / l) * s;
      const ny = (dx / l) * s;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + nx * 36, ey + ny * 36);
      ctx.lineTo(cx + nx * 4, apexY + ny * 4);
      ctx.lineTo(cx, apexY);
      ctx.closePath();
      ctx.fillStyle = beamColor;
      ctx.globalAlpha = 0.78;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "#F8D1AE";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex + nx * 36, ey + ny * 36);
      ctx.lineTo(cx + nx * 4, apexY + ny * 4);
      ctx.stroke();
    }

    // 角度标弧
    const arcR = Math.min(H * 0.2, 54);
    ctx.strokeStyle = "#F8D1AE";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, apexY, arcR, -Math.PI * 0.5 - halfRad, -Math.PI * 0.5 + halfRad);
    ctx.stroke();

    // 弧内角度读数
    ctx.fillStyle = "#F8D1AE";
    ctx.font = `500 13px "DM Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(deg)}°`, cx, Math.max(24, apexY - arcR - 14));

    // 底部菱焦
    const dr = 16 + (still ? 0 : Math.sin(t * 2.2) * 1.2);
    ctx.fillStyle = info.tone === "err" ? "#FF8478" : "#E84B82";
    ctx.beginPath();
    ctx.moveTo(cx, apexY - dr);
    ctx.lineTo(cx + dr, apexY);
    ctx.lineTo(cx, apexY + dr);
    ctx.lineTo(cx - dr, apexY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FFEAD1";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 中央文字占位示意线（直观展示谷内能排几行多宽的字）
    const boxY = Math.max(H * 0.22, apexY * 0.44);
    const availW = Math.max(24, (apexY - boxY) * Math.tan(halfRad) * 1.4);
    const barW = Math.min(W * 0.58, availW);
    ctx.fillStyle = "rgba(248, 209, 174, 0.25)";
    ctx.fillRect(cx - barW * 0.5, boxY - 8, barW, 6);
    ctx.fillRect(cx - barW * 0.34, boxY + 4, barW * 0.68, 4);

    ctx.restore();
  }

  const handle = loop(canvas, drawFrame);

  slider.addEventListener("input", () => {
    deg = Number(slider.value);
    updateUI();
    handle.draw();
  });
  presetBtns.forEach((b) => {
    b.addEventListener("click", () => {
      deg = Number(b.dataset.anglePreset);
      slider.value = String(deg);
      updateUI();
      handle.draw();
    });
  });
  window.addEventListener("resize", () => handle.draw());
  updateUI();
  handle.draw();
}

/* ================= 04 四类仪式场景 + X 光隐形 V 骨架 ================= */
const SCENE_CASES = {
  keynote: {
    title: "发布会 · 引导关注重点",
    caption: "不必在海报上硬画两根粉红斜杠。用天花板斜向灯带与阶梯式倒三角排字，观众的视线会自然掉进底部的核心新品。",
    hiddenNote: "隐形骨架：左右两侧顶灯斜光 + 梯形缩进副标共同形成 68° 正 V，直指底部主机。",
    art: `
      <rect width="400" height="250" fill="#180C1E"/>
      <polygon points="0,0 130,0 194,186 176,186" fill="url(#scBeamA)" opacity="0.5"/>
      <polygon points="400,0 270,0 206,186 224,186" fill="url(#scBeamA)" opacity="0.5"/>
      <text x="200" y="42" text-anchor="middle" font-size="16" font-weight="700" fill="#F8D1AE">2026 秋季旗舰发布会</text>
      <text x="200" y="66" text-anchor="middle" font-size="10.5" fill="#C9B5A8">新一代光学模组与声学架构</text>
      <text x="200" y="88" text-anchor="middle" font-size="10" fill="#A68E9B">十月二十四日 · 现场直播</text>
      <ellipse cx="200" cy="204" rx="58" ry="12" fill="#D14375" opacity="0.28"/>
      <rect x="172" y="148" width="56" height="54" rx="4" fill="#2B1434" stroke="#F8D1AE" stroke-width="1.6"/>
      <circle cx="200" cy="175" r="14" fill="none" stroke="#F06A96" stroke-width="2"/>
      <circle cx="200" cy="175" r="5" fill="#F8D1AE"/>
    `,
    xray: `
      <line x1="68" y1="8" x2="200" y2="184" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <line x1="332" y1="8" x2="200" y2="184" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="200" cy="180" r="36" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
      <text x="200" y="234" text-anchor="middle" font-size="11" fill="#7BE8BF">隐形 V 角 70° · 锁死底部主机</text>
    `,
  },
  awards: {
    title: "颁奖典礼 · 营造仪式氛围",
    caption: "剧场左右幕幔、对称礼仪列柱与逐级收短的提名行文，共同构成高贵对称的漏斗空间，将全部荣耀交予谷底奖座。",
    hiddenNote: "隐形骨架：双侧帷幕边缘线 + 顶部星光阶梯排布，形成 62° 庄重窄 V。",
    art: `
      <rect width="400" height="250" fill="#160B1D"/>
      <path d="M0 0 L108 0 Q96 110 184 192 L0 250 Z" fill="#281230"/>
      <path d="M400 0 L292 0 Q304 110 216 192 L400 250 Z" fill="#281230"/>
      <text x="200" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="#F8D1AE">年度视觉设计盛典</text>
      <line x1="138" y1="56" x2="262" y2="56" stroke="#D14375" stroke-width="1.2"/>
      <text x="200" y="76" text-anchor="middle" font-size="10" fill="#E8CBAE">BEST EDITORIAL &amp; MOTION</text>
      <polygon points="200,136 218,164 206,196 226,208 174,208 194,196 182,164" fill="#F8D1AE"/>
      <circle cx="200" cy="176" r="42" fill="none" stroke="#D14375" stroke-width="1" stroke-dasharray="3 4"/>
    `,
    xray: `
      <line x1="94" y1="8" x2="200" y2="188" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <line x1="306" y1="8" x2="200" y2="188" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="200" cy="182" r="34" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
      <text x="200" y="234" text-anchor="middle" font-size="11" fill="#7BE8BF">帷幕轮廓暗藏 62° 对称 V · 托起奖座</text>
    `,
  },
  product: {
    title: "产品发布 · 突出核心亮点",
    caption: "单品海报最怕配饰喧宾夺主。让两束斜切光影与产品旁两列参数短签同时朝底中心倾斜，唯一的主角便毫无争议。",
    hiddenNote: "隐形骨架：产品两侧折光面 + 参数引导细线以 76° 宽 V 夹住单品。",
    art: `
      <rect width="400" height="250" fill="#1C0E24"/>
      <polygon points="0,38 56,38 200,194 182,194" fill="#D14375" opacity="0.34"/>
      <polygon points="400,38 344,38 200,194 218,194" fill="#D14375" opacity="0.34"/>
      <text x="58" y="64" font-size="10.5" fill="#F8D1AE">钛金属机身</text>
      <text x="342" y="64" text-anchor="end" font-size="10.5" fill="#F8D1AE">微米级声腔</text>
      <text x="200" y="42" text-anchor="middle" font-size="15" font-weight="700" fill="#F8D1AE">AURA ONE · 随身声学</text>
      <circle cx="200" cy="176" r="32" fill="#D14375"/>
      <circle cx="200" cy="176" r="19" fill="#180C1E" stroke="#F8D1AE" stroke-width="2"/>
      <circle cx="200" cy="176" r="6" fill="#F8D1AE"/>
    `,
    xray: `
      <line x1="36" y1="36" x2="200" y2="188" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <line x1="364" y1="36" x2="200" y2="188" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="200" cy="176" r="38" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
      <text x="200" y="234" text-anchor="middle" font-size="11" fill="#7BE8BF">宽幕 78° 折光 V · 零竞争单品焦点</text>
    `,
  },
  brand: {
    title: "品牌宣传 · 传递权威与信赖",
    caption: "建筑纵深立面与对称台阶把天空剪出清晰 V 谷，品牌徽记沉稳地压在谷底地平线上，带来纪念碑式的可靠感。",
    hiddenNote: "隐形骨架：左右建筑檐口透视线在 72° 处收于品牌徽章。",
    art: `
      <rect width="400" height="250" fill="#170B1F"/>
      <polygon points="0,12 162,158 162,250 0,250" fill="#2D1536" stroke="#6E3054" stroke-width="1"/>
      <polygon points="400,12 238,158 238,250 400,250" fill="#2D1536" stroke="#6E3054" stroke-width="1"/>
      <line x1="0" y1="54" x2="162" y2="176" stroke="#8C4266" stroke-width="1"/>
      <line x1="400" y1="54" x2="238" y2="176" stroke="#8C4266" stroke-width="1"/>
      <text x="200" y="46" text-anchor="middle" font-size="15" font-weight="700" fill="#F8D1AE">百年建筑营造所</text>
      <text x="200" y="68" text-anchor="middle" font-size="10" fill="#C9B5A8">SINCE 1924 · STRUCTURAL CRAFT</text>
      <polygon points="200,154 226,180 200,206 174,180" fill="#D14375" stroke="#F8D1AE" stroke-width="1.8"/>
      <text x="200" y="184" text-anchor="middle" font-size="11" font-weight="700" fill="#FFF3E4">M</text>
    `,
    xray: `
      <line x1="20" y1="28" x2="200" y2="180" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <line x1="380" y1="28" x2="200" y2="180" stroke="#7BE8BF" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="200" cy="180" r="34" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
      <text x="200" y="234" text-anchor="middle" font-size="11" fill="#7BE8BF">建筑檐口 74° 自然汇交 · 权威压舱</text>
    `,
  },
};

export function initSection04() {
  const tabs = [...document.querySelectorAll("[data-case-tab]")];
  const xrayBtn = document.getElementById("xray-toggle");
  const svg = document.getElementById("case-svg");
  const titleEl = document.getElementById("case-title");
  const capEl = document.getElementById("case-caption");
  const noteEl = document.getElementById("case-xray-note");
  if (!svg || !tabs.length) return;

  let cur = "keynote";
  let xray = false;

  function render() {
    const c = SCENE_CASES[cur];
    tabs.forEach((t) => {
      const on = t.dataset.caseTab === cur;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    xrayBtn.setAttribute("aria-pressed", String(xray));
    xrayBtn.classList.toggle("is-active", xray);
    xrayBtn.textContent = xray ? "隐形 V 骨架：已显露" : "透视隐形 V 骨架";

    svg.innerHTML = `
      <defs>
        <linearGradient id="scBeamA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#D14375" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#F8D1AE" stop-opacity="0.72"/>
        </linearGradient>
      </defs>
      ${c.art}
      ${xray ? c.xray : ""}
    `;
    titleEl.textContent = c.title;
    capEl.textContent = c.caption;
    noteEl.textContent = xray ? c.hiddenNote : "点击透视按钮，查看表面画面下暗藏的 V 形引导骨架。";
  }

  tabs.forEach((t) => t.addEventListener("click", () => { cur = t.dataset.caseTab; render(); }));
  xrayBtn.addEventListener("click", () => { xray = !xray; render(); });
  render();
}

/* ================= 05 适用性勾选自查器 ================= */
export function initSection05() {
  const checks = [...document.querySelectorAll("[data-fit-check]")];
  const verdictEl = document.getElementById("fit-verdict");
  const detailEl = document.getElementById("fit-detail");
  if (!checks.length || !verdictEl) return;

  function evaluate() {
    const picked = new Set(checks.filter((c) => c.checked).map((c) => c.dataset.fitCheck));
    const singleHero = picked.has("single-hero");
    const ceremony = picked.has("ceremony");
    const bottomFree = picked.has("bottom-free");
    const softMood = picked.has("soft-mood");
    const multiEqual = picked.has("multi-equal");

    if (multiEqual) {
      verdictEl.textContent = "建议改用别型 · 货架与多并列不适合 V 形";
      verdictEl.dataset.tone = "err";
      detailEl.textContent = "V 形是强单点漏斗，会把全部权重压给底部唯一主角。多款平权商品或卡片列表硬套 V 形会让顶部与两侧内容沦为陪衬，改用 Z 形扫读或网格更稳妥。";
    } else if (!bottomFree) {
      verdictEl.textContent = "慎用 · 底部被遮挡会切断收束落点";
      verdictEl.dataset.tone = "warn";
      detailEl.textContent = "移动端底部悬浮栏或极窄横幅如果盖住了 V 谷尖端，两条斜线把视线送下来却撞进遮挡区。要么抬高底部安全区，要么改用 T 形把核心兜在上方。";
    } else if (softMood && !ceremony) {
      verdictEl.textContent = "谨慎调缓 · 需用柔和曲线替代锐角 V";
      verdictEl.dataset.tone = "warn";
      detailEl.textContent = "向下的尖锐 V 形带有天然警觉与郑重压迫感，容易把母婴、疗愈、轻食题材做得过于严肃。如仍想聚焦底部，宜放宽夹角至 80° 以上或改用柔弧线 / 曲线构图。";
    } else if (singleHero && bottomFree) {
      verdictEl.textContent = ceremony ? "高度匹配 · 正 V 聚光发挥最大威力" : "适用正 V · 可用隐形斜线自然聚焦";
      verdictEl.dataset.tone = "ok";
      detailEl.textContent = ceremony
        ? "单一核心主角 + 底部留有承托空间 + 盛典庄重气质，恰好踩中 V 形构图的三大核心优势。建议把双翼夹角落在 58°–78° 之间，并给底焦足够体量压舱。"
        : "具备单焦点和底部承托条件，用灯光、文字阶梯或透视线条做隐形 V 形引导即可，不必强加戏剧化大斜杠。";
    } else {
      verdictEl.textContent = "待确认焦点 · 先定唯一主角再决定";
      verdictEl.dataset.tone = "neutral";
      detailEl.textContent = "勾选你的真实项目条件，系统会依据焦点数量、底部安全区与情绪基调给出是否采用 V 形构图的判断。";
    }
  }

  checks.forEach((c) => c.addEventListener("change", evaluate));
  evaluate();
}

/* ================= 06 眼力小练习（2 道单变量单选辨析） ================= */
const QUIZ_BANK = [
  {
    prompt: "第 1 题（共 2 题）：某年度影像盛典要出主海报，要求视线一次锁死底部奖章、气场庄重稳固。下面四版只差一个结构变量，哪一版真正成立？",
    answer: "B",
    options: [
      {
        id: "A",
        label: "方案 A",
        why: "双翼虽然对称且夹角在 66° 舒适带，但底部奖章向左偏离交点——视线滑进空谷扑了空。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="22,12 46,12 100,104 92,104" fill="#D14375"/>
          <polygon points="178,12 154,12 100,104 108,104" fill="#D14375"/>
          <rect x="68" y="20" width="64" height="7" fill="#F8D1AE" opacity="0.85"/>
          <rect x="78" y="33" width="44" height="4" fill="#C9B5A8" opacity="0.7"/>
          <polygon points="58,92 70,104 58,116 46,104" fill="#F26A99" stroke="#F8D1AE" stroke-width="1.2"/>
        `,
        reveal: `
          <circle cx="100" cy="104" r="14" fill="none" stroke="#FF8478" stroke-width="1.5" stroke-dasharray="3 3"/>
          <line x1="100" y1="104" x2="58" y2="104" stroke="#FF8478" stroke-width="1.5"/>
          <text x="100" y="132" text-anchor="middle" font-size="10" fill="#FF9387">焦点偏离交点 · 扑空</text>
        `,
      },
      {
        id: "B",
        label: "方案 B",
        why: "双翼对称以 66° 向下收束，交点落在 74% 纵深处，底部奖章体量稳重且严丝合缝接住双线动势。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="22,12 46,12 100,104 92,104" fill="#D14375"/>
          <polygon points="178,12 154,12 100,104 108,104" fill="#D14375"/>
          <rect x="68" y="20" width="64" height="7" fill="#F8D1AE" opacity="0.85"/>
          <rect x="78" y="33" width="44" height="4" fill="#C9B5A8" opacity="0.7"/>
          <polygon points="100,88 116,104 100,120 84,104" fill="#F26A99" stroke="#F8D1AE" stroke-width="1.3"/>
        `,
        reveal: `
          <circle cx="100" cy="104" r="24" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#7BE8BF">66° 对称 · 底焦稳接</text>
        `,
      },
      {
        id: "C",
        label: "方案 C",
        why: "奖章虽居中，但左翼几乎竖直、右翼大幅平躺，双翼严重不对称导致整幅画面朝左侧滑坡，庄重感瓦解。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="74,12 94,12 100,104 92,104" fill="#D14375"/>
          <polygon points="196,46 196,68 100,104 104,96" fill="#D14375"/>
          <rect x="68" y="20" width="64" height="7" fill="#F8D1AE" opacity="0.85"/>
          <rect x="78" y="33" width="44" height="4" fill="#C9B5A8" opacity="0.7"/>
          <polygon points="100,88 116,104 100,120 84,104" fill="#F26A99" stroke="#F8D1AE" stroke-width="1.3"/>
        `,
        reveal: `
          <line x1="84" y1="12" x2="96" y2="104" stroke="#FF8478" stroke-width="1.5" stroke-dasharray="3 3"/>
          <line x1="196" y1="57" x2="102" y2="100" stroke="#FF8478" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#FF9387">左右失衡 · 偏斜滑坡</text>
        `,
      },
      {
        id: "D",
        label: "方案 D",
        why: "虽然对称且焦点居中，但双翼夹角缩到 24° 极窄如缝，且中段横条硬生生截断了向底汇流的路径。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="72,12 84,12 100,108 94,108" fill="#D14375"/>
          <polygon points="128,12 116,12 100,108 106,108" fill="#D14375"/>
          <rect x="28" y="56" width="144" height="14" fill="#462040" stroke="#F8D1AE" stroke-width="1"/>
          <rect x="68" y="20" width="64" height="7" fill="#F8D1AE" opacity="0.85"/>
          <polygon points="100,92 114,106 100,120 86,106" fill="#F26A99" stroke="#F8D1AE" stroke-width="1.2"/>
        `,
        reveal: `
          <rect x="26" y="54" width="148" height="18" fill="none" stroke="#FF8478" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#FF9387">夹角过窄 + 横带截流</text>
        `,
      },
    ],
  },
  {
    prompt: "第 2 题（共 2 题）：一款音频旗舰新品要在底部展台压轴亮相。四版画面只改了一个重心或方向变量，哪一版真正做到了「重心下沉、聚焦稳托」？",
    answer: "C",
    options: [
      {
        id: "A",
        label: "方案 A",
        why: "双翼宽厚沉重，但底部的核心产品缩成一粒小点，托不住上方的巨大视觉分量，显得头重脚轻。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="12,12 52,12 100,106 92,106" fill="#D14375"/>
          <polygon points="188,12 148,12 100,106 108,106" fill="#D14375"/>
          <rect x="58" y="20" width="84" height="9" fill="#F8D1AE"/>
          <circle cx="100" cy="106" r="5" fill="#F8D1AE"/>
        `,
        reveal: `
          <circle cx="100" cy="106" r="14" fill="none" stroke="#FF8478" stroke-width="1.5" stroke-dasharray="3 3"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#FF9387">底焦过轻 · 头重脚轻</text>
        `,
      },
      {
        id: "B",
        label: "方案 B",
        why: "光束翻成了向上汇聚的倒 V（∧），观众视线被拉往画面顶部，底部展台上的产品反而被冷落。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="94,24 102,24 42,124 18,124" fill="#D14375"/>
          <polygon points="106,24 98,24 158,124 182,124" fill="#D14375"/>
          <rect x="66" y="16" width="68" height="6" fill="#F8D1AE"/>
          <rect x="86" y="96" width="28" height="26" rx="3" fill="#2E1638" stroke="#F8D1AE" stroke-width="1.4"/>
        `,
        reveal: `
          <polygon points="100,16 93,28 107,28" fill="#FF8478"/>
          <text x="100" y="135" text-anchor="middle" font-size="10" fill="#FF9387">倒 V 上拉 · 视线离焦</text>
        `,
      },
      {
        id: "C",
        label: "方案 C",
        why: "两条 70° 斜光束顺势沉向底部展台，产品以充实的体量稳坐交点并辅以发光底座，视线与重心一次落定。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="16,12 44,12 100,102 92,102" fill="#D14375"/>
          <polygon points="184,12 156,12 100,102 108,102" fill="#D14375"/>
          <rect x="64" y="20" width="72" height="7" fill="#F8D1AE"/>
          <ellipse cx="100" cy="116" rx="32" ry="7" fill="#D14375" opacity="0.45"/>
          <rect x="84" y="84" width="32" height="32" rx="4" fill="#32153C" stroke="#F8D1AE" stroke-width="1.6"/>
          <circle cx="100" cy="100" r="8" fill="#F06A96"/>
        `,
        reveal: `
          <circle cx="100" cy="100" r="24" fill="none" stroke="#7BE8BF" stroke-width="1.6"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#7BE8BF">正 V 下沉 · 体量压舱</text>
        `,
      },
      {
        id: "D",
        label: "方案 D",
        why: "两条近乎竖直的平行光柱夹角仅约 8°，缺少斜向压缩汇聚的势能，产品只是被夹在直筒中间。",
        art: `
          <rect width="200" height="140" fill="#180C1E"/>
          <polygon points="62,12 78,12 84,122 72,122" fill="#D14375"/>
          <polygon points="138,12 122,12 116,122 128,122" fill="#D14375"/>
          <rect x="64" y="20" width="72" height="7" fill="#F8D1AE"/>
          <rect x="84" y="84" width="32" height="32" rx="4" fill="#32153C" stroke="#F8D1AE" stroke-width="1.6"/>
          <circle cx="100" cy="100" r="8" fill="#F06A96"/>
        `,
        reveal: `
          <line x1="72" y1="12" x2="78" y2="122" stroke="#FF8478" stroke-width="1.4" stroke-dasharray="3 3"/>
          <line x1="128" y1="12" x2="122" y2="122" stroke="#FF8478" stroke-width="1.4" stroke-dasharray="3 3"/>
          <text x="100" y="133" text-anchor="middle" font-size="10" fill="#FF9387">近平行竖柱 · 缺汇聚角</text>
        `,
      },
    ],
  },
];

export function initSection06() {
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  const nextBtn = document.getElementById("quiz-next");
  if (!gridEl || !promptEl) return;

  let qIdx = 0;
  let picked = null;

  function render() {
    const q = QUIZ_BANK[qIdx];
    promptEl.textContent = q.prompt;
    gridEl.innerHTML = "";

    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.quizOpt = opt.id;
      if (picked) {
        if (opt.id === q.answer) btn.classList.add("is-correct");
        else if (opt.id === picked) btn.classList.add("is-wrong");
      }
      btn.innerHTML = `
        <svg viewBox="0 0 200 140" class="quiz-svg" aria-hidden="true">
          ${opt.art}
          ${picked ? opt.reveal : ""}
        </svg>
        <span class="quiz-card-label">${opt.label}</span>
      `;
      btn.addEventListener("click", () => {
        picked = opt.id;
        render();
      });
      gridEl.appendChild(btn);
    });

    if (!picked) {
      fbEl.dataset.state = "idle";
      fbEl.innerHTML = `<p>点击任意一张缩略图提交判断；选完后会同时展开四张图的几何标注线与单变量解析。</p>`;
    } else {
      const chosen = q.options.find((o) => o.id === picked);
      const right = q.options.find((o) => o.id === q.answer);
      const ok = picked === q.answer;
      fbEl.dataset.state = ok ? "ok" : "wrong";
      fbEl.innerHTML = ok
        ? `<p><strong>判断准确（${chosen.label}）</strong>：${chosen.why}</p>`
        : `<p><strong>你选了 ${chosen.label}，其实差在一个变量</strong>：${chosen.why}</p><p class="quiz-answer-line"><strong>正确答案是 ${right.label}</strong>：${right.why}</p>`;
    }
    nextBtn.textContent = qIdx === 0 ? "换第 2 题：重心辨析" : "回到第 1 题：结构辨析";
  }

  nextBtn.addEventListener("click", () => {
    qIdx = (qIdx + 1) % QUIZ_BANK.length;
    picked = null;
    render();
  });

  render();
}

/* ================= 07 原海报灯箱（放大 / 拖动 / Esc 关） ================= */
export function initPosterLightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const zoomReset = document.getElementById("lb-zoom-reset");
  const closeBtn = document.getElementById("lb-close");
  const stage = document.getElementById("lightbox-stage");
  if (!thumb || !box || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  const apply = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomReset.textContent = `${Math.round(scale * 100)}%`;
  };

  function open() {
    img.src = thumb.src; // 只引用已内联的一份 poster，不重复打包
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    box.hidden = false;
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    openBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  thumb.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box || e.target === stage) close(); });

  zoomIn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.2); apply(); });
  zoomOut?.addEventListener("click", () => { scale = clamp(scale - 0.35, 1, 3.2); if (scale <= 1.01) { tx = 0; ty = 0; } apply(); });
  zoomReset?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  stage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
    if (scale <= 1.01) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    img.setPointerCapture?.(e.pointerId);
  });
  img.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    apply();
  });
  window.addEventListener("pointerup", () => { drag = null; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
