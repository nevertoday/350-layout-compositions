// 040 锯齿形构图 · 交互总控（开场锻造台联动 + 正文七节独立交互 + 原海报灯箱）

import {
  PRESETS,
  SCENES,
  applyPreset,
  applySingleStepFix,
  createInitialState,
  evaluate,
  setTurnCount,
} from "./model.js";
import { mountHeroStage } from "./heroStage.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (parent) parent.appendChild(el);
  return el;
}

// =========================================================
// 开场：闪电锻造台 × 标题自示范 × 四支柱斜牌 × 单真源诊单
// =========================================================
const state = createInitialState("poster");
const heroCanvas = $("#heroCanvas");

const ui = {
  mastStatus: $("#mastStatus"),
  titleChars: $$(".t-char", $("#heroTitle")),
  turnVal: $("#turnVal"),
  pillarAdvance: $("#pillarAdvance"),
  pillarRhythm: $("#pillarRhythm"),
  pillarSharp: $("#pillarSharp"),
  pillarFocus: $("#pillarFocus"),
  badgeAdvance: $("#badgeAdvance"),
  badgeRhythm: $("#badgeRhythm"),
  badgeSharp: $("#badgeSharp"),
  badgeFocus: $("#badgeFocus"),
  diagPill: $("#diagPill"),
  diagTitle: $("#diagTitle"),
  diagBody: $("#diagBody"),
  diagAction: $("#diagAction"),
  btnStepFix: $("#btnStepFix"),
  metAngle: $("#metAngle"),
  metTurns: $("#metTurns"),
  metRatio: $("#metRatio"),
  metGrade: $("#metGrade"),
  ribAdvance: $("#ribAdvance"),
  ribRhythm: $("#ribRhythm"),
  ribSharp: $("#ribSharp"),
  ribFocus: $("#ribFocus"),
  presetBtns: $$(".preset-btn"),
  sceneBtns: $$(".scene-btn"),
};

let stageCtrl;

function syncHeroUI() {
  const aspect = stageCtrl ? stageCtrl.getAspect() : 1.5;
  const ev = evaluate(state, aspect);

  // 1. 顶部状态徽 + 五字大标随锯齿锐度高低错位（标题自示范！）
  ui.mastStatus.textContent = ev.primary.badge;
  ui.mastStatus.className = `status-pill ${ev.primary.ok ? "is-ok" : "is-bad"}`;

  const lift = ev.titleZigIntensity * 7;
  ui.titleChars.forEach((ch, idx) => {
    const dir = idx % 2 === 0 ? -1 : 1;
    const dy = (dir * lift).toFixed(1);
    ch.style.transform = `translateY(${dy}px)`;
  });

  // 2. 折数读数与按钮可用性
  ui.turnVal.textContent = String(ev.turnCount);
  $("#btnTurnDec").disabled = ev.turnCount <= 2;
  $("#btnTurnInc").disabled = ev.turnCount >= 8;

  // 3. 四项斜切实况卡
  const setPillar = (card, badgeEl, ok, txt) => {
    card.classList.toggle("is-fail", !ok);
    card.classList.toggle("is-pass", ok);
    badgeEl.textContent = txt;
  };
  setPillar(
    ui.pillarAdvance,
    ui.badgeAdvance,
    ev.checks.advance,
    ev.selfIntersect ? "自交打结" : ev.turnCount > 6 ? `${ev.turnCount} 折过密` : ev.turnCount < 3 ? `仅 ${ev.turnCount} 折` : `${ev.turnCount} 折通畅`
  );
  setPillar(
    ui.pillarRhythm,
    ui.badgeRhythm,
    ev.checks.rhythm,
    ev.minSegShare < 0.08 ? "毛刺短节" : ev.lengthRatio < 1.35 ? `等距 ${ev.lengthRatio.toFixed(2)}×` : `跳变 ${ev.lengthRatio.toFixed(2)}×`
  );
  setPillar(
    ui.pillarSharp,
    ui.badgeSharp,
    ev.checks.sharpness,
    ev.selfIntersect ? "交叉卡死" : ev.minAngle < 24 ? `过锐 ${Math.round(ev.minAngle)}°` : ev.minAngle > 112 ? `钝折 ${Math.round(ev.minAngle)}°` : `锐角 ${Math.round(ev.minAngle)}°`
  );
  setPillar(
    ui.pillarFocus,
    ui.badgeFocus,
    ev.checks.focus,
    ev.focalOnStrongCorner ? "拐点锁焦" : ev.focalOnCorner ? `弱拐 ${Math.round(ev.nearestCorner.innerAngle)}°` : ev.focalOnSegment ? "滑落直段" : "脱轨黑空"
  );

  // 4. 单真源诊单与四读数
  ui.diagPill.textContent = ev.primary.badge;
  ui.diagPill.className = `diag-pill ${ev.primary.ok ? "is-ok" : "is-bad"}`;
  ui.diagTitle.textContent = ev.primary.title;
  ui.diagBody.textContent = ev.primary.body;
  ui.diagAction.textContent = ev.primary.action;
  if (ev.primary.ok) {
    ui.btnStepFix.hidden = true;
  } else {
    ui.btnStepFix.hidden = false;
    ui.btnStepFix.textContent = ev.primary.fixLabel;
  }

  ui.metAngle.textContent = `${Math.round(ev.minAngle)}°`;
  ui.metTurns.textContent = `${ev.turnCount} 处`;
  ui.metRatio.textContent = `${ev.lengthRatio.toFixed(2)}×`;
  ui.metGrade.textContent = ev.impulseGrade;

  // 5. 底沿四词亮灯带
  ui.ribAdvance.classList.toggle("is-lit", ev.checks.advance);
  ui.ribRhythm.classList.toggle("is-lit", ev.checks.rhythm);
  ui.ribSharp.classList.toggle("is-lit", ev.checks.sharpness);
  ui.ribFocus.classList.toggle("is-lit", ev.checks.focus);

  // 6. 预设与场景激活态
  ui.presetBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.preset === state.activePreset));
  ui.sceneBtns.forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

stageCtrl = mountHeroStage(heroCanvas, state, syncHeroUI);
syncHeroUI();

// 绑定场景切换
ui.sceneBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.scene;
    if (!SCENES[key]) return;
    state.scene = key;
    stageCtrl.draw();
    syncHeroUI();
  });
});

// 绑定折数增减
$("#btnTurnDec").addEventListener("click", () => {
  setTurnCount(state, state.nodes.length - 3);
  stageCtrl.draw();
  syncHeroUI();
});

$("#btnTurnInc").addEventListener("click", () => {
  setTurnCount(state, state.nodes.length - 1);
  stageCtrl.draw();
  syncHeroUI();
});

// 绑定单步修正与多解预设
ui.btnStepFix.addEventListener("click", () => {
  applySingleStepFix(state, stageCtrl.getAspect());
  stageCtrl.draw();
  syncHeroUI();
});

ui.presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.preset;
    if (!PRESETS[id]) return;
    applyPreset(state, id);
    stageCtrl.draw();
    syncHeroUI();
  });
});

// =========================================================
// 01 折线为何抓眼：平滑波浪 ↔ 锐利锯齿 ↔ 杂乱刺团 连续变形台
// =========================================================
const s1Svg = $("#s1Svg");
const s1Slider = $("#s1Slider");
const s1Val = $("#s1Val");
const s1Badge = $("#s1Badge");
const s1Explain = $("#s1Explain");
const s1Stops = $$(".chip-btn[data-s1]");

function renderSec1(val) {
  const v = Number(val);
  s1Val.textContent = `${v}%`;
  s1Svg.innerHTML = "";

  // 背景水平中线（重力稳定参照）
  svgEl("line", { x1: 28, y1: 115, x2: 532, y2: 115, stroke: "#28363E", "stroke-width": 1.2, "stroke-dasharray": "6 5" }, s1Svg);
  svgEl("text", { x: 28, y: 218, fill: "#9FB0BA", "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, s1Svg).textContent = "GRAVITY AXIS · HORIZONTAL REST";

  // 根据 v 决定波数与圆滑度：0% 圆波 → 32% 缓折 → 72% 锐锯齿 → 100% 高频过密刺团
  const isDense = v > 85;
  const peaks = isDense ? 10 : 5;
  const amp = v <= 35 ? 36 + v * 0.62 : v <= 85 ? 58 + (v - 35) * 0.78 : 82;
  const roundness = Math.max(0, 1 - v / 52); // 0% 时 1.0 完全圆弧，>=52% 时纯尖角
  const x0 = 42;
  const x1 = 518;
  const stepX = (x1 - x0) / peaks;

  const pts = [];
  for (let i = 0; i <= peaks; i++) {
    const x = x0 + stepX * i;
    const y = i === 0 || i === peaks ? 115 : 115 + (i % 2 === 1 ? -amp : amp);
    pts.push({ x, y });
  }

  // 构建带可控圆角/尖角的路径
  let d = `M ${pts[0].x} ${pts[0].y}`;
  if (roundness > 0.04) {
    // 用三次贝塞尔模拟波浪到锯齿的平滑过渡
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const ctrl = stepX * 0.44 * roundness;
      d += ` C ${a.x + ctrl} ${a.y}, ${b.x - ctrl} ${b.y}, ${b.x} ${b.y}`;
    }
  } else {
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  }

  // 双刃视效（青底偏移 + 黄主线）
  svgEl("path", {
    d,
    fill: "none",
    stroke: "#03BED7",
    "stroke-width": isDense ? 5 : 9,
    "stroke-linejoin": "miter",
    "stroke-miterlimit": 4,
    transform: "translate(5, 4)",
    opacity: 0.9,
  }, s1Svg);

  svgEl("path", {
    d,
    fill: "none",
    stroke: v > 85 ? "#FF6B6B" : "#F7D304",
    "stroke-width": isDense ? 4 : 6,
    "stroke-linejoin": "miter",
    "stroke-miterlimit": 4,
  }, s1Svg);

  // 计算中间主拐点的近似内夹角
  const a0 = pts[0], a1 = pts[1], a2 = pts[2];
  const u1x = a0.x - a1.x, u1y = a0.y - a1.y;
  const u2x = a2.x - a1.x, u2y = a2.y - a1.y;
  const dot = (u1x * u2x + u1y * u2y) / (Math.hypot(u1x, u1y) * Math.hypot(u2x, u2y));
  const ang = Math.round((Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI);

  // 标注第一处峰顶状态
  if (!isDense) {
    svgEl("circle", { cx: a1.x, cy: a1.y, r: 5, fill: "#050709", stroke: "#FFFFFF", "stroke-width": 2 }, s1Svg);
    svgEl("text", {
      x: a1.x + 12,
      y: a1.y + 4,
      fill: "#F5F7F8",
      "font-size": 12,
      "font-family": "IBM Plex Mono, monospace",
    }, s1Svg).textContent = roundness > 0.35 ? "圆弧过渡" : `折角 ${ang}°`;
  }

  // 状态说明文案
  if (v < 20) {
    s1Badge.textContent = "圆润波浪（039）· 柔和亲近（示意）";
    s1Explain.textContent = "峰顶完全圆滑过渡，视线连贯漂浮，没有急刹感——对应 Bar & Neta 实验里更易唤起放松与好感的曲线轮廓（详见 039 波浪形构图）。";
  } else if (v < 50) {
    s1Badge.textContent = `缓折钝角 ${ang}° · 动感偏弱（示意）`;
    s1Explain.textContent = `折角已开始露头，但 ${ang}° 仍偏平缓，视线阻力不足，既不够圆润柔和，又撑不起锯齿的爆发冲击。`;
  } else if (v <= 85) {
    s1Badge.textContent = `锐利锯齿 ${ang}° · 高唤醒爆发（示意）`;
    s1Explain.textContent = `内夹角收紧至 ${ang}°，每段斜线强烈偏离水平重力轴，转折处急刹激发高警觉与冲刺动感——正是 040 锯齿形构图的黄金区间。`;
  } else {
    s1Badge.textContent = `高频过密 ${ang}° · 视觉噪点（示意）`;
    s1Explain.textContent = `超过 8 个密集锐刺挤在画幅内，每段来不及建立方向推力就反复反折，注意力被切碎成紧张毛刺。`;
  }

  s1Stops.forEach((b) => {
    const target = Number(b.dataset.s1);
    b.classList.toggle("is-active", Math.abs(target - v) <= 6);
  });
}

s1Slider.addEventListener("input", () => renderSec1(s1Slider.value));
s1Stops.forEach((btn) => {
  btn.addEventListener("click", () => {
    s1Slider.value = btn.dataset.s1;
    renderSec1(btn.dataset.s1);
  });
});
renderSec1(72);

// =========================================================
// 02 拐点即聚能场：黑空 / 直段 / 强拐 三落点视线停留对比
// =========================================================
const s2Svg = $("#s2Svg");
const s2Status = $("#s2Status");
const s2Explain = $("#s2Explain");
const s2Btns = $$(".choice-card[data-s2]");

// 固定四折清晰锯齿骨架（单真源：角度直接由实绘顶点计算）
const S2_PTS = [
  { x: 52, y: 242 },
  { x: 174, y: 188 },
  { x: 274, y: 120 },
  { x: 342, y: 178 },
  { x: 422, y: 86 },
  { x: 508, y: 42 },
];
const s2CornerAngle = (() => {
  const a = S2_PTS[1], b = S2_PTS[2], c = S2_PTS[3];
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y));
  return Math.round((Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI);
})();

const S2_MODES = {
  void: {
    status: "离轨黑空 · 折线与主角各走各的",
    pos: { x: 132, y: 78 },
    explain: "星芒漂在左上空地，视线顺着底下的高对比黄青闪电一路冲向右上角，直接略过真正的主角，观者得回头二次搜寻。",
    dwell: "视线停驻：极短（被折线带跑）",
    ok: false,
  },
  segment: {
    status: "直段中途 · 视线滑过不住脚",
    pos: { x: 200, y: 176 },
    explain: "放在斜线中段虽然粘在路径上，但前后线段同向延伸，视觉惯性推动眼睛一滑而过，缺少多方向汇流刹车感。",
    dwell: "视线停驻：偏短（顺势滑过）",
    ok: false,
  },
  corner: {
    status: "强拐锁焦 · 两股推力正面汇聚",
    pos: { x: 274, y: 120 },
    explain: `把主元素直接卡在 ${s2CornerAngle}° 强转折拐点上：左下来流在此急刹，向右下再向上冲出的新方向也从此出发——正如 Persike & Meinhardt (2017) 所揭示，明确角点锚定既锁住轮廓整体性，又把注意力定格在主角身上。`,
    dwell: "视线停驻：最强（急刹聚焦）",
    ok: true,
  },
};

function renderSec2(modeKey) {
  const m = S2_MODES[modeKey];
  s2Status.textContent = m.status;
  s2Explain.textContent = m.explain;
  s2Svg.innerHTML = "";

  const pts = S2_PTS;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  svgEl("path", { d, fill: "none", stroke: "#03BED7", "stroke-width": 12, "stroke-linejoin": "miter", transform: "translate(6, 5)" }, s2Svg);
  svgEl("path", { d, fill: "none", stroke: "#F7D304", "stroke-width": 8, "stroke-linejoin": "miter" }, s2Svg);

  // 视线扫描轨迹虚线
  svgEl("path", {
    d,
    fill: "none",
    stroke: "#050709",
    "stroke-width": 2,
    "stroke-dasharray": "7 6",
  }, s2Svg);

  // 焦点外环热力示意
  const ringColor = m.ok ? "#03BED7" : "#FF6B6B";
  svgEl("circle", {
    cx: m.pos.x,
    cy: m.pos.y,
    r: m.ok ? 46 : 36,
    fill: m.ok ? "rgba(3, 190, 215, 0.16)" : "rgba(255, 107, 107, 0.15)",
    stroke: ringColor,
    "stroke-width": 1.6,
    "stroke-dasharray": "6 4",
  }, s2Svg);

  if (!m.ok) {
    // 画出与强拐点脱节的警示虚线
    svgEl("line", {
      x1: m.pos.x,
      y1: m.pos.y,
      x2: 274,
      y2: 120,
      stroke: "#FF6B6B",
      "stroke-width": 1.5,
      "stroke-dasharray": "4 4",
    }, s2Svg);
    svgEl("rect", { x: 263, y: 109, width: 22, height: 22, fill: "none", stroke: "#F7D304", "stroke-width": 2 }, s2Svg);
  }

  // 双环星芒主体
  svgEl("circle", { cx: m.pos.x, cy: m.pos.y, r: 24, fill: "#050709", stroke: "#F7D304", "stroke-width": 3.5 }, s2Svg);
  svgEl("circle", { cx: m.pos.x, cy: m.pos.y, r: 17, fill: "none", stroke: "#F7D304", "stroke-width": 1.8 }, s2Svg);
  // 8 芒星
  const starPts = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 12 : 4.5;
    const ang = (i * Math.PI) / 8 - Math.PI / 2;
    starPts.push(`${(m.pos.x + Math.cos(ang) * r).toFixed(1)},${(m.pos.y + Math.sin(ang) * r).toFixed(1)}`);
  }
  svgEl("polygon", { points: starPts.join(" "), fill: "#F7D304" }, s2Svg);

  // 底部说明条
  svgEl("rect", { x: 16, y: 244, width: 280, height: 24, fill: "rgba(13, 18, 22, 0.92)", stroke: ringColor, "stroke-width": 1 }, s2Svg);
  svgEl("text", { x: 26, y: 260, fill: "#F5F7F8", "font-size": 12, "font-weight": 700 }, s2Svg).textContent = m.dwell;

  s2Btns.forEach((b) => {
    const on = b.dataset.s2 === modeKey;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", String(on));
  });
}

s2Btns.forEach((b) => b.addEventListener("click", () => renderSec2(b.dataset.s2)));
renderSec2("corner");

// =========================================================
// 03 节奏跳跃密码：四拍段长积木排拍器
// =========================================================
const s3Svg = $("#s3Svg");
const s3Stat = $("#s3Stat");
const s3Explain = $("#s3Explain");
const beatPads = $$(".beat-pad", $("#beatPads"));

const BEAT_CYCLE = ["L", "M", "S"];
const BEAT_META = {
  L: { label: "长冲", weight: 2.25, color: "#F7D304" },
  M: { label: "中推", weight: 1.45, color: "#03BED7" },
  S: { label: "短折", weight: 0.85, color: "#FFAB91" },
};
let beats = ["L", "S", "M", "L"];

function renderSec3() {
  const weights = beats.map((k) => BEAT_META[k].weight);
  const sum = weights.reduce((a, b) => a + b, 0);
  const ratio = Math.max(...weights) / Math.min(...weights);

  beatPads.forEach((pad, idx) => {
    const k = beats[idx];
    pad.dataset.len = k;
    $(".beat-size", pad).textContent = BEAT_META[k].label;
  });

  // 按四段权重真实分配斜线横向推进步长，同时垂直方向左右交替折返
  s3Svg.innerHTML = "";
  const x0 = 42;
  const usableW = 516;
  const ys = [212, 74, 186, 56, 178];
  const pts = [{ x: x0, y: ys[0] }];
  let curX = x0;
  for (let i = 0; i < 4; i++) {
    curX += (weights[i] / sum) * usableW;
    pts.push({ x: +curX.toFixed(1), y: ys[i + 1] });
  }

  // 绘制背景节拍竖刻度
  pts.forEach((p, idx) => {
    svgEl("line", { x1: p.x, y1: 22, x2: p.x, y2: 236, stroke: "#243038", "stroke-width": 1, "stroke-dasharray": "4 4" }, s3Svg);
    if (idx < 4) {
      const midX = (p.x + pts[idx + 1].x) / 2;
      svgEl("text", {
        x: midX,
        y: 248,
        fill: BEAT_META[beats[idx]].color,
        "font-size": 11.5,
        "font-weight": 700,
        "text-anchor": "middle",
        "font-family": "IBM Plex Mono, Noto Sans SC, monospace",
      }, s3Svg).textContent = `0${idx + 1} ${BEAT_META[beats[idx]].label}`;
    }
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  svgEl("path", { d, fill: "none", stroke: "#03BED7", "stroke-width": 11, "stroke-linejoin": "miter", transform: "translate(5, 4)" }, s3Svg);

  // 分段上色，清楚看到每拍长短
  for (let i = 0; i < 4; i++) {
    svgEl("line", {
      x1: pts[i].x,
      y1: pts[i].y,
      x2: pts[i + 1].x,
      y2: pts[i + 1].y,
      stroke: BEAT_META[beats[i]].color,
      "stroke-width": 6,
    }, s3Svg);
  }
  pts.slice(1, 4).forEach((p) => {
    svgEl("rect", {
      x: p.x - 5,
      y: p.y - 5,
      width: 10,
      height: 10,
      fill: "#050709",
      stroke: "#FFFFFF",
      "stroke-width": 2,
      transform: `rotate(45 ${p.x} ${p.y})`,
    }, s3Svg);
  });

  const isUniform = ratio < 1.25;
  s3Stat.textContent = `长短比 ${ratio.toFixed(2)}× · ${isUniform ? "机械等拍" : "节奏跳跃成立"}`;
  if (isUniform) {
    s3Explain.textContent = `四段完全同长（长短比 ${ratio.toFixed(2)}×），节拍器般机械重复，没有快慢呼吸——像工厂锯条而不是有轻重缓急的版式骨架。点任意积木改出长短差！`;
  } else {
    s3Explain.textContent = `当前组合「${beats.map((b) => BEAT_META[b].label).join(" — ")}」拉出 ${ratio.toFixed(2)}× 长短落差：长段加速推进、短段急刹蓄势，视线自然产生类似鼓点切分的跳跃韵律。`;
  }
}

beatPads.forEach((pad, idx) => {
  pad.addEventListener("click", () => {
    const cur = BEAT_CYCLE.indexOf(beats[idx]);
    beats[idx] = BEAT_CYCLE[(cur + 1) % BEAT_CYCLE.length];
    renderSec3();
  });
});

$$(".dark-chip[data-rpat]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = btn.dataset.rpat;
    if (p === "flat") beats = ["M", "M", "M", "M"];
    else if (p === "crescendo") beats = ["S", "M", "M", "L"];
    else beats = ["L", "S", "M", "L"];
    renderSec3();
  });
});
renderSec3();

// =========================================================
// 04 从八桥到红楔：历史线稿剖析 + 骨架叠加开关
// =========================================================
const s4Svg = $("#s4Svg");
const s4Title = $("#s4Title");
const s4Desc = $("#s4Desc");
const s4Cite = $("#s4Cite");
const s4OverlayBtn = $("#s4OverlayBtn");
const histTabs = $$(".hist-tab[data-hist]");
let s4Key = "yatsuhashi";
let s4ShowOverlay = true;

const HIST_DATA = {
  yatsuhashi: {
    title: "尾形光琳《八桥图屏风》（约 1709 年之后）",
    desc: "日本江户时代琳派巨匠尾形光琳取材《伊势物语》第九段，在两扇六曲金箔屏风上用横斜硬折的木板八桥斜切花丛。没有西方焦点透视，仅凭八块彼此错位转折的木桥段落，就把观者的视线从近景反复折返推向深远，并与柔顺垂坠的燕子花丛拉出极致的刚柔对比。",
    cite: "实证出处：纽约大都会艺术博物馆（The Metropolitan Museum of Art），馆藏号 53.7.1–2，约 1709 年之后。",
    draw(svg, overlay) {
      // 金箔六曲屏风底
      svgEl("rect", { x: 0, y: 0, width: 540, height: 270, fill: "#D4B254" }, svg);
      for (let i = 1; i < 6; i++) {
        svgEl("line", { x1: i * 90, y1: 0, x2: i * 90, y2: 270, stroke: "rgba(92,70,22,0.32)", "stroke-width": 1.2 }, svg);
      }
      // 简化燕子花簇（深靛蓝与松绿竖叶）
      const irisClusters = [[95, 195], [160, 180], [335, 105], [415, 130], [470, 175]];
      irisClusters.forEach(([cx, cy]) => {
        for (let k = -2; k <= 2; k++) {
          svgEl("line", { x1: cx + k * 7, y1: cy + 36, x2: cx + k * 9, y2: cy - 18, stroke: "#1E5B45", "stroke-width": 3.2 }, svg);
        }
        svgEl("circle", { cx: cx - 8, cy: cy - 16, r: 7, fill: "#283B8A" }, svg);
        svgEl("circle", { cx: cx + 9, cy: cy - 22, r: 6.5, fill: "#384FA8" }, svg);
      });
      // 折转八桥木板
      const planks = [
        "32,238 152,162 178,184 58,256",
        "140,168 260,188 254,214 134,192",
        "234,196 364,116 382,138 252,216",
        "350,124 494,142 490,164 346,146",
      ];
      planks.forEach((p) => svgEl("polygon", { points: p, fill: "#6D563B", stroke: "#3F301E", "stroke-width": 1.5 }, svg));
      if (overlay) {
        const z = "M 52 242 L 160 176 L 250 198 L 366 130 L 486 150";
        svgEl("path", { d: z, fill: "none", stroke: "#03BED7", "stroke-width": 5, "stroke-dasharray": "10 5" }, svg);
        [[160, 176], [250, 198], [366, 130]].forEach(([x, y]) => {
          svgEl("circle", { cx: x, cy: y, r: 7, fill: "#050709", stroke: "#F7D304", "stroke-width": 3 }, svg);
        });
      }
    },
  },
  wedge: {
    title: "埃尔·利西茨基《红楔击白》（1919–1920）",
    desc: "俄国构成主义设计师埃尔·利西茨基用极简纯色几何构建出极具冲击力的宣传石版画：锐利如刀锋的红色三角形斜向刺入白色圆盘，周围散布斜切折角碎块与倾斜大字。它彻底证明了「尖角 + 斜向穿插 + 高对比反色」无需具象插图，本身就是最强大的视觉冲突引擎。",
    cite: "实证出处：波士顿美术馆（Museum of Fine Arts, Boston），石版画馆藏号 2000.1069，1919–1920 年。",
    draw(svg, overlay) {
      svgEl("rect", { x: 0, y: 0, width: 540, height: 270, fill: "#EFECE2" }, svg);
      svgEl("polygon", { points: "0,0 240,0 130,270 0,270", fill: "#141617" }, svg);
      svgEl("circle", { cx: 342, cy: 138, r: 84, fill: "#FFFFFF", stroke: "#141617", "stroke-width": 2 }, svg);
      // 红楔斜刺白圆
      svgEl("polygon", { points: "74,232 328,128 192,38", fill: "#C9241E" }, svg);
      // 散落锐角碎块
      svgEl("polygon", { points: "388,60 448,40 422,82", fill: "#C9241E" }, svg);
      svgEl("polygon", { points: "396,190 472,222 414,238", fill: "#141617" }, svg);
      svgEl("rect", { x: 256, y: 214, width: 54, height: 10, fill: "#141617", transform: "rotate(-16 256 214)" }, svg);
      if (overlay) {
        const z = "M 74 232 L 192 38 L 328 128 L 434 62 L 444 222";
        svgEl("path", { d: z, fill: "none", stroke: "#F7D304", "stroke-width": 4.5, "stroke-dasharray": "9 5" }, svg);
        svgEl("circle", { cx: 328, cy: 128, r: 10, fill: "#050709", stroke: "#03BED7", "stroke-width": 3 }, svg);
      }
    },
  },
  theory: {
    title: "阿恩海姆（1954/1974）与弗里曼（2007）的构图归纳",
    desc: "阿恩海姆在《艺术与视知觉》中系统论证了斜线因偏离重力垂直/水平框架而产生持续动势；迈克尔·弗里曼在《摄影师之眼》（2007）在线条表现力一章将水平线、斜线与锯齿线并列对比，归纳出连续急转的锯齿折线（如盘山公路、阶梯折影与建筑外廊）在有限画框里拉长视觉路径、强化活力节奏的实战规律。",
    cite: "实证出处：Rudolf Arnheim (1954/1974), University of California Press；Michael Freeman (2007), Focal Press, ISBN 978-0240809342。",
    draw(svg, overlay) {
      svgEl("rect", { x: 0, y: 0, width: 540, height: 270, fill: "#11181E" }, svg);
      // 盘山折路与远山纵深剪影
      svgEl("polygon", { points: "0,110 120,62 248,96 384,48 540,94 540,270 0,270", fill: "#1C2933" }, svg);
      svgEl("polygon", { points: "0,145 190,114 350,136 540,104 540,270 0,270", fill: "#162028" }, svg);
      // 盘山之字路（近宽远窄，连续折返）
      const road = "M 36 266 L 446 218 L 122 174 L 382 140 L 210 118 L 314 96";
      svgEl("path", { d: road, fill: "none", stroke: "#90A4AE", "stroke-width": 16, "stroke-linejoin": "miter" }, svg);
      svgEl("path", { d: road, fill: "none", stroke: "#ECEFF1", "stroke-width": 2, "stroke-dasharray": "8 6" }, svg);
      if (overlay) {
        svgEl("path", { d: road, fill: "none", stroke: "#F7D304", "stroke-width": 4.5, "stroke-linejoin": "miter" }, svg);
        [[446, 218], [122, 174], [382, 140], [210, 118]].forEach(([x, y]) => {
          svgEl("circle", { cx: x, cy: y, r: 6.5, fill: "#050709", stroke: "#03BED7", "stroke-width": 2.5 }, svg);
        });
      }
    },
  },
};

function renderSec4() {
  const item = HIST_DATA[s4Key];
  s4Title.textContent = item.title;
  s4Desc.textContent = item.desc;
  s4Cite.textContent = item.cite;
  s4Svg.innerHTML = "";
  item.draw(s4Svg, s4ShowOverlay);
  s4OverlayBtn.textContent = `折线骨架叠加：${s4ShowOverlay ? "开" : "关"}`;
  s4OverlayBtn.setAttribute("aria-pressed", String(s4ShowOverlay));
  histTabs.forEach((t) => {
    const on = t.dataset.hist === s4Key;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
}

histTabs.forEach((t) => t.addEventListener("click", () => {
  s4Key = t.dataset.hist;
  renderSec4();
}));
s4OverlayBtn.addEventListener("click", () => {
  s4ShowOverlay = !s4ShowOverlay;
  renderSec4();
});
renderSec4();

// =========================================================
// 05 四大实战场景：海报成品模拟器 + 折线透视开关
// =========================================================
const s5Svg = $("#s5Svg");
const s5Title = $("#s5Title");
const s5Desc = $("#s5Desc");
const s5Rules = $("#s5Rules");
const s5XrayBtn = $("#s5XrayBtn");
const appBtns = $$(".app-btn[data-app]");
let s5Key = "sport";
let s5Xray = true;

const APP_SCENES = {
  sport: {
    title: "运动赛事 · 夜间城市百米冲刺赛",
    desc: "双色电光折带模拟起跑加速与弯道冲刺，把前倾冲刺的纯黑剪影直接锁在中央 60° 强拐点上，不画多余装饰也能瞬间传递爆发速度。",
    rules: [
      "主体跑者前倾角与主斜段保持同向，合力推向右上角终点标。",
      "赛事日期与开跑时间顺着短折段贴边，不截断主闪电通路。",
    ],
    zig: "M 42 308 L 218 192 L 302 216 L 348 116 L 456 138 L 578 36",
    focal: { x: 348, y: 116 },
    draw(svg) {
      svgEl("rect", { x: 0, y: 0, width: 620, height: 340, fill: "#070A0D" }, svg);
      svgEl("polygon", { points: "0,248 620,76 620,126 0,298", fill: "#1B2126" }, svg);
      // 闪电双刃
      svgEl("path", { d: this.zig, fill: "none", stroke: "#03BED7", "stroke-width": 24, "stroke-linejoin": "miter", transform: "translate(9, 7)" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#F7D304", "stroke-width": 16, "stroke-linejoin": "miter" }, svg);
      // 左侧赛事大标
      svgEl("text", { x: 34, y: 66, fill: "#FFFFFF", "font-size": 36, "font-weight": 900, transform: "skewX(-10)" }, svg).textContent = "NIGHT SPRINT";
      svgEl("text", { x: 30, y: 98, fill: "#F7D304", "font-size": 16, "font-weight": 900 }, svg).textContent = "城市夜跑 100M 冲刺赛";
      // 中央拐点跑者剪影（纯剪影无五官）
      svgEl("circle", { cx: 348, cy: 116, r: 44, fill: "#050709", stroke: "#F7D304", "stroke-width": 4 }, svg);
      svgEl("circle", { cx: 356, cy: 96, r: 7, fill: "#F7D304" }, svg);
      svgEl("polygon", { points: "354,104 362,108 349,126 340,122", fill: "#F7D304" }, svg);
      svgEl("polyline", { points: "345,122 364,130 359,147", fill: "none", stroke: "#F7D304", "stroke-width": 6 }, svg);
      svgEl("polyline", { points: "342,122 325,134 316,141", fill: "none", stroke: "#F7D304", "stroke-width": 6 }, svg);
      svgEl("polyline", { points: "354,108 372,106 378,114", fill: "none", stroke: "#F7D304", "stroke-width": 4.5 }, svg);
      // 右下角时间标牌
      svgEl("polygon", { points: "418,248 588,248 574,306 404,306", fill: "#03BED7" }, svg);
      svgEl("text", { x: 432, y: 274, fill: "#050709", "font-size": 14, "font-weight": 900 }, svg).textContent = "10.24 / 20:00";
      svgEl("text", { x: 428, y: 294, fill: "#050709", "font-size": 12, "font-weight": 700 }, svg).textContent = "滨江跑道 · 鸣枪开跑";
    },
  },
  commerce: {
    title: "商业海报 · 限量跑鞋闪电发售",
    desc: "商业促销最怕「卖点平铺」。用斜切锯齿把画面劈开，产品剪影压在主拐点上，价格与卖点卡片沿折线上下交替错排，视线自动按「看鞋 → 看卖点 → 看售价」顺序落袋。",
    rules: [
      "核心产品轮廓破出拐点外框，形成强烈层次。",
      "折扣与卖点色块直接顺应折线斜度切角，整体视觉高度统一。",
    ],
    zig: "M 54 294 L 222 108 L 314 198 L 434 86 L 566 154",
    focal: { x: 314, y: 198 },
    draw(svg) {
      svgEl("rect", { x: 0, y: 0, width: 620, height: 340, fill: "#080B0F" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#03BED7", "stroke-width": 22, "stroke-linejoin": "miter", transform: "translate(8, 6)" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#F7D304", "stroke-width": 14, "stroke-linejoin": "miter" }, svg);
      // 左侧斜切标题牌
      svgEl("polygon", { points: "26,34 220,34 202,94 12,94", fill: "#F7D304" }, svg);
      svgEl("text", { x: 34, y: 63, fill: "#050709", "font-size": 22, "font-weight": 900 }, svg).textContent = "AERO-Z 发售";
      svgEl("text", { x: 34, y: 84, fill: "#050709", "font-size": 12, "font-weight": 700 }, svg).textContent = "碳板回弹 · 轻量化 185g";
      // 中央拐点极简球鞋轮廓
      svgEl("circle", { cx: 314, cy: 198, r: 52, fill: "#050709", stroke: "#03BED7", "stroke-width": 3.5 }, svg);
      svgEl("path", { d: "M 268 206 L 288 182 L 316 190 L 348 180 L 362 204 L 356 218 L 270 218 Z", fill: "#F7D304" }, svg);
      svgEl("path", { d: "M 270 214 L 356 214 L 354 222 L 268 222 Z", fill: "#FFFFFF" }, svg);
      // 右上卖点标牌
      svgEl("polygon", { points: "438,24 596,24 584,74 426,74", fill: "#03BED7" }, svg);
      svgEl("text", { x: 446, y: 54, fill: "#050709", "font-size": 18, "font-weight": 900 }, svg).textContent = "¥ 799 首发";
    },
  },
  event: {
    title: "活动宣传 · 青年创意市集限时快闪",
    desc: "街边与社媒信息流里，活动海报只有不到 1 秒的停留窗口。高对比锯齿折带切分主标题与三项核心福利，每个转折处都挂着一条短信息，强迫视线顺着折角把时间、地点与亮点一次扫完。",
    rules: [
      "把「限时 48 小时」主钩子锁在中央最锐拐点，制造紧迫感。",
      "每处折角旁只放 1 组短词，避免长句把锋利轮廓糊成一团。",
    ],
    zig: "M 36 86 L 194 146 L 160 258 L 366 168 L 414 274 L 584 96",
    focal: { x: 366, y: 168 },
    draw(svg) {
      svgEl("rect", { x: 0, y: 0, width: 620, height: 340, fill: "#06080B" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#F7D304", "stroke-width": 18, "stroke-linejoin": "miter" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#03BED7", "stroke-width": 10, "stroke-linejoin": "miter", transform: "translate(0, 11)" }, svg);
      // 拐点 1 信息卡
      svgEl("rect", { x: 36, y: 204, width: 112, height: 52, fill: "#0D1216", stroke: "#03BED7", "stroke-width": 1.8 }, svg);
      svgEl("text", { x: 50, y: 228, fill: "#03BED7", "font-size": 13, "font-weight": 900 }, svg).textContent = "50+ 独立摊位";
      svgEl("text", { x: 50, y: 246, fill: "#C2CDD4", "font-size": 11 }, svg).textContent = "现场版画 · 复古胶片";
      // 中央强拐点大标
      svgEl("polygon", { points: "268,128 456,128 440,206 252,206", fill: "#F7D304" }, svg);
      svgEl("text", { x: 282, y: 164, fill: "#050709", "font-size": 24, "font-weight": 900 }, svg).textContent = "48H 快闪市集";
      svgEl("text", { x: 282, y: 190, fill: "#050709", "font-size": 13, "font-weight": 700 }, svg).textContent = "免费入场 · 扫码领通票";
      // 右上角标
      svgEl("text", { x: 458, y: 66, fill: "#FFFFFF", "font-size": 18, "font-weight": 900 }, svg).textContent = "11.08–11.09";
    },
  },
  music: {
    title: "音乐演出 · 电音现场 LIVE NIGHT",
    desc: "锯齿折线本身就是最直白的声波脉冲意象。长短错落的折段呼应重拍与切分音，底部穿插高对比音柱均衡器，让静止的海报像正在震动的演出现场。",
    rules: [
      "利用 4–5 段长短不等的急折模拟电音 BPM 脉冲，拒绝均匀正弦波。",
      "主阵容名压在最高尖峰拐点上，视觉与听觉的高潮完全重合。",
    ],
    zig: "M 32 232 L 154 232 L 210 112 L 274 268 L 352 62 L 428 214 L 496 146 L 588 146",
    focal: { x: 352, y: 62 },
    draw(svg) {
      svgEl("rect", { x: 0, y: 0, width: 620, height: 340, fill: "#050709" }, svg);
      // 底部脉冲音柱
      for (let i = 0; i < 18; i++) {
        const bh = 24 + ((i * 37) % 68);
        svgEl("rect", { x: 32 + i * 31, y: 324 - bh, width: 16, height: bh, fill: i % 2 === 0 ? "rgba(3,190,215,0.22)" : "rgba(247,211,4,0.2)" }, svg);
      }
      svgEl("path", { d: this.zig, fill: "none", stroke: "#03BED7", "stroke-width": 16, "stroke-linejoin": "miter", transform: "translate(6, 5)" }, svg);
      svgEl("path", { d: this.zig, fill: "none", stroke: "#F7D304", "stroke-width": 10, "stroke-linejoin": "miter" }, svg);
      // 最高峰拐点主标
      svgEl("circle", { cx: 352, cy: 62, r: 34, fill: "#050709", stroke: "#F7D304", "stroke-width": 3.5 }, svg);
      svgEl("text", { x: 352, y: 67, fill: "#F7D304", "font-size": 15, "font-weight": 900, "text-anchor": "middle" }, svg).textContent = "LIVE";
      svgEl("text", { x: 36, y: 68, fill: "#FFFFFF", "font-size": 32, "font-weight": 900, transform: "skewX(-10)" }, svg).textContent = "VOLT FEST";
      svgEl("text", { x: 34, y: 98, fill: "#03BED7", "font-size": 14, "font-weight": 700 }, svg).textContent = "电音脉冲现场 · 138 BPM";
    },
  },
};

function renderSec5() {
  const sc = APP_SCENES[s5Key];
  s5Title.textContent = sc.title;
  s5Desc.textContent = sc.desc;
  s5Rules.innerHTML = sc.rules.map((r) => `<li>${r}</li>`).join("");
  s5Svg.innerHTML = "";
  sc.draw(s5Svg);

  if (s5Xray) {
    svgEl("path", { d: sc.zig, fill: "none", stroke: "#FFFFFF", "stroke-width": 2.4, "stroke-dasharray": "8 5" }, s5Svg);
    svgEl("circle", { cx: sc.focal.x, cy: sc.focal.y, r: 14, fill: "none", stroke: "#FF6B6B", "stroke-width": 2.5 }, s5Svg);
    svgEl("rect", { x: 460, y: 12, width: 146, height: 24, fill: "rgba(5,7,9,0.9)", stroke: "#03BED7", "stroke-width": 1 }, s5Svg);
    svgEl("text", { x: 533, y: 28, fill: "#03BED7", "font-size": 11, "font-weight": 700, "text-anchor": "middle", "font-family": "IBM Plex Mono, monospace" }, s5Svg).textContent = "SKELETON X-RAY ON";
  }

  s5XrayBtn.textContent = `透视折线骨架：${s5Xray ? "开" : "关"}`;
  s5XrayBtn.setAttribute("aria-pressed", String(s5Xray));
  appBtns.forEach((b) => {
    const on = b.dataset.app === s5Key;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

appBtns.forEach((b) => b.addEventListener("click", () => {
  s5Key = b.dataset.app;
  renderSec5();
}));
s5XrayBtn.addEventListener("click", () => {
  s5Xray = !s5Xray;
  renderSec5();
});
renderSec5();

// =========================================================
// 06 什么时候别用：四张禁忌展开对比卡
// =========================================================
$$(".dont-trigger").forEach((btn) => {
  btn.addEventListener("click", () => {
    const body = btn.nextElementSibling;
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    body.hidden = expanded;
    $(".dont-toggle", btn).textContent = expanded ? "展开对比" : "收起";
  });
});

// =========================================================
// 07 眼力测验：四选一单变量控制小练习
// =========================================================
function drawQuizThumb(svgId, pathD, focal) {
  const svg = $(svgId);
  svg.innerHTML = "";
  svgEl("rect", { x: 0, y: 0, width: 260, height: 190, fill: "#06080B" }, svg);
  svgEl("polygon", { points: "0,136 260,46 260,68 0,158", fill: "#1B1F23" }, svg);
  // 统一标题条（完全一致的变量控制）
  svgEl("text", { x: 14, y: 28, fill: "#F5F7F8", "font-size": 15, "font-weight": 900, transform: "skewX(-10)" }, svg).textContent = "CITY RUN";
  svgEl("rect", { x: 14, y: 34, width: 34, height: 3, fill: "#F7D304" }, svg);
  // 唯一变量：折线骨架
  svgEl("path", { d: pathD, fill: "none", stroke: "#03BED7", "stroke-width": 10, "stroke-linejoin": "miter", transform: "translate(4, 3)" }, svg);
  svgEl("path", { d: pathD, fill: "none", stroke: "#F7D304", "stroke-width": 6, "stroke-linejoin": "miter" }, svg);
  // 统一中央跑者焦点徽
  svgEl("circle", { cx: focal.x, cy: focal.y, r: 19, fill: "#050709", stroke: "#F7D304", "stroke-width": 2.6 }, svg);
  svgEl("circle", { cx: focal.x + 3, cy: focal.y - 7, r: 3.5, fill: "#F7D304" }, svg);
  svgEl("polyline", {
    points: `${focal.x - 8},${focal.y + 8} ${focal.x},${focal.y} ${focal.x + 7},${focal.y + 4} ${focal.x + 4},${focal.y + 12}`,
    fill: "none",
    stroke: "#F7D304",
    "stroke-width": 3,
  }, svg);
}

drawQuizThumb("#quizSvgA", "M 22 170 L 66 112 L 106 146 L 146 88 L 186 122 L 226 64 L 246 24", { x: 146, y: 88 });
drawQuizThumb("#quizSvgB", "M 24 166 L 96 128 L 142 108 L 204 66 L 242 36", { x: 142, y: 108 });
drawQuizThumb("#quizSvgC", "M 22 172 L 112 96 L 144 114 L 136 74 L 188 86 L 240 22", { x: 136, y: 74 });
drawQuizThumb("#quizSvgD", "M 18 168 L 48 118 L 68 158 L 96 98 L 116 144 L 144 82 L 166 132 L 194 66 L 216 112 L 244 26", { x: 144, y: 82 });

const QUIZ_OPT_NOTES = [
  "方案 A（均段五折）：折角虽锐（68°），但各段长度完全 1.0× 均等，像机械锯条，缺少长短节奏跳跃。",
  "方案 B（缓角三折）：虽然有长短变化，但最锐内角仍达 152°，几乎拉成平直斜线，失去急转冲击力。",
  "方案 C（错落四折 · 正解）：4 处清晰拐点、64° 锐角、2.2× 长短段比，先长冲进场、再于中央锐拐锁住跑者焦点、短折蓄力后长刺冲出，四要素全部成立。",
  "方案 D（密集八折）：8 处高频急折把背景切得支离破碎，视觉焦躁，反而抢走了中央主体的焦点。",
];

const quizOpts = $$(".quiz-opt", $("#quizGrid"));
const quizFeedback = $("#quizFeedback");
const qfHeadline = $("#qfHeadline");
const qfBody = $("#qfBody");
const qfList = $("#qfList");

function answerQuiz(choice) {
  const right = choice === "C";
  quizOpts.forEach((b) => {
    const opt = b.dataset.opt;
    b.classList.remove("is-picked", "is-right", "is-wrong");
    b.setAttribute("aria-checked", String(opt === choice));
    if (opt === choice) b.classList.add("is-picked", right ? "is-right" : "is-wrong");
    if (opt === "C") b.classList.add("is-right");
  });
  quizFeedback.hidden = false;
  qfHeadline.className = right ? "is-right" : "is-wrong";
  qfHeadline.textContent = right
    ? "判断准确！方案 C 同时满足锐角、折数、节奏跳跃与拐点聚焦"
    : `你选了方案 ${choice}——离最佳构图还差关键一环（正解为方案 C）`;
  qfBody.textContent = right
    ? "把配色、标题、主体位置全部锁死后，真正决定海报有没有爆发力的正是「3–5 处适度锐拐 + 明显长短段比 + 焦点卡在主拐点」。"
    : "锯齿形构图不是折得越多越猛，也不能等距齐平或弯得太浅。对照下方四项差距一看便知：";
  qfList.innerHTML = QUIZ_OPT_NOTES.map((n) => `<li>${n}</li>`).join("");
}

quizOpts.forEach((b) => b.addEventListener("click", () => answerQuiz(b.dataset.opt)));
$("#quizReset").addEventListener("click", () => {
  quizOpts.forEach((b) => {
    b.classList.remove("is-picked", "is-right", "is-wrong");
    b.setAttribute("aria-checked", "false");
  });
  quizFeedback.hidden = true;
});

// =========================================================
// 08 原海报灯箱（复用 #poster.src，绝不二次内联图片！）
// =========================================================
const lightbox = $("#lightbox");
const lbImg = $("#lbImg");
const lbStage = $("#lbStage");
const lbScaleEl = $("#lbScale");
const posterImg = $("#poster");

let lbScale = 1;
let lbTx = 0;
let lbTy = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLb() {
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
  lightbox.hidden = false;
  $("#lbClose").focus();
}

function closeLb() {
  lightbox.hidden = true;
}

$("#openLightbox").addEventListener("click", openLb);
$("#openLightbox2").addEventListener("click", openLb);
$("#lbClose").addEventListener("click", closeLb);
$("#lbIn").addEventListener("click", () => {
  lbScale = Math.min(3, +(lbScale + 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbOut").addEventListener("click", () => {
  lbScale = Math.max(0.8, +(lbScale - 0.35).toFixed(2));
  applyLbTransform();
});
$("#lbReset").addEventListener("click", () => {
  lbScale = 1;
  lbTx = 0;
  lbTy = 0;
  applyLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  const step = e.deltaY < 0 ? 0.2 : -0.2;
  lbScale = Math.max(0.8, Math.min(3.2, +(lbScale + step).toFixed(2)));
  applyLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage) {
    closeLb();
    return;
  }
  lbDrag = { x: e.clientX, y: e.clientY, tx: lbTx, ty: lbTy };
  lbStage.classList.add("is-dragging");
  lbStage.setPointerCapture(e.pointerId);
});

lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = lbDrag.tx + (e.clientX - lbDrag.x);
  lbTy = lbDrag.ty + (e.clientY - lbDrag.y);
  applyLbTransform();
});

const endLbDrag = () => {
  lbDrag = null;
  lbStage.classList.remove("is-dragging");
};
lbStage.addEventListener("pointerup", endLbDrag);
lbStage.addEventListener("pointercancel", endLbDrag);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});
