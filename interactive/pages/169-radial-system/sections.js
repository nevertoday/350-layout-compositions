// 169 放射系统 · 正文 01–07 互动模块（每节控件各不相同、相邻零重复）
import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, PRINCIPLES } from "./model.js";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// 公共 SVG 图标生成器：1:1 复刻原海报 8 枚几何图符徽章 + 4 枚应用场景图符
// ---------------------------------------------------------------------------
export function principleIconSvg(id) {
  const map = {
    center: `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="22" cy="22" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="22" cy="22" r="4.5" fill="currentColor"/></svg>`,
    focus: `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="4" fill="currentColor"/><path d="M10 10l7 7m0 0h-5m5 0v-5M34 10l-7 7m0 0h5m-5 0v-5M10 34l7-7m0 0h-5m5 0v5M34 34l-7-7m0 0h5m-5 0v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    rhythm: `<svg viewBox="0 0 44 44" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .map((i) => {
        const a = (i * 30 * Math.PI) / 180;
        return `<circle cx="${(22 + Math.cos(a) * 14).toFixed(1)}" cy="${(22 + Math.sin(a) * 14).toFixed(1)}" r="1.9" fill="currentColor"/>`;
      })
      .join("")}${[0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i * 45 * Math.PI) / 180;
        return `<circle cx="${(22 + Math.cos(a) * 7.8).toFixed(1)}" cy="${(22 + Math.sin(a) * 7.8).toFixed(1)}" r="1.5" fill="currentColor"/>`;
      })
      .join("")}<circle cx="22" cy="22" r="2.2" fill="currentColor"/></svg>`,
    balance: `<svg viewBox="0 0 44 44" aria-hidden="true">${[12, 22, 32]
      .flatMap((y) => [12, 22, 32].map((x) => `<circle cx="${x}" cy="${y}" r="2.6" fill="currentColor"/>`))
      .join("")}</svg>`,
    guide: `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M22 22V8A14 14 0 1 0 36 22Z" fill="currentColor"/><path d="M22 8A14 14 0 0 1 36 22H22Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M24 12h7M24 16h10M24 20h11" stroke="currentColor" stroke-width="1.1"/></svg>`,
    scale: `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="12" cy="30" r="3.4" fill="currentColor"/><circle cx="21" cy="23" r="4.8" fill="currentColor"/><circle cx="31" cy="14" r="6.2" fill="currentColor"/></svg>`,
    hierarchy: `<svg viewBox="0 0 44 44" aria-hidden="true"><rect x="11" y="25" width="4.6" height="9" rx="1" fill="currentColor"/><rect x="19.7" y="18" width="4.6" height="16" rx="1" fill="currentColor"/><rect x="28.4" y="11" width="4.6" height="23" rx="1" fill="currentColor"/></svg>`,
    radiate: `<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M17 17l-7-7m0 0h5m-5 0v5M27 17l7-7m0 0h-5m5 0v5M17 27l-7 7m0 0h5m-5 0v-5M27 27l7 7m0 0h-5m5 0v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  return map[id] || map.center;
}

export function appIconSvg(id) {
  const map = {
    infographic: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="#25CFE8" stroke-width="1.4" stroke-dasharray="18 4 12 4"/><circle cx="20" cy="20" r="8" fill="none" stroke="#F1DDB4" stroke-width="1.5" stroke-dasharray="12 5"/><circle cx="20" cy="20" r="2.6" fill="#F064A0"/></svg>`,
    dataviz: `<svg viewBox="0 0 40 40" aria-hidden="true">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      .map((d, i) => {
        const r1 = 5.5;
        const r2 = i % 3 === 0 ? 15.5 : i % 2 === 0 ? 12.5 : 9.5;
        const a = d * DEG;
        const col = i % 3 === 0 ? "#F064A0" : i % 3 === 1 ? "#F1DDB4" : "#25CFE8";
        return `<line x1="${(20 + Math.cos(a) * r1).toFixed(1)}" y1="${(20 + Math.sin(a) * r1).toFixed(1)}" x2="${(20 + Math.cos(a) * r2).toFixed(1)}" y2="${(20 + Math.sin(a) * r2).toFixed(1)}" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>`;
      })
      .join("")}<circle cx="20" cy="20" r="2.2" fill="#F1DDB4"/></svg>`,
    branding: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="#25CFE8" stroke-width="1.3"/><circle cx="20" cy="20" r="10.2" fill="none" stroke="#F1DDB4" stroke-width="1.4"/><polygon points="20,13 22,17.8 27,18.2 23.2,21.5 24.4,26.4 20,23.8 15.6,26.4 16.8,21.5 13,18.2 18,17.8" fill="#F1DDB4"/></svg>`,
    uinav: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="#25CFE8" stroke-width="1.4"/><path d="M20 6A14 14 0 0 1 34 20H20Z" fill="#F064A0" fill-opacity="0.82"/><path d="M20 20H34A14 14 0 0 1 20 34Z" fill="#F1DDB4" fill-opacity="0.65"/><circle cx="20" cy="20" r="4" fill="#010A1E" stroke="#25CFE8" stroke-width="1.4"/></svg>`,
  };
  return map[id] || map.infographic;
}

// ---------------------------------------------------------------------------
// 01 八维法则拆解：点击 8 枚原海报原则，切出对应的「失序态 vs 成立态」矢量剖面
// ---------------------------------------------------------------------------
const ANATOMY_DETAILS = {
  center: {
    badLabel: "失序：散落无圆心，视线游荡",
    goodLabel: "成立：先立强圆心，再放外围",
    plain: "放射系统成败的一半，取决于中心有没有「分量」。圆心不只是几何坐标，更是整张版面信息优先级最高的那一句结论或标志。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[[38,34],[170,28],[108,118],[52,110],[176,104],[126,42]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#FF6B7B" stroke-width="1.6"/><line x1="${x}" y1="${y}" x2="${x+16}" y2="${y-10}" stroke="#FF6B7B" stroke-width="1.2" opacity="0.65"/>`).join("")}</svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[0,45,90,135,180,225,270,315].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*26}" y1="${75+Math.sin(a)*26}" x2="${110+Math.cos(a)*58}" y2="${75+Math.sin(a)*58}" stroke="#25CFE8" stroke-width="1.6"/>`;}).join("")}<circle cx="110" cy="75" r="22" fill="#010A1E" stroke="#25CFE8" stroke-width="2"/><circle cx="110" cy="75" r="10" fill="#F1DDB4"/></svg>`,
  },
  focus: {
    badLabel: "失序：外围与中心一样抢眼",
    goodLabel: "成立：中心强对比锁死第一眼",
    plain: "聚焦靠的是「落差」：中心字重、面积或留白护城河要显著强于外圈节点，不能让八个配角同时用最大字号抢麦克风。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><circle cx="110" cy="75" r="14" fill="#F064A0"/>${[0,60,120,180,240,300].map((d)=>{const a=d*DEG;return `<circle cx="${110+Math.cos(a)*50}" cy="${75+Math.sin(a)*46}" r="14" fill="#FF6B7B"/>`;}).join("")}</svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><circle cx="110" cy="75" r="32" fill="none" stroke="#25CFE8" stroke-dasharray="3 4"/><circle cx="110" cy="75" r="20" fill="#F1DDB4"/>${[0,60,120,180,240,300].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*34}" y1="${75+Math.sin(a)*34}" x2="${110+Math.cos(a)*56}" y2="${75+Math.sin(a)*48}" stroke="#25CFE8" stroke-width="1.4"/><circle cx="${110+Math.cos(a)*58}" cy="${75+Math.sin(a)*50}" r="5" fill="#25CFE8"/>`;}).join("")}</svg>`,
  },
  rhythm: {
    badLabel: "失序：等长等粗，机械刺球",
    goodLabel: "成立：长短疏密交替生韵律",
    plain: "重复建立秩序，变化带来生命力。原海报把粗实线、细虚线、长短射线与停顿圆点交错混排，才避开了廉价「太阳光芒」的呆板感。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${Array.from({length:16},(_,i)=>{const a=(i*22.5)*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*58}" y2="${75+Math.sin(a)*58}" stroke="#FF6B7B" stroke-width="2.2"/>`;}).join("")}<circle cx="110" cy="75" r="18" fill="#081630" stroke="#FF6B7B"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${Array.from({length:12},(_,i)=>{const a=(i*30)*DEG;const len=i%3===0?62:i%2===0?46:34;const col=i%3===0?"#F064A0":i%2===0?"#25CFE8":"#F1DDB4";return `<line x1="${110+Math.cos(a)*22}" y1="${75+Math.sin(a)*22}" x2="${110+Math.cos(a)*len}" y2="${75+Math.sin(a)*len}" stroke="${col}" stroke-width="${i%3===0?2.6:1.3}" ${i%3===2?'stroke-dasharray="2 4"':""}/>`;}).join("")}<circle cx="110" cy="75" r="18" fill="#010A1E" stroke="#F064A0" stroke-width="1.6"/></svg>`,
  },
  balance: {
    badLabel: "失序：重量堆在单侧，整盘倾覆",
    goodLabel: "成立：对向扇区质量彼此托住",
    plain: "均衡不等于必须 360° 刻板等分——哪怕采用不对称的双扇构图，只要各条射线按长度和视觉重量合成的矢量接近圆心，画面依然稳如磐石。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><circle cx="110" cy="75" r="18" fill="#010A1E" stroke="#25CFE8"/>${[-35,-12,12,35,58,82].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*62}" y2="${75+Math.sin(a)*62}" stroke="#FF6B7B" stroke-width="2.2"/><circle cx="${110+Math.cos(a)*64}" cy="${75+Math.sin(a)*64}" r="4" fill="#FF6B7B"/>`;}).join("")}<line x1="110" y1="75" x2="152" y2="92" stroke="#FF6B7B" stroke-dasharray="3 3" stroke-width="1.8"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><circle cx="110" cy="75" r="18" fill="#010A1E" stroke="#3BE0A8" stroke-width="1.8"/>${[-155,-125,-30,0,30,150].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*58}" y2="${75+Math.sin(a)*58}" stroke="#25CFE8" stroke-width="1.8"/><circle cx="${110+Math.cos(a)*60}" cy="${75+Math.sin(a)*60}" r="4" fill="#25CFE8"/>`;}).join("")}<circle cx="110" cy="75" r="4" fill="#3BE0A8"/></svg>`,
  },
  guide: {
    badLabel: "失序：切线歪斜，延长线不归心",
    goodLabel: "成立：双向导轨，由外向心又由心外探",
    plain: "放射线天生是一把双向导轨：远看时，所有直线的延长线把眼睛吸回圆心；近读时，眼睛顺着射线逐条外探细节，不再迷路。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><circle cx="110" cy="75" r="16" fill="none" stroke="#9FB4C9" stroke-dasharray="3 3"/><line x1="45" y1="30" x2="175" y2="54" stroke="#FF6B7B" stroke-width="1.8"/><line x1="42" y1="118" x2="165" y2="96" stroke="#FF6B7B" stroke-width="1.8"/><line x1="138" y1="22" x2="160" y2="128" stroke="#FF6B7B" stroke-width="1.8"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[0,60,120,180,240,300].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*18}" y1="${75+Math.sin(a)*18}" x2="${110+Math.cos(a)*62}" y2="${75+Math.sin(a)*54}" stroke="#F064A0" stroke-width="1.8"/><circle cx="${110+Math.cos(a)*40}" cy="${75+Math.sin(a)*36}" r="2.4" fill="#F1DDB4"/>`;}).join("")}<circle cx="110" cy="75" r="16" fill="#010A1E" stroke="#F064A0" stroke-width="2"/><circle cx="110" cy="75" r="4.5" fill="#F064A0"/></svg>`,
  },
  scale: {
    badLabel: "失序：内外尺度拉平，无纵深感",
    goodLabel: "成立：由内及外阶梯缩放，产生空间纵深",
    plain: "在极坐标里，越靠近圆心空间越珍贵，越往外弧长越宽。沿着半径有意识地递进或递减元素尺寸，平面版式立刻长出透视般的纵深。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[45,135,225,315].map((d)=>{const a=d*DEG;return [26,46,66].map((r)=>`<circle cx="${110+Math.cos(a)*r}" cy="${75+Math.sin(a)*r*0.85}" r="5.5" fill="#FF6B7B"/>`).join("");}).join("")}</svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[45,135,225,315].map((d)=>{const a=d*DEG;return [[24,3],[44,5.5],[66,9]].map(([r,rad])=>`<circle cx="${110+Math.cos(a)*r}" cy="${75+Math.sin(a)*r*0.85}" r="${rad}" fill="#25CFE8" fill-opacity="${rad===9?0.95:rad===5.5?0.72:0.48}"/>`).join("");}).join("")}<circle cx="110" cy="75" r="8" fill="#F1DDB4"/></svg>`,
  },
  hierarchy: {
    badLabel: "失序：所有分支同一级别，不知先读谁",
    goodLabel: "成立：核 → 主射线 → 次注记三阶清晰",
    plain: "优秀的放射排印通常分层清晰：第一眼看圆心大标题，第二眼扫 3–4 条高亮主射线，第三眼才读细小的辅助分支与注释文字。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[0,45,90,135,180,225,270,315].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*16}" y1="${75+Math.sin(a)*16}" x2="${110+Math.cos(a)*54}" y2="${75+Math.sin(a)*50}" stroke="#9FB4C9" stroke-width="2"/>`;}).join("")}<circle cx="110" cy="75" r="14" fill="#9FB4C9"/></svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[0,90,180,270].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*62}" y2="${75+Math.sin(a)*54}" stroke="#F1DDB4" stroke-width="3"/>`;}).join("")}${[45,135,225,315].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*44}" y2="${75+Math.sin(a)*40}" stroke="#25CFE8" stroke-width="1.3" stroke-dasharray="3 3"/>`;}).join("")}<circle cx="110" cy="75" r="19" fill="#010A1E" stroke="#F1DDB4" stroke-width="2.4"/><circle cx="110" cy="75" r="7" fill="#F1DDB4"/></svg>`,
  },
  radiate: {
    badLabel: "失序：线条内缩憋闷，外沿无张力",
    goodLabel: "成立：向外张开且有外圈留白兜底",
    plain: "发散感来自方向矢量与外圈留白的配合：射线朝外延展，但外侧依然保留足够暗场余量，画面才显出呼吸与空间张力，而不是顶爆画框。",
    badSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/><rect x="66" y="34" width="88" height="82" fill="none" stroke="#FF6B7B" stroke-dasharray="3 3"/>${[0,45,90,135,180,225,270,315].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*12}" y1="${75+Math.sin(a)*12}" x2="${110+Math.cos(a)*34}" y2="${75+Math.sin(a)*32}" stroke="#FF6B7B" stroke-width="2"/>`;}).join("")}</svg>`,
    goodSvg: `<svg viewBox="0 0 220 150" aria-hidden="true"><rect width="220" height="150" rx="8" fill="#081630"/>${[0,45,90,135,180,225,270,315].map((d)=>{const a=d*DEG;return `<line x1="${110+Math.cos(a)*20}" y1="${75+Math.sin(a)*20}" x2="${110+Math.cos(a)*58}" y2="${75+Math.sin(a)*50}" stroke="#F064A0" stroke-width="1.8"/><circle cx="${110+Math.cos(a)*63}" cy="${75+Math.sin(a)*55}" r="2.6" fill="#25CFE8"/>`;}).join("")}<circle cx="110" cy="75" r="16" fill="#010A1E" stroke="#F064A0" stroke-width="1.6"/></svg>`,
  },
};

export function initAnatomySection() {
  const grid = document.getElementById("anatomy-grid");
  const panel = document.getElementById("anatomy-compare");
  if (!grid || !panel) return;

  let active = "center";

  function renderCompare(id) {
    active = id;
    const p = PRINCIPLES.find((x) => x.id === id) || PRINCIPLES[0];
    const d = ANATOMY_DETAILS[id] || ANATOMY_DETAILS.center;
    for (const btn of grid.querySelectorAll("button[data-pid]")) {
      const isOn = btn.dataset.pid === id;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-pressed", String(isOn));
    }
    panel.innerHTML = `
      <div class="compare-head">
        <div>
          <span class="compare-kicker">${p.en} · 原则拆解</span>
          <h3 class="compare-title">${p.zh}</h3>
        </div>
        <p class="compare-quote">海报原话：「${p.body}」</p>
      </div>
      <div class="compare-pair">
        <figure class="compare-card is-bad">
          ${d.badSvg}
          <figcaption><span class="dot-bad"></span>${d.badLabel}</figcaption>
        </figure>
        <figure class="compare-card is-good">
          ${d.goodSvg}
          <figcaption><span class="dot-good"></span>${d.goodLabel}</figcaption>
        </figure>
      </div>
      <p class="compare-plain">${d.plain}</p>
    `;
  }

  grid.innerHTML = PRINCIPLES.map(
    (p, i) => `
    <button type="button" class="anatomy-btn tone-${p.colorKey}" data-pid="${p.id}" aria-pressed="${i === 0 ? "true" : "false"}">
      <span class="anatomy-icon">${principleIconSvg(p.id)}</span>
      <span class="anatomy-meta">
        <strong>${p.zh}</strong>
        <small>${p.en}</small>
      </span>
      <span class="anatomy-desc">${p.body}</span>
    </button>
  `
  ).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-pid]");
    if (btn) renderCompare(btn.dataset.pid);
  });

  renderCompare("center");
}

// ---------------------------------------------------------------------------
// 02 为什么放射能抓住人：饼状轮盘 vs 线性下拉 真实点击路径与耗时实测器（费茨定律）
// ---------------------------------------------------------------------------
const FITTS_ITEMS = ["复制", "旋转", "缩放", "对齐", "裁剪", "锁定", "导出", "撤销"];

export function initFittsSection() {
  const root = document.getElementById("fitts-bench");
  if (!root) return;

  let mode = "pie"; // pie | linear
  let targetIdx = 5; // 默认锁定第 6 项「锁定」，在线性菜单里距离很远，在轮盘里一样近！
  let armed = false;
  let startTime = 0;
  let startPos = { x: 0, y: 0 };
  let records = { pie: [], linear: [] };
  let lastRun = null;

  const pieWrap = root.querySelector("#fitts-pie-wrap");
  const linearWrap = root.querySelector("#fitts-linear-wrap");
  const targetLabel = root.querySelector("#fitts-target-name");
  const statusEl = root.querySelector("#fitts-status");
  const pieStatEl = root.querySelector("#fitts-stat-pie");
  const linearStatEl = root.querySelector("#fitts-stat-linear");
  const startBtn = root.querySelector("#fitts-start-btn");
  const demoBtn = root.querySelector("#fitts-demo-btn");

  // 构建 8 扇区径向菜单（用精确三角坐标定位按钮，手机不挤不重叠）
  const pieButtons = [];
  const pieRing = root.querySelector("#fitts-pie-ring");
  FITTS_ITEMS.forEach((label, i) => {
    const a = (-90 + i * 45) * DEG;
    const xPct = 50 + Math.cos(a) * 35.5;
    const yPct = 50 + Math.sin(a) * 35.5;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pie-item";
    btn.dataset.idx = String(i);
    btn.style.left = `${xPct.toFixed(1)}%`;
    btn.style.top = `${yPct.toFixed(1)}%`;
    btn.textContent = label;
    pieRing.appendChild(btn);
    pieButtons.push(btn);
  });

  // 构建 8 行线性下拉菜单
  const linearList = root.querySelector("#fitts-linear-list");
  const linearButtons = [];
  FITTS_ITEMS.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "linear-item";
    btn.dataset.idx = String(i);
    btn.innerHTML = `<span class="linear-idx">0${i + 1}</span><span>${label}</span>`;
    linearList.appendChild(btn);
    linearButtons.push(btn);
  });

  function updateView() {
    for (const tab of root.querySelectorAll("[data-fitts-mode]")) {
      const on = tab.dataset.fittsMode === mode;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-pressed", String(on));
    }
    pieWrap.hidden = mode !== "pie";
    linearWrap.hidden = mode !== "linear";
    targetLabel.textContent = FITTS_ITEMS[targetIdx];

    pieButtons.forEach((b, i) => b.classList.toggle("is-target", armed && i === targetIdx));
    linearButtons.forEach((b, i) => b.classList.toggle("is-target", armed && i === targetIdx));

    const avg = (arr) =>
      arr.length
        ? `${Math.round(arr.reduce((s, r) => s + r.dist, 0) / arr.length)} px · ${Math.round(arr.reduce((s, r) => s + r.ms, 0) / arr.length)} ms（${arr.length} 次）`
        : "待实测";
    pieStatEl.textContent = avg(records.pie);
    linearStatEl.textContent = avg(records.linear);
  }

  function armRound(triggerEl) {
    targetIdx = (targetIdx + 3) % FITTS_ITEMS.length;
    if (mode === "linear" && targetIdx < 4) targetIdx += 4; // 让线性底部选项充分暴露位移差
    armed = true;
    startTime = performance.now();
    const r = triggerEl.getBoundingClientRect();
    startPos = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    statusEl.textContent = `已计时：请立刻点选「${FITTS_ITEMS[targetIdx]}」！`;
    updateView();
  }

  function handlePick(idx, el) {
    if (!armed) {
      statusEl.textContent = "先点「从原点出发」按钮，再点亮起的目标项，系统会记录你的真实手部移动距离与耗时。";
      return;
    }
    if (idx !== targetIdx) {
      statusEl.textContent = `点到「${FITTS_ITEMS[idx]}」了，本轮目标是高亮的「${FITTS_ITEMS[targetIdx]}」。`;
      return;
    }
    const ms = Math.max(40, Math.round(performance.now() - startTime));
    const r = el.getBoundingClientRect();
    const dist = Math.round(Math.hypot(r.left + r.width / 2 - startPos.x, r.top + r.height / 2 - startPos.y));
    records[mode].push({ dist, ms, item: FITTS_ITEMS[idx] });
    lastRun = { mode, dist, ms, item: FITTS_ITEMS[idx] };
    armed = false;
    statusEl.textContent =
      mode === "pie"
        ? `径向命中「${lastRun.item}」：移动 ${dist} px，用时 ${ms} ms——8 个方向与原点永远等距！`
        : `线性命中「${lastRun.item}」：移动 ${dist} px，用时 ${ms} ms——越靠下的选项位移越长。`;
    updateView();
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-fitts-mode]");
    if (tab) {
      mode = tab.dataset.fittsMode;
      armed = false;
      statusEl.textContent = mode === "pie" ? "已切至 8 向径向饼状菜单：所有命令围绕中心原点等距排布。" : "已切至 8 行线性下拉菜单：第 1 项很近，但第 6–8 项需要长距离扫下。";
      updateView();
      return;
    }
    const pBtn = e.target.closest(".pie-item");
    if (pBtn) {
      handlePick(Number(pBtn.dataset.idx), pBtn);
      return;
    }
    const lBtn = e.target.closest(".linear-item");
    if (lBtn) {
      handlePick(Number(lBtn.dataset.idx), lBtn);
      return;
    }
  });

  startBtn.addEventListener("click", () => armRound(startBtn));
  root.querySelector("#fitts-pie-origin").addEventListener("click", (e) => armRound(e.currentTarget));
  root.querySelector("#fitts-linear-origin").addEventListener("click", (e) => armRound(e.currentTarget));

  demoBtn.addEventListener("click", () => {
    // 基于真实元素中心几何坐标一键测量 8 项平均理论位移
    const originEl = mode === "pie" ? root.querySelector("#fitts-pie-origin") : root.querySelector("#fitts-linear-origin");
    const items = mode === "pie" ? pieButtons : linearButtons;
    const o = originEl.getBoundingClientRect();
    const ox = o.left + o.width / 2;
    const oy = o.top + o.height / 2;
    const dists = items.map((el) => {
      const b = el.getBoundingClientRect();
      return Math.hypot(b.left + b.width / 2 - ox, b.top + b.height / 2 - oy);
    });
    const avgD = Math.round(dists.reduce((a, b) => a + b, 0) / dists.length);
    const maxD = Math.round(Math.max(...dists));
    const minD = Math.round(Math.min(...dists));
    statusEl.textContent =
      mode === "pie"
        ? `几何实测（径向 8 项）：最近 ${minD} px、最远 ${maxD} px、平均 ${avgD} px——所有指令等距且扇区向外敞开，命中容错更大。`
        : `几何实测（线性 8 项）：最近 ${minD} px、最远 ${maxD} px、平均 ${avgD} px——底部指令位移是顶部的 ${(maxD / Math.max(1, minD)).toFixed(1)} 倍，符合费茨定律耗时增长。`;
  });

  updateView();
}

// ---------------------------------------------------------------------------
// 03 放射排印三大暗礁：射线数量 N (4–24) × 字长档位 × 翻正 实时 2D 碰撞压测画布
// ---------------------------------------------------------------------------
const STRESS_WORDS = {
  short: ["中心", "聚焦", "节奏", "均衡", "引导", "比例", "层级", "发散", "留白", "对比", "轴线", "张力"],
  medium: ["确立视觉核心", "保持扇区均衡", "强化主次对比", "建立清晰层级", "留足内圈呼吸", "避免左半倒立"],
  long: ["在强中心放射版式里强行塞入一整句长说明文字会迫使读者反复歪头阅读"],
};

export function initStressLabSection() {
  const canvas = document.getElementById("stress-canvas");
  const countSlider = document.getElementById("stress-count");
  const countOut = document.getElementById("stress-count-val");
  const verdictEl = document.getElementById("stress-verdict");
  const metricsEl = document.getElementById("stress-metrics");
  const controls = document.getElementById("stress-controls");
  if (!canvas || !countSlider || !controls) return;

  const ctx = canvas.getContext("2d");
  const state = {
    count: 20, // 初始刻意放在 20 条 + 短语 + 未翻正，桌面与手机同时直击内圈撞车与倒立！
    lenMode: "medium", // short | medium | long
    autoFlip: false,
  };

  function evaluateStress(W, H) {
    const R = Math.min(W, H) * 0.43;
    const hubPx = R * 0.28;
    const arcPerSpokePx = (TAU * hubPx) / state.count;
    const fontPx = state.lenMode === "long" ? 11 : 12;
    const rootCollision = arcPerSpokePx < fontPx * 1.6;
    let invertedCount = 0;
    for (let i = 0; i < state.count; i++) {
      const deg = -90 + (i * 360) / state.count;
      const rad = deg * DEG;
      if (!state.autoFlip && Math.cos(rad) < -0.06) invertedCount++;
    }
    const outerOverflow = state.lenMode === "long" && R * 0.68 < 180;
    const safe = !rootCollision && invertedCount === 0 && !outerOverflow;
    return { R, hubPx, arcPerSpokePx, fontPx, rootCollision, invertedCount, outerOverflow, safe };
  }

  function render(_, __, { still }) {
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(260, Math.round(rect.width));
    const H = Math.max(260, Math.round(rect.height));
    const dpr = window.innerWidth < 600 ? pixelRatio(1.5) : pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const ev = evaluateStress(W, H);
    const cx = W / 2;
    const cy = H / 2;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#040E24";
    ctx.fillRect(0, 0, W, H);

    // 内圈弧长预警圈
    ctx.strokeStyle = ev.rootCollision ? "rgba(255, 107, 123, 0.72)" : "rgba(59, 224, 168, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, ev.hubPx, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    // 外圈画框界限提示
    ctx.strokeStyle = ev.outerOverflow ? "rgba(255, 107, 123, 0.45)" : "rgba(37, 207, 232, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, ev.R * 0.98, 0, TAU);
    ctx.stroke();

    const pool = STRESS_WORDS[state.lenMode];
    ctx.font = `500 ${ev.fontPx}px "Noto Sans SC", sans-serif`;

    for (let i = 0; i < state.count; i++) {
      const deg = -90 + (i * 360) / state.count;
      const rad = deg * DEG;
      const isLeft = Math.cos(rad) < -0.06;
      const isInv = !state.autoFlip && isLeft;
      const label = pool[i % pool.length];

      const col = ev.rootCollision || isInv || ev.outerOverflow ? PALETTE.err : i % 2 === 0 ? PALETTE.cyan : PALETTE.gold;

      // 射线微线
      ctx.strokeStyle = col;
      ctx.globalAlpha = ev.rootCollision ? 0.52 : 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * ev.hubPx, cy + Math.sin(rad) * ev.hubPx);
      ctx.lineTo(cx + Math.cos(rad) * ev.R * 0.96, cy + Math.sin(rad) * ev.R * 0.96);
      ctx.stroke();

      // 根部碰撞红点
      if (ev.rootCollision) {
        ctx.fillStyle = "rgba(255, 107, 123, 0.45)";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(rad) * ev.hubPx, cy + Math.sin(rad) * ev.hubPx, 4.5, 0, TAU);
        ctx.fill();
      }

      // 文字沿射线排布
      ctx.save();
      ctx.globalAlpha = 0.95;
      const startDist = ev.hubPx + 8;
      ctx.translate(cx + Math.cos(rad) * startDist, cy + Math.sin(rad) * startDist);
      const flip = state.autoFlip && isLeft;
      ctx.rotate(flip ? rad + Math.PI : rad);
      ctx.textAlign = flip ? "right" : "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isInv ? "#FF8C9A" : ev.rootCollision ? "#FFB0B9" : "#E5F0FA";
      const drawTxt = state.lenMode === "long" ? label.slice(0, 18) : label;
      ctx.fillText(drawTxt, flip ? -2 : 2, 0);
      ctx.restore();
    }

    // 中央核标
    ctx.fillStyle = "#040E24";
    ctx.beginPath();
    ctx.arc(cx, cy, ev.hubPx * 0.86, 0, TAU);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ev.safe ? PALETTE.ok : PALETTE.err;
    ctx.font = `700 13px "IBM Plex Sans", "Noto Sans SC", sans-serif`;
    ctx.fillText(`${state.count} 条射线`, cx, cy - 7);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 10.5px "IBM Plex Sans", sans-serif`;
    ctx.fillText(`根距 ${Math.round(ev.arcPerSpokePx)}px`, cx, cy + 10);

    ctx.restore();

    // 更新实时文字研判（仅文本不同才改 DOM）
    const problems = [];
    if (ev.rootCollision) problems.push(`内圈每条弧长仅 ${Math.round(ev.arcPerSpokePx)}px（低于安全经验值 ${Math.round(ev.fontPx * 1.6)}px），射线根部互相叠撞`);
    if (ev.invertedCount > 0) problems.push(`左半圆有 ${ev.invertedCount} 条文字倒立未翻正`);
    if (ev.outerOverflow) problems.push("22 字长句超出半径空间，强行放射迫使眼球沿斜线反复追字");

    const msg = problems.length
      ? `警报：${problems.join("；")}。把条数降回 6–12 条、缩短为 4–6 字关键词并开启左半圆翻正试试。`
      : `通过：内圈根距 ${Math.round(ev.arcPerSpokePx)}px 足够清爽、左半圆文字顺读、词条长度不溢框（6–12 条短词为放射排印的舒适经验值）。`;

    if (verdictEl.textContent !== msg) {
      verdictEl.textContent = msg;
      verdictEl.classList.toggle("is-ok", ev.safe);
    }
    const mStr = `内圈周长 ${Math.round(TAU * ev.hubPx)}px · 单条弧距 ${Math.round(ev.arcPerSpokePx)}px · 倒立 ${ev.invertedCount} 条`;
    if (metricsEl.textContent !== mStr) metricsEl.textContent = mStr;
    if (still) return;
  }

  const ctl = loop(canvas, render);

  function syncButtons() {
    countOut.textContent = `${state.count} 条`;
    countSlider.value = String(state.count);
    for (const b of controls.querySelectorAll("[data-len]")) {
      const on = b.dataset.len === state.lenMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    const flipBtn = controls.querySelector("#stress-flip-btn");
    if (flipBtn) {
      flipBtn.classList.toggle("is-active", state.autoFlip);
      flipBtn.setAttribute("aria-pressed", String(state.autoFlip));
      flipBtn.textContent = state.autoFlip ? "左半圆翻正：开" : "左半圆翻正：关（倒立）";
    }
    ctl.draw();
  }

  countSlider.addEventListener("input", () => {
    state.count = Number(countSlider.value);
    syncButtons();
  });
  controls.addEventListener("click", (e) => {
    const lenBtn = e.target.closest("[data-len]");
    if (lenBtn) {
      state.lenMode = lenBtn.dataset.len;
      syncButtons();
      return;
    }
    if (e.target.closest("#stress-flip-btn")) {
      state.autoFlip = !state.autoFlip;
      syncButtons();
      return;
    }
    if (e.target.closest("#stress-sweet-btn")) {
      state.count = 8;
      state.lenMode = "short";
      state.autoFlip = true;
      syncButtons();
    }
  });

  syncButtons();
}

// ---------------------------------------------------------------------------
// 04 放射系统从哪来：四时代典籍标本切换（全部核实人名、书名、年份）
// ---------------------------------------------------------------------------
const HISTORY_ERAS = [
  {
    id: "1858",
    year: "1858",
    who: "弗洛伦斯·南丁格尔（Florence Nightingale）",
    work: "《关于影响英国陆军健康、效率与医院管理的若干事项说明》",
    workEn: "Notes on Matters Affecting the Health, Efficiency, and Hospital Administration of the British Army",
    summary:
      "南丁格尔在 1858 年报告中绘制了著名的「东方军队死亡原因图」（极区面积图 / 玫瑰图）：从同一个圆心出发，把一年十二个月切成 12 个等角扇区，以面积大小直观对比克里米亚战争中可预防疫病（蓝）、战伤（红）与其他死因（黑）。它是现代放射型信息可视化最具说服力的起点之一。",
    takeaway: "给排版的启示：放射不是为了炫技——当时间或分类围绕同一原点循环展开，半径差异一眼就能讲清比例轻重。",
    svg: `<svg viewBox="0 0 320 220" aria-hidden="true"><rect width="320" height="220" rx="8" fill="#101B2D"/>${[
      [0, 58, "#25CFE8"], [30, 74, "#25CFE8"], [60, 88, "#25CFE8"], [90, 96, "#25CFE8"],
      [120, 82, "#25CFE8"], [150, 62, "#25CFE8"], [180, 48, "#25CFE8"], [210, 42, "#25CFE8"],
      [240, 38, "#25CFE8"], [270, 35, "#25CFE8"], [300, 34, "#25CFE8"], [330, 44, "#25CFE8"],
    ]
      .map(([d, r, col]) => {
        const a1 = (d - 90) * DEG;
        const a2 = (d - 60) * DEG;
        const x1 = 160 + Math.cos(a1) * r;
        const y1 = 112 + Math.sin(a1) * r;
        const x2 = 160 + Math.cos(a2) * r;
        const y2 = 112 + Math.sin(a2) * r;
        return `<path d="M160 112 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}" fill-opacity="0.32" stroke="${col}" stroke-width="1.2"/>`;
      })
      .join("")}${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
      .map((d, i) => {
        const r = 14 + ((i * 7) % 16);
        const a1 = (d - 90) * DEG;
        const a2 = (d - 60) * DEG;
        return `<path d="M160 112 L${(160 + Math.cos(a1) * r).toFixed(1)} ${(112 + Math.sin(a1) * r).toFixed(1)} A${r} ${r} 0 0 1 ${(160 + Math.cos(a2) * r).toFixed(1)} ${(112 + Math.sin(a2) * r).toFixed(1)} Z" fill="#F064A0" fill-opacity="0.65" stroke="#F064A0" stroke-width="1"/>`;
      })
      .join("")}<circle cx="160" cy="112" r="5" fill="#F1DDB4"/><text x="160" y="206" text-anchor="middle" fill="#F1DDB4" font-size="11" font-family="IBM Plex Sans, sans-serif">POLAR AREA · 12 MONTHS · 1858</text></svg>`,
  },
  {
    id: "1918",
    year: "1918–1919",
    who: "纪尧姆·阿波利奈尔 & 菲利波·托马索·马里内蒂",
    work: "《图画诗》（Calligrammes, 1918）与《未来主义的自由词》（1919）",
    workEn: "Calligrammes (1918) · Les Mots en liberté futuristes (1919)",
    summary:
      "一战前后，法国诗人阿波利奈尔在《图画诗》里把诗行排成放射星芒、喷泉与钟表；次年，意大利未来主义创始人马里内蒂在米兰出版《未来主义的自由词》，用四幅折页彻底砸碎传统铅字的水平基线，让字体像炮火与声浪一样从页面中心向四周炸开。",
    takeaway: "给排版的启示：文字不必永远躺在水平线上，当情绪、声响或动态张力成为主角，放射角度本身就是修辞。",
    svg: `<svg viewBox="0 0 320 220" aria-hidden="true"><rect width="320" height="220" rx="8" fill="#101B2D"/>${[
      [-145, "PAROLE"], [-100, "IN LIBERTA"], [-45, "RADIAL"], [5, "STARBURST"],
      [48, "1918–1919"], [135, "CALLIGRAMME"], [175, "AVANT-GARDE"],
    ]
      .map(([deg, txt], i) => {
        const col = i % 3 === 0 ? "#F1DDB4" : i % 3 === 1 ? "#F064A0" : "#25CFE8";
        const flip = deg > 90 || deg < -90;
        const rot = flip ? deg + 180 : deg;
        const anchor = flip ? "end" : "start";
        const rad = deg * DEG;
        const x = 160 + Math.cos(rad) * 24;
        const y = 108 + Math.sin(rad) * 24;
        return `<line x1="${(160 + Math.cos(rad) * 14).toFixed(1)}" y1="${(108 + Math.sin(rad) * 14).toFixed(1)}" x2="${(160 + Math.cos(rad) * 86).toFixed(1)}" y2="${(108 + Math.sin(rad) * 76).toFixed(1)}" stroke="${col}" stroke-opacity="0.35" stroke-dasharray="2 3"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${col}" font-size="${i%2===0?12:10}" font-weight="700" font-family="Syne, sans-serif" text-anchor="${anchor}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})">${txt}</text>`;
      })
      .join("")}<circle cx="160" cy="108" r="10" fill="#F064A0"/><text x="160" y="206" text-anchor="middle" fill="#F1DDB4" font-size="11" font-family="IBM Plex Sans, sans-serif">AVANT-GARDE RADIAL TYPE · 1918–1919</text></svg>`,
  },
  {
    id: "1988",
    year: "1988",
    who: "Callahan · Hopkins · Weiser · Shneiderman（马里兰大学）",
    work: "ACM CHI '88 论文《饼状菜单与线性菜单的实证对比》",
    workEn: "An Empirical Comparison of Pie vs. Linear Menus, CHI '88, pp. 95–100",
    summary:
      "1988 年 ACM CHI 大会上，马里兰大学研究团队对 8 项径向「饼状菜单」与传统垂直「线性菜单」做了受控实验：结果使用饼状菜单的选择速度平均快约 15%，且误选率显著更低。这一成果奠定了今天 3D 软件、绘图工具和动作游戏「快捷轮盘」的交互基石。",
    takeaway: "给排版的启示：在界面导航里，8 扇区以内的径向排布靠「等距 + 方向肌肉记忆」完胜长下拉列表。",
    svg: `<svg viewBox="0 0 320 220" aria-hidden="true"><rect width="320" height="220" rx="8" fill="#101B2D"/>${Array.from({ length: 8 }, (_, i) => {
      const a1 = (i * 45 - 112.5) * DEG;
      const a2 = (i * 45 - 67.5) * DEG;
      const am = (i * 45 - 90) * DEG;
      const hi = i === 1;
      return `<path d="M160 108 L${(160 + Math.cos(a1) * 76).toFixed(1)} ${(108 + Math.sin(a1) * 76).toFixed(1)} A76 76 0 0 1 ${(160 + Math.cos(a2) * 76).toFixed(1)} ${(108 + Math.sin(a2) * 76).toFixed(1)} Z" fill="${hi ? "#25CFE8" : "#15294A"}" fill-opacity="${hi ? 0.35 : 0.72}" stroke="#25CFE8" stroke-width="1.2"/><circle cx="${(160 + Math.cos(am) * 50).toFixed(1)}" cy="${(108 + Math.sin(am) * 50).toFixed(1)}" r="3.5" fill="${hi ? "#F1DDB4" : "#25CFE8"}"/>`;
    }).join("")}<circle cx="160" cy="108" r="18" fill="#010A1E" stroke="#F064A0" stroke-width="2"/><circle cx="160" cy="108" r="4" fill="#F064A0"/><text x="160" y="206" text-anchor="middle" fill="#F1DDB4" font-size="11" font-family="IBM Plex Sans, sans-serif">8-SECTOR PIE MENU · ACM CHI 1988</text></svg>`,
  },
  {
    id: "2007",
    year: "2007",
    who: "金伯利·埃拉姆（Kimberly Elam）",
    work: "《排印系统》（Princeton Architectural Press, 2007）",
    workEn: "Typographic Systems (ISBN 978-1-56898-687-6)",
    summary:
      "设计教育家金伯利·埃拉姆在 2007 年出版《排印系统》，将超越网格的文字组织归纳为八套系统——轴线、放射、扩张、随机、网格、模块、过渡与双边（即本系列 168–175 号）。她专门指出：放射系统把所有信息锁定在同一焦点，视觉冲击力极强，但必须严控焦点位置、射线角度与可读性。",
    takeaway: "给排版的启示：放射不是「乱辐射」，而是八大排印体系里最讲究向心结构与克制数量的一支。",
    svg: `<svg viewBox="0 0 320 220" aria-hidden="true"><rect width="320" height="220" rx="8" fill="#101B2D"/><circle cx="132" cy="110" r="24" fill="none" stroke="#F1DDB4" stroke-dasharray="3 3"/><circle cx="132" cy="110" r="10" fill="#F064A0"/>${[-70, -35, -8, 22, 55, 118, 162, 205].map((d, i) => {
      const a = d * DEG;
      const r2 = i % 2 === 0 ? 105 : 74;
      const col = i % 2 === 0 ? "#25CFE8" : "#F1DDB4";
      return `<line x1="${(132 + Math.cos(a) * 26).toFixed(1)}" y1="${(110 + Math.sin(a) * 26).toFixed(1)}" x2="${(132 + Math.cos(a) * r2).toFixed(1)}" y2="${(110 + Math.sin(a) * r2 * 0.78).toFixed(1)}" stroke="${col}" stroke-width="${i % 2 === 0 ? 2.4 : 1.3}"/>`;
    }).join("")}<text x="160" y="206" text-anchor="middle" fill="#F1DDB4" font-size="11" font-family="IBM Plex Sans, sans-serif">ELAM · TYPOGRAPHIC SYSTEMS · 2007</text></svg>`,
  },
];

export function initHistorySection() {
  const rail = document.getElementById("history-rail");
  const view = document.getElementById("history-view");
  if (!rail || !view) return;

  function selectEra(id) {
    const era = HISTORY_ERAS.find((x) => x.id === id) || HISTORY_ERAS[0];
    for (const btn of rail.querySelectorAll("button[data-era]")) {
      const on = btn.dataset.era === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
    view.innerHTML = `
      <div class="history-plate">${era.svg}</div>
      <div class="history-copy">
        <span class="history-year">${era.year}</span>
        <h3 class="history-who">${era.who}</h3>
        <p class="history-work">${era.work} <span class="history-work-en">${era.workEn}</span></p>
        <p class="history-summary">${era.summary}</p>
        <p class="history-takeaway">${era.takeaway}</p>
      </div>
    `;
  }

  rail.innerHTML = HISTORY_ERAS.map(
    (e, i) => `
    <button type="button" class="era-btn" data-era="${e.id}" aria-pressed="${i === 0 ? "true" : "false"}">
      <span class="era-y">${e.year}</span>
      <span class="era-n">${e.who.split("（")[0].split(" &")[0]}</span>
    </button>
  `
  ).join("");

  rail.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-era]");
    if (btn) selectEra(btn.dataset.era);
  });

  selectEra("1858");
}

// ---------------------------------------------------------------------------
// 05 适用场景与失效边界：4 份真实需求简报「用放射 / 换系统」分诊翻卡
// ---------------------------------------------------------------------------
const TRIAGE_CASES = [
  {
    id: "festival",
    tag: "简报 01",
    brief: "独立电子音乐节主海报：居中是音乐节名称与日期，外围只需放 8 支参演乐队短名。",
    correct: "use",
    why: "最对口！强单一核心 + 8 项等权短词 + 需要强烈声浪爆发感，正是放射系统的黄金主场。",
  },
  {
    id: "report",
    tag: "简报 02",
    brief: "上市公司 2400 字年度财报附注与风险提示，要求投资者逐段对照数字核验。",
    correct: "avoid",
    why: "千万别用放射！长段落连续阅读需要稳定的水平回扫基准线，改用严格的网格排布更稳妥。",
    linkId: "172",
    linkName: "172 网格系统",
  },
  {
    id: "pieui",
    tag: "简报 03",
    brief: "三维建模软件的鼠标右键快捷菜单：围绕光标弹出 8 个高频建模命令（挤出/倒角/镜像等）。",
    correct: "use",
    why: "极适合！用户手眼停在当前光标点，8 扇区等距展开可借费茨定律和方向记忆瞬间触发。",
  },
  {
    id: "sop",
    tag: "简报 04",
    brief: "16 步医疗设备现场安装顺序指南，必须严格按第 1 步到第 16 步先后操作、绝不能跳步。",
    correct: "avoid",
    why: "别用放射！一方面 16 步超过放射舒适密度，另一方面环形发散会削弱「起点到终点」的严格先后顺序，建议转用清晰单轴或模块分步。",
    linkId: "168",
    linkName: "168 轴线系统",
  },
];

export function initTriageSection() {
  const wrap = document.getElementById("triage-grid");
  if (!wrap) return;

  const picked = {};

  function renderCards() {
    wrap.innerHTML = TRIAGE_CASES.map((c) => {
      const ans = picked[c.id];
      const ok = ans && ans === c.correct;
      const linkHtml = c.linkId
        ? ` 推荐转向 <a href="https://layout.xiaoxiaodong.ai/${c.linkId}/play/" target="_blank" rel="noopener">${c.linkName}</a>。`
        : "";
      return `
        <article class="triage-card ${ans ? (ok ? "is-right" : "is-wrong") : ""}">
          <span class="triage-tag">${c.tag}</span>
          <p class="triage-brief">${c.brief}</p>
          <div class="triage-actions">
            <button type="button" class="triage-btn ${ans === "use" ? "is-chosen" : ""}" data-cid="${c.id}" data-pick="use" aria-pressed="${ans === "use"}">用放射系统</button>
            <button type="button" class="triage-btn ${ans === "avoid" ? "is-chosen" : ""}" data-cid="${c.id}" data-pick="avoid" aria-pressed="${ans === "avoid"}">别用，换系统</button>
          </div>
          ${ans ? `<p class="triage-feedback"><strong>${ok ? "判断准确" : "换个角度看"}：</strong>${c.why}${linkHtml}</p>` : ""}
        </article>
      `;
    }).join("");
  }

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cid]");
    if (!btn) return;
    picked[btn.dataset.cid] = btn.dataset.pick;
    renderCards();
  });

  renderCards();
}

// ---------------------------------------------------------------------------
// 06 眼力小测：两道严格单变量四选一（零剧透标签，只标 方案 A/B/C/D）
// ---------------------------------------------------------------------------
function miniRadialSvg({ angles, reaches, hubR = 24, autoFlip = true, offCenter = false, equalWeight = false }) {
  const cx = 110;
  const cy = 92;
  const R = 74;
  const labels = ["清晨", "市集", "地铁", "江风", "书店", "夜市", "霓虹", "钟声"];
  const cols = ["#25CFE8", "#25CFE8", "#F064A0", "#25CFE8", "#F064A0", "#25CFE8", "#F1DDB4", "#F064A0"];
  const spokesSvg = angles
    .map((deg, i) => {
      const a = deg * DEG;
      const r1 = R * reaches[i];
      const tanOff = offCenter && i % 2 === 0 ? 18 : 0;
      const tx = -Math.sin(a) * tanOff;
      const ty = Math.cos(a) * tanOff;
      const x0 = cx + Math.cos(a) * hubR + tx * 0.7;
      const y0 = cy + Math.sin(a) * hubR + ty * 0.7;
      const x1 = cx + Math.cos(a) * r1 + tx * 0.2;
      const y1 = cy + Math.sin(a) * r1 + ty * 0.2;
      const col = equalWeight ? "#F064A0" : cols[i % cols.length];
      const sw = equalWeight ? 2.5 : i % 2 === 0 ? 2.3 : 1.25;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const isLeft = Math.cos(a) < -0.06;
      const rot = autoFlip && isLeft ? deg + 180 : deg;
      return `
        <line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>
        <circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="${equalWeight ? 4.2 : i % 2 === 0 ? 4 : 2.8}" fill="${col}"/>
        <text x="${mx.toFixed(1)}" y="${(my - 4).toFixed(1)}" text-anchor="middle" fill="#E8F1FA" font-size="${equalWeight ? 10 : i % 2 === 0 ? 10 : 8.5}" font-family="Noto Sans SC, sans-serif" transform="rotate(${rot.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)})">${labels[i % labels.length]}</text>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 220 184" aria-hidden="true">
    <rect width="220" height="184" rx="8" fill="#030D22"/>
    <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#010A1E" stroke="#25CFE8" stroke-dasharray="2.5 3.5" stroke-width="1.3"/>
    ${spokesSvg}
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#F1DDB4" font-size="13" font-weight="900" font-family="Noto Sans SC, sans-serif">声景图</text>
  </svg>`;
}

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    prompt: "第 1 题（变量：极角分布与射线节奏）：四张「城市声景」放射海报字数、配色和翻正基线完全相同，哪一张既守住圆心焦点，又具备均衡与节奏？",
    correct: "B",
    options: [
      {
        key: "A",
        svg: miniRadialSvg({
          angles: [-40, -16, 8, 32, 56, 80, 104, 128],
          reaches: [0.9, 0.72, 0.9, 0.72, 0.9, 0.72, 0.9, 0.72],
        }),
        explain: "方案 A 把 8 条射线全堆在右下半圆（约 168° 扇区），左上方大片塌空，重心严重偏离圆心。",
      },
      {
        key: "B",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.92, 0.7, 0.92, 0.7, 0.92, 0.7, 0.92, 0.7],
        }),
        explain: "答对了！方案 B 在 360° 上均衡展开，同时用长短粗细 4+4 交替建立主次节奏，中心清距适中、一眼锁焦。",
      },
      {
        key: "C",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88],
          equalWeight: true,
        }),
        explain: "方案 C 虽然 360° 均分，但 8 条射线完全等长、等粗、同强色，所有要素同时呐喊，缺乏主次层次与韵律。",
      },
      {
        key: "D",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.9, 0.72, 0.9, 0.72, 0.9, 0.72, 0.9, 0.72],
          hubR: 12,
        }),
        explain: "方案 D 的内圈清距过小，射线与文字起点直接压进中央「声景图」大字上，核心喘不过气。",
      },
    ],
  },
  {
    id: "q2",
    prompt: "第 2 题（变量：基线方向、向心指向与内圈清距）：四张 8 等分放射图角度完全一致，哪一张在实际阅读与向心引导上没有硬伤？",
    correct: "A",
    options: [
      {
        key: "A",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.92, 0.74, 0.92, 0.74, 0.92, 0.74, 0.92, 0.74],
          hubR: 25,
          autoFlip: true,
          offCenter: false,
        }),
        explain: "答对了！方案 A 所有射线精准交汇圆心，左半圆文字自动翻正顺读，内圈清距恰到好处。",
      },
      {
        key: "B",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.92, 0.74, 0.92, 0.74, 0.92, 0.74, 0.92, 0.74],
          hubR: 25,
          autoFlip: false,
        }),
        explain: "方案 B 忽略了左半圆基线翻正，「书店 / 夜市 / 霓虹」全部头朝下倒立，逼着读者拧脖子读字。",
      },
      {
        key: "C",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.92, 0.74, 0.92, 0.74, 0.92, 0.74, 0.92, 0.74],
          hubR: 25,
          autoFlip: true,
          offCenter: true,
        }),
        explain: "方案 C 有多条射线沿切线偏离圆心，延长线不再汇聚到同一焦点，向心引力散掉了一半。",
      },
      {
        key: "D",
        svg: miniRadialSvg({
          angles: [-90, -45, 0, 45, 90, 135, 180, -135],
          reaches: [0.98, 0.9, 0.98, 0.9, 0.98, 0.9, 0.98, 0.9],
          hubR: 54,
          autoFlip: true,
        }),
        explain: "方案 D 内圈撑得过大，圆心孤悬在空旷大圆里，射线被硬生生挤到最外缘贴边。",
      },
    ],
  },
];

export function initQuizSection() {
  const wrap = document.getElementById("quiz-wrap");
  if (!wrap) return;

  let qIdx = 0;
  const answers = {};

  function render() {
    const q = QUIZ_QUESTIONS[qIdx];
    const picked = answers[q.id];
    const score = QUIZ_QUESTIONS.filter((item) => answers[item.id] === item.correct).length;
    const chosenObj = q.options.find((o) => o.key === picked);

    wrap.innerHTML = `
      <div class="quiz-top">
        <div class="quiz-tabs" role="tablist" aria-label="选择题号">
          ${QUIZ_QUESTIONS.map(
            (item, i) => `
            <button type="button" class="quiz-tab ${i === qIdx ? "is-active" : ""}" data-qidx="${i}" aria-pressed="${i === qIdx}">
              第 ${i + 1} 题 ${answers[item.id] ? (answers[item.id] === item.correct ? "✓" : "×") : ""}
            </button>
          `
          ).join("")}
        </div>
        <div class="quiz-score">当前答对 ${score} / ${QUIZ_QUESTIONS.length}</div>
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-grid">
        ${q.options
          .map((opt) => {
            const isChosen = picked === opt.key;
            const isCorrect = picked && opt.key === q.correct;
            const stateCls = isChosen ? (opt.key === q.correct ? "is-correct" : "is-wrong") : isCorrect ? "is-reveal" : "";
            return `
              <button type="button" class="quiz-opt ${stateCls}" data-opt="${opt.key}" aria-pressed="${isChosen}">
                <div class="quiz-thumb">${opt.svg}</div>
                <span class="quiz-opt-label">方案 ${opt.key}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="quiz-result ${picked ? (picked === q.correct ? "is-ok" : "is-bad") : ""}" aria-live="polite">
        ${
          chosenObj
            ? `<strong>${picked === q.correct ? "选对了" : `你选了方案 ${picked}，正确是方案 ${q.correct}`}：</strong>${chosenObj.explain}`
            : "点击上方 A / B / C / D 任意一张样稿，查看唯一差异与原理解析。"
        }
      </div>
    `;
  }

  wrap.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-qidx]");
    if (tab) {
      qIdx = Number(tab.dataset.qidx);
      render();
      return;
    }
    const opt = e.target.closest("[data-opt]");
    if (opt) {
      answers[QUIZ_QUESTIONS[qIdx].id] = opt.dataset.opt;
      render();
    }
  });

  render();
}

// ---------------------------------------------------------------------------
// 07 原海报灯箱（点击放大、滚轮/按钮缩放、拖曳平移且 draggable="false"、Esc 关闭）
// ---------------------------------------------------------------------------
export function initPosterLightbox() {
  const trigger = document.getElementById("poster-open-btn");
  const thumb = document.getElementById("poster");
  const modal = document.getElementById("poster-modal");
  const img = document.getElementById("poster-modal-img");
  const stage = document.getElementById("poster-modal-stage");
  const closeBtn = document.getElementById("poster-close-btn");
  const zoomInBtn = document.getElementById("poster-zoom-in");
  const zoomOutBtn = document.getElementById("poster-zoom-out");
  const zoomResetBtn = document.getElementById("poster-zoom-reset");
  const zoomOutLabel = document.getElementById("poster-zoom-val");
  if (!trigger || !thumb || !modal || !img || !stage) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    zoomOutLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function openModal() {
    img.src = thumb.currentSrc || thumb.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
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
  zoomResetBtn.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      scale = Math.max(0.8, Math.min(3.2, +(scale + delta).toFixed(2)));
      if (scale <= 1) {
        tx = 0;
        ty = 0;
      }
      applyTransform();
    },
    { passive: false }
  );

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== img) return;
    stage.setPointerCapture?.(e.pointerId);
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
    img.style.cursor = "grabbing";
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    tx = drag.ox + (e.clientX - drag.sx);
    ty = drag.oy + (e.clientY - drag.sy);
    applyTransform();
  });
  const stopDrag = () => {
    drag = null;
    img.style.cursor = "grab";
  };
  stage.addEventListener("pointerup", stopDrag);
  stage.addEventListener("pointercancel", stopDrag);
}
