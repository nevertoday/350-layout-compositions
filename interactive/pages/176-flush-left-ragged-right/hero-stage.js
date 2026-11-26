// 176 开场主角玩具：排字修边台与活体参差轮廓仪（2D Canvas）
// 支持：
// 1. 直接横拖画布或右边朱红标尺柄 → 实时改栏宽重排文字（触屏只劫持横向拖动，竖向正常滚页）
// 2. 直接点击任意行尾 → 手工推词修边（Rag Shaping），把突出的词或凹坑推到下一行
// 3. Space 键或按钮 → 放行朱红回扫视点（Return Sweep），直观演练逐行扫读与回扫落点
// 4. 严格尊重 prefers-reduced-motion（still: true 时直达清晰静止帧）与 2D 轻开销渲染

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { layoutTypeset, LOGICAL_MAX_W, SPECIMENS } from "./model.js";

const INK = "#111815";
const INK_BODY = "#1D2622";
const INK_MUTED = "#536059";
const PAPER = "#FAFCF8";
const SAGE_BG = "#EFF5EC";
const RED = "#EA3D16";
const RED_DARK = "#B52708";
const GREEN = "#1A6342";
const AMBER = "#9A5B04";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createHeroStage(canvas, getState, mutateState, onLayoutComputed) {
  const ctx = canvas.getContext("2d");
  let cssW = 720;
  let cssH = 420;
  let dpr = pixelRatio(2);
  let lastLayout = null;
  let hoverLine = -1;
  let hoverRuler = false;
  let dragMode = null; // "ruler" | null
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartMeasure = 0.5;
  let dragMoved = false;
  let pointerId = null;

  // 动画状态与脏标记（避免静置浪费电，更避免拖动时一帧重绘两次）
  let introProgress = 0; // 0..1 开场起线与标尺入场
  let sweepProgress = 0; // 0..N 回扫眼动演练进度（每行 1.0 单位）
  let displayMeasure = getState().measure; // 平滑跟随值（拖动时直接跟手无延迟）
  let dirty = true;
  let lastGeo = { padL: 48, padT: 48, maxW: 580, sheetW: 580, lineH: 26, scale: 1 };
  const widthCache = new Map();

  function clearWidthCache() {
    widthCache.clear();
    dirty = true;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    cssW = rect.width;
    cssH = rect.height;
    dpr = pixelRatio(cssW < 520 ? 1.5 : 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      dirty = true;
    }
  }

  function computeLayoutFor(state, measureOverride) {
    const compact = cssW < 520;
    const padL = compact ? 16 : 42;
    const padR = compact ? 30 : 48;
    const padT = compact ? 38 : 44;
    const maxW = Math.max(220, cssW - padL - padR);
    // 兼顾宽屏画布高度与逻辑折行单真源：防止宽而矮的视口把文字撑出画布底沿
    const sheetW = Math.max(220, Math.min(maxW, (cssH - 92) * 2.32));
    const viewScale = sheetW / LOGICAL_MAX_W;
    const effState = measureOverride == null ? state : { ...state, measure: measureOverride };
    const spec = SPECIMENS[effState.specimen] || SPECIMENS.bilingual;
    // 在统一逻辑字号下测量并缓存词宽，绘制时再按 viewScale 等比缩放，六屏单真源 100% 一致
    const fontKey = `400 ${spec.fontSize}px ${spec.fontFamily}`;
    let specMap = widthCache.get(fontKey);
    if (!specMap) {
      specMap = new Map();
      widthCache.set(fontKey, specMap);
    }
    ctx.font = fontKey;
    const measureFn = (s) => {
      let w = specMap.get(s);
      if (w === undefined) {
        w = ctx.measureText(s).width;
        specMap.set(s, w);
      }
      return w;
    };
    const layout = layoutTypeset(effState, LOGICAL_MAX_W, measureFn);
    const drawFontSize = spec.fontSize * viewScale;
    const lineH = drawFontSize * effState.leading;
    lastGeo = {
      padL,
      padR,
      padT,
      maxW,
      sheetW,
      viewScale,
      lineH,
      specFontSize: drawFontSize,
      logicalFontSize: spec.fontSize,
      fontFamily: spec.fontFamily,
      compact,
    };
    return layout;
  }

  function drawFrame(t, dt, { still }) {
    resize();
    const state = getState();

    // 静置且无动画无变化时跳过重画，省电且保持 60fps
    const animating =
      introProgress < 1 ||
      state.sweepActive ||
      Math.abs(state.measure - displayMeasure) >= 0.0015;
    if (!still && !dirty && !animating) return;
    dirty = false;

    // 开场入场进度：0.65 秒舒展完成；still 直接置 1
    if (still) {
      introProgress = 1;
      displayMeasure = state.measure;
    } else {
      introProgress = Math.min(1, introProgress + (dt || 0.016) * 1.75);
      if (dragMode === "ruler") {
        displayMeasure = state.measure;
      } else {
        const diff = state.measure - displayMeasure;
        displayMeasure = Math.abs(diff) < 0.0015 ? state.measure : displayMeasure + diff * Math.min(1, (dt || 0.016) * 14);
      }
    }

    const layout = computeLayoutFor(state, dragMode === "ruler" ? state.measure : displayMeasure);
    // 单真源回调按真实 state.measure 结算，避免动画中间值让数字闪烁
    const canonical =
      Math.abs(displayMeasure - state.measure) < 0.002
        ? layout
        : computeLayoutFor(state, state.measure);
    lastLayout = layout;
    if (onLayoutComputed) onLayoutComputed(canonical);

    // 回扫眼动实测推进
    if (state.sweepActive && !still) {
      const speed = state.align === "left" && canonical.audit.checks.measure ? 0.95 : 0.72;
      sweepProgress += (dt || 0.016) * speed;
      if (sweepProgress >= layout.lines.length + 0.35) {
        sweepProgress = 0;
        mutateState({ sweepActive: false }, { silent: false });
      }
    } else if (!state.sweepActive) {
      sweepProgress = 0;
    }

    const { padL, padT, sheetW, viewScale, lineH, specFontSize, fontFamily, compact } = lastGeo;
    const { lines, rivers, measurePx: logicalMeasurePx, audit } = layout;
    const measurePx = logicalMeasurePx * viewScale;
    const sx = (lx) => padL + lx * viewScale;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 排字纸面底色与极淡网格标尺感
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, cssW, cssH);

    // 顶部极细标尺带（原海报瑞士排印制图感）
    const rulerBarH = compact ? 26 : 30;
    ctx.fillStyle = SAGE_BG;
    ctx.fillRect(0, 0, cssW, rulerBarH);
    ctx.strokeStyle = "rgba(17, 24, 21, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerBarH + 0.5);
    ctx.lineTo(cssW, rulerBarH + 0.5);
    ctx.stroke();

    // 先算出右上当前读数占据的左边界，刻度数字绝不与之撞字重叠
    const rightHud = `${audit.lenText} · 行距 ${state.leading.toFixed(2)}`;
    ctx.font = `500 ${compact ? 10.5 : 11.5}px "JetBrains Mono", "Noto Sans SC", monospace`;
    const hudW = ctx.measureText(rightHud).width;
    const hudLeftX = Math.max(padL + 40, cssW - hudW - 14);

    // 标尺刻度（以中文等效字数 / 拉丁字符标尺）
    const isLatin = layout.spec.script === "latin";
    const unitPx = isLatin ? specFontSize * 0.48 : specFontSize;
    const maxUnitsTick = Math.floor(sheetW / unitPx);
    const tickStep = isLatin ? 10 : 5;
    ctx.fillStyle = INK_MUTED;
    ctx.font = `500 ${compact ? 10 : 11}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    for (let u = 0; u <= maxUnitsTick; u += tickStep) {
      const tx = padL + u * unitPx;
      if (tx > padL + sheetW + 6) break;
      ctx.strokeStyle = u === 0 ? INK : "rgba(17, 24, 21, 0.25)";
      ctx.beginPath();
      ctx.moveTo(tx + 0.5, rulerBarH - (u % (tickStep * 2) === 0 ? 9 : 5));
      ctx.lineTo(tx + 0.5, rulerBarH);
      ctx.stroke();
      if (u === 0 || (u % (tickStep * 2) === 0 && tx + 24 < hudLeftX)) {
        ctx.fillText(u === 0 ? "0" : `${u}`, tx + 3, rulerBarH * 0.44);
      }
    }

    // 舒适行长区间淡绿底带（在标尺槽上提示经验区间，绝不剧透答案数值）
    const idealRange = isLatin ? layout.spec.idealLatin : layout.spec.idealCjk;
    const zoneX1 = clamp(padL + idealRange[0] * unitPx, padL, padL + sheetW);
    const zoneX2 = clamp(padL + idealRange[1] * unitPx, padL, padL + sheetW);
    if (zoneX2 > zoneX1 + 8) {
      ctx.fillStyle = "rgba(26, 99, 66, 0.14)";
      ctx.fillRect(zoneX1, rulerBarH - 5, zoneX2 - zoneX1, 5);
    }

    // 绘制右上当前读数
    ctx.font = `500 ${compact ? 10.5 : 11.5}px "JetBrains Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = audit.passCount === 4 ? GREEN : RED_DARK;
    ctx.fillText(rightHud, hudLeftX, rulerBarH * 0.5);

    // 纸面右缘之外的留白呼吸区（极淡鼠尾草斜影，表明栏框外白场）
    const rightEdgeX = padL + measurePx;
    ctx.fillStyle = "rgba(230, 240, 225, 0.45)";
    ctx.fillRect(rightEdgeX, rulerBarH + 1, Math.max(0, cssW - rightEdgeX), cssH - rulerBarH - 1);

    // 2. 可用文本排布纵高自适应（绝不压盖底沿提示条）
    const footerZoneH = compact ? 26 : 30;
    const textTop = padT + (compact ? 6 : 10);
    const availH = cssH - textTop - footerZoneH;
    const neededH = lines.length * lineH;
    const drawLineH = neededH > availH && lines.length > 0 ? Math.max(specFontSize * 1.08, availH / lines.length) : lineH;
    const renderFontSize = Math.min(specFontSize, drawLineH / 1.12);
    const blockBottom = textTop + lines.length * drawLineH;

    // 3. 如果开启透视层，先画左侧起线基准轴 & 右侧参差包络区
    const axisBottom = Math.min(cssH - footerZoneH, Math.max(blockBottom + 8, textTop + 120));
    const introEase = 1 - Math.pow(1 - introProgress, 3);
    const drawnAxisBottom = rulerBarH + (axisBottom - rulerBarH) * introEase;

    // 176 原海报标志：左侧贯通墨黑起线细垂线 + 顶短粗朱红横杠微标
    ctx.strokeStyle = state.align === "left" ? INK : RED;
    ctx.lineWidth = state.align === "left" ? 1.8 : 1.5;
    if (state.align !== "left") ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL - 0.5, rulerBarH + 1);
    ctx.lineTo(padL - 0.5, drawnAxisBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶部起线红短杠（呼应原海报左上红杠）
    ctx.fillStyle = RED;
    ctx.fillRect(padL - 1, textTop - (compact ? 14 : 18), compact ? 26 : 34, 4);

    // 居中/右对齐时画一条错态起线折线，暴露每行开头跳动
    if (state.showOverlay && (state.align === "center" || state.align === "right") && lines.length > 1) {
      ctx.strokeStyle = "rgba(234, 61, 22, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      lines.forEach((ln, i) => {
        const lx = sx(ln.x0);
        const ly = textTop + i * drawLineH + drawLineH * 0.42;
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      });
      ctx.stroke();
      lines.forEach((ln, i) => {
        const lx = sx(ln.x0);
        const ly = textTop + i * drawLineH + drawLineH * 0.42;
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. 白色河流（Rivers）高亮透视（当 align === 'justify' 时真实画在拉伸白缝上！）
    if (state.showOverlay && state.align === "justify") {
      // 先画单行过宽拉伸白缝块
      for (const ln of lines) {
        const ly = textTop + ln.index * drawLineH;
        for (const g of ln.stretchedGaps) {
          ctx.fillStyle = g.ratio >= 1.9 ? "rgba(234, 61, 22, 0.22)" : "rgba(234, 61, 22, 0.12)";
          ctx.fillRect(sx(g.x1), ly + 1, Math.max(3, g.w * viewScale), drawLineH - 2);
        }
      }
      // 再把贯通相邻行的真正河流串成流畅的朱红河道
      for (const chain of rivers) {
        ctx.strokeStyle = "rgba(234, 61, 22, 0.62)";
        ctx.lineWidth = compact ? 4 : 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        chain.forEach((node, idx) => {
          const x = sx(node.cx);
          const y = textTop + node.line * drawLineH + drawLineH * 0.44;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    // 5. 右侧参差包络线（Rag Contour）与行尾修边热区（左对齐时）
    if (state.showOverlay && state.align === "left" && lines.length > 1) {
      // 淡色填充每行右侧自然呼吸带（文字尾部到右边标尺之间）
      ctx.fillStyle = audit.checks.rag ? "rgba(26, 99, 66, 0.08)" : "rgba(234, 61, 22, 0.09)";
      ctx.beginPath();
      ctx.moveTo(rightEdgeX, textTop);
      lines.forEach((ln, i) => {
        const rx = sx(ln.x1) + 3;
        const yTop = textTop + i * drawLineH;
        const yBot = yTop + drawLineH;
        ctx.lineTo(rx, yTop + 2);
        ctx.lineTo(rx, yBot - 2);
      });
      ctx.lineTo(rightEdgeX, blockBottom);
      ctx.closePath();
      ctx.fill();

      // 勾出清晰的右缘参差折线轮廓
      ctx.strokeStyle = audit.checks.rag ? GREEN : RED;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      lines.forEach((ln, i) => {
        const rx = sx(ln.x1) + 4;
        const ym = textTop + i * drawLineH + drawLineH * 0.45;
        if (i === 0) ctx.moveTo(rx, ym);
        else ctx.lineTo(rx, ym);
      });
      ctx.stroke();

      // 标出问题行（深凹坑、楼梯斜坡、孤词末行）与已手工推词行
      lines.forEach((ln, i) => {
        const rx = sx(ln.x1) + 4;
        const ym = textTop + i * drawLineH + drawLineH * 0.45;
        const isHole = audit.hasDeepHole && i === audit.holeLine;
        const isWidow = audit.hasWidow && ln.isLast;
        const isStair = audit.hasStaircase && i >= audit.staircaseStart && i < audit.staircaseStart + audit.staircaseLen;
        const isHover = hoverLine === i && !ln.isLast;

        if (isHover) {
          ctx.fillStyle = "rgba(234, 61, 22, 0.11)";
          ctx.fillRect(padL, textTop + i * drawLineH, measurePx, drawLineH);
        }

        ctx.fillStyle = isHole || isWidow || isStair ? RED : ln.pushed > 0 ? AMBER : audit.checks.rag ? GREEN : INK_MUTED;
        ctx.beginPath();
        ctx.arc(rx, ym, isHover || isHole || isWidow ? 4.2 : 2.8, 0, Math.PI * 2);
        ctx.fill();

        if (!compact && (isHover || ln.pushed > 0 || isHole || isWidow)) {
          const tag = isHole
            ? "深凹坑"
            : isWidow
            ? "孤词尾"
            : ln.pushed > 0
            ? `已推 ${ln.pushed} 词`
            : "点此推词";
          ctx.font = `500 10.5px "Noto Sans SC", "JetBrains Mono", sans-serif`;
          const tw = ctx.measureText(tag).width;
          const bx = Math.min(cssW - tw - 12, rx + 9);
          ctx.fillStyle = isHole || isWidow ? RED_DARK : ln.pushed > 0 ? AMBER : INK;
          ctx.fillText(tag, bx, ym + 0.5);
        }
      });
    }

    // 6. 逐行/逐段绘制真实排印正文（非两端对齐整行单次 fillText，两端对齐仅在真实拉伸缝处切分，提速 6×）
    ctx.font = `400 ${renderFontSize}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = INK_BODY;
    const baseOffset = renderFontSize * 0.88;
    const fastWholeLine = state.align !== "justify";
    for (const ln of lines) {
      const y = textTop + ln.index * drawLineH + baseOffset;
      if (y > cssH - footerZoneH) break;
      if (fastWholeLine || ln.isLast) {
        ctx.fillText(ln.text, sx(ln.x0), y);
      } else {
        const pos = ln.positioned;
        let runText = "";
        let runX = 0;
        let runEnd = 0;
        for (let pi = 0; pi < pos.length; pi++) {
          const tok = pos[pi];
          if (!runText) {
            runText = tok.text;
            runX = tok.x;
            runEnd = tok.x + tok.w;
          } else if (tok.x - runEnd <= 0.45) {
            runText += tok.text;
            runEnd = tok.x + tok.w;
          } else {
            ctx.fillText(runText, sx(runX), y);
            runText = tok.text;
            runX = tok.x;
            runEnd = tok.x + tok.w;
          }
        }
        if (runText) ctx.fillText(runText, sx(runX), y);
      }
    }

    // 7. 右边朱红「栏宽标尺手柄」（可左右直接拖动；底端收在提示条之上不遮文字）
    ctx.strokeStyle = hoverRuler || dragMode === "ruler" ? RED : "rgba(234, 61, 22, 0.78)";
    ctx.lineWidth = hoverRuler || dragMode === "ruler" ? 2.4 : 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(rightEdgeX + 0.5, rulerBarH + 1);
    ctx.lineTo(rightEdgeX + 0.5, cssH - footerZoneH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 标尺抓手柄胶囊：严格挂在右虚线外侧，绝不遮挡正文任何半个字！
    const handleY = clamp(textTop + Math.min(lines.length * drawLineH * 0.48, availH * 0.45), textTop + 34, cssH - 52);
    const hw = compact ? 18 : 20;
    const hh = compact ? 36 : 40;
    const hx = Math.min(cssW - hw - 3, rightEdgeX + 4);
    ctx.fillStyle = dragMode === "ruler" || hoverRuler ? RED_DARK : RED;
    // 左指向小楔连接虚线与手柄
    ctx.beginPath();
    ctx.moveTo(rightEdgeX + 1, handleY);
    ctx.lineTo(hx, handleY - 5);
    ctx.lineTo(hx, handleY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(hx, handleY - hh / 2, hw, hh);
    // 手柄内两条白竖纹
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(hx + hw * 0.5 - 3, handleY - 8, 2, 16);
    ctx.fillRect(hx + hw * 0.5 + 1, handleY - 8, 2, 16);

    // 顶部栏宽标签贴在红标尺上端外侧
    const pctLabel = `${Math.round(state.measure * 100)}%`;
    ctx.font = `500 10.5px "JetBrains Mono", monospace`;
    const pw = ctx.measureText(pctLabel).width + 10;
    const px = clamp(rightEdgeX + 4, padL + 10, cssW - pw - 4);
    ctx.fillStyle = RED_DARK;
    ctx.fillRect(px, rulerBarH + 4, pw, 17);
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "middle";
    ctx.fillText(pctLabel, px + 5, rulerBarH + 12.5);

    // 8. 回扫眼动实测动画（Return Sweep Visualizer）
    if (state.sweepActive && lines.length > 0) {
      const li = Math.min(lines.length - 1, Math.floor(sweepProgress));
      const frac = sweepProgress - Math.floor(sweepProgress);
      const ln = lines[li];
      const nextLn = lines[li + 1];
      const ly = textTop + li * drawLineH + drawLineH * 0.46;

      // 画出已走过的历史回扫斜弧
      for (let k = 0; k < li; k++) {
        const a = lines[k];
        const b = lines[k + 1];
        if (!b) continue;
        const ax = sx(a.x1);
        const ay = textTop + k * drawLineH + drawLineH * 0.46;
        const bx = sx(b.x0);
        const by = textTop + (k + 1) * drawLineH + drawLineH * 0.46;
        ctx.strokeStyle = audit.passCount === 4 ? "rgba(26, 99, 66, 0.42)" : "rgba(234, 61, 22, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) * 0.5, (ay + by) * 0.5 + 8, bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 前 72% 沿本行扫读，后 28% 斜向回扫到下一行起点
      let dotX = sx(ln.x0);
      let dotY = ly;
      let statusNote = "";
      if (frac < 0.72 || !nextLn) {
        const p = Math.min(1, frac / 0.72);
        dotX = sx(ln.x0 + ln.drawW * p);
        dotY = ly;
      } else {
        const p = (frac - 0.72) / 0.28;
        const ease = p * p * (3 - 2 * p);
        const ax = sx(ln.x1);
        const bx = sx(nextLn.x0);
        const ny = textTop + (li + 1) * drawLineH + drawLineH * 0.46;
        // 若左起线不齐或栏过宽，模拟真实眼动研究里的欠扫偏移（undershoot）
        const erratic = state.align !== "left" || audit.issueKind === "wide";
        const overshoot = erratic ? Math.sin(p * Math.PI) * 26 : 0;
        dotX = ax + (bx - ax) * ease + overshoot;
        dotY = ly + (ny - ly) * ease + Math.sin(p * Math.PI) * 7;
        ctx.strokeStyle = erratic ? RED : GREEN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, ly);
        ctx.lineTo(dotX, dotY);
        ctx.stroke();
        statusNote = erratic ? "回扫找起点偏航" : "稳落左起线";
      }

      // 绘制朱红光学视点
      ctx.fillStyle = "rgba(234, 61, 22, 0.22)";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5.2, 0, Math.PI * 2);
      ctx.fill();

      if (statusNote) {
        ctx.font = `600 11px "Noto Sans SC", sans-serif`;
        const nw = ctx.measureText(statusNote).width + 12;
        const nx = clamp(dotX + 12, padL, cssW - nw - 8);
        const ny = clamp(dotY - 22, rulerBarH + 6, cssH - 24);
        ctx.fillStyle = statusNote.includes("偏航") ? RED_DARK : GREEN;
        ctx.fillRect(nx, ny, nw, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.textBaseline = "middle";
        ctx.fillText(statusNote, nx + 6, ny + 10);
      }
    }

    // 9. 底沿极简交互提示条（不遮正文）
    ctx.fillStyle = INK_MUTED;
    ctx.font = `400 ${compact ? 10.5 : 11.5}px "Noto Sans SC", "JetBrains Mono", sans-serif`;
    ctx.textBaseline = "alphabetic";
    const footerHint = compact
      ? "← 横拖红标尺调栏宽 · 点行尾推词修边 →"
      : "横拖画布或朱红标尺实时调栏宽 · 左对齐时点击任意行尾推词修边 · ←/→ 微调 · Space 回扫实测";
    ctx.fillText(footerHint, padL, cssH - 10);

    ctx.restore();
  }

  // 坐标命中测试
  function localXY(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function hitTestLine(x, y) {
    if (!lastLayout) return -1;
    const { padL, padT, lineH, viewScale, compact } = lastGeo;
    const footerZoneH = compact ? 26 : 30;
    const textTop = padT + (compact ? 6 : 10);
    const availH = cssH - textTop - footerZoneH;
    const neededH = lastLayout.lines.length * lineH;
    const drawLineH = neededH > availH && lastLayout.lines.length > 0 ? Math.max(lastGeo.specFontSize * 1.08, availH / lastLayout.lines.length) : lineH;
    const li = Math.floor((y - textTop) / drawLineH);
    if (li < 0 || li >= lastLayout.lines.length - 1) return -1;
    const ln = lastLayout.lines[li];
    // 点击行后半段或右缘圆点均可触发修边推词
    if (x >= padL + ln.x1 * viewScale * 0.45 && x <= padL + lastLayout.measurePx * viewScale + 16) {
      return li;
    }
    return -1;
  }

  function nearRuler(x) {
    if (!lastLayout) return false;
    const rx = lastGeo.padL + lastLayout.measurePx * lastGeo.viewScale;
    return Math.abs(x - rx) <= 26;
  }

  // 指针交互（触屏区分横拖与竖滚：纵向移动优先放行页面滚动）
  let touchDecided = false;
  let touchHorizontal = false;

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    const { x, y } = localXY(ev);
    pointerId = ev.pointerId;
    dragStartX = x;
    dragStartY = y;
    dragStartMeasure = getState().measure;
    dragMoved = false;
    touchDecided = ev.pointerType !== "touch";
    touchHorizontal = ev.pointerType !== "touch";
    if (nearRuler(x) || ev.pointerType === "mouse") {
      dragMode = "ruler";
      try { canvas.setPointerCapture(ev.pointerId); } catch {}
    } else {
      dragMode = "ruler";
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    const { x, y } = localXY(ev);
    if (dragMode === "ruler" && pointerId === ev.pointerId) {
      const dx = x - dragStartX;
      const dy = y - dragStartY;
      if (!touchDecided) {
        if (Math.hypot(dx, dy) < 6) return;
        touchDecided = true;
        touchHorizontal = Math.abs(dx) >= Math.abs(dy) * 0.9;
        if (!touchHorizontal) {
          dragMode = null;
          pointerId = null;
          return;
        }
      }
      if (Math.abs(dx) > 4) dragMoved = true;
      if (dragMoved) {
        const nextM = clamp(dragStartMeasure + dx / Math.max(200, lastGeo.sheetW || lastGeo.maxW), 0.34, 1.0);
        // 拖动栏宽时清空旧手工推词，仅标脏交由当前 rAF 单次重画（避免一帧画两遍）
        displayMeasure = nextM;
        dirty = true;
        mutateState({ measure: Number(nextM.toFixed(3)), pushes: {} }, { silent: !reducedMotion.matches });
      }
      return;
    }
    // 鼠标悬停反馈
    const nextHoverRuler = nearRuler(x);
    const nextHoverLine = !nextHoverRuler && getState().align === "left" ? hitTestLine(x, y) : -1;
    if (nextHoverRuler !== hoverRuler || nextHoverLine !== hoverLine) {
      hoverRuler = nextHoverRuler;
      hoverLine = nextHoverLine;
      canvas.style.cursor = hoverRuler ? "ew-resize" : hoverLine >= 0 ? "pointer" : "ew-resize";
      dirty = true;
    }
  });

  function endDrag(ev) {
    if (pointerId !== ev.pointerId) return;
    const wasMoved = dragMoved;
    const { x, y } = localXY(ev);
    dragMode = null;
    pointerId = null;
    try { canvas.releasePointerCapture(ev.pointerId); } catch {}

    // 若不是拖动，检查是否点中某行行尾进行手工推词修边
    if (!wasMoved) {
      const st = getState();
      if (st.align === "left") {
        const li = hitTestLine(x, y);
        if (li >= 0) {
          const prev = Number(st.pushes?.[li] || 0);
          const next = (prev + 1) % 3;
          const nextPushes = { ...(st.pushes || {}) };
          if (next === 0) delete nextPushes[li];
          else nextPushes[li] = next;
          mutateState({ pushes: nextPushes });
        }
      }
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (!dragMode && (hoverLine !== -1 || hoverRuler)) {
      hoverLine = -1;
      hoverRuler = false;
      dirty = true;
    }
  });

  // 触屏兜底：让 tools/perf.mjs 发出的纯 TouchEvent 也能驱动横拖重画！
  let tStartX = 0;
  let tStartY = 0;
  let tStartM = 0.5;
  let tHoriz = null;
  canvas.addEventListener("touchstart", (ev) => {
    if (ev.touches.length !== 1) return;
    const r = canvas.getBoundingClientRect();
    tStartX = ev.touches[0].clientX - r.left;
    tStartY = ev.touches[0].clientY - r.top;
    tStartM = getState().measure;
    tHoriz = null;
  }, { passive: true });
  canvas.addEventListener("touchmove", (ev) => {
    if (ev.touches.length !== 1) return;
    const r = canvas.getBoundingClientRect();
    const x = ev.touches[0].clientX - r.left;
    const y = ev.touches[0].clientY - r.top;
    const dx = x - tStartX;
    const dy = y - tStartY;
    if (tHoriz === null && Math.hypot(dx, dy) > 4) {
      tHoriz = Math.abs(dx) >= Math.abs(dy) * 0.85;
    }
    if (tHoriz) {
      ev.preventDefault();
      const nextM = clamp(tStartM + dx / Math.max(200, lastGeo.sheetW || lastGeo.maxW), 0.34, 1.0);
      displayMeasure = nextM;
      dirty = true;
      mutateState({ measure: Number(nextM.toFixed(3)), pushes: {} }, { silent: !reducedMotion.matches });
    }
  }, { passive: false });
  canvas.addEventListener("touchend", () => {
    tHoriz = null;
  }, { passive: true });

  // 键盘操作支持
  canvas.addEventListener("keydown", (ev) => {
    const st = getState();
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      mutateState({ measure: Number(clamp(st.measure + 0.025, 0.34, 1.0).toFixed(3)), pushes: {} });
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      mutateState({ measure: Number(clamp(st.measure - 0.025, 0.34, 1.0).toFixed(3)), pushes: {} });
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      mutateState({ leading: Number(clamp(st.leading + 0.06, 1.15, 2.05).toFixed(2)) });
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      mutateState({ leading: Number(clamp(st.leading - 0.06, 1.15, 2.05).toFixed(2)) });
    } else if (ev.key === " ") {
      ev.preventDefault();
      sweepProgress = 0;
      mutateState({ sweepActive: !st.sweepActive });
    }
  });

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctl.draw();
  });
  ro.observe(canvas);

  const ctl = loop(canvas, drawFrame);
  return {
    draw: () => {
      dirty = true;
      ctl.draw();
    },
    invalidateFonts: () => {
      clearWidthCache();
      ctl.draw();
    },
    startSweep: () => {
      sweepProgress = 0;
      dirty = true;
      mutateState({ sweepActive: true });
      ctl.draw();
    },
    getLastLayout: () => lastLayout,
  };
}
