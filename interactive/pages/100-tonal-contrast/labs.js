// 正文全部互动实验：
//   01 眯眼/去色骨架检验（Squint & Grayscale Lab）
//   02 同时对比错觉实验（Chevreul & Albers Bridge Lab）
//   03 浓淡值阶压缩缩略图（Notan 2 / 3 / 5-Value Study）
//   04 焦点磁铁：局部反差 vs 全员喧哗（Focal Contrast Duel）
//   05 WCAG 2.1 实时可读性检验台（Live Luminance Bench）
//   07 实战四选一练习（Practice Quiz）
//   08 原海报大图放大与拖动（Lightbox） + 进场显形（Reveal）

import { reducedMotion } from "../../lib/stage.js";
import { PALETTE, clamp, contrastRatio, lerp, levelRgb, neutralRgb, relativeLuminance, rgbCss, rgbHex, toneRgb } from "./palette.js";

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

  // 两组配色：clash 采用高饱和红、绿、蓝、黄四种纯色，但相对亮度全部压在 L≈0.20–0.23（两两对比度均 ≤ 1.13:1）；
  // clear 则在色相和明度上同时拉开梯队（暖纸底 + 深炭标题 + 中灰副文 + 朱红焦点）
  const CASES = {
    clash: {
      bg: [0, 146, 46], // 高饱和翠绿 L≈0.208
      panel: [20, 118, 255], // 高饱和亮钴蓝 L≈0.203
      title: [252, 16, 26], // 高饱和正红 L≈0.211（与绿底明度几乎打平，对比度仅 1.01:1）
      accent: [180, 122, 0], // 高饱和金黄 L≈0.235
      sub: [172, 116, 0], // 高饱和明黄 L≈0.212
      note: {
        color: "彩色状态下红、绿、蓝、黄都很浓烈，一眼看似区域分明——切到「去色灰度」或「眯眼模糊」看看底层明度真相。",
        gray: "一旦抽掉色相，红蓝绿黄瞬间塌成几乎同一片中灰。这就是「明度撞车」：色相很花，骨架为零。",
        notan: "压成二值黑白后，画面直接塌成一整块死黑，标题、对半圆与焦点彻底消失，说明明暗结构根本没立起来。",
        squint: "模拟眯起眼睛远看：彩度减弱、边缘模糊后整块糊成一团，在 3 米外或手机缩略图里完全读不出主次。",
      },
    },
    clear: {
      bg: PALETTE.paper, // 暖纸 L≈0.81
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

  // 按 W3C sRGB 线性相对亮度还原真实感知灰度（避免直接加权 gamma 值导致红绿明度失真）
  function toGray(rgb) {
    const l = relativeLuminance(rgb);
    const s = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
    const y = Math.round(clamp(s, 0, 1) * 255);
    return [y, y, y];
  }

  function mapCol(rgb) {
    if (lens === "color") return rgbCss(rgb);
    if (lens === "notan") return relativeLuminance(rgb) >= 0.3 ? PALETTE.paperHex : PALETTE.inkHex;
    return rgbCss(toGray(rgb));
  }

  function render() {
    svg.innerHTML = "";
    const c = CASES[caseKey];
    const defs = el("defs", {}, svg);
    if (lens === "squint") {
      const f = el("filter", { id: "sq-blur" }, defs);
      el("feColorMatrix", { type: "saturate", values: "0.38" }, f);
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
    const t2 = el("text", { x: 26, y: 84, fill: mapCol(c.sub), "font-size": 11.5, "font-weight": 500, "letter-spacing": "0.1em", "font-family": '"DM Mono", monospace' }, g);
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
      const tag = el("text", { x: 240, y: 115, "text-anchor": "middle", fill: vPct > 52 ? "#10110e" : "#efe7dc", "font-size": 11.5, "font-weight": 500, "font-family": '"DM Mono", monospace' }, svg);
      tag.textContent = `SAME ${patchHex.toUpperCase()}`;
    } else {
      // 细中轴线标注
      el("line", { x1: 240, y1: 0, x2: 240, y2: 220, stroke: "#b43d1d", "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0.7 }, svg);
    }

    // 底部角落真实色号标注
    const lb1 = el("text", { x: 16, y: 204, fill: rgbCss(rightBg), "font-size": 10.5, "font-family": '"DM Mono", monospace' }, svg);
    lb1.textContent = `PATCH ${patchHex.toUpperCase()}`;
    const lb2 = el("text", { x: 464, y: 204, "text-anchor": "end", fill: rgbCss(leftBg), "font-size": 10.5, "font-family": '"DM Mono", monospace' }, svg);
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
// 03 · 浓淡值阶压缩缩略图（2 值 / 3 值 / 5 值 / 原图灰阶 Notan 对比实验）
// =========================================================================
function initNotanLab() {
  const svg = $("nt-svg");
  const pivotInput = $("nt-pivot");
  const pivotOut = $("nt-pivot-out");
  const massStat = $("nt-mass-stat");
  const massBar = $("nt-mass-bar");
  const read = $("nt-read");
  const thumbs = [...document.querySelectorAll(".nt-thumb")];
  if (!svg || !pivotInput || !thumbs.length) return;

  let sceneKey = "courtyard";
  let levels = 3;

  // 两幅带丰富中间灰的非人像构图（静物拱门 & 远山孤亭，绝不画五官）；
  // 每个形状带真实固有明度 v ∈ [0..1] 与视觉面积权重 w，供 2/3/5 阶量化和面积构成条实时统计。
  const SCENES = {
    courtyard: {
      label: "拱门静物",
      shapes: [
        { tag: "rect", attrs: { x: 0, y: 0, width: 480, height: 260 }, v: 0.36, w: 30 },
        { tag: "rect", attrs: { x: 0, y: 0, width: 92, height: 196 }, v: 0.18, w: 11 },
        { tag: "rect", attrs: { x: 376, y: 42, width: 72, height: 154 }, v: 0.56, w: 8 },
        // 拱门外圈石框（中间偏亮灰，5 阶与原图显石拱厚度，2/3 阶下边缘平滑无缺口）
        { tag: "path", attrs: { d: "M116 196 L116 112 A98 98 0 0 1 312 112 L312 196 Z" }, v: 0.6, w: 4 },
        // 中央明亮拱门洞口（主光源入口，同心完美半圆）
        { tag: "path", attrs: { d: "M130 196 L130 112 A84 84 0 0 1 298 112 L298 196 Z" }, v: 0.96, w: 18 },
        // 拱门外远景矮墙与阴影柱
        { tag: "path", attrs: { d: "M186 196 L186 144 L234 144 L234 128 L300 128 L300 196 Z" }, v: 0.78, w: 6 },
        { tag: "rect", attrs: { x: 252, y: 128, width: 20, height: 68 }, v: 0.46, w: 2 },
        // 石质桌面与斜射入室的亮光带
        { tag: "rect", attrs: { x: 0, y: 196, width: 480, height: 64 }, v: 0.42, w: 10 },
        { tag: "polygon", attrs: { points: "128,196 300,196 392,260 192,260" }, v: 0.88, w: 9 },
        { tag: "rect", attrs: { x: 0, y: 248, width: 480, height: 12 }, v: 0.14, w: 3 },
        // 器物投下的锐利斜影
        { tag: "polygon", attrs: { points: "212,208 262,208 294,232 232,232" }, v: 0.08, w: 2 },
        { tag: "polygon", attrs: { points: "312,204 352,204 420,248 344,248" }, v: 0.07, w: 3 },
        // 左侧低矮陶碗（亮边 + 中灰腹 + 暗底）
        { tag: "path", attrs: { d: "M142 182 L222 182 C218 206 198 214 182 214 C166 214 146 206 142 182 Z" }, v: 0.28, w: 2 },
        { tag: "ellipse", attrs: { cx: 182, cy: 182, rx: 40, ry: 6 }, v: 0.72, w: 1 },
        // 右侧高身瓷瓶（背光暗身 + 面向拱门的受光面）
        { tag: "path", attrs: { d: "M304 106 L332 106 L334 128 C346 142 350 176 340 206 L296 206 C286 176 290 142 302 128 Z" }, v: 0.13, w: 3 },
        { tag: "path", attrs: { d: "M304 106 L317 106 L318 128 C311 144 309 174 313 206 L296 206 C286 176 290 142 302 128 Z" }, v: 0.68, w: 1.5 },
      ],
    },
    pavilion: {
      label: "远山孤亭",
      shapes: [
        // 晨空与高挂亮日
        { tag: "rect", attrs: { x: 0, y: 0, width: 480, height: 174 }, v: 0.92, w: 28 },
        { tag: "rect", attrs: { x: 0, y: 84, width: 480, height: 34 }, v: 0.83, w: 7 },
        { tag: "circle", attrs: { cx: 348, cy: 56, r: 22 }, v: 0.99, w: 2 },
        // 远山淡岚
        { tag: "polygon", attrs: { points: "0,174 0,136 86,108 176,126 274,94 374,124 480,104 480,174" }, v: 0.71, w: 13 },
        // 中景山脊
        { tag: "polygon", attrs: { points: "110,174 206,136 298,154 398,124 480,144 480,174" }, v: 0.51, w: 9 },
        // 湖面与水面高光带
        { tag: "rect", attrs: { x: 0, y: 174, width: 480, height: 86 }, v: 0.63, w: 15 },
        { tag: "polygon", attrs: { points: "326,174 372,174 406,260 288,260" }, v: 0.89, w: 6 },
        { tag: "polygon", attrs: { points: "148,174 310,174 286,216 176,208" }, v: 0.42, w: 5 },
        // 近景山崖
        { tag: "polygon", attrs: { points: "0,174 0,142 64,132 146,144 198,174 178,202 0,202" }, v: 0.25, w: 7 },
        // 崖顶建筑孤亭剪影（纯屋檐立柱几何，无人像）
        { tag: "polygon", attrs: { points: "64,114 114,98 164,114 150,118 78,118" }, v: 0.11, w: 1.5 },
        { tag: "polygon", attrs: { points: "78,104 114,91 150,104" }, v: 0.14, w: 1 },
        { tag: "rect", attrs: { x: 88, y: 118, width: 7, height: 24 }, v: 0.1, w: 0.6 },
        { tag: "rect", attrs: { x: 133, y: 118, width: 7, height: 24 }, v: 0.1, w: 0.6 },
        { tag: "rect", attrs: { x: 80, y: 137, width: 68, height: 6 }, v: 0.16, w: 0.8 },
        // 最前景深墨磐石压角
        { tag: "polygon", attrs: { points: "0,260 0,192 92,202 162,238 206,260" }, v: 0.07, w: 8 },
        { tag: "polygon", attrs: { points: "392,260 442,226 480,214 480,260" }, v: 0.09, w: 3 },
      ],
    },
  };

  function quantize(v, n, pivot) {
    if (n === 2) {
      return v < pivot ? { bucket: 0, tone: 0.05 } : { bucket: 1, tone: 0.96 };
    }
    if (n === 3) {
      const c1 = clamp(pivot - 0.17, 0.14, 0.56);
      const c2 = clamp(pivot + 0.17, 0.44, 0.86);
      if (v < c1) return { bucket: 0, tone: 0.05 };
      if (v < c2) return { bucket: 1, tone: 0.48 };
      return { bucket: 2, tone: 0.96 };
    }
    if (n === 5) {
      const cuts = [pivot - 0.3, pivot - 0.1, pivot + 0.1, pivot + 0.3];
      const tones = [0.05, 0.28, 0.5, 0.74, 0.96];
      let b = 0;
      while (b < 4 && v >= cuts[b]) b++;
      return { bucket: b, tone: tones[b] };
    }
    // 原图连续灰阶：pivot 轻微平移整体曝光偏置，保留全部细阶
    const shifted = clamp(v + (0.5 - pivot) * 0.42, 0.04, 0.99);
    const bucket = shifted < 0.34 ? 0 : shifted < 0.68 ? 1 : 2;
    return { bucket, tone: shifted };
  }

  function paintScene(targetSvg, shapes, n, pivot) {
    targetSvg.innerHTML = "";
    for (const s of shapes) {
      const q = quantize(s.v, n, pivot);
      el(s.tag, { ...s.attrs, fill: rgbCss(toneRgb(q.tone)) }, targetSvg);
    }
  }

  function render() {
    const pivotPct = +pivotInput.value;
    const pivot = pivotPct / 100;
    pivotOut.textContent = `${pivotPct}%`;

    const scene = SCENES[sceneKey];
    paintScene(svg, scene.shapes, levels, pivot);

    // 同步更新四张迷你缩略图（2 值 / 3 值 / 5 值 / 原图）
    thumbs.forEach((btn) => {
      const lv = +btn.dataset.levels;
      btn.setAttribute("aria-pressed", String(lv === levels));
      const mini = btn.querySelector("svg");
      if (mini) paintScene(mini, scene.shapes, lv, pivot);
    });

    // 统计各值阶面积占比，并更新横向色块构成条
    const bucketCount = levels === 2 ? 2 : levels === 5 ? 5 : 3;
    const bucketTones = levels === 2 ? [0.05, 0.96] : levels === 5 ? [0.05, 0.28, 0.5, 0.74, 0.96] : [0.05, 0.48, 0.96];
    const totals = new Array(bucketCount).fill(0);
    let sumW = 0;
    for (const s of scene.shapes) {
      const q = quantize(s.v, levels, pivot);
      totals[q.bucket] += s.w;
      sumW += s.w;
    }
    const pcts = totals.map((x) => Math.round((x / Math.max(sumW, 1)) * 100));
    const drift = 100 - pcts.reduce((a, b) => a + b, 0);
    const maxIdx = pcts.indexOf(Math.max(...pcts));
    pcts[maxIdx] += drift;

    massBar.innerHTML = "";
    pcts.forEach((p, idx) => {
      if (p <= 0) return;
      const seg = document.createElement("span");
      seg.className = "nt-seg";
      seg.style.flexGrow = String(p);
      seg.style.background = rgbCss(toneRgb(bucketTones[idx]));
      massBar.append(seg);
    });

    if (levels === 2) {
      massStat.textContent = `暗面 ${pcts[0]}% · 亮面 ${pcts[1]}%`;
    } else if (levels === 5) {
      massStat.textContent = `五阶 ${pcts.join(" / ")}%`;
    } else {
      massStat.textContent = `暗 ${pcts[0]}% · 灰 ${pcts[1]}% · 亮 ${pcts[2]}%`;
    }

    const pivotNote =
      pivotPct >= 60
        ? "当前归组线偏亮，大批中间灰被并进暗面，画面迅速转向低调聚光。"
        : pivotPct <= 40
          ? "当前归组线偏暗，中间灰大举倒向亮面，只留最深的剪影当锚点。"
          : "当前归组线居中，亮部与暗部按固有明度自然分阵。";

    if (levels === 2) {
      read.textContent = `2 值 Notan（纯黑白）：把一切中间灰清空，最严苛地拷问大图形能不能一秒成立。你看缩略图里的「${scene.label}」，光柱与暗墙融成两块锐利剪影，但远近层次也一并压平。${pivotNote}`;
    } else if (levels === 3) {
      read.textContent = `3 值缩略图（黑 / 中灰 / 白）：通常是骨架最清楚的甜点档。深暗前景、中灰主体与高光入口三分天下，哪怕缩成下方巴掌大小，前后空间和大图形依然一次看透。${pivotNote}`;
    } else if (levels === 5) {
      read.textContent = `5 值阶梯：多出两档柔和过渡后，墙面折角、器物受光面或远山薄雾开始透气；但对比 2 值和 3 值缩略图，大块边界已经明显变软，若草图阶段就画 5 阶很容易丢掉大骨架。${pivotNote}`;
    } else {
      read.textContent = `原图连续灰阶（十余种细阶）：细节与空气感最完整，但如果不先压成 2–3 值检查，很容易被琐碎灰调骗过去——先在缩略图里立住大骨架，再放开细阶最稳。${pivotNote}`;
    }
  }

  onRadio("nt-scene", (v) => {
    sceneKey = v;
    render();
  });
  onRadio("nt-levels", (v) => {
    levels = +v;
    render();
  });
  thumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      levels = +btn.dataset.levels;
      const radio = document.querySelector(`input[name="nt-levels"][value="${levels}"]`);
      if (radio) radio.checked = true;
      render();
    });
  });
  pivotInput.addEventListener("input", render);
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

  function render() {
    const fgV = +fgInput.value;
    const bgV = +bgInput.value;
    const fgRgb = levelRgb(fgV / 100);
    const bgRgb = levelRgb(bgV / 100);
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
      read.textContent = "接近 21:1 纯黑白极限：极短标题和强光户外最锐利，但发光屏幕上连续读长文容易泛起眩光；经验上把两极比纯黑纯白略收一档（如暖纸配深炭灰）会更耐看。";
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
// 07 · 小练习：四版展览海报，哪张明暗预算最成立？
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
      title: "A · 反差够强，但五五平分把骨架劈成两截",
      text: "A 的左右两半都达到 15.5:1、字也清楚，问题出在明暗面积机械五五开且中轴没有任何跨界图形粘合——左边标题与暗块、右边亮卡与白字展期势均力敌，视线在两半之间反复拉扯。和 C 的差距在于：C 用约七成深炭墨统一成一整间暗室，让亮光柱和标题同属一个空间。",
    },
    B: {
      ok: false,
      title: "B · 和 C 最接近，但最高对比度花在了日期牌上",
      text: "B 乍看和 C 几乎是双胞胎——同样约七成暗底、版面也很利落。差就差在明暗预算发错了对象：B 把最刺眼的 15.5:1 暖纸实心底和朱红印章全砸在了底部「10.12—11.30」次要日期条上，反而把真正的主标题压成约 3.2:1 的暗灰、把天窗光柱压成中灰。对照 C：C 只是把最高 15.5:1 预算收回给标题与光柱，让日期退回清晰却不抢戏的 ~6.4:1，主次立刻翻盘。",
    },
    C: {
      ok: true,
      title: "选对了 · C 把 15.5:1 明暗预算精准留给了主角",
      text: "约七成沉静炭墨统一住整间混凝土展厅（不像 A 五五开裂成两截），最高 15.5:1 对比度和单枚朱红只交给「混凝土与光」主标题与天窗光柱（不像 B 被底部日期条抢走预算），墙面折角与地面光晕用中灰交代纵深，底部日期与展厅落在 ~6.4:1 / 4.7:1 温和可读区——一秒分出先后。",
    },
    D: {
      ok: false,
      title: "D · 网格利落，但粗框与底标把对比预算摊平了",
      text: "D 的字和图形在暖纸底上都很清楚，但外框、粗分隔线、顶部黑眉条和底部两块实心日期牌全拉到满格 15.5:1。当所有结构线和配角都以最高音量呐喊时，主标题与建筑光影就失去了独享的入眼优先级。对照 C：C 把辅助线与次要信息主动降噪到中灰，才让主角一秒跳出来。",
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
      vText.textContent = fb.text;
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
  initNotanLab();
  initFocalLab();
  initWcagLab();
  initQuiz();
  initLightbox();
  initReveal();
}
