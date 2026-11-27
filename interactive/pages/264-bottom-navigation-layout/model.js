// 264 底部导航布局 — 单真源几何、人体工学与诊断模型
// 画布与读数全部由同一套坐标与参数算出，绝不硬编码脱节数字。

export const LOGICAL_PHONE = { w: 375, h: 660 };
export const LOGICAL_DESKTOP = { w: 1080, h: 620 };

// 逐像素采自 264 原海报的视觉色板
export const PALETTE = {
  cream: "#F9F4EC",
  creamLight: "#FCF9F4",
  sand: "#EFE5D3",
  sandDeep: "#E4D5BC",
  skel: "#DDD8D0",
  terra: "#D15D39",
  terraDark: "#A13D1E",
  terraSoft: "#F3D3C8",
  sky: "#62A1D6",
  skyMid: "#5396CE",
  skyDeep: "#1B5C8E",
  skyMist: "#EAF2F8",
  ink: "#141413",
  inkMuted: "#5A5650",
  navy: "#112233",
  navyCard: "#1A3148",
  ok: "#1F7A5A",
  okSoft: "#DCF1E8",
  warn: "#B45309",
  bad: "#B92B27",
  badSoft: "#FBE2E0",
  white: "#FFFFFF",
};

// 三套 1:1 承袭原海报「布局示例」的产品语境与导航项池
export const ARCHETYPES = {
  browse: {
    id: "browse",
    name: "内容浏览类",
    en: "BROWSE",
    summary: "浏览 / 发现 / 通知 / 我的",
    barColor: PALETTE.terra,
    bezelColor: PALETTE.sky,
    items: [
      { id: "home", label: "首页", icon: "home", core: true, screenTitle: "今日推荐", screenSub: "版式精选与灵感图集" },
      { id: "grid", label: "分类", icon: "grid", core: true, screenTitle: "全部频道", screenSub: "按场景浏览 12 类布局" },
      { id: "bell", label: "消息", icon: "bell", core: true, badge: 3, screenTitle: "动态通知", screenSub: "3 条未读协作提醒" },
      { id: "user", label: "我的", icon: "user", core: true, screenTitle: "个人书架", screenSub: "已收藏 28 组板式样本" },
      { id: "heart", label: "收藏", icon: "heart", core: true, screenTitle: "灵感收藏夹", screenSub: "按色彩与网格归档" },
      { id: "gear", label: "设置", icon: "gear", core: false, screenTitle: "系统设置", screenSub: "低频项：应归入「我的」二级页" },
      { id: "help", label: "客服", icon: "help", core: false, screenTitle: "帮助与反馈", screenSub: "低频项：不该占一级底栏位" },
      { id: "info", label: "关于", icon: "info", core: false, screenTitle: "版本与协议", screenSub: "低频项：应沉入设置或页脚" },
    ],
  },
  tasks: {
    id: "tasks",
    name: "任务管理类",
    en: "TASKS",
    summary: "待办 / 计划 / 创建 / 日历 / 我的",
    barColor: PALETTE.skyMid,
    bezelColor: PALETTE.sky,
    items: [
      { id: "check", label: "待办", icon: "check", core: true, badge: 4, screenTitle: "今日清单", screenSub: "4 项高优先级任务待完成" },
      { id: "list", label: "计划", icon: "list", core: true, screenTitle: "阶段排期", screenSub: "按周拆解的里程碑视图" },
      { id: "cal", label: "日历", icon: "cal", core: true, screenTitle: "时间轴", screenSub: "本周 3 场评审日程" },
      { id: "user", label: "我的", icon: "user", core: true, screenTitle: "效率周报", screenSub: "本周任务完成率记录" },
      { id: "bell", label: "提醒", icon: "bell", core: true, screenTitle: "截止提醒", screenSub: "即将到期的重点事项" },
      { id: "gear", label: "设置", icon: "gear", core: false, screenTitle: "偏好设置", screenSub: "低频项：应归入「我的」" },
      { id: "help", label: "导出", icon: "help", core: false, screenTitle: "批量导出", screenSub: "一次性工具动作，不宜放底栏" },
      { id: "info", label: "归档", icon: "info", core: false, screenTitle: "历史归档", screenSub: "低频入口，建议放进列表右上角" },
    ],
  },
  explore: {
    id: "explore",
    name: "探索发现类",
    en: "EXPLORE",
    summary: "首页 / 探索 / 收藏 / 我的",
    barColor: PALETTE.skyMid,
    bezelColor: PALETTE.sky,
    items: [
      { id: "home", label: "首页", icon: "home", core: true, screenTitle: "精选画廊", screenSub: "每日更新的视觉策展" },
      { id: "compass", label: "探索", icon: "compass", core: true, screenTitle: "随机漫游", screenSub: "发现附近展览与专题" },
      { id: "heart", label: "收藏", icon: "heart", core: true, screenTitle: "心愿清单", screenSub: "标记 14 处想去的地点" },
      { id: "user", label: "我的", icon: "user", core: true, screenTitle: "足迹档案", screenSub: "打卡记录与关注列表" },
      { id: "bell", label: "动态", icon: "bell", core: true, badge: 2, screenTitle: "关注动态", screenSub: "2 位创作者发布了新作品" },
      { id: "gear", label: "设置", icon: "gear", core: false, screenTitle: "账号设置", screenSub: "低频项：应移入「我的」" },
      { id: "help", label: "客服", icon: "help", core: false, screenTitle: "在线帮助", screenSub: "低频入口，占去宝贵热区" },
      { id: "info", label: "协议", icon: "info", core: false, screenTitle: "用户条款", screenSub: "法律声明不应抢占底栏" },
    ],
  },
};

// 开场默认：0/4 四重失守错态（绝非答案）
export function createInitialState() {
  return {
    archetype: "browse",
    placement: "top",      // "top" | "bottom"
    pinned: false,         // false = 随内容滚走失锚
    scrollOffset: 0,       // 0..170 逻辑 pt
    itemIds: ["home", "grid", "bell", "user", "gear", "help", "info"], // 7 项拥挤含 3 杂项
    activeId: "home",
    showActive: false,     // 无当前态标识
    showLabels: false,     // 仅裸图标无文字
    activeStyle: "underline", // "underline" | "pill" | "filled"
    centerFab: false,      // 居中陶橙 + 浮钮
    barHeight: 38,         // 低于 44pt 触控底线
    badgeFlood: false,     // 红点泛滥试错
    viewportMode: "phone", // "phone" | "desktop"
    hand: "right",         // "right" | "left"
    thumbU: 0.72,          // 0..1 当前拇指落点（横）
    thumbV: 0.88,          // 0..1 当前拇指落点（纵）
    showThumbMap: true,    // 显示拇指热区弧线
  };
}

// 多组合法解与双向试错预设
export const PRESETS = {
  // 合法多解
  poster4: {
    label: "原海报·四项浏览",
    valid: true,
    patch: {
      archetype: "browse",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "grid", "bell", "user"],
      activeId: "home",
      showActive: true,
      showLabels: true,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 60,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  tasksFab: {
    label: "任务·居中 + 浮钮",
    valid: true,
    patch: {
      archetype: "tasks",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["check", "list", "cal", "user"],
      activeId: "check",
      showActive: true,
      showLabels: true,
      activeStyle: "underline",
      centerFab: true,
      barHeight: 62,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  explore3: {
    label: "极简·三项胶囊",
    valid: true,
    patch: {
      archetype: "explore",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "compass", "user"],
      activeId: "compass",
      showActive: true,
      showLabels: true,
      activeStyle: "pill",
      centerFab: false,
      barHeight: 66,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  full5: {
    label: "五项平级上限",
    valid: true,
    patch: {
      archetype: "browse",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "grid", "bell", "heart", "user"],
      activeId: "grid",
      showActive: true,
      showLabels: true,
      activeStyle: "pill",
      centerFab: false,
      barHeight: 62,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  // 双向反面试错
  errInitial: {
    label: "开场四重错态",
    valid: false,
    patch: {
      archetype: "browse",
      placement: "top",
      pinned: false,
      scrollOffset: 0,
      itemIds: ["home", "grid", "bell", "user", "gear", "help", "info"],
      activeId: "home",
      showActive: false,
      showLabels: false,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 38,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  errTwo: {
    label: "仅 2 项过空",
    valid: false,
    patch: {
      archetype: "browse",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "user"],
      activeId: "home",
      showActive: true,
      showLabels: true,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 60,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  errIcons: {
    label: "裸图标无高亮",
    valid: false,
    patch: {
      archetype: "explore",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "compass", "heart", "user"],
      activeId: "compass",
      showActive: false,
      showLabels: false,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 56,
      badgeFlood: false,
      viewportMode: "phone",
    },
  },
  errThick: {
    label: "超厚栏+满红点",
    valid: false,
    patch: {
      archetype: "browse",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "grid", "bell", "user"],
      activeId: "home",
      showActive: true,
      showLabels: true,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 96,
      badgeFlood: true,
      viewportMode: "phone",
    },
  },
  errDesktop: {
    label: "宽屏误用底栏",
    valid: false,
    patch: {
      archetype: "browse",
      placement: "bottom",
      pinned: true,
      scrollOffset: 0,
      itemIds: ["home", "grid", "bell", "user"],
      activeId: "home",
      showActive: true,
      showLabels: true,
      activeStyle: "underline",
      centerFab: false,
      barHeight: 60,
      badgeFlood: false,
      viewportMode: "desktop",
    },
  },
};

export function getArchetype(state) {
  return ARCHETYPES[state.archetype] || ARCHETYPES.browse;
}

export function getActiveItems(state) {
  const arch = getArchetype(state);
  const byId = new Map(arch.items.map((it) => [it.id, it]));
  return state.itemIds.map((id) => byId.get(id)).filter(Boolean);
}

// 拇指支点与人体工学热区半径（单位：逻辑 pt，基于 375×660 手机屏）
export function getThumbOrigin(hand, screenW, screenH) {
  const x = hand === "right" ? screenW + 26 : -26;
  const y = screenH - 86;
  return {
    x,
    y,
    rMin: 68,
    rNatural: 305, // 覆盖底栏与下三分之一自然扫弧
    rStretch: 470, // 中部伸展区
  };
}

export function classifyReach(px, py, origin) {
  const r = Math.hypot(px - origin.x, py - origin.y);
  if (r <= origin.rNatural) return { zone: "natural", label: "自然热区", r };
  if (r <= origin.rStretch) return { zone: "stretch", label: "伸展区", r };
  return { zone: "hard", label: "够不着区", r };
}

// 统一核心计算：所有矩形坐标、触控宽度、热区归属、4 大指标与主诊单全部源自此函数
export function evaluateState(state) {
  const arch = getArchetype(state);
  const items = getActiveItems(state);
  const isDesktop = state.viewportMode === "desktop";
  const screenW = isDesktop ? LOGICAL_DESKTOP.w : LOGICAL_PHONE.w;
  const screenH = isDesktop ? LOGICAL_DESKTOP.h : LOGICAL_PHONE.h;
  const statusBarH = isDesktop ? 36 : 30;

  // 居中 + 浮钮仅在偶数或 4 项时插在正中，占一槽位
  const hasFab = state.centerFab && items.length >= 2 && items.length <= 6;
  const totalSlots = items.length + (hasFab ? 1 : 0);
  const barH = state.barHeight;
  const barPadX = isDesktop ? 40 : 8;
  const usableW = screenW - barPadX * 2;
  const slotW = usableW / Math.max(1, totalSlots);

  // 导航栏在逻辑屏幕中的真实 Y 坐标（未固定时随 scrollOffset 向上滑出）
  const baseBarY = state.placement === "top" ? statusBarH : screenH - barH;
  const barY = state.pinned ? baseBarY : baseBarY - state.scrollOffset;
  const barVisibleRatio = Math.max(
    0,
    Math.min(1, (Math.min(barY + barH, screenH) - Math.max(barY, statusBarH)) / Math.max(1, barH))
  );
  const scrolledOut = !state.pinned && state.scrollOffset >= 24 && barVisibleRatio < 0.85;

  // 计算每个槽位的真实几何矩形与拇指可达性
  const origin = getThumbOrigin(state.hand, screenW, screenH);
  const fabIndex = hasFab ? Math.floor(items.length / 2) : -1;
  const slots = [];
  let cursor = 0;
  for (let i = 0; i < totalSlots; i++) {
    const x = barPadX + i * slotW;
    const cx = x + slotW / 2;
    const cy = barY + barH / 2;
    const reach = classifyReach(cx, cy, origin);
    if (i === fabIndex) {
      slots.push({
        isFab: true,
        id: "__fab__",
        label: "创建",
        icon: "plus",
        core: true,
        x,
        y: barY,
        w: slotW,
        h: barH,
        cx,
        cy,
        reach,
      });
    } else {
      const it = items[cursor++];
      slots.push({
        isFab: false,
        ...it,
        x,
        y: barY,
        w: slotW,
        h: barH,
        cx,
        cy,
        reach,
      });
    }
  }

  // 当前拇指落点（从 thumbU, thumbV 映射至逻辑屏幕）
  const thumbX = state.thumbU * screenW;
  const thumbY = state.thumbV * screenH;
  const thumbReach = classifyReach(thumbX, thumbY, origin);

  // 拇指当前悬停或最接近的槽位，以及 44pt 指肚是否撞到邻项
  let hoveredSlot = null;
  let nearestSlot = slots[0] || null;
  let nearestDist = Infinity;
  for (const s of slots) {
    const d = Math.hypot(thumbX - s.cx, thumbY - s.cy);
    if (d < nearestDist) {
      nearestDist = d;
      nearestSlot = s;
    }
    if (thumbX >= s.x && thumbX <= s.x + s.w && thumbY >= s.y - 8 && thumbY <= s.y + s.h + 8) {
      hoveredSlot = s;
    }
  }

  // 统计各项几何指标
  const navCount = items.length;
  const clutterItems = items.filter((it) => !it.core);
  const clutterCount = clutterItems.length;
  const naturalCount = slots.filter((s) => s.reach.zone === "natural").length;
  const hardCount = slots.filter((s) => s.reach.zone === "hard").length;
  const minTouchDim = Math.min(slotW, barH);
  const padOverlap = slotW < 58; // 44pt 指肚 + 邻项安全缝不足，易误触
  const hitTargetOk = slotW >= 58 && barH >= 44 && barH <= 80;
  const barSharePct = Math.round((barH / screenH) * 100);

  // 估算单手拇指从右下/左下舒适锚点到各槽的平均移动距离与菲茨难度指数（示意）
  const restX = state.hand === "right" ? screenW * 0.72 : screenW * 0.28;
  const restY = screenH * 0.86;
  const avgDist =
    slots.reduce((acc, s) => acc + Math.hypot(s.cx - restX, s.cy - restY), 0) / Math.max(1, slots.length);
  const fittsID = Math.log2(avgDist / Math.max(20, minTouchDim) + 1);
  // 归档为诚实的档位（避免假精确百分比）
  const effortTier = isDesktop
    ? "跨屏漫长（示意）"
    : state.placement === "top"
      ? "被迫换握（示意）"
      : fittsID <= 2.35 && hitTargetOk
        ? "单指轻触（示意）"
        : fittsID <= 3.0
          ? "轻度伸展（示意）"
          : "吃力易误触（示意）";

  // 四个原海报要点单真源判定
  const pillars = {
    stability: {
      id: "stability",
      zh: "稳定",
      en: "STABILITY",
      posterBody: "固定在底部，始终可见，提供安全锚点。",
      ok: state.pinned && !scrolledOut && state.placement === "bottom" && !isDesktop,
      tag: isDesktop
        ? "宽屏失锚"
        : !state.pinned
          ? scrolledOut
            ? "已滚出屏"
            : "未固定"
          : state.placement === "top"
            ? "错放顶部"
            : "贴底常驻",
    },
    reach: {
      id: "reach",
      zh: "易达",
      en: "REACH",
      posterBody: "贴近拇指热区，操作轻松，降低使用成本。",
      ok: !isDesktop && state.placement === "bottom" && hitTargetOk && hardCount === 0,
      tag: isDesktop
        ? "鼠标偏远"
        : state.placement === "top"
          ? "拇指够不着"
          : barH < 44
            ? `栏高 ${barH}pt 过矮`
            : barH > 80
              ? `栏高 ${barH}pt 过厚`
              : padOverlap
                ? `单格 ${Math.round(slotW)}pt 挤`
                : `热区 ${naturalCount}/${slots.length}`,
    },
    switching: {
      id: "switching",
      zh: "可切换",
      en: "SWITCHING",
      posterBody: "清晰区分板块，快速切换，减少认知负担。",
      ok: state.showActive && state.showLabels,
      tag:
        !state.showActive && !state.showLabels
          ? "无高亮+裸图标"
          : !state.showActive
            ? "缺少选中态"
            : !state.showLabels
              ? "纯图标靠猜"
              : "清晰可辨",
    },
    focus: {
      id: "focus",
      zh: "聚焦",
      en: "FOCUS",
      posterBody: "聚焦核心任务，弱化次要选项，提升效率。",
      ok: navCount >= 3 && navCount <= 5 && clutterCount === 0 && !state.badgeFlood,
      tag:
        navCount > 5
          ? `超载 ${navCount} 项`
          : navCount < 3
            ? `仅 ${navCount} 项过空`
            : clutterCount > 0
              ? `混入 ${clutterCount} 杂项`
              : state.badgeFlood
                ? "红点泛滥"
                : `${navCount} 项聚焦`,
    },
  };

  const score = Object.values(pillars).filter((p) => p.ok).length;

  // 双向诊断单真源（按最致命问题优先给出明确「为什么」+「怎么修」）
  let fault = {
    code: "ok",
    badge: "4/4 · 达标",
    tier: "结构成立",
    headline: hasFab
      ? `4 项导航 + 居中创建，单手拇指一步切换`
      : `${navCount} 项核心底栏贴底锚定，热区与焦点兼得`,
    reason:
      `底栏固定在屏幕最下沿（高 ${barH}pt，占屏高 ${barSharePct}%），单格宽 ${Math.round(slotW)}pt 远超 Apple 44pt / Material 48dp 触控底线；` +
      `${naturalCount}/${slots.length} 个入口直落自然拇指弧内，图标配简短中文标签与明确选中态，眼一扫就能确认自己身在何处。`,
    action: "试着直接点击手机里的底栏切换板块、按 Space 跑单手实测，或点击下方「双向试错」看看破坏哪一条会立刻翻车。",
  };

  if (isDesktop) {
    fault = {
      code: "desktop_misuse",
      badge: `${score}/4 · 宽屏错配`,
      tier: "跨端误用",
      headline: `在 ${screenW}px 宽屏桌面强铺底栏，视线与指针来回奔波`,
      reason:
        `桌面用户用鼠标操作、视线天然停留在屏幕上部与左侧；把导航硬压在 ${screenW}px 宽屏底沿，每格被拉到 ${Math.round(slotW)}pt，不仅远离内容入口，还会和操作系统任务栏打架。`,
      action: "切回「375px 手机竖屏」检验移动端底栏；桌面宽屏应改用 262 顶部导航或 258 侧边栏。",
    };
  } else if (state.placement === "top") {
    fault = {
      code: "top_placement",
      badge: `${score}/4 · 顶置够不着`,
      tier: "热区失守",
      headline: `导航栏压在屏幕顶部，单手拇指根本够不到`,
      reason:
        `在 375×660pt 竖屏上，顶栏距单手拇指支点超过 ${Math.round(avgDist)}pt，${hardCount}/${slots.length} 个入口全落在「够不着区」。用户每次切板块都得松手换握或抬起另一只手，切换成本骤增。`,
      action: "直接向下拖动手机顶部的导航栏（或点「贴底停靠」），把它放回下方绿色/天蓝拇指自然弧内。",
    };
  } else if (!state.pinned) {
    fault = {
      code: "unpinned",
      badge: `${score}/4 · 滚动失锚`,
      tier: "稳定失守",
      headline: scrolledOut ? `页面一滚，底栏已经漂出屏幕看不见了` : `导航栏未固定，内容一滚动就会跟着漂走`,
      reason:
        `底部导航的核心承诺是「始终可见的安全锚点」。如果不把它固定在视口底部，用户往下刷两屏内容后想切去「消息」或「我的」，还得费力滚回原位找入口。`,
      action: "打开「固定贴底锚定」，再点「模拟下滚内容」对比底栏稳如磐石的效果。",
    };
  } else if (navCount > 5) {
    fault = {
      code: "overload",
      badge: `${score}/4 · 超载 ${navCount} 项`,
      tier: "聚焦崩塌",
      headline: `底栏硬塞 ${navCount} 个入口，单格只剩 ${Math.round(slotW)}pt 宽`,
      reason:
        `Apple HIG 与 Material 3 都把底栏上限定在 3–5 项。当前塞进 ${navCount} 项${clutterCount ? `（含「${clutterItems.map((c) => c.label).join("、")}」等 ${clutterCount} 个低频杂项）` : ""}，44pt 指肚落下去会同时盖住相邻槽位，误触率直线上升。`,
      action: "直接点击手机底栏里标红虚线的低频项把它移出（或把项数降到 3–5 项）。",
    };
  } else if (navCount < 3) {
    fault = {
      code: "underload",
      badge: `${score}/4 · 仅 ${navCount} 项过空`,
      tier: "过度配置",
      headline: `只有 ${navCount} 个入口却常驻一条底栏，白白吃掉屏幕底部空间`,
      reason:
        `仅 ${navCount} 个顶级板块时，每格拉宽到 ${Math.round(slotW)}pt 显得空荡松散，却永久占去 ${barSharePct}% 视口高度。两项切换用顶部 265 标签页或分段开关更轻巧，不必动用全局底栏。`,
      action: "至少保留 3–5 个高频平级板块，才能发挥底部导航的结构价值。",
    };
  } else if (clutterCount > 0) {
    fault = {
      code: "clutter_mixed",
      badge: `${score}/4 · 混入杂项`,
      tier: "聚焦偏移",
      headline: `一级底栏混进了「${clutterItems.map((c) => c.label).join("、")}」等低频次级入口`,
      reason:
        `底栏每个席位都是黄金热区，只应留给每天高频往返的核心板块。设置、客服、协议这类偶尔点一次的页面，应收纳进「我的」二级页，把黄金位让给核心任务。`,
      action: "点击底栏中标红的次级杂项将其撤出，换回核心一级板块。",
    };
  } else if (barH < 44) {
    fault = {
      code: "bar_cramped",
      badge: `${score}/4 · 栏高 ${barH}pt 过矮`,
      tier: "触控偏小",
      headline: `底栏高度被压到 ${barH}pt，低于 44pt 拇指安全触控底线`,
      reason:
        `虽然贴在底部，但竖向点击区不足 Apple 44pt / Material 48dp 最低建议，拇指边缘极易误点到上方内容卡片，或和手机底部系统手势条互相打架。`,
      action: "把「底栏高度」调回 52–68pt 舒适区间。",
    };
  } else if (barH > 80) {
    fault = {
      code: "bar_oversized",
      badge: `${score}/4 · 栏高 ${barH}pt 过厚`,
      tier: "侵占内容",
      headline: `底栏厚达 ${barH}pt（占屏高 ${barSharePct}%），把正文视野顶得喘不过气`,
      reason:
        `底部导航应当轻稳托底、把舞台留给中央内容区。超过 80pt 后，导航反客为主，用户在小屏上能看到的文章与卡片明显缩水。`,
      action: "把「底栏高度」收回到 52–68pt 区间，把呼吸空间还给内容。",
    };
  } else if (!state.showActive || !state.showLabels) {
    fault = {
      code: !state.showActive ? "no_active" : "icon_only",
      badge: `${score}/4 · ${!state.showActive ? "缺少高亮" : "裸图标靠猜"}`,
      tier: "识别受阻",
      headline: !state.showActive
        ? `切进不同板块后没有任何选中标识，用户不知道自己在哪`
        : `只留抽象图标省去文字标签，每次切换都要猜含义`,
      reason: !state.showActive
        ? `所有导航项长得一模一样，切换屏幕时缺少视觉锚点。哪怕在选中项加一条清晰底线或填充色块，也能让当前位置一目了然。`
        : `除房子、放大镜外，大多数业务图标并不具备唯一共识。补上 2–3 字简短中文标签，几乎不占额外高度，却能把识别成本降到最低。`,
      action: !state.showActive ? "开启「当前态高亮」，再点击不同导航项感受定位感。" : "开启「文字标签」，给每个图标配上简短中文名。",
    };
  } else if (state.badgeFlood) {
    fault = {
      code: "badge_flood",
      badge: `${score}/4 · 红点泛滥`,
      tier: "焦点分散",
      headline: `每个底栏图标都挂满红点，反而等于一个重点也没有`,
      reason:
        `红点徽标（Badge）只该留给「消息」等真正需要立即处理的未读提醒。全员标红会制造视觉噪音和焦虑感，违背了底部导航「聚焦核心任务」的初衷。`,
      action: "关闭「红点泛滥」，只保留真正有未读信息的单项轻提示。",
    };
  }

  return {
    arch,
    items,
    isDesktop,
    screenW,
    screenH,
    statusBarH,
    hasFab,
    totalSlots,
    barY,
    barH,
    barPadX,
    slotW,
    slots,
    origin,
    thumbX,
    thumbY,
    thumbReach,
    hoveredSlot,
    nearestSlot,
    navCount,
    clutterCount,
    naturalCount,
    hardCount,
    padOverlap,
    barSharePct,
    avgDist,
    fittsID,
    effortTier,
    scrolledOut,
    pillars,
    score,
    fault,
  };
}
