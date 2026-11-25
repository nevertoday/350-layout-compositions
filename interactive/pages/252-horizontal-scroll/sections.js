// 252 横向卷轴 · 正文 01–07 节独立互动与原海报灯箱
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import { clamp, PALETTE } from "./model.js";

// ==================== 01 节：SVG 视窗幕帘切刀三态对照 ====================
function initSection01() {
  const svg = document.getElementById("s1-svg");
  const cap = document.getElementById("s1-caption");
  const btns = [...document.querySelectorAll("[data-s1-mode]")];
  if (!svg || !btns.length) return;

  const MODES = {
    peek: {
      caption:
        "视窗宽度略大于一张卡（约 1.28 张），主卡完整居中，右侧露出 18% 邻卡——眼睛不用文字说明就看出轨道还在延伸。",
      render() {
        return `
          <rect x="0" y="0" width="560" height="220" fill="#000E27"/>
          <g opacity="0.28">
            <rect x="16" y="42" width="146" height="128" rx="8" fill="#081D41" stroke="#27436F"/>
            <text x="30" y="72" fill="#A9BCD6" font-size="14" font-family="Syne,sans-serif" font-weight="700">01</text>
            <rect x="344" y="42" width="146" height="128" rx="8" fill="#081D41" stroke="#27436F"/>
            <rect x="506" y="42" width="44" height="128" rx="8" fill="#081D41" stroke="#27436F"/>
          </g>
          <clipPath id="s1-clip-peek"><rect x="174" y="30" width="212" height="152" rx="10"/></clipPath>
          <g clip-path="url(#s1-clip-peek)">
            <rect x="174" y="30" width="212" height="152" fill="#021330"/>
            <rect x="184" y="42" width="146" height="128" rx="8" fill="#0C2756" stroke="#3DCADC" stroke-width="1.5"/>
            <text x="198" y="72" fill="#3DCADC" font-size="16" font-family="Syne,sans-serif" font-weight="700">02 探索</text>
            <path d="M196 156 A64 64 0 0 1 264 156 Z" fill="#2BB7CC"/>
            <circle cx="304" cy="102" r="11" fill="#F381A0"/>
            <rect x="344" y="42" width="146" height="128" rx="8" fill="#081D41" stroke="#2BB7CC"/>
            <text x="354" y="72" fill="#F1EBE4" font-size="15" font-family="Syne,sans-serif" font-weight="700">03</text>
            <rect x="344" y="34" width="42" height="144" fill="rgba(61,202,220,0.16)"/>
          </g>
          <rect x="174" y="30" width="212" height="152" rx="10" fill="none" stroke="#3DCADC" stroke-width="2"/>
          <text x="280" y="202" text-anchor="middle" fill="#3DCADC" font-size="12" font-family="Manrope,sans-serif" font-weight="600">VIEWPORT · 右缘自然露边 18%</text>
        `;
      },
    },
    xray: {
      caption:
        "移开视窗幕帘，就能看清横向卷轴的真实物理形态：所有卡片排在同一水平长轨上，视窗只负责沿着轨道左右取景。",
      render() {
        const xs = [18, 124, 230, 336, 442];
        const nums = ["01", "02", "03", "04", "05"];
        const colors = ["#F1EBE4", "#3DCADC", "#2BB7CC", "#F381A0", "#F1EBE4"];
        const cards = xs
          .map(
            (x, i) => `
          <rect x="${x}" y="48" width="92" height="114" rx="7" fill="${i === 1 ? "#0C2756" : "#081D41"}" stroke="${i === 1 ? "#3DCADC" : "#27436F"}" stroke-width="${i === 1 ? 1.8 : 1}"/>
          <text x="${x + 12}" y="72" fill="${colors[i]}" font-size="15" font-family="Syne,sans-serif" font-weight="700">${nums[i]}</text>
          <circle cx="${x + 46}" cy="116" r="16" fill="${colors[i]}" opacity="0.85"/>
        `
          )
          .join("");
        return `
          <rect x="0" y="0" width="560" height="220" fill="#000E27"/>
          <line x1="12" y1="28" x2="538" y2="28" stroke="#F381A0" stroke-width="2.5" stroke-dasharray="7 6"/>
          <polygon points="534,21 548,28 534,35" fill="#F381A0"/>
          ${cards}
          <rect x="218" y="38" width="144" height="134" rx="10" fill="none" stroke="#3DCADC" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="280" y="200" text-anchor="middle" fill="#F381A0" font-size="12" font-family="Noto Sans SC,sans-serif">完整水平内容轨（宽于视窗 3.6 倍）→ 视窗沿轨取景</text>
        `;
      },
    },
    blind: {
      caption:
        "当一张卡严丝合缝占满整个视窗（露边 0%）且没有翻页提示，读者面对的是一堵「假底边」：根本不知道右边还有四张卡片。",
      render() {
        return `
          <rect x="0" y="0" width="560" height="220" fill="#000E27"/>
          <clipPath id="s1-clip-blind"><rect x="174" y="30" width="212" height="152" rx="10"/></clipPath>
          <g clip-path="url(#s1-clip-blind)">
            <rect x="174" y="30" width="212" height="152" fill="#021330"/>
            <rect x="178" y="34" width="204" height="144" rx="8" fill="#0C2756" stroke="#27436F"/>
            <text x="196" y="66" fill="#F5F8FC" font-size="17" font-family="Syne,sans-serif" font-weight="700">02 探索</text>
            <path d="M196 158 A68 68 0 0 1 284 158 Z" fill="#2BB7CC"/>
            <circle cx="334" cy="96" r="14" fill="#F381A0"/>
          </g>
          <rect x="174" y="30" width="212" height="152" rx="10" fill="none" stroke="#FF7A89" stroke-width="2"/>
          <line x1="386" y1="32" x2="386" y2="180" stroke="#FF7A89" stroke-width="3" stroke-dasharray="6 4"/>
          <text x="468" y="102" text-anchor="middle" fill="#FF7A89" font-size="12.5" font-family="Noto Sans SC,sans-serif" font-weight="700">右侧 03–05 不可见</text>
          <text x="468" y="122" text-anchor="middle" fill="#A9BCD6" font-size="11.5" font-family="Noto Sans SC,sans-serif">读者以为到此为止</text>
          <text x="280" y="202" text-anchor="middle" fill="#FF7A89" font-size="12" font-family="Noto Sans SC,sans-serif" font-weight="600">假底边盲区：右缘齐平 · 露边 0%</text>
        `;
      },
    },
  };

  function apply(mode) {
    const m = MODES[mode] || MODES.peek;
    svg.innerHTML = m.render();
    cap.textContent = m.caption;
    btns.forEach((b) => {
      const on = b.dataset.s1Mode === mode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => apply(b.dataset.s1Mode)));
  apply("peek");
}

// ==================== 02 节：真原生 CSS 横向卷轴实测架 ====================
function initSection02() {
  const vp = document.getElementById("s2-viewport");
  const track = document.getElementById("s2-track");
  const metric = document.getElementById("s2-metric");
  const verdict = document.getElementById("s2-verdict");
  const fadeBtn = document.getElementById("s2-fade-btn");
  const prevBtn = document.getElementById("s2-prev");
  const nextBtn = document.getElementById("s2-next");
  const wBtns = [...document.querySelectorAll("[data-s2-width]")];
  if (!track || !wBtns.length) return;

  let cardPct = 76;

  function measure() {
    const tr = track.getBoundingClientRect();
    const cards = [...track.querySelectorAll(".n-card")];
    const atEnd = track.scrollWidth - track.clientWidth - track.scrollLeft <= 4;
    let peekPx = 0;
    let peekPct = 0;
    let peekNo = "";
    for (const el of cards) {
      const r = el.getBoundingClientRect();
      const relL = r.left - tr.left;
      const relR = r.right - tr.left;
      if (relL > 4 && relL < tr.width - 2 && relR > tr.width + 2) {
        peekPx = Math.round(tr.width - relL);
        peekPct = Math.round((peekPx / Math.max(1, r.width)) * 100);
        peekNo = el.querySelector(".n-no")?.textContent || "";
        break;
      }
    }
    if (atEnd) {
      metric.textContent = `实测：已滑抵第 05 卡终点（总轨长 ${track.scrollWidth}px / 视窗 ${Math.round(tr.width)}px）`;
      verdict.textContent = "已到轨道收口；overscroll-behavior-x: contain 挡住了多余的横向回弹。";
    } else if (peekPct < 8) {
      metric.textContent = `实测：右缘露边 ${peekPct}%（${peekPx}px）· 形成假底边`;
      verdict.textContent = "右缘齐平视窗框，看不出后面还有卡片——试着切回 76% 或 43% 对照。";
    } else {
      metric.textContent = `实测：右缘露出第 ${peekNo} 卡 ${peekPct}%（约 ${peekPx}px）`;
      verdict.textContent = "无需文字箭头，被视窗自然切开的下一张卡已经在替你引导向右浏览。";
    }
  }

  function setWidth(pct) {
    cardPct = pct;
    track.style.setProperty("--card-w", `${pct}%`);
    track.dataset.full = String(pct >= 100);
    wBtns.forEach((b) => {
      const on = +b.dataset.s2Width === pct;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    track.scrollLeft = 0;
    requestAnimationFrame(measure);
  }

  wBtns.forEach((b) => b.addEventListener("click", () => setWidth(+b.dataset.s2Width)));

  fadeBtn?.addEventListener("click", () => {
    const on = fadeBtn.getAttribute("aria-pressed") !== "true";
    fadeBtn.setAttribute("aria-pressed", String(on));
    fadeBtn.textContent = `右缘轻羽化：${on ? "开" : "关"}`;
    vp.classList.toggle("has-fade", on);
  });

  const stepScroll = (dir) => {
    const first = track.querySelector(".n-card");
    const step = (first ? first.getBoundingClientRect().width : 260) + (cardPct >= 100 ? 0 : 14);
    track.scrollLeft = clamp(track.scrollLeft + dir * step, 0, track.scrollWidth - track.clientWidth);
    requestAnimationFrame(measure);
  };
  prevBtn?.addEventListener("click", () => stepScroll(-1));
  nextBtn?.addEventListener("click", () => stepScroll(1));
  track.addEventListener("scroll", measure, { passive: true });
  new ResizeObserver(measure).observe(track);
  setWidth(76);
}

// ==================== 03 节：2D Canvas 物理抛掷示波仪 ====================
function initSection03() {
  const canvas = document.getElementById("snap-canvas");
  const readout = document.getElementById("s3-readout");
  const flickBtns = [...document.querySelectorAll("[data-flick]")];
  const stopBtns = [...document.querySelectorAll("[data-stop]")];
  if (!canvas || !flickBtns.length) return;

  const ctx = canvas.getContext("2d");
  const SPEEDS = { light: 420, medium: 760, hard: 1650 };
  let stopMode = "normal";
  let lastSpeedKey = "medium";

  // 三条平行轨道：[自由惯性, proximity, mandatory]
  const tracks = [
    { name: "none 自由惯性", mode: "none", color: "#F381A0", pos: 1.46, v: 0, target: null, settled: true },
    { name: "proximity 临近轻吸", mode: "proximity", color: "#F5C056", pos: 1.46, v: 0, target: null, settled: true },
    { name: "mandatory 强制吸附", mode: "mandatory", color: "#3DCADC", pos: 2.0, v: 0, target: null, settled: true },
  ];

  let w = 600;
  let h = 248;
  let dpr = pixelRatio(2);
  const SLOTS = 5;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10) return;
    w = Math.round(r.width);
    h = Math.round(r.height);
    dpr = pixelRatio(2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function launchFlick(key, instant = false) {
    lastSpeedKey = key;
    flickBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.flick === key));
    const speed = SPEEDS[key] || 760;
    // 归一化速度到槽位坐标（0..SLOTS-1），让中甩恰好落在 1.48 附近最能看出三条轨道分叉
    const slotVel = speed / 150;
    for (const tr of tracks) {
      tr.pos = 0.08;
      tr.v = slotVel;
      tr.target = null;
      tr.settled = false;
      if (instant || reducedMotion.matches) {
        const rawEnd = clamp(tr.pos + tr.v / 3.6, 0, SLOTS - 1);
        tr.pos = resolveStop(tr.mode, rawEnd, 0);
        tr.v = 0;
        tr.settled = true;
      }
    }
    updateNote();
    runner.draw();
  }

  function resolveStop(mode, rawPos, startIdx) {
    let dest = clamp(rawPos, 0, SLOTS - 1);
    if (mode === "none") return dest;
    const nearest = Math.round(dest);
    if (mode === "proximity") {
      return Math.abs(dest - nearest) < 0.28 ? nearest : dest;
    }
    // mandatory
    if (stopMode === "always") {
      return clamp(startIdx + 1, 0, SLOTS - 1);
    }
    return nearest;
  }

  function updateNote() {
    const fmt = (p) => `卡 0${Math.min(5, Math.floor(p) + 1)} (${Math.round((p % 1) * 100)}% 偏移)`;
    const noneOff = Math.round(Math.abs(tracks[0].pos - Math.round(tracks[0].pos)) * 100);
    const proxOff = Math.round(Math.abs(tracks[1].pos - Math.round(tracks[1].pos)) * 100);
    const mandIdx = Math.round(tracks[2].pos) + 1;
    if (tracks.every((t) => t.settled)) {
      readout.textContent = `落位对比：自由惯性偏离整卡 ${noneOff}%${noneOff > 18 ? "（停在中缝）" : ""} · proximity 偏离 ${proxOff}% · mandatory 稳停在第 0${mandIdx} 卡（${stopMode === "always" ? "逐卡必停" : "允许连跳"}）。`;
    } else {
      readout.textContent = `正在以「${lastSpeedKey === "light" ? "轻推" : lastSpeedKey === "hard" ? "急甩" : "中甩"}」物理滑行对比（${fmt(tracks[0].pos)}）…`;
    }
  }

  const runner = loop(canvas, (_t, dt, { still }) => {
    let anyMoving = false;
    if (!still && dt > 0) {
      for (const tr of tracks) {
        if (tr.settled) continue;
        anyMoving = true;
        if (tr.target !== null) {
          const diff = tr.target - tr.pos;
          if (Math.abs(diff) < 0.004) {
            tr.pos = tr.target;
            tr.v = 0;
            tr.settled = true;
          } else {
            tr.pos += diff * (1 - Math.exp(-dt * 12));
          }
        } else {
          tr.pos = clamp(tr.pos + tr.v * dt, 0, SLOTS - 1);
          tr.v *= Math.exp(-dt * 3.6);
          if (tr.mode === "mandatory" && stopMode === "always" && tr.pos >= 0.72) {
            tr.target = 1;
          } else if (tr.v < 0.25 || tr.pos >= SLOTS - 1.001) {
            tr.v = 0;
            const snapped = resolveStop(tr.mode, tr.pos, 0);
            if (Math.abs(snapped - tr.pos) > 0.005) {
              tr.target = snapped;
            } else {
              tr.settled = true;
            }
          }
        }
      }
      if (!anyMoving) updateNote();
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = w < 460 ? 14 : 148;
    const padR = 20;
    const usableW = Math.max(160, w - padL - padR);
    const slotW = usableW / SLOTS;

    // 竖向整卡吸附槽位网格线
    for (let i = 0; i < SLOTS; i++) {
      const sx = padL + i * slotW;
      ctx.strokeStyle = "rgba(61, 202, 220, 0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, 28);
      ctx.lineTo(sx, h - 18);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `600 11px "IBM Plex Mono", monospace`;
      ctx.fillStyle = "#8BA4C7";
      ctx.fillText(`0${i + 1}`, sx + 4, 18);
    }

    const rowH = (h - 44) / 3;
    tracks.forEach((tr, ri) => {
      const cy = 38 + ri * rowH + rowH * 0.5;
      if (w >= 460) {
        ctx.font = `600 12px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = tr.color;
        ctx.textBaseline = "middle";
        ctx.fillText(tr.name, 14, cy);
      } else {
        ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = tr.color;
        ctx.textBaseline = "top";
        ctx.fillText(tr.name, 14, 34 + ri * rowH);
      }

      // 轨道底槽
      ctx.fillStyle = "#081D41";
      ctx.fillRect(padL, cy - 10, usableW, 20);

      // 滑块（模拟视窗停驻卡框）
      const bx = padL + tr.pos * slotW;
      const bw = Math.max(24, slotW * 0.82);
      const offSlot = Math.abs(tr.pos - Math.round(tr.pos));
      const badStop = tr.settled && offSlot > 0.16;

      ctx.fillStyle = badStop ? "#B3263E" : tr.color;
      ctx.fillRect(bx, cy - 12, bw, 24);
      ctx.fillStyle = badStop ? "#FFFFFF" : "#000E27";
      ctx.font = `700 11px "IBM Plex Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.fillText(badStop ? "中缝" : `0${Math.round(tr.pos) + 1}`, bx + 7, cy);
    });

    ctx.restore();
  });

  flickBtns.forEach((b) => b.addEventListener("click", () => launchFlick(b.dataset.flick)));
  stopBtns.forEach((b) =>
    b.addEventListener("click", () => {
      stopMode = b.dataset.stop;
      stopBtns.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      launchFlick(lastSpeedKey);
    })
  );

  new ResizeObserver(() => {
    resize();
    runner.draw();
  }).observe(canvas);
  resize();
  launchFlick("medium", true);
}

// ==================== 04 节：横向卷轴从哪来（水平年代刻度卡） ====================
function initSection04() {
  const btns = [...document.querySelectorAll(".era-btn")];
  const svg = document.getElementById("era-svg");
  const kicker = document.getElementById("era-kicker");
  const title = document.getElementById("era-title");
  const text = document.getElementById("era-text");
  const source = document.getElementById("era-source");
  if (!btns.length || !svg) return;

  const ERAS = [
    {
      kicker: "器物原型 · 移步换景",
      title: "双臂展幅，就是最早的可视窗口",
      text: "东亚传统手卷动辄数米，观赏时并非一次铺满整墙，而是左手缓缓展开、右手同步卷收，眼前始终只保留双臂自然展开的数十厘米画幅（经验视域）。电影 35mm 胶片同样把连续画格排成一条定轨，由片门逐帧截取——「轨道大于窗口，视窗随手推进」的结构在此已经成型。",
      source: "脉络参考：东亚手卷装裱制式与连续胶片片门结构",
      svg: `
        <rect width="360" height="190" fill="#000E27"/>
        <rect x="64" y="42" width="232" height="104" fill="#F1EBE4" rx="4"/>
        <rect x="46" y="30" width="22" height="128" rx="6" fill="#F381A0"/>
        <rect x="292" y="30" width="22" height="128" rx="6" fill="#F381A0"/>
        <path d="M84 120 Q138 66 196 106 T276 82" fill="none" stroke="#081D41" stroke-width="3.5"/>
        <rect x="128" y="36" width="108" height="116" rx="6" fill="none" stroke="#3DCADC" stroke-width="2.2" stroke-dasharray="6 4"/>
        <text x="180" y="174" text-anchor="middle" fill="#3DCADC" font-size="11.5" font-family="Noto Sans SC,sans-serif">左展右收 · 视窗随手移动</text>
      `,
    },
    {
      kicker: "2004–2006 · 视觉翻牌进桌面",
      title: "Cover Flow 把横向浏览带进大众界面",
      text: "2004 年 12 月，设计师 Andrew Coulter Enright 在博客提出模仿点唱机翻牌的横向专辑浏览概念；独立开发者 Jonathan del Strother 于 2005 年将其实现为 macOS 应用。2006 年 9 月 12 日，Apple 将 Cover Flow 正式整合进 iTunes 7，随后带入 Finder 与 iPhone，向数亿用户普及了「居中聚焦 + 两翼露边」的横向视觉心智。",
      source: "核实来源：Andrew Coulter Enright (2004)、Apple iTunes 7 发布记录 (2006-09-12)",
      svg: `
        <rect width="360" height="190" fill="#000E27"/>
        <polygon points="36,44 86,58 86,132 36,146" fill="#0C2756" stroke="#27436F"/>
        <polygon points="94,52 132,62 132,128 94,138" fill="#10326B" stroke="#2BB7CC"/>
        <rect x="142" y="42" width="76" height="106" rx="6" fill="#2BB7CC" stroke="#3DCADC" stroke-width="2"/>
        <circle cx="180" cy="95" r="20" fill="#F381A0"/>
        <polygon points="266,52 228,62 228,128 266,138" fill="#10326B" stroke="#2BB7CC"/>
        <polygon points="324,44 274,58 274,132 324,146" fill="#0C2756" stroke="#27436F"/>
        <text x="180" y="174" text-anchor="middle" fill="#3DCADC" font-size="11.5" font-family="Manrope,sans-serif">COVER FLOW · iTUNES 7 (2006)</text>
      `,
    },
    {
      kicker: "2014–2017 · 桌面端可用性反思",
      title: "NN/g 警示：别把触屏横滑硬搬上桌面",
      text: "2014 年 4 月 27 日，Nielsen Norman Group 的 Katie Sherwin 在《Beware Horizontal Scrolling and Mimicking Swipe on Desktop》中指出，电脑用户习惯纵轴鼠轮，缺少明确按钮与露边时极易错过横向内容。2017 年 10 月 22 日，Therese Fessenden 的眼动研究《Horizontal Attention Leans Left》进一步测得，约 80% 的屏幕注视集中在左半侧。",
      source: "核实来源：nngroup.com/articles/horizontal-scrolling/ (2014) 与 horizontal-attention-leans-left/ (2017)",
      svg: `
        <rect width="360" height="190" fill="#000E27"/>
        <rect x="28" y="28" width="304" height="122" rx="8" fill="#081D41" stroke="#27436F"/>
        <rect x="28" y="28" width="152" height="122" rx="8" fill="rgba(61,202,220,0.22)"/>
        <line x1="180" y1="28" x2="180" y2="150" stroke="#F381A0" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="104" y="86" text-anchor="middle" fill="#3DCADC" font-size="24" font-family="Syne,sans-serif" font-weight="800">80%</text>
        <text x="104" y="108" text-anchor="middle" fill="#F5F8FC" font-size="11.5" font-family="Noto Sans SC,sans-serif">左半屏注视集中</text>
        <text x="256" y="86" text-anchor="middle" fill="#F381A0" font-size="22" font-family="Syne,sans-serif" font-weight="800">20%</text>
        <text x="256" y="108" text-anchor="middle" fill="#A9BCD6" font-size="11.5" font-family="Noto Sans SC,sans-serif">右侧更需要清晰线索</text>
        <text x="180" y="174" text-anchor="middle" fill="#A9BCD6" font-size="11.5" font-family="Manrope,sans-serif">NN/g EYE-TRACKING INSIGHT</text>
      `,
    },
    {
      kicker: "2016–2021 · 浏览器原生布局原语",
      title: "CSS Scroll Snap 与 The Reel 收编横卷",
      text: "W3C 于 2016 年 11 月发布 CSS Scroll Snap Module Level 1 首个候选推荐，并在 2019 年 3 月与 2021 年 3 月 11 日迭代为候选推荐快照，让吸附停驻不再依赖厚重脚本。2019 年，Heydon Pickering 与 Andy Bell 在《Every Layout》中正式将无脚本横向溢出轨道命名为布局原语「The Reel」，并与 WCAG 2.1 的 1.4.10 Reflow 划清了组件局部横滑的工程边界。",
      source: "核实来源：w3.org/TR/css-scroll-snap-1/ (2021-03-11)、every-layout.dev/layouts/reel/ (2019)",
      svg: `
        <rect width="360" height="190" fill="#000E27"/>
        <rect x="26" y="34" width="308" height="106" rx="8" fill="#081D41" stroke="#3DCADC" stroke-width="1.6"/>
        <text x="44" y="64" fill="#3DCADC" font-size="12.5" font-family="IBM Plex Mono,monospace">.reel {</text>
        <text x="58" y="86" fill="#F5F8FC" font-size="12" font-family="IBM Plex Mono,monospace">overflow-x: auto;</text>
        <text x="58" y="106" fill="#F381A0" font-size="12" font-family="IBM Plex Mono,monospace">scroll-snap-type: x mandatory;</text>
        <text x="44" y="126" fill="#3DCADC" font-size="12.5" font-family="IBM Plex Mono,monospace">}</text>
        <text x="180" y="170" text-anchor="middle" fill="#4BE0B8" font-size="11.5" font-family="Manrope,sans-serif">W3C SCROLL SNAP + EVERY LAYOUT THE REEL</text>
      `,
    },
  ];

  function select(idx) {
    const e = ERAS[idx] || ERAS[0];
    svg.innerHTML = e.svg;
    kicker.textContent = e.kicker;
    title.textContent = e.title;
    text.textContent = e.text;
    source.textContent = e.source;
    btns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => select(+b.dataset.era)));
  select(0);
}

// ==================== 05 节：三设备输入可达性体检矩阵 ====================
function initSection05() {
  const chkArrows = document.getElementById("chk-arrows");
  const chkKbd = document.getElementById("chk-kbd");
  const chkOver = document.getElementById("chk-overscroll");
  const chkNoHijack = document.getElementById("chk-nohijack");
  const grid = document.getElementById("device-grid");
  if (!chkArrows || !grid) return;

  function render() {
    const arrows = chkArrows.checked;
    const kbd = chkKbd.checked;
    const over = chkOver.checked;
    const noHijack = chkNoHijack.checked;

    const setTile = (dev, state, status, msg) => {
      const tile = grid.querySelector(`[data-dev="${dev}"]`);
      if (!tile) return;
      tile.dataset.state = state;
      document.getElementById(`dev-${dev}-st`).textContent = status;
      document.getElementById(`dev-${dev}-msg`).textContent = msg;
    };

    if (!noHijack) {
      setTile("touch", "err", "双轴打架", "强行劫持滚动后，手机竖滑看正文时会被意外拉进横轨。");
      setTile("mouse", "err", "被困轨道", "访客用滚轮往下翻正文时突然被横滚绑架，体验焦躁。");
    } else {
      setTile(
        "touch",
        over ? "ok" : "warn",
        over ? "丝滑安全" : "边界风险",
        over
          ? "手指横划惯性顺畅，滑回最左也不会误触发浏览器返回。"
          : "虽可横划，但滑回最左尽头时容易误触浏览器“返回上一页”。"
      );
      setTile(
        "mouse",
        arrows ? "ok" : "err",
        arrows ? "顺畅可达" : "盲滑卡壳",
        arrows
          ? "点前后翻页钮即可直达第 04 卡，纵滚页面也完全自由。"
          : "普通滚轮只走纵轴，缺少翻页钮和可见滚动条导致难以右移。"
      );
    }

    setTile(
      "kbd",
      kbd ? "ok" : "err",
      kbd ? "键盘可达" : "焦点漏过",
      kbd
        ? "可用 Tab 进入并按方向键顺滑步进到第 04 卡，外框完整不裁切。"
        : "滚动容器既不能聚焦又缺可 Tab 入口，纯键盘用户到不了第 04 卡。"
    );
  }

  [chkArrows, chkKbd, chkOver, chkNoHijack].forEach((c) => c.addEventListener("change", render));
  render();
}

// ==================== 06 节：场景需求分诊卡 ====================
function initSection06() {
  const btns = [...document.querySelectorAll("[data-case]")];
  const tag = document.getElementById("triage-verdict");
  const title = document.getElementById("triage-title");
  const reason = document.getElementById("triage-reason");
  const svg = document.getElementById("triage-svg");
  if (!btns.length || !svg) return;

  const CASES = {
    gallery: {
      kind: "use",
      verdict: "推荐横向卷轴",
      title: "12 张同质摄影卡：单轨横卷最省纵深",
      reason:
        "作品集属于同质视觉预览，不必一次性占掉三屏页面高度。用 76% 单卡宽留出下卡露边，再给桌面端补上前后翻页钮，就能兼顾沉浸和效率。",
      svg: `
        <rect width="320" height="140" fill="#000E27"/>
        <rect x="24" y="20" width="144" height="92" rx="8" fill="#0C2756" stroke="#3DCADC" stroke-width="1.8"/>
        <polygon points="44,96 86,44 126,96" fill="#F1EBE4"/>
        <circle cx="136" cy="46" r="11" fill="#F381A0"/>
        <rect x="180" y="20" width="116" height="92" rx="8" fill="#081D41" stroke="#27436F"/>
        <circle cx="224" cy="68" r="20" fill="#2BB7CC"/>
        <text x="160" y="130" text-anchor="middle" fill="#4BE0B8" font-size="11.5" font-family="Noto Sans SC,sans-serif">单卡主焦 + 露边 18% · 省下 3 屏纵深</text>
      `,
    },
    article: {
      kind: "avoid",
      verdict: "别用横卷 · 改用 245 居中器 + 243 堆栈",
      title: "1500 字深度长文：必须纵向单列阅读",
      reason:
        "长文需要稳定的 45–75 字符行宽与自上而下的扫读节奏。强塞进横向卷轴会迫使眼睛在左右来回拖屏间反复断句，违背 WCAG 1.4.10 单向重排原则。",
      svg: `
        <rect width="320" height="140" fill="#000E27"/>
        <rect x="78" y="16" width="164" height="100" rx="6" fill="#081D41" stroke="#3DCADC" stroke-width="1.6"/>
        <rect x="94" y="30" width="108" height="7" rx="2" fill="#F1EBE4"/>
        <rect x="94" y="46" width="132" height="5" rx="2" fill="#A9BCD6"/>
        <rect x="94" y="58" width="126" height="5" rx="2" fill="#A9BCD6"/>
        <rect x="94" y="70" width="130" height="5" rx="2" fill="#A9BCD6"/>
        <rect x="94" y="88" width="118" height="5" rx="2" fill="#6E88B0"/>
        <text x="160" y="131" text-anchor="middle" fill="#F381A0" font-size="11.5" font-family="Noto Sans SC,sans-serif">改用居中定宽纵排，单轴向下阅读</text>
      `,
    },
    compare: {
      kind: "avoid",
      verdict: "谨慎 · 仅做局部隔离表格，首列吸顶",
      title: "6 列核心参数对比：屏外列会让记忆断片",
      reason:
        "做价格或规格决策时，读者需要把两列并排看。桌面端应优先展开成自适应多列；仅在窄屏不得已时才让表格自身局部横滑，并把第一列名称固定（sticky）。",
      svg: `
        <rect width="320" height="140" fill="#000E27"/>
        <rect x="20" y="20" width="84" height="92" rx="6" fill="#0C2756" stroke="#3DCADC" stroke-width="1.6"/>
        <rect x="112" y="20" width="88" height="92" rx="6" fill="#081D41" stroke="#27436F"/>
        <rect x="208" y="20" width="88" height="92" rx="6" fill="#081D41" stroke="#27436F"/>
        <text x="62" y="70" text-anchor="middle" fill="#3DCADC" font-size="11.5" font-family="Noto Sans SC,sans-serif">固定首列</text>
        <text x="156" y="70" text-anchor="middle" fill="#F5F8FC" font-size="11.5" font-family="Noto Sans SC,sans-serif">方案 A</text>
        <text x="252" y="70" text-anchor="middle" fill="#F5F8FC" font-size="11.5" font-family="Noto Sans SC,sans-serif">方案 B</text>
        <text x="160" y="130" text-anchor="middle" fill="#F5C056" font-size="11.5" font-family="Noto Sans SC,sans-serif">局部表格横滑 + position: sticky 左列</text>
      `,
    },
    tags: {
      kind: "avoid",
      verdict: "短项少 → 246 簇群；几十项 → 轻横卷",
      title: "9 个文章分类标签：折行簇群一眼全见",
      reason:
        "只有 9 个短词标签时，用 246 簇群自然折成两行就能一眼看全，不必把后四个标签藏到视窗外；只有频道超过十几项且必须保住首屏高度时，才上横卷筛选条。",
      svg: `
        <rect width="320" height="140" fill="#000E27"/>
        <rect x="24" y="28" width="58" height="24" rx="12" fill="#3DCADC"/>
        <rect x="90" y="28" width="72" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <rect x="170" y="28" width="60" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <rect x="238" y="28" width="58" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <rect x="24" y="62" width="68" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <rect x="100" y="62" width="62" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <rect x="170" y="62" width="78" height="24" rx="12" fill="#0C2756" stroke="#2BB7CC"/>
        <text x="160" y="116" text-anchor="middle" fill="#4BE0B8" font-size="11.5" font-family="Noto Sans SC,sans-serif">两行自然换行 · 零隐藏入口</text>
      `,
    },
  };

  function show(key) {
    const c = CASES[key] || CASES.gallery;
    tag.textContent = c.verdict;
    tag.dataset.kind = c.kind;
    title.textContent = c.title;
    reason.textContent = c.reason;
    svg.innerHTML = c.svg;
    btns.forEach((b) => {
      const on = b.dataset.case === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.case)));
  show("gallery");
}

// ==================== 07 节：单变量小练习 + 原海报放大拖拽灯箱 ====================
function initSection07() {
  const opts = [...document.querySelectorAll(".quiz-opt")];
  const fb = document.getElementById("quiz-feedback");
  const fbHead = document.getElementById("quiz-fb-head");
  const fbBody = document.getElementById("quiz-fb-body");

  const EXPLAIN = {
    A: {
      ok: false,
      head: "再想想：A（100% 占满视窗）造出了最典型的「假底边」",
      body: "虽然单卡本身很大很清晰，但右缘严丝合缝贴齐视窗边界，露边为 0%。在没有额外强提示时，读者会以为这里只有一张孤立卡片。",
    },
    B: {
      ok: true,
      head: "选对了：B（单卡 78%）同时守住了主卡阅读宽度与右缘露边线索",
      body: "390px 屏幕下，78% 卡宽约 280–300px，标题和图形从容舒展；更重要的是右侧自然切出约 18% 的下一张卡，靠视觉未闭合就能让人直觉向左滑动。",
    },
    C: {
      ok: false,
      head: "很接近陷阱：C（50% 平分视窗）同样落入了「整除假底边」",
      body: "同屏刚好塞进整整 2 张卡，右缘和视窗再次严丝合缝（露边 0%），且在 390px 手机上单卡被压窄到不足 180px。双卡货架也应该打破整除，改用约 43% 让第 3 张露个头。",
    },
    D: {
      ok: false,
      head: "不对：D（118% 超出视窗）配合吸附会把溢出内容锁死在窗外",
      body: "卡片比整个可视窗口还宽，读者一松手就会被吸附拉回左缘对齐，超出右边界的画面和字永远停不到眼前。",
    },
  };

  opts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const res = EXPLAIN[pick];
      opts.forEach((o) => {
        o.classList.remove("is-right", "is-wrong");
        o.setAttribute("aria-pressed", String(o === btn));
        if (o.dataset.opt === "B") o.classList.add("is-right");
        else if (o === btn && !res.ok) o.classList.add("is-wrong");
      });
      fb.hidden = false;
      fb.dataset.right = String(res.ok);
      fbHead.textContent = res.head;
      fbBody.textContent = res.body;
    });
  });

  // 原海报放大拖拽灯箱（复用 #poster.src，不重复内联图片）
  const openBtn = document.getElementById("poster-open");
  const poster = document.getElementById("poster");
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbStage = document.getElementById("lb-stage");
  const lbScale = document.getElementById("lb-scale");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const btnClose = document.getElementById("lb-close");
  if (!openBtn || !lb || !poster) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    lbScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function openLightbox() {
    lbImg.src = poster.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    lb.hidden = false;
    btnClose.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", openLightbox);
  btnClose.addEventListener("click", closeLightbox);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.7, 3.2);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.7, 3.2);
    applyTransform();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  lbStage.addEventListener("pointerdown", (e) => {
    panning = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbStage.setPointerCapture(e.pointerId);
    lbStage.classList.add("is-dragging");
  });
  lbStage.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endPan = () => {
    panning = false;
    lbStage.classList.remove("is-dragging");
  };
  lbStage.addEventListener("pointerup", endPan);
  lbStage.addEventListener("pointercancel", endPan);
  lbStage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.16 : -0.16), 0.7, 3.2);
      applyTransform();
    },
    { passive: false }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lb.hidden) closeLightbox();
  });
}

export function initSections() {
  initSection01();
  initSection02();
  initSection03();
  initSection04();
  initSection05();
  initSection06();
  initSection07();
}
