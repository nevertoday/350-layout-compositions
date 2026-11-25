// 03 节 玄墨暗室：4×3 活体 CSS grid-template-areas 涂色器 + Tab 焦点步进走查
// 直接涂色规划 a/b/c/d 四个命名区域，实时校验 CSS Grid 矩形合法性、输出代码并验证 WCAG 1.3.2 阅读/焦点顺序。

const AREA_META = {
  a: { code: "01", name: "a · 主视觉", color: "#FAF2E9", fg: "#0D0B0D", order: 0 },
  b: { code: "02", name: "b · 专题卡", color: "#EF649A", fg: "#0D0B0D", order: 1 },
  c: { code: "03", name: "c · 辅助栏", color: "#F5C3D4", fg: "#0D0B0D", order: 2 },
  d: { code: "04", name: "d · 收束条", color: "#382D35", fg: "#FAF2E9", order: 3 },
};

const PRESETS = {
  poster: [
    ["a", "a", "a", "a"],
    ["b", "b", "c", "c"],
    ["d", "d", "d", "d"],
  ],
  sidebar: [
    ["a", "a", "b", "b"],
    ["a", "a", "c", "c"],
    ["a", "a", "d", "d"],
  ],
  lshape: [
    ["a", "a", "a", "b"],
    ["a", "c", "c", "b"],
    ["d", "d", "d", "d"],
  ],
  inverted: [
    ["d", "d", "d", "d"],
    ["b", "b", "c", "c"],
    ["a", "a", "a", "a"],
  ],
};

function cloneGrid(g) {
  return g.map((row) => [...row]);
}

export function initGridPainter() {
  const board = document.getElementById("grid-board");
  const codeEl = document.getElementById("grid-css-code");
  const statusEl = document.getElementById("grid-status");
  const svgOverlay = document.getElementById("grid-focus-svg");
  const tabStepBtn = document.getElementById("grid-tab-step");
  const brushWrap = document.getElementById("grid-brushes");
  const presetWrap = document.getElementById("grid-presets");
  if (!board || !codeEl || !statusEl) return;

  let grid = cloneGrid(PRESETS.poster);
  let brush = "a";
  let focusStep = -1; // -1 关闭, 0..3 对应 DOM 01..04

  function analyzeGrid() {
    const keys = ["a", "b", "c", "d"];
    const boxes = {};
    const badAreas = [];

    for (const k of keys) {
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid[r][c] === k) cells.push({ r, c });
        }
      }
      if (!cells.length) {
        boxes[k] = null;
        continue;
      }
      const minR = Math.min(...cells.map((x) => x.r));
      const maxR = Math.max(...cells.map((x) => x.r));
      const minC = Math.min(...cells.map((x) => x.c));
      const maxC = Math.max(...cells.map((x) => x.c));
      const expected = (maxR - minR + 1) * (maxC - minC + 1);
      let solid = cells.length === expected;
      if (solid) {
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            if (grid[r][c] !== k) solid = false;
          }
        }
      }
      boxes[k] = {
        minR,
        maxR,
        minC,
        maxC,
        cx: (minC + maxC + 1) / 2 / 4,
        cy: (minR + maxR + 1) / 2 / 3,
        valid: solid,
      };
      if (!solid) badAreas.push(k);
    }

    const present = keys.filter((k) => boxes[k]);
    const visual = [...present].sort((x, y) => {
      const bx = boxes[x];
      const by = boxes[y];
      if (bx.minR !== by.minR) return bx.minR - by.minR;
      return bx.minC - by.minC;
    });

    let inversions = 0;
    for (let i = 0; i < visual.length; i++) {
      for (let j = i + 1; j < visual.length; j++) {
        if (AREA_META[visual[i]].order > AREA_META[visual[j]].order) inversions++;
      }
    }

    return { boxes, badAreas, present, visual, inversions };
  }

  function render() {
    const info = analyzeGrid();
    board.innerHTML = "";

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const k = grid[r][c];
        const meta = AREA_META[k];
        const isBad = info.badAreas.includes(k);
        const isFocus = focusStep >= 0 && AREA_META[k].order === focusStep;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `gp-cell${isBad ? " is-bad" : ""}${isFocus ? " is-focus" : ""}`;
        btn.style.backgroundColor = meta.color;
        btn.style.color = meta.fg;
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        btn.setAttribute("aria-label", `第 ${r + 1} 行第 ${c + 1} 列，当前区域 ${meta.code} ${k}`);
        btn.innerHTML = `<span class="gp-code">${meta.code}</span><span class="gp-key">${k}</span>`;
        btn.addEventListener("click", () => {
          grid[r][c] = brush;
          render();
        });
        board.appendChild(btn);
      }
    }

    // 生成真实 CSS
    const lines = grid.map((row) => `    "${row.join(" ")}"`).join("\n");
    codeEl.textContent = `.container {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  grid-template-areas:\n${lines};\n}`;

    // 状态诊语
    if (info.badAreas.length) {
      statusEl.dataset.tone = "err";
      statusEl.innerHTML =
        `<b>区域 ${info.badAreas.join("、")} 不是完整矩形：</b>` +
        `CSS Grid 规定每个命名区域必须构成单一闭合矩形；出现 L 形或断开格子时，浏览器会直接丢弃整条 grid-template-areas 声明。`;
    } else if (info.present.length < 4) {
      const missing = ["a", "b", "c", "d"].filter((k) => !info.present.includes(k));
      statusEl.dataset.tone = "warn";
      statusEl.innerHTML =
        `<b>还有区域未落位（缺 ${missing.join("、")}）：</b>` +
        `记得在 4×3 格子里为每个模块留出合法矩形区域。`;
    } else if (info.inversions > 0) {
      const seq = info.visual.map((k) => AREA_META[k].code).join(" → ");
      statusEl.dataset.tone = "err";
      statusEl.innerHTML =
        `<b>矩形语法合法，但视觉序变成 ${seq}（逆序 ${info.inversions} 处）：</b>` +
        `按 Tab 步进可看到焦点在网格里反向上跳；在未全面支持 CSS reading-flow 前，不要用区域重排去颠倒主次阅读顺序。`;
    } else {
      statusEl.dataset.tone = "ok";
      statusEl.innerHTML =
        `<b>语法合法且阅读序 01 → 02 → 03 → 04 零逆序：</b>` +
        `仅改这 3 行区域图，就能在不改任何 HTML 结构的前提下把单列无缝切换成这套宽屏骨架。`;
    }

    // 绘制 Tab 焦点步进叠加层
    if (svgOverlay) {
      const pts = ["a", "b", "c", "d"]
        .filter((k) => info.boxes[k])
        .map((k) => ({ k, ...info.boxes[k], code: AREA_META[k].code }));
      let paths = "";
      if (focusStep >= 0 && pts.length >= 2) {
        const upto = Math.min(focusStep, pts.length - 1);
        for (let i = 0; i < upto; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const x1 = p1.cx * 400;
          const y1 = p1.cy * 240;
          const x2 = p2.cx * 400;
          const y2 = p2.cy * 240;
          const back = y2 < y1 - 8 || (Math.abs(y2 - y1) <= 8 && x2 < x1 - 8);
          paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${back ? "#FF8599" : "#6EE7B7"}" stroke-width="4" stroke-dasharray="${back ? "8 5" : "none"}" stroke-linecap="round"/>`;
        }
        const cur = pts[upto];
        if (cur) {
          paths += `<circle cx="${cur.cx * 400}" cy="${cur.cy * 240}" r="14" fill="#CF2F70" stroke="#FAF2E9" stroke-width="3"/>`;
          paths += `<text x="${cur.cx * 400}" y="${cur.cy * 240 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="JetBrains Mono, monospace" font-weight="700">T${upto + 1}</text>`;
        }
      }
      svgOverlay.innerHTML = paths;
    }

    if (tabStepBtn) {
      tabStepBtn.textContent =
        focusStep < 0
          ? "步进 Tab 焦点（从 01 开始）"
          : focusStep < 3
            ? `下一步焦点 → T${focusStep + 2}（0${focusStep + 2}）`
            : "清除焦点路径";
    }
  }

  brushWrap?.querySelectorAll("button[data-brush]").forEach((btn) => {
    btn.addEventListener("click", () => {
      brush = btn.dataset.brush;
      brushWrap.querySelectorAll("button[data-brush]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.brush === brush));
      });
    });
  });

  presetWrap?.querySelectorAll("button[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      grid = cloneGrid(p);
      focusStep = btn.dataset.preset === "inverted" ? 3 : -1;
      presetWrap.querySelectorAll("button[data-preset]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render();
    });
  });

  tabStepBtn?.addEventListener("click", () => {
    focusStep = focusStep >= 3 ? -1 : focusStep + 1;
    render();
  });

  render();
}
