// 095 开场互动核心：活体版面 + 物理眯眼模糊滑幕（2D Canvas, data-perf-drag）+ 三阶折面层台 + 四石叠塔 + 四栏实时要点
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  PRESETS,
  SCENARIOS,
  TIERS,
  applyPreset,
  createInitialState,
  evaluateLayout,
} from "./model.js";

const CIRCLED = ["①", "②", "③", "④", "⑤"];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function wrapLines(ctx, text, maxW, maxLines = 3) {
  const chars = [...text];
  const lines = [];
  let cur = "";
  for (const ch of chars) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur.length > 0) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines - 1) break;
    } else {
      cur = test;
    }
  }
  const rest = chars.slice(lines.join("").length).join("");
  if (rest) {
    let last = rest;
    while (last.length > 1 && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    lines.push(last.length < rest.length ? last + "…" : last);
  }
  return lines;
}

export function initHeroStage() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  const state = createInitialState("poster");
  let W = 600;
  let H = 444;

  // 离屏双缓冲：sharpCanvas 存清晰版面，blurCanvas 存极速下采样光学模糊版面（眯眼视角）
  // 随视口长宽比自适应逻辑高度 H，保证任意屏幕 1:1 等比绘制（零拉伸椭圆），且拖动时零重算稳跑 60fps
  const sharpCanvas = document.createElement("canvas");
  const blurTiny = document.createElement("canvas");
  const blurCanvas = document.createElement("canvas");
  sharpCanvas.width = W * 2;
  sharpCanvas.height = H * 2;
  blurTiny.width = 58;
  blurTiny.height = 43;
  blurCanvas.width = W;
  blurCanvas.height = H;
  const sCtx = sharpCanvas.getContext("2d");
  const btCtx = blurTiny.getContext("2d");
  const bCtx = blurCanvas.getContext("2d");

  let evalData = evaluateLayout(state, W, H);
  let dirtyBuffer = true;
  let dirtySquintDom = false;
  let canvasCssW = W;
  let canvasCssH = H;
  let dpr = pixelRatio(2);

  // DOM 引用
  const scenarioBtns = [...document.querySelectorAll("[data-scenario]")];
  const presetBtns = [...document.querySelectorAll("[data-preset]")];
  const scaleSlider = document.getElementById("ctl-scale");
  const contrastSlider = document.getElementById("ctl-contrast");
  const squintSlider = document.getElementById("ctl-squint");
  const squintSliderMob = document.getElementById("ctl-squint-mob");
  const scaleOut = document.getElementById("out-scale");
  const contrastOut = document.getElementById("out-contrast");
  const squintOut = document.getElementById("out-squint");
  const squintOutMob = document.getElementById("out-squint-mob");
  const scanBtn = document.getElementById("btn-scan");
  const scanBtnMob = document.getElementById("btn-scan-mob");
  const fixBtn = document.getElementById("btn-fix");
  const fixBtnMob = document.getElementById("btn-fix-mob");
  const resetBtn = document.getElementById("btn-reset");
  const terraceList = document.getElementById("terrace-list");
  const cairnSvg = document.getElementById("cairn-svg");
  const cairnNote = document.getElementById("cairn-note");
  const statusPill = document.getElementById("hero-status-pill");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictBody = document.getElementById("verdict-body");
  const verdictAction = document.getElementById("verdict-action");
  const verdictGrade = document.getElementById("verdict-grade");
  const mobVerdict = document.getElementById("mob-verdict");
  const mobBadge = document.getElementById("mob-badge");
  const hudSummary = document.getElementById("canvas-hud-summary");
  const ribbonEl = document.getElementById("verdict-ribbon");

  const ptEls = {
    order: {
      card: document.getElementById("pt-order"),
      badge: document.getElementById("pt-order-badge"),
      text: document.getElementById("pt-order-text"),
    },
    saliency: {
      card: document.getElementById("pt-saliency"),
      badge: document.getElementById("pt-saliency-badge"),
      text: document.getElementById("pt-saliency-text"),
    },
    scan: {
      card: document.getElementById("pt-scan"),
      badge: document.getElementById("pt-scan-badge"),
      text: document.getElementById("pt-scan-text"),
    },
    restraint: {
      card: document.getElementById("pt-restraint"),
      badge: document.getElementById("pt-restraint-badge"),
      text: document.getElementById("pt-restraint-text"),
    },
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    dpr = rect.width < 520 ? pixelRatio(1.5) : pixelRatio(2);
    canvasCssW = rect.width;
    canvasCssH = rect.height;
    const nextH = clamp(Math.round((W * rect.height) / rect.width), 360, 660);
    if (Math.abs(nextH - H) >= 2) {
      H = nextH;
      sharpCanvas.width = W * 2;
      sharpCanvas.height = H * 2;
      blurTiny.width = 58;
      blurTiny.height = Math.max(32, Math.round((58 * H) / W));
      blurCanvas.width = W;
      blurCanvas.height = H;
      evalData = evaluateLayout(state, W, H);
      dirtyBuffer = true;
    }
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  // 把真实 5 块信息绘到高分辨率离屏画布，并生成光学眯眼模糊副本
  function rebuildBuffers() {
    dirtyBuffer = false;
    const ev = evalData;
    sCtx.save();
    sCtx.setTransform(2, 0, 0, 2, 0, 0);

    // 纸底（原海报暖象牙宣纸 + 极细顶部卷眉）
    sCtx.fillStyle = PALETTE.ivory;
    sCtx.fillRect(0, 0, W, H);

    // 纸面微妙点阵（右上 4×3，呼应 095 原海报点阵细节）
    sCtx.fillStyle = "rgba(104, 108, 100, 0.24)";
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        sCtx.beginPath();
        sCtx.arc(W - 44 + c * 9, 18 + r * 8, 1.4, 0, Math.PI * 2);
        sCtx.fill();
      }
    }

    // 顶部细刊眉
    sCtx.fillStyle = PALETTE.oliveText;
    sCtx.font = `500 10px "DM Mono", monospace`;
    sCtx.textBaseline = "middle";
    sCtx.fillText(`${ev.scenario.canvasTag}  ·  NO. 095`, ev.padX, 24);
    sCtx.strokeStyle = "rgba(26, 24, 24, 0.14)";
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    sCtx.moveTo(ev.padX, 36);
    sCtx.lineTo(W - ev.padX, 36);
    sCtx.stroke();

    // 逐块实绘 5 个信息模块
    for (const it of ev.items) {
      const { x, y, w, h } = it.rect;

      // 块背景与边界
      if (it.hasFill) {
        sCtx.fillStyle = it.boxBg;
        sCtx.fillRect(x, y, w, h);
      } else {
        // 柔和纸面框线以便看出块边界与呼吸留白
        sCtx.fillStyle = it.tier === 1 ? "rgba(239, 178, 49, 0.08)" : "rgba(26, 24, 24, 0.025)";
        sCtx.fillRect(x, y, w, h);
      }

      // 左侧层级结构竖条（无色块的主层以炭黑粗杠表身份，次层用陶红细杠，细层用极淡灰杠）
      const barW = it.tier === 1 ? 5 : it.tier === 2 ? 3 : 1.5;
      sCtx.fillStyle = it.emphasized
        ? it.tier === 1
          ? PALETTE.gold
          : PALETTE.ivory
        : it.tier === 1
          ? PALETTE.charcoal
          : it.tier === 2
            ? PALETTE.terra
            : "rgba(104, 108, 100, 0.35)";
      sCtx.fillRect(x, y, barW, h);

      // 块内文字排版
      const innerPadX = barW + 14;
      const textW = w - innerPadX - 14;
      sCtx.fillStyle = it.inkColor;

      if (it.kind === "headline") {
        sCtx.font = `${it.fontWeight} ${it.fontSize}px "Noto Sans SC", sans-serif`;
        sCtx.textBaseline = "middle";
        const cy = it.sub ? y + h * 0.42 : y + h * 0.5;
        const lines = wrapLines(sCtx, it.text, textW, 2);
        const lh = it.fontSize * 1.12;
        const startY = cy - ((lines.length - 1) * lh) / 2;
        lines.forEach((ln, idx) => sCtx.fillText(ln, x + innerPadX, startY + idx * lh));
        if (it.sub) {
          sCtx.font = `700 ${Math.max(9.5, Math.min(13, it.fontSize * 0.34))}px "Archivo", sans-serif`;
          sCtx.fillStyle = it.emphasized
            ? PALETTE.gold
            : it.tier === 1
              ? PALETTE.terraText
              : it.inkColor;
          sCtx.fillText(it.sub, x + innerPadX, y + h - Math.max(12, h * 0.2));
        }
      } else if (it.kind === "visual") {
        // 迷你叠石符号 + 核心锚点文字，忠实呼应 095 几何图形语言
        const rDot = clamp(it.fontSize * 0.36, 6, 13);
        const cx = x + innerPadX + rDot;
        const cy = y + h * 0.5;
        sCtx.fillStyle = it.emphasized ? PALETTE.cream : it.tier === 1 ? PALETTE.charcoal : PALETTE.terra;
        sCtx.beginPath();
        sCtx.arc(cx, cy - rDot * 0.45, rDot * 0.65, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.fillStyle = it.emphasized ? PALETTE.gold : PALETTE.charcoal;
        sCtx.beginPath();
        sCtx.ellipse(cx, cy + rDot * 0.72, rDot * 1.05, rDot * 0.44, 0, 0, Math.PI * 2);
        sCtx.fill();

        const tx = cx + rDot * 1.65;
        const tw = Math.max(40, x + w - tx - 10);
        sCtx.fillStyle = it.inkColor;
        sCtx.font = `${it.fontWeight} ${Math.min(it.fontSize * 0.92, 26)}px "Noto Sans SC", sans-serif`;
        sCtx.textBaseline = "middle";
        const lns = wrapLines(sCtx, it.text, tw, 1);
        sCtx.fillText(lns[0] || it.text, tx, y + h * 0.38);
        if (it.sub) {
          sCtx.font = `400 ${Math.max(10, Math.min(13, it.fontSize * 0.52))}px "Noto Sans SC", sans-serif`;
          sCtx.globalAlpha = 0.82;
          const subLns = wrapLines(sCtx, it.sub, tw, 1);
          sCtx.fillText(subLns[0] || it.sub, tx, y + h * 0.69);
          sCtx.globalAlpha = 1;
        }
      } else if (it.kind === "subhead") {
        sCtx.font = `${it.fontWeight} ${Math.min(it.fontSize, 26)}px "Noto Sans SC", sans-serif`;
        sCtx.textBaseline = "middle";
        const lns = wrapLines(sCtx, it.text, textW, 1);
        sCtx.fillText(lns[0] || it.text, x + innerPadX, y + h * (it.sub ? 0.38 : 0.5));
        if (it.sub) {
          sCtx.font = `400 ${Math.max(10.5, Math.min(13.5, it.fontSize * 0.68))}px "Noto Sans SC", sans-serif`;
          sCtx.globalAlpha = 0.8;
          const sl = wrapLines(sCtx, it.sub, textW, 1);
          sCtx.fillText(sl[0] || it.sub, x + innerPadX, y + h * 0.72);
          sCtx.globalAlpha = 1;
        }
      } else {
        // paragraph / footnote
        const fz = Math.min(it.fontSize, 22);
        sCtx.font = `${it.fontWeight} ${fz}px "Noto Sans SC", sans-serif`;
        sCtx.textBaseline = "middle";
        const maxLines = it.kind === "paragraph" ? 3 : 2;
        const lns = wrapLines(sCtx, it.text, textW, maxLines);
        const lh = fz * 1.38;
        const startY = y + h * 0.5 - ((lns.length - 1) * lh) / 2;
        lns.forEach((ln, idx) => sCtx.fillText(ln, x + innerPadX, startY + idx * lh));
      }
    }
    sCtx.restore();

    // 生成极速柔和的「眯眼视角」模糊副本（两次双线性下采样→上采样，无性能开销）
    btCtx.clearRect(0, 0, blurTiny.width, blurTiny.height);
    btCtx.imageSmoothingEnabled = true;
    btCtx.imageSmoothingQuality = "high";
    btCtx.drawImage(sharpCanvas, 0, 0, blurTiny.width, blurTiny.height);

    bCtx.clearRect(0, 0, W, H);
    bCtx.imageSmoothingEnabled = true;
    bCtx.imageSmoothingQuality = "high";
    bCtx.drawImage(blurTiny, 0, 0, W, H);
    // 略压低暗部对比，模拟人眼半眯时对高对比大团块的感知
    bCtx.fillStyle = "rgba(249, 237, 213, 0.08)";
    bCtx.fillRect(0, 0, W, H);
  }

  // 主帧绘制（含眯眼滑幕、选中框、实测顺位徽章与 Space 3 秒初看脉冲）
  function renderFrame(t, dt, { still }) {
    resizeCanvas();
    if (dirtyBuffer) rebuildBuffers();
    if (dirtySquintDom) {
      dirtySquintDom = false;
      const pct = String(Math.round(state.squint * 100));
      if (squintSlider && squintSlider.value !== pct) squintSlider.value = pct;
      if (squintSliderMob && squintSliderMob.value !== pct) squintSliderMob.value = pct;
      if (squintOut) squintOut.textContent = `${pct}%`;
      if (squintOutMob) squintOutMob.textContent = `${pct}%`;
    }

    if (state.scanActive) {
      if (still) {
        state.scanTime = 2.4;
      } else {
        state.scanTime += dt || 0.016;
        if (state.scanTime >= 3.2) {
          state.scanActive = false;
          state.scanTime = 0;
        }
      }
    }

    const ev = evalData;
    const scale = canvasCssW / W;

    ctx.save();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    // 眯眼分界线 x：用子矩形直接拷贝（零 clip/save 开销），软件渲染也稳跑高帧率
    const splitX = Math.round(W * (1 - state.squint));

    // 1. 清晰侧（0 .. splitX）
    if (splitX > 0) {
      ctx.drawImage(sharpCanvas, 0, 0, splitX * 2, H * 2, 0, 0, splitX, H);
    }

    // 2. 眯眼模糊侧（splitX .. W）
    if (splitX < W) {
      ctx.drawImage(blurCanvas, splitX, 0, W - splitX, H, splitX, 0, W - splitX, H);
    }

    // 3. 每个信息块的外框反馈（选中态、重点倒挂警告框、右上初看顺位标 ①②③）
    for (const it of ev.items) {
      const { x, y, w, h } = it.rect;
      const isSelected = it.id === state.selectedId;
      const isInverted = (it.role === "detail" && it.glanceRank <= 2) || (it.id === "title" && it.glanceRank >= 3);

      if (isSelected) {
        ctx.strokeStyle = PALETTE.charcoal;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      } else if (isInverted && !state.scanActive) {
        ctx.save();
        ctx.strokeStyle = PALETTE.warn;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }

      // 右上角实测初看顺位小圆章（1/2/3 最醒目，清楚标出当前实际落眼次序）
      const badgeR = it.glanceRank === 1 ? 13 : 11;
      const bx = x + w - badgeR - 7;
      const by = y + badgeR + 6;
      const isBadFirst = it.glanceRank === 1 && it.role === "detail";

      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = isBadFirst
        ? PALETTE.warn
        : it.glanceRank === 1
          ? PALETTE.charcoal
          : it.glanceRank === 2
            ? PALETTE.terra
            : PALETTE.olive;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ivory;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = PALETTE.ivory;
      ctx.font = `700 ${it.glanceRank === 1 ? 12 : 10.5}px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(it.glanceRank), bx, by + 0.5);
      ctx.textAlign = "left";
    }

    // 4. Space 3 秒初看眼动实测路径（按真实显著性顺位 ①→②→③ 逐秒点亮）
    if (state.scanActive) {
      const top3 = ev.ranked.slice(0, 3);
      const pts = top3.map((it) => ({
        x: it.rect.x + it.rect.w * 0.48,
        y: it.rect.y + it.rect.h * 0.5,
        item: it,
      }));
      const p = clamp(state.scanTime / 2.4, 0, 1);

      // 轻微压暗背景突出视线落点
      ctx.fillStyle = "rgba(17, 18, 13, 0.24)";
      ctx.fillRect(0, 0, W, H);

      // 视线连线
      ctx.save();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (p > 0.25) {
        const t12 = clamp((p - 0.25) / 0.35, 0, 1);
        ctx.lineTo(pts[0].x + (pts[1].x - pts[0].x) * t12, pts[0].y + (pts[1].y - pts[0].y) * t12);
      }
      if (p > 0.6) {
        const t23 = clamp((p - 0.6) / 0.35, 0, 1);
        ctx.lineTo(pts[1].x + (pts[2].x - pts[1].x) * t23, pts[1].y + (pts[2].y - pts[1].y) * t23);
      }
      ctx.stroke();
      ctx.restore();

      // 依次点亮 ① ② ③ 凝视环
      pts.forEach((pt, idx) => {
        const threshold = idx * 0.3;
        if (p < threshold) return;
        const local = clamp((p - threshold) / 0.25, 0, 1);
        const pulseR = 20 + (1 - local) * 18;
        const isWarn = idx === 0 && pt.item.role === "detail";

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = isWarn ? PALETTE.warnLight : PALETTE.gold;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isWarn ? PALETTE.warn : PALETTE.charcoal;
        ctx.fill();
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = PALETTE.ivory;
        ctx.font = `700 13px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`第${idx + 1}眼`, pt.x, pt.y);
        ctx.textAlign = "left";
      });
    }

    // 5. 物理「眯眼模糊滑幕」分界线与居中把手（高辨识暖金+炭黑建筑标尺）
    if (state.squint > 0.01 && state.squint < 0.99) {
      ctx.fillStyle = PALETTE.charcoal;
      ctx.fillRect(splitX - 1.5, 0, 3, H);

      // 滑幕两侧标签
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      if (splitX > 94) {
        ctx.fillStyle = "rgba(26, 24, 24, 0.86)";
        ctx.fillRect(splitX - 78, 8, 70, 22);
        ctx.fillStyle = PALETTE.cream;
        ctx.fillText("清晰原稿", splitX - 66, 19);
      }
      if (W - splitX > 98) {
        ctx.fillStyle = PALETTE.terra;
        ctx.fillRect(splitX + 8, 8, 82, 22);
        ctx.fillStyle = PALETTE.ivory;
        ctx.fillText("眯眼看团块", splitX + 18, 19);
      }

      // 中央拉手圆盘
      const hy = H * 0.5;
      ctx.beginPath();
      ctx.arc(splitX, hy, 17, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.gold;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = PALETTE.charcoal;
      ctx.stroke();

      // 双向小三角
      ctx.fillStyle = PALETTE.charcoal;
      ctx.beginPath();
      ctx.moveTo(splitX - 9, hy);
      ctx.lineTo(splitX - 3, hy - 5);
      ctx.lineTo(splitX - 3, hy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(splitX + 9, hy);
      ctx.lineTo(splitX + 3, hy - 5);
      ctx.lineTo(splitX + 3, hy + 5);
      ctx.closePath();
      ctx.fill();
    } else if (state.squint >= 0.99) {
      ctx.fillStyle = PALETTE.terra;
      ctx.fillRect(10, 8, 108, 22);
      ctx.fillStyle = PALETTE.ivory;
      ctx.font = `700 10.5px "Noto Sans SC", sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("全幅眯眼模式", 22, 19);
    }

    // 底部提示窄带
    ctx.fillStyle = "rgba(26, 24, 24, 0.06)";
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = `500 10.5px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("左右横拖滑幕做眯眼测试 · 点击模块选中 · 空格键 3 秒初看验序", ev.padX, H - 12);

    ctx.restore();
  }

  // ---------- 渲染右上 095 标志性四石叠塔 SVG ----------
  function renderCairn(cairn) {
    if (!cairnSvg) return;
    const [w0, w1, w2, w3] = cairn.widths;
    const tilt = cairn.tiltDeg;
    const r0 = Math.round(78 * w0);
    const r1 = Math.round(78 * w1);
    const r2 = Math.round(78 * w2);
    const r3 = Math.round(44 * w3);
    cairnSvg.innerHTML = `
      <g transform="rotate(${tilt.toFixed(1)} 100 132)">
        <ellipse cx="100" cy="134" rx="${r0}" ry="25" fill="${PALETTE.charcoal}"/>
        <ellipse cx="100" cy="98" rx="${r1}" ry="18" fill="${PALETTE.gold}"/>
        <ellipse cx="100" cy="68" rx="${r2}" ry="16" fill="${PALETTE.cream}" stroke="${PALETTE.olive}" stroke-width="1.4"/>
        <circle cx="100" cy="34" r="${r3}" fill="${PALETTE.terra}"/>
      </g>
    `;
    if (cairnNote) {
      cairnNote.textContent = cairn.stable ? "叠石稳立 · 三阶有序" : "叠石失稳 · 权重失调";
      cairnNote.dataset.state = cairn.stable ? "ok" : "warn";
    }
  }

  // ---------- 渲染右侧原海报同款「三阶 3D 斜切折面层台」 ----------
  function renderMiniWireframe(tierId, itemsInTier) {
    const count = itemsInTier.length;
    const hasAccent = itemsInTier.some((x) => x.emphasized);
    if (tierId === 1) {
      return `
        <svg class="tier-mini" viewBox="0 0 88 54" aria-hidden="true">
          <rect x="1" y="1" width="86" height="52" fill="#FCF5E8" stroke="#C7BBA6" stroke-width="1"/>
          <rect x="7" y="7" width="${count ? 74 : 26}" height="${count ? 15 : 8}" fill="${count ? PALETTE.charcoal : "#C7BBA6"}"/>
          <rect x="7" y="27" width="${hasAccent ? 38 : 28}" height="20" fill="${count ? PALETTE.gold : "#DFD5C3"}"/>
          <line x1="50" y1="30" x2="80" y2="30" stroke="#9B968D" stroke-width="2"/>
          <line x1="50" y1="37" x2="76" y2="37" stroke="#9B968D" stroke-width="2"/>
          <line x1="50" y1="44" x2="72" y2="44" stroke="#9B968D" stroke-width="2"/>
        </svg>`;
    }
    if (tierId === 2) {
      return `
        <svg class="tier-mini" viewBox="0 0 88 54" aria-hidden="true">
          <rect x="1" y="1" width="86" height="52" fill="#FCF5E8" stroke="#C7BBA6" stroke-width="1"/>
          <rect x="7" y="8" width="22" height="19" fill="${count ? PALETTE.terra : "#DFD5C3"}"/>
          <line x1="35" y1="11" x2="80" y2="11" stroke="${count ? PALETTE.charcoal : "#B8B0A1"}" stroke-width="3"/>
          <line x1="35" y1="18" x2="76" y2="18" stroke="#686C64" stroke-width="2"/>
          <line x1="35" y1="24" x2="70" y2="24" stroke="#9B968D" stroke-width="2"/>
          <rect x="7" y="34" width="22" height="13" fill="#D5C8B5"/>
          <rect x="33" y="34" width="22" height="13" fill="#D5C8B5"/>
          <rect x="59" y="34" width="22" height="13" fill="#D5C8B5"/>
        </svg>`;
    }
    return `
      <svg class="tier-mini" viewBox="0 0 88 54" aria-hidden="true">
        <rect x="1" y="1" width="86" height="52" fill="#FCF5E8" stroke="#C7BBA6" stroke-width="1"/>
        ${[13, 23, 33, 43]
          .map(
            (yy, i) => `
          <circle cx="12" cy="${yy}" r="2.2" fill="${i < Math.max(1, count + 1) ? PALETTE.olive : "#C7BBA6"}"/>
          <line x1="19" y1="${yy}" x2="${78 - (i % 2) * 8}" y2="${yy}" stroke="#9B968D" stroke-width="1.6"/>
        `
          )
          .join("")}
      </svg>`;
  }

  function renderTerrace() {
    if (!terraceList) return;
    const ev = evalData;
    terraceList.innerHTML = [1, 2, 3]
      .map((tid) => {
        const meta = TIERS[tid];
        const list = ev.byTier[tid];
        const empty = list.length === 0;
        const avgFs = list.length ? Math.round(list.reduce((s, x) => s + x.fontSize, 0) / list.length) : 0;
        const chipsHtml = empty
          ? `<span class="tier-empty">该层级为空 · 点下方模块「升/降」放入</span>`
          : list
              .map((it) => {
                const sel = it.id === state.selectedId ? " is-selected" : "";
                const bad = it.role === "detail" && tid === 1 ? " is-warn" : "";
                return `
                  <div class="block-chip${sel}${bad}" data-block-chip="${it.id}">
                    <button type="button" class="chip-select" data-select="${it.id}">
                      <span class="chip-rank">${CIRCLED[it.glanceRank - 1] || it.glanceRank}</span>
                      <span class="chip-name">${it.name}</span>
                    </button>
                    <span class="chip-ops">
                      <button type="button" class="chip-op" data-move="${it.id}" data-dir="-1" aria-label="提升${it.name}层级"${tid === 1 ? " disabled" : ""}>↑</button>
                      <button type="button" class="chip-op" data-move="${it.id}" data-dir="1" aria-label="降低${it.name}层级"${tid === 3 ? " disabled" : ""}>↓</button>
                      <button type="button" class="chip-op chip-hi${it.emphasized ? " is-on" : ""}" data-accent="${it.id}" aria-pressed="${it.emphasized}" title="切换高光底块">光</button>
                    </span>
                  </div>
                `;
              })
              .join("");

        return `
          <article class="tier-slab tier-${tid}${empty ? " is-empty" : ""}">
            <div class="tier-spine">
              <span class="tier-zh">${meta.zh}</span>
              <span class="tier-en" lang="en">${meta.en}</span>
              <span class="tier-stat" lang="en">${empty ? "0 项" : `${list.length} 项 · ${avgFs}px`}</span>
            </div>
            <div class="tier-body">
              <div class="tier-head">
                <div>
                  <strong class="tier-role">${meta.role}</strong>
                  <p class="tier-hint">${tid === 3 ? "又称第三/辅助层级：提供细节支持，不抢夺注意力。" : meta.posterDesc}</p>
                </div>
                ${renderMiniWireframe(tid, list)}
              </div>
              <div class="tier-chips">${chipsHtml}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // ---------- 同步全部单真源 UI ----------
  function syncUI() {
    evalData = evaluateLayout(state, W, H);
    dirtyBuffer = true;
    const ev = evalData;

    scenarioBtns.forEach((b) => {
      const active = b.dataset.scenario === state.scenario;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    if (scaleSlider) scaleSlider.value = String(state.scaleStep);
    if (contrastSlider) contrastSlider.value = String(Math.round(state.contrastGap * 100));
    if (squintSlider) squintSlider.value = String(Math.round(state.squint * 100));
    if (squintSliderMob) squintSliderMob.value = String(Math.round(state.squint * 100));
    if (scaleOut) scaleOut.textContent = `${state.scaleStep.toFixed(2)}×`;
    if (contrastOut) contrastOut.textContent = `${Math.round(state.contrastGap * 100)}%`;
    if (squintOut) squintOut.textContent = `${Math.round(state.squint * 100)}%`;
    if (squintOutMob) squintOutMob.textContent = `${Math.round(state.squint * 100)}%`;

    if (hudSummary) {
      hudSummary.textContent = `主/次字号比 ${ev.sizeRatio12.toFixed(1)}× · 高光占比 ${ev.emphasisAreaPct}% · 首眼落「${ev.firstGlance.name}」`;
    }

    const okAll = ev.passCount === 4;
    if (statusPill) {
      statusPill.textContent = `${ev.passCount}/4 · ${ev.gradeLabel.replace("（示意）", "")}`;
      statusPill.dataset.state = okAll ? "ok" : "warn";
    }
    if (mobBadge) {
      mobBadge.textContent = `${ev.passCount}/4 · ${ev.gradeLabel.replace("（示意）", "")}`;
      mobBadge.dataset.state = okAll ? "ok" : "warn";
    }
    if (mobVerdict) {
      mobVerdict.textContent = ev.verdictTitle;
    }

    if (verdictTitle) verdictTitle.textContent = ev.verdictTitle;
    if (verdictBody) verdictBody.textContent = ev.verdictBody;
    if (verdictAction) verdictAction.textContent = ev.verdictAction;
    if (verdictGrade) verdictGrade.textContent = `${ev.passCount}/4 · ${ev.gradeLabel}`;
    if (ribbonEl) ribbonEl.dataset.state = okAll ? "ok" : "warn";

    for (const key of ["order", "saliency", "scan", "restraint"]) {
      const c = ev.checks[key];
      const el = ptEls[key];
      if (!el.card) continue;
      el.card.dataset.state = c.ok ? "ok" : "warn";
      if (el.badge) el.badge.textContent = c.badge;
      if (el.text) el.text.textContent = c.text;
    }

    renderTerrace();
    renderCairn(ev.cairn);
    ctrl.draw();
  }

  // 启动省电渲染循环
  const ctrl = loop(canvas, renderFrame);

  // ---------- 交互绑定 ----------
  // 1. 画布指针交互（横拖眯眼滑幕 + 单击选中信息块；触屏智能保留垂直滚动）
  let dragMode = null; // "pending" | "squint"
  let startX = 0;
  let startY = 0;
  let startSquint = 0;
  let moved = false;

  function toLogical(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      lx: ((clientX - r.left) / r.width) * W,
      ly: ((clientY - r.top) / r.height) * H,
      nx: clamp((clientX - r.left) / r.width, 0, 1),
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    startSquint = state.squint;
    moved = false;
    dragMode = "pending";
    if (e.pointerType !== "touch") {
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragMode) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (dragMode === "pending") {
      if (Math.hypot(dx, dy) < 5) return;
      if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx) * 1.15) {
        // 手机竖滑让给页面滚动
        dragMode = null;
        return;
      }
      dragMode = "squint";
      moved = true;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    if (dragMode === "squint") {
      const { nx } = toLogical(e.clientX, e.clientY);
      state.squint = clamp(1 - nx, 0, 1);
      dirtySquintDom = true;
      if (reducedMotion.matches) ctrl.draw();
    }
  });

  const endDrag = (e) => {
    if (!dragMode) return;
    const wasClick = !moved;
    dragMode = null;
    if (wasClick) {
      const { lx, ly } = toLogical(e.clientX, e.clientY);
      const hit = evalData.items.find(
        (it) => lx >= it.rect.x && lx <= it.rect.x + it.rect.w && ly >= it.rect.y && ly <= it.rect.y + it.rect.h
      );
      if (hit) {
        state.selectedId = hit.id;
        syncUI();
      }
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => { dragMode = null; });

  // 2. 键盘操作（画布聚焦时：←/→ 拖眯眼滑幕，↑/↓ 升降选中模块层级，Space 3 秒初看验序）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      state.squint = clamp(state.squint + (e.key === "ArrowLeft" ? 0.08 : -0.08), 0, 1);
      syncUI();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const id = state.selectedId;
      if (id && state.tiers[id]) {
        state.tiers[id] = clamp(state.tiers[id] + (e.key === "ArrowUp" ? -1 : 1), 1, 3);
        syncUI();
      }
    } else if (e.key === " ") {
      e.preventDefault();
      triggerScan();
    }
  });

  // 3. 三阶折面层台代理点击（选中 / 升 / 降 / 高光开关）
  if (terraceList) {
    terraceList.addEventListener("click", (e) => {
      const selBtn = e.target.closest("[data-select]");
      if (selBtn) {
        state.selectedId = selBtn.dataset.select;
        syncUI();
        return;
      }
      const moveBtn = e.target.closest("[data-move]");
      if (moveBtn) {
        const id = moveBtn.dataset.move;
        const dir = Number(moveBtn.dataset.dir);
        state.tiers[id] = clamp((state.tiers[id] || 2) + dir, 1, 3);
        state.selectedId = id;
        syncUI();
        return;
      }
      const accBtn = e.target.closest("[data-accent]");
      if (accBtn) {
        const id = accBtn.dataset.accent;
        state.accents[id] = !state.accents[id];
        state.selectedId = id;
        syncUI();
      }
    });
  }

  // 4. 滑杆、语境与快捷预设
  scenarioBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.scenario = b.dataset.scenario;
      syncUI();
    })
  );

  presetBtns.forEach((b) =>
    b.addEventListener("click", () => {
      applyPreset(state, b.dataset.preset);
      syncUI();
    })
  );

  scaleSlider?.addEventListener("input", () => {
    state.scaleStep = Number(scaleSlider.value);
    syncUI();
  });
  contrastSlider?.addEventListener("input", () => {
    state.contrastGap = Number(contrastSlider.value) / 100;
    syncUI();
  });
  const onSquintInput = (el) => {
    state.squint = Number(el.value) / 100;
    syncUI();
  };
  squintSlider?.addEventListener("input", () => onSquintInput(squintSlider));
  squintSliderMob?.addEventListener("input", () => onSquintInput(squintSliderMob));

  function triggerScan() {
    state.scanActive = true;
    state.scanTime = reducedMotion.matches ? 2.4 : 0.01;
    ctrl.draw();
  }
  scanBtn?.addEventListener("click", triggerScan);
  scanBtnMob?.addEventListener("click", triggerScan);

  const applyGood = () => {
    applyPreset(state, "classic");
    syncUI();
  };
  fixBtn?.addEventListener("click", applyGood);
  fixBtnMob?.addEventListener("click", applyGood);
  resetBtn?.addEventListener("click", () => {
    applyPreset(state, "opening");
    syncUI();
  });

  window.addEventListener("resize", () => ctrl.draw());

  // 首次同步并绘制首帧
  syncUI();
  return { state, syncUI, triggerScan };
}
