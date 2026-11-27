// 01–07 章节交互模块（五要素解剖 / 真实跨度实验 / 深孔雀暗室 5 秒扫读 / 源流年表 / 边界速判 / 小练习 / 原海报灯箱）

const ANATOMY_DATA = {
  start: {
    tag: "要素 01 · 起点",
    title: "没有起点锚，后面全像半路插播",
    goodText: "在轴线最前端交代时间起点和背景目标（例如「Q1 立项 · 对齐 6 人核心团队」），观众脑海立刻立起参照原点，后面的每一步推进才看得出快慢与分量。",
    badText: "省掉起点直接跳进「阶段二 / 推进任务」，观众第一反应不是看进展，而是忙着猜「这件事到底什么时候开始、当初想解决什么问题」。",
    svgGood: `<svg viewBox="0 0 640 210" role="img" aria-label="起点到位示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="66" y1="118" x2="574" y2="118" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <polygon points="586,118 568,108 568,128" fill="#155D56"/>
      <rect x="26" y="24" width="176" height="58" rx="8" fill="#E2EFEA" stroke="#155D56" stroke-width="2"/>
      <text x="40" y="47" fill="#0D4A44" font-size="13" font-weight="700">起点锚 · Q1 立项</text>
      <text x="40" y="68" fill="#1A110A" font-size="12">明确业务目标与 6 人核心组</text>
      <line x1="88" y1="82" x2="88" y2="106" stroke="#E1613E" stroke-width="2.5" stroke-dasharray="4 3"/>
      <circle cx="88" cy="118" r="12" fill="#FFF9F0" stroke="#E1613E" stroke-width="4.5"/>
      <circle cx="242" cy="118" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
      <circle cx="396" cy="118" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
      <circle cx="536" cy="118" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
      <text x="242" y="154" text-anchor="middle" fill="#1A110A" font-size="13" font-weight="700">筹备调研</text>
      <text x="396" y="154" text-anchor="middle" fill="#1A110A" font-size="13" font-weight="700">方案落地</text>
      <text x="536" y="154" text-anchor="middle" fill="#1A110A" font-size="13" font-weight="700">正式上线</text>
      <text x="88" y="154" text-anchor="middle" fill="#A33114" font-size="13" font-weight="700">坐标原点</text>
    </svg>`,
    svgBad: `<svg viewBox="0 0 640 210" role="img" aria-label="缺少起点后果示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="66" y1="118" x2="574" y2="118" stroke="#9B8E7C" stroke-width="4" stroke-dasharray="8 6"/>
      <rect x="26" y="24" width="180" height="54" rx="8" fill="#FBE9E2" stroke="#BA4222" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="40" y="48" fill="#A33114" font-size="13" font-weight="700">起点背景缺失（？？）</text>
      <text x="40" y="67" fill="#4A3F35" font-size="12">何时启动、目标是什么全靠猜</text>
      <circle cx="242" cy="118" r="10" fill="#FFF9F0" stroke="#7A6D5E" stroke-width="3.5"/>
      <circle cx="396" cy="118" r="10" fill="#FFF9F0" stroke="#7A6D5E" stroke-width="3.5"/>
      <circle cx="536" cy="118" r="10" fill="#FFF9F0" stroke="#7A6D5E" stroke-width="3.5"/>
      <text x="242" y="154" text-anchor="middle" fill="#4A3F35" font-size="13">推进任务</text>
      <text x="396" y="154" text-anchor="middle" fill="#4A3F35" font-size="13">修改方案</text>
      <text x="536" y="154" text-anchor="middle" fill="#4A3F35" font-size="13">上线发布</text>
    </svg>`,
  },
  nodes: {
    tag: "要素 02 · 节点",
    title: "节点只留转折点，不搬流水账",
    goodText: "每个节点由「时间锚 + 4 字以内阶段名 + 一句 ≤16 字交付物」组成，一页稳住 3–5 站，观众扫一眼就能把关键节点背下来。",
    badText: "把例会、微调、归档和 40 字长句全塞进轴线，时间线退化成「排成一横排的 Word 文档」，后排观众彻底放弃阅读。",
    svgGood: `<svg viewBox="0 0 640 210" role="img" aria-label="节点简洁聚焦示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="56" y1="108" x2="578" y2="108" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <polygon points="590,108 572,98 572,118" fill="#155D56"/>
      ${[105, 245, 385, 525].map((x, i) => `
        <circle cx="${x}" cy="108" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
        <rect x="${x - 56}" y="28" width="112" height="24" rx="12" fill="#155D56"/>
        <text x="${x}" y="44" text-anchor="middle" fill="#FFF9F0" font-size="12" font-weight="700">${["目标定义","方案落地","测试优化","正式发布"][i]}</text>
        <text x="${x}" y="144" text-anchor="middle" fill="#1A110A" font-size="13" font-weight="700">${["W1 筹备","W6 执行","W10 验证","W12 上线"][i]}</text>
        <text x="${x}" y="165" text-anchor="middle" fill="#4A3F35" font-size="11.5">${["确立方向与边界","核心链路交付","回收 64 条反馈","稳定运行零故障"][i]}</text>
      `).join("")}
    </svg>`,
    svgBad: `<svg viewBox="0 0 640 210" role="img" aria-label="节点过载密字示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="36" y1="92" x2="604" y2="92" stroke="#BA4222" stroke-width="4"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 58 + i * 74;
        return `<circle cx="${x}" cy="92" r="7.5" fill="#FBE9E2" stroke="#BA4222" stroke-width="3"/>
          <rect x="${x - 32}" y="112" width="64" height="72" rx="4" fill="#FBE9E2" stroke="#D77A5D"/>
          <line x1="${x - 24}" y1="126" x2="${x + 24}" y2="126" stroke="#A33114" stroke-width="3"/>
          <line x1="${x - 24}" y1="138" x2="${x + 20}" y2="138" stroke="#6E5A4B" stroke-width="2"/>
          <line x1="${x - 24}" y1="149" x2="${x + 22}" y2="149" stroke="#6E5A4B" stroke-width="2"/>
          <line x1="${x - 24}" y1="160" x2="${x + 16}" y2="160" stroke="#6E5A4B" stroke-width="2"/>
          <line x1="${x - 24}" y1="171" x2="${x + 20}" y2="171" stroke="#6E5A4B" stroke-width="2"/>`;
      }).join("")}
      <text x="320" y="48" text-anchor="middle" fill="#A33114" font-size="14" font-weight="700">8 站密排 + 每站 5 行小字：标签撞车，观众直接跳读</text>
    </svg>`,
  },
  order: {
    tag: "要素 03 · 顺序",
    title: "空间方向必须死守时间先后",
    goodText: "左早右晚、下早右上（攀升）或上早下晚，全页只能有一套推进方向。顺叙让前一站自然成为后一站的原因，听众不用费力在脑里重新排序。",
    badText: "如果为了凑视觉对称把较晚的里程碑往前塞，或者正轴往上爬、注释往下读，观众视线反复折返，立刻怀疑逻辑本身靠不靠谱。",
    svgGood: `<svg viewBox="0 0 640 210" role="img" aria-label="时间顺叙示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <path d="M 76 160 C 190 155, 220 116, 320 105 C 420 94, 460 56, 558 42" fill="none" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <polygon points="572,39 552,33 557,51" fill="#155D56"/>
      ${[{x:100,y:156,t:"1 月 调研"},{x:252,y:118,t:"2 月 原型"},{x:404,y:86,t:"3 月 联调"},{x:532,y:47,t:"4 月 上线"}].map((p) => `
        <circle cx="${p.x}" cy="${p.y}" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
        <text x="${p.x}" y="${p.y + 30}" text-anchor="middle" fill="#1A110A" font-size="13" font-weight="700">${p.t}</text>
      `).join("")}
    </svg>`,
    svgBad: `<svg viewBox="0 0 640 210" role="img" aria-label="时间逆序折返示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="70" y1="120" x2="570" y2="120" stroke="#8C7E6C" stroke-width="4"/>
      <path d="M 384 106 Q 318 32 252 106" fill="none" stroke="#BA4222" stroke-width="3" stroke-dasharray="6 4"/>
      <polygon points="248,110 262,106 254,95" fill="#BA4222"/>
      <text x="318" y="48" text-anchor="middle" fill="#A33114" font-size="13" font-weight="700">时间倒流折返！</text>
      ${[{x:120,t:"1 月 调研",bad:false},{x:252,t:"3 月 联调",bad:true},{x:384,t:"2 月 原型",bad:true},{x:516,t:"4 月 上线",bad:false}].map((p) => `
        <circle cx="${p.x}" cy="120" r="10" fill="#FFF9F0" stroke="${p.bad ? "#BA4222" : "#155D56"}" stroke-width="4"/>
        <text x="${p.x}" y="156" text-anchor="middle" fill="${p.bad ? "#A33114" : "#1A110A"}" font-size="13" font-weight="700">${p.t}</text>
      `).join("")}
    </svg>`,
  },
  rhythm: {
    tag: "要素 04 · 节奏",
    title: "均匀的留白步幅，制造推进节拍",
    goodText: "节点与画框两头留出呼吸缓冲，相邻段距比例稳在 1.0×–1.6× 之间，视线就像踩着稳定鼓点一路滑向终点箭头。",
    badText: "三站挤成一团互相压字、首尾空出巨大真空，即使内容没错，画面也显得失衡匆忙，观众会误判中段发生了堆叠事故。",
    svgGood: `<svg viewBox="0 0 640 210" role="img" aria-label="均匀视觉节奏示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="56" y1="110" x2="584" y2="110" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      ${[104, 212, 320, 428, 536].map((x, i) => `
        <circle cx="${x}" cy="110" r="10" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
        ${i < 4 ? `<line x1="${x + 14}" y1="74" x2="${x + 94}" y2="74" stroke="#E1613E" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="${x + 54}" y="64" text-anchor="middle" fill="#A33114" font-size="12" font-weight="700">等步 1.0×</text>` : ""}
        <text x="${x}" y="146" text-anchor="middle" fill="#1A110A" font-size="12.5" font-weight="700">阶段 0${i + 1}</text>
      `).join("")}
    </svg>`,
    svgBad: `<svg viewBox="0 0 640 210" role="img" aria-label="节奏挤团失衡示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="56" y1="110" x2="584" y2="110" stroke="#155D56" stroke-width="5"/>
      ${[86, 286, 320, 354, 554].map((x, i) => `
        <circle cx="${x}" cy="110" r="10" fill="#FFF9F0" stroke="${i > 0 && i < 4 ? "#BA4222" : "#155D56"}" stroke-width="4"/>
      `).join("")}
      <rect x="266" y="54" width="108" height="30" rx="6" fill="#FBE9E2" stroke="#BA4222"/>
      <text x="320" y="74" text-anchor="middle" fill="#A33114" font-size="12.5" font-weight="700">中段挤团 5.9×</text>
      <text x="186" y="150" text-anchor="middle" fill="#4A3F35" font-size="12">大片真空</text>
      <text x="454" y="150" text-anchor="middle" fill="#4A3F35" font-size="12">大片真空</text>
    </svg>`,
  },
  conclusion: {
    tag: "要素 05 · 结论",
    title: "没有终点收束，时间线只是流水账",
    goodText: "用一张独立视觉框（如 346 原海报右下角青绿细框「结论」卡）把整条时间线的最终业务结果或行动号召钉死，让观众翻页后记得住「所以呢」。",
    badText: "最后停在「完成上线部署」就戛然而止，没有提炼价值或下一步行动，管理层听完只会追问：「折腾了四个月，最后带来了什么结果？」",
    svgGood: `<svg viewBox="0 0 640 210" role="img" aria-label="终点结论收束示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="56" y1="112" x2="366" y2="112" stroke="#155D56" stroke-width="5"/>
      <polygon points="378,112 360,102 360,122" fill="#155D56"/>
      ${[88, 178, 268, 344].map((x, i) => `<circle cx="${x}" cy="112" r="9" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/><text x="${x}" y="144" text-anchor="middle" fill="#4A3F35" font-size="12">M${i + 1}</text>`).join("")}
      <rect x="396" y="34" width="214" height="142" rx="12" fill="#FBF4E8" stroke="#155D56" stroke-width="2.2"/>
      <circle cx="424" cy="64" r="14" fill="#E1613E"/>
      <text x="424" y="69" text-anchor="middle" fill="#FFF9F0" font-size="14" font-weight="700">★</text>
      <text x="448" y="69" fill="#1A110A" font-size="16" font-weight="700">结论</text>
      <text x="414" y="102" fill="#1A110A" font-size="13" font-weight="600">核心链路零中断上线，</text>
      <text x="414" y="122" fill="#1A110A" font-size="13" font-weight="600">首月留存提升至 68%。</text>
      <line x1="414" y1="138" x2="590" y2="138" stroke="#E1613E" stroke-width="1.6"/>
      <text x="414" y="158" fill="#0D4A44" font-size="12" font-weight="700">目标清晰 · 过程可视 · 价值强化</text>
    </svg>`,
    svgBad: `<svg viewBox="0 0 640 210" role="img" aria-label="缺少终点结论示意图">
      <rect width="640" height="210" rx="8" fill="#F4E7D3"/>
      <line x1="56" y1="112" x2="366" y2="112" stroke="#155D56" stroke-width="5"/>
      ${[88, 178, 268, 344].map((x, i) => `<circle cx="${x}" cy="112" r="9" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/><text x="${x}" y="144" text-anchor="middle" fill="#4A3F35" font-size="12">M${i + 1}</text>`).join("")}
      <rect x="396" y="34" width="214" height="142" rx="12" fill="#FBE9E2" stroke="#BA4222" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="503" y="96" text-anchor="middle" fill="#A33114" font-size="15" font-weight="700">缺少终点结论卡</text>
      <text x="503" y="122" text-anchor="middle" fill="#4A3F35" font-size="12.5">观众看完一串动作后</text>
      <text x="503" y="142" text-anchor="middle" fill="#4A3F35" font-size="12.5">不知道该记住什么价值</text>
    </svg>`,
  },
};

const HISTORY_DATA = {
  1753: {
    badge: "1753 · 法国巴黎",
    title: "Jacques Barbeu-Dubourg 与《编年图谱》",
    p1: "法国医生兼博物学者 Jacques Barbeu-Dubourg 在 1753 年印制了长达约 16 米的连续网格纸卷《编年图谱》（Carte Chronographique），并在精致版中装入带双摇把的木匣，读者摇动手柄即可沿统一时间刻度滚动浏览人类历史。普林斯顿大学图书馆善本部至今仍保存着这件早期机械时间线装置。",
    p2: "这是近代最早将「抽象年代」严格映射到等长物理纸卷的范例：手摇过两倍纸长，就是流过两倍光阴。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1753 双摇把编年纸卷构造简图">
      <rect width="360" height="220" rx="8" fill="#F4E7D3"/>
      <rect x="34" y="42" width="292" height="128" rx="10" fill="#E6DAC4" stroke="#155D56" stroke-width="2.5"/>
      <rect x="52" y="58" width="256" height="96" rx="4" fill="#FBF4E8" stroke="#1A110A" stroke-width="1.5"/>
      ${[88, 132, 176, 220, 264].map((x) => `<line x1="${x}" y1="58" x2="${x}" y2="154" stroke="#D5C5AC" stroke-width="1.2"/>`).join("")}
      <line x1="64" y1="88" x2="294" y2="88" stroke="#155D56" stroke-width="3"/>
      <line x1="64" y1="112" x2="262" y2="112" stroke="#E1613E" stroke-width="3"/>
      <line x1="94" y1="134" x2="294" y2="134" stroke="#155D56" stroke-width="2.4"/>
      <circle cx="42" cy="186" r="14" fill="#155D56"/><line x1="42" y1="186" x2="52" y2="176" stroke="#FFF9F0" stroke-width="3" stroke-linecap="round"/>
      <circle cx="318" cy="186" r="14" fill="#155D56"/><line x1="318" y1="186" x2="328" y2="176" stroke="#FFF9F0" stroke-width="3" stroke-linecap="round"/>
      <text x="180" y="191" text-anchor="middle" fill="#4A3F35" font-size="12" font-weight="600">双摇把 16 米连续网格纸卷 · 1753</text>
    </svg>`,
  },
  1765: {
    badge: "1765 & 1769 · 英国沃灵顿",
    title: "Joseph Priestley 与现代水平时间轴",
    p1: "英国学者 Joseph Priestley 为历史教学绘出铜版挂图《传记图谱》（A Chart of Biography，1765），以左早右晚的等距水平线段标出公元前 1200 年至公元 1800 年间约 2,000 位人物的生平，随后又推出配套的《新历史图谱》（1769）。",
    p2: "Priestley 确立了今天几乎所有幻灯片时间线的默认契约：横向位置代表时间先后，线段长度直接对应持续时长，竖向一眼看清谁与谁生活在同一个时代。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1765 Priestley 水平人物生平条简图">
      <rect width="360" height="220" rx="8" fill="#F4E7D3"/>
      <line x1="28" y1="36" x2="332" y2="36" stroke="#1A110A" stroke-width="2"/>
      ${[50, 120, 190, 260, 320].map((x, i) => `<line x1="${x}" y1="32" x2="${x}" y2="180" stroke="#D5C5AC" stroke-dasharray="3 3"/><text x="${x}" y="26" text-anchor="middle" fill="#4A3F35" font-size="10.5">${["1200BC","400BC","400AD","1200AD","1800"][i]}</text>`).join("")}
      <line x1="48" y1="68" x2="112" y2="68" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <line x1="88" y1="92" x2="164" y2="92" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <line x1="150" y1="116" x2="232" y2="116" stroke="#E1613E" stroke-width="5" stroke-linecap="round"/>
      <line x1="204" y1="140" x2="294" y2="140" stroke="#155D56" stroke-width="5" stroke-linecap="round"/>
      <line x1="252" y1="164" x2="322" y2="164" stroke="#E1613E" stroke-width="5" stroke-linecap="round"/>
      <text x="180" y="202" text-anchor="middle" fill="#4A3F35" font-size="12" font-weight="600">左早右晚等距横条 · A Chart of Biography</text>
    </svg>`,
  },
  1919: {
    badge: "1919 & 1922 · 美国",
    title: "Henry L. Gantt 与工程进度甘特图",
    p1: "美国机械工程师 Henry L. Gantt 在一战期间为工业调度设计出进度图表，并在 1919 年著作《为工作而组织》（Organizing for Work）中系统阐述；1922 年其合作者 Wallace Clark 出版《甘特图：管理的工作工具》，把这一方法推向全球工程管理。",
    p2: "时间线从此走出历史书进入项目汇报：横轴不再只是过去发生的事，更成为追踪「计划 vs 实际进展」的交付武器。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="1919 甘特图进度条简图">
      <rect width="360" height="220" rx="8" fill="#F4E7D3"/>
      <rect x="24" y="28" width="312" height="148" rx="6" fill="#FBF4E8" stroke="#155D56" stroke-width="1.6"/>
      ${[100, 160, 220, 280].map((x, i) => `<line x1="${x}" y1="28" x2="${x}" y2="176" stroke="#D5C5AC"/><text x="${x + 28}" y="46" text-anchor="middle" fill="#4A3F35" font-size="11">M${i + 1}</text>`).join("")}
      <text x="36" y="76" fill="#1A110A" font-size="11.5" font-weight="700">调研</text>
      <rect x="104" y="64" width="62" height="16" rx="4" fill="#155D56"/>
      <text x="36" y="108" fill="#1A110A" font-size="11.5" font-weight="700">研发</text>
      <rect x="150" y="96" width="110" height="16" rx="4" fill="#155D56"/>
      <rect x="150" y="101" width="84" height="6" rx="3" fill="#E1613E"/>
      <text x="36" y="140" fill="#1A110A" font-size="11.5" font-weight="700">验收</text>
      <rect x="244" y="128" width="76" height="16" rx="4" fill="#E6DAC4" stroke="#155D56"/>
      <text x="180" y="200" text-anchor="middle" fill="#4A3F35" font-size="12" font-weight="600">计划区间 × 实际推进进度条 · 1919</text>
    </svg>`,
  },
  2008: {
    badge: "2008 · 现代投影演讲时代",
    title: "Nancy Duarte 与 Garr Reynolds 的减法革命",
    p1: "2008 年，Nancy Duarte 出版《slide:ology》、Garr Reynolds 出版《Presentation Zen》，共同向拥挤的办公软件默认模板开火：投影幻灯片不是发给观众自己读的文档，而是为讲者声音服务的视觉锚点。",
    p2: "落实到时间线页，就是告别 10 站密字清单——只保留 3–5 个真正改变故事走向的里程碑，把视觉重心与留白让给关键转折与终点结论。",
    svg: `<svg viewBox="0 0 360 220" role="img" aria-label="2008 极简演讲时间线简图">
      <rect width="360" height="220" rx="8" fill="#0B2825"/>
      <line x1="42" y1="112" x2="306" y2="112" stroke="#73E5D2" stroke-width="4" stroke-linecap="round"/>
      <polygon points="320,112 302,102 302,122" fill="#73E5D2"/>
      ${[76, 152, 228, 290].map((x, i) => `
        <circle cx="${x}" cy="112" r="${i === 3 ? 11 : 8}" fill="${i === 3 ? "#E1613E" : "#0B2825"}" stroke="${i === 3 ? "#FFF9F0" : "#73E5D2"}" stroke-width="3.5"/>
        <text x="${x}" y="${i === 3 ? 84 : 146}" text-anchor="middle" fill="${i === 3 ? "#FF9473" : "#E7F2EE"}" font-size="12" font-weight="700">${["01 起点","02 转折","03 验证","04 结论"][i]}</text>
      `).join("")}
      <text x="180" y="196" text-anchor="middle" fill="#B4CDC5" font-size="12">留白 + 少节点 + 单焦点收束 · 2008</text>
    </svg>`,
  },
};

export function initSections() {
  initAnatomySection();
  initScaleLabSection();
  initDarkLoadLab();
  initHistorySection();
  initTriageSection();
  initQuizSection();
  initPosterLightbox();
}

function initAnatomySection() {
  const btns = [...document.querySelectorAll(".anat-btn")];
  const modeBtns = [...document.querySelectorAll("[data-anat-mode]")];
  const tagEl = document.getElementById("anat-tag");
  const titleEl = document.getElementById("anat-title");
  const svgBox = document.getElementById("anat-svg-box");
  const textEl = document.getElementById("anat-explain-text");

  let activeKey = "start";
  let mode = "good";

  function render() {
    const item = ANATOMY_DATA[activeKey];
    tagEl.textContent = item.tag;
    titleEl.textContent = item.title;
    svgBox.innerHTML = mode === "good" ? item.svgGood : item.svgBad;
    textEl.textContent = mode === "good" ? item.goodText : item.badText;

    btns.forEach((b) => {
      const on = b.dataset.anat === activeKey;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    modeBtns.forEach((b) => {
      b.classList.toggle("is-active", b.dataset.anatMode === mode);
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => { activeKey = b.dataset.anat; render(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.anatMode; render(); }));
  render();
}

function initScaleLabSection() {
  const slider = document.getElementById("scale-gap-slider");
  const yearOut = document.getElementById("scale-year-readout");
  const ratioOut = document.getElementById("scale-ratio-readout");
  const breakBtn = document.getElementById("scale-break-toggle");
  const svgHost = document.getElementById("scale-tracks-svg");
  const dTrue = document.getElementById("scale-desc-true");
  const dEven = document.getElementById("scale-desc-even");
  const dBreak = document.getElementById("scale-desc-break");

  let showBreak = true;

  function render() {
    const y4 = Number(slider.value);
    const years = [2016, 2017, 2018, y4];
    const lastSpan = y4 - 2018;
    const totalSpan = y4 - 2016;
    const leftClusterPct = Math.round(((2018 - 2016) / totalSpan) * 100);

    yearOut.textContent = `${y4} 年（末段跨度 ${lastSpan} 年）`;
    ratioOut.textContent = `跨度偏斜 ${lastSpan}.0×`;
    breakBtn.textContent = `断轴符号 //：${showBreak ? "开" : "关"}`;
    breakBtn.classList.toggle("is-on", showBreak);
    breakBtn.setAttribute("aria-pressed", String(showBreak));

    const x0 = 56;
    const x1 = 764;
    const spanW = x1 - x0;
    const trueXs = years.map((yr) => x0 + ((yr - 2016) / totalSpan) * spanW);
    const evenXs = [0, 1, 2, 3].map((i) => x0 + (i / 3) * spanW);

    const isSkewed = lastSpan >= 3;
    const breakMark = showBreak && isSkewed
      ? `<rect x="${(evenXs[2] + evenXs[3]) / 2 - 44}" y="220" width="88" height="24" rx="12" fill="#FBE9E2" stroke="#E1613E" stroke-width="1.6"/>
         <text x="${(evenXs[2] + evenXs[3]) / 2}" y="236" text-anchor="middle" fill="#A33114" font-size="12" font-weight="700">// 跨越 ${lastSpan} 年</text>`
      : "";

    svgHost.innerHTML = `<svg viewBox="0 0 820 276" role="img" aria-label="真实年份刻度、纯等距与断轴标记对比图">
      <!-- 1 真实年份比例尺 -->
      <text x="16" y="24" fill="#1A110A" font-size="13" font-weight="700">1. 真实年份比例尺${leftClusterPct <= 35 ? "（左侧三站挤撞！）" : "（跨度尚可）"}</text>
      <line x1="${x0}" y1="54" x2="${x1}" y2="54" stroke="#155D56" stroke-width="4" stroke-linecap="round"/>
      ${trueXs.map((x, i) => `
        <circle cx="${x}" cy="54" r="8" fill="#FFF9F0" stroke="${leftClusterPct <= 35 && i < 3 ? "#BA4222" : "#155D56"}" stroke-width="3.5"/>
        <text x="${x}" y="78" text-anchor="middle" fill="${leftClusterPct <= 35 && i < 3 ? "#A33114" : "#1A110A"}" font-size="11.5" font-weight="700">${years[i]}</text>
      `).join("")}

      <!-- 2 纯等距不标断轴 -->
      <text x="16" y="114" fill="#1A110A" font-size="13" font-weight="700">2. 纯等距排布${isSkewed ? "（把 1 年与 " + lastSpan + " 年画成一样宽，易误导）" : "（当前比例接近真实）"}</text>
      <line x1="${x0}" y1="142" x2="${x1}" y2="142" stroke="#7A6D5E" stroke-width="4" stroke-linecap="round"/>
      ${evenXs.map((x, i) => `
        <circle cx="${x}" cy="142" r="8" fill="#FFF9F0" stroke="#7A6D5E" stroke-width="3.5"/>
        <text x="${x}" y="166" text-anchor="middle" fill="#4A3F35" font-size="12" font-weight="700">${years[i]}</text>
      `).join("")}

      <!-- 3 等距 + 断轴标记 -->
      <text x="16" y="204" fill="#0D4A44" font-size="13" font-weight="700">3. 等距排布 + 断轴标记 //（推荐投影解法）</text>
      <line x1="${x0}" y1="232" x2="${x1}" y2="232" stroke="#155D56" stroke-width="4.5" stroke-linecap="round"/>
      ${breakMark}
      ${evenXs.map((x, i) => `
        <circle cx="${x}" cy="232" r="8.5" fill="#FFF9F0" stroke="#155D56" stroke-width="4"/>
        <text x="${x}" y="260" text-anchor="middle" fill="#1A110A" font-size="12" font-weight="700">${years[i]}</text>
      `).join("")}
    </svg>`;

    dTrue.textContent = leftClusterPct <= 35
      ? `2016–2018 三站被压在左侧仅 ${leftClusterPct}% 的窄缝里，文字互相打架；它诚实反映了跨度，但不适合直接投影。`
      : `当前总跨度 ${totalSpan} 年，前三站占 ${leftClusterPct}% 宽度，直接按真实年份画仍清晰可读。`;
    dEven.textContent = isSkewed
      ? `画面整齐了，却把「1 年」和「${lastSpan} 年」画成等宽——观众容易误判近期推进变慢或早期与后期耗时相同。`
      : `末段仅隔 ${lastSpan} 年，与前两段接近，此时直接等距排布几乎不产生比例失真。`;
    dBreak.textContent = showBreak && isSkewed
      ? `保留四站匀称节奏的同时，用 // 断轴标签明示「跨越 ${lastSpan} 年」，既好看又不隐瞒事实。`
      : isSkewed
        ? `你关掉了断轴符号 //，这一行退化成了与第 2 行相同的隐瞒跨度写法——点上方按钮重新打开试试。`
        : `当前跨度偏斜仅 ${lastSpan}×，无需断轴；拉大末节点年份到 2024 以后即可看到断轴标记的价值。`;
  }

  slider.addEventListener("input", render);
  breakBtn.addEventListener("click", () => { showBreak = !showBreak; render(); });
  render();
}

function initDarkLoadLab() {
  const countSlider = document.getElementById("load-count-slider");
  const wordsSlider = document.getElementById("load-words-slider");
  const countVal = document.getElementById("load-count-val");
  const wordsVal = document.getElementById("load-words-val");
  const totalEl = document.getElementById("load-total-chars");
  const caughtEl = document.getElementById("load-caught-nodes");
  const msgEl = document.getElementById("load-msg");
  const blurBtn = document.getElementById("load-blur-btn");
  const flashBtn = document.getElementById("load-flash-btn");
  const reopenBtn = document.getElementById("proj-reopen-btn");
  const slideEl = document.getElementById("proj-slide-content");
  const curtainEl = document.getElementById("proj-curtain");
  const curtainSub = document.getElementById("proj-curtain-sub");
  const timerBadge = document.getElementById("proj-timer-badge");

  let blurred = false;
  let timerId = 0;

  const SAMPLE_NODES = [
    "立项启动", "需求调研", "原型定稿", "架构搭建", "核心开发",
    "联调测试", "灰度验证", "性能优化", "全量发布",
  ];

  function renderSlide() {
    const n = Number(countSlider.value);
    const wPer = Number(wordsSlider.value);
    const total = n * wPer;
    // 5 秒内按投影扫读约 12 字/秒 + 节点跳转 0.15s 估算可扫完站数（示意）
    const perNodeSec = wPer / 12 + 0.15;
    const caught = Math.min(n, Math.max(0, Math.floor(5.0 / perNodeSec)));

    countVal.textContent = `${n} 个节点（${n <= 5 ? "稳妥区间" : "超载"}）`;
    wordsVal.textContent = `${wPer} 字 / 站`;
    totalEl.textContent = `${total} 字`;
    caughtEl.textContent = caught >= n ? `全部 ${n} / ${n} 站` : `仅 ${caught} / ${n} 站`;
    caughtEl.classList.toggle("is-warn", caught < n);

    if (n <= 5 && wPer <= 18) {
      msgEl.textContent = `全页仅 ${total} 字、${n} 个节点，5 秒翻页内观众可以把全部节点一眼扫清，并留出余力听讲者口述细节。`;
    } else if (n > 5 && wPer > 18) {
      msgEl.textContent = `节点数（${n}）与单站字数（${wPer} 字）双双越界：5 秒里观众顶多读完 ${caught} 站就会被迫放弃，剩下全成背景噪点。`;
    } else if (n > 5) {
      msgEl.textContent = `虽然每站字数精简，但一页塞进 ${n} 个站超出了 4±1 注意焦点上限，建议拆成两页或合并成 4–5 个大阶段。`;
    } else {
      msgEl.textContent = `节点数控制在 ${n} 个很好，但单站 ${wPer} 字依然像段落文档——砍掉修饰词压到 16 字以内，扫读立刻提速。`;
    }

    // 生成模拟投影幻灯片 SVG
    const x0 = 42;
    const x1 = 598;
    const step = (x1 - x0) / Math.max(1, n - 1);
    const cardW = Math.min(118, step - 6);
    const lineCount = Math.min(4, Math.max(1, Math.ceil(wPer / 10)));
    const fontSize = n >= 7 ? 10 : 12;

    slideEl.innerHTML = `<svg viewBox="0 0 640 310" role="img" aria-label="模拟投影时间线幻灯片">
      <rect width="640" height="310" rx="8" fill="#F4E7D3"/>
      <text x="28" y="34" fill="#1A110A" font-size="16" font-weight="700">年度核心交付里程碑（${n} 站 · ${total} 字）</text>
      <line x1="28" y1="46" x2="96" y2="46" stroke="#E1613E" stroke-width="3"/>
      <line x1="${x0}" y1="158" x2="${x1}" y2="158" stroke="#155D56" stroke-width="4.5" stroke-linecap="round"/>
      ${Array.from({ length: n }, (_, i) => {
        const cx = x0 + i * step;
        const above = i % 2 === 0;
        const boxH = 26 + lineCount * 11;
        const by = above ? 140 - boxH : 176;
        const bars = Array.from({ length: lineCount }, (_, li) =>
          `<rect x="${cx - cardW / 2 + 6}" y="${by + 20 + li * 10}" width="${Math.max(18, cardW - 14 - (li === lineCount - 1 ? 14 : 0))}" height="4.5" rx="2" fill="${wPer > 20 ? "#A33114" : "#5C4E41"}"/>`
        ).join("");
        return `<circle cx="${cx}" cy="158" r="${n >= 7 ? 7 : 9}" fill="#FFF9F0" stroke="${n > 5 ? "#BA4222" : "#155D56"}" stroke-width="3.5"/>
          <rect x="${cx - cardW / 2}" y="${by}" width="${cardW}" height="${boxH}" rx="6" fill="#FBF4E8" stroke="${n > 5 || wPer > 20 ? "#D77A5D" : "#155D56"}"/>
          <text x="${cx}" y="${by + 14}" text-anchor="middle" fill="#1A110A" font-size="${fontSize}" font-weight="700">0${i + 1} ${SAMPLE_NODES[i]}</text>
          ${bars}`;
      }).join("")}
    </svg>`;
  }

  function stopFlash() {
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
    curtainEl.hidden = true;
    timerBadge.textContent = "就绪 · 5.0s";
    flashBtn.textContent = "模拟 5 秒翻页";
  }

  function startFlash() {
    stopFlash();
    let left = 50; // 5.0s in 100ms steps
    timerBadge.textContent = "亮屏中 · 5.0s";
    flashBtn.textContent = "翻页计时中…";
    timerId = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(timerId);
        timerId = 0;
        timerBadge.textContent = "已翻页 · 0.0s";
        flashBtn.textContent = "再测 5 秒翻页";
        curtainSub.textContent = `刚才这页共 ${Number(countSlider.value)} 个节点、${Number(countSlider.value) * Number(wordsSlider.value)} 字。${caughtEl.textContent}能被稳稳扫完，其余全凭猜测。`;
        curtainEl.hidden = false;
      } else {
        timerBadge.textContent = `亮屏中 · ${(left / 10).toFixed(1)}s`;
      }
    }, 100);
  }

  countSlider.addEventListener("input", () => { stopFlash(); renderSlide(); });
  wordsSlider.addEventListener("input", () => { stopFlash(); renderSlide(); });
  blurBtn.addEventListener("click", () => {
    blurred = !blurred;
    slideEl.classList.toggle("is-blurred", blurred);
    blurBtn.classList.toggle("is-on", blurred);
    blurBtn.setAttribute("aria-pressed", String(blurred));
    blurBtn.textContent = `后排 12 米视距：${blurred ? "开" : "关"}`;
  });
  flashBtn.addEventListener("click", startFlash);
  reopenBtn.addEventListener("click", stopFlash);
  renderSlide();
}

function initHistorySection() {
  const nodes = [...document.querySelectorAll(".hist-node")];
  const svgEl = document.getElementById("hist-svg");
  const badgeEl = document.getElementById("hist-badge");
  const titleEl = document.getElementById("hist-title");
  const p1El = document.getElementById("hist-p1");
  const p2El = document.getElementById("hist-p2");

  function select(era) {
    const d = HISTORY_DATA[era];
    if (!d) return;
    svgEl.innerHTML = d.svg;
    badgeEl.textContent = d.badge;
    titleEl.textContent = d.title;
    p1El.textContent = d.p1;
    p2El.textContent = d.p2;
    nodes.forEach((b) => {
      const on = b.dataset.era === String(era);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  nodes.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("1753");
}

function initTriageSection() {
  const answers = {
    branch: "other",
    milestone: "timeline",
    metric: "other",
    curve: "other",
  };
  document.querySelectorAll(".triage-card").forEach((card) => {
    const key = card.dataset.triage;
    const ansEl = card.querySelector(".triage-ans");
    const btns = [...card.querySelectorAll(".triage-act")];
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const ok = btn.dataset.pick === answers[key];
        btns.forEach((b) => b.classList.remove("is-picked-ok", "is-picked-err"));
        btn.classList.add(ok ? "is-picked-ok" : "is-picked-err");
        ansEl.hidden = false;
        ansEl.classList.toggle("is-wrong", !ok);
      });
    });
  });
}

function initQuizSection() {
  const svgs = {
    // 方案 A：4 节点正序匀距有结论，但每站堆 3 行密字
    A: `<svg viewBox="0 0 420 236" role="img" aria-label="方案 A 幻灯片示意图">
      <rect width="420" height="236" fill="#F4E7D3"/>
      <text x="18" y="26" fill="#1A110A" font-size="13" font-weight="700">年度核心产品交付进展</text>
      <line x1="36" y1="102" x2="314" y2="102" stroke="#155D56" stroke-width="3.5"/>
      <polygon points="322,102 311,96 311,108" fill="#155D56"/>
      ${[58, 134, 210, 286].map((x, i) => `
        <circle cx="${x}" cy="102" r="7" fill="#FFF9F0" stroke="#155D56" stroke-width="3"/>
        <text x="${x}" y="86" text-anchor="middle" fill="#155D56" font-size="10.5" font-weight="700">Q${i + 1} ${["调研","原型","灰度","上线"][i]}</text>
        <rect x="${x - 32}" y="118" width="64" height="72" rx="4" fill="#FBF4E8" stroke="#D5C5AC"/>
        <line x1="${x - 25}" y1="130" x2="${x + 25}" y2="130" stroke="#4A3F35" stroke-width="2"/>
        <line x1="${x - 25}" y1="140" x2="${x + 23}" y2="140" stroke="#4A3F35" stroke-width="2"/>
        <line x1="${x - 25}" y1="150" x2="${x + 25}" y2="150" stroke="#4A3F35" stroke-width="2"/>
        <line x1="${x - 25}" y1="160" x2="${x + 21}" y2="160" stroke="#4A3F35" stroke-width="2"/>
        <line x1="${x - 25}" y1="170" x2="${x + 24}" y2="170" stroke="#4A3F35" stroke-width="2"/>
        <line x1="${x - 25}" y1="180" x2="${x + 15}" y2="180" stroke="#4A3F35" stroke-width="2"/>
      `).join("")}
      <rect x="330" y="54" width="76" height="136" rx="8" fill="#FBF4E8" stroke="#155D56" stroke-width="1.6"/>
      <circle cx="348" cy="74" r="8" fill="#E1613E"/><text x="362" y="78" fill="#1A110A" font-size="11" font-weight="700">结论</text>
      <text x="340" y="106" fill="#4A3F35" font-size="10">全年零事故</text>
      <text x="340" y="122" fill="#4A3F35" font-size="10">留存 +18%</text>
    </svg>`,
    // 方案 B（正确）：4 节点正序匀距 + 短题短交付 + 终点结论卡
    B: `<svg viewBox="0 0 420 236" role="img" aria-label="方案 B 幻灯片示意图">
      <rect width="420" height="236" fill="#F4E7D3"/>
      <text x="18" y="26" fill="#1A110A" font-size="13" font-weight="700">年度核心产品交付进展</text>
      <line x1="36" y1="108" x2="314" y2="108" stroke="#155D56" stroke-width="3.5"/>
      <polygon points="322,108 311,102 311,114" fill="#155D56"/>
      ${[58, 134, 210, 286].map((x, i) => `
        <circle cx="${x}" cy="108" r="7.5" fill="#FFF9F0" stroke="#155D56" stroke-width="3.2"/>
        <rect x="${x - 28}" y="70" width="56" height="19" rx="9" fill="#155D56"/>
        <text x="${x}" y="83" text-anchor="middle" fill="#FFF9F0" font-size="10" font-weight="700">Q${i + 1} ${["调研","原型","灰度","上线"][i]}</text>
        <text x="${x}" y="138" text-anchor="middle" fill="#1A110A" font-size="10.5" font-weight="600">${["确立边界","交互定稿","千人压测","全量发布"][i]}</text>
      `).join("")}
      <rect x="330" y="54" width="76" height="136" rx="8" fill="#FBF4E8" stroke="#155D56" stroke-width="1.6"/>
      <circle cx="348" cy="74" r="8" fill="#E1613E"/><text x="362" y="78" fill="#1A110A" font-size="11" font-weight="700">结论</text>
      <text x="340" y="106" fill="#4A3F35" font-size="10">全年零事故</text>
      <text x="340" y="122" fill="#4A3F35" font-size="10">留存 +18%</text>
    </svg>`,
    // 方案 C：把 4 项琐碎周会塞成 8 节点过载
    C: `<svg viewBox="0 0 420 236" role="img" aria-label="方案 C 幻灯片示意图">
      <rect width="420" height="236" fill="#F4E7D3"/>
      <text x="18" y="26" fill="#1A110A" font-size="13" font-weight="700">年度核心产品交付进展</text>
      <line x1="26" y1="112" x2="316" y2="112" stroke="#155D56" stroke-width="3.5"/>
      <polygon points="324,112 313,106 313,118" fill="#155D56"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 38 + i * 37;
        const up = i % 2 === 0;
        return `<circle cx="${x}" cy="112" r="5.5" fill="#FFF9F0" stroke="#155D56" stroke-width="2.6"/>
          <text x="${x}" y="${up ? 94 : 138}" text-anchor="middle" fill="#1A110A" font-size="9.5" font-weight="600">${["Q1调研","周会A","Q2原型","改图标","Q3灰度","周报B","归档C","Q4上线"][i]}</text>`;
      }).join("")}
      <rect x="330" y="54" width="76" height="136" rx="8" fill="#FBF4E8" stroke="#155D56" stroke-width="1.6"/>
      <circle cx="348" cy="74" r="8" fill="#E1613E"/><text x="362" y="78" fill="#1A110A" font-size="11" font-weight="700">结论</text>
      <text x="340" y="106" fill="#4A3F35" font-size="10">全年零事故</text>
      <text x="340" y="122" fill="#4A3F35" font-size="10">留存 +18%</text>
    </svg>`,
    // 方案 D：按重要度把时间排成 Q4 -> Q2 -> Q1 -> Q3（乱序）
    D: `<svg viewBox="0 0 420 236" role="img" aria-label="方案 D 幻灯片示意图">
      <rect width="420" height="236" fill="#F4E7D3"/>
      <text x="18" y="26" fill="#1A110A" font-size="13" font-weight="700">年度核心产品交付进展</text>
      <line x1="36" y1="108" x2="314" y2="108" stroke="#155D56" stroke-width="3.5"/>
      <polygon points="322,108 311,102 311,114" fill="#155D56"/>
      ${[58, 134, 210, 286].map((x, i) => `
        <circle cx="${x}" cy="108" r="7.5" fill="#FFF9F0" stroke="#155D56" stroke-width="3.2"/>
        <rect x="${x - 28}" y="70" width="56" height="19" rx="9" fill="#155D56"/>
        <text x="${x}" y="83" text-anchor="middle" fill="#FFF9F0" font-size="10" font-weight="700">${["Q4 上线","Q2 原型","Q1 调研","Q3 灰度"][i]}</text>
        <text x="${x}" y="138" text-anchor="middle" fill="#1A110A" font-size="10.5" font-weight="600">${["全量发布","交互定稿","确立边界","千人压测"][i]}</text>
      `).join("")}
      <rect x="330" y="54" width="76" height="136" rx="8" fill="#FBF4E8" stroke="#155D56" stroke-width="1.6"/>
      <circle cx="348" cy="74" r="8" fill="#E1613E"/><text x="362" y="78" fill="#1A110A" font-size="11" font-weight="700">结论</text>
      <text x="340" y="106" fill="#4A3F35" font-size="10">全年零事故</text>
      <text x="340" y="122" fill="#4A3F35" font-size="10">留存 +18%</text>
    </svg>`,
  };

  document.querySelectorAll("[data-quiz-svg]").forEach((host) => {
    host.innerHTML = svgs[host.dataset.quizSvg] || "";
  });

  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = document.getElementById("quiz-feedback");
  const verdict = document.getElementById("quiz-fb-verdict");
  const detail = document.getElementById("quiz-fb-detail");
  const breakdown = document.getElementById("quiz-breakdown");
  const resetBtn = document.getElementById("quiz-reset-btn");

  const NOTES = [
    "方案 A：节点数、顺序与结论都对，唯一失分点是每站塞满密密麻麻六行正文，投影时把观众拉进「读文档模式」。",
    "方案 B（最优解）：Q1→Q2→Q3→Q4 严格顺叙、4 站步幅匀称、每站一句短交付、右侧结论卡一锤定音，最适合 3 分钟汇报直接投屏。",
    "方案 C：顺序和文案长度尚可，但把周会、改图标、归档等琐碎支线塞进主轴扩成 8 站，挤爆节奏并稀释核心转折。",
    "方案 D：画面干净、结论清楚，却把时间按主观重要度排成 Q4→Q2→Q1→Q3，违背「空间位置即时间先后」的核心契约。",
  ];

  cards.forEach((c) => {
    c.addEventListener("click", () => {
      const pick = c.dataset.choice;
      const isRight = pick === "B";
      cards.forEach((x) => x.classList.remove("is-correct", "is-wrong"));
      c.classList.add(isRight ? "is-correct" : "is-wrong");
      document.querySelector('.quiz-card[data-choice="B"]').classList.add("is-correct");

      verdict.textContent = isRight ? "选对了：方案 B 最适合直接投屏" : `你选了方案 ${pick}，再仔细看它悄悄偏离的那个变量`;
      detail.textContent = isRight
        ? "四页配色和结构几乎一模一样，但只有方案 B 同时守住了「顺叙、少站、精炼、有结论」全部底线。"
        : "这四页故意采用同一套视觉模板，每错项只偏离一个变量——正确项是方案 B。对比四项差别：";
      breakdown.innerHTML = NOTES.map((t) => `<li>${t}</li>`).join("");
      fb.hidden = false;
    });
  });

  resetBtn.addEventListener("click", () => {
    cards.forEach((x) => x.classList.remove("is-correct", "is-wrong"));
    fb.hidden = true;
  });
}

function initPosterLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const lb = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const viewport = document.getElementById("lb-viewport");
  const zoomIn = document.getElementById("lb-zoom-in");
  const zoomOut = document.getElementById("lb-zoom-out");
  const zoomReset = document.getElementById("lb-reset");
  const zoomVal = document.getElementById("lb-zoom-val");
  const closeBtn = document.getElementById("lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!lbImg.src) lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    closeBtn.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zoomIn.addEventListener("click", () => { scale = Math.min(3.5, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zoomOut.addEventListener("click", () => { scale = Math.max(0.6, +(scale - 0.35).toFixed(2)); applyTransform(); });
  zoomReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.6, Math.min(3.5, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("pointerdown", (e) => {
    if (e.target === viewport) {
      close();
      return;
    }
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    viewport.classList.add("is-panning");
    try { viewport.setPointerCapture(e.pointerId); } catch {}
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endPan = () => { panning = false; viewport.classList.remove("is-panning"); };
  viewport.addEventListener("pointerup", endPan);
  viewport.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
