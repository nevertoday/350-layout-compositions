// 01–07 节专属互动实验模块（每节控件各不相同，绝不相邻复用）
import { PALETTE, ROLE_META } from "./palette.js";
import { drawCutoutSilhouette } from "./stage-canvas.js";
import { pixelRatio } from "../../lib/stage.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// =========================================================================
// 01 节：画史群像解剖卷（4 时代里程碑切签 + 构图骨架 X 光开关）
// =========================================================================
const ERAS = [
  {
    id: "yeyantu",
    year: "五代 · 宋摹本",
    work: "《韩熙载夜宴图》卷",
    author: "顾闳中（传）· 故宫博物院藏",
    size: "绢本设色 · 纵 28.7 cm × 横 335.5 cm",
    takeaway: "用屏风与床榻做「空间断句」，把数十位人物切成五幕独立群落",
    body: "长卷里如果把听乐、观舞、暂歇、清吹、散宴的人物无缝堆成一团，读者很快会被密集服饰淹没。画家借立屏与床榻在画面中制造干净的垂直隔断，每幕只保留一个行动焦点（高帽长髯的韩熙载多次复现），其余侍女与乐伎按疏密聚散环列，既容纳大信息量又保留游观呼吸。",
    figures: [
      { x: 0.14, y: 0.78, h: 0.36, role: "grey" },
      { x: 0.22, y: 0.76, h: 0.44, role: "red", lead: true },
      { x: 0.30, y: 0.80, h: 0.34, role: "black" },
      { x: 0.46, y: 0.82, h: 0.36, role: "blue" },
      { x: 0.54, y: 0.78, h: 0.42, role: "red" },
      { x: 0.62, y: 0.82, h: 0.32, role: "grey" },
      { x: 0.78, y: 0.79, h: 0.35, role: "black" },
      { x: 0.86, y: 0.76, h: 0.40, role: "blue" },
    ],
    xray: "screens",
  },
  {
    id: "supper",
    year: "约 1495–1498",
    work: "《最后的晚餐》",
    author: "达·芬奇 · 米兰圣玛丽亚感恩教堂",
    size: "壁画 · 13 人餐桌群像",
    takeaway: "13 人拆成「1 位孤立中心 + 4 组 3 人小组」，用分组消解人数压力",
    body: "面对十三个并排坐于长桌一侧的苛刻命题，达·芬奇没有画成呆板的等距长队，而是把十二门徒按情绪反应捏成左右各两组「三人小组」，彼此俯身议论、动作连成波浪；唯独正中央的焦点人物孤立在明亮窗框前，建筑透视线全部汇向他的头部，一眼就能定住视觉中心。",
    figures: [
      { x: 0.10, y: 0.76, h: 0.34, role: "blue" },
      { x: 0.16, y: 0.78, h: 0.36, role: "blue" },
      { x: 0.22, y: 0.76, h: 0.35, role: "grey" },
      { x: 0.31, y: 0.78, h: 0.36, role: "black" },
      { x: 0.37, y: 0.75, h: 0.35, role: "black" },
      { x: 0.42, y: 0.79, h: 0.34, role: "grey" },
      { x: 0.50, y: 0.77, h: 0.46, role: "red", lead: true },
      { x: 0.58, y: 0.79, h: 0.35, role: "black" },
      { x: 0.63, y: 0.75, h: 0.36, role: "black" },
      { x: 0.69, y: 0.78, h: 0.34, role: "grey" },
      { x: 0.78, y: 0.76, h: 0.35, role: "blue" },
      { x: 0.84, y: 0.78, h: 0.36, role: "blue" },
      { x: 0.90, y: 0.76, h: 0.34, role: "grey" },
    ],
    xray: "triads",
  },
  {
    id: "nightwatch",
    year: "1642",
    work: "《夜巡》",
    author: "伦勃朗 · 阿姆斯特丹国立博物馆 SK-C-5",
    size: "布面油画 · 民兵连队 34 人",
    takeaway: "终结「一字排开人人露脸」合照传统，用强光、纵深与行进动势立主次",
    body: "17 世纪荷兰民兵群像通常要求每位出资队员平起平坐。伦勃朗却在《夜巡》里大胆打破均权横排：他把连长与副官推到前景强光区，以红蓝金对比锁死视觉中心，其余队员退入中后景暗调与长矛斜线中，彼此错落遮挡、正在整队出发——这正是现代电影群像纵深调度的先声。",
    figures: [
      { x: 0.16, y: 0.72, h: 0.33, role: "grey" },
      { x: 0.25, y: 0.79, h: 0.38, role: "black" },
      { x: 0.34, y: 0.70, h: 0.34, role: "grey" },
      { x: 0.45, y: 0.89, h: 0.54, role: "red", lead: true },
      { x: 0.57, y: 0.87, h: 0.49, role: "blue" },
      { x: 0.67, y: 0.75, h: 0.36, role: "black" },
      { x: 0.76, y: 0.82, h: 0.37, role: "grey" },
      { x: 0.85, y: 0.73, h: 0.31, role: "grey" },
    ],
    xray: "depth",
  },
  {
    id: "gestalt",
    year: "1923 / 1991 / 2005",
    work: "格式塔分组与电影场面调度",
    author: "Wertheimer · Katz · Bordwell",
    size: "知觉心理学 × 影视纵深镜头理论",
    takeaway: "人脑靠「邻近、相似、共同命运」瞬间打包人群，电影用机位与走位动态重组",
    body: "1923 年韦特海默在《心理学研究》中阐明人眼会自动把位置相近、色形相似、朝向一致的元素合并成组；随后卡茨（1991）与波德维尔（2005）在影视调度研究中指出，导演不必靠频繁切镜头就能引导注意力——通过前景遮掩留口（aperture framing）、人物走位聚散与光色反差，单个长镜头即可完成多轮焦点交接。",
    figures: [
      { x: 0.19, y: 0.86, h: 0.44, role: "black" },
      { x: 0.29, y: 0.78, h: 0.35, role: "grey" },
      { x: 0.52, y: 0.80, h: 0.52, role: "red", lead: true },
      { x: 0.69, y: 0.84, h: 0.39, role: "blue" },
      { x: 0.78, y: 0.76, h: 0.33, role: "blue" },
      { x: 0.85, y: 0.89, h: 0.28, role: "grey" },
    ],
    xray: "gestalt",
  },
];

export function initOriginSection() {
  const tabsWrap = document.getElementById("era-tabs");
  const xrayBtn = document.getElementById("era-xray-btn");
  const svg = document.getElementById("era-svg");
  const metaYear = document.getElementById("era-year");
  const metaTitle = document.getElementById("era-title");
  const metaAuthor = document.getElementById("era-author");
  const metaTakeaway = document.getElementById("era-takeaway");
  const metaBody = document.getElementById("era-body");
  if (!tabsWrap || !svg) return;

  let activeIdx = 0;
  let xrayOn = true;

  function render() {
    const era = ERAS[activeIdx];
    metaYear.textContent = `${era.year} · ${era.size}`;
    metaTitle.textContent = era.work;
    metaAuthor.textContent = era.author;
    metaTakeaway.textContent = era.takeaway;
    metaBody.textContent = era.body;

    [...tabsWrap.querySelectorAll("button")].forEach((b, i) => {
      b.setAttribute("aria-pressed", String(i === activeIdx));
      b.classList.toggle("is-active", i === activeIdx);
    });
    if (xrayBtn) {
      xrayBtn.setAttribute("aria-pressed", String(xrayOn));
      xrayBtn.textContent = xrayOn ? "构图骨架透视：开" : "构图骨架透视：关";
    }

    const W = 640;
    const H = 260;
    const parts = [];
    parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${PALETTE.paper}"/>`);

    // X光结构底图
    if (xrayOn) {
      if (era.xray === "screens") {
        // 屏风竖向断句隔断
        for (const sx of [0.38, 0.70]) {
          parts.push(`<rect x="${W * sx - 4}" y="22" width="8" height="${H - 44}" fill="${PALETTE.blue}" fill-opacity="0.16" stroke="${PALETTE.blue}" stroke-width="1.5" stroke-dasharray="4 3"/>`);
          parts.push(`<text x="${W * sx}" y="16" text-anchor="middle" font-size="11" fill="${PALETTE.blueTextLight}" font-family="Noto Sans SC, sans-serif">屏风断句</text>`);
        }
      } else if (era.xray === "triads") {
        // 四组三人包络 + 中央透视汇点
        const groups = [
          [0.06, 0.25, "组 1"],
          [0.27, 0.45, "组 2"],
          [0.55, 0.73, "组 3"],
          [0.75, 0.94, "组 4"],
        ];
        for (const [x0, x1, lbl] of groups) {
          parts.push(`<rect x="${W * x0}" y="82" width="${W * (x1 - x0)}" height="148" rx="8" fill="${PALETTE.blue}" fill-opacity="0.08" stroke="${PALETTE.blue}" stroke-width="1.4" stroke-dasharray="5 3"/>`);
          parts.push(`<text x="${W * ((x0 + x1) / 2)}" y="74" text-anchor="middle" font-size="11" fill="${PALETTE.blueTextLight}" font-family="Noto Sans SC, sans-serif">${lbl}（3人）</text>`);
        }
        // 透视收敛线指向中央焦点
        const cx = W * 0.50;
        const cy = 104;
        for (const [tx, ty] of [[0, 12], [W, 12], [0, 56], [W, 56]]) {
          parts.push(`<line x1="${tx}" y1="${ty}" x2="${cx}" y2="${cy}" stroke="${PALETTE.red}" stroke-opacity="0.48" stroke-width="1.2" stroke-dasharray="4 4"/>`);
        }
      } else if (era.xray === "depth") {
        // 伦勃朗纵深三角与前景强光锥
        parts.push(`<polygon points="${W * 0.50},28 ${W * 0.30},${H - 18} ${W * 0.72},${H - 18}" fill="${PALETTE.red}" fill-opacity="0.09" stroke="${PALETTE.red}" stroke-width="1.4" stroke-dasharray="5 3"/>`);
        parts.push(`<line x1="20" y1="${H * 0.72}" x2="${W - 20}" y2="${H * 0.72}" stroke="${PALETTE.inkLine}" stroke-dasharray="4 4"/>`);
        parts.push(`<text x="26" y="${H * 0.70}" font-size="11" fill="${PALETTE.inkMuted}" font-family="Noto Sans SC, sans-serif">后景暗调纵深</text>`);
        parts.push(`<text x="${W * 0.51}" y="22" text-anchor="middle" font-size="11" fill="${PALETTE.redTextLight}" font-family="Noto Sans SC, sans-serif">前景强光锥</text>`);
      } else {
        // 格式塔邻近椭圆包络 + 视口取景框
        parts.push(`<rect x="${W * 0.11}" y="44" width="${W * 0.25}" height="184" rx="14" fill="${PALETTE.ink}" fill-opacity="0.06" stroke="${PALETTE.ink}" stroke-dasharray="4 3"/>`);
        parts.push(`<rect x="${W * 0.62}" y="52" width="${W * 0.29}" height="176" rx="14" fill="${PALETTE.blue}" fill-opacity="0.08" stroke="${PALETTE.blue}" stroke-dasharray="4 3"/>`);
        parts.push(`<line x1="${W * 0.24}" y1="120" x2="${W * 0.50}" y2="108" stroke="${PALETTE.red}" stroke-width="1.6" stroke-dasharray="4 3"/>`);
        parts.push(`<line x1="${W * 0.73}" y1="122" x2="${W * 0.54}" y2="108" stroke="${PALETTE.red}" stroke-width="1.6" stroke-dasharray="4 3"/>`);
        parts.push(`<text x="${W * 0.52}" y="30" text-anchor="middle" font-size="11" fill="${PALETTE.redTextLight}" font-family="Noto Sans SC, sans-serif">前景留口 · 视线汇向主角</text>`);
      }
    }

    // 人物剪影（无五官、带白边）
    const ordered = [...era.figures].sort((a, b) => a.y - b.y);
    for (const f of ordered) {
      const cx = f.x * W;
      const baseY = f.y * H + 20;
      const ph = f.h * H;
      const hr = clamp(ph * 0.145, 7, 17);
      const sw = clamp(ph * 0.42, 18, 52);
      const topY = baseY - ph;
      const hcy = topY + hr;
      const tTop = hcy + hr + 2;
      const tH = Math.max(10, baseY - tTop);
      const fill = ROLE_META[f.role].fill;
      const r = Math.min(sw * 0.42, tH * 0.4, 14);
      const d = `M ${cx - sw / 2} ${baseY} L ${cx - sw / 2} ${tTop + r} Q ${cx - sw / 2} ${tTop} ${cx - sw / 2 + r} ${tTop} L ${cx + sw / 2 - r} ${tTop} Q ${cx + sw / 2} ${tTop} ${cx + sw / 2} ${tTop + r} L ${cx + sw / 2} ${baseY} Z`;
      parts.push(`<path d="${d}" fill="${fill}" stroke="#FFFFFF" stroke-width="3" paint-order="stroke"/>`);
      parts.push(`<circle cx="${cx}" cy="${hcy}" r="${hr}" fill="${fill}" stroke="#FFFFFF" stroke-width="3" paint-order="stroke"/>`);
      if (f.lead && xrayOn) {
        parts.push(`<line x1="${cx}" y1="${hcy - hr - 6}" x2="${cx}" y2="${hcy - hr - 16}" stroke="${PALETTE.red}" stroke-width="2.4" stroke-linecap="round"/>`);
        parts.push(`<line x1="${cx - 10}" y1="${hcy - hr - 4}" x2="${cx - 17}" y2="${hcy - hr - 13}" stroke="${PALETTE.red}" stroke-width="2.4" stroke-linecap="round"/>`);
        parts.push(`<line x1="${cx + 10}" y1="${hcy - hr - 4}" x2="${cx + 17}" y2="${hcy - hr - 13}" stroke="${PALETTE.red}" stroke-width="2.4" stroke-linecap="round"/>`);
      }
    }

    svg.innerHTML = parts.join("");
  }

  tabsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-era]");
    if (!btn) return;
    activeIdx = Number(btn.dataset.era) || 0;
    render();
  });

  if (xrayBtn) {
    xrayBtn.addEventListener("click", () => {
      xrayOn = !xrayOn;
      render();
    });
  }

  render();
}

// =========================================================================
// 02 节：集中式 VS 分散式 实景双屏对比推帘（Before / After Split Curtain）
// =========================================================================
export function initSplitCurtainSection() {
  const wrap = document.getElementById("curtain-stage");
  const canvas = document.getElementById("curtain-canvas");
  const range = document.getElementById("curtain-range");
  const valEl = document.getElementById("curtain-val");
  const noteEl = document.getElementById("curtain-note");
  const quickBtns = document.getElementById("curtain-quick");
  if (!wrap || !canvas || !range) return;

  const ctx = canvas.getContext("2d");
  let split = 50; // 0..100（左集中式占比%）

  const CONC_CAST = [
    { x: 0.50, y: 0.80, h: 0.62, role: "red", lead: true },
    { x: 0.39, y: 0.70, h: 0.45, role: "black" },
    { x: 0.61, y: 0.71, h: 0.45, role: "blue" },
    { x: 0.31, y: 0.87, h: 0.39, role: "blue" },
    { x: 0.50, y: 0.91, h: 0.31, role: "grey" },
    { x: 0.68, y: 0.86, h: 0.38, role: "black", variant: "bun" },
    { x: 0.25, y: 0.76, h: 0.31, role: "grey", variant: "bun" },
    { x: 0.74, y: 0.77, h: 0.31, role: "grey" },
    { x: 0.40, y: 0.94, h: 0.26, role: "red" },
    { x: 0.60, y: 0.94, h: 0.26, role: "blue" },
  ];

  const DISP_CAST = [
    { x: 0.66, y: 0.82, h: 0.55, role: "red", lead: true },
    { x: 0.77, y: 0.74, h: 0.39, role: "black" },
    { x: 0.87, y: 0.88, h: 0.30, role: "grey", variant: "bun" },
    { x: 0.34, y: 0.84, h: 0.40, role: "blue" },
    { x: 0.43, y: 0.72, h: 0.32, role: "grey" },
    { x: 0.25, y: 0.90, h: 0.30, role: "blue" },
    { x: 0.13, y: 0.76, h: 0.34, role: "black", variant: "bun" },
    { x: 0.58, y: 0.92, h: 0.26, role: "grey" },
    { x: 0.17, y: 0.89, h: 0.25, role: "grey" },
    { x: 0.74, y: 0.92, h: 0.25, role: "blue" },
  ];

  function projectSimple(list, w, h) {
    return list
      .map((a, i) => {
        const pxH = a.h * h;
        const headR = clamp(pxH * 0.142, 9, 28);
        const shoulderW = clamp(pxH * 0.43, 24, 96);
        const cx = a.x * w;
        const baseY = a.y * h;
        const topY = baseY - pxH;
        const headCy = topY + headR + 2;
        const torsoTop = headCy + headR + 3;
        return {
          ...a,
          effX: a.x,
          effY: a.y,
          effH: a.h,
          cx,
          baseY,
          topY,
          pxH,
          headCx: cx,
          headCy,
          headR,
          shoulderW,
          torsoTop,
          torsoH: Math.max(12, baseY - torsoTop),
          zKey: a.y * 10 - a.h * 0.4 + i * 0.001,
        };
      })
      .sort((a, b) => a.zKey - b.zKey);
  }

  function drawSide(cast, bg, accent, tag, w, h, alignRight) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 辅助空间线索
    ctx.save();
    if (!alignRight) {
      // 集中式：向心聚合光环
      ctx.strokeStyle = "rgba(235, 51, 20, 0.20)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(w * 0.50, h * 0.62, w * 0.28, h * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 分散式：两条组间呼吸走廊（对应左蓝/中红主群落与最左/右翼间的透气留白）
      ctx.fillStyle = "rgba(13, 65, 204, 0.07)";
      ctx.fillRect(w * 0.46, h * 0.14, w * 0.10, h * 0.78);
      ctx.fillRect(w * 0.19, h * 0.14, w * 0.05, h * 0.78);
    }
    ctx.restore();

    const ordered = projectSimple(cast, w, h);
    for (const p of ordered) {
      drawCutoutSilhouette(ctx, p, {
        rimColor: "#FFFFFF",
        rimWidth: w < 460 ? 2.6 : 3.4,
        isLead: !!p.lead,
        still: true,
      });
    }

    // 侧角标
    ctx.save();
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    const tw = ctx.measureText(tag).width + 18;
    const x = alignRight ? w - tw - 12 : 12;
    ctx.fillStyle = accent;
    ctx.fillRect(x, 12, tw, 24);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, x + 9, 24);
    ctx.restore();
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cutX = (split / 100) * w;

    const leftTag = w < 480 ? "集中式" : "集中式 · CONCENTRATED";
    const rightTag = w < 480 ? "分散式" : "分散式 · DISPERSED";

    // 左半：集中式
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cutX, h);
    ctx.clip();
    drawSide(CONC_CAST, "#FAF4F0", PALETTE.red, leftTag, w, h, false);
    ctx.restore();

    // 右半：分散式
    ctx.save();
    ctx.beginPath();
    ctx.rect(cutX, 0, w - cutX, h);
    ctx.clip();
    drawSide(DISP_CAST, "#EDF2FA", PALETTE.blue, rightTag, w, h, true);
    ctx.restore();

    // 中央对比拉杆与黑圆 VS 徽标（1:1 呼应原海报底部的 VS 黑圆）
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cutX, 0);
    ctx.lineTo(cutX, h);
    ctx.stroke();

    const hy = h * 0.5;
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(cutX, hy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `400 13px "Anton", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", cutX, hy + 0.5);
    ctx.restore();

    if (valEl) valEl.textContent = `集中 ${split}% / 分散 ${100 - split}%`;
    if (noteEl) {
      if (split >= 78) {
        noteEl.textContent = "全员向中央朱红主角收束：横向跨度压缩在画面中段 50% 内，能量极度集中，适合剧照海报、团队宣言与情绪高潮。";
      } else if (split <= 22) {
        noteEl.textContent = "十人拆成 3 个独立子群落并留出两条留白走廊：横向跨度铺开至 76%，环境空间感舒展，适合群戏调度与多线关系交代。";
      } else {
        noteEl.textContent = "拉动黑圆 VS 推帘可直观对照：同一批 10 位演员，仅改变「聚拢还是分组」，画面立刻从凝聚宣言切换为叙事空间。";
      }
    }
  }

  range.addEventListener("input", () => {
    split = Number(range.value);
    render();
  });

  // 直接在画布上拖拉推帘
  let dragging = false;
  const setFromClientX = (cx) => {
    const r = canvas.getBoundingClientRect();
    split = Math.round(clamp(((cx - r.left) / r.width) * 100, 4, 96));
    range.value = String(split);
    render();
  };
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) setFromClientX(e.clientX);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  if (quickBtns) {
    quickBtns.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-split]");
      if (!b) return;
      split = Number(b.dataset.split);
      range.value = String(split);
      render();
    });
  }

  new ResizeObserver(render).observe(canvas);
  render();
}

// =========================================================================
// 03 节（暗房）：机位高度 × 纵深跨度 联动剖面仪
// =========================================================================
export function initDepthLabSection() {
  const camCanvas = document.getElementById("depth-cam-canvas");
  const elevRange = document.getElementById("depth-elev");
  const spanRange = document.getElementById("depth-span");
  const staggerBtn = document.getElementById("depth-stagger-btn");
  const elevVal = document.getElementById("depth-elev-val");
  const spanVal = document.getElementById("depth-span-val");
  const readoutEl = document.getElementById("depth-readout");
  if (!camCanvas || !elevRange || !spanRange) return;

  const ctx = camCanvas.getContext("2d");
  let elev = 0; // 0(平视) .. 100(高机位俯拍)
  let span = 15; // 0(全员贴墙) .. 100(三排深度拉开)
  let stagger = false; // 是否横向插空站位

  // 三排共 9 人（前 3、中 3 含红主角、后 3）
  const ROWS = [
    // row 0: 前排（距离相机近）
    { row: 0, slot: -1, role: "blue", heightM: 1.72 },
    { row: 0, slot: 0, role: "grey", heightM: 1.66 },
    { row: 0, slot: 1, role: "black", heightM: 1.72 },
    // row 1: 中排（红主角）
    { row: 1, slot: -1, role: "black", heightM: 1.78 },
    { row: 1, slot: 0, role: "red", heightM: 1.88, lead: true },
    { row: 1, slot: 1, role: "blue", heightM: 1.78 },
    // row 2: 后排
    { row: 2, slot: -1, role: "grey", heightM: 1.74 },
    { row: 2, slot: 0, role: "grey", heightM: 1.75 },
    { row: 2, slot: 1, role: "blue", heightM: 1.74 },
  ];

  function render() {
    const rect = camCanvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(230, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (camCanvas.width !== Math.round(w * dpr) || camCanvas.height !== Math.round(h * dpr)) {
      camCanvas.width = Math.round(w * dpr);
      camCanvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 暗房背景
    ctx.fillStyle = "#16191D";
    ctx.fillRect(0, 0, w, h);

    const isWide = w >= 560;
    const planW = isWide ? Math.round(w * 0.34) : 0;
    const viewX = planW;
    const viewW = w - planW;

    // 计算每个演员的物理三维坐标 (wx, wz) 与相机投影
    const camH = 1.48 + (elev / 100) * 1.55; // 1.48m 平视 ~ 3.03m 高机位
    const rowGapZ = 0.28 + (span / 100) * 1.65; // 0.28m 贴墙 ~ 1.93m 拉开三层
    const baseZ = 3.4;

    const proj = ROWS.map((r, i) => {
      const z = baseZ + r.row * rowGapZ;
      // 未插空时三排前后直线对齐（必叠头）；插空时随排数略微扇形展开并错半格，让每颗头都落在前排肩缝之间
      const lateralStep = stagger ? 0.84 + r.row * 0.42 : 0.72;
      const staggerOff = stagger ? (r.row === 0 ? -0.36 : r.row === 2 ? 0.44 : 0) : 0;
      const wx = r.slot * lateralStep + staggerOff;

      // 真实针孔透视投影
      const focal = viewW * 0.68;
      const horizonY = h * (0.28 + (elev / 100) * 0.24);
      const sx = viewX + viewW * 0.5 + (wx / z) * focal;
      const feetY = horizonY + (camH / z) * (h * 0.68);
      const headTopY = horizonY + ((camH - r.heightM) / z) * (h * 0.68);
      const pxH = clamp(feetY - headTopY, 34, h * 0.78);
      const headR = clamp(pxH * 0.142, 7, 22);
      const shoulderW = clamp(pxH * 0.40, 20, 78);
      const headCy = headTopY + headR;

      return {
        ...r,
        index: i,
        wx,
        wz: z,
        cx: sx,
        baseY: clamp(feetY, h * 0.45, h * 0.96),
        topY: clamp(feetY, h * 0.45, h * 0.96) - pxH,
        pxH,
        headCx: sx,
        headCy: clamp(feetY, h * 0.45, h * 0.96) - pxH + headR,
        headR,
        shoulderW,
        torsoTop: clamp(feetY, h * 0.45, h * 0.96) - pxH + headR * 2 + 3,
        torsoH: Math.max(10, pxH - headR * 2 - 3),
      };
    });

    // 实测遮挡头数（排在前面的演员是否压住了后面演员的头）
    let blockedHeads = 0;
    const blockedSet = new Set();
    for (let i = 0; i < proj.length; i++) {
      const back = proj[i];
      for (let j = 0; j < proj.length; j++) {
        const front = proj[j];
        if (front.wz >= back.wz - 0.05) continue;
        const headOverlap = Math.hypot(front.headCx - back.headCx, front.headCy - back.headCy) < (front.headR + back.headR) * 0.95;
        const torsoCoversHead =
          Math.abs(back.headCx - front.cx) < front.shoulderW * 0.52 &&
          back.headCy >= front.torsoTop - front.headR * 0.3 &&
          back.headCy <= front.baseY;
        if (headOverlap || torsoCoversHead) {
          blockedSet.add(back.index);
          break;
        }
      }
    }
    blockedHeads = blockedSet.size;

    // 左栏（宽屏）：俯视机位站位图
    if (isWide) {
      ctx.save();
      ctx.fillStyle = "#111315";
      ctx.fillRect(0, 0, planW, h);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(planW, 0);
      ctx.lineTo(planW, h);
      ctx.stroke();

      // 镜头视锥
      const camX = planW * 0.5;
      const camY = h - 28;
      ctx.fillStyle = "rgba(115, 164, 255, 0.09)";
      ctx.beginPath();
      ctx.moveTo(camX, camY);
      ctx.lineTo(14, 24);
      ctx.lineTo(planW - 14, 24);
      ctx.closePath();
      ctx.fill();

      // 俯视三排站位点
      for (const p of proj) {
        const px = camX + p.wx * (planW * 0.24);
        const py = camY - ((p.wz - 2.2) / 6.6) * (h - 62);
        ctx.fillStyle = ROLE_META[p.role].fill;
        ctx.strokeStyle = blockedSet.has(p.index) ? PALETTE.redDarkBg : "#FFFFFF";
        ctx.lineWidth = blockedSet.has(p.index) ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.arc(px, py, p.lead ? 8.5 : 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 摄影机图标
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(camX - 10, camY - 5, 20, 11);
      ctx.font = `500 11px "DM Mono", monospace`;
      ctx.fillStyle = "#C8C6C0";
      ctx.textAlign = "left";
      ctx.fillText("TOP PLAN · 俯视布位", 12, 20);
      ctx.fillText(`机位 ${camH.toFixed(2)}m`, 12, h - 10);
      ctx.restore();
    }

    // 右栏（或手机全宽）：真实相机取景画面
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewX, 0, viewW, h);
    ctx.clip();

    // 暗房透视地板格线
    const hy = h * (0.28 + (elev / 100) * 0.20);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(viewX, hy);
    ctx.lineTo(w, hy);
    ctx.stroke();
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath();
      ctx.moveTo(viewX + viewW * 0.5, hy);
      ctx.lineTo(viewX + viewW * 0.5 + k * viewW * 0.28, h);
      ctx.stroke();
    }

    // 从后排到前排画剪影
    const ordered = [...proj].sort((a, b) => b.wz - a.wz);
    for (const p of ordered) {
      drawCutoutSilhouette(ctx, p, {
        rimColor: "#16191D",
        rimWidth: 2.8,
        darkBg: true,
        isLead: !!p.lead,
        isColliding: blockedSet.has(p.index),
        still: true,
      });
    }

    // 顶部暗房 HUD
    ctx.font = `500 11px "DM Mono", monospace`;
    ctx.fillStyle = "#E5E0D8";
    ctx.textAlign = "left";
    ctx.fillText("CAMERA VIEW · 取景实测", viewX + 14, 20);

    const statusStr = blockedHeads === 0 ? "0 处遮挡 · 全员清透" : `遮挡 ${blockedHeads} 人头肩`;
    const sw = ctx.measureText(statusStr).width + 18;
    ctx.fillStyle = blockedHeads === 0 ? PALETTE.okLight : PALETTE.red;
    ctx.fillRect(w - sw - 12, 8, sw, 22);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(statusStr, w - sw - 3, 22);
    ctx.restore();

    // 同步文字读数
    if (elevVal) elevVal.textContent = `${camH.toFixed(2)} m`;
    if (spanVal) spanVal.textContent = `${(rowGapZ * 2).toFixed(1)} m`;
    if (staggerBtn) {
      staggerBtn.setAttribute("aria-pressed", String(stagger));
      staggerBtn.textContent = stagger ? "横向插空站位：已开" : "横向插空站位：关闭";
    }
    if (readoutEl) {
      if (blockedHeads === 0) {
        readoutEl.textContent = `全部 9 位人物头肩清透，零叠头遮挡！通过${stagger ? "横向插空站位" : "抬高机位视角"}叠加 ${(rowGapZ * 2).toFixed(1)}m 前后纵深，前中后三层自然形成清晰的立体阶梯。`;
      } else {
        readoutEl.textContent = `当前有 ${blockedHeads} 位中后排人物被前排压住头肩（红虚圈告警）。平视且前后对齐时，后排几乎会被前排吃掉——试着开启「横向插空站位」或适度抬高机位。`;
      }
    }
  }

  elevRange.addEventListener("input", () => { elev = Number(elevRange.value); render(); });
  spanRange.addEventListener("input", () => { span = Number(spanRange.value); render(); });
  if (staggerBtn) {
    staggerBtn.addEventListener("click", () => { stagger = !stagger; render(); });
  }
  new ResizeObserver(render).observe(camCanvas);
  render();
}

// =========================================================================
// 04 节：视觉噪音减法清单（4 枚独立降噪拨闸，实时清洗 12 人过载画面）
// =========================================================================
export function initDensityStripperSection() {
  const canvas = document.getElementById("noise-canvas");
  const checksWrap = document.getElementById("noise-switches");
  const meterEl = document.getElementById("noise-meter");
  const verdictEl = document.getElementById("noise-verdict");
  if (!canvas || !checksWrap) return;

  const ctx = canvas.getContext("2d");
  const flags = {
    muteGrey: false,  // 把非核心配角衣色退灰
    unifyPose: false, // 统一子群朝向与高度节奏
    marginBreath: false, // 收束留白边距
    trimExtras: false, // 删减边缘 3 位冗余路人
  };

  const CHAOS_COLORS = ["#EB3314", "#0D41CC", "#D97706", "#059669", "#7C3AED", "#DB2777", "#0E100F", "#0D41CC", "#EB3314", "#B45309", "#0D9488", "#0E100F"];
  const CLEAN_ROLES = ["red", "black", "blue", "blue", "grey", "black", "grey", "grey", "blue", "grey", "grey", "grey"];

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = PALETTE.paperLight;
    ctx.fillRect(0, 0, w, h);

    // 留白安全框示意
    const padX = flags.marginBreath ? 0.16 : 0.05;
    if (flags.marginBreath) {
      ctx.save();
      ctx.fillStyle = "rgba(14, 107, 66, 0.06)";
      ctx.fillRect(0, 0, w * padX, h);
      ctx.fillRect(w * (1 - padX), 0, w * padX, h);
      ctx.restore();
    }

    const total = flags.trimExtras ? 9 : 12;
    const basePositions = [
      { x: 0.50, y: 0.81, h: 0.60, grp: 0, lead: true },
      { x: 0.38, y: 0.70, h: 0.43, grp: 1 },
      { x: 0.63, y: 0.71, h: 0.43, grp: 2 },
      { x: 0.26, y: 0.88, h: 0.39, grp: 1 },
      { x: 0.50, y: 0.92, h: 0.30, grp: 0 },
      { x: 0.74, y: 0.86, h: 0.37, grp: 2 },
      { x: 0.16, y: 0.75, h: 0.33, grp: 1 },
      { x: 0.83, y: 0.76, h: 0.33, grp: 2 },
      { x: 0.39, y: 0.94, h: 0.27, grp: 1 },
      { x: 0.07, y: 0.84, h: 0.37, grp: 1 },
      { x: 0.92, y: 0.84, h: 0.37, grp: 2 },
      { x: 0.62, y: 0.93, h: 0.34, grp: 2 },
    ];

    const active = basePositions.slice(0, total).map((p, i) => {
      const mappedX = padX + ((p.x - 0.05) / 0.90) * (1 - padX * 2);
      // 未统一姿态时高度杂乱跳动且自带冗余背景道具噪点
      const effH = flags.unifyPose ? p.h : clamp(0.41 + ((i * 7) % 5 - 2) * 0.025, 0.34, 0.48);
      const effY = flags.unifyPose ? p.y : 0.82 + (i % 2) * 0.05;
      const role = CLEAN_ROLES[i];
      const fill = flags.muteGrey ? ROLE_META[role].fill : CHAOS_COLORS[i];
      const pxH = effH * h;
      const headR = clamp(pxH * 0.14, 8, 25);
      const shoulderW = clamp(pxH * 0.42, 22, 86);
      const cx = mappedX * w;
      const baseY = effY * h;
      const topY = baseY - pxH;
      return {
        ...p,
        i,
        effX: mappedX,
        effH,
        role,
        customFill: fill,
        cx,
        baseY,
        topY,
        pxH,
        headCx: cx,
        headCy: topY + headR + 2,
        headR,
        shoulderW,
        torsoTop: topY + headR * 2 + 5,
        torsoH: Math.max(10, pxH - headR * 2 - 5),
        zKey: effY * 10 - effH * 0.4,
      };
    });

    // 若未开动作归一，叠加背景杂乱道具线噪点
    if (!flags.unifyPose) {
      ctx.save();
      ctx.strokeStyle = "rgba(14, 16, 15, 0.18)";
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 14; k++) {
        const bx = ((k * 73 + 29) % 92 + 4) / 100 * w;
        const by = ((k * 41 + 17) % 45 + 14) / 100 * h;
        ctx.strokeRect(bx, by, 26, 18);
      }
      ctx.restore();
    }

    const ordered = [...active].sort((a, b) => a.zKey - b.zKey);
    for (const p of ordered) {
      // 借自定义色画出杂色 vs 清洗色对比
      ctx.save();
      const sw = p.shoulderW;
      const x0 = p.cx - sw / 2;
      const rad = Math.min(sw * 0.42, p.torsoH * 0.4, 24);
      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(x0, p.baseY);
        ctx.lineTo(x0, p.torsoTop + rad);
        ctx.quadraticCurveTo(x0, p.torsoTop, x0 + rad, p.torsoTop);
        ctx.lineTo(x0 + sw - rad, p.torsoTop);
        ctx.quadraticCurveTo(x0 + sw, p.torsoTop, x0 + sw, p.torsoTop + rad);
        ctx.lineTo(x0 + sw, p.baseY);
        ctx.closePath();
      };
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 6;
      trace();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.headCx, p.headCy, p.headR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = p.customFill;
      trace();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.headCx, p.headCy, p.headR, 0, Math.PI * 2);
      ctx.fill();

      if (p.lead && flags.muteGrey && flags.unifyPose) {
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        for (const a of [-0.52, 0, 0.52]) {
          const ang = -Math.PI / 2 + a;
          ctx.beginPath();
          ctx.moveTo(p.headCx + Math.cos(ang) * (p.headR + 8), p.headCy + Math.sin(ang) * (p.headR + 8));
          ctx.lineTo(p.headCx + Math.cos(ang) * (p.headR + 20), p.headCy + Math.sin(ang) * (p.headR + 20));
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    const activeFixes = Object.values(flags).filter(Boolean).length;
    const distinctColors = flags.muteGrey ? 4 : 9;
    const greyShare = flags.muteGrey ? Math.round((active.filter((a) => a.role === "grey").length / active.length) * 100) : 0;
    const loadTier = activeFixes === 4 ? "清爽有序（示意）" : activeFixes >= 2 ? "中度减噪（示意）" : "视觉过载（示意）";

    if (meterEl) {
      meterEl.innerHTML =
        `<span>在场人数 <b>${total}人</b></span>` +
        `<span>独立色相 <b>${distinctColors}种</b></span>` +
        `<span>退灰占比 <b>${greyShare}%</b></span>` +
        `<span>认知负荷 <b>${loadTier}</b></span>`;
    }
    if (verdictEl) {
      if (activeFixes === 0) {
        verdictEl.textContent = "12 个人穿着 9 种高饱和花色、背景杂框林立且顶天立地塞满画框——人眼瞬间失去入口。逐一拨开旁边 4 枚减法开关试试看。";
      } else if (activeFixes < 4) {
        const left = [];
        if (!flags.muteGrey) left.push("配角衣色退灰");
        if (!flags.unifyPose) left.push("统一层次与清掉杂景");
        if (!flags.marginBreath) left.push("拉出四周留白");
        if (!flags.trimExtras) left.push("精简边缘冗余人影");
        verdictEl.textContent = `已卸掉 ${activeFixes}/4 层视觉噪音，画面开始透出结构。还可以继续开启：${left.join("、")}。`;
      } else {
        verdictEl.textContent = "4 步减法全部到位：核心主角以唯一朱红与高度脱颖而出，蓝黑支点勾出群落，暖灰退景与四周呼吸感让 9 人画面依然干净利落。";
      }
    }
  }

  checksWrap.addEventListener("change", (e) => {
    const inp = e.target.closest("input[data-noise]");
    if (!inp) return;
    flags[inp.dataset.noise] = inp.checked;
    render();
  });

  new ResizeObserver(render).observe(canvas);
  render();
}

// =========================================================================
// 05 节：四种群像翻车现场（交互翻卡对照）
// =========================================================================
export function initDontUseCards() {
  const grid = document.getElementById("dont-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-flip]");
    if (!btn) return;
    const card = btn.closest(".dont-card");
    if (!card) return;
    const showFix = card.dataset.mode !== "fix";
    card.dataset.mode = showFix ? "fix" : "fail";
    btn.setAttribute("aria-pressed", String(showFix));
    btn.textContent = showFix ? "切回翻车示范" : "看正确替代方案";
  });
}

// =========================================================================
// 06 节（深墨蓝考场）：两轮四选一单变量视觉辨析
// =========================================================================
const QUIZ_ROUNDS = [
  {
    id: 0,
    title: "第 1 题 / 共 2 题 · 唯一变量：色层与主次分配",
    prompt: "下面四个镜头中，10 位人物的站位、前后景深与身高落差完全一模一样，仅改变了「色彩层级分配」。哪一帧能让观众在 1 秒内抓住核心主角并看清群落？",
    correct: 1,
    options: [
      {
        key: "A",
        roles: ["black", "black", "black", "black", "black", "black", "black", "black", "black", "black"],
        reason: "方案 A 全员统一炭黑，虽然身高有高低，但缺乏色相与明度层级切分，10 个黑剪影连成一片压迫的暗块，核心主角不够跳脱。",
      },
      {
        key: "B",
        roles: ["red", "black", "blue", "blue", "grey", "black", "grey", "grey", "blue", "grey"],
        reason: "方案 B 正确！唯一高饱和信号朱红锁定中央最高主角，蓝黑两层交代左右阵营关系，4 位暖石灰人物主动退景降噪——色相、体量与位置三股力量同时指向同一焦点。",
      },
      {
        key: "C",
        roles: ["red", "red", "red", "blue", "grey", "red", "grey", "grey", "blue", "black"],
        reason: "方案 C 把 4 位中前排大人物同时涂成高饱和朱红，导致画面出现四个互相抢戏的热点，眼球在四个红块间来回弹跳，反而丢失了主次。",
      },
      {
        key: "D",
        roles: ["grey", "black", "blue", "blue", "grey", "black", "grey", "red", "blue", "grey"],
        reason: "方案 D 把中央最高大的人物降成了浅灰，却把最角落的小人物涂成刺眼朱红——体量焦点在正中、色彩焦点在右角，两条视觉信号互相打架。",
      },
    ],
    // 固定 10 人几何（确保 4 选项除了 roles 之外 100% 相同！）
    geom: [
      { x: 0.50, y: 0.80, h: 0.60 },
      { x: 0.37, y: 0.68, h: 0.43 },
      { x: 0.63, y: 0.69, h: 0.43 },
      { x: 0.27, y: 0.88, h: 0.39 },
      { x: 0.50, y: 0.92, h: 0.30 },
      { x: 0.72, y: 0.86, h: 0.37 },
      { x: 0.19, y: 0.75, h: 0.32 },
      { x: 0.81, y: 0.76, h: 0.31 },
      { x: 0.38, y: 0.94, h: 0.26 },
      { x: 0.62, y: 0.94, h: 0.26 },
    ],
  },
  {
    id: 1,
    title: "第 2 题 / 共 2 题 · 唯一变量：横向间距与聚散分组",
    prompt: "这一次，10 位人物的色彩主次与高矮阶梯完全一致，仅改变了他们的「横向站位与间距」。哪一帧最清楚地传达了群像的聚散节奏与阵营关系？",
    correct: 2,
    fixedRoles: ["red", "black", "blue", "blue", "grey", "black", "grey", "grey", "blue", "grey"],
    options: [
      {
        key: "A",
        xs: [0.10, 0.19, 0.28, 0.37, 0.46, 0.54, 0.63, 0.72, 0.81, 0.90],
        reason: "方案 A 把 10 个人严格等距排满横轴，像一排机械栅栏——邻近关系彻底抹平，看不出谁和谁是一伙、画面也没有聚散呼吸。",
      },
      {
        key: "B",
        xs: [0.50, 0.46, 0.54, 0.42, 0.50, 0.58, 0.39, 0.61, 0.45, 0.55],
        reason: "方案 B 把 10 个人死死挤进中间不到 25% 的窄缝里，多个圆头紧贴压撞、剪影粘连，两边留下空洞大白边，既拥挤又失比例。",
      },
      {
        key: "C",
        xs: [0.36, 0.24, 0.68, 0.16, 0.43, 0.77, 0.29, 0.86, 0.60, 0.73],
        reason: "方案 C 正确！主角在左中区与两位同伴聚成核心组，中间留出干净的呼吸走廊，右侧 5 人形成呼应阵营，组内紧、组间松且无一处叠头。",
      },
      {
        key: "D",
        xs: [0.11, 0.62, 0.71, 0.78, 0.66, 0.84, 0.74, 0.89, 0.68, 0.81],
        reason: "方案 D 把红主角孤零零抛到最左边界，其余 9 人全部堆在右半边：画面重心严重右塌，主角与群体之间失去呼应张力。",
      },
    ],
    baseYHs: [
      { y: 0.82, h: 0.56 },
      { y: 0.73, h: 0.41 },
      { y: 0.75, h: 0.42 },
      { y: 0.88, h: 0.34 },
      { y: 0.92, h: 0.28 },
      { y: 0.86, h: 0.36 },
      { y: 0.76, h: 0.30 },
      { y: 0.77, h: 0.30 },
      { y: 0.91, h: 0.28 },
      { y: 0.93, h: 0.25 },
    ],
  },
];

function buildQuizSvg(round, opt) {
  const W = 280;
  const H = 160;
  const actors = [];
  for (let i = 0; i < 10; i++) {
    const role = round.fixedRoles ? round.fixedRoles[i] : opt.roles[i];
    const x = opt.xs ? opt.xs[i] : round.geom[i].x;
    const y = round.baseYHs ? round.baseYHs[i].y : round.geom[i].y;
    const h = round.baseYHs ? round.baseYHs[i].h : round.geom[i].h;
    actors.push({ x, y, h, role, zKey: y * 10 - h * 0.4 + i * 0.001 });
  }
  actors.sort((a, b) => a.zKey - b.zKey);

  const parts = [`<rect x="0" y="0" width="${W}" height="${H}" fill="${PALETTE.paper}"/>`];
  for (const a of actors) {
    const cx = a.x * W;
    const baseY = a.y * H + 8;
    const pxH = a.h * H * 0.92;
    const hr = clamp(pxH * 0.145, 5.5, 13.5);
    const sw = clamp(pxH * 0.43, 14, 38);
    const topY = baseY - pxH;
    const hcy = topY + hr;
    const tTop = hcy + hr + 1.5;
    const tH = Math.max(8, baseY - tTop);
    const rad = Math.min(sw * 0.42, tH * 0.4, 10);
    const fill = ROLE_META[a.role].fill;
    const d = `M ${cx - sw / 2} ${baseY} L ${cx - sw / 2} ${tTop + rad} Q ${cx - sw / 2} ${tTop} ${cx - sw / 2 + rad} ${tTop} L ${cx + sw / 2 - rad} ${tTop} Q ${cx + sw / 2} ${tTop} ${cx + sw / 2} ${tTop + rad} L ${cx + sw / 2} ${baseY} Z`;
    parts.push(`<path d="${d}" fill="${fill}" stroke="#FFFFFF" stroke-width="2.4" paint-order="stroke"/>`);
    parts.push(`<circle cx="${cx}" cy="${hcy}" r="${hr}" fill="${fill}" stroke="#FFFFFF" stroke-width="2.4" paint-order="stroke"/>`);
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="quiz-svg" aria-hidden="true">${parts.join("")}</svg>`;
}

export function initQuizSection() {
  const titleEl = document.getElementById("quiz-round-title");
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const feedbackEl = document.getElementById("quiz-feedback");
  const roundBtns = document.getElementById("quiz-round-switch");
  if (!gridEl || !feedbackEl) return;

  let roundIdx = 0;
  const answers = [null, null];

  function render() {
    const r = QUIZ_ROUNDS[roundIdx];
    const picked = answers[roundIdx];
    if (titleEl) titleEl.textContent = r.title;
    if (promptEl) promptEl.textContent = r.prompt;

    if (roundBtns) {
      [...roundBtns.querySelectorAll("button")].forEach((b, i) => {
        b.classList.toggle("is-active", i === roundIdx);
        b.setAttribute("aria-pressed", String(i === roundIdx));
      });
    }

    gridEl.innerHTML = r.options
      .map((opt, idx) => {
        let cls = "quiz-opt";
        if (picked !== null) {
          if (idx === r.correct) cls += " is-correct";
          else if (idx === picked) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-opt="${idx}" aria-pressed="${picked === idx}">
            ${buildQuizSvg(r, opt)}
            <span class="quiz-opt-label">方案 ${opt.key}</span>
          </button>`;
      })
      .join("");

    if (picked === null) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.innerHTML = `<p>请先观察四个构图小样，选一选你认为主次与群落关系最清楚的一项。</p>`;
    } else {
      const ok = picked === r.correct;
      const pickedOpt = r.options[picked];
      const rightOpt = r.options[r.correct];
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-err"}`;
      feedbackEl.innerHTML = ok
        ? `<p><strong>判断准确 · 方案 ${pickedOpt.key}</strong></p><p>${pickedOpt.reason}</p>`
        : `<p><strong>选了方案 ${pickedOpt.key}（再比一比方案 ${rightOpt.key}）</strong></p><p>${pickedOpt.reason}</p><p class="quiz-why-right">${rightOpt.reason}</p>`;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-opt]");
    if (!b) return;
    answers[roundIdx] = Number(b.dataset.opt);
    render();
  });

  if (roundBtns) {
    roundBtns.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-round]");
      if (!b) return;
      roundIdx = Number(b.dataset.round);
      render();
    });
  }

  render();
}

// =========================================================================
// 07 节：原海报可放大拖动灯箱（draggable="false"，支持滚轮/按钮缩放 + 拖移 + Esc 关）
// =========================================================================
export function initPosterLightbox() {
  const thumbBtn = document.getElementById("poster-open");
  const thumbImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-modal");
  const stage = document.getElementById("poster-modal-stage");
  const fullImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomLabel = document.getElementById("poster-zoom-val");
  if (!thumbBtn || !thumbImg || !dialog || !fullImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    fullImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!fullImg.src) fullImg.src = thumbImg.currentSrc || thumbImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    thumbBtn.focus();
  }

  thumbBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 1, 3.2);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  zoomResetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  stage?.addEventListener("wheel", (e) => {
    if (dialog.hidden) return;
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  fullImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, tx, ty, id: e.pointerId };
    try { fullImg.setPointerCapture(e.pointerId); } catch {}
  });
  fullImg.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    applyTransform();
  });
  const endDrag = () => { drag = null; };
  fullImg.addEventListener("pointerup", endDrag);
  fullImg.addEventListener("pointercancel", endDrag);
}
