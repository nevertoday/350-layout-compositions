// 024 平行线构图 — 第 01 至 07 节所有交互实验与单变量练习
import { pixelRatio } from "../../lib/stage.js";
import { clamp, computeModel, geometricPositions } from "./model.js";

function prepCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, Math.round(rect.width));
  const h = Math.max(90, Math.round(rect.height));
  const dpr = pixelRatio(2);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ==================== SECTION 01: 格式塔方向熵实测 ====================
function initSec01() {
  const canvas = document.getElementById("s1-canvas");
  const slider = document.getElementById("s1-align");
  const valEl = document.getElementById("s1-align-val");
  const badgeEl = document.getElementById("s1-badge");
  const readoutEl = document.getElementById("s1-readout");
  if (!canvas || !slider) return () => {};

  // 固定 16 条线段种子（位置与初始杂乱偏角固定，确保每次重现一致）
  const seeds = [
    { u: 0.14, v: 0.22, a: -64 }, { u: 0.34, v: 0.19, a: 48 },  { u: 0.56, v: 0.21, a: -38 }, { u: 0.80, v: 0.23, a: 72 },
    { u: 0.18, v: 0.41, a: 55 },  { u: 0.40, v: 0.40, a: -78 }, { u: 0.62, v: 0.42, a: 33 },  { u: 0.84, v: 0.41, a: -46 },
    { u: 0.15, v: 0.61, a: -29 }, { u: 0.37, v: 0.60, a: 66 },  { u: 0.59, v: 0.59, a: -61 }, { u: 0.82, v: 0.62, a: 41 },
    { u: 0.20, v: 0.80, a: 75 },  { u: 0.43, v: 0.81, a: -52 }, { u: 0.66, v: 0.79, a: 28 },  { u: 0.86, v: 0.80, a: -69 },
  ];

  function draw() {
    const align = Number(slider.value) / 100; // 0..1
    const { ctx, w, h } = prepCanvas(canvas);
    ctx.fillStyle = "#060E17";
    ctx.fillRect(0, 0, w, h);

    // 计算当前真实 16 条线的角度与标准差 σ
    const angles = seeds.map((s) => s.a * (1 - align));
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((acc, a) => acc + (a - mean) ** 2, 0) / angles.length;
    const sigma = Math.sqrt(variance);

    // 在网格中平滑对齐成 4 行规整平行线束
    const segLen = clamp(w * (0.14 + align * 0.06), 36, 98);
    ctx.lineCap = "butt";
    seeds.forEach((s, i) => {
      const row = Math.floor(i / 4);
      const targetV = 0.20 + row * 0.20;
      const cx = s.u * w;
      const cy = (s.v * (1 - align) + targetV * align) * h;
      const rad = (angles[i] * Math.PI) / 180;
      const dx = Math.cos(rad) * segLen * 0.5;
      const dy = Math.sin(rad) * segLen * 0.5;

      ctx.strokeStyle = align > 0.88 ? "#8FA438" : "#80909C";
      ctx.lineWidth = align > 0.88 ? 2 : 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - dx, cy - dy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.stroke();
    });

    // 固定藏在 (0.68, 0.50) 的唯一异形焦点（酸绿小圆）——当背景齐平时立刻跳出
    const fx = w * 0.68;
    const fy = h * 0.50;
    ctx.fillStyle = "#C9DF4E";
    ctx.beginPath();
    ctx.arc(fx, fy, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 实测读数更新
    valEl.textContent = `${Math.round(align * 100)}% · 标准差 ${sigma.toFixed(1)}°`;
    if (align < 0.35) {
      badgeEl.textContent = "散乱态 · 16 个独立对象";
      readoutEl.textContent = `当前 16 根线段指向各异（角度标准差 ${sigma.toFixed(1)}°），大脑不得不逐条分辨，右侧酸绿圆点埋在杂乱斜线里难以一眼跳出。`;
    } else if (align < 0.85) {
      badgeEl.textContent = "过渡态 · 正在成群归组";
      readoutEl.textContent = `角度标准差收窄到 ${sigma.toFixed(1)}°，部分线条已经开始呼应，但残余歪斜仍在干扰视线；继续推到 95% 以上看秩序如何锁定。`;
    } else {
      badgeEl.textContent = "平行场 · 1 个统一整体";
      readoutEl.textContent = `角度标准差降至 ${sigma.toFixed(1)}°，格式塔「相似性 + 连续性」瞬间把 16 条线段打包成一片沉静背景——右侧那枚酸绿小圆点毫不费力就成了全场焦点。`;
    }
  }

  slider.addEventListener("input", draw);
  draw();
  return draw;
}

// ==================== SECTION 02: 三向平行与越界对照 ====================
function initSec02() {
  const canvas = document.getElementById("s2-canvas");
  const btns = [...document.querySelectorAll("[data-s2]")];
  const explainEl = document.getElementById("s2-explain");
  if (!canvas || !btns.length) return () => {};

  let mode = "h";
  const COPY = {
    h: {
      title: "水平平行：群组延伸，区别于单条地平线",
      html: '如果只靠一条海平线稳住天地，那是 <a href="https://layout.xiaoxiaodong.ai/021/play/" target="_blank" rel="noopener">021 水平构图</a> 的重点；024 平行线构图把多条水平线排成疏密有序的层叠序列，让平静多出一层「节拍与连绵延伸」。',
    },
    v: {
      title: "竖向平行：建筑柱列与挺拔节奏",
      html: '单根高耸竖轴强调升势与纪念碑感（见 <a href="https://layout.xiaoxiaodong.ai/022/play/" target="_blank" rel="noopener">022 垂直构图</a>）；当多根竖线严格等角排列——比如密斯的西格拉姆大厦青铜柱列——画面呈现的是理性、庄重的横向展开秩序。',
    },
    d: {
      title: "斜向平行：带着速度感的克制队列",
      html: '单条主斜轨主打俯冲张力（见 <a href="https://layout.xiaoxiaodong.ai/023/play/" target="_blank" rel="noopener">023 对角线构图</a>）；把一排彼此平行的斜线（如浮世绘骤雨、建筑楼梯扶手）统一起来，既有方向动势，又比杂乱斜线冷静得多。',
    },
    conv: {
      title: "越界警示：一旦向远处收拢，就成了 025 汇聚线构图",
      html: '广角仰拍或俯拍建筑时，原本平行的墙边会在画框内朝灭点收拢。此时平静延展感被强烈的纵深吸力替代，已经跨界进入 <a href="https://layout.xiaoxiaodong.ai/025/play/" target="_blank" rel="noopener">025 汇聚线构图</a>。',
    },
    cross: {
      title: "越界警示：叠入反方向线群，就成了 026 交叉线构图",
      html: '如果在有序的平行线阵中再叠入一组反向斜线，交点立刻成为视线碰撞区，宁静节奏转成冲突与编织张力——这属于 <a href="https://layout.xiaoxiaodong.ai/026/play/" target="_blank" rel="noopener">026 交叉线构图</a> 的领域。',
    },
  };

  function draw() {
    const { ctx, w, h } = prepCanvas(canvas);
    ctx.fillStyle = "#060E17";
    ctx.fillRect(0, 0, w, h);

    const pos = geometricPositions(11, 1.75);
    ctx.save();

    if (mode === "h") {
      pos.forEach((p, i) => {
        const y = h * (0.14 + p * 0.72);
        ctx.strokeStyle = i === 6 ? "#C9DF4E" : "#7F9438";
        ctx.lineWidth = i === 6 ? 2.5 : 1.4;
        ctx.beginPath();
        ctx.moveTo(w * 0.06, y);
        ctx.lineTo(w * 0.94, y);
        ctx.stroke();
      });
      // 极简建筑静块
      ctx.fillStyle = "#C6C9CB";
      ctx.fillRect(w * 0.60, h * (0.14 + pos[6] * 0.72) - 34, w * 0.18, 34);
      ctx.fillStyle = "#060E17";
      ctx.fillRect(w * 0.72, h * (0.14 + pos[6] * 0.72) - 18, 12, 18);
    } else if (mode === "v") {
      pos.forEach((p, i) => {
        const x = w * (0.10 + p * 0.80);
        ctx.strokeStyle = i === 4 ? "#C9DF4E" : "#7F9438";
        ctx.lineWidth = i === 4 ? 3 : 1.6;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.08);
        ctx.lineTo(x, h * 0.92);
        ctx.stroke();
      });
      // 横向低矮门槛锚
      ctx.fillStyle = "#C6C9CB";
      ctx.fillRect(w * 0.10, h * 0.72, w * 0.80, 14);
      ctx.fillStyle = "#C9DF4E";
      ctx.fillRect(w * 0.62, h * 0.56, 26, 40);
    } else if (mode === "d") {
      const ang = (-32 * Math.PI) / 180;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      pos.forEach((p, i) => {
        const offset = (p - 0.5) * h * 0.92;
        const cx = w * 0.5 - sin * offset;
        const cy = h * 0.5 + cos * offset;
        const len = w * 0.85;
        ctx.strokeStyle = i === 5 ? "#C9DF4E" : "#7F9438";
        ctx.lineWidth = i === 5 ? 2.5 : 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - cos * len, cy - sin * len);
        ctx.lineTo(cx + cos * len, cy + sin * len);
        ctx.stroke();
      });
      ctx.fillStyle = "#C6C9CB";
      ctx.fillRect(w * 0.64, h * 0.44, 42, 42);
    } else if (mode === "conv") {
      // 汇聚到右侧远端灭点
      const vx = w * 0.88;
      const vy = h * 0.50;
      pos.forEach((p, i) => {
        const y0 = h * (0.08 + p * 0.84);
        ctx.strokeStyle = i === 5 ? "#F27B5A" : "#B8664E";
        ctx.lineWidth = i === 5 ? 2.2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(w * 0.06, y0);
        ctx.lineTo(vx, vy);
        ctx.stroke();
      });
      ctx.strokeStyle = "#F27B5A";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(vx, vy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#F27B5A";
      ctx.font = '700 12px "Space Mono", "Noto Sans SC", monospace';
      ctx.fillText("灭点 · 025 汇聚线", vx - 134, vy - 18);
    } else {
      // 交叉线
      pos.slice(0, 8).forEach((p, i) => {
        const off = (p - 0.5) * h * 0.85;
        ctx.strokeStyle = "#8FA438";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.06, h * 0.68 + off * 0.6);
        ctx.lineTo(w * 0.94, h * 0.24 + off * 0.6);
        ctx.stroke();

        ctx.strokeStyle = "#F27B5A";
        ctx.beginPath();
        ctx.moveTo(w * 0.06, h * 0.24 + off * 0.6);
        ctx.lineTo(w * 0.94, h * 0.68 + off * 0.6);
        ctx.stroke();
      });
      ctx.fillStyle = "#F27B5A";
      ctx.font = '700 12px "Space Mono", "Noto Sans SC", monospace';
      ctx.fillText("交错冲撞 · 026 交叉线", 16, 26);
    }

    // 右下角角度标记
    const tag =
      mode === "h" ? "夹角差 0.0° · 水平平行"
      : mode === "v" ? "夹角差 0.0° · 竖向平行"
      : mode === "d" ? "夹角差 0.0° · 32° 斜向平行"
      : mode === "conv" ? "夹角差 ≠ 0° · 已成汇聚线"
      : "两组异向相交 · 已成交叉线";
    ctx.font = '700 12px "Space Mono", "Noto Sans SC", monospace';
    const tw = ctx.measureText(tag).width + 18;
    ctx.fillStyle = "rgba(6, 14, 23, 0.88)";
    ctx.fillRect(14, h - 36, tw, 24);
    ctx.strokeStyle = mode === "conv" || mode === "cross" ? "#F27B5A" : "#B4CC3B";
    ctx.strokeRect(14.5, h - 35.5, tw - 1, 23);
    ctx.fillStyle = mode === "conv" || mode === "cross" ? "#F27B5A" : "#C9DF4E";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, 23, h - 23.5);
    ctx.restore();
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.s2;
      btns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      const info = COPY[mode];
      explainEl.innerHTML = `<h3>${info.title}</h3><p>${info.html}</p>`;
      draw();
    });
  });

  draw();
  return draw;
}

// ==================== SECTION 03: 平行音梳编排器 ====================
function initSec03() {
  const stage = document.getElementById("seq-stage");
  const presetBtns = [...document.querySelectorAll("[data-seq]")];
  const activeEl = document.getElementById("seq-active-count");
  const accentEl = document.getElementById("seq-accent-count");
  const ratioEl = document.getElementById("seq-ratio");
  const verdictEl = document.getElementById("seq-verdict");
  if (!stage) return () => {};

  const PRESETS = {
    even: {
      pos: geometricPositions(12, 1.0),
      modes: Array(12).fill("normal"),
    },
    grad: {
      pos: geometricPositions(12, 2.2),
      modes: ["normal", "normal", "accent", "normal", "normal", "normal", "accent", "normal", "normal", "normal", "normal", "normal"],
    },
    pair: {
      pos: [0, 0.055, 0.19, 0.245, 0.38, 0.435, 0.57, 0.625, 0.76, 0.815, 0.945, 1.0],
      modes: ["accent", "normal", "accent", "normal", "accent", "normal", "accent", "normal", "accent", "normal", "accent", "normal"],
    },
    stave: {
      pos: [0.02, 0.09, 0.17, 0.29, 0.37, 0.47, 0.59, 0.66, 0.75, 0.84, 0.91, 0.98],
      modes: ["normal", "accent", "normal", "muted", "normal", "accent", "normal", "normal", "muted", "accent", "normal", "normal"],
    },
  };

  let curPos = [...PRESETS.even.pos];
  let curModes = [...PRESETS.even.modes];
  const barEls = [];

  for (let i = 0; i < 12; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seq-bar-btn";
    btn.setAttribute("aria-label", `第 ${i + 1} 根平行线，点击切换普通、重拍酸绿或隐声休止`);
    btn.innerHTML = '<span class="seq-bar-line" aria-hidden="true"></span><span class="seq-bar-dot" aria-hidden="true"></span>';
    btn.addEventListener("click", () => {
      const order = ["normal", "accent", "muted"];
      curModes[i] = order[(order.indexOf(curModes[i]) + 1) % 3];
      render();
    });
    stage.appendChild(btn);
    barEls.push(btn);
  }

  function render() {
    const activePositions = [];
    let accentCount = 0;

    barEls.forEach((btn, i) => {
      const pct = 6 + curPos[i] * 88;
      const m = curModes[i];
      btn.style.left = `${pct.toFixed(2)}%`;
      btn.dataset.mode = m;
      const dot = btn.querySelector(".seq-bar-dot");
      if (dot) dot.style.top = `${26 + ((i * 19) % 44)}%`;
      if (m !== "muted") activePositions.push(curPos[i]);
      if (m === "accent") accentCount++;
    });

    activeEl.textContent = `${activePositions.length} / 12`;
    accentEl.textContent = String(accentCount);

    let ratio = 1.0;
    if (activePositions.length >= 3) {
      const gaps = [];
      for (let i = 1; i < activePositions.length; i++) {
        gaps.push(activePositions[i] - activePositions[i - 1]);
      }
      const minG = Math.min(...gaps);
      const maxG = Math.max(...gaps);
      ratio = maxG / Math.max(minG, 1e-4);
    }
    ratioEl.textContent = `${ratio.toFixed(2)}×`;

    if (activePositions.length < 4) {
      verdictEl.textContent = `只剩 ${activePositions.length} 根有效线条，队列已被抽空成零散立柱，先点亮几根恢复重复秩序。`;
    } else if (ratio < 1.18 && accentCount === 0) {
      verdictEl.textContent = "12 根立柱等宽、等距、等亮——像住宅楼外的防盗铁栅栏，只有机械重复，没有呼吸节拍。切「渐密渐疏」或点几根制造强弱休止。";
    } else if (ratio > 3.2) {
      verdictEl.textContent = `疏密极比达到 ${ratio.toFixed(2)}×，出现了明显的大段休止留白；若用于建筑或海报，记得让这段留白正好承托主体或标题。`;
    } else {
      verdictEl.textContent = `有效线 ${activePositions.length} 根、重拍 ${accentCount} 处、疏密极比 ${ratio.toFixed(2)}×——在严格平行的前提下出现了清晰的轻重呼吸，像五线谱上的平稳乐句。`;
    }
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.seq];
      if (!p) return;
      curPos = [...p.pos];
      curModes = [...p.modes];
      presetBtns.forEach((b) => {
        const act = b === btn;
        b.classList.toggle("is-active", act);
        b.setAttribute("aria-pressed", String(act));
      });
      render();
    });
  });

  render();
  return render;
}

// ==================== SECTION 04: 原海报三示例抽层透视 ====================
function initSec04() {
  const c1 = document.getElementById("s4-c1");
  const c2 = document.getElementById("s4-c2");
  const c3 = document.getElementById("s4-c3");
  const btns = [...document.querySelectorAll("[data-xray]")];
  const n1 = document.getElementById("s4-n1");
  const n2 = document.getElementById("s4-n2");
  const n3 = document.getElementById("s4-n3");
  if (!c1 || !c2 || !c3) return () => {};

  let layer = "full"; // "full" | "lines" | "anchor"

  function drawAll() {
    const showLines = layer === "full" || layer === "lines";
    const showAnchor = layer === "full" || layer === "anchor";

    // 示例一：帆影海面
    {
      const { ctx, w, h } = prepCanvas(c1);
      ctx.fillStyle = "#B4B6B7";
      ctx.fillRect(0, 0, w, h * 0.54);
      ctx.fillStyle = "#192028";
      ctx.fillRect(0, h * 0.54, w, h * 0.46);

      if (showLines) {
        const pos = geometricPositions(12, 1.85);
        pos.forEach((p, i) => {
          const y = h * (0.55 + p * 0.42);
          ctx.strokeStyle = i % 3 === 0 ? "#8B959E" : "#4E5964";
          ctx.lineWidth = i === 0 ? 1.8 : 1.2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        });
      }
      if (showAnchor) {
        // 极简双云 + 白色尖帆
        ctx.fillStyle = "#DFE2E4";
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.44);
        ctx.lineTo(w * 0.24, h * 0.37);
        ctx.lineTo(w * 0.34, h * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w * 0.66, h * 0.42);
        ctx.lineTo(w * 0.77, h * 0.35);
        ctx.lineTo(w * 0.87, h * 0.42);
        ctx.closePath();
        ctx.fill();

        const sx = w * 0.50;
        const sy = h * 0.54;
        ctx.fillStyle = "#0A1017";
        ctx.fillRect(sx - 14, sy - 3, 28, 4);
        ctx.fillStyle = "#F5F7F5";
        ctx.beginPath();
        ctx.moveTo(sx, sy - h * 0.25);
        ctx.lineTo(sx + 13, sy - 4);
        ctx.lineTo(sx - 2, sy - 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#C6CCD0";
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy - h * 0.20);
        ctx.lineTo(sx - 13, sy - 4);
        ctx.lineTo(sx - 3, sy - 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 示例二：建筑秩序（平行立面与三黑拱）
    {
      const { ctx, w, h } = prepCanvas(c2);
      ctx.fillStyle = "#8C9196";
      ctx.fillRect(0, 0, w, h);
      if (showLines) {
        for (let i = 0; i < 22; i++) {
          const y = h * (0.04 + (i / 21) * 0.88);
          ctx.strokeStyle = i % 2 === 0 ? "#4D5358" : "#B8BDC1";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
      if (showAnchor) {
        // 底部三座深黑半圆拱洞
        ctx.fillStyle = "#080E15";
        const archW = w * 0.21;
        const archH = h * 0.36;
        [0.19, 0.50, 0.81].forEach((u) => {
          const cx = u * w;
          const topY = h - archH;
          ctx.beginPath();
          ctx.arc(cx, topY + archW * 0.5, archW * 0.5, Math.PI, 0);
          ctx.lineTo(cx + archW * 0.5, h);
          ctx.lineTo(cx - archW * 0.5, h);
          ctx.closePath();
          ctx.fill();
        });
      }
    }

    // 示例三：廊道光门（暖灰平行线 + 孤立剪影 + 酸绿门）
    {
      const { ctx, w, h } = prepCanvas(c3);
      ctx.fillStyle = "#5F6351";
      ctx.fillRect(0, 0, w, h * 0.68);
      ctx.fillStyle = "#171D1E";
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      if (showLines) {
        for (let i = 0; i < 16; i++) {
          const y = h * (0.05 + (i / 15) * 0.60);
          ctx.strokeStyle = i % 3 === 0 ? "#C9C096" : "#8E8D70";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        const floorPos = geometricPositions(6, 1.75);
        floorPos.forEach((p) => {
          const y = h * (0.70 + p * 0.26);
          ctx.strokeStyle = "#A9BC3A";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        });
      }
      if (showAnchor) {
        // 右侧酸绿亮门
        ctx.fillStyle = "#9CB633";
        ctx.fillRect(w * 0.84, h * 0.30, w * 0.16, h * 0.38);
        // 左侧纯白行者背影剪影（无五官细节）
        const px = w * 0.24;
        const py = h * 0.72;
        ctx.fillStyle = "#EFF2EE";
        ctx.beginPath();
        ctx.arc(px, py - 34, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px - 4.5, py - 29);
        ctx.lineTo(px + 4.5, py - 29);
        ctx.lineTo(px + 6.5, py - 11);
        ctx.lineTo(px - 6.5, py - 11);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(px - 3.6, py - 11, 2.4, 11);
        ctx.fillRect(px + 1.2, py - 11, 2.4, 11);
      }
    }

    if (layer === "full") {
      n1.textContent = "低对比水平波纹横向铺满下半幅，一叶锐角白帆竖直切开海平线，让宁静有了落脚处。";
      n2.textContent = "水平百叶条纹统一整片建筑立面，底部三座深黑拱洞打破平直切片，稳住整栋体量的重心。";
      n3.textContent = "墙面与地面的平行水平线形成导向槽，把左侧孤立背影自然推向右侧高饱和酸绿门框。";
    } else if (layer === "lines") {
      n1.textContent = "抽掉白帆与云影后，画面只剩一片水平条纹底纹——安静还在，但视线找不到停留点。";
      n2.textContent = "抽掉底部三座黑拱后，立面退化成均质百叶铁皮，建筑体量感与重量感瞬间消失。";
      n3.textContent = "抽掉行者与酸绿门后，平行线槽失去终点，不再「引导视线」，只剩横纹墙面。";
    } else {
      n1.textContent = "抽掉平行波纹后，小帆孤零零浮在平涂黑块上，横向延展的浩渺海面气息立刻扁平。";
      n2.textContent = "抽掉立面平行线后，三座拱门像贴在空白灰板上的剪纸，少了建筑表皮的细腻秩序。";
      n3.textContent = "抽掉墙面与地面的平行导轨后，左侧行人与右侧绿门之间的空间联系大大削弱。";
    }
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      layer = btn.dataset.xray;
      btns.forEach((b) => {
        const act = b === btn;
        b.classList.toggle("is-active", act);
        b.setAttribute("aria-pressed", String(act));
      });
      drawAll();
    });
  });

  drawAll();
  return drawAll;
}

// ==================== SECTION 05: 保罗·兰德 1972 溢光实测 ====================
function initSec05() {
  const canvas = document.getElementById("s5-canvas");
  const polBtns = [...document.querySelectorAll("[data-polarity]")];
  const compBtn = document.getElementById("btn-irrad-comp");
  const readoutEl = document.getElementById("s5-readout");
  if (!canvas || !compBtn) return () => {};

  let polarity = "dark"; // "dark" | "light"
  let compensated = false;

  function draw() {
    const { ctx, w, h } = prepCanvas(canvas);
    const isDark = polarity === "dark";
    ctx.fillStyle = isDark ? "#060E17" : "#F5F7F4";
    ctx.fillRect(0, 0, w, h);

    // 左侧画几何 8 条平行色带，右侧画用 8 条平行线切出的大字「024」
    const barCount = 8;
    const topY = h * 0.16;
    const totalH = h * 0.64;
    const pitch = totalH / barCount;

    // 兰德 1972 补偿规则：深底亮条收细（42%），浅底深条加粗（56%），未补偿为严格 50%
    const barFrac = !compensated ? 0.50 : isDark ? 0.42 : 0.56;
    const barH = pitch * barFrac;
    const fg = isDark ? "#EEF2F0" : "#0B151E";
    const accent = isDark ? "#B4CC3B" : "#425606";

    // 左半：纯 8 条纹平行示范块
    const lx = w * 0.08;
    const lw = w * 0.34;
    for (let i = 0; i < barCount; i++) {
      const y = topY + i * pitch + (pitch - barH) * 0.5;
      ctx.fillStyle = i === 3 || i === 4 ? accent : fg;
      ctx.fillRect(lx, y, lw, barH);
    }

    // 右半：用 8 条平行色带精绘几何「IBM」（严格对齐 8 条横带且绝不越界撞到左栏）
    const rx = w * 0.48;
    const rw = w * 0.45;
    const gapH = pitch * (1 - barFrac);
    const drawStripedIBM = () => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, topY, rw, totalH);
      ctx.clip();

      // 精确等高几何三字母：I（占 18% 宽）、B（占 35% 宽）、M（占 39% 宽），间距 4%
      const pad = rw * 0.04;
      const wI = rw * 0.18;
      const wB = rw * 0.35;
      const wM = rw * 0.39;
      const xI = rx;
      const xB = xI + wI + pad;
      const xM = xB + wB + pad;

      ctx.fillStyle = fg;
      // I（上下衬线块 + 中柱）
      ctx.fillRect(xI, topY, wI, pitch * 2);
      ctx.fillRect(xI + wI * 0.25, topY + pitch * 2, wI * 0.5, pitch * 4);
      ctx.fillRect(xI, topY + pitch * 6, wI, pitch * 2);

      // B（左竖柱 + 上下两个几何圆角肚子）
      ctx.fillRect(xB, topY, wB * 0.72, totalH);
      ctx.beginPath();
      ctx.arc(xB + wB * 0.68, topY + totalH * 0.26, totalH * 0.26, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(xB + wB * 0.70, topY + totalH * 0.73, totalH * 0.27, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      // 挖空 B 的两个内腔与腰部缺口
      ctx.fillStyle = isDark ? "#060E17" : "#F5F7F4";
      ctx.fillRect(xB + wB * 0.34, topY + pitch * 1.9, wB * 0.34, pitch * 1.4);
      ctx.fillRect(xB + wB * 0.34, topY + pitch * 4.7, wB * 0.38, pitch * 1.4);
      ctx.fillRect(xB + wB * 0.80, topY + pitch * 3.6, wB * 0.24, pitch * 0.8);

      // M（左右竖柱 + 中间 V 折臂）
      ctx.fillStyle = fg;
      ctx.fillRect(xM, topY, wM * 0.25, totalH);
      ctx.fillRect(xM + wM * 0.75, topY, wM * 0.25, totalH);
      ctx.beginPath();
      ctx.moveTo(xM + wM * 0.18, topY);
      ctx.lineTo(xM + wM * 0.35, topY);
      ctx.lineTo(xM + wM * 0.50, topY + totalH * 0.52);
      ctx.lineTo(xM + wM * 0.65, topY);
      ctx.lineTo(xM + wM * 0.82, topY);
      ctx.lineTo(xM + wM * 0.56, topY + totalH * 0.82);
      ctx.lineTo(xM + wM * 0.44, topY + totalH * 0.82);
      ctx.closePath();
      ctx.fill();

      // 用背景色切出严格 8 条等周期平行缝（与左侧 8 条示范块完全同高同相位）
      ctx.fillStyle = isDark ? "#060E17" : "#F5F7F4";
      for (let i = 0; i <= barCount; i++) {
        const gy = topY + i * pitch - gapH * 0.5;
        ctx.fillRect(rx - 2, gy, rw + 4, gapH);
      }
      ctx.restore();
    };
    drawStripedIBM();

    // 底部精确占空比标注
    const ratioLabel = `条宽 ${Math.round(barFrac * 100)}% · 缝宽 ${Math.round((1 - barFrac) * 100)}%`;
    ctx.font = '700 12px "Space Mono", "Noto Sans SC", monospace';
    ctx.fillStyle = isDark ? "#C9DF4E" : "#425606";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(ratioLabel, lx, h - 10);

    const modeLabel = compensated ? "兰德光学补偿版" : "几何 1:1 等宽版";
    ctx.textAlign = "right";
    ctx.fillStyle = isDark ? "#B9C5CE" : "#344450";
    ctx.fillText(modeLabel, w - w * 0.07, h - 10);

    if (isDark && !compensated) {
      readoutEl.textContent = "深底亮条几何 1:1 等宽（50% / 50%）：受人眼「亮区溢光」影响，亮白条看起来比黑色间隙明显偏胖、略显拥挤。";
    } else if (isDark && compensated) {
      readoutEl.textContent = "深底亮条启用视觉补偿（亮条收细至 42%、暗缝拓宽至 58%）：抵消溢光后，黑缝重新通透，条与缝看上去反而正好 1:1 平衡。";
    } else if (!isDark && !compensated) {
      readoutEl.textContent = "浅底深条几何 1:1 等宽（50% / 50%）：白色亮缝向外溢光，反而把黑色平行条「吃瘦」了一圈。";
    } else {
      readoutEl.textContent = "浅底深条启用视觉补偿（深条略增至 56%、白缝收窄至 44%）：抵消白缝溢光，8 条横纹扎实有力，正反色视觉重量达成一致。";
    }
  }

  polBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      polarity = btn.dataset.polarity;
      polBtns.forEach((b) => {
        const act = b === btn;
        b.classList.toggle("is-active", act);
        b.setAttribute("aria-pressed", String(act));
      });
      draw();
    });
  });

  compBtn.addEventListener("click", () => {
    compensated = !compensated;
    compBtn.setAttribute("aria-pressed", String(compensated));
    compBtn.textContent = `开启兰德视觉补偿：${compensated ? "开" : "关"}`;
    draw();
  });

  draw();
  return draw;
}

// ==================== SECTION 06: Wilkins 1984 栅格眩晕实测 ====================
function initSec06() {
  const swCanvas = document.getElementById("s6-swatch");
  const cvCanvas = document.getElementById("s6-curve");
  const freqIn = document.getElementById("s6-freq");
  const conIn = document.getElementById("s6-contrast");
  const dutyIn = document.getElementById("s6-duty");
  const freqVal = document.getElementById("s6-freq-val");
  const conVal = document.getElementById("s6-contrast-val");
  const dutyVal = document.getElementById("s6-duty-val");
  const pill = document.getElementById("s6-risk-pill");
  const verdict = document.getElementById("s6-verdict");
  if (!swCanvas || !cvCanvas || !freqIn) return () => {};

  // 示意视觉压力函数（依据 Wilkins 1984 结论：峰值位于 ~3 cpd，随反差与占空比向 50% 升高而增强）
  function stressAt(cpd, contrast01, duty01) {
    const logDist = Math.log2(cpd / 3.0);
    const freqFactor = Math.exp(-(logDist * logDist) / 0.85);
    const dutyFactor = Math.sin(Math.PI * clamp(duty01, 0.05, 0.5));
    return clamp(freqFactor * contrast01 * dutyFactor, 0, 1);
  }

  function draw() {
    const cpd = Number(freqIn.value);
    const contrast = Number(conIn.value) / 100;
    const duty = Number(dutyIn.value) / 100;

    freqVal.textContent = `${cpd.toFixed(1)} cpd`;
    conVal.textContent = `${Math.round(contrast * 100)}%`;
    dutyVal.textContent = duty >= 0.46 ? `${Math.round(duty * 100)}%（等宽）` : `${Math.round(duty * 100)}%（细线）`;

    const stress = stressAt(cpd, contrast, duty);

    // 1. 局部安全预览窗
    {
      const { ctx, w, h } = prepCanvas(swCanvas);
      const baseLum = 14;
      const hiLum = Math.round(baseLum + contrast * 232);
      ctx.fillStyle = `rgb(${baseLum}, ${baseLum + 6}, ${baseLum + 12})`;
      ctx.fillRect(0, 0, w, h);

      // 映射到局部窗口周期（避免真实引发严重不适，保留直观疏密与反差感）
      const cycles = clamp(cpd * 3.8, 2.5, 28);
      const period = h / cycles;
      const stripeH = Math.max(1, period * duty);
      ctx.fillStyle = `rgb(${hiLum}, ${Math.min(255, hiLum + 8)}, ${Math.max(baseLum, hiLum - 18)})`;
      for (let y = 0; y < h; y += period) {
        ctx.fillRect(0, y, w, stripeH);
      }

      // 若频率很高（>4.8 cpd）且高反差，叠加局部像素采样莫尔提示标签
      if (cpd >= 4.8 && contrast >= 0.6) {
        ctx.fillStyle = "rgba(6, 14, 23, 0.86)";
        ctx.fillRect(8, h - 28, 170, 20);
        ctx.fillStyle = "#F27B5A";
        ctx.font = '700 11px "Space Mono", "Noto Sans SC", monospace';
        ctx.textBaseline = "middle";
        ctx.fillText("小屏缩放易生莫尔干涉", 14, h - 18);
      }
    }

    // 2. Wilkins (1984) 示意压力曲线
    {
      const { ctx, w, h } = prepCanvas(cvCanvas);
      ctx.fillStyle = "#040A11";
      ctx.fillRect(0, 0, w, h);

      const padL = 32;
      const padR = 14;
      const padT = 18;
      const padB = 26;
      const pw = w - padL - padR;
      const ph = h - padT - padB;

      // 2-4 cpd 敏感带浅底提示
      const xOf = (f) => padL + ((f - 0.5) / 7.0) * pw;
      const yOf = (s) => padT + (1 - s) * ph;
      ctx.fillStyle = "rgba(224, 94, 62, 0.16)";
      ctx.fillRect(xOf(2.0), padT, xOf(4.2) - xOf(2.0), ph);

      // 坐标轴
      ctx.strokeStyle = "#324454";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + ph);
      ctx.lineTo(padL + pw, padT + ph);
      ctx.stroke();

      // 曲线
      ctx.strokeStyle = "#B4CC3B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 70; i++) {
        const f = 0.5 + (i / 70) * 7.0;
        const s = stressAt(f, contrast, duty);
        const x = xOf(f);
        const y = yOf(s);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 当前点
      const cx = xOf(cpd);
      const cy = yOf(stress);
      ctx.strokeStyle = "rgba(238, 242, 240, 0.35)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, padT + ph);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = stress >= 0.6 ? "#F27B5A" : stress >= 0.32 ? "#F0CA6E" : "#C9DF4E";
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // 刻度文字
      ctx.fillStyle = "#93A6B5";
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.textBaseline = "top";
      ctx.fillText("0.5", xOf(0.5) - 6, padT + ph + 6);
      ctx.fillStyle = "#F27B5A";
      ctx.fillText("3.0 cpd", xOf(3.0) - 20, padT + ph + 6);
      ctx.fillStyle = "#93A6B5";
      ctx.fillText("7.5", xOf(7.5) - 16, padT + ph + 6);
      ctx.fillStyle = "#F2A08A";
      ctx.fillText("敏感峰", xOf(2.45), padT + ph - 16);
    }

    if (stress >= 0.6) {
      pill.dataset.risk = "high";
      pill.textContent = "高视觉压力警示";
      verdict.classList.remove("is-safe");
      verdict.textContent = `反差 ${Math.round(contrast * 100)}% + 占空比 ${Math.round(duty * 100)}% + ${cpd.toFixed(1)} cpd：落在 Wilkins（1984）指出的视觉不适高危区。别拿这种等宽强反差条纹当正文或大面积背景，请把反差降到 40% 以下或把线宽收细到 15% 左右。`;
    } else if (stress >= 0.32) {
      pill.dataset.risk = "mid";
      pill.textContent = "中度压迫 · 需克制面积";
      verdict.classList.remove("is-safe");
      verdict.textContent = `当前组合已有一定视觉紧绷感（示意压迫中档）：适合小面积局部装饰，但不宜整屏满铺或压在长文底下。`;
    } else {
      pill.dataset.risk = "low";
      pill.textContent = "舒缓安全区";
      verdict.classList.add("is-safe");
      verdict.textContent = `线宽克制、反差柔和或避开 3 cpd 峰值：条纹已退入安静的秩序层，像 024 原海报那样既保留平行延伸感，又不刺眼、不起莫尔颤动。`;
    }
  }

  [freqIn, conIn, dutyIn].forEach((el) => el.addEventListener("input", draw));
  draw();
  return draw;
}

// ==================== SECTION 07: 单变量小练习 ====================
function initSec07() {
  const promptEl = document.getElementById("quiz-prompt");
  const feedbackEl = document.getElementById("quiz-feedback");
  const tabBtns = [...document.querySelectorAll("[data-quiz]")];
  const optBtns = [...document.querySelectorAll(".quiz-option")];
  const canvases = [0, 1, 2, 3].map((i) => document.getElementById(`q-canvas-${i}`));
  if (!promptEl || canvases.some((c) => !c)) return () => {};

  const QUIZZES = [
    {
      prompt: '第 1 题（共 2 题）：以下四幅建筑海报构图里，角度、主体落位与配色完全一致，<strong>只差平行线的数量与间距分布这一个变量</strong>。挑出秩序最稳、呼吸最自然的一版：',
      answer: 1,
      options: [
        {
          state: { scene: "pavilion", orient: "horizontal", divergence: 0, lineCount: 34, spacingGrad: 0.0, anchorOn: true, anchorU: 0.68, cadenceOn: false },
          reason: "方案 A 排了 34 条 1:1 机械等距极密线，像密集铁栅栏一样压迫且逼近视觉炫光区，失去舒缓呼吸。",
        },
        {
          state: { scene: "pavilion", orient: "horizontal", divergence: 0, lineCount: 14, spacingGrad: 0.44, anchorOn: true, anchorU: 0.68, cadenceOn: true },
          reason: "方案 B 正确：14 条 0° 平行线落在 9–20 条经验舒适带，以约 1.9× 渐疏比自水面向天际自然舒展，与灰白静屋形成清晰呼吸。",
        },
        {
          state: { scene: "pavilion", orient: "horizontal", divergence: 0, lineCount: 4, spacingGrad: 0.35, anchorOn: true, anchorU: 0.68, cadenceOn: false },
          reason: "方案 C 只放了 4 条稀疏横线，线条太少无法通过格式塔重复聚合成统一的平行韵律场。",
        },
        {
          state: { scene: "pavilion", orient: "horizontal", divergence: 0, lineCount: 14, spacingGrad: 0.98, anchorOn: true, anchorU: 0.68, cadenceOn: false },
          reason: "方案 D 疏密比拉爆到 3.7× 以上，下半部挤死、上半部大段空断，整体延展连贯感被生生扯裂。",
        },
      ],
    },
    {
      prompt: '第 2 题（共 2 题）：以下四幅廊道平行构图里，线条数量、疏密渐变与配色完全一致，<strong>只差方向齐平度与破局锚点位置</strong>。挑出构图最成立的一版：',
      answer: 3,
      options: [
        {
          state: { scene: "corridor", orient: "horizontal", divergence: 12.5, lineCount: 14, spacingGrad: 0.42, anchorOn: true, anchorU: 0.28, cadenceOn: true },
          reason: "方案 A 的线条向右扇形汇聚了 12.5°，已经滑向 025 汇聚线构图，破坏了平行线的平静稳定感。",
        },
        {
          state: { scene: "corridor", orient: "horizontal", divergence: 0, lineCount: 14, spacingGrad: 0.42, anchorOn: false, anchorU: 0.28, cadenceOn: true },
          reason: "方案 B 删掉了唯一的行者锚点，整片平行廊道缺少叙事落脚点，容易流于空洞墙纸。",
        },
        {
          state: { scene: "corridor", orient: "horizontal", divergence: 0, lineCount: 14, spacingGrad: 0.42, anchorOn: true, anchorU: 0.06, cadenceOn: true },
          reason: "方案 C 把行者挤到最左 6% 贴边位置，主体刚入镜就被画框边缘切紧，发憋失衡。",
        },
        {
          state: { scene: "corridor", orient: "horizontal", divergence: 0, lineCount: 14, spacingGrad: 0.42, anchorOn: true, anchorU: 0.28, cadenceOn: true },
          reason: "方案 D 正确：线束保持 0.0° 严格平行且有渐疏呼吸，行者稳落左侧 28% 呼吸区，顺着平行槽道自然望向右侧酸绿光门。",
        },
      ],
    },
  ];

  let curQuiz = 0;
  let picked = null;

  function drawMiniScene(canvas, st) {
    const { ctx, w, h } = prepCanvas(canvas);
    const model = computeModel(st);
    ctx.fillStyle = "#060E17";
    ctx.fillRect(0, 0, w, h);

    if (st.scene === "corridor") {
      ctx.fillStyle = "#97B230";
      ctx.fillRect(w * 0.80, model.seam * h - h * 0.36, w * 0.12, h * 0.36);
    } else {
      ctx.fillStyle = "#B4CC3B";
      ctx.beginPath();
      ctx.arc(w * 0.84, h * 0.18, Math.min(w, h) * 0.085, 0, Math.PI * 2);
      ctx.fill();
    }

    // 线段
    model.lines.forEach((l) => {
      ctx.strokeStyle = l.isHorizon ? "#C9DF4E" : l.zone === "main" ? (st.scene === "corridor" ? "#A7A578" : "#809434") : "#485A69";
      ctx.lineWidth = l.isHorizon ? 2 : 1.1;
      ctx.globalAlpha = l.alpha;
      ctx.beginPath();
      ctx.moveTo(l.u1 * w, l.v1 * h);
      ctx.lineTo(l.u2 * w, l.v2 * h);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // 锚点
    if (st.anchorOn) {
      const seamY = model.seam * h;
      const ax = st.anchorU * w;
      if (st.scene === "pavilion") {
        const bw = w * 0.24;
        const bh = h * 0.17;
        ctx.fillStyle = "rgba(182, 186, 190, 0.24)";
        ctx.fillRect(ax - bw * 0.5, seamY + 1, bw, bh * 0.72);
        ctx.fillStyle = "#C6C9CB";
        ctx.fillRect(ax - bw * 0.5, seamY - bh, bw, bh);
        ctx.fillStyle = "#060E17";
        ctx.fillRect(ax + bw * 0.16, seamY - bh * 0.45, Math.max(5, bw * 0.1), bh * 0.45);
      } else {
        const fh = h * 0.24;
        ctx.fillStyle = "#EEF2F0";
        ctx.beginPath();
        ctx.arc(ax, seamY - fh * 0.84, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ax - 3.5, seamY - fh * 0.72, 7, fh * 0.46);
        ctx.fillRect(ax - 3, seamY - fh * 0.26, 2.2, fh * 0.26);
        ctx.fillRect(ax + 0.8, seamY - fh * 0.26, 2.2, fh * 0.26);
      }
    }
  }

  function renderQuiz() {
    const q = QUIZZES[curQuiz];
    promptEl.innerHTML = q.prompt;
    optBtns.forEach((btn, i) => {
      btn.classList.remove("is-correct", "is-wrong");
      if (picked !== null) {
        if (i === q.answer) btn.classList.add("is-correct");
        else if (i === picked) btn.classList.add("is-wrong");
      }
      drawMiniScene(canvases[i], q.options[i].state);
    });

    if (picked === null) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = "<p>点选上方任意一幅方案，系统会按本页几何准则拆解四版差异。</p>";
    } else {
      const ok = picked === q.answer;
      const letters = ["A", "B", "C", "D"];
      feedbackEl.className = `quiz-feedback ${ok ? "is-correct" : "is-wrong"}`;
      feedbackEl.innerHTML = `
        <p><strong>${ok ? `判断准确！答案是方案 ${letters[q.answer]}。` : `你选了方案 ${letters[picked]}，最稳的一版是方案 ${letters[q.answer]}。`}</strong></p>
        <p>${q.options[picked].reason}</p>
        ${ok ? "" : `<p>${q.options[q.answer].reason}</p>`}
      `;
    }
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      curQuiz = Number(btn.dataset.quiz);
      picked = null;
      tabBtns.forEach((b) => {
        const act = b === btn;
        b.classList.toggle("is-active", act);
        b.setAttribute("aria-pressed", String(act));
      });
      renderQuiz();
    });
  });

  optBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      picked = Number(btn.dataset.opt);
      renderQuiz();
    });
  });

  renderQuiz();
  return renderQuiz;
}

export function initSections() {
  const redraws = [
    initSec01(),
    initSec02(),
    initSec03(),
    initSec04(),
    initSec05(),
    initSec06(),
    initSec07(),
  ];

  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => redraws.forEach((fn) => fn && fn()), 80);
  });
}
