// 267 列表—详情布局：共享数据模型、开场工单收件箱、03 边界状态实验台与 07 场景判断练习
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 统一的模拟窗口宽度范围（360 → 600 → 840 → 1080，每档严格等距 240px）
export const HERO_MIN_W = 360;
export const HERO_MAX_W = 1080;

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

// 开场窗口宽度断点分级（严格对应 Material Design 3 的 600 / 840 两档，并承接 <600 强行双栏反例）
export function heroBreakpoint(width, forceSplit = false) {
  const w = Math.round(width);
  if (w < 600) {
    if (forceSplit) {
      return {
        tier: "compact",
        forced: true,
        badge: "Compact <600 · 强行双栏（反例）",
        shortBadge: "<600 强行双栏",
        rule: `反面示范：当前只有 ${w}px（<600px），强行保持左右双栏后，左栏只剩约 ${Math.round(w * 0.36)}px、右栏只剩约 ${Math.round(w * 0.64)}px，标题被切碎、正文一行只剩七八个字。取消勾选即恢复单窗格。`,
      };
    }
    return {
      tier: "compact",
      forced: false,
      badge: "Compact <600 · 单窗格钻取",
      shortBadge: "<600 单窗格",
      rule: "窄于 600px 时自动收成单窗格：先满宽看列表，点一条推入详情，顶部给「← 列表」并在返回时恢复滚动位置。",
    };
  }
  if (w < 840) {
    return {
      tier: "medium",
      forced: false,
      badge: "Medium 600–839 · 紧凑双栏",
      shortBadge: "600–839 过渡双栏",
      rule: "跨过 600px 进入临界双栏：列表与详情开始同屏并排，点选或按 ↑↓ 可就地刷新，但每栏留白已明显偏紧。",
    };
  }
  return {
    tier: "expanded",
    forced: false,
    badge: "Expanded ≥840 · 经典双栏",
    shortBadge: "≥840 经典双栏",
    rule: "跨过 840px 展开为经典双栏：左栏稳住索引，右栏舒展正文、附件与行动按钮，连续切换零返回。",
  };
}

// ---------- 03 节：选中态、空状态与直达链接实验台（独立于开场的新数据：产品规范评审清单） ----------
export const STATE_ITEMS = [
  {
    id: "RQ-101",
    priority: "high",
    priorityLabel: "高优",
    title: "深色导航对比度校准",
    owner: "设计系统 · 许知",
    time: "10 分钟前",
    body: "将列表选中项与未选中项的明度差拉大到 4.5:1 以上，避免弱光环境下看不清当前高亮停在哪一行。",
    note: "关联组件：NavList / FocusRing",
  },
  {
    id: "RQ-102",
    priority: "normal",
    priorityLabel: "常规",
    title: "详情区正文行长上限",
    owner: "排版规范 · 周予",
    time: "35 分钟前",
    body: "宽屏展开到 1440px 以上时，详情容器虽撑满剩余宽度，但正文段落限制在约 36–42 个汉字（英文 60–75 字符），防止眼睛换行找不着下一行。",
    note: "关联组件：DetailProse",
  },
  {
    id: "RQ-103",
    priority: "high",
    priorityLabel: "高优",
    title: "移动端返回恢复滚动",
    owner: "交互组 · 沈川",
    time: "1 小时前",
    body: "在 <600px 单窗格钻取里，从列表第 18 条进入详情再点「← 返回列表」时，应还原先前的滚动位置而不是弹回顶部。",
    note: "关联组件：CompactDrilldown",
  },
  {
    id: "RQ-104",
    priority: "normal",
    priorityLabel: "常规",
    title: "列表键盘方向键漫游",
    owner: "无障碍 · 唐宁",
    time: "3 小时前",
    body: "双栏下按 ↑↓ 直接切换并同步刷新右侧详情；单窗格下 ↑↓ 仅移动列表焦点，按回车再推入详情页。",
    note: "关联组件：RovingTabindex",
  },
  {
    id: "RQ-105",
    priority: "normal",
    priorityLabel: "常规",
    title: "详情链接分享与回退",
    owner: "前端组 · 陆安",
    time: "昨天",
    body: "把当前选中条目 ID 写进地址栏路径（如 /reqs/RQ-103），支持直接发链接给同事，也支持浏览器后退回到上一条。",
    note: "关联组件：RouterSync",
  },
];

export const STATE_CASES = {
  empty: {
    id: "empty",
    tab: "① 未选中时",
    heading: "刚打开页面、还没点任何一条，右栏放什么？",
    badLabel: "坏做法：右栏留白 / 报「暂无数据」",
    goodLabel: "好做法：预选首条或给轻量引导态",
    badDesc: "列表明明有 5 条评审单，右栏却空成一片白板，或者只干巴巴写着「暂无数据」——看起来像接口挂了。",
    goodDesc: "不方便默认标已读时，右栏放明确引导（当前待处理统计 + 键盘 ↑↓ 提示 + 「打开第 1 条」快捷入口），区分「未选」与「真为空」。",
    why: "右栏占了宽屏六七成的视觉面积，裸白会让用户误以为页面报错或还在加载；给清引导或默认预选，第一眼就能进入任务。",
  },
  filter: {
    id: "filter",
    tab: "② 筛选后消失",
    heading: "开启筛选后，正在看的那条被过滤掉了怎么办？",
    badLabel: "坏做法：右栏留着「幽灵详情」",
    goodLabel: "好做法：自动顺切首条或给清除筛选提示",
    badDesc: "左边切到「仅看高优」只剩 2 条且无任何高亮，右边却还停在已被藏掉的「常规」条目 RQ-102——左右说的根本不是同一件事。",
    goodDesc: "一旦当前项落出筛选结果，立刻同步：自动切到筛选后第 1 条高优项并高亮，同时写明原因并提供一键「恢复全部」。",
    why: "列表—详情靠「左边高亮行 = 右边内容」建立信任；左右脱节时，用户很容易对着错的条目点下通过或删除。",
  },
  delete: {
    id: "delete",
    tab: "③ 删完跳去哪",
    heading: "当前条目处理或删除后，选中态往哪跳？",
    badLabel: "坏做法：选中归零、右栏瞬间变空",
    goodLabel: "好做法：自动顺延紧邻下一条，清完才显空态",
    badDesc: "把 RQ-102 标记「完成并移出」后，选中直接丢了、右栏塌成空白。想连续清完队列，每处理一条都得重新伸手点下一行。",
    goodDesc: "移出当前项后自动顺延到下一条 RQ-103（若删掉的是最后一条，就退选新的末尾条）；直到队列全空才显示「全部清完」状态。",
    why: "列表—详情的批处理效率来自「连续不断链」——顺延下一条让清理几十条待办变成顺手的单步节奏。",
  },
  deeplink: {
    id: "deeplink",
    tab: "④ 链接直达",
    heading: "把网址发给同事或按刷新，能不能直达当前条？",
    badLabel: "坏做法：地址永远停在 /reqs，刷新就丢",
    goodLabel: "好做法：选中 ID 写入网址，打开直达并滚到高亮行",
    badDesc: "不管点到第几条，浏览器地址栏都不变。同事点开链接或你手滑刷新，立刻掉回第 1 条，还得口头补一句「自己往下找 RQ-103」。",
    goodDesc: "每次点选都把条目 ID 写进 URL（如 /reqs/RQ-103）；直达打开时右栏立刻展示 RQ-103，左栏同步定位高亮，浏览器后退也照常生效。",
    why: "在网页里，能发链接直达、刷新不丢现场是多人协作的底线；不同步 URL 的列表—详情只算单机玩具。",
  },
};

// ---------- 07 节：有取舍的 4 场景版式判断题（把「什么时候别用」和断点带进实战） ----------
export const QUIZ_CHOICES = [
  { id: "split", label: "列表—详情双栏" },
  { id: "drill", label: "单栏钻取" },
  { id: "tabs", label: "顶部标签页" },
  { id: "table", label: "对比表格" },
];

export const QUIZ_SCENARIOS = [
  {
    id: "phone-inbox",
    code: "A",
    env: "390px 手机竖屏",
    title: "手机端邮件收件箱",
    desc: "通勤路上每天翻几十封邮件，点开要读正文、看图片附件并快速回复，但视口只有 390px 宽。",
    answer: "drill",
    feedback: {
      drill: "判断准确：邮件收件箱确实是列表—详情的任务结构，但在 390px（<600dp Compact）上必须主动退回「单栏钻取」——先满宽扫主题，点进详情再靠「← 列表」恢复滚动位置。",
      split: "容易踩的坑：虽然收件箱是列表—详情的经典场景，但前提是屏幕够宽。390px 竖屏硬塞左右双栏，标题和正文都会碎成几字一行，应退回「单栏钻取」（对应第 04 节）。",
      tabs: "不太对：收件箱里有几十上百封不断新增的邮件，顶部标签页只装得下 3–5 个固定板块，放不下动态长清单；窄屏应选「单栏钻取」。",
      table: "不太对：手机 390px 塞多列表格会疯狂横向滚动，也不适合读邮件正文；窄屏收件箱应选「单栏钻取」。",
    },
  },
  {
    id: "desktop-tickets",
    code: "B",
    env: "1280px 桌面端",
    title: "客服每日工单处理台",
    desc: "客服每天要连续翻看、审阅并回复上百条待办工单，每条都有文字说明、截图附件与结单按钮。",
    answer: "split",
    feedback: {
      split: "判断准确：四个条件全中——条目多且同类、需要高频连续切看、每条有正文与动作、1280px 远超 840dp 展开断点。左栏定宽（经验区间约 260–360px）稳住进度，右栏就地处理零返回。",
      drill: "效率吃亏：1280px 宽屏上还用单栏钻取，每看完一条就得退回清单重新找位置，一天翻上百条工单会多出上百次无效返回——这正是「列表—详情双栏」最省力的主场。",
      tabs: "放不下：上百条动态工单根本没法做成一排顶部标签页，应该用「列表—详情双栏」把滚动清单放在左侧。",
      table: "装不下详情与动作：表格适合扫一两行字段，但每条工单还有大段描述、截图和回复框，塞进表格行里会惨不忍睹；这类连续单条处理该用「列表—详情双栏」。",
    },
  },
  {
    id: "three-settings",
    code: "C",
    env: "1280px 桌面端",
    title: "只有 3 个分组的账号设置",
    desc: "个人中心的账号设置页，固定只有「基本资料 / 登录安全 / 通知偏好」三大块，以后也很少再增加。",
    answer: "tabs",
    feedback: {
      tabs: "判断准确：对应第 06 节「别用它」——总共只有 2–4 个固定板块时，左边挂一根常驻长列表下面空一大截，白吃三成宽度；换成顶部标签页（No. 265）既清楚又把整块宽度留给表单。",
      split: "常见过度设计：很多人一做「设置页」就下意识上左右分栏，但总共只有 3 个固定分组时，左栏大半截都是空的，浪费横向空间。换「顶部标签页（No. 265）」更轻巧。",
      drill: "多了一步跳转：桌面 1280px 只有 3 个固定分组，做单栏钻取反而让用户切个分组都要点返回，不如直接用「顶部标签页」一步切换。",
      table: "不搭边：账号设置是分块表单，不是多行同构数据记录，不用表格；3 个固定分组最适合「顶部标签页」。",
    },
  },
  {
    id: "compare-phones",
    code: "D",
    env: "1440px 桌面端",
    title: "横向比较 6 款手机参数",
    desc: "采购经理要同时对比 6 款备选机型的价格、芯片、电池、屏幕与交货周期，决定下单哪两款。",
    answer: "table",
    feedback: {
      table: "判断准确：对应第 06 节「别用它」——需要跨条目并排核对多个字段时，只有「对比表格」能让眼睛沿同一行直接扫过 6 款机型的参数，不必靠大脑来回硬记。",
      split: "正好撞上短板：列表—详情一次只露「一条」的详情。想拿第 1 款的电池和第 6 款的价格比较，只能点来点去靠记性硬背——跨项多字段比对别用双栏，换「对比表格」。",
      drill: "比双栏更折腾：单栏钻取连清单都要反复进出，横向比 6 款机型会彻底崩溃，必须用「对比表格」同屏展开。",
      tabs: "同样遮住了另外 5 款：标签页一次也只能看 1 款手机，没法并排核对价格与参数；跨项比对要换「对比表格」。",
    },
  },
];
