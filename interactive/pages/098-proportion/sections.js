// 098 比例 PROPORTION — 第 01 至 07 节全部独立交互实验室与原海报灯箱
// 保证相邻章节绝不使用同一种控件做同一件事。

const PHI = (1 + Math.sqrt(5)) / 2;

/* ==================== 01 屏幕缩放不变性实验 ==================== */
export function mountScaleLab() {
  const devGroup = document.getElementById("scale-devices");
  const modeGroup = document.getElementById("scale-modes");
  const stage = document.getElementById("scale-stage");
  const readout = document.getElementById("scale-readout");
  if (!devGroup || !modeGroup || !stage) return;

  const DEVICES = {
    watch: { label: "手表 40mm", w: 144, h: 174, tag: "极小屏", scale: 0.52 },
    phone: { label: "手机 390px", w: 186, h: 224, tag: "移动端", scale: 0.78 },
    desktop: { label: "桌面 1440px", w: 324, h: 210, tag: "宽屏", scale: 1.0 },
    board: { label: "展板 3m", w: 376, h: 228, tag: "远距展陈", scale: 1.18 },
  };

  let curDev = "phone";
  let curMode = "locked"; // "locked" | "fixed"

  function render() {
    const d = DEVICES[curDev];
    const vw = 560;
    const vh = 314;
    const x = Math.round((vw - d.w) / 2);
    const y = Math.round((vh - 34 - d.h) / 2) + 16;

    // 锁定比例：留白 9%、主图占 62%、标题字号 = 短边 11%、正文 = 标题 / 1.618
    // 写死绝对像素：不论载体多大，都硬塞 16px 边距、145px 图高、26px 标题
    const shortSide = Math.min(d.w, d.h);
    const isLocked = curMode === "locked";
    const pad = isLocked ? Math.round(shortSide * 0.09) : 14;
    const innerW = d.w - pad * 2;
    const innerH = d.h - pad * 2;

    const isWide = d.w > d.h * 1.15;
    let imgRect, txtRect, h1Size, bodySize, overflowWarn = "";

    if (isLocked) {
      if (isWide) {
        const mw = innerW * 0.618;
        imgRect = { x: x + pad, y: y + pad, w: mw - 6, h: innerH };
        txtRect = { x: x + pad + mw + 6, y: y + pad, w: innerW - mw - 6, h: innerH };
      } else {
        const mh = innerH * 0.618;
        imgRect = { x: x + pad, y: y + pad, w: innerW, h: mh - 6 };
        txtRect = { x: x + pad, y: y + pad + mh + 6, w: innerW, h: innerH - mh - 6 };
      }
      h1Size = Math.max(11, Math.round(shortSide * 0.1));
      bodySize = Math.max(8, Math.round(h1Size / PHI));
    } else {
      // 写死绝对像素：图高固定 130px，标题固定 24px
      const fixedH = 128;
      imgRect = { x: x + pad, y: y + pad, w: Math.min(innerW, 180), h: fixedH };
      txtRect = { x: x + pad, y: y + pad + fixedH + 10, w: innerW, h: Math.max(12, innerH - fixedH - 10) };
      h1Size = 24;
      bodySize = 11;
      if (curDev === "watch") overflowWarn = "标题与固定图块直接撞出表盘底边！";
      else if (curDev === "board") overflowWarn = "固定像素在 3m 展板上缩成左上角一小撮，右侧大片空废！";
      else if (curDev === "desktop") overflowWarn = "固定 180px 图块在宽屏上孤悬左上角，留出半屏死白。";
      else overflowWarn = "刚好凑合塞进手机，一旦换屏幕就立刻崩坏。";
    }

    const imgPct = Math.round(((imgRect.w * imgRect.h) / (innerW * innerH)) * 100);
    const ratioStr = isLocked ? "主图 62% · 字阶 1.62×" : `主图实占 ${imgPct}% · 固定 24px`;

    stage.innerHTML = `
      <svg viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${d.label}在${isLocked ? "锁定比例" : "固定像素"}下的版面表现">
        <rect width="${vw}" height="${vh}" fill="#FBF2E3"/>
        <text x="16" y="22" font-family="Manrope, Noto Sans SC, sans-serif" font-size="12" font-weight="800" fill="#175957">${d.label}（${d.tag}）</text>
        <text x="${vw - 16}" y="22" text-anchor="end" font-family="Manrope, Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="${isLocked ? "#136349" : "#B23024"}">${ratioStr}</text>

        <!-- 载体外框 -->
        <rect x="${x}" y="${y}" width="${d.w}" height="${d.h}" fill="#FFF9EF" stroke="${isLocked ? "#222423" : "#B23024"}" stroke-width="2"/>
        <!-- 呼吸留白虚线框 -->
        <rect x="${x + pad}" y="${y + pad}" width="${innerW}" height="${innerH}" fill="none" stroke="rgba(38,125,123,0.4)" stroke-dasharray="4 3"/>

        <!-- 主视觉块 -->
        <rect x="${imgRect.x}" y="${imgRect.y}" width="${imgRect.w}" height="${imgRect.h}" fill="#267D7B"/>
        <circle cx="${imgRect.x + imgRect.w * 0.7}" cy="${imgRect.y + imgRect.h * 0.62}" r="${Math.max(8, Math.min(imgRect.w, imgRect.h) * 0.22)}" fill="#F0A63D"/>

        <!-- 文字与信息区 -->
        <rect x="${txtRect.x}" y="${txtRect.y}" width="${Math.max(24, Math.min(txtRect.w, h1Size * 4.4))}" height="${h1Size}" fill="${!isLocked && curDev === "watch" ? "#B23024" : "#222423"}"/>
        <rect x="${txtRect.x}" y="${txtRect.y + h1Size + 6}" width="${Math.max(18, txtRect.w * 0.85)}" height="${bodySize}" fill="#6EA19C"/>
        <rect x="${txtRect.x}" y="${txtRect.y + h1Size + bodySize + 11}" width="${Math.max(14, txtRect.w * 0.62)}" height="${bodySize}" fill="#95BBB3"/>

        <!-- 底部标尺 -->
        <line x1="${x}" y1="${y + d.h + 14}" x2="${x + d.w}" y2="${y + d.h + 14}" stroke="#4E5653" stroke-dasharray="4 3"/>
        <line x1="${x}" y1="${y + d.h + 9}" x2="${x}" y2="${y + d.h + 19}" stroke="#4E5653"/>
        <line x1="${x + d.w}" y1="${y + d.h + 9}" x2="${x + d.w}" y2="${y + d.h + 19}" stroke="#4E5653"/>
        <rect x="${vw / 2 - 44}" y="${y + d.h + 6}" width="88" height="16" fill="#FBF2E3"/>
        <text x="${vw / 2}" y="${y + d.h + 18}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">${d.label}</text>
      </svg>
    `;

    readout.textContent = isLocked
      ? `锁定比例（主区 62%、留白 9%、字阶 1.62×）：换到「${d.label}」后，虽然实际毫米与像素全部变了，但眼睛读到的主次、留白和节奏完全没走样。`
      : `写死绝对像素（固定 180×128px 图块 + 24px 标题）：在「${d.label}」下——${overflowWarn} 这证明好坏不在绝对尺寸，而在相对比例。`;
  }

  devGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dev]");
    if (!btn) return;
    curDev = btn.dataset.dev;
    devGroup.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });

  modeGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    curMode = btn.dataset.mode;
    modeGroup.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });

  render();
}

/* ==================== 02 比例标本叠合与对折检验 ==================== */
export function mountFoldLab() {
  const pillsEl = document.getElementById("ratio-pills");
  const svg = document.getElementById("fold-svg");
  const btnFold = document.getElementById("btn-fold");
  const btnGhost = document.getElementById("btn-ghost-all");
  const factsEl = document.getElementById("ratio-facts");
  if (!pillsEl || !svg || !btnFold) return;

  const ITEMS = [
    { id: "1:1", label: "1 : 1", r: 1.0, interval: "同度（Unison）", use: "徽标、专辑封套、九宫格卡片", afterNote: "对折后变成 2 : 1（两个细长半片），比例彻底改变。" },
    { id: "4:5", label: "4 : 5", r: 1.25, interval: "大三度（5:4）", use: "社媒竖图、肖像摄影、产品主图", afterNote: "对折后变成 8 : 5（1.60:1），有趣的是恰好落进 5:8 斐波那契比例！" },
    { id: "3:4", label: "3 : 4", r: 4 / 3, interval: "纯四度（4:3）", use: "经典展览海报、平板屏幕、画册单页", afterNote: "对折后变成 3 : 2（1.50:1），立刻跨入古典书籍的纯五度比例。" },
    { id: "sqrt2", label: "1 : √2", r: Math.SQRT2, interval: "白银比（A4 / ISO 216）", use: "A 系列国际标准纸张、办公文档与折页", afterNote: "唯一奇迹：沿长边对折后依然严格等于 1 : √2（1.414:1）！A3 折成 A4 零裁切浪费。" },
    { id: "2:3", label: "2 : 3", r: 1.5, interval: "纯五度（3:2）", use: "传统精装书页、35mm 胶片与单反画幅", afterNote: "对折后变成 4 : 3（1.333:1），从修长书页变为端稳的画册单页。" },
    { id: "5:8", label: "5 : 8", r: 1.6, interval: "小六度（8:5）", use: "整数网格海报、网页双栏（5 栏配 3 栏）", afterNote: "对折后变成 5 : 4（1.25:1），回到饱满的大三度画幅。" },
    { id: "phi", label: "1.618 : 1", r: PHI, interval: "黄金分割 φ", use: "古典建筑构图、098 原海报主螺旋示范", afterNote: "对折后变成 1.236 : 1（不再是黄金矩形）——黄金矩形的自相似靠的是「切掉一个正方形」，不是对折。" },
  ];

  let activeId = "sqrt2";
  let folded = false;
  let showGhosts = true;

  pillsEl.innerHTML = ITEMS.map(
    (it) => `<button type="button" class="ratio-pill${it.id === activeId ? " is-active" : ""}" role="tab" aria-selected="${it.id === activeId}" data-rid="${it.id}">${it.label}</button>`
  ).join("");

  function render() {
    const cur = ITEMS.find((x) => x.id === activeId);
    const baseH = 210;
    const ox = 56;
    const oy = 68;
    const w = baseH * cur.r;

    // 对折后两半：原宽 w 折半成 w/2，高仍为 baseH；其长边/短边比 = max(baseH, w/2) / min(baseH, w/2)
    const halfW = w / 2;
    const halfRatio = Math.max(baseH, halfW) / Math.min(baseH, halfW);
    const sameAfterFold = Math.abs(halfRatio - cur.r) < 0.015;

    let ghostsSvg = "";
    if (showGhosts) {
      ghostsSvg = ITEMS.map((it) => {
        const gw = baseH * it.r;
        const isCur = it.id === activeId;
        if (isCur) return "";
        return `<rect x="${ox}" y="${oy}" width="${gw.toFixed(1)}" height="${baseH}" fill="none" stroke="rgba(38,125,123,0.22)" stroke-width="1" stroke-dasharray="3 3"/>`;
      }).join("");
    }

    const foldSvg = folded
      ? `
        <rect x="${ox}" y="${oy}" width="${halfW.toFixed(1)}" height="${baseH}" fill="#267D7B" fill-opacity="0.9"/>
        <rect x="${(ox + halfW).toFixed(1)}" y="${oy}" width="${halfW.toFixed(1)}" height="${baseH}" fill="#95BBB3" fill-opacity="0.55" stroke="#222423" stroke-dasharray="5 3"/>
        <line x1="${(ox + halfW).toFixed(1)}" y1="${oy - 14}" x2="${(ox + halfW).toFixed(1)}" y2="${oy + baseH + 14}" stroke="#F0A63D" stroke-width="2.5"/>
        <text x="${(ox + halfW / 2).toFixed(1)}" y="${oy + baseH / 2 - 4}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="14" font-weight="800" fill="#FFF9EF">折半后</text>
        <text x="${(ox + halfW / 2).toFixed(1)}" y="${oy + baseH / 2 + 16}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="700" fill="#F7BC5E">${halfRatio.toFixed(3)} : 1</text>
        <text x="${(ox + halfW + halfW / 2).toFixed(1)}" y="${oy + baseH / 2 + 4}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#222423">${sameAfterFold ? "比例完全不变 ✓" : "比例已改变"}</text>
      `
      : `
        <rect x="${ox}" y="${oy}" width="${w.toFixed(1)}" height="${baseH}" fill="#267D7B" fill-opacity="0.88" stroke="#222423" stroke-width="1.8"/>
        <line x1="${ox}" y1="${oy + baseH}" x2="${(ox + w).toFixed(1)}" y2="${oy}" stroke="rgba(251,242,227,0.55)" stroke-dasharray="5 4"/>
        <circle cx="${(ox + w - 42).toFixed(1)}" cy="${oy + baseH - 42}" r="22" fill="${cur.id === "2:3" ? "#F0A63D" : "#95BBB3"}"/>
        <text x="${ox + 16}" y="${oy + 30}" font-family="Unbounded, Manrope, sans-serif" font-size="22" font-weight="700" fill="#FFF9EF">${cur.label}</text>
        <text x="${ox + 16}" y="${oy + 52}" font-family="Noto Sans SC, sans-serif" font-size="12.5" fill="#DCECE8">${cur.interval}</text>
      `;

    // 右侧对比读数卡
    const rx = 438;
    svg.innerHTML = `
      <rect width="640" height="340" fill="#FBF2E3"/>
      <!-- 顶部与左侧工程卡尺 -->
      <line x1="${ox}" y1="${oy - 22}" x2="${(ox + w).toFixed(1)}" y2="${oy - 22}" stroke="#175957" stroke-dasharray="4 3"/>
      <line x1="${ox}" y1="${oy - 27}" x2="${ox}" y2="${oy - 17}" stroke="#175957"/>
      <line x1="${(ox + w).toFixed(1)}" y1="${oy - 27}" x2="${(ox + w).toFixed(1)}" y2="${oy - 17}" stroke="#175957"/>
      <rect x="${(ox + w / 2 - 28).toFixed(1)}" y="${oy - 31}" width="56" height="17" fill="#FBF2E3"/>
      <text x="${(ox + w / 2).toFixed(1)}" y="${oy - 18}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">${cur.r.toFixed(3)}</text>

      <line x1="${ox - 20}" y1="${oy}" x2="${ox - 20}" y2="${oy + baseH}" stroke="#4E5653" stroke-dasharray="4 3"/>
      <line x1="${ox - 25}" y1="${oy}" x2="${ox - 15}" y2="${oy}" stroke="#4E5653"/>
      <line x1="${ox - 25}" y1="${oy + baseH}" x2="${ox - 15}" y2="${oy + baseH}" stroke="#4E5653"/>
      <rect x="${ox - 30}" y="${oy + baseH / 2 - 9}" width="20" height="18" fill="#FBF2E3"/>
      <text x="${ox - 20}" y="${oy + baseH / 2 + 4}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#4E5653">1</text>

      ${ghostsSvg}
      ${foldSvg}

      <!-- 右侧规格卡片 -->
      <rect x="${rx}" y="44" width="184" height="252" fill="#FFF9EF" stroke="#222423" stroke-width="1.2"/>
      <text x="${rx + 14}" y="70" font-family="Manrope, sans-serif" font-size="11.5" font-weight="800" fill="#175957">SPECIMEN MEASURE</text>
      <text x="${rx + 14}" y="102" font-family="Unbounded, Manrope, sans-serif" font-size="22" font-weight="700" fill="#222423">${cur.r.toFixed(3)} : 1</text>
      <line x1="${rx + 14}" y1="118" x2="${rx + 170}" y2="118" stroke="rgba(34,36,35,0.2)"/>
      <text x="${rx + 14}" y="142" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#4E5653">对应音程</text>
      <text x="${rx + 14}" y="162" font-family="Noto Sans SC, sans-serif" font-size="13.5" font-weight="700" fill="#222423">${cur.interval}</text>
      <text x="${rx + 14}" y="196" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#4E5653">对折一刀结果</text>
      <text x="${rx + 14}" y="218" font-family="Manrope, sans-serif" font-size="15" font-weight="800" fill="${sameAfterFold ? "#136349" : "#8F5106"}">${halfRatio.toFixed(3)} : 1</text>
      <text x="${rx + 14}" y="242" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="${sameAfterFold ? "#136349" : "#4E5653"}">${sameAfterFold ? "对折自相似（ISO 216）" : "对折后切换比例家族"}</text>
      <text x="${rx + 14}" y="276" font-family="Noto Sans SC, sans-serif" font-size="11.5" fill="#4E5653">面积不变 · 统一高度比较</text>
    `;

    factsEl.innerHTML = `<strong>${cur.label}（${cur.interval}）</strong>：常用于 ${cur.use}。${folded ? cur.afterNote : "点一下「沿长边对折一刀」，看看把它对半裁开后比例会怎么变。"}`;
  }

  pillsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rid]");
    if (!btn) return;
    activeId = btn.dataset.rid;
    pillsEl.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  btnFold.addEventListener("click", () => {
    folded = !folded;
    btnFold.setAttribute("aria-pressed", String(folded));
    btnFold.textContent = folded ? "展开还原整张" : "沿长边对折一刀";
    render();
  });

  btnGhost.addEventListener("click", () => {
    showGhosts = !showGhosts;
    btnGhost.setAttribute("aria-pressed", String(showGhosts));
    btnGhost.textContent = showGhosts ? "隐藏全部参考轮廓" : "显示全部参考轮廓";
    render();
  });

  render();
}

/* ==================== 03 深青暗室：模数阶梯共鸣台 ==================== */
export function mountModularLab() {
  const keysEl = document.getElementById("ladder-keys");
  const btnScramble = document.getElementById("btn-scramble");
  const barsEl = document.getElementById("modular-bars");
  const previewEl = document.getElementById("modular-preview");
  const verdictEl = document.getElementById("modular-verdict");
  if (!keysEl || !barsEl || !previewEl) return;

  let ratio = 1.25;
  let scrambled = false;

  const NAMES = {
    1.125: { name: "1.125 大二度", desc: "极度细腻克制，适合工具后台、数据表格与紧凑手机卡片，不会浪费垂直空间。" },
    1.25: { name: "1.250 大三度", desc: "兼顾清晰层级与省空间，是网页正文与说明文档最稳妥的日常经验比例。" },
    1.333: { name: "1.333 纯四度", desc: "标题开始明显拉开体量，适合杂志长文、课程讲义与品牌官网。" },
    1.414: { name: "1.414 白银比", desc: "对应 A 系列纸张比例，跨级节奏爽朗利落，适合展陈目录与专题页。" },
    1.618: { name: "1.618 黄金比", desc: "主标题气势磅礴，但四级连乘后差异很大，适合大画幅海报与封面，慎用于密集表单。" },
  };

  function render() {
    const base = 14;
    const steps = scrambled
      ? [
          { label: "主标题", px: 29, gap: 19 },
          { label: "小标题", px: 26, gap: 7 },
          { label: "导语", px: 17, gap: 22 },
          { label: "正文", px: 15, gap: 9 },
          { label: "注脚", px: 14, gap: 6 },
        ]
      : [
          { label: "主标题", px: Math.round(base * Math.pow(ratio, 3)), gap: Math.round(base * Math.pow(ratio, 1.4)) },
          { label: "小标题", px: Math.round(base * Math.pow(ratio, 2)), gap: Math.round(base * ratio) },
          { label: "导语", px: Math.round(base * ratio), gap: Math.round(base * 0.9) },
          { label: "正文", px: base, gap: Math.round(base * 0.72) },
          { label: "注脚", px: Math.max(11, Math.round(base / ratio)), gap: Math.round(base * 0.55) },
        ];

    const maxPx = Math.max(60, steps[0].px);
    barsEl.innerHTML = steps
      .map((s) => {
        const pct = Math.min(100, Math.round((s.px / maxPx) * 100));
        return `
          <div class="mbar-row">
            <span class="mbar-label">${s.label}</span>
            <div class="mbar-track">
              <div class="mbar-fill${scrambled ? " is-chaos" : ""}" style="width:${pct}%"></div>
            </div>
            <span class="mbar-px" lang="en">${s.px}px</span>
          </div>
        `;
      })
      .join("");

    // 限制演示卡片里主标上限以防极端大字溢出窄屏，同时保留真实比例阶梯观感
    const clampDisp = (v) => Math.min(v, 44);
    previewEl.innerHTML = `
      <div class="preview-card">
        <p class="preview-kicker" style="font-size:${steps[4].px}px;margin-bottom:${steps[4].gap}px;">EXHIBITION · MODULAR PROPORTION</p>
        <p class="preview-h1" style="font-size:${clampDisp(steps[0].px)}px;margin-bottom:${steps[1].gap}px;">建筑中的音乐比例</p>
        <p class="preview-h2" style="font-size:${clampDisp(steps[1].px)}px;margin-bottom:${steps[2].gap}px;">用一把尺子，统领字号与留白</p>
        <p class="preview-body" style="font-size:${steps[3].px}px;margin-bottom:${steps[3].gap}px;">当标题、副标、正文与段落间距都由同一公比派发，页面无需堆砌边框或重色，秩序就已经自然浮现。</p>
        <p class="preview-cap" style="font-size:${steps[4].px}px;">实测字阶：${steps.map((s) => s.px).join(" / ")} px</p>
      </div>
    `;

    if (scrambled) {
      verdictEl.textContent = "随意拼凑字号（29 / 26 / 17 / 15 / 14 px）：主标题与小标题仅差 3px 互相打架，段距时紧时松（19px / 7px / 22px），整体像东拼西凑的草稿。再点一次按钮恢复统一模数对比感受！";
    } else {
      const info = NAMES[ratio] || { name: `${ratio}×`, desc: "" };
      verdictEl.textContent = `当前模数 ${info.name}（基数 14px 连乘 → ${steps.map((s) => s.px).join(" / ")} px）：${info.desc}`;
    }
  }

  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ratio]");
    if (!btn) return;
    ratio = parseFloat(btn.dataset.ratio);
    scrambled = false;
    btnScramble.setAttribute("aria-pressed", "false");
    btnScramble.textContent = "打乱成随意拼凑字号";
    keysEl.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });

  btnScramble.addEventListener("click", () => {
    scrambled = !scrambled;
    btnScramble.setAttribute("aria-pressed", String(scrambled));
    btnScramble.textContent = scrambled ? "恢复统一模数阶梯" : "打乱成随意拼凑字号";
    render();
  });

  render();
}

/* ==================== 04 历史比例蓝图切换 ==================== */
export function mountHistoryLab() {
  const tabsEl = document.getElementById("era-tabs");
  const svgEl = document.getElementById("era-svg");
  const copyEl = document.getElementById("era-copy");
  if (!tabsEl || !svgEl || !copyEl) return;

  const ERAS = [
    {
      year: "约公元前 30–20 年",
      short: "维特鲁威",
      title: "维特鲁威与「人体模数」",
      latin: "Vitruvius · De architectura, Book III, Ch. 1",
      body: "古罗马建筑师维特鲁威在《建筑十书》第 3 卷第 1 章明确区分了两个概念：比例（proportio，希腊语 analogia）是局部与整体之间的基准换算，而古典意义上的对称（symmetria）正是从统一的比例关系中生长出来的。他以人体为例——脸长占身高十分之一、头占八分之一、张开双臂的翼展等于身高——提出神庙必须像健康的人体一样，所有构件共享同一个度量单位。",
      source: "核实来源：Vitruvius, De architectura III.1（芝加哥大学 LacusCurtius 古典文献库）",
      draw: () => `
        <rect width="520" height="320" fill="#FFF9EF"/>
        <circle cx="260" cy="166" r="118" fill="none" stroke="#267D7B" stroke-width="1.8"/>
        <rect x="158" y="82" width="204" height="204" fill="rgba(149,187,179,0.22)" stroke="#222423" stroke-width="1.6"/>
        <line x1="158" y1="166" x2="362" y2="166" stroke="#F0A63D" stroke-dasharray="4 3"/>
        <line x1="260" y1="48" x2="260" y2="286" stroke="#F0A63D" stroke-dasharray="4 3"/>
        <circle cx="260" cy="166" r="5" fill="#F0A63D"/>
        <!-- 极简无五官几何人形标尺（遵循不画五官规矩） -->
        <circle cx="260" cy="108" r="14" fill="#267D7B"/>
        <rect x="242" y="126" width="36" height="66" fill="#267D7B"/>
        <line x1="170" y1="138" x2="350" y2="138" stroke="#267D7B" stroke-width="8" stroke-linecap="round"/>
        <line x1="248" y1="192" x2="232" y2="280" stroke="#267D7B" stroke-width="8" stroke-linecap="round"/>
        <line x1="272" y1="192" x2="288" y2="280" stroke="#267D7B" stroke-width="8" stroke-linecap="round"/>
        <text x="20" y="28" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">ANALOGIA · 1/8 HEAD · 1/10 FACE · CIRCLE &amp; SQUARE</text>
        <text x="382" y="108" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">圆心：脐部</text>
        <text x="382" y="186" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">正方：身高=臂展</text>
      `,
    },
    {
      year: "1570 年",
      short: "帕拉第奥",
      title: "帕拉第奥与七种理想房间比例",
      latin: "Andrea Palladio · I quattro libri dell'architettura, I.21",
      body: "文艺复兴建筑师安德烈亚·帕拉第奥于 1570 年在威尼斯出版《建筑四书》。在第一卷第 21 章，他将毕达哥拉斯音乐协和音程引入建筑平面，列出了七种最和谐的房间形状：圆形、正方形（1:1）、对角线矩形（1:√2）、3:4、2:3、3:5 与 1:2，并进一步用算术中项、几何中项与调和中项来决定拱顶房间的层高，让长、宽、高三者像和弦一样共鸣。",
      source: "核实来源：Andrea Palladio, I quattro libri dell'architettura (Venice, 1570), Book I, Ch. 21",
      draw: () => `
        <rect width="520" height="320" fill="#FFF9EF"/>
        <text x="20" y="28" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">PALLADIO 1570 · SEVEN IDEAL ROOM SHAPES</text>
        <circle cx="62" cy="112" r="34" fill="#95BBB3" stroke="#222423"/>
        <text x="62" y="164" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">圆形</text>
        <rect x="116" y="78" width="68" height="68" fill="#6EA19C" stroke="#222423"/>
        <text x="150" y="164" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">1 : 1</text>
        <rect x="204" y="78" width="96" height="68" fill="#267D7B" stroke="#222423"/>
        <text x="252" y="164" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">1 : √2</text>
        <rect x="320" y="78" width="90" height="68" fill="#6EA19C" stroke="#222423"/>
        <text x="365" y="164" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">3 : 4</text>

        <rect x="44" y="196" width="102" height="68" fill="#267D7B" stroke="#222423"/>
        <circle cx="95" cy="230" r="14" fill="#F0A63D"/>
        <text x="95" y="284" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">2 : 3（纯五度）</text>
        <rect x="172" y="196" width="114" height="68" fill="#95BBB3" stroke="#222423"/>
        <text x="229" y="284" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">3 : 5（大六度）</text>
        <rect x="312" y="196" width="136" height="68" fill="#267D7B" stroke="#222423"/>
        <text x="380" y="284" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">1 : 2（八度）</text>
      `,
    },
    {
      year: "1786 / 1922 年",
      short: "DIN 476 / A4",
      title: "利希滕贝格与波斯特曼的 1 : √2 纸张革命",
      latin: "Lichtenberg (1786) · DIN 476 (1922) · ISO 216 (1975)",
      body: "1786 年 10 月 25 日，德国物理学家利希滕贝格在致约翰·贝克曼的信中指出：只有长宽比为 1 : √2 的纸张，沿长边对折后仍保持一模一样的比例。1922 年 8 月 18 日，德国工程师瓦尔特·波斯特曼把这一比值与公制面积（A0 = 1 平方米）结合，发布 DIN 476 标准，并于 1975 年成为全球通用的 ISO 216（A4 纸）——工业史上最成功的比例标准。",
      source: "核实来源：DIN 476 (1922) & ISO 216 (1975) 标准文献；Lichtenberg 1786 年致 Beckmann 信",
      draw: () => `
        <rect width="520" height="320" fill="#FFF9EF"/>
        <text x="20" y="28" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">1 : √2 SELF-SIMILAR FOLD · A0 → A1 → A2 → A3 → A4</text>
        <rect x="44" y="48" width="368" height="240" fill="#C8D6CF" stroke="#222423" stroke-width="1.6"/>
        <rect x="44" y="48" width="184" height="240" fill="#267D7B" stroke="#222423" stroke-width="1.4"/>
        <text x="136" y="176" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="24" font-weight="700" fill="#FFF9EF">A1</text>
        <rect x="228" y="48" width="184" height="120" fill="#6EA19C" stroke="#222423" stroke-width="1.4"/>
        <text x="320" y="116" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="20" font-weight="700" fill="#FFF9EF">A2</text>
        <rect x="228" y="168" width="92" height="120" fill="#95BBB3" stroke="#222423" stroke-width="1.4"/>
        <text x="274" y="236" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="16" font-weight="700" fill="#222423">A3</text>
        <rect x="320" y="168" width="92" height="60" fill="#F0A63D" stroke="#222423" stroke-width="1.4"/>
        <text x="366" y="204" text-anchor="middle" font-family="Unbounded, sans-serif" font-size="14" font-weight="700" fill="#222423">A4</text>
        <rect x="320" y="228" width="46" height="60" fill="#FFF9EF" stroke="#222423"/>
        <text x="343" y="263" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="800" fill="#222423">A5</text>
        <text x="430" y="120" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">A0 = 1 m²</text>
        <text x="430" y="144" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">每一刀对折</text>
        <text x="430" y="166" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#175957" font-weight="700">比例恒为 √2</text>
      `,
    },
    {
      year: "1950 / 1955 年",
      short: "柯布西耶模度",
      title: "勒·柯布西耶《模度》红蓝双尺",
      latin: "Le Corbusier · Le Modulor (1950) & Modulor 2 (1955)",
      body: "勒·柯布西耶在 1950 年出版《模度》（1955 年出版续册《模度 2》），试图调和冷冰冰的公制毫米与人的身体感受。他取站立人体身高 183 cm（肚脐高 113 cm、举手高 226 cm），用黄金分割与斐波那契数列衍生出「红尺」与「蓝尺」两套递进尺寸，用于指导马赛公寓等建筑的窗洞、踏步、桌椅与墙板比例。",
      source: "核实来源：Fondation Le Corbusier 档案（Le Modulor, Éditions de l'Architecture d'Aujourd'hui, 1950）",
      draw: () => `
        <rect width="520" height="320" fill="#FFF9EF"/>
        <text x="20" y="28" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">LE MODULOR (1950) · RED &amp; BLUE FIBONACCI SERIES</text>
        <!-- 红尺与蓝尺阶梯条 -->
        <rect x="44" y="62" width="380" height="38" fill="#B23024" fill-opacity="0.88"/>
        <text x="56" y="86" font-family="Manrope, sans-serif" font-size="12.5" font-weight="800" fill="#FFF9EF">红尺（cm）：183 → 113 → 70 → 43 → 27 → 16.5</text>
        <rect x="44" y="114" width="430" height="38" fill="#267D7B"/>
        <text x="56" y="138" font-family="Manrope, sans-serif" font-size="12.5" font-weight="800" fill="#FFF9EF">蓝尺（cm）：226 → 140 → 86 → 53 → 33 → 20.5</text>
        <!-- 对应比例块 -->
        <rect x="44" y="176" width="183" height="96" fill="#C8D6CF" stroke="#222423"/>
        <rect x="44" y="176" width="113" height="96" fill="#6EA19C" stroke="#222423"/>
        <rect x="227" y="176" width="140" height="96" fill="#267D7B" stroke="#222423"/>
        <rect x="367" y="176" width="86" height="96" fill="#F0A63D" stroke="#222423"/>
        <text x="100" y="230" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#FFF9EF">113</text>
        <text x="192" y="230" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#222423">70</text>
        <text x="297" y="230" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#FFF9EF">140</text>
        <text x="410" y="230" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#222423">86</text>
        <text x="44" y="296" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">两套数列逐项比值均趋近 φ ≈ 1.618，且与门窗、坐高、台面等人体尺度对应</text>
      `,
    },
    {
      year: "1975 / 1992 年",
      short: "书页与音程",
      title: "奇肖尔德与布林赫斯特的书页比例",
      latin: "Jan Tschichold (1975) · Robert Bringhurst (1992)",
      body: "德国排版大师扬·奇肖尔德基于 1955 年论文，在《书籍的形态》（1975 德文版 / 1991 英文版）中利用维拉尔对角作图法，还原了中世纪 2:3 书页如何得到 2:3:4:6 的内、顶、外、底页边距。1992 年，罗伯特·布林赫斯特在《字体排印风格要素》第 8 章更把整套书页长宽比对照成音乐音程表，提醒设计师像调乐器一样为内容挑选画幅。",
      source: "核实来源：Jan Tschichold, The Form of the Book (1975/1991); Robert Bringhurst, The Elements of Typographic Style (1992), Ch. 8",
      draw: () => `
        <rect width="520" height="320" fill="#FFF9EF"/>
        <text x="20" y="28" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#175957">2 : 3 CANONICAL SPREAD · MARGINS 2 : 3 : 4 : 6</text>
        <!-- 对开书页 -->
        <rect x="68" y="48" width="192" height="240" fill="#FBF2E3" stroke="#222423" stroke-width="1.5"/>
        <rect x="260" y="48" width="192" height="240" fill="#FBF2E3" stroke="#222423" stroke-width="1.5"/>
        <!-- 对角构图线 -->
        <line x1="68" y1="288" x2="452" y2="48" stroke="rgba(240,166,61,0.75)" stroke-dasharray="4 3"/>
        <line x1="68" y1="288" x2="260" y2="48" stroke="rgba(38,125,123,0.45)" stroke-dasharray="4 3"/>
        <line x1="260" y1="48" x2="452" y2="288" stroke="rgba(38,125,123,0.45)" stroke-dasharray="4 3"/>
        <!-- 左右版心（精确按 1/9 留白） -->
        <rect x="111" y="75" width="128" height="160" fill="#267D7B" fill-opacity="0.82"/>
        <rect x="281" y="75" width="128" height="160" fill="#6EA19C" fill-opacity="0.82"/>
        <text x="175" y="160" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="13" font-weight="700" fill="#FFF9EF">版心高 = 页宽</text>
        <text x="345" y="160" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#FFF9EF">2 : 3 : 4 : 6</text>
        <text x="260" y="308" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" fill="#4E5653">内边距 2 · 上边距 3 · 外边距 4 · 下边距 6（给大拇指留住翻页空位）</text>
      `,
    },
  ];

  let cur = 0;

  tabsEl.innerHTML = ERAS.map(
    (e, i) => `<button type="button" class="era-tab${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-era="${i}"><strong>${e.year}</strong><span>${e.short}</span></button>`
  ).join("");

  function render() {
    const e = ERAS[cur];
    svgEl.innerHTML = e.draw();
    copyEl.innerHTML = `
      <h3>${e.title}</h3>
      <p class="era-latin" lang="en">${e.latin}</p>
      <p>${e.body}</p>
      <p class="era-source">${e.source}</p>
    `;
  }

  tabsEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-era]");
    if (!btn) return;
    cur = Number(btn.dataset.era);
    tabsEl.querySelectorAll("button").forEach((b, i) => {
      const on = i === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  render();
}

/* ==================== 05 光学补偿开关实验 ==================== */
export function mountOpticalLab() {
  const toggleEl = document.getElementById("optical-toggle");
  const cardsEl = document.getElementById("optical-cards");
  const readoutEl = document.getElementById("optical-readout");
  if (!toggleEl || !cardsEl) return;

  let mode = "math"; // "math" | "optical"

  function render() {
    const opt = mode === "optical";
    // 1. 圆与方：数学等高 84px vs 圆视觉放大约 6%（约 89px，经验值）
    const sq = 84;
    const circD = opt ? 90 : 84;
    // 2. 几何居中 vs 视觉上提约 3%（经验值）
    const midY = opt ? 66 : 72;
    // 3. 三角指针图标在圆内：几何质心偏左 vs 右移约 6% 光学居中
    const triShift = opt ? 6 : 0;

    cardsEl.innerHTML = `
      <div class="opt-item">
        <svg viewBox="0 0 240 144" role="img" aria-label="正方形与圆形同高对比">
          <line x1="20" y1="30" x2="220" y2="30" stroke="rgba(38,125,123,0.4)" stroke-dasharray="3 3"/>
          <line x1="20" y1="114" x2="220" y2="114" stroke="rgba(38,125,123,0.4)" stroke-dasharray="3 3"/>
          <rect x="28" y="30" width="${sq}" height="${sq}" fill="#267D7B"/>
          <circle cx="168" cy="72" r="${circD / 2}" fill="#F0A63D"/>
          <text x="70" y="135" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="#222423">84 × 84</text>
          <text x="168" y="135" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="${opt ? "#136349" : "#8F5106"}">Ø ${circD}${opt ? " (+7%)" : ""}</text>
        </svg>
        <strong>圆比方需要略微「超线」</strong>
        <span>正方形四角占满面积，圆形四角收窄；字体设计里的 O 和圆徽标通常要比 H/方形超出基线约 3–7%（经验值）。</span>
      </div>

      <div class="opt-item">
        <svg viewBox="0 0 240 144" role="img" aria-label="几何居中与视觉居中对比">
          <rect x="34" y="14" width="172" height="104" fill="#FBF2E3" stroke="#222423" stroke-width="1.4"/>
          <line x1="34" y1="66" x2="206" y2="66" stroke="rgba(38,125,123,0.4)" stroke-dasharray="4 3"/>
          <rect x="86" y="${midY - 24}" width="68" height="36" fill="#267D7B"/>
          <text x="120" y="${midY - 2}" text-anchor="middle" font-family="Noto Sans SC, sans-serif" font-size="12" font-weight="700" fill="#FFF9EF">${opt ? "视觉居中" : "数学中线"}</text>
          <text x="120" y="136" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="${opt ? "#136349" : "#4E5653"}">${opt ? "重心上提约 4%（经验值）" : "严丝 50% / 50%"}</text>
        </svg>
        <strong>装裱与封面重心微上提</strong>
        <span>纯数学 50% 居中往往显得「往下掉」。书封主标与画框装裱常把中心微提 2–5%（经验值），看起来才真正居中。</span>
      </div>

      <div class="opt-item">
        <svg viewBox="0 0 240 144" role="img" aria-label="播放三角在圆内的光学居中">
          <circle cx="120" cy="68" r="46" fill="#267D7B"/>
          <line x1="120" y1="18" x2="120" y2="118" stroke="rgba(251,242,227,0.4)" stroke-dasharray="3 3"/>
          <polygon points="${103 + triShift},48 ${103 + triShift},88 ${143 + triShift},68" fill="#F0A63D"/>
          <text x="120" y="136" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11.5" font-weight="700" fill="${opt ? "#136349" : "#8F5106"}">${opt ? "右移 +6px 平衡尖角" : "外框水平居中"}</text>
        </svg>
        <strong>尖角图形按视觉重量配平</strong>
        <span>三角形左侧宽重、右侧尖轻，按外接框居中会显得偏左；稍微右推一点，视觉重心才落回圆心。</span>
      </div>
    `;

    readoutEl.textContent = opt
      ? "当前为「视觉光学补偿」：把圆略微放大、重心微提、三角微右移后，三组图形在人眼里终于对齐了——好比例最终听眼睛的，不只听计算器。"
      : "当前为「纯数学相等」：标尺分毫不差，但仔细看第一格的黄圆是不是显得比青方块小一圈，第三格的播放三角是不是偏向左边？切换到「视觉光学补偿」对比一下。";
  }

  toggleEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-opt]");
    if (!btn) return;
    mode = btn.dataset.opt;
    toggleEl.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });

  render();
}

/* ==================== 06 单变量四选一小练习 ==================== */
export function mountQuiz() {
  const tabsEl = document.getElementById("quiz-tabs");
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const feedbackEl = document.getElementById("quiz-feedback");
  const btnReset = document.getElementById("btn-quiz-reset");
  if (!tabsEl || !gridEl || !feedbackEl) return;

  const QUESTIONS = [
    {
      prompt: "第 1 题：下面四张 3:4 展览海报文案、字号、配色和外边距完全相同，唯一差别只有「主图区与文字区的高度比例」。哪一版最自然有序？",
      answer: 1, // 方案 B
      options: [
        {
          label: "方案 A",
          ratio: "52% : 48%",
          split: 0.52,
          why: "方案 A 把主图和文字区切成 52 : 48（约 1.08 : 1），接近对半平分。眼睛在上下两块之间来回游移，分不清究竟该先看图还是先读字。",
        },
        {
          label: "方案 B",
          ratio: "62% : 38%",
          split: 0.62,
          why: "答对了！方案 B 采用 62 : 38（约 1.63 : 1，接近黄金比 / 5:3）。主图稳稳拿下第一眼，下方文字区既有充裕留白又不抢戏，整体节奏最自然。",
        },
        {
          label: "方案 C",
          ratio: "86% : 14%",
          split: 0.86,
          why: "方案 C 主图霸占 86%，把底部标题与展期挤进不到七分之一的狭缝里，文字喘不过气，主次失衡为压迫。",
        },
        {
          label: "方案 D",
          ratio: "34% : 66%",
          split: 0.34,
          why: "方案 D 把主体视觉压成顶部窄条，下方文字说明却铺满三分之二，信息重心与展览海报的主视觉诉求正好倒挂。",
        },
      ],
      renderOpt(opt, revealed) {
        const W = 200, H = 266, pad = 14, gap = 8;
        const iw = W - pad * 2, ih = H - pad * 2 - gap;
        const topH = Math.round(ih * opt.split);
        const botH = ih - topH;
        const botY = pad + topH + gap;
        return `
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opt.label}">
            <rect width="${W}" height="${H}" fill="#FBF2E3"/>
            <rect x="${pad}" y="${pad}" width="${iw}" height="${topH}" fill="#267D7B"/>
            <circle cx="${pad + iw * 0.68}" cy="${pad + topH * 0.55}" r="${Math.min(iw * 0.24, topH * 0.34)}" fill="#F0A63D"/>
            <rect x="${pad}" y="${botY}" width="${iw}" height="${botH}" fill="#FFF9EF" stroke="rgba(34,36,35,0.18)"/>
            <rect x="${pad + 10}" y="${botY + Math.min(12, botH * 0.16)}" width="${iw * 0.58}" height="${Math.min(13, Math.max(6, botH * 0.22))}" fill="#222423"/>
            ${botH > 38 ? `<rect x="${pad + 10}" y="${botY + Math.min(34, botH * 0.52)}" width="${iw * 0.78}" height="5" fill="#6EA19C"/>` : ""}
            ${botH > 54 ? `<rect x="${pad + 10}" y="${botY + Math.min(46, botH * 0.72)}" width="${iw * 0.52}" height="5" fill="#95BBB3"/>` : ""}
            ${revealed ? `<line x1="${pad - 6}" y1="${pad + topH + gap / 2}" x2="${W - pad + 6}" y2="${pad + topH + gap / 2}" stroke="#F0A63D" stroke-width="2" stroke-dasharray="4 2"/>` : ""}
          </svg>
        `;
      },
    },
    {
      prompt: "第 2 题：下面四张信息卡画幅与色块完全一致，唯一差别只有「主标 / 副标 / 正文三阶字号与对应段距的模数比例」。哪一版层级和节奏最清楚？",
      answer: 2, // 方案 C
      options: [
        {
          label: "方案 A",
          ratio: "20 / 18 / 16",
          sizes: [15, 13.5, 12],
          gaps: [7, 7],
          why: "方案 A 三级字号公比只有 1.11×，远看像三行同样大的灰字粘在一起，没有起伏和第一眼入口。",
        },
        {
          label: "方案 B",
          ratio: "42 / 14 / 13",
          sizes: [29, 10, 9.5],
          gaps: [18, 4],
          why: "方案 B 首级跨度高达 3.0×，副标和正文却只差 1px，节奏变成「头重脚轻」的断崖，中层结构完全消失。",
        },
        {
          label: "方案 C",
          ratio: "34 / 22 / 14",
          sizes: [24, 16, 10.5],
          gaps: [12, 8],
          why: "答对了！方案 C 沿着约 1.55× 的一致公比递进（34 / 22 / 14），段距同步呼应，三级信息一眼分明、过渡顺滑。",
        },
        {
          label: "方案 D",
          ratio: "28 / 28 / 12",
          sizes: [20, 20, 9],
          gaps: [6, 16],
          why: "方案 D 主标与副标一样大互相抢戏，正文又突然跌掉一半以上，比例系统前后矛盾。",
        },
      ],
      renderOpt(opt) {
        const W = 200, H = 266;
        const [s1, s2, s3] = opt.sizes;
        const [g1, g2] = opt.gaps;
        const y0 = 56;
        const y1 = y0 + s1 + g1;
        const y2 = y1 + s2 + g2;
        return `
          <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opt.label}">
            <rect width="${W}" height="${H}" fill="#FBF2E3"/>
            <rect x="14" y="14" width="172" height="238" fill="#FFF9EF" stroke="rgba(34,36,35,0.2)"/>
            <rect x="26" y="30" width="44" height="6" fill="#267D7B"/>
            <rect x="26" y="${y0}" width="136" height="${s1}" fill="#222423"/>
            <rect x="26" y="${y1}" width="114" height="${s2}" fill="#267D7B"/>
            <rect x="26" y="${y2}" width="146" height="${s3}" fill="#6EA19C"/>
            <rect x="26" y="${y2 + s3 + 7}" width="138" height="${s3}" fill="#6EA19C"/>
            <rect x="26" y="${y2 + (s3 + 7) * 2}" width="96" height="${s3}" fill="#95BBB3"/>
            <circle cx="164" cy="228" r="10" fill="#F0A63D"/>
          </svg>
        `;
      },
    },
  ];

  let curQ = 0;
  let picked = [null, null];

  function render() {
    const q = QUESTIONS[curQ];
    const sel = picked[curQ];
    const revealed = sel !== null;
    promptEl.textContent = q.prompt;

    gridEl.innerHTML = q.options
      .map((opt, idx) => {
        let cls = "quiz-opt";
        if (revealed) {
          if (idx === q.answer) cls += " is-correct";
          else if (idx === sel) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-opt="${idx}" aria-pressed="${sel === idx}">
            ${q.renderOpt(opt, revealed)}
            <span class="quiz-opt-foot">
              <span>${opt.label}</span>
              <span class="quiz-opt-ratio" lang="en">${revealed ? opt.ratio : "点击选择"}</span>
            </span>
          </button>
        `;
      })
      .join("");

    if (!revealed) {
      feedbackEl.className = "quiz-feedback";
      feedbackEl.textContent = "先观察四版在画面重心与阅读节奏上的直观差别，再点选你认为比例成立的一版（选中后立刻揭示四版的实测比值）。";
    } else {
      const ok = sel === q.answer;
      feedbackEl.className = `quiz-feedback ${ok ? "is-ok" : "is-err"}`;
      feedbackEl.innerHTML = `<strong>${ok ? "判断准确！" : `再对比看看（正解是 ${q.options[q.answer].label}）：`}</strong> ${q.options[sel].why}${!ok ? ` 对比之下，${q.options[q.answer].label}（${q.options[q.answer].ratio}）的主次与呼吸更自然。` : ""}`;
    }
  }

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-opt]");
    if (!btn) return;
    picked[curQ] = Number(btn.dataset.opt);
    render();
  });

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    curQ = Number(btn.dataset.q);
    tabsEl.querySelectorAll("button").forEach((b, i) => {
      const on = i === curQ;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    render();
  });

  btnReset.addEventListener("click", () => {
    picked[curQ] = null;
    render();
  });

  render();
}

/* ==================== 07 原海报灯箱（放大、拖拽平移、Esc 关） ==================== */
export function mountPosterLightbox() {
  const openBtn = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbStage = document.getElementById("lightbox-stage");
  const lbImg = document.getElementById("lightbox-img");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !posterImg || !lb || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = posterImg.src;
    scale = 1.15;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function close() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnIn.addEventListener("click", () => { scale = Math.min(3.2, scale + 0.35); applyTransform(); });
  btnOut.addEventListener("click", () => { scale = Math.max(0.6, scale - 0.35); applyTransform(); });
  btnReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  lbStage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.min(3.2, Math.max(0.6, scale + (e.deltaY < 0 ? 0.18 : -0.18)));
    applyTransform();
  }, { passive: false });

  lbStage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.setPointerCapture(e.pointerId);
  });

  lbStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });

  const stop = () => { dragging = false; };
  lbStage.addEventListener("pointerup", stop);
  lbStage.addEventListener("pointercancel", stop);

  lb.addEventListener("click", (e) => {
    if (e.target === lbStage) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) close();
  });
}
