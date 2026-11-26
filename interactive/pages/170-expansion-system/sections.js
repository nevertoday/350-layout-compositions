// 170 扩张系统 · 正文七节独立交互模块（每节控件互不重样）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { computeGrowthExponent, measureArcString, QUIZ_OPTIONS } from "./model.js";

// =========================================================================
// 01 节：圈层怎么扩才不乱（扩张指数 p + 同心剖面 + r² 面积占比实测条）
// =========================================================================
export function initSec01Growth() {
  const canvas = document.getElementById("sec01-canvas");
  const slider = document.getElementById("sec01-exp");
  const valEl = document.getElementById("sec01-exp-val");
  const barsEl = document.getElementById("sec01-bars");
  const verdictEl = document.getElementById("sec01-verdict");
  const presets = [...document.querySelectorAll("[data-exp-preset]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  const ringColors = ["#9C1C45", "#B54457", "#8B6C12", "#4F5A05"];
  const ringNames = ["第 1 环·扩散", "第 2 环·外延", "第 3 环·增长", "第 4 环·覆盖"];

  let p = parseFloat(slider.value) || 1.28;

  function render() {
    const data = computeGrowthExponent(p, 4, 0.20);
    valEl.textContent = `p = ${p.toFixed(2)}`;
    verdictEl.textContent = data.verdict;

    presets.forEach((b) => {
      const target = parseFloat(b.dataset.expPreset);
      b.classList.toggle("is-active", Math.abs(target - p) < 0.04);
      b.setAttribute("aria-pressed", String(Math.abs(target - p) < 0.04));
    });

    // 右侧面积与周长占比条
    barsEl.innerHTML = data.rings
      .map(
        (r, idx) => `
      <div class="area-bar-row">
        <div class="area-bar-meta">
          <span class="area-bar-name"><i class="dot-swatch" style="background:${ringColors[idx]}"></i>${ringNames[idx]}</span>
          <span class="mono area-bar-num">面积 ${r.areaShare.toFixed(1)}% · 环宽 ${(r.width * 100).toFixed(0)}% · 周长 ${r.circumferenceRatio.toFixed(1)}×核</span>
        </div>
        <div class="area-bar-track">
          <div class="area-bar-fill" style="width:${Math.min(100, r.areaShare * 1.45).toFixed(1)}%;background:${ringColors[idx]}"></div>
        </div>
      </div>`
      )
      .join("");

    // 左侧真实等比同心环剖面图
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width));
    const h = Math.max(240, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.455;
    const R = Math.min(w, h) * 0.39;

    // 外圈到内圈填充半透色带，直观展示外环面积随 r² 暴涨
    for (let i = data.rings.length - 1; i >= 0; i--) {
      const ring = data.rings[i];
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r * R, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "rgba(156, 28, 69, 0.10)" : "rgba(79, 90, 5, 0.09)";
      ctx.fill();
      ctx.lineWidth = i === data.rings.length - 1 ? 1.8 : 1.3;
      ctx.setLineDash(i === data.rings.length - 1 ? [3, 4] : []);
      ctx.strokeStyle = ringColors[i];
      ctx.stroke();
      ctx.setLineDash([]);

      // 在右侧水平剖线标出实测环宽
      const midR = ((ring.prevR + ring.r) * 0.5) * R;
      ctx.fillStyle = ringColors[i];
      ctx.font = `600 11px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if ((ring.r - ring.prevR) * R >= 14) {
        ctx.fillText(`R${ring.index}`, cx, cy - midR);
      }
    }

    // 中心内核
    ctx.beginPath();
    ctx.arc(cx, cy, data.coreRatio * R, 0, Math.PI * 2);
    ctx.fillStyle = "#BFBC15";
    ctx.fill();
    ctx.strokeStyle = "#230E21";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#230E21";
    ctx.font = `800 12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("核心", cx, cy);

    // 水平标尺线标示面积倍率差（稳居底部安全区内）
    const footY = Math.min(h - 14, cy + R + 22);
    ctx.strokeStyle = "rgba(35, 14, 33, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.65, footY - 11);
    ctx.lineTo(cx + R * 0.65, footY - 11);
    ctx.stroke();
    ctx.fillStyle = "#230E21";
    ctx.font = `600 11.5px "IBM Plex Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`外环 / 首环面积比 ${data.outerToInnerArea.toFixed(1)}×`, cx, footY);
  }

  slider.addEventListener("input", () => {
    p = parseFloat(slider.value);
    render();
  });
  presets.forEach((b) => {
    b.addEventListener("click", () => {
      p = parseFloat(b.dataset.expPreset);
      slider.value = String(p);
      render();
    });
  });
  window.addEventListener("resize", render);
  render();
}

// =========================================================================
// 02 节：弧上排字的四道暗礁（单句活体弧字显微校验仪）
// =========================================================================
export function initSec02ArcLab() {
  const canvas = document.getElementById("sec02-canvas");
  const radiusInput = document.getElementById("sec02-radius");
  const trackInput = document.getElementById("sec02-track");
  const flipBtn = document.getElementById("sec02-flip");
  const wedgeBtn = document.getElementById("sec02-wedge");
  const radiusVal = document.getElementById("sec02-radius-val");
  const trackVal = document.getElementById("sec02-track-val");
  const readoutEl = document.getElementById("sec02-readout");
  const phraseBtns = [...document.querySelectorAll("[data-arc-phrase]")];
  if (!canvas || !radiusInput) return;

  const ctx = canvas.getContext("2d");
  const PHRASES = {
    short: { top: "由内而外 · EXPAND", bottom: "分层递进与边界外延" },
    long: { top: "从核心出发向外扩散通过外延与层级增长扩大影响范围", bottom: "突破固有限制建立节点连接增强整体效能" },
    en: { top: "EXPANSION SYSTEM · 170", bottom: "CONCENTRIC HIERARCHY & GROWTH" },
  };

  let phraseKey = "short";
  let radiusPx = parseInt(radiusInput.value, 10) || 74;
  let trackPx = parseFloat(trackInput.value) || 0;
  let bottomFlip = false;
  let showWedge = true;

  function drawSampleArc(text, cx, cy, r, centerA, isBot, flipped, fontSize, color) {
    ctx.save();
    ctx.font = `700 ${fontSize}px "Noto Sans SC", "Unbounded", sans-serif`;
    const chars = [...text];
    const ws = chars.map((ch) => ctx.measureText(ch).width + trackPx);
    const totalW = ws.reduce((a, b) => a + b, 0);
    const totalAngle = totalW / r;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let angle = isBot && flipped ? centerA + totalAngle / 2 : centerA - totalAngle / 2;
    const dir = isBot && flipped ? -1 : 1;

    for (let i = 0; i < chars.length; i++) {
      const half = ws[i] / (2 * r);
      angle += dir * half;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      // 楔形夹角线（直观显示小半径时顶部裂开、底部挤压的物理形变）
      if (showWedge && i % 2 === 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(156, 28, 69, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * Math.max(12, r - 18), cy + Math.sin(angle) * Math.max(12, r - 18));
        ctx.lineTo(cx + Math.cos(angle) * (r + 18), cy + Math.sin(angle) * (r + 18));
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(isBot && flipped ? angle - Math.PI / 2 : angle + Math.PI / 2);
      ctx.fillStyle = color;
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
      angle += dir * half;
    }
    ctx.restore();
    return { totalAngleDeg: (totalAngle * 180) / Math.PI, degPerChar: ((totalAngle * 180) / Math.PI) / Math.max(1, chars.length) };
  }

  function render() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(270, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.min(w, h) * 0.42;
    const r = Math.min(maxR, Math.max(46, (radiusPx / 140) * maxR));
    const phrase = PHRASES[phraseKey];
    const fontSize = Math.max(12, Math.min(15, w * 0.028));

    // 底圆基准轨
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(35, 14, 33, 0.22)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // 12 点锚起标记
    ctx.beginPath();
    ctx.arc(cx, cy - r - 12, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#4F5A05";
    ctx.fill();

    // 中心核点
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#BFBC15";
    ctx.fill();
    ctx.fillStyle = "#230E21";
    ctx.font = `700 11px "IBM Plex Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`r=${radiusPx}`, cx, cy);

    const topStats = drawSampleArc(phrase.top, cx, cy, r, -Math.PI / 2, false, true, fontSize, "#230E21");
    const botStats = drawSampleArc(
      phrase.bottom,
      cx,
      cy,
      r,
      Math.PI / 2,
      true,
      bottomFlip,
      fontSize * 0.92,
      bottomFlip ? "#4F5A05" : "#9C1C45"
    );

    const overlap = topStats.totalAngleDeg + botStats.totalAngleDeg > 330;
    const steep = topStats.degPerChar > 17.5;
    radiusVal.textContent = `${radiusPx}px`;
    trackVal.textContent = `${trackPx >= 0 ? "+" : ""}${trackPx.toFixed(1)}px`;

    flipBtn.textContent = bottomFlip ? "下弧翻正：已开启" : "下弧翻正：关（倒立）";
    flipBtn.classList.toggle("is-active", bottomFlip);
    flipBtn.setAttribute("aria-pressed", String(bottomFlip));

    wedgeBtn.textContent = showWedge ? "字角切线：显" : "字角切线：隐";
    wedgeBtn.classList.toggle("is-active", showWedge);
    wedgeBtn.setAttribute("aria-pressed", String(showWedge));

    const issues = [];
    if (!bottomFlip) issues.push("下半圈头朝下倒立，需开启翻正");
    if (overlap) issues.push(`上下弧总跨角 ${Math.round(topStats.totalAngleDeg + botStats.totalAngleDeg)}° 已首尾撞车`);
    if (steep) issues.push(`单字偏转 ${topStats.degPerChar.toFixed(1)}°/字，字顶裂开字底挤撞`);
    if (trackPx < 0.5 && radiusPx < 90) issues.push("小半径未补正字距，底部偏挤");

    readoutEl.innerHTML = issues.length
      ? `<span class="tag-warn">检测到 ${issues.length} 处暗礁</span> ${issues.join("；")}。`
      : `<span class="tag-ok">弧字顺畅可读</span> 单字转角 ${topStats.degPerChar.toFixed(1)}°/字、上下总跨角 ${Math.round(topStats.totalAngleDeg + botStats.totalAngleDeg)}°，下弧自左向右顺读。`;
  }

  radiusInput.addEventListener("input", () => {
    radiusPx = parseInt(radiusInput.value, 10);
    render();
  });
  trackInput.addEventListener("input", () => {
    trackPx = parseFloat(trackInput.value);
    render();
  });
  flipBtn.addEventListener("click", () => {
    bottomFlip = !bottomFlip;
    render();
  });
  wedgeBtn.addEventListener("click", () => {
    showWedge = !showWedge;
    render();
  });
  phraseBtns.forEach((b) => {
    b.addEventListener("click", () => {
      phraseKey = b.dataset.arcPhrase;
      phraseBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });
  window.addEventListener("resize", render);
  render();
}

// =========================================================================
// 03 节：它从哪里来（4 代历史标本时间轴胶片条 + 动态矢量骨架图）
// =========================================================================
export function initSec03History() {
  const btns = [...document.querySelectorAll("[data-hist-id]")];
  const svg = document.getElementById("sec03-svg");
  const titleEl = document.getElementById("sec03-title");
  const yearEl = document.getElementById("sec03-year");
  const bodyEl = document.getElementById("sec03-body");
  const noteEl = document.getElementById("sec03-note");
  if (!btns.length || !svg) return;

  const ITEMS = {
    howard: {
      year: "1898 / 1902 · 城市规划图解",
      title: "埃比尼泽·霍华德《明日的田园城市》",
      body: "1898 年首版《明日：一条通向真正改革的和平之路》（1902 年改名《Garden Cities of To-morrow》）用一张极著名的同心环图解说明城市如何有节制地向外扩张：中央公园与市政建筑居核，向外依次排开水晶宫商业长廊、林荫居住环、环形货运铁道，最外层用永久农业绿带锁住无序蔓延。",
      note: "启发：霍华德特地在图上注明「仅为示意图（A Diagram Only）」——扩张系统最宝贵的不是无限膨大，而是给每一圈定下明确的功能边界。",
      svg: `
        <circle cx="160" cy="140" r="118" fill="none" stroke="#DCE13E" stroke-width="10" stroke-opacity="0.22"/>
        <circle cx="160" cy="140" r="118" fill="none" stroke="#DCE13E" stroke-width="1.4" stroke-dasharray="4 4"/>
        <circle cx="160" cy="140" r="94" fill="none" stroke="#F2BAA8" stroke-width="1.5"/>
        <circle cx="160" cy="140" r="70" fill="none" stroke="#E4D36A" stroke-width="1.3" stroke-dasharray="6 3"/>
        <circle cx="160" cy="140" r="46" fill="none" stroke="#F2BAA8" stroke-width="1.4"/>
        <circle cx="160" cy="140" r="22" fill="#BFBC15"/>
        <g stroke="#F2BAA8" stroke-opacity="0.45" stroke-width="1">
          <line x1="160" y1="22" x2="160" y2="258"/><line x1="58" y1="81" x2="262" y2="199"/><line x1="262" y1="81" x2="58" y2="199"/>
        </g>
        <text x="160" y="144" text-anchor="middle" fill="#230E21" font-size="11" font-weight="800">公园</text>
        <text x="160" y="106" text-anchor="middle" fill="#FBECE8" font-size="10">水晶廊</text>
        <text x="160" y="81" text-anchor="middle" fill="#FBECE8" font-size="10">林荫大道</text>
        <text x="160" y="57" text-anchor="middle" fill="#F2BAA8" font-size="10">铁道环</text>
        <text x="160" y="34" text-anchor="middle" fill="#DCE13E" font-size="10">永久农业绿带</text>
      `,
    },
    avantgarde: {
      year: "1913 & 1926 · 现代抽象视觉语法",
      title: "德劳内《同时对比》与康定斯基《几个圆》",
      body: "1913 年法国画家罗伯特·德劳内在《同时对比：日与月》（现藏纽约 MoMA）里用层层套叠的彩色同心圆盘制造光学脉动；1926 年瓦西里·康定斯基在包豪斯任教期间创作《几个圆》（现藏纽约古根海姆博物馆），以深色宇宙底衬托大小不一的圆环与光晕，指出圆形把向心与离心这对矛盾统一在平衡之中。",
      note: "启发：170 原海报的深李紫暗底与层叠紫晕圆盘，正是这套「暗场发光圆环」视觉谱系的当代延续。",
      svg: `
        <circle cx="145" cy="140" r="96" fill="#5F2E52" fill-opacity="0.42" stroke="#F2BAA8" stroke-width="1.2"/>
        <circle cx="145" cy="140" r="64" fill="#3C1B38" stroke="#E4D36A" stroke-width="1.5"/>
        <circle cx="145" cy="140" r="34" fill="#BFBC15" fill-opacity="0.9"/>
        <circle cx="232" cy="88" r="34" fill="none" stroke="#DCE13E" stroke-width="1.6"/>
        <circle cx="232" cy="88" r="18" fill="#F2BAA8" fill-opacity="0.82"/>
        <circle cx="236" cy="196" r="24" fill="none" stroke="#F2BAA8" stroke-dasharray="3 3" stroke-width="1.3"/>
        <circle cx="236" cy="196" r="10" fill="#E4D36A"/>
        <circle cx="72" cy="84" r="16" fill="#9C1C45" fill-opacity="0.8" stroke="#F2BAA8" stroke-width="1"/>
        <text x="160" y="264" text-anchor="middle" fill="#E4D36A" font-size="11">同心与偏心圆盘的向心 / 离心张力</text>
      `,
    },
    sunburst: {
      year: "2000 · 信息可视化经典论文",
      title: "斯塔斯科与张：旭日图（Sunburst）径向层级",
      body: "2000 年 IEEE InfoVis 会议上，约翰·斯塔斯科（John Stasko）与尤金·张（Eugene Zhang）系统研究了径向空间填充层级图（即今天常用的旭日图）：根目录位于圆心，子层级一圈圈向外扩展。他们同时指出了扩张结构最现实的短板——层级越深，外圈扇片越窄小难读，因此需要交互式焦点展开。",
      note: "启发：当数据超过 4–5 层时，静态海报式的同心扩张就会到达视觉极限，数字产品才靠点击缩放化解。",
      svg: `
        <circle cx="160" cy="140" r="24" fill="#BFBC15"/>
        <path d="M160 116 A24 24 0 0 1 184 140 L214 140 A54 54 0 0 0 160 86 Z" fill="#F2BAA8" fill-opacity="0.78" stroke="#280F25" stroke-width="1.5"/>
        <path d="M184 140 A24 24 0 0 1 160 164 L160 194 A54 54 0 0 0 214 140 Z" fill="#E4D36A" fill-opacity="0.62" stroke="#280F25" stroke-width="1.5"/>
        <path d="M160 164 A24 24 0 1 1 160 116 L160 86 A54 54 0 1 0 160 194 Z" fill="#5F2E52" stroke="#F2BAA8" stroke-width="1"/>
        <path d="M160 86 A54 54 0 0 1 198 102 L222 78 A88 88 0 0 0 160 52 Z" fill="#DCE13E" fill-opacity="0.88" stroke="#280F25" stroke-width="1.5"/>
        <path d="M198 102 A54 54 0 0 1 214 140 L248 140 A88 88 0 0 0 222 78 Z" fill="#F2BAA8" fill-opacity="0.48" stroke="#280F25" stroke-width="1.5"/>
        <circle cx="160" cy="140" r="112" fill="none" stroke="#E4D36A" stroke-dasharray="3 5" stroke-width="1.2"/>
        <text x="160" y="144" text-anchor="middle" fill="#230E21" font-size="11" font-weight="800">ROOT</text>
        <text x="208" y="64" text-anchor="middle" fill="#DCE13E" font-size="10">焦点扇区放大</text>
        <text x="160" y="266" text-anchor="middle" fill="#F2BAA8" font-size="11">IEEE InfoVis 2000 · Focus+Context</text>
      `,
    },
    elam: {
      year: "2007 · 字体组织八大系统定名",
      title: "金伯利·伊拉姆《Typographic Systems》",
      body: "2007 年平面设计教育家金伯利·伊拉姆（Kimberly Elam）由普林斯顿建筑出版社出版《Typographic Systems》，把跳出传统方格的版面整理成 8 套字体组织系统：轴线、放射、扩张（Dilatational）、随机、网格、模块、过渡、双边。她把扩张系统比作投石入水激起的涟漪与眼球虹膜——文字顺着一圈圈扩开的同心弧排布，既可以是完整正圆，也可以把圆心推到画幅角落做局部宏大弧线。",
      note: "启发：这也是 350 排版里 168–175 八张连续海报共同的理论源头。",
      svg: `
        <g fill="none" stroke="#F2BAA8" stroke-opacity="0.5">
          <circle cx="160" cy="140" r="36"/><circle cx="160" cy="140" r="64"/><circle cx="160" cy="140" r="92"/><circle cx="160" cy="140" r="116" stroke-dasharray="2 5" stroke="#DCE13E"/>
        </g>
        <circle cx="160" cy="140" r="18" fill="#BFBC15"/>
        <path id="elamArc1" d="M 108 140 A 52 52 0 0 1 212 140" fill="none"/>
        <path id="elamArc2" d="M 80 140 A 80 80 0 0 1 240 140" fill="none"/>
        <text fill="#FBECE8" font-size="11" font-weight="700" letter-spacing="2">
          <textPath href="#elamArc1" startOffset="50%" text-anchor="middle">DILATATIONAL</textPath>
        </text>
        <text fill="#DCE13E" font-size="11" font-weight="700" letter-spacing="2">
          <textPath href="#elamArc2" startOffset="50%" text-anchor="middle">TYPOGRAPHIC SYSTEMS · 2007</textPath>
        </text>
        <text x="160" y="266" text-anchor="middle" fill="#F2BAA8" font-size="11">文字随同心圆弧逐圈向外扩张</text>
      `,
    },
  };

  function select(id) {
    const item = ITEMS[id] || ITEMS.elam;
    yearEl.textContent = item.year;
    titleEl.textContent = item.title;
    bodyEl.textContent = item.body;
    noteEl.textContent = item.note;
    svg.innerHTML = item.svg;
    btns.forEach((b) => {
      const on = b.dataset.histId === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.histId)));
  select("elam");
}

// =========================================================================
// 04 节：扩张与放射：八系辨析（同内容三形态对比 + 视线轨迹动态重放）
// =========================================================================
export function initSec04Compare() {
  const canvas = document.getElementById("sec04-canvas");
  const modeBtns = [...document.querySelectorAll("[data-cmp-mode]")];
  const replayBtn = document.getElementById("sec04-replay");
  const titleEl = document.getElementById("sec04-title");
  const descEl = document.getElementById("sec04-desc");
  if (!canvas || !modeBtns.length) return;

  const ctx = canvas.getContext("2d");
  const MODES = {
    expansion: {
      title: "170 扩张系统：沿环周分层漫游",
      desc: "同一套「秋日咖啡节」信息被拆成 3 个同心圈层：先定睛中央主标，再顺第一环读时间地点，第二环读主理人烘焙坊，外环读周边市集。眼睛是绕圈逐级向外「剥洋葱」，最擅长表达核心到生态的包含关系。",
    },
    radial: {
      title: "169 放射系统：沿直线射线向外弹跳",
      desc: "换成放射系统后，文字不再绕圈，而是像车轮辐条一样从圆心笔直射向四周。视觉爆发力更强、速度更快，但条目之间变成并列平级，失去了「内圈包外圈」的层级隶属感。",
    },
    cropped: {
      title: "进阶变体：偏心裁切扩张（突破四角浪费）",
      desc: "金伯利·伊拉姆特别推荐的一招：把同心圆心推到画幅左下角外，只截取舒展的四分之一宏大弧带。这样既保住了由内而外的扩张节奏，又彻底消灭了方形页面四个角落的大片死白。",
    },
  };

  let mode = "expansion";
  let scanT = reducedMotion.matches ? 1 : 0;
  let dirty04 = true;
  let bgDirty04 = true;
  let w04 = 320;
  let h04 = 260;
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  function syncSize04() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width));
    const h = Math.max(250, Math.round(rect.height));
    const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      bgCanvas.width = pw;
      bgCanvas.height = ph;
      w04 = w;
      h04 = h;
      dirty04 = true;
      bgDirty04 = true;
    }
  }

  function drawArcSimple(targetCtx, text, cx, cy, r, aCenter, fontSize, color) {
    targetCtx.save();
    targetCtx.font = `700 ${fontSize}px "Noto Sans SC", sans-serif`;
    targetCtx.fillStyle = color;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";
    const chars = [...text];
    const ws = chars.map((c) => targetCtx.measureText(c).width + 2);
    const total = ws.reduce((a, b) => a + b, 0);
    let ang = aCenter - total / (2 * r);
    for (let i = 0; i < chars.length; i++) {
      const half = ws[i] / (2 * r);
      ang += half;
      targetCtx.save();
      targetCtx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      targetCtx.rotate(ang + Math.PI / 2);
      targetCtx.fillText(chars[i], 0, 0);
      targetCtx.restore();
      ang += half;
    }
    targetCtx.restore();
  }

  function rebuildBg04(dpr, w, h) {
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.fillStyle = "#280F25";
    bgCtx.fillRect(0, 0, w, h);

    if (mode === "expansion") {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.43;
      const rs = [R * 0.30, R * 0.56, R * 0.80, R * 1.0];
      rs.forEach((r, idx) => {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, r, 0, Math.PI * 2);
        if (idx === 0) {
          bgCtx.fillStyle = "#BFBC15";
          bgCtx.fill();
        } else {
          bgCtx.strokeStyle = idx === 3 ? "#DCE13E" : "rgba(242, 186, 168, 0.65)";
          bgCtx.setLineDash(idx === 3 ? [3, 5] : []);
          bgCtx.lineWidth = 1.4;
          bgCtx.stroke();
          bgCtx.setLineDash([]);
        }
      });
      bgCtx.fillStyle = "#230E21";
      bgCtx.font = `900 13px "Noto Sans SC", sans-serif`;
      bgCtx.textAlign = "center";
      bgCtx.textBaseline = "middle";
      bgCtx.fillText("秋日咖啡", cx, cy);

      drawArcSimple(bgCtx, "10.18–20 · 滨江仓库", cx, cy, (rs[0] + rs[1]) * 0.5, -Math.PI / 2, 11.5, "#FBECE8");
      drawArcSimple(bgCtx, "手冲赛 · 32家烘焙坊", cx, cy, (rs[1] + rs[2]) * 0.5, -Math.PI / 2, 12, "#F2BAA8");
      drawArcSimple(bgCtx, "器物市集 · 爵士夜场 · 免费入场", cx, cy, (rs[2] + rs[3]) * 0.5, -Math.PI / 2, 11.5, "#DCE13E");
    } else if (mode === "radial") {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.43;
      const labels = ["10.18 滨江仓库", "手冲冠军赛", "32家烘焙坊", "器物市集", "爵士夜场", "公益杯测"];
      labels.forEach((txt, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
        bgCtx.save();
        bgCtx.strokeStyle = i % 2 === 0 ? "#DCE13E" : "#F2BAA8";
        bgCtx.lineWidth = 1.6;
        bgCtx.beginPath();
        bgCtx.moveTo(cx + Math.cos(a) * (R * 0.30), cy + Math.sin(a) * (R * 0.30));
        bgCtx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        bgCtx.stroke();

        bgCtx.translate(cx + Math.cos(a) * (R * 0.66), cy + Math.sin(a) * (R * 0.66));
        const flip = Math.cos(a) < -0.1;
        bgCtx.rotate(flip ? a + Math.PI : a);
        bgCtx.fillStyle = "#FBECE8";
        bgCtx.font = `700 11.5px "Noto Sans SC", sans-serif`;
        bgCtx.textAlign = "center";
        bgCtx.textBaseline = "bottom";
        bgCtx.fillText(txt, 0, -4);
        bgCtx.restore();
      });
      bgCtx.beginPath();
      bgCtx.arc(cx, cy, R * 0.27, 0, Math.PI * 2);
      bgCtx.fillStyle = "#BFBC15";
      bgCtx.fill();
      bgCtx.fillStyle = "#230E21";
      bgCtx.font = `900 13px "Noto Sans SC", sans-serif`;
      bgCtx.textAlign = "center";
      bgCtx.textBaseline = "middle";
      bgCtx.fillText("秋日咖啡", cx, cy);
    } else {
      const cx = w * 0.08;
      const cy = h * 0.94;
      const maxR = Math.hypot(w * 0.92, h * 0.92);
      const rs = [maxR * 0.24, maxR * 0.44, maxR * 0.66, maxR * 0.88];
      rs.forEach((r, idx) => {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, r, -Math.PI / 2, 0);
        if (idx === 0) {
          bgCtx.lineTo(cx, cy);
          bgCtx.closePath();
          bgCtx.fillStyle = "#BFBC15";
          bgCtx.fill();
        } else {
          bgCtx.strokeStyle = idx === 3 ? "#DCE13E" : "rgba(242, 186, 168, 0.72)";
          bgCtx.setLineDash(idx === 3 ? [4, 5] : []);
          bgCtx.lineWidth = 1.6;
          bgCtx.stroke();
          bgCtx.setLineDash([]);
        }
      });
      bgCtx.fillStyle = "#230E21";
      bgCtx.font = `900 14px "Noto Sans SC", sans-serif`;
      bgCtx.textAlign = "left";
      bgCtx.textBaseline = "bottom";
      bgCtx.fillText("秋日咖啡节", cx + 12, cy - 16);

      drawArcSimple(bgCtx, "10.18–20 · 滨江仓库", cx, cy, (rs[0] + rs[1]) * 0.5, -Math.PI / 4, 12.5, "#FBECE8");
      drawArcSimple(bgCtx, "手冲冠军赛 · 32家独立烘焙坊", cx, cy, (rs[1] + rs[2]) * 0.5, -Math.PI / 4, 13, "#F2BAA8");
      drawArcSimple(bgCtx, "器物市集 · 爵士夜场 · 公益杯测 · 免费预约", cx, cy, (rs[2] + rs[3]) * 0.5, -Math.PI / 4, 12.5, "#DCE13E");
    }
    bgDirty04 = false;
  }

  function frame(t, dt, { still }) {
    if (!dirty04 && (still || scanT >= 1)) return;
    const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const w = w04;
    const h = h04;
    if (bgDirty04) rebuildBg04(dpr, w, h);

    if (still) scanT = 1;
    else scanT = Math.min(1, scanT + Math.max(dt, 0.016) * 0.42);
    dirty04 = false;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 仅绘制每帧移动的 1 枚视线光珠（极大降低软件渲染开销）
    let ex, ey;
    if (mode === "expansion") {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.43;
      const eyeR = R * (0.30 + 0.70 * scanT);
      const eyeA = -Math.PI / 2 + scanT * Math.PI * 3.2;
      ex = cx + Math.cos(eyeA) * eyeR;
      ey = cy + Math.sin(eyeA) * eyeR;
    } else if (mode === "radial") {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.43;
      const count = 6;
      const rayIdx = Math.min(count - 1, Math.floor(scanT * count));
      const localP = (scanT * count) % 1;
      const a = -Math.PI / 2 + (rayIdx * Math.PI * 2) / count;
      const er = R * (0.28 + 0.7 * localP);
      ex = cx + Math.cos(a) * er;
      ey = cy + Math.sin(a) * er;
    } else {
      const cx = w * 0.08;
      const cy = h * 0.94;
      const maxR = Math.hypot(w * 0.92, h * 0.92);
      const er = maxR * (0.24 + 0.64 * scanT);
      const ea = -Math.PI * 0.44 + Math.sin(scanT * Math.PI * 3) * 0.24;
      ex = cx + Math.cos(ea) * er;
      ey = cy + Math.sin(ea) * er;
    }
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#EEF45D";
    ctx.fill();
  }

  syncSize04();
  const runner = loop(canvas, frame);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      syncSize04();
      runner.draw();
    }).observe(canvas);
  }

  function setMode(next) {
    mode = next;
    scanT = reducedMotion.matches ? 1 : 0;
    dirty04 = true;
    bgDirty04 = true;
    titleEl.textContent = MODES[next].title;
    descEl.textContent = MODES[next].desc;
    modeBtns.forEach((b) => {
      const on = b.dataset.cmpMode === next;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    runner.draw();
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.cmpMode)));
  replayBtn?.addEventListener("click", () => {
    scanT = 0;
    dirty04 = true;
    runner.draw();
  });
  setMode("expansion");
}

// =========================================================================
// 05 节：什么时候别用扩张系统（4 组真实任务决策诊断卡）
// =========================================================================
export function initSec05Avoid() {
  const cards = [...document.querySelectorAll("[data-avoid-card]")];
  cards.forEach((card) => {
    const answer = card.dataset.avoidAnswer; // "use" | "avoid"
    const resultEl = card.querySelector(".avoid-result");
    const btns = [...card.querySelectorAll("[data-avoid-pick]")];
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const pick = btn.dataset.avoidPick;
        const right = pick === answer;
        btns.forEach((x) => {
          x.classList.toggle("is-picked", x === btn);
          x.setAttribute("aria-pressed", String(x === btn));
        });
        card.dataset.judged = right ? "ok" : "warn";
        if (resultEl) {
          resultEl.hidden = false;
          const lead = resultEl.querySelector(".avoid-lead");
          if (lead) {
            lead.textContent = right ? "判断准确：" : "再想一下：";
          }
        }
      });
    });
  });
}

// =========================================================================
// 06 节：哪张环图立得住（4 方案单变量盲评小考，严格 Canvas 精绘）
// =========================================================================
export function initSec06Quiz() {
  const wrap = document.getElementById("sec06-grid");
  const feedbackEl = document.getElementById("sec06-feedback");
  if (!wrap || !feedbackEl) return;

  const cards = [...wrap.querySelectorAll("[data-quiz-id]")];
  let answeredId = null;

  function drawQuizCard(canvas, opt, revealed) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(200, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.44;
    const { rings, bottomFlip, coreWeak } = opt.config;

    ctx.fillStyle = "#260E24";
    ctx.fillRect(0, 0, w, h);

    // 若为 D 项（外圈压过内核），在外环加厚重实心环带模拟反客为主
    if (coreWeak) {
      ctx.beginPath();
      ctx.arc(cx, cy, rings[3] * R, 0, Math.PI * 2);
      ctx.arc(cx, cy, rings[2] * R, 0, Math.PI * 2, true);
      ctx.fillStyle = "rgba(220, 225, 62, 0.42)";
      ctx.fill("evenodd");
    }

    // 跨环细骨架
    ctx.save();
    ctx.strokeStyle = "rgba(242, 186, 168, 0.34)";
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (rings[0] * R), cy + Math.sin(a) * (rings[0] * R));
      ctx.lineTo(cx + Math.cos(a) * (rings[3] * R + 6), cy + Math.sin(a) * (rings[3] * R + 6));
      ctx.stroke();
    }
    ctx.restore();

    const labelsTop = ["第一场·水波共鸣", "第二场·街道回响", "第三场·夜空合成器"];
    const labelsBot = ["十月十八日", "老码头音室", "免费预约入场"];

    for (let i = 1; i < rings.length; i++) {
      const r = rings[i] * R;
      const prev = rings[i - 1] * R;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = i === rings.length - 1 ? "#DCE13E" : "rgba(242, 186, 168, 0.62)";
      ctx.setLineDash(i === rings.length - 1 ? [2, 4] : []);
      ctx.lineWidth = i === rings.length - 1 ? 1.5 : 1.1;
      ctx.stroke();
      ctx.setLineDash([]);

      // 弧字
      const tr = prev + (r - prev) * 0.54;
      const fs = Math.max(9.5, Math.min(11.5, R * 0.11));
      drawQuizArc(ctx, labelsTop[i - 1], cx, cy, tr, -Math.PI / 2, false, true, fs, "#FBECE8");
      drawQuizArc(ctx, labelsBot[i - 1], cx, cy, tr, Math.PI / 2, true, bottomFlip, fs * 0.9, "#F2BAA8");
    }

    // 内核
    const cr = rings[0] * R;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    if (coreWeak) {
      ctx.strokeStyle = "#F2BAA8";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#BFBC15";
      ctx.fill();
      ctx.fillStyle = "#230E21";
      ctx.font = `900 ${Math.max(10, Math.round(cr * 0.52))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("声景", cx, cy);
    }

    // 揭示后的评语标记
    if (revealed) {
      ctx.save();
      ctx.strokeStyle = opt.correct ? "#6CE5B1" : "#FF6B8E";
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
      ctx.restore();
    }
  }

  function drawQuizArc(ctx, text, cx, cy, r, centerA, isBot, flipped, fs, color) {
    ctx.save();
    ctx.font = `600 ${fs.toFixed(1)}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const chars = [...text];
    const ws = chars.map((c) => ctx.measureText(c).width + 1.2);
    const total = ws.reduce((a, b) => a + b, 0);
    const totalA = total / Math.max(12, r);
    let ang = isBot && flipped ? centerA + totalA / 2 : centerA - totalA / 2;
    const dir = isBot && flipped ? -1 : 1;
    for (let i = 0; i < chars.length; i++) {
      const half = ws[i] / (2 * Math.max(12, r));
      ang += dir * half;
      ctx.save();
      ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      ctx.rotate(isBot && flipped ? ang - Math.PI / 2 : ang + Math.PI / 2);
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
      ang += dir * half;
    }
    ctx.restore();
  }

  function renderAll() {
    cards.forEach((card) => {
      const opt = QUIZ_OPTIONS.find((o) => o.id === card.dataset.quizId);
      const canvas = card.querySelector("canvas");
      if (opt && canvas) drawQuizCard(canvas, opt, answeredId !== null);
    });
  }

  cards.forEach((card) => {
    const btn = card.querySelector("button.quiz-btn");
    btn?.addEventListener("click", () => {
      const id = card.dataset.quizId;
      answeredId = id;
      const opt = QUIZ_OPTIONS.find((o) => o.id === id);
      cards.forEach((c) => {
        const cid = c.dataset.quizId;
        const cOpt = QUIZ_OPTIONS.find((o) => o.id === cid);
        c.classList.toggle("is-selected", cid === id);
        c.classList.toggle("is-correct", !!cOpt?.correct);
        c.classList.toggle("is-wrong", cid === id && !cOpt?.correct);
        c.querySelector("button.quiz-btn")?.setAttribute("aria-pressed", String(cid === id));
      });
      feedbackEl.hidden = false;
      feedbackEl.className = `quiz-feedback ${opt.correct ? "is-ok" : "is-warn"}`;
      feedbackEl.innerHTML = `
        <p class="quiz-fb-head">${opt.correct ? "✓ 选对了 · 方案 B 成立" : `× 方案 ${opt.id} 有明显破绽（正确解是方案 B）`}</p>
        <p>${opt.explain}</p>
        ${!opt.correct ? `<p class="quiz-fb-sub"><strong>方案 B 为何成立：</strong>${QUIZ_OPTIONS[1].explain}</p>` : ""}
      `;
      renderAll();
    });
  });

  window.addEventListener("resize", renderAll);
  renderAll();
}

// =========================================================================
// 07 节：原海报灯箱（复用 #poster src，支持滚轮缩放、拖拽平移与 Esc 退出）
// =========================================================================
export function initSec07Lightbox() {
  const thumb = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open-btn");
  const modal = document.getElementById("poster-lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoom-in");
  const zoomOutBtn = document.getElementById("lb-zoom-out");
  const resetBtn = document.getElementById("lb-reset");
  const zoomLabel = document.getElementById("lb-zoom-label");
  if (!thumb || !modal || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let drag = null;

  function applyTransform() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function open() {
    lbImg.src = thumb.src;
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
    openBtn?.focus();
  }

  thumb.addEventListener("click", open);
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  zoomInBtn?.addEventListener("click", () => {
    scale = Math.min(3, +(scale + 0.35).toFixed(2));
    applyTransform();
  });
  zoomOutBtn?.addEventListener("click", () => {
    scale = Math.max(0.7, +(scale - 0.35).toFixed(2));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  resetBtn?.addEventListener("click", () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });

  modal.addEventListener("wheel", (e) => {
    if (modal.hidden) return;
    e.preventDefault();
    scale = Math.max(0.7, Math.min(3.2, +(scale + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)));
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    drag = { id: e.pointerId, sx: e.clientX - tx, sy: e.clientY - ty };
    try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    tx = e.clientX - drag.sx;
    ty = e.clientY - drag.sy;
    applyTransform();
  });
  lbImg.addEventListener("pointerup", () => { drag = null; });
  lbImg.addEventListener("pointercancel", () => { drag = null; });
}
