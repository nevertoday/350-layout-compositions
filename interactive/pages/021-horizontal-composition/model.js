// 021 水平构图 · 单源数据与构图诊断模型
// 所有画面几何、读数、档位与教学案例全部从此文件计算，确保视觉与数字绝对同源。

export const INITIAL_HERO = Object.freeze({
  tilt: 5.2,        // 倾角（度），正值=左高右低向右溜水，负值=右高左低向左溜水
  horizon: 0.50,    // 海平线自画布底沿向上的占比（0.16 ~ 0.84）；0.50 = 正中死对半
  specimen: "poster", // poster | lighthouse | prairie | minimal
  frameMode: "pano",  // pano | standard | portrait
});

export const TILT_LIMIT = 8.0;
export const TILT_SNAP = 0.55;
export const HORIZON_MIN = 0.16;
export const HORIZON_MAX = 0.84;

export const SPECIMENS = [
  { id: "poster",     label: "原海报 · 海帆", en: "POSTER SEA",   isMinimal: false, idealHorizon: 0.34 },
  { id: "lighthouse", label: "海岸灯塔",     en: "LIGHTHOUSE",   isMinimal: false, idealHorizon: 0.36 },
  { id: "prairie",    label: "草原长屋",     en: "PRAIRIE",      isMinimal: false, idealHorizon: 0.32 },
  { id: "minimal",    label: "极简空海",     en: "MINIMAL SEA",  isMinimal: true,  idealHorizon: 0.50 },
];

export const FRAME_MODES = [
  { id: "pano",     label: "宽银幕",   ratioLabel: "宽横延展", widthFactor: 1.0 },
  { id: "standard", label: "4:3 常规", ratioLabel: "常规横幅", widthFactor: 0.72 },
  { id: "portrait", label: "3:4 竖框", ratioLabel: "竖窄截断", widthFactor: 0.38 },
];

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function snapTilt(deg, allowSnap = true) {
  const clamped = clamp(deg, -TILT_LIMIT, TILT_LIMIT);
  if (allowSnap && Math.abs(clamped) <= TILT_SNAP) return 0;
  return Math.round(clamped * 10) / 10;
}

export function snapHorizon(ratio, allowSnap = true) {
  const clamped = clamp(ratio, HORIZON_MIN, HORIZON_MAX);
  if (allowSnap) {
    for (const anchor of [0.33, 0.50, 0.67]) {
      if (Math.abs(clamped - anchor) <= 0.014) return anchor;
    }
  }
  return Math.round(clamped * 100) / 100;
}

export function formatTilt(deg) {
  if (Math.abs(deg) < 0.05) return "0.0°";
  return `${deg > 0 ? "+" : "−"}${Math.abs(deg).toFixed(1)}°`;
}

// 计算开场所有读数与「为什么」诊断（纯函数，单源输出）
export function diagnoseHero(state) {
  const tilt = Math.abs(state.tilt) < 0.05 ? 0 : state.tilt;
  const absTilt = Math.abs(tilt);
  const seaPct = Math.round(state.horizon * 100);
  const skyPct = 100 - seaPct;
  const spec = SPECIMENS.find((s) => s.id === state.specimen) || SPECIMENS[0];
  const frame = FRAME_MODES.find((f) => f.id === state.frameMode) || FRAME_MODES[0];

  const isLevel = absTilt <= TILT_SNAP;
  const isMid = state.horizon >= 0.44 && state.horizon <= 0.56;
  const isEdge = state.horizon < 0.20 || state.horizon > 0.80;
  const isLow = state.horizon >= 0.20 && state.horizon < 0.44;
  const isHigh = state.horizon > 0.56 && state.horizon <= 0.80;
  const isPortrait = state.frameMode === "portrait";

  // 物理水准气泡位置：右端下沉（tilt > 0）时左端翘高，气泡向左侧高处浮动（-1 ~ +1）
  const bubbleNorm = clamp(-tilt / TILT_LIMIT, -1, 1);
  const leanDir = tilt > 0 ? "右溜" : tilt < 0 ? "左溜" : "归中";
  const highEnd = tilt > 0 ? "左高右低 · 气泡偏左" : tilt < 0 ? "右高左低 · 气泡偏右" : "气泡居正中 · 水平锁稳";

  const horizonZone = isMid
    ? "正中五五分"
    : isLow
      ? "低地平 · 留天"
      : isHigh
        ? "高地平 · 铺海"
        : state.horizon < 0.20
          ? "压底贴边"
          : "顶天贴边";

  // 1. 未调平（首要破绽）
  if (!isLevel) {
    const severe = absTilt >= 2.2;
    const bothWrong = !spec.isMinimal && isMid;
    if (bothWrong) {
      return {
        tone: "alert",
        levelBand: "双料失稳",
        badge: `倾角 ${formatTilt(tilt)} · 死切正中`,
        headline: `海面往${tilt > 0 ? "右" : "左"}溜水，地平又卡在 ${seaPct}% 正中`,
        why: `倾角 ${formatTilt(tilt)} 远超人眼对 0° 水平基准约 1°–2° 的敏感阈，整片海像端歪的盘子往${tilt > 0 ? "右" : "左"}滑；同时海平卡在正中，天海各抢一半主次。先把下方气泡拖回 0° 中线，再上下拉动白海平线分清主次。`,
        skyPct, seaPct, tiltText: formatTilt(tilt), leanDir, highEnd, horizonZone, bubbleNorm,
        frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: false,
      };
    }
    if (isPortrait) {
      return {
        tone: "alert",
        levelBand: "歪斜兼截断",
        badge: `倾角 ${formatTilt(tilt)} · 竖框截断`,
        headline: `水平线既向${tilt > 0 ? "右" : "左"}倾斜，又被 3:4 竖框拦腰截短`,
        why: `水平构图靠连贯横线传递稳定与延伸。此刻既没调平（${formatTilt(tilt)}），窄竖框又把左右延展砍掉一半，画面既不安稳也展不开。先拖水准气泡归平，再切回宽幅画框。`,
        skyPct, seaPct, tiltText: formatTilt(tilt), leanDir, highEnd, horizonZone, bubbleNorm,
        frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: false,
      };
    }
    return {
      tone: "alert",
      levelBand: severe ? "倾倒失稳" : "微歪未平",
      badge: severe ? `倾角 ${formatTilt(tilt)} · 海面溜水` : `微倾 ${formatTilt(tilt)} · 眼神发紧`,
      headline: severe
        ? `海平向${tilt > 0 ? "右" : "左"}倾倒 ${absTilt.toFixed(1)}°，安定感瞬间瓦解`
        : `只歪了 ${absTilt.toFixed(1)}°，却像挂歪的画框让人总想伸手扶正`,
      why: severe
        ? `视觉皮层与内耳重力参照时刻校验 0° 基准线。海面歪过 2° 就会产生滑坠错觉，哪怕天地比例合适，情绪也静不下来。把水准气泡推回正中双线即可锁平。`
        : `最隐蔽的翻车恰恰在 0.8°–2° 之间：不够斜到变成动感对角线，又不够平到令人安心。继续轻拖气泡靠向 0° 即可磁吸锁平。`,
      skyPct, seaPct, tiltText: formatTilt(tilt), leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: false,
    };
  }

  // 2. 已调平，但画幅切为 3:4 竖框截断
  if (isPortrait) {
    return {
      tone: "warn",
      levelBand: "延展受限",
      badge: "0.0° 已平 · 竖框截断",
      headline: "海平线已经锁平，但 3:4 竖框把横向延伸感砍矮了",
      why: "画面虽不再倾倒，但左右边界离得太近，视线刚沿水平线起跑就撞上边框，反而像把竖页面拦腰劈成上下两块补丁。切回「宽银幕」或「4:3 常规」看横向张力立刻舒展。",
      skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: true,
    };
  }

  // 3. 极简空海标本的特殊判据（杉本博司式 50% 成立）
  if (spec.isMinimal) {
    if (state.horizon >= 0.46 && state.horizon <= 0.54) {
      return {
        tone: "calm",
        levelBand: "空海镜默",
        badge: "0.0° 锁平 · 空海正中成立",
        headline: "山日船帆全退场，正中 50% 反成冥想镜面",
        why: "教科书常说「地平线别放正中」，但极简空海没有多余主体抢戏：绝对 0.0° 的中分线把天与海摊成势均力敌的两半，视线无须攀爬也不必偏倚，静默感达到极致。",
        skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone: "正中镜面", bubbleNorm,
        frameLabel: frame.ratioLabel, specLabel: spec.label, settled: true, isLevel: true,
      };
    }
    if (isEdge) {
      return {
        tone: "warn",
        levelBand: "贴边失衡",
        badge: `0.0° 已平 · 海平贴边 ${seaPct}%`,
        headline: "空海被压成窄缝，极简镜面的呼吸感没了",
        why: "极简空海靠大片天与海的色调对话撑起张力；把线拉到边缘，剩下一窄条反而显得像裁图失误。试着把白线拉回 50% 正中。",
        skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
        frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: true,
      };
    }
    return {
      tone: "warn",
      levelBand: "空海偏切",
      badge: `0.0° 已平 · 天 ${skyPct}% / 海 ${seaPct}%`,
      headline: "海平已稳，但在纯空海里偏切反而打破均势",
      why: "这里没有云山红日来填补多出来的那一半空间，按常规 1/3 切分反而让较宽那侧显得空落。试试把白海平线推到 50% 正中，感受「特例成立」的一刻。",
      skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: true,
    };
  }

  // 4. 多元素标本（原海报海帆 / 海岸灯塔 / 草原长屋）
  if (isMid) {
    return {
      tone: "warn",
      levelBand: "主次割裂",
      badge: `0.0° 已平 · 正中 ${seaPct}% 死对半`,
      headline: "水平已经调平，但正中五五分让天与海互相抢戏",
      why: `画面里既有上方景观又有水面前景，海平线卡在 ${seaPct}% 正中会像一刀把海报劈成两半，眼睛不知道该先看天还是看海。上下拖动白海平线，移到低地平（约 28%–38%）或高地平（约 62%–72%）。`,
      skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: true,
    };
  }

  if (isEdge) {
    return {
      tone: "warn",
      levelBand: "贴边窒息",
      badge: `0.0° 已平 · 贴边 ${seaPct}%`,
      headline: state.horizon < 0.20
        ? "海平压得太低，下方水面被挤成细条撑不住画面"
        : "海平顶得太高，上方天空被挤成窄缝显得发闷",
      why: "让出主次不等于把另一半挤死。地平线过于贴边（低于 20% 或高于 80%）时，主体和远景容易撞框窒息，失去天地呼应的余地。往回松一点到 26%–38% 或 62%–74%。",
      skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: false, isLevel: true,
    };
  }

  if (isLow) {
    return {
      tone: "calm",
      levelBand: "平正安宁",
      badge: `0.0° 锁平 · 低地平 ${seaPct}%`,
      headline: "低地平让出大片天穹，画面平下来、情绪静下来",
      why: `绝对 0.0° 的水平水线稳住底盘，天空占 ${skyPct}%、水面占 ${seaPct}%（接近 021 原海报与古典低地平风景的比例），视野向两侧自然延展，红日与前景锚点互不打架。`,
      skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
      frameLabel: frame.ratioLabel, specLabel: spec.label, settled: true, isLevel: true,
    };
  }

  return {
    tone: "calm",
    levelBand: "平正厚实",
    badge: `0.0° 锁平 · 高地平 ${seaPct}%`,
    headline: "高地平铺开深广水面，构图沉静而有纵深",
    why: `0.0° 水平线牢牢托住画面，下方水面/大地占 ${seaPct}%、天空退让至 ${skyPct}%，视线被引导着在辽阔的横面与微澜间缓缓铺展，厚重而克制。`,
    skyPct, seaPct, tiltText: "0.0°", leanDir, highEnd, horizonZone, bubbleNorm,
    frameLabel: frame.ratioLabel, specLabel: spec.label, settled: true, isLevel: true,
  };
}

// 01 节：倾角直觉盲测默认 5 题（含真 0° 与从易到难的微倾角）
export const LEVEL_TEST_SETS = [
  [
    { angle: 3.2,  label: "第 1 题" },
    { angle: 0.0,  label: "第 2 题" },
    { angle: -1.6, label: "第 3 题" },
    { angle: 0.9,  label: "第 4 题" },
    { angle: -2.4, label: "第 5 题" },
  ],
  [
    { angle: -2.8, label: "第 1 题" },
    { angle: 1.4,  label: "第 2 题" },
    { angle: 0.0,  label: "第 3 题" },
    { angle: -0.8, label: "第 4 题" },
    { angle: 3.6,  label: "第 5 题" },
  ],
];

// 02 节：原海报五要点（全文逐字引自 poster-text.json）
export const FIVE_POINTS = [
  {
    id: "stability",
    title: "稳定",
    en: "STABILITY",
    posterBody: "水平线给人平稳、安定的感受，营造可靠的视觉基础。",
    plain: "凡是横躺在地面的物体都已落到最低势能，不会再倒；把关键边界拉平，画面底座就稳了。",
    actionHint: "切换横卧基石与倾倒状态，看视觉重心如何着陆。",
  },
  {
    id: "extension",
    title: "延伸",
    en: "EXTENSION",
    posterBody: "水平线具有向两侧延展的张力，拓展画面空间感。",
    plain: "横线两头仿佛穿过画框继续伸向画外；画幅越宽，这种向左右推开的辽阔感越强。",
    actionHint: "切换 1:1、16:9、2.39:1 三档画幅，感受同一根线的延伸差。",
  },
  {
    id: "guidance",
    title: "引导",
    en: "GUIDANCE",
    posterBody: "视线沿水平线自然移动，形成清晰的观看路径。",
    plain: "如原海报 TIP 所说：把主体放到水平线上或其附近，眼睛就会顺着线稳稳滑向它，而不会四处漂移。",
    actionHint: "切换红点落在线上、略偏或悬空离群，看视线落点变化。",
  },
  {
    id: "horizon",
    title: "地平",
    en: "HORIZON",
    posterBody: "水平构图常用于表达地平线、水面等自然意象，传达宁静与辽阔。",
    plain: "一根线只有平面，把远云、远山、海平、近岸排成多层平行横带，远近空气感立刻出来。",
    actionHint: "增减水平层次（1 层 / 3 层 / 5 层），看平面长出景深。",
  },
  {
    id: "rhythm",
    title: "节奏",
    en: "RHYTHM",
    posterBody: "通过元素在水平线上的重复与间隔，建立画面节奏感。",
    plain: "纯横线容易发闷，沿线点缀重复却有疏密间隔的节点（柱列、行树、远帆），视线就有了呼吸拍点。",
    actionHint: "点击画布里的红点或切换「等距 / 疏密 / 渐远」排布节奏。",
  },
];

// 04 节：跨媒介编年史（全部史实已核实）
export const LINEAGE_ITEMS = [
  {
    id: "ruisdael",
    year: "约 1670–1675",
    era: "荷兰黄金时代风景画",
    title: "雅各布·范·鲁伊斯达尔《哈勒姆远眺》",
    workEn: "View of Haarlem with Bleaching Grounds · Mauritshuis, Inv. 155",
    ratio: 62.0 / 55.5, // 宽 62.0 cm × 高 55.5 cm，实测 1.12:1（微横方幅）
    ratioText: "62.0 × 55.5 cm（约 1.12:1）",
    horizonPct: 28,
    summary: "把地平线压低到画布下方不足三分之一处，留出超过三分之二的辽阔天空描绘流云与光斑，平原上的漂白布带与远方圣巴弗教堂剪影沿着低平天际线展开。现藏海牙莫瑞泰斯皇家美术馆。",
    takeaway: "即便在接近正方形的画布里，只要压低地平线、用平坦田野与云层横向带出层次，依然能撑起宏阔的水平气度。",
  },
  {
    id: "wright",
    year: "1908–1910",
    era: "草原学派建筑",
    title: "弗兰克·劳埃德·赖特 · 罗比住宅",
    workEn: "Frederick C. Robie House · Chicago, completed 1910",
    ratio: 2.25,
    ratioText: "立面长宽比约 2.25:1",
    horizonPct: 36,
    summary: "赖特在芝加哥建成的草原学派代表作：用狭长罗马砖配深嵌水平灰缝（竖缝刻意填平同色）、连续带状艺术玻璃窗与长达 20 英尺的钢结构悬挑平屋檐，让整栋住宅贴着美国中西部大平原横向滑行。",
    takeaway: "把建筑当作「立体水平构图」——刻意弱化竖向构件，连续的屋檐、窗带与砖缝把体量牢牢锚在大地上。",
  },
  {
    id: "cinemascope",
    year: "1953",
    era: "宽银幕电影革命",
    title: "CinemaScope 宽银幕与《圣袍千秋》",
    workEn: "The Robe · 20th Century-Fox, original 2.55:1",
    ratio: 2.55,
    ratioText: "首映原始画幅 2.55:1",
    horizonPct: 38,
    summary: "1953 年二十世纪福克斯以《圣袍千秋》正式推出 CinemaScope 宽银幕，早期采用画幅外磁条声轨达到 2.55:1（后改光学声轨收至 2.35:1）。导演被迫放弃传统 4:3 里的上下堆叠，改用横向调度、长水平景深与人物横列重构银幕空间。",
    takeaway: "画幅比例本身就是水平构图的放大器——把宽长比推过 2:1，哪怕画面空旷，左右延伸张力也会自然涌现。",
  },
  {
    id: "sugimoto",
    year: "1980 起",
    era: "当代极简摄影",
    title: "杉本博司《海景》系列",
    workEn: "Hiroshi Sugimoto · Seascapes, begun 1980",
    ratio: 1.25, // 8×10 大画幅横拍 1.25:1
    ratioText: "8×10 大画幅（1.25:1）",
    horizonPct: 50,
    summary: "自 1980 年起，杉本博司携带大画幅相机在全球各地海崖长曝光拍摄《海景》，每一幅都将海平线严丝合缝放在画幅正中 50% 处，只剩水、空气与光线。被大都会艺术博物馆、MoMA 等机构永久收藏。",
    takeaway: "构图原则不是死律：当一切叙事杂物退场，正中 50% 的绝对水平线不再割裂画面，反而打开超越时间的静默。",
  },
];

// 05 节：原海报三幅应用示例 + 锚点拆装
export const EXAMPLE_SCENES = [
  {
    id: "lighthouse",
    posterCaption: "地平线构图 • 宁静开阔",
    anchorName: "右侧礁堤灯塔",
    withoutWhy: "拆掉灯塔后，整幅海天只剩单调的蓝灰两色块，视线从左滑到右找不到落脚处，宁静立刻变成空泛。",
    withWhy: "一座细小白灯塔立在海平线右三分之一处，既守住海天的辽阔，又给视线一颗温和的停靠钉。",
    placements: {
      rule:   { label: "偏侧锚定（原海报）", note: "灯塔立于右侧约 74%，左大右小留出呼吸，横向延伸感最强。" },
      center: { label: "正中孤立",         note: "灯塔堵在 50% 正中，像把海平线分成左右两截对称图，延伸感变短。" },
      rhythm: { label: "双锚呼应",         note: "右灯塔配左侧极小远帆，形成一主一从的横向对话路径。" },
    },
  },
  {
    id: "architecture",
    posterCaption: "建筑摄影 • 稳定秩序",
    anchorName: "低矮朱红双门",
    withoutWhy: "拆掉朱红门后，深蓝天与横白墙只剩两道冰冷色带，缺乏人体尺度参照，墙有多长根本感觉不到。",
    withWhy: "低矮墙面正中嵌一扇朱红双门，冷蓝暖红瞬间对撞，同时给出建筑尺度，整堵横墙立刻有了庄重的秩序感。",
    placements: {
      rule:   { label: "中轴低嵌（原海报）", note: "极简建筑立面里，唯一朱红门稳居底层正中，既克制又庄严。" },
      center: { label: "偏右留长墙",       note: "红门右移至 72%，左侧大片留白白墙拉长了建筑的水平绵延感。" },
      rhythm: { label: "多门韵律",         note: "三扇等高窄门沿基线排列，从安静独白转成清晰的建筑节拍。" },
    },
  },
  {
    id: "landscape",
    posterCaption: "景观摄影 • 延伸与节奏",
    anchorName: "沿线成列乔木",
    withoutWhy: "拿走树列后，淡灰天空与金黄麦田之间只剩一条平滑直线，毫无节奏停顿，看两秒就失去兴味。",
    withWhy: "一排错落有致的乔木紧贴地平线铺开，树冠间留出长短不一的空隙，让水平线像五线谱一样唱出轻快节奏。",
    placements: {
      rule:   { label: "疏密节奏（原海报）", note: "三三两两成群、留出呼吸空隙，既保持一条直地平，又不显机械。" },
      center: { label: "等距死排",         note: "每棵树间隔完全一样、高矮一致，立刻变得像复印出来的栅栏。" },
      rhythm: { label: "孤树留白",         note: "只留右侧两棵小树，画面从「欢快节奏」立刻转为「苍茫孤寂」。" },
    },
  },
];

// 06 节：什么时候别用（翻车场景 -> 改方建议）
export const ANTI_CASES = [
  {
    id: "tower",
    title: "拍高耸建筑与峡谷",
    badTag: "水平横切 · 高塔变矮墩",
    goodTag: "改用 022 垂直构图 / 072 三点透视",
    linkId: "022",
    linkName: "垂直构图",
    linkId2: "072",
    linkName2: "三点透视",
    badDesc: "用宽横幅与强水平线硬套摩天楼，楼顶和底座被双双压扁，崇高与直冲云霄的压迫感荡然无存。",
    goodDesc: "改以竖向直立线条贯通画幅，或适度仰拍收束竖棱，把眼睛从底一路送上天顶。",
  },
  {
    id: "sprint",
    title: "拍冲刺、赛车与对抗",
    badTag: "水平锁死 · 速度感被按停",
    goodTag: "改用 023 对角线构图 / 025 汇聚线构图",
    linkId: "023",
    linkName: "对角线构图",
    linkId2: "025",
    linkName2: "汇聚线构图",
    badDesc: "水平线天生降速、安抚心率。把冲刺或搏击放进稳稳的横格里，动作像被按了暂停键。",
    goodDesc: "引入倾斜对角线或向消失点收束的汇聚线，打破重力休止面，让失衡本身产生向前冲的势能。",
  },
  {
    id: "mobile",
    title: "9:16 竖屏强塞单横线",
    badTag: "窄框横切 · 画面被拦腰斩断",
    goodTag: "改用 022 垂直纵流 / 027 中轴构图",
    linkId: "027",
    linkName: "中轴构图",
    linkId2: "022",
    linkName2: "垂直构图",
    badDesc: "在狭长的手机竖屏里强拉一条粗重横分界，横向展不开、纵向又被拦腰劈成上下两张不连贯的贴纸。",
    goodDesc: "窄竖屏优先顺着纵轴组织视觉流，真需要水平分栏时也要用元素跨线衔接上下两区。",
  },
  {
    id: "blinds",
    title: "等距条纹铺满整屏",
    badTag: "百叶窗效应 · 机械发晕",
    goodTag: "拉开疏密留白，只保留 1–2 条主水平线",
    linkId: "024",
    linkName: "平行线构图",
    linkId2: "013",
    linkName2: "留白构图",
    badDesc: "以为「横线越多越水平」，把七八条等粗等距的横条排满画框，视觉立刻退化成百叶窗噪点，令人头晕。",
    goodDesc: "水平构图要靠主次呼吸：只立一条清晰主水平线，其余弱化为远淡层纹，把空白留给天空或水面。",
  },
];

// 07 节：双题单变量同构小练习（标签零剧透，只写方案 A/B/C/D）
export const PRACTICE_QUESTIONS = [
  {
    id: "q1",
    tab: "第 1 题 · 海滨长屋横幅",
    prompt: "海滨美术馆「冬季静思展」需要一张横幅主视觉（含海面、远山、低矮长屋与红门）。下面四稿用色与景物完全相同，每稿只变动一个构图变量，哪一稿最稳、最开阔且主次分明？",
    correct: "A",
    options: [
      {
        id: "A",
        label: "方案 A",
        tilt: 0,
        horizon: 0.34,
        blocker: false,
        scene: "house",
        reason: "正确。海平线严守 0.0° 水平，落在 34% 低地平处让出 66% 澄静天穹；低矮长屋顺岸水平铺展，一扇小红门稳稳锚住视线，安定又开阔。",
      },
      {
        id: "B",
        label: "方案 B",
        tilt: 0,
        horizon: 0.50,
        blocker: false,
        scene: "house",
        reason: "只差在海平线高度：这里抬到了 50% 正中死对半。画面里有远山和长屋，上下各占一半互相抢戏，不如方案 A 低地平舒展。",
      },
      {
        id: "C",
        label: "方案 C",
        tilt: 3.4,
        horizon: 0.34,
        blocker: false,
        scene: "house",
        reason: "只差在海平倾角：虽然低地平比例是对的，但整条海平线向右微倾了 +3.4°，越过人眼 0° 敏感阈，看着总觉得海水要往右溜。",
      },
      {
        id: "D",
        label: "方案 D",
        tilt: 0,
        horizon: 0.34,
        blocker: true,
        scene: "house",
        reason: "只差在横向连贯性：正中多了一道顶天立地的深色粗竖柱，把原本舒展的水平线与长屋一刀砍成两截，延伸感被彻底打断。",
      },
    ],
  },
  {
    id: "q2",
    tab: "第 2 题 · 极简雾海特例",
    prompt: "换一个情境：这次画面抽干了山脉、船只与建筑，只剩柔和的薄雾天空与静海两块纯色调，想传达「超越时间的冥想静默」。下面四稿只变一个变量，选哪一稿？",
    correct: "C",
    options: [
      {
        id: "A",
        label: "方案 A",
        tilt: 0,
        horizon: 0.14,
        blocker: false,
        scene: "minimal",
        reason: "海平线压到 14% 贴近底框，深海被挤成一条细边，纯色调之间的对等呼吸感消失，看起来像裁切失误。",
      },
      {
        id: "B",
        label: "方案 B",
        tilt: -3.2,
        horizon: 0.50,
        blocker: false,
        scene: "minimal",
        reason: "极简空海里没有任何杂物分散注意力，这 −3.2° 的倾斜会被肉眼无限放大，静默感荡然无存。",
      },
      {
        id: "C",
        label: "方案 C",
        tilt: 0,
        horizon: 0.50,
        blocker: false,
        scene: "minimal",
        reason: "正确！正如杉本博司《海景》证明的：当多余叙事物全部退场，0.0° 正中 50% 的水平线不再割裂画面，反而让天海达成均势入定的镜面静默。",
      },
      {
        id: "D",
        label: "方案 D",
        tilt: 0,
        horizon: 0.78,
        blocker: false,
        scene: "minimal",
        reason: "在有前景细节的风景里高地平很耐看，但此处海面空无一物，78% 大块深蓝压顶、上方只剩窄条浅空，显得沉闷失衡。",
      },
    ],
  },
];

// 同小类兄弟编号（构图逻辑 / 重心、线条与轴线，共 14 个）
export const SIBLING_PAGES = [
  { id: "016", name: "居中构图" },
  { id: "017", name: "偏心构图" },
  { id: "018", name: "对称构图" },
  { id: "019", name: "非对称构图" },
  { id: "020", name: "镜像构图" },
  { id: "022", name: "垂直构图" },
  { id: "023", name: "对角线构图" },
  { id: "024", name: "平行线构图" },
  { id: "025", name: "汇聚线构图" },
  { id: "026", name: "交叉线构图" },
  { id: "027", name: "中轴构图" },
  { id: "028", name: "偏轴构图" },
  { id: "029", name: "双轴构图" },
  { id: "030", name: "十字构图" },
];
