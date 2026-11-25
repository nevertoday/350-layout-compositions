// 正文各节独立互动实验（02 找异形计时 / 03 布巴奇奇与情绪框 / 04 包豪斯空白问卷+维也纳路标 / 05 UI 角色重构 / 06 轮廓族崩溃滑块 / 07 四版单变量练习 / 08 原海报灯箱）

// ---------------------------------------------------------------------------
// 02 · 视觉搜索「前注意跳出 vs 逐个扫描」实测（Treisman & Gelade 1980; Wolfe & Horowitz 2004）
// ---------------------------------------------------------------------------
export function initPopoutLab() {
  const secEl = document.getElementById("sec-02");
  const gridEl = document.getElementById("popout-grid");
  const overlayEl = document.getElementById("popout-overlay");
  const overlayTitleEl = document.getElementById("popout-overlay-title");
  const overlayHintEl = document.getElementById("popout-overlay-hint");
  const startBtn = document.getElementById("popout-start");
  const modeBtns = [...document.querySelectorAll("[data-popout-round]")];
  const resetBtn = document.getElementById("popout-reset");
  const statusEl = document.getElementById("popout-status");
  const barsEl = document.getElementById("popout-bars");
  const summaryEl = document.getElementById("popout-summary");
  if (!gridEl) return;

  const ROUNDS = {
    curve: {
      short: "方里找圆",
      kind: "popout",
      title: "第 1 轮 · 曲率跳出（35 个方里找 1 个圆）",
      readyHint: "点「开始计时」后随机布点，一看到圆就点它。",
      runningHint: "计时中：点出藏在方阵里的唯一正圆。",
      next: "hollow",
      nextLabel: "测下一轮：实里找空 →",
      explain: "圆弧与直角分属不同的底层曲率特征，大脑并行扫过整片网格，几乎不用逐个看，圆就自己跳进眼里。",
    },
    hollow: {
      short: "实里找空",
      kind: "popout",
      title: "第 2 轮 · 实与空墨量差（35 个实圆里找 1 个空环）",
      readyHint: "点「开始计时」后随机布点，找出唯一的镂空圆环。",
      runningHint: "计时中：点出唯一的镂空圆环。",
      next: "tl",
      nextLabel: "测下一轮：T 里找 L →",
      explain: "实心与镂空之所以一眼跳出，主要靠掏空内部拉开的局部墨量与亮度差——这也是实心主按钮配描边次按钮一眼分层的底气。",
    },
    tl: {
      short: "T 里找 L",
      kind: "serial",
      title: "第 3 轮 · 同特征组合（35 个旋转 T 里找 1 个 L）",
      readyHint: "全是横竖两笔直角，点「开始计时」后找出唯一字母 L。",
      runningHint: "计时中：在旋转 T 里找出唯一一个字母 L。",
      next: null,
      nextLabel: "",
      explain: "T 和 L 都是「一横 + 一竖 + 90° 直角」，只差交点位置。Wolfe & Horowitz（2004）指出：整体「形状」并非单一前注意通道，缺少曲率或实空差时，眼睛只能退回逐个扫描。",
    },
  };

  const ORDER = ["curve", "hollow", "tl"];
  let currentKey = "curve";
  let phase = "ready"; // "ready" | "running" | "done"
  let startedAt = 0;
  let misses = 0;
  let inViewport = false;
  const lastTarget = { curve: -1, hollow: -1, tl: -1 };
  const records = { curve: null, hollow: null, tl: null };

  if (secEl && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
      },
      { threshold: 0.15 }
    ).observe(secEl);
  } else {
    inViewport = true;
  }

  function randomTarget(key) {
    // 避开最四角（0, 5, 30, 35）和上次位置，保证每轮都真正随机且公平
    const pool = [];
    for (let i = 0; i < 36; i++) {
      if (i === 0 || i === 5 || i === 30 || i === 35) continue;
      if (i === lastTarget[key]) continue;
      pool.push(i);
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastTarget[key] = pick;
    return pick;
  }

  function cellSvg(key, isTarget, rot) {
    if (key === "curve") {
      return isTarget
        ? `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="11" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="8" y="8" width="20" height="20" fill="currentColor"/></svg>`;
    }
    if (key === "hollow") {
      return isTarget
        ? `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="10" fill="none" stroke="currentColor" stroke-width="3.2"/></svg>`
        : `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="11" fill="currentColor"/></svg>`;
    }
    return isTarget
      ? `<svg viewBox="0 0 36 36" aria-hidden="true"><g transform="rotate(${rot} 18 18)" stroke="currentColor" stroke-width="3.6" stroke-linecap="square" fill="none"><path d="M11 8V26H27"/></g></svg>`
      : `<svg viewBox="0 0 36 36" aria-hidden="true"><g transform="rotate(${rot} 18 18)" stroke="currentColor" stroke-width="3.6" stroke-linecap="square" fill="none"><path d="M9 10H27M18 10V27"/></g></svg>`;
  }

  function renderBars() {
    if (!barsEl) return;
    const vals = ORDER.map((k) => records[k]).filter((v) => v != null);
    const maxMs = vals.length ? Math.max(...vals, 300) : 1000;
    const allDone = vals.length === 3;

    barsEl.innerHTML = ORDER.map((k) => {
      const r = ROUNDS[k];
      const v = records[k];
      const pct = v == null ? 0 : Math.max(8, Math.round((v / maxMs) * 100));
      const kindCls = r.kind === "serial" ? "is-serial" : "is-popout";
      return `
        <div class="pb-row ${k === currentKey ? "is-current" : ""}">
          <span class="pb-name">${r.short}</span>
          <span class="pb-track" aria-hidden="true">
            <i class="pb-fill ${kindCls}" style="width:${pct}%"></i>
          </span>
          <b class="pb-val">${v == null ? "待测" : `${v} ms`}</b>
        </div>
      `;
    }).join("");

    if (!summaryEl) return;
    if (!allDone) {
      const doneN = vals.length;
      summaryEl.textContent = doneN === 0
        ? "点「开始计时」依次测完三轮，这里会并排出三轮毫秒对比条。"
        : `已完成 ${doneN}/3 轮，测完三轮后这里会自动对比跳出与逐个扫描的耗时差距。`;
      return;
    }

    const fastestPop = Math.min(records.curve, records.hollow);
    const ratio = records.tl / Math.max(1, fastestPop);
    if (records.tl > Math.max(records.curve, records.hollow)) {
      summaryEl.innerHTML = `<strong>实测对比：</strong>「T 里找 L」（${records.tl} ms）比最快的一眼跳出轮（${fastestPop} ms）慢了 <b>${ratio.toFixed(1)} 倍</b>（多花 ${records.tl - fastestPop} ms）——整体拼装形走的是慢速逐个扫描。`;
    } else {
      summaryEl.innerHTML = `<strong>三轮已测完：</strong>这次你在「T 里找 L」里刚好一眼扫到了目标（${records.tl} ms）；可点「换位置重测」再试几次，平均下来无曲率/实空差的 T 与 L 会明显更慢。`;
    }
  }

  function renderMaskedCells() {
    gridEl.innerHTML = "";
    for (let i = 0; i < 36; i++) {
      const placeholder = document.createElement("span");
      placeholder.className = "popout-cell is-masked";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.innerHTML = `<svg viewBox="0 0 36 36"><rect x="13" y="13" width="10" height="10" fill="currentColor" opacity="0.22"/></svg>`;
      gridEl.appendChild(placeholder);
    }
  }

  function enterReady(key) {
    currentKey = key;
    phase = "ready";
    misses = 0;
    startedAt = 0;
    const round = ROUNDS[key];

    modeBtns.forEach((b) => {
      const on = b.dataset.popoutRound === key;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });

    renderMaskedCells();
    if (overlayEl) overlayEl.hidden = false;
    if (overlayTitleEl) overlayTitleEl.textContent = round.title;
    if (overlayHintEl) overlayHintEl.textContent = round.readyHint;
    if (startBtn) startBtn.textContent = `开始计时 · ${round.short}`;
    if (resetBtn) resetBtn.disabled = true;

    if (statusEl) {
      statusEl.innerHTML = `<strong>${round.title}</strong><span>先看清目标要求，再点「开始计时」才开始走表。</span>`;
    }
    renderBars();
  }

  function startRound(key = currentKey) {
    currentKey = key;
    const round = ROUNDS[key];
    const targetIdx = randomTarget(key);
    phase = "running";
    misses = 0;

    modeBtns.forEach((b) => {
      const on = b.dataset.popoutRound === key;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });

    if (overlayEl) overlayEl.hidden = true;
    if (resetBtn) resetBtn.disabled = false;

    gridEl.innerHTML = "";
    for (let i = 0; i < 36; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "popout-cell";
      const isTarget = i === targetIdx;
      const rot = Math.floor(Math.random() * 4) * 90;
      btn.dataset.target = isTarget ? "1" : "0";
      btn.setAttribute("aria-label", `第 ${i + 1} 格`);
      btn.innerHTML = cellSvg(key, isTarget, rot);
      btn.addEventListener("click", () => {
        if (phase !== "running") return;
        if (isTarget) {
          phase = "done";
          const elapsed = Math.max(40, Math.round(performance.now() - startedAt));
          records[key] = elapsed;
          btn.classList.add("is-hit");
          if (statusEl) {
            const nextBtnHtml = round.next
              ? `<button type="button" class="popout-next-btn" data-next-round="${round.next}">${round.nextLabel}</button>`
              : "";
            statusEl.innerHTML = `
              <div class="popout-hit-row">
                <strong>找到目标 · 用时 ${elapsed} ms${misses ? `（误点 ${misses} 次）` : ""}</strong>
                ${nextBtnHtml}
              </div>
              <span>${round.explain}</span>
            `;
            statusEl.querySelector("[data-next-round]")?.addEventListener("click", (e) => {
              enterReady(e.currentTarget.dataset.nextRound);
            });
          }
          renderBars();
        } else {
          misses += 1;
          btn.classList.add("is-miss");
          if (statusEl) {
            statusEl.innerHTML = `<strong>不是这一格（已误点 ${misses} 次）</strong><span>${round.runningHint}</span>`;
          }
        }
      });
      gridEl.appendChild(btn);
    }

    // 严格在揭示矩阵、用户点击「开始」这一刻才起表（绝不在页面加载时提前起表）
    startedAt = performance.now();
    if (statusEl) {
      statusEl.innerHTML = `<strong>${round.title}${inViewport ? "" : ""}</strong><span>${round.runningHint}</span>`;
    }
    renderBars();
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      enterReady(b.dataset.popoutRound);
    })
  );
  startBtn?.addEventListener("click", () => startRound(currentKey));
  resetBtn?.addEventListener("click", () => startRound(currentKey));

  enterReady("curve");
}

// ---------------------------------------------------------------------------
// 03 · 布巴—奇奇现场盲测 + 同一句文案配「尖角 vs 圆弧」情绪对照
// ---------------------------------------------------------------------------
export function initEmotionLab() {
  const bkBtns = [...document.querySelectorAll("[data-bk-pick]")];
  const bkOut = document.getElementById("bk-result");
  bkBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.bkPick;
      bkBtns.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-active", on);
      });
      if (!bkOut) return;
      if (pick === "spiky-kiki") {
        bkOut.innerHTML = `<strong>你和绝大多数人直觉一致：尖刺 = Kiki，云团 = Bouba。</strong> 格式塔心理学家沃尔夫冈·苛勒（Wolfgang Köhler）早在 1929 年《格式塔心理学》里就用「takete / baluba（1947 版改称 maluma）」发现过这一现象；2001 年拉马钱德兰与哈伯德改称「bouba / kiki」后跨语种复现，同样呈现极高一致性。尖折线对应爆破急促的发声与警觉感，圆弧对应饱满顺滑的口腔形态与松弛感。`;
      } else {
        bkOut.innerHTML = `<strong>你选了少数派组合：把圆团叫 Kiki、把尖刺叫 Bouba！</strong> 这正是刻意制造「反差荒诞感」的玩法；但在常规受众测试中（苛勒 1929/1947；拉马钱德兰与哈伯德 2001），绝大多数人会本能把尖刺配给 Kiki、圆团配给 Bouba。所以品牌与界面除非故意制造怪诞记忆点，否则都会顺着这条轮廓情绪走。`;
      }
    });
  });

  const toneBtns = [...document.querySelectorAll("[data-tone-shape]")];
  const cardEl = document.getElementById("tone-demo-card");
  const noteEl = document.getElementById("tone-demo-note");
  const TONES = {
    sharp: {
      note: "全员锐角与尖三角徽标：哪怕字还是那句普通提醒，锐利轮廓也会把语气拉紧得像紧急告警——正如 Bar & Neta（2006）所推测、并在 2007 年《神经心理学》杏仁核 fMRI 实验里佐证的那样，尖角轮廓更容易触发潜在威胁警觉。",
    },
    round: {
      note: "全员大圆角与圆形徽标：同样的通知语气瞬间柔和下来，更像生活服务或友好的欢迎提示；但若真是高危删除确认，太圆润反而容易让人放松警惕。",
    },
    split: {
      note: "骨架用稳重微方框托底，只把关键动作或提醒标成圆/尖异形：既稳得住信息阅读，又能按轻重精准分配情绪温度。",
    },
  };
  toneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.toneShape;
      toneBtns.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-active", on);
      });
      if (cardEl) cardEl.dataset.tone = mode;
      if (noteEl && TONES[mode]) noteEl.textContent = TONES[mode].note;
    });
  });
}

// ---------------------------------------------------------------------------
// 04 · 1923 包豪斯空白色形问卷（三形全填后解锁对照） + 1968 维也纳路标失色验证
// ---------------------------------------------------------------------------
export function initHistoryLab() {
  const shapeSlots = [...document.querySelectorAll("[data-bauhaus-shape]")];
  const revealBtn = document.getElementById("bauhaus-reveal");
  const bauhausOut = document.getElementById("bauhaus-out");
  // 使用标准正红 #d63224（不再拿朱橙充红）
  const COLORS = [
    { id: "yellow", label: "黄", hex: "#e8b931" },
    { id: "red", label: "红", hex: "#d63224" },
    { id: "blue", label: "蓝", hex: "#1f49c1" },
  ];
  const picks = { triangle: null, square: null, circle: null };

  function syncRevealGate() {
    const filled = Object.values(picks).filter((v) => v !== null).length;
    if (!revealBtn) return;
    if (filled < 3) {
      revealBtn.disabled = true;
      revealBtn.textContent = `请先给三个图形填色（${filled}/3）`;
    } else {
      revealBtn.disabled = false;
      revealBtn.textContent = "对照康定斯基答案";
    }
  }

  function paintSlot(btn) {
    const shape = btn.dataset.bauhausShape;
    const idx = picks[shape];
    const svgShape = btn.querySelector("[data-fill-target]");
    const tag = btn.querySelector(".bh-color-tag");
    if (idx === null) {
      if (svgShape) {
        svgShape.setAttribute("fill", "#e8dcc8");
        svgShape.setAttribute("stroke", "#131517");
        svgShape.setAttribute("stroke-width", "2.4");
        svgShape.setAttribute("stroke-dasharray", "4 3");
      }
      if (tag) tag.textContent = "未填";
      btn.classList.remove("is-filled");
    } else {
      const c = COLORS[idx];
      if (svgShape) {
        svgShape.setAttribute("fill", c.hex);
        svgShape.setAttribute("stroke", "none");
        svgShape.removeAttribute("stroke-dasharray");
      }
      if (tag) tag.textContent = c.label;
      btn.classList.add("is-filled");
    }
  }

  shapeSlots.forEach((btn) => {
    paintSlot(btn);
    btn.addEventListener("click", () => {
      const shape = btn.dataset.bauhausShape;
      picks[shape] = picks[shape] === null ? 0 : (picks[shape] + 1) % COLORS.length;
      paintSlot(btn);
      syncRevealGate();
    });
  });
  syncRevealGate();

  revealBtn?.addEventListener("click", () => {
    if (!bauhausOut) return;
    if (Object.values(picks).some((v) => v === null)) return;
    const exact = picks.triangle === 0 && picks.square === 1 && picks.circle === 2;
    bauhausOut.innerHTML = exact
      ? `<strong>和康定斯基 1923 年的设想完全一致（黄三角 · 红方 · 蓝圆）！</strong> 不过现代心理学对这套问卷做过多次复现，结果众说纷纭——真正跨文化站得住脚的，并不是「某种色必须绑某种形」，而是三角的尖锐、方块的稳重、圆形的包容这三种轮廓本身。`
      : `<strong>你的配对（三角${COLORS[picks.triangle].label} · 方${COLORS[picks.square].label} · 圆${COLORS[picks.circle].label}）与康定斯基不同——这很正常！</strong> 1923 年康定斯基在魏玛包豪斯设想的是「黄三角、红方、蓝圆」，但后来的实证复现表明人们并无统一色形定式；真正稳定传达区别的，是轮廓几何而不是玄学配色。`;
  });

  // Part B: 1968 维也纳路标失色模拟器
  const signBtns = [...document.querySelectorAll("[data-sign-filter]")];
  const signRow = document.getElementById("signs-row");
  const signOut = document.getElementById("signs-out");
  const SIGN_NOTES = {
    normal: "全彩视角：红、蓝、白配合八边形、正三角、倒三角与正圆，形成双重保险。",
    mono: "全色盲 / 夜间弱光视角：颜色全部退成灰阶，但八角停车牌、正三角警告牌、倒三角让行牌与圆形禁令牌依然一眼分清——这正是 W3C WCAG 1.4.1「不单靠颜色传递信息」的物理先驱。",
    snow: "积雪背光剪影：连牌面图案和文字都被遮住，只剩最外一圈黑影。单凭外轮廓，老司机照样不会把「必须停车的八边形」看成「提醒注意的三角形」。",
  };
  signBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.signFilter;
      signBtns.forEach((b) => {
        const on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-active", on);
      });
      if (signRow) signRow.dataset.filter = mode;
      if (signOut && SIGN_NOTES[mode]) signOut.textContent = SIGN_NOTES[mode];
    });
  });
}

// ---------------------------------------------------------------------------
// 05 · 实战 UI 形状角色重构台（默认停在「方案 A · 统一圆角」，按钮中性，好坏留给读数）
// ---------------------------------------------------------------------------
export function initUiRefactorLab() {
  const btns = [...document.querySelectorAll("[data-ui-grammar]")];
  const monoBtn = document.getElementById("ui-mono-toggle");
  const mockup = document.getElementById("ui-mockup");
  const readout = document.getElementById("ui-grammar-readout");
  if (!mockup) return;

  const COPY = {
    blur: {
      title: "方案 A · 全部同形，角色糊成一团",
      body: "卡片、日期标签、筛选器、主次按钮全用同样的小圆角方框。用户得逐行读字，才能分辨哪一块是信息容器、哪一块是能点的主操作。",
    },
    chaos: {
      title: "方案 B · 轮廓过多，退化成视觉噪音",
      body: "外框斜切、标签锯齿、头像圆形斜转、按钮半圆加箭头角——轮廓族一下子塞进五套，眼睛忙着消化花哨外框，反而忘了该点「立即预约」。",
    },
    clear: {
      title: "方案 C · 两类轮廓分工，一眼分层",
      body: "直角矩形稳住内容骨架；胶囊实心圆角只留给主行动按钮「立即预约」，次要按钮退成细线空心框，状态标用小圆点。即使切到纯黑白，层次依然清晰。",
    },
  };

  let cur = "blur";
  let isMono = false;

  function render() {
    mockup.dataset.grammar = cur;
    mockup.dataset.mono = isMono ? "1" : "0";
    btns.forEach((b) => {
      const on = b.dataset.uiGrammar === cur;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-active", on);
    });
    if (monoBtn) {
      monoBtn.setAttribute("aria-pressed", isMono ? "true" : "false");
      monoBtn.classList.toggle("is-active", isMono);
    }
    if (readout && COPY[cur]) {
      readout.innerHTML = `<strong>${COPY[cur].title}</strong><span>${COPY[cur].body}${isMono ? "（当前已去色：注意看谁在黑白下还站得住。）" : ""}</span>`;
    }
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      cur = b.dataset.uiGrammar;
      render();
    })
  );
  monoBtn?.addEventListener("click", () => {
    isMono = !isMono;
    render();
  });
  render();
}

// ---------------------------------------------------------------------------
// 06 · 什么时候别用：轮廓族数量崩溃滑块（1 → 5 类轮廓）
// ---------------------------------------------------------------------------
export function initChaosLab() {
  const range = document.getElementById("chaos-range");
  const countOut = document.getElementById("chaos-count");
  const svg = document.getElementById("chaos-svg");
  const verdict = document.getElementById("chaos-verdict");
  if (!range || !svg) return;

  const DATA = {
    1: {
      tag: "1 类轮廓 · 纯秩序（无对比）",
      text: "全是等距直角矩形。适合需要高度严谨、逐条核对的财务明细表或目录清单；但如果你想在里面拎出一个主角，眼睛无从下手。",
    },
    2: {
      tag: "2 类轮廓 · 经验甜区（对比最脆）",
      text: "经验法则里最稳的配比：大面积规整方格托住结构，只放一颗群青圆作为唯一视觉焦点。异形占比越小，抓眼力越猛。",
    },
    3: {
      tag: "3 类轮廓 · 临界边缘",
      text: "加入锐角三角后，方、圆、尖三方并立。如果三个角色有明确语义分工（骨架 / 焦点 / 警示）尚可成立，再多就会开始互相拆台。",
    },
    4: {
      tag: "4 类轮廓 · 焦点稀释",
      text: "又塞进有机墨团与空心菱形，原本独一无二的蓝圆不再稀有，视线在四个不同轮廓之间来回弹跳。",
    },
    5: {
      tag: "5 类轮廓 · 彻底滑向杂乱",
      text: "直角、圆球、尖三角、有机波浪、多角星全堆在一页——当人人都是特殊形状，就等于没有任何特殊形状。",
    },
  };

  function draw(n) {
    if (countOut) countOut.textContent = `${n} 类`;
    const items = [];
    const cols = 4;
    const w = 480;
    const h = 230;
    const cellW = 104;
    const cellH = 58;
    const gapX = 12;
    const gapY = 14;
    const ox = (w - (cols * cellW + (cols - 1) * gapX)) / 2;
    const oy = 18;

    for (let i = 0; i < 12; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = ox + c * (cellW + gapX);
      const y = oy + r * (cellH + gapY);
      const cx = x + cellW / 2;
      const cy = y + cellH / 2;

      if (n >= 2 && i === 5) {
        items.push(`<circle cx="${cx}" cy="${cy}" r="25" fill="#1f49c1"/>`);
      } else if (n >= 3 && (i === 2 || i === 9)) {
        items.push(`<polygon points="${cx},${y + 5} ${x + cellW - 14},${y + cellH - 5} ${x + 14},${y + cellH - 5}" fill="#e76b28"/>`);
      } else if (n >= 4 && (i === 0 || i === 7)) {
        items.push(`<path d="M${x + 18},${cy} C${x + 16},${y + 6} ${cx + 8},${y + 4} ${x + cellW - 14},${cy - 6} C${x + cellW - 8},${y + cellH - 4} ${cx - 6},${y + cellH - 2} ${x + 18},${cy} Z" fill="#131517"/>`);
      } else if (n >= 5 && (i === 3 || i === 8 || i === 11)) {
        items.push(`<polygon points="${cx},${y + 3} ${cx + 12},${cy - 8} ${x + cellW - 12},${cy} ${cx + 12},${cy + 8} ${cx},${y + cellH - 3} ${cx - 12},${cy + 8} ${x + 12},${cy} ${cx - 12},${cy - 8}" fill="none" stroke="#1f49c1" stroke-width="3"/>`);
      } else if (n >= 4 && i === 10) {
        items.push(`<rect x="${x + 6}" y="${y + 8}" width="${cellW - 12}" height="${cellH - 16}" rx="22" fill="none" stroke="#131517" stroke-width="2.5"/>`);
      } else {
        items.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="#ede0cc" stroke="#131517" stroke-width="1.2"/>`);
        items.push(`<line x1="${x + 12}" y1="${y + 22}" x2="${x + cellW - 22}" y2="${y + 22}" stroke="#131517" stroke-width="2" opacity="0.45"/>`);
        items.push(`<line x1="${x + 12}" y1="${y + 35}" x2="${x + cellW - 38}" y2="${y + 35}" stroke="#131517" stroke-width="1.5" opacity="0.28"/>`);
      }
    }

    svg.innerHTML = `<rect width="${w}" height="${h}" fill="#f9eee0"/>${items.join("")}`;
    if (verdict && DATA[n]) {
      verdict.innerHTML = `<strong>${DATA[n].tag}</strong><span>${DATA[n].text}</span>`;
    }
  }

  range.addEventListener("input", () => draw(Number(range.value)));
  draw(Number(range.value));
}

// ---------------------------------------------------------------------------
// 07 · 小练习：纯黑白展讯海报四选一（A/B/D 各只差一个变量：焦点数 / 实空 / 圆方曲率）
// ---------------------------------------------------------------------------
export function initPracticeLab() {
  const btns = [...document.querySelectorAll("[data-quiz-opt]")];
  const verdict = document.getElementById("quiz-verdict");
  const guideToggle = document.getElementById("quiz-guide-toggle");
  const grid = document.getElementById("quiz-grid");
  if (!btns.length || !verdict) return;

  const ANSWERS = {
    A: {
      ok: false,
      title: "方案 A · 只差在「焦点数」：两颗等大实心圆互抢第一眼",
      body: "外框方正、底部实心胶囊配空心方框都和最佳方案一致；唯一问题出在中段画框里放了两颗等大实心圆，两个同轮廓同墨量的强焦点平分注意力，视线进画面后不知道先停在左圆还是右圆。",
    },
    B: {
      ok: false,
      title: "方案 B · 只差在「实与空」：底部主次按钮全是等大实心胶囊",
      body: "中段直角框里的单颗正圆焦点很稳，曲率对比也成立；唯一失分处是底部两个按钮都做成了实心胶囊，抽掉色彩后墨量与外轮廓完全一致，读不出哪一个是主操作。",
    },
    C: {
      ok: true,
      title: "方案 C · 最佳方案——圆方曲率、单一焦点与实空主次三条通道全成立",
      body: "外框与信息栏用直角矩形定秩序，中段只放一颗实心正圆靠曲率跳出，底部再用实心胶囊配细线空心框切开主次按钮；即使在纯黑白下也能一眼读完层级。",
    },
    D: {
      ok: false,
      title: "方案 D · 只差在「圆与方」：主视觉换成圆角方块后与画框撞形",
      body: "底部实心胶囊配空心框切开了主次按钮，中段也只留了单一焦点；唯一改动是把主视觉正圆换成了同面积的圆角方块，和外层直角画框同属方形轮廓家族，少了曲率反差，不如正圆一眼跳出。",
    },
  };

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.quizOpt;
      const ans = ANSWERS[k];
      btns.forEach((b) => {
        const key = b.dataset.quizOpt;
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        b.classList.toggle("is-picked", b === btn);
        b.classList.toggle("is-best", key === "C");
      });
      if (grid) grid.classList.add("is-revealed");
      verdict.hidden = false;
      verdict.dataset.ok = ans.ok ? "1" : "0";
      verdict.innerHTML = `<p class="qv-title">${ans.title}</p><p class="qv-body">${ans.body}</p>`;
    });
  });

  guideToggle?.addEventListener("click", () => {
    const on = guideToggle.getAttribute("aria-pressed") === "true";
    guideToggle.setAttribute("aria-pressed", on ? "false" : "true");
    guideToggle.classList.toggle("is-active", !on);
    grid?.classList.toggle("show-skeleton", !on);
  });
}

// ---------------------------------------------------------------------------
// 08 · 原海报放大灯箱（支持点击放大、鼠标/触屏拖动查看细节、缩放按钮、Esc 关闭）
// ---------------------------------------------------------------------------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const srcImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const stage = document.getElementById("pm-stage");
  const bigImg = document.getElementById("pm-img");
  const closeBtn = document.getElementById("pm-close");
  const zoomInBtn = document.getElementById("pm-zoom-in");
  const zoomOutBtn = document.getElementById("pm-zoom-out");
  const resetBtn = document.getElementById("pm-reset");
  if (!trigger || !srcImg || !modal || !stage || !bigImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function apply() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    bigImg.src = srcImg.currentSrc || srcImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    apply();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    apply();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    apply();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1.25;
    tx = 0;
    ty = 0;
    apply();
  });

  stage.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    stage.setPointerCapture?.(e.pointerId);
    stage.classList.add("is-grabbing");
    e.preventDefault();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = drag.ox + (e.clientX - drag.sx);
    ty = drag.oy + (e.clientY - drag.sy);
    apply();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    stage.classList.remove("is-grabbing");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
}
