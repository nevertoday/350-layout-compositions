import { loop, pixelRatio } from "../../lib/stage.js";
import {
  VIEWPORTS,
  SCENARIOS,
  PRESETS,
  createInitialState,
  computeLayout,
  diagnoseLayout,
} from "./model.js";

// ==================== 全局状态与 DOM 绑定 ====================
const state = createInitialState();
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

let lastLayout = null;
let lastDiag = null;
let cachedHitBoxes = [];
let cachedHandles = { leftX: 0, rightX: 0, topY: 0, bottomY: 0, scale: 1, frameX: 0, frameY: 0, frameW: 0, frameH: 0 };
let dirty = true;
let animSweep = 0; // 开场视线扫掠微动，0.65s 内平稳到位
let hoverBlockId = null;

// 字体测量器（Canvas 与 model.js 严格单真源共用同一 font measure，略留 3% 粗体安全余量防越界）
function measureWithCtx(text, fontPx) {
  ctx.font = `600 ${fontPx}px "Noto Sans SC", sans-serif`;
  return ctx.measureText(text).width * 1.03;
}

// ==================== UI 同步（诊单 / 探针 / 四栏要点 / 右上活体纸页徽标） ====================
const dom = {
  topStatus: document.getElementById("top-status"),
  titleAxis: document.getElementById("title-axis"),
  emblemBars: document.getElementById("emblem-bars"),
  diagCard: document.getElementById("diag-card"),
  diagBadge: document.getElementById("diag-badge"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagHint: document.getElementById("diag-hint"),
  mCpl: document.getElementById("m-cpl"),
  mCol: document.getElementById("m-col"),
  mRatio: document.getElementById("m-ratio"),
  btnFixPrimary: document.getElementById("btn-fix-primary"),
  btnCssToggle: document.getElementById("btn-css-toggle"),
  cssDrawer: document.getElementById("css-drawer"),
  cssCode: document.getElementById("css-code"),
  btnGuides: document.getElementById("btn-guides"),
  btnScrollStep: document.getElementById("btn-scroll-step"),
  ctlWidth: document.getElementById("ctl-width"),
  outWidth: document.getElementById("out-width"),
  selBlockLabel: document.getElementById("sel-block-label"),
  btnMoveUp: document.getElementById("btn-move-up"),
  btnMoveDown: document.getElementById("btn-move-down"),
  btnDistract: document.getElementById("btn-distract"),
  powerSub: document.getElementById("power-sub"),
  kpsAlign: document.getElementById("kps-align"),
  kpsWidth: document.getElementById("kps-width"),
  kpsRhythm: document.getElementById("kps-rhythm"),
  kpsFlow: document.getElementById("kps-flow"),
};

function syncEmblem(layout) {
  if (!dom.emblemBars) return;
  // 右上角原海报纸页图标里的卡其横条随当前列宽与节奏实时伸缩
  const bars = dom.emblemBars.querySelectorAll("rect");
  const wNorm = Math.max(0.32, Math.min(1, layout.colRatio / 0.85));
  const barW = Math.round(56 * wNorm);
  const startX = state.align === "center" ? Math.round(52 - barW / 2) : 24;
  const step = state.rhythm === "cramped" ? 8 : state.rhythm === "chasm" ? 15 : 12;
  bars.forEach((rect, i) => {
    if (i === 0) {
      rect.setAttribute("x", String(startX));
      rect.setAttribute("width", String(Math.max(16, Math.round(barW * 0.58))));
      rect.setAttribute("height", state.hierarchy === "flat" ? "5" : "8");
    } else {
      const y = 38 + (i - 1) * step;
      rect.setAttribute("y", String(Math.min(108, y)));
      rect.setAttribute("x", String(state.align === "zigzag" ? (i % 2 ? 22 : 34) : startX));
      rect.setAttribute("width", String(i === bars.length - 1 ? Math.round(barW * 0.74) : barW));
    }
  });
}

function syncUI(layout, diag) {
  // 顶栏状态与自示范标题左侧齐轴线
  dom.topStatus.textContent = diag.primary.badge;
  dom.topStatus.classList.toggle("is-ok", diag.passed);
  dom.topStatus.classList.toggle("is-err", !diag.passed);
  dom.titleAxis.classList.toggle("is-aligned", state.align === "left");

  // 诊单卡
  dom.diagCard.classList.toggle("is-ok", diag.passed);
  dom.diagBadge.textContent = diag.primary.badge;
  dom.diagBadge.classList.toggle("is-ok", diag.passed);
  dom.diagBadge.classList.toggle("is-err", !diag.passed);
  dom.diagTitle.textContent = diag.primary.title;
  dom.diagWhy.textContent = diag.primary.why;
  dom.diagHint.textContent = diag.primary.hint;

  dom.mCpl.textContent = `${Math.round(layout.avgCpl)} 字/行`;
  dom.mCol.textContent = `${layout.colW}px / ${layout.marginPct}%`;
  dom.mRatio.textContent = `${layout.typeRatio}×`;

  if (diag.primary.fixAction) {
    dom.btnFixPrimary.hidden = false;
    dom.btnFixPrimary.textContent = diag.primary.fixLabel;
    dom.btnFixPrimary.dataset.action = diag.primary.fixAction;
  } else {
    dom.btnFixPrimary.hidden = true;
  }
  dom.cssCode.textContent = diag.cssLines;

  // 原海报 ① ② ③ 纵轴探针
  diag.pointsStatus.forEach((ps) => {
    const pill = document.getElementById(`probe-pill-${ps.no}`);
    if (!pill) return;
    pill.textContent = ps.badge;
    pill.classList.toggle("is-ok", ps.ok);
    pill.classList.toggle("is-err", !ps.ok);
  });

  // 四栏设计要点状态签
  const pairs = [
    [dom.kpsAlign, diag.pillars.align],
    [dom.kpsWidth, diag.pillars.width],
    [dom.kpsRhythm, diag.pillars.rhythm],
    [dom.kpsFlow, diag.pillars.flow],
  ];
  pairs.forEach(([el, st]) => {
    el.textContent = st.text;
    el.classList.toggle("is-ok", st.ok);
    el.classList.toggle("is-err", !st.ok);
  });

  // 控件激活态同步
  const pct = Math.round(layout.colRatio * 100);
  dom.ctlWidth.value = String(pct);
  dom.outWidth.textContent = `${pct}% (${layout.colW}px)`;

  document.querySelectorAll(".scene-btn").forEach((b) => {
    const active = b.dataset.scenario === state.scenario;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-align]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.align === state.align);
  });
  document.querySelectorAll("[data-vp]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.vp === state.viewport);
  });
  document.querySelectorAll("[data-rhythm]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.rhythm === state.rhythm);
  });
  document.querySelectorAll("[data-hier]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.hier === state.hierarchy);
  });

  const selBlock = layout.blocks.find((b) => b.id === state.selectedId) || layout.blocks[0];
  if (selBlock) {
    dom.selBlockLabel.textContent = `已选：${selBlock.tag}（第 ${selBlock.index + 1} 位）`;
    dom.btnMoveUp.disabled = selBlock.index === 0;
    dom.btnMoveDown.disabled = selBlock.index === layout.blocks.length - 1;
  }

  dom.btnDistract.setAttribute("aria-pressed", String(state.distraction));
  dom.btnDistract.textContent = state.distraction ? "双侧分心栏：开（干扰）" : "双侧分心栏：关";

  dom.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  dom.btnGuides.textContent = state.showGuides ? "标尺线：开" : "标尺线：关";

  dom.powerSub.textContent = diag.bannerNote;
  syncEmblem(layout);
}

// ==================== 2D Canvas 活体单列视口绘制 ====================
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(2);
  const w = Math.max(240, Math.round(rect.width * dpr));
  const h = Math.max(200, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    dirty = true;
  }
  return { w: rect.width, h: rect.height, dpr };
}

function drawStage(t, dt, { still }) {
  const { w, h, dpr } = resizeCanvas();
  if (!still && animSweep < 1) {
    animSweep = Math.min(1, animSweep + (dt || 0.016) / 0.65);
    dirty = true;
  }
  if (still) animSweep = 1;
  if (!dirty && !still) return;
  dirty = false;

  // 在真实测量上下文下计算单真源布局
  const layout = computeLayout(state, measureWithCtx);
  const diag = diagnoseLayout(state, layout);
  lastLayout = layout;
  lastDiag = diag;
  syncUI(layout, diag);

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. 书纸底面 + 细微点阵制图背景
  ctx.fillStyle = "#F5ECDE";
  ctx.fillRect(0, 0, w, h);

  // 计算模拟浏览器窗口在 Canvas 中的居中画框
  const padX = w < 440 ? 10 : 22;
  const padTop = w < 440 ? 12 : 18;
  const padBot = w < 440 ? 14 : 20;
  const availW = w - padX * 2;
  const availH = h - padTop - padBot;

  const chromeH = 28;
  const rulerH = 26;
  const vp = layout.vp;
  let frameW = availW;
  let frameH = availH;
  if (state.viewport === "mobile") {
    frameW = Math.min(availW, Math.round(availH * 0.56));
    frameW = Math.max(210, frameW);
  } else if (state.viewport === "tablet") {
    frameW = Math.min(availW, Math.round(availH * 0.96));
  }
  const frameX = Math.round((w - frameW) / 2);
  const frameY = padTop;
  const rulerTop = frameY + chromeH;
  const contentTop = rulerTop + rulerH;
  const contentH = frameH - chromeH - rulerH;
  const scale = frameW / vp.width;
  const compactMode = scale < 0.46;

  // 2. 模拟浏览器外框阴影与顶栏
  ctx.fillStyle = "rgba(25, 43, 66, 0.09)";
  ctx.fillRect(frameX + 4, frameY + 5, frameW, frameH);

  ctx.fillStyle = "#FDF9F2";
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // 浏览器顶部 chrome（书脊藏青风格）
  ctx.fillStyle = "#315178";
  ctx.fillRect(frameX, frameY, frameW, chromeH);

  // 三枚原海报暖米圆点
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(frameX + 14 + i * 12, frameY + chromeH / 2, 3.3, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? "#D3E07A" : "rgba(250, 242, 231, 0.65)";
    ctx.fill();
  }

  // 地址栏与视口尺标
  const urlX = frameX + 52;
  const urlW = Math.max(70, frameW - 132);
  ctx.fillStyle = "rgba(25, 43, 66, 0.42)";
  ctx.fillRect(urlX, frameY + 5, urlW, chromeH - 10);
  ctx.fillStyle = "#FAF2E7";
  ctx.font = `500 11px "JetBrains Mono", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(layout.sc.url, urlX + 8, frameY + chromeH / 2, urlW - 16);

  const vpLabel = `${vp.width}px`;
  ctx.fillStyle = "#D3E07A";
  ctx.font = `600 11px "JetBrains Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(vpLabel, frameX + frameW - 10, frameY + chromeH / 2);
  ctx.textAlign = "left";

  const colLeftPx = frameX + layout.colX * scale;
  const colWidthPx = layout.colW * scale;
  const colRightPx = colLeftPx + colWidthPx;
  const borderCol = diag.pillars.width.ok ? "#315178" : "#A8321A";

  // 2.5 独立标尺槽（绝不压盖任何文档文字）
  ctx.fillStyle = "#EFE5D4";
  ctx.fillRect(frameX, rulerTop, frameW, rulerH);
  ctx.fillStyle = "#FAF2E7";
  ctx.fillRect(colLeftPx, rulerTop, colWidthPx, rulerH);
  ctx.strokeStyle = "#D5C7AE";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frameX, contentTop);
  ctx.lineTo(frameX + frameW, contentTop);
  ctx.stroke();

  // 尺槽内左右留白百分比标注（足够宽时显示）
  const leftMarginW = colLeftPx - frameX;
  if (leftMarginW >= 42) {
    ctx.fillStyle = "#5A584F";
    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const sidePct = Math.round(layout.marginPct / 2);
    ctx.fillText(`${sidePct}%`, frameX + leftMarginW / 2, rulerTop + rulerH / 2);
    ctx.fillText(`${sidePct}%`, colRightPx + (frameX + frameW - colRightPx) / 2, rulerTop + rulerH / 2);
  }

  // 尺槽内单真源列宽实测胶囊
  const tagText = `${layout.colW}px · 约 ${Math.round(layout.avgCpl)} 字/行`;
  ctx.font = `700 11px "JetBrains Mono", "Noto Sans SC", sans-serif`;
  const tagW = Math.min(frameW - 12, ctx.measureText(tagText).width + 16);
  const tagX = Math.max(frameX + 6, Math.min(frameX + frameW - tagW - 6, colLeftPx + colWidthPx / 2 - tagW / 2));
  ctx.fillStyle = diag.pillars.width.ok ? "#225A38" : "#A8321A";
  ctx.fillRect(tagX, rulerTop + 3, tagW, rulerH - 6);
  ctx.fillStyle = "#FFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(tagText, tagX + tagW / 2, rulerTop + rulerH / 2 + 0.5, tagW - 6);
  ctx.textAlign = "left";

  // 3. 裁剪内容区并渲染单列文档与留白标尺
  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, contentTop, frameW, contentH);
  ctx.clip();

  const maxScrollPx = Math.max(0, layout.totalHeight - contentH / scale);
  const scrollPx = state.scrollY * maxScrollPx;

  // 左右留白区域（暖沙托底，突出单列有限宽度）
  ctx.fillStyle = "#F4EBDC";
  ctx.fillRect(frameX, contentTop, Math.max(0, colLeftPx - frameX), contentH);
  ctx.fillRect(colRightPx, contentTop, Math.max(0, frameX + frameW - colRightPx), contentH);

  // 单列正文纸面
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(colLeftPx, contentTop, colWidthPx, contentH);

  // 如果开启双侧分心干扰栏，在左右两翼绘出抢焦悬浮侧栏
  if (state.distraction) {
    const sw = Math.max(36, (layout.sideW || 130) * scale);
    const drawNoiseRail = (rx, label) => {
      ctx.fillStyle = "#FBEAE5";
      ctx.fillRect(rx + 4, contentTop + 12, sw - 8, contentH - 24);
      ctx.strokeStyle = "#A8321A";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rx + 4, contentTop + 12, sw - 8, contentH - 24);
      ctx.setLineDash([]);
      ctx.fillStyle = "#A8321A";
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(label, rx + 8, contentTop + 20, sw - 14);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = k === 0 ? "#E68A73" : "#E5C6BC";
        ctx.fillRect(rx + 8, contentTop + 38 + k * 48, sw - 16, 32);
      }
    };
    if (state.viewport !== "mobile") {
      drawNoiseRail(frameX, "热点弹窗");
      drawNoiseRail(frameX + frameW - sw, "猜你喜欢");
    } else {
      ctx.fillStyle = "#A8321A";
      ctx.fillRect(frameX + 8, contentTop + contentH - 38, frameW - 16, 30);
      ctx.fillStyle = "#FFF";
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("× 悬浮广告与推荐条抢占视线", frameX + 16, contentTop + contentH - 23);
    }
  }

  // 4. 逐块绘制真实折行排版内容（桌面绘真文字，手机极小比例绘不重叠的等比排印行条 + 模块标签）
  cachedHitBoxes = [];
  const baseLeftAxisX = frameX + (layout.colX + layout.innerPadX) * scale;

  layout.blocks.forEach((b, idx) => {
    const by = contentTop + (b.y - scrollPx) * scale;
    const bh = b.h * scale;
    const bx = colLeftPx;
    const bw = colWidthPx;

    cachedHitBoxes.push({ id: b.id, x: bx, y: by, w: bw, h: bh });

    const isSel = b.id === state.selectedId;
    const isHover = b.id === hoverBlockId;
    const isInverted = layout.inversions.some(([a]) => a.id === b.id);

    if (isSel || isHover) {
      ctx.fillStyle = isSel ? "rgba(83, 88, 43, 0.08)" : "rgba(49, 81, 120, 0.05)";
      ctx.fillRect(bx + 2, by - 3, bw - 4, bh + 6);
      ctx.strokeStyle = isInverted ? "#A8321A" : "#53582B";
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.strokeRect(bx + 2, by - 3, bw - 4, bh + 6);
    }

    const innerX = frameX + b.innerX * scale;
    const innerW = b.innerW * scale;

    const getLineMetrics = (line, fontPx) => {
      const logicalW = measureWithCtx(line, fontPx);
      const drawW = Math.min(innerW, logicalW * scale);
      let lx = innerX;
      if (b.align === "center") lx = innerX + Math.max(0, (innerW - drawW) / 2);
      else if (b.align === "right") lx = innerX + Math.max(0, innerW - drawW);
      return { lx, drawW };
    };

    // 真实绘制文字前调用（基于当前已设置的 ctx.font 精确计算左起坐标，绝不因粗体偏宽越界）
    const getDrawX = (line) => {
      if (b.align === "left") return innerX;
      const actualW = Math.min(innerW, ctx.measureText(line).width);
      if (b.align === "center") return innerX + Math.max(0, (innerW - actualW) / 2);
      return innerX + Math.max(0, innerW - actualW);
    };

    const drawSpecimenBar = (lx, ly, barW, barH, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly, Math.max(8, barW), Math.max(2.5, barH));
    };

    ctx.textBaseline = "top";

    b.parts.forEach((p) => {
      const py = contentTop + (p.y - scrollPx) * scale;
      const rawPx = p.fontPx * scale;
      const lhPx = (p.lh || p.fontPx * 1.35) * scale;
      const safeTextPx = Math.min(rawPx, lhPx * 0.84);
      const useBars = compactMode || safeTextPx < 8.5;

      if (p.type === "eyebrow") {
        if (useBars) {
          const { lx, drawW } = getLineMetrics(p.text, p.fontPx);
          drawSpecimenBar(lx, py + 1, Math.min(innerW * 0.45, drawW), Math.max(2.2, lhPx * 0.4), "#53582B");
        } else {
          ctx.fillStyle = "#53582B";
          ctx.font = `700 ${safeTextPx}px "Archivo", sans-serif`;
          ctx.fillText(p.text, getDrawX(p.text), py, innerW);
        }
      } else if (p.type === "title") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.14, drawW, lhPx * 0.64, "#0B0B0A");
          } else {
            ctx.fillStyle = "#0B0B0A";
            ctx.font = `${p.weight} ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      } else if (p.type === "rule") {
        ctx.fillStyle = "#585C29";
        const rw = Math.min(innerW, 64 * scale);
        const rx = b.align === "center" ? innerX + (innerW - rw) / 2 : b.align === "right" ? innerX + innerW - rw : innerX;
        ctx.fillRect(rx, py, rw, Math.max(2, 4 * scale));
      } else if (p.type === "meta") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.25, drawW, lhPx * 0.42, "#A09887");
          } else {
            ctx.fillStyle = "#5A584F";
            ctx.font = `500 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      } else if (p.type === "lead") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.18, drawW, lhPx * 0.56, "#3C3B36");
          } else {
            ctx.fillStyle = "#1F201D";
            ctx.font = `600 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      } else if (p.type === "h2") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.15, drawW, lhPx * 0.62, "#315178");
          } else {
            ctx.fillStyle = "#315178";
            ctx.font = `800 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      } else if (p.type === "body") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          let lx;
          let drawW;
          if (useBars) {
            const m = getLineMetrics(ln, p.fontPx);
            lx = m.lx;
            drawW = m.drawW;
            drawSpecimenBar(lx, ly + lhPx * 0.22, drawW, lhPx * 0.52, "#6E6A60");
          } else {
            ctx.fillStyle = "#2A2B27";
            ctx.font = `400 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            lx = getDrawX(ln);
            drawW = Math.min(innerW, ctx.measureText(ln).width);
            ctx.fillText(ln, lx, ly, innerW);
          }

          // 爆宽错态：在第 1→2 行间绘出超长回扫折返弧线
          if (state.showGuides && layout.avgCpl > 40 && li === 0 && p.lines.length > 1) {
            const endX = lx + drawW;
            const nextY = py + lhPx + lhPx * 0.48;
            ctx.save();
            ctx.strokeStyle = "rgba(168, 50, 26, 0.84)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(endX, ly + lhPx * 0.5);
            ctx.quadraticCurveTo((lx + endX) / 2, nextY + 10, lx + 4, nextY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "#A8321A";
            ctx.beginPath();
            ctx.arc(lx + 4, nextY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      } else if (p.type === "quote") {
        const qH = p.h * scale;
        ctx.fillStyle = "#F4EBDC";
        ctx.fillRect(innerX, py, innerW, qH);
        ctx.fillStyle = "#53582B";
        ctx.fillRect(innerX, py, 3.5, qH);
        p.lines.forEach((ln, li) => {
          const ly = py + 10 * scale + li * lhPx;
          if (useBars) {
            const { drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(innerX + 10, ly + lhPx * 0.2, Math.min(innerW - 18, drawW), lhPx * 0.52, "#434820");
          } else {
            ctx.fillStyle = "#1F201D";
            ctx.font = `600 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, innerX + 12, ly, innerW - 18);
          }
        });
        if (!useBars) {
          ctx.fillStyle = "#53582B";
          ctx.font = `700 ${Math.max(8, 10.5 * scale)}px "Archivo", sans-serif`;
          ctx.fillText(p.en, innerX + 12, py + qH - 16 * scale, innerW - 18);
        }
      } else if (p.type === "cta") {
        const cH = p.h * scale;
        ctx.fillStyle = "#315178";
        ctx.fillRect(innerX, py, innerW, cH);
        p.lines.forEach((ln, li) => {
          const ly = py + 11 * scale + li * lhPx;
          if (useBars) {
            const { drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(innerX + 10, ly + lhPx * 0.2, Math.min(innerW - 18, drawW), lhPx * 0.52, "#FAF2E7");
          } else {
            ctx.fillStyle = "#FFF";
            ctx.font = `700 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, innerX + 14, ly, innerW - 20);
          }
        });
        if (!useBars) {
          ctx.fillStyle = "#D3E07A";
          ctx.font = `700 ${Math.max(8, 10 * scale)}px "Archivo", sans-serif`;
          ctx.fillText(p.en, innerX + 14, py + cH - 16 * scale, innerW - 20);
        }
      } else if (p.type === "foothead") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.2, drawW, lhPx * 0.55, "#827C70");
          } else {
            ctx.fillStyle = "#4E4C44";
            ctx.font = `700 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      } else if (p.type === "footnote") {
        p.lines.forEach((ln, li) => {
          const ly = py + li * lhPx;
          if (useBars) {
            const { lx, drawW } = getLineMetrics(ln, p.fontPx);
            drawSpecimenBar(lx, ly + lhPx * 0.24, drawW, lhPx * 0.45, "#ACA392");
          } else {
            ctx.fillStyle = "#5E5B52";
            ctx.font = `400 ${safeTextPx}px "Noto Sans SC", sans-serif`;
            ctx.fillText(ln, getDrawX(ln), ly, innerW);
          }
        });
      }
    });

    // 模块角标（智能避让对齐侧：齐右模块标在左上角，其余标在右上角；仅高亮选中块或最先逆序块，杜绝文字压盖）
    if (state.showGuides && (isSel || (isInverted && layout.inversions[0]?.[0].id === b.id))) {
      const badgeTxt = isInverted ? `${b.tag}·逆序` : `第${idx + 1}位·${b.tag}`;
      ctx.font = `700 10px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(badgeTxt).width + 10;
      const badgeOnLeft = b.align === "right";
      const badgeX = badgeOnLeft ? bx + 6 : bx + bw - tw - 6;
      const badgeY = Math.max(contentTop + 3, by - 14);
      ctx.fillStyle = isInverted ? "#A8321A" : "#53582B";
      ctx.fillRect(badgeX, badgeY, tw, 15);
      ctx.fillStyle = "#FFF";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeTxt, badgeX + 5, badgeY + 7.5);
    }

    // 模块间呼吸细分隔线 / 假底线断层警示带
    if (idx < layout.blocks.length - 1) {
      const gapTop = by + bh;
      const gapH = layout.rSpec.blockGap * scale;
      if (state.rhythm === "chasm" && gapH > 32) {
        ctx.fillStyle = "rgba(168, 50, 26, 0.08)";
        ctx.fillRect(colLeftPx + 6, gapTop + 6, colWidthPx - 12, gapH - 12);
        ctx.strokeStyle = "#A8321A";
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(colLeftPx + 6, gapTop + 6, colWidthPx - 12, gapH - 12);
        ctx.setLineDash([]);
        ctx.fillStyle = "#A8321A";
        ctx.font = `700 11px "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("× 留白过宽引发「假底线」：读者以为页面已结束", colLeftPx + colWidthPx / 2, gapTop + gapH / 2, Math.max(120, colWidthPx - 24));
        ctx.textAlign = "left";
      } else if (layout.rSpec.divider) {
        ctx.strokeStyle = "#D5C7AE";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX, gapTop + gapH / 2);
        ctx.lineTo(innerX + innerW, gapTop + gapH / 2);
        ctx.stroke();
      }
    }
  });

  // 5. 标尺线层：左侧对齐基准轴 / 锯齿折线 / 视线垂直动线扫掠 / 左右推拉列宽界标手柄
  if (state.showGuides) {
    if (state.align === "left") {
      ctx.strokeStyle = "rgba(83, 88, 43, 0.65)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(baseLeftAxisX, contentTop + 8);
      ctx.lineTo(baseLeftAxisX, contentTop + contentH - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = "rgba(168, 50, 26, 0.82)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      layout.blocks.forEach((b, idx) => {
        const vx = frameX + b.visualLeft * scale;
        const vy = contentTop + (b.y + 12 - scrollPx) * scale;
        if (idx === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const flowX = Math.max(frameX + 10, colLeftPx - 12);
    const flowY0 = contentTop + 14;
    const flowY1 = flowY0 + (contentH - 28) * animSweep;
    ctx.strokeStyle = diag.passed ? "#225A38" : "#315178";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(flowX, flowY0);
    ctx.lineTo(flowX, flowY1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(flowX - 4, flowY1 - 6);
    ctx.lineTo(flowX, flowY1);
    ctx.lineTo(flowX + 4, flowY1 - 6);
    ctx.stroke();
  }

  // 列宽左右藏青拉手标尺
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(colLeftPx, contentTop);
  ctx.lineTo(colLeftPx, contentTop + contentH);
  ctx.moveTo(colRightPx, contentTop);
  ctx.lineTo(colRightPx, contentTop + contentH);
  ctx.stroke();

  const handleY = contentTop + contentH * 0.48;
  const drawHandle = (hx) => {
    ctx.fillStyle = borderCol;
    ctx.fillRect(hx - 6, handleY - 20, 12, 40);
    ctx.fillStyle = "#FAF2E7";
    ctx.fillRect(hx - 2, handleY - 8, 1.5, 16);
    ctx.fillRect(hx + 1, handleY - 8, 1.5, 16);
  };
  drawHandle(colLeftPx);
  drawHandle(colRightPx);

  // 模拟浏览器右侧精致滚动条
  if (maxScrollPx > 10) {
    const trackX = frameX + frameW - 7;
    const thumbH = Math.max(28, (contentH / (layout.totalHeight * scale)) * contentH);
    const thumbY = contentTop + state.scrollY * (contentH - thumbH);
    ctx.fillStyle = "rgba(49, 81, 120, 0.14)";
    ctx.fillRect(trackX, contentTop, 5, contentH);
    ctx.fillStyle = "#315178";
    ctx.fillRect(trackX, thumbY, 5, thumbH);
  }

  ctx.restore(); // 结束内容区裁剪

  // 浏览器外框细黑线收边
  ctx.strokeStyle = "#1F201D";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX + 0.5, frameY + 0.5, frameW - 1, frameH - 1);

  cachedHandles = {
    leftX: colLeftPx,
    rightX: colRightPx,
    topY: contentTop,
    bottomY: contentTop + contentH,
    scale,
    frameX,
    frameY,
    frameW,
    frameH,
  };

  ctx.restore();
}

const stageLoop = loop(canvas, drawStage);
const triggerRedraw = () => {
  dirty = true;
  stageLoop.draw();
};

// ==================== 画布鼠标 / 触摸 / 键盘交互 ====================
let dragMode = null; // null | "width" | "scroll"
let dragStartX = 0;
let dragStartY = 0;
let dragStartRatio = 0.5;
let dragStartScroll = 0;
let pointerMoved = false;

function setColRatio(next) {
  const minR = state.viewport === "mobile" ? 0.56 : 0.21;
  const maxR = state.viewport === "mobile" ? 0.94 : 0.95;
  state.colRatio = Math.max(minR, Math.min(maxR, next));
  triggerRedraw();
}

function moveSelectedBlock(delta) {
  const idx = state.order.indexOf(state.selectedId);
  if (idx < 0) return;
  const next = idx + delta;
  if (next < 0 || next >= state.order.length) return;
  const arr = [...state.order];
  [arr[idx], arr[next]] = [arr[next], arr[idx]];
  state.order = arr;
  triggerRedraw();
}

function getLocalPt(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("pointerdown", (e) => {
  const pt = getLocalPt(e);
  dragStartX = pt.x;
  dragStartY = pt.y;
  dragStartRatio = state.colRatio;
  dragStartScroll = state.scrollY;
  pointerMoved = false;

  // 点在右缘滚动条区域则滚动视口，否则横向拖拉列宽
  if (pt.x > cachedHandles.frameX + cachedHandles.frameW - 22) {
    dragMode = "scroll";
    canvas.setPointerCapture(e.pointerId);
  } else {
    dragMode = "pending";
  }
});

canvas.addEventListener("pointermove", (e) => {
  const pt = getLocalPt(e);
  if (!dragMode) {
    const hit = cachedHitBoxes.find((b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h);
    const nextHover = hit ? hit.id : null;
    if (nextHover !== hoverBlockId) {
      hoverBlockId = nextHover;
      triggerRedraw();
    }
    return;
  }

  const dx = pt.x - dragStartX;
  const dy = pt.y - dragStartY;

  if (dragMode === "pending") {
    if (Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
      dragMode = "width";
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      // 纵向滑动让位给页面滚动
      dragMode = null;
      return;
    } else {
      return;
    }
  }

  pointerMoved = true;
  if (dragMode === "width") {
    // 若拖在左半边，向左拉变宽；若拖在右半边或画布中心，向右拉变宽（同时兼容 perf.mjs 从中心左右拖！）
    const center = cachedHandles.frameX + cachedHandles.frameW / 2;
    const sign = dragStartX < center - 36 ? -1 : 1;
    const ratioDelta = (dx * sign * 1.8) / Math.max(220, cachedHandles.frameW);
    setColRatio(dragStartRatio + ratioDelta);
  } else if (dragMode === "scroll") {
    const scrollDelta = dy / Math.max(120, cachedHandles.bottomY - cachedHandles.topY);
    state.scrollY = Math.max(0, Math.min(1, dragStartScroll + scrollDelta));
    triggerRedraw();
  }
});

function endDrag(e) {
  if (!pointerMoved && dragMode) {
    const pt = getLocalPt(e);
    const hit = cachedHitBoxes.find((b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h);
    if (hit) {
      state.selectedId = hit.id;
      triggerRedraw();
    }
  }
  dragMode = null;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { dragMode = null; });

// 兼容纯 touch 事件（tools/perf.mjs 直接派发 Input.dispatchTouchEvent）
let touchStartX = 0;
let touchStartY = 0;
let touchStartRatio = 0.5;
let touchActive = false;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const r = canvas.getBoundingClientRect();
  touchStartX = e.touches[0].clientX - r.left;
  touchStartY = e.touches[0].clientY - r.top;
  touchStartRatio = state.colRatio;
  touchActive = true;
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (!touchActive || e.touches.length !== 1) return;
  const r = canvas.getBoundingClientRect();
  const dx = e.touches[0].clientX - r.left - touchStartX;
  const dy = e.touches[0].clientY - r.top - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    const ratioDelta = (dx * 1.65) / Math.max(200, cachedHandles.frameW || r.width);
    setColRatio(touchStartRatio + ratioDelta);
  }
}, { passive: true });

canvas.addEventListener("touchend", () => { touchActive = false; }, { passive: true });

// 鼠标滚轮：在画布内滚轮直接卷动模拟网页（滚到边界后再交还整页）
canvas.addEventListener("wheel", (e) => {
  const next = state.scrollY + e.deltaY * 0.0016;
  if ((e.deltaY > 0 && state.scrollY < 0.99) || (e.deltaY < 0 && state.scrollY > 0.01)) {
    e.preventDefault();
    state.scrollY = Math.max(0, Math.min(1, next));
    triggerRedraw();
  }
}, { passive: false });

// 键盘操控支持（← → 调列宽，↑ ↓ 换选中模块顺序）
canvas.tabIndex = 0;
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); setColRatio(state.colRatio - 0.03); }
  else if (e.key === "ArrowRight") { e.preventDefault(); setColRatio(state.colRatio + 0.03); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveSelectedBlock(-1); }
  else if (e.key === "ArrowDown") { e.preventDefault(); moveSelectedBlock(1); }
});

// ==================== 开场控件事件绑定 ====================
document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    state.scrollY = 0;
    triggerRedraw();
  });
});

document.querySelectorAll("[data-align]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.align = btn.dataset.align;
    triggerRedraw();
  });
});

document.querySelectorAll("[data-vp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.viewport = btn.dataset.vp;
    if (state.viewport === "mobile" && state.colRatio < 0.8) state.colRatio = 0.88;
    if (state.viewport === "desktop" && state.colRatio > 0.85 && lastDiag?.passed) state.colRatio = 0.50;
    state.scrollY = 0;
    triggerRedraw();
  });
});

document.querySelectorAll("[data-rhythm]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.rhythm = btn.dataset.rhythm;
    triggerRedraw();
  });
});

document.querySelectorAll("[data-hier]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.hierarchy = btn.dataset.hier;
    triggerRedraw();
  });
});

dom.ctlWidth.addEventListener("input", () => {
  setColRatio(Number(dom.ctlWidth.value) / 100);
});

dom.btnMoveUp.addEventListener("click", () => moveSelectedBlock(-1));
dom.btnMoveDown.addEventListener("click", () => moveSelectedBlock(1));

dom.btnDistract.addEventListener("click", () => {
  state.distraction = !state.distraction;
  triggerRedraw();
});

dom.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  triggerRedraw();
});

dom.btnScrollStep.addEventListener("click", () => {
  state.scrollY = state.scrollY >= 0.92 ? 0 : Math.min(1, state.scrollY + 0.48);
  dom.btnScrollStep.textContent = state.scrollY >= 0.92 ? "回到页顶" : "往下滚一屏";
  triggerRedraw();
});

dom.btnCssToggle.addEventListener("click", () => {
  const open = dom.cssDrawer.hidden;
  dom.cssDrawer.hidden = !open;
  dom.btnCssToggle.setAttribute("aria-expanded", String(open));
});

// 单项精准纠偏按钮（每次只修当前首要错态，让用户亲手一步步看到变化）
dom.btnFixPrimary.addEventListener("click", () => {
  const act = dom.btnFixPrimary.dataset.action;
  if (act === "fix_width") {
    state.colRatio = state.viewport === "mobile" ? 0.88 : state.viewport === "tablet" ? 0.72 : 0.50;
  } else if (act === "fix_align") {
    state.align = "left";
  } else if (act === "fix_rhythm") {
    state.rhythm = "balanced";
  } else if (act === "fix_hierarchy") {
    state.hierarchy = "clear";
  } else if (act === "fix_order") {
    state.order = ["hero", "lead", "body1", "quote", "footnote"];
  } else if (act === "fix_distraction") {
    state.distraction = false;
  }
  triggerRedraw();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch, { order: [...p.patch.order] });
    triggerRedraw();
  });
});

window.addEventListener("resize", triggerRedraw);

// ==================== 01 节：真实 DOM Range 行宽亲眼实测器 ====================
const MEASURE_TEXTS = {
  zh: "单列页面真正的克制，不在把页面做得光秃秃，而在于敢在宽阔的屏幕两侧留下空白。当你用眼睛一行一行读过这段文字时，请留意视线从右端跳回左端的距离：太窄时每读两三个词就要折返，思路不断被打断；太宽时眼睛回扫容易撞错行，需要停顿半拍重新找回开头。",
  en: "A disciplined single-column page is not merely empty space on both sides; it is an active frame that guides the reader down one clear axis. Watch how far your eyes jump from the end of one line back to the start of the next: too narrow breaks phrasing, while too wide makes it easy to lose your place.",
};
let mLang = "zh";
let mWidth = "580";

const measureCol = document.getElementById("measure-col");
const measureTextEl = document.getElementById("measure-text");
const mrWidth = document.getElementById("mr-width");
const mrCpl = document.getElementById("mr-cpl");
const mrLines = document.getElementById("mr-lines");
const mrVerdict = document.getElementById("mr-verdict");
const mrExplain = document.getElementById("mr-explain");

function measureRealDomLines() {
  const node = measureTextEl.firstChild;
  if (!node || node.nodeType !== 3) return;
  const text = node.textContent;
  const range = document.createRange();
  const lines = [];
  let lastTop = null;
  let lineCount = 0;

  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    const top = Math.round(rect.top);
    if (lastTop === null || Math.abs(top - lastTop) > 6) {
      if (lineCount > 0) lines.push(lineCount);
      lineCount = 1;
      lastTop = top;
    } else {
      lineCount++;
    }
  }
  if (lineCount > 0) lines.push(lineCount);

  const actualW = Math.round(measureCol.getBoundingClientRect().width);
  const sampleLines = lines.length > 1 ? lines.slice(0, -1) : lines;
  const avg = Math.round(sampleLines.reduce((a, b) => a + b, 0) / Math.max(1, sampleLines.length));

  mrWidth.textContent = `当前列宽 ${actualW}px`;
  mrCpl.textContent = mLang === "zh" ? `实测约 ${avg} 字/行` : `实测约 ${avg} 字符/行`;
  mrLines.textContent = `共折 ${lines.length} 行`;

  const stageW = Math.round(document.getElementById("measure-stage").getBoundingClientRect().width);
  const narrowScreen = stageW < 400;
  const limitHigh = mLang === "zh" ? 40 : 80;
  const limitLow = narrowScreen ? (mLang === "zh" ? 14 : 30) : mLang === "zh" ? 18 : 42;
  const ok = avg >= limitLow && avg <= limitHigh && !(mWidth === "220");
  mrVerdict.classList.toggle("is-ok", ok);
  mrVerdict.classList.toggle("is-err", !ok);

  if (avg > limitHigh) {
    mrVerdict.textContent = "超出舒适上限";
    mrExplain.textContent =
      mLang === "zh"
        ? `当前每行约 ${avg} 个汉字，超过了 W3C WCAG 1.4.8 给中日韩文设定的 40 字上限。行尾折回行首时跨度偏长，连读几段后更容易串行。`
        : `当前每行约 ${avg} 个西文字符，超过 WCAG 1.4.8 的 80 字符上限与 Bringhurst 建议的 45–75 字符区间，回扫负担明显加重。`;
  } else if (mWidth === "220" || avg < limitLow) {
    mrVerdict.textContent = "偏窄易碎行";
    mrExplain.textContent = `每行只装得下约 ${avg} ${mLang === "zh" ? "个汉字" : "个字符"}，共被剁成 ${lines.length} 行。眼球高频折返，句意被不断切碎（仅在极窄旁注里不得已使用）。`;
  } else if (narrowScreen) {
    mrVerdict.textContent = "窄屏天然单列";
    mrExplain.textContent = `当前屏幕较窄，容器顺势铺满为 ${actualW}px（约 ${avg} ${mLang === "zh" ? "字" : "字符"}/行），正是移动优先下天然流畅的单列阅读幅度；切到「220px 极窄条」仍可对比碎行感。`;
  } else {
    mrVerdict.textContent = "落在舒适区";
    mrExplain.textContent =
      mLang === "zh"
        ? `当前每行约 ${avg} 个汉字，稳稳落在中文单列 26–38 字舒适区且低于 WCAG 40 字上限，眼球回扫平缓顺手。`
        : `当前每行约 ${avg} 个字符，落在 Bringhurst（45–75 字符）与 Baymard（50–75 字符）推荐的阅读甜点区内。`;
  }
}

document.querySelectorAll("[data-mw]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mWidth = btn.dataset.mw;
    document.querySelectorAll("[data-mw]").forEach((b) => b.classList.toggle("is-active", b === btn));
    measureCol.style.maxWidth = mWidth === "full" ? "100%" : `${mWidth}px`;
    requestAnimationFrame(() => setTimeout(measureRealDomLines, 260));
  });
});

document.querySelectorAll("[data-mlang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mLang = btn.dataset.mlang;
    document.querySelectorAll("[data-mlang]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    measureTextEl.textContent = MEASURE_TEXTS[mLang];
    measureTextEl.lang = mLang === "zh" ? "zh-CN" : "en";
    requestAnimationFrame(measureRealDomLines);
  });
});

// ==================== 02 节：三开关纸样改造台 ====================
const swHier = document.getElementById("sw-hier");
const swSpace = document.getElementById("sw-space");
const swAnchor = document.getElementById("sw-anchor");
const swChasm = document.getElementById("sw-chasm");
const specimenSheet = document.getElementById("specimen-sheet");
const pvBadge = document.getElementById("pv-badge");
const pvText = document.getElementById("pv-text");
const smRatio = document.getElementById("sm-ratio");
const smLh = document.getElementById("sm-lh");
const smEdge = document.getElementById("sm-edge");

function updateSpecimen() {
  const h = swHier.checked;
  const s = swSpace.checked;
  const a = swAnchor.checked;
  const c = swChasm.checked;
  specimenSheet.classList.toggle("has-hier", h);
  specimenSheet.classList.toggle("has-space", s);
  specimenSheet.classList.toggle("has-anchor", a);
  specimenSheet.classList.toggle("has-chasm", c);

  if (smRatio) smRatio.textContent = h ? "1.74×" : "1.00×";
  if (smLh) smLh.textContent = c ? "断层 180px" : s ? "1.72×" : "1.30×";
  if (smEdge) smEdge.textContent = a ? "齐左单轴" : "居中摇摆";

  const count = [h, s, a].filter(Boolean).length;
  pvBadge.classList.remove("is-err", "is-ok");

  if (c) {
    pvBadge.classList.add("is-err");
    pvBadge.textContent = "反面警示 · 假底线断层";
    pvText.textContent = "导语和正文之间被撑出 180px 的巨大空白。留白超过节奏阈值就不再是停顿，反而像「已经到页底」的断崖。";
  } else if (count === 0) {
    pvBadge.textContent = "0/3 原始字墙";
    pvText.textContent = "三枚开关都关着：标题和正文同号同重、段落黏成一团、整段居中摇摆，完全看不出单列的层次和节奏。";
  } else if (count === 3) {
    pvBadge.classList.add("is-ok");
    pvBadge.textContent = "3/3 完整单列秩序";
    pvText.textContent = "同一段文字一字未改，只靠层级梯级、节奏留白与齐左基线，信息立刻有了轻重先后与顺畅的垂直呼吸感。";
  } else {
    pvBadge.textContent = `${count}/3 改造进行中`;
    const missing = [!h && "层级梯级", !s && "节奏留白", !a && "齐左锚点"].filter(Boolean).join("、");
    pvText.textContent = `已经明显好读了不少，再打开「${missing}」，对比一下单列三大支柱凑齐后的完整秩序。`;
  }
}

[swHier, swSpace, swAnchor, swChasm].forEach((el) => el.addEventListener("change", updateSpecimen));

// ==================== 03 节：单列从哪来（四节点历史演进图） ====================
const HISTORY_DATA = {
  "1501": {
    kicker: "VENICE · APRIL 1501",
    title: "阿尔杜斯八开本：把阅读从双栏讲台搬进掌心",
    body: "1501 年 4 月，威尼斯出版商阿尔杜斯·马努提乌斯印制了八开本袖珍维吉尔诗集，搭配弗朗切斯科·格里福（Francesco Griffo）刻制的首套斜体活字。相比当时沉重、常排成双栏供讲台翻阅的对开大书，八开本收束为轻巧的单栏长条，读者走到哪都能单手捧读。",
    fact: "可核史实：威尼斯 Aldine Press 于 1501 年首印八开本（octavo）便携诗集，让单栏连续阅读走进日常随身阅读。",
    svg: `
      <rect x="24" y="20" width="116" height="176" fill="#223856" stroke="#405F87" stroke-width="1.5"/>
      <text x="82" y="42" fill="#A7CEFA" font-size="11" text-anchor="middle" font-family="JetBrains Mono">旧式讲台对开双栏</text>
      <rect x="36" y="54" width="40" height="122" fill="#315178"/>
      <rect x="86" y="54" width="40" height="122" fill="#315178"/>
      <path d="M150 108 H186 M178 100 L186 108 L178 116" stroke="#D3E07A" stroke-width="2.2" fill="none"/>
      <rect x="200" y="42" width="90" height="136" fill="#FAF2E7" stroke="#D3E07A" stroke-width="2"/>
      <text x="245" y="34" fill="#D3E07A" font-size="11" text-anchor="middle" font-family="JetBrains Mono">1501 袖珍单栏</text>
      <rect x="216" y="60" width="58" height="7" fill="#53582B"/>
      <rect x="216" y="76" width="58" height="5" fill="#B6A58A"/>
      <rect x="216" y="88" width="58" height="5" fill="#B6A58A"/>
      <rect x="216" y="100" width="58" height="5" fill="#B6A58A"/>
      <rect x="216" y="112" width="58" height="5" fill="#B6A58A"/>
      <rect x="216" y="124" width="58" height="5" fill="#B6A58A"/>
      <rect x="216" y="136" width="44" height="5" fill="#B6A58A"/>
      <text x="160" y="216" fill="#DCE4EE" font-size="11" text-anchor="middle" font-family="Noto Sans SC">开本变窄变轻 → 版面自然收束为单一纵轴</text>
    `,
  },
  "1991": {
    kicker: "CERN · AUGUST 6, 1991",
    title: "万维网第一张网页：天生的纯单列文档流",
    body: "1991 年 8 月，蒂姆·伯纳斯-李在欧洲核子研究中心（CERN）上线了世界第一张网页（info.cern.ch）。早期 HTML 没有多栏网格和侧边栏，标题、段落、定义列表和超链接全凭块级文档流自上而下排成一列——单列本来就是万维网的默认母语。",
    fact: "可核史实：CERN 至今仍保留 1992 年归档的原始页面 info.cern.ch/hypertext/WWW/TheProject.html，可直接访问查看其纯单列结构。",
    svg: `
      <rect x="34" y="20" width="252" height="170" fill="#FAF2E7" stroke="#D3E07A" stroke-width="2"/>
      <rect x="34" y="20" width="252" height="22" fill="#315178"/>
      <text x="44" y="34" fill="#FAF2E7" font-size="10.5" font-family="JetBrains Mono">info.cern.ch/hypertext/WWW</text>
      <text x="50" y="64" fill="#0B0B0A" font-size="14" font-weight="700" font-family="Archivo">World Wide Web</text>
      <rect x="50" y="76" width="212" height="6" fill="#4E4C44"/>
      <rect x="50" y="88" width="190" height="6" fill="#4E4C44"/>
      <rect x="50" y="106" width="96" height="6" fill="#315178"/>
      <rect x="64" y="118" width="186" height="5" fill="#8C8373"/>
      <rect x="50" y="134" width="112" height="6" fill="#315178"/>
      <rect x="64" y="146" width="174" height="5" fill="#8C8373"/>
      <path d="M42 54 V174 M38 168 L42 174 L46 168" stroke="#53582B" stroke-width="1.8" fill="none"/>
      <text x="160" y="214" fill="#DCE4EE" font-size="11" text-anchor="middle" font-family="Noto Sans SC">HTML 块级文档流：未经装饰即自上而下排成单列</text>
    `,
  },
  "1992": {
    kicker: "BRINGHURST 1992 · W3C WCAG 2.1",
    title: "给单列画上行宽边界：不是越宽越好",
    body: "随着桌面显示器越来越宽，不加约束的纯单列反而变成了阅读灾难。1992 年罗伯特·布林赫斯特在《字体排印风格要素》中定下 45–75 字符（66 字符理想）的经典单栏测度；W3C WCAG 2.1 的 1.4.8 视觉呈现准则（AAA）则明确建议正文行宽不超过 80 字符、中日韩文不超过 40 字。",
    fact: "可核史实：WCAG 2.1 SC 1.4.8 同时提出行距至少 1.5 倍、段距至少为行距的 1.5 倍，且放大到 200% 不产生横向滚动。",
    svg: `
      <rect x="24" y="24" width="272" height="162" fill="#223856" stroke="#405F87" stroke-width="1.5"/>
      <rect x="82" y="34" width="156" height="142" fill="#FAF2E7"/>
      <line x1="82" y1="24" x2="82" y2="186" stroke="#D3E07A" stroke-width="1.8" stroke-dasharray="4 3"/>
      <line x1="238" y1="24" x2="238" y2="186" stroke="#D3E07A" stroke-width="1.8" stroke-dasharray="4 3"/>
      <text x="160" y="56" fill="#434820" font-size="11" font-weight="700" text-anchor="middle" font-family="JetBrains Mono">CJK ≤ 40 字 / EN 45–75</text>
      <rect x="96" y="68" width="128" height="6" fill="#1F201D"/>
      <rect x="96" y="82" width="122" height="5" fill="#5A584F"/>
      <rect x="96" y="94" width="128" height="5" fill="#5A584F"/>
      <rect x="96" y="114" width="110" height="5" fill="#5A584F"/>
      <rect x="96" y="126" width="128" height="5" fill="#5A584F"/>
      <rect x="96" y="138" width="96" height="5" fill="#5A584F"/>
      <text x="53" y="106" fill="#A7CEFA" font-size="10.5" text-anchor="middle" font-family="Noto Sans SC">留白</text>
      <text x="267" y="106" fill="#A7CEFA" font-size="10.5" text-anchor="middle" font-family="Noto Sans SC">留白</text>
      <text x="160" y="214" fill="#DCE4EE" font-size="11" text-anchor="middle" font-family="Noto Sans SC">大屏时代用 max-width 给单列重新套上舒适行宽</text>
    `,
  },
  "2010": {
    kicker: "MOBILE FIRST 2009–2011 · RWD 2010",
    title: "移动优先：窄屏单列成为信息排序的起点",
    body: "2009 年卢克·弗罗布莱夫斯基（Luke Wroblewski）提出「Mobile First」（2011 年由 A Book Apart 成书），2010 年 5 月伊桑·马科特（Ethan Marcotte）在 A List Apart 发表《Responsive Web Design》。智能手机狭长的竖屏逼迫团队先把页面梳理成一条先后分明的单列主干，大屏再视需要向外扩展。",
    fact: "可核史实：今天大多数多栏网站在 768px 以下都会自动回流成单列——单列既是起点，也是所有响应式布局的保底形态。",
    svg: `
      <rect x="34" y="28" width="76" height="148" rx="8" fill="#FAF2E7" stroke="#D3E07A" stroke-width="2.2"/>
      <rect x="44" y="46" width="56" height="14" fill="#53582B"/>
      <rect x="44" y="68" width="56" height="24" fill="#D1BFA1"/>
      <rect x="44" y="100" width="56" height="24" fill="#D1BFA1"/>
      <rect x="44" y="132" width="56" height="18" fill="#315178"/>
      <text x="72" y="192" fill="#D3E07A" font-size="11" text-anchor="middle" font-family="JetBrains Mono">390px 先定序</text>
      <path d="M122 102 H152 M144 94 L152 102 L144 110" stroke="#A7CEFA" stroke-width="2" fill="none"/>
      <rect x="164" y="38" width="128" height="128" fill="#223856" stroke="#A7CEFA" stroke-width="1.6"/>
      <rect x="194" y="48" width="68" height="108" fill="#FAF2E7"/>
      <rect x="202" y="58" width="52" height="12" fill="#53582B"/>
      <rect x="202" y="76" width="52" height="20" fill="#D1BFA1"/>
      <rect x="202" y="102" width="52" height="20" fill="#D1BFA1"/>
      <rect x="202" y="128" width="52" height="16" fill="#315178"/>
      <text x="228" y="192" fill="#A7CEFA" font-size="11" text-anchor="middle" font-family="JetBrains Mono">1280px 留白居中</text>
      <text x="160" y="216" fill="#DCE4EE" font-size="11" text-anchor="middle" font-family="Noto Sans SC">先在窄屏逼出唯一优先级，大屏沿同一主干舒展</text>
    `,
  },
};

const histSvg = document.getElementById("hist-svg");
const histKicker = document.getElementById("hist-kicker");
const histTitle = document.getElementById("hist-title");
const histBody = document.getElementById("hist-body");
const histFact = document.getElementById("hist-fact");

function renderHistory(key) {
  const d = HISTORY_DATA[key];
  if (!d) return;
  histSvg.innerHTML = d.svg;
  histKicker.textContent = d.kicker;
  histTitle.textContent = d.title;
  histBody.textContent = d.body;
  histFact.textContent = d.fact;
  document.querySelectorAll(".hist-card").forEach((b) => {
    const act = b.dataset.hist === key;
    b.classList.toggle("is-active", act);
    b.setAttribute("aria-selected", String(act));
  });
}

document.querySelectorAll(".hist-card").forEach((b) => {
  b.addEventListener("click", () => renderHistory(b.dataset.hist));
});
renderHistory("1501");

// ==================== 04 节：单列 vs 双列表单实时 SVG 视线路径 ====================
const mockFormWrap = document.getElementById("mock-form-wrap");
const mockForm = document.getElementById("mock-form");
const formSvg = document.getElementById("form-svg");
const fsTurns = document.getElementById("fs-turns");
const fsProg = document.getElementById("fs-prog");
const fsRisk = document.getElementById("fs-risk");
const fsExplain = document.getElementById("fs-explain");
const btnTraceForm = document.getElementById("btn-trace-form");

let formMode = "single";
let formStep = 1;
let traceTimer = null;

function drawFormEyePath() {
  const fields = [...mockForm.querySelectorAll(".mf-field")];
  const wrapRect = mockFormWrap.getBoundingClientRect();
  formSvg.setAttribute("viewBox", `0 0 ${Math.max(1, wrapRect.width)} ${Math.max(1, wrapRect.height)}`);

  const pts = fields.slice(0, formStep).map((f) => {
    const r = f.getBoundingClientRect();
    return {
      x: r.left - wrapRect.left + 24,
      y: r.top - wrapRect.top + r.height / 2,
    };
  });

  fields.forEach((f, idx) => {
    f.classList.toggle("is-done", idx < formStep);
    f.classList.toggle("is-current", idx === formStep - 1);
  });

  let turns = 0;
  let pathD = "";
  pts.forEach((p, idx) => {
    pathD += idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    if (idx > 0 && Math.abs(p.x - pts[idx - 1].x) > 20) turns++;
  });

  const strokeCol = formMode === "single" ? "#225A38" : "#A8321A";
  const dots = pts
    .map((p, idx) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${idx === pts.length - 1 ? 5.5 : 3.5}" fill="${strokeCol}" stroke="#FDF9F2" stroke-width="1.5"/>`)
    .join("");

  formSvg.innerHTML =
    pts.length > 1
      ? `<path d="${pathD}" fill="none" stroke="${strokeCol}" stroke-width="2.6" stroke-dasharray="${formMode === "single" ? "none" : "6 4"}" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
      : dots;

  fsTurns.textContent = `${turns} 次`;
  fsProg.textContent = `${formStep} / 6 项`;
  if (formMode === "single") {
    fsRisk.textContent = "低（笔直向下）";
    fsExplain.textContent = "单列下，每填完一格只需把视线直降一行，不必判断「下一格在右边还是在正下方」，与键盘 Tab 和手机软键盘下一项预期完全一致。";
  } else {
    fsRisk.textContent = "较高（Z 字折返）";
    fsExplain.textContent = "双列并排时，眼睛必须先横向扫到右栏、再斜跨回下一行左栏（Z 字折返）。填到选填项或不等高输入框时，极易误判顺序或直接漏看右栏字段。";
  }
}

document.querySelectorAll("[data-fmode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    formMode = btn.dataset.fmode;
    mockForm.classList.toggle("is-single", formMode === "single");
    mockForm.classList.toggle("is-double", formMode === "double");
    document.querySelectorAll("[data-fmode]").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    if (formStep < 2) formStep = 6;
    requestAnimationFrame(drawFormEyePath);
  });
});

mockForm.querySelectorAll(".mf-field").forEach((field) => {
  field.addEventListener("click", () => {
    if (traceTimer) { clearInterval(traceTimer); traceTimer = null; }
    formStep = Number(field.dataset.step);
    drawFormEyePath();
  });
});

btnTraceForm.addEventListener("click", () => {
  if (traceTimer) clearInterval(traceTimer);
  formStep = 1;
  drawFormEyePath();
  traceTimer = setInterval(() => {
    formStep++;
    drawFormEyePath();
    if (formStep >= 6) {
      clearInterval(traceTimer);
      traceTimer = null;
    }
  }, 260);
});

// ==================== 05 节：什么时候别用单列（4 场景决策分流） ====================
const TRIAGE_DATA = {
  compare: {
    yes: false,
    badge: "别硬用单列",
    title: "需要并排比对时，单列会逼人来回翻页",
    body: "把两款产品的二十项参数上下叠成一长列，读者看到 B 方案时早就忘了 A 方案的数值，只能疯狂上下滚动。此时应该把对照区并置在同一视口里。",
    altHtml: `更合适去用：<a href="https://layout.xiaoxiaodong.ai/256/play/" target="_blank" rel="noopener">256 双列页面</a> 或 <a href="https://layout.xiaoxiaodong.ai/259/play/" target="_blank" rel="noopener">259 分屏布局</a>。`,
  },
  docs: {
    yes: false,
    badge: "别只用纯单列",
    title: "百页文档需要常驻目录，单列缺全局坐标",
    body: "长文档正文区本身很适合保持单列舒适行宽，但如果在桌面端完全撤掉常驻目录，读者想从第 2 章跳到第 9 章就得拖很久的滚动条，也看不清自己身处整套文档的哪一层。",
    altHtml: `更合适去用：<a href="https://layout.xiaoxiaodong.ai/258/play/" target="_blank" rel="noopener">258 侧边栏页面</a>（窄屏再用 <a href="https://layout.xiaoxiaodong.ai/263/play/" target="_blank" rel="noopener">263 导航抽屉布局</a> 收起目录）。`,
  },
  inbox: {
    yes: false,
    badge: "别硬用单列",
    title: "高频切条查看任务，单列往返成本太高",
    body: "处理几十封邮件或客服工单时，用户需要一边盯住列表顺序、一边快速预览正文。纯单列意味着每看一封都要「点进去 → 退回列表 → 再找下一条」，效率骤降。",
    altHtml: `更合适去用：<a href="https://layout.xiaoxiaodong.ai/267/play/" target="_blank" rel="noopener">267 列表—详情布局</a> 或 <a href="https://layout.xiaoxiaodong.ai/268/play/" target="_blank" rel="noopener">268 辅助窗格布局</a>。`,
  },
  essay: {
    yes: true,
    badge: "非常适合单列",
    title: "线性深度叙事，正是单列的主场",
    body: "人物专访、深度评论或长篇产品故事需要读者按作者预设的起承转合一路读下去。把行宽收在 26–38 汉字，用留白和小标题标出转折，再配上克制的页眉与页脚，就是体验最沉静的阅读容器。",
    altHtml: `可搭配骨架：<a href="https://layout.xiaoxiaodong.ai/261/play/" target="_blank" rel="noopener">261 页眉—主体—页脚</a>，把主体设为有界单列。`,
  },
};

const trBadge = document.getElementById("tr-badge");
const trTitle = document.getElementById("tr-title");
const trBody = document.getElementById("tr-body");
const trAlt = document.getElementById("tr-alt");

document.querySelectorAll(".triage-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = TRIAGE_DATA[btn.dataset.triage];
    if (!d) return;
    document.querySelectorAll(".triage-btn").forEach((b) => {
      const act = b === btn;
      b.classList.toggle("is-active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    trBadge.textContent = d.badge;
    trBadge.classList.toggle("is-yes", d.yes);
    trBadge.classList.toggle("is-no", !d.yes);
    trTitle.textContent = d.title;
    trBody.textContent = d.body;
    trAlt.innerHTML = d.altHtml;
  });
});

// ==================== 06 节：双题严格单变量小练习 ====================
const QUIZ_DATA = [
  {
    prompt:
      "在 1280px 宽的桌面屏幕上排一篇 2000 字中文深度长文。以下四张方案字号（17px）、齐左、层级与段距完全一致，唯一不同的变量是正文容器宽度（max-width）。哪一张最贴合单列长文的舒适可读区间？",
    correct: 2,
    options: [
      {
        label: "方案 A",
        meta: "1180px",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="7" y="10" width="166" height="100" fill="#FFFDF8" stroke="#C9B99C"/><rect x="13" y="20" width="76" height="7" fill="#0B0B0A"/><rect x="13" y="34" width="154" height="4" fill="#5A584F"/><rect x="13" y="42" width="154" height="4" fill="#5A584F"/><rect x="13" y="50" width="142" height="4" fill="#5A584F"/><rect x="13" y="64" width="154" height="4" fill="#5A584F"/><rect x="13" y="72" width="154" height="4" fill="#5A584F"/><rect x="13" y="80" width="128" height="4" fill="#5A584F"/></svg>`,
        explain: "1180px 几乎铺满 1280px 桌面（一行约 66 个汉字），远超 WCAG 1.4.8 给中日韩文设定的 40 字上限，眼球从最右端扫回左侧极易串行。",
      },
      {
        label: "方案 B",
        meta: "260px",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="71" y="10" width="38" height="100" fill="#FFFDF8" stroke="#C9B99C"/><rect x="75" y="18" width="30" height="6" fill="#0B0B0A"/><rect x="75" y="28" width="28" height="4" fill="#5A584F"/><rect x="75" y="35" width="30" height="4" fill="#5A584F"/><rect x="75" y="42" width="24" height="4" fill="#5A584F"/><rect x="75" y="49" width="30" height="4" fill="#5A584F"/><rect x="75" y="56" width="26" height="4" fill="#5A584F"/><rect x="75" y="63" width="30" height="4" fill="#5A584F"/><rect x="75" y="70" width="22" height="4" fill="#5A584F"/><rect x="75" y="77" width="30" height="4" fill="#5A584F"/><rect x="75" y="84" width="28" height="4" fill="#5A584F"/><rect x="75" y="91" width="20" height="4" fill="#5A584F"/></svg>`,
        explain: "260px 窄到每行只剩约 13 个汉字，每读两三个词就得折行，句意不断被剁碎，页面还会被拉得过长。",
      },
      {
        label: "方案 C",
        meta: "560px",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="50" y="10" width="80" height="100" fill="#FFFDF8" stroke="#C9B99C"/><rect x="57" y="19" width="52" height="7" fill="#0B0B0A"/><rect x="57" y="32" width="66" height="4" fill="#5A584F"/><rect x="57" y="40" width="64" height="4" fill="#5A584F"/><rect x="57" y="48" width="58" height="4" fill="#5A584F"/><rect x="57" y="62" width="66" height="4" fill="#5A584F"/><rect x="57" y="70" width="66" height="4" fill="#5A584F"/><rect x="57" y="78" width="50" height="4" fill="#5A584F"/><rect x="57" y="92" width="60" height="4" fill="#5A584F"/></svg>`,
        explain: "答对了！560px 在 17px 正文下约 30–32 汉字/行，正好落在中文单列 26–38 字舒适区且低于 WCAG 40 字上限，左右留白自然托住垂直视觉轴。",
      },
      {
        label: "方案 D",
        meta: "940px",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="24" y="10" width="132" height="100" fill="#FFFDF8" stroke="#C9B99C"/><rect x="31" y="20" width="68" height="7" fill="#0B0B0A"/><rect x="31" y="34" width="118" height="4" fill="#5A584F"/><rect x="31" y="42" width="118" height="4" fill="#5A584F"/><rect x="31" y="50" width="104" height="4" fill="#5A584F"/><rect x="31" y="64" width="118" height="4" fill="#5A584F"/><rect x="31" y="72" width="114" height="4" fill="#5A584F"/><rect x="31" y="80" width="90" height="4" fill="#5A584F"/></svg>`,
        explain: "940px 虽然比满屏略收了一点，但一行仍塞进约 52 个汉字，依然明显超过 40 字上限，读长文时后半段眼睛还是容易疲惫跳行。",
      },
    ],
  },
  {
    prompt:
      "同一张单列产品发布页，列宽、字号与留白完全相同，唯一不同的变量是四个模块（主标题定位、核心证据、行动按钮、条款细则）的垂直先后顺序。哪一张符合单列「先重要，后细节」的顺流逻辑？",
    correct: 1,
    options: [
      {
        label: "方案 A",
        meta: "顺序一",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="40" y="8" width="100" height="104" fill="#FFFDF8" stroke="#C9B99C"/><rect x="48" y="15" width="84" height="16" fill="#E8DFCE"/><text x="90" y="26" font-size="7.5" text-anchor="middle" fill="#4E4C44" font-family="Noto Sans SC">条款与隐私细则</text><rect x="48" y="36" width="84" height="18" fill="#D1BFA1"/><text x="90" y="48" font-size="7.5" text-anchor="middle" fill="#1F201D" font-family="Noto Sans SC">核心证据与演示</text><rect x="48" y="59" width="84" height="22" fill="#53582B"/><text x="90" y="73" font-size="8" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">主标题与核心定位</text><rect x="48" y="86" width="84" height="18" fill="#315178"/><text x="90" y="98" font-size="7.5" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">立即下载体验</text></svg>`,
        explain: "把「条款与隐私细则」挡在页面最开头，访客连产品是干什么的都还没看到就被一串补充小字劝退了。",
      },
      {
        label: "方案 B",
        meta: "顺序二",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="40" y="8" width="100" height="104" fill="#FFFDF8" stroke="#C9B99C"/><rect x="48" y="15" width="84" height="22" fill="#53582B"/><text x="90" y="29" font-size="8" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">主标题与核心定位</text><rect x="48" y="42" width="84" height="20" fill="#D1BFA1"/><text x="90" y="55" font-size="7.5" text-anchor="middle" fill="#1F201D" font-family="Noto Sans SC">核心证据与演示</text><rect x="48" y="67" width="84" height="18" fill="#315178"/><text x="90" y="79" font-size="7.5" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">立即下载体验</text><rect x="48" y="90" width="84" height="15" fill="#E8DFCE"/><text x="90" y="100" font-size="7.2" text-anchor="middle" fill="#4E4C44" font-family="Noto Sans SC">条款与隐私细则</text></svg>`,
        explain: "答对了！先亮主标题与核心定位，再给出证据建立信任，水到渠成承接行动按钮，最后把条款细则安放文末——完美兑现原海报「先重要，后细节，层次递进」。",
      },
      {
        label: "方案 C",
        meta: "顺序三",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="40" y="8" width="100" height="104" fill="#FFFDF8" stroke="#C9B99C"/><rect x="48" y="15" width="84" height="18" fill="#315178"/><text x="90" y="27" font-size="7.5" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">立即下载体验</text><rect x="48" y="38" width="84" height="16" fill="#E8DFCE"/><text x="90" y="49" font-size="7.2" text-anchor="middle" fill="#4E4C44" font-family="Noto Sans SC">条款与隐私细则</text><rect x="48" y="59" width="84" height="22" fill="#53582B"/><text x="90" y="73" font-size="8" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">主标题与核心定位</text><rect x="48" y="86" width="84" height="18" fill="#D1BFA1"/><text x="90" y="98" font-size="7.5" text-anchor="middle" fill="#1F201D" font-family="Noto Sans SC">核心证据与演示</text></svg>`,
        explain: "访客刚进页面还没搞清是什么产品，迎面就撞上下载按钮和条款细则，缺少铺垫反而显得唐突。",
      },
      {
        label: "方案 D",
        meta: "顺序四",
        svg: `<svg viewBox="0 0 180 120"><rect width="180" height="120" fill="#F4EBDC"/><rect x="40" y="8" width="100" height="104" fill="#FFFDF8" stroke="#C9B99C"/><rect x="48" y="15" width="84" height="20" fill="#D1BFA1"/><text x="90" y="28" font-size="7.5" text-anchor="middle" fill="#1F201D" font-family="Noto Sans SC">核心证据与演示</text><rect x="48" y="40" width="84" height="18" fill="#315178"/><text x="90" y="52" font-size="7.5" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">立即下载体验</text><rect x="48" y="63" width="84" height="16" fill="#E8DFCE"/><text x="90" y="74" font-size="7.2" text-anchor="middle" fill="#4E4C44" font-family="Noto Sans SC">条款与隐私细则</text><rect x="48" y="84" width="84" height="22" fill="#53582B"/><text x="90" y="98" font-size="8" text-anchor="middle" fill="#FFF" font-family="Noto Sans SC">主标题与核心定位</text></svg>`,
        explain: "把最关键的主标题和定位压到整页末尾，读者看前面证据时完全不知道在论证什么主张。",
      },
    ],
  },
];

let curQ = 0;
const quizAnswers = [null, null];
const quizPrompt = document.getElementById("quiz-prompt");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const qfHead = document.getElementById("qf-head");
const qfBody = document.getElementById("qf-body");
const quizStatus = document.getElementById("quiz-status");

function renderQuiz() {
  const q = QUIZ_DATA[curQ];
  const picked = quizAnswers[curQ];
  quizPrompt.textContent = q.prompt;
  quizOptions.innerHTML = q.options
    .map((opt, idx) => {
      let cls = "quiz-card";
      if (picked !== null) {
        if (idx === picked && idx === q.correct) cls += " is-picked-ok";
        else if (idx === picked) cls += " is-picked-err";
        else if (idx === q.correct) cls += " is-reveal-ok";
      }
      return `
        <button type="button" class="${cls}" role="radio" aria-checked="${picked === idx}" data-opt="${idx}">
          <div class="qc-head">
            <span class="qc-label">${opt.label}</span>
            <span class="qc-meta">${opt.meta}</span>
          </div>
          <div class="qc-svg-wrap" aria-hidden="true">${opt.svg}</div>
        </button>`;
    })
    .join("");

  quizOptions.querySelectorAll(".quiz-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizAnswers[curQ] = Number(btn.dataset.opt);
      renderQuiz();
    });
  });

  const doneCount = quizAnswers.filter((a) => a !== null).length;
  const okCount = quizAnswers.filter((a, i) => a === QUIZ_DATA[i].correct).length;
  quizStatus.textContent = doneCount === 0 ? "尚未作答" : `已答 ${doneCount}/2 · 答对 ${okCount} 题`;

  if (picked === null) {
    quizFeedback.hidden = true;
  } else {
    const isRight = picked === q.correct;
    quizFeedback.hidden = false;
    quizFeedback.classList.toggle("is-ok", isRight);
    quizFeedback.classList.toggle("is-err", !isRight);
    qfHead.textContent = isRight
      ? `✓ 选择了 ${q.options[picked].label}（${q.options[picked].meta}）—— 准确命中！`
      : `× 选择了 ${q.options[picked].label}（${q.options[picked].meta}），最佳应为 ${q.options[q.correct].label}`;
    qfBody.textContent = q.options[picked].explain;
  }

  document.querySelectorAll(".quiz-tab").forEach((t) => {
    const act = Number(t.dataset.q) === curQ;
    t.classList.toggle("is-active", act);
    t.setAttribute("aria-selected", String(act));
  });
}

document.querySelectorAll(".quiz-tab").forEach((t) => {
  t.addEventListener("click", () => {
    curQ = Number(t.dataset.q);
    renderQuiz();
  });
});
renderQuiz();

// ==================== 07 节：原海报灯箱（放大 / 拖拽 / 滚轮缩放 / Esc 关） ====================
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbIn = document.getElementById("lb-in");
const lbOut = document.getElementById("lb-out");
const lbReset = document.getElementById("lb-reset");
const lbClose = document.getElementById("lb-close");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbReset.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbIn.addEventListener("click", () => { lbScale = Math.min(3.2, +(lbScale + 0.35).toFixed(2)); applyLbTransform(); });
lbOut.addEventListener("click", () => { lbScale = Math.max(0.7, +(lbScale - 0.35).toFixed(2)); applyLbTransform(); });
lbReset.addEventListener("click", () => { lbScale = 1; lbTx = 0; lbTy = 0; applyLbTransform(); });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) { closeLightbox(); return; }
  lbDrag = { x: e.clientX - lbTx, y: e.clientY - lbTy };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = e.clientX - lbDrag.x;
  lbTy = e.clientY - lbDrag.y;
  applyLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; lbStage.classList.remove("is-dragging"); });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.18 : -0.18;
  lbScale = Math.max(0.7, Math.min(3.5, +(lbScale + delta).toFixed(2)));
  applyLbTransform();
}, { passive: false });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化首帧 ====================
document.fonts.ready.then(() => {
  triggerRedraw();
  measureRealDomLines();
  drawFormEyePath();
});
window.addEventListener("resize", () => {
  measureRealDomLines();
  drawFormEyePath();
});
