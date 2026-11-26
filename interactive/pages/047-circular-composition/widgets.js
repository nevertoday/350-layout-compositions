// 047 圆形构图 · 正文各节独立交互模块（相邻两节绝不复用同一种控件）
// 01 弧段剥离与闭合临界实验室
// 02 X-Ray 构图骨架剥离幕帘
// 03 四步动态建构剧场 + 跳步破坏试验
// 04 东西方历史圆构图骨架对照切换器
// 05 画幅死角率实时压测器
// 06 双题单变量目测小练习
// 07 原海报缩放拖拽灯箱

import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";

// ============================================================
// 01 弧段剥离与闭合临界实验室（8 段可点切圆弧 + 显/虚/借弧切换）
// ============================================================
export function initClosureLab() {
  const host = document.getElementById("closureLab");
  if (!host) return;
  const svg = host.querySelector("#closureSvg");
  const segBtns = [...host.querySelectorAll("[data-seg]")];
  const modeBtns = [...host.querySelectorAll("[data-closure-mode]")];
  const resetBtn = host.querySelector("#closureReset");
  const stripHalfBtn = host.querySelector("#closureHalf");
  const outCovered = host.querySelector("#closureCovered");
  const outGap = host.querySelector("#closureGap");
  const outState = host.querySelector("#closureState");
  const outNote = host.querySelector("#closureNote");

  const active = [true, true, true, true, true, true, true, true];
  let mode = "solid"; // "solid" | "dashed" | "corners"

  function polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
  }

  function arcPath(cx, cy, r, a1, a2) {
    const [x1, y1] = polar(cx, cy, r, a1);
    const [x2, y2] = polar(cx, cy, r, a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  function computeClosure() {
    const onCount = active.filter(Boolean).length;
    const coveredDeg = onCount * 45;
    // 最长连续空段
    let maxOff = 0;
    if (onCount === 0) {
      maxOff = 8;
    } else if (onCount < 8) {
      let cur = 0;
      for (let i = 0; i < 16; i++) {
        if (!active[i % 8]) {
          cur++;
          if (cur > maxOff) maxOff = cur;
        } else {
          cur = 0;
        }
      }
      maxOff = Math.min(8, maxOff);
    }
    const maxGapDeg = maxOff * 45;
    return { onCount, coveredDeg, maxGapDeg };
  }

  function render() {
    const { onCount, coveredDeg, maxGapDeg } = computeClosure();
    const cx = 160;
    const cy = 160;
    const r = 112;

    const pieces = [];
    // 背景幽灵圆：当格式塔闭合仍能接通（缺口 <= 135° 且至少 3 段）时，显示人脑脑补的浅虚圆
    const closes = onCount >= 3 && maxGapDeg <= 135;
    pieces.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${
        closes ? "rgba(43, 116, 208, 0.26)" : "rgba(182, 38, 38, 0.16)"
      }" stroke-width="${closes ? 3 : 1.5}" stroke-dasharray="${closes ? "5 6" : "2 8"}"/>`
    );

    // 中心参考核心
    pieces.push(
      `<circle cx="${cx}" cy="${cy}" r="${closes ? 36 : 26}" fill="${
        closes ? "#E36126" : "#C97D5C"
      }" opacity="${closes ? 1 : 0.65}"/>`
    );
    pieces.push(
      `<text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#FFF8EE" font-size="13" font-weight="700" font-family="Noto Sans SC, sans-serif">${
        closes ? "聚焦" : "散逸"
      }</text>`
    );

    // 8 段可点弧
    for (let i = 0; i < 8; i++) {
      const a1 = i * 45 + 4;
      const a2 = (i + 1) * 45 - 4;
      const isOn = active[i];
      const stroke = isOn
        ? mode === "corners"
          ? "#2B74D0"
          : "#0C1E33"
        : "rgba(12, 30, 51, 0.08)";
      const sw = isOn ? (mode === "corners" ? 13 : 9) : 6;
      const dash =
        isOn && mode === "dashed"
          ? 'stroke-dasharray="4 9" stroke-linecap="round"'
          : isOn && mode === "corners"
            ? 'stroke-dasharray="16 24" stroke-linecap="butt"'
            : 'stroke-linecap="round"';
      pieces.push(
        `<path d="${arcPath(cx, cy, r, a1, a2)}" fill="none" stroke="${stroke}" stroke-width="${sw}" ${dash} data-arc="${i}" style="cursor:pointer"/>`
      );
      // 段号小点
      const [lx, ly] = polar(cx, cy, r + 23, i * 45 + 22.5);
      pieces.push(
        `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" fill="${
          isOn ? "#164DA0" : "#6B7C90"
        }" font-size="10.5" font-weight="700" font-family="Space Mono, monospace">${i + 1}</text>`
      );
    }

    svg.innerHTML = pieces.join("");

    // 同步按钮与文字读数
    segBtns.forEach((btn) => {
      const idx = +btn.dataset.seg;
      btn.setAttribute("aria-pressed", String(active[idx]));
      btn.classList.toggle("is-on", active[idx]);
    });
    modeBtns.forEach((btn) => {
      const on = btn.dataset.closureMode === mode;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("is-active", on);
    });

    outCovered.textContent = `${coveredDeg}° (${onCount}/8 段)`;
    outGap.textContent = `${maxGapDeg}°`;

    if (onCount === 8) {
      outState.textContent = "完整实闭环";
      outState.dataset.tone = "ok";
      outNote.textContent =
        "360° 全段闭合：围合最稳固，视线绝不外泄；但若画得过粗过满，也会略显封闭，可试着点掉 1–2 段腾出呼吸口。";
    } else if (closes) {
      outState.textContent = "格式塔虚圆成立";
      outState.dataset.tone = "ok";
      outNote.textContent = `虽然拿掉了 ${360 - coveredDeg}°，但最大连续缺口仅 ${maxGapDeg}°（≤ 135°）。按韦特海默闭合律，大脑会自动沿曲率补齐蓝虚圆，画面既聚心又透气。`;
    } else if (onCount >= 2 && maxGapDeg === 180) {
      outState.textContent = "临界半弧（摇摆）";
      outState.dataset.tone = "warn";
      outNote.textContent =
        "连续缺口达到 180°，只剩半边弧壳。眼睛开始把它读成开放的「弧形引导」（049 弧形构图）而不是完整的包围圆。";
    } else {
      outState.textContent = "闭合瓦解";
      outState.dataset.tone = "bad";
      outNote.textContent = `最大缺口扩大到 ${maxGapDeg}°，曲率记忆已经接不起来。散落的弧段各自为战，中心失去向心托举。`;
    }
  }

  svg.addEventListener("click", (e) => {
    const p = e.target.closest("[data-arc]");
    if (!p) return;
    const idx = +p.dataset.arc;
    active[idx] = !active[idx];
    render();
  });

  segBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.seg;
      active[idx] = !active[idx];
      render();
    });
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.closureMode;
      render();
    });
  });

  resetBtn.addEventListener("click", () => {
    active.fill(true);
    render();
  });

  stripHalfBtn.addEventListener("click", () => {
    // 典型虚圆：点掉 2 处对角弧段（剩 6 段，缺口 45°），验证不全画也能闭合
    [true, false, true, true, false, true, true, true].forEach((v, i) => (active[i] = v));
    render();
  });

  render();
}

// ============================================================
// 02 实圆、虚圆与借弧：X-Ray 构图骨架剥离幕帘
// ============================================================
export function initXrayCurtain() {
  const host = document.getElementById("xraySection");
  if (!host) return;
  const canvas = host.querySelector("#xrayCanvas");
  const range = host.querySelector("#xrayRange");
  const tabBtns = [...host.querySelectorAll("[data-xray-scene]")];
  const outPct = host.querySelector("#xrayPct");
  const outKind = host.querySelector("#xrayKind");
  const outDesc = host.querySelector("#xrayDesc");

  const SCENES = {
    explicit: {
      kind: "显性实圆 · 园林月洞门",
      desc: "实体圆框像一只天然取景镜头，把门外青竹、远亭与孤鹤稳稳锁在洞口中央；四周粉墙大片留白反而让门内春景格外聚焦。",
    },
    implied: {
      kind: "环绕虚圆 · 群像视线围合",
      desc: "画面里没有画任何圆线，但围坐茶席的四道无五官侧影肩背与朝向自然围成一个隐形圆周，把目光齐齐汇向桌心茶器。",
    },
    partial: {
      kind: "局部借弧 · 大圆出血截角",
      desc: "像 047 原海报右上朱橙弧与左下钴蓝弧那样，只借大圆的一段边界切入画面四角，用极少笔墨制造出宽阔的环抱动势。",
    },
  };

  let scene = "explicit";
  let split = 0.52;
  const ctx = canvas.getContext("2d");

  function drawSceneVisual(w, h) {
    ctx.save();
    if (scene === "explicit") {
      // 粉墙月洞门
      ctx.fillStyle = "#EAE4D7";
      ctx.fillRect(0, 0, w, h);
      // 灰瓦檐顶
      ctx.fillStyle = "#2A3B4D";
      ctx.fillRect(0, 0, w, h * 0.1);
      // 圆洞内景
      const cx = w * 0.5;
      const cy = h * 0.53;
      const r = Math.min(w, h) * 0.35;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      const sky = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      sky.addColorStop(0, "#DCE8F2");
      sky.addColorStop(0.65, "#F2ECE0");
      sky.addColorStop(1, "#C5D4CC");
      ctx.fillStyle = sky;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      // 远山
      ctx.fillStyle = "#88A4B8";
      ctx.beginPath();
      ctx.moveTo(cx - r, cy + r * 0.35);
      ctx.quadraticCurveTo(cx - r * 0.3, cy - r * 0.05, cx + r * 0.25, cy + r * 0.28);
      ctx.quadraticCurveTo(cx + r * 0.65, cy + r * 0.05, cx + r, cy + r * 0.32);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
      ctx.fill();
      // 中心主景：朱红小亭剪影
      ctx.fillStyle = "#D45A23";
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.26, cy + r * 0.08);
      ctx.lineTo(cx, cy - r * 0.14);
      ctx.lineTo(cx + r * 0.26, cy + r * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1E364D";
      ctx.fillRect(cx - r * 0.15, cy + r * 0.08, r * 0.05, r * 0.28);
      ctx.fillRect(cx + r * 0.1, cy + r * 0.08, r * 0.05, r * 0.28);
      // 右弧竹枝剪影
      ctx.strokeStyle = "#1E4D45";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.72, cy + r * 0.9);
      ctx.quadraticCurveTo(cx + r * 0.45, cy - r * 0.15, cx + r * 0.15, cy - r * 0.55);
      ctx.stroke();
      ctx.restore();
      // 青砖门框
      ctx.strokeStyle = "#364A5E";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (scene === "implied") {
      // 围席俯拍：四道无五官肩背侧影 + 中心朱橙茶壶，没有任何实线圆框
      ctx.fillStyle = "#F4EFE5";
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.52;
      const r = Math.min(w, h) * 0.33;
      // 四位围坐无五官肩头俯视剪影（仅头顶与肩弧，严禁五官）
      const seats = [325, 48, 138, 224];
      seats.forEach((deg, idx) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const sx = cx + Math.cos(rad) * r;
        const sy = cy + Math.sin(rad) * r;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rad + Math.PI / 2);
        // 弧形双肩
        ctx.fillStyle = idx % 2 === 0 ? "#1C3550" : "#2D5B94";
        ctx.beginPath();
        ctx.ellipse(0, 8, r * 0.34, r * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头顶纯剪影圆
        ctx.fillStyle = "#0A1B2E";
        ctx.beginPath();
        ctx.arc(0, -4, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // 中央朱橙茶席主角
      ctx.fillStyle = "#E36126";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF7EB";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 局部借弧海报
      ctx.fillStyle = "#081F36";
      ctx.fillRect(0, 0, w, h);
      const unit = Math.min(w, h);
      // 右上巨橙出血弧
      ctx.fillStyle = "#E36126";
      ctx.beginPath();
      ctx.arc(w * 0.94, h * 0.08, unit * 0.44, 0, Math.PI * 2);
      ctx.fill();
      // 左下巨钴蓝出血弧
      ctx.fillStyle = "#2B74D0";
      ctx.beginPath();
      ctx.arc(w * 0.08, h * 0.96, unit * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // 中央呼吸区标题与主体剪影
      ctx.fillStyle = "#E7E2D7";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, unit * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0C1E33";
      ctx.font = `900 ${Math.round(unit * 0.085)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("借弧", w * 0.5, h * 0.5);
    }
    ctx.restore();
  }

  function drawSceneXray(w, h) {
    ctx.save();
    ctx.fillStyle = "#05192F";
    ctx.fillRect(0, 0, w, h);
    // 蓝图极坐标网格
    const cx = w * 0.5;
    const cy = h * 0.52;
    const r = Math.min(w, h) * 0.35;
    ctx.strokeStyle = "rgba(120, 183, 255, 0.14)";
    ctx.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.28 * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * w, cy + Math.sin(rad) * w);
      ctx.stroke();
    }

    if (scene === "explicit") {
      ctx.strokeStyle = "#E96026";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(233, 96, 38, 0.22)";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78B7FF";
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFF7EB";
      ctx.font = `700 11.5px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "right";
      ctx.fillText("实圆框定 · 向心聚焦", w - 14, h - 14);
    } else if (scene === "implied") {
      ctx.strokeStyle = "#78B7FF";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const seats = [325, 48, 138, 224];
      seats.forEach((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const sx = cx + Math.cos(rad) * r;
        const sy = cy + Math.sin(rad) * r;
        // 指向圆心的视线向量
        ctx.strokeStyle = "#E96026";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(cx + Math.cos(rad) * r * 0.42, cy + Math.sin(rad) * r * 0.42);
        ctx.stroke();
        ctx.fillStyle = "#E7E2D7";
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#E36126";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF7EB";
      ctx.font = `700 11.5px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "right";
      ctx.fillText("零实线 · 靠朝向隐形合圆", w - 14, h - 14);
    } else {
      const unit = Math.min(w, h);
      ctx.strokeStyle = "#F0743A";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(w * 0.94, h * 0.08, unit * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#78B7FF";
      ctx.beginPath();
      ctx.arc(w * 0.08, h * 0.96, unit * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // 对角弧势夹持箭
      ctx.strokeStyle = "#44D4A0";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, unit * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#FFF7EB";
      ctx.font = `700 11.5px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "right";
      ctx.fillText("大圆出血借弧 · 对角夹持中心", w - 14, h - 14);
    }
    ctx.restore();
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cutX = Math.round(w * split);
    // 左侧成品图
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cutX, h);
    ctx.clip();
    drawSceneVisual(w, h);
    ctx.restore();

    // 右侧骨架透视图
    ctx.save();
    ctx.beginPath();
    ctx.rect(cutX, 0, w - cutX, h);
    ctx.clip();
    drawSceneXray(w, h);
    ctx.restore();

    // 中央幕帘分隔线与圆柄
    ctx.strokeStyle = "#FFF8EE";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cutX, 0);
    ctx.lineTo(cutX, h);
    ctx.stroke();

    ctx.fillStyle = "#E36126";
    ctx.beginPath();
    ctx.arc(cutX, h / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFF8EE";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#FFF8EE";
    ctx.font = `700 12px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", cutX, h / 2 + 0.5);

    // 左右角标
    ctx.font = `700 11px "Noto Sans SC", sans-serif`;
    if (cutX > 76) {
      ctx.fillStyle = "rgba(8, 25, 46, 0.78)";
      ctx.beginPath();
      ctx.roundRect(12, 12, 62, 22, 11);
      ctx.fill();
      ctx.fillStyle = "#FFF8EE";
      ctx.textAlign = "center";
      ctx.fillText("成品画面", 43, 23.5);
    }
    if (w - cutX > 88) {
      ctx.fillStyle = "rgba(227, 97, 38, 0.9)";
      ctx.beginPath();
      ctx.roundRect(w - 84, 12, 72, 22, 11);
      ctx.fill();
      ctx.fillStyle = "#FFF8EE";
      ctx.textAlign = "center";
      ctx.fillText("圆势骨架", w - 48, 23.5);
    }

    ctx.restore();
  }

  function updateText() {
    const info = SCENES[scene];
    outPct.textContent = `${Math.round(split * 100)}%`;
    outKind.textContent = info.kind;
    outDesc.textContent = info.desc;
    tabBtns.forEach((b) => {
      const on = b.dataset.xrayScene === scene;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
  }

  range.addEventListener("input", () => {
    split = Number(range.value) / 100;
    updateText();
    draw();
  });

  // 画布上也可直接横拖幕帘
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    const rect = canvas.getBoundingClientRect();
    split = Math.min(0.92, Math.max(0.08, (e.clientX - rect.left) / rect.width));
    range.value = String(Math.round(split * 100));
    updateText();
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    split = Math.min(0.92, Math.max(0.08, (e.clientX - rect.left) / rect.width));
    range.value = String(Math.round(split * 100));
    updateText();
    draw();
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  tabBtns.forEach((b) => {
    b.addEventListener("click", () => {
      scene = b.dataset.xrayScene;
      updateText();
      draw();
    });
  });

  window.addEventListener("resize", draw);
  updateText();
  draw();
}

// ============================================================
// 03 四步把散点收成圆：动态建构剧场 + 跳步破坏试验
// ============================================================
export function initBuildTheater() {
  const host = document.getElementById("buildTheater");
  if (!host) return;
  const canvas = host.querySelector("#buildCanvas");
  const stepBtns = [...host.querySelectorAll("[data-build-step]")];
  const sabotageBtn = host.querySelector("#buildSabotage");
  const outTitle = host.querySelector("#buildStepTitle");
  const outBody = host.querySelector("#buildStepBody");
  const outTag = host.querySelector("#buildStepTag");

  const STEPS = [
    {
      step: 1,
      title: "1. 确定中心主体",
      okTag: "锚点确立",
      okBody: "先定下整张画面的唯一视觉核心，把它稳放圆心（或受控主位），其它一切元素都围绕它生发。",
      badTag: "跳过第 1 步 · 无核空转",
      badBody: "如果不先立主核就急着排一圈外围元素，中间像挖了个黑洞，读者转完一圈仍不知道这张图想说什么。",
    },
    {
      step: 2,
      title: "2. 环绕布置元素",
      okTag: "包围成圈",
      okBody: "按大致均衡的角距把次要信息铺在同心圆轨上，使重心守在圆心附近，避免一侧扎堆、另一侧裂出大口。",
      badTag: "跳过第 2 步 · 重心偏坠",
      badBody: "省去环绕平衡步骤、随手把配角堆在右下角，整张画面立刻斜坠失重，圆感荡然无存。",
    },
    {
      step: 3,
      title: "3. 调整节奏与层次",
      okTag: "主次分明",
      okBody: "拉开中心与卫星的尺度反差（经验上半径约 1.8–2.5 倍），并用大小/冷暖交替打破机械等分的呆板感。",
      badTag: "跳过第 3 步 · 均分平权",
      badBody: "若所有圆都画成一般大小、一样抢眼，视觉层级彻底拉平——眼睛在五个圆之间来回打架，毫无轻重缓急。",
    },
    {
      step: 4,
      title: "4. 增强统一与完整",
      okTag: "闭环完成",
      okBody: "最后补上轻盈的外环引导虚弧、方向箭与内圈点阵，把散落的环绕要素串成一口气顺滑流动的完整圆势。",
      badTag: "跳过第 4 步 · 散点断气",
      badBody: "缺少圆弧与色系呼应时，四个要素虽摆成菱形方位，却更容易被读成松散的十字四点，流动感打折。",
    },
  ];

  let curStep = 1;
  let sabotage = false;
  const ctx = canvas.getContext("2d");

  // 平滑插值参数
  const anim = {
    focusR: 0.28,
    focusAlpha: 1,
    satAlpha: 0,
    satSpread: 0,
    rhythm: 0,
    arcAlpha: 0,
  };

  function targets() {
    if (curStep === 1) {
      return {
        focusR: sabotage ? 0.04 : 0.28,
        focusAlpha: sabotage ? 0.15 : 1,
        satAlpha: sabotage ? 0.95 : 0.18,
        satSpread: sabotage ? 1 : 0,
        rhythm: 0,
        arcAlpha: 0,
      };
    }
    if (curStep === 2) {
      return {
        focusR: 0.28,
        focusAlpha: 1,
        satAlpha: 1,
        satSpread: sabotage ? 0.15 : 1,
        rhythm: 0,
        arcAlpha: 0.15,
      };
    }
    if (curStep === 3) {
      return {
        focusR: sabotage ? 0.19 : 0.30,
        focusAlpha: 1,
        satAlpha: 1,
        satSpread: 1,
        rhythm: sabotage ? -1 : 1,
        arcAlpha: 0.35,
      };
    }
    return {
      focusR: 0.30,
      focusAlpha: 1,
      satAlpha: 1,
      satSpread: 1,
      rhythm: 1,
      arcAlpha: sabotage ? 0 : 1,
    };
  }

  function render(t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width));
    const h = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const tg = targets();
    const k = still ? 1 : Math.min(1, (dt || 0.016) * 8);
    for (const key of Object.keys(anim)) {
      anim[key] += (tg[key] - anim[key]) * k;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#081E35";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const unit = Math.min(w, h) * 0.42;
    const orbit = unit * 0.72;

    // 淡参考同心圆
    ctx.strokeStyle = "rgba(182, 206, 232, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, orbit * 1.15, 0, Math.PI * 2);
    ctx.stroke();

    // 第 4 步统一圆弧与点阵
    if (anim.arcAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = anim.arcAlpha;
      ctx.strokeStyle = "#E36126";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      if (!still) ctx.lineDashOffset = -t * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, orbit * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 内点阵环
      ctx.fillStyle = "#2E78D6";
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * orbit * 0.68, cy + Math.sin(a) * orbit * 0.68, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 中心圆
    ctx.save();
    ctx.globalAlpha = anim.focusAlpha;
    ctx.fillStyle = sabotage && curStep === 1 ? "#FF6B6B" : "#E36126";
    ctx.beginPath();
    ctx.arc(cx, cy, unit * anim.focusR, 0, Math.PI * 2);
    ctx.fill();
    if (anim.focusR > 0.14) {
      ctx.fillStyle = "#FFF8EE";
      ctx.font = `900 ${Math.max(12, Math.round(unit * anim.focusR * 0.45))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("主核", cx, cy);
    }
    ctx.restore();

    // 4 枚环绕卫星（从堆挤右下角平滑散开到四极，再拉开节奏层级）
    const clumpedAngles = [95, 122, 150, 175];
    const balancedAngles = [0, 90, 180, 270];
    const satColors = ["#E7E2D7", "#2B74D0", "#E7E2D7", "#2B74D0"];
    const satTexts = ["起势", "导流", "收口", "呼应"];

    for (let i = 0; i < 4; i++) {
      const deg = clumpedAngles[i] + (balancedAngles[i] - clumpedAngles[i]) * anim.satSpread;
      const rad = ((deg - 90) * Math.PI) / 180;
      const sx = cx + Math.cos(rad) * orbit;
      const sy = cy + Math.sin(rad) * orbit;
      let r = unit * 0.135;
      if (anim.rhythm > 0) {
        r = unit * (i % 2 === 0 ? 0.145 : 0.105);
      } else if (anim.rhythm < 0) {
        // 跳步破坏：平权同大，与中心一般粗暴抢焦
        r = unit * 0.185;
      }

      ctx.save();
      if (anim.satAlpha < 0.32) {
        // 第 1 步仅画干净虚线占位圈，不让淡字糊在深蓝底上
        ctx.strokeStyle = "rgba(182, 206, 232, 0.28)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        continue;
      }
      ctx.globalAlpha = anim.satAlpha;
      ctx.fillStyle = satColors[i];
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      if (sabotage && (curStep === 2 || curStep === 3)) {
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = i % 2 === 0 ? "#0C1E33" : "#F5F9FF";
      ctx.font = `700 ${Math.max(10, Math.round(r * 0.48))}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(satTexts[i], sx, sy);
      ctx.restore();
    }

    // 跳步警示水印
    if (sabotage) {
      ctx.fillStyle = "#FF8B8B";
      ctx.font = `700 12px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`× 跳步破坏演示：略过第 ${curStep} 步`, 16, 22);
    } else {
      ctx.fillStyle = "#44D4A0";
      ctx.font = `700 12px "Space Mono", "Noto Sans SC", monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`STEP 0${curStep} / 04 · 顺步推进`, 16, 22);
    }

    ctx.restore();
  }

  function syncUI() {
    const meta = STEPS[curStep - 1];
    outTitle.textContent = meta.title;
    outBody.textContent = sabotage ? meta.badBody : meta.okBody;
    outTag.textContent = sabotage ? meta.badTag : meta.okTag;
    outTag.dataset.tone = sabotage ? "bad" : "ok";
    sabotageBtn.setAttribute("aria-pressed", String(sabotage));
    sabotageBtn.classList.toggle("is-danger", sabotage);
    sabotageBtn.textContent = sabotage ? "恢复这一步（看正常效果）" : `故意跳过第 ${curStep} 步看看会怎样`;
    stepBtns.forEach((b) => {
      const on = +b.dataset.buildStep === curStep;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    ctrl.draw();
  }

  stepBtns.forEach((b) => {
    b.addEventListener("click", () => {
      curStep = +b.dataset.buildStep;
      sabotage = false;
      syncUI();
    });
  });

  sabotageBtn.addEventListener("click", () => {
    sabotage = !sabotage;
    syncUI();
  });

  const ctrl = loop(canvas, render);
  syncUI();
  render(0, 0, { still: reducedMotion.matches });
}

// ============================================================
// 04 东西方历史圆构图骨架对照切换器（纯矢量结构解剖，无五官）
// ============================================================
export function initHistoryDeck() {
  const host = document.getElementById("historyDeck");
  if (!host) return;
  const tabs = [...host.querySelectorAll("[data-hist]")];
  const overlayToggle = host.querySelector("#histOverlayToggle");
  const svg = host.querySelector("#histSvg");
  const outTitle = host.querySelector("#histTitle");
  const outMeta = host.querySelector("#histMeta");
  const outNote = host.querySelector("#histNote");

  const ITEMS = {
    tuanshan: {
      title: "南宋团扇 · 马远《月下赏梅图》",
      meta: "13 世纪初 · 绢本设色团扇页 · 25.1 × 26.7 cm · 大都会艺术博物馆（1986.493.2）",
      note: "南宋院画团扇从不把主角死钉在正圆心。马远把山石、老梅与亭阁收在左下弧缘，以一道遒劲梅枝顺圆周扫向右上，左上大片月色空雾与之构成阴阳虚实配平。",
      art: `
        <circle cx="160" cy="160" r="132" fill="#E8DFCD" stroke="#9B8C72" stroke-width="2.5"/>
        <path d="M 48 228 Q 92 178 135 196 Q 178 212 212 272 A 132 132 0 0 1 48 228 Z" fill="#3B4954"/>
        <path d="M 78 214 Q 145 142 252 108" fill="none" stroke="#1E2933" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M 162 152 Q 204 156 238 140" fill="none" stroke="#1E2933" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="212" cy="84" r="15" fill="#F8F3E6" stroke="#C9BFA9" stroke-width="1.2"/>
        <path d="M 96 205 L 122 186 L 146 205 Z" fill="#AD3E0D"/>
      `,
      overlay: `
        <path d="M 65 235 A 120 120 0 0 1 255 104" fill="none" stroke="#E36126" stroke-width="2.4" stroke-dasharray="6 5"/>
        <line x1="115" y1="204" x2="212" y2="84" stroke="#164DA0" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="212" cy="84" r="22" fill="none" stroke="#164DA0" stroke-width="1.8"/>
        <text x="160" y="308" text-anchor="middle" fill="#AD3E0D" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">实景沿左下弧聚拢 · 虚白与孤月右上配平</text>
      `,
    },
    magnificat: {
      title: "佛罗伦萨圆画 · 波提切利《圣母颂》",
      meta: "约 1481 年 · 木板蛋彩圆画（Tondo）· 直径 118 cm · 佛罗伦萨乌菲兹美术馆",
      note: "文艺复兴圆画脱胎于佛罗伦萨庆生木盘（desco da parto）。波提切利让左右侍立天使的背脊、手臂与王冠主动顺着 118 厘米圆形画框弯折，构成极具韵律的拱顶包围。",
      art: `
        <circle cx="160" cy="160" r="132" fill="#DDE4EA" stroke="#8C6D46" stroke-width="6"/>
        <path d="M 70 250 Q 62 140 135 88 Q 108 158 118 258 Z" fill="#295285"/>
        <path d="M 250 250 Q 258 140 185 88 Q 212 158 202 258 Z" fill="#3C6B9E"/>
        <path d="M 118 260 Q 134 148 164 114 Q 198 146 202 260 Z" fill="#B84B20"/>
        <circle cx="164" cy="108" r="18" fill="#1C2E42"/>
        <circle cx="106" cy="130" r="14" fill="#1C2E42"/>
        <circle cx="218" cy="130" r="14" fill="#1C2E42"/>
        <ellipse cx="164" cy="70" rx="28" ry="10" fill="none" stroke="#C59130" stroke-width="4"/>
      `,
      overlay: `
        <path d="M 62 215 A 112 112 0 0 1 258 215" fill="none" stroke="#E36126" stroke-width="2.6" stroke-dasharray="6 5"/>
        <circle cx="160" cy="172" r="56" fill="none" stroke="#164DA0" stroke-width="2"/>
        <text x="160" y="308" text-anchor="middle" fill="#AD3E0D" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">左右身姿顺圆缘拱起 · 视线收束于中下书页</text>
      `,
    },
    doni: {
      title: "盛期圆画 · 米开朗基罗《东尼圆画》",
      meta: "1505–1506 年 · 木板油画蛋彩 · 直径 120 cm · 佛罗伦萨乌菲兹美术馆",
      note: "米开朗基罗没有让人物温顺贴边，反而用一道笔直的水平石墙横切圆面中腰，再把前景圣家族拧成向上的螺旋雕塑块，在圆的完整里注入强烈立体张力。",
      art: `
        <circle cx="160" cy="160" r="132" fill="#E4DFD2" stroke="#8C6D46" stroke-width="6"/>
        <rect x="36" y="138" width="248" height="14" fill="#8C99A6"/>
        <path d="M 96 266 Q 112 178 160 112 Q 204 168 224 266 Z" fill="#D45A23"/>
        <path d="M 118 258 Q 148 184 186 144 Q 206 196 196 258 Z" fill="#2A65B2"/>
        <circle cx="162" cy="108" r="16" fill="#172A3E"/>
        <circle cx="146" cy="144" r="15" fill="#172A3E"/>
      `,
      overlay: `
        <line x1="40" y1="145" x2="280" y2="145" stroke="#164DA0" stroke-width="2.2" stroke-dasharray="5 4"/>
        <path d="M 105 246 C 110 184 196 184 162 108" fill="none" stroke="#E36126" stroke-width="2.8"/>
        <polygon points="160,94 102,258 218,258" fill="none" stroke="#AD3E0D" stroke-width="1.6" stroke-dasharray="4 4"/>
        <text x="160" y="308" text-anchor="middle" fill="#AD3E0D" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">水平横墙定锚 · 中央螺旋体量撑起 120cm 圆幅</text>
      `,
    },
    alba: {
      title: "古典圆画 · 拉斐尔《阿尔巴圣母》",
      meta: "约 1510 年 · 直径 94.5 cm · 美国国家美术馆（华盛顿）",
      note: "拉斐尔在 94.5 厘米圆画里藏进一座稳固的三角群像：外侧衣袍下摆贴合底弧展开，左侧手臂与远景地平线平衡重量，证明圆形和三角骨架可以水乳交融。",
      art: `
        <circle cx="160" cy="160" r="132" fill="#DCE6EE" stroke="#8C6D46" stroke-width="6"/>
        <path d="M 38 198 Q 160 184 282 204 L 270 250 A 132 132 0 0 1 50 250 Z" fill="#8EA894"/>
        <path d="M 78 258 Q 120 128 166 106 Q 222 142 246 254 A 132 132 0 0 1 78 258 Z" fill="#2A65B2"/>
        <path d="M 118 258 Q 148 156 174 132 Q 204 176 208 256 Z" fill="#D45A23"/>
        <circle cx="168" cy="108" r="16" fill="#172A3E"/>
        <circle cx="122" cy="176" r="13" fill="#172A3E"/>
      `,
      overlay: `
        <polygon points="168,94 84,250 242,250" fill="none" stroke="#164DA0" stroke-width="2.2" stroke-dasharray="5 4"/>
        <path d="M 72 242 A 118 118 0 0 0 248 242" fill="none" stroke="#E36126" stroke-width="2.8"/>
        <circle cx="160" cy="160" r="118" fill="none" stroke="rgba(227, 97, 38, 0.45)" stroke-width="1.4" stroke-dasharray="4 6"/>
        <text x="160" y="308" text-anchor="middle" fill="#AD3E0D" font-size="11" font-weight="700" font-family="Noto Sans SC, sans-serif">圆框内置稳固三角 · 下摆衣褶顺底弧自然收拢</text>
      `,
    },
  };

  let cur = "tuanshan";
  let showOverlay = true;

  function render() {
    const it = ITEMS[cur];
    svg.innerHTML = `${it.art}${showOverlay ? it.overlay : ""}`;
    outTitle.textContent = it.title;
    outMeta.textContent = it.meta;
    outNote.textContent = it.note;
    tabs.forEach((b) => {
      const on = b.dataset.hist === cur;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    overlayToggle.setAttribute("aria-pressed", String(showOverlay));
    overlayToggle.textContent = showOverlay ? "隐藏构图骨架线" : "显示构图骨架线";
  }

  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      cur = b.dataset.hist;
      render();
    })
  );
  overlayToggle.addEventListener("click", () => {
    showOverlay = !showOverlay;
    render();
  });
  render();
}

// ============================================================
// 05 何时别用：画幅死角率实时压测器
// ============================================================
export function initAspectStress() {
  const host = document.getElementById("aspectStress");
  if (!host) return;
  const btns = [...host.querySelectorAll("[data-frame-ratio]")];
  const cropToggle = host.querySelector("#aspectCropToggle");
  const svg = host.querySelector("#aspectSvg");
  const outDead = host.querySelector("#aspectDead");
  const outCircle = host.querySelector("#aspectCircle");
  const outVerdict = host.querySelector("#aspectVerdict");
  const outAdvice = host.querySelector("#aspectAdvice");

  const FRAMES = {
    "1:1": { w: 1, h: 1, name: "1:1 正方徽章 / 封面" },
    "3:4": { w: 3, h: 4, name: "3:4 竖版教学海报" },
    "16:9": { w: 16, h: 9, name: "16:9 演示横屏" },
    "3:1": { w: 3, h: 1, name: "3:1 网页横幅 Banner" },
    "9:16": { w: 9, h: 16, name: "9:16 竖屏信息流" },
  };

  let key = "3:1";
  let cropMode = false; // false = 硬塞完整圆；true = 裁切借弧

  function render() {
    const f = FRAMES[key];
    const boxW = 360;
    const boxH = 220;
    const pad = 20;
    const scale = Math.min((boxW - pad * 2) / f.w, (boxH - pad * 2) / f.h);
    const rw = f.w * scale;
    const rh = f.h * scale;
    const rx = (boxW - rw) / 2;
    const ry = (boxH - rh) / 2;

    const minSide = Math.min(rw, rh);
    const r = cropMode ? Math.max(rw, rh) * 0.42 : minSide * 0.46;
    const frameArea = rw * rh;

    // 数值积分估算圆在矩形框内的实际可见面积（保证裁切模式也绝对准确）
    let inside = 0;
    const steps = 40;
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    for (let ix = 0; ix < steps; ix++) {
      for (let iy = 0; iy < steps; iy++) {
        const px = rx + ((ix + 0.5) / steps) * rw;
        const py = ry + ((iy + 0.5) / steps) * rh;
        if (Math.hypot(px - cx, py - cy) <= r) inside++;
      }
    }
    const circleRatio = inside / (steps * steps);
    const circlePct = Math.round(circleRatio * 100);
    const deadPct = Math.max(0, 100 - circlePct);
    const totalCircleArea = Math.PI * r * r;
    const clippedPct = Math.max(0, Math.round((1 - (circleRatio * frameArea) / totalCircleArea) * 100));

    const clipId = "aspectClipRect";
    svg.innerHTML = `
      <defs>
        <clipPath id="${clipId}">
          <rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" rx="3"/>
        </clipPath>
      </defs>
      <rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="${
        deadPct > 55 && !cropMode ? "rgba(182, 38, 38, 0.12)" : "#E7E2D7"
      }" stroke="#0C1E33" stroke-width="2" rx="3"/>
      <g clip-path="url(#${clipId})">
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(43, 116, 208, 0.16)" stroke="#2B74D0" stroke-width="2" stroke-dasharray="6 4"/>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.44).toFixed(1)}" fill="#E36126"/>
      </g>
      ${
        cropMode && clippedPct > 5
          ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#B62626" stroke-width="1.4" stroke-dasharray="4 4"/>`
          : ""
      }
      <text x="${(rx + 8).toFixed(1)}" y="${(ry + 16).toFixed(1)}" fill="#0C1E33" font-size="11" font-weight="700" font-family="Space Mono, monospace">${key}</text>
    `;

    outCircle.textContent = cropMode ? `${circlePct}%（被裁 ${clippedPct}%）` : `${circlePct}%`;
    outDead.textContent = `${deadPct}%`;

    if (!cropMode && deadPct <= 36) {
      outVerdict.textContent = "极佳适配";
      outVerdict.dataset.tone = "ok";
      outAdvice.textContent = `${f.name} 与正圆天作之合：四隅剩余空间刚好充当呼吸留白或角标落款区（如 047 原海报）。`;
    } else if (!cropMode && deadPct <= 55) {
      outVerdict.textContent = "勉强可行 · 需补边栏";
      outVerdict.dataset.tone = "warn";
      outAdvice.textContent = `圆外空余已达 ${deadPct}%，在 ${f.name} 中不能只把圆孤零零扔在正中，需配合标题文字块或辅助列吃掉两侧空档。`;
    } else if (!cropMode) {
      outVerdict.textContent = "严重浪费画幅 · 别硬用整圆";
      outVerdict.dataset.tone = "bad";
      outAdvice.textContent = `在 ${f.name} 里硬塞完整正圆，高达 ${deadPct}% 的画面沦为死角。要么改用矩形/横向流构图，要么点击「撑大裁切借弧」只留一段大圆弧。`;
    } else if (clippedPct > 35) {
      outVerdict.textContent = `已切掉 ${clippedPct}% 圆弧（转为借弧）`;
      outVerdict.dataset.tone = "warn";
      outAdvice.textContent = `把圆撑大后死角降到 ${deadPct}%，但完整闭合圆已被画框切碎成两段对向弧——此时视觉逻辑已转为 049 弧形构图。`;
    } else {
      outVerdict.textContent = "轻微出血 · 气势增强";
      outVerdict.dataset.tone = "ok";
      outAdvice.textContent = `仅切去 ${clippedPct}% 边缘，死角缩至 ${deadPct}%，既保住核心聚焦又比缩在框内更有张力。`;
    }

    btns.forEach((b) => {
      const on = b.dataset.frameRatio === key;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    cropToggle.setAttribute("aria-pressed", String(cropMode));
    cropToggle.classList.toggle("is-active", cropMode);
    cropToggle.textContent = cropMode ? "当前：撑大裁切借弧" : "切换：撑大裁切借弧";
  }

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      key = b.dataset.frameRatio;
      render();
    })
  );
  cropToggle.addEventListener("click", () => {
    cropMode = !cropMode;
    render();
  });
  render();
}

// ============================================================
// 06 挑一张成立的圆构图：两道单变量目测练习（仅标 A/B/C/D）
// ============================================================
export function initQuiz() {
  const host = document.getElementById("quizSection");
  if (!host) return;
  const promptEl = host.querySelector("#quizPrompt");
  const roundBadge = host.querySelector("#quizRound");
  const grid = host.querySelector("#quizGrid");
  const feedback = host.querySelector("#quizFeedback");
  const nextBtn = host.querySelector("#quizNext");

  function circleCardSvg({ fx, fy, fr, sats, arc = true, frameOnly = false }) {
    const cx = 100;
    const cy = 100;
    const orbit = 64;
    const out = [
      `<rect width="200" height="200" rx="8" fill="#0A213A"/>`,
      `<circle cx="${cx}" cy="${cy}" r="76" fill="none" stroke="rgba(182,206,232,0.12)" stroke-width="1"/>`,
    ];
    if (arc) {
      out.push(
        `<circle cx="${cx}" cy="${cy}" r="${orbit + 8}" fill="none" stroke="#E36126" stroke-width="1.8" stroke-dasharray="6 5"/>`
      );
    }
    if (frameOnly) {
      // 假圆壳：外面画个死板圆圈，里面却塞了散乱无中心的直角方块
      out.push(`<circle cx="${cx}" cy="${cy}" r="76" fill="none" stroke="#E36126" stroke-width="3"/>`);
      out.push(`<rect x="52" y="58" width="46" height="24" fill="#2B74D0"/>`);
      out.push(`<rect x="108" y="64" width="38" height="36" fill="#E7E2D7"/>`);
      out.push(`<rect x="58" y="96" width="58" height="26" fill="#E7E2D7"/>`);
      out.push(`<rect x="116" y="114" width="32" height="28" fill="#2B74D0"/>`);
      return out.join("");
    }
    out.push(`<circle cx="${cx}" cy="${cy}" r="${orbit}" fill="none" stroke="rgba(231,226,215,0.28)" stroke-width="1"/>`);
    out.push(`<circle cx="${cx + fx}" cy="${cy + fy}" r="${fr}" fill="#E36126"/>`);
    sats.forEach((s, idx) => {
      const rad = ((s.deg - 90) * Math.PI) / 180;
      const sx = cx + Math.cos(rad) * orbit;
      const sy = cy + Math.sin(rad) * orbit;
      out.push(
        `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${s.r}" fill="${
          idx % 2 === 0 ? "#E7E2D7" : "#2B74D0"
        }"/>`
      );
    });
    return out.join("");
  }

  const ROUNDS = [
    {
      badge: "第 1 / 2 题 · 四项原则综合辨析",
      prompt:
        "同一张节气茶会海报：1 枚朱橙主核 + 4 枚环绕标签，四版配色与元素数量完全相同，各只差一个构图变量。哪一版同时守住了向心、完整、包围与流动？",
      answer: "C",
      options: [
        {
          id: "A",
          svg: circleCardSvg({
            fx: 0,
            fy: 0,
            fr: 24,
            sats: [
              { deg: 0, r: 21 },
              { deg: 90, r: 21 },
              { deg: 180, r: 21 },
              { deg: 270, r: 21 },
            ],
          }),
          why: "A 错在「主次失衡」：四枚外围标签放大到半径 21，几乎与中心焦点（24）等大，配角喧宾夺主，视线在五个圆之间来回拉扯。",
        },
        {
          id: "B",
          svg: circleCardSvg({
            fx: 0,
            fy: 0,
            fr: 29,
            sats: [
              { deg: 345, r: 12 },
              { deg: 28, r: 10 },
              { deg: 70, r: 12 },
              { deg: 112, r: 10 },
            ],
          }),
          why: "B 错在「包围断裂」：核心大小和位置都对，但四枚标签挤在右上 127° 扇区，左下裂出 233° 巨大缺口，重心明显右倾。",
        },
        {
          id: "C",
          svg: circleCardSvg({
            fx: 0,
            fy: 0,
            fr: 30,
            sats: [
              { deg: 352, r: 13 },
              { deg: 96, r: 9 },
              { deg: 194, r: 13 },
              { deg: 282, r: 9 },
            ],
          }),
          why: "C 正确：朱橙主核稳居圆心且半径约为配角的 2.3 倍，四枚标签大小错落、最大角距 108°、重心近圆心，外圈虚弧顺畅收束视线。",
        },
        {
          id: "D",
          svg: circleCardSvg({
            fx: -20,
            fy: 15,
            fr: 28,
            sats: [
              { deg: 0, r: 12 },
              { deg: 90, r: 10 },
              { deg: 180, r: 12 },
              { deg: 270, r: 10 },
            ],
          }),
          why: "D 错在「向心失位」：外围四极很匀称，但中心主核被推到左下边缘，几乎撞上左下卫星，失去了向心锚定与呼吸缝。",
        },
      ],
    },
    {
      badge: "第 2 / 2 题 · 真圆形构图 vs. 假圆壳",
      prompt:
        "四版都带圆形元素，哪一版靠真实的「向心 + 节奏包围」成立，而不是生硬画个圆框或让元素互相抢戏？",
      answer: "B",
      options: [
        {
          id: "A",
          svg: circleCardSvg({ frameOnly: true, arc: false, fx: 0, fy: 0, fr: 0, sats: [] }),
          why: "A 错在「假圆壳」：外头套了一个生硬圆框，里面却摆满零散无中心的直角色块，形圆而神散。",
        },
        {
          id: "B",
          svg: circleCardSvg({
            fx: 2,
            fy: -2,
            fr: 28,
            arc: false,
            sats: [
              { deg: 25, r: 13 },
              { deg: 118, r: 9.5 },
              { deg: 212, r: 13 },
              { deg: 300, r: 9.5 },
            ],
          }),
          why: "B 正确：即便没有画外圈虚线，四枚配角凭匀称角距与大小韵律自然围出隐形虚圆，把重心稳稳聚在核心上。",
        },
        {
          id: "C",
          svg: circleCardSvg({
            fx: 0,
            fy: 0,
            fr: 47,
            sats: [
              { deg: 0, r: 13 },
              { deg: 90, r: 13 },
              { deg: 180, r: 13 },
              { deg: 270, r: 13 },
            ],
          }),
          why: "C 错在「核心撑爆」：中心圆胀得太满，几乎直接顶住四枚卫星，没有留出缓冲呼吸带，整幅构图显得闷堵。",
        },
        {
          id: "D",
          svg: circleCardSvg({
            fx: 0,
            fy: 0,
            fr: 27,
            arc: false,
            sats: [
              { deg: 0, r: 4.5 },
              { deg: 90, r: 4.5 },
              { deg: 180, r: 4.5 },
              { deg: 270, r: 4.5 },
            ],
          }),
          why: "D 错在「包围过弱」：四枚外围元素缩得过细且缺少弧线连接，视觉上几乎消失，退化成了孤单的单圆居中。",
        },
      ],
    },
  ];

  let roundIdx = 0;
  let picked = null;

  function render() {
    const r = ROUNDS[roundIdx];
    roundBadge.textContent = r.badge;
    promptEl.textContent = r.prompt;
    grid.innerHTML = r.options
      .map((opt) => {
        const isPicked = picked === opt.id;
        const isAns = opt.id === r.answer;
        let cls = "quiz-card";
        if (picked) {
          if (isAns) cls += " is-correct";
          else if (isPicked) cls += " is-wrong";
        }
        return `
          <button type="button" class="${cls}" data-quiz-opt="${opt.id}" aria-pressed="${isPicked}">
            <span class="quiz-letter">${opt.id}</span>
            <svg viewBox="0 0 200 200" aria-hidden="true">${opt.svg}</svg>
          </button>
        `;
      })
      .join("");

    if (!picked) {
      feedback.innerHTML = `<p class="quiz-wait">直接点选上方 A / B / C / D 任意一张，系统会按几何变量拆解对错依据。</p>`;
    } else {
      const chosen = r.options.find((o) => o.id === picked);
      const right = r.options.find((o) => o.id === r.answer);
      const ok = picked === r.answer;
      feedback.innerHTML = `
        <div class="quiz-result ${ok ? "is-ok" : "is-bad"}">
          <strong>${ok ? `判断准确：选 ${picked}` : `差一点：你选了 ${picked}，成立的是 ${r.answer}`}</strong>
          <p>${chosen.why}</p>
          ${ok ? "" : `<p class="quiz-ans-note">${right.why}</p>`}
          <details class="quiz-all-why">
            <summary>展开查看全部四版单变量拆解</summary>
            <ul>${r.options.map((o) => `<li><strong>${o.id}：</strong>${o.why}</li>`).join("")}</ul>
          </details>
        </div>
      `;
    }

    nextBtn.textContent = roundIdx === 0 ? "换第 2 题（真虚圆 vs. 假圆壳）" : "回到第 1 题重测";
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quiz-opt]");
    if (!btn) return;
    picked = btn.dataset.quizOpt;
    render();
  });

  nextBtn.addEventListener("click", () => {
    roundIdx = (roundIdx + 1) % ROUNDS.length;
    picked = null;
    render();
  });

  render();
}

// ============================================================
// 07 原海报缩放拖拽灯箱（可点开放大、鼠标/触屏拖动、Esc 关）
// ============================================================
export function initPosterLightbox() {
  const posterImg = document.getElementById("poster");
  const openBtn = document.getElementById("posterOpenBtn");
  const dialog = document.getElementById("posterDialog");
  if (!posterImg || !dialog) return;

  const stage = dialog.querySelector("#lightboxStage");
  const zoomImg = dialog.querySelector("#lightboxImg");
  const btnIn = dialog.querySelector("#lbZoomIn");
  const btnOut = dialog.querySelector("#lbZoomOut");
  const btnReset = dialog.querySelector("#lbZoomReset");
  const btnClose = dialog.querySelector("#lbClose");
  const outScale = dialog.querySelector("#lbScale");

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let sx = 0;
  let sy = 0;
  let stx = 0;
  let sty = 0;

  function apply() {
    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    outScale.textContent = `${Math.round(scale * 100)}%`;
  }

  function openBox() {
    if (!zoomImg.src || zoomImg.src !== posterImg.src) {
      zoomImg.src = posterImg.src;
    }
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
    if (!dialog.open) dialog.showModal();
  }

  posterImg.addEventListener("click", openBox);
  if (openBtn) openBtn.addEventListener("click", openBox);
  btnClose.addEventListener("click", () => dialog.close());
  btnIn.addEventListener("click", () => {
    scale = Math.min(3.2, +(scale + 0.35).toFixed(2));
    apply();
  });
  btnOut.addEventListener("click", () => {
    scale = Math.max(0.75, +(scale - 0.35).toFixed(2));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    }
    apply();
  });
  btnReset.addEventListener("click", () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    stx = tx;
    sty = ty;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = stx + (e.clientX - sx);
    ty = sty + (e.clientY - sy);
    apply();
  });
  stage.addEventListener("pointerup", () => {
    dragging = false;
  });
  stage.addEventListener("pointercancel", () => {
    dragging = false;
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
    }
  });
}
