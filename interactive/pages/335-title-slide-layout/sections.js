// 335 标题幻灯片版式 — 01~07 各节独立交互组件（相邻节控件绝不重复）

import { loop, pixelRatio } from "../../lib/stage.js";

// ============================================================
// 01 四层混音台剥离开关（SVG 实时封面预览）
// ============================================================
export function initStripConsole() {
  const host = document.getElementById("strip-svg-host");
  const verdict = document.getElementById("strip-verdict");
  const btns = [...document.querySelectorAll("#strip-console .layer-sw")];
  const resetBtn = document.getElementById("strip-reset");
  if (!host || !verdict) return;

  const layers = { title: true, subtitle: true, hero: true, identity: true };

  function describeLayers() {
    const { title, subtitle, hero, identity } = layers;
    const count = [title, subtitle, hero, identity].filter(Boolean).length;
    if (count === 4) {
      return {
        tag: "满配标准型 · 4/4",
        ok: true,
        text: "四根支柱各司其职：主标题定主题、酸柠副标条交待价值主张、右侧大圆稳住画面重心、左下品牌落款建立可信度。适合对外发布会、提案与正式答辩。",
      };
    }
    if (!title) {
      return {
        tag: "核心缺席 · 失去主角",
        ok: false,
        text: "关掉「主标题」后，观众盯着大圆和副标半天也猜不出这场演讲叫什么。四根支柱里只有主标题不可替代——没有它，这就不再是标题幻灯片。",
      };
    }
    if (title && subtitle && hero && !identity) {
      return {
        tag: "个人演讲极简解 · 3/4",
        ok: true,
        text: "拿掉「品牌信息」后画面更干净！个人分享、TED 式演讲或内部熟人讨论完全可以省略机构 Logo，把 100% 的视觉预算留给观点与图形。",
      };
    }
    if (title && hero && !subtitle && !identity) {
      return {
        tag: "发布会海报解 · 2/4",
        ok: true,
        text: "只留主标题与强视觉焦点，冲击力极强，适合新品发布或全场已熟知语境的场合；若听众第一次接触你的课题，建议把一句话副标题留住。",
      };
    }
    if (title && !hero && subtitle) {
      return {
        tag: "纯排印克制解",
        ok: true,
        text: "关掉视觉焦点后，封面退成纯字体排印：清晰理性，但右侧大面积空场需要靠字号体量、色块或极佳的留白比例撑住，否则容易显得单薄。",
      };
    }
    if (count === 1 && title) {
      return {
        tag: "极端独白态 · 1/4",
        ok: true,
        text: "屏幕上只剩一个孤立主标题：全场注意力会瞬间锁死在演讲者身上，但语境与可信度完全要靠你的第一句口头开场补齐。",
      };
    }
    return {
      tag: `当前保留 ${count}/4 层`,
      ok: true,
      text: "每次关掉一层都在做减法：先守住主标题，再根据听众熟不熟你的议题、需不需要机构背书，决定保留哪几根支柱。",
    };
  }

  function render() {
    const { title, subtitle, hero, identity } = layers;
    host.innerHTML = `
      <svg viewBox="0 0 640 360" width="100%" role="img" aria-label="四层开关封面示意">
        <rect width="640" height="360" fill="#260328" />
        <rect x="26" y="20" width="588" height="316" fill="none" stroke="rgba(255,255,255,0.14)" stroke-dasharray="5 5" />
        ${
          hero
            ? `<g>
                <circle cx="468" cy="184" r="106" fill="#C2D229" />
                <text x="468" y="180" text-anchor="middle" fill="#140316" font-family="Unbounded, sans-serif" font-size="14" font-weight="700">HERO AREA</text>
                <text x="468" y="200" text-anchor="middle" fill="#140316" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="600">视觉焦点情绪锚</text>
              </g>`
            : `<g opacity="0.55">
                <circle cx="468" cy="184" r="106" fill="none" stroke="#8C6B91" stroke-width="1.5" stroke-dasharray="6 6" />
                <text x="468" y="188" text-anchor="middle" fill="#C8BACB" font-family="Noto Sans SC, sans-serif" font-size="12">视觉焦点已关闭</text>
              </g>`
        }
        ${
          title
            ? `<g>
                <path d="M40 82 L40 42 L80 42" fill="none" stroke="#C2D229" stroke-width="4" />
                <text x="52" y="96" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="42" font-weight="900">下一代零延迟</text>
                <text x="52" y="146" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="42" font-weight="900">渲染管线</text>
              </g>`
            : `<g>
                <rect x="52" y="56" width="260" height="96" fill="rgba(255,107,91,0.14)" stroke="#FF6B5B" stroke-dasharray="5 4" />
                <text x="182" y="110" text-anchor="middle" fill="#FF8C80" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="700">⚠ 主标题缺失 · 无人知晓主题</text>
              </g>`
        }
        ${
          subtitle
            ? `<g>
                <rect x="52" y="172" width="270" height="32" fill="#C2D229" />
                <text x="64" y="193" fill="#140316" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="700">一句话把复杂场景帧率推高三倍</text>
              </g>`
            : `<g opacity="0.65">
                <rect x="52" y="172" width="210" height="28" fill="none" stroke="#8C6B91" stroke-dasharray="4 4" />
                <text x="62" y="190" fill="#C8BACB" font-family="Noto Sans SC, sans-serif" font-size="11">副标题已关闭（口头补语境）</text>
              </g>`
        }
        ${
          identity
            ? `<g transform="translate(52, 286)">
                <path d="M11 11 L11 0 A11 11 0 0 0 0 11 Z" fill="#C2D229" />
                <path d="M13 11 L13 0 A11 11 0 0 1 24 11 Z" fill="#C2D229" />
                <circle cx="5.5" cy="18.5" r="5.5" fill="#C2D229" />
                <circle cx="5.5" cy="18.5" r="1.8" fill="#260328" />
                <rect x="13" y="13" width="11" height="11" fill="#C2D229" />
                <text x="34" y="11" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="600">光栅实验室</text>
                <text x="34" y="24" fill="#C2D229" font-family="DM Mono, monospace" font-size="10">RASTER LABS · 2027</text>
              </g>`
            : `<text x="52" y="306" fill="#B5A4B9" font-family="Noto Sans SC, sans-serif" font-size="11">品牌信息已隐藏（适合个人演讲）</text>`
        }
      </svg>
    `;

    const info = describeLayers();
    verdict.innerHTML = `<span class="sv-badge ${info.ok ? "is-ok" : "is-bad"}">${info.tag}</span><p>${info.text}</p>`;
    btns.forEach((b) => {
      const k = b.dataset.layer;
      const on = layers[k];
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.layer;
      layers[k] = !layers[k];
      render();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      layers.title = layers.subtitle = layers.hero = layers.identity = true;
      render();
    });
  }

  render();
}

// ============================================================
// 02 四步封面文案削减剪刀
// ============================================================
const SCISSOR_STEPS = [
  {
    chars: 78,
    sec: "11.2 秒",
    pass: false,
    diffHtml:
      '<span>关于</span><span>2027 财年第三季度</span><span>平台研发中心基础架构部</span><span>面向全终端用户推出的</span><span>「新一代零延迟图形渲染管线」</span><span>核心技术架构全面重构升级改造</span><span>立项评审与阶段性成果汇总汇报材料（内部机密 V3.2）</span>',
    note: "公文文件名的典型写法：把时间、部门、版本号、保密级别全塞进主标题。观众还没念完前半截，演讲者已经开始寒暄了。",
    slideTitle: ["关于2027财年第三季度平台研发中心", "新一代零延迟图形渲染管线重构升级", "立项评审与阶段成果汇总汇报 V3.2"],
    slideSub: "",
    titlePt: 18,
  },
  {
    chars: 41,
    sec: "5.9 秒",
    pass: false,
    diffHtml:
      '<del>关于2027财年第三季度平台研发中心基础架构部</del><span>面向全终端用户推出的</span><span>「新一代零延迟图形渲染管线」</span><span>核心技术架构全面重构升级改造方案</span><del>立项评审汇报材料 V3.2</del>',
    note: "第一刀先砍掉行政抬头与版本号：这些属于邮件附件名，不属于大屏幕。不过剩下的 41 字依然太长，字号被迫压在 26pt。",
    slideTitle: ["面向全终端用户推出的", "新一代零延迟图形渲染管线", "核心架构重构升级方案"],
    slideSub: "",
    titlePt: 25,
  },
  {
    chars: 22,
    sec: "3.3 秒",
    pass: false,
    diffHtml:
      '<mark>主标题：新一代零延迟渲染管线架构升级</mark><br><ins>副标题：让多端复杂场景帧率直接翻三倍</ins>',
    note: "第二刀把「是什么」和「有什么价值」拆成两层！视线先落主标题，再扫副标题，层级开始清晰，只差把主标题再拧干最后 4 个多余字。",
    slideTitle: ["新一代零延迟", "渲染管线架构升级"],
    slideSub: "让多端复杂场景帧率直接翻三倍",
    titlePt: 34,
  },
  {
    chars: 18,
    sec: "2.1 秒",
    pass: true,
    diffHtml:
      '<mark>主标题：零延迟渲染管线</mark>（7 字）<br><ins>副标题：一句话把复杂场景帧率推高三倍</ins>（11 字）',
    note: "三秒扫视过关！7 字主标题字号瞬间放大到 52pt，11 字副标题锁进酸柠条明确价值主张，剩下的技术细节交给演讲者的声音和第 02 页。",
    slideTitle: ["零延迟", "渲染管线"],
    slideSub: "一句话把复杂场景帧率推高三倍",
    titlePt: 50,
  },
];

export function initScissorBench() {
  const pills = [...document.querySelectorAll("#scissor-bench .step-pill")];
  const elCount = document.getElementById("sc-count");
  const elTime = document.getElementById("sc-time");
  const elDiff = document.getElementById("sc-diff");
  const elNote = document.getElementById("sc-note");
  const elSlide = document.getElementById("sc-slide");
  if (!elDiff || !elSlide) return;

  function render(idx) {
    const s = SCISSOR_STEPS[idx];
    elCount.textContent = `实测字数：${s.chars} 字`;
    elTime.textContent = `扫视耗时（示意）：${s.sec}${s.pass ? " · 3秒过关" : " · 超时"}`;
    elTime.className = s.pass ? "sc-ok" : "sc-bad";
    elDiff.innerHTML = s.diffHtml;
    elNote.textContent = s.note;

    const lh = Math.round(s.titlePt * 1.24);
    const startY = s.slideTitle.length >= 3 ? 86 : 112;
    const subY = startY + s.slideTitle.length * lh + 18;
    elSlide.innerHTML = `
      <svg viewBox="0 0 560 315" width="100%" role="img" aria-label="精简步骤 ${idx + 1} 封面示意">
        <rect width="560" height="315" fill="#260328" />
        <circle cx="430" cy="162" r="88" fill="#C2D229" opacity="${s.pass ? "1" : "0.72"}" />
        <path d="M32 72 L32 40 L64 40" fill="none" stroke="${s.pass ? "#C2D229" : "#FF6B5B"}" stroke-width="4" />
        ${s.slideTitle
          .map(
            (line, i) =>
              `<text x="44" y="${startY + i * lh}" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="${s.titlePt}" font-weight="900">${line}</text>`
          )
          .join("")}
        ${
          s.slideSub
            ? `<rect x="44" y="${subY}" width="256" height="30" fill="#C2D229" />
               <text x="56" y="${subY + 20}" fill="#140316" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700">${s.slideSub}</text>`
            : `<text x="44" y="${subY + 12}" fill="#FF8C80" font-family="Noto Sans SC, sans-serif" font-size="12">未拆出副标题 · 信息全压在标题里</text>`
        }
        <text x="44" y="286" fill="#C2D229" font-family="DM Mono, monospace" font-size="11">STEP 0${idx + 1} · ${s.chars} CHARS · ${s.sec}</text>
      </svg>
    `;

    pills.forEach((p, i) => {
      p.classList.toggle("is-active", i === idx);
      p.setAttribute("aria-selected", String(i === idx));
    });
  }

  pills.forEach((p) => {
    p.addEventListener("click", () => render(Number(p.dataset.step)));
  });

  render(0);
}

// ============================================================
// 03 礼堂视距 × 环境光双维投影光学台（2D Canvas）
// ============================================================
const VENUES = {
  room: { label: "小会议室", distM: 4, screenH: 1.1, blurDiv: 1.0 },
  class: { label: "标准教室", distM: 10, screenH: 1.6, blurDiv: 2.3 },
  hall: { label: "200人礼堂", distM: 18, screenH: 2.2, blurDiv: 4.1 },
};

const LIGHTS = {
  dark: { label: "全暗剧院", ambientLift: 0.02, washAlpha: 0.04, contrastLoss: 0.92 },
  semi: { label: "半明会议室", ambientLift: 0.14, washAlpha: 0.22, contrastLoss: 0.56 },
  bright: { label: "正午拉窗帘", ambientLift: 0.28, washAlpha: 0.42, contrastLoss: 0.34 },
};

export function initOpticsStage() {
  const canvas = document.getElementById("optics-canvas");
  const vTitle = document.getElementById("opt-verdict-title");
  const vBody = document.getElementById("opt-verdict-body");
  const statBad = document.getElementById("opt-stat-bad");
  const statGood = document.getElementById("opt-stat-good");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const state = { venue: "class", light: "semi" };
  let dirty = true;

  // 离屏小画布用于快速模拟光学视距分辨衰减（零 ctx.filter 性能风险）
  const lowA = document.createElement("canvas");
  const lowACtx = lowA.getContext("2d");
  const lowB = document.createElement("canvas");
  const lowBCtx = lowB.getContext("2d");

  const srcA = document.createElement("canvas");
  srcA.width = 480;
  srcA.height = 270;
  const srcACtx = srcA.getContext("2d");

  const srcB = document.createElement("canvas");
  srcB.width = 480;
  srcB.height = 270;
  const srcBCtx = srcB.getContext("2d");

  function drawSpecimens() {
    // 左屏：反面案例（低对比浅灰细字 28pt + 弱图形）
    srcACtx.fillStyle = "#3E2F42";
    srcACtx.fillRect(0, 0, 480, 270);
    srcACtx.fillStyle = "#625268";
    srcACtx.beginPath();
    srcACtx.arc(365, 142, 68, 0, Math.PI * 2);
    srcACtx.fill();
    srcACtx.fillStyle = "#9D91A3";
    srcACtx.font = '400 18px "Noto Sans SC", sans-serif';
    srcACtx.fillText("下一代零延迟渲染管线", 36, 98);
    srcACtx.fillStyle = "#817387";
    srcACtx.font = '400 11px "Noto Sans SC", sans-serif';
    srcACtx.fillText("一句话把复杂场景帧率推高三倍 · 技术架构汇报", 36, 128);
    srcACtx.fillStyle = "#7D7083";
    srcACtx.font = '400 10px "DM Mono", monospace';
    srcACtx.fillText("RASTER LABS · 2027", 36, 224);

    // 右屏：正面案例（深茄紫 + 纯白粗黑 64pt + 酸柠条与大圆）
    srcBCtx.fillStyle = "#260328";
    srcBCtx.fillRect(0, 0, 480, 270);
    srcBCtx.fillStyle = "#C2D229";
    srcBCtx.beginPath();
    srcBCtx.arc(365, 142, 76, 0, Math.PI * 2);
    srcBCtx.fill();
    srcBCtx.strokeStyle = "#C2D229";
    srcBCtx.lineWidth = 3;
    srcBCtx.beginPath();
    srcBCtx.moveTo(28, 72);
    srcBCtx.lineTo(28, 42);
    srcBCtx.lineTo(58, 42);
    srcBCtx.stroke();
    srcBCtx.fillStyle = "#FEFEFE";
    srcBCtx.font = '900 34px "Noto Sans SC", sans-serif';
    srcBCtx.fillText("下一代零延迟", 38, 86);
    srcBCtx.fillText("渲染管线", 38, 126);
    srcBCtx.fillStyle = "#C2D229";
    srcBCtx.fillRect(38, 144, 214, 24);
    srcBCtx.fillStyle = "#140316";
    srcBCtx.font = '700 12px "Noto Sans SC", sans-serif';
    srcBCtx.fillText("一句话把复杂场景帧率推高三倍", 48, 160);
    srcBCtx.fillStyle = "#FEFEFE";
    srcBCtx.font = '600 11px "Noto Sans SC", sans-serif';
    srcBCtx.fillText("光栅实验室  |  RASTER LABS", 38, 228);
  }

  drawSpecimens();

  function updateReadout() {
    const v = VENUES[state.venue];
    const l = LIGHTS[state.light];
    // 真实视角换算（标准 540pt 高幕布）
    const arcBad = +((((28 / 540) * v.screenH * 0.85) / v.distM) * (180 / Math.PI) * 60).toFixed(1);
    const arcGood = +((((64 / 540) * v.screenH * 0.85) / v.distM) * (180 / Math.PI) * 60).toFixed(1);
    const crBad = +(1 + (3.6 - 1) * l.contrastLoss).toFixed(1);
    const crGood = +(1 + (17.2 - 1) * l.contrastLoss).toFixed(1);

    statBad.textContent = `${arcBad}′ · 实投对比 ${crBad}:1`;
    statGood.textContent = `${arcGood}′ · 实投对比 ${crGood}:1`;

    if (state.venue === "hall" && state.light === "bright") {
      vTitle.textContent = "18 米正午礼堂：细灰小字彻底隐身，高反差粗标仍站得住";
      vBody.textContent =
        "窗帘透进的环境光把投影黑位整体抬灰，左屏浅灰细字的实投对比度跌破 2:1，后排只见一块雾蒙蒙的灰板；右屏 64pt 纯白粗黑与酸柠条即便被环境光洗白，轮廓依然清楚可辨。";
    } else if (state.venue === "room" && state.light === "dark") {
      vTitle.textContent = "4 米全暗小会议室：近看好像都能认，但这是最容易骗人的假象";
      vBody.textContent =
        "在自己笔记本前或 4 米暗室里，左屏的细灰字也能勉强读清——但只要把同一份文件带去 10 米会议室或忘记关顶灯，它就会瞬间崩盘。设计封面永远要按最差场地留余量。";
    } else {
      vTitle.textContent = `${v.distM} 米${l.label}里，字号与对比度一起决定后排能不能读懂`;
      vBody.textContent = `距离拉到 ${v.distM} 米后，28pt 汉字的视角收窄到 ${arcBad}′，叠加上${l.label}的屏幕泛白，左屏细笔画迅速粘连；右屏 64pt 粗黑保持 ${arcGood}′ 视角与 ${crGood}:1 实投对比度，三秒内依然一眼入眼。`;
    }
  }

  function render() {
    if (!dirty) return;
    dirty = false;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(280, Math.round(rect.width));
    const cssH = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(cssW < 520 ? 1.5 : 2);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    const v = VENUES[state.venue];
    const l = LIGHTS[state.light];

    const sw = Math.max(64, Math.round(480 / v.blurDiv));
    const sh = Math.max(36, Math.round(270 / v.blurDiv));
    lowA.width = lowB.width = sw;
    lowA.height = lowB.height = sh;
    lowACtx.drawImage(srcA, 0, 0, sw, sh);
    lowBCtx.drawImage(srcB, 0, 0, sw, sh);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#160118";
    ctx.fillRect(0, 0, cssW, cssH);

    const stacked = cssW < 540;
    const pad = 12;
    const gap = 12;
    const labelH = 22;
    const boxes = stacked
      ? (() => {
          const w = cssW - pad * 2;
          const h = Math.min((cssH - pad * 2 - gap - labelH * 2) / 2, (w * 9) / 16);
          const adjW = Math.round((h * 16) / 9);
          const x = Math.round((cssW - adjW) / 2);
          return [
            { x, y: pad + labelH, w: adjW, h: Math.round(h), title: "反例：28pt 细浅灰（低反差）", bad: true },
            {
              x,
              y: pad + labelH + Math.round(h) + gap + labelH,
              w: adjW,
              h: Math.round(h),
              title: "正例：64pt 粗白字 + 酸柠高反差",
              bad: false,
            },
          ];
        })()
      : (() => {
          const w = Math.floor((cssW - pad * 2 - gap) / 2);
          const h = Math.min(cssH - pad * 2 - labelH - 18, Math.round((w * 9) / 16));
          const adjW = Math.round((h * 16) / 9);
          const startX = Math.round((cssW - (adjW * 2 + gap)) / 2);
          const y = Math.round((cssH - h) / 2) + 8;
          return [
            { x: startX, y, w: adjW, h, title: "反例：28pt 细浅灰（低反差）", bad: true },
            { x: startX + adjW + gap, y, w: adjW, h, title: "正例：64pt 粗白字 + 酸柠高反差", bad: false },
          ];
        })();

    boxes.forEach((b, idx) => {
      ctx.fillStyle = b.bad ? "#FF8C80" : "#C2D229";
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(b.title, b.x, b.y - 6);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(idx === 0 ? lowA : lowB, b.x, b.y, b.w, b.h);

      // 模拟现场环境光把投影黑位洗灰
      ctx.fillStyle = `rgba(235, 228, 240, ${l.washAlpha})`;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = b.bad ? "#FF6B5B" : "#C2D229";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    ctx.restore();
  }

  const ctrl = loop(canvas, () => render());
  new ResizeObserver(() => {
    dirty = true;
    ctrl.draw();
  }).observe(canvas);

  document.querySelectorAll("#sec-03 [data-venue]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.venue = btn.dataset.venue;
      document.querySelectorAll("#sec-03 [data-venue]").forEach((b) => {
        const on = b.dataset.venue === state.venue;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      updateReadout();
      dirty = true;
      ctrl.draw();
    });
  });

  document.querySelectorAll("#sec-03 [data-light]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.light = btn.dataset.light;
      document.querySelectorAll("#sec-03 [data-light]").forEach((b) => {
        const on = b.dataset.light === state.light;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      updateReadout();
      dirty = true;
      ctrl.draw();
    });
  });

  updateReadout();
  ctrl.draw();
}

// ============================================================
// 04 三页连播视觉契约接力带
// ============================================================
const RELAY_THEMES = {
  plum: {
    bg: "#260328",
    card: "#340A38",
    ink: "#FEFEFE",
    sub: "#DDD3E0",
    accent: "#C2D229",
    accentInk: "#140316",
    font: '"Noto Sans SC", sans-serif',
    caption:
      "茄紫 × 酸柠发布会体系：01 标题页定下深底、左对齐锚线与酸柠信号色；02 节标题直接放大编号承接；03 比较页仅在胜出栏亮起酸柠边，整套幻灯片无需重解释规则。",
  },
  ivory: {
    bg: "#F8F5EE",
    card: "#EFEAE0",
    ink: "#1E1A22",
    sub: "#544C5C",
    accent: "#5D2A73",
    accentInk: "#FFFFFF",
    font: '"Noto Sans SC", sans-serif',
    caption:
      "暖纸 × 浓墨学术答辩体系：明亮纸底适配开灯教室与打印讲义；01 页用深梅紫条锚定研究命题，02/03 页延续同一左缘线和深紫高亮，保证长时间阅读不疲劳。",
  },
  navy: {
    bg: "#0F1E36",
    card: "#192E4F",
    ink: "#F4F8FF",
    sub: "#B8CCE5",
    accent: "#5CD6C8",
    accentInk: "#0A1B2A",
    font: '"Noto Sans SC", sans-serif',
    caption:
      "深蓝 × 冰白财报提案体系：冷静理性的商务基调；01 页左下角定下的机构签名与顶部细青杠在后续每一页保持原位，让管理层一眼识别数据重点。",
  },
};

export function initRelayStrip() {
  const strip = document.getElementById("relay-strip");
  const cap = document.getElementById("relay-caption");
  const tabs = [...document.querySelectorAll("#sec-04 .relay-tab")];
  if (!strip || !cap) return;

  function render(key) {
    const t = RELAY_THEMES[key];
    strip.innerHTML = `
      <div class="relay-slide">
        <span class="relay-tag">01 · 标题幻灯片（335）· 定下契约</span>
        <svg viewBox="0 0 320 180" width="100%" role="img" aria-label="01 标题幻灯片">
          <rect width="320" height="180" fill="${t.bg}" />
          <path d="M20 44 L20 22 L42 22" fill="none" stroke="${t.accent}" stroke-width="3" />
          <circle cx="242" cy="92" r="46" fill="${t.accent}" />
          <text x="28" y="64" fill="${t.ink}" font-family=${t.font} font-size="22" font-weight="900">零延迟渲染</text>
          <rect x="28" y="76" width="128" height="18" fill="${t.accent}" />
          <text x="34" y="89" fill="${t.accentInk}" font-family=${t.font} font-size="9" font-weight="700">一句话说明价值主张</text>
          <rect x="28" y="146" width="12" height="12" fill="${t.accent}" />
          <text x="46" y="156" fill="${t.sub}" font-family="DM Mono, monospace" font-size="8">BRAND · ANCHOR</text>
        </svg>
      </div>
      <div class="relay-slide">
        <span class="relay-tag">02 · 节标题 / 正文（337 / 336）· 延续左锚</span>
        <svg viewBox="0 0 320 180" width="100%" role="img" aria-label="02 节标题与正文承接">
          <rect width="320" height="180" fill="${t.bg}" />
          <rect x="28" y="26" width="24" height="4" fill="${t.accent}" />
          <text x="28" y="54" fill="${t.ink}" font-family=${t.font} font-size="16" font-weight="900">01 为什么旧管线会掉帧</text>
          <rect x="28" y="70" width="264" height="66" fill="${t.card}" />
          <rect x="42" y="86" width="120" height="8" fill="${t.ink}" opacity="0.82" />
          <rect x="42" y="102" width="210" height="6" fill="${t.sub}" opacity="0.65" />
          <rect x="42" y="114" width="176" height="6" fill="${t.sub}" opacity="0.65" />
          <rect x="28" y="148" width="10" height="10" fill="${t.accent}" />
          <text x="44" y="156" fill="${t.sub}" font-family="DM Mono, monospace" font-size="8">BRAND · 02</text>
        </svg>
      </div>
      <div class="relay-slide">
        <span class="relay-tag">03 · 比较页（339）· 同色高亮胜出项</span>
        <svg viewBox="0 0 320 180" width="100%" role="img" aria-label="03 比较幻灯片承接">
          <rect width="320" height="180" fill="${t.bg}" />
          <rect x="28" y="26" width="24" height="4" fill="${t.accent}" />
          <text x="28" y="52" fill="${t.ink}" font-family=${t.font} font-size="15" font-weight="900">重构前后单帧开销对比</text>
          <rect x="28" y="66" width="124" height="72" fill="${t.card}" />
          <text x="40" y="90" fill="${t.sub}" font-family=${t.font} font-size="10">旧管线</text>
          <text x="40" y="120" fill="${t.ink}" font-family="Unbounded, sans-serif" font-size="20" font-weight="700">14.8ms</text>
          <rect x="166" y="66" width="126" height="72" fill="${t.card}" stroke="${t.accent}" stroke-width="2" />
          <text x="178" y="90" fill="${t.accent}" font-family=${t.font} font-size="10" font-weight="700">零延迟新管线</text>
          <text x="178" y="120" fill="${t.ink}" font-family="Unbounded, sans-serif" font-size="20" font-weight="700">4.6ms</text>
          <rect x="28" y="148" width="10" height="10" fill="${t.accent}" />
          <text x="44" y="156" fill="${t.sub}" font-family="DM Mono, monospace" font-size="8">BRAND · 03</text>
        </svg>
      </div>
    `;
    cap.textContent = t.caption;
    tabs.forEach((b) => {
      const on = b.dataset.theme === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  tabs.forEach((b) => b.addEventListener("click", () => render(b.dataset.theme)));
  render("plum");
}

// ============================================================
// 05 实战用/避判定卡
// ============================================================
const CASES = {
  keynote: {
    verdict: "推荐用 335 标题幻灯片",
    use: true,
    title: "现场发布会、项目立项会、毕业答辩",
    reason:
      "听众陆续落座、主持人介绍你上台，屏幕会静止停留 15 秒到 5 分钟。此时一张高反差、有视觉焦点、带一句话价值主张的标题幻灯片，能帮你抢先立住专业气场与听讲预期。",
    tip: "把主标题推到 56–72pt，品牌标识克制放左下角，留足 40% 以上静谧底面。",
  },
  memo: {
    verdict: "别用常规标题幻灯片",
    use: false,
    title: "发在群里或邮件里的异步自读周报 / 调研 PDF",
    reason:
      "没有演讲者在旁边说话，读者打开文件只想立刻知道结论。放一张只有大字标题和装饰圆的仪式感封面，等于强迫老板多点一次翻页才能看到干货。",
    tip: "直接用「标题 + 核心结论摘要」起手（参考 336 标题和内容幻灯片版式），把最关键的 3 条判断写在第一屏。",
  },
  flash: {
    verdict: "别用常规标题幻灯片",
    use: false,
    title: "站会里的 1 分钟进度同步或线上事故复盘",
    reason:
      "整个发言只有 60 秒、一共就 2–3 页，放一张封面白白吃掉 15% 的节奏。听众已经知道你在讲什么，他们只想立刻看见报错曲线或修复时间表。",
    tip: "第一页直接上核心图表配顶部单行结论标题（参考 340 仅标题幻灯片版式），开门见山。",
  },
  mid: {
    verdict: "别重复套用总封面",
    use: false,
    title: "30 分钟演讲讲到一半，要切入第二大部分",
    reason:
      "如果中段换章时又把带完整公司 Logo、副标语和巨型视觉圆的总封面照搬一遍，听众会误以为换了下一位嘉宾上台，叙事节奏反而被切断。",
    tip: "中段过场请交给 337 节标题幻灯片版式：只留章节号与短标题，省去品牌大锁组。",
  },
};

export function initCaseSwitcher() {
  const panel = document.getElementById("case-panel");
  const tabs = [...document.querySelectorAll("#sec-05 .case-tab")];
  if (!panel) return;

  function render(key) {
    const c = CASES[key];
    panel.innerHTML = `
      <span class="case-badge ${c.use ? "is-use" : "is-skip"}">${c.verdict}</span>
      <h4>${c.title}</h4>
      <p>${c.reason}</p>
      <p class="case-tip"><strong>建议做法：</strong>${c.tip}</p>
    `;
    tabs.forEach((t) => {
      const on = t.dataset.case === key;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => render(t.dataset.case)));
  render("keynote");
}

// ============================================================
// 06 单变量四选一小练习（四个选项严格只差「主副标题层级与精简度」单一变量）
// ============================================================
const QUIZ_OPTIONS = [
  {
    id: "A",
    label: "方案 A",
    correct: false,
    svg: `
      <svg viewBox="0 0 384 216" width="100%" role="img" aria-label="方案 A 封面">
        <rect width="384" height="216" fill="#260328" />
        <circle cx="298" cy="112" r="56" fill="#C2D229" />
        <path d="M22 46 L22 26 L42 26" fill="none" stroke="#C2D229" stroke-width="3" />
        <text x="30" y="54" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="14" font-weight="900">城市高密度街区微气候策略</text>
        <text x="30" y="78" fill="#E3DAE6" font-family="Noto Sans SC, sans-serif" font-size="11.5">本次汇报围绕绿地布局优化、</text>
        <text x="30" y="96" fill="#E3DAE6" font-family="Noto Sans SC, sans-serif" font-size="11.5">风道模拟参数校准与三年实测</text>
        <text x="30" y="114" fill="#E3DAE6" font-family="Noto Sans SC, sans-serif" font-size="11.5">数据展开综合对比与建议说明</text>
        <rect x="30" y="172" width="12" height="12" fill="#C2D229" />
        <text x="48" y="182" fill="#DDD3E0" font-family="DM Mono, monospace" font-size="9">URBAN LAB · 2027</text>
      </svg>
    `,
    feedback:
      "方案 A 不够理想：主标题（30pt 比例）只比副标题（26pt 比例）大 1.15 倍，而且副标题塞了三整行，在 120 人报告厅后排几乎糊成一段普通正文，三秒内抓不住主角。",
  },
  {
    id: "B",
    label: "方案 B",
    correct: true,
    svg: `
      <svg viewBox="0 0 384 216" width="100%" role="img" aria-label="方案 B 封面">
        <rect width="384" height="216" fill="#260328" />
        <circle cx="298" cy="112" r="56" fill="#C2D229" />
        <path d="M22 50 L22 26 L46 26" fill="none" stroke="#C2D229" stroke-width="3" />
        <text x="30" y="64" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="27" font-weight="900">高密度街区</text>
        <text x="30" y="96" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="27" font-weight="900">微气候降温</text>
        <rect x="30" y="110" width="182" height="22" fill="#C2D229" />
        <text x="38" y="125" fill="#140316" font-family="Noto Sans SC, sans-serif" font-size="10.5" font-weight="700">屋顶绿化与风道让街区直降 2.4°C</text>
        <rect x="30" y="172" width="12" height="12" fill="#C2D229" />
        <text x="48" y="182" fill="#DDD3E0" font-family="DM Mono, monospace" font-size="9">URBAN LAB · 2027</text>
      </svg>
    `,
    feedback:
      "选对了！方案 B 把主副标题字号反差拉到约 2.6×，主标题两行 10 字在后排一眼入眼，酸柠副标题条用 13 字交代清楚价值主张，右侧视觉圆与左下品牌各安其位，完全符合 3 秒扫视原则。",
  },
  {
    id: "C",
    label: "方案 C",
    correct: false,
    svg: `
      <svg viewBox="0 0 384 216" width="100%" role="img" aria-label="方案 C 封面">
        <rect width="384" height="216" fill="#260328" />
        <circle cx="298" cy="112" r="56" fill="#C2D229" />
        <path d="M22 48 L22 26 L44 26" fill="none" stroke="#C2D229" stroke-width="3" />
        <text x="30" y="54" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="20" font-weight="900">高密度街区</text>
        <text x="30" y="78" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="20" font-weight="900">微气候降温</text>
        <text x="30" y="106" fill="#C2D229" font-family="Noto Sans SC, sans-serif" font-size="18.5" font-weight="900">屋顶绿化叠加风道</text>
        <text x="30" y="130" fill="#C2D229" font-family="Noto Sans SC, sans-serif" font-size="18.5" font-weight="900">街区实测直降 2.4°C</text>
        <rect x="30" y="172" width="12" height="12" fill="#C2D229" />
        <text x="48" y="182" fill="#DDD3E0" font-family="DM Mono, monospace" font-size="9">URBAN LAB · 2027</text>
      </svg>
    `,
    feedback:
      "方案 C 踩进了「全员大喊」的坑：主标题和副标题都拉到几乎一样大（反差仅 1.08×），四行粗大字互相抢麦，失去主次落差，眼睛不知道该先停在主题还是数据结论上。",
  },
  {
    id: "D",
    label: "方案 D",
    correct: false,
    svg: `
      <svg viewBox="0 0 384 216" width="100%" role="img" aria-label="方案 D 封面">
        <rect width="384" height="216" fill="#260328" />
        <circle cx="298" cy="112" r="56" fill="#C2D229" />
        <path d="M22 50 L22 26 L46 26" fill="none" stroke="#C2D229" stroke-width="3" />
        <text x="30" y="66" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="30" font-weight="900">高密度街区</text>
        <text x="30" y="100" fill="#FEFEFE" font-family="Noto Sans SC, sans-serif" font-size="30" font-weight="900">微气候降温</text>
        <text x="30" y="122" fill="#8D7A91" font-family="Noto Sans SC, sans-serif" font-size="6.5">屋顶绿化与风道让街区直降 2.4°C</text>
        <rect x="30" y="172" width="12" height="12" fill="#C2D229" />
        <text x="48" y="182" fill="#DDD3E0" font-family="DM Mono, monospace" font-size="9">URBAN LAB · 2027</text>
      </svg>
    `,
    feedback:
      "方案 D 拉大了反差，却把副标题压成了过小的浅灰蚁字（相当于 14pt 比例）：120 人报告厅里只有前两排看得见副标题，后排观众失去语境说明，反差过了头反而断档。",
  },
];

export function initQuiz() {
  const grid = document.getElementById("quiz-grid");
  const tag = document.getElementById("qf-tag");
  const text = document.getElementById("qf-text");
  const reset = document.getElementById("qf-reset");
  if (!grid || !tag || !text) return;

  grid.innerHTML = QUIZ_OPTIONS.map(
    (o) => `
      <button type="button" class="quiz-card" data-opt="${o.id}" aria-pressed="false">
        <div class="quiz-svg">${o.svg}</div>
        <div class="quiz-foot">
          <span class="quiz-label">${o.label}</span>
          <span class="quiz-mark" aria-hidden="true">选择此封面</span>
        </div>
      </button>
    `
  ).join("");

  const cards = [...grid.querySelectorAll(".quiz-card")];

  function pick(id) {
    const opt = QUIZ_OPTIONS.find((o) => o.id === id);
    if (!opt) return;
    cards.forEach((c) => {
      const cid = c.dataset.opt;
      const co = QUIZ_OPTIONS.find((o) => o.id === cid);
      c.classList.toggle("is-picked", cid === id);
      c.classList.toggle("is-correct", co.correct);
      c.classList.toggle("is-wrong", cid === id && !co.correct);
      c.setAttribute("aria-pressed", String(cid === id));
      const mark = c.querySelector(".quiz-mark");
      if (mark) {
        mark.textContent = co.correct ? "✓ 最佳方案" : cid === id ? "× 存在短板" : "对比查看";
      }
    });
    tag.textContent = opt.correct ? `✓ ${opt.label} · 正确` : `× ${opt.label} · 再想想`;
    tag.className = `qf-tag ${opt.correct ? "is-ok" : "is-bad"}`;
    text.textContent = opt.feedback;
    if (reset) reset.hidden = false;
  }

  cards.forEach((c) => c.addEventListener("click", () => pick(c.dataset.opt)));

  if (reset) {
    reset.addEventListener("click", () => {
      cards.forEach((c) => {
        c.classList.remove("is-picked", "is-correct", "is-wrong");
        c.setAttribute("aria-pressed", "false");
        const mark = c.querySelector(".quiz-mark");
        if (mark) mark.textContent = "选择此封面";
      });
      tag.textContent = "等待选择";
      tag.className = "qf-tag";
      text.textContent = "点击上方任意一张 16:9 候选封面，查看它在真实 120 人报告厅里的视觉表现。";
      reset.hidden = true;
    });
  }
}

// ============================================================
// 07 原海报放大、拖动与 Esc 关闭灯箱
// ============================================================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-trigger");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lb-stage");
  const lbImg = document.getElementById("lb-img");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-zoom-in");
  const btnOut = document.getElementById("lb-zoom-out");
  const btnClose = document.getElementById("lb-close");
  if (!trigger || !poster || !lb || !lbImg || !lbStage) return;

  let scale = 1;
  let ox = 0;
  let oy = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`;
    if (lbScale) lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = poster.src;
    scale = 1.15;
    ox = 0;
    oy = 0;
    applyTransform();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose?.addEventListener("click", close);

  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    applyTransform();
  });

  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      ox = 0;
      oy = 0;
    }
    applyTransform();
  });

  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(0.8, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );

  lbStage.addEventListener("pointerdown", (e) => {
    if (e.target === lbStage) {
      close();
      return;
    }
    pan = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox, oy };
    try {
      lbStage.setPointerCapture(e.pointerId);
    } catch {}
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!pan || pan.id !== e.pointerId) return;
    ox = pan.ox + (e.clientX - pan.sx);
    oy = pan.oy + (e.clientY - pan.sy);
    applyTransform();
  });

  lbStage.addEventListener("pointerup", () => {
    pan = null;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
