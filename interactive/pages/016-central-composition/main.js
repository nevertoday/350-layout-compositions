// 016 居中构图 · 主控脚本
// 驱动「装裱师裁卡纸」三联展墙工作台：
// - 展墙贯穿原海报标志性的黑色十字虚线中轴，交点处标中心「+」，平涂质感朱红圆盘固定于此；
// - 开场卡纸偏斜且 3 件杂物在场；先逐件点掉杂物清场，再拖动四条卡纸内沿把手；
// - 实时连出画框中心偏离「+」的偏移线与四边毫米留白，对应左侧横纵双轴天平与右侧实时诊断。

import { loop, reducedMotion, webgl } from "../../lib/stage.js";
import {
  activeClutter,
  arnheimForce,
  BOTTOM_WEIGHT_EXTRA_MM,
  clamp,
  clampWin,
  classify,
  dualBalance,
  equalPresetWin,
  INITIAL_CLUTTER_MASK,
  INITIAL_WIN,
  layoutGeometry,
  snapEdge,
  visualCentroid,
  weightedPresetWin,
} from "./model.js";
import { PALETTE } from "./palette.js";
import { createScene3D } from "./scene-3d.js";
import { createSceneFlat } from "./scene-flat.js";
import { initLabs } from "./labs.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text != null) n.textContent = text;
  return n;
};

document.documentElement.classList.add("js-ready");

// ---------- 开场装裱师裁卡纸工作台 ----------
const triptych = $("hero-triptych");
const workbench = $("workbench");
const stage = $("hero-stage");
const host = $("hero-canvas-host");
const overlay = $("hero-overlay");
const readout = $("hero-readout");
const balanceArmH = $("balance-arm-h");
const balanceArmV = $("balance-arm-v");
const balanceValH = $("balance-val-h");
const balanceValV = $("balance-val-v");
const balanceOffH = $("balance-off-h");
const balanceOffV = $("balance-off-v");
const clutterBtns = [...document.querySelectorAll(".clutter-btn")];

const edgeHandles = {
  left: $("handle-left"),
  right: $("handle-right"),
  top: $("handle-top"),
  bottom: $("handle-bottom"),
};

// 开场就是卡纸歪斜、3 件杂物全部在场——把动作留给读者，不提前给答案
const state = {
  win: { ...INITIAL_WIN },
  subject: "sphere",
  guide: "caliper",
  clutterMask: [...INITIAL_CLUTTER_MASK],
};

// 开场动画仅做 0.55 秒的卡纸切入（从稍外侧合拢至初始偏斜状态，不自动摆正）
const ENTRY_WIN = {
  left: INITIAL_WIN.left + 6,
  right: INITIAL_WIN.right + 6,
  top: INITIAL_WIN.top + 5,
  bottom: INITIAL_WIN.bottom + 5,
};
const shown = { ...ENTRY_WIN };

let userInteracted = false;
let activeSide = null;
let stageW = 500;
let stageH = 480;
let lastOverlayKey = "";

let renderer;
try {
  renderer = webgl() ? createScene3D(host) : null;
} catch {
  renderer = null;
}
if (!renderer) {
  renderer = createSceneFlat(host);
  stage.classList.add("is-flat");
}

function syncHandlesAndClutter(geom) {
  const invW = 100 / Math.max(1, geom.W);
  const invH = 100 / Math.max(1, geom.H);

  for (const [side, btn] of Object.entries(edgeHandles)) {
    if (!btn) continue;
    const p = geom.handles[side];
    btn.style.left = `${p.x * invW}%`;
    btn.style.top = `${p.y * invH}%`;
  }

  for (let i = 0; i < clutterBtns.length; i++) {
    const btn = clutterBtns[i];
    const on = Boolean(state.clutterMask[i]);
    btn.hidden = !on;
    if (on) {
      const item = geom.clutter[i];
      btn.style.left = `${item.x * invW}%`;
      btn.style.top = `${item.y * invH}%`;
    }
  }
}

function drawCaliperLabel(frag, x, y, text, color, anchor = "middle") {
  // 估算中英混排标签宽度，自动留足左右留白
  let units = 0;
  for (const ch of text) units += ch.charCodeAt(0) > 127 ? 1.65 : 1;
  const w = Math.round(units * 6.4 + 10);
  const rx = anchor === "middle" ? x - w / 2 : anchor === "start" ? x - 4 : x - w + 4;
  frag.append(
    svgEl("rect", {
      x: rx,
      y: y - 9.5,
      width: w,
      height: 15,
      fill: PALETTE.paper,
      "fill-opacity": 0.94,
    }),
    svgEl(
      "text",
      {
        x,
        y: y + 1.5,
        "text-anchor": anchor,
        fill: color,
        "font-size": 10.5,
        "font-weight": 500,
        "font-family": "DM Mono, Noto Sans SC, monospace",
      },
      text
    )
  );
}

function drawOverlay(geom) {
  const { W, H, winLeft, winRight, winTop, winBottom, mw, mh, mx, my, cx, cy, subLeft, subRight, subTop, subBottom, margins, pxPerMm } = geom;
  const maskKey = state.clutterMask.map((b) => (b ? 1 : 0)).join("");
  const key = `${W}|${H}|${Math.round(winLeft * 2)}|${Math.round(winRight * 2)}|${Math.round(winTop * 2)}|${Math.round(winBottom * 2)}|${state.guide}|${maskKey}|${state.subject}|${activeSide || ""}`;
  if (key === lastOverlayKey) return;
  lastOverlayKey = key;

  overlay.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const clutterCount = activeClutter(state.clutterMask).length;
  const absH = Math.abs(margins.left - margins.right);
  const absV = Math.abs(margins.top - margins.bottom);
  const bottomExtra = margins.bottom - margins.top;
  const horizEq = absH <= 3 && clutterCount === 0;
  const vertEq = absV <= 3 && clutterCount === 0;
  const bottomWt = horizEq && bottomExtra >= 8 && bottomExtra <= 20;
  const locked = (horizEq && vertEq) || bottomWt;

  const frag = new DocumentFragment();

  // 1. 装裱卡纸外遮罩（暖灰厚度感 + 45° 斜切白内沿 + 内沿主墨线）
  frag.append(
    svgEl("path", {
      d: `M0,0 H${W} V${H} H0 Z M${winLeft},${winTop} H${winRight} V${winBottom} H${winLeft} Z`,
      fill: "#e5e0d7",
      "fill-opacity": 0.86,
      "fill-rule": "evenodd",
    }),
    svgEl("rect", {
      x: winLeft - 2.5,
      y: winTop - 2.5,
      width: mw + 5,
      height: mh + 5,
      fill: "none",
      stroke: "#fefcfb",
      "stroke-width": 2.4,
    }),
    svgEl("rect", {
      x: winLeft,
      y: winTop,
      width: mw,
      height: mh,
      fill: "none",
      stroke: locked ? PALETTE.vermilionDeep : PALETTE.ink,
      "stroke-width": locked ? 2.1 : 1.7,
    })
  );

  // 2. 原海报 016 最显眼的母题：贯穿全幅的黑色十字虚线中轴（横竖穿透整个展墙与圆盘）
  const dash = W < 360 ? "6 6" : "8 7";
  frag.append(
    svgEl("line", {
      x1: 0,
      y1: cy,
      x2: W,
      y2: cy,
      stroke: PALETTE.ink,
      "stroke-width": 1.85,
      "stroke-opacity": 0.78,
      "stroke-dasharray": dash,
      "data-axis": "center-cross-h",
    }),
    svgEl("line", {
      x1: cx,
      y1: 0,
      x2: cx,
      y2: H,
      stroke: PALETTE.ink,
      "stroke-width": 1.85,
      "stroke-opacity": 0.78,
      "stroke-dasharray": dash,
      "data-axis": "center-cross-v",
    })
  );

  // 3. 复刻海报 016 的四角朱红 90° 取景折角
  const pad = clamp(Math.min(mw, mh) * 0.055, 8, 16);
  const bx = winLeft + pad;
  const by = winTop + pad;
  const bw = Math.max(24, mw - pad * 2);
  const bh = Math.max(24, mh - pad * 2);
  const bl = clamp(Math.min(mw, mh) * 0.082, 12, 22);
  frag.append(
    svgEl("path", {
      d: `M${bx},${by + bl}V${by}H${bx + bl} M${bx + bw - bl},${by}H${bx + bw}V${by + bl} M${bx},${by + bh - bl}V${by + bh}H${bx + bl} M${bx + bw - bl},${by + bh}H${bx + bw}V${by + bh - bl}`,
      fill: "none",
      stroke: PALETTE.vermilion,
      "stroke-width": locked ? 3.2 : 2.3,
      "stroke-linecap": "square",
    })
  );

  // 4. 装裱标尺与参考层（直接依托贯穿中轴标注端线与读数，避免叠线打架）
  if (state.guide === "caliper") {
    const hCol = horizEq ? PALETTE.vermilionDeep : PALETTE.ink;
    const vCol = vertEq || bottomWt ? PALETTE.vermilionDeep : PALETTE.inkMuted;

    // 淡灰虚线标出当前展品真实外接框（换拱门/纸舟时一眼看清外接框在变）
    frag.append(
      svgEl("rect", {
        x: subLeft,
        y: subTop,
        width: subRight - subLeft,
        height: subBottom - subTop,
        fill: "none",
        stroke: PALETTE.ink,
        "stroke-opacity": 0.16,
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
      })
    );

    // 左留白端线与毫米标签（顺着水平中轴标注）
    const lSpan = subLeft - winLeft;
    if (lSpan > 8) {
      const x1 = winLeft + 3;
      const x2 = subLeft - 3;
      frag.append(
        svgEl("line", { x1, y1: cy - 5, x2: x1, y2: cy + 5, stroke: hCol, "stroke-width": 1.5 }),
        svgEl("line", { x1: x2, y1: cy - 5, x2: x2, y2: cy + 5, stroke: hCol, "stroke-width": 1.5 })
      );
      if (horizEq) {
        frag.append(svgEl("line", { x1, y1: cy, x2, y2: cy, stroke: PALETTE.vermilionDeep, "stroke-width": 1.8 }));
      }
      if (lSpan > 26) {
        drawCaliperLabel(frag, (x1 + x2) / 2, cy - 13, `${margins.leftR}mm`, hCol);
      }
    }

    // 右留白端线与毫米标签
    const rSpan = winRight - subRight;
    if (rSpan > 8) {
      const x1 = subRight + 3;
      const x2 = winRight - 3;
      frag.append(
        svgEl("line", { x1, y1: cy - 5, x2: x1, y2: cy + 5, stroke: hCol, "stroke-width": 1.5 }),
        svgEl("line", { x1: x2, y1: cy - 5, x2: x2, y2: cy + 5, stroke: hCol, "stroke-width": 1.5 })
      );
      if (horizEq) {
        frag.append(svgEl("line", { x1, y1: cy, x2, y2: cy, stroke: PALETTE.vermilionDeep, "stroke-width": 1.8 }));
      }
      if (rSpan > 26) {
        drawCaliperLabel(frag, (x1 + x2) / 2, cy - 13, `${margins.rightR}mm`, hCol);
      }
    }

    // 上下留白毫米标签放到较宽一侧，避开窄边杂物
    const vLabelLeft = margins.left >= margins.right;
    const vLabelX = vLabelLeft ? cx - 9 : cx + 9;
    const vLabelAnchor = vLabelLeft ? "end" : "start";

    const tSpan = subTop - winTop;
    if (tSpan > 8) {
      const y1 = winTop + 3;
      const y2 = subTop - 3;
      frag.append(
        svgEl("line", { x1: cx - 5, y1, x2: cx + 5, y2: y1, stroke: vCol, "stroke-width": 1.4 }),
        svgEl("line", { x1: cx - 5, y1: y2, x2: cx + 5, y2: y2, stroke: vCol, "stroke-width": 1.4 })
      );
      if (vertEq) {
        frag.append(svgEl("line", { x1: cx, y1, x2: cx, y2, stroke: PALETTE.vermilionDeep, "stroke-width": 1.7 }));
      }
      if (tSpan > 26) {
        drawCaliperLabel(frag, vLabelX, (y1 + y2) / 2 + 2, `${margins.topR}mm`, vCol, vLabelAnchor);
      }
    }

    const bSpan = winBottom - subBottom;
    if (bSpan > 8) {
      const y1 = subBottom + 3;
      const y2 = winBottom - 3;
      frag.append(
        svgEl("line", { x1: cx - 5, y1, x2: cx + 5, y2: y1, stroke: vCol, "stroke-width": 1.4 }),
        svgEl("line", { x1: cx - 5, y1: y2, x2: cx + 5, y2: y2, stroke: vCol, "stroke-width": 1.4 })
      );
      if (vertEq || bottomWt) {
        frag.append(svgEl("line", { x1: cx, y1, x2: cx, y2, stroke: PALETTE.vermilionDeep, "stroke-width": 1.7 }));
      }
      if (bSpan > 26) {
        drawCaliperLabel(frag, vLabelX, (y1 + y2) / 2 + 2, `${margins.bottomR}mm`, vCol, vLabelAnchor);
      }
    }

    // 拖动上下卡纸时，在下边画出「等宽」与「下宽 +12mm」两档磁吸参考刻度
    if (activeSide === "bottom" || activeSide === "top") {
      const eqY = subBottom + margins.top * pxPerMm;
      const wtY = subBottom + (margins.top + BOTTOM_WEIGHT_EXTRA_MM) * pxPerMm;
      if (eqY < H - 8 && eqY > subBottom + 6) {
        frag.append(
          svgEl("line", { x1: cx - 22, y1: eqY, x2: cx + 22, y2: eqY, stroke: PALETTE.ink, "stroke-opacity": 0.45, "stroke-width": 1.2, "stroke-dasharray": "3 3" })
        );
      }
      if (wtY < H - 8 && wtY > subBottom + 10) {
        frag.append(
          svgEl("line", { x1: cx - 26, y1: wtY, x2: cx + 26, y2: wtY, stroke: PALETTE.vermilion, "stroke-opacity": 0.78, "stroke-width": 1.6, "stroke-dasharray": "3 3" })
        );
      }
    }
  } else if (state.guide === "optical") {
    const bandTop = winTop + mh * 0.45;
    const bandBot = winTop + mh * 0.47;
    frag.append(
      svgEl("rect", {
        x: winLeft + 6,
        y: bandTop,
        width: Math.max(0, mw - 12),
        height: Math.max(2, bandBot - bandTop),
        fill: PALETTE.vermilion,
        "fill-opacity": 0.2,
      }),
      svgEl("line", { x1: winLeft + 6, y1: my, x2: winRight - 6, y2: my, stroke: PALETTE.ink, "stroke-opacity": 0.36, "stroke-width": 1.1, "stroke-dasharray": "4 4" }),
      svgEl("line", { x1: winLeft + 6, y1: (bandTop + bandBot) / 2, x2: winRight - 6, y2: (bandTop + bandBot) / 2, stroke: PALETTE.vermilion, "stroke-width": 1.5, "stroke-dasharray": "3 4" })
    );
    drawCaliperLabel(frag, winRight - 10, bandTop - 7, "光学区 3–5%（经验值）", PALETTE.vermilionDeep, "end");
    drawCaliperLabel(frag, winLeft + 10, my + 14, `上 ${margins.topR} · 下 ${margins.bottomR}mm`, PALETTE.inkMuted, "start");
  } else if (state.guide === "arnheim") {
    frag.append(
      svgEl("line", { x1: winLeft, y1: winTop, x2: winRight, y2: winBottom, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "5 5" }),
      svgEl("line", { x1: winRight, y1: winTop, x2: winLeft, y2: winBottom, stroke: PALETTE.ink, "stroke-opacity": 0.22, "stroke-width": 1, "stroke-dasharray": "5 5" }),
      svgEl("circle", { cx: mx, cy: my, r: Math.min(mw, mh) * 0.25, fill: "none", stroke: PALETTE.vermilion, "stroke-opacity": 0.32, "stroke-width": 1.3, "stroke-dasharray": "3 4" })
    );
    const f = arnheimForce(margins.u, margins.v);
    if (f.mag > 0.05) {
      const norm = Math.max(0.001, Math.hypot(f.fx, f.fy));
      const nx = f.fx / norm;
      const ny = f.fy / norm;
      const len = 24 + f.mag * 52;
      const x2 = cx + nx * len;
      const y2 = cy + ny * len;
      const ang = Math.atan2(ny, nx);
      const ah = 9;
      frag.append(
        svgEl("line", { x1: cx, y1: cy, x2, y2, stroke: PALETTE.ink, "stroke-width": 2.5, "stroke-linecap": "round" }),
        svgEl("polygon", {
          points: `${x2},${y2} ${x2 - ah * Math.cos(ang - 0.5)},${y2 - ah * Math.sin(ang - 0.5)} ${x2 - ah * Math.cos(ang + 0.5)},${y2 - ah * Math.sin(ang + 0.5)}`,
          fill: PALETTE.ink,
        })
      );
    }
  }

  // 5. 若场内存在干扰物，画出「综合视觉重心」被角落杂物拉偏的虚线与小环
  if (clutterCount > 0) {
    const c = visualCentroid(geom, state.clutterMask);
    const gx = winLeft + c.u * mw;
    const gy = winTop + c.v * mh;
    frag.append(
      svgEl("line", { x1: cx, y1: cy, x2: gx, y2: gy, stroke: PALETTE.ink, "stroke-opacity": 0.55, "stroke-width": 1.5, "stroke-dasharray": "3 3" }),
      svgEl("circle", { cx: gx, cy: gy, r: 5, fill: PALETTE.paper, stroke: PALETTE.ink, "stroke-width": 1.8 }),
      svgEl("circle", { cx: gx, cy: gy, r: 2, fill: PALETTE.vermilion })
    );
  }

  // 6. 原海报中心「+」（落在中轴交点 (cx, cy)）与画框几何中心 (mx, my) 偏离连线
  const distPx = Math.hypot(mx - cx, my - cy);
  const distMm = Math.round(margins.frameOffsetDist);

  if (distPx >= 2.5) {
    // 水平与垂直分解投影细虚线，直观对应横轴/纵轴两天平的偏离分量
    frag.append(
      svgEl("line", {
        x1: cx,
        y1: cy,
        x2: mx,
        y2: cy,
        stroke: PALETTE.paper,
        "stroke-opacity": 0.65,
        "stroke-width": 2.4,
      }),
      svgEl("line", {
        x1: cx,
        y1: cy,
        x2: mx,
        y2: cy,
        stroke: PALETTE.ink,
        "stroke-opacity": 0.45,
        "stroke-width": 1.1,
        "stroke-dasharray": "3 3",
      }),
      svgEl("line", {
        x1: mx,
        y1: cy,
        x2: mx,
        y2: my,
        stroke: PALETTE.paper,
        "stroke-opacity": 0.65,
        "stroke-width": 2.4,
      }),
      svgEl("line", {
        x1: mx,
        y1: cy,
        x2: mx,
        y2: my,
        stroke: PALETTE.ink,
        "stroke-opacity": 0.45,
        "stroke-width": 1.1,
        "stroke-dasharray": "3 3",
      }),
      // 主偏离连线（白底描边 + 实心黑线，无论落在红盘上还是白纸上都清晰锐利）
      svgEl("line", {
        x1: cx,
        y1: cy,
        x2: mx,
        y2: my,
        stroke: PALETTE.paper,
        "stroke-opacity": 0.9,
        "stroke-width": 4.4,
        "stroke-linecap": "round",
      }),
      svgEl("line", {
        x1: cx,
        y1: cy,
        x2: mx,
        y2: my,
        stroke: PALETTE.ink,
        "stroke-width": 2.2,
        "stroke-linecap": "round",
        "data-marker": "frame-offset",
      }),
      // 画框几何中心方标（与中心「+」明确区分）
      svgEl("rect", {
        x: mx - 5,
        y: my - 5,
        width: 10,
        height: 10,
        fill: PALETTE.paper,
        stroke: PALETTE.ink,
        "stroke-width": 1.9,
        "data-marker": "frame-center",
      }),
      svgEl("circle", { cx: mx, cy: my, r: 2.1, fill: PALETTE.vermilion })
    );

    // 在画框中心外延一侧放置偏离毫米标签，避开中心「+」和边界
    const dirX = mx <= cx ? -1 : 1;
    const dirY = my >= cy ? 1 : -1;
    const lblX = clamp(mx + dirX * 14, winLeft + 44, winRight - 44);
    const lblY = clamp(my + dirY * 18, winTop + 18, winBottom - 12);
    const lblText = bottomWt ? `光学偏 ${distMm}mm` : `偏离 ${distMm}mm`;
    drawCaliperLabel(frag, lblX, lblY, lblText, bottomWt ? PALETTE.vermilionDeep : PALETTE.ink, dirX < 0 ? "end" : "start");
  } else {
    // 画框中心与「+」完全重合时的锁定外环
    frag.append(
      svgEl("circle", {
        cx,
        cy,
        r: 16,
        fill: "none",
        stroke: PALETTE.paper,
        "stroke-width": 2.8,
        "stroke-opacity": 0.85,
      }),
      svgEl("circle", {
        cx,
        cy,
        r: 16,
        fill: "none",
        stroke: PALETTE.ink,
        "stroke-width": 1.4,
        "stroke-dasharray": "3 3",
      })
    );
  }

  // 原海报标志性实心黑「+」永远清晰压在最上层交点 (cx, cy)
  const plusArm = W < 360 ? 10 : 12;
  frag.append(
    svgEl("path", {
      d: `M${cx - plusArm},${cy}H${cx + plusArm} M${cx},${cy - plusArm}V${cy + plusArm}`,
      stroke: PALETTE.ink,
      "stroke-width": 3.4,
      "stroke-linecap": "round",
      "data-marker": "center-plus",
    })
  );

  overlay.replaceChildren(frag);
}

function syncBalanceVisual(geom) {
  const bal = dualBalance(geom, state.clutterMask);
  if (balanceArmH) balanceArmH.style.transform = `rotate(${bal.tiltX.toFixed(2)}deg)`;
  if (balanceArmV) balanceArmV.style.transform = `rotate(${bal.tiltY.toFixed(2)}deg)`;
}

function updateReadout() {
  const geom = layoutGeometry(stageW, stageH, state.win, state.subject);
  const info = classify(state, geom);
  const m = info.margins;
  const bal = info.balance;

  // 横纵双天平文字读数 + 对应的画框中心距「+」毫米偏离
  const absX = Math.abs(bal.tiltX);
  const absY = Math.abs(bal.tiltY);
  const hLabel =
    absX < 1.2 && Math.abs(bal.diffH) <= 3
      ? "左右齐平"
      : bal.tiltX > 0
        ? `右重 ${Math.abs(bal.tiltX).toFixed(1)}°`
        : `左重 ${Math.abs(bal.tiltX).toFixed(1)}°`;
  const vLabel =
    info.zone === "weighted" && info.clutterCount === 0
      ? `下宽 +${Math.round(m.bottom - m.top)}mm · 光学稳`
      : absY < 1.2 && Math.abs(bal.diffV) <= 3
        ? "上下等宽"
        : bal.tiltY > 0
          ? `偏沉 ${Math.abs(bal.tiltY).toFixed(1)}°`
          : `偏高 ${Math.abs(bal.tiltY).toFixed(1)}°`;

  const offHText =
    Math.abs(bal.offsetXMm) <= 1 ? "框心对齐「+」" : `距「+」横偏 ${Math.abs(bal.offsetXMm)} mm`;
  const offVText =
    info.zone === "weighted" && info.clutterCount === 0
      ? `距「+」下沉 ${Math.abs(bal.offsetYMm)} mm · 光学区`
      : Math.abs(bal.offsetYMm) <= 1
        ? "框心对齐「+」"
        : `距「+」纵偏 ${Math.abs(bal.offsetYMm)} mm`;

  if (balanceValH) balanceValH.textContent = hLabel;
  if (balanceValV) balanceValV.textContent = vLabel;
  if (balanceOffH) balanceOffH.textContent = offHText;
  if (balanceOffV) balanceOffV.textContent = offVText;

  // 顶部装裱读数眉
  const stepClear = $("step-clear");
  if (stepClear) {
    stepClear.textContent = info.clutterCount > 0 ? `① 清场 · 剩 ${info.clutterCount} 件` : "✓ ① 四周已净";
    stepClear.dataset.done = String(info.clutterCount === 0);
  }
  const stepFrame = $("step-frame");
  if (stepFrame) {
    stepFrame.textContent = info.framingDone ? `✓ ② ${info.framingLabel}` : "② 裁匀四边";
    stepFrame.dataset.done = String(info.framingDone);
  }
  const rulerEl = $("ruler-margins");
  if (rulerEl) {
    rulerEl.textContent = `左 ${m.leftR} · 右 ${m.rightR} · 上 ${m.topR} · 下 ${m.bottomR} mm`;
  }

  // 右展墙诊断区
  $("ro-badge").textContent = info.badge;
  $("ro-badge").dataset.zone = info.zone;
  $("ro-coord").textContent = `横：${hLabel} | 纵：${vLabel}`;
  $("ro-headline").textContent = info.headline;
  $("ro-body").textContent = info.body;
  $("ro-extra").textContent = info.extra;

  workbench.classList.toggle("is-locked", info.locked);
  triptych?.classList.toggle("is-locked", info.locked);

  // 更新四个把手的无障碍读数
  edgeHandles.left?.setAttribute("aria-valuenow", String(m.leftR));
  edgeHandles.left?.setAttribute("aria-valuetext", `左留白 ${m.leftR} 毫米（右留白 ${m.rightR} 毫米）`);
  edgeHandles.right?.setAttribute("aria-valuenow", String(m.rightR));
  edgeHandles.right?.setAttribute("aria-valuetext", `右留白 ${m.rightR} 毫米（左留白 ${m.leftR} 毫米）`);
  edgeHandles.top?.setAttribute("aria-valuenow", String(m.topR));
  edgeHandles.top?.setAttribute("aria-valuetext", `上留白 ${m.topR} 毫米（下留白 ${m.bottomR} 毫米）`);
  edgeHandles.bottom?.setAttribute("aria-valuenow", String(m.bottomR));
  edgeHandles.bottom?.setAttribute("aria-valuetext", `下留白 ${m.bottomR} 毫米（上留白 ${m.topR} 毫米）`);

  $("btn-equal")?.setAttribute("aria-pressed", String(info.zone === "equal"));
  $("btn-weighted")?.setAttribute("aria-pressed", String(info.zone === "weighted"));

  const clutterBtn = $("btn-clutter");
  if (clutterBtn) {
    clutterBtn.setAttribute("aria-pressed", String(info.clutterCount > 0));
    clutterBtn.textContent =
      info.clutterCount > 0 ? `一键清场（剩 ${info.clutterCount} 件）` : "放回 3 件边缘杂物";
  }
}

const view = loop(stage, (t, dt, { still }) => {
  if (still) {
    shown.left = state.win.left;
    shown.right = state.win.right;
    shown.top = state.win.top;
    shown.bottom = state.win.bottom;
  } else if (!userInteracted && t < 0.55) {
    const p = 1 - Math.pow(1 - Math.min(1, t / 0.55), 3);
    for (const s of ["left", "right", "top", "bottom"]) {
      shown[s] = ENTRY_WIN[s] + (state.win[s] - ENTRY_WIN[s]) * p;
    }
  } else {
    const k = dt ? 1 - Math.exp(-dt * (activeSide ? 36 : 15)) : 1;
    for (const s of ["left", "right", "top", "bottom"]) {
      shown[s] += (state.win[s] - shown[s]) * k;
    }
  }

  const geom = layoutGeometry(stageW, stageH, shown, state.subject);
  syncHandlesAndClutter(geom);
  syncBalanceVisual(geom);
  drawOverlay(geom);
  renderer.render(
    {
      subject: state.subject,
      clutterMask: state.clutterMask,
      still,
      geom,
    },
    still ? 0 : t
  );
});

function resizeStage() {
  const r = stage.getBoundingClientRect();
  stageW = Math.max(1, Math.round(r.width));
  stageH = Math.max(1, Math.round(r.height));
  state.win = clampWin(state.win, stageW, stageH, state.subject);
  lastOverlayKey = "";
  renderer.resize(stageW, stageH);
  updateReadout();
  view.draw();
}
new ResizeObserver(resizeStage).observe(stage);

function applyWin(nextWin, { snapSide = null, immediate = false } = {}) {
  userInteracted = true;
  let w = clampWin(nextWin, stageW, stageH, state.subject);
  if (snapSide) {
    w = snapEdge(snapSide, w, state.subject, stageW, stageH);
  }
  state.win = w;
  if (immediate || reducedMotion.matches) {
    shown.left = w.left;
    shown.right = w.right;
    shown.top = w.top;
    shown.bottom = w.bottom;
  }
  lastOverlayKey = "";
  updateReadout();
  view.draw();
}

// ---------- 交互 1：四条卡纸内沿把手（鼠标、触屏、键盘全平台通用） ----------
for (const [side, btn] of Object.entries(edgeHandles)) {
  if (!btn) continue;

  const updateFromPointer = (e) => {
    const rect = stage.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const g = layoutGeometry(stageW, stageH, state.win, state.subject);
    const next = { ...state.win };
    if (side === "left") next.left = (g.cx - px) / g.pxPerMm;
    else if (side === "right") next.right = (px - g.cx) / g.pxPerMm;
    else if (side === "top") next.top = (g.cy - py) / g.pxPerMm;
    else if (side === "bottom") next.bottom = (py - g.cy) / g.pxPerMm;
    applyWin(next);
  };

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.setPointerCapture(e.pointerId);
    btn.focus({ preventScroll: true });
    activeSide = side;
    btn.classList.add("is-active");
    stage.classList.add("is-cutting");
    readout?.setAttribute("aria-live", "off");
    updateFromPointer(e);
  });

  btn.addEventListener("pointermove", (e) => {
    if (activeSide !== side) return;
    updateFromPointer(e);
  });

  const finishDrag = () => {
    if (activeSide !== side) return;
    activeSide = null;
    btn.classList.remove("is-active");
    stage.classList.remove("is-cutting");
    readout?.setAttribute("aria-live", "polite");
    applyWin(state.win, { snapSide: side });
  };

  btn.addEventListener("pointerup", finishDrag);
  btn.addEventListener("pointercancel", finishDrag);
  btn.addEventListener("click", (e) => e.stopPropagation());

  // 键盘微调每条卡纸内沿（方向键 2mm，Shift 1mm；0 键四边等宽，B 键下边加宽）
  btn.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 1 : 2;
    const next = { ...state.win };
    let handled = true;
    if (side === "left" && e.key === "ArrowLeft") next.left += step;
    else if (side === "left" && e.key === "ArrowRight") next.left -= step;
    else if (side === "right" && e.key === "ArrowRight") next.right += step;
    else if (side === "right" && e.key === "ArrowLeft") next.right -= step;
    else if (side === "top" && e.key === "ArrowUp") next.top += step;
    else if (side === "top" && e.key === "ArrowDown") next.top -= step;
    else if (side === "bottom" && e.key === "ArrowDown") next.bottom += step;
    else if (side === "bottom" && e.key === "ArrowUp") next.bottom -= step;
    else if (e.key === "0") {
      e.preventDefault();
      applyWin(equalPresetWin(state.subject, undefined, stageW, stageH));
      return;
    } else if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      applyWin(weightedPresetWin(state.subject, undefined, stageW, stageH));
      return;
    } else {
      handled = false;
    }
    if (handled) {
      e.preventDefault();
      applyWin(next);
    }
  });
}

// ---------- 交互 2：点选画框内杂物逐件清场 ----------
clutterBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const idx = Number(btn.dataset.clutterIdx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= state.clutterMask.length) return;
    userInteracted = true;
    state.clutterMask[idx] = false;
    lastOverlayKey = "";
    updateReadout();
    view.draw();
  });
});

// ---------- 交互 3：装裱两档预设与重来按钮 ----------
$("btn-equal")?.addEventListener("click", () => {
  applyWin(equalPresetWin(state.subject, undefined, stageW, stageH));
});

$("btn-weighted")?.addEventListener("click", () => {
  applyWin(weightedPresetWin(state.subject, undefined, stageW, stageH));
});

$("btn-reset-mat")?.addEventListener("click", () => {
  state.clutterMask = [...INITIAL_CLUTTER_MASK];
  applyWin({ ...INITIAL_WIN });
});

// ---------- 交互 4：左右展墙控制绑定 ----------
document.querySelectorAll('input[name="hero-subject"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    userInteracted = true;
    state.subject = r.value;
    state.win = clampWin(state.win, stageW, stageH, state.subject);
    lastOverlayKey = "";
    updateReadout();
    view.draw();
  });
});

document.querySelectorAll('input[name="hero-guide"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (!r.checked) return;
    state.guide = r.value;
    lastOverlayKey = "";
    updateReadout();
    view.draw();
  });
});

$("btn-clutter")?.addEventListener("click", () => {
  userInteracted = true;
  const hasAny = state.clutterMask.some(Boolean);
  state.clutterMask = hasAny ? [false, false, false] : [...INITIAL_CLUTTER_MASK];
  lastOverlayKey = "";
  updateReadout();
  view.draw();
});

// ---------- 滚屏渐显（尊重 prefers-reduced-motion） ----------
const reveals = [...document.querySelectorAll(".reveal")];
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

// 启动
updateReadout();
resizeStage();
initLabs();
