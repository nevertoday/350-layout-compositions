// 298 折叠双窗格 · 第 01–07 节全部独立交互 + 原海报放大灯箱
// 相邻两节各用不同控件：
// 01 任务流步进对比 / 02 年代书签与架构剖面 / 03 可拖真实 DOM 分屏脊与设备铰链
// 04 四维策略矩阵与实时折合仿真 / 05 反例与正解切签剧场 / 06 四选一合同审阅考场 / 07 原海报缩放灯箱

export function mountSections() {
  initSec01Workflow();
  initSec02Timeline();
  initSec03SplitLab();
  initSec04MotionLab();
  initSec05AntiPatterns();
  initSec06Practice();
  initSec07PosterLightbox();
}

// =========================================================================
// 01 节：三场景任务流对比（单窗跳转 vs 常驻双栏 vs 折叠双窗格）
// =========================================================================
function initSec01Workflow() {
  const root = document.getElementById("sec01-lab");
  if (!root) return;

  const DATA = {
    mail: {
      name: "邮件回复",
      steps: [
        {
          label: "01 撰写主文",
          single: { width: 100, jumps: 0, note: "整屏写信，视野宽敞，但还没看历史往来。" },
          fixed: { width: 62, jumps: 0, note: "右侧历史附件常年占走 38%，起草区一直偏窄。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "副窗收折在背后，100% 专注起草核心回复。" },
        },
        {
          label: "02 核对报价附件",
          single: { width: 100, jumps: 2, note: "切去附件页查数字，再切回草稿；来回 2 次，容易忘掉刚写的半句。" },
          fixed: { width: 62, jumps: 0, note: "不用切页，右侧直接对照报价表。" },
          folded: { width: 66, jumps: 0, state: "展开", note: "一键展开副窗对照报价，草稿光标留在原行不动。" },
        },
        {
          label: "03 通读终稿发送",
          single: { width: 100, jumps: 4, note: "反复确认两条条款又跳 2 次，思路断成几段。" },
          fixed: { width: 62, jumps: 0, note: "不需要参考了，但右栏依然关不掉，继续分散注意力。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "合上副窗，主窗回收全幅清净校读，一气呵成发送。" },
        },
      ],
    },
    paper: {
      name: "论文精读",
      steps: [
        {
          label: "01 沉浸读正文",
          single: { width: 100, jumps: 0, note: "满屏读论文，行长舒适。" },
          fixed: { width: 64, jumps: 0, note: "右侧引文注释栏空着大半，白白挤窄正文。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "副窗合拢，正文居中通透，零侧边干扰。" },
        },
        {
          label: "02 查脚注与图表",
          single: { width: 100, jumps: 3, note: "滚到文末找参考文献 [14]，再滚回第 3 页，极易读串行。" },
          fixed: { width: 64, jumps: 0, note: "右侧直出脚注，无需翻页。" },
          folded: { width: 68, jumps: 0, state: "展开", note: "顺手拉出副窗查 [14] 与配图，正文段落停在眼皮底下。" },
        },
        {
          label: "03 继续深度阅读",
          single: { width: 100, jumps: 5, note: "每遇一个术语就要上下大滚，阅读心流频频折断。" },
          fixed: { width: 64, jumps: 0, note: "读到纯文字章节时，旁边仍留着一大块无关目录。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "一合即回全屏沉浸；刚才打开的脚注位置仍被牢牢记住。" },
        },
      ],
    },
    review: {
      name: "代码审查",
      steps: [
        {
          label: "01 通览核心函数",
          single: { width: 100, jumps: 0, note: "长代码行不换行，逻辑一眼看清。" },
          fixed: { width: 60, jumps: 0, note: "评论区常驻右侧，80 列代码被迫折行。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "副窗收拢，整段函数完整铺开零折行。" },
        },
        {
          label: "02 核对测试与评论",
          single: { width: 100, jumps: 2, note: "切到评论标签看同事质疑，再切回源码找行号。" },
          fixed: { width: 60, jumps: 0, note: "边看代码边写意见，对照顺手。" },
          folded: { width: 65, jumps: 0, state: "展开", note: "展开副窗对照行级评审记录，源码高亮行不偏位。" },
        },
        {
          label: "03 复核全文件改动",
          single: { width: 100, jumps: 4, note: "多个文件与评论页来回切换，容易漏看边界条件。" },
          fixed: { width: 60, jumps: 0, note: "主代码区始终少了一块横向空间。" },
          folded: { width: 100, jumps: 0, state: "折叠", note: "收起副窗快速过一遍全局改动，需要时单键复原。" },
        },
      ],
    },
  };

  let sceneKey = "mail";
  let stepIdx = 1;

  const sceneBtns = root.querySelectorAll("[data-wscene]");
  const stepBtns = root.querySelectorAll("[data-wstep]");

  function render() {
    const pack = DATA[sceneKey];
    const st = pack.steps[stepIdx];
    sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.wscene === sceneKey)));
    stepBtns.forEach((b, i) => {
      b.setAttribute("aria-pressed", String(i === stepIdx));
      b.textContent = pack.steps[i].label;
    });

    const map = [
      ["single", st.single],
      ["fixed", st.fixed],
      ["folded", st.folded],
    ];
    for (const [k, v] of map) {
      const bar = root.querySelector(`[data-wbar="${k}"]`);
      const metric = root.querySelector(`[data-wmetric="${k}"]`);
      const note = root.querySelector(`[data-wnote="${k}"]`);
      if (bar) bar.style.width = `${v.width}%`;
      if (metric) {
        metric.textContent =
          k === "folded"
            ? `主窗 ${v.width}% · ${v.state} · 0 跳页`
            : `主窗 ${v.width}% · 示意跳转 ${v.jumps} 次`;
      }
      if (note) note.textContent = v.note;
    }
  }

  sceneBtns.forEach((b) =>
    b.addEventListener("click", () => {
      sceneKey = b.dataset.wscene;
      render();
    })
  );
  stepBtns.forEach((b) =>
    b.addEventListener("click", () => {
      stepIdx = Number(b.dataset.wstep);
      render();
    })
  );
  render();
}

// =========================================================================
// 02 节：一页变双页的演化史（5 个权威历史节点 + 动态 SVG 解剖）
// =========================================================================
function initSec02Timeline() {
  const root = document.getElementById("sec02-timeline");
  if (!root) return;

  const ERAS = [
    {
      year: "1988–1989",
      title: "NeXTSTEP 检查器（Inspector）",
      who: "NeXT Computer · NeXTSTEP 0.8 / 1.0",
      body: "1988 年 10 月 NeXTSTEP 0.8 与 1989 年 9 月 1.0 率先普及了「检查器（Inspector）」：一个独立于主文档之外、随选中对象实时刷新属性的非模态面板。它第一次把「主窗创作」和「副窗承接属性语境」彻底拆开。",
      takeaway: "奠定主副分工：副窗随主窗当前选区联动，不打断主窗操作。",
      svg: `
        <rect x="20" y="24" width="230" height="156" rx="10" fill="#F6EBDC" stroke="#132B23" stroke-width="2"/>
        <rect x="20" y="24" width="230" height="24" rx="8" fill="#116D57"/>
        <text x="34" y="40" fill="#FBF4E6" font-size="11" font-family="DM Mono, monospace">MAIN CANVAS · DOCUMENT</text>
        <circle cx="88" cy="108" r="30" fill="#F25421"/>
        <rect x="134" y="86" width="94" height="12" rx="4" fill="#D7DAC9"/>
        <rect x="134" y="108" width="76" height="12" rx="4" fill="#D7DAC9"/>
        <rect x="134" y="130" width="84" height="12" rx="4" fill="#D7DAC9"/>
        <path d="M250 102 H286" stroke="#F25421" stroke-width="2" stroke-dasharray="5 4"/>
        <circle cx="250" cy="102" r="4" fill="#F25421"/>
        <rect x="288" y="42" width="112" height="126" rx="8" fill="#D0D5C3" stroke="#132B23" stroke-width="2"/>
        <rect x="288" y="42" width="112" height="22" rx="6" fill="#435347"/>
        <text x="300" y="57" fill="#FBF4E6" font-size="10" font-family="DM Mono, monospace">INSPECTOR</text>
        <rect x="300" y="76" width="88" height="18" rx="4" fill="#F1E7D4"/>
        <rect x="300" y="102" width="88" height="18" rx="4" fill="#F25421"/>
        <rect x="300" y="128" width="88" height="24" rx="4" fill="#F1E7D4"/>
      `,
    },
    {
      year: "1995 / 2014",
      title: "非模态与渐进披露原则",
      who: "Alan Cooper 等 · 《About Face》（首版 1995 / 第四版 2014）",
      body: "交互设计奠基著作《About Face》系统论证了「非模态（Modeless）」与「渐进披露（Progressive Disclosure）」：高频主任务应当占据舞台中央，低频但必要的辅助控件则退到可随时召出与收起的辅助区，既免于模态弹窗的强行打断，又不让满屏按钮淹没主工作区。",
      takeaway: "确立认知准则：减少模式打断，按需披露低频语境。",
      svg: `
        <rect x="26" y="28" width="368" height="148" rx="12" fill="#F6EBDC" stroke="#132B23" stroke-width="2"/>
        <rect x="44" y="46" width="210" height="112" rx="8" fill="#E6DBC6"/>
        <text x="60" y="76" fill="#132B23" font-size="13" font-weight="700">高频主任务区</text>
        <text x="60" y="98" fill="#3A5147" font-size="11">零弹窗遮挡 · 连续心流</text>
        <rect x="60" y="116" width="140" height="10" rx="4" fill="#116D57" opacity="0.28"/>
        <rect x="60" y="134" width="110" height="10" rx="4" fill="#116D57" opacity="0.18"/>
        <rect x="272" y="46" width="104" height="112" rx="8" fill="#D0D5C3" stroke="#116D57" stroke-dasharray="5 4" stroke-width="1.8"/>
        <text x="284" y="74" fill="#132B23" font-size="11" font-weight="700">按需渐进披露</text>
        <rect x="284" y="88" width="80" height="14" rx="4" fill="#F1E7D4"/>
        <rect x="284" y="110" width="80" height="14" rx="4" fill="#F1E7D4"/>
        <rect x="284" y="132" width="80" height="14" rx="4" fill="#F25421"/>
        <path d="M254 102 H272" stroke="#F25421" stroke-width="2"/>
      `,
    },
    {
      year: "2010",
      title: "iPad 响应式分屏与折合",
      who: "Apple · iOS 3.2 `UISplitViewController` 与 HIG",
      body: "2010 年春初代 iPad 随 iOS 3.2 推出 `UISplitViewController`，正式在消费级触控设备上确立「横屏双窗并排、竖屏副窗折入按钮弹层」的响应式规则。屏幕宽窄和横竖方向第一次自动驱动了窗格的一开一合。",
      takeaway: "写进移动规范：宽屏双栏并排，窄屏自动折合收起。",
      svg: `
        <rect x="20" y="34" width="212" height="136" rx="12" fill="#116D57" stroke="#132B23" stroke-width="2"/>
        <rect x="30" y="44" width="60" height="116" rx="6" fill="#D0D5C3"/>
        <rect x="98" y="44" width="124" height="116" rx="6" fill="#F6EBDC"/>
        <circle cx="122" cy="70" r="12" fill="#F25421"/>
        <text x="34" y="188" fill="#3A5147" font-size="10.5" font-family="DM Mono, monospace">LANDSCAPE · SPLIT</text>
        <path d="M244 102 H276" stroke="#F25421" stroke-width="2"/>
        <path d="M270 96 L278 102 L270 108" fill="none" stroke="#F25421" stroke-width="2"/>
        <rect x="290" y="20" width="108" height="160" rx="12" fill="#116D57" stroke="#132B23" stroke-width="2"/>
        <rect x="300" y="32" width="88" height="136" rx="6" fill="#F6EBDC"/>
        <rect x="306" y="38" width="24" height="12" rx="3" fill="#F25421"/>
        <rect x="306" y="58" width="76" height="46" rx="4" fill="#E6DBC6"/>
        <text x="290" y="196" fill="#3A5147" font-size="10.5" font-family="DM Mono, monospace">PORTRAIT · FOLDED</text>
      `,
    },
    {
      year: "2020",
      title: "物理折轴与 W3C 视口分段",
      who: "Microsoft Surface Duo & W3C Media Queries Level 5",
      body: "2020 年双屏与折叠手机进入量产，Microsoft 归纳出「伴随窗格（Companion Pane）」与「双页（Two-Page）」模式；同年 3 月 W3C 在 Media Queries Level 5 首稿中引入 `horizontal-viewport-segments` 与 `env(viewport-segment-width)`（持续演进至 2026 年草案），让网页能精准感知硬件折痕并绕开铰链排版。",
      takeaway: "硬件与标准合流：中轴从软件分割线升级为可查询的物理折轴。",
      svg: `
        <rect x="32" y="28" width="160" height="148" rx="10" fill="#F6EBDC" stroke="#132B23" stroke-width="2"/>
        <rect x="228" y="28" width="160" height="148" rx="10" fill="#D0D5C3" stroke="#132B23" stroke-width="2"/>
        <rect x="196" y="24" width="28" height="156" rx="4" fill="#0B3F33"/>
        <line x1="210" y1="20" x2="210" y2="184" stroke="#FBF4E6" stroke-width="1.8" stroke-dasharray="5 4"/>
        <circle cx="210" cy="20" r="4" fill="#116D57" stroke="#FBF4E6" stroke-width="1.5"/>
        <circle cx="210" cy="184" r="4" fill="#116D57" stroke="#FBF4E6" stroke-width="1.5"/>
        <text x="52" y="64" fill="#132B23" font-size="11" font-family="DM Mono, monospace">segment(0, 0)</text>
        <text x="246" y="64" fill="#132B23" font-size="11" font-family="DM Mono, monospace">segment(1, 0)</text>
        <rect x="52" y="82" width="120" height="72" rx="6" fill="#E6DBC6"/>
        <rect x="246" y="82" width="120" height="28" rx="6" fill="#F1E7D4"/>
        <rect x="246" y="120" width="120" height="34" rx="6" fill="#F25421"/>
      `,
    },
    {
      year: "2021–2024",
      title: "Material Design 3 辅助窗格规范",
      who: "Google · Material Design 3 Canonical Layouts",
      body: "Google 在 Material Design 3 中将多窗格收敛为两大标准布局：父子浏览走「列表-详情（List-Detail）」，而围绕核心内容提供批注、参数与播放队列的场景则明确命名为「辅助窗格（Supporting Pane）」——大屏并排（辅助区推荐约 360dp 宽）、中小屏收折或下沉。",
      takeaway: "形成跨端定式：主次分工、断点收折与状态保留成标准件。",
      svg: `
        <rect x="24" y="26" width="372" height="152" rx="12" fill="#116D57"/>
        <rect x="36" y="38" width="232" height="128" rx="10" fill="#F6EBDC"/>
        <rect x="280" y="38" width="104" height="128" rx="10" fill="#D0D5C3"/>
        <text x="52" y="64" fill="#132B23" font-size="12" font-weight="700">Primary Focus Pane</text>
        <rect x="52" y="78" width="198" height="72" rx="6" fill="#E6DBC6"/>
        <text x="292" y="62" fill="#132B23" font-size="10.5" font-weight="700">Supporting</text>
        <text x="292" y="76" fill="#3A5147" font-size="10" font-family="DM Mono, monospace">~360dp</text>
        <rect x="292" y="88" width="80" height="28" rx="5" fill="#F1E7D4"/>
        <rect x="292" y="124" width="80" height="28" rx="5" fill="#F1E7D4"/>
        <circle cx="274" cy="102" r="9" fill="#F25421"/>
        <text x="274" y="106" fill="#FBF4E6" font-size="10" text-anchor="middle">↔</text>
      `,
    },
  ];

  let idx = 0;
  const tabs = root.querySelectorAll("[data-era]");
  const yearEl = root.querySelector("#era-year");
  const titleEl = root.querySelector("#era-title");
  const whoEl = root.querySelector("#era-who");
  const bodyEl = root.querySelector("#era-body");
  const takeawayEl = root.querySelector("#era-takeaway");
  const svgEl = root.querySelector("#era-svg");

  function render() {
    const e = ERAS[idx];
    tabs.forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
    yearEl.textContent = e.year;
    titleEl.textContent = e.title;
    whoEl.textContent = e.who;
    bodyEl.textContent = e.body;
    takeawayEl.textContent = e.takeaway;
    svgEl.innerHTML = e.svg;
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      idx = Number(b.dataset.era);
      render();
    })
  );
  render();
}

// =========================================================================
// 03 节：真实可拖 DOM 分屏脊 + 四设备与物理折缝实验室 + 实时 CSS 输出
// =========================================================================
function initSec03SplitLab() {
  const root = document.getElementById("sec03-lab");
  if (!root) return;

  const DEVICES = {
    desktop: { label: "1440px 桌面", width: 1440, hinge: 0, defaultSub: 32, note: "宽屏充足，副窗推荐经验值 26%–38%（约 320–420px），保持主窗单行 35–48 字舒适读距。" },
    tablet: { label: "1024px 平板", width: 1024, hinge: 0, defaultSub: 34, note: "横屏平板仍可双窗并排；若竖屏缩至 768px 以下，副窗应改为浮层或折起。" },
    foldable: { label: "880px 折叠屏", width: 880, hinge: 28, defaultSub: 48, note: "开启 28px 物理折缝时，主副窗须各自避让中轴，可用 CSS Viewport Segments 精准贴齐两块屏幕。" },
    phone: { label: "390px 手机", width: 390, hinge: 0, defaultSub: 38, note: "390px 窄屏强开左右双窗会让两栏双双挤碎，实战中应默认收折副窗或转底部抽屉。" },
  };

  let devKey = "foldable";
  let subPct = DEVICES[devKey].defaultSub;
  let folded = false;

  const devBtns = root.querySelectorAll("[data-dev]");
  const foldBtn = root.querySelector("#s3-toggle-fold");
  const frame = root.querySelector("#s3-frame");
  const mainPane = root.querySelector("#s3-main");
  const subPane = root.querySelector("#s3-sub");
  const handle = root.querySelector("#s3-handle");
  const verdictEl = root.querySelector("#s3-verdict");
  const metricsEl = root.querySelector("#s3-metrics");
  const cssEl = root.querySelector("#s3-css");

  function render() {
    const dev = DEVICES[devKey];
    devBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dev === devKey)));
    foldBtn.setAttribute("aria-pressed", String(folded));
    foldBtn.textContent = folded ? "展开副窗（OPEN）" : "折叠副窗（FOLDED）";

    frame.dataset.device = devKey;
    frame.dataset.folded = String(folded);

    const effSub = folded ? 0 : subPct;
    const effMain = 100 - effSub;
    const usable = dev.width - dev.hinge;
    const mainPx = Math.round((usable * effMain) / 100);
    const subPx = folded ? 0 : Math.round((usable * effSub) / 100);
    const lineChars = Math.max(8, Math.round((mainPx - 48) / 16));

    if (folded) {
      mainPane.style.flex = "1 1 100%";
      subPane.style.flex = "0 0 0%";
      subPane.setAttribute("aria-hidden", "true");
    } else {
      mainPane.style.flex = `0 0 calc(${effMain}% - ${dev.hinge ? 14 : 6}px)`;
      subPane.style.flex = `0 0 calc(${effSub}% - ${dev.hinge ? 14 : 6}px)`;
      subPane.removeAttribute("aria-hidden");
    }
    handle.setAttribute("aria-valuenow", String(Math.round(effSub)));

    // 单真源判断
    let statusText = "";
    let statusKind = "ok";
    if (folded) {
      statusText = `已折叠：主窗独占 ${mainPx}px（每行约 ${lineChars} 字），回收 +${subPct}% 空间，右缘留出唤回耳签。`;
    } else if (dev.width <= 420) {
      statusKind = "warn";
      statusText = `窄屏警报：${dev.width}px 下强行 ${effMain}:${effSub} 分屏，主窗仅 ${mainPx}px（约 ${lineChars} 字/行），副窗仅 ${subPx}px。应点击上方折叠收起。`;
    } else if (dev.hinge > 0 && Math.abs(effSub - 50) > 6) {
      statusKind = "warn";
      statusText = `偏离物理折缝：折叠屏物理铰链在 50% 中线，当前分割线在 ${effMain}%，导致部分内容跨过中央 28px 折痕。拖回 50:50 对齐折缝，或一键折叠单屏使用。`;
    } else if (dev.hinge === 0 && effSub >= 45) {
      statusKind = "warn";
      statusText = `副窗偏宽（${effSub}%）：副窗已接近或超过主窗，视觉重心右倾。单屏经验区间建议主窗 62%–75%、副窗 25%–38%。`;
    } else if (effSub < 22) {
      statusKind = "warn";
      statusText = `副窗过窄（${effSub}% · ${subPx}px）：补充信息被迫碎成短词，不如拉宽到 26% 以上或直接折叠收起。`;
    } else {
      statusText = dev.hinge > 0
        ? `对齐物理折缝：左右窗格各落一侧屏幕（主 ${mainPx}px / 副 ${subPx}px），中轴 28px 折痕零文字遮挡。`
        : `主次稳妥：主窗 ${effMain}%（${mainPx}px，约 ${lineChars} 字/行）领衔，副窗 ${effSub}%（${subPx}px）清爽承托。`;
    }

    verdictEl.dataset.state = statusKind;
    verdictEl.textContent = statusText;
    metricsEl.textContent = `设备 ${dev.width}px · 折缝 ${dev.hinge}px · 主窗 ${mainPx}px (${effMain}%) · 副窗 ${subPx}px (${effSub}%)`;

    if (dev.hinge > 0 && !folded) {
      cssEl.textContent = `@media (horizontal-viewport-segments: 2) {\n  .dual-pane {\n    display: grid;\n    grid-template-columns:\n      env(viewport-segment-width 0 0)\n      env(viewport-segment-width 1 0);\n    column-gap: calc(\n      env(viewport-segment-left 1 0) -\n      env(viewport-segment-right 0 0)\n    );\n  }\n}`;
    } else if (folded) {
      cssEl.textContent = `.dual-pane[data-folded="true"] {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 0px;\n}\n.dual-pane[data-folded="true"] .sub-pane {\n  visibility: hidden; /* 保留 DOM 与滚动位 */\n}`;
    } else {
      cssEl.textContent = `.dual-pane {\n  display: grid;\n  grid-template-columns:\n    minmax(0, ${effMain}fr)\n    minmax(240px, ${effSub}fr);\n  gap: 16px;\n}\n@media (max-width: 720px) {\n  .dual-pane { grid-template-columns: 1fr; }\n}`;
    }
  }

  devBtns.forEach((b) =>
    b.addEventListener("click", () => {
      devKey = b.dataset.dev;
      subPct = DEVICES[devKey].defaultSub;
      folded = false;
      render();
    })
  );

  foldBtn.addEventListener("click", () => {
    folded = !folded;
    render();
  });

  // 拖拽真实分割条（window 级监听，兼顾鼠标、触控与快速甩拖）
  let dragging = false;
  let dragPointerId = null;
  handle.addEventListener("pointerdown", (e) => {
    if (folded) return;
    dragging = true;
    dragPointerId = e.pointerId;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging || (dragPointerId != null && e.pointerId !== dragPointerId)) return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width) return;
    const rel = (e.clientX - rect.left) / rect.width;
    subPct = Math.round(Math.max(16, Math.min(58, (1 - rel) * 100)));
    render();
  });
  const stopDrag = (e) => {
    if (!dragging || (dragPointerId != null && e.pointerId !== dragPointerId)) return;
    dragging = false;
    dragPointerId = null;
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {}
  };
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  handle.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      folded = false;
      subPct = Math.min(58, subPct + 4);
      render();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      folded = false;
      subPct = Math.max(16, subPct - 4);
      render();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      folded = !folded;
      render();
    }
  });

  render();
}

// =========================================================================
// 04 节：展开与折叠的四种动线策略矩阵 + 实测「折合→重开」仿真器
// =========================================================================
function initSec04MotionLab() {
  const root = document.getElementById("sec04-lab");
  if (!root) return;

  const cfg = {
    mode: "push", // push | overlay
    rail: "tab", // tab | none
    memory: "keep", // keep | reset
    folded: false,
    picked: 2, // 副窗已定位条目 1..3
    cycleCount: 0,
  };

  const simBox = root.querySelector("#s4-sim");
  const simMain = root.querySelector("#s4-main");
  const simSub = root.querySelector("#s4-sub");
  const simTab = root.querySelector("#s4-edge-tab");
  const runBtn = root.querySelector("#s4-run");
  const logEl = root.querySelector("#s4-log");
  const subRows = root.querySelectorAll("[data-s4row]");

  function updateButtons() {
    root.querySelectorAll("[data-s4opt]").forEach((btn) => {
      const [k, v] = btn.dataset.s4opt.split(":");
      btn.setAttribute("aria-pressed", String(cfg[k] === v));
    });
  }

  function render() {
    updateButtons();
    simBox.dataset.mode = cfg.mode;
    simBox.dataset.folded = String(cfg.folded);
    simBox.dataset.rail = cfg.rail;

    subRows.forEach((r) => r.classList.toggle("is-picked", Number(r.dataset.s4row) === cfg.picked));
    simTab.hidden = !(cfg.folded && cfg.rail === "tab");
    runBtn.textContent = cfg.folded ? "重新展开副窗（检验记忆）" : "折叠副窗（测试动线）";

    const lines = [];
    if (cfg.mode === "push") {
      lines.push("推开重排（Push）：展开时主窗让出宽度，双方零遮挡，适合长时间并排对照，但文字会轻微重排。");
    } else {
      lines.push("浮层覆盖（Overlay）：副窗叠在主窗之上，主窗文字完全不跳动，适合短时速查，但会挡住主窗右缘。");
    }
    if (cfg.rail === "none" && cfg.folded) {
      lines.push("⚠ 彻底隐藏无折边耳签：用户合上后在画面里找不到唤回入口，只能凭记忆摸菜单。");
    } else if (cfg.rail === "tab") {
      lines.push("留出折边耳签：折叠后右缘保留 14px 淡青边与唤回标，随时一触即开。");
    }
    if (cfg.memory === "reset" && cfg.cycleCount > 0 && !cfg.folded) {
      lines.push("× 刚才折叠采用了「卸载清零」，原本选中的批注 #2 已被重置回顶部 #1，思路被迫中断。");
    } else if (cfg.memory === "keep") {
      lines.push(`✓ 情境保留生效：无论折合几次，副窗仍稳稳停在「批注 #${cfg.picked}」。`);
    } else {
      lines.push("当前设为「卸载清零」：试着先点下方折叠，再重新展开，观察选中态是否丢失。");
    }
    logEl.textContent = lines.join(" ");
  }

  root.querySelectorAll("[data-s4opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [k, v] = btn.dataset.s4opt.split(":");
      cfg[k] = v;
      render();
    });
  });

  subRows.forEach((r) => {
    r.addEventListener("click", () => {
      cfg.picked = Number(r.dataset.s4row);
      render();
    });
  });

  function toggleFold() {
    cfg.folded = !cfg.folded;
    if (cfg.folded) {
      cfg.cycleCount += 1;
      if (cfg.memory === "reset") cfg.picked = 1;
    }
    render();
  }

  runBtn.addEventListener("click", toggleFold);
  simTab.addEventListener("click", toggleFold);
  render();
}

// =========================================================================
// 05 节：什么时候别用它（四幕反例与正解切换剧场）
// =========================================================================
function initSec05AntiPatterns() {
  const root = document.getElementById("sec05-anti");
  if (!root) return;

  const CASES = [
    {
      key: "checkout",
      tab: "单线程结账",
      badTitle: "反例：结账页硬加可折叠侧栏",
      badBody: "用户只想按步骤填地址、选支付、完成付款，没有反复对照的副线资料。多余的折叠开关只会在关键转化路径上制造分心和误点。",
      goodTitle: "改用：纯净单栏递进流",
      goodBody: "去掉可折副窗，用居中单栏顺序推进，费用明细直接紧贴确认按钮上方，减少一次多余开关动作。",
      badSvg: `<rect x="16" y="16" width="210" height="128" rx="8" fill="#F6EBDC" stroke="#B82914" stroke-width="1.8"/><rect x="234" y="16" width="110" height="128" rx="8" fill="#D0D5C3" stroke="#B82914" stroke-dasharray="5 4" stroke-width="1.8"/><text x="30" y="42" fill="#132B23" font-size="11" font-weight="700">收货与支付</text><rect x="30" y="54" width="160" height="18" rx="4" fill="#E6DBC6"/><rect x="30" y="80" width="160" height="18" rx="4" fill="#E6DBC6"/><rect x="30" y="110" width="90" height="22" rx="5" fill="#F25421"/><text x="246" y="44" fill="#B82914" font-size="10.5" font-weight="700">空洞侧栏</text><text x="246" y="64" fill="#4B6156" font-size="10">无辅助任务</text><text x="246" y="82" fill="#4B6156" font-size="10">徒增开关干扰</text>`,
      goodSvg: `<rect x="78" y="16" width="204" height="128" rx="8" fill="#F6EBDC" stroke="#116D57" stroke-width="2"/><text x="94" y="40" fill="#132B23" font-size="11" font-weight="700">单栏顺序结账 · 零分心</text><rect x="94" y="52" width="172" height="16" rx="4" fill="#E6DBC6"/><rect x="94" y="76" width="172" height="16" rx="4" fill="#E6DBC6"/><rect x="94" y="102" width="172" height="26" rx="5" fill="#116D57"/><text x="180" y="119" fill="#FBF4E6" font-size="11" text-anchor="middle">确认付款 ¥298</text>`,
    },
    {
      key: "diff",
      tab: "双语 / Diff 精校",
      badTitle: "反例：强同步比对塞进可折副窗",
      badBody: "逐句校对译文或代码 Diff 时，左右两栏权重完全相等，缺了任何一边都无法判断对错。把译文塞进窄副窗还经常折起，反而让双栏失衡。",
      goodTitle: "改用：50:50 等宽联动分屏",
      goodBody: "取消主副高下之分，用等宽双栏并同步滚动行号；两面始终平权同显。",
      badSvg: `<rect x="16" y="16" width="242" height="128" rx="8" fill="#F6EBDC" stroke="#B82914" stroke-width="1.8"/><rect x="266" y="16" width="78" height="128" rx="8" fill="#D0D5C3" stroke="#B82914" stroke-width="1.8"/><text x="30" y="42" fill="#132B23" font-size="11" font-weight="700">原文（75%）</text><rect x="30" y="56" width="210" height="10" rx="3" fill="#E6DBC6"/><rect x="30" y="76" width="210" height="10" rx="3" fill="#E6DBC6"/><text x="274" y="42" fill="#B82914" font-size="10" font-weight="700">译文挤扁</text><rect x="274" y="56" width="60" height="24" rx="3" fill="#F1E7D4"/><rect x="274" y="88" width="60" height="24" rx="3" fill="#F1E7D4"/>`,
      goodSvg: `<rect x="16" y="16" width="160" height="128" rx="8" fill="#F6EBDC" stroke="#116D57" stroke-width="2"/><rect x="184" y="16" width="160" height="128" rx="8" fill="#F6EBDC" stroke="#116D57" stroke-width="2"/><text x="30" y="42" fill="#132B23" font-size="11" font-weight="700">左侧原文 50%</text><text x="198" y="42" fill="#132B23" font-size="11" font-weight="700">右侧译文 50%</text><line x1="16" y1="68" x2="344" y2="68" stroke="#F25421" stroke-dasharray="4 4"/><rect x="30" y="56" width="132" height="22" rx="4" fill="#E6DBC6"/><rect x="198" y="56" width="132" height="22" rx="4" fill="#E6DBC6"/><rect x="30" y="92" width="132" height="22" rx="4" fill="#E6DBC6"/><rect x="198" y="92" width="132" height="22" rx="4" fill="#E6DBC6"/>`,
    },
    {
      key: "mobile",
      tab: "390px 窄屏硬分",
      badTitle: "反例：手机竖屏硬保左右双窗",
      badBody: "390px 屏宽拆成两列后，单列不足 170px，中文字每行只剩 8 个字，手指也极易误触邻列。",
      goodTitle: "改用：窄屏全幅主窗 + 底部抽屉",
      goodBody: "小于 720px 时主窗 100% 占宽，副窗降级为底部拉起面板或独立抽屉，按需覆盖查看。",
      badSvg: `<rect x="116" y="10" width="128" height="140" rx="12" fill="#0B3F33"/><rect x="124" y="20" width="62" height="120" rx="4" fill="#F6EBDC" stroke="#B82914" stroke-width="1.6"/><rect x="190" y="20" width="46" height="120" rx="4" fill="#D0D5C3" stroke="#B82914" stroke-width="1.6"/><text x="130" y="42" fill="#B82914" font-size="9">每行8字</text><rect x="130" y="52" width="50" height="8" rx="2" fill="#E6DBC6"/><rect x="130" y="66" width="44" height="8" rx="2" fill="#E6DBC6"/><rect x="196" y="52" width="34" height="8" rx="2" fill="#F1E7D4"/><rect x="196" y="66" width="34" height="8" rx="2" fill="#F25421"/>`,
      goodSvg: `<rect x="116" y="10" width="128" height="140" rx="12" fill="#0B3F33"/><rect x="124" y="20" width="112" height="82" rx="6" fill="#F6EBDC"/><text x="134" y="42" fill="#132B23" font-size="10" font-weight="700">主窗全宽 100%</text><rect x="134" y="52" width="92" height="8" rx="2" fill="#E6DBC6"/><rect x="134" y="66" width="84" height="8" rx="2" fill="#E6DBC6"/><rect x="124" y="108" width="112" height="32" rx="6" fill="#D0D5C3" stroke="#116D57" stroke-width="1.5"/><rect x="166" y="114" width="28" height="3" rx="1.5" fill="#116D57"/><text x="180" y="131" fill="#132B23" font-size="9.5" text-anchor="middle">上滑拉出补充抽屉</text>`,
    },
    {
      key: "required",
      tab: "副窗藏必填校验",
      badTitle: "反例：必填参数与报错藏进折叠副窗",
      badBody: "用户收起副窗专心编辑主内容，点「发布」却屡次失败——因为红字校验报错全埋在折叠起来的副窗里，眼睛根本看不到。",
      goodTitle: "改用：关键校验显式浮标 + 自动展开定位",
      goodBody: "必填项留在主窗主线；若副窗确有未完成校验，点击提交时必须在折边耳签亮标并自动弹开副窗直达出错行。",
      badSvg: `<rect x="16" y="16" width="296" height="128" rx="8" fill="#F6EBDC" stroke="#B82914" stroke-width="1.8"/><rect x="316" y="16" width="26" height="128" rx="6" fill="#D0D5C3" stroke="#B82914" stroke-width="1.6"/><text x="34" y="44" fill="#132B23" font-size="11" font-weight="700">主窗提交无响应？</text><rect x="34" y="104" width="96" height="24" rx="5" fill="#B82914"/><text x="82" y="120" fill="#FBF4E6" font-size="10.5" text-anchor="middle">提交失败 ×</text><text x="142" y="120" fill="#B82914" font-size="10">报错藏在已折叠的副窗里</text>`,
      goodSvg: `<rect x="16" y="16" width="212" height="128" rx="8" fill="#F6EBDC" stroke="#116D57" stroke-width="2"/><rect x="236" y="16" width="108" height="128" rx="8" fill="#D0D5C3" stroke="#F25421" stroke-width="2"/><text x="32" y="44" fill="#132B23" font-size="11" font-weight="700">自动弹开并定位缺项</text><rect x="32" y="104" width="96" height="24" rx="5" fill="#116D57"/><text x="80" y="120" fill="#FBF4E6" font-size="10.5" text-anchor="middle">补齐后发布</text><rect x="246" y="46" width="88" height="36" rx="5" fill="#F25421"/><text x="290" y="68" fill="#FBF4E6" font-size="10" text-anchor="middle">1 项必填待填</text>`,
    },
  ];

  let cur = 0;
  let fixedView = false;

  const tabs = root.querySelectorAll("[data-acase]");
  const toggleBtn = root.querySelector("#s5-flip");
  const titleEl = root.querySelector("#s5-title");
  const bodyEl = root.querySelector("#s5-body");
  const svgEl = root.querySelector("#s5-svg");
  const badgeEl = root.querySelector("#s5-badge");

  function render() {
    const c = CASES[cur];
    tabs.forEach((b, i) => b.setAttribute("aria-pressed", String(i === cur)));
    toggleBtn.setAttribute("aria-pressed", String(fixedView));
    toggleBtn.textContent = fixedView ? "切回误用现场" : "看正确替代方案";
    badgeEl.dataset.mode = fixedView ? "good" : "bad";
    badgeEl.textContent = fixedView ? "替代方案" : "误用反例";
    titleEl.textContent = fixedView ? c.goodTitle : c.badTitle;
    bodyEl.textContent = fixedView ? c.goodBody : c.badBody;
    svgEl.innerHTML = fixedView ? c.goodSvg : c.badSvg;
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      cur = Number(b.dataset.acase);
      fixedView = false;
      render();
    })
  );
  toggleBtn.addEventListener("click", () => {
    fixedView = !fixedView;
    render();
  });
  render();
}

// =========================================================================
// 06 节：小练习（880px 折叠屏合同审阅 4 选 1，中性标号，单变量区分）
// =========================================================================
function initSec06Practice() {
  const root = document.getElementById("sec06-practice");
  if (!root) return;

  const ANSWERS = {
    A: {
      ok: false,
      title: "方案甲差了一步：底部主操作条横跨了中央 24px 折缝",
      text: "它的主副 65:35 比重、层级克制与收折耳签都做对了，唯独把「确认签署」横跨在中间物理折轴上。在折叠屏展开态，文字与点击热区会被折痕一劈两半。再看看哪套把操作条归回主窗安全区。",
    },
    B: {
      ok: false,
      title: "方案乙差了一步：副窗占走 56% 且高饱和色块反客为主",
      text: "它避开了物理折缝，也留了收折入口，但法条注释副窗比合同正文主窗还宽（56% vs 44%），满屏炽橘块不断把视线从合同条款拽跑，违背「副窗承载、不抢占焦点」。",
    },
    C: {
      ok: true,
      title: "答对了！方案丙同时守住了主次比重、折缝避让与情境保留",
      text: "在 880px 折叠屏上，方案丙让合同主窗稳占 66%、法条副窗 34% 温和承托；所有文字与按钮均避开中央 24px 折缝；右侧附清晰收折耳签，折叠沉浸读条文后再展开，修订记录仍停在刚才那一条。",
    },
    D: {
      ok: false,
      title: "方案丁差了一步：收折后无唤回耳签，且每次重开丢失滚动位",
      text: "展开时的 68:32 比例和折缝避让都很工整，但它把收折后的折边提示彻底抹掉了，而且组件卸载重建导致重开即回顶。合同审阅需要反复一开一合，失忆与无入口会直接打断心流。",
    },
  };

  const cards = root.querySelectorAll("[data-opt]");
  const titleEl = root.querySelector("#quiz-title");
  const textEl = root.querySelector("#quiz-text");
  const boxEl = root.querySelector("#quiz-verdict");

  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const ans = ANSWERS[pick];
      root.classList.add("is-revealed");
      cards.forEach((c) => {
        const k = c.dataset.opt;
        c.setAttribute("aria-pressed", String(k === pick));
        c.classList.toggle("is-correct", k === "C");
        c.classList.toggle("is-picked-wrong", k === pick && !ans.ok);
      });
      boxEl.dataset.result = ans.ok ? "ok" : "wrong";
      titleEl.textContent = ans.title;
      textEl.textContent = ans.text;
    });
  });
}

// =========================================================================
// 07 节：原海报放大、滚轮缩放、拖拽、Esc 关闭灯箱
// =========================================================================
function initSec07PosterLightbox() {
  const trigger = document.getElementById("poster-btn");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const modalImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const resetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  if (!trigger || !posterImg || !modal || !modalImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    modalImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }

  function openModal() {
    if (!modalImg.src) modalImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      scale = Math.max(0.8, Math.min(3.2, +(scale + delta).toFixed(2)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  modalImg.addEventListener("pointerdown", (e) => {
    pan = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    modalImg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  modalImg.addEventListener("pointermove", (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    tx = e.clientX - pan.sx;
    ty = e.clientY - pan.sy;
    applyTransform();
  });
  const endPan = (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    pan = null;
    try {
      modalImg.releasePointerCapture(e.pointerId);
    } catch {}
  };
  modalImg.addEventListener("pointerup", endPan);
  modalImg.addEventListener("pointercancel", endPan);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}
