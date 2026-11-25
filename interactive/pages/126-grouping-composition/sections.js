// 126 群组构图 · 正文 01–07 节独立交互组件与原海报放大灯箱
// 每节采用不同交互机制，相邻节绝不重复同类控件。

import { BASE_ITEMS, PALETTE, SCRAMBLED_ASSIGNMENTS, SORTED_ASSIGNMENTS } from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// =========================================================================
// 01 节：两轮限时扫视找靶实测（在 25 件中找出 4 枚「深蓝方块」）
// =========================================================================
export function initSearchLab() {
  const board = document.getElementById("search-board");
  const modeBtns = [...document.querySelectorAll("[data-search-mode]")];
  const resetBtn = document.getElementById("search-reset");
  const timerEl = document.getElementById("search-timer");
  const foundEl = document.getElementById("search-found");
  const msgEl = document.getElementById("search-msg");
  const recScrambledEl = document.getElementById("rec-scrambled");
  const recGroupedEl = document.getElementById("rec-grouped");
  if (!board) return;

  let mode = "scrambled"; // "scrambled" | "grouped"
  let foundIds = new Set();
  let startTs = 0;
  let elapsed = 0;
  let done = false;
  let timerHandle = 0;
  const records = { scrambled: null, grouped: null };

  function stopClock() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = 0;
    }
  }

  function renderBoard() {
    board.dataset.mode = mode;
    board.innerHTML = "";
    const order = mode === "scrambled" ? SCRAMBLED_ASSIGNMENTS : SORTED_ASSIGNMENTS;
    const targetIds = new Set([12, 13, 14, 15]); // 4 枚深普鲁士蓝方块（群组 C）

    if (mode === "grouped") {
      // 4 组模块容器，清晰再现原海报四块结构
      const groups = [
        { id: "A", slots: [0, 1, 2, 3, 4, 5], cols: 3 },
        { id: "B", slots: [6, 7, 8, 9, 10, 11], cols: 3 },
        { id: "C", slots: [12, 13, 14, 15], cols: 2 },
        { id: "D", slots: [16, 17, 18, 19, 20, 21, 22, 23, 24], cols: 3 },
      ];
      for (const g of groups) {
        const box = document.createElement("div");
        box.className = `search-group search-group-${g.id.toLowerCase()}`;
        box.style.setProperty("--cols", String(g.cols));
        for (const s of g.slots) {
          box.append(makeCell(order[s], targetIds.has(order[s])));
        }
        board.append(box);
      }
    } else {
      const flat = document.createElement("div");
      flat.className = "search-flat";
      for (const id of order) {
        flat.append(makeCell(id, targetIds.has(id)));
      }
      board.append(flat);
    }

    foundEl.textContent = `${foundIds.size} / 4`;
    timerEl.textContent = `${elapsed.toFixed(2)} 秒`;
  }

  function makeCell(itemId, isTarget) {
    const it = BASE_ITEMS[itemId];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `s-tile s-${it.baseShape} s-${it.baseColor}`;
    if (foundIds.has(itemId)) btn.classList.add("is-found");
    btn.setAttribute("aria-label", `${it.baseColor === "navy" ? "深蓝" : it.baseColor === "orange" ? "朱橘" : it.baseColor === "green" ? "深绿" : "玫瑰粉"}${it.baseShape === "square" ? "方块" : "圆点"}`);
    btn.dataset.id = String(itemId);
    btn.dataset.target = isTarget ? "1" : "0";
    btn.addEventListener("click", () => handlePick(itemId, isTarget, btn));
    return btn;
  }

  function handlePick(itemId, isTarget, btn) {
    if (done) return;
    if (!startTs) {
      startTs = performance.now();
      timerHandle = setInterval(() => {
        elapsed = (performance.now() - startTs) / 1000;
        timerEl.textContent = `${elapsed.toFixed(2)} 秒`;
      }, 60);
    }
    if (isTarget) {
      if (foundIds.has(itemId)) return;
      foundIds.add(itemId);
      btn.classList.add("is-found");
      foundEl.textContent = `${foundIds.size} / 4`;
      if (foundIds.size === 4) {
        done = true;
        stopClock();
        elapsed = Math.max(0.05, (performance.now() - startTs) / 1000);
        timerEl.textContent = `${elapsed.toFixed(2)} 秒`;
        records[mode] = elapsed;
        if (records.scrambled !== null) recScrambledEl.textContent = `${records.scrambled.toFixed(2)} 秒`;
        if (records.grouped !== null) recGroupedEl.textContent = `${records.grouped.toFixed(2)} 秒`;

        if (mode === "scrambled" && records.grouped === null) {
          msgEl.textContent = `混排找齐用时 ${elapsed.toFixed(2)} 秒。现在点上方「切到群组构图」，用同样 25 枚再试一次！`;
        } else if (records.scrambled !== null && records.grouped !== null) {
          const ratio = (records.scrambled / Math.max(0.1, records.grouped)).toFixed(1);
          msgEl.textContent = records.grouped < records.scrambled
            ? `实测对比：混排 ${records.scrambled.toFixed(2)} 秒 vs 群组 ${records.grouped.toFixed(2)} 秒（快了约 ${ratio} 倍）。元素数量一模一样，省下的是眼睛反复横跳的时间。`
            : `两轮都已完成：混排 ${records.scrambled.toFixed(2)} 秒、群组 ${records.grouped.toFixed(2)} 秒。你可以点「重新计时」再感受一次首眼定位速度。`;
        } else {
          msgEl.textContent = `群组找齐仅用 ${elapsed.toFixed(2)} 秒！切去「混排散点」试一轮，立刻能感到差距。`;
        }
      }
    } else {
      btn.classList.remove("is-miss");
      void btn.offsetWidth;
      btn.classList.add("is-miss");
      msgEl.textContent = "点错了——目标是最深的普鲁士蓝「方块」，不是圆点或其他颜色。";
    }
  }

  function switchMode(next) {
    mode = next;
    stopClock();
    foundIds = new Set();
    startTs = 0;
    elapsed = 0;
    done = false;
    for (const b of modeBtns) {
      b.setAttribute("aria-pressed", String(b.dataset.searchMode === mode));
    }
    msgEl.textContent = mode === "scrambled"
      ? "混排态：点击任意 1 枚开始计时，找出全部 4 枚「深蓝方块」。"
      : "群组态：同样 25 枚按群组排开，再找一次 4 枚「深蓝方块」看用时。";
    renderBoard();
  }

  for (const b of modeBtns) {
    b.addEventListener("click", () => switchMode(b.dataset.searchMode));
  }
  resetBtn?.addEventListener("click", () => switchMode(mode));

  switchMode("scrambled");
}

// =========================================================================
// 02 节：三把抓手图层剥离器（形状层 / 颜色层 / 间距层 / 灰度色盲检验）
// =========================================================================
export function initLayerPeeler() {
  const svg = document.getElementById("peeler-svg");
  const toggles = [...document.querySelectorAll("[data-layer]")];
  const verdictTitle = document.getElementById("peeler-title");
  const verdictBody = document.getElementById("peeler-body");
  const meterFill = document.getElementById("peeler-meter-fill");
  const meterTier = document.getElementById("peeler-tier");
  if (!svg) return;

  const layers = { shape: true, color: true, spacing: true, gray: false };

  function render() {
    svg.innerHTML = "";
    const W = 540;
    const H = 316;
    const unit = 32;
    const intra = 8;
    const gapX = layers.spacing ? 46 : intra;
    const gapY = layers.spacing ? 38 : intra;

    const wA = 3 * unit + 2 * intra;
    const hA = 2 * unit + intra;
    const wB = 3 * unit + 2 * intra;
    const wC = 2 * unit + intra;
    const hC = 2 * unit + intra;
    const wD = 3 * unit + 2 * intra;
    const hD = 3 * unit + 2 * intra;

    const totalW = wA + gapX + wB;
    const totalH = hA + gapY + hD;
    const ox = (W - totalW) / 2;
    const oy = (H - totalH) / 2;

    const blocks = [
      { id: "A", cols: 3, rows: 2, x: ox, y: oy, shape: "square", color: PALETTE.orange, gray: "#5E5E5E" },
      { id: "B", cols: 3, rows: 2, x: ox + wA + gapX, y: oy, shape: "circle", color: PALETTE.green, gray: "#353535" },
      { id: "C", cols: 2, rows: 2, x: ox + (layers.spacing ? (wA - wC) * 0.55 : wA - wC), y: oy + hA + gapY + (layers.spacing ? (hD - hC) * 0.2 : 0), shape: "square", color: PALETTE.navy, gray: "#1F1F1F" },
      { id: "D", cols: 3, rows: 3, x: ox + wA + gapX, y: oy + hA + gapY, shape: "circle", color: PALETTE.pink, gray: "#A2A2A2" },
    ];

    // 背景通道示意（仅当间距层开启时绘制极淡通道标尺）
    if (layers.spacing) {
      svg.append(svgEl("line", {
        x1: ox + wA + gapX / 2, y1: oy - 8,
        x2: ox + wA + gapX / 2, y2: oy + totalH + 8,
        stroke: "rgba(14,17,20,0.22)", "stroke-width": 1.2, "stroke-dasharray": "4 4",
      }));
      svg.append(svgEl("line", {
        x1: ox - 8, y1: oy + hA + gapY / 2,
        x2: ox + totalW + 8, y2: oy + hA + gapY / 2,
        stroke: "rgba(14,17,20,0.22)", "stroke-width": 1.2, "stroke-dasharray": "4 4",
      }));
    }

    for (const b of blocks) {
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          const x = b.x + c * (unit + intra);
          const y = b.y + r * (unit + intra);
          const fill = !layers.color ? PALETTE.ink : layers.gray ? b.gray : b.color;
          const shape = layers.shape ? b.shape : "square";
          if (shape === "circle") {
            svg.append(svgEl("circle", { cx: x + unit / 2, cy: y + unit / 2, r: unit / 2, fill }));
          } else {
            svg.append(svgEl("rect", { x, y, width: unit, height: unit, fill }));
          }
        }
      }
      if (layers.spacing) {
        const lbl = svgEl("text", {
          x: b.x, y: b.y - 6,
          fill: PALETTE.ink,
          "font-size": 11,
          "font-weight": 700,
          "font-family": '"JetBrains Mono", monospace',
        });
        lbl.textContent = `GROUP ${b.id}`;
        svg.append(lbl);
      }
    }

    // 根据激活的通道组合给出精准单真源说明（结合 Kubovy & van den Berg 2008 叠加效应）
    const activeColor = layers.color && !layers.gray;
    const cueCount = (layers.shape ? 1 : 0) + (layers.color ? 1 : 0) + (layers.spacing ? 1 : 0);
    let pct = 15;
    let tier = "无分组信号（示意）";
    let title = "";
    let body = "";

    if (layers.shape && layers.color && layers.spacing && !layers.gray) {
      pct = 100;
      tier = "三重冗余叠加（示意）";
      title = "三层全开：这就是 126 原海报一秒读懂的秘密";
      body = "形状把方与圆分开、四色把四个模块各自锁死、组间通道又在空间上拉开边界。三股力量指向完全一致，任何一条线索漏看，另外两条还能兜底。";
    } else if (layers.gray && layers.spacing && layers.shape) {
      pct = 82;
      tier = "灰度仍清晰（示意）";
      title = "切到灰度后依然四组清晰：结构靠的不是涂色";
      body = "去掉色相后，明度差、方圆形态和组间通道仍在共同守住边界。这解释了为什么好的群组构图打印成黑白稿或遇到色觉障碍读者时同样成立。";
    } else if (!layers.shape && !layers.color && !layers.spacing) {
      pct = 8;
      tier = "完全均质（示意）";
      title = "三层全关：25 个黑方块粘成一块死板砖";
      body = "既没有形状差异、也没有颜色与组距，画面退化成 25 个一模一样的黑块，完全看不出这四个群组原本存在过。";
    } else if (!layers.spacing && layers.shape && layers.color) {
      pct = 58;
      tier = "仅靠属性、边界紧贴（示意）";
      title = "关掉间距层：能辨出四块，但彼此贴得喘不过气";
      body = "靠颜色和形状还能硬分出四个区域，可一旦删去组间通道，四组边缘严丝合缝地撞在一起，阅读停顿点消失了——这就是海报特意单独强调「间距」的原因。";
    } else if (layers.spacing && !layers.color && !layers.shape) {
      pct = 62;
      tier = "纯位置骨架成立（示意）";
      title = "只留间距层：哪怕全黑同形，四块骨架依然立得住";
      body = "在三把抓手里，组间通道是最稳的底层骨架。哪怕全部元素长得一模一样，只要留出明确的组间留白，人眼立刻能认出四个独立模块。";
    } else if (layers.spacing && (layers.shape || layers.color)) {
      pct = 80;
      tier = "双线索协同（示意）";
      title = layers.color
        ? "间距 + 颜色：骨架清楚，四色迅速强化识别"
        : "间距 + 形状：无色也能清晰区分方圆模块";
      body = "双线索同向发力已经足够清晰；如果再加上第三层线索，则能在复杂页面或弱光环境下提供更高的容错余量。";
    } else {
      pct = 38;
      tier = "单线索吃力（示意）";
      title = layers.color
        ? "只留颜色层：相邻色块硬贴在一起，边界偏紧"
        : "只留形状层：同黑密排下，方圆边界需要定睛细看";
      body = `当前仅靠 ${cueCount} 条弱线索撑场面，眼睛需要刻意搜寻轮廓差异，缺少拉开层次的呼吸空间。`;
    }

    meterFill.style.width = `${pct}%`;
    meterTier.textContent = tier;
    verdictTitle.textContent = title;
    verdictBody.textContent = body;
  }

  for (const btn of toggles) {
    btn.addEventListener("click", () => {
      const key = btn.dataset.layer;
      layers[key] = !layers[key];
      btn.setAttribute("aria-pressed", String(layers[key]));
      render();
    });
  }
  render();
}

// =========================================================================
// 03 节（深普鲁士蓝暗室）：线索拔河矩阵与一键对齐修复
// =========================================================================
export function initConflictLab() {
  const svg = document.getElementById("conflict-svg");
  const scenarioBtns = [...document.querySelectorAll("[data-conflict]")];
  const fixBtn = document.getElementById("conflict-fix");
  const statusEl = document.getElementById("conflict-status");
  const titleEl = document.getElementById("conflict-title");
  const explainEl = document.getElementById("conflict-explain");
  const axisRowEl = document.getElementById("axis-row");
  const axisColEl = document.getElementById("axis-col");
  if (!svg) return;

  const SCENARIOS = {
    aligned: {
      badge: "线索同向 · 零冲突",
      title: "横距、颜色、形状同指「三行分组」",
      explain: "横向收紧（组内 14px）、纵向拉开（组间 52px），且每一行同形同色。位置与属性叠加发力，视线顺着三行平稳扫读。",
      rowPull: "强主导（位置 + 颜色 + 形状）",
      colPull: "无干扰",
      fixable: false,
      mode: "aligned",
    },
    colorVsSpace: {
      badge: "冲突 · 横距对抗竖色",
      title: "位置把它们排成三横行，颜色却硬拉成四竖列",
      explain: "真实界面里最常见的失误：横向靠得很近像一组，却给每一列涂了同一种醒目色。眼睛一会儿按横行读、一会儿被竖向同色拽走，陷入知觉双稳态拉扯。",
      rowPull: "位置拉向横行",
      colPull: "色彩强拉向竖列",
      fixable: true,
      mode: "colorVsSpace",
    },
    rebelShape: {
      badge: "冲突 · 异形跨组串门",
      title: "每组塞进一枚异色异形元素，强行抢走视线",
      explain: "即便四块组距已经拉开，只要每块里混入一枚别的组的颜色或形状，眼睛就会隔空把四枚叛徒连成一条斜线，破坏原本清晰的模块结构。",
      rowPull: "位置拉向三行",
      colPull: "斜向同色叛徒抢焦",
      fixable: true,
      mode: "rebelShape",
    },
    tightGap: {
      badge: "冲突 · 通道不足反被竖列吞并",
      title: "行距太窄、列距偏宽，横排按钮被错认成竖列",
      explain: "当组间通道（20px）反而小于或接近组内水平间距（34px）时，邻近性会直接反叛：本来想做成三行功能组，读者眼里看到的却是四根竖条。",
      rowPull: "偏弱（横向过松）",
      colPull: "反客为主（纵向更近）",
      fixable: true,
      mode: "tightGap",
    },
  };

  let current = "colorVsSpace";

  function draw() {
    const sc = SCENARIOS[current];
    svg.innerHTML = "";
    const W = 540;
    const H = 264;
    const cols = 4;
    const rows = 3;
    const sz = 32;

    const colGap = sc.mode === "tightGap" ? 42 : 16;
    const rowGap = sc.mode === "tightGap" ? 14 : 44;
    const totalW = cols * sz + (cols - 1) * colGap;
    const totalH = rows * sz + (rows - 1) * rowGap;
    const ox = (W - totalW) / 2;
    const oy = (H - totalH) / 2;

    const rowColors = ["#FF8A4C", "#7BE3A5", "#FFA8C8"];
    const colColors = ["#FF8A4C", "#7BE3A5", "#9EC2FF", "#FFA8C8"];

    // 绘制拉扯箭头指示
    if (sc.mode === "colorVsSpace") {
      // 横向虚线（位置）与纵向亮线（色彩）十字拉扯
      for (let r = 0; r < rows; r++) {
        const cy = oy + r * (sz + rowGap) + sz / 2;
        svg.append(svgEl("line", {
          x1: ox - 18, y1: cy, x2: ox + totalW + 18, y2: cy,
          stroke: "rgba(255,255,255,0.28)", "stroke-width": 1.4, "stroke-dasharray": "5 4",
        }));
      }
      for (let c = 0; c < cols; c++) {
        const cx = ox + c * (sz + colGap) + sz / 2;
        svg.append(svgEl("line", {
          x1: cx, y1: oy - 14, x2: cx, y2: oy + totalH + 14,
          stroke: colColors[c], "stroke-width": 1.6, "stroke-opacity": "0.55",
        }));
      }
    } else if (sc.mode === "aligned") {
      for (let r = 0; r < rows; r++) {
        const y = oy + r * (sz + rowGap) - 7;
        svg.append(svgEl("rect", {
          x: ox - 10, y, width: totalW + 20, height: sz + 14, rx: 4,
          fill: "rgba(123, 227, 165, 0.08)", stroke: "rgba(123, 227, 165, 0.45)", "stroke-width": 1.2,
        }));
      }
    } else if (sc.mode === "tightGap") {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * (sz + colGap) - 6;
        svg.append(svgEl("rect", {
          x, y: oy - 8, width: sz + 12, height: totalH + 16, rx: 4,
          fill: "rgba(255, 135, 135, 0.12)", stroke: "#FF8787", "stroke-width": 1.2, "stroke-dasharray": "4 3",
        }));
      }
    } else if (sc.mode === "rebelShape") {
      // 斜向连线串起三枚跨行叛徒
      svg.append(svgEl("line", {
        x1: ox + sz / 2, y1: oy + sz / 2,
        x2: ox + 2 * (sz + colGap) + sz / 2, y2: oy + 2 * (sz + rowGap) + sz / 2,
        stroke: "#FF8787", "stroke-width": 1.8, "stroke-dasharray": "5 3",
      }));
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * (sz + colGap);
        const y = oy + r * (sz + rowGap);
        let fill = rowColors[r];
        let shape = r === 1 ? "circle" : "square";

        if (sc.mode === "colorVsSpace") {
          fill = colColors[c];
          shape = "circle";
        } else if (sc.mode === "rebelShape" && c === r) {
          fill = "#9EC2FF";
          shape = "diamond";
        } else if (sc.mode === "tightGap") {
          fill = rowColors[r];
          shape = "square";
        }

        if (shape === "circle") {
          svg.append(svgEl("circle", { cx: x + sz / 2, cy: y + sz / 2, r: sz / 2, fill }));
        } else if (shape === "diamond") {
          const cx = x + sz / 2;
          const cy = y + sz / 2;
          const h = sz * 0.54;
          svg.append(svgEl("polygon", {
            points: `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`,
            fill, stroke: "#FFFDF9", "stroke-width": 1.6,
          }));
        } else {
          svg.append(svgEl("rect", { x, y, width: sz, height: sz, fill }));
        }
      }
    }

    statusEl.textContent = sc.badge;
    statusEl.dataset.state = sc.fixable ? "bad" : "ok";
    titleEl.textContent = sc.title;
    explainEl.textContent = sc.explain;
    axisRowEl.textContent = sc.rowPull;
    axisColEl.textContent = sc.colPull;
    if (fixBtn) {
      fixBtn.disabled = !sc.fixable;
      fixBtn.textContent = sc.fixable ? "对齐主维度 → 消除冲突" : "当前三线索已同向协同";
    }
    for (const b of scenarioBtns) {
      b.setAttribute("aria-pressed", String(b.dataset.conflict === current));
    }
  }

  for (const b of scenarioBtns) {
    b.addEventListener("click", () => {
      current = b.dataset.conflict;
      draw();
    });
  }
  fixBtn?.addEventListener("click", () => {
    current = "aligned";
    draw();
  });
  draw();
}

// =========================================================================
// 04 节：5 档分块颗粒度阶梯（18 项真实产品设置项 × Cowan 约 4 组块上限）
// =========================================================================
export function initChunkStepper() {
  const container = document.getElementById("chunk-preview");
  const btns = [...document.querySelectorAll("[data-chunk-step]")];
  const countEl = document.getElementById("chunk-count");
  const statusEl = document.getElementById("chunk-status");
  const noteEl = document.getElementById("chunk-note");
  const gaugeFill = document.getElementById("chunk-gauge-fill");
  if (!container) return;

  const ITEMS = [
    { name: "登录密码", g4: "账号与安全", g2: "账号与系统" },
    { name: "两步验证", g4: "账号与安全", g2: "账号与系统" },
    { name: "绑定手机", g4: "账号与安全", g2: "账号与系统" },
    { name: "设备管理", g4: "账号与安全", g2: "账号与系统" },
    { name: "深浅主题", g4: "外观与阅读", g2: "账号与系统" },
    { name: "字号缩放", g4: "外观与阅读", g2: "账号与系统" },
    { name: "界面语言", g4: "外观与阅读", g2: "账号与系统" },
    { name: "减少动效", g4: "外观与阅读", g2: "账号与系统" },
    { name: "快捷键表", g4: "外观与阅读", g2: "账号与系统" },
    { name: "桌面提醒", g4: "消息与通知", g2: "通知与数据" },
    { name: "邮件摘要", g4: "消息与通知", g2: "通知与数据" },
    { name: "免打扰时段", g4: "消息与通知", g2: "通知与数据" },
    { name: "评论回复", g4: "消息与通知", g2: "通知与数据" },
    { name: "自动备份", g4: "存储与导出", g2: "通知与数据" },
    { name: "缓存清理", g4: "存储与导出", g2: "通知与数据" },
    { name: "导出归档", g4: "存储与导出", g2: "通知与数据" },
    { name: "云端同步", g4: "存储与导出", g2: "通知与数据" },
    { name: "隐私权限", g4: "存储与导出", g2: "通知与数据" },
  ];

  const COLORS4 = ["orange", "green", "navy", "pink"];

  const STEPS = {
    "1": {
      n: 1,
      status: "未分组 · 线性硬读",
      gaugePct: 18,
      gaugeState: "bad",
      note: "18 个设置项塞进同一整列。读者找「免打扰时段」时只能从头扫到第 12 项，完全没有跳过无关区域的入口。",
      build: () => [{ title: "全部设置（18）", tone: "mono", items: ITEMS.map((x) => x.name) }],
    },
    "2": {
      n: 2,
      status: "粗分组 · 仍偏长",
      gaugePct: 58,
      gaugeState: "warn",
      note: "分成 2 大块后能立刻砍掉一半搜索范围，但每块仍有 9 项偏长，组内扫描成本还不够轻。",
      build: () => [
        { title: "账号与系统（9）", tone: "navy", items: ITEMS.filter((x) => x.g2 === "账号与系统").map((x) => x.name) },
        { title: "通知与数据（9）", tone: "green", items: ITEMS.filter((x) => x.g2 === "通知与数据").map((x) => x.name) },
      ],
    },
    "4": {
      n: 4,
      status: "4 组舒适区（Cowan 约 4 组块）",
      gaugePct: 100,
      gaugeState: "ok",
      note: "正好 4 个语义清晰的模块、每组 4–5 项。一眼先锁定「消息与通知」入口，再在 4 项里直接点中目标，与 126 原海报的四组结构同频。",
      build: () => {
        const order = ["账号与安全", "外观与阅读", "消息与通知", "存储与导出"];
        return order.map((title, i) => ({
          title,
          tone: COLORS4[i],
          items: ITEMS.filter((x) => x.g4 === title).map((x) => x.name),
        }));
      },
    },
    "7": {
      n: 7,
      status: "偏碎 · 接近上限",
      gaugePct: 48,
      gaugeState: "warn",
      note: "拆成 7 个小节后，标题本身占去大量空间，眼睛需要在 7 个几乎同级的标签之间反复来回确认。",
      build: () => [
        { title: "密码验证", tone: "orange", items: ["登录密码", "两步验证"] },
        { title: "身份设备", tone: "orange", items: ["绑定手机", "设备管理"] },
        { title: "视觉呈现", tone: "green", items: ["深浅主题", "字号缩放", "减少动效"] },
        { title: "本地操作", tone: "green", items: ["界面语言", "快捷键表"] },
        { title: "即时提醒", tone: "navy", items: ["桌面提醒", "评论回复"] },
        { title: "定时静默", tone: "navy", items: ["邮件摘要", "免打扰时段"] },
        { title: "存储与隐私", tone: "pink", items: ["自动备份", "缓存清理", "导出归档", "云端同步", "隐私权限"] },
      ],
    },
    "12": {
      n: 12,
      status: "碎片过载 · 退化回散点",
      gaugePct: 22,
      gaugeState: "bad",
      note: "过度分组的典型反效果：12 个零碎小卡片远远超出约 4 个工作记忆容量，分组不但没减负，反而制造了 12 道视觉障碍。",
      build: () => {
        const sizes = [2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2];
        const groups = [];
        let cursor = 0;
        sizes.forEach((len, idx) => {
          groups.push({
            title: `小类 ${idx + 1}`,
            tone: COLORS4[idx % 4],
            items: ITEMS.slice(cursor, cursor + len).map((x) => x.name),
          });
          cursor += len;
        });
        return groups;
      },
    },
  };

  function render(stepKey) {
    const cfg = STEPS[stepKey] || STEPS["4"];
    const blocks = cfg.build();
    container.dataset.cols = String(cfg.n === 1 ? 1 : cfg.n === 2 ? 2 : cfg.n === 4 ? 4 : 3);
    container.innerHTML = "";
    for (const b of blocks) {
      const card = document.createElement("div");
      card.className = `chunk-card tone-${b.tone}`;
      const h = document.createElement("p");
      h.className = "chunk-card-h";
      h.textContent = b.title;
      const ul = document.createElement("ul");
      ul.className = "chunk-card-list";
      for (const name of b.items) {
        const li = document.createElement("li");
        li.textContent = name;
        ul.append(li);
      }
      card.append(h, ul);
      container.append(card);
    }
    countEl.textContent = `${cfg.n} 组`;
    statusEl.textContent = cfg.status;
    statusEl.dataset.state = cfg.gaugeState;
    noteEl.textContent = cfg.note;
    gaugeFill.style.width = `${cfg.gaugePct}%`;
    gaugeFill.dataset.state = cfg.gaugeState;
    for (const b of btns) {
      b.setAttribute("aria-pressed", String(b.dataset.chunkStep === stepKey));
    }
  }

  for (const b of btns) {
    b.addEventListener("click", () => render(b.dataset.chunkStep));
  }
  render("4");
}

// =========================================================================
// 05 节：三套真实版式未分组 ↔ 群组改稿翻面与标尺叠层
// =========================================================================
export function initRefactorShowcase() {
  const tabBtns = [...document.querySelectorAll("[data-case]")];
  const stateBtn = document.getElementById("refactor-toggle");
  const rulerBtn = document.getElementById("refactor-ruler");
  const canvas = document.getElementById("refactor-stage");
  const captionEl = document.getElementById("refactor-caption");
  if (!canvas) return;

  const CASES = {
    schedule: {
      rawTitle: "未分组原稿：10 条日程等距平铺，上午下午与场地混成一列",
      groupedTitle: "群组改稿：按时段分 3 组（组内 6px / 组间 24px），无需加粗黑框也能一秒扫清",
      groups: [
        { tag: "上午 · 主报告厅", tone: "orange", rows: [["09:30", "开场致辞与主题发布"], ["10:20", "字体排印的几何结构"], ["11:15", "瑞士网格的百年流变"]] },
        { tag: "下午 · 工作坊 A", tone: "green", rows: [["14:00", "信息层级与版面留白"], ["15:10", "多语种排版的视觉平衡"], ["16:20", "界面组件的模块化分组"]] },
        { tag: "晚间 · 展厅对谈", tone: "navy", rows: [["19:00", "独立出版物现场拆解"], ["20:00", "自由交流与签售"]] },
      ],
    },
    specs: {
      rawTitle: "未分组原稿：核心参数与次要配件混排，买家找不到关键对比项",
      groupedTitle: "群组改稿：画质 / 镜头 / 续航 3 块模块加 3.2× 组间通道，参数扫描效率倍增",
      groups: [
        { tag: "成像核心", tone: "navy", rows: [["传感器", "全画幅 3300 万像素"], ["原生感光", "ISO 100 – 51200"], ["动态范围", "15 档 RAW 输出"]] },
        { tag: "对焦与连拍", tone: "orange", rows: [["相位对焦", "759 点覆盖"], ["连拍速度", "每秒 10 张"]] },
        { tag: "机身与续航", tone: "green", rows: [["机身净重", "658 克镁合金"], ["单电续航", "约 580 张"]] },
      ],
    },
    catalog: {
      rawTitle: "未分组原稿：期刊栏目名、作者与页码平级堆砌，翻阅毫无节奏",
      groupedTitle: "群组改稿：专题 / 访谈 / 索引三模块分色分距，建立鲜明目录入口",
      groups: [
        { tag: "封面专题", tone: "orange", rows: [["P.08", "看不见的视觉秩序"], ["P.24", "四组块记忆的版面实验"]] },
        { tag: "工作室访谈", tone: "green", rows: [["P.46", "苏黎世活字工坊纪行"], ["P.62", "报纸如何在一页容纳三十条新闻"]] },
        { tag: "工具书索引", tone: "pink", rows: [["P.84", "格式塔原则对照年表"], ["P.96", "延伸书单与馆藏目录"]] },
      ],
    },
  };

  let activeCase = "schedule";
  let isGrouped = true;
  let showRuler = false;

  function render() {
    const data = CASES[activeCase];
    canvas.dataset.grouped = String(isGrouped);
    canvas.dataset.ruler = String(showRuler);
    canvas.innerHTML = "";

    if (!isGrouped) {
      const flat = document.createElement("div");
      flat.className = "rf-flat";
      for (const g of data.groups) {
        for (const [k, v] of g.rows) {
          const row = document.createElement("div");
          row.className = "rf-row";
          row.innerHTML = `<span class="rf-k">${k}</span><span class="rf-v">${v}</span><span class="rf-meta-raw">${g.tag}</span>`;
          flat.append(row);
        }
      }
      canvas.append(flat);
    } else {
      const wrap = document.createElement("div");
      wrap.className = "rf-grouped";
      data.groups.forEach((g, idx) => {
        if (idx > 0 && showRuler) {
          const alley = document.createElement("div");
          alley.className = "rf-alley-ruler";
          alley.innerHTML = `<span>组间通道 24px（3.0× 组内距）</span>`;
          wrap.append(alley);
        }
        const blk = document.createElement("div");
        blk.className = `rf-block tone-${g.tone}`;
        const h = document.createElement("div");
        h.className = "rf-block-h";
        h.textContent = g.tag;
        blk.append(h);
        for (const [k, v] of g.rows) {
          const row = document.createElement("div");
          row.className = "rf-row";
          row.innerHTML = `<span class="rf-k">${k}</span><span class="rf-v">${v}</span>`;
          blk.append(row);
        }
        wrap.append(blk);
      });
      canvas.append(wrap);
    }

    captionEl.textContent = isGrouped ? data.groupedTitle : data.rawTitle;
    stateBtn.textContent = isGrouped ? "切回：未分组原稿" : "切到：群组改稿";
    stateBtn.setAttribute("aria-pressed", String(isGrouped));
    rulerBtn.textContent = showRuler ? "组距标尺：开" : "组距标尺：关";
    rulerBtn.setAttribute("aria-pressed", String(showRuler));
    for (const b of tabBtns) {
      b.setAttribute("aria-pressed", String(b.dataset.case === activeCase));
    }
  }

  for (const b of tabBtns) {
    b.addEventListener("click", () => {
      activeCase = b.dataset.case;
      render();
    });
  }
  stateBtn?.addEventListener("click", () => {
    isGrouped = !isGrouped;
    render();
  });
  rulerBtn?.addEventListener("click", () => {
    showRuler = !showRuler;
    render();
  });
  render();
}

// =========================================================================
// 06 节（深松绿暗室）：4 类「别硬用群组构图」决策卡
// =========================================================================
export function initAvoidDeck() {
  const btns = [...document.querySelectorAll("[data-avoid]")];
  const svg = document.getElementById("avoid-svg");
  const badTitle = document.getElementById("avoid-bad");
  const goodTitle = document.getElementById("avoid-good");
  const reasonEl = document.getElementById("avoid-reason");
  if (!svg) return;

  const DECK = {
    gallery: {
      bad: "强行按色系硬切四组：打断自由发现与并置对话",
      good: "改用等权呼吸网格：让每幅摄影彼此平等呼吸",
      reason: "摄影画廊、艺术图集需要观者在作品之间自由游走比较；如果按颜色或尺寸强行画块隔离，反而像货架分类一样折损观看情绪。",
      draw(el) {
        // 左：强行色块分组（生硬） | 右：呼吸图集
        drawMiniSplit(el, "强行硬分组", "平等图集网格", (x, y, w, h) => {
          const colors = ["#FF8A4C", "#89E6AA", "#9EC2FF", "#FFA8C8"];
          for (let i = 0; i < 4; i++) {
            const gx = x + (i % 2) * (w * 0.54);
            const gy = y + Math.floor(i / 2) * (h * 0.54);
            el.append(svgEl("rect", { x: gx, y: gy, width: w * 0.44, height: h * 0.42, fill: "none", stroke: colors[i], "stroke-width": 1.6, "stroke-dasharray": "3 2" }));
            el.append(svgEl("rect", { x: gx + 5, y: gy + 5, width: w * 0.16, height: h * 0.28, fill: colors[i], opacity: 0.85 }));
            el.append(svgEl("rect", { x: gx + w * 0.24, y: gy + 5, width: w * 0.15, height: h * 0.28, fill: colors[i], opacity: 0.55 }));
          }
        }, (x, y, w, h) => {
          const cols = 3;
          const rows = 2;
          const gap = 8;
          const cw = (w - gap * (cols - 1)) / cols;
          const ch = (h - gap * (rows - 1)) / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              el.append(svgEl("rect", {
                x: x + c * (cw + gap), y: y + r * (ch + gap), width: cw, height: ch,
                fill: "rgba(251,248,242,0.16)", stroke: "#89E6AA", "stroke-width": 1.2,
              }));
            }
          }
        });
      },
    },
    essay: {
      bad: "每两句话就硬拆模块加色签：把长文撕成碎片",
      good: "保留单一流畅正文栏：仅靠段落空行自然换气",
      reason: "小说、特稿与深度评论依靠连续的叙述流。过度模块化和分色标签会逼迫读者像刷表单一样频繁刹车，彻底破坏沉浸感。",
      draw(el) {
        drawMiniSplit(el, "碎切卡片化", "连贯阅读栏", (x, y, w, h) => {
          const ys = [0, 0.34, 0.68];
          const cols = ["#FF8A4C", "#9EC2FF", "#FFA8C8"];
          ys.forEach((f, i) => {
            el.append(svgEl("rect", { x, y: y + h * f, width: w, height: h * 0.26, rx: 3, fill: "rgba(255,255,255,0.08)", stroke: cols[i], "stroke-width": 1.2 }));
            el.append(svgEl("rect", { x: x + 8, y: y + h * f + 9, width: w * 0.62, height: 5, fill: cols[i] }));
            el.append(svgEl("rect", { x: x + 8, y: y + h * f + 20, width: w * 0.8, height: 4, fill: "rgba(251,248,242,0.45)" }));
          });
        }, (x, y, w, h) => {
          const px = x + w * 0.14;
          const pw = w * 0.72;
          for (let i = 0; i < 8; i++) {
            const extra = i >= 4 ? 10 : 0;
            const lw = i === 3 || i === 7 ? pw * 0.65 : pw;
            el.append(svgEl("rect", {
              x: px, y: y + 8 + i * 14 + extra, width: lw, height: 5,
              fill: i === 0 ? "#89E6AA" : "rgba(251,248,242,0.68)",
            }));
          }
        });
      },
    },
    chaos: {
      bad: "整齐划一的四方块：把抗议与噪点情绪磨平了",
      good: "改用满幅压迫或错位叠加：让形式服务情绪张力",
      reason: "当海报主题本身就是「拥挤、失控、喧嚣」时，瑞士式的冷静分组会把戏剧冲突收拾得过于乖巧，反而背离表达目的。",
      draw(el) {
        drawMiniSplit(el, "过分乖巧规整", "情绪化满幅张力", (x, y, w, h) => {
          for (let i = 0; i < 4; i++) {
            el.append(svgEl("rect", {
              x: x + (i % 2) * (w * 0.54), y: y + Math.floor(i / 2) * (h * 0.54),
              width: w * 0.42, height: h * 0.40, fill: "rgba(251,248,242,0.22)",
            }));
          }
        }, (x, y, w, h) => {
          el.append(svgEl("rect", { x: x + 4, y: y + 10, width: w * 0.72, height: h * 0.58, fill: "#FF8A4C", opacity: 0.85, transform: `rotate(-7 ${x + w / 2} ${y + h / 2})` }));
          el.append(svgEl("circle", { cx: x + w * 0.68, cy: y + h * 0.62, r: h * 0.34, fill: "#89E6AA", opacity: 0.82 }));
          el.append(svgEl("rect", { x: x + w * 0.16, y: y + h * 0.42, width: w * 0.68, height: 14, fill: "#FBF8F2" }));
        });
      },
    },
    minimal: {
      bad: "只有 3 个元素还要划区加色标：画蛇添足",
      good: "直接做极简大留白：用 122 简化构图一步到位",
      reason: "群组构图是为「数量偏多、类别不止一种」的画面减负的。全页总共只有主标题、副标与一张图时，强行套群组框架只会徒增视觉噪音。",
      draw(el) {
        drawMiniSplit(el, "3 件硬套组框", "直接留白聚焦", (x, y, w, h) => {
          el.append(svgEl("rect", { x, y, width: w, height: h * 0.28, fill: "none", stroke: "#FF8A4C", "stroke-width": 1.3 }));
          el.append(svgEl("rect", { x, y: y + h * 0.36, width: w, height: h * 0.34, fill: "none", stroke: "#9EC2FF", "stroke-width": 1.3 }));
          el.append(svgEl("rect", { x, y: y + h * 0.76, width: w, height: h * 0.22, fill: "none", stroke: "#FFA8C8", "stroke-width": 1.3 }));
          el.append(svgEl("rect", { x: x + 10, y: y + 12, width: w * 0.5, height: 8, fill: "#FF8A4C" }));
          el.append(svgEl("circle", { cx: x + w / 2, cy: y + h * 0.53, r: 12, fill: "#9EC2FF" }));
          el.append(svgEl("rect", { x: x + 10, y: y + h * 0.84, width: w * 0.36, height: 6, fill: "#FFA8C8" }));
        }, (x, y, w, h) => {
          el.append(svgEl("circle", { cx: x + w / 2, cy: y + h * 0.44, r: 22, fill: "#89E6AA" }));
          el.append(svgEl("rect", { x: x + w * 0.24, y: y + h * 0.78, width: w * 0.52, height: 8, fill: "#FBF8F2" }));
        });
      },
    },
  };

  function drawMiniSplit(el, leftLbl, rightLbl, drawLeft, drawRight) {
    el.innerHTML = "";
    const W = 520;
    const H = 190;
    const pad = 16;
    const panelW = (W - pad * 3) / 2;
    const panelY = 30;
    const panelH = H - panelY - 14;

    // 左框（不推荐）
    el.append(svgEl("rect", { x: pad, y: panelY, width: panelW, height: panelH, rx: 4, fill: "rgba(255,255,255,0.03)", stroke: "rgba(255,135,135,0.5)", "stroke-width": 1.2 }));
    const tL = svgEl("text", { x: pad, y: 20, fill: "#FF9E9E", "font-size": 12, "font-weight": 700, "font-family": '"Noto Sans SC", sans-serif' });
    tL.textContent = `× ${leftLbl}`;
    el.append(tL);
    drawLeft(pad + 14, panelY + 12, panelW - 28, panelH - 24);

    // 右框（更合适）
    const rx = pad * 2 + panelW;
    el.append(svgEl("rect", { x: rx, y: panelY, width: panelW, height: panelH, rx: 4, fill: "rgba(137,230,170,0.06)", stroke: "rgba(137,230,170,0.55)", "stroke-width": 1.2 }));
    const tR = svgEl("text", { x: rx, y: 20, fill: "#89E6AA", "font-size": 12, "font-weight": 700, "font-family": '"Noto Sans SC", sans-serif' });
    tR.textContent = `✓ ${rightLbl}`;
    el.append(tR);
    drawRight(rx + 14, panelY + 12, panelW - 28, panelH - 24);
  }

  function show(key) {
    const item = DECK[key];
    item.draw(svg);
    badTitle.textContent = item.bad;
    goodTitle.textContent = item.good;
    reasonEl.textContent = item.reason;
    for (const b of btns) b.setAttribute("aria-pressed", String(b.dataset.avoid === key));
  }

  for (const b of btns) {
    b.addEventListener("click", () => show(b.dataset.avoid));
  }
  show("gallery");
}

// =========================================================================
// 07 节：四选一单变量测验（中性标签 A/B/C/D，只变群组与间距组织）
// =========================================================================
export function initQuiz() {
  const opts = [...document.querySelectorAll("[data-quiz]")];
  const fb = document.getElementById("quiz-feedback");
  if (!opts.length || !fb) return;

  // 在四个选项的 SVG 里精确绘制同一批 16 枚日程徽标（4 朱橘方 / 4 深绿圆 / 4 深蓝方 / 4 玫瑰粉圆）
  const specs = {
    A: {
      // 陷阱 A：色形已归位，但 4x4 等距无通道（距比 1.0x）
      draw(svg) {
        const s = 20;
        const g = 7;
        const ox = (180 - (4 * s + 3 * g)) / 2;
        const oy = (130 - (4 * s + 3 * g)) / 2;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const q = (r < 2 ? 0 : 2) + (c < 2 ? 0 : 1);
            drawToken(svg, ox + c * (s + g), oy + r * (s + g), s, q);
          }
        }
      },
      correct: false,
      title: "方案 A：色形归位了，但缺少组间通道",
      body: "虽然四个象限各自颜色和形状一致，可所有元素之间保持 1.0× 等距，没有拉开组间通道。视线进入后仍感到是一块 4×4 的大网格，分组层次不够明快。正确答案是方案 C。",
    },
    B: {
      // 陷阱 B：有清晰的 2.4x 组间通道，但颜色和形状跨组互窜（线索打架）
      draw(svg) {
        const s = 18;
        const intra = 5;
        const inter = 20;
        const block = 2 * s + intra;
        const ox = (180 - (2 * block + inter)) / 2;
        const oy = (130 - (2 * block + inter)) / 2;
        const mix = [
          [0, 1, 3, 2],
          [1, 0, 2, 3],
          [2, 3, 0, 1],
          [3, 2, 1, 0],
        ];
        for (let q = 0; q < 4; q++) {
          const bx = ox + (q % 2) * (block + inter);
          const by = oy + Math.floor(q / 2) * (block + inter);
          for (let i = 0; i < 4; i++) {
            drawToken(svg, bx + (i % 2) * (s + intra), by + Math.floor(i / 2) * (s + intra), s, mix[q][i]);
          }
        }
      },
      correct: false,
      title: "方案 B：通道清楚，但色形跨组互相拆台",
      body: "组与组之间确实拉开了呼吸走廊，但每个块里都混入了其他组的颜色与形状。空间说「它们是一组」，色彩和形状却把眼睛跨区拉走，产生线索冲突。正确答案是方案 C。",
    },
    C: {
      // 正确答案 C：清晰组间通道 + 组内颜色与形状同向一致，形成 4 个清晰模块
      draw(svg) {
        const s = 18;
        const intra = 5;
        const inter = 22;
        const block = 2 * s + intra;
        const ox = (180 - (2 * block + inter)) / 2;
        const oy = (130 - (2 * block + inter)) / 2;
        for (let q = 0; q < 4; q++) {
          const bx = ox + (q % 2) * (block + inter);
          const by = oy + Math.floor(q / 2) * (block + inter);
          for (let i = 0; i < 4; i++) {
            drawToken(svg, bx + (i % 2) * (s + intra), by + Math.floor(i / 2) * (s + intra), s, q);
          }
        }
      },
      correct: true,
      title: "答对了！方案 C 让颜色、形状与组间通道同向发力",
      body: "四个主题恰好对应 4 个紧凑模块（正好落在约 4 个工作记忆组块内）：组内紧靠抱团、组间留出明显走廊，且颜色与形状完全对齐不打架，一秒就能读清整体架构。",
    },
    D: {
      // 陷阱 D：色形一致，但被拆散成 8 个 2 枚小碎条
      draw(svg) {
        const s = 14;
        const intra = 4;
        const bw = 2 * s + intra;
        const gx = 16;
        const gy = 18;
        const ox = (180 - (4 * bw + 3 * gx) * 0.72) / 2;
        const coords = [
          [14, 18, 0], [64, 18, 0], [116, 18, 1], [116, 48, 1],
          [14, 62, 2], [64, 78, 2], [116, 86, 3], [14, 96, 3],
        ];
        void ox; void gx; void gy;
        for (const [x, y, q] of coords) {
          drawToken(svg, x, y, s, q);
          drawToken(svg, x + s + intra, y, s, q);
        }
      },
      correct: false,
      title: "方案 D：同主题被拆碎成 8 个小条，组数过载",
      body: "虽然单条内色形统一，但 4 个主题被硬切成 8 个零散小条且排布参差，数量超过了工作记忆的舒适组块上限，眼睛反而要先费力拼回原本的 4 组。正确答案是方案 C。",
    },
  };

  function drawToken(svg, x, y, s, q) {
    const palette = [PALETTE.orange, PALETTE.green, PALETTE.navy, PALETTE.pink];
    const isCircle = q === 1 || q === 3;
    if (isCircle) {
      svg.append(svgEl("circle", { cx: x + s / 2, cy: y + s / 2, r: s / 2, fill: palette[q] }));
    } else {
      svg.append(svgEl("rect", { x, y, width: s, height: s, fill: palette[q] }));
    }
  }

  for (const btn of opts) {
    const key = btn.dataset.quiz;
    const svg = btn.querySelector("svg");
    if (svg && specs[key]) specs[key].draw(svg);

    btn.addEventListener("click", () => {
      const sp = specs[key];
      for (const b of opts) {
        b.classList.remove("is-picked", "is-right", "is-wrong");
        b.setAttribute("aria-pressed", String(b === btn));
        if (b.dataset.quiz === "C") b.classList.add("is-right");
      }
      btn.classList.add("is-picked", sp.correct ? "is-right" : "is-wrong");
      fb.hidden = false;
      fb.dataset.state = sp.correct ? "ok" : "bad";
      fb.innerHTML = `<p class="quiz-fb-title">${sp.title}</p><p class="quiz-fb-body">${sp.body}</p>`;
    });
  }
}

// =========================================================================
// 原海报放大、拖动、Esc 关闭灯箱（单次引用 #poster.src，绝不重复内联）
// =========================================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const thumb = document.getElementById("poster");
  const dialog = document.getElementById("poster-dialog");
  const bigImg = document.getElementById("poster-big");
  const stage = document.getElementById("poster-zoom-stage");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomVal = document.getElementById("poster-zoom-val");
  if (!trigger || !thumb || !dialog || !bigImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomVal) zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!bigImg.getAttribute("src")) bigImg.src = thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      close();
    }
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.35);
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3.5, scale + (e.deltaY < 0 ? 0.18 : -0.18)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    stage.style.cursor = "grabbing";
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  stage.addEventListener("pointerup", (e) => {
    dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
    stage.style.cursor = "grab";
  });
}
