// 315 高远法 · 单一空间几何与诊断真源
// 所有画布（主立轴、侧剖面、分屏对比、层叠分解、画幅天头、小练习）与读数面板
// 共用此处算出的归一化坐标（0..1，u 自左向右，v 自上而下）。

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报孤峰",
    en: "POSTER PEAK",
    note: "青黛棱面峭峰、浅灰石阶与顶沿古金日轮",
  },
  song: {
    id: "song",
    label: "北宋溪山",
    en: "NORTHERN SONG",
    note: "巨碑主峰、山腰飞瀑与山脚微渺行旅剪影",
  },
  tower: {
    id: "tower",
    label: "现代摩天",
    en: "VERTICAL TOWER",
    note: "低机位街角行人剪影与拔地钢构塔楼",
  },
};

export const BASE_REFS = {
  giant: {
    id: "giant",
    label: "巨树遮山",
    short: "巨树喧宾",
    refHeight: 0.34,
  },
  none: {
    id: "none",
    label: "空脚无尺",
    short: "无尺难量",
    refHeight: 0,
  },
  humble: {
    id: "humble",
    label: "矮松拾级",
    short: "低处为辅",
    refHeight: 0.055,
  },
};

// 开场默认 0/4 错态：俯视抬高地平线 + 矮钝主峰 + 全山尽出无云雾 + 前景巨树喧宾夺主
export const INITIAL_STATE = {
  scene: "poster",
  pitch: -10,      // -18° 俯视 .. +58° 极度仰视
  peakScale: 0.36, // 0.20 .. 0.96 主峰垂升势能
  mist: 0.0,       // 0.00 .. 0.92 烟霞锁腰浓度
  baseRef: "giant",
  showGuides: true,
};

// 参考高远成势坐标（用于练习与对比，非唯一死答案）
export const IDEAL_STATE = {
  scene: "poster",
  pitch: 34,
  peakScale: 0.76,
  mist: 0.44,
  baseRef: "humble",
  showGuides: true,
};

// 经验参考舒适带（页面中一律注明「经验参考」）
export const BANDS = {
  pitchMin: 18,
  pitchMax: 48,
  horizonMin: 0.68,
  horizonMax: 0.88,
  spanMin: 0.46,
  spanMax: 0.75,
  headroomMin: 0.095,
  headroomMax: 0.28,
  mistMin: 0.22,
  mistMax: 0.68,
};

// 仰视角（度） → 画框视平线/地平线高度 v（0 在画顶，1 在画底）
// 抬头仰视（pitch > 0）时，地平线下压到画底；低头俯视（pitch < 0）时，地平线上抬。
export function pitchToHorizon(pitch) {
  const p = clamp(pitch, -18, 58);
  if (p <= 0) {
    return 0.52 + (p / 18) * 0.20; // -18° -> 0.32, -10° -> 0.409, 0° -> 0.52
  }
  if (p <= 46) {
    return 0.52 + (p / 46) * 0.34; // +24° -> 0.697, +34° -> 0.771, +46° -> 0.86
  }
  return 0.86 + ((p - 46) / 12) * 0.05; // +58° -> 0.91
}

export function horizonToPitch(horizonY) {
  const h = clamp(horizonY, 0.32, 0.91);
  if (h <= 0.52) {
    return ((h - 0.52) / 0.20) * 18;
  }
  if (h <= 0.86) {
    return ((h - 0.52) / 0.34) * 46;
  }
  return 46 + ((h - 0.86) / 0.05) * 12;
}

// 峰顶 v 坐标反推 peakScale（便于画布直接上下拖动峰顶）
export function peakTopToScale(targetTopY, pitch) {
  const horizonY = pitchToHorizon(pitch);
  const footY = clamp(horizonY + 0.055, 0.37, 0.935);
  const elevGain = 0.48 + 0.43 * clamp((horizonY - 0.32) / 0.56, 0, 1);
  const desiredSpan = clamp(footY - targetTopY, 0.10, footY - 0.02);
  return clamp(desiredSpan / elevGain, 0.20, 0.96);
}

// 核心单真源几何与诊断计算
export function evaluateScroll(state) {
  const pitch = clamp(state.pitch, -18, 58);
  const peakScale = clamp(state.peakScale, 0.20, 0.96);
  const mist = clamp(state.mist, 0, 0.92);
  const baseRef = BASE_REFS[state.baseRef] ? state.baseRef : "humble";

  const horizonY = pitchToHorizon(pitch);
  const footY = clamp(horizonY + 0.055, 0.37, 0.935);

  // 视角抬升越高，主峰的纵向透视展开越充分；俯视时山体在画框内呈短矮压缩
  const elevGain = 0.48 + 0.43 * clamp((horizonY - 0.32) / 0.56, 0, 1);
  const rawSpan = peakScale * elevGain;
  const peakTopY = clamp(footY - rawSpan, 0.02, footY - 0.11);
  const spanRatio = footY - peakTopY;
  const headroom = peakTopY;

  // 日轮位置随天头微调：天头充足时悬在峰顶上方气口；顶天窒息时被峰尖逼撞
  const sunY = clamp(Math.min(0.085, headroom * 0.48), 0.048, 0.095);
  const sunCollision = peakTopY < sunY + 0.045;

  // 山腰烟霞中心与厚度
  const mistCenterY = footY - spanRatio * 0.36;
  const mistBandHeight = mist > 0.02 ? (0.04 + mist * 0.28) * clamp(spanRatio / 0.55, 0.55, 1.15) : 0;

  // 低处尺度参比与主峰体量反差
  const refInfo = BASE_REFS[baseRef];
  const refHeight = refInfo.refHeight;
  const scaleContrast = refHeight > 0 ? spanRatio / refHeight : 0;

  // 四项经验验收判定
  const okBase = horizonY >= BANDS.horizonMin && horizonY <= BANDS.horizonMax && pitch >= BANDS.pitchMin;
  const okAscent = spanRatio >= BANDS.spanMin && headroom >= BANDS.headroomMin && headroom <= BANDS.headroomMax;
  const okMist = mist >= BANDS.mistMin && mist <= BANDS.mistMax;
  const okScale = baseRef === "humble" && scaleContrast >= 6.0;

  const checks = {
    base: {
      ok: okBase,
      label: "仰视低基",
      stateText:
        horizonY < 0.50
          ? "俯视偏高"
          : horizonY < BANDS.horizonMin
            ? "平视居中"
            : horizonY > BANDS.horizonMax
              ? "压底过紧"
              : `压低 ${Math.round(horizonY * 100)}%`,
    },
    ascent: {
      ok: okAscent,
      label: "垂直拔势",
      stateText:
        headroom < BANDS.headroomMin
          ? "顶天窒息"
          : spanRatio < BANDS.spanMin
            ? `仅占 ${Math.round(spanRatio * 100)}%`
            : headroom > BANDS.headroomMax
              ? "天头过空"
              : `升程 ${Math.round(spanRatio * 100)}%`,
    },
    mist: {
      ok: okMist,
      label: "烟霞断腰",
      stateText:
        mist < BANDS.mistMin
          ? "尽出粘连"
          : mist > BANDS.mistMax
            ? "浓雾吞峰"
            : `锁腰 ${Math.round(mist * 100)}%`,
    },
    scale: {
      ok: okScale,
      label: "低处为辅",
      stateText:
        baseRef === "giant"
          ? `巨树 ${scaleContrast.toFixed(1)}×`
          : baseRef === "none"
            ? "空脚无尺"
            : `反差 ${scaleContrast.toFixed(1)}×`,
    },
  };

  const passCount = [okBase, okAscent, okMist, okScale].filter(Boolean).length;

  // 原海报三枚圆形徽标映射（单真源联动）
  const medallions = {
    lookup: okBase,                     // 仰视高峰
    vertical: okAscent,                 // 垂直上升
    majesty: okMist && okScale,         // 气势开张
  };

  // 气势档位（用诚实档位而非假精确分数）
  let auraTier = "极弱";
  if (passCount === 4) auraTier = "峻拔";
  else if (passCount === 3) auraTier = "拔起";
  else if (passCount >= 1 && horizonY >= 0.58) auraTier = "渐升";
  else auraTier = "偏平";

  // 诊断优先级：先揪出最破坏高远法的失误，说清「为什么」与「怎么调」
  let fault = "pass";
  let tag = "4/4 高远成势";
  let headline = "低基仰望、烟霞锁腰，主峰突兀清明";
  let detail = `山脚地平线压低至画幅 ${Math.round(horizonY * 100)}% 处（仰角 +${Math.round(pitch)}°），主峰垂直攀升 ${Math.round(spanRatio * 100)}% 并留出 ${Math.round(headroom * 100)}% 天头气口；云带轻锁山腰，低处矮松与石阶把孤峰反衬出 ${scaleContrast.toFixed(1)}× 的体量差。`;
  let action = "可切换「北宋溪山 / 现代摩天」验看同一骨法，或故意把地平线抬高、撤掉烟霞观察高远势如何瓦解。";
  let severity = "ok";

  if (headroom < BANDS.headroomMin) {
    fault = "choked";
    severity = "err";
    tag = `错态 · 顶天窒息 (${passCount}/4)`;
    headline = `峰顶逼死上框，天头只剩 ${Math.round(headroom * 100)}%`;
    detail = "把山峰拔到顶破画缘、撞进上方日轮，视线一抬头就撞墙。郭熙讲高远要「开阔」，主峰上方必须留出 10%–24%（经验参考）的天头余气，仰望之势才能顺峰尖冲进虚空。";
    action = "在画布里把峰顶节点略微向下收，或把底沿仰角卷轴稍微往左退回至 +30°–+42°。";
  } else if (horizonY < BANDS.horizonMin) {
    fault = "high-horizon";
    severity = "err";
    tag = `错态 · ${horizonY < 0.50 ? "俯视倒置" : "平视乏势"} (${passCount}/4)`;
    headline =
      horizonY < 0.50
        ? `地平线抬到 ${Math.round(horizonY * 100)}%，画面反成了高机位俯视`
        : `地平线停在 ${Math.round(horizonY * 100)}%，视线平扫拉不出仰势`;
    detail =
      horizonY < 0.50
        ? `当前仰角为 ${Math.round(pitch)}°，大片坡地摊满画幅下半，山体被压在半空。海报常口语说「抬升视平线」，其实抬升的是仰望的视线；画面里的地平线反而要压低到 70%–85%，才能「自山下而仰山巅」。`
        : "地平线卡在画幅中腰，天地几乎对半分，接近平远而非高远。想让观者觉得自己站在山脚抬头望，必须继续把地平线往下压。";
    action = "向右推动画心底部的「仰角卷轴」，把山脚基线压低至画幅下部 70%–85%（仰角 +22° 以上）。";
  } else if (horizonY > BANDS.horizonMax) {
    fault = "too-low-base";
    severity = "warn";
    tag = `偏态 · 山脚过浅 (${passCount}/4)`;
    headline = `山脚被挤在底缘 ${Math.round(horizonY * 100)}%，缺少立足石阶`;
    detail = "压低地平线不是把山脚裁出画外。底部需要留出约 12%–24% 的近坡与石阶作为观者立足的「低处为辅」，视线才有出发的起点。";
    action = "把仰角卷轴微往左收，让地平线回到 72%–85% 舒适带。";
  } else if (spanRatio < BANDS.spanMin) {
    fault = "short-peak";
    severity = "err";
    tag = `错态 · 矮峰乏势 (${passCount}/4)`;
    headline = `主峰垂直升程仅 ${Math.round(spanRatio * 100)}%，撑不起突兀气势`;
    detail = "山脚虽已压低，但主峰过矮，上方留出过半空天，视线刚沿石阶向上走两步就断了。高远法需要主峰垂直跨度达到画高的 48%–73%（经验参考），形成陡峻的向上牵引。";
    action = "在立轴画心中向上拖动「峰顶」圆标，或拉高「主峰拔势」滑块，使峰尖伸至距顶 14%–22%。";
  } else if (mist < BANDS.mistMin) {
    fault = "no-mist";
    severity = "err";
    tag = `错态 · 全山尽出 (${passCount}/4)`;
    headline = "山体从脚到顶全无云雾，近中远贴成一块死板";
    detail = "郭熙《林泉高致》直言：「山欲高，尽出之则不高，烟霞锁其腰，则高矣。」当山脚、山腰、主峰毫无断层地连在一起，人眼瞬间量尽全貌，高度感立刻缩水。";
    action = "拉动「烟霞锁腰」至 28%–60%，或在画心拖动山腰云带，让清岚横截山腰、隐去部分接缝。";
  } else if (mist > BANDS.mistMax) {
    fault = "fog-drown";
    severity = "err";
    tag = `错态 · 浓雾吞峰 (${passCount}/4)`;
    headline = `烟霞过浓（${Math.round(mist * 100)}%），吞没了高远的「清明」峰脊`;
    detail = "郭熙论三远色相说「高远之色清明，深远之色重晦」。云雾只宜轻锁山腰制造断层，若铺满大半山体，峻峭的峰骨与向上引视线都会被白雾吃掉。";
    action = "把「烟霞锁腰」收回到 30%–58%，让上部主峰重新显出朗润棱面。";
  } else if (!okScale) {
    fault = baseRef === "giant" ? "giant-tree" : "no-scale";
    severity = "err";
    tag = `错态 · ${baseRef === "giant" ? "低处喧宾" : "无尺不显高"} (${passCount}/4)`;
    headline =
      baseRef === "giant"
        ? `近景巨树高达主峰近半，体量反差仅 ${scaleContrast.toFixed(1)}×`
        : "山脚空无参照物，大脑量不出这座山究竟有多高";
    detail =
      baseRef === "giant"
        ? "前景树木冲到半山腰，直接破坏了「高处为主、低处为辅」的体量秩序，观者的眼睛会拿树高去折算山高，主峰瞬间变矮。"
        : "没有松木、石阶或微渺行旅作标尺，一座孤峰在画纸上既像百丈绝壁，也像案头盆景。放进低处微小参照物，主峰立刻拔起十倍体量。";
    action = "把「低处参比」切换到「矮松拾级」，让微小针松、浅石阶与行旅剪影稳守山脚。";
  }

  return {
    pitch,
    peakScale,
    mist,
    baseRef,
    horizonY,
    footY,
    peakTopY,
    spanRatio,
    headroom,
    sunY,
    sunCollision,
    mistCenterY,
    mistBandHeight,
    scaleContrast,
    checks,
    medallions,
    passCount,
    auraTier,
    fault,
    severity,
    tag,
    headline,
    detail,
    action,
  };
}

// 02 节：四层山景复选栈独立评估
export function evaluateLayers(layers) {
  const { base, mist, peak, guide } = layers;
  const count = [base, mist, peak, guide].filter(Boolean).length;
  let tier = "空纸";
  let note = "四层皆空，只余一张未着墨的宣绢。依次点开各层，看高远之势如何逐级长出来。";
  if (count === 4) {
    tier = "峻拔完整";
    note = "低处矮松石阶定尺度、山腰烟霞断粘连、清明孤峰拔天际、中轴导视线引目光直上——四层齐备，高远之势最足。";
  } else if (peak && !mist && base) {
    tier = "偏实偏矮";
    note = "缺少「山腰云岚」断腰，山脚到峰顶全盘尽出。对照郭熙「尽出之则不高」，再勾回云岚看看峰尖是否立刻显高。";
  } else if (peak && mist && !base) {
    tier = "悬空无尺";
    note = "去掉「近山石阶与矮松」，峰顶虽在云上，却失去了立足起点与比例尺，观者分不清这是千仞奇峰还是云边小石。";
  } else if (base && mist && !peak) {
    tier = "群丘平伏";
    note = "只有近坡与云带而无突兀主峰，视线在山腰横漂，无法产生向上的崇高牵引。";
  } else if (peak && mist && base && !guide) {
    tier = "峻拔（含蓄）";
    note = "宋画真迹往往不画明线，而是靠石阶、瀑布与峰脊走势暗藏向上导引；加上金色导视线能一眼看清视线攀升轨迹。";
  } else if (count >= 1) {
    tier = "雏形未全";
    note = "单靠一两层尚不足以托出高远气势：至少需要「低处参比 + 烟霞断腰 + 清明主峰」三者配合。";
  }
  return { count, tier, note };
}

// 03 节：画幅比例 × 天头留白评估
export const ASPECTS = [
  { id: "16:9", label: "16:9 横幅", w: 16, h: 9, ratio: 16 / 9, desc: "横向铺陈占优，纵向跑道极短，主峰难施展。" },
  { id: "4:3", label: "4:3 标准", w: 4, h: 3, ratio: 4 / 3, desc: "偏稳重均衡，可做中景仰望，但峻拔感较含蓄。" },
  { id: "3:4", label: "3:4 海报", w: 3, h: 4, ratio: 3 / 4, desc: "原海报与竖版书封常用比例，垂直引导从容有力。" },
  { id: "9:16", label: "9:16 竖轴", w: 9, h: 16, ratio: 9 / 16, desc: "接近北宋挂轴与手机满屏，垂直升程发挥到极致。" },
];

export function evaluateRatio(aspectId, headroomPct) {
  const aspect = ASPECTS.find((a) => a.id === aspectId) || ASPECTS[2];
  const hr = clamp(headroomPct, 2, 46);
  const isWide = aspect.ratio > 1.15;
  let verdict = "舒朗峻拔";
  let severity = "ok";
  let text = `${aspect.label} 留出 ${hr}% 天头：主峰垂直升程舒展，峰尖上方有余气承接仰望视线。`;

  if (hr < 9) {
    verdict = "顶天窒息";
    severity = "err";
    text = `天头仅剩 ${hr}%，峰尖几乎顶破画框上沿，空间被天花板锁死，崇高感反变成压迫憋闷。`;
  } else if (hr > 30) {
    verdict = "空天压矮";
    severity = "warn";
    text = `上方空出 ${hr}% 的天幕，主峰被压回画幅下半，变成「天空为主、矮山垫底」，高远牵引明显变弱。`;
  } else if (isWide) {
    verdict = "横幅掣肘";
    severity = "warn";
    text = `即便天头留了 ${hr}%，${aspect.label} 的短纵边仍大幅压缩了主峰的垂直跑道，左右大块留白更适合平远而非高远。`;
  }
  return { aspect, headroom: hr / 100, hr, verdict, severity, text };
}

// 04 节：经典史料与真实藏品比例（均经馆藏资料核实）
export const HISTORY_ITEMS = [
  {
    id: "fankuan",
    era: "北宋前期",
    year: "约 1000 年前后",
    work: "范宽《谿山行旅图》",
    spec: "绢本浅设色 · 纵 206.3 × 横 103.3 cm（约 2.0 : 1）",
    museum: "台北国立故宫博物院藏",
    ratioW: 103.3,
    ratioH: 206.3,
    horizonY: 0.77,
    peakTopY: 0.08,
    mistY: 0.62,
    summary: "迎面立起占画幅近三分之二的巨碑主峰，山脚以烟岚截断近坡，树荫下藏着极小的行旅驴队——用千百倍体量差把「自山下而仰山巅」推向极致。",
    structure: "三段式：底部近石行旅（约 22%）→ 山腰浓岚与细瀑断层 → 堂堂主峰占上部三分之二。",
  },
  {
    id: "guoxi",
    era: "北宋熙宁五年",
    year: "1072 年",
    work: "郭熙《早春图》与《林泉高致》",
    spec: "绢本浅设色 · 纵 158.3 × 横 108.1 cm（约 1.46 : 1）",
    museum: "台北国立故宫博物院藏",
    ratioW: 108.1,
    ratioH: 158.3,
    horizonY: 0.80,
    peakTopY: 0.13,
    mistY: 0.52,
    summary: "郭熙口述、其子郭思编纂的《林泉高致·山水训》（附政和七年 1117 年许光凝序）首次系统定名「高远、深远、平远」。《早春图》中轴以 S 形高远主峰冲顶，烟霞锁腰，两侧兼融深远与平远。",
    structure: "中轴 S 形盘旋拔升，卷云山石间留白成岚雾，底部寒林舟楫压低立足点。",
  },
  {
    id: "litang",
    era: "北宋宣和六年",
    year: "1124 年",
    work: "李唐《万壑松风图》",
    spec: "绢本设色 · 纵 188.7 × 横 139.8 cm（约 1.35 : 1）",
    museum: "台北国立故宫博物院藏",
    ratioW: 139.8,
    ratioH: 188.7,
    horizonY: 0.78,
    peakTopY: 0.10,
    mistY: 0.56,
    summary: "以峻利斧劈皴刻画硬朗山骨，把苍翠松林拉到近前山谷，泉水穿石而下，引导目光沿峡谷与主峰峭壁垂直攀升，承启北宋巨碑到南宋近景的转折。",
    structure: "近景巨松与飞泉聚拢视线，烟岚托起中轴陡峭主峰，质感清明硬朗。",
  },
  {
    id: "modern",
    era: "当代设计",
    year: "建筑海报与竖屏开屏",
    work: "摩天立面、展览海报与移动端竖屏",
    spec: "常见 3:4 海报 / 9:16 竖屏",
    museum: "当代视觉与 UI 实践",
    ratioW: 9,
    ratioH: 16,
    horizonY: 0.84,
    peakTopY: 0.15,
    mistY: 0.55,
    summary: "高远法并未留在古画里：仰拍摩天大楼、火箭发射海报、音乐节竖屏主视觉，凡是要造出「仰望、仪式感与纵高气魄」的页面，底层骨架仍是压低地平线、拉长纵轴、顶留气口。",
    structure: "底部压实导航或微渺街景，中轴主视觉拔升，顶部干净留白给标题与标志。",
  },
];

// 05 节：同一小类（315–320）六法对比
export const FAMILY_METHODS = [
  {
    id: "315",
    name: "高远法",
    en: "HIGH DISTANCE",
    current: true,
    angle: 35,
    quote: "自山下而仰山巅，其势突兀，其色清明。",
    role: "压低立足点、拉长垂直升程，营造仰望、崇高与向上牵引（本页）。",
    url: null,
  },
  {
    id: "316",
    name: "深远法",
    en: "DEEP DISTANCE",
    current: false,
    angle: -16,
    quote: "自山前而窥山后，其意重叠，其色重晦。",
    role: "目光越过前山向幽谷重峦深处层层穿入，重纵深幽邃而非垂直拔高。",
    url: "https://layout.xiaoxiaodong.ai/316/play/",
  },
  {
    id: "317",
    name: "平远法",
    en: "LEVEL DISTANCE",
    current: false,
    angle: 0,
    quote: "自近山而望远山，其意冲融而缥缥缈缈。",
    role: "以水平延展与淡远水岸拉开辽阔感，情绪安静舒缓，与高远的突兀互补。",
    url: "https://layout.xiaoxiaodong.ai/317/play/",
  },
  {
    id: "318",
    name: "三远综合构图",
    en: "INTEGRATED THREE DISTANCES",
    current: false,
    angle: 18,
    quote: "一幅之中兼融高、深、平三远，统筹全景气象。",
    role: "如郭熙《早春图》，主峰走高远、峡谷走深远、远水走平远，靠分工协调整张大画。",
    url: "https://layout.xiaoxiaodong.ai/318/play/",
  },
  {
    id: "319",
    name: "散点透视",
    en: "SCATTERED PERSPECTIVE",
    current: false,
    angle: 8,
    quote: "打破单一固定消逝点，以移动视点组织多处空间。",
    role: "不锁死单相机机位，让观者随画幅移动切换观察高度，是三远法背后的空间法则。",
    url: "https://layout.xiaoxiaodong.ai/319/play/",
  },
  {
    id: "320",
    name: "游观式构图",
    en: "STROLLING COMPOSITION",
    current: false,
    angle: 12,
    quote: "铺设可行、可望、可游、可居的动线与停驻点。",
    role: "侧重设计眼睛在长卷或长页中「步移景换」的连续游览路线与时间节奏。",
    url: "https://layout.xiaoxiaodong.ai/320/play/",
  },
];

// 07 节：单变量四选一小练习（四个选项与答案 C 只差一个变量，标签绝不剧透）
export const QUIZ_OPTIONS = [
  {
    key: "A",
    label: "方案 A",
    state: { scene: "poster", pitch: 34, peakScale: 0.76, mist: 0.0, baseRef: "humble", showGuides: false },
    correct: false,
    variable: "烟霞锁腰",
    feedback: "山脚压低、天头留白与低处矮松都对了，但唯独撤去了山腰烟霞。全山从脚到顶实打实粘成一块，应了郭熙「尽出之则不高」。",
  },
  {
    key: "B",
    label: "方案 B",
    state: { scene: "poster", pitch: 36, peakScale: 0.95, mist: 0.44, baseRef: "humble", showGuides: false },
    correct: false,
    variable: "天头留白",
    feedback: "地平线、烟霞与比例尺都对，唯独主峰尖顶死画框上沿（天头仅剩约 2%），画面失去开阔气口，仰望变成顶天花板的窒息感。",
  },
  {
    key: "C",
    label: "方案 C",
    state: { scene: "poster", pitch: 34, peakScale: 0.76, mist: 0.44, baseRef: "humble", showGuides: false },
    correct: true,
    variable: "四要素齐备",
    feedback: "选对了。山脚压低至画幅下部，云烟轻锁山腰形成清晰断层，主峰峻拔又在顶沿留出舒朗天头气口，山脚微小矮松与石阶把孤峰反衬得气象开张。",
  },
  {
    key: "D",
    label: "方案 D",
    state: { scene: "poster", pitch: -8, peakScale: 0.36, mist: 0.44, baseRef: "humble", showGuides: false },
    correct: false,
    variable: "山脚地平线高度",
    feedback: "云烟、比例尺与天头都没问题，唯独把地平线抬高到画幅中上方（约 43% 处），下半幅摊成俯瞰坡地，垂直升程大缩水，变成了高机位平俯视。",
  },
];
