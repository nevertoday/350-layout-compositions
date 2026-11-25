// 168 轴线系统 · 单真源几何与力学模型
// 画布绘制、顶底指标、切角诊单、四条原海报标尺、四枚深蓝圆徽全部读取 evaluate(state, W, H) 同一份输出。

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报·建筑轴景",
    short: "建筑轴景",
    en: "ARCHITECTURAL AXIS",
    caption: "水池、列柱与巨型蓝球沿一条朱红中轴展开，入口石阶引视线直抵端景。",
    blocks: [
      { id: "b1", label: "主轴序幕", sub: "AXIS", kind: "blue", w: 0.145, h: 0.068, weight: 1.45 },
      { id: "b2", label: "入口柱廊", sub: "PORTICO", kind: "outline", w: 0.16, h: 0.068, weight: 1.0 },
      { id: "b3", label: "镜面水庭", sub: "COURT", kind: "blue", w: 0.175, h: 0.068, weight: 1.45 },
      { id: "b4", label: "列树韵律", sub: "RHYTHM", kind: "ink", w: 0.14, h: 0.068, weight: 1.3 },
      { id: "b5", label: "中庭广场", sub: "PLAZA", kind: "outline", w: 0.155, h: 0.068, weight: 1.0 },
      { id: "b6", label: "端景主殿", sub: "TERMINUS", kind: "ink", w: 0.15, h: 0.068, weight: 1.3 },
    ],
  },
  facade: {
    id: "facade",
    label: "建筑立面",
    short: "建筑立面",
    en: "BUILDING FACADE",
    caption: "古典山花、立柱与中心大门围绕竖向中轴排布，左右对应产生庄重稳定感。",
    blocks: [
      { id: "b1", label: "左翼柱间", sub: "BAY L1", kind: "ink", w: 0.15, h: 0.068, weight: 1.3 },
      { id: "b2", label: "右翼柱间", sub: "BAY R1", kind: "ink", w: 0.15, h: 0.068, weight: 1.3 },
      { id: "b3", label: "檐口雕饰", sub: "FRIEZE", kind: "blue", w: 0.165, h: 0.068, weight: 1.45 },
      { id: "b4", label: "门廊轴厅", sub: "PORTAL", kind: "blue", w: 0.165, h: 0.068, weight: 1.45 },
      { id: "b5", label: "基座台阶", sub: "PLINTH", kind: "outline", w: 0.145, h: 0.068, weight: 1.0 },
      { id: "b6", label: "对称翼廊", sub: "WING", kind: "outline", w: 0.145, h: 0.068, weight: 1.0 },
    ],
  },
  plan: {
    id: "plan",
    label: "平面布局",
    short: "平面布局",
    en: "FLOOR PLAN",
    caption: "主通道作为组织脊柱贯穿建筑总平面，各功能厅室沿左右两翼和正交次轴分置。",
    blocks: [
      { id: "b1", label: "西展厅 A", sub: "HALL W1", kind: "blue", w: 0.155, h: 0.068, weight: 1.45 },
      { id: "b2", label: "东展厅 B", sub: "HALL E1", kind: "blue", w: 0.155, h: 0.068, weight: 1.45 },
      { id: "b3", label: "报告厅", sub: "FORUM", kind: "ink", w: 0.16, h: 0.068, weight: 1.3 },
      { id: "b4", label: "资料阅览", sub: "ARCHIVE", kind: "outline", w: 0.16, h: 0.068, weight: 1.0 },
      { id: "b5", label: "北侧序厅", sub: "FOYER", kind: "outline", w: 0.145, h: 0.068, weight: 1.0 },
      { id: "b6", label: "庭院连廊", sub: "GALLERY", kind: "ink", w: 0.145, h: 0.068, weight: 1.3 },
    ],
  },
  editorial: {
    id: "editorial",
    label: "版式设计",
    short: "版式设计",
    en: "TYPOGRAPHIC LAYOUT",
    caption: "瑞士偏心排印：左侧时间与标目右对齐、右侧标题与正文左对齐，紧咬同一条隐性轴线。",
    blocks: [
      { id: "b1", label: "10.14 开幕", sub: "DATE", kind: "blue", w: 0.135, h: 0.068, weight: 1.55 },
      { id: "b2", label: "现代秩序展", sub: "HEADLINE", kind: "ink", w: 0.21, h: 0.068, weight: 1.25 },
      { id: "b3", label: "策展人语", sub: "ESSAY", kind: "outline", w: 0.13, h: 0.068, weight: 1.05 },
      { id: "b4", label: "三楼建筑厅", sub: "GALLERY 3F", kind: "outline", w: 0.20, h: 0.068, weight: 0.95 },
      { id: "b5", label: "特邀对谈", sub: "TALK", kind: "blue", w: 0.13, h: 0.068, weight: 1.5 },
      { id: "b6", label: "预约入场须知", sub: "BOOKING", kind: "outline", w: 0.195, h: 0.068, weight: 0.95 },
    ],
  },
};

export function createInitialState(theme = "poster") {
  // 刻意停在 0/4 失序坏态：轴偏左 28%、5 块堆右且 4 块脱轴游离、1 块跨轴压线、无端景、伪主轴打架
  return {
    theme,
    axisX: 0.28,
    tiltDeg: 0,
    gutter: 10,
    terminus: false,
    subAxis: "conflict", // "none" | "cross" | "conflict"
    showGuides: true,
    selectedId: null,
    items: [
      { id: "b1", side: "R", detachPx: 34, across: false },
      { id: "b2", side: "R", detachPx: 0, across: true },
      { id: "b3", side: "R", detachPx: 48, across: false },
      { id: "b4", side: "L", detachPx: 26, across: false },
      { id: "b5", side: "R", detachPx: 54, across: false },
      { id: "b6", side: "R", detachPx: 8, across: false },
    ],
  };
}

export const PRESETS = {
  // 多组合法解
  classic: {
    label: "原海报居中解",
    tag: "合法解 1",
    good: true,
    patch: {
      axisX: 0.5,
      tiltDeg: 0,
      gutter: 12,
      terminus: true,
      subAxis: "cross",
      showGuides: true,
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "R", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "R", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
  asymmetric: {
    label: "黄金偏心解",
    tag: "合法解 2",
    good: true,
    patch: {
      axisX: 0.38,
      tiltDeg: 0,
      gutter: 11,
      terminus: true,
      subAxis: "cross",
      showGuides: true,
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "R", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "R", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
  tilted: {
    label: "10° 动势斜轴解",
    tag: "合法解 3",
    good: true,
    patch: {
      axisX: 0.5,
      tiltDeg: 10,
      gutter: 13,
      terminus: true,
      subAxis: "none",
      showGuides: true,
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "R", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "R", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
  // 试错反例
  badEdge: {
    label: "试错：主轴贴边",
    tag: "反例",
    good: false,
    patch: {
      axisX: 0.81,
      tiltDeg: 0,
      gutter: 10,
      terminus: true,
      subAxis: "none",
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "R", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "R", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
  badSkew: {
    label: "试错：全堆左翼",
    tag: "反例",
    good: false,
    patch: {
      axisX: 0.56,
      tiltDeg: 0,
      gutter: 11,
      terminus: true,
      subAxis: "none",
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "L", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "L", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
  badTilt: {
    label: "试错：过斜失读",
    tag: "反例",
    good: false,
    patch: {
      axisX: 0.5,
      tiltDeg: 18,
      gutter: 10,
      terminus: true,
      subAxis: "none",
      items: [
        { id: "b1", side: "L", detachPx: 0, across: false },
        { id: "b2", side: "R", detachPx: 0, across: false },
        { id: "b3", side: "L", detachPx: 0, across: false },
        { id: "b4", side: "R", detachPx: 0, across: false },
        { id: "b5", side: "L", detachPx: 0, across: false },
        { id: "b6", side: "R", detachPx: 0, across: false },
      ],
    },
  },
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 给定画布逻辑宽高 W×H，求任意 y 坐标处主轴的 x 坐标
export function axisXAtY(state, W, H, y) {
  const rad = (state.tiltDeg * Math.PI) / 180;
  const cx = state.axisX * W;
  const cy = H * 0.52;
  return cx + (y - cy) * Math.tan(rad);
}

// 核心单真源结算：几何矩形 + 7 类双向真错态 + 4 项支柱 + 白话诊断
export function evaluate(state, W = 760, H = 520) {
  const themeDef = THEMES[state.theme] || THEMES.poster;
  const padX = Math.max(12, W * 0.026);
  const splitY = H * 0.445; // 上半建筑端景 / 下半 6 条独立挂轴行轨（绝不垂直重叠）
  const lowerTop = splitY + H * 0.042;
  const lowerBot = H - H * 0.108;
  const rowCount = state.items.length; // 6 行各自独立
  const rowStep = (lowerBot - lowerTop) / rowCount;

  const rects = [];
  let sumDetach = 0;
  let detachedCount = 0;
  let collisionCount = 0;
  let clippedCount = 0;
  let leftMoment = 0;
  let rightMoment = 0;
  let leftCount = 0;
  let rightCount = 0;

  state.items.forEach((it, idx) => {
    const spec = themeDef.blocks[idx];
    const cy = lowerTop + (idx + 0.5) * rowStep;
    const ax = axisXAtY(state, W, H, cy);
    const widthScale = W < 440 ? 1.18 : 1;
    const bw = Math.min(W * 0.36, spec.w * W * widthScale);
    const bh = Math.max(20, Math.min(34, rowStep * 0.76));
    const y = cy - bh / 2;

    let x;
    if (it.across) {
      x = ax - bw * 0.42;
    } else if (it.side === "L") {
      x = ax - state.gutter - it.detachPx - bw;
    } else {
      x = ax + state.gutter + it.detachPx;
    }

    // 检查是否被左右边缘逼出或压边
    let clipped = false;
    if (x < padX) {
      clipped = true;
      x = padX;
    }
    if (x + bw > W - padX) {
      clipped = true;
      x = W - padX - bw;
    }

    const rcx = x + bw / 2;
    const realGap = it.side === "L" ? ax - (x + bw) : x - ax;
    const acrossNow = x < ax + 2 && x + bw > ax - 2;
    const detachErr = acrossNow ? Math.abs(rcx - ax) : Math.abs(realGap - state.gutter);

    if (acrossNow) collisionCount++;
    else if (detachErr > 8) detachedCount++;
    if (clipped) clippedCount++;
    sumDetach += acrossNow ? 22 : detachErr;

    // 从实绘矩形精确算视觉力矩：面积归一化 × 视觉重量 × 有效力臂
    const areaNorm = (bw * bh) / (W * H);
    const lever = Math.abs(rcx - ax) / W + 0.055;
    const moment = areaNorm * spec.weight * lever * 1000;

    if (acrossNow) {
      leftMoment += moment * 0.5;
      rightMoment += moment * 0.5;
    } else if (rcx < ax) {
      leftMoment += moment;
      leftCount++;
    } else {
      rightMoment += moment;
      rightCount++;
    }

    rects.push({
      id: it.id,
      idx,
      label: spec.label,
      sub: spec.sub,
      kind: spec.kind,
      side: it.side,
      detachPx: it.detachPx,
      across: acrossNow,
      clipped,
      detachErr: Math.round(detachErr),
      realGap: Math.round(realGap),
      ax,
      x,
      y,
      w: bw,
      h: bh,
      cx: rcx,
      cy,
    });
  });

  // 加上上半区视觉重量（原海报建筑两侧对称柱廊，当主轴偏离中心时，宽侧水景提供额外空间负形平衡）
  const meanDetachPx = Math.round(sumDetach / Math.max(1, rects.length));
  const totalMoment = Math.max(0.001, leftMoment + rightMoment);
  const momentBias = (rightMoment - leftMoment) / totalMoment; // -1 左倾 .. +1 右倾
  const skewPct = Math.round(Math.abs(momentBias) * 100);
  const skewDir = momentBias > 0.08 ? "右倾" : momentBias < -0.08 ? "左倾" : "均衡";

  const edgeAxis = state.axisX < 0.22 || state.axisX > 0.78 || clippedCount >= 2;
  const conflict = state.subAxis === "conflict";
  const overTilt = Math.abs(state.tiltDeg) > 14;
  const noTerminus = !state.terminus;
  const detached = detachedCount > 0 || meanDetachPx > 8;
  const unbalanced = Math.abs(momentBias) > 0.34 || leftCount === 0 || rightCount === 0;
  const collision = collisionCount > 0;

  // 7 类双向真错态清单
  const errors = [];
  if (edgeAxis) {
    const sideWord = state.axisX < 0.5 ? "左" : "右";
    errors.push({
      code: "edge_axis",
      badge: `轴线贴${sideWord}边 ${Math.round(state.axisX * 100)}%`,
      title: `主轴被推到${sideWord}沿 ${Math.round(state.axisX * 100)}%，一侧空间已压扁`,
      body: `轴线系统靠左右两翼共同呼应来建立秩序。主轴贴近${sideWord}边界后，${sideWord}翼元素被迫挤撞画框（${clippedCount} 块触边），整张版面退化成单边列表。`,
      hint: `横向把朱红主轴拖回 34%–66% 区间，给两侧留出呼吸余地。`,
      fixLabel: "把主轴移回均衡区",
      fixAction: "fixAxisPos",
    });
  }
  if (conflict) {
    errors.push({
      code: "axis_conflict",
      badge: "双主轴争权",
      title: "平行伪主轴在抢戏，视线左右摇摆",
      body: "画布里同时出现两条分量相当的平行竖轴。眼睛一进来就被扯向两处，谁也不是老大——多轴系统必须分清一条绝对主轴与退让的正交次轴。",
      hint: "把次轴切换为「正交次轴」或「纯单轴」，让朱红主轴重新掌权。",
      fixLabel: "撤掉干扰伪主轴",
      fixAction: "fixSubAxis",
    });
  }
  if (collision) {
    errors.push({
      code: "axis_collision",
      badge: `压轴撞线 ${collisionCount} 块`,
      title: `有 ${collisionCount} 个模块横骑压断了主轴呼吸缝`,
      body: "轴线排印的锐利感来自两翼紧贴却不越界的清晰切缝。模块直接骑到主轴上，把左右两翼糊成一团，隐性脊柱被生生截断。",
      hint: "点击画布上标红的压线模块，让它退回左翼右齐或右翼左齐。",
      fixLabel: "一键齐轴归位",
      fixAction: "fixAlign",
    });
  }
  if (detached) {
    errors.push({
      code: "detached",
      badge: `脱轴 ${detachedCount} 块 · 差 ${meanDetachPx}px`,
      title: `${detachedCount} 个模块脱离主轴飘散，隐性脊柱散架`,
      body: `模块距主轴的咬合缝参差平均偏离 ${meanDetachPx}px。一旦把红色参考线藏起来，眼睛根本拼不出一条直线，页面看起来像随手贴的便利贴。`,
      hint: "点按画布上带红标尺的游离模块（或点下方按钮），让所有模块紧咬轴线两侧。",
      fixLabel: "全部紧咬主轴对齐",
      fixAction: "fixAlign",
    });
  }
  if (overTilt) {
    errors.push({
      code: "over_tilt",
      badge: `倾角过斜 ${state.tiltDeg > 0 ? "+" : ""}${state.tiltDeg}°`,
      title: `主轴斜到 ${Math.abs(state.tiltDeg)}°，排印动感过头变歪斜`,
      body: "斜轴可以制造现代动势，但倾角一旦超过 ±14°，各行文字起点大幅错位，视线每换行都要重新找锚点，读起来既累又显得版面站不稳。",
      hint: "把主轴倾角收回到 0°（庄重）或 ±12° 以内（轻斜动势）。",
      fixLabel: "回正到 ±10° 安全倾角",
      fixAction: "fixTilt",
    });
  }
  if (unbalanced) {
    const heavySide = momentBias >= 0 ? "右" : "左";
    const lightSide = momentBias >= 0 ? "左" : "右";
    errors.push({
      code: "unbalanced",
      badge: `力矩${heavySide}倾 ${skewPct}%`,
      title: `视觉重量向${heavySide}翼倾倒 ${skewPct}%，天平失稳`,
      body: `当前左翼 ${leftCount} 块、右翼 ${rightCount} 块，实测视觉力矩偏向${heavySide}侧 ${skewPct}%。轴线不是非得左右镜像，但一侧压满、${lightSide}侧悬空会让整张画往${heavySide}边栽。`,
      hint: `点击${heavySide}翼的 1–2 个模块翻到${lightSide}翼，或向右/左微移主轴拉平力臂。`,
      fixLabel: "重配两翼力矩平衡",
      fixAction: "fixBalance",
    });
  }
  if (noTerminus) {
    errors.push({
      code: "no_terminus",
      badge: "缺起止端景",
      title: "主轴有路没终点，视线顺中轴滑出画外",
      body: "建筑大师程大锦强调：轴线必须由起止端景（Terminus）收束。现在顶部蓝球端景与底部引导石阶被关掉，视线沿朱红通道直冲出画框边缘，留不住焦心。",
      hint: "打开「起止端景」开关，或点击画布顶部的蓝球虚影锚点。",
      fixLabel: "点亮蓝球与起点端景",
      fixAction: "fixTerminus",
    });
  }

  // 4 项支柱（对应原海报 4 条标尺 + 4 枚蓝圆徽）
  const axisOk = !edgeAxis && !conflict && !overTilt;
  const alignOk = !detached && !collision;
  const balanceOk = !unbalanced;
  const guideOk = !noTerminus && !overTilt;
  const score = [axisOk, alignOk, balanceOk, guideOk].filter(Boolean).length;

  // 判断当前属于哪种合法解
  let solutionName = "";
  if (score === 4) {
    if (Math.abs(state.tiltDeg) >= 5) solutionName = "轻斜动势轴线解";
    else if (Math.abs(state.axisX - 0.5) <= 0.05) solutionName = "经典中轴纪念碑解";
    else solutionName = "现代偏心非对称平衡解";
  }

  const verdict = errors.length
    ? errors[0]
    : {
        code: "ok",
        badge: `4/4 成立 · ${solutionName}`,
        title: `${solutionName}已成立：藏起参考线也站得住`,
        body:
          Math.abs(state.axisX - 0.5) <= 0.05 && Math.abs(state.tiltDeg) < 5
            ? "主轴稳坐中央，六块元素零脱轴咬合，左右视觉力矩近乎等重，视线沿石阶穿过柱廊稳稳落在蓝球端景上。你可以试着关掉「辅助线」验收隐性秩序。"
            : Math.abs(state.tiltDeg) >= 5
              ? `主轴以 ${state.tiltDeg > 0 ? "+" : ""}${state.tiltDeg}° 制造出前倾动势，同时守住了 ≤14° 可读边界与两翼紧密咬合，张力与秩序兼得。`
              : `主轴偏置在 ${Math.round(state.axisX * 100)}%，打破呆板镜像却借重块配重把力矩偏差压在 ${skewPct}% 以内——这正是现代偏心轴线的精妙处。`,
        hint: "现在点「藏起辅助线」看看：没有红线提醒，大脑是不是照样能一眼认出那条隐性脊柱？",
        fixLabel: state.showGuides ? "藏起辅助线验收" : "显露朱红轴线",
        fixAction: "toggleGuides",
      };

  const pillars = {
    axis: {
      ok: axisOk,
      status: edgeAxis ? `贴边 ${Math.round(state.axisX * 100)}%` : conflict ? "双轴争权" : overTilt ? `过斜 ${Math.abs(state.tiltDeg)}°` : `主轴 ${Math.round(state.axisX * 100)}%`,
    },
    align: {
      ok: alignOk,
      status: collision ? `压线 ${collisionCount} 块` : detached ? `脱轴 ${meanDetachPx}px` : "严丝合缝",
    },
    balance: {
      ok: balanceOk,
      status: unbalanced ? `${skewDir} ${skewPct}%` : `均衡 ${skewPct}%`,
    },
    guide: {
      ok: guideOk,
      status: noTerminus ? "无端景滑出" : overTilt ? "动线偏斜" : "端景收束",
    },
  };

  return {
    W,
    H,
    splitY,
    rects,
    score,
    errors,
    verdict,
    pillars,
    metrics: {
      axisPosPct: Math.round(state.axisX * 100),
      tiltDeg: state.tiltDeg,
      meanDetachPx,
      detachedCount,
      collisionCount,
      skewPct,
      skewDir,
      momentBias,
      leftCount,
      rightCount,
      terminus: state.terminus,
      subAxis: state.subAxis,
    },
  };
}
