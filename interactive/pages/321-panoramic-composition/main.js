// 321 全景式构图 · 主交互逻辑（单真源同步渲染 + 七节独立交互 + 原海报可拖动灯箱）
import { loop } from "../../lib/stage.js";
import {
  INITIAL_STATE,
  PRESETS,
  RULES,
  SCENES,
  clamp,
  evaluate,
} from "./model.js";
import {
  drawDepthLabCanvas,
  drawDiagramCanvas,
  drawHeroCanvas,
  refreshCanvasSize,
} from "./scene.js";

// ==================== 开场单真源状态 ====================
const state = { ...INITIAL_STATE };
let liveCrop = null;
let dragMode = null; // "aspect" | "anchor" | null
let dragStartX = 0;
let dragStartY = 0;
let dragStartAspect = state.aspect;
let dragStartAnchor = state.anchorX;
let dragLocked = false;
let heroRectCache = null;
let dirty = true;
let uiDirty = true;
let lastUiSyncMs = 0;

const $ = (id) => document.getElementById(id);

const heroCanvas = $("hero-canvas");
const diagramCanvas = $("diagram-canvas");
const mastBar = $("mast-bar");
const mastTitle = $("page-title");
const mastSun = $("mast-sun");

const topStatus = $("top-status");
const diagPanel = $("diag-panel");
const diagBadge = $("diag-badge");
const diagHead = $("diag-head");
const diagBody = $("diag-body");
const diagTip = $("diag-tip");
const diagramRatio = $("diagram-ratio");

const mAspect = $("m-aspect");
const mDepth = $("m-depth");
const mScale = $("m-scale");
const mSky = $("m-sky");

const rngAspect = $("rng-aspect");
const rngHaze = $("rng-haze");
const rngScale = $("rng-scale");
const rngHorizon = $("rng-horizon");
const btnFore = $("btn-fore");
const btnGuides = $("btn-guides");

const valAspect = $("val-aspect");
const valHaze = $("val-haze");
const valScale = $("val-scale");
const valHorizon = $("val-horizon");

const tagExtend = $("tag-extend");
const tagDepth = $("tag-depth");
const tagScale = $("tag-scale");

function syncUI(evArg) {
  const ev = evArg || evaluate(state);

  // 示范标题随画幅开度微展字距，顶部朱红短杠用纯 GPU scaleX 零重排
  const openRatio = clamp((state.aspect - 1.0) / 2.4, 0, 1);
  if (!dragMode) {
    mastTitle.style.letterSpacing = `${(-0.02 + openRatio * 0.14).toFixed(3)}em`;
  }
  mastBar.style.transform = `scaleX(${(0.72 + openRatio * 0.92).toFixed(3)})`;
  mastSun.style.transform = `scale(${(1.06 - openRatio * 0.14).toFixed(3)})`;

  // 顶眉状态
  topStatus.textContent = ev.passedCount === 4 ? "4 / 4 全景成立" : `${ev.passedCount} / 4 待开镜`;
  topStatus.classList.toggle("is-ok", ev.passedCount === 4);
  topStatus.classList.toggle("is-warn", ev.passedCount < 4);

  // 诊单区
  diagPanel.classList.toggle("is-ok", ev.diag.ok);
  diagBadge.textContent = ev.diag.badge;
  diagBadge.classList.toggle("is-ok", ev.diag.ok);
  diagHead.textContent = ev.diag.headline;
  diagBody.textContent = ev.diag.body;
  diagTip.textContent = ev.diag.action;

  // 单真源指标读数
  mAspect.textContent = `${state.aspect.toFixed(2)} : 1`;
  mDepth.textContent = `ΔL ${ev.depthContrast.toFixed(2)}`;
  mScale.textContent = ev.mtnToHuman ? `1 : ${ev.mtnToHuman}` : "无参照";
  mSky.textContent = `${ev.skyRatio}%`;
  diagramRatio.textContent = `幅面 ${state.aspect.toFixed(2)}:1 · 山人 ${ev.mtnToHuman ? `1:${ev.mtnToHuman}` : "无"}`;

  // 控槽数值与状态
  rngAspect.value = state.aspect.toFixed(2);
  rngHaze.value = String(Math.round(state.haze * 100));
  rngScale.value = state.scalePct.toFixed(1);
  rngHorizon.value = String(Math.round(state.horizon * 100));

  valAspect.textContent = `${state.aspect.toFixed(2)} : 1`;
  valHaze.textContent = `${Math.round(state.haze * 100)}% · ${state.foreground ? "有前景" : "无前景"}`;
  const posWord =
    Math.abs(state.anchorX - 0.5) < RULES.anchorCenterDeadZone
      ? "中轴"
      : state.anchorX < 0.5
      ? `左岸 ${Math.round(state.anchorX * 100)}%`
      : `右岸 ${Math.round(state.anchorX * 100)}%`;
  valScale.textContent = state.scalePct < 0.5 ? "0%（隐藏）" : `${state.scalePct.toFixed(1)}% · ${posWord}`;
  const hzPct = Math.round(state.horizon * 100);
  const hzNote =
    hzPct >= 45 && hzPct <= 55 ? "均切" : hzPct < 45 ? "高视点" : "开阔天宇";
  valHorizon.textContent = `${hzPct}%（${hzNote}）`;

  btnFore.setAttribute("aria-pressed", String(state.foreground));
  btnFore.textContent = state.foreground ? "前景墨岸：开" : "前景墨岸：关";
  btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  btnGuides.textContent = state.showGuides ? "标线：开" : "标线：关";

  // 三枚原海报要点徽标实时同步
  for (const [el, p] of [
    [tagExtend, ev.pillars.extend],
    [tagDepth, ev.pillars.depth],
    [tagScale, ev.pillars.scale],
  ]) {
    el.textContent = p.tag;
    el.classList.toggle("is-ok", p.ok);
    el.classList.toggle("is-warn", !p.ok);
  }

  // 母题切签高亮
  document.querySelectorAll(".tab-btn").forEach((b) => {
    const active = b.dataset.scene === state.scene;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", String(active));
  });

  // 快捷芯片同步高亮
  document.querySelectorAll(".chip[data-aspect]").forEach((b) => {
    b.classList.toggle("is-active", Math.abs(parseFloat(b.dataset.aspect) - state.aspect) < 0.06);
  });
  document.querySelectorAll(".chip[data-horizon]").forEach((b) => {
    b.classList.toggle("is-active", Math.abs(parseFloat(b.dataset.horizon) / 100 - state.horizon) < 0.02);
  });
  document.querySelectorAll(".chip[data-scale]").forEach((b) => {
    b.classList.toggle("is-active", Math.abs(parseFloat(b.dataset.scale) - state.scalePct) < 1.2);
  });

  // 同步重绘淡青剖析图（拖拽中节流，松手必重绘）
  if (!dragMode) drawDiagramCanvas(diagramCanvas, state, ev);
  dirty = true;
  uiDirty = false;
  return ev;
}

function applyPreset(key) {
  Object.assign(state, PRESETS[key]);
  syncUI();
  heroLoop.draw();
}

// 绑定主循环（仅在变化或首帧重画，拖拽合并在 rAF 内单次提交，杜绝事件洪峰与布局抖动）
const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  if (!dirty && !still) return;
  dirty = false;
  const ev = evaluate(state);
  liveCrop = drawHeroCanvas(heroCanvas, state, ev, {
    t,
    still,
    dragging: dragMode !== null,
  });
  if (uiDirty) {
    const now = performance.now();
    if (!dragMode || now - lastUiSyncMs > 110) {
      lastUiSyncMs = now;
      syncUI(ev);
    }
  }
  if (still) drawDiagramCanvas(diagramCanvas, state, ev);
});

// ==================== 主画布拖拽交互（同时完整支持鼠标、Pointer 和纯 Touch） ====================
function hitAnchor(clientX, clientY) {
  if (!liveCrop || state.scalePct < 0.5) return false;
  const r = heroRectCache || heroCanvas.getBoundingClientRect();
  const lx = clientX - r.left;
  const ly = clientY - r.top;
  const ax = liveCrop.x + liveCrop.w * state.anchorX;
  const humanH = liveCrop.h * (state.scalePct / 100);
  const footY = liveCrop.y + liveCrop.h * 0.90;
  return Math.abs(lx - ax) < Math.max(22, humanH * 0.45) && ly >= footY - humanH - 20 && ly <= footY + 18;
}

function beginDrag(clientX, clientY) {
  heroRectCache = heroCanvas.getBoundingClientRect();
  dragStartX = clientX;
  dragStartY = clientY;
  dragStartAspect = state.aspect;
  dragStartAnchor = state.anchorX;
  dragLocked = false;
  dragMode = hitAnchor(clientX, clientY) ? "anchor" : "aspect";
}

function moveDrag(clientX, clientY) {
  if (!dragMode) return false;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  if (!dragLocked) {
    if (Math.hypot(dx, dy) < 3) return false;
    // 手机竖滑滚页不抢占；横向拖动锁定画布开镜
    if (Math.abs(dy) > Math.abs(dx) * 1.4 && dragMode === "aspect") {
      dragMode = null;
      return false;
    }
    dragLocked = true;
  }
  const rect = heroRectCache || heroCanvas.getBoundingClientRect();
  if (dragMode === "anchor" && liveCrop) {
    const nextAnchor = clamp(dragStartAnchor + dx / Math.max(80, liveCrop.w), 0.08, 0.92);
    state.anchorX = Math.round(nextAnchor * 100) / 100;
  } else {
    // 左右横拖开合画幅（向右拉宽，向左收窄），靠近 2.35 / 2.65 时轻微磁吸
    const raw = clamp(dragStartAspect + (dx / Math.max(120, rect.width * 0.48)) * 2.1, 1.0, 4.0);
    let snapped = raw;
    for (const target of [2.35, 2.65]) {
      if (Math.abs(raw - target) < 0.04) snapped = target;
    }
    state.aspect = Math.round(snapped * 100) / 100;
  }
  // 仅标记脏位交由 rAF 合批单次重绘，避免高频事件洪峰拖垮慢手机软渲
  dirty = true;
  uiDirty = true;
  return true;
}

function endDrag(clientX, clientY) {
  // 如果是轻点（几乎没拖动）且点在有效取景窗内，直接把朱红点景人挪到点击处的岸线上
  if (dragMode && !dragLocked && liveCrop && state.scalePct > 0.5) {
    const r = heroRectCache || heroCanvas.getBoundingClientRect();
    const lx = clientX - r.left;
    if (lx >= liveCrop.x && lx <= liveCrop.x + liveCrop.w) {
      state.anchorX = clamp(Math.round(((lx - liveCrop.x) / liveCrop.w) * 100) / 100, 0.08, 0.92);
    }
  }
  dragMode = null;
  dragLocked = false;
  syncUI();
  heroLoop.draw();
}

// 使用 PointerEvents + 兜底 TouchEvents（确保 CDP dispatchTouchEvent 在任何环境下都 100% 触发重绘）
let usingPointer = false;
heroCanvas.addEventListener("pointerdown", (e) => {
  usingPointer = true;
  heroCanvas.setPointerCapture?.(e.pointerId);
  beginDrag(e.clientX, e.clientY);
});
heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragMode) return;
  moveDrag(e.clientX, e.clientY);
});
heroCanvas.addEventListener("pointerup", (e) => {
  if (!dragMode) return;
  endDrag(e.clientX, e.clientY);
});
heroCanvas.addEventListener("pointercancel", () => {
  dragMode = null;
  dragLocked = false;
});

heroCanvas.addEventListener("touchstart", (e) => {
  if (usingPointer || !e.touches.length) return;
  beginDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
heroCanvas.addEventListener("touchmove", (e) => {
  if (usingPointer || !dragMode || !e.touches.length) return;
  if (moveDrag(e.touches[0].clientX, e.touches[0].clientY)) {
    e.preventDefault();
  }
}, { passive: false });
heroCanvas.addEventListener("touchend", (e) => {
  if (usingPointer || !dragMode) return;
  const pt = e.changedTouches[0];
  endDrag(pt ? pt.clientX : dragStartX, pt ? pt.clientY : dragStartY);
}, { passive: true });

// 键盘操作主画布：←→ 调宽幅、↑↓ 调点景尺度
heroCanvas.addEventListener("keydown", (e) => {
  let handled = true;
  const step = e.shiftKey ? 0.2 : 0.05;
  if (e.key === "ArrowRight") state.aspect = clamp(+(state.aspect + step).toFixed(2), 1.0, 4.0);
  else if (e.key === "ArrowLeft") state.aspect = clamp(+(state.aspect - step).toFixed(2), 1.0, 4.0);
  else if (e.key === "ArrowUp") state.scalePct = clamp(+(state.scalePct + (e.shiftKey ? 4 : 1)).toFixed(1), 0, 40);
  else if (e.key === "ArrowDown") state.scalePct = clamp(+(state.scalePct - (e.shiftKey ? 4 : 1)).toFixed(1), 0, 40);
  else handled = false;
  if (handled) {
    e.preventDefault();
    syncUI();
    heroLoop.draw();
  }
});

// ==================== 控槽控件绑定 ====================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scene = btn.dataset.scene;
    syncUI();
    heroLoop.draw();
  });
});

$("btn-solve-poster").addEventListener("click", () => applyPreset("poster"));
$("btn-solve-scroll").addEventListener("click", () => applyPreset("scroll"));
$("btn-reset-broken").addEventListener("click", () => applyPreset("broken"));

btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  syncUI();
  heroLoop.draw();
});

btnFore.addEventListener("click", () => {
  state.foreground = !state.foreground;
  syncUI();
  heroLoop.draw();
});

rngAspect.addEventListener("input", () => {
  state.aspect = parseFloat(rngAspect.value);
  syncUI();
  heroLoop.draw();
});
rngHaze.addEventListener("input", () => {
  state.haze = parseFloat(rngHaze.value) / 100;
  syncUI();
  heroLoop.draw();
});
rngScale.addEventListener("input", () => {
  state.scalePct = parseFloat(rngScale.value);
  syncUI();
  heroLoop.draw();
});
rngHorizon.addEventListener("input", () => {
  state.horizon = parseFloat(rngHorizon.value) / 100;
  syncUI();
  heroLoop.draw();
});

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.aspect) state.aspect = parseFloat(btn.dataset.aspect);
    if (btn.dataset.horizon) state.horizon = parseFloat(btn.dataset.horizon) / 100;
    if (btn.dataset.scale !== undefined) state.scalePct = parseFloat(btn.dataset.scale);
    if (btn.dataset.anchor) state.anchorX = parseFloat(btn.dataset.anchor);
    syncUI();
    heroLoop.draw();
  });
});

// ==================== 01 节：解剖读法切换 & 单层聚焦 ====================
const anaDepthG = $("ana-overlay-depth");
const anaPosterG = $("ana-overlay-poster");
const anaReadout = $("ana-readout");
const ANA_COPY = {
  depth: "纵深视角下，最底部墨青岸坡离观者最近，中景湖面与青峦承接视野，淡青雾山退至极远——三层叠压才撑出真实空间深度。",
  poster: "原海报中段用两条竖虚线按左—中—右三段标示了“前景 / 中景 / 远景”，属于帮助读者快速扫读的平面分区；作画与取景时仍需按纵深三层层层叠压。",
  fore: "【前景墨岸】深墨色调压住画面底沿，右侧松林斜收视野，既挡住边缘散光，也给观者安放一个“立足远眺”的心理起点。",
  mid: "【中景湖山】清亮银青水面横向铺开、把左右青碧山坡收进怀里，是整幅全景包容感最强的视觉腹地。",
  far: "【远景雾峰】轮廓柔和、明度退向宣纸底色，像呼吸的尾音一样把视野一路送往画外天际。",
};

document.querySelectorAll(".seg-btn[data-ana]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.ana;
    document.querySelectorAll(".seg-btn[data-ana]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    anaDepthG.toggleAttribute("hidden", mode !== "depth");
    anaPosterG.toggleAttribute("hidden", mode !== "poster");
    anaReadout.textContent = ANA_COPY[mode];
  });
});

document.querySelectorAll(".lp-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.focus;
    document.querySelectorAll(".lp-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("#ana-svg .ana-layer").forEach((g) => {
      g.classList.toggle("is-dim", f !== "all" && g.dataset.layer !== f);
    });
    anaReadout.textContent = f === "all" ? ANA_COPY.depth : ANA_COPY[f];
  });
});

// ==================== 02 节：历史画幅实比展开尺 ====================
const ERAS = {
  academy: {
    ratio: "1.33 / 1",
    width: "44%",
    badge: "1.33 : 1",
    title: "传统学院画框 / 4:3 标准比例",
    desc: "早期绘画与 1930 年代好莱坞学院比例更适合肖像、静物与中景对话。放进大江大河时，左右山脉被过早裁断，包容感弱。",
    meta: "横向展开率 100%（基准） · 适用：肖像、近景叙事",
  },
  panavision: {
    ratio: "2.20 / 1",
    width: "76%",
    badge: "2.20 : 1",
    title: "Super Panavision 70（1962《阿拉伯的劳伦斯》）",
    desc: "65mm 宽底片直接拍摄，不用变形压缩，画质通透如窗。2.20:1 既有大片天宇留气，又能把沙漠远方一粒孤骑放进宏阔视野。",
    meta: "横向展开率 165%（对比 4:3） · 适用：史诗风景、沉浸展陈",
  },
  cinemascope: {
    ratio: "2.35 / 1",
    width: "82%",
    badge: "2.35 : 1",
    title: "CinemaScope 变形宽银幕（1953 / 1956）",
    desc: "二十世纪福斯在 1953 年《圣袍千秋》首推 2.55:1，1956 年兼容光学声轨后成为经典 2.35:1。它兼顾左右横向包抄感与足够的天地纵高，至今仍是电影全景的基准比例之一。",
    meta: "横向展开率 177%（对比 4:3） · 适用：史诗外景、宽幅首屏头图",
  },
  poster: {
    ratio: "2.85 / 1",
    width: "92%",
    badge: "2.85 : 1",
    title: "321 本页原海报横向全景画幅",
    desc: "原海报中部全宽出血湖山近似 2.85:1，比 16:9 更舒展、又不至于压扁山峰；左侧陡岭、中央银湖与右岸松林朱红人刚好构成完整环抱。",
    meta: "横向展开率 214%（对比 4:3） · 适用：平面海报、画册跨页",
  },
  scroll: {
    ratio: "4.20 / 1",
    width: "100%",
    badge: "4.20 : 1（局部展段）",
    title: "北宋长卷单次展阅幅面（《千里江山图》全卷逾 23:1）",
    desc: "手卷一次在案头摊开约三四尺，呈 4:1 左右超宽带，且可随手卷舒不断换景；单帧静态海报若强拉到这个比例，容易把纵向山势压得过扁。",
    meta: "横向展开率 316%（局部） · 适用：横向长卷、连续展墙",
  },
};

const eraFrame = $("era-frame");
const eraBadge = $("era-badge");
const eraTitle = $("era-title");
const eraDesc = $("era-desc");
const eraMeta = $("era-meta");

document.querySelectorAll(".era-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const info = ERAS[btn.dataset.era];
    if (!info) return;
    document.querySelectorAll(".era-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    eraFrame.style.aspectRatio = info.ratio;
    eraFrame.style.width = info.width;
    eraBadge.textContent = info.badge;
    eraTitle.textContent = info.title;
    eraDesc.textContent = info.desc;
    eraMeta.textContent = info.meta;
  });
});

// ==================== 03 节：深松墨暗室四层独立剥离 ====================
const depthCanvas = $("depth-canvas");
const depthLab = { fore: true, water: true, mid: true, far: true, haze: 0.88, horizon: 0.62 };
const s3Grade = $("s3-grade");
const s3Desc = $("s3-desc");
const valLabHaze = $("val-lab-haze");
const valLabHz = $("val-lab-hz");

function renderDepthLab() {
  drawDepthLabCanvas(depthCanvas, depthLab);
  const count = [depthLab.fore, depthLab.water, depthLab.mid, depthLab.far].filter(Boolean).length;
  valLabHaze.textContent = `${Math.round(depthLab.haze * 100)}%（${depthLab.haze < 0.35 ? "偏平" : "远淡近深"}）`;
  valLabHz.textContent = `${Math.round(depthLab.horizon * 100)}%`;

  if (count <= 1) {
    s3Grade.textContent = `纵深档位：严重塌平（仅剩 ${count} 层 · 示意）`;
    s3Grade.classList.add("is-warn");
    s3Desc.textContent = "空间层次被抽空，画面退回单薄剪影，观者失去了“由近推远”的阶梯。";
  } else if (!depthLab.fore) {
    s3Grade.textContent = "纵深档位：缺前景立足点（示意）";
    s3Grade.classList.add("is-warn");
    s3Desc.textContent = "抽掉 01 前景墨岸后，中远景虽然还在，但整个场景像悬空贴在画面上，少了一步踏进画里的临场门槛。";
  } else if (depthLab.haze < 0.32) {
    s3Grade.textContent = "纵深档位：空气雾阶扁平（示意）";
    s3Grade.classList.add("is-warn");
    s3Desc.textContent = "四层都在，但空气雾阶太低，远山和中景一样深重，大脑误以为它们贴在同一张硬纸板上。";
  } else if (count < 4) {
    s3Grade.textContent = `纵深档位：中等（${count} / 4 层 · 示意）`;
    s3Grade.classList.remove("is-warn");
    s3Desc.textContent = "尚有基础层次，但缺少了被关掉的那一环过渡；补齐四层后空间衔接最绵密。";
  } else {
    s3Grade.textContent = "纵深档位：四层清晰（示意）";
    s3Grade.classList.remove("is-warn");
    s3Desc.textContent = "前景深墨稳稳压住下沿，中景湖面与青峦接力推进，远景雾峰大幅退淡——空气散射与重叠遮挡共同把平面推成了深谷。";
  }
}

for (const [id, key] of [
  ["chk-fore", "fore"],
  ["chk-water", "water"],
  ["chk-mid", "mid"],
  ["chk-far", "far"],
]) {
  $(id).addEventListener("change", (e) => {
    depthLab[key] = e.target.checked;
    renderDepthLab();
  });
}
$("rng-lab-haze").addEventListener("input", (e) => {
  depthLab.haze = parseFloat(e.target.value) / 100;
  renderDepthLab();
});
$("rng-lab-hz").addEventListener("input", (e) => {
  depthLab.horizon = parseFloat(e.target.value) / 100;
  renderDepthLab();
});

// ==================== 04 节：点景尺度与色相双对比 ====================
const s4State = { size: 8.5, color: "vermilion" };
const s4Person = $("s4-person");
const s4Shape = $("s4-person-shape");
const s4Ruler = $("s4-ruler");
const s4Rline = $("s4-rline");
const s4Rbox = $("s4-rbox");
const s4Rtxt = $("s4-rtxt");
const s4Verdict = $("s4-verdict");
const s4Vhead = $("s4-vhead");
const s4Vbody = $("s4-vbody");

const S4_COLORS = {
  vermilion: { hex: "#EE471E", name: "朱红互补" },
  teal: { hex: "#0A4A47", name: "同色深青" },
  ivory: { hex: "#FDF9F2", name: "素白提亮" },
};

function updateS4() {
  const c = S4_COLORS[s4State.color];
  s4Shape.setAttribute("fill", c.hex);
  const scale = s4State.size === 0 ? 0 : (270 * (s4State.size / 100)) / 100;
  s4Person.setAttribute("transform", `translate(468, 224) scale(${scale.toFixed(3)})`);
  s4Person.style.display = s4State.size === 0 ? "none" : "";
  s4Ruler.style.display = s4State.size === 0 ? "none" : "";

  const pxH = 270 * (s4State.size / 100);
  const topY = Math.max(24, 224 - pxH);
  s4Rline.setAttribute("y1", topY.toFixed(1));
  const boxY = clamp(topY - 6, 12, 198);
  s4Rbox.setAttribute("y", boxY.toFixed(1));
  s4Rtxt.setAttribute("y", (boxY + 15).toFixed(1));
  const ratio = s4State.size > 0 ? (128 / pxH).toFixed(1) : "—";
  s4Rtxt.textContent = `人高 ${s4State.size}% · 1:${ratio}`;

  let warn = false;
  if (s4State.size === 0) {
    warn = true;
    s4Vhead.textContent = "0% 删去参照：画面发空，山川失尺";
    s4Vbody.textContent = "没有已知身高的人物或舟楫参照时，观者只能看到几道色块轮廓，根本掂量不出眼前的湖泊与山峰究竟有多浩大。";
  } else if (s4State.size >= 30) {
    warn = true;
    s4Vhead.textContent = `${s4State.size}% 巨影抢景：湖山退化成打卡背景板`;
    s4Vbody.textContent = `山高与人高压缩到只剩 1 : ${ratio}，视线全部被大人物吸住，“以小见大”彻底反转成普通纪念人像。`;
  } else if (s4State.size >= 18) {
    warn = true;
    s4Vhead.textContent = `${s4State.size}% 偏大争主：人物开始和山峰抢戏`;
    s4Vbody.textContent = "虽还没完全毁掉空间，但观者注意力会在人和景之间反复拉扯；再缩回 4%–14% 经验甜区，山河体量会立刻翻倍。";
  } else if (s4State.color === "teal") {
    warn = true;
    s4Vhead.textContent = "尺度对了，但同色深青融进了墨岸";
    s4Vbody.textContent = "8.5% 的身高足够小，却和脚下墨青岸坡明度、色相双双撞车——缩小时必须靠互补色（朱红）或高明度反差把点景从背景里拎出来。";
  } else if (s4State.color === "ivory") {
    s4Vhead.textContent = "8.5% 素白点景：清雅可辨，暖度略轻";
    s4Vbody.textContent = "素白在深墨岸上明度反差很清晰，依然成立；但相比原海报的朱红，少了冷暖色相碰撞带来的生命温度与远距离穿透力。";
  } else {
    s4Vhead.textContent = "8.5% 朱红点景：一寸锚点撑出万仞体量";
    s4Vbody.textContent = `小人仅占画面高度约 8.5%（山人比 1 : ${ratio}），大脑自动按成年人身高反推群山体量；朱红与松黛青碧冷暖互补，再小也能瞬间抓眼。`;
  }
  s4Verdict.classList.toggle("is-warn", warn);
}

document.querySelectorAll(".s4-sz-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    s4State.size = parseFloat(btn.dataset.sz);
    document.querySelectorAll(".s4-sz-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateS4();
  });
});

document.querySelectorAll(".s4-col-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    s4State.color = btn.dataset.col;
    document.querySelectorAll(".s4-col-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateS4();
  });
});

// ==================== 05 节：容器压测与改构补救 ====================
const deviceShell = $("device-shell");
const devChrome = $("dev-chrome");
const devSvg = $("dev-svg");
const btnDevReframe = $("btn-dev-reframe");
const stressNote = $("stress-note");
const s5State = { dev: "phone", reframed: false };

function updateS5() {
  deviceShell.className = `device-shell is-${s5State.dev}${s5State.reframed ? " is-reframed" : ""}`;
  btnDevReframe.setAttribute("aria-pressed", String(s5State.reframed));
  btnDevReframe.textContent = s5State.reframed ? "还原原始 2.9:1 全景图" : "切换补救：改用局部截景 / 边角重构";

  if (s5State.reframed && s5State.dev !== "desktop") {
    // 聚焦裁切到右岸松林 + 朱红立人与一角湖山，立刻清楚耐看
    devSvg.setAttribute("viewBox", "355 72 245 148");
    devSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  } else {
    devSvg.setAttribute("viewBox", "0 0 640 220");
    devSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  if (s5State.dev === "phone") {
    devChrome.textContent = "390 × 844 · 竖屏信息流卡片";
    stressNote.textContent = s5State.reframed
      ? "补救生效：放弃硬塞全幅宽图，改切右岸松林与朱红人影的边角/截景重裁（4:3），竖屏卡片里主体和氛围重新立住了。"
      : "同一幅 2.9 : 1 原全景直接缩进手机竖屏流，画面高度只剩约 120px 细条，朱红点景人缩成几乎辨认不出的 3px 噪点。点上方按钮看看改构补救。";
  } else if (s5State.dev === "square") {
    devChrome.textContent = "1 : 1 · 方形缩略封面";
    stressNote.textContent = s5State.reframed
      ? "补救生效：用局部高对比画面填满方框，消除上下惨白空条，缩略图辨识度大幅回升。"
      : "硬塞进 1:1 方框时，要么上下留出大片空边，要么强裁两侧砍碎山势——方形缩略图天生和超宽全景相冲。";
  } else {
    devChrome.textContent = "1440 × 900 · 桌面宽屏头图";
    stressNote.textContent = "只有宽展载体（桌面横幅、画册跨页、影院银幕）才配得上全景的横向延展：层峦、水纹与极小朱红点景都能从容呼吸。";
  }
}

document.querySelectorAll(".s5-dev-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    s5State.dev = btn.dataset.dev;
    if (s5State.dev === "desktop") s5State.reframed = false;
    document.querySelectorAll(".s5-dev-btn").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    updateS5();
  });
});

btnDevReframe.addEventListener("click", () => {
  s5State.reframed = !s5State.reframed;
  updateS5();
});

// ==================== 06 节：练一练四选一 ====================
const QUIZ_COPY = {
  A: {
    ok: false,
    title: "选了 A：宽幅和雾阶都对，但点景人太大（占高 32%）",
    body: "A 犯了“大影压景”的错。朱红人物被放大到几乎和山峰平起平坐，湖山瞬间退化成旅游打卡背景布，丢了以小见大的辽阔量感。正确答案是 C。",
  },
  B: {
    ok: false,
    title: "选了 B：宽幅和小人尺度都对，但四重山塌成同一面平墙",
    body: "B 拿掉了空气透视雾阶（远近明度差仅 ΔL 0.02），远山和中景一样深重，画面扁平得像剪纸拼贴，纵深感消失。正确答案是 C。",
  },
  C: {
    ok: true,
    title: "选对了！C 同时守住了全景的三把标尺",
    body: "2.5:1 宽幅完整包住左右山势，前景深墨岸线托底、远山顺空气雾阶层层退淡，8.5% 的朱红小人落在右岸呼应左峰——宽广视野、层次空间与尺度对比缺一不可。",
  },
  D: {
    ok: false,
    title: "选了 D：雾阶和小人都对，但左右被裁成 1.25:1 窄方窗",
    body: "D 的左右山势和松林都被硬生生截断，只剩湖心一小段，失去了全景最核心的“横向延展与空间包容”。正确答案是 C。",
  },
};

const quizGrid = document.querySelector(".quiz-grid");
const quizVerdict = $("quiz-verdict");
const qvTitle = $("qv-title");
const qvBody = $("qv-body");

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const opt = card.dataset.opt;
    const res = QUIZ_COPY[opt];
    quizGrid.classList.add("is-revealed");
    document.querySelectorAll(".quiz-card").forEach((c) => {
      c.classList.remove("is-picked-ok", "is-picked-bad");
      c.setAttribute("aria-pressed", String(c === card));
    });
    card.classList.add(res.ok ? "is-picked-ok" : "is-picked-bad");
    // 选错时也轻柔标出正确答案 C
    if (!res.ok) {
      document.querySelector('.quiz-card[data-opt="C"]')?.classList.add("is-picked-ok");
    }
    quizVerdict.classList.toggle("is-ok", res.ok);
    quizVerdict.classList.toggle("is-bad", !res.ok);
    qvTitle.textContent = res.title;
    qvBody.textContent = res.body;
  });
});

// ==================== 07 节：原海报灯箱（放大 + 拖动 + Esc 关） ====================
const posterImg = $("poster");
const posterTrigger = $("poster-trigger");
const lightbox = $("lightbox");
const lbClose = $("lb-close");
const lbViewport = $("lb-viewport");
const lbImg = $("lb-img");

let lbTx = 0;
let lbTy = 0;
let lbDrag = false;
let lbStartX = 0;
let lbStartY = 0;

function setLbTransform() {
  lbImg.style.transform = `translate(${lbTx}px, ${lbTy}px)`;
}

function openLightbox() {
  // 复用同一张内联原海报，绝不重复打包
  if (!lbImg.src) lbImg.src = posterImg.src;
  lbTx = 0;
  lbTy = 0;
  setLbTransform();
  lightbox.hidden = false;
  posterTrigger.setAttribute("aria-expanded", "true");
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  posterTrigger.setAttribute("aria-expanded", "false");
  posterTrigger.focus();
}

posterTrigger.addEventListener("click", openLightbox);
lbClose.addEventListener("click", closeLightbox);
lbViewport.addEventListener("click", (e) => {
  if (e.target === lbViewport) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

lbViewport.addEventListener("pointerdown", (e) => {
  if (e.target !== lbImg) return;
  lbDrag = true;
  lbStartX = e.clientX - lbTx;
  lbStartY = e.clientY - lbTy;
  lbViewport.classList.add("is-dragging");
  lbViewport.setPointerCapture?.(e.pointerId);
});
lbViewport.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbTx = clamp(e.clientX - lbStartX, -600, 600);
  lbTy = clamp(e.clientY - lbStartY, -600, 600);
  setLbTransform();
});
lbViewport.addEventListener("pointerup", () => {
  lbDrag = false;
  lbViewport.classList.remove("is-dragging");
});
lbViewport.addEventListener("pointercancel", () => {
  lbDrag = false;
  lbViewport.classList.remove("is-dragging");
});

// ==================== 首次初始化 & 视口缩放响应 ====================
let resizeRaf = 0;
window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    refreshCanvasSize(heroCanvas, 280, 160);
    refreshCanvasSize(diagramCanvas, 240, 88);
    refreshCanvasSize(depthCanvas, 260, 160);
    heroRectCache = null;
    dirty = true;
    const ev = evaluate(state);
    drawDiagramCanvas(diagramCanvas, state, ev);
    renderDepthLab();
    heroLoop.draw();
  });
});

syncUI();
heroLoop.draw();
renderDepthLab();
updateS4();
updateS5();
