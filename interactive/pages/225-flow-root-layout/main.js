import { loop, pixelRatio } from "../../lib/stage.js";
import {
  MAX_STAMPS,
  TARGET_MAP,
  measureHeroFeed,
  evaluateHeroDiagnosis,
  measureMarginGap,
  measureLegacyCard,
} from "./model.js";

/* ==================== 1. 首屏：流根印章台（真实评论流 + 2D Canvas X-Ray） ==================== */
const heroDom = {
  shell: document.getElementById("hero-feed-shell"),
  feed: document.getElementById("hero-feed"),
  comments: [...document.querySelectorAll("#hero-feed .comment")],
  avatars: [...document.querySelectorAll("#hero-feed .avatar")],
  paragraphs: [...document.querySelectorAll("#hero-feed p[data-sel='p']")],
  notice: document.getElementById("hero-notice"),
  noticeFig: document.getElementById("hero-notice-fig"),
  noticeP2: document.getElementById("hero-notice-p2"),
  foot: document.getElementById("hero-feed-foot"),
  canvas: document.getElementById("hero-xray"),
  ghost: document.getElementById("hero-drag-ghost"),
};

const stampChips = [
  document.getElementById("stamp-chip-0"),
  document.getElementById("stamp-chip-1"),
];
const selBtns = [...document.querySelectorAll(".sel-btn[data-sel]")];
const stampCountEl = document.getElementById("stamp-count");
const heroResetBtn = document.getElementById("hero-reset-btn");
const heroCodeLine = document.getElementById("hero-code-line");
const heroDiag = document.getElementById("hero-diag");
const heroDiagBadge = document.getElementById("hero-diag-badge");
const heroDiagTitle = document.getElementById("hero-diag-title");
const heroDiagText = document.getElementById("hero-diag-text");

const uiMetrics = {
  leakVal: document.getElementById("m-leak-val"),
  leakSub: document.getElementById("m-leak-sub"),
  stampsLabel: document.getElementById("m-stamps-label"),
  stairVal: document.getElementById("m-stair-val"),
  stairSub: document.getElementById("m-stair-sub"),
  topVal: document.getElementById("m-top-val"),
  topSub: document.getElementById("m-top-sub"),
  wrapVal: document.getElementById("m-wrap-val"),
  wrapSub: document.getElementById("m-wrap-sub"),
  mbLeak: document.getElementById("mb-leak"),
  mbStair: document.getElementById("mb-stair"),
  mbTop: document.getElementById("mb-top"),
  mbWrap: document.getElementById("mb-wrap"),
  coLeak: document.getElementById("co-leak"),
  coStair: document.getElementById("co-stair"),
  coTop: document.getElementById("co-top"),
  coWrap: document.getElementById("co-wrap"),
};

// 状态：已盖章的类选择器集合（最多 2 枚，按盖章顺序保存）
const activeStamps = new Set();
let heroMetrics = null;
let dragState = {
  active: false,
  stampIdx: -1,
  clientX: 0,
  clientY: 0,
  hoverSel: "",
  pulse: 0,
};
let lastStampTime = 0;

function getElementsBySel(sel) {
  if (sel === ".feed") return [heroDom.feed];
  if (sel === ".comment") return heroDom.comments;
  if (sel === ".avatar") return heroDom.avatars;
  if (sel === "p") return heroDom.paragraphs;
  if (sel === ".notice") return [heroDom.notice];
  return [];
}

function toggleStamp(sel) {
  if (!TARGET_MAP[sel]) return;
  if (activeStamps.has(sel)) {
    activeStamps.delete(sel);
  } else {
    if (activeStamps.size >= MAX_STAMPS) {
      // 满 2 枚时自动替换最早盖的那一枚，手不卡壳
      const oldest = activeStamps.values().next().value;
      activeStamps.delete(oldest);
    }
    activeStamps.add(sel);
  }
  lastStampTime = performance.now();
  applyHeroStamps();
}

function applyHeroStamps() {
  // 1. 同步真实 DOM class（直接开关浏览器原生 display: flow-root）
  for (const sel of Object.keys(TARGET_MAP)) {
    const on = activeStamps.has(sel);
    for (const el of getElementsBySel(sel)) {
      el.classList.toggle("has-fr", on);
      el.classList.toggle("is-stamped-target", on);
    }
  }

  // 2. 更新托盘 2 枚印章状态与 5 枚选择器按钮
  const usedList = [...activeStamps];
  const remain = MAX_STAMPS - usedList.length;
  stampCountEl.textContent = `${remain} / ${MAX_STAMPS} 可用`;
  stampChips.forEach((chip, i) => {
    const sel = usedList[i];
    chip.classList.toggle("is-used", Boolean(sel));
    chip.querySelector(".sc-txt").textContent = sel ? `${sel} ×` : "flow-root";
  });
  selBtns.forEach((btn) => {
    const on = activeStamps.has(btn.dataset.sel);
    btn.setAttribute("aria-pressed", String(on));
  });

  // 3. 强制读取真实布局几何
  heroMetrics = measureHeroFeed(heroDom);
  const diag = evaluateHeroDiagnosis(activeStamps, heroMetrics);

  // 4. 更新左右翼四路标注与窄屏紧凑四路读数（全部同源实测）
  const m = heroMetrics;
  const leakTxt = m.maxLeakPx > 1 ? `+${m.maxLeakPx}px` : "0px";
  const stairTxt = m.stairShiftPx > 2 ? `+${m.stairShiftPx}px` : "0px";
  const topTxt = m.topCollapsePx > 1 ? `+${m.topCollapsePx}px` : "0px";
  const wrapTxt = m.wrapBroken ? `留洞 +${m.wrapBoxShiftPx}px` : "跨两段完好";

  uiMetrics.leakVal.textContent = leakTxt;
  uiMetrics.leakSub.textContent =
    m.maxLeakPx > 1
      ? `${m.leakingCards} 张卡头像探出底边`
      : "所有浮动头像已被严密包住";
  uiMetrics.stampsLabel.textContent = usedList.length
    ? `已盖：${usedList.join(" · ")}`
    : "当前印章：未盖";

  uiMetrics.stairVal.textContent = stairTxt;
  uiMetrics.stairSub.textContent =
    m.stairShiftPx > 2
      ? `${m.stairSteps} 级浮动阶梯逐行右移`
      : "三张头像左缘笔直对齐";

  uiMetrics.topVal.textContent = topTxt;
  uiMetrics.topSub.textContent =
    m.topCollapsePx > 1
      ? "首段顶距穿顶把整栏拽塌"
      : "顶沿紧贴 0px 基准线";

  uiMetrics.wrapVal.textContent = wrapTxt;
  uiMetrics.wrapSub.textContent = m.wrapBroken
    ? "第二段缩成直筒，图下露出空洞"
    : "第二段顺着插图下方折回满宽";

  uiMetrics.coLeak.classList.toggle("is-ok", m.maxLeakPx <= 1);
  uiMetrics.coStair.classList.toggle("is-ok", m.stairShiftPx <= 2);
  uiMetrics.coTop.classList.toggle("is-ok", m.topCollapsePx <= 1);
  uiMetrics.coWrap.classList.toggle("is-bad", m.wrapBroken);
  uiMetrics.coWrap.classList.toggle("is-ok", !m.wrapBroken);

  uiMetrics.mbLeak.textContent = leakTxt;
  uiMetrics.mbLeak.classList.toggle("is-ok", m.maxLeakPx <= 1);
  uiMetrics.mbStair.textContent = stairTxt;
  uiMetrics.mbStair.classList.toggle("is-ok", m.stairShiftPx <= 2);
  uiMetrics.mbTop.textContent = topTxt;
  uiMetrics.mbTop.classList.toggle("is-ok", m.topCollapsePx <= 1);
  uiMetrics.mbWrap.textContent = m.wrapBroken ? "截断" : "完好";
  uiMetrics.mbWrap.classList.toggle("is-ok", !m.wrapBroken);

  // 5. 更新原海报双圆点粉框实时代码条与诊断区
  heroCodeLine.textContent = diag.codeLine;
  heroDiag.dataset.tone = diag.tone;
  heroDiagBadge.textContent = diag.badge;
  heroDiagTitle.textContent = diag.title;
  heroDiagText.textContent = diag.detail;

  heroLoop.draw();
}

// 2D Canvas X-Ray 透视层绘制（真实几何坐标，绝不遮挡文字可读性）
function drawHeroXray(t, _dt, { still }) {
  const canvas = heroDom.canvas;
  const shellRect = heroDom.shell.getBoundingClientRect();
  const w = Math.max(1, Math.round(shellRect.width));
  const h = Math.max(1, Math.round(shellRect.height));
  const dpr = pixelRatio(2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (!heroMetrics) heroMetrics = measureHeroFeed(heroDom);
  const m = heroMetrics;
  const ox = shellRect.left;
  const oy = shellRect.top;

  // 1. 顶部外边距穿透警示带（真实顶距穿透 > 1px 时绘玫瑰粉斜纹 + 双向尺）
  if (m.topCollapsePx > 1) {
    const gapH = m.feedRect.top - oy;
    ctx.save();
    ctx.fillStyle = "rgba(226, 122, 165, 0.22)";
    ctx.fillRect(2, 0, w - 4, gapH);
    ctx.strokeStyle = "rgba(226, 122, 165, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -gapH; x < w; x += 10) {
      ctx.moveTo(x, gapH);
      ctx.lineTo(x + gapH, 0);
    }
    ctx.stroke();
    // 垂直双向像素标尺 + 暗底胶囊标签（不压底边线）
    const mx = w - 20;
    ctx.strokeStyle = "#E27AA5";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx, 1);
    ctx.lineTo(mx, gapH - 1);
    ctx.stroke();
    const label = `顶穿 +${m.topCollapsePx}px`;
    ctx.font = "600 10px 'IBM Plex Mono', monospace";
    const tw = ctx.measureText(label).width + 10;
    const bx = mx - 6 - tw;
    const by = Math.max(1, (gapH - 13) / 2);
    ctx.fillStyle = "rgba(20, 14, 50, 0.9)";
    ctx.fillRect(bx, by, tw, 13);
    ctx.fillStyle = "#F3EFE4";
    ctx.textAlign = "right";
    ctx.fillText(label, mx - 11, by + 10);
    ctx.restore();
  }

  // 2. 浮动漏出底边的玫瑰粉冲突斜纹区 + 阶梯水平错位尺
  const baseLeftX = m.cardLeaks[0].avatarRect.left - ox;
  for (const item of m.cardLeaks) {
    if (item.leak > 1) {
      const lx = item.avatarRect.left - ox;
      const ly = item.cardRect.bottom - oy;
      const lw = item.avatarRect.width;
      const lh = item.avatarRect.bottom - item.cardRect.bottom;
      ctx.save();
      ctx.fillStyle = "rgba(226, 122, 165, 0.28)";
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeStyle = "#E27AA5";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
      ctx.restore();
    }
    const shift = m.shifts[item.index];
    if (shift > 6) {
      const ax = item.avatarRect.left - ox;
      const ay = item.avatarRect.top - oy + 10;
      ctx.save();
      ctx.strokeStyle = "#F0C26B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(baseLeftX, ay);
      ctx.lineTo(ax - 2, ay);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#F0C26B";
      ctx.beginPath();
      ctx.arc(baseLeftX, ay, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. 公告块：绕排完好时绘极细青绿流线；误盖 p 截断时高亮插图下方真实空洞
  if (m.wrapBroken) {
    const hx = m.noticeInnerLeft - ox;
    const hy = m.figRect.bottom - oy + 2;
    const hw = Math.max(24, m.p2Rect.left - m.noticeInnerLeft - 4);
    const hh = Math.max(16, m.p2Rect.bottom - m.figRect.bottom - 2);
    ctx.save();
    ctx.fillStyle = "rgba(226, 122, 165, 0.25)";
    ctx.fillRect(hx, hy, hw, hh);
    ctx.strokeStyle = "#E27AA5";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, hh - 1);
    ctx.fillStyle = "#F3EFE4";
    ctx.font = "600 10px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("空洞", hx + hw / 2, hy + hh / 2 + 3.5);
    ctx.restore();
  } else {
    // 绕排完好：沿插图右缘到下方折回画一条精致青绿绕排示意弧
    const fx = m.figRect.right - ox + 4;
    const fyTop = m.figRect.top - oy + 8;
    const fyBot = m.figRect.bottom - oy + 5;
    const fxLeft = m.figRect.left - ox + 6;
    ctx.save();
    ctx.strokeStyle = "rgba(99, 194, 200, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(fx, fyTop);
    ctx.lineTo(fx, fyBot - 6);
    ctx.quadraticCurveTo(fx, fyBot, fx - 8, fyBot);
    ctx.lineTo(fxLeft, fyBot);
    ctx.stroke();
    ctx.fillStyle = "#63C2C8";
    ctx.beginPath();
    ctx.arc(fxLeft, fyBot, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. 拖动印章实时引导框与脉冲线（同时保证 perf 拖动期间每帧实绘）
  if (dragState.active) {
    const px = dragState.clientX - ox;
    const py = dragState.clientY - oy;
    ctx.save();
    if (dragState.hoverSel) {
      const targets = getElementsBySel(dragState.hoverSel);
      ctx.strokeStyle = "#F0C26B";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        ctx.strokeRect(r.left - ox + 1, r.top - oy + 1, r.width - 2, r.height - 2);
      }
      ctx.setLineDash([]);
    }
    // 绘制柔和的拖拽定位波纹环
    const cx = Math.max(12, Math.min(w - 12, px));
    const cy = Math.max(12, Math.min(h - 12, py));
    const pulseR = still ? 14 : 12 + Math.sin(t * 7) * 3;
    ctx.strokeStyle = "rgba(99, 194, 200, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 5. 刚盖完章的短促反馈高亮波（0.45 秒后自然静止，不做无意义的常驻晃动）
  const sinceStamp = (performance.now() - lastStampTime) / 1000;
  if (!still && sinceStamp < 0.45 && activeStamps.size > 0) {
    const alpha = Math.max(0, 1 - sinceStamp / 0.45);
    ctx.save();
    ctx.strokeStyle = `rgba(99, 194, 200, ${(alpha * 0.7).toFixed(2)})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.restore();
  }
}

const heroLoop = loop(heroDom.shell, (t, dt, opts) => {
  // 开场 0.9 秒内、拖动期间、或刚盖章后重绘；静置后不做多余重绘以保省电
  const sinceStamp = (performance.now() - lastStampTime) / 1000;
  if (opts.still || dragState.active || t < 1.1 || sinceStamp < 0.5) {
    drawHeroXray(t, dt, opts);
  }
});

// 识别指针正下方命中的可盖章类选择器
function pickSelectorAtPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el || !heroDom.feed.contains(el)) return "";
  const hit = el.closest("[data-sel]");
  return hit && heroDom.feed.contains(hit) ? hit.dataset.sel : ".feed";
}

function clearDropHover() {
  for (const el of heroDom.feed.querySelectorAll(".drop-hover")) {
    el.classList.remove("drop-hover");
  }
  heroDom.feed.classList.remove("drop-hover");
}

function setDropHover(sel) {
  clearDropHover();
  if (!sel) return;
  for (const el of getElementsBySel(sel)) {
    el.classList.add("drop-hover");
  }
}

// 绑定 2 枚可拖动流根印章（支持鼠标、触摸与 perf.mjs 水平滑动）
stampChips.forEach((chip, idx) => {
  let startX = 0;
  let startY = 0;
  let moved = false;

  const onStart = (cx, cy) => {
    startX = cx;
    startY = cy;
    moved = false;
    dragState.active = true;
    dragState.stampIdx = idx;
    dragState.clientX = cx;
    dragState.clientY = cy;
    dragState.hoverSel = "";
    chip.classList.add("is-dragging");
    heroDom.ghost.hidden = false;
    heroDom.ghost.style.left = `${cx}px`;
    heroDom.ghost.style.top = `${cy}px`;
    heroLoop.draw();
  };

  const onMove = (cx, cy) => {
    if (!dragState.active || dragState.stampIdx !== idx) return;
    if (Math.hypot(cx - startX, cy - startY) > 6) moved = true;
    dragState.clientX = cx;
    dragState.clientY = cy;
    heroDom.ghost.style.left = `${cx}px`;
    heroDom.ghost.style.top = `${cy}px`;
    const sel = pickSelectorAtPoint(cx, cy);
    if (sel !== dragState.hoverSel) {
      dragState.hoverSel = sel;
      setDropHover(sel);
    }
    heroLoop.draw();
  };

  const onEnd = () => {
    if (!dragState.active || dragState.stampIdx !== idx) return;
    const dropSel = dragState.hoverSel;
    dragState.active = false;
    dragState.stampIdx = -1;
    dragState.hoverSel = "";
    chip.classList.remove("is-dragging");
    heroDom.ghost.hidden = true;
    clearDropHover();

    if (moved && dropSel) {
      toggleStamp(dropSel);
    } else if (!moved) {
      // 点击已盖印章可直接摘回
      const usedList = [...activeStamps];
      if (usedList[idx]) toggleStamp(usedList[idx]);
    }
    heroLoop.draw();
  };

  chip.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    chip.setPointerCapture?.(e.pointerId);
    onStart(e.clientX, e.clientY);
  });
  chip.addEventListener("pointermove", (e) => {
    if (dragState.active && dragState.stampIdx === idx) {
      onMove(e.clientX, e.clientY);
    }
  });
  chip.addEventListener("pointerup", () => onEnd());
  chip.addEventListener("pointercancel", () => onEnd());

  // 兼容直接派发 touchstart/touchmove/touchend 的测试脚本（如 perf.mjs）
  chip.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      onStart(t0.clientX, t0.clientY);
    },
    { passive: true }
  );
  chip.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      onMove(t0.clientX, t0.clientY);
    },
    { passive: true }
  );
  chip.addEventListener("touchend", () => onEnd(), { passive: true });
});

// 直接点击评论流里的任意目标也能盖章/摘章
heroDom.feed.addEventListener("click", (e) => {
  const hit = e.target.closest("[data-sel]");
  if (!hit || !heroDom.feed.contains(hit)) return;
  toggleStamp(hit.dataset.sel);
});

// 5 枚选择器槽点击
selBtns.forEach((btn) => {
  btn.addEventListener("click", () => toggleStamp(btn.dataset.sel));
});

heroResetBtn.addEventListener("click", () => {
  activeStamps.clear();
  lastStampTime = performance.now();
  applyHeroStamps();
});

// 键盘快捷键：R 收回全部印章；Escape 确保关闭原海报灯箱
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer.open) {
    viewer.close();
    return;
  }
  if (e.target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "r" || e.key === "R") {
    activeStamps.clear();
    applyHeroStamps();
  }
});

/* ==================== 2. 第 01 节：原海报三徽标解剖台 ==================== */
const s1Tabs = [...document.querySelectorAll(".p1-tab[data-pillar]")];
const s1Host = document.getElementById("s1-demo-host");
const s1ToggleBtn = document.getElementById("s1-toggle-btn");
const s1Badge = document.getElementById("s1-mode-badge");
const s1Title = document.getElementById("s1-readout-title");
const s1Text = document.getElementById("s1-readout-text");

let s1Pillar = "self";
let s1FlowRoot = false;

const S1_DATA = {
  self: {
    render: (fr) => `
      <div class="s1-box-wrap">
        <div class="s1-parent ${fr ? "is-fr" : ""}">
          <div class="s1-float-a">FLOAT</div>
          <p class="s1-p">独立上下文：本容器既承载普通流段落，也把内部浮动与子外边距关在边界之内。</p>
        </div>
      </div>`,
    offTitle: "display: block · 容器与外界共用同一块格式化上下文",
    offText: "父框顶沿被内部段落的 margin-top 顶偏，底边也包不住高出来的浮动块——内外混在一条流里。",
    onTitle: "display: flow-root · 独立上下文已建立（SELF-CONTAINED）",
    onText: "容器像一座自给自足的小舱：顶距锁在盒内，浮动完整包住，自身仍保持块级满宽。",
  },
  contain: {
    render: (fr) => `
      <div class="s1-box-wrap">
        <div class="s1-parent ${fr ? "is-fr" : ""}">
          <div class="s1-float-a">左浮</div>
          <div class="s1-float-b">右浮</div>
          <p class="s1-p">无论左浮动还是右浮动，只要父容器建立流根，计算 auto 高度时都会把最高浮动的底沿算进来（CSS 2.1 §10.6.7）。</p>
        </div>
      </div>`,
    offTitle: "display: block · 双侧浮动同时刺穿容器底边",
    offText: "普通块盒计算 auto 高度时直接跳过浮动子元素，导致青框只按中间文字高度收口。",
    onTitle: "display: flow-root · 左右浮动全部被完整包含（CONTAIN）",
    onText: "无需额外空标签或伪元素，容器底沿自动向下延展，恰好贴齐最高那枚浮动的底边。",
  },
  clear: {
    render: (fr) => `
      <div class="s1-box-wrap">
        <div class="s1-parent ${fr ? "is-fr" : ""}">
          <div class="s1-float-a">内浮</div>
          <p class="s1-p">上方卡片很短，只有一行文字，但左侧配图较长。</p>
        </div>
        <div class="s1-outer">外部兄弟区块：本应安稳落在上方卡片正下方，不被卡片内部的浮动打扰。</div>
      </div>`,
    offTitle: "display: block · 内部浮动外泄，撞歪外部兄弟区块",
    offText: "青色浮动块穿过卡片底边，硬生生挤进了下方玫瑰粉兄弟盒里，把里面的文字顶偏。",
    onTitle: "display: flow-root · 源头封口，外部布局安稳无恙（CLEAR）",
    onText: "不用给外部兄弟硬加 clear: both；只要上方容器自己建了流根，外部区块自然平稳退到下方。",
  },
};

function renderS1() {
  const item = S1_DATA[s1Pillar];
  s1Host.innerHTML = item.render(s1FlowRoot);
  s1Badge.textContent = s1FlowRoot ? "display: flow-root" : "display: block";
  s1Badge.classList.toggle("is-ok", s1FlowRoot);
  s1ToggleBtn.setAttribute("aria-pressed", String(s1FlowRoot));
  s1ToggleBtn.textContent = s1FlowRoot ? "恢复为 display: block" : "切换为 display: flow-root";
  s1Title.textContent = s1FlowRoot ? item.onTitle : item.offTitle;
  s1Text.textContent = s1FlowRoot ? item.onText : item.offText;
}

s1Tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    s1Pillar = tab.dataset.pillar;
    s1Tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    renderS1();
  });
});
s1ToggleBtn.addEventListener("click", () => {
  s1FlowRoot = !s1FlowRoot;
  renderS1();
});

/* ==================== 3. 第 02 节：顶距穿透与侧浮避让卡尺 ==================== */
const s2Tabs = [...document.querySelectorAll(".s2-tab[data-scene]")];
const s2Range = document.getElementById("s2-range");
const s2RangeLabel = document.getElementById("s2-range-label");
const s2RangeVal = document.getElementById("s2-range-val");
const s2StageMargin = document.getElementById("s2-stage-margin");
const s2StageBeside = document.getElementById("s2-stage-beside");
const s2Readout = document.getElementById("s2-readout");

const s2Els = {
  mShellBlock: document.getElementById("s2-mshell-block"),
  mBoxBlock: document.getElementById("s2-mbox-block"),
  mPBlock: document.getElementById("s2-mp-block"),
  mBoxFr: document.getElementById("s2-mbox-fr"),
  mPFr: document.getElementById("s2-mp-fr"),
  mStatBlock: document.getElementById("s2-m-block"),
  mStatFr: document.getElementById("s2-m-fr"),
  bfBlock: document.getElementById("s2-bf-block"),
  bfFr: document.getElementById("s2-bf-fr"),
  btBlock: document.getElementById("s2-bt-block"),
  btFr: document.getElementById("s2-bt-fr"),
  bStatBlock: document.getElementById("s2-b-block"),
  bStatFr: document.getElementById("s2-b-fr"),
};

let s2Scene = "margin";

function updateS2() {
  const val = Number(s2Range.value);
  s2RangeVal.textContent = `${val}px`;

  if (s2Scene === "margin") {
    s2Els.mPBlock.style.marginTop = `${val}px`;
    s2Els.mPFr.style.marginTop = `${val}px`;

    const borderTop = parseFloat(getComputedStyle(s2Els.mShellBlock).borderTopWidth) || 0;
    const leakOut = Math.max(
      0,
      Math.round(
        s2Els.mBoxBlock.getBoundingClientRect().top -
          (s2Els.mShellBlock.getBoundingClientRect().top + borderTop)
      )
    );
    const insideBlock = measureMarginGap(s2Els.mBoxBlock, null, s2Els.mPBlock).topToFirstPPx;
    const insideFr = measureMarginGap(s2Els.mBoxFr, null, s2Els.mPFr).topToFirstPPx;

    s2Els.mStatBlock.textContent = leakOut > 0 ? `穿顶 +${leakOut}px` : "贴顶 0px";
    s2Els.mStatFr.textContent = `锁在盒内 ${insideFr}px`;
    s2Readout.textContent =
      val === 0
        ? "当前首段 margin-top 为 0px，两盒看似一样；把卡尺往右拖，立刻看到普通块把外边距拱出顶线。"
        : `实测对比：普通块顶沿向下塌出 +${leakOut}px、盒内首段贴死 ${insideBlock}px；流根顶沿纹丝不动，把全部 ${insideFr}px 稳稳留在盒内。`;
  } else {
    s2Els.bfBlock.style.width = `${val}px`;
    s2Els.bfFr.style.width = `${val}px`;
    const wFr = Math.round(s2Els.btFr.getBoundingClientRect().width);
    const wBlock = Math.round(s2Els.btBlock.getBoundingClientRect().width);
    s2Els.bStatBlock.textContent = `盒宽 ${wBlock}px · 拐脚绕排`;
    s2Els.bStatFr.textContent = `独立列宽 ${wFr}px`;
    s2Readout.textContent = `侧浮宽 ${val}px 时，流根正文列自动收窄至 ${wFr}px 并整列竖直对齐；普通块依然占满 ${wBlock}px 宽，超长行会钻进头像下方。`;
  }
}

s2Tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    s2Scene = tab.dataset.scene;
    s2Tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    const isMargin = s2Scene === "margin";
    s2StageMargin.hidden = !isMargin;
    s2StageBeside.hidden = isMargin;
    if (isMargin) {
      s2RangeLabel.textContent = "首段 margin-top";
      s2Range.min = "0";
      s2Range.max = "48";
      s2Range.value = "28";
    } else {
      s2RangeLabel.textContent = "左侧浮动头像宽";
      s2Range.min = "56";
      s2Range.max = "168";
      s2Range.value = "96";
    }
    updateS2();
  });
});
s2Range.addEventListener("input", updateS2);

/* ==================== 4. 第 03 节：6 年代考古印章带 ==================== */
const ERAS = {
  1998: {
    year: "1998-05-12",
    meta: "W3C CSS2 Recommendation §9.4.1",
    title: "首次正式定义块格式化上下文（BFC）",
    note: "CSS2 规范在 §9.4.1 首次写明块格式化上下文，描述了浮动、绝对定位与非 visible 的 overflow 均会创建新的隔离区，但没有给普通块容器留下独立触发属性。",
    flaw: "当时痛点：为了撑起浮动父盒，开发者不得不在 HTML 末尾塞空标签 <div style=\"clear: both\">，污染文档语义。",
    lines: "需改 HTML 结构",
    code: `<div class="card">\n  <img class="avatar" ...>\n  <p>评论正文</p>\n  <div style="clear: both"></div>\n</div>`,
  },
  2004: {
    year: "2004-05-14",
    meta: "Tony Aslett / Position Is Everything",
    title: "How To Clear Floats Without Structural Markup",
    note: "Tony Aslett 提出用 :after 伪元素在容器末尾生成隐形清浮动块，经 Position Is Everything（2004 年 5 月发布）广为流传，网页第一次无需往 HTML 里加空 div。",
    flaw: "遗留隐患：需要给旧版 IE 写多段注释 hack，且只清理底部浮动，不能像 BFC 一样封住顶部外边距。",
    lines: "约 12 行 CSS（含 IE 兼容）",
    code: `.clearfix:after {\n  content: ".";\n  display: block;\n  height: 0;\n  clear: both;\n  visibility: hidden;\n}`,
  },
  2010: {
    year: "2010-06-25",
    meta: "Nicole Sullivan · Stubbornella",
    title: "「媒体对象」普及用 BFC 避让侧边浮动",
    note: "Nicole Sullivan 发表《The media object saves hundreds of lines of code》，利用 overflow: hidden 触发 BFC 让正文列笔直站在左侧头像旁边，成为 Facebook 等大型站点的基础组件。",
    flaw: "遗留隐患：依赖 overflow: hidden 的副作用，一旦正文里出现向外探出的下拉菜单、阴影或角标就会被一刀裁平。",
    lines: "依赖 overflow 副作用",
    code: `.media, .bd {\n  overflow: hidden;\n  _overflow: visible;\n  zoom: 1;\n}\n.media .img { float: left; }`,
  },
  2011: {
    year: "2011-04-21 & 06-07",
    meta: "Nicolas Gallagher & W3C CSS 2.1",
    title: "Micro Clearfix 精简定型与 CSS 2.1 正式收官",
    note: "Nicolas Gallagher 在 Thierry Koblentz 基础上于 2011 年 4 月 21 日发布 micro clearfix：同时用 :before 和 :after 设 display: table，特意兼顾阻止首子 top-margin 塌陷；同年 6 月 W3C CSS 2.1 正式确立 BFC 高度与合并细则。",
    flaw: "遗留隐患：占用了元素的 ::before 与 ::after 两个宝贵伪元素，且读代码的新手很难一眼看懂为什么清浮动要写 table。",
    lines: "8 行 CSS · 占用双伪元素",
    code: `.cf::before,\n.cf::after {\n  content: " ";\n  display: table;\n}\n.cf::after {\n  clear: both;\n}`,
  },
  2015: {
    year: "2015-07-21",
    meta: "W3C CSS Display Module Level 3 WD",
    title: "工作草案首次创建 flow-root 内显示关键字",
    note: "W3C 在 2015 年 7 月 21 日发布的 Display Level 3 工作草案（10 月 15 日草案延续该定义）中，把 display 拆分为外/内双值模型，明确创建 flow 与 flow-root——变更说明直指其目的就是淘汰 ::after clear 与 overflow: hidden 等 hack。",
    flaw: "里程碑：语义直白如白话——block flow-root 就是「块级外观 + 独立流根」，零副作用。",
    lines: "1 行原生声明",
    code: `.card {\n  display: block flow-root;\n  /* 单值等价简写 */\n  display: flow-root;\n}`,
  },
  2017: {
    year: "2017-01-24 – 2020",
    meta: "Rachel Andrew & 现代浏览器全线落地",
    title: "「Clearfix 补丁谢幕了吗？」与全端普及",
    note: "2017 年 1 月 24 日 Rachel Andrew 撰文报道 display: flow-root 登陆 Chrome Canary 与 Firefox Nightly；随后 Firefox 53、Chrome 58（2017）、Safari 13 / iOS 13（2019）与 Edge 79（2020）全线支持。",
    flaw: "今天结论：凡是不必兼容 IE 11 的项目，需要无副作用独立 BFC 时直接写 display: flow-root 即可。",
    lines: "1 行 · 全现代浏览器支持",
    code: `.comment {\n  display: flow-root;\n}`,
  },
};

const eraBtns = [...document.querySelectorAll(".era-btn[data-era]")];
function renderEra(key) {
  const d = ERAS[key];
  document.getElementById("s3-era-year").textContent = d.year;
  document.getElementById("s3-era-meta").textContent = d.meta;
  document.getElementById("s3-era-title").textContent = d.title;
  document.getElementById("s3-era-note").textContent = d.note;
  const flawEl = document.getElementById("s3-era-flaw");
  flawEl.textContent = "";
  const colonIdx = d.flaw.indexOf("：");
  if (colonIdx > 0) {
    const st = document.createElement("strong");
    st.textContent = d.flaw.slice(0, colonIdx);
    flawEl.append(st, document.createTextNode(d.flaw.slice(colonIdx)));
  } else {
    flawEl.textContent = d.flaw;
  }
  document.getElementById("s3-era-lines").textContent = d.lines;
  document.getElementById("s3-era-code").textContent = d.code;
}
eraBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    eraBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderEra(btn.dataset.era);
  });
});

/* ==================== 5. 第 04 节：五方案体检舱 + 2×2 拼装 + 矩阵 ==================== */
const s4Dom = {
  shell: document.getElementById("s4-card-shell"),
  card: document.getElementById("s4-card"),
  floatEl: document.getElementById("s4-float"),
  floatTag: document.getElementById("s4-float-h-tag"),
  bodyEl: document.getElementById("s4-body"),
  badgeEl: document.getElementById("s4-badge"),
  refBar: document.getElementById("s4-ruler-ref"),
  rLeak: document.getElementById("s4-r-leak"),
  rTop: document.getElementById("s4-r-top"),
  rClip: document.getElementById("s4-r-clip"),
  rWidth: document.getElementById("s4-r-width"),
  verdict: document.getElementById("s4-verdict"),
  vBadge: document.getElementById("s4-verdict-badge"),
  vText: document.getElementById("s4-verdict-text"),
};
const s4ModeBtns = [...document.querySelectorAll(".s4-mode-btn[data-mode]")];
const s4Slider = document.getElementById("s4-float-h");
const s4SliderVal = document.getElementById("s4-float-h-val");
const s4MatrixRows = [...document.querySelectorAll("#s4-matrix-body tr[data-mode]")];

let s4Mode = "block";

function updateS4Chamber() {
  const fh = Number(s4Slider.value);
  s4SliderVal.textContent = `${fh}px`;
  s4Dom.floatEl.style.height = `${fh}px`;
  s4Dom.floatTag.textContent = `${fh}px`;

  s4Dom.card.className = `s4-card mode-${s4Mode}`;
  s4ModeBtns.forEach((b) => {
    const on = b.dataset.mode === s4Mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  s4MatrixRows.forEach((tr) => {
    tr.classList.toggle("is-active", tr.dataset.mode === s4Mode);
  });

  const m = measureLegacyCard(s4Dom, s4Mode);
  s4Dom.rLeak.textContent = m.leakPx > 1 ? `+${m.leakPx}px` : "0px";
  s4Dom.rLeak.classList.toggle("is-ok", m.leakPx <= 1 && !m.shortMasking);
  s4Dom.rTop.textContent = m.topCollapsePx > 1 ? `+${m.topCollapsePx}px` : "0px";
  s4Dom.rTop.classList.toggle("is-ok", m.topCollapsePx <= 1);
  s4Dom.rClip.textContent = m.badgeClipPx > 0 ? `被裁 ${m.badgeClipPx}px` : "0px";
  s4Dom.rClip.classList.toggle("is-ok", m.badgeClipPx === 0);
  s4Dom.rWidth.textContent = `${m.widthPct}%`;
  s4Dom.rWidth.classList.toggle("is-ok", m.widthLossPx <= 2);

  s4Dom.verdict.dataset.tone = m.tone;
  s4Dom.vBadge.textContent = m.badge;
  s4Dom.vText.textContent = m.text;
}

s4ModeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    s4Mode = btn.dataset.mode;
    updateS4Chamber();
  });
});
s4MatrixRows.forEach((tr) => {
  const selectRow = () => {
    s4Mode = tr.dataset.mode;
    updateS4Chamber();
  };
  tr.addEventListener("click", selectRow);
  tr.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectRow();
    }
  });
});
s4Slider.addEventListener("input", updateS4Chamber);

// 2×2 双值语法拼装器（初始与上方体检舱 display: block 对齐）
const s4OuterBtns = [...document.querySelectorAll(".s4-outer-btn[data-outer]")];
const s4InnerBtns = [...document.querySelectorAll(".s4-inner-btn[data-inner]")];
let comboOuter = "block";
let comboInner = "flow";

const COMBO_INFO = {
  "block|flow": {
    short: "display: block;",
    mode: "block",
    desc: "浏览器默认块盒：占满整行，但与外部共享普通流——浮动易漏出、子顶距易穿顶。",
  },
  "block|flow-root": {
    short: "display: flow-root;",
    mode: "flow-root",
    desc: "对外保持块级满宽，对内建立全新 BFC——这正是 flow-root 零副作用的规范本质。",
  },
  "inline|flow": {
    short: "display: inline;",
    mode: "block",
    desc: "随文字流排布、宽高由行内内容决定，不能设置上下外边距与独立宽高，也不建 BFC。",
  },
  "inline|flow-root": {
    short: "display: inline-block;",
    mode: "inline-block",
    desc: "内部建了独立 BFC（能包浮动锁顶距），但外部退化成行内盒，宽度按内容收缩不再占满整行。",
  },
};

function updateCombo(syncChamber = false) {
  const key = `${comboOuter}|${comboInner}`;
  const info = COMBO_INFO[key];
  document.getElementById("s4-combo-long").textContent = `display: ${comboOuter} ${comboInner};`;
  document.getElementById("s4-combo-short").textContent = info.short;
  document.getElementById("s4-combo-desc").textContent = info.desc;
  s4OuterBtns.forEach((b) => {
    const on = b.dataset.outer === comboOuter;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  s4InnerBtns.forEach((b) => {
    const on = b.dataset.inner === comboInner;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
  });
  if (syncChamber && info.mode) {
    s4Mode = info.mode;
    updateS4Chamber();
  }
}
s4OuterBtns.forEach((b) => b.addEventListener("click", () => { comboOuter = b.dataset.outer; updateCombo(true); }));
s4InnerBtns.forEach((b) => b.addEventListener("click", () => { comboInner = b.dataset.inner; updateCombo(true); }));

/* ==================== 6. 第 05 节：三联独立组件开关卡 ==================== */
const s5Trio = document.getElementById("s5-trio");
const s5XrayCheck = document.getElementById("s5-xray-check");
const s5Switches = [...document.querySelectorAll(".s5-switch[data-card]")];

const S5_META = {
  mag: {
    el: document.getElementById("s5-card-mag"),
    stat: document.getElementById("s5-stat-mag"),
    off: "当前 block：插图探出底边，挤歪了下一节标题。",
    on: "当前 flow-root：图文仍自然绕排，底边严密包住插图，下一节稳居下方。",
  },
  media: {
    el: document.getElementById("s5-card-media"),
    stat: document.getElementById("s5-stat-media"),
    off: "当前 block：长正文折回头像下方，右侧不再整齐。",
    on: "当前 flow-root：正文列垂直独立对齐，不钻头像底下。",
  },
  banner: {
    el: document.getElementById("s5-card-banner"),
    stat: document.getElementById("s5-stat-banner"),
    off: "当前 block：内部上边距穿出横幅顶边，上方露出一条空缝。",
    on: "当前 flow-root：无需 padding: 1px 脏补丁，顶沿紧贴零缝隙。",
  },
};

s5Switches.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.card;
    const next = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(next));
    btn.querySelector("code").textContent = next ? "flow-root" : "block";
    const m = S5_META[key];
    m.el.classList.toggle("is-fr", next);
    m.stat.textContent = next ? m.on : m.off;
  });
});
s5XrayCheck.addEventListener("change", () => {
  s5Trio.classList.toggle("show-xray", s5XrayCheck.checked);
});

/* ==================== 7. 第 06 节：什么时候别用流根（四场景反例簿） ==================== */
const s6Tabs = [...document.querySelectorAll(".s6-tab[data-case]")];
const s6Panels = [...document.querySelectorAll(".s6-case[data-case-panel]")];
const s6Title = document.getElementById("s6-title");
const s6Why = document.getElementById("s6-why");
const s6Instead = document.getElementById("s6-instead");
const s6Measure = document.getElementById("s6-measure-note");

const S6_DATA = {
  grid: {
    title: "要做等高卡片或多列对齐，别用浮动加 flow-root 硬拼",
    why: "flow-root 只能把浮动包起来，既不能让两列自动等高，也没法一行代码做居中对齐或均匀间距。",
    instead:
      '<strong>更稳做法</strong>：单轴对齐交给 <a href="https://layout.xiaoxiaodong.ai/226/play/" target="_blank" rel="noopener">226 弹性盒布局</a>，二维轨道交给 <a href="https://layout.xiaoxiaodong.ai/227/play/" target="_blank" rel="noopener">227 网格布局</a>，报刊流式分栏交给 <a href="https://layout.xiaoxiaodong.ai/229/play/" target="_blank" rel="noopener">229 多栏布局</a>。',
    measure: () => "对比可见：浮动双卡底边高低不一，而 Grid 同行轨道天然等高对齐。",
  },
  wrap: {
    title: "想让一张首图跨越多段正文绕排时，千万别给段落加 flow-root",
    why: "独立 BFC 块盒绝不与外部浮动重叠；给每段 p 加流根后，第二段即使高度已过插图底边，仍会缩在右侧直筒里留出空洞。",
    instead:
      "<strong>更稳做法</strong>：只在整篇文章或整个公告模块的外层容器加 flow-root，让里面的多段 p 继续在普通流里顺滑绕排。",
    measure: () => "对照开场实验：这就是给 p 盖流根印章会破坏公告绕排的同一条规则。",
  },
  "section-top": {
    title: "给分节外壳加 flow-root 后，节标题 margin-top 不再和外壳合并，节顶多出空白",
    why: "注意一个常被记混的事实：BFC 根自身的外边距依然和相邻兄弟正常合并；它阻止合并的只是「自己与首末子元素之间」。原本分节外壳的 24px 顶距与内部标题的 20px 顶距会合并成 24px，强加 flow-root 后标题的 20px 被锁进外壳顶部，平白多出一截空白。",
    instead:
      "<strong>更稳做法</strong>：不需要清浮动的普通分节外壳保持 display: block，或统一改用 padding 管内距、把标题 margin-top 归零。",
    measure: () => {
      const mBlock = measureMarginGap(
        document.getElementById("s6-sec-block"),
        null,
        document.getElementById("s6-sech-block")
      );
      const mFr = measureMarginGap(
        document.getElementById("s6-sec-fr"),
        null,
        document.getElementById("s6-sech-fr")
      );
      return `实时 DOM 测量：默认 block 节内顶空 ${mBlock.topToFirstPPx}px，加 flow-root 后节内顶空暴增至 +${mFr.topToFirstPPx}px。`;
    },
  },
  sticky: {
    title: "配粘性定位吸顶时，真正会废掉吸顶的是 overflow: hidden 而非 flow-root",
    why: "很多人以为「建立 BFC 就会让 position: sticky 失效」，其实让吸顶失效的罪魁祸首是祖先元素的 overflow: hidden（它会建起滚动裁切容器）；display: flow-root 不创建滚动容器，吸顶照常有效。",
    instead:
      '<strong>更稳做法</strong>：遇到 <a href="https://layout.xiaoxiaodong.ai/235/play/" target="_blank" rel="noopener">235 粘性定位布局</a> 吸顶突然失灵，先查祖先有没有历史遗留的 overflow: hidden，换成 display: flow-root 往往当场修复。',
    measure: () => "亲手滚动下方两个微视口对比：左框 overflow: hidden 吸顶跟着滚走，右框 flow-root 牢牢吸顶。",
  },
};

let s6Current = "grid";
function renderS6(key) {
  s6Current = key;
  const d = S6_DATA[key];
  s6Tabs.forEach((t) => {
    const on = t.dataset.case === key;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
  s6Panels.forEach((p) => {
    p.hidden = p.dataset.casePanel !== key;
  });
  s6Title.textContent = d.title;
  s6Why.textContent = d.why;
  s6Instead.innerHTML = d.instead;
  requestAnimationFrame(() => {
    s6Measure.textContent = d.measure();
  });
}
s6Tabs.forEach((t) => t.addEventListener("click", () => renderS6(t.dataset.case)));

/* ==================== 8. 第 07 节：小练习（外边距精准预测 + 同源实测揭晓） ==================== */
const quizOpts = [...document.querySelectorAll(".quiz-opt[data-choice]")];
const qPlaceholder = document.getElementById("q-placeholder");
const qRevealBox = document.getElementById("q-reveal-box");
const qBadge = document.getElementById("q-verdict-badge");
const qTitle = document.getElementById("q-verdict-title");
const qText = document.getElementById("q-verdict-text");
const qLiveHost = document.getElementById("q-live-host");
const qCard1 = document.getElementById("q-card-1");
const qCard2 = document.getElementById("q-card-2");
const qP1 = document.getElementById("q-p-1");
const qOutBetween = document.getElementById("q-measure-between");
const qOutInside = document.getElementById("q-measure-inside");
const qToggleBlock = document.getElementById("q-toggle-block");
const qReset = document.getElementById("q-reset");

const QUIZ_ANSWER = "B";
const QUIZ_FEEDBACK = {
  A: {
    title: "两卡之间并不是 64px——BFC 根彼此作为外部兄弟照样合并外边距",
    text: "这是最常见的一处误记：display: flow-root 只隔断父盒与自己内部子元素的合并，不会阻断两张相邻 .card 自身在外部普通流里的外边距合并，所以 max(32, 32) 实测仍是 32px；卡顶到首段则被流根牢牢锁住为 24px。",
  },
  B: {
    title: "判断完全精准：两卡之间 32px，卡顶到首段 24px",
    text: "两张 .card 自身同处外部普通流，上下 margin: 32px 0 照常合并为 32px；但每张 .card 都是独立 BFC 根，拦住了首段 margin-top: 24px 不让它穿出卡顶，所以卡顶到首段正好是 24px。",
  },
  C: {
    title: "32px 算对了，但卡顶到首段不是 0px",
    text: "只有在默认 display: block 下，首段的 margin-top: 24px 才会穿出卡顶让卡内顶距塌成 0px；题目中 .card 声明了 display: flow-root，24px 被锁在卡片内部。你可以点上方「切 display: block 对照」亲眼验证。",
  },
  D: {
    title: "卡外不会叠成 56px，卡内也不会塌成 0px",
    text: "就算在 display: block 下，外边距合并取的也是较大值 max(32, 24) 而不是相加；而在 display: flow-root 下，两卡外沿之间照常合并为 32px，首段 24px 则稳稳留在卡顶之内。",
  },
};

let quizPicked = "";
let quizCompareBlock = false;

function refreshQuizMeasure() {
  qLiveHost.classList.toggle("is-block-mode", quizCompareBlock);
  qToggleBlock.setAttribute("aria-pressed", String(quizCompareBlock));
  qToggleBlock.textContent = quizCompareBlock ? "恢复 display: flow-root" : "切 display: block 对照";
  // 调用与 02、06 节完全一致的共用实测函数 measureMarginGap
  const m = measureMarginGap(qCard1, qCard2, qP1);
  qOutBetween.textContent = `${m.betweenCardsPx}px`;
  qOutInside.textContent = `${m.topToFirstPPx}px`;
}

quizOpts.forEach((btn) => {
  btn.addEventListener("click", () => {
    quizPicked = btn.dataset.choice;
    quizCompareBlock = false;
    const correct = quizPicked === QUIZ_ANSWER;
    quizOpts.forEach((b) => {
      const ch = b.dataset.choice;
      b.setAttribute("aria-pressed", String(ch === quizPicked));
      b.classList.toggle("is-picked", ch === quizPicked);
      b.classList.toggle("is-right", ch === QUIZ_ANSWER);
      b.classList.toggle("is-wrong", ch === quizPicked && !correct);
    });
    qPlaceholder.hidden = true;
    qRevealBox.hidden = false;
    qBadge.textContent = correct ? "选对了 · 实测一致" : `你选了 ${quizPicked} · 正确答案是 ${QUIZ_ANSWER}`;
    qBadge.classList.toggle("is-wrong", !correct);
    qTitle.textContent = QUIZ_FEEDBACK[quizPicked].title;
    qText.textContent = QUIZ_FEEDBACK[quizPicked].text;
    requestAnimationFrame(refreshQuizMeasure);
  });
});

qToggleBlock.addEventListener("click", () => {
  quizCompareBlock = !quizCompareBlock;
  refreshQuizMeasure();
});

qReset.addEventListener("click", () => {
  quizPicked = "";
  quizCompareBlock = false;
  quizOpts.forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.classList.remove("is-picked", "is-right", "is-wrong");
  });
  qPlaceholder.hidden = false;
  qRevealBox.hidden = true;
});

/* ==================== 9. 第 08 节：原海报灯箱缩放与拖拽 ==================== */
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewer-img");
const viewerScroll = document.getElementById("viewer-scroll");
const zoomOut = document.getElementById("zoom-out");
const zoomIn = document.getElementById("zoom-in");
const zoomReset = document.getElementById("zoom-reset");
const zoomVal = document.getElementById("zoom-val");
const viewerClose = document.getElementById("viewer-close");

let zoomScale = 1;
function applyZoom() {
  zoomVal.textContent = `${Math.round(zoomScale * 100)}%`;
  const baseW = Math.min(window.innerWidth * 0.82, 720);
  viewerImg.style.width = `${Math.round(baseW * zoomScale)}px`;
}

posterBtn.addEventListener("click", () => {
  // 严守单次内联规矩：直接复用页面上 #poster 的 data URI
  if (!viewerImg.src) viewerImg.src = posterImg.src;
  zoomScale = 1;
  applyZoom();
  viewer.showModal();
  viewerScroll.scrollTo(0, 0);
});
viewerClose.addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (e) => {
  if (e.target === viewer) viewer.close();
});
zoomIn.addEventListener("click", () => {
  zoomScale = Math.min(2.6, +(zoomScale + 0.25).toFixed(2));
  applyZoom();
});
zoomOut.addEventListener("click", () => {
  zoomScale = Math.max(0.6, +(zoomScale - 0.25).toFixed(2));
  applyZoom();
});
zoomReset.addEventListener("click", () => {
  zoomScale = 1;
  applyZoom();
});

// 鼠标拖拽平移灯箱大图
let panning = false;
let panX = 0;
let panY = 0;
let startSL = 0;
let startST = 0;
viewerScroll.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  panning = true;
  panX = e.clientX;
  panY = e.clientY;
  startSL = viewerScroll.scrollLeft;
  startST = viewerScroll.scrollTop;
  viewerScroll.classList.add("is-panning");
  viewerScroll.setPointerCapture?.(e.pointerId);
});
viewerScroll.addEventListener("pointermove", (e) => {
  if (!panning) return;
  viewerScroll.scrollLeft = startSL - (e.clientX - panX);
  viewerScroll.scrollTop = startST - (e.clientY - panY);
});
const stopPan = () => {
  panning = false;
  viewerScroll.classList.remove("is-panning");
};
viewerScroll.addEventListener("pointerup", stopPan);
viewerScroll.addEventListener("pointercancel", stopPan);

/* ==================== 10. 初始化与视口缩放同步 ==================== */
function initAll() {
  applyHeroStamps();
  renderS1();
  updateS2();
  renderEra("1998");
  updateCombo(false);
  updateS4Chamber();
  renderS6("grid");
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    initAll();
  });
} else {
  initAll();
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    applyHeroStamps();
    updateS2();
    updateS4Chamber();
    if (s6Current === "section-top") renderS6("section-top");
    if (quizPicked) refreshQuizMeasure();
  }, 80);
});
