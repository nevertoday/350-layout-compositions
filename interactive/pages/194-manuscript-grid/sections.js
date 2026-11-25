// 正文各小节交互引擎（01–08 节，相邻节互不复用同款控件）

import { loop, pixelRatio } from "../../lib/stage.js";
import { PALETTE, buildSpreadSvg } from "./model.js";

// ==================== 01 节：对开书页折叠与握持姿势检查器 ====================
export function initSec01() {
  const host = document.getElementById("sec01-svg");
  const statSpine = document.getElementById("sec01-spine");
  const statThumb = document.getElementById("sec01-thumb");
  const noteEl = document.getElementById("sec01-note");
  if (!host) return;

  const MODES = {
    equal: {
      label: "单页等距 18% / 18%",
      margins: { inner: 0.18, outer: 0.18, top: 0.16, bottom: 0.22 },
      spineText: "内+内 = 36%（外距的 2 倍）",
      note: "单页看似端正的「左右各 18%」，装订成对开书页后，两页内边距在中缝拼出 36% 的宽阔白河，左右两页像是彼此疏离的两张纸。",
    },
    canon: {
      label: "对开 2:3:4:6（内窄外宽）",
      margins: { inner: 1 / 9, outer: 2 / 9, top: 1 / 9, bottom: 2 / 9 },
      spineText: "内+内 = 22.2%（恰与外距相等）",
      note: "经典九分法把订口内距收为 11.1%、切口外距放宽到 22.2%：两页并拢后中缝合计 22.2%，与左右外缘等宽，整跨页形成统一的三段白带，拇指也有充足落点。",
    },
    cramped: {
      label: "满版压缩 6% / 6%",
      margins: { inner: 0.06, outer: 0.06, top: 0.06, bottom: 0.07 },
      spineText: "内+内 = 12%（文字坠入装订缝）",
      note: "为省纸把四边缩到 6%：内侧文字被书脊弧度吞掉，外侧文字被握书拇指压住，读者每翻一页都要用力把书压平。",
    },
  };

  let curMode = "equal";
  let curPosture = "hands";

  const modeBtns = [...document.querySelectorAll("[data-s1-mode]")];
  const postureBtns = [...document.querySelectorAll("[data-s1-posture]")];

  function render() {
    const m = MODES[curMode];
    const showThumbs = curPosture === "hands";
    const showSpine = curPosture === "flat" || curMode === "equal" || curMode === "canon";
    const showLabels = curPosture === "annotate";

    host.innerHTML = buildSpreadSvg(m.margins, {
      showThumbs,
      showSpineCallout: showSpine,
      showLabels,
    });

    if (statSpine) statSpine.textContent = m.spineText;
    if (statThumb) {
      if (curPosture === "hands") {
        statThumb.textContent = m.margins.outer < 0.125 ? "拇指遮挡外侧字行" : "拇指安稳落在白边内";
      } else if (curPosture === "flat") {
        statThumb.textContent = curMode === "equal" ? "中缝白河割裂双页" : curMode === "canon" ? "三段竖白等宽呼吸" : "书脊吞字难平摊";
      } else {
        statThumb.textContent = m.margins.outer >= 0.2 ? "外缘足宽可写批注" : "外缘偏窄难容眉注";
      }
    }
    if (noteEl) noteEl.textContent = m.note;

    modeBtns.forEach((b) => {
      const on = b.dataset.s1Mode === curMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    postureBtns.forEach((b) => {
      const on = b.dataset.s1Posture === curPosture;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  modeBtns.forEach((b) => b.addEventListener("click", () => { curMode = b.dataset.s1Mode; render(); }));
  postureBtns.forEach((b) => b.addEventListener("click", () => { curPosture = b.dataset.s1Posture; render(); }));
  render();
}

// ==================== 02 节：实测 DOM 排版试读台 ====================
export function initSec02() {
  const sheet = document.getElementById("sec02-specimen");
  const para = document.getElementById("sec02-para");
  const outCpl = document.getElementById("sec02-cpl");
  const outLines = document.getElementById("sec02-lines");
  const outVerdict = document.getElementById("sec02-verdict");
  if (!sheet || !para) return;

  const WIDTHS = {
    narrow: { em: 15, label: "过碎窄条" },
    literary: { em: 28, label: "文学舒适带" },
    academic: { em: 34, label: "学术上沿" },
    wide: { em: 48, label: "宽屏失控" },
  };
  let curWidth = "literary";
  let curSize = 16;
  let curLead = 1.72;

  const widthCards = [...document.querySelectorAll("[data-s2-width]")];
  const sizeBtns = [...document.querySelectorAll("[data-s2-size]")];
  const leadBtns = [...document.querySelectorAll("[data-s2-lead]")];

  function measureDOMLines() {
    const textNode = para.firstChild;
    if (!textNode || textNode.nodeType !== 3) return { avgChars: 0, lineCount: 0 };
    const text = textNode.textContent;
    const range = document.createRange();
    const lineBuckets = [];
    let lastTop = null;
    for (let i = 0; i < text.length; i++) {
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const r = range.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (lastTop === null || Math.abs(r.top - lastTop) > 4) {
        lineBuckets.push(1);
        lastTop = r.top;
      } else {
        lineBuckets[lineBuckets.length - 1] += 1;
      }
    }
    range.detach?.();
    // 用除末行外的实测均值代表满行字数
    const fullLines = lineBuckets.length > 1 ? lineBuckets.slice(0, -1) : lineBuckets;
    const avgChars = fullLines.length
      ? Math.round(fullLines.reduce((a, b) => a + b, 0) / fullLines.length)
      : 0;
    return { avgChars, lineCount: lineBuckets.length };
  }

  function apply() {
    const w = WIDTHS[curWidth];
    para.style.maxWidth = `${w.em}em`;
    para.style.fontSize = `${curSize}px`;
    para.style.lineHeight = String(curLead);

    widthCards.forEach((b) => {
      const on = b.dataset.s2Width === curWidth;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    sizeBtns.forEach((b) => {
      const on = Number(b.dataset.s2Size) === curSize;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    leadBtns.forEach((b) => {
      const on = Number(b.dataset.s2Lead) === curLead;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    requestAnimationFrame(() => {
      const { avgChars, lineCount } = measureDOMLines();
      const narrowViewport = sheet.getBoundingClientRect().width < 420;
      if (outCpl) outCpl.textContent = avgChars ? `约 ${avgChars} 字 / 行` : `${w.em} 字宽`;
      if (outLines) outLines.textContent = `实测折成 ${lineCount} 行 · 行距 ${curLead.toFixed(2)}×`;
      if (outVerdict) {
        if (avgChars > 36) {
          outVerdict.textContent = "实测偏长：行尾回扫角度过平，读到第三行就容易串回上一行（哪怕字号调大，仍需靠左右边距收窄行宽）。";
          outVerdict.dataset.state = "warn";
        } else if (avgChars < 20 && !(narrowViewport && (curWidth === "literary" || curWidth === "academic"))) {
          outVerdict.textContent = "实测偏短：一个完整长句被切碎成三四行，眼睛刚进入语义就被迫不断折返。";
          outVerdict.dataset.state = "warn";
        } else if (curLead < 1.5) {
          outVerdict.textContent = "行宽合适，但行距压紧到 1.25× 后上下笔画逼近，版面变暗成一块灰墙。";
          outVerdict.dataset.state = "warn";
        } else if (curLead > 2.05) {
          outVerdict.textContent = "行宽合适，但 2.15× 行距让行间白缝宽于字高，段落被拆成彼此分离的横带。";
          outVerdict.dataset.state = "warn";
        } else if (narrowViewport && avgChars < 20) {
          outVerdict.textContent = `受当前手机竖屏宽度限制，实测折为 ${avgChars} 字/行；在桌面或平板上，${w.em}em 正落入 24–34 字长文经验舒适带。`;
          outVerdict.dataset.state = "ok";
        } else {
          outVerdict.textContent = "落入长文经验舒适带：约 24–34 字配合 1.60×–1.85× 行距，视线顺滑回扫、墨色均匀柔和。";
          outVerdict.dataset.state = "ok";
        }
      }
    });
  }

  widthCards.forEach((b) => b.addEventListener("click", () => { curWidth = b.dataset.s2Width; apply(); }));
  sizeBtns.forEach((b) => b.addEventListener("click", () => { curSize = Number(b.dataset.s2Size); apply(); }));
  leadBtns.forEach((b) => b.addEventListener("click", () => { curLead = Number(b.dataset.s2Lead); apply(); }));
  new ResizeObserver(() => apply()).observe(sheet);
  apply();
}

// ==================== 03 节：古典九分与东西双轨分步作图画布（深墨橄榄暗室） ====================
export function initSec03() {
  const canvas = document.getElementById("sec03-canvas");
  const caption = document.getElementById("sec03-caption");
  const stepBtns = [...document.querySelectorAll("[data-s3-step]")];
  const traditionBtns = [...document.querySelectorAll("[data-s3-tradition]")];
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let tradition = "west"; // "west" | "song"
  let step = 4; // 1..4
  let progress = 1;

  const WEST_NOTES = {
    1: "第 1 步：在 2:3 经典双页对开上，拉出跨页大对角线（从左下角直抵右上角，与对称的左上角至右下角）。",
    2: "第 2 步：再画出左右单页各自的对角线——单页对角线与跨页大对角线的交点，落在距内边 1/3、距顶边 1/3 的精确几何点。",
    3: "第 3 步：从左/右交点垂直向上引至顶边，再向内对角折射，便精准切出 1/9 网格（九分法），无需任何毫米刻度尺。",
    4: "第 4 步：锁定九分版心——内 1/9、天 1/9、外 2/9、地 2/9。在 2:3 开本上折合真实长度正是 2:3:4:6，版心高等于页宽，面积占 4/9。",
  };
  const SONG_NOTE =
    "宋版线装古籍「天大於地」：书页竖排右起，天头（上白）常比地脚（下白）宽出近一倍，专供读者以朱墨写眉批校勘；中缝「版心」刻书名、卷次与鱼尾，折页装订后自然成界。";

  let cw = 640;
  let ch = 360;
  let s3Dirty = true;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    const nw = Math.round(r.width * dpr);
    const nh = Math.round(r.height * dpr);
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
      s3Dirty = true;
    }
    cw = r.width;
    ch = r.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function lerpLine(x1, y1, x2, y2, p) {
    if (p <= 0) return;
    const t = Math.min(1, p);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
    ctx.stroke();
  }

  function drawWest(p) {
    const padX = Math.max(24, cw * 0.08);
    const padY = Math.max(24, ch * 0.09);
    const availW = cw - padX * 2;
    const availH = ch - padY * 2;
    // 2:3 单页 → 双页宽:高 = 4:3
    const spreadRatio = 4 / 3;
    let sw, sh;
    if (availW / availH > spreadRatio) {
      sh = availH;
      sw = sh * spreadRatio;
    } else {
      sw = availW;
      sh = sw / spreadRatio;
    }
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;
    const pw = sw / 2;
    const midX = sx + pw;

    // 暗室纸页轮廓
    ctx.fillStyle = "#2A2518";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = "#8C7D53";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.beginPath();
    ctx.moveTo(midX, sy);
    ctx.lineTo(midX, sy + sh);
    ctx.stroke();

    // 第 1 步：双页大对角线
    if (step >= 1) {
      const p1 = step === 1 ? p : 1;
      ctx.strokeStyle = "rgba(194, 177, 111, 0.72)";
      ctx.lineWidth = 1.25;
      lerpLine(sx, sy + sh, sx + sw, sy, p1);
      lerpLine(sx, sy, sx + sw, sy + sh, p1);
    }

    // 第 2 步：单页对角线 + 交点
    if (step >= 2) {
      const p2 = step === 2 ? p : 1;
      ctx.strokeStyle = "rgba(232, 122, 92, 0.75)";
      ctx.lineWidth = 1.2;
      lerpLine(sx, sy + sh, midX, sy, p2);
      lerpLine(midX, sy, sx + sw, sy + sh, p2);

      // 关键交点 (左页 x = sx + 2/3*pw, y = sy + 1/3*sh; 右页 x = midX + 1/3*pw, y = sy + 1/3*sh)
      if (p2 > 0.65) {
        const pts = [
          [sx + (2 / 3) * pw, sy + (1 / 3) * sh],
          [midX + (1 / 3) * pw, sy + (1 / 3) * sh],
        ];
        ctx.fillStyle = PALETTE.darkCinnabar;
        for (const [ix, iy] of pts) {
          ctx.beginPath();
          ctx.arc(ix, iy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 第 3 步：向上垂线与折射九分线
    if (step >= 3) {
      const p3 = step === 3 ? p : 1;
      const rx1 = midX + (1 / 3) * pw;
      const ry1 = sy + (1 / 3) * sh;
      ctx.strokeStyle = "rgba(167, 199, 128, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      // 右页垂线上引至顶边，再连至中缝顶边交点折射出 1/9
      lerpLine(rx1, ry1, rx1, sy, p3);
      lerpLine(rx1, sy, midX, sy + (1 / 3) * sh, p3);
      // 左页对称垂线
      const lx1 = sx + (2 / 3) * pw;
      lerpLine(lx1, ry1, lx1, sy, p3);
      lerpLine(lx1, sy, midX, sy + (1 / 3) * sh, p3);
      ctx.setLineDash([]);

      // 淡绘 9×9 参考格
      ctx.strokeStyle = "rgba(194, 177, 111, 0.16)";
      ctx.lineWidth = 0.7;
      for (let i = 1; i < 9; i++) {
        const fx = i / 9;
        ctx.beginPath();
        ctx.moveTo(midX + pw * fx, sy); ctx.lineTo(midX + pw * fx, sy + sh);
        ctx.moveTo(sx + pw * fx, sy); ctx.lineTo(sx + pw * fx, sy + sh);
        ctx.moveTo(sx, sy + sh * fx); ctx.lineTo(sx + sw, sy + sh * fx);
        ctx.stroke();
      }
    }

    // 第 4 步：锁定 2:3:4:6 黄金九分版心
    if (step >= 4) {
      const p4 = step === 4 ? p : 1;
      const lBox = { x: sx + (2 / 9) * pw, y: sy + (1 / 9) * sh, w: (6 / 9) * pw, h: (6 / 9) * sh };
      const rBox = { x: midX + (1 / 9) * pw, y: sy + (1 / 9) * sh, w: (6 / 9) * pw, h: (6 / 9) * sh };

      ctx.fillStyle = `rgba(245, 238, 224, ${(0.14 * p4).toFixed(3)})`;
      ctx.fillRect(lBox.x, lBox.y, lBox.w, lBox.h);
      ctx.fillRect(rBox.x, rBox.y, rBox.w, rBox.h);

      ctx.strokeStyle = PALETTE.darkPaper;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(lBox.x, lBox.y, lBox.w * p4, lBox.h * p4);
      ctx.strokeRect(rBox.x, rBox.y, rBox.w * p4, rBox.h * p4);

      if (p4 > 0.7) {
        const cx = rBox.x + rBox.w / 2;
        const headFs = Math.max(10, Math.min(13.5, rBox.w * 0.155));
        const subFs = Math.max(8.5, Math.min(11, rBox.w * 0.105));
        ctx.fillStyle = PALETTE.darkPaper;
        ctx.font = `700 ${headFs.toFixed(1)}px "Space Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("2:3:4:6", cx, rBox.y + rBox.h * 0.42);
        ctx.font = `400 ${subFs.toFixed(1)}px "Noto Serif SC", serif`;
        ctx.fillStyle = PALETTE.darkOlive;
        ctx.fillText("版心高 = 页宽", cx, rBox.y + rBox.h * 0.56);
        ctx.fillText("占纸面 4/9", cx, rBox.y + rBox.h * 0.68);

        // 标注四个方向份数（带深底铭牌防压线与防撞版心文字）
        const lblFs = Math.max(8.5, Math.min(11, pw * 0.068));
        ctx.font = `700 ${lblFs.toFixed(1)}px "Space Mono", "Noto Serif SC", serif`;
        const drawPill = (txt, x, y) => {
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = "rgba(32, 28, 18, 0.88)";
          ctx.fillRect(x - tw / 2 - 4, y - lblFs * 0.65, tw + 8, lblFs * 1.3);
          ctx.fillStyle = PALETTE.darkCinnabar;
          ctx.fillText(txt, x, y + 0.5);
        };
        const compact = pw < 155;
        drawPill(compact ? "内2" : "内 2", midX + (0.5 / 9) * pw, rBox.y + rBox.h * 0.22);
        drawPill(compact ? "外4" : "外 4", midX + (8 / 9) * pw, rBox.y + rBox.h * 0.50);
        drawPill(compact ? "天3" : "天 3", cx, sy + (0.5 / 9) * sh);
        drawPill(compact ? "地6" : "地 6", cx, sy + (8 / 9) * sh);
      }
    }
  }

  function drawSong(p) {
    const padX = Math.max(24, cw * 0.08);
    const padY = Math.max(24, ch * 0.09);
    const availW = cw - padX * 2;
    const availH = ch - padY * 2;
    const ratio = 4 / 3;
    let sw, sh;
    if (availW / availH > ratio) { sh = availH; sw = sh * ratio; }
    else { sw = availW; sh = sw / ratio; }
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;
    const midX = sx + sw / 2;

    // 宋版整叶摊开（中间为折口版心，左右两半叶）
    ctx.fillStyle = "#2A2518";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = "#8C7D53";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(sx, sy, sw, sh);

    // 天大於地：天头 24%、地脚 11%
    const tHead = sh * 0.24;
    const bFoot = sh * 0.11;
    const sidePad = sw * 0.06;
    const fx = sx + sidePad;
    const fy = sy + tHead;
    const fw = sw - sidePad * 2;
    const fh = sh - tHead - bFoot;

    // 天头朱批示意区
    ctx.fillStyle = `rgba(232, 122, 92, ${(0.12 * p).toFixed(3)})`;
    ctx.fillRect(sx + 1, sy + 1, sw - 2, tHead - 2);

    // 四周双边版框（古籍常见形制）
    ctx.strokeStyle = PALETTE.darkPaper;
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.lineWidth = 0.8;
    ctx.strokeRect(fx + 3, fy + 3, fw - 6, fh - 6);

    // 中央版心与鱼尾
    const spineW = sw * 0.065;
    ctx.fillStyle = "#201C12";
    ctx.fillRect(midX - spineW / 2, fy + 3, spineW, fh - 6);
    ctx.strokeStyle = PALETTE.darkOlive;
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - spineW / 2, fy + 3, spineW, fh - 6);
    // 上鱼尾符号
    const ywY = fy + fh * 0.26;
    ctx.fillStyle = PALETTE.darkPaper;
    ctx.beginPath();
    ctx.moveTo(midX - spineW * 0.42, ywY);
    ctx.lineTo(midX + spineW * 0.42, ywY);
    ctx.lineTo(midX + spineW * 0.42, ywY + 9);
    ctx.lineTo(midX, ywY + 4);
    ctx.lineTo(midX - spineW * 0.42, ywY + 9);
    ctx.closePath();
    ctx.fill();

    // 乌丝栏竖界行
    const cols = 7;
    const halfW = (fw - spineW) / 2 - 4;
    ctx.strokeStyle = "rgba(194, 177, 111, 0.35)";
    ctx.lineWidth = 0.8;
    for (let c = 1; c < cols; c++) {
      const lx = fx + 3 + (halfW / cols) * c;
      const rx = midX + spineW / 2 + (halfW / cols) * c;
      ctx.beginPath();
      ctx.moveTo(lx, fy + 3); ctx.lineTo(lx, fy + fh - 3);
      ctx.moveTo(rx, fy + 3); ctx.lineTo(rx, fy + fh - 3);
      ctx.stroke();
    }

    // 朱笔眉批示意与标尺文字（按画幅自适应字号，手机端绝不溢边）
    const headFs = Math.max(9.5, Math.min(12, sw * 0.036));
    const footFs = Math.max(9, Math.min(11, sw * 0.033));
    ctx.fillStyle = PALETTE.darkCinnabar;
    ctx.font = `500 ${headFs.toFixed(1)}px "LXGW WenKai", "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("天头宽阔（约 24%）· 专留朱墨眉批校勘", sx + sw * 0.5, sy + tHead * 0.5);

    ctx.fillStyle = PALETTE.darkOlive;
    ctx.font = `400 ${footFs.toFixed(1)}px "Noto Serif SC", serif`;
    ctx.fillText("地脚偏窄（约 11%）· 雕版刷印定位基准", sx + sw * 0.5, sy + sh - bFoot * 0.5);
  }

  const s3Loop = loop(canvas, (_t, dt, { still }) => {
    if (still) {
      progress = 1;
      s3Dirty = true;
    } else if (progress < 1) {
      progress = Math.min(1, progress + (dt || 0.016) * 1.9);
      s3Dirty = true;
    }
    if (!s3Dirty) return;
    s3Dirty = false;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = PALETTE.darkChamber;
    ctx.fillRect(0, 0, cw, ch);
    if (tradition === "west") drawWest(progress);
    else drawSong(progress);
  });

  function sync(animate = true) {
    traditionBtns.forEach((b) => {
      const on = b.dataset.s3Tradition === tradition;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    stepBtns.forEach((b) => {
      const on = tradition === "west" && Number(b.dataset.s3Step) === step;
      b.classList.toggle("is-active", on);
      b.disabled = tradition !== "west";
      b.setAttribute("aria-pressed", String(on));
    });
    if (caption) {
      caption.textContent = tradition === "west" ? WEST_NOTES[step] : SONG_NOTE;
    }
    progress = animate ? 0 : 1;
    s3Dirty = true;
    s3Loop.draw();
  }

  traditionBtns.forEach((b) => b.addEventListener("click", () => { tradition = b.dataset.s3Tradition; sync(true); }));
  stepBtns.forEach((b) => b.addEventListener("click", () => { tradition = "west"; step = Number(b.dataset.s3Step); sync(true); }));
  new ResizeObserver(() => { resize(); s3Dirty = true; s3Loop.draw(); }).observe(canvas);
  resize();
  sync(false);
  document.fonts?.ready?.then(() => {
    s3Dirty = true;
    s3Loop.draw();
  });
}

// ==================== 04 节：三跨页书稿结构开关板 ====================
export function initSec04() {
  const host = document.getElementById("sec04-spreads");
  const summary = document.getElementById("sec04-summary");
  const toggles = [...document.querySelectorAll("[data-s4-part]")];
  if (!host) return;

  const parts = {
    sinkage: true,
    header: true,
    marginalia: false,
    folio: true,
    bleed: false,
  };

  function render() {
    host.dataset.sinkage = parts.sinkage ? "1" : "0";
    host.dataset.header = parts.header ? "1" : "0";
    host.dataset.marginalia = parts.marginalia ? "1" : "0";
    host.dataset.folio = parts.folio ? "1" : "0";
    host.dataset.bleed = parts.bleed ? "1" : "0";

    toggles.forEach((b) => {
      const k = b.dataset.s4Part;
      const on = !!parts[k];
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    const active = [];
    if (parts.sinkage) active.push("章首下沉留出呼吸");
    if (parts.header) active.push("书眉安静落在天头");
    if (parts.marginalia) active.push("旁注借外边距伴读");
    if (parts.folio) active.push("页码锚定地脚中线");
    if (parts.bleed) active.push("满宽图版破出单页节奏");
    if (summary) {
      summary.textContent = active.length
        ? `当前启用 ${active.length} 项结构件（${active.join("、")}）：三组跨页形态各异，但底层版心四边线始终纹丝不动，读者翻页不会迷失秩序。`
        : "全部辅助件已关闭：只剩最纯粹的单块手稿版心——极度克制，适合诗集或纯粹的沉浸阅读。";
    }
  }

  toggles.forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.s4Part;
      parts[k] = !parts[k];
      render();
    });
  });
  render();
}

// ==================== 05 节：网格家族题材配对切换器 ====================
export function initSec05() {
  const btns = [...document.querySelectorAll("[data-s5-brief]")];
  const diagram = document.getElementById("sec05-diagram");
  const verdict = document.getElementById("sec05-verdict");
  const detail = document.getElementById("sec05-detail");
  const linkWrap = document.getElementById("sec05-links");
  if (!diagram) return;

  const BRIEFS = {
    novel: {
      badge: "留任 · 194 手稿网格",
      ok: true,
      text: "连续长文只需要一条安静、稳定的阅读轨道。手稿网格让每一页拥有相同的边界与行宽，读者可以一口气翻完三百页而不被版式打断。",
      links: [{ id: "198", name: "198 基线网格（辅助锁定正反页行位对齐）" }],
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
        <rect x="20" y="10" width="88" height="110" fill="#FBF8F1" stroke="#9B8868"/>
        <rect x="112" y="10" width="88" height="110" fill="#FBF8F1" stroke="#9B8868"/>
        <rect x="38" y="23" width="59" height="72" fill="#F3EBDC" stroke="#3C5426" stroke-width="1.4"/>
        <rect x="123" y="23" width="59" height="72" fill="#F3EBDC" stroke="#3C5426" stroke-width="1.4"/>
      </svg>`,
    },
    magazine: {
      badge: "改用 · 195 分栏网格 / 199 复合网格",
      ok: false,
      text: "杂志与报纸往往同时承载主报道、图注、人物问答与短讯，读者需要非线性的多入口扫读，单一版心会显得笨重。",
      links: [
        { id: "195", name: "195 分栏网格" },
        { id: "199", name: "199 复合网格" },
      ],
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
        <rect x="20" y="10" width="180" height="110" fill="#FBF8F1" stroke="#9B8868"/>
        <rect x="32" y="22" width="46" height="86" fill="#EFE7D6" stroke="#902004" stroke-dasharray="3 2"/>
        <rect x="87" y="22" width="46" height="86" fill="#EFE7D6" stroke="#902004" stroke-dasharray="3 2"/>
        <rect x="142" y="22" width="46" height="86" fill="#EFE7D6" stroke="#902004" stroke-dasharray="3 2"/>
      </svg>`,
    },
    dashboard: {
      badge: "改用 · 196 模块化网格 / 209 响应式网格",
      ok: false,
      text: "多指标控制台和商品目录需要横向并列对比、卡片自由增减与多端折行重组，应采用横竖双切分的模块格子与断点流式体系。",
      links: [
        { id: "196", name: "196 模块化网格" },
        { id: "209", name: "209 响应式网格" },
      ],
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
        <rect x="20" y="10" width="180" height="110" fill="#FBF8F1" stroke="#9B8868"/>
        <rect x="30" y="20" width="50" height="40" fill="#EFE7D6" stroke="#645828"/>
        <rect x="85" y="20" width="50" height="40" fill="#EFE7D6" stroke="#645828"/>
        <rect x="140" y="20" width="50" height="40" fill="#EFE7D6" stroke="#645828"/>
        <rect x="30" y="68" width="105" height="42" fill="#EFE7D6" stroke="#645828"/>
        <rect x="140" y="68" width="50" height="42" fill="#EFE7D6" stroke="#645828"/>
      </svg>`,
    },
    exhibition: {
      badge: "改用 · 200 非对称网格 / 210 破格网格",
      ok: false,
      text: "先锋艺术展讯与实验画册追求强烈的空间张力与情绪冲击，手稿网格过于温文尔雅，此时让版式主动打破对称或出格更有效。",
      links: [
        { id: "200", name: "200 非对称网格" },
        { id: "210", name: "210 破格网格" },
        { id: "211", name: "211 解构网格" },
      ],
      svg: `<svg viewBox="0 0 220 130" aria-hidden="true">
        <rect x="20" y="10" width="180" height="110" fill="#FBF8F1" stroke="#9B8868"/>
        <rect x="28" y="18" width="112" height="58" fill="#EFE7D6" stroke="#902004"/>
        <rect x="116" y="48" width="76" height="62" fill="rgba(144,32,4,0.12)" stroke="#902004"/>
      </svg>`,
    },
  };

  let cur = "novel";
  function render() {
    const item = BRIEFS[cur];
    diagram.innerHTML = item.svg;
    if (verdict) {
      verdict.textContent = item.badge;
      verdict.dataset.ok = item.ok ? "1" : "0";
    }
    if (detail) detail.textContent = item.text;
    if (linkWrap) {
      linkWrap.innerHTML = item.links
        .map(
          (l) =>
            `<a class="ext-chip" href="https://layout.xiaoxiaodong.ai/${l.id}/play/" target="_blank" rel="noopener">${l.name} ↗</a>`
        )
        .join("");
    }
    btns.forEach((b) => {
      const on = b.dataset.s5Brief === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => { cur = b.dataset.s5Brief; render(); }));
  render();
}

// ==================== 06 节：宽屏网页手稿 CSS 陷阱切换器 ====================
export function initSec06() {
  const btns = [...document.querySelectorAll("[data-s6-css]")];
  const screen = document.getElementById("sec06-screen");
  const code = document.getElementById("sec06-code");
  const verdict = document.getElementById("sec06-verdict");
  if (!screen) return;

  let cur = "percent";
  function render() {
    screen.dataset.mode = cur;
    if (code) {
      code.textContent =
        cur === "percent"
          ? `.article {\n  padding-inline: 15%; /* 1440px 屏下正文仍宽达 1008px ≈ 63 字/行 */\n}`
          : `.article {\n  max-width: 34em;     /* 锁定中文约 32–34 字行宽 */\n  margin-inline: auto; /* 屏幕越宽，左右留白自动吸收多余空间 */\n  padding-inline: clamp(16px, 5vw, 48px);\n}`;
    }
    if (verdict) {
      verdict.textContent =
        cur === "percent"
          ? "死抄纸书百分比的陷阱：1440px 显示器左右各留 15%，中间正文依然撑到 1008px、每行超过 60 个字，眼睛横扫疲惫。"
          : "网页手稿网格正解：把「行宽上限」锁死（中文约 32–36em，英文约 60–72ch），多出的屏幕宽度全部交给左右留白，纸面秩序就能平移到任何大屏。";
      verdict.dataset.ok = cur === "maxwidth" ? "1" : "0";
    }
    btns.forEach((b) => {
      const on = b.dataset.s6Css === cur;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  btns.forEach((b) => b.addEventListener("click", () => { cur = b.dataset.s6Css; render(); }));
  render();
}

// ==================== 07 节：校版小练习（两道题，中性标签，仅差一个变量） ====================
export function initSec07() {
  const qBtns = [...document.querySelectorAll("[data-s7-q]")];
  const promptEl = document.getElementById("quiz-prompt");
  const gridEl = document.getElementById("quiz-grid");
  const fbEl = document.getElementById("quiz-feedback");
  if (!gridEl) return;

  const QUESTIONS = {
    q1: {
      prompt: "同一册 2:3 开本的双页对开散文书、同样字号与 1.72× 行距，下列四组方案只差四周边距分配。哪一册摊开后中缝最匀称、重心最稳、双手捧读也不遮字？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: buildSpreadSvg({ inner: 0.18, outer: 0.18, top: 0.18, bottom: 0.18 }),
          explain: "方案 A（内 18% · 天 18% · 外 18% · 地 18%）把单页等距直接搬进双页：两页订口拼出 36% 的宽阔中缝（外边距的两倍），整跨页被劈开；且天地同宽，版心在视觉上略微下沉。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: buildSpreadSvg({ inner: 0.111, outer: 0.222, top: 0.111, bottom: 0.222 }),
          explain: "判断准确！方案 B（内 11% · 天 11% · 外 22% · 地 22%，折合实际边长 2:3:4:6）让两页内边距合为 22%，恰好与左右外缘等宽，地脚厚于天头稳稳托起版心，外缘与地脚留足拇指握持区。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: buildSpreadSvg({ inner: 0.22, outer: 0.11, top: 0.23, bottom: 0.12 }),
          explain: "方案 C（内 22% · 天 23% · 外 11% · 地 12%）刚好把内外、天地装反了：中间裂出 44% 的大白沟，文字却被推到外缘和底边，手一拿书就遮字。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: buildSpreadSvg({ inner: 0.06, outer: 0.07, top: 0.06, bottom: 0.07 }),
          explain: "方案 D（内 6% · 天 6% · 外 7% · 地 7%）为了多塞字而压缩四周：版心撑得过宽导致单行过长，内侧文字陷进装订折痕，外侧毫无握持缓冲。",
        },
      ],
    },
    q2: {
      prompt: "把同一篇中文长文搬到 1440px 宽的桌面网页，字号固定 17px、行距 1.75×，四个方案只差正文容器的宽度策略。哪一组最符合手稿网格的长文阅读原则？",
      answer: "B",
      options: [
        {
          id: "A",
          label: "方案 A",
          svg: buildWebSvg(0.70, "center"),
          explain: "方案 A（左右固定 15% 留白，正文宽 70% ≈ 1008px）：看似沿用了纸书百分比，但在 1440px 屏上每行仍接近 60 个汉字，视线横扫过长极易串行。",
        },
        {
          id: "B",
          label: "方案 B",
          svg: buildWebSvg(0.42, "center"),
          explain: "判断准确！方案 B（锁定 max-width: 34em ≈ 580px 并水平居中）：单行稳控在约 32–34 个汉字，把宽屏多余宽度自然转化为安静的左右留白，既护眼又不失聚焦。",
        },
        {
          id: "C",
          label: "方案 C",
          svg: buildWebSvg(0.18, "center"),
          explain: "方案 C（正文压成 18% 窄条 ≈ 260px）：每行只容十来个字，句子不断被切碎换行，阅读像在读手机弹窗而非书页。",
        },
        {
          id: "D",
          label: "方案 D",
          svg: buildWebSvg(0.92, "center"),
          explain: "方案 D（正文撑满 92% 屏宽 ≈ 1325px）：几乎没有左右缓冲，每行近 78 字，长文瞬间变成难以卒读的宽幅灰墙。",
        },
      ],
    },
  };

  function buildWebSvg(colFrac) {
    const W = 232;
    const H = 140;
    const bx = 10, by = 10, bw = W - 20, bh = H - 20;
    const cw = bw * colFrac;
    const cx = bx + (bw - cw) / 2;
    const lines = [];
    for (let i = 0; i < 11; i++) {
      const y = by + 26 + i * 7.6;
      const indent = i === 0 || i === 5 ? 8 : 0;
      const endTrim = i === 4 || i === 10 ? cw * 0.25 : 0;
      lines.push(
        `<line x1="${(cx + 4 + indent).toFixed(1)}" y1="${y.toFixed(1)}" x2="${Math.max(cx + 8 + indent, cx + cw - 4 - endTrim).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#5A5246" stroke-width="1.6" stroke-linecap="round"/>`
      );
    }
    return `<svg viewBox="0 0 ${W} ${H}" class="spread-svg" role="img" aria-label="1440px 网页正文容器宽窄示意">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#FBF8F1" stroke="#9B8868" stroke-width="1.2"/>
      <rect x="${bx}" y="${by}" width="${bw}" height="12" fill="#EFE7D6" stroke="#9B8868" stroke-width="1"/>
      <circle cx="${bx + 8}" cy="${by + 6}" r="2" fill="#9B8868"/>
      <circle cx="${bx + 15}" cy="${by + 6}" r="2" fill="#9B8868"/>
      <circle cx="${bx + 22}" cy="${by + 6}" r="2" fill="#9B8868"/>
      <rect x="${cx.toFixed(1)}" y="${by + 19}" width="${cw.toFixed(1)}" height="${bh - 27}" fill="#F3EBDC" stroke="#B6A486" stroke-width="0.9"/>
      ${lines.join("")}
    </svg>`;
  }

  let curQ = "q1";
  let picked = null;

  function render() {
    const q = QUESTIONS[curQ];
    if (promptEl) promptEl.textContent = q.prompt;
    qBtns.forEach((b) => {
      const on = b.dataset.s7Q === curQ;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });

    gridEl.innerHTML = q.options
      .map((opt) => {
        let cls = "quiz-card";
        if (picked) {
          if (opt.id === q.answer) cls += " is-correct";
          else if (opt.id === picked) cls += " is-wrong";
        }
        return `<button type="button" class="${cls}" data-quiz-opt="${opt.id}" aria-pressed="${picked === opt.id ? "true" : "false"}">
          <span class="quiz-badge">${opt.label}</span>
          <span class="quiz-art">${opt.svg}</span>
        </button>`;
      })
      .join("");

    gridEl.querySelectorAll("[data-quiz-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.quizOpt;
        render();
      });
    });

    if (fbEl) {
      if (!picked) {
        fbEl.innerHTML = `<p class="quiz-hint">先凭眼睛观察四张缩微版面的留白比例、中缝与行宽，点选你认为最耐读的一张。</p>`;
        fbEl.dataset.state = "idle";
      } else {
        const chosen = q.options.find((o) => o.id === picked);
        const right = picked === q.answer;
        fbEl.dataset.state = right ? "ok" : "warn";
        fbEl.innerHTML = `<p class="quiz-res-head">${right ? "选对了 · " : "再看一眼 · "}${chosen.label}</p><p>${chosen.explain}</p>`;
      }
    }
  }

  qBtns.forEach((b) => b.addEventListener("click", () => { curQ = b.dataset.s7Q; picked = null; render(); }));
  render();
}

// ==================== 08 节：原海报放大灯箱（单一内联图，不重复嵌入） ====================
export function initPoster() {
  const poster = document.getElementById("poster");
  const openBtn = document.getElementById("poster-open");
  const dialog = document.getElementById("zoom");
  const view = document.getElementById("zoom-view");
  const img = document.getElementById("zoom-img");
  const level = document.getElementById("zoom-level");
  const btnIn = document.getElementById("zoom-in");
  const btnOut = document.getElementById("zoom-out");
  const btnClose = document.getElementById("zoom-close");
  if (!poster || !dialog || !view || !img) return;

  let k = 1;
  const setZoom = (next, cx = 0.5, cy = 0.5) => {
    const fx = view.scrollWidth ? (view.scrollLeft + view.clientWidth * cx) / view.scrollWidth : 0.5;
    const fy = view.scrollHeight ? (view.scrollTop + view.clientHeight * cy) / view.scrollHeight : 0.5;
    k = Math.min(4, Math.max(1, next));
    img.style.setProperty("--k", String(k));
    if (level) level.textContent = `${Math.round(k * 100)}%`;
    view.scrollLeft = fx * view.scrollWidth - view.clientWidth * cx;
    view.scrollTop = fy * view.scrollHeight - view.clientHeight * cy;
  };

  const open = () => {
    if (!img.getAttribute("src")) img.src = poster.src;
    dialog.showModal();
    setZoom(1);
  };

  if (openBtn) openBtn.addEventListener("click", open);
  poster.addEventListener("click", open);
  if (btnIn) btnIn.addEventListener("click", () => setZoom(k * 1.5));
  if (btnOut) btnOut.addEventListener("click", () => setZoom(k / 1.5));
  if (btnClose) btnClose.addEventListener("click", () => dialog.close());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });

  img.addEventListener("click", (e) => {
    const r = view.getBoundingClientRect();
    setZoom(k >= 4 ? 1 : k * 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });

  // 放大后鼠标拖拽平移（图已设 draggable="false"）
  let pan = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || k <= 1) return;
    pan = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop, moved: false };
  });
  view.addEventListener("pointermove", (e) => {
    if (!pan) return;
    pan.moved ||= Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 4;
    view.scrollLeft = pan.l - (e.clientX - pan.x);
    view.scrollTop = pan.t - (e.clientY - pan.y);
  });
  view.addEventListener("click", (e) => {
    if (pan?.moved) e.stopPropagation();
    pan = null;
  }, true);
  view.addEventListener("pointerup", () => setTimeout(() => { pan = null; }, 0));
}
