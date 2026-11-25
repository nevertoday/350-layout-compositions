// 225 流根布局 · 唯一实测模型（所有读数来自浏览器真实 DOM 几何测量，零写死常量）

export const MAX_STAMPS = 2;

export const STAMP_TARGETS = [
  { sel: ".feed", label: ".feed", zh: "评论流外壳", countLabel: "×1 外框" },
  { sel: ".comment", label: ".comment", zh: "评论卡", countLabel: "×3 同步" },
  { sel: ".avatar", label: ".avatar", zh: "浮动头像", countLabel: "×3 浮动" },
  { sel: "p", label: "p", zh: "正文段落", countLabel: "×5 全段" },
  { sel: ".notice", label: ".notice", zh: "公告块", countLabel: "×1 绕排" },
];

export const TARGET_MAP = Object.fromEntries(STAMP_TARGETS.map((t) => [t.sel, t]));

/**
 * 通用外边距实测函数（供 02 节、06 节第③景与 07 节小练习共用）
 * 返回：两卡外沿之间距离、卡顶到首段上沿距离
 */
export function measureMarginGap(card1, card2, firstP) {
  const r1 = card1.getBoundingClientRect();
  const r2 = card2 ? card2.getBoundingClientRect() : null;
  const rp = firstP.getBoundingClientRect();
  const betweenCardsPx = r2 ? Math.max(0, Math.round(r2.top - r1.bottom)) : 0;
  const topToFirstPPx = Math.max(0, Math.round(rp.top - r1.top));
  return {
    betweenCardsPx,
    topToFirstPPx,
    card1Rect: r1,
    card2Rect: r2,
    firstPRect: rp,
  };
}

/**
 * 测量首屏真实评论流的四项物理状态（全部直接读浏览器布局引擎结果）
 */
export function measureHeroFeed(dom) {
  const { shell, feed, comments, avatars, notice, noticeFig, noticeP2, foot } = dom;
  const shellRect = shell.getBoundingClientRect();
  const feedRect = feed.getBoundingClientRect();

  // 1. 顶距穿透：.feed-shell 是基准框，.feed 上沿离基准顶沿的距离即被首段 margin-top 顶穿的像素
  const topCollapsePx = Math.max(0, Math.round(feedRect.top - shellRect.top));

  // 2. 浮动漏出：遍历 3 张 .comment，实测浮动头像底沿探出所属 .comment 底沿的像素
  const cardLeaks = comments.map((card, i) => {
    const cr = card.getBoundingClientRect();
    const ar = avatars[i].getBoundingClientRect();
    const leak = Math.max(0, Math.round(ar.bottom - cr.bottom));
    return { index: i, cardRect: cr, avatarRect: ar, leak };
  });
  const maxLeakPx = Math.max(...cardLeaks.map((x) => x.leak), 0);
  const leakingCards = cardLeaks.filter((x) => x.leak > 1).length;

  // 3. 阶梯错位：以第 1 张头像左缘为基准，量第 2、3 张头像被上方探出头像顶偏的水平距离
  const baseLeft = cardLeaks[0].avatarRect.left;
  const shifts = cardLeaks.map((x) => Math.max(0, Math.round(x.avatarRect.left - baseLeft)));
  const stairShiftPx = Math.max(...shifts, 0);
  const stairSteps = shifts.filter((s) => s > 6).length + 1;

  // 4. 第 3 张头像是否刺进公告块
  const noticeRect = notice.getBoundingClientRect();
  const figRect = noticeFig.getBoundingClientRect();
  const p2Rect = noticeP2.getBoundingClientRect();
  const noticeIntrusionPx = Math.max(0, Math.round(cardLeaks[2].avatarRect.bottom - noticeRect.top));

  // 5. 公告跨两段绕排是否完好：
  // 只有当 p 建立独立 BFC 时，p2 整块盒左缘才会相对公告内左缘整体右移（wrapBoxShiftPx > 14），
  // 从而在左侧浮动插图正下方留下真实矩形空洞。
  const csNotice = getComputedStyle(notice);
  const noticeInnerLeft = noticeRect.left + (parseFloat(csNotice.paddingLeft) || 0) + (parseFloat(csNotice.borderLeftWidth) || 0);
  const wrapBoxShiftPx = Math.max(0, Math.round(p2Rect.left - noticeInnerLeft));
  const holeHeightPx = wrapBoxShiftPx > 14 ? Math.max(0, Math.round(p2Rect.bottom - figRect.bottom)) : 0;
  const wrapBroken = wrapBoxShiftPx > 14;

  const footRect = foot.getBoundingClientRect();

  return {
    shellRect,
    feedRect,
    noticeRect,
    figRect,
    p2Rect,
    footRect,
    cardLeaks,
    shifts,
    topCollapsePx,
    maxLeakPx,
    leakingCards,
    stairShiftPx,
    stairSteps,
    noticeIntrusionPx,
    wrapBoxShiftPx,
    holeHeightPx,
    wrapBroken,
    noticeInnerLeft,
  };
}

/**
 * 根据当前已盖印章与真实 DOM 实测结果，生成实时 CSS 规则与白话「为什么」诊断
 */
export function evaluateHeroDiagnosis(stamps, m) {
  const list = [...stamps];
  const has = (sel) => stamps.has(sel);
  const codeLine = list.length
    ? `${list.join(", ")} { display: flow-root; }`
    : "/* 尚未盖章：全员默认 display: block */";

  const flowClean = m.maxLeakPx <= 1 && m.stairShiftPx <= 2 && m.topCollapsePx <= 1;
  const allGood = flowClean && !m.wrapBroken;

  // 1. 完美过关（只盖 .comment）
  if (allGood && list.length === 1 && has(".comment")) {
    return {
      tone: "ok",
      badge: "精准通关 · 只用 1/2 枚",
      title: "只盖 .comment 就清零全部故障，还省下 1 枚印章",
      detail:
        "3 张评论卡同步成为独立流根，各自包住浮动头像（漏出 0px、阶梯 0px）、锁住首段顶距（穿透 0px）；公告里的两段仍在普通流中自然绕过插图，毫无误伤。",
      codeLine,
    };
  }

  // 2. 过关但多盖了第 2 枚（.comment + .notice / .feed / .avatar）
  if (allGood && has(".comment") && list.length === 2) {
    if (has(".notice")) {
      return {
        tone: "ok",
        badge: "已达标 · 2/2 枚（.notice 可省）",
        title: "评论流与顶距全已稳住，公告内部绕排也没受影响",
        detail:
          "盖在 .comment 上已消除了全部阶梯与穿透；给 .notice 盖章不会破坏它内部两段绕排，反而能替页脚兜底，但眼下公告文字已自然包过插图，这枚印章其实可以省下。",
        codeLine,
      };
    }
    if (has(".feed")) {
      return {
        tone: "ok",
        badge: "已达标 · .feed 重复隔离",
        title: "全部故障已清除，不过外壳 .feed 上这枚多余了",
        detail:
          "每张 .comment 已经各自封成独立流根，内部浮动与顶距都不会外泄，最外层 .feed 再盖一枚不会坏事，但属于冗余声明，摘下来只留 .comment 更干净。",
        codeLine,
      };
    }
    if (has(".avatar")) {
      return {
        tone: "ok",
        badge: "已达标 · .avatar 白盖了",
        title: "评论卡已齐整，但盖在浮动 .avatar 上的那枚没有作用",
        detail:
          "浮动元素天生自带块格式化上下文，再给 .avatar 加 display: flow-root 既不改变自身也不影响外部；真正起作用的是 .comment，可以把 .avatar 上的印章摘下来。",
        codeLine,
      };
    }
  }

  // 3. 评论卡已稳但误伤了 p（.comment + p）
  if (has(".comment") && has("p")) {
    return {
      tone: "warn",
      badge: "误伤公告绕排 · 需摘 p",
      title: `评论卡齐了，但给 p 盖章把公告第二段硬挤偏了 +${m.wrapBoxShiftPx}px`,
      detail:
        "独立 BFC 块盒绝不与外部浮动重叠：公告里的第二段 p 成了独立矩形列，宁可在插图下方留出空洞也不肯绕回左侧。把 p 上的印章摘掉，只留 .comment 就能通关。",
      codeLine,
    };
  }

  // 4. 未盖章初始态
  if (list.length === 0) {
    return {
      tone: "bad",
      badge: `初始故障 · 漏出 +${m.maxLeakPx}px`,
      title: `三张卡撞成阶梯（错位 +${m.stairShiftPx}px），顶沿被首段拽塌 ${m.topCollapsePx}px`,
      detail:
        "全员 display: block 共享同一条流：头像脱离普通流撑不开 .comment，漏出底边把下一张头像往右挤成楼梯；首段外边距也顺势穿出父顶。拖一枚流根印章到真正该隔离的层级试试。",
      codeLine,
    };
  }

  // 5. 只盖了 .avatar（或 .avatar + .notice）
  if (has(".avatar") && !has(".feed") && !has("p") && !has(".comment")) {
    return {
      tone: "bad",
      badge: "白盖了 · 浮动本就是 BFC",
      title: `漏出 +${m.maxLeakPx}px、阶梯 +${m.stairShiftPx}px、顶距 +${m.topCollapsePx}px 纹丝不动`,
      detail:
        "按 CSS 规范，float: left 元素天生已经建立独立 BFC——给 .avatar 加 flow-root 只隔离它自己内部，救不了外面包不住它的父盒 .comment。",
      codeLine,
    };
  }

  // 6. 盖了 p（但没盖 .comment）
  if (has("p") && !has(".comment")) {
    const feedExtra = has(".feed")
      ? "虽然外壳 .feed 拦住了顶沿穿透，但三张卡片仍在外壳内共享浮动，"
      : `顶部穿透仍为 ${m.topCollapsePx}px（BFC 只隔离自己与子元素，不拦自己与普通父盒合并），`;
    return {
      tone: "bad",
      badge: `双重翻车 · 绕排截断 +${m.wrapBoxShiftPx}px`,
      title: `不仅评论阶梯还在（+${m.stairShiftPx}px），公告绕排也被切成了直筒`,
      detail: `${feedExtra}而且给 p 盖流根后，公告第二段强行避开左浮插图、在图下空出一大块洞。流根应该盖在需要封口的组件容器上，别盖在正文段落上。`,
      codeLine,
    };
  }

  // 7. 盖了 .feed（但没盖 .comment，也没盖 p）
  if (has(".feed") && !has(".comment")) {
    return {
      tone: "warn",
      badge: `只治外壳 · 阶梯仍 +${m.stairShiftPx}px`,
      title: `顶距穿透归 ${m.topCollapsePx}px 了，但三张评论卡照样互相撞成楼梯`,
      detail:
        "给最外层 .feed 盖流根，只等于给整条评论流建了一间大屋子：最外沿兜住了，可屋里三张 .comment 仍是 display: block，头像依旧顺着同一条流逐级右移。必须把印章盖在单卡类 .comment 上。",
      codeLine,
    };
  }

  // 8. 只盖了 .notice
  if (has(".notice") && !has(".comment")) {
    return {
      tone: "warn",
      badge: `位置偏了 · 漏出仍 +${m.maxLeakPx}px`,
      title: `公告盒建了边界，但上方评论阶梯（+${m.stairShiftPx}px）与顶距穿透（+${m.topCollapsePx}px）全没治`,
      detail:
        ".notice 自己成独立 BFC 后只是挡住第 3 张头像不再钻进公告文字，但上方 3 张 .comment 依然漏浮动、依然撞阶梯。把印章改盖到 .comment 上试试。",
      codeLine,
    };
  }

  return {
    tone: "warn",
    badge: `仍有残余 · 漏出 +${m.maxLeakPx}px`,
    title: "当前印章组合尚未完全隔离每张评论卡",
    detail: "观察漏出像素、阶梯错位与公告绕排四路实测，试着只把印章盖在重复出现的独立组件类 .comment 上。",
    codeLine,
  };
}

/**
 * 04 节：五方案活体体检舱的真实 DOM 实测（含动态「图矮暂时藏住漏水」判断，绝不写死）
 */
export function measureLegacyCard(dom, mode) {
  const { shell, card, floatEl, bodyEl, badgeEl, refBar } = dom;
  const shellRect = shell.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const floatRect = floatEl.getBoundingClientRect();
  const bodyRect = bodyEl.getBoundingClientRect();
  const badgeRect = badgeEl.getBoundingClientRect();
  const refRect = refBar.getBoundingClientRect();

  const floatH = Math.round(floatRect.height);
  const bodyH = Math.round(bodyRect.height);
  const leakPx = Math.max(0, Math.round(floatRect.bottom - cardRect.bottom));
  const topCollapsePx = Math.max(0, Math.round(cardRect.top - shellRect.top));

  // 实测气泡裁切：仅当 .card 为 position: relative 且 overflow 非 visible 时发生真实裁剪
  const csCard = getComputedStyle(card);
  const clipsOverflow = csCard.overflowX !== "visible" || csCard.overflowY !== "visible";
  const badgeOverTop = Math.max(0, Math.round(cardRect.top - badgeRect.top));
  const badgeOverRight = Math.max(0, Math.round(badgeRect.right - cardRect.right));
  const badgeClipPx = clipsOverflow ? Math.max(badgeOverTop, badgeOverRight) : 0;

  // 实测宽度收缩
  const widthPct = refRect.width > 0 ? Math.min(100, Math.round((cardRect.width / refRect.width) * 100)) : 100;
  const widthLossPx = Math.max(0, Math.round(refRect.width - cardRect.width));

  // 动态按实测浮动高度与正文高度判断是否「缩矮蒙混」
  const shortMasking = mode === "block" && leakPx <= 1 && floatH <= bodyH + 2;

  let tone = "bad";
  let badge = "";
  let text = "";

  if (mode === "flow-root") {
    tone = "ok";
    badge = "四项全稳 · 零副作用";
    text = `实测浮动高 ${floatH}px、正文高 ${bodyH}px：无论浮动比文字高还是矮，display: flow-root 都让父盒稳包浮动（漏出 0px）、锁住顶距（穿透 0px）、不裁探出角标（裁切 0px）、占满整行（${widthPct}%）。`;
  } else if (mode === "block") {
    if (shortMasking) {
      tone = "warn";
      badge = "图矮藏住漏水 · 并非安全";
      text = `此刻实测浮动高 ${floatH}px ≤ 正文高 ${bodyH}px，所以漏出暂时归 0px——但父盒仍未建立独立 BFC：顶部依然穿透 ${topCollapsePx}px，只要把浮动拉高过正文或删掉一行字，立刻再度刺穿底边。`;
    } else {
      tone = "bad";
      badge = `浮动刺穿 +${leakPx}px · 顶穿 ${topCollapsePx}px`;
      text = `实测浮动高 ${floatH}px 超过正文高 ${bodyH}px：display: block 不把浮动算进父高，底边漏出 +${leakPx}px 撞进下方兄弟盒，同时首段顶距穿透顶沿 ${topCollapsePx}px。`;
    }
  } else if (mode === "overflow") {
    tone = "warn";
    badge = `角标被裁 ${badgeClipPx}px`;
    text = `overflow: hidden 靠副作用建出了 BFC（漏出 0px、顶穿 0px），但因为 .card 设为 position: relative，它把向右上探出边界的绝对定位气泡硬生生削掉了 ${badgeClipPx}px——真实项目里的角标、下拉菜单与悬浮提示都会惨遭一刀切。`;
  } else if (mode === "clearfix") {
    tone = "warn";
    badge = `顶距仍穿透 ${topCollapsePx}px`;
    text = `::after { clear: both } 只是在卡片末尾插了一枚隐形清浮动挡板，把浮动包住了、也没裁角标，但它没有创建独立 BFC：首段外边距依然真实穿透父顶 ${topCollapsePx}px。`;
  } else if (mode === "inline-block") {
    tone = "warn";
    badge = `外宽缩水 -${widthLossPx}px`;
    text = `display: inline-block 等价于 inline flow-root：里面确实封成了独立 BFC（漏出 0px、顶穿 0px、角标完好），但外部显示类型退化成行内盒，卡片从满宽缩窄到 ${widthPct}%（丢掉 ${widthLossPx}px）。`;
  }

  return {
    floatH,
    bodyH,
    leakPx,
    topCollapsePx,
    badgeClipPx,
    widthPct,
    widthLossPx,
    shortMasking,
    tone,
    badge,
    text,
  };
}
