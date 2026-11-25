// 317 平远法 · 单一真源数据与诊断模型
// 画面里画出的展幅宽比、地平线倾角/高度、三道横带坐标、远近明晦色值与读数完全共用此模块。

export const PALETTE = {
  paper: "#DAE0D5",
  paperLight: "#F2F5EF",
  paperWarm: "#E9EDE5",
  paperSage: "#CFD7CA",
  darkRoom: "#14291F",
  ink: "#141B18",
  horizonInk: "#0F2617",
  inkSoft: "#2E3D34",
  inkMuted: "#47594D",
  pine: "#1D3F2F",
  pineDeep: "#183D2C",
  sage: "#ABB7A5",
  sageText: "#465B4B",
  vermilion: "#DB6841",
  vermilionPeak: "#DE582F",
  vermilionText: "#9F3B1B",
  err: "#A82D1E",
  errDark: "#F48C72",
  ok: "#1A4A35",
  okDark: "#7AD1A8",
  silk: "#C7CFC0",
  silkEdge: "#8C9887",
};

export const SCENES = {
  poster: {
    id: "poster",
    name: "原海报平远",
    sub: "青灰素宣 · 落日与三道横带",
    skyTop: "#DCE2D7",
    skyBot: "#D7DDD2",
    waterBg: "#DAE0D5",
    farBase: [24, 48, 36],
    nearBar: "#1D3F2F",
    midBar: "#ABB7A5",
    accentBar: "#DB6841",
    sunColor: "#DE582F",
    ridgeSeed: 1,
  },
  song: {
    id: "song",
    name: "宋元江渚",
    sub: "一河两岸 · 枯木沙洲与远岫",
    skyTop: "#E3E5DB",
    skyBot: "#D9DDD2",
    waterBg: "#DCE0D5",
    farBase: [30, 44, 38],
    nearBar: "#22382D",
    midBar: "#9AA594",
    accentBar: "#C95E38",
    sunColor: "#D4653E",
    ridgeSeed: 2,
  },
  cinema: {
    id: "cinema",
    name: "宽银幕原野",
    sub: "2.35:1 视域 · 暮云荒原与平川",
    skyTop: "#D5DDD3",
    skyBot: "#CBD5C9",
    waterBg: "#D4DCD1",
    farBase: [18, 39, 31],
    nearBar: "#173427",
    midBar: "#97A596",
    accentBar: "#DB6137",
    sunColor: "#E05A2E",
    ridgeSeed: 3,
  },
};

export const OBSTACLE_SPECS = [
  { id: 0, u: 0.29, w: 0.042, h: 0.44, label: "左竖岩柱" },
  { id: 1, u: 0.53, w: 0.052, h: 0.52, label: "中央高障" },
  { id: 2, u: 0.72, w: 0.038, h: 0.40, label: "右竖杂标" },
];

export const BAR_WIDTHS = {
  pine: 0.42,
  sage: 0.34,
  vermilion: 0.11,
};

export function createBrokenState(scene = "poster") {
  return {
    scene,
    openRatio: 0.24,      // 0.22..1.00，初始挤成窄竖缝
    horizonY: 0.24,       // 0.20..0.80，初始偏高呈俯视压迫
    tiltDeg: 9.0,         // -14..+14，初始倾歪 +9°
    haze: 6,              // 0..100，初始远山焦黑无明晦
    obstacles: [true, true, true],
    bars: {
      pine: 0.48,         // 0..1 中心 u
      sage: 0.50,
      vermilion: 0.56,
    },
    sunU: 0.81,
  };
}

export function createPosterSolvedState(scene = "poster") {
  return {
    scene,
    openRatio: 0.86,
    horizonY: 0.515,
    tiltDeg: 0,
    haze: 64,
    obstacles: [false, false, false],
    bars: {
      pine: 0.265,
      sage: 0.655,
      vermilion: 0.895,
    },
    sunU: 0.81,
  };
}

export function createAlternateSolvedState(kind = "river") {
  if (kind === "river") {
    return {
      scene: "song",
      openRatio: 0.82,
      horizonY: 0.39,
      tiltDeg: 0,
      haze: 70,
      obstacles: [false, false, false],
      bars: { pine: 0.24, sage: 0.64, vermilion: 0.88 },
      sunU: 0.81,
    };
  }
  return {
    scene: "poster",
    openRatio: 0.90,
    horizonY: 0.52,
    tiltDeg: 0,
    haze: 62,
    obstacles: [false, false, false],
    bars: { pine: 0.74, sage: 0.35, vermilion: 0.11 },
    sunU: 0.19,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 依据当前画布实际像素尺寸，算出手卷画心的真实像素矩形与真实纵横比
export function computeScrollRect(canvasW, canvasH, openRatio) {
  const padY = Math.max(10, Math.round(canvasH * 0.065));
  const rollerW = Math.max(16, Math.round(Math.min(28, canvasW * 0.032)));
  const outerPadX = Math.max(8, Math.round(canvasW * 0.02));
  const maxInnerW = Math.max(120, canvasW - (rollerW + outerPadX) * 2);
  // 窄屏下适当控制画心高度，保证卷轴展开后在 390px 手机上依然能走出 >2.2:1 的真横向宽比
  const targetMaxAspect = 2.48;
  const maxHByCanvas = canvasH - padY * 2;
  const minHForMobileAspect = maxInnerW / targetMaxAspect;
  const h = Math.round(
    canvasW < 640
      ? clamp(minHForMobileAspect * 1.06, Math.min(138, maxHByCanvas), maxHByCanvas)
      : clamp(maxHByCanvas, 180, maxInnerW / 2.2)
  );
  const fullW = Math.min(maxInnerW, Math.round(h * 2.68));
  const minW = Math.max(84, Math.round(h * 0.60));
  const t = clamp((openRatio - 0.22) / (1 - 0.22), 0, 1);
  const w = Math.round(minW + (fullW - minW) * t);
  const x = Math.round((canvasW - w) / 2);
  const y = Math.round((canvasH - h) / 2);
  return {
    x,
    y,
    w,
    h,
    rollerW,
    aspect: w / h,
    fullW,
    minW,
  };
}

function srgbLum([r, g, b]) {
  const f = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function lerpRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export const rgbCss = ([r, g, b], a = 1) =>
  a >= 0.999 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a.toFixed(3)})`;

// 远近四层空气透视真实色值（画布渲染与明晦读数完全共用）
export function computeAtmosphere(state) {
  const sc = SCENES[state.scene] || SCENES.poster;
  const paperRgb = [218, 224, 213];
  const nearRgb = sc.farBase; // 深松近景锚点色
  // haze 0..100 -> 远山向纸底融合比例
  const h = clamp(state.haze / 100, 0, 1);
  const farBlend = 0.08 + h * 0.90; // haze=6 -> 0.13 焦黑；haze=64 -> 0.66 缥缈；haze=95 -> 0.94 白茫
  const midFarBlend = 0.05 + h * 0.74;
  const nearRidgeBlend = 0.03 + h * 0.56;

  const farRgb = lerpRgb(nearRgb, paperRgb, clamp(farBlend, 0, 0.99));
  const midFarRgb = lerpRgb(nearRgb, paperRgb, clamp(midFarBlend, 0, 0.97));
  const nearRidgeRgb = lerpRgb(nearRgb, paperRgb, clamp(nearRidgeBlend, 0, 0.92));

  const lumNear = srgbLum(nearRgb);
  const lumFar = srgbLum(farRgb);
  const lumPaper = srgbLum(paperRgb);
  const nearFarDelta = Math.round((lumFar - lumNear) * 100);
  const farPaperGap = Math.round((lumPaper - lumFar) * 100);

  return {
    paperRgb,
    nearRgb,
    nearRidgeRgb,
    midFarRgb,
    farRgb,
    nearFarDelta, // 0..70：近岸到远山的亮度阶差
    farPaperGap,  // 远山相对纸底的可见度差
    edgeBlurAlpha: clamp(1 - h * 0.78, 0.12, 1),
  };
}

// 核算三道横带在画心里的真实排布、重叠与展宽
export function evaluateBars(bars) {
  const clampCenter = (id, cx) => {
    const hw = BAR_WIDTHS[id] / 2;
    return clamp(cx, 0.03 + hw, 0.97 - hw);
  };
  const pC = clampCenter("pine", bars.pine);
  const sC = clampCenter("sage", bars.sage);
  const vC = clampCenter("vermilion", bars.vermilion);

  const seg = (c, w) => ({ l: c - w / 2, r: c + w / 2, c, w });
  const pine = seg(pC, BAR_WIDTHS.pine);
  const sage = seg(sC, BAR_WIDTHS.sage);
  const verm = seg(vC, BAR_WIDTHS.vermilion);

  const overlap = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
  const row1Overlap = overlap(sage, verm);
  const pineSageOverlapRatio = overlap(pine, sage) / Math.min(pine.w, sage.w);
  const pineVermOverlapRatio = overlap(pine, verm) / Math.min(pine.w, verm.w);

  const minL = Math.min(pine.l, sage.l, verm.l);
  const maxR = Math.max(pine.r, sage.r, verm.r);
  const span = maxR - minL;

  const centroid = (pine.c * 1.0 + sage.c * 0.45 + verm.c * 0.55) / 2.0;
  const collision = row1Overlap > 0.015;
  const stacked = pineSageOverlapRatio > 0.58 && pineVermOverlapRatio > 0.55;
  const bunched = span < 0.70 || Math.abs(centroid - 0.5) > 0.22;
  const pass = !collision && !stacked && !bunched;

  return {
    pine,
    sage,
    verm,
    row1Overlap,
    pineSageOverlapRatio,
    span,
    centroid,
    collision,
    stacked,
    bunched,
    pass,
  };
}

// 核心单真源评测：给出 4 项支柱状态、主诊错态/合法解流派与精准白话说明
export function evaluateHero(state, canvasW = 1280, canvasH = 340) {
  const rect = computeScrollRect(canvasW, canvasH, state.openRatio);
  const atmo = computeAtmosphere(state);
  const bars = evaluateBars(state.bars);
  const activeObstacles = state.obstacles.filter(Boolean).length;

  const aspectOk = rect.aspect >= 1.55;
  const breadthOk = aspectOk && bars.pass;

  const tiltOk = Math.abs(state.tiltDeg) <= 1.2;
  const horizonBandOk = state.horizonY >= 0.34 && state.horizonY <= 0.66;
  const horizonOk = tiltOk && horizonBandOk;

  const calmOk = activeObstacles === 0;
  const toneOk = state.haze >= 36 && state.haze <= 84;

  const passedCount = [breadthOk, horizonOk, calmOk, toneOk].filter(Boolean).length;

  // 判定当前最关键的一项失误（按视觉破坏优先级）或已达成的平远解流派
  let code = "ok";
  let badge = "4 / 4 冲融平远";
  let headline = "水平展开、明晦递淡，平远秩序已立";
  let why = "";
  let hint = "";
  let variant = "原海报平衡解";

  if (!aspectOk) {
    code = "narrow";
    badge = `错态 · 窄幅憋闷 (${passedCount} / 4)`;
    headline = `画幅宽比只有 ${rect.aspect.toFixed(2)}:1，横向视线刚起就被截断`;
    why = "左右绫边把视域挤成竖条，眼睛刚想顺着水平线往两侧舒展就撞上边框，完全出不来平远法「横向延展、放大画面宽度」的开阔基底。";
    hint = "向右拖动「手卷展平轴尺」（或直接外拉画布左右卷轴），把画幅展宽至 1.55:1 以上。";
  } else if (!tiltOk) {
    code = "tilted";
    badge = `错态 · 地平倾斜 (${passedCount} / 4)`;
    headline = `地平线倾斜 ${state.tiltDeg > 0 ? "+" : ""}${state.tiltDeg.toFixed(1)}°，水面与远山像在滑落`;
    why = "前庭与视觉系统对水平偏斜极其敏感，哪怕 3° 以上的倾角就会让水面产生倾倒感与不安感，直接瓦解「均衡与安定」。";
    hint = "点按「校平 0°」或拖动地平线右端倾角柄，把水平线稳稳校回 0.0°。";
  } else if (state.horizonY < 0.34) {
    code = "high_pitch";
    badge = `错态 · 高俯压迫 (${passedCount} / 4)`;
    headline = `地平线抬高到 ${Math.round(state.horizonY * 100)}%，画面被压成高空俯视`;
    why = "地平线贴近上缘后，整块地面和色带铺满下方三分之二以上，观者像悬在半空向下俯压，失去了「以平视之位」的从容感。";
    hint = "在画布上向下拖动地平线中心标（或调视平高度滑杆），落回 34%–66% 眼平带。";
  } else if (state.horizonY > 0.66) {
    code = "low_pitch";
    badge = `错态 · 仰望转高远 (${passedCount} / 4)`;
    headline = `地平线压低到 ${Math.round(state.horizonY * 100)}%，重心滑向了高远仰视`;
    why = "把地平线压得过低会腾出大片天空、压缩近水与横岸，画面的气质开始转向 315 高远法的「自山下而仰山颠」，平阔水域的依托变薄。";
    hint = "把地平线往上轻抬至 34%–66% 之间，让近岸横带与远天都能呼吸。";
  } else if (!calmOk) {
    code = "cluttered";
    badge = `错态 · 杂竖断线 (${passedCount} / 4)`;
    headline = `还有 ${activeObstacles} 处竖向杂障刺穿地平线，宁静被切碎`;
    why = "平远法靠一条不间断的水平线带动眼睛平缓滑行；几根高耸竖块直接横插在远山与水面之间，视线每走两步就被迫刹车跳跃。";
    hint = "直接在画布上点击红色标出的竖向杂障将它撤去（或点「清去杂障」）。";
  } else if (!bars.pass) {
    code = "bunched";
    badge = `错态 · 横带挤叠 (${passedCount} / 4)`;
    headline = bars.collision
      ? "烟灰中洲与朱橙点睛在同层撞叠，横带节奏发堵"
      : `三道横带只展开了 ${Math.round(bars.span * 100)}% 宽度，挤成一团`;
    why = "原海报下面三条长短、深浅各异的横带，是用来把视线平稳拉向画幅两端的视觉压舱石；挤在中央会让宽卷两侧空虚、中间发沉。";
    hint = "在画布上左右拖动深松近岸、烟灰中洲与朱橙点睛三条横带，错落拉开至 ≥70% 跨度且互不撞叠。";
  } else if (state.haze < 36) {
    code = "flat_dark";
    badge = `错态 · 远山焦黑 (${passedCount} / 4)`;
    headline = `空气淡化仅 ${Math.round(state.haze)}%，远山与近岸同黑贴成一堵墙`;
    why = "郭熙说「平远之色，有明有晦」。远山如果不随空气衰减变淡变柔，就会和近岸深松抢在同一平面上，十里烟波立刻塌成扁平贴纸。";
    hint = "把「远近明晦」向右推入 36%–84% 冲融带，让远山逐层淡入青灰雾气。";
  } else if (state.haze > 84) {
    code = "washed_out";
    badge = `错态 · 白雾吞山 (${passedCount} / 4)`;
    headline = `空气淡化飙到 ${Math.round(state.haze)}%，远山融进纸底无影无踪`;
    why = "「减少干扰」不等于一片空白。远山彻底消失后，「自近山而望远山」失去了远景落点，开阔感会滑向空洞与失焦。";
    hint = "把「远近明晦」往左收回 36%–84%，保留若隐若现的淡青远岫轮廓。";
  } else {
    // 多合法解识别
    if (bars.pine.c > 0.56) {
      variant = "左阳右岸镜像解";
      headline = "重墨压右、朱点映左——镜像反转照样成立的平远格局";
      why = `平远法并不锁死单一摆法。你把深松近岸稳放在右侧、朱橙与烟灰向左展开（总跨度 ${Math.round(bars.span * 100)}%），配合 0° 水平线与空气明晦，照样立住平和开阔的空间。`;
    } else if (state.horizonY <= 0.44) {
      variant = "一河两岸展水解";
      headline = "高平展水、宽卷开阔——这是倪瓒式的平远气韵";
      why = `当前画幅 ${rect.aspect.toFixed(2)}:1、地平线稳停在 ${Math.round(state.horizonY * 100)}%（水平 0°），大面积水面配合 ${Math.round(bars.span * 100)}% 横带跨度与 ΔL ${atmo.nearFarDelta} 明晦递减，视线顺水平漫开，极显静旷。`;
    } else if (state.horizonY >= 0.58) {
      variant = "低平开天解";
      headline = "低平开天、归鸿远去——广阔天幕里的平远秩序";
      why = `画幅展开到 ${rect.aspect.toFixed(2)}:1、地平线沉稳在 ${Math.round(state.horizonY * 100)}%，宽广天空承接飞鸟与远岫，下方三道横带错落托底，既不抢戏又不失重。`;
    } else {
      variant = "原海报平衡解";
      headline = "平阔、安定、有明有晦——原海报平远格局已完整立住";
      why = `画幅宽比 ${rect.aspect.toFixed(2)}:1、地平线 ${Math.round(state.horizonY * 100)}% 精准水平，三道横带拉开 ${Math.round(bars.span * 100)}% 跨度且零杂障，近岸到远山留出 ΔL ${atmo.nearFarDelta} 空气明晦差，视线自然平稳延展。`;
    }
    hint = "你还可以试着把地平线轻调到 38%（一河两岸）或 60%（低平开天），或者把深松近岸拖到另一侧，验证平远法允许多种平衡解。";
  }

  return {
    rect,
    atmo,
    bars,
    activeObstacles,
    passedCount,
    allPassed: passedCount === 4,
    code,
    badge,
    variant,
    headline,
    why,
    hint,
    pillars: {
      breadth: {
        ok: breadthOk,
        status: !aspectOk
          ? `窄幅 ${rect.aspect.toFixed(2)}:1`
          : !bars.pass
            ? (bars.collision ? "横带撞叠" : `跨度 ${Math.round(bars.span * 100)}%`)
            : `${rect.aspect.toFixed(2)}:1 · 跨 ${Math.round(bars.span * 100)}%`,
      },
      horizon: {
        ok: horizonOk,
        status: !tiltOk
          ? `倾斜 ${state.tiltDeg > 0 ? "+" : ""}${state.tiltDeg.toFixed(1)}°`
          : !horizonBandOk
            ? `${Math.round(state.horizonY * 100)}% 越带`
            : `0.0° · 位 ${Math.round(state.horizonY * 100)}%`,
      },
      calm: {
        ok: calmOk,
        status: calmOk ? "无竖障 · 通畅" : `${activeObstacles} 处断线`,
      },
      tone: {
        ok: toneOk,
        status: state.haze < 36
          ? `焦黑 ΔL ${atmo.nearFarDelta}`
          : state.haze > 84
            ? `白茫 ΔL ${atmo.nearFarDelta}`
            : `冲融 ΔL ${atmo.nearFarDelta}`,
      },
    },
  };
}

// ---------- 第 01 节：4 种地平线落位与双眼扫视对照 ----------
export const VISION_MODES = [
  {
    id: "dead-center",
    label: "均分 50%（无错落）",
    horizon: 0.50,
    asymmetric: false,
    skyPct: 50,
    groundPct: 50,
    feel: "生硬对切",
    verdict: "地平线刚好卡在正中，上下份量又完全一样，画面像被直尺一刀裁成两块无关的拼板，眼睛不知道该留在天上还是水上。",
    sweep: "视线来回摇摆，找不到主从",
  },
  {
    id: "poster-balance",
    label: "海报 52% + 错落横带",
    horizon: 0.515,
    asymmetric: true,
    skyPct: 52,
    groundPct: 48,
    feel: "冲融平衡",
    verdict: "317 原海报把地平线稳放在 51.5% 附近，却绝不显呆板：秘诀在于上方大留白配轻烟远山与小落日，下方用深松长条、烟灰细条和朱橙短块错落压阵，以不对称打破对切感。",
    sweep: "沿水平线平稳右移至朱阳，再沿横带缓缓回落",
  },
  {
    id: "upper-water",
    label: "高平 38%（一河两岸）",
    horizon: 0.38,
    asymmetric: true,
    skyPct: 38,
    groundPct: 62,
    feel: "江水浩渺",
    verdict: "将地平线轻抬至上三分一带，大片平缓水面铺展开来，近岸坡石与远岸淡山遥遥相望——正是倪瓒「一河两岸」最拿手的平远写法，连竖幅立轴也能画出万顷烟波。",
    sweep: "视线跨过开阔留白水域，缓慢抵达淡墨远岸",
  },
  {
    id: "low-sky",
    label: "极低 78%（滑向高远）",
    horizon: 0.78,
    asymmetric: true,
    skyPct: 78,
    groundPct: 22,
    feel: "转向仰势",
    verdict: "地平线继续下压到四分之三以下时，水域横岸几乎消失，画面的呼吸重心开始竖向拔高——此时已经进入 315 高远法的领地，不再是平视展开的平远秩序。",
    sweep: "视线由水平铺展转为向上仰冲",
  },
];

// ---------- 第 02 节：四代典例（真实馆藏尺寸与纵横比） ----------
export const HISTORY_WORKS = [
  {
    id: "dongyuan",
    era: "五代南唐",
    year: "10 世纪",
    author: "董源（传）",
    title: "《潇湘图》卷",
    museum: "北京故宫博物院藏",
    dim: "纵 50 × 横 141.4 厘米",
    ratio: 141.4 / 50,
    ratioText: "2.83 : 1 横卷",
    horizon: 0.42,
    summary: "江南平缓丘陵与水泽沙洲绵延展开，以短披麻皴与淡墨点苔替代峻峭斧劈，被明代董其昌推为江南平远山水之源。",
    structure: "近岸水渚低伏 · 中段江面横展 · 远峰柔和起伏",
    kind: "scroll",
  },
  {
    id: "guoxi",
    era: "北宋 · 元丰元年",
    year: "1078 年",
    author: "郭熙",
    title: "《窠石平远图》轴",
    museum: "北京故宫博物院藏",
    dim: "纵 120.8 × 横 167.7 厘米",
    ratio: 167.7 / 120.8,
    ratioText: "1.39 : 1 阔幅",
    horizon: 0.48,
    summary: "郭熙晚年践行「自近山而望远山」理论的传世亲笔（另作约 1080 年《树色平远图》手卷藏纽约大都会艺术博物馆）。近处蟹爪枯枝与窠石浓墨压阵，远处寒烟平峦一望无际。",
    structure: "左下窠石枯树重墨定锚 · 中间清溪开阔 · 远山淡烟一线横列",
    kind: "broad",
  },
  {
    id: "nizan",
    era: "明洪武五年（元末明初）",
    year: "1372 年",
    author: "倪瓒",
    title: "《容膝斋图》轴",
    museum: "台北故宫博物院藏",
    dim: "纵 74.7 × 横 35.5 厘米",
    ratio: 35.5 / 74.7,
    ratioText: "0.48 : 1 竖轴",
    horizon: 0.34,
    summary: "打破「平远只能用横幅」的偏见：72 岁的倪瓒在极窄的竖轴里，用底部近坡茅亭、中间大片空白江水与上部一抹平缓远山，构成后世典范「一河两岸」平远格。",
    structure: "底岸枯树茅亭 · 中段大片留白即平湖 · 上方低缓淡墨远山",
    kind: "vertical",
  },
  {
    id: "cinemascope",
    era: "现代宽银幕",
    year: "1953–1954 年",
    author: "CinemaScope",
    title: "变形宽银幕电影画幅",
    museum: "二十世纪福克斯首推",
    dim: "1953 首映 2.55:1 · 1954 定标 2.35:1",
    ratio: 2.35,
    ratioText: "2.35 : 1 宽银幕",
    horizon: 0.54,
    summary: "1953 年《圣袍千秋》将电影银幕从 1.37:1 骤然拉宽至 2.55:1（1954 年兼容光学声轨定为 2.35:1）。导演不再把人物叠在纵轴上，而是让地平线、建筑与人物沿水平横轴舒展对话。",
    structure: "宽幅横框逼近双眼水平视野 · 水平线贯穿全场 · 前中后景平展分层",
    kind: "cinema",
  },
];

// ---------- 第 03 节：3D 投影立体纸雕景深法则 ----------
export const TONE_LAWS = {
  aerial: {
    id: "aerial",
    label: "有明有晦（空气递淡）",
    layers: [
      { name: "近岸深松", z: 0.08, rgb: [24, 59, 44], h: 0.24, y: 0.72, desc: "浓墨压脚 · 轮廓锐利" },
      { name: "中洲烟灰", z: 0.36, rgb: [112, 134, 118], h: 0.28, y: 0.62, desc: "明度提亮 · 边缘柔和" },
      { name: "远岫淡青", z: 0.68, rgb: [168, 184, 171], h: 0.34, y: 0.54, desc: "融入雾岚 · 缥缥缈缈" },
      { name: "落日天幕", z: 0.96, rgb: [219, 104, 65], h: 0.44, y: 0.44, desc: "一点微暖 · 定住远方" },
    ],
    frontRead: "正面看去层次自然退远，四层间距虽相同，眼睛却读出十里烟波（示意）。",
    depthFeel: "远近分明 · 冲融",
  },
  uniform: {
    id: "uniform",
    label: "墨色均等（远近同重）",
    layers: [
      { name: "近岸深松", z: 0.08, rgb: [26, 56, 42], h: 0.24, y: 0.72, desc: "同为深墨" },
      { name: "中洲山脊", z: 0.36, rgb: [28, 59, 45], h: 0.28, y: 0.62, desc: "毫无淡化" },
      { name: "远岫山脊", z: 0.68, rgb: [30, 62, 47], h: 0.34, y: 0.54, desc: "依旧焦黑" },
      { name: "落日天幕", z: 0.96, rgb: [219, 104, 65], h: 0.44, y: 0.44, desc: "被黑山压死" },
    ],
    frontRead: "侧转时明明隔着四道纵深，一转回 0° 正面就立刻粘成一堵黑墙——失去明晦梯度，物理纵深白白浪费。",
    depthFeel: "贴成平墙 · 失距",
  },
  inverted: {
    id: "inverted",
    label: "远重近轻（明晦倒置）",
    layers: [
      { name: "近岸过淡", z: 0.08, rgb: [174, 188, 176], h: 0.24, y: 0.72, desc: "近景发飘" },
      { name: "中洲偏灰", z: 0.36, rgb: [106, 125, 112], h: 0.28, y: 0.62, desc: "中段反沉" },
      { name: "远山最黑", z: 0.68, rgb: [20, 46, 35], h: 0.34, y: 0.54, desc: "背景反扑眼前" },
      { name: "落日天幕", z: 0.96, rgb: [219, 104, 65], h: 0.44, y: 0.44, desc: "压迫前景" },
    ],
    frontRead: "深重色块天然往眼前冲。把最黑的墨放在最远层，正面一看远山反而压到近岸前面，空间前后翻转。",
    depthFeel: "前后翻转 · 压顶",
  },
};

// ---------- 第 05 节：什么时候别用 · 4 题速判卡 ----------
export const AVOID_CASES = [
  {
    id: "onsen",
    title: "山谷温泉旅宿官网首屏",
    brief: "桌面端通栏头图，希望访客点开 3 秒内卸下焦虑，感受松林与远雾的静谧，只需 1 枚「预约入住」入口。",
    shouldUse: true,
    verdict: "正中平远法下怀。低饱和宽阔地平线、近暗远淡的山影与克制的横向导航条，能瞬间建立松弛、开阔的空间气质。",
    alt: "保持一条干净的眼平水际线，主标靠左，右端留一处暖色微点即可。",
  },
  {
    id: "sale",
    title: "双十一 12 款限时秒杀海报",
    brief: "要在 3 秒内催促下单，同时露出 12 件商品、原价划线、倒计时和满减券。",
    shouldUse: false,
    verdict: "千万别用平远法。平远靠大留白和舒缓水平扫视降噪，强套在促销货架上只会稀释紧迫感、让价格与行动钮淹没在烟波里。",
    alt: "应换用高密度卡片网格或中心聚焦促销版式，把核心折扣推到近景中心。",
  },
  {
    id: "rocket",
    title: "火箭发射纪念竖版海报",
    brief: "表现直刺苍穹的拔地力量、尾焰喷涌与仰望感，核心情绪是「崇高、震撼、向上冲破」。",
    shouldUse: false,
    verdict: "别用平远法。平视横展开阔平和，会把火箭的垂直冲力削平；这种题材必须压低地平线、拉长垂直仰视距离。",
    alt: "改用同小类的 315 高远法，用「自山下而仰山颠」的仰角造崇高气势。",
    linkId: "315",
    linkName: "315 高远法",
  },
  {
    id: "docu",
    title: "湿地候鸟纪录片横幅片头",
    brief: "16:9 与 2.35:1 展映标题页，画面主体是一行掠过芦苇荡与远滩的候鸟，节奏舒缓克制。",
    shouldUse: true,
    verdict: "极适合平远法。宽幅水面天然自带水平基准线，用近景深色芦苇横带托底、中远滩涂逐层淡去，留给候鸟充足的水平飞行去处。",
    alt: "注意把地平线校平至 0°，别让密集字幕柱打断水际线。",
  },
];

// ---------- 第 06 节：单变量 4 选 1 小练习 ----------
// 唯一变量：近中远三层的明晦深浅分配（画幅、地平线 52%、山廓、落日与三横带坐标 100% 相同）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    near: "#1D3F2F",
    mid: "#1E4231",
    far: "#214635",
    explain: "近岸、中洲与远山全都用了同等深松重墨。轮廓看似清晰，但缺少空气衰减，三层贴死在同一焦平面上，看不到远方。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    near: "#1D3F2F",
    mid: "#96A591",
    far: "#C3CBBF",
    explain: "答对了。完全相同的轮廓下，方案 B 严格遵循「近重、中淡、远缥缈」的明晦递减（有明有晦）：深松近岸稳稳压脚，中洲烟灰承接过渡，远山淡青融雾，落日朱橙轻轻点醒远方。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    near: "#C4CCC0",
    mid: "#879682",
    far: "#193A2B",
    explain: "把最重的墨放到最远的山峰、近岸反而极淡，导致明晦倒挂。视觉上重色会往前冲，远山反扑到近岸前面，空间次序颠倒。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    near: "#C5CDC1",
    mid: "#CCD4C8",
    far: "#D3DAD0",
    explain: "全幅都被漂成极浅淡雾，看似极简干净，却因为近处没有深墨锚点压住基底，画面轻飘失重、眼睛量不出近与远的距离。",
  },
];
