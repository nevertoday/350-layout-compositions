// 093 正文 01–07 节全部独立交互实验与原海报看图灯箱
// 相邻两节绝不用同一种控件：
// 01 真实计时视觉搜索游戏 | 02 100点资源配额步进盘 | 03 三把手术刀+可拖对比幕帘
// 04 历史脉络案例图解+透视叠加 | 05 四项需求分诊评估 | 06 单变量四选一海报考题 | 07 原海报灯箱

import { clamp } from "./model.js";

// ==================== 01 节：前注意凸显视觉搜索测速实验 ====================
export function initPopoutLab() {
  const host = document.getElementById("popout-field");
  const modeBtns = [...document.querySelectorAll("[data-pop-mode]")];
  const countBtns = [...document.querySelectorAll("[data-pop-count]")];
  const startBtn = document.getElementById("popout-start");
  const statusEl = document.getElementById("popout-status");
  const logEl = document.getElementById("popout-log");
  if (!host) return;

  let mode = "single"; // "single" | "dual" | "conjunction"
  let count = 28;
  let roundStart = 0;
  let active = false;
  const records = { single: [], dual: [], conjunction: [] };

  const MODE_DESC = {
    single: "单一钴蓝圆点（唯一高饱和色），无论干扰物是 12 个还是 48 个，大脑前注意通道都能一眼锁定。",
    dual: "画面同时塞入钴蓝圆与刺眼朱红圆两个高饱和焦点，第一眼会被拉扯分神。",
    conjunction: "目标仍是钴蓝圆，但周围混满「钴蓝方」与「炭灰圆」——单一特征不再独占，只能逐行串行搜寻。",
  };

  // 用伪随机确定性网格抖动，避免元素重叠，开屏即可直接点击
  function buildRound(startTimer = false) {
    const cols = count === 12 ? 4 : count === 28 ? 7 : 8;
    const rows = Math.ceil(count / cols);
    const seedBase = (Date.now() % 97) + count * 7 + (mode === "single" ? 3 : mode === "dual" ? 11 : 19);
    const targetIdx = (seedBase * 13 + 5) % count;
    const rivalIdx = (targetIdx + Math.floor(count / 2) + 1) % count;

    host.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 280");
    svg.setAttribute("class", "popout-svg");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "视觉搜索测试场：请点击唯一的钴蓝圆形目标");

    const cellW = 540 / cols;
    const cellH = 232 / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = (((i * 37 + seedBase * 11) % 19) - 9) * (cellW * 0.025);
      const jitterY = (((i * 53 + seedBase * 7) % 17) - 8) * (cellH * 0.025);
      const cx = 30 + (col + 0.5) * cellW + jitterX;
      const cy = 24 + (row + 0.5) * cellH + jitterY;
      const isTarget = i === targetIdx;
      const isDualRival = mode === "dual" && i === rivalIdx;
      const isBlueSquare = mode === "conjunction" && !isTarget && i % 2 === 0;

      const g = document.createElementNS(ns, "g");
      g.setAttribute("class", isTarget ? "pop-item is-target" : "pop-item");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", isTarget ? "目标：钴蓝圆" : "次要元素");

      const r = count === 48 ? 10.5 : count === 28 ? 13 : 16;
      // 加宽透明点击热区便于触屏点击
      const hit = document.createElementNS(ns, "circle");
      hit.setAttribute("cx", cx.toFixed(1));
      hit.setAttribute("cy", cy.toFixed(1));
      hit.setAttribute("r", String(Math.max(18, r + 6)));
      hit.setAttribute("fill", "transparent");
      g.appendChild(hit);

      if (isBlueSquare) {
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", (cx - r * 0.92).toFixed(1));
        rect.setAttribute("y", (cy - r * 0.92).toFixed(1));
        rect.setAttribute("width", (r * 1.84).toFixed(1));
        rect.setAttribute("height", (r * 1.84).toFixed(1));
        rect.setAttribute("fill", "#0A4CF7");
        g.appendChild(rect);
      } else {
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", cx.toFixed(1));
        c.setAttribute("cy", cy.toFixed(1));
        c.setAttribute("r", r.toFixed(1));
        if (isTarget) {
          c.setAttribute("fill", "#0A4CF7");
        } else if (isDualRival) {
          c.setAttribute("fill", "#D63424");
          c.setAttribute("r", (r * 1.15).toFixed(1));
        } else {
          c.setAttribute("fill", mode === "conjunction" ? "#5A6070" : "#BEB5A2");
        }
        g.appendChild(c);
      }

      const pick = () => {
        if (!isTarget) {
          statusEl.textContent = isDualRival
            ? "点中了抢戏的朱红干扰焦！这正是多焦分流造成的误判——继续找出那枚钴蓝圆。"
            : "那是次要干扰元素，请继续点击画面里唯一的「钴蓝圆形」。";
          g.classList.add("is-wrong");
          return;
        }
        const elapsed = active ? Math.max(80, Math.round(performance.now() - roundStart)) : 320;
        active = false;
        records[mode].push({ count, ms: elapsed });
        g.classList.add("is-hit");
        const avg = Math.round(records[mode].reduce((a, b) => a + b.ms, 0) / records[mode].length);
        statusEl.textContent = `命中！本次耗时 ${elapsed} 毫秒（${mode === "single" ? "单特征独焦" : mode === "dual" ? "双焦分流" : "特征混杂"}，${count} 枚元素，均时 ${avg} ms）。换一种模式或加到 48 枚再试。`;
        renderLog();
      };

      g.addEventListener("click", pick);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
      svg.appendChild(g);
    }

    host.appendChild(svg);
    active = true;
    roundStart = performance.now();
    if (!startTimer) {
      statusEl.textContent = `已就绪（${count} 枚元素）：${MODE_DESC[mode]} 直接点击其中的「钴蓝圆形」测速。`;
    } else {
      statusEl.textContent = `计时中（${count} 枚）：立刻点击画面里唯一的「钴蓝圆形」！`;
    }
  }

  function renderLog() {
    if (!logEl) return;
    const rows = [
      ["single", "单特征独焦"],
      ["dual", "双焦分流"],
      ["conjunction", "多特征混杂"],
    ];
    logEl.innerHTML = rows
      .map(([k, label]) => {
        const list = records[k];
        if (!list.length) {
          return `<div class="pop-stat"><span class="pop-stat-label">${label}</span><span class="pop-stat-bar"><span style="width:0%"></span></span><span class="pop-stat-val">待测</span></div>`;
        }
        const avg = Math.round(list.reduce((a, b) => a + b.ms, 0) / list.length);
        const pct = clamp((avg / 1800) * 100, 12, 100);
        return `<div class="pop-stat"><span class="pop-stat-label">${label}</span><span class="pop-stat-bar"><span class="bar-${k}" style="width:${pct.toFixed(0)}%"></span></span><span class="pop-stat-val">${avg} ms (${list.length}次)</span></div>`;
      })
      .join("");
  }

  modeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.popMode;
      modeBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      buildRound(true);
    }),
  );
  countBtns.forEach((b) =>
    b.addEventListener("click", () => {
      count = Number(b.dataset.popCount);
      countBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      buildRound(true);
    }),
  );
  startBtn?.addEventListener("click", () => buildRound(true));

  renderLog();
  buildRound(false);
}

// ==================== 02 节：100 点视觉资源配额盘 ====================
export function initBudgetLab() {
  const preview = document.getElementById("budget-preview");
  const verdict = document.getElementById("budget-verdict");
  const remainEl = document.getElementById("budget-remain");
  const presetBtns = [...document.querySelectorAll("[data-budget-preset]")];
  const stepBtns = [...document.querySelectorAll("[data-budget-key]")];
  if (!preview) return;

  const TOTAL = 100;
  const state = { size: 30, chroma: 30, restraint: 25, lead: 15 };

  const PRESETS = {
    flat: { size: 25, chroma: 10, restraint: 10, lead: 10 },     // 剩余全被装饰抢走
    balanced: { size: 30, chroma: 30, restraint: 25, lead: 15 }, // 原海报 80/20 押注
    giant: { size: 70, chroma: 10, restraint: 10, lead: 10 },    // 只会放大不会减噪
  };

  function render() {
    const used = state.size + state.chroma + state.restraint + state.lead;
    const waste = TOTAL - used; // 未分配到聚焦杠杆的点数会变成干扰装饰
    if (remainEl) remainEl.textContent = `已投入聚焦 ${used} / ${TOTAL} 点（环境杂讯 ${waste} 点）`;

    for (const k of Object.keys(state)) {
      const valEl = document.getElementById(`bv-${k}`);
      const barEl = document.getElementById(`bb-${k}`);
      if (valEl) valEl.textContent = `${state[k]} 点`;
      if (barEl) barEl.style.width = `${state[k]}%`;
    }

    // 根据四项真实点数绘制即时对比海报 SVG
    const heroR = clamp(18 + state.size * 0.95, 16, 76);
    const sat = clamp(state.chroma / 32, 0.08, 1);
    const heroHex = sat > 0.65 ? "#0A4CF7" : sat > 0.35 ? "#4D72C8" : "#8A8F9A";
    const bgClutterAlpha = clamp((100 - state.restraint * 2.8 + waste * 0.6) / 100, 0.06, 0.85);
    const leadOpacity = clamp(state.lead / 20, 0.12, 1);
    const crowded = state.size >= 58;

    const clutterShapes = Array.from({ length: 7 }, (_, i) => {
      const xs = [54, 92, 274, 290, 74, 250, 118];
      const ys = [56, 178, 62, 168, 118, 192, 54];
      const rs = [16, 22, 18, 14, 12, 20, 15];
      const cols = ["#D65038", "#D98A2B", "#6B5E52", "#C94836", "#8B7D6B", "#BA6A32", "#7C6E60"];
      const s = rs[i] * (0.45 + bgClutterAlpha * 0.85);
      return `<circle cx="${xs[i]}" cy="${ys[i]}" r="${s.toFixed(1)}" fill="${cols[i]}" fill-opacity="${bgClutterAlpha.toFixed(2)}"/>`;
    }).join("");

    preview.innerHTML = `
      <svg viewBox="0 0 340 240" class="budget-svg" role="img" aria-label="视觉资源配额实时海报示意">
        <rect width="340" height="240" fill="#F4ECDA"/>
        ${clutterShapes}
        <path d="M 34 214 Q 112 204 172 134" fill="none" stroke="#0A4CF7" stroke-width="${(1 + leadOpacity * 2).toFixed(1)}" stroke-dasharray="5 5" opacity="${leadOpacity.toFixed(2)}"/>
        <polygon points="174,132 162,135 168,144" fill="#0A4CF7" opacity="${leadOpacity.toFixed(2)}"/>
        <circle cx="192" cy="116" r="${heroR.toFixed(1)}" fill="${heroHex}"/>
        <circle cx="192" cy="116" r="${(heroR + 14).toFixed(1)}" fill="none" stroke="${heroHex}" stroke-dasharray="4 4" opacity="0.45"/>
        <rect x="20" y="18" width="84" height="8" fill="#0B0905" opacity="${crowded ? "0.45" : "0.9"}"/>
        <rect x="20" y="32" width="54" height="4" fill="#0A4CF7"/>
      </svg>
    `;

    // 诊断结论
    let msg = "";
    if (crowded) {
      msg = `面积押了 ${state.size} 点但色度与背景克制严重缩水：主角大到顶边，却因周围杂讯仍在，只显得拥挤笨重。`;
    } else if (waste >= 35) {
      msg = `有 ${waste} 点预算泄给了无序装饰，四条聚焦杠杆平均摊薄，观者一眼找不到谁是老大。`;
    } else if (state.chroma < 20) {
      msg = `主体色度仅 ${state.chroma} 点，主角发灰融进暖米底里——没有色彩/明暗反差，其他预算事倍功半。`;
    } else if (state.restraint < 20) {
      msg = `背景克制只有 ${state.restraint} 点，配角色块仍在大声喧哗；从装饰里扣出预算给「压噪」，主角立刻跳出来。`;
    } else {
      msg = `高密度集中押注成立：主角拿稳面积（${state.size}）与色度（${state.chroma}），背景克制（${state.restraint}）清空杂讯，引导线（${state.lead}）把目光稳稳送达。`;
    }
    if (verdict) verdict.textContent = msg;
  }

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.budgetKey;
      const delta = Number(btn.dataset.delta);
      const used = state.size + state.chroma + state.restraint + state.lead;
      if (delta > 0 && used + delta > TOTAL) return;
      state[key] = clamp(state[key] + delta, 0, 75);
      render();
    });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = PRESETS[btn.dataset.budgetPreset];
      if (!p) return;
      Object.assign(state, p);
      presetBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      render();
    });
  });

  render();
}

// ==================== 03 节（暗室）：次要弱化三把手术刀 + 可拖对比幕帘 ====================
export function initScalpelLab() {
  const wrap = document.getElementById("curtain-wrap");
  const afterClip = document.getElementById("curtain-after");
  const handle = document.getElementById("curtain-handle");
  const slider = document.getElementById("curtain-range");
  const chips = [...document.querySelectorAll("[data-scalpel]")];
  const readout = document.getElementById("scalpel-readout");
  const afterSvgHost = document.getElementById("curtain-after-svg");
  const beforeSvgHost = document.getElementById("curtain-before-svg");
  if (!wrap || !afterClip || !afterSvgHost || !beforeSvgHost) return;

  const cuts = { desat: true, scale: true, contrast: true };
  let split = 54;

  function posterSvg({ desat, scale, contrast }) {
    const bgCol = contrast ? "#F2EAD8" : "#FFD98E";
    const stripeCol = contrast ? "rgba(18, 22, 32, 0.04)" : desat ? "rgba(50, 50, 54, 0.28)" : "rgba(220, 72, 42, 0.28)";
    const badgeFill = desat ? "#9B968B" : "#E63B28";
    const badgeScale = scale ? 0.56 : 1.05;
    const subCol = contrast ? "#64615A" : desat ? "#2B2D33" : "#D44820";
    const stampFill = desat ? "#ACA598" : "#F08C1E";
    const stampOpacity = contrast ? 0.42 : 0.95;

    return `
      <svg viewBox="0 0 560 360" class="curtain-svg" role="img" aria-label="瓷器展海报对比">
        <rect width="560" height="360" fill="${bgCol}"/>
        <!-- 装饰斜纹背景 -->
        <g stroke="${stripeCol}" stroke-width="${contrast ? 2 : 9}">
          <line x1="0" y1="60" x2="180" y2="0"/>
          <line x1="0" y1="140" x2="320" y2="0"/>
          <line x1="220" y1="360" x2="560" y2="140"/>
          <line x1="360" y1="360" x2="560" y2="230"/>
        </g>
        <!-- 左上展期次要徽章 -->
        <g transform="translate(88 86) scale(${badgeScale})">
          <circle cx="0" cy="0" r="46" fill="${badgeFill}" opacity="${stampOpacity}"/>
          <text x="0" y="-4" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="700" font-family="Noto Sans SC, sans-serif">春季特展</text>
          <text x="0" y="16" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="Inter, sans-serif">04.12–06.30</text>
        </g>
        <!-- 右上赞助标签组 -->
        <g transform="translate(466 78) scale(${badgeScale})">
          <rect x="-56" y="-26" width="112" height="52" fill="${stampFill}" opacity="${stampOpacity}"/>
          <text x="0" y="5" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">馆藏编号 93</text>
        </g>
        <!-- 左下导览文案块 -->
        <g opacity="${contrast ? "0.62" : "1"}">
          <rect x="34" y="254" width="${scale ? 110 : 168}" height="${scale ? 7 : 12}" fill="${subCol}"/>
          <rect x="34" y="274" width="${scale ? 88 : 146}" height="${scale ? 5 : 9}" fill="${subCol}"/>
          <rect x="34" y="290" width="${scale ? 72 : 128}" height="${scale ? 5 : 9}" fill="${subCol}"/>
        </g>
        <!-- 唯一主角：电光钴蓝高颈陶瓶 -->
        <g transform="translate(286 184)">
          <ellipse cx="0" cy="116" rx="70" ry="12" fill="rgba(5, 8, 16, 0.24)"/>
          <path d="M -20 -114 L 20 -114 L 16 -52 C 56 -30 68 24 52 84 C 42 104 28 112 0 112 C -28 112 -42 104 -52 84 C -68 24 -56 -30 -16 -52 Z" fill="#0844E2"/>
          <path d="M -12 -112 L -2 -112 L -6 -50 C -34 -26 -42 22 -30 78" fill="none" stroke="#6FA2FF" stroke-width="5" stroke-linecap="round" opacity="0.65"/>
          <ellipse cx="0" cy="-114" rx="20" ry="5" fill="#04227A"/>
        </g>
        <!-- 底部极简展名 -->
        <text x="286" y="336" text-anchor="middle" fill="#0B0905" font-size="16" font-weight="800" letter-spacing="3" font-family="Noto Sans SC, sans-serif">钴蓝器物展</text>
      </svg>
    `;
  }

  function render() {
    beforeSvgHost.innerHTML = posterSvg({ desat: false, scale: false, contrast: false });
    afterSvgHost.innerHTML = posterSvg(cuts);
    afterClip.style.clipPath = `inset(0 0 0 ${split}%)`;
    if (handle) handle.style.left = `${split}%`;
    if (slider) slider.value = String(split);

    const activeNames = [
      cuts.desat && "低饱和",
      cuts.scale && "小比例",
      cuts.contrast && "低对比",
    ].filter(Boolean);
    const score = (cuts.desat ? 1 : 0) + (cuts.scale ? 1 : 0) + (cuts.contrast ? 1 : 0);
    if (readout) {
      readout.textContent =
        score === 3
          ? "三把刀同时落下（低饱和 + 小比例 + 低对比）：主角本身一笔未改，却立刻从杂乱稿件中稳稳跳出。"
          : score === 0
            ? "三把刀全部关闭：右侧与左侧一样喧闹，春季特展红章与馆藏橙牌直接抢走钴蓝瓷瓶的第一眼。"
            : `当前仅启用「${activeNames.join(" + ")}」：主角略有浮现，但未弱化的维度仍在暗中抢戏。把剩余开关补齐对比看看。`;
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const k = chip.dataset.scalpel;
      cuts[k] = !cuts[k];
      chip.setAttribute("aria-pressed", String(cuts[k]));
      render();
    });
  });

  slider?.addEventListener("input", () => {
    split = Number(slider.value);
    render();
  });

  // 支持直接拖动幕帘把手
  let dragging = false;
  function updateSplitFromClientX(clientX) {
    const r = wrap.getBoundingClientRect();
    split = Math.round(clamp(((clientX - r.left) / Math.max(1, r.width)) * 100, 8, 92));
    render();
  }
  handle?.addEventListener("pointerdown", (e) => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    updateSplitFromClientX(e.clientX);
  });
  handle?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateSplitFromClientX(e.clientX);
  });
  handle?.addEventListener("pointerup", () => (dragging = false));

  render();
}

// ==================== 04 节：历史脉络案例切换 + 结构透视叠加 ====================
export function initHistoryLab() {
  const tabs = [...document.querySelectorAll("[data-hist]")];
  const overlayBtn = document.getElementById("hist-overlay-toggle");
  const svgHost = document.getElementById("hist-diagram");
  const titleEl = document.getElementById("hist-title");
  const metaEl = document.getElementById("hist-meta");
  const descEl = document.getElementById("hist-desc");
  if (!svgHost || !tabs.length) return;

  let cur = "caravaggio";
  let showOverlay = true;

  const ITEMS = {
    caravaggio: {
      title: "卡拉瓦乔《圣马太蒙召》· 明暗聚光",
      meta: "1599–1600 · 罗马圣王路易堂康塔雷利小堂",
      desc: "巴洛克暗色调主义把大片室内墙面压进深褐暗影，只放进一道右上斜射的窄光束，沿指向手势精准点亮税桌上的唯一核心人物——不用任何线框，单靠光比就完成单一焦点。",
      draw: (ov) => `
        <svg viewBox="0 0 420 260" class="hist-svg" role="img" aria-label="明暗法斜光束单一焦点结构图">
          <rect width="420" height="260" fill="#0B0C10"/>
          <polygon points="396,18 420,18 420,96 154,238 66,186" fill="#F4ECDA" opacity="0.22"/>
          <polygon points="378,24 416,52 162,202 108,162" fill="#F4ECDA" opacity="0.34"/>
          <!-- 次要暗影剪影（无五官） -->
          <ellipse cx="308" cy="186" rx="28" ry="52" fill="#1F222A"/>
          <ellipse cx="250" cy="192" rx="24" ry="44" fill="#242833"/>
          <!-- 唯一受光主角轮廓 -->
          <ellipse cx="144" cy="176" rx="26" ry="50" fill="#0A4CF7"/>
          <circle cx="144" cy="116" r="16" fill="#F4ECDA"/>
          ${ov ? `
            <line x1="386" y1="36" x2="164" y2="146" stroke="#6699FF" stroke-width="2" stroke-dasharray="5 4"/>
            <circle cx="144" cy="146" r="46" fill="none" stroke="#6699FF" stroke-width="1.6" stroke-dasharray="4 4"/>
            <text x="144" y="242" text-anchor="middle" fill="#74A3FF" font-size="11" font-family="Inter, sans-serif">LIGHT BEAM / SINGLE FOCUS</text>
          ` : ""}
        </svg>
      `,
    },
    vermeer: {
      title: "维米尔《戴珍珠耳环的少女》· 暗底提纯",
      meta: "约 1665 · 海牙莫瑞泰斯皇家美术馆（馆藏号 670）",
      desc: "舍弃荷兰风俗画里常见的地图、窗格与桌布陈设，将背景彻底沉入近黑深绿，于是整张画布的亮度峰与青金石蓝/暖黄纯度全部锁定在回眸剪影与耳际那颗高光珍珠上。",
      draw: (ov) => `
        <svg viewBox="0 0 420 260" class="hist-svg" role="img" aria-label="暗底高对比单一焦点结构图">
          <rect width="420" height="260" fill="#07090C"/>
          <!-- 抽象无五官侧影：青金石蓝头巾 + 暖黄垂带 + 珍珠亮峰 -->
          <path d="M 164 250 C 166 196 184 166 218 164 C 254 164 274 196 278 250 Z" fill="#8C7444"/>
          <path d="M 176 116 C 176 74 206 54 244 62 C 270 68 282 96 272 132 L 244 134 C 242 104 218 96 184 116 Z" fill="#0A4CF7"/>
          <path d="M 252 118 L 284 188 L 254 194 L 236 132 Z" fill="#D5B263"/>
          <ellipse cx="204" cy="126" rx="28" ry="34" fill="#E6D5BA"/>
          <circle cx="222" cy="148" r="7.5" fill="#FFFFFF"/>
          ${ov ? `
            <circle cx="222" cy="148" r="24" fill="none" stroke="#6699FF" stroke-width="1.8" stroke-dasharray="4 3"/>
            <circle cx="212" cy="126" r="64" fill="none" stroke="rgba(244,236,218,0.45)" stroke-width="1.2" stroke-dasharray="3 4"/>
            <text x="210" y="246" text-anchor="middle" fill="#74A3FF" font-size="11" font-family="Inter, sans-serif">ZERO CLUTTER GROUND · PEAK LUMINANCE</text>
          ` : ""}
        </svg>
      `,
    },
    bernhard: {
      title: "卢西安·伯恩哈德 · 物件海报（Sachplakat）",
      meta: "1906 Priester 火柴海报；MoMA 馆藏 Stiller (1908) / Manoli (1910)",
      desc: "柏林海报竞赛中，年轻的伯恩哈德把新艺术运动繁复的藤蔓、人物与长句统统涂掉，在平涂色底上只留下超大比例的单一商品主体与一个醒目品牌名——现代平面设计的单一焦点范式就此确立。",
      draw: (ov) => `
        <svg viewBox="0 0 420 260" class="hist-svg" role="img" aria-label="物件海报单主体加品牌名结构图">
          <rect width="420" height="260" fill="#F4ECDA"/>
          <!-- 极简大字品牌区 -->
          <rect x="78" y="34" width="264" height="36" fill="#0B0905"/>
          <text x="210" y="59" text-anchor="middle" fill="#F4ECDA" font-size="22" font-weight="900" letter-spacing="6" font-family="Outfit, sans-serif">SACHPLAKAT</text>
          <!-- 单一巨大几何物件（两根斜置火柴抽象构成） -->
          <g transform="translate(210 162) rotate(-14)">
            <rect x="-112" y="-16" width="204" height="16" fill="#1C1D22"/>
            <ellipse cx="96" cy="-8" rx="18" ry="12" fill="#0A4CF7"/>
            <rect x="-86" y="14" width="188" height="16" fill="#1C1D22"/>
            <ellipse cx="106" cy="22" rx="18" ry="12" fill="#0A4CF7"/>
          </g>
          ${ov ? `
            <rect x="64" y="96" width="292" height="130" fill="none" stroke="#0A4CF7" stroke-width="1.6" stroke-dasharray="5 4"/>
            <text x="210" y="245" text-anchor="middle" fill="#0634B8" font-size="11" font-family="Inter, sans-serif">1 OBJECT + 1 WORD · ZERO ORNAMENT</text>
          ` : ""}
        </svg>
      `,
    },
    science: {
      title: "鲁宾图底、阿恩海姆与显著图模型",
      meta: "1915 鲁宾 · 1954/1982 阿恩海姆 · 1980 特里斯曼 · 1998 伊蒂等",
      desc: "从鲁宾（1915）揭示大脑自动将画面拆分为「图与底」，到阿恩海姆分析视觉中心引力，再到特里斯曼（1980）前注意凸显与伊蒂、科赫、尼伯（1998）胜者通吃显著图，单一焦点构图背后是一整套人类视觉注意力机制。",
      draw: (ov) => `
        <svg viewBox="0 0 420 260" class="hist-svg" role="img" aria-label="视觉显著峰与胜者通吃图解">
          <rect width="420" height="260" fill="#0A0D14"/>
          <!-- 显著度三维等高线示意 -->
          <g fill="none" stroke="rgba(102,153,255,0.28)" stroke-width="1.2">
            <path d="M 36 200 Q 130 198 186 164 Q 214 60 242 164 Q 298 198 384 200"/>
            <path d="M 36 218 Q 130 216 186 186 Q 214 96 242 186 Q 298 216 384 218"/>
            <path d="M 36 182 Q 130 180 186 142 Q 214 34 242 142 Q 298 180 384 182"/>
          </g>
          <path d="M 52 210 Q 148 206 184 166 Q 214 42 244 166 Q 280 206 368 210 L 368 228 L 52 228 Z" fill="#0A4CF7" fill-opacity="0.32" stroke="#5E92FF" stroke-width="2"/>
          <circle cx="214" cy="64" r="9" fill="#0A4CF7" stroke="#FFFFFF" stroke-width="2"/>
          ${ov ? `
            <line x1="214" y1="64" x2="214" y2="226" stroke="#74A3FF" stroke-dasharray="4 3"/>
            <text x="214" y="42" text-anchor="middle" fill="#F4ECDA" font-size="11" font-family="Inter, sans-serif">WTA PEAK · S1 >> S2</text>
            <text x="214" y="246" text-anchor="middle" fill="#74A3FF" font-size="11" font-family="Inter, sans-serif">INTENSITY + COLOR + ORIENTATION</text>
          ` : ""}
        </svg>
      `,
    },
  };

  function render() {
    const it = ITEMS[cur];
    if (!it) return;
    titleEl.textContent = it.title;
    metaEl.textContent = it.meta;
    descEl.textContent = it.desc;
    svgHost.innerHTML = it.draw(showOverlay);
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.hist === cur)));
    if (overlayBtn) {
      overlayBtn.setAttribute("aria-pressed", String(showOverlay));
      overlayBtn.textContent = showOverlay ? "结构透视叠加：开" : "结构透视叠加：关";
    }
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      cur = t.dataset.hist;
      render();
    }),
  );
  overlayBtn?.addEventListener("click", () => {
    showOverlay = !showOverlay;
    render();
  });

  render();
}

// ==================== 05 节：四项真实需求分诊评估 ====================
export function initTriageLab() {
  const btns = [...document.querySelectorAll("[data-triage]")];
  const verdictEl = document.getElementById("triage-verdict");
  const wireEl = document.getElementById("triage-wire");
  if (!btns.length || !verdictEl || !wireEl) return;

  const CASES = {
    launch: {
      fit: true,
      badge: "强烈适合 · 单一焦点",
      title: "旗舰耳机首屏发布会页",
      why: "用户在首屏只停留 2–3 秒，唯一目标是记住产品形态与一句主张。把 70% 空间留给单只高清产品与暗底聚光，配一行标题与单个按钮，转化路径最短。",
      wire: `
        <svg viewBox="0 0 320 180" class="triage-svg" role="img" aria-label="新品首屏单一焦点线框">
          <rect width="320" height="180" fill="#090B10"/>
          <circle cx="160" cy="78" r="46" fill="#0A4CF7"/>
          <circle cx="160" cy="78" r="58" fill="none" stroke="#5E92FF" stroke-dasharray="4 4"/>
          <rect x="108" y="138" width="104" height="8" fill="#F4ECDA"/>
          <rect x="132" y="154" width="56" height="12" fill="#0A4CF7"/>
        </svg>
      `,
    },
    pricing: {
      fit: false,
      badge: "不要硬用 · 改用 094 多重焦点",
      title: "SaaS 三档付费套餐对比表",
      why: "用户来这一页就是为了横向比较基础版、专业版与企业版的参数差异。若强行把推荐档做成巨型单一焦点、把其余两档压到看不清，反而会激起防备并拖慢决策。更适合多重焦点或清晰表格并置。",
      wire: `
        <svg viewBox="0 0 320 180" class="triage-svg" role="img" aria-label="三档套餐并置对比线框">
          <rect width="320" height="180" fill="#F4ECDA"/>
          <rect x="22" y="28" width="84" height="124" fill="#FFFFFF" stroke="#1C1D22"/>
          <rect x="118" y="20" width="84" height="140" fill="#FFFFFF" stroke="#0A4CF7" stroke-width="2.5"/>
          <rect x="214" y="28" width="84" height="124" fill="#FFFFFF" stroke="#1C1D22"/>
          <rect x="34" y="46" width="60" height="8" fill="#4A4D57"/>
          <rect x="130" y="38" width="60" height="10" fill="#0A4CF7"/>
          <rect x="226" y="46" width="60" height="8" fill="#4A4D57"/>
        </svg>
      `,
    },
    book: {
      fit: true,
      badge: "非常适合 · 单一焦点",
      title: "独立书店单本新书地铁海报",
      why: "通勤走廊里行人与海报的接触往往只有一两步。一张极具辨识度的孤立意象配合极少留白文字，远比塞满十条书评和推荐语更容易被记住。",
      wire: `
        <svg viewBox="0 0 320 180" class="triage-svg" role="img" aria-label="单本新书海报线框">
          <rect width="320" height="180" fill="#F4ECDA"/>
          <rect x="122" y="26" width="76" height="106" fill="#0A4CF7"/>
          <rect x="24" y="148" width="110" height="8" fill="#0B0905"/>
          <rect x="24" y="160" width="68" height="4" fill="#6F727A"/>
        </svg>
      `,
    },
    festival: {
      fit: false,
      badge: "不要硬用 · 改用 088 晶体式平衡",
      title: "城市音乐节 24 组乐队平等阵容墙",
      why: "如果 24 组乐队权重相近、观众需要在名单里快速扫描寻找自己喜欢的名字，硬塞一个单一巨焦会破坏公平感并压缩名单字号；此时更适合均匀秩序的晶体式网格分布。",
      wire: `
        <svg viewBox="0 0 320 180" class="triage-svg" role="img" aria-label="均匀矩阵名单线框">
          <rect width="320" height="180" fill="#ECE3CF"/>
          ${Array.from({ length: 12 }, (_, i) => {
            const x = 22 + (i % 4) * 72;
            const y = 26 + Math.floor(i / 4) * 46;
            return `<rect x="${x}" y="${y}" width="60" height="34" fill="#FFFFFF" stroke="#4A4D57"/>`;
          }).join("")}
        </svg>
      `,
    },
  };

  function show(key) {
    const c = CASES[key];
    if (!c) return;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.triage === key)));
    verdictEl.innerHTML = `
      <span class="triage-pill ${c.fit ? "is-fit" : "is-no"}">${c.badge}</span>
      <h3>${c.title}</h3>
      <p>${c.why}</p>
    `;
    wireEl.innerHTML = c.wire;
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.triage)));
  show("launch");
}

// ==================== 06 节（暗室考场）：单变量四选一诊断练习 ====================
export function initQuizLab() {
  const host = document.getElementById("quiz-options");
  const fb = document.getElementById("quiz-feedback");
  if (!host || !fb) return;

  // 四版构图骨架完全一致，只差一个视觉层级变量，标签纯中性（A / B / C / D）
  const OPTIONS = [
    {
      id: "A",
      correct: false,
      reason: "方案 A 把左下「展期圆章」放大并涂成高饱和朱红，与钴蓝灯塔形成 1.1× 近似显著度——观众第一眼会在红章与蓝塔之间来回跳视，已经滑向多重焦点。",
      svg: `
        <svg viewBox="0 0 220 260" class="quiz-svg" aria-hidden="true">
          <rect width="220" height="260" fill="#F4ECDA"/>
          <path d="M0 202 L220 184 L220 260 L0 260 Z" fill="#121418"/>
          <path d="M 30 228 Q 92 214 134 190" fill="none" stroke="#F4ECDA" stroke-width="2" stroke-dasharray="4 4"/>
          <rect x="122" y="88" width="32" height="104" fill="#0A4CF7"/>
          <rect x="126" y="68" width="24" height="20" fill="#121418"/>
          <circle cx="56" cy="176" r="34" fill="#E03222"/>
          <text x="56" y="180" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">05.12</text>
          <rect x="20" y="24" width="96" height="12" fill="#0B0905"/>
          <rect x="20" y="42" width="54" height="4" fill="#0A4CF7"/>
        </svg>
      `,
    },
    {
      id: "B",
      correct: true,
      reason: "回答正确！方案 B 中唯一的高饱和与强明暗制高点完全集中给钴蓝灯塔，左下展期信息退回低饱和小字，海岸白浪曲线顺势把目光送往塔身，主次清晰、半秒定焦。",
      svg: `
        <svg viewBox="0 0 220 260" class="quiz-svg" aria-hidden="true">
          <rect width="220" height="260" fill="#F4ECDA"/>
          <path d="M0 202 L220 184 L220 260 L0 260 Z" fill="#121418"/>
          <path d="M 30 228 Q 92 214 134 190" fill="none" stroke="#F4ECDA" stroke-width="2" stroke-dasharray="4 4"/>
          <rect x="122" y="88" width="32" height="104" fill="#0A4CF7"/>
          <rect x="126" y="68" width="24" height="20" fill="#121418"/>
          <text x="20" y="188" fill="#5D6068" font-size="10" font-family="Inter, sans-serif">05.12 – 07.20</text>
          <rect x="20" y="24" width="96" height="12" fill="#0B0905"/>
          <rect x="20" y="42" width="54" height="4" fill="#0A4CF7"/>
        </svg>
      `,
    },
    {
      id: "C",
      correct: false,
      reason: "方案 C 把灯塔连同远山一起压成接近中灰的低饱和色调，虽然没有明显干扰物，但主角本身缺乏色彩与明暗反差，无法触发前注意凸显，看一眼很容易平淡滑过。",
      svg: `
        <svg viewBox="0 0 220 260" class="quiz-svg" aria-hidden="true">
          <rect width="220" height="260" fill="#D4CFC4"/>
          <path d="M0 170 L84 150 L220 162 L220 260 L0 260 Z" fill="#9E9A92"/>
          <path d="M0 202 L220 184 L220 260 L0 260 Z" fill="#6E6C68"/>
          <rect x="122" y="88" width="32" height="104" fill="#8C919C"/>
          <rect x="126" y="68" width="24" height="20" fill="#6E7076"/>
          <text x="20" y="188" fill="#4E5057" font-size="10" font-family="Inter, sans-serif">05.12 – 07.20</text>
          <rect x="20" y="24" width="96" height="12" fill="#5A5C62"/>
          <rect x="20" y="42" width="54" height="4" fill="#7D818B"/>
        </svg>
      `,
    },
    {
      id: "D",
      correct: false,
      reason: "方案 D 盲目把灯塔放大到占满近八成画幅，塔顶与两侧紧顶边缘，连标题都被压在塔身上——没有留白与大小参照，画面失去呼吸感与视觉引导路径。",
      svg: `
        <svg viewBox="0 0 220 260" class="quiz-svg" aria-hidden="true">
          <rect width="220" height="260" fill="#F4ECDA"/>
          <rect x="34" y="44" width="152" height="216" fill="#0A4CF7"/>
          <rect x="52" y="4" width="116" height="42" fill="#121418"/>
          <rect x="20" y="24" width="96" height="12" fill="#121418"/>
          <rect x="20" y="42" width="54" height="4" fill="#0A4CF7"/>
          <text x="48" y="238" fill="#F4ECDA" font-size="10" font-family="Inter, sans-serif">05.12 – 07.20</text>
        </svg>
      `,
    },
  ];

  host.innerHTML = OPTIONS.map(
    (opt) => `
      <button type="button" class="quiz-card" data-quiz="${opt.id}" aria-pressed="false">
        <span class="quiz-letter">方案 ${opt.id}</span>
        ${opt.svg}
      </button>
    `,
  ).join("");

  const cards = [...host.querySelectorAll("[data-quiz]")];
  cards.forEach((btn) => {
    btn.addEventListener("click", () => {
      const picked = OPTIONS.find((o) => o.id === btn.dataset.quiz);
      if (!picked) return;
      cards.forEach((c) => {
        const o = OPTIONS.find((x) => x.id === c.dataset.quiz);
        c.setAttribute("aria-pressed", String(c === btn));
        c.classList.remove("is-right", "is-wrong");
        if (c === btn) c.classList.add(picked.correct ? "is-right" : "is-wrong");
        else if (!picked.correct && o.correct) c.classList.add("is-right");
      });
      fb.className = `quiz-feedback ${picked.correct ? "is-right" : "is-wrong"}`;
      fb.innerHTML = `<strong>${picked.correct ? "选对了 · 方案 B" : `选了方案 ${picked.id}（正确答案是方案 B）`}</strong><p>${picked.reason}</p>`;
    });
  });
}

// ==================== 07 节：原海报放大、拖动、Esc 关闭灯箱 ====================
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const stage = document.getElementById("lightbox-stage");
  const lbImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  if (!trigger || !posterImg || !modal || !lbImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pan = null;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    lbImg.src = posterImg.currentSrc || posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = clamp(+(scale + 0.35).toFixed(2), 1, 3.2);
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = clamp(+(scale - 0.35).toFixed(2), 1, 3.2);
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      if (modal.hidden) return;
      e.preventDefault();
      scale = clamp(+(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2), 1, 3.2);
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false },
  );

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pan = { x: e.clientX - tx, y: e.clientY - ty };
    lbImg.setPointerCapture(e.pointerId);
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!pan) return;
    tx = e.clientX - pan.x;
    ty = e.clientY - pan.y;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => (pan = null));
}
