// 057 棋盘构图 · 正文 01–07 节独立交互组件（相邻节控件类型绝不重复）
import { pixelRatio } from "../../lib/stage.js";
import { COLORS, HISTORY_ITEMS, QUIZ_ITEMS } from "./model.js";

// ---------- 01 节：阿德尔森棋盘明度恒常与邻格对比验证台（SVG 桥接剥离 + 交替开关） ----------
export function mountSection01() {
  const root = document.getElementById("sec01-lab");
  if (!root) return;
  const btnBridge = document.getElementById("s01-bridge");
  const btnPattern = document.getElementById("s01-pattern");
  const bridgeGroup = document.getElementById("s01-bridge-bars");
  const checkerTiles = document.getElementById("s01-checker-tiles");
  const flatBackdrop = document.getElementById("s01-flat-backdrop");
  const readout = document.getElementById("s01-readout");

  let showBridge = false;
  let showChecker = true;

  function update() {
    bridgeGroup.setAttribute("opacity", showBridge ? "1" : "0");
    checkerTiles.setAttribute("opacity", showChecker ? "1" : "0");
    flatBackdrop.setAttribute("opacity", showChecker ? "0" : "1");
    btnBridge.setAttribute("aria-pressed", String(showBridge));
    btnBridge.textContent = showBridge ? "撤回同色验证灰桥" : "拉出同色验证灰桥";
    btnPattern.setAttribute("aria-pressed", String(!showChecker));
    btnPattern.textContent = showChecker ? "抽走交替棋盘背景" : "恢复交替棋盘背景";

    if (!showChecker) {
      readout.textContent = "抽走周围交替方格后，A 格与 B 格立刻显露真相：两者同为 #787878。失去邻格明暗反差后，视觉边界与停留锚点也一并变弱。";
    } else if (showBridge) {
      readout.textContent = "两条像素值完全一致（#787878）的灰桥连通 A 与 B，没有任何接缝——人眼之所以坚信 B 更亮，全靠棋盘交替环境与阴影补偿在发挥作用。";
    } else {
      readout.textContent = "此刻 A 格被浅格包围显得发深，阴影中的 B 格被更暗的格包围显得发亮——其实两格物理灰度同为 #787878。点「拉出同色验证灰桥」亲眼验证。";
    }
  }

  btnBridge.addEventListener("click", () => {
    showBridge = !showBridge;
    update();
  });
  btnPattern.addEventListener("click", () => {
    showChecker = !showChecker;
    update();
  });
  update();
}

// ---------- 02 节：原海报四条结构铁律解剖蓝图（点选四要点联动透视原海报图层） ----------
export function mountSection02() {
  const buttons = [...document.querySelectorAll("[data-pillar]")];
  const layers = [...document.querySelectorAll("[data-blueprint-layer]")];
  const caption = document.getElementById("s02-caption");
  if (!buttons.length || !caption) return;

  const NOTES = {
    all: "总览 057 原海报 4×5 网格：深森林绿实块、暖米文本格、几何肌理格与唯一琥珀金圆洞格咬合在同一套正交坐标系中。",
    rhythm: "高亮【以交替布局】：6 块深森林绿实格与暖米格斜向错落，让重色与留白均匀分布，画面自带稳定节拍而不沉闷。",
    order: "高亮【交替分布】：纵横 5 条垂直线与 6 条水平线严丝合缝，连 2×1 跨格主标与底栏四词标尺都严格咬合在同一模数下。",
    contrast: "高亮【疏密对比】：5×5 点阵、45° 细斜线、嵌套同心方负责中间肌理层，唯一 1 枚琥珀金圆洞格打破全盘绿白均等，稳稳锁住第一眼。",
    module: "高亮【模块清晰】：每个方格承担单一角色——或纯色呼吸、或精炼短句、或纯几何符号，可随时替换内容而不破坏整体阵型。",
  };

  function select(key) {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.pillar === key));
    for (const l of layers) {
      const match = key === "all" || l.dataset.blueprintLayer === key;
      l.setAttribute("opacity", match ? "1" : "0.14");
    }
    caption.textContent = NOTES[key] || NOTES.all;
  }

  for (const b of buttons) {
    b.addEventListener("click", () => select(b.dataset.pillar));
  }
  select("contrast");
}

// ---------- 03 节：从浮世绘到瑞士网格（历史档案选项卡 + 2D Canvas 抽象结构图解） ----------
export function mountSection03() {
  const tabs = [...document.querySelectorAll("[data-era]")];
  const canvas = document.getElementById("sec03-canvas");
  const titleEl = document.getElementById("s03-title");
  const enEl = document.getElementById("s03-en");
  const bodyEl = document.getElementById("s03-body");
  const noteEl = document.getElementById("s03-note");
  if (!tabs.length || !canvas) return;

  const ctx = canvas.getContext("2d");
  let activeId = HISTORY_ITEMS[0].id;

  function drawEra() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    const cw = Math.round(rect.width * dpr);
    const ch = Math.round(rect.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#0B3A26";
    ctx.fillRect(0, 0, w, h);

    const pad = Math.max(18, Math.min(w, h) * 0.08);
    const box = Math.min(w - pad * 2, h - pad * 2 - 22);
    const ox = Math.round((w - box) / 2);
    const oy = Math.round((h - box) / 2) - 8;

    if (activeId === "1741") {
      // 1741 市松模様：严格 1:1 无限延展双色方格
      const n = 6;
      const c = box / n;
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = (r + k) % 2 === 0 ? "#F8F3E7" : "#062B1B";
          ctx.fillRect(ox + k * c, oy + r * c, c + 0.4, c + 0.4);
        }
      }
      ctx.strokeStyle = "rgba(248,243,231,0.35)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(ox, oy, box, box);
      drawEraFooter(ctx, w, h, "1741 · 1:1 正交铺石纹（市松模様） · 无界均等延展");
    } else if (activeId === "1919") {
      // 1919 蒙德里安 Grid 8 暗色棋盘构图示意：等分 8×8 网格内打破 1:1 机械重复，呈现非均等色块节奏
      const n = 8;
      const c = box / n;
      const pal = ["#2C3E50", "#1E2B2A", "#6A4C2E", "#9E6B24", "#3E5146", "#B5842A"];
      const pat = [
        0, 2, 1, 3, 0, 4, 2, 1,
        4, 1, 5, 0, 2, 1, 3, 4,
        1, 3, 0, 4, 5, 2, 0, 1,
        2, 0, 4, 1, 3, 0, 4, 2,
        5, 1, 2, 0, 4, 3, 1, 0,
        0, 4, 1, 5, 0, 2, 4, 3,
        3, 2, 0, 1, 2, 4, 0, 1,
        1, 0, 3, 2, 1, 0, 5, 2,
      ];
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = pal[pat[r * n + k]];
          ctx.fillRect(ox + k * c, oy + r * c, c, c);
        }
      }
      ctx.strokeStyle = "#062B1B";
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo(ox + i * c, oy);
        ctx.lineTo(ox + i * c, oy + box);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox, oy + i * c);
        ctx.lineTo(ox + box, oy + i * c);
        ctx.stroke();
      }
      drawEraFooter(ctx, w, h, "1919 · 等分网格 + 非均等色块节奏（暗色棋盘结构示意）");
    } else if (activeId === "1981") {
      // 1981 瑞士 20 格模块网格：展示缝宽 gutter + 跨格图片/标题合并槽
      const cols = 4, rows = 5;
      const g = Math.max(5, box * 0.032);
      const cw2 = (box - g * (cols - 1)) / cols;
      const ch2 = (box - g * (rows - 1)) / rows;
      // 底层虚线 20 格模数
      ctx.strokeStyle = "rgba(248,243,231,0.28)";
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          ctx.strokeRect(ox + k * (cw2 + g), oy + r * (ch2 + g), cw2, ch2);
        }
      }
      // 跨 2×2 图版块
      ctx.fillStyle = "#F8F3E7";
      ctx.fillRect(ox, oy, cw2 * 2 + g, ch2 * 2 + g);
      // 跨 2×1 标题槽
      ctx.fillStyle = COLORS.amber;
      ctx.fillRect(ox + (cw2 + g) * 2, oy, cw2 * 2 + g, ch2);
      // 右下交替图文块
      ctx.fillStyle = "rgba(248,243,231,0.18)";
      ctx.fillRect(ox + (cw2 + g) * 2, oy + (ch2 + g), cw2, ch2);
      ctx.fillStyle = "#F8F3E7";
      ctx.fillRect(ox + (cw2 + g) * 3, oy + (ch2 + g) * 2, cw2, ch2 * 2 + g);
      ctx.fillStyle = "rgba(248,243,231,0.18)";
      ctx.fillRect(ox, oy + (ch2 + g) * 3, cw2 * 2 + g, ch2);
      // 模拟文字细条
      ctx.fillStyle = "#062B1B";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(ox + (cw2 + g) * 2 + 8, oy + 10 + i * 8, cw2 * 1.4, 3);
      }
      drawEraFooter(ctx, w, h, "1981 · 瑞士 20 格模块化网格（等距缝宽 + 跨格图文合并）");
    } else {
      // 1995 阿德尔森棋盘明度上下文对比示意
      const n = 5;
      const c = box / n;
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) {
          const isLight = (r + k) % 2 === 0;
          ctx.fillStyle = isLight ? "#E6E1D3" : "#49544E";
          ctx.fillRect(ox + k * c, oy + r * c, c, c);
        }
      }
      // 柔和斜向阴影带
      ctx.fillStyle = "rgba(6, 26, 17, 0.44)";
      ctx.beginPath();
      ctx.moveTo(ox + box * 0.46, oy);
      ctx.lineTo(ox + box, oy);
      ctx.lineTo(ox + box, oy + box * 0.85);
      ctx.lineTo(ox + box * 0.25, oy + box);
      ctx.closePath();
      ctx.fill();
      // 标出 A 与 B 对比框
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(ox + c * 1 + 2, oy + c * 1 + 2, c - 4, c - 4);
      ctx.strokeRect(ox + c * 3 + 2, oy + c * 2 + 2, c - 4, c - 4);
      ctx.fillStyle = COLORS.amber;
      ctx.font = `700 13px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", ox + c * 1.5, oy + c * 1.5);
      ctx.fillText("B", ox + c * 3.5, oy + c * 2.5);
      drawEraFooter(ctx, w, h, "1995 · 棋盘邻格明度上下文效应（A 与 B 互借邻格反差）");
    }
  }

  function drawEraFooter(ctx2, w, h, text) {
    ctx2.fillStyle = "rgba(248,243,231,0.82)";
    ctx2.font = `500 11px "Noto Sans SC", sans-serif`;
    ctx2.textAlign = "center";
    ctx2.textBaseline = "bottom";
    ctx2.fillText(text, w / 2, h - 10);
  }

  function selectEra(id) {
    activeId = id;
    const item = HISTORY_ITEMS.find((x) => x.id === id) || HISTORY_ITEMS[0];
    for (const b of tabs) b.setAttribute("aria-pressed", String(b.dataset.era === id));
    titleEl.textContent = `${item.year} · ${item.title}`;
    enEl.textContent = `${item.place} · ${item.en}`;
    bodyEl.textContent = item.summary;
    noteEl.textContent = item.note;
    drawEra();
  }

  for (const b of tabs) {
    b.addEventListener("click", () => selectEra(b.dataset.era));
  }
  const ro = new ResizeObserver(drawEra);
  ro.observe(canvas);
  selectEra(HISTORY_ITEMS[0].id);
}

// ---------- 04 节：三招跳出瓷砖墙纸感（真实 DOM CSS Grid 活体跨页开关板） ----------
export function mountSection04() {
  const board = document.getElementById("s04-demo");
  const statusEl = document.getElementById("s04-status");
  if (!board || !statusEl) return;

  const tSpan = document.getElementById("s04-toggle-span");
  const tFocal = document.getElementById("s04-toggle-focal");
  const tTexture = document.getElementById("s04-toggle-texture");
  const tMobile = document.getElementById("s04-toggle-mobile");

  const flags = { span: false, focal: false, texture: false, mobile: false };

  function sync() {
    board.classList.toggle("is-span", flags.span);
    board.classList.toggle("is-focal", flags.focal);
    board.classList.toggle("is-texture", flags.texture);
    board.classList.toggle("is-mobile", flags.mobile);

    tSpan.setAttribute("aria-pressed", String(flags.span));
    tFocal.setAttribute("aria-pressed", String(flags.focal));
    tTexture.setAttribute("aria-pressed", String(flags.texture));
    tMobile.setAttribute("aria-pressed", String(flags.mobile));

    const activeMoves = [flags.span, flags.focal, flags.texture].filter(Boolean).length;
    if (flags.mobile) {
      statusEl.textContent = "窄屏 2 列降维提醒：桌面 4 列棋盘如果硬折成 2 列，原本横向交替的两格会变成竖向同色粘连，必须同步重排 DOM 顺序或调整奇偶背景。";
    } else if (activeMoves === 0) {
      statusEl.textContent = "原始 1:1 均等棋盘：每格大小、权重完全相同，像一面平整瓷砖墙——逐一点亮上方三招开关，观察版面如何生出层次与焦点。";
    } else if (activeMoves === 3) {
      statusEl.textContent = "三招齐发：2×1 跨格主标打破碎格、单枚琥珀金锁定第一眼、几何肌理格缓和黑白硬反差——这就是从「瓷砖墙」到「瑞士展讯跨页」的分水岭。";
    } else {
      const parts = [];
      if (flags.span) parts.push("2×1 跨格主标已建起阅读入口");
      if (flags.focal) parts.push("唯一琥珀金块已锁住视线停点");
      if (flags.texture) parts.push("点阵与斜线中间层已柔和黑白硬反差");
      statusEl.textContent = `已启用 ${activeMoves}/3 招：${parts.join("；")}。继续打开其余开关对比效果。`;
    }
  }

  tSpan.addEventListener("click", () => { flags.span = !flags.span; sync(); });
  tFocal.addEventListener("click", () => { flags.focal = !flags.focal; sync(); });
  tTexture.addEventListener("click", () => { flags.texture = !flags.texture; sync(); });
  tMobile.addEventListener("click", () => { flags.mobile = !flags.mobile; sync(); });
  sync();
}

// ---------- 05 节：什么时候别用棋盘（4 张踩坑稿 ↔ 对症改版双面翻卡） ----------
export function mountSection05() {
  const buttons = [...document.querySelectorAll("[data-flip-card]")];
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const card = btn.closest(".avoid-card");
      if (!card) return;
      const flipped = card.classList.toggle("is-fixed");
      btn.setAttribute("aria-pressed", String(flipped));
      btn.textContent = flipped ? "切回踩坑棋盘稿" : "看对症改版解法";
    });
  }
}

// ---------- 06 节：实战眼力小练习（2 道单变量视觉盲测题，纯 SVG 精确呈现） ----------
export function mountSection06() {
  const host = document.getElementById("s06-quiz");
  if (!host) return;
  const scoreBadge = document.getElementById("s06-score");

  const chosen = {}; // { q1: 'B', q2: 'D' }

  function miniBoardSvg(opt) {
    const size = 152;
    const cell = 30;
    const ox = 16;
    const oy = 16;
    const rects = [];
    const shiftPx = (opt.phase / 100) * cell * 0.56;

    for (let r = 0; r < 4; r++) {
      // 对称分配正负半偏移，让砖墙错缝在居中画框内清晰可读、绝不撞边裁切
      const dx = r % 2 === 0 ? shiftPx * 0.5 : -shiftPx * 0.5;
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const v = opt.grid[idx];
        if (v === -1) continue;
        const x = ox + c * cell + dx;
        const y = oy + r * cell;
        const fill = v === 1 ? COLORS.green : v === 2 ? COLORS.amber : COLORS.cream;
        rects.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell}" height="${cell}" fill="${fill}" stroke="rgba(7,80,49,0.22)" stroke-width="0.8"/>`);
        if (v === 2) {
          rects.push(`<circle cx="${(x + cell / 2).toFixed(1)}" cy="${(y + cell / 2).toFixed(1)}" r="6" fill="${COLORS.paper}"/>`);
        } else if (v === 0 && (r + c) % 3 === 1) {
          rects.push(`<line x1="${(x + 6).toFixed(1)}" y1="${(y + 11).toFixed(1)}" x2="${(x + 22).toFixed(1)}" y2="${(y + 11).toFixed(1)}" stroke="#141715" stroke-width="1.9"/>`);
          rects.push(`<line x1="${(x + 6).toFixed(1)}" y1="${(y + 18).toFixed(1)}" x2="${(x + 18).toFixed(1)}" y2="${(y + 18).toFixed(1)}" stroke="#47524B" stroke-width="1.3"/>`);
        }
      }
    }
    // 如有跨格主标槽（索引 5,6）
    if (opt.grid[5] === -1 && opt.grid[6] === -1) {
      const x = ox + cell;
      const y = oy + cell;
      rects.push(`<rect x="${x}" y="${y}" width="${cell * 2}" height="${cell}" fill="${COLORS.paper}" stroke="rgba(7,80,49,0.35)" stroke-width="1"/>`);
      rects.push(`<rect x="${x + 7}" y="${y + 9}" width="${(cell * 1.42).toFixed(1)}" height="4.8" fill="${COLORS.ink}"/>`);
      rects.push(`<rect x="${x + 7}" y="${y + 18}" width="${(cell * 0.72).toFixed(1)}" height="2.4" fill="${COLORS.green}"/>`);
    }

    return `<svg viewBox="0 0 ${size} ${size}" class="quiz-svg" aria-hidden="true">
      <rect width="${size}" height="${size}" fill="${COLORS.paper}"/>
      ${rects.join("")}
    </svg>`;
  }

  function render() {
    let correct = 0;
    let answered = 0;
    for (const q of QUIZ_ITEMS) {
      if (chosen[q.id]) {
        answered++;
        if (chosen[q.id] === q.answer) correct++;
      }
    }
    if (scoreBadge) {
      scoreBadge.textContent = answered === 0 ? "尚未作答 · 共 2 题" : `已答 ${answered}/2 题 · 答对 ${correct} 题`;
    }

    host.innerHTML = QUIZ_ITEMS.map((q) => {
      const pick = chosen[q.id];
      const pickedOpt = q.options.find((o) => o.key === pick);
      const isRight = pick === q.answer;
      return `
        <div class="quiz-block" data-qid="${q.id}">
          <p class="quiz-prompt">${q.prompt}</p>
          <div class="quiz-grid">
            ${q.options
              .map((o) => {
                const cls = [
                  "quiz-opt",
                  pick === o.key ? (isRight ? "is-correct" : "is-wrong") : "",
                  pick && !isRight && o.key === q.answer ? "is-reveal" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return `
                  <button type="button" class="${cls}" data-q="${q.id}" data-opt="${o.key}" aria-pressed="${pick === o.key}">
                    ${miniBoardSvg(o)}
                    <span class="quiz-opt-foot">
                      <strong>${o.label}</strong>
                      <span>${o.meta}</span>
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>
          <div class="quiz-feedback ${pick ? (isRight ? "is-ok" : "is-err") : ""}" aria-live="polite">
            ${
              pickedOpt
                ? `<strong>${isRight ? "判断准确" : `你选了 ${pickedOpt.label}（正解为方案 ${q.answer}）`}：</strong>${pickedOpt.reason}`
                : "练一练：观察四组微缩棋盘的交替结构、正交对齐与破格焦点，挑一挑你认为最稳健的方案。"
            }
          </div>
        </div>
      `;
    }).join("");

    for (const btn of host.querySelectorAll(".quiz-opt")) {
      btn.addEventListener("click", () => {
        chosen[btn.dataset.q] = btn.dataset.opt;
        render();
      });
    }
  }

  render();
}

// ---------- 07 节：原海报高清灯箱（点击放大、拖动平移、滚轮缩放、Esc 关闭） ----------
export function mountPosterLightbox() {
  const trigger = document.getElementById("poster-open");
  const thumb = document.getElementById("poster");
  const dialog = document.getElementById("poster-modal");
  const bigImg = document.getElementById("poster-modal-img");
  const closeBtn = document.getElementById("poster-close");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const resetBtn = document.getElementById("poster-zoom-reset");
  const stage = document.getElementById("poster-modal-stage");
  if (!trigger || !thumb || !dialog || !bigImg || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    bigImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function openModal() {
    bigImg.src = thumb.currentSrc || thumb.src; // 只复读已内联一次的海报 data URI
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeModal() {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  trigger.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (dialog.open || dialog.hasAttribute("open"))) {
      e.preventDefault();
      closeModal();
    }
  });
  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.8, +(scale - 0.35).toFixed(2));
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
      e.preventDefault();
      scale = Math.max(0.8, Math.min(3, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
      applyTransform();
    },
    { passive: false }
  );
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x: e.clientX - tx, y: e.clientY - ty };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { drag = null; });
  stage.addEventListener("pointercancel", () => { drag = null; });
}
