// 138 满出血 版式 · 正文 6 大差异化互动模块
// 01 拉帘面积对比 | 02 10× 印前显微放大镜 | 03 跨媒介裁切矩阵 | 04 历史四纪元步进 | 05 六委托案印前判章 | 06 单变量落刀测验 | 07 海报灯箱
import { loop, pixelRatio } from "../../lib/stage.js";
import { clamp } from "./model.js";

// =========================================================================
// 01 节：双面拉帘画布（同纸幅下「无出血留白框 139」vs「满出血破边 138」实测对比）
// =========================================================================
export function mountCompareCurtain(root) {
  const canvas = root.querySelector("#s1-canvas");
  const slider = root.querySelector("#s1-split");
  const readout = root.querySelector("#s1-readout");
  const areaVal = root.querySelector("#s1-area-val");
  const sceneBtns = [...root.querySelectorAll("[data-s1-scene]")];
  const stopBtns = [...root.querySelectorAll("[data-s1-stop]")];
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const state = { split: 0.52, scene: "poster" };
  let dragging = false;

  const SCENES = {
    poster: { name: "红黑构成海报", bg: "#F72F02", sub: "#070707", bar: "#F5F3EE", label: "满出血" },
    arch: { name: "建筑仰拍画册", bg: "#1B2834", sub: "#E8E1D3", bar: "#F72F02", label: "巨构空间" },
    editorial: { name: "时尚期刊扉页", bg: "#0E0E10", sub: "#F72F02", bar: "#F5F3EE", label: "视觉现场" },
  };

  function drawScene(c, x, y, w, h, sceneKey, isBleed) {
    const sc = SCENES[sceneKey];
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();

    // 真实白纸底
    c.fillStyle = "#FFFFFF";
    c.fillRect(x, y, w, h);

    // 无出血版式四周留 22mm 等效白边（约 12.5% 宽 / 10% 高）；满出血铺满 100%
    const mX = isBleed ? 0 : w * 0.125;
    const mY = isBleed ? 0 : h * 0.115;
    const ix = x + mX, iy = y + mY, iw = w - mX * 2, ih = h - mY * 2;

    c.save();
    c.beginPath();
    c.rect(ix, iy, iw, ih);
    c.clip();

    c.fillStyle = sc.bg;
    c.fillRect(ix, iy, iw, ih);

    if (sceneKey === "poster") {
      // 顶白楔
      c.fillStyle = sc.bar;
      c.beginPath();
      c.moveTo(ix + iw * 0.45, iy);
      c.lineTo(ix + iw * 0.72, iy);
      c.lineTo(ix + iw * 0.58, iy + ih * 0.24);
      c.closePath();
      c.fill();
      // 右侧破边黑圆
      c.fillStyle = sc.sub;
      c.beginPath();
      c.arc(ix + iw * (isBleed ? 0.94 : 0.76), iy + ih * 0.52, Math.min(iw, ih) * (isBleed ? 0.44 : 0.30), 0, Math.PI * 2);
      c.fill();
      // 斜切白杠
      c.strokeStyle = sc.bar;
      c.lineWidth = Math.max(3, iw * 0.022);
      c.beginPath();
      c.moveTo(ix + iw * 0.44, iy + ih);
      c.lineTo(ix + iw * 0.96, iy + ih * 0.06);
      c.stroke();
    } else if (sceneKey === "arch") {
      // 粗野主义混凝土仰角
      c.fillStyle = "#2E3F4F";
      c.fillRect(ix, iy + ih * 0.55, iw, ih * 0.45);
      c.fillStyle = sc.sub;
      c.beginPath();
      c.moveTo(ix + iw * 0.46, iy + ih * 0.06);
      c.lineTo(ix + iw * (isBleed ? 1.05 : 0.92), iy - ih * 0.06);
      c.lineTo(ix + iw * (isBleed ? 1.05 : 0.92), iy + ih);
      c.lineTo(ix + iw * 0.46, iy + ih);
      c.closePath();
      c.fill();
      c.fillStyle = sc.bar;
      c.fillRect(ix, iy + ih * 0.80, iw, ih * 0.06);
    } else {
      // 时尚期刊扉页：巨型朱红圆弧与剪影人物背影（无五官）
      c.fillStyle = sc.sub;
      c.beginPath();
      c.arc(ix + iw * 0.74, iy + ih * 0.48, Math.min(iw, ih) * (isBleed ? 0.45 : 0.32), 0, Math.PI * 2);
      c.fill();
      // 极简剪影背影（无眼口鼻五官）
      c.fillStyle = "#0E0E10";
      const px = ix + iw * 0.68, py = iy + ih * 0.56, ps = Math.min(iw, ih) * 0.14;
      c.beginPath(); c.arc(px, py - ps * 1.15, ps * 0.42, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(px - ps * 0.85, iy + ih);
      c.quadraticCurveTo(px - ps * 0.75, py - ps * 0.45, px, py - ps * 0.55);
      c.quadraticCurveTo(px + ps * 0.75, py - ps * 0.45, px + ps * 0.85, iy + ih);
      c.closePath();
      c.fill();
    }

    // 左侧标题（安全内缩）
    c.fillStyle = sceneKey === "poster" ? "#070707" : "#F5F3EE";
    c.font = `900 ${Math.max(16, Math.round(Math.min(iw, ih) * 0.12))}px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText(sc.label, ix + iw * 0.08, iy + ih * 0.14);
    c.font = `700 ${Math.max(10, Math.round(Math.min(iw, ih) * 0.048))}px "Archivo", sans-serif`;
    c.fillText(isBleed ? "EDGE-TO-EDGE 100%" : "FRAMED 58%", ix + iw * 0.08, iy + ih * 0.30);

    c.restore();

    // 若为无出血，画细淡外框与底部边距标（避开左上角标签，绝不叠字）
    if (!isBleed) {
      c.strokeStyle = "rgba(17,17,17,0.22)";
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.fillStyle = "#524E48";
      c.font = `700 10px "Space Mono", monospace`;
      c.textAlign = "left";
      c.textBaseline = "bottom";
      c.fillText("MARGIN 22mm", x + 10, y + h - 8);
    }
    c.restore();
  }

  function render() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(200, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // 底层满出血右侧 + 裁剪左侧无出血（或左满出血、右无出血）
    const sx = Math.round(w * state.split);
    // 左半：无出血框（139）
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, sx, h); ctx.clip();
    drawScene(ctx, 0, 0, w, h, state.scene, false);
    ctx.restore();

    // 右半：满出血（138）
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, 0, w - sx, h); ctx.clip();
    drawScene(ctx, 0, 0, w, h, state.scene, true);
    ctx.restore();

    // 拉帘分界钢尺
    ctx.fillStyle = "#070707";
    ctx.fillRect(sx - 1.5, 0, 3, h);
    // 中央抓柄
    ctx.fillStyle = "#F72F02";
    ctx.fillRect(sx - 18, h / 2 - 14, 36, 28);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 18, h / 2 - 14, 36, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 12px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("↔", sx, h / 2 + 0.5);

    // 左上/右上标签
    const tag = (txt, bx, align, bg, fg) => {
      ctx.font = `700 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(txt).width + 14;
      const rx = align === "right" ? bx - tw : bx;
      ctx.fillStyle = bg;
      ctx.fillRect(rx, 10, tw, 22);
      ctx.fillStyle = fg;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, rx + 7, 21);
    };
    if (sx > 110) tag("无出血留白框（58% 画面）", 10, "left", "#0B0B0B", "#F5F3EE");
    if (w - sx > 110) tag("满出血破边（100% 画面）", w - 10, "right", "#F72F02", "#FFFFFF");

    ctx.restore();
  }

  function updateUI() {
    const pctBleed = Math.round((1 - state.split) * 100);
    if (slider) slider.value = String(Math.round(state.split * 100));
    if (areaVal) areaVal.textContent = pctBleed >= 90
      ? "满出血全开 · 有效视觉面积 100%（较 22mm 留白框放大 +72%）"
      : pctBleed <= 10
        ? "无出血留白态 · 有效视觉面积仅 58%（四周白边锁住画框）"
        : `拉帘对比中 · 右侧 ${pctBleed}% 为满出血（100% 纸面），左侧为留白框（58% 纸面）`;
    if (readout) {
      readout.textContent = pctBleed >= 90
        ? "拿掉白框后，眼睛不再把色块看作「贴在纸上的小图片」，而直接进入整张纸构成的现场。"
        : pctBleed <= 10
          ? "白边给了画面一层礼貌的保护框，适合书页与画廊装裱，但主体尺度瞬间缩水近四成。"
          : "在同一物理纸幅里左右拉动分界线，直观对比「画在纸里」与「纸即画面」的尺幅落差。";
    }
    sceneBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s1Scene === state.scene)));
    ctrl.draw();
  }

  const setFromClientX = (clientX) => {
    const r = canvas.getBoundingClientRect();
    state.split = clamp((clientX - r.left) / r.width, 0.04, 0.96);
    updateUI();
  };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    setFromClientX(e.clientX);
    if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (e) => { if (dragging) setFromClientX(e.clientX); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  if (slider) slider.addEventListener("input", () => {
    state.split = clamp(Number(slider.value) / 100, 0.04, 0.96);
    updateUI();
  });
  sceneBtns.forEach((b) => b.addEventListener("click", () => {
    state.scene = b.dataset.s1Scene;
    updateUI();
  }));
  stopBtns.forEach((b) => b.addEventListener("click", () => {
    state.split = clamp(Number(b.dataset.s1Stop) / 100, 0.04, 0.96);
    updateUI();
  }));

  const ctrl = loop(canvas, render);
  updateUI();
}

// =========================================================================
// 02 节：10× 印前角部显微放大镜（看清出血线 / 裁切角线 / 套准标 / 走刀偏差）
// =========================================================================
export function mountPrepressLoupe(root) {
  const canvas = root.querySelector("#s2-canvas");
  const spotBtns = [...root.querySelectorAll("[data-s2-spot]")];
  const tolBtns = [...root.querySelectorAll("[data-s2-tol]")];
  const titleEl = root.querySelector("#s2-spot-title");
  const descEl = root.querySelector("#s2-spot-desc");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const SPOTS = {
    crop: {
      label: "裁切角线（Crop Marks）",
      nx: 0.25, ny: 0.25,
      desc: "位于成品四角之外的极细黑线，专门指示切纸机刀口对齐的基准坐标；切完之后角线会随废纸边一起被削掉，绝不会留在成品上。",
    },
    bleed: {
      label: "+3 mm 出血带（Bleed Zone）",
      nx: 0.20, ny: 0.48,
      desc: "国际通用 3 mm（北美 1/8 in ≈ 3.175 mm）外扩区。它本身注定会被切掉，唯一使命是在刀口轻微偏外时用真墨水顶住，不让底层白纸露出来。",
    },
    reg: {
      label: "套准标（Registration Mark）",
      nx: 0.56, ny: 0.12,
      desc: "由 C/M/Y/K 四色叠印而成的十字圆环记号，放在印张裁切区外。印厂师傅用放大镜看四色圆环是否严丝合缝，判断多色套印有没有错版。",
    },
    safe: {
      label: "安全区内界（Safe Margin）",
      nx: 0.42, ny: 0.48,
      desc: "成品裁切线向内缩进 6–10 mm（行业经验值）。标题、正文、页码和标识必须稳守在线内，避免走刀偏内或装订翻折时被削边。",
    },
  };

  const state = { spot: "bleed", nx: SPOTS.bleed.nx, ny: SPOTS.bleed.ny, drift: 1.0 }; // drift: 0 | +1.0 (偏外) | -1.0 (偏内)

  function drawPlate(c, x, y, w, h, drift) {
    // 印张白底（SRA4 左上角局部）
    c.fillStyle = "#F5F3EE";
    c.fillRect(x, y, w, h);

    const trimX = x + w * 0.28;
    const trimY = y + h * 0.28;
    const mm = w / 34; // 约 34mm 局部视野
    const bleed = 3 * mm;
    const safe = 7 * mm;

    // 实际朱红印刷出血区（+3mm）
    c.fillStyle = "#F72F02";
    c.fillRect(trimX - bleed, trimY - bleed, x + w - (trimX - bleed), y + h - (trimY - bleed));

    // 安全区内排字样例
    c.fillStyle = "#070707";
    c.font = `900 ${Math.round(mm * 6.8)}px "Noto Sans SC", sans-serif`;
    c.textAlign = "left";
    c.textBaseline = "top";
    c.fillText("满出", trimX + safe, trimY + safe);
    c.font = `700 ${Math.round(mm * 1.95)}px "Archivo", sans-serif`;
    c.fillText("SAFE ≥ 6mm", trimX + safe, trimY + safe + mm * 8.2);

    // 裁切角线（位于出血区外）
    c.strokeStyle = "#070707";
    c.lineWidth = Math.max(1, mm * 0.22);
    c.beginPath();
    c.moveTo(trimX - bleed - mm * 5, trimY); c.lineTo(trimX - bleed - mm * 0.8, trimY);
    c.moveTo(trimX, trimY - bleed - mm * 5); c.lineTo(trimX, trimY - bleed - mm * 0.8);
    c.stroke();

    // 顶部套准标（Registration Mark）
    const rx = x + w * 0.56, ry = y + h * 0.12, rr = mm * 1.9;
    c.strokeStyle = "#001CE7";
    c.lineWidth = Math.max(1, mm * 0.22);
    c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.stroke();
    c.beginPath();
    c.moveTo(rx - rr * 1.6, ry); c.lineTo(rx + rr * 1.6, ry);
    c.moveTo(rx, ry - rr * 1.6); c.lineTo(rx, ry + rr * 1.6);
    c.stroke();
    c.fillStyle = "#001CE7";
    c.beginPath(); c.arc(rx, ry, rr * 0.35, 0, Math.PI * 2); c.fill();

    // 三道印前线
    // +3mm 出血线
    c.strokeStyle = "#B41F00";
    c.lineWidth = Math.max(1, mm * 0.22);
    c.setLineDash([mm * 1.2, mm * 0.8]);
    c.beginPath();
    c.moveTo(trimX - bleed, y + h);
    c.lineTo(trimX - bleed, trimY - bleed);
    c.lineTo(x + w, trimY - bleed);
    c.stroke();
    c.setLineDash([]);

    // 成品裁切线（0mm）
    c.strokeStyle = "#001CE7";
    c.lineWidth = Math.max(1.2, mm * 0.28);
    c.beginPath();
    c.moveTo(trimX, y + h);
    c.lineTo(trimX, trimY);
    c.lineTo(x + w, trimY);
    c.stroke();

    // 安全区线
    c.strokeStyle = "#FFFFFF";
    c.lineWidth = Math.max(1, mm * 0.22);
    c.setLineDash([mm * 1.0, mm * 0.9]);
    c.beginPath();
    c.moveTo(trimX + safe, y + h);
    c.lineTo(trimX + safe, trimY + safe);
    c.lineTo(x + w, trimY + safe);
    c.stroke();
    c.setLineDash([]);

    // 实际走刀线（带 drift 偏移：+1.0mm 偏外仍在 3mm 出血墨水里；-1.0mm 偏内仍离 7mm 文字很远）
    const cutX = trimX - drift * mm;
    const cutY = trimY - drift * mm;
    c.strokeStyle = "#FFDA3D";
    c.lineWidth = Math.max(1.6, mm * 0.36);
    c.beginPath();
    c.moveTo(cutX, y + h);
    c.lineTo(cutX, cutY);
    c.lineTo(x + w, cutY);
    c.stroke();
  }

  function render() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const w = Math.max(240, Math.round(r.width));
    const h = Math.max(240, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, w, h);

    const wide = w >= 560;
    const pad = 16;
    const plateW = wide ? Math.round((w - pad * 3) * 0.56) : w - pad * 2;
    const plateH = wide ? h - pad * 2 : Math.round((h - pad * 3) * 0.52);
    const px = pad, py = pad;

    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, plateW, plateH); ctx.clip();
    drawPlate(ctx, px, py, plateW, plateH, state.drift);
    ctx.restore();
    ctx.strokeStyle = "#333333";
    ctx.strokeRect(px, py, plateW, plateH);

    // 镜片取景圈标示
    const lx = px + state.nx * plateW;
    const ly = py + state.ny * plateH;
    const sampleR = Math.min(plateW, plateH) * 0.13;
    ctx.strokeStyle = "#001CE7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly, sampleR, 0, Math.PI * 2);
    ctx.stroke();

    // 10× 显微放大镜圆窗（为底部状态字留出 24px 净空，绝不压圆框）
    const lensBox = wide
      ? { x: px + plateW + pad, y: pad, w: w - plateW - pad * 3, h: h - pad * 2 }
      : { x: pad, y: py + plateH + pad, w: w - pad * 2, h: h - plateH - pad * 3 };
    const lcx = lensBox.x + lensBox.w / 2;
    const lcy = lensBox.y + (lensBox.h - 24) / 2;
    const lr = Math.max(28, Math.min(lensBox.w, lensBox.h - 26) * 0.43);
    const zoom = 2.6;

    // 连接引线
    ctx.strokeStyle = "rgba(125,160,255,0.6)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(lx + sampleR, ly); ctx.lineTo(lcx - lr, lcy); ctx.stroke();
    ctx.setLineDash([]);

    // 裁剪圆形放大镜
    ctx.save();
    ctx.beginPath();
    ctx.arc(lcx, lcy, lr, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(lcx, lcy);
    ctx.scale(zoom, zoom);
    ctx.translate(-lx, -ly);
    drawPlate(ctx, px, py, plateW, plateH, state.drift);
    ctx.restore();

    // 光学镜框
    ctx.strokeStyle = "#F5F3EE";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(lcx, lcy, lr, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#001CE7";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(lcx, lcy, lr + 4, 0, Math.PI * 2); ctx.stroke();

    // 放大镜标注
    ctx.fillStyle = "#F5F3EE";
    ctx.font = `700 11px "Space Mono", "Noto Sans SC", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const driftTxt = state.drift === 0 ? "理想走刀 0.0mm" : state.drift > 0 ? "走刀偏外 +1.0mm（落在 3mm 出血墨内）" : "走刀偏内 -1.0mm（距安全区仍余 6mm）";
    ctx.fillText(driftTxt, lcx, lensBox.y + lensBox.h - 2);

    ctx.restore();
  }

  function syncUI() {
    const info = SPOTS[state.spot];
    if (titleEl) titleEl.textContent = info.label;
    if (descEl) descEl.textContent = info.desc;
    spotBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s2Spot === state.spot)));
    tolBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.s2Tol) === state.drift)));
    ctrl.draw();
  }

  spotBtns.forEach((b) => b.addEventListener("click", () => {
    state.spot = b.dataset.s2Spot;
    state.nx = SPOTS[state.spot].nx;
    state.ny = SPOTS[state.spot].ny;
    syncUI();
  }));
  tolBtns.forEach((b) => b.addEventListener("click", () => {
    state.drift = Number(b.dataset.s2Tol);
    syncUI();
  }));

  let dragging = false;
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    const wide = r.width >= 560;
    const pad = 16;
    const pw = wide ? Math.round((r.width - pad * 3) * 0.56) : r.width - pad * 2;
    const ph = wide ? r.height - pad * 2 : Math.round((r.height - pad * 3) * 0.52);
    const x = e.clientX - r.left - pad;
    const y = e.clientY - r.top - pad;
    if (x >= 0 && x <= pw && y >= 0 && y <= ph) {
      state.nx = clamp(x / pw, 0.08, 0.92);
      state.ny = clamp(y / ph, 0.08, 0.92);
      ctrl.draw();
    }
  };
  canvas.addEventListener("pointerdown", (e) => { dragging = true; pick(e); });
  canvas.addEventListener("pointermove", (e) => { if (dragging) pick(e); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  const ctrl = loop(canvas, render);
  syncUI();
}

// =========================================================================
// 03 节：跨媒介裁切安全框检验台（A4 单页 / 杂志跨页 / 全面屏手机 / 9:16 竖屏）
// =========================================================================
export function mountMediumInspector(root) {
  const tabs = [...root.querySelectorAll("[data-s3-medium]")];
  const modeBtns = [...root.querySelectorAll("[data-s3-mode]")];
  const svgHost = root.querySelector("#s3-svg-host");
  const titleEl = root.querySelector("#s3-title");
  const ruleEl = root.querySelector("#s3-rule");
  const noteEl = root.querySelector("#s3-note");
  if (!svgHost) return;

  const MEDIA = {
    print: {
      title: "单页胶印海报（ISO A4 · 210×297 mm）",
      rule: "外扩出血 +3 mm · 内缩安全区 ≥ 6–10 mm（经验值）",
      okNote: "朱红底面与右侧黑圆越过蓝线延伸到 +3 mm 红虚线外，左侧文字稳居安全区，裁切后四边满墨且字形完整。",
      badNote: "把主标题和二维码一起推到刀口边，切纸机一旦偏内 1 mm，文字左笔画与扫码角标当场被削缺。",
      render: (bad) => `
        <svg viewBox="0 0 420 260" class="s3-svg" role="img" aria-label="单页胶印满出血与安全区示意">
          <rect x="0" y="0" width="420" height="260" fill="#111111"/>
          <rect x="92" y="18" width="236" height="224" fill="#F5F3EE"/>
          <rect x="${bad ? 112 : 102}" y="${bad ? 34 : 26}" width="${bad ? 196 : 216}" height="${bad ? 192 : 208}" fill="#F72F02"/>
          <clipPath id="s3c1"><rect x="${bad ? 112 : 102}" y="${bad ? 34 : 26}" width="${bad ? 196 : 216}" height="${bad ? 192 : 208}"/></clipPath>
          <circle cx="304" cy="136" r="76" fill="#070707" clip-path="url(#s3c1)"/>
          <line x1="214" y1="242" x2="322" y2="28" stroke="#F5F3EE" stroke-width="5" clip-path="url(#s3c1)"/>
          <rect x="112" y="34" width="196" height="192" fill="none" stroke="#001CE7" stroke-width="1.8"/>
          <rect x="102" y="26" width="216" height="208" fill="none" stroke="#F72F02" stroke-width="1.2" stroke-dasharray="5 3"/>
          <rect x="128" y="50" width="164" height="160" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="4 3"/>
          <text x="${bad ? 108 : 134}" y="${bad ? 64 : 80}" fill="#070707" font-size="22" font-weight="900">满出血</text>
          <text x="${bad ? 108 : 134}" y="${bad ? 88 : 104}" fill="#070707" font-size="22" font-weight="900">版式</text>
          ${bad ? `<rect x="104" y="42" width="16" height="54" fill="rgba(255,218,61,0.55)" stroke="#FFDA3D" stroke-width="1.5"/><text x="16" y="72" fill="#FFDA3D" font-size="12" font-weight="700">× 贴边切字</text><text x="334" y="52" fill="#FF6B4A" font-size="12" font-weight="700">× 0mm露白</text>`
                : `<text x="14" y="56" fill="#7DA0FF" font-size="11" font-weight="700">蓝线=刀口</text><text x="14" y="76" fill="#FF6B4A" font-size="11" font-weight="700">红虚=+3mm</text><text x="334" y="76" fill="#5EE0A4" font-size="11" font-weight="700">✓ 文字安全</text>`}
        </svg>`,
    },
    spread: {
      title: "杂志跨页满出血（装订中缝 + 外三边出血）",
      rule: "外三边各留 +3 mm 出血 · 中缝内缩 12–15 mm 避开胶装折谷",
      okNote: "大图与色块直接越过天头、地脚、切口与书脊形成无缝视野，标题与正文退守左页安全带，绝不跨在 12 mm 胶装折谷上。",
      badNote: "把核心正文或人物面部正骑在胶装中缝上，装订夹紧后字被吸进折谷，翻平也读不清中间两个字。",
      render: (bad) => `
        <svg viewBox="0 0 420 260" class="s3-svg" role="img" aria-label="杂志跨页满出血与装订折谷示意">
          <rect x="0" y="0" width="420" height="260" fill="#111111"/>
          <rect x="40" y="24" width="340" height="212" fill="#F5F3EE"/>
          <rect x="48" y="32" width="324" height="196" fill="#1B2834"/>
          <circle cx="290" cy="134" r="78" fill="#F72F02"/>
          <rect x="200" y="32" width="20" height="196" fill="rgba(0,0,0,0.42)"/>
          <line x1="210" y1="24" x2="210" y2="236" stroke="#7DA0FF" stroke-width="1.5" stroke-dasharray="4 3"/>
          <rect x="56" y="40" width="308" height="180" fill="none" stroke="#001CE7" stroke-width="1.6"/>
          <text x="${bad ? 174 : 74}" y="128" fill="#F5F3EE" font-size="22" font-weight="900">城市边界</text>
          ${bad ? `<rect x="198" y="102" width="24" height="36" fill="rgba(255,218,61,0.5)" stroke="#FFDA3D" stroke-width="1.5"/><text x="210" y="251" text-anchor="middle" fill="#FFDA3D" font-size="12" font-weight="700">× 标题骑缝：胶装折谷直接吃字</text>`
                : `<text x="210" y="251" text-anchor="middle" fill="#5EE0A4" font-size="12" font-weight="700">✓ 背景通跨双页，文字稳避 12mm 中缝折谷</text>`}
        </svg>`,
    },
    mobile: {
      title: "全面屏手机（100vw 满宽 + Safe Area Inset）",
      rule: "图片铺至物理屏幕四角 · 按钮与文字严格遵守 env(safe-area-inset)",
      okNote: "数字世界虽没有钢制铡刀，但屏幕圆角、灵动岛/刘海与底部手势条就是新的「物理刀口」：视觉铺满全屏，交互控件内缩安全区。",
      badNote: "把关闭按钮塞进左上圆角或让主按钮贴着底部手势横条，手指一滑直接退回桌面，文字也被刘海遮住。",
      render: (bad) => `
        <svg viewBox="0 0 420 260" class="s3-svg" role="img" aria-label="全面屏手机满出血与安全区示意">
          <rect x="0" y="0" width="420" height="260" fill="#111111"/>
          <rect x="148" y="14" width="124" height="232" rx="22" fill="#F72F02" stroke="#F5F3EE" stroke-width="3"/>
          <clipPath id="s3m"><rect x="148" y="14" width="124" height="232" rx="22"/></clipPath>
          <circle cx="256" cy="146" r="64" fill="#070707" clip-path="url(#s3m)"/>
          <rect x="188" y="22" width="44" height="10" rx="5" fill="#070707"/>
          <rect x="184" y="234" width="52" height="4" rx="2" fill="#F5F3EE"/>
          <rect x="158" y="42" width="104" height="182" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="${bad ? 156 : 164}" y="${bad ? 33 : 72}" fill="#070707" font-size="16" font-weight="900">满屏首焦</text>
          <rect x="${bad ? 166 : 164}" y="${bad ? 222 : 196}" width="92" height="22" fill="#070707"/>
          <text x="${bad ? 212 : 210}" y="${bad ? 237 : 211}" text-anchor="middle" fill="#F5F3EE" font-size="11" font-weight="700">立即预约</text>
          ${bad ? `<text x="292" y="38" fill="#FFDA3D" font-size="12" font-weight="700">× 撞刘海/圆角</text><text x="292" y="232" fill="#FFDA3D" font-size="12" font-weight="700">× 撞底部手势条</text>`
                : `<text x="292" y="72" fill="#5EE0A4" font-size="11" font-weight="700">✓ 视觉满铺 100vw</text><text x="292" y="210" fill="#5EE0A4" font-size="11" font-weight="700">✓ 控件内守安全区</text>`}
        </svg>`,
    },
    social: {
      title: "9:16 竖屏社媒封面（平台 UI 遮挡安全框）",
      rule: "背景全幅出血 · 避开右侧点赞栏与底部文案区（约底部 22%）",
      okNote: "竖屏信息流里平台图标与字幕条会直接压在画面边缘。让视觉背景满出血，把核心标题与主体锚点收在中上安全窗内。",
      badNote: "满版海报直接照搬上竖屏，底部排演日期被平台文案遮死，右侧关键标签撞上点赞收藏按钮。",
      render: (bad) => `
        <svg viewBox="0 0 420 260" class="s3-svg" role="img" aria-label="竖屏社媒满出血与UI遮挡安全框">
          <rect x="0" y="0" width="420" height="260" fill="#111111"/>
          <rect x="148" y="14" width="124" height="232" fill="#0B0B0D" stroke="#444" stroke-width="2"/>
          <rect x="148" y="14" width="124" height="232" fill="#F72F02"/>
          <clipPath id="s3soc"><rect x="148" y="14" width="124" height="232"/></clipPath>
          <circle cx="250" cy="118" r="56" fill="#070707" clip-path="url(#s3soc)"/>
          <rect x="246" y="102" width="22" height="96" fill="rgba(0,0,0,0.55)"/>
          <rect x="148" y="196" width="124" height="50" fill="rgba(0,0,0,0.62)"/>
          <rect x="156" y="36" width="84" height="154" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="160" y="${bad ? 222 : 84}" fill="${bad ? "#FFDA3D" : "#070707"}" font-size="16" font-weight="900">周末展讯</text>
          <text x="160" y="${bad ? 238 : 104}" fill="${bad ? "#FFDA3D" : "#070707"}" font-size="10" font-weight="700">11.28 — 12.14</text>
          ${bad ? `<text x="288" y="226" fill="#FFDA3D" font-size="12" font-weight="700">× 被底部字幕栏压死</text>`
                : `<text x="288" y="88" fill="#5EE0A4" font-size="11" font-weight="700">✓ 标题稳居中上窗</text><text x="288" y="218" fill="#B8B4AC" font-size="11">平台 UI 遮挡带</text>`}
        </svg>`,
    },
  };

  let curMedium = "print";
  let isBad = false;

  function update() {
    const m = MEDIA[curMedium];
    svgHost.innerHTML = m.render(isBad);
    titleEl.textContent = m.title;
    ruleEl.textContent = m.rule;
    noteEl.textContent = isBad ? m.badNote : m.okNote;
    noteEl.dataset.tone = isBad ? "warn" : "ok";
    tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s3Medium === curMedium)));
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.s3Mode === "bad") === isBad)));
  }

  tabs.forEach((b) => b.addEventListener("click", () => { curMedium = b.dataset.s3Medium; update(); }));
  modeBtns.forEach((b) => b.addEventListener("click", () => { isBad = b.dataset.s3Mode === "bad"; update(); }));
  update();
}

// =========================================================================
// 04 节：历史四纪元演进步进器 + 动态重构版面微缩图板
// =========================================================================
export function mountHistoryStepper(root) {
  const btns = [...root.querySelectorAll("[data-s4-era]")];
  const yearEl = root.querySelector("#s4-year");
  const headEl = root.querySelector("#s4-head");
  const bodyEl = root.querySelector("#s4-body");
  const srcEl = root.querySelector("#s4-src");
  const plateHost = root.querySelector("#s4-plate");
  if (!plateHost) return;

  const ERAS = {
    bauhaus: {
      year: "1925 — 1928",
      head: "新排版与包豪斯：打破古典对称页边距",
      body: "德国排版家 Jan Tschichold（1902–1974）在 1925 年《elementare typographie》与 1928 年《Die neue Typographie（新排版）》中挑战传统居中书版，提倡非对称秩序与无衬线字；同期 László Moholy-Nagy 在包豪斯丛书（Bauhausbücher，1925–1930）推行「排版摄影（Typophoto）」，开始把色条与裁切照片推抵纸张边缘。",
      src: "出处核实：Britannica（Jan Tschichold）· MoMA《The New Typography》展览档案",
      svg: `<svg viewBox="0 0 280 200" class="s4-svg" role="img" aria-label="1925至1928年新排版与包豪斯打破页边距示意">
        <rect width="280" height="200" fill="#F5F3EE" stroke="#111" stroke-width="2"/>
        <rect x="0" y="0" width="280" height="34" fill="#F72F02"/>
        <rect x="0" y="34" width="22" height="166" fill="#070707"/>
        <rect x="42" y="54" width="110" height="18" fill="#070707"/>
        <rect x="42" y="80" width="76" height="8" fill="#555"/>
        <rect x="168" y="68" width="112" height="104" fill="#181818"/>
        <circle cx="242" cy="120" r="34" fill="#F5F3EE"/>
        <text x="12" y="22" fill="#F5F3EE" font-size="12" font-weight="700">DIE NEUE TYPOGRAPHIE · 1928</text>
      </svg>`,
    },
    agha: {
      year: "1929 — 1930",
      head: "Dr. M.F. Agha：把满出血摄影带入主流杂志",
      body: "1929 年，康泰纳仕（Condé Nast）延请曾在巴黎与柏林负责《Vogue》的 Dr. Mehemed Fehmy Agha（1896–1978）出任美国版《Vanity Fair》《Vogue》艺术总监。他拆掉杂志照片四周沿袭几十年的白边与花框，率先在美国主流期刊大规模引入满出血摄影与现代双页跨版。",
      src: "出处核实：Wikipedia（Mehemed Fehmy Agha）与康泰纳仕期刊史料",
      svg: `<svg viewBox="0 0 280 200" class="s4-svg" role="img" aria-label="1929年Agha引入满出血杂志摄影示意">
        <rect width="280" height="200" fill="#F5F3EE" stroke="#111" stroke-width="2"/>
        <rect x="0" y="0" width="140" height="200" fill="#141414"/>
        <clipPath id="s4agha"><rect x="0" y="0" width="140" height="200"/></clipPath>
        <circle cx="100" cy="112" r="72" fill="#F72F02" clip-path="url(#s4agha)"/>
        <line x1="140" y1="0" x2="140" y2="200" stroke="#7DA0FF" stroke-width="1.5" stroke-dasharray="4 3"/>
        <rect x="160" y="38" width="96" height="14" fill="#070707"/>
        <rect x="160" y="62" width="84" height="6" fill="#555"/>
        <rect x="160" y="74" width="92" height="6" fill="#555"/>
        <rect x="160" y="86" width="70" height="6" fill="#555"/>
        <text x="160" y="178" fill="#001CE7" font-size="11" font-weight="700">VANITY FAIR · 1930</text>
      </svg>`,
    },
    brodovitch: {
      year: "1934 — 1958",
      head: "Alexey Brodovitch：让满出血成为视觉电影",
      body: "俄裔设计师 Alexey Brodovitch（1898–1971）自 1934 年起执掌《Harper's Bazaar》长达 24 年。他把大胆破边裁切的动态摄影与成片呼吸留白强对比并置，让读者翻阅每一组跨页都像观看电影推拉镜头，奠定了当代时尚与艺术出版的满出血语法。",
      src: "出处核实：Britannica（Alexey Brodovitch）",
      svg: `<svg viewBox="0 0 280 200" class="s4-svg" role="img" aria-label="1934至1958年Brodovitch时尚杂志满出血跨页示意">
        <rect width="280" height="200" fill="#0E0E0E" stroke="#111" stroke-width="2"/>
        <rect x="0" y="0" width="194" height="200" fill="#F72F02"/>
        <path d="M108,200 L224,0 L280,0 L280,200 Z" fill="#F5F3EE"/>
        <circle cx="152" cy="108" r="58" fill="#070707"/>
        <line x1="140" y1="0" x2="140" y2="200" stroke="rgba(255,255,255,0.5)" stroke-dasharray="4 3"/>
        <text x="18" y="36" fill="#070707" font-size="13" font-weight="900">HARPER’S BAZAAR</text>
      </svg>`,
    },
    iso: {
      year: "ISO 217 — 当代",
      head: "未裁切 SRA 印张标准化与数字全面屏",
      body: "为了让大批量胶印做到「切完正好是标准 A4（210×297 mm）且四边满墨」，国际纸张标准 ISO 217 专门设立比 A 系列大一圈的 RA/SRA 原始印张（如 SRA4 为 225×320 mm），专供出血与咬口裁切。进入数字屏幕时代，满出血演变为 100vw 满宽视觉与安全区避让。",
      src: "出处核实：Markus Kuhn（剑桥大学 ISO 216/217 文档）· Adobe InDesign 印前规范",
      svg: `<svg viewBox="0 0 280 200" class="s4-svg" role="img" aria-label="ISO 217 SRA4 未裁切印张与 A4 成品裁切关系">
        <rect width="280" height="200" fill="#141414"/>
        <rect x="34" y="16" width="212" height="168" fill="#F5F3EE"/>
        <rect x="46" y="26" width="188" height="148" fill="#F72F02"/>
        <rect x="54" y="34" width="172" height="132" fill="none" stroke="#001CE7" stroke-width="2"/>
        <text x="140" y="96" text-anchor="middle" fill="#070707" font-size="16" font-weight="900">SRA4 → A4</text>
        <text x="140" y="118" text-anchor="middle" fill="#070707" font-size="11" font-weight="700">225×320mm → 210×297mm</text>
        <text x="140" y="156" text-anchor="middle" fill="#F5F3EE" font-size="10" font-weight="700">BLEED +3mm / 0.125 in</text>
      </svg>`,
    },
  };

  function setEra(key) {
    const e = ERAS[key];
    yearEl.textContent = e.year;
    headEl.textContent = e.head;
    bodyEl.textContent = e.body;
    srcEl.textContent = e.src;
    plateHost.innerHTML = e.svg;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s4Era === key)));
  }

  btns.forEach((b) => b.addEventListener("click", () => setEra(b.dataset.s4Era)));
  setEra("bauhaus");
}

// =========================================================================
// 05 节：六项真实委托案印前判章器（宜用满出血 vs 明确别用）
// =========================================================================
export function mountBriefJudge(root) {
  const btns = [...root.querySelectorAll("[data-s5-case]")];
  const stampEl = root.querySelector("#s5-stamp");
  const titleEl = root.querySelector("#s5-title");
  const costEl = root.querySelector("#s5-cost");
  const reasonEl = root.querySelector("#s5-reason");
  const altEl = root.querySelector("#s5-alt");
  if (!stampEl) return;

  const CASES = {
    museum: {
      verdict: "宜用满出血",
      ok: true,
      title: "美术馆大型建筑展街头海报（A1 胶印裁切）",
      cost: "印张加大一档 · 四面裁切 · 沉浸感最高",
      reason: "户外远观需要第一眼抢占视野，用满出血把建筑体块与色场直接推到物理边沿，比加白框在同等尺寸下显得大一圈。",
      alt: "注意：展期、地点、票务二维码须稳守 12 mm 以上内缩安全区。",
    },
    office: {
      verdict: "别用满出血",
      ok: false,
      title: "公司内部周报与会议材料（办公室 A4 激光打印机直出）",
      cost: "办公机自带 4–5 mm 非打印死区，硬铺满版必出歪白边",
      reason: "绝大多数商用激光机无法无边距打印，强做满出血会被驱动强行等比缩小或硬切出不均匀的灰白边框，既耗墨粉又显粗糙。",
      alt: `改用 <a href="https://layout.xiaoxiaodong.ai/139/play/" target="_blank" rel="noopener">139 无出血版式</a> 或 <a href="https://layout.xiaoxiaodong.ai/132/play/" target="_blank" rel="noopener">132 单栏版式</a>，顺应设备物理留白。`,
    },
    magazine: {
      verdict: "宜用满出血",
      ok: true,
      title: "高端时尚 / 摄影杂志章节开篇页",
      cost: "本就走 SRA 大张印制与三面铣切，边际成本极低",
      reason: "章节扉页承担情绪转场任务，满出血摄影能把读者瞬间从密集正文拉入视觉现场；翻页后回到双栏/多栏继续阅读，张弛有度。",
      alt: `若画面跨左右两页通流，延伸参考 <a href="https://layout.xiaoxiaodong.ai/137/play/" target="_blank" rel="noopener">137 通版跨页</a>。`,
    },
    report: {
      verdict: "别用满出血",
      ok: false,
      title: "60 页法律合同 / 学术期刊正文页",
      cost: "阅读疲劳高 · 无手指握持区与批注留白",
      reason: "长时间逐行精读需要宽裕页边距给眼睛做回行缓冲，也要给读者的大拇指与笔记留出落地空间；满出血会把整页压得喘不过气。",
      alt: `改用 <a href="https://layout.xiaoxiaodong.ai/132/play/" target="_blank" rel="noopener">132 单栏版式</a>、<a href="https://layout.xiaoxiaodong.ai/133/play/" target="_blank" rel="noopener">133 双栏版式</a> 或 <a href="https://layout.xiaoxiaodong.ai/134/play/" target="_blank" rel="noopener">134 多栏版式</a>。`,
    },
    heroWeb: {
      verdict: "宜用满出血",
      ok: true,
      title: "新品发布官网 100vw 首屏视觉区",
      cost: "零纸张加价 · 但需配置手机 safe-area 安全区",
      reason: "品牌首屏的目标是在 2 秒内建立气场与沉浸感，让摄影或色场贴满视口边缘能直接消除网页框架感，文字与按钮内收在版心容器里即可。",
      alt: "切忌把下方价格表、表单输入框也顶死到屏幕两侧，正文区立刻回到常规容器边距。",
    },
    archive: {
      verdict: "别用满出血",
      ok: false,
      title: "博物馆古画全卷图录 / 精密机械总装图",
      cost: "任何 1 mm 裁边误差都会永久损失文献边缘信息",
      reason: "满出血意味着允许作品边缘被裁掉 3 mm 甚至更多。古画边跋、题印或工程图尺寸标一旦挨着刀口，轻则残缺重则失真，必须完整装框展示。",
      alt: `改用 <a href="https://layout.xiaoxiaodong.ai/139/play/" target="_blank" rel="noopener">139 无出血版式</a>，用克制白边守护文物与图纸的完整边界。`,
    },
  };

  function select(key) {
    const c = CASES[key];
    stampEl.textContent = c.verdict;
    stampEl.dataset.ok = String(c.ok);
    titleEl.textContent = c.title;
    costEl.textContent = c.cost;
    reasonEl.textContent = c.reason;
    altEl.innerHTML = c.alt;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s5Case === key)));
  }

  btns.forEach((b) => b.addEventListener("click", () => select(b.dataset.s5Case)));
  select("museum");
}

// =========================================================================
// 06 节：单变量控制小练习（四张仅差 bleed / safe 的打样，选完当场模拟落刀！）
// =========================================================================
export function mountQuiz(root) {
  const opts = [...root.querySelectorAll("[data-quiz-opt]")];
  const fb = root.querySelector("#quiz-feedback");
  const resetBtn = root.querySelector("#quiz-reset");
  if (!opts.length || !fb) return;

  const DATA = {
    A: {
      ok: false, bleed: 3, safe: 2,
      cutMsg: "落刀实测：右侧无露白，但左侧文字距刀口仅 2 mm，偏内走刀加上折边直接把「展」字边缘削缺。",
    },
    B: {
      ok: false, bleed: 0, safe: 10,
      cutMsg: "落刀实测：文字很安全，但色块刚好停在 0 mm 裁切线上，切纸机一旦偏外 1 mm，右边立刻撕开刺眼白缝。",
    },
    C: {
      ok: true, bleed: 3, safe: 10,
      cutMsg: "回答正确！背景外扩 +3 mm 完整吃掉 ±1 mm 走刀误差，四边零露白；标题内缩 10 mm 稳居安全区，裁切后既满版又干净。",
    },
    D: {
      ok: false, bleed: -8, safe: 14,
      cutMsg: "落刀实测：既不切字也没歪缝，但背景内缩 8 mm 留下了整圈白框，成品已经退化成无出血版式，不符合题目要求的满出血。",
    },
  };

  function renderProofs(trimmed) {
    for (const btn of opts) {
      const k = btn.dataset.quizOpt;
      const d = DATA[k];
      const host = btn.querySelector(".q-svg-host");
      // 成品框: x=26..174 (w=148), y=18..110 (h=92). 1mm ≈ 1.4px
      const scale = 1.6;
      const bPx = d.bleed * scale;
      const sPx = d.safe * scale;
      // 模拟走刀偏移：纸堆整体左移 1.4mm（右侧若 bleed<1.4 会露白，左侧若 safe<2.5 会切字）
      const shift = trimmed ? -1.4 * scale : 0;
      const ax = 26 - bPx + shift;
      const ay = 18 - bPx;
      const aw = 148 + bPx * 2;
      const ah = 92 + bPx * 2;
      const textX = 26 + sPx + shift;
      const hasSliver = trimmed && d.bleed >= 0 && d.bleed < 1.4;
      const isFramed = d.bleed < 0;
      const isChopped = trimmed && d.safe <= 2.5;

      host.innerHTML = `
        <svg viewBox="0 0 200 128" class="q-svg" aria-hidden="true">
          <rect width="200" height="128" fill="${trimmed ? "#121212" : "#EAE8E1"}"/>
          <rect x="${trimmed ? 26 : 12}" y="${trimmed ? 18 : 8}" width="${trimmed ? 148 : 176}" height="${trimmed ? 92 : 112}" fill="#FFFFFF"/>
          <clipPath id="qc-${k}"><rect x="${trimmed ? 26 : 12}" y="${trimmed ? 18 : 8}" width="${trimmed ? 148 : 176}" height="${trimmed ? 92 : 112}"/></clipPath>
          <clipPath id="qa-${k}"><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}"/></clipPath>
          <g clip-path="url(#qc-${k})">
            <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#F72F02"/>
            <g clip-path="url(#qa-${k})">
              <circle cx="${168 + shift}" cy="66" r="34" fill="#070707"/>
              <line x1="${124 + shift}" y1="114" x2="${174 + shift}" y2="16" stroke="#F5F3EE" stroke-width="3"/>
              <text x="${textX}" y="58" fill="#070707" font-size="18" font-weight="900">展讯</text>
              <text x="${textX}" y="74" fill="#070707" font-size="8.5" font-weight="700">ARCH 2026</text>
            </g>
          </g>
          ${!trimmed ? `<rect x="26" y="18" width="148" height="92" fill="none" stroke="#001CE7" stroke-width="1.3"/>
                        <rect x="21" y="13" width="158" height="102" fill="none" stroke="#F72F02" stroke-width="1" stroke-dasharray="3 2"/>` : ""}
          ${hasSliver ? `<rect x="171" y="18" width="3" height="92" fill="#FFFFFF"/><text x="166" y="104" text-anchor="end" fill="#FFDA3D" font-size="9" font-weight="700">露白边</text>` : ""}
          ${isChopped ? `<rect x="26" y="38" width="8" height="30" fill="rgba(255,218,61,0.55)"/><text x="36" y="104" fill="#FFDA3D" font-size="9" font-weight="700">切字</text>` : ""}
          ${trimmed && isFramed ? `<text x="100" y="104" text-anchor="middle" fill="#111111" font-size="9" font-weight="700">白框未满出血</text>` : ""}
          ${trimmed && d.ok ? `<text x="100" y="104" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700">✓ 零露白 · 不切字</text>` : ""}
        </svg>`;
    }
  }

  let answered = false;

  function choose(k) {
    answered = true;
    const d = DATA[k];
    renderProofs(true);
    opts.forEach((b) => {
      const bk = b.dataset.quizOpt;
      b.dataset.state = bk === k ? (d.ok ? "correct" : "wrong") : (DATA[bk].ok ? "reveal" : "muted");
      b.setAttribute("aria-pressed", String(bk === k));
    });
    fb.hidden = false;
    fb.dataset.ok = String(d.ok);
    fb.innerHTML = `<strong>${d.ok ? "✓ 选中正确打样 · 方案 C" : `× 已模拟落刀 · 方案 ${k} 翻车`}</strong><p>${d.cutMsg}</p>`;
    if (resetBtn) resetBtn.hidden = false;
  }

  function reset() {
    answered = false;
    renderProofs(false);
    opts.forEach((b) => {
      delete b.dataset.state;
      b.setAttribute("aria-pressed", "false");
    });
    fb.hidden = true;
    fb.innerHTML = "";
    if (resetBtn) resetBtn.hidden = true;
  }

  opts.forEach((b) => b.addEventListener("click", () => choose(b.dataset.quizOpt)));
  if (resetBtn) resetBtn.addEventListener("click", reset);
  renderProofs(false);
}

// =========================================================================
// 07 节：原海报灯箱（放大、缩放、鼠标/触屏拖动、Esc 关闭，img 带 draggable="false"）
// =========================================================================
export function mountLightbox() {
  const trigger = document.getElementById("poster-open");
  const poster = document.getElementById("poster");
  const modal = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-in");
  const zoomOutBtn = document.getElementById("lb-out");
  const resetBtn = document.getElementById("lb-reset");
  if (!trigger || !poster || !modal || !lbImg) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, startX = 0, startY = 0;

  function apply() {
    lbImg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
  }
  function open() {
    if (!lbImg.src || lbImg.src !== poster.src) lbImg.src = poster.src;
    scale = 1; tx = 0; ty = 0;
    apply();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    trigger.focus();
  }

  trigger.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  zoomInBtn?.addEventListener("click", () => { scale = clamp(scale + 0.35, 1, 3.2); apply(); });
  zoomOutBtn?.addEventListener("click", () => { scale = clamp(scale - 0.35, 1, 3.2); if (scale === 1) { tx = 0; ty = 0; } apply(); });
  resetBtn?.addEventListener("click", () => { scale = 1; tx = 0; ty = 0; apply(); });

  lbImg.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    if (lbImg.setPointerCapture) try { lbImg.setPointerCapture(e.pointerId); } catch {}
  });
  lbImg.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    apply();
  });
  lbImg.addEventListener("pointerup", () => { dragging = false; });
  lbImg.addEventListener("pointercancel", () => { dragging = false; });
  lbImg.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = clamp(scale + (e.deltaY < 0 ? 0.25 : -0.25), 1, 3.2);
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }, { passive: false });
}
