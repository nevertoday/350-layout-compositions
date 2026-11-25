// 326 留白构图 · 单真源几何模型与连通域核算引擎
// 状态只存归一化画幅比例（0..1）与杂件开关；画布渲染、读数、白话诊断共用此唯一真源。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报 · 光影拱门",
    short: "光影拱门",
    baseW: 0.30,
    baseH: 0.50,
    maxWhite: 92,
    minWhite: 58,
    clutterNames: {
      corner: "满角繁标",
      rival: "争主副块",
      frame: "粗黑死框",
      grid: "密纹噪底",
    },
    clutterHints: {
      corner: "满角堵白 · 点撤",
      rival: "副块争主 · 点撤",
      frame: "外框锁气 · 点撤",
      grid: "噪网破净 · 点撤",
    },
  },
  song: {
    id: "song",
    label: "宋画 · 寒江独钓",
    short: "寒江独钓",
    baseW: 0.38,
    baseH: 0.30,
    maxWhite: 94,
    minWhite: 60,
    clutterNames: {
      corner: "赘余远山",
      rival: "繁跋巨印",
      frame: "厚重黑框",
      grid: "满幅乱皴",
    },
    clutterHints: {
      corner: "赘山堵气 · 点撤",
      rival: "繁跋争主 · 点撤",
      frame: "假框锁江 · 点撤",
      grid: "乱皴污绢 · 点撤",
    },
  },
  exhibit: {
    id: "exhibit",
    label: "现代展讯 · 白墙海报",
    short: "白墙展讯",
    baseW: 0.29,
    baseH: 0.47,
    maxWhite: 92,
    minWhite: 58,
    clutterNames: {
      corner: "促销角标",
      rival: "冗余副卡",
      frame: "硬边边框",
      grid: "斜纹噪底",
    },
    clutterHints: {
      corner: "角标堵空 · 点撤",
      rival: "副卡分流 · 点撤",
      frame: "边框切碎 · 点撤",
      grid: "底纹扰目 · 点撤",
    },
  },
};

export const PRESETS = {
  wrong: {
    label: "复原 0/4 错态",
    sx: 0.50,
    sy: 0.50,
    scale: 1.32,
    clutter: { frame: true, grid: true, corner: true, rival: true },
  },
  posterSol: {
    label: "原海报右偏解",
    sx: 0.72,
    sy: 0.47,
    scale: 0.94,
    clutter: { frame: false, grid: false, corner: false, rival: false },
  },
  skySol: {
    label: "下沉留天解",
    sx: 0.34,
    sy: 0.63,
    scale: 0.88,
    clutter: { frame: false, grid: false, corner: false, rival: false },
  },
  cornerSol: {
    label: "边角孤韵解",
    sx: 0.72,
    sy: 0.63,
    scale: 0.84,
    clutter: { frame: false, grid: false, corner: false, rival: false },
  },
  errEmpty: {
    label: "试错：过空成白纸",
    sx: 0.72,
    sy: 0.46,
    scale: 0.34,
    clutter: { frame: false, grid: false, corner: false, rival: false },
  },
  errFragment: {
    label: "试错：居中碎缝",
    sx: 0.50,
    sy: 0.50,
    scale: 0.94,
    clutter: { frame: true, grid: false, corner: false, rival: false },
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    sx: PRESETS.wrong.sx,
    sy: PRESETS.wrong.sy,
    scale: PRESETS.wrong.scale,
    clutter: { ...PRESETS.wrong.clutter },
    showVoidMap: false,
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 由当前状态与画布宽高比，单真源算出主体、斜影参照区与各杂件的精确归一化矩形
export function getLayoutGeometry(state, aspect = 1.48) {
  const th = THEMES[state.theme] || THEMES.poster;
  const aspectNorm = clamp(aspect, 0.85, 2.1);
  // 保持主体在任何屏幕下视觉面积比例一致、绝不被压扁变形
  const refAspect = 1.48;
  const scaleW = Math.sqrt(refAspect / aspectNorm);
  const scaleH = Math.sqrt(aspectNorm / refAspect);

  const sw = clamp(th.baseW * state.scale * scaleW, 0.045, 0.72);
  const sh = clamp(th.baseH * state.scale * scaleH, 0.06, 0.78);
  const sx = clamp(state.sx, sw * 0.5 + 0.015, 1 - sw * 0.5 - 0.015);
  const sy = clamp(state.sy, sh * 0.5 + 0.02, 1 - sh * 0.5 - 0.02);

  const subject = {
    cx: sx,
    cy: sy,
    w: sw,
    h: sh,
    x: sx - sw * 0.5,
    y: sy - sh * 0.5,
  };

  // 杂件矩形定义（真实几何位置，供绘制、点击命中、网格核算共同使用）
  const clutterRects = {
    corner: {
      id: "corner",
      x: 0.065,
      y: 0.085,
      w: 0.27,
      h: 0.21,
      active: !!state.clutter.corner,
    },
    rival: {
      id: "rival",
      x: 0.675,
      y: 0.675,
      w: 0.26,
      h: 0.23,
      active: !!state.clutter.rival,
    },
    frame: {
      id: "frame",
      thicknessX: 0.052,
      thicknessY: 0.068,
      active: !!state.clutter.frame,
    },
    grid: {
      id: "grid",
      active: !!state.clutter.grid,
    },
  };

  return { subject, clutterRects, theme: th };
}

// 48×32 离散网格精确计算：总净留白面积、主体占幅、最大无遮挡连续整白矩形（O(GW*GH) 柱状图栈算法）
const GW = 48;
const GH = 32;

function largestEmptyRect(occ) {
  const heights = new Int16Array(GW);
  let bestArea = 0;
  let best = { gx: 0, gy: 0, gw: 0, gh: 0 };

  for (let y = 0; y < GH; y++) {
    const rowOff = y * GW;
    for (let x = 0; x < GW; x++) {
      heights[x] = occ[rowOff + x] === 0 ? heights[x] + 1 : 0;
    }
    const stack = [];
    for (let x = 0; x <= GW; x++) {
      const h = x < GW ? heights[x] : 0;
      let start = x;
      while (stack.length && stack[stack.length - 1].h > h) {
        const top = stack.pop();
        const area = top.h * (x - top.x);
        if (area > bestArea) {
          bestArea = area;
          best = { gx: top.x, gy: y - top.h + 1, gw: x - top.x, gh: top.h };
        }
        start = top.x;
      }
      stack.push({ x: start, h });
    }
  }
  return {
    areaCells: bestArea,
    rect: {
      x: best.gx / GW,
      y: best.gy / GH,
      w: best.gw / GW,
      h: best.gh / GH,
    },
  };
}

export function evaluate(state, aspect = 1.48) {
  const geom = getLayoutGeometry(state, aspect);
  const { subject, clutterRects, theme } = geom;
  const occ = new Uint8Array(GW * GH); // 0=空白 1=主体 2=杂件/死框

  let subjectCells = 0;
  let clutterCells = 0;

  const fx = clutterRects.frame.thicknessX;
  const fy = clutterRects.frame.thicknessY;
  const cCorner = clutterRects.corner;
  const cRival = clutterRects.rival;

  // 原海报拱门有极简斜影轻拂区域（不视为硬杂件，但主体核心加上极近拱座）
  for (let gy = 0; gy < GH; gy++) {
    const ny = (gy + 0.5) / GH;
    for (let gx = 0; gx < GW; gx++) {
      const nx = (gx + 0.5) / GW;
      const idx = gy * GW + gx;

      // 检查是否落入主体核心轮廓（拱门为上半椭圆+下半矩形，孤舟与展讯为紧贴包围盒）
      let inSubj = false;
      if (nx >= subject.x && nx <= subject.x + subject.w && ny >= subject.y && ny <= subject.y + subject.h) {
        if (state.theme === "poster") {
          const rx = subject.w * 0.5;
          const archCenterY = subject.y + rx * (aspect > 0 ? 1 / Math.max(0.8, aspect) : 1) * 0.72;
          if (ny >= archCenterY) {
            inSubj = true;
          } else {
            const dx = (nx - subject.cx) / rx;
            const dy = (ny - archCenterY) / Math.max(0.01, archCenterY - subject.y);
            inSubj = dx * dx + dy * dy <= 1.04;
          }
        } else {
          inSubj = true;
        }
      }

      if (inSubj) {
        occ[idx] = 1;
        subjectCells++;
        continue;
      }

      let inClut = false;
      if (clutterRects.frame.active && (nx < fx || nx > 1 - fx || ny < fy || ny > 1 - fy)) {
        inClut = true;
      }
      if (!inClut && cCorner.active && nx >= cCorner.x && nx <= cCorner.x + cCorner.w && ny >= cCorner.y && ny <= cCorner.y + cCorner.h) {
        inClut = true;
      }
      if (!inClut && cRival.active && nx >= cRival.x && nx <= cRival.x + cRival.w && ny >= cRival.y && ny <= cRival.y + cRival.h) {
        inClut = true;
      }

      if (inClut) {
        occ[idx] = 2;
        clutterCells++;
      }
    }
  }

  const totalCells = GW * GH;
  const emptyCells = totalCells - subjectCells - clutterCells;
  const whitePct = Math.round((emptyCells / totalCells) * 100);
  const subjectPct = Math.max(1, Math.round((subjectCells / totalCells) * 100));
  const clutterPct = Math.round((clutterCells / totalCells) * 100);

  const largest = largestEmptyRect(occ);
  const largestVoidPct = Math.round((largest.areaCells / totalCells) * 100);
  const voidCohesion = emptyCells > 0 ? Math.round((largest.areaCells / emptyCells) * 100) : 0;

  // 主体四边净安全距（百分比）
  const marginL = subject.x * 100;
  const marginR = (1 - (subject.x + subject.w)) * 100;
  const marginT = subject.y * 100;
  const marginB = (1 - (subject.y + subject.h)) * 100;
  const minMarginPct = Math.round(Math.min(marginL, marginR, marginT, marginB));

  // 主体偏离几何中心距离（避免死卡正中把白边四等分）
  const centerOffset = Math.hypot(subject.cx - 0.5, subject.cy - 0.5);
  const isDeadCenter = centerOffset < 0.085;

  const activeClutterCount =
    (state.clutter.frame ? 1 : 0) +
    (state.clutter.grid ? 1 : 0) +
    (state.clutter.corner ? 1 : 0) +
    (state.clutter.rival ? 1 : 0);

  // 四项单真源核心检查
  const checks = {
    // 1. 空间呼吸：净留白落在经验舒适区，且主体占幅稳立可辨（既不塞满也不成空纸）
    breath: whitePct >= theme.minWhite && whitePct <= theme.maxWhite && subjectPct >= 5 && subjectPct <= 35,
    // 2. 整白聚气：没有死框锁死，且最大连续整白区占画幅 ≥ 42%（或占总留白 ≥ 58%）且不死卡正中四等分
    cohesion: !state.clutter.frame && largestVoidPct >= 42 && voidCohesion >= 56 && !isDeadCenter,
    // 3. 底净主显：没有噪底网纹，没有左上堵角与右下争主副块
    purity: !state.clutter.grid && !state.clutter.corner && !state.clutter.rival,
    // 4. 聚焦落稳：主体不撞画框外沿（安全护边 ≥ 6%）且无死框锁边、主体不失锚
    anchor: minMarginPct >= 6 && !state.clutter.frame && subjectPct >= 5,
  };

  const passCount =
    (checks.breath ? 1 : 0) +
    (checks.cohesion ? 1 : 0) +
    (checks.purity ? 1 : 0) +
    (checks.anchor ? 1 : 0);

  // 8 类错态优先级诊断（说清「为什么会这样看」与「下一步怎么做」）
  let kind = "pass";
  let badge = "4/4 · 留白成势";
  let title = "";
  let why = "";
  let next = "";
  let orderGrade = "清朗有序（示意）";

  if (passCount === 4) {
    // 识别合法解流派
    if (subject.cx >= 0.57 && subject.cy <= 0.58) {
      badge = "4/4 · 原海报右偏解";
      title = `净留白 ${whitePct}%，最大整白区占画幅 ${largestVoidPct}%，左虚右实气场通透`;
      why = "主体稳居右中偏内，左侧与上方连成一整片完整暖瓷净空，眼睛先被洁净对比锁进主体，再顺着斜影在左方大片留白里从容呼吸。";
    } else if (subject.cy >= 0.59 && subject.cx < 0.56) {
      badge = "4/4 · 下沉留天解";
      title = `主体沉底护边 ${minMarginPct}%，上方 ${largestVoidPct}% 整片高远净空托起全图`;
      why = "重心下沉而不撞底边，大片未被打断的上空像南宋江天与地平线海报一样，把静谧与辽阔感直接撑开。";
    } else if (subject.cx >= 0.57 && subject.cy > 0.58) {
      badge = "4/4 · 边角孤韵解";
      title = `收束于右下内缘，左上对角 ${largestVoidPct}% 连续大白浩渺延展`;
      why = "近似南宋「边角之景」的章法：把实景克制地收进一隅，换来对角大半张洁净空白，少反而显得极大。";
    } else {
      badge = "4/4 · 偏置舒朗解";
      title = `净留白 ${whitePct}%、整白连通 ${voidCohesion}%，主从分明且有呼吸`;
      why = "画面没有冗余杂音，留白聚成整片而不是零碎边缝，主体既有清晰立足处，又给视线留足了停顿与回旋的余地。";
    }
    next = "可以换个题材（宋画寒江独钓 / 白墙展讯），或点「试错」亲眼看看过空或切碎留白为什么会失手。";
    orderGrade = "秩序清晰（示意）";
  } else if (subjectPct < 5 || whitePct > theme.maxWhite) {
    kind = "empty_void";
    badge = `${passCount}/4 · 空洞失锚`;
    title = `主体缩到只占 ${subjectPct}%（留白 ${whitePct}%），画面像「忘记放完内容」`;
    why = "留白不是越空越高级。主体太小或存在感太弱时，空白失去了被托举的对象，观者不知道该看哪，只觉得页面寒酸、未完工。";
    next = "在画布空白处向右横拖（或推大下方「主体占幅」滑轨），把主体恢复到画幅 8%–28% 的清晰体量。";
    orderGrade = "空洞无主（示意）";
  } else if (whitePct < theme.minWhite) {
    kind = "overcrowded";
    badge = `${passCount}/4 · 怕空塞满`;
    title = `净留白被挤到只剩 ${whitePct}%，最大整片空白仅 ${largestVoidPct}%`;
    why = "画面塞进了过多装饰与过大体量，元素互相顶撞。眼睛一进来就被四周杂音拽着跑，既找不到第一焦点，也没有一处可以歇脚的空气。";
    next = activeClutterCount > 0
      ? "先在画布上点击带红框的冗余杂物做减法，再向左横拖画布把主体收到更克制的体量。"
      : "在画布空白处向左横拖（或调小「主体占幅」），把净留白释放到经验参考区 58% 以上。";
    orderGrade = "拥挤窒息（示意）";
  } else if (state.clutter.grid) {
    kind = "noisy_ground";
    badge = `${passCount}/4 · 噪底破净`;
    title = `虽然腾出了 ${whitePct}% 空间，但满幅底纹让「空白」变脏了`;
    why = "原海报第二要点讲「对比：突出主体」。只要底面铺着细密网格或纹理，视觉噪音就会和主体抢明度反差，看起来空着，眼球其实仍在加班。";
    next = "点画布上的「噪底」清退签，或关掉下方「底纹噪点」按钮，还给画面一整面干净底色。";
    orderGrade = "底噪扰目（示意）";
  } else if (state.clutter.frame) {
    kind = "frame_locked";
    badge = `${passCount}/4 · 外框锁气`;
    title = `四周粗装饰框把 ${whitePct}% 留白关进了「死格子」`;
    why = "好的留白会让人感觉空间越过纸边继续延伸；一旦套上厚重封闭外框，空白就被硬生生截断成框内边料，呼吸感立刻缩水。";
    next = "点画布边沿的「外框锁气」红签，或关闭下方「装饰外框」开关，让空白直接通向画幅外缘。";
    orderGrade = "框死憋闷（示意）";
  } else if (state.clutter.corner || state.clutter.rival) {
    kind = "rival_clutter";
    badge = `${passCount}/4 · 杂块争主`;
    title = `还有 ${((state.clutter.corner ? 1 : 0) + (state.clutter.rival ? 1 : 0))} 处冗余杂块留在墙上，截断了整片空白`;
    why = "原海报第三要点讲「聚焦：引导视线」。左上堵角或右下副块不仅分走主体的注意力，还把原本能连成一整片的大白劈成了碎块。";
    next = "直接在画布上点击那枚红色提示块把它撤走，观察最大连续整白区怎样瞬间连成一片。";
    orderGrade = "焦点分散（示意）";
  } else if (minMarginPct < 6) {
    kind = "edge_pinch";
    badge = `${passCount}/4 · 撞边滑出`;
    title = `主体离画框边缘只剩 ${minMarginPct}%，快贴到边线外滑了`;
    why = "主体紧贴外沿时，会产生视觉「擦边卡顿」——主体和画面大面积留白断开呼应，观者总担心它要掉出画框外面。";
    next = "拖住画布里的主体往画面内侧挪回一点，让四边最小护边保持在 7% 以上。";
    orderGrade = "贴边失稳（示意）";
  } else if (isDeadCenter || largestVoidPct < 42 || voidCohesion < 56) {
    kind = isDeadCenter ? "dead_center" : "fragmented_void";
    badge = `${passCount}/4 · ${isDeadCenter ? "居中僵滞" : "白被切碎"}`;
    title = isDeadCenter
      ? `主体死卡正中，${whitePct}% 留白被均分成四条等宽白边（最大整片仅 ${largestVoidPct}%）`
      : `总留白虽有 ${whitePct}%，但最大整片连续空白只占 ${largestVoidPct}%，留白太碎`;
    why = "同一面积的空白，四等分成窄边时显得呆板、没有方向；把主体轻轻偏置，让空白向一侧汇集成一整片完整空间，秩序与层次才会出来。";
    next = "把画布里的主体拖向右侧偏中、左下偏底或右下内缘（或打开「显影整白区」），让最大连续整白区超过 42%。";
    orderGrade = "切碎僵滞（示意）";
  }

  // 三枚原海报蓝符实时状态（供左侧原海报原版三竖栏直接渲染）
  const pillarSpace = checks.breath && checks.cohesion
    ? { ok: true, label: `整白 ${largestVoidPct}%` }
    : whitePct < theme.minWhite
      ? { ok: false, label: `仅留 ${whitePct}%` }
      : subjectPct < 5 || whitePct > theme.maxWhite
        ? { ok: false, label: `过空 ${whitePct}%` }
        : { ok: false, label: `碎白 ${largestVoidPct}%` };

  const pillarContrast = checks.purity
    ? { ok: true, label: "底净主显" }
    : state.clutter.grid
      ? { ok: false, label: "噪底扰目" }
      : { ok: false, label: "杂物夺目" };

  const pillarFocus = checks.anchor && !isDeadCenter && !state.clutter.rival && !state.clutter.corner
    ? { ok: true, label: "一眼落焦" }
    : minMarginPct < 6
      ? { ok: false, label: `撞边 ${minMarginPct}%` }
      : isDeadCenter
        ? { ok: false, label: "居中僵滞" }
        : { ok: false, label: "视线分流" };

  return {
    geom,
    whitePct,
    subjectPct,
    clutterPct,
    largestVoidPct,
    voidCohesion,
    largestVoidRect: largest.rect,
    minMarginPct,
    centerOffset,
    isDeadCenter,
    activeClutterCount,
    checks,
    passCount,
    kind,
    badge,
    title,
    why,
    next,
    orderGrade,
    pillars: {
      space: pillarSpace,
      contrast: pillarContrast,
      focus: pillarFocus,
    },
  };
}
