// 198 基线网格 · 01–07 节全部互动实验与原海报灯箱
import { pixelRatio } from "../../lib/stage.js";
import { QUIZ_OPTIONS, calcRecovery } from "./model.js";

// ---------- 01 节：五线解剖镜 + 中西混排对齐模式 ----------
const LINE_INFO = {
  ascender: {
    name: "上缘线 · Ascender Line",
    desc: "小写字母 b、d、h、k、l 向上探出的最高边界。决定行距能不能给长升部留足呼吸，避免撞到上一行下降部。",
  },
  cap: {
    name: "大写线 · Cap Height",
    desc: "拉丁大写字母 A、B、G、H 的顶部基准。中文方块字顶边通常略高于大写线，视觉上才有同等体量。",
  },
  xheight: {
    name: "x-高度线 · x-Height",
    desc: "小写字母主体（x、a、e、n）的高度线。决定西文正文看起来有多「大」，也是人眼水平扫读的核心灰带。",
  },
  baseline: {
    name: "基线 · Baseline（网格锚点）",
    desc: "绝大多数拉丁字母脚底坐落的隐形参考线。基线网格就是把这条线按固定步长（如 24pt）纵向等距铺满整页。",
  },
  descender: {
    name: "下缘线 · Descender Line",
    desc: "字母 g、j、p、q、y 往下垂落的最低边界。汉字虽无下降部，但全字身底边略低于拉丁基线，混排时需靠视觉基线调平。",
  },
};

const CJK_MODES = {
  latin: {
    label: "拉丁基线直对齐",
    shiftPx: 0,
    note: "按西文字体默认基线直接落字：g / y / p 向下探出基线，汉字略微下沉以贴合拉丁字母视觉重心，是大多数排版软件的默认基准。",
  },
  embox: {
    label: "全字身居中（汉字视角）",
    shiftPx: -6,
    note: "把每个汉字当作独立方格（em-box）按字身中线居中：纯中文长文看着极整齐，但混入拉丁字母时若不调基线，西文会显得微偏下方（参考 W3C 中文排版需求 CLREQ）。",
  },
  optical: {
    label: "中西混排微调（+2px 抬升）",
    shiftPx: -2,
    note: "在专业双语杂志或设计系统里，常把中文相对西文基线微调约 1–2px，让汉字重心与西文 x-高度灰带连成一条平滑的视觉水平线。",
  },
};

export function initSection01() {
  const root = document.getElementById("sec-01");
  if (!root) return;

  const lineBtns = [...root.querySelectorAll("[data-line-key]")];
  const modeBtns = [...root.querySelectorAll("[data-cjk-mode]")];
  const stage = root.querySelector(".anatomy-lab");
  const lineTitle = root.querySelector("[data-line-title]");
  const lineDesc = root.querySelector("[data-line-desc]");
  const modeNote = root.querySelector("[data-cjk-note]");

  function selectLine(key) {
    const info = LINE_INFO[key];
    if (!info) return;
    lineBtns.forEach((b) => {
      const on = b.dataset.lineKey === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stage?.setAttribute("data-active-line", key);
    if (lineTitle) lineTitle.textContent = info.name;
    if (lineDesc) lineDesc.textContent = info.desc;
  }

  function selectMode(mode) {
    const cfg = CJK_MODES[mode];
    if (!cfg) return;
    modeBtns.forEach((b) => {
      const on = b.dataset.cjkMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stage?.style.setProperty("--cjk-shift", `${cfg.shiftPx}px`);
    if (modeNote) modeNote.textContent = cfg.note;
  }

  lineBtns.forEach((b) => b.addEventListener("click", () => selectLine(b.dataset.lineKey)));
  modeBtns.forEach((b) => b.addEventListener("click", () => selectMode(b.dataset.cjkMode)));

  // 原海报 5 大核心原理互动高亮
  const pCards = [...root.querySelectorAll(".principle-card")];
  pCards.forEach((c) => {
    c.addEventListener("click", () => {
      pCards.forEach((x) => {
        const on = x === c;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
    });
  });

  selectLine("baseline");
  selectMode("latin");
}

// ---------- 02 节：双面薄纸透光灯箱（Registerhaltigkeit 对行套准） ----------
const BACKUP_MODES = {
  aligned: {
    offsetPx: 0,
    label: "正反套准（0pt 错位）",
    clearPct: 96,
    grade: "白缝清澈 · 套准达标",
    explain: "背面油墨字影精准藏在正面每一行字的墨迹背后，行与行之间的空白保持干净，哪怕用 60g 薄纸双面印刷也能顺畅阅读。",
  },
  drift6: {
    offsetPx: 7,
    label: "错位 6pt（四分之一行）",
    clearPct: 58,
    grade: "边缘发毛 · 微微重影",
    explain: "背面字行开始从正面文字脚底探出灰边，字行轮廓像没对准焦的重影，长读几页后眼睛会明显觉得发酸。",
  },
  half12: {
    offsetPx: 14,
    label: "错位 12pt（正落行间白缝）",
    clearPct: 24,
    grade: "白缝填灰 · 透印发花",
    explain: "最糟的透印错位：背面整行字正好透进正面两行之间的白缝里，纸面灰白对比瞬间塌掉，整页看起来像被水洇脏。",
  },
};

export function initSection02() {
  const root = document.getElementById("sec-02");
  if (!root) return;

  const slider = root.querySelector("#thin-opacity");
  const opVal = root.querySelector("[data-op-val]");
  const modeBtns = [...root.querySelectorAll("[data-backup-mode]")];
  const sheet = root.querySelector(".thin-sheet");
  const gradeEl = root.querySelector("[data-backup-grade]");
  const clearEl = root.querySelector("[data-backup-clear]");
  const explainEl = root.querySelector("[data-backup-explain]");

  let curMode = "half12"; // 开场先停在错位 12pt，让用户一眼看到透印发花的惨状，再点套准对比！

  function sync() {
    const cfg = BACKUP_MODES[curMode];
    const op = Number(slider?.value ?? 34);
    if (opVal) opVal.textContent = `${op}%`;
    sheet?.style.setProperty("--back-opacity", (op / 100).toFixed(2));
    sheet?.style.setProperty("--back-offset", `${cfg.offsetPx}px`);
    sheet?.setAttribute("data-backup-state", curMode);

    // 结合透光度估算行间净白保留率（示意）
    const penalty = curMode === "aligned" ? op * 0.08 : curMode === "drift6" ? op * 0.85 : op * 1.65;
    const clearEst = Math.max(12, Math.min(99, Math.round(100 - penalty)));
    if (gradeEl) {
      gradeEl.textContent = cfg.grade;
      gradeEl.dataset.tone = curMode === "aligned" ? "ok" : "err";
    }
    if (clearEl) clearEl.textContent = `${clearEst}%（示意）`;
    if (explainEl) explainEl.textContent = cfg.explain;

    modeBtns.forEach((b) => {
      const on = b.dataset.backupMode === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  slider?.addEventListener("input", sync);
  modeBtns.forEach((b) => b.addEventListener("click", () => {
    curMode = b.dataset.backupMode;
    sync();
  }));
  sync();
}

// ---------- 03 节：从铅字到 4px 屏幕（史料节点 + 半行距盒模型切换） ----------
const HISTORY_NODES = {
  lead: {
    year: "15–19 世纪",
    title: "抄本划格与金属活字插铅（Leading）",
    source: "欧洲抄本针刺划格（pricking & ruling）与活字排印工艺",
    body: "中世纪羊皮纸抄本在落笔前先用骨锥沿页边刺孔、拉出平行行线，保证双页齐行。古腾堡之后，排字工在金属铅字行之间插入不同厚度的薄铅条（lead strip）拉开行距，「Leading（行距）」一词由此而来；薄纸双面印刷进而确立了正反页严守基线的「对行套准（Registerhaltigkeit）」工艺。",
  },
  ruder: {
    year: "1967",
    title: "Emil Ruder《Typographie》",
    source: "Emil Ruder, Typographie: A Manual of Design, Verlag Arthur Niggli (1967)",
    body: "巴塞尔设计学派代表人物鲁德尔在这本瑞士排印经典中，系统剖析了行距（Durchschuss）如何塑造文字「行带（Zeilenband）」的光学灰度：行距过紧会摧毁字行的独立导引，过宽又会让段落散成彼此割裂的孤线。",
  },
  brockmann: {
    year: "1981",
    title: "Josef Müller-Brockmann《Grid Systems》",
    source: "Josef Müller-Brockmann, Grid Systems in Graphic Design / Raster Systeme, Arthur Niggli (1981)",
    body: "米勒-布罗克曼将数十年瑞士国际主义排印经验写成教科书，把纸张开本、栏宽、字号与行距统合进严格的数学倍数结构里——明确指出标题、图注与栏间空白都必须与正文行距成整倍关系，网格是带来清晰与经济的助手而非牢笼。",
  },
  bringhurst: {
    year: "1992",
    title: "Robert Bringhurst《字体排印风格要素》",
    source: "Robert Bringhurst, The Elements of Typographic Style, Sec. 2.2 Vertical Motion, Hartley & Marks (1992)",
    body: "布林赫斯特在第 2.2 节「纵向律动」中写下广为流传的比喻：排版里的纵向空间就像音乐里的时间节拍，行距是「从一条基线到下一条基线的距离」；正文在经历标题、引文或表格变奏后，应当「精准回到同一节拍与相位上」。",
  },
  rutter: {
    year: "2006",
    title: "Richard Rutter 把垂直韵律带进 CSS",
    source: "Richard Rutter, Compose to a Vertical Rhythm, 24 ways (Dec 12, 2006)",
    body: "网页早期没有印刷软件那样的「对齐到基线网格」开关。2006 年 12 月，鲁特在 24 ways 发文，将 Bringhurst 的节拍理念转译成前端公式：围绕同一个基础 line-height，把所有标题的 font-size、line-height 与上下 margin 都换算成基准步长的整倍数。",
  },
  modern: {
    year: "2014–至今",
    title: "4dp 子基线与 W3C text-box-trim",
    source: "Material Design 4dp Baseline Grid · W3C CSS Line Grid & CSS Inline Layout Level 3",
    body: "界面设计发现：按印刷 24pt 强锁整个 App 会撑爆小标签与按钮，于是 Material Design 确立了「8dp 布局 + 4dp 排印基线」的子网格体系。与此同时，W3C 推出 CSS Line Grid 与 CSS Inline Layout Level 3（text-box-trim / text-box-edge），终于允许浏览器裁去行盒上下多余的半行距（half-leading），让文字边缘能直接贴齐基线。",
  },
};

const BOX_MODES = {
  lead: {
    label: "传统铅字 / InDesign",
    desc: "文字脚底直接坐在基线之上，额外行距（lead）从下方或按基线步长计算，跨栏对行直观可控。",
  },
  css: {
    label: "浏览器默认行盒（半行距）",
    desc: "CSS 把多出来的 line-height 一分为二（half-leading），上下各塞一半进内边距，导致文字顶底与网格线总差几个像素。",
  },
  trim: {
    label: "CSS text-box-trim（新标准）",
    desc: "通过 text-box: trim-both cap alphabetic 裁掉行盒上下多余的半行距与留空，使大写字母顶边与基线直接贴齐参考线。",
  },
};

export function initSection03() {
  const root = document.getElementById("sec-03");
  if (!root) return;

  const yearBtns = [...root.querySelectorAll("[data-hist-key]")];
  const yearEl = root.querySelector("[data-hist-year]");
  const titleEl = root.querySelector("[data-hist-title]");
  const bodyEl = root.querySelector("[data-hist-body]");
  const sourceEl = root.querySelector("[data-hist-source]");

  function selectHist(key) {
    const item = HISTORY_NODES[key];
    if (!item) return;
    yearBtns.forEach((b) => {
      const on = b.dataset.histKey === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (yearEl) yearEl.textContent = item.year;
    if (titleEl) titleEl.textContent = item.title;
    if (bodyEl) bodyEl.textContent = item.body;
    if (sourceEl) sourceEl.textContent = item.source;
  }

  yearBtns.forEach((b) => b.addEventListener("click", () => selectHist(b.dataset.histKey)));
  selectHist("bringhurst");

  const boxBtns = [...root.querySelectorAll("[data-box-mode]")];
  const boxDemo = root.querySelector(".halflead-demo");
  const boxDesc = root.querySelector("[data-box-desc]");

  function selectBox(mode) {
    const cfg = BOX_MODES[mode];
    if (!cfg) return;
    boxBtns.forEach((b) => {
      const on = b.dataset.boxMode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    boxDemo?.setAttribute("data-box-mode", mode);
    if (boxDesc) boxDesc.textContent = cfg.desc;
  }

  boxBtns.forEach((b) => b.addEventListener("click", () => selectBox(b.dataset.boxMode)));
  selectBox("css");
}

// ---------- 04 节：整倍回轨计算器（步进计数 + 亲密性分配） ----------
export function initSection04() {
  const root = document.getElementById("sec-04");
  if (!root) return;

  const state = {
    grid: 24,
    headingLead: 30,
    headingLines: 2,
    marginTop: 14,
    marginBottom: 8,
  };

  const fields = {
    grid: { min: 16, max: 32, step: 4 },
    headingLead: { min: 22, max: 44, step: 2 },
    headingLines: { min: 1, max: 3, step: 1 },
    marginTop: { min: 0, max: 48, step: 2 },
    marginBottom: { min: 0, max: 36, step: 2 },
  };

  const valEls = {};
  for (const k of Object.keys(fields)) {
    valEls[k] = root.querySelector(`[data-calc-val="${k}"]`);
  }

  const totalEl = root.querySelector("[data-calc-total]");
  const multEl = root.querySelector("[data-calc-mult]");
  const statusEl = root.querySelector("[data-calc-status]");
  const visualEl = root.querySelector(".calc-stack");
  const explainEl = root.querySelector("[data-calc-explain]");

  function render() {
    const r = calcRecovery(state);
    for (const k of Object.keys(fields)) {
      if (valEls[k]) valEls[k].textContent = k === "headingLines" ? `${state[k]} 行` : `${state[k]}pt`;
    }
    if (totalEl) totalEl.textContent = `${r.total}pt`;
    if (multEl) multEl.textContent = r.aligned ? `${r.nextMult}× 整倍` : `${r.mult}×（余 +${r.rem}pt）`;
    if (statusEl) {
      statusEl.textContent = r.aligned
        ? (r.proximityWarning ? "已落回基线 · 但段后偏大" : `已精准回轨（${r.nextMult}×）`)
        : `脱轨 +${r.rem}pt · 差 ${r.needAdd}pt 到 ${r.nextMult}×`;
      statusEl.dataset.tone = r.aligned ? (r.proximityWarning ? "warn" : "ok") : "err";
    }

    if (explainEl) {
      if (!r.aligned) {
        explainEl.textContent = `段前 ${state.marginTop}pt + 标题 ${state.headingLead}×${state.headingLines}（${r.rawHeading}pt）+ 段后 ${state.marginBottom}pt = ${r.total}pt。离最近的 ${r.nextMult}×（${r.targetTotal}pt）还差 ${r.needAdd}pt，下方第一行正文会被整体推离基线。点下方「亲密性凑整」自动把大部分余量补给段前。`;
      } else if (r.proximityWarning) {
        explainEl.textContent = `总高 ${r.total}pt 虽然刚好是 ${state.grid}pt 的 ${r.nextMult}× 整倍，但段后留白（${state.marginBottom}pt）不小于段前（${state.marginTop}pt），标题在视觉上会漂在两段正文正中间，分不清它属于上文还是下文。`;
      } else {
        explainEl.textContent = `总高 ${r.total}pt = ${r.nextMult} × ${state.grid}pt，下方正文稳稳踩回基线；同时段前 ${state.marginTop}pt > 段后 ${state.marginBottom}pt，标题牢牢吸住它所统领的正文段落。`;
      }
    }

    // 绘制实时纵尺与三段色块堆叠（段前 / 标题体 / 段后 + 下方首行正文落点）
    if (visualEl) {
      const pxPerPt = 2.3;
      const maxSlots = Math.max(4, r.nextMult + 1);
      const totalH = Math.round(maxSlots * state.grid * pxPerPt);
      visualEl.style.setProperty("--stack-h", `${totalH}px`);
      visualEl.style.setProperty("--grid-px", `${state.grid * pxPerPt}px`);

      const topH = Math.round(state.marginTop * pxPerPt);
      const midH = Math.round(r.rawHeading * pxPerPt);
      const botH = Math.round(state.marginBottom * pxPerPt);

      const segTop = visualEl.querySelector(".seg-top");
      const segMid = visualEl.querySelector(".seg-mid");
      const segBot = visualEl.querySelector(".seg-bot");
      const nextLine = visualEl.querySelector(".seg-next");
      const rulerCol = visualEl.querySelector(".calc-ruler");

      if (segTop) {
        segTop.style.height = `${topH}px`;
        segTop.querySelector("span").textContent = `段前 ${state.marginTop}pt`;
      }
      if (segMid) {
        segMid.style.height = `${midH}px`;
        segMid.querySelector("span").textContent = `标题体 ${state.headingLines} 行 · ${r.rawHeading}pt`;
      }
      if (segBot) {
        segBot.style.height = `${botH}px`;
        segBot.querySelector("span").textContent = `段后 ${state.marginBottom}pt`;
      }
      if (nextLine) {
        nextLine.classList.toggle("is-aligned", r.aligned);
        nextLine.querySelector("strong").textContent = r.aligned
          ? `正文首行落于 ${r.total}pt（精确踩线 ${r.nextMult}×）`
          : `正文首行落于 ${r.total}pt（悬空 +${r.rem}pt，未踩线）`;
      }
      if (rulerCol) {
        rulerCol.innerHTML = Array.from({ length: maxSlots + 1 }, (_, i) => {
          const y = Math.round(i * state.grid * pxPerPt);
          return `<span class="calc-tick" style="top:${y}px">${i}× · ${i * state.grid}pt</span>`;
        }).join("");
      }
    }
  }

  root.querySelectorAll("[data-calc-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [k, dir] = btn.dataset.calcStep.split(":");
      const f = fields[k];
      if (!f) return;
      state[k] = Math.max(f.min, Math.min(f.max, state[k] + Number(dir) * f.step));
      render();
    });
  });

  root.querySelector("[data-calc-fix='proximity']")?.addEventListener("click", () => {
    const r = calcRecovery(state);
    if (!r.aligned) {
      state.marginTop = r.proximity.top;
      state.marginBottom = r.proximity.bottom;
    } else if (r.proximityWarning) {
      const sum = state.marginTop + state.marginBottom;
      state.marginTop = Math.ceil(sum * 0.7);
      state.marginBottom = sum - state.marginTop;
    }
    render();
  });

  root.querySelector("[data-calc-fix='even']")?.addEventListener("click", () => {
    const r = calcRecovery(state);
    const add = r.needAdd;
    const sum = state.marginTop + state.marginBottom + add;
    state.marginTop = Math.floor(sum / 2);
    state.marginBottom = sum - state.marginTop;
    render();
  });

  root.querySelector("[data-calc-fix='reset']")?.addEventListener("click", () => {
    state.grid = 24;
    state.headingLead = 30;
    state.headingLines = 2;
    state.marginTop = 14;
    state.marginBottom = 8;
    render();
  });

  render();
}

// ---------- 05 节：什么时候别用它（4 张「死板硬锁 ↔ 聪明放行」对照卡） ----------
export function initSection05() {
  const root = document.getElementById("sec-05");
  if (!root) return;

  root.querySelectorAll(".break-card").forEach((card) => {
    const btn = card.querySelector("[data-break-toggle]");
    const badge = card.querySelector("[data-break-badge]");
    const note = card.querySelector("[data-break-note]");
    const lockedText = card.dataset.lockedNote;
    const relaxedText = card.dataset.relaxedNote;

    function apply(relaxed) {
      card.classList.toggle("is-relaxed", relaxed);
      if (btn) {
        btn.textContent = relaxed ? "切回：硬锁 24pt 翻车态" : "切换：聪明放行解法";
        btn.setAttribute("aria-pressed", String(relaxed));
      }
      if (badge) badge.textContent = relaxed ? "局部放行 · 恰当" : "死板硬锁 · 翻车";
      if (note) note.textContent = relaxed ? relaxedText : lockedText;
    }

    btn?.addEventListener("click", () => apply(!card.classList.contains("is-relaxed")));
    apply(false); // 开场展示硬锁翻车态，让用户亲手点开解法对比
  });
}

// ---------- 06 节：眼力小测（4 张实绘双栏 2D Canvas + 揭晓拉线验证） ----------
function drawQuizCardCanvas(canvas, opt, revealed) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 280;
  const h = rect.height || 176;
  const dpr = pixelRatio(2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  const g = opt.grid; // 24
  const maxPt = 216;
  const padX = 12;
  const padY = 12;
  const scaleY = (h - padY * 2) / maxPt;
  const toY = (pt) => padY + pt * scaleY;
  const midX = w / 2;
  const colW = midX - padX - 8;

  // 揭晓答案后才拉出全幅电光靛紫基准横线！答题前不画线，靠眼力看跨栏齐不齐
  if (revealed) {
    for (let pt = 0; pt <= maxPt; pt += g) {
      const y = Math.round(toY(pt)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(w - 4, y);
      ctx.strokeStyle = "rgba(81, 39, 201, 0.36)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 中缝细线
  ctx.beginPath();
  ctx.moveTo(midX, 8);
  ctx.lineTo(midX, h - 8);
  ctx.strokeStyle = "#E4E2DF";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 左栏参照正文（8 行稳踩 24, 48, 72, 96, 120, 144, 168, 192）
  const leftLines = [
    "城市街区的尺度往往",
    "藏在日常步行的节奏",
    "里。两栏文字并置时",
    "眼睛会在不知不觉间",
    "横向扫视相邻行位。",
    "只要步长一致，双栏",
    "便像建筑立面的窗格",
    "般安静而笃定。",
  ];
  ctx.font = '400 11.2px "Noto Sans SC", sans-serif';
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#262832";
  leftLines.forEach((txt, i) => {
    const pt = (i + 1) * g;
    ctx.fillText(txt, padX, toY(pt), colW);
  });

  // 右栏（按该选项真实参数渲染）
  const rx = midX + 8;
  // 右栏小标题
  ctx.font = '700 12.5px "Noto Sans SC", sans-serif';
  ctx.fillStyle = "#0D0E12";
  ctx.fillText("建筑与网格韵律", rx, toY(opt.titleBlock * 0.62), colW);

  // 右栏第一段 3 行（起于 titleBlock）
  const rP1 = [
    "标题虽然占去两倍高",
    "度，但下方正文仍须",
    "重新落回同一条隐形",
  ];
  const rP2 = [
    "基线之上。换段之后",
    "若留白也取步长整倍",
    "整页才不会半路飘移",
  ];

  const rightEntries = [];
  rP1.forEach((txt, i) => rightEntries.push({ txt, pt: opt.titleBlock + i * opt.rightLead }));
  const p2Start = opt.titleBlock + 2 * opt.rightLead + opt.rightLead + opt.paraGap;
  rP2.forEach((txt, i) => rightEntries.push({ txt, pt: p2Start + i * opt.rightLead }));

  ctx.font = '400 11.2px "Noto Sans SC", sans-serif';
  for (const row of rightEntries) {
    if (row.pt > maxPt + 6) continue;
    const nearest = Math.round(row.pt / g) * g;
    const err = +(row.pt - nearest).toFixed(1);
    const bad = Math.abs(err) >= 0.5;
    const y = toY(row.pt);

    if (revealed && bad) {
      ctx.fillStyle = "rgba(194, 39, 59, 0.14)";
      ctx.fillRect(rx - 3, y - 10, colW + 5, 13);
      ctx.strokeStyle = "#C2273B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(rx - 5, toY(nearest));
      ctx.lineTo(rx - 5, y);
      ctx.stroke();
    } else if (revealed && !bad) {
      ctx.strokeStyle = "rgba(81, 39, 201, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX - 4, Math.round(y) + 0.5);
      ctx.lineTo(rx + colW, Math.round(y) + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = revealed && bad ? "#A11B2D" : "#262832";
    ctx.fillText(row.txt, rx, y, colW);
  }

  ctx.restore();
}

export function initSection06() {
  const root = document.getElementById("sec-06");
  if (!root) return;

  const cards = [...root.querySelectorAll(".quiz-card")];
  const feedback = root.querySelector("[data-quiz-feedback]");
  const resetBtn = root.querySelector("[data-quiz-reset]");
  let pickedId = null;

  function renderAll() {
    const revealed = pickedId !== null;
    cards.forEach((card) => {
      const id = card.dataset.quizId;
      const opt = QUIZ_OPTIONS.find((o) => o.id === id);
      const cv = card.querySelector("canvas");
      if (cv && opt) drawQuizCardCanvas(cv, opt, revealed);
      const specEl = card.querySelector(".qc-spec");
      if (specEl && opt) {
        specEl.textContent = revealed ? opt.spec : "24pt 基准 · 双栏样本（选后揭晓参数）";
      }

      card.classList.toggle("is-picked", id === pickedId);
      card.classList.toggle("is-correct", revealed && opt.correct);
      card.classList.toggle("is-wrong", revealed && id === pickedId && !opt.correct);
      card.setAttribute("aria-pressed", String(id === pickedId));
    });

    if (feedback) {
      if (!revealed) {
        feedback.hidden = true;
      } else {
        const chosen = QUIZ_OPTIONS.find((o) => o.id === pickedId);
        const right = QUIZ_OPTIONS.find((o) => o.correct);
        feedback.hidden = false;
        feedback.dataset.tone = chosen.correct ? "ok" : "err";
        feedback.querySelector("[data-qf-title]").textContent = chosen.correct
          ? "答对了！版本 B 是唯一从头到尾稳踩基线的版本"
          : `你选了 ${chosen.label}——拉开紫色校验线就能看到破绽`;
        feedback.querySelector("[data-qf-body]").textContent = chosen.correct
          ? chosen.reason
          : `${chosen.reason} 正解是 ${right.label}：${right.reason}`;
      }
    }
    if (resetBtn) resetBtn.hidden = !revealed;
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      pickedId = card.dataset.quizId;
      renderAll();
    });
  });

  resetBtn?.addEventListener("click", () => {
    pickedId = null;
    renderAll();
  });

  const ro = new ResizeObserver(renderAll);
  cards.forEach((c) => ro.observe(c));
  renderAll();
}

// ---------- 07 节：原海报灯箱（点击放大、拖动、缩放、Esc 关闭） ----------
export function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  if (!poster || !dialog) return;

  const bigImg = dialog.querySelector("#lightbox-img");
  const viewport = dialog.querySelector(".lb-viewport");
  const closeBtn = dialog.querySelector("[data-lb-close]");
  const zoomInBtn = dialog.querySelector("[data-lb-zoom='in']");
  const zoomOutBtn = dialog.querySelector("[data-lb-zoom='out']");
  const resetBtn = dialog.querySelector("[data-lb-zoom='reset']");
  const zoomLabel = dialog.querySelector("[data-lb-scale]");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function applyTransform() {
    if (bigImg) bigImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    if (bigImg && !bigImg.getAttribute("src")) bigImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeLightbox() {
    if (dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }

  openBtn?.addEventListener("click", openLightbox);
  poster.addEventListener("click", openLightbox);
  closeBtn?.addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      closeLightbox();
    }
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeLightbox();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(2.8, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.35).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  viewport?.addEventListener("wheel", (e) => {
    e.preventDefault();
    const next = scale + (e.deltaY < 0 ? 0.2 : -0.2);
    scale = Math.max(1, Math.min(2.8, +next.toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  viewport?.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    viewport.setPointerCapture?.(e.pointerId);
  });
  viewport?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    applyTransform();
  });
  const endDrag = () => { dragging = false; };
  viewport?.addEventListener("pointerup", endDrag);
  viewport?.addEventListener("pointercancel", endDrag);
}
