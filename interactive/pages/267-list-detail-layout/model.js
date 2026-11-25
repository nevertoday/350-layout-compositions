// 267 列表—详情布局：共享数据模型、开场工单收件箱、断点判断与练习题定义
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 开场实战收件箱 / 工单台：7 条真实工作条目，每条都有独立正文、专属附件图与主行动按钮
// 7 条高度超出列表可视区，正好能在 <600px 单窗格钻取时亲眼验证「返回列表并恢复滚动位置」
export const HERO_TICKETS = [
  {
    id: "TK-201",
    tag: "待审",
    tagTone: "orange",
    shape: "cut-square",
    title: "新版活动头图终稿验收",
    sender: "视觉组 · 林岚",
    time: "2 分钟前",
    eyebrow: "视觉验收 · 品牌活动",
    summary: "桌面与移动端头图已按深松墨配暖米纸规范导出，请确认明度反差与焦点位置。",
    detail: "本次将深色导航区与亮米主视觉区的边界重新校准，亮橙只保留在主图与行动按钮上，避免标题区和配图互相抢戏。确认无误后即可推入今晚的发布队列。",
    attachType: "poster-art",
    attachName: "hero-banner-v4.webp",
    attachMeta: "1440 × 600 · 86 KB",
    cta: "通过视觉验收",
    ctaDone: "已通过 · 排入发布",
  },
  {
    id: "TK-202",
    tag: "紧急",
    tagTone: "alert",
    shape: "triangle",
    title: "导出报表中文乱码修复",
    sender: "财务部 · 周衡",
    time: "9 分钟前",
    eyebrow: "线上故障 · 报表导出",
    summary: "季度 CSV 对账单在 Excel 直接双击打开出现中文乱码，已定位缺少 UTF-8 BOM 头。",
    detail: "导出接口目前输出纯 UTF-8 字节流，Windows 端 Excel 默认按本地编码解析导致表头全部乱码。补丁已在预发环境验证：文件首部写入 EF BB BF 后，中文字段与金额列均正常对齐。",
    attachType: "csv-diff",
    attachName: "Q3-reconcile.csv",
    attachMeta: "42 KB · UTF-8 BOM 对比",
    cta: "下发 UTF-8 补丁",
    ctaDone: "已下发 · 补丁完成",
  },
  {
    id: "TK-203",
    tag: "待批",
    tagTone: "teal",
    shape: "circle",
    title: "素材库配额扩容申请",
    sender: "设计组 · 许诺",
    time: "24 分钟前",
    eyebrow: "资源审批 · 存储配额",
    summary: "团队素材库已用 192 / 200 GB（96%），申请扩容至 500 GB 以承接第四季度物料。",
    detail: "近两周新增活动海报源文件与视频封面样张后，剩余可用空间仅剩 8 GB，导出任务已开始触发容量提醒。建议直接批复至 500 GB，并将历史草稿设为 90 天自动归档。",
    attachType: "quota-bar",
    attachName: "storage-quota.json",
    attachMeta: "192 / 200 GB → 500 GB",
    cta: "批准扩容至 500 GB",
    ctaDone: "已批准 · 配额已生效",
  },
  {
    id: "TK-204",
    tag: "排查",
    tagTone: "orange",
    shape: "diamond",
    title: "新成员 SSO 登录白屏",
    sender: "研发部 · 顾铭",
    time: "41 分钟前",
    eyebrow: "权限异常 · 单点登录",
    summary: "今日入职同事完成企业单点登录后停在空白页，原因查明为默认工作区角色为空。",
    detail: "身份令牌校验本身已成功返回，但初始化接口在读取角色权限时收到空值并中断了路由跳转。只需为该账号补分配标准成员角色，同时给新建账号加上默认角色兜底。",
    attachType: "auth-trace",
    attachName: "sso-trace-0412.log",
    attachMeta: "3 步调用链 · 第 2 步中断",
    cta: "分配默认成员角色",
    ctaDone: "已分配 · 登录已恢复",
  },
  {
    id: "TK-205",
    tag: "告警",
    tagTone: "alert",
    shape: "square",
    title: "安卓锁屏推送延迟复盘",
    sender: "客服组 · 沈悦",
    time: "1 小时前",
    eyebrow: "终端兼容 · 消息触达",
    summary: "部分安卓机型锁屏后审批提醒延迟约三分钟，确认为系统后台省电策略收紧所致。",
    detail: "实测前台在线与 iOS 端都能在两秒左右送达，只有开启深度省电的安卓终端在熄屏后被系统延后唤醒。已整理分品牌白名单设置步骤与高优先级通道开关，待同步客服知识库。",
    attachType: "latency-bars",
    attachName: "push-latency-report.csv",
    attachMeta: "3 组设备实测对比",
    cta: "发送白名单指引",
    ctaDone: "已发送 · 同步客服库",
  },
  {
    id: "TK-206",
    tag: "变更",
    tagTone: "teal",
    shape: "cut-square",
    title: "更新本月发票抬头税号",
    sender: "运营组 · 梁远",
    time: "2 小时前",
    eyebrow: "财务变更 · 开票资料",
    summary: "合作方工商主体名称已完成变更，需在月底出账前同步最新开票抬头与识别号。",
    detail: "对方已回传加盖公章的新版营业执照扫描件，开户行与账号保持不变，仅公司全称与纳税人识别号更新。确认同步后，本月尚未开具的两笔账单将直接按新抬头生成。",
    attachType: "invoice-diff",
    attachName: "billing-profile-diff.pdf",
    attachMeta: "抬头与税号字段核对",
    cta: "同步开票信息",
    ctaDone: "已同步 · 下期账单生效",
  },
  {
    id: "TK-207",
    tag: "归档",
    tagTone: "muted",
    shape: "triangle",
    title: "本周工单处理效率周报",
    sender: "运维组 · 程曦",
    time: "昨天",
    eyebrow: "例行汇总 · 第 46 周",
    summary: "本周累计关闭 142 单，一次解决率 91%，高频工单集中在权限配置与报表导出。",
    detail: "较上周相比，重复追问率继续下降，主要得益于同屏工单台减少切页中断、常见排查指引已做成一键发送模板。审阅完毕后可归档入季度运营目录。",
    attachType: "weekly-kpi",
    attachName: "week46-sla-summary.md",
    attachMeta: "142 单 · 91% 一次解决",
    cta: "归档本周周报",
    ctaDone: "已归档 · 第 46 周",
  },
];

// 开场窗口宽度断点分级（严格对应 Material Design 3 的 600 / 840 两档）
export function heroBreakpoint(width) {
  if (width < 600) {
    return {
      tier: "compact",
      badge: "Compact <600 · 单窗格钻取",
      shortBadge: "<600 单窗格",
      rule: "窄于 600px 时自动收成单窗格：先满宽看列表，点一条推入详情，顶部给「← 列表」并在返回时恢复滚动位置。",
    };
  }
  if (width < 840) {
    return {
      tier: "medium",
      badge: "Medium 600–839 · 紧凑双栏",
      shortBadge: "600–839 过渡双栏",
      rule: "跨过 600px 进入临界双栏：列表与详情开始同屏并排，点选或按 ↑↓ 可就地刷新，但每栏留白已明显偏紧。",
    };
  }
  return {
    tier: "expanded",
    badge: "Expanded ≥840 · 经典双栏",
    shortBadge: "≥840 经典双栏",
    rule: "跨过 840px 展开为经典双栏：左栏稳住索引，右栏舒展正文、附件与行动按钮，连续切换零返回。",
  };
}

// 03 节与 04 节：工单样本（用来亲手比较「单页跳页」和「列表—详情同屏」以及断点演示）
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
