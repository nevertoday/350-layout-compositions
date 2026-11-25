// 019 非对称构图 — 正文 01–08 节专属交互实验模块
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  dotsText,
  evaluateEqualAreaFlip,
  getAllQuizEvaluations,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// ============================================================
// 01 节：等面积视觉属性翻转器（直接共用 model.js 权重表）
// ============================================================
export function initSection1Flip() {
  const beamGroup = document.getElementById("s1-beam-group");
  const rightShape = document.getElementById("s1-right-shape");
  const tierEl = document.getElementById("s1-tier");
  const leftDotsEl = document.getElementById("s1-left-dots");
  const rightDotsEl = document.getElementById("s1-right-dots");
  const summaryEl = document.getElementById("s1-summary");
  const btns = [...document.querySelectorAll(".flip-btn")];

  const flags = { deep: false, warm: false, angular: false, dense: false };

  function getFill() {
    if (flags.deep && flags.warm) return PALETTE.red;
    if (flags.deep && !flags.warm) return PALETTE.blue;
    if (!flags.deep && flags.warm) return "#F29C7E";
    return PALETTE.mutedGray;
  }

  function render() {
    const res = evaluateEqualAreaFlip(flags);
    tierEl.textContent = `${res.tier.label} · 模型示意`;
    leftDotsEl.textContent = dotsText(res.leftDots);
    rightDotsEl.textContent = dotsText(res.rightDots);
    summaryEl.textContent = res.summary;

    // 视觉杠杆微倾（仅图形示意，不显示度数）
    const deg = res.tier.tiltSign * res.tier.tiltLevel * 6.5;
    beamGroup.setAttribute("transform", `rotate(${deg.toFixed(2)} 280 210)`);

    // 重绘右侧等面积实验块（圆 r=46 面积 ≈ 6648；等面积正三角形边长 ≈ 124，外接高 ≈ 107）
    rightShape.innerHTML = "";
    const fill = getFill();
    if (flags.angular) {
      rightShape.append(
        svgEl("polygon", {
          points: "0,-56 -56,42 56,42",
          fill,
          stroke: PALETTE.ink,
          "stroke-width": 2,
        })
      );
    } else {
      rightShape.append(
        svgEl("circle", {
          cx: 0,
          cy: 0,
          r: 46,
          fill,
          stroke: PALETTE.ink,
          "stroke-width": 2,
        })
      );
    }

    if (flags.dense) {
      const g = svgEl("g", { fill: flags.deep ? PALETTE.yellow : PALETTE.ink });
      const pts = flags.angular
        ? [
            [0, -24],
            [-14, -4], [0, -4], [14, -4],
            [-26, 16], [-10, 16], [10, 16], [26, 16],
            [-36, 32], [-18, 32], [0, 32], [18, 32], [36, 32],
          ]
        : [
            [-21, -21], [-7, -21], [7, -21], [21, -21],
            [-21, -7], [-7, -7], [7, -7], [21, -7],
            [-21, 7], [-7, 7], [7, 7], [21, 7],
            [-21, 21], [-7, 21], [7, 21], [21, 21],
          ];
      for (const [x, y] of pts) {
        g.append(svgEl("circle", { cx: x, cy: y, r: 3.1 }));
      }
      rightShape.append(g);
    }
  }

  for (const btn of btns) {
    btn.addEventListener("click", () => {
      const k = btn.dataset.flag;
      flags[k] = !flags[k];
      btn.setAttribute("aria-pressed", flags[k] ? "true" : "false");
      render();
    });
  }

  render();
}

// ============================================================
// 02 节：五组对比拆解台（原海报 5 条黑线词条 + 单轴滑块）
// ============================================================
const DIM_COPY = {
  size: {
    title: "大小对比（大与小）：主次一眼拉开，不必靠居中抢戏",
    low: "两圆尺寸过于接近，视线在左右来回犹豫，看不出谁是主角。",
    mid: "大小差距开始显现，但次级圆仍然偏大，空间还不够爽利。",
    high: "主圆果断放大、辅圆收精，再借远端距离托住，主次与呼吸感一次成立。",
  },
  color: {
    title: "色彩对比（暖与冷）：前进的暖红，交给沉稳冷群青来拉住",
    low: "两块色温过于相近，都往同一层挤，层次感偏平。",
    mid: "暖色开始向前跳出，冷色略微后退，但反差还可更明确。",
    high: "高饱和朱砂红向前冲、冷群青沉在左下角拉住视觉，小面积冷块也能与暖块抗衡。",
  },
  shape: {
    title: "形状对比（圆与角）：圆润主焦点配硬朗直角，画面立刻精神",
    low: "两侧都是同质圆弧，节奏重复，画面缺乏方向切口。",
    mid: "辅块开始出现硬直边，已经能看出和主圆的性格差异。",
    high: "饱满正圆与锐利直角斜切正面碰撞，柔和与刚硬互相衬托出清晰张力。",
  },
  position: {
    title: "位置对比（偏与中）：利用杠杆力臂，远角小块也能稳住大块",
    low: "两块都挤在中线附近，没有拉出空间跨度，也借不到力臂。",
    mid: "主块偏开中心，辅块开始退向对角，空间开始出现拉扯。",
    high: "主块占据右上偏位，小辅块退到左下远角借长力臂托底，整张画布的留白立刻活起来。",
  },
  density: {
    title: "疏密对比（密与疏）：大面积留白里嵌一块高密肌理，分量翻倍",
    low: "大块平涂对着稀疏几笔，左侧过于松散，视觉分量偏轻。",
    mid: "左侧密度上升，开始能接住右侧大色块，但节奏还可以更紧凑。",
    high: "密集点阵与紧凑文字群聚成强抓力，旁边留出大片空白铬黄，疏可走马、密不透风。",
  },
};

export function initSection2Contrast() {
  const svg = document.getElementById("s2-svg");
  const slider = document.getElementById("s2-slider");
  const levelEl = document.getElementById("s2-level");
  const titleEl = document.getElementById("s2-title");
  const descEl = document.getElementById("s2-desc");
  const tabs = [...document.querySelectorAll(".cw-tab")];

  let dim = "size";
  let val = Number(slider.value);

  function render() {
    const t = val / 100;
    const copy = DIM_COPY[dim];
    titleEl.textContent = copy.title;
    if (val < 30) {
      levelEl.textContent = "反差偏弱";
      descEl.textContent = copy.low;
    } else if (val < 68) {
      levelEl.textContent = "中等过渡";
      descEl.textContent = copy.mid;
    } else {
      levelEl.textContent = "清脆反差";
      descEl.textContent = copy.high;
    }

    svg.innerHTML = "";
    svg.append(svgEl("rect", { x: 0, y: 0, width: 600, height: 280, fill: PALETTE.yellow }));
    svg.append(
      svgEl("line", {
        x1: 300,
        y1: 16,
        x2: 300,
        y2: 264,
        stroke: PALETTE.ink,
        "stroke-width": 1,
        "stroke-dasharray": "4 5",
        opacity: 0.35,
      })
    );

    if (dim === "size") {
      const rMain = 52 + t * 34;
      const rSub = 48 - t * 30;
      svg.append(svgEl("circle", { cx: 430, cy: 118, r: rMain, fill: PALETTE.red }));
      svg.append(svgEl("circle", { cx: 155, cy: 178, r: rSub, fill: PALETTE.blue }));
      svg.append(
        svgEl("line", {
          x1: 155 + rSub + 12,
          y1: 178 - 6,
          x2: 430 - rMain - 12,
          y2: 118 + 6,
          stroke: PALETTE.ink,
          "stroke-width": 2,
          "stroke-dasharray": "3 7",
        })
      );
    } else if (dim === "color") {
      // 从相近暖红过渡到纯群青冷色
      const mix = (a, b) => Math.round(a + (b - a) * t);
      const r = mix(226, 2);
      const g = mix(84, 45);
      const b = mix(42, 144);
      const subFill = `rgb(${r},${g},${b})`;
      svg.append(svgEl("circle", { cx: 430, cy: 116, r: 78, fill: PALETTE.red }));
      svg.append(svgEl("rect", { x: 96, y: 146, width: 108, height: 76, fill: subFill }));
      const colorCap = svgEl("text", {
        x: 150,
        y: 252,
        "text-anchor": "middle",
        fill: PALETTE.ink,
        "font-size": 20,
        "font-weight": 800,
      });
      colorCap.textContent = t > 0.6 ? "冷群青稳稳拉住暖红" : "色温接近，层次打不开";
      svg.append(colorCap);
    } else if (dim === "shape") {
      svg.append(svgEl("circle", { cx: 430, cy: 112, r: 76, fill: PALETTE.red }));
      // 从圆润倒角变成锐利直角斜切三角
      const cx = 165;
      const cy = 185;
      if (t < 0.35) {
        svg.append(svgEl("circle", { cx, cy, r: 44, fill: PALETTE.blue }));
      } else if (t < 0.68) {
        const rad = Math.round((1 - (t - 0.35) / 0.33) * 32);
        svg.append(svgEl("rect", { x: cx - 50, y: cy - 38, width: 100, height: 76, rx: rad, fill: PALETTE.blue }));
      } else {
        svg.append(svgEl("polygon", { points: `${cx - 64},${cy + 46} ${cx + 58},${cy + 46} ${cx + 58},${cy - 54}`, fill: PALETTE.blue }));
      }
    } else if (dim === "position") {
      const mainX = 335 + t * 115;
      const mainY = 140 - t * 38;
      const subX = 258 - t * 150;
      const subY = 140 + t * 62;
      svg.append(svgEl("circle", { cx: mainX, cy: mainY, r: 68, fill: PALETTE.red }));
      svg.append(svgEl("rect", { x: subX - 30, y: subY - 24, width: 60, height: 48, fill: PALETTE.blue }));
      svg.append(
        svgEl("line", {
          x1: subX + 34,
          y1: subY - 12,
          x2: mainX - 72,
          y2: mainY + 12,
          stroke: PALETTE.ink,
          "stroke-width": 2,
          "stroke-dasharray": "4 6",
        })
      );
    } else if (dim === "density") {
      svg.append(svgEl("circle", { cx: 442, cy: 112, r: 78, fill: PALETTE.red }));
      const cols = 2 + Math.round(t * 4); // 2x2 → 6x6
      const rows = 2 + Math.round(t * 3);
      const boxW = 128;
      const boxH = 96;
      const ox = 86;
      const oy = 140;
      const stepX = cols > 1 ? boxW / (cols - 1) : 0;
      const stepY = rows > 1 ? boxH / (rows - 1) : 0;
      const dr = 3 + t * 2.4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          svg.append(svgEl("circle", { cx: ox + c * stepX, cy: oy + r * stepY, r: dr, fill: PALETTE.ink }));
        }
      }
      svg.append(svgEl("rect", { x: 86, y: 54, width: 120, height: 10, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: 86, y: 72, width: 78, height: 6, fill: PALETTE.ink }));
    }
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      dim = tab.dataset.dim;
      for (const o of tabs) o.setAttribute("aria-selected", o === tab ? "true" : "false");
      render();
    });
  }

  slider.addEventListener("input", () => {
    val = Number(slider.value);
    render();
  });

  render();
}

// ============================================================
// 03 节：2D 动线光点重播 + 三处败笔开关
// ============================================================
export function initSection3Flow() {
  const canvas = document.getElementById("s3-canvas");
  const ctx = canvas.getContext("2d");
  const btnReplay = document.getElementById("s3-replay");
  const readoutEl = document.getElementById("s3-readout");
  const ruleMirrorEl = document.getElementById("s3-rule-mirror");
  const breakBtns = [...document.querySelectorAll(".breaker-btn")];

  const breaks = { fill: false, nodots: false, rival: false };
  let progress = reducedMotion.matches ? 1 : 0;
  let dirty = true;
  let cw = 600;
  let ch = 375;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(150, Math.round(rect.height));
    const p = pixelRatio(2);
    if (w !== cw || h !== ch || p !== dpr) {
      cw = w;
      ch = h;
      dpr = p;
      canvas.width = Math.round(w * p);
      canvas.height = Math.round(h * p);
      dirty = true;
    }
  }

  function updateReadout() {
    const active = [];
    if (breaks.fill) active.push("塞满留白");
    if (breaks.nodots) active.push("拿掉点线导向");
    if (breaks.rival) active.push("添入等大抢戏圆");

    if (ruleMirrorEl) {
      const states = {
        subject: !breaks.rival,
        space: !breaks.fill,
        flow: !breaks.nodots && !breaks.rival && !breaks.fill,
      };
      for (const li of ruleMirrorEl.querySelectorAll("li[data-rule]")) {
        const ok = Boolean(states[li.dataset.rule]);
        li.dataset.ok = ok ? "true" : "false";
        const pill = li.querySelector(".s3-pill");
        if (pill) pill.textContent = ok ? "完好" : "已破坏";
      }
    }

    if (active.length === 0) {
      readoutEl.textContent =
        "三条法则全部完好：视线先被右上朱红大圆抓住，再顺着 45° 黑色点线斜切穿过干净留白，稳稳落进左下冷蓝小圆与文字群。";
    } else if (breaks.rival) {
      readoutEl.textContent =
        `已开启「${active.join(" + ")}」：左下出现与主圆等大抢戏的暖红圆，视线在两个大圆之间来回弹跳，原本单向顺滑的导流路径被打断。`;
    } else if (breaks.fill) {
      readoutEl.textContent =
        `已开启「${active.join(" + ")}」：大片呼吸留白被杂块塞满，主次反差迅速变糊，眼睛在满屏元素间迷失方向。`;
    } else {
      readoutEl.textContent =
        `已开启「${active.join(" + ")}」：拿掉 45° 点线桥接后，右上主圆与左下辅块各自孤立，视线滑出右上角后缺少落脚指引。`;
    }
  }

  function drawFrame(t, dt, { still }) {
    let running = false;
    if (still) {
      progress = 1;
    } else if (progress < 1) {
      progress = Math.min(1, progress + (dt || 0.016) * 0.55);
      running = true;
    }
    if (!dirty && !running) return;
    dirty = false;

    const W = cw;
    const H = ch;
    const minDim = Math.min(W, H);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 铬黄底
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(0, 0, W, H);

    // 败笔 1：塞满留白
    if (breaks.fill) {
      ctx.fillStyle = "rgba(11, 10, 8, 0.22)";
      const clutter = [
        [0.06, 0.08, 0.28, 0.22],
        [0.37, 0.08, 0.22, 0.16],
        [0.35, 0.29, 0.24, 0.22],
        [0.06, 0.36, 0.24, 0.26],
        [0.33, 0.57, 0.25, 0.28],
        [0.64, 0.62, 0.28, 0.26],
      ];
      for (const [rx, ry, rw, rh] of clutter) {
        ctx.fillRect(rx * W, ry * H, rw * W, rh * H);
      }
    }

    // 原海报右下群青斜角
    ctx.fillStyle = PALETTE.blue;
    ctx.beginPath();
    ctx.moveTo(W * 0.44, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, H * 0.36);
    ctx.closePath();
    ctx.fill();

    // 左上文字简标
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(W * 0.07, H * 0.12, W * 0.24, minDim * 0.055);
    ctx.fillRect(W * 0.07, H * 0.21, W * 0.17, minDim * 0.03);

    // 右上主红圆
    const ax = W * 0.77;
    const ay = H * 0.27;
    const ar = minDim * 0.2;
    ctx.fillStyle = PALETTE.red;
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fill();

    // 左下冷蓝小圆或等大抢戏红圆
    const bx = W * 0.26;
    const by = H * 0.72;
    if (breaks.rival) {
      ctx.fillStyle = PALETTE.red;
      ctx.beginPath();
      ctx.arc(bx, by, ar * 0.94, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = PALETTE.blue;
      ctx.beginPath();
      ctx.arc(bx, by, minDim * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }

    // 45° 黑色点线（除非开启拿掉点线）
    if (!breaks.nodots) {
      const steps = 11;
      for (let i = 1; i < steps; i++) {
        const f = i / steps;
        const px = ax + (bx - ax) * f;
        const py = ay + (by - ay) * f;
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(px, py, 3.6 - f * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 视线轨迹与光点
    ctx.save();
    const pts = breaks.rival
      ? [
          [ax, ay],
          [bx, by],
          [ax * 0.92, ay * 1.15],
          [bx * 1.15, by * 0.92],
        ]
      : breaks.nodots || breaks.fill
        ? [
            [ax, ay],
            [W * 0.52, H * 0.24],
            [W * 0.42, H * 0.48],
            [W * 0.2, H * 0.42],
          ]
        : [
            [ax, ay],
            [W * 0.52, H * 0.50],
            [bx, by],
            [W * 0.16, H * 0.78],
          ];

    ctx.strokeStyle = breaks.rival || breaks.fill || breaks.nodots ? PALETTE.red : PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.setLineDash(breaks.rival || breaks.fill || breaks.nodots ? [7, 6] : []);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    const totalSeg = pts.length - 1;
    const scaled = progress * totalSeg;
    let curX = pts[0][0];
    let curY = pts[0][1];
    for (let i = 0; i < totalSeg; i++) {
      const segP = Math.max(0, Math.min(1, scaled - i));
      if (segP > 0) {
        curX = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * segP;
        curY = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * segP;
        ctx.lineTo(curX, curY);
      }
    }
    ctx.stroke();

    // 视线停驻点
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.paper;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(curX, curY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  const ticker = loop(canvas, drawFrame);

  btnReplay.addEventListener("click", () => {
    progress = reducedMotion.matches ? 1 : 0;
    dirty = true;
    ticker.draw();
  });

  for (const btn of breakBtns) {
    btn.addEventListener("click", () => {
      const k = btn.dataset.break;
      breaks[k] = !breaks[k];
      btn.setAttribute("aria-pressed", breaks[k] ? "true" : "false");
      progress = reducedMotion.matches ? 1 : 0;
      dirty = true;
      updateReadout();
      ticker.draw();
    });
  }

  new ResizeObserver(() => {
    resize();
    ticker.draw();
  }).observe(canvas);

  resize();
  updateReadout();
  ticker.draw();
}

// ============================================================
// 04 节：留白偏置与新排版（并列两条传统 · 四坐标切换）
// ============================================================
const HIST_DATA = {
  tohaku: {
    tradition: "东亚留白偏置传统（独立脉络）",
    title: "16 世纪 · 长谷川等伯《松林图屏风》",
    body: "日本安土桃山时代画家长谷川等伯（1539–1610）的六曲一双国宝屏风（现藏东京国立博物馆），放弃满铺景物，用浓淡错落的墨松群偏置画面局部，让大片素纸承担山岚与呼吸感。它与后来欧洲现代排版并无传承关系，却独立印证了「留白本身就是配重」。",
    src: "出处核实：东京国立博物馆国宝档案（ColID A10471）",
  },
  destijl: {
    tradition: "欧洲现代主义 · 动态平衡",
    title: "1917 年 · 风格派《De Stijl》",
    body: "蒙德里安与杜斯伯格等人于 1917 年创办《De Stijl》杂志，拒绝装饰与中心对称，只用红、黄、蓝三原色、黑白灰与不等分垂平格线建立「动态平衡（dynamic equilibrium）」——靠色面大小、纯度与位置对冲稳住画面。",
    src: "出处核实：Tate 泰特美术馆术语档案 De Stijl",
  },
  tschichold: {
    tradition: "欧洲现代主义 · 新排版运动",
    title: "1928 年 · 扬·契肖尔德《新排版学》",
    body: "契肖尔德在 1928 年出版《Die neue Typographie》（新排版学），将先锋艺术的非对称原理转化为印刷工坊可用的排版规范：放弃无谓居中，让标题、图片和正文按信息轻重与阅读顺序不均等排布，直接影响了整个 20 世纪的海报与版式设计。",
    src: "出处核实：加州大学出版社《The New Typography》条目",
  },
  arnheim: {
    tradition: "视知觉心理学 · 视觉重量理论",
    title: "1954 年 · 鲁道夫·阿恩海姆《艺术与视知觉》",
    body: "阿恩海姆在 1954 年首版（1974 年修订）的《Art and Visual Perception》第一章系统讨论了「Balance」：提出颜色、大小、孤立度、位置与形态都会影响图形在人眼里的视觉重量，使「为什么不等形也能稳」有了清晰的心理学分析框架。",
    src: "出处核实：加州大学出版社《Art and Visual Perception》条目",
  },
};

export function initSection4History() {
  const svg = document.getElementById("s4-svg");
  const tradEl = document.getElementById("s4-tradition");
  const titleEl = document.getElementById("s4-title");
  const bodyEl = document.getElementById("s4-body");
  const srcEl = document.getElementById("s4-src");
  const tabs = [...document.querySelectorAll(".hist-card")];

  function drawEra(era) {
    const info = HIST_DATA[era] || HIST_DATA.tohaku;
    tradEl.textContent = info.tradition;
    titleEl.textContent = info.title;
    bodyEl.textContent = info.body;
    srcEl.textContent = info.src;

    svg.innerHTML = "";
    if (era === "tohaku") {
      // 纯几何「左轻右重 + 大片素纸」六曲屏风体量示意（拒绝粗糙仿水墨，与其余三幅几何骨架统一）
      const defs = svgEl("defs");

      const barFade = svgEl("linearGradient", { id: "tohaku-bar-fade", x1: "0", y1: "0", x2: "0", y2: "1" });
      barFade.append(svgEl("stop", { offset: "0%", "stop-color": PALETTE.ink, "stop-opacity": 1 }));
      barFade.append(svgEl("stop", { offset: "68%", "stop-color": PALETTE.ink, "stop-opacity": 0.85 }));
      barFade.append(svgEl("stop", { offset: "100%", "stop-color": PALETTE.ink, "stop-opacity": 0.05 }));
      defs.append(barFade);

      svg.append(defs);

      // 六曲屏风折面（微明暗交替 + 细折痕线）
      const panelW = 560 / 6;
      for (let i = 0; i < 6; i++) {
        svg.append(
          svgEl("rect", {
            x: +(i * panelW).toFixed(2),
            y: 0,
            width: +(panelW + 0.5).toFixed(2),
            height: 300,
            fill: i % 2 === 0 ? "#F8F1DE" : "#F2E9D0",
          })
        );
        if (i > 0) {
          svg.append(
            svgEl("line", {
              x1: +(i * panelW).toFixed(2),
              y1: 0,
              x2: +(i * panelW).toFixed(2),
              y2: 300,
              stroke: PALETTE.ink,
              "stroke-width": 1,
              opacity: 0.16,
            })
          );
        }
      }

      // 左区（第 1–2 曲）：少量淡墨竖条（体量轻、间距疏，远距托住右侧）
      const leftBars = [
        { x: 46, y: 128, w: 12, h: 122, op: 0.2 },
        { x: 68, y: 102, w: 16, h: 152, op: 0.34 },
        { x: 96, y: 138, w: 11, h: 108, op: 0.18 },
        { x: 118, y: 118, w: 14, h: 134, op: 0.28 },
      ];
      for (const b of leftBars) {
        svg.append(svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "url(#tohaku-bar-fade)", opacity: b.op }));
      }

      // 中间大片素纸呼吸域（第 2.5–4 曲）：纯虚线框出负空间配重范围
      svg.append(
        svgEl("rect", {
          x: 158,
          y: 44,
          width: 176,
          height: 196,
          fill: "none",
          stroke: PALETTE.ink,
          "stroke-width": 1.4,
          "stroke-dasharray": "5 5",
          opacity: 0.42,
        })
      );

      // 右区（第 4.5–6 曲）：高密、高低错落的浓墨竖条与叠加体量块（视觉主重）
      const rightBars = [
        { x: 356, y: 88, w: 16, h: 168, op: 0.48 },
        { x: 378, y: 54, w: 22, h: 204, op: 0.78 },
        { x: 406, y: 38, w: 28, h: 222, op: 0.94 },
        { x: 440, y: 62, w: 20, h: 196, op: 0.68 },
        { x: 466, y: 46, w: 26, h: 214, op: 0.88 },
        { x: 498, y: 74, w: 18, h: 182, op: 0.56 },
        { x: 520, y: 98, w: 14, h: 154, op: 0.42 },
      ];
      for (const b of rightBars) {
        svg.append(svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "url(#tohaku-bar-fade)", opacity: b.op }));
      }

      // 底沿极简视觉体量标尺（直显左疏轻 / 中留白 / 右密重）
      svg.append(svgEl("line", { x1: 36, y1: 262, x2: 524, y2: 262, stroke: PALETTE.ink, "stroke-width": 1.5, opacity: 0.35 }));
      svg.append(svgEl("rect", { x: 46, y: 259, width: 86, height: 6, fill: PALETTE.ink, opacity: 0.38 }));
      svg.append(svgEl("rect", { x: 356, y: 257, width: 178, height: 10, fill: PALETTE.ink, opacity: 0.92 }));

      // 清晰高对比结构标注（390px 下仍 ≥ 10px）
      const voidTop = svgEl("text", { x: 246, y: 128, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 19, "font-weight": 800 });
      voidTop.textContent = "大片素纸留白";
      svg.append(voidTop);

      const voidSub = svgEl("text", { x: 246, y: 156, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 16, "font-weight": 700 });
      voidSub.textContent = "以空白承接右侧重墨";
      svg.append(voidSub);

      const leftCap = svgEl("text", { x: 89, y: 288, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 16, "font-weight": 800 });
      leftCap.textContent = "左 · 淡墨疏轻";
      svg.append(leftCap);

      const rightCap = svgEl("text", { x: 445, y: 288, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 16, "font-weight": 800 });
      rightCap.textContent = "右 · 浓墨密重";
      svg.append(rightCap);
    } else if (era === "destijl") {
      // 风格派不等分黑线 + 红黄蓝三原色动态平衡
      svg.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 300, fill: PALETTE.paper }));
      svg.append(svgEl("rect", { x: 24, y: 20, width: 224, height: 158, fill: PALETTE.red }));
      svg.append(svgEl("rect", { x: 432, y: 186, width: 104, height: 94, fill: PALETTE.blue }));
      svg.append(svgEl("rect", { x: 256, y: 20, width: 168, height: 68, fill: PALETTE.yellow }));
      // 粗黑不等分格线
      const lines = [
        [24, 182, 536, 182],
        [24, 92, 536, 92],
        [252, 20, 252, 280],
        [428, 20, 428, 280],
      ];
      for (const [x1, y1, x2, y2] of lines) {
        svg.append(svgEl("line", { x1, y1, x2, y2, stroke: PALETTE.ink, "stroke-width": 8 }));
      }
      svg.append(svgEl("rect", { x: 24, y: 20, width: 512, height: 260, fill: "none", stroke: PALETTE.ink, "stroke-width": 4 }));
    } else if (era === "tschichold") {
      // 新排版学非对称功能页：粗红竖杠 + 左偏大字 + 远端小信息块
      svg.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 300, fill: PALETTE.paper }));
      svg.append(svgEl("rect", { x: 162, y: 20, width: 14, height: 260, fill: PALETTE.red }));
      svg.append(svgEl("rect", { x: 194, y: 42, width: 250, height: 26, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: 194, y: 78, width: 178, height: 16, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: 194, y: 130, width: 304, height: 8, fill: PALETTE.ink, opacity: 0.72 }));
      svg.append(svgEl("rect", { x: 194, y: 148, width: 274, height: 8, fill: PALETTE.ink, opacity: 0.72 }));
      svg.append(svgEl("rect", { x: 194, y: 166, width: 220, height: 8, fill: PALETTE.ink, opacity: 0.72 }));
      svg.append(svgEl("rect", { x: 26, y: 206, width: 120, height: 54, fill: PALETTE.blue }));
      const ntTxt = svgEl("text", { x: 86, y: 239, "text-anchor": "middle", fill: PALETTE.paper, "font-size": 17, "font-weight": 800 });
      ntTxt.textContent = "1928 新排版";
      svg.append(ntTxt);
    } else {
      // 阿恩海姆结构骨架：对角与垂平隐轴 + 远近视觉重量圈
      svg.append(svgEl("rect", { x: 0, y: 0, width: 560, height: 300, fill: PALETTE.yellow }));
      const axes = [
        [280, 18, 280, 282],
        [28, 150, 532, 150],
        [28, 18, 532, 282],
        [532, 18, 28, 282],
      ];
      for (const [x1, y1, x2, y2] of axes) {
        svg.append(svgEl("line", { x1, y1, x2, y2, stroke: PALETTE.ink, "stroke-width": 1.4, "stroke-dasharray": "5 5", opacity: 0.45 }));
      }
      svg.append(svgEl("circle", { cx: 404, cy: 96, r: 54, fill: PALETTE.red }));
      svg.append(svgEl("circle", { cx: 118, cy: 214, r: 22, fill: PALETTE.blue }));
      svg.append(svgEl("rect", { x: 96, y: 246, width: 78, height: 10, fill: PALETTE.ink }));
      svg.append(svgEl("circle", { cx: 280, cy: 150, r: 5, fill: PALETTE.ink }));
    }
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const o of tabs) o.setAttribute("aria-selected", o === tab ? "true" : "false");
      drawEra(tab.dataset.era);
    });
  }

  drawEra("tohaku");
}

// ============================================================
// 05 节：翻车海报三步校尺急救板
// ============================================================
export function initSection5Rescue() {
  const svg = document.getElementById("s5-svg");
  const readout = document.getElementById("s5-readout");
  const presetBtns = [...document.querySelectorAll(".rs-preset")];
  const cb1 = document.getElementById("rs-step-1");
  const cb2 = document.getElementById("rs-step-2");
  const cb3 = document.getElementById("rs-step-3");

  let caseId = "poster";

  function render() {
    const s1 = cb1.checked; // 拉开主次体量
    const s2 = cb2.checked; // 锁进隐形对齐边
    const s3 = cb3.checked; // 清出留白并远端补重
    const doneCount = [s1, s2, s3].filter(Boolean).length;

    svg.innerHTML = "";
    svg.append(svgEl("rect", { x: 0, y: 0, width: 540, height: 360, fill: PALETTE.yellow }));

    // 若勾选第 2 步，亮出清晰隐形对齐参考边
    if (s2) {
      svg.append(svgEl("line", { x1: 42, y1: 18, x2: 42, y2: 342, stroke: PALETTE.blue, "stroke-width": 1.6, "stroke-dasharray": "5 4" }));
      svg.append(svgEl("line", { x1: 498, y1: 18, x2: 498, y2: 342, stroke: PALETTE.blue, "stroke-width": 1.6, "stroke-dasharray": "5 4" }));
      svg.append(svgEl("line", { x1: 18, y1: 318, x2: 522, y2: 318, stroke: PALETTE.blue, "stroke-width": 1.6, "stroke-dasharray": "5 4" }));
    }

    if (caseId === "poster") {
      // 主红圆：未开 s1 时偏小且混在右半区；开 s1 后果断做大成第一主角
      const redR = s1 ? 74 : 44;
      const redX = s2 ? 424 : 386;
      const redY = s1 ? 106 : 138;
      svg.append(svgEl("circle", { cx: redX, cy: redY, r: redR, fill: PALETTE.red }));

      // 标题群：未开 s2 时歪斜无基准；开 s2 后齐整靠左对齐线 x=42
      const tx = s2 ? 42 : 210;
      const ty = s2 ? 48 : 34;
      svg.append(svgEl("rect", { x: tx, y: ty, width: s1 ? 196 : 140, height: s1 ? 26 : 18, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: s2 ? 42 : 244, y: ty + 34, width: 124, height: 10, fill: PALETTE.ink }));

      // 次要色块（未开 s3 时全堆在右侧坠边，开 s3 后收拢到左下远角托住右上主圆）
      const bx = s3 ? 42 : 340;
      const by = s3 ? 236 : 218;
      const bw = s1 ? 112 : 134;
      const bh = s1 ? 82 : 88;
      svg.append(svgEl("rect", { x: bx, y: by, width: bw, height: bh, fill: PALETTE.blue }));

      // 杂乱说明块（未开 s3 时散落塞满留白；开 s3 后并入左下对齐块内）
      if (!s3) {
        svg.append(svgEl("rect", { x: 288, y: 174, width: 72, height: 22, fill: PALETTE.ink }));
        svg.append(svgEl("rect", { x: 404, y: 298, width: 96, height: 18, fill: PALETTE.ink }));
      } else {
        svg.append(svgEl("rect", { x: bx + bw + 14, y: 266, width: 84, height: 10, fill: PALETTE.ink }));
        svg.append(svgEl("rect", { x: bx + bw + 14, y: 286, width: 62, height: 8, fill: PALETTE.ink }));
        // 点线连回主红圆
        svg.append(svgEl("line", { x1: bx + bw + 12, y1: by - 8, x2: redX - redR - 8, y2: redY + 34, stroke: PALETTE.ink, "stroke-width": 2, "stroke-dasharray": "3 7" }));
      }
    } else {
      // 样张 B：专题卡假对称（只偏了十几个像素像手抖，开三步变成干脆的 1:2 非对称）
      const cardX = s3 ? 320 : 284;
      const cardW = s1 ? 178 : 138;
      const cardH = s1 ? 216 : 160;
      svg.append(svgEl("rect", { x: cardX, y: 54, width: cardW, height: cardH, fill: PALETTE.red }));

      const leftX = s2 ? 42 : 84;
      svg.append(svgEl("rect", { x: leftX, y: s2 ? 54 : 68, width: s1 ? 178 : 136, height: s1 ? 24 : 18, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: s2 ? 42 : 102, y: 92, width: 146, height: 9, fill: PALETTE.ink }));
      svg.append(svgEl("rect", { x: s2 ? 42 : 76, y: 112, width: 122, height: 9, fill: PALETTE.ink }));

      const footX = s3 ? 42 : 148;
      svg.append(svgEl("rect", { x: footX, y: 240, width: s3 ? 132 : 108, height: 78, fill: PALETTE.blue }));
      if (s3) {
        svg.append(svgEl("line", { x1: 186, y1: 240, x2: cardX - 12, y2: 146, stroke: PALETTE.ink, "stroke-width": 2, "stroke-dasharray": "4 6" }));
      }
    }

    if (doneCount === 0) {
      readout.innerHTML =
        caseId === "poster"
          ? "<strong>当前状态：三病并发（坠边 + 无对齐 + 满铺失焦）</strong><p>主辅块都堆在右半边且大小相近、左缘参差不齐——这不是洒脱的非对称，而是失控的散落。按顺序勾选三道校尺，看秩序怎样一步步回来。</p>"
          : "<strong>当前状态：差一点的「假对称」</strong><p>中轴只偏了一小截，左右体量又差不多，人眼会先拿对称去挑刺，只觉得版面没对齐。拉开主次、锁对齐边、补远端配重，把它改成坦荡的非对称。</p>";
    } else if (doneCount < 3) {
      const doneList = [
        s1 && "主次体量已拉开",
        s2 && "隐形对齐边已锁紧",
        s3 && "留白与远端配重已就位",
      ].filter(Boolean);
      readout.innerHTML = `<strong>已修复 ${doneCount} / 3：${doneList.join("、")}</strong><p>版面明显干净了，再勾选余下的校尺，让「主次、对齐、配重」三条同时闭环。</p>`;
    } else {
      readout.innerHTML =
        "<strong>三道校尺全部锁稳：真正的非对称秩序成立</strong><p>第一主角明确，所有边缘各有所依，左下冷蓝辅块隔着大片干净留白托住右侧红块——看起来舒展洒脱，其实处处受控。</p>";
    }
  }

  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      caseId = btn.dataset.case;
      for (const o of presetBtns) o.setAttribute("aria-pressed", o === btn ? "true" : "false");
      render();
    });
  }

  for (const cb of [cb1, cb2, cb3]) cb.addEventListener("change", render);
  render();
}

// ============================================================
// 06 节：四场景试衣间 + 中缝对照拉帘
// ============================================================
const SCENES_6 = {
  festival: {
    title: "音乐节海报：非对称更能打出脉冲感",
    desc: "左侧非对称版用大号错位色盘与左下阵容信息打出节奏与方向；右侧对称居中虽然端正，却容易显得像严肃讲座通告。",
    asym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#FABD19"/>
        <circle cx="352" cy="116" r="96" fill="#E63514"/>
        <polygon points="210,360 480,360 480,174" fill="#022D90"/>
        <rect x="34" y="56" width="168" height="34" fill="#0B0A08"/>
        <text x="44" y="80" fill="#FABD19" font-size="18" font-weight="900">夏夜声浪节</text>
        <rect x="34" y="102" width="124" height="10" fill="#0B0A08"/>
        <line x1="256" y1="168" x2="112" y2="256" stroke="#0B0A08" stroke-width="3" stroke-dasharray="4 8"/>
        <circle cx="92" cy="270" r="16" fill="#022D90"/>
        <rect x="34" y="302" width="150" height="10" fill="#0B0A08"/>
        <rect x="34" y="320" width="108" height="8" fill="#0B0A08"/>
      </svg>`,
    sym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#FABD19"/>
        <rect x="36" y="24" width="408" height="312" fill="none" stroke="#0B0A08" stroke-width="2"/>
        <circle cx="240" cy="150" r="64" fill="#E63514"/>
        <text x="240" y="62" text-anchor="middle" fill="#0B0A08" font-size="22" font-weight="900">夏夜声浪节</text>
        <rect x="160" y="242" width="160" height="10" fill="#0B0A08"/>
        <rect x="186" y="264" width="108" height="8" fill="#0B0A08"/>
        <rect x="196" y="294" width="88" height="22" fill="#022D90"/>
      </svg>`,
  },
  novel: {
    title: "长篇小说内页：老老实实回归端正对称",
    desc: "连续阅读上百页时，读者需要安静稳定的版心和恒定起行点；左版非对称跳跃重心反而打断沉浸，右版经典对称双页才是正途。",
    asym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#F7F0DC"/>
        <line x1="240" y1="0" x2="240" y2="360" stroke="#0B0A08" stroke-width="1.5" opacity="0.25"/>
        <rect x="30" y="56" width="136" height="22" fill="#E63514"/>
        <rect x="82" y="96" width="132" height="7" fill="#0B0A08"/>
        <rect x="52" y="114" width="162" height="7" fill="#0B0A08"/>
        <rect x="96" y="132" width="118" height="7" fill="#0B0A08"/>
        <rect x="274" y="182" width="176" height="7" fill="#0B0A08"/>
        <rect x="260" y="200" width="166" height="7" fill="#0B0A08"/>
        <rect x="312" y="218" width="136" height="7" fill="#0B0A08"/>
        <rect x="274" y="236" width="144" height="7" fill="#0B0A08"/>
        <circle cx="386" cy="96" r="36" fill="#022D90"/>
      </svg>`,
    sym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#F7F0DC"/>
        <line x1="240" y1="0" x2="240" y2="360" stroke="#0B0A08" stroke-width="1.5" opacity="0.25"/>
        <text x="128" y="64" text-anchor="middle" fill="#0B0A08" font-size="18" font-weight="800">第一章</text>
        <g fill="#0B0A08" opacity="0.82">
          <rect x="46" y="92" width="164" height="7"/><rect x="46" y="110" width="164" height="7"/>
          <rect x="46" y="128" width="164" height="7"/><rect x="46" y="146" width="164" height="7"/>
          <rect x="46" y="164" width="164" height="7"/><rect x="46" y="182" width="164" height="7"/>
          <rect x="46" y="200" width="164" height="7"/><rect x="46" y="218" width="132" height="7"/>
          <rect x="270" y="92" width="164" height="7"/><rect x="270" y="110" width="164" height="7"/>
          <rect x="270" y="128" width="164" height="7"/><rect x="270" y="146" width="164" height="7"/>
          <rect x="270" y="164" width="164" height="7"/><rect x="270" y="182" width="164" height="7"/>
          <rect x="270" y="200" width="164" height="7"/><rect x="270" y="218" width="142" height="7"/>
        </g>
        <text x="128" y="318" text-anchor="middle" fill="#0B0A08" font-size="15" font-weight="700">12</text>
        <text x="352" y="318" text-anchor="middle" fill="#0B0A08" font-size="15" font-weight="700">13</text>
      </svg>`,
  },
  cert: {
    title: "荣誉证书：居中对称才压得住庄重感",
    desc: "证书和嘉奖讲究仪式感与权威信誉：把印章和标题甩去角落虽然显得时髦，但容易削弱正式分量，右侧对称居中更稳妥。",
    asym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#F7F0DC"/>
        <rect x="22" y="22" width="436" height="316" fill="none" stroke="#0B0A08" stroke-width="3"/>
        <text x="48" y="88" fill="#0B0A08" font-size="24" font-weight="900">荣誉证书</text>
        <rect x="48" y="106" width="160" height="8" fill="#022D90"/>
        <rect x="48" y="142" width="210" height="8" fill="#0B0A08"/>
        <rect x="48" y="162" width="176" height="8" fill="#0B0A08"/>
        <circle cx="378" cy="242" r="46" fill="#E63514"/>
      </svg>`,
    sym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#F7F0DC"/>
        <rect x="22" y="22" width="436" height="316" fill="none" stroke="#0B0A08" stroke-width="3"/>
        <rect x="32" y="32" width="416" height="296" fill="none" stroke="#022D90" stroke-width="1.5"/>
        <text x="240" y="92" text-anchor="middle" fill="#0B0A08" font-size="24" font-weight="900">荣誉证书</text>
        <line x1="160" y1="112" x2="320" y2="112" stroke="#0B0A08" stroke-width="2"/>
        <rect x="130" y="142" width="220" height="9" fill="#0B0A08"/>
        <rect x="156" y="164" width="168" height="8" fill="#0B0A08"/>
        <circle cx="240" cy="252" r="28" fill="#E63514"/>
      </svg>`,
  },
  launch: {
    title: "新品专题页：左文右图非对称更利于聚焦导流",
    desc: "左侧标题与按钮紧实聚合、右侧大幅产品视觉放开留白，比传统中轴堆叠更能一眼分出主次，也更契合宽屏浏览。",
    asym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#071D52"/>
        <rect x="38" y="72" width="146" height="24" fill="#FABD19"/>
        <rect x="38" y="108" width="124" height="10" fill="#F7F0DC"/>
        <rect x="38" y="128" width="142" height="8" fill="#F7F0DC" opacity="0.8"/>
        <rect x="38" y="164" width="102" height="32" fill="#E63514"/>
        <circle cx="348" cy="186" r="92" fill="#FABD19"/>
        <rect x="298" y="146" width="98" height="82" fill="#0B0A08"/>
        <rect x="314" y="162" width="66" height="44" fill="#E63514"/>
      </svg>`,
    sym: `
      <svg viewBox="0 0 480 360" aria-hidden="true">
        <rect width="480" height="360" fill="#071D52"/>
        <rect x="160" y="38" width="160" height="20" fill="#FABD19"/>
        <rect x="180" y="68" width="120" height="8" fill="#F7F0DC"/>
        <circle cx="240" cy="186" r="70" fill="#FABD19"/>
        <rect x="200" y="156" width="80" height="60" fill="#0B0A08"/>
        <rect x="212" y="168" width="56" height="34" fill="#E63514"/>
        <rect x="190" y="284" width="100" height="30" fill="#E63514"/>
      </svg>`,
  },
};

export function initSection6Curtain() {
  const stage = document.getElementById("s6-stage");
  const symLayer = document.getElementById("s6-sym-layer");
  const asymLayer = document.getElementById("s6-asym-layer");
  const divider = document.getElementById("s6-divider");
  const range = document.getElementById("s6-range");
  const verdict = document.getElementById("s6-verdict");
  const tabs = [...document.querySelectorAll(".ct-tab")];

  let pct = Number(range.value);

  function setPct(v) {
    pct = Math.max(8, Math.min(92, Math.round(v)));
    range.value = String(pct);
    asymLayer.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = `${pct}%`;
  }

  function loadScene(id) {
    const s = SCENES_6[id] || SCENES_6.festival;
    symLayer.innerHTML = s.sym;
    asymLayer.innerHTML = s.asym;
    verdict.innerHTML = `<strong>${s.title}</strong><p>${s.desc}</p>`;
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const o of tabs) o.setAttribute("aria-selected", o === tab ? "true" : "false");
      loadScene(tab.dataset.scene);
    });
  }

  range.addEventListener("input", () => setPct(Number(range.value)));

  // 支持直接在舞台横向拖拉中缝
  let dragging = false;
  const updateFromClientX = (clientX) => {
    const rect = stage.getBoundingClientRect();
    setPct(((clientX - rect.left) / Math.max(1, rect.width)) * 100);
  };
  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    updateFromClientX(e.clientX);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) updateFromClientX(e.clientX);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  loadScene("festival");
  setPct(pct);
}

// ============================================================
// 07 节：严格单变量四选一小练习（全部由 model.js 实时算出）
// ============================================================
export function initSection7Quiz() {
  const grid = document.getElementById("quiz-grid");
  const titleEl = document.getElementById("qv-title");
  const descEl = document.getElementById("qv-desc");
  const breakdownEl = document.getElementById("qv-breakdown");
  const retryBtn = document.getElementById("quiz-retry");

  const evals = getAllQuizEvaluations();
  const correctEval = evals.find((e) => e.isCorrect);

  // 根据 model.js 严格生成四张 3:4 展览海报（唯一变量：左下群青辅块面积；四版中心点完全锁死）
  function buildPosterSvg(ev) {
    const baseW = 58;
    const baseH = 44;
    const bw = Math.round(baseW * ev.sizeScale);
    const bh = Math.round(baseH * ev.sizeScale);
    const cx = 56;
    const cy = 212;
    const rx = +(cx - bw / 2).toFixed(1);
    const ry = +(cy - bh / 2).toFixed(1);

    // 紧贴群青块内部的紧凑展期细行（随块缩放但始终保持同样式）
    const lineW1 = Math.max(10, Math.round(bw * 0.62));
    const lineW2 = Math.max(8, Math.round(bw * 0.44));

    return `
      <svg viewBox="0 0 210 280" aria-hidden="true">
        <rect width="210" height="280" fill="#FABD19"/>
        <line x1="105" y1="12" x2="105" y2="268" stroke="#0B0A08" stroke-width="1" stroke-dasharray="3 5" opacity="0.28"/>
        <!-- 锁定：左上粗黑标题 -->
        <rect x="18" y="24" width="76" height="16" fill="#0B0A08"/>
        <rect x="18" y="46" width="54" height="7" fill="#0B0A08"/>
        <rect x="18" y="60" width="32" height="3" fill="#0B0A08"/>
        <!-- 锁定：右上朱红大圆 -->
        <circle cx="154" cy="82" r="44" fill="#E63514"/>
        <!-- 唯一变量：左下冷群青直角辅块面积 -->
        <rect x="${rx}" y="${ry}" width="${bw}" height="${bh}" fill="#022D90"/>
        <rect x="${rx + Math.round(bw * 0.14)}" y="${ry + Math.round(bh * 0.34)}" width="${lineW1}" height="${Math.max(2.5, Math.round(bh * 0.09))}" fill="#F7F0DC"/>
        <rect x="${rx + Math.round(bw * 0.14)}" y="${ry + Math.round(bh * 0.56)}" width="${lineW2}" height="${Math.max(2, Math.round(bh * 0.07))}" fill="#FABD19"/>
      </svg>
    `;
  }

  grid.innerHTML = "";
  const cards = [];
  for (const ev of evals) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-card";
    btn.dataset.pick = ev.key;
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `
      ${buildPosterSvg(ev)}
      <div class="quiz-foot">
        <span class="q-letter" lang="en">${ev.key}</span>
        <span class="q-reveal">${ev.tier.label}</span>
      </div>
    `;
    grid.append(btn);
    cards.push(btn);
  }

  function reveal(pickKey) {
    const picked = evals.find((e) => e.key === pickKey);
    if (!picked) return;

    grid.classList.add("is-revealed");
    retryBtn.hidden = false;

    for (const card of cards) {
      const k = card.dataset.pick;
      const ev = evals.find((e) => e.key === k);
      card.setAttribute("aria-pressed", k === pickKey ? "true" : "false");
      card.classList.toggle("is-picked", k === pickKey);
      card.classList.toggle("is-correct", Boolean(ev.isCorrect));
      card.classList.toggle("is-wrong", !ev.isCorrect);
    }

    if (picked.isCorrect) {
      titleEl.textContent = `判断精准：方案 ${picked.key} 刚好达成非对称视觉持平`;
      descEl.textContent = picked.explain;
    } else {
      titleEl.textContent = `方案 ${picked.key} 偏离了平衡（${picked.tier.label}），正确答案是方案 ${correctEval.key}`;
      descEl.textContent = `${picked.explain} 对比看看方案 ${correctEval.key}：${correctEval.explain}`;
    }

    breakdownEl.hidden = false;
    breakdownEl.innerHTML = evals
      .map(
        (ev) => `
          <div class="qv-item${ev.isCorrect ? " is-right" : ""}">
            <div class="qv-item-top">
              <b>方案 ${ev.key} · ${ev.tier.label}</b>
              <span>左 ${dotsText(ev.leftDots)} / 右 ${dotsText(ev.rightDots)}</span>
            </div>
            <div>${ev.explain}</div>
          </div>
        `
      )
      .join("");
  }

  function reset() {
    grid.classList.remove("is-revealed");
    retryBtn.hidden = true;
    breakdownEl.hidden = true;
    breakdownEl.innerHTML = "";
    for (const card of cards) {
      card.setAttribute("aria-pressed", "false");
      card.classList.remove("is-picked", "is-correct", "is-wrong");
    }
    titleEl.textContent = "先凭直觉点选 A / B / C / D 中的一版。";
    descEl.textContent =
      "选完后会用开场同一套视觉重量模型亮出四版的左右重量刻点与平衡档位，帮你核对每一档为什么太轻、刚好或太重。";
  }

  for (const card of cards) {
    card.addEventListener("click", () => reveal(card.dataset.pick));
  }
  retryBtn.addEventListener("click", reset);
}

// ============================================================
// 08 节：原海报放大拖动灯箱（复用 #poster.src，不重复内联图片）
// ============================================================
export function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbViewport = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-zoom-reset");
  const btnClose = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    btnReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    btnClose.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbViewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.75, Math.min(3.5, +(scale - e.deltaY * 0.0018).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  lbViewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbViewport.classList.add("is-grabbing");
    try { lbViewport.setPointerCapture(e.pointerId); } catch {}
  });
  lbViewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endGrab = () => {
    dragging = false;
    lbViewport.classList.remove("is-grabbing");
  };
  lbViewport.addEventListener("pointerup", endGrab);
  lbViewport.addEventListener("pointercancel", endGrab);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
