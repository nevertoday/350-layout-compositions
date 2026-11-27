// 345 引语页幻灯片版式 · 正文七节交互模块与原海报灯箱
// 相邻两节各用不同交互控件：
// 01 四桩剖面点亮器 | 02 双轨抢夺模拟条 | 03 放映厅三构图×双灯光台
// 04 演进脉络卡尺   | 05 红绿灯场景翻转卡 | 06 双题单变量盲测 | 07 原海报缩放拖曳灯箱

import { loop } from "../../lib/stage.js";

// ---------- 01 拆解四桩支柱：X-Ray 剖面切换器 ----------
const PILLARS_DATA = {
  mark: {
    no: "01",
    title: "引语",
    posterQuote: "视觉化引导 进入主题",
    en: "VISUAL ENTRY",
    body: "巨型弯引号或一道利落的竖杠，作用不是凑装饰，而是像舞台灯光暗下后打出的第一束追光——观众在读到第一个汉字之前，就已经知道「接下来要听一句别人的核心判断」。",
    tip: "实操经验值：弯引号取浅色或半透明质感，体量可以大到正文 3–4 倍，但对比度必须低于正文，绝不能喧宾夺主。",
    layer: "mark",
  },
  focus: {
    no: "02",
    title: "重点句",
    posterQuote: "聚焦核心观点 强化记忆",
    en: "CORE SENTENCE",
    body: "整页只留一句话，并在这句话里只挑 2–6 个核心词做颜色或笔触强调。345 原海报把整句压到 18 字、分 3 行，再把「思考」染成鸢尾紫、底下轻刷一道绯粉水彩——视线的终点被精准锁死。",
    tip: "实操经验值：强调字数不超过全句的 35%；一旦标亮超过一半，对比度就被稀释回「满屏平铺」。",
    layer: "focus",
  },
  space: {
    no: "03",
    title: "情绪留白",
    posterQuote: "给予呼吸空间 传递情绪氛围",
    en: "EMOTIONAL BREATHING",
    body: "演示文稿最怕从头到尾维持同一密度。连续翻过三四页数据表与要点清单后，突然切进一张有 60% 以上空域的引语页，就像乐谱里的小节休止符，逼着房间里的节奏慢下来。",
    tip: "实操经验值：引语页四周与内环留白常占 55%–75%；留白来自「删掉杂物」，绝不是把字缩成后排看不清的米粒。",
    layer: "space",
  },
  author: {
    no: "04",
    title: "署名",
    posterQuote: "明确来源 增强可信度",
    en: "CREDIBLE ATTRIBUTION",
    body: "引语页能替你借力增信，全靠这一行落款。写清姓名、身份或书名年份，字号控制在正文的 35%–45% 左右，既稳住主次层级，也让台下知道这句话确有来处。",
    tip: "避坑底线：绝不放查无出处的网络伪名言。哪怕 345 原海报示例句，也须注明它是中文流传意译而非原研哉原著逐字引文。",
    layer: "author",
  },
};

function initSection01() {
  const btns = [...document.querySelectorAll("[data-pillar-tab]")];
  const diagram = document.getElementById("s1-diagram");
  const titleEl = document.getElementById("s1-detail-title");
  const quoteEl = document.getElementById("s1-detail-quote");
  const enEl = document.getElementById("s1-detail-en");
  const bodyEl = document.getElementById("s1-detail-body");
  const tipEl = document.getElementById("s1-detail-tip");
  if (!btns.length || !diagram) return;

  const activate = (key) => {
    const d = PILLARS_DATA[key] || PILLARS_DATA.mark;
    diagram.dataset.active = key;
    btns.forEach((b) => {
      const on = b.dataset.pillarTab === key;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    titleEl.textContent = `${d.no} · ${d.title}`;
    quoteEl.textContent = `海报原话：「${d.posterQuote}」`;
    enEl.textContent = d.en;
    bodyEl.textContent = d.body;
    tipEl.textContent = d.tip;
  };

  btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.pillarTab)));
  diagram.querySelectorAll("[data-svg-pillar]").forEach((g) => {
    g.addEventListener("click", () => activate(g.dataset.svgPillar));
  });
  activate("mark");
}

// ---------- 02 多少字才够停：6 秒演讲字幕 × 观众阅读双轨模拟 ----------
const SPEAKER_CUES = [
  { at: 0.0, text: "0.0s 翻页：台下视线瞬间切向大屏。" },
  { at: 1.5, text: "1.5s 开口：「这是我们访谈里最戳心的一句话——」" },
  { at: 3.2, text: "3.2s 展开：「背后其实藏着三个被忽略的流程断点……」" },
  { at: 4.8, text: "4.8s 推进：「接下来我们看具体怎么改。」" },
];

const SAMPLE_SNIPPETS = [
  { max: 11, text: "设计为了承载思考。" },
  { max: 16, text: "设计不止解题，更承载思考。" },
  { max: 22, text: "设计不是为了解决问题，而是为了承载思考。" },
  { max: 32, text: "设计并不只是为了解决眼前的问题，它更重要的作用是承载持续的思考。" },
  { max: 46, text: "很多人习惯把设计理解成修补故障的工具，但退后一步看，设计不只是为了解决问题，更是为了承载长远的思考。" },
  { max: 62, text: "在追求快速交付的商业环境里，很多人习惯把设计当成修补具体故障的工具，但退后一步重新审视器物与人的关系，设计不只是为了解决问题，而是为了承载长远的思考。" },
  { max: 80, text: "在当下追求快速交付的商业环境里，很多人习惯把设计简单理解成修补具体故障的工具，但如果退后一步重新审视器物与人的关系，就会发现设计并不是单纯为了解决眼前的局部问题，而是为了给更长远的思考留出安放的容器。" },
];

function initSection02() {
  const slider = document.getElementById("s2-chars");
  const playBtn = document.getElementById("s2-play");
  const charOut = document.getElementById("s2-char-val");
  const secOut = document.getElementById("s2-sec-val");
  const preview = document.getElementById("s2-preview");
  const eyeFill = document.getElementById("s2-eye-fill");
  const voiceFill = document.getElementById("s2-voice-fill");
  const statusEl = document.getElementById("s2-status");
  const cueEl = document.getElementById("s2-cue");
  const wrap = document.getElementById("s2-sim");
  if (!slider || !playBtn || !wrap) return;

  let playing = false;
  let elapsed = 0;

  const calc = (targetChars) => {
    const snippet = SAMPLE_SNIPPETS.find((s) => targetChars <= s.max)?.text || SAMPLE_SNIPPETS[SAMPLE_SNIPPETS.length - 1].text;
    const realChars = snippet.replace(/[，。！？、；：“”‘’\s]/g, "").length;
    const lines = Math.max(1, Math.ceil(realChars / 14));
    const readSec = +(realChars / 6.5 + Math.max(0, lines - 1) * 0.16).toFixed(1);
    return { chars: realChars, readSec, text: snippet };
  };

  const renderStatic = (simT) => {
    const c = calc(+slider.value);
    charOut.textContent = `${c.chars} 字`;
    secOut.textContent = `约 ${c.readSec} 秒（经验示意）`;
    preview.textContent = `“${c.text}”`;

    const dur = 6.0;
    const t = simT != null ? simT : Math.min(dur, c.readSec);
    const voicePct = Math.min(100, (t / dur) * 100);
    const eyePct = Math.min(100, (t / Math.max(0.5, c.readSec)) * 100);
    voiceFill.style.width = `${voicePct.toFixed(1)}%`;
    eyeFill.style.width = `${eyePct.toFixed(1)}%`;

    const collision = c.readSec > 3.1;
    wrap.dataset.collision = collision ? "yes" : "no";

    const cue = [...SPEAKER_CUES].reverse().find((q) => t >= q.at) || SPEAKER_CUES[0];
    cueEl.textContent = playing ? cue.text : (collision
      ? `3.2s 时讲者已经切入下段解释，但台下眼睛还要再读 ${(c.readSec - 3.2).toFixed(1)} 秒——语言通道撞车。`
      : `约 ${c.readSec} 秒内扫完，1.5s–3.0s 之间观众就会自然抬头看向演讲者，听觉通道完全畅通。`);

    if (c.chars <= 26) {
      statusEl.textContent = "通道错峰 · 3 秒内扫完抬头听讲";
    } else if (c.chars <= 38) {
      statusEl.textContent = "临界拉扯 · 稍慢的观众会漏听开头";
    } else {
      statusEl.textContent = "冗余撞车 · 观众低头读字，耳朵自动屏蔽讲者";
    }
  };

  const ctl = loop(wrap, (_t, dt, { still }) => {
    if (!playing) return;
    if (still) {
      playing = false;
      playBtn.textContent = "模拟 6 秒演讲双轨";
      renderStatic(null);
      return;
    }
    elapsed += dt;
    if (elapsed >= 6.0) {
      elapsed = 6.0;
      renderStatic(6.0);
      playing = false;
      playBtn.textContent = "再放一遍 6 秒演讲";
      return;
    }
    renderStatic(elapsed);
  });

  slider.addEventListener("input", () => {
    playing = false;
    playBtn.textContent = "模拟 6 秒演讲双轨";
    renderStatic(null);
  });

  playBtn.addEventListener("click", () => {
    playing = true;
    elapsed = 0;
    playBtn.textContent = "演播中（6 秒）…";
    renderStatic(0);
    ctl.draw();
  });

  renderStatic(null);
}

// ---------- 03 放映厅暗室对照：三构图 × 双场地灯控 + 标点悬挂 ----------
const AUDITORIUM_COPY = {
  halo: {
    name: "居中光环式（345 原海报原型）",
    note: "以中轴对称与象牙弯引号半环托住短句，情绪最沉静，适合演讲中段需要全场屏息的观念定调。",
  },
  bar: {
    name: "左齐竖杠式（现代会议/发布风）",
    note: "左侧一道高对比鸢尾紫竖杠干脆划出边界，文字统一左齐起笔，适合 2–3 行中长句与商务复盘。",
  },
  split: {
    name: "侧影双栏式（人物语录/访谈证言）",
    note: "一侧放发言者低干扰人物剪影（只取轮廓、不抢视线），另一侧排引文与署名，一眼建立「这句话是谁说的」具象记忆。",
  },
};

function initSection03() {
  const stage = document.getElementById("s3-stage");
  const noteEl = document.getElementById("s3-note");
  const titleEl = document.getElementById("s3-title");
  const layoutBtns = [...document.querySelectorAll("[data-s3-layout]")];
  const roomBtns = [...document.querySelectorAll("[data-s3-room]")];
  const hangBtn = document.getElementById("s3-hang");
  if (!stage || !layoutBtns.length) return;

  const state = { layout: "halo", room: "dark", hang: true };

  const sync = () => {
    stage.dataset.layout = state.layout;
    stage.dataset.room = state.room;
    stage.dataset.hang = state.hang ? "on" : "off";

    layoutBtns.forEach((b) => {
      const on = b.dataset.s3Layout === state.layout;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    roomBtns.forEach((b) => {
      const on = b.dataset.s3Room === state.room;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    if (hangBtn) {
      hangBtn.setAttribute("aria-pressed", String(state.hang));
      hangBtn.classList.toggle("is-active", state.hang);
      hangBtn.textContent = state.hang ? "标点光学悬挂：开" : "标点光学悬挂：关";
    }

    const d = AUDITORIUM_COPY[state.layout];
    titleEl.textContent = d.name;
    const roomTip = state.room === "bright"
      ? "明亮会议室下，浅底深墨字抗环境光最稳，但浅色引号需略提明度差以免发白消失。"
      : "昏暗礼堂大屏下，深宵紫底不会刺眼，象牙白文字与柔粉笔触能把全场注意力锁回屏幕中央。";
    const hangTip = state.hang
      ? "当前已开启光学悬挂（Bringhurst 1992）：开引号轻轻探出左缘外侧，首行汉字与下方正文竖直齐平。"
      : "关闭光学悬挂后，开引号被硬挤进字框内，第一行汉字会明显往右凹进一截。";
    noteEl.textContent = `${d.note} ${roomTip} ${hangTip}`;
  };

  layoutBtns.forEach((b) => b.addEventListener("click", () => { state.layout = b.dataset.s3Layout; sync(); }));
  roomBtns.forEach((b) => b.addEventListener("click", () => { state.room = b.dataset.s3Room; sync(); }));
  hangBtn?.addEventListener("click", () => { state.hang = !state.hang; sync(); });
  sync();
}

// ---------- 04 从哪来：演进脉络卡尺 ----------
const ERAS = {
  "1987": {
    year: "1987",
    tag: "Forethought · PowerPoint 1.0",
    title: "项目符号模板成为默认语言",
    body: "1987 年 4 月 20 日，Robert Gaskins 与 Dennis Austin 在硅谷公司 Forethought 发布 PowerPoint 1.0（最初用于黑白 Macintosh 制作胶片与讲义，同年 7 月被微软收购）。标题加多级圆点列表迅速统一了全球会议室，却也让演讲屏幕逐渐变成密密麻麻的提纲纸。",
    schematic: "bullets",
    caption: "1987 年代典型投影胶片：顶标 + 多层圆点清单，缺少情绪停顿。",
  },
  "1992": {
    year: "1992",
    tag: "Robert Bringhurst & 印刷拉出引文",
    title: "书籍与杂志的拉出引文与弯引号规矩",
    body: "早在幻灯片之前，报刊与书籍设计就已经用「拉出引文（Pull Quote）」把长文里最锋利的一句放大留白，充当读者的呼吸口。Robert Bringhurst 在 1992 年首版《The Elements of Typographic Style》（Hartley & Marks）中系统确立了弯引号与标点光学悬挂；Matthew Butterick 在《Practical Typography》里进一步提醒：直引号是打字机省键位的遗留，专业排版一律该用弯引号。",
    schematic: "pullquote",
    caption: "书刊拉出引文：放大核心句、弯引号悬出齐边，留白切开长栏。",
  },
  "2003": {
    year: "2003",
    tag: "Edward Tufte & Apple Keynote",
    title: "对「要点暴政」的猛烈反思与剧场化转折",
    body: "2003 年，信息设计学者 Edward Tufte 出版《The Cognitive Style of PowerPoint》（Graphics Press），尖锐批评默认要点模板把复杂因果压扁成破碎口号；同年 Apple 推出 Keynote，把大字号排印与电影级留白带进主题演讲台，引发全球演讲者重新思考「一页到底该放多少字」。",
    schematic: "contrast",
    caption: "2003 年转折：从密字要点转向大字排版与低密度剧场感。",
  },
  "2008": {
    year: "2008",
    tag: "Garr Reynolds & Nancy Duarte",
    title: "极简引语页确立为演讲叙事的标准停顿页",
    body: "2008 年，Garr Reynolds《Presentation Zen》（New Riders）与 Nancy Duarte《slide:ology》（O'Reilly Media）先后出版，结合 Richard E. Mayer《Multimedia Learning》（2001，Cambridge University Press）揭示的语言通道冗余效应，共同把「简短、高留白、有明确署名」的引语页推成现代演讲切换节奏、借力背书的核心版式。",
    schematic: "modern",
    caption: "2008 年至今：一页一句 + 视觉引导引号 + 大片留白 + 清晰署名。",
  },
};

function initSection04() {
  const btns = [...document.querySelectorAll("[data-era]")];
  const card = document.getElementById("s4-card");
  const yearEl = document.getElementById("s4-year");
  const tagEl = document.getElementById("s4-tag");
  const titleEl = document.getElementById("s4-title");
  const bodyEl = document.getElementById("s4-body");
  const capEl = document.getElementById("s4-cap");
  if (!btns.length || !card) return;

  const select = (k) => {
    const e = ERAS[k] || ERAS["2008"];
    card.dataset.schematic = e.schematic;
    btns.forEach((b) => {
      const on = b.dataset.era === k;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    yearEl.textContent = e.year;
    tagEl.textContent = e.tag;
    titleEl.textContent = e.title;
    bodyEl.textContent = e.body;
    capEl.textContent = e.caption;
  };

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("2008");
}

// ---------- 05 什么时候别用：红绿灯场景速检翻转卡 ----------
function initSection05() {
  const cards = [...document.querySelectorAll("[data-when-card]")];
  cards.forEach((card) => {
    const btn = card.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = card.classList.toggle("is-revealed");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
}

// ---------- 06 眼力小练习：2 道单变量四选一盲测 ----------
const QUIZZES = [
  {
    id: "q1",
    prompt: "场景 1：15 分钟产品发布会中段，刚讲完 4 页功能细节，你需要一张用户原声引语页让全场停下来记住核心价值。以下四张草图各只差一个变量，哪一张最有效？",
    correct: "B",
    reasons: {
      A: "方案 A 把 68 字完整访谈原稿塞成 5 行。台下观众埋头读字就会漏听你的口头衔接，引语页应有的「3 秒静场停顿」荡然无存。",
      B: "判断准确！方案 B 把原话提纯成 2 行 16 字，只把核心短语染紫并轻刷笔触，保留约 65% 情绪留白，署名克制清晰——观众扫一眼就能抬头听你讲。",
      C: "方案 C 字数和留白都对，但整句 16 个字全部涂紫加底色。当每个字都在大声喊「看我」，视觉焦点反而归零，效果等同于毫无强调。",
      D: "方案 D 正文精炼，但底部署名比引文还粗大，还塞了三行个人履历。署名本是落款背书，绝不能喧宾夺主抢走主角句子。",
    },
  },
  {
    id: "q2",
    prompt: "场景 2：团队设计复盘课上，你要引用书里的一句话定调。四张草图正文同样精炼、留白充足，只在「引号处理与署名方式」上各差一处，选哪一张？",
    correct: "D",
    reasons: {
      A: "方案 A 用了键盘打字机直引号，单薄僵硬，在大屏上缺少引导视线进入引语区的视觉仪式感。",
      B: "方案 B 把高饱和深紫巨引号直接压盖在引文首字上，装饰和笔画正面打架，后排观众第一眼辨认正文会很吃力。",
      C: "方案 C 引号和留白都很舒服，但署名只写了「某知名设计师」——查无来处的模糊署名会让台下怀疑句子是编的，信任感瞬间打折。",
      D: "判断准确！方案 D 用轻盈低对比象牙弯引号温和引路，配可核实的作者姓名与书名年份，兼顾视觉呼吸与来源可信度。",
    },
  },
];

function initSection06() {
  const qBtns = [...document.querySelectorAll("[data-quiz-switch]")];
  const promptEl = document.getElementById("q-prompt");
  const optBtns = [...document.querySelectorAll("[data-quiz-opt]")];
  const fbBox = document.getElementById("q-feedback");
  const fbBadge = document.getElementById("q-fb-badge");
  const fbText = document.getElementById("q-fb-text");
  const resetBtn = document.getElementById("q-reset");
  const grid = document.getElementById("q-grid");
  if (!promptEl || !optBtns.length) return;

  let qIndex = 0;
  let picked = null;

  const render = () => {
    const q = QUIZZES[qIndex];
    grid.dataset.quiz = q.id;
    promptEl.textContent = q.prompt;
    qBtns.forEach((b, i) => {
      const on = i === qIndex;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    optBtns.forEach((b) => {
      const k = b.dataset.quizOpt;
      b.classList.remove("is-picked", "is-right", "is-wrong");
      b.setAttribute("aria-pressed", String(picked === k));
      if (picked) {
        if (k === picked) b.classList.add("is-picked", k === q.correct ? "is-right" : "is-wrong");
        else if (k === q.correct) b.classList.add("is-right");
      }
    });
    if (picked) {
      const ok = picked === q.correct;
      fbBox.hidden = false;
      fbBox.dataset.result = ok ? "ok" : "wrong";
      fbBadge.textContent = ok ? `✓ 选对了（方案 ${picked}）` : `× 再看一处细节（你选了方案 ${picked}，正解是方案 ${q.correct}）`;
      fbText.textContent = q.reasons[picked];
    } else {
      fbBox.hidden = true;
    }
  };

  qBtns.forEach((b, i) => b.addEventListener("click", () => { qIndex = i; picked = null; render(); }));
  optBtns.forEach((b) => b.addEventListener("click", () => { picked = b.dataset.quizOpt; render(); }));
  resetBtn?.addEventListener("click", () => { picked = null; render(); });
  render();
}

// ---------- 07 原海报缩放拖曳灯箱（只复用 #poster.src，不重复内联海报！） ----------
function initPosterLightbox() {
  const openBtn = document.getElementById("poster-btn");
  const thumb = document.getElementById("poster");
  const dialog = document.getElementById("poster-lb");
  const stage = document.getElementById("lb-stage");
  const img = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const zoomResetBtn = document.getElementById("lb-zoom-reset");
  const zoomVal = document.getElementById("lb-zoom-val");
  if (!openBtn || !thumb || !dialog || !img) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  const apply = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    if (zoomVal) zoomVal.textContent = `${Math.round(scale * 100)}%`;
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  const open = () => {
    if (!img.src) img.src = thumb.currentSrc || thumb.src;
    reset();
    dialog.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };

  const close = () => {
    if (dialog.hidden) return;
    dialog.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target === stage) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dialog.hidden) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); apply(); });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.35).toFixed(2));
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  });
  zoomResetBtn?.addEventListener("click", reset);

  stage?.addEventListener("wheel", (e) => {
    if (dialog.hidden) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(1, Math.min(3, +(scale + delta).toFixed(2)));
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });

  img.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    drag = { id: e.pointerId, x0: e.clientX - tx, y0: e.clientY - ty };
    try { img.setPointerCapture(e.pointerId); } catch {}
  });
  img.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = e.clientX - drag.x0;
    ty = e.clientY - drag.y0;
    apply();
  });
  img.addEventListener("pointerup", () => { drag = null; });
  img.addEventListener("pointercancel", () => { drag = null; });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initPosterLightbox();
}
