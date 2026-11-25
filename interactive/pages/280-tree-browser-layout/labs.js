// 280 树形浏览布局 · 正文 01–07 节互动实验与 08 节原海报灯箱
import {
  NODE_META,
  BREADTH_SHAPES,
  TRIAGE_SCENARIOS,
  QUIZ_ITEMS,
  buildTree,
  flattenTree,
} from "./model.js";
import { createBreadthCanvas } from "./artwork.js";
import { loop } from "../../lib/stage.js";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// 字体无关的内联矢量展开三角与菜单图标（避免 ▸ ▾ ☰ ✕ 缺字）
const TRI_OPEN = `<svg class="tri-ico" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M1.5 3L5 7.5L8.5 3Z" fill="currentColor"/></svg>`;
const TRI_CLOSED = `<svg class="tri-ico" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M3 1.5L7.5 5L3 8.5Z" fill="currentColor"/></svg>`;
const DOT_LEAF = `<svg class="tri-ico" viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><circle cx="5" cy="5" r="2.2" fill="currentColor"/></svg>`;
const MENU_ICO = `<svg class="tri-ico" viewBox="0 0 14 14" width="13" height="13" aria-hidden="true"><path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

export function initLabs() {
  initSection01Breadth();
  initSection02Xray();
  initSection03Aria();
  initSection04Paradigms();
  initSection05Mobile();
  initSection06Triage();
  initSection07Quiz();
  initSection08Lightbox();
}

// ============================================================
// 01 节：64 叶子广度 × 深度 2D Canvas 实验台
// ============================================================
function initSection01Breadth() {
  const canvas = document.getElementById("breadth-canvas");
  const readout = document.getElementById("breadth-readout");
  const btns = [...document.querySelectorAll(".shape-btn")];
  if (!canvas || !readout) return;

  const ctrl = createBreadthCanvas(canvas);
  let activeId = "d6";

  const { draw } = loop(canvas, (t, dt, meta) => {
    ctrl.render(t, dt, meta);
  });

  function renderReadout(id) {
    const s = BREADTH_SHAPES.find((x) => x.id === id) || BREADTH_SHAPES[0];
    const toneCls = s.verdictTone === "ok" ? "is-ok" : s.verdictTone === "err" ? "is-err" : "is-warn";
    readout.innerHTML = `
      <div class="br-stats">
        <div><span>点击步数</span><strong>${s.clicks} 步</strong></div>
        <div><span>每层扫读</span><strong>${s.scanPerLevel} 项</strong></div>
        <div><span>累计缩进</span><strong>${s.indentNeedPx}px</strong></div>
        <div><span>回退风险</span><strong>${esc(s.riskTier)}</strong></div>
      </div>
      <p class="br-note"><span class="br-verdict ${toneCls}">${esc(s.verdict)}</span>${esc(s.note)}</p>
    `;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      activeId = b.dataset.shape;
      btns.forEach((x) => x.classList.toggle("is-active", x === b));
      ctrl.setShape(activeId, true);
      renderReadout(activeId);
      draw();
    });
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const norm = Math.max(0, Math.min(0.999, (e.clientX - rect.left - 28) / Math.max(100, rect.width - 56)));
    ctrl.pickTarget(Math.floor(norm * 64));
    draw();
  });

  ctrl.setShape(activeId, false);
  renderReadout(activeId);
  draw();
}

// ============================================================
// 02 节：五层视觉线索 X 光剥皮解剖台
// ============================================================
function initSection02Xray() {
  const stage = document.getElementById("xray-stage");
  const treeEl = document.getElementById("xray-tree");
  const noteEl = document.getElementById("xray-note");
  const stripBtn = document.getElementById("xray-strip-all");
  const barTag = stage?.querySelector(".mono-tag");
  const btns = [...document.querySelectorAll(".xray-btn")];
  if (!stage || !treeEl) return;

  const layers = { indent: true, guides: true, icons: true, badges: true, chevrons: true };
  const sampleRows = [
    { id: "root", depth: 0, mark: "−", kind: "root", name: "知识库", count: 61, guides: [] },
    { id: "design", depth: 1, mark: "−", kind: "folder", name: "产品设计", count: 12, guides: [true] },
    { id: "principles", depth: 2, mark: "", kind: "doc", name: "设计原则", count: 5, guides: [true, true] },
    { id: "components", depth: 2, mark: "−", kind: "folder", name: "组件库", count: 18, hi: true, guides: [true, false] },
    { id: "basic", depth: 3, mark: "", kind: "doc", name: "基础组件", count: 8, guides: [true, false, true] },
    { id: "form", depth: 3, mark: "", kind: "doc", name: "表单组件", count: 6, guides: [true, false, true] },
    { id: "nav", depth: 3, mark: "", kind: "doc", name: "导航组件", count: 4, guides: [true, false, false] },
    { id: "dev", depth: 1, mark: "+", kind: "folder", name: "开发文档", count: 24, guides: [true] },
    { id: "ops", depth: 1, mark: "+", kind: "folder", name: "运营资料", count: 16, guides: [false] },
  ];

  const icoSvg = (kind) => {
    if (kind === "root") return `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M3 9.5L10 3.5l7 6V17h-4.5v-4.5h-5V17H3z" fill="currentColor"/></svg>`;
    if (kind === "folder") return `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h4l1.5 1.5H16A1.5 1.5 0 0 1 17.5 7v7.5A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor"/></svg>`;
    return `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M5 3h7l3 3v11H5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 9.5h5M7.5 12.5h5" stroke="currentColor" stroke-width="1.4"/></svg>`;
  };

  treeEl.innerHTML = sampleRows
    .map((r) => {
      let gHtml = "";
      if (r.depth > 0) {
        for (let k = 0; k < r.depth - 1; k++) {
          if (r.guides[k]) gHtml += `<span class="xr-guide" style="left:${20 + k * 24}px"></span>`;
        }
        gHtml += `<span class="xr-elbow" style="left:${20 + (r.depth - 1) * 24}px"></span>`;
      }
      return `
        <div class="xr-row${r.hi ? " is-hi" : ""}" style="--xr-depth:${r.depth}">
          ${gHtml}
          <span class="xr-chev${r.mark ? "" : " is-empty"}" aria-hidden="true">${r.mark}</span>
          <span class="xr-ico" aria-hidden="true">${icoSvg(r.kind)}</span>
          <span class="xr-name">${esc(r.name)}</span>
          <span class="xr-badge">${r.count}</span>
        </div>
      `;
    })
    .join("");

  function updateXray() {
    const onKeys = Object.keys(layers).filter((k) => layers[k]);
    const offKeys = Object.keys(layers).filter((k) => !layers[k]);
    for (const k of Object.keys(layers)) {
      stage.dataset[k] = layers[k] ? "on" : "off";
    }
    btns.forEach((b) => {
      const on = layers[b.dataset.layer];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (barTag) barTag.textContent = `X-RAY SPECIMEN · ${onKeys.length} / 5 线索开启`;
    if (stripBtn) stripBtn.textContent = onKeys.length === 0 ? "一键恢复全部线索" : "一键全关看退化";

    if (onKeys.length === 5) {
      noteEl.innerHTML = `<strong>5 / 5 线索齐备：</strong>扫一眼就能同时读出四件事——「组件库」属于「产品设计」第 3 层、下面有 18 项且已展开、「开发文档」虽然收起但里面还藏着 24 篇。`;
    } else if (onKeys.length === 0) {
      noteEl.innerHTML = `<strong>0 / 5 彻底退化：</strong>撤掉全部五种视觉线索后，树形目录瞬间塌成 9 行平级文字。人眼完全看不出「基础组件」属于谁，也不知道「开发文档」还能点开。`;
    } else {
      const missingText = [];
      if (!layers.indent) missingText.push("关掉缩进后，所有节点齐平左对齐，父子层级关系直接消失");
      if (!layers.guides) missingText.push("关掉引导线后，跨越多个子项的「开发文档」与「产品设计」很难快速对齐同级");
      if (!layers.icons) missingText.push("关掉类型图标后，一眼分不清「设计原则（文档）」与「组件库（文件夹）」的区别");
      if (!layers.badges) missingText.push("关掉计数徽后，点开前无法预判折叠分支里藏着几篇内容");
      if (!layers.chevrons) missingText.push("关掉 − / + 展开符后，失去明确的点击操作手柄与开合状态提示");
      noteEl.innerHTML = `<strong>缺少 ${offKeys.length} 项线索：</strong>${missingText.join("；")}。`;
    }
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.layer;
      layers[k] = !layers[k];
      updateXray();
    });
  });

  stripBtn?.addEventListener("click", () => {
    const anyOn = Object.values(layers).some(Boolean);
    for (const k of Object.keys(layers)) layers[k] = !anyOn;
    updateXray();
  });

  updateXray();
}

// ============================================================
// 03 节：WAI-ARIA Tree View 键盘协议暗室操练台
// ============================================================
function initSection03Aria() {
  const treeEl = document.getElementById("aria-tree");
  const pillEl = document.getElementById("aria-focus-pill");
  const ruleTitle = document.getElementById("aria-rule-title");
  const ruleDesc = document.getElementById("aria-rule-desc");
  const domSnap = document.getElementById("aria-dom-snap");
  const srSim = document.getElementById("aria-sr-sim");
  const keyBtns = [...document.querySelectorAll(".keycap")];
  if (!treeEl) return;

  const root = buildTree("poster4");
  const expanded = new Set(["root", "design", "components"]);
  let focusedId = "components";
  let lastRule = {
    title: "当前停留在「组件库」，试试按 ↑ ↓ ← → 或点键帽",
    desc: "整棵树采用游走焦点（Roving Tabindex）：只有当前焦点节点 tabindex=\"0\"，其余为 \"-1\"。按 Tab 可一步离开整棵树，不再卡在侧边栏里。",
  };

  function renderAria(moveDomFocus = false) {
    const { visible } = flattenTree(root, expanded);
    if (!visible.some((v) => v.id === focusedId)) focusedId = visible[0].id;
    const cur = visible.find((v) => v.id === focusedId);

    treeEl.innerHTML = visible
      .map((row) => {
        const isFoc = row.id === focusedId;
        const mark = row.hasChildren ? (row.isExpanded ? TRI_OPEN : TRI_CLOSED) : DOT_LEAF;
        return `
          <button type="button"
            class="aria-item${isFoc ? " is-focused" : ""}"
            role="treeitem"
            data-aid="${row.id}"
            tabindex="${isFoc ? "0" : "-1"}"
            aria-level="${row.depth}"
            aria-setsize="${row.setSize}"
            aria-posinset="${row.posInSet}"
            ${row.hasChildren ? `aria-expanded="${row.isExpanded}"` : ""}
            aria-selected="${isFoc}"
            style="--a-depth:${row.depth - 1}">
            <span class="aria-mark" aria-hidden="true">${mark}</span>
            <span>${esc(row.meta.zh)}</span>
            <span class="aria-lvl">L${row.depth} · ${row.posInSet}/${row.setSize}</span>
          </button>
        `;
      })
      .join("");

    if (moveDomFocus) {
      const el = treeEl.querySelector(`[data-aid="${focusedId}"]`);
      el?.focus({ preventScroll: true });
    }

    pillEl.textContent = `焦点：${cur.meta.zh} (L${cur.depth})`;
    ruleTitle.textContent = lastRule.title;
    ruleDesc.textContent = lastRule.desc;

    const expAttr = cur.hasChildren ? `\n  aria-expanded="${cur.isExpanded}"` : "";
    domSnap.textContent = `<div role="treeitem" tabindex="0"${expAttr}\n  aria-level="${cur.depth}" aria-posinset="${cur.posInSet}" aria-setsize="${cur.setSize}"\n  aria-selected="true">\n  ${cur.meta.zh}\n</div>`;

    const statePhrase = cur.hasChildren ? (cur.isExpanded ? "已展开，含子项" : "已收起，按右箭头展开") : "末端条目";
    srSim.textContent = `“${cur.meta.zh}，树条目，${statePhrase}，第 ${cur.depth} 级，第 ${cur.posInSet} 项，共 ${cur.setSize} 项。”`;
  }

  function handleKey(key, moveDomFocus = false) {
    const { visible, byId } = flattenTree(root, expanded);
    const idx = visible.findIndex((v) => v.id === focusedId);
    const cur = visible[idx] || visible[0];

    if (key === "ArrowDown") {
      if (idx < visible.length - 1) {
        focusedId = visible[idx + 1].id;
        lastRule = { title: "↓ ArrowDown：移到下一个可见节点", desc: "只穿梭在当前已展开可见的行里，绝不会擅自替用户把收起的文件夹撑开。" };
      } else {
        lastRule = { title: "↓ ArrowDown：已到达最后一个可见节点", desc: "WAI-ARIA 约定下箭头到底停止，不循环跳回顶部，避免读屏用户迷失边界。" };
      }
    } else if (key === "ArrowUp") {
      if (idx > 0) {
        focusedId = visible[idx - 1].id;
        lastRule = { title: "↑ ArrowUp：移到上一个可见节点", desc: "按视觉顺序向上移动焦点，同样不改变任何分支的展开状态。" };
      } else {
        lastRule = { title: "↑ ArrowUp：已停在根节点顶部", desc: "已在树的第一个可见节点，焦点保持不动。" };
      }
    } else if (key === "ArrowRight") {
      if (cur.hasChildren && !cur.isExpanded) {
        expanded.add(cur.id);
        lastRule = { title: "→ ArrowRight：节点原本收起 → 立即展开", desc: "焦点留在当前父节点上，先让用户听到「已展开」，再决定要不要继续深入。" };
      } else if (cur.hasChildren && cur.isExpanded) {
        focusedId = cur.childrenIds[0];
        lastRule = { title: "→ ArrowRight：节点已展开 → 进入首个子节点", desc: "再次按右箭头直接迈进第一个子项，单手连按即可一路向下钻取。" };
      } else {
        lastRule = { title: "→ ArrowRight：末端文档无子项 → 保持不动", desc: "叶子节点没有下级分支，右箭头静默忽略。" };
      }
    } else if (key === "ArrowLeft") {
      if (cur.hasChildren && cur.isExpanded) {
        expanded.delete(cur.id);
        lastRule = { title: "← ArrowLeft：节点原本展开 → 立即收起", desc: "隐藏所有子项并将焦点留在父节点，方便立刻切去下一个兄弟分支。" };
      } else if (cur.parentId) {
        focusedId = cur.parentId;
        lastRule = { title: "← ArrowLeft：已收起或末端节点 → 退回父节点", desc: "一步跳回直属上级，不必逐行按上箭头往回爬。" };
      } else {
        lastRule = { title: "← ArrowLeft：已在根节点且收起", desc: "没有更上级节点，焦点维持在根节点。" };
      }
    } else if (key === "Home") {
      focusedId = visible[0].id;
      lastRule = { title: "Home：直达第一个可见节点（根节点）", desc: "无论钻得多深，一键回到整棵树的起点，不改变各分支原有开合。" };
    } else if (key === "End") {
      focusedId = visible[visible.length - 1].id;
      lastRule = { title: "End：直达最后一个可见节点", desc: "直接跳到当前展开视图的最底行。" };
    } else if (key === "*") {
      const parent = cur.parentId ? byId.get(cur.parentId) : null;
      const sibs = parent ? parent.childrenIds : [root.id];
      let opened = 0;
      sibs.forEach((sid) => {
        const s = byId.get(sid);
        if (s && s.hasChildren && !expanded.has(sid)) {
          expanded.add(sid);
          opened++;
        }
      });
      lastRule = {
        title: `* 星号键：批量展开同级全部关闭分支（本次展开 ${opened} 个）`,
        desc: "这是 W3C APG 里常被忽略的高效快捷键：想横向扫一遍同级所有目录时，按一下 * 即可全部展开。",
      };
    }

    renderAria(moveDomFocus);
  }

  treeEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-aid]");
    if (!btn) return;
    const id = btn.dataset.aid;
    const { byId } = flattenTree(root, expanded);
    const node = byId.get(id);
    if (id === focusedId && node?.hasChildren) {
      if (expanded.has(id)) expanded.delete(id);
      else expanded.add(id);
      lastRule = { title: `点按「${node.meta.zh}」切换展开状态`, desc: "鼠标点击既可移动焦点，也可直接切换分支的 aria-expanded 状态。" };
    } else {
      focusedId = id;
      lastRule = { title: `焦点移至「${node.meta.zh}」(L${node.depth})`, desc: "现在可直接按键盘方向键 ↑ ↓ ← → 或点下方键帽继续操作。" };
    }
    renderAria(true);
  });

  treeEl.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "*"].includes(e.key)) {
      e.preventDefault();
      handleKey(e.key, true);
    }
  });

  keyBtns.forEach((b) => {
    b.addEventListener("click", () => handleKey(b.dataset.key, false));
  });

  renderAria(false);
}

// ============================================================
// 04 节：同一知识库的三种经典树形形态对比
// ============================================================
function initSection04Paradigms() {
  const stage = document.getElementById("paradigm-stage");
  const compare = document.getElementById("paradigm-compare");
  const btns = [...document.querySelectorAll("[data-paradigm]")];
  if (!stage) return;

  const root = buildTree("poster4");
  const expanded = new Set(["root", "design", "components"]);
  let mode = "outline";
  let selL2 = "design";
  let selL3 = "components";
  let selL4 = "form";

  function render() {
    btns.forEach((b) => b.classList.toggle("is-active", b.dataset.paradigm === mode));

    if (mode === "outline") {
      const { visible } = flattenTree(root, expanded);
      stage.innerHTML = `
        <div class="tree-root">
          ${visible
            .map(
              (r) => `
            <button type="button" class="miller-btn${r.id === selL4 ? " is-active" : ""}" data-out-id="${r.id}" style="padding-left:${10 + (r.depth - 1) * 22}px">
              <span class="m-lbl">${r.hasChildren ? (r.isExpanded ? TRI_OPEN : TRI_CLOSED) : DOT_LEAF}${esc(r.meta.zh)}</span>
              <span class="cc-cnt">${r.meta.count}</span>
            </button>
          `
            )
            .join("")}
        </div>
      `;
      compare.innerHTML = `
        <span><strong>经典大纲树（1991 System 7 / 1995 Win95）：</strong>支持同时展开多条不同分支横向比对，但钻到 4 层以上时纵向滚动变长、右侧缩进收窄。</span>
        <div class="pc-tags"><span>跨分支对比：强</span><span>水平占用：省</span><span>深层定位：易拉长</span></div>
      `;
    } else if (mode === "miller") {
      const l2List = root.children;
      const curL2 = l2List.find((n) => n.id === selL2) || l2List[0];
      const l3List = curL2.children;
      const curL3 = l3List.find((n) => n.id === selL3) || l3List[0];
      const l4List = curL3 ? curL3.children : [];

      stage.innerHTML = `
        <div class="miller-grid">
          <div class="miller-col">
            <div class="miller-col-head">L2 · 一级分类</div>
            ${l2List
              .map(
                (n) => `<button type="button" class="miller-btn${n.id === curL2.id ? " is-active" : ""}" data-ml="2" data-id="${n.id}"><span>${esc(NODE_META[n.id].zh)}</span><span>›</span></button>`
              )
              .join("")}
          </div>
          <div class="miller-col">
            <div class="miller-col-head">L3 · ${esc(NODE_META[curL2.id].zh)}</div>
            ${l3List
              .map(
                (n) => `<button type="button" class="miller-btn${curL3 && n.id === curL3.id ? " is-active" : ""}" data-ml="3" data-id="${n.id}"><span>${esc(NODE_META[n.id].zh)}</span><span>${n.children.length ? "›" : NODE_META[n.id].count}</span></button>`
              )
              .join("")}
          </div>
          <div class="miller-col">
            <div class="miller-col-head">L4 · ${curL3 ? esc(NODE_META[curL3.id].zh) : "详情"}</div>
            ${
              l4List.length
                ? l4List
                    .map(
                      (n) => `<button type="button" class="miller-btn${n.id === selL4 ? " is-active" : ""}" data-ml="4" data-id="${n.id}"><span>${esc(NODE_META[n.id].zh)}</span><span>${NODE_META[n.id].count}</span></button>`
                    )
                    .join("")
                : `<p class="cc-desc" style="padding:6px">${esc(NODE_META[curL3.id].desc)}</p>`
            }
          </div>
        </div>
      `;
      compare.innerHTML = `
        <span><strong>级联米勒分栏（1980 Miller / 1988 NeXTSTEP）：</strong>每一层独占一栏，路径一目了然、钻深不挤字；代价是横向占用大，且一次只能盯一条路径。</span>
        <div class="pc-tags"><span>跨分支对比：弱</span><span>水平占用：宽</span><span>深层定位：极快</span></div>
      `;
    } else {
      const { visible } = flattenTree(root, expanded);
      const curMeta = NODE_META[selL4] || NODE_META[selL3] || NODE_META.components;
      stage.innerHTML = `
        <div class="split-paradigm">
          <div class="tree-root">
            ${visible
              .map(
                (r) => `
              <button type="button" class="miller-btn${r.id === curMeta.id ? " is-active" : ""}" data-sp-id="${r.id}" style="padding-left:${8 + (r.depth - 1) * 16}px">
                <span class="m-lbl">${r.hasChildren ? (r.isExpanded ? TRI_OPEN : TRI_CLOSED) : DOT_LEAF}${esc(r.meta.zh)}</span>
              </button>
            `
              )
              .join("")}
          </div>
          <div class="sp-detail">
            <h4>${esc(curMeta.zh)} <span class="cc-en">${esc(curMeta.en)}</span></h4>
            <p>${esc(curMeta.desc)}</p>
            <div class="cc-tags">${(curMeta.tags || (curMeta.subItems || []).map((s) => s.label)).map((t) => `<span class="cc-tag">${esc(t)}</span>`).join("")}</div>
          </div>
        </div>
      `;
      compare.innerHTML = `
        <span><strong>双栏目录 + 详情（现代知识库 / 280 原海报）：</strong>左侧保持紧凑目录定位，右侧释放完整空间承接正文与标签，是目前 SaaS 后台与文档站最平衡的形态。</span>
        <div class="pc-tags"><span>阅读承载：强</span><span>上下文保持：好</span><span>适用最广</span></div>
      `;
    }
  }

  stage.addEventListener("click", (e) => {
    const out = e.target.closest("[data-out-id]");
    if (out) {
      const id = out.dataset.outId;
      const { byId } = flattenTree(root, expanded);
      if (byId.get(id)?.hasChildren) {
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
      } else {
        selL4 = id;
      }
      render();
      return;
    }
    const ml = e.target.closest("[data-ml]");
    if (ml) {
      const lvl = +ml.dataset.ml;
      const id = ml.dataset.id;
      if (lvl === 2) {
        selL2 = id;
        const next = root.children.find((c) => c.id === id)?.children[0];
        if (next) selL3 = next.id;
      } else if (lvl === 3) {
        selL3 = id;
      } else {
        selL4 = id;
      }
      render();
      return;
    }
    const sp = e.target.closest("[data-sp-id]");
    if (sp) {
      const id = sp.dataset.spId;
      const { byId } = flattenTree(root, expanded);
      if (byId.get(id)?.hasChildren && id !== "root") {
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
      }
      selL4 = id;
      render();
    }
  });

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.paradigm;
      render();
    });
  });

  render();
}

// ============================================================
// 05 节：手机适配实验室（钻取面包屑 / 抽屉折叠 / 硬塞反例 + 留路径搜索）
// ============================================================
function initSection05Mobile() {
  const bodyEl = document.getElementById("phone-body");
  const modeTag = document.getElementById("phone-mode-tag");
  const verdictEl = document.getElementById("mob-verdict");
  const searchInput = document.getElementById("mob-search-input");
  const mobBtns = [...document.querySelectorAll("[data-mob]")];
  const msearchBtns = [...document.querySelectorAll("[data-msearch]")];
  const quickChips = [...document.querySelectorAll(".q-chip")];
  if (!bodyEl) return;

  const root = buildTree("poster4");
  const { allNodes, byId } = flattenTree(root, new Set(["root", "design", "components", "dev", "ops", "pm"]));

  let mobMode = "drill"; // drill | drawer | cramped
  let searchMode = "context"; // context | orphan
  let currentId = "components";
  let drawerOpen = true;
  let query = "";

  function renderMobile() {
    mobBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.mob === mobMode));
    msearchBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.msearch === searchMode));

    const q = query.trim().toLowerCase();
    if (q) {
      modeTag.textContent = searchMode === "context" ? "搜索 · 保留祖先路径" : "搜索 · 孤岛结果（反例）";
      const hits = allNodes.filter((n) => `${n.meta.zh} ${n.meta.en} ${n.meta.desc}`.toLowerCase().includes(q));
      if (!hits.length) {
        bodyEl.innerHTML = `<p class="cc-desc">没有找到包含「${esc(query)}」的节点，试试搜「表单」「接口」「里程碑」。</p>`;
      } else if (searchMode === "context") {
        bodyEl.innerHTML = `
          <div class="mob-list">
            ${hits
              .map((h) => {
                const path = h.ancestors.map((a) => NODE_META[a].zh).join(" / ");
                return `
                  <button type="button" class="mob-row" data-mob-jump="${h.id}">
                    <span>
                      <span class="mob-path-sub">${esc(path || "根节点")}</span>
                      ${esc(h.meta.zh)}
                    </span>
                    <span class="cc-cnt">${h.meta.count}</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="mob-list">
            ${hits
              .map(
                (h) => `
                <button type="button" class="mob-row" data-mob-jump="${h.id}">
                  <span>${esc(h.meta.zh)}</span>
                  <span class="cc-cnt">${h.meta.count}</span>
                </button>
              `
              )
              .join("")}
          </div>
        `;
      }
      verdictEl.innerHTML =
        searchMode === "context"
          ? `<strong>保留祖先路径（推荐）：</strong>命中「${esc(query)}」时同步附带完整上级路径，用户一眼知道它归属哪条业务线，不会出现两个同名「规范」分不清谁是谁的尴尬。`
          : `<strong>孤岛结果（反例）：</strong>只孤零零吐出节点名、抹掉了所属上级路径。一旦大型知识库里多条分支都有「概述 / 规范」，用户完全分不清该点哪一条。`;
      return;
    }

    if (mobMode === "drill") {
      modeTag.textContent = "单层钻取 + 面包屑";
      const cur = byId.get(currentId) || byId.get("root");
      const crumbs = [...cur.ancestors, cur.id];
      const kids = cur.childrenIds.map((cid) => byId.get(cid));
      bodyEl.innerHTML = `
        <div class="mob-crumb">
          ${crumbs
            .map(
              (cid, i) =>
                `${i > 0 ? "<span>/</span>" : ""}<button type="button" data-mob-jump="${cid}">${esc(NODE_META[cid].zh)}</button>`
            )
            .join("")}
        </div>
        ${
          kids.length
            ? `<div class="mob-list">${kids
                .map(
                  (k) => `
                  <button type="button" class="mob-row" data-mob-jump="${k.id}">
                    <span>${esc(k.meta.zh)}</span>
                    <span class="cc-cnt">${k.meta.count} ${k.hasChildren ? "›" : ""}</span>
                  </button>`
                )
                .join("")}</div>`
            : `<div class="sp-detail"><h4>${esc(cur.meta.zh)}</h4><p>${esc(cur.meta.desc)}</p><div class="cc-tags">${(cur.meta.tags || (cur.meta.subItems || []).map((x) => x.label)).map((t) => `<span class="cc-tag">${esc(t)}</span>`).join("")}</div></div>`
        }
      `;
      verdictEl.innerHTML = `<strong>单层钻取 + 面包屑：</strong>永远只铺当前这一层的列表，每个标题享有 100% 宽度且触控热区 ≥ 44px；顶部面包屑负责守住「我从哪来、怎么回去」。`;
    } else if (mobMode === "drawer") {
      modeTag.textContent = "折叠抽屉目录";
      const cur = byId.get(currentId) || byId.get("form");
      bodyEl.innerHTML = `
        <div class="mob-drawer-bar">
          <button type="button" class="seg-btn is-active" id="mob-drawer-toggle">${drawerOpen ? "收起目录抽屉 ×" : `${MENU_ICO} 展开目录抽屉`}</button>
          <span class="cc-cnt">当前：${esc(cur.meta.zh)}</span>
        </div>
        ${
          drawerOpen
            ? `<div class="mob-drawer-panel"><div class="mob-list">${["design", "components", "form", "dev", "ops"]
                .map(
                  (id) => `<button type="button" class="mob-row" data-mob-pick="${id}"><span>${esc(NODE_META[id].zh)}</span><span class="cc-cnt">L${byId.get(id).depth}</span></button>`
                )
                .join("")}</div></div>`
            : ""
        }
        <div class="sp-detail">
          <h4>${esc(cur.meta.zh)}</h4>
          <p>${esc(cur.meta.desc)}</p>
          <p class="cc-foot">正文区独享整屏宽度，选完目录后自动收起抽屉。</p>
        </div>
      `;
      verdictEl.innerHTML = `<strong>折叠抽屉：</strong>读正文时把树形目录完全收起，正文区不受挤压；需要切换章节时再拉出抽屉，常见于移动端文档站（如 VitePress、Docusaurus）。`;
    } else {
      modeTag.textContent = "硬塞桌面缩进（反例）";
      bodyEl.innerHTML = `
        <div class="mob-cramped-box">
          ${allNodes
            .slice(0, 9)
            .map(
              (n) =>
                `<div class="mob-cramped-row" style="padding-left:${8 + (n.depth - 1) * 34}px"><span class="m-lbl">${n.hasChildren ? TRI_OPEN : DOT_LEAF}${esc(n.meta.zh)} — ${esc(n.meta.en)} (${n.meta.count})</span></div>`
            )
            .join("")}
        </div>
      `;
      verdictEl.innerHTML = `<strong>硬塞桌面树（反例）：</strong>保留桌面 34px 缩进后，第 4 层刚露头就撞破 375px 右壁，强迫用户横竖同时拖动，彻底丧失移动端可读性。`;
    }
  }

  bodyEl.addEventListener("click", (e) => {
    const dt = e.target.closest("#mob-drawer-toggle");
    if (dt) {
      drawerOpen = !drawerOpen;
      renderMobile();
      return;
    }
    const pick = e.target.closest("[data-mob-pick]");
    if (pick) {
      currentId = pick.dataset.mobPick;
      drawerOpen = false;
      renderMobile();
      return;
    }
    const jmp = e.target.closest("[data-mob-jump]");
    if (jmp) {
      currentId = jmp.dataset.mobJump;
      query = "";
      if (searchInput) searchInput.value = "";
      renderMobile();
    }
  });

  mobBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mobMode = b.dataset.mob;
      query = "";
      if (searchInput) searchInput.value = "";
      renderMobile();
    })
  );

  msearchBtns.forEach((b) =>
    b.addEventListener("click", () => {
      searchMode = b.dataset.msearch;
      if (!query.trim()) {
        query = "表单";
        if (searchInput) searchInput.value = query;
      }
      renderMobile();
    })
  );

  searchInput?.addEventListener("input", () => {
    query = searchInput.value;
    renderMobile();
  });

  quickChips.forEach((c) =>
    c.addEventListener("click", () => {
      query = c.dataset.q || "";
      if (searchInput) searchInput.value = query;
      renderMobile();
    })
  );

  renderMobile();
}

// ============================================================
// 06 节：什么时候别用树形（4 场景数据结构分诊台）
// ============================================================
function initSection06Triage() {
  const tabsEl = document.getElementById("triage-tabs");
  const cardEl = document.getElementById("triage-card");
  if (!tabsEl || !cardEl) return;

  let activeIdx = 1; // 默认先展示典型反例「5000 款户外装备选品库」

  function render() {
    tabsEl.innerHTML = TRIAGE_SCENARIOS.map(
      (s, i) => `
      <button type="button" class="triage-tab${i === activeIdx ? " is-active" : ""}" data-tri="${i}">
        <strong>${esc(s.title)}</strong>
        <span>${esc(s.tag)}</span>
      </button>`
    ).join("");

    const s = TRIAGE_SCENARIOS[activeIdx];
    const isUse = s.fit === "use";
    const bar = (lbl, val, errTone) => `
      <div class="tri-bar-row">
        <div class="tri-bar-head"><span>${lbl}</span><span>${val >= 70 ? "高（示意）" : val >= 40 ? "中（示意）" : "低（示意）"}</span></div>
        <div class="tri-track"><div class="tri-fill${errTone ? " is-err" : ""}" style="width:${val}%"></div></div>
      </div>
    `;

    cardEl.innerHTML = `
      <div>
        <span class="tri-badge ${isUse ? "is-use" : "is-avoid"}">${esc(s.verdict)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.why)}</p>
        <p><strong>建议方案：</strong>${esc(s.altText)}</p>
        ${
          s.altLinks.length
            ? `<div class="tri-links">${s.altLinks
                .map((l) => `<a class="tri-link-pill" href="${l.url}" target="_blank" rel="noopener">去看 ${l.id} ${esc(l.name)} →</a>`)
                .join("")}</div>`
            : ""
        }
        ${
          s.clashDemo
            ? `<div class="tri-clash"><strong>硬塞进单父树会立刻产生重复节点：</strong><br>${s.clashDemo.map(esc).join("<br>")}</div>`
            : ""
        }
      </div>
      <div class="tri-bars">
        ${bar("严格单父归属程度", s.axes.singleParent, !isUse && s.axes.singleParent < 50)}
        ${bar("多层收敛需求（3–4 层）", s.axes.depthNeed, !isUse && s.axes.depthNeed < 40)}
        ${bar("多维交叉筛选需求", s.axes.multiFilter, !isUse && s.axes.multiFilter > 70)}
        ${bar("同级字段并列对比需求", s.axes.compareFields, !isUse && s.axes.compareFields > 70)}
      </div>
    `;
  }

  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tri]");
    if (!b) return;
    activeIdx = +b.dataset.tri;
    render();
  });

  render();
}

// ============================================================
// 07 节：实战挑树小练习（两题中性四选一）
// ============================================================
function initSection07Quiz() {
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  const fbTitle = document.getElementById("qf-title");
  const fbBody = document.getElementById("qf-body");
  const scoreEl = document.getElementById("quiz-score");
  const switchBtns = [...document.querySelectorAll("[data-quiz]")];
  if (!gridEl) return;

  let qIdx = 0;
  const answers = new Map(); // qIdx -> key

  function render() {
    switchBtns.forEach((b) => b.classList.toggle("is-active", +b.dataset.quiz === qIdx));
    const q = QUIZ_ITEMS[qIdx];
    const picked = answers.get(qIdx) || null;
    promptEl.textContent = q.prompt;

    const doneRight = [...answers.entries()].filter(([i, k]) => QUIZ_ITEMS[i].options.find((o) => o.key === k)?.correct).length;
    scoreEl.textContent = `已完成 ${answers.size} / ${QUIZ_ITEMS.length} 题（答对 ${doneRight} 题）`;

    gridEl.innerHTML = q.options
      .map((opt) => {
        let cls = "quiz-opt";
        if (picked) {
          if (opt.correct) cls += " is-right";
          else if (opt.key === picked) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-opt="${opt.key}" aria-pressed="${picked === opt.key}">
            <div class="qo-top">
              <strong>${esc(opt.title)}</strong>
              <span class="qo-meta">${esc(opt.meta)}</span>
            </div>
            <div class="qo-preview">
              ${opt.preview
                .map(
                  (line) => `
                <div class="qo-line${line.active ? " is-active" : ""}${line.muted ? " is-muted" : ""}${line.warn ? " is-warn" : ""}${line.crumb ? " is-crumb" : ""}" style="--q-depth:${line.depth - 1}">
                  ${line.mark ? `<span>${esc(line.mark)}</span>` : ""}
                  <span>${esc(line.text)}</span>
                  ${line.count ? `<span class="qo-cnt">${line.count}</span>` : ""}
                </div>`
                )
                .join("")}
            </div>
          </button>
        `;
      })
      .join("");

    fbEl.classList.remove("is-right", "is-wrong");
    if (!picked) {
      fbTitle.textContent = "先读完题干，凭结构逻辑选出唯一一套方案。";
      fbBody.textContent = "四个选项的字体、颜色与文档内容完全相同，只差一个结构或交互变量。";
    } else {
      const chosen = q.options.find((o) => o.key === picked);
      const right = q.options.find((o) => o.correct);
      fbEl.classList.add(chosen.correct ? "is-right" : "is-wrong");
      fbTitle.textContent = chosen.correct ? `选对了：${chosen.title}` : `再想想：你选了 ${chosen.title}，最佳方案是 ${right.title}`;
      fbBody.textContent = chosen.correct ? chosen.reason : `${chosen.reason} 相比之下，${right.title}：${right.reason}`;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-opt]");
    if (!btn) return;
    answers.set(qIdx, btn.dataset.opt);
    render();
  });

  switchBtns.forEach((b) =>
    b.addEventListener("click", () => {
      qIdx = +b.dataset.quiz;
      render();
    })
  );

  render();
}

// ============================================================
// 08 节：原海报放大灯箱（支持缩放、拖动平移、draggable="false"、Esc 关）
// ============================================================
function initSection08Lightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !lb || !posterImg || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (lbScale) lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLb() {
    lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    btnClose?.focus();
  }

  function closeLb() {
    if (lb.hidden) return;
    lb.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", openLb);
  btnClose?.addEventListener("click", closeLb);
  btnIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.3).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage?.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.classList.add("is-dragging");
    lbStage.setPointerCapture(e.pointerId);
  });
  lbStage?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  lbStage?.addEventListener("pointerup", () => {
    dragging = false;
    lbStage.classList.remove("is-dragging");
  });
  lbStage?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.7, Math.min(3, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLb();
  });
}
