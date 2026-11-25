// 080 平视构图 · 正文 01–07 节全部独立交互模块与原海报灯箱
// 保证相邻两节绝不用同一种控件做同一件事；全 SVG 人物严格无五官剪影。

import { projectPoint } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}
function txt(str, attrs = {}, parent = null) {
  const n = el("text", attrs, parent);
  n.textContent = str;
  return n;
}

// 公共极简无五官人物 SVG（底部锚点 x, yBase，身高 pxH）
function svgPerson(parent, cx, yBase, pxH, fill = "#1A232B", seated = false) {
  const g = el("g", {}, parent);
  const s = pxH / 100;
  if (!seated) {
    el("ellipse", { cx, cy: yBase + 1.5 * s, rx: 10 * s, ry: 2.6 * s, fill: "rgba(14,16,17,0.16)" }, g);
    el("rect", { x: cx - 5.5 * s, y: yBase - 42 * s, width: 4.2 * s, height: 42 * s, fill }, g);
    el("rect", { x: cx + 1.3 * s, y: yBase - 42 * s, width: 4.2 * s, height: 42 * s, fill }, g);
    el("path", {
      d: `M${cx - 8 * s},${yBase - 40 * s} Q${cx - 10 * s},${yBase - 64 * s} ${cx - 7 * s},${yBase - 80 * s} Q${cx},${yBase - 84 * s} ${cx + 7 * s},${yBase - 80 * s} Q${cx + 10 * s},${yBase - 64 * s} ${cx + 8 * s},${yBase - 40 * s} Z`,
      fill,
    }, g);
    el("ellipse", { cx, cy: yBase - 91.5 * s, rx: 6.2 * s, ry: 7.6 * s, fill }, g);
  } else {
    // 坐姿无五官剪影
    el("rect", { x: cx - 14 * s, y: yBase - 38 * s, width: 28 * s, height: 4 * s, fill: "#5B4338" }, g);
    el("rect", { x: cx - 11 * s, y: yBase - 34 * s, width: 3 * s, height: 34 * s, fill: "#5B4338" }, g);
    el("rect", { x: cx + 8 * s, y: yBase - 34 * s, width: 3 * s, height: 34 * s, fill: "#5B4338" }, g);
    el("path", {
      d: `M${cx - 8 * s},${yBase - 38 * s} L${cx + 14 * s},${yBase - 38 * s} L${cx + 16 * s},${yBase} L${cx + 10 * s},${yBase} L${cx + 9 * s},${yBase - 30 * s} L${cx - 8 * s},${yBase - 30 * s} Z`,
      fill,
    }, g);
    el("path", {
      d: `M${cx - 9 * s},${yBase - 37 * s} Q${cx - 12 * s},${yBase - 62 * s} ${cx - 4 * s},${yBase - 79 * s} Q${cx + 4 * s},${yBase - 82 * s} ${cx + 9 * s},${yBase - 74 * s} Q${cx + 11 * s},${yBase - 56 * s} ${cx + 6 * s},${yBase - 37 * s} Z`,
      fill,
    }, g);
    el("ellipse", { cx: cx + 2 * s, cy: yBase - 90 * s, rx: 7.5 * s, ry: 9 * s, fill }, g);
  }
  return g;
}

/* ==================== 01 节：阿尔伯蒂等高齐眼定律实验 ==================== */
export function initSection01() {
  const svg = document.getElementById("s1-svg");
  const distSlider = document.getElementById("s1-dist");
  const distVal = document.getElementById("s1-dist-val");
  const readout = document.getElementById("s1-readout");
  const btns = [...document.querySelectorAll("[data-s1-terrain]")];
  if (!svg || !distSlider) return;

  let terrain = "flat";
  let midZ = 6.5;

  function draw() {
    svg.innerHTML = "";
    const W = 640, H = 340;
    const eyeLineY = 126;
    const f = 310;
    const camY = 1.62;
    const personH = 1.74;
    const personEye = 1.62;

    // 晴空与地面
    el("rect", { x: 0, y: 0, width: W, height: eyeLineY, fill: "#D7E4EB" }, svg);
    el("rect", { x: 0, y: eyeLineY, width: W, height: H - eyeLineY, fill: "#EFE8DD" }, svg);

    // 透视地砖线（汇聚到中心灭点）
    const vpX = W * 0.52;
    for (let i = -5; i <= 5; i++) {
      el("line", {
        x1: vpX, y1: eyeLineY,
        x2: vpX + i * 110, y2: H,
        stroke: "#DCD3C5", "stroke-width": 1,
      }, svg);
    }

    // 若为斜坡，画微微抬升的远方斜坡面
    if (terrain === "slope") {
      el("polygon", {
        points: `0,${eyeLineY + 70} ${W},${eyeLineY + 70} ${W},${eyeLineY - 26} 0,${eyeLineY - 26}`,
        fill: "#E5DDD0", opacity: 0.72,
      }, svg);
      el("line", {
        x1: 0, y1: eyeLineY - 26, x2: W, y2: eyeLineY - 26,
        stroke: "#9E9588", "stroke-dasharray": "4 4", "stroke-width": 1.2,
      }, svg);
    }

    // 三位同身高剪影人物（近 2.4m，中可调 midZ，远 14.0m）
    const folks = [
      { label: "近景 2.4m", x: -1.15, z: 2.4, color: "#1A232B" },
      { label: `中景 ${midZ.toFixed(1)}m`, x: 0.05, z: midZ, color: "#973524" },
      { label: "远景 14.0m", x: 3.1, z: 14.0, color: "#415A68" },
    ].sort((a, b) => b.z - a.z);

    let midEyeScreenY = eyeLineY;
    for (const p of folks) {
      const groundY = terrain === "slope" ? Math.max(0, (p.z - 2.4) * 0.095) : 0;
      const footY = eyeLineY - ((groundY - camY) / p.z) * f;
      const topY = eyeLineY - ((groundY + personH - camY) / p.z) * f;
      const eyeY = eyeLineY - ((groundY + personEye - camY) / p.z) * f;
      const sx = vpX + (p.x / p.z) * f * 0.85;
      const pxH = Math.max(18, footY - topY);

      svgPerson(svg, sx, footY, pxH, p.color, false);
      // 齐眼短横标
      el("line", { x1: sx - 16, y1: eyeY, x2: sx + 16, y2: eyeY, stroke: "#FAF8F3", "stroke-width": 2.2 }, svg);
      el("line", { x1: sx - 14, y1: eyeY, x2: sx + 14, y2: eyeY, stroke: p.color === "#973524" ? "#A3432B" : "#1E614B", "stroke-width": 1.4 }, svg);

      const lblY = Math.min(H - 8, footY + 18);
      el("rect", { x: sx - 36, y: lblY - 12, width: 72, height: 15, fill: "rgba(239, 232, 221, 0.9)" }, svg);
      txt(p.label, {
        x: sx, y: lblY,
        "text-anchor": "middle", "font-size": 11, fill: "#2B343A",
        "font-family": '"IBM Plex Mono", monospace', "font-weight": 600,
      }, svg);

      if (p.color === "#973524") midEyeScreenY = eyeY;
    }

    // 贯穿砖红眼平线
    el("line", { x1: 0, y1: eyeLineY, x2: W * 0.84, y2: eyeLineY, stroke: "#A3432B", "stroke-width": 2.2 }, svg);
    el("line", { x1: W * 0.84, y1: eyeLineY, x2: W, y2: eyeLineY, stroke: "#A3432B", "stroke-width": 2.2, "stroke-dasharray": "7 5" }, svg);
    el("rect", { x: 10, y: eyeLineY - 24, width: 112, height: 20, fill: "rgba(215,228,235,0.9)" }, svg);
    txt("眼平线 · 1.62m", { x: 15, y: eyeLineY - 10, "font-size": 12, fill: "#7A2516", "font-weight": 700 }, svg);

    distVal.textContent = `${midZ.toFixed(1)}m`;
    const deltaPx = Math.round(eyeLineY - midEyeScreenY);
    if (terrain === "flat") {
      readout.textContent = `平地模式：中景人物移到 ${midZ.toFixed(1)}m 处，虽然身形缩放变化明显，但他的双眼依然分毫不差压在 1.62m 眼平线上（偏移 0px）——近景与远景同身高者亦然。`;
    } else {
      readout.textContent = `斜坡模式：地面每往远处抬升，中景人物（${midZ.toFixed(1)}m）的眼睛便高出眼平线 ${deltaPx}px。打破「等高齐眼」的正是坡地海拔差。`;
    }
  }

  distSlider.addEventListener("input", () => {
    midZ = parseFloat(distSlider.value);
    draw();
  });
  for (const b of btns) {
    b.addEventListener("click", () => {
      terrain = b.dataset.s1Terrain;
      btns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  }
  draw();
}

/* ==================== 02 节：高度不是俯仰（2×2 象限双窗对照） ==================== */
const QUADS = {
  "level-eye": {
    camY: 1.62, pitch: 0,
    title: "标准平视（高度齐眼 · 俯仰 0°）",
    text: "机身与主体眼高一致、光轴严格水平。两侧建筑垂直线丝毫不歪，观者与人物视线自然相交，呈现最克制稳定的叙事基准。",
  },
  "low-level": {
    camY: 0.85, pitch: 0,
    title: "小津式低平视（低机位 · 俯仰 0°）",
    text: "机身降到近地面高度（约 0.85m），但坚决不抬头仰拍！建筑立柱依然笔直端正，眼平线落在人物胸腹高度，营造出静坐旁观、含蓄克制的室内几何感。",
  },
  "low-up": {
    camY: 0.65, pitch: 18,
    title: "低机位仰拍（虫视倾向 · 俯仰 +18°）",
    text: "既压低机身又向上仰起镜头：眼平线沉到画面底部，建筑墙柱向天顶明显汇聚倾斜。平等感让位于仰望与戏剧威压。",
  },
  "high-down": {
    camY: 2.45, pitch: -18,
    title: "高机位俯拍（鸟瞰倾向 · 俯仰 -18°）",
    text: "机身抬高并低头下俯：眼平线升到顶部，广场地砖大面积铺开，墙柱向下收拢倾斜，人物显渺小并带着抽离的俯瞰感。",
  },
};

export function initSection02() {
  const sideSvg = document.getElementById("s2-side-svg");
  const frontSvg = document.getElementById("s2-front-svg");
  const explain = document.getElementById("s2-explain");
  const cells = [...document.querySelectorAll("[data-q]")];
  if (!sideSvg || !frontSvg) return;

  function renderQuad(key) {
    const q = QUADS[key];
    // 1) 侧视剖面图
    sideSvg.innerHTML = "";
    const W = 300, H = 210;
    const gY = 178;
    const m2px = 46; // 1m = 46px
    el("rect", { x: 0, y: 0, width: W, height: gY, fill: "#DCE7EE" }, sideSvg);
    el("rect", { x: 0, y: gY, width: W, height: H - gY, fill: "#EFE8DD" }, sideSvg);
    el("line", { x1: 0, y1: gY, x2: W, y2: gY, stroke: "#8C8378", "stroke-width": 1.2 }, sideSvg);

    // 侧视拱门墙体与站立人物剪影
    el("rect", { x: 240, y: gY - 3.3 * m2px, width: 22, height: 3.3 * m2px, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.2 }, sideSvg);
    svgPerson(sideSvg, 185, gY, 1.74 * m2px, "#1A232B", false);

    // 相机位置与三脚架
    const camX = 52;
    const camPy = gY - q.camY * m2px;
    el("line", { x1: camX, y1: gY, x2: camX, y2: camPy, stroke: "#3B444B", "stroke-width": 2 }, sideSvg);
    el("line", { x1: camX - 10, y1: gY, x2: camX, y2: camPy + 6, stroke: "#3B444B", "stroke-width": 1.4 }, sideSvg);
    el("line", { x1: camX + 10, y1: gY, x2: camX, y2: camPy + 6, stroke: "#3B444B", "stroke-width": 1.4 }, sideSvg);

    // 水平参考虚线
    el("line", { x1: camX, y1: camPy, x2: 270, y2: camPy, stroke: "#526F81", "stroke-dasharray": "4 4", "stroke-width": 1 }, sideSvg);

    // 光轴与视锥
    const rad = (q.pitch * Math.PI) / 180;
    const rayLen = 205;
    const ax2 = camX + Math.cos(rad) * rayLen;
    const ay2 = camPy - Math.sin(rad) * rayLen;
    const spread = (16 * Math.PI) / 180;
    const conePts = [
      `${camX},${camPy}`,
      `${camX + Math.cos(rad + spread) * rayLen},${camPy - Math.sin(rad + spread) * rayLen}`,
      `${camX + Math.cos(rad - spread) * rayLen},${camPy - Math.sin(rad - spread) * rayLen}`,
    ].join(" ");
    el("polygon", { points: conePts, fill: "rgba(163, 67, 43, 0.16)" }, sideSvg);
    el("line", { x1: camX, y1: camPy, x2: ax2, y2: ay2, stroke: "#A3432B", "stroke-width": 2 }, sideSvg);

    // 机身
    const camG = el("g", { transform: `translate(${camX},${camPy}) rotate(${-q.pitch})` }, sideSvg);
    el("rect", { x: -10, y: -7, width: 18, height: 14, fill: "#0E1011" }, camG);
    el("polygon", { points: "8,-4 15,-7 15,7 8,4", fill: "#A3432B" }, camG);

    txt(`高 ${q.camY.toFixed(2)}m · 俯仰 ${q.pitch >= 0 ? "+" : ""}${q.pitch}°`, {
      x: 10, y: 18, "font-size": 11, fill: "#0E1011", "font-family": '"IBM Plex Mono", monospace', "font-weight": 600,
    }, sideSvg);

    // 2) 正面针孔真三维投影预览（锚定高度 f 保证拱门与地坪始终完整）
    frontSvg.innerHTML = "";
    const st = { camY: q.camY, pitch: q.pitch, roll: 0, focal: 50 };
    const p = (x, y, z) => projectPoint(x, y, z, st, W, H);
    const fFront = (50 / 24) * H * 0.68;
    const hY = H * 0.5 + Math.tan((q.pitch * Math.PI) / 180) * fFront;

    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#D7E4EB" }, frontSvg);
    const gL = p(-12, 0, 14), gR = p(12, 0, 14), gnR = p(12, 0, 1.5), gnL = p(-12, 0, 1.5);
    el("polygon", {
      points: `${gL.x},${gL.y} ${gR.x},${gR.y} ${gnR.x + 120},${Math.max(gnR.y, H + 80)} ${gnL.x - 120},${Math.max(gnL.y, H + 80)}`,
      fill: "#EFE8DD",
    }, frontSvg);

    // 拱门立面与黑檐顶 + 半圆门洞
    const tl = p(-1.95, 4.0, 10.5), tr = p(1.95, 4.0, 10.5), br = p(1.95, 0, 10.5), bl = p(-1.95, 0, 10.5);
    const rTL = p(-2.05, 4.25, 10.5), rTR = p(2.05, 4.25, 10.5);
    el("polygon", { points: `${rTL.x},${rTL.y} ${rTR.x},${rTR.y} ${tr.x},${tr.y} ${tl.x},${tl.y}`, fill: "#0E1011" }, frontSvg);
    el("polygon", { points: `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.2 }, frontSvg);
    const archPts = [p(-0.92, 0, 10.5)];
    for (let i = 0; i <= 14; i++) {
      const ang = Math.PI - (i / 14) * Math.PI;
      archPts.push(p(Math.cos(ang) * 0.92, 1.65 + Math.sin(ang) * 0.92, 10.5));
    }
    archPts.push(p(0.92, 0, 10.5));
    el("polygon", { points: archPts.map((qPt) => `${qPt.x.toFixed(1)},${qPt.y.toFixed(1)}`).join(" "), fill: "#973524", stroke: "#0E1011", "stroke-width": 1.3 }, frontSvg);
    const dotC = p(0, 3.25, 10.5);
    el("circle", { cx: dotC.x, cy: dotC.y, r: 4.5, fill: "#A3432B" }, frontSvg);

    // 人物剪影
    const sf = p(-0.9, 0, 5.8), stp = p(-0.9, 1.74, 5.8);
    svgPerson(frontSvg, sf.x, sf.y, Math.max(24, sf.y - stp.y), "#1A232B", false);

    // 垂直基准虚线（直接对比墙柱歪不歪）
    const straight = Math.abs(q.pitch) < 1;
    const guideColor = straight ? "#1E614B" : "#A3432B";
    el("line", { x1: bl.x, y1: bl.y + 4, x2: bl.x, y2: tl.y - 8, stroke: guideColor, "stroke-dasharray": "3 3", "stroke-width": 1.3 }, frontSvg);
    el("line", { x1: br.x, y1: br.y + 4, x2: br.x, y2: tr.y - 8, stroke: guideColor, "stroke-dasharray": "3 3", "stroke-width": 1.3 }, frontSvg);

    // 眼平线
    el("line", { x1: 0, y1: hY, x2: W, y2: hY, stroke: "#A3432B", "stroke-width": 1.8 }, frontSvg);
    txt(straight ? "垂直线笔直" : q.pitch > 0 ? "墙柱向上汇聚" : "墙柱向下收拢", {
      x: 10, y: 18, "font-size": 11, fill: guideColor, "font-weight": 700,
    }, frontSvg);

    explain.innerHTML = `<strong>${q.title}</strong>：${q.text}`;
  }

  for (const c of cells) {
    c.addEventListener("click", () => {
      cells.forEach((x) => {
        const on = x === c;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      renderQuad(c.dataset.q);
    });
  }
  renderQuad("level-eye");
}

/* ==================== 03 节：蹲下，找谁的眼平（五类主体身高标尺） ==================== */
const SUBJ_DATA = {
  adult: {
    name: "站立成人", eyeY: 1.62, kind: "adult",
    matchNote: "相机高 1.62m 与成人眼睛齐平：背景远山稳稳托在肩线后方，眼神平视直达观者。",
    lazyNote: "摄影师站高 1.68m 与成人眼高几乎接近（仅差 0.06m），这就是为什么拍成年站姿时随手平视最容易成功。",
  },
  seated: {
    name: "坐姿对谈", eyeY: 1.12, kind: "seated",
    matchNote: "屈膝降到 1.12m 坐姿眼高：你仿佛坐在对面椅子上倾听，背后拱门与街景成为温和陪衬。",
    lazyNote: "站着 1.68m 往下拍坐着的人：视线必须向下低头 -11°，镜头里满眼桌面与地砖，瞬间生出审视与压迫感。",
  },
  child: {
    name: "学龄孩童", eyeY: 0.85, kind: "child",
    matchNote: "单膝蹲到 0.85m 齐眼高度：远方的建筑与天空重新回到孩子身后，画面一下子有了平等而温柔的代入感。",
    lazyNote: "大人站在 1.68m 直接低头拍（-17°）：只能拍到孩子头顶和冰冷地板，把孩子压成地面上的一个小点。",
  },
  pet: {
    name: "猫狗宠物", eyeY: 0.38, kind: "pet",
    matchNote: "把手机倒拿贴近 0.38m 地面平视：草地与石板铺展成深远背景，小狗立刻成了画面的平等主角。",
    lazyNote: "人站着 1.68m 俯拍小狗（-24°）：背景全是水泥地板，画面干瘪，完全进入不了动物自己的视界。",
  },
  object: {
    name: "桌面杯盏", eyeY: 0.92, kind: "object",
    matchNote: "降到桌面器物中部高度（约 0.92m）水平拍摄：杯身线条端正，侧影比例忠实饱满，与背景窗景层次清晰。",
    lazyNote: "站着 1.68m 斜向下拍桌面杯盏：杯口被压成椭圆、杯身缩短，桌面斜向翻起，既不平视也不是 90° 顶视。",
  },
};

export function initSection03() {
  const svg = document.getElementById("s3-svg");
  const meta = document.getElementById("s3-meta");
  const note = document.getElementById("s3-note");
  const cards = [...document.querySelectorAll("[data-subj]")];
  const modeBtns = [...document.querySelectorAll("[data-s3-mode]")];
  if (!svg) return;

  let active = "adult";
  let mode = "match";

  function draw() {
    const s = SUBJ_DATA[active];
    const camY = mode === "match" ? s.eyeY : 1.68;
    const pitchDeg = mode === "match" ? 0 : Math.max(-24, Math.round(((s.eyeY - 1.68) / 2.6) * 52));
    svg.innerHTML = "";

    // 左半：垂直身高标尺（0..1.8m）
    const rulerW = 190, H = 300;
    const topPad = 30, botY = 268;
    const mToY = (m) => botY - (m / 1.85) * (botY - topPad);

    el("rect", { x: 0, y: 0, width: rulerW, height: H, fill: "#1B2832" }, svg);
    el("line", { x1: 68, y1: topPad, x2: 68, y2: botY, stroke: "#698599", "stroke-width": 1.5 }, svg);
    for (const m of [0, 0.5, 1.0, 1.5]) {
      const py = mToY(m);
      el("line", { x1: 60, y1: py, x2: 76, y2: py, stroke: "#698599", "stroke-width": 1.2 }, svg);
      txt(`${m.toFixed(1)}m`, { x: 16, y: py + 4, "font-size": 11, fill: "#B8D6E8", "font-family": '"IBM Plex Mono", monospace' }, svg);
    }

    // 主体目标高度线与相机实际高度游标（重合时合并标注，彻底杜绝文字叠压）
    const targetPy = mToY(s.eyeY);
    const camPy = mToY(camY);
    const isMatch = Math.abs(camY - s.eyeY) < 0.12;
    const camCol = isMatch ? "#89DFC0" : "#F39B82";
    el("line", { x1: 68, y1: targetPy, x2: 182, y2: targetPy, stroke: "#89DFC0", "stroke-dasharray": "4 3", "stroke-width": 1.5 }, svg);
    el("circle", { cx: 68, cy: targetPy, r: 4.5, fill: "#89DFC0" }, svg);
    if (!isMatch) {
      txt(`主体 ${s.eyeY.toFixed(2)}m`, { x: 84, y: targetPy - 7, "font-size": 11, fill: "#89DFC0", "font-weight": 600 }, svg);
    }
    const boxY = Math.max(12, Math.min(H - 34, camPy - 11));
    el("rect", { x: 78, y: boxY, width: 104, height: 22, fill: isMatch ? "#1E4C3E" : "#6D281D", stroke: camCol, "stroke-width": 1.2 }, svg);
    txt(isMatch ? `齐眼 ${camY.toFixed(2)}m` : `机位 ${camY.toFixed(2)}m`, {
      x: 86, y: boxY + 15, "font-size": 11, fill: "#FAF8F3", "font-family": '"IBM Plex Mono", monospace', "font-weight": 600,
    }, svg);

    // 右半：模拟成片取景框（x: 196..668）
    const fx = 196, fw = 472, fh = 276, fy = 12;
    const clipId = "s3-clip";
    const defs = el("defs", {}, svg);
    const cp = el("clipPath", { id: clipId }, defs);
    el("rect", { x: fx, y: fy, width: fw, height: fh }, cp);

    const frameG = el("g", { "clip-path": `url(#${clipId})` }, svg);
    const horizY = fy + fh * 0.5 + Math.tan((pitchDeg * Math.PI) / 180) * 320;
    el("rect", { x: fx, y: fy, width: fw, height: fh, fill: "#D7E4EB" }, frameG);
    el("rect", { x: fx, y: Math.max(fy, horizY), width: fw, height: fh + 140, fill: "#EFE8DD" }, frameG);

    // 远山与拱门背景（随相机俯仰上下位移，呈现背景是否被压成地板！）
    el("path", {
      d: `M${fx},${horizY} Q${fx + 140},${horizY - 36} ${fx + 290},${horizY - 12} Q${fx + 390},${horizY - 46} ${fx + fw},${horizY - 16} L${fx + fw},${horizY + 4} L${fx},${horizY + 4} Z`,
      fill: "#526F81",
    }, frameG);

    // 背景小拱门剪影（平底半圆拱门洞 + 黑檐顶）
    const archBase = horizY + (camY / 1.7) * 28;
    el("rect", { x: fx + 306, y: archBase - 116, width: 104, height: 7, fill: "#0E1011" }, frameG);
    el("rect", { x: fx + 310, y: archBase - 110, width: 96, height: 110, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.2 }, frameG);
    el("path", {
      d: `M${fx + 336},${archBase} L${fx + 336},${archBase - 40} A22,22 0 0 1 ${fx + 380},${archBase - 40} L${fx + 380},${archBase} Z`,
      fill: "#973524", stroke: "#0E1011", "stroke-width": 1.4,
    }, frameG);
    el("circle", { cx: fx + 358, cy: archBase - 84, r: 5, fill: "#A3432B" }, frameG);

    // 画不同拍摄对象（无五官）
    const subX = fx + 175;
    const subBaseY = fy + fh - (mode === "match" ? 24 : 52);
    if (s.kind === "adult") {
      svgPerson(frameG, subX, subBaseY + 20, 178, "#1A232B", false);
    } else if (s.kind === "seated") {
      svgPerson(frameG, subX, subBaseY, 152, "#1A232B", true);
    } else if (s.kind === "child") {
      svgPerson(frameG, subX, subBaseY, mode === "match" ? 148 : 112, "#1A232B", false);
    } else if (s.kind === "pet") {
      // 小狗剪影
      const dy = subBaseY;
      const sc = mode === "match" ? 1.25 : 0.88;
      const pg = el("g", { transform: `translate(${subX},${dy}) scale(${sc})` }, frameG);
      el("rect", { x: -34, y: -56, width: 64, height: 30, rx: 12, fill: "#2B1E1A" }, pg);
      el("rect", { x: -28, y: -28, width: 10, height: 28, fill: "#2B1E1A" }, pg);
      el("rect", { x: 14, y: -28, width: 10, height: 28, fill: "#2B1E1A" }, pg);
      el("circle", { cx: -32, cy: -66, r: 16, fill: "#2B1E1A" }, pg);
      el("polygon", { points: "-28,-80 -22,-98 -12,-76", fill: "#2B1E1A" }, pg);
    } else {
      // 桌面茶杯静物
      const ty = subBaseY;
      el("rect", { x: fx, y: ty - 14, width: fw, height: 90, fill: "#DDD2C0" }, frameG);
      el("rect", { x: subX - 34, y: ty - 88, width: 68, height: 74, rx: 4, fill: "#973524", stroke: "#0E1011", "stroke-width": 1.6 }, frameG);
      if (mode !== "match") {
        el("ellipse", { cx: subX, cy: ty - 88, rx: 34, ry: 12, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.5 }, frameG);
      } else {
        el("line", { x1: subX - 34, y1: ty - 88, x2: subX + 34, y2: ty - 88, stroke: "#0E1011", "stroke-width": 2 }, frameG);
      }
      el("path", { d: `M${subX + 34},${ty - 72} C${subX + 54},${ty - 72} ${subX + 54},${ty - 38} ${subX + 34},${ty - 38}`, fill: "none", stroke: "#0E1011", "stroke-width": 4 }, frameG);
    }

    // 眼平红线
    el("line", { x1: fx, y1: horizY, x2: fx + fw, y2: horizY, stroke: "#A3432B", "stroke-width": 2 }, frameG);
    el("rect", { x: fx + 10, y: fy + 10, width: 190, height: 24, fill: "rgba(241,236,226,0.92)" }, frameG);
    txt(mode === "match" ? `平视成立 · 机位 ${camY.toFixed(2)}m` : `站拍俯角 ${pitchDeg}° · 压迫疏离`, {
      x: fx + 18, y: fy + 26, "font-size": 12, fill: mode === "match" ? "#1E614B" : "#8C2E1E", "font-weight": 700,
    }, frameG);

    el("rect", { x: fx, y: fy, width: fw, height: fh, fill: "none", stroke: "rgba(244,239,230,0.35)", "stroke-width": 1.2 }, svg);

    meta.textContent = `${s.name} · 建议齐眼机位 ${s.eyeY.toFixed(2)}m（经验参考值）`;
    note.textContent = mode === "match" ? s.matchNote : s.lazyNote;
  }

  for (const c of cards) {
    c.addEventListener("click", () => {
      active = c.dataset.subj;
      cards.forEach((x) => {
        const on = x === c;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  }
  for (const b of modeBtns) {
    b.addEventListener("click", () => {
      mode = b.dataset.s3Mode;
      modeBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      draw();
    });
  }
  draw();
}

/* ==================== 04 节：保持主体等高的 24–135mm 光学推拉窗 ==================== */
export function initSection04() {
  const canvas = document.getElementById("s4-canvas");
  const slider = document.getElementById("s4-focal");
  const fVal = document.getElementById("s4-focal-val");
  const dVal = document.getElementById("s4-dist-val");
  const readout = document.getElementById("s4-readout");
  const chips = [...document.querySelectorAll("[data-s4-f]")];
  if (!canvas || !slider) return;
  const ctx = canvas.getContext("2d");

  let focal = 50;

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width || 620));
    const h = Math.max(180, Math.round(rect.height || 380));
    const dpr = pixelRatio(2);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // 关键光学公式：为保持前景人物剪影在画框中高度恒定且双脚完整入画，相机到人物距离 dSub 正比于焦段 focal
    // 设 50mm 时人物在 7.2m，拱门始终站在人物身后 7.5m（即 zArch = dSub + 7.5）
    const dSub = 7.2 * (focal / 50);
    const dArch = dSub + 7.5;
    const dHill = dSub + 22.0;
    const fPx = (focal / 24) * h * 0.72;
    const eyeY = h * 0.5;
    const camH = 1.62;

    const proj = (x, y, z) => ({
      x: w * 0.5 + (x / z) * fPx,
      y: eyeY - ((y - camH) / z) * fPx,
    });

    // 晴空与地面
    ctx.fillStyle = "#D7E4EB";
    ctx.fillRect(0, 0, w, eyeY);
    ctx.fillStyle = "#EFE8DD";
    ctx.fillRect(0, eyeY, w, h - eyeY);

    // 远山（随焦段拉长被显著放大拉近！）
    ctx.fillStyle = "#526F81";
    ctx.beginPath();
    const hPts = [[-22, 0], [-14, 2.2], [-6, 1.5], [2, 3.1], [10, 2.3], [18, 3.6], [26, 0]];
    hPts.forEach(([x, y], i) => {
      const pt = proj(x, y, dHill);
      if (i === 0) ctx.moveTo(pt.x, eyeY + 2);
      ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(w + 100, eyeY + 2);
    ctx.closePath();
    ctx.fill();

    // 透视石板线
    ctx.strokeStyle = "#DDD4C6";
    ctx.lineWidth = 1;
    for (let x = -10; x <= 10; x += 2) {
      const a = proj(x, 0, Math.max(1.5, dSub - 2.2));
      const b = proj(x, 0, dArch + 2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 背后米白砖红拱门（固定在人物身后 7.5m，但在长焦下放大贴近！）
    const tl = proj(-2.1, 4.15, dArch);
    const tr = proj(2.1, 4.15, dArch);
    const br = proj(2.1, 0, dArch);
    const bl = proj(-2.1, 0, dArch);
    ctx.fillStyle = "#F1ECE2";
    ctx.fillRect(tl.x, tl.y, tr.x - tl.x, bl.y - tl.y);
    ctx.fillStyle = "#0E1011";
    ctx.fillRect(tl.x - 4, tl.y - 6, tr.x - tl.x + 8, 8);
    // 门洞
    const aL = proj(-1.02, 0, dArch), aT = proj(0, 2.8, dArch), aR = proj(1.02, 0, dArch);
    const aw = aR.x - aL.x;
    const as = proj(0, 1.78, dArch).y;
    ctx.fillStyle = "#973524";
    ctx.beginPath();
    ctx.moveTo(aL.x, aL.y);
    ctx.lineTo(aL.x, as);
    ctx.arc((aL.x + aR.x) * 0.5, as, aw * 0.5, Math.PI, 0, false);
    ctx.lineTo(aR.x, aR.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0E1011";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 左侧小树（与拱门同行）
    const tb = proj(-3.4, 0, dArch - 1.5);
    const tc = proj(-3.4, 2.15, dArch - 1.5);
    const trp = proj(-2.65, 2.15, dArch - 1.5);
    ctx.strokeStyle = "#0E1011";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tb.x, tb.y);
    ctx.lineTo(tc.x, tc.y);
    ctx.stroke();
    ctx.fillStyle = "#0E1011";
    ctx.beginPath();
    ctx.arc(tc.x, tc.y, Math.max(6, trp.x - tc.x), 0, Math.PI * 2);
    ctx.fill();

    // 前景剪影主体（在画框里始终保持完全等高！）
    const subFoot = proj(-0.55, 0, dSub);
    const subTop = proj(-0.55, 1.74, dSub);
    const pxH = subFoot.y - subTop.y;
    const s = pxH / 100;
    ctx.save();
    ctx.translate(subFoot.x, subFoot.y);
    ctx.fillStyle = "rgba(14,16,17,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 12 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1A232B";
    ctx.fillRect(-5.5 * s, -42 * s, 4.4 * s, 42 * s);
    ctx.fillRect(1.2 * s, -42 * s, 4.4 * s, 42 * s);
    ctx.beginPath();
    ctx.moveTo(-8.5 * s, -41 * s);
    ctx.quadraticCurveTo(-11 * s, -63 * s, -8 * s, -79 * s);
    ctx.quadraticCurveTo(0, -83 * s, 8 * s, -79 * s);
    ctx.quadraticCurveTo(11 * s, -63 * s, 8.5 * s, -41 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -91.5 * s, 6.2 * s, 7.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 贯穿砖红眼平线（永远压住 0° 水平中心）
    ctx.strokeStyle = "#A3432B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, eyeY);
    ctx.lineTo(w, eyeY);
    ctx.stroke();

    // 角标实算背景放大倍率（以 50mm 为 1.00× 基准）
    const ratio50 = 7.2 / (7.2 + 7.5);
    const ratioNow = dSub / dArch;
    const bgScale = ratioNow / ratio50;
    ctx.fillStyle = "rgba(241,236,226,0.92)";
    ctx.fillRect(10, 10, 232, 24);
    ctx.fillStyle = "#0E1011";
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillText(`人物等高 · 拱门相对大小 ${bgScale.toFixed(2)}×`, 18, 26);

    ctx.restore();

    fVal.textContent = `${focal}mm`;
    dVal.textContent = `${dSub.toFixed(1)}m`;
    if (focal <= 30) {
      readout.textContent = `${focal}mm 广角平视（站距 ${dSub.toFixed(1)}m）：为让人物保持同样大小必须走得很近，背后拱门显得遥远小巧（相对 50mm 仅 ${bgScale.toFixed(2)}×），整片广场环境大幅涌入，极富纪实临场感。`;
    } else if (focal <= 60) {
      readout.textContent = `${focal}mm 标准平视（站距 ${dSub.toFixed(1)}m）：拱门相对大小 ${bgScale.toFixed(2)}×，人物与背后建筑的距离感最接近人眼自然步行时的真实记忆，不夸大也不挤压。`;
    } else {
      readout.textContent = `${focal}mm 中长焦平视（站距 ${dSub.toFixed(1)}m）：退远后用长焦取景，人物大小丝毫未变，背后拱门却猛增到 ${bgScale.toFixed(2)}×、紧贴人物肩后，画面由开阔环境转为亲密肖像。`;
    }
  }

  slider.addEventListener("input", () => {
    focal = parseInt(slider.value, 10);
    chips.forEach((c) => c.classList.toggle("is-active", parseInt(c.dataset.s4F, 10) === focal));
    draw();
  });
  for (const c of chips) {
    c.addEventListener("click", () => {
      focal = parseInt(c.dataset.s4F, 10);
      slider.value = String(focal);
      chips.forEach((x) => x.classList.toggle("is-active", x === c));
      draw();
    });
  }
  new ResizeObserver(draw).observe(canvas);
  draw();
}

/* ==================== 05 节：历史档案与眼平线图解 ==================== */
const ERAS = {
  "1427": {
    title: "马萨乔《圣三位一体》：把灭点定在教堂观者的眼高",
    p1: "约 1425 至 1428 年，文艺复兴画家马萨乔在佛罗伦萨圣母玛利亚诺维拉教堂墙上绘下《圣三位一体》。他把整幅壁画的单点透视灭点精确设在十字架下方台阶上沿——恰好与站在教堂地面上的观者眼睛齐平。",
    p2: "平直的教堂墙面因此仿佛向内凿开了一座真实罗马拱顶礼拜堂。这是西方艺术史上现存最早把「真实观者眼平线」与画内几何严谨对齐的里程碑作品。",
    cite: "核实来源：Wikipedia · Holy Trinity (Masaccio)（约 1425–1428，佛罗伦萨圣母玛利亚诺维拉教堂）",
  },
  "1435": {
    title: "阿尔伯蒂《论绘画》：首次把眼平线写成数学法则",
    p1: "1435 年（拉丁文版 De pictura，1436 年意大利文版 Della pittura），建筑师兼理论家莱昂·巴蒂斯塔·阿尔伯蒂将布鲁内莱斯基的透视实验写成系统专著。",
    p2: "他在第一卷明确规定：中心点（灭点）离画面底边的高度，不应高于画中站立人物的眼高；于是画中站在同一平地上的人与画外的观者共享一条水平眼平线，中世纪「按尊卑画大小」的旧规从此让位于自然平视的人文视角。",
    cite: "核实来源：Leon Battista Alberti, De pictura (1435) / Della pittura (1436)",
  },
  "1952": {
    title: "卡蒂埃-布列松《决定性瞬间》：50mm 眼平纪实美学",
    p1: "1952 年，法国摄影师亨利·卡蒂埃-布列松出版摄影集《决定性瞬间》（法文原名 Images à la sauvette）。他常年仅携带一台 35mm 徕卡旁轴相机与 50mm 标准镜头，将机身贴在自己眼部高度迅速构图。",
    p2: "他拒绝花哨的大仰大俯，把相机当作眼睛的自然延伸——正是这种克制的平视立场，让街头的瞬间既真实诚恳又具严谨的几何秩序。",
    cite: "核实来源：Henri Cartier-Bresson, Images à la sauvette / The Decisive Moment (1952)",
  },
  "1988": {
    title: "波德威尔剖析小津：低机位，但依然端平光轴",
    p1: "大卫·波德威尔与克里斯汀·汤普森自 1979 年《电影艺术》起系统区分「机位高度」与「机位俯仰」；1988 年波德威尔在《小津与电影诗学》中进一步纠正了关于小津安二郎「榻榻米视角」的常见误解。",
    p2: "小津的机位虽然常年压得很低，甚至在室外走廊也维持低高度，但他几乎从不抬头仰拍——始终保持水平光轴。这种「低平视」让门框柱梁笔直肃静，赋予普通家庭对话难以替代的克制尊严。",
    cite: "核实来源：Bordwell & Thompson, Film Art (1979)；David Bordwell, Ozu and the Poetics of Cinema (1988)",
  },
};

export function initSection05() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const textBox = document.getElementById("s5-text");
  const svg = document.getElementById("s5-svg");
  if (!textBox || !svg) return;

  function renderEra(key) {
    const d = ERAS[key];
    textBox.innerHTML = `<h3>${d.title}</h3><p>${d.p1}</p><p>${d.p2}</p><p class="tl-cite">${d.cite}</p>`;
    svg.innerHTML = "";
    const W = 360, H = 220;
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#FAF8F3" }, svg);

    if (key === "1427") {
      // 拱顶单点透视收敛至观者齐眼台阶
      const vx = 180, vy = 158;
      el("rect", { x: 96, y: 24, width: 168, height: 158, fill: "#EFE9DF", stroke: "#0E1011", "stroke-width": 1.4 }, svg);
      el("path", { d: "M124,158 L124,84 A56,56 0 0 1 236,84 L236,158 Z", fill: "#D7E4EB", stroke: "#0E1011", "stroke-width": 1.4 }, svg);
      for (const [x1, y1] of [[124, 52], [150, 36], [210, 36], [236, 52], [96, 182], [264, 182]]) {
        el("line", { x1, y1, x2: vx, y2: vy, stroke: "#526F81", "stroke-dasharray": "3 3", "stroke-width": 1.1 }, svg);
      }
      el("line", { x1: 20, y1: vy, x2: 340, y2: vy, stroke: "#A3432B", "stroke-width": 2 }, svg);
      el("circle", { cx: vx, cy: vy, r: 4.5, fill: "#A3432B" }, svg);
      txt("教堂地面观者眼高 = 灭点", { x: 180, y: 202, "text-anchor": "middle", "font-size": 11, fill: "#7A2516", "font-weight": 600 }, svg);
    } else if (key === "1435") {
      // 阿尔伯蒂窗口 + 棋盘地格 + 中心点
      const vy = 96, vx = 180;
      el("rect", { x: 36, y: 22, width: 288, height: 164, fill: "#E6EEF2", stroke: "#0E1011", "stroke-width": 1.5 }, svg);
      el("rect", { x: 36, y: vy, width: 288, height: 90, fill: "#EFE8DD" }, svg);
      for (let i = -3; i <= 3; i++) {
        el("line", { x1: vx, y1: vy, x2: vx + i * 54, y2: 186, stroke: "#526F81", "stroke-width": 1 }, svg);
      }
      for (const y of [112, 132, 156, 186]) {
        el("line", { x1: 36, y1: y, x2: 324, y2: y, stroke: "#998F82", "stroke-width": 1 }, svg);
      }
      el("line", { x1: 20, y1: vy, x2: 340, y2: vy, stroke: "#A3432B", "stroke-width": 2 }, svg);
      el("circle", { cx: vx, cy: vy, r: 4.5, fill: "#A3432B" }, svg);
      txt("中心点（Punto Centrico）与视平线", { x: 180, y: 206, "text-anchor": "middle", "font-size": 11, fill: "#7A2516", "font-weight": 600 }, svg);
    } else if (key === "1952") {
      // 50mm 旁轴视场角 46° 平视街景取景框
      el("rect", { x: 36, y: 34, width: 288, height: 148, fill: "#D7E4EB", stroke: "#0E1011", "stroke-width": 2 }, svg);
      el("rect", { x: 36, y: 108, width: 288, height: 74, fill: "#EFE8DD" }, svg);
      el("line", { x1: 36, y1: 108, x2: 324, y2: 108, stroke: "#A3432B", "stroke-width": 1.8 }, svg);
      svgPerson(svg, 128, 170, 68, "#1A232B", false);
      svgPerson(svg, 232, 146, 42, "#415A68", false);
      // 旁轴四角取景线
      for (const [x, y, dx, dy] of [[52, 48, 16, 16], [308, 48, -16, 16], [52, 168, 16, -16], [308, 168, -16, -16]]) {
        el("path", { d: `M${x + dx},${y} L${x},${y} L${x},${y + dy}`, fill: "none", stroke: "#0E1011", "stroke-width": 1.8 }, svg);
      }
      txt("35mm 旁轴 · 50mm 眼平自然取景", { x: 180, y: 204, "text-anchor": "middle", "font-size": 11, fill: "#7A2516", "font-weight": 600 }, svg);
    } else {
      // 小津低机位但严格水平光轴的拉门几何
      el("rect", { x: 36, y: 26, width: 288, height: 158, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.6 }, svg);
      // 垂直拉门竖框（丝毫不倾！）
      for (const x of [92, 152, 208, 268]) {
        el("line", { x1: x, y1: 26, x2: x, y2: 184, stroke: "#3B444B", "stroke-width": 1.4 }, svg);
      }
      el("line", { x1: 36, y1: 156, x2: 324, y2: 156, stroke: "#8C8378", "stroke-width": 1.4 }, svg);
      // 低眼平线（约占下方 1/3 但完全水平）
      el("line", { x1: 20, y1: 132, x2: 340, y2: 132, stroke: "#A3432B", "stroke-width": 2 }, svg);
      svgPerson(svg, 180, 174, 72, "#1A232B", true);
      txt("低机位 + 0° 水平光轴：所有竖框严丝合缝笔直", { x: 180, y: 204, "text-anchor": "middle", "font-size": 11, fill: "#7A2516", "font-weight": 600 }, svg);
    }
  }

  for (const t of tabs) {
    t.addEventListener("click", () => {
      tabs.forEach((x) => {
        const on = x === t;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-selected", String(on));
      });
      renderEra(t.dataset.era);
    });
  }
  renderEra("1427");
}

/* ==================== 06 节：什么时候别用（四张现场翻转对照卡） ==================== */
export function initSection06() {
  const btns = [...document.querySelectorAll("[data-flip]")];
  const state = { clutter: false, power: false, split: false, pattern: false };

  function drawCard(id) {
    const svg = document.getElementById(`s6-svg-${id}`);
    if (!svg) return;
    svg.innerHTML = "";
    const alt = state[id];
    const W = 300, H = 150;
    el("rect", { x: 0, y: 0, width: W, height: H, fill: alt ? "#E8F1EC" : "#E6EEF2" }, svg);

    if (id === "clutter") {
      if (!alt) {
        // 平视杂物叠成一团
        el("rect", { x: 0, y: 84, width: W, height: 66, fill: "#EFE8DD" }, svg);
        for (const [x, r, col] of [[85, 22, "#526F81"], [120, 26, "#3B444B"], [152, 24, "#973524"], [182, 26, "#1A232B"], [214, 20, "#526F81"]]) {
          el("circle", { cx: x, cy: 84, r, fill: col }, svg);
        }
        el("line", { x1: 0, y1: 84, x2: W, y2: 84, stroke: "#A3432B", "stroke-width": 1.6 }, svg);
        txt("平视：前后全叠在同一高度", { x: 10, y: 20, "font-size": 11, fill: "#8C2E1E", "font-weight": 700 }, svg);
      } else {
        // 改用俯视拉开层次
        el("rect", { x: 18, y: 28, width: 264, height: 108, fill: "#EFE8DD", stroke: "#1E614B", "stroke-width": 1.2 }, svg);
        for (const [x, y, col] of [[68, 56, "#526F81"], [148, 54, "#973524"], [228, 60, "#1A232B"], [104, 108, "#3B444B"], [196, 106, "#526F81"]]) {
          el("circle", { cx: x, cy: y, r: 16, fill: col }, svg);
        }
        txt("改用鸟瞰/顶视：每个物体各占干净空位", { x: 10, y: 20, "font-size": 11, fill: "#1E614B", "font-weight": 700 }, svg);
      }
    } else if (id === "power") {
      if (!alt) {
        el("rect", { x: 0, y: 92, width: W, height: 58, fill: "#EFE8DD" }, svg);
        el("rect", { x: 112, y: 26, width: 76, height: 96, fill: "#526F81" }, svg);
        el("line", { x1: 0, y1: 92, x2: W, y2: 92, stroke: "#A3432B", "stroke-width": 1.6 }, svg);
        txt("平视：高塔只剩中段，气势平平", { x: 10, y: 20, "font-size": 11, fill: "#8C2E1E", "font-weight": 700 }, svg);
      } else {
        el("polygon", { points: "70,148 124,26 176,26 230,148", fill: "#243542" }, svg);
        el("line", { x1: 150, y1: 140, x2: 150, y2: 34, stroke: "#89DFC0", "stroke-dasharray": "4 3", "stroke-width": 1.5 }, svg);
        txt("改用虫视仰拍：斜线汇聚直冲天顶", { x: 10, y: 20, "font-size": 11, fill: "#1E614B", "font-weight": 700 }, svg);
      }
    } else if (id === "split") {
      if (!alt) {
        el("rect", { x: 0, y: 75, width: W, height: 75, fill: "#D9CFC0" }, svg);
        el("line", { x1: 0, y1: 75, x2: W, y2: 75, stroke: "#A3432B", "stroke-width": 2 }, svg);
        txt("空旷海天 50/50 切半：呆板无重点", { x: 10, y: 20, "font-size": 11, fill: "#8C2E1E", "font-weight": 700 }, svg);
      } else {
        el("rect", { x: 0, y: 102, width: W, height: 48, fill: "#D9CFC0" }, svg);
        el("line", { x1: 0, y1: 102, x2: W, y2: 102, stroke: "#1E614B", "stroke-width": 1.8 }, svg);
        el("circle", { cx: 218, cy: 52, r: 16, fill: "#F1ECE2" }, svg);
        svgPerson(svg, 92, 134, 48, "#1A232B", false);
        txt("拉出主次比重 + 前景锚点：画面立活", { x: 10, y: 20, "font-size": 11, fill: "#1E614B", "font-weight": 700 }, svg);
      }
    } else if (id === "pattern") {
      if (!alt) {
        el("rect", { x: 0, y: 98, width: W, height: 52, fill: "#EFE8DD" }, svg);
        for (let i = 0; i < 6; i++) {
          el("ellipse", { cx: 48 + i * 40, cy: 118, rx: 14, ry: 4, fill: i % 2 ? "#973524" : "#243542" }, svg);
        }
        el("line", { x1: 0, y1: 98, x2: W, y2: 98, stroke: "#A3432B", "stroke-width": 1.6 }, svg);
        txt("平视：平面阵列被压成底边一条细缝", { x: 10, y: 20, "font-size": 11, fill: "#8C2E1E", "font-weight": 700 }, svg);
      } else {
        el("rect", { x: 24, y: 28, width: 252, height: 108, fill: "#EFE8DD" }, svg);
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 4; c++) {
            el("circle", { cx: 64 + c * 56, cy: 60 + r * 46, r: 14, fill: (r + c) % 2 ? "#973524" : "#243542" }, svg);
          }
        }
        txt("改用 90° 顶视：几何阵列完整清晰", { x: 10, y: 20, "font-size": 11, fill: "#1E614B", "font-weight": 700 }, svg);
      }
    }
  }

  for (const b of btns) {
    const id = b.dataset.flip;
    drawCard(id);
    b.addEventListener("click", () => {
      state[id] = !state[id];
      b.setAttribute("aria-pressed", String(state[id]));
      b.textContent = state[id] ? "退回平视现场" : "看改拍方案";
      drawCard(id);
    });
  }
}

/* ==================== 07 节：单变量视觉小练习 + 原海报灯箱 ==================== */
const QUIZ_OPTS = {
  A: {
    camY: 1.72, pitch: -11, right: false,
    msg: "方案 A 不对：相机留在站立高度（1.72m）且低头俯拍 -11°。注意拱门两侧墙柱明显向下内收、眼平线跑到了画面上方，观者处于居高临下的审视位置。",
  },
  B: {
    camY: 1.72, pitch: 0, right: false,
    msg: "方案 B 很具迷惑性，但仍不对：镜头虽然端平 0°、墙柱也笔直，但相机还停在摄影师自己的站立高度（1.72m），砖红眼平线越过坐姿老人的头顶掠过，仍带着站着俯看路人的距离感。",
  },
  C: {
    camY: 1.12, pitch: 0, right: true,
    msg: "答对了！方案 C 既是 0° 水平光轴（建筑墙柱笔直端正），又把机身蹲降到与坐姿老人齐平的 1.12m 高度，眼平线精准穿过主体视线，背景拱门与远山稳妥托住人物，亲近而自然。",
  },
  D: {
    camY: 0.55, pitch: 11, right: false,
    msg: "方案 D 不对：机位压得过低（0.55m）并抬头仰拍 +11°，眼平线沉到椅脚，背后拱门墙柱向天顶汇聚倾斜，带出了不自然的仰望压迫感。",
  },
};

export function initSection07() {
  const feedback = document.getElementById("quiz-feedback");
  const btns = [...document.querySelectorAll("[data-opt]")];

  // 用同一套 3D 针孔投影函数精确渲染四幅练习缩略图（含半圆拱门与黑檐顶）
  for (const [key, cfg] of Object.entries(QUIZ_OPTS)) {
    const svg = document.getElementById(`quiz-svg-${key}`);
    if (!svg) continue;
    const W = 260, H = 170;
    const st = { camY: cfg.camY, pitch: cfg.pitch, roll: 0, focal: 50 };
    const p = (x, y, z) => projectPoint(x, y, z, st, W, H);
    const f = (50 / 24) * H * 0.68;
    const hY = H * 0.5 + Math.tan((cfg.pitch * Math.PI) / 180) * f;

    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#D7E4EB" }, svg);
    const gL = p(-12, 0, 15), gR = p(12, 0, 15), gnR = p(12, 0, 1.5), gnL = p(-12, 0, 1.5);
    el("polygon", {
      points: `${gL.x},${gL.y} ${gR.x},${gR.y} ${gnR.x + 120},${Math.max(gnR.y, H + 80)} ${gnL.x - 120},${Math.max(gnL.y, H + 80)}`,
      fill: "#EFE8DD",
    }, svg);

    // 背后米白砖红半圆拱门
    const tl = p(-1.95, 4.0, 12.2), tr = p(1.95, 4.0, 12.2), br = p(1.95, 0, 12.2), bl = p(-1.95, 0, 12.2);
    const rTL = p(-2.05, 4.28, 12.2), rTR = p(2.05, 4.28, 12.2);
    el("polygon", { points: `${rTL.x},${rTL.y} ${rTR.x},${rTR.y} ${tr.x},${tr.y} ${tl.x},${tl.y}`, fill: "#0E1011" }, svg);
    el("polygon", { points: `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`, fill: "#F1ECE2", stroke: "#0E1011", "stroke-width": 1.1 }, svg);
    const aPts = [p(-0.95, 0, 12.2)];
    for (let i = 0; i <= 14; i++) {
      const ang = Math.PI - (i / 14) * Math.PI;
      aPts.push(p(Math.cos(ang) * 0.95, 1.65 + Math.sin(ang) * 0.95, 12.2));
    }
    aPts.push(p(0.95, 0, 12.2));
    el("polygon", { points: aPts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" "), fill: "#973524", stroke: "#0E1011", "stroke-width": 1.2 }, svg);
    const dC = p(0, 3.25, 12.2);
    el("circle", { cx: dC.x, cy: dC.y, r: 3.6, fill: "#A3432B" }, svg);

    // 坐姿老人剪影（真实坐姿眼高 1.12m，z = 5.4m）
    const sf = p(-0.45, 0, 5.4), stp = p(-0.45, 1.24, 5.4);
    svgPerson(svg, sf.x, sf.y, Math.max(26, sf.y - stp.y), "#1A232B", true);

    // 砖红眼平线
    el("line", { x1: 0, y1: hY, x2: W, y2: hY, stroke: "#A3432B", "stroke-width": 1.8 }, svg);
  }

  for (const b of btns) {
    b.addEventListener("click", () => {
      const k = b.dataset.opt;
      const info = QUIZ_OPTS[k];
      btns.forEach((x) => {
        x.classList.remove("is-right", "is-wrong");
        x.setAttribute("aria-pressed", String(x === b));
      });
      b.classList.add(info.right ? "is-right" : "is-wrong");
      feedback.className = `quiz-feedback ${info.right ? "is-right" : "is-wrong"}`;
      feedback.innerHTML = `<p>${info.msg}</p>`;
    });
  }

  // 原海报灯箱（复用 #poster.src，不重复内联；支持放大、拖拽、Esc 关闭）
  const openBtn = document.getElementById("poster-open-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const zIn = document.getElementById("lb-zoom-in");
  const zOut = document.getElementById("lb-zoom-out");
  const zReset = document.getElementById("lb-zoom-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!openBtn || !lb || !lbImg) return;

  let scale = 1, tx = 0, ty = 0, drag = null;
  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zReset.textContent = `${Math.round(scale * 100)}%`;
  };
  const openLb = () => {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1; tx = 0; ty = 0;
    apply();
    lb.hidden = false;
    closeBtn.focus();
  };
  const closeLb = () => {
    lb.hidden = true;
    openBtn.focus();
  };

  openBtn.addEventListener("click", openLb);
  closeBtn.addEventListener("click", closeLb);
  zIn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); apply(); });
  zOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); if (scale <= 1) { tx = 0; ty = 0; } apply(); });
  zReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && scale <= 1) { closeLb(); return; }
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    apply();
  });
  lbStage.addEventListener("pointerup", () => { drag = null; });
  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    apply();
  }, { passive: false });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
}
