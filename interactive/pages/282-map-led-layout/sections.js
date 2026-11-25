// 282 地图主导布局 · 第 01–07 节各具一格的交互模块
// 相邻两节控件形态与交互机制完全不同：
//   01 四层透明地图剥离栈（checkbox 叠层 + 3D 透视拆层）
//   02 Z10–Z16 缩放聚合 + 真实地图×列表双向联动原型
//   03 地理实距 ↔ 贝克 45°/90° 拓扑连续形变画布（深松夜航暗室）
//   04 四站历史制图图版解剖切换器（1855 / 1933 / 1967 / 2005）
//   05 四题「什么时候别用」翻牌分流仪 + 兄弟页链接
//   06 三题单变量微型地图辨析小练习（中性 A/B/C/D 标签）
//   07 原海报可缩放拖拽灯箱

import { loop, pixelRatio } from "../../lib/stage.js";
import {
  PALETTE,
  TERRAIN,
  POI_POINTS,
  computeZoomView,
  TOPO_LINES,
  interpolateTopo,
  LINEAGE_ITEMS,
  NOT_USE_CASES,
  QUIZ_ITEMS,
} from "./model.js";

// ==================== 01 四层地图透明片剥离器 ====================
export function mountLayerPeel() {
  const stack = document.getElementById("peelStack");
  const modeBtn = document.getElementById("peelPerspectiveBtn");
  const readout = document.getElementById("peelReadout");
  const toggles = [...document.querySelectorAll("[data-peel-layer]")];
  if (!stack || !readout) return;

  const state = { context: true, region: true, route: true, anchor: true, exploded: true };

  function sync() {
    stack.classList.toggle("is-exploded", state.exploded);
    if (modeBtn) {
      modeBtn.setAttribute("aria-pressed", String(state.exploded));
      modeBtn.textContent = state.exploded ? "切回正视叠合" : "3D 透视拆层";
    }
    for (const layer of ["context", "region", "route", "anchor"]) {
      const sheet = stack.querySelector(`.peel-sheet[data-layer="${layer}"]`);
      if (sheet) sheet.classList.toggle("is-off", !state[layer]);
    }
    const activeCount = [state.context, state.region, state.route, state.anchor].filter(Boolean).length;
    let msg = "";
    if (activeCount === 4) {
      msg = "四层完整咬合：底图提供海陆语境、柔和色块划定归属、虚线串起动线、锚点稳稳钉住视觉焦点。";
    } else if (activeCount === 0) {
      msg = "四层全部关闭：画面只剩空白纸面，请逐层点开观察每一层各自承担的空间职责。";
    } else if (!state.anchor) {
      msg = "缺少「位置锚点」：底图和分区都在，但眼睛扫进去没有明确落脚点，信息找不到聚焦核心。";
    } else if (!state.context) {
      msg = "抽掉「场景语境」：锚点和色块悬空在白纸上，读者不知道哪里临海、哪里靠山，空间相关性大打折扣。";
    } else if (!state.region) {
      msg = "抽掉「区域分组」：能看到点和线，却一眼分不清生态区、城区与产业园的归属边界。";
    } else if (!state.route) {
      msg = "抽掉「路径引导」：各锚点变成互不关联的孤立点位，缺少游览顺序与视觉节奏。";
    }
    readout.textContent = msg;
  }

  for (const input of toggles) {
    input.addEventListener("change", () => {
      state[input.dataset.peelLayer] = input.checked;
      sync();
    });
  }
  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      state.exploded = !state.exploded;
      sync();
    });
  }
  sync();
}

// ==================== 02 缩放聚合 × 地图列表双向联动 ====================
export function mountZoomCluster() {
  const canvas = document.getElementById("zoomMapCanvas");
  const slider = document.getElementById("zoomSlider");
  const zoomLabel = document.getElementById("zoomLevelVal");
  const clusterToggle = document.getElementById("clusterToggleBtn");
  const priceToggle = document.getElementById("priceChipBtn");
  const listEl = document.getElementById("zoomPoiList");
  const statEl = document.getElementById("zoomStatBar");
  if (!canvas || !slider || !listEl) return;

  const ctx = canvas.getContext("2d");
  let zoom = 11;
  let clusterOn = false; // 开场刻意关闭聚合，让用户一眼看见 Z11 下针扎成一团的过绘制问题！
  let priceChips = true;
  let activeId = null;
  let hitMarkers = [];

  function drawZoomMap() {
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(240, Math.round(rect.width));
    const H = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const view = computeZoomView(zoom, clusterOn);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    // 按当前视口缩放绘制海湾与四区柔和底图
    const mapPt = ([u, v]) => [((u - view.minU) / view.span) * W, ((v - view.minV) / view.span) * H];
    ctx.save();
    for (const z of TERRAIN.zones) {
      ctx.beginPath();
      z.poly.forEach((pt, i) => {
        const [x, y] = mapPt(pt);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = z.posterFill;
      ctx.fill();
    }
    ctx.beginPath();
    TERRAIN.seaPoly.forEach((pt, i) => {
      const [x, y] = mapPt(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = PALETTE.sea;
    ctx.fill();
    ctx.strokeStyle = "#FCF5E8";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 淡街道网格随缩放显出更多细节
    ctx.strokeStyle = "rgba(6, 51, 41, 0.08)";
    ctx.lineWidth = 1;
    const gridN = Math.round(4 + (zoom - 10) * 1.4);
    for (let i = 1; i < gridN; i++) {
      ctx.beginPath(); ctx.moveTo((W / gridN) * i, 0); ctx.lineTo((W / gridN) * i, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (H / gridN) * i); ctx.lineTo(W, (H / gridN) * i); ctx.stroke();
    }
    ctx.restore();

    // 绘制聚合圆徽或单点价格标签
    hitMarkers = [];
    for (const m of view.markers) {
      const x = m.su * W, y = m.sv * H;
      if (m.type === "cluster") {
        const r = Math.min(26, 15 + m.count * 1.8);
        const isHot = m.members.some((p) => p.id === activeId);
        ctx.save();
        ctx.fillStyle = isHot ? PALETTE.ink : m.color;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FEFDF9";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = "#FEFDF9";
        ctx.font = `700 13px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(m.count), x, y);
        ctx.restore();
        hitMarkers.push({ ...m, x, y, r: r + 4 });
      } else {
        const isActive = m.id === activeId;
        ctx.save();
        if (priceChips) {
          const txt = `¥${m.price}`;
          ctx.font = `700 11px "JetBrains Mono", monospace`;
          const tw = ctx.measureText(txt).width + 14;
          const th = 22;
          const rx = x - tw / 2, ry = y - th / 2;
          ctx.fillStyle = isActive ? PALETTE.ink : "#FEFDF9";
          ctx.strokeStyle = isActive ? PALETTE.ink : m.color;
          ctx.lineWidth = isActive ? 2 : 1.6;
          ctx.beginPath();
          ctx.roundRect(rx, ry, tw, th, 11);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = isActive ? "#FEFDF9" : PALETTE.ink;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, x, y + 0.5);
          hitMarkers.push({ ...m, x, y, r: tw * 0.5 });
        } else {
          const r = isActive ? 9 : 6.5;
          ctx.fillStyle = isActive ? PALETTE.ink : m.color;
          ctx.strokeStyle = "#FEFDF9";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          hitMarkers.push({ ...m, x, y, r: 12 });
        }
        ctx.restore();
      }
    }

    // 底部读数更新
    if (zoomLabel) zoomLabel.textContent = `Z${zoom}`;
    if (clusterToggle) {
      clusterToggle.setAttribute("aria-pressed", String(clusterOn));
      clusterToggle.textContent = clusterOn ? "自动聚合：开" : "自动聚合：关（正在过绘制）";
      clusterToggle.classList.toggle("is-warn", !clusterOn && view.collisions > 4);
    }
    if (priceToggle) {
      priceToggle.setAttribute("aria-pressed", String(priceChips));
      priceToggle.textContent = priceChips ? "价格标签：开" : "纯色圆点";
    }
    if (statEl) {
      const verdict =
        view.collisions > 5
          ? `过绘制拥堵：视野内 ${view.projected.length} 个房源在屏幕上发生 ${view.collisions} 处互相遮挡，开启「自动聚合」或放大到 Z14+ 即可解开。`
          : clusterOn && zoom < 14
            ? `聚合生效：把 ${view.projected.length} 个点归并为 ${view.markers.length} 个清晰节点（碰撞降至 ${view.collisions} 处），点击聚合圆圈可直达放大。`
            : `细节就绪：视野聚焦 ${view.projected.length} 个房源，标记碰撞仅 ${view.collisions} 处，悬停或点选列表项即可与地图双向定位。`;
      statEl.textContent = verdict;
      statEl.classList.toggle("is-alert", view.collisions > 5);
    }

    // 渲染与当前视口同步的精简列表（6 条刚好与左侧地图等高收齐）
    const listHtml = view.projected
      .slice(0, 6)
      .map(
        (p) => `
      <button type="button" class="poi-item ${p.id === activeId ? "is-active" : ""}" data-poi-id="${p.id}">
        <span class="poi-dot" style="background:${p.color}"></span>
        <span class="poi-main">
          <strong>${p.name}</strong>
          <small>${p.area} · ${p.score}★</small>
        </span>
        <span class="poi-price">¥${p.price}</span>
      </button>`
      )
      .join("");
    listEl.innerHTML =
      listHtml +
      (view.projected.length > 6
        ? `<p class="poi-more">当前视野共 ${view.projected.length} 处，已列出前 6 处（放大地图自动收窄）</p>`
        : "");
  }

  slider.addEventListener("input", () => {
    zoom = Number(slider.value);
    drawZoomMap();
  });
  if (clusterToggle) {
    clusterToggle.addEventListener("click", () => {
      clusterOn = !clusterOn;
      drawZoomMap();
    });
  }
  if (priceToggle) {
    priceToggle.addEventListener("click", () => {
      priceChips = !priceChips;
      drawZoomMap();
    });
  }

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-poi-id]");
    if (!btn) return;
    activeId = btn.dataset.poiId;
    drawZoomMap();
  });
  listEl.addEventListener("pointerover", (e) => {
    const btn = e.target.closest("[data-poi-id]");
    if (!btn || activeId === btn.dataset.poiId) return;
    activeId = btn.dataset.poiId;
    drawZoomMap();
  });

  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = hitMarkers.find((m) => Math.hypot(x - m.x, y - m.y) <= m.r + 6);
    if (!hit) return;
    if (hit.type === "cluster") {
      zoom = Math.min(16, zoom + 2);
      slider.value = String(zoom);
      activeId = hit.members[0].id;
    } else {
      activeId = hit.id;
    }
    drawZoomMap();
  });

  window.addEventListener("resize", drawZoomMap);
  drawZoomMap();
}

// ==================== 03 拓扑 vs 实距连续形变画布（深松夜航暗室） ====================
export function mountTopoMorph() {
  const canvas = document.getElementById("topoCanvas");
  const slider = document.getElementById("topoSlider");
  const valEl = document.getElementById("topoMorphVal");
  const gapEl = document.getElementById("topoGapVal");
  const overlapEl = document.getElementById("topoOverlapVal");
  const noteEl = document.getElementById("topoNote");
  const presets = [...document.querySelectorAll("[data-topo-preset]")];
  if (!canvas || !slider) return;

  const ctx = canvas.getContext("2d");
  let targetMorph = 0; // 开场为 0% 地理实距，展示市中心 4 站挤作一团
  let currentMorph = 0;
  let topoDirty = true;

  function draw(_t, dt, { still }) {
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(260, Math.round(rect.width));
    const H = Math.max(220, Math.round(rect.height));
    const dpr = pixelRatio(W < 520 ? 1.5 : 2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      topoDirty = true;
    }

    const settled = Math.abs(targetMorph - currentMorph) < 0.002;
    if (!topoDirty && settled && dt > 0 && !still) return;
    topoDirty = false;

    if (still || dt === 0) currentMorph = targetMorph;
    else currentMorph += (targetMorph - currentMorph) * Math.min(1, dt * 10);
    if (Math.abs(targetMorph - currentMorph) < 0.002) currentMorph = targetMorph;

    const data = interpolateTopo(currentMorph, W, H);
    const byId = Object.fromEntries(data.pts.map((p) => [p.id, p]));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PALETTE.nightBg;
    ctx.fillRect(0, 0, W, H);

    // 45°/90° 贝克示意辅助网格随 morph 显影
    ctx.save();
    ctx.strokeStyle = `rgba(92, 224, 189, ${0.06 + currentMorph * 0.10})`;
    ctx.lineWidth = 1;
    const step = Math.max(32, Math.round(W / 14));
    for (let x = step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 弯曲真实河岸随 morph 渐直为水平线
    ctx.strokeStyle = `rgba(160, 215, 207, ${0.32 - currentMorph * 0.12})`;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, H * (0.64 - currentMorph * 0.04));
    ctx.bezierCurveTo(
      W * 0.30, H * (0.44 + currentMorph * 0.16),
      W * 0.65, H * (0.78 - currentMorph * 0.18),
      W, H * (0.58 + currentMorph * 0.02)
    );
    ctx.stroke();

    // 市中心放大示意虚圈
    ctx.strokeStyle = currentMorph < 0.4 ? "rgba(255, 133, 122, 0.55)" : "rgba(92, 224, 189, 0.45)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(W * 0.50, H * 0.50, W * (0.14 + currentMorph * 0.12), H * (0.14 + currentMorph * 0.10), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(247, 241, 227, 0.72)";
    ctx.font = `600 10.5px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      currentMorph < 0.4 ? "真实比例市中心（4 站挤在一起）" : "拓扑放大核心区（牺牲实距换清晰换乘）",
      W * 0.50,
      H * (0.50 - 0.18 - currentMorph * 0.10)
    );
    ctx.restore();

    // 两条轨道线路
    for (const line of TOPO_LINES) {
      ctx.save();
      ctx.beginPath();
      line.stops.forEach((sid, idx) => {
        const p = byId[sid];
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }

    // 8 个站点与站名
    const compact = W < 440;
    for (const p of data.pts) {
      ctx.save();
      const isTransfer = p.line === "AB";
      ctx.fillStyle = "#08241E";
      ctx.strokeStyle = isTransfer ? "#FFFFFF" : p.line === "A" ? "#5CE0BD" : "#F7B733";
      ctx.lineWidth = isTransfer ? 3.2 : 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isTransfer ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 站名
      const below = p.id === "s4" || p.id === "s5" || p.id === "s6";
      ctx.fillStyle = p.core && data.labelOverlaps > 0 ? "#FF857A" : "#F7F1E3";
      ctx.font = `600 ${compact ? 10.5 : 12}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.name, p.x, below ? p.y + 19 : p.y - 13);
      ctx.restore();
    }

    // 同步指标读数
    const pct = Math.round(currentMorph * 100);
    if (valEl) valEl.textContent = `${pct}%`;
    if (gapEl) gapEl.textContent = `${data.minCoreGap} px`;
    if (overlapEl) {
      overlapEl.textContent = data.labelOverlaps > 0 ? `${data.labelOverlaps} 处撞字` : "0 处撞字";
      overlapEl.classList.toggle("is-warn", data.labelOverlaps > 0);
    }
    if (noteEl) {
      noteEl.textContent =
        pct < 30
          ? "地理实距模式：郊区拉得很长，但市中心 4 个换乘站缩成一团，站名彼此撞车。"
          : pct < 75
            ? "轻度规整模式：保留大体方位感的同时轻轻撑开市中心，兼顾导览与认路。"
            : "贝克拓扑模式：全线收束为水平、垂直与 45° 斜线，核心换乘间距成倍放大，撞字彻底归零。";
    }
  }

  const ctrl = loop(canvas, draw);
  slider.addEventListener("input", () => {
    targetMorph = Number(slider.value) / 100;
    topoDirty = true;
    presets.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.topoPreset) === Number(slider.value)));
    ctrl.draw();
  });
  for (const btn of presets) {
    btn.addEventListener("click", () => {
      const v = Number(btn.dataset.topoPreset);
      slider.value = String(v);
      targetMorph = v / 100;
      topoDirty = true;
      presets.forEach((b) => b.classList.toggle("is-active", b === btn));
      ctrl.draw();
    });
  }
  window.addEventListener("resize", () => { topoDirty = true; ctrl.draw(); });
}

// ==================== 04 历史图版切换器（定制矢量标本） ====================
function lineagePlateSvg(id) {
  if (id === "snow") {
    return `<svg viewBox="0 0 360 200" aria-hidden="true">
      <rect width="360" height="200" fill="#FBF5E8"/>
      <g stroke="#CFC6B4" stroke-width="6">
        <line x1="20" y1="68" x2="340" y2="54"/><line x1="20" y1="138" x2="340" y2="128"/>
        <line x1="110" y1="16" x2="96" y2="186"/><line x1="230" y1="16" x2="246" y2="186"/>
      </g>
      <circle cx="176" cy="96" r="10" fill="#C0322B"/>
      <circle cx="176" cy="96" r="26" fill="none" stroke="#C0322B" stroke-dasharray="4 3" stroke-width="1.6"/>
      <g fill="#063329">
        <rect x="150" y="64" width="6" height="16"/><rect x="159" y="56" width="6" height="24"/>
        <rect x="168" y="46" width="6" height="32"/><rect x="184" y="52" width="6" height="26"/>
        <rect x="193" y="62" width="6" height="18"/><rect x="164" y="114" width="6" height="20"/>
        <rect x="174" y="116" width="6" height="24"/><rect x="184" y="114" width="6" height="18"/>
        <rect x="122" y="76" width="5" height="9"/><rect x="256" y="112" width="5" height="8"/>
      </g>
      <text x="176" y="164" text-anchor="middle" font-size="11" fill="#063329" font-weight="600">宽街水泵周边病例密集聚簇（示意复原）</text>
    </svg>`;
  }
  if (id === "beck") {
    return `<svg viewBox="0 0 360 200" aria-hidden="true">
      <rect width="360" height="200" fill="#FBF5E8"/>
      <path d="M 36 150 L 96 90 L 244 90 L 304 42" fill="none" stroke="#08756E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 60 44 L 136 120 L 220 120 L 296 158" fill="none" stroke="#E59500" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 180 28 L 180 172" fill="none" stroke="#C0322B" stroke-width="7" stroke-linecap="round"/>
      <g fill="#FEFDF9" stroke="#063329" stroke-width="2.5">
        <circle cx="180" cy="90" r="7"/><circle cx="180" cy="120" r="7"/><circle cx="106" cy="90" r="5"/>
        <circle cx="244" cy="90" r="5"/><circle cx="136" cy="120" r="5"/><circle cx="220" cy="120" r="5"/>
      </g>
      <text x="180" y="190" text-anchor="middle" font-size="11" fill="#063329" font-weight="600">水平 · 垂直 · 45° 拓扑换乘网格</text>
    </svg>`;
  }
  if (id === "bertin") {
    return `<svg viewBox="0 0 360 200" aria-hidden="true">
      <rect width="360" height="200" fill="#FBF5E8"/>
      <text x="26" y="42" font-size="11" fill="#063329" font-weight="700">尺寸 / 明度 → 表达主次与大小</text>
      <circle cx="52" cy="76" r="18" fill="#063329"/><circle cx="106" cy="76" r="12" fill="#08756E"/>
      <circle cx="148" cy="76" r="8" fill="#4FA8A0"/><circle cx="180" cy="76" r="5" fill="#A0D7CF"/>
      <text x="26" y="132" font-size="11" fill="#063329" font-weight="700">低饱和色相 → 表达并列区域分组</text>
      <rect x="28" y="144" width="66" height="28" rx="6" fill="#A0D7CF"/>
      <rect x="104" y="144" width="66" height="28" rx="6" fill="#D6DFC2"/>
      <rect x="180" y="144" width="66" height="28" rx="6" fill="#F4E7CF"/>
      <rect x="256" y="144" width="66" height="28" rx="6" fill="#E2DAD5"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 360 200" aria-hidden="true">
    <rect width="360" height="200" fill="#FBF5E8"/>
    <g stroke="#08756E" stroke-opacity="0.28" fill="#EEF6F2">
      <rect x="30" y="24" width="74" height="62"/><rect x="104" y="24" width="74" height="62"/>
      <rect x="178" y="24" width="74" height="62"/><rect x="252" y="24" width="74" height="62"/>
      <rect x="30" y="86" width="74" height="62"/><rect x="104" y="86" width="74" height="62" fill="#A0D7CF"/>
      <rect x="178" y="86" width="74" height="62" fill="#D6DFC2"/><rect x="252" y="86" width="74" height="62" fill="#F4E7CF"/>
    </g>
    <rect x="96" y="72" width="168" height="86" rx="8" fill="none" stroke="#063329" stroke-width="2.4" stroke-dasharray="6 4"/>
    <circle cx="178" cy="114" r="9" fill="#08756E"/>
    <text x="180" y="180" text-anchor="middle" font-size="11" fill="#063329" font-weight="600">256×256 异步瓦片 + 自由拖拽视口</text>
  </svg>`;
}

export function mountLineage() {
  const tabs = [...document.querySelectorAll("[data-lineage-id]")];
  const panel = document.getElementById("lineagePanel");
  if (!tabs.length || !panel) return;

  function render(id) {
    const item = LINEAGE_ITEMS.find((x) => x.id === id) || LINEAGE_ITEMS[0];
    tabs.forEach((b) => {
      const on = b.dataset.lineageId === item.id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    panel.innerHTML = `
      <div class="lineage-plate">${lineagePlateSvg(item.id)}</div>
      <div class="lineage-body">
        <div class="lineage-meta"><span>${item.year}</span> · <span>${item.who}</span></div>
        <h3>${item.work}</h3>
        <p class="lineage-source">${item.source}</p>
        <p>${item.summary}</p>
        <p class="lineage-legacy">${item.legacy}</p>
      </div>`;
  }

  tabs.forEach((b) => b.addEventListener("click", () => render(b.dataset.lineageId)));
  render(LINEAGE_ITEMS[0].id);
}

// ==================== 05 什么时候别用：翻牌分流仪 ====================
export function mountNotUseTriage() {
  const host = document.getElementById("triageGrid");
  if (!host) return;
  const answers = {};

  function render() {
    host.innerHTML = NOT_USE_CASES.map((c) => {
      const picked = answers[c.id];
      const revealed = picked !== undefined;
      const right = revealed && picked === c.shouldUseMap;
      const links = c.siblingLinks
        .map(
          (l) => `<a href="https://layout.xiaoxiaodong.ai/${l.id}/play/" target="_blank" rel="noopener">${l.label}</a>`
        )
        .join("、");
      return `
        <article class="triage-card ${revealed ? (c.shouldUseMap ? "is-map" : "is-alt") : ""}">
          <div class="triage-scene">${c.scene}</div>
          <h3>${c.title}</h3>
          <div class="triage-btns">
            <button type="button" class="btn-chip ${picked === true ? "is-picked" : ""}" data-triage-id="${c.id}" data-choice="yes">适合地图主导</button>
            <button type="button" class="btn-chip ${picked === false ? "is-picked" : ""}" data-triage-id="${c.id}" data-choice="no">应换别的布局</button>
          </div>
          ${
            revealed
              ? `<div class="triage-result ${right ? "is-right" : "is-wrong"}">
                   <strong>${right ? "判断准确" : "换个思路"} · ${c.verdict}</strong>
                   <p>${c.reason}</p>
                   <p class="triage-links">推荐去处：${links}</p>
                 </div>`
              : `<p class="triage-placeholder">先凭直觉选一侧，揭晓判断依据与对应布局方案。</p>`
          }
        </article>`;
    }).join("");
  }

  host.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-triage-id]");
    if (!btn) return;
    answers[btn.dataset.triageId] = btn.dataset.choice === "yes";
    render();
  });
  render();
}

// ==================== 06 单变量微型地图辨析小练习 ====================
function quizThumbSvg(kind) {
  // 统一底图骨架（海湾 + 三区），每道题严格只改变题目指定的唯一变量
  const calmBase = `
    <rect width="220" height="140" fill="#FCF5E8"/>
    <path d="M18,22 L106,12 L92,68 L74,88 L18,86 Z" fill="#A0D7CF"/>
    <path d="M106,12 L202,22 L202,72 L92,68 Z" fill="#D6DFC2"/>
    <path d="M92,68 L202,72 L198,128 L74,126 L74,88 Z" fill="#F4E7CF"/>
    <path d="M18,86 L74,88 L74,126 L22,120 Z" fill="#E2DAD5"/>`;

  const pins = [
    { x: 66, y: 54, c: "#028E93" },
    { x: 148, y: 36, c: "#49763F" },
    { x: 158, y: 92, c: "#E59500" },
    { x: 52, y: 102, c: "#5A5466" },
  ];
  const hub = { x: 112, y: 74 };

  const radialRoutes = pins
    .map((p) => `<line x1="${hub.x}" y1="${hub.y}" x2="${p.x}" y2="${p.y}" stroke="${p.c}" stroke-width="2" stroke-dasharray="4 3"/>`)
    .join("");
  const drawPins =
    pins.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${p.c}" stroke="#FFF" stroke-width="1.6"/>`).join("") +
    `<circle cx="${hub.x}" cy="${hub.y}" r="8.5" fill="#063329" stroke="#FFF" stroke-width="2"/>`;

  // 题 1：仅改注释卡片位置与引线（四项全部用同等中性青墨描边，绝不提前用红线泄露答案）
  if (kind.startsWith("cards-")) {
    let cards = "";
    if (kind === "cards-left-stack") {
      const ys = [16, 46, 76, 106];
      cards = pins
        .map((p, i) => `
          <line x1="48" y1="${ys[i] + 10}" x2="${p.x}" y2="${p.y}" stroke="#063329" stroke-opacity="0.55" stroke-width="1.25"/>
          <rect x="6" y="${ys[i]}" width="42" height="20" rx="4" fill="#FEFDF9" stroke="#063329" stroke-opacity="0.38" stroke-width="1.15"/>
          <rect x="11" y="${ys[i] + 6}" width="26" height="3" rx="1" fill="#063329"/>
          <rect x="11" y="${ys[i] + 12}" width="18" height="2.5" rx="1" fill="#6A807A"/>`)
        .join("");
    } else if (kind === "cards-near") {
      const pos = [[18, 16], [164, 14], [166, 104], [12, 112]];
      cards = pins
        .map((p, i) => `
          <line x1="${pos[i][0] + 22}" y1="${pos[i][1] + 10}" x2="${p.x}" y2="${p.y}" stroke="#063329" stroke-opacity="0.55" stroke-width="1.25"/>
          <rect x="${pos[i][0]}" y="${pos[i][1]}" width="44" height="20" rx="4" fill="#FEFDF9" stroke="#063329" stroke-opacity="0.38" stroke-width="1.15"/>
          <rect x="${pos[i][0] + 6}" y="${pos[i][1] + 6}" width="28" height="3" rx="1" fill="#063329"/>
          <rect x="${pos[i][0] + 6}" y="${pos[i][1] + 12}" width="18" height="2.5" rx="1" fill="#6A807A"/>`)
        .join("");
    } else if (kind === "cards-on-pin") {
      cards = pins
        .map((p) => `
          <rect x="${p.x - 22}" y="${p.y - 10}" width="44" height="20" rx="4" fill="#FEFDF9" stroke="#063329" stroke-opacity="0.38" stroke-width="1.15"/>
          <rect x="${p.x - 16}" y="${p.y - 4}" width="28" height="3" rx="1" fill="#063329"/>
          <rect x="${p.x - 16}" y="${p.y + 2}" width="18" height="2.5" rx="1" fill="#6A807A"/>`)
        .join("");
    } else {
      // cards-swapped: 顺时针错位指向
      const pos = [[164, 14], [166, 104], [12, 112], [18, 16]];
      cards = pins
        .map((p, i) => `
          <line x1="${pos[i][0] + 22}" y1="${pos[i][1] + 10}" x2="${p.x}" y2="${p.y}" stroke="#063329" stroke-opacity="0.55" stroke-width="1.25"/>
          <rect x="${pos[i][0]}" y="${pos[i][1]}" width="44" height="20" rx="4" fill="#FEFDF9" stroke="#063329" stroke-opacity="0.38" stroke-width="1.15"/>
          <rect x="${pos[i][0] + 6}" y="${pos[i][1] + 6}" width="28" height="3" rx="1" fill="#063329"/>
          <rect x="${pos[i][0] + 6}" y="${pos[i][1] + 12}" width="18" height="2.5" rx="1" fill="#6A807A"/>`)
        .join("");
    }
    return `<svg viewBox="0 0 220 140" aria-hidden="true">${calmBase}${radialRoutes}${drawPins}${cards}</svg>`;
  }

  // 题 2：仅改区域配色策略
  if (kind.startsWith("color-")) {
    let base = calmBase;
    if (kind === "color-7loud") {
      base = `
        <rect width="220" height="140" fill="#FCF5E8"/>
        <path d="M18,22 L106,12 L92,68 L74,88 L18,86 Z" fill="#00C7BE"/>
        <path d="M106,12 L158,17 L148,68 L92,68 Z" fill="#32D74B"/>
        <path d="M158,17 L202,22 L202,72 L148,68 Z" fill="#FF2D55"/>
        <path d="M92,68 L148,68 L144,126 L74,126 L74,88 Z" fill="#FFD60A"/>
        <path d="M148,68 L202,72 L198,128 L144,126 Z" fill="#FF9F0A"/>
        <path d="M18,86 L74,88 L50,124 L22,120 Z" fill="#BF5AF2"/>
        <path d="M50,124 L74,88 L74,126 Z" fill="#0A84FF"/>`;
    } else if (kind === "color-mono") {
      base = `
        <rect width="220" height="140" fill="#FCF5E8"/>
        <path d="M18,22 L106,12 L202,22 L198,128 L22,120 Z" fill="#DCDCD8"/>`;
    } else if (kind === "color-dark-clash") {
      base = `
        <rect width="220" height="140" fill="#0E1D2A"/>
        <path d="M18,22 L106,12 L92,68 L74,88 L18,86 Z" fill="#10364D"/>
        <path d="M106,12 L202,22 L202,72 L92,68 Z" fill="#173D2B"/>
        <path d="M92,68 L202,72 L198,128 L74,126 L74,88 Z" fill="#3B2E14"/>
        <path d="M18,86 L74,88 L74,126 L22,120 Z" fill="#292438"/>`;
    }
    return `<svg viewBox="0 0 220 140" aria-hidden="true">${base}${radialRoutes}${drawPins}</svg>`;
  }

  // 题 3：仅改路径连接结构
  let routes = radialRoutes;
  if (kind === "route-mesh") {
    const all = [hub, ...pins];
    const segs = [];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        segs.push(`<line x1="${all[i].x}" y1="${all[i].y}" x2="${all[j].x}" y2="${all[j].y}" stroke="#08756E" stroke-width="1.8" stroke-dasharray="4 3"/>`);
      }
    }
    routes = segs.join("");
  } else if (kind === "route-cross2") {
    routes = `
      <path d="M${hub.x},${hub.y} Q 124,108 ${pins[0].x},${pins[0].y}" fill="none" stroke="${pins[0].c}" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M${hub.x},${hub.y} Q 186,78 ${pins[1].x},${pins[1].y}" fill="none" stroke="${pins[1].c}" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M${hub.x},${hub.y} Q 140,42 ${pins[2].x},${pins[2].y}" fill="none" stroke="${pins[2].c}" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M${hub.x},${hub.y} Q 74,48 ${pins[3].x},${pins[3].y}" fill="none" stroke="${pins[3].c}" stroke-width="2" stroke-dasharray="4 3"/>`;
  } else if (kind === "route-none") {
    routes = "";
  }
  return `<svg viewBox="0 0 220 140" aria-hidden="true">${calmBase}${routes}${drawPins}</svg>`;
}

export function mountQuiz() {
  const host = document.getElementById("quizHost");
  if (!host) return;
  let idx = 0;
  const picks = {};

  function render() {
    const q = QUIZ_ITEMS[idx];
    const picked = picks[q.id];
    const answeredCount = Object.keys(picks).length;
    const score = QUIZ_ITEMS.filter((item) => picks[item.id] === item.answer).length;
    const optObj = q.options.find((o) => o.key === picked);
    const rightObj = q.options.find((o) => o.key === q.answer);

    host.innerHTML = `
      <div class="quiz-head">
        <div class="quiz-steps">
          ${QUIZ_ITEMS.map(
            (item, i) => `
            <button type="button" class="quiz-step ${i === idx ? "is-current" : ""} ${
              picks[item.id] ? (picks[item.id] === item.answer ? "is-ok" : "is-bad") : ""
            }" data-quiz-step="${i}">第 ${i + 1} 题</button>`
          ).join("")}
        </div>
        <span class="quiz-var">${q.variable}</span>
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-options">
        ${q.options
          .map((o) => {
            const cls =
              picked === undefined
                ? ""
                : o.key === q.answer
                  ? "is-correct"
                  : o.key === picked
                    ? "is-wrong"
                    : "is-dim";
            return `
            <button type="button" class="quiz-opt ${cls}" data-quiz-pick="${o.key}">
              <span class="quiz-thumb">${quizThumbSvg(o.kind)}</span>
              <span class="quiz-opt-label">${o.label}</span>
            </button>`;
          })
          .join("")}
      </div>
      <div class="quiz-feedback ${picked ? (picked === q.answer ? "is-ok" : "is-bad") : ""}">
        ${
          picked
            ? `<strong>${picked === q.answer ? `答对了（${q.answer}）` : `选了 ${picked}，更稳妥的是 ${q.answer}`}</strong>
               <p>${optObj.explain}${picked !== q.answer ? ` 正确做法 ${q.answer}：${rightObj.explain}` : ""}</p>
               <div class="quiz-actions">
                 ${idx < QUIZ_ITEMS.length - 1 ? `<button type="button" class="btn-solid" data-quiz-next>下一题</button>` : ""}
                 ${answeredCount === QUIZ_ITEMS.length ? `<span class="quiz-score">本轮答对 ${score} / ${QUIZ_ITEMS.length} 题</span><button type="button" class="btn-ghost" data-quiz-reset>重新测一次</button>` : ""}
               </div>`
            : `<p>四张图只差这一个变量，点选你认为视觉最清楚的一版。</p>`
        }
      </div>`;
  }

  host.addEventListener("click", (e) => {
    const pickBtn = e.target.closest("[data-quiz-pick]");
    if (pickBtn) {
      picks[QUIZ_ITEMS[idx].id] = pickBtn.dataset.quizPick;
      render();
      return;
    }
    const stepBtn = e.target.closest("[data-quiz-step]");
    if (stepBtn) {
      idx = Number(stepBtn.dataset.quizStep);
      render();
      return;
    }
    if (e.target.closest("[data-quiz-next]")) {
      idx = Math.min(QUIZ_ITEMS.length - 1, idx + 1);
      render();
      return;
    }
    if (e.target.closest("[data-quiz-reset]")) {
      Object.keys(picks).forEach((k) => delete picks[k]);
      idx = 0;
      render();
    }
  });

  render();
}

// ==================== 07 原海报灯箱（放大、拖动、Esc 关闭） ====================
export function mountPosterLightbox() {
  const trigger = document.getElementById("posterOpenBtn");
  const posterImg = document.getElementById("poster");
  const dialog = document.getElementById("posterLightbox");
  const lightImg = document.getElementById("lightboxImg");
  const stage = document.getElementById("lightboxStage");
  const zoomIn = document.getElementById("lbZoomIn");
  const zoomOut = document.getElementById("lbZoomOut");
  const zoomReset = document.getElementById("lbZoomReset");
  const closeBtn = document.getElementById("lbClose");
  if (!posterImg || !dialog || !lightImg || !stage) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = null;

  function applyTransform() {
    lightImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
  function open() {
    lightImg.src = posterImg.src;
    scale = 1.25;
    tx = 0;
    ty = 0;
    applyTransform();
    dialog.hidden = false;
    closeBtn?.focus();
  }
  function close() {
    dialog.hidden = true;
    trigger?.focus();
  }

  trigger?.addEventListener("click", open);
  posterImg.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) close();
  });

  zoomIn?.addEventListener("click", () => { scale = Math.min(3, scale + 0.35); applyTransform(); });
  zoomOut?.addEventListener("click", () => { scale = Math.max(0.8, scale - 0.35); applyTransform(); });
  zoomReset?.addEventListener("click", () => { scale = 1.25; tx = 0; ty = 0; applyTransform(); });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target !== lightImg) return;
    dragging = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
    try { lightImg.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== dragging.id) return;
    tx = e.clientX - dragging.x;
    ty = e.clientY - dragging.y;
    applyTransform();
  });
  const stop = () => { dragging = null; };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);
}
