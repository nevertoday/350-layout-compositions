// 267 列表—详情布局：共享数据模型、比例诊断、断点判断与练习题定义
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 海报左栏的五个原始主题 + 对应详情与主行动
export const TOPICS = [
  {
    id: "concept",
    zh: "概念定义",
    short: "概念",
    en: "CONCEPT",
    shape: "cut-square",
    eyebrow: "当前主题",
    summary: "列表—详情布局通过左右分区，将导航与内容分离，形成清晰的阅读路径与信息聚焦。",
    detail: "左栏承担索引，告诉你「有哪些、当前在看哪一条」；右栏铺开完整正文、图示与主操作，两块分工不打架。",
    action: "标记已读",
    actionDone: "已读 · 概念定义",
    bars: [0.84, 0.72, 0.56, 0.42],
  },
  {
    id: "structure",
    zh: "结构关系",
    short: "结构",
    en: "STRUCTURE",
    shape: "triangle",
    eyebrow: "主从映射",
    summary: "左栏是一组同类条目的父级索引，右栏是单一条目的展开容器，构成一对多的联动。",
    detail: "拖动中间的橙色分隔条试试：列表通常占约三成，给右侧详情留下充裕的阅读行宽与主图空间。",
    action: "锁定比例",
    actionDone: "已记下 32:68 结构",
    bars: [0.68, 0.9, 0.62, 0.48],
  },
  {
    id: "hierarchy",
    zh: "视觉层级",
    short: "层级",
    en: "HIERARCHY",
    shape: "circle",
    eyebrow: "明暗主次",
    summary: "突出重点，弱化次要：深色列表主动退后，浅色详情抬到眼前，亮橙只留给唯一焦点。",
    detail: "如果左右一样亮、每条都标红，眼睛就失去了落脚点。克制色彩数量，层级才会一眼分明。",
    action: "聚焦重点",
    actionDone: "已聚焦 · 视觉层级",
    bars: [0.92, 0.64, 0.76, 0.36],
  },
  {
    id: "organization",
    zh: "内容组织",
    short: "组织",
    en: "ORGANIZATION",
    shape: "diamond",
    eyebrow: "轻重分工",
    summary: "列表只留分辨条目的最小线索，把长文、图片、参数和表单全部放进详情区。",
    detail: "摘要放左栏，完整内容放右栏。列表越干净，扫描速度越快；详情越从容，读得越透。",
    action: "归档条目",
    actionDone: "已归档 · 内容组织",
    bars: [0.74, 0.58, 0.88, 0.52],
  },
  {
    id: "interaction",
    zh: "交互引导",
    short: "交互",
    en: "INTERACTION",
    shape: "square",
    eyebrow: "原地切换",
    summary: "点选列表、敲击上下方向键，右侧详情就地刷新，视线不必离开当前窗口。",
    detail: "连续处理邮件、工单或笔记时，省掉反复「进入—返回」的跳页成本，始终看得见前后文。",
    action: "切到第一项",
    actionDone: "已回到 · 概念定义",
    bars: [0.62, 0.82, 0.7, 0.9],
  },
];

// 拖动分隔把手时，靠近经典比例（32%）和对半（50%）时轻轻吸附
export function snapSplit(pct) {
  const anchors = [32, 50];
  for (const a of anchors) {
    if (Math.abs(pct - a) <= 1.8) return a;
  }
  return Math.round(pct);
}

// 不同左右列宽比例对观看者的实际感受（不光报数字，讲「会让人怎么看」）
export function splitZone(pct) {
  if (pct < 24) {
    return {
      key: "narrow",
      label: "列表过窄 · 标题截断",
      text: "左栏被压成一条细缝，列表标题只能露出两三个字或图标。人必须一个个盲点才能知道里面是什么，导航功能先失灵了。",
      bar: "warn",
    };
  }
  if (pct <= 38) {
    return {
      key: "sweet",
      label: "导航清晰 · 详情充裕",
      text: "经验上的舒适区间（约 26%–38%）：左栏足够放稳图标与完整标题，右栏占去六成以上宽幅，主图、正文与右下主按钮都舒展，主次一眼分开。",
      bar: "good",
    };
  }
  if (pct <= 52) {
    return {
      key: "even",
      label: "接近平分 · 主次模糊",
      text: "左右宽度拉到接近五五开，列表不再像「退后一步的目录」，而像另一块平起平坐的页面——容易滑向分屏对比，详情的聚焦感被冲淡了。",
      bar: "mid",
    };
  }
  return {
    key: "wide",
    label: "喧宾夺主 · 详情受挤",
    text: "左栏反客为主占掉大半屏幕，大量横向留白空耗在列表里；右侧真正要读的正文和主图被挤成窄柱，视线反而被左边的目录拖住。",
    bar: "warn",
  };
}

// 03 节：工单样本（用来亲手比较「单页跳页」和「列表—详情同屏」）
export const TICKETS = [
  {
    id: "TK-401",
    tag: "紧急",
    title: "导出报表中文乱码",
    meta: "2 分钟前 · 财务部",
    body: "用户在导出季度 CSV 对账单时，Excel 直接双击打开出现乱码。需要给导出文件补上 UTF-8 BOM 头并通知对方重下。",
    cta: "下发补丁",
  },
  {
    id: "TK-402",
    tag: "待审",
    title: "申请扩容附件空间",
    meta: "14 分钟前 · 设计组",
    body: "视觉素材库当前剩余空间不足 4%，申请将团队配额从 200 GB 调整到 500 GB，项目周期至年底。",
    cta: "批准扩容",
  },
  {
    id: "TK-403",
    tag: "咨询",
    title: "新成员登录权限异常",
    meta: "38 分钟前 · 研发部",
    body: "新入职同事通过 SSO 登录后停留在空白欢迎页，原因是尚未分配默认工作区角色。",
    cta: "分配角色",
  },
  {
    id: "TK-404",
    tag: "常规",
    title: "修改发票抬头信息",
    meta: "1 小时前 · 运营组",
    body: "公司主体名称更新，需要将本月未开具账单的发票抬头与税号同步为最新登记信息。",
    cta: "更新抬头",
  },
  {
    id: "TK-405",
    tag: "已查",
    title: "移动端推送延迟反馈",
    meta: "2 小时前 · 客服组",
    body: "部分安卓机型在锁屏状态下审批提醒延迟约 3 分钟，已确认为后台省电策略导致，附排查指引。",
    cta: "发送指引",
  },
];

// 04 节：响应式断点判断（依据 Material Design 3 规范窗口分级）
export function breakpointInfo(width, forceSplit) {
  if (width < 600) {
    if (forceSplit) {
      return {
        tier: "compact",
        name: "Compact · 强行双栏（反例）",
        mode: "forced-dual",
        text: `当前只有 ${width}px（< 600dp 手机竖屏级），强行保留左右分区后，左栏只剩约 ${Math.round(width * 0.34)}px、右栏只剩 ${Math.round(width * 0.66)}px，标题折成碎块，主内容无法正常阅读。`,
      };
    }
    return {
      tier: "compact",
      name: "Compact（< 600dp）· 单窗格钻取",
      mode: "single",
      text: `${width}px 属于紧凑屏：一次只显示一个窗格。先满屏浏览列表，点击任意条目再推入详情页，并在顶部留出清晰的「返回列表」入口。`,
    };
  }
  if (width < 840) {
    return {
      tier: "medium",
      name: "Medium（600–839dp）· 临界过渡",
      mode: "medium-dual",
      text: `${width}px 处于竖屏平板 / 折叠屏区间：勉强可以左右并排，但每栏空间依然偏紧（Material Design 3 建议此时要么保持单窗格，要么谨慎均分或配可收起列表）。`,
    };
  }
  return {
    tier: "expanded",
    name: "Expanded（≥ 840dp）· 经典双栏",
    mode: "expanded-dual",
    text: `${width}px 达到展开屏标准：列表锁定固定合理宽度（如 280–360px 经验区间），详情区吃满剩余宽度。既能一眼对照全局，又能从容读图与操作。`,
  };
}

// 07 节：小练习四套方案解析
export const QUIZ = {
  a: {
    right: false,
    title: "A 不够好 · 五五平分且没有明确选中态",
    text: "左右各占一半，列表里又塞满了缩略图和按钮，一眼看去两栏一样重、抢着要注意力；更麻烦的是当前选中的是哪一条看不出来，眼睛找不到左右之间的对应线。",
  },
  b: {
    right: true,
    title: "B 最好 · 主次分明、焦点唯一、动作落地",
    text: "左栏收在约三成宽度并用深色压低存在感，只留分辨工单的最小线索；当前项用醒目橙条标死；右侧浅色详情区留出七成宽幅放正文与右下主操作按钮，连续处理上百条工单最省力。",
  },
  c: {
    right: false,
    title: "C 不够好 · 列表缩成细缝，失去导航意义",
    text: "为了给详情腾地方，把列表压得太窄（不到 15%），标题全被截断只剩色块。客服根本没法在左栏扫描「哪条紧急、哪条待回」，只能一条条盲点碰运气。",
  },
  d: {
    right: false,
    title: "D 不够好 · 弹窗盖住列表，切断上下文",
    text: "每次点工单都弹出一张居中遮罩盖住后面的列表，想看下一条必须先关弹窗、重新在列表中找位置再点开。高频连续切换的场景下，弹层把列表—详情最大的「同屏对照」优势扔掉了。",
  },
};
