import { loop, reducedMotion } from "../../lib/stage.js";
import {
  clamp,
  evaluate,
  evaluateTonalLab,
  INITIAL_BROKEN,
  PRESET_POSTER,
  QUIZ_OPTIONS,
} from "./model.js";
import { renderCorridor, renderDepthPlan, renderRhythmLab } from "./stage.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ==================== HERO 主状态与单真源同步 ====================
const state = { ...INITIAL_BROKEN };
let lastEv = evaluate(state);

const els = {
  mastScore: $("#mast-score"),
  mobileScore: $("#mobile-score"),
  titlePortals: $("#title-portals"),
  planWrap: $("#depth-plan-wrap"),
  planCanvas: $("#depth-plan"),
  planReadout: $("#plan-readout"),
  corridorCanvas: $("#corridor-canvas"),
  btnGuides: $("#btn-guides"),
  diagCard: $("#diag-card"),
  diagBadge: $("#diag-badge"),
  diagGrade: $("#diag-grade"),
  diagTitle: $("#diag-title"),
  diagBody: $("#diag-body"),
  diagAction: $("#diag-action"),
  mRatio: $("#m-ratio"),
  mFar: $("#m-far"),
  mLum: $("#m-lum"),
  mClear: $("#m-clear"),
};

let corridorDraw = () => {};
let dirtyCanvas = true;
let lastSpanPainted = -1;

function syncUI(fromDrag = false) {
  lastEv = evaluate(state);
  const ev = lastEv;
  const spanPct = Math.round(state.depthSpan * 100);
  const okAll = ev.score === 4;
  const scoreTxt = okAll ? "4 / 4 已成深" : `${ev.score} / 4 待造深`;

  if (els.mastScore.textContent !== scoreTxt) {
    els.mastScore.textContent = scoreTxt;
    els.mastScore.dataset.state = okAll ? "ok" : "warn";
    els.mobileScore.textContent = scoreTxt;
    els.mobileScore.dataset.state = okAll ? "ok" : "warn";
  }

  // 标题示范重门实时联动
  els.titlePortals.style.setProperty("--d", state.depthSpan.toFixed(3));

  // 顶部剖面轨读数与 ARIA
  const planTxt = `SPAN ${spanPct}% · ${ev.nearFarRatio.toFixed(1)}×`;
  if (els.planReadout.textContent !== planTxt) {
    els.planReadout.textContent = planTxt;
    els.planWrap.setAttribute("aria-valuenow", String(spanPct));
    els.planWrap.setAttribute("aria-valuetext", `${spanPct}%，${ev.depthGrade}`);
  }

  // 四枚青环圆徽实况
  for (const key of ["advance", "recession", "inward", "vista"]) {
    const li = $(`#pill-${key}`);
    const tag = $(`#tag-${key}`);
    const okStr = String(ev.pillars[key].ok);
    if (li.dataset.ok !== okStr) li.dataset.ok = okStr;
    if (tag.textContent !== ev.pillars[key].tag) tag.textContent = ev.pillars[key].tag;
  }

  // 白话实况诊单（只在文字变化时改 DOM，避免拖拽每帧触发无谓回流）
  if (els.diagCard.dataset.kind !== ev.diag.kind) els.diagCard.dataset.kind = ev.diag.kind;
  if (els.diagBadge.textContent !== ev.diag.badge) els.diagBadge.textContent = ev.diag.badge;
  if (els.diagGrade.textContent !== ev.depthGrade) els.diagGrade.textContent = ev.depthGrade;
  if (els.diagTitle.textContent !== ev.diag.title) els.diagTitle.textContent = ev.diag.title;
  if (els.diagBody.textContent !== ev.diag.body) els.diagBody.textContent = ev.diag.body;
  if (els.diagAction.textContent !== ev.diag.action) els.diagAction.textContent = ev.diag.action;

  const rTxt = `${ev.nearFarRatio.toFixed(1)}×`;
  const fTxt = `${ev.farWindowPct}%`;
  const lTxt = `dL ${Math.abs(ev.lumDelta)}`;
  const cTxt = `${ev.clearPct}%`;
  if (els.mRatio.textContent !== rTxt) els.mRatio.textContent = rTxt;
  if (els.mFar.textContent !== fTxt) els.mFar.textContent = fTxt;
  if (els.mLum.textContent !== lTxt) els.mLum.textContent = lTxt;
  if (els.mClear.textContent !== cTxt) els.mClear.textContent = cTxt;

  if (!fromDrag) {
    $$("[data-theme]").forEach((b) => {
      const on = b.dataset.theme === state.theme;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
    $$("[data-gates]").forEach((b) => b.classList.toggle("is-on", +b.dataset.gates === state.gates));
    $$("[data-att]").forEach((b) => b.classList.toggle("is-on", b.dataset.att === state.attenuation));
    $$("[data-ch]").forEach((b) => b.classList.toggle("is-on", b.dataset.ch === state.channel));
    $$("[data-vista]").forEach((b) => b.classList.toggle("is-on", b.dataset.vista === state.vista));

    els.btnGuides.classList.toggle("is-on", state.guides);
    els.btnGuides.setAttribute("aria-pressed", String(state.guides));
    els.btnGuides.textContent = state.guides ? "青蓝丝线：开" : "青蓝丝线：关";
  }

  dirtyCanvas = true;
  if (reducedMotion.matches) {
    renderDepthPlan(els.planCanvas, state, ev);
    corridorDraw();
    dirtyCanvas = false;
  }
}

// 绑定主画布渲染循环（按需绘制 + 仅达标/有光效时轻度动画，软件渲染也能稳 60fps）
let lastT = 0;
let lastAnimT = -1;
const heroLoop = loop(els.corridorCanvas, (t, _dt, { still }) => {
  lastT = t;
  const hasAmbient = !still && (state.vista === "moon" || (lastEv.pillars.inward.ok && state.guides));
  const shouldPaint = dirtyCanvas || still || (hasAmbient && t - lastAnimT >= 0.032);
  if (!shouldPaint) return;
  if (dirtyCanvas || lastSpanPainted !== state.depthSpan) {
    renderDepthPlan(els.planCanvas, state, lastEv);
    lastSpanPainted = state.depthSpan;
  }
  renderCorridor(els.corridorCanvas, state, lastEv, t, { still });
  dirtyCanvas = false;
  lastAnimT = t;
});
corridorDraw = () => renderCorridor(els.corridorCanvas, state, lastEv, lastT, { still: reducedMotion.matches });

// ---------- 交互 1：Z 轴剖面轨（data-perf-drag）鼠标 + 触摸 + 键盘直拖 ----------
function setSpanFromClientX(clientX) {
  const r = els.planWrap.getBoundingClientRect();
  const padL = 54;
  const padR = 54;
  const usable = Math.max(40, r.width - padL - padR);
  const raw = (clientX - r.left - padL) / usable;
  state.depthSpan = clamp(raw, 0.08, 1.0);
  syncUI(true);
}

let planDragging = false;
els.planWrap.addEventListener("pointerdown", (e) => {
  planDragging = true;
  if (els.planWrap.setPointerCapture) {
    try { els.planWrap.setPointerCapture(e.pointerId); } catch {}
  }
  setSpanFromClientX(e.clientX);
});
els.planWrap.addEventListener("pointermove", (e) => {
  if (!planDragging) return;
  setSpanFromClientX(e.clientX);
});
const stopPlanDrag = () => { planDragging = false; };
els.planWrap.addEventListener("pointerup", stopPlanDrag);
els.planWrap.addEventListener("pointercancel", stopPlanDrag);

// 兼容裸 touch 事件（确保移动端和 perf.mjs Input.dispatchTouchEvent 顺滑响应）
let planTouchActive = false;
els.planWrap.addEventListener("touchstart", (e) => {
  if (!e.touches.length) return;
  planTouchActive = true;
  setSpanFromClientX(e.touches[0].clientX);
}, { passive: true });
els.planWrap.addEventListener("touchmove", (e) => {
  if (!planTouchActive || !e.touches.length) return;
  setSpanFromClientX(e.touches[0].clientX);
}, { passive: true });
els.planWrap.addEventListener("touchend", () => { planTouchActive = false; }, { passive: true });

// 键盘方向键控制 Z 轴剖面轨
els.planWrap.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.08 : 0.04;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    state.depthSpan = clamp(state.depthSpan + step, 0.08, 1.0);
    syncUI();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    state.depthSpan = clamp(state.depthSpan - step, 0.08, 1.0);
    syncUI();
  }
});

// ---------- 交互 2：正面重门主画布水平滑动推深 + 点击解锁中门堵墙 ----------
let cStart = null;
els.corridorCanvas.addEventListener("pointerdown", (e) => {
  cStart = { x: e.clientX, y: e.clientY, span0: state.depthSpan, moved: false };
  if (els.corridorCanvas.setPointerCapture) {
    try { els.corridorCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});
els.corridorCanvas.addEventListener("pointermove", (e) => {
  if (!cStart) return;
  const dx = e.clientX - cStart.x;
  if (Math.abs(dx) > 5) cStart.moved = true;
  if (cStart.moved) {
    const w = Math.max(120, els.corridorCanvas.getBoundingClientRect().width);
    state.depthSpan = clamp(cStart.span0 + (dx / w) * 0.85, 0.08, 1.0);
    syncUI(true);
  }
});
els.corridorCanvas.addEventListener("pointerup", (e) => {
  if (!cStart) return;
  const wasClick = !cStart.moved;
  cStart = null;
  if (wasClick && state.channel === "blocked") {
    // 点击画布里的第 3 重堵墙时直接打通为正轴套框
    const r = els.corridorCanvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    const g = lastEv.layers[lastEv.blockerIndex];
    if (g && nx >= g.innerLeft - 0.05 && nx <= g.innerRight + 0.05 && ny >= g.innerTop - 0.05 && ny <= g.innerBot + 0.05) {
      state.channel = "aligned";
      syncUI();
    }
  }
});
els.corridorCanvas.addEventListener("pointercancel", () => { cStart = null; });

// ---------- 交互 3：主题切换 & 四维控参按钮 ----------
$$("[data-theme]").forEach((b) =>
  b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    syncUI();
  })
);
$$("[data-gates]").forEach((b) =>
  b.addEventListener("click", () => {
    state.gates = +b.dataset.gates;
    syncUI();
  })
);
$$("[data-att]").forEach((b) =>
  b.addEventListener("click", () => {
    state.attenuation = b.dataset.att;
    syncUI();
  })
);
$$("[data-ch]").forEach((b) =>
  b.addEventListener("click", () => {
    state.channel = b.dataset.ch;
    syncUI();
  })
);
$$("[data-vista]").forEach((b) =>
  b.addEventListener("click", () => {
    state.vista = b.dataset.vista;
    syncUI();
  })
);
els.btnGuides.addEventListener("click", () => {
  state.guides = !state.guides;
  syncUI();
});
$("#btn-reset-broken").addEventListener("click", () => {
  Object.assign(state, INITIAL_BROKEN, { theme: state.theme });
  syncUI();
});
$("#btn-preset-poster").addEventListener("click", () => {
  Object.assign(state, PRESET_POSTER, { theme: state.theme });
  syncUI();
});

// ==================== 01 节：三层剥离轴测台 ====================
const PEEL_TEXT = {
  1: "<strong>当前：只留前景框架。</strong>单靠一道门框只能把画面框住，门后一片空白，眼睛测不出远近尺度。",
  2: "<strong>当前：叠加中景重门。</strong>三道递进门框补上中景遮挡与缩尺台阶，空间立刻有了“步步向里”的厚度。",
  3: "<strong>当前：点亮远景青月。</strong>视线穿过前中景重门后落到远处微亮的山月窗口，完整的深远通道闭环成立。",
};
$$("[data-peel]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const n = +btn.dataset.peel;
    $$("[data-peel]").forEach((b) => b.classList.toggle("is-on", +b.dataset.peel === n));
    $("#pl-1").classList.toggle("is-dim", n < 1);
    $("#pl-2").classList.toggle("is-dim", n < 2);
    $("#pl-3").classList.toggle("is-dim", n < 3);
    $("#peel-caption").innerHTML = PEEL_TEXT[n];
  })
);

// ==================== 02 节：遮挡与 1/z 节拍画布 ====================
let rhythmMode = "framed";
const rhythmCanvas = $("#rhythm-canvas");
const RHYTHM_TEXT = {
  empty: "去掉中景重门和地面光带后，虽然青月尺寸丝毫未变，却像直接贴在画框内壁上，距离感塌掉大半。",
  uniform: "门框与地面横条改按屏幕等距排列后，违背透视 1/z 压缩规律，走廊瞬间退化成一架平放的梯子。",
  framed: "五重门框加 1/z 地面光带层层压缩，同一轮青月立刻退到长廊极深处。",
};
const drawRhythm = () => renderRhythmLab(rhythmCanvas, rhythmMode);
$$('input[name="rhythm-mode"]').forEach((inp) =>
  inp.addEventListener("change", () => {
    if (!inp.checked) return;
    rhythmMode = inp.value;
    $("#rhythm-note").textContent = RHYTHM_TEXT[rhythmMode];
    drawRhythm();
  })
);

// ==================== 03 节：重晦与烟岚色阶调音台 ====================
let tonalMode = "corridor";
const slopeInput = $("#tonal-slope");
function syncTonalLab() {
  const slope = +slopeInput.value;
  $("#slope-val").textContent = `${slope}%`;
  const data = evaluateTonalLab(tonalMode, slope);

  const row = $("#swatch-row");
  row.innerHTML = data.stops
    .map(
      (s) =>
        `<li class="swatch-card" style="background:${s.css};color:${s.textDark ? "#040D18" : "#FAF6EE"}"><span>${s.label}</span><strong lang="en">L ${s.lum}</strong></li>`
    )
    .join("");

  const pts = data.stops.map((s, i) => {
    const x = 44 + i * 96;
    const y = 92 - (s.lum / 100) * 76;
    return { x, y, lum: s.lum };
  });
  $("#lum-line").setAttribute("points", pts.map((p) => `${p.x},${p.y.toFixed(1)}`).join(" "));
  $("#lum-dots").innerHTML = pts
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y.toFixed(1)}" r="4.2" fill="#EFE6D2" stroke="#31B1CB" stroke-width="1.6"/>`
    )
    .join("");

  const box = $("#tonal-verdict");
  box.dataset.ok = String(data.verdict.ok);
  $("#tv-tag").textContent = `${data.verdict.status} · 首尾差 ${data.spanLum}`;
  $("#tv-text").textContent = data.verdict.text;
}
$$("[data-tmode]").forEach((btn) =>
  btn.addEventListener("click", () => {
    tonalMode = btn.dataset.tmode;
    $$("[data-tmode]").forEach((b) => b.classList.toggle("is-on", b.dataset.tmode === tonalMode));
    syncTonalLab();
  })
);
slopeInput.addEventListener("input", syncTonalLab);

// ==================== 04 节：四时期空间结构蓝图 ====================
const ERAS = {
  song: {
    year: "1072 · NORTHERN SONG",
    title: "北宋郭熙《早春图》与《林泉高致》",
    desc: "近石巨松压住前景，中景以“S”形山脉与烟云隔开数层深谷，让目光越过前山窥见山后殿宇，重晦而重叠。",
    svg: `
      <rect width="360" height="230" fill="#05111D"/>
      <path d="M18 214 L78 106 L154 214 Z" fill="#173042" stroke="#31B1CB" stroke-width="1.2"/>
      <path d="M188 214 L274 96 L346 214 Z" fill="#1F3B4F" stroke="#31B1CB" stroke-width="1.2"/>
      <path d="M84 186 Q180 144 268 186 L268 214 L84 214 Z" fill="rgba(49,177,203,0.16)"/>
      <path d="M116 168 L178 68 L244 168 Z" fill="#27A8BA" opacity="0.45"/>
      <circle cx="180" cy="48" r="10" fill="#EFE6D2"/>
      <path d="M180 206 C158 176 206 144 180 104" fill="none" stroke="#E7DBC4" stroke-width="1.6" stroke-dasharray="4 4"/>
      <text x="16" y="24" fill="#88D2E1" font-size="11">自山前而窥山后 · 曲线绕进</text>
    `,
  },
  han: {
    year: "1121 · LATE NORTHERN SONG",
    title: "北宋韩拙《山水纯全集》补幽远、迷远",
    desc: "在郭熙三远之外再添烟雾隔水、微茫缥缈的层次，强调空气雾霭如何替远山“退色减锐”。",
    svg: `
      <rect width="360" height="230" fill="#05111D"/>
      <rect x="20" y="156" width="320" height="46" fill="#0F2638"/>
      <path d="M20 158 L108 118 L194 158 Z" fill="#2A4B60"/>
      <path d="M148 158 L242 104 L340 158 Z" fill="#4E7C8F" opacity="0.8"/>
      <rect x="20" y="128" width="320" height="24" fill="#7FB8C6" opacity="0.22"/>
      <path d="M68 134 L176 72 L292 134 Z" fill="#86C4D2" opacity="0.45"/>
      <text x="16" y="24" fill="#88D2E1" font-size="11">烟雾溟漠 · 逐层退色</text>
    `,
  },
  garden: {
    year: "1631–1634 · LATE MING",
    title: "明代计成《园冶》重门、漏窗与借景",
    desc: "利用月洞门、花窗与游廊把方寸庭院切出数道景框，步移景异，把远树与外景借入室内视廊。",
    svg: `
      <rect width="360" height="230" fill="#05111D"/>
      <rect x="36" y="28" width="288" height="176" fill="#B5A896"/>
      <circle cx="180" cy="120" r="68" fill="#183244"/>
      <circle cx="184" cy="122" r="42" fill="#0D2232" stroke="#6B7377" stroke-width="6"/>
      <circle cx="188" cy="124" r="22" fill="#27A8BA"/>
      <circle cx="190" cy="116" r="5" fill="#EFE6D2"/>
      <text x="16" y="20" fill="#88D2E1" font-size="11">框中有框 · 漏窗透景</text>
    `,
  },
  enfilade: {
    year: "BAROQUE → MODERN",
    title: "贯通重门（Enfilade）与现代透视长廊",
    desc: "将成排门洞沿同一轴线贯通，结合近明远晦的采光梯度与地面节奏，正是 316 原海报的直接构图原型。",
    svg: `
      <rect width="360" height="230" fill="#05111D"/>
      <rect x="150" y="84" width="60" height="72" fill="#27A8BA"/>
      <circle cx="180" cy="108" r="8" fill="#EFE6D2"/>
      <path fill="#273E50" fill-rule="evenodd" d="M126,68 H234 V166 H126 Z M142,82 H218 V166 H142 Z"/>
      <path fill="#6D767A" fill-rule="evenodd" d="M96,48 H264 V184 H96 Z M118,66 H242 V184 H118 Z"/>
      <path fill="#E7DBC4" fill-rule="evenodd" d="M58,24 H302 V204 H58 Z M86,46 H274 V204 H86 Z"/>
      <line x1="42" y1="210" x2="150" y2="156" stroke="#31B1CB" stroke-width="1.2"/>
      <line x1="318" y1="210" x2="210" y2="156" stroke="#31B1CB" stroke-width="1.2"/>
      <text x="16" y="18" fill="#88D2E1" font-size="11">同轴重门 · 1/z 收束</text>
    `,
  },
};
function syncEra(key) {
  const e = ERAS[key];
  $("#era-svg").innerHTML = e.svg;
  $("#era-year").textContent = e.year;
  $("#era-title").textContent = e.title;
  $("#era-desc").textContent = e.desc;
  $$("[data-era]").forEach((b) => {
    const on = b.dataset.era === key;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
}
$$("[data-era]").forEach((b) => b.addEventListener("click", () => syncEra(b.dataset.era)));

// ==================== 05 节：适用边界压力测试台 ====================
let stressScene = "poster";
let stressMode = "deep";

const STRESS_DATA = {
  poster: {
    deep: {
      bad: false,
      badge: "适用场景 · 效果成立",
      title: "展映海报借重门把目光稳稳收向片名与远景",
      text: "海报画幅充足且只需突出唯一入口。外围重石框挡住边缘杂讯，亮度逐级退暗后，中心青月与片名自然成为视觉磁极。",
      html: `<div class="mock-poster is-deep"><div class="mock-poster-core"><b>夜行长廊</b><span>AUTUMN FILM</span></div></div>`,
    },
    flat: {
      bad: false,
      badge: "对照组 · 清晰但少代入感",
      title: "去掉重门后依然能读，但少了“推门走进去”的悬念",
      text: "平实排版能把片名说清楚，只是视觉停留在纸面表层，缺少深远法特有的向内牵引力。",
      html: `<div class="mock-poster"><div class="mock-poster-core"><b>夜行长廊</b><span>AUTUMN FILM</span></div></div>`,
    },
  },
  icon: {
    deep: {
      bad: true,
      badge: "翻车 · 小尺寸糊成一团",
      title: "48–56px 图标硬套四重门框，字被挤到看不清",
      text: "桌面图标在手机上只有指甲盖大小。把四重边框塞进几十像素后，粗框吃掉了八成面积，核心图形缩成针尖。",
      html: `<div class="mock-icon-wrap"><div class="mock-app-icon is-deep">深</div><p class="mock-icon-note">实际 56×56px：四重套框吃掉绝大部分面积</p></div>`,
    },
    flat: {
      bad: false,
      badge: "正确解法 · 单层剪影清晰识别",
      title: "撤掉重框、只留单一高对比图形，一瞥即认",
      text: "小尺寸图标追求的是 0.3 秒识别轮廓，应当果断放弃深远叠层，让主体占满安全区。",
      html: `<div class="mock-icon-wrap"><div class="mock-app-icon">深</div><p class="mock-icon-note">实际 56×56px：清晰利落、无多余框线</p></div>`,
    },
  },
  table: {
    deep: {
      bad: true,
      badge: "翻车 · 扭曲平权信息",
      title: "参数对比表套上递进缩尺，后两档看起来像“次等品”",
      text: "深远法天生制造前重后轻的透视等级。强行用在需要平等横向对比的价格或参数卡上，会让右侧方案显得又小又暗、难读且失公允。",
      html: `<div class="mock-table is-deep"><div class="mock-cell"><b>基础版</b><span>¥99</span></div><div class="mock-cell"><b>专业版</b><span>¥199</span></div><div class="mock-cell"><b>团队版</b><span>¥399</span></div></div>`,
    },
    flat: {
      bad: false,
      badge: "正确解法 · 等大等亮平等对比",
      title: "取消纵深缩放，三列同宽同明度，数据一眼可比",
      text: "对比类界面需要把选择权还给读者，三栏平权并排远比强加空间透视诚实、易读。",
      html: `<div class="mock-table"><div class="mock-cell"><b>基础版</b><span>¥99</span></div><div class="mock-cell"><b>专业版</b><span>¥199</span></div><div class="mock-cell"><b>团队版</b><span>¥399</span></div></div>`,
    },
  },
};

function syncStress() {
  const item = STRESS_DATA[stressScene][stressMode];
  $("#stress-preview").innerHTML = item.html;
  const badge = $("#sv-badge");
  badge.textContent = item.badge;
  badge.dataset.bad = String(item.bad);
  $("#sv-title").textContent = item.title;
  $("#sv-text").textContent = item.text;
  $$("[data-scene]").forEach((b) => b.classList.toggle("is-on", b.dataset.scene === stressScene));
  $$("[data-smode]").forEach((b) => b.classList.toggle("is-on", b.dataset.smode === stressMode));
}
$$("[data-scene]").forEach((b) =>
  b.addEventListener("click", () => {
    stressScene = b.dataset.scene;
    syncStress();
  })
);
$$("[data-smode]").forEach((b) =>
  b.addEventListener("click", () => {
    stressMode = b.dataset.smode;
    syncStress();
  })
);

// ==================== 06 节：四选一小练习 ====================
const quizGrid = $("#quiz-grid");
$$(".quiz-card").forEach((btn) =>
  btn.addEventListener("click", () => {
    const key = btn.dataset.opt;
    const ans = QUIZ_OPTIONS[key];
    quizGrid.classList.add("is-revealed");
    $$(".quiz-card").forEach((c) => {
      const k = c.dataset.opt;
      c.setAttribute("aria-pressed", String(k === key));
      c.classList.toggle("is-picked", k === key && !QUIZ_OPTIONS[k].correct);
      c.classList.toggle("is-correct", QUIZ_OPTIONS[k].correct);
    });
    const box = $("#quiz-verdict");
    box.dataset.ok = String(ans.correct);
    $("#qv-title").textContent = ans.title;
    $("#qv-body").textContent = ans.detail;
  })
);

// ==================== 07 节：原海报放大拖动灯箱 ====================
const posterBtn = $("#poster-btn");
const posterImg = $("#poster");
const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
const lbStage = $("#lb-stage");
const lbClose = $("#lb-close");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function applyLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
}

function openLightbox() {
  lbImg.src = posterImg.src;
  lbScale = 1.15;
  lbX = 0;
  lbY = 0;
  applyLbTransform();
  lightbox.hidden = false;
  posterBtn.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  posterBtn.setAttribute("aria-expanded", "false");
  posterBtn.focus();
}

posterBtn.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === lbStage) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "+" || e.key === "=") {
    lbScale = clamp(lbScale + 0.25, 0.8, 3.2);
    applyLbTransform();
  } else if (e.key === "-") {
    lbScale = clamp(lbScale - 0.25, 0.8, 3.2);
    applyLbTransform();
  }
});
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.16 : -0.16), 0.8, 3.2);
  applyLbTransform();
}, { passive: false });
lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  lbStage.classList.add("is-drag");
  if (lbStage.setPointerCapture) {
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  }
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLbTransform();
});
const stopLb = () => {
  lbDrag = null;
  lbStage.classList.remove("is-drag");
};
lbStage.addEventListener("pointerup", stopLb);
lbStage.addEventListener("pointercancel", stopLb);

// ==================== 视口变化重绘所有画布 ====================
window.addEventListener("resize", () => {
  renderDepthPlan(els.planCanvas, state, lastEv);
  corridorDraw();
  drawRhythm();
});

// 初始渲染
syncUI();
drawRhythm();
syncTonalLab();
syncEra("song");
syncStress();
heroLoop.draw();
