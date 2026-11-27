// 096 正文 01–07 节互动模块：每节完全不同控件形态，零模板复用
import { PALETTE, mixHex } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

// =====================================================================
// 01 节：0.6 秒闪现寻靶微实验（Flash-Glance Target Test）
// 亲身测出「单主跳出」vs「双主拉扯」vs「平权均质」的首眼寻找耗时
// =====================================================================
export function initGlanceLab() {
  const root = document.getElementById("glance-lab");
  if (!root) return;

  const grid = document.getElementById("glance-grid");
  const modeBtns = root.querySelectorAll("[data-gmode]");
  const btnFlash = document.getElementById("btn-glance-flash");
  const btnReveal = document.getElementById("btn-glance-reveal");
  const readout = document.getElementById("glance-readout");
  const subnote = document.getElementById("glance-subnote");
  const historyBox = document.getElementById("glance-history");

  const LABELS = [
    "器皿清单", "展厅导览", "主讲开幕", "釉色样本",
    "烧制温度", "手作体验", "馆藏笔记", "策展前言",
    "开放时段", "交通路线", "图录预约", "鸣谢名单",
  ];

  let mode = "clear"; // clear | dual | flat
  let targetIdx = 2;
  let distractors = [];
  let phase = "idle"; // idle | flashing | guessing | done
  let startTs = 0;
  let flashTimer = 0;
  const records = [];

  function pickIndices() {
    targetIdx = Math.floor(Math.random() * 12);
    const pool = [...Array(12).keys()].filter((i) => i !== targetIdx);
    // 简单洗牌
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    distractors = mode === "dual" ? pool.slice(0, 3) : [];
  }

  function renderGrid() {
    grid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "glance-cell";
      btn.dataset.idx = String(i);
      const isTarget = i === targetIdx;
      const isRival = distractors.includes(i);

      if (phase === "guessing") {
        btn.classList.add("is-masked");
        btn.innerHTML = `<span class="gc-mask">?</span><span class="gc-label">点选位置</span>`;
      } else {
        let role = "minor";
        if (mode === "clear") role = isTarget ? "hero" : "minor";
        else if (mode === "dual") role = isTarget ? "hero" : isRival ? "rival" : "minor";
        else role = "flat";

        btn.classList.add(`is-${role}`);
        if (phase === "done" && isTarget) btn.classList.add("is-hit-ring");
        const dotSize = role === "hero" ? 28 : role === "rival" ? 26 : role === "flat" ? 21 : 12;
        btn.innerHTML = `
          <span class="gc-dot" style="width:${dotSize}px;height:${dotSize}px"></span>
          <span class="gc-title">${isTarget ? "开幕演讲" : LABELS[i]}</span>
          <span class="gc-meta">${isTarget ? "14:00 主厅" : "常规条目"}</span>
        `;
      }

      btn.addEventListener("click", () => {
        if (phase !== "guessing") return;
        const ms = Math.round(performance.now() - startTs);
        const hit = i === targetIdx;
        phase = "done";
        const modeName = mode === "clear" ? "单主跳出" : mode === "dual" ? "多主互掐" : "平权均质";
        records.unshift({ modeName, hit, ms });
        if (records.length > 4) records.pop();
        readout.textContent = hit
          ? `命中！「${modeName}」下你在遮罩后 ${ms} ms 锁定了主角`
          : `点偏了！「${modeName}」下 0.6 秒根本抓不住唯一焦点（${ms} ms）`;
        readout.className = `glance-readout ${hit ? "is-ok" : "is-warn"}`;
        subnote.textContent =
          mode === "clear"
            ? "单一巨圆与窑红触发了前注意「跳出」，眼睛不用逐格阅读，一瞥就记住了坐标。"
            : mode === "dual"
              ? "4 个条目都在喊「看我」，0.6 秒里视线来回拉扯，很难确认哪一个才是真主角。"
              : "12 个条目视觉重量完全拉平，大脑被迫启动逐格串行搜索——全都是重点，等于没有重点。";
        renderHistory();
        renderGrid();
      });
      grid.appendChild(btn);
    }
  }

  function renderHistory() {
    if (!historyBox) return;
    if (!records.length) {
      historyBox.textContent = "尚无测速记录：点「闪现 0.6 秒」测一次你的第一眼锁定速度。";
      return;
    }
    historyBox.innerHTML = records
      .map((r) => `<span class="gh-pill ${r.hit ? "is-ok" : "is-warn"}">${r.modeName} · ${r.hit ? "命中" : "偏靶"} ${r.ms}ms</span>`)
      .join("");
  }

  function startFlash() {
    clearTimeout(flashTimer);
    pickIndices();
    phase = "flashing";
    readout.textContent = "盯住版面——记住「开幕演讲」在哪里…";
    readout.className = "glance-readout";
    subnote.textContent = "0.6 秒后版面会被遮罩，凭刚才第一眼的直觉点击它的位置。";
    renderGrid();
    flashTimer = setTimeout(() => {
      phase = "guessing";
      startTs = performance.now();
      readout.textContent = "现在点出刚才「开幕演讲」所在的格子！";
      renderGrid();
    }, 600);
  }

  modeBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      clearTimeout(flashTimer);
      mode = btn.dataset.gmode;
      modeBtns.forEach((b) => {
        const on = b.dataset.gmode === mode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      pickIndices();
      phase = "idle";
      readout.className = "glance-readout";
      readout.textContent =
        mode === "clear"
          ? "单主跳出模式：1 枚主角靠尺寸与窑红脱颖而出，其余 11 格安静衬托。"
          : mode === "dual"
            ? "多主互掐模式：4 个格子同时套上重色大圆，看看 0.6 秒内能不能分清真主。"
            : "平权均质模式：12 格大小与色阶完全相同，试试 0.6 秒找不找得到「开幕演讲」。";
      subnote.textContent = "点「闪现 0.6 秒」开始实测，或先直接肉眼观察三者的瞬间抓眼差异。";
      renderGrid();
    }),
  );

  btnFlash?.addEventListener("click", startFlash);
  btnReveal?.addEventListener("click", () => {
    clearTimeout(flashTimer);
    phase = "done";
    readout.className = "glance-readout";
    readout.textContent = `已揭晓答案：「开幕演讲」位于第 ${targetIdx + 1} 格（亮框标出）。`;
    renderGrid();
  });

  pickIndices();
  renderHistory();
  renderGrid();
}

// =====================================================================
// 02 节：6 枚陶土筹码 · 六维对比预算分配器（Budget Allocator）
// 教用户「不必六把对比全拧满，把预算集中在 2–3 把最克制有力」
// =====================================================================
export function initBudgetLab() {
  const root = document.getElementById("budget-lab");
  if (!root) return;

  const MAX_CHIPS = 6;
  const dims = [
    { key: "size", label: "大小对比", hint: "拉开面积与字号级差" },
    { key: "color", label: "色彩对比", hint: "主角独享窑红高彩度" },
    { key: "value", label: "明度对比", hint: "压暗深焙底托亮主角" },
    { key: "density", label: "疏密对比", hint: "主角独享宽裕呼吸留白" },
    { key: "position", label: "位置对比", hint: "主角稳占视觉核心区" },
    { key: "form", label: "形态对比", hint: "主角换独异圆拱印章" },
  ];

  // 默认停在「平均摊薄 1-1-1-1-1-1」让用户亲手把它聚拢成 2-3 把重锤！
  const chips = { size: 1, color: 1, value: 1, density: 1, position: 1, form: 1 };

  const elRemain = document.getElementById("budget-remain");
  const elSlots = document.getElementById("budget-slots");
  const elSvg = document.getElementById("budget-poster-svg");
  const elVerdict = document.getElementById("budget-verdict");
  const elStrategyBtns = root.querySelectorAll("[data-bstrategy]");

  const totalUsed = () => Object.values(chips).reduce((a, b) => a + b, 0);

  function renderPoster() {
    const s = chips.size; // 0..3
    const c = chips.color;
    const v = chips.value;
    const d = chips.density;
    const p = chips.position;
    const f = chips.form;

    const bg = v >= 2 ? "#2E1E15" : v === 1 ? "#E8D3B0" : "#F3E5CA";
    const ink = v >= 2 ? "#FAF0DE" : "#322117";
    const subInk = v >= 2 ? "#DFC49C" : "#6B4E35";
    const heroFill = c >= 2 ? "#C75527" : c === 1 ? "#B86B43" : v >= 2 ? "#E5C69A" : "#8B6A4B";
    const secFill = v >= 2 ? "#6B4C37" : "#C9A57A";

    const heroR = 34 + s * 16; // 34..82
    const secR = Math.max(11, 24 - s * 4);
    const heroX = p >= 2 ? 132 : p === 1 ? 116 : 96;
    const heroY = p >= 2 ? 148 : p === 1 ? 128 : 108;
    const secX = 248 + d * 12; // 疏密越高，次要区越紧收、主圆周围留白越阔
    const secGap = 54 - d * 8;
    const titleSize = 18 + s * 5;
    const subSize = Math.max(10, 14 - s);

    // 形态变化：0 圆 / 1 圆角方 / 2 拱门印章 / 3 菱形星标
    let heroShape = `<circle cx="${heroX}" cy="${heroY}" r="${heroR}" fill="${heroFill}"/>`;
    if (f === 1) {
      heroShape = `<rect x="${heroX - heroR * 0.9}" y="${heroY - heroR * 0.9}" width="${heroR * 1.8}" height="${heroR * 1.8}" rx="${heroR * 0.32}" fill="${heroFill}"/>`;
    } else if (f >= 2) {
      const w = heroR * 1.65;
      const h = heroR * 1.95;
      heroShape = `<path d="M${heroX - w / 2},${heroY + h * 0.48} L${heroX - w / 2},${heroY - h * 0.05} A${w / 2},${w / 2} 0 0,1 ${heroX + w / 2},${heroY - h * 0.05} L${heroX + w / 2},${heroY + h * 0.48} Z" fill="${heroFill}"/>`;
    }

    elSvg.innerHTML = `
      <rect width="380" height="280" fill="${bg}"/>
      <path d="M0 246 C110 218 148 54 380 28 L380 280 L0 280 Z" fill="${v >= 2 ? "#3A261B" : "#E5C9A1"}" opacity="0.72"/>
      ${d >= 2 ? `<circle cx="${heroX}" cy="${heroY}" r="${heroR + 18}" fill="none" stroke="${heroFill}" stroke-dasharray="4 5" stroke-opacity="0.45"/>` : ""}
      ${heroShape}
      <text x="${heroX}" y="${heroY + 4}" text-anchor="middle" fill="${c >= 1 || v < 2 ? "#FAF0DE" : "#251811"}" font-size="${titleSize}" font-weight="700" font-family="'Noto Serif SC', serif">器物</text>
      <text x="${heroX}" y="${heroY + 24}" text-anchor="middle" fill="${c >= 1 || v < 2 ? "#F5DFC0" : "#3E2A1E"}" font-size="11" font-family="'Outfit', sans-serif">BIENNALE 2026</text>

      ${[0, 1, 2]
        .map((k) => {
          const sy = 88 + k * secGap;
          const r = Math.max(8, secR - k * 2.5);
          return `
            <circle cx="${secX}" cy="${sy}" r="${r}" fill="${secFill}"/>
            <rect x="${secX + r + 10}" y="${sy - 6}" width="${68 - k * 8}" height="5" fill="${ink}" opacity="0.78"/>
            <rect x="${secX + r + 10}" y="${sy + 4}" width="${48 - k * 6}" height="3" fill="${subInk}" opacity="0.72"/>
          `;
        })
        .join("")}
      <text x="18" y="28" fill="${subInk}" font-size="${subSize}" font-weight="600" font-family="'Outfit', sans-serif">NO.096 · BUDGET SPECIMEN</text>
    `;

    // 单真源策略点评
    const used = totalUsed();
    const activeCount = Object.values(chips).filter((x) => x > 0).length;
    const maxSingle = Math.max(...Object.values(chips));
    let verdict = "";
    if (used === 0) {
      verdict = "尚未投入任何筹码：6 种对比全关，版面退回均质平铺。试着给 2–3 项各投 2–3 枚筹码。";
    } else if (activeCount >= 5) {
      verdict = `「胡椒面摊薄」：6 枚筹码撒在 ${activeCount} 个维度里，每把杠杆只动了一点点，没有一项能一锤定音。把筹码收拢到 2–3 项试试。`;
    } else if (activeCount === 1) {
      verdict = `「单维重锤」：全部筹码压在单一项（${maxSingle} 枚）。虽然能分主次，但视觉手法偏单调；分出 2 枚给第二项会更有呼吸感。`;
    } else if (activeCount >= 2 && activeCount <= 3 && used >= 5) {
      verdict = `「克制且有力」：把 ${used} 枚预算集中在 ${activeCount} 把主对比上，其余维度保持安静统一——这正是成熟版面最稳的「2–3 杠杆法则」。`;
    } else {
      verdict = `当前已投 ${used}/${MAX_CHIPS} 枚筹码、启用 ${activeCount} 项对比；还能再投 ${MAX_CHIPS - used} 枚，观察哪一项最提气。`;
    }
    elVerdict.textContent = verdict;
  }

  function renderSlots() {
    const used = totalUsed();
    elRemain.textContent = `剩余筹码 ${MAX_CHIPS - used} / ${MAX_CHIPS}`;
    elSlots.innerHTML = dims
      .map((d) => {
        const val = chips[d.key];
        const dots = [0, 1, 2]
          .map((k) => `<span class="chip-pip ${k < val ? "is-filled" : ""}"></span>`)
          .join("");
        return `
          <div class="budget-row">
            <div class="budget-info">
              <strong>${d.label}</strong>
              <span>${d.hint}</span>
            </div>
            <div class="budget-pips" aria-label="${d.label} ${val} 枚">${dots}</div>
            <div class="budget-stepper">
              <button type="button" class="step-btn" data-bdec="${d.key}" aria-label="减少${d.label}" ${val <= 0 ? "disabled" : ""}>−</button>
              <span class="step-num">${val}</span>
              <button type="button" class="step-btn" data-binc="${d.key}" aria-label="增加${d.label}" ${val >= 3 || used >= MAX_CHIPS ? "disabled" : ""}>+</button>
            </div>
          </div>
        `;
      })
      .join("");

    elSlots.querySelectorAll("[data-binc]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const k = btn.dataset.binc;
        if (chips[k] < 3 && totalUsed() < MAX_CHIPS) {
          chips[k]++;
          renderSlots();
          renderPoster();
        }
      }),
    );
    elSlots.querySelectorAll("[data-bdec]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const k = btn.dataset.bdec;
        if (chips[k] > 0) {
          chips[k]--;
          renderSlots();
          renderPoster();
        }
      }),
    );
  }

  const STRATEGIES = {
    spread: { size: 1, color: 1, value: 1, density: 1, position: 1, form: 1 },
    poster: { size: 2, color: 2, value: 0, density: 2, position: 0, form: 0 },
    noir: { size: 2, color: 0, value: 2, density: 0, position: 0, form: 2 },
  };

  elStrategyBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const s = STRATEGIES[btn.dataset.bstrategy];
      if (!s) return;
      Object.assign(chips, s);
      renderSlots();
      renderPoster();
    }),
  );

  renderSlots();
  renderPoster();
}

// =====================================================================
// 03 节（深焙咖啡暗室）：二维「对比 × 协调」相图画布 + 三条统一暗桥
// =====================================================================
export function initPhaseLab() {
  const canvas = document.getElementById("phase-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const elReadout = document.getElementById("phase-readout");
  const elPreview = document.getElementById("phase-preview-svg");
  const bridgeBtns = document.querySelectorAll("[data-bridge]");

  // 默认落在「高对比 × 低协调（刺眼拼贴区）」，让用户拖进右上甜点区或搭起三条暗桥！
  let cxVal = 0.80; // 0..1 对比强度
  let cyVal = 0.24; // 0..1 协调统一
  const bridges = { palette: false, type: false, axis: false };

  let W = 320;
  let H = 260;

  function syncBridgesFromPoint() {
    bridges.palette = cyVal >= 0.45;
    bridges.type = cyVal >= 0.62;
    bridges.axis = cyVal >= 0.78;
    bridgeBtns.forEach((b) => {
      const on = bridges[b.dataset.bridge];
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function syncPointFromBridges() {
    const cnt = Object.values(bridges).filter(Boolean).length;
    cyVal = 0.20 + cnt * 0.24;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = pixelRatio(2);
    W = Math.round(r.width);
    H = Math.round(r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const pad = { l: 38, r: 16, t: 18, b: 34 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#21150E";
    ctx.fillRect(0, 0, W, H);

    // 四个象限底色
    const mx = pad.l + pw * 0.5;
    const my = pad.t + ph * 0.5;
    // 右上甜点区（高对比 + 高协调）
    ctx.fillStyle = "rgba(196, 85, 40, 0.22)";
    ctx.fillRect(mx, pad.t, pw * 0.5, ph * 0.5);
    // 右下拼贴区（高对比 + 低协调）
    ctx.fillStyle = "rgba(184, 37, 28, 0.14)";
    ctx.fillRect(mx, my, pw * 0.5, ph * 0.5);
    // 左上沉闷区
    ctx.fillStyle = "rgba(223, 191, 150, 0.06)";
    ctx.fillRect(pad.l, pad.t, pw * 0.5, ph * 0.5);

    // 网格与中线
    ctx.strokeStyle = "rgba(232, 200, 158, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, pw, ph);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mx, pad.t);
    ctx.lineTo(mx, pad.t + ph);
    ctx.moveTo(pad.l, my);
    ctx.lineTo(pad.l + pw, my);
    ctx.stroke();
    ctx.setLineDash([]);

    // 象限标注
    ctx.font = `500 11px "Noto Serif SC", serif`;
    ctx.fillStyle = "rgba(232, 200, 158, 0.72)";
    ctx.textAlign = "left";
    ctx.fillText("单调沉闷", pad.l + 8, pad.t + 18);
    ctx.fillText("平权散乱", pad.l + 8, pad.t + ph - 10);
    ctx.textAlign = "right";
    ctx.fillStyle = "#F5C69C";
    ctx.fillText("高对比 × 高协调（甜点）", pad.l + pw - 8, pad.t + 18);
    ctx.fillStyle = "#FF9E92";
    ctx.fillText("刺眼拼贴（失协）", pad.l + pw - 8, pad.t + ph - 10);

    // 坐标轴标题
    ctx.fillStyle = "#E8C89E";
    ctx.textAlign = "center";
    ctx.font = `500 11px "Outfit", "Noto Serif SC", sans-serif`;
    ctx.fillText("对比强度 →", pad.l + pw / 2, H - 10);
    ctx.save();
    ctx.translate(14, pad.t + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("协调统一 →", 0, 0);
    ctx.restore();

    // 当前坐标点
    const px = pad.l + cxVal * pw;
    const py = pad.t + (1 - cyVal) * ph;
    const inSweet = cxVal >= 0.52 && cyVal >= 0.52;

    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fillStyle = inSweet ? "rgba(127, 224, 178, 0.24)" : "rgba(255, 133, 122, 0.24)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = inSweet ? "#7FE0B2" : "#FF857A";
    ctx.fill();
    ctx.strokeStyle = "#21150E";
    ctx.lineWidth = 2;
    ctx.stroke();

    renderPreview();
  }

  function renderPreview() {
    const heroR = 26 + cxVal * 34;
    const secR = Math.max(9, 24 - cxVal * 12);
    const sameHue = bridges.palette;
    const sameType = bridges.type;
    const sameAxis = bridges.axis;

    const heroCol = cxVal > 0.45 ? "#C9592B" : "#B5895A";
    const secCol1 = sameHue ? "#C59D72" : "#2D8CB8";
    const secCol2 = sameHue ? "#B2865A" : "#8B4BC4";
    const secCol3 = sameHue ? "#D2B189" : "#44A366";

    const axisX = sameAxis ? 218 : 204;
    const x2 = sameAxis ? 218 : 238;
    const x3 = sameAxis ? 218 : 196;
    const fFamily = sameType ? "'Noto Serif SC', serif" : "'Outfit', sans-serif";
    const secStroke = sameHue ? "none" : "#FAF0DE";

    elPreview.innerHTML = `
      <rect width="360" height="230" fill="#F0DEBF"/>
      <path d="M0 198 C100 180 140 42 360 22 L360 230 L0 230 Z" fill="#E6C9A2"/>
      ${sameAxis ? `<line x1="${axisX}" y1="24" x2="${axisX}" y2="206" stroke="#963814" stroke-dasharray="3 4" stroke-opacity="0.45"/>` : ""}
      <circle cx="104" cy="118" r="${heroR}" fill="${heroCol}"/>
      <text x="104" y="123" text-anchor="middle" fill="#FAF0DE" font-size="${14 + cxVal * 8}" font-weight="700" font-family="'Noto Serif SC', serif">窑变</text>

      <g>
        ${sameHue ? `<circle cx="${axisX}" cy="64" r="${secR}" fill="${secCol1}"/>` : `<rect x="${axisX - secR}" y="${64 - secR}" width="${secR * 2}" height="${secR * 2}" transform="rotate(20 ${axisX} 64)" fill="${secCol1}" stroke="${secStroke}" stroke-width="1.5"/>`}
        <text x="${axisX + secR + 12}" y="68" fill="#322117" font-size="12" font-weight="700" font-family="${fFamily}">展期 10.18</text>
      </g>
      <g>
        ${sameHue ? `<circle cx="${x2}" cy="118" r="${secR * 0.85}" fill="${secCol2}"/>` : `<polygon points="${x2},${118 - secR} ${x2 + secR},${118 + secR} ${x2 - secR},${118 + secR}" fill="${secCol2}" stroke="${secStroke}" stroke-width="1.5"/>`}
        <text x="${x2 + secR + 12}" y="122" fill="#322117" font-size="11" font-family="${fFamily}">东翼二号厅</text>
      </g>
      <g>
        <circle cx="${x3}" cy="172" r="${secR * 0.7}" fill="${secCol3}"/>
        <text x="${x3 + secR + 12}" y="176" fill="#5A402B" font-size="10.5" font-family="${fFamily}">预约免费参观</text>
      </g>
    `;

    const cPct = Math.round(cxVal * 100);
    const hPct = Math.round(cyVal * 100);
    let zoneDesc = "";
    if (cxVal >= 0.52 && cyVal >= 0.52) {
      zoneDesc = `【甜点区 · 对比 ${cPct}% / 协调 ${hPct}%】主角一眼跳出，同时三条暗桥把配角稳稳收拢在同一张版面的呼吸里。`;
    } else if (cxVal >= 0.52 && cyVal < 0.52) {
      zoneDesc = `【刺眼拼贴区 · 对比 ${cPct}% / 协调 ${hPct}%】虽然分出了大小，但异色、异形与断轴让辅元素像强行粘上的补丁。点亮三条暗桥看看！`;
    } else if (cxVal < 0.52 && cyVal >= 0.52) {
      zoneDesc = `【单调沉闷区 · 对比 ${cPct}% / 协调 ${hPct}%】配色与对齐很和谐，但主次拉不开差距，整张图温吞发闷。往右拖提高对比！`;
    } else {
      zoneDesc = `【平权散乱区 · 对比 ${cPct}% / 协调 ${hPct}%】既看不出主角，又东倒西歪缺乏统一感。`;
    }
    elReadout.textContent = zoneDesc;
  }

  let dragging = false;
  function updateFromClient(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const pad = { l: 38, r: 16, t: 18, b: 34 };
    const x = clientX - r.left;
    const y = clientY - r.top;
    cxVal = Math.max(0.06, Math.min(0.95, (x - pad.l) / Math.max(1, r.width - pad.l - pad.r)));
    cyVal = Math.max(0.06, Math.min(0.95, 1 - (y - pad.t) / Math.max(1, r.height - pad.t - pad.b)));
    syncBridgesFromPoint();
    draw();
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    updateFromClient(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    updateFromClient(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("keydown", (e) => {
    const step = 0.08;
    if (e.key === "ArrowRight") cxVal = Math.min(0.95, cxVal + step);
    else if (e.key === "ArrowLeft") cxVal = Math.max(0.06, cxVal - step);
    else if (e.key === "ArrowUp") cyVal = Math.min(0.95, cyVal + step);
    else if (e.key === "ArrowDown") cyVal = Math.max(0.06, cyVal - step);
    else return;
    e.preventDefault();
    syncBridgesFromPoint();
    draw();
  });

  bridgeBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const k = btn.dataset.bridge;
      bridges[k] = !bridges[k];
      btn.classList.toggle("is-active", bridges[k]);
      btn.setAttribute("aria-pressed", String(bridges[k]));
      syncPointFromBridges();
      draw();
    }),
  );

  new ResizeObserver(resize).observe(canvas);
  syncBridgesFromPoint();
  resize();
}

// =====================================================================
// 04 节：从宋画宾主到认知实验（四代历史标本 + 鲁宾图底可调明度翻转）
// =====================================================================
export function initHistoryLab() {
  const root = document.getElementById("history-lab");
  if (!root) return;

  const tabs = root.querySelectorAll("[data-era]");
  const stage = document.getElementById("history-diagram");
  const titleEl = document.getElementById("history-title");
  const citeEl = document.getElementById("history-cite");
  const bodyEl = document.getElementById("history-body");
  const rubinBar = document.getElementById("rubin-control");
  const rubinRange = document.getElementById("ctrl-rubin");
  const rubinVal = document.getElementById("val-rubin");

  let currentEra = "song";
  let rubinBalance = 50; // 0: 花瓶绝对主导 / 50: 图底势均力敌翻转 / 100: 双人侧影绝对主导

  const ERAS = {
    song: {
      title: "北宋 · 郭熙、郭思《林泉高致·山水训》",
      cite: "约 11 世纪后期 · 「大山堂堂，为众山之主」",
      body: "东方画论早在近千年前就把构图里的主次称为「宾主」。郭熙在《山水训》里写：「大山堂堂，为众山之主，所以分布以次冈阜林壑为远近大小之宗主也……长松亭亭，为众木之表。」先立一座堂堂正正的主峰，群山冈阜依附拱卫，整幅长卷才不散架。",
      svg: () => `
        <svg viewBox="0 0 380 230" class="hist-svg" role="img" aria-label="宋画主峰宾山构图示意">
          <rect width="380" height="230" fill="#F0DEBF"/>
          <path d="M0 198 Q90 165 180 185 T380 175 L380 230 L0 230 Z" fill="#E3C79E"/>
          <!-- 宾山（柔和低伏） -->
          <path d="M18 192 Q58 124 98 148 Q128 166 146 192 Z" fill="#C49A6E"/>
          <path d="M242 192 Q284 128 320 144 Q346 156 364 192 Z" fill="#C49A6E"/>
          <path d="M286 198 Q322 156 366 176 L366 198 Z" fill="#B58454"/>
          <!-- 主峰（堂堂居中高耸） -->
          <path d="M104 198 Q144 82 190 36 Q236 86 276 198 Z" fill="#322117"/>
          <path d="M190 36 Q216 94 252 198 L190 198 Z" fill="#462F21"/>
          <circle cx="190" cy="36" r="5" fill="#C45528"/>
          <line x1="190" y1="36" x2="190" y2="198" stroke="#C45528" stroke-dasharray="3 4" stroke-opacity="0.7"/>
          <text x="190" y="24" text-anchor="middle" fill="#963814" font-size="12" font-weight="700" font-family="'Noto Serif SC', serif">主峰 · 众山之主</text>
          <text x="64" y="118" text-anchor="middle" fill="#6B4724" font-size="11" font-family="'Noto Serif SC', serif">宾山拱卫</text>
          <text x="316" y="122" text-anchor="middle" fill="#6B4724" font-size="11" font-family="'Noto Serif SC', serif">冈阜呼应</text>
        </svg>`,
    },
    dow: {
      title: "1899 · Arthur Wesley Dow《Composition》",
      cite: "现代构图教育经典 · 将 Subordination（主从）列为五大构图原则之一",
      body: "美国艺术教育家 Arthur Wesley Dow 在 1899 年初版的《Composition》里，将「主从关系（Subordination）」与对立、过渡、重复、对称并列为构图五大根基。他以自然界作比：一棵树靠主干统领千枝，一片叶靠主脉统摄细脉——「万千部件围绕单一主导核心组织成一个简洁整体」。",
      svg: () => `
        <svg viewBox="0 0 380 230" class="hist-svg" role="img" aria-label="Dow 主干统领枝条示意">
          <rect width="380" height="230" fill="#F0DEBF"/>
          <rect x="26" y="20" width="328" height="190" fill="none" stroke="#C39A6F" stroke-width="1.2"/>
          <!-- 主干 -->
          <path d="M132 204 C134 152 146 106 160 36" stroke="#C45528" stroke-width="16" stroke-linecap="round" fill="none"/>
          <!-- 次枝 -->
          <path d="M142 138 C186 122 224 102 266 70" stroke="#322117" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path d="M148 96 C192 92 232 98 286 112" stroke="#8C6239" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M136 164 C104 148 78 124 58 92" stroke="#8C6239" stroke-width="5" stroke-linecap="round" fill="none"/>
          <!-- 细枝 -->
          <path d="M214 104 C228 84 240 66 254 46" stroke="#B58454" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M224 100 C252 108 276 124 306 144" stroke="#B58454" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <text x="160" y="200" fill="#963814" font-size="12" font-weight="700" font-family="'Noto Serif SC', serif">主干（主导）</text>
          <text x="276" y="64" fill="#322117" font-size="11" font-family="'Noto Serif SC', serif">次枝承接</text>
          <text x="278" y="160" fill="#6B4724" font-size="10.5" font-family="'Noto Serif SC', serif">末梢细脉</text>
        </svg>`,
    },
    rubin: {
      title: "1915 / 1954 · 鲁宾图底分离 × 阿恩海姆视觉重量",
      cite: "Edgar Rubin《Synsoplevede Figurer》(1915) · Rudolf Arnheim《Art and Visual Perception》(1954 / 1974)",
      body: "丹麦心理学家 Edgar Rubin 通过著名的「鲁宾花瓶」证明：面对共享边界的两个区域，人脑同一刻只能把一侧读作「图形（主）」、另一侧退作「背景（次）」。如果两者重量势均力敌，视野就会反复翻转失主；1954 年 Rudolf Arnheim 进一步指出，决定谁当「主」的视觉重量来自面积、色彩、孤立度与位置的合力。",
      svg: () => {
        // 根据 rubinBalance (0..100) 调整花瓶与双侧影的明度/色度权重，纯剪影零五官！
        const b = rubinBalance / 100;
        const vaseFill = mixHex("#C45528", "#DFC49C", b);
        const faceFill = mixHex("#E7CFA9", "#322117", b);
        const label =
          rubinBalance < 35
            ? "花瓶主导（双侧影退为背景）"
            : rubinBalance > 65
              ? "双人侧影主导（花瓶退为留白）"
              : "50/50 势均力敌：图底在眼前反复翻转失主";
        return `
        <svg viewBox="0 0 380 230" class="hist-svg" role="img" aria-label="鲁宾花瓶与双侧影明度翻转实验">
          <rect x="52" y="16" width="276" height="180" fill="${faceFill}"/>
          <!-- 中央经典鲁宾花瓶轮廓（自然形成左右无五官纯剪影侧脸轮廓） -->
          <path d="M132 16 L248 16 C244 46 216 58 214 78 C212 92 232 98 228 112 C226 120 212 124 214 132 C216 140 226 144 222 154 C216 168 198 176 232 196 L148 196 C182 176 164 168 158 154 C154 144 164 140 166 132 C168 124 154 120 152 112 C148 98 168 92 166 78 C164 58 136 46 132 16 Z" fill="${vaseFill}"/>
          <rect x="52" y="16" width="276" height="180" fill="none" stroke="#963814" stroke-opacity="0.35"/>
          <text x="190" y="216" text-anchor="middle" fill="#322117" font-size="11.5" font-weight="700" font-family="'Noto Serif SC', serif">${label}</text>
        </svg>`;
      },
    },
    treisman: {
      title: "1980 · Treisman & Gelade 特征整合理论",
      cite: "Cognitive Psychology 12(1): 97–136 · 前注意「跳出」与串行搜索",
      body: "认知心理学家 Anne Treisman 与 Garry Gelade 在 1980 年的经典论文里证明：当目标在单一视觉特征（如高饱和窑红或明显大尺幅）上与周围截然不同时，视觉系统在意识介入前就并行捕获，称为「跳出（Pop-out）」，耗时几乎不受配角数量影响；但若特征交叉混杂、主次不明确，眼睛只能逐项慢扫。",
      svg: () => `
        <svg viewBox="0 0 380 230" class="hist-svg" role="img" aria-label="特征跳出与合取慢扫对照">
          <rect width="380" height="230" fill="#F0DEBF"/>
          <!-- 左：单特征 Pop-out -->
          <rect x="16" y="18" width="166" height="164" fill="#F7ECD8" stroke="#C39A6F"/>
          ${Array.from({ length: 16 }, (_, k) => {
            const x = 42 + (k % 4) * 38;
            const y = 46 + Math.floor(k / 4) * 36;
            const isHero = k === 5;
            return `<circle cx="${x}" cy="${y}" r="${isHero ? 14 : 9}" fill="${isHero ? "#C45528" : "#C9A57A"}"/>`;
          }).join("")}
          <text x="99" y="204" text-anchor="middle" fill="#1E5C3F" font-size="11.5" font-weight="700" font-family="'Noto Serif SC', serif">单维跳出 · 并行一眼即中</text>

          <!-- 右：特征混战 Conjunction -->
          <rect x="198" y="18" width="166" height="164" fill="#F7ECD8" stroke="#C39A6F"/>
          ${Array.from({ length: 16 }, (_, k) => {
            const x = 224 + (k % 4) * 38;
            const y = 46 + Math.floor(k / 4) * 36;
            const col = k % 3 === 0 ? "#C45528" : k % 3 === 1 ? "#322117" : "#B58454";
            return k % 2 === 0
              ? `<circle cx="${x}" cy="${y}" r="10.5" fill="${col}"/>`
              : `<rect x="${x - 9.5}" y="${y - 9.5}" width="19" height="19" fill="${col}"/>`;
          }).join("")}
          <text x="281" y="204" text-anchor="middle" fill="#B8251C" font-size="11.5" font-weight="700" font-family="'Noto Serif SC', serif">多维互抢 · 被迫逐个慢扫</text>
        </svg>`,
    },
  };

  function render() {
    const era = ERAS[currentEra];
    titleEl.textContent = era.title;
    citeEl.textContent = era.cite;
    bodyEl.textContent = era.body;
    stage.innerHTML = era.svg();
    rubinBar.hidden = currentEra !== "rubin";
    if (rubinVal) rubinVal.textContent = `${rubinBalance}%`;
  }

  tabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      currentEra = btn.dataset.era;
      tabs.forEach((b) => {
        const on = b.dataset.era === currentEra;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    }),
  );

  rubinRange?.addEventListener("input", () => {
    rubinBalance = Number(rubinRange.value);
    render();
  });

  render();
}

// =====================================================================
// 05 节：什么时候别用强主次（四场景「强加主次翻车 vs 恰当平权」翻牌卡）
// =====================================================================
export function initAntiLab() {
  const cards = document.querySelectorAll("[data-anti]");
  if (!cards.length) return;

  const ART = {
    timetable: {
      bad: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/><rect x="12" y="14" width="216" height="44" fill="#C45528"/><text x="22" y="42" fill="#FAF0DE" font-size="18" font-weight="700" font-family="'Outfit',sans-serif">G108  09:15</text><rect x="12" y="66" width="216" height="14" fill="#E3CCA8"/><rect x="12" y="86" width="216" height="14" fill="#E3CCA8"/><rect x="12" y="106" width="216" height="14" fill="#E3CCA8"/></svg>`,
      good: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/>${[0, 1, 2, 3].map((i) => `<rect x="12" y="${14 + i * 28}" width="216" height="22" fill="${i % 2 ? "#EFE0C4" : "#FAF3E4"}" stroke="#D5B991"/><text x="22" y="${29 + i * 28}" fill="#322117" font-size="11" font-family="'Outfit',sans-serif">G10${6 + i}   0${8 + i}:15   站台 ${i + 2}</text>`).join("")}</svg>`,
      badNote: "硬把其中一班车放大涂红，反而干扰查其他车次的乘客。",
      goodNote: "时刻表按需检索，每行保持同等重量才公平高效。",
    },
    catalog: {
      bad: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/><rect x="12" y="14" width="124" height="102" fill="#C45528"/><rect x="146" y="14" width="82" height="28" fill="#D2B086"/><rect x="146" y="50" width="82" height="28" fill="#D2B086"/><rect x="146" y="86" width="82" height="30" fill="#D2B086"/></svg>`,
      good: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/>${[0, 1, 2, 3].map((i) => `<rect x="${12 + (i % 2) * 112}" y="${14 + Math.floor(i / 2) * 54}" width="104" height="46" fill="#E8CCA6" stroke="#C39A6F"/><circle cx="${36 + (i % 2) * 112}" cy="${37 + Math.floor(i / 2) * 54}" r="11" fill="#8C6239"/>`).join("")}</svg>`,
      badNote: "平等作品集里强推某一件，容易误导观者以为其余只是附庸。",
      goodNote: "公平陈列与目录选购更适合等权网格，把决定权交还给读者。",
    },
    pattern: {
      bad: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#E8CCA6"/>${Array.from({ length: 18 }, (_, i) => `<circle cx="${20 + (i % 6) * 40}" cy="${24 + Math.floor(i / 6) * 40}" r="6" fill="#B58454"/>`).join("")}<circle cx="120" cy="64" r="32" fill="#C45528"/></svg>`,
      good: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#E8CCA6"/>${Array.from({ length: 18 }, (_, i) => `<circle cx="${20 + (i % 6) * 40}" cy="${24 + Math.floor(i / 6) * 40}" r="8" fill="#B58454" opacity="0.85"/>`).join("")}</svg>`,
      badNote: "底纹里塞进一个强主圆，平静的肌理场域瞬间被戳破。",
      goodNote: "织物印花与留白背景靠均匀韵律呼吸，刻意去主化才耐看。",
    },
    versus: {
      bad: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/><circle cx="76" cy="66" r="42" fill="#C45528"/><circle cx="186" cy="78" r="14" fill="#C39A6F"/></svg>`,
      good: `<svg viewBox="0 0 240 130" aria-hidden="true"><rect width="240" height="130" fill="#F7ECD8"/><line x1="120" y1="14" x2="120" y2="116" stroke="#963814" stroke-dasharray="3 4"/><circle cx="64" cy="65" r="34" fill="#C45528"/><circle cx="176" cy="65" r="34" fill="#322117"/></svg>`,
      badNote: "辩论双方一巨一微，还没开场版面就已经替观众判了胜负。",
      goodNote: "表达势均力敌的对峙或并列对话时，刻意均权反而是准确叙事。",
    },
  };

  cards.forEach((card) => {
    const key = card.dataset.anti;
    const data = ART[key];
    const preview = card.querySelector(".anti-preview");
    const note = card.querySelector(".anti-note");
    const btn = card.querySelector(".anti-toggle");
    let showGood = false;

    function sync() {
      preview.innerHTML = showGood ? data.good : data.bad;
      note.textContent = showGood ? data.goodNote : data.badNote;
      btn.textContent = showGood ? "看强加主次（翻车）" : "切回恰当去主化";
      btn.setAttribute("aria-pressed", String(showGood));
      card.classList.toggle("is-good", showGood);
    }

    btn.addEventListener("click", () => {
      showGood = !showGood;
      sync();
    });
    sync();
  });
}

// =====================================================================
// 06 节（深焙咖啡考场）：小练习（2 道四选一，只差一个变量，中性编号）
// =====================================================================
export function initQuiz() {
  const root = document.getElementById("quiz-box");
  if (!root) return;

  const qTitle = document.getElementById("quiz-question");
  const qGrid = document.getElementById("quiz-options");
  const qFeed = document.getElementById("quiz-feedback");
  const qTabs = root.querySelectorAll("[data-qidx]");

  const QUESTIONS = [
    {
      prompt: "同一张《秋窑手作展》展讯海报，文案完全相同，下面四版只改动了一个关系变量。哪一版的主次最清晰且整体最协调？",
      answer: "B",
      options: [
        {
          id: "A",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F0DEBF"/><circle cx="48" cy="40" r="21" fill="#C45528"/><rect x="76" y="30" width="84" height="7" fill="#322117"/><rect x="76" y="42" width="60" height="4" fill="#8C6239"/><circle cx="48" cy="90" r="20" fill="#B58454"/><rect x="76" y="80" width="82" height="7" fill="#322117"/><rect x="76" y="92" width="62" height="4" fill="#8C6239"/></svg>`,
          reason: "方案 A（对比不足）：主圆与辅圆几乎等大，两行标题粗细雷同，视觉重量上下拉平，第一眼分不出谁主谁次。",
        },
        {
          id: "B",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F0DEBF"/><path d="M0 108 C54 98 76 26 180 14 L180 128 L0 128 Z" fill="#E6C9A2"/><circle cx="58" cy="66" r="36" fill="#C45528"/><circle cx="118" cy="36" r="10" fill="#B58454"/><rect x="134" y="32" width="32" height="4" fill="#6B4724"/><rect x="134" y="39" width="22" height="2.5" fill="#9E774D"/><circle cx="118" cy="68" r="8" fill="#BD9162"/><rect x="134" y="65" width="28" height="3.5" fill="#6B4724"/><circle cx="118" cy="96" r="6" fill="#C79F74"/><rect x="134" y="94" width="24" height="3" fill="#8C6239"/></svg>`,
          reason: "答对了！方案 B 靠大尺幅 + 窑红确立唯一主导，右侧三组信息以同色系沙金按阶梯退让并共享纵轴，既主次分明又协调统一。",
        },
        {
          id: "C",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F0DEBF"/><path d="M0 108 C54 98 76 26 180 14 L180 128 L0 128 Z" fill="#E6C9A2"/><circle cx="56" cy="64" r="34" fill="#C45528"/><circle cx="118" cy="34" r="9" fill="#B58454"/><rect x="132" y="31" width="32" height="4" fill="#6B4724"/><rect x="104" y="66" width="66" height="48" fill="#C45528"/><rect x="114" y="82" width="46" height="6" fill="#FAF0DE"/><rect x="114" y="94" width="34" height="4" fill="#F5DFC0"/></svg>`,
          reason: "方案 C（双主互掐）：右下角的票务注脚被套上满底高饱和窑红大块，分量几乎与左侧主圆抗衡，视线在两块红之间反复拉扯。",
        },
        {
          id: "D",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F0DEBF"/><path d="M0 108 C54 98 76 26 180 14 L180 128 L0 128 Z" fill="#E6C9A2"/><circle cx="58" cy="66" r="36" fill="#C45528"/><polygon points="118,24 128,44 108,44" fill="#2A7298"/><rect x="134" y="32" width="32" height="4" fill="#2A7298"/><rect x="110" y="60" width="16" height="16" transform="rotate(35 118 68)" fill="#6D3B9E"/><rect x="134" y="65" width="28" height="3.5" fill="#6D3B9E"/><polygon points="118,88 125,102 111,102" fill="#2E9960"/><rect x="134" y="94" width="24" height="3" fill="#2E9960"/></svg>`,
          reason: "方案 D（对比过火、失协割裂）：主圆大小和位置都没错，但次要元素硬换成了毫不相干的冷青、电紫与尖锐杂形，破坏了整体协调统一。",
        },
      ],
    },
    {
      prompt: "第二题（无彩色书封）：不借用彩色，只靠大小、明度与疏密确立主次，下面哪一版既突出书名又让作者与出版信息稳稳承托？",
      answer: "C",
      options: [
        {
          id: "A",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F4EAD7"/><rect x="10" y="10" width="54" height="10" fill="#322117"/><rect x="36" y="42" width="108" height="14" fill="#6B5A4C"/><rect x="36" y="64" width="108" height="14" fill="#6B5A4C"/><rect x="36" y="86" width="84" height="10" fill="#8C7B6B"/></svg>`,
          reason: "方案 A（位置与尺幅倒挂）：主标题缩在左上贴边角落，反倒是次要简介与出版行占满了正中大片面积。",
        },
        {
          id: "B",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F4EAD7"/><rect x="18" y="84" width="144" height="14" fill="#322117"/><rect x="18" y="102" width="120" height="6" fill="#5A4738"/><rect x="18" y="112" width="96" height="5" fill="#7D6857"/></svg>`,
          reason: "方案 B（疏密失衡）：主次全部死挤在底边 30% 的窄条里，主标题周围没有独立呼吸空间，上方大片留白反而像没排完。",
        },
        {
          id: "C",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F4EAD7"/><rect x="26" y="34" width="112" height="20" fill="#251811"/><rect x="26" y="60" width="76" height="6" fill="#7A624B"/><line x1="26" y1="88" x2="154" y2="88" stroke="#C5AE8F"/><rect x="26" y="98" width="58" height="5" fill="#6B5440"/><rect x="26" y="107" width="42" height="4" fill="#8A725B"/></svg>`,
          reason: "答对了！方案 C 在无彩色下依然成立：浓墨大号书名独享充裕留白居中偏上立主，中灰副题与底栏出版信息成组轻托，清晰克制。",
        },
        {
          id: "D",
          svg: `<svg viewBox="0 0 180 128"><rect width="180" height="128" fill="#F4EAD7"/><rect x="26" y="34" width="112" height="20" fill="#251811"/><rect x="26" y="98" width="58" height="4" fill="#E6D7BE"/><rect x="26" y="106" width="42" height="3" fill="#EAE0CA"/></svg>`,
          reason: "方案 D（支撑失能）：把次要作者与出版信息调得太浅，几乎融进纸底，失去了辅助说明的功能。",
        },
      ],
    },
  ];

  let qIdx = 0;
  let picked = null;

  function render() {
    const q = QUESTIONS[qIdx];
    qTitle.textContent = q.prompt;
    qGrid.innerHTML = q.options
      .map(
        (opt) => `
      <button type="button" class="quiz-card ${picked === opt.id ? (opt.id === q.answer ? "is-correct" : "is-wrong") : ""}" data-opt="${opt.id}" aria-pressed="${picked === opt.id}">
        <span class="quiz-tag">方案 ${opt.id}</span>
        <div class="quiz-thumb">${opt.svg}</div>
      </button>`,
      )
      .join("");

    qGrid.querySelectorAll("[data-opt]").forEach((btn) =>
      btn.addEventListener("click", () => {
        picked = btn.dataset.opt;
        const chosen = q.options.find((o) => o.id === picked);
        const ok = picked === q.answer;
        qFeed.className = `quiz-feedback ${ok ? "is-correct" : "is-wrong"}`;
        qFeed.textContent = chosen.reason;
        render();
      }),
    );

    if (!picked) {
      qFeed.className = "quiz-feedback";
      qFeed.textContent = "点击上方任意一版（A / B / C / D），看看你的判断和单真源分析是否一致。";
    }
  }

  qTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      qIdx = Number(tab.dataset.qidx);
      picked = null;
      qTabs.forEach((t) => {
        const on = Number(t.dataset.qidx) === qIdx;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", String(on));
      });
      render();
    }),
  );

  render();
}

// =====================================================================
// 07 节：原海报灯箱（放大、拖拽、滚轮、Esc 关闭）
// =====================================================================
export function initLightbox() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("btn-open-poster");
  const dialog = document.getElementById("poster-lightbox");
  if (!poster || !dialog) return;

  const img = dialog.querySelector("#lightbox-img");
  const stage = dialog.querySelector(".lb-stage");
  const zoomLabel = dialog.querySelector("#lb-zoom-val");
  const btnIn = dialog.querySelector("#lb-zoom-in");
  const btnOut = dialog.querySelector("#lb-zoom-out");
  const btnReset = dialog.querySelector("#lb-zoom-reset");
  const btnClose = dialog.querySelector("#lb-close");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    img.src = poster.currentSrc || poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose?.focus();
  }

  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    openBtn?.focus();
  }

  poster.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  btnClose?.addEventListener("click", close);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });

  btnIn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.4).toFixed(2));
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(1, +(scale - 0.4).toFixed(2));
    if (scale === 1) tx = ty = 0;
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = Math.max(1, Math.min(3, +(scale + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      if (scale === 1) tx = ty = 0;
      applyTransform();
    },
    { passive: false },
  );

  img?.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    img.setPointerCapture?.(e.pointerId);
  });
  img?.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = e.clientX - drag.x;
    ty = e.clientY - drag.y;
    applyTransform();
  });
  img?.addEventListener("pointerup", () => {
    drag = null;
  });

  window.addEventListener("keydown", (e) => {
    if (dialog.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "+" || e.key === "=") {
      scale = Math.min(3, +(scale + 0.35).toFixed(2));
      applyTransform();
    } else if (e.key === "-") {
      scale = Math.max(1, +(scale - 0.35).toFixed(2));
      if (scale === 1) tx = ty = 0;
      applyTransform();
    } else if (e.key === "0") {
      scale = 1;
      tx = ty = 0;
      applyTransform();
    }
  });
}
