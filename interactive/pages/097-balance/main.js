// 097 平衡 BALANCE · 入口脚本
// 统一绑定单真源状态、自示范「平 | 衡」标题微倾、左右两翼控制盘与诊单、底沿五栏原海报实时标尺。

import { createBalanceCanvas } from "./canvas.js";
import {
  BLOCK_DEFS,
  CONTEXTS,
  MATERIALS,
  SCALES,
  clonePreset,
  evaluate,
} from "./model.js";
import { initSections } from "./sections.js";

let state = clonePreset("initial");
let contextMode = "poster";

const canvas = document.getElementById("balance-canvas");

// 自示范顶标左右二字
const charLeft = document.getElementById("hero-char-left");
const charRight = document.getElementById("hero-char-right");
const topStatusBadge = document.getElementById("hero-top-badge");
const contextSub = document.getElementById("hero-context-sub");

// 左翼：左力矩读数 + 选中块控制盘
const leftTorqueNum = document.getElementById("read-left-torque");
const leftTorqueBar = document.getElementById("bar-left-torque");
const rightTorqueNum = document.getElementById("read-right-torque");
const rightTorqueBar = document.getElementById("bar-right-torque");
const selectedLabel = document.getElementById("ctrl-selected-name");
const selectedMeta = document.getElementById("ctrl-selected-meta");
const fulcrumSlider = document.getElementById("ctrl-fulcrum");
const fulcrumVal = document.getElementById("ctrl-fulcrum-val");
const comVal = document.getElementById("read-com-val");
const tiltVal = document.getElementById("read-tilt-val");

// 右翼：单真源实时诊单 + 移动端折线首句同步
const diagCard = document.getElementById("hero-diag");
const diagBadge = document.getElementById("diag-badge");
const diagGrade = document.getElementById("diag-grade");
const diagHead = document.getElementById("diag-head");
const diagBody = document.getElementById("diag-body");
const diagTip = document.getElementById("diag-tip");

// 移动端首屏精简诊单同步节点
const mobHead = document.getElementById("mob-diag-head");
const mobBadge = document.getElementById("mob-diag-badge");

const blockBtns = [...document.querySelectorAll("[data-select-block]")];
const matBtns = [...document.querySelectorAll("[data-set-mat]")];
const scaleBtns = [...document.querySelectorAll("[data-set-scale]")];
const ctxBtns = [...document.querySelectorAll("[data-context]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];
const weighBtns = [...document.querySelectorAll("[data-action='weigh']")];
const solveBtns = [...document.querySelectorAll("[data-action='solve']")];
const resetBtns = [...document.querySelectorAll("[data-action='reset']")];

let balanceCanvas = null;
let lastDragSync = 0;
let dragSyncTimer = 0;

// 轻量文本赋值：值没变就不写 DOM，避免触发不必要的样式计算与重绘
function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

// 缓存五栏标尺节点，避免每次拖动遍历 querySelector
const pillarEls = Object.fromEntries(
  ["symmetry", "equilibrium", "focal", "stability", "resonance"].map((id) => {
    const col = document.querySelector(`[data-pillar="${id}"]`);
    return [id, { col, tag: col?.querySelector(".pillar-tag") }];
  })
);

function syncUI() {
  const ev = evaluate(state);

  // 1. 顶标自示范：「平」「衡」二字随倾角微沉浮（最多 ±6px，保持端庄易读），稳衡时严格平齐！
  const shiftPx = Math.max(-6, Math.min(6, ev.targetAngleDeg * 0.34));
  if (charLeft && charRight) {
    const tL = `translateY(${(-shiftPx).toFixed(1)}px)`;
    const tR = `translateY(${shiftPx.toFixed(1)}px)`;
    if (charLeft.style.transform !== tL) charLeft.style.transform = tL;
    if (charRight.style.transform !== tR) charRight.style.transform = tR;
  }

  // 2. 顶状态徽与语境说明
  if (topStatusBadge) {
    setText(topStatusBadge, ev.badge);
    topStatusBadge.classList.toggle("is-ok", ev.isBalanced);
  }
  setText(contextSub, CONTEXTS[contextMode].sub);

  // 3. 左右臂力矩读数与能量条（标「示意」，同源实算）
  const maxTorque = Math.max(1.2, ev.leftTorque, ev.rightTorque);
  setText(leftTorqueNum, ev.leftTorque.toFixed(2));
  setText(rightTorqueNum, ev.rightTorque.toFixed(2));
  const wL = `${Math.min(100, (ev.leftTorque / maxTorque) * 100).toFixed(1)}%`;
  const wR = `${Math.min(100, (ev.rightTorque / maxTorque) * 100).toFixed(1)}%`;
  if (leftTorqueBar && leftTorqueBar.style.width !== wL) leftTorqueBar.style.width = wL;
  if (rightTorqueBar && rightTorqueBar.style.width !== wR) rightTorqueBar.style.width = wR;
  setText(comVal, `${ev.comPct}%`);
  if (tiltVal) {
    const deg = Math.abs(ev.targetAngleDeg) < 0.05 ? 0 : ev.targetAngleDeg;
    setText(tiltVal, `${deg > 0 ? "+" : ""}${deg.toFixed(1)}°`);
    tiltVal.classList.toggle("is-ok", Math.abs(ev.targetAngleDeg) <= 2.2);
  }

  // 4. 支点滑轨同步
  const fStr = String(Math.round(ev.fulcrum * 100));
  if (fulcrumSlider && fulcrumSlider.value !== fStr) fulcrumSlider.value = fStr;
  setText(fulcrumVal, `${ev.fulcrumPct}%`);

  // 5. 当前选中配重块状态同步
  const sel = ev.byId[state.selected] || ev.byId.rightSq;
  const selName =
    contextMode === "spread"
      ? sel.spreadName
      : contextMode === "exhibition"
        ? sel.exhibitName
        : sel.name;
  setText(selectedLabel, selName);
  const armSign = sel.arm >= 0 ? "+" : "";
  setText(selectedMeta, `示意重 ${sel.weight.toFixed(2)} · 臂 ${armSign}${(sel.arm * 50).toFixed(0)}%`);

  blockBtns.forEach((b) => {
    const id = b.dataset.selectBlock;
    const def = BLOCK_DEFS.find((d) => d.id === id);
    if (def) {
      const txt =
        contextMode === "spread"
          ? def.spreadName
          : contextMode === "exhibition"
            ? def.exhibitName
            : def.name;
      setText(b, txt);
    }
    const active = id === state.selected;
    if (b.classList.contains("is-active") !== active) {
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  });

  matBtns.forEach((b) => {
    const active = b.dataset.setMat === sel.mat;
    if (b.classList.contains("is-active") !== active) {
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  });

  scaleBtns.forEach((b) => {
    const sDef = SCALES.find((x) => x.id === b.dataset.setScale);
    const active = !!(sDef && Math.abs(sDef.value - sel.scale) < 0.05);
    if (b.classList.contains("is-active") !== active) {
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  });

  ctxBtns.forEach((b) => {
    const active = b.dataset.context === contextMode;
    if (b.classList.contains("is-active") !== active) {
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    }
  });

  // 6. 单真源诊单与移动折线同步
  if (diagCard) diagCard.classList.toggle("is-ok", ev.isBalanced);
  setText(diagBadge, ev.badge);
  setText(diagGrade, ev.statusGrade);
  setText(diagHead, ev.headline);
  setText(diagBody, ev.body);
  setText(diagTip, ev.tip);
  setText(mobHead, ev.headline);
  if (mobBadge) {
    setText(mobBadge, ev.badge);
    mobBadge.classList.toggle("is-ok", ev.isBalanced);
  }

  // 7. 底沿 1:1 原海报五栏实时标尺（对称/均衡/重心/稳定/呼应）
  for (const ch of ev.checks) {
    const entry = pillarEls[ch.id];
    if (!entry?.col) continue;
    entry.col.classList.toggle("is-ok", ch.ok);
    setText(entry.tag, ch.tag);
  }
}

function scheduleSyncUI(fromDrag) {
  if (!fromDrag) {
    if (dragSyncTimer) { clearTimeout(dragSyncTimer); dragSyncTimer = 0; }
    lastDragSync = performance.now();
    syncUI();
    return;
  }
  const now = performance.now();
  // 拖动时对全页 DOM 同步节流至 140ms，画布自身保持 60Hz 丝滑重绘（大幅提升软件渲染帧率！）
  if (now - lastDragSync >= 140) {
    lastDragSync = now;
    syncUI();
  } else if (!dragSyncTimer) {
    dragSyncTimer = setTimeout(() => {
      dragSyncTimer = 0;
      lastDragSync = performance.now();
      syncUI();
    }, 150);
  }
}

function updateState(updater) {
  state = updater(state);
  syncUI();
  balanceCanvas?.poke();
}

// 绑定按钮与滑轨
blockBtns.forEach((b) =>
  b.addEventListener("click", () => {
    updateState((s) => ({ ...s, selected: b.dataset.selectBlock }));
  })
);

matBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const mat = b.dataset.setMat;
    if (!MATERIALS[mat]) return;
    updateState((s) => ({
      ...s,
      blocks: {
        ...s.blocks,
        [s.selected]: { ...s.blocks[s.selected], mat },
      },
    }));
  })
);

scaleBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const sDef = SCALES.find((x) => x.id === b.dataset.setScale);
    if (!sDef) return;
    updateState((s) => ({
      ...s,
      blocks: {
        ...s.blocks,
        [s.selected]: { ...s.blocks[s.selected], scale: sDef.value },
      },
    }));
  })
);

fulcrumSlider?.addEventListener("input", () => {
  const val = Number(fulcrumSlider.value) / 100;
  const snapped = Math.abs(val) < 0.025 ? 0 : val;
  updateState((s) => ({ ...s, fulcrum: +snapped.toFixed(3) }));
});

ctxBtns.forEach((b) =>
  b.addEventListener("click", () => {
    contextMode = b.dataset.context;
    syncUI();
    balanceCanvas?.poke();
  })
);

presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state = clonePreset(b.dataset.preset);
    syncUI();
    balanceCanvas?.poke();
  })
);

solveBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state = clonePreset("posterBalanced");
    syncUI();
    balanceCanvas?.triggerWeighTest();
  })
);

resetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state = clonePreset("initial");
    syncUI();
    balanceCanvas?.poke();
  })
);

weighBtns.forEach((b) =>
  b.addEventListener("click", () => {
    balanceCanvas?.triggerWeighTest();
  })
);

// 全局 Space 快捷键（在页面首屏且焦点不在输入框/按钮时放手称重）
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA" || tag === "A") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      e.preventDefault();
      balanceCanvas?.triggerWeighTest();
    }
  }
});

// 初始化画布、UI 与正文 7 节交互
balanceCanvas = createBalanceCanvas({
  canvas,
  getState: () => state,
  getContextMode: () => contextMode,
  onStateChange: (fn, opts = {}) => {
    state = fn(state);
    scheduleSyncUI(!!opts.fromDrag);
  },
  onSelect: (id) => {
    state = { ...state, selected: id };
    scheduleSyncUI(false);
  },
});

syncUI();
initSections();
