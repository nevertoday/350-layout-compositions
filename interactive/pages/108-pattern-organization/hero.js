import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE } from "./palette.js";
import {
  GRID_COLS,
  GRID_ROWS,
  KINDS,
  PRESETS,
  QUAD_LABELS,
  RULES,
  analyzePattern,
  createBrokenState,
  renderTapestry,
} from "./model.js";

function cellSvg(cell) {
  const bg = `<rect width="100" height="100" fill="${PALETTE.emerald}"/>`;
  if (!cell || cell.kind === "empty") {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${bg}<rect x="18" y="18" width="64" height="64" fill="none" stroke="rgba(245,233,209,0.22)" stroke-width="2" stroke-dasharray="6 5"/></svg>`;
  }
  if (cell.kind === "square") {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${bg}<rect x="12" y="12" width="76" height="76" fill="${PALETTE.gold}"/></svg>`;
  }
  if (cell.kind === "circle") {
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${bg}<circle cx="50" cy="50" r="38" fill="${PALETTE.gold}"/></svg>`;
  }
  // arc: rot 0=TL, 1=TR, 2=BR, 3=BL
  const rot = ((cell.rot || 0) % 4 + 4) % 4;
  const paths = [
    "M 6,6 L 94,6 A 88,88 0 0 1 6,94 Z",
    "M 94,6 L 94,94 A 88,88 0 0 1 6,6 Z",
    "M 94,94 L 6,94 A 88,88 0 0 1 94,6 Z",
    "M 6,94 L 6,6 A 88,88 0 0 1 94,94 Z",
  ];
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${bg}<path d="${paths[rot]}" fill="${PALETTE.cream}"/></svg>`;
}

export function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const state = createBrokenState();
  let analysis = analyzePattern(state);
  let lastLayout = null;
  let hoverTile = null;
  let intro = 0;
  let dirty = true;
  let draggingRail = false;

  // DOM 引用
  const titleStrip = document.getElementById("title-tile-strip");
  const quadBtns = [...document.querySelectorAll("[data-quad]")];
  const kindBtns = [...document.querySelectorAll("[data-kind]")];
  const rotateBtn = document.getElementById("btn-rotate-quad");
  const ruleBtns = [...document.querySelectorAll("[data-rule]")];
  const seamBtn = document.getElementById("btn-toggle-seams");
  const subCornerBtn = document.getElementById("btn-sub-corner");
  const subClearBtn = document.getElementById("btn-sub-clear");
  const glareBtn = document.getElementById("btn-try-glare");
  const resetBtn = document.getElementById("btn-reset-broken");

  const rail = document.getElementById("seam-rail");
  const railFill = document.getElementById("seam-rail-fill");
  const railThumb = document.getElementById("seam-thumb");
  const railVal = document.getElementById("seam-offset-val");

  const scoreBadge = document.getElementById("hero-score-badge");
  const mobileScore = document.getElementById("mobile-score-badge");
  const diagBox = document.getElementById("hero-diag");
  const diagBadge = document.getElementById("diag-badge");
  const diagHead = document.getElementById("diag-headline");
  const diagDetail = document.getElementById("diag-detail");
  const diagHint = document.getElementById("diag-hint");

  const mInk = document.getElementById("m-ink");
  const mCont = document.getElementById("m-cont");
  const mOff = document.getElementById("m-off");
  const mSub = document.getElementById("m-sub");
  const activeQuadName = document.getElementById("active-quad-name");

  const lamps = {
    module: {
      el: document.getElementById("lamp-module"),
      val: document.getElementById("lamp-module-val"),
    },
    tile: {
      el: document.getElementById("lamp-tile"),
      val: document.getElementById("lamp-tile-val"),
    },
    continuity: {
      el: document.getElementById("lamp-continuity"),
      val: document.getElementById("lamp-continuity-val"),
    },
    expansion: {
      el: document.getElementById("lamp-expansion"),
      val: document.getElementById("lamp-expansion-val"),
    },
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const maxDpr = rect.width <= 460 ? 1.5 : 2;
    const dpr = pixelRatio(maxDpr);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      dirty = true;
    }
  }

  function updateUI() {
    analysis = analyzePattern(state);
    dirty = true;

    // 标题下方 4 格实时示范条（标题即示范）
    if (titleStrip) {
      titleStrip.innerHTML = state.cells
        .map((c, idx) => `<span class="title-mini-cell" data-i="${idx}">${cellSvg(c)}</span>`)
        .join("");
    }

    // 2×2 母砖雕刻格
    quadBtns.forEach((btn, i) => {
      const cell = state.cells[i];
      const active = state.activeQuad === i;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.setAttribute(
        "aria-label",
        `${QUAD_LABELS[i]}象限：${KINDS[cell.kind].full}${cell.kind === "arc" ? `（朝向 ${cell.rot * 90}°）` : ""}`
      );
      btn.innerHTML = `${cellSvg(cell)}<span class="quad-tag">${QUAD_LABELS[i]}</span>`;
    });

    const curCell = state.cells[state.activeQuad];
    if (activeQuadName) {
      activeQuadName.textContent = `${QUAD_LABELS[state.activeQuad]} · ${KINDS[curCell.kind].full}`;
    }

    kindBtns.forEach((btn) => {
      const k = btn.dataset.kind;
      const on = curCell.kind === k;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    if (rotateBtn) {
      const isArc = curCell.kind === "arc";
      rotateBtn.disabled = !isArc;
      rotateBtn.setAttribute("aria-disabled", String(!isArc));
    }

    // 对称规则按钮
    ruleBtns.forEach((btn) => {
      const on = btn.dataset.rule === state.rule;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    if (seamBtn) {
      seamBtn.classList.toggle("is-on", state.showSeams);
      seamBtn.setAttribute("aria-pressed", String(state.showSeams));
      seamBtn.textContent = state.showSeams ? "缝标：开" : "缝标：关";
    }

    // 错缝推移轨
    const pct = Math.round(state.rowOffset * 100);
    if (railThumb) {
      railThumb.style.left = `${state.rowOffset * 100}%`;
      railThumb.setAttribute("aria-valuenow", String(pct));
      railThumb.setAttribute("aria-valuetext", `奇数行错缝 ${pct}%`);
    }
    if (railFill) {
      railFill.style.width = `${state.rowOffset * 100}%`;
    }
    if (railVal) {
      railVal.textContent = `${pct}% · ${analysis.checks.tile.state}`;
      railVal.dataset.state = analysis.checks.tile.ok ? "ok" : "fault";
    }

    // 四枚原海报几何关键词实况灯
    for (const [k, item] of Object.entries(lamps)) {
      const chk = analysis.checks[k];
      if (item.el) {
        item.el.dataset.state = chk.ok ? "ok" : "fault";
      }
      if (item.val) {
        item.val.textContent = chk.state;
      }
    }

    // 总分与诊单
    const scoreTxt = `${analysis.passed} / 4`;
    if (scoreBadge) {
      scoreBadge.textContent = `${scoreTxt} ${analysis.passed === 4 ? "达标" : "待组织"}`;
      scoreBadge.dataset.state = analysis.level;
    }
    if (mobileScore) {
      mobileScore.textContent = scoreTxt;
      mobileScore.dataset.state = analysis.level;
    }
    if (diagBox) diagBox.dataset.state = analysis.level;
    if (diagBadge) diagBadge.textContent = analysis.badge;
    if (diagHead) diagHead.textContent = analysis.headline;
    if (diagDetail) diagDetail.textContent = analysis.detail;
    if (diagHint) diagHint.textContent = analysis.hint;

    if (mInk) mInk.textContent = `${analysis.inkPct}%`;
    if (mCont) mCont.textContent = `${analysis.continuityPct}%（${analysis.crossSeamCount} 处）`;
    if (mOff) mOff.textContent = `${analysis.offsetPct}%`;
    if (mSub) mSub.textContent = `${analysis.subCount} / ${GRID_COLS * GRID_ROWS}（${analysis.subPct}%）`;
  }

  // 2×2 母砖点击：若点击已选中的弧则直接顺时针转 90°；否则选中该象限
  quadBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.quad);
      if (state.activeQuad === idx) {
        const c = state.cells[idx];
        if (c.kind === "arc") {
          c.rot = (c.rot + 1) % 4;
        } else {
          // 轮换形体：square -> arc -> circle -> empty -> square
          const order = ["arc", "circle", "square", "empty"];
          const next = order[(order.indexOf(c.kind) + 1) % order.length];
          c.kind = next;
          if (next === "arc") c.rot = idx === 0 ? 0 : idx === 1 ? 1 : idx === 3 ? 2 : 3;
        }
      } else {
        state.activeQuad = idx;
      }
      updateUI();
      runner.draw();
    });
  });

  // 形体选择器
  kindBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.kind;
      const c = state.cells[state.activeQuad];
      if (c.kind === "arc" && k === "arc") {
        c.rot = (c.rot + 1) % 4;
      } else {
        c.kind = k;
        if (k === "arc") {
          const i = state.activeQuad;
          c.rot = i === 0 ? 0 : i === 1 ? 1 : i === 3 ? 2 : 3;
        }
      }
      updateUI();
      runner.draw();
    });
  });

  rotateBtn?.addEventListener("click", () => {
    const c = state.cells[state.activeQuad];
    if (c.kind === "arc") {
      c.rot = (c.rot + 1) % 4;
      updateUI();
      runner.draw();
    }
  });

  // 2×2 键盘快捷键（方向键切换象限、R 旋转弧向、Space 换形）
  document.getElementById("master-tile-grid")?.addEventListener("keydown", (e) => {
    const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
    if (e.key in map) {
      e.preventDefault();
      state.activeQuad = (state.activeQuad + map[e.key] + 4) % 4;
      quadBtns[state.activeQuad]?.focus();
      updateUI();
      runner.draw();
    } else if (e.key === "r" || e.key === "R") {
      const c = state.cells[state.activeQuad];
      if (c.kind === "arc") {
        e.preventDefault();
        c.rot = (c.rot + 1) % 4;
        updateUI();
        runner.draw();
      }
    }
  });

  // 对称规则切换
  ruleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = btn.dataset.rule;
      if (!RULES[r]) return;
      state.rule = r;
      // 切到 cm 时自然吸附到 50% 半砖错缝，切回 pmm/p4 若原本歪斜则保持或让用户亲手拉轨？
      // 保持用户当前错缝，让规则与错缝解耦可试错；但若已在 0% 切到 cm 则顺手带到 50%
      if (r === "cm" && state.rowOffset < 0.06) state.rowOffset = 0.5;
      updateUI();
      runner.draw();
    });
  });

  seamBtn?.addEventListener("click", () => {
    state.showSeams = !state.showSeams;
    updateUI();
    runner.draw();
  });

  subCornerBtn?.addEventListener("click", () => {
    // 复刻原海报右下 2×2 区域密分
    const corner = ["2,4", "2,5", "3,4", "3,5"];
    const allOn = corner.every((k) => state.subdivided.includes(k));
    if (allOn) {
      state.subdivided = state.subdivided.filter((k) => !corner.includes(k));
    } else {
      state.subdivided = [...new Set([...state.subdivided, ...corner])];
    }
    updateUI();
    runner.draw();
  });

  subClearBtn?.addEventListener("click", () => {
    state.subdivided = [];
    updateUI();
    runner.draw();
  });

  glareBtn?.addEventListener("click", () => {
    Object.assign(state, PRESETS.glare());
    updateUI();
    runner.draw();
  });

  resetBtn?.addEventListener("click", () => {
    Object.assign(state, createBrokenState());
    updateUI();
    runner.draw();
  });

  // 织锦画布直点切换 2× 密分
  function hitTileFromEvent(e) {
    if (!lastLayout) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { originX, originY, tileSize } = lastLayout;
    const r = Math.floor((y - originY) / tileSize);
    if (r < 0 || r >= GRID_ROWS) return null;
    const off = ((state.rowOffset % 1) + 1) % 1;
    const shiftPx = r % 2 === 1 ? off * tileSize : 0;
    const rawC = Math.floor((x - originX - shiftPx) / tileSize);
    if (rawC < 0 || rawC >= GRID_COLS) return null;
    return { r, c: rawC };
  }

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const hit = hitTileFromEvent(e);
    const same = hit?.r === hoverTile?.r && hit?.c === hoverTile?.c;
    if (!same) {
      hoverTile = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
      dirty = true;
      runner.draw();
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (hoverTile) {
      hoverTile = null;
      dirty = true;
      runner.draw();
    }
  });

  canvas.addEventListener("click", (e) => {
    const hit = hitTileFromEvent(e);
    if (!hit) return;
    const key = `${hit.r},${hit.c}`;
    if (state.subdivided.includes(key)) {
      state.subdivided = state.subdivided.filter((k) => k !== key);
    } else {
      state.subdivided = [...state.subdivided, key];
    }
    updateUI();
    runner.draw();
  });

  // 错缝推移轨（data-perf-drag，支持鼠标、触控与键盘）
  function setOffsetFromClientX(clientX, snap = false) {
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    let v = (clientX - rect.left) / Math.max(1, rect.width);
    v = Math.max(0, Math.min(1, v));
    if (snap) {
      if (v < 0.045) v = 0;
      else if (v > 0.955) v = 1;
      else if (Math.abs(v - 0.5) < 0.045) v = 0.5;
    }
    state.rowOffset = Number(v.toFixed(3));
    updateUI();
    runner.draw();
  }

  function startRailDrag(e) {
    draggingRail = true;
    railThumb?.classList.add("is-dragging");
    if (e.pointerId != null && rail?.setPointerCapture) {
      try { rail.setPointerCapture(e.pointerId); } catch {}
    }
    setOffsetFromClientX(e.clientX, false);
  }

  function moveRailDrag(e) {
    if (!draggingRail) return;
    setOffsetFromClientX(e.clientX, false);
  }

  function endRailDrag(e) {
    if (!draggingRail) return;
    draggingRail = false;
    railThumb?.classList.remove("is-dragging");
    if (e.clientX != null) setOffsetFromClientX(e.clientX, true);
  }

  if (rail) {
    rail.addEventListener("pointerdown", startRailDrag);
    rail.addEventListener("pointermove", moveRailDrag);
    rail.addEventListener("pointerup", endRailDrag);
    rail.addEventListener("pointercancel", endRailDrag);
  }

  railThumb?.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      state.rowOffset = Math.max(0, Number((state.rowOffset - step).toFixed(3)));
      updateUI();
      runner.draw();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      state.rowOffset = Math.min(1, Number((state.rowOffset + step).toFixed(3)));
      updateUI();
      runner.draw();
    }
  });

  // 渲染循环（遵循 GUIDE.md：只看 still 决定跳过开场，不拿 dt===0 判终点）
  const runner = loop(canvas, (_t, dt, { still }) => {
    resizeCanvas();
    if (still) {
      if (intro < 1) {
        intro = 1;
        dirty = true;
      }
    } else if (intro < 1) {
      intro = Math.min(1, intro + (dt > 0 ? dt * 1.45 : 0.04));
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.save();
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    lastLayout = renderTapestry(ctx, rect.width, rect.height, state, analysis, {
      progress: intro,
      highlightTile: hoverTile,
    });
    ctx.restore();
  });

  new ResizeObserver(() => {
    resizeCanvas();
    dirty = true;
    runner.draw();
  }).observe(canvas);

  updateUI();
  runner.draw();
}
