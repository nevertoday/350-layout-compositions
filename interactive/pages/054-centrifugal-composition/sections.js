// 054 离心式构图 · 正文 01–07 全部互动组件与原海报放大灯箱
import { loop, pixelRatio } from "../../lib/stage.js";

/* ==================== 01 五层解剖检视器 ==================== */
const ANA_COPY = {
  all: "<strong>全部五层叠合：</strong>中心红核锁定第一眼，红蓝双主轴斜向破边，中环强实几何块推进节奏，外环暖灰圆与空心环负责透气收尾。",
  anchor: "<strong>中心锚点（要点 01）：</strong>饱满朱砂红实心圆配细同心轨道与断弧，先给眼睛立住一块不容误判的视觉原点——没有锚点，向外散开就会沦为无头碎片。",
  extend: "<strong>向外延展（要点 02）：</strong>20 余道细虚线放射轨道从红核边缘伸向四方，引导元素占满四周空间，带来开放感与呼吸感。",
  rhythm: "<strong>动感节奏（要点 03）：</strong>大小圆点、倾斜方块、短斜棒与尖锋三角在角距和体量上拉出明显极差，杜绝呆板均分齿轮感。",
  layers: "<strong>层次递进（要点 04）：</strong>外圈穿插低对比暖灰大圆与钴蓝空心细环，落实「由中心到边缘、由强到弱」的自然过渡，避免边角沉重压迫。",
  release: "<strong>释放与扩散（要点 05）：</strong>右上朱红与左下钴蓝两支锥形巨箭敢于逼近并冲破画幅边缘，把静态画框打开成向画外延续的张力场。"
};

export function initAnatomy() {
  const btns = [...document.querySelectorAll("[data-ana]")];
  const layers = [...document.querySelectorAll("#anatomy-svg .ana-layer")];
  const caption = document.getElementById("anatomy-caption");
  if (!btns.length) return;

  function select(key) {
    for (const b of btns) {
      const active = b.dataset.ana === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
    for (const g of layers) {
      const dim = key !== "all" && g.dataset.layer !== key;
      g.classList.toggle("is-dim", dim);
    }
    if (caption) caption.innerHTML = ANA_COPY[key] || ANA_COPY.all;
  }

  for (const b of btns) {
    b.addEventListener("click", () => select(b.dataset.ana));
  }
}

/* ==================== 02 四兄弟势能场对比 Canvas ==================== */
const COUSIN_META = {
  centrifugal: {
    name: "054 离心式构图 · 体量外抛破界",
    desc: "带重量的色块、几何体与双主轴由稳固中心核向外抛射，内强外弱递减，主轴直逼画框边缘，把想象推出画外。"
  },
  radiating: {
    name: "052 放射式构图 · 连续射线冲击",
    desc: "主角是几十条直接连到中心的连续光束或漫画集中线，靠线条粗细、疏密与长短的节奏制造瞬时爆闪冲击。"
  },
  centripetal: {
    name: "053 向心式构图 · 四周收束入核",
    desc: "方向正好与离心相反：外围楔形与透视引线把分散的注意力层层压回中央静谧点，边界是封闭收拢的。"
  },
  concentric: {
    name: "055 同心式构图 · 闭合环层嵌套",
    desc: "以共享圆心的闭合环层层包裹，情绪稳定、节律匀称，视线在环间逐级沉淀，不追求打破画框边界。"
  }
};

export function initCousinCompare() {
  const canvas = document.getElementById("cousin-canvas");
  const cards = [...document.querySelectorAll("[data-cousin]")];
  const nameEl = document.getElementById("cousin-name");
  const descEl = document.getElementById("cousin-desc");
  if (!canvas || !cards.length) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  let mode = "centrifugal";
  let cssW = 540;
  let cssH = 405;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    cssW = r.width;
    cssH = r.height;
    dpr = pixelRatio(window.innerWidth <= 860 ? 1.5 : 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  new ResizeObserver(() => {
    resize();
    ctrl.draw();
  }).observe(canvas);
  resize();

  function drawFrame(t, _dt, { still }) {
    const phase = still ? 0.45 : (t * 0.42) % 1;
    const cx = cssW / 2;
    const cy = cssH / 2;
    const minD = Math.min(cssW, cssH);
    const R = minD * 0.44;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#FBF0DD";
    ctx.fillRect(0, 0, cssW, cssH);

    // 淡外框
    ctx.strokeStyle = "rgba(11, 14, 15, 0.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, cssW - 24, cssH - 24);

    if (mode === "centrifugal") {
      // 放射虚线 + 红蓝双主轴破边 + 14 枚由强转轻外抛体
      ctx.save();
      ctx.strokeStyle = "rgba(22, 26, 30, 0.24)";
      ctx.setLineDash([3, 4]);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.26, cy + Math.sin(a) * R * 0.26);
        ctx.lineTo(cx + Math.cos(a) * R * 1.15, cy + Math.sin(a) * R * 1.15);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 红蓝双主轴
      const drawBig = (ang, col) => {
        const x0 = cx + Math.cos(ang) * R * 0.34;
        const y0 = cy + Math.sin(ang) * R * 0.34;
        const x1 = cx + Math.cos(ang) * R * 1.14;
        const y1 = cy + Math.sin(ang) * R * 1.14;
        ctx.strokeStyle = col;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        // 尖锋
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        const bx = cx + Math.cos(ang) * R * 0.94;
        const by = cy + Math.sin(ang) * R * 0.94;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x1 + Math.cos(ang) * 10, y1 + Math.sin(ang) * 10);
        ctx.lineTo(bx + nx * 14, by + ny * 14);
        ctx.lineTo(bx - nx * 14, by - ny * 14);
        ctx.closePath();
        ctx.fill();
      };
      drawBig(-0.85, "#E24029");
      drawBig(2.15, "#1347B8");

      // 外抛体量（由大实变小淡）
      for (let i = 0; i < 12; i++) {
        const a = i * 0.54 - 0.3;
        const p = (phase + i * 0.083) % 1;
        const r = R * (0.32 + p * 0.86);
        const rad = Math.max(3, (1 - p * 0.62) * 10.5);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, rad, 0, Math.PI * 2);
        if (p > 0.72) {
          ctx.strokeStyle = "#1347B8";
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else {
          ctx.fillStyle = i % 3 === 0 ? "#E94126" : i % 3 === 1 ? "#1347B8" : "#161A1E";
          ctx.fill();
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = "#E94126";
      ctx.fill();
      ctx.restore();
    } else if (mode === "radiating") {
      // 052 放射式：32 条连续长短粗细节奏射线
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const isMain = i % 4 === 0;
        const len = R * (isMain ? 1.08 : i % 2 === 0 ? 0.84 : 0.62);
        const pulse = still ? 1 : 0.92 + 0.08 * Math.sin(t * 3 + i);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.22, cy + Math.sin(a) * R * 0.22);
        ctx.lineTo(cx + Math.cos(a) * len * pulse, cy + Math.sin(a) * len * pulse);
        ctx.strokeStyle = isMain ? "#E94126" : i % 2 === 0 ? "#161A1E" : "rgba(19,71,184,0.65)";
        ctx.lineWidth = isMain ? 5 : i % 2 === 0 ? 2 : 1.1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#FBF0DD";
      ctx.fill();
      ctx.strokeStyle = "#161A1E";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (mode === "centripetal") {
      // 053 向心式：8 支箭头从画外全部指向中心静谧环
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.28;
        const p = (phase + i * 0.125) % 1;
        const rStart = R * 1.14;
        const rTip = R * 0.34;
        ctx.strokeStyle = i % 2 === 0 ? "#1347B8" : "#161A1E";
        ctx.lineWidth = i % 2 === 0 ? 4.5 : 2.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rStart, cy + Math.sin(a) * rStart);
        ctx.lineTo(cx + Math.cos(a) * rTip, cy + Math.sin(a) * rTip);
        ctx.stroke();
        // 指向内的箭尖
        const tipX = cx + Math.cos(a) * rTip;
        const tipY = cy + Math.sin(a) * rTip;
        const backX = cx + Math.cos(a) * (rTip + 14);
        const backY = cy + Math.sin(a) * (rTip + 14);
        const nx = -Math.sin(a);
        const ny = Math.cos(a);
        ctx.fillStyle = i % 2 === 0 ? "#1347B8" : "#161A1E";
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(backX + nx * 7, backY + ny * 7);
        ctx.lineTo(backX - nx * 7, backY - ny * 7);
        ctx.closePath();
        ctx.fill();

        // 向内滑行的视线流珠
        const beadR = rStart - (rStart - rTip) * p;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * beadR, cy + Math.sin(a) * beadR, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#E94126";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.arc(cx, cy, R * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = "#1347B8";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // 055 同心式：多层闭合圆环稳态嵌套
      const rings = [0.22, 0.42, 0.62, 0.82, 0.98];
      rings.forEach((f, idx) => {
        const breath = still ? 1 : 1 + 0.025 * Math.sin(t * 2 - idx * 0.7);
        ctx.beginPath();
        ctx.arc(cx, cy, R * f * breath, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 1 ? "#E94126" : idx % 2 === 0 ? "#1347B8" : "#161A1E";
        ctx.lineWidth = idx === 1 ? 4 : 2;
        if (idx === 3) ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = "#161A1E";
      ctx.fill();
    }

    ctx.restore();
  }

  const ctrl = loop(canvas, drawFrame);

  function select(next) {
    mode = next;
    for (const c of cards) {
      const active = c.dataset.cousin === next;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", String(active));
    }
    const meta = COUSIN_META[next];
    if (nameEl) nameEl.textContent = meta.name;
    if (descEl) descEl.textContent = meta.desc;
    ctrl.draw();
  }

  for (const c of cards) {
    c.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      select(c.dataset.cousin);
    });
    c.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.target.closest("a")) {
        e.preventDefault();
        select(c.dataset.cousin);
      }
    });
  }
}

/* ==================== 03 离心构图百年历史 ==================== */
const HISTORY_DATA = {
  malevich: {
    year: "1915–16",
    source: "伦敦泰特现代美术馆藏（编号 T02319）",
    title: "卡济米尔·马列维奇《动态至上主义》",
    body: "1915 至 1916 年间，俄国先锋画家马列维奇在至上主义画布中彻底抽离地平线与重力基座，把倾斜矩形、窄条与几何块悬置在留白空间里，让形体彼此推挤并斜向奔赴画框外缘——这是现代平面走向「离心失重感」的关键起点。",
    takeaway: "留给排版的遗产：取消底边重力坐实后，斜向体量差本身就能制造向外迸发的空间速度。",
    svg: `<svg viewBox="0 0 300 260" role="img" aria-label="至上主义斜向浮散几何力学示意">
      <rect width="300" height="260" fill="#FBF0DD"/>
      <g transform="translate(150 130)">
        <rect x="-12" y="-76" width="16" height="148" transform="rotate(-38)" fill="#0B0E0F"/>
        <rect x="-64" y="-26" width="94" height="32" transform="rotate(32)" fill="#1347B8"/>
        <rect x="24" y="-58" width="46" height="14" transform="rotate(-38)" fill="#E94126"/>
        <rect x="-86" y="42" width="52" height="10" transform="rotate(-38)" fill="#E94126"/>
        <polygon points="48,18 96,52 78,76 34,42" fill="#CFC8BC"/>
        <circle cx="-62" cy="-58" r="9" fill="#0B0E0F"/>
        <line x1="-110" y1="86" x2="112" y2="-92" stroke="#E94126" stroke-width="1.4" stroke-dasharray="4 4"/>
      </g>
    </svg>`
  },
  lissitzky: {
    year: "1919–21",
    source: "波士顿美术馆（2000.1069） / 纽约 MoMA（Proun 19D）",
    title: "埃尔·利西茨基《以红楔打击白军》与 Proun",
    body: "俄国构成主义大师埃尔·利西茨基在 1919–1920 年的石版海报《以红楔打击白军》与 1920–1921 年《Proun 19D》中，用高反差红、黑、白与锐利楔形斜切圆体，令几何碎片沿斜轴向外炸开。054 原海报的奶油纸底配朱红、钴蓝、松烟黑三色几何与对角巨箭，正是这一构成主义血脉的当代回响。",
    takeaway: "留给排版的遗产：锐利对角主轴 + 高对比有限色板，让信息在 1 秒内传递方向与爆发力。",
    svg: `<svg viewBox="0 0 300 260" role="img" aria-label="构成主义红楔与几何冲量示意">
      <rect width="300" height="260" fill="#FBF0DD"/>
      <circle cx="176" cy="128" r="54" fill="#FFF9EE" stroke="#0B0E0F" stroke-width="2"/>
      <polygon points="30,196 168,122 108,82" fill="#E94126"/>
      <rect x="192" y="48" width="24" height="24" transform="rotate(20 204 60)" fill="#0B0E0F"/>
      <rect x="218" y="168" width="46" height="10" transform="rotate(-28 241 173)" fill="#1347B8"/>
      <circle cx="88" cy="54" r="14" fill="#0B0E0F"/>
      <line x1="168" y1="122" x2="278" y2="62" stroke="#E94126" stroke-width="2.2" stroke-dasharray="5 4"/>
    </svg>`
  },
  kandinsky: {
    year: "1926",
    source: "慕尼黑包豪斯丛书第 9 卷（1947 年古根海姆英译初版）",
    title: "瓦西里·康定斯基《点与线到面》",
    body: "1926 年，康定斯基在包豪斯出版《点与线到面》，把绘画平面视作充满活性张力的「基础平面」。他在「点」与「色形力学」章节明确对比了向内收束的向心（concentric）倾向与向外扩张、冲向边界的离心/偏心（eccentric / centrifugal）张力，为抽象构图建立了系统词汇。",
    takeaway: "留给排版的遗产：点不是死圆点，而是能同时向内锚定、向外辐射张力的「双声部」核心。",
    svg: `<svg viewBox="0 0 300 260" role="img" aria-label="康定斯基点线面离心与向心双重张力示意">
      <rect width="300" height="260" fill="#FBF0DD"/>
      <rect x="24" y="20" width="252" height="220" fill="none" stroke="#0B0E0F" stroke-width="1.5"/>
      <circle cx="150" cy="130" r="24" fill="#E94126"/>
      <circle cx="150" cy="130" r="46" fill="none" stroke="#0B0E0F" stroke-dasharray="4 4"/>
      <circle cx="150" cy="130" r="76" fill="none" stroke="#1347B8" stroke-width="1.6"/>
      <g stroke="#E94126" stroke-width="2">
        <line x1="176" y1="104" x2="256" y2="36"/>
        <line x1="124" y1="156" x2="44" y2="224"/>
        <line x1="178" y1="146" x2="262" y2="196"/>
      </g>
      <circle cx="256" cy="36" r="5" fill="#E94126"/>
      <circle cx="44" cy="224" r="5" fill="#1347B8"/>
      <circle cx="262" cy="196" r="5" fill="#0B0E0F"/>
    </svg>`
  },
  bazin: {
    year: "1967",
    source: "加州大学出版社《什么是电影》卷一《绘画与电影》",
    title: "安德烈·巴赞：画框是向心的，银幕是离心的",
    body: "法国电影理论家安德烈·巴赞在《绘画与电影》（收于 1967 年英译本《什么是电影》第一卷）中留下广为引用的区分：传统画框把空间向内极化，让画成为自足的向心宇宙；而电影银幕更像一道窗口遮罩，不断把观众的想象推向画框之外持续延伸的世界——也就是「离心」空间。",
    takeaway: "留给排版的遗产：敢让主冲量箭头破出画幅边缘，静态海报就能借来电影银幕般的画外延展感。",
    svg: `<svg viewBox="0 0 300 260" role="img" aria-label="巴赞向心画框与离心银幕对比示意">
      <rect width="300" height="260" fill="#FBF0DD"/>
      <rect x="52" y="42" width="196" height="176" fill="none" stroke="#0B0E0F" stroke-width="2" stroke-dasharray="7 5"/>
      <circle cx="150" cy="130" r="22" fill="#E94126"/>
      <g stroke="#1347B8" stroke-width="3">
        <line x1="150" y1="102" x2="150" y2="12"/>
        <line x1="150" y1="158" x2="150" y2="248"/>
        <line x1="122" y1="130" x2="14" y2="130"/>
        <line x1="178" y1="130" x2="286" y2="130"/>
      </g>
      <text x="150" y="236" text-anchor="middle" font-size="11" fill="#0E3896" font-family="IBM Plex Mono, monospace">BEYOND THE FRAME</text>
    </svg>`
  },
  arnheim: {
    year: "1982 / 1988",
    source: "加州大学出版社《中心的力量》（1982 初版 / 1988 修订）",
    title: "鲁道夫·阿恩海姆《中心的力量》",
    body: "格式塔视知觉心理学家鲁道夫·阿恩海姆在 1982 年初版、1988 年修订的《中心的力量》中系统论证：每一张构图都同时受「中心放射系统」与「直角网格框架」双重支配。离心矢量必须依托明确的视觉中心才能被大脑感知为「向外辐射」，否则便会退化为彼此无关的散乱漂浮物。",
    takeaway: "留给排版的遗产：想做强离心，先立稳中心核——中心越清晰，向外抛射的位移感就越强烈。",
    svg: `<svg viewBox="0 0 300 260" role="img" aria-label="阿恩海姆中心放射系统与直角网格叠加示意">
      <rect width="300" height="260" fill="#FBF0DD"/>
      <g stroke="rgba(19,71,184,0.22)" stroke-width="1">
        <line x1="75" y1="16" x2="75" y2="244"/><line x1="150" y1="16" x2="150" y2="244"/><line x1="225" y1="16" x2="225" y2="244"/>
        <line x1="16" y1="65" x2="284" y2="65"/><line x1="16" y1="130" x2="284" y2="130"/><line x1="16" y1="195" x2="284" y2="195"/>
      </g>
      <circle cx="150" cy="130" r="30" fill="#E94126"/>
      <circle cx="150" cy="130" r="64" fill="none" stroke="#0B0E0F" stroke-width="1.5"/>
      <circle cx="150" cy="130" r="102" fill="none" stroke="#1347B8" stroke-dasharray="4 4"/>
      <polygon points="174,106 254,36 244,62 228,46" fill="#E24029"/>
      <polygon points="126,154 46,224 56,198 72,214" fill="#1347B8"/>
    </svg>`
  }
};

export function initHistory() {
  const btns = [...document.querySelectorAll("[data-hist]")];
  const diag = document.getElementById("hist-diagram");
  const yearEl = document.getElementById("hist-year");
  const srcEl = document.getElementById("hist-source");
  const titleEl = document.getElementById("hist-title");
  const bodyEl = document.getElementById("hist-body");
  const takeEl = document.getElementById("hist-takeaway");
  if (!btns.length) return;

  function render(key) {
    const d = HISTORY_DATA[key] || HISTORY_DATA.malevich;
    for (const b of btns) {
      const active = b.dataset.hist === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    }
    if (diag) diag.innerHTML = d.svg;
    if (yearEl) yearEl.textContent = d.year;
    if (srcEl) srcEl.textContent = d.source;
    if (titleEl) titleEl.textContent = d.title;
    if (bodyEl) bodyEl.textContent = d.body;
    if (takeEl) takeEl.textContent = d.takeaway;
  }

  for (const b of btns) {
    b.addEventListener("click", () => render(b.dataset.hist));
  }
  render("malevich");
}

/* ==================== 04 实战场景与留白配比 ==================== */
const APP_DATA = {
  event: {
    title: "活动与音乐节海报：双轴炸场，四角静置信息",
    summary: "演出、音乐节和周年庆海报最怕沉闷。把艺人名或主徽章锁死在中央红核，让两条高饱和音浪主轴沿斜角冲出画框，演出日期与购票信息则退守左上和右下两块干净负空间，动静互不打架。",
    bullets: [
      "中央核心圆只放最简活动简称与主图形，绝不塞进长串赞助商名单。",
      "红蓝主冲量轴刻意避开左上角标题区与右下角日期区，只从右上与左下破边。",
      "外环用暖灰圆点和空心环点缀声波扩散，保证 35% 以上宣纸底色透气。"
    ],
    coreTop: "WAVE 26",
    coreSub: "声浪现场",
    cornerTL: "秋日独立音乐节",
    cornerTLSub: "OCT 18–20 · SHANGHAI",
    cornerBR: "早鸟通道已开启",
    cornerBRSub: "滨江艺术广场"
  },
  tech: {
    title: "科技与芯片发布：核心算力辐射外围生态",
    summary: "新品处理器或 AI 引擎发布强调「从一枚核心向外驱动整个生态」。把硬件或架构图锚定在中心，借细虚线轨道连接由内而外逐渐轻量化的小图标与短词，主箭破边传达性能突破边界。",
    bullets: [
      "核心锚点采用高对比实心区，外圈生态模块逐级减小字号与色深。",
      "用原海报式细虚线轨道串联核心与外围特性，一眼看懂因果辐射关系。",
      "发布会时间与主标留在左侧净空，避免被斜向箭头斜穿笔画。"
    ],
    coreTop: "M-CORE",
    coreSub: "算力中枢",
    cornerTL: "2026 开发者大会",
    cornerTLSub: "KEYNOTE · NOV 12",
    cornerBR: "架构白皮书同步上线",
    cornerBRSub: "LIVE STREAMING"
  },
  brand: {
    title: "品牌焕新主视觉：新标识作为能量源点",
    summary: "品牌升级或联名快闪需要在商场大屏和社交媒体里瞬间抓人。以新 Logo 作为不可撼动的中心锚核，将品牌色块与口号沿离心轨道由密到疏铺开，既有焕新爆发力又保住识别度。",
    bullets: [
      "严格控制色板在 2–3 种品牌主色加 1 种浅暖灰透气色，防爆成杂色礼花。",
      "一条主斜轴带出核心口号破边，次级辅助图形向外渐小，强化空间景深。",
      "留出右下角极简说明框承接门店地址与活动周期，呼应原海报底匣逻辑。"
    ],
    coreTop: "RE:NEW",
    coreSub: "品牌焕新",
    cornerTL: "全新视觉系统发布",
    cornerTLSub: "BRAND IDENTITY 2026",
    cornerBR: "全国快闪展同步启幕",
    cornerBRSub: "10.01 – 10.31"
  }
};

export function initAppShowcase() {
  const appBtns = [...document.querySelectorAll("[data-app]")];
  const xrayBtns = [...document.querySelectorAll("[data-xray]")];
  const board = document.getElementById("app-board");
  const titleEl = document.getElementById("app-title");
  const sumEl = document.getElementById("app-summary");
  const ulEl = document.getElementById("app-bullets");
  if (!board) return;

  let curApp = "event";
  let curXray = "final";

  function buildBoardSvg(d, xray) {
    const showVec = xray === "vectors";
    const showSafe = xray === "safe";
    return `<svg viewBox="0 0 600 400" role="img" aria-label="${d.title}版面透视样张">
      <rect width="600" height="400" fill="#FBF0DD"/>
      <!-- 放射细虚线轨道 -->
      <g stroke="#161A1E" stroke-opacity="${showVec ? 0.55 : 0.2}" stroke-dasharray="3 4" stroke-width="${showVec ? 1.4 : 1}">
        <line x1="308" y1="204" x2="545" y2="26"/>
        <line x1="308" y1="204" x2="76" y2="378"/>
        <line x1="308" y1="204" x2="308" y2="24"/>
        <line x1="308" y1="204" x2="574" y2="174"/>
        <line x1="308" y1="204" x2="520" y2="336"/>
        <line x1="308" y1="204" x2="308" y2="380"/>
        <line x1="308" y1="204" x2="64" y2="210"/>
        <line x1="308" y1="204" x2="152" y2="62"/>
      </g>
      <!-- 红蓝对角主冲量轴 -->
      <polygon points="348,164 494,48 481,34 552,12 522,78 510,64 356,172" fill="#E24029" opacity="${showSafe ? 0.45 : 1}"/>
      <polygon points="268,244 132,350 144,364 74,388 104,320 116,334 260,236" fill="#1347B8" opacity="${showSafe ? 0.45 : 1}"/>

      <!-- 层次递进抛射几何体 -->
      <g opacity="${showSafe ? 0.45 : 1}">
        <circle cx="496" cy="166" r="22" fill="#161A1E"/>
        <circle cx="430" cy="294" r="22" fill="#CFC8BC"/>
        <circle cx="232" cy="86" r="19" fill="#CFC8BC"/>
        <circle cx="206" cy="176" r="15" fill="none" stroke="#1347B8" stroke-width="2.2"/>
        <circle cx="418" cy="222" r="12" fill="none" stroke="#1347B8" stroke-width="2"/>
        <rect x="408" y="148" width="18" height="14" transform="rotate(-16 417 155)" fill="#E94126"/>
        <rect x="334" y="92" width="13" height="13" transform="rotate(14 340 98)" fill="#1347B8"/>
        <circle cx="152" cy="242" r="11" fill="#1347B8"/>
        <circle cx="388" cy="264" r="9" fill="#161A1E"/>
        <circle cx="278" cy="316" r="9" fill="#E94126"/>
      </g>

      <!-- 中心锚核 -->
      <circle cx="308" cy="204" r="64" fill="none" stroke="#161A1E" stroke-opacity="0.32" stroke-dasharray="2 3"/>
      <path d="M 240 218 A 68 68 0 0 1 312 136" fill="none" stroke="#0B0E0F" stroke-width="2"/>
      <circle cx="308" cy="204" r="46" fill="#E94126"/>
      <text x="308" y="198" text-anchor="middle" fill="#FFF9EE" font-size="14" font-weight="800" font-family="Bricolage Grotesque, sans-serif">${d.coreTop}</text>
      <text x="308" y="218" text-anchor="middle" fill="#FFF9EE" font-size="12" font-weight="700" font-family="Noto Sans SC, sans-serif">${d.coreSub}</text>

      <!-- 左上文字安全区 -->
      <text x="28" y="50" fill="#0B0E0F" font-size="22" font-weight="900" font-family="Noto Sans SC, sans-serif">${d.cornerTL}</text>
      <text x="28" y="70" fill="#0E3896" font-size="11.5" font-weight="700" font-family="IBM Plex Mono, monospace">${d.cornerTLSub}</text>
      <rect x="28" y="80" width="38" height="3.5" fill="#E94126"/>

      <!-- 右下文字安全区 -->
      <rect x="412" y="330" width="164" height="48" rx="6" fill="#FFF9EE" stroke="#1347B8" stroke-width="1.4"/>
      <text x="424" y="351" fill="#0B0E0F" font-size="13" font-weight="800" font-family="Noto Sans SC, sans-serif">${d.cornerBR}</text>
      <text x="424" y="368" fill="#474B4D" font-size="11" font-family="IBM Plex Mono, monospace">${d.cornerBRSub}</text>

      ${showVec ? `
      <g>
        <circle cx="308" cy="204" r="144" fill="none" stroke="#1347B8" stroke-width="1.8" stroke-dasharray="6 5"/>
        <line x1="74" y1="388" x2="552" y2="12" stroke="#E94126" stroke-width="2" stroke-dasharray="6 4"/>
        <rect x="234" y="14" width="154" height="22" fill="#0E131D"/>
        <text x="311" y="29" text-anchor="middle" fill="#FFF9EE" font-size="11" font-family="IBM Plex Mono, monospace">DIAGONAL AXIS · BREAK</text>
      </g>` : ""}

      ${showSafe ? `
      <g>
        <rect x="18" y="20" width="196" height="80" fill="rgba(14,107,88,0.16)" stroke="#0E6B58" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="24" y="114" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">文字安全静区 A（避开主轴）</text>
        <rect x="404" y="322" width="180" height="64" fill="rgba(14,107,88,0.16)" stroke="#0E6B58" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="404" y="314" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">文字安全静区 B（呼吸承接）</text>
      </g>` : ""}
    </svg>`;
  }

  function render() {
    const d = APP_DATA[curApp];
    for (const b of appBtns) {
      const a = b.dataset.app === curApp;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
    for (const b of xrayBtns) {
      const a = b.dataset.xray === curXray;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
    board.innerHTML = buildBoardSvg(d, curXray);
    if (titleEl) titleEl.textContent = d.title;
    if (sumEl) sumEl.textContent = d.summary;
    if (ulEl) ulEl.innerHTML = d.bullets.map((li) => `<li>${li}</li>`).join("");
  }

  for (const b of appBtns) b.addEventListener("click", () => { curApp = b.dataset.app; render(); });
  for (const b of xrayBtns) b.addEventListener("click", () => { curXray = b.dataset.xray; render(); });
  render();
}

/* ==================== 05 什么时候别用（四组翻牌诊所） ==================== */
const ANTI_DATA = {
  reading: {
    badText: "正文和输入框需要平稳的左起线与纵向顺流；把图文从中心斜向甩开，读者每读一行都在找下一句在哪。",
    goodText: "改为左对齐单列自然流：清晰起线与统一栏宽让视线从上往下顺畅滑行，把爆发留给封面而非正文。",
    badSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="误用离心排长文的凌乱示意">
      <rect width="360" height="175" fill="#FBF0DD"/>
      <circle cx="180" cy="80" r="20" fill="#E94126"/>
      <g fill="#474B4D">
        <rect x="26" y="18" width="110" height="7" transform="rotate(-14 81 21)"/>
        <rect x="218" y="22" width="116" height="7" transform="rotate(15 276 25)"/>
        <rect x="28" y="114" width="106" height="7" transform="rotate(14 81 117)"/>
        <rect x="216" y="118" width="114" height="7" transform="rotate(-14 273 121)"/>
      </g>
      <text x="14" y="164" fill="#B52610" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">× 阅读顺序断裂，视线迷失</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="改为单列阅读流的清晰示意">
      <rect width="360" height="175" fill="#FFF9EE"/>
      <rect x="76" y="22" width="120" height="12" fill="#0B0E0F"/>
      <rect x="76" y="42" width="208" height="7" fill="#474B4D"/>
      <rect x="76" y="56" width="192" height="7" fill="#474B4D"/>
      <rect x="76" y="70" width="204" height="7" fill="#474B4D"/>
      <rect x="76" y="92" width="208" height="24" fill="none" stroke="#1347B8" stroke-width="1.6"/>
      <rect x="76" y="126" width="90" height="18" fill="#0E6B58"/>
      <text x="14" y="164" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">✓ 统一起线顺流，零寻找成本</text>
    </svg>`
  },
  formal: {
    badText: '建筑机构、博物馆年报追求沉稳与可信度，向外破框的冲击箭头会显得浮躁；应改用 <a href="https://layout.xiaoxiaodong.ai/046/play/" target="_blank" rel="noopener">046 矩形构图</a> 或 <a href="https://layout.xiaoxiaodong.ai/042/play/" target="_blank" rel="noopener">042 金字塔构图</a>。',
    goodText: '改用稳重的矩形与底部基准线（参见 <a href="https://layout.xiaoxiaodong.ai/046/play/" target="_blank" rel="noopener">046 矩形构图</a>）：四平八稳的留白框出权威感，读者立刻产生信任。',
    badSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="误用离心排庄重年报的浮躁示意">
      <rect width="360" height="175" fill="#FBF0DD"/>
      <polygon points="180,82 320,16 306,46" fill="#E94126"/>
      <polygon points="180,82 46,142 62,114" fill="#1347B8"/>
      <circle cx="180" cy="82" r="25" fill="#0B0E0F"/>
      <text x="180" y="86" text-anchor="middle" fill="#FFF9EE" font-size="11" font-family="Noto Sans SC, sans-serif">年度报告</text>
      <text x="14" y="164" fill="#B52610" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">× 过度张扬破边，削弱庄重感</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="改用稳重矩形年报封面的示意">
      <rect width="360" height="175" fill="#FFF9EE"/>
      <rect x="44" y="20" width="272" height="124" fill="none" stroke="#0B0E0F" stroke-width="1.6"/>
      <rect x="64" y="42" width="130" height="14" fill="#0B0E0F"/>
      <rect x="64" y="64" width="84" height="5" fill="#1347B8"/>
      <rect x="64" y="84" width="232" height="44" fill="#EFE0C6"/>
      <text x="14" y="164" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">✓ 稳定矩形边界，端庄可信</text>
    </svg>`
  },
  table: {
    badText: '比较参数和财务数字靠的是横平竖直的同基线扫描；把指标做成内大外小的放射炸点，几乎无法精确比大小，宜改用 <a href="https://layout.xiaoxiaodong.ai/056/play/" target="_blank" rel="noopener">056 四象限构图</a> 或标准网格。',
    goodText: '改用正交坐标或四象限分区（参见 <a href="https://layout.xiaoxiaodong.ai/056/play/" target="_blank" rel="noopener">056 四象限构图</a>）：所有数字对齐同一基线，高低差一眼可读。',
    badSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="误用离心排数据对比的失真示意">
      <rect width="360" height="175" fill="#FBF0DD"/>
      <circle cx="180" cy="80" r="24" fill="#1347B8"/><text x="180" y="84" text-anchor="middle" fill="#FFF9EE" font-size="11" font-family="IBM Plex Mono, monospace">82%</text>
      <circle cx="96" cy="44" r="16" fill="#E94126"/><text x="96" y="48" text-anchor="middle" fill="#FFF9EE" font-size="10" font-family="IBM Plex Mono, monospace">67%</text>
      <circle cx="278" cy="52" r="19" fill="#0B0E0F"/><text x="278" y="56" text-anchor="middle" fill="#FFF9EE" font-size="10" font-family="IBM Plex Mono, monospace">74%</text>
      <circle cx="268" cy="122" r="14" fill="#1347B8"/><text x="268" y="126" text-anchor="middle" fill="#FFF9EE" font-size="10" font-family="IBM Plex Mono, monospace">41%</text>
      <circle cx="92" cy="118" r="17" fill="#E94126"/><text x="92" y="122" text-anchor="middle" fill="#FFF9EE" font-size="10" font-family="IBM Plex Mono, monospace">58%</text>
      <text x="14" y="164" fill="#B52610" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">× 缺少统一基线，数据难比较</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="改用标准正交对齐对比表的示意">
      <rect width="360" height="175" fill="#FFF9EE"/>
      <g stroke="rgba(11,14,15,0.2)">
        <line x1="56" y1="30" x2="316" y2="30"/><line x1="56" y1="60" x2="316" y2="60"/>
        <line x1="56" y1="90" x2="316" y2="90"/><line x1="56" y1="120" x2="316" y2="120"/>
      </g>
      <rect x="56" y="38" width="210" height="14" fill="#1347B8"/>
      <rect x="56" y="68" width="154" height="14" fill="#0E6B58"/>
      <rect x="56" y="98" width="112" height="14" fill="#474B4D"/>
      <text x="14" y="164" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">✓ 同左起基线，数值差一目了然</text>
    </svg>`
  },
  shelf: {
    badText: '离心强迫画面分出唯一中心主角和边缘配角，多款同等地位的商品放进外圈只会被边缘化；改用 <a href="https://layout.xiaoxiaodong.ai/045/play/" target="_blank" rel="noopener">045 方形构图</a> 均分展位更公平。',
    goodText: '改用等格方形阵列（参见 <a href="https://layout.xiaoxiaodong.ai/045/play/" target="_blank" rel="noopener">045 方形构图</a>）：四款商品面积与关注度完全平等，方便顾客逐一挑选。',
    badSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="误用离心排均权商品货架的偏心示意">
      <rect width="360" height="175" fill="#FBF0DD"/>
      <rect x="144" y="42" width="72" height="72" fill="#E94126"/>
      <rect x="34" y="22" width="38" height="32" fill="#CFC8BC" stroke="#9B9488"/>
      <rect x="284" y="26" width="34" height="30" fill="#CFC8BC" stroke="#9B9488"/>
      <rect x="44" y="102" width="32" height="28" fill="#CFC8BC" stroke="#9B9488"/>
      <rect x="278" y="100" width="36" height="30" fill="#CFC8BC" stroke="#9B9488"/>
      <text x="14" y="164" fill="#B52610" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">× 中心独占焦点，外围商品被忽略</text>
    </svg>`,
    goodSvg: `<svg viewBox="0 0 360 175" role="img" aria-label="改用方形均分展位的示意">
      <rect width="360" height="175" fill="#FFF9EE"/>
      <rect x="32" y="34" width="66" height="84" fill="#EFE0C6" stroke="#0E6B58" stroke-width="1.5"/>
      <rect x="110" y="34" width="66" height="84" fill="#EFE0C6" stroke="#0E6B58" stroke-width="1.5"/>
      <rect x="188" y="34" width="66" height="84" fill="#EFE0C6" stroke="#0E6B58" stroke-width="1.5"/>
      <rect x="266" y="34" width="66" height="84" fill="#EFE0C6" stroke="#0E6B58" stroke-width="1.5"/>
      <text x="14" y="164" fill="#0E6B58" font-size="11.5" font-weight="700" font-family="Noto Sans SC, sans-serif">✓ 等宽均权排布，每款都能被看清</text>
    </svg>`
  }
};

export function initAntiPatterns() {
  const flipped = { reading: false, formal: false, table: false, shelf: false };

  function updateCard(key) {
    const card = document.querySelector(`[data-anti="${key}"]`);
    const prev = document.querySelector(`[data-anti-svg="${key}"]`);
    const text = document.querySelector(`[data-anti-text="${key}"]`);
    const btn = document.querySelector(`[data-flip="${key}"]`);
    if (!card || !prev || !text || !btn) return;
    const isFixed = flipped[key];
    const d = ANTI_DATA[key];
    card.classList.toggle("is-fixed", isFixed);
    card.classList.toggle("is-bad", !isFixed);
    prev.innerHTML = isFixed ? d.goodSvg : d.badSvg;
    text.innerHTML = isFixed ? d.goodText : d.badText;
    btn.textContent = isFixed ? "切回误用案例" : "看正确改法";
    btn.setAttribute("aria-pressed", String(isFixed));
  }

  for (const key of Object.keys(ANTI_DATA)) {
    updateCard(key);
    const btn = document.querySelector(`[data-flip="${key}"]`);
    btn?.addEventListener("click", () => {
      flipped[key] = !flipped[key];
      updateCard(key);
    });
  }
}

/* ==================== 06 眼力考场（2 题单变量四选一，标签全中性） ==================== */
const QUIZ_QUESTIONS = [
  {
    stem: "第 1 题（单一变量：中心到边缘的视觉重量递进）——以下四张构图拥有相同的红心位置与对角双主轴，只改变了元素由内到外的体量与深浅权重。哪一张最符合离心式构图？",
    correct: "C",
    options: [
      {
        id: "A",
        // 内外等大等黑等饱和（无层次递进）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <polygon points="124,78 190,22 178,16 206,8 194,36 188,28 128,82" fill="#E24029"/>
          <polygon points="96,102 32,158 44,164 16,172 28,144 34,152 92,98" fill="#1347B8"/>
          <circle cx="110" cy="90" r="19" fill="#E94126"/>
          <g fill="#0B0E0F">
            <circle cx="62" cy="40" r="13"/><circle cx="170" cy="78" r="13"/><circle cx="164" cy="144" r="13"/>
            <circle cx="52" cy="108" r="13"/><circle cx="106" cy="26" r="13"/><circle cx="118" cy="154" r="13"/>
            <circle cx="82" cy="64" r="13"/><circle cx="142" cy="112" r="13"/>
          </g></svg>`,
        explain: "选项 A 所有内外圈圆点大小与墨黑权重完全一致，眼睛同时被 8 个等重黑点拉扯，失去「由中心到边缘、由强到弱」的自然过渡。"
      },
      {
        id: "B",
        // 中心核萎缩、外圈巨黑块（外重内轻）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <polygon points="120,82 190,22 178,16 206,8 194,36 188,28 124,86" fill="#E24029"/>
          <polygon points="100,98 32,158 44,164 16,172 28,144 34,152 96,94" fill="#1347B8"/>
          <circle cx="110" cy="90" r="7" fill="#E94126"/>
          <circle cx="48" cy="36" r="22" fill="#0B0E0F"/><circle cx="182" cy="92" r="23" fill="#0B0E0F"/>
          <circle cx="168" cy="150" r="21" fill="#0B0E0F"/><circle cx="46" cy="112" r="19" fill="#1347B8"/>
          <circle cx="94" cy="68" r="5" fill="#CFC8BC"/><circle cx="128" cy="108" r="5" fill="#CFC8BC"/>
        </svg>`,
        explain: "选项 B 是典型的「外重内轻」：中心红核缩成小点，外围却塞满巨大实黑块，第一眼直接被边缘抢走，画面被扯碎。"
      },
      {
        id: "C",
        // 正确：中心稳锚、内实外轻、含暖灰与空心环自然透气
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <polygon points="126,76 190,22 178,16 206,8 194,36 188,28 130,82" fill="#E24029"/>
          <polygon points="94,104 32,158 44,164 16,172 28,144 34,152 90,98" fill="#1347B8"/>
          <circle cx="110" cy="90" r="27" fill="none" stroke="#161A1E" stroke-opacity="0.3" stroke-dasharray="2 3"/>
          <circle cx="110" cy="90" r="20" fill="#E94126"/>
          <circle cx="84" cy="64" r="9" fill="#161A1E"/><rect x="138" y="84" width="11" height="9" transform="rotate(-16 143 88)" fill="#E94126"/>
          <circle cx="136" cy="118" r="8" fill="#1347B8"/><circle cx="78" cy="106" r="8" fill="none" stroke="#1347B8" stroke-width="1.8"/>
          <circle cx="54" cy="38" r="12" fill="#CFC8BC"/><circle cx="174" cy="144" r="12" fill="#CFC8BC"/>
          <circle cx="178" cy="74" r="7" fill="none" stroke="#1347B8" stroke-width="1.6"/><circle cx="48" cy="112" r="5" fill="#CFC8BC"/>
        </svg>`,
        explain: "答对了！选项 C 完整体现了离心构图的层次递进：中心红核稳住第一眼，中环用紧凑的红蓝黑实块加速推进，外环过渡为暖灰圆和细空心环透气收尾，视线顺畅向外释放。"
      },
      {
        id: "D",
        // 全部挤死在红核旁边、外圈空白（闷核塌缩）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <polygon points="124,78 190,22 178,16 206,8 194,36 188,28 128,82" fill="#E24029"/>
          <polygon points="96,102 32,158 44,164 16,172 28,144 34,152 92,98" fill="#1347B8"/>
          <circle cx="110" cy="90" r="20" fill="#E94126"/>
          <circle cx="86" cy="76" r="8" fill="#0B0E0F"/><circle cx="134" cy="78" r="8" fill="#1347B8"/>
          <circle cx="132" cy="108" r="8" fill="#0B0E0F"/><circle cx="88" cy="108" r="7" fill="#1347B8"/>
          <circle cx="110" cy="64" r="7" fill="#E94126"/><circle cx="110" cy="116" r="7" fill="#CFC8BC"/>
        </svg>`,
        explain: "选项 D 的全部辅助元素都紧贴在红核周围一圈，外围空间完全闲置，缺乏向四周延展的呼吸感与位移张力。"
      }
    ]
  },
  {
    stem: "第 2 题（单一变量：主冲量轴的边界关系）——四张发布会海报拥有相同的红心标识与左上/右下文字区，仅改变了主箭头的伸展方式。哪一张兼顾了破边张力与文字可读性？",
    correct: "B",
    options: [
      {
        id: "A",
        // 八条等长箭头齐刷刷停在框内 14%（齐边憋闷且均等）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <rect x="14" y="14" width="70" height="12" fill="#0B0E0F"/><rect x="142" y="150" width="64" height="16" rx="3" fill="none" stroke="#1347B8"/>
          <g stroke="#1347B8" stroke-width="4">
            <line x1="110" y1="90" x2="110" y2="30"/><line x1="110" y1="90" x2="110" y2="150"/>
            <line x1="110" y1="90" x2="48" y2="90"/><line x1="110" y1="90" x2="172" y2="90"/>
            <line x1="110" y1="90" x2="66" y2="46"/><line x1="110" y1="90" x2="154" y2="46"/>
            <line x1="110" y1="90" x2="66" y2="134"/><line x1="110" y1="90" x2="154" y2="134"/>
          </g>
          <circle cx="110" cy="90" r="19" fill="#E94126"/>
        </svg>`,
        explain: "选项 A 八条等长线条像齿轮一样均分四周，又齐刷刷缩在画框内侧停住，既呆板又把能量憋在盒子里。"
      },
      {
        id: "B",
        // 正确：右上红箭与左下蓝箭非对称破边，文字静区完全干净
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <rect x="14" y="14" width="70" height="12" fill="#0B0E0F"/><rect x="14" y="30" width="38" height="4" fill="#E94126"/>
          <rect x="142" y="148" width="64" height="18" rx="3" fill="#FFF9EE" stroke="#1347B8" stroke-width="1.3"/>
          <polygon points="124,78 192,20 180,14 214,2 200,36 192,28 128,84" fill="#E24029"/>
          <polygon points="96,102 28,160 40,166 6,178 20,144 28,152 92,96" fill="#1347B8"/>
          <circle cx="110" cy="90" r="19" fill="#E94126"/>
          <circle cx="164" cy="84" r="7" fill="#0B0E0F"/><circle cx="62" cy="82" r="8" fill="none" stroke="#1347B8" stroke-width="1.8"/>
          <circle cx="144" cy="118" r="8" fill="#CFC8BC"/><circle cx="96" cy="44" r="6" fill="#CFC8BC"/>
        </svg>`,
        explain: "答对了！选项 B 只让右上朱红与左下钴蓝两支对角主冲量轴顺势冲破边界，把爆发力送到画外，同时把左上标题区和右下信息框完整让了出来。"
      },
      {
        id: "C",
        // 所有箭头都极短缩在中心核外一圈（保守居中徽章）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <rect x="14" y="14" width="70" height="12" fill="#0B0E0F"/><rect x="142" y="148" width="64" height="18" rx="3" fill="#FFF9EE" stroke="#1347B8"/>
          <polygon points="124,78 144,62 138,56 156,50 148,68 144,64 128,84" fill="#E24029"/>
          <polygon points="96,102 76,118 82,124 64,130 72,112 76,116 92,96" fill="#1347B8"/>
          <circle cx="110" cy="90" r="19" fill="#E94126"/>
          <circle cx="136" cy="94" r="5" fill="#0B0E0F"/><circle cx="84" cy="84" r="5" fill="#CFC8BC"/>
        </svg>`,
        explain: "选项 C 的双主箭过分保守，停在画幅中段就戛然而止，整张画退化成普通的居中徽章，感受不到打破边界的释放感。"
      },
      {
        id: "D",
        // 六条粗实心箭乱穿标题和右下信息框（失控破框压字）
        svg: `<svg viewBox="0 0 220 180"><rect width="220" height="180" fill="#FBF0DD"/>
          <rect x="14" y="14" width="70" height="12" fill="#0B0E0F"/><rect x="142" y="148" width="64" height="18" rx="3" fill="#FFF9EE" stroke="#1347B8"/>
          <g stroke="#0B0E0F" stroke-width="11">
            <line x1="110" y1="90" x2="12" y2="12"/><line x1="110" y1="90" x2="210" y2="170"/>
            <line x1="110" y1="90" x2="212" y2="10"/><line x1="110" y1="90" x2="8" y2="170"/>
            <line x1="110" y1="90" x2="110" y2="0"/><line x1="110" y1="90" x2="110" y2="180"/>
          </g>
          <circle cx="110" cy="90" r="19" fill="#E94126"/>
        </svg>`,
        explain: "选项 D 误把「打破边界」当成四面八方无节制乱冲：六条粗重黑箭直接劈穿左上标题和右下信息区，图文严重冲突、版面解体。"
      }
    ]
  }
];

export function initQuiz() {
  const tabBtns = [...document.querySelectorAll("[data-quiz-idx]")];
  const resetBtn = document.getElementById("quiz-reset");
  const stemEl = document.getElementById("quiz-stem");
  const gridEl = document.getElementById("quiz-grid");
  const fbBox = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("quiz-fb-title");
  const fbBody = document.getElementById("quiz-fb-body");
  if (!gridEl) return;

  let qIdx = 0;
  const picked = [null, null];

  function render() {
    const q = QUIZ_QUESTIONS[qIdx];
    const choice = picked[qIdx];
    for (const b of tabBtns) {
      const a = Number(b.dataset.quizIdx) === qIdx;
      b.classList.toggle("is-active", a);
      b.setAttribute("aria-pressed", String(a));
    }
    if (stemEl) stemEl.textContent = q.stem;

    gridEl.innerHTML = q.options.map((opt) => {
      let cls = "quiz-opt";
      let mark = "";
      if (choice) {
        if (opt.id === q.correct) {
          cls += " is-correct";
          mark = "✓ 最佳";
        } else if (opt.id === choice) {
          cls += " is-wrong";
          mark = "× 偏差";
        }
      }
      return `<button type="button" class="${cls}" data-opt="${opt.id}" role="radio" aria-checked="${choice === opt.id}">
        ${opt.svg}
        <span class="opt-label"><span>选项 ${opt.id}</span><span class="opt-mark">${mark}</span></span>
      </button>`;
    }).join("");

    for (const b of gridEl.querySelectorAll("[data-opt]")) {
      b.addEventListener("click", () => {
        picked[qIdx] = b.dataset.opt;
        render();
      });
    }

    if (choice && fbBox && fbTitle && fbBody) {
      const opt = q.options.find((o) => o.id === choice);
      const isRight = choice === q.correct;
      fbBox.hidden = false;
      fbBox.classList.toggle("is-correct", isRight);
      fbBox.classList.toggle("is-wrong", !isRight);
      fbTitle.textContent = isRight
        ? `你选了选项 ${choice} —— 判断准确`
        : `你选了选项 ${choice} —— 正确项是选项 ${q.correct}`;
      fbBody.textContent = isRight
        ? opt.explain
        : `${opt.explain} 对照选项 ${q.correct}：${q.options.find((o) => o.id === q.correct).explain}`;
    } else if (fbBox) {
      fbBox.hidden = true;
    }
  }

  for (const b of tabBtns) {
    b.addEventListener("click", () => {
      qIdx = Number(b.dataset.quizIdx);
      render();
    });
  }
  resetBtn?.addEventListener("click", () => {
    picked[qIdx] = null;
    render();
  });
  render();
}

/* ==================== 07 原海报高清放大灯箱 ==================== */
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("poster-modal-stage");
  const modalImg = document.getElementById("poster-modal-img");
  const btnIn = document.getElementById("modal-zoom-in");
  const btnOut = document.getElementById("modal-zoom-out");
  const btnReset = document.getElementById("modal-zoom-reset");
  const btnClose = document.getElementById("modal-close");
  if (!trigger || !posterImg || !modal || !stage || !modalImg) return;

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    if (btnReset) btnReset.textContent = `${Math.round(zoom * 100)}%`;
  }

  function openModal() {
    modalImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    btnClose?.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  btnClose?.addEventListener("click", closeModal);
  btnIn?.addEventListener("click", () => { zoom = Math.min(3.2, +(zoom + 0.35).toFixed(2)); applyTransform(); });
  btnOut?.addEventListener("click", () => { zoom = Math.max(0.6, +(zoom - 0.35).toFixed(2)); applyTransform(); });
  btnReset?.addEventListener("click", () => { zoom = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.16 : -0.16;
    zoom = Math.max(0.6, Math.min(3.5, +(zoom + delta).toFixed(2)));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage) {
      closeModal();
      return;
    }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.classList.add("is-dragging");
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = () => {
    dragging = false;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) {
      e.preventDefault();
      closeModal();
    }
  });
}
