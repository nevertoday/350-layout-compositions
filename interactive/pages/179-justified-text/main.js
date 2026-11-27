import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PRESETS,
  SPECIMENS,
  clamp,
  createInitialState,
  layoutParagraph,
} from "./model.js";

// ============== 字体测量缓存（60 FPS 关键优化） ==============
const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d");
const widthCache = new Map();

function measureTextCached(text, fontFamily, fontSize) {
  const key = `${fontSize}|${fontFamily}|${text}`;
  let w = widthCache.get(key);
  if (w === undefined) {
    measureCtx.font = `400 ${fontSize}px ${fontFamily}`;
    w = measureCtx.measureText(text).width;
    widthCache.set(key, w);
  }
  return w;
}

// 字体真正就绪后清空一次测量缓存，保证实绘宽度和实际渲染字体严丝合缝
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    widthCache.clear();
    dirtyLayout = true;
    dirtyDraw = true;
    renderRiverLab();
    renderAllQuizzes();
  });
}

// ============== 开场活字排盘（Hero Galley） ==============
const state = createInitialState();
const canvas = document.getElementById("galley-canvas");
const ctx = canvas.getContext("2d");

let canvasCssW = 640;
let canvasCssH = 416;
let dirtyLayout = true;
let dirtyDraw = true;
let currentLayout = null;
let currentGeom = null;
let introProgress = reducedMotion.matches ? 1 : 0;
let pulseTime = 0;

// DOM 读数与控件引用
const dom = {
  titleDemo: document.getElementById("title-demo"),
  heroBadge: document.getElementById("hero-badge"),
  galleyModeName: document.getElementById("galley-mode-name"),
  galleyHud: document.getElementById("galley-hud"),
  spineEdge: document.getElementById("spine-edge"),
  spineTexture: document.getElementById("spine-texture"),
  spineMeasure: document.getElementById("spine-measure"),
  statEdge: document.getElementById("stat-edge"),
  statTexture: document.getElementById("stat-texture"),
  statMeasure: document.getElementById("stat-measure"),
  posterOrb: document.getElementById("poster-orb"),
  orbScore: document.getElementById("orb-score"),
  textureGrade: document.getElementById("texture-grade"),
  densitySvg: document.getElementById("density-svg"),
  ctrlWidth: document.getElementById("ctrl-width"),
  valWidth: document.getElementById("val-width"),
  ctrlSize: document.getElementById("ctrl-size"),
  valSize: document.getElementById("val-size"),
  ctrlHyphen: document.getElementById("ctrl-hyphen"),
  valHyphen: document.getElementById("val-hyphen"),
  ctrlComposer: document.getElementById("ctrl-composer"),
  valComposer: document.getElementById("val-composer"),
  ctrlLast: document.getElementById("ctrl-last"),
  valLast: document.getElementById("val-last"),
  ctrlAlign: document.getElementById("ctrl-align"),
  valAlign: document.getElementById("val-align"),
  btnXray: document.getElementById("btn-xray"),
  proofBand: document.getElementById("proof-band"),
  diagBadge: document.getElementById("diag-badge"),
  diagMetrics: document.getElementById("diag-metrics"),
  diagHeadline: document.getElementById("diag-headline"),
  diagWhy: document.getElementById("diag-why"),
  diagAction: document.getElementById("diag-action"),
  mobileDiagLine: document.getElementById("mobile-diag-line"),
  mobileWidthRange: document.getElementById("mobile-width-range"),
  mobileWidthVal: document.getElementById("mobile-width-val"),
  mobileBtnFix: document.getElementById("mobile-btn-fix"),
  mobileBtnXray: document.getElementById("mobile-btn-xray"),
};

function resizeHeroCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = pixelRatio(2);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w !== canvasCssW || h !== canvasCssH || canvas.width !== Math.round(w * dpr)) {
    canvasCssW = w;
    canvasCssH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dirtyLayout = true;
    dirtyDraw = true;
  }
}

// 计算物理画布排字几何（将栏宽与字号按同一基准尺等比缩放，确保 390/768/1024/1440/2560 全视口下「开场必错、正栏必稳」）
function computeHeroGeometry() {
  const padX = canvasCssW < 420 ? 14 : 26;
  const topY = canvasCssW < 420 ? 36 : 38;
  const bottomPad = 24;
  const maxColW = Math.max(200, canvasCssW - padX * 2);
  // 以 680px 为 1.0 基准排字台宽：窄屏适度缩放并保底 10.5px 可读，平板/超宽屏等比放大字号保持相同 CPL 纪律
  const scaleFactor = maxColW < 520
    ? clamp(maxColW / 470, 0.64, 0.86)
    : clamp(maxColW / 640, 0.92, 1.48);
  const effFontSize = Math.max(10.5, Math.round(state.fontSize * scaleFactor * 10) / 10);
  const colW = clamp(Math.round(maxColW * state.columnRatio), 116, maxColW);
  const lineH = Math.round(effFontSize * 1.52);
  return { padX, topY, bottomPad, maxColW, colW, effFontSize, lineH };
}

function recomputeHero() {
  currentGeom = computeHeroGeometry();
  const effectiveState = { ...state, fontSize: currentGeom.effFontSize };
  currentLayout = layoutParagraph(effectiveState, currentGeom.colW, measureTextCached);
  dirtyLayout = false;
  syncHeroUI();
}

function syncHeroUI() {
  if (!currentLayout) return;
  const { metrics: m, audit: a, lines } = currentLayout;
  const pct = Math.round(state.columnRatio * 100);
  const isEn = m.spec.lang === "en";

  // 自示范大标：关闭两端对齐时松成左对齐
  dom.titleDemo.dataset.justified = String(state.alignMode === "justify");

  // 顶栏状态徽章与排盘 HUD
  dom.heroBadge.textContent = a.shortBadge;
  dom.heroBadge.dataset.pass = String(a.pass);
  dom.galleyModeName.textContent = state.alignMode === "justify"
    ? (state.lastLineJustify ? "两端对齐·末行强撑" : "两端对齐")
    : "左对齐右参差（176）";
  dom.galleyHud.textContent = `CPL ${Math.round(m.avgCpl)} · GAP ${m.maxGapRatio.toFixed(1)}× · RIVERS ${m.riverCount}`;

  // 原海报三圆点脊柱实时联动
  const cEdge = a.checks[0];
  const cTex = a.checks[1];
  const cMea = a.checks[2];
  dom.spineEdge.dataset.ok = String(cEdge.ok);
  dom.statEdge.textContent = cEdge.badge;
  dom.spineTexture.dataset.ok = String(cTex.ok);
  dom.statTexture.textContent = cTex.badge;
  dom.spineMeasure.dataset.ok = String(cMea.ok);
  dom.statMeasure.textContent = cMea.badge;

  // 右侧暖麻密度圆徽与波谱 SVG（原海报右中虚线构成活体化）
  dom.posterOrb.dataset.pass = String(a.pass);
  dom.orbScore.textContent = `${a.score}/4`;
  dom.textureGrade.textContent = a.grayGrade;
  renderDensitySvg(lines, m);

  // 滑块与开关读数
  dom.ctrlWidth.value = String(pct);
  dom.valWidth.textContent = `${pct}% · 约 ${Math.round(m.avgCpl)} ${isEn ? "字符" : "字"}/行`;
  dom.ctrlSize.value = String(state.fontSize);
  dom.valSize.textContent = `${state.fontSize} px`;
  dom.mobileWidthRange.value = String(pct);
  dom.mobileWidthVal.textContent = `${pct}%`;

  dom.ctrlHyphen.setAttribute("aria-pressed", String(state.hyphenCompress));
  dom.ctrlHyphen.dataset.tone = state.hyphenCompress ? "good" : "warn";
  dom.valHyphen.textContent = state.hyphenCompress ? "开 · 挤压断词" : "关 · 易扯空洞";

  const isBal = state.composer === "balanced";
  dom.ctrlComposer.setAttribute("aria-pressed", String(isBal));
  dom.ctrlComposer.dataset.tone = isBal ? "good" : "";
  dom.valComposer.textContent = isBal ? "段落全局均衡" : "逐行贪心";

  dom.ctrlLast.setAttribute("aria-pressed", String(state.lastLineJustify));
  dom.ctrlLast.dataset.tone = state.lastLineJustify ? "warn" : "good";
  dom.valLast.textContent = state.lastLineJustify ? "开 · 误用 180" : "关 · 自然左收";

  const isJust = state.alignMode === "justify";
  dom.ctrlAlign.setAttribute("aria-pressed", String(isJust));
  dom.ctrlAlign.dataset.tone = isJust ? "good" : "warn";
  dom.valAlign.textContent = isJust ? "两端对齐" : "左对齐 176";

  dom.btnXray.setAttribute("aria-pressed", String(state.xray));
  dom.mobileBtnXray.setAttribute("aria-pressed", String(state.xray));

  // 语料切签状态
  document.querySelectorAll("#specimen-tabs .tab-btn").forEach((b) => {
    const active = b.dataset.specimen === state.specimen;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 底部暖麻单真源诊单 + 手机折线内首句
  dom.proofBand.dataset.pass = String(a.pass);
  dom.diagBadge.textContent = a.shortBadge;
  dom.diagMetrics.textContent = `每行 ${m.avgCpl.toFixed(1)} ${m.spec.unitLabel} · 最大缝隙 ${m.maxGapRatio.toFixed(1)}× · 河流 ${m.riverCount} 条 · 末行占宽 ${Math.round(m.lastFillRatio * 100)}%`;
  dom.diagHeadline.textContent = a.headline;
  dom.diagWhy.textContent = a.why;
  dom.diagAction.textContent = a.action;

  dom.mobileDiagLine.textContent = `${a.score}/4 · ${a.headline}`;
  dom.mobileDiagLine.dataset.pass = String(a.pass);
}

// 绘制右侧暖麻卡上的实时点线波谱（直接呼应 179 原海报右中水平虚线）
function renderDensitySvg(lines, m) {
  const maxShow = Math.min(lines.length, 9);
  const rowH = 10;
  let out = "";
  for (let i = 0; i < maxShow; i++) {
    const l = lines[i];
    const y = 10 + i * rowH;
    const widthPct = clamp(l.renderedWidth / Math.max(1, m.colWidth), 0.12, 1);
    const barW = Math.round(236 * widthPct);
    const color = l.lastStretched || l.hasSevereHole
      ? "#B82218"
      : l.hasHole
        ? "#8A5E00"
        : "#291436";
    // 用虚线间隔实时反映该行的字距松紧：越松点距越大
    const gapStep = l.hasSevereHole ? "2 9" : l.hasHole ? "2.5 6" : "3 3.5";
    out += `<line x1="6" y1="${y}" x2="${6 + barW}" y2="${y}" stroke="${color}" stroke-width="${l.hasSevereHole || l.lastStretched ? 2.6 : 2}" stroke-dasharray="${gapStep}" stroke-linecap="round"/>`;
  }
  // 右侧齐平参考细线
  const railColor = state.alignMode === "justify" ? "#B58206" : "rgba(41,20,54,0.22)";
  out += `<line x1="242" y1="4" x2="242" y2="98" stroke="${railColor}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  dom.densitySvg.innerHTML = out;
}

// ============== 绘制主 2D 画布 ==============
function drawHeroCanvas(t, dt, { still }) {
  resizeHeroCanvas();
  if (dirtyLayout || !currentLayout) recomputeHero();

  const animatingIntro = !still && introProgress < 1;
  if (animatingIntro) {
    introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.45);
    dirtyDraw = true;
  }
  if (state.xray && !still) {
    pulseTime = t;
    dirtyDraw = true;
  }
  if (!dirtyDraw && !animatingIntro) return;
  dirtyDraw = false;

  const dpr = pixelRatio(2);
  ctx.save();
  ctx.scale(dpr, dpr);

  const W = canvasCssW;
  const H = canvasCssH;
  const { padX, topY, maxColW, colW, effFontSize, lineH } = currentGeom;
  const { lines, rivers, metrics: m, audit: a } = currentLayout;
  const leftX = padX;
  const rightX = leftX + colW;

  // 背景：原海报深茄紫 #291436
  ctx.fillStyle = "#291436";
  ctx.fillRect(0, 0, W, H);

  // 顶部标尺刻度带（直观展示每行字数与栏宽百分比）
  const rulerY = 22;
  ctx.strokeStyle = "rgba(253, 187, 16, 0.36)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX, rulerY);
  ctx.lineTo(leftX + maxColW, rulerY);
  ctx.stroke();

  // 当前栏宽金黄量尺条
  ctx.strokeStyle = "#FDBB10";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(leftX, rulerY);
  ctx.lineTo(rightX, rulerY);
  ctx.moveTo(leftX, rulerY - 5);
  ctx.lineTo(leftX, rulerY + 5);
  ctx.moveTo(rightX, rulerY - 5);
  ctx.lineTo(rightX, rulerY + 5);
  ctx.stroke();

  // 理想栏宽绿金安全窗提示条（按当前字号实时换算成画布上的理想像素区间）
  const [minCpl, maxCpl] = m.spec.idealCpl;
  const charUnit = m.spec.lang === "en" ? effFontSize * 0.52 : effFontSize * 1.02;
  const idealMinX = clamp(leftX + minCpl * charUnit, leftX + 40, leftX + maxColW);
  const idealMaxX = clamp(leftX + maxCpl * charUnit, idealMinX + 20, leftX + maxColW);
  ctx.fillStyle = "rgba(108, 224, 174, 0.26)";
  ctx.fillRect(idealMinX, rulerY - 4, idealMaxX - idealMinX, 8);

  // 标尺文字
  ctx.font = '600 11px "IBM Plex Sans", "Noto Sans SC", sans-serif';
  ctx.fillStyle = "#FDBB10";
  ctx.textBaseline = "bottom";
  const measureTag = `${Math.round(state.columnRatio * 100)}% · 约 ${Math.round(m.avgCpl)} ${m.spec.lang === "en" ? "字符" : "字"}/行`;
  ctx.fillText(measureTag, leftX, rulerY - 6);

  // 栏底微弱排盘纸背（让左/右边界更清晰）
  const visibleMaxLines = Math.max(4, Math.floor((H - topY - 22) / lineH));
  const drawnLineCount = Math.min(lines.length, visibleMaxLines);
  const blockH = Math.max(lineH * 4, drawnLineCount * lineH + 14);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(leftX, topY - 6, colW, Math.min(blockH, H - topY - 12));

  // 左侧固定金黄虚线齐边轨
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(253, 187, 16, 0.8)";
  ctx.beginPath();
  ctx.moveTo(leftX, topY - 10);
  ctx.lineTo(leftX, H - 14);
  ctx.stroke();

  // 右侧可拖金黄虚线标尺轨
  ctx.strokeStyle = state.alignMode === "justify" ? "#FDBB10" : "rgba(246, 239, 228, 0.32)";
  ctx.lineWidth = state.alignMode === "justify" ? 2 : 1.2;
  ctx.beginPath();
  ctx.moveTo(rightX, topY - 10);
  ctx.lineTo(rightX, H - 14);
  ctx.stroke();
  ctx.restore();

  // 右轨中央触觉拖拽手柄（醒目明黄双箭标牌，限位处带阻尼微弹）
  const handleX = rightX + railOvershoot;
  const handleY = Math.min(topY + blockH * 0.45, H - 44);
  ctx.fillStyle = "#FDBB10";
  ctx.fillRect(handleX - 10, handleY - 18, 20, 36);
  ctx.fillStyle = "#291436";
  ctx.font = '700 11px "IBM Plex Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↔", handleX, handleY);
  ctx.textAlign = "left";

  // 1. 先绘制空洞与白色河流通道（在字形背后，清晰不遮字）
  const riverAlpha = state.xray ? 0.56 + 0.1 * Math.sin(pulseTime * 3.5) : 0.28;

  for (let li = 0; li < drawnLineCount; li++) {
    const line = lines[li];
    const y = topY + li * lineH;
    // 标红每一个严重裂隙（可点击修复）
    for (const g of line.gaps) {
      if (!g.isHole) continue;
      ctx.fillStyle = g.isSevere
        ? `rgba(255, 118, 106, ${state.xray ? 0.52 : 0.34})`
        : `rgba(253, 187, 16, ${state.xray ? 0.34 : 0.18})`;
      ctx.fillRect(leftX + g.x, y + 1, Math.max(3, g.width), effFontSize + 3);
      if (g.isSevere) {
        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "#FF857A";
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + g.x, y + 1, Math.max(3, g.width), effFontSize + 3);
        ctx.restore();
      }
    }
    // 末行被误强撑时整行标红虚线框（可点击切换）
    if (line.lastStretched) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 118, 106, 0.2)";
      ctx.fillRect(leftX, y - 1, colW, effFontSize + 7);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#FF857A";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(leftX, y - 1, colW, effFontSize + 7);
      ctx.restore();
    }
  }

  // 绘制连通多行的纵向白色河流光带
  for (const river of rivers) {
    const pts = river.nodes.filter((n) => n.lineIndex < drawnLineCount);
    if (pts.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 133, 122, ${riverAlpha + 0.25})`;
    ctx.lineWidth = state.xray ? Math.max(10, effFontSize * 0.65) : Math.max(6, effFontSize * 0.4);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = leftX + p.x;
      const py = topY + p.lineIndex * lineH + effFontSize * 0.55;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // 河道中心虚线骨架
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // 2. 绘制逐行活字（常规模式清晰锐利；河流透视 X-Ray 模式切换为柔和灰阶墨块，还原印厂眯眼验灰效果！）
  ctx.font = `400 ${effFontSize}px ${m.spec.fontFamily}`;
  ctx.textBaseline = "top";
  const easeIntro = 1 - (1 - introProgress) ** 3;

  for (let li = 0; li < drawnLineCount; li++) {
    const line = lines[li];
    const y = topY + li * lineH;
    // 开场前 0.6s 逐行轻微展宽进入，任何一帧都清晰完整
    const lineScale = 0.92 + 0.08 * easeIntro;
    for (const it of line.items) {
      const drawX = leftX + it.x * lineScale;
      if (state.xray) {
        // 眯眼透视模式：字形退化为均匀灰块，白色河流瞬间触目惊心
        ctx.fillStyle = line.lastStretched
          ? "rgba(255, 133, 122, 0.72)"
          : "rgba(246, 239, 228, 0.68)";
        ctx.fillRect(drawX, y + 2, Math.max(2, it.width - 0.5), effFontSize * 0.78);
      } else {
        ctx.fillStyle = it.isHyphen
          ? "#FDBB10"
          : line.lastStretched
            ? "#FFD5D0"
            : "#F6EFE4";
        ctx.fillText(it.text, drawX, y);
      }
    }
  }

  // 3. 若当前有标红错态，把动作签贴在栏外留白或末行下方，绝不遮盖任何正文文字！
  ctx.font = '700 11px "Noto Sans SC", "IBM Plex Sans", sans-serif';
  ctx.textBaseline = "middle";
  if (rivers.length > 0 && rivers[0].nodes[0].lineIndex < drawnLineCount) {
    const n0 = rivers[0].nodes[0];
    const tagText = `× 白色河流 ${rivers.length} 条 · 点此堵河`;
    const tw = ctx.measureText(tagText).width + 14;
    const ny = topY + n0.lineIndex * lineH + effFontSize * 0.55;
    if (W - rightX >= tw + 24) {
      // 栏右空位充足：挂在右尺外侧并用细虚线指向河流，零遮字！
      const tx = rightX + 18;
      const ty = clamp(ny, topY + 12, H - 52);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#FF857A";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftX + n0.x, ny);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#B82218";
      ctx.fillRect(tx, ty - 11, tw, 22);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(tagText, tx + 7, ty);
    } else {
      // 栏宽较满：置顶于标尺右侧空白处，同样零遮字！
      const tx = clamp(W - tw - 8, leftX + 4, W - tw - 8);
      const ty = 14;
      ctx.fillStyle = "#B82218";
      ctx.fillRect(tx, ty - 10, tw, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(tagText, tx + 7, ty);
    }
  }
  const lastIdx = drawnLineCount - 1;
  if (lastIdx >= 0 && lines[lastIdx].lastStretched) {
    const tagText = "× 末行强撑（180）· 点末行自然收尾";
    const tw = ctx.measureText(tagText).width + 14;
    const tx = clamp(leftX, 8, W - tw - 8);
    const ty = Math.min(H - 13, topY + drawnLineCount * lineH + 10);
    ctx.fillStyle = "#B82218";
    ctx.fillRect(tx, ty - 10, tw, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tagText, tx + 7, ty);
  }
  if (a.pass) {
    const okText = "✓ 双边齐整 · 灰阶均匀";
    const tw = ctx.measureText(okText).width + 14;
    const tx = clamp(rightX - tw, leftX, W - tw - 8);
    const ty = Math.min(H - 14, topY + drawnLineCount * lineH + 10);
    ctx.fillStyle = "#0F6844";
    ctx.fillRect(tx, ty - 10, tw, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(okText, tx + 7, ty);
  }

  ctx.restore();
}

// 启动省电渲染循环（视口外/后台自动停帧）
const heroLoop = loop(canvas, drawHeroCanvas);

function requestUpdate(recalc = true) {
  if (recalc) dirtyLayout = true;
  else syncHeroUI();
  dirtyDraw = true;
  heroLoop.draw();
}

// ============== 画布交互：横拖调栏宽 + 直点裂隙/末行修复 + 键盘微调 ==============
let dragActive = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartRatio = state.columnRatio;
let horizontalLocked = false;
let railOvershoot = 0;

function onPointerStart(clientX, clientY) {
  dragActive = true;
  dragMoved = false;
  horizontalLocked = false;
  dragStartX = clientX;
  dragStartY = clientY;
  dragStartRatio = state.columnRatio;
  railOvershoot = 0;
}

function onPointerMove(clientX, clientY, isTouch, evt) {
  if (!dragActive) return;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (!horizontalLocked) {
    if (Math.hypot(dx, dy) < 4) return;
    // 触屏上若主要是纵向滑动则放手让页面正常滚屏
    if (isTouch && Math.abs(dy) > Math.abs(dx) * 1.15) {
      dragActive = false;
      return;
    }
    horizontalLocked = true;
  }
  if (evt && evt.cancelable) evt.preventDefault();
  dragMoved = true;
  const span = Math.max(180, currentGeom ? currentGeom.maxColW : canvasCssW - 48);
  const rawRatio = dragStartRatio + dx / span;
  const nextRatio = clamp(rawRatio, 0.32, 0.96);
  // 抵达最小/最大栏宽限位时给金黄标尺温和阻尼弹性反馈
  const nextOver = rawRatio < 0.32
    ? clamp((rawRatio - 0.32) * 32, -10, 0)
    : rawRatio > 0.96
      ? clamp((rawRatio - 0.96) * 32, 0, 10)
      : 0;
  if (Math.abs(nextRatio - state.columnRatio) > 0.0002) {
    state.columnRatio = nextRatio;
    dirtyLayout = true;
    dirtyDraw = true;
  }
  if (Math.abs(nextOver - railOvershoot) > 0.05) {
    railOvershoot = nextOver;
    dirtyDraw = true;
  }
}

function onCanvasClickAt(clientX, clientY) {
  if (!currentLayout || !currentGeom) return;
  const rect = canvas.getBoundingClientRect();
  const y = clientY - rect.top;
  const { topY, lineH } = currentGeom;
  const lineIdx = Math.floor((y - topY) / lineH);
  const { lines } = currentLayout;
  const lastIdx = lines.length - 1;

  // 点中末行或其紧下方的末行强撑标牌：直接切换末行强撑
  if (lines[lastIdx]?.lastStretched && (lineIdx === lastIdx || lineIdx === lastIdx + 1)) {
    state.lastLineJustify = false;
    requestUpdate(true);
    return;
  }
  if (lineIdx === lastIdx && y >= topY + lastIdx * lineH - 4 && y <= topY + (lastIdx + 1) * lineH + 4) {
    state.lastLineJustify = !state.lastLineJustify;
    requestUpdate(true);
    return;
  }
  // 点中画布其余区域（正文行、裂隙、栏外河流动作签）：顺次启用微排修复，全部就绪时切河流透视
  if (!state.hyphenCompress) {
    state.hyphenCompress = true;
  } else if (state.composer !== "balanced") {
    state.composer = "balanced";
  } else if (state.lastLineJustify) {
    state.lastLineJustify = false;
  } else if (state.columnRatio < 0.62) {
    state.columnRatio = 0.72;
  } else {
    state.xray = !state.xray;
  }
  requestUpdate(true);
}

canvas.addEventListener("mousedown", (e) => {
  onPointerStart(e.clientX, e.clientY);
});
window.addEventListener("mousemove", (e) => {
  onPointerMove(e.clientX, e.clientY, false, e);
});
window.addEventListener("mouseup", (e) => {
  if (!dragActive) return;
  const wasMoved = dragMoved;
  dragActive = false;
  if (railOvershoot !== 0) {
    railOvershoot = 0;
    dirtyDraw = true;
  }
  if (!wasMoved) onCanvasClickAt(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  const t0 = e.touches[0];
  onPointerStart(t0.clientX, t0.clientY);
}, { passive: true });
canvas.addEventListener("touchmove", (e) => {
  if (!dragActive || e.touches.length !== 1) return;
  const t0 = e.touches[0];
  onPointerMove(t0.clientX, t0.clientY, true, e);
}, { passive: false });
canvas.addEventListener("touchend", (e) => {
  if (!dragActive) return;
  const wasMoved = dragMoved;
  dragActive = false;
  if (railOvershoot !== 0) {
    railOvershoot = 0;
    dirtyDraw = true;
  }
  if (!wasMoved && e.changedTouches[0]) {
    onCanvasClickAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
});

// 键盘操作（画布聚焦时方向键调栏宽/字号；全局 Space 开关河流透视）
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    state.columnRatio = clamp(Math.round((state.columnRatio + 0.03) * 100) / 100, 0.32, 0.96);
    requestUpdate(true);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    state.columnRatio = clamp(Math.round((state.columnRatio - 0.03) * 100) / 100, 0.32, 0.96);
    requestUpdate(true);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.fontSize = clamp(state.fontSize + 1, 12, 21);
    requestUpdate(true);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    state.fontSize = clamp(state.fontSize - 1, 12, 21);
    requestUpdate(true);
  } else if (e.code === "Space") {
    e.preventDefault();
    state.xray = !state.xray;
    requestUpdate(false);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement === document.body) {
    const heroRect = document.querySelector(".hero").getBoundingClientRect();
    if (heroRect.bottom > 120) {
      e.preventDefault();
      state.xray = !state.xray;
      requestUpdate(false);
    }
  }
});

// ============== 绑定 Hero 所有按钮与滑块 ==============
document.querySelectorAll("#specimen-tabs .tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    requestUpdate(true);
  });
});

dom.ctrlWidth.addEventListener("input", () => {
  state.columnRatio = clamp(Number(dom.ctrlWidth.value) / 100, 0.32, 0.96);
  requestUpdate(true);
});
dom.mobileWidthRange.addEventListener("input", () => {
  state.columnRatio = clamp(Number(dom.mobileWidthRange.value) / 100, 0.32, 0.96);
  requestUpdate(true);
});

dom.ctrlSize.addEventListener("input", () => {
  state.fontSize = clamp(Number(dom.ctrlSize.value), 12, 21);
  requestUpdate(true);
});

dom.ctrlHyphen.addEventListener("click", () => {
  state.hyphenCompress = !state.hyphenCompress;
  requestUpdate(true);
});
dom.ctrlComposer.addEventListener("click", () => {
  state.composer = state.composer === "balanced" ? "greedy" : "balanced";
  requestUpdate(true);
});
dom.ctrlLast.addEventListener("click", () => {
  state.lastLineJustify = !state.lastLineJustify;
  requestUpdate(true);
});
dom.ctrlAlign.addEventListener("click", () => {
  state.alignMode = state.alignMode === "justify" ? "left" : "justify";
  requestUpdate(true);
});

const toggleXray = () => {
  state.xray = !state.xray;
  requestUpdate(false);
};
dom.btnXray.addEventListener("click", toggleXray);
dom.mobileBtnXray.addEventListener("click", toggleXray);

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  Object.assign(state, p);
  requestUpdate(true);
}

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});

document.getElementById("btn-calibrate").addEventListener("click", () => applyPreset("book"));
dom.mobileBtnFix.addEventListener("click", () => applyPreset("book"));
document.getElementById("btn-reset").addEventListener("click", () => applyPreset("broken"));

// ============== 01 节：三大支柱 SVG 结构解剖 ==============
const ANATOMY = {
  edge: {
    caption: "双边齐平让多栏之间自然切出笔直的白色栏沟，不用画黑线框也能一眼分辨板块边界；末行务必自然左收。",
    svg: `
      <rect x="0" y="0" width="440" height="248" fill="#FAF5EC"/>
      <rect x="24" y="24" width="180" height="200" fill="#291436"/>
      <rect x="236" y="24" width="180" height="200" fill="#291436"/>
      <rect x="204" y="24" width="32" height="200" fill="#FDBB10" opacity="0.32"/>
      <line x1="204" y1="14" x2="204" y2="234" stroke="#B58206" stroke-width="1.6" stroke-dasharray="4 3"/>
      <line x1="236" y1="14" x2="236" y2="234" stroke="#B58206" stroke-width="1.6" stroke-dasharray="4 3"/>
      <g fill="#F6EFE4">
        <rect x="38" y="44" width="152" height="8"/><rect x="38" y="64" width="152" height="8"/>
        <rect x="38" y="84" width="152" height="8"/><rect x="38" y="104" width="152" height="8"/>
        <rect x="38" y="124" width="152" height="8"/><rect x="38" y="144" width="152" height="8"/>
        <rect x="38" y="164" width="152" height="8"/><rect x="38" y="184" width="88" height="8" fill="#FDBB10"/>
        <rect x="250" y="44" width="152" height="8"/><rect x="250" y="64" width="152" height="8"/>
        <rect x="250" y="84" width="152" height="8"/><rect x="250" y="104" width="152" height="8"/>
        <rect x="250" y="124" width="152" height="8"/><rect x="250" y="144" width="152" height="8"/>
        <rect x="250" y="164" width="152" height="8"/><rect x="250" y="184" width="106" height="8" fill="#FDBB10"/>
      </g>
      <text x="220" y="242" text-anchor="middle" font-size="11" font-weight="700" fill="#291436">笔直栏沟 · 闭合完形</text>
    `,
  },
  texture: {
    caption: "优秀的两端对齐远看像一块匀净的棉麻灰布；一旦局部词缝拉大并上下相连，就会裂出破坏节奏的白色河流。",
    svg: `
      <rect x="0" y="0" width="440" height="248" fill="#FAF5EC"/>
      <rect x="20" y="34" width="188" height="186" fill="#F2E7D9" stroke="#B82218" stroke-width="2"/>
      <rect x="232" y="34" width="188" height="186" fill="#F2E7D9" stroke="#0F6844" stroke-width="2"/>
      <text x="114" y="24" text-anchor="middle" font-size="12" font-weight="800" fill="#B82218">空洞相连 · 起河</text>
      <text x="326" y="24" text-anchor="middle" font-size="12" font-weight="800" fill="#0F6844">间距匀摊 · 均灰</text>
      <path d="M116 48 Q126 112 104 196" stroke="#B82218" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.22"/>
      <g fill="#291436">
        <rect x="34" y="52" width="68" height="8"/><rect x="132" y="52" width="62" height="8"/>
        <rect x="34" y="76" width="76" height="8"/><rect x="138" y="76" width="56" height="8"/>
        <rect x="34" y="100" width="72" height="8"/><rect x="136" y="100" width="58" height="8"/>
        <rect x="34" y="124" width="66" height="8"/><rect x="128" y="124" width="66" height="8"/>
        <rect x="34" y="148" width="60" height="8"/><rect x="122" y="148" width="72" height="8"/>
        <rect x="34" y="172" width="54" height="8"/><rect x="116" y="172" width="78" height="8"/>
        <rect x="246" y="52" width="50" height="8"/><rect x="303" y="52" width="52" height="8"/><rect x="362" y="52" width="44" height="8"/>
        <rect x="246" y="76" width="64" height="8"/><rect x="317" y="76" width="42" height="8"/><rect x="366" y="76" width="40" height="8"/>
        <rect x="246" y="100" width="44" height="8"/><rect x="297" y="100" width="62" height="8"/><rect x="366" y="100" width="40" height="8"/>
        <rect x="246" y="124" width="58" height="8"/><rect x="311" y="124" width="46" height="8"/><rect x="364" y="124" width="42" height="8"/>
        <rect x="246" y="148" width="48" height="8"/><rect x="301" y="148" width="54" height="8"/><rect x="362" y="148" width="44" height="8"/>
        <rect x="246" y="172" width="60" height="8"/><rect x="313" y="172" width="48" height="8"/><rect x="368" y="172" width="38" height="8"/>
      </g>
    `,
  },
  width: {
    caption: "决定成败的不是绝对像素，而是「栏宽 ÷ 字号」换算出的每行字数：中文单栏约 18–34 字，西文约 45–75 字符（经验区间）。",
    svg: `
      <rect x="0" y="0" width="440" height="248" fill="#FAF5EC"/>
      <rect x="24" y="42" width="90" height="14" fill="#FBE9E7" stroke="#B82218" stroke-width="1.5"/>
      <rect x="114" y="42" width="184" height="14" fill="#E6F4EE" stroke="#0F6844" stroke-width="1.8"/>
      <rect x="298" y="42" width="118" height="14" fill="#FBE9E7" stroke="#B82218" stroke-width="1.5"/>
      <text x="69" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#B82218">过窄·起河</text>
      <text x="206" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#0F6844">舒适区间（经验值）</text>
      <text x="357" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="#B82218">过宽·回扫迷路</text>

      <rect x="24" y="78" width="84" height="130" fill="#291436"/>
      <rect x="34" y="96" width="22" height="7" fill="#F6EFE4"/><rect x="78" y="96" width="20" height="7" fill="#F6EFE4"/>
      <rect x="34" y="116" width="18" height="7" fill="#F6EFE4"/><rect x="72" y="116" width="26" height="7" fill="#F6EFE4"/>
      <rect x="34" y="136" width="24" height="7" fill="#F6EFE4"/><rect x="76" y="136" width="22" height="7" fill="#F6EFE4"/>
      <text x="66" y="196" text-anchor="middle" font-size="11" font-weight="700" fill="#FF857A">&lt;15 字</text>

      <rect x="122" y="78" width="170" height="130" fill="#291436" stroke="#FDBB10" stroke-width="2"/>
      <g fill="#F6EFE4">
        <rect x="134" y="96" width="146" height="7"/><rect x="134" y="114" width="146" height="7"/>
        <rect x="134" y="132" width="146" height="7"/><rect x="134" y="150" width="146" height="7"/>
        <rect x="134" y="168" width="94" height="7" fill="#FDBB10"/>
      </g>
      <text x="207" y="196" text-anchor="middle" font-size="11" font-weight="700" fill="#6CE0AE">18–34 汉字 / 45–75 西文</text>

      <rect x="306" y="78" width="110" height="130" fill="#291436"/>
      <g fill="#F6EFE4">
        <rect x="314" y="96" width="94" height="5"/><rect x="314" y="110" width="94" height="5"/>
        <rect x="314" y="124" width="94" height="5"/>
      </g>
      <path d="M406 104 C370 112 340 124 316 146" stroke="#FF857A" stroke-width="1.8" stroke-dasharray="3 3" fill="none"/>
      <text x="361" y="196" text-anchor="middle" font-size="11" font-weight="700" fill="#FF857A">&gt;40 字易串行</text>
    `,
  },
};

const anatomySvg = document.getElementById("anatomy-svg");
const anatomyCap = document.getElementById("anatomy-caption");
function renderAnatomy(key) {
  const item = ANATOMY[key] || ANATOMY.edge;
  anatomySvg.innerHTML = item.svg;
  anatomyCap.textContent = item.caption;
  document.querySelectorAll(".ana-tab").forEach((t) => {
    const on = t.dataset.pillar === key;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".ana-tab").forEach((t) => {
  t.addEventListener("click", () => renderAnatomy(t.dataset.pillar));
});
renderAnatomy("edge");

// ============== 02 节：180° 倒置眯眼检河台 ==============
const riverCanvas = document.getElementById("river-canvas");
const riverCtx = riverCanvas.getContext("2d");
const riverSheet = document.getElementById("river-sheet");
const riverMetricBox = document.getElementById("river-metric-box");
const riverState = { flipped: false, squint: false, balanced: false };

function renderRiverLab() {
  const rect = riverCanvas.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = pixelRatio(2);
  const W = Math.round(rect.width);
  const H = Math.round(rect.height);
  riverCanvas.width = Math.round(W * dpr);
  riverCanvas.height = Math.round(H * dpr);

  const fontSize = W < 360 ? 12 : 13.5;
  const colW = clamp(Math.round(W * 0.76), 215, 326);
  const padX = Math.round((W - colW) / 2);
  const topY = 22;
  const lineH = Math.round(fontSize * 1.72);

  const simState = {
    specimen: "english",
    columnRatio: 0.6,
    fontSize,
    hyphenCompress: riverState.balanced,
    lastLineJustify: false,
    composer: riverState.balanced ? "balanced" : "greedy",
    alignMode: "justify",
    xray: false,
  };
  const layout = layoutParagraph(simState, colW, measureTextCached);

  riverCtx.save();
  riverCtx.scale(dpr, dpr);
  riverCtx.fillStyle = "#FFFFFF";
  riverCtx.fillRect(0, 0, W, H);

  // 左右齐边细金虚线
  riverCtx.save();
  riverCtx.setLineDash([3, 3]);
  riverCtx.strokeStyle = "#B58206";
  riverCtx.lineWidth = 1.2;
  riverCtx.beginPath();
  riverCtx.moveTo(padX, 12);
  riverCtx.lineTo(padX, H - 12);
  riverCtx.moveTo(padX + colW, 12);
  riverCtx.lineTo(padX + colW, H - 12);
  riverCtx.stroke();
  riverCtx.restore();

  const maxLines = Math.floor((H - topY - 12) / lineH);
  const showN = Math.min(layout.lines.length, maxLines);

  // 标出河流通道
  for (const r of layout.rivers) {
    const pts = r.nodes.filter((n) => n.lineIndex < showN);
    if (pts.length < 2) continue;
    riverCtx.save();
    riverCtx.strokeStyle = "rgba(184, 34, 24, 0.25)";
    riverCtx.lineWidth = Math.max(8, fontSize * 0.6);
    riverCtx.lineCap = "round";
    riverCtx.lineJoin = "round";
    riverCtx.beginPath();
    pts.forEach((p, i) => {
      const px = padX + p.x;
      const py = topY + p.lineIndex * lineH + fontSize * 0.55;
      if (i === 0) riverCtx.moveTo(px, py);
      else riverCtx.lineTo(px, py);
    });
    riverCtx.stroke();
    riverCtx.restore();
  }

  riverCtx.font = `400 ${fontSize}px ${SPECIMENS.english.fontFamily}`;
  riverCtx.textBaseline = "top";
  riverCtx.fillStyle = "#1E1029";
  for (let i = 0; i < showN; i++) {
    const l = layout.lines[i];
    const y = topY + i * lineH;
    for (const it of l.items) {
      riverCtx.fillText(it.text, padX + it.x, y);
    }
  }
  riverCtx.restore();

  // 更新单真源读数
  const m = layout.metrics;
  const clean = m.riverCount === 0 && m.maxGapRatio < 2.2;
  riverMetricBox.dataset.clean = String(clean);
  document.getElementById("rm-mode").textContent = riverState.balanced
    ? "当前：段落全局均衡（Knuth-Plass 思路）+ 断词连字符"
    : "当前：逐行贪心断行 · 未开断词连字符";
  document.getElementById("rm-stats").textContent = m.riverCount > 0
    ? `检测到 ${m.riverCount} 条白色河流 · 最大词缝 ${m.maxGapRatio.toFixed(1)}×`
    : `纵向河流 0 条 · 最大词缝收束至 ${m.maxGapRatio.toFixed(1)}×`;
  document.getElementById("rm-desc").textContent = riverState.balanced
    ? "切到段落全局均衡并打开连字断词后，长词被温和拆行、空隙分摊给整段，倒转 180° 眯眼看也呈均匀灰调。"
    : "逐行贪心只顾把当前行塞满，长英文词掉行后剩出的空当只能硬撑进这一行的两三个空格里，倒转 180° 后裂隙一目了然。";
}

document.getElementById("btn-flip-180").addEventListener("click", (e) => {
  riverState.flipped = !riverState.flipped;
  riverSheet.dataset.flipped = String(riverState.flipped);
  e.currentTarget.setAttribute("aria-pressed", String(riverState.flipped));
});
document.getElementById("btn-squint").addEventListener("click", (e) => {
  riverState.squint = !riverState.squint;
  riverSheet.dataset.squint = String(riverState.squint);
  e.currentTarget.setAttribute("aria-pressed", String(riverState.squint));
});
const btnGreedy = document.getElementById("btn-algo-greedy");
const btnBalanced = document.getElementById("btn-algo-balanced");
function setRiverAlgo(bal) {
  riverState.balanced = bal;
  btnGreedy.classList.toggle("is-active", !bal);
  btnGreedy.setAttribute("aria-pressed", String(!bal));
  btnBalanced.classList.toggle("is-active", bal);
  btnBalanced.setAttribute("aria-pressed", String(bal));
  renderRiverLab();
}
btnGreedy.addEventListener("click", () => setRiverAlgo(false));
btnBalanced.addEventListener("click", () => setRiverAlgo(true));

// ============== 03 节：中英混排「文内直点排雷」 ==============
const mineState = { word: false, url: false, punct: false };
const mfChart = document.getElementById("mf-chart");
const mfScore = document.getElementById("mf-score");
const mfNote = document.getElementById("mf-note");

function renderMinefield() {
  const tokens = [
    { id: "mine-word", key: "word", onLabel: "已断词", offLabel: "点此开启断词" },
    { id: "mine-url", key: "url", onLabel: "已转短锚文", offLabel: "点此转为短锚文" },
    { id: "mine-punct", key: "punct", onLabel: "已半宽挤压", offLabel: "点此标点挤压" },
  ];
  for (const t of tokens) {
    const el = document.getElementById(t.id);
    const fixed = mineState[t.key];
    el.dataset.fixed = String(fixed);
    el.setAttribute("aria-pressed", String(fixed));
    el.querySelector(".mine-tag").textContent = fixed ? t.onLabel : t.offLabel;
  }

  const remaining = Object.values(mineState).filter((v) => !v).length;
  mfScore.textContent = remaining === 0 ? "3 处暗礁全部排清" : `尚余 ${remaining} 处暗礁`;
  mfScore.dataset.clean = String(remaining === 0);

  // 各行间距峰值示意（随 3 处修复实时回落到安全基线以下）
  const bars = [
    { label: "L1", v: mineState.word ? 1.15 : 2.55 },
    { label: "L2", v: mineState.word ? 1.12 : 1.55 },
    { label: "L3", v: mineState.url ? 1.18 : 3.25 },
    { label: "L4", v: mineState.punct ? 1.14 : 2.35 },
    { label: "L5", v: 1.08 },
  ];
  const maxV = 3.6;
  const safeY = 104 - (1.6 / maxV) * 76;
  let svg = `<line x1="16" y1="14" x2="38" y2="14" stroke="#6CE0AE" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  svg += `<text x="44" y="18" font-size="10.5" font-weight="700" fill="#6CE0AE">绿虚线：舒适缝隙上限（示意）</text>`;
  svg += `<line x1="16" y1="${safeY.toFixed(1)}" x2="306" y2="${safeY.toFixed(1)}" stroke="#6CE0AE" stroke-width="1.2" stroke-dasharray="4 3"/>`;

  bars.forEach((b, idx) => {
    const x = 32 + idx * 56;
    const h = Math.round((b.v / maxV) * 76);
    const y = 104 - h;
    const col = b.v > 1.85 ? "#FF857A" : "#FDBB10";
    svg += `<rect x="${x}" y="${y}" width="32" height="${h}" fill="${col}"/>`;
    svg += `<text x="${x + 16}" y="${y - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#F6EFE4">${b.v.toFixed(1)}×</text>`;
    svg += `<text x="${x + 16}" y="121" text-anchor="middle" font-size="11" font-weight="700" fill="#D5C5DF">${b.label}</text>`;
  });
  mfChart.innerHTML = svg;

  if (remaining === 0) {
    mfNote.textContent = "三处暗礁全部化解：英文长词合理拆行、裸链接改为短锚文、连续全角标点收紧至半宽，五行的间距峰值全部落回舒适线以下。";
  } else {
    const leftNames = [];
    if (!mineState.word) leftNames.push("长英文词整块掉行");
    if (!mineState.url) leftNames.push("超长裸网址撑裂前一行");
    if (!mineState.punct) leftNames.push("连续全角标点留出宽坑");
    mfNote.textContent = `当前仍有：${leftNames.join("、")}。点击段落中标红的词块，观察对应行的峰值柱立刻压平。`;
  }
}

document.getElementById("mine-word").addEventListener("click", () => { mineState.word = !mineState.word; renderMinefield(); });
document.getElementById("mine-url").addEventListener("click", () => { mineState.url = !mineState.url; renderMinefield(); });
document.getElementById("mine-punct").addEventListener("click", () => { mineState.punct = !mineState.punct; renderMinefield(); });
document.getElementById("mf-fix-all").addEventListener("click", () => { mineState.word = mineState.url = mineState.punct = true; renderMinefield(); });
document.getElementById("mf-reset").addEventListener("click", () => { mineState.word = mineState.url = mineState.punct = false; renderMinefield(); });
renderMinefield();

// ============== 04 节：五节点历史源流演进 ==============
const ERAS = {
  gutenberg: {
    meta: "约 1455 年 · 德国美因茨 · 约翰内斯·古腾堡（Johannes Gutenberg）",
    title: "用约 290 种宽窄字模追上手抄羊皮卷的齐边",
    body: "中世纪抄经僧只需略微拉宽或收窄行尾字母，就能把双栏羊皮卷写得齐整如墙。古腾堡在美因茨印制《四十二行圣经》（B42）时，没有硬塞铅空把词距撑裂，而是为拉丁字母铸造了约 290 种字模——含宽窄异体、连字与缩写——并把连字符与标点微微探出右缘。美国国会图书馆与大英图书馆至今珍藏完整的羊皮纸初印本。",
    svg: `
      <rect width="460" height="190" fill="#291436"/>
      <text x="24" y="28" font-size="11" font-weight="700" fill="#FDBB10">1455 · B42 宽窄字模与微探右缘示意</text>
      <rect x="24" y="46" width="186" height="120" fill="#F2E7D9"/>
      <rect x="234" y="46" width="186" height="120" fill="#F2E7D9"/>
      <line x1="196" y1="42" x2="196" y2="170" stroke="#B58206" stroke-width="1.4" stroke-dasharray="3 3"/>
      <line x1="406" y1="42" x2="406" y2="170" stroke="#B58206" stroke-width="1.4" stroke-dasharray="3 3"/>
      <g fill="#291436">
        <rect x="38" y="62" width="158" height="9"/><rect x="38" y="82" width="158" height="9"/>
        <rect x="38" y="102" width="158" height="9"/><rect x="38" y="122" width="158" height="9"/>
        <rect x="38" y="142" width="158" height="9"/>
        <rect x="248" y="62" width="158" height="9"/><rect x="248" y="82" width="158" height="9"/>
        <rect x="248" y="102" width="158" height="9"/><rect x="248" y="122" width="158" height="9"/>
        <rect x="248" y="142" width="158" height="9"/>
      </g>
      <rect x="197" y="84" width="7" height="4" fill="#B82218"/>
      <rect x="407" y="124" width="7" height="4" fill="#B82218"/>
      <text x="230" y="182" text-anchor="middle" font-size="11" fill="#F6EFE4">双栏 42 行 · 标点连字符微微探出边线</text>
    `,
  },
  knuth: {
    meta: "1981 年 11 月 · Software: Practice and Experience · Donald E. Knuth & Michael F. Plass",
    title: "盒子、胶水与动态规划：首次纵览整段求最优断行",
    body: "传统排版软件逐行贪心塞字，前面省事、后面遭殃。1981 年唐纳德·克努特与迈克尔·普拉斯在论文《将段落断成行》中提出「盒子（固定字形）、胶水（可伸缩空格）、惩罚（断词代价）」三元模型，并在 TeX 中用动态规划扫描整段所有可行断点，求出全局总丑陋度最低的断行路径——至今仍是数字排版算法的基石。",
    svg: `
      <rect width="460" height="190" fill="#291436"/>
      <text x="24" y="28" font-size="11" font-weight="700" fill="#FDBB10">1981 · KNUTH-PLASS 盒子 + 弹簧胶水 + 全局最短路</text>
      <g>
        <rect x="28" y="54" width="62" height="28" fill="#F2E7D9"/><text x="59" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#291436">BOX</text>
        <path d="M94 68 L102 60 L110 76 L118 60 L126 76 L134 68" stroke="#FDBB10" stroke-width="2.2" fill="none"/>
        <rect x="138" y="54" width="74" height="28" fill="#F2E7D9"/><text x="175" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#291436">BOX</text>
        <path d="M216 68 L224 60 L232 76 L240 60 L248 76 L256 68" stroke="#FDBB10" stroke-width="2.2" fill="none"/>
        <rect x="260" y="54" width="84" height="28" fill="#F2E7D9"/><text x="302" y="72" text-anchor="middle" font-size="12" font-weight="800" fill="#291436">BOX</text>
        <circle cx="386" cy="68" r="16" fill="#FF857A"/><text x="386" y="72" text-anchor="middle" font-size="11" font-weight="800" fill="#291436">断点</text>
      </g>
      <path d="M40 138 Q140 105 230 138 T420 138" stroke="#6CE0AE" stroke-width="2.5" fill="none"/>
      <circle cx="40" cy="138" r="6" fill="#FDBB10"/><circle cx="170" cy="122" r="6" fill="#FDBB10"/>
      <circle cx="300" cy="150" r="6" fill="#FDBB10"/><circle cx="420" cy="138" r="6" fill="#6CE0AE"/>
      <text x="230" y="176" text-anchor="middle" font-size="11" fill="#F6EFE4">整段断点构成有向无环图，动态规划寻最小总失衡路径</text>
    `,
  },
  hz: {
    meta: "1988–1993 hz-program（Hermann Zapf & Peter Karow）· 2000 pdfTeX（Hàn Thế Thành）",
    title: "让字宽在 ±2% 内隐形呼吸，连字模也能微调",
    body: "受古腾堡异体字启发，德国字体大师赫尔曼·察普夫与 URW 联合创始人彼得·卡罗开发出 hz-program，允许排版引擎在人眼几乎无法察觉的 ±2%–3% 范围内微幅缩放字符宽度，并配合光学边线凸排。该思路后来融入 Adobe InDesign 段落排版器；2000 年，韩世诚（Hàn Thế Thành）在博士论文中将字符扩展与凸排直接做进开源 pdfTeX。",
    svg: `
      <rect width="460" height="190" fill="#291436"/>
      <text x="24" y="28" font-size="11" font-weight="700" fill="#FDBB10">微排版 · ±2% 字符弹性缩放示意（夸张对比）</text>
      <rect x="28" y="54" width="120" height="44" fill="#241132" stroke="#D5C5DF" stroke-width="1.2"/>
      <text x="88" y="82" text-anchor="middle" font-size="22" font-weight="700" fill="#F6EFE4" transform="translate(88,0) scale(0.92,1) translate(-88,0)">98% 紧</text>
      <rect x="170" y="54" width="120" height="44" fill="#F2E7D9" stroke="#FDBB10" stroke-width="2"/>
      <text x="230" y="82" text-anchor="middle" font-size="22" font-weight="700" fill="#291436">100% 标</text>
      <rect x="312" y="54" width="120" height="44" fill="#241132" stroke="#6CE0AE" stroke-width="1.2"/>
      <text x="372" y="82" text-anchor="middle" font-size="22" font-weight="700" fill="#6CE0AE" transform="translate(372,0) scale(1.08,1) translate(-372,0)">102% 舒</text>
      <text x="230" y="138" text-anchor="middle" font-size="12" fill="#FDBB10">分担词缝拉伸压力 → 肉眼几乎看不出变形，却能大幅消除白色河流</text>
      <text x="230" y="164" text-anchor="middle" font-size="11" fill="#D5C5DF">Hermann Zapf &amp; Peter Karow (URW) → Adobe InDesign / Hàn Thế Thành (pdfTeX)</text>
    `,
  },
  bringhurst: {
    meta: "1992 年首版 · Hartley & Marks · Robert Bringhurst《字体排印风格要素》",
    title: "把模糊的「栏宽手感」写成了可复用的经验尺度",
    body: "加拿大诗人兼排版学者罗伯特·布林赫斯特在《The Elements of Typographic Style》第二章总结了广为引用的经验值：单栏西文衬线正文每行约 45–75 个字符（含空格），66 字符常被视作理想平衡点；多栏版面则约为 40–50 字符。这一经验尺度至今提醒设计师：两端对齐绝不能脱离栏宽孤立谈论。",
    svg: `
      <rect width="460" height="190" fill="#291436"/>
      <text x="24" y="28" font-size="11" font-weight="700" fill="#FDBB10">1992 · BRINGHURST 西文单栏行长经验尺（字符/行）</text>
      <rect x="30" y="76" width="400" height="22" fill="#1B0C26" stroke="#D5C5DF" stroke-width="1"/>
      <rect x="150" y="76" width="160" height="22" fill="#0F6844"/>
      <line x1="262" y1="62" x2="262" y2="116" stroke="#FDBB10" stroke-width="2.5"/>
      <circle cx="262" cy="62" r="5" fill="#FDBB10"/>
      <text x="150" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="#6CE0AE">45</text>
      <text x="262" y="50" text-anchor="middle" font-size="13" font-weight="800" fill="#FDBB10">66 经验理想</text>
      <text x="310" y="122" text-anchor="middle" font-size="12" font-weight="700" fill="#6CE0AE">75</text>
      <text x="86" y="122" text-anchor="middle" font-size="11" fill="#FF857A">&lt;40 易裂河</text>
      <text x="378" y="122" text-anchor="middle" font-size="11" fill="#FF857A">&gt;80 易串行</text>
      <text x="230" y="164" text-anchor="middle" font-size="11" fill="#F6EFE4">中文单栏经验折算约为 18–34 汉字/行（视字号与行距弹性调整）</text>
    `,
  },
  w3c: {
    meta: "当代网页标准 · W3C CSS Text Module Level 3 与 W3C CLREQ（中文排版需求）",
    title: "把纸面五百年的齐边规则写进浏览器规范",
    body: "W3C《CSS Text Module Level 3》定义了 text-align: justify、text-justify（区分西文 inter-word 与东亚 inter-character）与 text-align-last；而 W3C《中文排版需求》（CLREQ）系统梳理了行首行尾禁则、连续标点挤压、中西文混排四分空等细则，让中文网页也能逐步逼近传统书刊的齐整灰阶。",
    svg: `
      <rect width="460" height="190" fill="#291436"/>
      <text x="24" y="28" font-size="11" font-weight="700" fill="#FDBB10">W3C · CSS TEXT 3 &amp; CLREQ 中文标点挤压与禁则</text>
      <g font-size="18" font-weight="700" text-anchor="middle">
        <rect x="34" y="54" width="38" height="38" fill="#F2E7D9"/><text x="53" y="80" fill="#291436">排</text>
        <rect x="76" y="54" width="38" height="38" fill="#F2E7D9"/><text x="95" y="80" fill="#291436">版</text>
        <rect x="118" y="54" width="22" height="38" fill="#FDBB10"/><text x="129" y="80" fill="#291436">」</text>
        <rect x="142" y="54" width="22" height="38" fill="#FDBB10"/><text x="153" y="80" fill="#291436">，</text>
        <rect x="168" y="54" width="38" height="38" fill="#F2E7D9"/><text x="187" y="80" fill="#291436">齐</text>
        <rect x="210" y="54" width="38" height="38" fill="#F2E7D9"/><text x="229" y="80" fill="#291436">边</text>
      </g>
      <text x="141" y="114" text-anchor="middle" font-size="11" font-weight="700" fill="#FDBB10">相邻标点各压半宽</text>
      <rect x="280" y="52" width="152" height="68" fill="#1B0C26" stroke="#6CE0AE" stroke-width="1.4"/>
      <text x="292" y="74" font-size="11" fill="#6CE0AE">text-align: justify;</text>
      <text x="292" y="92" font-size="11" fill="#F6EFE4">text-justify: inter-character;</text>
      <text x="292" y="110" font-size="11" fill="#FDBB10">hyphens: auto;</text>
      <text x="230" y="164" text-anchor="middle" font-size="11" fill="#D5C5DF">避免逗号句号掉到行首（行首禁则），优先从标点处吸收余白</text>
    `,
  },
};

function renderEra(key) {
  const e = ERAS[key] || ERAS.gutenberg;
  document.getElementById("era-svg").innerHTML = e.svg;
  document.getElementById("era-meta").textContent = e.meta;
  document.getElementById("era-title").textContent = e.title;
  document.getElementById("era-body").textContent = e.body;
  document.querySelectorAll(".era-btn").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".era-btn").forEach((b) => {
  b.addEventListener("click", () => renderEra(b.dataset.era));
});
renderEra("gutenberg");

// ============== 05 节：四场景真实版面诊断器 ==============
const CONTEXTS = {
  book: {
    kind: "yes",
    badge: "推荐使用",
    title: "长篇中文书页：稳重、安静、省眼力",
    bodyHtml: '每行 24–32 个汉字时，中文方块字配合标点挤压几乎不会起河。连续阅读几十分钟，整齐的左右边界像稳固的书框，常与 <a href="https://layout.xiaoxiaodong.ai/186/play/" target="_blank" rel="noopener">186 首行缩进</a> 搭档标清段落起点。',
    tip: "搭配要点：单栏宽度保持 18–34 汉字、行高 1.65–1.85 倍，末行自然左对齐。",
    svg: `
      <rect width="380" height="230" fill="#FAF5EC"/>
      <rect x="64" y="18" width="252" height="194" fill="#FFFFFF" stroke="#291436" stroke-width="2"/>
      <line x1="92" y1="36" x2="92" y2="196" stroke="#B58206" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line x1="288" y1="36" x2="288" y2="196" stroke="#B58206" stroke-width="1.2" stroke-dasharray="3 3"/>
      <g fill="#291436">
        <rect x="116" y="44" width="172" height="7"/><rect x="92" y="60" width="196" height="7"/>
        <rect x="92" y="76" width="196" height="7"/><rect x="92" y="92" width="196" height="7"/>
        <rect x="92" y="108" width="124" height="7" fill="#0F6844"/>
        <rect x="116" y="132" width="172" height="7"/><rect x="92" y="148" width="196" height="7"/>
        <rect x="92" y="164" width="196" height="7"/><rect x="92" y="180" width="150" height="7" fill="#0F6844"/>
      </g>
    `,
  },
  multicol: {
    kind: "yes",
    badge: "推荐使用（配基线网格）",
    title: "多栏报刊与年报：不用黑框线也能切出笔直栏沟",
    bodyHtml: '两栏或三栏并排时，左对齐参差的右缘会让栏沟显得歪斜；两端对齐把每栏塑成干脆的矩形，再配合 <a href="https://layout.xiaoxiaodong.ai/188/play/" target="_blank" rel="noopener">188 基线对齐</a>，整张跨页立刻呈现报刊级秩序。',
    tip: "注意：单栏变窄时须相应调小字号并开启断词挤压，守住每行至少 16–18 个汉字。",
    svg: `
      <rect width="380" height="230" fill="#FAF5EC"/>
      <rect x="20" y="18" width="340" height="194" fill="#FFFFFF" stroke="#291436" stroke-width="2"/>
      <rect x="128" y="28" width="14" height="174" fill="#FDBB10" opacity="0.35"/>
      <rect x="238" y="28" width="14" height="174" fill="#FDBB10" opacity="0.35"/>
      <g fill="#291436">
        <rect x="34" y="42" width="90" height="6"/><rect x="34" y="56" width="90" height="6"/><rect x="34" y="70" width="90" height="6"/>
        <rect x="34" y="84" width="90" height="6"/><rect x="34" y="98" width="90" height="6"/><rect x="34" y="112" width="90" height="6"/>
        <rect x="34" y="126" width="90" height="6"/><rect x="34" y="140" width="90" height="6"/><rect x="34" y="154" width="90" height="6"/>
        <rect x="34" y="168" width="54" height="6" fill="#0F6844"/>
        <rect x="146" y="42" width="88" height="6"/><rect x="146" y="56" width="88" height="6"/><rect x="146" y="70" width="88" height="6"/>
        <rect x="146" y="84" width="88" height="6"/><rect x="146" y="98" width="88" height="6"/><rect x="146" y="112" width="88" height="6"/>
        <rect x="146" y="126" width="88" height="6"/><rect x="146" y="140" width="88" height="6"/><rect x="146" y="154" width="88" height="6"/>
        <rect x="146" y="168" width="88" height="6"/>
        <rect x="256" y="42" width="90" height="6"/><rect x="256" y="56" width="90" height="6"/><rect x="256" y="70" width="90" height="6"/>
        <rect x="256" y="84" width="90" height="6"/><rect x="256" y="98" width="90" height="6"/><rect x="256" y="112" width="90" height="6"/>
        <rect x="256" y="126" width="90" height="6"/><rect x="256" y="140" width="90" height="6"/><rect x="256" y="154" width="60" height="6" fill="#0F6844"/>
      </g>
    `,
  },
  mobileCard: {
    kind: "no",
    badge: "不要使用",
    title: "手机窄栏卡片：一行十来个字必撕白色河流",
    bodyHtml: '在 390px 屏幕里的多列商品卡、资讯摘要或弹窗里，一行往往塞不下 14 个字，强开两端对齐会把中英数字撑得东倒西歪。此时请直接改用 <a href="https://layout.xiaoxiaodong.ai/176/play/" target="_blank" rel="noopener">176 左对齐右参差</a>，守住均匀字距远比硬凑右齐重要。',
    tip: "止损信号：只要一行装不下 15 个汉字或 35 个西文字符，立刻关掉两端对齐。",
    svg: `
      <rect width="380" height="230" fill="#FAF5EC"/>
      <rect x="115" y="16" width="150" height="198" rx="10" fill="#291436"/>
      <rect x="128" y="34" width="124" height="162" fill="#FBE9E7" stroke="#B82218" stroke-width="2"/>
      <path d="M188 52 L182 178" stroke="#B82218" stroke-width="14" opacity="0.26"/>
      <g fill="#291436">
        <rect x="138" y="54" width="38" height="8"/><rect x="206" y="54" width="36" height="8"/>
        <rect x="138" y="76" width="34" height="8"/><rect x="200" y="76" width="42" height="8"/>
        <rect x="138" y="98" width="40" height="8"/><rect x="204" y="98" width="38" height="8"/>
        <rect x="138" y="120" width="32" height="8"/><rect x="196" y="120" width="46" height="8"/>
        <rect x="138" y="142" width="44" height="8"/><rect x="208" y="142" width="34" height="8"/>
      </g>
      <text x="190" y="182" text-anchor="middle" font-size="11" font-weight="800" fill="#B82218">× 窄屏起河 · 改左对齐</text>
    `,
  },
  shortMeta: {
    kind: "no",
    badge: "不要使用",
    title: "短图注、数字列与无断词英文侧栏：各归其位",
    bodyHtml: '只有两三行的图注或短标题根本没有形成「文本矩形」的体量；数字与右注更适合 <a href="https://layout.xiaoxiaodong.ai/177/play/" target="_blank" rel="noopener">177 右对齐左参差</a>，仪式标题适合 <a href="https://layout.xiaoxiaodong.ai/178/play/" target="_blank" rel="noopener">178 居中排版</a>，极短横幅则属于 <a href="https://layout.xiaoxiaodong.ai/180/play/" target="_blank" rel="noopener">180 强制两端对齐</a>。',
    tip: "无障碍提示：英文网页在无断词支持下使用两端对齐，不均匀词距会干扰阅读障碍读者定位。",
    svg: `
      <rect width="380" height="230" fill="#FAF5EC"/>
      <rect x="24" y="24" width="154" height="182" fill="#FBE9E7" stroke="#B82218" stroke-width="2"/>
      <text x="101" y="48" text-anchor="middle" font-size="11" font-weight="800" fill="#B82218">× 硬拉三行短注</text>
      <g fill="#291436">
        <rect x="38" y="72" width="32" height="9"/><rect x="132" y="72" width="32" height="9"/>
        <rect x="38" y="100" width="24" height="9"/><rect x="118" y="100" width="46" height="9"/>
        <rect x="38" y="128" width="20" height="9"/><rect x="142" y="128" width="22" height="9"/>
      </g>
      <rect x="202" y="24" width="154" height="182" fill="#E6F4EE" stroke="#0F6844" stroke-width="2"/>
      <text x="279" y="48" text-anchor="middle" font-size="11" font-weight="800" fill="#0F6844">✓ 改用左/右/居中</text>
      <g fill="#291436">
        <rect x="218" y="72" width="92" height="9"/>
        <rect x="218" y="100" width="114" height="9"/>
        <rect x="218" y="128" width="76" height="9"/>
      </g>
    `,
  },
};

function renderContext(key) {
  const c = CONTEXTS[key] || CONTEXTS.book;
  document.getElementById("ctx-svg").innerHTML = c.svg;
  const badge = document.getElementById("ctx-badge");
  badge.textContent = c.badge;
  badge.dataset.kind = c.kind;
  document.getElementById("ctx-title").textContent = c.title;
  document.getElementById("ctx-body").innerHTML = c.bodyHtml;
  document.getElementById("ctx-tip").textContent = c.tip;
  document.querySelectorAll(".ctx-btn").forEach((b) => {
    const on = b.dataset.ctx === key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}
document.querySelectorAll(".ctx-btn").forEach((b) => {
  b.addEventListener("click", () => renderContext(b.dataset.ctx));
});
renderContext("book");

// ============== 06 节：四选一排样小练习（由同一排字引擎真实渲染） ==============
const QUIZ_CFG = {
  A: {
    // 唯一变量差异：栏宽过窄（~11–12字）→ 裂出明显空洞与白色河流
    colScale: 0.52,
    fontSize: 13.5,
    hyphenCompress: false,
    lastLineJustify: false,
    composer: "greedy",
    tag: "栏宽过窄 · 起河流",
    ok: false,
    verdict: "A 落进了「栏过窄」的坑：栏宽太窄、长英文术语一掉行，前面剩出的空隙立刻撑成白色河流，阅读节奏支离破碎。",
  },
  B: {
    // 唯一变量差异：末行强撑（滑向 180 强制两端对齐）
    colScale: 0.88,
    fontSize: 13.5,
    hyphenCompress: true,
    lastLineJustify: true,
    composer: "balanced",
    tag: "末行强撑（180）",
    ok: false,
    verdict: "B 的正文前几行其实和 C 完全一样干净，唯独坏在最后一行：只剩几个字的收尾被硬生生拉满整栏，已经越界滑向了 180「强制两端对齐」。",
  },
  C: {
    // 正确答案：栏宽合宜 + 断词挤压 + 段落均衡 + 末行自然左对齐
    colScale: 0.88,
    fontSize: 13.5,
    hyphenCompress: true,
    lastLineJustify: false,
    composer: "balanced",
    tag: "最稳 · 双边齐且均灰",
    ok: true,
    verdict: "选对了！C 把四个条件同时凑齐：栏宽合宜、断词与标点挤压开启、段落全局均衡，且正文末行自然左对齐——既有庄重的矩形轮廓，又没有任何刺眼的白河与裂缝。",
  },
  D: {
    // 唯一变量差异：未开断词与标点挤压 + 逐行贪心断行
    colScale: 0.88,
    fontSize: 13.5,
    hyphenCompress: false,
    lastLineJustify: false,
    composer: "greedy",
    tag: "未断词 + 贪心裂隙",
    ok: false,
    verdict: "D 的栏宽与末行收尾都和 C 一样，但关掉了西文断词与标点挤压、又用逐行贪心断行：长英文术语整块掉到下一行，把上一行扯出刺眼的空白裂口，整段灰阶断裂。",
  },
};

let quizPicked = null;

function renderQuizCard(letter) {
  const c = document.querySelector(`.quiz-canvas[data-quiz="${letter}"]`);
  if (!c) return;
  const rect = c.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return;
  const dpr = pixelRatio(2);
  const W = Math.round(rect.width);
  const H = Math.round(rect.height);
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const g = c.getContext("2d");
  const cfg = QUIZ_CFG[letter];

  const colW = Math.round(W * cfg.colScale);
  const padX = Math.round((W - colW) / 2);
  const fontSize = clamp(Math.round((W / 245) * cfg.fontSize * 10) / 10, 11.5, 14.5);
  const lineH = Math.round(fontSize * 1.72);
  const topY = 16;

  const layout = layoutParagraph({
    specimen: "quiz",
    columnRatio: cfg.colScale,
    fontSize,
    hyphenCompress: cfg.hyphenCompress,
    lastLineJustify: cfg.lastLineJustify,
    composer: cfg.composer,
    alignMode: "justify",
    xray: false,
  }, colW, measureTextCached);

  g.save();
  g.scale(dpr, dpr);
  g.fillStyle = "#FFFFFF";
  g.fillRect(0, 0, W, H);

  const maxLines = Math.floor((H - topY - (quizPicked ? 28 : 10)) / lineH);
  const showN = Math.min(layout.lines.length, maxLines);

  // 选完答案后，在全部 4 张卡上揭晓检尺与红绿病灶
  if (quizPicked) {
    g.save();
    g.setLineDash([3, 3]);
    g.strokeStyle = cfg.ok ? "#0F6844" : "#B58206";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(padX, 8);
    g.lineTo(padX, H - 26);
    g.moveTo(padX + colW, 8);
    g.lineTo(padX + colW, H - 26);
    g.stroke();
    g.restore();

    for (let li = 0; li < showN; li++) {
      const line = layout.lines[li];
      const y = topY + li * lineH;
      if (!cfg.ok) {
        for (const gap of line.gaps) {
          if (gap.isHole) {
            g.fillStyle = "rgba(184, 34, 24, 0.28)";
            g.fillRect(padX + gap.x, y, Math.max(3, gap.width), fontSize + 2);
          }
        }
        if (line.lastStretched) {
          g.fillStyle = "rgba(184, 34, 24, 0.22)";
          g.fillRect(padX, y - 1, colW, fontSize + 4);
          g.strokeStyle = "#B82218";
          g.lineWidth = 1.2;
          g.strokeRect(padX, y - 1, colW, fontSize + 4);
        }
      }
    }
  }

  g.font = `400 ${fontSize}px ${SPECIMENS.quiz.fontFamily}`;
  g.textBaseline = "top";
  g.fillStyle = "#1E1029";
  for (let li = 0; li < showN; li++) {
    const line = layout.lines[li];
    const y = topY + li * lineH;
    for (const it of line.items) {
      g.fillText(it.text, padX + it.x, y);
    }
  }

  // 揭晓底部批注条
  if (quizPicked) {
    g.fillStyle = cfg.ok ? "#0F6844" : "#B82218";
    g.fillRect(0, H - 24, W, 24);
    g.fillStyle = "#FFFFFF";
    g.font = '700 11px "Noto Sans SC", "IBM Plex Sans", sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(cfg.tag, W / 2, H - 12);
  }
  g.restore();
}

function renderAllQuizzes() {
  ["A", "B", "C", "D"].forEach(renderQuizCard);
}

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const choice = card.dataset.choice;
    quizPicked = choice;
    const cfg = QUIZ_CFG[choice];
    document.querySelectorAll(".quiz-card").forEach((c) => {
      const letter = c.dataset.choice;
      c.setAttribute("aria-pressed", String(letter === choice));
      c.classList.toggle("is-picked", letter === choice);
      c.classList.toggle("is-correct", QUIZ_CFG[letter].ok);
      c.classList.toggle("is-wrong", letter === choice && !QUIZ_CFG[letter].ok);
    });
    document.getElementById("qv-title").textContent = cfg.ok
      ? `答案 ${choice} · 判断准确`
      : `你选了 ${choice} · 最稳的是 C`;
    document.getElementById("qv-body").textContent = cfg.verdict;
    renderAllQuizzes();
  });
});

// ============== 07 节：原海报放大灯箱（支持拖拽平移 + Esc 关闭） ==============
const posterBtn = document.getElementById("poster-btn");
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbClose = document.getElementById("lb-close");

let lbPan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0, moved: false };

function openLightbox() {
  lbImg.src = posterImg.src;
  lbPan = { x: 0, y: 0, dragging: false, sx: 0, sy: 0, moved: false };
  lbImg.style.transform = "translate(0px, 0px) scale(1.12)";
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}
function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbStage.addEventListener("mousedown", (e) => {
  lbPan.dragging = true;
  lbPan.moved = false;
  lbPan.sx = e.clientX - lbPan.x;
  lbPan.sy = e.clientY - lbPan.y;
});
window.addEventListener("mousemove", (e) => {
  if (!lbPan.dragging) return;
  lbPan.x = e.clientX - lbPan.sx;
  lbPan.y = e.clientY - lbPan.sy;
  lbPan.moved = true;
  lbImg.style.transform = `translate(${lbPan.x}px, ${lbPan.y}px) scale(1.12)`;
});
window.addEventListener("mouseup", () => {
  if (!lbPan.dragging) return;
  const moved = lbPan.moved;
  lbPan.dragging = false;
  if (!moved) closeLightbox();
});

// ============== 响应窗口尺寸变化 ==============
let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeHeroCanvas();
    requestUpdate(true);
    renderRiverLab();
    renderAllQuizzes();
  }, 60);
});

// 初次渲染全部画布
resizeHeroCanvas();
requestUpdate(true);
renderRiverLab();
renderAllQuizzes();
