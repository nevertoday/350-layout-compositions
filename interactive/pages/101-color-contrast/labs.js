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
    inner: "#7c777e",
    leftPerceived: "在钴蓝上显得偏暖、偏亮",
    rightPerceived: "在朱橙上显得偏冷、偏暗",
    explain: "两块中心小方块完全是同一色值 #7C777E。但按谢弗勒尔同时对比定律，钴蓝把它往暖橙方向推，朱橙把它往冷蓝方向推——同一块中性灰在左右两边像是换了颜色。",
  },
  value: {
    label: "深靛 × 浅米（明度牵引）",
    leftBg: "#12245c",
    rightBg: "#f2e7d2",
    inner: "#6d7894",
    leftPerceived: "在深靛底上像发光的淡雾蓝",
    rightPerceived: "在浅米底上显得沉重发灰",
    explain: "色相没有变，两块 #6D7894 却在深底上被「抬亮」、在浅底上被「压暗」。背景的明度直接改写了前景在眼睛里的深浅位置。",
  },
  chroma: {
    label: "高纯朱橙 × 暖灰（饱和牵引）",
    leftBg: "#f5590e",
    rightBg: "#cfc5b7",
    inner: "#d67746",
    leftPerceived: "在纯橙上显得灰暗发闷",
    rightPerceived: "在暖灰上显得鲜亮饱满",
    explain: "两块 #D67746 原本是中等纯度的砖橙。塞进极高饱和的纯橙里，它立刻显得灰头土脸；放进低饱和暖灰里，它反而成了最鲜活的主角。",
  },
};

export function initAlbersLab() {
  const plateSeg = $("albers-plate");
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
  const proofBar = $("alb-proof-lbl");

  let key = "bo";
  let bridge = 0; // 0 = 分离，100 = 拼成一整条证明同色

  function render() {
    const p = ALBERS_PLATES[key];
    bgL.setAttribute("fill", p.leftBg);
    bgR.setAttribute("fill", p.rightBg);
    sqL.setAttribute("fill", p.inner);
    sqR.setAttribute("fill", p.inner);

    // x 从独立居中 (78, 302) 滑动到中缝严丝合缝 (160, 220 -> 共用 220 线)
    const t = bridge / 100;
    const xL = 78 + (160 - 78) * t;
    const xR = 302 - (302 - 220) * t;
    sqL.setAttribute("x", xL.toFixed(1));
    sqR.setAttribute("x", xR.toFixed(1));

    const inkL = bestInkOn(hexToRgb(p.leftBg));
    const inkR = bestInkOn(hexToRgb(p.rightBg));
    lblL.setAttribute("fill", inkL);
    lblR.setAttribute("fill", inkR);
    lblL.textContent = p.leftPerceived;
    lblR.textContent = p.rightPerceived;
    lblL.style.opacity = String(1 - t * 0.85);
    lblR.style.opacity = String(1 - t * 0.85);

    proofBar.style.opacity = String(t > 0.82 ? 1 : 0);
    proofBar.setAttribute("fill", bestInkOn(hexToRgb(p.inner)));
    proofBar.textContent = `同一块 ${p.inner.toUpperCase()} · 零色差`;

    hexTag.textContent = p.inner.toUpperCase();
    out.textContent = bridge >= 95 ? "已合体" : `${bridge}%`;
    btn.setAttribute("aria-pressed", String(bridge >= 95));
    btn.textContent = bridge >= 95 ? "分开恢复幻觉" : "一键合体证明同色";

    read.textContent =
      bridge >= 90
        ? `中缝消失了——两块色块合成一条毫无接缝的 ${p.inner.toUpperCase()}。把它再拉回两侧，幻觉立刻重现。`
        : p.explain;
  }

  plateSeg.addEventListener("change", (e) => {
    key = e.target.value;
    bridge = 0;
    range.value = "0";
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

  let active = "warmcool";
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
      <text x="316" y="204" text-anchor="end" font-size="10" font-family="JetBrains Mono, monospace" fill="${p.compactAccent ? "#f7f0e5" : p.sub}">${d.en}</text>
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
      <text x="200" y="136" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="${inkOnFg}" opacity="0.86">CR ${ratio.toFixed(2)}:1</text>
      <text x="16" y="26" font-size="11" font-weight="700" fill="${inkOnBg}" opacity="0.86">${bgName}</text>
      <text x="384" y="224" text-anchor="end" font-size="10" font-family="JetBrains Mono, monospace" fill="${inkOnBg}" opacity="0.72">${bgHex.toUpperCase()} / ${fgHex.toUpperCase()}</text>
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

    // 同步实战海报小卡：左侧大块用 A/米白，右侧/点缀用 B
    card.style.setProperty("--ac-a", p.hexA);
    card.style.setProperty("--ac-b", p.hexB);
    card.style.setProperty("--ac-ink-a", bestInkOn(hexToRgb(p.hexA)));
    card.style.setProperty("--ac-ink-b", bestInkOn(hexToRgb(p.hexB)));

    // 让实战卡片里 B 面积直接反映 pctB
    cardBg.style.gridTemplateColumns = `${pctA}fr ${pctB}fr`;
    cardAccent.style.background = p.hexB;
    cardBtn.style.background = p.hexB;
    cardBtn.style.color = bestInkOn(hexToRgb(p.hexB));

    const diffIdeal = Math.abs(pctA - p.idealA);
    if (pctB <= 16) {
      cardTag.textContent = "极小爆点（类似经验值 60-30-10）";
      read.textContent = `${p.nameB}压缩到 ${pctB}%，像黑夜里的一颗信号灯：整张卡完全不吵，但眼睛 0.2 秒就锁住右侧色条与按钮。这正是现代排版里常见的「大底 + 极小强点缀」经验配比。`;
    } else if (diffIdeal <= 4) {
      cardTag.textContent = `贴合歌德–伊顿平衡比（${p.ratioLabel}）`;
      read.textContent = `两色视觉分量恰好打平：${p.nameA}（光值 ${p.lightA}）占 ${pctA}%，${p.nameB}（光值 ${p.lightB}）占 ${pctB}%。画面既饱满又安稳，不偏向任何一边。`;
    } else if (Math.abs(pctA - 50) <= 5) {
      cardTag.textContent = "50 : 50 势均力敌";
      read.textContent = `面积各占一半时，亮色一方（${p.lightB > p.lightA ? p.nameB : p.nameA}）视觉重量更重，而且画面被硬切两半，读者不知道该先看左还是先看右。`;
    } else if (pctB > 55) {
      cardTag.textContent = `${p.nameB}反客为主（${pctB}%）`;
      read.textContent = `高光值的${p.nameB}反过来铺满 ${pctB}%，画面情绪极度炽热外放，适合短时吸睛的促销或节庆海报，但长时间阅读会累。`;
    } else {
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
      <text x="246" y="128" font-size="10" font-family="JetBrains Mono, monospace" fill="${inkSim}" opacity="0.68">组间明度差 ${pairSimCr.toFixed(2)}:1</text>

      <!-- 下方：仅靠颜色 vs 颜色+形状状态胶囊 -->
      <line x1="18" y1="154" x2="442" y2="154" stroke="${inkSim}" stroke-opacity="0.18" stroke-dasharray="4 4"/>
      <text x="18" y="176" font-size="11" font-weight="700" fill="${inkSim}">状态指示（WCAG 1.4.1 检验）</text>

      <rect x="18" y="188" width="124" height="34" rx="2" fill="${okBgSim}"/>
      ${s.useIcons ? `<circle cx="34" cy="205" r="5" fill="${okInk}"/>` : ""}
      <text x="${s.useIcons ? 48 : 80}" y="209" text-anchor="${s.useIcons ? "start" : "middle"}" font-size="12" font-weight="700" fill="${okInk}">${s.useIcons ? "● 已通过" : "状态 A"}</text>

      <rect x="156" y="188" width="124" height="34" rx="2" fill="${errBgSim}"/>
      ${s.useIcons ? `<polygon points="172,199 178,211 166,211" fill="${errInk}"/>` : ""}
      <text x="${s.useIcons ? 186 : 218}" y="209" text-anchor="${s.useIcons ? "start" : "middle"}" font-size="12" font-weight="700" fill="${errInk}">${s.useIcons ? "▲ 需修正" : "状态 B"}</text>

      <text x="442" y="209" text-anchor="end" font-size="10" font-family="JetBrains Mono, monospace" fill="${inkSim}" opacity="0.72">${vision.toUpperCase()}</text>
    `;

    if (scheme === "bad") {
      if (vision === "normal") {
        read.textContent = `正常视觉下红和绿看起来「对比很强」，但它们的相对亮度几乎一样（${textCr.toFixed(2)}:1），红底绿字已经有点晃眼。试着点右侧切换到「纯灰度」或「绿色盲」看看。`;
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
// 07 · 小练习：四张爵士音乐节海报，哪张色彩对比最有效？
// =========================================================================
const QUIZ_OPTS = {
  A: {
    best: false,
    tag: "面积打架",
    title: "A · 五五对半双饱和：左右撕裂，没有主角",
    text: "钴蓝和朱橙各占刚好 50%，又互相把对方的纯色直接当字色，结果左右两边一样响亮、交界边缘发震，购票按钮反而被橙色半屏吞掉了。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#0f42d5")}"/>
        <rect x="90" y="0" width="90" height="240" fill="${c("#f5590e")}"/>
        <circle cx="90" cy="116" r="44" fill="${c("#f5590e")}"/>
        <path d="M90 72 A44 44 0 0 1 90 160 Z" fill="${c("#0f42d5")}"/>
        <text x="16" y="42" font-size="18" font-weight="700" fill="${c("#f5590e")}">JAZZ</text>
        <text x="98" y="42" font-size="18" font-weight="700" fill="${c("#0f42d5")}">NIGHT</text>
        <text x="16" y="64" font-size="10.5" fill="${c("#f5590e")}">08.16 爵士夜</text>
        <rect x="96" y="190" width="70" height="26" fill="${c("#0f42d5")}"/>
        <text x="131" y="207" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#f5590e")}">立即购票</text>
      `;
    },
  },
  B: {
    best: false,
    tag: "等明度刺眼",
    title: "B · 红配绿等明度：色相差大，却一抽灰度就全糊",
    text: "红与绿虽是互补色，但这里两色明度挤在一起（对比度不到 2:1），正文发晕，红绿色盲或黑白预览下几乎看不出字和图形的边界。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#d63a2f")}"/>
        <circle cx="116" cy="120" r="44" fill="${c("#27a44b")}"/>
        <text x="16" y="42" font-size="18" font-weight="700" fill="${c("#27a44b")}">JAZZ NIGHT</text>
        <text x="16" y="64" font-size="11" fill="${c("#27a44b")}">08.16 · 夏日爵士夜</text>
        <rect x="16" y="190" width="84" height="26" fill="${c("#27a44b")}"/>
        <text x="58" y="207" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#d63a2f")}">立即购票</text>
      `;
    },
  },
  C: {
    best: true,
    tag: "最有效 ✓",
    title: "C · 正确：克制底面 + 钴蓝结构 + 小面积暖橙点爆焦点",
    text: "大片温润米白让文字清晰好读，钴蓝稳住画面骨架，只把约 10% 的高饱和暖橙留给日期圆章与「立即购票」按钮。色相、冷暖、面积、明度四重配合，切到灰度层级也纹丝不动。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#f7f0e5")}"/>
        <rect x="0" y="92" width="180" height="148" fill="${c("#0f42d5")}"/>
        <circle cx="134" cy="92" r="24" fill="${c("#f5590e")}"/>
        <text x="134" y="96" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#f7f0e5")}">08.16</text>
        <text x="16" y="42" font-size="19" font-weight="700" fill="${c("#10100e")}">JAZZ NIGHT</text>
        <text x="16" y="66" font-size="11" fill="${c("#4f4b44")}">夏日爵士音乐节</text>
        <line x1="16" y1="126" x2="100" y2="126" stroke="${c("#f7f0e5")}" stroke-opacity="0.4" stroke-dasharray="3 3"/>
        <text x="16" y="152" font-size="11" fill="${c("#f7f0e5")}">现场三重奏 · 19:30</text>
        <rect x="16" y="190" width="88" height="28" rx="2" fill="${c("#f5590e")}"/>
        <text x="60" y="208" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#10100e")}">立即购票 →</text>
      `;
    },
  },
  D: {
    best: false,
    tag: "缺乏焦点",
    title: "D · 过度同调发灰：不刺眼，却看三秒找不到重点",
    text: "全是相近的浅灰蓝，既没有色相与冷暖反差，明度差也很小。画面确实不吵，但标题、日期和购票按钮混在同一层，失去了「吸引注意、有效传达」的力量。",
    render(gray) {
      const c = (h) => (gray ? rgbToHex(simulateVision(hexToRgb(h), "gray")) : h);
      return `
        <rect width="180" height="240" fill="${c("#d5dce5")}"/>
        <rect x="0" y="92" width="180" height="148" fill="${c("#b4c0cf")}"/>
        <circle cx="134" cy="92" r="24" fill="${c("#97a6ba")}"/>
        <text x="134" y="96" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#e5ebf2")}">08.16</text>
        <text x="16" y="42" font-size="19" font-weight="700" fill="${c("#6f7e91")}">JAZZ NIGHT</text>
        <text x="16" y="66" font-size="11" fill="${c("#7c8b9e")}">夏日爵士音乐节</text>
        <text x="16" y="152" font-size="11" fill="${c("#e3e9f0")}">现场三重奏 · 19:30</text>
        <rect x="16" y="190" width="88" height="28" rx="2" fill="${c("#8e9eb3")}"/>
        <text x="60" y="208" text-anchor="middle" font-size="10" font-weight="700" fill="${c("#e6ecf2")}">立即购票 →</text>
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
