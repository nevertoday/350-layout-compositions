// 01 节三模式对照、05 节场景速判卡、06 节单变量四选一练习、07 节原海报灯箱

// ---------- 01 节：291 / 292 / 293 同屏跨视口对照 ----------
export function initPatternComparator() {
  const wrap = document.getElementById("cmp-stage");
  const widthBtns = document.getElementById("cmp-widths");
  const noteEl = document.getElementById("cmp-note");
  if (!wrap || !widthBtns || !noteEl) return;

  const WIDTHS = {
    375: {
      label: "375px 手机",
      note: "在 375px 窄屏上，三种模式往往看起来都是单列线性堆叠——真正的分水岭出现在屏幕变宽之后。",
      fluid: [
        { id: "01", x: 10, y: 8, w: 180, h: 32, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 10, y: 46, w: 180, h: 28, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 10, y: 80, w: 180, h: 28, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 10, y: 114, w: 180, h: 24, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      drop: [
        { id: "01", x: 10, y: 8, w: 180, h: 32, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 10, y: 46, w: 180, h: 28, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 10, y: 80, w: 180, h: 28, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 10, y: 114, w: 180, h: 24, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      shift: [
        { id: "01", x: 10, y: 8, w: 180, h: 32, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 10, y: 46, w: 180, h: 28, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 10, y: 80, w: 180, h: 28, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 10, y: 114, w: 180, h: 24, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      tags: ["单列满宽 · 无外边距", "全部 4 列已下落成单列", "线性顺序布局（切换前）"],
    },
    768: {
      label: "768px 平板",
      note: "到达 768px 后分化显现：大体流动开始并排两列；列下落让 01/02 并排、03/04 留在下方；布局切换则直接把 01 升格为跨宽主模块，02/03 结成非对称副排。",
      fluid: [
        { id: "01", x: 14, y: 8, w: 172, h: 52, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 14, y: 66, w: 83, h: 36, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 103, y: 66, w: 83, h: 36, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 14, y: 108, w: 172, h: 30, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      drop: [
        { id: "01", x: 10, y: 8, w: 112, h: 86, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 128, y: 8, w: 62, h: 86, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 10, y: 100, w: 88, h: 38, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 104, y: 100, w: 86, h: 38, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      shift: [
        { id: "01", x: 10, y: 8, w: 180, h: 52, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 10, y: 66, w: 108, h: 42, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 124, y: 66, w: 66, h: 42, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 10, y: 114, w: 180, h: 24, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      tags: ["等分流式伸缩", "03/04 仍在下方未归列", "触发 1+2+1 模块重组"],
    },
    1120: {
      label: "1120px 桌面",
      note: "到 1120px 大屏：大体流动靠左右锁宽留白收束；列下落把四根竖列铺满一排；唯有布局切换把四个模块彻底重组为有主有次的复合网格。",
      fluid: [
        { id: "01", x: 32, y: 8, w: 136, h: 52, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 32, y: 66, w: 65, h: 38, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 103, y: 66, w: 65, h: 38, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 32, y: 110, w: 136, h: 28, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      drop: [
        { id: "01", x: 10, y: 8, w: 62, h: 130, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 76, y: 8, w: 40, h: 130, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 120, y: 8, w: 34, h: 130, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 158, y: 8, w: 32, h: 130, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      shift: [
        { id: "01", x: 10, y: 8, w: 102, h: 130, f: "#0D0B0D", fg: "#FAF2E9" },
        { id: "02", x: 118, y: 8, w: 72, h: 52, f: "#EF649A", fg: "#0D0B0D" },
        { id: "03", x: 118, y: 66, w: 72, h: 34, f: "#FAF2E7", fg: "#0D0B0D" },
        { id: "04", x: 118, y: 106, w: 72, h: 32, f: "#FAF2E7", fg: "#0D0B0D" },
      ],
      tags: ["左右外边距撑开锁宽", "四列齐头并排无重组", "左主右三·结构全面切换"],
    },
  };

  function svgFor(items) {
    return items
      .map(
        (b) =>
          `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.f}" stroke="#0D0B0D" stroke-opacity="0.22" stroke-width="1"/>` +
          `<text x="${b.x + 6}" y="${b.y + 14}" fill="${b.fg}" font-size="10" font-family="Archivo, sans-serif" font-weight="700">${b.id}</text>`
      )
      .join("");
  }

  function render(wKey) {
    const data = WIDTHS[wKey];
    if (!data) return;
    const svgs = wrap.querySelectorAll("svg.cmp-svg");
    const tags = wrap.querySelectorAll(".cmp-tag");
    const sets = [data.fluid, data.drop, data.shift];
    svgs.forEach((s, i) => {
      s.innerHTML = `<rect x="1" y="1" width="198" height="144" fill="none" stroke="#B6AAA2" stroke-dasharray="3 3"/>${svgFor(sets[i])}`;
    });
    tags.forEach((t, i) => {
      t.textContent = data.tags[i];
    });
    noteEl.textContent = data.note;
  }

  widthBtns.querySelectorAll("button[data-w]").forEach((btn) => {
    btn.addEventListener("click", () => {
      widthBtns.querySelectorAll("button[data-w]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render(btn.dataset.w);
    });
  });

  render("768");
}

// ---------- 05 节：场景速判翻转卡 ----------
export function initScenarioCards() {
  const cards = document.querySelectorAll(".sc-card");
  cards.forEach((card) => {
    const btn = card.querySelector(".sc-toggle");
    const detail = card.querySelector(".sc-back");
    if (!btn || !detail) return;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      detail.hidden = open;
      btn.textContent = open ? "查看结构研判" : "收起研判";
    });
  });
}

// ---------- 06 节：单变量四选一练习 ----------
export function initPracticeQuiz() {
  const btns = document.querySelectorAll(".quiz-opt");
  const verdict = document.getElementById("quiz-verdict");
  const titleEl = document.getElementById("quiz-v-title");
  const textEl = document.getElementById("quiz-v-text");
  if (!btns.length || !verdict || !titleEl || !textEl) return;

  const FEEDBACK = {
    A: {
      ok: false,
      title: "方案 A：只是把线性列表拉宽了（伪切换）",
      text: "1024px 宽屏里 01–04 仍然各占一整行，主副面积比停在 1.0×，既没让核心模块 01 放大聚焦，也没让 02/03 并肩对照。想借宽屏重组层级时，这不算布局切换。",
    },
    B: {
      ok: true,
      title: "方案 B 正确：断点合理、结构真重组、序次零冲突",
      text: "375px 手机稳守 343px 单列线性流；跨过 720px 后重组为 1+2+1 模块网，主副面积比拉开到 2.1×，01 居顶主位、视觉序 01→02→03→04 与 DOM 完全一致，且全程保留 01–04 编号和几何标识。",
    },
    C: {
      ok: false,
      title: "方案 C：主次倒挂，视觉序变成 04→02→03→01（逆序 5 处）",
      text: "网格骨架和断点本身没问题，但把次要的 04 搬上顶部主位、把 01 塞到底条。DOM 顺序仍是 01→02→03→04，键盘 Tab 焦点会从底部突然飞回顶部，视线和焦点互相打架。",
    },
    D: {
      ok: false,
      title: "方案 D：断点设得太低（340px），把手机屏硬挤碎了",
      text: "宽屏模块和阅读序都对，唯独把切换断点压到 340px。结果 375px 手机被迫切进 6:4 双列，右侧 03 卡片最窄只剩 135px，标题和正文都会被挤成碎条。",
    },
  };

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;
      const fb = FEEDBACK[choice];
      if (!fb) return;
      btns.forEach((b) => {
        const k = b.dataset.choice;
        b.setAttribute("aria-pressed", String(b === btn));
        b.classList.toggle("is-correct", k === "B");
        b.classList.toggle("is-picked-wrong", b === btn && k !== "B");
        b.classList.add("is-revealed");
      });
      verdict.dataset.state = fb.ok ? "ok" : "wrong";
      titleEl.textContent = fb.title;
      textEl.textContent = fb.text;
    });
  });
}

// ---------- 07 节：原海报放大灯箱（支持拖动、缩放、Esc 关） ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const img = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomBtn = document.getElementById("poster-zoom");
  const stage = document.getElementById("poster-modal-stage");
  if (!trigger || !img || !modal || !modalImg || !closeBtn || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    modalImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomBtn) zoomBtn.textContent = scale > 1.05 ? "还原 1×" : "放大 2×";
  }

  function openModal() {
    modalImg.src = img.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  zoomBtn?.addEventListener("click", () => {
    scale = scale > 1.05 ? 1 : 2;
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (scale <= 1.05) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
  stage.addEventListener("pointercancel", () => {
    dragging = false;
  });
}
