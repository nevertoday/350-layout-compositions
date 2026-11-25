// 036 C形构图 · 第 01 / 02 / 03 / 04 / 06 / 07 节全部互动组件
import { loop, pixelRatio } from "../../lib/stage.js";
import {
  DIRECTION_STORIES,
  QUIZ_OPTIONS,
  evaluateArcSpectrum,
  clamp,
} from "./model.js";

const DEG = Math.PI / 180;

// ---------- 01 节：四要点对照解剖 SVG ----------
const ANATOMY_DATA = {
  enclose: {
    tag: "对照解剖 · 包裹主体",
    cap: "直角硬框 vs C 形柔弧",
    note: "左侧硬直边框把主体框成孤立标本，四角生硬截断视线；右侧 225° C 弧从三面温柔聚拢，既守住主角，又留出右侧通透呼吸口。",
    svg: `
      <g>
        <rect x="20" y="24" width="218" height="272" rx="10" fill="#F7FBFE" stroke="#9FC4EA" stroke-width="1.5"/>
        <text x="129" y="50" text-anchor="middle" fill="#3B526B" font-size="13" font-weight="700">硬直角框（隔离感）</text>
        <rect x="58" y="88" width="142" height="142" fill="none" stroke="#1D549B" stroke-width="12"/>
        <circle cx="129" cy="159" r="28" fill="#EA6B37"/>
        <text x="129" y="264" text-anchor="middle" fill="#B91C1C" font-size="12" font-weight="700">四边封死 · 像关在盒中</text>
      </g>
      <g>
        <rect x="260" y="24" width="240" height="272" rx="10" fill="#D4EAFC" stroke="#3576C4" stroke-width="1.5"/>
        <text x="380" y="50" text-anchor="middle" fill="#0B1622" font-size="13" font-weight="800">225° C 形弧（三面怀抱）</text>
        <path d="M 412 104 A 72 72 0 1 0 412 214" fill="none" stroke="#EA6B37" stroke-width="18" stroke-linecap="round"/>
        <circle cx="366" cy="159" r="28" fill="#EA6B37"/>
        <path d="M 406 144 L 478 122 M 412 159 L 486 159 M 406 174 L 478 196" stroke="#1D549B" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="380" y="264" text-anchor="middle" fill="#11694E" font-size="12" font-weight="700">围合聚焦 · 右侧留出呼吸</text>
      </g>
    `,
  },
  hold: {
    tag: "对照解剖 · 视觉停留",
    cap: "直线飞掠 vs 弧道减速驻足",
    note: "直线斜穿画面时眼睛顺势滑出边界；C 形圆弧迫使目光先减速绕弯，在中心焦点上多停留一拍，再从容走向开口。",
    svg: `
      <g>
        <rect x="20" y="24" width="218" height="272" rx="10" fill="#F7FBFE" stroke="#9FC4EA" stroke-width="1.5"/>
        <text x="129" y="50" text-anchor="middle" fill="#3B526B" font-size="13" font-weight="700">斜直线（快速滑出）</text>
        <line x1="46" y1="226" x2="212" y2="88" stroke="#3576C4" stroke-width="4" stroke-dasharray="7 5"/>
        <polygon points="216,84 202,88 210,98" fill="#B91C1C"/>
        <circle cx="129" cy="158" r="22" fill="#EA6B37" opacity="0.65"/>
        <text x="129" y="264" text-anchor="middle" fill="#B91C1C" font-size="12" font-weight="700">一掠而过 · 停留时间短</text>
      </g>
      <g>
        <rect x="260" y="24" width="240" height="272" rx="10" fill="#D4EAFC" stroke="#3576C4" stroke-width="1.5"/>
        <text x="380" y="50" text-anchor="middle" fill="#0B1622" font-size="13" font-weight="800">弧道减速（环绕注视）</text>
        <path d="M 416 102 A 72 72 0 1 0 416 216" fill="none" stroke="#FA8252" stroke-width="14"/>
        <path d="M 404 114 A 56 56 0 1 0 404 204" fill="none" stroke="#1D549B" stroke-width="2.5" stroke-dasharray="6 4"/>
        <circle cx="368" cy="159" r="30" fill="#EA6B37"/>
        <circle cx="322" cy="128" r="5" fill="#1D549B"/>
        <circle cx="313" cy="159" r="6" fill="#1D549B"/>
        <circle cx="322" cy="190" r="5" fill="#1D549B"/>
        <text x="380" y="264" text-anchor="middle" fill="#11694E" font-size="12" font-weight="700">绕弧放缓 · 延长主体注视</text>
      </g>
    `,
  },
  soft: {
    tag: "对照解剖 · 柔性框架",
    cap: "尖锐折角 vs 曲线亲和",
    note: "Bar & Neta (2006) 证实尖锐轮廓更易诱发防御感，连续曲线则传递安全与亲近。用自然弯弧替代生硬边界，氛围更松弛。",
    svg: `
      <g>
        <rect x="20" y="24" width="218" height="272" rx="10" fill="#F7FBFE" stroke="#9FC4EA" stroke-width="1.5"/>
        <text x="129" y="50" text-anchor="middle" fill="#3B526B" font-size="13" font-weight="700">尖角折框（紧绷锋利）</text>
        <polygon points="184,96 76,96 48,159 76,222 184,222 128,159" fill="none" stroke="#1D549B" stroke-width="6"/>
        <circle cx="122" cy="159" r="22" fill="#EA6B37"/>
        <text x="129" y="264" text-anchor="middle" fill="#9A4508" font-size="12" font-weight="700">折角尖锐 · 情绪偏紧</text>
      </g>
      <g>
        <rect x="260" y="24" width="240" height="272" rx="10" fill="#D4EAFC" stroke="#3576C4" stroke-width="1.5"/>
        <text x="380" y="50" text-anchor="middle" fill="#0B1622" font-size="13" font-weight="800">连续柔弧（温柔庇护）</text>
        <path d="M 418 98 A 76 76 0 1 0 418 220" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
        <path d="M 412 106 A 66 66 0 1 0 412 212" fill="none" stroke="#EA6B37" stroke-width="16" stroke-linecap="round"/>
        <circle cx="368" cy="159" r="26" fill="#EA6B37"/>
        <text x="380" y="264" text-anchor="middle" fill="#11694E" font-size="12" font-weight="700">轮廓平缓 · 舒适安全感</text>
      </g>
    `,
  },
  flow: {
    tag: "对照解剖 · 节奏引导",
    cap: "开口方向释放故事走廊",
    note: "先收后放：弧线先把目光从散乱外围收进圆心，再在开口处铺开一片通透留白，让观众自然顺着方向想象画外故事。",
    svg: `
      <g>
        <rect x="20" y="24" width="480" height="272" rx="12" fill="#D4EAFC" stroke="#3576C4" stroke-width="1.5"/>
        <text x="150" y="54" text-anchor="middle" fill="#B83B0A" font-size="13" font-weight="800">① 弧脊收束与蓄势</text>
        <text x="378" y="54" text-anchor="middle" fill="#1D549B" font-size="13" font-weight="800">② 开口延伸故事走廊</text>
        <path d="M 218 96 A 76 76 0 1 0 218 224" fill="none" stroke="#EA6B37" stroke-width="20"/>
        <path d="M 224 84 A 90 90 0 1 0 224 236" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
        <circle cx="174" cy="160" r="32" fill="#EA6B37"/>
        <path d="M 224 134 L 456 96 M 228 160 L 470 160 M 224 186 L 456 224" stroke="#1D549B" stroke-width="2.4" stroke-dasharray="7 5"/>
        <polygon points="476,160 462,153 465,160 462,167" fill="#1D549B"/>
        <rect x="330" y="136" width="112" height="48" rx="8" fill="#FFFFFF" stroke="#9FC4EA" stroke-width="1.5"/>
        <text x="386" y="157" text-anchor="middle" fill="#0B1622" font-size="12" font-weight="800">留白 / 文案区</text>
        <text x="386" y="174" text-anchor="middle" fill="#3B526B" font-size="10.5">视线自然落脚</text>
      </g>
    `,
  },
};

export function initSection01() {
  const cards = [...document.querySelectorAll(".ana-card")];
  const svg = document.getElementById("anaSvg");
  const tag = document.getElementById("anaVisualTag");
  const cap = document.getElementById("anaVisualCap");
  const note = document.getElementById("anaNote");

  function render(key) {
    const data = ANATOMY_DATA[key] || ANATOMY_DATA.enclose;
    cards.forEach((btn) => {
      const on = btn.dataset.ana === key;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", String(on));
    });
    tag.textContent = data.tag;
    cap.textContent = data.cap;
    note.textContent = data.note;
    svg.innerHTML = data.svg;
  }

  cards.forEach((btn) => btn.addEventListener("click", () => render(btn.dataset.ana)));
  render("enclose");
}

// ---------- 02 节：弧度谱连续扫描 2D 眼动模拟 ----------
export function initSection02() {
  const canvas = document.getElementById("spectrumCanvas");
  const range = document.getElementById("spectrumRange");
  const stopBtns = [...document.querySelectorAll(".stop-btn")];
  const tagEl = document.getElementById("specTag");
  const titleEl = document.getElementById("specTitle");
  const descEl = document.getElementById("specDesc");
  const degEl = document.getElementById("specDeg");
  const gapEl = document.getElementById("specGap");
  const dwellEl = document.getElementById("specDwell");
  const ctx = canvas.getContext("2d");

  let wrapDeg = 225;

  function syncText() {
    const info = evaluateArcSpectrum(wrapDeg);
    tagEl.textContent = info.tag;
    tagEl.className = "spec-badge" + (info.stage === "closed" || info.stage === "shallow" ? " is-err" : info.stage === "tight" ? " is-warn" : "");
    titleEl.textContent = info.title;
    descEl.textContent = info.desc;
    degEl.textContent = `${info.deg}°`;
    gapEl.textContent = `${info.gap}°`;
    dwellEl.textContent = info.dwell;
    range.value = String(info.deg);
    stopBtns.forEach((b) => b.classList.toggle("is-active", Math.abs(Number(b.dataset.deg) - wrapDeg) <= 6));
  }

  function renderFrame(t, _dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = pixelRatio(2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const cssW = rect.width;
    const cssH = rect.height;
    const info = evaluateArcSpectrum(wrapDeg);
    const phase = still ? 0.55 : (t * 0.34) % 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 柔和天蓝底
    ctx.fillStyle = "#D4EAFC";
    ctx.fillRect(0, 0, cssW, cssH);

    const cx = cssW * 0.39;
    const cy = cssH * 0.5;
    const R = Math.min(cssW, cssH) * 0.32;
    const gapRad = ((360 - wrapDeg) * DEG) / 2;
    const startRad = gapRad;
    const endRad = Math.PI * 2 - gapRad;

    // 舒适弧度阴影参照带
    ctx.strokeStyle = "rgba(17, 105, 78, 0.14)";
    ctx.lineWidth = R * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 67 * DEG, (360 - 67) * DEG, false);
    ctx.stroke();

    // 实绘当前弧
    const arcColor =
      info.stage === "sweet"
        ? "#EA6B37"
        : info.stage === "tight"
          ? "#D97706"
          : "#B91C1C";
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = R * 0.24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R, startRad, endRad, false);
    ctx.stroke();

    // 焦点圆
    ctx.fillStyle = "#EA6B37";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${clamp(R * 0.16, 10, 14)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("主体", cx, cy + 4);

    // 眼动模拟轨迹 + 实时眼动红/蓝光点
    ctx.save();
    let eyeX = cx;
    let eyeY = cy;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);

    if (info.stage === "shallow") {
      // 浅弓：视线顺弯滑过直接冲出右上画外
      ctx.strokeStyle = "#B91C1C";
      ctx.beginPath();
      ctx.moveTo(cx - R * 1.15, cy + R * 0.72);
      ctx.quadraticCurveTo(cx - R * 0.75, cy - R * 0.15, cssW * 0.92, cssH * 0.16);
      ctx.stroke();
      const u = phase;
      const p0x = cx - R * 1.15, p0y = cy + R * 0.72;
      const p1x = cx - R * 0.75, p1y = cy - R * 0.15;
      const p2x = cssW * 0.92, p2y = cssH * 0.16;
      eyeX = (1 - u) * (1 - u) * p0x + 2 * (1 - u) * u * p1x + u * u * p2x;
      eyeY = (1 - u) * (1 - u) * p0y + 2 * (1 - u) * u * p1y + u * u * p2y;
    } else if (info.stage === "closed") {
      // 闭口 O 圈：视线困死在圆内打转
      ctx.strokeStyle = "#B91C1C";
      const loopR = R * 0.66;
      ctx.beginPath();
      ctx.arc(cx, cy, loopR, 0, Math.PI * 2);
      ctx.stroke();
      const ang = phase * Math.PI * 4;
      eyeX = cx + Math.cos(ang) * loopR;
      eyeY = cy + Math.sin(ang) * loopR;
    } else {
      // 舒适 C 带：先绕弧减速注视主体，再从右侧开口延展到远方留白
      ctx.strokeStyle = "#1D549B";
      const orbitR = R * 0.68;
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, startRad + 0.12, endRad - 0.12, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + orbitR * 0.9, cy);
      ctx.lineTo(cssW * 0.89, cy);
      ctx.stroke();
      if (phase < 0.62) {
        const sub = phase / 0.62;
        const ang = endRad - 0.12 - sub * (endRad - startRad - 0.24);
        eyeX = cx + Math.cos(ang) * orbitR;
        eyeY = cy + Math.sin(ang) * orbitR;
      } else {
        const sub = (phase - 0.62) / 0.38;
        eyeX = cx + orbitR * 0.6 + sub * (cssW * 0.88 - (cx + orbitR * 0.6));
        eyeY = cy;
      }
    }

    // 绘制眼动示踪光点
    ctx.setLineDash([]);
    ctx.fillStyle = info.stage === "sweet" ? "#1D549B" : "#B91C1C";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 右侧读数注记
    ctx.fillStyle = "#0B1622";
    ctx.font = `700 12px "Space Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`ARC ${wrapDeg}° / GAP ${360 - wrapDeg}°`, cssW - 14, 24);
    ctx.fillStyle = info.stage === "sweet" ? "#11694E" : "#B91C1C";
    ctx.font = `700 12px "Noto Sans SC", sans-serif`;
    ctx.fillText(
      info.stage === "closed"
        ? "视线困死闭环内"
        : info.stage === "shallow"
          ? "视线滑过即散"
          : "绕弧停留 → 开口延展",
      cssW - 14,
      cssH - 16
    );
    ctx.restore();
    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  range.addEventListener("input", () => {
    wrapDeg = Number(range.value);
    syncText();
    ctrl.draw();
  });

  stopBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      wrapDeg = Number(btn.dataset.deg);
      syncText();
      ctrl.draw();
    });
  });

  syncText();
}

// ---------- 03 节：深海暗室四向开口剧场 ----------
export function initSection03() {
  const canvas = document.getElementById("directionCanvas");
  const btns = [...document.querySelectorAll(".compass-card")];
  const dirEn = document.getElementById("dirEn");
  const dirScene = document.getElementById("dirScene");
  const dirWhy = document.getElementById("dirWhy");
  const dirFit = document.getElementById("dirFit");
  const ctx = canvas.getContext("2d");

  let activeId = "right";

  function getStory() {
    return DIRECTION_STORIES.find((d) => d.id === activeId) || DIRECTION_STORIES[0];
  }

  function syncUI() {
    const s = getStory();
    btns.forEach((b) => {
      const on = b.dataset.dir === activeId;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    dirEn.textContent = s.en;
    dirScene.textContent = s.scene;
    dirWhy.textContent = s.why;
    dirFit.textContent = s.fit;
  }

  // 人物纯侧影/背影（严格不画五官！）
  function drawPersonSilhouette(x, y, scale, facingRight = true) {
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.fillStyle = "#081427";
    // 头部剪影（无五官）
    ctx.beginPath();
    ctx.arc(0, -30 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();
    // 外套肩身剪影
    ctx.beginPath();
    ctx.moveTo(-10 * scale, -18 * scale);
    ctx.quadraticCurveTo(0, -22 * scale, 11 * scale, -16 * scale);
    ctx.lineTo(13 * scale, 18 * scale);
    ctx.lineTo(-12 * scale, 18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function renderFrame(t, _dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = pixelRatio(2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const cssW = rect.width;
    const cssH = rect.height;
    const s = getStory();
    const pulse = still ? 0 : Math.sin(t * 1.4) * 3;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 深海普鲁士蓝剧场底幕
    const bg = ctx.createLinearGradient(0, 0, cssW, cssH);
    bg.addColorStop(0, "#0A1E3A");
    bg.addColorStop(1, "#153663");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    // 依据四个方向布置不同弧心与开口余白，使每种方向都自带最佳呼吸区
    const R = Math.min(cssW, cssH) * 0.34;
    let cx = cssW * 0.38;
    let cy = cssH * 0.52;
    if (s.id === "left") { cx = cssW * 0.62; cy = cssH * 0.52; }
    else if (s.id === "up") { cx = cssW * 0.5; cy = cssH * 0.62; }
    else if (s.id === "down") { cx = cssW * 0.5; cy = cssH * 0.4; }

    // 柔暖光晕托起焦点
    const glow = ctx.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 0.95);
    glow.addColorStop(0, "rgba(255, 138, 84, 0.34)");
    glow.addColorStop(1, "rgba(255, 138, 84, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // 画剧场 C 弧
    const openRad = s.openDeg * DEG;
    const gapHalf = 68 * DEG;
    ctx.strokeStyle = "#FF8A54";
    ctx.lineWidth = Math.max(14, R * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R, openRad + gapHalf, openRad + Math.PI * 2 - gapHalf, false);
    ctx.stroke();

    // 细亮外伴弧
    ctx.strokeStyle = "rgba(121, 189, 255, 0.72)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, openRad + gapHalf - 0.05, openRad + Math.PI * 2 - gapHalf + 0.05, false);
    ctx.stroke();

    // 5 条开口光束扇
    ctx.strokeStyle = "#79BDFF";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = still ? 0 : -(t * 18) % 14;
    for (let i = -2; i <= 2; i++) {
      const ang = openRad + i * 15 * DEG;
      const sx = cx + Math.cos(ang) * (R * 0.52);
      const sy = cy + Math.sin(ang) * (R * 0.52);
      const ex = cx + Math.cos(ang) * (R * 1.72 + pulse);
      const ey = cy + Math.sin(ang) * (R * 1.72 + pulse);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 场景剪影主体（纯无五官剪影 / 几何场景）
    ctx.fillStyle = "#FF8A54";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2);
    ctx.fill();

    if (s.id === "right" || s.id === "left") {
      drawPersonSilhouette(cx, cy + R * 0.08, R / 96, s.id === "right");
    } else if (s.id === "up") {
      // 明月与上升航帆剪影
      ctx.fillStyle = "#FFF5E8";
      ctx.beginPath();
      ctx.arc(cx, cy - R * 0.02, R * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#79BDFF";
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 1.15);
      ctx.lineTo(cx + 12, cy - R * 0.88);
      ctx.lineTo(cx - 4, cy - R * 0.88);
      ctx.closePath();
      ctx.fill();
    } else {
      // 穹顶下向前景延伸的小径
      ctx.fillStyle = "rgba(121, 189, 255, 0.32)";
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + R * 0.34);
      ctx.lineTo(cx + 10, cy + R * 0.34);
      ctx.lineTo(cx + R * 0.65, cssH);
      ctx.lineTo(cx - R * 0.65, cssH);
      ctx.closePath();
      ctx.fill();
      drawPersonSilhouette(cx, cy + R * 0.08, R / 102, true);
    }

    // 右上角方向读数
    ctx.fillStyle = "#EFF6FF";
    ctx.font = `700 12px "Space Mono", monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`OPEN ${s.openDeg}° ${s.arrow}`, cssW - 16, 26);

    ctx.restore();
  }

  const ctrl = loop(canvas, renderFrame);

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      activeId = b.dataset.dir;
      syncUI();
      ctrl.draw();
    });
  });

  syncUI();
}

// ---------- 04 节：《神奈川冲浪里》双层 C 弧结构矢量拆解 ----------
export function initSection04() {
  const svg = document.getElementById("waveSvg");
  const chkOuter = document.getElementById("chkOuterC");
  const chkBoat = document.getElementById("chkBoatC");
  const chkFan = document.getElementById("chkOpenFan");
  const chkFlat = document.getElementById("chkFlatten");
  const tag = document.getElementById("waveModeTag");
  const note = document.getElementById("waveNote");

  function render() {
    const flat = chkFlat.checked;
    const showOuter = chkOuter.checked && !flat;
    const showBoat = chkBoat.checked;
    const showFan = chkFan.checked && !flat;

    tag.textContent = flat ? "抹平浪弧 · 焦点失势" : "双弧叠抱富士";
    note.textContent = flat
      ? "把巨浪的钩状 C 弧抹成普通水平波浪后，远景矮小的富士山立刻孤零零地沉没在宽阔背景里，失去了被巨浪怀抱的戏剧聚焦。"
      : "左侧巨浪卷成一道巨大的顺时针 C 弧，把远方矮小的富士山稳稳包在怀中；下方的押送船也弯成一条更柔的内弧。试着勾选「抹平浪弧」，富士山立刻失去压迫与聚焦。";

    const waveBody = flat
      ? `<path d="M0 245 Q140 228 280 245 T560 240 L560 360 L0 360 Z" fill="#1D549B" opacity="0.72"/>
         <path d="M0 278 Q160 264 320 280 T560 274 L560 360 L0 360 Z" fill="#0B2240" opacity="0.82"/>`
      : `<path d="M 0 360 L 0 198 C 46 92, 178 24, 304 54 C 344 64, 366 86, 352 104 C 324 92, 272 90, 224 124 C 164 166, 166 238, 226 266 C 306 302, 434 268, 560 220 L 560 360 Z" fill="#1D549B" opacity="0.88"/>
         <path d="M 278 52 C 316 58, 356 76, 362 96 C 344 92, 326 106, 314 114 C 306 94, 286 82, 260 80 Z" fill="#FFFFFF"/>
         <path d="M 0 288 C 110 244, 220 318, 358 308 C 446 302, 504 274, 560 258 L 560 360 L 0 360 Z" fill="#0B2240" opacity="0.82"/>`;

    const outerOverlay = showOuter
      ? `<path d="M 332 74 C 194 42, 82 146, 134 246 C 172 318, 284 316, 362 276" fill="none" stroke="#EA6B37" stroke-width="7" stroke-linecap="round"/>
         <rect x="26" y="34" width="96" height="24" rx="12" fill="rgba(255,255,255,0.92)" stroke="#EA6B37" stroke-width="1.2"/>
         <text x="74" y="50" text-anchor="middle" fill="#B83B0A" font-size="12" font-weight="800">巨浪外 C 弧</text>`
      : "";

    const boatOverlay = showBoat
      ? `<path d="M 186 244 Q 290 294 426 242" fill="none" stroke="#FA8252" stroke-width="4.5" stroke-dasharray="7 4" stroke-linecap="round"/>
         <text x="310" y="302" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="700">押送船内 C 弧</text>`
      : "";

    const fanOverlay = showFan
      ? `<g stroke="#3173C6" stroke-width="2" stroke-dasharray="6 4">
           <line x1="364" y1="186" x2="516" y2="116"/>
           <line x1="370" y1="204" x2="532" y2="176"/>
           <line x1="366" y1="220" x2="520" y2="234"/>
         </g>
         <text x="478" y="96" text-anchor="middle" fill="#1D549B" font-size="12" font-weight="800">右侧开口海天</text>`
      : "";

    svg.innerHTML = `
      <rect width="560" height="360" fill="#E8F3FC"/>
      <rect y="0" width="560" height="225" fill="#F4EDE2" opacity="0.65"/>
      <!-- 富士山焦点 -->
      <path d="M 284 226 L 334 156 L 384 226 Z" fill="#183A66"/>
      <path d="M 318 178 L 334 156 L 350 178 L 341 174 L 334 182 L 327 174 Z" fill="#FFFFFF"/>
      <circle cx="334" cy="196" r="36" fill="none" stroke="#EA6B37" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="334" y="144" text-anchor="middle" fill="#B83B0A" font-size="12" font-weight="800">视觉焦点 · 富士山</text>
      ${waveBody}
      ${outerOverlay}
      ${boatOverlay}
      ${fanOverlay}
    `;
  }

  [chkOuter, chkBoat, chkFan, chkFlat].forEach((el) => el.addEventListener("change", render));
  render();
}

// ---------- 06 节：小练习四选一 ----------
function buildQuizThumbSvg(opt, revealed) {
  const W = 240;
  const H = 152;
  const cx = opt.arcCenter.u * W;
  const cy = opt.arcCenter.v * H;
  const fx = opt.focus.u * W;
  const fy = opt.focus.v * H;
  const R = H * 0.34;

  const gapRad = ((360 - opt.wrapDeg) * DEG) / 2;
  const startRad = opt.openDeg * DEG + gapRad;
  const endRad = opt.openDeg * DEG + Math.PI * 2 - gapRad;
  const sx = cx + Math.cos(startRad) * R;
  const sy = cy + Math.sin(startRad) * R;
  const ex = cx + Math.cos(endRad) * R;
  const ey = cy + Math.sin(endRad) * R;
  const largeArc = opt.wrapDeg > 180 ? 1 : 0;

  let overlay = "";
  if (revealed) {
    const col = opt.correct ? "#11694E" : "#B91C1C";
    if (opt.id === "A") {
      overlay = `<circle cx="${cx}" cy="${cy}" r="${R * 0.65}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/>`;
    } else if (opt.id === "B") {
      overlay = `<line x1="${fx + 14}" y1="${fy}" x2="${W - 4}" y2="${fy}" stroke="${col}" stroke-width="2.4" stroke-dasharray="4 3"/><line x1="${W - 4}" y1="${fy - 18}" x2="${W - 4}" y2="${fy + 18}" stroke="${col}" stroke-width="4"/>`;
    } else if (opt.id === "C") {
      overlay = `<g stroke="${col}" stroke-width="2" stroke-dasharray="5 3"><line x1="${fx + 16}" y1="${fy - 10}" x2="${W - 14}" y2="${fy - 26}"/><line x1="${fx + 18}" y1="${fy}" x2="${W - 10}" y2="${fy}"/><line x1="${fx + 16}" y1="${fy + 10}" x2="${W - 14}" y2="${fy + 26}"/></g>`;
    } else {
      overlay = `<line x1="${cx}" y1="${cy}" x2="${fx}" y2="${fy}" stroke="${col}" stroke-width="2" stroke-dasharray="4 3"/>`;
    }
  }

  return `
    <svg class="quiz-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <rect width="${W}" height="${H}" fill="#D4EAFC"/>
      <rect y="${H * 0.58}" width="${W}" height="${H * 0.42}" fill="#9AC4EB" opacity="0.55"/>
      <path d="M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 ${largeArc} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#EA6B37" stroke-width="11" stroke-linecap="round"/>
      <!-- 孤岛灯塔主体 -->
      <circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="15" fill="#EA6B37"/>
      <polygon points="${(fx - 4).toFixed(1)},${(fy + 8).toFixed(1)} ${(fx - 2.5).toFixed(1)},${(fy - 7).toFixed(1)} ${(fx + 2.5).toFixed(1)},${(fy - 7).toFixed(1)} ${(fx + 4).toFixed(1)},${(fy + 8).toFixed(1)}" fill="#FFFFFF"/>
      ${overlay}
    </svg>
  `;
}

export function initSection06() {
  const grid = document.getElementById("quizGrid");
  const fb = document.getElementById("quizFeedback");
  const fbBadge = document.getElementById("quizFbBadge");
  const fbText = document.getElementById("quizFbText");
  const retry = document.getElementById("quizRetry");

  let pickedId = null;

  function render() {
    grid.innerHTML = "";
    QUIZ_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-card";
      btn.dataset.opt = opt.id;

      let mark = "";
      if (pickedId) {
        if (opt.id === pickedId && opt.correct) {
          btn.classList.add("is-picked-ok");
          mark = "✓ 选对了";
        } else if (opt.id === pickedId && !opt.correct) {
          btn.classList.add("is-picked-err");
          mark = "× 再想想";
        } else if (opt.correct) {
          btn.classList.add("is-reveal-ok");
          mark = "✓ 成立解";
        }
      }

      btn.innerHTML = `
        <span class="quiz-head">
          <span class="quiz-letter">${opt.label}</span>
          <span class="quiz-mark">${mark}</span>
        </span>
        ${buildQuizThumbSvg(opt, Boolean(pickedId))}
        <span class="quiz-cap">${opt.caption}</span>
      `;
      btn.addEventListener("click", () => {
        pickedId = opt.id;
        render();
        fb.hidden = false;
        fb.className = "quiz-feedback " + (opt.correct ? "is-ok" : "is-err");
        fbBadge.textContent = opt.correct ? `答对了 · ${opt.label} 最成立` : `你选了 ${opt.label} · 正确答案是方案 C`;
        fbText.textContent = opt.feedback;
      });
      grid.appendChild(btn);
    });
  }

  retry.addEventListener("click", () => {
    pickedId = null;
    fb.hidden = true;
    render();
  });

  render();
}

// ---------- 07 节：原海报放大灯箱（复用 #poster.src，支持滚轮/按钮缩放、拖动、Esc 关闭） ----------
export function initPosterLightbox() {
  const openBtn = document.getElementById("posterOpenBtn");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("posterLightbox");
  const viewport = document.getElementById("lbViewport");
  const lbImg = document.getElementById("lbImg");
  const zoomLabel = document.getElementById("lbZoomLabel");
  const btnIn = document.getElementById("lbZoomIn");
  const btnOut = document.getElementById("lbZoomOut");
  const btnReset = document.getElementById("lbReset");
  const btnClose = document.getElementById("lbClose");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function reset() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  }

  function open() {
    if (!lbImg.src) lbImg.src = posterImg.src;
    reset();
    modal.hidden = false;
    btnClose.focus();
  }

  function close() {
    modal.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  btnReset.addEventListener("click", reset);
  btnIn.addEventListener("click", () => {
    scale = clamp(scale + 0.35, 0.8, 3.2);
    applyTransform();
  });
  btnOut.addEventListener("click", () => {
    scale = clamp(scale - 0.35, 0.8, 3.2);
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      scale = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 0.8, 3.2);
      if (scale <= 1) { tx = 0; ty = 0; }
      applyTransform();
    },
    { passive: false }
  );

  viewport.addEventListener("pointerdown", (e) => {
    if (e.target === viewport && scale <= 1.05) {
      close();
      return;
    }
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    try { viewport.setPointerCapture(e.pointerId); } catch {}
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });

  viewport.addEventListener("pointerup", () => { dragging = false; });
  viewport.addEventListener("pointercancel", () => { dragging = false; });
  viewport.addEventListener("dblclick", reset);

  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });
}
