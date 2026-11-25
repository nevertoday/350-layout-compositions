// 章节 01、03、04、05、06、07 互动实验 + 章节 08 原海报放大拖动灯箱 + 滚动显隐

import { reducedMotion } from "../../lib/stage.js";
import { evaluateCalibrator, QUIZ_OPTIONS } from "./model.js";

const $ = (id) => document.getElementById(id);

// 01: 原海报五词条排法切换 + 扫描走廊显影
export function initAnatomyLab() {
  const spec = $("poster-spec");
  const read = $("anatomy-read");
  const corridorBtn = $("anatomy-corridor");
  const COPY = {
    hanging: "悬挂缩进：五个珊瑚红圆点与术语「版式、对比、对齐、留白、层级」顶在左基线上，所有释义续行统一内缩 3.5 em 至解释首字下方，视线贴着左边缘直落就能一秒锁定条目。",
    flush: "齐左无缩进：所有行齐刷刷贴死同一条左线，词头和上一条的残句连成整片灰墙，找「留白」或「层级」时必须挨行看进去。",
    first: "首行缩进（反方向）：圆点与术语反而退进段落里，左侧最显眼的边线上全是不重要的续行文字，彻底丧失检索入口。",
  };

  function render() {
    const mode = document.querySelector('input[name="anatomy"]:checked')?.value || "hanging";
    spec.dataset.mode = mode;
    read.textContent = COPY[mode];
  }

  $("anatomy-mode").addEventListener("change", render);
  corridorBtn.addEventListener("click", () => {
    const next = corridorBtn.getAttribute("aria-pressed") !== "true";
    corridorBtn.setAttribute("aria-pressed", String(next));
    spec.dataset.corridor = String(next);
  });
  render();
}

// 03: 悬挂深度 × 版心栏宽 压力测试台
export function initCalibratorLab() {
  const indentInput = $("cal-indent");
  const measureInput = $("cal-measure");
  const indentOut = $("cal-indent-out");
  const measureOut = $("cal-measure-out");
  const stage = $("cal-stage");
  const sheet = $("cal-sheet");
  const entriesEl = $("cal-entries");
  const cmHang = $("cm-hang");
  const cmRem = $("cm-rem");
  const tag = $("cal-tag");
  const summary = $("cal-summary");
  const paperBtn = $("cal-paper");

  const DATA = {
    plain: [
      { mk: "", head: "【版式】", body: "在有限空间中组织文字与图形的方式与逻辑，以建立信息层级与视觉秩序，提升可读性与专注度。" },
      { mk: "", head: "【对齐】", body: "将元素沿同一基线或边缘对齐，建立稳定与统一，减少视觉噪音，令版面更清晰。" },
      { mk: "", head: "【层级】", body: "用大小、位置与对比区分主次关系，帮助受众快速理解信息结构与阅读路径。" },
    ],
    marker: [
      { mk: "[01]", head: "首行顶格", body: "让序号紧贴版心左缘，所有条目入口排成一条利落的垂线，扫描零犹豫。" },
      { mk: "[02]", head: "续行对齐", body: "第二行从正文首字正下方起排，避免文字滑回序号底下打断编号列。" },
      { mk: "[03]", head: "窄栏收束", body: "移动端栏宽变窄时，适当缩减悬挂量或改用轻编号，保住续行的阅读呼吸。" },
    ],
  };

  function render() {
    const indent = parseFloat(indentInput.value);
    const measure = parseFloat(measureInput.value);
    const mode = document.querySelector('input[name="cal-mode"]:checked')?.value || "plain";

    indentOut.textContent = `${indent.toFixed(1)} em`;
    measureOut.textContent = `${measure} em`;
    sheet.style.setProperty("--hang", `${indent}em`);
    sheet.style.setProperty("--measure", `${measure}em`);

    const remain = Math.max(4, measure - indent);
    cmHang.textContent = `缩进 ${indent.toFixed(1)}em`;
    cmRem.textContent = `续行宽 ${remain.toFixed(1)}em`;

    entriesEl.innerHTML = DATA[mode]
      .map(
        (d) =>
          `<p class="cal-entry">${d.mk ? `<span class="mk">${d.mk}</span>` : ""}<b>${d.head}</b>　${d.body}</p>`
      )
      .join("");

    const ev = evaluateCalibrator(indent, measure, mode);
    tag.textContent = ev.tag;
    tag.dataset.status = ev.status;
    summary.textContent = ev.summary;
  }

  indentInput.addEventListener("input", render);
  measureInput.addEventListener("input", render);
  $("cal-mode").addEventListener("change", () => {
    const mode = document.querySelector('input[name="cal-mode"]:checked')?.value || "plain";
    // 切到带编号时提示对齐点，但不锁死用户后续拖动
    indentInput.value = mode === "marker" ? "2.6" : "2.0";
    render();
  });
  paperBtn.addEventListener("click", () => {
    const light = paperBtn.getAttribute("aria-pressed") !== "true";
    paperBtn.setAttribute("aria-pressed", String(light));
    stage.dataset.paper = light ? "light" : "dark";
    paperBtn.textContent = light ? "切回深紫底" : "切换纸面预览";
  });
  render();
}

// 04: 三种悬挂结构对比（标准悬挂 / 编号外挂 / 定宽词头列）
export function initStructLab() {
  const stage = $("struct-stage");
  const list = $("struct-list");
  const read = $("struct-read");
  const xrayBtn = $("struct-xray");

  const ITEMS = [
    { mk: "01.", k: "对齐", v: "将元素沿同一基线或边缘对齐，建立稳定与统一，减少视觉噪音。" },
    { mk: "02.", k: "非对称字体排版", v: "当词头长短悬殊时，定宽左列会被最长词撑宽或被迫折行，而标准悬挂缩进依然从容自然。" },
    { mk: "03.", k: "留白", v: "有意识地保留空白区域，为内容提供呼吸感，增强可读性并传达克制气质。" },
  ];

  const DESC = {
    standard: "标准悬挂缩进：不管词头是两个字「对齐」还是七个字「非对称字体排版」，首行都自然流淌，所有续行统一内缩 2.2 em——最适合书目、词典与词头长短不一的条目。",
    marker: "编号外挂（列表悬挂）：只把等宽序号「01. / 02. / 03.」留在左侧走廊里，续行严格对准正文第一字；这是浏览器默认 outside 列表与法条清单的几何骨架构成。",
    sidehead: "定宽词头列（键值两栏）：适合像原海报那样词头字数整齐（全是两字术语）的场景；一旦出现超长词头「非对称字体排版」，左列就会折行或挤占正文宽度。",
  };

  function render() {
    const kind = document.querySelector('input[name="struct"]:checked')?.value || "standard";
    stage.dataset.kind = kind;
    if (kind === "standard") {
      list.innerHTML = ITEMS.map((it) => `<div class="st-row is-standard"><strong>${it.k}</strong>　${it.v}</div>`).join("");
    } else if (kind === "marker") {
      list.innerHTML = ITEMS.map(
        (it) => `<div class="st-row is-marker"><span class="st-mk">${it.mk}</span><strong>${it.k}</strong>　${it.v}</div>`
      ).join("");
    } else {
      list.innerHTML = ITEMS.map(
        (it) => `<div class="st-row is-sidehead"><span class="st-k">${it.k}</span><span class="st-v">${it.v}</span></div>`
      ).join("");
    }
    read.textContent = DESC[kind];
  }

  $("struct-seg").addEventListener("change", render);
  xrayBtn.addEventListener("click", () => {
    const next = xrayBtn.getAttribute("aria-pressed") !== "true";
    xrayBtn.setAttribute("aria-pressed", String(next));
    stage.dataset.xray = String(next);
  });
  render();
}

// 05: CSS 真缩进 vs 手动回车空格 窄屏折行测试
export function initCodeLab() {
  const narrow = $("narrow-range");
  const narrowOut = $("narrow-out");
  const fakeBox = $("fake-box");
  const realBox = $("real-box");
  const narrowRead = $("narrow-read");
  const snippet = $("css-snippet");

  const SNIPPETS = {
    classic: `/* 通用兼容写法（全平台生效） */
.entry {
  padding-left: 2em;  /* 整体右移 */
  text-indent: -2em;  /* 首行拉回 */
}`,
    modern: `/* W3C CSS Text Level 3 原生
   Safari 15+ / Firefox 121+ / Chrome 146+ */
.entry {
  text-indent: 2em hanging;
}`,
  };

  function render() {
    const w = parseInt(narrow.value, 10);
    const syn = document.querySelector('input[name="css-syntax"]:checked')?.value || "classic";
    narrowOut.textContent = `${w}%`;
    fakeBox.style.setProperty("--narrow", `${w}%`);
    realBox.style.setProperty("--narrow", `${w}%`);
    snippet.textContent = SNIPPETS[syn];

    if (w >= 94) {
      narrowRead.textContent = `当前栏宽 ${w}%：宽屏下假空格还能勉强伪装整齐。把滑块往左拉到 76% 以下，立刻能看到它露馅。`;
    } else if (w >= 72) {
      narrowRead.textContent = `栏宽收窄到 ${w}%：左侧手动回车提前截断了第一行，留下碎掉的半截残句；右侧真正悬挂缩进重新折行，左侧走廊一丝不乱。`;
    } else {
      narrowRead.textContent = `窄栏 ${w}%（接近手机竖屏）：假空格那栏已经彻底失控，空行与错位交错；右侧用段落规则计算的悬挂缩进依然条理清晰。`;
    }
  }

  narrow.addEventListener("input", render);
  $("css-syntax").addEventListener("change", render);
  render();
}

// 06: 错配体验（散文 vs 参考文献互换缩进方向）
export function initMismatchLab() {
  const grid = $("mismatch-grid");
  const proseTag = $("mm-prose-tag");
  const bibTag = $("mm-bib-tag");
  const read = $("mismatch-read");

  function render() {
    const st = document.querySelector('input[name="mismatch"]:checked')?.value || "right";
    grid.dataset.state = st;
    if (st === "right") {
      proseTag.textContent = "首行缩进 ✓";
      bibTag.textContent = "悬挂缩进 ✓";
      read.textContent = "各归其位：随笔开头轻收两格，视线顺滑地往下读；参考文献把三位作者姓氏（Bringhurst、De Vinne、Johnson）推在最左，竖向一扫即得。";
    } else {
      proseTag.textContent = "误用悬挂 ×";
      bibTag.textContent = "误用首行 ×";
      read.textContent = "互换之后立刻别扭：随笔每段第一行像标题一样硬顶出来，打断阅读呼吸；参考文献的作者姓氏缩进坑里，最左缘露出的反而是毫无检索意义的出版地与书名残片。";
    }
  }

  $("mismatch-seg").addEventListener("change", render);
  render();
}

// 07: 小练习
export function initQuiz() {
  const quiz = $("quiz");
  const verdict = $("quiz-verdict");
  const vTitle = $("quiz-title");
  const vText = $("quiz-text");
  const buttons = [...quiz.querySelectorAll(".q-opt")];

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.opt;
      const info = QUIZ_OPTIONS[choice];
      if (!info) return;

      quiz.classList.add("answered");
      buttons.forEach((b) => {
        const k = b.dataset.opt;
        const isPick = k === choice;
        const isRight = QUIZ_OPTIONS[k].correct;
        b.setAttribute("aria-pressed", String(isPick));
        b.classList.toggle("is-correct", isRight);
        b.classList.toggle("is-wrong", isPick && !isRight);
        const mark = b.querySelector(".q-mark");
        if (mark) mark.textContent = isRight ? "✓ 标准" : isPick ? "× 偏误" : "";
      });

      verdict.classList.toggle("is-wrong", !info.correct);
      vTitle.textContent = info.title;
      vText.textContent = info.text;
    });
  });
}

// 08: 原海报灯箱（放大、拖动、双击缩放、Esc 关闭，只复用 #poster.src 不多内联图片）
export function initLightbox() {
  const posterImg = $("poster");
  const openBtn = $("poster-btn");
  const lb = $("lightbox");
  const lbStage = $("lb-stage");
  const lbImg = $("lb-img");
  const closeBtn = $("lb-close");
  const zoomBtn = $("lb-zoom");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomBtn.setAttribute("aria-pressed", String(scale > 1));
    zoomBtn.textContent = scale > 1 ? "还原 1×" : "放大 1.8×";
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  function toggleZoom() {
    scale = scale > 1 ? 1 : 1.8;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomBtn.addEventListener("click", toggleZoom);
  lbImg.addEventListener("dblclick", toggleZoom);

  lbStage.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    e.preventDefault();
    try {
      lbStage.setPointerCapture(e.pointerId);
    } catch {}
    lbStage.classList.add("dragging");
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  const endPan = (e) => {
    if (!drag || (e.pointerId != null && e.pointerId !== drag.id)) return;
    drag = null;
    lbStage.classList.remove("dragging");
  };
  window.addEventListener("pointerup", endPan);
  window.addEventListener("pointercancel", endPan);
  lbStage.addEventListener("lostpointercapture", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}

// 滚动渐显（遵循 prefers-reduced-motion）
export function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
  );
  nodes.forEach((n) => io.observe(n));
}
