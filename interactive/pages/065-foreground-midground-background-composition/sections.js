// 正文 01–07 节各自独立的交互模块（相邻节绝不重复同一种控件）：
// 01 剥洋葱逐层开关透视台
// 02 光学光圈景深 + 点击画中三层移焦对比仪
// 03 历史四幕空间机制切板（帕蒂尼尔 / 洛兰 / 1937 多平面摄影机 / 1941 公民凯恩深焦）
// 04 机位横移视差卷轴台（三套真实应用模板 + 锁死视差对照）
// 05 伪前景剥离对比诊所（三类反例前后切换）
// 06 单变量控制小练习（支持双题切换）
// 07 原海报点击放大拖拽灯箱

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, mixHex, contrastRatio } from "./palette.js";
import { drawCompositeThumbnail } from "./artwork.js";

function fitCanvas(canvas, aspectFallback = 2) {
  const rect = canvas.getBoundingClientRect();
  const dpr = pixelRatio(1.5);
  const w = Math.max(240, Math.round(rect.width || 480));
  const h = Math.max(120, Math.round(rect.height || w / aspectFallback));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ============================================================
// 01 剥洋葱逐层开关透视台
// ============================================================
export function initPeelLab() {
  const canvas = document.getElementById("peel-canvas");
  const readout = document.getElementById("peel-readout");
  const buttons = [...document.querySelectorAll("[data-peel-layer]")];
  if (!canvas || !readout) return;

  const layers = { fg: true, mid: true, bg: true };

  function describeLayers() {
    const { fg, mid, bg } = layers;
    if (fg && mid && bg) {
      return {
        tag: "三层完整",
        text: "前景深松叶当入口、中景山丘小屋立主角、背景雾蓝远山拉开空气：近大远小与遮挡同时在场，平面立刻有了可走进去的厚度。",
      };
    }
    if (!fg && mid && bg) {
      return {
        tag: "缺少前景",
        text: "撤掉深松前景后，眼前少了近处暗实参照物，画面立刻往后滑成一张平贴墙面的远景明信片——沉浸感掉了一半。",
      };
    }
    if (fg && !mid && bg) {
      return {
        tag: "缺少中景",
        text: "近处叶片和远处淡山之间直接断崖跳空：没有中景小径与小屋承上启下，故事主角不见了，空间显得空洞割裂。",
      };
    }
    if (fg && mid && !bg) {
      return {
        tag: "缺少背景",
        text: "抽空雾蓝远山后，中景丘陵直接撞上空白纸底，视线的去路被硬生生截断，开阔山谷瞬间缩成狭小舞台布景。",
      };
    }
    if (fg && !mid && !bg) {
      return {
        tag: "仅剩前景",
        text: "只有近处叶丛而无中后景呼应时，前景不再是「引导入口」，反而退化成孤立的贴边剪影装饰。",
      };
    }
    if (!fg && mid && !bg) {
      return {
        tag: "仅剩中景",
        text: "只留中景主体就像白底棚拍：轮廓清楚，但失去了前门尺度与远方环境，不再是三层空间构图。",
      };
    }
    if (!fg && !mid && bg) {
      return {
        tag: "仅剩背景",
        text: "只剩低对比远山与淡日时，画面柔和安静，但缺少近中景的视觉锚点，视线没有落脚处。",
      };
    }
    return {
      tag: "全部关闭",
      text: "三层全部移走后只剩一张暖米宣纸底。点开任意一层，重新观察每一道景片怎样给画面加上空间线索。",
    };
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 2.0);
    drawCompositeThumbnail(ctx, w, h, {
      showFg: layers.fg,
      showMid: layers.mid,
      showBg: layers.bg,
    });

    // 右上角轻标当前可见层数，不挡主体
    const activeNames = [
      layers.fg ? "1 前景" : null,
      layers.mid ? "2 中景" : null,
      layers.bg ? "3 背景" : null,
    ].filter(Boolean);

    ctx.save();
    const label = activeNames.length ? activeNames.join("  ·  ") : "空纸底";
    ctx.font = '700 12px "Space Mono", "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(8, 54, 38, 0.86)";
    ctx.fillRect(14, 14, tw + 20, 26);
    ctx.fillStyle = PALETTE.linenLight;
    ctx.textBaseline = "middle";
    ctx.fillText(label, 24, 27);
    ctx.restore();

    const info = describeLayers();
    readout.innerHTML = `<span class="peel-tag">${info.tag}</span><span>${info.text}</span>`;
  }

  const NAMES = { fg: "前景", mid: "中景", bg: "背景" };
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.peelLayer;
      layers[k] = !layers[k];
      btn.setAttribute("aria-pressed", String(layers[k]));
      btn.classList.toggle("is-off", !layers[k]);
      btn.textContent = `${NAMES[k]} · ${layers[k] ? "开" : "关"}`;
      draw();
    });
  });

  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 02 光学光圈景深 + 点击画面三层移焦对比仪
// ============================================================
export function initOpticsLab() {
  const canvas = document.getElementById("optics-canvas");
  const readout = document.getElementById("optics-readout");
  const meterFg = document.getElementById("meter-fg");
  const meterMid = document.getElementById("meter-mid");
  const meterBg = document.getElementById("meter-bg");
  const meterFgVal = document.getElementById("meter-fg-val");
  const meterMidVal = document.getElementById("meter-mid-val");
  const meterBgVal = document.getElementById("meter-bg-val");
  if (!canvas || !readout) return;

  const optState = {
    aperture: "f8",  // f2 | f8 | f22
    atmo: "mist",    // clear | mist | dusk
    target: "mid",   // fg | mid | bg
  };

  const ATMO_PALETTES = {
    clear: {
      name: "晴空低雾",
      sky: "#F5EBDD",
      fg: "#073425",
      midDeep: "#1B466A",
      midLight: "#3F6D98",
      bgNear: "#6489AC",
      bgFar: "#8BAAC4",
    },
    mist: {
      name: "晨雾空气透视",
      sky: PALETTE.creamTop,
      fg: PALETTE.fgLeafDark,
      midDeep: PALETTE.midHillDeep,
      midLight: PALETTE.midHillLight,
      bgNear: PALETTE.bgPeakNear,
      bgFar: PALETTE.bgPeakFar,
    },
    dusk: {
      name: "逆光浓雾",
      sky: "#EDE2CE",
      fg: "#05261C",
      midDeep: "#3C5E7B",
      midLight: "#6987A2",
      bgNear: "#C4CFD6",
      bgFar: "#D6DDD9",
    },
  };

  function calcBlurs() {
    if (optState.aperture === "f22") return { fg: 0, mid: 0, bg: 0 };
    const strength = optState.aperture === "f2" ? 3.8 : 1.5;
    if (optState.target === "fg") return { fg: 0, mid: strength * 0.65, bg: strength };
    if (optState.target === "bg") return { fg: strength, mid: strength * 0.65, bg: 0 };
    return { fg: strength * 0.75, mid: 0, bg: strength * 0.85 };
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 1.9);
    const pal = ATMO_PALETTES[optState.atmo];
    const blurs = calcBlurs();

    drawCompositeThumbnail(ctx, w, h, {
      skyHex: pal.sky,
      fgHex: pal.fg,
      fgMidHex: mixHex(pal.fg, pal.midLight, 0.2),
      midDeepHex: pal.midDeep,
      midLightHex: pal.midLight,
      bgNearHex: pal.bgNear,
      bgFarHex: pal.bgFar,
      blurFg: blurs.fg,
      blurMid: blurs.mid,
      blurBg: blurs.bg,
    });

    // 在当前合焦层画一枚极细合焦圆环徽标
    const focusAnchor =
      optState.target === "fg"
        ? { x: w * 0.14, y: h * 0.78, label: "合焦 · 前景" }
        : optState.target === "bg"
        ? { x: w * 0.73, y: h * 0.30, label: "合焦 · 背景" }
        : { x: w * 0.75, y: h * 0.65, label: "合焦 · 中景" };

    ctx.save();
    ctx.strokeStyle = optState.target === "fg" ? PALETTE.sunDisc : PALETTE.pineInk;
    ctx.lineWidth = 2;
    const r = 16;
    ctx.beginPath();
    ctx.arc(focusAnchor.x, focusAnchor.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '700 12px "Noto Sans SC", sans-serif';
    const tw = ctx.measureText(focusAnchor.label).width;
    const bx = Math.min(w - tw - 24, Math.max(12, focusAnchor.x - tw / 2 - 8));
    const by = Math.max(12, focusAnchor.y - r - 28);
    ctx.fillStyle = "rgba(8, 54, 38, 0.88)";
    ctx.fillRect(bx, by, tw + 16, 22);
    ctx.fillStyle = PALETTE.linenLight;
    ctx.textBaseline = "middle";
    ctx.fillText(focusAnchor.label, bx + 8, by + 11);
    ctx.restore();

    // 实时更新三层实测相对亮度对比度柱条
    const cFg = contrastRatio(pal.fg, pal.sky);
    const cMid = contrastRatio(pal.midDeep, pal.sky);
    const cBg = contrastRatio(pal.bgNear, pal.sky);
    const maxC = 14;
    if (meterFg) meterFg.style.width = `${Math.min(100, (cFg / maxC) * 100).toFixed(0)}%`;
    if (meterMid) meterMid.style.width = `${Math.min(100, (cMid / maxC) * 100).toFixed(0)}%`;
    if (meterBg) meterBg.style.width = `${Math.min(100, (cBg / maxC) * 100).toFixed(0)}%`;
    if (meterFgVal) meterFgVal.textContent = `${cFg.toFixed(1)}:1`;
    if (meterMidVal) meterMidVal.textContent = `${cMid.toFixed(1)}:1`;
    if (meterBgVal) meterBgVal.textContent = `${cBg.toFixed(1)}:1`;

    // 白话解释当前光圈 × 空气组合带来的视觉秩序
    const targetCn = { fg: "前景叶丛", mid: "中景小屋", bg: "背景远山" }[optState.target];
    if (optState.aperture === "f22") {
      readout.textContent = `f/22 深焦全锐（${pal.name}）：前中后三层全部清晰，此时不再靠虚化分层，完全靠「遮挡关系 + ${cFg.toFixed(1)} → ${cMid.toFixed(1)} → ${cBg.toFixed(1)} 的对比递减」稳住空间秩序。`;
    } else if (optState.aperture === "f2") {
      readout.textContent = `f/2.0 浅景深 · 焦落${targetCn}（${pal.name}）：光学虚化强行把其余两层推柔，视线立刻锁死在${targetCn}；但若前景虚成大片黑团，容易显得脏堵。`;
    } else {
      readout.textContent = `f/8 平衡景深 · 焦落${targetCn}（${pal.name}）：保留远近轻微柔焦，同时配合 ${cFg.toFixed(1)} → ${cMid.toFixed(1)} → ${cBg.toFixed(1)} 的空气对比梯子，三层都能辨认又不互相打架。`;
    }
  }

  // 直接点击画布对应区域移焦（左/右下=前景、中腰=中景、上方远山=背景）
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const u = (e.clientX - r.left) / Math.max(1, r.width);
    const v = (e.clientY - r.top) / Math.max(1, r.height);
    if (v < 0.48) optState.target = "bg";
    else if ((u < 0.28 || u > 0.82) && v > 0.62) optState.target = "fg";
    else optState.target = "mid";

    document.querySelectorAll("[data-optics-target]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.opticsTarget === optState.target);
      b.setAttribute("aria-pressed", String(b.dataset.opticsTarget === optState.target));
    });
    draw();
  });

  document.querySelectorAll("[data-optics-aperture]").forEach((btn) => {
    btn.addEventListener("click", () => {
      optState.aperture = btn.dataset.opticsAperture;
      document.querySelectorAll("[data-optics-aperture]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      draw();
    });
  });

  document.querySelectorAll("[data-optics-atmo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      optState.atmo = btn.dataset.opticsAtmo;
      document.querySelectorAll("[data-optics-atmo]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      draw();
    });
  });

  document.querySelectorAll("[data-optics-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      optState.target = btn.dataset.opticsTarget;
      document.querySelectorAll("[data-optics-target]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      draw();
    });
  });

  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 03 历史四幕空间机制切板（深松林暗室）
// ============================================================
export function initHistoryStage() {
  const canvas = document.getElementById("history-canvas");
  const titleEl = document.getElementById("history-era-title");
  const descEl = document.getElementById("history-era-desc");
  const btns = [...document.querySelectorAll("[data-history-era]")];
  if (!canvas || !titleEl || !descEl) return;

  const ERAS = {
    patinir: {
      title: "1510s–1520s · 帕蒂尼尔三色调「世界风景」",
      desc: "尼德兰画家约阿希姆·帕蒂尼尔（如约 1520–1524 年《渡过冥河的风景》）把宏大鸟瞰风光拆成「褐前、绿中、蓝后」三道色带，配合达·芬奇总结的空气透视，确立了欧洲独立风景画的三层空间骨架。",
    },
    claude: {
      title: "1630s–1650s · 克劳德·洛兰侧翼推远法（Repoussoir）",
      desc: "克劳德·洛兰（如 1641 年《圣乌苏拉登船海港》、1658 年《大卫在亚杜兰洞》）像剧场侧幕一样把深暗大树或建筑押在前景两侧，把视线推向受光的中景舞台，再融进发光的远方地平线。",
    },
    disney: {
      title: "1937 · 迪士尼垂直多平面摄影机（Multiplane Camera）",
      desc: "工程师威廉·加里蒂团队为 1937 年短片《老磨坊》（The Old Mill）建成多层玻璃架：镜头从顶部俯拍数层独立移动的玻璃画片，近片移速快、远片移速慢，手绘平面第一次拥有真实视差。",
    },
    kane: {
      title: "1941 · 《公民凯恩》深焦三层场面调度",
      desc: "奥逊·威尔斯与摄影师格雷格·托兰德用广角镜与小光圈让前、中、后三层同时锐利：前景桌上签约、中景父亲踱步、远景窗外幼童雪中玩耍——同一镜头内同时推进三层叙事。",
    },
  };

  let active = "patinir";

  function drawFrame(t, _dt, { still }) {
    const { ctx, w, h } = fitCanvas(canvas, 2.0);
    const phase = still ? 0.35 : (Math.sin(t * 1.1) + 1) * 0.5;

    ctx.fillStyle = "#082018";
    ctx.fillRect(0, 0, w, h);

    // 极轻背景经纬网格线
    ctx.strokeStyle = "rgba(235, 221, 196, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 32; y < h; y += 44) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (active === "patinir") {
      // 三色调横向色带：蓝后 -> 绿中 -> 褐前
      ctx.fillStyle = "#A9C1D1";
      ctx.fillRect(w * 0.08, h * 0.14, w * 0.84, h * 0.24);
      ctx.fillStyle = "#6F99B0";
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.38);
      ctx.lineTo(w * 0.30, h * 0.22);
      ctx.lineTo(w * 0.52, h * 0.32);
      ctx.lineTo(w * 0.74, h * 0.18);
      ctx.lineTo(w * 0.92, h * 0.38);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3E6F5E";
      ctx.fillRect(w * 0.08, h * 0.38, w * 0.84, h * 0.24);
      // 弯曲河流连贯中后景
      ctx.strokeStyle = "#B8D0DC";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.38);
      ctx.bezierCurveTo(w * 0.62, h * 0.47, w * 0.34, h * 0.54, w * 0.54, h * 0.62);
      ctx.stroke();

      ctx.fillStyle = "#5B432C";
      ctx.fillRect(w * 0.08, h * 0.62, w * 0.84, h * 0.24);

      // 三段标注
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.fillStyle = PALETTE.pineInk;
      ctx.fillText("背景 · 冷蓝淡雾", w * 0.11, h * 0.24);
      ctx.fillStyle = PALETTE.linenLight;
      ctx.fillText("中景 · 暖绿河谷", w * 0.11, h * 0.51);
      ctx.fillText("前景 · 沉褐岩土", w * 0.11, h * 0.76);
    } else if (active === "claude") {
      // 发光太阳居中远景 + 两侧深暗推远树幕
      const grad = ctx.createRadialGradient(w * 0.55, h * 0.42, 6, w * 0.55, h * 0.42, w * 0.42);
      grad.addColorStop(0, "#F5DFB5");
      grad.addColorStop(0.55, "#8EAAC0");
      grad.addColorStop(1, "#355C80");
      ctx.fillStyle = grad;
      ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);

      // 中景河湾与古桥剪影
      ctx.fillStyle = "#2E5474";
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.72);
      ctx.quadraticCurveTo(w * 0.50, h * 0.54, w * 0.92, h * 0.68);
      ctx.lineTo(w * 0.92, h * 0.88);
      ctx.lineTo(w * 0.08, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // 左侧暗树推远幕（Repoussoir）
      ctx.fillStyle = "#08291E";
      ctx.fillRect(w * 0.08, h * 0.12, w * 0.14, h * 0.76);
      ctx.beginPath();
      ctx.arc(w * 0.23, h * 0.30, h * 0.20, 0, Math.PI * 2);
      ctx.arc(w * 0.19, h * 0.48, h * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // 右侧小暗檐呼应
      ctx.fillRect(w * 0.82, h * 0.46, w * 0.10, h * 0.42);

      // 视线推进箭头
      const arrowX = w * (0.28 + phase * 0.26);
      ctx.strokeStyle = PALETTE.sunDisc;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.74);
      ctx.quadraticCurveTo(w * 0.40, h * 0.60, w * 0.56, h * 0.43);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = PALETTE.sunDisc;
      ctx.beginPath();
      ctx.arc(arrowX, h * (0.68 - phase * 0.24), 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (active === "disney") {
      // 垂直玻璃多层摄影机侧视剖面：镜头在顶部，三片玻璃按不同速度横移
      const camX = w * 0.5;
      ctx.fillStyle = PALETTE.sunDisc;
      ctx.fillRect(camX - 26, h * 0.08, 52, 24);
      ctx.beginPath();
      ctx.moveTo(camX - 10, h * 0.19);
      ctx.lineTo(camX + 10, h * 0.19);
      ctx.lineTo(camX + 18, h * 0.26);
      ctx.lineTo(camX - 18, h * 0.26);
      ctx.closePath();
      ctx.fill();

      // 镜头视锥虚线
      ctx.strokeStyle = "rgba(235, 215, 183, 0.32)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(camX - 14, h * 0.26); ctx.lineTo(w * 0.16, h * 0.88);
      ctx.moveTo(camX + 14, h * 0.26); ctx.lineTo(w * 0.84, h * 0.88);
      ctx.stroke();
      ctx.setLineDash([]);

      const shift = (phase - 0.5) * 2;
      const panes = [
        { y: h * 0.40, speed: 34, label: "前景玻璃片 · 移速 3×", col: "#1C6E54" },
        { y: h * 0.60, speed: 17, label: "中景玻璃片 · 移速 1.5×", col: "#4F83B4" },
        { y: h * 0.80, speed: 5,  label: "背景玻璃片 · 移速 0.4×", col: "#9EB7CC" },
      ];
      panes.forEach((p) => {
        const dx = shift * p.speed;
        const pw = w * 0.54;
        ctx.fillStyle = p.col;
        ctx.fillRect(camX - pw / 2 + dx, p.y - 6, pw, 12);
        ctx.strokeStyle = PALETTE.linenLight;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(camX - pw / 2 + dx, p.y - 6, pw, 12);
        ctx.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
        ctx.fillStyle = PALETTE.linenLight;
        ctx.fillText(p.label, camX + pw / 2 + dx + 10, p.y + 4);
      });
    } else {
      // 1941 公民凯恩深焦：三层同锐（无五官纯剪影人物）
      ctx.fillStyle = "#1E3A4C";
      ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);
      // 远景雪地窗框（背景）
      ctx.fillStyle = "#D4E0E8";
      ctx.fillRect(w * 0.36, h * 0.22, w * 0.20, h * 0.30);
      // 窗外远景玩雪孩童小剪影（无五官）
      ctx.fillStyle = "#163142";
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.40, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.453, h * 0.42, 10, 14);

      // 中景立姿人物背侧影（无五官）
      ctx.fillStyle = "#3F698D";
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 0.34, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.40);
      ctx.lineTo(w * 0.68, h * 0.40);
      ctx.lineTo(w * 0.70, h * 0.78);
      ctx.lineTo(w * 0.60, h * 0.78);
      ctx.closePath();
      ctx.fill();

      // 前景大侧影 + 签约桌（无五官）
      ctx.fillStyle = "#061B14";
      ctx.beginPath();
      ctx.arc(w * 0.24, h * 0.34, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.17, h * 0.44);
      ctx.lineTo(w * 0.31, h * 0.44);
      ctx.lineTo(w * 0.34, h * 0.88);
      ctx.lineTo(w * 0.14, h * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(w * 0.08, h * 0.74, w * 0.38, h * 0.14);

      // 三层同时合焦徽标
      ctx.font = '700 11px "Noto Sans SC", sans-serif';
      for (const [lx, ly, txt] of [
        [0.14, 0.22, "前景锐 · 签约"],
        [0.58, 0.22, "中景锐 · 父亲"],
        [0.36, 0.60, "远景锐 · 窗外幼童"],
      ]) {
        ctx.fillStyle = PALETTE.sunDisc;
        ctx.fillText(txt, w * lx, h * ly);
      }
    }
  }

  const ctrl = loop(canvas, drawFrame);

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.historyEra;
      btns.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      titleEl.textContent = ERAS[active].title;
      descEl.textContent = ERAS[active].desc;
      ctrl.draw();
    });
  });

  window.addEventListener("resize", ctrl.draw);
}

// ============================================================
// 04 机位横移视差卷轴台（真实应用模板 + 锁死视差对照）
// ============================================================
export function initParallaxLab() {
  const canvas = document.getElementById("parallax-canvas");
  const slider = document.getElementById("parallax-slider");
  const lockBtn = document.getElementById("parallax-lock");
  const readout = document.getElementById("parallax-readout");
  const sceneBtns = [...document.querySelectorAll("[data-px-scene]")];
  if (!canvas || !slider || !lockBtn || !readout) return;

  const pxState = { mode: "travel", pan: 0, locked: false };

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 2.2);
    const p = pxState.pan; // -1..1
    const sBg = pxState.locked ? p * 30 : p * 10;
    const sMid = pxState.locked ? p * 30 : p * 34;
    const sFg = pxState.locked ? p * 30 : p * 74;

    ctx.fillStyle = PALETTE.creamTop;
    ctx.fillRect(0, 0, w, h);

    if (pxState.mode === "travel") {
      // 旅拍海报模板：远山 + 暖日 -> 中景车站与列车 -> 近景树枝与标题压角
      ctx.fillStyle = PALETTE.sunDisc;
      ctx.beginPath();
      ctx.arc(w * 0.72 - sBg, h * 0.28, h * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.bgPeakNear;
      ctx.beginPath();
      ctx.moveTo(-80 - sBg, h);
      ctx.lineTo(w * 0.25 - sBg, h * 0.34);
      ctx.lineTo(w * 0.56 - sBg, h * 0.56);
      ctx.lineTo(w * 0.86 - sBg, h * 0.26);
      ctx.lineTo(w + 100 - sBg, h);
      ctx.closePath();
      ctx.fill();

      // 中景坡道与石拱桥
      ctx.fillStyle = PALETTE.midHillLight;
      ctx.fillRect(-80 - sMid, h * 0.60, w + 160, h * 0.40);
      ctx.fillStyle = PALETTE.midHillDeep;
      ctx.fillRect(w * 0.12 - sMid, h * 0.54, w * 0.76, h * 0.10);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = PALETTE.creamTop;
        ctx.beginPath();
        ctx.arc(w * (0.24 + i * 0.17) - sMid, h * 0.64, h * 0.08, Math.PI, 0);
        ctx.fill();
      }

      // 前景松枝
      ctx.fillStyle = PALETTE.fgLeafDark;
      ctx.beginPath();
      ctx.ellipse(w * 0.08 - sFg, h * 0.96, w * 0.22, h * 0.38, -0.25, 0, Math.PI * 2);
      ctx.ellipse(w * 0.94 - sFg, h * 0.96, w * 0.20, h * 0.32, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pxState.mode === "game") {
      // 横版卷轴游戏：远城塔 -> 中景平台与无五官跳跃主角剪影 -> 前景暗草丛
      ctx.fillStyle = PALETTE.bgPeakFar;
      for (let i = -1; i < 7; i++) {
        const bx = i * (w * 0.20) - sBg;
        const bh = h * (0.35 + (Math.abs(i) % 3) * 0.11);
        ctx.fillRect(bx, h - bh, w * 0.14, bh);
      }
      // 中景石块台阶与角色剪影（无五官）
      ctx.fillStyle = PALETTE.midBand;
      ctx.fillRect(-90 - sMid, h * 0.70, w + 180, h * 0.30);
      ctx.fillRect(w * 0.40 - sMid, h * 0.52, w * 0.22, h * 0.09);
      ctx.fillStyle = PALETTE.sunDisc;
      ctx.beginPath();
      ctx.arc(w * 0.51 - sMid, h * 0.43, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.pineInk;
      ctx.fillRect(w * 0.495 - sMid, h * 0.45, 16, 20);

      // 前景快移暗草块
      ctx.fillStyle = PALETTE.fgBand;
      for (let i = -1; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(i * (w * 0.26) - sFg, h * 1.02, h * 0.24, Math.PI, 0);
        ctx.fill();
      }
    } else {
      // 剧场式网页首屏：淡山底 -> 中景核心文案卡片 -> 前景漂浮叶角
      ctx.fillStyle = PALETTE.bgPeakFar;
      ctx.beginPath();
      ctx.moveTo(-80 - sBg, h);
      ctx.quadraticCurveTo(w * 0.4 - sBg, h * 0.26, w + 80 - sBg, h * 0.72);
      ctx.lineTo(w + 80, h);
      ctx.closePath();
      ctx.fill();

      // 中景主标题卡片
      ctx.fillStyle = PALETTE.linenLight;
      ctx.fillRect(w * 0.24 - sMid, h * 0.24, w * 0.52, h * 0.50);
      ctx.strokeStyle = PALETTE.midBand;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.24 - sMid, h * 0.24, w * 0.52, h * 0.50);
      ctx.fillStyle = PALETTE.pineInk;
      ctx.fillRect(w * 0.30 - sMid, h * 0.36, w * 0.30, 12);
      ctx.fillStyle = PALETTE.midBand;
      ctx.fillRect(w * 0.30 - sMid, h * 0.48, w * 0.40, 7);
      ctx.fillRect(w * 0.30 - sMid, h * 0.58, w * 0.16, 16);

      // 前景边角暗框
      ctx.fillStyle = PALETTE.fgBand;
      ctx.beginPath();
      ctx.arc(w * 0.06 - sFg, h * 0.88, h * 0.25, 0, Math.PI * 2);
      ctx.arc(w * 0.94 - sFg, h * 0.88, h * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // 底部速度差标条
    ctx.fillStyle = "rgba(8,54,38,0.88)";
    ctx.fillRect(12, 12, pxState.locked ? 236 : 268, 24);
    ctx.fillStyle = PALETTE.linenLight;
    ctx.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText(
      pxState.locked ? "三层锁死：前 1.0× · 中 1.0× · 后 1.0×" : "真实视差：前 1.0× · 中 0.45× · 后 0.14×",
      20,
      24
    );

    readout.textContent = pxState.locked
      ? "已关闭视差（三层同速平移）：左右推机位时三层像粘在同一块硬纸板上整体横移，空间厚度立刻消失。"
      : `机位偏移 ${Math.round(p * 100)}%: 前景位移最快、中景次之、远景几乎不动——大脑立刻从速度差里读出前中后三层真实距离。`;
  }

  slider.addEventListener("input", () => {
    pxState.pan = Number(slider.value) / 100;
    draw();
  });

  lockBtn.addEventListener("click", () => {
    pxState.locked = !pxState.locked;
    lockBtn.setAttribute("aria-pressed", String(pxState.locked));
    lockBtn.classList.toggle("is-active", pxState.locked);
    lockBtn.textContent = pxState.locked ? "恢复三层视差" : "锁死视差对比";
    draw();
  });

  sceneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pxState.mode = btn.dataset.pxScene;
      sceneBtns.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      draw();
    });
  });

  window.addEventListener("resize", draw);
  draw();
}

// ============================================================
// 05 伪前景剥离对比诊所（什么时候别用）
// ============================================================
export function initAvoidClinic() {
  const btns = [...document.querySelectorAll("[data-avoid-case]")];
  const toggleBtn = document.getElementById("avoid-strip-btn");
  const card = document.getElementById("avoid-stage");
  const note = document.getElementById("avoid-note");
  if (!btns.length || !toggleBtn || !card || !note) return;

  const CASES = {
    ecom: {
      bad: "电商白底主图硬塞两片虚化绿叶当「前景」：不仅遮住瓶身标签，还破坏平台统一的纯净识别效率。",
      good: "剥离多余前景后：产品形态、标签文字与轮廓 100% 清晰，用户 0.5 秒就能辨认商品。",
    },
    chart: {
      bad: "数据看板硬叠半透明前景装饰片：文字和折线被遮挡，读数时还要穿过装饰层找重点，纯属添乱。",
      good: "剥离前景改用平面信息层级：数据与坐标干净对正，零遮挡、零干扰。",
    },
    weed: {
      bad: "手里没有合适前景，硬拿路边杂草遮住镜头下缘 1/3：杂乱黑影既无信息又切掉主角下半身，成为「伪前景」。",
      good: "宁缺毋滥：直接收干净镜头或改用简洁中远景构图，画面立刻透气利落。",
    },
  };

  let cur = "ecom";
  let stripped = false;

  function sync() {
    card.dataset.case = cur;
    card.dataset.stripped = stripped ? "1" : "0";
    toggleBtn.setAttribute("aria-pressed", String(stripped));
    toggleBtn.textContent = stripped ? "还原硬凑的前景" : "一键剥离多余前景";
    note.textContent = stripped ? CASES[cur].good : CASES[cur].bad;
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      cur = btn.dataset.avoidCase;
      stripped = false;
      btns.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      sync();
    });
  });

  toggleBtn.addEventListener("click", () => {
    stripped = !stripped;
    sync();
  });

  sync();
}

// ============================================================
// 06 单变量控制小练习（四图仅差一个变量，中性标签 A/B/C/D）
// ============================================================
export function initQuiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const feedback = document.getElementById("quiz-feedback");
  const switchBtn = document.getElementById("quiz-next");
  if (!promptEl || !grid || !feedback || !switchBtn) return;

  const QUESTIONS = [
    {
      prompt: "山谷步道指南封面：四幅草图的位置、画幅与前景占比（约 18%）完全相同，只改变了「三层之间的明暗对比与远景空气退让」。哪一幅的空间纵深与视觉秩序最成立？",
      answer: "B",
      options: [
        {
          id: "A",
          spec: { fgHex: "#08352A", midDeepHex: "#0C393B", midLightHex: "#1A4D59", bgNearHex: "#153D47", bgFarHex: "#24515C" },
          explain: "方案 A 把前景、中景、远山都压成了同样沉重的高对比深色——三层明暗平权，远山往前扑，纵深立刻被拍扁。",
        },
        {
          id: "B",
          spec: { fgHex: "#08352A", midDeepHex: "#204A6C", midLightHex: "#4D7BA3", bgNearHex: "#92B1C6", bgFarHex: "#BDCCD2" },
          explain: "答对了。方案 B 严格遵循「前景沉实高对比 → 中景清晰中调突显小屋 → 背景柔和空气退让」，视线自然从入口滑向主角再推往远山。",
        },
        {
          id: "C",
          spec: { fgHex: "#9BB1BE", fgMidHex: "#AFC2CD", midDeepHex: "#496D8D", midLightHex: "#698CAA", bgNearHex: "#092D26", bgFarHex: "#154037" },
          explain: "方案 C 把前景画得灰淡、却把远山压得最黑最重——对比度前后倒挂，远山喧宾夺主，空间秩序完全颠倒。",
        },
        {
          id: "D",
          spec: { fgHex: "#08352A", midDeepHex: "#204A6C", midLightHex: "#4D7BA3", bgNearHex: "#EFE4D1", bgFarHex: "#F3E6D3" },
          explain: "方案 D 的前景与中景都成立，但背景远山淡到几乎融进米纸底色里，第三层空间消失，整幅画退化成了两层。",
        },
      ],
    },
    {
      prompt: "进阶题：这四幅草图的色彩对比、空气退让与中景位置完全相同，只改变了「前景的占比与开合位置」。哪一幅最能引路而不遮主？",
      answer: "C",
      options: [
        {
          id: "A",
          spec: { fgScale: 0, fgLayout: "flank" },
          explain: "方案 A 前景占比 0%：少了近处暗实着陆点，画面直接贴在中远景平面上，缺少走进山谷的入口感。",
        },
        {
          id: "B",
          spec: { fgScale: 0.88, fgLayout: "center" },
          explain: "方案 B 的前景过大且居中堵门，直接盖住了中景小径与小屋，前景从入口变成了拦路墙。",
        },
        {
          id: "C",
          spec: { fgScale: 0.44, fgLayout: "flank" },
          explain: "答对了。方案 C 前景约占 18% 且双侧让路，稳稳立住近处尺度，同时把中间通往小屋的视线通道彻底敞开。",
        },
        {
          id: "D",
          spec: { fgScale: 0.96, fgLayout: "flank" },
          explain: "方案 D 虽然双侧分布，但前景体量拉满到近一半画面，左右巨块往中间挤压，中景小屋几乎喘不过气。",
        },
      ],
    },
  ];

  let qIdx = 0;

  function renderQuestion() {
    const q = QUESTIONS[qIdx];
    promptEl.textContent = q.prompt;
    feedback.textContent = "点击任意方案查看判定与理由。";
    feedback.className = "quiz-feedback";
    switchBtn.textContent = qIdx === 0 ? "换一题（测前景占比变量）" : "回到主练题（测对比梯子变量）";

    grid.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.opt = opt.id;
      btn.innerHTML = `<canvas class="quiz-thumb" width="480" height="240" aria-hidden="true"></canvas><span class="quiz-label">方案 ${opt.id}</span>`;
      grid.appendChild(btn);

      const c = btn.querySelector("canvas");
      const ctx = c.getContext("2d");
      drawCompositeThumbnail(ctx, c.width, c.height, opt.spec);

      btn.addEventListener("click", () => {
        const isRight = opt.id === q.answer;
        grid.querySelectorAll(".quiz-card").forEach((b) => {
          b.classList.remove("is-correct", "is-wrong", "is-picked");
        });
        btn.classList.add("is-picked", isRight ? "is-correct" : "is-wrong");
        feedback.className = `quiz-feedback ${isRight ? "is-ok" : "is-err"}`;
        feedback.textContent = opt.explain;
      });
    });
  }

  switchBtn.addEventListener("click", () => {
    qIdx = (qIdx + 1) % QUESTIONS.length;
    renderQuestion();
  });

  renderQuestion();
}

// ============================================================
// 07 原海报点击放大、拖拽、Esc 关闭灯箱
// ============================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-lightbox");
  const fullImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomBtn = document.getElementById("lightbox-zoom");
  if (!trigger || !posterImg || !dialog || !fullImg || !closeBtn || !zoomBtn) return;

  let zoomed = false;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    const sc = zoomed ? 1.85 : 1;
    fullImg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
    zoomBtn.textContent = zoomed ? "还原 100%" : "放大 185%";
  }

  function openBox() {
    fullImg.src = posterImg.currentSrc || posterImg.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.showModal();
  }

  function closeBox() {
    if (dialog.open) dialog.close();
  }

  trigger.addEventListener("click", openBox);
  closeBtn.addEventListener("click", closeBox);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      closeBox();
    }
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeBox();
  });

  zoomBtn.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) { tx = 0; ty = 0; }
    applyTransform();
  });

  fullImg.addEventListener("pointerdown", (e) => {
    if (!zoomed) return;
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    fullImg.setPointerCapture(e.pointerId);
  });

  fullImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = Math.max(-420, Math.min(420, e.clientX - sx));
    ty = Math.max(-420, Math.min(420, e.clientY - sy));
    applyTransform();
  });

  const endDrag = () => { dragging = false; };
  fullImg.addEventListener("pointerup", endDrag);
  fullImg.addEventListener("pointercancel", endDrag);
}
