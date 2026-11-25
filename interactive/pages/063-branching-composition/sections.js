// 正文 01–08 各节专属交互（相邻两节不用同一种控件做同一件事）
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
}

// =========================================================================
// 01 节：四重视觉编码剥离实验室（位置对齐 / 体量递减 / 方圆交替 / 四色区隔）
// =========================================================================
export function initSection01() {
  const svg = document.getElementById("s1-svg");
  const readout = document.getElementById("s1-readout");
  const btns = [...document.querySelectorAll("[data-ch]")];
  if (!svg || !btns.length) return;

  const ch = { align: true, size: true, shape: true, color: true };

  // 16 节点基准排布
  const nodes = [
    { id: "R",  l: 0, x: 74,  jx: 14, y: 150, jy: -16, p: null },
    { id: "B1", l: 1, x: 224, jx: -24, y: 58,  jy: 18,  p: "R" },
    { id: "B2", l: 1, x: 224, jx: 28,  y: 150, jy: -18, p: "R" },
    { id: "B3", l: 1, x: 224, jx: -16, y: 242, jy: -12, p: "R" },
    { id: "C1", l: 2, x: 374, jx: 26,  y: 30,  jy: 14,  p: "B1" },
    { id: "C2", l: 2, x: 374, jx: -34, y: 86,  jy: -10, p: "B1" },
    { id: "C3", l: 2, x: 374, jx: 38,  y: 124, jy: 14,  p: "B2" },
    { id: "C4", l: 2, x: 374, jx: -26, y: 176, jy: -8,  p: "B2" },
    { id: "C5", l: 2, x: 374, jx: 20,  y: 214, jy: 12,  p: "B3" },
    { id: "C6", l: 2, x: 374, jx: -32, y: 270, jy: -12, p: "B3" },
    { id: "L1", l: 3, x: 492, jx: -28, y: 30,  jy: 16,  p: "C1" },
    { id: "L2", l: 3, x: 492, jx: 16,  y: 86,  jy: -14, p: "C2" },
    { id: "L3", l: 3, x: 492, jx: -24, y: 124, jy: 12,  p: "C3" },
    { id: "L4", l: 3, x: 492, jx: 14,  y: 176, jy: -14, p: "C4" },
    { id: "L5", l: 3, x: 492, jx: -22, y: 214, jy: 10,  p: "C5" },
    { id: "L6", l: 3, x: 492, jx: 12,  y: 270, jy: -12, p: "C6" },
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const colors = [PALETTE.rootOrange, PALETTE.l2Green, PALETTE.l3Pink, PALETTE.l4Navy];
  const sizes = [28, 20, 15, 13];

  function draw() {
    svg.innerHTML = "";
    // 纵列辅助虚线（仅开启位置对齐时显示）
    if (ch.align) {
      [74, 224, 374, 492].forEach((x, i) => {
        svg.append(svgEl("line", {
          x1: x, y1: 12, x2: x, y2: 288,
          stroke: "rgba(8,97,66,0.18)", "stroke-width": 1, "stroke-dasharray": "3 4",
        }));
        svg.append(svgEl("text", {
          x, y: 297, "text-anchor": "middle", fill: PALETTE.inkSub,
          "font-size": 11, "font-family": '"Space Grotesk", sans-serif', "font-weight": 600,
        }, `L${i + 1}`));
      });
    }

    const pos = (n) => ({
      x: ch.align ? n.x : n.x + n.jx,
      y: ch.align ? n.y : n.y + n.jy,
    });

    // 连线
    for (const n of nodes) {
      if (!n.p) continue;
      const a = pos(byId[n.p]);
      const b = pos(n);
      const midX = a.x + Math.min(34, (b.x - a.x) * 0.35);
      const d = ch.align
        ? `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX + Math.min(38, Math.abs(b.y - a.y) * 0.72)} ${b.y} L ${b.x} ${b.y}`
        : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      svg.append(svgEl("path", {
        d, fill: "none",
        stroke: ch.color ? PALETTE.trunkGreen : "#5F6662",
        "stroke-width": ch.size ? Math.max(2.5, 5.5 - n.l) : 3,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      }));
    }

    // 节点
    for (const n of nodes) {
      const { x, y } = pos(n);
      const r = ch.size ? sizes[n.l] : 15;
      const fill = ch.color ? colors[n.l] : "#3F4642";
      const isSq = ch.shape ? (n.l === 1 || n.l === 3) : false;
      if (isSq) {
        svg.append(svgEl("rect", {
          x: x - r, y: y - r, width: r * 2, height: r * 2,
          fill, stroke: PALETTE.paper, "stroke-width": 1.6,
        }));
      } else {
        svg.append(svgEl("circle", {
          cx: x, cy: y, r,
          fill, stroke: PALETTE.paper, "stroke-width": 1.6,
        }));
      }
    }

    const activeCount = Object.values(ch).filter(Boolean).length;
    const speedLabel = activeCount === 4 ? "极快（四通道冗余确认·示意）"
      : activeCount === 3 ? "较快（三通道互证·示意）"
      : activeCount === 2 ? "中等（需顺线核对·示意）"
      : activeCount === 1 ? "迟缓（单通道易误读·示意）"
      : "几乎失焦（只能逐条数线·示意）";

    const missing = [];
    if (!ch.align) missing.push("撤掉纵列对齐后，节点前后错落，同层归属立刻模糊");
    if (!ch.size) missing.push("撤掉体量递减后，主干与末端等大平权，失去了第一眼入口");
    if (!ch.shape) missing.push("撤掉方圆交替后，相邻层级缺少轮廓节律");
    if (!ch.color) missing.push("撤掉四色区隔后，远观只剩单色点阵，无法按色块瞬间扫出某一整层");

    readout.innerHTML = `
      <div class="s1-metric">
        <span>已开启视觉通道 <strong>${activeCount} / 4</strong></span>
        <span>层级辨识效率：<strong>${speedLabel}</strong></span>
      </div>
      <p>${missing.length ? missing.join("；") + "。" : "四重编码同时在线：位置定级、大小定主次、方圆定节奏、色相定归类，哪怕一眼扫过也能瞬间读清四层。"}</p>
    `;
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.ch;
      ch[k] = !ch[k];
      btn.setAttribute("aria-pressed", String(ch[k]));
      btn.classList.toggle("is-on", ch[k]);
      draw();
    });
  });
  draw();
}

// =========================================================================
// 02 节：宽度与深度的拉锯（固定 12 枚末端，4 种分叉因子拓扑卡片切换）
// =========================================================================
export function initSection02() {
  const svg = document.getElementById("s2-svg");
  const info = document.getElementById("s2-info");
  const cards = [...document.querySelectorAll("[data-topo]")];
  if (!svg || !cards.length) return;

  const MODES = {
    flat: {
      title: "1 → 12 扁平炸开",
      spec: "深度 2 层 · 单层最大扇出 12 枝",
      levels: [1, 12],
      verdict: "过宽过浅（炸成一排）",
      why: "12 枚末端直接挤在同一层，眼睛要一口气扫过 12 个并列分支，工作记忆超载；更适合直接用表格或目录清单，不必画树。",
      fit: "仅适合极简标签云或横向平铺索引",
    },
    wide: {
      title: "1 → 6 → 2 宽冠两级",
      spec: "深度 3 层 · 单层最大扇出 6 枝",
      levels: [1, 6, 12],
      verdict: "偏宽（二级略挤）",
      why: "相比 1→12 已经减轻了一半压力，但第二层仍有 6 个并行支路，画幅纵深高、字号空间紧张。",
      fit: "适合大型网站一级导航栏（常见 5–7 个频道）",
    },
    balanced: {
      title: "1 → 3 → 2 → 2 均衡四级",
      spec: "深度 4 层 · 单层最大扇出 3 枝（近似 063 原海报）",
      levels: [1, 3, 6, 12],
      verdict: "甜区均衡（每层 2–3 叉）",
      why: "每一次分叉都在 2–3 个选项里做判断，既不会在某一步一口气炸开，又能在 3 步之内抵达全部 12 枚末端，横纵画幅最从容。",
      fit: "适合知识总分图、组织架构、产品谱系与海报图解",
    },
    deep: {
      title: "1 → 2 → 2 → 3 窄深高枝",
      spec: "深度 4 层 · 前期极收窄、末端集中分出",
      levels: [1, 2, 4, 12],
      verdict: "前窄后膨（末端偏密）",
      why: "前两级只做二分判断很利落，但第 3 层到末端每个节点突然挂出 3 枚叶子，末端纵向被拉长，适合是/否决策排查树。",
      fit: "适合二元排障流程与渐进式问诊表单",
    },
  };

  function buildTree(levels) {
    // 返回每层节点坐标与父索引
    const W = 620, H = 310, padX = 54, padY = 22;
    const L = levels.length;
    const cols = [];
    for (let li = 0; li < L; li++) {
      const count = levels[li];
      const x = L === 1 ? W / 2 : padX + (li / (L - 1)) * (W - padX * 2);
      const col = [];
      for (let i = 0; i < count; i++) {
        const y = count === 1 ? H / 2 : padY + ((i + 0.5) / count) * (H - padY * 2);
        const pIdx = li === 0 ? -1 : Math.floor((i * levels[li - 1]) / count);
        col.push({ x, y, li, i, pIdx });
      }
      cols.push(col);
    }
    return cols;
  }

  function render(key) {
    const m = MODES[key] || MODES.balanced;
    svg.innerHTML = "";
    const cols = buildTree(m.levels);
    const colors = [PALETTE.rootOrange, PALETTE.l2Green, PALETTE.l3Pink, PALETTE.l4Navy];
    const radii = [22, 14, 10.5, 8];

    // 纵列标
    cols.forEach((col, li) => {
      svg.append(svgEl("line", {
        x1: col[0].x, y1: 12, x2: col[0].x, y2: 292,
        stroke: "rgba(11,13,12,0.1)", "stroke-width": 1, "stroke-dasharray": "3 4",
      }));
      svg.append(svgEl("text", {
        x: col[0].x, y: 304, "text-anchor": "middle", fill: PALETTE.inkSub,
        "font-size": 11, "font-family": '"Space Grotesk", "Noto Sans SC", sans-serif', "font-weight": 600,
      }, li === 0 ? "根(1)" : li === cols.length - 1 ? `末端(${col.length})` : `L${li + 1}(${col.length})`));
    });

    // 连线
    for (let li = 1; li < cols.length; li++) {
      for (const n of cols[li]) {
        const p = cols[li - 1][n.pIdx];
        const dx = n.x - p.x;
        const x1 = p.x + Math.min(26, dx * 0.24);
        const x2 = x1 + Math.min(dx * 0.45, Math.abs(n.y - p.y) * 0.65);
        const d = `M ${p.x} ${p.y} L ${x1} ${p.y} L ${x2} ${n.y} L ${n.x} ${n.y}`;
        svg.append(svgEl("path", {
          d, fill: "none",
          stroke: key === "flat" ? PALETTE.err : PALETTE.trunkGreen,
          "stroke-width": Math.max(2, 4.5 - li * 0.7),
          "stroke-linecap": "round", "stroke-linejoin": "round",
        }));
      }
    }

    // 节点
    cols.forEach((col, li) => {
      const colorIdx = li === cols.length - 1 ? 3 : Math.min(li, 2);
      const r = li === cols.length - 1 ? 8 : radii[Math.min(li, 2)];
      const isSq = colorIdx === 1 || colorIdx === 3;
      for (const n of col) {
        if (isSq) {
          svg.append(svgEl("rect", {
            x: n.x - r, y: n.y - r, width: r * 2, height: r * 2,
            fill: colors[colorIdx], stroke: PALETTE.paper, "stroke-width": 1.4,
          }));
        } else {
          svg.append(svgEl("circle", {
            cx: n.x, cy: n.y, r,
            fill: colors[colorIdx], stroke: PALETTE.paper, "stroke-width": 1.4,
          }));
        }
      }
    });

    info.innerHTML = `
      <div class="s2-info-head">
        <strong>${m.title}</strong>
        <span class="s2-badge ${key === "balanced" ? "is-ok" : ""}">${m.verdict}</span>
      </div>
      <p class="s2-spec">${m.spec}</p>
      <p>${m.why}</p>
      <p class="s2-fit">适用场景：${m.fit}。</p>
    `;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => {
        const active = c === card;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      render(card.dataset.topo);
    });
  });
  render("balanced");
}

// =========================================================================
// 03 节（深森林墨绿暗版）：枝干样式 × 生长方向 2D Canvas 活体视流剧场
// =========================================================================
export function initSection03() {
  const canvas = document.getElementById("s3-canvas");
  const wrap = document.getElementById("s3-wrap");
  const readout = document.getElementById("s3-readout");
  const styleBtns = [...document.querySelectorAll("[data-branch-style]")];
  const dirBtns = [...document.querySelectorAll("[data-branch-dir]")];
  const pulseBtn = document.getElementById("s3-fire");
  if (!canvas || !wrap) return;

  const ctx = canvas.getContext("2d");
  let style = "octilinear"; // octilinear | bezier | ortho | straight
  let dir = "lr";           // lr | tb | radial
  let burstT = 0;           // 点击「放行视线」触发高亮波峰
  let cssW = 680, cssH = 340, dpr = pixelRatio(2);

  const STYLE_INFO = {
    octilinear: {
      name: "45° 折转枝干（原海报 / 地铁线路式）",
      note: "水平干道与 45° 斜枝交替，既像地铁图一样干脆，又在转角处自带前进箭头感；中文横排标签最好安放。",
    },
    bezier: {
      name: "柔和贝塞尔曲线（植物与思维导图式）",
      note: "S 形曲线模仿树枝自然舒展，视觉亲和力强；但在节点很密时，相邻曲线靠太近会稍微发黏。",
    },
    ortho: {
      name: "90° 直角阶梯（组织架构与文件夹式）",
      note: "全水平全垂直，理性克制、极易对齐文字栏，但长距离 90° 转折会让视线明显顿一下。",
    },
    straight: {
      name: "直连斜射线（最短连线式）",
      note: "路径最短，但不同枝条斜率各不相同，扇出稍多就容易在视觉上显得凌乱、缺少节律。",
    },
  };
  const DIR_INFO = {
    lr: "左→右横展：顺应中文横排阅读惯性，最适合放长标签与宽屏海报。",
    tb: "上→下垂展：天然带「权威总领→下级执行」的俯视层级感，常见于组织架构与竖屏海报。",
    radial: "中心放射：空间利用率最高，适合海量枝叶的全景谱系，但外圈文字需要旋转或改横向引出。",
  };

  function updateReadout() {
    if (!readout) return;
    readout.innerHTML = `<strong>${STYLE_INFO[style].name}</strong><p>${STYLE_INFO[style].note}</p><p class="s3-dir-note">${DIR_INFO[dir]}</p>`;
  }

  function buildNodes(w, h) {
    // 1 -> 3 -> 6 精炼三层结构，在 3 种方向下都清晰舒展
    const list = [];
    if (dir === "lr") {
      const xs = [w * 0.13, w * 0.48, w * 0.84];
      list.push({ id: 0, l: 0, p: -1, x: xs[0], y: h * 0.5 });
      [0.2, 0.5, 0.8].forEach((fy, i) => list.push({ id: i + 1, l: 1, p: 0, x: xs[1], y: h * fy }));
      [0.11, 0.29, 0.42, 0.58, 0.71, 0.89].forEach((fy, i) => list.push({ id: i + 4, l: 2, p: Math.floor(i / 2) + 1, x: xs[2], y: h * fy }));
    } else if (dir === "tb") {
      const ys = [h * 0.17, h * 0.50, h * 0.84];
      list.push({ id: 0, l: 0, p: -1, x: w * 0.5, y: ys[0] });
      [0.2, 0.5, 0.8].forEach((fx, i) => list.push({ id: i + 1, l: 1, p: 0, x: w * fx, y: ys[1] }));
      [0.11, 0.29, 0.42, 0.58, 0.71, 0.89].forEach((fx, i) => list.push({ id: i + 4, l: 2, p: Math.floor(i / 2) + 1, x: w * fx, y: ys[2] }));
    } else {
      const cx = w * 0.5, cy = h * 0.5;
      const r1 = Math.min(w, h) * 0.23;
      const r2 = Math.min(w, h) * 0.41;
      list.push({ id: 0, l: 0, p: -1, x: cx, y: cy });
      [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6].forEach((a, i) => {
        list.push({ id: i + 1, l: 1, p: 0, x: cx + Math.cos(a) * r1, y: cy + Math.sin(a) * r1, ang: a });
      });
      for (let i = 0; i < 6; i++) {
        const p = list[Math.floor(i / 2) + 1];
        const a = p.ang + (i % 2 === 0 ? -0.38 : 0.38);
        list.push({ id: i + 4, l: 2, p: p.id, x: cx + Math.cos(a) * r2, y: cy + Math.sin(a) * r2, ang: a });
      }
    }
    return list;
  }

  function edgePoint(a, b, f) {
    if (style === "straight" || dir === "radial" && style === "octilinear") {
      if (dir === "radial" && style === "octilinear") {
        // 放射状下的 45° 风格：先沿父径向出一小段再折向子点
        const mx = a.x + (b.x - a.x) * 0.42;
        const my = a.y + (b.y - a.y) * 0.18;
        if (f < 0.45) {
          const u = f / 0.45;
          return { x: a.x + (mx - a.x) * u, y: a.y + (my - a.y) * u };
        }
        const u = (f - 0.45) / 0.55;
        return { x: mx + (b.x - mx) * u, y: my + (b.y - my) * u };
      }
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    if (style === "bezier") {
      const c1 = dir === "tb" ? { x: a.x, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y };
      const c2 = dir === "tb" ? { x: b.x, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: b.y };
      const u = 1 - f;
      return {
        x: u * u * u * a.x + 3 * u * u * f * c1.x + 3 * u * f * f * c2.x + f * f * f * b.x,
        y: u * u * u * a.y + 3 * u * u * f * c1.y + 3 * u * f * f * c2.y + f * f * f * b.y,
      };
    }
    // 折线采样（ortho 或 octilinear）
    const pts = [];
    if (dir === "tb") {
      const dy = b.y - a.y;
      if (style === "ortho") {
        const my = a.y + dy * 0.5;
        pts.push(a, { x: a.x, y: my }, { x: b.x, y: my }, b);
      } else {
        const stub = dy * 0.22;
        const diag = Math.min(dy * 0.52, Math.abs(b.x - a.x) * 0.72);
        pts.push(a, { x: a.x, y: a.y + stub }, { x: b.x, y: a.y + stub + diag }, b);
      }
    } else {
      const dx = b.x - a.x;
      if (style === "ortho") {
        const mx = a.x + dx * 0.5;
        pts.push(a, { x: mx, y: a.y }, { x: mx, y: b.y }, b);
      } else {
        const stub = dx * 0.2;
        const diag = Math.min(dx * 0.52, Math.abs(b.y - a.y) * 0.75);
        pts.push(a, { x: a.x + stub, y: a.y }, { x: a.x + stub + diag, y: b.y }, b);
      }
    }
    let total = 0;
    const lens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      lens.push(l);
      total += l;
    }
    let d = f * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const r = lens[i] > 1e-4 ? d / lens[i] : 0;
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * r, y: pts[i].y + (pts[i + 1].y - pts[i].y) * r };
      }
      d -= lens[i];
    }
    return b;
  }

  function drawEdge(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    if (style === "bezier") {
      if (dir === "tb") ctx.bezierCurveTo(a.x, (a.y + b.y) / 2, b.x, (a.y + b.y) / 2, b.x, b.y);
      else ctx.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y);
    } else if (style === "straight") {
      ctx.lineTo(b.x, b.y);
    } else if (dir === "radial") {
      const mx = a.x + (b.x - a.x) * 0.42;
      const my = a.y + (b.y - a.y) * 0.18;
      ctx.lineTo(mx, my);
      ctx.lineTo(b.x, b.y);
    } else if (dir === "tb") {
      const dy = b.y - a.y;
      if (style === "ortho") {
        const my = a.y + dy * 0.5;
        ctx.lineTo(a.x, my); ctx.lineTo(b.x, my); ctx.lineTo(b.x, b.y);
      } else {
        const stub = dy * 0.22;
        const diag = Math.min(dy * 0.52, Math.abs(b.x - a.x) * 0.72);
        ctx.lineTo(a.x, a.y + stub); ctx.lineTo(b.x, a.y + stub + diag); ctx.lineTo(b.x, b.y);
      }
    } else {
      const dx = b.x - a.x;
      if (style === "ortho") {
        const mx = a.x + dx * 0.5;
        ctx.lineTo(mx, a.y); ctx.lineTo(mx, b.y); ctx.lineTo(b.x, b.y);
      } else {
        const stub = dx * 0.2;
        const diag = Math.min(dx * 0.52, Math.abs(b.y - a.y) * 0.75);
        ctx.lineTo(a.x + stub, a.y); ctx.lineTo(a.x + stub + diag, b.y); ctx.lineTo(b.x, b.y);
      }
    }
    ctx.stroke();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(260, Math.round(r.width));
    cssH = Math.max(220, Math.round(r.height));
    dpr = pixelRatio(2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  function frame(t, dt, { still }) {
    if (burstT > 0 && !still) burstT = Math.max(0, burstT - (dt || 0.016));
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.darkForestCard;
    ctx.fillRect(0, 0, cssW, cssH);

    // 柔和格线
    ctx.strokeStyle = "rgba(203, 226, 215, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 32; x < cssW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke(); }
    for (let y = 32; y < cssH; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke(); }

    const nodes = buildNodes(cssW, cssH);
    ctx.strokeStyle = "#4FC193";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const n of nodes) {
      if (n.p < 0) continue;
      drawEdge(nodes[n.p], n);
    }

    // 视线流动光珠（0..1 沿第一层，随后沿第二层流向末端）
    const p = still ? 0.62 : ((burstT > 0 ? (1 - burstT / 1.4) : (t % 2.4) / 2.4));
    for (const n of nodes) {
      if (n.p < 0) continue;
      const parent = nodes[n.p];
      let f = -1;
      if (n.l === 1 && p <= 0.52) f = p / 0.52;
      if (n.l === 2 && p >= 0.44) f = Math.min(1, (p - 0.44) / 0.56);
      if (still) f = 0.55;
      if (f >= 0 && f <= 1) {
        const pt = edgePoint(parent, n, f);
        ctx.fillStyle = PALETTE.orangeGlow;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, burstT > 0 ? 6 : 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.darkText;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 节点
    const radii = [20, 13.5, 10];
    const fills = [PALETTE.orangeGlow, "#4FC193", PALETTE.l3Pink];
    for (const n of nodes) {
      const r = radii[n.l];
      ctx.fillStyle = fills[n.l];
      ctx.beginPath();
      if (n.l === 1) ctx.rect(n.x - r, n.y - r, r * 2, r * 2);
      else ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.darkForestCard;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  resize();
  const ctrl = loop(wrap, frame);
  new ResizeObserver(() => { resize(); ctrl.draw(); }).observe(wrap);

  styleBtns.forEach((b) => b.addEventListener("click", () => {
    style = b.dataset.branchStyle;
    styleBtns.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    updateReadout();
    ctrl.draw();
  }));
  dirBtns.forEach((b) => b.addEventListener("click", () => {
    dir = b.dataset.branchDir;
    dirBtns.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    updateReadout();
    ctrl.draw();
  }));
  if (pulseBtn) {
    pulseBtn.addEventListener("click", () => {
      burstT = 1.4;
      ctrl.draw();
    });
  }
  updateReadout();
  ctrl.draw();
}

// =========================================================================
// 04 节：同小类分界实验——「添两根跨支连线，树瞬间退化成 064 网络」
// =========================================================================
export function initSection04() {
  const svg = document.getElementById("s4-svg");
  const toggleBtn = document.getElementById("s4-toggle");
  const note = document.getElementById("s4-note");
  if (!svg || !toggleBtn) return;

  let isNet = false;

  const treePts = [
    { id: "0", x: 56,  y: 115, c: PALETTE.rootOrange, r: 16, sq: false },
    { id: "1", x: 170, y: 55,  c: PALETTE.l2Green,    r: 12, sq: true  },
    { id: "2", x: 170, y: 175, c: PALETTE.l2Green,    r: 12, sq: true  },
    { id: "3", x: 292, y: 32,  c: PALETTE.l3Pink,     r: 10, sq: false },
    { id: "4", x: 292, y: 82,  c: PALETTE.l3Pink,     r: 10, sq: false },
    { id: "5", x: 292, y: 148, c: PALETTE.l3Pink,     r: 10, sq: false },
    { id: "6", x: 292, y: 198, c: PALETTE.l3Pink,     r: 10, sq: false },
  ];
  const baseEdges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
  const netExtra  = [[4,5],[3,6],[6,0],[1,2]];

  function draw() {
    svg.innerHTML = "";
    for (const [u, v] of baseEdges) {
      const a = treePts[u], b = treePts[v];
      const mx = a.x + (b.x - a.x) * 0.36;
      svg.append(svgEl("path", {
        d: `M ${a.x} ${a.y} L ${mx} ${a.y} L ${mx + 26} ${b.y} L ${b.x} ${b.y}`,
        fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 3.5, "stroke-linejoin": "round",
      }));
    }
    if (isNet) {
      for (const [u, v] of netExtra) {
        const a = treePts[u], b = treePts[v];
        const cx = (a.x + b.x) / 2 + (u === 6 ? -20 : 18);
        const cy = (a.y + b.y) / 2 + (u === 6 ? 60 : 0);
        svg.append(svgEl("path", {
          d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
          fill: "none", stroke: PALETTE.err, "stroke-width": 2.4, "stroke-dasharray": "5 4",
        }));
      }
    }
    for (const p of treePts) {
      if (p.sq) svg.append(svgEl("rect", { x: p.x - p.r, y: p.y - p.r, width: p.r * 2, height: p.r * 2, fill: p.c, stroke: PALETTE.paperMint, "stroke-width": 1.6 }));
      else svg.append(svgEl("circle", { cx: p.x, cy: p.y, r: p.r, fill: p.c, stroke: PALETTE.paperMint, "stroke-width": 1.6 }));
    }
    toggleBtn.textContent = isNet ? "剪回纯树结构（063 分支）" : "添入跨支与回环边（变成 064 网络）";
    toggleBtn.setAttribute("aria-pressed", String(isNet));
    note.textContent = isNet
      ? "当前已出现跨支互连与闭环：节点不再只有唯一父级，视线可以四处循环跳转——此时它已变成 064 网络构图，单向层级优势消失。"
      : "当前每枚节点只有唯一父级、零闭环：眼睛能从橘红主干一口气单向走到任意末端，归属关系零歧义。";
  }

  toggleBtn.addEventListener("click", () => { isNet = !isNet; draw(); });
  draw();
}

// =========================================================================
// 05 节：从哪来——四时代视觉史微图交互年表
// =========================================================================
export function initSection05() {
  const svg = document.getElementById("s5-svg");
  const desc = document.getElementById("s5-desc");
  const btns = [...document.querySelectorAll("[data-era]")];
  if (!svg || !btns.length) return;

  const ERAS = {
    porphyry: {
      year: "公元 3 世纪（约 268–270 CE）· 中世纪手抄本图解",
      title: "波菲利《导论》与波菲利之树",
      text: "新柏拉图学派哲学家波菲利（Porphyry）在《导论》（Isagoge）中写下从最高「实体」按有形/无形、有生/无生、理性/非理性逐级二分至个体的逻辑谱系；6 世纪经波爱修斯（Boethius）译注拉丁文后，中世纪手抄本将它绘成最早广为流传的层级分叉树图（Arbor Porphyriana）。",
      draw: () => {
        // 经典垂直二分树干结构
        const ys = [36, 92, 148, 204];
        const labs = ["实体", "形体", "动物", "个体"];
        const diffs = [["无形", "有形"], ["无生", "有生"], ["非理性", "理性"]];
        svg.append(svgEl("line", { x1: 180, y1: 36, x2: 180, y2: 204, stroke: PALETTE.trunkGreen, "stroke-width": 3.5 }));
        ys.forEach((y, i) => {
          svg.append(svgEl("rect", { x: 146, y: y - 14, width: 68, height: 28, fill: i === 0 ? PALETTE.rootOrange : PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.6 }));
          svg.append(svgEl("text", { x: 180, y: y + 4, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: i === 0 ? "#FEF9F3" : PALETTE.ink }, labs[i]));
          if (i < 3) {
            const my = y + 28;
            svg.append(svgEl("path", { d: `M 146 ${y + 10} L 88 ${my} L 146 ${ys[i + 1] - 10}`, fill: "none", stroke: PALETTE.inkSub, "stroke-width": 1.4, "stroke-dasharray": "4 3" }));
            svg.append(svgEl("path", { d: `M 214 ${y + 10} L 272 ${my} L 214 ${ys[i + 1] - 10}`, fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 1.8 }));
            svg.append(svgEl("text", { x: 74, y: my + 4, "text-anchor": "end", "font-size": 11, fill: PALETTE.inkSub }, diffs[i][0]));
            svg.append(svgEl("text", { x: 286, y: my + 4, "text-anchor": "start", "font-size": 11, fill: PALETTE.l2Green, "font-weight": 700 }, diffs[i][1]));
          }
        });
      },
    },
    darwin: {
      year: "1837 年 · 剑桥大学图书馆藏 MS DAR 121 第 36 页",
      title: "达尔文「I think」演化分支草图",
      text: "查尔斯·达尔文在《B 笔记本》第 36 页写下轻描淡写的“I think”，在下方画出一棵从单一共同祖先（标注 1）向外不对称分叉、部分细枝终止灭绝的谱系草图。它以视觉形式击碎了沿袭千年的线性阶梯观；1859 年《物种起源》里唯一的插图，正是这棵分支树的精密版。",
      draw: () => {
        svg.append(svgEl("text", { x: 54, y: 40, "font-size": 18, "font-style": "italic", "font-family": '"Libre Baskerville", serif', fill: PALETTE.ink }, "I think"));
        const paths = [
          "M 176 206 L 176 156",
          "M 176 156 L 116 110 L 84 62",
          "M 116 110 L 138 74",
          "M 176 156 L 236 122 L 284 74",
          "M 236 122 L 254 162",
          "M 210 137 L 218 82",
          "M 176 156 L 172 96",
        ];
        paths.forEach((d, idx) => svg.append(svgEl("path", { d, fill: "none", stroke: idx === 0 ? PALETTE.rootOrange : PALETTE.ink, "stroke-width": idx === 0 ? 3.5 : 2.1, "stroke-linecap": "round" })));
        // 末端现存种短横杠（达尔文原作标志）
        [[84,62],[138,74],[284,74],[218,82]].forEach(([x,y]) => {
          svg.append(svgEl("line", { x1: x - 7, y1: y - 4, x2: x + 7, y2: y + 4, stroke: PALETTE.l2Green, "stroke-width": 2.4 }));
        });
        svg.append(svgEl("circle", { cx: 176, cy: 206, r: 7, fill: PALETTE.rootOrange }));
        svg.append(svgEl("text", { x: 192, y: 210, "font-size": 12, "font-family": '"Space Grotesk", sans-serif', fill: PALETTE.inkSub }, "1 (共同祖先)"));
      },
    },
    beck: {
      year: "1931 年手稿 / 1933 年 1 月发行 · 伦敦交通博物馆藏",
      title: "亨利·贝克伦敦地铁 45° 拓扑线路图",
      text: "电气制图员亨利·贝克（Harry Beck）抛弃真实地理弯折，借用电路原理图语法，仅凭水平、垂直与 45° 斜线来表达主干换乘与支线分叉。063 原海报里极度利落的 45° 深森林绿分叉折线，正是这一信息图传统的直接延续。",
      draw: () => {
        svg.append(svgEl("path", { d: "M 42 124 L 154 124 L 198 80 L 316 80", fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 6, "stroke-linejoin": "round" }));
        svg.append(svgEl("path", { d: "M 154 124 L 198 168 L 316 168", fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 6, "stroke-linejoin": "round" }));
        svg.append(svgEl("path", { d: "M 110 124 L 110 42 L 268 42", fill: "none", stroke: PALETTE.l4Navy, "stroke-width": 4.5, "stroke-linejoin": "round" }));
        // 换乘节点与站刻
        [[110,124],[154,124]].forEach(([x,y]) => {
          svg.append(svgEl("circle", { cx: x, cy: y, r: 9, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 3 }));
        });
        [[72,124],[244,80],[290,80],[244,168],[290,168]].forEach(([x,y]) => {
          svg.append(svgEl("line", { x1: x, y1: y - 7, x2: x, y2: y + 7, stroke: PALETTE.rootOrange, "stroke-width": 3.5 }));
        });
        svg.append(svgEl("text", { x: 186, y: 128, "font-size": 12, "font-family": '"Space Grotesk", sans-serif', "font-weight": 700, fill: PALETTE.orangeText }, "45°"));
      },
    },
    reingold: {
      year: "1981 年 IEEE TSE 论文 & 2014 年《The Book of Trees》",
      title: "Reingold–Tilford 整洁树算法与现代图谱",
      text: "Edward Reingold 与 John Tilford 在 1981 年提出《Tidier Drawings of Trees》，写下四条视觉公理：同层节点落在平行线上、父节点居于子群中轴、同构子树画法一致、子树轮廓紧凑不重叠。2014 年 Manuel Lima 在《The Book of Trees》系统汇总了人类 800 年分支视觉史。",
      draw: () => {
        // 标出同层平行虚线 + 父居中 + 对称轮廓
        [44, 114, 184].forEach((y, i) => {
          svg.append(svgEl("line", { x1: 30, y1: y, x2: 330, y2: y, stroke: "rgba(22,64,133,0.22)", "stroke-width": 1.2, "stroke-dasharray": "4 4" }));
          svg.append(svgEl("text", { x: 26, y: y + 4, "text-anchor": "end", "font-size": 11, "font-family": '"Space Grotesk", sans-serif', fill: PALETTE.l4Navy }, `d${i}`));
        });
        const pts = [[180,44],[114,114],[246,114],[76,184],[152,184],[208,184],[284,184]];
        [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([u,v]) => {
          svg.append(svgEl("line", { x1: pts[u][0], y1: pts[u][1], x2: pts[v][0], y2: pts[v][1], stroke: PALETTE.trunkGreen, "stroke-width": 2.6 }));
        });
        // 父居中标线
        svg.append(svgEl("line", { x1: 180, y1: 24, x2: 180, y2: 212, stroke: PALETTE.barOrange, "stroke-width": 1.2, "stroke-dasharray": "3 3" }));
        pts.forEach(([x,y], i) => {
          svg.append(svgEl("circle", { cx: x, cy: y, r: i === 0 ? 11 : i < 3 ? 8.5 : 7, fill: i === 0 ? PALETTE.rootOrange : i < 3 ? PALETTE.l2Green : PALETTE.l4Navy }));
        });
      },
    },
  };

  function render(key) {
    const e = ERAS[key] || ERAS.porphyry;
    svg.innerHTML = "";
    e.draw();
    desc.innerHTML = `<p class="s5-year">${e.year}</p><h3>${e.title}</h3><p>${e.text}</p>`;
  }

  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    render(b.dataset.era);
  }));
  render("porphyry");
}

// =========================================================================
// 06 节：什么时候用、什么时候别用——四类真实需求分诊对比台
// =========================================================================
export function initSection06() {
  const svg = document.getElementById("s6-svg");
  const verdict = document.getElementById("s6-verdict");
  const btns = [...document.querySelectorAll("[data-case]")];
  if (!svg || !btns.length) return;

  const CASES = {
    menu: {
      ok: true,
      badge: "适合用 063 分支构图",
      title: "咖啡馆风味与冲煮分类导览",
      reason: "单一总类向下拆出产地、处理法、风味轮，每个风味都有清晰上游归属，用分支构图一眼就能顺着口味偏好找到推荐豆。",
      draw: () => {
        svg.append(svgEl("path", { d: "M 54 90 L 104 90 L 128 45 L 188 45 M 104 90 L 128 135 L 188 135 M 188 45 L 222 45 L 244 26 L 306 26 M 222 45 L 244 64 L 306 64 M 188 135 L 222 135 L 244 116 L 306 116 M 222 135 L 244 154 L 306 154", fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 3.5, "stroke-linejoin": "round" }));
        svg.append(svgEl("circle", { cx: 54, cy: 90, r: 16, fill: PALETTE.rootOrange }));
        [[188,45],[188,135]].forEach(([x,y]) => svg.append(svgEl("rect", { x: x - 11, y: y - 11, width: 22, height: 22, fill: PALETTE.l2Green })));
        [[306,26],[306,64],[306,116],[306,154]].forEach(([x,y]) => svg.append(svgEl("circle", { cx: x, cy: y, r: 9, fill: PALETTE.l3Pink })));
      },
    },
    collab: {
      ok: false,
      badge: "别用分支 · 改用 064 网络构图",
      title: "跨部门多人协作与接口依赖",
      reason: "设计、前端、后端与运营两两互相调用、互为上下游，硬画成树要么到处复制同一个角色，要么拉出满屏飞线；应直接用多对多网络。",
      draw: () => {
        const pts = [[74,50],[286,50],[180,96],[74,142],[286,142]];
        [[0,1],[0,2],[0,3],[1,2],[1,4],[2,3],[2,4],[3,4]].forEach(([u,v]) => {
          svg.append(svgEl("line", { x1: pts[u][0], y1: pts[u][1], x2: pts[v][0], y2: pts[v][1], stroke: PALETTE.l4Navy, "stroke-width": 2.2 }));
        });
        pts.forEach(([x,y], i) => svg.append(svgEl("circle", { cx: x, cy: y, r: i === 2 ? 14 : 11, fill: i === 2 ? PALETTE.rootOrange : PALETTE.l2Green, stroke: PALETTE.paperSlate, "stroke-width": 2 })));
      },
    },
    gallery: {
      ok: false,
      badge: "别用分支 · 改用 057 棋盘构图",
      title: "九位摄影师的平等新作联展",
      reason: "九件作品地位完全平等，并不存在「谁生出谁」的母子关系。强套一棵主干树，会无端制造尊卑错觉，换成均等网格反而得体。",
      draw: () => {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            svg.append(svgEl("rect", {
              x: 92 + c * 62, y: 22 + r * 48, width: 48, height: 36,
              fill: (r + c) % 2 === 0 ? PALETTE.l4Navy : PALETTE.l2Green, opacity: 0.9,
            }));
          }
        }
      },
    },
    linear: {
      ok: false,
      badge: "别用分支 · 改用 060 级联构图",
      title: "手机端 5 步线性注册向导",
      reason: "每一步完成后只有唯一下一步，没有分岔选择。画分支壳纯属多余装饰，顺着单向阶梯或瀑布一步步推进更轻快。",
      draw: () => {
        svg.append(svgEl("line", { x1: 42, y1: 90, x2: 318, y2: 90, stroke: PALETTE.trunkGreen, "stroke-width": 3.5 }));
        [42, 111, 180, 249, 318].forEach((x, i) => {
          svg.append(svgEl("circle", { cx: x, cy: 90, r: 13, fill: i === 0 ? PALETTE.rootOrange : PALETTE.l2Green, stroke: PALETTE.paperSlate, "stroke-width": 2 }));
          svg.append(svgEl("text", { x, y: 94, "text-anchor": "middle", fill: "#FEF9F3", "font-size": 11, "font-family": '"Space Grotesk", sans-serif', "font-weight": 700 }, String(i + 1)));
        });
      },
    },
  };

  function render(key) {
    const c = CASES[key] || CASES.menu;
    svg.innerHTML = "";
    c.draw();
    verdict.innerHTML = `
      <span class="s6-badge ${c.ok ? "is-ok" : "is-no"}">${c.badge}</span>
      <h3>${c.title}</h3>
      <p>${c.reason}</p>
    `;
  }

  btns.forEach((b) => b.addEventListener("click", () => {
    btns.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    render(b.dataset.case);
  }));
  render("menu");
}

// =========================================================================
// 07 节：单变量控制小练习（方案 A / B / C / D 节点、色板、画幅全同，各仅差 1 个变量）
// =========================================================================
export function initSection07() {
  const opts = [...document.querySelectorAll("[data-quiz]")];
  const fb = document.getElementById("s7-feedback");
  const resetBtn = document.getElementById("s7-reset");
  if (!opts.length || !fb) return;

  // 渲染 4 张严格单变量对照的高清 SVG（16 节点全同）
  function drawQuizSvg(svg, variant) {
    svg.innerHTML = "";
    const xs = [34, 98, 172, 248];
    const ys2 = [34, 80, 126];
    const ys3 = [18, 46, 68, 92, 114, 142];

    const nodes = [
      { id: "R",  l: 0, x: xs[0], y: 80 },
      { id: "B1", l: 1, x: xs[1], y: ys2[0] },
      { id: "B2", l: 1, x: xs[1], y: ys2[1] },
      { id: "B3", l: 1, x: xs[1], y: ys2[2] },
      ...ys3.map((y, i) => ({ id: `C${i + 1}`, l: 2, x: xs[2], y })),
      ...ys3.map((y, i) => ({ id: `L${i + 1}`, l: 3, x: xs[3], y })),
    ];
    // 方案 A：仅破坏「同层纵列对齐」（L3/L4 前后参差错落，但彼此留足净距绝不碰撞）
    if (variant === "A") {
      const xC = [144, 198, 148, 200, 144, 196];
      const xL = [218, 258, 220, 260, 218, 258];
      nodes.filter((n) => n.l === 2).forEach((n, i) => { n.x = xC[i]; });
      nodes.filter((n) => n.l === 3).forEach((n, i) => { n.x = xL[i]; });
    }

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    // 拓扑连线（方案 D 仅改 2 组父子连线制造跨支交叉）
    const edges = [
      ["R","B1"],["R","B2"],["R","B3"],
      ["B1","C1"],["B1","C2"],
      variant === "D" ? ["B3","C3"] : ["B2","C3"],
      variant === "D" ? ["B3","C4"] : ["B2","C4"],
      variant === "D" ? ["B2","C5"] : ["B3","C5"],
      variant === "D" ? ["B2","C6"] : ["B3","C6"],
      ["C1","L1"],["C2","L2"],["C3","L3"],["C4","L4"],["C5","L5"],["C6","L6"],
    ];

    for (const [u, v] of edges) {
      const a = byId[u], b = byId[v];
      const dx = b.x - a.x;
      const d = dx > 14
        ? `M ${a.x} ${a.y} L ${a.x + dx * 0.24} ${a.y} L ${a.x + dx * 0.62} ${b.y} L ${b.x} ${b.y}`
        : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      svg.append(svgEl("path", {
        d, fill: "none", stroke: PALETTE.trunkGreen, "stroke-width": 2.4, "stroke-linejoin": "round",
      }));
    }

    // 方案 C：仅破坏「主干大→末端小体量递减」（倒挂：主干缩小、末端藏青方反而最大）
    const radii = variant === "C" ? [6.5, 8, 9.5, 11.5] : [14.5, 9.5, 7.5, 6.2];
    const colors = [PALETTE.rootOrange, PALETTE.l2Green, PALETTE.l3Pink, PALETTE.l4Navy];
    for (const n of nodes) {
      const r = radii[n.l];
      const fill = colors[n.l];
      if (n.l === 1 || n.l === 3) {
        svg.append(svgEl("rect", { x: n.x - r, y: n.y - r, width: r * 2, height: r * 2, fill, stroke: PALETTE.paper, "stroke-width": 1.1 }));
      } else {
        svg.append(svgEl("circle", { cx: n.x, cy: n.y, r, fill, stroke: PALETTE.paper, "stroke-width": 1.1 }));
      }
    }
  }

  opts.forEach((btn) => {
    const svg = btn.querySelector("svg");
    if (svg) drawQuizSvg(svg, btn.dataset.quiz);
  });

  const EXPLAIN = {
    A: {
      ok: false,
      title: "选了方案 A —— 问题在「同层纵列错位」",
      text: "它的主干够大、连线也没交叉，但第 3 层粉圆和第 4 层藏青方前后交错乱跳（违反 Reingold–Tilford 同层对齐原则），眼睛无法一眼区分谁是子场景、谁是末端操作。",
    },
    B: {
      ok: true,
      title: "答对了！方案 B 兼顾了全部四条构图条件",
      text: "橘红主干居左领衔，体量逐级递减，45° 绿枝零交叉展开，四级节点严整落在四条隐藏纵列上——视线可以不带停顿地从总入口滑向全部 6 项操作。",
    },
    C: {
      ok: false,
      title: "选了方案 C —— 问题在「体量权重倒挂」",
      text: "它的纵列对齐和零交叉都做对了，却把右侧 6 枚末端藏青方画得比左侧主干大得多。视觉重心掉进右边，读者会不自觉地从末端倒着往回找主干。",
    },
    D: {
      ok: false,
      title: "选了方案 D —— 问题在「跨支交叉打结」",
      text: "它的体量递减和四列对齐都达标，但中路与下路的两组三级分支跨区斜穿，凭空造出枝线交叉，视线走到一半就被迫停下来辨认归属。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ans = btn.dataset.quiz;
      const e = EXPLAIN[ans];
      opts.forEach((x) => {
        x.classList.remove("is-picked", "is-correct", "is-wrong");
        x.setAttribute("aria-pressed", String(x === btn));
        if (x === btn) x.classList.add("is-picked", e.ok ? "is-correct" : "is-wrong");
        if (!e.ok && x.dataset.quiz === "B") x.classList.add("is-correct");
      });
      fb.hidden = false;
      fb.className = `s7-feedback ${e.ok ? "is-ok" : "is-err"}`;
      fb.innerHTML = `<strong>${e.title}</strong><p>${e.text}</p>`;
      if (resetBtn) resetBtn.hidden = false;
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      opts.forEach((x) => {
        x.classList.remove("is-picked", "is-correct", "is-wrong");
        x.setAttribute("aria-pressed", "false");
      });
      fb.hidden = true;
      resetBtn.hidden = true;
    });
  }
}

// =========================================================================
// 08 节：原海报灯箱（点击放大、拖动平移、Esc / 关闭按钮收起）
// =========================================================================
export function initPosterLightbox() {
  const btn = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbClose = document.getElementById("lb-close");
  const lbZoom = document.getElementById("lb-zoom");
  if (!btn || !posterImg || !dialog || !lbImg) return;

  let zoomed = false;
  let tx = 0, ty = 0;
  let dragging = false, sx = 0, sy = 0;

  const applyTransform = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoomed ? 1.85 : 1})`;
    lbImg.style.cursor = zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in";
    if (lbZoom) lbZoom.textContent = zoomed ? "还原 100%" : "放大细看";
  };

  const open = () => {
    lbImg.src = posterImg.src;
    zoomed = false; tx = 0; ty = 0;
    applyTransform();
    dialog.showModal();
    btn.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    if (dialog.open) dialog.close();
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", open);
  if (lbClose) lbClose.addEventListener("click", close);
  dialog.addEventListener("cancel", () => btn.setAttribute("aria-expanded", "false"));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });

  const toggleZoom = () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  };
  if (lbZoom) lbZoom.addEventListener("click", toggleZoom);

  lbImg.addEventListener("pointerdown", (e) => {
    if (!zoomed) { toggleZoom(); return; }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture(e.pointerId);
    applyTransform();
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = Math.max(-420, Math.min(420, e.clientX - sx));
    ty = Math.max(-520, Math.min(520, e.clientY - sy));
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; applyTransform(); });
}
