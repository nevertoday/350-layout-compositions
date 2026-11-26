// 217 纵 中 横 排 · 正文 01–07 节全部独立互动控件（相邻两节绝不复用同一种控件）

export function mountSections() {
  initAnatomyLayers();
  initIntersectionBench();
  initTateChuYokoLab();
  initHistoryTimeline();
  initStressTest();
  initPracticeQuiz();
  initPosterLightbox();
}

// ---------- 01 纵为骨，横为翼：四层建筑剖面抽离开关 ----------
function initAnatomyLayers() {
  const root = document.getElementById("sec-anatomy");
  if (!root) return;
  const state = { spine: true, bands: true, tethers: true, hierarchy: true };
  const btns = [...root.querySelectorAll("[data-layer]")];
  const svg = root.querySelector(".anatomy-svg");
  const note = root.querySelector("#anatomy-note");
  const resetBtn = root.querySelector("#anatomy-reset");

  const DIAG = {
    all: "四层完整咬合：中央纵轴定住视觉重心，四条横向带左右铺展，青绿与珊瑚虚线把同一行的中英文锁成一对，大字号竖标统领全页秩序。",
    noSpine: "抽掉了「中心线与白柱」：四条横带立刻塌成上下堆叠的普通列表，页面没有视觉脊梁，左右两翼失去共同参照。",
    noBands: "抽掉了「横向信息带」：整张页面只剩一根孤零零的竖柱，层次单一，无法承载分组对照的多重信息。",
    noTethers: "抽掉了「交叉引连与避柱区」：左右内容隔着白柱各自漂浮，横向扫读时容易错行，不再像同一条信息带。",
    noHierarchy: "抽掉了「重点字级反差」：中柱标题与两侧正文一样大，眼睛进画面后四处打转，看不出先读中轴还是先读横带。",
    multi: "同时移除了多层结构：骨架已经散架。点击上方层卡逐层装回，观察每一层各担什么分工。",
  };

  function sync() {
    btns.forEach((b) => {
      const k = b.dataset.layer;
      const on = state[k];
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-off", !on);
      const badge = b.querySelector(".layer-state");
      if (badge) badge.textContent = on ? "已启用" : "已抽离";
    });
    if (svg) {
      svg.classList.toggle("hide-spine", !state.spine);
      svg.classList.toggle("hide-bands", !state.bands);
      svg.classList.toggle("hide-tethers", !state.tethers);
      svg.classList.toggle("flat-hierarchy", !state.hierarchy);
    }
    const offKeys = Object.keys(state).filter((k) => !state[k]);
    if (!note) return;
    if (offKeys.length === 0) note.textContent = DIAG.all;
    else if (offKeys.length > 1) note.textContent = DIAG.multi;
    else if (offKeys[0] === "spine") note.textContent = DIAG.noSpine;
    else if (offKeys[0] === "bands") note.textContent = DIAG.noBands;
    else if (offKeys[0] === "tethers") note.textContent = DIAG.noTethers;
    else note.textContent = DIAG.noHierarchy;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.layer;
      state[k] = !state[k];
      sync();
    });
  });
  resetBtn?.addEventListener("click", () => {
    state.spine = state.bands = state.tethers = state.hierarchy = true;
    sync();
  });
  sync();
}

// ---------- 02 交口避让与双翼配平：真实活体横带交口实验室 ----------
function initIntersectionBench() {
  const root = document.getElementById("sec-cross");
  if (!root) return;
  const specimen = root.querySelector("#cross-specimen");
  const readout = root.querySelector("#cross-readout");
  const codeEl = root.querySelector("#cross-css");
  const bridgeBtns = [...root.querySelectorAll("[data-bridge]")];
  const weightBtns = [...root.querySelectorAll("[data-weight]")];

  const BRIDGES = {
    chomp: {
      cls: "bridge-chomp",
      gap: "2px",
      verdict: "交口压字：横排文字紧贴中柱边缘，竖白柱的投影把行尾汉字切出毛刺感，扫读到中轴处会明显卡顿。",
      css: "column-gap: 2px; /* 过窄：文字紧贴中柱 */",
    },
    detached: {
      cls: "bridge-detached",
      gap: "58px",
      verdict: "留白断联：左右两翼退开近 60px 且没有任何引线，格式塔邻近性失效，读者会把右侧英文误当成另一栏注释。",
      css: "column-gap: 58px; /* 过宽且无引线：左右脱钩 */",
    },
    tether: {
      cls: "bridge-tether",
      gap: "24px",
      verdict: "原海报虚线引点（推荐）：留足 24px 避柱净空，左端青绿圆点与右端珊瑚圆点用虚线穿透中柱，既不压字又把同一行牢牢串住。",
      css: "column-gap: 24px; /* 避柱净空 + 虚线圆点贯通 */",
    },
    hairline: {
      cls: "bridge-hairline",
      gap: "22px",
      verdict: "细界线贯通（推荐）：用一条贯穿中柱底部的淡绿实线承担行轨，气质比虚线圆点更克制，适合学术年表与建筑索引。",
      css: "column-gap: 22px; border-bottom: 1px solid #C6DDD0;",
    },
  };

  const WEIGHTS = {
    balanced: {
      cls: "weight-balanced",
      note: "双翼体量对等（左中文约 18 字 × 右说明约 18 字），视觉天平稳居中轴。",
      cols: "1fr 78px 1fr",
    },
    asymmetric: {
      cls: "weight-asymmetric",
      note: "左翼浓缩为圆徽加短词、右翼承接详细展开，但因左翼有深翠色块压重，整体视觉仍与右翼保持等量平衡。",
      cols: "0.92fr 78px 1.08fr",
    },
    overload: {
      cls: "weight-overload",
      note: "反例：左翼空荡只剩标题、右翼硬塞三行长段，重心明显右沉，整条横带像折断了一边的天平。",
      cols: "0.7fr 78px 1.3fr",
    },
  };

  let curBridge = "tether";
  let curWeight = "balanced";

  function sync() {
    bridgeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bridge === curBridge)));
    weightBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.weight === curWeight)));
    if (specimen) {
      specimen.className = `cross-live ${BRIDGES[curBridge].cls} ${WEIGHTS[curWeight].cls}`;
    }
    if (readout) {
      readout.innerHTML = `<strong>${BRIDGES[curBridge].verdict}</strong><span>${WEIGHTS[curWeight].note}</span>`;
    }
    if (codeEl) {
      codeEl.textContent = `.band { display: grid; grid-template-columns: ${WEIGHTS[curWeight].cols}; ${BRIDGES[curBridge].css} }`;
    }
  }

  bridgeBtns.forEach((b) => b.addEventListener("click", () => { curBridge = b.dataset.bridge; sync(); }));
  weightBtns.forEach((b) => b.addEventListener("click", () => { curWeight = b.dataset.weight; sync(); }));
  sync();
}

// ---------- 03 宏观纵中横排 vs 微观纵中横（W3C text-combine-upright 活体显微镜） ----------
function initTateChuYokoLab() {
  const root = document.getElementById("sec-tcy");
  if (!root) return;
  const specimen = root.querySelector("#tcy-vertical-sample");
  const modeBtns = [...root.querySelectorAll("[data-tcy-mode]")];
  const note = root.querySelector("#tcy-note");
  const cssOut = root.querySelector("#tcy-css");

  const MODES = {
    none: {
      cls: "tcy-none",
      text: "关闭合排（text-combine-upright: none）：直排中的两位数字「10」「24」随拉丁基线侧躺旋转 90°，读日期时必须歪头辨认。",
      css: "writing-mode: vertical-rl; text-combine-upright: none;",
    },
    two: {
      cls: "tcy-two",
      text: "两位合排（W3C 推荐用法）：把「10」「24」等 2 位数横向压进 1em 单字格，4 位数「2026」保持直立或改汉字「二〇二六」，既不歪头又不挤扁。",
      css: ".num-2 { text-combine-upright: all; } /* 仅用于 2–3 位短数字 */",
    },
    four: {
      cls: "tcy-four",
      text: "反例——把 4 位年份「2026」与 3 字母「NO.」强行塞进 1em：字宽被极端压扁成竖条，墨团粘连，在小字号屏幕上几乎无法辨认。",
      css: ".num-4 { text-combine-upright: all; } /* 慎用：4 字符强压会糊成一条 */",
    },
  };

  let cur = "two";
  function sync() {
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tcyMode === cur)));
    if (specimen) specimen.className = `tcy-paper ${MODES[cur].cls}`;
    if (note) note.textContent = MODES[cur].text;
    if (cssOut) cssOut.textContent = MODES[cur].css;
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => { cur = b.dataset.tcyMode; sync(); }));
  sync();
}

// ---------- 04 从古籍版心到轴线系统：四时代版式图谱切签 ----------
function initHistoryTimeline() {
  const root = document.getElementById("sec-history");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-era]")];
  const panels = [...root.querySelectorAll("[data-era-panel]")];

  function select(era) {
    tabs.forEach((t) => {
      const active = t.dataset.era === era;
      t.setAttribute("aria-selected", String(active));
      t.classList.toggle("is-active", active);
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.eraPanel !== era;
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.era)));
  select("banxin");
}

// ---------- 05 什么时候用，什么时候别用：四份需求压力测试台 ----------
function initStressTest() {
  const root = document.getElementById("sec-when");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-brief]")];
  const stage = root.querySelector("#stress-preview");
  const verdict = root.querySelector("#stress-verdict");

  const BRIEFS = {
    solar: {
      ok: true,
      tag: "非常适合 · 直接采用 217",
      title: "四节气茶展导览海报（4 组并行短信息）",
      detail: "共 4 条并列节点、每条左右各 20–30 字，中轴竖排总题镇场，左右横带分别承载农时与器味对照——结构天然对称，3 秒就能扫完。",
      alt: "",
      preview: `
        <div class="st-mini st-good">
          <div class="st-spine">四<br>时<br>茶<br>录</div>
          <div class="st-rows">
            <div class="st-row"><span>清明 · 头春嫩芽</span><span>QINGMING · 盖碗</span></div>
            <div class="st-row"><span>谷雨 · 文火轻焙</span><span>GUYU · 醇和甘润</span></div>
            <div class="st-row"><span>立夏 · 北窗凉席</span><span>LIXIA · 轻发酵茶</span></div>
            <div class="st-row"><span>小满 · 山泉冷萃</span><span>XIAOMAN · 回甘</span></div>
          </div>
        </div>`,
    },
    bilingual: {
      ok: true,
      tag: "非常适合 · 直接采用 217",
      title: "双语建筑展品说明卡（中英平行对读）",
      detail: "左翼中文、右翼英文天然等量，中央竖排建筑名称与年份充当视觉界碑，参观者无论惯读中文还是英文都能迅速锁定对应段落。",
      alt: "",
      preview: `
        <div class="st-mini st-good">
          <div class="st-spine">亭<br>廊<br>光<br>影</div>
          <div class="st-rows">
            <div class="st-row"><span>夯土墙体围合静院</span><span>RAMMED EARTH WALL</span></div>
            <div class="st-row"><span>折檐引入南北漫射光</span><span>DIFFUSED DAYLIGHT</span></div>
            <div class="st-row"><span>青石水道衔接回廊</span><span>COURTYARD AXIS</span></div>
          </div>
        </div>`,
    },
    longform: {
      ok: false,
      tag: "别用 217 · 改用 212 横排左起或 214 直排右起",
      title: "3000 字长篇深度人物专访",
      detail: "连续叙事要求视线无中断地逐行推进。在正文正中插一根竖白柱，等于强迫读者每读半句话就跳过障碍物，几段下来眼睛极度疲劳。",
      alt: `<a href="https://layout.xiaoxiaodong.ai/212/play/" target="_blank" rel="noopener">改看 212 横排左起 ↗</a> · <a href="https://layout.xiaoxiaodong.ai/214/play/" target="_blank" rel="noopener">或 214 直排右起 ↗</a>`,
      preview: `
        <div class="st-mini st-bad">
          <div class="st-spine">人<br>物<br>长<br>文</div>
          <div class="st-rows">
            <div class="st-row"><span>那天清晨他推开</span><span>门看见雾还没散……</span></div>
            <div class="st-row"><span>句子被中柱硬生</span><span>生劈成左右两半</span></div>
            <div class="st-row"><span>视线来回跳柱极</span><span>易串行丢失下文</span></div>
          </div>
        </div>`,
    },
    narrow: {
      ok: false,
      tag: "别在窄屏硬撑双翼 · 改用响应式收拢或 216",
      title: "390px 手机竖屏强行维持左右双翼",
      detail: "390px 减去页边距和 60px 中柱后，单侧只剩约 130px，每行塞不下 6 个字，折行碎成竖条；移动端应把中轴转成顶部横眉或左侧单脊。",
      alt: `<a href="https://layout.xiaoxiaodong.ai/216/play/" target="_blank" rel="noopener">参考 216 横直混排的非对称分区 ↗</a>`,
      preview: `
        <div class="st-mini st-bad st-phone">
          <div class="st-spine">纵<br>中<br>横<br>排</div>
          <div class="st-rows">
            <div class="st-row"><span>单翼仅<br>容三四<br>字折行</span><span>右侧也<br>被挤成<br>碎竖条</span></div>
            <div class="st-row"><span>行高暴<br>涨信息<br>断碎</span><span>手机端<br>应转置<br>为单流</span></div>
          </div>
        </div>`,
    },
  };

  let cur = "solar";
  function sync() {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.brief === cur)));
    const item = BRIEFS[cur];
    if (stage) stage.innerHTML = item.preview;
    if (verdict) {
      verdict.className = `stress-verdict ${item.ok ? "is-ok" : "is-bad"}`;
      verdict.innerHTML = `<span class="sv-badge">${item.tag}</span><h3>${item.title}</h3><p>${item.detail}</p>${item.alt ? `<p class="sv-alt">${item.alt}</p>` : ""}`;
    }
  }

  btns.forEach((b) => b.addEventListener("click", () => { cur = b.dataset.brief; sync(); }));
  sync();
}

// ---------- 06 小练习：中性标签四选一（仅差「中柱尺度与交口处理」一个变量） ----------
function initPracticeQuiz() {
  const root = document.getElementById("sec-quiz");
  if (!root) return;
  const cards = [...root.querySelectorAll("[data-option]")];
  const feedback = root.querySelector("#quiz-feedback");

  const ANSWERS = {
    A: {
      correct: true,
      headline: "答对了：方案 A 是四版里结构最稳的纵中横排",
      reason: "中柱占宽 16%，竖标字级压得住四条横带又不过度抢地盘；交口留足 22px 避柱净空并配有青绿与珊瑚虚线引点，左右两翼既不撞柱又保持清晰的同行对应。",
    },
    B: {
      correct: false,
      headline: "方案 B 的问题：交口零净空，中柱边缘贴死横带文字",
      reason: "虽然中柱宽 16% 与字级都合适，但横带文字一路顶到纯白中柱边上，几乎没有避让缓冲。实际印刷或屏幕显示时，文字末端会与中柱投影黏在一起，扫读在十字路口发涩。",
    },
    C: {
      correct: false,
      headline: "方案 C 的问题：中柱胖到 32%，把左右两翼挤碎了",
      reason: "把中柱加粗到近三分之一版宽后，虽然中轴很抢眼、交口也有缝，但左右两翼被挤得每行只剩 4 个字，迫使短句频繁折行，破坏了横向展开的舒畅感。",
    },
    D: {
      correct: false,
      headline: "方案 D 的问题：中柱过细（8%）且 56px 宽沟无引连，两翼彻底脱钩",
      reason: "细柱压不住场，加上横带底色和虚线引点都被拿掉、净空拉到 56px，读者根本看不出左右两侧属于同一条信息，页面散成了两张互不相干的细清单。",
    },
  };

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const opt = btn.dataset.option;
      const ans = ANSWERS[opt];
      cards.forEach((c) => {
        const isMe = c === btn;
        c.setAttribute("aria-pressed", String(isMe));
        c.classList.toggle("is-picked", isMe);
        c.classList.toggle("is-right", isMe && ans.correct);
        c.classList.toggle("is-wrong", isMe && !ans.correct);
      });
      if (feedback) {
        feedback.hidden = false;
        feedback.className = `quiz-feedback ${ans.correct ? "is-right" : "is-wrong"}`;
        feedback.innerHTML = `<p class="qf-head">${ans.headline}</p><p class="qf-body">${ans.reason}</p>`;
      }
    });
  });
}

// ---------- 07 原海报灯箱（点击放大、滚轮/按钮缩放、拖拽平移、Esc 关闭） ----------
function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("poster-dialog");
  if (!trigger || !posterImg || !dialog) return;

  const zoomImg = dialog.querySelector("#lightbox-img");
  const closeBtn = dialog.querySelector("#lightbox-close");
  const zinBtn = dialog.querySelector("#lightbox-in");
  const zoutBtn = dialog.querySelector("#lightbox-out");
  const resetBtn = dialog.querySelector("#lightbox-reset");
  const stage = dialog.querySelector(".lightbox-stage");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    if (zoomImg) zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openBox() {
    if (zoomImg && !zoomImg.src) zoomImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.showModal();
  }

  function closeBox() {
    if (dialog.open) dialog.close();
  }

  trigger.addEventListener("click", openBox);
  closeBtn?.addEventListener("click", closeBox);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeBox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      closeBox();
    }
  });

  zinBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  zoutBtn?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.4).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  stage?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(1, Math.min(3, +(scale + delta).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  zoomImg?.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    drag = { sx: e.clientX, sy: e.clientY, tx, ty };
    zoomImg.setPointerCapture?.(e.pointerId);
  });
  zoomImg?.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.sx);
    ty = drag.ty + (e.clientY - drag.sy);
    applyTransform();
  });
  zoomImg?.addEventListener("pointerup", () => { drag = null; });
}
