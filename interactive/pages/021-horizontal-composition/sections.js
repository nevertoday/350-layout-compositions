// 021 水平构图 · 01–08 节独立交互模块（相邻两节交互控件互不重复）
import { pixelRatio } from "../../lib/stage.js";
import {
  LEVEL_TEST_SETS,
  FIVE_POINTS,
  LINEAGE_ITEMS,
  EXAMPLE_SCENES,
  ANTI_CASES,
  PRACTICE_QUESTIONS,
} from "./model.js";

function fitCanvas(canvas, cssW, cssH) {
  const dpr = pixelRatio(2);
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// =========================================================
// 01 节：倾角直觉盲测仪（5 题判「平的 / 歪了」，实测最小辨别阈）
// =========================================================
export function initSection01BlindTest() {
  const canvas = document.getElementById("s1-canvas");
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const elStep = document.getElementById("s1-step");
  const elPrompt = document.getElementById("s1-prompt");
  const elFeedback = document.getElementById("s1-feedback");
  const btnFlat = document.getElementById("s1-btn-flat");
  const btnTilt = document.getElementById("s1-btn-tilt");
  const btnNext = document.getElementById("s1-btn-next");
  const btnRestart = document.getElementById("s1-btn-restart");
  const elDots = document.getElementById("s1-dots");

  let setIdx = 0;
  let qIdx = 0;
  let revealed = false;
  let results = []; // { angle, correct, guessedFlat }

  function currentSet() {
    return LEVEL_TEST_SETS[setIdx % LEVEL_TEST_SETS.length];
  }

  function renderCanvas() {
    const w = Math.max(240, Math.round(wrap.clientWidth));
    const h = Math.round(Math.min(220, Math.max(150, w * 0.34)));
    const c = fitCanvas(canvas, w, h);
    const q = currentSet()[qIdx];
    const rad = (q.angle * Math.PI) / 180;
    const cx = w / 2;
    const cy = h * 0.56;
    const span = Math.hypot(w, h);

    // 旋转海天剪影
    c.save();
    c.translate(cx, cy);
    c.rotate(rad);
    c.fillStyle = "#F7ECDD";
    c.fillRect(-span, -span, span * 2, span);
    c.fillStyle = "#264F7B";
    c.fillRect(-span, 0, span * 2, span);
    // 极简白线
    c.strokeStyle = "#FBF5EC";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-span, 0);
    c.lineTo(span, 0);
    c.stroke();
    // 远方极小暗礁增添真实参照
    c.fillStyle = "#06182C";
    c.beginPath();
    c.moveTo(w * 0.14, 0);
    c.quadraticCurveTo(w * 0.22, -12, w * 0.31, 0);
    c.closePath();
    c.fill();
    c.restore();

    // 作答后叠出真实 0° 水平虚线与角度标牌
    if (revealed) {
      c.save();
      c.strokeStyle = "#D35638";
      c.lineWidth = 1.5;
      c.setLineDash([6, 4]);
      c.beginPath();
      c.moveTo(12, cy);
      c.lineTo(w - 12, cy);
      c.stroke();
      c.setLineDash([]);

      const tag = q.angle === 0 ? "真实 0.0°（平）" : `真实 ${q.angle > 0 ? "+" : "−"}${Math.abs(q.angle).toFixed(1)}°（歪）`;
      c.font = '700 12px "Space Mono", "Noto Sans SC", sans-serif';
      const tw = c.measureText(tag).width + 18;
      c.fillStyle = "#06182C";
      c.fillRect(14, 12, tw, 26);
      c.fillStyle = "#FBF5EC";
      c.fillText(tag, 23, 29);
      c.restore();
    }
  }

  function renderDots() {
    const items = currentSet();
    elDots.innerHTML = items.map((_, i) => {
      const r = results[i];
      const cls = r ? (r.correct ? "dot ok" : "dot miss") : i === qIdx ? "dot now" : "dot";
      return `<span class="${cls}" aria-hidden="true"></span>`;
    }).join("");
  }

  function updateView() {
    const items = currentSet();
    const done = results.length === items.length && revealed;
    elStep.textContent = `${qIdx + 1} / ${items.length}`;
    renderDots();
    renderCanvas();

    btnFlat.disabled = revealed;
    btnTilt.disabled = revealed;
    btnNext.hidden = !revealed || done;

    if (!revealed) {
      elPrompt.textContent = "先不借任何刻度线，只凭肉眼判断：眼前这条海平线是平的，还是歪了？";
      elFeedback.textContent = "";
      elFeedback.dataset.tone = "";
    } else if (done) {
      const hit = results.filter((r) => r.correct).length;
      const caughtTilts = results.filter((r) => r.angle !== 0 && r.correct).map((r) => Math.abs(r.angle));
      const minCaught = caughtTilts.length ? Math.min(...caughtTilts) : null;
      const summary = minCaught !== null
        ? `5 题答对 ${hit} 题；你肉眼最少能揪出 ${minCaught.toFixed(1)}° 的倾斜——正好落在视觉皮层对 0° 主轴高度敏感的区间内。`
        : `5 题答对 ${hit} 题；微小的 0.8°–1.6° 倾角最考验耐心，点「换一组重测」再试一次。`;
      elPrompt.textContent = "本轮盲测完成";
      elFeedback.textContent = summary;
      elFeedback.dataset.tone = hit >= 4 ? "ok" : "warn";
    }
  }

  function answer(guessedFlat) {
    if (revealed) return;
    const q = currentSet()[qIdx];
    const isActuallyFlat = q.angle === 0;
    const correct = guessedFlat === isActuallyFlat;
    results[qIdx] = { angle: q.angle, correct, guessedFlat };
    revealed = true;

    const absA = Math.abs(q.angle);
    if (isActuallyFlat) {
      elFeedback.textContent = correct
        ? "判断准确：这题正是严格的 0.0° 水平线，虚线与白线严丝合缝。"
        : "这题其实是 0.0° 真平线——仔细看红虚线，它和白海平线完全重合。";
    } else {
      const dir = q.angle > 0 ? "向右" : "向左";
      elFeedback.textContent = correct
        ? `眼很尖！它确实${dir}歪了 ${absA.toFixed(1)}°，${absA <= 1.2 ? "连 1° 左右都能察觉。" : "超出人眼舒适阈值。"}`
        : `差点骗过眼睛：它实际${dir}歪了 ${absA.toFixed(1)}°，叠上红虚线立刻能看出高低落差。`;
    }
    elFeedback.dataset.tone = correct ? "ok" : "warn";
    updateView();
  }

  btnFlat.addEventListener("click", () => answer(true));
  btnTilt.addEventListener("click", () => answer(false));
  btnNext.addEventListener("click", () => {
    if (qIdx < currentSet().length - 1) {
      qIdx++;
      revealed = false;
      updateView();
    }
  });
  btnRestart.addEventListener("click", () => {
    setIdx = (setIdx + 1) % LEVEL_TEST_SETS.length;
    qIdx = 0;
    revealed = false;
    results = [];
    updateView();
  });

  new ResizeObserver(renderCanvas).observe(wrap);
  updateView();
}

// =========================================================
// 02 节：原海报五要点活体解剖台（五列点击 + 专属动作 + 可点节奏五点）
// =========================================================
export function initSection02FivePoints() {
  const tabs = document.querySelectorAll("[data-p5-id]");
  const canvas = document.getElementById("s2-canvas");
  if (!canvas || !tabs.length) return;
  const wrap = canvas.parentElement;
  const elTitle = document.getElementById("s2-active-title");
  const elPoster = document.getElementById("s2-active-poster");
  const elPlain = document.getElementById("s2-active-plain");
  const elSubControls = document.getElementById("s2-sub-controls");
  const elSubReadout = document.getElementById("s2-sub-readout");

  const st = {
    active: "stability",
    stabilityMode: "level",   // level | tilted
    extRatio: "239",          // 11 | 169 | 239
    guidePos: "on",           // on | near | float
    horizonLayers: 5,         // 1 | 3 | 5
    rhythmPreset: "grouped",  // even | grouped | taper
    rhythmDots: [0.16, 0.27, 0.38, 0.64, 0.80],
  };

  const SUB_CONFIG = {
    stability: [
      { key: "stabilityMode", val: "tilted", label: "斜倚不稳" },
      { key: "stabilityMode", val: "level",  label: "水平着陆" },
    ],
    extension: [
      { key: "extRatio", val: "11",  label: "1:1 方幅" },
      { key: "extRatio", val: "169", label: "16:9 横幅" },
      { key: "extRatio", val: "239", label: "2.39:1 宽幕" },
    ],
    guidance: [
      { key: "guidePos", val: "on",    label: "落在线上（TIP）" },
      { key: "guidePos", val: "near",  label: "紧贴线上方" },
      { key: "guidePos", val: "float", label: "悬空离群" },
    ],
    horizon: [
      { key: "horizonLayers", val: 1, label: "1 层单线" },
      { key: "horizonLayers", val: 3, label: "3 层景深" },
      { key: "horizonLayers", val: 5, label: "5 层远近" },
    ],
    rhythm: [
      { key: "rhythmPreset", val: "even",    label: "等距排（呆板）" },
      { key: "rhythmPreset", val: "grouped", label: "疏密聚散（呼吸）" },
      { key: "rhythmPreset", val: "taper",   label: "渐密推进（景深）" },
    ],
  };

  function applyRhythmPreset(preset) {
    st.rhythmPreset = preset;
    if (preset === "even") st.rhythmDots = [0.18, 0.34, 0.50, 0.66, 0.82];
    else if (preset === "grouped") st.rhythmDots = [0.15, 0.25, 0.35, 0.66, 0.82];
    else st.rhythmDots = [0.14, 0.36, 0.54, 0.69, 0.82];
  }

  function renderSubControls() {
    const items = SUB_CONFIG[st.active];
    elSubControls.innerHTML = items.map((it) => {
      const pressed = String(st[it.key]) === String(it.val);
      return `<button type="button" class="mini-btn" data-sub-key="${it.key}" data-sub-val="${it.val}" aria-pressed="${pressed}">${it.label}</button>`;
    }).join("");

    elSubControls.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.subKey;
        const v = btn.dataset.subVal;
        if (k === "horizonLayers") st[k] = Number(v);
        else if (k === "rhythmPreset") applyRhythmPreset(v);
        else st[k] = v;
        renderSubControls();
        renderCanvas();
      });
    });
  }

  function renderCanvas() {
    const w = Math.max(240, Math.round(wrap.clientWidth));
    const h = Math.round(Math.min(240, Math.max(170, w * 0.28)));
    const c = fitCanvas(canvas, w, h);

    c.fillStyle = "#F7ECDD";
    c.fillRect(0, 0, w, h);

    const midY = h * 0.56;
    const padX = Math.max(22, w * 0.06);

    if (st.active === "stability") {
      // 水平大地基线与刻度
      const baseY = h * 0.76;
      c.strokeStyle = "#264F7B";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(padX, baseY);
      c.lineTo(w - padX, baseY);
      c.stroke();

      c.strokeStyle = "rgba(38, 79, 123, 0.28)";
      c.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const tx = padX + ((w - padX * 2) * i) / 10;
        c.beginPath();
        c.moveTo(tx, baseY);
        c.lineTo(tx, baseY + (i === 5 ? 10 : 5));
        c.stroke();
      }

      const blockW = Math.min(260, w * 0.44);
      const blockH = 56;
      c.save();
      c.translate(w / 2, baseY);
      if (st.stabilityMode === "tilted") {
        c.rotate(-0.26);
        c.fillStyle = "#D35638";
        c.fillRect(-blockW / 2, -blockH - 22, blockW, blockH);
        c.strokeStyle = "#FBF5EC";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-blockW / 2, -blockH / 2 - 22);
        c.lineTo(blockW / 2, -blockH / 2 - 22);
        c.stroke();
        c.rotate(0.26);
        // 向下重力失衡矢线
        c.strokeStyle = "#A9351C";
        c.fillStyle = "#A9351C";
        c.lineWidth = 2;
        c.setLineDash([4, 3]);
        c.beginPath();
        c.moveTo(0, -blockH - 34);
        c.lineTo(0, -8);
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.moveTo(0, -3);
        c.lineTo(-5, -12);
        c.lineTo(5, -12);
        c.closePath();
        c.fill();
        c.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
        c.fillText("重力下拉 · 失稳", 12, -blockH - 22);
        elSubReadout.textContent = "倾斜态：体块与底面形成夹角，重力随时要把它往下拉倒，眼睛因此紧绷。";
      } else {
        c.fillStyle = "#264F7B";
        c.fillRect(-blockW / 2, -blockH, blockW, blockH);
        // 海报同款横剖白线
        c.strokeStyle = "#FBF5EC";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-blockW / 2, -blockH / 2);
        c.lineTo(blockW / 2, -blockH / 2);
        c.stroke();
        // 顶部垂直向下重力线 + 90° 直角符号
        c.strokeStyle = "#1D426A";
        c.fillStyle = "#1D426A";
        c.lineWidth = 1.6;
        c.setLineDash([4, 3]);
        c.beginPath();
        c.moveTo(0, -blockH - 38);
        c.lineTo(0, -blockH - 6);
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.moveTo(0, -blockH - 2);
        c.lineTo(-4.5, -blockH - 10);
        c.lineTo(4.5, -blockH - 10);
        c.closePath();
        c.fill();
        // 右侧直角符号示意 90°
        c.strokeRect(0, -blockH - 14, 10, 10);
        c.font = '700 11px "Space Mono", "Noto Sans SC", sans-serif';
        c.fillText("90° 重力休止面", 16, -blockH - 18);
        elSubReadout.textContent = "水平着陆：底边与重力方向严格垂直，整块体量进入零滑坠的休止面。";
      }
      c.restore();
    } else if (st.active === "extension") {
      const ratios = { "11": 1.0, "169": 1.78, "239": 2.39 };
      const r = ratios[st.extRatio] || 2.39;
      const boxH = Math.min(h - 36, 136);
      const boxW = Math.min(w - padX * 2, boxH * r);
      const bx = (w - boxW) / 2;
      const by = (h - boxH) / 2;

      // 外框
      c.fillStyle = "#FAF3E9";
      c.fillRect(bx, by, boxW, boxH);
      c.fillStyle = "#264F7B";
      c.fillRect(bx, by + boxH * 0.62, boxW, boxH * 0.38);
      c.strokeStyle = "#FBF5EC";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bx, by + boxH * 0.62);
      c.lineTo(bx + boxW, by + boxH * 0.62);
      c.stroke();
      c.strokeStyle = "#06182C";
      c.lineWidth = 2;
      c.strokeRect(bx, by, boxW, boxH);

      // 双向延展箭头
      const ay = by + boxH * 0.32;
      c.strokeStyle = "#D35638";
      c.fillStyle = "#D35638";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(bx + 18, ay);
      c.lineTo(bx + boxW - 18, ay);
      c.stroke();
      // 左右箭尖
      c.beginPath();
      c.moveTo(bx + 12, ay);
      c.lineTo(bx + 22, ay - 6);
      c.lineTo(bx + 22, ay + 6);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(bx + boxW - 12, ay);
      c.lineTo(bx + boxW - 22, ay - 6);
      c.lineTo(bx + boxW - 22, ay + 6);
      c.closePath();
      c.fill();

      const msg = {
        "11": "1:1 方幅：左右边距短，横线很快撞到边框，延展感较克制。",
        "169": "16:9 横幅：左右通道打开，眼睛开始顺着横线往两边扫视。",
        "239": "2.39:1 宽幕：水平线像没有尽头地冲出画面两侧，辽阔感最强。",
      };
      elSubReadout.textContent = msg[st.extRatio];
    } else if (st.active === "guidance") {
      // 原海报引导符号活体版
      const lineY = h * 0.64;
      c.strokeStyle = "#264F7B";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(padX, lineY);
      c.lineTo(w - padX, lineY);
      c.stroke();

      const dotR = 13;
      const dotX = st.guidePos === "float" ? w * 0.72 : w * 0.62;
      const dotY = st.guidePos === "on" ? lineY : st.guidePos === "near" ? lineY - dotR - 7 : h * 0.22;

      // 视线路径虚线
      c.strokeStyle = "rgba(38, 79, 123, 0.5)";
      c.lineWidth = 1.6;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.moveTo(padX + 12, lineY - 12);
      if (st.guidePos === "float") {
        c.lineTo(w * 0.56, lineY - 12);
        c.lineTo(dotX - 18, dotY + 12);
      } else {
        c.lineTo(dotX - 22, dotY);
      }
      c.stroke();
      c.setLineDash([]);

      // 主体朱陶红点
      c.fillStyle = "#D35638";
      c.beginPath();
      c.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      c.fill();
      if (st.guidePos === "on") {
        c.strokeStyle = "#FBF5EC";
        c.lineWidth = 2;
        c.stroke();
      }

      const msg = {
        on: "落在线上（原海报 TIP）：水平线直接托住主体，视线顺轨滑入，整体感最牢。",
        near: "紧贴线上方：保留一丝透气缝隙，既有支撑关系又不致压死主体。",
        float: "悬空离群：主体漂离水平基线太远，视线沿线滑过去还得抬头另找，画面散成两截。",
      };
      elSubReadout.textContent = msg[st.guidePos];
    } else if (st.active === "horizon") {
      const n = st.horizonLayers;
      const layers = [
        { y: 0.24, h: 0.08, col: "#E3D6C3" }, // 高云带
        { y: 0.39, h: 0.09, col: "#9BB0C4" }, // 远山薄雾
        { y: 0.52, h: 0.10, col: "#4E769D" }, // 远海
        { y: 0.64, h: 0.12, col: "#264F7B" }, // 中海
        { y: 0.78, h: 0.14, col: "#0D243C" }, // 近岸
      ];
      const pick = n === 1 ? [layers[3]] : n === 3 ? [layers[1], layers[3], layers[4]] : layers;
      for (const L of pick) {
        c.fillStyle = L.col;
        c.fillRect(padX, h * L.y, w - padX * 2, h * L.h);
      }
      // 主白线
      c.strokeStyle = "#FBF5EC";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(padX, h * 0.64);
      c.lineTo(w - padX, h * 0.64);
      c.stroke();

      elSubReadout.textContent = n === 1
        ? "1 层单线：只有上下二分，空间显得扁平单薄。"
        : n === 3
          ? "3 层景深：远山、海面与近岸由浅入深叠出三道横带，纵深感开始浮现。"
          : "5 层远近：高云、薄山、远海、中海到近岸逐层加深，纯靠水平叠层就拉出开阔透视。";
    } else if (st.active === "rhythm") {
      const lineY = h * 0.64;
      c.strokeStyle = "#264F7B";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(padX, lineY);
      c.lineTo(w - padX, lineY);
      c.stroke();

      const usableW = w - padX * 2;
      // 间隔标尺
      for (let i = 0; i < st.rhythmDots.length - 1; i++) {
        const x1 = padX + st.rhythmDots[i] * usableW;
        const x2 = padX + st.rhythmDots[i + 1] * usableW;
        const gap = Math.round((st.rhythmDots[i + 1] - st.rhythmDots[i]) * 100);
        c.strokeStyle = "rgba(38, 79, 123, 0.35)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x1, lineY + 14);
        c.lineTo(x2, lineY + 14);
        c.stroke();
        c.fillStyle = "#1D426A";
        c.font = '700 11px "Space Mono", monospace';
        c.textAlign = "center";
        c.fillText(`${gap}`, (x1 + x2) / 2, lineY + 29);
      }
      c.textAlign = "left";

      // 5 颗可点红点
      st.rhythmDots.forEach((nx, i) => {
        const dx = padX + nx * usableW;
        const r = st.rhythmPreset === "taper" ? 13 - i * 1.4 : 11;
        c.fillStyle = "#D35638";
        c.beginPath();
        c.arc(dx, lineY - r - 8, r, 0, Math.PI * 2);
        c.fill();
      });

      const msg = {
        even: "等距排（16·16·16·16）：间距一模一样，像机械栏杆，看两秒就发平发闷。",
        grouped: "疏密聚散（10·10·31·16）：左侧三点轻抱、中间留出大呼吸，再由右侧两点接住，节奏立刻活起来。",
        taper: "渐密推进（22·18·15·13）：间距逐段收短且体量微缩，顺水平线拉出纵深行进感。",
      };
      elSubReadout.textContent = msg[st.rhythmPreset] + "（点画布可微移最近红点）";
    }
  }

  // 在「节奏」模式下允许点击画布直接拨动最近红点，测算实时间距
  canvas.addEventListener("click", (e) => {
    if (st.active !== "rhythm") return;
    const rect = canvas.getBoundingClientRect();
    const padX = Math.max(22, rect.width * 0.06);
    const nx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left - padX) / (rect.width - padX * 2)));
    let best = 0;
    let bestD = 99;
    st.rhythmDots.forEach((p, i) => {
      const d = Math.abs(p - nx);
      if (d < bestD) { bestD = d; best = i; }
    });
    st.rhythmDots[best] = Number(nx.toFixed(2));
    st.rhythmDots.sort((a, b) => a - b);
    renderCanvas();
  });

  function selectPoint(id) {
    st.active = id;
    const item = FIVE_POINTS.find((p) => p.id === id) || FIVE_POINTS[0];
    tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.p5Id === id)));
    elTitle.textContent = `${item.title} · ${item.en}`;
    elPoster.textContent = `原海报：「${item.posterBody}」`;
    elPlain.textContent = item.plain;
    renderSubControls();
    renderCanvas();
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => selectPoint(btn.dataset.p5Id)));
  new ResizeObserver(renderCanvas).observe(wrap);
  selectPoint("stability");
}

// =========================================================
// 03 节：地平线低、中、高三境 + 繁景/极简双境滑轨（SVG 实时变形）
// =========================================================
export function initSection03HorizonZones() {
  const slider = document.getElementById("s3-slider");
  if (!slider) return;
  const elPct = document.getElementById("s3-pct");
  const elZoneTag = document.getElementById("s3-zone-tag");
  const elVerdict = document.getElementById("s3-verdict");
  const elSeaRect = document.getElementById("s3-sea-rect");
  const elWhiteLine = document.getElementById("s3-white-line");
  const elDetailGroup = document.getElementById("s3-detail-group");
  const elSun = document.getElementById("s3-sun");
  const elSkyLbl = document.getElementById("s3-sky-lbl");
  const elSeaLbl = document.getElementById("s3-sea-lbl");

  let complex = true; // true=繁景, false=极简空海

  function update() {
    const pct = Number(slider.value); // 15..85（海面自底占比）
    const sky = 100 - pct;
    elPct.textContent = `天 ${sky}% / 海 ${pct}%`;

    // viewBox 0 0 400 220
    const y = Math.round(220 * (1 - pct / 100));
    elSeaRect.setAttribute("y", String(y));
    elSeaRect.setAttribute("height", String(220 - y));
    elWhiteLine.setAttribute("y1", String(y));
    elWhiteLine.setAttribute("y2", String(y));

    elDetailGroup.setAttribute("transform", `translate(0, ${y - 140})`);
    elDetailGroup.style.display = complex ? "" : "none";
    if (elSun) {
      elSun.setAttribute("cy", String(Math.max(26, y - 62)));
      elSun.style.display = complex ? "" : "none";
    }
    elSkyLbl.setAttribute("y", String(Math.max(20, Math.round(y * 0.48))));
    elSkyLbl.textContent = `天 ${sky}%`;
    elSeaLbl.setAttribute("y", String(Math.min(208, Math.round(y + (220 - y) * 0.56))));
    elSeaLbl.textContent = `海 ${pct}%`;

    const isMid = pct >= 46 && pct <= 54;
    const isEdge = pct < 22 || pct > 78;

    if (!complex) {
      if (isMid) {
        elZoneTag.textContent = "极简特例 · 正中成立";
        elZoneTag.dataset.tone = "calm";
        elVerdict.textContent = "山日船帆退场后，50% 正中海平线反成绝对镜面——正如杉本博司《海景》，上下均势带来无时间感的静默。";
      } else if (isEdge) {
        elZoneTag.textContent = "贴边失衡";
        elZoneTag.dataset.tone = "warn";
        elVerdict.textContent = "极简画面没有多余细节补位，贴近上下边框反而像裁图跑偏。";
      } else {
        elZoneTag.textContent = "空海偏切";
        elZoneTag.dataset.tone = "warn";
        elVerdict.textContent = "纯空海缺乏云山支撑，偏低或偏高会让较宽一侧略显空洞；推回 50% 试试。";
      }
    } else {
      if (isMid) {
        elZoneTag.textContent = "正中死对半 · 上下抢戏";
        elZoneTag.dataset.tone = "alert";
        elVerdict.textContent = "山、日、帆都在画面里，地平线卡在正中 50% 把画面硬劈成两半，眼睛在天和海之间来回犹豫。";
      } else if (isEdge) {
        elZoneTag.textContent = "贴边压迫";
        elZoneTag.dataset.tone = "warn";
        elVerdict.textContent = "留白过偏让另一半失去存在感，远山或船影很容易顶到画框窒息。";
      } else if (pct < 46) {
        elZoneTag.textContent = "低地平 · 辽阔天穹";
        elZoneTag.dataset.tone = "calm";
        elVerdict.textContent = `天空占 ${sky}% 主导呼吸，海面占 ${pct}% 稳稳托底——最适合云海、日落与 021 原海报式轻盈开阔感。`;
      } else {
        elZoneTag.textContent = "高地平 · 沉静水面";
        elZoneTag.dataset.tone = "calm";
        elVerdict.textContent = `海面与大地占 ${pct}% 铺展肌理，天空退守 ${sky}%，适合波纹倒影、麦田肌理与厚重沉思感。`;
      }
    }

    document.querySelectorAll("[data-s3-preset]").forEach((b) => {
      b.setAttribute("aria-pressed", String(Math.abs(Number(b.dataset.s3Preset) - pct) <= 2));
    });
  }

  slider.addEventListener("input", update);
  document.querySelectorAll("[data-s3-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      complex = btn.dataset.s3Mode === "complex";
      document.querySelectorAll("[data-s3-mode]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      update();
    });
  });
  document.querySelectorAll("[data-s3-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.s3Preset;
      update();
    });
  });

  update();
}

// =========================================================
// 04 节：水平构图从哪来（四代编年时间带 + 真实画幅比例 SVG 骨架）
// =========================================================
export function initSection04Lineage() {
  const btns = document.querySelectorAll("[data-lineage-id]");
  if (!btns.length) return;
  const frameBox = document.getElementById("s4-ratio-box");
  const svg = document.getElementById("s4-svg");
  const elMeta = document.getElementById("s4-meta");
  const elTitle = document.getElementById("s4-title");
  const elWorkEn = document.getElementById("s4-work-en");
  const elSummary = document.getElementById("s4-summary");
  const elTakeaway = document.getElementById("s4-takeaway");

  function drawDiagram(item) {
    const W = Math.round(160 * item.ratio);
    const H = 160;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    frameBox.style.aspectRatio = `${W} / ${H}`;
    frameBox.style.maxWidth = `${Math.min(540, Math.round(210 * item.ratio))}px`;

    const hy = Math.round(H * (1 - item.horizonPct / 100));
    let extra = "";
    if (item.id === "ruisdael") {
      extra = `
        <rect x="0" y="0" width="${W}" height="${hy}" fill="#EFE4D2"/>
        <ellipse cx="${W * 0.36}" cy="${hy * 0.42}" rx="${W * 0.28}" ry="22" fill="#FBF5EC"/>
        <ellipse cx="${W * 0.68}" cy="${hy * 0.32}" rx="${W * 0.24}" ry="18" fill="#E3D7C5"/>
        <rect x="0" y="${hy}" width="${W}" height="${H - hy}" fill="#264F7B"/>
        <polygon points="${W * 0.22},${H} ${W * 0.44},${hy + 6} ${W * 0.60},${hy + 6} ${W * 0.46},${H}" fill="#F7ECDD" opacity="0.55"/>
        <rect x="${W * 0.72}" y="${hy - 14}" width="6" height="14" fill="#06182C"/>
        <polygon points="${W * 0.72},${hy - 14} ${W * 0.75},${hy - 24} ${W * 0.78},${hy - 14}" fill="#06182C"/>
      `;
    } else if (item.id === "wright") {
      extra = `
        <rect x="0" y="0" width="${W}" height="${hy}" fill="#F7ECDD"/>
        <rect x="0" y="${hy}" width="${W}" height="${H - hy}" fill="#D9CCB7"/>
        <rect x="${W * 0.14}" y="${hy - 44}" width="${W * 0.72}" height="44" fill="#EFE2CE" stroke="#06182C" stroke-width="1.5"/>
        <rect x="${W * 0.06}" y="${hy - 48}" width="${W * 0.88}" height="8" fill="#06182C"/>
        <rect x="${W * 0.18}" y="${hy - 26}" width="${W * 0.64}" height="10" fill="#264F7B"/>
        <rect x="${W * 0.08}" y="${hy - 6}" width="${W * 0.84}" height="6" fill="#D35638"/>
        <line x1="${W * 0.06}" y1="${hy - 60}" x2="${W * 0.94}" y2="${hy - 60}" stroke="#264F7B" stroke-width="1.2" stroke-dasharray="4 3"/>
      `;
    } else if (item.id === "cinemascope") {
      extra = `
        <rect x="0" y="0" width="${W}" height="${hy}" fill="#F7ECDD"/>
        <rect x="0" y="${hy}" width="${W}" height="${H - hy}" fill="#264F7B"/>
        <line x1="0" y1="${hy - 26}" x2="${W}" y2="${hy - 26}" stroke="#C9BCA8" stroke-width="1"/>
        <circle cx="${W * 0.20}" cy="${hy - 12}" r="7" fill="#06182C"/>
        <circle cx="${W * 0.36}" cy="${hy - 10}" r="6" fill="#06182C"/>
        <circle cx="${W * 0.74}" cy="${hy - 14}" r="9" fill="#D35638"/>
        <line x1="${W * 0.28}" y1="${hy - 12}" x2="${W * 0.64}" y2="${hy - 12}" stroke="#D35638" stroke-width="1.5" stroke-dasharray="5 3"/>
      `;
    } else {
      extra = `
        <rect x="0" y="0" width="${W}" height="${hy}" fill="#EDE4D6"/>
        <rect x="0" y="${hy}" width="${W}" height="${H - hy}" fill="#1E4167"/>
      `;
    }

    svg.innerHTML = `
      ${extra}
      <line x1="0" y1="${hy}" x2="${W}" y2="${hy}" stroke="#FBF5EC" stroke-width="2.2"/>
      <line x1="0" y1="${hy}" x2="${W}" y2="${hy}" stroke="#D35638" stroke-width="1" stroke-dasharray="4 4"/>
      <rect x="8" y="8" width="112" height="20" fill="#06182C"/>
      <text x="14" y="22" fill="#FBF5EC" font-family="Space Mono, monospace" font-size="10.5" font-weight="700">H ${item.horizonPct}% · ${item.ratio.toFixed(2)}:1</text>
    `;
  }

  function select(id) {
    const item = LINEAGE_ITEMS.find((x) => x.id === id) || LINEAGE_ITEMS[0];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lineageId === id)));
    elMeta.textContent = `${item.year} · ${item.era} · ${item.ratioText}`;
    elTitle.textContent = item.title;
    elWorkEn.textContent = item.workEn;
    elSummary.textContent = item.summary;
    elTakeaway.textContent = item.takeaway;
    drawDiagram(item);
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.lineageId)));
  select("ruisdael");
}

// =========================================================
// 05 节：打破沉闷 · 原海报三例锚点拆装（2D Canvas）
// =========================================================
export function initSection05Anchors() {
  const canvas = document.getElementById("s5-canvas");
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const elCaption = document.getElementById("s5-caption");
  const elWhy = document.getElementById("s5-why");
  const elPlaceNote = document.getElementById("s5-place-note");
  const btnToggleAnchor = document.getElementById("s5-toggle-anchor");
  const placeBtns = document.querySelectorAll("[data-s5-place]");

  let sceneId = "lighthouse";
  let hasAnchor = true;
  let placement = "rule"; // rule | center | rhythm

  function render() {
    const w = Math.max(240, Math.round(wrap.clientWidth));
    const h = Math.round(Math.min(260, Math.max(175, w * 0.42)));
    const c = fitCanvas(canvas, w, h);
    const hy = Math.round(h * 0.62);

    if (sceneId === "lighthouse") {
      // 海报示例 1：淡灰天空 + 海蓝水面 + 礁堤灯塔
      c.fillStyle = "#EAE5DC";
      c.fillRect(0, 0, w, hy);
      const sea = c.createLinearGradient(0, hy, 0, h);
      sea.addColorStop(0, "#4B7DA9");
      sea.addColorStop(1, "#2A5886");
      c.fillStyle = sea;
      c.fillRect(0, hy, w, h - hy);
      c.strokeStyle = "#FBF5EC";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, hy);
      c.lineTo(w, hy);
      c.stroke();

      if (hasAnchor) {
        const drawTower = (tx) => {
          c.fillStyle = "#2A3948";
          c.fillRect(tx - 16, hy - 7, w - (tx - 16), 8);
          c.fillStyle = "#FBF5EC";
          c.beginPath();
          c.moveTo(tx - 8, hy - 7);
          c.lineTo(tx - 5, hy - 44);
          c.lineTo(tx + 5, hy - 44);
          c.lineTo(tx + 8, hy - 7);
          c.closePath();
          c.fill();
          c.fillStyle = "#D35638";
          c.fillRect(tx - 6, hy - 51, 12, 7);
        };
        if (placement === "center") {
          c.fillStyle = "#2A3948";
          c.fillRect(w * 0.44, hy - 7, w * 0.12, 8);
          c.fillStyle = "#FBF5EC";
          c.fillRect(w * 0.5 - 6, hy - 46, 12, 39);
          c.fillStyle = "#D35638";
          c.fillRect(w * 0.5 - 7, hy - 53, 14, 7);
        } else {
          drawTower(w * 0.74);
          if (placement === "rhythm") {
            // 左侧小远帆呼应
            const bx = w * 0.24;
            c.fillStyle = "#FBF5EC";
            c.beginPath();
            c.moveTo(bx, hy - 2);
            c.lineTo(bx, hy - 20);
            c.lineTo(bx - 10, hy - 2);
            c.closePath();
            c.fill();
          }
        }
      }
    } else if (sceneId === "architecture") {
      // 海报示例 2：深海蓝天 + 长白墙 + 朱红双门
      c.fillStyle = "#264F7B";
      c.fillRect(0, 0, w, hy);
      c.fillStyle = "#F4ECE0";
      c.fillRect(0, hy, w, h - hy - 14);
      c.fillStyle = "#3A444F";
      c.fillRect(0, h - 14, w, 14);
      c.fillStyle = "#B8B1A6";
      c.fillRect(0, h - 18, w, 4);

      if (hasAnchor) {
        const doorH = Math.max(26, (h - hy - 18) * 0.62);
        const doorW = doorH * 0.82;
        const drawDoor = (dx) => {
          c.fillStyle = "#C84B31";
          c.fillRect(dx - doorW / 2, h - 18 - doorH, doorW, doorH);
          c.strokeStyle = "#06182C";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(dx, h - 18 - doorH);
          c.lineTo(dx, h - 18);
          c.stroke();
        };
        if (placement === "rule") drawDoor(w * 0.50);
        else if (placement === "center") drawDoor(w * 0.72);
        else {
          drawDoor(w * 0.28);
          drawDoor(w * 0.50);
          drawDoor(w * 0.72);
        }
      }
    } else {
      // 海报示例 3：淡米天空 + 金黄麦田 + 沿线行树
      c.fillStyle = "#ECE6DC";
      c.fillRect(0, 0, w, hy);
      const field = c.createLinearGradient(0, hy, 0, h);
      field.addColorStop(0, "#D3AC43");
      field.addColorStop(1, "#BA912E");
      c.fillStyle = field;
      c.fillRect(0, hy, w, h - hy);

      if (hasAnchor) {
        const xs = placement === "rule"
          ? [0.16, 0.21, 0.26, 0.38, 0.43, 0.49, 0.54, 0.63, 0.69, 0.74, 0.80, 0.85]
          : placement === "center"
            ? [0.14, 0.23, 0.32, 0.41, 0.50, 0.59, 0.68, 0.77, 0.86]
            : [0.71, 0.77];

        xs.forEach((nx, i) => {
          const tx = w * nx;
          const th = placement === "center" ? 26 : 22 + ((i * 7) % 10);
          c.strokeStyle = "#3E4A40";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(tx, hy);
          c.lineTo(tx, hy - th * 0.45);
          c.stroke();
          c.fillStyle = "#48594C";
          c.beginPath();
          c.arc(tx, hy - th * 0.66, th * 0.34, 0, Math.PI * 2);
          c.fill();
        });
      }
    }

    const sc = EXAMPLE_SCENES.find((s) => s.id === sceneId) || EXAMPLE_SCENES[0];
    elCaption.textContent = sc.posterCaption;
    btnToggleAnchor.textContent = hasAnchor ? `拆掉「${sc.anchorName}」` : `放回「${sc.anchorName}」`;
    btnToggleAnchor.setAttribute("aria-pressed", String(!hasAnchor));
    elWhy.textContent = hasAnchor ? sc.withWhy : sc.withoutWhy;

    placeBtns.forEach((b) => {
      const k = b.dataset.s5Place;
      b.textContent = sc.placements[k].label;
      b.disabled = !hasAnchor;
      b.setAttribute("aria-pressed", String(hasAnchor && placement === k));
    });
    elPlaceNote.textContent = hasAnchor
      ? sc.placements[placement].note
      : "当前锚点已拆走——点上方按钮放回锚点，对比视线落点变化。";
  }

  document.querySelectorAll("[data-s5-scene]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sceneId = btn.dataset.s5Scene;
      hasAnchor = true;
      placement = "rule";
      document.querySelectorAll("[data-s5-scene]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });
  btnToggleAnchor.addEventListener("click", () => {
    hasAnchor = !hasAnchor;
    render();
  });
  placeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      placement = btn.dataset.s5Place;
      render();
    });
  });

  new ResizeObserver(render).observe(wrap);
  render();
}

// =========================================================
// 06 节：什么时候别用（四张翻车对照卡）
// =========================================================
export function initSection06AntiCases() {
  const btns = document.querySelectorAll("[data-anti-id]");
  if (!btns.length) return;
  const badSvg = document.getElementById("s6-bad-svg");
  const goodSvg = document.getElementById("s6-good-svg");
  const elBadTag = document.getElementById("s6-bad-tag");
  const elGoodTag = document.getElementById("s6-good-tag");
  const elBadDesc = document.getElementById("s6-bad-desc");
  const elGoodDesc = document.getElementById("s6-good-desc");
  const elLinks = document.getElementById("s6-links");

  const DIAGRAMS = {
    tower: {
      bad: `
        <rect x="0" y="0" width="240" height="140" fill="#132B45"/>
        <rect x="0" y="96" width="240" height="44" fill="#1F446B"/>
        <rect x="96" y="42" width="48" height="54" fill="#E8DEC9"/>
        <line x1="0" y1="96" x2="240" y2="96" stroke="#FBF5EC" stroke-width="2"/>
        <line x1="0" y1="42" x2="240" y2="42" stroke="#D35638" stroke-width="1.5" stroke-dasharray="5 4"/>
      `,
      good: `
        <rect x="64" y="4" width="112" height="132" fill="#132B45" stroke="#537CA5" stroke-width="1"/>
        <polygon points="94,132 106,18 134,18 146,132" fill="#E8DEC9"/>
        <line x1="120" y1="8" x2="120" y2="132" stroke="#D35638" stroke-width="2" stroke-dasharray="4 3"/>
      `,
    },
    sprint: {
      bad: `
        <rect x="0" y="0" width="240" height="140" fill="#132B45"/>
        <line x1="0" y1="48" x2="240" y2="48" stroke="#537CA5" stroke-width="1.5"/>
        <line x1="0" y1="94" x2="240" y2="94" stroke="#FBF5EC" stroke-width="2"/>
        <circle cx="118" cy="64" r="9" fill="#E8DEC9"/>
        <rect x="111" y="75" width="14" height="19" fill="#E8DEC9"/>
      `,
      good: `
        <rect x="0" y="0" width="240" height="140" fill="#132B45"/>
        <line x1="10" y1="128" x2="230" y2="20" stroke="#D35638" stroke-width="2.5"/>
        <line x1="30" y1="136" x2="236" y2="44" stroke="#537CA5" stroke-width="1.4" stroke-dasharray="5 4"/>
        <g transform="translate(136,68) rotate(-24)">
          <circle cx="0" cy="-14" r="9" fill="#FBF5EC"/>
          <polygon points="-8,-2 12,-4 6,22 -14,20" fill="#FBF5EC"/>
        </g>
      `,
    },
    mobile: {
      bad: `
        <rect x="78" y="4" width="84" height="132" fill="#132B45" stroke="#537CA5" stroke-width="1.5"/>
        <rect x="78" y="68" width="84" height="68" fill="#1F446B"/>
        <line x1="78" y1="68" x2="162" y2="68" stroke="#D35638" stroke-width="3"/>
        <rect x="92" y="24" width="56" height="10" fill="#E8DEC9"/>
        <rect x="92" y="92" width="56" height="10" fill="#E8DEC9" opacity="0.6"/>
      `,
      good: `
        <rect x="78" y="4" width="84" height="132" fill="#132B45" stroke="#537CA5" stroke-width="1.5"/>
        <line x1="120" y1="12" x2="120" y2="128" stroke="#D35638" stroke-width="1.5" stroke-dasharray="4 3"/>
        <rect x="92" y="18" width="56" height="22" fill="#E8DEC9"/>
        <rect x="92" y="48" width="56" height="36" fill="#264F7B" stroke="#FBF5EC" stroke-width="1"/>
        <rect x="92" y="92" width="56" height="26" fill="#E8DEC9" opacity="0.8"/>
      `,
    },
    blinds: {
      bad: `
        <rect x="0" y="0" width="240" height="140" fill="#132B45"/>
        ${[14, 30, 46, 62, 78, 94, 110, 126].map((y) => `<rect x="12" y="${y}" width="216" height="7" fill="#E8DEC9"/>`).join("")}
      `,
      good: `
        <rect x="0" y="0" width="240" height="140" fill="#132B45"/>
        <rect x="0" y="92" width="240" height="48" fill="#264F7B"/>
        <line x1="0" y1="92" x2="240" y2="92" stroke="#FBF5EC" stroke-width="2.4"/>
        <circle cx="176" cy="48" r="16" fill="#D35638"/>
      `,
    },
  };

  function select(id) {
    const item = ANTI_CASES.find((c) => c.id === id) || ANTI_CASES[0];
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.antiId === id)));
    elBadTag.textContent = item.badTag;
    elGoodTag.textContent = item.goodTag;
    elBadDesc.textContent = item.badDesc;
    elGoodDesc.textContent = item.goodDesc;
    badSvg.innerHTML = DIAGRAMS[id].bad;
    goodSvg.innerHTML = DIAGRAMS[id].good;
    elLinks.innerHTML = `相关专页：<a href="https://layout.xiaoxiaodong.ai/${item.linkId}/play/" target="_blank" rel="noopener">${item.linkId} ${item.linkName}</a> · <a href="https://layout.xiaoxiaodong.ai/${item.linkId2}/play/" target="_blank" rel="noopener">${item.linkId2} ${item.linkName2}</a>`;
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.antiId)));
  select("tower");
}

// =========================================================
// 07 节：小练习（两题单变量同构选图，选后叠出校验虚线）
// =========================================================
export function initSection07Practice() {
  const grid = document.getElementById("s7-grid");
  if (!grid) return;
  const elPrompt = document.getElementById("s7-prompt");
  const elResult = document.getElementById("s7-result");
  const btnRetry = document.getElementById("s7-retry");
  const qTabs = document.querySelectorAll("[data-q-id]");

  let currentQ = "q1";
  let picked = null;

  function optionSvg(opt, showGuide) {
    const W = 280;
    const H = 148;
    const hy = Math.round(H * (1 - opt.horizon));
    const guide = showGuide
      ? `<line x1="0" y1="${hy}" x2="${W}" y2="${hy}" stroke="#D35638" stroke-width="1.6" stroke-dasharray="5 3"/>
         <rect x="6" y="6" width="94" height="19" fill="#06182C"/>
         <text x="12" y="19" fill="#FBF5EC" font-family="Space Mono, monospace" font-size="10" font-weight="700">${opt.tilt === 0 ? "0.0°" : `${opt.tilt > 0 ? "+" : "−"}${Math.abs(opt.tilt)}°`} · H ${Math.round(opt.horizon * 100)}%</text>`
      : "";

    if (opt.scene === "minimal") {
      return `
        <svg viewBox="0 0 ${W} ${H}" class="q-svg" aria-hidden="true">
          <g transform="rotate(${opt.tilt} ${W / 2} ${hy})">
            <rect x="-40" y="${hy - 220}" width="${W + 80}" height="220" fill="#EFE7DA"/>
            <rect x="-40" y="${hy}" width="${W + 80}" height="220" fill="#234B74"/>
            <line x1="-40" y1="${hy}" x2="${W + 40}" y2="${hy}" stroke="#FBF5EC" stroke-width="2"/>
          </g>
          ${guide}
        </svg>
      `;
    }

    const blocker = opt.blocker
      ? `<rect x="${W / 2 - 11}" y="0" width="22" height="${H}" fill="#102133"/>`
      : "";

    return `
      <svg viewBox="0 0 ${W} ${H}" class="q-svg" aria-hidden="true">
        <g transform="rotate(${opt.tilt} ${W / 2} ${hy})">
          <rect x="-40" y="${hy - 220}" width="${W + 80}" height="220" fill="#F7ECDD"/>
          <path d="M 10 ${hy} Q 72 ${hy - 24} 134 ${hy - 12} Q 204 ${hy - 30} 290 ${hy - 10} L 290 ${hy} Z" fill="#183A5C"/>
          <rect x="-40" y="${hy}" width="${W + 80}" height="220" fill="#264F7B"/>
          <!-- 低矮长屋与红门 -->
          <rect x="64" y="${hy - 16}" width="152" height="16" fill="#FAF3E9"/>
          <rect x="52" y="${hy - 20}" width="176" height="4" fill="#06182C"/>
          <rect x="164" y="${hy - 11}" width="12" height="11" fill="#D35638"/>
          <line x1="-40" y1="${hy}" x2="${W + 40}" y2="${hy}" stroke="#FBF5EC" stroke-width="2"/>
        </g>
        ${blocker}
        ${guide}
      </svg>
    `;
  }

  function render() {
    const q = PRACTICE_QUESTIONS.find((x) => x.id === currentQ) || PRACTICE_QUESTIONS[0];
    qTabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.qId === currentQ)));
    elPrompt.textContent = q.prompt;

    const answered = picked !== null;
    grid.innerHTML = q.options.map((opt) => {
      let cls = "q-card";
      let mark = "";
      if (answered) {
        if (opt.id === q.correct) { cls += " is-right"; mark = "推荐解"; }
        else if (opt.id === picked) { cls += " is-wrong"; mark = "你的选择"; }
      }
      return `
        <button type="button" class="${cls}" data-opt-id="${opt.id}" aria-pressed="${picked === opt.id}">
          <span class="q-head">
            <span class="q-lbl">${opt.label}</span>
            ${mark ? `<span class="q-mark">${mark}</span>` : ""}
          </span>
          ${optionSvg(opt, answered)}
          ${answered ? `<span class="q-reason">${opt.reason}</span>` : ""}
        </button>
      `;
    }).join("");

    grid.querySelectorAll("[data-opt-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        picked = btn.dataset.optId;
        render();
      });
    });

    if (!answered) {
      elResult.textContent = "先观察四幅画的水平基准、天地切分与横向连贯性，点选你认为最稳的一幅。";
      elResult.dataset.tone = "";
      btnRetry.hidden = true;
    } else {
      const ok = picked === q.correct;
      elResult.textContent = ok
        ? `答对了！方案 ${q.correct} 成立。四张图上已叠出红虚线基准尺，可逐一对照其余三项的单一破绽。`
        : `你选了方案 ${picked}，这题更稳的是方案 ${q.correct}。已叠出红色水平基准尺，对照下方逐项理由看差别。`;
      elResult.dataset.tone = ok ? "ok" : "warn";
      btnRetry.hidden = false;
    }
  }

  qTabs.forEach((b) => {
    b.addEventListener("click", () => {
      currentQ = b.dataset.qId;
      picked = null;
      render();
    });
  });
  btnRetry.addEventListener("click", () => {
    picked = null;
    render();
  });

  render();
}

// =========================================================
// 08 节：原海报灯箱（点击放大、滚轮/按钮缩放、拖动平移、Esc 关闭）
// =========================================================
export function initSection08Lightbox() {
  const trigger = document.getElementById("poster-open");
  const posterImg = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const btnClose = document.getElementById("lb-close");
  const btnIn = document.getElementById("lb-in");
  const btnOut = document.getElementById("lb-out");
  const btnReset = document.getElementById("lb-reset");
  const stage = document.getElementById("lb-stage");
  if (!trigger || !modal || !posterImg || !lbImg) return;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function open() {
    // 复用同一张内联海报图，不额外内联第二份
    if (!lbImg.src) lbImg.src = posterImg.src;
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === stage) close();
  });
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") close();
  });

  btnIn?.addEventListener("click", () => {
    scale = Math.min(3.2, Number((scale + 0.35).toFixed(2)));
    applyTransform();
  });
  btnOut?.addEventListener("click", () => {
    scale = Math.max(0.75, Number((scale - 0.35).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    applyTransform();
  });
  btnReset?.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    scale = Math.max(0.75, Math.min(3.5, Number((scale + delta).toFixed(2))));
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    lbImg.setPointerCapture?.(e.pointerId);
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    applyTransform();
  });
  const endDrag = () => { dragging = false; };
  lbImg.addEventListener("pointerup", endDrag);
  lbImg.addEventListener("pointercancel", endDrag);
}
