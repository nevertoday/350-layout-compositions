// 开场主角玩具：可调比例 × 可点选 × 2D Canvas 实时视线与结构可视化
// 状态单一干净：{ split(16..64), active(0..4), done(Set), pulse(0..1) }
// 纯 2D Canvas + 原生语义化 HTML 控件：WebGL 关闭完全一致，慢手机与软件渲染同样丝滑。
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { TOPICS, clamp, snapSplit, splitZone } from "./model.js";

const $ = (id) => document.getElementById(id);

const C = {
  bg: "#011613",
  panel: "#05201C",
  activeBg: "#0D352E",
  paper: "#F8EBD8",
  paperSoft: "#EFE0C7",
  ink: "#042923",
  muted: "#B9AC98",
  mutedDark: "rgba(37,134,113,0.42)",
  teal: "#207767",
  tealBright: "#2EA08A",
  orange: "#EE610A",
  orangeSoft: "rgba(238,97,10,0.18)",
  sun: "#FAD8B6",
  line: "rgba(4,41,35,0.22)",
};

export function initHero() {
  const stage = $("hero-stage");
  const canvas = $("hero-canvas");
  const divider = $("hero-divider");
  const listEl = $("hero-list");
  const range = $("hero-range");
  const titleEl = $("title");
  const ctaBtn = $("hero-cta");
  const ctx = canvas.getContext("2d");

  const state = {
    split: 32,
    shownSplit: reducedMotion.matches ? 32 : 46, // 开场从偏失衡的 46% 缓缓落位到经典 32%
    active: 0,
    done: new Set(),
    introDone: reducedMotion.matches,
    dragging: false,
    switchAge: 0, // 切换主题后的脉冲动画时间
  };

  let W = 0, H = 0, dpr = 1;

  // 渲染右侧详情文本 + 左侧按钮选中态 + 读数条
  const items = [...listEl.querySelectorAll(".hl-item")];
  const presetBtns = [...document.querySelectorAll("[data-split]")];
  const prinBars = [...document.querySelectorAll(".hp-bar i")];

  function updateDetailDOM() {
    const topic = TOPICS[state.active];
    $("hd-eyebrow").textContent = topic.eyebrow;
    $("hd-title").textContent = topic.zh;
    $("hd-desc").textContent = topic.summary;
    const isDone = state.done.has(topic.id);
    ctaBtn.textContent = isDone ? topic.actionDone : `${topic.action} →`;
    ctaBtn.dataset.done = isDone ? "1" : "0";
    items.forEach((btn, i) => {
      const sel = i === state.active;
      btn.setAttribute("aria-selected", String(sel));
      btn.classList.toggle("is-active", sel);
      btn.classList.toggle("is-done", state.done.has(TOPICS[i].id));
    });
    prinBars.forEach((el, i) => {
      el.style.setProperty("--w", `${Math.round(topic.bars[i] * 100)}%`);
    });
  }

  function updateRatioUI(val) {
    const pct = Math.round(val);
    const detailPct = 100 - pct;
    const z = splitZone(pct);
    stage.style.setProperty("--split", `${val.toFixed(2)}%`);
    stage.dataset.zone = z.key;
    titleEl.style.setProperty("--split", `${val.toFixed(2)}%`);
    $("hero-ratio-num").textContent = `${pct}% : ${detailPct}%`;
    const chip = $("hero-zone-chip");
    chip.textContent = z.label;
    chip.dataset.zone = z.key;
    $("hero-read-text").textContent = z.text;
    range.value = String(pct);
    divider.setAttribute("aria-valuenow", String(pct));
    divider.setAttribute("aria-valuetext", `列表占 ${pct}%，详情占 ${detailPct}%，${z.label}`);
    presetBtns.forEach((b) => {
      b.setAttribute("aria-pressed", String(Math.abs(+b.dataset.split - pct) <= 1));
    });
  }

  function setSplit(next, { snap = true, fromUser = true } = {}) {
    if (fromUser) state.introDone = true;
    const clamped = clamp(next, 16, 64);
    state.split = snap ? snapSplit(clamped) : Math.round(clamped * 10) / 10;
    if (reducedMotion.matches) state.shownSplit = state.split;
    updateRatioUI(state.split);
    draw();
  }

  function setActive(index) {
    state.introDone = true;
    state.active = (index + TOPICS.length) % TOPICS.length;
    state.switchAge = 0;
    updateDetailDOM();
    draw();
  }

  // ---------- 2D Canvas 绘制：右栏内的活海报图示 ----------
  // 画海报原版经典嵌套图（暗小列表 + 橙虚线箭头 + 亮米框内太阳深绿山峰 + 标题条 + 橙色行动按钮），
  // 并随着当前选中的主题（0..4）和左右分栏比例（state.shownSplit）实时变化！
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function frame(t, dt, { still }) {
    if (!W || !H) return;

    // 缓动分栏比例：开场 0.9s 前平滑落向 32%，拖动时紧跟手指
    if (still) {
      state.shownSplit = state.split;
      state.switchAge = 1;
    } else {
      const target = state.introDone ? state.split : t > 0.35 ? 32 : 46;
      if (!state.introDone && t > 1.3) state.introDone = true;
      const rate = state.dragging ? 28 : 8.5;
      const k = dt ? 1 - Math.exp(-dt * rate) : 0;
      state.shownSplit += (target - state.shownSplit) * k;
      if (Math.abs(target - state.shownSplit) < 0.04) state.shownSplit = target;
      state.switchAge = Math.min(1, state.switchAge + dt * 1.4);
      if (!state.introDone) {
        stage.style.setProperty("--split", `${state.shownSplit.toFixed(2)}%`);
        titleEl.style.setProperty("--split", `${state.shownSplit.toFixed(2)}%`);
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 画布本身位于右侧详情纸面内：底色透明直接复用暖米纸
    const pad = Math.max(8, Math.min(W * 0.03, 14));
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;

    // 根据真实 split 计算小示意图里的左小列表与右详情卡的比例，直观反映「列表宽窄如何影响详情空间」
    const splitFrac = clamp(state.shownSplit / 100, 0.16, 0.64);
    const gap = Math.max(14, Math.min(innerW * 0.06, 26));
    const miniListW = clamp(innerW * splitFrac, innerW * 0.18, innerW * 0.6);
    const miniDetailW = Math.max(40, innerW - miniListW - gap);
    const listX = pad;
    const listY = pad;
    const detailX = listX + miniListW + gap;
    const detailY = pad;

    const z = splitZone(state.shownSplit);
    const activeIdx = state.active;
    const pulse = still ? 0.65 : (t * 0.55) % 1;

    // 1. 左侧迷你暗列表（呼应海报中段黑卡片）
    roundRect(listX, listY, miniListW, innerH, 10);
    ctx.fillStyle = C.bg;
    ctx.fill();

    // 画 4 行迷你条目，对应 activeIdx 映射到 0..3
    const rowCount = 4;
    const rowPadX = Math.max(6, miniListW * 0.09);
    const rowPadY = Math.max(8, innerH * 0.06);
    const rowH = (innerH - rowPadY * 2) / rowCount;
    const mappedRow = activeIdx % rowCount;
    let activeCenterY = listY + rowPadY + rowH * (mappedRow + 0.5);

    for (let i = 0; i < rowCount; i++) {
      const ry = listY + rowPadY + i * rowH;
      const isSel = i === mappedRow;
      if (isSel) {
        roundRect(listX + 4, ry + 2, miniListW - 8, rowH - 4, 6);
        ctx.fillStyle = C.activeBg;
        ctx.fill();
        // 左侧亮橙竖杠
        ctx.fillStyle = C.orange;
        ctx.fillRect(listX + 4, ry + 6, 3, rowH - 12);
      }
      const dotR = clamp(Math.min(rowH * 0.21, miniListW * 0.1), 4, 8.5);
      const dotX = listX + rowPadX + dotR + 2;
      const dotY = ry + rowH * 0.5;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? C.orange : C.teal;
      ctx.fill();

      // 右侧文字条：如果列表太窄（< 24%），文字条明显截断并标橙警
      const barX = dotX + dotR + Math.max(5, miniListW * 0.06);
      const avail = listX + miniListW - rowPadX - barX;
      if (avail > 8) {
        const w1 = avail * (isSel ? 0.92 : 0.72 - (i % 2) * 0.1);
        const w2 = avail * (isSel ? 0.58 : 0.48);
        ctx.fillStyle = isSel ? C.orange : C.mutedDark;
        roundRect(barX, dotY - 5, Math.max(4, w1), 4, 2);
        ctx.fill();
        ctx.fillStyle = isSel ? C.sun : "rgba(37,134,113,0.28)";
        roundRect(barX, dotY + 2.5, Math.max(3, w2), 3, 1.5);
        ctx.fill();
      }
    }

    // 列表过宽时的浪费空间斜线提示
    if (z.key === "wide" && miniListW > innerW * 0.46) {
      ctx.save();
      roundRect(listX + miniListW * 0.62, listY + 6, miniListW * 0.34, innerH - 12, 6);
      ctx.clip();
      ctx.strokeStyle = "rgba(238,97,10,0.22)";
      ctx.lineWidth = 1;
      for (let d = -innerH; d < miniListW; d += 10) {
        ctx.beginPath();
        ctx.moveTo(listX + miniListW * 0.62 + d, listY);
        ctx.lineTo(listX + miniListW * 0.62 + d - innerH * 0.5, listY + innerH);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. 右侧迷你详情卡片（海报原版浅米框 + 橙天米日深绿山峰）
    roundRect(detailX, detailY, miniDetailW, innerH, 10);
    ctx.fillStyle = "#FCF4E7";
    ctx.fill();
    ctx.strokeStyle = z.key === "wide" ? "rgba(238,97,10,0.65)" : C.line;
    ctx.lineWidth = z.key === "wide" ? 1.5 : 1;
    ctx.stroke();

    const dPad = Math.max(8, Math.min(miniDetailW * 0.08, 16));
    const artX = detailX + dPad;
    const artY = detailY + dPad;
    const artW = Math.max(20, miniDetailW - dPad * 2);
    const artH = innerH * 0.48;

    // 按当前 5 个主题微调主图视觉隐喻，同时保留 267 海报标志性的橙底 + 暖圆 + 深绿几何语言
    ctx.save();
    roundRect(artX, artY, artW, artH, 4);
    ctx.clip();

    // 橙色背景画布
    ctx.fillStyle = C.orange;
    ctx.fillRect(artX, artY, artW, artH);

    const reveal = still ? 1 : clamp(state.switchAge * 1.25, 0, 1);
    const ease = 1 - Math.pow(1 - reveal, 3);

    if (activeIdx === 0) {
      // 概念定义：海报原版「暖米圆日 + 深墨绿山峰」
      const sunR = Math.min(artW, artH) * 0.28;
      ctx.fillStyle = C.sun;
      ctx.beginPath();
      ctx.arc(artX + artW * 0.34, artY + artH * (0.52 + (1 - ease) * 0.14), sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(artX + artW * 0.34, artY + artH);
      ctx.lineTo(artX + artW * 0.68, artY + artH * (0.28 + (1 - ease) * 0.25));
      ctx.lineTo(artX + artW * 0.98, artY + artH);
      ctx.closePath();
      ctx.fill();
    } else if (activeIdx === 1) {
      // 结构关系：一对多比例网格与节点连线
      ctx.fillStyle = C.ink;
      ctx.fillRect(artX, artY, artW * splitFrac, artH);
      ctx.strokeStyle = C.sun;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(artX + artW * splitFrac, artY);
      ctx.lineTo(artX + artW * splitFrac, artY + artH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.sun;
      ctx.beginPath();
      ctx.arc(artX + artW * splitFrac * 0.5, artY + artH * 0.5, Math.min(artW, artH) * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FCF4E7";
      const rx = artX + artW * splitFrac + 10;
      const rw = Math.max(8, artW * (1 - splitFrac) - 20);
      roundRect(rx, artY + artH * 0.22, rw * ease, artH * 0.56, 3);
      ctx.fill();
    } else if (activeIdx === 2) {
      // 视觉层级：三层递进金字塔（呼应海报「主次」图标）
      const cx = artX + artW * 0.5;
      const baseW = Math.min(artW * 0.68, artH * 1.25);
      const topY = artY + artH * 0.16;
      const h3 = (artH * 0.7) / 3;
      const layers = [
        { fill: C.ink, y0: topY, y1: topY + h3 - 3, w0: 0, w1: baseW * 0.34 },
        { fill: C.teal, y0: topY + h3, y1: topY + h3 * 2 - 3, w0: baseW * 0.38, w1: baseW * 0.68 },
        { fill: C.sun, y0: topY + h3 * 2, y1: topY + h3 * 3, w0: baseW * 0.72, w1: baseW },
      ];
      layers.forEach((L, idx) => {
        const dy = (1 - ease) * (10 + idx * 6);
        ctx.fillStyle = L.fill;
        ctx.beginPath();
        ctx.moveTo(cx - L.w0 / 2, L.y0 + dy);
        ctx.lineTo(cx + L.w0 / 2, L.y0 + dy);
        ctx.lineTo(cx + L.w1 / 2, L.y1 + dy);
        ctx.lineTo(cx - L.w1 / 2, L.y1 + dy);
        ctx.closePath();
        ctx.fill();
      });
    } else if (activeIdx === 3) {
      // 内容组织：卡片模块矩阵（左缩略 + 右多区块）
      const cols = 3;
      const bw = (artW - 24 - (cols - 1) * 6) / cols;
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = c === 0 ? C.ink : c === 1 ? C.sun : C.teal;
        const bh = artH * (0.45 + (c === 1 ? 0.22 : 0.1)) * ease;
        roundRect(artX + 12 + c * (bw + 6), artY + artH - 12 - bh, Math.max(6, bw), Math.max(6, bh), 3);
        ctx.fill();
      }
    } else {
      // 交互引导：点击波纹 + 连续切换轨迹
      const cx = artX + artW * 0.5;
      const cy = artY + artH * 0.5;
      const maxR = Math.min(artW, artH) * 0.42;
      for (let k = 0; k < 3; k++) {
        const rr = maxR * (((pulse + k / 3) % 1) * 0.75 + 0.25);
        ctx.strokeStyle = k === 0 ? C.sun : C.ink;
        ctx.globalAlpha = 1 - rr / (maxR * 1.15);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(5, maxR * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 主图下方的标题条、正文灰条与右下橙色主行动按钮（忠实复刻海报结构）
    const titleY = artY + artH + Math.max(8, innerH * 0.055);
    ctx.fillStyle = C.ink;
    roundRect(artX, titleY, artW * 0.56, Math.max(6, innerH * 0.04), 2);
    ctx.fill();

    // 右下亮橙主行动按钮 CTA（点完外面的真实按钮后变为青绿已确认！）
    const btnW = clamp(artW * 0.26, 26, 56);
    const btnH = clamp(innerH * 0.085, 11, 17);
    const btnX = artX + artW - btnW;
    const btnY = detailY + innerH - dPad - btnH;

    const lineGap = Math.max(7, innerH * 0.05);
    const lineWidths = [0.95, 0.86, 0.72];
    ctx.fillStyle = C.muted;
    lineWidths.forEach((lw, idx) => {
      const ly = titleY + Math.max(12, innerH * 0.09) + idx * lineGap;
      if (ly + 5 < btnY - 5) {
        roundRect(artX, ly, artW * lw, 3.5, 1.5);
        ctx.fill();
      }
    });

    const isDone = state.done.has(TOPICS[activeIdx].id);
    ctx.fillStyle = isDone ? C.teal : C.orange;
    roundRect(btnX, btnY, btnW, btnH, 3);
    ctx.fill();

    // 3. 海报灵魂：跨越暗列表与亮纸面的「橙色虚线箭头」+ 流动视线光点
    const arrowStartX = listX + miniListW + 2;
    const arrowEndX = detailX + 3;
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = still ? 0 : -t * 18;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, activeCenterY);
    ctx.lineTo(arrowEndX - 5, activeCenterY);
    ctx.stroke();
    ctx.setLineDash([]);
    // 箭头尖
    ctx.beginPath();
    ctx.moveTo(arrowEndX - 7, activeCenterY - 4.5);
    ctx.lineTo(arrowEndX - 1, activeCenterY);
    ctx.lineTo(arrowEndX - 7, activeCenterY + 4.5);
    ctx.stroke();

    // 流动的视线焦点脉冲点（沿着「列表选中点 → 虚线桥 → 右侧主图 → 右下 CTA」轻盈扫过）
    const pts = [
      [listX + miniListW * 0.5, activeCenterY],
      [arrowEndX + 8, activeCenterY],
      [artX + artW * 0.5, artY + artH * 0.52],
      [btnX + btnW * 0.5, btnY + btnH * 0.5],
    ];
    const seg = pulse * (pts.length - 1);
    const i0 = Math.min(pts.length - 2, Math.floor(seg));
    const frac = seg - i0;
    const px = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * frac;
    const py = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * frac;

    ctx.fillStyle = "rgba(238,97,10,0.28)";
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF5E8";
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const { draw } = loop(stage, frame);

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = pixelRatio(2);
    if (W > 0 && H > 0) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      draw();
    }
  }
  new ResizeObserver(resize).observe(canvas);

  // ---------- 交互绑定 ----------
  // 1. 列表点击 + 键盘上下导航
  items.forEach((btn, i) => {
    btn.addEventListener("click", () => setActive(i));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (i + 1) % items.length;
        setActive(next);
        items[next].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (i - 1 + items.length) % items.length;
        setActive(prev);
        items[prev].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        setActive(items.length - 1);
        items[items.length - 1].focus();
      }
    });
  });

  // 2. 右侧详情主行动按钮 CTA
  ctaBtn.addEventListener("click", () => {
    const topic = TOPICS[state.active];
    if (topic.id === "interaction") {
      setActive(0);
      return;
    }
    if (state.done.has(topic.id)) state.done.delete(topic.id);
    else state.done.add(topic.id);
    updateDetailDOM();
    draw();
  });

  // 3. 中轴分栏分隔条拖动（同时支持 pointer 与 touch，标记了 data-perf-drag 供 perf 测试）
  const pctFromClientX = (clientX) => {
    const r = stage.getBoundingClientRect();
    return ((clientX - r.left) / Math.max(1, r.width)) * 100;
  };

  let activePtr = null;
  divider.addEventListener("pointerdown", (e) => {
    activePtr = e.pointerId;
    state.dragging = true;
    state.introDone = true;
    try { divider.setPointerCapture(e.pointerId); } catch {}
    stage.classList.add("is-dragging");
    setSplit(pctFromClientX(e.clientX), { snap: false });
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (activePtr !== e.pointerId) return;
    setSplit(pctFromClientX(e.clientX), { snap: false });
  });
  const endPointer = (e) => {
    if (activePtr !== e.pointerId) return;
    activePtr = null;
    state.dragging = false;
    stage.classList.remove("is-dragging");
    setSplit(state.split, { snap: true });
  };
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  // 键盘调整分隔条
  divider.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 5 : 2;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setSplit(state.split - step, { snap: false });
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setSplit(state.split + step, { snap: false });
    } else if (e.key === "Home") {
      e.preventDefault();
      setSplit(16, { snap: false });
    } else if (e.key === "End") {
      e.preventDefault();
      setSplit(64, { snap: false });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSplit(32, { snap: true });
    }
  });

  // 4. 滑块与预设按钮
  range.addEventListener("input", () => setSplit(+range.value, { snap: false }));
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => setSplit(+btn.dataset.split, { snap: true }));
  });

  updateDetailDOM();
  updateRatioUI(32);
  resize();
}
