// 283 画布工作区布局 · 单一真源数据与几何核算引擎
// 所有面积占比、四原则判定、白话诊单、响应式停靠与菲茨定律示意计算均从此导出。

export const VIRTUAL_W = 1040;
export const VIRTUAL_H = 860;

export const SCENES = {
  poster: {
    id: "poster",
    label: "原海报 · 视觉设计",
    short: "视觉设计",
    canvasBg: "#EDEBE7",
    gridColor: "rgba(22, 28, 31, 0.085)",
    docName: "页面 1 · 视觉海报",
    shapes: [
      { id: "circle", name: "形状 3", kind: "circle", x: 310, y: 260, w: 226, h: 226, rot: 0, fill: "#3B5FC0", alpha: 100, visible: true, locked: false },
      { id: "rect", name: "形状 2", kind: "rrect", x: 790, y: 270, w: 260, h: 260, rot: 0, fill: "#F3B721", alpha: 100, visible: true, locked: false },
      { id: "tri", name: "形状 1", kind: "triangle", x: 420, y: 360, w: 280, h: 180, rot: 0, fill: "#57AE6F", alpha: 84, visible: true, locked: false },
      { id: "sq", name: "矩形 1", kind: "rect", x: 275, y: 745, w: 108, h: 108, rot: 0, fill: "#7F5CB8", alpha: 100, visible: true, locked: false },
      { id: "arch", name: "背景", kind: "arch", x: 795, y: 635, w: 255, h: 320, rot: 0, fill: "#152331", alpha: 96, visible: true, locked: true },
    ],
  },
  illust: {
    id: "illust",
    label: "插画绘制",
    short: "插画绘制",
    canvasBg: "#F3EFE6",
    gridColor: "rgba(32, 39, 36, 0.075)",
    docName: "画板 1 · 山海插画",
    shapes: [
      { id: "circle", name: "落日圆", kind: "circle", x: 740, y: 220, w: 196, h: 196, rot: 0, fill: "#E56B38", alpha: 96, visible: true, locked: false },
      { id: "tri", name: "主山峰", kind: "triangle", x: 460, y: 460, w: 460, h: 320, rot: 0, fill: "#28766E", alpha: 92, visible: true, locked: false },
      { id: "rect", name: "云带", kind: "rrect", x: 310, y: 240, w: 290, h: 74, rot: 0, fill: "#D9C398", alpha: 88, visible: true, locked: false },
      { id: "arch", name: "远陵", kind: "arch", x: 785, y: 620, w: 340, h: 250, rot: 0, fill: "#1A3240", alpha: 94, visible: true, locked: false },
      { id: "sq", name: "印章款", kind: "rect", x: 165, y: 705, w: 86, h: 120, rot: 0, fill: "#B8342A", alpha: 96, visible: true, locked: true },
    ],
  },
  video: {
    id: "video",
    label: "视频包装",
    short: "视频包装",
    canvasBg: "#E6EAEE",
    gridColor: "rgba(18, 28, 40, 0.085)",
    docName: "合成 1 · 1080p 标题卡",
    shapes: [
      { id: "arch", name: "主画框", kind: "rrect", x: 520, y: 390, w: 720, h: 405, rot: 0, fill: "#17232E", alpha: 96, visible: true, locked: true },
      { id: "rect", name: "字幕底条", kind: "rrect", x: 485, y: 645, w: 590, h: 96, rot: 0, fill: "#C8E03B", alpha: 95, visible: true, locked: false },
      { id: "tri", name: "动效箭头", kind: "triangle", x: 250, y: 375, w: 190, h: 170, rot: 90, fill: "#1FB2C5", alpha: 88, visible: true, locked: false },
      { id: "circle", name: "角标徽", kind: "circle", x: 805, y: 255, w: 112, h: 112, rot: 0, fill: "#F3B721", alpha: 100, visible: true, locked: false },
      { id: "sq", name: "时间码块", kind: "rect", x: 225, y: 645, w: 120, h: 96, rot: 0, fill: "#7F5CB8", alpha: 98, visible: true, locked: false },
    ],
  },
};

export function cloneShapes(sceneId) {
  return SCENES[sceneId].shapes.map((s) => ({ ...s }));
}

export function createInitialState(scene = "poster") {
  // 开场刻意停在 0/4 失衡错态：臃肿顶栏 + 双列宽工具抽屉 + 36% 巨宽右栏 + 悬浮杂窗挡在画布中央 + 分区混杂 + 属性静态断联
  return {
    scene,
    topBar: "bloated",      // "bloated" | "compact" | "hidden"
    leftRail: "wide",       // "wide" | "slim" | "collapsed"
    rightDockRatio: 0.36,   // 0 (collapsed) .. 0.46 (bloat)
    floatingClutter: true,  // true = 浮窗「历史与色板」压住画布中央
    zoneOrder: "mixed",     // "mixed" | "clear"
    contextBind: "static",  // "static" | "context"
    rulers: false,          // false | true
    zenMode: false,         // Tab 专注预览
    activeTool: "select",   // "select" | "crop" | "pen" | "shape" | "text" | "hand" | "zoom"
    selectedId: "tri",
    zoom: 100,
    floatPos: { x: 0.48, y: 0.47 }, // 浮窗中心相对画布的位置
    pan: { x: 0, y: 0 },
    shapes: cloneShapes(scene),
  };
}

export const PRESETS = {
  broken: (scene) => createInitialState(scene),
  poster: (scene) => ({
    ...createInitialState(scene),
    topBar: "compact",
    leftRail: "slim",
    rightDockRatio: 0.22,
    floatingClutter: false,
    zoneOrder: "clear",
    contextBind: "context",
    rulers: true,
    zenMode: false,
  }),
  minimal: (scene) => ({
    ...createInitialState(scene),
    topBar: "compact",
    leftRail: "slim",
    rightDockRatio: 0,
    floatingClutter: false,
    zoneOrder: "clear",
    contextBind: "context",
    rulers: true,
    zenMode: false,
  }),
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function normalizeRightRatio(raw) {
  const c = clamp(raw, 0, 0.46);
  return c < 0.045 ? 0 : Math.round(c * 1000) / 1000;
}

// 核心单真源几何与四原则评定
export function evaluateWorkspace(state) {
  const zen = !!state.zenMode;
  const topFrac = zen ? 0 : state.topBar === "bloated" ? 0.148 : state.topBar === "compact" ? 0.074 : 0;
  const infoFrac = zen ? 0 : 0.058;
  const leftFrac = zen ? 0 : state.leftRail === "wide" ? 0.175 : state.leftRail === "slim" ? 0.056 : 0;
  const rightFrac = zen ? 0 : normalizeRightRatio(state.rightDockRatio);

  const canvasWFrac = Math.max(0.16, 1 - leftFrac - rightFrac);
  const canvasHFrac = Math.max(0.32, 1 - topFrac - infoFrac);
  const grossCanvasPct = canvasWFrac * canvasHFrac * 100;

  // 浮窗在未收起时按真实占比遮住中央画布（归一化尺寸 0.28 × 0.36）
  const fw = 0.28;
  const fh = 0.36;
  const hasFloat = !zen && state.floatingClutter;
  let obstructedPct = 0;
  let floatRect = null;
  if (hasFloat) {
    const cx = leftFrac + canvasWFrac * clamp(state.floatPos.x, 0.2, 0.8);
    const cy = topFrac + canvasHFrac * clamp(state.floatPos.y, 0.22, 0.78);
    const fx0 = clamp(cx - fw / 2, 0.01, 0.99 - fw);
    const fy0 = clamp(cy - fh / 2, topFrac + 0.01, 1 - infoFrac - fh - 0.01);
    floatRect = { x: fx0, y: fy0, w: fw, h: fh };
    const ix0 = Math.max(leftFrac, fx0);
    const iy0 = Math.max(topFrac, fy0);
    const ix1 = Math.min(leftFrac + canvasWFrac, fx0 + fw);
    const iy1 = Math.min(topFrac + canvasHFrac, fy0 + fh);
    if (ix1 > ix0 && iy1 > iy0) {
      obstructedPct = (ix1 - ix0) * (iy1 - iy0) * 100;
    }
  }

  const netCanvasPct = Math.max(0, grossCanvasPct - obstructedPct);
  const chromePct = Math.max(0, 100 - netCanvasPct);

  // 编辑态（非临时 Tab 专注态）的各维度状态
  const rawRight = normalizeRightRatio(state.rightDockRatio);
  const isOverStripped =
    !zen &&
    state.topBar === "hidden" &&
    state.leftRail === "collapsed" &&
    rawRight === 0;
  const isDockOverwide = !zen && rawRight > 0.285;
  const isDockSliver = !zen && rawRight > 0 && rawRight < 0.145;
  const isFloatCover = !zen && state.floatingClutter;
  const isCanvasCrushed = !zen && netCanvasPct < 58;
  const isBloatedChrome = !zen && (state.topBar === "bloated" || state.leftRail === "wide");
  const isZonesMixed = state.zoneOrder === "mixed";
  const isContextStatic = state.contextBind === "static";
  const hasToolEntry = state.leftRail === "slim" || state.topBar === "compact";

  // 鼠标往返估算（示意值：归一化单位，基于画布中点到属性/工具区的往返距离）
  const sel = state.shapes.find((s) => s.id === state.selectedId) || state.shapes[0];
  const selNormX = leftFrac + canvasWFrac * (sel.x / VIRTUAL_W);
  let travelScore = 0.24; // 越小越近
  if (zen) {
    travelScore = 0.12;
  } else if (isContextStatic) {
    travelScore = 0.78; // 找不到就近属性，被迫回顶栏翻菜单
  } else if (isZonesMixed) {
    travelScore = 0.66; // 分区打架，左右来回跳
  } else if (isOverStripped) {
    travelScore = 0.82; // 入口全空，盲找快捷键
  } else if (rawRight === 0) {
    travelScore = 0.18; // 画布就地浮标（W/H/X/Y）紧贴对象
  } else {
    const dockEdgeX = 1 - rawRight + rawRight * 0.42;
    travelScore = clamp(Math.abs(dockEdgeX - selNormX) * 0.75 + (state.leftRail === "wide" ? 0.14 : 0), 0.16, 0.85);
  }
  const travelBand = travelScore <= 0.34 ? "短距就近" : travelScore <= 0.56 ? "中距往返" : "长距折返";
  const travelPxEst = Math.round(travelScore * 640); // 1440 参考屏下的示意往返像素

  // 四大原则评定（对应 283 原海报 PRINCIPLES）
  const p1_canvas = !isFloatCover && !isCanvasCrushed && !isDockOverwide && !isBloatedChrome;
  const p2_zones = !isZonesMixed && !isOverStripped && hasToolEntry;
  const p3_flex = !isFloatCover && !isDockSliver && !isDockOverwide && state.leftRail !== "wide";
  const p4_context = !isContextStatic && !isOverStripped && (rawRight >= 0.145 || (rawRight === 0 && hasToolEntry));

  const principles = {
    canvas: {
      ok: p1_canvas,
      tag: isFloatCover
        ? `浮窗遮挡 ${Math.round(obstructedPct)}%`
        : isCanvasCrushed
        ? `仅剩 ${Math.round(netCanvasPct)}%`
        : isBloatedChrome
        ? "工具栏臃肿"
        : isDockOverwide
        ? `右栏占 ${Math.round(rawRight * 100)}%`
        : `净占 ${Math.round(netCanvasPct)}%`,
    },
    zones: {
      ok: p2_zones,
      tag: isOverStripped
        ? "工具全空"
        : isZonesMixed
        ? "混排越界"
        : !hasToolEntry
        ? "缺常用工具"
        : "四区清晰",
    },
    flex: {
      ok: p3_flex,
      tag: isFloatCover
        ? "浮窗挡画布"
        : isDockSliver
        ? `细缝 ${Math.round(rawRight * 100)}%`
        : isDockOverwide
        ? `过宽 ${Math.round(rawRight * 100)}%`
        : state.leftRail === "wide"
        ? "左栏撑宽"
        : rawRight === 0
        ? "右栏已收起"
        : `右栏 ${Math.round(rawRight * 100)}%`,
    },
    context: {
      ok: p4_context,
      tag: isOverStripped
        ? "入口失联"
        : isContextStatic
        ? "静态不联动"
        : rawRight === 0
        ? "画布就地浮标"
        : travelBand,
    },
  };

  const score = [p1_canvas, p2_zones, p3_flex, p4_context].filter(Boolean).length;

  // 单真源白话诊单（按最紧急的真实失误排序）
  let issue;
  if (zen) {
    issue = {
      code: "zen",
      level: "zen",
      badge: "专注预览 · Tab",
      title: "画布已释放到 100%，周围面板暂时退场",
      body: "审稿、构图预览或手绘长线条时，一键清空边框最能让人看清画面整体比例；需要改精确参数时再按 Tab（或点「退出专注」）即可原样召回面板。",
      action: "按 Tab 键或点击顶角「退出专注」，回到工作区继续调校四项原则。",
    };
  } else if (isOverStripped) {
    issue = {
      code: "over-stripped",
      level: "err",
      badge: `错态 · 过度裸奔 (${score}/4)`,
      title: "画布占了 94%，但工具和属性入口全被撤空",
      body: "以画布为中心不是把辅助区一删了之。顶栏、左工具栏和右侧属性栏全部归零后，每次切工具或改尺寸都得靠死记快捷键盲操作，新手会瞬间迷失方向。",
      action: "把左工具轨恢复到「单列图标」，再向右或向左微调面板，留住轻量的上下文入口。",
    };
  } else if (isFloatCover) {
    issue = {
      code: "float-cover",
      level: "err",
      badge: `错态 · 浮窗遮挡 (${score}/4)`,
      title: `画布只剩 ${Math.round(netCanvasPct)}%，杂乱浮窗正压在作品中央`,
      body: `未停靠的「历史与色板」浮窗直接挡住了 ${Math.round(obstructedPct)}% 的中心创作区，加上四周厚重栏位，画布被挤成狭缝。你拖两下绿色三角就会撞到窗框，手和眼都在反复躲障碍。`,
      action: "直接点击画布里的浮窗「收起停靠」，再向右拖动青柠分隔条把右侧栏缩回 16%–26% 甜区。",
    };
  } else if (isDockOverwide) {
    issue = {
      code: "dock-overwide",
      level: "err",
      badge: `错态 · 右栏抢戏 (${score}/4)`,
      title: `右侧面板拉宽到 ${Math.round(rawRight * 100)}%，画布反倒成了配角`,
      body: `画布净可视面积只剩 ${Math.round(netCanvasPct)}%（经验参考甜区在 58%–86%）。右侧图层和属性栏超过三成宽时，空白衬底远多于数值本身，却硬生生砍掉了画布左右呼吸空间。`,
      action: "按住画布与右栏之间的青柠分隔条向右拖，把右栏收窄到 16%–26%（或直接拖到最右折叠收起）。",
    };
  } else if (isDockSliver) {
    issue = {
      code: "dock-sliver",
      level: "err",
      badge: `错态 · 半开细缝 (${score}/4)`,
      title: `右栏卡在 ${Math.round(rawRight * 100)}% 细缝里，既占空间又读不全数值`,
      body: "半开半关是最伤效率的尴尬状态：面板宽度低于 15% 时，坐标输入框和图层名被挤得难以点准，却照样切走了一截画布边界。",
      action: "把青柠分隔条往左拉宽到 16%–26% 正常停靠，或直接往右拖到底彻底收起。",
    };
  } else if (isBloatedChrome || isCanvasCrushed) {
    issue = {
      code: "canvas-crushed",
      level: "err",
      badge: `错态 · 工具臃肿 (${score}/4)`,
      title: `四周工具栏太厚，画布净面积被压到 ${Math.round(netCanvasPct)}%`,
      body: "双层冗余顶栏和宽抽屉左栏占走了大量高价值视野，真正用来排图形的画布被迫缩小，缩放和拖拽画布的次数会成倍增加。",
      action: "在下方把「顶栏」切到单行精简、把「左工具轨」收窄为单列图标。",
    };
  } else if (isZonesMixed) {
    issue = {
      code: "zones-mixed",
      level: "err",
      badge: `错态 · 分区混杂 (${score}/4)`,
      title: "工具、图层与全局菜单混排在一起，肌肉记忆失灵",
      body: "当顶栏混进图层锁定、左栏塞进填充色块、右栏掺入导出按钮时，人脑无法靠位置条件反射找到功能，每次操作都要重新扫一遍字标。",
      action: "把「四区分工」切回清晰分区：顶栏放全局命令、左轨放高频工具、右栏专管图层与属性。",
    };
  } else if (isContextStatic) {
    issue = {
      code: "context-static",
      level: "err",
      badge: `错态 · 上下文断联 (${score}/4)`,
      title: "点中画布上的图形，属性面板却纹丝不动",
      body: "当前属性栏只显示静态的全局画板项，选中「形状 1」后既不展示它的坐标宽高，也没有画布就地浮标。想微调尺寸就得反复切菜单，往返距离大增。",
      action: "开启「属性联动」，再点击画布上的蓝色圆或绿色三角，观察属性区与坐标浮标如何同步响应。",
    };
  } else if (!hasToolEntry) {
    issue = {
      code: "no-tools",
      level: "err",
      badge: `错态 · 缺少工具入口 (${score}/4)`,
      title: "顶栏和左工具轨都藏起来了，切换工具没有落脚点",
      body: "即使保留了右侧属性栏，缺少工具入口仍会打断选择、框选、抓手之间的高频切换。",
      action: "打开「左工具轨 · 单列图标」或「顶栏 · 单行精简」，至少留住一条轻量化工具入口。",
    };
  } else {
    const modeName = rawRight === 0 ? "极简专注解" : "原海报均衡解";
    const rulerNote = state.rulers
      ? "标尺与吸附辅助线已开启，拖动任意图形可直接对准刻度。"
      : "四项原则已达标；你也可以顺手打开「标尺与辅助线」，体验精准对齐反馈。";
    issue = {
      code: "pass",
      level: "ok",
      badge: `达标 · ${modeName} (4/4)`,
      title: `画布净占 ${Math.round(netCanvasPct)}%，创作主角与辅助工具达成平衡`,
      body: `四周框架只占 ${Math.round(chromePct)}%，工具、图层、属性各归其位且紧贴画布响应选中状态（示意鼠标往返约 ${travelPxEst}px · ${travelBand}）。${rulerNote}`,
      action: "试着直接拖动画布里的五枚几何图形、点右侧图层小眼睛或按 Tab 体验纯画布专注预览。",
    };
  }

  return {
    zen,
    topFrac,
    infoFrac,
    leftFrac,
    rightFrac,
    canvasWFrac,
    canvasHFrac,
    grossCanvasPct,
    obstructedPct,
    netCanvasPct,
    chromePct,
    floatRect,
    travelScore,
    travelBand,
    travelPxEst,
    principles,
    score,
    issue,
  };
}

// 01 节：四区职责蓝图数据
export const ZONE_BLUEPRINT = {
  canvas: {
    id: "canvas",
    name: "画布区域",
    en: "CANVAS",
    color: "#28B9D8",
    share: "经验建议 60%–80%",
    role: "绝对主角。承载图形、网格、标尺与实时吸附辅助线，一切外围面板都为它服务。",
    why: "人类工作记忆每次只能聚焦一个核心对象。画布越大、留白边框越克制，缩放和平移打断创作流的频率就越低。",
    mistake: "把过多非当前任务面板默认展开，或让未停靠浮窗漂在画布上方。",
  },
  top: {
    id: "top",
    name: "顶部工具栏",
    en: "TOP TOOLS",
    color: "#C8E03B",
    share: "高度约 40–48px",
    role: "全局命令与模式入口：文档菜单、高频主工具、缩放比例（100%）、撤销与重做。",
    why: "屏幕顶沿在菲茨定律中属于「无限高」边界，鼠标向上甩动自然停住，适合放置全局切换与撤销。",
    mistake: "堆成双层甚至三层工具带，把低频导出设置与高频绘制工具混在同一排。",
  },
  left: {
    id: "left",
    name: "左侧工具栏",
    en: "LEFT RAIL",
    color: "#2870E3",
    share: "单列约 44–52px",
    role: "高频绘制与操控工具，按使用频率自上而下排列（选择、裁剪、钢笔、图形、文字、抓手、缩放）。",
    why: "竖直单列图标靠视觉轮廓与固定纵坐标建立肌肉记忆；窄轨宽度对宽屏画布横向挤压微乎其微。",
    mistake: "默认展开文字说明双列抽屉，或者每次升级随意打乱工具上下顺序。",
  },
  right: {
    id: "right",
    name: "图层与属性面板",
    en: "LAYERS & PROPERTIES",
    color: "#9165C8",
    share: "宽度约 220–280px",
    role: "上方管理图层层级、显隐与锁定，下方只展示当前选中对象的上下文属性（位置、尺寸、旋转、填充、描边）。",
    why: "选中画布元素后，视线只需水平向右移一小步就能改值，无需跨越菜单层级；未选中时自动精简，避免参数轰炸。",
    mistake: "把几十项当前用不上的静态属性全部堆出来，或者把面板拖到占去三分之一屏幕宽度。",
  },
  info: {
    id: "info",
    name: "辅助信息条",
    en: "INFO BAR",
    color: "#FF9A0B",
    share: "底沿约 28–34px",
    role: "静默呈现当前缩放比例、画布坐标、选中尺寸与快捷键提示，不抢夺主视线。",
    why: "将状态反馈沉淀到底沿细条，既让精确操作随时可查，又避免在画布中央堆满浮动提示牌。",
    mistake: "用高饱和跳动徽章把状态条变成广告牌，分散创作注意力。",
  },
};

// 02 节：不同屏幕尺寸下的面板让路模型（纯几何实算）
export const VIEWPORT_PRESETS = {
  desktop27: { id: "desktop27", label: "27 寸大屏", w: 2560, h: 1440, desc: "横向余量充裕" },
  laptop13:  { id: "laptop13",  label: "13 寸笔记本", w: 1280, h: 800, desc: "最常见的设计主力屏" },
  tablet:    { id: "tablet",    label: "竖屏平板", w: 768, h: 1024, desc: "横向紧张，必须按需收放" },
};

export function computeViewportStrategy(vpId, strategy) {
  const vp = VIEWPORT_PRESETS[vpId];
  const topH = 44;
  const infoH = 30;
  let leftW = 48;
  let layersW = 0;
  let propsW = 0;
  let floatCoverArea = 0;
  let note = "";

  if (strategy === "all-open") {
    leftW = 52;
    layersW = 240;
    propsW = 280;
    note =
      vp.w >= 1800
        ? "27 寸大屏下三栏全开，画布仍有七成以上宽裕视野，适合长时多图层精修。"
        : vp.w >= 1200
        ? "13 寸屏左右三栏全开后，画布横向被夹掉将近一半，宽幅画板不得不频繁缩放到 50%。"
        : "768px 平板上三栏全开直接把画布压成一条细缝，完全无法正常落笔。";
  } else if (strategy === "adaptive") {
    if (vp.w >= 1800) {
      leftW = 48;
      layersW = 236;
      propsW = 272;
      note = "大屏展开左图层 + 右属性双停靠，视野宽阔且零遮挡。";
    } else if (vp.w >= 1200) {
      leftW = 46;
      layersW = 0;
      propsW = 248; // 合并到右单列上下分栏
      note = "13 寸笔记本把图层与属性合并进右侧单列（248px），画布稳守 70%+ 经验甜区。";
    } else {
      leftW = 44;
      layersW = 0;
      propsW = 0; // 按需抽屉，默认收起
      note = "平板默认收起右侧栏，仅留 44px 窄工具轨与按需弹出的抽屉，把 85% 面积还给触控画布。";
    }
  } else {
    // float-only：标称无侧栏，实则两张悬浮面板常驻覆盖画布
    leftW = 48;
    layersW = 0;
    propsW = 0;
    const f1 = Math.min(220, vp.w * 0.34) * Math.min(260, vp.h * 0.34);
    const f2 = Math.min(220, vp.w * 0.34) * Math.min(240, vp.h * 0.32);
    floatCoverArea = f1 + f2;
    note =
      vp.w >= 1800
        ? "大屏上浮窗能挪到角落，遮挡感较轻，但窗口越多越容易互相压盖。"
        : "中小屏里「全浮动」反而成了负担：两张浮窗压住画布角落，拖图形经常被迫先搬窗口。";
  }

  const canvasW = Math.max(80, vp.w - leftW - layersW - propsW);
  const canvasH = Math.max(120, vp.h - topH - infoH);
  const totalArea = vp.w * vp.h;
  const netCanvasArea = Math.max(0, canvasW * canvasH - floatCoverArea);
  const canvasPct = Math.round((netCanvasArea / totalArea) * 100);
  const ok = canvasPct >= 58 && floatCoverArea / totalArea < 0.12 && canvasW >= 420;

  return {
    vp,
    topH,
    infoH,
    leftW,
    layersW,
    propsW,
    canvasW,
    canvasH,
    floatCoverPct: Math.round((floatCoverArea / totalArea) * 100),
    canvasPct,
    ok,
    note,
  };
}

// 03 节：菲茨定律与视线往返实验台（示意计算）
export const FITTS_MODES = {
  context: {
    id: "context",
    label: "就近上下文栏",
    target: { x: 0.84, y: 0.48, w: 0.14 },
    clicks: 1,
    color: "#C8E03B",
    desc: "属性紧贴画布右缘且只展示当前对象的字段，选中后横移一步直接修改。",
  },
  topmenu: {
    id: "topmenu",
    label: "顶栏深埋菜单",
    target: { x: 0.28, y: 0.08, w: 0.055 },
    clicks: 3,
    color: "#FF9A0B",
    desc: "属性藏在顶部三级下拉菜单里：指针先远奔左上小入口，再逐层展开并遮挡画布。",
  },
  opposite: {
    id: "opposite",
    label: "对角远跳双栏",
    target: { x: 0.11, y: 0.84, w: 0.085 },
    clicks: 2,
    color: "#FF7870",
    desc: "图层与属性被拆到画布对角远端，每改一次数值眼睛和手都要斜穿整张画布。",
  },
};

export const FITTS_TASKS = {
  size:   { id: "size",   label: "改尺寸 W/H", origin: { x: 0.56, y: 0.52 }, desc: "选中中偏右的绿色三角，修改宽高数值" },
  color:  { id: "color",  label: "换填充色",   origin: { x: 0.44, y: 0.36 }, desc: "选中上方蓝圆，切换主填充颜色" },
  align:  { id: "align",  label: "对齐双图形", origin: { x: 0.62, y: 0.38 }, desc: "框选蓝圆与黄方，点一次顶部对齐" },
  alpha:  { id: "alpha",  label: "调透明度",   origin: { x: 0.50, y: 0.68 }, desc: "选中底层半透明三角，下调不透明度" },
};

export function computeFitts(modeId, taskId) {
  const m = FITTS_MODES[modeId];
  const t = FITTS_TASKS[taskId];
  const dx = (m.target.x - t.origin.x) * 1000;
  const dy = (m.target.y - t.origin.y) * 620;
  const distPx = Math.round(Math.hypot(dx, dy));
  const widthPx = Math.round(m.target.w * 1000);
  // Paul Fitts (1954) Index of Difficulty: ID = log2(2D / W)（示意，用于同条件横向对照）
  const idBits = Math.max(1.0, Math.log2((2 * Math.max(distPx, 40)) / Math.max(widthPx, 24)));
  const totalBits = +(idBits * (1 + (m.clicks - 1) * 0.45)).toFixed(1);
  return {
    mode: m,
    task: t,
    distPx,
    widthPx,
    clicks: m.clicks,
    idBits: +idBits.toFixed(1),
    totalBits,
  };
}

// 04 节：六十年画布工作区演变（均已联网核实年份与史实）
export const HISTORY_ERAS = [
  {
    id: "1963",
    year: "1963",
    title: "Sketchpad · 光笔与矢量画布",
    who: "Ivan Sutherland（MIT 博士论文）",
    canvasShare: 88,
    summary: "在 MIT 林肯实验室的 TX-2 计算机矢量屏上，用光笔直接拉出橡皮筋般的几何线段并施加平行、等长约束，首次让人类不再靠穿孔卡和命令行，而是直接在画布上与图形对话。",
    chrome: "硬件拨动开关 + 极简屏幕边缘状态",
    layout: { top: 0, left: 0.08, right: 0, bottom: 0.06, canvasLabel: "CRT 矢量直绘画布" },
  },
  {
    id: "1984",
    year: "1984",
    title: "MacPaint · 左侧工具板定型",
    who: "Bill Atkinson & Susan Kare（Apple）",
    canvasShare: 64,
    summary: "随初代 Macintosh 发布，在 512×342 单色屏上放弃纯下拉菜单，把铅笔、套索、油漆桶做成左侧常驻图标工具板、底部放填充纹理板，确立了后世几乎所有绘图软件的「左工具 + 中画布」骨架。",
    chrome: "顶部系统菜单 + 左双列图标板 + 底纹理板",
    layout: { top: 0.09, left: 0.16, right: 0, bottom: 0.14, canvasLabel: "1-Bit 位图画布" },
  },
  {
    id: "1994",
    year: "1990–1994",
    title: "Photoshop 1.0 → 3.0 · 浮动面板与图层",
    who: "Thomas & John Knoll（Adobe）",
    canvasShare: 66,
    summary: "1990 年 1.0 版引入工具箱与可隐藏的浮动面板；1994 年 3.0 版引入「图层（Layers）」与标签式面板。随着图层成为非破坏性编辑核心，右侧「图层 + 属性」停靠栏正式成形。",
    chrome: "顶菜单选项栏 + 左工具箱 + 右标签停靠图层/属性",
    layout: { top: 0.11, left: 0.07, right: 0.23, bottom: 0.05, canvasLabel: "多图层非破坏画布" },
  },
  {
    id: "2016",
    year: "2016",
    title: "Figma · 浏览器无限画布与上下文栏",
    who: "Dylan Field & Evan Wallace",
    canvasShare: 74,
    summary: "将硬件加速矢量画布搬进浏览器并引入多人实时协作。界面大幅收窄四周边界：右侧属性栏严格按「当前选中对象」动态切换，闲置参数彻底隐身，按快捷键一键隐藏全部界面专注画布。",
    chrome: "极简顶栏 + 可收图层树 + 上下文动态属性栏",
    layout: { top: 0.07, left: 0.14, right: 0.17, bottom: 0, canvasLabel: "无限多人矢量画布" },
  },
];

// 06 节：单变量练习（1280×800 笔记本屏，只变面板组织方式）
export const QUIZ_OPTIONS = {
  A: {
    id: "A",
    label: "方案 A · 右侧单栏合并",
    canvasPct: 73,
    correct: true,
    headline: "选对了：方案 A 在 1280 屏下最平衡",
    reason: "13 寸笔记本横向宽度有限。把图层与上下文属性合并进右侧单列（240px）后，画布净占比稳在 73%，而且选完图形只需向右平移一小步就能改坐标和填色，既不挤画布也不打断操作流。",
    layout: { left: 44, left2: 0, right: 240, floatCount: 0, topMenuOnly: false },
  },
  B: {
    id: "B",
    label: "方案 B · 左右对称双栏",
    canvasPct: 55,
    correct: false,
    headline: "方案 B 看起来对称整齐，但在 13 寸屏下过挤",
    reason: "左 220px 图层栏 + 右 260px 属性栏在 27 寸大屏很顺手，放到 1280px 笔记本屏上却会把画布夹成 55% 的窄井；而且在左栏点完图层后，视线和鼠标必须横穿整个画布才能去右栏改属性。",
    layout: { left: 44, left2: 220, right: 260, floatCount: 0, topMenuOnly: false },
  },
  C: {
    id: "C",
    label: "方案 C · 顶栏下拉零侧栏",
    canvasPct: 91,
    correct: false,
    headline: "方案 C 画布面积最大，但把高频编辑变成了翻菜单",
    reason: "彻底藏起侧栏让画布冲到 91%，可每次改宽高、旋转或图层顺序都要点开顶部下拉菜单——不仅点击次数翻倍，弹出的下拉列表还会顺手挡住上半截作品。纯审稿合适，高频精修很累手。",
    layout: { left: 44, left2: 0, right: 0, floatCount: 0, topMenuOnly: true },
  },
  D: {
    id: "D",
    label: "方案 D · 全幅画布双浮窗",
    canvasPct: 68,
    correct: false,
    headline: "方案 D 名义上是全幅画布，实则埋了两块挡路石",
    reason: "两张 230px 浮窗悬在画布右上和右下，实际遮住了约 24% 的有效画布区（净可见仅剩约 68%）。只要把图形往右侧摆一点，就会被浮窗盖住，创作者不得不反复挪动窗口来让路。",
    layout: { left: 44, left2: 0, right: 0, floatCount: 2, topMenuOnly: false },
  },
};
