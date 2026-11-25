// 205 嵌套网格 — 单真源几何与诊断模型
// 所有画布坐标、列宽像素、四项原则达标状态与白话诊单均由此模块统一计算，绝不双套硬编码。

export const REF_CONTAINER_W = 960;
export const REF_MARGIN = 32;

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报结构",
    short: "原海报",
    z1: "父网格通栏眉区",
    z2: "子模块 · 虚线子网",
    z3: "局部秩序 · 精细子网",
    z4: "内容分组",
  },
  news: {
    id: "news",
    label: "图文资讯页",
    short: "资讯页",
    z1: "头图导视区",
    z2: "主阅读流（图+摘要）",
    z3: "侧栏快讯与榜单",
    z4: "专题卡片组",
  },
  shop: {
    id: "shop",
    label: "电商商品页",
    short: "商品页",
    z1: "店铺导航与面包屑",
    z2: "左主图 + 缩略子网",
    z3: "购买框与规格子网",
    z4: "服务保障徽章",
  },
};

export const INITIAL_STATE = {
  scene: "poster",
  parentCols: 12,
  splitCol: 5.4,     // 刻意脱离整数父网格列线（0.4 列偏移）
  parentGap: 8,      // 刻意压扁父级外缝
  childGap: 24,      // 刻意大于父级外缝（间距倒挂）
  childColsA: 6,     // 刻意在 5.4 列内挤塞 6 栏子网（单列过碎）
  childColsB: 2,
  bottomCards: 5,    // 刻意在 12 列父网中排 5 栏（无法整除对齐）
  nestingDepth: 2,   // 2 = 标准两层；4 = 俄罗斯套娃试错
  layerMode: "all",  // "all" | "parent" | "zones" | "content"
  focusZone: 0,      // 0..4
};

export const PRESETS = {
  classic84: {
    label: "8+4 经典解",
    patch: { parentCols: 12, splitCol: 8, parentGap: 20, childGap: 10, childColsA: 3, childColsB: 2, bottomCards: 4, nestingDepth: 2 },
  },
  shop75: {
    label: "7+5 电商解",
    patch: { parentCols: 12, splitCol: 7, parentGap: 20, childGap: 10, childColsA: 3, childColsB: 2, bottomCards: 4, nestingDepth: 2 },
  },
  wide93: {
    label: "9+3 宽主解",
    patch: { parentCols: 12, splitCol: 9, parentGap: 16, childGap: 8, childColsA: 3, childColsB: 1, bottomCards: 3, nestingDepth: 2 },
  },
  pub16: {
    label: "16列出版解",
    patch: { parentCols: 16, splitCol: 10, parentGap: 16, childGap: 8, childColsA: 4, childColsB: 2, bottomCards: 4, nestingDepth: 2 },
  },
  errInvert: {
    label: "试错：间距倒挂",
    patch: { parentCols: 12, splitCol: 8, parentGap: 8, childGap: 24, childColsA: 3, childColsB: 2, bottomCards: 4, nestingDepth: 2 },
  },
  errDoll: {
    label: "试错：四层套娃",
    patch: { parentCols: 12, splitCol: 8, parentGap: 16, childGap: 8, childColsA: 4, childColsB: 2, bottomCards: 4, nestingDepth: 4 },
  },
  resetBroken: {
    label: "复原 0/4 错态",
    patch: { ...INITIAL_STATE },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function minZoneCols(parentCols) {
  return parentCols <= 8 ? 2 : 3;
}

export function normalizeState(raw) {
  const s = { ...INITIAL_STATE, ...raw };
  s.parentCols = [8, 12, 16].includes(Number(s.parentCols)) ? Number(s.parentCols) : 12;
  const edgeMin = 1.6;
  s.splitCol = clamp(Number(s.splitCol) || 5.4, edgeMin, s.parentCols - edgeMin);
  s.parentGap = clamp(Math.round(Number(s.parentGap) || 8), 4, 32);
  s.childGap = clamp(Math.round(Number(s.childGap) || 24), 4, 32);
  s.childColsA = clamp(Math.round(Number(s.childColsA) || 3), 1, 6);
  s.childColsB = clamp(Math.round(Number(s.childColsB) || 2), 1, 4);
  s.bottomCards = clamp(Math.round(Number(s.bottomCards) || 4), 2, 6);
  s.nestingDepth = Number(s.nestingDepth) >= 4 ? 4 : 2;
  if (!SCENES[s.scene]) s.scene = "poster";
  if (!["all", "parent", "zones", "content"].includes(s.layerMode)) s.layerMode = "all";
  s.focusZone = clamp(Math.round(Number(s.focusZone) || 0), 0, 4);
  return s;
}

/**
 * 计算单真源嵌套网格几何与十类诊断状态。
 * @param {object} rawState
 * @param {number} boxW 画布逻辑宽度（px）
 * @param {number} boxH 画布逻辑高度（px）
 */
export function computeLayout(rawState, boxW = 680, boxH = 490) {
  const s = normalizeState(rawState);
  const scale = boxW / REF_CONTAINER_W;

  // 外框留白（为原海报风格的外延十字刻线与列号留位）
  const padL = Math.round(clamp(boxW * 0.06, 24, 44));
  const padR = Math.round(clamp(boxW * 0.055, 22, 40));
  const padT = Math.round(clamp(boxH * 0.088, 30, 44));
  const padB = Math.round(clamp(boxH * 0.072, 24, 36));

  const frame = {
    x: padL,
    y: padT,
    w: Math.max(180, boxW - padL - padR),
    h: Math.max(180, boxH - padT - padB),
  };

  // 参考坐标系（960px 容器内）真实像素核算
  const refInnerW = REF_CONTAINER_W - REF_MARGIN * 2; // 896px
  const refParentColW = (refInnerW - (s.parentCols - 1) * s.parentGap) / s.parentCols;

  // 画布缩放像素（与参考系完全等比）
  const pScale = frame.w / refInnerW;
  const pGap = s.parentGap * pScale;
  const cGap = s.childGap * pScale;
  const pColW = refParentColW * pScale;

  // 每一父列坐标
  const parentTracks = [];
  for (let i = 0; i < s.parentCols; i++) {
    const x = frame.x + i * (pColW + pGap);
    parentTracks.push({ index: i + 1, x, w: pColW, right: x + pColW });
  }

  // 三条垂直层级（区① 顶栏，区②/③ 中段双子区，区④ 底分组）
  const rowGap = Math.max(8, pGap);
  const availH = frame.h - rowGap * 2;
  const h1 = availH * 0.22;
  const h2 = availH * 0.54;
  const h4 = availH - h1 - h2;

  const y1 = frame.y;
  const y2 = y1 + h1 + rowGap;
  const y4 = y2 + h2 + rowGap;

  // 区② 与 区③ 之间的动态分界（允许连续浮点，才能在拖动时真实体现脱轨与吸附）
  const splitCenterX = frame.x + s.splitCol * (pColW + pGap) - pGap / 2;
  const z2Right = splitCenterX - pGap / 2;
  const z3Left = splitCenterX + pGap / 2;

  const zone1 = { id: 1, x: frame.x, y: y1, w: frame.w, h: h1 };
  const zone2 = { id: 2, x: frame.x, y: y2, w: Math.max(40, z2Right - frame.x), h: h2 };
  const zone3 = { id: 3, x: z3Left, y: y2, w: Math.max(40, frame.x + frame.w - z3Left), h: h2 };
  const zone4 = { id: 4, x: frame.x, y: y4, w: frame.w, h: h4 };

  // 参考尺度下的区②/③宽度与子列宽（单真源像素）
  const refZ2W = zone2.w / pScale;
  const refZ3W = zone3.w / pScale;
  const refInnerPad = 14;
  const innerPadPx = refInnerPad * pScale;

  // 区② 子网格列（顶部留出微标带，避免虚线切穿文字）
  const topHeadPad = Math.max(22, innerPadPx + 12);
  const botInnerPad = Math.max(8, innerPadPx);
  const refColWA = (refZ2W - refInnerPad * 2 - (s.childColsA - 1) * s.childGap) / s.childColsA;
  const colWAp = Math.max(4, refColWA * pScale);
  const childTracksA = [];
  for (let i = 0; i < s.childColsA; i++) {
    const x = zone2.x + innerPadPx + i * (colWAp + cGap);
    childTracksA.push({ x, w: colWAp, y: zone2.y + topHeadPad, h: Math.max(20, zone2.h - topHeadPad - botInnerPad) });
  }

  // 区③ 子网格列
  const refColWB = (refZ3W - refInnerPad * 2 - (s.childColsB - 1) * s.childGap) / s.childColsB;
  const colWBp = Math.max(4, refColWB * pScale);
  const childTracksB = [];
  for (let i = 0; i < s.childColsB; i++) {
    const x = zone3.x + innerPadPx + i * (colWBp + cGap);
    childTracksB.push({ x, w: colWBp, y: zone3.y + topHeadPad, h: Math.max(20, zone3.h - topHeadPad - botInnerPad) });
  }

  // 区④ 底部内容分组卡片（如果不能整除父列，就会明显错开父网格竖线！）
  const refBottomCardW = (refInnerW - (s.bottomCards - 1) * s.parentGap) / s.bottomCards;
  const bCardW = refBottomCardW * pScale;
  const bottomItems = [];
  for (let i = 0; i < s.bottomCards; i++) {
    const x = frame.x + i * (bCardW + pGap);
    const spanCols = s.parentCols / s.bottomCards;
    // 检查该卡左缘和右缘离最近父列边缘的偏差（参考像素）
    const leftColFloat = (i * s.parentCols) / s.bottomCards;
    const aligned = Math.abs(leftColFloat - Math.round(leftColFloat)) < 0.02;
    bottomItems.push({ index: i, x, y: zone4.y, w: bCardW, h: zone4.h, spanCols, aligned });
  }

  // ---------- 单真源十类诊断规则 ----------
  const nearestSplit = Math.round(s.splitCol);
  const splitDelta = Math.abs(s.splitCol - nearestSplit);
  const rightSpan = +(s.parentCols - s.splitCol).toFixed(1);
  const leftSpan = +s.splitCol.toFixed(1);
  const minSpan = minZoneCols(s.parentCols);

  const splitOffGrid = splitDelta > 0.08;
  const splitExtreme = !splitOffGrid && (nearestSplit < minSpan || s.parentCols - nearestSplit < minSpan);
  const alignOk = !splitOffGrid && !splitExtreme;

  const depthTooDeep = s.nestingDepth >= 4;
  const childFlat = s.childColsA === 1 && s.childColsB === 1;
  const minChildColW = Math.min(refColWA, refColWB);
  const childCrushed = refColWA < 56 || refColWB < 56;
  const nestOk = !depthTooDeep && !childFlat && !childCrushed;

  const gapInverted = s.childGap > s.parentGap;
  const gapEqual = s.childGap === s.parentGap;
  const gapCollapsed = s.parentGap < 12 || s.childGap < 6;
  const gapRatio = +(s.parentGap / Math.max(1, s.childGap)).toFixed(2);
  const spacingOk = !gapInverted && !gapEqual && !gapCollapsed;

  const groupDivisible = s.parentCols % s.bottomCards === 0;
  const groupCrushed = refBottomCardW < 90;
  const groupOk = groupDivisible && !groupCrushed;

  const checks = [
    {
      key: "align",
      title: "统一对齐",
      en: "ALIGNMENT",
      ok: alignOk,
      badge: alignOk
        ? `${nearestSplit} + ${s.parentCols - nearestSplit} 咬合`
        : splitOffGrid
        ? `脱轨 ${splitDelta.toFixed(1)} 列`
        : `主辅过偏`,
    },
    {
      key: "nest",
      title: "层级嵌套",
      en: "HIERARCHY",
      ok: nestOk,
      badge: nestOk
        ? `最小子列 ${Math.round(minChildColW)}px`
        : depthTooDeep
        ? "4 层套娃"
        : childFlat
        ? "零子网格"
        : `挤碎 ${Math.round(minChildColW)}px`,
    },
    {
      key: "spacing",
      title: "间距系统",
      en: "SPACING",
      ok: spacingOk,
      badge: spacingOk
        ? `外 ${s.parentGap} / 内 ${s.childGap}px`
        : gapInverted
        ? `倒挂 ${s.parentGap}<${s.childGap}`
        : gapCollapsed
        ? "缝隙粘连"
        : `外=内 ${s.parentGap}px`,
    },
    {
      key: "group",
      title: "内容归组",
      en: "GROUPING",
      ok: groupOk,
      badge: groupOk
        ? `${s.bottomCards} 栏整除 ${s.parentCols}`
        : `${s.parentCols}÷${s.bottomCards} 不整除`,
    },
  ];

  const passCount = checks.filter((c) => c.ok).length;

  // 优先级最高的当前诊单（白话讲清「为什么」+ 下一步可执行动作）
  let diag;
  if (splitOffGrid) {
    diag = {
      code: "splitOffGrid",
      tone: "err",
      tag: `${passCount}/4 · 父线脱轨`,
      headline: `分界线悬在 ${leftSpan} 列半途，脱离了父网格脊梁`,
      body: `区②与区③的分隔脊偏移最近父列线 ${splitDelta.toFixed(1)} 列。嵌套网格的第一铁律是「子模块先服从父网格」——一旦父区边界不落整数轨道，下方文字和顶栏通栏就再也对齐不到同一条竖线上。`,
      action: `向右或向左轻拖画布中央的橙色分界脊（或按 ← / → 键），把它吸进 ${clamp(nearestSplit, minSpan, s.parentCols - minSpan)} 列等整数父线。`,
      fixKey: "snapSplit",
    };
  } else if (splitExtreme) {
    diag = {
      code: "splitExtreme",
      tone: "err",
      tag: `${passCount}/4 · 主辅极偏`,
      headline: `一侧父区被挤到只剩 ${Math.min(nearestSplit, s.parentCols - nearestSplit)} 列，装不下独立子网格`,
      body: `父网格总共 ${s.parentCols} 列，却把其中一侧压窄到不足 ${minSpan} 列。窄条里再硬划子网格只剩细碎竖缝，主辅区失去对话比例。`,
      action: `把橙色分界脊拉回中间舒适区（例如 ${Math.round(s.parentCols * 0.67)} + ${s.parentCols - Math.round(s.parentCols * 0.67)} 列）。`,
      fixKey: "snapSplit",
    };
  } else if (gapInverted) {
    diag = {
      code: "gapInverted",
      tone: "err",
      tag: `${passCount}/4 · 间距倒挂`,
      headline: `子网内缝 ${s.childGap}px 宽过父网外缝 ${s.parentGap}px，模块彻底串组`,
      body: `按格式塔邻近性原则，眼睛永远把距离更近的元素归成一组。现在区②内部的卡片间距（${s.childGap}px）反而是跨区外缝（${s.parentGap}px）的 ${(s.childGap / s.parentGap).toFixed(1)} 倍，右边缘卡片看起来更像属于隔壁区③。`,
      action: `把下方「父栏距」调宽到 16–24px、同时把「子栏距」收紧到 8–12px，守住「外宽内紧」。`,
      fixKey: "fixGap",
    };
  } else if (gapCollapsed) {
    diag = {
      code: "gapCollapsed",
      tone: "err",
      tag: `${passCount}/4 · 缝隙粘连`,
      headline: `父栏距 ${s.parentGap}px / 子栏距 ${s.childGap}px 过窄，区块糊成一团`,
      body: `父栏距低于 12px 或子栏距低于 6px 时，相邻内容卡片之间缺少呼吸余白，层级边界在扫视时直接糊掉。`,
      action: `把父栏距提高到 16px 以上、子栏距设为 8–12px，让父子共享清晰间距比例。`,
      fixKey: "fixGap",
    };
  } else if (gapEqual) {
    diag = {
      code: "gapEqual",
      tone: "warn",
      tag: `${passCount}/4 · 内外同宽`,
      headline: `外缝与内缝同为 ${s.parentGap}px，父子两级边界分不清主次`,
      body: `当父级外缝和子级内缝完全相等时，读者得靠边框或底色才能猜出哪条缝是区域边界。把外缝拉宽到内缝的 1.5–2 倍（经验比例），不加框线也能一眼分出父子层级。`,
      action: `把「子栏距」收窄一档（如 ${Math.max(8, Math.round(s.parentGap / 2))}px），立刻拉出父子呼吸差。`,
      fixKey: "fixGap",
    };
  } else if (depthTooDeep) {
    diag = {
      code: "depthTooDeep",
      tone: "err",
      tag: `${passCount}/4 · 四层套娃`,
      headline: `网格套到第 4 层，留白和嵌套内边距吃掉了大半版面`,
      body: `每一层新容器都要扣掉左右内边距和内部栏距。在桌面 960px 尚且局促，一旦落到手机屏，内容列宽会被嵌套缝隙吞噬大半，排版变成给自己造迷宫。`,
      action: `点下方「降回两层」或切回标准解：绝大多数页面只做「父网 → 子网」两层就够用。`,
      fixKey: "fixDepth",
    };
  } else if (childFlat) {
    diag = {
      code: "childFlat",
      tone: "err",
      tag: `${passCount}/4 · 零子网格`,
      headline: `区②与区③都是 1 列通栏，退化成了普通两栏布局`,
      body: `只切出父区却不在区内部建子网格，高密度图文卡片与规格表就会堆成一长列，丢失了嵌套网格「宏观统一、微观细分」的威力。`,
      action: `把「区②子列」调到 2–3 列（或给「区③子列」加到 2 列），在父区内部建立局部秩序。`,
      fixKey: "fixChildCols",
    };
  } else if (childCrushed) {
    const tightZone = refColWA < refColWB ? "区②" : "区③";
    const tightCols = refColWA < refColWB ? s.childColsA : s.childColsB;
    diag = {
      code: "childCrushed",
      tone: "err",
      tag: `${passCount}/4 · 子列挤碎`,
      headline: `${tightZone}塞进 ${tightCols} 列子网，单列只剩 ${Math.round(minChildColW)}px`,
      body: `以 960px 参考版芯核算，${tightZone}内每个子列宽度被压到 ${Math.round(minChildColW)}px（低于经验可读底线 56px）。标题被迫频繁断行，图标与文字贴脸打架。`,
      action: `减少 ${tightZone} 的子列数，或者把橙色分界脊往另一侧挪宽几列父网格。`,
      fixKey: "fixChildCols",
    };
  } else if (!groupDivisible) {
    diag = {
      code: "groupNonDivisible",
      tone: "err",
      tag: `${passCount}/4 · 底区不整除`,
      headline: `底部排了 ${s.bottomCards} 张卡，在 ${s.parentCols} 列父网里无法整除对齐`,
      body: `${s.parentCols} ÷ ${s.bottomCards} = ${(s.parentCols / s.bottomCards).toFixed(2)} 列。看画布底部的红色错位刻痕：卡片竖缝全部避开了父网格垂线，下半页和上半页像两张拼起来的图纸。`,
      action: `把「底区④栏数」改成 ${s.parentCols} 的约数（如 ${s.parentCols === 16 ? "4 或 2" : s.parentCols === 8 ? "4 或 2" : "4、3、6"} 栏），卡片立刻严丝合缝落回父线。`,
      fixKey: "fixGroup",
    };
  } else if (groupCrushed) {
    diag = {
      code: "groupCrushed",
      tone: "err",
      tag: `${passCount}/4 · 底卡过窄`,
      headline: `底区单卡宽度只剩 ${Math.round(refBottomCardW)}px，内容挤爆`,
      body: `虽然整除了父列，但单张底卡净宽太窄，图文分组变成细长标签条。`,
      action: `把「底区④栏数」减到 3 或 4 栏，给每组内容留出舒展版芯。`,
      fixKey: "fixGroup",
    };
  } else {
    const solutionName =
      s.parentCols === 16
        ? "16 列精细出版嵌套解"
        : nearestSplit === 8 && s.parentCols === 12
        ? "12 列 8+4 经典资讯嵌套解"
        : nearestSplit === 7 && s.parentCols === 12
        ? "12 列 7+5 电商主辅嵌套解"
        : nearestSplit === 9 && s.parentCols === 12
        ? "12 列 9+3 宽主窄栏嵌套解"
        : nearestSplit === s.parentCols / 2
        ? `${s.parentCols} 列对称双翼嵌套解`
        : `${s.parentCols} 列 ${nearestSplit}+${s.parentCols - nearestSplit} 合法嵌套解`;
    diag = {
      code: "valid",
      tone: "ok",
      tag: "4/4 · 秩序建立",
      headline: `已达成「${solutionName}」`,
      body: `父网格 ${s.parentCols} 列稳稳锁住外框，区②(${nearestSplit}列→${s.childColsA}子列，单列 ${Math.round(refColWA)}px) 与区③(${s.parentCols - nearestSplit}列→${s.childColsB}子列，单列 ${Math.round(refColWB)}px) 各自建立局部秩序，外缝 ${s.parentGap}px 是内缝 ${s.childGap}px 的 ${gapRatio} 倍，底区 ${s.bottomCards} 组严格对齐父线。`,
      action: `可以继续切换上方「图文资讯页 / 电商商品页」，或试试「试错」按钮故意打乱层级对比效果。`,
      fixKey: null,
    };
  }

  // 画布内可直接点击的红框纠错标（最多显示 2 个避免挡画面）
  const callouts = [];
  if (splitOffGrid || splitExtreme) {
    callouts.push({
      id: "snapSplit",
      x: splitCenterX,
      y: zone2.y + Math.min(46, zone2.h * 0.25),
      text: splitOffGrid ? `脱轨 ${splitDelta.toFixed(1)}列 · 点吸父线` : `比例过偏 · 点回正`,
    });
  }
  if (gapInverted || gapCollapsed) {
    callouts.push({
      id: "fixGap",
      x: zone2.x + zone2.w * 0.5,
      y: zone2.y + zone2.h - 24,
      text: gapInverted ? `内缝 ${s.childGap} > 外缝 ${s.parentGap} · 点调间距` : `缝隙粘连 · 点调间距`,
    });
  } else if (childCrushed || depthTooDeep) {
    callouts.push({
      id: depthTooDeep ? "fixDepth" : "fixChildCols",
      x: zone2.x + zone2.w * 0.5,
      y: zone2.y + zone2.h - 24,
      text: depthTooDeep ? `4层套娃 · 点降回2层` : `子列挤至 ${Math.round(minChildColW)}px · 点减列`,
    });
  }
  if (!groupDivisible && callouts.length < 2) {
    callouts.push({
      id: "fixGroup",
      x: zone4.x + zone4.w * 0.5,
      y: zone4.y + zone4.h * 0.5,
      text: `12列排 ${s.bottomCards} 栏错位 · 点改 4 栏`.replace("12", String(s.parentCols)),
    });
  }

  return {
    state: s,
    frame,
    pScale,
    pGap,
    cGap,
    pColW,
    parentTracks,
    splitCenterX,
    nearestSplit,
    leftSpan,
    rightSpan,
    zone1,
    zone2,
    zone3,
    zone4,
    childTracksA,
    childTracksB,
    bottomItems,
    metrics: {
      refParentColW: Math.round(refParentColW),
      refColWA: Math.round(refColWA),
      refColWB: Math.round(refColWB),
      refBottomCardW: Math.round(refBottomCardW),
      gapRatio,
      passCount,
      splitDelta: +splitDelta.toFixed(2),
    },
    checks,
    diag,
    callouts,
  };
}

/**
 * 执行点击纠错标签或单步修复后的状态补丁
 */
export function applyFix(state, fixKey) {
  const s = normalizeState(state);
  const minS = minZoneCols(s.parentCols);
  if (fixKey === "snapSplit") {
    const target = clamp(Math.round(s.splitCol), minS, s.parentCols - minS);
    return { ...s, splitCol: target };
  }
  if (fixKey === "fixGap") {
    return { ...s, parentGap: 20, childGap: 10 };
  }
  if (fixKey === "fixDepth") {
    return { ...s, nestingDepth: 2 };
  }
  if (fixKey === "fixChildCols") {
    const targetA = s.parentCols === 16 ? 4 : s.splitCol >= 7 ? 3 : 2;
    const targetB = s.parentCols - s.splitCol >= 4 ? 2 : 1;
    return { ...s, childColsA: targetA, childColsB: targetB };
  }
  if (fixKey === "fixGroup") {
    const target = s.parentCols === 8 ? 4 : 4;
    return { ...s, bottomCards: target };
  }
  return s;
}
