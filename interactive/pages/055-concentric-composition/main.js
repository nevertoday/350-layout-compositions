import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  DEFAULT_BROKEN,
  PALETTE,
  SOLUTIONS,
  SPECIMENS,
  WRONG_PRESETS,
  clamp,
  evaluate,
} from "./model.js";

// ==================== 全局状态与缓动 ====================
const state = structuredClone(DEFAULT_BROKEN);

// 用于平滑渲染过渡的当前插值态（单真源逻辑始终读 state，渲染插值贴近 state）
const anim = {
  intro: reducedMotion.matches ? 1 : 0,
  pulse: -1, // >= 0 时播放从外圈向核心收束的「回心波」
  dirty: true,
  hoverRing: -1,
};

// 生成一次性离线微点纹（64×64）与哑光矿石纹（64×64），确保 6× 降速手机也能稳跑 60 帧
function makeStipplePattern(ctx, dotColor, alpha) {
  const tile = document.createElement("canvas");
  tile.width = 64;
  tile.height = 64;
  const g = tile.getContext("2d");
  g.fillStyle = dotColor;
  g.globalAlpha = alpha;
  // 确定性伪随机点纹，还原 055 原海报深墨环里的细腻星尘微粒
  let seed = 55055;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 150; i++) {
    const x = rand() * 64;
    const y = rand() * 64;
    const r = rand() > 0.72 ? 0.95 : 0.55;
    g.fillRect(x, y, r, r);
  }
  return ctx.createPattern(tile, "repeat");
}

// ==================== 1. 开场主角：同心环仪 2D Canvas ====================
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas.getContext("2d");
const stipplePattern = makeStipplePattern(heroCtx, "#EAD7BD", 0.16);
const mattePattern = makeStipplePattern(heroCtx, "#FFFFFF", 0.075);

let heroW = 500;
let heroH = 500;
let heroDpr = 1;

function resizeHero() {
  const rect = heroCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w !== heroW || h !== heroH || dpr !== heroDpr) {
    heroW = w;
    heroH = h;
    heroDpr = dpr;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    anim.dirty = true;
  }
}

// 沿圆弧绘制居中的弧形文字（复刻 055 原海报四段绕环格言）
function drawArcText(ctx, text, cx, cy, radius, centerAngle, flipped, color, font) {
  if (!text || radius < 28) return;
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + 1.5);
  const totalW = widths.reduce((a, b) => a + b, 0);
  const totalAng = totalW / radius;
  // 弧长超过半圆则自动省略，避免挤成一团
  if (totalAng > Math.PI * 0.92) {
    ctx.restore();
    return;
  }
  let cur = flipped ? centerAngle + totalAng / 2 : centerAngle - totalAng / 2;
  for (let i = 0; i < chars.length; i++) {
    const step = widths[i] / radius;
    const ang = flipped ? cur - step / 2 : cur + step / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
    ctx.rotate(ang + (flipped ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    cur += flipped ? -step : step;
  }
  ctx.restore();
}

function drawHero(audit) {
  const ctx = heroCtx;
  const w = heroW;
  const h = heroH;
  ctx.save();
  ctx.scale(heroDpr, heroDpr);

  // 清空并铺深墨松黑底场
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);

  const cx0 = w * 0.5;
  const cy0 = h * 0.5;
  // 留出一点外轨与弧字空间，maxR 表示归一化半径 1.0 对应的像素
  const maxR = Math.min(w, h) * 0.458;
  const ease = 1 - Math.pow(1 - anim.intro, 3);

  const { geo } = audit;
  const { layers, orbitR, spec } = geo;
  const outerLayer = layers[layers.length - 1];

  // 1) 最外圈细双轨道（055 原海报外圈双线）
  const pxOrbit = orbitR * maxR * ease;
  const pxOuter = outerLayer.rOuter * maxR * ease;
  ctx.save();
  ctx.strokeStyle = audit.metrics.orbitClipped ? "rgba(240,114,104,0.65)" : "rgba(234,215,189,0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx0, cy0, pxOrbit, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([2.5, 4]);
  ctx.strokeStyle = "rgba(234,215,189,0.28)";
  ctx.beginPath();
  ctx.arc(cx0, cy0, pxOuter + (pxOrbit - pxOuter) * 0.48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2) 从最外环向内逐层绘制实体环带（偶数/奇数嵌套遮罩）
  for (let i = layers.length - 1; i >= 1; i--) {
    const L = layers[i];
    const lx = cx0 + L.cx * maxR * ease;
    const ly = cy0 + L.cy * maxR * ease;
    const rOut = L.rOuter * maxR * ease;
    const rIn = L.rInner * maxR * ease;

    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(1, rOut), 0, Math.PI * 2);
    ctx.arc(lx, ly, Math.max(0.5, rIn), 0, Math.PI * 2, true);
    ctx.fillStyle = L.fill;
    ctx.fill("evenodd");

    // 深墨点纹中环或哑光矿石微粒质感
    if (L.isStippled && stipplePattern) {
      ctx.fillStyle = stipplePattern;
      ctx.fill("evenodd");
    } else if (mattePattern) {
      ctx.fillStyle = mattePattern;
      ctx.fill("evenodd");
    }

    // 悬停或高曝提示外描边
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(1, rOut), 0, Math.PI * 2);
    ctx.strokeStyle = L.isGlare
      ? "rgba(240,114,104,0.9)"
      : anim.hoverRing === i
        ? PALETTE.mint
        : "rgba(234,215,189,0.52)";
    ctx.lineWidth = L.isGlare ? 2 : anim.hoverRing === i ? 2 : 1;
    ctx.stroke();

    // 腕表标本刻度 / 圜丘坛石阶放射细缝
    if (state.specimen === "watch" && i === layers.length - 1) {
      ctx.strokeStyle = L.isGlare ? "rgba(17,26,24,0.5)" : "rgba(234,215,189,0.45)";
      for (let t = 0; t < 60; t++) {
        const a = (t / 60) * Math.PI * 2;
        const major = t % 5 === 0;
        const rA = rOut - (major ? 10 : 5);
        ctx.lineWidth = major ? 1.5 : 0.7;
        ctx.beginPath();
        ctx.moveTo(lx + Math.cos(a) * rA, ly + Math.sin(a) * rA);
        ctx.lineTo(lx + Math.cos(a) * (rOut - 2), ly + Math.sin(a) * (rOut - 2));
        ctx.stroke();
      }
    } else if (state.specimen === "altar" && i >= 1) {
      ctx.strokeStyle = L.isGlare ? "rgba(17,26,24,0.28)" : "rgba(234,215,189,0.26)";
      ctx.lineWidth = 0.8;
      const segs = 9 * i;
      for (let s = 0; s < segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(lx + Math.cos(a) * rIn, ly + Math.sin(a) * rIn);
        ctx.lineTo(lx + Math.cos(a) * rOut, ly + Math.sin(a) * rOut);
        ctx.stroke();
      }
    }

    // 深墨点纹中环内的细虚线双轨与弧形字（完全忠实 055 原海报）
    if (L.isStippled && rOut - rIn > 22) {
      const rMid = (rIn + rOut) * 0.5;
      ctx.save();
      ctx.setLineDash([2, 3.5]);
      ctx.strokeStyle = "rgba(234,215,189,0.34)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(lx, ly, rMid, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const fs = Math.max(10, Math.round(w * 0.025));
      drawArcText(
        ctx,
        spec.arcTexts.midTop,
        lx,
        ly,
        rMid,
        -Math.PI / 2,
        false,
        "rgba(234,215,189,0.88)",
        `500 ${fs}px "Noto Sans SC", sans-serif`,
      );
      drawArcText(
        ctx,
        spec.arcTexts.midBot,
        lx,
        ly,
        rMid,
        Math.PI / 2,
        true,
        "rgba(234,215,189,0.85)",
        `500 ${fs}px "Noto Sans SC", sans-serif`,
      );
    }

    // 外环高曝时的画布就地轻提示（放在下方外环正中，绝不与顶部字轨打架）
    if (L.isGlare) {
      const tagY = ly + (rIn + rOut) * 0.5;
      ctx.save();
      const label = "外环过亮抢戏 · 点此压暗";
      ctx.font = `600 ${Math.max(11, Math.round(w * 0.023))}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 16;
      const th = 22;
      ctx.fillStyle = "rgba(16, 26, 31, 0.94)";
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(lx - tw / 2, tagY - th / 2, tw, th, 999);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFACA5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx, tagY + 0.5);
      ctx.restore();
    }

    ctx.restore();
  }

  // 3) 核心圆周围的黑缝护圈与暖米核心圆
  const core = layers[0];
  const kx = cx0 + core.cx * maxR * ease;
  const ky = cy0 + core.cy * maxR * ease;
  const kR = core.rOuter * maxR * ease;
  const gapR = (core.rOuter + geo.coreGap) * maxR * ease;

  ctx.save();
  // 核心与第一环间的深黑护圈
  ctx.beginPath();
  ctx.arc(kx, ky, Math.max(2, gapR), 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.bgDeep;
  ctx.fill();
  ctx.strokeStyle = "rgba(234,215,189,0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 暖米核心实心圆
  ctx.beginPath();
  ctx.arc(kx, ky, Math.max(4, kR), 0, Math.PI * 2);
  ctx.fillStyle = core.fill;
  ctx.fill();
  ctx.strokeStyle = anim.hoverRing === 0 ? PALETTE.mint : "rgba(255,255,255,0.28)";
  ctx.lineWidth = anim.hoverRing === 0 ? 2 : 1;
  ctx.stroke();

  // 核心中英文主标
  const coreTitleFs = Math.max(13, Math.round(kR * 0.44));
  const coreSubFs = Math.max(9.5, Math.round(kR * 0.19));
  ctx.fillStyle = core.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${coreTitleFs}px "Noto Sans SC", sans-serif`;
  ctx.fillText(spec.coreTitle, kx, ky - coreSubFs * 0.58);
  ctx.fillStyle = core.subInk;
  ctx.font = `600 ${coreSubFs}px "Sora", sans-serif`;
  ctx.fillText(spec.coreSub, kx, ky + coreTitleFs * 0.56);
  ctx.restore();

  // 4) 外轨上下弧形字（对应 055 原海报「层层递进，引导视线 / 外延扩展，建立节奏」）
  if (pxOrbit < Math.min(w, h) * 0.495) {
    const outFs = Math.max(10.5, Math.round(w * 0.025));
    drawArcText(
      ctx,
      spec.arcTexts.outTop,
      cx0,
      cy0,
      pxOuter + (pxOrbit - pxOuter) * 0.58,
      -Math.PI / 2,
      false,
      "rgba(234,215,189,0.88)",
      `500 ${outFs}px "Noto Sans SC", sans-serif`,
    );
    drawArcText(
      ctx,
      spec.arcTexts.outBot,
      cx0,
      cy0,
      pxOuter + (pxOrbit - pxOuter) * 0.58,
      Math.PI / 2,
      true,
      "rgba(234,215,189,0.86)",
      `500 ${outFs}px "Noto Sans SC", sans-serif`,
    );
  }

  // 5) 辅助轴线、四向薄荷圆点与脱轴向量标尺
  if (state.showGuides) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(234,215,189,0.28)";
    ctx.lineWidth = 1;
    // 水平 & 垂直正交虚线轴
    ctx.beginPath();
    ctx.moveTo(cx0 - pxOrbit * 1.03, cy0);
    ctx.lineTo(cx0 + pxOrbit * 1.03, cy0);
    ctx.moveTo(cx0, cy0 - pxOrbit * 1.03);
    ctx.lineTo(cx0, cy0 + pxOrbit * 1.03);
    ctx.stroke();
    ctx.setLineDash([]);

    // 四向薄荷圆点（12h, 3h, 6h, 9h — 055 原海报招牌标识）
    const cardinals = [
      [cx0, cy0 - pxOuter],
      [cx0 + pxOuter, cy0],
      [cx0, cy0 + pxOuter],
      [cx0 - pxOuter, cy0],
    ];
    for (const [px, py] of cardinals) {
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = audit.ok ? PALETTE.ok : PALETTE.mint;
      ctx.fill();
      ctx.strokeStyle = PALETTE.bg;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 当圆心偏离时，清楚画出「真圆心十字」到「漂移核心」的红色脱轴连线
    if (audit.metrics.offsetPct >= 4) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(kx, ky);
      ctx.stroke();
      ctx.setLineDash([]);

      // 真圆心小标记
      ctx.beginPath();
      ctx.moveTo(cx0 - 6, cy0);
      ctx.lineTo(cx0 + 6, cy0);
      ctx.moveTo(cx0, cy0 - 6);
      ctx.lineTo(cx0, cy0 + 6);
      ctx.stroke();

      // 偏心数值气泡（落于真圆心外侧，绝不遮挡核心 FOCUS 文字）
      const mx = cx0 - (kx >= cx0 ? 34 : -34);
      const my = cy0 + (ky >= cy0 ? -18 : 20);
      const txt = `偏心 ${audit.metrics.offsetPct}%`;
      ctx.font = `600 11px "IBM Plex Mono", "Noto Sans SC", monospace`;
      const tw = ctx.measureText(txt).width + 12;
      ctx.fillStyle = "rgba(44, 22, 23, 0.95)";
      ctx.strokeStyle = "rgba(240, 114, 104, 0.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2, my - 9, tw, 18, 999);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFACA5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, mx, my);
    }

    // 破边裁切红色警告框（配合 12px 圆角画布，完整清晰展示四边触框截圆）
    if (audit.metrics.outerPct > 94.5) {
      ctx.strokeStyle = PALETTE.warn;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(4, 4, w - 8, h - 8, 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 6) 「回心波」视线收敛演播（按 Space 或按钮触发，从最外轨逐层向核心涌入）
  if (anim.pulse >= 0 && anim.pulse <= 1) {
    const p = anim.pulse;
    const waveR = pxOrbit * (1 - p * 0.92);
    // 若脱轴，波纹随越往内越向偏移核心拉歪，直观暴露失序
    const wx = cx0 + (kx - cx0) * p * p;
    const wy = cy0 + (ky - cy0) * p * p;
    const col = audit.ok ? PALETTE.ok : PALETTE.warn;

    ctx.save();
    ctx.strokeStyle = col;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.95;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(wx, wy, Math.max(4, waveR), 0, Math.PI * 2);
    ctx.stroke();

    // 8 枚视线流珠沿径向向心滑入
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const wobble = audit.ok ? 0 : Math.sin(p * 18 + k * 1.7) * 8;
      const bx = wx + Math.cos(a) * Math.max(4, waveR + wobble);
      const by = wy + Math.sin(a) * Math.max(4, waveR + wobble);
      ctx.beginPath();
      ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

// ==================== 2. 同步 DOM 读数、四圆徽、环层条与微缩目标图 ====================
const dom = {
  mobileStatus: document.getElementById("mobile-status-pill"),
  mobileDiagLine: document.getElementById("mobile-diag-line"),
  mobileFoldDock: document.querySelector(".mobile-fold-dock"),
  mobileOffsetSlider: document.getElementById("mobile-offset-slider"),
  mobileOffsetOut: document.getElementById("mobile-offset-out"),
  hudMetrics: document.getElementById("hud-metrics"),
  rackTier: document.getElementById("rack-tier"),
  layerRows: document.getElementById("layer-rows"),
  diagCard: document.getElementById("diag-card"),
  diagPill: document.getElementById("diag-pill"),
  diagTitle: document.getElementById("diag-title"),
  diagBody: document.getElementById("diag-body"),
  diagNext: document.getElementById("diag-next"),
  ctrlOffset: document.getElementById("ctrl-offset"),
  outOffset: document.getElementById("out-offset"),
  ctrlRhythm: document.getElementById("ctrl-rhythm"),
  outRhythm: document.getElementById("out-rhythm"),
  ctrlOuter: document.getElementById("ctrl-outer"),
  outOuter: document.getElementById("out-outer"),
  btnGlare: document.getElementById("btn-glare"),
  btnGuides: document.getElementById("btn-guides"),
  brMid: document.getElementById("br-mid"),
  brCoral: document.getElementById("br-coral"),
  brCore: document.getElementById("br-core"),
  miniTargetRings: document.getElementById("mini-target-rings"),
  emCenterDot: document.getElementById("em-center-dot"),
  emBalanceDisc: document.getElementById("em-balance-disc"),
  emEnclosureRing: document.getElementById("em-enclosure-ring"),
};

let lastAudit = null;

function syncUI() {
  const audit = evaluate(state);
  lastAudit = audit;
  const m = audit.metrics;

  // 状态胶囊
  for (const pill of [dom.diagPill, dom.mobileStatus]) {
    pill.textContent = audit.shortTag;
    pill.classList.toggle("is-ok", audit.ok);
    pill.classList.toggle("is-bad", !audit.ok);
  }
  dom.diagCard.classList.toggle("is-ok", audit.ok);
  dom.mobileFoldDock.classList.toggle("is-ok", audit.ok);

  dom.diagTitle.textContent = audit.headline;
  dom.diagBody.textContent = audit.body;
  dom.diagNext.textContent = audit.nextStep;
  dom.mobileDiagLine.textContent = audit.headline;
  dom.rackTier.textContent = `聚势：${audit.focusTier}（示意）`;
  dom.hudMetrics.textContent = `OFFSET ${m.offsetPct}% · RATIO ${m.bandRatio.toFixed(1)}× · ${m.layerCount} LAYERS`;

  // 滑杆同步
  const oxPct = Math.round(state.offsetX * 100);
  const oxStr = `${oxPct > 0 ? "+" : ""}${oxPct}%`;
  dom.ctrlOffset.value = String(oxPct);
  dom.outOffset.textContent = oxStr;
  dom.mobileOffsetSlider.value = String(oxPct);
  dom.mobileOffsetOut.textContent = oxStr;

  const rhyPct = Math.round(state.rhythmBias * 100);
  dom.ctrlRhythm.value = String(rhyPct);
  dom.outRhythm.textContent = `${rhyPct > 0 ? "+" : ""}${rhyPct}%`;

  const outPct = Math.round(state.outerR * 100);
  dom.ctrlOuter.value = String(outPct);
  dom.outOuter.textContent = `${outPct}%`;

  // 层数按钮高亮
  document.querySelectorAll("#layer-count-btns .cnt-btn").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.count) === m.layerCount);
  });

  // 外环高曝开关
  dom.btnGlare.classList.toggle("is-on", state.outerGlare);
  dom.btnGlare.setAttribute("aria-pressed", String(state.outerGlare));
  dom.btnGlare.textContent = state.outerGlare ? "外环夺焦：开" : "外环夺焦：关";

  // 标本按钮高亮
  document.querySelectorAll("[data-specimen]").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.specimen === state.specimen);
  });

  // 左侧物理环层条（直接显示实绘层宽）
  dom.layerRows.innerHTML = audit.geo.layers
    .map((L) => {
      const wPct = Math.round(L.width * 100);
      const roleTag = L.isGlare
        ? "过亮抢戏·点此压暗"
        : L.kind === "core"
          ? `半径 ${wPct}%`
          : `环宽 ${wPct}%`;
      return `<button type="button" class="layer-row${L.isGlare ? " is-glare" : ""}" data-layer-idx="${L.index}">
        <span class="layer-swatch" style="background:${L.fill}"></span>
        <span>${L.index + 1}. ${L.label}</span>
        <span class="layer-val">${roleTag}</span>
      </button>`;
    })
    .join("");

  // 自示范标题小徽实时映射偏心度
  const shiftX = state.offsetX * 26;
  const shiftY = state.offsetY * 26;
  dom.brMid.setAttribute("cx", (28 + shiftX * 0.45).toFixed(1));
  dom.brMid.setAttribute("cy", (28 + shiftY * 0.45).toFixed(1));
  dom.brCoral.setAttribute("cx", (28 + shiftX * 0.75).toFixed(1));
  dom.brCoral.setAttribute("cy", (28 + shiftY * 0.75).toFixed(1));
  dom.brCore.setAttribute("cx", (28 + shiftX).toFixed(1));
  dom.brCore.setAttribute("cy", (28 + shiftY).toFixed(1));

  // 底部四枚圆形原海报徽标实时同步
  for (const c of audit.checks) {
    const item = document.getElementById(`emblem-${c.key}`);
    const st = document.getElementById(`em-state-${c.key}`);
    if (item) item.classList.toggle("is-ok", c.ok);
    if (st) st.textContent = c.badge;
  }
  dom.emCenterDot.setAttribute("cx", (32 + state.offsetX * 28).toFixed(1));
  dom.emCenterDot.setAttribute("cy", (32 + state.offsetY * 28).toFixed(1));
  dom.emCenterDot.setAttribute("fill", audit.checks[0].ok ? PALETTE.ok : PALETTE.warn);
  dom.emEnclosureRing.setAttribute("stroke", state.outerGlare ? "#E8F6EC" : PALETTE.coral);
  const tilt = clamp(state.offsetX * 65, -24, 24);
  dom.emBalanceDisc.setAttribute("transform", `rotate(${tilt.toFixed(1)} 32 32)`);

  // 底部右侧微缩同心目标图镜像实时几何
  const svgParts = [];
  for (let i = audit.geo.layers.length - 1; i >= 0; i--) {
    const L = audit.geo.layers[i];
    const r = Math.max(3, Math.min(45, L.rOuter * 43));
    const cx = 50 + L.cx * 40;
    const cy = 50 + L.cy * 40;
    if (i === 0) {
      svgParts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.min(7, r * 0.6).toFixed(1)}" fill="${audit.ok ? PALETTE.ok : PALETTE.mint}" />`,
      );
    } else {
      svgParts.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${L.isGlare ? PALETTE.warn : "rgba(234,215,189,0.72)"}" stroke-width="${L.isGlare ? 1.8 : 1.1}" />`,
      );
    }
  }
  dom.miniTargetRings.innerHTML = svgParts.join("");

  anim.dirty = true;
}

// ==================== 3. 画布直接拖拽、点击与键盘交互 ====================
let dragInfo = null;

function canvasNormCoords(e) {
  const rect = heroCanvas.getBoundingClientRect();
  const maxR = Math.min(rect.width, rect.height) * 0.458;
  const nx = (e.clientX - (rect.left + rect.width / 2)) / maxR;
  const ny = (e.clientY - (rect.top + rect.height / 2)) / maxR;
  return { nx, ny, px: e.clientX - rect.left, py: e.clientY - rect.top };
}

function hitTestLayer(nx, ny) {
  const { layers } = evaluate(state).geo;
  const core = layers[0];
  const dCore = Math.hypot(nx - core.cx, ny - core.cy);
  // 命中核心区域 → 拖动圆心共轴对齐
  if (dCore <= core.rOuter + 0.05) return { mode: "axis", ringIndex: 0 };

  // 命中某一环带外缘 → 径向雕琢该环边界半径
  for (let i = 1; i < layers.length; i++) {
    const L = layers[i];
    const d = Math.hypot(nx - L.cx, ny - L.cy);
    if (Math.abs(d - L.rOuter) <= 0.06) {
      return { mode: i === layers.length - 1 ? "outerR" : "rim", ringIndex: i };
    }
  }
  // 落在最外环体内部 → 可点击压暗眩光，或横向拖拽同样顺滑校准圆心
  const outer = layers[layers.length - 1];
  const dOut = Math.hypot(nx - outer.cx, ny - outer.cy);
  if (dOut >= outer.rInner && dOut <= outer.rOuter) {
    return { mode: "axis", ringIndex: layers.length - 1, clickedOuter: true };
  }
  // 空白区横拖 → 默认微调同心圆心，保证任意起点横滑都有丝滑响应
  return { mode: "axis", ringIndex: 0 };
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const { nx, ny } = canvasNormCoords(e);
  const hit = hitTestLayer(nx, ny);
  dragInfo = {
    pointerId: e.pointerId,
    pointerType: e.pointerType,
    startClientX: e.clientX,
    startClientY: e.clientY,
    startNx: nx,
    startNy: ny,
    moved: 0,
    ...hit,
    initOffsetX: state.offsetX,
    initOffsetY: state.offsetY,
    initOuterR: state.outerR,
    initNudge: hit.ringIndex >= 1 ? state.ringNudges[hit.ringIndex - 1] || 0 : 0,
    initR: Math.hypot(nx, ny),
  };
  heroCanvas.setPointerCapture(e.pointerId);
});

heroCanvas.addEventListener("pointermove", (e) => {
  const { nx, ny } = canvasNormCoords(e);
  if (!dragInfo) {
    const hit = hitTestLayer(nx, ny);
    const nextHover = hit.ringIndex;
    if (nextHover !== anim.hoverRing) {
      anim.hoverRing = nextHover;
      anim.dirty = true;
    }
    return;
  }
  if (e.pointerId !== dragInfo.pointerId) return;
  const dx = e.clientX - dragInfo.startClientX;
  const dy = e.clientY - dragInfo.startClientY;
  dragInfo.moved = Math.max(dragInfo.moved, Math.hypot(dx, dy));

  const dnx = nx - dragInfo.startNx;
  const dny = ny - dragInfo.startNy;

  if (dragInfo.mode === "axis") {
    let nextX = clamp(dragInfo.initOffsetX + dnx, -0.32, 0.32);
    // 触屏单指横滑时同步收敛轻微纵向偏心，方便手机一拖到位
    let nextY =
      dragInfo.pointerType === "touch"
        ? clamp(dragInfo.initOffsetY * (1 - clamp(Math.abs(dnx) * 2.4, 0, 1)), -0.24, 0.24)
        : clamp(dragInfo.initOffsetY + dny, -0.24, 0.24);
    // 逼近真正圆心时提供轻微机械吸附
    if (Math.hypot(nextX, nextY) < 0.026) {
      nextX = 0;
      nextY = 0;
    }
    state.offsetX = nextX;
    state.offsetY = nextY;
  } else if (dragInfo.mode === "outerR") {
    const curR = Math.hypot(nx, ny);
    state.outerR = clamp(dragInfo.initOuterR + (curR - dragInfo.initR), 0.5, 1.06);
  } else if (dragInfo.mode === "rim") {
    const curR = Math.hypot(nx, ny);
    const idx = dragInfo.ringIndex - 1;
    state.ringNudges[idx] = clamp(dragInfo.initNudge + (curR - dragInfo.initR), -0.14, 0.14);
  }
  syncUI();
  heroLoop.draw();
});

function finishPointer(e) {
  if (!dragInfo || e.pointerId !== dragInfo.pointerId) return;
  const wasClick = dragInfo.moved < 7;
  const clickedOuter = dragInfo.clickedOuter;
  dragInfo = null;
  if (wasClick && clickedOuter) {
    state.outerGlare = !state.outerGlare;
    syncUI();
    heroLoop.draw();
  }
}

heroCanvas.addEventListener("pointerup", finishPointer);
heroCanvas.addEventListener("pointercancel", finishPointer);
heroCanvas.addEventListener("pointerleave", () => {
  if (!dragInfo && anim.hoverRing !== -1) {
    anim.hoverRing = -1;
    anim.dirty = true;
  }
});

// 键盘操控开场画布
heroCanvas.addEventListener("keydown", (e) => {
  let handled = true;
  if (e.key === "ArrowLeft") {
    if (e.shiftKey) state.rhythmBias = clamp(state.rhythmBias - 0.06, -0.64, 0.6);
    else state.offsetX = clamp(state.offsetX - 0.02, -0.32, 0.32);
  } else if (e.key === "ArrowRight") {
    if (e.shiftKey) state.rhythmBias = clamp(state.rhythmBias + 0.06, -0.64, 0.6);
    else state.offsetX = clamp(state.offsetX + 0.02, -0.32, 0.32);
  } else if (e.key === "ArrowUp") {
    state.offsetY = clamp(state.offsetY - 0.02, -0.24, 0.24);
  } else if (e.key === "ArrowDown") {
    state.offsetY = clamp(state.offsetY + 0.02, -0.24, 0.24);
  } else if (e.key === "+" || e.key === "=") {
    state.layerCount = clamp(state.layerCount + 1, 2, 7);
  } else if (e.key === "-") {
    state.layerCount = clamp(state.layerCount - 1, 2, 7);
  } else if (e.key === " ") {
    triggerPulse();
  } else {
    handled = false;
  }
  if (handled) {
    e.preventDefault();
    if (Math.hypot(state.offsetX, state.offsetY) < 0.015) {
      state.offsetX = 0;
      state.offsetY = 0;
    }
    syncUI();
    heroLoop.draw();
  }
});

function triggerPulse() {
  if (reducedMotion.matches) return;
  anim.pulse = 0;
  anim.dirty = true;
}

// 控件事件绑定
dom.ctrlOffset.addEventListener("input", () => {
  state.offsetX = Number(dom.ctrlOffset.value) / 100;
  if (Math.abs(state.offsetX) <= 0.02) {
    state.offsetX = 0;
    state.offsetY = 0;
  }
  syncUI();
  heroLoop.draw();
});

dom.mobileOffsetSlider.addEventListener("input", () => {
  state.offsetX = Number(dom.mobileOffsetSlider.value) / 100;
  if (Math.abs(state.offsetX) <= 0.02) {
    state.offsetX = 0;
    state.offsetY = 0;
  }
  syncUI();
  heroLoop.draw();
});

dom.ctrlRhythm.addEventListener("input", () => {
  state.rhythmBias = Number(dom.ctrlRhythm.value) / 100;
  state.ringNudges = [0, 0, 0, 0, 0, 0];
  syncUI();
  heroLoop.draw();
});

dom.ctrlOuter.addEventListener("input", () => {
  state.outerR = Number(dom.ctrlOuter.value) / 100;
  syncUI();
  heroLoop.draw();
});

document.getElementById("layer-count-btns").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-count]");
  if (!btn) return;
  state.layerCount = Number(btn.dataset.count);
  state.ringNudges = [0, 0, 0, 0, 0, 0];
  syncUI();
  heroLoop.draw();
});

dom.btnGlare.addEventListener("click", () => {
  state.outerGlare = !state.outerGlare;
  syncUI();
  heroLoop.draw();
});

dom.btnGuides.addEventListener("click", () => {
  state.showGuides = !state.showGuides;
  dom.btnGuides.setAttribute("aria-pressed", String(state.showGuides));
  dom.btnGuides.textContent = state.showGuides ? "轴线：开" : "轴线：关";
  anim.dirty = true;
  heroLoop.draw();
});

dom.layerRows.addEventListener("click", (e) => {
  const row = e.target.closest("[data-layer-idx]");
  if (!row) return;
  const idx = Number(row.dataset.layerIdx);
  if (idx === state.layerCount - 1) {
    state.outerGlare = !state.outerGlare;
    syncUI();
    heroLoop.draw();
  } else if (idx === 0) {
    state.offsetX = 0;
    state.offsetY = 0;
    syncUI();
    heroLoop.draw();
  }
});

document.querySelectorAll("[data-specimen]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.specimen = btn.dataset.specimen;
    syncUI();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-solution]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sol = SOLUTIONS[btn.dataset.solution];
    if (!sol) return;
    Object.assign(state, structuredClone(sol.patch));
    syncUI();
    triggerPulse();
    heroLoop.draw();
  });
});

document.querySelectorAll("[data-wrong]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const w = WRONG_PRESETS[btn.dataset.wrong];
    if (!w) return;
    Object.assign(state, structuredClone(w.patch));
    syncUI();
    heroLoop.draw();
  });
});

function calibratePoster() {
  Object.assign(state, structuredClone(SOLUTIONS.posterClassic.patch));
  syncUI();
  triggerPulse();
  heroLoop.draw();
}

document.getElementById("btn-calibrate").addEventListener("click", calibratePoster);
document.getElementById("btn-fix-mobile").addEventListener("click", calibratePoster);
document.getElementById("btn-reset").addEventListener("click", () => {
  const curSpec = state.specimen;
  Object.assign(state, structuredClone(DEFAULT_BROKEN), { specimen: curSpec });
  syncUI();
  heroLoop.draw();
});
document.getElementById("btn-pulse").addEventListener("click", triggerPulse);
document.getElementById("btn-pulse-mobile").addEventListener("click", triggerPulse);

// 全局空格触发回心波（焦点不在按钮或输入框内时）
window.addEventListener("keydown", (e) => {
  if (e.key === " " && !/INPUT|BUTTON|TEXTAREA|A/.test(document.activeElement?.tagName || "")) {
    const lb = document.getElementById("lightbox");
    if (lb && !lb.hidden) return;
    e.preventDefault();
    triggerPulse();
  }
});

const heroLoop = loop(heroCanvas, (_t, dt, { still }) => {
  resizeHero();
  let needsDraw = anim.dirty;

  if (still) {
    anim.intro = 1;
    anim.pulse = -1;
    needsDraw = true;
  } else {
    if (anim.intro < 1) {
      // 0.72 秒内完成开场舒展，确保 0.9s 截图已定格在清晰可读的 0/4 态
      anim.intro = Math.min(1, anim.intro + dt / 0.72);
      needsDraw = true;
    }
    if (anim.pulse >= 0) {
      anim.pulse += dt / 1.15;
      if (anim.pulse > 1) anim.pulse = -1;
      needsDraw = true;
    }
  }

  if (needsDraw) {
    anim.dirty = false;
    drawHero(lastAudit || evaluate(state));
  }
});

new ResizeObserver(() => {
  resizeHero();
  heroLoop.draw();
}).observe(heroCanvas);

// ==================== 4. 01 节：四步逐层剥离对照器 ====================
const PEEL_STEPS = [
  {
    title: "① 裸点：只有一个圆点，目光容易飘向画框四角",
    body: "缺乏包围边界时，圆点必须独自对抗矩形画框的四个角与大面积空白，观者视线停留片刻就会向四周散开。",
    svg: `
      <rect x="26" y="18" width="308" height="234" fill="none" stroke="rgba(234,215,189,0.22)" stroke-dasharray="4 4"/>
      <g stroke="rgba(240,114,104,0.6)" stroke-width="1.3" stroke-dasharray="3 3" fill="none">
        <path d="M180 135 L58 44"/><path d="M180 135 L302 44"/>
        <path d="M180 135 L58 226"/><path d="M180 135 L302 226"/>
      </g>
      <circle cx="180" cy="135" r="24" fill="#EAD7BD"/>
      <text x="180" y="139" text-anchor="middle" fill="#111A18" font-size="12" font-weight="700">核心</text>
      <text x="180" y="242" text-anchor="middle" fill="#FFACA5" font-size="11.5">缺少包围结构 · 四角拉力分散视线</text>
    `,
  },
  {
    title: "② 单环围核：建立共同区域，但纵深只有一层",
    body: "套上第一道珊瑚圆环后，Palmer 所说的「共同区域」立刻生效，核心不再孤立——但这仍停留在单层围栏（类似 050 环形构图）。",
    svg: `
      <rect x="26" y="18" width="308" height="234" fill="none" stroke="rgba(234,215,189,0.18)" stroke-dasharray="4 4"/>
      <circle cx="180" cy="135" r="56" fill="none" stroke="#D38D8B" stroke-width="20"/>
      <circle cx="180" cy="135" r="24" fill="#EAD7BD"/>
      <text x="180" y="139" text-anchor="middle" fill="#111A18" font-size="12" font-weight="700">核心</text>
      <text x="180" y="242" text-anchor="middle" fill="#EAD7BD" font-size="11.5">第一层共同区域成立 · 尚无递进纵深</text>
    `,
  },
  {
    title: "③ 双层嵌套：形成内外层级，开始产生收束节奏",
    body: "加入深墨过渡环与松石绿外环后，小边界被大边界完整包裹，视线进场先踩上外环，再经暗带缓冲落进内环与核心。",
    svg: `
      <circle cx="180" cy="135" r="96" fill="none" stroke="#44685E" stroke-width="22"/>
      <circle cx="180" cy="135" r="74" fill="none" stroke="#1A1D1B" stroke-width="20"/>
      <circle cx="180" cy="135" r="52" fill="none" stroke="#D38D8B" stroke-width="18"/>
      <circle cx="180" cy="135" r="24" fill="#EAD7BD"/>
      <text x="180" y="139" text-anchor="middle" fill="#111A18" font-size="12" font-weight="700">核心</text>
      <text x="180" y="254" text-anchor="middle" fill="#8FBEA5" font-size="11.5">嵌套层级成型 · 明度由外向内抬升</text>
    `,
  },
  {
    title: "④ 四层同心：由外向内建立阶梯，重心稳锁核心",
    body: "最外细轨与四向薄荷锚点收住整张画幅，哑光青绿环稳压外场，深墨环拉开呼吸间隔，珊瑚环贴近托举，最终把全部能量交给暖米核心。",
    svg: `
      <line x1="56" y1="135" x2="304" y2="135" stroke="rgba(234,215,189,0.28)" stroke-dasharray="3 4"/>
      <line x1="180" y1="14" x2="180" y2="256" stroke="rgba(234,215,189,0.28)" stroke-dasharray="3 4"/>
      <circle cx="180" cy="135" r="115" fill="none" stroke="rgba(234,215,189,0.38)" stroke-width="1"/>
      <circle cx="180" cy="135" r="96" fill="none" stroke="#44685E" stroke-width="22"/>
      <circle cx="180" cy="135" r="74" fill="none" stroke="#1A1D1B" stroke-width="20"/>
      <circle cx="180" cy="135" r="52" fill="none" stroke="#D38D8B" stroke-width="18"/>
      <circle cx="180" cy="135" r="24" fill="#EAD7BD"/>
      <circle cx="180" cy="28" r="4" fill="#8FBEA5"/><circle cx="287" cy="135" r="4" fill="#8FBEA5"/>
      <circle cx="180" cy="242" r="4" fill="#8FBEA5"/><circle cx="73" cy="135" r="4" fill="#8FBEA5"/>
      <text x="180" y="139" text-anchor="middle" fill="#111A18" font-size="12" font-weight="700">核心</text>
    `,
  },
];

const peelSvg = document.getElementById("peel-svg");
const peelCapTitle = document.getElementById("peel-cap-title");
const peelCapBody = document.getElementById("peel-cap-body");

function renderPeel(stepIdx) {
  const item = PEEL_STEPS[stepIdx] || PEEL_STEPS[3];
  peelSvg.innerHTML = item.svg;
  peelCapTitle.textContent = item.title;
  peelCapBody.textContent = item.body;
  document.querySelectorAll(".peel-tab").forEach((t) => {
    const active = Number(t.dataset.step) === stepIdx;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
}

document.querySelector(".peel-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-step]");
  if (btn) renderPeel(Number(btn.dataset.step));
});

// ==================== 5. 02 节：四大要点独立反例翻转卡 ====================
const PILLAR_DATA = {
  center: {
    good: {
      note: "四层环带严格共用同一个十字轴心，眼睛穿过任意一环都能自然落回核心。",
      svg: `
        <line x1="120" y1="12" x2="120" y2="144" stroke="rgba(234,215,189,0.28)" stroke-dasharray="3 3"/>
        <line x1="42" y1="78" x2="198" y2="78" stroke="rgba(234,215,189,0.28)" stroke-dasharray="3 3"/>
        <circle cx="120" cy="78" r="58" fill="none" stroke="#44685E" stroke-width="11"/>
        <circle cx="120" cy="78" r="37" fill="none" stroke="#D38D8B" stroke-width="9"/>
        <circle cx="120" cy="78" r="16" fill="#EAD7BD"/>
        <circle cx="120" cy="78" r="3" fill="#224E42"/>
      `,
    },
    bad: {
      note: "反例：内环偏离圆心向右下漂移，左侧空档拉大、右侧挤死，变成斜向隧道而不是稳固聚焦。",
      svg: `
        <line x1="120" y1="12" x2="120" y2="144" stroke="rgba(234,215,189,0.22)" stroke-dasharray="3 3"/>
        <line x1="42" y1="78" x2="198" y2="78" stroke="rgba(234,215,189,0.22)" stroke-dasharray="3 3"/>
        <circle cx="120" cy="78" r="58" fill="none" stroke="#44685E" stroke-width="11"/>
        <circle cx="136" cy="86" r="37" fill="none" stroke="#D38D8B" stroke-width="9"/>
        <circle cx="146" cy="91" r="16" fill="#EAD7BD"/>
        <line x1="120" y1="78" x2="146" y2="91" stroke="#F07268" stroke-width="1.8" stroke-dasharray="3 2"/>
      `,
    },
  },
  enclosure: {
    good: {
      note: "暖米核心保持最高明度，珊瑚环与哑光松石绿外环逐级退让，既包裹主体又绝不喧宾夺主。",
      svg: `
        <circle cx="120" cy="78" r="58" fill="none" stroke="#44685E" stroke-width="13"/>
        <circle cx="120" cy="78" r="36" fill="none" stroke="#D38D8B" stroke-width="10"/>
        <circle cx="120" cy="78" r="17" fill="#EAD7BD"/>
      `,
    },
    bad: {
      note: "反例：最外环涂成刺眼高光白绿、核心反而灰暗，观者第一眼被套在外圈，主角彻底失声。",
      svg: `
        <circle cx="120" cy="78" r="58" fill="none" stroke="#E8F6EC" stroke-width="14"/>
        <circle cx="120" cy="78" r="36" fill="none" stroke="#465451" stroke-width="10"/>
        <circle cx="120" cy="78" r="17" fill="#32403D"/>
      `,
    },
  },
  order: {
    good: {
      note: "三到四层节制递进，环宽比例克制清晰，眼睛像走下平滑台阶一样毫无阻力地抵达核心。",
      svg: `
        <circle cx="120" cy="78" r="58" fill="none" stroke="#44685E" stroke-width="13"/>
        <circle cx="120" cy="78" r="42" fill="none" stroke="rgba(234,215,189,0.4)" stroke-width="1" stroke-dasharray="2 3"/>
        <circle cx="120" cy="78" r="32" fill="none" stroke="#D38D8B" stroke-width="10"/>
        <circle cx="120" cy="78" r="15" fill="#EAD7BD"/>
      `,
    },
    bad: {
      note: "反例：把 7 层高反差等宽条纹塞满画幅，立刻产生欧普艺术般的闪烁眩晕，反而看累眼睛。",
      svg: `
        <circle cx="120" cy="78" r="61" fill="none" stroke="#EAD7BD" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="52" fill="none" stroke="#D38D8B" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="43" fill="none" stroke="#EAD7BD" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="34" fill="none" stroke="#8FBEA5" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="25" fill="none" stroke="#EAD7BD" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="16" fill="none" stroke="#D38D8B" stroke-width="4.5"/>
        <circle cx="120" cy="78" r="7" fill="#EAD7BD"/>
      `,
    },
  },
  balance: {
    good: {
      note: "外圈完整落于画幅以内，四向薄荷锚点留出均匀呼吸边距，圆满而不压抑。",
      svg: `
        <rect x="42" y="10" width="156" height="136" rx="6" fill="none" stroke="rgba(234,215,189,0.28)" stroke-dasharray="3 3"/>
        <circle cx="120" cy="78" r="54" fill="none" stroke="#44685E" stroke-width="11"/>
        <circle cx="120" cy="78" r="34" fill="none" stroke="#D38D8B" stroke-width="9"/>
        <circle cx="120" cy="78" r="15" fill="#EAD7BD"/>
        <circle cx="120" cy="24" r="3.5" fill="#8FBEA5"/><circle cx="174" cy="78" r="3.5" fill="#8FBEA5"/>
        <circle cx="120" cy="132" r="3.5" fill="#8FBEA5"/><circle cx="66" cy="78" r="3.5" fill="#8FBEA5"/>
      `,
    },
    bad: {
      note: "反例：整体撑得过大，上下弧线被画框硬切平，闭合的包围感瞬间漏气，四向留白彻底失守。",
      svg: `
        <clipPath id="clip-bal-bad"><rect x="42" y="10" width="156" height="136"/></clipPath>
        <g clip-path="url(#clip-bal-bad)">
          <circle cx="120" cy="78" r="82" fill="none" stroke="#44685E" stroke-width="14"/>
          <circle cx="120" cy="78" r="52" fill="none" stroke="#D38D8B" stroke-width="11"/>
          <circle cx="120" cy="78" r="22" fill="#EAD7BD"/>
        </g>
        <rect x="42" y="10" width="156" height="136" fill="none" stroke="#F07268" stroke-width="1.8" stroke-dasharray="5 3"/>
      `,
    },
  },
};

function renderPillarCard(card) {
  const key = card.dataset.pillar;
  const mode = card.dataset.mode;
  const info = PILLAR_DATA[key][mode];
  card.querySelector(".pillar-svg").innerHTML = info.svg;
  card.querySelector(".pillar-note").textContent = info.note;
  const btn = card.querySelector(".pillar-toggle");
  btn.textContent = mode === "good" ? "看反例" : "切回成立";
  btn.setAttribute("aria-pressed", String(mode === "bad"));
}

document.querySelectorAll(".pillar-card").forEach((card) => {
  renderPillarCard(card);
  card.querySelector(".pillar-toggle").addEventListener("click", () => {
    card.dataset.mode = card.dataset.mode === "good" ? "bad" : "good";
    renderPillarCard(card);
  });
});

// ==================== 6. 03 节：暗室步距与明度梯度实验台 ====================
const labCanvas = document.getElementById("lab-canvas");
const labCtx = labCanvas.getContext("2d");
const labProfileSvg = document.getElementById("lab-profile-svg");
const labVerdict = document.getElementById("lab-verdict");
const labNote = document.getElementById("lab-note");
const labLayersInput = document.getElementById("lab-layers");
const labLayersOut = document.getElementById("lab-layers-out");

const labState = {
  curve: "expand", // expand | equal | compress | erratic
  tone: "inward", // inward | flat | inverted | zebra
  layers: 4,
};

function computeLabRings() {
  const n = labState.layers;
  const weights = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    if (labState.curve === "expand") weights.push(0.75 + t * 0.85);
    else if (labState.curve === "equal") weights.push(1);
    else if (labState.curve === "compress") weights.push(1.55 - t * 0.9);
    else weights.push(i % 2 === 0 ? 1.85 : 0.42);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const rings = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const r0 = acc / sum;
    acc += weights[i];
    const r1 = acc / sum;
    const t = n === 1 ? 0 : i / (n - 1);
    let lum;
    let color;
    if (labState.tone === "inward") {
      lum = 0.88 - t * 0.56;
      const palette = ["#EAD7BD", "#D38D8B", "#263330", "#44685E", "#2C453F", "#1E302C", "#162320", "#111B19"];
      color = palette[i % palette.length];
    } else if (labState.tone === "flat") {
      lum = 0.54;
      color = i % 2 === 0 ? "#8C877E" : "#7B8782";
    } else if (labState.tone === "inverted") {
      lum = 0.24 + t * 0.66;
      const palette = ["#1F2B29", "#344C46", "#5E7B72", "#9ABFA9", "#D38D8B", "#EAD7BD", "#F4ECE0", "#FFFDF8"];
      color = palette[Math.min(palette.length - 1, Math.round(t * (palette.length - 1)))];
    } else {
      lum = i % 2 === 0 ? 0.92 : 0.08;
      color = i % 2 === 0 ? "#F2EDE4" : "#0B1114";
    }
    rings.push({ i, r0, r1, lum, color });
  }
  return rings;
}

function drawLab() {
  const rect = labCanvas.getBoundingClientRect();
  const size = Math.max(240, Math.round(rect.width || 380));
  const dpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
  labCanvas.width = Math.round(size * dpr);
  labCanvas.height = Math.round(size * dpr);

  const ctx = labCtx;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#060B0E";
  ctx.fillRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.5;
  const maxR = size * 0.43;
  const rings = computeLabRings();

  // 画出外细轨与正交线
  ctx.strokeStyle = "rgba(234,215,189,0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx - maxR * 1.08, cy);
  ctx.lineTo(cx + maxR * 1.08, cy);
  ctx.moveTo(cx, cy - maxR * 1.08);
  ctx.lineTo(cx, cy + maxR * 1.08);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let k = rings.length - 1; k >= 0; k--) {
    const r = rings[k];
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, r.r1 * maxR), 0, Math.PI * 2);
    ctx.fillStyle = r.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(234,215,189,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // 同步绘制径向明度横截面剖面 SVG（x = 0..1 代表圆心到外缘）
  const W = 360;
  const H = 112;
  const padL = 24;
  const padR = 14;
  const padT = 14;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const rects = rings
    .map((r) => {
      const x = padL + r.r0 * plotW;
      const rw = Math.max(2, (r.r1 - r.r0) * plotW - 1.5);
      const bh = Math.max(4, r.lum * plotH);
      const y = padT + plotH - bh;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${rw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${r.color}" stroke="rgba(234,215,189,0.5)" stroke-width="0.8" rx="2"/>`;
    })
    .join("");

  labProfileSvg.innerHTML = `
    <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="rgba(234,215,189,0.35)"/>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="rgba(234,215,189,0.35)"/>
    ${rects}
    <text x="${padL}" y="${H - 6}" fill="#B6C2BC" font-size="10">核心 r=0</text>
    <text x="${W - padR}" y="${H - 6}" text-anchor="end" fill="#B6C2BC" font-size="10">外缘 r=1</text>
  `;

  // 给出清晰定性分档（不写假精确百分比）
  let verdict = "沉稳聚心";
  let warn = false;
  let note = "中心明度最高、向外阶梯递暗，配合 3–5 层温和步距，视线自然落入核心而不费力。";

  if (labState.tone === "zebra" && labState.layers >= 5) {
    verdict = "高频闪烁眩晕";
    warn = true;
    note = "黑白交替高反差叠加 5 层以上密环，会引发强烈的视觉颤动，适合警示或欧普艺术实验，不适合承载信息排版。";
  } else if (labState.tone === "inverted") {
    verdict = "外环夺目失核";
    warn = true;
    note = "横截面右侧柱体明显高于左侧核心：外缘亮光把视线往边上拉，中心反而凹成视觉暗井。";
  } else if (labState.tone === "flat") {
    verdict = "主次平庸";
    warn = true;
    note = "各环明度几乎拉成一条平线，虽然形状同心，但缺少视觉主次，眼睛不知道该停在哪一圈。";
  } else if (labState.layers >= 6) {
    verdict = "层数过密显紧";
    warn = true;
    note = `当前 ${labState.layers} 层已超过经验舒适区（3–5 层），环带被切得过碎，庄重与包容感明显减弱。`;
  } else if (labState.layers <= 2) {
    verdict = "单环缺纵深";
    warn = true;
    note = "仅剩 2 层时缺少层层递进的过渡感，已接近 050 环形构图。";
  } else if (labState.curve === "erratic") {
    verdict = "步距突变失律";
    warn = true;
    note = "宽窄环剧烈交替打断了「由内而外，秩序递进」的平滑节奏，观感焦躁。";
  } else if (labState.curve === "equal") {
    verdict = "规整偏静";
    note = "等差匀速最像传统标靶或仪表面板，秩序感极强；若希望多一分现代呼吸，试试「外扩波纹」。";
  } else if (labState.curve === "compress") {
    verdict = "外紧内宽";
    note = "内宽外紧像一道紧箍咒把核心箍住，张力比「外扩波纹」更强，需注意最外环不要细到糊成毛边。";
  }

  labVerdict.textContent = verdict;
  labVerdict.classList.toggle("is-warn", warn);
  labNote.textContent = note;
}

document.getElementById("lab-curve-btns").addEventListener("click", (e) => {
  const b = e.target.closest("[data-curve]");
  if (!b) return;
  labState.curve = b.dataset.curve;
  document.querySelectorAll("#lab-curve-btns .lab-pill").forEach((el) => el.classList.toggle("is-active", el === b));
  drawLab();
});

document.getElementById("lab-tone-btns").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tone]");
  if (!b) return;
  labState.tone = b.dataset.tone;
  document.querySelectorAll("#lab-tone-btns .lab-pill").forEach((el) => el.classList.toggle("is-active", el === b));
  drawLab();
});

labLayersInput.addEventListener("input", () => {
  labState.layers = Number(labLayersInput.value);
  labLayersOut.textContent = `${labState.layers} 层`;
  drawLab();
});

new ResizeObserver(() => drawLab()).observe(labCanvas);

// ==================== 7. 04 节：可核验历史档案版画切换器 ====================
const HISTORY_ITEMS = {
  pantheon: {
    tag: "PLATE I · PANTHEON DOME (c. 125–128 CE)",
    meta: "古罗马 · 哈德良时期 · 建筑穹顶",
    title: "五圈 140 格同心藻井，托起 43.3 米穹顶天窗",
    body: "罗马万神殿在约公元 125–128 年重建完成，拥有跨度 43.3 米的无筋混凝土穹顶。工匠在穹顶内壁凿出 5 圈共 140 个逐层缩小的方形藻井（coffers），一方面大幅减轻屋顶自重，另一方面用严谨的同心阶梯把仰望者的视线自然聚向顶部直径约 8–9 米的唯一圆形天窗（oculus）。",
    takeaway: "给平面设计的启发：结构减负与视觉聚心可以合一——越靠近核心，细节尺度逐步收拢，光亮留给唯一圆心。",
    source: "核实来源：Pantheon Rome 建筑档案（pantheonroma.com）与罗马建筑史测绘资料。",
    svg: `
      <circle cx="170" cy="130" r="108" fill="none" stroke="#44685E" stroke-width="14"/>
      <circle cx="170" cy="130" r="88" fill="none" stroke="rgba(234,215,189,0.45)" stroke-width="10" stroke-dasharray="11 4.8"/>
      <circle cx="170" cy="130" r="70" fill="none" stroke="rgba(234,215,189,0.52)" stroke-width="9" stroke-dasharray="8.8 3.8"/>
      <circle cx="170" cy="130" r="53" fill="none" stroke="rgba(234,215,189,0.6)" stroke-width="8" stroke-dasharray="6.8 3"/>
      <circle cx="170" cy="130" r="37" fill="none" stroke="#D38D8B" stroke-width="7" stroke-dasharray="5 2.4"/>
      <circle cx="170" cy="130" r="20" fill="#EAD7BD"/>
      <text x="170" y="134" text-anchor="middle" fill="#111A18" font-size="10" font-weight="700">OCULUS</text>
    `,
  },
  tiantan: {
    tag: "PLATE II · CIRCULAR MOUND ALTAR (1530)",
    meta: "中国北京 · 明嘉靖九年（1530）· 礼制建筑",
    title: "天心石为核，三重汉白玉圆坛九重环抱",
    body: "北京天坛南部的圜丘坛始建于明嘉靖九年（1530 年），是一座露天三层同心汉白玉圆坛。最高层正中嵌着一块圆形「天心石」，向外以九的倍数逐圈铺展扇面石板，并配以三重白色玉栏与东西南北四座棂星门轴线，用纯粹的同心几何把「天圆」的庄重礼制刻在大地上。",
    takeaway: "给平面设计的启发：三层同心配上四向正交轴点，正是 055 原海报里四枚薄荷锚点带来仪式感与安定感的深层来源。",
    source: "核实来源：UNESCO 世界遗产名录第 881 号（whc.unesco.org/en/list/881）。",
    svg: `
      <line x1="36" y1="130" x2="304" y2="130" stroke="#8FBEA5" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="170" y1="12" x2="170" y2="248" stroke="#8FBEA5" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="170" cy="130" r="102" fill="#233733" stroke="#EAD7BD" stroke-width="1.4"/>
      <circle cx="170" cy="130" r="70" fill="#35524B" stroke="#EAD7BD" stroke-width="1.4"/>
      <circle cx="170" cy="130" r="38" fill="#4C7368" stroke="#EAD7BD" stroke-width="1.4"/>
      <circle cx="170" cy="130" r="14" fill="#EAD7BD"/>
      <rect x="163" y="21" width="14" height="10" fill="#D38D8B"/>
      <rect x="163" y="229" width="14" height="10" fill="#D38D8B"/>
      <rect x="61" y="125" width="10" height="10" fill="#D38D8B"/>
      <rect x="269" y="125" width="10" height="10" fill="#D38D8B"/>
    `,
  },
  kandinsky: {
    tag: "PLATE III · KANDINSKY COLOR STUDY (1913)",
    meta: "瓦西里·康定斯基 · 1913 年 · 慕尼黑伦巴赫美术馆 GMS 446",
    title: "《色彩研究：带同心圆的方格》里的冷暖进退",
    body: "1913 年康定斯基在纸上以水彩、水粉与蜡笔创作了一幅 23.9 × 31.5 厘米的小幅色彩练习（现藏慕尼黑伦巴赫美术馆）。画面用方格并置了 12 组同心色环：同样的同心圆，仅把核心与外环的冷暖明暗对调，有的立刻向前凸起聚焦，有的却向内塌陷退远。",
    takeaway: "给平面设计的启发：同心形状只搭出了舞台，真正决定目光往里走还是往外弹的，是每层色环之间的明度与冷暖关系。",
    source: "核实来源：Städtische Galerie im Lenbachhaus 藏品页（GMS 446）。",
    svg: `
      <g transform="translate(26,26)">
        <rect x="0" y="0" width="92" height="100" fill="#182527" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="46" cy="50" r="37" fill="#44685E"/><circle cx="46" cy="50" r="24" fill="#D38D8B"/><circle cx="46" cy="50" r="11" fill="#EAD7BD"/>
        <rect x="98" y="0" width="92" height="100" fill="#2A1F21" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="144" cy="50" r="37" fill="#D38D8B"/><circle cx="144" cy="50" r="24" fill="#1A1D1B"/><circle cx="144" cy="50" r="11" fill="#8FBEA5"/>
        <rect x="196" y="0" width="92" height="100" fill="#1D2621" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="242" cy="50" r="37" fill="#EAD7BD"/><circle cx="242" cy="50" r="24" fill="#44685E"/><circle cx="242" cy="50" r="11" fill="#1A1D1B"/>
        <rect x="0" y="106" width="92" height="100" fill="#1E282A" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="46" cy="156" r="37" fill="#8FBEA5"/><circle cx="46" cy="156" r="24" fill="#2C423C"/><circle cx="46" cy="156" r="11" fill="#D38D8B"/>
        <rect x="98" y="106" width="92" height="100" fill="#141C1E" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="144" cy="156" r="37" fill="#3A5A51"/><circle cx="144" cy="156" r="24" fill="#EAD7BD"/><circle cx="144" cy="156" r="11" fill="#D38D8B"/>
        <rect x="196" y="106" width="92" height="100" fill="#241D1D" stroke="rgba(234,215,189,0.2)"/>
        <circle cx="242" cy="156" r="37" fill="#1F2B28"/><circle cx="242" cy="156" r="24" fill="#8FBEA5"/><circle cx="242" cy="156" r="11" fill="#EAD7BD"/>
      </g>
    `,
  },
  johns: {
    tag: "PLATE IV · JASPER JOHNS TARGET (1955)",
    meta: "贾斯珀·琼斯 · 1955 年 · 纽约现代艺术博物馆 MoMA 8.1958",
    title: "《带四张脸的靶子》：头脑早已熟知的强锁眼符号",
    body: "1955 年美国艺术家 Jasper Johns 以蜡画、报纸拼贴与石膏创作《Target with Four Faces》（MoMA 藏品编号 8.1958）。他刻意选用标靶这种人人都一眼认得的同心几何——正如他形容的「头脑早已知道的图形」——让观者无需辨认情节，目光就被同心环直接拽进画布正中。",
    takeaway: "给平面设计的启发：同心靶心自带极高的先天识别速度，但因为太像标靶，商业排版里往往需要用温和色阶和文字留白去消解生硬感。",
    source: "核实来源：MoMA 官网藏品记录 8.1958（moma.org/collection/works/78103）。",
    svg: `
      <rect x="78" y="18" width="184" height="32" fill="#26312E" stroke="#EAD7BD" stroke-width="1.2"/>
      <line x1="124" y1="18" x2="124" y2="50" stroke="rgba(234,215,189,0.45)"/>
      <line x1="170" y1="18" x2="170" y2="50" stroke="rgba(234,215,189,0.45)"/>
      <line x1="216" y1="18" x2="216" y2="50" stroke="rgba(234,215,189,0.45)"/>
      <rect x="78" y="56" width="184" height="184" fill="#182226" stroke="#EAD7BD" stroke-width="1.2"/>
      <circle cx="170" cy="148" r="76" fill="#D38D8B"/>
      <circle cx="170" cy="148" r="57" fill="#44685E"/>
      <circle cx="170" cy="148" r="38" fill="#EAD7BD"/>
      <circle cx="170" cy="148" r="19" fill="#1A1D1B"/>
      <circle cx="170" cy="148" r="7" fill="#D38D8B"/>
    `,
  },
};

function renderHistory(key) {
  const item = HISTORY_ITEMS[key] || HISTORY_ITEMS.pantheon;
  document.getElementById("hist-svg").innerHTML = item.svg;
  document.getElementById("hist-plate-tag").textContent = item.tag;
  document.getElementById("hist-meta").textContent = item.meta;
  document.getElementById("hist-title").textContent = item.title;
  document.getElementById("hist-body").textContent = item.body;
  document.getElementById("hist-takeaway").textContent = item.takeaway;
  document.getElementById("hist-source").textContent = item.source;
  document.querySelectorAll(".hist-tab").forEach((b) => {
    const active = b.dataset.hist === key;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}

document.querySelector(".history-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-hist]");
  if (b) renderHistory(b.dataset.hist);
});

// ==================== 8. 05 节：场景诊断与同小类链接 ====================
const SCENES = {
  watch: {
    kind: "use",
    badge: "适合同心",
    title: "单件奢品 / 腕表 / 勋章主视觉",
    body: "核心主角唯一、背景信息少且需要庄重与精密气场时，同心环就像天然的展台与表圈，把所有装饰、型号与副标收进外围环带，不跟正中的产品抢一毫注意力。",
    alt: "如果你只想保留极简一圈留白、不要多层装饰，可改看 <a href=\"https://layout.xiaoxiaodong.ai/050/play/\" target=\"_blank\" rel=\"noopener\">050 环形构图</a>。",
  },
  meditation: {
    kind: "use",
    badge: "适合同心",
    title: "冥想呼吸引导 / 声波雷达界面",
    body: "呼吸起伏、雷达扫描或声波扩散本身就是同心物理现象。用 3–4 层柔和低饱和色环配合轻微缓动，比生硬的数字倒计时更能让人放松并盯住中心。",
    alt: "若界面更强调连续旋入的时间路径或动感卷绕，可参考 <a href=\"https://layout.xiaoxiaodong.ai/051/play/\" target=\"_blank\" rel=\"noopener\">051 螺旋构图</a>。",
  },
  hierarchy: {
    kind: "use",
    badge: "适合同心",
    title: "圈层影响图 / 城市核心辐射图",
    body: "当信息本身就是「核心能力 → 直接用户 → 生态外围」或「市中心 → 二环 → 三环」的嵌套包含关系时，同心构图让版式骨架直接等于信息逻辑。",
    alt: "如果数据并非层层包含而是四个独立象限对照，请改用 <a href=\"https://layout.xiaoxiaodong.ai/056/play/\" target=\"_blank\" rel=\"noopener\">056 四象限构图</a>。",
  },
  article: {
    kind: "avoid",
    badge: "别用同心",
    title: "长文章正文 / 多列信息流",
    body: "同心弧线文字只适合 6–12 字的短格言点缀。一旦把整段正文弯成圆环或硬塞进同心圆里，每行长度剧烈变化，读者眼球回扫极易迷路，同时矩形屏幕四角被大面积浪费。",
    alt: "多段文本请回到网格与直线阅读流；需要轻微曲线动势但保留清晰读序时，可看 <a href=\"https://layout.xiaoxiaodong.ai/049/play/\" target=\"_blank\" rel=\"noopener\">049 弧形构图</a>。",
  },
  catalog: {
    kind: "avoid",
    badge: "别用同心",
    title: "4–8 个并列商品或功能对比",
    body: "同心式构图是极度「专制」的单核心结构：站在正中的那一个永远压过外圈所有项。如果把 6 个平级产品硬排成同心圆，中心位会显得莫名特殊，外圈项则沦为配角。",
    alt: "需要平等展示四组并列维度时改用 <a href=\"https://layout.xiaoxiaodong.ai/056/play/\" target=\"_blank\" rel=\"noopener\">056 四象限构图</a>，或按环形平等排布看 <a href=\"https://layout.xiaoxiaodong.ai/047/play/\" target=\"_blank\" rel=\"noopener\">047 圆形构图</a>。",
  },
  action: {
    kind: "avoid",
    badge: "别用同心",
    title: "需要奔跑、冲刺或向外扩散的动感主题",
    body: "层层闭合圆环的心理感受是稳定、内聚、庄重与守恒。用于音乐节爆发、极限运动冲刺或爆炸式促销时，厚重的包围环反而会把能量死死按在原地。",
    alt: "要向外爆发张力改用 <a href=\"https://layout.xiaoxiaodong.ai/052/play/\" target=\"_blank\" rel=\"noopener\">052 放射式构图</a> 或 <a href=\"https://layout.xiaoxiaodong.ai/054/play/\" target=\"_blank\" rel=\"noopener\">054 离心式构图</a>；要带速度感地向中心冲刺则看 <a href=\"https://layout.xiaoxiaodong.ai/053/play/\" target=\"_blank\" rel=\"noopener\">053 向心式构图</a>。",
  },
};

function renderScene(id) {
  const s = SCENES[id] || SCENES.watch;
  const badge = document.getElementById("td-badge");
  badge.textContent = s.badge;
  badge.className = `triage-badge ${s.kind === "use" ? "is-use" : "is-avoid"}`;
  document.getElementById("td-title").textContent = s.title;
  document.getElementById("td-body").textContent = s.body;
  document.getElementById("td-alt").innerHTML = s.alt;
  document.querySelectorAll(".triage-card").forEach((c) => {
    const sel = c.dataset.scene === id;
    c.classList.toggle("is-selected", sel);
    c.setAttribute("aria-expanded", String(sel));
  });
}

document.getElementById("triage-grid").addEventListener("click", (e) => {
  const c = e.target.closest("[data-scene]");
  if (c) renderScene(c.dataset.scene);
});

document.querySelector(".triage-filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  const f = b.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach((el) => el.classList.toggle("is-active", el === b));
  let firstVisible = null;
  document.querySelectorAll(".triage-card").forEach((c) => {
    const show = f === "all" || c.dataset.kind === f;
    c.classList.toggle("is-hidden", !show);
    if (show && !firstVisible) firstVisible = c;
  });
  if (firstVisible) renderScene(firstVisible.dataset.scene);
});

// ==================== 9. 06 节：单变量双题实战测眼 ====================
const QUIZ_QUESTIONS = [
  {
    prompt: "下面四张同心海报的圆心、层数（同为 4 层）与边距完全一致，只改变了各环明度分配。哪一张最能把视线稳稳锁在中心核心上？",
    answer: "C",
    options: [
      {
        id: "A",
        note: "4 层 · 配色样本 01",
        svg: `
          <circle cx="80" cy="100" r="64" fill="#7D8683"/>
          <circle cx="80" cy="100" r="47" fill="#8B847E"/>
          <circle cx="80" cy="100" r="31" fill="#868E8B"/>
          <circle cx="80" cy="100" r="16" fill="#928B83"/>
        `,
        why: "方案 A 把四层压成了相近的中灰明度，虽然几何同心，但核心毫无突出度，眼睛在几道灰环之间来回游移。",
      },
      {
        id: "B",
        note: "4 层 · 配色样本 02",
        svg: `
          <circle cx="80" cy="100" r="64" fill="#ECE4D5"/>
          <circle cx="80" cy="100" r="47" fill="#5D776E"/>
          <circle cx="80" cy="100" r="31" fill="#32413E"/>
          <circle cx="80" cy="100" r="16" fill="#1C2422"/>
        `,
        why: "方案 B 明度倒置：最外一圈亮米色最刺眼，眼睛第一秒就被吸到外缘大环上，中心的暗圆反而凹成空洞。",
      },
      {
        id: "C",
        note: "4 层 · 配色样本 03",
        svg: `
          <circle cx="80" cy="100" r="64" fill="#44685E"/>
          <circle cx="80" cy="100" r="47" fill="#1A1D1B"/>
          <circle cx="80" cy="100" r="31" fill="#D38D8B"/>
          <circle cx="80" cy="100" r="16" fill="#EAD7BD"/>
        `,
        why: "判断准确！方案 C 保持核心最暖亮，珊瑚环轻托、深墨环拉开间隔、哑光松石绿外环稳压外场，视线沿明度阶梯直接落核。",
      },
      {
        id: "D",
        note: "4 层 · 配色样本 04",
        svg: `
          <circle cx="80" cy="100" r="64" fill="#F2EFE8"/>
          <circle cx="80" cy="100" r="47" fill="#0B1114"/>
          <circle cx="80" cy="100" r="31" fill="#F2EFE8"/>
          <circle cx="80" cy="100" r="16" fill="#0B1114"/>
        `,
        why: "方案 D 虽同为 4 层，但高反差黑白硬交替让最外白环与次内白环同等刺眼、中心反而全黑，产生强烈闪烁竞争，无法安静聚心。",
      },
    ],
  },
  {
    prompt: "下面四张同心海报的配色与明度完全一致，只改变了共轴度、步距或外径尺度。哪一张结构最稳妥完整？",
    answer: "B",
    options: [
      {
        id: "A",
        note: "4 层 · 结构样本 01",
        svg: `
          <circle cx="80" cy="100" r="62" fill="#44685E"/>
          <circle cx="87" cy="100" r="45" fill="#1A1D1B"/>
          <circle cx="93" cy="100" r="30" fill="#D38D8B"/>
          <circle cx="97" cy="100" r="15" fill="#EAD7BD"/>
        `,
        why: "方案 A 内三环向右脱轴，右侧环带被挤压成窄缝、左侧留出大片偏沉空带，破坏了同心共轴与四象限平衡。",
      },
      {
        id: "B",
        note: "4 层 · 结构样本 02",
        svg: `
          <circle cx="80" cy="100" r="62" fill="#44685E"/>
          <circle cx="80" cy="100" r="44" fill="#1A1D1B"/>
          <circle cx="80" cy="100" r="29" fill="#D38D8B"/>
          <circle cx="80" cy="100" r="15" fill="#EAD7BD"/>
        `,
        why: "判断准确！方案 B 四层严格共用圆心，环宽由内向外柔和舒展，四周均留出完整呼吸边距，四项规矩全部成立。",
      },
      {
        id: "C",
        note: "4 层 · 结构样本 03",
        svg: `
          <circle cx="80" cy="100" r="62" fill="#44685E"/>
          <circle cx="80" cy="100" r="33" fill="#1A1D1B"/>
          <circle cx="80" cy="100" r="29" fill="#D38D8B"/>
          <circle cx="80" cy="100" r="15" fill="#EAD7BD"/>
        `,
        why: "方案 C 虽然共圆心，但深墨中环被压成细缝、最外绿环却骤然肥大，步距突变打断了由内而外的递进韵律。",
      },
      {
        id: "D",
        note: "4 层 · 结构样本 04",
        svg: `
          <circle cx="80" cy="100" r="94" fill="#44685E"/>
          <circle cx="80" cy="100" r="67" fill="#1A1D1B"/>
          <circle cx="80" cy="100" r="43" fill="#D38D8B"/>
          <circle cx="80" cy="100" r="20" fill="#EAD7BD"/>
        `,
        why: "方案 D 把整组同心环过度放大，外环左右圆弧被画框硬切平，闭合的包围感与圆满呼吸随之破功。",
      },
    ],
  },
];

let curQ = 0;
const solved = [false, false];
const picked = [null, null];

function renderQuiz() {
  const q = QUIZ_QUESTIONS[curQ];
  document.getElementById("quiz-prompt").textContent = q.prompt;
  document.getElementById("quiz-score").textContent = `已完成 ${solved.filter(Boolean).length} / ${QUIZ_QUESTIONS.length} 题`;
  document.querySelectorAll(".quiz-tab").forEach((t) => {
    const active = Number(t.dataset.q) === curQ;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });

  const grid = document.getElementById("quiz-grid");
  grid.innerHTML = q.options
    .map((o) => {
      let cls = "quiz-opt";
      if (picked[curQ] === o.id) cls += o.id === q.answer ? " is-right" : " is-wrong";
      return `<button type="button" class="${cls}" data-opt="${o.id}">
        <svg viewBox="0 0 160 200" aria-hidden="true">
          <rect x="6" y="6" width="148" height="188" fill="none" stroke="rgba(234,215,189,0.22)" stroke-dasharray="3 3"/>
          ${o.svg}
        </svg>
        <div class="quiz-opt-head"><span>方案 ${o.id}</span></div>
        <span class="quiz-opt-note">${o.note}</span>
      </button>`;
    })
    .join("");

  const fb = document.getElementById("quiz-feedback");
  const titleEl = document.getElementById("qf-title");
  const bodyEl = document.getElementById("qf-body");
  if (!picked[curQ]) {
    fb.classList.remove("is-wrong");
    titleEl.textContent = "点击任意一张方案卡作答";
    bodyEl.textContent = "四张卡严格只差一个视觉变量，不看提示词，先用眼睛感受哪一张的视线落点最从容。";
  } else {
    const chosen = q.options.find((o) => o.id === picked[curQ]);
    const isRight = chosen.id === q.answer;
    fb.classList.toggle("is-wrong", !isRight);
    titleEl.textContent = isRight ? `方案 ${chosen.id} · 正确` : `方案 ${chosen.id} · 差在这一项`;
    bodyEl.textContent = chosen.why;
  }
}

document.querySelector(".quiz-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-q]");
  if (!b) return;
  curQ = Number(b.dataset.q);
  renderQuiz();
});

document.getElementById("quiz-grid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-opt]");
  if (!b) return;
  const optId = b.dataset.opt;
  picked[curQ] = optId;
  if (optId === QUIZ_QUESTIONS[curQ].answer) solved[curQ] = true;
  renderQuiz();
});

// ==================== 10. 07 节：原海报放大拖拽灯箱 ====================
const posterImg = document.getElementById("poster");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbScaleEl = document.getElementById("lb-scale");

let lbScale = 1;
let lbX = 0;
let lbY = 0;
let lbDrag = null;

function updateLbTransform() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbScaleEl.textContent = `${Math.round(lbScale * 100)}%`;
}

function openLightbox() {
  // 复用已内联的原海报 src，不重复打包一份图片
  lbImg.src = posterImg.currentSrc || posterImg.src;
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.getElementById("poster-open").focus();
}

document.getElementById("poster-open").addEventListener("click", openLightbox);
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-zoom-in").addEventListener("click", () => {
  lbScale = clamp(lbScale + 0.35, 0.75, 4);
  updateLbTransform();
});
document.getElementById("lb-zoom-out").addEventListener("click", () => {
  lbScale = clamp(lbScale - 0.35, 0.75, 4);
  updateLbTransform();
});
document.getElementById("lb-reset").addEventListener("click", () => {
  lbScale = 1;
  lbX = 0;
  lbY = 0;
  updateLbTransform();
});

lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.75, 4);
  updateLbTransform();
}, { passive: false });

lbStage.addEventListener("pointerdown", (e) => {
  lbDrag = { id: e.pointerId, sx: e.clientX - lbX, sy: e.clientY - lbY };
  lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag || e.pointerId !== lbDrag.id) return;
  lbX = e.clientX - lbDrag.sx;
  lbY = e.clientY - lbDrag.sy;
  updateLbTransform();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
lbStage.addEventListener("pointercancel", () => { lbDrag = null; });

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ==================== 初始化 ====================
syncUI();
resizeHero();
heroLoop.draw();
renderPeel(3);
drawLab();
renderHistory("pantheon");
renderScene("watch");
renderQuiz();
