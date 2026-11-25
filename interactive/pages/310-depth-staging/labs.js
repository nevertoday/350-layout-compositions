// 正文 01–07 节的独立交互实验模块（相邻两节使用不同控件与交互形式）
import { loop, pixelRatio } from "../../lib/stage.js";

// ---------- 01 节：三片景层独立剥离台（Checkbox 图层栈） ----------
export function initLayerStack() {
  const host = document.getElementById("lab-layers");
  if (!host) return;
  const checks = {
    fg: host.querySelector('#toggle-fg'),
    mg: host.querySelector('#toggle-mg'),
    bg: host.querySelector('#toggle-bg'),
  };
  const svg = host.querySelector("svg");
  const titleEl = host.querySelector("#layer-note-title");
  const bodyEl = host.querySelector("#layer-note-body");

  const CASES = {
    "111": ["三层完整：环境、过渡与主角同时成立", "前景黑影稳稳锁住第一眼，中景人物承上启下把视线引向远方，后景圆月与远影交代时空氛围。"],
    "110": ["抽掉后景：人物关系还在，但世界没了背景", "画面退回封闭的局部对话，观众看不到人物身处何地、背后有什么环境压力。"],
    "101": ["抽掉中景：前景与后景突然断档跳空", "近处太大、远处太小，中间缺少「承上启下」的过渡阶梯，视觉像掉进一道断崖。"],
    "011": ["抽掉前景：像一张远观空镜，少了当下锚点", "没有近景体量把人拉进空间，画面虽然有环境与中段人物，却显得克制疏离、抓力变弱。"],
    "100": ["只剩前景：退化成孤立的单人特写", "看不到周围环境与其他角色，纵深空间几乎消失。"],
    "010": ["只剩中景：平面中景，失去近远尺寸对比", "所有信息都停在同一深度带，和常规中景平拍没有区别。"],
    "001": ["只剩后景：纯氛围空镜", "适合开场交代时间地点，但尚未切入具体人物动作。"],
    "000": ["三层全关：只剩下空荡透视壳子", "打开任意景层，观察每一片如何把空间变成故事。"],
  };

  const update = () => {
    const f = checks.fg.checked ? 1 : 0;
    const m = checks.mg.checked ? 1 : 0;
    const b = checks.bg.checked ? 1 : 0;
    svg.dataset.fg = String(f);
    svg.dataset.mg = String(m);
    svg.dataset.bg = String(b);
    const [t, d] = CASES[`${f}${m}${b}`];
    titleEl.textContent = t;
    bodyEl.textContent = d;
  };
  Object.values(checks).forEach((el) => el.addEventListener("change", update));
  update();
}

// ---------- 02 节：焦段与物距比联动双视图 Canvas（Range 滑块 + 等高模式开关） ----------
export function initLensLab() {
  const canvas = document.getElementById("lens-canvas");
  const slider = document.getElementById("lens-range");
  const matchCheck = document.getElementById("lens-match");
  const valEl = document.getElementById("lens-val");
  const ratioEl = document.getElementById("lens-ratio");
  const distEl = document.getElementById("lens-dist");
  const textEl = document.getElementById("lens-text");
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  // 三人真实站位不变：前景 3.2m，中景 9.5m，后景 21.2m（总纵深 18.0m）
  const Z_FG = 3.2, Z_MG = 9.5, Z_BG = 21.2;

  const drawFrame = () => {
    const focal = Number(slider.value);
    const keepMatch = matchCheck.checked;
    // 若勾选「保持前景等高」，机位随焦段沿 Z 轴退远，使前景物距与焦段成正比
    const camBack = keepMatch ? Z_FG * (focal / 35 - 1) : 0;
    const dFg = Math.max(1.2, Z_FG + camBack);
    const dMg = Math.max(2.0, Z_MG + camBack);
    const dBg = Math.max(3.0, Z_BG + camBack);

    const hFg = (1.76 * focal) / (24 * dFg);
    const hMg = (1.76 * focal) / (24 * dMg);
    const hBg = (1.76 * focal) / (24 * dBg);
    const ratio = hFg / hBg;

    valEl.textContent = `${focal}mm`;
    ratioEl.textContent = `${ratio.toFixed(1)}×`;
    distEl.textContent = keepMatch ? `机位退距 ${camBack >= 0 ? "+" : ""}${camBack.toFixed(1)}m` : "原地定机位 0.0m";

    if (!keepMatch) {
      textEl.textContent =
        focal <= 35
          ? `原地定机位下，物距比始终是 ${(Z_BG / Z_FG).toFixed(1)}×——光拧变焦环并不会改变透视比例，只是裁切视角。`
          : `原地定机位换到 ${focal}mm，近远比例依然是 ${(Z_BG / Z_FG).toFixed(1)}×，但画框迅速收窄，前景人物被裁切溢框。`;
    } else if (focal <= 28) {
      textEl.textContent = `${focal}mm 广角逼近前景（物距 ${dFg.toFixed(1)}m），近远物距比飙升到 ${ratio.toFixed(1)}×，18 米纵深被剧烈拉开，画面张力极强。`;
    } else if (focal <= 50) {
      textEl.textContent = `${focal}mm 接近经典深度调度甜区：前景物距 ${dFg.toFixed(1)}m，近远身高比 ${ratio.toFixed(1)}×，既拉开三层又不让近景过度变形。`;
    } else if (focal <= 90) {
      textEl.textContent = `${focal}mm 中长焦需退后 ${camBack.toFixed(1)}m 才装得下前景，近远身高比跌至 ${ratio.toFixed(1)}×，三层开始向同一平面靠拢。`;
    } else {
      textEl.textContent = `${focal}mm 长焦迫使机位退远 ${camBack.toFixed(1)}m，虽然人仍站开 18m，近远身高比已被压扁到 ${ratio.toFixed(1)}×，纵深感大幅消散。`;
    }

    const r = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.round(r.width));
    const h = Math.max(180, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 底色
    ctx.fillStyle = "#160D38";
    ctx.fillRect(0, 0, w, h);

    const split = w < 460 ? 0 : Math.round(w * 0.45);
    const pad = 16;

    // 左半：俯视机位与视锥（宽屏或中屏显示；窄屏压到上半或合并）
    if (split > 0) {
      const lw = split - pad;
      ctx.fillStyle = "#1F1449";
      ctx.fillRect(pad, pad, lw - pad, h - pad * 2);
      ctx.strokeStyle = "rgba(138,214,203,0.28)";
      ctx.strokeRect(pad, pad, lw - pad, h - pad * 2);

      // 坐标映射：纵深范围 [-12m .. +24m] -> [pad+18 .. lw-18]
      const mapX = (zWorld) => pad + 18 + ((zWorld + 11) / 36) * (lw - pad - 36);
      const cy = h * 0.54;
      const camX = mapX(-camBack);
      const fgX = mapX(Z_FG);
      const mgX = mapX(Z_MG);
      const bgX = mapX(Z_BG);

      // 视锥扇形
      const halfAngle = Math.atan((18 / focal) * 0.8);
      const coneLen = bgX - camX + 14;
      const dy = Math.min(h * 0.36, Math.tan(halfAngle) * coneLen);
      ctx.fillStyle = "rgba(113, 177, 188, 0.16)";
      ctx.beginPath();
      ctx.moveTo(camX, cy);
      ctx.lineTo(bgX + 12, cy - dy);
      ctx.lineTo(bgX + 12, cy + dy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(138, 214, 203, 0.65)";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(camX, cy); ctx.lineTo(bgX + 12, cy - dy);
      ctx.moveTo(camX, cy); ctx.lineTo(bgX + 12, cy + dy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 机位点
      ctx.fillStyle = "#ECDDCB";
      ctx.fillRect(camX - 5, cy - 5, 10, 10);

      // 三个站位点（固定不动，证明是机位退远改变了物距比）
      const pts = [
        { x: fgX, y: cy + 16, col: "#79B6AD", lbl: "前 3.2m" },
        { x: mgX, y: cy - 10, col: "#428CA6", lbl: "中 9.5m" },
        { x: bgX, y: cy + 12, col: "#A994CA", lbl: "后 21.2m" },
      ];
      for (const p of pts) {
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ECDDCB";
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.fillText("俯视物距 TOP VIEW", pad + 10, pad + 18);
      ctx.fillStyle = "#8AD6CB";
      ctx.fillText(`站位固定 18.0m`, pad + 10, h - pad - 8);
    }

    // 右半（或窄屏全幅）：摄影机实拍画面效果
    const rx = split > 0 ? split : pad;
    const rw = w - rx - pad;
    const ry = pad;
    const rh = h - pad * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();

    // 暮紫夜空 + 透视地平线
    const sg = ctx.createLinearGradient(0, ry, 0, ry + rh);
    sg.addColorStop(0, "#2D1F5F");
    sg.addColorStop(0.5, "#6E5A97");
    sg.addColorStop(0.51, "#163B59");
    sg.addColorStop(1, "#0B243B");
    ctx.fillStyle = sg;
    ctx.fillRect(rx, ry, rw, rh);

    const hzY = ry + rh * 0.48;
    // 透视收敛桥面（随焦段收窄或拉宽）
    const spread = Math.min(0.48, 0.16 + (35 / focal) * 0.22);
    ctx.fillStyle = "rgba(113,177,188,0.22)";
    ctx.beginPath();
    ctx.moveTo(rx + rw * (0.5 - spread * 0.22), hzY);
    ctx.lineTo(rx + rw * (0.5 + spread * 0.22), hzY);
    ctx.lineTo(rx + rw * (0.5 + spread * 1.15), ry + rh);
    ctx.lineTo(rx + rw * (0.5 - spread * 1.15), ry + rh);
    ctx.closePath();
    ctx.fill();

    // 画三个等比高度的剪影人（由远到近）
    const drawFig = (u, hFrac, fill, rim, tag) => {
      const px = rx + rw * u;
      const fh = hFrac * rh * 0.92;
      const fw = fh * 0.28;
      // 脚底相对地平线（眼高 1.54 / 1.76 = 0.875 在地平线处）
      const headY = hzY - fh * 0.14;
      const footY = headY + fh;
      ctx.fillStyle = fill;
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1.4;
      // 头
      ctx.beginPath();
      ctx.ellipse(px, headY + fh * 0.08, fw * 0.24, fh * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 身体剪影
      ctx.beginPath();
      ctx.moveTo(px - fw * 0.45, headY + fh * 0.22);
      ctx.lineTo(px + fw * 0.45, headY + fh * 0.22);
      ctx.lineTo(px + fw * 0.34, footY);
      ctx.lineTo(px - fw * 0.34, footY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 高度标尺
      ctx.fillStyle = "#F5ECE0";
      ctx.font = '500 11px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(tag, px, Math.max(ry + 14, headY - 6));
      ctx.textAlign = "left";
    };

    drawFig(0.76, hBg, "#372963", "#C4B1E1", `后 ${Math.round(hBg * 100)}%`);
    drawFig(0.50, hMg, "#122B4C", "#69A9C2", `中 ${Math.round(hMg * 100)}%`);
    drawFig(0.24, hFg, "#050A1F", "#8AD6CB", `前 ${Math.round(hFg * 100)}%`);

    ctx.fillStyle = "#ECDDCB";
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.fillText(`实拍视野 · ${focal}mm`, rx + 10, ry + 18);
    ctx.restore();

    ctx.strokeStyle = "rgba(236, 221, 203, 0.35)";
    ctx.strokeRect(rx, ry, rw, rh);
  };

  slider.addEventListener("input", drawFrame);
  matchCheck.addEventListener("change", drawFrame);
  const { draw } = loop(canvas, () => drawFrame());
  new ResizeObserver(() => draw()).observe(canvas);
  draw();
}

// ---------- 03 节：三种叙事推进时间轴推演剧场（播放/暂停 + 进度条 + 关注度模型示意曲线） ----------
export function initNarrativeLab() {
  const host = document.getElementById("lab-narrative");
  if (!host) return;
  const canvas = host.querySelector("#nar-canvas");
  const modeBtns = [...host.querySelectorAll("[data-nar]")];
  const playBtn = host.querySelector("#nar-play");
  const scrub = host.querySelector("#nar-scrub");
  const timeOut = host.querySelector("#nar-time");
  const capTitle = host.querySelector("#nar-cap-title");
  const capBody = host.querySelector("#nar-cap-body");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const MODES = {
    farToNear: {
      title: "由远及近 · 从环境到人物，逐步聚焦核心",
      body: "主角从 22m 远岸走进前景 3.4m：画面先交代暮色与场域，随着人物越走越近、体量撑开，观众的注意力被自然收束到核心动作上。",
      // 返回 t ∈ [0,1] 时三人 (z, u) 与示意关注度 y ∈ [0,1]
      sample(p) {
        const zA = 22.0 - p * 18.6;
        return {
          actors: [
            { id: "A", z: zA, u: 0.32 + p * 0.32, focus: true },
            { id: "B", z: 12.0, u: 0.24, focus: false },
          ],
          curve: (x) => 0.16 + 0.72 * Math.pow(x, 1.15),
          focusLabel: p < 0.35 ? "交代环境" : p < 0.75 ? "步入中景" : "锁定前景核心",
        };
      },
    },
    nearToFar: {
      title: "由近及远 · 从细节到全景，传递信息与情绪",
      body: "主角从前景 3.4m 转身退入 21.5m 深处：开头用大剪影抓住情绪，随着背影渐行渐远、画面把空间交还给庞大的环境，生出离别、孤立或悬念感。",
      sample(p) {
        const zA = 3.4 + p * 18.1;
        return {
          actors: [
            { id: "A", z: zA, u: 0.28 + p * 0.36, focus: true },
            { id: "B", z: 9.2, u: 0.74, focus: false },
          ],
          curve: (x) => 0.86 - 0.68 * Math.pow(x, 1.05),
          focusLabel: p < 0.3 ? "前景细节锚定" : p < 0.7 ? "纵深抽离" : "融入远景全景",
        };
      },
    },
    dialogue: {
      title: "层次对话 · 前中后景互动，注意力多点接力",
      body: "三人稳驻三层，通过动作、抬头与亮光提示让视线在前、中、后景间来回摆渡——观众不必靠正反打切镜，就能同时看见三方反应。",
      sample(p) {
        const activeIdx = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
        return {
          actors: [
            { id: "A", z: 3.6, u: 0.24, focus: activeIdx === 0 },
            { id: "B", z: 10.2, u: 0.52, focus: activeIdx === 1 },
            { id: "C", z: 21.0, u: 0.78, focus: activeIdx === 2 },
          ],
          curve: (x) => 0.48 + 0.34 * Math.sin(x * Math.PI * 5 - Math.PI / 2),
          focusLabel: activeIdx === 0 ? "前景起势" : activeIdx === 1 ? "中景接话" : "后景回应",
        };
      },
    },
  };

  let mode = "farToNear";
  let progress = 0.22;
  let playing = false;

  const syncLabels = () => {
    capTitle.textContent = MODES[mode].title;
    capBody.textContent = MODES[mode].body;
    timeOut.textContent = `${(progress * 6).toFixed(1)}s / 6.0s`;
    scrub.value = String(Math.round(progress * 100));
    playBtn.textContent = playing ? "暂停推演" : "播放走位";
    playBtn.setAttribute("aria-pressed", String(playing));
    modeBtns.forEach((b) => {
      const active = b.dataset.nar === mode;
      b.setAttribute("aria-pressed", String(active));
    });
  };

  const render = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    const h = Math.max(190, Math.round(r.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#130B31";
    ctx.fillRect(0, 0, w, h);

    const wide = w >= 540;
    const stageW = wide ? Math.round(w * 0.62) : w;
    const stageH = wide ? h : Math.round(h * 0.64);
    const curveX = wide ? stageW + 14 : 12;
    const curveY = wide ? 12 : stageH + 10;
    const curveW = wide ? w - stageW - 26 : w - 24;
    const curveH = wide ? h - 24 : h - stageH - 20;

    // 1. 走位舞台
    const g = ctx.createLinearGradient(0, 0, 0, stageH);
    g.addColorStop(0, "#241654");
    g.addColorStop(0.46, "#695590");
    g.addColorStop(0.47, "#163A57");
    g.addColorStop(1, "#0B1D36");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, stageW, stageH);

    // 远方圆月
    ctx.fillStyle = "#EDDACD";
    ctx.beginPath();
    ctx.arc(stageW * 0.28, stageH * 0.24, Math.min(stageW, stageH) * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 透视通道线
    ctx.strokeStyle = "rgba(138, 214, 203, 0.26)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stageW * 0.42, stageH * 0.46); ctx.lineTo(stageW * 0.06, stageH);
    ctx.moveTo(stageW * 0.58, stageH * 0.46); ctx.lineTo(stageW * 0.94, stageH);
    ctx.stroke();

    const data = MODES[mode].sample(progress);
    const farToNear = [...data.actors].sort((a, b) => b.z - a.z);
    for (const act of farToNear) {
      const hFrac = Math.min(0.76, (1.76 * 35) / (24 * act.z));
      const fh = hFrac * stageH * 0.9;
      const fw = fh * 0.28;
      const px = act.u * stageW;
      const headY = stageH * 0.46 - fh * 0.14;
      const footY = headY + fh;

      if (act.focus) {
        ctx.save();
        ctx.strokeStyle = "#8AD6CB";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(px - fw * 0.75, headY - 6, fw * 1.5, fh + 10);
        ctx.restore();
      }

      ctx.fillStyle = act.z < 6 ? "#05091E" : act.z < 14 ? "#0E203E" : "#35275E";
      ctx.beginPath();
      ctx.ellipse(px, headY + fh * 0.08, fw * 0.24, fh * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - fw * 0.45, headY + fh * 0.22);
      ctx.lineTo(px + fw * 0.45, headY + fh * 0.22);
      ctx.lineTo(px + fw * 0.34, footY);
      ctx.lineTo(px - fw * 0.34, footY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#F5ECE0";
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.fillText(data.focusLabel, 12, 20);

    // 2. 右侧/下方关注度模型示意曲线（忠实呼应 310 原海报右下曲线并诚实标注「模型示意」）
    ctx.fillStyle = "#1D1344";
    ctx.fillRect(curveX, curveY, curveW, curveH);
    ctx.strokeStyle = "rgba(138, 214, 203, 0.28)";
    ctx.strokeRect(curveX, curveY, curveW, curveH);

    const padX = 14, padT = 26, padB = 22;
    const gx0 = curveX + padX;
    const gx1 = curveX + curveW - padX;
    const gy0 = curveY + padT;
    const gy1 = curveY + curveH - padB;

    // 坐标轴虚线
    ctx.strokeStyle = "rgba(236, 221, 203, 0.25)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1);
    ctx.stroke();
    ctx.setLineDash([]);

    // 关注度虚线曲线
    ctx.strokeStyle = "#8AD6CB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = gx0 + u * (gx1 - gx0);
      const y = gy1 - data.curve(u) * (gy1 - gy0);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 当前时刻高亮圆点
    const dotX = gx0 + progress * (gx1 - gx0);
    const dotY = gy1 - data.curve(progress) * (gy1 - gy0);
    ctx.fillStyle = "#ECDDCB";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#130B31";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#C8BBE0";
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.fillText("关注度曲线（模型示意）", gx0, curveY + 16);
    ctx.fillText("起势", gx0, curveY + curveH - 7);
    ctx.textAlign = "right";
    ctx.fillText("推进终点", gx1, curveY + curveH - 7);
    ctx.textAlign = "left";
  };

  const { draw } = loop(canvas, (_t, dt, { still }) => {
    if (playing && !still) {
      progress += (dt || 0.016) / 6.0;
      if (progress >= 1) progress = 0;
      syncLabels();
    }
    render();
  });

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.nar;
      progress = 0.22;
      playing = false;
      syncLabels();
      draw();
    });
  });

  playBtn.addEventListener("click", () => {
    playing = !playing;
    syncLabels();
    draw();
  });

  scrub.addEventListener("input", () => {
    playing = false;
    progress = Number(scrub.value) / 100;
    syncLabels();
    draw();
  });

  syncLabels();
  draw();
}

// ---------- 04 节：视线走廊四步实拍修法（单选方案切换 + SVG 实时遮挡对照） ----------
export function initSightlineLab() {
  const host = document.getElementById("lab-sightline");
  if (!host) return;
  const btns = [...host.querySelectorAll("[data-fix]")];
  const svg = host.querySelector("svg");
  const meter = host.querySelector("#fix-meter");
  const body = host.querySelector("#fix-body");

  const FIXES = {
    clash: {
      meter: "重叠 78% · 后景被挡死",
      body: "三人落在同一条平视中轴线上：前景人物高大宽阔，直接吞掉了中景半身与后景全部轮廓，纵深形同虚设。",
    },
    lateral: {
      meter: "重叠 0% · 横向半步走廊",
      body: "前景往左挪半步、中景偏右、后景落在两人之间的空缝里——不用动摄影机，就能开辟出一条干净的斜向视线走廊。",
    },
    elevate: {
      meter: "重叠 8% · 机位升高 0.5m",
      body: "狭长过道无法左右错开时，把机位微微抬高俯拍，地面透视打开，后景人物的头肩立刻从前景肩线之上完整露出来。",
    },
    frame: {
      meter: "重叠 0% · 门框套出远影",
      body: "把前景人物推到右侧做暗部锚框，借建筑门洞的几何开口把远景人物稳稳套在中央——遮挡反而成了指向焦点的取景框。",
    },
  };

  const setFix = (key) => {
    svg.dataset.fix = key;
    meter.textContent = FIXES[key].meter;
    body.textContent = FIXES[key].body;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fix === key)));
  };

  btns.forEach((b) => b.addEventListener("click", () => setFix(b.dataset.fix)));
  setFix("clash");
}

// ---------- 05 节：电影史胶片节点复现器 ----------
export function initHistoryLab() {
  const host = document.getElementById("lab-history");
  if (!host) return;
  const btns = [...host.querySelectorAll("[data-era]")];
  const svg = host.querySelector("svg");
  const titleEl = host.querySelector("#era-title");
  const metaEl = host.querySelector("#era-meta");
  const bodyEl = host.querySelector("#era-body");

  const ERAS = {
    lumiere: {
      title: "1895 · 站台斜进纵深",
      meta: "卢米埃尔兄弟《火车进站》· MoMA 藏品定年 1895",
      body: "摄影机没有垂直对着铁轨平拍，而是斜架在站台一侧，让蒸汽机车从后景远端沿对角线一路驶向前景边缘，首次让银幕观众直观感受到 Z 轴逼近的压迫与空间纵深。",
    },
    silent: {
      title: "1910s · 默片门廊多层排演",
      meta: "费雅德 / 鲍威尔 · 见波德威尔《电影风格史》(1997)",
      body: "在频繁切镜尚未成为唯一常规之前，欧洲默片导演已善用敞开的门廊、屏风与长廊，把潜伏者、对话者与远方来客布置在同一长镜头的三个景层里，靠人物走位推动悬念。",
    },
    kane: {
      title: "1941 · 深度调度 × 深焦摄影巅峰",
      meta: "奥逊·威尔斯 & 格雷格·托兰德《公民凯恩》",
      body: "借高感光胶片、广角镀膜镜头、强光小光圈与带天花板实景，童年雪地签字一场里前景律师、中景母亲与窗外玩雪的凯恩三层同时锐利清晰，观众自己决定先看哪一层。",
    },
    modern: {
      title: "当代 · 浅焦移焦的深度空间",
      meta: "深度空间（调度）≠ 深焦（光学）·《电影艺术》(1979)",
      body: "今天不必把前后景拍得一样锐利也能做深度调度：先用浅景深锁住前景表情，再靠移焦把清晰带瞬间推向后景，同样把空间层次转化为戏剧转折。",
    },
  };

  const select = (key) => {
    svg.dataset.era = key;
    titleEl.textContent = ERAS[key].title;
    metaEl.textContent = ERAS[key].meta;
    bodyEl.textContent = ERAS[key].body;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === key)));
  };

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.era)));
  select("kane");
}

// ---------- 06 节：什么时候别硬拉纵深（四场景 × 双态对照卡） ----------
export function initCounterLab() {
  const host = document.getElementById("lab-counter");
  if (!host) return;
  const caseBtns = [...host.querySelectorAll("[data-case]")];
  const toggleBtn = host.querySelector("#counter-toggle");
  const svg = host.querySelector("svg");
  const tagEl = host.querySelector("#counter-tag");
  const bodyEl = host.querySelector("#counter-body");

  const CASES = {
    flat: {
      badTag: "硬拉纵深 · 破坏荒诞工整感",
      goodTag: "换用平面调度 · 秩序一目了然",
      badBody: "本该平铺直叙的对称群像一旦硬拉前后纵深，近处角色体量膨胀抢戏，庄重或冷幽默的几何平等感被打破。",
      goodBody: "把人物平行贴在墙面同一深度层上，左右等大排开——需要扁平秩序时，直接用平面调度更见功力。",
    },
    cramped: {
      badTag: "狭小空间硬塞超广角 · 边缘畸变",
      goodTag: "借近景遮挡 · 紧凑更有张力",
      badBody: "电梯或车厢物理纵深不足 2 米，硬上超广角拉景深只会让近处人脸边缘拉伸变形，空间看起来虚假夸张。",
      goodBody: "狭小场景里放弃大纵深三层结构，改用中焦借同伴肩线做前景轻遮挡（脏单人镜头），真实感立刻回来。",
    },
    equal: {
      badTag: "喜剧双人戏强分前后 · 主次失衡",
      goodTag: "改用横向调度 · 两人平起平坐",
      badBody: "双人平权对峙或快节奏喜剧对口戏，把一人推到后景会天然削弱他的视觉分量，包袱节奏跟着失重。",
      goodBody: "让两人站在相近深度带左右对望，用横向阅读流承接台词抛接，权力关系一目了然。",
    },
    mobile: {
      badTag: "竖屏小图硬塞三层 · 后景缩成噪点",
      goodTag: "精简为两层 · 小屏一秒读懂",
      badBody: "在 390px 手机竖屏或信息卡里硬拉 20 米纵深，后景人物缩到不足十几个像素，动作细节完全糊成黑点。",
      goodBody: "小尺寸画幅优先保住「一主一辅」两层关系，舍弃多余远景细节，清晰度远胜形式上的三层。",
    },
  };

  let curCase = "flat";
  let fixed = false;

  const update = () => {
    svg.dataset.case = curCase;
    svg.dataset.fixed = String(fixed);
    const info = CASES[curCase];
    tagEl.textContent = fixed ? info.goodTag : info.badTag;
    tagEl.classList.toggle("is-good", fixed);
    bodyEl.textContent = fixed ? info.goodBody : info.badBody;
    toggleBtn.textContent = fixed ? "看硬拉纵深的反效果" : "切到更合适的调度";
    toggleBtn.setAttribute("aria-pressed", String(fixed));
    caseBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.case === curCase)));
  };

  caseBtns.forEach((b) => b.addEventListener("click", () => { curCase = b.dataset.case; fixed = false; update(); }));
  toggleBtn.addEventListener("click", () => { fixed = !fixed; update(); });
  update();
}

// ---------- 07 节：四套走位单选练习（无剧透标签，仅差一个构图变量） ----------
export function initPractice() {
  const host = document.getElementById("lab-practice");
  if (!host) return;
  const btns = [...host.querySelectorAll(".quiz-opt")];
  const verdict = host.querySelector("#quiz-verdict");
  const vTitle = host.querySelector("#quiz-title");
  const vBody = host.querySelector("#quiz-body");

  const FEEDBACK = {
    A: {
      ok: false,
      title: "A 不够成立 · 只差「纵深跨度」",
      body: "三人横向确实没互挡，但全都挤在 9–11m 的中景同一平面上，近远身高几乎一样，观众一眼分不出谁是当下执信的主角、谁是远处将离去的背影。",
    },
    B: {
      ok: false,
      title: "B 不够成立 · 只差「视线走廊」",
      body: "三人的前/中/后深度已经拉开了，但前景执信者正好站在画面中轴线上，硕大的风衣剪影把中景观察者挡去了大半，层次信息在半路被堵死。",
    },
    C: {
      ok: true,
      title: "选对了 · C 三层与视线走廊同时成立",
      body: "前景执信者（右前 3.2m）体量清晰锁住目光，中景观察者（左中 10m）承上启下，远岸背影（中偏右 22m）立在灯影之下；三人横向错开、近大远小，不切镜就讲清三方张力。",
    },
    D: {
      ok: false,
      title: "D 不够成立 · 只差「中景过渡」",
      body: "前景与后景虽然错开了位置，但中间人紧挨主角挤进 3.5m 前景带，导致近处双人抢戏、中景整层空心断档，视线从前景跳往远岸时缺少承接。",
    },
  };

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.dataset.opt;
      const fb = FEEDBACK[pick];
      host.classList.add("is-answered");
      verdict.dataset.state = fb.ok ? "ok" : "wrong";
      vTitle.textContent = fb.title;
      vBody.textContent = fb.body;
      btns.forEach((b) => {
        const isPick = b.dataset.opt === pick;
        b.setAttribute("aria-pressed", String(isPick));
        b.classList.toggle("is-correct", b.dataset.opt === "C");
        b.classList.toggle("is-wrong", isPick && !fb.ok);
      });
    });
  });
}
