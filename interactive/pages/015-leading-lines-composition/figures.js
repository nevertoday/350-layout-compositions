// 正文各节的互动图解（01 现实线条 / 02 消失点与焦段 / 03 直线与S形 / 04 隐含线 / 05 反例诊断 / 07 小练习 / 08 原海报灯箱）
// 所有人像一律用极简侧影或背影剪影，不画五官细节。
import { loop, reducedMotion } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
};

// 通用：极简焦点十字准星圆（呼应 015 原海报）
function focalTarget(cx, cy, r = 13) {
  const g = el("g");
  g.append(
    el("circle", { cx, cy, r, fill: PALETTE.orange }),
    el("circle", { cx, cy, r: Math.max(2, r * 0.22), fill: PALETTE.pinhole }),
    el("path", {
      d: `M${cx},${cy - r - 8}V${cy - r - 2} M${cx},${cy + r + 2}V${cy + r + 8} M${cx - r - 8},${cy}H${cx - r - 2} M${cx + r + 2},${cy}H${cx + r + 8}`,
      stroke: PALETTE.creamBright, "stroke-width": 1.4, "stroke-opacity": 0.85,
    })
  );
  return g;
}

// 通用：极简背影站立剪影（无五官）
function backSilhouette(x, feetY, h, color = PALETTE.pinhole) {
  const g = el("g");
  const headR = h * 0.13;
  g.append(
    el("circle", { cx: x, cy: feetY - h + headR, r: headR, fill: color }),
    el("path", {
      d: `M${x - h * 0.15},${feetY - h + headR * 2.15}
          L${x + h * 0.15},${feetY - h + headR * 2.15}
          L${x + h * 0.21},${feetY - h * 0.22}
          L${x + h * 0.1},${feetY - h * 0.22}
          L${x + h * 0.09},${feetY}
          L${x + h * 0.02},${feetY}
          L${x},${feetY - h * 0.22}
          L${x - h * 0.02},${feetY}
          L${x - h * 0.09},${feetY}
          L${x - h * 0.1},${feetY - h * 0.22}
          L${x - h * 0.21},${feetY - h * 0.22} Z`,
      fill: color,
    })
  );
  return g;
}

// =========================================================================
// 01 画面里现成的线：5 种现实原型 + 视线轨迹动画
// =========================================================================
function initFoundLines() {
  const svg = $("found-svg");
  const out = $("found-text");
  const MODES = {
    road: {
      pathD: "M90 306 L332 106",
      text: "道路与铁轨：前景最宽，沿透视一路收细直指远方站立的人影。视线自然从底边进入，不用任何文字提示就能看见目的地。",
      draw(f) {
        f.append(el("rect", { x: 0, y: 0, width: 460, height: 106, fill: "#0e2417" }));
        f.append(el("line", { x1: 0, y1: 106, x2: 460, y2: 106, stroke: PALETTE.cream, "stroke-opacity": 0.3 }));
        // 路面 + 枕木铁轨
        f.append(el("polygon", { points: "18,310 156,310 332,106", fill: PALETTE.cream }));
        f.append(el("polygon", { points: "176,310 264,310 332,106", fill: PALETTE.orange, opacity: 0.9 }));
        // 枕木横线（近疏远密）
        for (let i = 1; i <= 10; i++) {
          const p = 1 - Math.pow(i / 11, 1.45);
          const y = 106 + (310 - 106) * p;
          const xl = 332 + (18 - 332) * p;
          const xr = 332 + (264 - 332) * p;
          f.append(el("line", { x1: xl, y1: y, x2: xr, y2: y, stroke: PALETTE.bg, "stroke-width": 1 + p * 2.5, opacity: 0.55 }));
        }
        // 路边标桩
        for (let i = 1; i <= 6; i++) {
          const p = Math.pow(i / 6.6, 1.55);
          const x = 332 + (402 - 332) * p;
          const y = 106 + (310 - 106) * p;
          const ph = 10 + p * 44;
          f.append(el("line", { x1: x, y1: y, x2: x, y2: y - ph, stroke: PALETTE.cream, "stroke-width": 1.2 + p * 2, opacity: 0.7 }));
        }
        f.append(focalTarget(332, 102, 18));
        f.append(backSilhouette(332, 122, 34, PALETTE.pinhole));
      },
    },
    river: {
      pathD: "M76 306 C 180 260, 122 204, 240 166 C 325 138, 304 114, 342 96",
      text: "河流与岸线：蜿蜒的水道从左下前景切入，在画面中段轻轻回转再引向远处的灯塔。眼睛走得更慢、更从容，沿途风景全被串起来。",
      draw(f) {
        f.append(el("rect", { x: 0, y: 0, width: 460, height: 102, fill: "#0e2417" }));
        // 远山轮廓
        f.append(el("path", { d: "M0 102 L90 74 L190 96 L300 68 L410 92 L460 80 L460 102 Z", fill: "#173423" }));
        // 河道宽面
        f.append(el("path", {
          d: "M12 310 C 120 256, 78 200, 212 162 C 306 136, 294 114, 336 96 L348 96 C 324 118, 354 146, 270 176 C 166 212, 232 268, 154 310 Z",
          fill: PALETTE.cream, opacity: 0.9,
        }));
        // 岸边朱橙反光带
        f.append(el("path", {
          d: "M76 308 C 180 260, 122 204, 240 166 C 325 138, 304 114, 342 96",
          fill: "none", stroke: PALETTE.orange, "stroke-width": 3,
        }));
        // 远方灯塔与焦点
        f.append(focalTarget(344, 86, 15));
        f.append(el("path", { d: "M338 106 L341 68 L347 68 L350 106 Z", fill: PALETTE.pinhole }));
      },
    },
    rail: {
      pathD: "M24 252 L322 140",
      text: "栏杆与走廊：手扶栏杆、踢脚线与天花板顶梁同时从左右边缘伸出，多条线形成通道感，把视线直接锁在尽头的人影上。",
      draw(f) {
        // 走廊墙面与门框
        f.append(el("polygon", { points: "0,0 322,140 0,310", fill: "#132c1d" }));
        f.append(el("polygon", { points: "460,0 322,140 460,310", fill: "#102518" }));
        // 节奏立柱
        for (let i = 1; i <= 5; i++) {
          const p = Math.pow(i / 6, 1.35);
          const x = 322 * (1 - p);
          const yT = 140 * (1 - p);
          const yB = 140 + (310 - 140) * p;
          f.append(el("line", { x1: x, y1: yT, x2: x, y2: yB, stroke: PALETTE.pineLight, "stroke-width": 2 + p * 4 }));
        }
        // 左右鲜明扶手栏杆
        f.append(el("line", { x1: 0, y1: 248, x2: 322, y2: 140, stroke: PALETTE.orange, "stroke-width": 5 }));
        f.append(el("line", { x1: 0, y1: 282, x2: 322, y2: 140, stroke: PALETTE.cream, "stroke-width": 2 }));
        f.append(el("line", { x1: 460, y1: 236, x2: 322, y2: 140, stroke: PALETTE.orange, "stroke-width": 4 }));
        f.append(el("line", { x1: 0, y1: 44, x2: 322, y2: 140, stroke: PALETTE.cream, "stroke-width": 1.6, "stroke-opacity": 0.65 }));
        f.append(el("line", { x1: 460, y1: 56, x2: 322, y2: 140, stroke: PALETTE.cream, "stroke-width": 1.6, "stroke-opacity": 0.65 }));
        // 尽头高亮门洞与背影
        f.append(el("rect", { x: 298, y: 102, width: 48, height: 78, fill: PALETTE.orange }));
        f.append(backSilhouette(322, 180, 56, PALETTE.pinhole));
      },
    },
    beam: {
      pathD: "M64 36 L310 236",
      text: "穿透的光束：哪怕地板和墙壁空无一物，一束从高窗斜射下来的亮光也是极强的引导线——明暗反差本身就能替眼睛修出一条路。",
      draw(f) {
        // 暗室内空间
        f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: "#08150d" }));
        f.append(el("line", { x1: 0, y1: 242, x2: 460, y2: 242, stroke: PALETTE.cream, "stroke-opacity": 0.22 }));
        // 高窗开口
        f.append(el("polygon", { points: "26,12 96,12 96,64 26,56", fill: PALETTE.creamBright }));
        // 斜射光柱
        f.append(el("polygon", {
          points: "26,56 96,12 378,242 248,242",
          fill: PALETTE.cream, opacity: 0.24,
        }));
        f.append(el("polygon", {
          points: "48,44 86,22 336,242 282,242",
          fill: PALETTE.orange, opacity: 0.36,
        }));
        // 地上光斑与小桌主体
        f.append(el("ellipse", { cx: 310, cy: 244, rx: 54, ry: 11, fill: PALETTE.orange, opacity: 0.85 }));
        f.append(el("rect", { x: 294, y: 204, width: 32, height: 38, fill: PALETTE.pinhole, stroke: PALETTE.cream, "stroke-width": 1.5 }));
        f.append(focalTarget(310, 198, 12));
      },
    },
    arm: {
      pathD: "M38 242 L212 198 L348 118",
      text: "伸出的手臂：前景人物的一条手臂与指向姿势，把实体线条和隐含指向合二为一，直接把观者的目光从前景搭桥送到远处的目标。",
      draw(f) {
        f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: "#0c1e13" }));
        f.append(el("line", { x1: 0, y1: 184, x2: 460, y2: 184, stroke: PALETTE.cream, "stroke-opacity": 0.2 }));
        // 前景极简侧影肩臂剪影（严格不画五官，只画圆头剪影与伸出的手臂轮廓）
        f.append(el("circle", { cx: 68, cy: 132, r: 28, fill: "#193a26", stroke: PALETTE.cream, "stroke-opacity": 0.35 }));
        f.append(el("path", {
          d: "M12 310 L18 190 Q 48 164 96 174 L224 148 L234 162 L116 206 L112 310 Z",
          fill: "#193a26", stroke: PALETTE.cream, "stroke-width": 1.5,
        }));
        // 沿手臂延伸向焦点的引导虚线
        f.append(el("line", {
          x1: 230, y1: 152, x2: 356, y2: 112,
          stroke: PALETTE.orangeHi, "stroke-width": 2.2, "stroke-dasharray": "6 5",
        }));
        f.append(focalTarget(366, 108, 18));
      },
    },
  };

  let active = "road";
  let progress = reducedMotion.matches ? 1 : 0;
  let pathEl = null;
  let dotEl = null;
  let haloEl = null;

  function renderMode() {
    const m = MODES[active];
    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: PALETTE.bgDeep }));
    m.draw(f);

    // 视线路径动画线 + 移动光点
    pathEl = el("path", {
      d: m.pathD,
      fill: "none",
      stroke: PALETTE.creamBright,
      "stroke-width": 2.2,
      "stroke-dasharray": "6 6",
      opacity: 0.72,
    });
    haloEl = el("circle", { cx: 0, cy: 0, r: 10, fill: PALETTE.orangeHi, opacity: 0.35 });
    dotEl = el("circle", { cx: 0, cy: 0, r: 4.5, fill: PALETTE.creamBright, stroke: PALETTE.orange, "stroke-width": 2 });
    f.append(pathEl, haloEl, dotEl);

    // 角落标注
    f.append(el("text", { x: 14, y: 24, fill: PALETTE.dim, "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "EYE-PATH TRACE"));
    svg.replaceChildren(f);
    out.textContent = m.text;
    placeDot(progress);
  }

  function placeDot(p) {
    if (!pathEl || !dotEl) return;
    const len = pathEl.getTotalLength();
    const pt = pathEl.getPointAtLength(len * Math.min(1, Math.max(0, p)));
    dotEl.setAttribute("cx", pt.x);
    dotEl.setAttribute("cy", pt.y);
    haloEl.setAttribute("cx", pt.x);
    haloEl.setAttribute("cy", pt.y);
  }

  const anim = loop(svg, (_t, dt, { still }) => {
    if (still) {
      progress = 0.86;
      placeDot(progress);
      return;
    }
    progress = (progress + dt * 0.42) % 1.25;
    placeDot(Math.min(1, progress));
  });

  document.querySelectorAll("[data-found]").forEach((btn) => {
    btn.addEventListener("click", () => {
      active = btn.dataset.found;
      progress = reducedMotion.matches ? 0.86 : 0;
      document.querySelectorAll("[data-found]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      renderMode();
      anim.draw();
    });
  });

  $("found-replay").addEventListener("click", () => {
    progress = 0;
    placeDot(0);
    anim.draw();
  });

  renderMode();
}

// =========================================================================
// 02 消失点与纵深：机位高度 + 镜头焦段实验
// =========================================================================
function initVanishingLab() {
  const svg = $("vp-svg");
  const hInput = $("vp-height");
  const fInput = $("vp-fov");
  const hOut = $("vp-h-val");
  const fOut = $("vp-f-val");
  const out = $("vp-text");

  function draw() {
    const hVal = +hInput.value; // 15 (低机位) .. 85 (高机位俯拍)
    const focalMm = +fInput.value; // 18mm (超广角) .. 85mm (长焦)

    // 相机越高，地平线越靠上（俯拍）；相机越贴地，地平线越靠下（仰视感，前景线条张开）
    const hy = 250 - ((hVal - 15) / 70) * 185; // 65..250
    const vx = 230;
    // 广角让前景线条极度外扩，长焦则把两侧线条压得更接近平行
    const spread = 1.65 - ((focalMm - 18) / 67) * 1.12; // 1.65 (18mm) .. 0.53 (85mm)

    const camMeters = (0.3 + ((hVal - 15) / 70) * 3.7).toFixed(1);
    const hTag = hVal < 34 ? `低机位 ${camMeters}m` : hVal > 64 ? `高机位 ${camMeters}m` : `眼平 ${camMeters}m`;
    const fTag = focalMm <= 28 ? `广角 ${focalMm}mm` : focalMm >= 60 ? `长焦 ${focalMm}mm` : `标准 ${focalMm}mm`;
    hOut.textContent = hTag;
    fOut.textContent = fTag;

    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: PALETTE.bgDeep }));
    // 天空 / 地面
    f.append(el("rect", { x: 0, y: hy, width: 460, height: 310 - hy, fill: "#102418" }));
    f.append(el("line", { x1: 0, y1: hy, x2: 460, y2: hy, stroke: PALETTE.cream, "stroke-dasharray": "4 5", "stroke-opacity": 0.45 }));

    // 路宽按广角张力张开
    const roadHalf = 115 * spread;
    const band1L = vx - roadHalf;
    const band1R = vx - roadHalf * 0.16;
    const band2L = vx + roadHalf * 0.08;
    const band2R = vx + roadHalf * 0.85;
    f.append(el("polygon", { points: `${band1L},310 ${band1R},310 ${vx},${hy}`, fill: PALETTE.cream }));
    f.append(el("polygon", { points: `${band2L},310 ${band2R},310 ${vx},${hy}`, fill: PALETTE.orange }));

    // 两侧建筑立柱与顶部连线（体现纵深压缩）
    const steps = focalMm <= 32 ? 7 : focalMm >= 60 ? 5 : 6;
    const sideTopX = vx - 185 * spread;
    const sideTopXR = vx + 185 * spread;
    const topY = Math.max(-80, hy - 155 * spread);
    f.append(el("line", { x1: sideTopX, y1: topY, x2: vx, y2: hy, stroke: PALETTE.orangeHi, "stroke-width": 1.6, "stroke-opacity": 0.72 }));
    f.append(el("line", { x1: sideTopXR, y1: topY, x2: vx, y2: hy, stroke: PALETTE.orangeHi, "stroke-width": 1.6, "stroke-opacity": 0.72 }));

    for (let i = 1; i <= steps; i++) {
      const p = Math.pow(i / (steps + 0.6), focalMm < 35 ? 1.75 : 1.15);
      const yBase = hy + (310 - hy) * p;
      const xL = vx + (band1L - vx) * p;
      const xR = vx + (band2R - vx) * p;
      const postH = (32 + p * 120) * Math.min(1.25, spread);
      f.append(el("line", { x1: xL - 8 * p, y1: yBase, x2: xL - 8 * p, y2: yBase - postH, stroke: PALETTE.cream, "stroke-width": 1 + p * 2.5, opacity: 0.55 }));
      f.append(el("line", { x1: xR + 8 * p, y1: yBase, x2: xR + 8 * p, y2: yBase - postH, stroke: PALETTE.cream, "stroke-width": 1 + p * 2.5, opacity: 0.55 }));
      f.append(el("line", { x1: xL, y1: yBase, x2: xR, y2: yBase, stroke: PALETTE.bg, "stroke-width": 1 + p * 1.4, opacity: 0.5 }));
    }

    // 消失点焦点与人影
    f.append(focalTarget(vx, hy, 14));
    f.append(backSilhouette(vx, hy + 18, 28, PALETTE.pinhole));
    f.append(el("text", { x: 12, y: hy - 6, fill: PALETTE.cream, "font-size": 10.5, "font-family": "JetBrains Mono, monospace", opacity: 0.75 }, "HORIZON"));
    f.append(el("text", { x: 448, y: 22, "text-anchor": "end", fill: PALETTE.orangeHi, "font-size": 11, "font-family": "JetBrains Mono, monospace" }, `${focalMm}mm · H=${camMeters}m`));
    svg.replaceChildren(f);

    const hMsg =
      hVal < 34
        ? "机位贴近地面，地平线压得很低，路面线条在前景大幅张开，空间充满仰视的迫近感；"
        : hVal > 64
        ? "高机位俯拍把地平线推高，地面与路径占满画幅，观众像站在高处俯瞰整条路线走向；"
        : "常规眼平机位接近人眼站立所见，纵深感自然克制；";
    const fMsg =
      focalMm <= 28
        ? "广角镜头（≤28mm）显著放大近大远小，两侧线条急剧向中心收拢，把眼睛猛地吸向消失点。"
        : focalMm >= 60
        ? "长焦镜头（≥60mm）压缩前后景距离，线条汇聚角度变缓、更显平静，适合克制地交代空间层次。"
        : "中焦视角在纵深拉扯与自然比例之间保持平衡，线条清晰而不夸张。";
    out.textContent = hMsg + fMsg;
  }

  hInput.addEventListener("input", draw);
  fInput.addEventListener("input", draw);
  draw();
}

// =========================================================================
// 03 线的性格：直推 / 多线汇聚 / S 形曲线 + 视线速度动画
// =========================================================================
function initMoodLab() {
  const svg = $("mood-svg");
  const bendWrap = $("mood-bend-wrap");
  const bendInput = $("mood-bend");
  const bendOut = $("mood-bend-val");
  const out = $("mood-text");

  let mode = "scurve";
  let progress = reducedMotion.matches ? 0.85 : 0;
  let trackEl = null;
  let dotEl = null;
  let haloEl = null;

  function buildPath() {
    const b = +bendInput.value / 100; // 0.15..1
    if (mode === "straight") {
      return {
        main: "M 54 278 L 368 82",
        extras: [],
        speed: 0.62,
        tag: "直达 · 节奏干脆",
        text: "单条直线路径最短，眼睛从左下角出发半秒就撞上焦点。果断、硬朗、有冲击力，但停留时间短，画面一眼就能看完。",
      };
    }
    if (mode === "converge") {
      return {
        main: "M 130 294 L 352 94",
        extras: [
          "M 24 294 L 352 94",
          "M 258 294 L 352 94",
          "M 28 164 L 352 94",
          "M 392 294 L 352 94",
        ],
        speed: 0.72,
        tag: "汇聚 · 吸入感最强",
        text: "多条线条从四面同时夹向同一个焦点，视觉重心几乎不可抗拒。纵深感与速度感最强，适合需要立刻锁死主角的场景。",
      };
    }
    const amp = 38 + b * 118;
    const cx1 = 150 + amp * 0.95;
    const cy1 = 278 - amp * 0.25;
    const cx2 = 160 - amp * 0.68;
    const cy2 = 132 + amp * 0.22;
    return {
      main: `M 72 290 C ${cx1.toFixed(0)} ${cy1.toFixed(0)}, ${cx2.toFixed(0)} ${cy2.toFixed(0)}, 360 76`,
      extras: [],
      speed: 0.34 - b * 0.08,
      tag: `S 形曲线 · 弯曲 ${Math.round(b * 100)}%`,
      text:
        b > 0.65
          ? "大幅度 S 形曲线把直线拉长了将近一倍：视线先向右探、再向左折返，最后落到右上方焦点。优雅、耐看，让观众在画面里多停留两三秒。"
          : "舒缓的 S 形曲线比直线温和，既保留明确的推进方向，又带有一点起伏与呼吸感，常见于林间小路与海岸线。",
    };
  }

  function render() {
    bendWrap.style.display = mode === "scurve" ? "" : "none";
    bendOut.textContent = `${bendInput.value}%`;
    const cfg = buildPath();
    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: PALETTE.bgDeep }));

    // 轻微地形网格参照
    for (let y = 70; y < 310; y += 60) {
      f.append(el("line", { x1: 0, y1: y, x2: 460, y2: y, stroke: PALETTE.cream, "stroke-opacity": 0.07 }));
    }

    for (const d of cfg.extras) {
      f.append(el("path", { d, fill: "none", stroke: PALETTE.cream, "stroke-width": 1.8, opacity: 0.45 }));
    }

    // 主路径宽底 + 橙色核心线
    f.append(el("path", {
      d: cfg.main, fill: "none", stroke: PALETTE.cream,
      "stroke-width": mode === "scurve" ? 16 : 12, "stroke-linecap": "butt", opacity: 0.2,
    }));
    trackEl = el("path", {
      d: cfg.main, fill: "none", stroke: PALETTE.orange,
      "stroke-width": 4, "stroke-linecap": "round",
    });
    f.append(trackEl);

    const endPt = mode === "straight" ? [368, 82] : mode === "converge" ? [352, 94] : [360, 76];
    f.append(focalTarget(endPt[0], endPt[1], 15));

    haloEl = el("circle", { cx: 0, cy: 0, r: 12, fill: PALETTE.orangeHi, opacity: 0.34 });
    dotEl = el("circle", { cx: 0, cy: 0, r: 5, fill: PALETTE.creamBright, stroke: PALETTE.orange, "stroke-width": 2 });
    f.append(haloEl, dotEl);

    f.append(el("text", { x: 14, y: 24, fill: PALETTE.orangeHi, "font-size": 11.5, "font-family": "JetBrains Mono, monospace" }, cfg.tag));
    svg.replaceChildren(f);
    out.textContent = cfg.text;
    placeDot(progress);
  }

  function placeDot(p) {
    if (!trackEl || !dotEl) return;
    const len = trackEl.getTotalLength();
    const pt = trackEl.getPointAtLength(len * Math.min(1, Math.max(0, p)));
    dotEl.setAttribute("cx", pt.x);
    dotEl.setAttribute("cy", pt.y);
    haloEl.setAttribute("cx", pt.x);
    haloEl.setAttribute("cy", pt.y);
  }

  const anim = loop(svg, (_t, dt, { still }) => {
    if (still) {
      progress = 0.72;
      placeDot(progress);
      return;
    }
    const cfg = buildPath();
    progress = (progress + dt * cfg.speed) % 1.24;
    placeDot(Math.min(1, progress));
  });

  document.querySelectorAll("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mood;
      progress = reducedMotion.matches ? 0.72 : 0;
      document.querySelectorAll("[data-mood]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      render();
      anim.draw();
    });
  });
  bendInput.addEventListener("input", () => {
    render();
    anim.draw();
  });
  $("mood-replay").addEventListener("click", () => {
    progress = 0;
    placeDot(0);
    anim.draw();
  });

  render();
}

// =========================================================================
// 04 隐含线：视线、指向与点列接力（极简侧影，绝不画五官）
// =========================================================================
function initImpliedLab() {
  const svg = $("implied-svg");
  const angleInput = $("implied-angle");
  const angleOut = $("implied-deg-val");
  const showInput = $("implied-show");
  const out = $("implied-text");

  let mode = "lock"; // lock | away | dots

  function draw() {
    const deg = +angleInput.value; // -42..52
    const show = showInput.checked;
    angleOut.textContent = `${deg > 0 ? "+" : ""}${deg}°`;

    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: PALETTE.bgDeep }));
    f.append(el("line", { x1: 0, y1: 266, x2: 460, y2: 266, stroke: PALETTE.cream, "stroke-opacity": 0.2 }));

    const target = { x: 364, y: 112 };
    f.append(focalTarget(target.x, target.y, 17));

    if (mode === "dots") {
      // 点列接力：5 根孤立灯柱 / 石墩排成一条斜线，没有画连线，大脑自动接成路径
      const pts = [
        [66, 260, 26],
        [136, 224, 22],
        [204, 188, 18],
        [268, 156, 14],
        [320, 130, 10],
      ];
      if (show) {
        f.append(el("line", {
          x1: 54, y1: 266, x2: target.x, y2: target.y,
          stroke: PALETTE.orangeHi, "stroke-width": 1.8, "stroke-dasharray": "6 6", opacity: 0.85,
        }));
      }
      for (const [x, y, h] of pts) {
        f.append(el("rect", { x: x - 4, y: y - h, width: 8, height: h, fill: PALETTE.cream, opacity: 0.85 }));
        f.append(el("circle", { cx: x, cy: y - h - 5, r: 4.5, fill: PALETTE.orangeHi }));
      }
      f.append(el("text", { x: 14, y: 24, fill: PALETTE.dim, "font-size": 11, "font-family": "JetBrains Mono, monospace" }, "IMPLIED ALIGNMENT"));
      out.textContent = "点列接力：五盏孤立的路灯之间并没有画任何实线，但因为排列方向一致、由近及远缩小，大脑会根据良好延续律自动把它们连成一条指向焦点的隐含线。";
    } else {
      // 极简侧影人物（纯轮廓，绝无眼睛或嘴部细节）
      const px = 112;
      const py = 166;
      const rad = (deg * Math.PI) / 180;
      const dirX = Math.cos(rad);
      const dirY = Math.sin(rad);

      // 躯干与肩背剪影
      f.append(el("path", {
        d: `M70 266 L78 198 Q 92 178 122 182 L144 202 L148 266 Z`,
        fill: "#1a3b27", stroke: PALETTE.cream, "stroke-width": 1.4, "stroke-opacity": 0.65,
      }));
      // 独立从肩部伸出的指向手臂剪影，随朝向角度抬落
      const armG = el("g", { transform: `translate(124,198) rotate(${deg})` });
      armG.append(el("path", {
        d: "M-4,-8 L72,-4 L82,0 L72,4 L-4,8 Z",
        fill: PALETTE.cream, opacity: 0.88,
      }));
      f.append(armG);
      // 头部侧影（纯几何轮廓暗示朝向，绝不画五官）
      const headG = el("g", { transform: `translate(${px},${py}) rotate(${deg * 0.72})` });
      headG.append(el("path", {
        d: "M-18,-21 C-2,-27 18,-19 20,-4 L26,2 L20,8 C17,21 2,23 -13,19 C-24,15 -26,-12 -18,-21 Z",
        fill: "#1a3b27", stroke: PALETTE.cream, "stroke-width": 1.4,
      }));
      f.append(headG);

      // 计算射线是否击中主体
      const ox = px + dirX * 26;
      const oy = py + dirY * 26;
      const ex = ox + dirX * 360;
      const ey = oy + dirY * 360;
      // 点到射线距离
      const tx = target.x - ox;
      const ty = target.y - oy;
      const proj = tx * dirX + ty * dirY;
      const perp = Math.abs(tx * -dirY + ty * dirX);
      const hit = proj > 0 && perp < 34;

      if (show) {
        f.append(el("line", {
          x1: ox, y1: oy, x2: hit ? target.x : ex, y2: hit ? target.y : ey,
          stroke: hit ? PALETTE.orangeHi : PALETTE.cream,
          "stroke-width": hit ? 2.4 : 1.6,
          "stroke-dasharray": "6 6",
          opacity: 0.9,
        }));
      }

      f.append(el("text", {
        x: 14, y: 24,
        fill: hit ? PALETTE.orangeHi : PALETTE.dim,
        "font-size": 11, "font-family": "JetBrains Mono, monospace",
      }, hit ? "GAZE → LOCKED ON SUBJECT" : "GAZE → DRIFTING AWAY"));

      out.textContent = hit
        ? `朝向 ${angleOut.textContent}：剪影人物的视线与指向正好锁在右上角焦点上。即使关掉「显出隐含射线」，你的眼睛依然会不由自主地顺着他的朝向望过去。`
        : `朝向 ${angleOut.textContent}：人物望向了别处，观众的目光也会被这条看不见的射线拉偏，右上角的焦点瞬间失去了呼应。把滑块往 -12° 附近拨回来试试。`;
    }

    svg.replaceChildren(f);
  }

  document.querySelectorAll("[data-implied]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.implied;
      if (mode === "lock") angleInput.value = "-12";
      if (mode === "away") angleInput.value = "32";
      angleInput.disabled = mode === "dots";
      document.querySelectorAll("[data-implied]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      draw();
    });
  });

  angleInput.addEventListener("input", () => {
    if (mode === "dots") mode = "lock";
    document.querySelectorAll("[data-implied]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    draw();
  });
  showInput.addEventListener("change", draw);
  draw();
}

// =========================================================================
// 05 反例诊断台：问题原图 ↔ 修复之后
// =========================================================================
function initCounterExamples() {
  const svg = $("bad-svg");
  const out = $("bad-text");
  let kind = "exit"; // exit | fight | block
  let fixed = false;

  const COPY = {
    exit: {
      bad: "问题 · 有路无终点：道路一路收窄却直冲右边缘画外，尽头空无一物。眼睛搭上快车后，直接被甩出了画框。",
      good: "修复 · 补上视觉落点：略微左移取景并等主体进入汇聚点之前，线条把人送进画框内部就稳稳刹住。",
    },
    fight: {
      bad: "问题 · 线与主体反向：主角孤零零站在左边，画面里最亮的长栏杆却一路扫向右下空角，观众先被线条拖走，再费力回头找主角。",
      good: "修复 · 换个站位顺向引导：挪到栏杆另一侧拍摄，让最强的线条直接斜指向左侧主角，环境与主体终于站到同一边。",
    },
    block: {
      bad: "问题 · 前景横杆拦截：一条粗重的横向护栏把原本通畅的纵深通道拦腰切断，良好延续律被强行打断，视线停在障碍物上。",
      good: "修复 · 抬高机位越过障碍：踮高机位或贴近栏杆探出镜头，把横杆移出路径，引导线重新一气呵成直抵主体。",
    },
  };

  function draw() {
    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 460, height: 310, fill: PALETTE.bgDeep }));

    if (kind === "exit") {
      if (!fixed) {
        f.append(el("polygon", { points: "30,310 175,310 460,126 460,96", fill: PALETTE.cream, opacity: 0.9 }));
        f.append(el("polygon", { points: "190,310 278,310 460,154 460,136", fill: PALETTE.orange }));
        // 冲出画框的警示箭头
        f.append(el("path", { d: "M120 296 L452 114", stroke: PALETTE.creamBright, "stroke-width": 2.2, "stroke-dasharray": "6 5" }));
        f.append(el("path", { d: "M440 108 L456 112 L448 127", fill: "none", stroke: PALETTE.orangeHi, "stroke-width": 2.6 }));
        f.append(el("rect", { x: 312, y: 18, width: 134, height: 26, fill: PALETTE.orange }));
        f.append(el("text", { x: 379, y: 35, "text-anchor": "middle", fill: PALETTE.bg, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "× 视线滑出画框"));
      } else {
        f.append(el("polygon", { points: "30,310 175,310 342,108", fill: PALETTE.cream, opacity: 0.9 }));
        f.append(el("polygon", { points: "190,310 278,310 342,108", fill: PALETTE.orange }));
        f.append(focalTarget(342, 106, 17));
        f.append(backSilhouette(342, 126, 36, PALETTE.pinhole));
        f.append(el("rect", { x: 320, y: 18, width: 126, height: 26, fill: PALETTE.surface, stroke: PALETTE.orange }));
        f.append(el("text", { x: 383, y: 35, "text-anchor": "middle", fill: PALETTE.orangeHi, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "✓ 落在画内焦点"));
      }
    } else if (kind === "fight") {
      if (!fixed) {
        // 主角在左
        f.append(focalTarget(96, 118, 16));
        f.append(backSilhouette(96, 140, 38, PALETTE.pinhole));
        // 强栏杆反而拖向右下角空处
        f.append(el("polygon", { points: "152,66 174,66 460,290 388,310", fill: PALETTE.cream, opacity: 0.88 }));
        f.append(el("line", { x1: 164, y1: 66, x2: 452, y2: 294, stroke: PALETTE.orange, "stroke-width": 4.5 }));
        f.append(el("path", { d: "M438 294 L454 295 L447 280", fill: "none", stroke: PALETTE.orangeHi, "stroke-width": 2.4 }));
        f.append(el("rect", { x: 296, y: 18, width: 150, height: 26, fill: PALETTE.orange }));
        f.append(el("text", { x: 371, y: 35, "text-anchor": "middle", fill: PALETTE.bg, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "× 线条把视线拉反了"));
      } else {
        // 栏杆从右下指向左上主角
        f.append(el("polygon", { points: "448,310 330,310 112,118", fill: PALETTE.cream, opacity: 0.88 }));
        f.append(el("line", { x1: 422, y1: 310, x2: 112, y2: 118, stroke: PALETTE.orange, "stroke-width": 4.5 }));
        f.append(focalTarget(112, 118, 17));
        f.append(backSilhouette(112, 140, 38, PALETTE.pinhole));
        f.append(el("rect", { x: 312, y: 18, width: 134, height: 26, fill: PALETTE.surface, stroke: PALETTE.orange }));
        f.append(el("text", { x: 379, y: 35, "text-anchor": "middle", fill: PALETTE.orangeHi, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "✓ 线与主体同向"));
      }
    } else {
      // block: 横杆拦截
      f.append(el("polygon", { points: "36,310 176,310 318,98", fill: PALETTE.cream, opacity: 0.88 }));
      f.append(el("polygon", { points: "194,310 278,310 318,98", fill: PALETTE.orange }));
      f.append(focalTarget(318, 96, 16));
      f.append(backSilhouette(318, 116, 34, PALETTE.pinhole));
      if (!fixed) {
        // 前景粗横杆强行拦腰截断
        f.append(el("rect", { x: 0, y: 174, width: 460, height: 22, fill: "#0a160e", stroke: PALETTE.creamBright, "stroke-width": 2 }));
        f.append(el("line", { x1: 0, y1: 214, x2: 460, y2: 214, stroke: PALETTE.cream, "stroke-width": 6, opacity: 0.85 }));
        f.append(el("rect", { x: 294, y: 18, width: 152, height: 26, fill: PALETTE.orange }));
        f.append(el("text", { x: 370, y: 35, "text-anchor": "middle", fill: PALETTE.bg, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "× 横向障碍切断路径"));
      } else {
        f.append(el("rect", { x: 312, y: 18, width: 134, height: 26, fill: PALETTE.surface, stroke: PALETTE.orange }));
        f.append(el("text", { x: 379, y: 35, "text-anchor": "middle", fill: PALETTE.orangeHi, "font-size": 12, "font-weight": 700, "font-family": "Noto Sans SC, sans-serif" }, "✓ 路径畅通无阻"));
      }
    }

    svg.replaceChildren(f);
    out.textContent = COPY[kind][fixed ? "good" : "bad"];
  }

  document.querySelectorAll("[data-bad]").forEach((btn) => {
    btn.addEventListener("click", () => {
      kind = btn.dataset.bad;
      fixed = false;
      document.querySelectorAll("[data-bad]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      document.querySelectorAll("[data-fix]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.fix === "bad"))
      );
      draw();
    });
  });

  document.querySelectorAll("[data-fix]").forEach((btn) => {
    btn.addEventListener("click", () => {
      fixed = btn.dataset.fix === "good";
      document.querySelectorAll("[data-fix]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      draw();
    });
  });

  draw();
}

// =========================================================================
// 07 小练习：天桥独行者四选一
// =========================================================================
function initQuiz() {
  const drawMini = (id, fn) => {
    const svg = $(id);
    const f = new DocumentFragment();
    f.append(el("rect", { x: 0, y: 0, width: 150, height: 190, fill: PALETTE.bgDeep }));
    fn(f);
    svg.replaceChildren(f);
  };

  // A: 横平栏杆，无纵深引导，独行者孤悬顶边
  drawMini("q-a", (f) => {
    for (const y of [84, 110, 136, 162]) {
      f.append(el("line", { x1: 0, y1: y, x2: 150, y2: y, stroke: PALETTE.cream, "stroke-width": 2.4, opacity: 0.72 }));
    }
    f.append(el("circle", { cx: 112, cy: 48, r: 10, fill: PALETTE.orange }));
    f.append(backSilhouette(112, 64, 24, PALETTE.pinhole));
  });

  // B (最佳): 桥面与双侧扶手从底边稳稳汇聚到右上方焦点人物
  drawMini("q-b", (f) => {
    f.append(el("polygon", { points: "12,190 66,190 104,64", fill: PALETTE.cream, opacity: 0.88 }));
    f.append(el("polygon", { points: "74,190 112,190 104,64", fill: PALETTE.orange, opacity: 0.88 }));
    f.append(el("line", { x1: 0, y1: 146, x2: 104, y2: 64, stroke: PALETTE.orangeHi, "stroke-width": 2.5 }));
    f.append(el("line", { x1: 150, y1: 154, x2: 104, y2: 64, stroke: PALETTE.cream, "stroke-width": 2 }));
    f.append(focalTarget(104, 62, 11));
    f.append(backSilhouette(104, 76, 24, PALETTE.pinhole));
  });

  // C: 透视线冲向右上画外，主角被晾在左侧
  drawMini("q-c", (f) => {
    f.append(el("polygon", { points: "14,190 78,190 150,74 150,48", fill: PALETTE.cream, opacity: 0.88 }));
    f.append(el("line", { x1: 42, y1: 190, x2: 150, y2: 58, stroke: PALETTE.orange, "stroke-width": 3.5 }));
    f.append(el("circle", { cx: 34, cy: 68, r: 10, fill: PALETTE.orange }));
    f.append(backSilhouette(34, 84, 24, PALETTE.pinhole));
  });

  // D: 有汇聚线，但前景一根厚横梁直接拦腰截断
  drawMini("q-d", (f) => {
    f.append(el("polygon", { points: "18,190 78,190 96,64", fill: PALETTE.cream, opacity: 0.85 }));
    f.append(el("polygon", { points: "84,190 118,190 96,64", fill: PALETTE.orange, opacity: 0.85 }));
    f.append(el("circle", { cx: 96, cy: 64, r: 10, fill: PALETTE.orange }));
    f.append(backSilhouette(96, 78, 24, PALETTE.pinhole));
    f.append(el("rect", { x: 0, y: 112, width: 150, height: 18, fill: PALETTE.bg, stroke: PALETTE.creamBright, "stroke-width": 2 }));
  });

  const ANSWERS = {
    a: "A 不理想：四条栏杆完全水平，视线只在左右之间来回平扫，不会往上走去寻找独行者。",
    b: "选对了，B 最好！桥面色带和两侧扶手都从前景底边自然起笔，把眼睛沿着纵深稳稳送进右上方的主体。",
    c: "C 踩了反例的坑：最强的走廊线条把视线直接送出了右上角画外，独行者被冷落在左侧空白处。",
    d: "D 差了一步：汇聚方向本来对了，但画面正中的粗横杆把引导路径拦腰截断，眼睛在半路被卡住。",
  };

  const out = $("quiz-text");
  document.querySelectorAll(".pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.pick;
      document.querySelectorAll(".pick").forEach((b) => {
        b.classList.remove("ok", "wrong");
        if (b === btn) b.classList.add(p === "b" ? "ok" : "wrong");
      });
      out.textContent = ANSWERS[p];
    });
  });
}

// =========================================================================
// 08 原海报灯箱（放大 / 缩小 / 拖动 / Esc 关闭）
// =========================================================================
function initPosterViewer() {
  const dlg = $("viewer");
  const img = $("viewer-img");
  const scroll = $("viewer-scroll");
  const val = $("zoom-val");
  const openBtn = $("poster-open");
  let scale = 1;

  function applyZoom() {
    const base = Math.min(scroll.clientWidth - 32, 920);
    img.style.width = `${Math.round(Math.max(280, base) * scale)}px`;
    val.textContent = `${Math.round(scale * 100)}%`;
  }

  openBtn.addEventListener("click", () => {
    if (!img.src) img.src = $("poster").src;
    scale = 1;
    dlg.showModal();
    requestAnimationFrame(applyZoom);
  });

  $("zoom-in").addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.25).toFixed(2));
    applyZoom();
  });
  $("zoom-out").addEventListener("click", () => {
    scale = Math.max(0.5, +(scale - 0.25).toFixed(2));
    applyZoom();
  });
  $("viewer-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener("close", () => openBtn.focus({ preventScroll: true }));

  // 拖动平移大图
  let pan = null;
  scroll.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: scroll.scrollLeft, sy: scroll.scrollTop };
    scroll.setPointerCapture(e.pointerId);
    scroll.classList.add("grabbing");
  });
  scroll.addEventListener("pointermove", (e) => {
    if (!pan) return;
    scroll.scrollLeft = pan.sx - (e.clientX - pan.x);
    scroll.scrollTop = pan.sy - (e.clientY - pan.y);
  });
  const endPan = () => {
    pan = null;
    scroll.classList.remove("grabbing");
  };
  scroll.addEventListener("pointerup", endPan);
  scroll.addEventListener("pointercancel", endPan);
}

// =========================================================================
// 滚动显隐
// =========================================================================
function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
  );
  nodes.forEach((n) => io.observe(n));
}

export function initFigures() {
  initFoundLines();
  initVanishingLab();
  initMoodLab();
  initImpliedLab();
  initCounterExamples();
  initQuiz();
  initPosterViewer();
  initReveal();
}
