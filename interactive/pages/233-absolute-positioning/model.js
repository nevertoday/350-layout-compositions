// 233 绝对定位布局 · 单一真源逻辑模型 (model.js)
// 所有坐标、包含块边界、重叠面积、四项校验、白话诊单和实时 CSS 均由此处算出

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;
export const NARROW_W = 540;

// 开场 0/4 翻车态：四处最常见的绝对定位失误全部同时出现
export function createBrokenState() {
  return {
    skin: "poster",        // "poster" | "ui"
    parentPos: "static",   // "static" (漏锚逃逸) | "relative" (已立锚)
    parentNarrow: false,   // false (800px) | true (540px 窄框压测)
    // 居中朱红方块的逻辑坐标（默认采用 top/left 左上角坐标，单位 px，按 800×600 逻辑坐标系）
    // 开场模拟新手写 top: 50%; left: 50%; 却忘了 transform: translate(-50%, -50%)
    centerX: 400,          // 左上角 X（若 translateCenter=false，则中心落在 400 + w/2 = 485）
    centerY: 300,          // 左上角 Y（若 translateCenter=false，则中心落在 300 + h/2 = 385）
    translateCenter: false,// false: 左上角落在(centerX, centerY); true: 中心落在(centerX, centerY)
    centerZ: 1,            // 居中块 z-index：开场 1，小于层叠覆盖的 6，被深松绿反压
    coverZ: 6,             // 层叠覆盖块 z-index：开场 6，高过居中块
    rightMode: "left-px",  // "left-px" (写死 left: 668px) | "right-px" (right: 30px)
    highlightKey: null,    // 点击关键词高亮某类元素
  };
}

export function createPosterSolution() {
  return {
    skin: "poster",
    parentPos: "relative",
    parentNarrow: false,
    centerX: 400,
    centerY: 300,
    translateCenter: true,
    centerZ: 3,
    coverZ: 1,
    rightMode: "right-px",
    highlightKey: null,
  };
}

// 逻辑尺寸（以 800×600 原海报坐标系为基准）
export const BLOCK_SPECS = {
  top: { w: 248, h: 90, top: 18 },
  left: { d: 138, left: 18 },
  right: { d: 130, top: 72, right: 28, badLeft: 668 },
  center: { w: 204, h: 184 },
  cover: { w: 146, h: 102 },
  bottom: { w: 248, h: 86, bottom: 18 },
};

// 计算在给定逻辑坐标系下所有元素的精确矩形（相对于 .parent 左上角；
// 当 parentPos === "static" 时，绝对定位子元素会逃逸到外层 .stage-viewport！）
export function computeGeometry(state) {
  const pw = state.parentNarrow ? NARROW_W : LOGICAL_W;
  const ph = LOGICAL_H;
  // 外层视口比 .parent 四周多出恰到好处的逃逸带，既清楚展示逃出边框又不浪费桌面空间
  const vpPadX = state.parentNarrow ? 148 : 54;
  const vpPadY = 42;
  const vpW = pw + vpPadX * 2;
  const vpH = ph + vpPadY * 2;
  const parentRect = { x: vpPadX, y: vpPadY, w: pw, h: ph };

  // 参照容器（包含块）：parentPos === "relative" 时是 .parent；为 "static" 时跳到外层视口 (0,0,vpW,vpH)
  const cb = state.parentPos === "relative"
    ? parentRect
    : { x: 0, y: 0, w: vpW, h: vpH };

  // 1. 置顶（top: 20px; left: 50%; translateX(-50%)）
  const topRect = {
    x: cb.x + cb.w / 2 - BLOCK_SPECS.top.w / 2,
    y: cb.y + BLOCK_SPECS.top.top,
    w: BLOCK_SPECS.top.w,
    h: BLOCK_SPECS.top.h,
  };

  // 2. 靠左（top: 50%; left: 20px; translateY(-50%)）
  const leftRect = {
    x: cb.x + BLOCK_SPECS.left.left,
    y: cb.y + cb.h / 2 - BLOCK_SPECS.left.d / 2,
    w: BLOCK_SPECS.left.d,
    h: BLOCK_SPECS.left.d,
  };

  // 3. 置底（bottom: 20px; left: 50%; translateX(-50%)）
  const bottomRect = {
    x: cb.x + cb.w / 2 - BLOCK_SPECS.bottom.w / 2,
    y: cb.y + cb.h - BLOCK_SPECS.bottom.bottom - BLOCK_SPECS.bottom.h,
    w: BLOCK_SPECS.bottom.w,
    h: BLOCK_SPECS.bottom.h,
  };

  // 4. 靠右圆（锚定模式：left-px 写死 left: 668px vs right-px 写 right: 30px）
  const rightTop = state.parentPos === "static" ? 10 : BLOCK_SPECS.right.top;
  const rightX = state.rightMode === "right-px"
    ? cb.x + cb.w - BLOCK_SPECS.right.right - BLOCK_SPECS.right.d
    : cb.x + BLOCK_SPECS.right.badLeft;
  const rightRect = {
    x: rightX,
    y: cb.y + rightTop,
    w: BLOCK_SPECS.right.d,
    h: BLOCK_SPECS.right.d,
  };

  // 5. 居中朱红方（受 centerX/centerY 和 translateCenter 控制，以 cb 为参照原点）
  // 为了支持 800↔540 缩宽，当用户未偏离百分比时 centerX 按比例映射，或直接按逻辑像素
  const anchorX = state.centerX * (cb.w / LOGICAL_W);
  const anchorY = state.centerY * (cb.h / LOGICAL_H);
  const cX = state.translateCenter
    ? cb.x + anchorX - BLOCK_SPECS.center.w / 2
    : cb.x + anchorX;
  const cY = state.translateCenter
    ? cb.y + anchorY - BLOCK_SPECS.center.h / 2
    : cb.y + anchorY;
  const centerRect = {
    x: cX,
    y: cY,
    w: BLOCK_SPECS.center.w,
    h: BLOCK_SPECS.center.h,
  };

  // 6. 层叠覆盖深松绿方：停在参照容器中心偏右下（忠实复刻 233 号原海报位置）
  // 留出居中块上半部「居中 / 拖动」标题清晰可读，同时清晰覆盖其右下区域
  const coverRect = {
    x: cb.x + cb.w / 2 + 48,
    y: cb.y + cb.h / 2 + 62,
    w: BLOCK_SPECS.cover.w,
    h: BLOCK_SPECS.cover.h,
  };

  return {
    vpW, vpH, pw, ph, vpPadX, vpPadY,
    parentRect, cb,
    rects: {
      top: topRect,
      left: leftRect,
      right: rightRect,
      center: centerRect,
      cover: coverRect,
      bottom: bottomRect,
    },
  };
}

export function rectOverlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

// 评估 4 项核心规则与完整白话诊断
export function evaluateState(state) {
  const geo = computeGeometry(state);
  const { parentRect, cb, rects } = geo;
  const c = rects.center;
  const r = rects.right;

  // 规则 1：参照容器立锚（.parent 必须设非 static，否则子元素脱离 .parent 逃逸到外层）
  const parentAnchored = state.parentPos === "relative";
  const rightEscapeTop = Math.max(0, Math.round(parentRect.y - r.y));
  const rightEscapeRight = Math.max(0, Math.round((r.x + r.w) - (parentRect.x + parentRect.w)));
  const topEscape = Math.max(0, Math.round(parentRect.y - rects.top.y));

  // 规则 2：精确居中与防碰撞（居中块几何中心贴近父容器中心且不压撞置顶/置底/靠左/靠右，也不出框）
  const targetCx = parentRect.x + parentRect.w / 2;
  const targetCy = parentRect.y + parentRect.h / 2;
  const actualCx = c.x + c.w / 2;
  const actualCy = c.y + c.h / 2;
  const dx = Math.round(actualCx - targetCx);
  const dy = Math.round(actualCy - targetCy);
  const centerDist = Math.round(Math.hypot(dx, dy));

  const hitTop = rectOverlapArea(c, rects.top);
  const hitBottom = rectOverlapArea(c, rects.bottom);
  const hitLeft = rectOverlapArea(c, rects.left);
  const hitRight = rectOverlapArea(c, rects.right);
  const hitNeighbor = hitTop + hitBottom + hitLeft + hitRight;
  const hitNeighborName = hitTop > 0 ? "置顶" : hitBottom > 0 ? "置底" : hitLeft > 0 ? "靠左" : hitRight > 0 ? "靠右" : "";

  const centerOutOfParent =
    c.x < parentRect.x - 1 ||
    c.y < parentRect.y - 1 ||
    c.x + c.w > parentRect.x + parentRect.w + 1 ||
    c.y + c.h > parentRect.y + parentRect.h + 1;

  // 允许误差 ±26px（直观容差，拖进中轴舒适带或开 translate(-50%,-50%) 都算精准）
  const centerExact = parentAnchored && centerDist <= 26 && hitNeighbor === 0 && !centerOutOfParent;
  const forgotTranslate = !state.translateCenter && Math.abs(state.centerX - 400) <= 18 && Math.abs(state.centerY - 300) <= 18;

  // 规则 3：层叠秩序（居中主块 z-index 必须严格高于层叠覆盖块，且不能为负值沉到流底）
  const coverOverlap = rectOverlapArea(c, rects.cover);
  const centerBuriedNegative = state.centerZ < 0;
  const centerCoveredByGreen = state.centerZ <= state.coverZ;
  const stackingOk = !centerBuriedNegative && state.centerZ > state.coverZ;

  // 规则 4：边缘参照（靠右圆必须使用 right: 30px 锚定，而不是写死 left: 668px）
  const rightOverflowParent = Math.max(0, Math.round((r.x + r.w) - (parentRect.x + parentRect.w)));
  const rightEdgeDist = Math.round((parentRect.x + parentRect.w) - (r.x + r.w));
  const rightAnchorOk = state.rightMode === "right-px" && parentAnchored && rightOverflowParent === 0;

  const checks = {
    anchor: {
      ok: parentAnchored,
      label: "参照容器",
      short: parentAnchored ? "已立锚 relative" : `逃逸外框 ${Math.max(rightEscapeTop, topEscape)}px`,
    },
    center: {
      ok: centerExact,
      label: "坐标精准",
      short: centerExact
        ? (centerDist <= 2 ? "正中 (400, 300)" : `微偏 ${centerDist}px`)
        : hitNeighbor > 0
          ? `撞叠「${hitNeighborName}」`
          : centerOutOfParent
            ? "越出父容器"
            : forgotTranslate
              ? "忘减半尺寸"
              : `偏离 (${dx >= 0 ? "+" : ""}${dx}, ${dy >= 0 ? "+" : ""}${dy})`,
    },
    stack: {
      ok: stackingOk,
      label: "层叠秩序",
      short: stackingOk
        ? `主 z:${state.centerZ} > 辅 z:${state.coverZ}`
        : centerBuriedNegative
          ? `z:${state.centerZ} 沉底`
          : `被绿压 z:${state.coverZ}`,
    },
    edge: {
      ok: rightAnchorOk,
      label: "贴边适配",
      short: rightAnchorOk
        ? "right: 30px"
        : state.rightMode === "left-px"
          ? (rightOverflowParent > 0 ? `溢出 +${rightOverflowParent}px` : "写死 left")
          : "随父飞出",
    },
  };

  const score = [checks.anchor.ok, checks.center.ok, checks.stack.ok, checks.edge.ok].filter(Boolean).length;

  // 计算按当前优先级的「白话诊断」：说清是什么错、为什么会这样、下一步怎么动手
  let diag;
  if (!parentAnchored) {
    diag = {
      tone: "err",
      badge: "错态 · 父容器未立锚",
      title: `子元素集体逃出 .parent，直接飞向了外层视口`,
      why: `绝对定位不是「相对亲爸爸」，而是相对最近的非 static 祖先。现在 .parent 仍是默认 position: static，浏览器一路向上找不到已定位祖先，于是置顶、靠左、靠右全部以最外层视口为 (0, 0) 原点，直接冲破了奶油色边框。`,
      action: `把「参照容器 .parent」切到 position: relative，亲眼看 6 枚块瞬间收回 (0, 0)–(800, 600) 坐标系内。`,
    };
  } else if (centerBuriedNegative) {
    diag = {
      tone: "err",
      badge: "错态 · 负层级沉底",
      title: `居中朱红块设了 z-index: ${state.centerZ}，整块沉到辅助线和绿块后面`,
      why: `负值 z-index 会把元素压到当前层叠上下文的常规文档流甚至背景层下方。读者不仅看漏主视觉，连点击事件都会被上层截走。`,
      action: `把「居中块 z-index」抬到高于绿块（如 z-index: 3），让主视觉回到最前景。`,
    };
  } else if (centerCoveredByGreen) {
    diag = {
      tone: "err",
      badge: "错态 · 层叠顺序倒挂",
      title: `深松绿「层叠覆盖」(z-index: ${state.coverZ}) 盖住了主视觉「居中」(z-index: ${state.centerZ})`,
      why: `脱离文档流后多个绝对定位块可以自由叠放，浏览器按 z-index 从小到大绘制；同值则后写的元素压前面。现在辅块层级更高，直接切掉了居中主块的一角。`,
      action: `把「居中块层级」调到 z-index: 3（高于绿块 z-index: 1），或降低绿块层级，恢复主前辅后。`,
    };
  } else if (hitNeighbor > 0) {
    diag = {
      tone: "err",
      badge: "错态 · 脱流硬撞邻块",
      title: `朱红「居中」块撞叠上了「${hitNeighborName}」块`,
      why: `绝对定位彻底脱离文档流，元素之间不会像普通流或弹性盒那样自动互相礼让推开——坐标一重叠就直接硬压上去，遮挡文字与点击区。`,
      action: `按住朱红块拖回奶油画布正中（中轴交叉点附近会自动轻吸），留出四周呼吸缝。`,
    };
  } else if (centerOutOfParent) {
    diag = {
      tone: "err",
      badge: "错态 · 坐标越出容器",
      title: `朱红「居中」块已经越出 .parent 边界`,
      why: `绝对定位默认不受父容器内容尺寸限制，坐标超出 (0, 0)–(${geo.pw}, ${geo.ph}) 就会直接挂到框外；父容器若加了 overflow: hidden 还会把它生生裁断。`,
      action: `将朱红块拖回 .parent 内部中央，或点击「补 translate(-50%,-50%)」让它稳居中心。`,
    };
  } else if (!centerExact) {
    diag = {
      tone: "err",
      badge: forgotTranslate ? "错态 · 忘了减自身半尺寸" : "错态 · 偏离中轴原点",
      title: forgotTranslate
        ? `只写了 top: 50%; left: 50%，是「左上角」居中而不是「整块」居中`
        : `朱红块中心偏离容器正中 (${dx >= 0 ? "+" : ""}${dx}px, ${dy >= 0 ? "+" : ""}${dy}px)`,
      why: forgotTranslate
        ? `CSS 定位坐标默认锚定元素的左上角。所以 top: 50%; left: 50% 只把左上角放到 (400, 300)，整块反而斜坠进右下象限，还差点撞上「层叠覆盖」。`
        : `在绝对坐标系里，肉眼感受到的居中看的是元素几何中心与容器 (50%, 50%) 的对齐，而不是盒子的单边起点。`,
      action: forgotTranslate
        ? `直接把朱红块向左上拖回中轴交点，或打开「补 translate(-50%, -50%)」让它回退自身宽高的一半。`
        : `继续拖动朱红块靠近虚线中轴交点（或按方向键微调，靠近正中时会自动轻吸）。`,
    };
  } else if (!rightAnchorOk) {
    diag = {
      tone: "err",
      badge: rightOverflowParent > 0 ? `错态 · 缩窄溢出 +${rightOverflowParent}px` : "错态 · 靠右却锁死左边",
      title: rightOverflowParent > 0
        ? `容器缩窄到 ${geo.pw}px，写死 left: 668px 的「靠右」圆当场冲破右墙`
        : `「靠右」圆写死了 left: 668px，容器一变窄就会立刻溢出`,
      why: `靠右停靠的元素如果用 left 从左边数像素，一旦换到小屏或侧栏收窄，它依然死守 668px 距离，直接甩出容器外。用 right: 30px 才能真正贴着右边呼吸。`,
      action: `把「靠右圆锚边」切到 right: 30px，再点一次「窄框压测 540px」验证它始终紧贴右内侧 30px。`,
    };
  } else {
    diag = {
      tone: "ok",
      badge: "4 / 4 校准完成",
      title: `精确立锚、正中对齐、主前辅后、贴边抗缩`,
      why: `现在 .parent 用 relative 确立了 (0, 0)–(${geo.pw}, ${geo.ph}) 坐标系，6 枚子元素互不干扰地落在各自坐标上，即使切换「窄框 540px」也能保持边缘与居中关系不乱。`,
      action: `试着切换「窄框 540px」或「商品卡片 UI」皮肤，或故意把朱红块拖偏、切回 static，观察规则怎样实时反制。`,
    };
  }

  // 生成与当前画布 100% 同步的真实 CSS 源码
  const relLeft = Math.round(c.x - cb.x);
  const relTop = Math.round(c.y - cb.y);
  const relLeftPct = ((state.centerX / LOGICAL_W) * 100).toFixed(0);
  const relTopPct = ((state.centerY / LOGICAL_H) * 100).toFixed(0);
  const usingPctCenter = state.translateCenter && Math.abs(state.centerX - 400) <= 6 && Math.abs(state.centerY - 300) <= 6;
  const usingHalfNoTrans = !state.translateCenter && Math.abs(state.centerX - 400) <= 6 && Math.abs(state.centerY - 300) <= 6;

  const cssLines = [
    `.parent {`,
    `  position: ${state.parentPos};${state.parentPos === "static" ? " /* [!] 未立锚 */" : ""}`,
    `  width: ${geo.pw}px; height: ${geo.ph}px;`,
    `}`,
    `.center {`,
    `  position: absolute;`,
    usingPctCenter
      ? `  top: 50%; left: 50%;`
      : usingHalfNoTrans
        ? `  top: 50%; left: 50%; /* [!] 未居中 */`
        : `  top: ${relTop}px; left: ${relLeft}px;`,
    ...(state.translateCenter
      ? [usingPctCenter ? `  transform: translate(-50%, -50%);` : `  /* 中心 (${relLeftPct}%, ${relTopPct}%) */`]
      : []),
    `  z-index: ${state.centerZ};${state.centerZ <= state.coverZ ? ` /* [!] 低于 ${state.coverZ} */` : ""}`,
    `}`,
    `.right-dot {`,
    `  position: absolute; top: ${state.parentPos === "static" ? 10 : BLOCK_SPECS.right.top}px;`,
    state.rightMode === "right-px"
      ? `  right: ${BLOCK_SPECS.right.right}px;`
      : `  left: ${BLOCK_SPECS.right.badLeft}px; /* [!] 易溢出 */`,
    `}`,
  ].join("\n");

  return {
    geo,
    checks,
    score,
    dx,
    dy,
    centerDist,
    relLeft,
    relTop,
    rightEdgeDist,
    rightOverflowParent,
    coverOverlap,
    diag,
    cssText: cssLines,
  };
}

// ---------- 03 节：四边坐标与自动拉伸纯逻辑 ----------
export function evalInsetBox({ containerW, containerH, useTop, useRight, useBottom, useLeft, top, right, bottom, left, explicitSize }) {
  const defaultW = 148;
  const defaultH = 96;
  let x, y, w, h;
  let stretchX = false;
  let stretchY = false;
  let overConstrainedX = false;
  let overConstrainedY = false;

  if (useLeft && useRight) {
    if (explicitSize) {
      overConstrainedX = true;
      x = left;
      w = defaultW;
    } else {
      stretchX = true;
      x = left;
      w = Math.max(24, containerW - left - right);
    }
  } else if (useLeft) {
    x = left;
    w = defaultW;
  } else if (useRight) {
    w = defaultW;
    x = containerW - right - w;
  } else {
    x = 0;
    w = defaultW;
  }

  if (useTop && useBottom) {
    if (explicitSize) {
      overConstrainedY = true;
      y = top;
      h = defaultH;
    } else {
      stretchY = true;
      y = top;
      h = Math.max(24, containerH - top - bottom);
    }
  } else if (useTop) {
    y = top;
    h = defaultH;
  } else if (useBottom) {
    h = defaultH;
    y = containerH - bottom - h;
  } else {
    y = 0;
    h = defaultH;
  }

  const lines = [`.box {`, `  position: absolute;`];
  if (useTop && useRight && useBottom && useLeft && top === right && right === bottom && bottom === left) {
    lines.push(`  inset: ${top}px;`);
  } else {
    if (useTop) lines.push(`  top: ${top}px;`);
    if (useRight) lines.push(`  right: ${right}px;${overConstrainedX ? " /* 宽度固定时 LTR 下被忽略 */" : ""}`);
    if (useBottom) lines.push(`  bottom: ${bottom}px;${overConstrainedY ? " /* 高度固定时被忽略 */" : ""}`);
    if (useLeft) lines.push(`  left: ${left}px;`);
  }
  if (explicitSize) {
    lines.push(`  width: ${defaultW}px; height: ${defaultH}px;`);
  } else if (stretchX || stretchY) {
    lines.push(`  width: ${stretchX ? "auto /* 自动拉伸 */" : defaultW + "px"}; height: ${stretchY ? "auto /* 自动拉伸 */" : defaultH + "px"};`);
  } else {
    lines.push(`  width: ${defaultW}px; height: ${defaultH}px;`);
  }
  lines.push(`}`);

  let explanation;
  if (overConstrainedX || overConstrainedY) {
    explanation = `过约束！同时写了固定尺寸和对侧坐标时，水平方向在从左到右排版（LTR）下优先听 left 而忽略 right，垂直方向优先听 top 而忽略 bottom。`;
  } else if (stretchX && stretchY) {
    explanation = `四边全拉且宽高为 auto：盒子自动铺成 ${Math.round(w)}×${Math.round(h)}px，随容器放大缩小而伸缩——这就是弹窗半透明蒙层写 inset: 0 的原理。`;
  } else if (stretchX) {
    explanation = `同时指定 left 与 right 且不写死 width，盒子宽度自动算成容器宽 − ${left} − ${right} = ${Math.round(w)}px，常用于卡片底部通栏条。`;
  } else if (stretchY) {
    explanation = `同时指定 top 与 bottom 且不写死 height，盒子高度自动拉伸为 ${Math.round(h)}px，常用于侧边竖向装饰条或工具栏。`;
  } else if (!useTop && !useRight && !useBottom && !useLeft) {
    explanation = `四边全留 auto 时，元素停在原本该出现的「静态位置」（仍脱离文档流，不占位）。`;
  } else {
    explanation = `单侧锚定：盒子保持自身 ${Math.round(w)}×${Math.round(h)}px 尺寸，紧紧咬住你点亮的参照边。试着左右缩窄容器，看 left 锚与 right 锚的差别。`;
  }

  return { x, y, w, h, stretchX, stretchY, overConstrainedX, overConstrainedY, css: lines.join("\n"), explanation };
}

// ---------- 04 节：层叠上下文 3D 剖面计算 ----------
export function evalStacking({ parentATrap, parentAZ, childAZ, parentBZ }) {
  // 当 parentATrap !== "none" 时，父容器 A 自身形成独立层叠上下文（如 z-index: 1 或 opacity: 0.99 / isolation: isolate）
  // 此时 childA 无论 z-index 写多大，在根层叠上下文里都只能按 parentA 的层级 (parentAZ) 与 parentB (parentBZ) 比较！
  const aCreatesContext = parentATrap !== "none";
  const effectiveA = aCreatesContext ? (parentATrap === "z1" ? parentAZ : 0) : childAZ;
  const childWins = effectiveA > parentBZ || (effectiveA === parentBZ && !aCreatesContext && childAZ >= parentBZ);

  let reason;
  if (!aCreatesContext) {
    reason = `父容器 A 没建独立层叠上下文（z-index: auto），弹窗 A 的 z-index: ${childAZ} 直接进根层叠池和容器 B（z-index: ${parentBZ}）比大小：${childAZ} ${childWins ? ">" : "<"} ${parentBZ}，弹窗${childWins ? "稳稳浮在 B 上方" : "仍被 B 压住"}。`;
  } else if (parentATrap === "z1") {
    reason = `父容器 A 写了 position: relative; z-index: ${parentAZ}，立刻关起一间独立层叠屋。弹窗 A 哪怕写到 z-index: ${childAZ}，也只能在 A 屋内部称王；整间 A 屋（${parentAZ}）在外面比不过容器 B（${parentBZ}），弹窗被 B 硬生生截断！`;
  } else if (parentATrap === "opacity") {
    reason = `父容器 A 根本没写 z-index，但挂了 opacity: 0.99！规范规定小于 1 的透明度也会创建新层叠上下文（对外等价于 z-index: 0），结果内部 z-index: ${childAZ} 被锁在 0 层，照样输给外部 z-index: ${parentBZ}。`;
  } else {
    reason = `父容器 A 写了 isolation: isolate（或 transform: translateZ(0)），主动封住内部层叠作用域。外部比较时 A 整体按 0 层排队，所以弹窗 A 冲不破容器 B（z-index: ${parentBZ}）。`;
  }

  return { aCreatesContext, effectiveA, childWins, reason };
}
