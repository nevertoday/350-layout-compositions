// 正文全部互动实验：
//   01 眯眼/去色骨架检验（Squint & Grayscale Lab）
//   02 同时对比错觉实验（Chevreul & Albers Bridge Lab）
//   03 十一阶区域标尺与画面调性（11-Zone & Tonal Key Lab）
//   04 焦点磁铁：局部反差 vs 全员喧哗（Focal Contrast Duel）
//   05 WCAG 2.1 实时可读性检验台（Live Luminance Bench）
//   07 实战四选一练习（Practice Quiz）
//   08 原海报大图放大与拖动（Lightbox） + 进场显形（Reveal）

import { reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp, contrastRatio, lerp, neutralRgb, rgbCss, rgbHex, toneRgb } from "./palette.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.append(node);
  return node;
}

function onRadio(name, fn) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.addEventListener("change", () => input.checked && fn(input.value));
  });
}

// =========================================================================
// 01 · 眯眼与去色骨架检验：为什么色相会骗人，明度不会
// =========================================================================
function initSquintLab() {
  const svg = $("sq-svg");
  const read = $("sq-read");
  if (!svg || !read) return;

  let caseKey = "clash";
  let lens = "color";

  // 两组配色：clash 四种色相完全不同，但相对亮度几乎都挤在 ~0.28–0.36！
  // clear 则在色相和明度上同时拉开梯队（暖纸底 + 深炭标题 + 中灰副文 + 朱红焦点）
  const CASES = {
    clash: {
      bg: [126, 138, 128], // 灰绿 L≈0.24
      panel: [148, 122, 114], // 暖棕红 L≈0.22
      title: [84, 138, 162], // 蓝青 L≈0.23（与底色明度几乎打平！）
      accent: [184, 114, 72], // 橙红 L≈0.24
      sub: [118, 132, 146], // 浅石板蓝 L≈0.23
      note: {
        color: "彩色状态下看起来红蓝绿黄挺热闹，似乎分得清区域——切到「去色灰度」或「眯眼模糊」看看真相。",
        gray: "一旦抽掉色相，标题、色块与背景全塌成同一片灰（对比度约 1.1:1）。这就是「明度撞车」：色相很花，骨架为零。",
        notan: "压成二值黑白后，画面直接成了一整块死灰或黑板，标题与焦点彻底消失，说明明暗结构根本没立起来。",
        squint: "模拟眯起眼睛远看：所有边界糊在一起，观者在 3 米外或手机缩略图里根本读不出任何主次。",
      },
    },
    clear: {
      bg: PALETTE.paper, // 暖纸 L≈0.80
      panel: PALETTE.ink, // 炭墨 L≈0.005
      title: PALETTE.ink,
      accent: PALETTE.red, // 朱红焦点
      sub: [92, 86, 78], // 稳重暖灰
      note: {
        color: "只用原海报的三色系，但把底面、大块、标题与副文的明度拉开成清晰梯队。",
        gray: "抽掉全部色彩后，大标题、右半深墨块和阶梯层次依旧清清楚楚——好版面在黑白状态下就已经赢了。",
        notan: "压到只剩纯黑与纯白，主体大骨架、标题和视觉重心依然一秒可读，海报力量毫发无损。",
        squint: "即使眯眼模糊掉全部细节，依然能瞬间锁定左边主标题和右边深块里的亮点，阅读顺序完全不乱。",
      },
    },
  };

  function toGray([r, g, b]) {
    const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    return [y, y, y];
  }

  function mapCol(rgb) {
    if (lens === "color") return rgbCss(rgb);
    const g = toGray(rgb);
    if (lens === "notan") return g[0] > 128 ? PALETTE.paperHex : PALETTE.inkHex;
    return rgbCss(g);
  }

  function render() {
    svg.innerHTML = "";
    const c = CASES[caseKey];
    const defs = el("defs", {}, svg);
    if (lens === "squint") {
      const f = el("filter", { id: "sq-blur" }, defs);
      el("feGaussianBlur", { stdDeviation: "4.6" }, f);
    }

    const g = el("g", lens === "squint" ? { filter: "url(#sq-blur)" } : {}, svg);
    el("rect", { x: 0, y: 0, width: 420, height: 250, fill: mapCol(c.bg) }, g);
    // 右侧竖向深块
    el("rect", { x: 230, y: 0, width: 190, height: 250, fill: mapCol(c.panel) }, g);
    // 跨轴大圆
    el("circle", { cx: 230, cy: 132, r: 54, fill: mapCol(c.panel) }, g);
    // 右半圆反色（用半圆路径）
    el("path", { d: "M230 78 A54 54 0 0 1 230 186 Z", fill: mapCol(c.bg) }, g);
    // 焦点圆点
    el("circle", { cx: 255, cy: 112, r: 12, fill: mapCol(c.accent) }, g);

    // 左侧排版：编号 + 大标题 + 正文条
    const t1 = el("text", { x: 24, y: 58, fill: mapCol(c.title), "font-size": 34, "font-weight": 900, "font-family": '"Noto Sans SC", sans-serif' }, g);
    t1.textContent = "建筑光影展";
    const t2 = el("text", { x: 26, y: 84, fill: mapCol(c.sub), "font-size": 12, "font-weight": 600, "letter-spacing": "0.12em", "font-family": '"Inter", sans-serif' }, g);
    t2.textContent = "LIGHT & SHADOW · 2026";

    // 正文模拟行
    el("rect", { x: 26, y: 112, width: 120, height: 6, fill: mapCol(c.sub) }, g);
    el("rect", { x: 26, y: 128, width: 102, height: 6, fill: mapCol(c.sub) }, g);
    el("rect", { x: 26, y: 144, width: 130, height: 6, fill: mapCol(c.sub) }, g);

    // 底部按钮块
    el("rect", { x: 26, y: 178, width: 92, height: 28, fill: mapCol(c.title) }, g);
    const btnTxt = el("text", { x: 42, y: 197, fill: mapCol(c.bg), "font-size": 13, "font-weight": 700, "font-family": '"Noto Sans SC", sans-serif' }, g);
    btnTxt.textContent = "查看展讯";

    // 右下阶梯条
    for (let i = 0; i < 5; i++) {
      el("rect", { x: 230, y: 192 + i * 10, width: 26 + i * 24, height: 5, fill: mapCol(c.bg) }, g);
    }

    // 实时报出标题与背景的真实对比度
    const ratio = contrastRatio(c.title, c.bg).toFixed(1);
    read.textContent = `标题与底面明度对比 ${ratio} : 1 — ${c.note[lens]}`;
  }

  onRadio("sq-case", (v) => {
    caseKey = v;
    render();
  });
  onRadio("sq-lens", (v) => {
    lens = v;
    render();
  });
  render();
}

// =========================================================================
// 02 · 同时对比实验（谢弗勒尔 1839 / 阿尔伯斯 1963）
// =========================================================================
function initSimLab() {
  const svg = $("sim-svg");
  const valInput = $("sim-val");
  const bgInput = $("sim-bg");
  const bridgeBtn = $("sim-bridge");
  const valOut = $("sim-val-out");
  const bgOut = $("sim-bg-out");
  const read = $("sim-read");
  if (!svg || !valInput || !bgInput || !bridgeBtn) return;

  let bridged = false;

  function render() {
    const vPct = +valInput.value;
    const bgPct = +bgInput.value;
    valOut.textContent = `${vPct}%`;
    bgOut.textContent = `${bgPct}%`;

    const span = (bgPct / 100) * 0.5;
    const leftBg = toneRgb(0.5 + span);
    const rightBg = toneRgb(0.5 - span);
    const patchRgb = neutralRgb(vPct / 100);
    const patchHex = rgbHex(patchRgb);

    svg.innerHTML = "";
    // 左右对半底（呼应海报 100 的 50/50 竖分）
    el("rect", { x: 0, y: 0, width: 240, height: 220, fill: rgbCss(leftBg) }, svg);
    el("rect", { x: 240, y: 0, width: 240, height: 220, fill: rgbCss(rightBg) }, svg);

    // 两个像素值完全相同的中央色块
    el("rect", { x: 82, y: 66, width: 76, height: 88, fill: patchHex }, svg);
    el("rect", { x: 322, y: 66, width: 76, height: 88, fill: patchHex }, svg);

    // 连通验证桥：把左右两块连成一整条同色横杠，错觉瞬间破功
    if (bridged) {
      el("rect", { x: 158, y: 92, width: 164, height: 36, fill: patchHex }, svg);
      const tag = el("text", { x: 240, y: 115, "text-anchor": "middle", fill: vPct > 52 ? "#10110e" : "#efe7dc", "font-size": 12, "font-weight": 600, "font-family": '"Inter", sans-serif' }, svg);
      tag.textContent = `SAME ${patchHex.toUpperCase()}`;
    } else {
      // 细中轴线标注
      el("line", { x1: 240, y1: 0, x2: 240, y2: 220, stroke: "#b43d1d", "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0.7 }, svg);
    }

    // 底部角落真实色号标注
    const lb1 = el("text", { x: 16, y: 204, fill: rgbCss(rightBg), "font-size": 11, "font-family": '"Inter", sans-serif' }, svg);
    lb1.textContent = `PATCH ${patchHex.toUpperCase()}`;
    const lb2 = el("text", { x: 464, y: 204, "text-anchor": "end", fill: rgbCss(leftBg), "font-size": 11, "font-family": '"Inter", sans-serif' }, svg);
    lb2.textContent = `PATCH ${patchHex.toUpperCase()}`;

    const rLeft = contrastRatio(patchRgb, leftBg).toFixed(1);
    const rRight = contrastRatio(patchRgb, rightBg).toFixed(1);

    if (bridged) {
      read.textContent = `横桥把左右连成一整块同色 ${patchHex.toUpperCase()}，错觉立刻消失——但在断开时，亮底上的那块看起来更暗（对比 ${rLeft}:1），暗底上的那块看起来更亮（对比 ${rRight}:1）。`;
    } else if (bgPct < 25) {
      read.textContent = `背景反差收小后，左右两块灰看起来几乎一样；把背景反差拉回 100%，同色方块会立刻分裂成一深一浅。`;
    } else {
      read.textContent = `左右两块色值完全相同（均为 ${patchHex.toUpperCase()}），但左块被亮底「压暗」，右块被暗底「托亮」。点「连通验证桥」亲眼拆穿它。`;
    }
  }

  valInput.addEventListener("input", render);
  bgInput.addEventListener("input", render);
  bridgeBtn.addEventListener("click", () => {
    bridged = !bridged;
    bridgeBtn.setAttribute("aria-pressed", String(bridged));
    bridgeBtn.textContent = bridged ? "断开验证桥 · 恢复错觉" : "连通验证桥 · 拆穿错觉";
    render();
  });
  render();
}

// =========================================================================
// 03 · 十一阶明度标尺（Zone 0–X）与画面调性实验
// =========================================================================
function initZoneLab() {
  const svg = $("key-svg");
  const strip = $("zone-strip");
  const darkInput = $("key-dark");
  const darkOut = $("key-dark-out");
  const read = $("key-read");
  if (!svg || !strip || !darkInput) return;

  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  let mode = "full";

  const MODES = {
    full: {
      name: "全音域 Full-Range",
      zones: [0, 2, 5, 8, 10],
      desc: "同时保有深暗锚点、清晰中灰阶梯与干净亮面——既有海报级的力量，也有空间过渡，最全面也最讲究配比。",
    },
    high: {
      name: "高调 High-Key",
      zones: [6, 7, 8, 9, 10],
      desc: "画面大部分落在 Zone VI–X 的明亮区间，轻盈、克制、有呼吸感；用极小一块深色就能稳稳压住整页重心。",
    },
    low: {
      name: "低调 Low-Key",
      zones: [0, 1, 2, 3, 7],
      desc: "大面积停留在 Zone 0–III 的深暗影调里，沉静而具戏剧张力；仅留少量亮部像聚光灯一样切出视觉焦点。",
    },
    mid: {
      name: "中调压缩 Mid-Key",
      zones: [3, 4, 5, 6, 7],
      desc: "所有色阶都挤在 Zone III–VII 之间，柔和复古、几乎不刺眼，但容易显得平淡——必须靠面积或局部提亮打破沉闷。",
    },
  };

  // 建立 11 格区域条（Zone 0..X）
  const chips = ROMAN.map((r, idx) => {
    const item = document.createElement("div");
    item.className = "zone-chip";
    item.style.background = rgbCss(toneRgb(idx / 10));
    item.style.color = idx < 5 ? PALETTE.paperHex : PALETTE.inkHex;
    item.innerHTML = `<b lang="en">${r}</b>`;
    strip.append(item);
    return item;
  });

  function render() {
    const darkPct = +darkInput.value;
    darkOut.textContent = `${darkPct}%`;

    const cfg = MODES[mode];
    const [zA, zB, zC, zD, zE] = cfg.zones;
    const activeSet = new Set(cfg.zones);
    chips.forEach((ch, idx) => ch.classList.toggle("active", activeSet.has(idx)));

    const cDark = rgbCss(toneRgb(zA / 10));
    const cDeep = rgbCss(toneRgb(zB / 10));
    const cMid = rgbCss(toneRgb(zC / 10));
    const cLight = rgbCss(toneRgb(zD / 10));
    const cBright = rgbCss(toneRgb(zE / 10));

    // 根据暗部占比移动斜影与暗墙位置
    const splitX = Math.round(480 * (1 - darkPct / 100));

    svg.innerHTML = "";
    // 亮侧背景与暗侧背景
    el("rect", { x: 0, y: 0, width: 480, height: 240, fill: cBright }, svg);
    el("rect", { x: splitX, y: 0, width: 480 - splitX, height: 240, fill: cDark }, svg);

    // 远景建筑轮廓（中灰与浅灰阶梯）
    el("polygon", { points: `0,240 0,152 ${splitX},126 ${splitX},240`, fill: cLight }, svg);
    el("polygon", { points: `0,240 ${Math.max(0, splitX - 110)},168 ${splitX},240`, fill: cMid }, svg);

    // 暗区里的透视亮阶梯（呼应原海报）
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const f = i / (steps - 1);
      const y = 132 + f * 84;
      const w = Math.min(480 - splitX - 12, 20 + f * 120);
      if (w > 4) {
        el("rect", { x: splitX, y: y.toFixed(1), width: w.toFixed(1), height: (3 + f * 6).toFixed(1), fill: i % 2 === 0 ? cBright : cLight }, svg);
      }
    }

    // 跨界圆体（左暗右明）
    const cx = clamp(splitX, 86, 394);
    el("circle", { cx, cy: 96, r: 44, fill: cDeep }, svg);
    el("path", { d: `M${cx} 52 A44 44 0 0 1 ${cx} 140 Z`, fill: cBright }, svg);
    // 焦点朱红点
    el("circle", { cx: cx + 18, cy: 84, r: 8, fill: PALETTE.redHex }, svg);

    const balanceHint =
      darkPct >= 65
        ? `当前暗部占 ${darkPct}%（偏重不对称压场），亮面少而精，视线立刻聚到亮半圆与阶梯上。`
        : darkPct <= 35
          ? `当前亮部占 ${100 - darkPct}%（轻盈不对称），暗部缩成紧凑的视觉锚点，画面通透舒展。`
          : `当前暗部占 ${darkPct}%（接近 50/50 均势），需要中央跨界圆把左右两半扣紧，避免画面裂成两截。`;

    read.textContent = `${cfg.name}：${cfg.desc}${balanceHint}`;
  }

  onRadio("key-mode", (v) => {
    mode = v;
    render();
  });
  darkInput.addEventListener("input", render);
  render();
}

// =========================================================================
// 04 · 焦点磁铁：面积小也能赢 vs 处处高反差等于没焦点
// =========================================================================
function initFocalLab() {
  const svg = $("foc-svg");
  const heroInput = $("foc-hero");
  const noiseInput = $("foc-noise");
  const heroOut = $("foc-hero-out");
  const noiseOut = $("foc-noise-out");
  const read = $("foc-read");
  if (!svg || !heroInput || !noiseInput) return;

  function render() {
    const heroK = +heroInput.value / 100;
    const noiseK = +noiseInput.value / 100;
    heroOut.textContent = `${Math.round(heroK * 100)}%`;
    noiseOut.textContent = `${Math.round(noiseK * 100)}%`;

    const bgTone = 0.92;
    const bgRgb = toneRgb(bgTone);
    const noiseTone = lerp(bgTone - 0.04, 0.02, noiseK);
    const heroTone = lerp(bgTone - 0.04, 0.0, heroK);
    const noiseRgb = toneRgb(noiseTone);
    const heroRgb = toneRgb(heroTone);

    const rHero = contrastRatio(heroRgb, bgRgb);
    const rNoise = contrastRatio(noiseRgb, bgRgb);
    const diff = rHero - rNoise;

    svg.innerHTML = "";
    el("rect", { x: 0, y: 0, width: 480, height: 240, fill: rgbCss(bgRgb) }, svg);

    // 4 个面积较大的背景几何块（干扰项）
    const shapes = [
      { kind: "rect", x: 26, y: 28, w: 128, h: 86 },
      { kind: "rect", x: 174, y: 28, w: 136, h: 68 },
      { kind: "rect", x: 26, y: 134, w: 170, h: 78 },
      { kind: "rect", x: 216, y: 118, w: 106, h: 94 },
    ];
    for (const s of shapes) {
      el("rect", { x: s.x, y: s.y, width: s.w, height: s.h, fill: rgbCss(noiseRgb) }, svg);
      // 内部纹理线模拟信息块
      el("line", { x1: s.x + 12, y1: s.y + 20, x2: s.x + s.w - 16, y2: s.y + 20, stroke: rgbCss(bgRgb), "stroke-width": 2, opacity: 0.45 }, svg);
      el("line", { x1: s.x + 12, y1: s.y + 34, x2: s.x + s.w * 0.65, y2: s.y + 34, stroke: rgbCss(bgRgb), "stroke-width": 2, opacity: 0.3 }, svg);
    }

    // 唯一面积虽小但承担焦点的圆锚（右侧）
    const fx = 398;
    const fy = 120;
    const fr = 32;
    el("circle", { cx: fx, cy: fy, r: fr, fill: rgbCss(heroRgb) }, svg);
    // 焦点中心的朱红标记随主角反差显现
    if (heroK > 0.35) {
      el("circle", { cx: fx + 8, cy: fy - 6, r: 7, fill: PALETTE.redHex, opacity: clamp((heroK - 0.3) * 1.4, 0, 1).toFixed(2) }, svg);
    }

    // 视线落点指示环：唯一高反差时稳稳套在右侧小圆上；全员喧哗时分裂到多个方块上！
    if (diff >= 3.2 && rHero >= 4.5) {
      el("circle", { cx: fx, cy: fy, r: fr + 12, fill: "none", stroke: PALETTE.redHex, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      const t = el("text", { x: fx, y: fy + fr + 30, "text-anchor": "middle", fill: PALETTE.redHex, "font-size": 12, "font-weight": 700, "font-family": '"Noto Sans SC", sans-serif' }, svg);
      t.textContent = "第一落眼点";
      read.textContent = `主角对比 ${rHero.toFixed(1)}:1，周围安静在 ${rNoise.toFixed(1)}:1——小圆面积不到左上大块的一半，却凭局部最高反差一秒胜出。`;
    } else if (rNoise >= 7 && rHero >= 7) {
      // 全员喧哗：三个地方同时抢眼
      for (const [rx, ry] of [
        [90, 71],
        [111, 173],
        [fx, fy],
      ]) {
        el("circle", { cx: rx, cy: ry, r: 16, fill: "none", stroke: PALETTE.redHex, "stroke-width": 1.8, "stroke-dasharray": "4 4" }, svg);
      }
      read.textContent = `周围元素也飙到 ${rNoise.toFixed(1)}:1，与主角（${rHero.toFixed(1)}:1）互相扯着嗓子喊——处处都是高反差，结果谁也不是焦点。`;
    } else if (rNoise > rHero + 1.5) {
      el("rect", { x: 22, y: 24, width: 136, height: 94, fill: "none", stroke: PALETTE.redHex, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
      read.textContent = `反客为主：周围块面反差（${rNoise.toFixed(1)}:1）压过了你想突出的右侧主角（${rHero.toFixed(1)}:1），视线直接被大块拖走。`;
    } else {
      read.textContent = `主角（${rHero.toFixed(1)}:1）与周围（${rNoise.toFixed(1)}:1）差值太小，眼睛在画面里游移不定；把主角拉强或把周围压静，焦点会立刻跳出来。`;
    }
  }

  heroInput.addEventListener("input", render);
  noiseInput.addEventListener("input", render);
  $("foc-preset-win")?.addEventListener("click", () => {
    heroInput.value = "94";
    noiseInput.value = "20";
    render();
  });
  $("foc-preset-shout")?.addEventListener("click", () => {
    heroInput.value = "94";
    noiseInput.value = "94";
    render();
  });
  $("foc-preset-spot")?.addEventListener("click", () => {
    heroInput.value = "100";
    noiseInput.value = "8";
    render();
  });
  render();
}

// =========================================================================
// 05 · WCAG 2.1 实时可读性检验台
// =========================================================================
function initWcagLab() {
  const fgInput = $("wcag-fg");
  const bgInput = $("wcag-bg");
  const fgOut = $("wcag-fg-out");
  const bgOut = $("wcag-bg-out");
  const preview = $("wcag-preview");
  const ratioEl = $("wcag-ratio");
  const bUi = $("badge-ui");
  const bAa = $("badge-aa");
  const bAaa = $("badge-aaa");
  const read = $("wcag-read");
  if (!fgInput || !bgInput || !preview) return;

  const PRESETS = {
    poster: { fg: 6, bg: 93 },
    darkmode: { fg: 88, bg: 10 },
    "edge-aa": { fg: 39, bg: 93 },
    "pale-fail": { fg: 66, bg: 93 },
    "pure-bw": { fg: 0, bg: 100 },
  };

  function setBadge(node, pass, label) {
    node.dataset.pass = String(pass);
    node.textContent = `${label} · ${pass ? "通过" : "未过"}`;
  }

  // 将 0..100% 映射为全范围暖中性灰度（6% 精确命中原海报炭墨 #10110e，93% 精确命中暖纸 #efe7dc，0/100 为纯黑白 #000/#fff）
  function benchRgb(v) {
    if (v <= 0) return [0, 0, 0];
    if (v >= 100) return [255, 255, 255];
    if (v <= 6) {
      const t = v / 6;
      return PALETTE.ink.map((c) => Math.round(c * t));
    }
    if (v >= 93) {
      const t = (v - 93) / 7;
      return PALETTE.paper.map((c) => Math.round(lerp(c, 255, t)));
    }
    return toneRgb((v - 6) / 87);
  }

  function render() {
    const fgV = +fgInput.value;
    const bgV = +bgInput.value;
    const fgRgb = benchRgb(fgV);
    const bgRgb = benchRgb(bgV);
    const ratio = contrastRatio(fgRgb, bgRgb);

    fgOut.textContent = `${fgV}% (${rgbHex(fgRgb).toUpperCase()})`;
    bgOut.textContent = `${bgV}% (${rgbHex(bgRgb).toUpperCase()})`;
    ratioEl.textContent = `${ratio.toFixed(2)} : 1`;

    preview.style.backgroundColor = rgbCss(bgRgb);
    preview.style.color = rgbCss(fgRgb);
    preview.style.borderColor = ratio < 2.2 ? PALETTE.redHex : rgbCss(fgRgb);

    const passUi = ratio >= 3.0;
    const passAa = ratio >= 4.5;
    const passAaa = ratio >= 7.0;
    setBadge(bUi, passUi, "大字 / 组件 ≥ 3:1");
    setBadge(bAa, passAa, "正文 AA ≥ 4.5:1");
    setBadge(bAaa, passAaa, "增强 AAA ≥ 7:1");

    if (ratio >= 19.5) {
      read.textContent = "接近 21:1 纯黑白极限：极短标题和强光户外最锐利，但发光屏幕上连续读长文容易眩光疲劳，通常适度收到 12:1–16:1 更耐看。";
    } else if (passAaa) {
      read.textContent = "远超 AAA 增强可读标准（≥ 7:1），原海报的暖纸配炭墨就落在这个甜区：力量十足，同时保住了温润质感。";
    } else if (passAa) {
      read.textContent = "达到 WCAG 2.1 AA 正文标准（≥ 4.5:1）：清晰可读，适合次级说明文字或柔和排版的正文档案。";
    } else if (passUi) {
      read.textContent = "只够大号标题或图标边框（≥ 3:1），放成小号正文会明显吃力，阳光下或视力偏弱的读者容易看花。";
    } else {
      read.textContent = "低于 3:1 最低门槛：文字与底面快融成一片灰，除了有意退隐的背景水印，任何需要阅读的内容都不该落在这里。";
    }
  }

  fgInput.addEventListener("input", render);
  bgInput.addEventListener("input", render);
  document.querySelectorAll(".wcag-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      fgInput.value = String(p.fg);
      bgInput.value = String(p.bg);
      render();
    });
  });
  render();
}

// =========================================================================
// 07 · 小练习：四版展览海报，哪张明暗最成立？
// =========================================================================
function initQuiz() {
  const buttons = [...document.querySelectorAll(".quiz-opt")];
  const verdict = $("quiz-verdict");
  const vTitle = $("quiz-title");
  const vText = $("quiz-text");
  if (!buttons.length || !verdict) return;

  const FEEDBACK = {
    A: {
      ok: false,
      title: "A · 全灰塌陷（对比仅 ~1.7 : 1）",
      text: "底面、大圆和主标题全挤在中灰区（Zone IV–VI），一眼像蒙了一层灰膜。没有深锚也没有亮面，视线找不到入口。",
    },
    B: {
      ok: false,
      title: "B · 处处极反差喧哗（没有主次）",
      text: "黑白反差拉到满格，却把背景斑马条纹、粗边框、杂乱装饰块全做成最高反差。每个像素都在大喊，主标题反倒被噪音吞掉。",
    },
    C: {
      ok: true,
      title: "选对了 · C 的明暗秩序最有力",
      text: "大面积沉静墨底稳稳托住暖纸亮面与过渡灰阶，主标题和单颗朱红焦点独享最高局部对比（约 16:1），次要日期说明乖乖退到柔和灰阶，一秒分出先后。",
    },
    D: {
      ok: false,
      title: "D · 重点倒挂（装饰抢了主角的对比预算）",
      text: "右下角一块无关的黑白方块占走了最强的对比度，真正需要读者先看的主标题反倒被压成浅灰（约 2.1:1），视线直接被拖偏。",
    },
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const fb = FEEDBACK[pick];
      btn.closest(".quiz-grid")?.classList.add("answered");
      buttons.forEach((o) => {
        o.setAttribute("aria-pressed", String(o === btn));
        o.classList.toggle("is-best", o.dataset.opt === "C");
        o.classList.toggle("is-wrong", o === btn && pick !== "C");
      });
      verdict.classList.toggle("is-right", fb.ok);
      vTitle.textContent = fb.title;
      vText.textContent = fb.ok ? fb.text : `${fb.text}对照 C：${FEEDBACK.C.text}`;
    });
  });
}

// =========================================================================
// 08 · 原海报放大预览（点击放大、拖动细看、双击或按钮切换缩放、Esc 关闭）
// =========================================================================
function initLightbox() {
  const trigger = $("poster-btn");
  const posterImg = $("poster");
  const lb = $("lightbox");
  const lbImg = $("lb-img");
  const lbStage = $("lb-stage");
  const lbClose = $("lb-close");
  const lbZoom = $("lb-zoom");
  if (!trigger || !posterImg || !lb || !lbImg || !lbStage || !lbClose) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale})`;
    lbStage.classList.toggle("zoomed", scale > 1);
    if (lbZoom) {
      lbZoom.setAttribute("aria-pressed", String(scale > 1));
      lbZoom.textContent = scale > 1 ? "还原 1×" : "放大 1.8×";
    }
  }

  function open() {
    // 复用页面里已内联的 poster.webp，不重复打包图片
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    document.documentElement.classList.add("noscroll");
    trigger.setAttribute("aria-expanded", "true");
    lbClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.documentElement.classList.remove("noscroll");
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  lbClose.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === lbStage) close();
  });

  lbZoom?.addEventListener("click", () => {
    scale = scale > 1 ? 1 : 1.8;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    lbImg.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty, moved: false };
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const nx = e.clientX - drag.sx;
    const ny = e.clientY - drag.sy;
    if (Math.hypot(nx - tx, ny - ty) > 4) drag.moved = true;
    tx = clamp(nx, -420, 420);
    ty = clamp(ny, -520, 520);
    applyTransform();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasClick = !drag.moved;
    drag = null;
    if (wasClick) {
      scale = scale > 1 ? 1 : 1.8;
      if (scale === 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    }
  };
  lbImg.addEventListener("pointerup", endDrag);
  lbImg.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// =========================================================================
// 滚动入场（严格遵守 prefers-reduced-motion）
// =========================================================================
function initReveal() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px 10% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((node) => io.observe(node));
}

export function initLabs() {
  initSquintLab();
  initSimLab();
  initZoneLab();
  initFocalLab();
  initWcagLab();
  initQuiz();
  initLightbox();
  initReveal();
}
