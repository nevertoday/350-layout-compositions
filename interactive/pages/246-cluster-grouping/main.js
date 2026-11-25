// 246 簇群（CLUSTER GROUPING）—— 主控与全部交互实验
import { pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  PRESETS,
  analyzeClusterState,
  clamp,
  createInitialState,
} from "./model.js";
import { mountClusterCanvas } from "./cluster-canvas.js";

let state = createInitialState();

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ==================== 开场主玩具：单真源同步 ====================
const clusterCanvas = $("#clusterCanvas");
const heroScorePill = $("#heroScorePill");
const diagBadge = $("#diagBadge");
const diagHeadline = $("#diagHeadline");
const diagDetail = $("#diagDetail");
const diagNext = $("#diagNext");
const mIntra = $("#mIntra");
const mInter = $("#mInter");
const mRatio = $("#mRatio");
const mClusters = $("#mClusters");
const intraRange = $("#intraRange");
const intraVal = $("#intraVal");
const interRange = $("#interRange");
const interVal = $("#interVal");
const pillProx = $("#pillProx");
const pillSim = $("#pillSim");
const pillCoh = $("#pillCoh");
const btnStray = $("#btnStray");
const btnOutlier = $("#btnOutlier");
const heroCssOut = $("#heroCssOut");
const titleEcho = $("#titleEcho");

let stageCtl = null;

function setText(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncHeroUI() {
  const worldMode = stageCtl ? stageCtl.getWorldMode() : "wide";
  const a = analyzeClusterState(state, worldMode);
  const { diagnosis, metrics, checks, pillars } = a;

  // 顶部状态胶囊 + 诊单（仅在内容变化时写 DOM，避免拖动期无谓重排）
  setText(heroScorePill, a.allClear ? "4 / 4 归群清晰" : `${a.score} / 4 待归群`);
  if (heroScorePill.dataset.tone !== diagnosis.statusKind) heroScorePill.dataset.tone = diagnosis.statusKind;

  setText(diagBadge, diagnosis.statusBadge);
  if (diagBadge.dataset.tone !== diagnosis.statusKind) diagBadge.dataset.tone = diagnosis.statusKind;
  setText(diagHeadline, diagnosis.headline);
  setText(diagDetail, diagnosis.detail);
  setText(diagNext, diagnosis.nextHint);

  // 单真源几何实算读数
  setText(mIntra, `${metrics.meanIntraEdge}px`);
  setText(mInter, `${metrics.minInterEdge}px`);
  setText(mRatio, `${metrics.separationRatio.toFixed(1)}×`);
  setText(mClusters, `${metrics.detectedCount} 处`);

  // 滑杆与按钮状态
  const sIntra = String(state.intraGap);
  if (intraRange.value !== sIntra) intraRange.value = sIntra;
  setText(intraVal, `${state.intraGap}px`);
  const sInter = String(state.interGap);
  if (interRange.value !== sInter) interRange.value = sInter;
  setText(interVal, `${state.interGap}px`);

  setText(pillProx, pillars.proximity.tag);
  if (pillProx.dataset.tone !== pillars.proximity.tone) pillProx.dataset.tone = pillars.proximity.tone;
  setText(pillSim, pillars.similarity.tag);
  if (pillSim.dataset.tone !== pillars.similarity.tone) pillSim.dataset.tone = pillars.similarity.tone;
  setText(pillCoh, pillars.cohesion.tag);

  setText(btnStray, checks.cohesionOk ? "拉出游离点试错" : "收拢游离点回 A");
  btnStray.classList.toggle("is-done", checks.cohesionOk);
  setText(btnOutlier, checks.outlierOk ? "吞并离群点试错" : "独立离群黑菱");
  btnOutlier.classList.toggle("is-done", checks.outlierOk);

  // 题材 / 编码 / 包络分段按钮高亮
  $$("[data-theme]").forEach((btn) => {
    const on = btn.dataset.theme === state.theme;
    if (btn.classList.contains("is-active") !== on) {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  });
  $$("[data-sim]").forEach((btn) => {
    const on = btn.dataset.sim === state.similarityMode;
    if (btn.classList.contains("is-active") !== on) {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  });
  $$("[data-frame]").forEach((btn) => {
    const on = btn.dataset.frame === state.frameMode;
    if (btn.classList.contains("is-active") !== on) {
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  });

  // 标题旁自示范微型簇群标联动
  if (titleEcho) {
    const echoIn = clamp(Math.round(state.intraGap * 0.28), 2, 10);
    const echoOut = clamp(Math.round(state.interGap * 0.34), 4, 26);
    titleEcho.style.setProperty("--echo-in", `${echoIn}px`);
    titleEcho.style.setProperty("--echo-out", `${echoOut}px`);
    titleEcho.style.borderColor = checks.gapOk ? PALETTE.ok : PALETTE.vermilion;
  }

  // 实时同源 CSS 代码
  setText(heroCssOut, a.cssCode);
}

let uiSyncTimer = 0;
let lastUiSync = 0;
function mutateState(patch, isDragging = false) {
  let changed = false;
  for (const k of Object.keys(patch)) {
    if (state[k] !== patch[k]) { changed = true; break; }
  }
  if (changed) {
    state = { ...state, ...patch };
    if (stageCtl) {
      if (reducedMotion.matches) stageCtl.draw();
      else stageCtl.markDirty();
    }
  }
  if (!isDragging) {
    if (uiSyncTimer) { clearTimeout(uiSyncTimer); uiSyncTimer = 0; }
    lastUiSync = performance.now();
    syncHeroUI();
    return;
  }
  if (!changed) return;
  // 拖动期间把下方 DOM 诊单刷新节流到 ~120ms，画布本身维持 60fps 丝滑重绘，松手立刻全量同步
  const now = performance.now();
  if (now - lastUiSync >= 120) {
    lastUiSync = now;
    syncHeroUI();
  } else if (!uiSyncTimer) {
    uiSyncTimer = setTimeout(() => {
      uiSyncTimer = 0;
      lastUiSync = performance.now();
      syncHeroUI();
    }, 120);
  }
}

stageCtl = mountClusterCanvas(clusterCanvas, () => state, mutateState);

$$("[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ theme: btn.dataset.theme }));
});

intraRange.addEventListener("input", () => {
  mutateState({ intraGap: Number(intraRange.value) });
});

interRange.addEventListener("input", () => {
  mutateState({ interGap: Number(interRange.value) });
});

btnStray.addEventListener("click", () => {
  const a = analyzeClusterState(state, stageCtl.getWorldMode());
  mutateState({
    strayDrift: a.checks.cohesionOk ? { u: 0.92, v: 0.44 } : { u: 0, v: 0 },
  });
});

btnOutlier.addEventListener("click", () => {
  const a = analyzeClusterState(state, stageCtl.getWorldMode());
  mutateState({
    outlierPull: a.checks.outlierOk ? { u: -0.92, v: 0.12 } : { u: 0, v: 0 },
  });
});

$$("[data-sim]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.sim;
    mutateState({
      similarityMode: mode,
      fixedIntruders: mode === "mixed" ? [false, false, false, false] : [true, true, true, true],
    });
  });
});

$$("[data-frame]").forEach((btn) => {
  btn.addEventListener("click", () => mutateState({ frameMode: btn.dataset.frame }));
});

$$("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.preset;
    if (PRESETS[key]) {
      state = PRESETS[key].apply(state);
      syncHeroUI();
      stageCtl.draw();
    }
  });
});

syncHeroUI();

// ==================== 01 节：点阵行列翻转 + 表单归属实验 ====================
(function initLab01() {
  const canvas = $("#proxCanvas");
  const colRange = $("#l1ColGap");
  const rowRange = $("#l1RowGap");
  const colVal = $("#l1ColVal");
  const rowVal = $("#l1RowVal");
  const readout = $("#l1Readout");
  const dotsPane = $("#l1DotsPane");
  const formPane = $("#l1FormPane");
  const formDemo = $("#l1FormDemo");
  const formReadout = $("#l1FormReadout");

  function drawDots() {
    if (!canvas || dotsPane.hidden) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colGap = Number(colRange.value);
    const rowGap = Number(rowRange.value);
    colVal.textContent = `${colGap}px`;
    rowVal.textContent = `${rowGap}px`;

    ctx.fillStyle = PALETTE.ivory;
    ctx.fillRect(0, 0, w, h);

    const cols = 6;
    const rows = 4;
    const r = Math.min(13, (w - 40 - (cols - 1) * colGap) / (cols * 2), (h - 32 - (rows - 1) * rowGap) / (rows * 2));
    const rad = Math.max(6, r);
    const totalW = cols * rad * 2 + (cols - 1) * colGap;
    const totalH = rows * rad * 2 + (rows - 1) * rowGap;
    const startX = (w - totalW) * 0.5 + rad;
    const startY = (h - totalH) * 0.5 + rad;

    const ratio = rowGap / colGap;
    // 明确形成横排或竖列时，绘出淡淡的虚线知觉包络辅助印证
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.3;
    if (ratio >= 1.45) {
      ctx.strokeStyle = "rgba(242, 78, 38, 0.55)";
      for (let ry = 0; ry < rows; ry++) {
        const y = startY + ry * (rad * 2 + rowGap);
        ctx.beginPath();
        ctx.roundRect(startX - rad - 7, y - rad - 5, totalW + 14, rad * 2 + 10, rad + 5);
        ctx.stroke();
      }
    } else if (1 / ratio >= 1.45) {
      ctx.strokeStyle = "rgba(21, 107, 83, 0.55)";
      for (let cx = 0; cx < cols; cx++) {
        const x = startX + cx * (rad * 2 + colGap);
        ctx.beginPath();
        ctx.roundRect(x - rad - 5, startY - rad - 7, rad * 2 + 10, totalH + 14, rad + 5);
        ctx.stroke();
      }
    }
    ctx.restore();

    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const x = startX + cx * (rad * 2 + colGap);
        const y = startY + ry * (rad * 2 + rowGap);
        ctx.fillStyle = ratio >= 1.45 ? PALETTE.vermilion : 1 / ratio >= 1.45 ? PALETTE.ink : "#7D6F66";
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (ratio >= 1.45) {
      readout.innerHTML = `<strong>当前读出：4 条横排（行缝是列缝的 ${ratio.toFixed(1)}×）</strong><span>横向紧、纵向宽，眼睛自然把每行 6 枚圆点打包成 4 个水平单元。</span>`;
    } else if (1 / ratio >= 1.45) {
      readout.innerHTML = `<strong>当前读出：6 条竖列（列缝是行缝的 ${(1 / ratio).toFixed(1)}×）</strong><span>完全相同的 24 枚圆点，只把列缝拉大到行缝的 1.5 倍以上，知觉瞬间翻成 6 条竖列。</span>`;
    } else {
      readout.innerHTML = `<strong>当前读出：均质格子（行缝 ${rowGap}px ≈ 列缝 ${colGap}px）</strong><span>横纵距离相差不到 1.45×，大脑抓不到明显分组方向，24 枚点退化成无结构方阵。</span>`;
    }
  }

  colRange.addEventListener("input", drawDots);
  rowRange.addEventListener("input", drawDots);
  window.addEventListener("resize", drawDots);

  $$("[data-l1mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.l1mode;
      $$("[data-l1mode]").forEach((b) => {
        const on = b.dataset.l1mode === m;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      dotsPane.hidden = m !== "dots";
      formPane.hidden = m !== "form";
      if (m === "dots") drawDots();
    });
  });

  $$("[data-l1form]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.l1form;
      $$("[data-l1form]").forEach((b) => {
        const on = b.dataset.l1form === mode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      formDemo.dataset.mode = mode;
      formReadout.innerHTML =
        mode === "bad"
          ? "<strong>错觉警告：「联系电话」夹在上下两框正中，扫视必迟疑</strong><span>标签离本框与离上框都是 14px，人眼无法用空间瞬间绑定，只能逐字校对语义。</span>"
          : "<strong>归属清晰：标签紧贴本框 5px，组间拉开 24px（4.8×）</strong><span>视线不用思考就能把每个标签和下方输入框焊死成一个独立表单单元。</span>";
    });
  });

  drawDots();
})();

// ==================== 02 节：四线索拔河台 ====================
(function initLab02() {
  const stage = $("#tugStage");
  const readout = $("#l2Readout");
  const cues = { prox: true, color: false, shape: false, region: false };

  function renderTug() {
    $$("[data-cue]").forEach((btn) => {
      const on = cues[btn.dataset.cue];
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    const grid = document.createElement("div");
    grid.className = `tug-grid${cues.prox ? " has-prox" : ""}`;

    if (cues.region) {
      const box = document.createElement("div");
      box.className = "tug-region-box";
      grid.appendChild(box);
    }

    for (let side = 0; side < 2; side++) {
      const half = document.createElement("div");
      half.className = "tug-half";
      for (let i = 0; i < 6; i++) {
        const row = i < 3 ? 0 : 1;
        const dot = document.createElement("span");
        let cls = "tug-dot";
        if (cues.shape && side === 1) cls += " is-square";
        if (cues.color) {
          cls += row === 0 ? " is-orange" : " is-pink";
        }
        dot.className = cls;
        half.appendChild(dot);
      }
      grid.appendChild(half);
    }

    stage.replaceChildren(grid);

    // 单真源诊断谁在主导或冲突
    const onList = Object.entries(cues).filter(([, v]) => v).map(([k]) => k);
    if (!onList.length) {
      readout.innerHTML = "<strong>无任何线索：12 枚均质黑点</strong><span>既没有距离差也没有外观差，眼睛只能看到一片均匀点阵。</span>";
    } else if (cues.region && cues.prox) {
      readout.innerHTML = "<strong>共同区域压过接近：中央虚线框强行切出「跨界中间组」</strong><span>虽然左右间距明明把点分成了两半，但跨在中间的浅橘虚线框硬生生把左边的尾巴和右边的开头捆成了一组——这正是 Palmer（1992）演示的共同区域效应。</span>";
    } else if (cues.region) {
      readout.innerHTML = "<strong>共同区域主导：边框内外的内外之分最先入眼</strong><span>只要画出一层封闭边界，框内 4 枚点立刻脱离其余 8 枚成为独立单元。</span>";
    } else if (cues.prox && cues.color) {
      readout.innerHTML = "<strong>线索打架：接近叫你分左右，颜色逼你分上下</strong><span>空间距离把画面劈成左右两簇，橘/粉配色却把视线横着拉成上下两行——真实 UI 里最忌讳这种跨组撞色。</span>";
    } else if (cues.prox && cues.shape) {
      readout.innerHTML = "<strong>协同合力（推荐）：接近 + 形状指向同一组边界</strong><span>左簇全是圆、右簇全是方，且中间拉出清晰留白，双线索互相印证，不画边框也零误读。</span>";
    } else if (cues.prox) {
      readout.innerHTML = "<strong>当前主导：接近分段（左右两簇）</strong><span>12 枚图形外观全同，仅凭中间宽出的留白带，视觉就稳定地把它们拆成左 6、右 6。</span>";
    } else if (cues.color && cues.shape) {
      readout.innerHTML = "<strong>双相似交叉：颜色分上下，形状分左右</strong><span>缺少间距留白时，颜色通常比纯几何轮廓更先抢走视线，上橘下粉比左圆右方更显眼。</span>";
    } else if (cues.color) {
      readout.innerHTML = "<strong>颜色相似主导：瞬间读成上橘、下粉两横排</strong><span>即使间距完全均匀，高反差色彩仍能把 12 枚点稳稳切开。</span>";
    } else {
      readout.innerHTML = "<strong>形状相似主导：左圆、右方温和归类</strong><span>轮廓差异比高饱和色彩柔和，若想让分组干脆利落，最好叠加接近间距一起使用。</span>";
    }
  }

  $$("[data-cue]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cues[btn.dataset.cue] = !cues[btn.dataset.cue];
      renderTug();
    });
  });

  $$("[data-tug]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.tug;
      if (p === "synergy") Object.assign(cues, { prox: true, color: false, shape: true, region: false });
      else if (p === "fightColor") Object.assign(cues, { prox: true, color: true, shape: false, region: false });
      else if (p === "regionOverride") Object.assign(cues, { prox: true, color: false, shape: false, region: true });
      else Object.assign(cues, { prox: false, color: false, shape: false, region: false });
      renderTug();
    });
  });

  renderTug();
})();

// ==================== 03 节：真实 DOM CSS Cluster 折行装调盒 ====================
(function initLab03() {
  const widthRange = $("#l3Width");
  const gapRange = $("#l3Gap");
  const widthVal = $("#l3WidthVal");
  const gapVal = $("#l3GapVal");
  const widthBadge = $("#l3WidthBadge");
  const rowsBadge = $("#l3Rows");
  const sandbox = $("#l3Sandbox");
  const cluster = $("#l3Cluster");
  const cssEl = $("#l3Css");
  const readout = $("#l3Readout");

  const EXTRA_POOL = [
    { label: "无媒体查询自适应", tone: "t-o" },
    { label: "视觉层级", tone: "t-p" },
    { label: "Flexbox gap", tone: "t-k" },
    { label: "接近性原则", tone: "t-o" },
    { label: "焦点留白", tone: "t-p" },
  ];

  const items = [
    { label: "设计系统", tone: "t-o" },
    { label: "布局原语", tone: "t-o" },
    { label: "簇群", tone: "t-o" },
    { label: "格式塔心理学", tone: "t-p" },
    { label: "接近性", tone: "t-p" },
    { label: "相似性", tone: "t-p" },
    { label: "语义单元", tone: "t-k" },
    { label: "离群焦点", tone: "t-k" },
  ];

  let justify = "flex-start";
  let wrap = "wrap";
  let poolIdx = 0;

  function renderClusterBox() {
    const w = Number(widthRange.value);
    const g = Number(gapRange.value);
    widthVal.textContent = `${w}px`;
    widthBadge.textContent = `容器宽 ${w}px`;
    gapVal.textContent = `${g}px`;

    sandbox.style.width = `${w}px`;
    sandbox.classList.toggle("is-nowrap-err", wrap === "nowrap");
    cluster.style.gap = `${g}px`;
    cluster.style.justifyContent = justify;
    cluster.style.flexWrap = wrap;

    cluster.replaceChildren(
      ...items.map((it) => {
        const span = document.createElement("span");
        span.className = `rc-item ${it.tone}`;
        span.textContent = it.label;
        return span;
      })
    );

    // 真实量测折行行数与是否溢出
    requestAnimationFrame(() => {
      const tops = new Set([...cluster.children].map((el) => Math.round(el.offsetTop / 6)));
      const overflowPx = Math.max(0, Math.round(cluster.scrollWidth - cluster.clientWidth));
      rowsBadge.textContent = overflowPx > 2 ? `横向溢出 +${overflowPx}px` : `实测折行：${tops.size} 行`;

      const isErr = wrap === "nowrap" && overflowPx > 2;
      readout.classList.toggle("is-err", isErr);
      if (isErr) {
        readout.innerHTML = `<strong>翻车实测：关掉 flex-wrap 后横向撑爆 +${overflowPx}px</strong><span>右边标签被硬生生裁在容器之外，这就是忘记写 <code class="dark-code">flex-wrap: wrap</code> 的典型后果。</span>`;
      } else if (g < 6) {
        readout.innerHTML = `<strong>间距过窄（${g}px）：胶囊几乎贴边</strong><span>建议保持在 8–16px 之间，避免手指触控相邻标签时误点。</span>`;
      } else {
        readout.innerHTML = `<strong>自适应折行正常：当前 ${tops.size} 行，零媒体查询</strong><span>不论怎么拉宽缩窄或增删长短标签，元素都像段落里的词一样自动换行，且 <code class="dark-code">gap</code> 不漏到外缘。</span>`;
      }
    });

    cssEl.textContent = [
      ".cluster {",
      "  display: flex;",
      `  flex-wrap: ${wrap};${wrap === "nowrap" ? " /* 警告：窄容器将溢出 */" : ""}`,
      `  gap: ${g}px;`,
      `  justify-content: ${justify};`,
      "  align-items: center;",
      "}",
    ].join("\n");
  }

  widthRange.addEventListener("input", renderClusterBox);
  gapRange.addEventListener("input", renderClusterBox);
  window.addEventListener("resize", renderClusterBox);

  $$("[data-l3just]").forEach((btn) => {
    btn.addEventListener("click", () => {
      justify = btn.dataset.l3just;
      $$("[data-l3just]").forEach((b) => {
        const on = b.dataset.l3just === justify;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderClusterBox();
    });
  });

  $$("[data-l3wrap]").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap = btn.dataset.l3wrap;
      $$("[data-l3wrap]").forEach((b) => {
        const on = b.dataset.l3wrap === wrap;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderClusterBox();
    });
  });

  $("#l3Add").addEventListener("click", () => {
    if (items.length < 13) {
      items.push(EXTRA_POOL[poolIdx % EXTRA_POOL.length]);
      poolIdx++;
      renderClusterBox();
    }
  });

  $("#l3Remove").addEventListener("click", () => {
    if (items.length > 3) {
      items.pop();
      renderClusterBox();
    }
  });

  renderClusterBox();
})();

// ==================== 04 节：簇群套簇群页眉 X 光剖视 ====================
(function initLab04() {
  const widthRange = $("#l4Width");
  const widthVal = $("#l4WidthVal");
  const viewport = $("#l4Viewport");
  const note = $("#l4Note");

  const XRAY_NOTES = {
    all: "三层同时透视：外层黑框主簇设 28px 宽间距并两端分布，内部朱橘导航簇（10px）与翡翠青动作簇（8px）各自紧抱成团，缩小屏宽时整簇折行绝不拆散。",
    outer: "只看外层主簇：把「品牌」「导航整组」「动作整组」当成 3 个一级子项，用 space-between 和 28px 大缝把它们稳稳拉开。",
    nav: "只看导航子簇：四条页面链接用 10px 紧缝聚成一个导航单元，宽屏排一行、极窄屏内部才自然换行。",
    actions: "只看动作子簇：「登录」与「开始使用」紧守 8px 缝距，始终成对出现在一起，不会跟导航链接混为一谈。",
  };

  let curXray = "all";

  function syncNested() {
    const w = Number(widthRange.value);
    viewport.style.width = `${w}px`;
    const tier = w >= 660 ? "桌面单行" : w >= 440 ? "平板双行" : "窄屏整簇折排";
    widthVal.textContent = `${w}px（${tier}）`;
    viewport.dataset.xray = curXray;
    note.textContent = XRAY_NOTES[curXray];
  }

  widthRange.addEventListener("input", syncNested);
  $$("[data-xray]").forEach((btn) => {
    btn.addEventListener("click", () => {
      curXray = btn.dataset.xray;
      $$("[data-xray]").forEach((b) => {
        const on = b.dataset.xray === curXray;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      syncNested();
    });
  });

  syncNested();
})();

// ==================== 05 节：反例急诊室翻牌对照 ====================
(function initLab05() {
  const titleEl = $("#l5Title");
  const preview = $("#l5Preview");
  const explain = $("#l5Explain");

  const CASES = {
    tagsWall: {
      title: "24 枚频道标签塞进簇群，手机首屏被折成六行胶囊墙",
      badHtml: `<div class="cp-tags-bad">${["全部", "视觉系统", "平面海报", "网页原语", "字体排印", "网格比例", "色彩搭配", "动效节奏", "无障碍", "移动端", "信息架构", "数据图表", "编辑出版", "品牌识别", "包装结构", "导视系统", "展览空间", "交互反馈"].map((t, i) => `<span class="cp-pill${i === 0 ? " is-hot" : ""}">${t}</span>`).join("")}</div>`,
      goodHtml: `<div class="cp-tags-reel">${["全部", "视觉系统", "平面海报", "网页原语", "字体排印", "网格比例", "色彩搭配", "动效节奏", "无障碍", "移动端", "信息架构", "数据图表"].map((t, i) => `<span class="cp-pill${i === 0 ? " is-hot" : ""}">${t}</span>`).join("")}</div>`,
      badText: "<strong>翻车原因：</strong>簇群默认遇到边界就往下折行。频道一旦超过十几个，整个顶部筛选条会膨胀成一面高墙，把正文全部挤出首屏。",
      goodText: '<strong>换对方案：</strong>需要锁死单行高度的横向分类条，改用 <a href="https://layout.xiaoxiaodong.ai/252/play/" target="_blank" rel="noopener">252 横向卷轴</a>（单行横滑 + 右缘露半截暗示可滚），保住首屏内容面积。',
    },
    specTable: {
      title: "商品参数卡片硬用簇群，每行宽窄不一、列线全乱",
      badHtml: `<div class="cp-cards-bad"><div class="cp-card"><strong>极简台灯</strong><span>¥299</span></div><div class="cp-card"><strong>不锈钢手冲咖啡壶（温控版）</strong><span>¥689</span></div><div class="cp-card"><strong>橡木托盘</strong><span>¥149</span></div><div class="cp-card"><strong>粗陶马克杯</strong><span>¥89</span></div><div class="cp-card"><strong>双层玻璃冷萃壶（1.2L 家庭装）</strong><span>¥239</span></div></div>`,
      goodHtml: `<div class="cp-cards-grid"><div class="cp-card"><strong>极简台灯</strong><span>¥299</span></div><div class="cp-card"><strong>温控手冲壶</strong><span>¥689</span></div><div class="cp-card"><strong>橡木托盘</strong><span>¥149</span></div><div class="cp-card"><strong>粗陶马克杯</strong><span>¥89</span></div><div class="cp-card"><strong>双层冷萃壶</strong><span>¥239</span></div><div class="cp-card"><strong>帆布隔热垫</strong><span>¥59</span></div></div>`,
      badText: "<strong>翻车原因：</strong>簇群按每个元素自身内容宽排布，标题长短不同会让上下两行卡片边缘完全对不齐，眼睛扫价格时来回跳动。",
      goodText: '<strong>换对方案：</strong>需要横向比较的卡片矩阵，改用 <a href="https://layout.xiaoxiaodong.ai/250/play/" target="_blank" rel="noopener">250 自适应网格原语</a>（CSS Grid <code class="inline-code">auto-fit</code> 等宽轨道），列线齐整利落。',
    },
    fakeGroup: {
      title: "把毫无关联的高危与低频操作挤成一簇（伪归组）",
      badHtml: `<div class="cp-cta-bad"><span class="cp-btn">查看隐私条款</span><span class="cp-btn is-danger">永久注销账号</span><span class="cp-btn">切换语言</span><span class="cp-btn">保存修改</span></div>`,
      goodHtml: `<div class="cp-cta-good"><div class="cp-cta-grp"><span class="cp-btn">查看隐私条款</span><span class="cp-btn">切换语言</span></div><div class="cp-cta-grp"><span class="cp-btn">保存修改</span></div><div class="cp-cta-grp"><span class="cp-btn is-danger">永久注销账号</span></div></div>`,
      badText: "<strong>翻车原因：</strong>四个按钮靠得一样紧，用户刚想点「保存修改」或「切换语言」，手指一偏就撞上「永久注销账号」，空间接近制造了危险错觉。",
      goodText: "<strong>换对方案：</strong>先按业务语义分家——把低频辅助项收一簇、主提交独立，再把不可逆的危险操作拉远放成孤立离群区。",
    },
    verticalDoc: {
      title: "正文段落强行横排进簇群，阅读视线左右乱窜",
      badHtml: `<div class="cp-doc-bad"><p class="cp-para">第一段：先交代实验背景与约束条件。</p><p class="cp-para">第二段：再展开三组实测数据对比。</p><p class="cp-para">第三段：最后给出工程落地建议。</p></div>`,
      goodHtml: `<div class="cp-doc-stack"><p class="cp-para">第一段：先交代实验背景与约束条件。</p><p class="cp-para">第二段：再展开三组实测数据对比。</p><p class="cp-para">第三段：最后给出工程落地建议。</p></div>`,
      badText: "<strong>翻车原因：</strong>连续叙述的段落本应自上而下阅读；塞进横向折行的簇群后，宽度稍一变化就会时而并排、时而错落，打断阅读节奏。",
      goodText: '<strong>换对方案：</strong>纯纵向线性内容直接交给 <a href="https://layout.xiaoxiaodong.ai/243/play/" target="_blank" rel="noopener">243 堆栈</a>，配 <a href="https://layout.xiaoxiaodong.ai/245/play/" target="_blank" rel="noopener">245 居中器</a> 控好行宽。',
    },
  };

  let curCase = "tagsWall";
  let curView = "bad";

  function renderClinic() {
    const c = CASES[curCase];
    titleEl.textContent = c.title;
    preview.innerHTML = curView === "bad" ? c.badHtml : c.goodHtml;
    explain.innerHTML = curView === "bad" ? c.badText : c.goodText;
  }

  $$(".clinic-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      curCase = btn.dataset.case;
      $$(".clinic-tab").forEach((b) => {
        const on = b.dataset.case === curCase;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      renderClinic();
    });
  });

  $$("[data-l5view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      curView = btn.dataset.l5view;
      $$("[data-l5view]").forEach((b) => {
        const on = b.dataset.l5view === curView;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderClinic();
    });
  });

  renderClinic();
})();

// ==================== 06 节：单变量眼力小练习 ====================
(function initQuiz() {
  const box = $("#quizBox");
  const fb = $("#quizFeedback");
  const opts = $$(".quiz-opt");

  const EXPLANATIONS = {
    A: {
      ok: false,
      title: "选了方案 A —— 再细看组间那道缝",
      body: "方案 A 把组内和组间全设成 18px（比值 1.0×）。虽然颜色区分了标签和按钮，但距离完全相等，五枚胶囊排成一条均匀长龙，缺少一眼切开两簇的呼吸沟道。正确答案是方案 B（组内 8px · 组间 34px，4.3×）。",
    },
    B: {
      ok: true,
      title: "判断精准！方案 B 最容易一眼分清两簇",
      body: "方案 B 组内仅 8px、组间拉开到 34px（4.3×）：左侧三枚标签紧聚成「分类簇」，右侧两枚按钮紧聚成「操作簇」，不用画一根竖线或套大框，两组关系立刻一目了然，同时 8px 缝距也保住了手指点击安全区。",
    },
    C: {
      ok: false,
      title: "选了方案 C —— 典型的「内松外紧倒挂」",
      body: "方案 C 组内松到 24px，组间却挤成 7px（比值 0.3×）。结果最右边那枚标签「网格」反而紧紧贴着「收藏」，眼睛会先把它和按钮绑成一组。正确答案是方案 B（组内 8px · 组间 34px）。",
    },
    D: {
      ok: false,
      title: "选了方案 D —— 组间拉开了，但组内挤爆了",
      body: "方案 D 组间 28px 方向没错，但组内压到了 2px：三枚标签和两枚按钮几乎贴边相撞，轮廓发闷、触屏极易误点。接近性讲究「组内比组间紧」，不是把组内压到零。正确答案是方案 B（组内 8px · 组间 34px）。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.opt;
      const info = EXPLANATIONS[choice];
      box.classList.add("is-revealed");

      opts.forEach((b) => {
        const id = b.dataset.opt;
        const meta = $(".qo-meta", b);
        if (meta) meta.hidden = false;
        b.setAttribute("aria-pressed", String(id === choice));
        b.classList.remove("is-picked-ok", "is-picked-err", "is-correct-reveal");
        if (id === choice) b.classList.add(info.ok ? "is-picked-ok" : "is-picked-err");
        else if (id === "B") b.classList.add("is-correct-reveal");
      });

      fb.hidden = false;
      fb.classList.toggle("is-wrong", !info.ok);
      fb.innerHTML = `<strong>${info.title}</strong><span>${info.body}</span>`;
    });
  });
})();

// ==================== 07 节：原海报放大灯箱（拖、缩放、Esc 关） ====================
(function initLightbox() {
  const openBtn = $("#posterOpenBtn");
  const posterImg = $("#poster");
  const lb = $("#posterLightbox");
  const lbImg = $("#lbImg");
  const lbStage = $("#lbStage");
  const btnIn = $("#lbZoomIn");
  const btnOut = $("#lbZoomOut");
  const btnReset = $("#lbZoomReset");
  const btnClose = $("#lbClose");

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    btnReset.textContent = `${Math.round(zoom * 100)}%`;
  }

  function openLightbox() {
    lbImg.src = posterImg.src;
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLightbox);
  btnClose.addEventListener("click", closeLightbox);
  btnIn.addEventListener("click", () => {
    zoom = clamp(zoom + 0.35, 0.7, 3.5);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    zoom = clamp(zoom - 0.35, 0.7, 3.5);
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    zoom = clamp(zoom + delta, 0.7, 3.5);
    if (zoom <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage && zoom <= 1) {
      closeLightbox();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    try { lbStage.setPointerCapture(e.pointerId); } catch {}
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbStage.addEventListener("pointerup", () => { panning = false; });
  lbStage.addEventListener("pointercancel", () => { panning = false; });

  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") closeLightbox();
  });
})();
