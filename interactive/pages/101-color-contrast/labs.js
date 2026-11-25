// 101 色彩对比 · 各节交互实验与海报大图预览

import { bestInkOn, clamp, contrastRatio, GOETHE_PAIRS, hexToRgb, hslToRgb, POSTER, relativeLuminance, rgbToHex, simulateVision } from "./color.js";

const $ = (id) => document.getElementById(id);

// =========================================================================
// 01 · 谢弗勒尔 & 阿尔伯斯「同色异相」实验台
// =========================================================================
const ALBERS_PLATES = {
  bo: {
    label: "钴蓝 × 朱橙（冷暖互补）",
    leftBg: "#0f42d5",
    rightBg: "#f5590e",
    inner: "#726a74",
    leftPerceived: "在钴蓝上可能显得略暖、略亮",
    rightPerceived: "在朱橙上可能显得略冷、略暗",
    explain: "两块中心方块完全是同一色值 #726A74。按谢弗勒尔同时对比定律，周边底色会把人眼感知往补色与相反明度方向推——当中心块足够小、四周被底色充分包围时，它在钴蓝上可能显得略暖略亮，在朱橙上可能显得略冷略暗。",
  },
  value: {
    label: "深靛 × 浅米（明度牵引）",
    leftBg: "#12245c",
    rightBg: "#f2e7d2",
    inner: "#6d7894",
    leftPerceived: "在深靛底上可能显得更亮、更浮",
    rightPerceived: "在浅米底上可能显得偏暗、偏沉",
    explain: "色相没有变，两块 #6D7894 在深底上可能被「抬亮」、在浅底上可能被「压暗」。背景的明度会直接改写前景在眼睛里的深浅感受。",
  },
  chroma: {
    label: "高纯朱橙 × 暖灰（饱和牵引）",
    leftBg: "#f5590e",
    rightBg: "#cfc5b7",
    inner: "#d67746",
    leftPerceived: "在纯橙底上可能显得偏灰、发闷",
    rightPerceived: "在暖灰底上可能显得更鲜亮",
    explain: "两块 #D67746 原本是中等纯度的砖橙。塞进极高饱和的纯橙里，它可能显得偏灰发闷；放进低饱和暖灰里，它反而可能显得鲜活醒目。",
  },
};

const ALBERS_SIZES = {
  small: { w: 28, h: 54, y: 70 },
  large: { w: 96, h: 102, y: 46 },
};

export function initAlbersLab() {
  const plateSeg = $("albers-plate");
  const sizeSeg = $("albers-size");
  const range = $("albers-bridge");
  const btn = $("albers-toggle");
  const out = $("albers-out");
  const read = $("albers-read");
  const hexTag = $("albers-hex");

  const bgL = $("alb-bg-l");
  const bgR = $("alb-bg-r");
  const sqL = $("alb-sq-l");
  const sqR = $("alb-sq-r");
  const lblL = $("alb-lbl-l");
  const lblR = $("alb-lbl-r");
  const proofGrp = $("alb-proof-grp");
  const proofBar = $("alb-proof-lbl");

  let key = "bo";
  let size = "small";
  let bridge = 0; // 0 = 分离，100 = 拼成一整条证明同色

  function render() {
    const p = ALBERS_PLATES[key];
    const sz = ALBERS_SIZES[size];
    bgL.setAttribute("fill", p.leftBg);
    bgR.setAttribute("fill", p.rightBg);
    sqL.setAttribute("fill", p.inner);
    sqR.setAttribute("fill", p.inner);

    // 尺寸与位置：从各自半区正中 (110, 330) 滑动到中缝严丝合缝 (220 - w, 220)
    const t = bridge / 100;
    const x0L = 110 - sz.w / 2;
    const x0R = 330 - sz.w / 2;
    const xL = x0L + (220 - sz.w - x0L) * t;
    const xR = x0R - (x0R - 220) * t;
    sqL.setAttribute("x", xL.toFixed(1));
    sqL.setAttribute("y", String(sz.y));
    sqL.setAttribute("width", String(sz.w));
    sqL.setAttribute("height", String(sz.h));
    sqR.setAttribute("x", xR.toFixed(1));
    sqR.setAttribute("y", String(sz.y));
    sqR.setAttribute("width", String(sz.w));
    sqR.setAttribute("height", String(sz.h));

    const inkL = bestInkOn(hexToRgb(p.leftBg));
    const inkR = bestInkOn(hexToRgb(p.rightBg));
    lblL.setAttribute("fill", inkL);
    lblR.setAttribute("fill", inkR);
    lblL.textContent = p.leftPerceived;
    lblR.textContent = p.rightPerceived;
    lblL.style.opacity = String(1 - t * 0.9);
    lblR.style.opacity = String(1 - t * 0.9);

    proofGrp.setAttribute("opacity", t > 0.82 ? "1" : "0");
    proofBar.textContent = `同一块 ${p.inner.toUpperCase()} · 零色差`;

    hexTag.textContent = p.inner.toUpperCase();
    out.textContent = bridge >= 95 ? "已合体" : `${bridge}%`;
    btn.setAttribute("aria-pressed", String(bridge >= 95));
    btn.textContent = bridge >= 95 ? "分开恢复幻觉" : "一键合体证明同色";

    if (bridge >= 90) {
      read.textContent = `中缝消失了——两块色块合成一条毫无接缝的 ${p.inner.toUpperCase()}。把它再拉回两侧，同时对比的偏移感会重新出现。`;
    } else if (size === "large") {
      read.textContent = `中心块放大后，它自身占掉更大视野，四周底色的包围牵引明显变弱，两块 ${p.inner.toUpperCase()} 更容易看回接近的本色；切回「小块」再看面积缩小时的变化。`;
    } else {
      read.textContent = p.explain;
    }
  }

  plateSeg.addEventListener("change", (e) => {
    key = e.target.value;
    bridge = 0;
    range.value = "0";
    render();
  });
  sizeSeg.addEventListener("change", (e) => {
    size = e.target.value;
    render();
  });
  range.addEventListener("input", () => {
    bridge = +range.value;
    render();
  });
  btn.addEventListener("click", () => {
    bridge = bridge >= 95 ? 0 : 100;
    range.value = String(bridge);
    render();
  });

  render();
}

// =========================================================================
// 02 · 原海报六维拆解仪（忠实引用海报 6 条要点 + 强弱对照实时标本）
// =========================================================================
const SIX_DIMS = {
  warmcool: {
    zh: "冷暖",
    en: "WARM & COOL",
    quote: "冷色后退 暖色前进",
    dot: POSTER.blue,
    strong: {
      bg: "#0f42d5",
      panel: "#1939a8",
      circle: "#f5590e",
      badge: "#f5590e",
      title: "#f7f0e5",
      sub: "#c9d6ff",
      note: "强冷暖：钴蓝底沉在后面，暖橙圆与按钮往前推，扁平画面立刻生出前后纵深。",
    },
    weak: {
      bg: "#3b5ba5",
      panel: "#4769b3",
      circle: "#5887c7",
      badge: "#4a73b8",
      title: "#f7f0e5",
      sub: "#cad8f2",
      note: "弱冷暖：全是冷色家族，圆面和底色待在同一层平面里，谁也不往外跳。",
    },
    extra: "伊顿七种对比中的「冷暖对比」：最暖一端在红橙，最冷一端在蓝绿，色温差自带空间感与心理温度。",
  },
  brightness: {
    zh: "明度",
    en: "BRIGHTNESS",
    quote: "明暗对比 增强层次",
    dot: POSTER.orange,
    strong: {
      bg: "#12151f",
      panel: "#1f273d",
      circle: "#f7d452",
      badge: "#f7f0e5",
      title: "#f7f0e5",
      sub: "#b7c1db",
      note: "强明度：高明度明黄与深墨蓝拉开大幅亮度差，即使抽成黑白，标题和图形的层级依旧清清楚楚。",
    },
    weak: {
      bg: "#58688a",
      panel: "#667696",
      circle: "#8f6f63",
      badge: "#7a7068",
      title: "#9ca8bd",
      sub: "#8a96ad",
      note: "弱明度：色相虽然一蓝一棕，但明度挤在中灰段，整张卡像蒙了一层雾，信息层级瞬间塌陷。",
    },
    extra: "纯黑白灰的明暗结构是 100 号明暗对比原则的主场；在彩色里，明度差决定了字能不能读清、层级立不立得住。",
  },
  complementary: {
    zh: "互补",
    en: "COMPLEMENTARY",
    quote: "色相相对 形成强对比",
    dot: POSTER.orange,
    strong: {
      bg: "#0f42d5",
      panel: "#0b319f",
      circle: "#f5590e",
      badge: "#f5590e",
      title: "#f7f0e5",
      sub: "#ffd5bf",
      note: "强互补：色轮对角的蓝与橙正面交锋，彼此把对方的鲜度拉满，视觉爆发力最强。",
    },
    weak: {
      bg: "#0f42d5",
      panel: "#1b4cd9",
      circle: "#2b73e8",
      badge: "#3a7ce8",
      title: "#f7f0e5",
      sub: "#bfd4ff",
      note: "弱色相：蓝配浅蓝属于同类色，视觉安静顺滑，但没有「一下子抓住眼球」的戏剧冲突。",
    },
    extra: "伊顿指出：互补色并置时互相激发出最高鲜度，物理混合（或颜料叠印）时却会彼此中和成灰黑——正是海报底部的方程。",
  },
  proportion: {
    zh: "面积",
    en: "PROPORTION",
    quote: "主次分明 对比更有效",
    dot: POSTER.blue,
    strong: {
      bg: "#f7f0e5",
      panel: "#0f42d5",
      circle: "#f5590e",
      badge: "#f5590e",
      title: "#10100e",
      sub: "#4f4b44",
      compactAccent: true,
      note: "主次分明：大块纸白和深蓝撑起秩序，只留极小一块暖橙做焦点——少反而最抢眼。",
    },
    weak: {
      bg: "#0f42d5",
      panel: "#f5590e",
      circle: "#f5590e",
      badge: "#0f42d5",
      title: "#f7f0e5",
      sub: "#f7f0e5",
      evenSplit: true,
      note: "面积五五开：蓝一半、橙一半，两边都想当主角，结果视线在中间左右摇摆，谁也没赢。",
    },
    extra: "伊顿称之为「面积对比（Contrast of Extension）」：把强色缩成小面积，它的视觉能量反而比铺满半屏更集中。",
  },
  saturation: {
    zh: "饱和",
    en: "SATURATION",
    quote: "高饱和更醒目 低饱和更平衡",
    dot: POSTER.blue,
    strong: {
      bg: "#d8d1c5",
      panel: "#c7bfb2",
      circle: "#f5590e",
      badge: "#f5590e",
      title: "#10100e",
      sub: "#524c43",
      note: "纯度反差：大面积低饱和暖灰托起一颗 95% 高纯度朱橙——既稳重平衡，又把焦点精准点亮。",
    },
    weak: {
      bg: "#1257ff",
      panel: "#ff4800",
      circle: "#ffe100",
      badge: "#00d46a",
      title: "#ffffff",
      sub: "#fff4b8",
      note: "全员满饱和：蓝、橙、黄、绿全部拉到极纯，每个角落都在尖叫，看三秒就眼累，反倒失去重点。",
    },
    extra: "伊顿称为「纯度对比（Contrast of Quality）」：低饱和不是「不好看」，它恰恰是给高饱和让路的静音场。",
  },
  mood: {
    zh: "情绪",
    en: "MOOD",
    quote: "色彩影响感受 传递情绪信息",
    dot: POSTER.orange,
    strong: {
      bg: "#f5590e",
      panel: "#d94500",
      circle: "#ffd23f",
      badge: "#10100e",
      title: "#fbf7f0",
      sub: "#ffe7d6",
      note: "热烈高能：高饱和暖橙配明黄，直觉上传递奔跑、夏日、促销与活力，情绪指向瞬间明确。",
    },
    weak: {
      bg: "#e7ecef",
      panel: "#d5dfe6",
      circle: "#3d6b8a",
      badge: "#1f3c52",
      title: "#142636",
      sub: "#4c6375",
      note: "沉静理性：同一套版式换成低饱和冷灰蓝，立刻变得冷静、克制、偏医疗或专业工具气质。",
    },
    extra: "色彩的情绪联想兼具生理唤醒（暖高纯更兴奋）与文化语境（不同地区对红、白、紫的象征不同），需结合受众拿捏。",
  },
};

export function initSixLab() {
  const tabs = [...document.querySelectorAll(".dim-tab")];
  const toggleBtn = $("dim-toggle");
  const svg = $("dim-svg");
  const quoteEl = $("dim-quote");
  const extraEl = $("dim-extra");
  const noteEl = $("dim-note");
  const stateTag = $("dim-state-tag");

  let active = "complementary";
  let strongMode = true;

  function render() {
    const d = SIX_DIMS[active];
    const p = strongMode ? d.strong : d.weak;

    tabs.forEach((b) => {
      const on = b.dataset.dim === active;
      b.setAttribute("aria-selected", String(on));
      b.classList.toggle("on", on);
    });

    const isMood = active === "mood";
    toggleBtn.textContent = isMood
      ? (strongMode ? "切到：沉静理性冷调" : "切到：热烈高能暖调")
      : (strongMode ? "看反例：压弱 / 失控" : "切回：有效强对比");
    toggleBtn.setAttribute("aria-pressed", String(!strongMode));

    stateTag.textContent = isMood
      ? (strongMode ? "暖调 · 热烈高能" : "冷调 · 沉静理性")
      : (strongMode ? "有效对比" : "反例对照");
    stateTag.dataset.kind = strongMode ? "good" : "weak";

    // 根据面积模式微调内部结构，让「面积」维度真正看得见面积差异
    const bgSplit = p.evenSplit
      ? `<rect x="0" y="0" width="170" height="230" fill="${p.bg}"/><rect x="170" y="0" width="170" height="230" fill="${p.panel}"/>`
      : p.compactAccent
        ? `<rect x="0" y="0" width="340" height="230" fill="${p.bg}"/><rect x="0" y="156" width="340" height="74" fill="${p.panel}"/>`
        : `<rect x="0" y="0" width="340" height="230" fill="${p.bg}"/><rect x="18" y="18" width="304" height="194" fill="${p.panel}" opacity="0.45"/>`;

    const circleR = p.compactAccent ? 20 : p.evenSplit ? 54 : 44;
    const circleX = p.compactAccent ? 286 : 248;
    const circleY = p.compactAccent ? 56 : 112;
    const badgeInk = bestInkOn(hexToRgb(p.badge));

    svg.innerHTML = `
      ${bgSplit}
      <line x1="170" y1="8" x2="170" y2="222" stroke="${p.title}" stroke-opacity="0.22" stroke-dasharray="4 4"/>
      <circle cx="${circleX}" cy="${circleY}" r="${circleR}" fill="${p.circle}"/>
      <rect x="28" y="34" width="112" height="18" fill="${p.title}"/>
      <rect x="28" y="60" width="84" height="12" fill="${p.title}" opacity="0.72"/>
      <rect x="28" y="88" width="132" height="6" fill="${p.sub}" opacity="0.85"/>
      <rect x="28" y="100" width="106" height="6" fill="${p.sub}" opacity="0.65"/>
      <rect x="28" y="112" width="118" height="6" fill="${p.sub}" opacity="0.55"/>
      <rect x="28" y="174" width="98" height="30" rx="2" fill="${p.badge}"/>
      <text x="77" y="193" text-anchor="middle" font-size="12" font-weight="700" fill="${badgeInk}">行动按钮</text>
      <text x="316" y="204" text-anchor="end" font-size="10" font-family="Space Mono, monospace" fill="${p.compactAccent ? "#f7f0e5" : p.sub}">${d.en}</text>
    `;

    quoteEl.innerHTML = `<span class="dim-dot" style="background:${d.dot}"></span><b>${d.zh}</b> <span lang="en">${d.en}</span> · 「${d.quote}」`;
    noteEl.textContent = p.note;
    extraEl.textContent = d.extra;
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.dim;
      strongMode = true;
      render();
    })
  );
  toggleBtn.addEventListener("click", () => {
    strongMode = !strongMode;
    render();
  });

  render();

  return {
    setDim(dim) {
      if (!SIX_DIMS[dim]) return;
      active = dim;
      strongMode = true;
      render();
    },
  };
}

// =========================================================================
// 03 · 「冷色后退、暖色前进」有前提：冷暖 vs 明度拉锯实验
// =========================================================================
export function initTempLab() {
  const modeSeg = $("temp-mode");
  const liftRange = $("temp-lift");
  const liftOut = $("temp-lift-out");
  const svg = $("temp-svg");
  const verdict = $("temp-verdict");
  const badge = $("temp-badge");

  let mode = "classic"; // classic | invert | vibrate
  let lift = 52; // 前景明度 20..88

  function render() {
    let bgRgb, fgRgb, bgName, fgName;
    if (mode === "classic") {
      bgRgb = hexToRgb("#0f42d5");
      fgRgb = hslToRgb(19, 92, lift);
      bgName = "钴蓝冷底";
      fgName = "朱橙暖圆";
    } else if (mode === "invert") {
      bgRgb = hexToRgb("#6e2709"); // 深暖棕红底
      fgRgb = hslToRgb(205, 88, lift); // 冰蓝冷圆
      bgName = "深暖棕红底";
      fgName = "冷蓝圆";
    } else {
      bgRgb = hexToRgb("#1236c7");
      fgRgb = hslToRgb(2, 92, lift); // 正红配纯蓝
      bgName = "高饱和纯蓝底";
      fgName = "高饱和正红圆";
    }

    const bgHex = rgbToHex(bgRgb);
    const fgHex = rgbToHex(fgRgb);
    const ratio = contrastRatio(bgRgb, fgRgb);
    const lumBg = relativeLuminance(bgRgb);
    const lumFg = relativeLuminance(fgRgb);
    const lumGap = lumFg - lumBg;
    const inkOnFg = bestInkOn(fgRgb);
    const inkOnBg = bestInkOn(bgRgb);

    // 根据结果给出真实视觉判断
    if (mode === "vibrate" && ratio < 2.2) {
      badge.textContent = "边缘震颤 · 伤眼预警";
      badge.dataset.kind = "warn";
      verdict.textContent = `纯红与纯蓝的亮度差极小（对比度仅 ${ratio.toFixed(2)}:1），但波长色差极大。色立体视效应会让红蓝边缘微微发颤，字越看越晕——这正是高饱和互补色最忌讳的等明度碰撞。`;
    } else if (mode === "invert" && lumGap > 0.16) {
      badge.textContent = "明度反杀 · 冷色跳到前面";
      badge.dataset.kind = "good";
      verdict.textContent = `尽管背景是暖色、圆是冷色，但浅冰蓝比深暖底亮出一大截（对比度 ${ratio.toFixed(2)}:1），眼睛立刻把冷蓝圆判作前景！「冷退暖进」只在明度相近时才占主导。`;
    } else if (mode === "invert" && lumGap <= 0.16) {
      badge.textContent = "冷色沉进暖底里";
      badge.dataset.kind = "calm";
      verdict.textContent = `明度压低后，冷蓝既没亮过背景，色温又偏冷，整块圆仿佛凹进暖棕底色后面（对比度 ${ratio.toFixed(2)}:1）。试着把前景明度往右推，看它怎么反杀。`;
    } else if (mode === "classic" && ratio >= 2.2) {
      badge.textContent = "暖色前推 · 冷暖明度同向";
      badge.dataset.kind = "good";
      verdict.textContent = `钴蓝冷底既退后又偏深，暖橙圆既温暖又偏亮（对比度 ${ratio.toFixed(2)}:1）。心理温差、色立体视与明度差往同一个方向发力，前景自然浮出平面。`;
    } else {
      badge.textContent = "明度压暗 · 暖色前推减弱";
      badge.dataset.kind = "calm";
      verdict.textContent = `暖橙被压暗到和钴蓝亮度相近（对比度 ${ratio.toFixed(2)}:1）后，前冲的力量明显削弱——可见光靠「它是暖色」还不够，明度差决定了它能不能利落浮出来。`;
    }

    liftOut.textContent = `L ${lift}%`;

    // 画面渲染：前景圆随「感知前推度」微调半径
    const push = clamp(lumGap * 18 + (mode === "classic" ? 6 : mode === "invert" ? -2 : 0), -6, 12);
    const r = 62 + push * 0.6;

    svg.innerHTML = `
      <rect width="400" height="240" fill="${bgHex}"/>
      <line x1="200" y1="12" x2="200" y2="228" stroke="${inkOnBg}" stroke-opacity="0.22" stroke-dasharray="4 4"/>
      <line x1="20" y1="120" x2="380" y2="120" stroke="${inkOnBg}" stroke-opacity="0.22" stroke-dasharray="4 4"/>
      <circle cx="200" cy="120" r="${r.toFixed(1)}" fill="${fgHex}"/>
      <text x="200" y="116" text-anchor="middle" font-size="15" font-weight="700" fill="${inkOnFg}">${fgName}</text>
      <text x="200" y="136" text-anchor="middle" font-size="11" font-family="Space Mono, monospace" fill="${inkOnFg}" opacity="0.86">CR ${ratio.toFixed(2)}:1</text>
      <text x="16" y="26" font-size="11" font-weight="700" fill="${inkOnBg}" opacity="0.86">${bgName}</text>
      <text x="384" y="224" text-anchor="end" font-size="10" font-family="Space Mono, monospace" fill="${inkOnBg}" opacity="0.72">${bgHex.toUpperCase()} / ${fgHex.toUpperCase()}</text>
    `;
  }

  modeSeg.addEventListener("change", (e) => {
    mode = e.target.value;
    if (mode === "classic") lift = 52;
    else if (mode === "invert") lift = 72;
    else lift = 48;
    liftRange.value = String(lift);
    render();
  });
  liftRange.addEventListener("input", () => {
    lift = +liftRange.value;
    render();
  });

  render();
}

// =========================================================================
// 04 · 歌德–伊顿面积天平 & 60-30-10 实战卡片
// =========================================================================
export function initAreaLab() {
  const pairSeg = $("area-pair");
  const range = $("area-range");
  const out = $("area-out");
  const btnIdeal = $("area-ideal");
  const btnFifty = $("area-fifty");
  const btnSpot = $("area-spot");

  const barA = $("area-bar-a");
  const barB = $("area-bar-b");
  const idealPin = $("area-ideal-pin");
  const idealLbl = $("area-ideal-lbl");
  const read = $("area-read");
  const goetheNote = $("area-goethe");

  // 实战卡片预览元素
  const card = $("area-card");
  const cardBg = $("ac-bg");
  const cardSub = $("ac-sub");
  const cardAccent = $("ac-accent");
  const cardBtn = $("ac-btn");
  const cardTag = $("ac-tag");

  let pairKey = "bo";
  let pctA = 67; // 左侧色面积占比 10..90

  function render() {
    const p = GOETHE_PAIRS[pairKey];
    const pctB = 100 - pctA;

    barA.style.width = `${pctA}%`;
    barA.style.background = p.hexA;
    barA.style.color = bestInkOn(hexToRgb(p.hexA));
    barA.textContent = pctA >= 16 ? `${p.nameA} ${pctA}%` : "";

    barB.style.width = `${pctB}%`;
    barB.style.background = p.hexB;
    barB.style.color = bestInkOn(hexToRgb(p.hexB));
    barB.textContent = pctB >= 16 ? `${p.nameB} ${pctB}%` : "";

    idealPin.style.left = `${p.idealA}%`;
    idealLbl.textContent = `歌德–伊顿平衡线 ${p.ratioLabel}（${p.idealA}:${100 - p.idealA}）`;
    out.textContent = `${p.nameA} ${pctA}% : ${p.nameB} ${pctB}%`;
    goetheNote.textContent = p.goetheNote;

    // 同步实战海报小卡：左侧真实呈现 A 色底 + 自动高对比字色，右侧真实呈现 B 色块
    card.style.setProperty("--ac-a", p.hexA);
    card.style.setProperty("--ac-b", p.hexB);
    card.style.setProperty("--ac-ink-a", bestInkOn(hexToRgb(p.hexA)));
    card.style.setProperty("--ac-ink-b", bestInkOn(hexToRgb(p.hexB)));

    // 让实战卡片里 A:B 面积直接反映 pctA : pctB
    cardBg.style.gridTemplateColumns = `${pctA}fr ${pctB}fr`;
    cardAccent.style.background = p.hexB;
    cardBtn.style.background = p.hexB;
    cardBtn.style.color = bestInkOn(hexToRgb(p.hexB));

    const diffIdeal = Math.abs(pctA - p.idealA);
    if (pctB <= 16) {
      cardSub.textContent = `当${p.nameA}撑起秩序，仅占 ${pctB}% 的小面积互补色就成了全场唯一焦点。`;
      cardTag.textContent = "极小爆点（类似经验值 60-30-10）";
      read.textContent = `${p.nameB}压缩到 ${pctB}%，像黑夜里的一颗信号灯：整张卡完全不吵，但眼睛 0.2 秒就锁住右侧色条与按钮。这正是现代排版里常见的「大底 + 极小强点缀」经验配比。`;
    } else if (diffIdeal <= 4) {
      cardSub.textContent = `${p.nameA} ${pctA}% 配 ${p.nameB} ${pctB}%，贴合 ${p.ratioLabel} 的视觉分量平衡。`;
      cardTag.textContent = `贴合歌德–伊顿平衡比（${p.ratioLabel}）`;
      read.textContent = `两色视觉分量恰好打平：${p.nameA}（光值 ${p.lightA}）占 ${pctA}%，${p.nameB}（光值 ${p.lightB}）占 ${pctB}%。画面既饱满又安稳，不偏向任何一边。`;
    } else if (Math.abs(pctA - 50) <= 5) {
      cardSub.textContent = `左右几乎五五对分，${p.nameA}与${p.nameB}互相抢戏，视线难以定锚。`;
      cardTag.textContent = "50 : 50 势均力敌";
      read.textContent = `面积各占一半时，亮色一方（${p.lightB > p.lightA ? p.nameB : p.nameA}）视觉重量更重，而且画面被硬切两半，读者不知道该先看左还是先看右。`;
    } else if (pctB > 55) {
      cardSub.textContent = `${p.nameB}铺满 ${pctB}% 反客为主，高光色主导整张卡，${p.nameA}退成窄边。`;
      cardTag.textContent = `${p.nameB}反客为主（${pctB}%）`;
      read.textContent = `高光值的${p.nameB}反过来铺满 ${pctB}%，画面情绪极度炽热外放，适合短时吸睛的促销或节庆海报，但长时间阅读会累。`;
    } else {
      cardSub.textContent = `${p.nameA}占 ${pctA}% 稳住主调，${p.nameB}占 ${pctB}% 拉开节奏；推到 88:12 焦点会更集中。`;
      cardTag.textContent = `${p.nameA}主导（${pctA}%）`;
      read.textContent = `${p.nameA}稳住主基调，${p.nameB}负责挑起节奏；想更克制可往右拉到 85:15，想更均衡可对齐歌德平衡线。`;
    }
  }

  pairSeg.addEventListener("change", (e) => {
    pairKey = e.target.value;
    pctA = GOETHE_PAIRS[pairKey].idealA;
    range.value = String(pctA);
    render();
  });
  range.addEventListener("input", () => {
    pctA = +range.value;
    render();
  });
  btnIdeal.addEventListener("click", () => {
    pctA = GOETHE_PAIRS[pairKey].idealA;
    range.value = String(pctA);
    render();
  });
  btnFifty.addEventListener("click", () => {
    pctA = 50;
    range.value = "50";
    render();
  });
  btnSpot.addEventListener("click", () => {
    pctA = 88;
    range.value = "88";
    render();
  });

  render();
}

// =========================================================================
// 05 · 灰度与色觉障碍（CVD）+ WCAG 2.1 检验台
// =========================================================================
const CVD_SCHEMES = {
  bad: {
    label: "反例：红绿纯色相（等明度、无图形辅助）",
    bg: "#d63b2f",
    fg: "#2ba84a",
    accent: "#d63b2f",
    bar1: "#d63b2f",
    bar2: "#2ba84a",
    pillOkBg: "#2ba84a",
    pillErrBg: "#d63b2f",
    useIcons: false,
  },
  good: {
    label: "正例：蓝橙 + 明度差 + 形状双重编码",
    bg: "#0f42d5",
    fg: "#f7f0e5",
    accent: "#f5590e",
    bar1: "#0f42d5",
    bar2: "#f5590e",
    pillOkBg: "#0f42d5",
    pillErrBg: "#f5590e",
    useIcons: true,
  },
};

export function initCvdLab() {
  const schemeSeg = $("cvd-scheme");
  const modeSeg = $("cvd-mode");
  const svg = $("cvd-svg");
  const crText = $("cvd-cr");
  const crStatus = $("cvd-status");
  const read = $("cvd-read");

  let scheme = "bad";
  let vision = "normal";

  const simHex = (hex) => rgbToHex(simulateVision(hexToRgb(hex), vision));

  function render() {
    const s = CVD_SCHEMES[scheme];
    const bgSim = simHex(s.bg);
    const fgSim = simHex(s.fg);
    const bar1Sim = simHex(s.bar1);
    const bar2Sim = simHex(s.bar2);
    const okBgSim = simHex(s.pillOkBg);
    const errBgSim = simHex(s.pillErrBg);
    const paperSim = simHex(POSTER.paperHi);
    const inkSim = simHex(POSTER.ink);

    // 测正文/按钮可读性（基于真实原色 WCAG 对比度 + 模拟视角下两状态的分离度）
    const textCr = contrastRatio(hexToRgb(s.bg), hexToRgb(s.fg));
    const pairSimCr = contrastRatio(hexToRgb(bar1Sim), hexToRgb(bar2Sim));

    crText.textContent = `${textCr.toFixed(2)} : 1`;
    if (textCr >= 4.5) {
      crStatus.textContent = "WCAG AA 达标（≥ 4.5:1）";
      crStatus.dataset.kind = "good";
    } else if (textCr >= 3.0) {
      crStatus.textContent = "仅大字达标（≥ 3:1）";
      crStatus.dataset.kind = "calm";
    } else {
      crStatus.textContent = "未达标（正文糊成一片）";
      crStatus.dataset.kind = "warn";
    }

    const okInk = bestInkOn(hexToRgb(okBgSim));
    const errInk = bestInkOn(hexToRgb(errBgSim));

    svg.innerHTML = `
      <rect width="460" height="240" fill="${paperSim}" stroke="${inkSim}" stroke-opacity="0.22"/>
      <!-- 左半：卡片标题块可读性检验 -->
      <rect x="18" y="18" width="206" height="118" fill="${bgSim}"/>
      <text x="34" y="54" font-size="18" font-weight="700" fill="${fgSim}">系统状态通知</text>
      <text x="34" y="80" font-size="12" fill="${fgSim}">对比度 ${textCr.toFixed(2)}:1 · 正文测试</text>
      <rect x="34" y="96" width="94" height="24" fill="${fgSim}"/>
      <text x="81" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="${bgSim}">立即处理</text>

      <!-- 右半：两组数据柱状对照 -->
      <text x="246" y="34" font-size="11" font-weight="700" fill="${inkSim}">两组数据对照</text>
      <rect x="246" y="48" width="142" height="24" fill="${bar1Sim}"/>
      ${s.useIcons ? `<circle cx="258" cy="60" r="5" fill="${okInk}"/>` : ""}
      <text x="${s.useIcons ? 270 : 254}" y="64" font-size="11" font-weight="700" fill="${okInk}">正常运行 78%</text>

      <rect x="246" y="84" width="112" height="24" fill="${bar2Sim}"/>
      ${s.useIcons ? `<polygon points="258,90 264,101 252,101" fill="${errInk}"/>` : ""}
      <text x="${s.useIcons ? 270 : 254}" y="100" font-size="11" font-weight="700" fill="${errInk}">异常预警 61%</text>
      <text x="246" y="128" font-size="10" font-family="Space Mono, monospace" fill="${inkSim}" opacity="0.68">组间明度差 ${pairSimCr.toFixed(2)}:1</text>

      <!-- 下方：仅靠颜色 vs 颜色+形状状态胶囊 -->
      <line x1="18" y1="154" x2="442" y2="154" stroke="${inkSim}" stroke-opacity="0.18" stroke-dasharray="4 4"/>
      <text x="18" y="176" font-size="11" font-weight="700" fill="${inkSim}">状态指示（WCAG 1.4.1 检验）</text>

      <rect x="18" y="188" width="124" height="34" rx="2" fill="${okBgSim}"/>
      ${s.useIcons ? `<circle cx="34" cy="205" r="5" fill="${okInk}"/>` : ""}
      <text x="${s.useIcons ? 48 : 80}" y="209" text-anchor="${s.useIcons ? "start" : "middle"}" font-size="12" font-weight="700" fill="${okInk}">${s.useIcons ? "● 已通过" : "状态 A"}</text>

      <rect x="156" y="188" width="124" height="34" rx="2" fill="${errBgSim}"/>
      ${s.useIcons ? `<polygon points="172,199 178,211 166,211" fill="${errInk}"/>` : ""}
      <text x="${s.useIcons ? 186 : 218}" y="209" text-anchor="${s.useIcons ? "start" : "middle"}" font-size="12" font-weight="700" fill="${errInk}">${s.useIcons ? "▲ 需修正" : "状态 B"}</text>

      <text x="442" y="209" text-anchor="end" font-size="10" font-family="Space Mono, monospace" fill="${inkSim}" opacity="0.72">${vision.toUpperCase()}</text>
    `;

    if (scheme === "bad") {
      if (vision === "normal") {
        read.textContent = `正常视觉下红和绿看起来「对比很强」，但它们的相对亮度几乎一样（${textCr.toFixed(2)}:1），红底绿字已经有点晃眼。把视角切换到「纯灰度」或「绿色盲」看看。`;
      } else if (vision === "gray") {
        read.textContent = `一抽掉色彩，红与绿立刻塌成几乎一样的灰块（${pairSimCr.toFixed(2)}:1）！左边的字根本看不清，下面的「状态 A / B」也分不出谁正常谁报错。`;
      } else {
        read.textContent = `在${vision === "deutan" ? "绿色盲" : "红色盲"}视角里，红与绿全部偏成接近的土黄色，卡片上的字和两根状态柱几乎撞色，仅靠颜色编码彻底失效。`;
      }
    } else {
      if (vision === "normal") {
        read.textContent = `深钴蓝底配暖米白字，亮度对比度高达 ${textCr.toFixed(2)}:1（远超 WCAG AA 4.5:1）；暖橙做预警并叠加「● / ▲」形状符号，一眼清晰。切到灰度和色盲模式检验一下。`;
      } else {
        read.textContent = `即使切到${vision === "gray" ? "纯灰度" : vision === "deutan" ? "绿色盲" : "红色盲"}，左侧卡片正文依旧锐利，蓝与橙仍保留可分辨差异，加上「● 已通过 / ▲ 需修正」形状与文字双保险，信息零丢失。`;
      }
    }
  }

  schemeSeg.addEventListener("change", (e) => {
    scheme = e.target.value;
    render();
  });
  modeSeg.addEventListener("change", (e) => {
    vision = e.target.value;
    render();
  });

  render();
}

// =========================================================================
// 07 · 小练习：四张同版式爵士夜海报，看着都规整，哪张真正守住了色彩对比规则？
// =========================================================================
const QUIZ_OPTS = {
  A: {
    best: false,
    tag: "橙占 42% · 面积失衡",
    title: "A · 看着挺醒目，但违反「面积主次」：朱橙铺到 42% 吞掉按钮",
    text: "文字对比度本身都合格，但把高光值的朱橙拉成占整张海报约 42% 的大色带后，中段橙块和下方的钴蓝平分秋色。视线被中间大橙带吸干，底部同样用朱橙的「立即购票」按钮反而失去了唯一焦点的爆发力。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#f7f0e5")}"/>
        <rect x="0" y="66" width="180" height="90" fill="${c("#f5590e")}"/>
        <rect x="0" y="156" width="180" height="84" fill="${c("#0f42d5")}"/>
        <text x="16" y="34" font-size="18" font-weight="700" font-family="IBM Plex Sans, sans-serif" fill="${c("#10100e")}">JAZZ NIGHT</text>
        <text x="16" y="54" font-size="10.5" fill="${c("#4f4b44")}">夏日爵士音乐节</text>
        <circle cx="136" cy="96" r="22" fill="${c("#10100e")}"/>
        <text x="136" y="100" text-anchor="middle" font-size="10.5" font-weight="700" font-family="Space Mono, monospace" fill="${c("#f7f0e5")}">08.16</text>
        <text x="16" y="100" font-size="11.5" font-weight="700" fill="${c("#10100e")}">现场三重奏</text>
        <text x="16" y="120" font-size="10.5" fill="${c("#10100e")}">19:30 · 星海剧场</text>
        <line x1="16" y1="138" x2="96" y2="138" stroke="${c("#10100e")}" stroke-opacity="0.35" stroke-dasharray="3 3"/>
        <rect x="16" y="186" width="88" height="28" rx="2" fill="${c("#f5590e")}"/>
        <text x="60" y="204" text-anchor="middle" font-size="10.5" font-weight="700" fill="${c("#10100e")}">立即购票 →</text>
      `;
    },
  },
  B: {
    best: false,
    tag: "橙字压蓝 · 2.29:1",
    title: "B · 看着很撞色，但违反「明度可读性」：朱橙字直压钴蓝只有 2.29:1",
    text: "版式和面积配比与 C 完全一致，错在把高饱和朱橙直接拿来做钴蓝底上的日期与演出文字。色相虽然相对 180°，亮度对比度却只有 2.29:1（远低于第 05 节的 4.5:1 标准）——点上方「切灰度验明度层级」，蓝底上的橙字立刻糊进背景。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#f7f0e5")}"/>
        <rect x="0" y="92" width="180" height="148" fill="${c("#0f42d5")}"/>
        <circle cx="136" cy="92" r="24" fill="${c("#0f42d5")}" stroke="${c("#f5590e")}" stroke-width="2.5"/>
        <text x="136" y="96" text-anchor="middle" font-size="10.5" font-weight="700" font-family="Space Mono, monospace" fill="${c("#f5590e")}">08.16</text>
        <text x="16" y="42" font-size="18" font-weight="700" font-family="IBM Plex Sans, sans-serif" fill="${c("#10100e")}">JAZZ NIGHT</text>
        <text x="16" y="64" font-size="11" fill="${c("#4f4b44")}">夏日爵士音乐节</text>
        <line x1="16" y1="124" x2="100" y2="124" stroke="${c("#f5590e")}" stroke-opacity="0.7" stroke-dasharray="3 3"/>
        <text x="16" y="148" font-size="11.5" font-weight="700" fill="${c("#f5590e")}">现场三重奏 · 19:30</text>
        <text x="16" y="166" font-size="10" fill="${c("#f5590e")}">星海剧场 · 2 号厅</text>
        <rect x="16" y="190" width="88" height="28" rx="2" fill="${c("#f5590e")}"/>
        <text x="60" y="208" text-anchor="middle" font-size="10.5" font-weight="700" fill="${c("#0f42d5")}">立即购票 →</text>
      `;
    },
  },
  C: {
    best: true,
    tag: "最有效 ✓",
    title: "C · 正确：面积主次分明 + 所有文字过 4.5:1 + 暖橙点亮唯一焦点",
    text: "温润米白与后退的钴蓝稳住大面积结构，只把约 11% 的朱橙留给日期圆章和「立即购票」按钮；同时日期圆章与按钮都用墨黑字（#10100E 压 #F5590E 对比度 5.72:1，达 WCAG AA 4.5:1），蓝底配米白字（7.5:1）。切灰度后每一级信息依然清清楚楚。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#f7f0e5")}"/>
        <rect x="0" y="92" width="180" height="148" fill="${c("#0f42d5")}"/>
        <circle cx="136" cy="92" r="24" fill="${c("#f5590e")}"/>
        <text x="136" y="96" text-anchor="middle" font-size="10.5" font-weight="700" font-family="Space Mono, monospace" fill="${c("#10100e")}">08.16</text>
        <text x="16" y="42" font-size="18" font-weight="700" font-family="IBM Plex Sans, sans-serif" fill="${c("#10100e")}">JAZZ NIGHT</text>
        <text x="16" y="64" font-size="11" fill="${c("#4f4b44")}">夏日爵士音乐节</text>
        <line x1="16" y1="124" x2="100" y2="124" stroke="${c("#f7f0e5")}" stroke-opacity="0.45" stroke-dasharray="3 3"/>
        <text x="16" y="148" font-size="11.5" font-weight="700" fill="${c("#f7f0e5")}">现场三重奏 · 19:30</text>
        <text x="16" y="166" font-size="10" fill="${c("#d7e2ff")}">星海剧场 · 2 号厅</text>
        <rect x="16" y="190" width="88" height="28" rx="2" fill="${c("#f5590e")}"/>
        <text x="60" y="208" text-anchor="middle" font-size="10.5" font-weight="700" fill="${c("#10100e")}">立即购票 →</text>
      `;
    },
  },
  D: {
    best: false,
    tag: "同色系 · 缺焦点",
    title: "D · 看着干净好读，但放弃了色相与冷暖对比：按钮没跳出来",
    text: "文字对比度和面积配比都没硬伤（浅蓝章配黑字 8.7:1），但把日期圆章和「立即购票」换成了同属冷色系的浅灰蓝。整张海报安静顺滑，却在关键的行动点上少了那一记冷暖互补的视觉钩子。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#f7f0e5")}"/>
        <rect x="0" y="92" width="180" height="148" fill="${c("#0f42d5")}"/>
        <circle cx="136" cy="92" r="24" fill="${c("#8eb0f7")}"/>
        <text x="136" y="96" text-anchor="middle" font-size="10.5" font-weight="700" font-family="Space Mono, monospace" fill="${c("#10100e")}">08.16</text>
        <text x="16" y="42" font-size="18" font-weight="700" font-family="IBM Plex Sans, sans-serif" fill="${c("#10100e")}">JAZZ NIGHT</text>
        <text x="16" y="64" font-size="11" fill="${c("#4f4b44")}">夏日爵士音乐节</text>
        <line x1="16" y1="124" x2="100" y2="124" stroke="${c("#f7f0e5")}" stroke-opacity="0.45" stroke-dasharray="3 3"/>
        <text x="16" y="148" font-size="11.5" font-weight="700" fill="${c("#f7f0e5")}">现场三重奏 · 19:30</text>
        <text x="16" y="166" font-size="10" fill="${c("#d7e2ff")}">星海剧场 · 2 号厅</text>
        <rect x="16" y="190" width="88" height="28" rx="2" fill="${c("#8eb0f7")}"/>
        <text x="60" y="208" text-anchor="middle" font-size="10.5" font-weight="700" fill="${c("#10100e")}">立即购票 →</text>
      `;
    },
  },
};

export function initQuiz() {
  const btns = [...document.querySelectorAll(".q-opt")];
  const grayBtn = $("quiz-gray");
  const titleEl = $("quiz-title");
  const textEl = $("quiz-text");

  let picked = null;
  let gray = false;

  function drawCards() {
    for (const [k, opt] of Object.entries(QUIZ_OPTS)) {
      const svg = $(`q-svg-${k}`);
      if (svg) svg.innerHTML = opt.render(gray);
    }
    grayBtn.setAttribute("aria-pressed", String(gray));
    grayBtn.textContent = gray ? "恢复彩色视图" : "切灰度验明度层级";
  }

  function pick(k) {
    picked = k;
    const opt = QUIZ_OPTS[k];
    titleEl.textContent = opt.title;
    textEl.textContent = opt.text;
    btns.forEach((b) => {
      const key = b.dataset.opt;
      const item = QUIZ_OPTS[key];
      b.setAttribute("aria-pressed", String(key === k));
      b.classList.toggle("picked", key === k);
      b.classList.toggle("is-best", item.best);
      b.classList.toggle("revealed", true);
      const mark = b.querySelector(".q-mark");
      if (mark) mark.textContent = item.tag;
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.opt)));
  grayBtn.addEventListener("click", () => {
    gray = !gray;
    drawCards();
  });

  drawCards();
}

// =========================================================================
// 08 · 原海报放大与拖动查看器（仅引用 #poster.src，不重复内联）
// =========================================================================
export function initLightbox() {
  const openBtn = $("poster-open");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");
  const closeBtn = $("lb-close");
  const zoomInBtn = $("lb-zoom-in");
  const zoomOutBtn = $("lb-zoom-out");
  const zoomVal = $("lb-zoom-val");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function apply() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    apply();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      close();
      return;
    }
    e.preventDefault();
    lbStage.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    apply();
  });
  const end = (e) => {
    if (drag && e.pointerId === drag.id) drag = null;
  };
  lbStage.addEventListener("pointerup", end);
  lbStage.addEventListener("pointercancel", end);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// =========================================================================
// 轻量滚动显影（减少动态效果下立即全部显示，永不隐藏内容）
// =========================================================================
export function initReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );
  nodes.forEach((el) => io.observe(el));
}
