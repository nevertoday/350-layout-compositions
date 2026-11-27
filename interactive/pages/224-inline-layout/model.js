// 224 行内布局 — 单真源数据、三套原海报场景、实测 DOM 评估与双向错态诊断

export const SCENES = {
  promo: {
    id: "promo",
    name: "文本信息行",
    en: "TEXT & PROMO BAR",
    posterHint: "对应原海报第 1 条示例：主标、促销词、折扣芯片、活动日期与行动按钮在同一基线上顺流展开。",
    items: [
      { id: "p-title", kind: "title", label: "新品上市", role: "primary", text: "新品上市", defaultAlign: "baseline", isBox: false },
      { id: "p-sep", kind: "sep", label: "竖线分隔", role: "muted", text: "|", defaultAlign: "baseline", isBox: false },
      { id: "p-accent", kind: "accent", label: "限时优惠", role: "accent", text: "限时优惠", defaultAlign: "baseline", isBox: false },
      { id: "p-chip", kind: "chip", label: "低至 7 折芯片", role: "chip-green", text: "低至 7 折", defaultAlign: "middle", isBox: true },
      { id: "p-time", kind: "meta", label: "活动时间", role: "secondary", text: "活动时间：05.01 – 05.31", defaultAlign: "baseline", isBox: false },
      { id: "p-btn", kind: "btn", label: "立即购买按钮", role: "action-dark", text: "立即购买", defaultAlign: "middle", isBox: true },
      { id: "p-arrow", kind: "icon", label: "右行箭头", role: "accent-icon", icon: "arrow", defaultAlign: "middle", isBox: true },
    ],
    broken: {
      widthPct: 96,
      gapPx: 0,
      hierarchyOn: false,
      selectedId: "p-chip",
      overrides: {
        "p-accent": { display: "inline", valign: "bottom", heightScale: 1 },
        "p-chip": { display: "block", valign: "top", heightScale: 1.8 },
        "p-btn": { display: "inline-flex", valign: "top", heightScale: 1 },
      },
    },
  },
  meta: {
    id: "meta",
    name: "元数据行",
    en: "ARTICLE METADATA",
    posterHint: "对应原海报第 2 条示例：作者剪影图标、发布日期、阅读时长、分类芯片与书签组成轻盈元数据流。",
    items: [
      { id: "m-author", kind: "icon-text", label: "作者徽标", role: "primary", icon: "person", text: "设计师", defaultAlign: "middle", isBox: true },
      { id: "m-dot1", kind: "sep", label: "圆点分隔", role: "muted", text: "•", defaultAlign: "middle", isBox: false },
      { id: "m-date", kind: "meta", label: "发布日期", role: "secondary", text: "2024.05.18", defaultAlign: "baseline", isBox: false },
      { id: "m-read", kind: "icon-text", label: "阅读时长", role: "secondary", icon: "clock", text: "阅读 3 分钟", defaultAlign: "middle", isBox: true },
      { id: "m-dot2", kind: "sep", label: "圆点分隔", role: "muted", text: "•", defaultAlign: "middle", isBox: false },
      { id: "m-chip", kind: "chip", label: "教程芯片", role: "chip-soft", text: "教程", defaultAlign: "middle", isBox: true },
      { id: "m-tag", kind: "accent", label: "#排版标签", role: "accent", text: "#排版", defaultAlign: "baseline", isBox: false },
      { id: "m-bm", kind: "icon", label: "书签图标", role: "muted-icon", icon: "bookmark", defaultAlign: "middle", isBox: true },
    ],
    broken: {
      widthPct: 96,
      gapPx: 0,
      hierarchyOn: false,
      selectedId: "m-chip",
      overrides: {
        "m-author": { display: "inline-flex", valign: "top", heightScale: 1 },
        "m-chip": { display: "block", valign: "top", heightScale: 1.8 },
        "m-bm": { display: "inline-flex", valign: "bottom", heightScale: 1 },
      },
    },
  },
  status: {
    id: "status",
    name: "状态与操作行",
    en: "STATUS & ACTIONS",
    posterHint: "对应原海报第 3 条示例：保存状态、草稿标签、叠圆协作者头像与分享发布操作并置一行。",
    items: [
      { id: "s-saved", kind: "icon-text", label: "已保存状态", role: "primary", icon: "check", text: "已保存", defaultAlign: "middle", isBox: true },
      { id: "s-dot1", kind: "sep", label: "圆点分隔", role: "muted", text: "•", defaultAlign: "middle", isBox: false },
      { id: "s-draft", kind: "chip", label: "草稿胶囊", role: "chip-outline", text: "草稿", defaultAlign: "middle", isBox: true },
      { id: "s-collab", kind: "avatars", label: "协作者组", role: "secondary", text: "协作者：", extra: "+2", defaultAlign: "middle", isBox: true },
      { id: "s-dot2", kind: "sep", label: "圆点分隔", role: "muted", text: "•", defaultAlign: "middle", isBox: false },
      { id: "s-share", kind: "icon-text", label: "分享操作", role: "secondary", icon: "share", text: "分享", defaultAlign: "middle", isBox: true },
      { id: "s-pub", kind: "btn", label: "发布按钮", role: "action-orange", text: "发布", defaultAlign: "middle", isBox: true },
    ],
    broken: {
      widthPct: 96,
      gapPx: 0,
      hierarchyOn: false,
      selectedId: "s-draft",
      overrides: {
        "s-draft": { display: "block", valign: "top", heightScale: 1.8 },
        "s-collab": { display: "inline-flex", valign: "bottom", heightScale: 1 },
        "s-pub": { display: "inline-flex", valign: "top", heightScale: 1 },
      },
    },
  },
};

export function createSceneState(sceneId, mode = "broken") {
  const sc = SCENES[sceneId] || SCENES.promo;
  const itemStates = {};
  for (const item of sc.items) {
    itemStates[item.id] = {
      display: item.isBox ? "inline-flex" : "inline",
      valign: item.defaultAlign,
      heightScale: 1,
    };
  }
  if (mode === "broken") {
    for (const [id, ov] of Object.entries(sc.broken.overrides)) {
      if (itemStates[id]) Object.assign(itemStates[id], ov);
    }
    return {
      sceneId: sc.id,
      widthPct: sc.broken.widthPct,
      gapPx: sc.broken.gapPx,
      hierarchyOn: sc.broken.hierarchyOn,
      xrayOn: true,
      selectedId: sc.broken.selectedId,
      items: itemStates,
    };
  }
  if (mode === "compact") {
    for (const item of sc.items) {
      if (item.isBox) itemStates[item.id].heightScale = 0.85;
      itemStates[item.id].valign = item.isBox ? "middle" : "baseline";
    }
    return {
      sceneId: sc.id,
      widthPct: 86,
      gapPx: 7,
      hierarchyOn: true,
      xrayOn: true,
      selectedId: sc.broken.selectedId,
      items: itemStates,
    };
  }
  if (mode === "airy") {
    return {
      sceneId: sc.id,
      widthPct: 100,
      gapPx: 14,
      hierarchyOn: true,
      xrayOn: true,
      selectedId: sc.broken.selectedId,
      items: itemStates,
    };
  }
  // standard: 原海报标准流
  return {
    sceneId: sc.id,
    widthPct: 96,
    gapPx: 10,
    hierarchyOn: true,
    xrayOn: true,
    selectedId: sc.broken.selectedId,
    items: itemStates,
  };
}

export function applyTrap(state, trapId) {
  const sc = SCENES[state.sceneId];
  const next = createSceneState(state.sceneId, "standard");
  next.xrayOn = state.xrayOn;
  next.selectedId = state.selectedId;
  const boxItems = sc.items.filter((i) => i.isBox);
  if (trapId === "block") {
    return { ...createSceneState(state.sceneId, "broken"), xrayOn: state.xrayOn };
  }
  if (trapId === "drift") {
    // 心电图式基线乱跳
    sc.items.forEach((it, idx) => {
      next.items[it.id].valign = idx % 3 === 0 ? "top" : idx % 3 === 1 ? "bottom" : "baseline";
    });
    if (boxItems[0]) next.items[boxItems[0].id].heightScale = 1.4;
    next.selectedId = boxItems[0]?.id || sc.items[0].id;
    return next;
  }
  if (trapId === "scatter") {
    next.gapPx = 26;
    next.widthPct = 74;
    return next;
  }
  if (trapId === "spike") {
    for (const b of boxItems.slice(0, 2)) {
      next.items[b.id].heightScale = 1.8;
    }
    next.selectedId = boxItems[0]?.id || sc.items[0].id;
    return next;
  }
  return next;
}

// 从真实 DOM 测量结果计算所有评估与诊断（单真源）
export function evaluateInlineFlow(state, measured) {
  const sc = SCENES[state.sceneId];
  const mItems = measured?.items || [];
  const rows = measured?.rows || [];
  const baseFontPx = measured?.baseFontPx || 16;
  const isNarrow = (measured?.stageWidth || 800) < 520;

  // 1. 统计 block 断流与行内陷阱
  const blockItems = sc.items.filter((it) => state.items[it.id]?.display === "block");
  const inlineBoxTraps = sc.items.filter(
    (it) => it.isBox && state.items[it.id]?.display === "inline" && state.items[it.id]?.heightScale > 1.2
  );

  // 2. 从实绘 DOM 几何计算最大高度差与行内垂直偏差
  let maxItemH = baseFontPx;
  let maxHeightItem = null;
  for (const m of mItems) {
    if (m.h > maxItemH) {
      maxItemH = m.h;
      maxHeightItem = m;
    }
  }
  const heightRatio = +(maxItemH / Math.max(12, baseFontPx)).toFixed(2);

  // 每一行内部：以文本项的视觉中轴（或该行中位数 cy）为参照，计算每个非分隔项的垂直跳动偏差
  let maxDriftPx = 0;
  let driftItem = null;
  let totalJumpPx = 0;
  for (let i = 1; i < mItems.length; i++) {
    totalJumpPx += Math.abs(mItems[i].cy - mItems[i - 1].cy);
  }
  const avgJumpPx = mItems.length > 1 ? +(totalJumpPx / (mItems.length - 1)).toFixed(1) : 0;

  for (const row of rows) {
    const rowItems = mItems.filter((m) => m.rowIdx === row.idx && m.kind !== "sep");
    if (rowItems.length < 2) continue;
    // 找该行里以正常文字为锚的视觉中轴
    const textAnchors = rowItems.filter((m) => m.kind === "title" || m.kind === "meta" || m.kind === "accent");
    const refCy = textAnchors.length
      ? textAnchors.reduce((s, a) => s + a.cy, 0) / textAnchors.length
      : rowItems.reduce((s, a) => s + a.cy, 0) / rowItems.length;
    for (const m of rowItems) {
      // 显式设了 top / bottom 或实测垂直偏移超过阈值
      const rawDrift = Math.abs(m.cy - refCy);
      // 文本默认 baseline 与小芯片 middle 的光学差约 0-3px 属正常；设 top/bottom 在高行盒里会被明显拉偏
      const st = state.items[m.id];
      const penalty = st && (st.valign === "top" || st.valign === "bottom") ? Math.max(rawDrift, 6.2) : rawDrift;
      if (penalty > maxDriftPx) {
        maxDriftPx = penalty;
        driftItem = m;
      }
    }
  }
  maxDriftPx = +maxDriftPx.toFixed(1);

  const rowCount = Math.max(1, rows.length);
  const allowedWrapRows = isNarrow ? 2 : 1;

  // 四项核查（全部来自真实状态与实绘坐标）
  const checkSameRow = blockItems.length === 0 && rowCount <= allowedWrapRows;
  const checkBaseline = maxDriftPx <= 4.8 && !sc.items.some((it) => {
    const v = state.items[it.id]?.valign;
    return v === "top" || v === "bottom";
  });
  const checkHeightAndGap = heightRatio <= 2.35 && !sc.items.some((it) => state.items[it.id]?.heightScale > 1.35) && state.gapPx >= 5 && state.gapPx <= 18 && inlineBoxTraps.length === 0;
  const checkContinuity = state.hierarchyOn && checkSameRow && checkBaseline;

  const score = [checkSameRow, checkBaseline, checkHeightAndGap, checkContinuity].filter(Boolean).length;

  // 双向错态优先判定（绝不只报一种错）
  let code = "OK";
  let badge = "4/4 · 基线稳流";
  let tier = "平顺连贯（示意）";
  let headline = "";
  let body = "";
  let action = "";

  const firstBlock = blockItems[0];
  const spikeItem = sc.items.find((it) => state.items[it.id]?.heightScale > 1.35);

  if (firstBlock) {
    code = "BLOCK_BREAK";
    badge = `${score}/4 · block 断流`;
    tier = "行流劈裂（示意）";
    headline = `「${firstBlock.label}」设成 display: block，硬把一行劈成 ${rowCount} 段`;
    body = `行内格式化上下文一旦混进块级盒，前后内容会被拆进匿名块并强制换行。眼动被迫纵向折返 ${Math.max(1, rowCount - 1)} 次，扫读速度立刻跌回海报右下角的「非行内布局」反例。`;
    action = `点选流道里的「${firstBlock.label}」，把 display 改回 inline-flex（或点下方「一键校准原海报流」）。`;
  } else if (rowCount > allowedWrapRows) {
    code = "WRAP_FRAGMENTS";
    badge = `${score}/4 · 窄道碎折 ${rowCount} 行`;
    tier = "折行过碎（示意）";
    headline = `当前流道宽 ${state.widthPct}% 且项间留白 ${state.gapPx}px，内容被迫碎折成 ${rowCount} 行`;
    body = `虽然每个元素都还在行内流里，但可用宽度吃紧或间距太宽，把本应一口气扫完的信息条拆成了 ${rowCount} 条行盒，连续浏览效率明显下降。`;
    action = state.gapPx > 18
      ? `把「项间节奏」从 ${state.gapPx}px 收回 8–14px，或向右拖拉朱橙箭柄放宽行道。`
      : `向右拖拉朱橙箭宽手柄把行宽拉回 85%–100%（窄屏下也可收紧间距到 6–10px）。`;
  } else if (spikeItem) {
    code = "HEIGHT_SPIKE";
    badge = `${score}/4 · 高差 ${heightRatio}× 撑爆`;
    tier = "行盒膨裂（示意）";
    headline = `「${spikeItem.label}」高达 ${Math.round(maxItemH)}px（字号 ${heightRatio}×），整条行盒被它撑裂`;
    body = `CSS 行盒的高度由行内最高顶沿与最低底沿决定。单枚超高芯片把整条基线带上下撑宽，相邻小字显得悬空孤立，这正是海报小贴士首条警告的「高度差异引发视觉跳动」。`;
    action = `点选「${spikeItem.label}」，把高度切回「正常 1×」或「紧凑 0.85×」。`;
  } else if (!checkBaseline) {
    code = "BASELINE_DRIFT";
    badge = `${score}/4 · 基线偏 ±${maxDriftPx}px`;
    tier = "起伏跳读（示意）";
    const badAlignItem = sc.items.find((it) => {
      const v = state.items[it.id]?.valign;
      return v === "top" || v === "bottom";
    }) || driftItem;
    const badVal = badAlignItem ? state.items[badAlignItem.id]?.valign : "top";
    headline = `「${badAlignItem?.label || "行内元素"}」用了 vertical-align: ${badVal}，偏离基线 ±${maxDriftPx}px`;
    body = `纯文字靠基线相连，芯片与图标则需贴合文本视中。一旦把个别元素挂到行盒顶沿或压到底沿，视线横向滑过时就会上下颠簸，破坏一条线的整体感。`;
    action = `点选「${badAlignItem?.label || "标红元素"}」，把 vertical-align 改为 ${badAlignItem?.defaultAlign || "middle"}。`;
  } else if (state.gapPx < 5) {
    code = "GAP_CRAMPED";
    badge = `${score}/4 · 间距 ${state.gapPx}px 粘连`;
    tier = "拥挤粘连（示意）";
    headline = `项间留白仅 ${state.gapPx}px，不同词组与芯片粘成一长条`;
    body = `元素落齐基线之后，还得靠稳定的水平空隙切分语义单元。间距压到 4px 以下时，文字与胶囊边框挤在一起，眼睛分不清哪里结束、哪里开始。`;
    action = `向右推「项间节奏」滑轨到 6–16px，给行内元素留出呼吸空隙。`;
  } else if (state.gapPx > 18) {
    code = "GAP_SCATTERED";
    badge = `${score}/4 · 间距 ${state.gapPx}px 散架`;
    tier = "松散断气（示意）";
    headline = `项间留白拉到 ${state.gapPx}px，整行散成彼此孤立的碎块`;
    body = `格式塔邻近原则在行内同样有效：间距大过一倍字宽后，原本相关的元数据和标签不再像同一句话，视线跨过空档时容易掉链子。`;
    action = `把「项间节奏」收回 6–16px 区间，重新聚拢同一行的连续节奏。`;
  } else if (!state.hierarchyOn) {
    code = "HIERARCHY_FLAT";
    badge = `${score}/4 · 主次压平`;
    tier = "平权乏味（示意）";
    headline = `大家排齐了，但字重与色阶全平，一眼抓不到重点`;
    body = `海报小贴士第 3 条提醒：行内也要区分主次。主标题、辅助时间和行动按钮如果用同一种粗细和明度，读者只能从头到尾逐字扫描，效率大打折扣。`;
    action = `打开「主次权重」开关，拉出主信息、柔和辅助信息与彩色芯片的三级层次。`;
  } else {
    // 4/4 通过，识别多组合法解
    const isCompact = state.gapPx <= 8;
    const isAiry = state.gapPx >= 13;
    const styleName = isCompact ? "紧凑工具栏解" : isAiry ? "舒朗呼吸流解" : "原海报标准流解";
    badge = `4/4 · ${styleName}`;
    tier = "平顺连贯（示意）";
    headline = `${styleName}成立：${rowCount} 条行盒、基线偏差 ±${maxDriftPx}px、高差 ${heightRatio}×`;
    body = `所有元素共乘同一条水平基线，项间 ${state.gapPx}px 留白恰好隔出词组却不断气，主次权重一眼分辨。按 Space 放飞眼动光束，可以看到视线笔直扫过全行。`;
    action = `还可以向左拖拉朱橙箭柄测试容器收窄时的真实折行，或切换「元数据行」「状态与操作行」继续校准。`;
  }

  // 三枚原海报核心要点实况探针
  const probes = {
    inline: {
      ok: checkSameRow,
      tag: firstBlock ? `被 block 劈成 ${rowCount} 段` : rowCount > allowedWrapRows ? `折成 ${rowCount} 行` : rowCount === 1 ? "单行连续" : `${rowCount} 行轻折`,
    },
    baseline: {
      ok: checkBaseline,
      tag: checkBaseline ? `偏差 ±${maxDriftPx}px` : `跳动 ±${maxDriftPx}px`,
    },
    flow: {
      ok: checkHeightAndGap && checkContinuity,
      tag: !checkHeightAndGap
        ? (spikeItem ? `高差 ${heightRatio}×` : state.gapPx < 5 ? `粘连 ${state.gapPx}px` : `散架 ${state.gapPx}px`)
        : !state.hierarchyOn
          ? "主次压平"
          : `间距 ${state.gapPx}px · 顺流`,
    },
  };

  return {
    code,
    score,
    ok: score === 4,
    badge,
    tier,
    headline,
    body,
    action,
    rowCount,
    maxDriftPx,
    avgJumpPx,
    heightRatio,
    maxItemH: Math.round(maxItemH),
    blockCount: blockItems.length,
    probes,
    // 供右上奶白圆盘五符号同步（0 = 稳落虚线，1 = 剧烈错落）
    discChaos: score === 4 ? 0 : Math.min(1, (4 - score) * 0.28 + (firstBlock ? 0.25 : 0)),
  };
}

// 01 节：原海报 10 枚基线标本数据（1:1 复刻原海报「基线示意」）
export const BASELINE_SPECIMENS = [
  {
    id: "sp-zh1",
    kind: "cjk-lg",
    text: "视觉",
    posterNote: "汉字底部对齐基线",
    truth: "汉字没有拉丁下伸部（descender），字身方框底沿通常比拉丁字母基线略低约 10%–12%（ideographic baseline）。浏览器混排时，默认把汉字框的字面底抬高贴近拉丁基线，视觉上才不会下坠。",
    metric: "汉字方块 · 意符基线略低于字母基线",
    valignCss: "vertical-align: baseline",
  },
  {
    id: "sp-chip1",
    kind: "pill-orange",
    text: "对齐",
    posterNote: "芯片文字居中对齐基线",
    truth: "胶囊芯片本身是带边框和内边距的 inline-flex / inline-block 盒。若只用默认 baseline 且内部无文字或设了 overflow: hidden，它的底边会踩在基线上导致整个胶囊往上翘；正确做法是让芯片内文字基线与外部对齐，或用 middle 贴合文本视中。",
    metric: "inline-flex 芯片 · 需防外盒上翘",
    valignCss: "display: inline-flex; align-items: center",
  },
  {
    id: "sp-zh2",
    kind: "cjk-md",
    text: "文字",
    posterNote: "文字底部对齐基线",
    truth: "同一字号的中文正文连续排列时，视觉下沿整齐落在同一条水平线上，为整行建立最稳固的阅读锚点。",
    metric: "基准文本锚点 · 建立全行参照",
    valignCss: "vertical-align: baseline",
  },
  {
    id: "sp-icon",
    kind: "badge-green",
    text: "Icon",
    posterNote: "图标底部对齐基线",
    truth: "原海报写「图标底部对齐基线」——严格说来，SVG 或 <img> 属于替换元素，默认确实把盒底踩在基线上，但这样会比旁边带中轴的汉字略偏高，且在下方留出下伸部空隙。实际 UI 中常配 vertical-align: -0.15em 或 middle 做光学微调。",
    metric: "替换元素默认踩基线 · 实战常微下沉",
    valignCss: "vertical-align: -0.15em",
  },
  {
    id: "sp-heart",
    kind: "svg-heart",
    text: "♡",
    posterNote: "图形底缘或视中微调",
    truth: "尖底或圆底的线框图标（心形、定位针）视觉重心偏上，如果死守底边对齐基线，看起来会比两侧数字浮高一截，往下降 1–2px 才算光学齐平。",
    metric: "尖底矢量图形 · 需光学下沉 1–2px",
    valignCss: "vertical-align: middle",
  },
  {
    id: "sp-num",
    kind: "num",
    text: "123",
    posterNote: "数字底部对齐基线",
    truth: "等高数字（lining figures）脚底严丝合缝站在拉丁字母基线上，顶沿对齐大写字高（cap-height），与右侧 ABC 天然共享同一轨道。",
    metric: "等高数字 · 精准落于字母基线",
    valignCss: "font-variant-numeric: tabular-nums",
  },
  {
    id: "sp-dot",
    kind: "dot-orange",
    text: "●",
    posterNote: "标点居中对齐基线",
    truth: "分隔圆点不是落在基线上，而是悬浮在小写字母 x-height 的中轴高度，负责在两段信息间轻声停顿、不抢视觉重心。",
    metric: "分隔符圆点 · 居中于 x-height 中线",
    valignCss: "vertical-align: middle",
  },
  {
    id: "sp-abc",
    kind: "latin",
    text: "ABC",
    posterNote: "拉丁字母标准基线",
    truth: "CSS 的 alphabetic baseline 原本就诞生于拉丁活字：A、B、C、x 坐在基线上，g、p、y 的尾巴垂到基线下方。理解这一点，就能明白为何纯图标默认下方会留出那条「神秘白边」。",
    metric: "拉丁字母基线 · CSS 默认坐标系原点",
    valignCss: "dominant-baseline: alphabetic",
  },
  {
    id: "sp-pill2",
    kind: "pill-outline",
    text: "标签",
    posterNote: "芯片文字居中对齐基线",
    truth: "描边型标签的上下边框会放大视觉边界，因此芯片总高度应控制在基准字号的 1.4×–1.7× 之间，避免打破行盒节奏。",
    metric: "线框胶囊 · 高差宜控在 1.4×–1.7×",
    valignCss: "height: 1.65em; vertical-align: middle",
  },
  {
    id: "sp-star",
    kind: "svg-star",
    text: "★",
    posterNote: "图形底部对齐基线",
    truth: "实心星形面积视觉重量大，和等高的细线文字并排时应稍收小 8%–10% 并对齐文字中轴，才能达到视觉重心平稳。",
    metric: "实心几何图形 · 光学缩尺 + 中轴对齐",
    valignCss: "vertical-align: -0.12em",
  },
];

// 06 节：单变量实战练习（标签仅写中性 CSS 参数，零剧透）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    title: "方案 A",
    spec: "inline-block · 全员 baseline · 分类芯片高 42px",
    correct: false,
    reason: "分类芯片高达 42px（接近正文字号的 3 倍），把整条行盒剧烈撑高；同时图标与芯片用 baseline 对齐，底部踩在文字基线上导致整排高低错落、眼睛上下跳动。",
  },
  {
    id: "B",
    title: "方案 B",
    spec: "文字 baseline · 图标与 24px 芯片对齐视中 · 项间 10px",
    correct: true,
    reason: "正确答案。所有元素保持在同一条连续行内流里；芯片高 24px 压住了高度差，图标与胶囊对齐文本视中，项间 10px 留白既切分语义又不断气，一线扫读最快。",
  },
  {
    id: "C",
    title: "方案 C",
    spec: "作者 / 日期 / 分类芯片 / 收藏均设 display: block",
    correct: false,
    reason: "把短元数据全切成 block 等于放弃行内布局，本来一行能扫完的 5 个短字段被拉成 5 行竖梯，浪费纵向空间，眼睛被迫频繁折行回扫。",
  },
  {
    id: "D",
    title: "方案 D",
    spec: "inline-block · 全员 vertical-align: top · 项间 0px",
    correct: false,
    reason: "虽然挤在同一行，但 top 对齐让字号较小的日期、芯片和按钮全部悬吊在顶线、脚下参差不齐，且 0px 间距让相邻词组粘成一团，分不清信息边界。",
  },
];
