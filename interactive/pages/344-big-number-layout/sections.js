// 344 正文七节各自独立的交互模块（相邻两节绝不用同一种控件做同一件事）
import { pixelRatio, reducedMotion } from "../../lib/stage.js";

// =========================================================================
// 01 节：0.5 秒前注意闪现辨数挑战（真实计时快门，对比密字报告页 vs 大数字页）
// =========================================================================
export function initFlashTest() {
  const root = document.getElementById("s01-flash");
  if (!root) return;
  const stage = root.querySelector("#flash-stage");
  const modeBtns = [...root.querySelectorAll("[data-flash-mode]")];
  const runBtn = root.querySelector("#flash-run");
  const answerRow = root.querySelector("#flash-answers");
  const answerBtns = [...root.querySelectorAll("[data-flash-ans]")];
  const verdictEl = root.querySelector("#flash-verdict");
  const stateTag = root.querySelector("#flash-state-tag");

  const TRIALS = {
    dense: {
      target: "68%",
      label: "A · 常规段落报告页",
      html: `<div class="fl-dense">
        <div class="fl-dense-hd">2026 Q2 互动演示视觉效率复盘纪要</div>
        <p>本次评测覆盖三组跨部门汇报场景，重点比对项目符号页、双栏图解页与单指标强调页的现场理解速度。受试者在翻页后需立即复述核心量化指标并判断方向。</p>
        <p>在常规多段文字对照页中，即使将关键指标加粗排在第二段中段，现场观众仍需先扫描标题再逐行检索；实测复盘中，采用聚焦版式后核心数值识别率达到 <strong>68%</strong>，且减少了听众低头读屏的时间占比。</p>
        <p>后续建议在汇报开篇与转折节点精简说明句，将详细口径留给会后文档附件查阅。</p>
      </div>`,
      explainHit: "你居然在 0.5 秒内从字海里揪出了 68%！但绝大多数现场听众在这个时长里刚扫完第一行标题——文字检索属于慢速串行搜索，极易错过讲者同步口述。",
      explainMiss: "0.5 秒快门落下，绝大多数人都没来得及在密密麻麻的三段正文里找到藏在第二段末尾的「68%」。当数字和正文同字号、同明度时，视觉系统必须逐字串行扫描（Treisman, 1985）。",
    },
    big: {
      target: "72%",
      label: "B · 大数字孤立页",
      html: `<div class="fl-big">
        <div class="fl-big-num">72%</div>
        <div class="fl-big-wedge">
          <span class="fl-big-arr" aria-hidden="true">↗</span>
          <div class="fl-big-copy">
            <strong>学习效率 提升</strong>
            <span>对比纯文字大纲页 · 48 小时回忆测验（示意）</span>
          </div>
        </div>
      </div>`,
      explainHit: "不到半秒就准确锁死 72%！这就是 Treisman（1985）所述的前注意「弹出」与冯·雷斯托夫（1933）孤立效应：极端尺度与高明暗反差绕过逐字阅读，直接写入工作记忆。",
      explainMiss: "正确答案是 72%。不妨再闪一次对比感受：哪怕只有半秒，巨型骨白数字也会先于任何汉字在朱橙底场上直接「弹」进视野。",
    },
  };

  let mode = "dense";
  let timer = 0;
  let phase = "idle"; // idle | showing | ask | done

  function setPhase(next) {
    phase = next;
    stage.dataset.phase = next;
    if (next === "idle") {
      stage.innerHTML = `<div class="fl-shutter">
        <span class="fl-shutter-badge">${TRIALS[mode].label}</span>
        <p class="fl-shutter-tip">点击下方「开始 0.5 秒闪现」：画面闪现 500 毫秒后自动合闸，试试能不能一眼说出藏在里面的核心数字。</p>
      </div>`;
      answerRow.hidden = true;
      stateTag.textContent = "待快门触发";
    } else if (next === "showing") {
      stage.innerHTML = TRIALS[mode].html;
      answerRow.hidden = true;
      stateTag.textContent = reducedMotion.matches ? "静止对照（已开启减少动态效果）" : "快门开启 · 500ms";
    } else if (next === "ask") {
      stage.innerHTML = `<div class="fl-shutter fl-shutter--dark">
        <span class="fl-shutter-badge">快门已合闸</span>
        <p class="fl-shutter-tip">刚才闪过的那页幻灯片里，核心数字是多少？</p>
      </div>`;
      answerRow.hidden = false;
      stateTag.textContent = "请作答";
    } else if (next === "done") {
      stage.innerHTML = TRIALS[mode].html;
      answerRow.hidden = false;
      stateTag.textContent = `已揭晓 · 正确答案 ${TRIALS[mode].target}`;
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      clearTimeout(timer);
      mode = btn.dataset.flashMode;
      modeBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      verdictEl.textContent = "已切换样本：点击「开始 0.5 秒闪现」，亲身测试两种排版的瞬间捕获速度。";
      setPhase("idle");
    });
  });

  runBtn.addEventListener("click", () => {
    clearTimeout(timer);
    verdictEl.textContent = reducedMotion.matches
      ? "检测到「减少动态效果」，画面保持静止呈献以便直接对照扫描难度，你也可以在下方点选答案查看原理。"
      : "盯紧画面中央——500 毫秒后快门将自动遮蔽！";
    setPhase("showing");
    if (reducedMotion.matches) {
      answerRow.hidden = false;
      return;
    }
    timer = setTimeout(() => {
      setPhase("ask");
    }, 520);
  });

  answerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const picked = btn.dataset.flashAns;
      const hit = picked === TRIALS[mode].target;
      answerBtns.forEach((b) => b.classList.toggle("is-picked", b === btn));
      setPhase("done");
      verdictEl.textContent = hit ? TRIALS[mode].explainHit : TRIALS[mode].explainMiss;
    });
  });

  setPhase("idle");
}

// =========================================================================
// 02 节：演讲厅距离望远镜（2D Canvas 光学距离与字阶比模拟）
// =========================================================================
export function initDistanceScope() {
  const canvas = document.getElementById("s02-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const distBtns = [...document.querySelectorAll("[data-dist]")];
  const ratioBtns = [...document.querySelectorAll("[data-ratio]")];
  const readoutEl = document.getElementById("s02-readout");
  const badgeEl = document.getElementById("s02-badge");

  let dist = 15; // 3 | 8 | 15 | 25 米
  let ratio = 2; // 2 | 4 | 8 | 12 倍

  const DIST_META = {
    3: { label: "前排 3m", scaleF: 0.92, blur: 0, note: "近距屏幕几乎铺满视野，即使 2× 弱级差也能读清，但容易误判后排效果。" },
    8: { label: "中排 8m", scaleF: 0.72, blur: 0.5, note: "中型会议室中段：4× 以下的数字开始和普通小标题混成一团。" },
    15: { label: "后排 15m", scaleF: 0.52, blur: 1.3, note: "标准礼堂后排：字阶拉到 8×–12× 后，大数字才在微糊光学环境下稳稳独立弹出。" },
    25: { label: "大会堂 25m", scaleF: 0.36, blur: 2.3, note: "大型发布会远端：正文小字已退化为灰线，唯有 10×–12× 巨型数字和短指标还能一眼认出。" },
  };

  function render() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    const h = Math.max(220, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 暗演讲厅背景与透视地面线
    ctx.fillStyle = "#12100E";
    ctx.fillRect(0, 0, w, h);

    // 微弱演讲厅顶灯与前排剪影（仅用极简几何圆肩背影，不画五官！）
    const meta = DIST_META[dist];
    const maxSlideW = w * 0.84;
    const maxSlideH = h * 0.72;
    const baseScale = Math.min(maxSlideW / 960, maxSlideH / 540) * meta.scaleF;
    const sw = 960 * baseScale;
    const sh = 540 * baseScale;
    const sx = (w - sw) / 2;
    const sy = Math.max(24, (h - sh) * 0.42);

    // 投影幕布外发光微晕
    ctx.fillStyle = "rgba(246, 67, 22, 0.14)";
    ctx.fillRect(sx - 6, sy - 6, sw + 12, sh + 12);

    // 在幕布区域绘出大数字幻灯片（根据真实距离模拟视觉模糊）
    ctx.save();
    if (meta.blur > 0 && "filter" in ctx) {
      ctx.filter = `blur(${meta.blur}px)`;
    }
    ctx.translate(sx, sy);
    ctx.scale(baseScale, baseScale);

    // 朱橙底 + 斜切黑角
    ctx.fillStyle = "#F64316";
    ctx.fillRect(0, 0, 960, 540);

    // 按当前字阶比绘制 72%
    const bodyPx = 22;
    const heroPx = bodyPx * ratio;
    ctx.font = `900 ${heroPx}px "Outfit", sans-serif`;
    ctx.fillStyle = "#F3EADB";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("72%", 480, ratio >= 8 ? 222 : 240);

    // 斜切纯黑底楔
    ctx.beginPath();
    ctx.moveTo(0, 355);
    ctx.lineTo(960, 448);
    ctx.lineTo(960, 540);
    ctx.lineTo(0, 540);
    ctx.closePath();
    ctx.fillStyle = "#0A0B08";
    ctx.fill();

    // 底部指标与 22px 基准正文
    ctx.font = `900 30px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#F3EADB";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("↗ 学习效率 提升", 54, 384);

    ctx.font = `400 ${bodyPx}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#CFC5B6";
    ctx.fillText("对比纯文字大纲页 · 课后 48 小时回忆测验", 54, 434);
    ctx.restore();

    // 前排听众极简暗剪影（只有光滑圆头+弧肩背影，绝无五官细节）
    if (dist >= 8) {
      ctx.save();
      ctx.fillStyle = "#080706";
      const rows = dist >= 15 ? 2 : 1;
      for (let row = 0; row < rows; row++) {
        const yBase = h + 6 - row * 12;
        const count = Math.max(5, Math.floor(w / 72));
        for (let i = 0; i < count; i++) {
          const cx = ((i + 0.5 + (row % 2) * 0.35) / count) * w;
          const rad = 11 + row * 2;
          ctx.beginPath();
          ctx.arc(cx, yBase - 26, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(cx, yBase, rad * 2.1, rad * 1.4, 0, Math.PI, 0);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 左上与右上标注（窄屏自动压缩，绝不相互重叠）
    const compact = w < 420;
    ctx.font = `700 ${compact ? 11 : 12}px "Space Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = "#F3EADB";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(compact ? `${dist}m · ${ratio}×` : `VIEW ${dist}m · SCALE ${ratio}×`, 12, 12);

    const visualAngleOk = (ratio >= 8 && dist <= 25) || (ratio >= 4 && dist <= 8) || dist <= 3;
    const tagTxt = compact
      ? visualAngleOk ? "后排可辨（示意）" : "远距失焦（示意）"
      : visualAngleOk ? "后排一眼可辨（示意）" : "远距退化·难以锁焦（示意）";
    const tw = ctx.measureText(tagTxt).width + 16;
    ctx.fillStyle = visualAngleOk ? "#0F7A52" : "#B51D0E";
    ctx.fillRect(w - tw - 10, 9, tw, 22);
    ctx.fillStyle = "#FAF6EE";
    ctx.textAlign = "center";
    ctx.fillText(tagTxt, w - tw / 2 - 10, 14);

    // 同步文字读数
    const heightPct = Math.round(((22 * ratio * 0.76) / 540) * 100);
    badgeEl.textContent = `${meta.label} · 级差 ${ratio}× · 数高占屏约 ${heightPct}%`;
    badgeEl.className = `s02-badge ${visualAngleOk ? "is-ok" : "is-warn"}`;
    readoutEl.textContent = `${meta.note}（当前主数字高度占幻灯片约 ${heightPct}%，经验值建议 ≥ 28%、级差 5×–12× 以兼顾后排清晰度与留白气场。）`;
  }

  distBtns.forEach((b) => {
    b.addEventListener("click", () => {
      dist = Number(b.dataset.dist);
      distBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  ratioBtns.forEach((b) => {
    b.addEventListener("click", () => {
      ratio = Number(b.dataset.ratio);
      ratioBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  new ResizeObserver(render).observe(canvas);
  render();
}

// =========================================================================
// 03 节：口径手术开关台（4 枚可开关的口径零件 + 实时暗室幻灯片 + 听众心声）
// =========================================================================
export function initContextBuilder() {
  const root = document.getElementById("s03-builder");
  if (!root) return;
  const numEl = root.querySelector("#s03-slide-num");
  const dirEl = root.querySelector("#s03-slide-dir");
  const titleEl = root.querySelector("#s03-slide-title");
  const baseEl = root.querySelector("#s03-slide-base");
  const extraEl = root.querySelector("#s03-slide-extra");
  const thoughtEl = root.querySelector("#s03-thought");
  const statusEl = root.querySelector("#s03-status");

  const st = {
    rounded: false, // false: 72.48% | true: 72%
    hasLabel: true, // true: ↗ 学习效率 提升 | false: 空
    hasBaseline: false, // false: 只有泛泛「研究表明」 | true: 具体对照口径
    hasBloat: true, // true: 塞入背景长段 | false: 裁清
  };

  const switches = {
    rounded: root.querySelector('[data-ctx="rounded"]'),
    hasLabel: root.querySelector('[data-ctx="hasLabel"]'),
    hasBaseline: root.querySelector('[data-ctx="hasBaseline"]'),
    hasBloat: root.querySelector('[data-ctx="hasBloat"]'),
  };

  function sync() {
    numEl.textContent = st.rounded ? "72%" : "72.48%";
    numEl.classList.toggle("is-long", !st.rounded);

    dirEl.hidden = !st.hasLabel;
    titleEl.textContent = st.hasLabel ? "学习效率 提升" : "（缺少指标名与方向）";
    titleEl.classList.toggle("is-missing", !st.hasLabel);

    baseEl.textContent = st.hasBaseline
      ? "对比纯文字大纲页 · 课后 48 小时回忆测验（320 人对照样本）"
      : "研究表明，采用大数字可提升信息传达与留存。";
    baseEl.classList.toggle("is-vague", !st.hasBaseline);

    extraEl.hidden = !st.hasBloat;

    Object.entries(switches).forEach(([k, btn]) => {
      if (!btn) return;
      const isGood = k === "hasBloat" ? !st[k] : st[k];
      btn.setAttribute("aria-pressed", String(st[k]));
      btn.classList.toggle("is-on", st[k]);
      btn.classList.toggle("is-good", isGood);
      const sub = btn.querySelector("span");
      if (sub) {
        if (k === "rounded") sub.textContent = st.rounded ? "已取整为 72%（清晰）" : "当前 72.48%（冗余小数）";
        else if (k === "hasLabel") sub.textContent = st.hasLabel ? "已配「↗ 学习效率 提升」" : "已隐藏（空降孤数）";
        else if (k === "hasBaseline") sub.textContent = st.hasBaseline ? "已补对照组与 320 人样本" : "当前仅泛写「研究表明」";
        else if (k === "hasBloat") sub.textContent = st.hasBloat ? "当前塞入 68 字背景（干扰）" : "已裁清背景长段（利落）";
      }
    });

    const issues = [];
    if (!st.hasLabel) issues.push("「72% 是什么？成本降了还是流失涨了？」");
    if (!st.rounded) issues.push("「.48% 的零头记不住，反而把字号挤小了。」");
    if (!st.hasBaseline) issues.push("「只说『研究表明』，到底比什么提升了、测了多少人？」");
    if (st.hasBloat) issues.push("「底下那段小字好长，我先看完再听你讲……」");

    if (issues.length === 0) {
      statusEl.textContent = "口径完整 · 可信且耐看";
      statusEl.className = "s03-status is-ok";
      thoughtEl.textContent = "听众心声：「一眼记住 72%，知道是学习效率提升、对比纯文字页且交代了样本——不用埋头读屏，直接听讲者拆解背后的原因。」";
    } else {
      statusEl.textContent = `尚有 ${issues.length} 处口径隐患`;
      statusEl.className = "s03-status is-warn";
      thoughtEl.textContent = `听众心声：${issues[0]}`;
    }
  }

  Object.entries(switches).forEach(([k, btn]) => {
    btn?.addEventListener("click", () => {
      st[k] = !st[k];
      sync();
    });
  });

  sync();
}

// =========================================================================
// 04 节：五节点学术与演进脉络轨（1933–2015，全部经公开出版物核实）
// =========================================================================
export function initLineage() {
  const root = document.getElementById("s04-lineage");
  if (!root) return;
  const btns = [...root.querySelectorAll("[data-era]")];
  const yearEl = root.querySelector("#s04-year");
  const titleEl = root.querySelector("#s04-title");
  const citeEl = root.querySelector("#s04-cite");
  const bodyEl = root.querySelector("#s04-body");
  const mapEl = root.querySelector("#s04-map");

  const ERAS = {
    1933: {
      year: "1933",
      title: "Hedwig von Restorff · 孤立效应（Isolation Effect）",
      cite: "《Über die Wirkung von Bereichsbildungen im Spurenfeld》，Psychologische Forschung，第 18 卷，299–342 页",
      body: "在柏林跟随格式塔心理学奠基人 Wolfgang Köhler 开展记忆实验时发现：在同质列表中，把某一项在形式或类别上彻底孤立出来，它的回忆率会显著高于混在同类里的条目。",
      map: "对应 344 版式：整页只留一个核心数字、清掉其他同级指标，正是在视觉场里制造「孤立项」；一旦同屏摆三四个大数，孤立效应立刻消失。",
    },
    1985: {
      year: "1985",
      title: "Anne Treisman · 前注意视觉弹出（Preattentive Pop-out）",
      cite: "《Preattentive Processing in Vision》，Computer Vision, Graphics, and Image Processing，第 31 卷第 2 期，156–177 页",
      body: "阐明人眼在进入慢速逐项阅读之前，会先在整片视野里并行捕获尺寸、明暗、颜色等基础特征差异。只要目标在尺度与明度上远高于背景干扰物，就会自动「弹出」而无需搜寻。",
      map: "对应 344 版式：巨型骨白 72% 压在炽烈朱橙底场上，尺度和明暗双双拉满，让观众在翻页半秒内先捕获数字，再落到下方短注。",
    },
    2001: {
      year: "2001",
      title: "Mautone & Mayer · 多媒体信号提示原则（Signaling Principle）",
      cite: "Journal of Educational Psychology 第 93 卷第 2 期；Richard E. Mayer《Multimedia Learning》，Cambridge University Press",
      body: "通过对照学习实验证明：在多通道演示中加入清晰的视觉组织线索，帮学习者立刻分辨「哪一块才是核心」，可以大幅削减无关认知负荷，提升理解与迁移表现。",
      map: "对应 344 版式：↗ 方向箭、底沿斜切黑楔与单条细横线承担的就是视觉信号功能——先钉核心数，再引视线读口径。",
    },
    2008: {
      year: "2008",
      title: "Nancy Duarte & Garr Reynolds · 现代演示「去要点列表」浪潮",
      cite: "《slide:ology》（O'Reilly Media，2008）与《Presentation Zen》（New Riders，2008）",
      body: "两位现代演示设计师同年出版的代表作，不约而同把矛头指向密密麻麻的项目符号模板，提倡「一页只讲一件事」、扩大留白、把幻灯片从「提词文档」还原成服务演讲节奏的视觉舞台。",
      map: "对应 344 版式：把原本埋在 5 条项目符号里的核心数据直接抬成整页主角，辅助论证全部交还给讲者口述。",
    },
    2015: {
      year: "2015",
      title: "Cole Nussbaumer Knaflic · 简明大数优先于勉强画图",
      cite: "《Storytelling with Data》，John Wiley & Sons，第 2 章 Choosing an Effective Visual",
      body: "在数据叙事手册中明确把「Simple Text（超大字号单一数字 + 简短语境句）」列为首个推荐选项：当你只需要传达一两个关键数值时，硬画柱状图或表格反而会增加解码阻力、稀释冲击力。",
      map: "对应 344 版式：明确划清了 344（单数强冲击）与 349（多点看趋势分布）的边界——数字少于两个，用大数字页胜过一切迷你图表。",
    },
  };

  function select(key) {
    const d = ERAS[key];
    if (!d) return;
    btns.forEach((b) => {
      const on = b.dataset.era === String(key);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    yearEl.textContent = d.year;
    titleEl.textContent = d.title;
    citeEl.textContent = d.cite;
    bodyEl.textContent = d.body;
    mapEl.textContent = d.map;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("1933");
}

// =========================================================================
// 05 节：五页演播节奏排片器（连续大数疲劳仪）
// =========================================================================
export function initDeckSequencer() {
  const root = document.getElementById("s05-seq");
  if (!root) return;
  const slots = [...root.querySelectorAll("[data-slot]")];
  const curveEl = root.querySelector("#s05-curve");
  const verdictEl = root.querySelector("#s05-verdict");
  const tagEl = root.querySelector("#s05-tag");
  const presetBoomBtn = root.querySelector("#s05-preset-boom");
  const presetPacedBtn = root.querySelector("#s05-preset-paced");

  // 初始设为「5 连发大数轰炸」反例，让用户亲手点掉多余大数字页体验孤立效应回归！
  const deck = [true, true, true, true, true];
  const BIG_DATA = [
    { num: "72%", cap: "效率提升" },
    { num: "3.4×", cap: "留存翻倍" },
    { num: "184万", cap: "累计触达" },
    { num: "98%", cap: "好评率" },
    { num: "14s", cap: "响应缩短" },
  ];
  const CALM_DATA = [
    { code: "346", name: "时间线页", cap: "交代背景演进" },
    { code: "349", name: "数据图表页", cap: "展开趋势与分布" },
    { code: "347", name: "流程页", cap: "拆解因果机制" },
    { code: "348", name: "矩阵页", cap: "比较方案取舍" },
    { code: "345", name: "引语页", cap: "用观点收口共鸣" },
  ];

  function render() {
    let streak = 0;
    let maxStreak = 0;
    const bigCount = deck.filter(Boolean).length;
    const heights = [];

    deck.forEach((isBig, i) => {
      const btn = slots[i];
      btn.setAttribute("aria-pressed", String(isBig));
      btn.classList.toggle("is-big", isBig);
      btn.classList.toggle("is-calm", !isBig);
      if (isBig) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
        // 示意孤立冲击力：单发最高，连续第 2/3/4/5 页快速衰减
        const impact = Math.max(18, Math.round(96 * Math.pow(0.62, streak - 1) - Math.max(0, bigCount - 2) * 8));
        heights.push({ impact, isBig: true });
        btn.innerHTML = `<span class="seq-idx">P0${i + 1} · 344 大数字</span><strong class="seq-num">${BIG_DATA[i].num}</strong><span class="seq-cap">${BIG_DATA[i].cap}</span><span class="seq-hint">点切过渡页</span>`;
      } else {
        streak = 0;
        heights.push({ impact: 34, isBig: false });
        btn.innerHTML = `<span class="seq-idx">P0${i + 1} · ${CALM_DATA[i].code} ${CALM_DATA[i].name}</span><span class="seq-lines" aria-hidden="true"><i></i><i></i><i></i></span><span class="seq-cap">${CALM_DATA[i].cap}</span><span class="seq-hint">点切大数字页</span>`;
      }
    });

    // 绘制 5 柱孤立效应曲线柱状示意 SVG
    const svgW = 500;
    const svgH = 92;
    const step = svgW / 5;
    const pts = heights.map((h, i) => `${Math.round(i * step + step / 2)},${Math.round(svgH - 12 - h.impact * 0.72)}`).join(" ");
    const dots = heights
      .map((h, i) => {
        const cx = Math.round(i * step + step / 2);
        const cy = Math.round(svgH - 12 - h.impact * 0.72);
        const fill = h.isBig ? (h.impact >= 72 ? "#0F7A52" : "#F64316") : "#8D8375";
        return `<circle cx="${cx}" cy="${cy}" r="${h.isBig ? 6 : 4}" fill="${fill}" stroke="#FAF6EE" stroke-width="2" />`;
      })
      .join("");
    curveEl.innerHTML = `<svg viewBox="0 0 ${svgW} ${svgH}" role="img" aria-label="五页演播孤立冲击力示意曲线">
      <line x1="0" y1="${svgH - 12}" x2="${svgW}" y2="${svgH - 12}" stroke="#D8CBB8" stroke-width="1" />
      <polyline points="${pts}" fill="none" stroke="#161412" stroke-width="2.5" stroke-linejoin="miter" />
      ${dots}
    </svg>`;

    if (bigCount === 0) {
      tagEl.textContent = "全篇平铺 · 缺少重音";
      tagEl.className = "s05-tag is-warn";
      verdictEl.textContent = "5 页全是常规叙事页，逻辑平稳但缺少瞬间记忆锚点——试着在关键转折（如第 2 或第 4 页）插入 1 张大数字页作为重音。";
    } else if (maxStreak >= 3 || bigCount >= 4) {
      tagEl.textContent = `连发 ${maxStreak} 页 · 孤立效应崩溃（示意）`;
      tagEl.className = "s05-tag is-bad";
      verdictEl.textContent = "连续多页全是大数字，等于「处处是重点 = 到处没重点」。冯·雷斯托夫孤立效应需要平缓页做背景衬托；轰炸到第 3 页起观众就进入麻木状态。点选其中几张切成过渡页试试。";
    } else if (maxStreak === 2) {
      tagEl.textContent = "相邻连发 · 冲击略折损（示意）";
      tagEl.className = "s05-tag is-warn";
      verdictEl.textContent = "两页大数字紧挨着翻过去，后一页的震撼感会明显弱于前一页。中间隔开 1–2 页图表、流程或背景页，重音效果更干脆。";
    } else {
      tagEl.textContent = `张弛有度 · ${bigCount} 枚重音生效（示意）`;
      tagEl.className = "s05-tag is-ok";
      verdictEl.textContent = `5 页里只安排了 ${bigCount} 张不相邻的大数字页，前后有图表/流程/引语页铺垫与缓冲。每次翻到大数字页都能重新触发视觉弹出，成为整场汇报最容易被带走的记忆点。`;
    }
  }

  slots.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      deck[i] = !deck[i];
      render();
    });
  });

  presetBoomBtn?.addEventListener("click", () => {
    for (let i = 0; i < 5; i++) deck[i] = true;
    render();
  });
  presetPacedBtn?.addEventListener("click", () => {
    deck[0] = false;
    deck[1] = true;
    deck[2] = false;
    deck[3] = false;
    deck[4] = true;
    render();
  });

  render();
}

// =========================================================================
// 06 节：四选一单变量考题（中性标号 A/B/C/D，四稿仅各差一个核心变量）
// =========================================================================
export function initQuiz() {
  const root = document.getElementById("s06-quiz");
  if (!root) return;
  const opts = [...root.querySelectorAll("[data-quiz]")];
  const feedbackEl = root.querySelector("#s06-feedback");

  const FEEDBACK = {
    A: {
      ok: false,
      title: "方案 A · 多数字争宠（失守变量：数字数量）",
      body: "版式配色和口径都没问题，但把「54%」「+23pt」「1.8万」三个同等大小的数字平排在一屏里，观众翻页瞬间必须比较三个数、失去单一焦点。其余两个辅助数字应当降为下方基线短注，而非与主角平起平坐。",
    },
    B: {
      ok: false,
      title: "方案 B · 空降孤数（失守变量：口径说明）",
      body: "54% 的尺度与反差都非常干脆，但底部只写了「核心数据表现显著提升」，既没写指标名称也没给旧版 31% 的对比基线。后排高管看完第一反应不是震撼，而是追问：「54% 是什么？原来是多少？」",
    },
    C: {
      ok: true,
      title: "方案 C · 回答正确！四要素全部成立",
      body: "整页只孤立唯一主角「54%」（9.5× 大级差、高明度反差），底部斜切黑区用「↗ 新用户次日留存」一语锚定指标与方向，细线下用 19 字交代「较旧版 31% 提升 23 个百分点 · 30 天样本 1.8 万」——既有一眼入魂的冲击力，又经得起追问。",
    },
    D: {
      ok: false,
      title: "方案 D · 级差过平（失守变量：字阶对比）",
      body: "数字数量、指标和基线口径都与正确稿完全相同，但主数字被压到只有正文的 2.0×，和普通简报段落混在一起。既无法在 15 米后排一眼认清，也失去了大数字版式建立瞬间焦点的核心价值。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.quiz;
      const fb = FEEDBACK[key];
      opts.forEach((b) => {
        const isMe = b === btn;
        const isCorrect = b.dataset.quiz === "C";
        b.classList.toggle("is-selected", isMe);
        b.classList.toggle("is-correct", isCorrect);
        b.classList.toggle("is-wrong", isMe && !fb.ok);
        b.setAttribute("aria-pressed", String(isMe));
      });
      feedbackEl.hidden = false;
      feedbackEl.className = `quiz-feedback ${fb.ok ? "is-ok" : "is-wrong"}`;
      feedbackEl.innerHTML = `<strong>${fb.title}</strong><p>${fb.body}</p>`;
    });
  });
}

// =========================================================================
// 07 节：原海报灯箱（复用 #poster.src，绝不二次内联；放大、拖动、Esc 关）
// =========================================================================
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const triggerBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("poster-lightbox");
  if (!posterImg || !dialog) return;

  const stage = dialog.querySelector("#lb-stage");
  const lbImg = dialog.querySelector("#lb-img");
  const closeBtn = dialog.querySelector("#lb-close");
  const zoomInBtn = dialog.querySelector("#lb-zoom-in");
  const zoomOutBtn = dialog.querySelector("#lb-zoom-out");
  const resetBtn = dialog.querySelector("#lb-reset");
  const zoomLabel = dialog.querySelector("#lb-zoom-label");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = false;
  let sx = 0;
  let sy = 0;
  let baseTx = 0;
  let baseTy = 0;
  let opener = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function openLightbox(fromEl) {
    opener = fromEl || triggerBtn;
    if (!lbImg.src) lbImg.src = posterImg.src;
    resetView();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeLightbox() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.style.overflow = "";
    opener?.focus();
  }

  posterImg.addEventListener("click", () => openLightbox(triggerBtn));
  triggerBtn?.addEventListener("click", () => openLightbox(triggerBtn));
  closeBtn.addEventListener("click", closeLightbox);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (dialog.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "+" || e.key === "=") {
      scale = Math.min(3.5, +(scale + 0.35).toFixed(2));
      applyTransform();
    } else if (e.key === "-") {
      scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
      if (scale <= 1) { tx = 0; ty = 0; }
      applyTransform();
    }
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(3.5, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.4).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn.addEventListener("click", resetView);

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = Math.max(0.8, Math.min(3.5, +(scale + delta).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = true;
    sx = e.clientX;
    sy = e.clientY;
    baseTx = tx;
    baseTy = ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = baseTx + (e.clientX - sx);
    ty = baseTy + (e.clientY - sy);
    applyTransform();
  });
  stage.addEventListener("pointerup", (e) => {
    drag = false;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointercancel", () => { drag = false; });
}
