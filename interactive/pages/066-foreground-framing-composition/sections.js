// 066 前景框架构图 — 正文 01–06 节全部交互模块与高清 2D 绘图
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, contrastRatio } from "./palette.js";

function fitCanvas(canvas, cssW, cssH) {
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(cssW));
  const h = Math.max(1, Math.round(cssH));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// =========================================================================
// 01 节：三幕视线收敛对比剧场（无框裸景 / 花框反抢 / 沉静拱框）
// =========================================================================
export function initSec01() {
  const canvas = document.getElementById("sec01-canvas");
  if (!canvas) return;
  const titleEl = document.getElementById("sec01-ro-title");
  const descEl = document.getElementById("sec01-ro-desc");
  const btns = [...document.querySelectorAll("[data-gaze-step]")];

  const COPY = {
    bare: {
      title: "无前景约束：视线在四周杂景间游移",
      desc: "边缘树影、远岸与大片天空都在分流注意力，眼睛绕了三四圈才停在孤峰上，前后纵深感偏平。",
    },
    noisy: {
      title: "花纹亮框反抢：目光被锁死在吵闹边框上",
      desc: "虽然有了前景洞口，但近框的亮色粗斜纹与波点比远山更刺眼，观者第一眼盯住边框，迟迟进不到画心。",
    },
    framed: {
      title: "沉静拱框收束：外围降噪，视线一步落到孤峰",
      desc: "纯平深玫红拱门挡掉左右杂讯，顶部圆弧把目光压向留白画心，一眼读出「近拱 → 留白 → 远峰」三层纵深。",
    },
  };

  let mode = "bare";
  let animStart = 0;

  function draw(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 600;
    const cssH = cssW * 0.65;
    const { ctx, w, h } = fitCanvas(canvas, cssW, cssH);

    // 1. 远景山湖底图
    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);

    // 边缘干扰树影与杂岸（无框时暴露出来分散注意力）
    ctx.fillStyle = "#C48A8B";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.66);
    ctx.lineTo(w * 0.16, h * 0.42);
    ctx.lineTo(w * 0.28, h * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.74, h * 0.66);
    ctx.lineTo(w * 0.87, h * 0.40);
    ctx.lineTo(w, h * 0.66);
    ctx.closePath();
    ctx.fill();

    // 杂乱边角云斑
    ctx.fillStyle = "rgba(175, 90, 98, 0.34)";
    ctx.fillRect(w * 0.05, h * 0.12, w * 0.18, h * 0.08);
    ctx.fillRect(w * 0.78, h * 0.15, w * 0.16, h * 0.09);

    // 中央主体：日轮 + 深酒红主峰 + 桃粉湖
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.35, h * 0.095, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sunBlush;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.50, h * 0.43);
    ctx.lineTo(w * 0.64, h * 0.68);
    ctx.lineTo(w * 0.36, h * 0.68);
    ctx.closePath();
    ctx.fillStyle = PALETTE.peakMaroon;
    ctx.fill();

    ctx.fillStyle = PALETTE.waterPeach;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // 2. 前景层（按模式）
    if (mode === "noisy" || mode === "framed") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      const r = h * 0.42;
      ctx.moveTo(w * 0.5 + r, h * 0.52);
      ctx.arc(w * 0.5, h * 0.52, r, 0, Math.PI * 2, true);
      ctx.clip("evenodd");

      if (mode === "noisy") {
        ctx.fillStyle = "#F5BEB0";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#8C1D2C";
        ctx.lineWidth = 4;
        for (let x = -h; x < w + h; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + h, h);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = PALETTE.archCoral;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = PALETTE.pillarBurgundy;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.48);
        ctx.quadraticCurveTo(w * 0.16, h * 0.80, w * 0.42, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. 视线落点与路径推演（示意）
    const pts =
      mode === "bare"
        ? [[0.14, 0.16], [0.85, 0.20], [0.84, 0.50], [0.16, 0.52], [0.50, 0.54]]
        : mode === "noisy"
          ? [[0.16, 0.25], [0.82, 0.30], [0.18, 0.72], [0.78, 0.74], [0.50, 0.54]]
          : [[0.50, 0.20], [0.50, 0.36], [0.50, 0.54]];

    const prog = still ? 1 : Math.min(1, ((t - animStart) % 3.4) / 2.2);
    const totalSeg = pts.length - 1;
    const strokeColor = mode === "framed" ? PALETTE.okLight : PALETTE.errLight;

    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length; i++) {
      const segStart = (i - 1) / totalSeg;
      const segEnd = i / totalSeg;
      if (prog <= segStart) break;
      const frac = Math.min(1, (prog - segStart) / (segEnd - segStart));
      const x = (pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * frac) * w;
      const y = (pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * frac) * h;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 标号圆点 1..N
    for (let i = 0; i < pts.length; i++) {
      const threshold = i / totalSeg;
      if (prog + 0.04 < threshold) continue;
      const x = pts[i][0] * w;
      const y = pts[i][1] * h;
      const isFinal = i === pts.length - 1;
      ctx.beginPath();
      ctx.arc(x, y, isFinal ? 13 : 10, 0, Math.PI * 2);
      ctx.fillStyle = isFinal && mode === "framed" ? PALETTE.okLight : isFinal ? PALETTE.inkMaroon : PALETTE.paperLight;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      ctx.fillStyle = isFinal ? PALETTE.paperLight : strokeColor;
      ctx.font = `600 ${isFinal ? 12 : 11}px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x, y + 0.5);
    }

    // 底部角落清晰标出「示意视线路径」
    ctx.fillStyle = "rgba(58, 11, 20, 0.88)";
    ctx.fillRect(10, h - 30, 174, 22);
    ctx.fillStyle = PALETTE.paperLight;
    ctx.font = `500 11px "Noto Serif SC", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      mode === "framed" ? "视线落点（示意）：3 步直达" : `视线落点（示意）：散游 ${pts.length} 处`,
      18,
      h - 19
    );
    ctx.restore();
  }

  const runner = loop(canvas, draw);

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.gazeStep;
      animStart = performance.now() / 1000;
      btns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      titleEl.textContent = COPY[mode].title;
      descEl.textContent = COPY[mode].desc;
      runner.draw();
    });
  });

  new ResizeObserver(() => runner.draw()).observe(canvas);
}

// =========================================================================
// 02 节：四种经典框架语言 × 四套跨题材换景标本墙
// =========================================================================
export function initSec02() {
  const canvases = [...document.querySelectorAll("[data-s2-canvas]")];
  if (!canvases.length) return;
  const subBtns = [...document.querySelectorAll("[data-s2-subject]")];
  const inspBtns = [...document.querySelectorAll("[data-s2-inspect]")];
  const cards = [...document.querySelectorAll("[data-s2-card]")];
  const detTitle = document.getElementById("sec02-detail-title");
  const detText = document.getElementById("sec02-detail-text");

  const DETAILS = {
    natural: {
      title: "自然框架 · 靠有机弧线化硬为柔",
      text: "枝叶留出的框口不必对称，但要清出主体周围一圈亮天光；切忌细碎枯枝穿过主体肩头或山尖。",
    },
    geometric: {
      title: "几何框架 · 直线锐角立起现代秩序",
      text: "菱形与矩形窗格自带强方向箭头，能把观者目光精准锁在几何对角线交汇处；适合建筑、书籍封面与展览视觉。",
    },
    arch: {
      title: "拱形框架 · 圆弧收顶，仪式与纵深兼得",
      text: "顶部拱弧像一双轻轻向内合拢的手，最稳妥也最有「穿门入画」的剧场感；对应 066 原海报主结构。",
    },
    occlude: {
      title: "遮挡框架 · 半围不封死，最克制的真实感",
      text: "只用一侧暗墙与对角斜坡遮掉外围杂景，留出大片开口呼吸；纪实摄影和街拍中最不容易显得刻意摆拍。",
    },
  };

  let subject = "peak";
  let inspected = "natural";

  function drawSubject(ctx, w, h) {
    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);

    if (subject === "peak") {
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.36, h * 0.095, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.sunBlush;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.50, h * 0.44);
      ctx.lineTo(w * 0.67, h * 0.68);
      ctx.lineTo(w * 0.33, h * 0.68);
      ctx.closePath();
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.fill();
      ctx.fillStyle = PALETTE.waterPeach;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
    } else if (subject === "walker") {
      // 街巷暖光地面 + 简洁人物背影（零五官）
      ctx.fillStyle = "#F5DFD2";
      ctx.fillRect(0, h * 0.64, w, h * 0.36);
      ctx.fillStyle = "#E8B0AA";
      ctx.fillRect(w * 0.30, h * 0.24, w * 0.40, h * 0.40);
      ctx.fillStyle = "#FFF7EE";
      ctx.fillRect(w * 0.36, h * 0.29, w * 0.28, h * 0.35);
      // 人物背影剪影
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.44, h * 0.048, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.50);
      ctx.quadraticCurveTo(w * 0.50, h * 0.47, w * 0.56, h * 0.50);
      ctx.lineTo(w * 0.58, h * 0.72);
      ctx.lineTo(w * 0.42, h * 0.72);
      ctx.closePath();
      ctx.fill();
    } else if (subject === "vase") {
      // 窗台光影 + 极简深酒红陶瓶
      ctx.fillStyle = "#F2D3C6";
      ctx.fillRect(0, h * 0.69, w, h * 0.31);
      ctx.beginPath();
      ctx.arc(w * 0.58, h * 0.34, h * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "#F4C2B5";
      ctx.fill();
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.38);
      ctx.lineTo(w * 0.54, h * 0.38);
      ctx.bezierCurveTo(w * 0.61, h * 0.52, w * 0.59, h * 0.66, w * 0.54, h * 0.71);
      ctx.lineTo(w * 0.46, h * 0.71);
      ctx.bezierCurveTo(w * 0.41, h * 0.66, w * 0.39, h * 0.52, w * 0.46, h * 0.38);
      ctx.closePath();
      ctx.fill();
    } else {
      // 平面海报字心：居中文案块 + 细线装饰
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.font = `900 ${Math.round(h * 0.135)}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("秋展", w * 0.50, h * 0.45);
      ctx.font = `600 ${Math.round(h * 0.052)}px "Outfit", sans-serif`;
      ctx.fillStyle = PALETTE.roseTextSafe;
      ctx.fillText("AUTUMN · 2026", w * 0.50, h * 0.58);
      ctx.fillStyle = PALETTE.coral;
      ctx.fillRect(w * 0.43, h * 0.635, w * 0.14, 2.5);
    }
  }

  function drawOne(canvas) {
    const kind = canvas.dataset.s2Canvas;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 300;
    const cssH = cssW * 0.84;
    const { ctx, w, h } = fitCanvas(canvas, cssW, cssH);

    drawSubject(ctx, w, h);

    // 挖洞绘制对应原型前景框架
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    if (kind === "natural") {
      const r0 = Math.min(w, h) * 0.37;
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const r = r0 * (1 + 0.09 * Math.cos(a * 3 + 0.4) + 0.06 * Math.sin(a * 5 - 0.8));
        const x = w * 0.5 + Math.cos(a) * r;
        const y = h * 0.5 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (kind === "geometric") {
      const rx = w * 0.39;
      const ry = h * 0.42;
      ctx.moveTo(w * 0.5, h * 0.5 - ry);
      ctx.lineTo(w * 0.5 + rx, h * 0.5);
      ctx.lineTo(w * 0.5, h * 0.5 + ry);
      ctx.lineTo(w * 0.5 - rx, h * 0.5);
      ctx.closePath();
    } else if (kind === "arch") {
      const r = Math.min(w, h) * 0.34;
      ctx.moveTo(w * 0.5 - r, h * 0.88);
      ctx.lineTo(w * 0.5 - r, h * 0.45);
      ctx.arc(w * 0.5, h * 0.45, r, Math.PI, 0, false);
      ctx.lineTo(w * 0.5 + r, h * 0.88);
      ctx.closePath();
    } else {
      // occlude 半围合：左窄柱 + 右下斜坡建筑影
      ctx.moveTo(w * 0.16, h * 0.06);
      ctx.lineTo(w * 0.94, h * 0.06);
      ctx.lineTo(w * 0.94, h * 0.52);
      ctx.lineTo(w * 0.56, h * 0.92);
      ctx.lineTo(w * 0.16, h * 0.92);
      ctx.closePath();
    }
    ctx.clip("evenodd");
    ctx.fillStyle = kind === "arch" ? PALETTE.plumCard : kind === "geometric" ? PALETTE.plumCardAlt : kind === "natural" ? "#6E2D33" : PALETTE.archCoral;
    ctx.fillRect(0, 0, w, h);

    if (kind === "occlude") {
      ctx.fillStyle = PALETTE.pillarBurgundy;
      ctx.fillRect(0, 0, w * 0.16, h);
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 构造线解剖（选中卡片展开）
    if (inspected === kind) {
      ctx.save();
      ctx.strokeStyle = PALETTE.okLight;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      // 四角指向画心的虚箭
      const corners = [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx * w, cy * h);
        ctx.lineTo((cx + (0.5 - cx) * 0.52) * w, (cy + (0.5 - cy) * 0.52) * h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.okLight;
      ctx.fill();
      ctx.restore();
    }
  }

  function redrawAll() {
    canvases.forEach(drawOne);
  }

  subBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      subject = btn.dataset.s2Subject;
      subBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      redrawAll();
    });
  });

  inspBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      inspected = btn.dataset.s2Inspect;
      inspBtns.forEach((b) => {
        const on = b.dataset.s2Inspect === inspected;
        b.setAttribute("aria-pressed", String(on));
        b.textContent = on ? "构造线：开" : "查看构造线";
      });
      cards.forEach((c) => c.classList.toggle("is-selected", c.dataset.s2Card === inspected));
      detTitle.textContent = DETAILS[inspected].title;
      detText.textContent = DETAILS[inspected].text;
      redrawAll();
    });
  });

  redrawAll();
  new ResizeObserver(redrawAll).observe(canvases[0]);
}

// =========================================================================
// 03 节：深酒红光学暗房 · 光圈景深 × 前景明暗极性矩阵
// =========================================================================
export function initSec03() {
  const canvas = document.getElementById("sec03-canvas");
  if (!canvas) return;
  const blurBtns = [...document.querySelectorAll("[data-s3-blur]")];
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];
  const dmBlur = document.getElementById("dm-blur");
  const dmContrast = document.getElementById("dm-contrast");
  const dmVerdict = document.getElementById("dm-verdict");
  const diagBox = document.getElementById("sec03-diag");
  const diagH = document.getElementById("sec03-diag-h");
  const diagP = document.getElementById("sec03-diag-p");

  let blurMode = "shallow";
  let toneMode = "dark-bright";

  const BLUR_CFG = {
    shallow: { px: 10, label: "焦外柔化 f/1.8" },
    mid: { px: 3.5, label: "柔边清晰 f/5.6" },
    deep: { px: 0, label: "全景锐利 f/16" },
  };

  const TONE_CFG = {
    "dark-bright": { fgHex: "#24060C", bgHex: "#FBF0E4", noisy: false },
    "flat-poster": { fgHex: PALETTE.archCoral, bgHex: PALETTE.archInner, noisy: false },
    "bright-busy": { fgHex: "#F5C2B2", bgHex: PALETTE.archInner, noisy: true },
  };

  function render() {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 620;
    const cssH = cssW * 0.64;
    const { ctx, w, h } = fitCanvas(canvas, cssW, cssH);
    const cfg = TONE_CFG[toneMode];
    const bCfg = BLUR_CFG[blurMode];

    // 1. 清晰对焦的远景主画面（永远清晰）
    ctx.fillStyle = cfg.bgHex;
    ctx.fillRect(0, 0, w, h);

    // 远景建筑拱廊与阳光剪影
    ctx.fillStyle = "#E9A5A1";
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.34, h * 0.11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.peakMaroon;
    ctx.beginPath();
    ctx.moveTo(w * 0.50, h * 0.42);
    ctx.lineTo(w * 0.66, h * 0.69);
    ctx.lineTo(w * 0.34, h * 0.69);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.waterPeach;
    ctx.fillRect(0, h * 0.69, w, h * 0.31);

    // 2. 前景门框层（应用光学景深柔边模拟，不依赖慢滤镜，用多层柔羽稳定 60fps）
    const r = h * 0.40;
    const cx = w * 0.50;
    const cy = h * 0.52;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.clip("evenodd");

    ctx.fillStyle = cfg.fgHex;
    ctx.fillRect(0, 0, w, h);

    if (cfg.noisy) {
      // 高频雕花菱格亮框花纹
      const alpha = blurMode === "shallow" ? 0.28 : blurMode === "mid" ? 0.58 : 0.90;
      ctx.strokeStyle = `rgba(140, 38, 52, ${alpha})`;
      ctx.lineWidth = blurMode === "shallow" ? 6 : 2.6;
      const step = 26;
      for (let x = -h; x < w + h; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.fillStyle = `rgba(255, 248, 240, ${alpha})`;
      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, blurMode === "shallow" ? 6.5 : 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (toneMode === "dark-bright" && blurMode === "deep") {
      // f/16 全景锐利时前景砖缝纹理可见
      ctx.strokeStyle = "rgba(238, 170, 166, 0.14)";
      ctx.lineWidth = 1;
      for (let y = 24; y < h; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 丝滑径向渐变模拟光学焦外散景柔边（无阶梯色带）
    if (bCfg.px > 0) {
      const feather = bCfg.px * 3.1;
      const innerR = Math.max(4, r - feather);
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, r + 2);
      const rgb =
        toneMode === "dark-bright"
          ? "36, 6, 12"
          : toneMode === "flat-poster"
            ? "210, 116, 120"
            : "245, 194, 178";
      grad.addColorStop(0, `rgba(${rgb}, 0)`);
      grad.addColorStop(0.55, `rgba(${rgb}, 0.28)`);
      grad.addColorStop(0.88, `rgba(${rgb}, 0.72)`);
      grad.addColorStop(1, `rgba(${rgb}, 0.96)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 更新实算指标与白话诊单
    const ratio = contrastRatio(cfg.fgHex, cfg.bgHex);
    dmBlur.textContent = bCfg.label;
    dmContrast.textContent = `${ratio.toFixed(1)} : 1`;

    const bad = toneMode === "bright-busy" && blurMode !== "shallow";
    const borderline = toneMode === "bright-busy" && blurMode === "shallow";

    if (bad) {
      dmVerdict.textContent = "前景抢戏";
      dmVerdict.className = "dm-v is-err";
      diagBox.className = "dark-diag is-err";
      diagH.textContent = "亮纹 + 清晰景深：前景彻底反客为主";
      diagP.textContent = "当花哨高反差前景也被拍得一清二楚时，框比画心更抓人眼球。摄影上要么开大光圈虚化近景，要么退一步换纯暗门框。";
    } else if (borderline) {
      dmVerdict.textContent = "勉强可用";
      dmVerdict.className = "dm-v";
      diagBox.className = "dark-diag is-err";
      diagH.textContent = "虚化救了一半，但亮框仍在漏光分心";
      diagP.textContent = "f/1.8 把近处花纹揉糊了不少，但前景本身明度太接近画心（反差仅 " + ratio.toFixed(1) + ":1），边界感偏弱；换成暗框或纯平玫瑰色会立得更稳。";
    } else if (toneMode === "flat-poster") {
      dmVerdict.textContent = "纯平退让";
      dmVerdict.className = "dm-v is-ok";
      diagBox.className = "dark-diag";
      diagH.textContent = "平面海报解法：零纹饰纯平色块 + 清晰硬边";
      diagP.textContent = "066 原海报正是这套思路：前景不做虚化，而是用整片零细节的玫瑰珊瑚红压低信息密度，把最高明暗反差留给深酒红山峰。";
    } else {
      dmVerdict.textContent = "安静退让";
      dmVerdict.className = "dm-v is-ok";
      diagBox.className = "dark-diag";
      diagH.textContent =
        blurMode === "shallow"
          ? "暗框 + 虚化：双重降噪，目光直坠亮景"
          : "暗框压底：靠 " + ratio.toFixed(1) + ":1 高明暗差把视线推向画心";
      diagP.textContent =
        blurMode === "shallow"
          ? "前景门廊既处于暗部又在焦外柔化，人眼会自动忽略近处轮廓，把全部辨认算力交给框内清晰发亮的主体。"
          : "即便小光圈让前景结构清晰，只要前景落入低亮暗部且无亮杂纹，观者依然会顺着暗洞被明亮画心吸进去。";
    }
  }

  blurBtns.forEach((b) => {
    b.addEventListener("click", () => {
      blurMode = b.dataset.s3Blur;
      blurBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      render();
    });
  });

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      toneMode = b.dataset.s3Mode;
      modeBtns.forEach((x) => x.classList.toggle("is-active", x === b));
      render();
    });
  });

  render();
  new ResizeObserver(render).observe(canvas);
}

// =========================================================================
// 04 节：五个历史里程碑可交互构图蓝图灯箱
// =========================================================================
export function initSec04() {
  const canvas = document.getElementById("sec04-canvas");
  if (!canvas) return;
  const tabs = [...document.querySelectorAll("[data-hist]")];
  const kicker = document.getElementById("hist-kicker");
  const title = document.getElementById("hist-title");
  const body = document.getElementById("hist-body");
  const fact = document.getElementById("hist-fact");

  const ITEMS = [
    {
      kicker: "文艺复兴透视起点 · 1435",
      title: "阿尔贝蒂：把画幅当成一扇「敞开的窗」",
      body: "意大利人文主义者兼建筑师莱昂·巴蒂斯塔·阿尔贝蒂在 1435 年著作《论绘画》（De pictura）中写下著名比喻：作画之初先在表面画一个矩形，把它当成一扇敞开的窗（finestra aperta），透过窗口望向背后的叙事空间。外框由此从物理画边升级成空间取景口。",
      fact: "构图启发：矩形画幅本身是第一层框，前景框架则是在画内再立一道门槛，强化「透过窗口看世界」的纵深错觉。",
    },
    {
      kicker: "中国明代造园专著 · 1631 成书 / 1634 刊刻",
      title: "计成《园冶》：月洞门与漏窗的实景框景",
      body: "明代造园家计成在《园冶》中专论门窗、洞门与借景，提出「巧于因借，精在体宜」。江南私家园林体量不大，却靠圆月门、海棠窗与曲廊墙洞把园外远山、古塔裁成步移景异的立面画卷——人每走一步，近处洞门与远景的相对视差都在重画一张前景框架构图。",
      fact: "构图启发：066 原海报里的巨幅圆形月洞门，正承袭了中式园林「借洞门裁山水」的空间语言。",
    },
    {
      kicker: "荷兰黄金时代 · 1658 / 约 1669–1670",
      title: "德·霍赫与维米尔：暗厅门框里的穿门透景",
      body: "17 世纪荷兰风俗画将近景推远法（repoussoir）与穿门透景（doorkijkje）推向高峰：彼得·德·霍赫在《代尔夫特一户人家的庭院》（1658）借砖拱廊框住阳光庭院；维米尔在《情书》（约 1669–1670）让观者站在昏暗前厅，隔着垂帘与门框窥见明亮内室。",
      fact: "构图启发：暗前景包亮主体不只拉开纵深，还会立刻生成「偷窥与私密」的叙事张力。",
    },
    {
      kicker: "浮世绘极近景突破 · 1857",
      title: "歌川广重《名所江户百景·龟户梅屋敷》",
      body: "1857 年刊行的木版画《龟户梅屋敷》里，歌川广重把一截极近处的卧龙梅粗干横斜切过画面最前排，观者被迫隔着粗大枝干的缝隙望向远方低小的游人与梅林。这种大胆的前景裁剪震撼了欧洲画坛，1887 年梵高曾专门临摹此作。",
      fact: "构图启发：前景框架不必规整居中，极近处的粗枝与斜干照样能压出惊人的远近尺度反差。",
    },
    {
      kicker: "电影史经典画中画 · 1956",
      title: "约翰·福特《搜索者》：开合之间的暗室门框",
      body: "1956 年西部片《搜索者》（1989 年首批入选美国国会图书馆国家影片登记表）以一道漆黑室内门框首尾呼应：片头推门，刺眼荒漠里的孤身骑手落入矩形门洞；片尾家人在暗屋内团聚，主人公独自转身走回亮白荒原，门扇缓缓关合将他隔绝在框外。",
      fact: "构图启发：前景框架的边缘就是心理边界——谁在框内、谁在框外，不写一句台词也能讲清人物命运。",
    },
  ];

  let idx = 0;

  function drawDiagram() {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 480;
    const cssH = cssW * 0.69;
    const { ctx, w, h } = fitCanvas(canvas, cssW, cssH);

    ctx.fillStyle = PALETTE.paperCream;
    ctx.fillRect(0, 0, w, h);

    // 淡建筑格线
    ctx.strokeStyle = "rgba(58, 11, 20, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 6) * i, 0);
      ctx.lineTo((w / 6) * i, h);
      ctx.stroke();
    }

    if (idx === 0) {
      // 1435 Alberti: 敞开的窗与透视线束
      ctx.strokeStyle = PALETTE.inkMaroon;
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      const vpX = w * 0.50;
      const vpY = h * 0.50;
      [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x * w, y * h);
        ctx.lineTo(vpX, vpY);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath();
      ctx.arc(vpX, vpY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.roseTextSafe;
      ctx.font = `600 12px "Outfit", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("FINESTRA APERTA · 1435", vpX, h * 0.93);
    } else if (idx === 1) {
      // 1631/1634 园冶：白粉墙月洞门框住远山与小亭
      ctx.fillStyle = PALETTE.archInner;
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.66);
      ctx.lineTo(w * 0.50, h * 0.42);
      ctx.lineTo(w * 0.68, h * 0.66);
      ctx.closePath();
      ctx.fillStyle = PALETTE.midHillPlum;
      ctx.fill();
      ctx.fillStyle = PALETTE.sunBlush;
      ctx.beginPath();
      ctx.arc(w * 0.58, h * 0.34, h * 0.07, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.moveTo(w * 0.50 + h * 0.36, h * 0.50);
      ctx.arc(w * 0.50, h * 0.50, h * 0.36, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      ctx.fillStyle = PALETTE.pillarBurgundy;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      ctx.strokeStyle = PALETTE.blushArc;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.50, h * 0.36, 0, Math.PI * 2);
      ctx.stroke();
    } else if (idx === 2) {
      // 1658 / 1670 荷兰穿门透景：前厅暗门框 + 左侧垂帘 + 亮室窗光
      ctx.fillStyle = "#FFF6EB";
      ctx.fillRect(w * 0.30, h * 0.14, w * 0.44, h * 0.72);
      // 格子地板透视
      ctx.fillStyle = PALETTE.waterPeach;
      ctx.beginPath();
      ctx.moveTo(w * 0.30, h * 0.66);
      ctx.lineTo(w * 0.74, h * 0.66);
      ctx.lineTo(w * 0.84, h * 0.86);
      ctx.lineTo(w * 0.22, h * 0.86);
      ctx.closePath();
      ctx.fill();
      // 内室简洁双人背/侧剪影（零五官）
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath();
      ctx.arc(w * 0.53, h * 0.45, h * 0.048, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.49, h * 0.50, w * 0.08, h * 0.20);
      // 深暗前厅门框 + 垂帘
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.fillRect(0, 0, w * 0.30, h);
      ctx.fillRect(w * 0.74, 0, w * 0.26, h);
      ctx.fillRect(0, 0, w, h * 0.14);
      ctx.fillRect(0, h * 0.86, w, h * 0.14);
      // 左侧垂帘斜角
      ctx.fillStyle = PALETTE.plumCard;
      ctx.beginPath();
      ctx.moveTo(w * 0.30, h * 0.14);
      ctx.lineTo(w * 0.46, h * 0.14);
      ctx.quadraticCurveTo(w * 0.36, h * 0.36, w * 0.30, h * 0.50);
      ctx.closePath();
      ctx.fill();
    } else if (idx === 3) {
      // 1857 歌川广重：极近粗梅干横劈前景 + 远景小树与游人剪影
      ctx.fillStyle = "#FBECE0";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.blushArc;
      ctx.fillRect(0, 0, w, h * 0.28);
      ctx.fillStyle = "#E8C3B5";
      ctx.fillRect(0, h * 0.64, w, h * 0.36);
      // 远方矮小主体剪影
      ctx.fillStyle = PALETTE.midHillPlum;
      ctx.beginPath();
      ctx.arc(w * 0.62, h * 0.61, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.605, h * 0.63, 12, 24);
      // 极近粗梅干（形成前景框口）
      ctx.strokeStyle = PALETTE.inkMaroon;
      ctx.lineCap = "round";
      ctx.lineWidth = h * 0.12;
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 1.04);
      ctx.quadraticCurveTo(w * 0.28, h * 0.48, w * 0.12, h * 0.04);
      ctx.stroke();
      ctx.lineWidth = h * 0.085;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.44);
      ctx.quadraticCurveTo(w * 0.56, h * 0.28, w * 0.96, h * 0.40);
      ctx.stroke();
    } else {
      // 1956 搜索者：漆黑暗室矩形门框 + 荒漠强光与孤身背影
      ctx.fillStyle = "#2A060E";
      ctx.fillRect(0, 0, w, h);
      // 亮白矩形门洞
      ctx.fillStyle = "#FFF7EC";
      ctx.fillRect(w * 0.36, h * 0.14, w * 0.28, h * 0.72);
      // 远方孤丘地平线
      ctx.fillStyle = PALETTE.waterPeach;
      ctx.fillRect(w * 0.36, h * 0.62, w * 0.28, h * 0.24);
      ctx.fillStyle = PALETTE.coral;
      ctx.fillRect(w * 0.41, h * 0.54, w * 0.08, h * 0.08);
      ctx.fillRect(w * 0.54, h * 0.52, w * 0.07, h * 0.10);
      // 门口孤身牛仔背影剪影（戴帽轮廓，零五官）
      ctx.fillStyle = "#2A060E";
      ctx.fillRect(w * 0.468, h * 0.48, w * 0.064, h * 0.018); // 帽檐
      ctx.fillRect(w * 0.482, h * 0.455, w * 0.036, h * 0.025); // 帽顶
      ctx.fillRect(w * 0.478, h * 0.51, w * 0.044, h * 0.22); // 身躯剪影
    }
  }

  function update() {
    const it = ITEMS[idx];
    kicker.textContent = it.kicker;
    title.textContent = it.title;
    body.textContent = it.body;
    fact.textContent = it.fact;
    tabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    drawDiagram();
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      idx = Number(t.dataset.hist);
      update();
    });
  });

  update();
  new ResizeObserver(drawDiagram).observe(canvas);
}

// =========================================================================
// 05 节：四个真实场景「套框 / 撤框」实地对照拨片
// =========================================================================
export function initSec05() {
  const canvas = document.getElementById("sec05-canvas");
  if (!canvas) return;
  const scTabs = [...document.querySelectorAll("[data-sc]")];
  const modeBtns = [...document.querySelectorAll("[data-sc-apply]")];
  const verdict = document.getElementById("sc-verdict");
  const titleEl = document.getElementById("sc-title");
  const descEl = document.getElementById("sc-desc");
  const altEl = document.getElementById("sc-alt");

  const SCENARIOS = {
    street: {
      goodWithFrame: true,
      with: {
        verdict: "适合用前景框架 · 遮丑聚焦",
        ok: true,
        title: "街景两侧杂牌林立：前景门洞直接替你「遮丑」",
        desc: "退后两步借近处深色门廊框住远处行人背影，左右杂乱招牌与停放车辆被暗框挡掉，现场纵深与聚焦感瞬间立住。",
        alt: "切到「撤掉前景框」看看：没了暗框遮挡，街边杂牌会直接和主体抢戏。",
      },
      without: {
        verdict: "撤框后背景杂乱分散焦点",
        ok: false,
        title: "没有前景遮罩，杂乱招牌和行人一起挤满画面",
        desc: "左右花哨告示牌、电线杆与行人处于同一明度层，观者需要自己从乱背景里抠出主体，画面显得平淡零散。",
        alt: "这种背景杂乱的实拍场景，正是前景框架大显身手的时候。",
      },
    },
    blueprint: {
      goodWithFrame: false,
      with: {
        verdict: "不建议用 · 关键结构被遮挡",
        ok: false,
        title: "强套前景拱框，直接切掉了建筑立面两侧尺度",
        desc: "建筑立面图、产品白底主图与信息图要求完整交代轮廓尺寸。前景框架把左右翼立柱和尺寸标注挡在框外，破坏了核心功能信息。",
        alt: "点「撤掉前景框」查看无遮挡完整立面方案。",
      },
      without: {
        verdict: "撤框正确 · 信息完整无遮挡",
        ok: true,
        title: "撤掉前景框，建筑比例与结构标注一览无余",
        desc: "精密测绘、工业产品与高密度数据页面需要的是开阔干净的纯底或正交透视，不要为了造型硬加前景遮挡。",
        alt: "若仍需表现立体结构，可改用 071 两点透视或 075 等距构图。",
      },
    },
    panorama: {
      goodWithFrame: false,
      with: {
        verdict: "不建议用 · 浩瀚全景被憋成小洞",
        ok: false,
        title: "广袤地平线被硬框截断，史诗辽阔感消失",
        desc: "雪原、海岸与星河靠的是左右无限延展的呼吸感。套上厚重前景框之后，画面被锁成窥视孔，反而显得局促小气。",
        alt: "点「撤掉前景框」感受无边延展的全景张力。",
      },
      without: {
        verdict: "撤框正确 · 地平线自由延展",
        ok: true,
        title: "放开四边，宽阔地平线与天际线自然舒展",
        desc: "当你想传达的是「开阔、自由、宏大」而非「聚焦、私密、纵深通道」时，不要给画面强加前景框架。",
        alt: "可以只留极低矮的前景地势（065 前中后景），而不要围合四边。",
      },
    },
    thumb: {
      goodWithFrame: false,
      with: {
        verdict: "不建议用 · 小图里主体缩成模糊小点",
        ok: false,
        title: "缩略图硬套厚前景框，有效主视觉只剩不到四成",
        desc: "在手机信息流 160px 宽的小卡里，前景边框白白吃掉大半像素，框里主体缩得几乎看不清，直接拉低点击辨识度。",
        alt: "点「撤掉前景框」，让主体撑满卡片视觉重心。",
      },
      without: {
        verdict: "撤框正确 · 小尺寸下清晰醒目",
        ok: true,
        title: "撤去冗余外框，主体大而清晰、一眼可认",
        desc: "小尺寸封面和列表缩略图首要目标是秒级识别，留出简洁底色放大主体，远比在方寸之间硬塞画中框有效。",
        alt: "仅在海报、全屏头图或桌面大图等充裕画幅中再启用前景框架。",
      },
    },
  };

  let curSc = "street";
  let withFrame = true;

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 520;
    const cssH = cssW * 0.61;
    const { ctx, w, h } = fitCanvas(canvas, cssW, cssH);

    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);

    if (curSc === "street") {
      // 杂乱街景：两侧花哨招牌 + 远方行人背影
      ctx.fillStyle = "#EBD1C6";
      ctx.fillRect(0, h * 0.66, w, h * 0.34);
      // 两侧杂牌（放在外缘区，撤框时喧宾夺主，套暗框后被干净遮除）
      const signs = [
        [0.03, 0.14, 0.15, 0.38, "#B55D63"],
        [0.10, 0.25, 0.11, 0.26, "#E39B94"],
        [0.82, 0.16, 0.15, 0.40, "#8E3F49"],
        [0.77, 0.28, 0.10, 0.24, "#D78A86"],
      ];
      for (const [x, y, sw, sh, c] of signs) {
        ctx.fillStyle = c;
        ctx.fillRect(x * w, y * h, sw * w, sh * h);
        ctx.fillStyle = PALETTE.paperLight;
        ctx.fillRect((x + 0.02) * w, (y + 0.05) * h, (sw - 0.04) * w, 4);
        ctx.fillRect((x + 0.02) * w, (y + 0.12) * h, (sw - 0.06) * w, 4);
      }
      // 主体背影（零五官）
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.beginPath();
      ctx.arc(w * 0.50, h * 0.45, h * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.465, h * 0.51, w * 0.07, h * 0.21);
    } else if (curSc === "blueprint") {
      // 建筑立面测绘图
      ctx.strokeStyle = "rgba(58, 11, 20, 0.12)";
      for (let x = 20; x < w; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.fillStyle = PALETTE.pillarBurgundy;
      ctx.fillRect(w * 0.14, h * 0.34, w * 0.72, h * 0.42);
      ctx.fillStyle = PALETTE.paperLight;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(w * (0.18 + i * 0.112), h * 0.42, w * 0.07, h * 0.24);
      }
      // 顶部尺寸线
      ctx.strokeStyle = PALETTE.roseTextSafe;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.24);
      ctx.lineTo(w * 0.86, h * 0.24);
      ctx.stroke();
      ctx.fillStyle = PALETTE.roseTextSafe;
      ctx.font = `500 12px "DM Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("WIDTH 36.0 M", w * 0.50, h * 0.20);
    } else if (curSc === "panorama") {
      // 无垠雪原与星河天际线
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
      grad.addColorStop(0, "#3A0B14");
      grad.addColorStop(1, "#A3505A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.72);
      // 远山全景横贯全宽
      ctx.fillStyle = "#531A26";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.lineTo(w * 0.34, h * 0.64);
      ctx.lineTo(w * 0.55, h * 0.46);
      ctx.lineTo(w * 0.76, h * 0.62);
      ctx.lineTo(w * 0.90, h * 0.52);
      ctx.lineTo(w, h * 0.68);
      ctx.lineTo(w, h * 0.72);
      ctx.closePath();
      ctx.fill();
      // 星点
      ctx.fillStyle = PALETTE.paperLight;
      [[0.12, 0.16], [0.24, 0.25], [0.42, 0.14], [0.64, 0.22], [0.80, 0.15], [0.89, 0.29], [0.33, 0.34]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx * w, sy * h, 2.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = PALETTE.waterPeach;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    } else {
      // 模拟手机信息流里的 160px 小缩略图卡片
      ctx.fillStyle = "#E9DFD6";
      ctx.fillRect(0, 0, w, h);
      const cw = w * 0.36;
      const ch = h * 0.76;
      const cx = (w - cw) / 2;
      const cy = (h - ch) / 2;
      ctx.fillStyle = PALETTE.paperLight;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = PALETTE.inkMaroon;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx, cy, cw, ch);
      // 卡片内主图区
      const ih = ch * 0.64;
      ctx.fillStyle = PALETTE.archInner;
      ctx.fillRect(cx + 8, cy + 8, cw - 16, ih);
      // 主体陶瓶（套框时被挤极小，撤框时饱满醒目）
      const scale = withFrame ? 0.45 : 1.0;
      const vx = cx + cw / 2;
      const vy = cy + 8 + ih * 0.56;
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath();
      ctx.ellipse(vx, vy, 18 * scale, 28 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      if (withFrame) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx + 8, cy + 8, cw - 16, ih);
        ctx.moveTo(vx + 24, vy);
        ctx.arc(vx, vy, 24, 0, Math.PI * 2, true);
        ctx.clip("evenodd");
        ctx.fillStyle = PALETTE.pillarBurgundy;
        ctx.fillRect(cx + 8, cy + 8, cw - 16, ih);
        ctx.restore();
      }
      // 模拟小卡片文字行
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.fillRect(cx + 12, cy + ih + 20, cw * 0.62, 7);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillRect(cx + 12, cy + ih + 34, cw * 0.44, 5);
      return;
    }

    // 除缩略图外，套上前景暗拱框对照
    if (withFrame) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      const r = h * 0.39;
      ctx.moveTo(w * 0.50 + r, h * 0.52);
      ctx.arc(w * 0.50, h * 0.52, r, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      ctx.fillStyle = PALETTE.pillarBurgundy;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  function update() {
    const info = SCENARIOS[curSc][withFrame ? "with" : "without"];
    verdict.textContent = info.verdict;
    verdict.className = `sc-verdict ${info.ok ? "is-ok" : "is-err"}`;
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    altEl.textContent = info.alt;
    scTabs.forEach((b) => b.classList.toggle("is-active", b.dataset.sc === curSc));
    modeBtns.forEach((b) => b.classList.toggle("is-active", (b.dataset.scApply === "with") === withFrame));
    draw();
  }

  scTabs.forEach((b) => b.addEventListener("click", () => { curSc = b.dataset.sc; withFrame = true; update(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { withFrame = b.dataset.scApply === "with"; update(); }));
  update();
  new ResizeObserver(draw).observe(canvas);
}

// =========================================================================
// 06 节：挑一挑单变量小练习（2 题，中性标签，选完逐项亮线讲评）
// =========================================================================
export function initSec06() {
  const canvases = [...document.querySelectorAll("[data-quiz-c]")];
  if (!canvases.length) return;
  const qTabs = [...document.querySelectorAll("[data-q-index]")];
  const cards = [...document.querySelectorAll(".quiz-card")];
  const promptEl = document.getElementById("quiz-prompt");
  const fbBox = document.getElementById("quiz-feedback");
  const fbStatus = document.getElementById("qf-status");
  const fbExplain = document.getElementById("qf-explain");
  const fbList = document.getElementById("qf-breakdown");
  const retryBtn = document.getElementById("btn-quiz-retry");

  const QUESTIONS = [
    {
      prompt: "下面四张「古镇石拱晨雾」海报，画幅、色系与远山独舟完全相同，每张只改动了一个前景变量。点选你认为最成立的一张：",
      answer: "B",
      labels: {
        A: "方案 A",
        B: "方案 B",
        C: "方案 C",
        D: "方案 D",
      },
      explain: "方案 B 胜出：框口约占画幅 46%，前景深酒红沉静无纹，山峰与独舟完整居中略偏并留出干净晨雾呼吸缝。",
      breakdown: [
        "A 项：框口面积仅约 16%，厚重拱壁压死呼吸空间，舟首紧逼内壁。",
        "B 项：开口比例、主体呼吸缝与前景明暗退让三者同时成立（正确答案）。",
        "C 项：开口与前景质感同 B，但机位右偏导致拱壁切掉了右侧山肩。",
        "D 项：开口与落位同 B，但亮色粗斜纹拱框反客为主，先抢走了第一眼注意力。",
      ],
    },
    {
      prompt: "第二题：以下四个实际项目任务，哪一项应该主动「撤掉前景框架」，改用无遮挡构图？",
      answer: "B",
      labels: {
        A: "任务 A · 杂乱老街人物背影",
        B: "任务 B · 工业机床正交三视图",
        C: "任务 C · 园林月洞门远山茶席",
        D: "任务 D · 艺术展单件陶瓶海报",
      },
      explain: "任务 B 应该撤框：工业三视图与建筑测绘的核心是完整、准确传达外轮廓与尺寸比例，前景遮挡会直接切掉关键读数。",
      breakdown: [
        "A 项：老街边缘杂牌多，正需要暗门廊前景框遮丑聚焦。",
        "B 项：精密测绘与正交工程图严禁前景遮挡边缘结构（正确答案）。",
        "C 项：江南园林月洞门本身就是经典的实体前景框架题材。",
        "D 项：单件器物展览海报非常适合用纯平色块框架烘托画心。",
      ],
    },
  ];

  let qIdx = 0;
  let picked = null;

  function drawQ1(ctx, w, h, key) {
    // 统一远山晨雾 + 独舟
    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(w * 0.50, h * 0.34, h * 0.085, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sunBlush;
    ctx.fill();
    // 远山
    ctx.beginPath();
    ctx.moveTo(w * 0.50, h * 0.41);
    ctx.lineTo(w * 0.64, h * 0.64);
    ctx.lineTo(w * 0.36, h * 0.64);
    ctx.closePath();
    ctx.fillStyle = PALETTE.peakMaroon;
    ctx.fill();
    // 湖面与小舟
    ctx.fillStyle = PALETTE.waterPeach;
    ctx.fillRect(0, h * 0.64, w, h * 0.36);
    ctx.fillStyle = PALETTE.inkMaroon;
    ctx.beginPath();
    ctx.moveTo(w * 0.41, h * 0.71);
    ctx.lineTo(w * 0.59, h * 0.71);
    ctx.lineTo(w * 0.55, h * 0.75);
    ctx.lineTo(w * 0.45, h * 0.75);
    ctx.closePath();
    ctx.fill();

    // 按 A/B/C/D 单变量绘制前景石拱
    const r = key === "A" ? h * 0.25 : h * 0.41;
    const cx = key === "C" ? w * 0.36 : w * 0.50;
    const cy = h * 0.52;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    if (key === "D") {
      ctx.fillStyle = "#F5CEC2";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#8C2634";
      ctx.lineWidth = 2.2;
      const step = 18;
      for (let x = -h; x < w + h; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.fillStyle = "#FFF7EE";
      for (let y = step * 0.5; y < h; y += step) {
        for (let x = step * 0.5; x < w; x += step) {
          ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      ctx.fillStyle = PALETTE.pillarBurgundy;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    // 选答后标出结构评判线
    if (picked) {
      ctx.strokeStyle = key === "B" ? PALETTE.okDark : PALETTE.errDark;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawQ2(ctx, w, h, key) {
    ctx.fillStyle = PALETTE.archInner;
    ctx.fillRect(0, 0, w, h);
    if (key === "A") {
      // 杂乱街角背影
      ctx.fillStyle = "#C98588";
      ctx.fillRect(w * 0.06, h * 0.14, w * 0.18, h * 0.46);
      ctx.fillRect(w * 0.76, h * 0.16, w * 0.18, h * 0.44);
      ctx.fillStyle = PALETTE.inkMaroon;
      ctx.beginPath(); ctx.arc(w * 0.50, h * 0.44, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(w * 0.45, h * 0.50, w * 0.10, h * 0.28);
    } else if (key === "B") {
      // 工业机床正交三视图 + 尺寸线
      ctx.strokeStyle = "rgba(58,11,20,0.16)";
      for (let x = 16; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.strokeStyle = PALETTE.inkMaroon;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.14, h * 0.30, w * 0.44, h * 0.42);
      ctx.strokeRect(w * 0.64, h * 0.30, w * 0.22, h * 0.42);
      ctx.beginPath(); ctx.arc(w * 0.36, h * 0.51, h * 0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = PALETTE.roseTextSafe;
      ctx.beginPath(); ctx.moveTo(w * 0.14, h * 0.20); ctx.lineTo(w * 0.86, h * 0.20); ctx.stroke();
    } else if (key === "C") {
      // 园林月洞门远山茶席
      ctx.fillStyle = PALETTE.sunBlush;
      ctx.beginPath(); ctx.arc(w * 0.50, h * 0.36, h * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath(); ctx.moveTo(w * 0.50, h * 0.44); ctx.lineTo(w * 0.65, h * 0.68); ctx.lineTo(w * 0.35, h * 0.68); ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.moveTo(w * 0.5 + h * 0.38, h * 0.52); ctx.arc(w * 0.5, h * 0.52, h * 0.38, 0, Math.PI * 2, true); ctx.clip("evenodd");
      ctx.fillStyle = PALETTE.archCoral; ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else {
      // 单件陶瓶海报
      ctx.fillStyle = PALETTE.peakMaroon;
      ctx.beginPath(); ctx.ellipse(w * 0.50, h * 0.54, w * 0.10, h * 0.20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(w * 0.45, h * 0.30, w * 0.10, h * 0.08);
      ctx.strokeStyle = PALETTE.coral;
      ctx.lineWidth = 10;
      ctx.strokeRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
    }
  }

  function renderAll() {
    const q = QUESTIONS[qIdx];
    promptEl.textContent = q.prompt;
    canvases.forEach((c) => {
      const key = c.dataset.quizC;
      const rect = c.getBoundingClientRect();
      const cssW = rect.width || 280;
      const cssH = cssW * 0.75;
      const { ctx, w, h } = fitCanvas(c, cssW, cssH);
      if (qIdx === 0) drawQ1(ctx, w, h, key);
      else drawQ2(ctx, w, h, key);
    });
    for (const [k, text] of Object.entries(q.labels)) {
      const lbl = document.querySelector(`[data-quiz-lbl="${k}"]`);
      if (lbl) lbl.textContent = text;
    }
    cards.forEach((card) => {
      const ch = card.dataset.choice;
      card.classList.remove("is-correct", "is-wrong");
      if (picked) {
        if (ch === q.answer) card.classList.add("is-correct");
        else if (ch === picked) card.classList.add("is-wrong");
      }
    });
    if (picked) {
      const right = picked === q.answer;
      fbBox.hidden = false;
      fbBox.classList.toggle("is-wrong", !right);
      fbStatus.textContent = right ? `答对了 · 选 ${picked} 最准确` : `选了 ${picked} · 正解是 ${q.answer}`;
      fbExplain.textContent = q.explain;
      fbList.innerHTML = q.breakdown.map((line) => `<li>${line}</li>`).join("");
    } else {
      fbBox.hidden = true;
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      picked = card.dataset.choice;
      renderAll();
    });
  });

  qTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      qIdx = Number(tab.dataset.qIndex);
      picked = null;
      qTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      renderAll();
    });
  });

  retryBtn.addEventListener("click", () => {
    picked = null;
    renderAll();
  });

  renderAll();
  new ResizeObserver(renderAll).observe(canvases[0]);
}
