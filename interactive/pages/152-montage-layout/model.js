// 152 蒙太奇版式 · 单真源几何与叙事诊断模型
// 所有画面绘制、叠合率、核心遮挡、面积跨比、明暗反差、焦点数与白话诊单均由此模块统一算出。

export const PALETTE = {
  paper: "#F2E1CB",
  paperLight: "#FAF3E8",
  paperMid: "#EFE0CA",
  paperWarm: "#DFC7AD",
  ink: "#121110",
  inkPure: "#0A0B0A",
  inkSoft: "#2C2724",
  maroon: "#551014",
  maroonText: "#6E151B",
  maroonBright: "#E86C70",
  amber: "#E28115",
  amberText: "#964E04",
  amberBright: "#F7A13B",
  tape: "#CD752A",
  ok: "#1B6B5C",
  okBright: "#66D9C2",
  err: "#B3261E",
  errBright: "#FF7D73",
};

export const TONE_LUM = {
  dark: 0.014,    // #121110
  maroon: 0.036,  // #551014
  paper: 0.775,   // #F2E1CB
};

export const TONE_LABELS = {
  dark: "暗房黑",
  maroon: "深酒红",
  paper: "暖宣纸",
};

export const SCALE_LABELS = {
  S: "特写小帧",
  M: "中景过渡",
  L: "全景主帧",
};

// 基准宽×高（归一化坐标，画幅约 4:3）
export const SCALE_DIMS = {
  S: { w: 0.255, h: 0.275 },
  M: { w: 0.345, h: 0.365 },
  L: { w: 0.465, h: 0.495 },
};

// 三套叙事剧本（每套 4 枚异质片段，对应起承转合四角色）
export const SCRIPTS = {
  poster: {
    id: "poster",
    name: "原海报·造境四帧",
    short: "原海报造境",
    lead: "承袭 152 原海报的暗夜双圆、点阵半圆、等高宣告与格网大 X 山峰四枚核心母题。",
    frames: [
      { id: "setup", role: "setup", name: "双圆潜流", motif: "circles", tag: "起 · 铺垫", hint: "暗夜双圆与细白弧线，定下空间基调" },
      { id: "cut", role: "cut", name: "半圆点阵", motif: "dots", tag: "承 · 秩序", hint: "切边黑半圆与规律点阵，建立几何参照" },
      { id: "bridge", role: "bridge", name: "等高宣言", motif: "contour", tag: "转 · 连接", hint: "等高线与撕边金句，把理性转向情绪" },
      { id: "climax", role: "climax", name: "格网山日", motif: "xpeak", tag: "合 · 引爆", hint: "方格山峰与焦糖橘笔触，锁住视觉高潮" },
    ],
    meanings: {
      ordered: "从「静默双圆」经「点阵秩序」与「等高张力」直撞「焦糖橘破局」——静与动、理与情在接缝处撞出新秩序。",
      reverse: "以「格网山日」强刺激开场，随即回溯「双圆潜流」与「点阵等高」拆解缘由——读出倒叙悬念感。",
      broken: "高潮帧提前泄气、铺垫帧反被挤在末端，四块碎片像四张互不相干的样卡，撞不出「1 + 1 = 3」的隐含关系。",
    },
  },
  city: {
    id: "city",
    name: "城市一瞬·库里肖夫",
    short: "城市一瞬",
    lead: "用无五官孤立背影、冷雨楼宇、失速时钟与破晓窗灯四枚镜头，体验顺序如何改写情绪。",
    frames: [
      { id: "setup", role: "setup", name: "静默背影", motif: "silhouette", tag: "起 · 主角", hint: "无五官门框背影，本身中性无喜怒" },
      { id: "cut", role: "cut", name: "暴雨楼宇", motif: "rain", tag: "承 · 压迫", hint: "密格高楼与斜雨，注入外界冷峻压力" },
      { id: "bridge", role: "bridge", name: "失速时钟", motif: "clock", tag: "转 · 紧迫", hint: "交叉指针与折线时间码，加速阅读心跳" },
      { id: "climax", role: "climax", name: "破晓窗光", motif: "window", tag: "合 · 转机", hint: "暗街屋脊间一扇暖窗，释放全部积压情绪" },
    ],
    meanings: {
      ordered: "「静默背影」接上「暴雨楼宇」与「失速时钟」，最后落进「一扇破晓暖窗」——读者脑中自动补出熬夜后的希望。",
      reverse: "先亮出「破晓暖窗」的暖意，再切回「静默背影」与「暴雨时钟」——同一组图立刻读出回忆与怅惘。",
      broken: "暖窗提前亮在开头，背影却孤零零留在最后，情绪起落互相抵消，只剩四个零散城市符号。",
    },
  },
  press: {
    id: "press",
    name: "复古刊页·时空对撞",
    short: "复古刊页",
    lead: "致敬 1920 年代构成主义出版跨页：古典拱门、工业齿轮、号外铅排与宣言楔形并置碰撞。",
    frames: [
      { id: "setup", role: "setup", name: "古典拱柱", motif: "arch", tag: "起 · 旧制", hint: "线描古典拱门，代表对称与旧时代秩序" },
      { id: "cut", role: "cut", name: "机械齿环", motif: "gear", tag: "承 · 工业", hint: "粗硬工业齿轮与网点，切入机械时代脉搏" },
      { id: "bridge", role: "bridge", name: "号外铅排", motif: "press", tag: "转 · 宣声", hint: "黑粗栏线与醒目引号，把图像拉入公共语境" },
      { id: "climax", role: "climax", name: "宣言楔形", motif: "wedge", tag: "合 · 革新", hint: "构成主义斜楔直刺画面，宣告新版式诞生" },
    ],
    meanings: {
      ordered: "「古典拱柱」迎面撞上「机械齿环」与「号外铅排」，最终被「焦糖橘斜楔」劈开——视觉直接讲出时代更替。",
      reverse: "「宣言楔形」先声夺人，再回看「古典拱柱」与「齿轮铅排」——像一张带有反思意味的展览回顾封面。",
      broken: "古拱、齿轮与斜楔次序错位，读者分不清是怀旧还是革新，历史冲突感被散乱排布稀释。",
    },
  },
};

// 开场 0/4 假蒙太奇错态（绝不是答案！）
// 1) splice = 0.0 -> 0% 零叠合，退化为死板四格平铺
// 2) 全 M 等大平权 -> 面积跨比 1.0x，无节奏起伏
// 3) 顺序 ['climax','bridge','cut','setup'] -> 高潮前置且铺垫落尾，叙事倒挂
// 4) 全暖宣纸缺深暗压阵 + 两枚焦糖橘同时乱闪 -> 对比发闷且双焦抢戏
export function createBrokenState(scriptId = "poster") {
  const s = SCRIPTS[scriptId] || SCRIPTS.poster;
  const byId = Object.fromEntries(s.frames.map((f) => [f.id, f]));
  return {
    scriptId: s.id,
    splice: 0.0,
    activeId: "climax",
    showLines: true,
    highlightMetric: null,
    frames: [
      { ...byId.climax, scale: "M", tone: "paper", accent: true, dx: 0, dy: 0 },
      { ...byId.bridge, scale: "M", tone: "paper", accent: false, dx: 0, dy: 0 },
      { ...byId.cut, scale: "M", tone: "paper", accent: true, dx: 0, dy: 0 },
      { ...byId.setup, scale: "M", tone: "paper", accent: false, dx: 0, dy: 0 },
    ],
  };
}

// 正当解 1：忠实呼应 152 原海报的阶梯咬合解
export function createPosterSolution(scriptId = "poster") {
  const s = SCRIPTS[scriptId] || SCRIPTS.poster;
  const byId = Object.fromEntries(s.frames.map((f) => [f.id, f]));
  return {
    scriptId: s.id,
    splice: 0.52,
    activeId: "climax",
    showLines: true,
    highlightMetric: null,
    frames: [
      { ...byId.setup, scale: "L", tone: "dark", accent: false, dx: -0.01, dy: -0.01 },
      { ...byId.cut, scale: "M", tone: "paper", accent: false, dx: 0.01, dy: -0.01 },
      { ...byId.bridge, scale: "S", tone: "maroon", accent: false, dx: 0, dy: 0.01 },
      { ...byId.climax, scale: "M", tone: "dark", accent: true, dx: 0.01, dy: 0.01 },
    ],
  };
}

// 正当解 2：另一种合法剪辑解（深酒红全景压底 + 暖纸中景切入 + 特写高潮收口）
export function createAltSolution(scriptId = "poster") {
  const s = SCRIPTS[scriptId] || SCRIPTS.poster;
  const byId = Object.fromEntries(s.frames.map((f) => [f.id, f]));
  return {
    scriptId: s.id,
    splice: 0.54,
    activeId: "climax",
    showLines: true,
    highlightMetric: null,
    frames: [
      { ...byId.setup, scale: "M", tone: "maroon", accent: false, dx: 0, dy: -0.01 },
      { ...byId.cut, scale: "S", tone: "dark", accent: false, dx: 0.01, dy: 0 },
      { ...byId.bridge, scale: "L", tone: "paper", accent: false, dx: -0.01, dy: 0.01 },
      { ...byId.climax, scale: "M", tone: "dark", accent: true, dx: 0.01, dy: 0.01 },
    ],
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// 由当前剪辑状态唯一算出 4 张片段在归一化舞台 [0..1]×[0..1] 的几何布局
// splice = 0 时四帧规整分离在 2×2 四角；splice 向 0.5–0.65 推进时呈电影剪辑对角阶梯咬合；
// splice 超过 0.78 时过度挤向画心导致核心内容被彼此糊死。
export function computeFrameRects(state) {
  const sp = clamp(state.splice, 0, 1);

  // 基准四锚点：分离态（死板 2×2 四格） -> 理想阶梯蒙太奇态（全 M 与 L+M+S 均落 16%–34% 甜区） -> 过度糊死中心态
  const sepAnchors = [
    { x: 0.25, y: 0.26, ang: 0 },
    { x: 0.75, y: 0.26, ang: 0 },
    { x: 0.25, y: 0.74, ang: 0 },
    { x: 0.75, y: 0.74, ang: 0 },
  ];
  const sweetAnchors = [
    { x: 0.34, y: 0.35, ang: -1.4 },
    { x: 0.59, y: 0.32, ang: 1.6 },
    { x: 0.40, y: 0.63, ang: -2.0 },
    { x: 0.64, y: 0.65, ang: 1.1 },
  ];
  const crushAnchors = [
    { x: 0.46, y: 0.46, ang: -3.2 },
    { x: 0.53, y: 0.45, ang: 2.8 },
    { x: 0.47, y: 0.54, ang: -2.6 },
    { x: 0.54, y: 0.53, ang: 2.2 },
  ];

  return state.frames.map((f, idx) => {
    const dim = SCALE_DIMS[f.scale] || SCALE_DIMS.M;
    let bx, by, bang;
    if (sp <= 0.54) {
      const k = sp / 0.54;
      bx = lerp(sepAnchors[idx].x, sweetAnchors[idx].x, k);
      by = lerp(sepAnchors[idx].y, sweetAnchors[idx].y, k);
      bang = lerp(sepAnchors[idx].ang, sweetAnchors[idx].ang, k);
    } else {
      const k = (sp - 0.54) / 0.46;
      bx = lerp(sweetAnchors[idx].x, crushAnchors[idx].x, k);
      by = lerp(sweetAnchors[idx].y, crushAnchors[idx].y, k);
      bang = lerp(sweetAnchors[idx].ang, crushAnchors[idx].ang, k);
    }

    const w = dim.w;
    const h = dim.h;
    const cx = clamp(bx + (f.dx || 0), w * 0.5 + 0.025, 1 - w * 0.5 - 0.025);
    const cy = clamp(by + (f.dy || 0), h * 0.5 + 0.03, 1 - h * 0.5 - 0.03);
    const x = cx - w * 0.5;
    const y = cy - h * 0.5;
    // 核心信息区（每帧中央 56%×56% 区域，用来判别是否被上层糊死）
    const cw = w * 0.56;
    const ch = h * 0.56;
    return {
      ...f,
      idx,
      x,
      y,
      w,
      h,
      cx,
      cy,
      area: w * h,
      angle: bang,
      core: { x: cx - cw * 0.5, y: cy - ch * 0.5, w: cw, h: ch },
    };
  });
}

// 计算两矩形交集矩形（无交集返回 null）
export function rectIntersect(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

// 评估序列是否构成清晰蒙太奇叙事关系
function evaluateOrder(frames) {
  const roles = frames.map((f) => f.role);
  const iSetup = roles.indexOf("setup");
  const iClimax = roles.indexOf("climax");
  const iCut = roles.indexOf("cut");
  const iBridge = roles.indexOf("bridge");

  // 经典递进解：起(setup)在前半(0或1)，高潮(climax)在后半(2或3)
  if (iSetup <= 1 && iClimax >= 2) {
    return { ok: true, mode: "ordered", label: "递进叙事", detail: "由起承铺垫推向高潮引爆" };
  }
  // 悬念倒叙解：高潮(climax)开场第1帧，紧接第2帧由起(setup)回溯源头
  if (iClimax === 0 && iSetup === 1) {
    return { ok: true, mode: "reverse", label: "悬念倒叙", detail: "先亮结果再回溯源头与冲突" };
  }
  // 其他错序：高潮提前泄气却无回溯，或起笔落到末尾造成折返
  if (iClimax === 0 && iSetup === 3) {
    return { ok: false, mode: "broken", label: "首尾倒挂", detail: "高潮第 1 帧抢跑、铺垫反落末尾" };
  }
  if (iClimax < iSetup) {
    return { ok: false, mode: "broken", label: "高潮前置", detail: "结果跑在铺垫前面，视线来回折返" };
  }
  return { ok: false, mode: "broken", label: "节奏断桥", detail: `第 ${iCut + 1}/${iBridge + 1} 帧衔接断裂` };
}

// 单真源诊断：从实绘几何与 64×48 离散栅格直接核算全部读数与 8 类错态
export function diagnose(state) {
  const rects = computeFrameRects(state);
  const script = SCRIPTS[state.scriptId] || SCRIPTS.poster;

  // 1. 64×48 栅格真实采样覆盖与叠合面积
  const GW = 64, GH = 48;
  let coveredCells = 0;
  let overlapCells = 0;
  for (let gy = 0; gy < GH; gy++) {
    const py = (gy + 0.5) / GH;
    for (let gx = 0; gx < GW; gx++) {
      const px = (gx + 0.5) / GW;
      let hit = 0;
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) hit++;
      }
      if (hit >= 1) coveredCells++;
      if (hit >= 2) overlapCells++;
    }
  }
  const unionPct = Math.round((coveredCells / (GW * GH)) * 100);
  const whitespacePct = Math.max(0, 100 - unionPct);
  const overlapPct = coveredCells > 0 ? Math.round((overlapCells / coveredCells) * 100) : 0;

  // 2. 相邻/跨层接缝列表与核心区遮挡率（高层遮低层）
  const joints = [];
  let maxCoreOccludedPct = 0;
  let worstOccludedFrame = null;
  for (let i = 0; i < rects.length; i++) {
    const low = rects[i];
    // 采样 low.core 被任何更高层 j > i 遮挡的比例
    let coreHit = 0;
    const S = 10;
    for (let sy = 0; sy < S; sy++) {
      const py = low.core.y + ((sy + 0.5) / S) * low.core.h;
      for (let sx = 0; sx < S; sx++) {
        const px = low.core.x + ((sx + 0.5) / S) * low.core.w;
        let blocked = false;
        for (let j = i + 1; j < rects.length; j++) {
          const hi = rects[j];
          if (px >= hi.x && px <= hi.x + hi.w && py >= hi.y && py <= hi.y + hi.h) {
            blocked = true;
            break;
          }
        }
        if (blocked) coreHit++;
      }
    }
    const occPct = Math.round((coreHit / (S * S)) * 100);
    if (occPct > maxCoreOccludedPct) {
      maxCoreOccludedPct = occPct;
      worstOccludedFrame = low;
    }

    for (let j = i + 1; j < rects.length; j++) {
      const inter = rectIntersect(low, rects[j]);
      if (inter && inter.area > 0.002) {
        joints.push({
          a: low,
          b: rects[j],
          box: inter,
          adjacent: j === i + 1,
        });
      }
    }
  }

  // 3. 尺度跨比（面积比）与单帧最大占比
  const areas = rects.map((r) => r.area);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);
  const scaleRatio = +(maxArea / Math.max(0.001, minArea)).toFixed(2);
  const maxFramePct = Math.round(maxArea * 100);

  // 4. 明暗极性与焦糖橘视觉焦点
  const lums = rects.map((r) => TONE_LUM[r.tone] ?? 0.5);
  const darkCount = rects.filter((r) => r.tone === "dark" || r.tone === "maroon").length;
  const lightCount = rects.filter((r) => r.tone === "paper").length;
  const contrastRatio = +((Math.max(...lums) + 0.05) / (Math.min(...lums) + 0.05)).toFixed(1);
  const accented = rects.filter((r) => r.accent);
  const accentCount = accented.length;

  // 5. 叙事序列判断
  const order = evaluateOrder(rects);

  // 6. 四大支柱合格判定（每柱独立核算，允许并鼓励多解）
  const spliceOk = overlapPct >= 11 && overlapPct <= 42 && maxCoreOccludedPct <= 34 && joints.length >= 2;
  const rhythmOk = scaleRatio >= 1.75 && maxFramePct <= 58;
  const orderOk = order.ok;
  const contrastOk = darkCount >= 1 && lightCount >= 1 && contrastRatio >= 6.0 && accentCount === 1;

  const passedCount = [spliceOk, rhythmOk, orderOk, contrastOk].filter(Boolean).length;

  // 7. 识别 8 类具体蒙太奇错态（按严重度给出最紧迫的主诊断）
  const issues = [];
  if (overlapPct < 11 || joints.length < 2) {
    issues.push({
      code: "grid-degrade",
      pillar: "splice",
      badge: "错态 · 退化网格",
      headline: `接缝咬合只有 ${overlapPct}%，四块各自孤立像四格面板`,
      why: "蒙太奇靠碎片边缘的叠压接缝「接通关系」。现在四块片段彼此隔开，大脑会把它们当成独立格子逐一扫读，退化成多面板，完全生不出碰撞张力。",
      action: "向右拖动画布底沿的「接缝咬合剪辑轨」至 14%–36% 甜区（或直接在画布把片段拉近交叠）。",
    });
  } else if (overlapPct > 42 || maxCoreOccludedPct > 34) {
    issues.push({
      code: "crush-occlude",
      pillar: "splice",
      badge: "错态 · 糊死遮挡",
      headline: `叠压过猛，下层「${worstOccludedFrame ? worstOccludedFrame.name : "片段"}」核心区被捂死 ${maxCoreOccludedPct}%`,
      why: "层叠是为了建立前后景深，不是把信息埋掉。一旦核心图案被压盖超过三成，读者必须费力脑补底层画了什么，层次感立刻滑向杂乱。",
      action: "把底沿「接缝咬合剪辑轨」往左拉松，让叠合率退回 14%–36%、核心遮挡压回 30% 以内。",
    });
  }

  if (scaleRatio < 1.75) {
    issues.push({
      code: "flat-scale",
      pillar: "rhythm",
      badge: "错态 · 尺度平权",
      headline: `四帧大小跨比仅 ${scaleRatio.toFixed(1)}×，节奏平铺直叙`,
      why: "四张卡片一样大时，画面就像平均分配的证件照，视线不知道该在哪里停顿、哪里快扫。蒙太奇需要全景大帧压阵、特写小帧提速。",
      action: "在胶片槽里给主帧点成「大 L」、给过渡帧点成「小 S」，把面积跨比拉到 1.8× 以上。",
    });
  } else if (maxFramePct > 58) {
    issues.push({
      code: "giant-swallow",
      pillar: "rhythm",
      badge: "错态 · 巨片吞屏",
      headline: `单帧吞掉 ${maxFramePct}% 画面，其余碎片被挤失语`,
      why: "如果一张图独占六成以上，它就变回单图主导版式，其他碎片只剩边角装饰，构不成对等的对话关系。",
      action: "缩小过大的片段，让四帧各保有一席可读面积。",
    });
  }

  if (!orderOk) {
    issues.push({
      code: "order-broken",
      pillar: "order",
      badge: `错态 · ${order.label}`,
      headline: `剪辑顺序打架（${order.detail}），第三意义断桥`,
      why: "读者看蒙太奇总会沿 ①→②→③→④ 暗自编故事。把高潮帧抢先丢在开头、铺垫反被挤在最后，因果链被倒插，张力还没蓄起来就先泄气了。",
      action: "点胶片槽里的「⇄ 换序」把起笔铺垫调回前两格、把高潮帧推到第 3 或第 4 格（或排成「高潮→起笔」悬念倒叙）。",
    });
  }

  if (darkCount === 0 || lightCount === 0 || contrastRatio < 6.0) {
    issues.push({
      code: "tone-flat",
      pillar: "contrast",
      badge: "错态 · 明暗发闷",
      headline: `${darkCount === 0 ? "全画都是浅暖纸" : "全画都是深暗块"}，明度反差仅 ${contrastRatio}:1`,
      why: "152 原海报之所以一眼有力量，是因为炭黑与深酒红牢牢压住了暖旧相纸。四块同明度时，叠压边缘糊在一起，空间前后层立刻拉不开。",
      action: "把 1–2 张片段切为「暗房黑」或「深酒红」，同时保留至少 1 张「暖宣纸」透气。",
    });
  }

  if (accentCount === 0) {
    issues.push({
      code: "no-focal",
      pillar: "contrast",
      badge: "错态 · 缺引爆点",
      headline: "没有焦糖橘视觉锚点，视线在四帧之间打转",
      why: "黑、红、米三色拉开骨架后，还需要一处极克制的高饱和焦糖橘记号充当视觉落槌，告诉读者「整组蒙太奇的情绪出口在这里」。",
      action: "给高潮帧点亮一枚「橘标」焦糖橘记号。",
    });
  } else if (accentCount >= 2) {
    issues.push({
      code: "multi-focal",
      pillar: "contrast",
      badge: "错态 · 多焦抢戏",
      headline: `同时有 ${accentCount} 帧刷了焦糖橘，重点互相抵消`,
      why: "「处处强调等于没有强调」。多张碎片同时闪亮橘色，眼睛在几个高饱和点之间来回跳闪，版面瞬间退化成热闹却失焦的招贴墙。",
      action: "关掉多余帧的「橘标」，全画只保留 1 处最关键的焦糖橘爆点。",
    });
  }

  // 主诊断文案
  let primary;
  if (issues.length === 0) {
    const modeNote =
      order.mode === "reverse"
        ? "你调出了一套「悬念倒叙」蒙太奇正当解"
        : "你调出了一套「层层递进」蒙太奇正当解";
    primary = {
      ok: true,
      badge: `校准达标 · 4/4`,
      headline: `${modeNote}：接缝 ${overlapPct}%、跨比 ${scaleRatio.toFixed(1)}×`,
      why: `四枚碎片以 ${overlapPct}% 阶梯咬合接通空间，${darkCount} 暗压 ${lightCount} 明拉开前后景深，唯一焦糖橘落点落在「${accented[0].name}」上。你可以继续换序或换剧本，观察不同配对撞出的第三意义。`,
      action: "试试点击不同剧本，或拖动胶片轨压到 60% 亲眼看「过度叠压」如何毁掉已成立的层次。",
    };
  } else {
    primary = { ok: false, ...issues[0] };
  }

  // 实时碰撞出的「第三意义」
  const thirdMeaning =
    !orderOk
      ? script.meanings.broken
      : order.mode === "reverse"
      ? script.meanings.reverse
      : script.meanings.ordered;

  // 对应 152 原海报左侧 6 条要点的实时状态
  const sixPoints = [
    {
      id: "juxtaposition",
      zh: "并置对比",
      en: "JUXTAPOSITION",
      ok: orderOk && darkCount >= 1 && lightCount >= 1,
      status: orderOk && darkCount >= 1 && lightCount >= 1 ? "异质张力成立" : darkCount === 0 || lightCount === 0 ? "同调缺碰撞" : "配对序断裂",
    },
    {
      id: "layering",
      zh: "层叠构建",
      en: "LAYERING",
      ok: spliceOk,
      status: overlapPct < 11 ? `零叠 ${overlapPct}%` : maxCoreOccludedPct > 34 || overlapPct > 42 ? `遮挡 ${maxCoreOccludedPct}%` : `咬合 ${overlapPct}%`,
    },
    {
      id: "fragment",
      zh: "碎片组合",
      en: "FRAGMENT",
      ok: joints.length >= 2 && maxCoreOccludedPct <= 34,
      status: joints.length < 2 ? `${joints.length} 处接缝` : maxCoreOccludedPct > 34 ? "核心被压" : `${joints.length} 处胶带接通`,
    },
    {
      id: "rhythm",
      zh: "节奏变化",
      en: "RHYTHM",
      ok: rhythmOk,
      status: scaleRatio < 1.75 ? `${scaleRatio.toFixed(1)}× 平权` : maxFramePct > 58 ? `单帧 ${maxFramePct}%` : `${scaleRatio.toFixed(1)}× 阶梯`,
    },
    {
      id: "contrast",
      zh: "对比强化",
      en: "CONTRAST",
      ok: contrastOk,
      status: accentCount !== 1 ? `橘标 ${accentCount} 处` : contrastRatio < 6 ? `反差 ${contrastRatio}:1` : `${contrastRatio}:1 · 单锚`,
    },
    {
      id: "narrative",
      zh: "叙事表达",
      en: "NARRATIVE",
      ok: orderOk && passedCount >= 3,
      status: orderOk ? order.label : order.label,
    },
  ];

  return {
    rects,
    joints,
    unionPct,
    whitespacePct,
    overlapPct,
    maxCoreOccludedPct,
    scaleRatio,
    maxFramePct,
    contrastRatio,
    darkCount,
    lightCount,
    accentCount,
    order,
    spliceOk,
    rhythmOk,
    orderOk,
    contrastOk,
    passedCount,
    issues,
    primary,
    thirdMeaning,
    sixPoints,
  };
}
