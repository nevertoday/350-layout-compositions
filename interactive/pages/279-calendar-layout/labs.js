// 279 日历布局 · 01–07 节互动实验台、历史图谱、场景分诊、单变量练习与原海报灯箱
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  CATEGORIES,
  analyzeColumnModulo,
  buildRruleProjection,
} from "./model.js";

function fitCanvas(canvas, cssW, cssH) {
  const dpr = pixelRatio(2);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* ==================== 01 节：星期对齐射线仪（3–10 列模运算） ==================== */
export function initModuloLab() {
  const canvas = document.getElementById("modulo-canvas");
  if (!canvas) return;
  const btns = [...document.querySelectorAll("[data-mcols]")];
  const colsEl = document.getElementById("mod-cols-val");
  const spreadEl = document.getElementById("mod-spread-val");
  const driftEl = document.getElementById("mod-drift-val");
  const expEl = document.getElementById("modulo-explain");

  let cols = 7;
  let animProg = 1;
  let dirty = true;
  let lastW = 0;
  let lastH = 0;
  let data = analyzeColumnModulo(cols, "mon");

  function updateCopy() {
    colsEl.textContent = `${data.cols} 列 × ${data.rows} 行`;
    spreadEl.textContent = data.aligned
      ? "1 列（垂直锁死）"
      : `${data.monColSpread} 列（斜向散落）`;
    driftEl.textContent = data.aligned ? "0°" : `${data.driftDeg}°（每行偏 ${data.signedShift > 0 ? "+" : ""}${data.signedShift} 列）`;

    if (data.aligned) {
      expEl.textContent = "7 ÷ 7 余数为 0：整个 6 月的 4 个周一（3、10、17、24 日）全部锁在第 1 列，周末双休齐刷刷落在最右两列。眼睛顺列直扫，零心算就能定位任意星期几。";
    } else {
      expEl.textContent = `每行只有 ${cols} 天，7 天周期除以 ${cols} 余 ${7 % cols}，导致每周一比上一周横向漂移 ${Math.abs(data.signedShift)} 格（紫红折线所示）。4 个周一分散在 ${data.monColSpread} 个不同列里，月历退化成普通编号表。`;
    }
  }

  function renderFrame(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width || 600);
    const h = Math.round(rect.height || 330);
    if (w !== lastW || h !== lastH) { lastW = w; lastH = h; dirty = true; }
    if (animProg >= 1 && !dirty) return;
    if (still) animProg = 1;
    else if (animProg < 1) animProg = Math.min(1, animProg + (dt || 0.016) * 2.4);
    dirty = animProg < 1;

    const ctx = fitCanvas(canvas, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(0, 0, w, h);

    const padX = 16;
    const padTop = 30;
    const padBot = 14;
    const gw = w - padX * 2;
    const gh = h - padTop - padBot;
    const cw = gw / data.cols;
    const ch = gh / data.rows;

    // 顶部列标
    ctx.font = '700 11px "Space Grotesk", "Noto Sans SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const monNames = ["一 MON", "二 TUE", "三 WED", "四 THU", "五 FRI", "六 SAT", "日 SUN"];
    for (let c = 0; c < data.cols; c++) {
      const cx = padX + c * cw + cw / 2;
      ctx.fillStyle = data.aligned && c >= 5 ? "#C81E62" : "#4C3C99";
      const label = data.aligned ? monNames[c] : `COL ${c + 1}`;
      ctx.fillText(label, cx, 15);
    }

    // 绘制单元格
    const monCenters = [];
    for (const d of data.days) {
      const x = padX + d.col * cw;
      const y = padTop + d.row * ch;
      const isMon = d.inMonth && d.dow === 1;
      const isWk = d.inMonth && d.weekend;

      if (isMon) {
        ctx.fillStyle = "#E8E0F9";
        monCenters.push({ x: x + cw - 11, y: y + ch * 0.5, day: d.day });
      } else if (isWk) {
        ctx.fillStyle = "#FDF0F4";
      } else if (!d.inMonth) {
        ctx.fillStyle = "#F5F2F8";
      } else {
        ctx.fillStyle = "#FFFFFF";
      }
      ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
      ctx.strokeStyle = isMon ? "#4C3C99" : "#E5DDEC";
      ctx.lineWidth = isMon ? 1.5 : 1;
      ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3);

      // 日期与星期小标
      ctx.fillStyle = !d.inMonth ? "#8A85A6" : isWk ? "#C81E62" : "#151051";
      ctx.font = `${isMon ? 800 : 600} ${cw < 48 ? 11 : 13}px "Outfit", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(d.day), x + cw / 2, y + ch * 0.44);

      if (d.inMonth && ch >= 36 && cw >= 38) {
        ctx.font = '600 10px "Noto Sans SC", sans-serif';
        ctx.fillStyle = isMon ? "#3B3291" : isWk ? "#C81E62" : "#6D688E";
        const tag = isMon ? "周一" : d.dow === 6 ? "周六" : d.dow === 0 ? "周日" : "";
        if (tag) ctx.fillText(tag, x + cw / 2, y + ch * 0.77);
      }
    }

    // 射线连结所有周一：7 列笔直蓝绿射线，错列赤红折返线
    if (monCenters.length >= 2) {
      ctx.save();
      ctx.strokeStyle = data.aligned ? "#146C5B" : "#C21F4B";
      ctx.lineWidth = 2.4;
      if (!data.aligned) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      const segs = monCenters.length - 1;
      const totalDraw = animProg * segs;
      ctx.moveTo(monCenters[0].x, monCenters[0].y);
      for (let i = 0; i < segs; i++) {
        const p = Math.max(0, Math.min(1, totalDraw - i));
        if (p <= 0) break;
        const a = monCenters[i], b = monCenters[i + 1];
        ctx.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (const pt of monCenters) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = data.aligned ? "#146C5B" : "#C21F4B";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  const runner = loop(canvas, renderFrame);
  updateCopy();

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      cols = Number(btn.dataset.mcols);
      data = analyzeColumnModulo(cols, "mon");
      animProg = 0;
      dirty = true;
      btns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      updateCopy();
      runner.draw();
    });
  });

  window.addEventListener("resize", () => { dirty = true; runner.draw(); }, { passive: true });
}

/* ==================== 02 节：活体单格解剖台（事件数 + 折叠上限 + 色码） ==================== */
const SAMPLE_DAY_EVENTS = [
  { title: "季度复盘会议", time: "14:00–16:00", room: "会议室 A",   cat: "meeting",  chaos: "#E51C63" },
  { title: "数据分析同步", time: "16:30–17:30", room: "线上会议",   cat: "review",   chaos: "#FF6F00" },
  { title: "用户访谈复盘", time: "10:00–11:00", room: "访谈室 2",   cat: "research", chaos: "#00BFA5" },
  { title: "团队晚餐",     time: "19:00–21:00", room: "南城小馆",   cat: "personal", chaos: "#6200EA" },
  { title: "组件规范培训", time: "09:00–09:45", room: "阶梯教室",   cat: "training", chaos: "#0091EA" },
  { title: "周报终稿归档", time: "18:00–18:30", room: "协作文档",   cat: "research", chaos: "#C51162" },
];

function shapeSvg(shape, color) {
  if (shape === "square") return `<svg class="micro-shape" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7" rx="1.2" fill="${color}"/></svg>`;
  if (shape === "diamond") return `<svg class="micro-shape" viewBox="0 0 10 10" aria-hidden="true"><polygon points="5,1 9,5 5,9 1,5" fill="${color}"/></svg>`;
  if (shape === "triangle") return `<svg class="micro-shape" viewBox="0 0 10 10" aria-hidden="true"><polygon points="5,1 9,8.5 1,8.5" fill="${color}"/></svg>`;
  if (shape === "ring") return `<svg class="micro-shape" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.2" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
  return `<svg class="micro-shape" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.6" fill="${color}"/></svg>`;
}

export function initMicroscopeLab() {
  const totalInput = document.getElementById("micro-total");
  const capInput = document.getElementById("micro-cap");
  if (!totalInput || !capInput) return;

  const totalVal = document.getElementById("micro-total-val");
  const capVal = document.getElementById("micro-cap-val");
  const cellBox = document.getElementById("micro-cell-preview");
  const drawerBox = document.getElementById("micro-drawer-preview");
  const wsEl = document.getElementById("micro-ws-val");
  const ratioEl = document.getElementById("micro-ratio-val");
  const gradeEl = document.getElementById("micro-grade-val");
  const expEl = document.getElementById("micro-explain");
  const colorBtns = [...document.querySelectorAll("[data-mcolor]")];

  let colorMode = "semantic";

  function render() {
    const total = Number(totalInput.value);
    const cap = Number(capInput.value);
    totalVal.textContent = `${total} 条`;
    capVal.textContent = cap >= total ? `${cap} 条（全部摊开）` : `${cap} 条（其余折叠）`;

    const items = SAMPLE_DAY_EVENTS.slice(0, total);
    const vis = items.slice(0, cap);
    const hidden = Math.max(0, total - vis.length);

    // 渲染左：放大后的单格预览
    const badgeStyle = colorMode === "gray"
      ? 'style="background:#7B7890;font-size:13px;width:24px;height:24px;"'
      : colorMode === "chaos"
        ? 'style="background:#151051;font-size:14px;width:26px;height:26px;"'
        : "";

    let cellHtml = `
      <span class="micro-tag">月视图单格（仅承担定位与密度概览）</span>
      <div class="micro-cell-top">
        <span class="micro-date-badge" ${badgeStyle}>20</span>
        <span class="micro-tag">周四 · ${total} 场</span>
      </div>
    `;
    for (const ev of vis) {
      const cat = CATEGORIES[ev.cat];
      if (colorMode === "gray") {
        cellHtml += `<div class="micro-ev-pill" style="background:#EAE8EE;color:#3E3B4F;"><span>${ev.title} ${ev.time.slice(0, 5)}</span></div>`;
      } else if (colorMode === "chaos") {
        cellHtml += `<div class="micro-ev-pill" style="background:${ev.chaos};color:#FFFFFF;"><span>${ev.title} · ${ev.room}</span></div>`;
      } else {
        cellHtml += `<div class="micro-ev-pill" style="background:${cat.bg};color:${cat.fg};">${shapeSvg(cat.shape, cat.dot)}<span>${ev.title}</span><span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;">${ev.time.slice(0, 5)}</span></div>`;
      }
    }
    if (hidden > 0) {
      cellHtml += `<span class="micro-more">+${hidden} 项（点格展开旁侧详情）</span>`;
    }
    cellBox.innerHTML = cellHtml;

    // 渲染右：按需展开详情抽屉
    let drawerHtml = `<span class="micro-tag">按需详情层（点击 6/20 后展开）</span>`;
    for (const ev of items) {
      const cat = CATEGORIES[ev.cat];
      const dotCol = colorMode === "gray" ? "#6D6A80" : colorMode === "chaos" ? ev.chaos : cat.dot;
      drawerHtml += `
        <div class="micro-drawer-row">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;">
            ${shapeSvg(colorMode === "semantic" ? cat.shape : "circle", dotCol)}
            <strong style="color:var(--ink);">${ev.title}</strong>
          </div>
          <span style="font-family:var(--font-mono);font-size:11.5px;color:var(--ink-muted);white-space:nowrap;">${ev.time} · ${ev.room}</span>
        </div>
      `;
    }
    drawerBox.innerHTML = drawerHtml;

    // 单真源指标
    const perSlot = colorMode === "chaos" ? 21 : 16;
    const used = 22 + vis.length * perSlot + (hidden > 0 ? 10 : 0);
    const ws = Math.max(4, Math.min(76, 100 - used));
    const ratio = colorMode === "gray" ? "1.08×（偏弱）" : colorMode === "chaos" ? "0.92×（反压）" : "1.65×（清晰）";
    const ok = ws >= 32 && colorMode === "semantic";

    wsEl.textContent = `${ws}%`;
    ratioEl.textContent = ratio;
    gradeEl.textContent = ok
      ? "清爽可扫"
      : ws < 32
        ? "单格塞满窒息"
        : colorMode === "gray"
          ? "类别失辨"
          : "高彩噪点";

    if (ok) {
      expEl.textContent = `单格只保留 ${vis.length} 条色标事件${hidden > 0 ? `，其余 ${hidden} 项折成 +${hidden} 徽章交由旁侧抽屉` : ""}，日期与事件层次拉开 1.65 倍且保留约 ${ws}% 留白，兼顾语义颜色与几何形状双重线索。`;
    } else if (ws < 32) {
      expEl.textContent = `一格硬塞 ${vis.length} 条后，可视留白跌至 ${ws}%。月历不需要在百像素小格里讲完所有细节，把上限收回到 2 条即可立刻还回呼吸空间。`;
    } else if (colorMode === "gray") {
      expEl.textContent = "全灰无色码后，会议、评审、调研与个人事项在扫读时混成一片，日期数字也被拉平，用户必须逐字细读才能判断日程性质。";
    } else {
      expEl.textContent = "每条都涂上高饱和撞色并塞入地点后，色块亮度压过置顶日期，视线在格子内部互相拉扯，反而增加了认知负荷。";
    }
  }

  totalInput.addEventListener("input", render);
  capInput.addEventListener("input", render);
  colorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      colorMode = btn.dataset.mcolor;
      colorBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  render();
}

/* ==================== 03 节：RFC 5545 RRULE 投影仪 + 多尺度变焦仪 ==================== */
export function initDarkroomLabs() {
  const canvas = document.getElementById("rrule-canvas");
  const codeEl = document.getElementById("rrule-code");
  const hitsEl = document.getElementById("rrule-hits");
  const savedEl = document.getElementById("rrule-saved");
  const skipsEl = document.getElementById("rrule-skips");
  const noteEl = document.getElementById("rrule-note");
  const exBtn = document.getElementById("btn-exdate");
  const presetBtns = [...document.querySelectorAll("[data-rrule]")];

  let presetId = "weekly_tu";
  let skipHoliday = false;
  let proj = buildRruleProjection(presetId, skipHoliday);
  let reveal = 1;
  let rDirty = true;
  let rLastW = 0;
  let rLastH = 0;

  function syncRruleText() {
    codeEl.textContent = proj.fullRule;
    hitsEl.textContent = `${proj.hitCount} 场`;
    savedEl.textContent = `${proj.manualSaved} 次`;
    skipsEl.textContent = `${proj.skippedCount} 场`;
    noteEl.textContent = skipHoliday
      ? `${proj.preset.note} 已追加 EXDATE 例外日，仅跳过第 6 周节假日那一场，其余 11 周周期纹丝不动。`
      : proj.preset.note;
  }

  let runner = null;
  if (canvas) {
    runner = loop(canvas, (t, dt, { still }) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width || 560);
      const h = Math.round(rect.height || 240);
      if (w !== rLastW || h !== rLastH) { rLastW = w; rLastH = h; rDirty = true; }
      if (reveal >= 1 && !rDirty) return;
      if (still) reveal = 1;
      else if (reveal < 1) reveal = Math.min(1, reveal + (dt || 0.016) * 2.2);
      rDirty = reveal < 1;

      const ctx = fitCanvas(canvas, w, h);
      ctx.fillStyle = "#140F3E";
      ctx.fillRect(0, 0, w, h);

      const padL = 44;
      const padR = 16;
      const padT = 28;
      const padB = 18;
      const cols = 12; // 12 周横向展开（纵轴 7 行周一..周日）
      const rows = 7;
      const cw = (w - padL - padR) / cols;
      const ch = (h - padT - padB) / rows;

      // 顶周号 W1..W12
      ctx.font = '600 10.5px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let wk = 0; wk < cols; wk++) {
        ctx.fillStyle = "#B8AFF0";
        ctx.fillText(`W${wk + 1}`, padL + wk * cw + cw / 2, 14);
      }

      // 左侧星期一..日
      const dLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      ctx.font = '600 11px "Noto Sans SC", sans-serif';
      ctx.textAlign = "right";
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = r >= 5 ? "#F9ACC4" : "#CFC8F5";
        ctx.fillText(dLabels[r], padL - 8, padT + r * ch + ch / 2);
      }

      // 绘制 12×7 点阵
      const maxWeek = Math.ceil(reveal * cols);
      for (const cell of proj.cells) {
        const cx = padL + cell.w * cw + cw / 2;
        const cy = padT + cell.c * ch + ch / 2;
        const radius = Math.min(cw, ch) * 0.3;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        if (cell.skipped && cell.w < maxWeek) {
          ctx.fillStyle = "rgba(255, 135, 167, 0.2)";
          ctx.fill();
          ctx.strokeStyle = "#FF87A7";
          ctx.lineWidth = 1.8;
          ctx.stroke();
          // X 跳过标记
          ctx.beginPath();
          ctx.moveTo(cx - radius * 0.55, cy - radius * 0.55);
          ctx.lineTo(cx + radius * 0.55, cy + radius * 0.55);
          ctx.moveTo(cx + radius * 0.55, cy - radius * 0.55);
          ctx.lineTo(cx - radius * 0.55, cy + radius * 0.55);
          ctx.stroke();
        } else if (cell.active && cell.w < maxWeek) {
          ctx.fillStyle = cell.w === 0 ? "#F9ACC4" : "#8F7EF6";
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = cell.w === 0 ? 1.8 : 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = cell.weekend ? "#2A1F5A" : "#221C58";
          ctx.fill();
        }
      }
    });
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      presetId = btn.dataset.rrule;
      proj = buildRruleProjection(presetId, skipHoliday);
      reveal = 0;
      rDirty = true;
      presetBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      syncRruleText();
      if (runner) runner.draw();
    });
  });

  if (exBtn) {
    exBtn.addEventListener("click", () => {
      skipHoliday = !skipHoliday;
      exBtn.setAttribute("aria-pressed", String(skipHoliday));
      exBtn.textContent = `节假日例外 EXDATE：${skipHoliday ? "开" : "关"}`;
      proj = buildRruleProjection(presetId, skipHoliday);
      rDirty = true;
      syncRruleText();
      if (runner) runner.draw();
    });
  }
  window.addEventListener("resize", () => { rDirty = true; if (runner) runner.draw(); }, { passive: true });
  syncRruleText();

  // 右舱：月 ↔ 周 ↔ 日 变焦仪
  const slider = document.getElementById("zoom-scale-slider");
  const zLabel = document.getElementById("zoom-scale-label");
  const zStage = document.getElementById("zoom-stage");
  const zExp = document.getElementById("zoom-explain");
  if (!slider || !zStage) return;

  function renderZoom() {
    const v = Number(slider.value);
    if (v === 0) {
      zLabel.textContent = "月视图（30 天宏观密度）";
      zStage.innerHTML = `
        <div class="zoom-month-grid">
          ${[17, 18, 19, 20, 21, 22, 23].map((d) => `
            <div class="zm-cell ${d === 20 ? "is-focus" : ""}">
              <strong style="font-family:var(--font-display);">${d}</strong>
              ${d === 18 ? '<div class="zm-bar" style="background:#8F7EF6;"></div>' : ""}
              ${d === 20 ? '<div class="zm-bar" style="background:#8F7EF6;"></div><div class="zm-bar" style="background:#F9ACC4;"></div><div class="zm-bar" style="background:#FBB800;"></div>' : ""}
            </div>
          `).join("")}
        </div>
        <p style="margin:12px 0 0;font-size:12.5px;color:#C8C0F4;">每个日期只占固定面积：你 1 秒看出 6/20 明显偏满、6/19 与 6/21 是整日空档，但看不到 14:00 到底有没有撞车。</p>
      `;
      zExp.textContent = "月视图的长处是「全局找忙闲、跨周定日期」；把具体分钟级冲突留给更近的尺度，月格才能保持清爽。";
    } else if (v === 1) {
      zLabel.textContent = "周视图（5 工作日 × 时段空档）";
      zStage.innerHTML = `
        <div class="zoom-week-cols">
          <div class="zw-col"><span class="zw-title">一 17</span><span style="font-size:11px;color:#A59CD8;">全天可约</span></div>
          <div class="zw-col"><span class="zw-title">二 18</span><div class="zw-slot" style="background:#4C3C99;margin-top:18px;">11:00 版本发布</div></div>
          <div class="zw-col"><span class="zw-title">三 19</span><span style="font-size:11px;color:#A59CD8;">全天可约</span></div>
          <div class="zw-col is-focus">
            <span class="zw-title">四 20 · 焦点</span>
            <div class="zw-slot" style="background:#4C3C99;margin-top:26px;">14:00 季度复盘</div>
            <div class="zw-slot" style="background:#B82A60;">16:30 数据同步</div>
            <div class="zw-slot" style="background:#9A6B00;">19:00 团队晚餐</div>
          </div>
          <div class="zw-col"><span class="zw-title">五 21</span><span style="font-size:11px;color:#A59CD8;">全天可约</span></div>
        </div>
      `;
      zExp.textContent = "切到周视图后，纵轴变成等比时间刻度：色块高度等于时长，上下空白就是真正能插进新会议的空档。";
    } else {
      zLabel.textContent = "日视图（单日等比时段与缓冲）";
      zStage.innerHTML = `
        <div class="zoom-day-timeline">
          <div class="zd-slot is-clash"><span class="zd-time">14:00 – 16:00</span><div><strong>季度复盘会议 · 会议室 A</strong><div style="font-size:12px;color:#FFB6CA;">若「设计评审 14:00」也排在今天，等比纵轴会立刻将两块并排挤压，暴露重合时长。</div></div></div>
          <div class="zd-slot is-buffer"><span class="zd-time">16:00 – 16:30</span><div><strong>30 分钟换场缓冲</strong><div style="font-size:12px;color:#AEEBE0;">只有拉近到日视图，才能一眼判断两场会之间够不够走回工位。</div></div></div>
          <div class="zd-slot"><span class="zd-time">16:30 – 17:30</span><div><strong>数据分析同步 · 线上会议</strong></div></div>
          <div class="zd-slot" style="border-left-color:#FBB800;"><span class="zd-time">19:00 – 21:00</span><div><strong>团队晚餐 · 南城小馆</strong></div></div>
        </div>
      `;
      zExp.textContent = "日视图放弃了整月视野，换来精确到半小时的纵向执行标尺——这也是现代日历必须提供「月 / 周 / 日」一键缩放的原因。";
    }
  }

  slider.addEventListener("input", renderZoom);
  renderZoom();
}

/* ==================== 04 节：日历网格从哪来（已核实史料 5 站） ==================== */
const ERA_ITEMS = {
  "1966": {
    title: "1966 · Massimo Vignelli《Stendig Calendar》",
    body: "意大利平面设计大师 Massimo Vignelli 为家具品牌 Stendig 设计了 36×48 英寸的巨幅黑白交替墙历。它只用 Neue Haas Grotesk（Helvetica）与严苛的 7 列网格，不添任何插画装饰，仅靠紧凑的日期数字与大片负空间就建立起极强的远距离扫读秩序。问世同年即被纽约现代艺术博物馆（MoMA）纳入永久设计馆藏，至今仍每年按原版式重印。",
    source: "核实来源：MoMA 永久馆藏 / Stendig Calendar 1966",
    svg: `<svg viewBox="0 0 280 190" role="img" aria-label="Stendig Calendar 黑白巨型字格示意">
      <rect x="8" y="8" width="128" height="174" rx="4" fill="#151051"/>
      <text x="20" y="34" fill="#FFFFFF" font-family="Outfit,sans-serif" font-weight="800" font-size="14">JUNE</text>
      <line x1="20" y1="42" x2="124" y2="42" stroke="#9781EB" stroke-width="1"/>
      <g fill="#FFFFFF" font-family="Outfit,sans-serif" font-weight="800" font-size="16">
        <text x="20" y="70">1</text><text x="48" y="70">2</text><text x="76" y="70">3</text><text x="104" y="70">4</text>
        <text x="20" y="102">8</text><text x="48" y="102">9</text><text x="74" y="102">10</text><text x="102" y="102">11</text>
        <text x="18" y="134">15</text><text x="46" y="134">16</text><text x="74" y="134">17</text><text x="102" y="134">18</text>
      </g>
      <rect x="144" y="8" width="128" height="174" rx="4" fill="#FFFFFF" stroke="#151051" stroke-width="1.5"/>
      <text x="156" y="34" fill="#151051" font-family="Outfit,sans-serif" font-weight="800" font-size="14">JULY</text>
      <line x1="156" y1="42" x2="260" y2="42" stroke="#151051" stroke-width="1"/>
      <g fill="#151051" font-family="Outfit,sans-serif" font-weight="800" font-size="16">
        <text x="156" y="70">1</text><text x="184" y="70">2</text><text x="212" y="70">3</text><text x="240" y="70">4</text>
        <text x="156" y="102">8</text><text x="184" y="102">9</text><text x="210" y="102">10</text><text x="238" y="102">11</text>
        <text x="154" y="134">15</text><text x="182" y="134">16</text><text x="210" y="134">17</text><text x="238" y="134">18</text>
      </g>
    </svg>`,
  },
  "1988": {
    title: "1988 · ISO 8601 首版确立「周一为每周第 1 天」",
    body: "1988 年 6 月 15 日，国际标准化组织发布 ISO 8601:1988 首版，整合了早期 ISO 2014、ISO 2015 等多项零散规范，正式规定在国际数据交换与商业排期中以周一作为每周第 1 天（1–7），并定义了跨年第一周的周序号规则。之后 Unicode CLDR 的 weekData 则完整记录了全球周一、周日、周六三种地区周首惯例，使跨国日历 UI 能够按语言区域自动换列。",
    source: "核实来源：ISO 8601:1988 & Unicode CLDR weekData",
    svg: `<svg viewBox="0 0 280 190" role="img" aria-label="ISO 周一首日与美式周日首日对照">
      <rect x="12" y="14" width="256" height="72" rx="8" fill="#FFFFFF" stroke="#4C3C99" stroke-width="1.5"/>
      <text x="24" y="34" fill="#4C3C99" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="11">ISO 8601 · MONDAY FIRST</text>
      ${["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d, i) => `
        <rect x="${22 + i*34}" y="44" width="30" height="30" rx="4" fill="${i>=5?"#FCE5E3":"#EDE6F8"}"/>
        <text x="${37 + i*34}" y="63" text-anchor="middle" fill="${i>=5?"#C81E62":"#151051"}" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="9.5">${d}</text>
      `).join("")}
      <rect x="12" y="102" width="256" height="72" rx="8" fill="#FFFFFF" stroke="#B7ACD6" stroke-width="1.5"/>
      <text x="24" y="122" fill="#57527C" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="11">US / JP LOCALE · SUNDAY FIRST</text>
      ${["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d, i) => `
        <rect x="${22 + i*34}" y="132" width="30" height="30" rx="4" fill="${(i===0||i===6)?"#FCE5E3":"#F4F1FA"}"/>
        <text x="${37 + i*34}" y="151" text-anchor="middle" fill="${(i===0||i===6)?"#C81E62":"#151051"}" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="9.5">${d}</text>
      `).join("")}
    </svg>`,
  },
  "1998": {
    title: "1998 → 2009 · IETF RFC 2445 到 RFC 5545（iCalendar）",
    body: "纸质日历无法自动生成「每周二例会」或跨公司发会议邀请。1998 年 11 月，来自 Lotus 的 Frank Dawson 与微软的 Derik Stenerson 联合起草 RFC 2445；2009 年 9 月由 Bernard Desruisseaux 编辑的 RFC 5545 正式替代旧版。它用文本格式定义 VEVENT、VTIMEZONE 与核心重复属性 RRULE，让任何日历界面都能按规则动态投影未来日程。",
    source: "核实来源：IETF RFC 2445 (1998) / RFC 5545 (2009)",
    svg: `<svg viewBox="0 0 280 190" role="img" aria-label="iCalendar VEVENT 与 RRULE 协议结构">
      <rect x="14" y="16" width="252" height="158" rx="10" fill="#19144A"/>
      <text x="28" y="42" fill="#B3A5F8" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="11">BEGIN:VEVENT</text>
      <text x="28" y="64" fill="#FFFFFF" font-family="Space Grotesk,sans-serif" font-size="11">SUMMARY:季度复盘会议</text>
      <text x="28" y="84" fill="#FFFFFF" font-family="Space Grotesk,sans-serif" font-size="11">DTSTART:20240620T140000</text>
      <rect x="24" y="96" width="232" height="28" rx="6" fill="#2C2474" stroke="#6BE0C8" stroke-width="1.2"/>
      <text x="32" y="114" fill="#AEEBE0" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="10.5">RRULE:FREQ=WEEKLY;BYDAY=TH</text>
      <text x="28" y="144" fill="#F9ACC4" font-family="Space Grotesk,sans-serif" font-size="11">EXDATE:20240704T140000</text>
      <text x="28" y="162" fill="#B3A5F8" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="11">END:VEVENT</text>
    </svg>`,
  },
  "2002": {
    title: "2002 & 2006 · Apple iCal 与 Google Calendar 普及多色图层",
    body: "2002 年 9 月 10 日发布的 Apple iCal 将「按颜色区分不同日历图层并自由勾选叠加」带进主流桌面端；2006 年 4 月 13 日启动公测的 Google Calendar 则让浏览器里的月/周/日无缝切换、跨格拖拽改期与多人共享空档成为现代 Web 日历的事实范式——今天绝大多数日程产品都延续着这套视觉语法。",
    source: "核实来源：Apple iCal (2002.09) / Google Calendar Beta (2006.04)",
    svg: `<svg viewBox="0 0 280 190" role="img" aria-label="多日历彩色图层叠加结构">
      <rect x="14" y="16" width="76" height="158" rx="8" fill="#F1EBF7" stroke="#DDD4EC"/>
      <circle cx="28" cy="44" r="5" fill="#513EC4"/><rect x="39" y="40" width="38" height="7" rx="3" fill="#4C3C99"/>
      <circle cx="28" cy="68" r="5" fill="#E0447B"/><rect x="39" y="64" width="34" height="7" rx="3" fill="#C81E62"/>
      <circle cx="28" cy="92" r="5" fill="#D69600"/><rect x="39" y="88" width="40" height="7" rx="3" fill="#9E6E00"/>
      <circle cx="28" cy="116" r="5" fill="#7B63DC"/><rect x="39" y="112" width="30" height="7" rx="3" fill="#7B63DC"/>
      <rect x="102" y="16" width="164" height="158" rx="8" fill="#FFFFFF" stroke="#4C3C99" stroke-width="1.5"/>
      <rect x="102" y="16" width="164" height="24" rx="8" fill="#4C3C99"/>
      <rect x="112" y="52" width="66" height="22" rx="4" fill="#E8E0F9" stroke="#513EC4"/>
      <rect x="186" y="66" width="70" height="26" rx="4" fill="#FCE5E3" stroke="#E0447B"/>
      <rect x="112" y="102" width="144" height="22" rx="4" fill="#FDF0D3" stroke="#D69600"/>
      <rect x="144" y="136" width="96" height="22" rx="4" fill="#EAE1F9" stroke="#7B63DC"/>
    </svg>`,
  },
  "2004": {
    title: "2004 · Bederson 等人《DateLens》验证小屏日历瓶颈",
    body: "马里兰大学 HCIL 与微软研究院的 Benjamin B. Bederson、Aaron Clamage、Mary Czerwinski、George G. Robertson 在 2004 年 ACM TOCHI 论文《DateLens: A Fisheye Calendar Interface for PDAs》中指出：传统固定月格在巴掌大小的掌上屏幕上会迅速崩溃。他们用鱼眼缩放与摘要密度条把「概览+聚焦」合入一屏，实验发现用户在复杂跨日规划上明显提速，但日常单日核对仍更偏好清晰的日/周列表——这直接解释了为何今天手机端常把月历与下方议程列表上下联动。",
    source: "核实来源：Bederson et al., ACM TOCHI 2004, Vol.11 No.1",
    svg: `<svg viewBox="0 0 280 190" role="img" aria-label="DateLens 小屏鱼眼缩放对比">
      <rect x="26" y="14" width="228" height="162" rx="12" fill="#FFFFFF" stroke="#4C3C99" stroke-width="1.5"/>
      <rect x="38" y="26" width="44" height="24" rx="4" fill="#F1EBF7"/>
      <rect x="88" y="26" width="44" height="24" rx="4" fill="#F1EBF7"/>
      <rect x="138" y="26" width="104" height="72" rx="6" fill="#EDE6F8" stroke="#4C3C99" stroke-width="1.8"/>
      <text x="150" y="46" fill="#151051" font-family="Outfit,sans-serif" font-weight="800" font-size="14">6/20 放大焦格</text>
      <rect x="150" y="54" width="80" height="12" rx="3" fill="#4C3C99"/>
      <rect x="150" y="72" width="66" height="12" rx="3" fill="#E0447B"/>
      <rect x="38" y="56" width="44" height="42" rx="4" fill="#F6F2FA"/>
      <rect x="88" y="56" width="44" height="42" rx="4" fill="#F6F2FA"/>
      <rect x="38" y="106" width="204" height="56" rx="6" fill="#FAECF0"/>
      <text x="50" y="128" fill="#151051" font-family="Noto Sans SC,sans-serif" font-weight="700" font-size="11">小屏解法：上缩略月历 + 下联动当日详情</text>
      <rect x="50" y="138" width="130" height="10" rx="3" fill="#4C3C99" fill-opacity="0.35"/>
    </svg>`,
  },
};

export function initEraTabs() {
  const tabs = [...document.querySelectorAll(".era-tab")];
  const visEl = document.getElementById("era-visual");
  const copyEl = document.getElementById("era-copy");
  if (!tabs.length || !visEl || !copyEl) return;

  function show(key) {
    const item = ERA_ITEMS[key];
    if (!item) return;
    visEl.innerHTML = item.svg;
    copyEl.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.body}</p>
      <span class="era-source-tag">${item.source}</span>
    `;
    tabs.forEach((t) => {
      const active = t.dataset.era === key;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
  }

  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.era)));
  show("1966");
}

/* ==================== 05 节：场景分诊对照台 ==================== */
const TRIAGE_CASES = {
  schedule: {
    leftTitle: "日历布局（7 列月历 + 当日抽屉）",
    leftWin: true,
    leftBadge: "最合适",
    leftDesc: "需求核心是「高频排期、找下周空档、避开周末和撞期」。固定 7 列把空白格子直接变成可预约信号，颜色区分例会与评审，一眼锁定空闲工作日。",
    leftSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#FAF7FA" stroke="#DDD4EC"/><rect width="260" height="20" rx="8" fill="#4C3C99"/>${[0,1,2,3,4,5,6].map((c)=>[0,1,2].map((r)=>`<rect x="${8+c*35}" y="${26+r*28}" width="31" height="24" rx="3" fill="${(c===3&&r===1)?"#EDE6F8":"#FFFFFF"}" stroke="#E5DDEC"/>`).join("")).join("")}<rect x="46" y="37" width="24" height="7" rx="2" fill="#513EC4"/><rect x="116" y="64" width="24" height="7" rx="2" fill="#E0447B"/><rect x="151" y="92" width="24" height="7" rx="2" fill="#D69600"/></svg>`,
    rightTitle: "纯文字待办列表",
    rightWin: false,
    rightBadge: "丢失空间节奏",
    rightDesc: "列表能按顺序列出 10 场会议，却完全看不出「周三全空」「周六是休息日」或「6/20 一天挤了 3 场」，找空档时被迫在脑中反推星期几。",
    rightSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#FFF9FA" stroke="#F2B8C7"/>${[0,1,2,3].map((i)=>`<rect x="14" y="${16+i*24}" width="232" height="16" rx="4" fill="#F2ECF4"/><rect x="22" y="${21+i*24}" width="96" height="6" rx="3" fill="#9A94B3"/>`).join("")}</svg>`,
  },
  milestone: {
    leftTitle: "硬塞进 3 个月月历格",
    leftWin: false,
    leftBadge: "88% 空格浪费",
    leftDesc: "一个季度只有 5 个关键里程碑（第 1 天、第 19 天、第 60 天……），摊进 90 个日历方格里，满屏都是空壳数字，翻三页才拼出一条叙事线。",
    leftSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#FFF9FA" stroke="#F2B8C7"/>${[0,1,2,3,4,5,6].map((c)=>[0,1,2].map((r)=>`<rect x="${8+c*35}" y="${16+r*30}" width="31" height="25" rx="3" fill="#FFFFFF" stroke="#ECE6F0"/>`).join("")).join("")}<rect x="12" y="28" width="22" height="6" rx="2" fill="#C21F4B"/><rect x="222" y="88" width="22" height="6" rx="2" fill="#C21F4B"/></svg>`,
    rightTitle: "改用 277 时间线布局",
    rightWin: true,
    rightBadge: "更契合",
    rightDesc: "只需按先后顺序讲清阶段推进与里程碑，直接把 5 个节点挂在一条有向主轴上，砍掉无意义的空白日期，叙事密度提升数倍。",
    rightSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#F4FBF8" stroke="#A8DBD0"/><line x1="24" y1="42" x2="236" y2="42" stroke="#146C5B" stroke-width="2.5"/>${[32,82,132,182,228].map((x)=>`<circle cx="${x}" cy="42" r="8" fill="#146C5B"/><rect x="${x-16}" y="58" width="32" height="38" rx="4" fill="#FFFFFF" stroke="#A8DBD0"/>`).join("")}</svg>`,
  },
  workflow: {
    leftTitle: "按日期排进月历",
    leftWin: false,
    leftBadge: "看不见瓶颈",
    leftDesc: "研发任务关心的是「谁卡在评审、进行中是不是超限」，放到月历里只看到截止日，完全看不出待办 → 进行 → 测试的在制品流转与堵塞。",
    leftSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#FFF9FA" stroke="#F2B8C7"/>${[0,1,2,3,4,5,6].map((c)=>[0,1,2].map((r)=>`<rect x="${8+c*35}" y="${16+r*30}" width="31" height="25" rx="3" fill="#FFFFFF" stroke="#ECE6F0"/>`).join("")).join("")}<rect x="116" y="56" width="25" height="6" rx="2" fill="#C21F4B"/><rect x="116" y="64" width="25" height="6" rx="2" fill="#C21F4B"/></svg>`,
    rightTitle: "改用 278 看板布局",
    rightWin: true,
    rightBadge: "更契合",
    rightDesc: "把横轴换成工作流状态列，每张卡片代表一件在制任务并设 WIP 上限，团队一眼揪出积压瓶颈，再把真正有硬日期的发布日同步回日历。",
    rightSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#F4FBF8" stroke="#A8DBD0"/>${[0,1,2,3].map((c)=>`<rect x="${12+c*60}" y="14" width="54" height="88" rx="5" fill="#FFFFFF" stroke="#A8DBD0"/><rect x="${12+c*60}" y="14" width="54" height="16" rx="5" fill="#146C5B"/><rect x="${18+c*60}" y="36" width="42" height="16" rx="3" fill="#E5F5F1"/>`).join("")}<rect x="78" y="58" width="42" height="16" rx="3" fill="#E5F5F1"/></svg>`,
  },
  records: {
    leftTitle: "把 6 个属性塞进月历小格",
    leftWin: false,
    leftBadge: "无法横向比价",
    leftDesc: "航班或工单需要同时比对出发时刻、时长、经停、票价与退改签 6 个维度；挤进月历小格只能塞下最低价，想按时长或票价排序完全无从下手。",
    leftSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#FFF9FA" stroke="#F2B8C7"/>${[0,1,2,3,4,5,6].map((c)=>`<rect x="${8+c*35}" y="18" width="31" height="82" rx="3" fill="#FFFFFF" stroke="#ECE6F0"/>`).join("")}<rect x="116" y="34" width="24" height="54" rx="2" fill="#FDECEF" stroke="#C21F4B"/></svg>`,
    rightTitle: "改用 274 数据表格（可配顶部迷你选日条）",
    rightWin: true,
    rightBadge: "更契合",
    rightDesc: "多字段精准比对、排序和筛选是数据表格的主场；只在顶部留一行 7 天价格日历条帮你先选日期，下方仍用表格承接全部明细字段。",
    rightSvg: `<svg viewBox="0 0 260 116"><rect width="260" height="116" rx="8" fill="#F4FBF8" stroke="#A8DBD0"/><rect x="12" y="14" width="236" height="18" rx="4" fill="#146C5B"/>${[0,1,2].map((r)=>`<rect x="12" y="${38+r*22}" width="236" height="16" rx="3" fill="#FFFFFF" stroke="#CBE9E1"/>`).join("")}</svg>`,
  },
};

export function initTriageLab() {
  const btns = [...document.querySelectorAll("[data-triage]")];
  const stage = document.getElementById("triage-stage");
  if (!btns.length || !stage) return;

  function render(key) {
    const item = TRIAGE_CASES[key];
    if (!item) return;
    stage.innerHTML = `
      <div class="triage-card ${item.leftWin ? "is-winner" : "is-loser"}">
        <div class="triage-card-head"><strong>${item.leftTitle}</strong><span class="triage-badge">${item.leftBadge}</span></div>
        ${item.leftSvg}
        <p>${item.leftDesc}</p>
      </div>
      <div class="triage-card ${item.rightWin ? "is-winner" : "is-loser"}">
        <div class="triage-card-head"><strong>${item.rightTitle}</strong><span class="triage-badge">${item.rightBadge}</span></div>
        ${item.rightSvg}
        <p>${item.rightDesc}</p>
      </div>
    `;
    btns.forEach((b) => {
      const active = b.dataset.triage === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => render(b.dataset.triage)));
  render("schedule");
}

/* ==================== 06 节：单变量辨别练习（只差单格溢出与披露策略） ==================== */
function renderQuizSvg(mode) {
  // 4 张图完全一致：7 列等宽、相同 2024 年 6 月三周片段（10..30）、相同颜色与 6/20 焦格
  // 唯一变量：6/20 出现 4 条事件时的单格溢出处理策略
  const rowHeights = mode === "A" ? [34, 80, 34] : [48, 48, 48];
  const rowY = [24, 24 + rowHeights[0], 24 + rowHeights[0] + rowHeights[1]];
  const totalH = 24 + rowHeights[0] + rowHeights[1] + rowHeights[2] + 6;
  const colW = 36;
  const startX = 6;

  let cells = "";
  const days = [
    [10, 11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22, 23],
    [24, 25, 26, 27, 28, 29, 30],
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const d = days[r][c];
      const x = startX + c * colW;
      const y = rowY[r];
      const h = rowHeights[r];
      const is20 = d === 20;
      cells += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" fill="${is20 ? "#EDE6F8" : "#FFFFFF"}" stroke="${is20 ? "#4C3C99" : "#E5DDEC"}" stroke-width="${is20 ? 1.4 : 0.9}"/>`;
      cells += `<text x="${x + 5}" y="${y + 11}" fill="${c >= 5 ? "#C81E62" : "#151051"}" font-family="Outfit,sans-serif" font-weight="700" font-size="9">${d}</text>`;

      // 其他日期同构单条事件
      if (d === 11) cells += `<rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="8" rx="2" fill="#FDF0D3"/><circle cx="${x + 7}" cy="${y + 19}" r="1.8" fill="#D69600"/>`;
      if (d === 18) cells += `<rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="8" rx="2" fill="#E8E0F9"/><circle cx="${x + 7}" cy="${y + 19}" r="1.8" fill="#513EC4"/>`;
      if (d === 25) cells += `<rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="8" rx="2" fill="#FCE5E3"/><circle cx="${x + 7}" cy="${y + 19}" r="1.8" fill="#E0447B"/>`;
      if (d === 28) cells += `<rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="8" rx="2" fill="#FDF0D3"/><circle cx="${x + 7}" cy="${y + 19}" r="1.8" fill="#D69600"/>`;

      // 焦格 6/20 的 4 种不同溢出策略
      if (is20) {
        if (mode === "A") {
          // 撑高整行 2.4x 全铺 4 条
          cells += `
            <rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="12" rx="2" fill="#E8E0F9"/><circle cx="${x + 7}" cy="${y + 21}" r="1.8" fill="#513EC4"/>
            <rect x="${x + 3}" y="${y + 30}" width="${colW - 6}" height="12" rx="2" fill="#FCE5E3"/><circle cx="${x + 7}" cy="${y + 36}" r="1.8" fill="#E0447B"/>
            <rect x="${x + 3}" y="${y + 45}" width="${colW - 6}" height="12" rx="2" fill="#FDF0D3"/><circle cx="${x + 7}" cy="${y + 51}" r="1.8" fill="#D69600"/>
            <rect x="${x + 3}" y="${y + 60}" width="${colW - 6}" height="12" rx="2" fill="#EAE1F9"/><circle cx="${x + 7}" cy="${y + 66}" r="1.8" fill="#7B63DC"/>
          `;
        } else if (mode === "B") {
          // 正确：等高 48px，显示 2 条 + 清晰「+2」徽章，保留呼吸空间
          cells += `
            <rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="9" rx="2" fill="#E8E0F9"/><circle cx="${x + 7}" cy="${y + 19.5}" r="1.8" fill="#513EC4"/>
            <rect x="${x + 3}" y="${y + 26}" width="${colW - 6}" height="9" rx="2" fill="#FCE5E3"/><circle cx="${x + 7}" cy="${y + 30.5}" r="1.8" fill="#E0447B"/>
            <rect x="${x + 3}" y="${y + 37}" width="18" height="8" rx="4" fill="#4C3C99"/>
            <text x="${x + 12}" y="${y + 43.2}" text-anchor="middle" fill="#FFFFFF" font-family="Space Grotesk,sans-serif" font-weight="700" font-size="6.5">+2</text>
          `;
        } else if (mode === "C") {
          // 静默截断：等高 48px，只显示前 2 条，不提示还有 2 条被藏掉了
          cells += `
            <rect x="${x + 3}" y="${y + 15}" width="${colW - 6}" height="10" rx="2" fill="#E8E0F9"/><circle cx="${x + 7}" cy="${y + 20}" r="1.8" fill="#513EC4"/>
            <rect x="${x + 3}" y="${y + 28}" width="${colW - 6}" height="10" rx="2" fill="#FCE5E3"/><circle cx="${x + 7}" cy="${y + 33}" r="1.8" fill="#E0447B"/>
          `;
        } else {
          // 强压字号硬塞 4 条，留白归零
          cells += `
            <rect x="${x + 2}" y="${y + 14}" width="${colW - 4}" height="7" rx="1.5" fill="#E8E0F9"/>
            <rect x="${x + 2}" y="${y + 22}" width="${colW - 4}" height="7" rx="1.5" fill="#FCE5E3"/>
            <rect x="${x + 2}" y="${y + 30}" width="${colW - 4}" height="7" rx="1.5" fill="#FDF0D3"/>
            <rect x="${x + 2}" y="${y + 38}" width="${colW - 4}" height="7" rx="1.5" fill="#EAE1F9"/>
          `;
        }
      }
    }
  }

  return `<svg viewBox="0 0 264 ${totalH}" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="252" height="18" rx="4" fill="#4C3C99"/>
    ${["一","二","三","四","五","六","日"].map((d, i) => `<text x="${6 + i*36 + 18}" y="16" text-anchor="middle" fill="${i>=5?"#FFC2D9":"#FFFFFF"}" font-family="Noto Sans SC,sans-serif" font-weight="700" font-size="8.5">${d}</text>`).join("")}
    ${cells}
  </svg>`;
}

export function initQuiz() {
  for (const k of ["A", "B", "C", "D"]) {
    const slot = document.getElementById(`quiz-svg-${k}`);
    if (slot) slot.innerHTML = renderQuizSvg(k);
  }
  const cards = [...document.querySelectorAll(".quiz-card")];
  const fb = document.getElementById("quiz-feedback");
  if (!cards.length || !fb) return;

  const REASONS = {
    A: "方案 A 把第 2 行撑成了其他行的 2.4 倍高：虽然 4 条事件全露出来了，但单元格尺寸一致的秩序被破坏，扫读其他五天时眼睛被拉出大片空洞，月历总高也会随某天突然暴涨。",
    B: "方案 B 守住了「网格一致 + 信息分层 + 留白平衡」三重底线：保持等高网格，格内只放日期与前 2 条色码事件，再用「+2」明示还有未展开日程，点开即可在旁侧抽屉看全表。",
    C: "方案 C 看起来最干净，却隐藏了最危险的坑——静默截断掉第 3、4 场会议且不给「+2」提示，同事扫一眼以为周四下午只排了两场、其余空闲，结果直接约出撞期会议。",
    D: "方案 D 硬压行距与字号把 4 条全塞进同一高度：既没丢项也没撑破行高，但单元格留白跌至接近零，色条挤成一团，在正常阅读距离上根本分辨不出日期与事件内容。",
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const pick = card.dataset.choice;
      const right = pick === "B";
      cards.forEach((c) => {
        const ch = c.dataset.choice;
        c.setAttribute("aria-pressed", String(ch === pick));
        c.classList.remove("is-correct", "is-wrong");
        if (ch === "B") c.classList.add("is-correct");
        else if (ch === pick) c.classList.add("is-wrong");
      });

      fb.hidden = false;
      fb.dataset.tone = right ? "pass" : "fail";
      fb.innerHTML = `
        <h3>${right ? "判断准确：方案 B 最耐扫读" : `你选了方案 ${pick}，更合适的是方案 B`}</h3>
        <p>${REASONS[pick]}</p>
        <ul class="quiz-breakdown">
          <li><strong>方案 A（动态撑高行高）</strong>：打破等高单元格节奏，空白行被拉扯变形。</li>
          <li><strong>方案 B（等高 + 上限 2 条 +「+2」折叠）</strong>：既守住视觉秩序与留白，又诚实标出隐藏数量。</li>
          <li><strong>方案 C（静默截断无提示）</strong>：表面工整却掩盖真实排期，极易导致误判空档与撞期。</li>
          <li><strong>方案 D（强压字号硬塞全项）</strong>：留白归零、文字粘连，丧失 3 秒快速扫读能力。</li>
        </ul>
      `;
    });
  });
}

/* ==================== 07 节：原海报放大灯箱（支持缩放、拖动平移、Esc 关闭） ==================== */
export function initPosterLightbox() {
  const openBtn = document.getElementById("btn-open-poster");
  const box = document.getElementById("poster-lightbox");
  const stage = document.getElementById("lightbox-stage");
  const img = document.getElementById("lightbox-img");
  const poster = document.getElementById("poster");
  const zIn = document.getElementById("lb-zoom-in");
  const zOut = document.getElementById("lb-zoom-out");
  const zReset = document.getElementById("lb-zoom-reset");
  const closeBtn = document.getElementById("lb-close");
  if (!openBtn || !box || !img || !poster) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    if (!img.src) img.src = poster.src; // 共用唯一内联 data URI，不重复内联海报
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    box.hidden = false;
    closeBtn.focus();
  }

  function close() {
    box.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  zIn.addEventListener("click", () => { scale = Math.min(3, +(scale + 0.35).toFixed(2)); applyTransform(); });
  zOut.addEventListener("click", () => { scale = Math.max(0.75, +(scale - 0.35).toFixed(2)); applyTransform(); });
  zReset.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(0.75, Math.min(3, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage) { close(); return; }
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = () => { dragging = false; };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !box.hidden) close();
  });
}
