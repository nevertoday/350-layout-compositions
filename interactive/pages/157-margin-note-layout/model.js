// 157 边注版式 — 单真源几何、碰撞、交叉与诊断模型
// 画布绘制、顶栏读数、撕边诊单、五徽标实况带全部从此模块读取同一组实算结果。

export const THEMES = {
  poster: {
    id: "poster",
    name: "原海报页",
    en: "POSTER SPECIMEN",
    heading: "信息层级与视觉引导",
    lead: "有效的版式不仅传递信息，更引导信息的阅读顺序。通过层级、对比、留白与节奏的控制，帮助读者快速抓住重点。",
    quote: "好的版式，让阅读更轻松，让信息更有力量。",
    points: [
      { k: "层级清晰", v: "通过大小、粗细、颜色区分信息主次。" },
      { k: "对比明确", v: "对比是吸引注意力、建立焦点的关键手段。" },
      { k: "留白适度", v: "留白不是空白，而是呼吸与停顿的空间。" },
      { k: "节奏变化", v: "变化带来韵律，韵律提升阅读体验。" },
    ],
    notes: [
      {
        id: 0,
        role: "注释",
        en: "ANNOTATION",
        icon: "edit",
        material: "torn-light",
        anchorY: 0.19,
        anchorXRatio: 0.96,
        shortText: "补充说明、解释概念，帮助读者深化理解。",
        longText: "补充说明与术语解释本来只需一两行轻语，一旦扩写成整段论文式背景交代，右边缘就变成第二条正文，读者来回切换会迅速疲劳。",
      },
      {
        id: 1,
        role: "指示",
        en: "POINTER",
        icon: "target",
        material: "framed",
        anchorY: 0.43,
        anchorXRatio: 0.92,
        shortText: "使用符号或连线，引导视线，关联内容。",
        longText: "指示边注的使命是把视线轻巧地牵向图示关键节点；如果连线在注槽里彼此交叉打结，反倒把眼睛绊倒在半路，需要反复核对归属。",
      },
      {
        id: 2,
        role: "补充",
        en: "SUPPLEMENT",
        icon: "plus",
        material: "kraft",
        anchorY: 0.65,
        anchorXRatio: 0.96,
        shortText: "提供背景信息或扩展阅读，拓展知识边界。",
        longText: "扩展阅读与旁证史料属于典型的可选读信息：跳过它时正文逻辑仍须完整自洽，不能把主线转折塞进边栏里迫使人回头补课。",
      },
      {
        id: 3,
        role: "引导",
        en: "GUIDANCE",
        icon: "arrow",
        material: "framed",
        anchorY: 0.85,
        anchorXRatio: 0.96,
        shortText: "给出阅读建议或思考方向，帮助读者聚焦重点。",
        longText: "阅读提示与思考方向宜用短句点睛，并与对应摘句或小结处于同一水平高度；位置漂移过远时，它的即时提示作用就会落空。",
      },
    ],
  },
  feynman: {
    id: "feynman",
    name: "费曼讲义",
    en: "LECTURE FOLIO",
    heading: "第 10 章 · 动量守恒",
    lead: "若系统不受外力作用，则所有质点动量矢量之和在任意时刻保持恒定。这一守恒律直接关联空间平移对称性。",
    quote: "宽边栏原本为赶印黑板草图而设，却让图示与推导得以并肩呼吸。",
    points: [
      { k: "矢量形式", v: "Σ p = 常量，三个坐标分量各自独立守恒。" },
      { k: "作用反作用", v: "内力成对抵消，不改变系统总动量。" },
      { k: "碰撞检验", v: "无论弹性与否，碰撞前后总动量不变。" },
      { k: "相对论修正", v: "高速下需以 γmv 取代经典动量表达式。" },
    ],
    notes: [
      {
        id: 0,
        role: "注释",
        en: "NOTATION",
        icon: "edit",
        material: "torn-light",
        anchorY: 0.19,
        anchorXRatio: 0.96,
        shortText: "矢量 p = mv，粗体表示兼具大小与方向。",
        longText: "在本讲义符号体系中，粗体字母代表三维空间矢量，斜体字母代表标量大小；若读者遗忘前章定义，可在此平视核对而无需翻回目录。",
      },
      {
        id: 1,
        role: "指示",
        en: "DIAGRAM",
        icon: "target",
        material: "framed",
        anchorY: 0.43,
        anchorXRatio: 0.92,
        shortText: "两球对撞矢量图：黑圆与绛圆动量交换。",
        longText: "此处对应黑板上的弹性对撞草图：两质点在碰撞瞬间交换沿连心线方向的分量，中点琥珀标记代表整个孤立系统的质心轨迹。",
      },
      {
        id: 2,
        role: "补充",
        en: "ORIGIN",
        icon: "plus",
        material: "kraft",
        anchorY: 0.65,
        anchorXRatio: 0.96,
        shortText: "1963 年 Addison-Wesley 首版即用宽边栏排图。",
        longText: "合著者马修·桑兹回忆，为赶上 1963 年秋季学期出版，出版商专门采用单栏正文配宽边栏的四开本版式，把大量黑板图直接落入边栏。",
      },
      {
        id: 3,
        role: "引导",
        en: "CHECK",
        icon: "arrow",
        material: "framed",
        anchorY: 0.85,
        anchorXRatio: 0.96,
        shortText: "自检：若桌面存在摩擦，哪一方向仍守恒？",
        longText: "读完本段不妨停顿十秒：当滑块沿光滑斜面下滑时，竖直方向有外力，水平方向若无外力约束，水平分动量依然满足守恒律。",
      },
    ],
  },
  classic: {
    id: "classic",
    name: "朱墨古籍",
    en: "RUBRICATED CODEX",
    heading: "春秋左传 · 隐公元年",
    lead: "初，郑武公娶于申，曰武姜，生庄公及共叔段。庄公寤生，惊姜氏，故名曰寤生，遂恶之。爱共叔段，欲立之。",
    quote: "墨印经传正文，朱印天头眉批与旁圈，双色一眼分清原文与评点。",
    points: [
      { k: "起笔伏脉", v: "开篇三句点明母子嫌隙，全篇因果由此生发。" },
      { k: "请制请京", v: "两次请封层层递进，写尽贪欲与纵容。" },
      { k: "多行不义", v: "庄公静待其毙，语气温和而机锋深藏。" },
      { k: "黄泉相见", v: "颖考叔借羹讽谏，一转收束全篇骨肉之变。" },
    ],
    notes: [
      {
        id: 0,
        role: "注释",
        en: "GLOSS",
        icon: "edit",
        material: "torn-light",
        anchorY: 0.19,
        anchorXRatio: 0.96,
        shortText: "寤生：一说难产逆生，一说产妇惊醒而生。",
        longText: "历代注家对「寤生」多有辨析，杜预注作「寐寤而庄公已生」，应劭释为逆生难产，此处置入页边供读者随文比勘而不打断古文韵律。",
      },
      {
        id: 1,
        role: "指示",
        en: "STRUCTURE",
        icon: "target",
        material: "framed",
        anchorY: 0.43,
        anchorXRatio: 0.92,
        shortText: "朱圈标出全篇叙事支点：恶庄公、爱叔段。",
        longText: "明代评点本惯以朱色圈点勾勒文眼，将「惊」「恶」「爱」三字连成一条暗线，让读者一眼看透整段史传的情绪张力如何铺展。",
      },
      {
        id: 2,
        role: "补充",
        en: "EDITION",
        icon: "plus",
        material: "kraft",
        anchorY: 0.65,
        anchorXRatio: 0.96,
        shortText: "1616 年吴兴闵齐伋朱墨套印本，孙鑛眉批。",
        longText: "明万历四十四年（1616 年）乌程闵齐伋刻朱墨套印本《春秋左传》，经传墨印、眉批与旁圈朱印，是晚明套印注疏版式的代表。",
      },
      {
        id: 3,
        role: "引导",
        en: "READING",
        icon: "arrow",
        material: "framed",
        anchorY: 0.85,
        anchorXRatio: 0.96,
        shortText: "留心庄公答词：每次退让皆留后手。",
        longText: "读至此段建议对照前后祭仲与公子吕之谏，细看庄公寥寥数语如何不动声色地把主动权握在掌中，正是《左传》叙事含蓄处。",
      },
    ],
  },
};

export const PRESETS = {
  broken: {
    name: "0/4 错态",
    marginRatio: 0.42,
    noteY: [0.76, 0.42, 0.16, 0.85],
    scaleMode: "heavy",
    linkStyle: "mixed",
    mobileMode: "squeeze",
    selectedNote: 0,
  },
  poster: {
    name: "原海报折线解",
    marginRatio: 0.32,
    noteY: [0.19, 0.43, 0.65, 0.85],
    scaleMode: "balanced",
    linkStyle: "leader",
    mobileMode: "below-block",
    selectedNote: 0,
  },
  tufte: {
    name: "Tufte 上标解",
    marginRatio: 0.29,
    noteY: [0.19, 0.43, 0.65, 0.85],
    scaleMode: "balanced",
    linkStyle: "tufte",
    mobileMode: "inline-toggle",
    selectedNote: 1,
  },
  minimal: {
    name: "轻眉批宽文解",
    marginRatio: 0.25,
    noteY: [0.19, 0.43, 0.65, 0.85],
    scaleMode: "balanced",
    linkStyle: "leader",
    mobileMode: "inline-toggle",
    selectedNote: 2,
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    marginRatio: PRESETS.broken.marginRatio,
    noteY: [...PRESETS.broken.noteY],
    scaleMode: PRESETS.broken.scaleMode,
    linkStyle: PRESETS.broken.linkStyle,
    mobileMode: PRESETS.broken.mobileMode,
    selectedNote: PRESETS.broken.selectedNote,
    showSightline: true,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 严格二维线段相交测试（返回交点坐标，排除端点重合）
function segmentIntersection(p1, p2, p3, p4) {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

function polylineIntersection(ptsA, ptsB) {
  for (let i = 0; i < ptsA.length - 1; i++) {
    for (let j = 0; j < ptsB.length - 1; j++) {
      const hit = segmentIntersection(ptsA[i], ptsA[i + 1], ptsB[j], ptsB[j + 1]);
      if (hit) return hit;
    }
  }
  return null;
}

// 统一计算画布几何布局与全部校验读数（单真源）
export function evaluate(state, W = 900, H = 560) {
  const theme = THEMES[state.theme] || THEMES.poster;
  const padX = Math.max(14, W * 0.026);
  const padY = Math.max(14, H * 0.036);
  const usableW = Math.max(240, W - padX * 2);
  const usableH = Math.max(240, H - padY * 2);

  const marginRatio = clamp(state.marginRatio, 0.14, 0.44);
  // 注槽宽（正文撕纸与边注卡之间的引线走廊）
  const gutterW = Math.max(26, Math.min(64, usableW * 0.068));
  const noteAreaW = Math.max(76, usableW * marginRatio);
  const paperW = Math.max(130, usableW - noteAreaW - gutterW);

  const paperRect = {
    x: padX,
    y: padY,
    w: paperW,
    h: usableH,
  };

  const railX = paperRect.x + paperRect.w + gutterW * 0.56;
  const cardX = paperRect.x + paperRect.w + gutterW;
  const cardW = Math.max(72, noteAreaW - 4);

  // 根据字阶模式计算卡片真实高度（重字冗长会显着拉高卡片并触发碰撞）
  const scaleFactor =
    state.scaleMode === "heavy" ? 1.04 : state.scaleMode === "micro" ? 0.62 : 0.76;

  // 估算在当前 noteAreaW 下文字行数，用于真实卡片高度计算
  const charsPerNoteLine = Math.max(
    4,
    Math.round((cardW - (W < 520 ? 18 : 30)) / (11.5 * scaleFactor))
  );

  const cards = theme.notes.map((n, i) => {
    const anchorX = paperRect.x + paperRect.w * n.anchorXRatio;
    const anchorY = paperRect.y + paperRect.h * n.anchorY;
    const nyNorm = clamp(state.noteY[i], 0.10, 0.90);
    const text = state.scaleMode === "heavy" ? n.longText : n.shortText;
    const estLines = Math.min(
      state.scaleMode === "heavy" ? 6 : 4,
      Math.max(2, Math.ceil(text.length / charsPerNoteLine))
    );
    const lineH = Math.max(11, 14.5 * scaleFactor * (H / 560));
    const headerH = Math.max(17, 24 * (H / 560));
    const baseH = headerH + estLines * lineH + Math.max(10, 14 * (H / 560));
    const cardH = clamp(
      baseH,
      H * (state.scaleMode === "heavy" ? 0.19 : 0.135),
      H * (state.scaleMode === "heavy" ? 0.30 : 0.21)
    );
    const centerY = paperRect.y + usableH * nyNorm;
    const topY = clamp(centerY - cardH / 2, padY + 2, H - padY - cardH - 2);
    const actualCenterY = topY + cardH / 2;

    // 折线路径：正文锚点 -> 注槽中线折点(每条错开 3px 避免共线重合) -> 锚环 -> 卡片左缘
    const bendX = paperRect.x + paperRect.w + gutterW * (0.20 + i * 0.085);
    const ringY = actualCenterY;
    const leaderPts = [
      { x: anchorX, y: anchorY },
      { x: bendX, y: anchorY },
      { x: bendX, y: ringY },
      { x: railX, y: ringY },
      { x: cardX, y: ringY },
    ];

    // 统一折算到 600px 基准页高的垂直漂移像素，确保大小屏判据一致
    const driftNormPx = Math.round(Math.abs(actualCenterY - anchorY) * (600 / usableH));

    return {
      ...n,
      index: i,
      text,
      x: cardX,
      y: topY,
      w: cardW,
      h: cardH,
      centerY: actualCenterY,
      anchorX,
      anchorY,
      ringX: railX,
      ringY,
      leaderPts,
      driftNormPx,
      charsPerNoteLine,
      crossed: false,
      collided: false,
    };
  });

  // 真实几何交叉检测（即使在无连线模式下也检测视线对齐交叉，代表顺序颠倒）
  const crossings = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      // 1) 折线几何交点
      const hit = polylineIntersection(cards[i].leaderPts, cards[j].leaderPts);
      // 2) 顺序倒置（anchorY[i] < anchorY[j] 但 centerY[i] > centerY[j]）
      const inverted =
        (cards[i].anchorY - cards[j].anchorY) * (cards[i].centerY - cards[j].centerY) < -8;
      if (hit || inverted) {
        const pt = hit || {
          x: (paperRect.x + paperRect.w + railX) * 0.5,
          y: (cards[i].centerY + cards[j].centerY) * 0.5,
        };
        crossings.push({ i, j, x: pt.x, y: pt.y });
        cards[i].crossed = true;
        cards[j].crossed = true;
      }
    }
  }

  // 真实卡片包围盒碰撞检测（带 4px 最小呼吸隙）
  const overlaps = [];
  const minGap = 4;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dy > -minGap) {
        overlaps.push({
          i,
          j,
          overlapPx: Math.round(Math.max(1, dy + minGap)),
          midY: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) * 0.5,
        });
        a.collided = true;
        b.collided = true;
      }
    }
  }

  const maxDriftPx = Math.max(...cards.map((c) => c.driftNormPx));
  const avgDriftPx = Math.round(
    cards.reduce((s, c) => s + c.driftNormPx, 0) / cards.length
  );
  const worstCard = cards.reduce((a, b) => (b.driftNormPx > a.driftNormPx ? b : a), cards[0]);

  const marginPct = Math.round(marginRatio * 100);
  const bodyPct = 100 - marginPct;
  // 按 1200px 典型书页版面估算正文每行中文字数（示意值）
  const bodyPxAt1200 = Math.round(1200 * (1 - marginRatio - 0.068));
  const estBodyChars = Math.round((bodyPxAt1200 - 48) / 17.5);
  const estNoteChars = Math.max(4, Math.round((1200 * marginRatio - 36) / (15 * scaleFactor)));

  // 390px 移动端实测推演
  const mobileBodyPx =
    state.mobileMode === "squeeze" ? Math.round((390 - 24) * (1 - marginRatio) - 10) : 358;
  const mobileNotePx =
    state.mobileMode === "squeeze" ? Math.round((390 - 24) * marginRatio) : 358;

  // 四项核心达标判定（支持多组合法解）
  const driftThreshold = state.linkStyle === "tufte" ? 22 : 28;
  const alignOk = crossings.length === 0 && overlaps.length === 0 && maxDriftPx <= driftThreshold;
  const ratioOk = marginRatio >= 0.22 && marginRatio <= 0.36;
  const voiceOk =
    state.scaleMode === "balanced" &&
    (state.linkStyle === "leader" || state.linkStyle === "tufte");
  const mobileOk =
    state.mobileMode === "inline-toggle" || state.mobileMode === "below-block";

  const score = [alignOk, ratioOk, voiceOk, mobileOk].filter(Boolean).length;

  // 精准识别 8 类具体失误，给出白话解释与下一步提示
  let diag = {
    code: "ok",
    badge: `合度 · ${score} / 4`,
    ok: score === 4,
    headline: "主文流畅，边注平齐轻声",
    body: `当前正文占 ${bodyPct}%、边注占 ${marginPct}%（经验参考带 22%–36%），四条边注零交叉、零叠压、最大对锚错位仅 ${maxDriftPx}px，读者扫一眼即得补充，跳过也毫不费力。`,
    action:
      state.linkStyle === "tufte"
        ? "你调出了一套经典的 Tufte 上标平齐解：试试换「原海报折线」或切换「费曼讲义 / 朱墨古籍」验看同一规律。"
        : "你已调出稳健的边注版式！可再试拖宽或拖窄边注栏，或把字阶调大感受喧宾夺主何时发生。",
  };

  if (crossings.length > 0) {
    const first = crossings[0];
    const nA = cards[first.i], nB = cards[first.j];
    diag = {
      code: "crossing",
      badge: `错态 · 引线交缠 (${score}/4)`,
      ok: false,
      headline: `「${nA.role}」与「${nB.role}」在注槽里交叉打结（${crossings.length} 处）`,
      body: `边注的核心价值是水平余光平视即得。现在「${nA.role}」错掉到下方、「${nB.role}」蹿到上方，引线在走廊里打结，读者得沿着交叉细线逐条追踪，甚至比翻页底脚注更费眼。`,
      action: `直接点击画布里的朱红「× 解结」标，或上下拖拽「${nA.role}」与「${nB.role}」卡片，把它们拉回各自正文锚点齐平。`,
    };
  } else if (overlaps.length > 0) {
    const ov = overlaps[0];
    const nA = cards[ov.i], nB = cards[ov.j];
    diag = {
      code: "overlap",
      badge: `错态 · 边注撞车 (${score}/4)`,
      ok: false,
      headline: `「${nA.role}」压住了「${nB.role}」，边缘留白塌陷`,
      body:
        state.scaleMode === "heavy"
          ? `边注字号飙到正文的 104% 且塞进大段冗文，卡片高度暴涨，把原本用来呼吸的页边填死并发生 ${overlaps.length} 处叠压。`
          : `两条边注拖得过近，卡片纵向叠压约 ${ov.overlapPx}px，失去了原海报强调的「留白适度」停顿感。`,
      action:
        state.scaleMode === "heavy"
          ? "先把下方「边注体量」收回到「76% 轻阶简洁」，再微调边注上下间距。"
          : `上下微拖「${nA.role}」或「${nB.role}」卡片，拉开彼此的空白停顿。`,
    };
  } else if (maxDriftPx > driftThreshold) {
    diag = {
      code: "drift",
      badge: `错态 · 远跳脱锚 (${score}/4)`,
      ok: false,
      headline: `「${worstCard.role}」漂离对应锚点 ${maxDriftPx}px`,
      body:
        state.linkStyle === "tufte"
          ? `无连线平齐模式全靠空间邻近建立对应，漂移超过 ${driftThreshold}px 时眼睛就无法确定这条边注究竟在解释哪一行。`
          : `虽然没有交叉，但「${worstCard.role}」离正文所指的那一句落差过大，视线仍要被迫纵向爬坡寻找，削弱了边注的即时性。`,
      action: `上下拖动「${worstCard.role}」卡片（或按 ↑/↓ 键），靠向它对应的朱红正文锚点直至自动轻吸齐平。`,
    };
  } else if (marginRatio > 0.36) {
    diag = {
      code: "too-wide",
      badge: `错态 · 反客为主 (${score}/4)`,
      ok: false,
      headline: `边注栏吃掉 ${marginPct}%，把正文挤成窄条`,
      body: `边注是辅助旁白，不是第二主栏。当边注宽度超过 36% 经验带时，主文版心被压窄（1200px 页上每行约 ${estBodyChars} 字，示意），读者视线会被肥大的页边牵着走。如果真需要宽辅助栏，应改用 156 侧栏版式。`,
      action: "在画布上向右横向拖动注槽柄（或拖动「边注栏宽」滑块），将边注栏收进 22%–36% 经验参考带。",
    };
  } else if (marginRatio < 0.22) {
    diag = {
      code: "too-narrow",
      badge: `错态 · 挤缝折断 (${score}/4)`,
      ok: false,
      headline: `边注栏仅剩 ${marginPct}%，每行碎成 ${estNoteChars} 字`,
      body: `页边太窄时，一句 16 字的注释会被强行折成四五截竖条，既难一口气扫完，又会拉长卡片高度，极易和下一条边注撞车。`,
      action: "在画布上向左横向拖动注槽柄（或调宽滑块），给边注留出 22%–36% 舒展宽度。",
    };
  } else if (state.scaleMode === "heavy") {
    diag = {
      code: "heavy-voice",
      badge: `错态 · 喧宾夺主 (${score}/4)`,
      ok: false,
      headline: "边注字重 104% 且冗长，跟正文抢话筒",
      body: "主文和边注字阶几乎一样粗重、还把解释写成长篇大论时，页面失去「层级清晰」与「可选读」的轻重对比，读者根本分不清哪边该先读。",
      action: "把「边注体量」切回「76% 轻阶简洁」，让边注退成轻声旁白。",
    };
  } else if (state.scaleMode === "micro") {
    diag = {
      code: "micro-voice",
      badge: `错态 · 过小难读 (${score}/4)`,
      ok: false,
      headline: "边注缩到 62%，小得像药瓶小字",
      body: "弱化边注不等于把字压到难以辨认。字号跌破正文的 70% 以下时，虽然绝不抢戏，但读者真的想看注释时反而要凑近眯眼。",
      action: "把「边注体量」回调到「76% 轻阶简洁」，在克制与可读之间取得平衡。",
    };
  } else if (state.linkStyle === "mixed" || state.linkStyle === "none") {
    diag = {
      code: "link-broken",
      badge: `错态 · ${state.linkStyle === "mixed" ? "风格杂乱" : "失锚悬空"} (${score}/4)`,
      ok: false,
      headline:
        state.linkStyle === "mixed"
          ? "四条边注各穿各的衣裳，破坏页面秩序"
          : "既无引线也无注号，边注悬浮失锚",
      body:
        state.linkStyle === "mixed"
          ? "原海报特意提醒「保持边注风格统一，避免干扰主线」。粗黑框、荧光块、无框字混用在同一边缘时，视觉噪点会不断拽离主线。"
          : "如果页面留白较宽且正文没有上标编号，完全撤掉引线和锚记会让读者搞不清边缘那句话究竟注释哪一行。",
      action: "把「关联与风格」切到「原海报折线」或「Tufte 上标平齐」，建立清晰统一的对应文法。",
    };
  } else if (state.mobileMode === "squeeze") {
    diag = {
      code: "mobile-squeeze",
      badge: `错态 · 窄屏硬挤 (${score}/4)`,
      ok: false,
      headline: `390px 手机屏硬留边注，正文挤剩 ${mobileBodyPx}px`,
      body: `边注依赖宽纸面或桌面余白。390px 竖屏上如果死守左右并排，正文只剩 ${mobileBodyPx}px、边注只剩 ${mobileNotePx}px，两边同时碎成细竖条。`,
      action: "在「390px 窄屏折返」里改选「⊕ 行内展开」或「段下轻注卡」，让小屏正文先保满宽流畅。",
    };
  } else if (state.mobileMode === "hidden") {
    diag = {
      code: "mobile-hidden",
      badge: `错态 · 信息丢失 (${score}/4)`,
      ok: false,
      headline: "手机端一刀切删掉边注，窄屏读者看不见注释",
      body: "简单用 display:none 藏掉边注看似版面干净，实则剥夺了所有手机读者查阅解释、来源和阅读提示的权利。",
      action: "改选「⊕ 行内展开」或「段下轻注卡」，保留内容但不打断窄屏主线。",
    };
  }

  // 五枚原海报职责徽标的实时状态（与原海报五条完全一一对应）
  const roleStates = [
    {
      role: "注释",
      en: "ANNOTATION",
      ok: state.scaleMode === "balanced" && !cards[0].crossed && cards[0].driftNormPx <= driftThreshold,
      tag:
        state.scaleMode === "heavy"
          ? "过重冗长"
          : state.scaleMode === "micro"
          ? "过小难读"
          : cards[0].crossed
          ? "引线交缠"
          : cards[0].driftNormPx > driftThreshold
          ? `偏 ${cards[0].driftNormPx}px`
          : "轻声平齐",
    },
    {
      role: "指示",
      en: "POINTER",
      ok:
        crossings.length === 0 &&
        (state.linkStyle === "leader" || state.linkStyle === "tufte"),
      tag:
        crossings.length > 0
          ? `交叉 ${crossings.length} 处`
          : state.linkStyle === "none"
          ? "缺锚失联"
          : state.linkStyle === "mixed"
          ? "风格割裂"
          : state.linkStyle === "tufte"
          ? "上标邻近"
          : "折线明晰",
    },
    {
      role: "补充",
      en: "SUPPLEMENT",
      ok: overlaps.length === 0 && ratioOk,
      tag:
        overlaps.length > 0
          ? "叠压撞车"
          : marginRatio > 0.36
          ? `占 ${marginPct}% 过宽`
          : marginRatio < 0.22
          ? `仅 ${marginPct}% 过窄`
          : `占 ${marginPct}% 舒展`,
    },
    {
      role: "引导",
      en: "GUIDANCE",
      ok: maxDriftPx <= driftThreshold && crossings.length === 0,
      tag:
        crossings.length > 0
          ? "视线受阻"
          : maxDriftPx > driftThreshold
          ? `最大偏 ${maxDriftPx}px`
          : `对锚 ${maxDriftPx}px`,
    },
    {
      role: "语境",
      en: "CONTEXT",
      ok: mobileOk,
      tag:
        state.mobileMode === "squeeze"
          ? `390 挤 ${mobileNotePx}px`
          : state.mobileMode === "hidden"
          ? "小屏丢失"
          : state.mobileMode === "inline-toggle"
          ? "⊕ 随文展开"
          : "段下轻注",
    },
  ];

  return {
    theme,
    paperRect,
    railX,
    gutterW,
    cardX,
    cardW,
    cards,
    crossings,
    overlaps,
    maxDriftPx,
    avgDriftPx,
    driftThreshold,
    marginRatio,
    marginPct,
    bodyPct,
    scaleFactor,
    estBodyChars,
    estNoteChars,
    mobileBodyPx,
    mobileNotePx,
    checks: { alignOk, ratioOk, voiceOk, mobileOk },
    score,
    diag,
    roleStates,
  };
}
