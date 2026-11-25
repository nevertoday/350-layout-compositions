// 正文 01–07 节全部互动组件 + 原海报灯箱（零外部依赖，数据来自 model.js 单真源）
import {
  ERAS,
  QUIZ,
  SCENARIOS,
  TREE_CONFIGS,
  VIEWPORT_MODES,
  WEIGHT_SCHEMES,
} from "./model.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === "class") node.className = v;
    else node.setAttribute(k, String(v));
  }
  if (text) node.textContent = text;
  return node;
}

function svgEl(tag, attrs = {}, text = "") {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    node.setAttribute(k, String(v));
  }
  if (text) node.textContent = text;
  return node;
}

// ---------- 01 节：64 节点宽深推演树（SVG + 滑块） ----------
export function mountDepthTree() {
  const slider = document.getElementById("tree-slider");
  const svg = document.getElementById("tree-svg");
  const formulaEl = document.getElementById("tree-formula");
  const tierEl = document.getElementById("tree-tier");
  const clicksEl = document.getElementById("tree-clicks");
  const perScreenEl = document.getElementById("tree-perscreen");
  const chromeEl = document.getElementById("tree-chrome");
  const scentEl = document.getElementById("tree-scent");
  const descEl = document.getElementById("tree-desc");
  const presetBtns = [...document.querySelectorAll("[data-tree-idx]")];
  if (!slider || !svg) return;

  function draw(idx) {
    const cfg = TREE_CONFIGS[idx] || TREE_CONFIGS[2];
    slider.value = String(idx);
    formulaEl.textContent = cfg.formula;
    tierEl.textContent = cfg.tier;
    tierEl.dataset.tone = cfg.tone;
    clicksEl.textContent = `${cfg.clicks} 步`;
    perScreenEl.textContent = `${cfg.perScreen} 项/屏`;
    chromeEl.textContent = `${cfg.chromePct}%`;
    scentEl.textContent = cfg.scent;
    descEl.textContent = cfg.desc;

    presetBtns.forEach((b) => {
      const on = Number(b.dataset.treeIdx) === idx;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });

    // 绘制清晰的 64 节点结构树（根 -> 中间分支 -> 64 叶子压缩带）
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const W = 680;
    const H = 264;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // 淡背景纸格
    svg.append(svgEl("rect", { x: 0, y: 0, width: W, height: H, fill: "#F8F2E6" }));

    const levels = cfg.depth;
    const padTop = 28;
    const padBot = 36;
    const dy = levels === 1 ? 148 : (H - padTop - padBot) / levels;

    // 根节点
    const rootX = W / 2;
    const rootY = padTop;

    const accent =
      cfg.tone === "good" ? "#0D3B2B" : cfg.tone === "warn" ? "#9C5200" : "#B02318";
    const softAccent =
      cfg.tone === "good" ? "#C5D8CD" : cfg.tone === "warn" ? "#EBD8B5" : "#F0C5BC";

    // 计算每一层代表性节点坐标（展示真实分支形态而不挤成黑坨）
    let prev = [{ x: rootX, y: rootY, active: true }];

    for (let lv = 0; lv < levels; lv++) {
      const y = Math.round(padTop + (lv + 1) * dy);
      const isLast = lv === levels - 1;
      const branch = cfg.shape[lv];
      const next = [];

      if (levels === 1) {
        // 1 层 × 64 项：画两排共 64 个紧挤小点，直观感受单屏扫描压力
        const cols = 32;
        const margin = 36;
        const stepX = (W - margin * 2) / (cols - 1);
        for (let i = 0; i < 64; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const nx = margin + col * stepX;
          const ny = y - 16 + row * 28;
          if (i % 4 === 0 || i === 38) {
            svg.append(
              svgEl("line", {
                x1: rootX,
                y1: rootY + 7,
                x2: nx,
                y2: ny - 5,
                stroke: i === 38 ? "#E85D38" : softAccent,
                "stroke-width": i === 38 ? 2 : 0.9,
              })
            );
          }
          svg.append(
            svgEl("rect", {
              x: nx - 4.5,
              y: ny - 4.5,
              width: 9,
              height: 9,
              fill: i === 38 ? "#E85D38" : "#D6CFB4",
              stroke: i === 38 ? "#AD2D11" : "#8F8674",
              "stroke-width": 1,
            })
          );
        }
        // 标注 64 项压力带
        svg.append(
          svgEl(
            "text",
            {
              x: W / 2,
              y: y + 36,
              "text-anchor": "middle",
              fill: "#B02318",
              "font-size": 12,
              "font-family": "Noto Sans SC, sans-serif",
              "font-weight": 700,
            },
            "64 个平权入口全部暴露在同一层，无父子分组锚点"
          )
        );
      } else {
        // 多层树：按每层节点上限均匀展开，并高亮一条完整查找路径到目标叶节点
        const rawCount = prev.length * branch;
        const cap = isLast ? Math.min(rawCount, 32) : Math.min(rawCount, 16);
        const margin = 46;
        const span = W - margin * 2;
        const activeChild = Math.min(cap - 1, Math.floor(cap * 0.62));

        for (let i = 0; i < cap; i++) {
          const nx = cap === 1 ? W / 2 : margin + (i / (cap - 1)) * span;
          const pIdx = Math.min(prev.length - 1, Math.floor((i / cap) * prev.length));
          const parent = prev[pIdx];
          const isPath = parent.active && i === activeChild;
          svg.append(
            svgEl("line", {
              x1: parent.x,
              y1: parent.y + 6,
              x2: nx,
              y2: y - 6,
              stroke: isPath ? "#E85D38" : softAccent,
              "stroke-width": isPath ? 2.4 : 1.1,
            })
          );
          next.push({ x: nx, y, active: isPath });
        }

        // 绘制该层节点
        next.forEach((pt) => {
          svg.append(
            svgEl("circle", {
              cx: pt.x,
              cy: pt.y,
              r: pt.active ? 6.5 : isLast ? 4.2 : 5,
              fill: pt.active ? "#E85D38" : isLast ? "#D6CFB4" : accent,
              stroke: pt.active ? "#2B2010" : "#F8F2E6",
              "stroke-width": pt.active ? 2 : 1.2,
            })
          );
        });

        // 左侧层级刻度字
        svg.append(
          svgEl(
            "text",
            {
              x: 12,
              y: y + 4,
              fill: "#4B4539",
              "font-size": 11,
              "font-family": "Space Mono, monospace",
              "font-weight": 700,
            },
            `L${lv + 1}`
          )
        );
        svg.append(
          svgEl(
            "text",
            {
              x: W - 12,
              y: y + 4,
              "text-anchor": "end",
              fill: "#4B4539",
              "font-size": 11,
              "font-family": "Space Mono, monospace",
            },
            `×${branch}`
          )
        );
        prev = next;
      }
    }

    // 根节点压顶绘制
    svg.append(
      svgEl("rect", {
        x: rootX - 42,
        y: rootY - 12,
        width: 84,
        height: 22,
        fill: "#0D3B2B",
      })
    );
    svg.append(
      svgEl(
        "text",
        {
          x: rootX,
          y: rootY + 3,
          "text-anchor": "middle",
          fill: "#F4ECE0",
          "font-size": 11,
          "font-family": "Space Mono, monospace",
          "font-weight": 700,
        },
        "HOME (64)"
      )
    );
  }

  slider.addEventListener("input", () => draw(Number(slider.value)));
  presetBtns.forEach((b) =>
    b.addEventListener("click", () => draw(Number(b.dataset.treeIdx)))
  );
  draw(2);
}

// ---------- 02 节：四层视觉权重调音矩阵 ----------
export function mountWeightMatrix() {
  const root = document.getElementById("weight-lab");
  if (!root) return;
  const schemeBtns = [...root.querySelectorAll("[data-weight-scheme]")];
  const stackHost = document.getElementById("weight-stack");
  const summaryEl = document.getElementById("weight-summary");
  const totalEl = document.getElementById("weight-total");
  const inspectEl = document.getElementById("weight-inspect");

  let currentScheme = "stepped";
  let focusedId = "L2";

  function render() {
    const scheme = WEIGHT_SCHEMES[currentScheme];
    schemeBtns.forEach((b) => {
      const on = b.dataset.weightScheme === currentScheme;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    summaryEl.textContent = scheme.summary;
    const pct = Math.round((scheme.totalPx / 720) * 100);
    totalEl.textContent = `总高 ${scheme.totalPx}px（占 720px 首屏 ${pct}%）`;

    while (stackHost.firstChild) stackHost.removeChild(stackHost.firstChild);
    scheme.bars.forEach((bar) => {
      const btn = el("button", {
        type: "button",
        class: `wt-bar${bar.id === focusedId ? " is-focused" : ""}`,
        "aria-pressed": String(bar.id === focusedId),
      });
      btn.style.backgroundColor = bar.bg;
      btn.style.color = bar.fg;
      btn.style.minHeight = `${Math.max(40, bar.h)}px`;

      const left = el("span", { class: "wt-bar-left" });
      left.append(
        el("span", { class: "wt-code", lang: "en" }, bar.id),
        el("span", { class: "wt-name" }, bar.name)
      );
      const right = el("span", { class: "wt-bar-right" });
      right.append(
        el("span", { class: "wt-rank" }, bar.weightRank),
        el("span", { class: "wt-px", lang: "en" }, `${bar.h}px`)
      );
      btn.append(left, right);
      btn.addEventListener("click", () => {
        focusedId = bar.id;
        render();
      });
      stackHost.append(btn);
    });

    const active = scheme.bars.find((b) => b.id === focusedId) || scheme.bars[1];
    inspectEl.textContent = "";
    inspectEl.append(
      el("div", { class: "wt-ins-head" }, `${active.id} ${active.name} · ${active.role}`),
      el(
        "p",
        { class: "wt-ins-body" },
        `当前方案下该层高 ${active.h}px，字底对比度约 ${active.contrast}，视觉分量处于「${active.weightRank}」。点击旁侧任意一层档案条，对比它们在同一界面里的声音大小。`
      )
    );
  }

  schemeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      currentScheme = b.dataset.weightScheme;
      render();
    })
  );
  render();
}

// ---------- 03 节：五代历史演进档案签 + ARIA 结构对照 ----------
export function mountEraTimeline() {
  const tabsHost = document.getElementById("era-tabs");
  const yearEl = document.getElementById("era-year");
  const titleEl = document.getElementById("era-title");
  const whoEl = document.getElementById("era-who");
  const insightEl = document.getElementById("era-insight");
  const tagEl = document.getElementById("era-html");
  const ruleEl = document.getElementById("era-rule");
  if (!tabsHost) return;

  let activeIdx = 2; // 默认停在 1998 信息架构定型

  function render() {
    while (tabsHost.firstChild) tabsHost.removeChild(tabsHost.firstChild);
    ERAS.forEach((era, i) => {
      const btn = el("button", {
        type: "button",
        class: `era-tab${i === activeIdx ? " is-active" : ""}`,
        "aria-pressed": String(i === activeIdx),
      });
      btn.append(
        el("span", { class: "era-tab-year", lang: "en" }, era.year),
        el("span", { class: "era-tab-title" }, era.title)
      );
      btn.addEventListener("click", () => {
        activeIdx = i;
        render();
      });
      tabsHost.append(btn);
    });

    const cur = ERAS[activeIdx];
    yearEl.textContent = cur.year;
    titleEl.textContent = cur.title;
    whoEl.textContent = cur.who;
    insightEl.textContent = cur.insight;
    tagEl.textContent = cur.htmlTag;
    ruleEl.textContent = cur.rule;
  }

  render();
}

// ---------- 04 节：跨端折叠模拟器 ----------
export function mountResponsiveLab() {
  const devBtns = [...document.querySelectorAll("[data-resp-device]")];
  const modeBtns = [...document.querySelectorAll("[data-resp-mode]")];
  const frameEl = document.getElementById("resp-frame");
  const barsEl = document.getElementById("resp-bars");
  const contentEl = document.getElementById("resp-content");
  const metricEl = document.getElementById("resp-metric");
  const noteEl = document.getElementById("resp-note");
  if (!frameEl) return;

  let device = "mobile";
  let mode = "bad";

  function render() {
    const spec = VIEWPORT_MODES[device];
    const data = spec[mode];
    const pct = Math.round((data.chromePx / spec.h) * 100);
    const bodyPct = Math.max(18, 100 - pct);

    devBtns.forEach((b) => {
      const on = b.dataset.respDevice === device;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    modeBtns.forEach((b) => {
      const on = b.dataset.respMode === mode;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });

    frameEl.dataset.device = device;
    frameEl.dataset.mode = mode;

    while (barsEl.firstChild) barsEl.removeChild(barsEl.firstChild);
    data.bars.forEach((txt, idx) => {
      const row = el("div", { class: `resp-bar resp-bar-${idx}` }, txt);
      barsEl.append(row);
    });

    contentEl.textContent = `正文可见区 · 约 ${bodyPct}%（${spec.h - data.chromePx}px / ${spec.h}px）`;
    metricEl.textContent = `${spec.label} · 导航占 ${data.chromePx}px（${pct}%）`;
    metricEl.dataset.tone = mode === "good" ? "good" : "bad";
    noteEl.textContent = data.note;
  }

  devBtns.forEach((b) =>
    b.addEventListener("click", () => {
      device = b.dataset.respDevice;
      render();
    })
  );
  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.respMode;
      render();
    })
  );
  render();
}

// ---------- 05 节：六张场景适配诊断卡 ----------
export function mountScenarioDeck() {
  const host = document.getElementById("scenario-grid");
  const detail = document.getElementById("scenario-detail");
  if (!host || !detail) return;

  let selectedId = SCENARIOS[0].id;

  function render() {
    while (host.firstChild) host.removeChild(host.firstChild);
    SCENARIOS.forEach((sc) => {
      const on = sc.id === selectedId;
      const btn = el("button", {
        type: "button",
        class: `sc-card${on ? " is-active" : ""}`,
        "aria-pressed": String(on),
      });
      btn.append(
        el("span", { class: "sc-card-title" }, sc.title),
        el("span", { class: "sc-card-meta" }, sc.meta),
        el("span", { class: `sc-badge tone-${sc.tone}` }, sc.verdict)
      );
      btn.addEventListener("click", () => {
        selectedId = sc.id;
        render();
      });
      host.append(btn);
    });

    const cur = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];
    detail.textContent = "";
    const head = el("div", { class: "sc-detail-head" });
    head.append(
      el("strong", {}, cur.title),
      el("span", { class: `sc-badge tone-${cur.tone}` }, cur.verdict)
    );
    detail.append(head, el("p", { class: "sc-detail-body" }, cur.reason));
    if (cur.alt) {
      const p = el("p", { class: "sc-detail-alt" }, "更合适的替代方案：");
      const a = el(
        "a",
        {
          href: `https://layout.xiaoxiaodong.ai/${cur.alt.num}/play/`,
          target: "_blank",
          rel: "noopener",
        },
        `${cur.alt.num} ${cur.alt.name}`
      );
      p.append(a);
      detail.append(p);
    }
    const checkBox = el("div", { class: "sc-checklist" });
    checkBox.append(
      el("div", { class: "sc-check-title" }, "上线前快筛三问"),
      el("p", {}, "1. 站点是否至少有 3 级内容且总页数超过 15 页？"),
      el("p", {}, "2. 访客是否常从搜索或分享链接直接空降深层页？"),
      el("p", {}, "3. 页面主任务是不是非线性的自由探索与查阅？")
    );
    detail.append(checkBox);
  }

  render();
}

// ---------- 06 节：四选一可视化线框练习 ----------
function makeQuizSvg(id) {
  const svg = svgEl("svg", {
    viewBox: "0 0 240 132",
    class: "quiz-svg",
    "aria-hidden": "true",
  });
  svg.append(svgEl("rect", { x: 0, y: 0, width: 240, height: 132, fill: "#F8F2E6" }));

  if (id === "A") {
    // A：1 层塞满 12 项（两排挤满）+ 无路径无次导
    svg.append(svgEl("rect", { x: 8, y: 8, width: 224, height: 34, fill: "#E85D38" }));
    for (let i = 0; i < 12; i++) {
      const r = Math.floor(i / 6);
      const c = i % 6;
      svg.append(
        svgEl("rect", {
          x: 13 + c * 36,
          y: 13 + r * 14,
          width: 31,
          height: 9,
          fill: i === 4 ? "#AD2D11" : "#F4ECE0",
        })
      );
    }
    svg.append(svgEl("rect", { x: 8, y: 48, width: 224, height: 76, fill: "#2B2010" }));
    svg.append(svgEl("rect", { x: 20, y: 60, width: 120, height: 10, fill: "#F4ECE0" }));
    svg.append(svgEl("rect", { x: 20, y: 78, width: 190, height: 7, fill: "#A59578" }));
    svg.append(svgEl("rect", { x: 20, y: 92, width: 165, height: 7, fill: "#A59578" }));
  } else if (id === "B") {
    // B：标准递减三层（L1 轻 + L2 主单亮 + L3 浅底划杠 + L5 耳签 + 宽大 L6）
    svg.append(svgEl("rect", { x: 8, y: 6, width: 224, height: 11, fill: "#0B3D25" }));
    svg.append(svgEl("rect", { x: 16, y: 10, width: 92, height: 3, fill: "#D8E4D7" }));
    svg.append(svgEl("rect", { x: 114, y: 10, width: 32, height: 3, fill: "#F59B73" }));

    svg.append(svgEl("rect", { x: 8, y: 18, width: 224, height: 17, fill: "#E85D38" }));
    svg.append(svgEl("rect", { x: 64, y: 18, width: 48, height: 17, fill: "#AD2D11" }));
    for (let i = 0; i < 4; i++) {
      svg.append(svgEl("rect", { x: 20 + i * 52, y: 25, width: 32, height: 4, fill: "#F4ECE0" }));
    }

    svg.append(svgEl("rect", { x: 8, y: 36, width: 224, height: 14, fill: "#EDE4D2" }));
    for (let i = 0; i < 4; i++) {
      svg.append(svgEl("rect", { x: 20 + i * 52, y: 41, width: 30, height: 4, fill: "#3B3429" }));
    }
    svg.append(svgEl("rect", { x: 72, y: 48, width: 30, height: 2, fill: "#0D3B2B" }));

    // L5 耳签紧扣 L6
    for (let i = 0; i < 4; i++) {
      svg.append(
        svgEl("rect", {
          x: 8 + i * 56,
          y: 54,
          width: 54,
          height: 13,
          fill: i === 2 ? "#0D3B2B" : "#D6CFB4",
        })
      );
    }
    svg.append(svgEl("rect", { x: 8, y: 67, width: 224, height: 57, fill: "#2B2010" }));
    svg.append(svgEl("rect", { x: 20, y: 78, width: 116, height: 9, fill: "#F4ECE0" }));
    svg.append(svgEl("rect", { x: 20, y: 94, width: 184, height: 6, fill: "#A59578" }));
    svg.append(svgEl("rect", { x: 20, y: 106, width: 148, height: 6, fill: "#A59578" }));
  } else if (id === "C") {
    // C：四栏同高高饱和等重，吃掉半屏
    const colors = ["#E85D38", "#0B3D25", "#AD2D11", "#0D3B2B"];
    colors.forEach((c, i) => {
      svg.append(svgEl("rect", { x: 8, y: 6 + i * 19, width: 224, height: 17, fill: c }));
      for (let k = 0; k < 4; k++) {
        svg.append(svgEl("rect", { x: 20 + k * 52, y: 12 + i * 19, width: 30, height: 5, fill: "#F4ECE0" }));
      }
    });
    svg.append(svgEl("rect", { x: 8, y: 84, width: 224, height: 40, fill: "#2B2010" }));
    svg.append(svgEl("rect", { x: 20, y: 94, width: 104, height: 8, fill: "#F4ECE0" }));
    svg.append(svgEl("rect", { x: 20, y: 108, width: 160, height: 5, fill: "#A59578" }));
  } else {
    // D：行高克制，但 L1 历史乱序跳变（用虚线错段表示）且 L2 无高亮
    svg.append(svgEl("rect", { x: 8, y: 6, width: 224, height: 12, fill: "#0B3D25" }));
    svg.append(
      svgEl("text", { x: 16, y: 15, fill: "#F59B73", "font-size": 7.5, "font-family": "Space Mono, monospace" }, "HOME > 练习 > 布局策略03")
    );
    svg.append(svgEl("rect", { x: 8, y: 19, width: 224, height: 17, fill: "#E85D38" }));
    // 无任何高亮底板
    for (let i = 0; i < 4; i++) {
      svg.append(svgEl("rect", { x: 20 + i * 52, y: 26, width: 32, height: 4, fill: "#F4ECE0" }));
    }
    svg.append(svgEl("rect", { x: 8, y: 37, width: 224, height: 14, fill: "#EDE4D2" }));
    for (let i = 0; i < 4; i++) {
      svg.append(svgEl("rect", { x: 20 + i * 52, y: 42, width: 30, height: 4, fill: "#3B3429" }));
    }
    for (let i = 0; i < 4; i++) {
      svg.append(svgEl("rect", { x: 8 + i * 56, y: 54, width: 54, height: 13, fill: "#D6CFB4" }));
    }
    svg.append(svgEl("rect", { x: 8, y: 67, width: 224, height: 57, fill: "#2B2010" }));
    svg.append(svgEl("rect", { x: 20, y: 78, width: 116, height: 9, fill: "#F4ECE0" }));
    svg.append(svgEl("rect", { x: 20, y: 94, width: 184, height: 6, fill: "#A59578" }));
    svg.append(svgEl("rect", { x: 20, y: 106, width: 148, height: 6, fill: "#A59578" }));
  }
  return svg;
}

export function mountQuiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const grid = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  if (!grid || !fbEl) return;

  if (promptEl) promptEl.textContent = QUIZ.prompt;
  let picked = null;

  function render() {
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    QUIZ.options.forEach((opt) => {
      const isPicked = picked === opt.id;
      const cls = [
        "quiz-card",
        isPicked ? "is-picked" : "",
        picked && opt.correct ? "is-correct" : "",
        isPicked && !opt.correct ? "is-wrong" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const btn = el("button", {
        type: "button",
        class: cls,
        "aria-pressed": String(isPicked),
        "data-quiz-opt": opt.id,
      });
      btn.append(
        makeQuizSvg(opt.id),
        el("span", { class: "quiz-label" }, opt.label),
        el("span", { class: "quiz-spec" }, opt.spec)
      );
      btn.addEventListener("click", () => {
        picked = opt.id;
        render();
      });
      grid.append(btn);
    });

    if (!picked) {
      fbEl.textContent = "点击任意一套线框方案作答，系统会按层级、路径、定位与权重四项标准给出拆解。";
      fbEl.dataset.tone = "idle";
    } else {
      const cur = QUIZ.options.find((o) => o.id === picked);
      fbEl.textContent = cur.feedback;
      fbEl.dataset.tone = cur.correct ? "good" : "bad";
    }
  }

  render();
}

// ---------- 07 节：原海报可放大拖拽灯箱 ----------
export function mountPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomBtn = document.getElementById("poster-zoom");
  if (!trigger || !posterImg || !modal || !modalImg) return;

  let zoomed = false;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoomed ? 1.85 : 1})`;
    if (zoomBtn) zoomBtn.textContent = zoomed ? "还原 100%" : "放大 185%";
  }

  function open() {
    modalImg.src = posterImg.src;
    zoomed = false;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  zoomBtn?.addEventListener("click", () => {
    zoomed = !zoomed;
    if (!zoomed) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  modalImg.addEventListener("pointerdown", (e) => {
    if (!zoomed) return;
    drag = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    modalImg.setPointerCapture?.(e.pointerId);
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = Math.max(-420, Math.min(420, e.clientX - drag.x));
    ty = Math.max(-520, Math.min(520, e.clientY - drag.y));
    applyTransform();
  });
  modalImg.addEventListener("pointerup", () => {
    drag = null;
  });
  modalImg.addEventListener("pointercancel", () => {
    drag = null;
  });
}
