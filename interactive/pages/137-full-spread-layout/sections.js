// 137 通版跨页 · 正文互动实验室与灯箱模块（01 / 03 / 04 / 05 / 06 / 07 节）
// 相邻小节使用互不重复的原生控件形态：拉幕滑轨 / 四式蓝图装配 / 历史胶片时间轨 / 约束分诊开关 / 中性四选一考场 / 灯箱放大拖拽。

import { BINDING_SUBJECTS, mountBindingLab } from "./bindingCanvas.js";

// ---------- 01 节：双页合并拉幕（孤立双页 ↔ 通版全景） ----------
export function initCurtainLab() {
  const slider = document.getElementById("curtain-range");
  const spread = document.getElementById("curtain-spread");
  const gapVal = document.getElementById("curtain-gap-val");
  const ratioVal = document.getElementById("curtain-ratio-val");
  const stopsVal = document.getElementById("curtain-stops-val");
  const desc = document.getElementById("curtain-desc");
  const presetBtns = document.querySelectorAll("[data-curtain-preset]");
  if (!slider || !spread) return;

  function apply(pct) {
    const v = Math.max(0, Math.min(100, Number(pct)));
    const t = v / 100; // 0 = 孤立双页, 1 = 通版全景
    spread.style.setProperty("--merge", t.toFixed(3));
    slider.value = String(v);

    const innerGap = Math.round((1 - t) * 34);
    gapVal.textContent = innerGap === 0 ? "0 mm（无缝贯通）" : `${innerGap} mm 隔断`;
    const ratio = (0.75 + 0.75 * t).toFixed(2);
    ratioVal.textContent = t < 0.35 ? "0.75 : 1 × 2 孤页" : `${ratio} : 1 宽银幕`;
    stopsVal.textContent = t < 0.35 ? "2 次跳帧停顿（示意）" : t < 0.75 ? "1 次过脊微顿（示意）" : "0 次阻断 · 一气扫读（示意）";

    if (t < 0.35) {
      desc.textContent =
        "左右两页各自围起内边距和独立边框时，大脑把它们判为两张互不相干的竖幅单页——视线读完左页被迫煞车，再重新启动读右页。";
    } else if (t < 0.78) {
      desc.textContent =
        "内框逐渐撤去、视觉流开始伸向中缝，两页进入半融合过渡态；但只要色带还没完全咬合并撑抵外切边，宽银幕气势仍未完全释放。";
    } else {
      desc.textContent =
        "内边距彻底消融，粉红主视觉流贯穿左右直抵外缘——两张 3:4 竖页瞬间焊成一块 3:2 横向全景银幕，格式塔「良好连续性」接管视线，完成原海报说的「信息连续传达，强化整体叙事」。";
    }

    presetBtns.forEach((b) => {
      const target = Number(b.dataset.curtainPreset);
      b.setAttribute("aria-pressed", String(Math.abs(target - v) <= 5));
    });
  }

  slider.addEventListener("input", () => apply(slider.value));
  presetBtns.forEach((b) => {
    b.addEventListener("click", () => apply(b.dataset.curtainPreset));
  });
  apply(slider.value);
}

// ---------- 02 节：实体书脊翻页透视实验室 ----------
export function initBindingSection() {
  const canvas = document.getElementById("binding-canvas");
  if (!canvas) return;
  const angleInput = document.getElementById("lab-open-angle");
  const angleVal = document.getElementById("lab-open-angle-val");
  const creepInput = document.getElementById("lab-creep-mm");
  const creepVal = document.getElementById("lab-creep-mm-val");
  const verdictEl = document.getElementById("lab-binding-verdict");
  const subjectNoteEl = document.getElementById("lab-subject-note");
  const bindBtns = document.querySelectorAll("[data-lab-binding]");
  const subjBtns = document.querySelectorAll("[data-lab-subject]");

  const st = {
    binding: "perfect",
    subject: "headline",
    openAngle: 128,
    creepMm: 0,
  };

  let lab = null;

  function syncUI() {
    bindBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.labBinding === st.binding)));
    subjBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.labSubject === st.subject)));
    angleInput.value = String(st.openAngle);
    angleVal.textContent = `${st.openAngle}°`;
    creepInput.value = String(st.creepMm);
    creepVal.textContent = `${st.creepMm} mm`;
    subjectNoteEl.textContent = BINDING_SUBJECTS[st.subject].note;
    if (lab) lab.redraw();
  }

  lab = mountBindingLab(
    canvas,
    () => st,
    (m) => {
      verdictEl.textContent = m.verdict;
      verdictEl.dataset.level = m.level;
    },
  );

  bindBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.binding = b.dataset.labBinding;
      st.openAngle = st.binding === "perfect" ? 128 : st.binding === "saddle" ? 162 : 178;
      syncUI();
    });
  });

  subjBtns.forEach((b) => {
    b.addEventListener("click", () => {
      st.subject = b.dataset.labSubject;
      syncUI();
    });
  });

  angleInput.addEventListener("input", () => {
    st.openAngle = Number(angleInput.value);
    syncUI();
  });
  creepInput.addEventListener("input", () => {
    st.creepMm = Number(creepInput.value);
    syncUI();
  });

  syncUI();
}

// ---------- 03 节：四种跨页穿针引线法（SVG 蓝图装配器） ----------
const PATTERNS = {
  panorama: {
    title: "01 · 满幅全景底图型",
    en: "FULL-BLEED PANORAMA",
    fit: "自然地理画册、建筑实景、汽车与旅行专题开篇",
    rule: "一张足够震撼的高解析度横幅影像铺满两页，文字集中收在天空、水面或暗部留白区；主体人物与核心建筑偏移到左或右的三分区域，绝不让关键面孔骑在装订线上。",
    caution: "依赖高质量宽幅素材，且尽量配锁线平摊或骑马订，避免厚胶装吞掉中段地平线。",
  },
  ribbon: {
    title: "02 · 流动色带 / 轨迹贯穿型（137 原海报范式）",
    en: "CONTINUOUS RIBBON BRIDGE",
    fit: "概念海报、年度报告章节页、展览导览、数据叙事跨页",
    rule: "左右两页共享沉静统一的纯色或微纹理底场，用一条高反差几何色带、折线轨迹或丝带从左切边斜穿书脊抵达右切边——文字沿着丝带或在丝带让出的负空间落位。",
    caution: "接缝处必须做到 0mm 严格齐缝，带宽保持在版高 18%–38% 经验区间，太细断气、太肥吞掉留白。",
  },
  supertype: {
    title: "03 · 超大标题跨脊压阵型",
    en: "BRIDGE HEADLINE SPREAD",
    fit: "杂志人物特稿开篇、先锋设计季刊、品牌宣言手册",
    rule: "靠极具张力的特大标题字形横跨左右两页，用词与词之间的自然空隙（或字母宽谷）跨过书脊线，正文与配图退居左右安全栏，形成强烈的编辑级戏剧感。",
    caution: "切忌把细笔划小字压进书脊；中缝处的字距可按装订厚度做 +2mm 至 +6mm 视觉微调。",
  },
  sequence: {
    title: "04 · 叙事连环基线型",
    en: "CINEMATIC BASELINE SEQUENCE",
    fit: "纪录片分镜、工艺步骤分解、时间轴专题与摄影组照",
    rule: "不一定只有一张大图——3 到 5 幅连续镜头共享同一条贯穿双页的水平地平线或基线轨，辅以统一的色温与等距韵律，眼睛顺着共享轴线跨过中缝，读出电影摇镜般的流动感。",
    caution: "跨缝处最好让两帧之间的细缝落在书脊附近，或让最长的一幅主镜头完整跨过书脊，避免把单帧小图切得支离破碎。",
  },
};

export function initBlueprintLab() {
  const btns = document.querySelectorAll("[data-pattern]");
  const stage = document.getElementById("bp-stage");
  const titleEl = document.getElementById("bp-title");
  const enEl = document.getElementById("bp-en");
  const fitEl = document.getElementById("bp-fit");
  const ruleEl = document.getElementById("bp-rule");
  const cautionEl = document.getElementById("bp-caution");
  const flowToggle = document.getElementById("bp-toggle-flow");
  const safeToggle = document.getElementById("bp-toggle-safe");
  if (!stage) return;

  function select(id) {
    const p = PATTERNS[id] || PATTERNS.panorama;
    stage.dataset.pattern = id;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pattern === id)));
    titleEl.textContent = p.title;
    enEl.textContent = p.en;
    fitEl.textContent = p.fit;
    ruleEl.textContent = p.rule;
    cautionEl.textContent = p.caution;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.pattern)));

  flowToggle?.addEventListener("click", () => {
    const next = flowToggle.getAttribute("aria-pressed") !== "true";
    flowToggle.setAttribute("aria-pressed", String(next));
    stage.classList.toggle("show-flow", next);
  });

  safeToggle?.addEventListener("click", () => {
    const next = safeToggle.getAttribute("aria-pressed") !== "true";
    safeToggle.setAttribute("aria-pressed", String(next));
    stage.classList.toggle("show-safe", next);
  });

  select("ribbon");
}

// ---------- 04 节：历史跨页胶片时间轨（已核实五大节点） ----------
const HISTORY_DATA = {
  1493: {
    year: "1493",
    work: "《纽伦堡编年史》Liber Chronicarum",
    who: "Hartmann Schedel 编纂 · Anton Koberger 印行 · Michael Wolgemut 与 Wilhelm Pleydenwurff 工坊刻版",
    craft: "15 世纪金属活字与双页对开大幅木刻",
    detail:
      "1493 年 7 月印行于纽伦堡，全书含 1,809 幅木刻插图（由 645 块木版印成）。书中纽伦堡、威尼斯、罗马等重大城景首次突破单页栏框，以无正文打断的双页全景木刻跨过装订线铺开，奠定了印刷史早期通版全景的视觉范式。",
    source: "美国国会图书馆（Library of Congress）珍本馆藏档案",
    mode: "woodcut",
  },
  1928: {
    year: "1928",
    work: "法国《Vu》画报创刊",
    who: "Lucien Vogel 创办并主编（巴黎，1928 年 3 月 21 日—1940 年）",
    craft: "凹版印刷（Rotogravure）与现代图片故事",
    detail:
      "Lucien Vogel 将构成主义编排引入大众周刊，借凹版印刷让高质量纪实照片直接满幅出血并跨越双页，使摄影本身成为叙事主角而非文字附庸，比美国同类画报早了近八年。",
    source: "纽约现代艺术博物馆（MoMA）Object:Photo 摄影期刊档案",
    mode: "vu",
  },
  1934: {
    year: "1934–1945",
    work: "《Harper's Bazaar》与摄影集《Ballet》",
    who: "Alexey Brodovitch（1898–1971），1934–1958 任艺术总监；《Ballet》1945 年 J.J. Augustin 出版",
    craft: "电影剪辑节奏 × 双页统一银幕",
    detail:
      "Brodovitch 彻底打破两页分立的静态画框，把整个对开跨页视为一块连续银幕来调度留白、剪裁与动势；在 1945 年摄影集《Ballet》中，104 幅芭蕾舞动态影像如胶片般绵延跨过书脊，赋予纸质书以流动时间感。",
    source: "大英百科全书（Encyclopædia Britannica）Alexey Brodovitch 词条",
    mode: "ballet",
  },
  1936: {
    year: "1936",
    work: "《LIFE》创刊号图片专题",
    who: "Margaret Bourke-White 摄影 · Henry Luce 创办（1936 年 11 月 23 日）",
    craft: "新闻纪实摄影的跨页叙事语法",
    detail:
      "创刊号封面刊出蒙大拿州 Fort Peck Dam 巨幅建筑照片，内页更以连续跨页图片故事（Photo Essay）展现水坝周边新兴小镇的真实生活，把「双页连续叙事」带入每周数百万读者的日常阅读经验。",
    source: "纽约现代艺术博物馆（MoMA）Margaret Bourke-White 馆藏记录",
    mode: "life",
  },
  1959: {
    year: "1959–1971",
    work: "西德青年文化杂志《Twen》",
    who: "Willy Fleckhaus 任艺术总监（西德，1959–1971）",
    craft: "巨幅跨页摄影 × 高反差紧排大标",
    detail:
      "Fleckhaus 坚持以双页跨页作为整本杂志的最小叙事单元，敢于将大片跨页空间交给极端裁切的高反差摄影，把文字果断收拢或退至后页，让读者翻页时产生强烈的呼吸与冲击节奏。",
    source: "英国设计期刊《Eye Magazine》Willy Fleckhaus 专题评述",
    mode: "twen",
  },
};

export function initHistoryTimeline() {
  const btns = document.querySelectorAll("[data-era]");
  const yearEl = document.getElementById("era-year");
  const workEl = document.getElementById("era-work");
  const whoEl = document.getElementById("era-who");
  const craftEl = document.getElementById("era-craft");
  const detailEl = document.getElementById("era-detail");
  const sourceEl = document.getElementById("era-source");
  const visualEl = document.getElementById("era-visual");
  if (!yearEl || !visualEl) return;

  function show(era) {
    const item = HISTORY_DATA[era] || HISTORY_DATA["1934"];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === era)));
    yearEl.textContent = item.year;
    workEl.textContent = item.work;
    whoEl.textContent = item.who;
    craftEl.textContent = item.craft;
    detailEl.textContent = item.detail;
    sourceEl.textContent = `核实来源：${item.source}`;
    visualEl.dataset.mode = item.mode;
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("1493");
}

// ---------- 05 节：出版物约束体检开关台（什么时候别用通版） ----------
export function initTriageLab() {
  const groups = document.querySelectorAll("[data-triage-group]");
  const badgeEl = document.getElementById("triage-badge");
  const titleEl = document.getElementById("triage-title");
  const reasonEl = document.getElementById("triage-reason");
  const altEl = document.getElementById("triage-alt");
  if (!badgeEl) return;

  const picked = {
    binding: "layflat",   // layflat | saddle | thick-perfect
    medium: "print",      // print | tablet-spread | phone-single
    density: "narrative", // narrative | mixed | lookup
    relation: "one-story",// one-story | two-topics
  };

  function evaluate() {
    const blockers = [];
    const cautions = [];
    let altHtml = "";

    if (picked.medium === "phone-single") {
      blockers.push("手机竖屏或单页 PDF 会把通版从正中拦腰劈开，读者一次只能看见半幅残图和半句标题");
      altHtml = '建议改用适合单页纵向流动的 <a href="https://layout.xiaoxiaodong.ai/132/play/" target="_blank" rel="noopener">132 单栏版式</a>。';
    }
    if (picked.relation === "two-topics") {
      blockers.push("左右两页讲的是互不相关的独立栏目，硬用通版连接会制造错误的因果联想");
      altHtml =
        altHtml ||
        '建议让双页各自成章，或用 <a href="https://layout.xiaoxiaodong.ai/135/play/" target="_blank" rel="noopener">135 对称跨页</a> / <a href="https://layout.xiaoxiaodong.ai/136/play/" target="_blank" rel="noopener">136 非对称跨页</a> 在独立秩序中做呼应。';
    }
    if (picked.density === "lookup") {
      blockers.push("高频检索文档（字典、年报明细、规格表）依赖稳定的分栏锚点与页眉索引，通版大视觉会打乱速查效率");
      altHtml =
        altHtml ||
        '建议改用高密度锚点清晰的 <a href="https://layout.xiaoxiaodong.ai/133/play/" target="_blank" rel="noopener">133 双栏版式</a> 或 <a href="https://layout.xiaoxiaodong.ai/134/play/" target="_blank" rel="noopener">134 多栏版式</a>。';
    }
    if (picked.binding === "thick-perfect") {
      cautions.push("厚本胶装中缝折谷深达 10–14mm：如果坚持做通版，只能让宽色带或背景风景跨缝，标题、人像与细正文必须彻底退到单页安全肩区");
    }
    if (picked.medium === "tablet-spread") {
      cautions.push("平板横屏双页浏览效果接近纸书，但要提前检查竖屏单页预览时是否会意外断字");
    }

    if (blockers.length > 0) {
      badgeEl.textContent = "不建议使用通版跨页";
      badgeEl.dataset.state = "avoid";
      titleEl.textContent = `触发 ${blockers.length} 项核心禁忌，强上通版反而毁掉阅读体验`;
      reasonEl.textContent = blockers.join("；") + "。";
      altEl.innerHTML = altHtml;
    } else if (cautions.length > 0) {
      badgeEl.textContent = "有条件慎用 · 必须避脊";
      badgeEl.dataset.state = "caution";
      titleEl.textContent = "可以采用通版，但必须配合「色带跨缝 + 关键信息避脊」规则";
      reasonEl.textContent = cautions.join("；") + "。";
      altEl.innerHTML =
        '同时留意四周边沿裁切工艺：若素材延伸至页边外，请配套参考 <a href="https://layout.xiaoxiaodong.ai/138/play/" target="_blank" rel="noopener">138 满出血版式</a>；若需留白护框，可参考 <a href="https://layout.xiaoxiaodong.ai/139/play/" target="_blank" rel="noopener">139 无出血版式</a>。';
    } else {
      badgeEl.textContent = "非常适合通版跨页";
      badgeEl.dataset.state = "good";
      titleEl.textContent = "装订、介质与叙事高度匹配，可以放心铺开双页宽银幕";
      reasonEl.textContent =
        "物理开本能平整展开、左右两页服务同一条核心叙事，且视觉主导而非密密麻麻查表——正是通版跨页最能释放整体感染力的舞台。";
      altEl.innerHTML =
        '搭配外缘无白边延伸时可衔接 <a href="https://layout.xiaoxiaodong.ai/138/play/" target="_blank" rel="noopener">138 满出血版式</a>，让宽银幕彻底撑满视野。';
    }
  }

  groups.forEach((group) => {
    const key = group.dataset.triageGroup;
    const btns = group.querySelectorAll("button[data-val]");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[key] = btn.dataset.val;
        btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        evaluate();
      });
    });
  });

  // 默认先停在一个常见的「厚胶装 + 手机单页」警示组合，让用户切换体检
  evaluate();
}

// ---------- 06 节：小练习（四选一，中性标签 A/B/C/D，仅差跨缝衔接与标题落位） ----------
const QUIZ_EXPLAIN = {
  A: {
    ok: false,
    headline: "再想想：方案 A 虽然色带连续，但中缝正中把标题和主角压进了胶装折谷",
    detail:
      "在屏幕上平看方案 A 似乎很居中气派，但题干明确是「厚本无线胶装」——翻开成书时，书脊中央 10–14mm 会向下折成深谷，压在中线上的汉字笔画和海岸主角剪影会被直接夹弯吞噬。",
  },
  B: {
    ok: false,
    headline: "再想想：方案 B 整齐干净，但中缝留白走廊把通版退化成了两张孤立单页",
    detail:
      "左右页各加细框并在书脊两侧切断色带，确实避开了装订损耗，但也彻底断掉了视觉流的格式塔连续性——它不再是「通版跨页」，而成了两张并排摆放的单页卡。",
  },
  C: {
    ok: true,
    headline: "答对了！方案 C 兼顾「通流跨缝」与「要害避脊」",
    detail:
      "宽阔的公路色带无缝斜穿书脊并直抵左右外切边，把两页牢牢焊成一块全景叙事画布；与此同时，关键汉字标题与说明整体落于右页宽阔肩区，安然避开厚胶装 14mm 暗谷，既连贯又耐印。",
  },
  D: {
    ok: false,
    headline: "再想想：方案 D 在书脊处把色带错开台阶，还拆裂了左右底色",
    detail:
      "为了给右页正文腾空而把右半段色带在中缝突然下错半个身位，再加上右页改用浅灰底色，读者眼睛刚跨过装订线就会遇到双重断层，通版的整体统一感立刻瓦解。",
  },
};

export function initQuiz() {
  const cards = document.querySelectorAll("[data-quiz-opt]");
  const fb = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("quiz-fb-head");
  const fbBody = document.getElementById("quiz-fb-body");
  const retryBtn = document.getElementById("quiz-retry");
  if (!cards.length || !fb) return;

  function pick(opt) {
    const res = QUIZ_EXPLAIN[opt];
    if (!res) return;
    cards.forEach((c) => {
      const k = c.dataset.quizOpt;
      c.setAttribute("aria-pressed", String(k === opt));
      c.dataset.result = k === "C" ? "correct" : k === opt ? "wrong" : "dim";
    });
    fb.hidden = false;
    fb.dataset.state = res.ok ? "ok" : "wrong";
    fbHead.textContent = res.headline;
    fbBody.textContent = res.detail;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.quizOpt)));
  retryBtn?.addEventListener("click", () => {
    cards.forEach((c) => {
      c.setAttribute("aria-pressed", "false");
      delete c.dataset.result;
    });
    fb.hidden = true;
  });
}

// ---------- 07 节：原海报灯箱（点击放大、拖动平移、滚轮/按钮缩放、Esc 关闭） ----------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open-btn");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbStage = document.getElementById("lightbox-stage");
  const zoomVal = document.getElementById("lightbox-zoom-val");
  const zoomIn = document.getElementById("lightbox-zoom-in");
  const zoomOut = document.getElementById("lightbox-zoom-out");
  const zoomReset = document.getElementById("lightbox-zoom-reset");
  const closeBtn = document.getElementById("lightbox-close");
  if (!trigger || !posterImg || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomVal) zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    resetView();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === lbStage) close();
  });

  window.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") {
      scale = Math.min(2.8, scale + 0.25);
      applyTransform();
    } else if (e.key === "-") {
      scale = Math.max(0.75, scale - 0.25);
      applyTransform();
    } else if (e.key === "0") {
      resetView();
    }
  });

  zoomIn?.addEventListener("click", () => {
    scale = Math.min(2.8, scale + 0.25);
    applyTransform();
  });
  zoomOut?.addEventListener("click", () => {
    scale = Math.max(0.75, scale - 0.25);
    applyTransform();
  });
  zoomReset?.addEventListener("click", resetView);

  lbStage?.addEventListener("pointerdown", (e) => {
    if (e.target !== lbImg) return;
    pan = { id: e.pointerId, x: e.clientX, y: e.clientY, tx, ty };
    try {
      lbImg.setPointerCapture(e.pointerId);
    } catch {}
  });
  window.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = pan.tx + (e.clientX - pan.x);
    ty = pan.ty + (e.clientY - pan.y);
    applyTransform();
  });
  window.addEventListener("pointerup", (e) => {
    if (pan && e.pointerId === pan.id) pan = null;
  });
}
