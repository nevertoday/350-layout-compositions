// 01–08 各节独立互动模块（相邻两节绝不重复同一种交互控件）
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  COLS,
  ROWS,
  POSTER_BREAK,
  PALETTE,
  THRESHOLD_TOTAL,
  evaluateThreshold,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/* ============================================================
   01 节 · 前注意寻靶实测（真实反应毫秒对比）
   ============================================================ */
function initPopoutLab() {
  const board = document.getElementById("popout-board");
  const btnRep = document.getElementById("pop-mode-rep");
  const btnMix = document.getElementById("pop-mode-mix");
  const btnStart = document.getElementById("pop-start");
  const outRep = document.getElementById("pop-time-rep");
  const outMix = document.getElementById("pop-time-mix");
  const msg = document.getElementById("pop-msg");
  if (!board) return;

  const COUNT = 48;
  let mode = "rep"; // "rep" | "mix"
  let targetIdx = 20;
  let startedAt = performance.now();
  let solved = false;
  let bestRep = null;
  let bestMix = null;

  const mixShapes = ["circle", "rect", "tri", "diamond"];
  const mixColors = ["#F2521D", "#2C597D", "#8A7621", "#2E2C29"];

  function pickTarget(prev) {
    // 避开最外四角的极偏位，确保每次靶位随机分布
    let next = Math.floor(Math.random() * COUNT);
    if (next === prev) next = (next + 11) % COUNT;
    return next;
  }

  function makeIcon(shape, color, isTarget) {
    const svg = svgEl("svg", { viewBox: "0 0 36 36", "aria-hidden": "true" });
    if (isTarget) {
      svg.appendChild(svgEl("circle", { cx: 18, cy: 18, r: 15.5, fill: PALETTE.vermilion }));
      return svg;
    }
    if (shape === "circle") {
      svg.appendChild(svgEl("circle", { cx: 18, cy: 18, r: 9.5, fill: color }));
    } else if (shape === "rect") {
      svg.appendChild(svgEl("rect", { x: 8, y: 8, width: 20, height: 20, fill: color }));
    } else if (shape === "tri") {
      svg.appendChild(svgEl("polygon", { points: "18,6 30,28 6,28", fill: color }));
    } else {
      svg.appendChild(svgEl("polygon", { points: "18,5 31,18 18,31 5,18", fill: color }));
    }
    return svg;
  }

  function updateSummary() {
    if (bestRep != null && bestMix != null) {
      const ratio = (bestMix / Math.max(1, bestRep)).toFixed(1);
      msg.textContent =
        bestMix > bestRep
          ? `实测对比：杂乱底盘耗时约是重复底盘的 ${ratio} 倍——背景越统一，破格目标越早被前注意通道抓出。`
          : `两轮都已完成！再多洗几轮感受：当背景同质时眼睛几乎不用逐个扫描。`;
    }
  }

  function renderBoard() {
    targetIdx = pickTarget(targetIdx);
    solved = false;
    startedAt = performance.now();
    board.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < COUNT; i++) {
      const isTarget = i === targetIdx;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "popout-cell";
      btn.dataset.idx = String(i);
      btn.setAttribute("aria-label", isTarget ? "目标大朱橘圆" : `干扰格 ${i + 1}`);
      const shape = mode === "rep" ? "circle" : mixShapes[(i * 3 + targetIdx) % mixShapes.length];
      const color = mode === "rep" ? PALETTE.vermilion : mixColors[(i * 5 + targetIdx) % mixColors.length];
      btn.appendChild(makeIcon(shape, color, isTarget));
      btn.addEventListener("click", () => {
        if (solved) return;
        if (isTarget) {
          solved = true;
          const ms = Math.max(80, Math.round(performance.now() - startedAt));
          btn.classList.add("is-hit");
          if (mode === "rep") {
            bestRep = ms;
            outRep.textContent = `${ms} 毫秒`;
            msg.textContent = `在重复底盘中用了 ${ms} 毫秒找到目标。切换「杂乱底盘」再测一次对比看看。`;
          } else {
            bestMix = ms;
            outMix.textContent = `${ms} 毫秒`;
            msg.textContent = `在杂乱底盘中用了 ${ms} 毫秒找到目标。`;
          }
          updateSummary();
        } else {
          btn.classList.add("is-miss");
          msg.textContent = "点到干扰格了——继续找那枚唯一放大的朱橘正圆。";
        }
      });
      frag.appendChild(btn);
    }
    board.appendChild(frag);
  }

  function setMode(next) {
    mode = next;
    btnRep.classList.toggle("is-active", mode === "rep");
    btnRep.setAttribute("aria-pressed", String(mode === "rep"));
    btnMix.classList.toggle("is-active", mode === "mix");
    btnMix.setAttribute("aria-pressed", String(mode === "mix"));
    msg.textContent =
      mode === "rep"
        ? "当前为重复底盘（47 枚同形小圆 + 1 枚大圆），点击目标大圆记录反应时间。"
        : "当前为杂乱底盘（四形四色混排 + 1 枚大朱橘圆），看看搜寻是不是慢了下来。";
    renderBoard();
  }

  btnRep.addEventListener("click", () => setMode("rep"));
  btnMix.addEventListener("click", () => setMode("mix"));
  btnStart.addEventListener("click", () => {
    msg.textContent = "已重新洗牌，请立即点击唯一那枚大朱橘圆。";
    renderBoard();
  });

  renderBoard();
}

/* ============================================================
   02 节 · 原海报四栏解剖切签 + SVG 透视图
   ============================================================ */
function initAnatomy() {
  const tabs = [...document.querySelectorAll("[data-anat]")];
  const titleEl = document.getElementById("anat-title");
  const bodyEl = document.getElementById("anat-body");
  const ruleEl = document.getElementById("anat-rule");
  const svg = document.getElementById("anatomy-svg");
  if (!svg || !tabs.length) return;

  const DATA = {
    unity: {
      title: "统一 UNITY · 用共同特征把个体拧成一家",
      body: "原海报里 68 枚小圆加上 1 枚大圆，全部共享同一种饱和朱橘与同一个几何正圆轮廓。哪怕大圆体积扩大了四格，依然一眼属于同一个家族，不会显得像外贴上去的补丁。",
      rule: "检验标准：遮掉内容文字，读者能否凭形、色或装饰符号认出它们出自同一套版面？",
    },
    rhythm: {
      title: "节奏 RHYTHM · 稳定的间隔给视线打拍子",
      body: "每两枚相邻圆点之间都留出约占单格宽度 20% 的相等空隙。眼睛扫过横行与竖列时像听见稳定节拍器：不拥挤粘连，也不至于散成无联系的孤点。",
      rule: "检验标准：圆与圆之间的空隙是否既让每枚圆独立透气，又足够近到连成整面阵列？",
    },
    emphasis: {
      title: "强化 EMPHASIS · 94% 的安静衬托 6% 的破格",
      body: "原海报将第 4–5 列、第 5–6 行的 4 格合为 1 枚大圆（占 72 格的 5.6%），并避开正中死点与四条外框边线。焦点不是喊出来的，是靠周围 68 枚小圆集体让位衬出来的。",
      rule: "检验标准：整组重复元素里是否只有 1 处克制的破格，且未啃破阵列外缘？",
    },
    order: {
      title: "秩序 ORDER · 正交行轴与边界锁住整体框",
      body: "9 条垂直中心轴与 8 条水平中心轴把 68 枚小圆精确锁在正交格网上，四边切出利落的矩形外轮廓，与上方标题和四栏灰线形成同一套瑞士网格纪律。",
      rule: "检验标准：沿上下左右四条最外切线拉直尺，阵列边缘是否干净齐整？",
    },
  };

  function drawSvg(mode) {
    svg.innerHTML = "";
    const ox = 38;
    const oy = 32;
    const step = 42;
    const rSmall = 16.4;

    // 纸底
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: 460, height: 400, fill: PALETTE.paper }));

    // 秩序模式：先画 9×8 正交轴与外切框
    if (mode === "order") {
      for (let c = 0; c < COLS; c++) {
        const x = ox + (c + 0.5) * step;
        svg.appendChild(svgEl("line", { x1: x, y1: oy - 12, x2: x, y2: oy + ROWS * step + 12, stroke: "#8F8A7F", "stroke-width": 1, "stroke-dasharray": "3 3" }));
      }
      for (let r = 0; r < ROWS; r++) {
        const y = oy + (r + 0.5) * step;
        svg.appendChild(svgEl("line", { x1: ox - 12, y1: y, x2: ox + COLS * step + 12, y2: y, stroke: "#8F8A7F", "stroke-width": 1, "stroke-dasharray": "3 3" }));
      }
      svg.appendChild(svgEl("rect", { x: ox + 4, y: oy + 4, width: COLS * step - 8, height: ROWS * step - 8, fill: "none", stroke: PALETTE.ink, "stroke-width": 2 }));
    }

    // 绘制 68 枚小圆
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c >= POSTER_BREAK.c && c <= POSTER_BREAK.c + 1 && r >= POSTER_BREAK.r && r <= POSTER_BREAK.r + 1) continue;
        const cx = ox + (c + 0.5) * step;
        const cy = oy + (r + 0.5) * step;
        let fill = PALETTE.vermilion;
        let opacity = 1;
        if (mode === "emphasis") {
          fill = "#D9CBB8";
        } else if (mode === "rhythm") {
          opacity = r === 1 ? 1 : 0.35;
        } else if (mode === "order") {
          opacity = c === 0 || c === COLS - 1 || r === 0 || r === ROWS - 1 ? 0.95 : 0.35;
        }
        svg.appendChild(svgEl("circle", { cx, cy, r: rSmall, fill, opacity }));
      }
    }

    // 绘制 2×2 破格大圆
    const bcx = ox + (POSTER_BREAK.c + 1) * step;
    const bcy = oy + (POSTER_BREAK.r + 1) * step;
    svg.appendChild(svgEl("circle", { cx: bcx, cy: bcy, r: 38.5, fill: PALETTE.vermilion, opacity: mode === "rhythm" ? 0.35 : 1 }));

    // 按当前模式叠加精准几何标注
    if (mode === "unity") {
      // 展示形状与色相共享关系：同心示意环 + 色样卡
      svg.appendChild(svgEl("circle", { cx: ox + 1.5 * step, cy: oy + 1.5 * step, r: rSmall + 4, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.6 }));
      svg.appendChild(svgEl("circle", { cx: bcx, cy: bcy, r: 42.5, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.6 }));
      svg.appendChild(svgEl("line", { x1: ox + 1.5 * step + 15, y1: oy + 1.5 * step + 15, x2: bcx - 30, y2: bcy - 30, stroke: PALETTE.ink, "stroke-width": 1.5, "stroke-dasharray": "4 3" }));
      const label = svgEl("text", { x: 230, y: 388, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 12, "font-weight": 700 });
      label.textContent = "68 枚小圆与 1 枚大圆共享同一几何圆廓与 #F2521D 朱橘印色";
      svg.appendChild(label);
    } else if (mode === "rhythm") {
      // 在第 2 行标出等步距节拍标尺
      const yLine = oy + 1.5 * step;
      for (let c = 0; c < COLS - 1; c++) {
        const x1 = ox + (c + 0.5) * step + rSmall;
        const x2 = ox + (c + 1.5) * step - rSmall;
        svg.appendChild(svgEl("line", { x1, y1: yLine - 22, x2, y2: yLine - 22, stroke: PALETTE.ink, "stroke-width": 2 }));
        svg.appendChild(svgEl("line", { x1, y1: yLine - 26, x2: x1, y2: yLine - 18, stroke: PALETTE.ink, "stroke-width": 1.5 }));
        svg.appendChild(svgEl("line", { x1: x2, y1: yLine - 26, x2: x2, y2: yLine - 18, stroke: PALETTE.ink, "stroke-width": 1.5 }));
      }
      const label = svgEl("text", { x: 230, y: 388, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 12, "font-weight": 700 });
      label.textContent = "等宽净隙（约 20% 格宽）构成稳定水平与垂直节拍";
      svg.appendChild(label);
    } else if (mode === "emphasis") {
      svg.appendChild(svgEl("circle", { cx: bcx, cy: bcy, r: 44, fill: "none", stroke: PALETTE.ink, "stroke-width": 2, "stroke-dasharray": "5 3" }));
      svg.appendChild(svgEl("rect", { x: ox + POSTER_BREAK.c * step, y: oy + POSTER_BREAK.r * step, width: step * 2, height: step * 2, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.2 }));
      const label = svgEl("text", { x: 230, y: 388, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 12, "font-weight": 700 });
      label.textContent = "退静 68 枚底盘（94.4%）→ 唯独 1 处 2×2 破格（5.6%）瞬间跳出";
      svg.appendChild(label);
    } else {
      const label = svgEl("text", { x: 230, y: 388, "text-anchor": "middle", fill: PALETTE.ink, "font-size": 12, "font-weight": 700 });
      label.textContent = "9×8 正交中心轴与齐整外框切线锁住整体版面秩序";
      svg.appendChild(label);
    }
  }

  function select(key) {
    for (const t of tabs) t.setAttribute("aria-selected", String(t.dataset.anat === key));
    const item = DATA[key];
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    ruleEl.textContent = item.rule;
    drawSvg(key);
  }

  for (const t of tabs) t.addEventListener("click", () => select(t.dataset.anat));
  select("unity");
}

/* ============================================================
   03 节 · 重复的六把抓手（5 独立基因复选 + 机械克隆陷阱）
   ============================================================ */
function initLevers() {
  const sheet = document.getElementById("program-sheet");
  const readout = document.getElementById("lever-readout");
  if (!sheet || !readout) return;

  const boxes = {
    color: document.getElementById("lv-color"),
    type: document.getElementById("lv-type"),
    rule: document.getElementById("lv-rule"),
    pad: document.getElementById("lv-pad"),
    frame: document.getElementById("lv-frame"),
    clone: document.getElementById("lv-clone"),
  };

  const titles = [...sheet.querySelectorAll(".prog-title")];
  const bodies = [...sheet.querySelectorAll(".prog-body")];

  function update() {
    const activeCount = ["color", "type", "rule", "pad", "frame"].filter((k) => boxes[k].checked).length;
    sheet.dataset.color = boxes.color.checked ? "1" : "0";
    sheet.dataset.type = boxes.type.checked ? "1" : "0";
    sheet.dataset.rule = boxes.rule.checked ? "1" : "0";
    sheet.dataset.pad = boxes.pad.checked ? "1" : "0";
    sheet.dataset.frame = boxes.frame.checked ? "1" : "0";

    const cloneOn = boxes.clone.checked;
    for (const el of titles) el.textContent = cloneOn ? el.dataset.clone : el.dataset.orig;
    for (const el of bodies) el.textContent = cloneOn ? el.dataset.clone : el.dataset.orig;

    const tokWrap = document.getElementById("program-tokens");
    if (tokWrap) {
      for (const k of ["color", "type", "rule", "pad", "frame"]) {
        const el = tokWrap.querySelector(`[data-tok="${k}"]`);
        if (el) el.classList.toggle("is-on", boxes[k].checked);
      }
      const cTok = tokWrap.querySelector(`[data-tok="clone"]`);
      if (cTok) cTok.classList.toggle("is-trap-on", cloneOn);
    }

    if (cloneOn) {
      readout.innerHTML =
        `<strong>警惕 · 机械复读（结构锁定 ${activeCount} / 5）</strong>` +
        `三则导览被强行改成了等长套话——重复应该管住「视觉容器与规则」，绝不能抹平「内容本身的个性差异」，否则读者一眼分不出三场活动有什么区别。`;
    } else if (activeCount === 0) {
      readout.innerHTML =
        `<strong>锁定 0 / 5 · 各自为政</strong>` +
        `色相、字阶、内距和图框全在漂移，三张卡片看上去毫无血缘关系。试着勾选 2–4 个结构基因。`;
    } else if (activeCount === 1) {
      readout.innerHTML =
        `<strong>锁定 1 / 5 · 仍然零散</strong>` +
        `只靠单一特征很难撑起多栏统一感，其余差异仍在扯散版面。建议再补 1–3 个重复基因。`;
    } else if (activeCount <= 4) {
      readout.innerHTML =
        `<strong>锁定 ${activeCount} / 5 · 统一且保留内容呼吸（经验甜区）</strong>` +
        `只靠 ${activeCount} 个重复信号就把三场题材与字数不同的导览收成同一份出版物，既省识别成本，又丝毫不死板。`;
    } else {
      readout.innerHTML =
        `<strong>锁定 5 / 5 · 高度严谨的出版系统</strong>` +
        `全部视觉容器严丝合缝，适合大型展册、组件库与多页手册；此时只要内容文案各自鲜明，整体依然耐看。`;
    }
  }

  for (const b of Object.values(boxes)) b.addEventListener("change", update);
  update();
}

/* ============================================================
   04 节 · 破格的临界刻度（原生 range + 60 点 2D Canvas）
   ============================================================ */
function initThreshold() {
  const canvas = document.getElementById("thresh-canvas");
  const range = document.getElementById("thresh-range");
  const valEl = document.getElementById("thresh-val");
  const badgeEl = document.getElementById("thresh-badge");
  const headEl = document.getElementById("thresh-headline");
  const detailEl = document.getElementById("thresh-detail");
  const refEl = document.getElementById("thresh-ref");
  if (!canvas || !range) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 确定性破格出现顺序：第 1 枚落在偏左下黄金区，随后逐步扩散至多处
  const ORDER_SEQ = [
    33, 14, 46, 26, 8, 52, 19, 41, 3, 56,
    22, 37, 11, 48, 29, 6, 54, 17, 43, 24,
    31, 9, 49, 15, 39, 2, 57,
  ];

  let count = Number(range.value);
  let lastSizeKey = "";
  let dirty = true;

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(120, Math.round(rect.width));
    const h = Math.max(80, Math.round(rect.height));
    const dpr = pixelRatio(2);
    const key = `${w}x${h}@${dpr}`;
    if (key !== lastSizeKey) {
      lastSizeKey = key;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, w, h);

    const cols = 10;
    const rows = 6;
    const pad = Math.max(10, Math.round(w * 0.035));
    const cell = Math.min((w - pad * 2) / cols, (h - pad * 2) / rows);
    const ox = (w - cell * cols) / 2;
    const oy = (h - cell * rows) / 2;

    const broken = new Set(ORDER_SEQ.slice(0, count));
    for (let i = 0; i < THRESHOLD_TOTAL; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = ox + (c + 0.5) * cell;
      const cy = oy + (r + 0.5) * cell;
      if (broken.has(i)) {
        // 破格单元：放大深墨黑实心圆配朱橘环，一眼可见破格规模
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.vermilion;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = PALETTE.vermilion;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const ctrl = loop(canvas, () => render());

  function sync() {
    count = Number(range.value);
    const info = evaluateThreshold(count);
    valEl.textContent = `${info.n} / ${THRESHOLD_TOTAL} · ${info.pct.toFixed(1)}%`;
    badgeEl.textContent = info.badge;
    badgeEl.dataset.zone = info.zone;
    headEl.textContent = info.headline;
    detailEl.textContent = info.detail;
    if (refEl) {
      const diff = +(info.pct - 5.6).toFixed(1);
      const cmp =
        info.n === 0
          ? "原海报留了 5.6% 破格点；当前 0% 完全没有落脚点。"
          : Math.abs(diff) <= 2.5
            ? `与 107 原海报的 5.6%（4 / 72）几乎处在同一克制破格带。`
            : diff > 0
              ? `比 107 原海报的 5.6% 高出 ${diff}%，破格比例已明显放大。`
              : `比 107 原海报的 5.6% 更克制（仅 ${info.pct.toFixed(1)}%）。`;
      refEl.innerHTML = `<strong>与 107 原海报对照：</strong>${cmp}`;
    }
    dirty = true;
    ctrl.draw();
  }

  range.addEventListener("input", sync);
  window.addEventListener("resize", () => {
    dirty = true;
    ctrl.draw();
  });

  sync();
}

/* ============================================================
   05 节 · 历史编年印章切换 + 时代几何图板
   ============================================================ */
function initTimeline() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const yearTag = document.getElementById("era-year-tag");
  const titleEl = document.getElementById("era-title");
  const bodyEl = document.getElementById("era-body");
  const sourceEl = document.getElementById("era-source");
  const svg = document.getElementById("era-svg");
  if (!svg || !btns.length) return;

  const ERAS = [
    {
      year: "1856 · 伦敦",
      title: "欧文·琼斯《装饰文法》：跨文明母题的统一语法",
      body: "英国建筑师欧文·琼斯在伦敦由 Day and Son 出版《装饰文法》（The Grammar of Ornament），收录 100 幅石版彩色图版与 37 条装饰命题，首次跨文明归纳出以重复几何母题建构和谐秩序的普适法则。",
      source: "核实来源：Owen Jones, The Grammar of Ornament (London: Day and Son, 1856)，大英维多利亚与阿尔伯特博物馆及史密森学会图书馆藏。",
      draw(s) {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            const x = 42 + c * 64;
            const y = 36 + r * 64;
            s.appendChild(svgEl("polygon", { points: `${x},${y - 20} ${x + 20},${y} ${x},${y + 20} ${x - 20},${y}`, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.6 }));
            s.appendChild(svgEl("circle", { cx: x, cy: y, r: 6, fill: PALETTE.vermilion }));
          }
        }
      },
    },
    {
      year: "1923 · 柏林",
      title: "马克斯·韦特海默：格式塔相似律确立知觉根基",
      body: "韦特海默在《心理学研究》发表《格式塔理论研究（二）》，用点列实验证明人眼会不假思索地把相似的视觉元素编成一组。这为后来所有排版教材中的「重复产生整体感」提供了实验心理学依据。",
      source: "核实来源：Max Wertheimer, Untersuchungen zur Lehre von der Gestalt. II, Psychologische Forschung 4 (1923), pp. 301–350。",
      draw(s) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 7; c++) {
            const fill = r % 2 === 0 ? PALETTE.vermilion : PALETTE.ink;
            s.appendChild(svgEl("circle", { cx: 38 + c * 34, cy: 40 + r * 40, r: 9, fill }));
          }
        }
      },
    },
    {
      year: "1965 · 瑞士巴塞尔",
      title: "阿明·霍夫曼《平面设计手册》：从一枚圆点到张力矩阵",
      body: "瑞士平面设计大师阿明·霍夫曼在 Niggli Verlag 出版《平面设计手册》，全书直接从「圆点」起笔，示范等距圆点阵如何通过疏密与体量破格制造秩序与视觉张力——这正是 107 号海报最直接的视觉血脉。",
      source: "核实来源：Armin Hofmann, Graphic Design Manual: Principles and Practice (Teufen: Arthur Niggli Verlag, 1965)。",
      draw(s) {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 7; c++) {
            if (r >= 2 && r <= 3 && c >= 2 && c <= 3) continue;
            s.appendChild(svgEl("circle", { cx: 40 + c * 33, cy: 32 + r * 34, r: 10.5, fill: PALETTE.ink }));
          }
        }
        s.appendChild(svgEl("circle", { cx: 40 + 2.5 * 33, cy: 32 + 2.5 * 34, r: 27, fill: PALETTE.vermilion }));
      },
    },
    {
      year: "1972 · 香港与纽约",
      title: "王无邪《平面设计原理》：把「重复」与「特异」配成对",
      body: "香港设计师与教育家王无邪在纽约 Van Nostrand Reinhold 出版《平面设计原理》，第 3 章专讲「重复（Repetition）」，第 8 章专讲「特异（Anomaly）」，一针见血地指出：特异必须建立在重复依然占主导的前提之下，才既醒目又不致失序。",
      source: "核实来源：Wucius Wong, Principles of Two-Dimensional Design (New York: Van Nostrand Reinhold, 1972)。",
      draw(s) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 6; c++) {
            const x = 35 + c * 40;
            const y = 32 + r * 42;
            if (r === 2 && c === 3) {
              s.appendChild(svgEl("circle", { cx: x + 12, cy: y + 12, r: 14, fill: PALETTE.vermilion }));
            } else {
              s.appendChild(svgEl("rect", { x, y, width: 24, height: 24, fill: "none", stroke: PALETTE.ink, "stroke-width": 2 }));
            }
          }
        }
      },
    },
    {
      year: "1968 & 1980 · 认知实验",
      title: "扎荣茨与特里斯曼：记忆锚与前注意突显的双重证明",
      body: "罗伯特·扎荣茨在 1968 年证实重复曝光会提升熟悉度与记忆印象；安妮·特里斯曼与加里·格莱德在 1980 年提出特征整合理论，证明背景越一致重复，唯一特征异常越能瞬间跳出视野。二者合起来完整解释了原海报的两句话。",
      source: "核实来源：R. B. Zajonc (1968, DOI: 10.1037/h0025848)；A. M. Treisman & G. Gelade, Cognitive Psychology 12(1) (1980, PMID: 7351125)。",
      draw(s) {
        for (let i = 0; i < 24; i++) {
          const c = i % 6;
          const r = Math.floor(i / 6);
          const cx = 42 + c * 39;
          const cy = 38 + r * 42;
          const hit = i === 15;
          s.appendChild(svgEl("circle", { cx, cy, r: hit ? 15 : 8, fill: hit ? PALETTE.vermilion : "#B4B2AE" }));
          if (hit) s.appendChild(svgEl("circle", { cx, cy, r: 22, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.6, "stroke-dasharray": "4 3" }));
        }
      },
    },
    {
      year: "1994 & 2016 · 出版与数字界面",
      title: "罗宾·威廉姆斯与布拉德·弗罗斯特：走进日常排版与组件库",
      body: "1994 年罗宾·威廉姆斯在《写给大家看的设计书》把「重复」定为普通人也能立刻上手的四大版式原则之一；2016 年布拉德·弗罗斯特在《原子设计》中把重复工程化为数字产品的设计令牌、原子组件与页面模板，让数百个网页共用同一副骨架。",
      source: "核实来源：Robin Williams, The Non-Designer's Design Book (Peachpit Press, 1994)；Brad Frost, Atomic Design (2016)。",
      draw(s) {
        // 原子 -> 分子 -> 组件重复演进示意
        s.appendChild(svgEl("circle", { cx: 46, cy: 100, r: 16, fill: PALETTE.vermilion }));
        s.appendChild(svgEl("line", { x1: 72, y1: 100, x2: 96, y2: 100, stroke: PALETTE.ink, "stroke-width": 1.8 }));
        for (let i = 0; i < 3; i++) s.appendChild(svgEl("circle", { cx: 112 + i * 20, cy: 100, r: 7, fill: PALETTE.vermilion }));
        s.appendChild(svgEl("line", { x1: 168, y1: 100, x2: 188, y2: 100, stroke: PALETTE.ink, "stroke-width": 1.8 }));
        for (let r = 0; r < 3; r++) {
          s.appendChild(svgEl("rect", { x: 196, y: 46 + r * 38, width: 64, height: 28, fill: "none", stroke: PALETTE.ink, "stroke-width": 1.6 }));
          s.appendChild(svgEl("circle", { cx: 208, cy: 60 + r * 38, r: 5, fill: PALETTE.vermilion }));
          s.appendChild(svgEl("line", { x1: 219, y1: 60 + r * 38, x2: 250, y2: 60 + r * 38, stroke: PALETTE.ink, "stroke-width": 2 }));
        }
      },
    },
  ];

  function select(idx) {
    const item = ERAS[idx];
    for (const b of btns) b.setAttribute("aria-selected", String(Number(b.dataset.era) === idx));
    yearTag.textContent = item.year;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    sourceEl.textContent = item.source;
    svg.innerHTML = "";
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: 280, height: 200, fill: PALETTE.paper }));
    item.draw(svg);
  }

  for (const b of btns) b.addEventListener("click", () => select(Number(b.dataset.era)));
  select(0);
}

/* ============================================================
   07 节 · 练一练：四版日程海报单选（只差单一重复变量）
   ============================================================ */
function initQuiz() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("quiz-fb-title");
  const fbBody = document.getElementById("quiz-fb-body");
  const breakdown = document.getElementById("quiz-breakdown");
  const btnReset = document.getElementById("quiz-reset");
  if (!cards.length || !fb) return;

  const ITEMS = [
    { time: "10.12 · 开幕主旨", name: "点阵中的秩序与例外" },
    { time: "10.13 · 对谈二", name: "丝网叠印的节奏控制" },
    { time: "10.14 · 对谈三", name: "网格书刊的重复眉标" },
    { time: "10.15 · 对谈四", name: "组件规范与版式复用" },
  ];

  function renderPosterSvg(opt) {
    const svg = document.getElementById(`quiz-svg-${opt}`);
    if (!svg) return;
    svg.innerHTML = "";
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: 220, height: 260, fill: PALETTE.paper }));

    // 统一页眉（四版完全相同，确保只差单一变量）
    const h = svgEl("text", { x: 18, y: 32, fill: PALETTE.ink, "font-size": 14, "font-weight": 900 });
    h.textContent = "秋季版画双年展";
    svg.appendChild(h);
    const sub = svgEl("text", { x: 18, y: 47, fill: "#5F5A50", "font-size": 9.5, "font-weight": 700 });
    sub.textContent = "AUTUMN PRINT BIENNALE · 4 TALKS";
    svg.appendChild(sub);
    svg.appendChild(svgEl("line", { x1: 18, y1: 56, x2: 202, y2: 56, stroke: PALETTE.ink, "stroke-width": 1.5 }));

    const rowY = [86, 132, 178, 224];
    for (let i = 0; i < 4; i++) {
      const y = rowY[i];
      if (i > 0) {
        svg.appendChild(svgEl("line", { x1: 18, y1: y - 22, x2: 202, y2: y - 22, stroke: "#D6CEBE", "stroke-width": 1 }));
      }

      // 方案 D 故意在 3 场同时加反白/粗框/放大（破格过度）
      if (opt === "D" && i !== 2) {
        svg.appendChild(svgEl("rect", { x: 14, y: y - 18, width: 192, height: 38, fill: i === 0 ? "#FAE7E1" : "none", stroke: i === 3 ? PALETTE.ink : PALETTE.vermilion, "stroke-width": 1.6 }));
      }

      // 左侧场次视觉母题标记
      const mx = 32;
      const my = y + 1;
      if (opt === "A") {
        // 方案 A：单一变量 = 母题形色未统一（四形四色）
        if (i === 0) svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: 9, fill: PALETTE.vermilion }));
        if (i === 1) svg.appendChild(svgEl("rect", { x: mx - 7, y: my - 7, width: 14, height: 14, fill: "#2C597D" }));
        if (i === 2) svg.appendChild(svgEl("polygon", { points: `${mx},${my - 8} ${mx + 8},${my + 7} ${mx - 8},${my + 7}`, fill: "#5C6B32" }));
        if (i === 3) svg.appendChild(svgEl("polygon", { points: `${mx},${my - 8} ${mx + 8},${my} ${mx},${my + 8} ${mx - 8},${my}`, fill: "#6A3E7A" }));
      } else if (opt === "B") {
        // 方案 B：单一变量 = 零破格机械均分（全部等大等重）
        svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: 6.5, fill: PALETTE.vermilion }));
      } else if (opt === "C") {
        // 方案 C（正确）：同朱橘圆点母题，仅第 1 场开幕主旨放大至 2× 破格
        svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: i === 0 ? 11.5 : 6, fill: PALETTE.vermilion }));
      } else {
        // 方案 D：3 场同时放大加框，互相抢焦
        svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: i === 2 ? 6 : 10.5, fill: PALETTE.vermilion }));
      }

      const t1 = svgEl("text", { x: 52, y: y - 4, fill: "#5F5A50", "font-size": 9.5, "font-weight": 700 });
      t1.textContent = ITEMS[i].time;
      svg.appendChild(t1);

      const t2 = svgEl("text", {
        x: 52,
        y: y + 12,
        fill: PALETTE.ink,
        "font-size": opt === "C" && i === 0 ? 12.5 : 11,
        "font-weight": opt === "C" && i === 0 ? 900 : 700,
      });
      t2.textContent = ITEMS[i].name;
      svg.appendChild(t2);
    }
  }

  for (const opt of ["A", "B", "C", "D"]) renderPosterSvg(opt);

  const REASONS = {
    A: "A 版四场改用了圆、方、三角、菱四种图形配四种颜色，破坏了重复母题，系列归属感直接散架。",
    B: "B 版四场完全等大等重，虽然统一整齐，但零破格导致开幕主旨对谈被淹没在平权列表里。",
    C: "C 版用同色同形朱橘圆点把四场牢牢收成一个系列，又只把第一场开幕主旨放大一档破格，统一底盘与单点聚焦同时成立。",
    D: "D 版同时对四场里的三场加放大圆与外框强调，破格占比过高，处处都在喊重点反而没了重点。",
  };

  function choose(opt) {
    const ok = opt === "C";
    for (const c of cards) {
      const id = c.dataset.opt;
      c.setAttribute("aria-pressed", String(id === opt));
      c.classList.remove("is-selected", "is-correct", "is-wrong");
      const mark = c.querySelector("[data-mark]");
      if (id === "C") {
        c.classList.add("is-correct");
        mark.textContent = id === opt ? "选对了" : "更佳解";
      } else if (id === opt) {
        c.classList.add("is-wrong");
        mark.textContent = "差在一处";
      } else {
        mark.textContent = "已对照";
      }
    }

    fb.dataset.state = ok ? "ok" : "err";
    fbTitle.textContent = ok
      ? "选对了：C 版同时守住了「统一底盘」与「单点破格」"
      : `你选了 ${opt} 版——它在单一变量上失了手，更有效的是 C 版`;
    fbBody.textContent = REASONS[opt] + (ok ? "" : " " + REASONS.C);
    breakdown.innerHTML = ["A", "B", "C", "D"]
      .map((k) => `<li><strong>${k} 版：</strong>${REASONS[k]}</li>`)
      .join("");
    breakdown.hidden = false;
    btnReset.hidden = false;
  }

  function reset() {
    for (const c of cards) {
      c.setAttribute("aria-pressed", "false");
      c.classList.remove("is-selected", "is-correct", "is-wrong");
      c.querySelector("[data-mark]").textContent = "点击选择";
    }
    fb.dataset.state = "idle";
    fbTitle.textContent = "尚未作答：仔细对照四版里圆点母题与第一场主旨强调的差别";
    fbBody.textContent = "点选上方 A、B、C、D 任意一版，查看四版各自对应的单一变量拆解。";
    breakdown.hidden = true;
    btnReset.hidden = true;
  }

  for (const c of cards) c.addEventListener("click", () => choose(c.dataset.opt));
  btnReset.addEventListener("click", reset);
}

/* ============================================================
   08 节 · 原海报放大灯箱（复用 #poster.src，缩放+拖动+Esc）
   ============================================================ */
function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const box = document.getElementById("lightbox");
  const vp = document.getElementById("lb-viewport");
  const lbImg = document.getElementById("lb-img");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !posterImg || !box || !lbImg) return;

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
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    btnClose.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    trigger.focus();
  }

  function zoom(delta) {
    scale = Math.max(1, Math.min(3.2, +(scale + delta).toFixed(2)));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => zoom(0.4));
  btnOut.addEventListener("click", () => zoom(-0.4));
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  vp.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.25 : -0.25);
    },
    { passive: false }
  );

  vp.addEventListener("pointerdown", (e) => {
    if (e.target === vp && scale === 1) {
      close();
      return;
    }
    dragging = true;
    vp.classList.add("is-dragging");
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    if (vp.setPointerCapture) {
      try { vp.setPointerCapture(e.pointerId); } catch {}
    }
  });

  vp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  const endPan = () => {
    dragging = false;
    vp.classList.remove("is-dragging");
  };
  vp.addEventListener("pointerup", endPan);
  vp.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") zoom(0.35);
    else if (e.key === "-") zoom(-0.35);
  });
}

export function initSections() {
  initPopoutLab();
  initAnatomy();
  initLevers();
  initThreshold();
  initTimeline();
  initQuiz();
  initPosterLightbox();
}
