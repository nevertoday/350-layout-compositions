// 272 便当盒布局 · 单一真源数据与几何计算模型
// 开场装盒台、2D Canvas 蓝图透视、迷你便当盒镜像与各节演示全部共用本模块计算结果。

export const COLS = 4;
export const ROWS = 3;
export const TOTAL_SLOTS = COLS * ROWS; // 12

// 经验盒缝呼吸区间（单位 px，基于常规卡片 16-24px 内边距与共同区域律）
export const GUTTER_SWEET_MIN = 10;
export const GUTTER_SWEET_MAX = 20;
export const GUTTER_OPTIONS = [
  { value: 4, label: "4px 粘连" },
  { value: 14, label: "14px 舒朗" },
  { value: 28, label: "28px 散架" },
];

export const MODULE_META = {
  headline: {
    id: "headline",
    code: "H",
    no: "01",
    name: "大标题区",
    en: "HEADLINE",
    role: "主菜 · 核心主题",
    tone: "pink",
    fill: "#F6CED0",
    accent: "#FE7DA2",
    ink: "#7D1A3B",
    short: "占据视觉焦点，快速建立主题认知。",
    minIdeal: 3,
    maxIdeal: 6,
  },
  highlight: {
    id: "highlight",
    code: "P",
    no: "02",
    name: "重点提示区",
    en: "HIGHLIGHT",
    role: "点睛 · 核心指标",
    tone: "cream",
    fill: "#FEF8E9",
    accent: "#F38F9C",
    ink: "#592A1E",
    short: "用于强调核心信息，让重点一目了然。",
    minIdeal: 1,
    maxIdeal: 3,
  },
  content: {
    id: "content",
    code: "C",
    no: "03",
    name: "内容主体区",
    en: "CONTENT",
    role: "主食 · 图文展开",
    tone: "peach",
    fill: "#FDE2C2",
    accent: "#F79A6E",
    ink: "#7C330C",
    short: "容纳主要信息与图文，逻辑分明，信息有序展开。",
    minIdeal: 2,
    maxIdeal: 6,
  },
  support: {
    id: "support",
    code: "S",
    no: "04",
    name: "补充说明区",
    en: "SUPPORT",
    role: "配菜 · 轻量注释",
    tone: "mint",
    fill: "#D7E9D1",
    accent: "#59B383",
    ink: "#164C2E",
    short: "承载补充信息、注释或案例，辅助理解。",
    minIdeal: 1,
    maxIdeal: 2,
  },
  action: {
    id: "action",
    code: "A",
    no: "05",
    name: "快捷入口区",
    en: "ACTION",
    role: "佐料 · 行动标签",
    tone: "butter",
    fill: "#FFF3D2",
    accent: "#E39B2B",
    ink: "#613D04",
    short: "放一则短标签或直达入口，不抢主仓风头。",
    minIdeal: 1,
    maxIdeal: 2,
  },
};

export const MODULE_ORDER = ["headline", "highlight", "content", "support", "action"];

// 开场故意停在 0/4 翻车态：
// - 补充说明区（轻配角）错误霸占左上 2×2 主菜位，其右竖隔板恰落水平居中 50%（col 2，承载 data-perf-drag）
// - 大标题区与内容主体区被挤进右上 1×1 小格
// - 底排整行 4 格露空（破盒漏风 8/12）
// - 盒缝仅 4px（邻仓粘连）
export function createInitialState() {
  return {
    gutter: 4,
    xray: true,
    selectedId: "support",
    cells: [
      { id: "support", x: 0, y: 0, w: 2, h: 2 },
      { id: "headline", x: 2, y: 0, w: 1, h: 1 },
      { id: "highlight", x: 3, y: 0, w: 1, h: 1 },
      { id: "content", x: 2, y: 1, w: 1, h: 1 },
      { id: "action", x: 3, y: 1, w: 1, h: 1 },
    ],
  };
}

export function cloneCells(cells) {
  return cells.map((c) => ({ ...c }));
}

export function cellMap(cells) {
  const m = {};
  for (const c of cells) m[c.id] = c;
  return m;
}

export function buildOccupancy(cells, excludeId = null) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let overlaps = 0;
  for (const c of cells) {
    if (c.id === excludeId) continue;
    for (let r = c.y; r < c.y + c.h; r++) {
      for (let col = c.x; col < c.x + c.w; col++) {
        if (r < 0 || r >= ROWS || col < 0 || col >= COLS) {
          overlaps++;
        } else if (grid[r][col]) {
          overlaps++;
        } else {
          grid[r][col] = c.id;
        }
      }
    }
  }
  return { grid, overlaps };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function fitsInGrid(grid, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > COLS || y + h > ROWS) return false;
  for (let r = y; r < y + h; r++) {
    for (let c = x; c < x + w; c++) {
      if (grid[r][c] !== null) return false;
    }
  }
  return true;
}

function stampInGrid(grid, c) {
  for (let r = c.y; r < c.y + c.h; r++) {
    for (let col = c.x; col < c.x + c.w; col++) {
      grid[r][col] = c.id;
    }
  }
}

// 尝试将一批被挤走的仓位顺次安放到剩余空槽里（按原位置曼哈顿距离优先）
function relocateDisplaced(baseCells, displaced) {
  const { grid } = buildOccupancy(baseCells);
  const placed = [];
  const sorted = [...displaced].sort((a, b) => b.w * b.h - a.w * a.h);
  for (const item of sorted) {
    let best = null;
    let bestDist = Infinity;
    for (let y = 0; y <= ROWS - item.h; y++) {
      for (let x = 0; x <= COLS - item.w; x++) {
        if (fitsInGrid(grid, x, y, item.w, item.h)) {
          const d = Math.abs(x - item.x) + Math.abs(y - item.y);
          if (d < bestDist) {
            bestDist = d;
            best = { ...item, x, y };
          }
        }
      }
    }
    if (!best) return null;
    stampInGrid(grid, best);
    placed.push(best);
  }
  return [...baseCells, ...placed];
}

// 调整指定仓位尺寸；遇阻时先尝试把被挤到的旁仓顺滑挪到空槽，再放不下则返回碰撞提示
export function tryResize(cells, id, nextW, nextH) {
  const w = Math.max(1, Math.min(COLS, Math.round(nextW)));
  const h = Math.max(1, Math.min(ROWS, Math.round(nextH)));
  const current = cells.find((c) => c.id === id);
  if (!current) return { ok: false, cells, reason: "未找到仓位" };
  if (w === current.w && h === current.h) return { ok: true, cells, changed: false };

  const nx = Math.min(current.x, COLS - w);
  const ny = Math.min(current.y, ROWS - h);
  const candidate = { ...current, x: nx, y: ny, w, h };

  const others = cells.filter((c) => c.id !== id);
  const displaced = others.filter((o) => rectsOverlap(candidate, o));
  const fixed = others.filter((o) => !rectsOverlap(candidate, o));

  if (displaced.length === 0) {
    const next = cells.map((c) => (c.id === id ? candidate : c));
    return { ok: true, cells: next, changed: true };
  }

  const relocated = relocateDisplaced([candidate, ...fixed], displaced);
  if (relocated) {
    // 保持原顺序，避免 DOM 重排跳动
    const byId = cellMap(relocated);
    const ordered = cells.map((c) => byId[c.id]);
    return { ok: true, cells: ordered, changed: true, shifted: displaced.map((d) => d.id) };
  }

  // 如果整盘已满且是扩宽/扩高，告知被挡住的邻居
  const blocker = MODULE_META[displaced[0].id]?.name || "相邻仓";
  return {
    ok: false,
    cells,
    blockerId: displaced[0].id,
    reason: `被「${blocker}」挡住了：先把旁仓缩小或移开空出格位，再继续拉开。`,
  };
}

// 拖放或方向键移动指定仓位到目标格子 (tx, ty)
export function tryMove(cells, id, tx, ty) {
  const current = cells.find((c) => c.id === id);
  if (!current) return { ok: false, cells };
  const nx = Math.max(0, Math.min(COLS - current.w, tx));
  const ny = Math.max(0, Math.min(ROWS - current.h, ty));
  if (nx === current.x && ny === current.y) return { ok: true, cells, changed: false };

  const candidate = { ...current, x: nx, y: ny };
  const others = cells.filter((c) => c.id !== id);
  const displaced = others.filter((o) => rectsOverlap(candidate, o));
  const fixed = others.filter((o) => !rectsOverlap(candidate, o));

  if (displaced.length === 0) {
    return { ok: true, cells: cells.map((c) => (c.id === id ? candidate : c)), changed: true };
  }

  // 若只碰到 1 个旁仓，尝试顺滑挪开；不行则直接互换两个仓位的格位与尺寸（就像现实便当盒互换内格！）
  const relocated = relocateDisplaced([candidate, ...fixed], displaced);
  if (relocated) {
    const byId = cellMap(relocated);
    return { ok: true, cells: cells.map((c) => byId[c.id]), changed: true };
  }
  if (displaced.length === 1) {
    return trySwap(cells, id, displaced[0].id);
  }
  return { ok: false, cells, reason: "该位置空间不够，可点两仓直接互换格位。" };
}

// 两仓互换格位（连同各自占用的矩形一起互换，保证零重叠、零报错）
export function trySwap(cells, idA, idB) {
  if (!idA || !idB || idA === idB) return { ok: false, cells, changed: false };
  const a = cells.find((c) => c.id === idA);
  const b = cells.find((c) => c.id === idB);
  if (!a || !b) return { ok: false, cells, changed: false };
  const next = cells.map((c) => {
    if (c.id === idA) return { ...c, x: b.x, y: b.y, w: b.w, h: b.h };
    if (c.id === idB) return { ...c, x: a.x, y: a.y, w: a.w, h: a.h };
    return c;
  });
  return { ok: true, cells: next, changed: true, swapped: [idA, idB] };
}

// 生成真实的 CSS grid-template-areas 字符串（空槽用 "." 表示）
export function buildTemplateAreas(cells) {
  const { grid } = buildOccupancy(cells);
  return grid.map((row) =>
    '"' + row.map((id) => (id ? MODULE_META[id].code : ".")).join(" ") + '"'
  );
}

// 单一真源核心诊断：从 cells 与 gutter 实时算出所有实测指标与四步法验收
export function evaluateBento(state) {
  const { cells, gutter } = state;
  const { grid, overlaps } = buildOccupancy(cells);
  const byId = cellMap(cells);

  let filled = 0;
  const emptyCoords = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) filled++;
      else emptyCoords.push({ x: c, y: r });
    }
  }
  const emptyCount = TOTAL_SLOTS - filled;

  const areas = cells.map((c) => ({ id: c.id, area: c.w * c.h, w: c.w, h: c.h }));
  const maxItem = areas.reduce((best, x) => (x.area > best.area ? x : best), areas[0]);
  const minItem = areas.reduce((best, x) => (x.area < best.area ? x : best), areas[0]);
  const areaRatio = maxItem.area / Math.max(1, minItem.area);

  const hero = byId.headline;
  const content = byId.content;
  const support = byId.support;
  const action = byId.action;
  const highlight = byId.highlight;

  const heroArea = hero.w * hero.h;
  const contentArea = content.w * content.h;
  const supportArea = support.w * support.h;
  const actionArea = action.w * action.h;
  const highlightArea = highlight.w * highlight.h;

  // 视觉面积重心（0–1 归一化坐标，按各仓面积加权）
  let sumA = 0;
  let sumCx = 0;
  let sumCy = 0;
  for (const c of cells) {
    const a = c.w * c.h;
    sumA += a;
    sumCx += a * ((c.x + c.w / 2) / COLS);
    sumCy += a * ((c.y + c.h / 2) / ROWS);
  }
  const comX = sumA ? sumCx / sumA : 0.5;
  const comY = sumA ? sumCy / sumA : 0.5;

  // 角色与体量合理性检查
  const skinnyHeavy = [hero, content].find((c) => c.w === 1 && c.h >= 3);
  const bloatedMinor = [support, action].find((c) => c.w * c.h > 2);
  const crampedHero = heroArea < 3;
  const crampedContent = contentArea < 2;
  const usurper = [support, action, highlight].find((c) => c.w * c.h > heroArea);
  const equalMinor = [support, action].find((c) => c.w * c.h >= heroArea);
  const monster = areas.find((a) => a.area >= 7); // > 50% (7/12 = 58%+)

  // 对应 272 原海报底部「便当盒布局四步法」四项独立验收
  const step1 = emptyCount === 0 && overlaps === 0; // 分仓 COMPARTMENT：12/12 严丝合缝收口
  const step2 = !crampedHero && !crampedContent && !bloatedMinor && !skinnyHeavy; // 组合 COMBINE：面积匹配内容体量
  const step3 =
    heroArea >= maxItem.area &&
    !usurper &&
    !equalMinor &&
    areaRatio >= 2.0 &&
    !monster; // 强调 EMPHASIS：大标题居主位、主次差 ≥ 2×、单仓不霸盒
  const step4 = gutter >= GUTTER_SWEET_MIN && gutter <= GUTTER_SWEET_MAX; // 轻松 LIGHT：盒缝处于 10–20px 呼吸甜区

  const steps = [
    {
      key: "compartment",
      zh: "分仓",
      en: "COMPARTMENT",
      ok: step1,
      note: step1 ? "12/12 严丝合缝" : `缺 ${emptyCount} 格空洞`,
    },
    {
      key: "combine",
      zh: "组合",
      en: "COMBINE",
      ok: step2,
      note: step2 ? "体量各合其身" : bloatedMinor ? `${MODULE_META[bloatedMinor.id].name}偏胖` : "主仓偏挤",
    },
    {
      key: "emphasis",
      zh: "强调",
      en: "EMPHASIS",
      ok: step3,
      note: step3 ? `主次比 ${areaRatio.toFixed(1)}×` : usurper ? "配角抢焦" : monster ? "单仓霸盒" : `级差 ${areaRatio.toFixed(1)}×`,
    },
    {
      key: "light",
      zh: "轻松",
      en: "LIGHT",
      ok: step4,
      note: step4 ? `${gutter}px 呼吸缝` : gutter < GUTTER_SWEET_MIN ? `${gutter}px 粘连` : `${gutter}px 散架`,
    },
  ];

  const passedCount = steps.filter((s) => s.ok).length;

  // 按严格优先级生成一条直击原因的白话诊断（不堆砌、讲清「为什么这样看会出问题」）
  let status = "fail";
  let badge = "0/4 翻车态";
  let headline = "";
  let explanation = "";
  let nextHint = "";

  if (passedCount === 4) {
    status = "pass";
    badge = "4/4 装盒达标";
    headline = `主次比 ${areaRatio.toFixed(1)}×，12 格严丝合缝收口`;
    explanation = `「大标题区」稳占 ${heroArea} 格（${Math.round((heroArea / TOTAL_SLOTS) * 100)}%）第一时间锁住视线，「内容主体区」占 ${contentArea} 格从容展开图文，轻配仓退守 ${Math.min(supportArea, actionArea)} 格不喧宾，${gutter}px 盒缝让五组异质信息彼此隔味又合成一整张矩形。`;
    nextHint = "试试把不同仓位拖动互换，你会发现只要守住这四条规矩，同一盒便当能排出好几种好版式。";
  } else if (usurper) {
    const uName = MODULE_META[usurper.id].name;
    const uArea = usurper.w * usurper.h;
    badge = `${passedCount}/4 喧宾夺主`;
    headline = `「${uName}」占了 ${uArea} 格，把大标题区压成了 ${heroArea} 格`;
    explanation = `人眼在二维网格里会把最大色块当成主角。现在配角「${uName}」面积是大标题区的 ${(uArea / heroArea).toFixed(1)} 倍，读者第一眼先读到注释而不是主题。`;
    nextHint = `把中央的青绿隔板往左拖，把「${uName}」缩回 1–2 格，再把樱粉「大标题区」拉成 2×2 或 3×1（或直接把大标题拖到它上面互换格位）。`;
  } else if (monster) {
    const mName = MODULE_META[monster.id].name;
    badge = `${passedCount}/4 巨兽霸盒`;
    headline = `「${mName}」独吞 ${monster.area}/12 格（${Math.round((monster.area / 12) * 100)}%），失去便当节奏`;
    explanation = `单仓面积超过半个托盘后，其余内容只能挤成边角碎格，整页退化成一张巨幅主图贴了几张便利贴，失去了多仓并置扫读的优势。`;
    nextHint = `把「${mName}」缩回 6 格（50%）以内，给「内容主体区」和「重点提示区」留出舒展空间。`;
  } else if (areaRatio < 2.0) {
    badge = `${passedCount}/4 均分平权`;
    headline = `最大仓与最小仓比只有 ${areaRatio.toFixed(1)}×，退化成普通卡片网格`;
    explanation = `所有仓位差不多大时，眼睛扫过整盘没有轻重顿挫——这正是均分卡片网格和便当盒布局的本质区别：便当盒靠「至少 2× 的面积差」无声宣告主次。`;
    nextHint = `把「大标题区」扩到 3–4 格，同时让「补充说明区」或「快捷入口区」保持 1×1，立刻拉开视觉音量。`;
  } else if (equalMinor) {
    const eName = MODULE_META[equalMinor.id].name;
    badge = `${passedCount}/4 主次撞车`;
    headline = `「${eName}」和「大标题区」一样大（同为 ${heroArea} 格），焦点打架`;
    explanation = `辅助注释或快捷按钮与主标题占据相同面积时，视线会在两块之间来回拉扯，削弱第一眼入口。`;
    nextHint = `把「${eName}」缩小到 1×1 或 2×1，让「大标题区」成为当之无愧的最大主仓。`;
  } else if (!step1) {
    badge = `${passedCount}/4 破盒漏风`;
    headline = `还空着 ${emptyCount} 格虚线槽（填满 ${filled}/12），外矩形没收口`;
    explanation = `瀑布流允许底部参差不齐，但便当盒靠「封闭完整的矩形外框」制造整洁打包感。一旦留下黑洞缺口，读者会以为图片加载失败或少了一块内容。`;
    nextHint = `拉开「大标题区」或「内容主体区」填满那 ${emptyCount} 个虚线空槽，让 12 格严丝合缝。`;
  } else if (!step2) {
    badge = `${passedCount}/4 体量错配`;
    if (bloatedMinor) {
      const bName = MODULE_META[bloatedMinor.id].name;
      headline = `轻配仓「${bName}」撑到 ${bloatedMinor.w * bloatedMinor.h} 格，内部大片发空`;
      explanation = `补充注释和快捷入口字数少、信息轻，给它超过 2 格的巨仓只会留出尴尬的大片空白，反而把真正需要展开图文的仓位挤瘪。`;
      nextHint = `把「${bName}」缩回 1–2 格，把腾出来的空间还给「大标题区」或「内容主体区」。`;
    } else if (skinnyHeavy) {
      const sName = MODULE_META[skinnyHeavy.id].name;
      headline = `「${sName}」拉成了 1×3 细面条，文字频繁折行`;
      explanation = `便当盒里的主标题与图文仓需要舒适的宽高比，过窄的纵条会把标题折碎、把插图压扁。`;
      nextHint = `把「${sName}」改成 2×2、3×1 或 2×1 这类更舒展的比例。`;
    } else if (crampedHero) {
      headline = `「大标题区」仅占 ${heroArea} 格，主标打不开气势`;
      explanation = `主题认知是整盒便当的第一口，主仓至少需要 3 格（如 3×1 或 2×2）才能同时容纳大字标题与视觉锚点。`;
      nextHint = `把樱粉「大标题区」拉大到 2×2 或 3×1。`;
    } else {
      headline = `「内容主体区」被挤在 1×1 小格，图文施展不开`;
      explanation = `图文主体仓既要放示意画面又要铺陈要点，至少需要 2 格（2×1、1×2 或 2×2）才不会把内容憋在角落里。`;
      nextHint = `给杏桃「内容主体区」至少 2 格空间。`;
    }
  } else if (!step4) {
    if (gutter < GUTTER_SWEET_MIN) {
      badge = `${passedCount}/4 盒缝粘连`;
      headline = `盒缝仅 ${gutter}px，相邻色块贴在一起容易串味`;
      explanation = `仓位之间的沟槽必须清晰大于行距、与卡内留白呼应；4px 窄缝像没放隔板的饭盒，邻仓的标题与图标会互相干扰。`;
      nextHint = `把盒缝切到「14px 舒朗」（经验呼吸甜区 10–20px），整盒立刻就透气了。`;
    } else {
      badge = `${passedCount}/4 盒缝散架`;
      headline = `盒缝宽达 ${gutter}px，五个仓位散成了互不相干的孤岛`;
      explanation = `间隙过宽会切断仓位之间的整体联系，外框看起来支离破碎，便当盒的「整盘收口」感随之瓦解。`;
      nextHint = `把盒缝收回「14px 舒朗」（经验甜区 10–20px），重新找回紧密却透气的节奏。`;
    }
  }

  return {
    filled,
    emptyCount,
    emptyCoords,
    overlaps,
    heroArea,
    contentArea,
    supportArea,
    actionArea,
    highlightArea,
    maxArea: maxItem.area,
    minArea: minItem.area,
    areaRatio,
    comX,
    comY,
    steps,
    passedCount,
    status,
    badge,
    headline,
    explanation,
    nextHint,
    areasCss: buildTemplateAreas(cells),
  };
}

// ---------- 第 02 节：面积就是音量（三套比例标本） ----------
export const HIERARCHY_PRESETS = {
  flat: {
    id: "flat",
    label: "1 : 1 : 1 : 1 均分平权",
    ratioText: "1.0× 均分",
    verdict: "四格面积完全一样，退化成普通卡片网格。眼睛扫进去没有明确起点，只能机械地从左上逐格念到右下。",
    order: [
      { id: "a", title: "核心卖点", share: "25%", cols: "1 / span 2", rows: "1 / span 1", rank: "①", tone: "pink", shortCopy: "48h 离线降噪芯片，一按即录。", longCopy: "48h 离线降噪芯片，全场景人声分离，支持多语种实时转写与摘要导出。" },
      { id: "b", title: "实时转写", share: "25%", cols: "3 / span 2", rows: "1 / span 1", rank: "②", tone: "peach", shortCopy: "中英混说同步出稿。", longCopy: "中英混说同步出稿，自动区分发言人并标注时间戳，会后三秒发群。" },
      { id: "c", title: "32h 续航", share: "25%", cols: "1 / span 2", rows: "2 / span 1", rank: "③", tone: "cream", shortCopy: "连续录音一整周。", longCopy: "满电可连续录制三十二小时，磁吸快充十分钟即可顶用两小时。" },
      { id: "d", title: "机身参数", share: "25%", cols: "3 / span 2", rows: "2 / span 1", rank: "④", tone: "mint", shortCopy: "28g · 铝合金。", longCopy: "28g 超轻机身，阳极氧化铝合金外壳配静音拨片，放进衬衫口袋几乎无感。" },
    ],
    path: [
      [25, 25],
      [75, 25],
      [25, 75],
      [75, 75],
    ],
  },
  balanced: {
    id: "balanced",
    label: "4 : 2 : 1 : 1 经典主副",
    ratioText: "4.0× 清晰分层",
    verdict: "主菜占一半面积（50%）在左上第一时间锁焦，图文主体占 25% 承接细读，两枚 12.5% 轻指标收在右下——视线自然按 ①→②→③→④ 顺流而下。",
    order: [
      { id: "a", title: "核心卖点", share: "50%", cols: "1 / span 2", rows: "1 / span 2", rank: "①", tone: "pink", shortCopy: "48h 离线降噪芯片，一按即录。", longCopy: "48h 离线降噪芯片，全场景人声分离，支持多语种实时转写与摘要导出。" },
      { id: "b", title: "实时转写", share: "25%", cols: "3 / span 2", rows: "1 / span 1", rank: "②", tone: "peach", shortCopy: "中英混说同步出稿。", longCopy: "中英混说同步出稿，自动区分发言人并标注时间戳，会后三秒发群。" },
      { id: "c", title: "32h 续航", share: "12.5%", cols: "3 / span 1", rows: "2 / span 1", rank: "③", tone: "cream", shortCopy: "连续录一整周。", longCopy: "满电可连续录制三十二小时，磁吸快充十分钟即可顶用两小时。" },
      { id: "d", title: "机身参数", share: "12.5%", cols: "4 / span 1", rows: "2 / span 1", rank: "④", tone: "mint", shortCopy: "28g 铝合金。", longCopy: "28g 超轻机身，阳极氧化铝合金外壳配静音拨片，放进衬衫口袋几乎无感。" },
    ],
    path: [
      [25, 50],
      [75, 25],
      [62.5, 75],
      [87.5, 75],
    ],
  },
  monopoly: {
    id: "monopoly",
    label: "6 : 1 : 1 : 1 巨仓失衡",
    ratioText: "6.0× 过载挤压",
    verdict: "主仓独吞 67% 以上盘面后，右边三项被压成窄条：字被迫折成碎行，便当盒的多仓节奏塌缩成了「一张大图 + 边栏小字」。",
    order: [
      { id: "a", title: "核心卖点", share: "67%", cols: "1 / span 3", rows: "1 / span 3", rank: "①", tone: "pink", shortCopy: "48h 离线降噪芯片，一按即录。", longCopy: "48h 离线降噪芯片，全场景人声分离，支持多语种实时转写与摘要导出。" },
      { id: "b", title: "实时转写", share: "11%", cols: "4 / span 1", rows: "1 / span 1", rank: "②", tone: "peach", shortCopy: "同步出稿。", longCopy: "中英混说同步出稿，自动区分发言人并标注时间戳，会后三秒发群。" },
      { id: "c", title: "32h 续航", share: "11%", cols: "4 / span 1", rows: "2 / span 1", rank: "③", tone: "cream", shortCopy: "录一整周。", longCopy: "满电可连续录制三十二小时，磁吸快充十分钟即可顶用两小时。" },
      { id: "d", title: "机身参数", share: "11%", cols: "4 / span 1", rows: "3 / span 1", rank: "④", tone: "mint", shortCopy: "28g 铝壳。", longCopy: "28g 超轻机身，阳极氧化铝合金外壳配静音拨片，放进衬衫口袋几乎无感。" },
    ],
    path: [
      [37.5, 50],
      [87.5, 16.6],
      [87.5, 50],
      [87.5, 83.3],
    ],
  },
};

// ---------- 第 03 节：从漆盒到网格（四时代骨架标本） ----------
export const HISTORY_ERAS = [
  {
    id: "shokado",
    year: "1933",
    title: "松花堂弁当",
    sub: "京都 · 湯木貞一与四格十字漆盒",
    summary: "江户文人松花堂昭乗（1584–1639）曾把农家「田」字四格种子盒改成漆器文具箱；1933 年（昭和 8 年），日本料理「吉兆」创始人湯木貞一受其启发，调整盒高并加盖，让刺身、煮物、烤物与米饭在十字隔板间冷热并行、彼此不串味——物理分仓由此定型。",
    cols: 2,
    rows: 2,
    code: [
      '"sashimi  simmer"',
      '"grill    rice  "',
    ],
    cells: [
      { label: "造里 · 刺身", sub: "冷鲜独立", area: "1 / 1 / 2 / 2", tone: "pink" },
      { label: "煮物 · 时蔬", sub: "汤汁隔断", area: "1 / 2 / 2 / 3", tone: "mint" },
      { label: "焼物 · 炙鱼", sub: "香气不窜", area: "2 / 1 / 3 / 2", tone: "peach" },
      { label: "御飯 · 梅干", sub: "主食落底", area: "2 / 2 / 3 / 3", tone: "cream" },
    ],
  },
  {
    id: "metro",
    year: "2010",
    title: "Metro 动态磁贴",
    sub: "Windows Phone 7 · 异尺寸信息砖",
    summary: "2010 年 10 月微软推出 Windows Phone 7，打破手机桌面一水儿正方形小图标的惯例，用 1×1、2×1、2×2 等不同尺寸的扁平动态磁贴把未读消息、天气与日程直接亮在格子里，确立了数字界面「一眼扫清（Glance & Go）」的模块化骨架。",
    cols: 4,
    rows: 3,
    code: [
      '"mail  mail  cal   cal  "',
      '"mail  mail  photo msg  "',
      '"music weather weather map"',
    ],
    cells: [
      { label: "收件箱 2×2", sub: "3 封未读", area: "1 / 1 / 3 / 3", tone: "pink" },
      { label: "日程 2×1", sub: "14:00 评审", area: "1 / 3 / 2 / 5", tone: "cream" },
      { label: "相册", sub: "1×1", area: "2 / 3 / 3 / 4", tone: "mint" },
      { label: "短信", sub: "1×1", area: "2 / 4 / 3 / 5", tone: "butter" },
      { label: "音乐", sub: "1×1", area: "3 / 1 / 4 / 2", tone: "mint" },
      { label: "天气 2×1", sub: "22° 晴", area: "3 / 2 / 4 / 4", tone: "peach" },
      { label: "地图", sub: "1×1", area: "3 / 4 / 4 / 5", tone: "cream" },
    ],
  },
  {
    id: "cssgrid",
    year: "2017",
    title: "CSS Grid 区域码",
    sub: "W3C Level 1 CR · grid-template-areas",
    summary: "2017 年 W3C 发布 CSS Grid Layout Level 1 候选推荐，主流浏览器同年原生支持。开发者第一次能用像画便当格一样的字符串声明 `grid-template-areas`，不用嵌套四五层浮动容器，在媒体查询里改几行字母就能跨端重新装盒。",
    cols: 4,
    rows: 3,
    code: [
      '"hero hero stat stat"',
      '"hero hero note cta "',
      '"body body body body"',
    ],
    cells: [
      { label: "hero", sub: "2×2", area: "1 / 1 / 3 / 3", tone: "pink" },
      { label: "stat", sub: "2×1", area: "1 / 3 / 2 / 5", tone: "cream" },
      { label: "note", sub: "1×1", area: "2 / 3 / 3 / 4", tone: "mint" },
      { label: "cta", sub: "1×1", area: "2 / 4 / 3 / 5", tone: "butter" },
      { label: "body", sub: "4×1", area: "3 / 1 / 4 / 5", tone: "peach" },
    ],
  },
  {
    id: "modern",
    year: "2020+",
    title: "现代产品便当页",
    sub: "iOS 14 小组件与发布会特性总览页",
    summary: "2020 年 6 月苹果发布 iOS 14，将多尺寸圆角小组件（2×2、4×2、4×4）带入主屏幕；随后科技发布会的一图总结页与 SaaS 官网纷纷采用「圆角分仓 + 同心圆角 + 一仓一卖点」的组合，让「Bento Grid（便当盒布局）」成为当代产品展示的标准语言。",
    cols: 4,
    rows: 3,
    code: [
      '"chip  chip  bat   cam "',
      '"chip  chip  screen screen"',
      '"audio priv  screen screen"',
    ],
    cells: [
      { label: "核心芯片", sub: "主仓 2×2", area: "1 / 1 / 3 / 3", tone: "pink" },
      { label: "续航", sub: "1×1", area: "1 / 3 / 2 / 4", tone: "cream" },
      { label: "影像", sub: "1×1", area: "1 / 4 / 2 / 5", tone: "mint" },
      { label: "屏幕素质", sub: "图文 2×2", area: "2 / 3 / 4 / 5", tone: "peach" },
      { label: "音频", sub: "1×1", area: "3 / 1 / 4 / 2", tone: "butter" },
      { label: "隐私", sub: "1×1", area: "3 / 2 / 4 / 3", tone: "mint" },
    ],
  },
];

// ---------- 第 04 节：响应式分断点重排模型 ----------
export function computeResponsivePlan(widthPx, strategy) {
  // strategy: "repack" (分断点重编区域) | "shrink" (硬保 4 列等比缩小) | "stack" (盲目全堆单列)
  const w = Math.max(320, Math.min(1160, Math.round(widthPx)));
  const gap = w < 520 ? 10 : 14;

  if (strategy === "shrink") {
    const cols = 4;
    const minCellW = Math.round((w - gap * (cols - 1) - 24) / cols);
    const bad = minCellW < 120;
    return {
      width: w,
      cols,
      gap,
      areas: ['"H H P P"', '"H H C C"', '"S A C C"'],
      minCellW,
      badge: bad ? "硬缩挤烂" : "宽屏尚可",
      ok: !bad,
      reason: bad
        ? `强行保留 4 列后，1×1 窄仓被压到仅 ${minCellW}px 宽——一行挤不下四个汉字，图标与说明撞成一团。`
        : `在 ${w}px 宽屏下 4 列单格宽 ${minCellW}px 仍舒展；试着把滑条往左拉到 520px 以下看看硬缩的后果。`,
    };
  }

  if (strategy === "stack") {
    const cols = 1;
    const minCellW = Math.round(w - 24);
    const wasted = w >= 600;
    return {
      width: w,
      cols,
      gap,
      areas: ['"H"', '"P"', '"C"', '"S"', '"A"'],
      minCellW,
      badge: wasted ? "大屏空荡 · 层级归零" : "主次拉平",
      ok: false,
      reason: wasted
        ? `在 ${w}px 下全员堆成单列，五张卡拉成长条面饼，原本「大标题压过小配角」的面积级差彻底消失。`
        : `手机上虽然字不会挤烂，但 5 块全变成同宽等高堆叠——把两枚 1×1 轻配仓并排成双列，既省滚动又保留便当节奏。`,
    };
  }

  // "repack"：正确做法——按断点重写 grid-template-areas
  if (w >= 760) {
    const cols = 4;
    const minCellW = Math.round((w - gap * 3 - 24) / 4);
    return {
      width: w,
      cols,
      gap,
      areas: ['"H H P P"', '"H H C C"', '"S A C C"'],
      minCellW,
      badge: "桌面 4 列满盒",
      ok: true,
      reason: `宽屏 ${w}px 采用 4 列完整便当盘，1×1 最小仓宽 ${minCellW}px，大标题与内容主体各占 2×2 双主位。`,
    };
  }
  if (w >= 430) {
    const cols = 2;
    const minCellW = Math.round((w - gap - 24) / 2);
    return {
      width: w,
      cols,
      gap,
      areas: ['"H H"', '"C C"', '"P S"', '"A A"'],
      minCellW,
      badge: "平板/大手机 2 列重装",
      ok: true,
      reason: `${w}px 改写为 2 列重排：主标与内容主体跨满 2 列保持 2× 面积优势，轻配仓成对并肩，单格宽 ${minCellW}px 清晰易读。`,
    };
  }
  const cols = 2;
  const minCellW = Math.round((w - gap - 24) / 2);
  return {
    width: w,
    cols,
    gap,
    areas: ['"H H"', '"C C"', '"P A"', '"S S"'],
    minCellW,
    badge: "极窄屏 2 列保节奏",
    ok: true,
    reason: `即便在 ${w}px 窄手机上，仍用 2 列把主标与主图跨满整行、把「重点指标 + 快捷入口」配对并排（单格 ${minCellW}px），既不挤碎也不丢便当层级。`,
  };
}

// ---------- 第 06 节：同心圆角几何计算 ----------
export function calcCornerGeometry(rInner, padding, concentric) {
  const rIn = Math.max(4, Math.min(36, Math.round(rInner)));
  const pad = Math.max(4, Math.min(32, Math.round(padding)));
  const rOut = concentric ? rIn + pad : rIn;
  // 45° 对角线上，从内圆角圆弧点到外圆角圆弧点的真实欧氏壁厚：
  // 外弧圆心 (rOut, rOut) 到拐角 (0,0) 距离 rOut*sqrt(2)，外弧点距 (0,0) 为 rOut*(sqrt(2)-1)
  // 内弧圆心 (pad+rIn, pad+rIn) 距 (0,0) 为 (pad+rIn)*sqrt(2)，内弧点距 (0,0) 为 (pad+rIn)*sqrt(2) - rIn
  const s2 = Math.SQRT2;
  const dOut = rOut * (s2 - 1);
  const dIn = (pad + rIn) * s2 - rIn;
  const diagThickness = Math.max(0, dIn - dOut);
  const delta = diagThickness - pad; // 同心时恒为 0.0px！
  return {
    rIn,
    pad,
    rOut,
    concentric,
    diagThickness: +diagThickness.toFixed(1),
    delta: +delta.toFixed(1),
  };
}

// ---------- 第 07 节：小练习（单变量对比，标签纯中性 A/B/C/D） ----------
export const QUIZ_OPTIONS = {
  A: {
    id: "A",
    correct: false,
    title: "A 方案：均分平权且右下留洞",
    body: "五块内容全被做成相同的 2×1 长条，最大/最小面积比只有 1.0×，看不出谁是主菜；更糟的是 5×2 = 10 格装不满 12 格托盘，右下硬生生空出一块缺口。",
    cells: [
      { name: "AI 降噪", tag: "2×1", area: "1 / 1 / 2 / 3", tone: "pink" },
      { name: "32h 续航", tag: "2×1", area: "1 / 3 / 2 / 5", tone: "cream" },
      { name: "声波试听", tag: "2×1", area: "2 / 1 / 3 / 3", tone: "peach" },
      { name: "28g 轻巧", tag: "2×1", area: "2 / 3 / 3 / 5", tone: "mint" },
      { name: "立即预订", tag: "2×1", area: "3 / 1 / 4 / 3", tone: "butter" },
      { name: "空洞 2×1", tag: "缺口", area: "3 / 3 / 4 / 5", tone: "hole" },
    ],
  },
  B: {
    id: "B",
    correct: true,
    title: "B 方案：主次分明、体量匹配、12 格完整收口",
    body: "「AI 降噪」稳居左上 2×2 主位（33%）第一时间立住主题，「声波试听」占右下 2×2 展开图文，「32h 续航」占 2×1 点睛，两项轻辅助退守 1×1——4:1 面积差清晰又不留一丝缺口。",
    cells: [
      { name: "AI 降噪", tag: "2×2", area: "1 / 1 / 3 / 3", tone: "pink" },
      { name: "32h 续航", tag: "2×1", area: "1 / 3 / 2 / 5", tone: "cream" },
      { name: "声波试听", tag: "2×2", area: "2 / 3 / 4 / 5", tone: "peach" },
      { name: "28g 轻巧", tag: "1×1", area: "3 / 1 / 4 / 2", tone: "mint" },
      { name: "立即预订", tag: "1×1", area: "3 / 2 / 4 / 3", tone: "butter" },
    ],
  },
  C: {
    id: "C",
    correct: false,
    title: "C 方案：外框整齐，但主角与配角面积倒挂",
    body: "只看网格骨架好像很漂亮（12/12 满盒、4:1 面积差），但细看内容归属就露馅了：次要参数「28g 轻巧」霸占了左上 2×2 主菜仓，核心卖点「AI 降噪」反倒被塞进了 1×1 小角落。",
    cells: [
      { name: "28g 轻巧", tag: "2×2", area: "1 / 1 / 3 / 3", tone: "mint" },
      { name: "32h 续航", tag: "2×1", area: "1 / 3 / 2 / 5", tone: "cream" },
      { name: "声波试听", tag: "2×2", area: "2 / 3 / 4 / 5", tone: "peach" },
      { name: "AI 降噪", tag: "1×1", area: "3 / 1 / 4 / 2", tone: "pink" },
      { name: "立即预订", tag: "1×1", area: "3 / 2 / 4 / 3", tone: "butter" },
    ],
  },
  D: {
    id: "D",
    correct: false,
    title: "D 方案：单仓吞并 75%，其余模块挤成边角碎格",
    body: "虽然「AI 降噪」在左上且没有空洞，但它独吞了 3×3 = 9 格，把其余图文、指标、按钮压成右侧三枚 1×1（甚至有一项被挤出或压扁成半格），整页失去了多仓平衡扫读的价值。",
    cells: [
      { name: "AI 降噪", tag: "3×3", area: "1 / 1 / 4 / 4", tone: "pink" },
      { name: "声波试听", tag: "1×1", area: "1 / 4 / 2 / 5", tone: "peach" },
      { name: "32h 续航", tag: "1×1", area: "2 / 4 / 3 / 5", tone: "cream" },
      { name: "轻巧/预订", tag: "1×1", area: "3 / 4 / 4 / 5", tone: "mint" },
    ],
  },
};
