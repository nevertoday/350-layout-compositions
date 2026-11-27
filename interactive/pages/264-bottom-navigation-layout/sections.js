// 264 底部导航布局 — 01–06 节交互模块（相邻章节控件互不重复）

// ---------- 01 拇指为什么爱底部：三握持姿势 + 屏寸解剖 SVG ----------
export function initErgoSection() {
  const wrap = document.getElementById("ergo-svg-wrap");
  const metricsEl = document.getElementById("ergo-metrics");
  const titleEl = document.getElementById("ergo-viz-title");
  const badgeEl = document.getElementById("ergo-viz-badge");
  const inchRange = document.getElementById("range-inch");
  const inchVal = document.getElementById("val-inch");
  const gripBtns = [...document.querySelectorAll(".grip-card")];

  const GRIPS = {
    onehand: {
      name: "单手握持",
      pct: "49%",
      tip: "右拇指以掌根为轴画扇弧；屏幕越长，顶栏越彻底滑出自然热区。",
    },
    cradle: {
      name: "单手托握",
      pct: "36%",
      tip: "一手稳托机身、另一手操作；视野与点击重心落在中下部，底栏不挡内容又顺手。",
    },
    twohand: {
      name: "双手打字",
      pct: "15%",
      tip: "双拇指从左右下角同时覆盖底沿，底部四个板块几乎全部落在双弧重叠舒适区内。",
    },
  };

  let grip = "onehand";
  let inch = 61; // 6.1"

  function render() {
    const info = GRIPS[grip];
    const inchStr = (inch / 10).toFixed(1);
    const sizeLabel = inch <= 57 ? "紧凑小屏" : inch <= 63 ? "标准屏" : "大屏巨幕";
    inchVal.textContent = `${inchStr} 英寸（${sizeLabel}）`;

    // 随屏寸增大，手机高度拉长而人手拇指物理半径不变 → 相对覆盖半径按反比收窄
    const factor = 61 / inch;
    const w = 186;
    const h = Math.round(320 * (inch / 61));
    const clampedH = Math.min(358, Math.max(292, h));
    const topBarY = 24;
    const botBarY = clampedH - 36;

    let arcsSvg = "";
    let topReachText = "";
    let botReachText = "";
    let badgeText = "";

    if (grip === "onehand") {
      const ox = w + 14;
      const oy = clampedH - 42;
      const rNat = Math.round(148 * factor);
      const rStr = Math.round(224 * factor);
      const topDist = Math.hypot(w * 0.5 - ox, topBarY + 14 - oy);
      const botDist = Math.hypot(w * 0.5 - ox, botBarY + 18 - oy);
      topReachText = topDist > rStr ? "够不着（须换握）" : "吃力伸展";
      botReachText = botDist <= rNat ? "自然热区（一步达）" : "边缘微伸";
      badgeText = inch >= 65 ? "大屏单手：顶栏彻底失联" : "底栏直落自然扇弧";
      arcsSvg = `
        <rect x="0" y="0" width="${w}" height="${clampedH}" fill="rgba(174,36,32,0.12)"/>
        <circle cx="${ox}" cy="${oy}" r="${rStr}" fill="rgba(209,93,57,0.15)" stroke="#C6502D" stroke-dasharray="5 4" stroke-width="1.4"/>
        <circle cx="${ox}" cy="${oy}" r="${rNat}" fill="rgba(25,107,78,0.22)" stroke="#196B4E" stroke-dasharray="5 4" stroke-width="1.8"/>
        <circle cx="${ox - 16}" cy="${oy - 6}" r="5" fill="#196B4E"/>
      `;
    } else if (grip === "cradle") {
      const cx = w * 0.5;
      const cy = clampedH * 0.6;
      const rxNat = Math.round(86 * factor);
      const ryNat = Math.round(112 * factor);
      topReachText = inch >= 64 ? "需抬腕上移" : "中度伸展";
      botReachText = "自然可达 · 零遮挡";
      badgeText = "中下部舒适 · 底栏不挡主视野";
      arcsSvg = `
        <rect x="0" y="0" width="${w}" height="${clampedH}" fill="rgba(209,93,57,0.08)"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rxNat + 32}" ry="${ryNat + 36}" fill="rgba(98,161,214,0.14)" stroke="#3E82BE" stroke-dasharray="5 4" stroke-width="1.4"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rxNat}" ry="${ryNat}" fill="rgba(25,107,78,0.20)" stroke="#196B4E" stroke-dasharray="5 4" stroke-width="1.8"/>
      `;
    } else {
      const rNat = Math.round(126 * factor);
      const oy = clampedH - 36;
      topReachText = "双拇指均难触顶";
      botReachText = "左右双弧全覆盖";
      badgeText = "双拇指底沿无缝接力";
      arcsSvg = `
        <rect x="0" y="0" width="${w}" height="${clampedH}" fill="rgba(174,36,32,0.10)"/>
        <circle cx="-10" cy="${oy}" r="${rNat}" fill="rgba(25,107,78,0.18)" stroke="#196B4E" stroke-dasharray="5 4" stroke-width="1.6"/>
        <circle cx="${w + 10}" cy="${oy}" r="${rNat}" fill="rgba(25,107,78,0.18)" stroke="#196B4E" stroke-dasharray="5 4" stroke-width="1.6"/>
      `;
    }

    titleEl.textContent = `${info.name}（${info.pct}）· ${inchStr}" 热区解剖（示意）`;
    badgeEl.textContent = badgeText;

    const svgH = clampedH + 24;
    wrap.innerHTML = `
      <svg viewBox="0 0 ${w + 24} ${svgH}" width="${w + 24}" height="${svgH}" role="img" aria-label="${info.name} ${inchStr}英寸热区示意图">
        <defs>
          <clipPath id="ergo-clip"><rect x="0" y="0" width="${w}" height="${clampedH}" rx="20"/></clipPath>
        </defs>
        <rect x="6" y="6" width="${w + 12}" height="${clampedH + 12}" rx="26" fill="#62A1D6"/>
        <rect x="12" y="12" width="${w}" height="${clampedH}" rx="20" fill="#FCF9F4"/>
        <g transform="translate(12,12)" clip-path="url(#ergo-clip)">
          ${arcsSvg}
          <!-- 顶部导航对比带 -->
          <rect x="10" y="${topBarY}" width="${w - 20}" height="24" rx="6" fill="rgba(174,36,32,0.16)" stroke="#AE2420" stroke-width="1.2"/>
          <text x="${w / 2}" y="${topBarY + 15}" text-anchor="middle" font-size="11" font-weight="700" fill="#8C1D19">顶部导航区</text>
          <!-- 中央内容主视区 -->
          <rect x="14" y="${Math.round(clampedH * 0.28)}" width="${w - 28}" height="${Math.round(clampedH * 0.36)}" rx="10" fill="rgba(255,255,255,0.72)" stroke="#B8D2E8"/>
          <text x="${w / 2}" y="${Math.round(clampedH * 0.46)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1B5C8E">中央核心内容视域</text>
          <text x="${w / 2}" y="${Math.round(clampedH * 0.53)}" text-anchor="middle" font-size="10.5" fill="#5C5852">阅读与浏览聚焦处</text>
          <!-- 底部导航对比带 -->
          <rect x="0" y="${botBarY}" width="${w}" height="36" fill="#C6502D"/>
          <text x="${w / 2}" y="${botBarY + 22}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFFFFF">底部导航锚点（贴底稳达）</text>
        </g>
      </svg>
    `;

    metricsEl.innerHTML = `
      <div class="em-box"><span>底栏可达评估</span><strong>${botReachText}</strong></div>
      <div class="em-box"><span>顶栏可达评估</span><strong>${topReachText}</strong></div>
      <div class="em-box" style="grid-column: 1 / -1;"><span>人体工学结论</span><strong style="font-size:13.5px;font-weight:600;color:#3F3C37;">${info.tip}</strong></div>
    `;
  }

  gripBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      grip = btn.dataset.grip;
      gripBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-checked", String(on));
      });
      render();
    });
  });

  inchRange.addEventListener("input", () => {
    inch = Number(inchRange.value);
    render();
  });

  render();
}

// 清晰矢量微图标（杜绝字体缺字，且与 264 原海报线条语言完全统一）
function miniIconSvg(kind, size = 16) {
  const paths = {
    home: `<path d="M3 10.5 L10 4 L17 10.5 V16.5 H12.5 V12 H7.5 V16.5 H3 Z" fill="currentColor"/>`,
    grid: `<rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="11" y="3.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="3.5" y="11" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="11" y="11" width="5.5" height="5.5" rx="1" fill="currentColor"/>`,
    bell: `<path d="M10 3 C7.2 3 5.5 5 5.5 8 V12 L4 14 H16 L14.5 12 V8 C14.5 5 12.8 3 10 3 Z" fill="currentColor"/><circle cx="10" cy="16.2" r="1.6" fill="currentColor"/>`,
    user: `<circle cx="10" cy="6.8" r="3" fill="currentColor"/><path d="M4.2 16.5 C4.2 13.4 6.8 11.2 10 11.2 C13.2 11.2 15.8 13.4 15.8 16.5 Z" fill="currentColor"/>`,
    fav: `<path d="M10 16 C10 16 4 12.2 4 7.6 C4 5.4 5.7 3.8 7.6 3.8 C8.8 3.8 9.6 4.5 10 5.4 C10.4 4.5 11.2 3.8 12.4 3.8 C14.3 3.8 16 5.4 16 7.6 C16 12.2 10 16 10 16 Z" fill="currentColor"/>`,
    set: `<circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 3 V5.2 M10 14.8 V17 M3 10 H5.2 M14.8 10 H17 M5 5 L6.6 6.6 M13.4 13.4 L15 15 M15 5 L13.4 6.6 M6.6 13.4 L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
    help: `<circle cx="10" cy="10" r="6.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.2 8.2 C8.2 7 9 6.2 10.2 6.2 C11.4 6.2 12.1 6.9 12.1 7.9 C12.1 9 10.2 9.4 10.2 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10.2" cy="13.5" r="1" fill="currentColor"/>`,
    more: `<circle cx="10" cy="10" r="6.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9 V13.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="10" cy="6.6" r="1.1" fill="currentColor"/>`,
    note: `<rect x="4.5" y="3.5" width="11" height="13" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 7.5 H13 M7 10.5 H13 M7 13.5 H10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
    spark: `<path d="M10 3.2 L12 8 L16.8 10 L12 12 L10 16.8 L8 12 L3.2 10 L8 8 Z" fill="currentColor"/>`,
    trash: `<path d="M4.5 6.2 H15.5 M7.8 4 H12.2 M6.2 6.2 L7 16 H13 L13.8 6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  return `<svg viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true">${paths[kind] || paths.more}</svg>`;
}

// ---------- 02 三到五项的黄金尺：真实 DOM 像素量测底栏 ----------
export function initRulerSection() {
  const POOL = [
    { id: "home", label: "首页", icon: "home" },
    { id: "grid", label: "分类", icon: "grid" },
    { id: "bell", label: "消息", icon: "bell" },
    { id: "user", label: "我的", icon: "user" },
    { id: "fav", label: "收藏", icon: "fav" },
    { id: "set", label: "设置", icon: "set" },
    { id: "help", label: "客服", icon: "help" },
    { id: "more", label: "关于", icon: "more" },
  ];

  let count = 4;
  let width = 375;
  let showLabels = true;
  let showPad = false;
  let activeIdx = 0;

  const countEl = document.getElementById("r2-count");
  const deviceEl = document.getElementById("r2-device");
  const barEl = document.getElementById("r2-dom-bar");
  const widthReadout = document.getElementById("r2-width-readout");
  const verdictEl = document.getElementById("r2-verdict");
  const diagEl = document.getElementById("r2-diagnosis");
  const lblBtn = document.getElementById("r2-labels");
  const padBtn = document.getElementById("r2-pad");
  const rwBtns = [...document.querySelectorAll("[data-rw]")];

  function render() {
    countEl.textContent = `${count} 项`;
    deviceEl.style.maxWidth = `${width}px`;
    if (activeIdx >= count) activeIdx = 0;

    const slotW = (width - 8) / count;
    barEl.innerHTML = POOL.slice(0, count)
      .map(
        (it, idx) => `
      <button type="button" class="rdom-tab ${idx === activeIdx ? "is-active" : ""} ${showPad ? "show-pad" : ""}" data-ridx="${idx}" role="tab" aria-selected="${idx === activeIdx}">
        ${miniIconSvg(it.icon, 16)}
        ${showLabels ? `<span class="rdom-lbl">${it.label}</span>` : ""}
        <span class="rdom-px">${Math.round(slotW)}px</span>
      </button>
    `
      )
      .join("");

    barEl.querySelectorAll(".rdom-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeIdx = Number(btn.dataset.ridx);
        render();
      });
    });

    widthReadout.textContent = `屏宽 ${width}px · 单格理论宽 ${slotW.toFixed(1)}px`;

    let bad = false;
    let verdict = "";
    let diag = "";

    if (count < 3) {
      bad = true;
      verdict = "仅 2 项 · 大材小用";
      diag = `只有 ${count} 个入口时，每格拉宽到 ${slotW.toFixed(0)}px 却长期占掉一整条屏幕底部。这个体量改用顶部分段控件或 265 标签页更轻快。`;
    } else if (count > 5) {
      bad = true;
      verdict = slotW < 52 ? "严重挤压 · 指肚撞车" : "超出 5 项上限";
      diag = `塞入 ${count} 项后，在 ${width}px 屏上单格只剩 ${slotW.toFixed(0)}px 宽。打开「叠显 44px 指肚圆」可以看到：相邻两个触控热区紧贴甚至互相侵入，单手盲点极易误触隔壁板块。`;
    } else if (!showLabels) {
      bad = true;
      verdict = "缺文字标签 · 靠猜";
      diag = `项数和单格宽度（${slotW.toFixed(0)}px）都合规，但去掉文字只剩抽象符号后，新用户得花时间辨认「${POOL[1].label}」「${POOL[2].label}」分别去哪。`;
    } else if (slotW < 60) {
      bad = true;
      verdict = "小屏偏紧 · 建议 3–4 项";
      diag = `在 320px 极窄小屏上放 5 项，单格只有 ${slotW.toFixed(0)}px，留给中文标签的水平呼吸感偏紧；精简到 4 项可立刻升至 78px。`;
    } else {
      verdict = "符合 3–5 项黄金尺";
      diag = `${count} 个平级入口在 ${width}px 屏上每格拥有 ${slotW.toFixed(0)}px 宽、56px 高，远超 Apple 44pt 与 Material 48dp 触控底线，图文清晰且一眼看全。`;
    }

    verdictEl.textContent = verdict;
    verdictEl.classList.toggle("is-bad", bad);
    diagEl.textContent = diag;
  }

  document.getElementById("r2-minus").addEventListener("click", () => {
    count = Math.max(2, count - 1);
    render();
  });
  document.getElementById("r2-plus").addEventListener("click", () => {
    count = Math.min(8, count + 1);
    render();
  });

  rwBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      width = Number(btn.dataset.rw);
      rwBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  lblBtn.addEventListener("click", () => {
    showLabels = !showLabels;
    lblBtn.textContent = `文字标签：${showLabels ? "开" : "关"}`;
    lblBtn.setAttribute("aria-pressed", String(showLabels));
    lblBtn.classList.toggle("is-on", showLabels);
    render();
  });

  padBtn.addEventListener("click", () => {
    showPad = !showPad;
    padBtn.setAttribute("aria-pressed", String(showPad));
    padBtn.classList.toggle("is-on", showPad);
    render();
  });

  render();
}

// ---------- 03 三类产品的底栏变体（深海石板暗室） ----------
export function initArchetypeTheater() {
  const host = document.getElementById("archetype-theater");
  const callout = document.getElementById("v3-callout");
  const styleBtns = [...document.querySelectorAll("[data-vstyle]")];
  const mixBtn = document.getElementById("v3-mix-action");

  let activeStyle = "underline";
  let mixAction = false;
  const sel = { browse: 0, tasks: 0, explore: 1 };

  const CARDS = [
    {
      key: "browse",
      zh: "内容浏览类",
      en: "BROWSE",
      terra: true,
      note: "适合资讯、图库与社区应用。4 项均衡平铺，用清晰底线或胶囊标识当前所在频道。",
      tabs: ["首页", "分类", "消息", "我的"],
    },
    {
      key: "tasks",
      zh: "任务管理类",
      en: "TASKS",
      terra: false,
      hasFab: true,
      note: "在 4 个平级板块正中嵌入高对比「+」创建入口，把最高频的「新增任务」动作放在双拇指交汇处。",
      tabs: ["待办", "计划", "日历", "我的"],
    },
    {
      key: "explore",
      zh: "探索发现类",
      en: "EXPLORE",
      terra: false,
      note: "围绕「首页—探索—收藏—我的」闭环构建，高频切换无层级跳转，收藏随时可回访。",
      tabs: ["首页", "探索", "收藏", "我的"],
    },
  ];

  function render() {
    host.innerHTML = CARDS.map((c) => {
      const tabs = mixAction ? [...c.tabs.slice(0, 3), "删除此项"] : c.tabs;
      const mid = c.hasFab ? 2 : -1;
      let buttonsHtml = "";
      tabs.forEach((label, idx) => {
        if (idx === mid) {
          buttonsHtml += `<button type="button" class="tbar-btn is-fab" data-tcard="${c.key}" data-tfab="1" aria-label="新建任务">+</button>`;
        }
        const isAct = activeStyle !== "none" && sel[c.key] === idx;
        const isWrong = mixAction && idx === 3;
        const cls = [
          "tbar-btn",
          isAct ? `is-active st-${activeStyle}` : "",
          isWrong ? "is-wrong-act" : "",
        ]
          .filter(Boolean)
          .join(" ");
        buttonsHtml += `<button type="button" class="${cls}" data-tcard="${c.key}" data-tidx="${idx}"><span>${label}</span></button>`;
      });

      const curName = tabs[sel[c.key]] || tabs[0];
      return `
        <article class="theater-card">
          <div class="theater-head">
            <h3>${c.zh}</h3>
            <span>${c.en}</span>
          </div>
          <div class="theater-phone">
            <div class="tphone-screen is-${c.key}">
              <span class="tphone-badge">${c.zh}</span>
              <span class="tphone-caption">${
                mixAction && sel[c.key] === 3
                  ? "× 警报：点底栏误触发了页内删除动作！"
                  : `当前板块：${curName}`
              }</span>
            </div>
            <div class="tphone-bar ${c.terra ? "is-terra" : ""}">${buttonsHtml}</div>
          </div>
          <p class="theater-note">${c.note}</p>
        </article>
      `;
    }).join("");

    host.querySelectorAll(".tbar-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.tcard;
        if (btn.dataset.tfab) {
          callout.innerHTML = `<strong>居中「+」的边界：</strong>只有在「新建/发布/记一笔」是全产品压倒性核心动作时，才适合把唯一主动作以高对比浮钮嵌在底栏中央，其余常规导航仍应保持纯粹。`;
          return;
        }
        sel[key] = Number(btn.dataset.tidx);
        render();
      });
    });

    if (mixAction) {
      callout.innerHTML = `<strong>× 反例已开启：</strong>把「删除此项」等只作用于当前页面的破坏性/编辑性命令放进底栏，用户切着板块就可能误删内容。Apple HIG 明确规定：全局切换用底部导航栏，页内动作留给顶部或局部工具栏。`;
    } else if (activeStyle === "none") {
      callout.innerHTML = `<strong>× 关闭选中态的后果：</strong>试试分别点击三部手机的底栏——界面变了，底栏却毫无反应，人眼瞬间失去「我在哪一层」的空间定位感。`;
    } else {
      callout.innerHTML = `<strong>导航栏与工具栏的红线：</strong>Apple HIG 明确区分了 Tab Bar（切换全局板块）与 Toolbar（操作当前页面内容）。选中态（下划线、M3 胶囊或反色块）必须让当前所在板块一眼跳出。`;
    }
  }

  styleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeStyle = btn.dataset.vstyle;
      styleBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  mixBtn.addEventListener("click", () => {
    mixAction = !mixAction;
    mixBtn.setAttribute("aria-pressed", String(mixAction));
    render();
  });

  render();
}

// ---------- 04 从哪来：历史年代轨与演变线框 ----------
export function initTimelineSection() {
  const ERAS = [
    {
      year: "1954",
      short: "菲茨定律奠基",
      title: "Paul M. Fitts 发表人类运动容量论文",
      meta: "Journal of Experimental Psychology · 47(6)",
      body: "保罗·菲茨通过反复点击实验证明：手部移动时间取决于「到目标的距离」与「目标宽度」之比。半个世纪后，这成为移动端将高频导航下沉至屏底、并扩大点击槽宽的底层数学依据。",
      source: "核实来源：Paul M. Fitts (1954), doi:10.1037/h0055392",
      wire: "fitts",
    },
    {
      year: "2007",
      short: "iPhone Tab Bar",
      title: "初代 iPhone OS 确立移动端底部标签栏",
      meta: "Apple iPhone OS 1.0 & Human Interface Guidelines",
      body: "2007 年初代 iPhone 在电话、邮件、iPod 等核心系统应用中统一采用底部 Tab Bar，将 3–5 个顶级视图固定在屏幕最下沿，并在苹果人机界面指南中立下 44×44 pt 触控目标与「只做导航、不做页内动作」的长期规范。",
      source: "核实来源：Apple Human Interface Guidelines — Tab Bars",
      wire: "ios2007",
    },
    {
      year: "2013",
      short: "1,333 人握姿实测",
      title: "Steven Hoober 公布真实手机握持田野调查",
      meta: "UXmatters · 2013 年 2 月",
      body: "研究者 Steven Hoober 走上街头、机场与车站观察 1,333 名真实用户，发现 49% 为单手拇指操作、36% 为单手托握、15% 为双手操作。这一实证研究首次把「拇指自然活动扇区」带进了大众设计视野。",
      source: "核实来源：Steven Hoober (2013), UXmatters — How Do Users Really Hold Mobile Devices?",
      wire: "hoober",
    },
    {
      year: "2015",
      short: "显性胜过隐藏",
      title: "Josh Clark《触控设计》与 LukeW 打破汉堡抽屉迷信",
      meta: "A Book Apart (2015) · Luke Wroblewski (2015)",
      body: "2015 年成为移动导航转折点：Josh Clark 在《Designing for Touch》中系统绘制大屏拇指热区；同年 Luke Wroblewski 提出「Obvious Always Wins（显性永远胜出）」，以 Facebook iOS 与 Redbooth 的真实案例指出——把核心板块藏进左上汉堡抽屉会让人「看不见就想不起」，改回底部导航后访问与切换显著回升。",
      source: "核实来源：Josh Clark (2015) Designing for Touch；Luke Wroblewski (2015) Obvious Always Wins",
      wire: "obvious",
    },
    {
      year: "2016",
      short: "Android 正式收录",
      title: "Google Material Design 正式加入 Bottom Navigation",
      meta: "Material Design 规范更新 · 2016 年 3 月",
      body: "早期 Android 长期推崇顶部标签与左侧抽屉、一度不鼓励底栏。2016 年 3 月，随着手机屏幕越做越大、单手够顶角越来越难，Google 正式在 Material Design 中确立 Bottom Navigation 组件，明确 3–5 个顶级目的地与 56dp 高度，iOS 与 Android 两大生态由此合流。",
      source: "核实来源：Google Material Design 2016 年 3 月规范更新",
      wire: "md2016",
    },
    {
      year: "2023",
      short: "M3 与 WCAG 2.2",
      title: "Material 3 导航胶囊与无障碍触控底线入标",
      meta: "Material Design 3 · W3C WCAG 2.2 (2023)",
      body: "Material Design 3 将底栏更名为 Navigation Bar，引入高辨识度的激活胶囊与 48×48 dp 触控热区，并要求在平板与宽屏自动切换为侧边导航轨；同年 W3C 发布的 WCAG 2.2 新增 2.5.8 准则，正式把指针目标最小尺寸写入无障碍标准（AA 24px / AAA 44px）。",
      source: "核实来源：m3.material.io/components/navigation-bar/guidelines；W3C WCAG 2.2 SC 2.5.8",
      wire: "m3",
    },
  ];

  const track = document.getElementById("timeline-track");
  const detail = document.getElementById("timeline-detail");
  const wire = document.getElementById("timeline-wireframe");
  let active = 0;

  function drawWire(kind) {
    if (kind === "fitts") {
      return `<svg viewBox="0 0 210 180" width="210" height="180">
        <rect x="8" y="8" width="194" height="164" rx="14" fill="#F9F4EC" stroke="#B8D2E8" stroke-width="2"/>
        <circle cx="44" cy="128" r="14" fill="#62A1D6"/>
        <line x1="58" y1="120" x2="152" y2="56" stroke="#C6502D" stroke-width="2.5" stroke-dasharray="5 4"/>
        <rect x="148" y="34" width="38" height="38" rx="8" fill="#C6502D"/>
        <text x="105" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#9B391B">距离 D</text>
        <text x="167" y="88" text-anchor="middle" font-size="11" font-weight="700" fill="#141413">宽 W</text>
        <text x="105" y="156" text-anchor="middle" font-size="11" fill="#5C5852">D 越短、W 越宽，触达越快</text>
      </svg>`;
    }
    if (kind === "ios2007") {
      return `<svg viewBox="0 0 150 220" width="150" height="220">
        <rect x="12" y="8" width="126" height="204" rx="22" fill="#141413"/>
        <rect x="20" y="26" width="110" height="158" rx="4" fill="#FCF9F4"/>
        <rect x="20" y="26" width="110" height="20" fill="#62A1D6"/>
        <rect x="20" y="152" width="110" height="32" fill="#2A2B2E"/>
        <rect x="26" y="156" width="22" height="24" rx="4" fill="#62A1D6"/>
        <circle cx="63" cy="168" r="5" fill="#B8C4D0"/><circle cx="88" cy="168" r="5" fill="#B8C4D0"/><circle cx="113" cy="168" r="5" fill="#B8C4D0"/>
        <circle cx="75" cy="198" r="8" fill="none" stroke="#8C939A" stroke-width="1.6"/>
      </svg>`;
    }
    if (kind === "hoober") {
      return `<svg viewBox="0 0 160 220" width="160" height="220">
        <rect x="18" y="10" width="124" height="200" rx="22" fill="#62A1D6"/>
        <rect x="25" y="18" width="110" height="184" rx="16" fill="#FCF9F4"/>
        <path d="M135 202 L25 202 L25 142 A112 112 0 0 1 135 94 Z" fill="rgba(25,107,78,0.25)"/>
        <path d="M25 142 A112 112 0 0 1 135 94" fill="none" stroke="#196B4E" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="80" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#9B391B">49% 单手</text>
        <text x="80" y="84" text-anchor="middle" font-size="11" fill="#5C5852">36% 托握 · 15% 双手</text>
        <rect x="25" y="168" width="110" height="34" rx="8" fill="#C6502D"/>
      </svg>`;
    }
    if (kind === "obvious") {
      return `<svg viewBox="0 0 210 180" width="210" height="180">
        <rect x="10" y="16" width="84" height="148" rx="14" fill="#F1E7D6" stroke="#AE2420" stroke-width="1.8"/>
        <rect x="20" y="28" width="16" height="3" fill="#AE2420"/><rect x="20" y="34" width="16" height="3" fill="#AE2420"/><rect x="20" y="40" width="16" height="3" fill="#AE2420"/>
        <text x="52" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="#AE2420">藏进抽屉</text>
        <text x="105" y="94" text-anchor="middle" font-size="18" font-weight="800" fill="#141413">→</text>
        <rect x="116" y="16" width="84" height="148" rx="14" fill="#FCF9F4" stroke="#196B4E" stroke-width="2"/>
        <text x="158" y="88" text-anchor="middle" font-size="11" font-weight="700" fill="#196B4E">摊在底栏</text>
        <rect x="122" y="132" width="72" height="24" rx="6" fill="#C6502D"/>
      </svg>`;
    }
    if (kind === "md2016") {
      return `<svg viewBox="0 0 160 220" width="160" height="220">
        <rect x="18" y="10" width="124" height="200" rx="20" fill="#62A1D6"/>
        <rect x="25" y="18" width="110" height="184" rx="14" fill="#FCF9F4"/>
        <rect x="25" y="18" width="110" height="32" fill="#3E82BE"/>
        <rect x="36" y="64" width="88" height="40" rx="6" fill="#F1E7D6"/>
        <rect x="36" y="114" width="88" height="32" rx="6" fill="#EAF2F8"/>
        <rect x="25" y="166" width="110" height="36" fill="#FFFFFF" stroke="#DFD5C5"/>
        <circle cx="44" cy="184" r="6" fill="#C6502D"/>
        <circle cx="70" cy="184" r="5" fill="#9AA5B1"/>
        <circle cx="94" cy="184" r="5" fill="#9AA5B1"/>
        <circle cx="118" cy="184" r="5" fill="#9AA5B1"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 160 220" width="160" height="220">
      <rect x="18" y="10" width="124" height="200" rx="22" fill="#62A1D6"/>
      <rect x="25" y="18" width="110" height="184" rx="16" fill="#FCF9F4"/>
      <rect x="36" y="36" width="88" height="86" rx="12" fill="#EAF2F8"/>
      <rect x="25" y="156" width="110" height="46" rx="10" fill="#C6502D"/>
      <rect x="32" y="164" width="28" height="16" rx="8" fill="rgba(255,255,255,0.34)"/>
      <circle cx="46" cy="172" r="4" fill="#FFFFFF"/>
      <circle cx="74" cy="172" r="4" fill="rgba(255,255,255,0.72)"/>
      <circle cx="98" cy="172" r="4" fill="rgba(255,255,255,0.72)"/>
      <circle cx="120" cy="172" r="4" fill="rgba(255,255,255,0.72)"/>
      <text x="80" y="194" text-anchor="middle" font-size="9.5" font-weight="700" fill="#FFFFFF">M3 胶囊 · ≥48dp</text>
    </svg>`;
  }

  function render() {
    track.innerHTML = ERAS.map(
      (e, i) => `
      <button type="button" class="era-btn ${i === active ? "is-active" : ""}" data-era="${i}" role="tab" aria-selected="${i === active}">
        <span class="era-year">${e.year}</span>
        <span class="era-short">${e.short}</span>
      </button>
    `
    ).join("");

    track.querySelectorAll(".era-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        active = Number(btn.dataset.era);
        render();
      });
    });

    const cur = ERAS[active];
    detail.innerHTML = `
      <span class="timeline-meta">${cur.year} · ${cur.meta}</span>
      <h3>${cur.title}</h3>
      <p>${cur.body}</p>
      <div class="timeline-source">${cur.source}</div>
    `;
    wire.innerHTML = drawWire(cur.wire);
  }

  render();
}

// ---------- 05 什么时候别用：三工况产品分诊矩阵 ----------
export function initTriageSection() {
  const resultEl = document.getElementById("triage-result");
  const opts = [...document.querySelectorAll(".topt")];
  const pick = { device: "mobile", count: "mid", task: "switch" };

  function render() {
    let stay = false;
    let verdict = "";
    let title = "";
    let body = "";
    let link = null;

    if (pick.device === "desktop") {
      verdict = "建议换布局";
      if (pick.task === "master") {
        title = "改用 267 列表—详情布局 + 左侧导航";
        body = "宽屏有充裕的横向空间，把列表和详情左右并排展示远比底部来回切屏高效，鼠标也无需跨屏跑到底沿。";
        link = { text: "前往 267 列表—详情布局 →", href: "https://layout.xiaoxiaodong.ai/267/play/" };
      } else if (pick.count === "many") {
        title = "改用 258 侧边栏页面";
        body = "桌面端面对 6 个以上高频频道与层级目录时，固定左侧栏最贴近横向视野起点，也避开了操作系统底栏。";
        link = { text: "前往 258 侧边栏页面 →", href: "https://layout.xiaoxiaodong.ai/258/play/" };
      } else {
        title = "改用 262 顶部导航布局";
        body = "桌面浏览器中，用户习惯从左上角开始扫视，3–5 个顶级频道放在顶栏既清晰又不和系统任务栏冲突。";
        link = { text: "前往 262 顶部导航布局 →", href: "https://layout.xiaoxiaodong.ai/262/play/" };
      }
    } else if (pick.task === "funnel") {
      verdict = "此时应隐藏底栏";
      title = "改用单线聚焦流（隐藏全局底栏）";
      body = "进入沉浸式长文阅读、视频全屏或结账表单步骤时，常驻底栏既浪费屏高又容易诱导中途跳出，只留左上返回与主提交钮即可。";
      link = { text: "看看 255 单列页面 →", href: "https://layout.xiaoxiaodong.ai/255/play/" };
    } else if (pick.device === "mobileweb") {
      verdict = "慎用固定底栏";
      title = "优先考虑顶部导航或轻抽屉";
      body = "手机 Safari / Chrome 底部已有系统工具条和手势条，再叠一层固定底栏极易误触或被浏览器自动收放挡住。仅在类 App 的高频 Web 应用里才谨慎启用。";
      link = { text: "对照 262 顶部导航布局 →", href: "https://layout.xiaoxiaodong.ai/262/play/" };
    } else if (pick.count === "two") {
      verdict = "大材小用";
      title = "改用 265 标签页布局";
      body = "全应用只有 1–2 个视图时，底栏会显得空荡且白占视口高度。放在上方的标签页或分段切换器更轻盈。";
      link = { text: "前往 265 标签页布局 →", href: "https://layout.xiaoxiaodong.ai/265/play/" };
    } else if (pick.count === "many") {
      verdict = "超出容量上限";
      title = "用 263 导航抽屉收纳次级频道";
      body = "超过 5 个顶级入口硬塞进底栏会让触控热区撞车。要么把核心压回 4–5 项、其余收进「我的」，要么改用侧滑导航抽屉承载多层目录。";
      link = { text: "前往 263 导航抽屉布局 →", href: "https://layout.xiaoxiaodong.ai/263/play/" };
    } else {
      stay = true;
      verdict = "最适合 264 底部导航";
      title = "直接采用 264 底部导航布局";
      body = "手机竖屏 App + 3–5 个高频平级板块 + 频繁往返切换——这正是底部导航的主场：单手拇指一步到位、常驻不失锚、每个板块一眼可见。";
    }

    resultEl.innerHTML = `
      <span class="tr-verdict ${stay ? "" : "is-switch"}">${verdict}</span>
      <h3>${title}</h3>
      <p>${body}</p>
      ${link ? `<a class="tr-link" href="${link.href}" target="_blank" rel="noopener">${link.text}</a>` : ""}
    `;
  }

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.tk;
      pick[k] = btn.dataset.tv;
      opts
        .filter((b) => b.dataset.tk === k)
        .forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  render();
}

// ---------- 06 一眼挑出好底栏：两道单变量对比练习 ----------
export function initQuizSection() {
  const host = document.getElementById("quiz-stack");

  const QUESTIONS = [
    {
      id: "q1",
      title: "第 1 题：为一款手机阅读 App 选定底部导航的入口规模",
      varNote: "单变量：入口数量与排列方式（屏宽均为 375px、图文与高亮完全一致）",
      correct: "B",
      options: [
        {
          key: "A",
          desc: "底部常驻 2 项",
          slots: ["阅读", "我的"],
          sel: 0,
        },
        {
          key: "B",
          desc: "底部常驻 4 项",
          slots: ["书架", "发现", "消息", "我的"],
          sel: 0,
        },
        {
          key: "C",
          desc: "底部并排 7 项",
          slots: ["书架", "发现", "榜单", "消息", "设置", "客服", "我的"],
          sel: 0,
        },
        {
          key: "D",
          desc: "底部 6 项横向滑出屏外",
          slots: ["书架", "发现", "听书", "笔记", "消息", "我的"],
          sel: 0,
          clip: true,
        },
      ],
      explain:
        "正确答案是 B。4 个高频平级板块落在 Apple HIG 与 Material Design 3 共同推荐的 3–5 项黄金窗内，375px 屏上每格宽约 93px，拇指单手点击宽裕且一眼看全。A 只有 2 项却常驻整条底栏，不如用 265 标签页；C 把设置、客服塞进来挤成 7 项，单格只剩约 53px 极易误触；D 把后两项藏在横向滑动外，违背了底部导航「始终可见、稳定锚定」的核心原则。",
    },
    {
      id: "q2",
      title: "第 2 题：四套同样 4 项贴底的笔记应用底栏，哪一套最不易迷路和误操作？",
      varNote: "单变量：选中态与导航职责纯度（屏宽、项数、高度完全一致）",
      correct: "C",
      options: [
        {
          key: "A",
          desc: "4 项图文全等展示，无底线或高亮区分",
          slots: [
            { icon: "note", text: "笔记" },
            { icon: "grid", text: "分类" },
            { icon: "spark", text: "灵感" },
            { icon: "user", text: "我的" },
          ],
          sel: -1,
        },
        {
          key: "B",
          desc: "4 项仅展示抽象图形符号，隐藏中文名",
          slots: [
            { icon: "note", text: "" },
            { icon: "grid", text: "" },
            { icon: "spark", text: "" },
            { icon: "user", text: "" },
          ],
          sel: 1,
        },
        {
          key: "C",
          desc: "4 个平级板块，配短中文与选中底线",
          slots: [
            { icon: "note", text: "笔记" },
            { icon: "grid", text: "分类" },
            { icon: "spark", text: "灵感" },
            { icon: "user", text: "我的" },
          ],
          sel: 1,
        },
        {
          key: "D",
          desc: "3 个板块加 1 个「删本页」操作按钮",
          slots: [
            { icon: "note", text: "笔记" },
            { icon: "grid", text: "分类" },
            { icon: "user", text: "我的" },
            { icon: "trash", text: "删本页" },
          ],
          sel: 0,
        },
      ],
      explain:
        "正确答案是 C。C 保留了 4 个纯粹的平级大板块，既有简短中文消除图标歧义，又有明确的当前选中底线回答「我现在在哪」。A 缺少选中态会让用户失去空间位置感；B 省掉文字标签迫使用户猜抽象符号；D 混淆了导航栏与工具栏的职责，把只针对当前页的破坏性操作塞进全局底栏，极易引发误删。",
    },
  ];

  const picked = {};

  function render() {
    host.innerHTML = QUESTIONS.map((q) => {
      const userKey = picked[q.id];
      const optsHtml = q.options
        .map((opt) => {
          let cls = "qopt";
          if (userKey) {
            if (opt.key === q.correct) cls += " is-right";
            else if (opt.key === userKey) cls += " is-wrong";
          }
          const slotsHtml = opt.slots
            .map((s, i) => {
              const inner =
                typeof s === "string"
                  ? `<span>${s}</span>`
                  : `${miniIconSvg(s.icon, 13)}${s.text ? `<span>${s.text}</span>` : ""}`;
              return `<span class="qopt-slot ${i === opt.sel ? "is-sel" : ""}">${inner}</span>`;
            })
            .join("");
          return `
            <button type="button" class="${cls}" data-qid="${q.id}" data-okey="${opt.key}">
              <span class="qopt-letter">选项 ${opt.key}</span>
              <span class="qopt-mock" aria-hidden="true">
                <span class="qopt-body"><i></i><i></i><i></i></span>
                <span class="qopt-bar ${opt.clip ? "is-scroll-clip" : ""}">${slotsHtml}</span>
              </span>
              <span class="qopt-desc">${opt.desc}</span>
            </button>
          `;
        })
        .join("");

      const fb = userKey
        ? `<div class="quiz-feedback"><strong>${
            userKey === q.correct ? `答对了（选项 ${q.correct}）：` : `你选了 ${userKey}，更稳妥的是选项 ${q.correct}：`
          }</strong>${q.explain}</div>`
        : `<div class="quiz-feedback" hidden></div>`;

      return `
        <article class="quiz-box">
          <div class="quiz-q-head">
            <h3>${q.title}</h3>
            <span class="quiz-var-tag">${q.varNote}</span>
          </div>
          <div class="quiz-options">${optsHtml}</div>
          ${fb}
        </article>
      `;
    }).join("");

    host.querySelectorAll(".qopt").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked[btn.dataset.qid] = btn.dataset.okey;
        render();
      });
    });
  }

  render();
}
