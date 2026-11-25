// 193 水平文字排版 · 开场活体「横排眼动校样台」
// 直接在暖米校样纸面左右拖动（data-perf-drag）伸缩行长，实时重排文字并模拟人眼不对称预视窗与行尾回扫。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  SCRIPTS,
  computeLayout,
  evaluate,
  initialState,
} from "./model.js";

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = initialState("zh");
  // 平滑显示值（拖动或键盘即时同步，按钮切换柔和过渡）
  let animMeasure = state.measure;
  let animLeading = state.leading;
  let gazeTime = 0.65; // 开场即停在有代表性的扫视位置，确保 0.9 秒首屏截图与静止帧都信息饱满
  let dragging = false;
  let dragStartX = 0;
  let dragStartMeasure = state.measure;
  let lastLayout = computeLayout(state);
  let lastEval = evaluate(state, lastLayout);
  let lastGeom = null; // 最近一帧绘制时的画布坐标缓存，用于精准点击选行与拖动映射

  // DOM 句柄
  const dom = {
    stamp: document.getElementById("hero-stamp"),
    vTag: document.getElementById("v-tag"),
    vTitle: document.getElementById("v-title"),
    vReason: document.getElementById("v-reason"),
    vHint: document.getElementById("v-hint"),
    mMeasure: document.getElementById("m-measure"),
    mAngle: document.getElementById("m-angle"),
    mLeading: document.getElementById("m-leading"),
    mJitter: document.getElementById("m-jitter"),
    sheetHead: document.getElementById("sheet-head-zh"),
    sheetSub: document.getElementById("sheet-head-en"),
    sheetArrow: document.getElementById("sheet-arrow-shaft"),
    kwBar: document.getElementById("hero-kw-bar"),
    verdictBox: document.getElementById("hero-verdict"),
    measureVal: document.getElementById("ctrl-measure-val"),
    leadingSlider: document.getElementById("ctrl-leading"),
    leadingVal: document.getElementById("ctrl-leading-val"),
    gazeToggle: document.getElementById("ctrl-gaze"),
    resetBtn: document.getElementById("ctrl-reset"),
    scriptBtns: [...document.querySelectorAll("[data-script]")],
    alignBtns: [...document.querySelectorAll("[data-align]")],
    paraBtns: [...document.querySelectorAll("[data-para]")],
    measureStepBtns: [...document.querySelectorAll("[data-mstep]")],
  };

  function syncUI() {
    lastLayout = computeLayout(state);
    lastEval = evaluate(state, lastLayout);
    const { cfg } = lastLayout;
    const ev = lastEval;

    if (dom.stamp) {
      dom.stamp.textContent =
        ev.passCount === 4 ? "4 / 4 流畅成流" : `${ev.passCount} / 4 待校错版`;
      dom.stamp.dataset.ok = ev.passCount === 4 ? "1" : "0";
    }
    if (dom.verdictBox) {
      dom.verdictBox.dataset.state = ev.severity;
    }
    if (dom.vTag) dom.vTag.textContent = ev.tag;
    if (dom.vTitle) dom.vTitle.textContent = ev.title;
    if (dom.vReason) dom.vReason.textContent = ev.reason;
    if (dom.vHint) dom.vHint.textContent = ev.hint;

    if (dom.mMeasure) {
      dom.mMeasure.textContent = `${Math.round(ev.meanUnits)} ${cfg.unit}`;
    }
    if (dom.mAngle) {
      dom.mAngle.textContent = `${ev.returnSweepDeg.toFixed(1)}°`;
    }
    if (dom.mLeading) {
      dom.mLeading.textContent = `${state.leading.toFixed(2)}×`;
    }
    if (dom.mJitter) {
      dom.mJitter.textContent =
        state.align === "left"
          ? "0.0em 稳锚"
          : `±${(ev.leftJitterEm * 0.5).toFixed(1)}em`;
    }

    if (dom.sheetHead) dom.sheetHead.textContent = cfg.headline;
    if (dom.sheetSub) dom.sheetSub.textContent = cfg.subEn;
    if (dom.sheetArrow) {
      const ratio =
        (state.measure - cfg.minMeasure) / (cfg.maxMeasure - cfg.minMeasure);
      dom.sheetArrow.style.setProperty("--arrow-p", `${(0.32 + ratio * 0.68).toFixed(3)}`);
    }

    if (dom.measureVal) {
      dom.measureVal.textContent = `${Math.round(state.measure)} ${cfg.unit}`;
    }
    if (dom.leadingSlider) {
      dom.leadingSlider.value = String(state.leading.toFixed(2));
    }
    if (dom.leadingVal) {
      dom.leadingVal.textContent = `${state.leading.toFixed(2)}×`;
    }
    if (dom.gazeToggle) {
      dom.gazeToggle.setAttribute("aria-pressed", String(state.showGaze));
      dom.gazeToggle.textContent = state.showGaze ? "眼动轨：开" : "眼动轨：关";
    }

    dom.scriptBtns.forEach((b) => {
      const on = b.dataset.script === state.script;
      b.setAttribute("aria-pressed", String(on));
    });
    dom.alignBtns.forEach((b) => {
      const on = b.dataset.align === state.align;
      b.setAttribute("aria-pressed", String(on));
    });
    dom.paraBtns.forEach((b) => {
      const on = Math.abs(parseFloat(b.dataset.para) - state.paraGap) < 0.05;
      b.setAttribute("aria-pressed", String(on));
    });

    // 原海报四词实时验收底条
    if (dom.kwBar) {
      const items = dom.kwBar.querySelectorAll("[data-kw]");
      items.forEach((el) => {
        const chk = ev.checks.find((c) => c.id === el.dataset.kw);
        if (!chk) return;
        el.dataset.ok = chk.ok ? "1" : "0";
        const sub = el.querySelector(".kw-sub");
        if (sub) sub.textContent = chk.status;
      });
    }
  }

  // 尺寸适配（由 ResizeObserver 更新，绝不在每帧 render 里调 getBoundingClientRect 引发重排）
  let cw = 720;
  let ch = 400;
  let curDpr = 1;
  let measureCacheKey = "";
  let measureCacheWidths = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    cw = Math.round(rect.width);
    ch = Math.round(rect.height);
    curDpr = pixelRatio(cw < 480 ? 1.5 : 2);
    const pw = Math.round(cw * curDpr);
    const ph = Math.round(ch * curDpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      measureCacheKey = "";
    }
  }
  resize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) ticker.draw();
    }).observe(canvas);
  }

  function render(t, dt, { still }) {
    if (canvas.width < 10) resize();
    ctx.setTransform(curDpr, 0, 0, curDpr, 0, 0);

    // 参数平滑插值
    if (still || dragging) {
      animMeasure = state.measure;
      animLeading = state.leading;
    } else {
      const k = Math.min(1, dt * 16);
      animMeasure += (state.measure - animMeasure) * k;
      animLeading += (state.leading - animLeading) * k;
    }
    if (!still) {
      gazeTime += dt;
    }

    const activeState =
      Math.abs(animMeasure - state.measure) > 0.15 ||
      Math.abs(animLeading - state.leading) > 0.005
        ? { ...state, measure: animMeasure, leading: animLeading }
        : state;
    const layout = activeState === state ? lastLayout : computeLayout(activeState);
    const ev = activeState === state ? lastEval : evaluate(activeState, layout);
    const { cfg, lines } = layout;

    const compact = cw < 440;
    const shortH = ch < 240;
    const padL = compact ? 12 : 24;
    const padR = compact ? 14 : 28;
    const padT = shortH ? 42 : compact ? 52 : 56;
    const padB = shortH ? 40 : compact ? 52 : 54;
    const availW = Math.max(180, cw - padL - padR);
    const availH = Math.max(76, ch - padT - padB);

    // 清屏：193 原海报暖米纸面
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(0, 0, cw, ch);

    // 单一几何标尺：把字号与标尺单位严格绑定，确保任何屏幕宽度下文字右端与刻度、红线像素级严丝合缝
    const maxEm = cfg.maxMeasure * cfg.emPerUnit;
    const widthFs = availW / maxEm;
    const heightFs = (availH - (shortH ? 18 : 28)) / Math.max(6.8, layout.totalHeightEm);
    const fontSize = Math.max(
      compact ? 6.1 : shortH ? 7.8 : 10.5,
      Math.min(compact ? 12.2 : 21.0, widthFs, heightFs)
    );
    const pxPerUnit = fontSize * cfg.emPerUnit;
    const rulerW = cfg.maxMeasure * pxPerUnit;
    const colW = activeState.measure * pxPerUnit;
    const lineStepPx = fontSize * activeState.leading;
    const paraGapPx = fontSize * activeState.paraGap;

    // 舒适行长区间（20–30 汉字 / 45–75 英文）在纸面上的淡青色带
    const cMinX = padL + cfg.comfortMin * pxPerUnit;
    const cMaxX = padL + cfg.comfortMax * pxPerUnit;
    ctx.fillStyle = "rgba(62, 150, 131, 0.095)";
    ctx.fillRect(cMinX, padT - 12, cMaxX - cMinX, availH + 10);

    // 顶沿标尺刻度线（与字符像素宽度 1:1 严格对齐）
    ctx.strokeStyle = "rgba(10, 22, 34, 0.24)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT - 12);
    ctx.lineTo(padL + rulerW, padT - 12);
    ctx.stroke();

    const tickStep = state.script === "en" ? 15 : 10;
    ctx.font = `500 ${compact ? 9.5 : 11}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = "rgba(10, 22, 34, 0.58)";
    ctx.textBaseline = "bottom";
    for (let u = tickStep; u <= cfg.maxMeasure; u += tickStep) {
      const tx = padL + u * pxPerUnit;
      ctx.beginPath();
      ctx.moveTo(tx, padT - 12);
      ctx.lineTo(tx, padT - 18);
      ctx.stroke();
      ctx.textAlign = u === cfg.maxMeasure ? "right" : "center";
      ctx.fillText(String(u), u === cfg.maxMeasure ? Math.min(cw - 4, tx + 2) : tx, padT - 19);
    }

    // 舒适带边界虚线与独立顶层标签（绝不和数字刻度打架）
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(27, 107, 90, 0.55)";
    ctx.lineWidth = 1;
    [cMinX, cMaxX].forEach((bx) => {
      ctx.beginPath();
      ctx.moveTo(bx, padT - 12);
      ctx.lineTo(bx, padT + availH - 2);
      ctx.stroke();
    });
    ctx.restore();

    ctx.font = `600 ${compact || shortH ? 9.5 : 11}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = PALETTE.sageDark;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      `经验舒适带 ${cfg.comfortMin}–${cfg.comfortMax}${cfg.unit}`,
      (cMinX + cMaxX) * 0.5,
      padT - (shortH ? 30 : 34)
    );

    // 左缘锚线（固定垂直基准线）
    const anchorOk = state.align === "left";
    ctx.save();
    ctx.strokeStyle = anchorOk ? PALETTE.sageDark : PALETTE.terraDeep;
    ctx.lineWidth = anchorOk ? 2 : 1.5;
    if (!anchorOk) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, padT - 8);
    ctx.lineTo(padL, padT + availH + 2);
    ctx.stroke();
    ctx.restore();

    // 实排每一行的基线与像素位置（缓存 measureText 避免 60Hz 重复塑形）
    const fsKey = `${state.script}|${Math.round(activeState.measure)}|${fontSize.toFixed(2)}`;
    ctx.font = `400 ${fontSize.toFixed(2)}px "Noto Sans SC", "Outfit", sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    if (measureCacheKey !== fsKey) {
      measureCacheWidths = lines.map((ln) => ctx.measureText(ln.text).width);
      measureCacheKey = fsKey;
    }

    const renderedLines = [];
    let curY = padT + fontSize * 1.15;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const measuredW = Math.min(colW, measureCacheWidths[i] || colW);
      const remW = Math.max(0, colW - measuredW);
      const xStart =
        padL +
        (state.align === "left"
          ? 0
          : state.align === "center"
          ? remW * 0.5
          : remW);
      const xEnd = xStart + measuredW;
      const yBase = curY;

      if (yBase <= ch - padB + 4) {
        // 水平基线轨道细线
        ctx.strokeStyle = "rgba(10, 22, 34, 0.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, Math.round(yBase) + 2.5);
        ctx.lineTo(padL + colW, Math.round(yBase) + 2.5);
        ctx.stroke();

        // 若左缘失锚，在左基准线与该行实际起点之间标出赤陶抖动短横线
        if (!anchorOk && xStart - padL > 3) {
          ctx.strokeStyle = "rgba(184, 68, 48, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(padL + 1, yBase - fontSize * 0.35);
          ctx.lineTo(xStart - 2, yBase - fontSize * 0.35);
          ctx.stroke();
          ctx.fillStyle = PALETTE.terraBlock;
          ctx.beginPath();
          ctx.arc(xStart - 2, yBase - fontSize * 0.35, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // 段落间若粘连则标出弱提示；若合适则淡显呼吸带
        if (ln.isParaEnd && i < lines.length - 1) {
          const nextY = yBase + lineStepPx + paraGapPx;
          if (state.paraGap >= 0.45 && state.paraGap <= 1.75 && nextY < ch - padB) {
            ctx.fillStyle = "rgba(62, 150, 131, 0.08)";
            ctx.fillRect(padL + 2, yBase + 4, colW - 4, lineStepPx + paraGapPx - fontSize - 6);
          }
        }

        // 真实排字绘制
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText(ln.text, xStart, yBase);

        renderedLines.push({
          ...ln,
          xStart,
          xEnd,
          yBase,
          width: measuredW,
        });
      }
      curY += lineStepPx + (ln.isParaEnd && i < lines.length - 1 ? paraGapPx : 0);
    }

    // 193 原海报标志：末行右下方的小墨块（句末收束）
    if (renderedLines.length) {
      const last = renderedLines[renderedLines.length - 1];
      const barW = compact ? 36 : 56;
      const barH = compact ? 7 : 9;
      ctx.fillStyle = PALETTE.navy;
      ctx.fillRect(
        Math.min(padL + colW - barW, Math.max(padL, last.xEnd + 10)),
        last.yBase - barH + 1,
        barW,
        barH
      );
    }

    // 右边界活体行长标尺线 + 拖动拉耳（直接随左右拖动在纸面上平移）
    const bladeX = padL + colW;
    const measureOk = ev.checks[0].ok;
    const bladeColor = measureOk ? PALETTE.sageDark : PALETTE.terraBlock;

    ctx.save();
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = dragging ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(bladeX, padT - 14);
    ctx.lineTo(bladeX, padT + availH + 12);
    ctx.stroke();

    // 顶部标尺游标牌（显示实时行长字数与左右拖动符号）
    const pillText = `↔ ${Math.round(activeState.measure)}${cfg.unit}`;
    ctx.font = `600 ${compact ? 10.5 : 11.5}px "IBM Plex Mono", "Noto Sans SC", sans-serif`;
    const pillW = ctx.measureText(pillText).width + 14;
    const pillH = shortH ? 18 : 22;
    const pillX = Math.max(padL, Math.min(cw - padR - pillW + 10, bladeX - pillW * 0.5));
    const pillY = Math.min(ch - 22 - pillH, padT + availH - (shortH ? 2 : 0));
    ctx.fillStyle = bladeColor;
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.fillStyle = PALETTE.ivory;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, pillX + pillW * 0.5, pillY + pillH * 0.5 + 0.5);
    ctx.restore();

    // 活体人眼扫视 + 不对称预视窗 + 行尾对角回扫轨迹
    if (state.showGaze && renderedLines.length >= 2) {
      const sweepPairs = Math.min(renderedLines.length - 1, 5);
      // 先淡画出所有行尾→下行的回扫对角线，一目了然展示回扫坡度
      for (let i = 0; i < sweepPairs; i++) {
        const a = renderedLines[i];
        const b = renderedLines[i + 1];
        const isRisk = ev.sweepRisk;
        // 错版下，部分回扫落点偏离（重回本行或误跨下行）以直观演示「串行迷航」
        const misfire =
          isRisk &&
          (ev.checks[0].ok === false || ev.checks[2].ok === false) &&
          i === (state.focusLine >= 0 ? Math.min(state.focusLine, sweepPairs - 1) : 1);

        const targetY = misfire
          ? ev.returnSweepDeg < 2.2
            ? a.yBase - fontSize * 0.15 // 坡度极平：折返落回同一行！
            : b.yBase + lineStepPx * 0.55 // 过冲跨行
          : b.yBase - fontSize * 0.35;

        const startX = a.xEnd;
        const startY = a.yBase - fontSize * 0.35;
        const endX = b.xStart;

        ctx.save();
        ctx.strokeStyle = misfire
          ? "rgba(184, 68, 48, 0.88)"
          : isRisk
          ? "rgba(184, 68, 48, 0.42)"
          : "rgba(27, 107, 90, 0.48)";
        ctx.lineWidth = misfire ? 2 : 1.25;
        ctx.setLineDash(misfire ? [5, 3] : [4, 4]);
        ctx.beginPath();
        const midX = (startX + endX) * 0.5;
        const midY = (startY + targetY) * 0.5 + (misfire ? -7 : 5);
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, targetY);
        ctx.stroke();

        // 箭头尖
        ctx.setLineDash([]);
        ctx.fillStyle = misfire ? PALETTE.terraBlock : isRisk ? PALETTE.terraBlock : PALETTE.sageDark;
        ctx.beginPath();
        ctx.arc(endX, targetY, misfire ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (misfire) {
          // 标牌绝不遮挡正文：引出细竖线落到末行下方的空阔纸面
          const lastY = renderedLines[renderedLines.length - 1].yBase;
          const warnLabel =
            ev.returnSweepDeg < 2.2
              ? `← 回扫仅 ${ev.returnSweepDeg.toFixed(1)}° · 坡度过平易落回同行`
              : `← 行间通道过窄 · 回扫易串行`;
          ctx.font = `600 ${compact ? 10 : 11.5}px "Noto Sans SC", sans-serif`;
          const lw = ctx.measureText(warnLabel).width + 16;
          const lx = Math.max(padL + 2, Math.min(cw - padR - lw, midX - lw * 0.5));
          const ly = Math.min(padT + availH - 22, lastY + 14);
          ctx.strokeStyle = "rgba(184, 68, 48, 0.65)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX, ly);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = PALETTE.terraBlock;
          ctx.fillRect(lx, ly, lw, 22);
          ctx.fillStyle = PALETTE.ivory;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(warnLabel, lx + lw * 0.5, ly + 11.5);
        }
        ctx.restore();
      }

      // 动态视点脉冲（沿当前选定或循环的行执行：行内向右扫视 → 行尾回扫折返）
      const lineDur = 1.9;
      const sweepDur = 0.55;
      const cycle = lineDur + sweepDur;
      const totalIdx =
        state.focusLine >= 0
          ? Math.min(state.focusLine, renderedLines.length - 1)
          : Math.floor((gazeTime / cycle) % renderedLines.length);
      const phase = (gazeTime % cycle) / cycle;
      const curLn = renderedLines[totalIdx];
      const nextLn = renderedLines[(totalIdx + 1) % renderedLines.length];

      let gx, gy, sweeping = false;
      if (phase < lineDur / cycle) {
        const u = phase / (lineDur / cycle);
        // 阶梯眼跳感（轻度离散步进 + 平滑衔接）
        const hops = Math.max(3, Math.round(curLn.units / Math.max(3, cfg.spanRight * 1.4)));
        const step = Math.floor(u * hops);
        const frac = u * hops - step;
        const smoothU = (step + Math.pow(frac, 2.2)) / hops;
        gx = curLn.xStart + smoothU * curLn.width;
        gy = curLn.yBase - fontSize * 0.36;
      } else {
        sweeping = true;
        const u = (phase - lineDur / cycle) / (sweepDur / cycle);
        const ease = 1 - Math.pow(1 - u, 3);
        const sy = curLn.yBase - fontSize * 0.36;
        const ty = nextLn.yBase - fontSize * 0.36;
        gx = curLn.xEnd + (nextLn.xStart - curLn.xEnd) * ease;
        gy = sy + (ty - sy) * ease + Math.sin(u * Math.PI) * 6;
      }

      // 不对称水平感知广度窗（向右明显更宽，直观对应 Rayner / Inhoff & Liu 实验）
      const accent = ev.passCount === 4 ? PALETTE.sageDark : PALETTE.terraBlock;
      if (!sweeping) {
        const leftPx = cfg.spanLeft * cfg.emPerUnit * fontSize;
        const rightPx = cfg.spanRight * cfg.emPerUnit * fontSize;
        const spanL = Math.max(curLn.xStart, gx - leftPx);
        const spanR = Math.min(curLn.xEnd, gx + rightPx);
        ctx.save();
        ctx.fillStyle =
          ev.passCount === 4
            ? "rgba(27, 107, 90, 0.18)"
            : "rgba(184, 68, 48, 0.18)";
        ctx.fillRect(spanL, curLn.yBase - fontSize * 0.92, Math.max(6, spanR - spanL), fontSize * 1.15);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(spanL, curLn.yBase + 3);
        ctx.lineTo(spanR, curLn.yBase + 3);
        ctx.stroke();
        ctx.restore();
      }

      // 注视点光环
      ctx.save();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(gx, gy, sweeping ? 4.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 底部轻提示条（画在纸面左下方）
    ctx.font = `500 ${compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "rgba(10, 22, 34, 0.62)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      compact ? "左右拖动纸面调行长 · 点行定视点" : "直接左右拖动校样纸面改变行长 · 点击任意行锁定回扫轨迹 · 方向键 ←→ / ↑↓ 微调",
      padL,
      ch - 13
    );

    lastGeom = { padL, pxPerUnit, cfg, renderedLines };
  }

  const ticker = loop(canvas, render);

  function setMeasure(nextMeasure, snap = false) {
    const cfg = SCRIPTS[state.script];
    let val = Math.max(cfg.minMeasure, Math.min(cfg.maxMeasure, nextMeasure));
    if (snap && Math.abs(val - cfg.idealMeasure) < (state.script === "en" ? 2.2 : 1.0)) {
      val = cfg.idealMeasure;
    }
    const rounded = Math.round(val);
    if (rounded === state.measure) return;
    state.measure = rounded;
    syncUI();
    if (reducedMotion.matches) ticker.draw();
  }

  function setLeading(nextLeading) {
    const val = +(Math.max(1.08, Math.min(2.35, +nextLeading))).toFixed(2);
    if (val === state.leading) return;
    state.leading = val;
    syncUI();
    if (reducedMotion.matches) ticker.draw();
  }

  // 直接在纸面左右拖动改行长（支持鼠标 + 触屏；触屏不阻止竖直滚动）
  let touchStartY = 0;
  let touchLockedAxis = null; // "x" | "y" | null

  function pointerToMeasure(clientX) {
    if (!lastGeom) return state.measure;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return (x - lastGeom.padL) / Math.max(1, lastGeom.pxPerUnit);
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // 触屏单独用 touch 事件确保 perf.mjs 和竖滑完美兼容
    dragging = true;
    dragStartX = e.clientX;
    dragStartMeasure = state.measure;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("is-dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerType === "touch") return;
    const dx = e.clientX - dragStartX;
    const scale = lastGeom ? 1 / Math.max(1, lastGeom.pxPerUnit) : 0.1;
    setMeasure(dragStartMeasure + dx * scale, true);
  });

  function endPointerDrag(e) {
    if (!dragging) return;
    const moved = Math.abs(e.clientX - dragStartX);
    dragging = false;
    canvas.classList.remove("is-dragging");
    // 纯点击：选中对应行锁定回扫透视（再点同行解除）
    if (moved < 5 && lastGeom && lastGeom.renderedLines.length) {
      const rect = canvas.getBoundingClientRect();
      const py = e.clientY - rect.top;
      let nearest = 0;
      let best = Infinity;
      lastGeom.renderedLines.forEach((ln, idx) => {
        const d = Math.abs(py - (ln.yBase - 6));
        if (d < best) {
          best = d;
          nearest = idx;
        }
      });
      state.focusLine = state.focusLine === nearest ? -1 : nearest;
      ticker.draw();
    }
  }
  canvas.addEventListener("pointerup", endPointerDrag);
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
    canvas.classList.remove("is-dragging");
  });

  // 触屏：横向拖改行长（同步兼容 tools/perf.mjs 的 dispatchTouchEvent），竖向滑动放行给页面滚动
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      dragStartX = t.clientX;
      touchStartY = t.clientY;
      dragStartMeasure = state.measure;
      touchLockedAxis = null;
      dragging = true;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || !e.touches.length) return;
      const t = e.touches[0];
      const dx = t.clientX - dragStartX;
      const dy = t.clientY - touchStartY;
      if (!touchLockedAxis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        touchLockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchLockedAxis === "x" || !touchLockedAxis) {
        if (e.cancelable) e.preventDefault();
        const scale = lastGeom ? 1 / Math.max(1, lastGeom.pxPerUnit) : 0.14;
        setMeasure(dragStartMeasure + dx * scale, false);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      dragging = false;
      touchLockedAxis = null;
    },
    { passive: true }
  );

  // 键盘微调（画布可聚焦：←/→ 改行长，↑/↓ 改行距）
  canvas.addEventListener("keydown", (e) => {
    const stepM = state.script === "en" ? 3 : 2;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setMeasure(state.measure + stepM);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setMeasure(state.measure - stepM);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLeading(state.leading + 0.08);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setLeading(state.leading - 0.08);
    }
  });

  // 控件绑定
  dom.scriptBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const next = b.dataset.script;
      if (!SCRIPTS[next] || next === state.script) return;
      const oldCfg = SCRIPTS[state.script];
      const newCfg = SCRIPTS[next];
      // 按当前相对区间映射，保留用户的调整进度，不突然白送答案
      const p = (state.measure - oldCfg.minMeasure) / (oldCfg.maxMeasure - oldCfg.minMeasure);
      state.script = next;
      state.measure = Math.round(newCfg.minMeasure + p * (newCfg.maxMeasure - newCfg.minMeasure));
      state.focusLine = -1;
      syncUI();
      ticker.draw();
    })
  );

  dom.measureStepBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const dir = parseInt(b.dataset.mstep, 10);
      const step = state.script === "en" ? 4 : 2;
      setMeasure(state.measure + dir * step);
    })
  );

  if (dom.leadingSlider) {
    dom.leadingSlider.addEventListener("input", () => {
      setLeading(parseFloat(dom.leadingSlider.value));
    });
  }

  dom.alignBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.align = b.dataset.align;
      syncUI();
      ticker.draw();
    })
  );

  dom.paraBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.paraGap = parseFloat(b.dataset.para);
      syncUI();
      ticker.draw();
    })
  );

  if (dom.gazeToggle) {
    dom.gazeToggle.addEventListener("click", () => {
      state.showGaze = !state.showGaze;
      syncUI();
      ticker.draw();
    });
  }

  if (dom.resetBtn) {
    dom.resetBtn.addEventListener("click", () => {
      const fresh = initialState(state.script);
      Object.assign(state, fresh);
      animMeasure = state.measure;
      animLeading = state.leading;
      syncUI();
      ticker.draw();
    });
  }

  window.addEventListener("resize", () => ticker.draw());
  reducedMotion.addEventListener("change", () => ticker.draw());

  syncUI();
  ticker.draw();

  return { state, setMeasure, setLeading, draw: () => ticker.draw() };
}
