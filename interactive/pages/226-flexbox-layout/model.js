// 226 弹性盒布局 · 单一真源计算模型（DOM 实测 + W3C Flexbox Level 1 §9.7 伸缩算法）

export const HERO_ITEMS = [
  { id: "logo", code: "01", label: "LOGO", role: "chrome", naturalH: 46 },
  { id: "search", code: "02", label: "搜索栏", role: "primary", naturalH: 36 },
  { id: "nav", code: "03", label: "导航组", role: "nav", naturalH: 30 },
  { id: "cta", code: "04", label: "操作钮", role: "chrome", naturalH: 38 },
];

export const POLICY_META = {
  lock: {
    name: "锁死",
    css: "flex: 0 0 auto",
    searchCss: "flex: 0 0 var(--search-lock)",
    short: "0 0 auto",
  },
  shrink: {
    name: "仅缩",
    css: "flex: 0 1 auto",
    searchCss: "flex: 0 1 auto",
    short: "0 1 auto",
  },
  grow: {
    name: "弹性",
    css: "flex: 1 1 0px",
    searchCss: "flex: 1 1 0px",
    short: "1 1 0",
  },
};

export function createInitialHeroState() {
  return {
    widthNorm: 0.9, // 0..1 连续容器宽，开场饱满展开以清晰暴露配角发胖与交叉轴失齐
    direction: "row", // "row" | "column"
    alignItems: "flex-start", // "flex-start" | "center" | "stretch"
    wrap: "nowrap", // "nowrap" | "wrap"
    policies: {
      logo: "grow", // 错：品牌标开了弹性，吃掉多余空间发胖
      search: "lock", // 错：主搜索栏被锁死固定宽，宽时不伸、窄时顶破框
      nav: "shrink", // 初始默认：仅缩，窄时易压扁折行
      cta: "grow", // 错：操作按钮开了弹性，拉成笨重横幅
    },
    selectedId: "search",
  };
}

export function createReferenceHeroState() {
  return {
    widthNorm: 0.9,
    direction: "row",
    alignItems: "center",
    wrap: "wrap",
    policies: {
      logo: "lock",
      search: "grow",
      nav: "lock",
      cta: "lock",
    },
    selectedId: "search",
  };
}

export function railBounds(trackWidth) {
  const usable = Math.max(220, Math.round(trackWidth - 62));
  const maxPx = Math.min(1340, usable);
  const minPx = maxPx >= 460 ? 220 : Math.max(150, Math.round(maxPx * 0.52));
  return { minPx, maxPx };
}

export function widthFromNorm(norm, trackWidth) {
  const { minPx, maxPx } = railBounds(trackWidth);
  const clamped = Math.max(0, Math.min(1, norm));
  return Math.round(minPx + clamped * (maxPx - minPx));
}

export function normFromWidth(px, trackWidth) {
  const { minPx, maxPx } = railBounds(trackWidth);
  if (maxPx <= minPx) return 0.5;
  return Math.max(0, Math.min(1, (px - minPx) / (maxPx - minPx)));
}

/**
 * 直接从真实 DOM 测量开场弹性盒的几何事实与诊断结论（零写死常量）
 */
export function measureHeroDom(containerEl, itemEls, naturalSizes, state) {
  const cRect = containerEl.getBoundingClientRect();
  const cs = getComputedStyle(containerEl);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const padT = parseFloat(cs.paddingTop) || 0;
  const padB = parseFloat(cs.paddingBottom) || 0;
  const innerL = cRect.left + padL;
  const innerR = cRect.right - padR;
  const innerT = cRect.top + padT;
  const innerB = cRect.bottom - padB;
  const innerW = Math.max(1, innerR - innerL);
  const innerH = Math.max(1, innerB - innerT);

  const isRow = state.direction === "row";
  const items = HERO_ITEMS.map((meta) => {
    const el = itemEls[meta.id];
    const r = el.getBoundingClientRect();
    const nat = naturalSizes[meta.id] || { w: r.width, h: meta.naturalH };
    const mainSize = isRow ? r.width : r.height;
    const crossSize = isRow ? r.height : r.width;
    const natMain = isRow ? nat.w : nat.h;
    const deltaPx = Math.round(mainSize - natMain);
    const overRight = Math.max(0, r.right - innerR);
    const overBottom = Math.max(0, r.bottom - innerB);
    return {
      ...meta,
      policy: state.policies[meta.id],
      rect: {
        x: r.left - cRect.left,
        y: r.top - cRect.top,
        w: r.width,
        h: r.height,
        cx: r.left - cRect.left + r.width / 2,
        cy: r.top - cRect.top + r.height / 2,
      },
      mainPx: Math.round(mainSize),
      crossPx: Math.round(crossSize),
      natW: Math.round(nat.w),
      natH: Math.round(nat.h),
      deltaPx,
      overRight,
      overBottom,
    };
  });

  // 实测行轨数（行模式下按垂直区间聚类）
  const lines = [];
  if (isRow) {
    for (const it of items) {
      const top = it.rect.y;
      const bot = it.rect.y + it.rect.h;
      let found = lines.find((ln) => !(bot <= ln.top + 4 || top >= ln.bot - 4));
      if (!found) {
        found = { top, bot, items: [it] };
        lines.push(found);
      } else {
        found.top = Math.min(found.top, top);
        found.bot = Math.max(found.bot, bot);
        found.items.push(it);
      }
    }
    lines.sort((a, b) => a.top - b.top);
  } else {
    lines.push({ top: padT, bot: cRect.height - padB, items: [...items] });
  }

  const maxOverRight = Math.max(0, ...items.map((it) => it.overRight));
  const maxOverBottom = Math.max(0, ...items.map((it) => it.overBottom));
  const overflowPx = Math.round(isRow ? maxOverRight : maxOverBottom);

  // 未分配尾部余量（行模式取首行最右一项到内框右沿的真实空距）
  const firstLine = lines[0]?.items || items;
  const rightmost = Math.max(...firstLine.map((it) => it.rect.x + it.rect.w));
  const freeSpacePx = isRow
    ? Math.max(0, Math.round(cRect.width - padR - rightmost))
    : Math.max(0, Math.round(cRect.height - padB - Math.max(...items.map((it) => it.rect.y + it.rect.h))));

  // 交叉轴中心线偏差（首行内各子项中线相对行中线的最大偏离）
  let crossSpreadPx = 0;
  let stretchDistortPx = 0;
  if (isRow && firstLine.length > 1) {
    const lineMid = (lines[0].top + lines[0].bot) / 2;
    crossSpreadPx = Math.round(Math.max(...firstLine.map((it) => Math.abs(it.rect.cy - lineMid))));
    if (state.alignItems === "stretch") {
      stretchDistortPx = Math.round(Math.max(...firstLine.map((it) => Math.max(0, it.rect.h - it.natH))));
    }
  }

  const logoIt = items.find((i) => i.id === "logo");
  const searchIt = items.find((i) => i.id === "search");
  const navIt = items.find((i) => i.id === "nav");
  const ctaIt = items.find((i) => i.id === "cta");

  const allGrow = HERO_ITEMS.every((m) => state.policies[m.id] === "grow");
  const bloatedChrome = [logoIt, ctaIt, navIt].filter(
    (it) => it.policy === "grow" && it.deltaPx > 8
  );
  const chromeSetGrow = [logoIt, ctaIt, navIt].filter((it) => it.policy === "grow");
  const navCrushed = isRow && navIt.rect.h > Math.max(46, navIt.natH + 14);
  const searchAbsorbing = searchIt.policy === "grow";
  const crossAligned = isRow && state.alignItems === "center" && crossSpreadPx <= 2;

  // 决定唯一权威诊断（按严重程度严格排序）
  let verdict;
  if (!isRow) {
    verdict = {
      status: "warn",
      code: "axis-column",
      badge: "错态 · 主轴转竖排",
      title: "主轴切为 column，横栏被竖劈成四层",
      detail: `此刻主轴指向下方（交叉轴改为水平），flex-grow 分的是垂直高度而非宽度。横向应用顶栏应把主轴切回 row，只在窄屏侧边菜单里才用 column。`,
    };
  } else if (overflowPx > 2) {
    const culprit = state.policies.search === "lock"
      ? "「02 搜索栏」被锁死了固定宽"
      : "锁死项总宽超过了容器当前宽度";
    verdict = {
      status: "err",
      code: "overflow",
      badge: `错态 · 溢出 +${overflowPx}px`,
      title: `子项刺穿虚线右框 +${overflowPx}px`,
      detail: `当前容器宽 ${Math.round(cRect.width)}px，在默认 flex-wrap: nowrap 下，${culprit}，弹性盒宁可溢出也不会自动折行。把搜索栏改为「弹性」，或开启「换行 wrap」让超出的导航自然落到下一行。`,
    };
  } else if (allGrow) {
    verdict = {
      status: "err",
      code: "equalism",
      badge: "错态 · 平均主义",
      title: "四项全开弹性（flex: 1），变成呆板四等份",
      detail: `把所有子项都设成 flex: 1 并不是自适应：LOGO（${logoIt.mainPx}px）与操作钮（${ctaIt.mainPx}px）白白抢走了空间，真正需要输入空间的搜索栏反而被压在 ${searchIt.mainPx}px。只把弹性留给主角「搜索栏」，其余配角锁回自然尺寸。`,
    };
  } else if (chromeSetGrow.length > 0) {
    const names = chromeSetGrow.map((i) => `${i.code} ${i.label}`).join("、");
    const extraTxt = bloatedChrome.length
      ? `（比自然尺寸多占了 ${bloatedChrome.map((i) => `+${i.deltaPx}px`).join(" / ")}）`
      : "（拉宽容器就会立刻膨胀）";
    verdict = {
      status: "err",
      code: "chrome-bloat",
      badge: "错态 · 配角发胖",
      title: `${names} 不该开启弹性分配`,
      detail: `品牌标、导航与按钮属于固定尺寸配角，开了 flex-grow: 1 后会和主区争抢正剩余空间${extraTxt}。把它们改回「锁死」，把弹性名额留给「02 搜索栏」。`,
    };
  } else if (!searchAbsorbing) {
    verdict = {
      status: "warn",
      code: "rigid-primary",
      badge: freeSpacePx > 12 ? `错态 · 余量闲置 ${freeSpacePx}px` : "错态 · 主区僵死",
      title: "搜索栏未开弹性，容器变宽时呆立不动",
      detail: freeSpacePx > 12
        ? `当前右侧闲置了 ${freeSpacePx}px 空白（斜纹区），却没有子项认领它。把「02 搜索栏」设为「弹性」（flex: 1 1 0px），让它像弹簧一样自动吃满余量并在窄屏平滑收缩。`
        : `目前 4 项全是刚性或仅缩，一旦把拉杆往右拉宽就会留出死空。把「02 搜索栏」设为「弹性」（flex: 1 1 0px），才能真正发挥一维伸缩。`,
    };
  } else if (navCrushed) {
    verdict = {
      status: "err",
      code: "nav-crushed",
      badge: "错态 · 导航被压塌",
      title: "导航组处于「仅缩」，窄宽下文字被挤成竖条",
      detail: `导航链接允许 flex-shrink: 1 收缩后，高度被压到 ${navIt.crossPx}px、链接折成多行。把「03 导航组」改为「锁死」（flex: 0 0 auto），并打开「换行 wrap」让它在极窄宽下整组优雅落行。`,
    };
  } else if (!crossAligned) {
    const reason = state.alignItems === "stretch"
      ? `交叉轴设在默认 stretch，矮项被强行拉高了 +${stretchDistortPx}px，按钮与导航失去原本比例`
      : `四项高度不一（${navIt.crossPx}px–${logoIt.crossPx}px），交叉轴停在 flex-start 顶齐，中线错位 ±${crossSpreadPx}px`;
    verdict = {
      status: "warn",
      code: "cross-misalign",
      badge: state.alignItems === "stretch" ? "错态 · 交叉轴硬拉" : `错态 · 中线偏 ${crossSpreadPx}px`,
      title: "主轴分工已对，但交叉轴还没对齐",
      detail: `${reason}。把交叉轴对齐切到「center 居中」，四件不同高度的组件会瞬间沿同一条中线挂稳。`,
    };
  } else {
    const wrappedNote = lines.length > 1
      ? `当前窄宽已触发优雅换行（${lines.length} 行），零溢出且所有文字清晰可读。`
      : `实测「02 搜索栏」实时占 ${searchIt.mainPx}px，LOGO（${logoIt.mainPx}px）与操作钮（${ctaIt.mainPx}px）稳守自然尺寸，交叉轴中线误差 ≤ ${crossSpreadPx}px。试着把朱红拉杆拖到极窄端验证 ${state.wrap === "wrap" ? "自动换行" : "不换行时的临界溢出"}。`;
    verdict = {
      status: "ok",
      code: "solved",
      badge: "成立 · 一维弹轨就位",
      title: "固定配角锁稳，弹性主区独吞余量，交叉轴居中",
      detail: wrappedNote,
    };
  }

  // 驱动原海报顶部 5 枚结构图标的实时点亮状态
  const healthyFlags = {
    mainAxis: isRow,
    crossAxis: crossAligned,
    align: crossAligned,
    distribute: isRow && searchAbsorbing && chromeSetGrow.length === 0 && !allGrow,
    wrap: overflowPx <= 2 && !navCrushed,
  };

  return {
    containerW: Math.round(cRect.width),
    containerH: Math.round(cRect.height),
    innerW: Math.round(innerW),
    innerH: Math.round(innerH),
    padL,
    padR,
    padT,
    padB,
    items,
    lines,
    overflowPx,
    freeSpacePx,
    crossSpreadPx,
    navCrushed,
    verdict,
    healthyFlags,
  };
}

/**
 * 严格遵循 W3C CSS Flexbox Level 1 §9.7 的一维弹性分配解析器（用于 02 节与 07 节教学公式校验）
 */
export function solveFlex1D(containerW, gap, specs) {
  const totalGap = gap * Math.max(0, specs.length - 1);
  const avail = Math.max(0, containerW - totalGap);
  const bases = specs.map((s) => s.basis);
  const sumBase = bases.reduce((a, b) => a + b, 0);
  const free = avail - sumBase;

  if (Math.abs(free) < 0.01) {
    return {
      avail,
      sumBase,
      free: 0,
      mode: "exact",
      items: specs.map((s) => ({ ...s, final: s.basis, delta: 0 })),
    };
  }

  if (free > 0) {
    const sumGrow = specs.reduce((a, s) => a + Math.max(0, s.grow), 0);
    return {
      avail,
      sumBase,
      free,
      mode: "grow",
      items: specs.map((s) => {
        const share = sumGrow > 0 ? (free * Math.max(0, s.grow)) / sumGrow : 0;
        return { ...s, final: s.basis + share, delta: share };
      }),
    };
  }

  // 负空间（赤字）：按 shrink × basis 加权分摊，受 minW 约束迭代冻结（§9.7 Step 4）
  const deficit = -free;
  const frozen = specs.map(() => false);
  const sizes = specs.map((s) => s.basis);
  for (let iter = 0; iter < specs.length + 1; iter++) {
    const remSpace = avail - sizes.reduce((a, b, i) => a + (frozen[i] ? b : specs[i].basis), 0);
    const remDeficit = Math.max(0, -remSpace);
    const scaledSum = specs.reduce(
      (a, s, i) => a + (frozen[i] ? 0 : Math.max(0, s.shrink) * Math.max(1, s.basis)),
      0
    );
    if (scaledSum <= 0 || remDeficit <= 0.01) {
      specs.forEach((s, i) => {
        if (!frozen[i]) sizes[i] = s.basis;
      });
      break;
    }
    let clampedAny = false;
    specs.forEach((s, i) => {
      if (frozen[i]) return;
      const factor = (Math.max(0, s.shrink) * Math.max(1, s.basis)) / scaledSum;
      const target = s.basis - remDeficit * factor;
      if (target < s.minW) {
        sizes[i] = s.minW;
        frozen[i] = true;
        clampedAny = true;
      } else {
        sizes[i] = target;
      }
    });
    if (!clampedAny) break;
  }

  const finalSum = sizes.reduce((a, b) => a + b, 0);
  const overflow = Math.max(0, finalSum - avail);
  return {
    avail,
    sumBase,
    free,
    deficit,
    overflow,
    mode: overflow > 0.5 ? "overflow" : "shrink",
    items: specs.map((s, i) => ({
      ...s,
      final: sizes[i],
      delta: sizes[i] - s.basis,
    })),
  };
}
