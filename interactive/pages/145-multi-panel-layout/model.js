// 145 多面板版式 · 单一几何与评判真源
// DOM 面板排布、2D Canvas 视线路径层、实时读数与四关键词状态全部从此模块计算。

export const ROLES = [
  {
    id: 0,
    num: "1",
    circle: "①",
    name: "标题主景",
    short: "标题",
    en: "HERO TITLE",
    accent: "coral",
    barLabel: "主引题 · 视觉入口",
    idealSlot: 0,
    desc: "整页视觉锚点，负责在半秒内说清主题",
  },
  {
    id: 1,
    num: "2",
    circle: "②",
    name: "迷你图示",
    short: "图示",
    en: "DIAGRAM",
    accent: "cyan",
    barLabel: "图文案例 01 · 结构",
    idealSlot: 1,
    desc: "用抽象几何先讲清结构，不堆大段字",
  },
  {
    id: 2,
    num: "3",
    circle: "③",
    name: "要点说明",
    short: "说明",
    en: "KEY NOTES",
    accent: "teal",
    barLabel: "设计要点 · 核心逻辑",
    idealSlot: 2,
    desc: "用简短分层正文解释为什么这样排",
  },
  {
    id: 3,
    num: "4",
    circle: "④",
    name: "关键词区",
    short: "关键词",
    en: "KEYWORDS",
    accent: "amber",
    barLabel: "四维索引 · 速览",
    idealSlot: 3,
    desc: "横向提炼核心词条，适合放底带或收束区",
  },
  {
    id: 4,
    num: "5",
    circle: "⑤",
    name: "案例对比",
    short: "案例",
    en: "CASES 02/03",
    accent: "coral",
    barLabel: "图文案例 02 / 03",
    idealSlot: 4,
    desc: "并列展示两套参照样例，落脚验证",
  },
];

// 经验阈值集中定义（正文与诊断均引用此处常量）
export const RULES = {
  minRatio: 2.2,       // 最大板 / 最小板面积比（经验值）
  minLeadRatio: 1.32,  // 最大板 / 次大板面积比，避免双主争位（经验值）
  heroMinArea: 0.28,   // 主面板最小面积占比（经验值）
  heroMaxArea: 0.52,   // 主面板最大面积占比，再大就退化成单图页（经验值）
  minPanelArea: 0.09,  // 任意单板保底面积占比（经验值）
  maxAspect: 4.6,      // 任意单板极限长宽比（经验值）
  snapSpine: 0.57,
  snapLeftY: 0.67,
  snapRadius: 0.018,
};

// 开场错版：0/4 成立（均分平权 + 槽位打乱导致路径交叉回跳 + 全白平铺）
export function createBrokenState() {
  return {
    spine: 0.49,
    leftY: 0.50,
    rightY1: 0.33,
    rightY2: 0.67,
    // slots[slotIdx] = roleId
    // 0:左上(A)放⑤案例, 1:右上(B)放②图示, 2:右中(C)放④关键词, 3:左下(D)放③说明, 4:右下(E)放①标题
    slots: [4, 1, 3, 2, 0],
    gutter: "black",      // "none" | "black" | "wide"
    contrast: "flat",     // "flat" | "balanced" | "overload"
    showPath: true,
    selectedSlot: -1,
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function setSpine(state, raw, snap = true) {
  let v = clamp(raw, 0.24, 0.76);
  if (snap && Math.abs(v - RULES.snapSpine) < RULES.snapRadius) v = RULES.snapSpine;
  state.spine = +v.toFixed(4);
}

export function setLeftY(state, raw, snap = true) {
  let v = clamp(raw, 0.22, 0.78);
  if (snap && Math.abs(v - RULES.snapLeftY) < RULES.snapRadius) v = RULES.snapLeftY;
  state.leftY = +v.toFixed(4);
}

export function setRightY1(state, raw) {
  const maxY1 = Math.min(0.62, state.rightY2 - 0.16);
  state.rightY1 = +clamp(raw, 0.18, maxY1).toFixed(4);
}

export function setRightY2(state, raw) {
  const minY2 = Math.max(0.38, state.rightY1 + 0.16);
  state.rightY2 = +clamp(raw, minY2, 0.84).toFixed(4);
}

export function swapSlots(state, a, b) {
  if (a < 0 || b < 0 || a === b || a > 4 || b > 4) return false;
  const tmp = state.slots[a];
  state.slots[a] = state.slots[b];
  state.slots[b] = tmp;
  state.selectedSlot = -1;
  return true;
}

// 5 个物理槽位的归一化矩形（0..1），无重叠、无缝隙
export function computeSlotRects(state) {
  const s = state.spine;
  const ly = state.leftY;
  const r1 = state.rightY1;
  const r2 = state.rightY2;
  const rw = 1 - s;
  const raw = [
    { slot: 0, code: "A", label: "左上", x: 0, y: 0, w: s, h: ly },
    { slot: 1, code: "B", label: "右上", x: s, y: 0, w: rw, h: r1 },
    { slot: 2, code: "C", label: "右中", x: s, y: r1, w: rw, h: r2 - r1 },
    { slot: 3, code: "D", label: "左下", x: 0, y: ly, w: s, h: 1 - ly },
    { slot: 4, code: "E", label: "右下", x: s, y: r2, w: rw, h: 1 - r2 },
  ];
  return raw.map((r) => ({
    ...r,
    area: r.w * r.h,
    cx: r.x + r.w * 0.5,
    cy: r.y + r.h * 0.5,
    roleId: state.slots[r.slot],
  }));
}

// 判断两条线段 (a,b) 与 (c,d) 是否严格相交（不含端点）
function segmentCross(a, b, c, d) {
  const orient = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if ((o1 > 1e-5 && o2 < -1e-5 || o1 < -1e-5 && o2 > 1e-5) &&
      (o3 > 1e-5 && o4 < -1e-5 || o3 < -1e-5 && o4 > 1e-5)) {
    const denom = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (Math.abs(denom) < 1e-7) return null;
    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denom;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  }
  return null;
}

// 计算从角色 0 → 1 → 2 → 3 → 4 的真实几何阅读路径
export function analyzePath(state, rects) {
  const byRole = [];
  for (let roleId = 0; roleId < 5; roleId++) {
    const r = rects.find((item) => item.roleId === roleId);
    byRole.push({ roleId, slot: r.slot, x: r.cx, y: r.cy, rect: r });
  }

  const segments = [];
  let backtracks = 0;
  for (let i = 0; i < 4; i++) {
    const p0 = byRole[i];
    const p1 = byRole[i + 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    // 左栏底部(slot 3)跳往右栏顶部(slot 1)属于合法的双栏阅读换列，其余大幅上跳或向左上倒退皆算回跳
    const cleanColumnReset = p0.slot === 3 && p1.slot === 1;
    const steepUp = dy < -0.22 && !cleanColumnReset;
    const reverseUpLeft = dx < -0.18 && dy < 0.04;
    const isBacktrack = steepUp || reverseUpLeft;
    if (isBacktrack) backtracks++;
    segments.push({
      from: p0,
      to: p1,
      step: i,
      isBacktrack,
      crossed: false,
    });
  }

  const crossings = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      const hit = segmentCross(segments[i].from, segments[i].to, segments[j].from, segments[j].to);
      if (hit) {
        segments[i].crossed = true;
        segments[j].crossed = true;
        crossings.push({ ...hit, a: i, b: j });
      }
    }
  }

  const startsTopLeft = byRole[0].slot === 0;
  const endsBottomRight = byRole[4].slot === 4;
  const ok = startsTopLeft && endsBottomRight && crossings.length === 0 && backtracks === 0;

  return {
    points: byRole,
    segments,
    crossings,
    backtracks,
    startsTopLeft,
    endsBottomRight,
    ok,
  };
}

// 整板综合体检：返回四关键词状态、全部读数与单句白话诊断
export function evaluate(state, boardAspect = 1.28) {
  const rects = computeSlotRects(state);
  const path = analyzePath(state, rects);

  const areas = rects.map((r) => ({ ...r, pct: Math.round(r.area * 100) }));
  const sorted = [...areas].sort((a, b) => b.area - a.area);
  const largest = sorted[0];
  const second = sorted[1];
  const smallest = sorted[4];

  const ratio = +(largest.area / Math.max(0.001, smallest.area)).toFixed(2);
  const leadRatio = +(largest.area / Math.max(0.001, second.area)).toFixed(2);
  const heroPct = Math.round(largest.area * 100);
  const minPct = Math.round(smallest.area * 100);

  // 检查是否存在被压扁的细条面板
  const crushedSlots = rects.filter((r) => {
    const rw = r.w * boardAspect;
    const rh = r.h;
    const asp = Math.max(rw / Math.max(0.01, rh), rh / Math.max(0.01, rw));
    return r.area < RULES.minPanelArea || asp > RULES.maxAspect;
  });

  const titleRect = rects.find((r) => r.roleId === 0);
  const titlePct = Math.round(titleRect.area * 100);
  const titleIsLargest = titleRect.area >= largest.area - 0.005;

  // 1. 分区 ZONE：有明显主次面积差、单一主角、既不均分也不吞并，且无被压扁面板
  const zoneEqual = ratio < RULES.minRatio;
  const zoneTied = !zoneEqual && leadRatio < RULES.minLeadRatio;
  const zoneSwallow = largest.area > RULES.heroMaxArea;
  const zoneTooSmallHero = largest.area < RULES.heroMinArea;
  const zoneOk = !zoneEqual && !zoneTied && !zoneSwallow && !zoneTooSmallHero && crushedSlots.length === 0;

  // 2. 模块 MODULE：隔缝清晰（粗黑隔板），无压扁，且 ① 标题主景占据最大面板
  const gutterOk = state.gutter === "black";
  const moduleOk = gutterOk && crushedSlots.length === 0 && titleIsLargest;

  // 3. 叙事 NARRATIVE：① 左上入口 → ⑤ 右下收尾，0 交叉、0 回跳
  const narrativeOk = path.ok;

  // 4. 对比 CONTRAST：色阶主次分明（既不全白平铺，也不全员满铺互抢）
  const contrastOk = state.contrast === "balanced";

  const score = [zoneOk, moduleOk, narrativeOk, contrastOk].filter(Boolean).length;

  // 白话主诊断（严格与当前几何与状态一致）
  let badge = "错版";
  let headline = "";
  let reason = "";
  let hint = "";
  let severity = "err";

  if (crushedSlots.length > 0) {
    const first = crushedSlots[0];
    const role = ROLES[first.roleId];
    badge = "面板过挤";
    headline = `「${role.circle} ${role.name}」被压到 ${Math.round(first.area * 100)}%，内部版式装不下`;
    reason = `多面板不是越碎越好：任意单板低于 ${Math.round(RULES.minPanelArea * 100)}%（经验底线）或被压成窄缝时，文字与图示会失真挤压，拖累整页节奏。`;
    hint = `把「${first.label}」旁的粗黑隔板往回拉，给「${role.name}」留出至少 9% 的容积。`;
  } else if (state.gutter === "none") {
    badge = "隔缝粘连";
    headline = "0px 无缝拼接让 5 块面板的边界互相串场";
    reason = "去掉隔缝后，相邻面板的色块与文字直接贴死，人眼分不清哪条说明属于哪块图示，模块感瞬间瓦解。";
    hint = "把隔缝切回「4px 粗黑隔板」，用果断的物理界线把五块角色隔开。";
  } else if (state.gutter === "wide") {
    badge = "隔缝过宽";
    headline = "20px 宽沟把整页拆成 5 张彼此无关的散卡片";
    reason = "隔缝宽过头时，格式塔接近律失效：五块内容不再像同一张版面的有机分区，阅读视线在宽白沟里频频断片。";
    hint = "把隔缝切回「4px 粗黑隔板」，既稳住边界又保住整页的整体感。";
  } else if (!narrativeOk) {
    const cCount = path.crossings.length;
    const bCount = path.backtracks;
    badge = cCount > 0 ? "路径交叉" : "叙事回跳";
    if (!path.startsTopLeft) {
      headline = `① 标题主景被埋在${titleRect.label}（${titlePct}%），视线一进页就走反`;
      reason = `当前路线出现 ${bCount} 处逆向回跳${cCount > 0 ? `与 ${cCount} 处路径交叉` : ""}——左上入口被「${ROLES[state.slots[0]].circle} ${ROLES[state.slots[0]].name}」占着，读者只能先撞见配角再回头找主题。`;
      hint = `先点「${titleRect.label}（① 标题）」再点「左上（${ROLES[state.slots[0]].circle}）」互换槽位，把入口还给主角。`;
    } else if (!path.endsBottomRight) {
      const endRect = rects.find((r) => r.roleId === 4);
      headline = `⑤ 案例对比停在${endRect.label}，末尾没有收在右下落脚`;
      reason = `读者按从左到右、从上到下扫完页面后，期待在右下角看到收口对比；目前路径有 ${bCount} 处回跳${cCount > 0 ? `、${cCount} 处交叉` : ""}。`;
      hint = `点「${endRect.label}（⑤ 案例）」与「右下」互换，让叙事自然收尾。`;
    } else {
      headline = `中间步骤来回折返（${bCount} 处回跳${cCount > 0 ? ` · ${cCount} 处交叉` : ""}）`;
      reason = "面板顺序打结会让眼睛在左右两栏间反复横跳，把原本清晰的「引题 → 图示 → 说明 → 关键词 → 案例」拆散了。";
      hint = "点选两块顺序颠倒的面板互换槽位，理顺为 Z 字形或双栏顺流。";
    }
  } else if (!zoneOk) {
    if (zoneSwallow) {
      badge = "单板吞并";
      headline = `最大面板已占 ${heroPct}%，多面板正在退化成单图页`;
      reason = `当主面板超过 ${Math.round(RULES.heroMaxArea * 100)}%（经验上限），其余四块被迫挤成狭窄边栏，失去了多面板并置对照的优势。`;
      hint = "把粗黑主竖脊稍微向左推回，让主面板落在 28%–50% 之间。";
    } else if (zoneEqual) {
      badge = "均分平权";
      headline = `五块面积几乎平分（主次比仅 ${ratio.toFixed(1)}×），视线无处先落`;
      reason = `当前最大板 ${heroPct}%、最小板 ${minPct}%，低于 ${RULES.minRatio}× 的经验主次差——五块面板像瓷砖一样同等响亮，读者不知道该先看谁。`;
      hint = "向右拖主竖脊，再向下拉左栏水平隔板，把左上 ① 主面板放大到 35% 左右。";
    } else if (zoneTied) {
      badge = "双主争位";
      headline = `左栏上下两块一样大（主次仅差 ${leadRatio.toFixed(2)}×），两个主角互相抢眼`;
      reason = "光把左栏加宽还不够：如果左上标题板和左下关键词板高度对半，两块一样重，第一视觉焦点依然分散。";
      hint = "向下拖动左栏的水平黑隔板，把左下收窄成紧凑底带，让左上成为唯一主角。";
    } else {
      badge = "主次不足";
      headline = `主面板仅占 ${heroPct}%，还撑不起整页第一落点`;
      reason = `作为多面板叙事的开篇，主角面板通常需要 ${Math.round(RULES.heroMinArea * 100)}%–${Math.round(RULES.heroMaxArea * 100)}%（经验值）才足够醒目。`;
      hint = "向右拖主竖脊并向下微调左栏隔板，放大左上主面板。";
    }
  } else if (!moduleOk) {
    badge = "主次倒挂";
    headline = `最大面板（${heroPct}%）给了「${ROLES[largest.roleId].circle} ${ROLES[largest.roleId].name}」，而不是 ① 标题主景`;
    reason = "面板尺寸必须跟着信息权重走：把次要索引塞进大格会显得空荡，把主角压进小格又施展不开。";
    hint = `把「① 标题主景」换进最大槽位（${largest.label}），或拖动隔板把 ① 所在格拉成最大板。`;
  } else if (!contrastOk) {
    if (state.contrast === "flat") {
      badge = "全白平铺";
      headline = "5 块面板清一色淡底，主次全靠人眼硬猜";
      reason = "面积和顺序已经理顺，但缺少色带与底色分化，各模块之间的信息角色仍显得平淡雷同。";
      hint = "把色阶切到「主次色带」，用一处深青实底加彩色顶条拉出模块层级。";
    } else {
      badge = "色彩打架";
      headline = "5 块面板全部高饱和满铺，每块都在抢话筒";
      reason = "多面板对比靠的是「一两处强色 + 大面积米纸留白」；全员涂满饱和色后，反而抵消了刚才辛苦调出的大小层级。";
      hint = "把色阶切回「主次色带」，保留大部分暖米纸留白，只让关键模块显色。";
    }
  } else {
    badge = "4/4 成立";
    severity = "ok";
    headline = `分区清晰 · 主板 ${heroPct}% 领衔，路径零回跳`;
    reason = `最大与最小面板面积比 ${ratio.toFixed(1)}×（≥ ${RULES.minRatio}× 经验值），① 稳立左上入口顺流到 ⑤ 收尾，粗黑隔板配主次色带让五块信息既独立又连贯。`;
    hint = "试着切到「全员满铺」「0px 粘连」，或把隔板拖到极端，亲眼看版面怎么重新失衡。";
  }

  return {
    rects,
    path,
    ratio,
    leadRatio,
    heroPct,
    minPct,
    titlePct,
    crushedSlots: crushedSlots.map((r) => r.slot),
    checks: {
      zone: {
        ok: zoneOk,
        value: `${ratio.toFixed(1)}×`,
        detail: zoneOk ? `主板 ${heroPct}%` : zoneSwallow ? `吞并 ${heroPct}%` : zoneTied ? "双主同大" : `均分 ${ratio.toFixed(1)}×`,
      },
      module: {
        ok: moduleOk,
        value: state.gutter === "black" ? (crushedSlots.length ? `挤扁 ${minPct}%` : titleIsLargest ? "适配" : "倒挂") : state.gutter === "none" ? "0px 粘连" : "20px 散架",
        detail: state.gutter === "black" ? (titleIsLargest ? `最小 ${minPct}%` : "① 非主板") : state.gutter === "none" ? "无隔缝" : "沟过宽",
      },
      narrative: {
        ok: narrativeOk,
        value: narrativeOk ? "顺流" : `${path.crossings.length}交/${path.backtracks}跳`,
        detail: narrativeOk ? "①→⑤ 零回跳" : !path.startsTopLeft ? "① 未立左上" : "路径折返",
      },
      contrast: {
        ok: contrastOk,
        value: state.contrast === "balanced" ? "主次色带" : state.contrast === "flat" ? "全白平铺" : "全员满铺",
        detail: state.contrast === "balanced" ? "1 锚 + 留白" : state.contrast === "flat" ? "缺少锚点" : "高饱和互抢",
      },
    },
    score,
    diagnosis: { badge, headline, reason, hint, severity },
  };
}
