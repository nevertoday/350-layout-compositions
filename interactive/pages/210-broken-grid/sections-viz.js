// 210 破格网格 — 正文 01–06 节独立交互可视化模块（相邻两节无重复控件）

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

/* ================= 01 节：双栏底格显影推杆（2D Canvas） ================= */
export function mountXrayLab() {
  const canvas = document.getElementById("xray-canvas");
  const range = document.getElementById("xray-range");
  const readout = document.getElementById("xray-readout");
  const note = document.getElementById("xray-note");
  const quickBtns = [...document.querySelectorAll("[data-xray]")];
  if (!canvas || !range) return;

  const ctx = canvas.getContext("2d");
  let reveal = Number(range.value) / 100;

  function drawPanel(x0, y0, w, h, kind, splitX) {
    const pad = Math.max(12, w * 0.06);
    const gx0 = x0 + pad;
    const gy0 = y0 + pad + 18;
    const gw = w - pad * 2;
    const gh = h - pad * 2 - 22;
    const cols = 6;
    const rows = 5;
    const cw = gw / cols;
    const ch = gh / rows;

    // 卡片底
    ctx.fillStyle = PALETTE.paperBright;
    ctx.fillRect(x0, y0, w, h);

    // 顶标签（窄屏自动简写，绝不溢出）
    ctx.fillStyle = kind === "good" ? PALETTE.ink : PALETTE.err;
    ctx.font = `700 ${w < 220 ? 11 : 12}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const headTxt =
      w < 230
        ? kind === "good"
          ? "A · 真破格（6×5 底格）"
          : "B · 随手乱排（无底格）"
        : kind === "good"
          ? "A · 真破格（隐含 6×5 严格底格）"
          : "B · 随手乱排（无底层共享基准）";
    ctx.fillText(headTxt, gx0, y0 + 8, gw);

    // 版面元素（先绘表面成品）
    if (kind === "good") {
      // 严守左起 col 0 的栏头、正文块与脚标
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(gx0, gy0, cw * 3, ch * 0.52);
      ctx.fillStyle = PALETTE.grayBar;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(gx0, gy0 + ch * (1.2 + i * 0.42), cw * 2, ch * 0.22);
      }
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(gx0, gy0 + ch * 3.5, cw * 2, ch * 1.5);
      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(gx0 + cw * 4, gy0 + ch * 4, cw * 2, ch * 1);
      // 唯一干脆破格：主朱红图块从 col 2.5 跨到 col 6.25 越出右界
      ctx.fillStyle = PALETTE.red;
      ctx.fillRect(gx0 + cw * 2.55, gy0 + ch * 0.85, cw * 3.68, ch * 2.3);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `400 ${Math.max(14, Math.round(ch * 0.72))}px "Anton", sans-serif`;
      ctx.fillText("BREAK", gx0 + cw * 2.8, gy0 + ch * 1.45);
    } else {
      // 看似同样有红黑蓝块，但每块坐标和宽度全是无关联散数
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(gx0 + cw * 0.31, gy0 + ch * 0.14, cw * 2.42, ch * 0.55);
      ctx.fillStyle = PALETTE.grayBar;
      ctx.fillRect(gx0 + cw * 0.18, gy0 + ch * 1.35, cw * 1.85, ch * 0.24);
      ctx.fillRect(gx0 + cw * 0.56, gy0 + ch * 1.82, cw * 1.9, ch * 0.24);
      ctx.fillRect(gx0 + cw * 0.08, gy0 + ch * 2.31, cw * 1.72, ch * 0.24);
      ctx.fillStyle = PALETTE.ink;
      ctx.save();
      ctx.translate(gx0 + cw * 1.45, gy0 + ch * 4.05);
      ctx.rotate(-0.11);
      ctx.fillRect(-cw * 0.95, -ch * 0.65, cw * 1.9, ch * 1.3);
      ctx.restore();
      ctx.fillStyle = PALETTE.blue;
      ctx.fillRect(gx0 + cw * 3.65, gy0 + ch * 3.72, cw * 1.75, ch * 0.92);
      ctx.fillStyle = PALETTE.red;
      ctx.save();
      ctx.translate(gx0 + cw * 4.1, gy0 + ch * 1.92);
      ctx.rotate(0.14);
      ctx.fillRect(-cw * 1.65, -ch * 0.95, cw * 3.3, ch * 1.9);
      ctx.restore();
    }

    // 显影层：从左到 splitX 刮出 6×5 底层格线与贴格蓝点 / 失齐红叉
    const revealW = Math.max(0, Math.min(w, splitX - x0));
    if (revealW > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, revealW, h);
      ctx.clip();

      ctx.fillStyle = "rgba(15, 68, 235, 0.05)";
      ctx.fillRect(gx0, gy0, gw, gh);

      ctx.strokeStyle = kind === "good" ? "rgba(15, 68, 235, 0.55)" : "rgba(180, 30, 18, 0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      for (let c = 0; c <= cols; c++) {
        const lx = Math.round(gx0 + c * cw) + 0.5;
        ctx.beginPath();
        ctx.moveTo(lx, gy0);
        ctx.lineTo(lx, gy0 + gh);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const ly = Math.round(gy0 + r * ch) + 0.5;
        ctx.beginPath();
        ctx.moveTo(gx0, ly);
        ctx.lineTo(gx0 + gw, ly);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      if (kind === "good") {
        // 标注贴合在 col 0 左基准线的 4 处锚点（蓝实心圆）
        ctx.fillStyle = PALETTE.blue;
        for (const ry of [0, 1.2, 3.5, 5]) {
          ctx.beginPath();
          ctx.arc(gx0, gy0 + ry * ch, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // 高亮共享对齐基线
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(gx0, gy0);
        ctx.lineTo(gx0, gy0 + gh);
        ctx.stroke();
      } else {
        // 标注每一块脱节未贴线的红叉
        ctx.strokeStyle = PALETTE.err;
        ctx.lineWidth = 2;
        const misses = [
          [0.31, 0.14],
          [0.18, 1.35],
          [0.56, 1.82],
          [3.65, 3.72],
        ];
        for (const [mx, my] of misses) {
          const px = gx0 + mx * cw;
          const py = gy0 + my * ch;
          ctx.beginPath();
          ctx.moveTo(px - 4, py - 4);
          ctx.lineTo(px + 4, py + 4);
          ctx.moveTo(px + 4, py - 4);
          ctx.lineTo(px - 4, py + 4);
          ctx.stroke();
        }
      }

      // 显影统计角标
      const pillTxt = kind === "good" ? "5/6 边缘贴格 · 1 块越界" : "0 根共享对齐基准线";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(pillTxt).width + 14;
      ctx.fillStyle = kind === "good" ? PALETTE.blue : PALETTE.err;
      ctx.fillRect(gx0, y0 + h - 24, tw, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(pillTxt, gx0 + 7, y0 + h - 14);
      ctx.restore();
    }
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const half = w / 2;
    const splitLeft = reveal * half;
    const splitRight = half + reveal * half;

    drawPanel(0, 0, half - 1, h, "good", splitLeft);
    drawPanel(half + 1, 0, half - 1, h, "bad", splitRight);

    // 中缝纯黑隔线
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(half - 1, 0, 2, h);

    // 同步双显影红蓝推线
    for (const sx of [splitLeft, splitRight]) {
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function syncUI() {
    const pct = Math.round(reveal * 100);
    readout.textContent = `显影进度 ${pct}%`;
    if (pct < 15) {
      note.textContent = "关掉底层显影线时，两张图看起来都有大红块与错落排版——把滑块往右推，掀开它们背后的结构真相。";
    } else if (pct < 85) {
      note.textContent = "仔细看蓝色基准线：左版几乎所有正文与边栏都紧贴第 1 列左轴，只放红块破界；右版每块各偏各的，底格显影后立刻露馅。";
    } else {
      note.textContent = "100% 透视结果：左版 5/6 边缘严守 6×5 模数，破格显得克制而锐利；右版零共享对齐线，属于“没建格就乱摆”。";
    }
    render();
  }

  range.addEventListener("input", () => {
    reveal = Number(range.value) / 100;
    syncUI();
  });
  for (const btn of quickBtns) {
    btn.addEventListener("click", () => {
      range.value = btn.dataset.xray;
      reveal = Number(range.value) / 100;
      syncUI();
    });
  }
  window.addEventListener("resize", render);
  syncUI();
}

/* ================= 02 节：四种破格招式 CSS Grid 蓝图 ================= */
const MOVES_DATA = {
  span: {
    name: "跨越栏线",
    title: "跨越栏线 · 放大单个焦点的轨道跨度",
    body: "原本正文与图块各守 2 栏；只把核心标题或主图扩成跨越 4 栏的通带，其余辅栏继续贴紧原列线。不需要歪斜，仅靠尺度断层就拉出了第一视线落点。",
    code: `.layout {\n  display: grid;\n  grid-template-columns: repeat(6, 1fr);\n}\n.focal {\n  grid-column: 1 / 5; /* 跨越 4 栏 */\n}`,
    caution: "留意：跨栏后保持至少一侧边线与下方辅栏对齐，眼睛才能感受到“它是从这套格子里长出来的”。",
    svgBroken: `
      <rect x="20" y="22" width="234" height="58" fill="#FB410D"/>
      <text x="32" y="58" fill="#FFFFFF" font-family="Anton, sans-serif" font-size="24" letter-spacing="1">SPAN 4 COLS</text>
      <rect x="20" y="96" width="110" height="72" fill="#010101"/>
      <rect x="144" y="96" width="110" height="72" fill="#C9C9C7"/>
      <rect x="268" y="22" width="110" height="146" fill="#0F44EB"/>`,
  },
  offset: {
    name: "错位偏移",
    title: "错位偏移 · 让一块元素横向滑出半格台阶",
    body: "保持全部矩形横平竖直、尺寸不变，只把关键模块沿水平或垂直方向推离格线半个栏宽。错出的阶梯缝隙会立刻把视线拉过去，非常适合冷静克制的建筑与书籍版面。",
    code: `.focal {\n  grid-column: 3 / 5;\n  transform: translateX(-32%); /* 干脆错出半栏，不做微偏 */\n}`,
    caution: "留意：偏移量一定要超过四分之一栏宽；只移几个像素会被当成手抖没对齐。",
    svgBroken: `
      <rect x="20" y="22" width="110" height="62" fill="#010101"/>
      <rect x="20" y="98" width="110" height="70" fill="#C9C9C7"/>
      <rect x="108" y="54" width="146" height="72" fill="#FB410D"/>
      <text x="120" y="98" fill="#FFFFFF" font-family="Anton, sans-serif" font-size="22" letter-spacing="1">OFFSET -0.5</text>
      <rect x="268" y="22" width="110" height="146" fill="#0F44EB"/>`,
  },
  extend: {
    name: "延伸越界",
    title: "延伸越界 · 冲破网格外框直抵纸边出血",
    body: "其余图文稳稳留在安全页边距内，唯独一张主图或标志性色块击穿外框虚线直达边缘（类似 210 原海报右上的大朱红圆）。内敛边界与冲出边缘形成强反差。",
    code: `.focal {\n  grid-column: 4 / -1;\n  margin-right: -28px; /* 突破容器右界向页边延伸 */\n}`,
    caution: "留意：网页端向页边延伸时务必给父容器加 overflow-x: clip，避免撑出横向滚动条。",
    svgBroken: `
      <rect x="20" y="22" width="110" height="62" fill="#010101"/>
      <rect x="20" y="98" width="234" height="70" fill="#C9C9C7"/>
      <rect x="144" y="22" width="110" height="62" fill="#0F44EB"/>
      <rect x="268" y="8" width="132" height="106" fill="#FB410D"/>
      <text x="280" y="68" fill="#FFFFFF" font-family="Anton, sans-serif" font-size="22" letter-spacing="1">BLEED →</text>`,
  },
  overlap: {
    name: "斜切叠压",
    title: "斜切叠压 · 用角度与前后层次刺穿平直网格",
    body: "210 原海报右中的纯黑斜块就是典型示范：在满屏 90° 垂直虚线里，只给一块无字视觉体块施加 12°–20° 倾角并轻触邻块边缘，立刻制造前后纵深与动势。",
    code: `.focal {\n  grid-column: 4 / 7; grid-row: 1 / 3;\n  transform: rotate(16deg); z-index: 2;\n}`,
    caution: "留意：优先斜切纯图形或照片，慎斜切长段正文；叠压面积只取边角，绝不遮盖文字区。",
    svgBroken: `
      <rect x="20" y="22" width="110" height="62" fill="#0F44EB"/>
      <rect x="20" y="98" width="170" height="70" fill="#C9C9C7"/>
      <rect x="144" y="114" width="128" height="54" fill="#FB410D"/>
      <g transform="rotate(16 322 92)">
        <rect x="264" y="20" width="116" height="140" fill="#010101"/>
        <text x="276" y="98" fill="#F7F4EC" font-family="Anton, sans-serif" font-size="21" letter-spacing="1">TILT +16°</text>
      </g>`,
  },
};

const REGULAR_SVG_INNER = `
  <rect x="20" y="22" width="110" height="62" fill="#010101"/>
  <rect x="144" y="22" width="110" height="62" fill="#FB410D"/>
  <rect x="268" y="22" width="110" height="62" fill="#0F44EB"/>
  <rect x="20" y="98" width="110" height="70" fill="#C9C9C7"/>
  <rect x="144" y="98" width="110" height="70" fill="#C9C9C7"/>
  <rect x="268" y="98" width="110" height="70" fill="#C9C9C7"/>`;

export function mountMovesLab() {
  const tabs = [...document.querySelectorAll(".move-tab")];
  const svgBox = document.getElementById("moves-svg-box");
  const title = document.getElementById("move-title");
  const body = document.getElementById("move-body");
  const code = document.getElementById("move-code");
  const caution = document.getElementById("move-caution");
  const stateLabel = document.getElementById("move-state-label");
  const cmpBtn = document.getElementById("move-compare-btn");
  if (!svgBox || !tabs.length) return;

  let active = "span";
  let showRegular = false;

  function render() {
    const d = MOVES_DATA[active];
    title.textContent = d.title;
    body.textContent = d.body;
    code.textContent = showRegular
      ? `.layout {\n  display: grid;\n  grid-template-columns: repeat(6, 1fr);\n}\n/* 常规网格：各占 2 栏，无突破 */`
      : d.code;
    caution.textContent = d.caution;
    stateLabel.textContent = showRegular ? "当前：常规网格（对照基态）" : `当前：${d.name}（破格）`;
    cmpBtn.setAttribute("aria-pressed", String(showRegular));
    cmpBtn.textContent = showRegular ? "切回当前破格招式" : "切换看常规网格";

    const colsSvg = [20, 82, 144, 206, 268, 330, 378]
      .map((x) => `<line x1="${x}" y1="14" x2="${x}" y2="178" stroke="#969186" stroke-dasharray="4 4"/>`)
      .join("");
    const rowsSvg = [22, 91, 168]
      .map((y) => `<line x1="20" y1="${y}" x2="378" y2="${y}" stroke="#969186" stroke-dasharray="4 4"/>`)
      .join("");

    svgBox.innerHTML = `<svg viewBox="0 0 400 190" role="img" aria-label="${showRegular ? "常规网格" : d.name}结构示意">
      <rect x="0" y="0" width="400" height="190" fill="#F7F4EC"/>
      <rect x="20" y="22" width="358" height="146" fill="none" stroke="#8A867C" stroke-dasharray="4 4"/>
      ${colsSvg}${rowsSvg}
      ${showRegular ? REGULAR_SVG_INNER : d.svgBroken}
    </svg>`;
  }

  for (const t of tabs) {
    t.addEventListener("click", () => {
      active = t.dataset.move;
      showRegular = false;
      for (const b of tabs) {
        const on = b === t;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      }
      render();
    });
  }
  cmpBtn.addEventListener("click", () => {
    showRegular = !showRegular;
    render();
  });
  render();
}

/* ================= 03 节：纯黑暗室 破坏配额压力测试仪 ================= */
export function mountBudgetLab() {
  const canvas = document.getElementById("budget-canvas");
  const stepBtns = [...document.querySelectorAll("#budget-steps .step-pill")];
  const spaceRange = document.getElementById("budget-space");
  const countVal = document.getElementById("budget-count-val");
  const spaceVal = document.getElementById("budget-space-val");
  const verdict = document.getElementById("budget-verdict");
  const gradeEl = document.getElementById("bv-grade");
  const textEl = document.getElementById("bv-text");
  if (!canvas || !stepBtns.length) return;

  const ctx = canvas.getContext("2d");
  let breakN = 2;
  let negSpace = 36;

  // 8 个固定伪随机破格位移表（确保画面可复现且有真实渐进崩盘过程）
  const BREAK_VECTORS = [
    { dx: 0.28, dy: -0.14, scale: 1.22, rot: 0, color: PALETTE.red },
    { dx: -0.22, dy: 0.22, scale: 1.18, rot: 14, color: "#FF8761" },
    { dx: 0.34, dy: 0.24, scale: 1.15, rot: -16, color: PALETTE.blueDark },
    { dx: -0.35, dy: -0.14, scale: 1.14, rot: 18, color: PALETTE.red },
    { dx: 0.3, dy: -0.22, scale: 1.16, rot: -19, color: "#FF8761" },
    { dx: -0.28, dy: 0.28, scale: 1.15, rot: 21, color: PALETTE.blueDark },
    { dx: 0.38, dy: 0.22, scale: 1.18, rot: -15, color: PALETTE.red },
    { dx: -0.32, dy: -0.22, scale: 1.16, rot: 17, color: "#FF8761" },
  ];

  function clarityScore(n, sp) {
    // 经验倒 U 曲线（明确标注为示意）：1-2 块破格且留白 >=28% 处于高峰
    const baseByN = [36, 86, 94, 72, 46, 28, 18, 14, 10][n] ?? 15;
    const spacePenalty = sp < 26 ? (26 - sp) * 2.1 : sp > 46 ? (sp - 46) * 0.8 : 0;
    return Math.max(8, Math.min(96, baseByN - spacePenalty));
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(210, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0B0B09";
    ctx.fillRect(0, 0, w, h);

    const leftW = w * 0.6;
    const rightX = leftW + 12;
    const rightW = w - rightX - 12;

    // 左半：8 块版面网格模拟（顶部留足标题安全带，防止上移破格块撞字）
    const pad = 22;
    const gx0 = pad;
    const gy0 = pad + 34;
    const gw = leftW - pad * 2;
    const gh = h - gy0 - pad;
    const cols = 4;
    const rows = 2;
    const cw = gw / cols;
    const ch = gh / rows;

    // 底层细灰虚线网格
    ctx.strokeStyle = "rgba(247, 244, 236, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(gx0 + c * cw, gy0);
      ctx.lineTo(gx0 + c * cw, gy0 + gh);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(gx0, gy0 + r * ch);
      ctx.lineTo(gx0 + gw, gy0 + r * ch);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 留白收缩因子
    const insetRatio = 0.04 + ((negSpace - 10) / 42) * 0.22;
    const brokenCenters = [];

    for (let i = 0; i < 8; i++) {
      const c = i % 4;
      const r = Math.floor(i / 4);
      const isB = i < breakN;
      const v = BREAK_VECTORS[i];
      const bw = cw * (1 - insetRatio * 2) * (isB ? v.scale : 1);
      const bh = ch * (1 - insetRatio * 2) * (isB ? v.scale : 1);
      const cx = gx0 + (c + 0.5 + (isB ? v.dx : 0)) * cw;
      const cy = gy0 + (r + 0.5 + (isB ? v.dy : 0)) * ch;

      if (isB) brokenCenters.push([cx, cy]);

      ctx.save();
      ctx.translate(cx, cy);
      if (isB && v.rot) ctx.rotate((v.rot * Math.PI) / 180);
      ctx.fillStyle = isB ? v.color : "#2A2A24";
      ctx.strokeStyle = isB ? "#FFFFFF" : "#5E5D53";
      ctx.lineWidth = isB ? 1.5 : 1;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);

      ctx.fillStyle = isB ? "#FFFFFF" : "#CFCBC0";
      ctx.font = `700 11px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isB ? `B${i + 1}` : `0${i + 1}`, 0, 0);
      ctx.restore();
    }

    // 视线跳转虚线（示意：当破格超过 3 块时视线来回乱撞）
    if (brokenCenters.length > 1) {
      ctx.strokeStyle = brokenCenters.length <= 2 ? "#6CE2B2" : "#FF7D70";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      brokenCenters.forEach(([px, py], idx) => {
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const narrow = w < 460;
    ctx.fillStyle = "#D4D0C5";
    ctx.font = `700 ${narrow ? 10 : 11}px "Space Mono", monospace`;
    ctx.textAlign = "left";
    const leftTitle = narrow
      ? `8-GRID · ${breakN} BROKEN · ${negSpace}%`
      : `8-MODULE GRID · ${breakN} BROKEN · SPACE ${negSpace}%`;
    ctx.fillText(leftTitle, gx0, 18, gw);

    // 右半：破格比例 vs 清晰张力经验倒 U 曲线（示意）
    if (rightW > 90) {
      const cx0 = rightX + (narrow ? 6 : 12);
      const cy0 = 36;
      const cw2 = rightW - (narrow ? 12 : 20);
      const ch2 = h - 66;

      // 坐标轴
      ctx.strokeStyle = "#4A4A40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx0, cy0 + ch2);
      ctx.lineTo(cx0 + cw2, cy0 + ch2);
      ctx.stroke();

      // 经验理想带阴影（1–2 块）
      const x1 = cx0 + (1 / 8) * cw2;
      const x2 = cx0 + (2.5 / 8) * cw2;
      ctx.fillStyle = "rgba(108, 226, 178, 0.12)";
      ctx.fillRect(x1, cy0, x2 - x1, ch2);

      // 曲线
      ctx.strokeStyle = "#FF8761";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const px = cx0 + (i / 8) * cw2;
        const py = cy0 + ch2 - (clarityScore(i, negSpace) / 100) * ch2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 当前点
      const curX = cx0 + (breakN / 8) * cw2;
      const curY = cy0 + ch2 - (clarityScore(breakN, negSpace) / 100) * ch2;
      ctx.fillStyle = breakN >= 1 && breakN <= 2 && negSpace >= 26 ? "#6CE2B2" : "#FF6B40";
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#D4D0C5";
      ctx.font = `700 ${narrow ? 10 : 11}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(narrow ? "清晰度曲线(示意)" : "焦点清晰度曲线（经验示意）", cx0, 20, cw2 + 6);
      ctx.font = `400 ${narrow ? 10 : 10.5}px "Space Mono", monospace`;
      ctx.fillText("0%", cx0, cy0 + ch2 + 16);
      if (!narrow) {
        ctx.textAlign = "center";
        ctx.fillText("15–30%", (x1 + x2) / 2, cy0 + ch2 + 16);
      }
      ctx.textAlign = "right";
      ctx.fillText("100%", cx0 + cw2, cy0 + ch2 + 16);
    }

    ctx.restore();
  }

  function sync() {
    const pct = Math.round((breakN / 8) * 100);
    countVal.textContent = `${breakN} / 8 块（${pct}%）`;
    spaceVal.textContent = `${negSpace}%`;

    let warn = false;
    if (negSpace < 24) {
      warn = true;
      gradeEl.textContent = "余白过挤（经验示意）";
      textEl.textContent = `净留白压缩到 ${negSpace}%，哪怕破格块数不多，色块彼此顶撞也没有缓冲地带，张力会变成压迫感。`;
    } else if (breakN === 0) {
      warn = true;
      gradeEl.textContent = "0% 均质平庸（经验示意）";
      textEl.textContent = "8 块全部锁在常规格内，秩序满分但视线毫无停靠重点，适合纯清单，不适合需要冲击力的专题。";
    } else if (breakN <= 2) {
      warn = false;
      gradeEl.textContent = "理想焦点带（经验示意）";
      textEl.textContent = `8 块里只有 ${breakN} 块破格（${pct}%），其余 ${8 - breakN} 块稳稳守住网格；视线第一秒锁定主角，随后顺着整齐辅栏自然读完。`;
    } else if (breakN === 3) {
      warn = false;
      gradeEl.textContent = "高能临界区（经验示意）";
      textEl.textContent = "3 块同时破格（38%）已经贴近上限：必须依靠明确大小反差和充足留白，才能防止多处焦点互相抢戏。";
    } else {
      warn = true;
      gradeEl.textContent = "过破失序（经验示意）";
      textEl.textContent = `${breakN}/8 块都在破格（${pct}%），红色跳转线在画布里来回打架——当例外成了大多数，底层秩序就彻底看不见了。`;
    }
    verdict.classList.toggle("is-warn", warn);
    render();
  }

  for (const btn of stepBtns) {
    btn.addEventListener("click", () => {
      breakN = Number(btn.dataset.n);
      for (const b of stepBtns) {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      }
      sync();
    });
  }
  spaceRange.addEventListener("input", () => {
    negSpace = Number(spaceRange.value);
    sync();
  });
  window.addEventListener("resize", render);
  sync();
}

/* ================= 04 节：四年代标本切换器 ================= */
const ERAS = {
  "1981": {
    meta: "Josef Müller-Brockmann · Niggli Verlag（1961 / 1981）",
    heading: "先造出足够坚固的秩序，后人才有格可破",
    text: "瑞士平面设计师约瑟夫·米勒-布罗克曼在 1961 年出版《Gestaltungsprobleme des Grafikers》实践模块化网格，后于 1981 年由 Niggli 推出英德双语专著《Grid Systems in Graphic Design / Raster-Systeme für die visuelle Gestaltung》，把 8 至 32 格系统写进设计教科书。这套严密清晰的网格秩序，成为后来所有“破格”动作的共同起跑线。",
    svg: `<svg viewBox="0 0 260 190"><rect width="260" height="190" fill="#FCFBF7"/>
      <g stroke="#B8B3A6" stroke-dasharray="3 3">
        <line x1="20" y1="20" x2="240" y2="20"/><line x1="20" y1="68" x2="240" y2="68"/><line x1="20" y1="116" x2="240" y2="116"/><line x1="20" y1="164" x2="240" y2="164"/>
        <line x1="20" y1="20" x2="20" y2="164"/><line x1="75" y1="20" x2="75" y2="164"/><line x1="130" y1="20" x2="130" y2="164"/><line x1="185" y1="20" x2="185" y2="164"/><line x1="240" y1="20" x2="240" y2="164"/>
      </g>
      <rect x="20" y="20" width="110" height="48" fill="#010101"/>
      <rect x="130" y="20" width="110" height="48" fill="#FB410D"/>
      <rect x="20" y="68" width="55" height="96" fill="#D9D5CB"/>
      <rect x="75" y="68" width="55" height="96" fill="#0F44EB"/>
      <rect x="130" y="68" width="110" height="48" fill="#D9D5CB"/>
      <rect x="130" y="116" width="110" height="48" fill="#010101"/>
      <text x="20" y="182" font-family="Space Mono, monospace" font-size="10" fill="#45423C">STRICT 4×3 SWISS GRID</text></svg>`,
  },
  "1972": {
    meta: "Wolfgang Weingart · 巴塞尔设计学院（1968–1972）",
    heading: "精通活字与网格之后，在巴塞尔亲手撬开教条",
    text: "1968 年起在巴塞尔设计学院任教排版的沃尔夫冈·魏因加特，本是受邀教授严谨瑞士排版的传统活字技师。1972 年他带着自印讲义《How Can One Make Swiss Typography?》赴美巡讲，系统质疑僵化公式，通过拉宽字距、多层网点底片叠印与错位跨栏把瑞士网格“炸开一道缝”，其 40 年实验收录在 2000 年 Lars Müller 出版的《My Way to Typography》中。",
    svg: `<svg viewBox="0 0 260 190"><rect width="260" height="190" fill="#FCFBF7"/>
      <g stroke="#B8B3A6" stroke-dasharray="3 3">
        <line x1="20" y1="20" x2="240" y2="20"/><line x1="20" y1="164" x2="240" y2="164"/>
        <line x1="75" y1="20" x2="75" y2="164"/><line x1="185" y1="20" x2="185" y2="164"/>
      </g>
      <rect x="20" y="24" width="165" height="30" fill="#010101"/>
      <rect x="44" y="42" width="180" height="28" fill="#FB410D" fill-opacity="0.9"/>
      <g transform="rotate(-12 150 112)">
        <rect x="78" y="84" width="142" height="42" fill="#0F44EB"/>
        <line x1="78" y1="105" x2="220" y2="105" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4"/>
      </g>
      <rect x="20" y="138" width="90" height="26" fill="#010101"/>
      <text x="20" y="182" font-family="Space Mono, monospace" font-size="10" fill="#45423C">BASEL LAYERING &amp; OFFSET</text></svg>`,
  },
  "2002": {
    meta: "Timothy Samara · Rockport Publishers（2002 / 2017）",
    heading: "先建格、再破格，被系统写成双篇实操手册",
    text: "2002 年蒂莫西·萨马拉推出《Making and Breaking the Grid》（2017 年第二版、2023 年第三版），全书前半部严密拆解手稿、分栏、模块化与层级网格的搭法，后半部专门剖析如何在既有骨架上破格、跨栏、重叠而不散架。书名本身直接点破了破格网格的核心逻辑：Making 永远排在 Breaking 前面。",
    svg: `<svg viewBox="0 0 260 190"><rect width="260" height="190" fill="#FCFBF7"/>
      <rect x="20" y="20" width="220" height="144" fill="none" stroke="#8A867C" stroke-dasharray="4 3"/>
      <line x1="130" y1="20" x2="130" y2="164" stroke="#8A867C" stroke-dasharray="4 3"/>
      <rect x="20" y="20" width="84" height="58" fill="#D9D5CB"/>
      <rect x="20" y="92" width="84" height="72" fill="#010101"/>
      <circle cx="195" cy="48" r="38" fill="#FB410D"/>
      <rect x="114" y="102" width="126" height="44" fill="#0F44EB"/>
      <text x="20" y="182" font-family="Space Mono, monospace" font-size="10" fill="#45423C">MAKING + BREAKING SPECIMEN</text></svg>`,
  },
  "2017": {
    meta: "W3C CSS Grid Level 1 & Jen Simmons（2016–2017）",
    heading: "二维坐标轨进入浏览器，网页告别硬凑 12 栏",
    text: "W3C CSS Grid Layout Level 1 于 2016 年 9 月进入候选推荐标准，并在 2017 年春季起由 Firefox 52、Chrome 57、Safari 10.1 原生支持。Mozilla 设计布道师简·西蒙斯在 Experimental Layout Lab（labs.jensimmons.com）中示范：开发者不再靠负边距和绝对定位强拼，只需在二维网格上用 grid-column 与 grid-row 显式跨轨与重叠，就能在网页里做出既能破格又保响应式的版面。",
    svg: `<svg viewBox="0 0 260 190"><rect width="260" height="190" fill="#FCFBF7"/>
      <g stroke="#0F44EB" stroke-opacity="0.35" stroke-dasharray="3 3">
        <line x1="20" y1="20" x2="240" y2="20"/><line x1="20" y1="68" x2="240" y2="68"/><line x1="20" y1="116" x2="240" y2="116"/><line x1="20" y1="164" x2="240" y2="164"/>
        <line x1="20" y1="20" x2="20" y2="164"/><line x1="75" y1="20" x2="75" y2="164"/><line x1="130" y1="20" x2="130" y2="164"/><line x1="185" y1="20" x2="185" y2="164"/><line x1="240" y1="20" x2="240" y2="164"/>
      </g>
      <rect x="20" y="20" width="165" height="96" fill="#010101"/>
      <rect x="130" y="68" width="110" height="96" fill="#FB410D" fill-opacity="0.92"/>
      <rect x="20" y="128" width="96" height="36" fill="#0F44EB"/>
      <text x="138" y="122" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#FFFFFF">col: 3 / 5</text>
      <text x="20" y="182" font-family="Space Mono, monospace" font-size="10" fill="#45423C">CSS GRID EXPLICIT OVERLAP</text></svg>`,
  },
};

export function mountEraLab() {
  const btns = [...document.querySelectorAll(".era-btn")];
  const spec = document.getElementById("era-specimen");
  const meta = document.getElementById("era-meta");
  const head = document.getElementById("era-heading");
  const text = document.getElementById("era-text");
  if (!btns.length || !spec) return;

  function render(key) {
    const e = ERAS[key];
    spec.innerHTML = e.svg;
    meta.textContent = e.meta;
    head.textContent = e.heading;
    text.textContent = e.text;
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      for (const x of btns) {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-selected", String(on));
      }
      render(b.dataset.era);
    });
  }
  render("1981");
}

/* ================= 05 节：四类场景适配筛查台 ================= */
const SCENARIOS = {
  biennale: {
    goodWhenBroken: true,
    brokenBadge: { cls: "is-good", text: "推荐使用" },
    brokenTitle: "艺术双年展专题：破格直接建立策展性格",
    brokenDesc: "观众逛展讯页首先想感受到策展调性与主展品气场，而不是逐行比价。让主视觉圆越出栏线、展期与场馆严格贴紧底层网格，记忆点立刻拉满。",
    regularBadge: { cls: "is-neutral", text: "工整但偏平" },
    regularTitle: "常规满格排布：信息清楚，但略像活动公告板",
    regularDesc: "每个展区方块齐整平铺，可读性没问题，但缺少让人停下脚步的视觉反差。",
    svgBroken: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FCFBF7"/>
      <rect x="16" y="16" width="308" height="143" fill="none" stroke="#C9C5B9" stroke-dasharray="4 3"/>
      <circle cx="288" cy="36" r="42" fill="#FB410D"/>
      <text x="26" y="56" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="22" fill="#010101">建筑双年展</text>
      <rect x="26" y="72" width="130" height="8" fill="#0F44EB"/>
      <rect x="26" y="96" width="110" height="6" fill="#9A968C"/><rect x="26" y="110" width="96" height="6" fill="#9A968C"/>
      <rect x="176" y="96" width="128" height="54" fill="#010101" transform="rotate(-7 240 123)"/>
      <text x="192" y="128" font-family="Space Mono, monospace" font-size="11" fill="#F7F4EC">HALL 04 · OCT</text></svg>`,
    svgRegular: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FCFBF7"/>
      <rect x="16" y="16" width="146" height="64" fill="#010101"/><rect x="178" y="16" width="146" height="64" fill="#FB410D"/>
      <rect x="16" y="94" width="146" height="64" fill="#E6E2D8"/><rect x="178" y="94" width="146" height="64" fill="#0F44EB"/>
      <text x="26" y="52" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="15" fill="#FFFFFF">建筑双年展</text></svg>`,
  },
  flight: {
    goodWhenBroken: false,
    brokenBadge: { cls: "is-bad", text: "明确别用" },
    brokenTitle: "航班时刻查询表：破格直接摧毁垂向核对效率",
    brokenDesc: "乘客要在 2 秒内扫完「航班号 / 起飞时间 / 登机口 / 状态」四列。把某行错位跨栏或斜切放大，眼睛立刻丢掉列对齐锚点，极易看错登机口。",
    regularBadge: { cls: "is-good", text: "必须守格" },
    regularTitle: "严格等宽对齐表格：扫一眼就锁定登机口",
    regularDesc: "工具与时刻表依赖绝对可预测的垂直列线与等宽数字，秩序本身就是最高优先级。",
    svgBroken: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FFFFFF"/>
      <rect x="16" y="16" width="308" height="24" fill="#010101"/>
      <text x="24" y="32" font-family="Space Mono, monospace" font-size="11" fill="#FFFFFF">FLIGHT   TIME   GATE   STATUS</text>
      <rect x="16" y="48" width="290" height="24" fill="#EFECE2"/>
      <text x="24" y="64" font-family="Space Mono, monospace" font-size="11" fill="#121210">CA1832   09:15  B12    ON TIME</text>
      <g transform="translate(26 0) rotate(-3 170 92)">
        <rect x="16" y="80" width="292" height="32" fill="#FB410D"/>
        <text x="26" y="100" font-family="Space Mono, monospace" font-size="12" font-weight="700" fill="#FFFFFF">MU5108  10:40  C08  BOARDING</text>
      </g>
      <rect x="46" y="124" width="276" height="24" fill="#EFECE2"/>
      <text x="56" y="140" font-family="Space Mono, monospace" font-size="11" fill="#B41E12">× 列线全错位，上下行无法直扫核对</text></svg>`,
    svgRegular: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FFFFFF"/>
      <rect x="16" y="16" width="308" height="24" fill="#010101"/>
      <text x="24" y="32" font-family="Space Mono, monospace" font-size="11" fill="#FFFFFF">FLIGHT   TIME   GATE   STATUS</text>
      <rect x="16" y="46" width="308" height="28" fill="#F7F4EC"/>
      <text x="24" y="64" font-family="Space Mono, monospace" font-size="11" fill="#121210">CA1832   09:15  B12    ON TIME</text>
      <rect x="16" y="80" width="308" height="28" fill="#E7EEFD"/>
      <text x="24" y="98" font-family="Space Mono, monospace" font-size="11" font-weight="700" fill="#0A36C4">MU5108   10:40  C08    BOARDING</text>
      <rect x="16" y="114" width="308" height="28" fill="#F7F4EC"/>
      <text x="24" y="132" font-family="Space Mono, monospace" font-size="11" fill="#121210">CZ3102   11:05  A04    ON TIME</text>
      <text x="24" y="162" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="700" fill="#0D6B48">✓ 垂直列线笔直，色块高亮不破坏对齐</text></svg>`,
  },
  magazine: {
    goodWhenBroken: true,
    brokenBadge: { cls: "is-good", text: "推荐使用" },
    brokenTitle: "独立杂志人物专访：引语跨栏打破长文疲劳",
    brokenDesc: "两栏正文老老实实守住底部网格，只让一句朱红拉出引语向左跨入页边距并与人物静照呼应，既保证长文好读，又让翻页瞬间有节奏感。",
    regularBadge: { cls: "is-neutral", text: "中规中矩" },
    regularTitle: "标准双栏图文：稳妥耐看，但翻页缺少高潮",
    regularDesc: "传统均等双栏适合教科书，放到独立杂志特写页里会略显平淡。",
    svgBroken: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FCFBF7"/>
      <rect x="24" y="16" width="128" height="142" fill="#010101"/>
      <rect x="172" y="16" width="144" height="6" fill="#C9C9C7"/><rect x="172" y="30" width="132" height="6" fill="#C9C9C7"/>
      <rect x="112" y="54" width="212" height="44" fill="#FB410D"/>
      <text x="124" y="82" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">“先懂网格，再破它”</text>
      <rect x="172" y="114" width="144" height="6" fill="#9A968C"/><rect x="172" y="128" width="138" height="6" fill="#9A968C"/><rect x="172" y="142" width="106" height="6" fill="#9A968C"/></svg>`,
    svgRegular: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FCFBF7"/>
      <rect x="20" y="16" width="142" height="142" fill="#010101"/>
      <rect x="178" y="16" width="142" height="12" fill="#0F44EB"/>
      <rect x="178" y="42" width="142" height="7" fill="#C9C9C7"/><rect x="178" y="58" width="142" height="7" fill="#C9C9C7"/>
      <rect x="178" y="74" width="142" height="7" fill="#C9C9C7"/><rect x="178" y="90" width="142" height="7" fill="#C9C9C7"/>
      <rect x="178" y="106" width="110" height="7" fill="#C9C9C7"/></svg>`,
  },
  hospital: {
    goodWhenBroken: false,
    brokenBadge: { cls: "is-bad", text: "明确别用" },
    brokenTitle: "医院门诊挂号表单：错位与重叠徒增焦虑与误填",
    brokenDesc: "患者在紧张状态下填表，最需要单栏垂直、标签与输入框一一对应。花哨的左右错位和斜切按钮会干扰视线顺序，还可能让键盘 Tab 与屏幕阅读器跳序。",
    regularBadge: { cls: "is-good", text: "必须守格" },
    regularTitle: "单栏左对齐表单：零歧义、低认知负担",
    regularDesc: "标签、输入框、主提交按钮沿同一条左基准线依次向下，任何人都能无障碍完成。",
    svgBroken: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FFFFFF"/>
      <rect x="18" y="18" width="140" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="26" y="36" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">就诊人姓名</text>
      <rect x="134" y="56" width="180" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="142" y="74" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">选择科室 / 时段</text>
      <rect x="26" y="98" width="160" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="34" y="116" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">医保卡号</text>
      <rect x="202" y="116" width="118" height="36" fill="#FB410D" transform="rotate(8 260 134)"/>
      <text x="224" y="138" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="12" fill="#FFFFFF">确认挂号</text></svg>`,
    svgRegular: `<svg viewBox="0 0 340 175"><rect width="340" height="175" fill="#FFFFFF"/>
      <rect x="24" y="16" width="292" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="34" y="34" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">1. 就诊人姓名</text>
      <rect x="24" y="52" width="292" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="34" y="70" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">2. 选择科室与时段</text>
      <rect x="24" y="88" width="292" height="28" fill="#F7F4EC" stroke="#010101"/>
      <text x="34" y="106" font-family="Noto Sans SC, sans-serif" font-size="11" fill="#121210">3. 医保卡号</text>
      <rect x="24" y="126" width="136" height="34" fill="#0F44EB"/>
      <text x="58" y="147" font-family="Noto Sans SC, sans-serif" font-weight="700" font-size="12" fill="#FFFFFF">确认挂号</text></svg>`,
  },
};

export function mountScenarioLab() {
  const tabs = [...document.querySelectorAll(".sc-tab")];
  const modeBtn = document.getElementById("sc-mode-btn");
  const mock = document.getElementById("sc-mock");
  const badge = document.getElementById("sc-badge");
  const title = document.getElementById("sc-title");
  const desc = document.getElementById("sc-desc");
  if (!tabs.length || !modeBtn) return;

  let scKey = "biennale";
  let brokenMode = true;

  function render() {
    const s = SCENARIOS[scKey];
    mock.innerHTML = brokenMode ? s.svgBroken : s.svgRegular;
    const b = brokenMode ? s.brokenBadge : s.regularBadge;
    badge.className = `sc-badge ${b.cls}`;
    badge.textContent = b.text;
    title.textContent = brokenMode ? s.brokenTitle : s.regularTitle;
    desc.textContent = brokenMode ? s.brokenDesc : s.regularDesc;
    modeBtn.classList.toggle("is-broken", brokenMode);
    modeBtn.setAttribute("aria-pressed", String(brokenMode));
    modeBtn.textContent = brokenMode ? "当前：套用破格（点切常规）" : "当前：常规守格（点切破格）";
  }

  for (const t of tabs) {
    t.addEventListener("click", () => {
      scKey = t.dataset.sc;
      for (const b of tabs) {
        const on = b === t;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      }
      render();
    });
  }
  modeBtn.addEventListener("click", () => {
    brokenMode = !brokenMode;
    render();
  });
  render();
}

/* ================= 06 节：深蓝暗室 A/B/C/D 眼力小测 ================= */
const QUIZ_ART = {
  A: (showGrid) => `
    <svg viewBox="0 0 180 220"><rect width="180" height="220" fill="#F7F4EC"/>
      ${showGrid ? quizGridOverlay() : ""}
      <rect x="18" y="20" width="72" height="36" fill="#010101"/>
      <circle cx="126" cy="56" r="32" fill="#FB410D"/>
      <rect x="18" y="92" width="72" height="36" fill="#0F44EB"/>
      <rect x="18" y="140" width="144" height="10" fill="#9A968C"/>
      <rect x="18" y="158" width="144" height="10" fill="#9A968C"/>
      <rect x="18" y="176" width="72" height="24" fill="#010101"/>
      <text x="24" y="43" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">建筑年展</text>
    </svg>`,
  B: (showGrid) => `
    <svg viewBox="0 0 180 220"><rect width="180" height="220" fill="#F7F4EC"/>
      ${showGrid ? quizGridOverlay() : ""}
      <circle cx="144" cy="36" r="46" fill="#FB410D"/>
      <rect x="18" y="56" width="116" height="36" fill="#010101"/>
      <text x="26" y="79" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">当代建筑年展</text>
      <rect x="18" y="128" width="72" height="8" fill="#0F44EB"/>
      <rect x="18" y="144" width="72" height="7" fill="#8A867C"/>
      <rect x="18" y="158" width="54" height="7" fill="#8A867C"/>
      <rect x="126" y="164" width="36" height="36" fill="#0F44EB"/>
    </svg>`,
  C: (showGrid) => `
    <svg viewBox="0 0 180 220"><rect width="180" height="220" fill="#F7F4EC"/>
      ${showGrid ? quizGridOverlay() : ""}
      <circle cx="140" cy="40" r="36" fill="#FB410D"/>
      <rect x="14" y="46" width="96" height="30" fill="#010101" transform="rotate(-14 62 61)"/>
      <text x="22" y="66" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" transform="rotate(-14 62 61)">当代建筑年展</text>
      <rect x="96" y="96" width="76" height="34" fill="#0F44EB" transform="rotate(18 134 113)"/>
      <rect x="8" y="124" width="84" height="26" fill="#FB410D" transform="rotate(11 50 137)"/>
      <rect x="52" y="168" width="98" height="28" fill="#010101" transform="rotate(-16 101 182)"/>
    </svg>`,
  D: (showGrid) => `
    <svg viewBox="0 0 180 220"><rect width="180" height="220" fill="#F7F4EC"/>
      ${showGrid ? quizGridOverlay() : ""}
      <rect x="18" y="56" width="108" height="36" fill="#010101"/>
      <text x="24" y="79" font-family="Noto Sans SC, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF">当代建筑年展</text>
      <rect x="18" y="100" width="94" height="8" fill="#0F44EB"/>
      <rect x="18" y="114" width="86" height="8" fill="#8A867C"/>
      <rect x="34" y="38" width="122" height="92" fill="#FB410D" fill-opacity="0.93" transform="rotate(-11 95 84)"/>
      <rect x="18" y="164" width="72" height="36" fill="#0F44EB"/>
    </svg>`,
};

function quizGridOverlay() {
  const xs = [18, 54, 90, 126, 162];
  const ys = [20, 56, 92, 128, 164, 200];
  return `<g stroke="#0F44EB" stroke-opacity="0.55" stroke-dasharray="3 3" stroke-width="1">
    ${xs.map((x) => `<line x1="${x}" y1="20" x2="${x}" y2="200"/>`).join("")}
    ${ys.map((y) => `<line x1="18" y1="${y}" x2="162" y2="${y}"/>`).join("")}
  </g>`;
}

const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    head: "选了 A — 这是工整的常规网格，还没有破格",
    body: "叠上蓝色 4×5 底格线可以看到：A 的每块元素都严密缩在网格槽里，秩序完整但没有制造出视觉突破口，缺少张力与主角。",
  },
  B: {
    ok: true,
    head: "答对了，选 B — 可见的秩序 + 克制的单点越界 + 清晰余白",
    body: "叠显 4×5 底格线一目了然：B 的标题左缘、正文栏与右下蓝块全部严守同一套底层网格线；唯独右上朱红圆干脆冲破格界，展名跨 3 栏拉出字级，且零压字、留白舒展——完整兑现了原海报底部的破格公式。",
  },
  C: {
    ok: false,
    head: "选了 C — 破格过量，底层秩序已经崩散",
    body: "C 同时让 5 组元素斜切错位，几乎找不到两块共享同一条对齐基线。处处破格的结果就是没有对比基准，画面只剩躁动。",
  },
  D: {
    ok: false,
    head: "选了 D — 虽是单点破格，却压死了核心文字",
    body: "D 同样只破了一块，但巨大的朱红块直接盖住了展名与展期信息。破格必须为重点信息服务，伤及可读性的破坏并不成立。",
  },
};

export function mountQuiz() {
  const cards = [...document.querySelectorAll(".quiz-card")];
  const feedback = document.getElementById("quiz-feedback");
  const resultEl = document.getElementById("qf-result");
  const bodyEl = document.getElementById("qf-body");
  const toggleBtn = document.getElementById("qf-grid-toggle");
  if (!cards.length) return;

  let picked = null;
  let showGrid = false;

  function renderArts() {
    for (const key of ["A", "B", "C", "D"]) {
      const box = document.getElementById(`quiz-art-${key}`);
      if (box) box.innerHTML = QUIZ_ART[key](showGrid);
    }
  }

  function select(choice) {
    picked = choice;
    showGrid = true;
    renderArts();
    for (const c of cards) {
      const k = c.dataset.choice;
      c.classList.toggle("is-picked", k === picked);
      c.classList.toggle("is-right", k === "B");
      c.classList.toggle("is-wrong", k === picked && k !== "B");
    }
    const info = QUIZ_EXPLAIN[choice];
    resultEl.textContent = info.head;
    bodyEl.textContent = info.body;
    feedback.hidden = false;
    toggleBtn.setAttribute("aria-pressed", String(showGrid));
    toggleBtn.textContent = showGrid ? "底格检验线：已叠显" : "底格检验线：已隐藏";
  }

  for (const c of cards) {
    c.addEventListener("click", () => select(c.dataset.choice));
  }
  toggleBtn.addEventListener("click", () => {
    showGrid = !showGrid;
    renderArts();
    toggleBtn.setAttribute("aria-pressed", String(showGrid));
    toggleBtn.textContent = showGrid ? "底格检验线：已叠显" : "底格检验线：已隐藏";
  });

  renderArts();
}

/* ================= 07 节：原海报无损放大拖拽灯箱 ================= */
export function mountPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const stage = document.getElementById("lb-stage");
  const closeBtn = document.getElementById("lb-close");
  const zinBtn = document.getElementById("lb-zoom-in");
  const zoutBtn = document.getElementById("lb-zoom-out");
  const zresetBtn = document.getElementById("lb-zoom-reset");
  if (!openBtn || !posterImg || !lb) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1.15;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    closeBtn.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zinBtn.addEventListener("click", () => {
    scale = Math.min(3.5, scale + 0.35);
    applyTransform();
  });
  zoutBtn.addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.35);
    applyTransform();
  });
  zresetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.classList.add("is-dragging");
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const stop = () => {
    dragging = false;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
