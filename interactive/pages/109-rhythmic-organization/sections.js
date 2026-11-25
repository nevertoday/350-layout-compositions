// 正文 01–08 节全部独立互动模块（每节控件互不雷同，全部离线可跑、键盘可操作）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  ACCENT_CHANNELS,
  GAP_SIZES,
  QUIZ_OPTIONS,
  evaluateAccentBudget,
  evaluateGapBoard,
} from "./model.js";

// =====================================================================
// 01｜为什么平铺不是节奏：三态对照显影拉幕 + 示意视线速度波形 (2D Canvas)
// =====================================================================
export function initCompareSection() {
  const canvas = document.getElementById("compare-canvas");
  const modeBtns = [...document.querySelectorAll("[data-compare-mode]")];
  const splitRange = document.getElementById("compare-split");
  const splitVal = document.getElementById("compare-split-val");
  const caption = document.getElementById("compare-caption");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const MODES = {
    even: {
      title: "机械均分 · 只有重复",
      note: "12 根柱同高同距，视线速度像一条拉直的心电图（示意），眼睛滑过却留不下记忆点。",
      heights: [0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46, 0.46],
      gaps: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      accents: [],
      speeds: [0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52],
    },
    rhythm: {
      title: "节奏组织 · 重复 + 疏密重音",
      note: "窄缝区视线轻快滑过、遇冰青重音与宽缝主动减速停顿，速度曲线出现规律起伏（示意）。",
      heights: [0.30, 0.44, 0.34, 0.96, 0.30, 0.44, 0.34, 0.98, 0.32, 0.46, 0.34, 1.0],
      gaps: [1.34, 0.76, 0.72, 1.82, 1.30, 0.74, 0.72, 1.84, 1.28, 0.76, 0.72],
      accents: [3, 7, 11],
      speeds: [0.45, 0.84, 0.90, 0.24, 0.46, 0.86, 0.90, 0.22, 0.48, 0.84, 0.88, 0.20],
    },
    chaos: {
      title: "失序散乱 · 变化失控",
      note: "高矮与空隙随机乱跳，大脑抓不到周期底盘，视线在骤停与跳空之间疲于奔命（示意）。",
      heights: [0.92, 0.22, 0.78, 0.30, 0.96, 0.90, 0.18, 0.62, 0.95, 0.26, 0.84, 0.34],
      gaps: [0.55, 2.35, 0.62, 0.58, 1.95, 0.50, 2.55, 0.68, 0.52, 1.85, 0.65],
      accents: [0, 4, 5, 8, 10],
      speeds: [0.92, 0.18, 0.88, 0.95, 0.26, 0.96, 0.15, 0.82, 0.94, 0.32, 0.85, 0.70],
    },
  };

  let rightMode = "rhythm";
  let split = 0.5;

  function toPositions(gaps) {
    const sum = gaps.reduce((a, b) => a + b, 0);
    const out = [0];
    let acc = 0;
    for (const g of gaps) {
      acc += g / sum;
      out.push(acc);
    }
    out[out.length - 1] = 1;
    return out;
  }

  function drawSide(spec, w, h, clipX0, clipX1, isRight) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX0, 0, clipX1 - clipX0, h);
    ctx.clip();

    ctx.fillStyle = isRight ? "#080D1B" : "#111624";
    ctx.fillRect(clipX0, 0, clipX1 - clipX0, h);

    const padX = w < 440 ? 22 : 38;
    const usableW = w - padX * 2;
    const baseY = h - 38;
    const maxBarH = h * 0.42;
    const curveTop = 36;
    const curveH = h * 0.26;

    // 速度参考基线
    ctx.strokeStyle = "rgba(149, 164, 200, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, curveTop + curveH);
    ctx.lineTo(w - padX, curveTop + curveH);
    ctx.stroke();

    const pos = toPositions(spec.gaps);
    const barW = Math.max(8, Math.min(18, usableW / 28));

    // 上方示意视线速度曲线
    ctx.strokeStyle = spec === MODES.chaos ? "#FF6B5B" : spec === MODES.rhythm ? "#6DE1FE" : "#7C8FB8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pos.length; i++) {
      const px = padX + pos[i] * usableW;
      const py = curveTop + (1 - spec.speeds[i]) * curveH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 速度节点与柱体
    for (let i = 0; i < pos.length; i++) {
      const px = padX + pos[i] * usableW;
      const py = curveTop + (1 - spec.speeds[i]) * curveH;
      const isAcc = spec.accents.includes(i);

      ctx.fillStyle = isAcc
        ? spec === MODES.chaos
          ? "#FF6B5B"
          : "#6DE1FE"
        : "#2954F2";
      const bh = spec.heights[i] * maxBarH;
      ctx.fillRect(px - barW * 0.5, baseY - bh, barW, bh);

      // 底部脉冲圆点
      ctx.beginPath();
      ctx.arc(px, baseY + 16, isAcc ? 6.2 : 3.0, 0, Math.PI * 2);
      ctx.fill();

      // 速度曲线点
      ctx.fillStyle = isAcc ? "#F7F2E8" : "#95A4C8";
      ctx.beginPath();
      ctx.arc(px, py, isAcc ? 3.5 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(210, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    const cutX = Math.round(w * split);
    drawSide(MODES.even, w, h, 0, cutX, false);
    drawSide(MODES[rightMode], w, h, cutX, w, true);

    // 显影分界线
    ctx.strokeStyle = "#F7F2E8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutX + 0.5, 0);
    ctx.lineTo(cutX + 0.5, h);
    ctx.stroke();

    // 左右顶标
    ctx.font = `600 11px "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    if (cutX > 90) {
      ctx.fillStyle = "#C5CFE6";
      ctx.textAlign = "left";
      ctx.fillText("左：机械均分（对照基准）", 12, 10);
    }
    if (w - cutX > 110) {
      ctx.fillStyle = rightMode === "chaos" ? "#FF8A7D" : "#99FEFF";
      ctx.textAlign = "right";
      ctx.fillText(`右：${MODES[rightMode].title}`, w - 12, 10);
    }
    ctx.restore();
  }

  function updateUI() {
    modeBtns.forEach((b) => {
      const active = b.dataset.compareMode === rightMode;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("is-active", active);
    });
    if (splitVal) splitVal.textContent = `${Math.round(split * 100)}%`;
    if (caption) {
      caption.textContent = `${MODES[rightMode].title} — ${MODES[rightMode].note}`;
    }
    render();
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      rightMode = b.dataset.compareMode;
      updateUI();
    })
  );

  if (splitRange) {
    splitRange.addEventListener("input", () => {
      split = Number(splitRange.value) / 100;
      updateUI();
    });
  }

  // 允许在显影幕上水平拖动拉帘（不阻断竖屏上下滚）
  let dragging = false;
  let startX = 0;
  let startY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientY - startY) > Math.abs(e.clientX - startX) + 8) {
      dragging = false;
      return;
    }
    const r = canvas.getBoundingClientRect();
    split = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / Math.max(1, r.width)));
    if (splitRange) splitRange.value = String(Math.round(split * 100));
    updateUI();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  const handle = loop(canvas, () => render());
  window.addEventListener("resize", () => handle.draw());
  updateUI();
}

// =====================================================================
// 02｜间隔决定视觉速度：9 拍直点间距切句板（点击 8 枚间隔铰链）
// =====================================================================
export function initGapBoardSection() {
  const board = document.getElementById("gap-board");
  const verdictEl = document.getElementById("gap-verdict");
  const patternEl = document.getElementById("gap-pattern");
  const ratioEl = document.getElementById("gap-ratio");
  const presetBtns = [...document.querySelectorAll("[data-gap-preset]")];
  if (!board) return;

  const PRESETS = {
    even: [1, 1, 1, 1, 1, 1, 1, 1],
    breath: [0, 0, 2, 0, 2, 0, 0, 1],
    accel: [2, 2, 1, 1, 0, 0, 0, 0],
    broken: [0, 1, 0, 3, 0, 1, 0, 1],
  };

  let gaps = [...PRESETS.breath];
  const blockHeights = [36, 52, 74, 42, 68, 38, 54, 46, 84];

  function render() {
    const res = evaluateGapBoard(gaps);
    board.innerHTML = "";

    // 标出每个块属于第几乐句（交替蓝/冰青顶条）
    const blockPhrase = new Array(9).fill(0);
    res.phrases.forEach((p, idx) => p.forEach((bi) => (blockPhrase[bi] = idx)));

    for (let i = 0; i < 9; i++) {
      const col = document.createElement("div");
      col.className = "gap-beat";
      col.dataset.phrase = String(blockPhrase[i] % 2);
      col.innerHTML = `<span class="gap-bar" style="height:${blockHeights[i]}px"></span><span class="gap-idx">${i + 1}</span>`;
      board.appendChild(col);

      if (i < 8) {
        const meta = GAP_SIZES[gaps[i]];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `gap-hinge gap-lv-${gaps[i]}`;
        btn.style.setProperty("--gap-w", `${meta.px}px`);
        btn.setAttribute("aria-label", `第 ${i + 1} 与 ${i + 2} 拍间距：${meta.label}（${meta.tag}），点击切换`);
        btn.innerHTML = `<span class="gap-hinge-line"></span><span class="gap-hinge-tag">${meta.label}</span>`;
        btn.addEventListener("click", () => {
          gaps[i] = (gaps[i] + 1) % GAP_SIZES.length;
          render();
        });
        board.appendChild(btn);
      }
    }

    if (patternEl) patternEl.textContent = res.pattern;
    if (ratioEl) ratioEl.textContent = `${res.ratio.toFixed(1)}×`;
    if (verdictEl) {
      verdictEl.textContent = res.verdict;
      verdictEl.dataset.tone = res.tone;
    }
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.gapPreset;
      if (!PRESETS[key]) return;
      gaps = [...PRESETS[key]];
      presetBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

// =====================================================================
// 03｜重音塑造阅读层次：四维重音通道 × 重音通胀警戒仪
// =====================================================================
export function initAccentSection() {
  const track = document.getElementById("accent-track");
  const channelBtns = [...document.querySelectorAll("[data-accent-channel]")];
  const countBtns = [...document.querySelectorAll("[data-accent-count]")];
  const channelDesc = document.getElementById("accent-channel-desc");
  const statusEl = document.getElementById("accent-status");
  const headlineEl = document.getElementById("accent-headline");
  const detailEl = document.getElementById("accent-detail");
  if (!track) return;

  let channel = "size";
  let count = 3;

  // 均匀挑选重音下标（保证每个挡位呈现典型布局）
  const PICK_MAP = {
    0: [],
    2: [3, 9],
    3: [2, 6, 10],
    6: [0, 2, 4, 6, 8, 10],
    10: [0, 1, 2, 3, 5, 6, 7, 8, 10, 11],
  };

  function render() {
    const picked = new Set(PICK_MAP[count] || PICK_MAP[3]);
    const ev = evaluateAccentBudget(count, 12);

    track.dataset.channel = channel;
    track.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const isAcc = picked.has(i);
      const cell = document.createElement("div");
      cell.className = `accent-unit${isAcc ? " is-accent" : ""}${ev.tone === "error" && count >= 6 && isAcc ? " is-over" : ""}`;
      cell.innerHTML = `<span class="accent-pillar"></span><span class="accent-dot"></span>`;
      track.appendChild(cell);
    }

    channelBtns.forEach((b) => {
      const on = b.dataset.accentChannel === channel;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    countBtns.forEach((b) => {
      const on = Number(b.dataset.accentCount) === count;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    if (channelDesc) channelDesc.textContent = ACCENT_CHANNELS[channel].desc;
    if (statusEl) {
      statusEl.textContent = ev.status;
      statusEl.dataset.tone = ev.tone;
    }
    if (headlineEl) headlineEl.textContent = ev.headline;
    if (detailEl) detailEl.textContent = ev.detail;
  }

  channelBtns.forEach((b) =>
    b.addEventListener("click", () => {
      channel = b.dataset.accentChannel;
      render();
    })
  );
  countBtns.forEach((b) =>
    b.addEventListener("click", () => {
      count = Number(b.dataset.accentCount);
      render();
    })
  );

  render();
}

// =====================================================================
// 04｜节奏组织从哪来：年代切换卡 + Paul Klee 1930《Rhythmisches》三拍切分开关
// =====================================================================
export function initHistorySection() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const panels = [...document.querySelectorAll("[data-era-panel]")];
  const kleeGrid = document.getElementById("klee-grid");
  const kleeToggle = document.getElementById("klee-syncopate");
  const kleeNote = document.getElementById("klee-note");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.era;
      tabs.forEach((t) => {
        const on = t.dataset.era === id;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      panels.forEach((p) => {
        p.hidden = p.dataset.eraPanel !== id;
      });
    });
  });

  if (kleeGrid && kleeToggle) {
    let syncopated = true;
    // 复现 Paul Klee 1930《Rhythmisches》(AM 1984-356) 的三拍明暗序列（黑/灰/白）
    // 纯棋盘模式：6 行完全按 0-1-2 重复；切分模式：从第 4 行起故意错拍变宽
    const PURE_ROWS = [
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
    ];
    const SYNC_ROWS = [
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 1, 2, 0, 1, 2, 0, 1],
      [0, 2, 1, 0, 0, 2, 1, 2], // 第 4 行切分破拍
      [1, 0, 2, 1, 2, 0, 0, 1],
      [2, 0, 1, 2, 0, 1, 2, 0],
    ];
    const SYNC_WIDTHS = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1.35, 0.75, 1.1, 0.8, 1.4, 0.8, 1.0, 0.8],
      [0.85, 1.25, 0.9, 1.2, 0.85, 1.35, 0.8, 0.8],
      [1.15, 0.9, 1.2, 0.85, 1.15, 0.85, 1.05, 0.85],
    ];

    function drawKlee() {
      const rows = syncopated ? SYNC_ROWS : PURE_ROWS;
      kleeGrid.innerHTML = "";
      rows.forEach((row, rIdx) => {
        const line = document.createElement("div");
        line.className = "klee-row";
        row.forEach((tone, cIdx) => {
          const cell = document.createElement("span");
          cell.className = `klee-cell klee-t${tone}${syncopated && rIdx >= 3 ? " is-shifted" : ""}`;
          const w = syncopated ? SYNC_WIDTHS[rIdx][cIdx] : 1;
          cell.style.flexGrow = String(w);
          line.appendChild(cell);
        });
        kleeGrid.appendChild(line);
      });
      kleeToggle.textContent = syncopated ? "切回「死板纯三拍棋盘」" : "开启「第 4 行切分破拍」";
      kleeToggle.setAttribute("aria-pressed", String(syncopated));
      if (kleeNote) {
        kleeNote.textContent = syncopated
          ? "当前：切分破拍（自第 4 行起打破固定黑-灰-白三拍与等宽格，画面瞬间有了乐句推进）。"
          : "当前：机械棋盘（6 行完全锁死三拍等宽重复，一眼看完就停住了）。";
      }
    }

    kleeToggle.addEventListener("click", () => {
      syncopated = !syncopated;
      drawKlee();
    });
    drawKlee();
  }
}

// =====================================================================
// 05｜真实版面里的节奏骨架：双题材真实排版 + 原海报脉冲透视层
// =====================================================================
export function initLayoutSandbox() {
  const box = document.getElementById("layout-sandbox");
  const topicBtns = [...document.querySelectorAll("[data-sand-topic]")];
  const paceBtns = [...document.querySelectorAll("[data-sand-pace]")];
  const xrayBtn = document.getElementById("sand-xray");
  const noteEl = document.getElementById("sand-note");
  if (!box) return;

  let topic = "magazine";
  let pace = "rhythm";
  let xray = true;

  const NOTES = {
    flat: "无节奏平铺：所有标题与条目字号、行距、段间距一刀切，读者看半天分不清哪篇是主专题、哪条该先停眼。",
    rhythm: "疏密重音排布：用顶部大留白起势（疏）→ 同类短目紧凑连读（密）→ 章节换气空（疏）→ 主专题加粗提亮（强），原海报骨架直接落地。",
    noisy: "过度炫技失控：每条都放大高亮、间距忽大忽小且无规律，视线在满屏重音里打转，阅读成本飙升。",
  };

  function sync() {
    box.dataset.topic = topic;
    box.dataset.pace = pace;
    box.dataset.xray = xray ? "on" : "off";

    topicBtns.forEach((b) => {
      const on = b.dataset.sandTopic === topic;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    paceBtns.forEach((b) => {
      const on = b.dataset.sandPace === pace;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (xrayBtn) {
      xrayBtn.textContent = xray ? "节奏骨架透视：开" : "节奏骨架透视：关";
      xrayBtn.setAttribute("aria-pressed", String(xray));
      xrayBtn.classList.toggle("is-active", xray);
    }
    if (noteEl) noteEl.textContent = NOTES[pace];
  }

  topicBtns.forEach((b) =>
    b.addEventListener("click", () => {
      topic = b.dataset.sandTopic;
      sync();
    })
  );
  paceBtns.forEach((b) =>
    b.addEventListener("click", () => {
      pace = b.dataset.sandPace;
      sync();
    })
  );
  if (xrayBtn) {
    xrayBtn.addEventListener("click", () => {
      xray = !xray;
      sync();
    });
  }
  sync();
}

// =====================================================================
// 06｜什么时候别强求节奏：4 类「别用」场景对照卡 + 正反微缩版式图示
// =====================================================================
export function initDontUseSection() {
  const cards = [...document.querySelectorAll("[data-avoid-id]")];
  const stage = document.getElementById("avoid-preview");
  const titleEl = document.getElementById("avoid-title");
  const badEl = document.getElementById("avoid-bad");
  const goodEl = document.getElementById("avoid-good");
  const visBad = document.getElementById("avoid-vis-bad");
  const visGood = document.getElementById("avoid-vis-good");
  if (!cards.length || !stage) return;

  const DATA = {
    table: {
      title: "财务与参数核对表",
      bad: "为了「有节奏」故意拉宽几行、放大某几格字号，结果上下列小数点错位，核对效率暴跌。",
      good: "行高与列距严格统一，只在表头与合计行做一次克制分隔——稳态秩序本身就是可读性。",
      visBad: `<div class="mini-tbl is-bad"><div class="mt-r mt-r1"><span>A 项</span><span>1,280.00</span></div><div class="mt-r mt-r2"><span>B 项</span><span>94.50</span></div><div class="mt-r mt-r3"><span>C 项</span><span>12,040.00</span></div></div>`,
      visGood: `<div class="mini-tbl is-good"><div class="mt-r"><span>A 项</span><span>1,280.00</span></div><div class="mt-r"><span>B 项</span><span>94.50</span></div><div class="mt-r mt-sum"><span>合计</span><span>13,414.50</span></div></div>`,
    },
    prose: {
      title: "长篇沉浸式正文段内",
      bad: "在连续阅读的自然段里把行距时紧时松、字距忽宽忽窄，眼睛每次换行都要重新校准焦距。",
      good: "把疏密节奏留给「章节之间」与「图文换气处」，自然段内部必须保持恒定基线与行距。",
      visBad: `<div class="mini-prose is-bad"><i style="width:94%"></i><i style="width:88%;margin-top:2px"></i><i style="width:96%;margin-top:13px"></i><i style="width:76%;margin-top:3px"></i><i style="width:90%;margin-top:15px"></i></div>`,
      visGood: `<div class="mini-prose is-good"><i style="width:92%"></i><i style="width:95%"></i><i style="width:88%"></i><i style="width:94%;margin-top:11px"></i><i style="width:78%"></i></div>`,
    },
    alert: {
      title: "紧急告警与删除确认弹窗",
      bad: "铺陈三拍过渡与装饰性疏密起伏，拖慢用户识别风险与点击确认的速度。",
      good: "单点直给核心后果与主按钮，不玩多拍起承转合。",
      visBad: `<div class="mini-alert is-bad"><span class="ma-chip">步骤一</span><span class="ma-chip">步骤二</span><span class="ma-chip is-accent">永久删除</span></div>`,
      visGood: `<div class="mini-alert is-good"><span class="ma-title">删除后无法恢复</span><span class="ma-btn">确认删除</span></div>`,
    },
    minimal: {
      title: "少于 3 个元素的极简封面",
      bad: "全页总共只有 1 行标题和 1 个徽标，强行插入大小不一的辅助点阵反而显得刻意零碎。",
      good: "节奏需要足够的重复基数才成立；元素极少时直接交给比例与留白决定重心。",
      visBad: `<div class="mini-cover is-bad"><span class="mc-title"></span><span class="mc-noise"><i></i><i></i><i></i><i></i><i></i></span></div>`,
      visGood: `<div class="mini-cover is-good"><span class="mc-title"></span><span class="mc-mark"></span></div>`,
    },
  };

  function select(id) {
    const item = DATA[id] || DATA.table;
    stage.dataset.scenario = id;
    cards.forEach((c) => {
      const on = c.dataset.avoidId === id;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    if (titleEl) titleEl.textContent = item.title;
    if (badEl) badEl.textContent = item.bad;
    if (goodEl) goodEl.textContent = item.good;
    if (visBad) visBad.innerHTML = item.visBad;
    if (visGood) visGood.innerHTML = item.visGood;
  }

  cards.forEach((c) => c.addEventListener("click", () => select(c.dataset.avoidId)));
  select("table");
}

// =====================================================================
// 07｜小练习：单变量 4 选 1 视觉条辨析
// =====================================================================
export function initQuizSection() {
  const grid = document.getElementById("quiz-grid");
  const resultBox = document.getElementById("quiz-result");
  const resetBtn = document.getElementById("quiz-reset");
  if (!grid || !resultBox) return;

  let chosen = null;

  function buildStripSVG(opt) {
    const W = 280;
    const H = 84;
    const padX = 14;
    const usable = W - padX * 2;
    const sumG = opt.gaps.reduce((a, b) => a + b, 0);
    const pos = [0];
    let acc = 0;
    for (const g of opt.gaps) {
      acc += g / sumG;
      pos.push(acc);
    }
    pos[pos.length - 1] = 1;

    const parts = [`<rect x="0" y="0" width="${W}" height="${H}" fill="#050812"/>`];
    parts.push(`<line x1="${padX - 4}" y1="62" x2="${W - padX + 4}" y2="62" stroke="#2D469E" stroke-width="1"/>`);

    pos.forEach((u, i) => {
      const x = padX + u * usable;
      const isAcc = opt.accents.includes(i);
      const bh = Math.round(opt.heights[i] * 46);
      const bw = isAcc ? 9 : 7;
      const fill = isAcc ? (i % 2 === 1 ? "#6DE1FE" : "#2558FF") : "#2442A6";
      parts.push(`<rect x="${(x - bw / 2).toFixed(1)}" y="${62 - bh}" width="${bw}" height="${bh}" fill="${fill}"/>`);
      parts.push(`<circle cx="${x.toFixed(1)}" cy="73" r="${isAcc ? 4.2 : 2.1}" fill="${isAcc ? "#6DE1FE" : "#3560F5"}"/>`);
    });

    return `<svg class="quiz-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${parts.join("")}</svg>`;
  }

  function render() {
    grid.innerHTML = "";
    QUIZ_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.quizOption = opt.id;
      if (chosen) {
        if (opt.id === chosen) btn.classList.add(opt.correct ? "is-correct" : "is-wrong");
        else if (opt.correct) btn.classList.add("is-reveal");
      }
      btn.setAttribute("aria-pressed", String(chosen === opt.id));
      btn.innerHTML = `
        <div class="quiz-card-head">
          <span class="quiz-letter">${opt.label}</span>
          ${
            chosen
              ? `<span class="quiz-tag">${opt.correct ? "正解" : opt.id === chosen ? "已选" : "干扰项"}</span>`
              : ""
          }
        </div>
        ${buildStripSVG(opt)}
      `;
      btn.addEventListener("click", () => {
        chosen = opt.id;
        render();
      });
      grid.appendChild(btn);
    });

    if (!chosen) {
      resultBox.hidden = true;
      if (resetBtn) resetBtn.hidden = true;
      return;
    }

    const picked = QUIZ_OPTIONS.find((o) => o.id === chosen);
    resultBox.hidden = false;
    resultBox.dataset.tone = picked.correct ? "ok" : "error";
    const listHtml = QUIZ_OPTIONS.map(
      (o) =>
        `<li class="${o.correct ? "is-right-item" : ""}"><strong>${o.label}：</strong>${o.reason}</li>`
    ).join("");

    resultBox.innerHTML = `
      <p class="quiz-verdict">${
        picked.correct
          ? `选对了（${picked.label}）：三条核心条件同时成立。`
          : `你选了 ${picked.label}，这一条有一项关键破绽。正确答案是方案 B。`
      }</p>
      <ul class="quiz-breakdown">${listHtml}</ul>
    `;
    if (resetBtn) resetBtn.hidden = false;
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      chosen = null;
      render();
    });
  }

  render();
}

// =====================================================================
// 08｜原海报放大镜与拖拽平移（海报图只引用 #poster.src 一次，不重复内联）
// =====================================================================
export function initPosterModal() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("zoom");
  const view = document.getElementById("zoom-view");
  const img = document.getElementById("zoom-img");
  const level = document.getElementById("zoom-level");
  const btnIn = document.getElementById("zoom-in");
  const btnOut = document.getElementById("zoom-out");
  const btnClose = document.getElementById("zoom-close");
  if (!poster || !dialog || !view || !img) return;

  let k = 1;
  const setZoom = (next, cx = 0.5, cy = 0.5) => {
    const sw = Math.max(1, view.scrollWidth);
    const sh = Math.max(1, view.scrollHeight);
    const fx = (view.scrollLeft + view.clientWidth * cx) / sw;
    const fy = (view.scrollTop + view.clientHeight * cy) / sh;
    k = Math.min(4, Math.max(1, next));
    img.style.setProperty("--k", String(k));
    if (level) level.textContent = `${Math.round(k * 100)}%`;
    view.scrollLeft = fx * view.scrollWidth - view.clientWidth * cx;
    view.scrollTop = fy * view.scrollHeight - view.clientHeight * cy;
  };

  const open = () => {
    if (!img.getAttribute("src")) img.src = poster.src;
    dialog.showModal();
    setZoom(1);
  };

  poster.addEventListener("click", open);
  if (openBtn) openBtn.addEventListener("click", open);
  if (btnIn) btnIn.addEventListener("click", () => setZoom(k * 1.5));
  if (btnOut) btnOut.addEventListener("click", () => setZoom(k / 1.5));
  if (btnClose) btnClose.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });

  img.addEventListener("click", (e) => {
    const r = view.getBoundingClientRect();
    setZoom(k >= 3.5 ? 1 : k * 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  let pan = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || k <= 1) return;
    pan = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, moved: false };
  });
  view.addEventListener("pointermove", (e) => {
    if (!pan) return;
    pan.moved ||= Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 4;
    view.scrollLeft = pan.l - (e.clientX - pan.x);
    view.scrollTop = pan.t - (e.clientY - pan.y);
  });
  view.addEventListener(
    "click",
    (e) => {
      if (pan?.moved) e.stopPropagation();
      pan = null;
    },
    true
  );
  view.addEventListener("pointerup", () => {
    setTimeout(() => (pan = null), 0);
  });
}
