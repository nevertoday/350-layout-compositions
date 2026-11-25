// 036 C形构图 · 单真源几何模型（Hero 弧抱台、02 节弧度谱、03 节开口剧场、06 节小练习共用）
// 约定：坐标使用画布归一化坐标 u∈[0,1], v∈[0,1]，半径统一按画布短边缩放，保证正圆不压扁。

export const EXPERIENCE_BAND = {
  wrapMin: 175,
  wrapMax: 265,
  wrapTooShallow: 150,
  wrapTooClosed: 290,
  focusInnerMax: 0.36,
  focusOutsideMin: 0.78,
  openMarginMinPct: 24,
  arcRadiusRatio: 0.305, // 相对于短边
};

export const THEMES = {
  poster: {
    id: "poster",
    label: "原海报图谱",
    short: "原海报",
    focusTitle: "视觉焦点",
    focusEn: "FOCAL POINT",
    focusSub: "主体被自然包裹，突出存在感。",
    openLabel: "开口导向",
    openEn: "OPEN DIRECTION",
    blockerTitle: "挡口抢戏块",
    blockerSub: "点此移开",
  },
  lighthouse: {
    id: "lighthouse",
    label: "海岸灯塔摄影",
    short: "海岸灯塔",
    focusTitle: "孤岛灯塔",
    focusEn: "SUBJECT · LIGHTHOUSE",
    focusSub: "弯岬与白浪围抱塔身，开口望向海平线。",
    openLabel: "海平线余白",
    openEn: "HORIZON LEAD SPACE",
    blockerTitle: "近景礁石堆",
    blockerSub: "点此挪开",
  },
  exhibition: {
    id: "exhibition",
    label: "展讯海报编排",
    short: "展讯海报",
    focusTitle: "主雕塑展品",
    focusEn: "EXHIBITION HERO",
    focusSub: "拱形色带托住展品，开口吐出展期排字区。",
    openLabel: "展期排字走廊",
    openEn: "COPY BREATHING ZONE",
    blockerTitle: "硬塞促销贴",
    blockerSub: "点此撤下",
  },
};

export const PRESETS = {
  broken: {
    id: "broken",
    label: "复原 0/4 错态",
    wrapDeg: 332,
    openDeg: 8,
    arcCenter: { u: 0.57, v: 0.52 },
    focus: { u: 0.21, v: 0.26 },
    blockerOn: true,
  },
  posterRight: {
    id: "posterRight",
    label: "原海报右开解",
    wrapDeg: 226,
    openDeg: 0,
    arcCenter: { u: 0.43, v: 0.50 },
    focus: { u: 0.44, v: 0.50 },
    blockerOn: false,
  },
  reverseLeft: {
    id: "reverseLeft",
    label: "倒 C 左开解",
    wrapDeg: 218,
    openDeg: 180,
    arcCenter: { u: 0.58, v: 0.50 },
    focus: { u: 0.57, v: 0.50 },
    blockerOn: false,
  },
  cradleUp: {
    id: "cradleUp",
    label: "仰碗上开解",
    wrapDeg: 205,
    openDeg: 270,
    arcCenter: { u: 0.50, v: 0.59 },
    focus: { u: 0.50, v: 0.57 },
    blockerOn: false,
  },
};

export function createInitialState() {
  return {
    theme: "poster",
    wrapDeg: PRESETS.broken.wrapDeg,
    openDeg: PRESETS.broken.openDeg,
    arcCenter: { ...PRESETS.broken.arcCenter },
    focus: { ...PRESETS.broken.focus },
    blockerOn: PRESETS.broken.blockerOn,
    showRays: true,
    highlightKey: null, // "enclose" | "open" | "hold" | "soft" | null
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function normDeg(deg) {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
}

export function angleDiffDeg(a, b) {
  let d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
}

// 给定画布宽高比 aspect = W / H，换算出正圆半径在归一化 u / v 坐标上的分径
export function circleRadiiUV(aspect) {
  const safeAspect = Math.max(0.6, aspect || 1.45);
  const rShort = EXPERIENCE_BAND.arcRadiusRatio;
  if (safeAspect >= 1) {
    return { ru: rShort / safeAspect, rv: rShort };
  }
  return { ru: rShort, rv: rShort * safeAspect };
}

// 计算从起点 (u0, v0) 沿角度 deg（屏幕角：0右、90下、180左、270上）射向 [0,1]×[0,1] 边界的射线命中点与等比距离
export function castRayToFrame(u0, v0, deg, aspect) {
  const rad = (deg * Math.PI) / 180;
  const du = Math.cos(rad);
  const dv = Math.sin(rad);
  // 用画布短边为单位做等比步进：若 aspect>=1，则 1 单位长度在 u 上是 1/aspect，在 v 上是 1
  const safeAspect = Math.max(0.6, aspect || 1.45);
  const stepU = safeAspect >= 1 ? du / safeAspect : du;
  const stepV = safeAspect >= 1 ? dv : dv * safeAspect;

  let tMax = Infinity;
  let edge = "right";
  const eps = 1e-6;
  if (stepU > eps) {
    const t = (1 - u0) / stepU;
    if (t < tMax) { tMax = t; edge = "right"; }
  } else if (stepU < -eps) {
    const t = (0 - u0) / stepU;
    if (t < tMax) { tMax = t; edge = "left"; }
  }
  if (stepV > eps) {
    const t = (1 - v0) / stepV;
    if (t < tMax) { tMax = t; edge = "bottom"; }
  } else if (stepV < -eps) {
    const t = (0 - v0) / stepV;
    if (t < tMax) { tMax = t; edge = "top"; }
  }
  if (!Number.isFinite(tMax)) tMax = 0;
  const hitU = clamp(u0 + stepU * tMax, 0, 1);
  const hitV = clamp(v0 + stepV * tMax, 0, 1);

  // 同方向画框总跨度（从反方向边缘到正方向边缘的等比全长）
  let tBack = Infinity;
  if (-stepU > eps) tBack = Math.min(tBack, (1 - u0) / -stepU);
  else if (-stepU < -eps) tBack = Math.min(tBack, (0 - u0) / -stepU);
  if (-stepV > eps) tBack = Math.min(tBack, (1 - v0) / -stepV);
  else if (-stepV < -eps) tBack = Math.min(tBack, (0 - v0) / -stepV);
  if (!Number.isFinite(tBack)) tBack = 0;

  return {
    tMax,
    spanTotal: tMax + tBack,
    hitU,
    hitV,
    edge,
    stepU,
    stepV,
  };
}

// 开口方向文案（支持任意角度识别多组合法解）
export function describeOpenOrientation(openDeg) {
  const a = normDeg(openDeg);
  if (a <= 32 || a >= 328) {
    return {
      key: "right",
      label: "向右敞开",
      arrow: "→",
      mood: "顺读延展",
      detail: "贴合中文横排从左到右的阅读惯性，视线先在左侧暖弧中停顿，再顺开口稳稳滑向右方留白与后续故事。",
    };
  }
  if (a >= 148 && a <= 212) {
    return {
      key: "left",
      label: "向左敞开（倒 C）",
      arrow: "←",
      mood: "回望悬念",
      detail: "反常规倒 C 格局：右侧弧脊筑起稳重挡墙，视线被送回左侧开阔区，自带回望、停驻与逆向张力。",
    };
  }
  if (a >= 238 && a <= 302) {
    return {
      key: "up",
      label: "向上敞开（仰碗）",
      arrow: "↑",
      mood: "托举升腾",
      detail: "底部厚弧像一只稳稳的托盘或山谷，把主体承托在怀中，同时让视线顺上方豁口轻盈升向天空或主标题。",
    };
  }
  if (a >= 58 && a <= 122) {
    return {
      key: "down",
      label: "向下敞开（穹顶）",
      arrow: "↓",
      mood: "穹顶庇护",
      detail: "上方圆弧构成拱门与庇护穹顶，视线向下顺着开口落向前景地面、水流或下方行动按钮。",
    };
  }
  if (a > 302 && a < 328) {
    return {
      key: "up-right",
      label: "右上斜开",
      arrow: "↗",
      mood: "昂扬外展",
      detail: "斜向东北方的开放口兼具顺读流畅与昂扬攀升感，常用于海浪、公路与动感产品海报。",
    };
  }
  if (a > 32 && a < 58) {
    return {
      key: "down-right",
      label: "右下斜开",
      arrow: "↘",
      mood: "顺势沉落",
      detail: "视线沿弧顶绕下并顺向右下方落点，适合把情绪轻缓导入右下角签名、信息栏或行动按钮。",
    };
  }
  if (a > 122 && a < 148) {
    return {
      key: "down-left",
      label: "左下斜开",
      arrow: "↙",
      mood: "斜引回落",
      detail: "右上弧背形成遮蔽，视线斜向左下角倾泻，适合左侧留白排字的封面与剧照。",
    };
  }
  return {
    key: "up-left",
    label: "左上斜开",
    arrow: "↖",
    mood: "逆风仰望",
    detail: "右下弧背稳住重量，视线斜向左上方跃升，适合突出孤立主体的回望姿态。",
  };
}

// 计算挡口红块的中心坐标（浮在开口正前方走廊，并保底完整落在画布内）
export function computeBlockerGeometry(state, aspect) {
  const { ru, rv } = circleRadiiUV(aspect);
  const rad = (normDeg(state.openDeg) * Math.PI) / 180;
  const distFactor = 1.15;
  const halfU = clamp(ru * 0.41, 0.08, 0.135);
  const halfV = clamp(rv * 0.36, 0.08, 0.135);
  const u = clamp(state.arcCenter.u + Math.cos(rad) * ru * distFactor, halfU + 0.03, 1 - halfU - 0.03);
  const v = clamp(state.arcCenter.v + Math.sin(rad) * rv * distFactor, halfV + 0.04, 1 - halfV - 0.04);
  return { u, v, halfU, halfV };
}

// 计算 6 条原海报放射状蓝色虚线箭头的真实射线与碰撞点
export function computeApertureRays(state, aspect) {
  const { ru, rv } = circleRadiiUV(aspect);
  const gapDeg = Math.max(8, 360 - state.wrapDeg);
  // 放射扇宽随真实开口扇角收窄或张开，闭口时被死死挤压
  const halfSpread = Math.min(44, Math.max(4, gapDeg * 0.36));
  const count = 6;
  const blocker = state.blockerOn ? computeBlockerGeometry(state, aspect) : null;
  const safeAspect = Math.max(0.6, aspect || 1.45);
  const rShort = EXPERIENCE_BAND.arcRadiusRatio;

  const rays = [];
  for (let i = 0; i < count; i++) {
    const frac = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1..+1
    const deg = normDeg(state.openDeg + frac * halfSpread);
    const rad = (deg * Math.PI) / 180;
    const cast = castRayToFrame(state.arcCenter.u, state.arcCenter.v, deg, safeAspect);
    const startFactor = 0.56; // 从橙色焦点大圆外沿出发
    const startU = state.arcCenter.u + Math.cos(rad) * ru * startFactor;
    const startV = state.arcCenter.v + Math.sin(rad) * rv * startFactor;

    // 期望延伸长度：不超过画框边界，留一点内边距
    const maxLen = Math.max(0.05, cast.tMax - 0.035);
    const idealEndT = Math.min(maxLen, rShort * 2.05);

    let endT = idealEndT;
    let status = "clear"; // "clear" | "blocked" | "wall" | "choked"

    if (state.wrapDeg > EXPERIENCE_BAND.wrapTooClosed) {
      endT = Math.min(endT, rShort * 0.92);
      status = "choked";
    } else if (blocker) {
      // 检测射线是否穿过挡口块 AABB
      const tHit = intersectRayAABB(
        state.arcCenter.u,
        state.arcCenter.v,
        cast.stepU,
        cast.stepV,
        blocker.u - blocker.halfU,
        blocker.v - blocker.halfV,
        blocker.u + blocker.halfU,
        blocker.v + blocker.halfV
      );
      if (tHit !== null && tHit > rShort * 0.52 && tHit < endT) {
        endT = Math.max(rShort * 0.68, tHit - 0.015);
        status = "blocked";
      }
    }

    if (status === "clear" && cast.tMax - rShort < 0.22 * cast.spanTotal) {
      status = "wall";
    }

    const endU = clamp(state.arcCenter.u + cast.stepU * endT, 0.02, 0.98);
    const endV = clamp(state.arcCenter.v + cast.stepV * endT, 0.02, 0.98);

    rays.push({
      deg,
      startU,
      startV,
      endU,
      endV,
      status,
      edge: cast.edge,
    });
  }
  return rays;
}

function intersectRayAABB(ox, oy, dx, dy, minX, minY, maxX, maxY) {
  let tmin = -Infinity;
  let tmax = Infinity;
  if (Math.abs(dx) > 1e-6) {
    const tx1 = (minX - ox) / dx;
    const tx2 = (maxX - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  } else if (ox < minX || ox > maxX) return null;

  if (Math.abs(dy) > 1e-6) {
    const ty1 = (minY - oy) / dy;
    const ty2 = (maxY - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  } else if (oy < minY || oy > maxY) return null;

  if (tmax >= Math.max(0, tmin)) return Math.max(0, tmin);
  return null;
}

// 主评判引擎：单真源实算全部几何量、四要素达标状态、8 类失误诊断与多组合法解
export function evaluate(state, aspect = 1.45) {
  const safeAspect = Math.max(0.6, aspect || 1.45);
  const { ru, rv } = circleRadiiUV(safeAspect);
  const rShort = EXPERIENCE_BAND.arcRadiusRatio;
  const wrapDeg = Math.round(clamp(state.wrapDeg, 65, 350));
  const openDeg = Math.round(normDeg(state.openDeg));
  const gapDeg = 360 - wrapDeg;
  const orientation = describeOpenOrientation(openDeg);

  // 1. 弧心距四边是否被过度裁断
  const arcClipped =
    state.arcCenter.u < ru * 0.72 ||
    state.arcCenter.u > 1 - ru * 0.72 ||
    state.arcCenter.v < rv * 0.72 ||
    state.arcCenter.v > 1 - rv * 0.72;

  // 2. 焦点相对弧心的等比偏移
  const dx = (state.focus.u - state.arcCenter.u) * (safeAspect >= 1 ? safeAspect : 1);
  const dy = (state.focus.v - state.arcCenter.v) * (safeAspect >= 1 ? 1 : 1 / safeAspect);
  const focusDistShort = Math.hypot(dx, dy);
  const focusOffsetRatio = focusDistShort / rShort; // 0 = 正居弧心，1 = 压在弧线上，>1 = 脱抱出弧
  const focusAngle = normDeg((Math.atan2(dy, dx) * 180) / Math.PI);
  const focusTowardOpen = angleDiffDeg(focusAngle, openDeg) <= gapDeg / 2 + 12;

  // 3. 开口前方画内净延伸余白占比（从弧外缘算到画框边）
  const mainRay = castRayToFrame(state.arcCenter.u, state.arcCenter.v, openDeg, safeAspect);
  const outerRimShort = rShort * 0.88;
  const openClearDist = Math.max(0, mainRay.tMax - outerRimShort);
  const openMarginPct = Math.round(clamp((openClearDist / Math.max(0.1, mainRay.spanTotal)) * 100, 0, 75));

  // 4. 放射光线计算
  const rays = computeApertureRays(state, safeAspect);
  const blockedRayCount = rays.filter((r) => r.status === "blocked").length;

  // 5. 四要素独立达标判定（与原海报左脊四要点及核心要点一一对应）
  const wrapOk = wrapDeg >= EXPERIENCE_BAND.wrapMin && wrapDeg <= EXPERIENCE_BAND.wrapMax && !arcClipped;
  const focusOk = focusOffsetRatio <= EXPERIENCE_BAND.focusInnerMax;
  const openSpaceOk = openMarginPct >= EXPERIENCE_BAND.openMarginMinPct && wrapDeg <= EXPERIENCE_BAND.wrapTooClosed;
  const flowOk = !state.blockerOn && wrapOk && openSpaceOk;

  const checks = {
    enclose: {
      ok: wrapOk,
      status: arcClipped
        ? "弧脊压边"
        : wrapDeg > EXPERIENCE_BAND.wrapTooClosed
          ? `${wrapDeg}° 闭口成 O`
          : wrapDeg > EXPERIENCE_BAND.wrapMax
            ? `${wrapDeg}° 略紧`
            : wrapDeg < EXPERIENCE_BAND.wrapTooShallow
              ? `${wrapDeg}° 过浅散怀`
              : wrapDeg < EXPERIENCE_BAND.wrapMin
                ? `${wrapDeg}° 偏浅`
                : `${wrapDeg}° 抱合稳妥`,
    },
    hold: {
      ok: focusOk,
      status: focusOk
        ? `偏心 ${Math.round(focusOffsetRatio * 100)}% 归怀`
        : focusOffsetRatio >= EXPERIENCE_BAND.focusOutsideMin
          ? focusTowardOpen
            ? "滑出开口"
            : "脱抱出弧"
          : focusTowardOpen
            ? "偏滑近口"
            : "紧顶弧壁",
    },
    soft: {
      ok: openSpaceOk,
      status:
        wrapDeg > EXPERIENCE_BAND.wrapTooClosed
          ? "开口锁死"
          : openMarginPct < EXPERIENCE_BAND.openMarginMinPct
            ? `余白 ${openMarginPct}% 撞壁`
            : `余白 ${openMarginPct}% ${orientation.arrow}`,
    },
    flow: {
      ok: flowOk,
      status:
        state.blockerOn && wrapDeg > EXPERIENCE_BAND.wrapTooClosed
          ? "闭口+挡口"
          : state.blockerOn
            ? blockedRayCount > 0
              ? `挡口截停 (${blockedRayCount}束)`
              : "门口受堵"
            : wrapDeg > EXPERIENCE_BAND.wrapTooClosed
              ? "圈内打转"
              : !openSpaceOk
                ? "延伸受阻"
                : !wrapOk
                  ? "弧力不足"
                  : `${orientation.mood}`,
    },
  };

  const score = [checks.enclose.ok, checks.hold.ok, checks.soft.ok, checks.flow.ok].filter(Boolean).length;

  // 6. 诊断优先级树（覆盖 8 类典型失误 + 合规多解白话解读）
  let code = "pass";
  let severity = "ok"; // "error" | "warn" | "ok"
  let badge = `已成局 · ${orientation.label} (4/4)`;
  let headline = `C 弧稳抱主体，视线顺${orientation.label}自然延展`;
  let body = `当前包裹角 ${wrapDeg}°（开口扇角 ${gapDeg}°）落在经验舒适带内，视觉焦点安稳居中，${orientation.label}留出 ${openMarginPct}% 的画内延伸走廊。${orientation.detail}`;
  let hint = `还可以继续探索其他合法解：比如把蓝箭旋到左方试「倒 C 左开解」，或旋到上方试「仰碗上开解」，感受故事方向的变化。`;
  let flowGrade = "柔抱顺延（示意）";

  if (wrapDeg > EXPERIENCE_BAND.wrapTooClosed) {
    code = "closed_o";
    severity = "error";
    badge = `错态 · 闭口成 O (${score}/4)`;
    headline = `弧度合拢到 ${wrapDeg}°，C 形退化成闷死的封闭圆圈`;
    body = `此刻开口只剩 ${gapDeg}° 窄缝，外脊几乎咬合成一只闭口 O 环。视线被关在圆圈里反复打转、出不去，既失去「开口导向」的延伸空间，也让主体像被关进笼子一样局促。`;
    hint = `在画布空白处向左横拖（或按 ← 键），把包裹角收回到 175°–265° 经验参考带，替画面打开呼吸口。`;
    flowGrade = "闷闭打转（示意）";
  } else if (wrapDeg < EXPERIENCE_BAND.wrapTooShallow) {
    code = "too_shallow";
    severity = "error";
    badge = `错态 · 浅弓散怀 (${score}/4)`;
    headline = `弧度只剩 ${wrapDeg}°，变成一弯抱不住主体的浅弧`;
    body = `弧长短于半圆（180°）过多时，格式塔的围合倾向大幅减弱。眼睛滑过这条浅弯线很快就会散掉，主体像暴露在空旷背景里，失去 C 形构图最核心的包裹与安全感。`;
    hint = `在画布空白处向右横拖（或按 → 键），把包裹角拉长到 175°–265° 之间，重新建立半围合怀抱。`;
    flowGrade = "滑过难留（示意）";
  } else if (focusOffsetRatio >= EXPERIENCE_BAND.focusOutsideMin) {
    code = "focus_escaped";
    severity = "error";
    badge = `错态 · 主体脱抱 (${score}/4)`;
    headline = focusTowardOpen
      ? "视觉焦点滑出开口之外，弧怀空无一物"
      : "视觉焦点掉在弧背外侧，C 弧背对着主角";
    body = `橙色焦点已偏离弧心达 ${Math.round(focusOffsetRatio * 100)}% 弧半径，彻底脱离了弧线围合的内腹。此时弧线不但帮不到主体聚焦，反而成了分散注意力的多余装饰块。`;
    hint = `直接拖动橙色「视觉焦点」大圆，把它送回 C 弧环抱的内腹中心附近（靠近弧心会轻轻吸附）。`;
    flowGrade = "脱抱失焦（示意）";
  } else if (state.blockerOn) {
    code = "aperture_blocked";
    severity = "error";
    badge = `错态 · 堵口憋闷 (${score}/4)`;
    headline = "开口正前方被杂物块卡死，视线刚出弧就撞停";
    body = `C 弧留出的开口本该像一条通往画外故事的走廊；现在正门口横着高对比抢戏块，直接截断了 ${blockedRayCount} 束放射视线。眼睛还没来得及顺着开口延展，就被门口的杂物绊住了脚。`;
    hint = `直接在画布上点击开口处红色虚线「挡口块」把它移走，清空视线出口。`;
    flowGrade = "堵口截停（示意）";
  } else if (openMarginPct < EXPERIENCE_BAND.openMarginMinPct) {
    code = "wall_collision";
    severity = "error";
    badge = `错态 · 开口撞壁 (${score}/4)`;
    headline = `开口朝向近边画框，前方只剩 ${openMarginPct}% 窄缝`;
    body = `你让 C 弧${orientation.label}，但弧心离那一侧画框太近，开口外侧几乎没有延伸余白。蓝色放射视线刚离开焦点就一头撞上画框边缘反弹，故事感和呼吸空间被硬生生斩断。`;
    hint = `两条路都能救活：把蓝「开口导向」箭柄旋向更开阔的画内一侧（例如倒 C 朝左），或拖动弧背白环把整只 C 弧挪离画框边。`;
    flowGrade = "撞壁折返（示意）";
  } else if (arcClipped) {
    code = "arc_clipped";
    severity = "warn";
    badge = `待调 · 弧脊压边 (${score}/4)`;
    headline = "弧心贴近画框边缘，C 弧外脊被裁缺了一大段";
    body = `弧线压出边界后，原本连续流畅的包裹曲线被打断，画面的平衡与柔性框架感同时受损。`;
    hint = `拖动弧背上的白色锚环，把弧心往画布内腹轻轻收回。`;
    flowGrade = "弧脊断连（示意）";
  } else if (!focusOk) {
    code = "focus_edge";
    severity = "warn";
    badge = `待调 · 焦点偏心 (${score}/4)`;
    headline = focusTowardOpen ? "焦点滑到开口边缘，怀抱感偏弱" : "焦点紧贴弧壁，缺少弧内呼吸缓冲";
    body = `橙色焦点偏离弧心 ${Math.round(focusOffsetRatio * 100)}% 弧半径。主体与弧带之间需要留出一圈柔和缓冲，才能同时感到「被抱住」又「不被挤住」。`;
    hint = `把橙色焦点圆往弧怀中心轻拖回一点，令偏移降到 36% 弧半径以内。`;
    flowGrade = "偏心待稳（示意）";
  } else if (!wrapOk) {
    code = wrapDeg > EXPERIENCE_BAND.wrapMax ? "wrap_tight" : "wrap_loose";
    severity = "warn";
    badge = `微调 · 弧度偏${wrapDeg > EXPERIENCE_BAND.wrapMax ? "紧" : "浅"} (${score}/4)`;
    headline =
      wrapDeg > EXPERIENCE_BAND.wrapMax
        ? `包裹角 ${wrapDeg}° 略紧，开口正在变窄`
        : `包裹角 ${wrapDeg}° 略浅，包裹力度还可加厚`;
    body = `目前已经很接近成立的 C 形结构，但把包裹角微调进 175°–265° 经验参考带，能在「护住主体」与「留出开口」之间拿到更舒展的黄金平衡。`;
    hint = `在画布空白处轻轻左右横拖，把包裹角微调到 175°–265° 之间即可达成 4/4。`;
    flowGrade = "接近平衡（示意）";
  }

  return {
    wrapDeg,
    openDeg,
    gapDeg,
    arcClipped,
    focusOffsetRatio,
    focusOffsetPct: Math.round(focusOffsetRatio * 100),
    focusTowardOpen,
    openMarginPct,
    orientation,
    rays,
    blockedRayCount,
    checks,
    score,
    code,
    severity,
    badge,
    headline,
    body,
    hint,
    flowGrade,
  };
}

// 02 节：弧度谱连续扫描诊断（从 85° 浅弓到 350° 闭口 O 圈）
export function evaluateArcSpectrum(wrapDeg) {
  const deg = Math.round(clamp(wrapDeg, 85, 350));
  const gap = 360 - deg;
  if (deg < 150) {
    return {
      deg,
      gap,
      stage: "shallow",
      tag: "浅弓期 · < 150°",
      title: "更像单边导引线，抱不住主体",
      dwell: "短暂停留（示意）",
      desc: "弧长不足半圆，格式塔的围合效应还没有建立。眼睛顺弧滑过就直接离开，适合作为局部流动装饰，但撑不起「包裹主体」的 C 形安全感。",
    };
  }
  if (deg <= 265) {
    return {
      deg,
      gap,
      stage: "sweet",
      tag: "C 形舒适带 · 175°–265°",
      title: "三面柔抱 + 一面敞口，停得住也走得远",
      dwell: "均衡滞留并顺延（示意）",
      desc: "弧线超过半圆却故意不合拢：大脑一边用「闭合倾向」认出它是个完整怀抱，让目光在主体停留；一边顺着留出的豁口把情绪送向画内余白。",
    };
  }
  if (deg <= 295) {
    return {
      deg,
      gap,
      stage: "tight",
      tag: "收口临界 · 266°–295°",
      title: "豁口变窄，开始滑向封闭圆环",
      dwell: "强停留 · 延展偏弱（示意）",
      desc: "包裹感非常强，适合强调极度私密或窥视的氛围；但如果再继续合拢，出口的视线张力就会消失，整张画面会开始发闷。",
    };
  }
  return {
    deg,
    gap,
    stage: "closed",
    tag: "闭口 O 环 · > 295°",
    title: "完全合拢，视线被锁死在圆笼里",
    dwell: "困死循环（示意）",
    desc: "开口缩小到不足 65° 甚至闭合后，C 形已退化为 O 形框。眼睛只能在圈内原地打转，再也没有「开口导向」带来的故事延展与呼吸感。",
  };
}

// 03 节：四向开口叙事剧场配置
export const DIRECTION_STORIES = [
  {
    id: "right",
    openDeg: 0,
    arrow: "→",
    title: "向右开口 · 正 C",
    en: "OPEN RIGHT · FORWARD FLOW",
    archetype: "顺读叙事 / 启程感",
    scene: "海湾码头与望向远方的观海人（侧影）",
    why: "中文与英文横排都习惯从左往右阅读。把弧脊放在左侧挡风托底，开口朝右敞向开阔留白，眼睛进画毫不费力，先抱住人物与灯塔，再顺势望向未完的远方。",
    fit: "横向海报主视觉、网站 Hero 头图、公路/海岸风景、人物面朝右的肖像。",
  },
  {
    id: "left",
    openDeg: 180,
    arrow: "←",
    title: "向左开口 · 倒 C",
    en: "OPEN LEFT · RETROSPECTIVE",
    archetype: "回望悬念 / 稳重收束",
    scene: "右侧拱廊环抱下的驻足者（侧影）",
    why: "开口反指左侧，与默认右向阅读形成微妙的「逆向刹车」。视线先被右侧拱弧接住，再向左片留白回望，天然带有回忆、沉思、电影留白或左侧排字的呼吸感。",
    fit: "电影剧照、情绪人像、右侧有重色主体而左侧需要排大标题的杂志跨页。",
  },
  {
    id: "up",
    openDeg: 270,
    arrow: "↑",
    title: "向上开口 · 仰碗 U/C",
    en: "OPEN UP · CRADLE & LIFT",
    archetype: "承托升腾 / 轻盈开阔",
    scene: "山谷与湖岸托起升空的明月与远帆",
    why: "弧脊沉在底部像一只稳固的碗或双手，把视觉重心稳稳兜住，开口直指天空。上方留出大块纯净负空间，最适合托举轻盈主体或放呼吸感十足的竖版顶部大标。",
    fit: "茶杯/器物产品静物、山谷仰拍、竖版封面（上方排标题）、升腾主题。",
  },
  {
    id: "down",
    openDeg: 90,
    arrow: "↓",
    title: "向下开口 · 穹顶拱",
    en: "OPEN DOWN · CANOPY SHELTER",
    archetype: "庇护笼罩 / 引向前景",
    scene: "树冠垂枝与拱门垂荫下的林荫小径",
    why: "弧线压在顶部化作天然屋檐、树冠或浪峰穹顶，先给主体一种被遮蔽保护的私密包裹感，再把视线沿着拱壁向下导向前景路面、倒影或底部行动区。",
    fit: "洞穴/拱门框景、林间俯引路径、需要突出安全庇护感的家居与母婴画面。",
  },
];

// 06 节：小练习四选一（严格单变量盲测，中性标签绝不泄露好坏）
export const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    caption: "弧度 340° 堤岸环绕灯塔，右侧留 20° 细缝",
    wrapDeg: 340,
    openDeg: 0,
    arcCenter: { u: 0.45, v: 0.50 },
    focus: { u: 0.45, v: 0.50 },
    correct: false,
    feedback: "这是「闭口成 O」陷阱：堤岸绕到 340° 几乎合拢成一个死圆环，右侧细缝根本导不出视线。灯塔看起来不是被柔和托住，而是被圈禁在局促的闭框里。",
  },
  {
    id: "B",
    label: "方案 B",
    caption: "弧度 220° 堤岸开口朝右，弧口距右缘余白 11%",
    wrapDeg: 220,
    openDeg: 0,
    arcCenter: { u: 0.67, v: 0.50 },
    focus: { u: 0.67, v: 0.50 },
    correct: false,
    feedback: "弧度本身没问题，但犯了「开口撞壁」：开口虽朝右，右边缘却只剩 11% 的逼仄窄缝。视线顺弧滑出后立刻撞在画框边界上，完全丧失故事延展感。",
  },
  {
    id: "C",
    label: "方案 C",
    caption: "弧度 225° 堤岸居左半抱灯塔，右侧敞开 38% 海面",
    wrapDeg: 225,
    openDeg: 0,
    arcCenter: { u: 0.40, v: 0.50 },
    focus: { u: 0.41, v: 0.50 },
    correct: true,
    feedback: "判断准确！方案 C 同时拿齐了 C 形构图的全部要领：225° 柔性弧线三面包住灯塔稳住停留，同时把弧心偏左安放，让右侧开口对着 38% 的开阔海平线自然延展。",
  },
  {
    id: "D",
    label: "方案 D",
    caption: "弧度 95° 浅弧贴左缘，灯塔位于弧背外侧空域",
    wrapDeg: 95,
    openDeg: 0,
    arcCenter: { u: 0.34, v: 0.50 },
    focus: { u: 0.72, v: 0.48 },
    correct: false,
    feedback: "这是「浅弧散怀 + 主体脱抱」：95° 的浅弧根本形不成怀抱，而且主体灯塔掉在弧怀之外的空域里，弧线与主体各自为政，失去聚焦与保护作用。",
  },
];
