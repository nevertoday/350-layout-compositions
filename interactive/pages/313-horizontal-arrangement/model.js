// 313 横向调度 · 单一几何与诊断真源
// 所有节点均存储 0..1 相对坐标（x: 横向位置，y: 纵向位置，0.50 为共享地平轴），
// 宽银幕画布、顶部三栏要点灯眉、眼睛竖框实况诊单与底部读数全部只读此模块算出的结果。

export const HORIZON_Y = 0.50;
export const HORIZON_SNAP = 0.036;

export const ASPECTS = {
  "2.39": { id: "2.39", label: "2.39:1 宽银幕", short: "2.39:1", ratio: 2.39, visibleMin: 0.0, visibleMax: 1.0 },
  "1.78": { id: "1.78", label: "16:9 标准宽幅", short: "16:9", ratio: 16 / 9, visibleMin: 0.11, visibleMax: 0.89 },
  "1.33": { id: "1.33", label: "4:3 窄幅画框", short: "4:3", ratio: 4 / 3, visibleMin: 0.22, visibleMax: 0.78 },
};

export const NODE_META = [
  { id: "gold", index: 0, badge: "01", cinemaName: "① 起程者", posterName: "金圆锚点", colorKey: "gold", mass: 1.15, widthFactor: 1.08 },
  { id: "sand", index: 1, badge: "02", cinemaName: "② 驻足者", posterName: "暖沙体块", colorKey: "sand", mass: 0.92, widthFactor: 0.96 },
  { id: "steel", index: 2, badge: "03", cinemaName: "③ 同行者", posterName: "钢蓝体块", colorKey: "steelMid", mass: 1.04, widthFactor: 1.02 },
  { id: "ink", index: 3, badge: "04", cinemaName: "④ 守门人", posterName: "炭墨终块", colorKey: "charcoal", mass: 1.12, widthFactor: 1.05 },
];

// 开场故意停在 0/4 失序错态：缩挤中右 32%、朝向互撞、高低脱轴锯齿、前段粘连
export function createBrokenNodes() {
  return [
    { id: "gold",  x: 0.44,  y: 0.34, dir: -1 },
    { id: "sand",  x: 0.495, y: 0.65, dir: 1 },
    { id: "steel", x: 0.625, y: 0.36, dir: -1 },
    { id: "ink",   x: 0.76,  y: 0.62, dir: 1 },
  ];
}

// 经典反例：大卫·波德维尔讨论的「晾衣绳均分」——跨度、水平、朝向全对，唯独间距 1:1:1 死板均分
export function createClotheslineNodes() {
  return [
    { id: "gold",  x: 0.14, y: 0.50, dir: 1 },
    { id: "sand",  x: 0.38, y: 0.50, dir: 1 },
    { id: "steel", x: 0.62, y: 0.50, dir: 1 },
    { id: "ink",   x: 0.86, y: 0.50, dir: -1 },
  ];
}

export function createInitialState() {
  return {
    aspect: "2.39",
    skin: "cinema", // "cinema" | "poster"
    pan: 0,         // -1 .. +1 横向机位推轨位置
    selected: 0,    // 0..3
    nodes: createBrokenNodes(),
  };
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function applySnapY(y) {
  const cy = clamp(y, 0.24, 0.76);
  return Math.abs(cy - HORIZON_Y) < HORIZON_SNAP ? HORIZON_Y : cy;
}

export function moveNode(state, idx, nextX, nextY, snapY = true) {
  const n = state.nodes[idx];
  if (!n) return;
  n.x = clamp(nextX, 0.06, 0.94);
  if (typeof nextY === "number") {
    n.y = snapY ? applySnapY(nextY) : clamp(nextY, 0.24, 0.76);
  }
}

export function flipNodeDir(state, idx) {
  const n = state.nodes[idx];
  if (!n) return;
  n.dir = n.dir > 0 ? -1 : 1;
}

export function alignAllToHorizon(state) {
  for (const n of state.nodes) n.y = HORIZON_Y;
}

const pct = (v) => `${Math.round(v * 100)}%`;

// 核心实测函数：从同一组 nodes + aspect 实时算出全部诊断与读数
export function evaluate(state) {
  const asp = ASPECTS[state.aspect] || ASPECTS["2.39"];
  const items = state.nodes.map((n, i) => ({
    ...n,
    index: i,
    meta: NODE_META[i],
  }));
  const sorted = [...items].sort((a, b) => a.x - b.x);

  const leftX = sorted[0].x;
  const rightX = sorted[3].x;
  const span = rightX - leftX;
  const leftMargin = leftX - asp.visibleMin;
  const rightMargin = asp.visibleMax - rightX;
  const visibleSpan = asp.visibleMax - asp.visibleMin;
  const spanInFrame = span / visibleSpan;

  // 被窄框裁切的节点
  const clippedIds = sorted
    .filter((n) => n.x < asp.visibleMin + 0.025 || n.x > asp.visibleMax - 0.025)
    .map((n) => n.meta.badge);

  // 1) 横向展开（HORIZON / EXPANSION）
  let expOk = false;
  let expCode = "ok";
  let expBadge = `展幅 ${pct(span)}`;
  let expShort = "开阔舒展";
  let expDetail = `4 组主体沿水平轴展开 ${pct(span)}，左右各留出呼吸余地，宽银幕格局已经撑开。`;

  if (asp.id === "1.33") {
    expCode = "narrow-frame";
    expBadge = clippedIds.length ? `4:3 裁掉 ${clippedIds.length} 位` : "4:3 窄幅受限";
    expShort = "窄框截断";
    expDetail = clippedIds.length
      ? `切到 4:3 窄框后，两侧黑幕直接吃掉了 ${clippedIds.join("、")} 号主体。横向调度需要宽幅画框托底，切回 16:9 或 2.39:1 才能展开。`
      : "4:3 画幅左右过窄，四个主体被关在方盒里很难拉出水平延展感。切回 16:9 或 2.39:1 宽银幕试试。";
  } else if (clippedIds.length) {
    expCode = "clipped";
    expBadge = `出画 ${clippedIds.length} 位`;
    expShort = "滑出画框";
    expDetail = `${clippedIds.join("、")} 号主体已越过当前 ${asp.short} 可见边界，请把外侧主体往回拖进安全区或切回 2.39:1。`;
  } else if (leftMargin < 0.06 || rightMargin < 0.06) {
    expCode = "edge";
    expBadge = "贴死边缘";
    expShort = "边缘紧贴";
    expDetail = "外侧主体离画框太近（余地不足 6%），边缘压力会让画面显得局促，往里稍微收一点留出边白。";
  } else if (span < 0.56) {
    expCode = "cramped";
    expBadge = `仅展 ${pct(span)}`;
    expShort = "缩挤偏窄";
    expDetail = `当前水平跨度只有 ${pct(span)}（经验舒适带 56%–85%），宽银幕两侧空成死区。把最左和最右两组往两端拉开。`;
  } else if (span > 0.86) {
    expCode = "overstretch";
    expBadge = `过宽 ${pct(span)}`;
    expShort = "撑满压边";
    expDetail = `水平跨度拉到 ${pct(span)}，几乎顶到左右框线，稍微往内收 4%–8% 会更从容。`;
  } else {
    expOk = true;
    expBadge = `展幅 ${pct(span)}`;
    expShort = "开阔舒展";
  }

  // 2) 视线引导（FLOW / SIGHTLINE）
  const dirs = sorted.map((n) => n.dir);
  const rightCount = dirs.filter((d) => d > 0).length;
  const leftCount = 4 - rightCount;
  const clashes = [];
  for (let i = 0; i < 3; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    // 迎面顶撞（右 vs 左）仅当不是最末位回望收口时算对撞；背对撕裂（左 vs 右）始终算断流
    if (a.dir < 0 && b.dir > 0) {
      clashes.push({ type: "split", a, b, midX: (a.x + b.x) / 2 });
    } else if (a.dir > 0 && b.dir < 0 && i < 2) {
      clashes.push({ type: "collide", a, b, midX: (a.x + b.x) / 2 });
    }
  }

  const forwardStream = dirs[0] === 1 && dirs[1] === 1 && dirs[2] === 1;
  const reverseStream = dirs[3] === -1 && dirs[2] === -1 && dirs[1] === -1;
  const rightBookend = forwardStream && dirs[3] === -1;
  const rightLeadOk = forwardStream && dirs[3] === 1 && rightMargin >= 0.14;
  const leftBookend = reverseStream && dirs[0] === 1;
  const leftLeadOk = reverseStream && dirs[0] === -1 && leftMargin >= 0.14;

  let flowOk = false;
  let flowCode = "clash";
  let flowDir = "mixed"; // "ltr" | "rtl" | "mixed"
  let flowBadge = "视流对撞";
  let flowShort = "视线打架";
  let flowDetail = "";

  if (rightBookend) {
    flowOk = true;
    flowCode = "ltr-bookend";
    flowDir = "ltr";
    flowBadge = "右流 · 回望收口";
    flowShort = "连贯右流";
    flowDetail = "前三组一致朝右推演，最右侧守门人微向左回望兜住视线——经典宽银幕「左入右流、末位收口」写法。";
  } else if (rightLeadOk) {
    flowOk = true;
    flowCode = "ltr-open";
    flowDir = "ltr";
    flowBadge = "右流 · 前导留白";
    flowShort = "开阔右流";
    flowDetail = `四组一致朝右流动，且最右侧前方留出 ${pct(rightMargin)} 前导空间，视线有去处、像在向画外延续。`;
  } else if (leftBookend) {
    flowOk = true;
    flowCode = "rtl-bookend";
    flowDir = "rtl";
    flowBadge = "左流 · 手卷回望";
    flowShort = "手卷左流";
    flowDetail = "你排出了东方手卷式的自右向左连续视流，最左端再以向右回望把视线稳稳兜回画框内。";
  } else if (leftLeadOk) {
    flowOk = true;
    flowCode = "rtl-open";
    flowDir = "rtl";
    flowBadge = "左流 · 逆向延续";
    flowShort = "连贯左流";
    flowDetail = `四组一致自右向左推进，左端留足 ${pct(leftMargin)} 前导空位，形成冷静克制的逆向回溯感。`;
  } else if (forwardStream && dirs[3] === 1 && rightMargin < 0.14) {
    flowCode = "leak-right";
    flowDir = "ltr";
    flowBadge = "末位漏出右框";
    flowShort = "右缘漏气";
    flowDetail = `前三组已顺利向右引流，但最右位紧贴右框（前导仅 ${pct(rightMargin)}）还朝右死盯画外，视线直接溜出去了。点最右位翻转回望，或左移留空。`;
  } else if (reverseStream && dirs[0] === -1 && leftMargin < 0.14) {
    flowCode = "leak-left";
    flowDir = "rtl";
    flowBadge = "左端漏出画外";
    flowShort = "左缘漏气";
    flowDetail = `整排朝左流向，但最左位离左缘仅 ${pct(leftMargin)}，点它翻转向右兜住视线，或往右留出前导空位。`;
  } else {
    const c0 = clashes[0];
    flowCode = c0 ? c0.type : "clash";
    flowBadge = clashes.length ? `${clashes.length} 处断流` : "方向散乱";
    flowShort = "方向互撞";
    if (c0 && c0.type === "split") {
      flowDetail = `${c0.a.meta.badge} 朝左、${c0.b.meta.badge} 朝右，两人背对背把视线往两头撕开。点一下背向角色把朝向理顺为统一主方向。`;
    } else if (c0 && c0.type === "collide") {
      flowDetail = `${c0.a.meta.badge} 朝右而 ${c0.b.meta.badge} 朝左，视线在中段迎面刹停。点中段反向人物翻转朝向，让前三位顺成同一方向。`;
    } else {
      flowDetail = `当前 ${rightCount} 位朝右、${leftCount} 位朝左，没有形成明确主方向。点击画面里的角色可原地翻转朝向。`;
    }
  }

  // 3) 水平稳态与平衡（BALANCE / HORIZON AXIS）
  const ys = items.map((n) => n.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpread = yMax - yMin;
  const yMean = ys.reduce((s, v) => s + v, 0) / ys.length;
  const yCenterErr = Math.abs(yMean - HORIZON_Y);

  const totalMass = items.reduce((s, n) => s + n.meta.mass, 0);
  const centerX = items.reduce((s, n) => s + n.x * n.meta.mass, 0) / totalMass;
  const balanceOffset = centerX - 0.50; // 负偏左，正偏右

  let stabOk = false;
  let stabCode = "ok";
  let stabBadge = `落差 ${pct(ySpread)}`;
  let stabShort = "地平稳固";
  let stabDetail = "四组主体稳落在同一水平基准带内，左右视觉重量也达成平衡，画面显出宽银幕特有的沉静与秩序。";

  if (ySpread > 0.12) {
    stabCode = "vertical-jump";
    stabBadge = `脱轴 ${pct(ySpread)}`;
    stabShort = "高低锯齿";
    stabDetail = `主体高低落差达到 ${pct(ySpread)}（经验稳态 ≤ 12%），视线被迫上下跳动，水平基座被拆散了。上下拖动偏离虚线的主体压回地平带。`;
  } else if (yCenterErr > 0.13) {
    stabCode = "axis-drift";
    stabBadge = yMean < HORIZON_Y ? "整排上飘" : "整排下坠";
    stabShort = yMean < HORIZON_Y ? "地平偏高" : "地平偏低";
    stabDetail = `整排主体偏离中央地平轴 ${pct(yCenterErr)}，上下空间比例失调，把整排往中段地平带微调回来。`;
  } else if (Math.abs(balanceOffset) > 0.115) {
    stabCode = "off-balance";
    const side = balanceOffset < 0 ? "左" : "右";
    stabBadge = `重心偏${side} ${pct(Math.abs(balanceOffset))}`;
    stabShort = `重心偏${side}`;
    stabDetail = `视觉重量向${side}侧倾偏 ${pct(Math.abs(balanceOffset))}，整条水平轴像翘起的扁担，往另一侧挪动一两组体块把重心兜平。`;
  } else {
    stabOk = true;
    stabBadge = `落差 ${pct(ySpread)} · 偏 ${pct(Math.abs(balanceOffset))}`;
    stabShort = "地平稳固";
  }

  // 4) 宽幅节奏（BROAD RHYTHM / CONTINUITY）
  const gaps = [
    sorted[1].x - sorted[0].x,
    sorted[2].x - sorted[1].x,
    sorted[3].x - sorted[2].x,
  ];
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const meanGap = (gaps[0] + gaps[1] + gaps[2]) / 3;
  const variance = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / 3;
  const cv = meanGap > 0.001 ? Math.sqrt(variance) / meanGap : 0;

  let rhyOk = false;
  let rhyCode = "ok";
  let rhyBadge = `疏密比 ${(maxGap / Math.max(0.01, minGap)).toFixed(1)}×`;
  let rhyShort = "呼吸有度";
  let rhyDetail = `三段水平间距为 ${gaps.map(pct).join(" / ")}，既有成组呼应又有宽幅留白，视线扫过时自然产生轻重缓急。`;

  if (minGap < 0.095) {
    rhyCode = "crowded";
    const pairIdx = gaps.indexOf(minGap);
    rhyBadge = `粘连 ${pct(minGap)}`;
    rhyShort = "局部粘连";
    rhyDetail = `${sorted[pairIdx].meta.badge} 与 ${sorted[pairIdx + 1].meta.badge} 水平净距仅 ${pct(minGap)}，挤成一团分不出层次。把紧贴的两位稍微拉开。`;
  } else if (maxGap > 0.42) {
    rhyCode = "broken-chain";
    const pairIdx = gaps.indexOf(maxGap);
    rhyBadge = `断链 ${pct(maxGap)}`;
    rhyShort = "空沟断链";
    rhyDetail = `${sorted[pairIdx].meta.badge} 与 ${sorted[pairIdx + 1].meta.badge} 之间裂出 ${pct(maxGap)} 的大空沟，眼睛跨不过去、画面断成两截。`;
  } else if (cv < 0.14) {
    rhyCode = "clothesline";
    rhyBadge = "晾衣绳均分";
    rhyShort = "死板等距";
    rhyDetail = `踩中「晾衣绳均分陷阱」：三段间距几乎等分（${gaps.map(pct).join(" / ")}），像把衣服等距挂在绳上。把任意相邻两位拉近成对话组，立刻长出宽幅节奏！`;
  } else if (cv > 0.62) {
    rhyCode = "lopsided-rhythm";
    rhyBadge = `落差过激 ${(maxGap / minGap).toFixed(1)}×`;
    rhyShort = "疏密失衡";
    rhyDetail = `三段间距为 ${gaps.map(pct).join(" / ")}，疏密相差太悬殊，微调中间两组让宽窄过渡更自然。`;
  } else {
    rhyOk = true;
    rhyBadge = `疏密 ${(maxGap / minGap).toFixed(1)}×`;
    rhyShort = "呼吸有度";
  }

  const checks = {
    expansion: { ok: expOk, code: expCode, badge: expBadge, short: expShort, detail: expDetail },
    flow:      { ok: flowOk, code: flowCode, dir: flowDir, badge: flowBadge, short: flowShort, detail: flowDetail, clashes },
    stability: { ok: stabOk, code: stabCode, badge: stabBadge, short: stabShort, detail: stabDetail },
    rhythm:    { ok: rhyOk, code: rhyCode, badge: rhyBadge, short: rhyShort, detail: rhyDetail },
  };

  const score = [expOk, flowOk, stabOk, rhyOk].filter(Boolean).length;

  // 主诊断选择（按最直观的修正顺序优先提示）
  let primaryTag = "4/4 成立";
  let primaryTitle = "横向调度成立：宽幅、稳态与视流合一";
  let primaryBody = "四组主体踩稳共享地平线，借疏密分组撑开宽幅视野，顺畅地把眼睛从一端引到另一端。现在拖动底沿横向推轨，体验宽银幕长卷巡航。";
  let primaryTip = "也可点「海报色带」验证电影镜头与 313 原海报的几何同构，或切「4:3 窄框」体验窄画幅的局促。";
  let isError = false;

  if (score < 4) {
    isError = true;
    if (!expOk) {
      primaryTag = `待调 · ${expShort}`;
      primaryTitle = asp.id === "1.33" ? "4:3 窄框卡死了横向展开" : (expCode === "cramped" ? `四组主体挤在 ${pct(span)} 里，宽银幕白费了` : `横向跨度${expShort}`);
      primaryBody = expDetail;
      primaryTip = asp.id === "1.33" ? "先把画幅切回「2.39:1 宽银幕」或「16:9」。" : "在宽银幕里直接左右拖拉外侧主体，把展幅拉开到 56%–85%。";
    } else if (!stabOk) {
      primaryTag = `待调 · ${stabShort}`;
      primaryTitle = stabCode === "vertical-jump" ? `高低跳脱 ${pct(ySpread)}，地平基准线断了` : `水平重心${stabShort}`;
      primaryBody = stabDetail;
      primaryTip = stabCode === "vertical-jump" ? "上下拖动偏高或偏低的主体靠近中段水平虚线（会自动轻吸附）。" : "把过重一侧的主体往反方向微移一点，配平左右重量。";
    } else if (!flowOk) {
      primaryTag = `待调 · ${flowShort}`;
      primaryTitle = flowCode === "leak-right" || flowCode === "leak-left" ? "末尾主体直盯边框，视线漏出画外了" : "人物朝向互相顶撞，横向视线走不动";
      primaryBody = flowDetail;
      primaryTip = "直接点击画面里的角色，原地翻转它的朝向（← / →）。";
    } else if (!rhyOk) {
      primaryTag = rhyCode === "clothesline" ? "陷阱 · 晾衣绳均分" : `待调 · ${rhyShort}`;
      primaryTitle = rhyCode === "clothesline" ? "太齐整反成「晾衣绳」：1:1:1 等距呆板" : `水平间距${rhyShort}`;
      primaryBody = rhyDetail;
      primaryTip = rhyCode === "clothesline" ? "左右微挪其中一位，让两人靠近成组、另一侧留宽白，打破机械等分。" : "左右拉开粘连的两位，或拉近被孤立的远端主体。";
    }
  }

  return {
    aspect: asp,
    sorted,
    span,
    spanInFrame,
    leftMargin,
    rightMargin,
    clippedIds,
    gaps,
    minGap,
    maxGap,
    cv,
    ySpread,
    yMean,
    balanceOffset,
    centerX,
    checks,
    score,
    isError,
    primaryTag,
    primaryTitle,
    primaryBody,
    primaryTip,
  };
}
