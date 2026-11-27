// 091 开放式构图 · 正文七大节独立交互模块（每节交互形态互不重复）
import { clamp } from "./model.js";

export function initSections() {
  initSection01Doors();
  initSection02Caliper();
  initSection03Curtain();
  initSection04Lineage();
  initSection05Triage();
  initSection06Quiz();
  initSection07Lightbox();
}

// ============================================================================
// 01 四扇画框折门独立开关矩（原海报 4 条要点实时剥离）
// ============================================================================
function initSection01Doors() {
  const flags = { bleed: true, breath: true, open: true, flow: true };
  const btns = [...document.querySelectorAll("[data-door-toggle]")];
  const scoreEl = document.getElementById("doors-score");
  const tierEl = document.getElementById("doors-tier");
  const noteEl = document.getElementById("doors-note");
  const svgWrap = document.getElementById("doors-svg-wrap");

  function render() {
    const count = Object.values(flags).filter(Boolean).length;
    btns.forEach((b) => {
      const k = b.dataset.doorToggle;
      const on = !!flags[k];
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-on", on);
      const stateTag = b.querySelector(".door-state");
      if (stateTag) stateTag.textContent = on ? "已开启" : "已剥离";
    });

    scoreEl.textContent = `${count}/4 道敞开`;
    scoreEl.dataset.state = count === 4 ? "ok" : "bad";

    const tiers = [
      "完全封死（示意）",
      "局促微缝（示意）",
      "半开未透（示意）",
      "差临门一脚（示意）",
      "四面通透（示意）",
    ];
    tierEl.textContent = tiers[count];

    const missing = [];
    if (!flags.bleed) missing.push("「延伸出框」被关闭，太阳与海路全缩回画框内，大脑立刻停止脑补画外风景");
    if (!flags.breath) missing.push("「留白呼吸」被剥离，四角填满灰框杂讯，画面瞬间发闷");
    if (!flags.open) missing.push("「开放空间」被关闭，粗蓝围栏把四边框死，退化成盒中标本");
    if (!flags.flow) missing.push("「视觉延续」被剥离，天蓝弧箭弯回画心打转，视线无处可去");

    noteEl.textContent =
      missing.length === 0
        ? "四道门同时敞开：外围元素破框、左上晴空呼吸、四边无围栏阻隔、弧箭引向画外——大脑通过完形继续律自动把视野放大到画框之外。"
        : `当前缺失 ${missing.length} 项：${missing.join("；")}。`;

    // 实时重绘矢量海岸示意图
    const sunCx = flags.bleed ? 316 : 254;
    const sunCy = flags.bleed ? 24 : 58;
    const brCx = flags.bleed ? 312 : 252;
    const brCy = flags.bleed ? 218 : 178;
    const hillD = flags.bleed
      ? "M150 132 C195 112 248 92 332 96 L332 132 Z"
      : "M152 132 C188 114 232 98 286 110 L286 132 Z";
    const pathD = flags.bleed
      ? "M162 132 C245 148 168 175 215 232 L252 232 C202 178 272 152 170 132 Z"
      : "M162 132 C230 146 185 166 205 196 L232 196 C210 168 248 148 170 132 Z";
    const arrowHtml = flags.flow
      ? `<path d="M156 128 Q208 72 282 54" fill="none" stroke="#69B2FA" stroke-width="4" stroke-linecap="round"/>
         <polygon points="292,50 274,47 280,55 276,63" fill="#69B2FA"/>
         <line x1="288" y1="51" x2="328" y2="38" stroke="#0C52C5" stroke-width="1.4" stroke-dasharray="4 4"/>`
      : `<path d="M156 128 Q186 72 122 92" fill="none" stroke="#C02920" stroke-width="4" stroke-linecap="round"/>
         <polygon points="112,96 128,85 123,93 131,99" fill="#C02920"/>`;
    const clutterHtml = flags.breath
      ? ""
      : `<rect x="18" y="18" width="112" height="44" fill="#FDECEB" stroke="#C02920" stroke-dasharray="4 3" stroke-width="1.4"/>
         <rect x="26" y="34" width="76" height="7" fill="#E39994"/>
         <rect x="18" y="72" width="118" height="54" fill="#FDECEB" stroke="#C02920" stroke-dasharray="4 3" stroke-width="1.4"/>
         <rect x="26" y="88" width="90" height="7" fill="#E39994"/>
         <rect x="26" y="103" width="62" height="7" fill="#E39994"/>
         <rect x="24" y="180" width="142" height="24" fill="#FDECEB" stroke="#C02920" stroke-dasharray="4 3" stroke-width="1.4"/>`;
    const fenceHtml = flags.open
      ? `<rect x="4" y="4" width="312" height="212" fill="none" stroke="#0A6E5C" stroke-width="1.2" stroke-dasharray="5 5" opacity="0.55"/>`
      : `<rect x="9" y="9" width="302" height="202" fill="none" stroke="#0A3C91" stroke-width="7"/>
         <rect x="3" y="3" width="314" height="214" fill="none" stroke="#C02920" stroke-width="1.6" stroke-dasharray="5 4"/>`;

    svgWrap.innerHTML = `<svg viewBox="0 0 320 220" width="320" height="220" role="img" aria-label="四道门实时剥离海岸示意">
      <defs><clipPath id="doorClip"><rect x="4" y="4" width="312" height="212"/></clipPath></defs>
      <g clip-path="url(#doorClip)">
        <rect x="0" y="0" width="320" height="220" fill="#EAF5FC"/>
        <rect x="120" y="132" width="200" height="88" fill="#CBE3FC" opacity="0.58"/>
        <circle cx="242" cy="64" r="46" fill="#FFFFFF" opacity="0.88"/>
        <circle cx="${sunCx}" cy="${sunCy}" r="42" fill="#FEC819"/>
        <path d="${hillD}" fill="#1168D0"/>
        <path d="${pathD}" fill="#FFFFFF"/>
        <polygon points="246,108 256,129 245,129" fill="#FEC819"/>
        <polygon points="244,113 235,129 244,129" fill="#F4A700"/>
        <rect x="234" y="129" width="24" height="3" fill="#0A3C91"/>
        ${arrowHtml}
        <circle cx="${brCx}" cy="${brCy}" r="48" fill="#FEC819"/>
        <circle cx="${flags.bleed ? 12 : 48}" cy="${flags.bleed ? 210 : 176}" r="34" fill="#2074DF"/>
        ${clutterHtml}
      </g>
      ${fenceHtml}
    </svg>`;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.doorToggle;
      flags[k] = !flags[k];
      render();
    });
  });

  render();
}

// ============================================================================
// 02 裁切红线刻度尺（切在哪里，才有想象力：封闭 / 擦边切线 / 黄金破框 / 过切断裂）
// ============================================================================
function initSection02Caliper() {
  const STOPS = [
    {
      id: "inset",
      pct: -12,
      label: "缩进 12%",
      zone: "安全封闭区",
      tone: "warn",
      title: "不敢碰边：画面沦为孤立贴纸",
      body: "所有圆弧、山体和建筑都缩在离边 12% 的安全区里。它很稳妥，但一眼就看得出边界之外空无一物，完全没有向画外延展的自由感。",
    },
    {
      id: "tangent",
      pct: 1,
      label: "擦边 1%",
      zone: "危险相切区（0–5% 经验值）",
      tone: "bad",
      title: "边缘相切：最难受的视觉粘连",
      body: "圆弧和山尖刚好蹭到画框边 1%——既没有呼吸余地，也不够果断跨出边框。格式塔视觉心理把这种似碰非碰的切点读作「紧张误操作」，观者视线会被死死卡在擦边处。",
    },
    {
      id: "golden",
      pct: 28,
      label: "破框 28%",
      zone: "黄金出框带（18%–45% 经验值）",
      tone: "ok",
      title: "恰到好处：切掉近三分之一，大脑自动补全更大世界",
      body: "太阳切出约 28%，山脉与光廊自然延出右缘，但弧度与主体特征依然一眼可辨。大脑顺着被截断的弧线向外脑补，感觉画框外面还连着一片辽阔海域。",
    },
    {
      id: "bold",
      pct: 42,
      label: "破框 42%",
      zone: "强力出框带（18%–45% 经验值）",
      tone: "ok",
      title: "大胆特写：贴近临界但仍守住识别骨架",
      body: "外围大圆与建筑近乎切掉一半，视觉张力与沉浸感极强，常见于时装大刊与大型艺术展海报。前提是核心标题与主体锚点仍稳稳留在安全留白区内。",
    },
    {
      id: "overcut",
      pct: 74,
      label: "过切 74%",
      zone: "过切失认区（>58% 经验值）",
      tone: "bad",
      title: "切得太狠：主体碎成边角残片",
      body: "裁切超过七成后，原本完整的太阳退化成角落一道莫名黄条，主角小帆被右缘劈碎。观众不再想象画外世界，而是怀疑图片排版时是不是忘了缩放。",
    },
  ];

  const slider = document.getElementById("caliper-range");
  const stopBtns = [...document.querySelectorAll("[data-caliper-stop]")];
  const valEl = document.getElementById("caliper-val");
  const zoneEl = document.getElementById("caliper-zone");
  const titleEl = document.getElementById("caliper-title");
  const bodyEl = document.getElementById("caliper-body");
  const svgWrap = document.getElementById("caliper-svg-wrap");

  function describeCrop(pct) {
    if (pct <= -5) return STOPS[0];
    if (pct < 8) return STOPS[1];
    if (pct <= 36) return STOPS[2];
    if (pct <= 52) return STOPS[3];
    return STOPS[4];
  }

  function render(pct) {
    const info = describeCrop(pct);
    valEl.textContent = pct < 0 ? `内缩 ${Math.abs(pct)}%` : `出框 ${pct}%`;
    zoneEl.textContent = info.zone;
    zoneEl.dataset.tone = info.tone;
    titleEl.textContent = info.title;
    bodyEl.textContent = info.body;

    stopBtns.forEach((b) => {
      const target = Number(b.dataset.caliperStop);
      b.classList.toggle("is-active", Math.abs(target - pct) <= 4);
    });

    // 把百分比映射到实时裁切画框（含左侧清晰成品区 + 右侧半透明画外参照区）
    // 画框右缘在 x = 250；圆半径 R = 54；出框 pct% 表示圆超出 x=250 的宽度占直径(108)的 pct%
    const R = 54;
    const frameR = 250;
    const sunCx = frameR - R + (pct / 100) * (2 * R);
    const sunCy = 80;
    const sailX = 165 + (pct + 12) * 1.15; // 过切时小帆被推进右缘切碎
    const borderCol = info.tone === "ok" ? "#0A6E5C" : info.tone === "bad" ? "#C02920" : "#0A45A3";

    const tangentRing =
      pct >= -4 && pct <= 7
        ? `<circle cx="${frameR}" cy="${sunCy}" r="18" fill="none" stroke="#C02920" stroke-width="2" stroke-dasharray="3 3"/>
           <rect x="140" y="69" width="98" height="22" fill="#C02920"/>
           <text x="189" y="84" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">擦边切线粘连</text>`
        : "";
    const overcutWarn =
      pct > 52
        ? `<rect x="148" y="136" width="96" height="22" fill="#C02920"/>
           <text x="196" y="151" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">主角被裁残</text>`
        : "";

    svgWrap.innerHTML = `<svg viewBox="0 0 360 200" width="360" height="200" role="img" aria-label="边界裁切尺度对照图">
      <defs><clipPath id="calipFrame"><rect x="16" y="16" width="234" height="168"/></clipPath></defs>
      <!-- 全幅背景（含右侧画外延展预览区） -->
      <rect x="0" y="0" width="360" height="200" fill="#E3F0FB"/>
      <rect x="250" y="16" width="94" height="168" fill="#D5E7F9" opacity="0.72"/>
      <text x="297" y="34" text-anchor="middle" fill="#355178" font-size="10" font-weight="600">画外空间</text>

      <!-- 画外虚影（展示太阳和山在画框外其实还延续着） -->
      <g opacity="0.34">
        <circle cx="${sunCx}" cy="${sunCy}" r="${R}" fill="#FEC819"/>
        <path d="M110 156 Q190 108 ${Math.max(200, sunCx + 38)} 122 L${Math.max(200, sunCx + 38)} 156 Z" fill="#1168D0"/>
      </g>

      <!-- 成品画框内部 100% 实景 -->
      <g clip-path="url(#calipFrame)">
        <rect x="16" y="16" width="234" height="168" fill="#F2F8FD"/>
        <circle cx="${sunCx}" cy="${sunCy}" r="${R}" fill="#FEC819"/>
        <path d="M110 156 Q190 108 ${Math.max(200, sunCx + 38)} 122 L${Math.max(200, sunCx + 38)} 156 Z" fill="#1168D0"/>
        <polygon points="${sailX},128 ${sailX + 12},154 ${sailX - 1},154" fill="#FEC819"/>
        <polygon points="${sailX - 3},134 ${sailX - 14},154 ${sailX - 3},154" fill="#F2A400"/>
        <rect x="${sailX - 14}" y="154" width="26" height="4" fill="#0A3C91"/>
        <text x="28" y="44" fill="#0759CE" font-size="14" font-weight="900">边界尺度</text>
        <text x="28" y="61" fill="#3E5270" font-size="10">裁切线在右缘</text>
      </g>

      <!-- 画框与右缘裁切红/翠主线 -->
      <rect x="16" y="16" width="234" height="168" fill="none" stroke="#85B3E6" stroke-width="1.2"/>
      <line x1="${frameR}" y1="6" x2="${frameR}" y2="194" stroke="${borderCol}" stroke-width="2.4" stroke-dasharray="5 3"/>
      ${tangentRing}
      ${overcutWarn}
    </svg>`;
  }

  slider.addEventListener("input", () => render(Number(slider.value)));
  stopBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const val = Number(b.dataset.caliperStop);
      slider.value = String(val);
      render(val);
    });
  });

  render(28);
}

// ============================================================================
// 03 深海夜航暗室 · 昼夜幕帘对照台（091 开放式 vs 092 封闭式）
// ============================================================================
function initSection03Curtain() {
  const SCENES = {
    bay: {
      label: "海湾长路",
      closedNote: "封闭式（092）：四道外框把岛屿、太阳与小舟完整装进画内，重心稳、不漂移，适合庄重纪念与完结感。",
      openNote: "开放式（091）：撤掉围栏，太阳、远山与海路顺势穿出画框，观者视线一路越过边界，获得呼吸感与远方想象。",
      closedSvg: `<rect x="0" y="0" width="440" height="270" fill="#10294F"/>
        <rect x="26" y="22" width="388" height="226" fill="#EAF5FC" stroke="#FFD03A" stroke-width="3"/>
        <rect x="38" y="34" width="364" height="202" fill="none" stroke="#0759CE" stroke-width="1.5"/>
        <circle cx="292" cy="96" r="36" fill="#FEC819"/>
        <path d="M96 176 Q175 124 252 146 Q304 128 352 176 Z" fill="#1168D0"/>
        <rect x="96" y="176" width="256" height="36" fill="#C4DFFD"/>
        <polygon points="220,148 232,175 219,175" fill="#FEC819"/>
        <rect x="206" y="175" width="28" height="4" fill="#0759CE"/>
        <text x="220" y="64" text-anchor="middle" fill="#0759CE" font-size="14" font-weight="900">海湾 · 装框完结版</text>`,
      openSvg: `<rect x="0" y="0" width="440" height="270" fill="#EAF5FC"/>
        <rect x="190" y="150" width="250" height="120" fill="#BFDCFD" opacity="0.65"/>
        <circle cx="332" cy="74" r="64" fill="#FFFFFF" opacity="0.88"/>
        <circle cx="426" cy="24" r="64" fill="#FEC819"/>
        <path d="M188 150 C252 122 332 96 456 106 L456 150 Z" fill="#1168D0"/>
        <path d="M210 150 C320 174 226 212 276 280 L330 280 C272 214 358 178 220 150 Z" fill="#FFFFFF"/>
        <polygon points="348,118 362,149 347,149" fill="#FEC819"/>
        <rect x="334" y="149" width="30" height="4" fill="#0A3C91"/>
        <path d="M196 146 Q274 72 384 44" fill="none" stroke="#69B2FA" stroke-width="5" stroke-linecap="round"/>
        <polygon points="396,40 374,36 382,46 376,56" fill="#69B2FA"/>
        <circle cx="426" cy="256" r="68" fill="#FEC819"/>
        <text x="32" y="58" fill="#0759CE" font-size="22" font-weight="900">海天无界</text>
        <text x="32" y="80" fill="#946200" font-size="11" font-weight="700">OPEN HORIZON · 091</text>`,
    },
    poster: {
      label: "艺术展海报",
      closedNote: "封闭式（092）：四周等宽粗蓝框把展品、文字和落款严密包裹，像一幅装裱完成的典藏目录页。",
      openNote: "开放式（091）：大标题左缘微出血、雕塑拱廊破右缘延伸，展厅空间的流动性从纸面漫延到画外。",
      closedSvg: `<rect x="0" y="0" width="440" height="270" fill="#10294F"/>
        <rect x="28" y="20" width="384" height="230" fill="#FAFDFE" stroke="#85B3E6" stroke-width="2"/>
        <rect x="44" y="36" width="352" height="198" fill="none" stroke="#0759CE" stroke-width="3"/>
        <rect x="130" y="96" width="180" height="92" fill="#1168D0"/>
        <path d="M170 188 L170 144 A22 22 0 0 1 214 144 L214 188 Z" fill="#FAFDFE"/>
        <path d="M234 188 L234 144 A22 22 0 0 1 278 144 L278 188 Z" fill="#FAFDFE"/>
        <text x="220" y="72" text-anchor="middle" fill="#0759CE" font-size="15" font-weight="900">建筑光影典藏展</text>
        <text x="220" y="216" text-anchor="middle" fill="#3E5270" font-size="11">全幅收框 · 四边锁定</text>`,
      openSvg: `<rect x="0" y="0" width="440" height="270" fill="#EEF7FD"/>
        <circle cx="422" cy="36" r="58" fill="#FEC819"/>
        <rect x="224" y="92" width="230" height="146" fill="#0F5EC9"/>
        <path d="M262 238 L262 162 A34 34 0 0 1 330 162 L330 238 Z" fill="#EEF7FD"/>
        <path d="M366 238 L366 162 A34 34 0 0 1 434 162 L434 238 Z" fill="#EEF7FD"/>
        <polygon points="184,238 440,162 440,270 120,270" fill="#FFFDF4" opacity="0.88"/>
        <text x="-6" y="76" fill="#0759CE" font-size="38" font-weight="900">光影回廊</text>
        <text x="24" y="106" fill="#946200" font-size="11" font-weight="700">EXHIBITION · OPEN FRAME</text>`,
    },
    web: {
      label: "品牌首屏",
      closedNote: "封闭式（092）：产品图和按钮收在居中圆角大卡片内，信息边界极清楚，适合需要安全感的工具后台。",
      openNote: "开放式（091）：产品视觉冲破右缘与底缘，左半留出清朗呼吸区，自然邀请访客继续往下滚动探索。",
      closedSvg: `<rect x="0" y="0" width="440" height="270" fill="#10294F"/>
        <rect x="46" y="30" width="348" height="210" rx="12" fill="#FAFDFE" stroke="#85B3E6" stroke-width="2"/>
        <rect x="74" y="64" width="128" height="16" fill="#0759CE"/>
        <rect x="74" y="92" width="104" height="9" fill="#6E89AD"/>
        <rect x="74" y="109" width="90" height="9" fill="#6E89AD"/>
        <rect x="74" y="144" width="82" height="26" rx="4" fill="#FEC819"/>
        <rect x="228" y="64" width="138" height="138" rx="8" fill="#DCECFB" stroke="#0759CE" stroke-width="1.5"/>
        <circle cx="297" cy="133" r="38" fill="#1168D0"/>`,
      openSvg: `<rect x="0" y="0" width="440" height="270" fill="#EAF5FC"/>
        <circle cx="408" cy="148" r="118" fill="#1168D0"/>
        <circle cx="418" cy="24" r="56" fill="#FEC819"/>
        <path d="M244 270 Q318 190 440 162 L440 270 Z" fill="#FFFFFF" opacity="0.88"/>
        <rect x="34" y="68" width="160" height="20" fill="#0759CE"/>
        <rect x="34" y="100" width="132" height="10" fill="#3E5270"/>
        <rect x="34" y="118" width="112" height="10" fill="#3E5270"/>
        <rect x="34" y="156" width="96" height="30" fill="#0759CE"/>
        <text x="82" y="175" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700">向外探索 →</text>`,
    },
  };

  const stage = document.getElementById("curtain-stage");
  const openLayer = document.getElementById("curtain-open-layer");
  const closedSvgEl = document.getElementById("curtain-closed-svg");
  const openSvgEl = document.getElementById("curtain-open-svg");
  const handle = document.getElementById("curtain-handle");
  const pctEl = document.getElementById("curtain-pct");
  const noteEl = document.getElementById("curtain-note");
  const tabBtns = [...document.querySelectorAll("[data-curtain-scene]")];

  let sceneKey = "bay";
  let split = 50; // 0..100，左侧封闭占 split%，右侧开放占 100-split%
  let dragging = false;

  function render() {
    const sc = SCENES[sceneKey];
    closedSvgEl.innerHTML = sc.closedSvg;
    openSvgEl.innerHTML = sc.openSvg;
    openLayer.style.clipPath = `inset(0 0 0 ${split}%)`;
    handle.style.left = `${split}%`;
    handle.setAttribute("aria-valuenow", String(Math.round(100 - split)));
    const openShare = Math.round(100 - split);
    pctEl.textContent = `开放视野占比 ${openShare}%`;
    noteEl.textContent = openShare >= 55 ? sc.openNote : openShare <= 45 ? sc.closedNote : `当前对半对照：左侧为 092 封闭式装框，右侧为 091 开放式破框；左右拖拉金黄幕帘感受呼吸差。`;
    tabBtns.forEach((b) => {
      const active = b.dataset.curtainScene === sceneKey;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  function updateFromClientX(clientX) {
    const r = stage.getBoundingClientRect();
    split = clamp(((clientX - r.left) / r.width) * 100, 6, 94);
    render();
  }

  stage.addEventListener("pointerdown", (ev) => {
    dragging = true;
    stage.setPointerCapture(ev.pointerId);
    updateFromClientX(ev.clientX);
  });
  stage.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    updateFromClientX(ev.clientX);
  });
  stage.addEventListener("pointerup", (ev) => {
    dragging = false;
    try {
      if (stage.hasPointerCapture(ev.pointerId)) stage.releasePointerCapture(ev.pointerId);
    } catch {}
  });
  stage.addEventListener("pointercancel", () => {
    dragging = false;
  });

  handle.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      split = clamp(split - 6, 6, 94);
      render();
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      split = clamp(split + 6, 6, 94);
      render();
    }
  });

  tabBtns.forEach((b) => {
    b.addEventListener("click", () => {
      sceneKey = b.dataset.curtainScene;
      render();
    });
  });

  render();
}

// ============================================================================
// 04 五代破框史图谱切换（全部史实均已联网核实）
// ============================================================================
function initSection04Lineage() {
  const ERAS = {
    mayuan: {
      year: "13 世纪初 · 南宋",
      author: "马远 ·《月下赏梅图》",
      source: "美国大都会艺术博物馆馆藏（Accession 1986.493.2）",
      desc: "南宋院体名家马远以「马一角」闻名画史。在《月下赏梅图》中，奇石、梅枝与白衣高士全部压在团扇一侧，大片绢面留给淡墨月色与云雾。人物仰望画外高空，让有限尺幅承载了无垠夜色。",
      svg: `<svg viewBox="0 0 320 210" width="320" height="210" role="img" aria-label="马远一角留白开放结构图解">
        <rect x="10" y="10" width="300" height="190" fill="#F2F8FD" stroke="#85B3E6" stroke-width="1.2"/>
        <circle cx="246" cy="48" r="14" fill="#FEC819"/>
        <path d="M10 198 L10 116 L96 146 L142 198 Z" fill="#0F4EA8"/>
        <path d="M44 134 Q102 98 158 108" fill="none" stroke="#13243E" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="90" cy="140" r="6" fill="#13243E"/>
        <line x1="94" y1="136" x2="228" y2="56" stroke="#0759CE" stroke-width="1.4" stroke-dasharray="5 4"/>
        <text x="220" y="138" text-anchor="middle" fill="#3E5270" font-size="11">大片云雾留白</text>
        <text x="220" y="156" text-anchor="middle" fill="#3E5270" font-size="11">视线望向月夜虚空</text>
      </svg>`,
    },
    degas: {
      year: "1874 · 巴黎",
      author: "埃德加·德加 ·《舞蹈课》",
      source: "美国大都会艺术博物馆馆藏（Accession 1987.47.1）",
      desc: "受日本浮世绘木版画与早期摄影瞬拍影响，德加彻底打破文艺复兴居中完整的学院规矩：他让前景舞者与道具被画边果断截断，倾斜的木地板与右下大块空白把画框变成「偶然掠过的一瞬」。",
      svg: `<svg viewBox="0 0 320 210" width="320" height="210" role="img" aria-label="德加边缘裁切与斜廊空间图解">
        <defs><clipPath id="degasClip"><rect x="10" y="10" width="300" height="190"/></clipPath></defs>
        <g clip-path="url(#degasClip)">
          <rect x="10" y="10" width="300" height="190" fill="#EEF6FC"/>
          <line x1="10" y1="158" x2="310" y2="74" stroke="#85B3E6" stroke-width="1.5"/>
          <line x1="10" y1="194" x2="310" y2="112" stroke="#85B3E6" stroke-width="1.5"/>
          <line x1="76" y1="200" x2="310" y2="148" stroke="#85B3E6" stroke-width="1.5"/>
          <!-- 左缘被果断切掉一半的舞者抽象剪影 -->
          <circle cx="14" cy="96" r="18" fill="#0759CE"/>
          <path d="M-4 186 L8 118 L34 118 L48 186 Z" fill="#0759CE"/>
          <!-- 中后排群像与右下大片空白地板 -->
          <circle cx="118" cy="86" r="10" fill="#3785E8"/>
          <path d="M106 144 L112 98 L124 98 L130 144 Z" fill="#3785E8"/>
          <circle cx="164" cy="78" r="9" fill="#FEC819"/>
          <path d="M154 134 L159 89 L169 89 L174 134 Z" fill="#FEC819"/>
        </g>
        <rect x="10" y="10" width="300" height="190" fill="none" stroke="#0759CE" stroke-width="1.4" stroke-dasharray="5 4"/>
        <text x="206" y="176" text-anchor="middle" fill="#3E5270" font-size="11">截断左缘人物 · 右下大片地板留白</text>
      </svg>`,
    },
    wolfflin: {
      year: "1915 · 慕尼黑",
      author: "海因里希·沃尔夫林 ·《美术史的基本概念》",
      source: "《Kunstgeschichtliche Grundbegriffe》（1915 首版）",
      desc: "瑞士艺术史家沃尔夫林在书中提出五组经典风格范畴，其中第三组正是「封闭形式（geschlossene Form）」与「开放形式（offene Form）」。前者以横平竖直呼应画框收束自身，后者以斜向与破边指向画框之外的无限空间。",
      svg: `<svg viewBox="0 0 320 210" width="320" height="210" role="img" aria-label="沃尔夫林封闭形式与开放形式对比图解">
        <rect x="16" y="24" width="124" height="162" fill="#E6F1FC" stroke="#0A3C91" stroke-width="3"/>
        <line x1="78" y1="40" x2="78" y2="170" stroke="#0A3C91" stroke-width="2"/>
        <line x1="34" y1="105" x2="122" y2="105" stroke="#0A3C91" stroke-width="2"/>
        <text x="78" y="176" text-anchor="middle" fill="#0A3C91" font-size="11" font-weight="700">封闭形式</text>

        <rect x="176" y="24" width="128" height="162" fill="#F4F9FD" stroke="#69B2FA" stroke-width="1.4" stroke-dasharray="5 4"/>
        <line x1="164" y1="176" x2="314" y2="34" stroke="#0759CE" stroke-width="4"/>
        <circle cx="304" cy="44" r="24" fill="#FEC819" opacity="0.88"/>
        <text x="240" y="176" text-anchor="middle" fill="#0759CE" font-size="11" font-weight="700">开放形式 · 破轴外指</text>
      </svg>`,
    },
    arnheim: {
      year: "1954 / 1974 · 加州大学出版社",
      author: "鲁道夫·阿恩海姆 ·《艺术与视知觉》",
      source: "《Art and Visual Perception》（1954 首版，1974 修订版）",
      desc: "格式塔视觉心理学家阿恩海姆指出，画框并不是一块毫无脾气的中性边框，而是一个活跃的力场：它既可扮演把图形关住的「围栏」，也可扮演通向延展世界的「窗户」。元素贴近边界会产生明显的推拉张力。",
      svg: `<svg viewBox="0 0 320 210" width="320" height="210" role="img" aria-label="阿恩海姆画框窗户力场图解">
        <rect x="44" y="22" width="232" height="166" fill="#F2F8FD" stroke="#0759CE" stroke-width="1.6" stroke-dasharray="6 4"/>
        <circle cx="276" cy="105" r="44" fill="#FEC819" opacity="0.4"/>
        <path d="M276 61 A44 44 0 0 0 276 149 Z" fill="#FEC819"/>
        <path d="M160 105 L296 105" stroke="#0759CE" stroke-width="2" stroke-dasharray="4 3"/>
        <polygon points="304,105 292,99 292,111" fill="#0759CE"/>
        <text x="160" y="48" text-anchor="middle" fill="#0A45A3" font-size="11" font-weight="700">画框 = 截在更大空间上的「窗户」</text>
        <text x="160" y="174" text-anchor="middle" fill="#3E5270" font-size="11">半圆跨出边界 → 脑补向画外延续</text>
      </svg>`,
    },
    burch: {
      year: "1969 / 1973 · 巴黎与普林斯顿",
      author: "诺埃尔·伯奇 ·《电影实践理论》",
      source: "法文首版《Praxis du cinéma》（1969）；英译《Theory of Film Practice》（1973）",
      desc: "电影理论家伯奇把银幕边界之外看不见的「画外空间（off-screen space）」精确划分成六个区域：银幕上、下、左、右四边之外，以及布景之后与摄影机之后。人物的目光、半身出画与运动方向不断激活画外世界。",
      svg: `<svg viewBox="0 0 320 210" width="320" height="210" role="img" aria-label="伯奇六向画外空间图解">
        <rect x="82" y="54" width="156" height="102" fill="#0759CE"/>
        <text x="160" y="109" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700">可见画框</text>
        <!-- 四边外延箭头 -->
        <line x1="160" y1="54" x2="160" y2="18" stroke="#946200" stroke-width="2.4"/>
        <polygon points="160,12 154,22 166,22" fill="#946200"/>
        <line x1="160" y1="156" x2="160" y2="192" stroke="#946200" stroke-width="2.4"/>
        <polygon points="160,198 154,188 166,188" fill="#946200"/>
        <line x1="82" y1="105" x2="34" y2="105" stroke="#946200" stroke-width="2.4"/>
        <polygon points="28,105 38,99 38,111" fill="#946200"/>
        <line x1="238" y1="105" x2="286" y2="105" stroke="#946200" stroke-width="2.4"/>
        <polygon points="292,105 282,99 282,111" fill="#946200"/>
        <text x="272" y="34" text-anchor="middle" fill="#3E5270" font-size="10">＋ 景深之后</text>
        <text x="272" y="190" text-anchor="middle" fill="#3E5270" font-size="10">＋ 镜前之外</text>
      </svg>`,
    },
  };

  const btns = [...document.querySelectorAll("[data-era-btn]")];
  const yearEl = document.getElementById("era-year");
  const authorEl = document.getElementById("era-author");
  const sourceEl = document.getElementById("era-source");
  const descEl = document.getElementById("era-desc");
  const svgEl = document.getElementById("era-svg");

  function select(key) {
    const item = ERAS[key];
    if (!item) return;
    yearEl.textContent = item.year;
    authorEl.textContent = item.author;
    sourceEl.textContent = item.source;
    descEl.textContent = item.desc;
    svgEl.innerHTML = item.svg;
    btns.forEach((b) => {
      const on = b.dataset.eraBtn === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.eraBtn)));
  select("mayuan");
}

// ============================================================================
// 05 六类真实项目分诊翻牌（什么时候用 / 什么时候别用）
// ============================================================================
function initSection05Triage() {
  const cards = [...document.querySelectorAll("[data-triage-card]")];
  cards.forEach((card) => {
    const trigger = card.querySelector(".triage-trigger");
    trigger.addEventListener("click", () => {
      const open = card.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });
  });
}

// ============================================================================
// 06 深海考场 · 两道单变量练习题（严禁泄露好坏标签，仅标 方案 A/B/C/D）
// ============================================================================
function initSection06Quiz() {
  const ROUNDS = [
    {
      title: "第 1 题 · 边界裁切尺度（仅改变元素与边框的距离）",
      prompt: "四张同为「海湾艺术季」蓝金海报，色彩与字号完全相同。哪一张真正实现了开放式构图，既打破边界又不伤及识别？",
      answer: "C",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <rect x="8" y="8" width="164" height="110" fill="none" stroke="#0A3C91" stroke-width="3"/>
            <circle cx="136" cy="40" r="18" fill="#FEC819"/>
            <path d="M84 82 Q116 58 156 66 L156 82 Z" fill="#1168D0"/>
            <path d="M98 82 Q132 92 108 106 L124 106 Q142 94 104 82 Z" fill="#FFFFFF"/>
            <polygon points="124,62 132,81 123,81" fill="#FEC819"/>
            <path d="M88 80 Q114 48 144 40" fill="none" stroke="#69B2FA" stroke-width="2.3"/>
            <polygon points="150,38 140,36 143,44" fill="#69B2FA"/>
            <text x="20" y="34" fill="#0759CE" font-size="13" font-weight="900">海湾季</text>`,
          overlay: `<rect x="8" y="8" width="164" height="110" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="4 3"/>`,
          why: "方案 A 把所有元素都关在粗蓝边框内部，0 处元素出框，属于典型的 092 封闭式构图。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <circle cx="160" cy="22" r="19" fill="#FEC819"/>
            <path d="M88 82 Q124 52 178 60 L178 82 Z" fill="#1168D0"/>
            <path d="M98 82 Q134 94 112 123 L134 123 Q148 96 104 82 Z" fill="#FFFFFF"/>
            <polygon points="134,60 142,81 133,81" fill="#FEC819"/>
            <path d="M92 80 Q126 44 156 34" fill="none" stroke="#69B2FA" stroke-width="2.3"/>
            <polygon points="162,32 152,30 155,38" fill="#69B2FA"/>
            <text x="16" y="34" fill="#0759CE" font-size="13" font-weight="900">海湾季</text>`,
          overlay: `<circle cx="179" cy="22" r="12" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="3 2"/>
            <circle cx="178" cy="70" r="12" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="3 2"/>`,
          why: "方案 B 的太阳、远山和海路都刚好停在离边缘 1%–2% 的「擦边切线」上，既不进也不出，产生刺眼的边缘粘连。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <circle cx="176" cy="10" r="26" fill="#FEC819"/>
            <path d="M86 80 Q132 48 192 56 L192 80 Z" fill="#1168D0"/>
            <path d="M96 80 C142 92 104 108 124 134 L148 134 C124 110 158 92 104 80 Z" fill="#FFFFFF"/>
            <polygon points="138,58 147,79 137,79" fill="#FEC819"/>
            <path d="M92 78 Q128 40 162 28" fill="none" stroke="#69B2FA" stroke-width="2.5"/>
            <polygon points="168,26 158,24 161,32" fill="#69B2FA"/>
            <text x="16" y="34" fill="#0759CE" font-size="13" font-weight="900">海湾季</text>`,
          overlay: `<line x1="166" y1="26" x2="180" y2="20" stroke="#4EE0BE" stroke-width="2" stroke-dasharray="3 2"/>
            <rect x="2" y="2" width="176" height="122" fill="none" stroke="#4EE0BE" stroke-width="2"/>`,
          why: "答对了！方案 C 撤掉封闭围栏，让太阳、远山、海路果断破出右缘与底边约 25%–35%，弧箭指向画外，同时主角小帆与标题稳留在呼吸区内。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <circle cx="192" cy="4" r="24" fill="#FEC819"/>
            <path d="M126 80 Q162 46 210 52 L210 80 Z" fill="#1168D0"/>
            <polygon points="176,54 186,79 175,79" fill="#FEC819"/>
            <path d="M132 78 Q154 44 174 30" fill="none" stroke="#69B2FA" stroke-width="2.3"/>
            <polygon points="180,26 170,25 174,33" fill="#69B2FA"/>
            <text x="16" y="34" fill="#0759CE" font-size="13" font-weight="900">海湾季</text>`,
          overlay: `<rect x="166" y="50" width="14" height="32" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="3 2"/>`,
          why: "方案 D 推进过猛，把主角小金帆硬生生劈在右缘外，主体残缺失认，滑向「过切失误」。",
        },
      ],
    },
    {
      title: "第 2 题 · 空间呼吸与视线延续（仅改变留白与指向关系）",
      prompt: "四张同为「光影回廊特展」封面。哪一张兼顾了破框、留白呼吸与向外视觉延续？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <rect x="108" y="42" width="84" height="84" fill="#1168D0"/>
            <rect x="8" y="8" width="90" height="38" fill="#BBD5F5"/>
            <rect x="8" y="52" width="90" height="34" fill="#BBD5F5"/>
            <rect x="8" y="92" width="94" height="26" fill="#BBD5F5"/>
            <path d="M116 62 Q92 34 62 64" fill="none" stroke="#C02920" stroke-width="2.6"/>
            <polygon points="56,69 67,67 60,59" fill="#C02920"/>`,
          overlay: `<rect x="8" y="8" width="94" height="110" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="4 3"/>`,
          why: "方案 A 虽有拱廊破右缘，但左半被三个大块堵死（留白塌陷），且箭头往内折回，毫无呼吸感与外延。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <circle cx="174" cy="14" r="24" fill="#FEC819"/>
            <rect x="98" y="44" width="92" height="82" fill="#1168D0"/>
            <path d="M114 126 L114 82 A14 14 0 0 1 142 82 L142 126 Z" fill="#EAF5FC"/>
            <path d="M156 126 L156 82 A14 14 0 0 1 184 82 L184 126 Z" fill="#EAF5FC"/>
            <path d="M96 66 Q128 32 162 24" fill="none" stroke="#69B2FA" stroke-width="2.5"/>
            <polygon points="168,22 158,20 161,28" fill="#69B2FA"/>
            <text x="16" y="34" fill="#0759CE" font-size="13" font-weight="900">光影回廊</text>`,
          overlay: `<rect x="2" y="2" width="176" height="122" fill="none" stroke="#4EE0BE" stroke-width="2"/>`,
          why: "答对了！方案 B 拱门与日光自然破右缘与顶缘，光线斜向画外，左上半幅留出充沛晴空承托标题，敞开而有节奏。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <rect x="98" y="44" width="82" height="82" fill="#1168D0"/>
            <path d="M114 126 L114 82 A14 14 0 0 1 142 82 L142 126 Z" fill="#EAF5FC"/>
            <text x="18" y="34" fill="#0759CE" font-size="13" font-weight="900">光影回廊</text>
            <rect x="6" y="6" width="168" height="114" fill="none" stroke="#0A3C91" stroke-width="5"/>
            <rect x="14" y="14" width="152" height="98" fill="none" stroke="#FEC819" stroke-width="2"/>`,
          overlay: `<rect x="6" y="6" width="168" height="114" fill="none" stroke="#FF7A70" stroke-width="2" stroke-dasharray="4 3"/>`,
          why: "方案 C 外圈硬加了粗重双线封闭框，把本来向外延展的拱门重新关进铁笼，画外想象瞬间被切断。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: `<rect width="180" height="126" fill="#EAF5FC"/>
            <circle cx="32" cy="96" r="10" fill="#1168D0"/>
            <text x="16" y="34" fill="#0759CE" font-size="13" font-weight="900">光影回廊</text>`,
          overlay: `<rect x="12" y="12" width="156" height="102" fill="none" stroke="#FF7A70" stroke-width="1.6" stroke-dasharray="4 4"/>`,
          why: "方案 D 留白超过九成，既没有元素破框、也没有走向引导，只剩孤零零一点，开放滑向苍白空洞。",
        },
      ],
    },
  ];

  const roundBtns = [...document.querySelectorAll("[data-quiz-round]")];
  const titleEl = document.getElementById("quiz-round-title");
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");

  let current = 0;
  const picked = [null, null];

  function render() {
    const r = ROUNDS[current];
    const choice = picked[current];

    roundBtns.forEach((b) => {
      const on = Number(b.dataset.quizRound) === current;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    titleEl.textContent = r.title;
    promptEl.textContent = r.prompt;

    gridEl.innerHTML = r.options
      .map((opt) => {
        const isChosen = choice === opt.id;
        const isAnswer = opt.id === r.answer;
        let stateCls = "";
        if (choice) {
          if (isAnswer) stateCls = "is-correct";
          else if (isChosen) stateCls = "is-wrong";
        }
        return `<button type="button" class="quiz-card ${stateCls}" data-quiz-opt="${opt.id}" aria-pressed="${isChosen}">
          <span class="quiz-svg-box">
            <svg viewBox="0 0 180 126" width="180" height="126" aria-hidden="true">
              ${opt.svg}
              ${choice ? opt.overlay : ""}
            </svg>
          </span>
          <span class="quiz-card-label">${opt.label}</span>
        </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[current] = btn.dataset.quizOpt;
        render();
      });
    });

    if (!choice) {
      fbEl.dataset.state = "idle";
      fbEl.innerHTML = `<p>请任选上方一张卡片作答。四张仅相差一个构图变量，选完后将在全部四张图上叠加边界解析线。</p>`;
    } else {
      const opt = r.options.find((o) => o.id === choice);
      const right = choice === r.answer;
      fbEl.dataset.state = right ? "ok" : "bad";
      const otherNotes = r.options
        .filter((o) => o.id !== choice)
        .map((o) => `<li><strong>${o.label}</strong>：${o.why}</li>`)
        .join("");
      fbEl.innerHTML = `<p class="quiz-fb-lead"><strong>${right ? "判断准确！" : `所选${opt.label}未达标：`}</strong>${opt.why}</p><ul class="quiz-fb-list">${otherNotes}</ul>`;
    }
  }

  roundBtns.forEach((b) => {
    b.addEventListener("click", () => {
      current = Number(b.dataset.quizRound);
      render();
    });
  });

  render();
}

// ============================================================================
// 07 原海报灯箱（点击放大、滚轮/按钮缩放、真实拖拽、draggable="false"、Esc 关）
// ============================================================================
function initSection07Lightbox() {
  const poster = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const viewport = document.getElementById("poster-modal-viewport");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomRead = document.getElementById("poster-zoom-read");
  const closeBtn = document.getElementById("poster-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomRead.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    // 复用页面唯一内联海报 src，不二次打包
    if (!modalImg.src) modalImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    poster.focus();
  }

  poster.addEventListener("click", openModal);
  poster.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      openModal();
    }
  });
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) closeModal();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.hidden) {
      ev.preventDefault();
      closeModal();
    }
  });

  zoomInBtn.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 1, 3.4);
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 1, 3.4);
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  viewport.addEventListener(
    "wheel",
    (ev) => {
      if (modal.hidden) return;
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 0.2 : -0.2;
      scale = clamp(+(scale + delta).toFixed(2), 1, 3.4);
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  viewport.addEventListener("pointerdown", (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, tx, ty };
    viewport.setPointerCapture(ev.pointerId);
  });
  viewport.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    tx = drag.tx + (ev.clientX - drag.x);
    ty = drag.ty + (ev.clientY - drag.y);
    applyTransform();
  });
  viewport.addEventListener("pointerup", (ev) => {
    drag = null;
    try {
      if (viewport.hasPointerCapture(ev.pointerId)) viewport.releasePointerCapture(ev.pointerId);
    } catch {}
  });
  viewport.addEventListener("pointercancel", () => {
    drag = null;
  });
}
