// 011 头部空间构图 · 状态模型与解释文案
// 状态全部用 0..1 或百分比表达，所有交互视图只读取这里

export const MIN_PCT = 0;
export const MAX_PCT = 78;
export const DEFAULT_PCT = 42;
export const SNAP_POINTS = [0, 8, 28, 42, 60, 76];

export function clampPct(v) {
  return Math.max(MIN_PCT, Math.min(MAX_PCT, Math.round(v)));
}

export function snapPct(v, radius = 1.6) {
  for (const s of SNAP_POINTS) {
    if (Math.abs(v - s) <= radius) return s;
  }
  return v;
}

// 结合留白比例和媒介给出「人眼会怎么看」的实时解释
export function describeHero(pct, medium) {
  const content = 100 - pct;
  const cogY = Math.round(pct + content * 0.56);

  if (medium === "web") {
    if (pct < 14) {
      return {
        badge: "顶满无停顿",
        warn: true,
        verdict: "导航条紧压着大标题，页面一打开就像直接把信息糊在眼前，缺少开场缓冲。",
        meta: `顶部留白 ${pct}% · 主角在折痕内 · 视觉重心 ${cogY}%`,
      };
    }
    if (pct <= 36) {
      return {
        badge: "首屏黄金区",
        warn: false,
        verdict: "顶部有呼吸，大标题、按钮和主视觉都稳稳留在首屏折痕以上，既从容又不会让人误判下面没内容。",
        meta: `顶部留白 ${pct}% · 标题与按钮全在折痕内 · 视觉重心 ${cogY}%`,
      };
    }
    if (pct <= 52) {
      return {
        badge: "注意折痕",
        warn: true,
        verdict: "大气感上来了，但主视觉开始被首屏折痕切到一半；在矮屏幕笔记本上，访客需要先滚一下才能看全。",
        meta: `顶部留白 ${pct}% · 下方卡片跨过折痕 · 视觉重心 ${cogY}%`,
      };
    }
    return {
      badge: "挤出首屏",
      warn: true,
      verdict: "上方空过一半，按钮和主图被推到折痕下面。网页不是纸质海报，打开大半屏空白容易让人以为没加载完。",
      meta: `顶部留白 ${pct}% · 核心内容掉出首屏 · 视觉重心 ${cogY}%`,
    };
  }

  if (medium === "cover") {
    if (pct < 16) {
      return {
        badge: "偏满急促",
        warn: true,
        verdict: "刊名刚结束就撞上大标题，像信息密集的周刊封面，抓眼球但少了沉静气质。",
        meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%`,
      };
    }
    if (pct <= 34) {
      return {
        badge: "书刊沉降",
        warn: false,
        verdict: "刊名轻轻压住顶边，标题往下沉出一截，像精装书的章首页，克制又稳重。",
        meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%`,
      };
    }
    if (pct <= 56) {
      return {
        badge: "从容画册感",
        warn: false,
        verdict: "大片干净的顶空把封面从拥挤的书架里隔开，刊名、标题与器物层次分明，节奏慢而笃定。",
        meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%`,
      };
    }
    if (pct <= 66) {
      return {
        badge: "极简边缘",
        warn: false,
        verdict: "非常克制的画廊风格，全靠下方精致的器物轮廓压阵；再往下放，底盘就会发单薄。",
        meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%`,
      };
    }
    return {
      badge: "主体被挤扁",
      warn: true,
      verdict: "上方空得太凶，封面标题和主图缩在底边，视觉像滑出纸面，不再是从容而是失衡。",
      meta: `顶部留白 ${pct}% · 内容仅剩 ${content}% · 视觉重心 ${cogY}%`,
    };
  }

  // 默认：建筑海报
  if (pct < 14) {
    return {
      badge: "顶满压迫",
      warn: true,
      verdict: "标题和建筑几乎顶到天花板，底部反而多出一截无意义的空底，画面显得急促、头重脚轻。",
      meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心偏高 (${cogY}%)`,
    };
  }
  if (pct < 32) {
    return {
      badge: "轻微缓冲",
      warn: false,
      verdict: "顶部空出四分之一左右，开始出现呼吸感，但视觉下沉还不强烈，更像常规的留边排版。",
      meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%`,
    };
  }
  if (pct <= 52) {
    return {
      badge: "从容下沉",
      warn: false,
      verdict: "顶部空出近半幅，视线先在上方缓一口气，再顺势落到下方的标题与建筑上；重心低，既稳又轻盈。",
      meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心 ${cogY}%（海报原比例 42%）`,
    };
  }
  if (pct <= 64) {
    return {
      badge: "极简高空",
      warn: false,
      verdict: "大片空白本身成了情绪，适合极简展览或静谧主题；此时下半区元素要精简，轮廓必须扎实。",
      meta: `顶部留白 ${pct}% · 内容占 ${content}% · 视觉重心很低 (${cogY}%)`,
    };
  }
  return {
    badge: "过空掉底",
    warn: true,
    verdict: "空白超过六七成，标题与建筑被压在底边像快掉出画框，从「克制」滑向「没放稳」。",
    meta: `顶部留白 ${pct}% · 内容仅剩 ${content}% · 重心贴底 (${cogY}%)`,
  };
}

// 01 节：同样 45% 空白放不同位置
export const FLIP_MODES = {
  top: {
    voidA: { y: 0, h: 153 },
    voidB: { y: 0, h: 0 },
    groupY: 153,
    splitTop: false,
    cogY: 244,
    text: "空白集中在顶部（45%）：视觉重量落在下半区，顺应人眼的重力习惯——稳当、安静、像天空盖着建筑。",
  },
  bottom: {
    voidA: { y: 187, h: 153 },
    voidB: { y: 0, h: 0 },
    groupY: 26,
    splitTop: false,
    cogY: 102,
    text: "同样 45% 空白挪到底部：标题和建筑悬在顶上，脚下悬空，心里发漂，像贴着天花板挂着没落地。",
  },
  center: {
    voidA: { y: 0, h: 76 },
    voidB: { y: 264, h: 76 },
    groupY: 94,
    splitTop: false,
    cogY: 170,
    text: "同样 45% 上下平分：四平八稳，但两头都不够开阔，既没有顶部大片空气的静气，也少了下沉的节奏。",
  },
  split: {
    voidA: { y: 74, h: 112 },
    voidB: { y: 0, h: 0 },
    groupY: 182,
    splitTop: true,
    cogY: 176,
    text: "空白被拆进标题和建筑之间：视觉被劈成上下两截，空白成了「卡在中间的断层」，层次反而散了。",
  },
};

// 02 节：标题沉降说明
export function describeDrop(pct, hasAnchor) {
  const anchorTip = hasAnchor
    ? "顶部极轻的期号与细线撑住了纸面边界，上方大片留白显得克制而有意图。"
    : "关掉顶部小锚点后，超过四成的空白容易让顶边「发虚」，像少了半截内容。";
  if (pct < 16) {
    return `下沉 ${pct}%：标题几乎贴着页头，读起来直奔主题、效率高，但缺少新章节的仪式感。${hasAnchor ? "顶部细线离标题太近，显得略挤。" : ""}`;
  }
  if (pct <= 34) {
    return `下沉 ${pct}%：经典的书刊「篇首沉降」区间。视线先经过一段安静的空白，再落到标题上，过渡自然。${anchorTip}`;
  }
  if (pct <= 48) {
    return `下沉 ${pct}%：强海报化的沉降节奏，页面像一座安静的展厅，适合字数精炼的开篇或主视觉。${anchorTip}`;
  }
  return `下沉 ${pct}%：标题退到下半页，情绪极强，但留给正文的行数所剩不多，只适合极短的一两句话。${anchorTip}`;
}

// 03 节：五档比例 × 三种画幅
export const ASPECT_INFO = {
  portrait: {
    w: 120,
    h: 160,
    tip: "竖海报（3:4）纵向余量足，可以先从 35%–55% 的顶空试起（经验值）。",
    notes: {
      10: "竖海报 10%：标题顶在最上面，下方留出无目的的空底，还没进入头部空间构图。",
      28: "竖海报 28%：轻度下沉，适合信息稍多的活动海报或书刊章首，稳妥不冒进。",
      42: "竖海报 42%：原海报 011 的实测区间。上方开阔、下方饱满，呼吸感与主体分量刚好扯平。",
      58: "竖海报 58%：极简画廊风，空白本身成了氛围；要求底下的图形轮廓够利落、文案够短。",
      76: "竖海报 76%：过线了。下方只剩不到四分之一，主体缩成窄条，容易显得重心失控。",
    },
  },
  square: {
    w: 136,
    h: 136,
    tip: "方封面（1:1）高度变短，同样百分比下体感更「空」，常用区收窄到 30%–45%。",
    notes: {
      10: "方封面 10%：紧贴顶边，版面紧凑直接，适合信息量偏大的社交卡片。",
      28: "方封面 28%：在方形里已经有清晰的顶部喘息，标题和图形都舒展。",
      42: "方封面 42%：方形画框里的极简甜点区，专辑封面和品牌方图常用这一档。",
      58: "方封面 58%：下半区已经偏扁，只能放一行短标题加小主图，再多就会挤。",
      76: "方封面 76%：整张方图近八成空白，主角像沉到框外，手机缩略图里几乎看不清。",
    },
  },
  wide: {
    w: 168,
    h: 96,
    tip: "横屏（16:9）本来就矮，25%–38% 就有大片顶空感；超过 50% 会把内容压扁。",
    notes: {
      10: "横屏 10%：常规 PPT 或后台顶部对齐，信息密度高，无刻意留空。",
      28: "横屏 28%：横幅里最舒服的头部空间——上方透气，下方还装得下标题与主图。",
      42: "横屏 42%：已经是强极简发布会页的节奏，文案必须减到一句话。",
      58: "横屏 58%：在 16:9 里显得过于空旷，底部内容被压成细条，视觉重心发僵。",
      76: "横屏 76%：几乎全屏空白，观众很容易以为加载出错或翻错了空白页。",
    },
  },
};

// 06 节：小练习评语
export const QUIZ_ANSWERS = {
  A: {
    ok: false,
    title: "A · 顶满 6%，重心悬在上面",
    body: "标题和建筑挤在上半截，反倒在脚下剩了一大块无意义的空底。人眼看下去像挂在墙顶，没有沉稳感。",
  },
  B: {
    ok: true,
    title: "B · 选对了！顶部留白 44%，沉静又稳妥",
    body: "上方留出近半整块空白，右上角极轻的展期日期稳住画框上沿；标题与建筑一起落在下半区，重心低、层级清、呼吸从容。",
  },
  C: {
    ok: false,
    title: "C · 顶部空到 78%，主体快掉出底边",
    body: "留白并非越大越高级。空出近八成后，标题和建筑被迫缩得很小，贴着底边显得失衡且难读。",
  },
  D: {
    ok: false,
    title: "D · 顶空被装饰块切碎了",
    body: "虽然标题放低了，但在空白正中塞进一个孤零零的色块，既抢了主体的戏，又把原本安静的空气劈成两截。",
  },
};
