// 284 表单布局 · 单真源数据与几何诊断模型
// 所有读数、四项要点状态、眼动路径、报错诊单和正文实验均由此文件统一计算。

export const SCENARIOS = {
  poster: {
    id: "poster",
    label: "原海报 · 项目立项",
    shortLabel: "项目立项",
    submitLabel: "提交表单",
    cancelLabel: "取消",
    resetLabel: "清空重置",
    submitNote: "确保信息准确后，点击提交完成操作。",
    groups: [
      {
        id: "basic",
        title: "基本信息",
        en: "BASIC INFORMATION",
        accent: "blue",
        requiredBadge: true,
        optionalGroup: false,
        icon: "user",
        fields: [
          {
            id: "name",
            label: "姓名",
            en: "Name",
            type: "text",
            required: true,
            placeholder: "请输入姓名",
            defaultValue: "陈砚",
            help: "",
            pair: "row1",
            icon: "user",
          },
          {
            id: "email",
            label: "邮箱",
            en: "Email",
            type: "email",
            required: true,
            placeholder: "请输入邮箱地址",
            defaultValue: "chenyan@studio.cn",
            help: "",
            pair: "row1",
            icon: "mail",
          },
          {
            id: "phone",
            label: "手机号",
            en: "Mobile",
            type: "tel",
            required: true,
            placeholder: "请输入手机号",
            defaultValue: "138-001",
            help: "将用于接收通知与验证信息。",
            pair: "row2",
            icon: "phone",
          },
          {
            id: "role",
            label: "角色",
            en: "Role",
            type: "select",
            required: true,
            placeholder: "请选择角色",
            defaultValue: "交互设计师",
            options: ["交互设计师", "产品经理", "前端工程师", "项目负责人"],
            help: "选择最符合您身份的角色。",
            pair: "row2",
            icon: "role",
          },
        ],
      },
      {
        id: "project",
        title: "项目信息",
        en: "PROJECT INFORMATION",
        accent: "teal",
        requiredBadge: false,
        optionalGroup: false,
        icon: "briefcase",
        fields: [
          {
            id: "projectName",
            label: "项目名称",
            en: "Project",
            type: "text",
            required: true,
            placeholder: "请输入项目名称",
            defaultValue: "企业入驻表单体验重构",
            help: "",
            pair: "row3",
            icon: "tag",
          },
          {
            id: "projectType",
            label: "项目类型",
            en: "Category",
            type: "select",
            required: false,
            placeholder: "请选择类型",
            defaultValue: "网页产品",
            options: ["网页产品", "移动应用", "设计系统", "内部工具"],
            help: "",
            pair: "row3",
            icon: "grid",
          },
          {
            id: "projectDesc",
            label: "项目描述",
            en: "Summary",
            type: "textarea",
            required: false,
            placeholder: "请简要描述项目目标与范围",
            defaultValue: "统一对齐基准线、补全离焦校验与错误定位，减少移动端填报中途流失。",
            maxLength: 200,
            help: "",
            full: true,
          },
        ],
      },
      {
        id: "extra",
        title: "额外设置",
        en: "ADDITIONAL SETTINGS",
        accent: "blue",
        requiredBadge: false,
        optionalGroup: true,
        icon: "shield",
        fields: [
          {
            id: "budget",
            label: "预算范围",
            en: "Budget",
            type: "select",
            required: false,
            placeholder: "请选择预算范围",
            defaultValue: "5–20 万",
            options: ["5 万以内", "5–20 万", "20 万以上"],
            help: "",
            pair: "row4",
            icon: "coin",
          },
          {
            id: "deadline",
            label: "截止日期",
            en: "Deadline",
            type: "text",
            required: false,
            placeholder: "YYYY-MM-DD",
            defaultValue: "2026-06-30",
            help: "",
            pair: "row4",
            icon: "calendar",
          },
          {
            id: "agree",
            label: "我已阅读并同意《服务条款》与《隐私政策》",
            type: "checkbox",
            required: true,
            defaultValue: true,
            full: true,
          },
        ],
      },
    ],
  },

  checkout: {
    id: "checkout",
    label: "电商收货结算",
    shortLabel: "收货结算",
    submitLabel: "确认并支付",
    cancelLabel: "返回购物车",
    resetLabel: "清空地址",
    submitNote: "请核对收件手机与地址，下单后将同步发送物流通知。",
    groups: [
      {
        id: "receiver",
        title: "收件人信息",
        en: "RECIPIENT DETAILS",
        accent: "blue",
        requiredBadge: true,
        optionalGroup: false,
        icon: "user",
        fields: [
          {
            id: "name",
            label: "收件人",
            en: "Recipient",
            type: "text",
            required: true,
            placeholder: "请输入收件人姓名",
            defaultValue: "林予安",
            help: "",
            pair: "row1",
            icon: "user",
          },
          {
            id: "phone",
            label: "联系手机",
            en: "Mobile",
            type: "tel",
            required: true,
            placeholder: "请输入 11 位手机号",
            defaultValue: "139-88",
            help: "快递员派送与取件码短信使用。",
            pair: "row1",
            icon: "phone",
          },
          {
            id: "email",
            label: "电子邮箱",
            en: "Receipt Email",
            type: "email",
            required: true,
            placeholder: "用于接收电子凭证",
            defaultValue: "lin@mail.cn",
            help: "电子发票将自动投递到此邮箱。",
            pair: "row2",
            icon: "mail",
          },
          {
            id: "role",
            label: "所在城市",
            en: "City",
            type: "select",
            required: true,
            placeholder: "请选择城市",
            defaultValue: "上海市 · 静安区",
            options: ["上海市 · 静安区", "北京市 · 朝阳区", "杭州市 · 西湖区", "深圳市 · 南山区"],
            help: "不同区域预计次日或隔日送达。",
            pair: "row2",
            icon: "role",
          },
        ],
      },
      {
        id: "delivery",
        title: "配送与开票",
        en: "DELIVERY & INVOICE",
        accent: "teal",
        requiredBadge: false,
        optionalGroup: false,
        icon: "briefcase",
        fields: [
          {
            id: "projectName",
            label: "详细街道门牌",
            en: "Street",
            type: "text",
            required: true,
            placeholder: "街道、楼栋与门牌号",
            defaultValue: "南京西路 1266 号 2 栋 804",
            help: "",
            pair: "row3",
            icon: "tag",
          },
          {
            id: "projectType",
            label: "配送时段",
            en: "Time Slot",
            type: "select",
            required: false,
            placeholder: "选择配送时段",
            defaultValue: "工作日白天",
            options: ["工作日白天", "晚间 18:00–21:00", "周末全天"],
            help: "",
            pair: "row3",
            icon: "grid",
          },
          {
            id: "projectDesc",
            label: "快递员留言",
            en: "Delivery Note",
            type: "textarea",
            required: false,
            placeholder: "如放门卫、勿按门铃等说明",
            defaultValue: "如无人签收请放一层丰巢柜并短信提醒。",
            maxLength: 200,
            help: "",
            full: true,
          },
        ],
      },
      {
        id: "extra",
        title: "优惠与凭证",
        en: "COUPON & RECEIPT",
        accent: "blue",
        requiredBadge: false,
        optionalGroup: true,
        icon: "shield",
        fields: [
          {
            id: "budget",
            label: "发票类型",
            en: "Invoice",
            type: "select",
            required: false,
            placeholder: "请选择发票类型",
            defaultValue: "电子普通发票（个人）",
            options: ["暂不开票", "电子普通发票（个人）", "增值税专用发票"],
            help: "",
            pair: "row4",
            icon: "coin",
          },
          {
            id: "deadline",
            label: "期望送达日",
            en: "Target Date",
            type: "text",
            required: false,
            placeholder: "YYYY-MM-DD",
            defaultValue: "2026-05-18",
            help: "",
            pair: "row4",
            icon: "calendar",
          },
          {
            id: "agree",
            label: "我已核对地址并同意《生鲜与标准配送协议》",
            type: "checkbox",
            required: true,
            defaultValue: true,
            full: true,
          },
        ],
      },
    ],
  },

  event: {
    id: "event",
    label: "线下活动报名",
    shortLabel: "活动报名",
    submitLabel: "完成报名",
    cancelLabel: "暂不报名",
    resetLabel: "全部重填",
    submitNote: "提交后 5 分钟内将向您的手机发送电子签到码。",
    groups: [
      {
        id: "attendee",
        title: "参会人资料",
        en: "ATTENDEE PROFILE",
        accent: "blue",
        requiredBadge: true,
        optionalGroup: false,
        icon: "user",
        fields: [
          {
            id: "name",
            label: "参会人姓名",
            en: "Full Name",
            type: "text",
            required: true,
            placeholder: "用于制作参会胸牌",
            defaultValue: "周明远",
            help: "",
            pair: "row1",
            icon: "user",
          },
          {
            id: "email",
            label: "工作邮箱",
            en: "Work Email",
            type: "email",
            required: true,
            placeholder: "接收日程手册与课件",
            defaultValue: "zhou@design.org",
            help: "",
            pair: "row1",
            icon: "mail",
          },
          {
            id: "phone",
            label: "签到手机号",
            en: "Check-in Phone",
            type: "tel",
            required: true,
            placeholder: "11 位手机号码",
            defaultValue: "186-22",
            help: "现场扫码核验身份与紧急通知用。",
            pair: "row2",
            icon: "phone",
          },
          {
            id: "role",
            label: "职能方向",
            en: "Discipline",
            type: "select",
            required: true,
            placeholder: "请选择职能",
            defaultValue: "界面与交互设计",
            options: ["界面与交互设计", "前端与工程", "产品策略", "设计研究"],
            help: "便于为您匹配分组讨论桌位。",
            pair: "row2",
            icon: "role",
          },
        ],
      },
      {
        id: "session",
        title: "议题意向",
        en: "SESSION INTEREST",
        accent: "teal",
        requiredBadge: false,
        optionalGroup: false,
        icon: "briefcase",
        fields: [
          {
            id: "projectName",
            label: "所属团队 / 公司",
            en: "Organization",
            type: "text",
            required: true,
            placeholder: "如公司、工作室或学校",
            defaultValue: "北岸数字设计工作室",
            help: "",
            pair: "row3",
            icon: "tag",
          },
          {
            id: "projectType",
            label: "优先分会场",
            en: "Track",
            type: "select",
            required: false,
            placeholder: "请选择分会场",
            defaultValue: "设计系统与表单可用性",
            options: ["设计系统与表单可用性", "无障碍与多端适配", "数据可视化专场"],
            help: "",
            pair: "row3",
            icon: "grid",
          },
          {
            id: "projectDesc",
            label: "想讨论的实际问题",
            en: "Question",
            type: "textarea",
            required: false,
            placeholder: "欢迎写下你在表单或界面改版中遇到的困惑",
            defaultValue: "如何让多端业务表单在不删减必填信息的前提下把填完率拉高？",
            maxLength: 200,
            help: "",
            full: true,
          },
        ],
      },
      {
        id: "logistics",
        title: "后勤偏好",
        en: "LOGISTICS",
        accent: "blue",
        requiredBadge: false,
        optionalGroup: true,
        icon: "shield",
        fields: [
          {
            id: "budget",
            label: "茶歇饮食偏好",
            en: "Dietary",
            type: "select",
            required: false,
            placeholder: "请选择饮食偏好",
            defaultValue: "常规餐食",
            options: ["常规餐食", "素食", "无麸质 / 坚果过敏"],
            help: "",
            pair: "row4",
            icon: "coin",
          },
          {
            id: "deadline",
            label: "预计抵达日期",
            en: "Arrival",
            type: "text",
            required: false,
            placeholder: "YYYY-MM-DD",
            defaultValue: "2026-07-12",
            help: "",
            pair: "row4",
            icon: "calendar",
          },
          {
            id: "agree",
            label: "我已知晓活动日程并同意现场签到管理须知",
            type: "checkbox",
            required: true,
            defaultValue: true,
            full: true,
          },
        ],
      },
    ],
  },
};

export const CONTROLS = {
  align: [
    { id: "left-split", label: "左标签·乱双列", kind: "bad" },
    { id: "center", label: "全居中对齐", kind: "bad" },
    { id: "top-pair", label: "顶对齐·成对双列", kind: "good" },
    { id: "top-single", label: "顶对齐·纯单列", kind: "good" },
    { id: "right-side", label: "左置右对齐", kind: "cond" },
  ],
  grouping: [
    { id: "flat", label: "平铺无分组", kind: "bad" },
    { id: "overboxed", label: "每格一框", kind: "bad" },
    { id: "accent-cards", label: "左色条三组", kind: "good" },
    { id: "whitespace", label: "留白极简分组", kind: "good" },
  ],
  clarity: [
    { id: "placeholder-only", label: "纯占位+哑巴错", kind: "bad" },
    { id: "premature", label: "边打字边报红", kind: "bad" },
    { id: "inline-summary", label: "常驻提示+定位", kind: "good" },
    { id: "inline-guide", label: "标可选+离焦校验", kind: "good" },
  ],
  action: [
    { id: "equal-flat", label: "三钮同色平权", kind: "bad" },
    { id: "inverted", label: "重置抢主位", kind: "bad" },
    { id: "primary-outline", label: "主蓝实心+次框", kind: "good" },
    { id: "primary-ghost", label: "左轴主钮+弱取消", kind: "good" },
  ],
};

// 开场刻意处于 0/4 失序错态，绝不先给答案
// 开场开启左置左对齐裂口 + 平铺无分组 + 边打字边报红(缺辅助说明与定位按钮) + 三钮同色平权，让裂口与折返一眼可见
export const INITIAL_STATE = {
  scenario: "poster",
  align: "left-split",
  grouping: "flat",
  clarity: "premature",
  action: "equal-flat",
  showOverlay: true,
  scrubber: 0.42, // 眼动示波探针初始停在出错区，首屏 0.9s 即清晰可见
  submittedOnce: false,
};

export const PRESETS = {
  broken: {
    align: "left-split",
    grouping: "flat",
    clarity: "premature",
    action: "equal-flat",
  },
  poster: {
    align: "top-pair",
    grouping: "accent-cards",
    clarity: "inline-summary",
    action: "primary-outline",
  },
  single: {
    align: "top-single",
    grouping: "whitespace",
    clarity: "inline-guide",
    action: "primary-ghost",
  },
  dense: {
    align: "right-side",
    grouping: "accent-cards",
    clarity: "inline-summary",
    action: "primary-outline",
  },
};

export function createDefaultValues(scenarioId) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const values = {};
  for (const g of sc.groups) {
    for (const f of g.fields) values[f.id] = f.defaultValue;
  }
  return values;
}

// 真实字段级表单校验
export function validateValues(scenarioId, values) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.poster;
  const errors = {};
  const list = [];

  for (const g of sc.groups) {
    for (const f of g.fields) {
      const val = values[f.id];
      if (f.type === "checkbox") {
        if (f.required && !val) {
          const msg = "请先勾选同意相关条款后再提交";
          errors[f.id] = msg;
          list.push({ id: f.id, label: "协议条款", msg });
        }
        continue;
      }
      const str = String(val ?? "").trim();
      if (f.required && !str) {
        const msg = `请填写${f.label}`;
        errors[f.id] = msg;
        list.push({ id: f.id, label: f.label, msg });
        continue;
      }
      if (f.type === "tel" && str) {
        const digits = str.replace(/[\s-]/g, "");
        if (!/^1[3-9]\d{9}$/.test(digits)) {
          const msg = `${f.label}格式不正确（需为 11 位手机号码）`;
          errors[f.id] = msg;
          list.push({ id: f.id, label: f.label, msg });
        }
      } else if (f.type === "email" && str) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          const msg = `${f.label}格式不正确（例如 name@studio.cn）`;
          errors[f.id] = msg;
          list.push({ id: f.id, label: f.label, msg });
        }
      } else if (f.id === "deadline" && str) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          const msg = `${f.label}请使用 YYYY-MM-DD 格式`;
          errors[f.id] = msg;
          list.push({ id: f.id, label: f.label, msg });
        }
      }
    }
  }
  return { errors, list, valid: list.length === 0 };
}

// 单真源诊断器：结合状态 + 实测 DOM 几何 metrics，输出四维状态、10 类失误和白话诊单
export function evaluateForm(state, metrics = {}, validation = { list: [] }) {
  const isNarrow = Boolean(metrics.isNarrow);
  const gapPx = Math.round(metrics.avgLabelGapPx ?? fallbackGap(state.align));
  const zigzags = Math.round(metrics.zigzagCount ?? fallbackZigzags(state.align, isNarrow));
  const groupRatio = Number((metrics.groupRatio ?? fallbackGroupRatio(state.grouping)).toFixed(2));
  const pathPx = Math.round(metrics.totalPathPx ?? fallbackPath(state.align));

  // 1. 对齐维度
  let alignEval;
  if (state.align === "left-split") {
    alignEval = {
      ok: false,
      level: "err",
      code: "align-gap-zigzag",
      statusTag: zigzags > 0 ? `裂口 ${gapPx}px · 折返 ${zigzags} 次` : `左标签裂口 ${gapPx}px`,
      metricText: `左标签裂口 ${gapPx}px`,
      title:
        zigzags > 0
          ? `标签与输入框扯开 ${gapPx}px 裂口，视线来回 Z 字折返`
          : `标签与输入框扯开 ${gapPx}px 裂口，窄屏输入区被挤窄`,
      why:
        zigzags > 0
          ? `标签左对齐却硬拆两列，短标签（如「姓名」）和输入起点之间空出一大段空白；眼睛先要横跨 ${gapPx}px 裂口找框，填完左侧还要斜跳右列，来回折返 ${zigzags} 次，很容易看串行或漏填字段。`
          : `标签塞在左侧并左对齐，短标签（如「姓名」）末端到输入框起点之间扯出 ${gapPx}px 空白裂口；在窄屏上左列还吃掉近三分之一宽度，把输入框挤成窄条。`,
      fix: "在调控区的「对齐」里把布局切成「顶对齐·成对双列（原海报解）」或「顶对齐·纯单列」，让标签紧贴输入起点。",
    };
  } else if (state.align === "center") {
    alignEval = {
      ok: false,
      level: "err",
      code: "align-center-ragged",
      statusTag: "无左基准线",
      metricText: "双边锯齿失轴",
      title: "全部居中对齐，眼睛每换行都要重找起点",
      why: "居中排布让每一行标签和输入框左缘参差不齐，失去了稳定的垂直导轨。表单是逐项扫读与输入的任务，不是仪式感请柬，没有左基准线会显著拉慢扫描速度。",
      fix: "切回「顶对齐·纯单列」或「顶对齐·成对双列」，重新建立一根垂直落眼基准线。",
    };
  } else if (state.align === "right-side" && isNarrow) {
    alignEval = {
      ok: false,
      level: "warn",
      code: "align-right-cramped",
      statusTag: "窄屏挤窄框",
      metricText: `右对齐窄屏挤压`,
      title: "窄屏上把标签塞在左侧，输入框被挤成细缝",
      why: "左置右对齐在宽屏后台能压缩纵高，但当前容器宽度不足，左侧标签吃掉近四成宽度后，输入框和长标签互相挤兑、容易截断换行。",
      fix: "在窄屏或响应式多端场景下，切回「顶对齐·纯单列」让输入框拿到完整行宽。",
    };
  } else if (state.align === "right-side") {
    alignEval = {
      ok: true,
      level: "ok",
      code: "align-right-ok",
      statusTag: `紧贴 ${gapPx}px`,
      metricText: `右对齐紧贴 ${gapPx}px`,
      title: "左置右对齐：宽屏紧贴省纵高",
      why: "标签右缘紧贴输入起点，横向跨距短、纵向更紧凑；注意遇到超长标签或多语言翻译膨胀时要及时退回顶对齐。",
      fix: "",
    };
  } else if (state.align === "top-pair") {
    alignEval = {
      ok: true,
      level: "ok",
      code: "align-top-pair-ok",
      statusTag: isNarrow ? "单列自适应" : `顶贴 ${gapPx}px`,
      metricText: `顶对齐 · 成对双列`,
      title: "顶对齐成对双列：标签直落输入起点",
      why: "标签紧坐输入框正上方，眼睛单次注视即可同时看清名称与输入区，桌面端仅把同组短字段成对并排、大文本占满全宽。",
      fix: "",
    };
  } else {
    alignEval = {
      ok: true,
      level: "ok",
      code: "align-top-single-ok",
      statusTag: `单轨 ${gapPx}px · 0 折返`,
      metricText: `顶对齐 · 纯单列`,
      title: "顶对齐纯单列：单一垂直视线轨",
      why: "所有字段沿同一条左基准线自上而下排布，零横向折返、手机与桌面完全一致，是高完成率表单最稳妥的默认骨架。",
      fix: "",
    };
  }

  // 2. 分组维度
  let groupEval;
  if (state.grouping === "flat") {
    groupEval = {
      ok: false,
      level: "err",
      code: "group-flat-wall",
      statusTag: `距比 ${groupRatio.toFixed(2)}×`,
      metricText: `无分组 ${groupRatio.toFixed(2)}×`,
      title: `9 个字段等距糊成一面墙（组间/组内比 ${groupRatio.toFixed(2)}×）`,
      why: "基本信息、项目信息和可选设置混在一起，没有组标题也没有拉开留白。用户一眼扫过去不知道哪些是核心必填、哪些可以跳过，认知负荷瞬间拉满。",
      fix: "在「分组」切到「左色条三组（原海报解）」或「留白极简分组」，让组间距明显大于组内距（经验值 ≥ 1.8×）。",
    };
  } else if (state.grouping === "overboxed") {
    groupEval = {
      ok: false,
      level: "err",
      code: "group-overboxed",
      statusTag: "框线过载",
      metricText: "每格一框割裂",
      title: "每个字段都套一层重框，视觉噪声反而淹没层级",
      why: "给 9 个字段各自套上独立厚框和阴影后，画面多出十几条冗余边界。本来应该聚成 3 组的信息被切碎成 9 座孤岛，反而看不出谁和谁是一伙的。",
      fix: "减少冗余外框，改用「左色条三组」或「留白极简分组」，只在真正的大类交界处给边界。",
    };
  } else if (state.grouping === "accent-cards") {
    groupEval = {
      ok: true,
      level: "ok",
      code: "group-cards-ok",
      statusTag: `3 组 · ${groupRatio.toFixed(2)}×`,
      metricText: `左色条三组 ${groupRatio.toFixed(2)}×`,
      title: "蓝/青左色条与清晰组标建立三层节奏",
      why: "用三条柔和卡片和蓝青交替左色条把 9 个字段收进「基本信息 / 项目信息 / 额外设置」三段，必选与可选一眼分清。",
      fix: "",
    };
  } else {
    groupEval = {
      ok: true,
      level: "ok",
      code: "group-space-ok",
      statusTag: `留白 ${groupRatio.toFixed(2)}×`,
      metricText: `留白分块 ${groupRatio.toFixed(2)}×`,
      title: "极简留白分组：不靠重框也分得清层级",
      why: `组间留白达到组内间距的 ${groupRatio.toFixed(2)} 倍，配合轻巧分段标题，遵循格式塔邻近性原则，呼吸感极佳。`,
      fix: "",
    };
  }

  // 3. 提示与校验维度
  let clarityEval;
  if (state.clarity === "placeholder-only") {
    clarityEval = {
      ok: false,
      level: "err",
      code: "clarity-placeholder-dumb",
      statusTag: "打字失忆 · 哑巴报错",
      metricText: "仅占位符无定位",
      title: "占位符冒充标签，出错也不指明哪一格",
      why: "外部标签隐藏后，只要开始打字提示就会消失，填完回查根本不知道这格该填什么；底部的错误条也只说「表单有误」却不告诉你是手机号错了，违反 WCAG 3.3.1 与 3.3.2。",
      fix: "在「提示」切到「常驻提示+定位」或「标可选+离焦校验」，把常驻标签、字段说明和「定位错误」找回来。",
    };
  } else if (state.clarity === "premature") {
    clarityEval = {
      ok: false,
      level: "err",
      code: "clarity-premature",
      statusTag: "过早报红打断",
      metricText: "键入首字即报错",
      title: "还没输完就疯狂跳红错，打断录入节奏",
      why: "用户刚敲下第一个字符，校验器就立刻亮红警告「格式不正确」。Baymard 实证指出过早的内联报错像站在背后不断打断的监考官，徒增焦虑与挫败。",
      fix: "改用「常驻提示+定位」或「标可选+离焦校验」：等用户离开字段（blur）再报错，一旦改对立刻消红转绿。",
    };
  } else if (state.clarity === "inline-summary") {
    clarityEval = {
      ok: true,
      level: "ok",
      code: "clarity-summary-ok",
      statusTag: validation.list.length ? `可定位 ${validation.list.length} 处错` : "全项校验通过",
      metricText: "常驻提示 + 错误定位",
      title: "常驻标签、辅助说明与一键「定位错误」齐全",
      why: "输入前有说明防错，出错后既有顶部/底部红底汇总指出具体字段，又能点「定位错误」直接把光标送进出错格。",
      fix: "",
    };
  } else {
    clarityEval = {
      ok: true,
      level: "ok",
      code: "clarity-optional-ok",
      statusTag: validation.list.length ? `标可选 · ${validation.list.length} 处待修` : "标可选 · 已通过",
      metricText: "标可选 + 离焦校验",
      title: "只标「(可选)」降噪，配合离焦温和纠错",
      why: "当大多数项都是必填时，省去满屏红星、仅标注少数「(可选)」项，页面更干净，且错误说明和定位保持完整。",
      fix: "",
    };
  }

  // 4. 行动维度
  let actionEval;
  if (state.action === "equal-flat") {
    actionEval = {
      ok: false,
      level: "err",
      code: "action-equal-weight",
      statusTag: "三钮平权易误触",
      metricText: "同色平权 · 暗藏清空",
      title: "「清空重置」「取消」「提交」一样醒目，极易毁掉全表",
      why: "三个按钮用同样浓重的实心色并排挤在一起，主路径完全失去引力；用户填完 9 格一放松，顺手点错旁边的「清空重置」就会前功尽弃。",
      fix: "在「行动」切到「主蓝实心+次框（原海报解）」或「左轴主钮+弱取消」，撤掉高危清空键并拉开主次权重。",
    };
  } else if (state.action === "inverted") {
    actionEval = {
      ok: false,
      level: "err",
      code: "action-inverted",
      statusTag: "主次颠倒",
      metricText: "重置抢占视觉主位",
      title: "危险的「清空重置」抢了主色，真正提交按钮反而灰弱",
      why: "最高饱和度的实心按钮会自动捕获视线和第一点击冲动。把主色给到取消或重置、把提交弱化成灰线框，是把用户往反方向推。",
      fix: "把实心钴蓝主色还给「提交表单」，次要操作退居线框或纯文字链接。",
    };
  } else if (state.action === "primary-outline") {
    actionEval = {
      ok: true,
      level: "ok",
      code: "action-outline-ok",
      statusTag: "主实次框分明",
      metricText: "实心钴蓝主钮 + 线框次钮",
      title: "主操作钴蓝实心突出，次操作线框低调辅助",
      why: "「提交表单 →」以实心钴蓝和明确动词建立最终落点，「取消」用线框退后一层，底部配一句操作预期说明。",
      fix: "",
    };
  } else {
    actionEval = {
      ok: true,
      level: "ok",
      code: "action-ghost-ok",
      statusTag: "左轴单主钮",
      metricText: "贴左轴主钮 + 弱文字次钮",
      title: "主按钮紧贴表单左视轴，眼睛直落即点",
      why: "单列表单将主按钮对齐字段左缘，眼球顺着输入列直下就撞到主按钮，省去再横扫右下角的最后一次跳跃。",
      fix: "",
    };
  }

  const dims = {
    align: alignEval,
    grouping: groupEval,
    clarity: clarityEval,
    action: actionEval,
  };
  const ordered = [alignEval, groupEval, clarityEval, actionEval];
  const passedCount = ordered.filter((d) => d.ok).length;
  const allPassed = passedCount === 4;

  // 选出最紧迫的问题作为白话主诊单
  const firstFail = ordered.find((d) => !d.ok);

  // 识别具体正当解名字
  let solutionName = "自定义正当解";
  if (allPassed) {
    if (
      state.align === "top-pair" &&
      state.grouping === "accent-cards" &&
      state.clarity === "inline-summary" &&
      state.action === "primary-outline"
    ) {
      solutionName = "原海报标准解";
    } else if (state.align === "top-single" && state.grouping === "whitespace") {
      solutionName = "单列精简解（GOV.UK 路线）";
    } else if (state.align === "right-side") {
      solutionName = "宽屏紧凑右对齐解";
    }
  }

  // 扫视阻滞档位（杜绝假精确百分数）
  let saccadeBand = "单轨顺滑";
  if (state.align === "left-split" || state.align === "center" || state.grouping === "flat") {
    saccadeBand = passedCount === 0 ? "严重拉锯" : "中度折返";
  } else if (passedCount < 4) {
    saccadeBand = "局部受阻";
  } else if (state.align === "top-pair" && !isNarrow) {
    saccadeBand = "紧凑顺滑";
  }

  let headline;
  let body;
  let nextAction;
  let diagLevel;

  if (!allPassed && firstFail) {
    diagLevel = firstFail.level;
    headline = firstFail.title;
    body = firstFail.why;
    nextAction = firstFail.fix;
  } else {
    diagLevel = "ok";
    const errTip = validation.list.length
      ? `（现在还可以直接点下方红条里的「定位错误」，把手机号 ${SCENARIOS[state.scenario].groups[0].fields.find((f) => f.id === "phone")?.defaultValue || ""} 改成 11 位数字，再点提交验收！）`
      : "所有字段格式也已通过检验，整张表从扫描到提交一路畅通。";
    headline = `${solutionName}成立：四项表单原则全部到位`;
    body = `当前实测标签→输入跨距仅 ${gapPx}px、横向折返 ${zigzags} 次、组间/组内间距比 ${groupRatio.toFixed(2)}×。眼睛顺着清晰分组与对齐基准线往下走，提示就在手边、主行动一眼锁定。${errTip}`;
    nextAction = "试试切到「电商收货结算」或故意踩一脚「每格一框 / 边打字边报红 / 全居中」，体会为什么反模式会让填表卡壳。";
  }

  return {
    passedCount,
    allPassed,
    solutionName,
    diagLevel,
    headline,
    body,
    nextAction,
    dims,
    saccadeBand,
    stats: {
      gapPx,
      zigzags,
      groupRatio,
      pathPx,
      saccadeBand,
    },
  };
}

function fallbackGap(align) {
  if (align === "left-split") return 108;
  if (align === "center") return 56;
  if (align === "right-side") return 14;
  return 8;
}

function fallbackZigzags(align, isNarrow) {
  if (isNarrow) return align === "left-split" ? 4 : 0;
  if (align === "left-split") return 6;
  if (align === "top-pair") return 3;
  return 0;
}

function fallbackGroupRatio(grouping) {
  if (grouping === "flat") return 1.0;
  if (grouping === "overboxed") return 1.15;
  if (grouping === "whitespace") return 2.35;
  return 2.15;
}

function fallbackPath(align) {
  if (align === "left-split") return 1820;
  if (align === "center") return 1480;
  if (align === "right-side") return 1040;
  if (align === "top-pair") return 1180;
  return 960;
}

// ============================================================
// 01 节：三联对齐方式对照模型（基于 Matteo Penzo 2006 眼动原理）
// ============================================================
export const ALIGN_LENGTH_PRESETS = [
  {
    level: 0,
    tag: "短中文 · 2–3 字",
    labels: ["姓名", "邮箱", "手机", "公司"],
    note: "标签普遍短小时，三种排布差距尚未完全拉爆，但左置左对齐的空白裂口已经出现。",
  },
  {
    level: 1,
    tag: "混合中文 · 2–6 字",
    labels: ["姓名", "电子邮箱", "紧急联系手机号", "所属部门"],
    note: "只要混进一个 7 字长标签，左置左对齐会立刻把「姓名」和输入框扯出近百像素空白裂口；右对齐仍能贴紧；顶对齐纹丝不动。",
  },
  {
    level: 2,
    tag: "长标签 / 多语言膨胀",
    labels: ["Full Legal Name", "Billing Email Address", "Emergency Contact Phone Number", "Organization / Department"],
    note: "多语言（如英文/德文）膨胀时，顶对齐依然稳健不换行；左置右对齐的标签列被迫拉宽，把右侧输入框压成细条甚至折行。",
  },
];

export function evaluateAlignCompare(level) {
  const preset = ALIGN_LENGTH_PRESETS[level] || ALIGN_LENGTH_PRESETS[1];
  const maxLen = Math.max(...preset.labels.map((s) => s.length));
  const minLen = Math.min(...preset.labels.map((s) => s.length));
  const spread = maxLen - minLen;
  return {
    preset,
    cards: [
      {
        mode: "top",
        title: "标签置顶左对齐",
        en: "TOP-ALIGNED",
        fixations: "单次注视覆盖",
        gapLabel: "紧贴 6px",
        verdict: "最稳 · 通吃多语言与手机",
        tone: "good",
        summary: "Penzo（2006）眼动实验中扫视耗时最短：眼睛落一次就能同时收入标签与输入框。",
      },
      {
        mode: "right",
        title: "左置右对齐",
        en: "RIGHT-ALIGNED",
        fixations: level === 2 ? "标签换行挤压" : "紧贴输入框",
        gapLabel: level === 2 ? "框宽被挤缩" : "紧贴 12px",
        verdict: level === 2 ? "长标签下易挤压折行" : "宽屏省纵高 · 适合熟客后台",
        tone: level === 2 ? "warn" : "good",
        summary: level === 2
          ? "标签变长后，左列被迫吃掉半幅宽度，输入框和右侧边际变得局促。"
          : "标签右缘贴近输入框，扫视距离短、纵向节省高度，但左缘呈锯齿状，不利于只扫标签清单。",
      },
      {
        mode: "left",
        title: "左置左对齐",
        en: "LEFT-ALIGNED",
        fixations: spread > 4 ? "往返拉锯严重" : "横向裂口明显",
        gapLabel: `最大裂口 ~${Math.round(32 + spread * 10)}px（示意）`,
        verdict: "扫视最慢 · 裂口随长短差暴涨",
        tone: "bad",
        summary: "短标签末端到输入框起点留下参差大空洞，眼睛必须在标签与输入栏间反复横跳。",
      },
    ],
  };
}

// ============================================================
// 02 节：分组切刀实验（10 字段企业开票申请表）
// ============================================================
export const CHUNK_FIELDS = [
  { id: 0, label: "抬头名称", hint: "与营业执照一致", req: true, trueGroup: 0 },
  { id: 1, label: "纳税人识别号", hint: "18 位统一社会信用代码", req: true, trueGroup: 0 },
  { id: 2, label: "开票类型", hint: "数电普票 / 数电专票", req: true, trueGroup: 0 },
  { id: 3, label: "开户银行", hint: "开具专票时填写", req: false, trueGroup: 1 },
  { id: 4, label: "银行账号", hint: "对公基本户账号", req: false, trueGroup: 1 },
  { id: 5, label: "注册地址与电话", hint: "营业执照注册信息", req: false, trueGroup: 1 },
  { id: 6, label: "收票人姓名", hint: "财务对接人", req: true, trueGroup: 2 },
  { id: 7, label: "接收邮箱", hint: "电子发票 PDF 自动送达", req: true, trueGroup: 2 },
  { id: 8, label: "通知手机号", hint: "开票完成短信提醒", req: true, trueGroup: 2 },
  { id: 9, label: "内部报销备注", hint: "可选填成本中心编号", req: false, trueGroup: 2 },
];

export function evaluateChunking(cuts, borderStyle, reqMark) {
  const sorted = [...cuts].sort((a, b) => a - b);
  const groupCount = sorted.length + 1;
  // 计算每组大小
  const sizes = [];
  let prev = 0;
  for (const c of sorted) {
    sizes.push(c - prev);
    prev = c;
  }
  sizes.push(CHUNK_FIELDS.length - prev);
  const maxGroup = Math.max(...sizes);
  const minGroup = Math.min(...sizes);

  // 检查是否切在逻辑边界（3 和 6）
  const hitLogical = sorted.includes(3) && sorted.includes(6);
  const noiseLevel = borderStyle === "heavy" ? "偏高（重框抢戏）" : borderStyle === "accent" ? "适中（原海报左色条）" : borderStyle === "tint" ? "柔和（浅底分块）" : "极低（纯留白呼吸）";

  let status = "ok";
  let verdict = "";
  let why = "";
  if (groupCount === 1) {
    status = "err";
    verdict = "10 项全糊在一块：一眼望不到头";
    why = "主体资质、银行专票信息和收票联系人毫无区隔。用户刚打开就会产生「这表太长了」的压迫感，也不知道哪几项只是专票才填。点虚线槽把它们拆成 2–3 组试试。";
  } else if (groupCount >= 6 || minGroup === 1) {
    status = "warn";
    verdict = `切得过碎（${groupCount} 组，最小组仅 ${minGroup} 项）`;
    why = "把原本属于同一概念的字段硬拆成孤零零的一两格，边界本身反倒成了噪声；表单分组通常以每组 2–5 个相关字段为宜（经验带）。";
  } else if (borderStyle === "heavy") {
    status = "warn";
    verdict = "分组数量合理，但粗黑外框太吵";
    why: `已经拆成 ${groupCount} 组，不过每组加了厚黑框与重阴影，眼睛先被黑框吸走。换成「原海报左色条」或「纯留白」就能瞬间轻下来。`;
  } else if (hitLogical && groupCount === 3) {
    status = "ok";
    verdict = "恰到好处的 3 组结构（抬头 3 项 / 专票银行 3 项 / 收票联系 4 项）";
    why: `3 个语义块边界清晰，最大组 ${maxGroup} 项，视觉噪声${noiseLevel}。配合「${reqMark === "optional" ? "仅标 (可选)" : "标必填 *"}」${reqMark === "optional" ? "省去了 6 枚红星噪声，专票可选块一眼可跳过。" : "清晰指出了必填项；如果表单里多数是必填，也可以试试切到「仅标 (可选)」减少红星干扰。"}`;
  } else {
    status = "ok";
    verdict = `已分成 ${groupCount} 组（每组 ${sizes.join(" / ")} 项）`;
    why: "已经打破 10 项糊墙，不过第 3 项（开票类型）和第 4 项（开户银行）、第 6 项（注册地址）和第 7 项（收票人）之间才是天然的业务语义分界，试试把切刀挪到那两处。";
  }

  return { groupCount, sizes, maxGroup, noiseLevel, status, verdict, why };
}

// ============================================================
// 03 节：校验时机对战舱
// ============================================================
export const VALIDATION_MODES = {
  placeholder: {
    id: "placeholder",
    label: "占位符当标签",
    tag: "反模式 · 失忆风险",
    tone: "err",
    desc: "省掉外部标签，把「输入公司邮箱（需含 @ 与域名）」塞进 placeholder。用户刚敲下第 1 个字母，规则就立刻蒸发。",
    wcag: "未达标（违反 WCAG 3.3.2 持久标签要求）",
  },
  premature: {
    id: "premature",
    label: "边打字边报红",
    tag: "反模式 · 过早打断",
    tone: "err",
    desc: "每敲一个键就立刻校验报错：刚输入「z」「h」「o」就连续闪烁红字「邮箱格式错误」，让人以为键盘坏了或系统敌意满满。",
    wcag: "形式可见，但实测体验极差（Baymard 典型反模式）",
  },
  submitOnly: {
    id: "submitOnly",
    label: "仅提交后才报错",
    tag: "滞后反馈 · 返工成本高",
    tone: "warn",
    desc: "填写过程一言不发，直到全表写完点提交才一次性抛出多处红错，用户不得不回头重新回忆与定位。",
    wcag: "需搭配顶部错误汇总与字段跳转链接",
  },
  smartBlur: {
    id: "smartBlur",
    label: "常驻提示 + 离焦校验",
    tag: "推荐做法 · 奖励早、惩罚晚",
    tone: "ok",
    desc: "标签和格式提示常驻框外；输入途中不打断，失焦（blur）才温和提示错误；一旦用户回到该框改对，立刻消红亮青（Reward early, punish late）。",
    wcag: "达标（符合 WCAG 3.3.1 文本识错 + 3.3.2 常驻说明）",
  },
};

// ============================================================
// 04 节：行动主次与防误触实验
// ============================================================
export const ACTION_LAYOUTS = [
  {
    id: "equal-danger",
    label: "三钮同色 + 含清空",
    buttons: [
      { id: "reset", text: "重置", role: "danger", style: "solid-blue" },
      { id: "cancel", text: "取消", role: "cancel", style: "solid-blue" },
      { id: "submit", text: "确定", role: "submit", style: "solid-blue" },
    ],
    risk: "高危误触",
    tone: "err",
    why: "三个按钮同色同重，且文案笼统写着「确定」，高危「重置」又紧挨左侧。填完长表眼睛疲劳时，一秒内极易顺手误点重置。",
  },
  {
    id: "inverted-ok",
    label: "取消高亮 · 提交弱化",
    buttons: [
      { id: "cancel", text: "取消并返回", role: "cancel", style: "solid-blue" },
      { id: "submit", text: "提交申报", role: "submit", style: "ghost" },
    ],
    risk: "方向误导",
    tone: "err",
    why: "实心钴蓝把人的点击冲动引向了「取消并返回」，真正要完成的「提交申报」反而退成灰字，等于把出口画成主入口。",
  },
  {
    id: "poster-pair",
    label: "原海报解 · 主实次框",
    buttons: [
      { id: "cancel", text: "取消", role: "cancel", style: "outline" },
      { id: "submit", text: "提交表单 →", role: "submit", style: "solid-blue" },
    ],
    risk: "低误触 · 主次清晰",
    tone: "ok",
    why: "实心钴蓝 + 明确动词「提交表单 →」一眼锁定终点；次要「取消」降为线框按钮；彻底移除非必要的「重置」破坏键。",
  },
  {
    id: "left-axis",
    label: "单列左轴 · 主钮直落",
    buttons: [
      { id: "submit", text: "提交项目立项", role: "submit", style: "solid-blue" },
      { id: "cancel", text: "取消", role: "cancel", style: "text-link" },
    ],
    risk: "最低扫视距离",
    tone: "ok",
    why: "单列表单把具体动词主按钮对齐输入列左基准线，眼球沿左缘一路直下就能落到按钮上，次操作退为纯文字链接。",
  },
];

// ============================================================
// 05 节：表单布局从哪来（全部经核实的公开文献与标准）
// ============================================================
export const LINEAGE_ITEMS = [
  {
    year: "1995",
    shortTitle: "HTML 2.0 表单标准",
    date: "1995 年 11 月",
    title: "HTML 2.0（RFC 1866）标准化网页表单",
    who: "Tim Berners-Lee & Dan Connolly · IETF",
    body: "RFC 1866 第 8 节首次在互联网标准里写明 <FORM>、<INPUT>、<SELECT> 与 <TEXTAREA>，把工业时代沿用了百年的纸质单据正式搬进浏览器，网页由此从「只读文档」变成双向交互界面。",
    takeaway: "早期表单只是控件堆叠，还没有系统化的眼动与认知研究。",
  },
  {
    year: "2006",
    shortTitle: "Penzo 眼动实验",
    date: "2006 年 7 月",
    title: "《Label Placement in Forms》眼动追踪实证",
    who: "Matteo Penzo · UXmatters",
    body: "Penzo 用眼动仪对照测试了顶对齐、左置右对齐与左置左对齐三种标签排布，发现顶对齐让用户单次注视就能兼顾标签与输入框、完成最快；右对齐次之；左置左对齐因为长短标签扯出参差空白裂口，扫视往返最多、耗时最长。",
    takeaway: "从此「标签置顶左对齐」成为现代 Web 表单的默认基准。",
  },
  {
    year: "2008",
    shortTitle: "两部表单奠基专著",
    date: "2008 年",
    title: "《Web Form Design》与《Forms that Work》同年问世",
    who: "Luke Wroblewski（Rosenfeld Media）/ Caroline Jarrett & Gerry Gaffney（Morgan Kaufmann）",
    body: "Wroblewski 结合 Yahoo! 与 eBay 的真实案例系统总结了表单路径、分组、内联校验与主次行动；同年 Jarrett 与 Gaffney 提出「表单本质上是一场对话」，把表单拆成「关系、对话、外观」三层，强调先删掉多余问题，再谈界面美化。",
    takeaway: "表单设计正式独立成一门以任务完成率与认知负荷为核心的专业方法。",
  },
  {
    year: "2014",
    shortTitle: "占位符警示与 GOV.UK",
    date: "2014 年起",
    title: "占位符警示与 GOV.UK 单列表单体系",
    who: "Katie Sherwin（NN/g）/ 英国政府数字服务部（GDS）",
    body: "2014 年 5 月，NN/g 发表《Placeholders in Form Fields Are Harmful》，指出用框内占位符替代常驻标签会制造短时记忆负担与对比度灾难。同期 GOV.UK Design System 推广「单列表单」「顶部错误汇总（Error summary）」与「一页一件事」，将公共服务表单的可读性推向行业标杆。",
    takeaway: "极简不等于藏掉标签与说明——省掉必要的路标只会把成本转嫁给用户。",
  },
  {
    year: "2018",
    shortTitle: "WCAG 2.1 无障碍准则",
    date: "2018 年 6 月",
    title: "W3C WCAG 2.1 把表单清晰度写进无障碍标准",
    who: "W3C Web Accessibility Initiative",
    body: "准则 3.3.1（错误识别）明确规定不能只用红框提示错误，必须用清晰的文字点明出错项；准则 3.3.2（标签或说明）要求所有需要用户输入的控件都配有可感知的常驻标签或格式说明。",
    takeaway: "清晰的标签、分组与纠错不只是美观问题，也是残障人士与移动弱网用户的底线。",
  },
];

// ============================================================
// 06 节：什么时候用 / 什么时候别用（场景决策器）
// ============================================================
export const USE_CASES = [
  {
    id: "standard",
    label: "3–12 个字段 · 一次核对提交",
    verdict: "直接用 284 标准表单布局",
    fit: "fit",
    reason: "信息量适中，分成 2–3 个清晰语义组，一屏或轻滚即可看清全貌，填完直接提交，没有多余翻页摩擦。",
    example: "如项目立项、账号注册、意见反馈、单页预约或活动报名。",
    link: null,
  },
  {
    id: "long-flow",
    label: "超过 15 项 · 带条件分支或高焦虑流程",
    verdict: "别硬塞单页，改用「285 分步表单」",
    fit: "avoid",
    reason: "字段太多或后面题目依赖前面选项时，单页长表会把人吓跑。把任务拆成带进度条的 3–5 步，每步只消化一件事。",
    example: "如个人报税、保险核保、多步骤实名认证与复杂结账。",
    link: { id: "285", name: "285 分步表单", url: "https://layout.xiaoxiaodong.ai/285/play/" },
  },
  {
    id: "instant-prefs",
    label: "偏好开关 · 改完即时生效无需提交",
    verdict: "别套提交表单，改用「287 设置页面布局」",
    fit: "avoid",
    reason: "通知开关、主题切换、隐私偏好属于长期配置，用户期待拨动即生效并按目录快速检索，而不是滑到底找提交按钮。",
    example: "如账号安全中心、消息通知设置、软件偏好面板。",
    link: { id: "287", name: "287 设置页面布局", url: "https://layout.xiaoxiaodong.ai/287/play/" },
  },
  {
    id: "bulk-edit",
    label: "一次批量录入 / 修改数十条同类记录",
    verdict: "别反复填表，改用「274 数据表格布局」",
    fit: "avoid",
    reason: "财务对账、库存盘点或成绩登记需要行内编辑、键盘上下切换和整列比对，逐条开表单效率极低。",
    example: "如批量改价、SKU 维护、费用报销明细表。",
    link: { id: "274", name: "274 数据表格布局", url: "https://layout.xiaoxiaodong.ai/274/play/" },
  },
  {
    id: "search-filter",
    label: "反复筛选查找结果，而非录入新数据",
    verdict: "别做成提交表，改用「286 搜索结果布局」",
    fit: "avoid",
    reason: "找房、挑机票或搜文档重在「输入条件→即时刷新列表→继续微调」，条件区应紧贴结果列表联动。",
    example: "如商品多维筛选、航班检索、知识库搜索页。",
    link: { id: "286", name: "286 搜索结果布局", url: "https://layout.xiaoxiaodong.ai/286/play/" },
  },
  {
    id: "conversational",
    label: "冷启动引导 · 一问一答降低心理门槛",
    verdict: "可考虑「281 对话布局」轻量收集",
    fit: "avoid",
    reason: "客服分流、初诊预问诊或 AI 需求澄清更像聊天而不是填单，逐轮追问能按回答动态决定下一题。",
    example: "如智能客服工单引导、互动式问卷测评。",
    link: { id: "281", name: "281 对话布局", url: "https://layout.xiaoxiaodong.ai/281/play/" },
  },
];

// ============================================================
// 07 节：四选一单变量实战练习（纯中性标签，不泄题）
// ============================================================
export const PRACTICE_QUIZ = {
  prompt:
    "你要为一款手机与桌面通用的「团队活动报名表」排版，包含 6 个必填项（姓名、手机号、邮箱、部门、餐饮偏好、是否住宿）。以下四版字号、色彩、2 组分段、底部错误汇总与主按钮完全相同，只改变了一个布局变量，哪一版填起来最顺手、出错最少？",
  answer: "A",
  options: [
    {
      id: "A",
      code: "方案 A",
      neutralDesc: "单列 6 项 · 常驻顶对齐标签",
      layoutKind: "top-single",
      explain:
        "正确。所有 6 个字段沿同一条左基准线自上而下展开，标签始终留在框外正上方：眼动单次注视即可同时看清名称与输入框，零横向折返，填完回查轻松，手机端也无需二次重构。",
    },
    {
      id: "B",
      code: "方案 B",
      neutralDesc: "双列 3 行 · 常驻顶对齐标签",
      layoutKind: "two-col",
      explain:
        "唯一变量是把 6 个彼此独立的字段硬拆成双列。Baymard 实证表明，非强成对字段排两列会制造阅读顺序歧义（先竖着填还是先横着填？），眼睛反复 Z 字跳动，容易漏填右列字段。",
    },
    {
      id: "C",
      code: "方案 C",
      neutralDesc: "单列 6 项 · 框内占位符代标签",
      layoutKind: "placeholder",
      explain:
        "唯一变量是去掉外部常驻标签、改用框内 placeholder。一旦点击输入，提示文字瞬间消失；用户填完 6 格想复核或者出现报错时，完全看不到每格原本要求什么，且低对比度不利于无障碍阅读。",
    },
    {
      id: "D",
      code: "方案 D",
      neutralDesc: "单列 6 项 · 左置左对齐标签列",
      layoutKind: "left-aligned",
      explain:
        "唯一变量是改用左置左对齐标签列。「姓名」（2 字）与「是否住宿 / 餐饮偏好」（4 字）共用同一标签列宽度，短标签右侧扯出空白裂口，眼睛必须在标签与输入框之间横跨空白反复扫视，窄屏还会挤扁输入框。",
    },
  ],
};
