// 290 分层导航布局 · 主控入口
// 将 model.js 单真源状态同步到首屏活体六层档案夹（L1–L6）、L4 切面画布与正文七节。
import {
  PRESETS,
  SITES,
  createInitialState,
  evaluate,
} from "./model.js";
import { mountHeroCanvas } from "./hero-canvas.js";
import {
  mountDepthTree,
  mountEraTimeline,
  mountPosterLightbox,
  mountQuiz,
  mountResponsiveLab,
  mountScenarioDeck,
  mountWeightMatrix,
} from "./figures.js";

const state = createInitialState();

// DOM 引用
const stackEl = document.getElementById("folder-stack");
const statusChip = document.getElementById("hero-status");
const trunkBtn = document.getElementById("trunk-btn");
const siteBtns = [...document.querySelectorAll("[data-site]")];

const l1Row = document.getElementById("layer-l1");
const l2Row = document.getElementById("layer-l2");
const l3Row = document.getElementById("layer-l3");
const l4Row = document.getElementById("layer-l4");
const l5Row = document.getElementById("layer-l5");
const l6Row = document.getElementById("layer-l6");

const crumbList = document.getElementById("l1-crumbs");
const l1FaultBtn = document.getElementById("l1-fault-btn");
const l2Nav = document.getElementById("l2-nav");
const l2FaultBtn = document.getElementById("l2-fault-btn");
const l3Nav = document.getElementById("l3-nav");
const l5Tabs = document.getElementById("l5-tabs");

const pillarLevel = document.getElementById("pillar-level");
const pillarPath = document.getElementById("pillar-path");
const pillarOrient = document.getElementById("pillar-orient");

const l6Title = document.getElementById("l6-current-title");
const l6Code = document.getElementById("l6-current-code");
const l6Verdict = document.getElementById("l6-verdict");
const l6Headline = document.getElementById("l6-headline");
const l6Why = document.getElementById("l6-why");
const l6Next = document.getElementById("l6-next");
const l6FixBtn = document.getElementById("l6-fix-btn");
const l6ContentNote = document.getElementById("l6-content-note");
const trunkPanel = document.getElementById("trunk-panel");
const trunkList = document.getElementById("trunk-list");
const trunkScoreEl = document.getElementById("trunk-score");
const l6Metrics = document.getElementById("l6-metrics");

const flowStrip = document.getElementById("hero-flow");
const heroCanvas = document.getElementById("hero-canvas");

const orderBtns = [...document.querySelectorAll("[data-set-order]")];
const crumbBtns = [...document.querySelectorAll("[data-set-crumb]")];
const orientBtns = [...document.querySelectorAll("[data-set-orient]")];
const weightBtns = [...document.querySelectorAll("[data-set-weight]")];
const presetBtns = [...document.querySelectorAll("[data-preset]")];

function makeEl(tag, attrs = {}, text = "") {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === "class") n.className = v;
    else n.setAttribute(k, String(v));
  }
  if (text) n.textContent = text;
  return n;
}

let canvasCtrl = null;
let lastScrubSig = "";

function scrubSig() {
  const ev = evaluate(state, 720);
  return `${ev.prof.zone}|${ev.prof.navTierCount}|${ev.chromePx}|${ev.verdict}`;
}

function renderHero() {
  lastScrubSig = scrubSig();
  const ev = evaluate(state, 720);

  // 顶栏站点切换与总状态签
  siteBtns.forEach((b) => {
    const on = b.dataset.site === state.site;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  });
  statusChip.textContent = ev.verdict;
  statusChip.dataset.ok = String(ev.allOk);

  trunkBtn.setAttribute("aria-pressed", String(state.trunkTest));
  trunkBtn.classList.toggle("is-active", state.trunkTest);

  // 1. 驱动真实叠层顺序与视觉权重类（单真源！）
  stackEl.dataset.order = state.order;
  stackEl.dataset.weight = state.weightMode;
  stackEl.dataset.depthZone = ev.prof.zone;
  stackEl.dataset.ok = String(ev.allOk);
  heroCanvas.setAttribute("aria-valuenow", String(Math.round(state.depthSpan * 100)));

  // 控制各层物理顺序（CSS flex order 真实反映层序倒置/错位）
  if (state.order === "inverted") {
    l1Row.style.order = "1";
    l5Row.style.order = "2";
    l2Row.style.order = "3";
    l3Row.style.order = "4";
    l4Row.style.order = "5";
    l6Row.style.order = "6";
  } else if (state.order === "swapped") {
    l1Row.style.order = "1";
    l3Row.style.order = "2";
    l2Row.style.order = "3";
    l4Row.style.order = "4";
    l5Row.style.order = "5";
    l6Row.style.order = "6";
  } else {
    l1Row.style.order = "1";
    l2Row.style.order = "2";
    l3Row.style.order = "3";
    l4Row.style.order = "4";
    l5Row.style.order = "5";
    l6Row.style.order = "6";
  }

  // 根据深度区显隐次导航 L3 / 分区 L5（单栏扁平时折叠 L3/L5，轻量两层时折叠 L3）
  l1Row.classList.toggle("is-hidden-layer", state.crumbMode === "none");
  l3Row.classList.toggle("is-hidden-layer", !ev.prof.showL3);
  l5Row.classList.toggle("is-hidden-layer", !ev.prof.showL5);

  // 左侧 L1–L6 轨道实况签
  for (const id of ["L1", "L2", "L3", "L4", "L5", "L6"]) {
    const badge = document.getElementById(`rail-${id.toLowerCase()}`);
    if (badge) {
      const info = ev.railStatus[id];
      badge.textContent = info.text;
      badge.dataset.bad = String(info.bad);
    }
  }

  // 2. L1 路径层（真实可点回跳面包屑）
  crumbList.textContent = "";
  if (state.crumbMode === "none") {
    crumbList.append(
      makeEl("li", { class: "crumb-empty" }, "路径层已隐藏 · 深层空降失去归属链")
    );
  } else {
    ev.crumbs.forEach((c, idx) => {
      const li = makeEl("li", { class: "crumb-item" });
      if (c.current) {
        li.append(
          makeEl(
            "span",
            { class: "crumb-current", "aria-current": "page" },
            c.label
          )
        );
      } else {
        const btn = makeEl(
          "button",
          {
            type: "button",
            class: `crumb-btn${c.mismatch ? " is-mismatch" : ""}`,
          },
          c.label
        );
        btn.addEventListener("click", () => {
          // 点击结构面包屑真实回到对应层级起点
          if (state.crumbMode === "location") {
            if (c.level <= 1) {
              state.l2 = 0;
              state.l3 = 0;
              state.l5 = 0;
            } else if (c.level === 2) {
              state.l3 = 0;
              state.l5 = 0;
            } else if (c.level === 3) {
              state.l5 = 0;
            }
          } else {
            // 历史脱节模式下点击错位节点会把你跳去无关分支，亲身感受历史面包屑之痛
            state.l2 = 3;
            state.l3 = 3;
            state.l5 = 0;
          }
          renderHero();
        });
        li.append(btn);
      }
      if (idx < ev.crumbs.length - 1) {
        li.append(makeEl("span", { class: "crumb-sep", "aria-hidden": "true" }, "›"));
      }
      crumbList.append(li);
    });
  }

  // L1 就地纠错签
  if (state.crumbMode !== "location") {
    l1FaultBtn.hidden = false;
    l1FaultBtn.textContent = state.crumbMode === "history" ? "× 历史脱节 · 点同步" : "× 路径缺失 · 点开启";
  } else if (state.weightMode === "inverted") {
    l1FaultBtn.hidden = false;
    l1FaultBtn.textContent = "× 面包屑喧宾 · 点降权";
  } else {
    l1FaultBtn.hidden = true;
  }

  // 3. L2 主导航层（真实级联；过扁时塞入 16 个平权项直接演示拥挤灾难！）
  l2Nav.textContent = "";
  const isFlat = ev.prof.zone === "flat";
  l2Nav.classList.toggle("is-flat-dump", isFlat);

  if (isFlat) {
    // 把当前站点全部 4×4 = 16 个专题一次性倒进 L2，亲眼见证无分组拥挤
    ev.site.l2.forEach((m, mi) => {
      m.l3.forEach((sub, si) => {
        const isCurrent = mi === state.l2 && si === state.l3;
        const active =
          state.orientMode === "single"
            ? isCurrent
            : state.orientMode === "double"
            ? isCurrent || (mi === (state.l2 + 1) % 4 && si === 0)
            : false;
        const btn = makeEl(
          "button",
          {
            type: "button",
            class: `l2-flat-item${active ? " is-active" : ""}`,
            "aria-current": active ? "page" : undefined,
          },
          sub.label
        );
        btn.addEventListener("click", () => {
          state.l2 = mi;
          state.l3 = si;
          state.l5 = 0;
          renderHero();
        });
        l2Nav.append(btn);
      });
    });
  } else {
    ev.site.l2.forEach((m, idx) => {
      const decoy = (state.l2 + 2) % ev.site.l2.length;
      const active =
        state.orientMode === "single"
          ? idx === state.l2
          : state.orientMode === "double"
          ? idx === state.l2 || idx === decoy
          : false;
      const btn = makeEl(
        "button",
        {
          type: "button",
          class: `l2-item${active ? " is-active" : ""}`,
          "aria-current": active ? "true" : undefined,
        },
        m.label
      );
      btn.addEventListener("click", () => {
        state.l2 = idx;
        state.l3 = 0;
        state.l5 = 0;
        renderHero();
      });
      l2Nav.append(btn);
    });
  }

  // L2 就地纠错签
  if (state.order !== "cascade") {
    l2FaultBtn.hidden = false;
    l2FaultBtn.textContent = "× 层序倒置 · 点归位";
  } else if (state.orientMode !== "single") {
    l2FaultBtn.hidden = false;
    l2FaultBtn.textContent = state.orientMode === "none" ? "× 定位失标 · 点亮" : "× 双项抢亮 · 留唯一";
  } else {
    l2FaultBtn.hidden = true;
  }

  // 4. L3 次导航层（真实随 L2 级联刷新）
  l3Nav.textContent = "";
  ev.l2Node.l3.forEach((sub, idx) => {
    const decoy = (state.l3 + 1) % ev.l2Node.l3.length;
    const active =
      state.orientMode === "single"
        ? idx === state.l3
        : state.orientMode === "double"
        ? idx === state.l3 || idx === decoy
        : false;
    const btn = makeEl(
      "button",
      {
        type: "button",
        class: `l3-item${active ? " is-active" : ""}`,
        "aria-current": active ? "true" : undefined,
      },
      sub.label
    );
    btn.addEventListener("click", () => {
      state.l3 = idx;
      state.l5 = 0;
      renderHero();
    });
    l3Nav.append(btn);
  });

  // 5. L4 墨绿主柜内三柱实况（对应原海报 层级 / 路径 / 定位）
  pillarLevel.textContent = ev.pillars.level.tag;
  pillarLevel.dataset.ok = String(ev.pillars.level.ok);
  pillarPath.textContent = ev.pillars.path.tag;
  pillarPath.dataset.ok = String(ev.pillars.path.ok);
  pillarOrient.textContent = ev.pillars.orient.tag;
  pillarOrient.dataset.ok = String(ev.pillars.orient.ok);

  // 6. L5 切角牛皮纸分区耳签（真实随 L3 级联刷新）
  l5Tabs.textContent = "";
  ev.l3Node.l5.forEach((sec, idx) => {
    const decoy = (state.l5 + 1) % ev.l3Node.l5.length;
    const active =
      state.orientMode === "single"
        ? idx === state.l5
        : state.orientMode === "double"
        ? idx === state.l5 || idx === decoy
        : false;
    const btn = makeEl("button", {
      type: "button",
      class: `l5-tab${active ? " is-active" : ""}`,
      "aria-selected": String(active),
    });
    btn.append(
      makeEl("span", { class: "l5-code", lang: "en" }, sec.code),
      makeEl("span", { class: "l5-name" }, sec.title)
    );
    btn.addEventListener("click", () => {
      state.l5 = idx;
      renderHero();
    });
    l5Tabs.append(btn);
  });

  // 7. L6 深咖内容详情与单真源诊单
  l6Title.textContent = `当前内容：${ev.l5Node.title}`;
  l6Code.textContent = ev.l5Node.code;
  l6ContentNote.textContent = ev.l5Node.summary;

  l6Verdict.textContent = ev.verdict;
  l6Verdict.dataset.ok = String(ev.allOk);
  l6Headline.textContent = ev.headline;
  l6Why.textContent = ev.why;
  l6Next.textContent = ev.nextHint;

  if (ev.primaryFault && ev.primaryFault.action) {
    l6FixBtn.hidden = false;
    l6FixBtn.textContent = `一步校准：${ev.primaryFault.action.label}`;
    l6FixBtn.dataset.fixKey = ev.primaryFault.action.key;
    l6FixBtn.dataset.fixVal = String(ev.primaryFault.action.value);
  } else {
    l6FixBtn.hidden = true;
  }

  l6Metrics.textContent = `导航 ${ev.chromePx}px (${ev.chromePct}%) · 正文 ${ev.contentPct}% · 后备箱 ${ev.trunkScore}/6`;

  // 后备箱空降测验面板
  trunkPanel.hidden = !state.trunkTest;
  if (state.trunkTest) {
    trunkScoreEl.textContent = `${ev.trunkScore}/6 项答清`;
    trunkScoreEl.dataset.ok = String(ev.trunkScore === 6);
    trunkList.textContent = "";
    ev.trunkChecks.forEach((chk) => {
      const li = makeEl("li", { class: `trunk-item${chk.ok ? " is-ok" : " is-fail"}` });
      li.append(
        makeEl("span", { class: "trunk-mark", "aria-hidden": "true" }, chk.ok ? "✓" : "×"),
        makeEl("span", { class: "trunk-q" }, chk.q),
        makeEl("span", { class: "trunk-note" }, chk.note)
      );
      trunkList.append(li);
    });
  }

  // 同步四项装调按钮高亮
  orderBtns.forEach((b) => {
    const on = b.dataset.setOrder === state.order;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  });
  crumbBtns.forEach((b) => {
    const on = b.dataset.setCrumb === state.crumbMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  });
  orientBtns.forEach((b) => {
    const on = b.dataset.setOrient === state.orientMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  });
  weightBtns.forEach((b) => {
    const on = b.dataset.setWeight === state.weightMode;
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-active", on);
  });

  // 8. 底部原海报五步路径链
  flowStrip.textContent = "";
  ev.flowSteps.forEach((st, idx) => {
    const item = makeEl("div", { class: `flow-step${st.ok ? " is-lit" : ""}` });
    item.append(
      makeEl("span", { class: "flow-dot", "aria-hidden": "true" }),
      makeEl("span", { class: "flow-zh" }, st.zh),
      makeEl("span", { class: "flow-en", lang: "en" }, st.en)
    );
    flowStrip.append(item);
    if (idx < ev.flowSteps.length - 1) {
      flowStrip.append(makeEl("span", { class: "flow-arrow", "aria-hidden": "true" }, "→"));
    }
  });

  canvasCtrl?.draw();
}

// ---------- 事件绑定 ----------
siteBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.site = b.dataset.site;
    state.l2 = 1;
    state.l3 = 1;
    state.l5 = 2;
    renderHero();
  })
);

trunkBtn.addEventListener("click", () => {
  state.trunkTest = !state.trunkTest;
  if (state.trunkTest) {
    // 模拟从搜索引擎随机空降到一个深层页面（非当前项）
    const nextL2 = (state.l2 + 1) % 4;
    const nextL3 = (state.l3 + 2) % 4;
    const nextL5 = (state.l5 + 1) % 4;
    state.l2 = nextL2;
    state.l3 = nextL3;
    state.l5 = nextL5;
  }
  renderHero();
});

l1FaultBtn.addEventListener("click", () => {
  if (state.crumbMode !== "location") state.crumbMode = "location";
  else if (state.weightMode === "inverted") state.weightMode = "stepped";
  renderHero();
});

l2FaultBtn.addEventListener("click", () => {
  if (state.order !== "cascade") state.order = "cascade";
  else if (state.orientMode !== "single") state.orientMode = "single";
  renderHero();
});

l6FixBtn.addEventListener("click", () => {
  const k = l6FixBtn.dataset.fixKey;
  const v = l6FixBtn.dataset.fixVal;
  if (!k) return;
  state[k] = k === "depthSpan" ? Number(v) : v;
  renderHero();
});

orderBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.order = b.dataset.setOrder;
    renderHero();
  })
);
crumbBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.crumbMode = b.dataset.setCrumb;
    renderHero();
  })
);
orientBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.orientMode = b.dataset.setOrient;
    renderHero();
  })
);
weightBtns.forEach((b) =>
  b.addEventListener("click", () => {
    state.weightMode = b.dataset.setWeight;
    renderHero();
  })
);
presetBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    Object.assign(state, p.patch);
    renderHero();
  })
);

// 挂载 L4 切面画布与正文七节交互
canvasCtrl = mountHeroCanvas(
  heroCanvas,
  () => state,
  (nextDepth) => {
    state.depthSpan = nextDepth;
    heroCanvas.setAttribute("aria-valuenow", String(Math.round(nextDepth * 100)));
    const sig = scrubSig();
    if (sig !== lastScrubSig) {
      renderHero();
    } else {
      canvasCtrl?.draw();
    }
  }
);

renderHero();
mountDepthTree();
mountWeightMatrix();
mountEraTimeline();
mountResponsiveLab();
mountScenarioDeck();
mountQuiz();
mountPosterLightbox();
