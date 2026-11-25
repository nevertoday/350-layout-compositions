import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  THEMES,
  PRESETS,
  createInitialState,
  evaluateCover,
  clamp,
} from "./model.js";

// ==================== 无缝离屏金箔颗粒纹理缓存（零接缝，60fps 零负担） ====================
function buildGoldFoilTile() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const x = c.getContext("2d");
  // 纯透明底 + 无缝随机细金箔微粒，底色径向渐变铺满整圆后再叠颗粒，彻底消除贴图接缝
  let seed = 160160;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 900; i++) {
    const px = rnd() * 128;
    const py = rnd() * 128;
    const sz = 0.7 + rnd() * 2.1;
    x.fillStyle = rnd() > 0.48 ? "rgba(255,238,188,0.16)" : "rgba(56,34,10,0.16)";
    x.fillRect(px, py, sz, sz * (0.6 + rnd() * 0.9));
  }
  return c;
}

const FOIL_TILE = buildGoldFoilTile();
const FOIL_PAT_CACHE = new WeakMap();
function getFoilPattern(ctx) {
  let p = FOIL_PAT_CACHE.get(ctx);
  if (p === undefined) {
    p = ctx.createPattern(FOIL_TILE, "repeat");
    FOIL_PAT_CACHE.set(ctx, p);
  }
  return p;
}

// ==================== 核心绘制函数：供主封面画布与书架场景复用 ====================
function drawCoverArt(ctx, w, h, state, ev, opts = {}) {
  const { openOverride = null, showGuides = true, showClutter = true, micro = false } = opts;
  const { theme, geo } = ev;
  const open = openOverride == null ? ev.doorOpen : openOverride;

  ctx.save();
  // 1. 黑绒暗室纸底
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);

  // 微妙暗金光泽与纸边阴影（书脊左侧压痕）
  const spineW = Math.max(4, w * 0.036);
  const spineGrad = ctx.createLinearGradient(0, 0, spineW * 2.2, 0);
  spineGrad.addColorStop(0, "rgba(0,0,0,0.62)");
  spineGrad.addColorStop(0.45, "rgba(239,227,206,0.12)");
  spineGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, spineW * 2.2, h);

  // 右上角 4×4 原海报金色点阵（单次路径合批，零多余 draw call）
  if (!micro) {
    ctx.fillStyle = "rgba(217, 164, 78, 0.72)";
    const dotR = Math.max(1.1, w * 0.0038);
    ctx.beginPath();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const px = w * (0.855 + c * 0.032);
        const py = h * (0.045 + r * 0.022);
        ctx.moveTo(px + dotR, py);
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  // 2. 深绛酒红次月（箔金日轮上方）
  const cr = geo.crimson;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cr.cx * w, cr.cy * h, cr.rx * w, cr.ry * h, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${theme.crimsonRgb.join(",")})`;
  ctx.fill();
  ctx.restore();

  // 斜切细金线（原海报标志构图线）
  ctx.save();
  ctx.strokeStyle = "rgba(232, 189, 108, 0.65)";
  ctx.lineWidth = Math.max(0.8, w * 0.0025);
  ctx.beginPath();
  ctx.moveTo((cr.cx - cr.rx * 0.6) * w, (cr.cy + cr.ry * 0.9) * h);
  ctx.lineTo(w, (cr.cy - cr.ry * 0.55) * h);
  ctx.stroke();
  ctx.restore();

  // 3. 箔金大圆（原海报视觉焦点：整圆径向金光 + 缓存无缝细箔颗粒）
  const d = geo.disc;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(d.cx * w, d.cy * h, d.rx * w, d.ry * h, 0, 0, Math.PI * 2);
  ctx.clip();
  const radG = ctx.createRadialGradient(
    (d.cx + d.rx * 0.36) * w, (d.cy - d.ry * 0.36) * h, d.rx * w * 0.08,
    d.cx * w, d.cy * h, d.rx * w * 1.18
  );
  radG.addColorStop(0, "#E4BA6C");
  radG.addColorStop(0.45, "#C79545");
  radG.addColorStop(0.85, "#9C6E2E");
  radG.addColorStop(1, "#724C1D");
  ctx.fillStyle = radG;
  ctx.fillRect((d.cx - d.rx) * w, (d.cy - d.ry) * h, d.rx * 2 * w, d.ry * 2 * h);
  if (!micro) {
    const pat = getFoilPattern(ctx);
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect((d.cx - d.rx) * w, (d.cy - d.ry) * h, d.rx * 2 * w, d.ry * 2 * h);
    }
  }
  ctx.restore();

  // 4. 透视入口之门（随 open ∈ [0.14, 1] 实时推开，光毯同步铺展）
  const dr = geo.doorRect;
  const dx = dr.x * w;
  const dy = dr.y * h;
  const dw = dr.w * w;
  const dh = dr.h * h;

  // 门外投射的象牙白光毯与深酒红阴影（只在门推开时明显铺亮）
  ctx.save();
  const spread = 0.25 + open * 0.75;
  ctx.globalAlpha = 0.22 + open * 0.78;
  // 象牙白入口光毯
  ctx.beginPath();
  ctx.moveTo(dx + dw * 0.04, dy + dh);
  ctx.lineTo(dx + dw * (0.04 + 0.56 * spread), dy + dh * 0.88);
  ctx.lineTo(dx + dw * 0.45, h);
  ctx.lineTo(Math.max(0, dx - dw * 1.18 * spread), h);
  ctx.closePath();
  ctx.fillStyle = "#E3CDAC";
  ctx.fill();

  // 深酒红三角投影
  ctx.beginPath();
  ctx.moveTo(dx + dw * 0.15, dy + dh * 0.96);
  ctx.lineTo(dx + dw * 0.62, dy + dh * 0.76);
  ctx.lineTo(dx + dw * 0.86, h);
  ctx.lineTo(dx + dw * 0.42, h);
  ctx.closePath();
  ctx.fillStyle = "#5E130E";
  ctx.fill();
  ctx.restore();

  // 门右侧平行细金斜线网（单次路径合批绘制）
  if (!micro) {
    ctx.save();
    ctx.strokeStyle = `rgba(217, 164, 78, ${0.28 + open * 0.48})`;
    ctx.lineWidth = Math.max(0.7, w * 0.0022);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      ctx.moveTo(dx + dw * 0.62, dy + dh * (0.76 + t * 0.24));
      ctx.lineTo(w, dy + dh * (0.95 + t * 0.55));
    }
    ctx.stroke();
    ctx.restore();
  }

  // 门洞深黑几何框（建筑季刊呈拱门，平装书呈细金双框，原海报呈透视梯形门）
  ctx.save();
  ctx.fillStyle = "#0A0907";
  ctx.beginPath();
  if (state.theme === "journal") {
    ctx.moveTo(dx, dy + dh);
    ctx.lineTo(dx, dy + dh * 0.34);
    ctx.quadraticCurveTo(dx + dw * 0.5, dy - dh * 0.08, dx + dw, dy + dh * 0.34);
    ctx.lineTo(dx + dw, dy + dh * 0.84);
    ctx.closePath();
  } else {
    ctx.moveTo(dx, dy + dh * 0.16);
    ctx.lineTo(dx + dw, dy - dh * 0.12);
    ctx.lineTo(dx + dw, dy + dh * 0.82);
    ctx.lineTo(dx, dy + dh);
    ctx.closePath();
  }
  ctx.fill();

  // 敞开的象牙白门扉（宽度与透视随 open 实时开合）
  const leafSpan = dw * (0.14 + 0.48 * open);
  const topDrop = dh * (0.19 + 0.08 * open);
  ctx.fillStyle = "#EFE3CE";
  ctx.beginPath();
  ctx.moveTo(dx + dw * 0.07, dy + dh * 0.19);
  ctx.lineTo(dx + dw * 0.07 + leafSpan, dy + topDrop);
  ctx.lineTo(dx + dw * 0.07 + leafSpan, dy + dh * 0.86);
  ctx.lineTo(dx + dw * 0.07, dy + dh * 0.98);
  ctx.closePath();
  ctx.fill();

  // 门轴暗金边
  ctx.strokeStyle = "#845825";
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(dx + dw * 0.07, dy + dh * 0.19);
  ctx.lineTo(dx + dw * 0.07, dy + dh * 0.98);
  ctx.stroke();
  ctx.restore();

  // 5. 出版系列识别带（IDENTITY）
  const ir = geo.idRect;
  ctx.save();
  const idX = ir.x * w;
  const idY = ir.y * h;
  const idW = ir.w * w;
  const idH = ir.h * h;
  const idSize = Math.max(6, h * 0.0175);
  if (state.idPos === "masthead") {
    ctx.fillStyle = "#E5B763";
    ctx.fillRect(idX, idY + idH - Math.max(1, h * 0.002), idW, Math.max(1, h * 0.002));
    ctx.font = `700 ${Math.round(idSize * 1.15)}px "Outfit", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.seriesEn, idX + idW / 2, idY + idH * 0.45);
  } else {
    ctx.fillStyle = "#E5B763";
    ctx.fillRect(idX, idY + 2, Math.max(1.5, w * 0.005), idH - 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `600 ${Math.round(idSize)}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#E5B763";
    ctx.fillText(theme.seriesZh, idX + Math.max(5, w * 0.018), idY + 2);
    if (!micro) {
      ctx.font = `600 ${Math.round(idSize * 0.78)}px "Outfit", sans-serif`;
      ctx.fillStyle = "#C79545";
      ctx.fillText(theme.seriesEn, idX + Math.max(5, w * 0.018), idY + idSize * 1.32);
    }
  }
  ctx.restore();

  // 6. 明确标题区（TITLE）
  const tr = geo.titleRect;
  ctx.save();
  const tx = tr.x * w;
  const ty = tr.y * h;
  const tw = tr.w * w;
  const subPx = Math.max(6.5, h * 0.022);
  const titlePx = clamp(subPx * state.title.scale, 11, h * 0.145);
  const centered = state.idPos === "masthead" && Math.abs(state.title.u - 0.5) < 0.08;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "top";
  const anchorX = centered ? tx + tw / 2 : tx + w * 0.006;

  // 选择对应题材字体
  const zhFace =
    theme.titleFont === "xiaowei"
      ? `400 ${Math.round(titlePx)}px "ZCOOL XiaoWei", "Noto Sans SC", serif`
      : `900 ${Math.round(titlePx)}px "Noto Sans SC", sans-serif`;
  ctx.font = zhFace;
  ctx.fillStyle = theme.titleColor;
  ctx.fillText(theme.titleZh, anchorX, ty);

  // 英文副标与短金杠
  const enPx = Math.max(5.5, subPx * 0.92);
  ctx.font =
    theme.titleFont === "serif"
      ? `italic 700 ${Math.round(enPx * 1.08)}px "Playfair Display", Georgia, serif`
      : `700 ${Math.round(enPx)}px "Outfit", sans-serif`;
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(theme.titleEn, anchorX, ty + titlePx * 1.12);

  if (!micro) {
    const barW = Math.min(tw * 0.24, w * 0.09);
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(centered ? anchorX - barW / 2 : anchorX, ty + titlePx * 1.12 + enPx * 1.38, barW, Math.max(2, h * 0.0045));
    ctx.font = `400 ${Math.round(subPx)}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = theme.subColor;
    ctx.fillText(theme.subtitleZh, anchorX, ty + titlePx * 1.12 + enPx * 1.85);
  }
  ctx.restore();

  // 左下作者/期号落款（仅当没有长腰封且非微图）
  if (!micro && !state.clutter[1]) {
    ctx.save();
    ctx.fillStyle = "#C79545";
    ctx.fillRect(w * 0.075, h * 0.89, Math.max(1.5, w * 0.005), h * 0.042);
    ctx.font = `500 ${Math.round(h * 0.018)}px "DM Mono", "Noto Sans SC", monospace`;
    ctx.fillStyle = "#D8CCB8";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.author, w * 0.095, h * 0.911);
    ctx.restore();
  }

  // 7. 堵门杂讯条（可逐条点击清除）
  if (showClutter) {
    for (const c of geo.clutterRects) {
      if (!c.active) continue;
      const cx = c.x * w;
      const cy = c.y * h;
      const cw = c.w * w;
      const ch = c.h * h;
      ctx.save();
      if (c.kind === "sticker") {
        // 亮红斜圆爆贴压在门洞上
        const r = Math.min(cw, ch) * 0.56;
        ctx.translate(cx + cw / 2, cy + ch / 2);
        ctx.rotate(-0.14);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = "#B6221C";
        ctx.fill();
        ctx.strokeStyle = "#F7E2B8";
        ctx.lineWidth = Math.max(1.2, w * 0.004);
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!micro) {
          ctx.fillStyle = "#FFF7EA";
          ctx.font = `800 ${Math.round(h * 0.019)}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("重磅热销!", 0, -h * 0.008);
          ctx.font = `600 ${Math.round(h * 0.015)}px "Noto Sans SC", sans-serif`;
          ctx.fillStyle = "#FFD89B";
          ctx.fillText("× 点此清掉", 0, h * 0.014);
        }
      } else {
        ctx.fillStyle = c.kind === "belly" ? "rgba(125, 23, 20, 0.94)" : "rgba(148, 30, 24, 0.90)";
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = "#F2A89D";
        ctx.lineWidth = Math.max(1, w * 0.0028);
        ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
        if (!micro) {
          ctx.fillStyle = "#FAF4E8";
          ctx.font = `700 ${Math.round(h * 0.0185)}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const label = c.kind === "ribbon" ? `${c.text} ×` : `${c.text}  [×]`;
          ctx.fillText(label, cx + cw / 2, cy + ch / 2, cw - 10);
        }
      }
      ctx.restore();
    }
  }

  // 8. 书架/报摊叠放遮蔽参考区（显示右侧与底边被前排邻书盖住的风险）
  if (state.shelfMask && !micro) {
    ctx.save();
    ctx.fillStyle = "rgba(10, 9, 7, 0.56)";
    ctx.fillRect(w * 0.78, 0, w * 0.22, h);
    ctx.fillRect(0, h * 0.87, w * 0.78, h * 0.13);
    ctx.strokeStyle = "#F27B72";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.78, 0);
    ctx.lineTo(w * 0.78, h * 0.87);
    ctx.lineTo(0, h * 0.87);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FFC4BC";
    ctx.font = `600 ${Math.round(h * 0.0175)}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("报摊右排遮挡区", w * 0.97, h * 0.02);
    ctx.restore();
  }

  // 9. 交互提示框（仅主画布开启）：标示当前焦点拖拽框或错态冲突热区
  if (showGuides && !micro) {
    ctx.save();
    // 出版裁切安全参考框（6% 内缩）
    ctx.strokeStyle = "rgba(229, 183, 99, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.strokeRect(w * 0.055, h * 0.045, w * 0.89, h * 0.91);
    ctx.setLineDash([]);

    // 若发生图字互殴或对比融底，用细虚红框圈出标题区提醒
    if (ev.fault && (ev.fault.code === "contrast" || ev.fault.code === "clash" || ev.fault.code === "title_bleed")) {
      ctx.strokeStyle = "#F27B72";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(tx - 4, ty - 4, tw + 8, tr.h * h + 8);
      ctx.setLineDash([]);
    }

    // 焦点圆心微缩牵引环（靠箔金圆右上外肩并自动避开标题区，绝不压字）
    let fx = clamp((d.cx + d.rx * 0.62) * w, 20, w - 20);
    let fy = clamp((d.cy - d.ry * 0.24) * h, 20, h - 20);
    if (fx > tx - 14 && fx < tx + tw + 14 && fy > ty - 14 && fy < ty + tr.h * h + 14) {
      fy = clamp((d.cy + d.ry * 0.28) * h, 20, h - 20);
    }
    if (fx > 16 && fx < w - 16 && fy > 16 && fy < h - 16) {
      ctx.beginPath();
      ctx.arc(fx, fy, 11, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20, 18, 14, 0.78)";
      ctx.fill();
      ctx.strokeStyle = "#E5B763";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#E5B763";
      ctx.font = `700 11px "Outfit", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", fx, fy + 0.5);
    }
    ctx.restore();
  }

  ctx.restore();
}

// ==================== HERO 主打样台控制器 ====================
const state = createInitialState();
let latestEval = evaluateCover(state);

const heroCanvas = document.getElementById("cover-canvas");
const scopeCanvas = document.getElementById("scope-canvas");
const hctx = heroCanvas.getContext("2d");
const sctx = scopeCanvas.getContext("2d");

const els = {
  stamp: document.getElementById("hero-stamp"),
  miniLeaf: document.getElementById("mini-door-leaf"),
  miniBeam: document.getElementById("mini-door-beam"),
  scopeVerdict: document.getElementById("scope-verdict"),
  mRatio: document.getElementById("m-ratio"),
  mContrast: document.getElementById("m-contrast"),
  mExposure: document.getElementById("m-exposure"),
  mClutter: document.getElementById("m-clutter"),
  diagCard: document.getElementById("diag-card"),
  diagTag: document.getElementById("diag-tag"),
  diagTitle: document.getElementById("diag-title"),
  diagWhy: document.getElementById("diag-why"),
  diagNext: document.getElementById("diag-next"),
  diagFix: document.getElementById("diag-fix-btn"),
  ctrlScale: document.getElementById("ctrl-scale"),
  valScale: document.getElementById("val-scale"),
  ctrlFocal: document.getElementById("ctrl-focal"),
  valFocal: document.getElementById("val-focal"),
  btnShelf: document.getElementById("btn-shelf-mask"),
  btnClearClutter: document.getElementById("btn-toggle-clutter"),
};

// 平滑门扉开合动画值 + 零回流尺寸缓存
let animOpen = 0.08;
let introDone = false;
let heroDirty = true;
let uiDirty = true;
let scopeTick = 0;
let shelfMarkDirty = null;
const cachedSize = { heroW: 0, heroH: 0, scopeW: 0, scopeH: 0 };

function measureHeroSizes() {
  const hr = heroCanvas.getBoundingClientRect();
  cachedSize.heroW = hr.width || 360;
  cachedSize.heroH = hr.height || 480;
  const sr = scopeCanvas.getBoundingClientRect();
  cachedSize.scopeW = sr.width || 80;
  cachedSize.scopeH = sr.height || 106;
}

function resizeCanvas(canvas, cssW, cssH) {
  const maxDpr = window.innerWidth <= 500 ? 1.5 : 2;
  const dpr = pixelRatio(maxDpr);
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}

function setTxt(el, val) {
  if (el && el.textContent !== val) el.textContent = val;
}

function syncUI(ev) {
  const { score, metrics, pillars, fault, passSummary, doorOpen } = ev;
  setTxt(els.stamp, score === 4 ? "4 / 4 门扉敞开" : `${score} / 4 待整版`);
  els.stamp.classList.toggle("is-pass", score === 4);

  // 自示范微型金门徽联动
  const leafX = (11 + 6 + 15 * doorOpen).toFixed(1);
  const leafTop = (10 + 3.5 * doorOpen).toFixed(1);
  const leafBot = (56 - 3 * doorOpen).toFixed(1);
  const pts = `11,10 ${leafX},${leafTop} ${leafX},${leafBot} 11,56`;
  if (els.miniLeaf.getAttribute("points") !== pts) els.miniLeaf.setAttribute("points", pts);
  const op = (0.18 + doorOpen * 0.72).toFixed(2);
  if (els.miniBeam.getAttribute("opacity") !== op) els.miniBeam.setAttribute("opacity", op);

  // 五要素金环状态列
  for (const p of pillars) {
    const li = document.querySelector(`#pillar-spine li[data-pillar="${p.key}"]`);
    const badge = document.getElementById(`p-stat-${p.key}`);
    if (li) li.classList.toggle("is-ok", p.ok);
    setTxt(badge, p.stat);
  }

  // 2.5 米远距缩略镜数值
  setTxt(els.scopeVerdict, metrics.impressionRank);
  setTxt(els.mRatio, `${metrics.titleRatio.toFixed(2)}×`);
  setTxt(els.mContrast, `${metrics.contrast.toFixed(1)}:1`);
  setTxt(els.mExposure, `${metrics.idExposure}%`);
  setTxt(els.mClutter, metrics.clutterCount === 0 ? "0 处（净）" : `${metrics.clutterCount} 处`);

  // 象牙白单真源诊单
  els.diagCard.classList.toggle("is-pass", !fault);
  if (fault) {
    setTxt(els.diagTag, `错态 · ${fault.badge}`);
    setTxt(els.diagTitle, fault.headline);
    setTxt(els.diagWhy, fault.why);
    setTxt(els.diagNext, fault.next);
    setTxt(els.diagFix, `一步校准：${fault.fixLabel}`);
    if (els.diagFix.dataset.action !== fault.fixAction) els.diagFix.dataset.action = fault.fixAction;
  } else {
    setTxt(els.diagTag, "通过 · 4 / 4 门扉敞开");
    setTxt(els.diagTitle, passSummary.headline);
    setTxt(els.diagWhy, passSummary.why);
    setTxt(els.diagNext, passSummary.next);
  }

  // 滑块与开关状态回显
  const scStr = String(Math.round(state.title.scale * 100));
  if (els.ctrlScale.value !== scStr) els.ctrlScale.value = scStr;
  setTxt(els.valScale, `${state.title.scale.toFixed(2)}×`);
  const frStr = String(Math.round(state.focal.r * 100));
  if (els.ctrlFocal.value !== frStr) els.ctrlFocal.value = frStr;
  setTxt(els.valFocal, `${Math.round(state.focal.r * 100)}%`);

  document.querySelectorAll(".seg[data-idpos]").forEach((btn) => {
    const v = String(btn.dataset.idpos === state.idPos);
    if (btn.getAttribute("aria-pressed") !== v) btn.setAttribute("aria-pressed", v);
  });
  document.querySelectorAll(".theme-bar .pill").forEach((btn) => {
    const on = btn.dataset.theme === state.theme;
    btn.classList.toggle("is-active", on);
    const v = String(on);
    if (btn.getAttribute("aria-pressed") !== v) btn.setAttribute("aria-pressed", v);
  });
  els.btnShelf.classList.toggle("is-on", state.shelfMask);
  els.btnShelf.setAttribute("aria-pressed", String(state.shelfMask));
  setTxt(els.btnShelf, state.shelfMask ? "报摊叠放线：开" : "报摊叠放线：关");

  const hasClutter = state.clutter.some(Boolean);
  setTxt(els.btnClearClutter, hasClutter ? `清掉剩余 ${metrics.clutterCount} 处杂讯` : "恢复堵门杂讯试错");
}

// 离屏微缩画布：用低采样再双线性放大模拟 2.5 米光学微模糊，比 ctx.filter blur 快十倍且软件渲染 60fps
const SCOPE_LOW = document.createElement("canvas");
SCOPE_LOW.width = 48;
SCOPE_LOW.height = 64;
const slctx = SCOPE_LOW.getContext("2d");

function renderScope(ev, openVal) {
  if (!cachedSize.scopeW) measureHeroSizes();
  const cw = cachedSize.scopeW;
  const ch = cachedSize.scopeH;
  const dpr = resizeCanvas(scopeCanvas, cw, ch);
  slctx.save();
  drawCoverArt(slctx, 48, 64, state, ev, { openOverride: openVal, showGuides: false, showClutter: true, micro: true });
  slctx.restore();
  sctx.save();
  sctx.scale(dpr, dpr);
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "low";
  sctx.drawImage(SCOPE_LOW, 0, 0, cw, ch);
  if (state.shelfMask) {
    sctx.fillStyle = "rgba(10, 9, 7, 0.72)";
    sctx.fillRect(cw * 0.78, 0, cw * 0.22, ch);
    sctx.fillRect(0, ch * 0.87, cw * 0.78, ch * 0.13);
  }
  sctx.restore();
}

function updateCover(immediate = false, fromDrag = false) {
  latestEval = evaluateCover(state);
  if (immediate || reducedMotion.matches) animOpen = latestEval.doorOpen;
  heroDirty = true;
  if (shelfMarkDirty) shelfMarkDirty();
  if (fromDrag) {
    // 拖拽期间合批进 rAF，绝不同步触发 DOM 回流与重复绘制
    uiDirty = true;
    return;
  }
  uiDirty = false;
  syncUI(latestEval);
  heroLoop.draw();
}

const heroLoop = loop(heroCanvas, (t, dt, { still }) => {
  const target = latestEval.doorOpen;
  const introRunning = !still && !introDone && t < 1.1;
  const diff = target - animOpen;
  const needAnim = !still && (Math.abs(diff) > 0.004 || introRunning);

  if (!heroDirty && !needAnim && !uiDirty) return;
  if (uiDirty) {
    uiDirty = false;
    syncUI(latestEval);
  }
  if (still) {
    animOpen = target;
    introDone = true;
  } else {
    animOpen += diff * Math.min(1, (dt || 0.016) * 8);
    if (Math.abs(target - animOpen) <= 0.004) animOpen = target;
    if (t >= 1.1) introDone = true;
  }
  heroDirty = false;

  if (!cachedSize.heroW) measureHeroSizes();
  const cw = cachedSize.heroW;
  const ch = cachedSize.heroH;
  const dpr = resizeCanvas(heroCanvas, cw, ch);

  hctx.save();
  hctx.scale(dpr, dpr);
  drawCoverArt(hctx, cw, ch, state, latestEval, {
    openOverride: animOpen,
    showGuides: true,
    showClutter: true,
    micro: false,
  });
  hctx.restore();

  // 拖拽高频帧中每 2 帧刷新一次缩略镜，省去一半软渲染开销且肉眼无感
  scopeTick++;
  if (!dragStart || scopeTick % 2 === 0 || still) {
    renderScope(latestEval, animOpen);
  }
});

// ==================== 主封面画布直操（鼠标 + 触摸 + 键盘） ====================
let dragMode = null; // "focal" | "title"
let dragStart = null;
let dragMoved = false;

function canvasNorm(clientX, clientY) {
  const r = heroCanvas.getBoundingClientRect();
  return {
    u: clamp((clientX - r.left) / Math.max(1, r.width), 0, 1),
    v: clamp((clientY - r.top) / Math.max(1, r.height), 0, 1),
  };
}

function hitTest(u, v) {
  const { clutterRects, titleRect } = latestEval.geo;
  for (let i = clutterRects.length - 1; i >= 0; i--) {
    const c = clutterRects[i];
    if (!c.active) continue;
    if (u >= c.x && u <= c.x + c.w && v >= c.y && v <= c.y + c.h) {
      return { kind: "clutter", index: i };
    }
  }
  if (u >= titleRect.x && u <= titleRect.x + titleRect.w && v >= titleRect.y && v <= titleRect.y + titleRect.h) {
    return { kind: "title" };
  }
  return { kind: "focal" };
}

function beginDrag(clientX, clientY) {
  const p = canvasNorm(clientX, clientY);
  const hit = hitTest(p.u, p.v);
  dragMoved = false;
  dragStart = {
    u: p.u,
    v: p.v,
    hit,
    focalU: state.focal.u,
    focalV: state.focal.v,
    titleU: state.title.u,
    titleV: state.title.v,
  };
  dragMode = hit.kind === "title" ? "title" : "focal";
}

function moveDrag(clientX, clientY) {
  if (!dragStart) return;
  const p = canvasNorm(clientX, clientY);
  const du = p.u - dragStart.u;
  const dv = p.v - dragStart.v;
  if (Math.hypot(du, dv) > 0.012) dragMoved = true;
  if (dragMode === "title") {
    state.title.u = clamp(dragStart.titleU + du, 0.14, 0.86);
    state.title.v = clamp(dragStart.titleV + dv, 0.12, 0.78);
  } else {
    state.focal.u = clamp(dragStart.focalU + du, 0.14, 0.92);
    state.focal.v = clamp(dragStart.focalV + dv, 0.18, 0.88);
  }
  updateCover(false, true);
}

function endDrag() {
  if (dragStart && !dragMoved && dragStart.hit.kind === "clutter") {
    state.clutter[dragStart.hit.index] = false;
  }
  dragStart = null;
  dragMode = null;
  updateCover();
}

heroCanvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  beginDrag(e.clientX, e.clientY);
  if (heroCanvas.setPointerCapture) {
    try { heroCanvas.setPointerCapture(e.pointerId); } catch {}
  }
});
heroCanvas.addEventListener("pointermove", (e) => {
  if (!dragStart) return;
  moveDrag(e.clientX, e.clientY);
});
heroCanvas.addEventListener("pointerup", endDrag);
heroCanvas.addEventListener("pointercancel", endDrag);

// 键盘微调焦点与一键去杂讯
heroCanvas.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.06 : 0.025;
  if (e.key === "ArrowLeft") { state.focal.u = clamp(state.focal.u - step, 0.14, 0.92); e.preventDefault(); updateCover(); }
  else if (e.key === "ArrowRight") { state.focal.u = clamp(state.focal.u + step, 0.14, 0.92); e.preventDefault(); updateCover(); }
  else if (e.key === "ArrowUp") { state.focal.v = clamp(state.focal.v - step, 0.18, 0.88); e.preventDefault(); updateCover(); }
  else if (e.key === "ArrowDown") { state.focal.v = clamp(state.focal.v + step, 0.18, 0.88); e.preventDefault(); updateCover(); }
  else if (e.key === "Backspace" || e.key === "Delete") {
    const idx = state.clutter.findIndex(Boolean);
    if (idx >= 0) { state.clutter[idx] = false; e.preventDefault(); updateCover(); }
  }
});

// 控件绑定
document.querySelectorAll(".theme-bar .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    updateCover();
  });
});

document.querySelectorAll(".preset-bar .chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    if (!p) return;
    state.focal = { ...p.focal };
    state.title = { ...p.title };
    state.idPos = p.idPos;
    state.clutter = [...p.clutter];
    state.shelfMask = p.shelfMask;
    updateCover();
  });
});

els.ctrlScale.addEventListener("input", () => {
  state.title.scale = Number(els.ctrlScale.value) / 100;
  updateCover();
});
els.ctrlFocal.addEventListener("input", () => {
  state.focal.r = Number(els.ctrlFocal.value) / 100;
  updateCover();
});
document.querySelectorAll(".seg[data-idpos]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.idPos = btn.dataset.idpos;
    updateCover();
  });
});
els.btnShelf.addEventListener("click", () => {
  state.shelfMask = !state.shelfMask;
  updateCover();
});
els.btnClearClutter.addEventListener("click", () => {
  const any = state.clutter.some(Boolean);
  state.clutter = any ? [false, false, false, false] : [true, true, true, true];
  updateCover();
});

els.diagFix.addEventListener("click", () => {
  const act = els.diagFix.dataset.action;
  if (act === "clear_clutter") state.clutter = [false, false, false, false];
  else if (act === "fix_title_scale") { state.title.scale = 2.85; state.title.u = clamp(state.title.u, 0.28, 0.62); }
  else if (act === "separate_focal") { state.focal.u = 0.80; state.focal.v = 0.60; state.title.u = 0.30; state.title.v = 0.23; }
  else if (act === "fix_identity") state.idPos = "top-left";
  else if (act === "fix_focal_size") state.focal.r = 0.38;
  updateCover();
});

window.addEventListener("resize", () => {
  measureHeroSizes();
  heroDirty = true;
  heroLoop.draw();
  if (typeof archDirty !== "undefined") { archDirty = true; archLoop.draw(); }
  if (shelfMarkDirty) shelfMarkDirty();
});

// ==================== 01 节：五道门闩 X 光分色开关 ====================
const xrayLayers = { identity: true, focal: true, title: true, entry: true, impression: true };
const xrayVerdict = document.getElementById("xray-verdict");
const XRAY_DIAG = {
  identity: "<strong>缺少「建立识别」</strong>：系列线、丛书号与刊头消失了。读者哪怕被图案吸引，也认不出它出自哪家出版方或属于哪套丛书，系列复购与品牌资产断链。",
  focal: "<strong>缺少「视觉焦点」</strong>：箔金大圆抽走后，右侧只剩一片黑洞。2 米外的书店里，这本封面瞬间失去吸睛重心，沦为一张安静但容易被略过的文字卡片。",
  title: "<strong>缺少「明确标题」</strong>：门扉再华丽，读者仍不知道这本写的是建筑、小说还是工具书。没有明确标题，好奇心很难转化成伸手翻开的动作。",
  entry: "<strong>缺少「清晰入口」</strong>：净留白与敞开的门径一旦被密密麻麻的推荐条填满，封面立刻变成嘈杂的传单，眼睛找不到落脚点，也就推不开门。",
  impression: "<strong>缺少「第一印象」</strong>：剥掉黑绒纸色、酒红月与光毯层次后，封面退回干瘪线框。结构仍在，但读字前那股沉稳高级的出版气场散了一半。",
};

function updateXray() {
  for (const key of Object.keys(xrayLayers)) {
    const g = document.getElementById(`xl-${key}`);
    if (g) g.style.display = xrayLayers[key] ? "" : "none";
  }
  const warn = document.getElementById("xl-clutter-warning");
  if (warn) warn.style.display = xrayLayers.entry ? "none" : "";

  const off = Object.entries(xrayLayers).filter(([, v]) => !v).map(([k]) => k);
  if (off.length === 0) {
    xrayVerdict.innerHTML = "<strong>五层全开 · 完整封面</strong>：识别稳在左上安全区，箔金日轮抓眼，象牙标题与暗底形成强反差，敞开的门洞把视线引向内部。试着点关其中一层。";
  } else if (off.length === 1) {
    xrayVerdict.innerHTML = XRAY_DIAG[off[0]];
  } else {
    const names = { identity: "建立识别", focal: "视觉焦点", title: "明确标题", entry: "清晰入口", impression: "第一印象" };
    xrayVerdict.innerHTML = `<strong>同时拿掉了 ${off.length} 道门闩（${off.map((k) => names[k]).join("、")}）</strong>：封面的视觉漏斗已经断裂。逐个把它们合回来，感受每一层重新卡入位置的瞬间。`;
  }
}

document.querySelectorAll(".plate-btn[data-layer]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.layer;
    xrayLayers[k] = !xrayLayers[k];
    btn.classList.toggle("is-on", xrayLayers[k]);
    btn.setAttribute("aria-pressed", String(xrayLayers[k]));
    btn.querySelector(".plate-state").textContent = xrayLayers[k] ? "印版：开" : "印版：关";
    updateXray();
  });
});

// ==================== 02 节：四种经典封面骨架与视线路径回放 ====================
const ARCH_DATA = {
  band: {
    name: "三段水平带（企鹅平装式）",
    nodes: [
      { x: 0.14, y: 0.14, label: "1 顶部识别色带", text: "第一眼扫到顶部高饱和色带与出版徽标，在书架上 2 米外就先凭颜色分出品类（例如小说、侦探或传记）。" },
      { x: 0.20, y: 0.58, label: "2 中央象牙书名带", text: "视线紧接着落进高对比浅色中带：书名居重、作者次之，四周大面积净空确保远看绝不糊字。" },
      { x: 0.50, y: 0.83, label: "3 底部稳重压脚带", text: "下色带与顶部遥相呼应，托住整张封面重心，并把丛书编号或简短副信息收口。" },
      { x: 0.86, y: 0.50, label: "4 顺势翻口入页", text: "三道横向节奏稳住情绪后，视线自然滑向右侧书口，促成翻开内页的动作。" },
    ],
  },
  newsstand: {
    name: "报摊 Z 形扫描（大刊杂志式）",
    nodes: [
      { x: 0.20, y: 0.13, label: "1 顶栏刊头锚点", text: "报摊上层层叠放时，只有最上方刊头完整露出。专有大字体在 0.5 秒内完成品牌点名。" },
      { x: 0.24, y: 0.36, label: "2 左上黄金导语", text: "读者从左向右扫视，加上右侧常被邻刊压住，本期最重磅的独家主打标题必须锁在左上安全列。" },
      { x: 0.68, y: 0.55, label: "3 中央主图焦点", text: "高反差人物侧影或静物主图占稳腹地，与刊头形成景深穿插，负责点燃情绪与好奇。" },
      { x: 0.78, y: 0.86, label: "4 底部条码收尾", text: "期号、定价与零售条码退守底角安全框，不和主标抢戏，又便于收银扫码。" },
    ],
  },
  concept: {
    name: "单一观念大图（观念封面式）",
    nodes: [
      { x: 0.66, y: 0.52, label: "1 一击即中的主意象", text: "整幅封面只讲一个强烈隐喻，砍掉所有零碎导语，让第一眼冲击力直接拉满。" },
      { x: 0.26, y: 0.15, label: "2 极简顶标点题", text: "读者被画面钩住后立刻抬头寻找出处，顶部干净的刊头或一句极短书名把悬念落地。" },
      { x: 0.50, y: 0.84, label: "3 留白托底回味", text: "底缘不塞推销废话，让情绪多停半秒——这种克制本身就是翻开它的动力。" },
    ],
  },
  axial: {
    name: "典籍中轴对称（画册与专著式）",
    nodes: [
      { x: 0.28, y: 0.16, label: "1 中轴序标", text: "作者或卷次居中置顶，细金线划出庄重秩序，传递学术或艺术出版的可信感。" },
      { x: 0.76, y: 0.35, label: "2 宽字距正书名", text: "书名严守中轴线，靠字重与大幅留白立住分寸，不靠艳色嘶吼。" },
      { x: 0.50, y: 0.74, label: "3 居中窗格画心", text: "一幅精致裁切的居中建筑或器物画心托住下半部重心，四边护边等宽克制。" },
    ],
  },
};

const archCanvas = document.getElementById("arch-canvas");
const actx = archCanvas.getContext("2d");
const archNodeBar = document.getElementById("arch-node-bar");
const archExplain = document.getElementById("arch-explain");
let curArch = "band";
let curNode = 0;
let archProg = 1;

function buildArchNodes() {
  const nodes = ARCH_DATA[curArch].nodes;
  archNodeBar.innerHTML = "";
  nodes.forEach((n, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `node-btn${idx === curNode ? " is-active" : ""}`;
    b.textContent = n.label;
    b.addEventListener("click", () => {
      curNode = idx;
      archDirty = true;
      buildArchNodes();
      archLoop.draw();
    });
    archNodeBar.appendChild(b);
  });
  archExplain.textContent = nodes[curNode].text;
}

function drawArch(prog) {
  const r = archCanvas.getBoundingClientRect();
  const cw = r.width || 540;
  const ch = r.height || 390;
  const dpr = resizeCanvas(archCanvas, cw, ch);
  actx.save();
  actx.scale(dpr, dpr);

  actx.fillStyle = "#14120E";
  actx.fillRect(0, 0, cw, ch);

  // 中央摆放一本 3:4 立体样书
  const bh = ch * 0.84;
  const bw = bh * 0.75;
  const bx = (cw - bw) / 2;
  const by = (ch - bh) / 2;

  // 书本右侧内页厚度（立体翻口）
  actx.fillStyle = "#D8C8AC";
  actx.fillRect(bx + bw, by + 5, 9, bh - 10);
  actx.strokeStyle = "#845825";
  actx.beginPath();
  actx.moveTo(bx + bw + 3, by + 6); actx.lineTo(bx + bw + 3, by + bh - 6);
  actx.moveTo(bx + bw + 6, by + 6); actx.lineTo(bx + bw + 6, by + bh - 6);
  actx.stroke();

  // 封面底版
  actx.fillStyle = "#1D1913";
  actx.fillRect(bx, by, bw, bh);
  actx.strokeStyle = "#6F5936";
  actx.lineWidth = 1.4;
  actx.strokeRect(bx, by, bw, bh);

  // 绘制各自经典几何骨架
  if (curArch === "band") {
    actx.fillStyle = "#5F0F0C";
    actx.fillRect(bx, by, bw, bh * 0.28);
    actx.fillRect(bx, by + bh * 0.68, bw, bh * 0.32);
    actx.fillStyle = "#EFE3CE";
    actx.fillRect(bx, by + bh * 0.28, bw, bh * 0.40);
    actx.fillStyle = "#14120E";
    actx.font = `900 ${Math.round(bh * 0.08)}px "Noto Sans SC", sans-serif`;
    actx.textAlign = "center";
    actx.fillText("平装典藏", bx + bw / 2, by + bh * 0.49);
    actx.fillStyle = "#E5B763";
    actx.font = `700 ${Math.round(bh * 0.042)}px "Outfit", sans-serif`;
    actx.fillText("SERIES EDITION", bx + bw / 2, by + bh * 0.16);
  } else if (curArch === "newsstand") {
    actx.fillStyle = "#E5B763";
    actx.font = `700 ${Math.round(bh * 0.095)}px "Playfair Display", Georgia, serif`;
    actx.textAlign = "center";
    actx.fillText("ATELIER", bx + bw / 2, by + bh * 0.16);
    actx.fillStyle = "#C79545";
    actx.beginPath();
    actx.arc(bx + bw * 0.62, by + bh * 0.56, bw * 0.28, 0, Math.PI * 2);
    actx.fill();
    actx.fillStyle = "#0B0A08";
    actx.fillRect(bx + bw * 0.55, by + bh * 0.44, bw * 0.16, bh * 0.26);
    actx.fillStyle = "#EFE3CE";
    actx.fillRect(bx + bw * 0.09, by + bh * 0.30, bw * 0.32, bh * 0.045);
    actx.fillRect(bx + bw * 0.09, by + bh * 0.37, bw * 0.25, bh * 0.03);
    actx.fillStyle = "#EFE3CE";
    actx.fillRect(bx + bw * 0.68, by + bh * 0.82, bw * 0.22, bh * 0.10);
  } else if (curArch === "concept") {
    actx.fillStyle = "#C79545";
    actx.beginPath();
    actx.arc(bx + bw * 0.50, by + bh * 0.50, bw * 0.36, 0, Math.PI * 2);
    actx.fill();
    actx.fillStyle = "#0B0A08";
    actx.fillRect(bx + bw * 0.37, by + bh * 0.34, bw * 0.26, bh * 0.36);
    actx.fillStyle = "#EFE3CE";
    actx.beginPath();
    actx.moveTo(bx + bw * 0.38, by + bh * 0.36);
    actx.lineTo(bx + bw * 0.54, by + bh * 0.40);
    actx.lineTo(bx + bw * 0.54, by + bh * 0.66);
    actx.lineTo(bx + bw * 0.38, by + bh * 0.70);
    actx.closePath();
    actx.fill();
    actx.fillStyle = "#EFE3CE";
    actx.font = `700 ${Math.round(bh * 0.07)}px "Playfair Display", Georgia, serif`;
    actx.textAlign = "center";
    actx.fillText("ENTRY", bx + bw / 2, by + bh * 0.17);
  } else {
    actx.strokeStyle = "rgba(229,183,99,0.45)";
    actx.setLineDash([4, 4]);
    actx.beginPath();
    actx.moveTo(bx + bw / 2, by + 12);
    actx.lineTo(bx + bw / 2, by + bh - 12);
    actx.stroke();
    actx.setLineDash([]);
    actx.fillStyle = "#E5B763";
    actx.font = `600 ${Math.round(bh * 0.036)}px "Outfit", sans-serif`;
    actx.textAlign = "center";
    actx.fillText("VOL. IV", bx + bw / 2, by + bh * 0.17);
    actx.fillStyle = "#EFE3CE";
    actx.font = `400 ${Math.round(bh * 0.088)}px "ZCOOL XiaoWei", "Noto Sans SC", serif`;
    actx.fillText("建筑与光", bx + bw / 2, by + bh * 0.35);
    actx.fillStyle = "#5F0F0C";
    actx.fillRect(bx + bw * 0.22, by + bh * 0.49, bw * 0.56, bh * 0.38);
    actx.fillStyle = "#C79545";
    actx.beginPath();
    actx.arc(bx + bw * 0.5, by + bh * 0.68, bw * 0.16, 0, Math.PI * 2);
    actx.fill();
  }

  // 绘制金丝视线路径 1 → 2 → 3 → 4
  const nodes = ARCH_DATA[curArch].nodes;
  const pts = nodes.map((n) => ({ x: bx + n.x * bw, y: by + n.y * bh }));
  actx.save();
  actx.strokeStyle = "#F5CB76";
  actx.lineWidth = 2.4;
  actx.beginPath();
  for (let i = 0; i < pts.length - 1; i++) {
    const segP = clamp(prog * (pts.length - 1) - i, 0, 1);
    if (segP <= 0) break;
    const p0 = pts[i];
    const p1 = pts[i + 1];
    actx.moveTo(p0.x, p0.y);
    actx.lineTo(p0.x + (p1.x - p0.x) * segP, p0.y + (p1.y - p0.y) * segP);
  }
  actx.stroke();

  // 节点圆标（半径按样书高度比例缩放，窄屏不压字）
  const rAct = clamp(bh * 0.048, 10, 14);
  const rIdle = clamp(bh * 0.039, 8.5, 11.5);
  const nodeFont = Math.round(clamp(bh * 0.042, 10, 13));
  pts.forEach((p, idx) => {
    const active = idx === curNode;
    actx.beginPath();
    actx.arc(p.x, p.y, active ? rAct : rIdle, 0, Math.PI * 2);
    actx.fillStyle = active ? "#E5B763" : "#14120E";
    actx.fill();
    actx.strokeStyle = active ? "#FAF4E8" : "#E5B763";
    actx.lineWidth = active ? 2.2 : 1.6;
    actx.stroke();

    actx.fillStyle = active ? "#14120E" : "#FAF4E8";
    actx.font = `700 ${nodeFont}px "DM Mono", monospace`;
    actx.textAlign = "center";
    actx.textBaseline = "middle";
    actx.fillText(String(idx + 1), p.x, p.y + 0.5);
  });
  actx.restore();

  actx.restore();
}

let archDirty = true;
const archLoop = loop(archCanvas, (t, dt, { still }) => {
  if (still) {
    if (!archDirty && archProg >= 1) return;
    archProg = 1;
    archDirty = false;
    drawArch(1);
    return;
  }
  if (archProg < 1) {
    archProg = Math.min(1, archProg + (dt || 0.016) * 2.4);
    archDirty = false;
    drawArch(archProg);
  } else if (archDirty) {
    archDirty = false;
    drawArch(1);
  }
});

archCanvas.addEventListener("click", (e) => {
  const r = archCanvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  const bh = r.height * 0.84;
  const bw = bh * 0.75;
  const bx = (r.width - bw) / 2;
  const by = (r.height - bh) / 2;
  const nodes = ARCH_DATA[curArch].nodes;
  let best = curNode;
  let bestD = 32;
  nodes.forEach((n, idx) => {
    const d = Math.hypot(mx - (bx + n.x * bw), my - (by + n.y * bh));
    if (d < bestD) { bestD = d; best = idx; }
  });
  if (best !== curNode) {
    curNode = best;
    archDirty = true;
    buildArchNodes();
    archLoop.draw();
  }
});

document.querySelectorAll(".arch-card[data-arch]").forEach((btn) => {
  btn.addEventListener("click", () => {
    curArch = btn.dataset.arch;
    curNode = 0;
    archProg = reducedMotion.matches ? 1 : 0;
    archDirty = true;
    document.querySelectorAll(".arch-card[data-arch]").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    buildArchNodes();
    archLoop.draw();
  });
});
buildArchNodes();

// ==================== 03 节：五本竞争书架 × 三种距离实测 ====================
const shelfCanvas = document.getElementById("shelf-canvas");
const shctx = shelfCanvas.getContext("2d");
const shelfDist = document.getElementById("shelf-dist");
const shelfDistVal = document.getElementById("shelf-dist-val");
const shelfReadout = document.getElementById("shelf-readout");
let shelfMode = "rack";

const NEIGHBORS = [
  { bg: "#2B3D4F", accent: "#E7A857", title: "海港志", sub: "HARBOR", style: "band" },
  { bg: "#ECE2CF", accent: "#A32A24", title: "植物图谱", sub: "FLORA", style: "circle" },
  // 索引 2 是用户的活体封面
  null,
  { bg: "#23362B", accent: "#D9C79E", title: "山居笔记", sub: "CABIN", style: "frame" },
  { bg: "#6F211B", accent: "#F2DEC0", title: "红砖与光", sub: "BRICK", style: "split" },
];

function drawNeighbor(ctx, x, y, w, h, nb) {
  ctx.save();
  ctx.fillStyle = nb.bg;
  ctx.fillRect(x, y, w, h);
  if (nb.style === "band") {
    ctx.fillStyle = nb.accent;
    ctx.fillRect(x, y + h * 0.56, w, h * 0.24);
  } else if (nb.style === "circle") {
    ctx.fillStyle = nb.accent;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.62, w * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (nb.style === "frame") {
    ctx.strokeStyle = nb.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76);
  } else {
    ctx.fillStyle = nb.accent;
    ctx.fillRect(x + w * 0.52, y, w * 0.48, h);
  }
  ctx.fillStyle = nb.bg === "#ECE2CF" ? "#1C1915" : "#FAF4E8";
  ctx.font = `900 ${Math.max(9, Math.round(h * 0.11))}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(nb.title, x + w * 0.5, y + h * 0.34);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

const SHELF_LOW = document.createElement("canvas");
const shLowCtx = SHELF_LOW.getContext("2d");

function drawShelf() {
  const r = shelfCanvas.getBoundingClientRect();
  const cw = r.width || 920;
  const ch = r.height || 320;
  const dpr = resizeCanvas(shelfCanvas, cw, ch);
  const distM = Number(shelfDist.value) / 100;
  shelfDistVal.textContent = `${distM.toFixed(2)} m`;

  shctx.save();
  shctx.scale(dpr, dpr);
  shctx.fillStyle = "#100E0B";
  shctx.fillRect(0, 0, cw, ch);

  if (shelfMode === "rack") {
    shctx.fillStyle = "#261E15";
    shctx.fillRect(0, ch * 0.84, cw, ch * 0.16);
    shctx.fillStyle = "#4A3A27";
    shctx.fillRect(0, ch * 0.84, cw, 3);
  }

  const scaleFactor = shelfMode === "grid"
    ? clamp(0.62 - (distM - 0.3) * 0.12, 0.32, 0.62)
    : shelfMode === "desk"
      ? clamp(1.05 - (distM - 0.3) * 0.14, 0.66, 1.05)
      : clamp(0.95 - (distM - 0.3) * 0.18, 0.46, 0.95);

  const bookH = Math.min(ch * 0.78, ch * 0.82 * scaleFactor);
  const bookW = bookH * 0.75;
  const overlap = shelfMode === "rack" ? -bookW * 0.24 : bookW * 0.22;
  const totalW = bookW * 5 + overlap * 4;
  const startX = (cw - totalW) / 2;
  const topY = shelfMode === "rack" ? ch * 0.84 - bookH : (ch - bookH) / 2;

  // 用低分辨率离屏采样代替昂贵 ctx.filter blur，模拟真实远距视力衰减且零卡顿
  const down = distM > 0.9 ? clamp(1 - (distM - 0.9) * 0.30, 0.32, 1) : 1;
  const lw = Math.max(120, Math.round(cw * down));
  const lh = Math.max(48, Math.round(ch * down));
  if (SHELF_LOW.width !== lw || SHELF_LOW.height !== lh) {
    SHELF_LOW.width = lw;
    SHELF_LOW.height = lh;
  }
  shLowCtx.save();
  shLowCtx.clearRect(0, 0, lw, lh);
  shLowCtx.scale(lw / cw, lh / ch);
  for (let i = 0; i < 5; i++) {
    const x = startX + i * (bookW + overlap);
    if (i === 2) {
      shLowCtx.save();
      shLowCtx.translate(x, topY);
      drawCoverArt(shLowCtx, bookW, bookH, state, latestEval, {
        openOverride: latestEval.doorOpen,
        showGuides: false,
        showClutter: true,
        micro: bookW < 95 || down < 0.65,
      });
      shLowCtx.restore();
      shLowCtx.strokeStyle = "#E5B763";
      shLowCtx.lineWidth = 2;
      shLowCtx.strokeRect(x - 1, topY - 1, bookW + 2, bookH + 2);
    } else {
      drawNeighbor(shLowCtx, x, topY, bookW, bookH, NEIGHBORS[i]);
    }
  }
  shLowCtx.restore();

  shctx.imageSmoothingEnabled = true;
  shctx.imageSmoothingQuality = "medium";
  shctx.drawImage(SHELF_LOW, 0, 0, cw, ch);

  const myX = startX + 2 * (bookW + overlap) + bookW / 2;
  shctx.fillStyle = "#E5B763";
  shctx.font = `700 12px "Noto Sans SC", sans-serif`;
  shctx.textAlign = "center";
  shctx.fillText("▲ 你正在调校的 160 封面", myX, Math.min(ch - 10, topY + bookH + 20));
  shctx.restore();

  const { score, metrics } = latestEval;
  const modeDesc =
    shelfMode === "rack"
      ? `书店叠放架（${distM.toFixed(1)} 米）：后一本的右侧 24% 正被邻书压住。`
      : shelfMode === "grid"
        ? `电商瀑布流缩略图（约 ${Math.round(bookW)}px 宽）：细小副标与花哨腰封几乎完全糊成噪点。`
        : `书桌手持近看（${distM.toFixed(1)} 米）：此时才能细品金箔质感、小号落款与纸张留白。`;
  const stateDesc =
    score === 4
      ? `你的封面当前 4/4 通畅（主副比 ${metrics.titleRatio.toFixed(1)}×、对比 ${metrics.contrast}:1、识别露出 ${metrics.idExposure}%），即使混在四本彩色邻书之间，依然能凭深黑底与箔金日轮稳稳跳出。`
      : `你的封面当前仅 ${score}/4（${latestEval.fault ? latestEval.fault.badge : "待整版"}）。拉远到 2 米再对照邻书看，缺陷会比在桌案前放大三倍——回到开场打样台修好它，这里的书架会实时同步变化。`;
  shelfReadout.textContent = `${modeDesc} ${stateDesc}`;
}

let shelfDirty = true;
const shelfLoop = loop(shelfCanvas, () => {
  if (!shelfDirty) return;
  shelfDirty = false;
  drawShelf();
});
shelfMarkDirty = () => {
  shelfDirty = true;
};
const triggerShelfNow = () => {
  shelfDirty = true;
  shelfLoop.draw();
};
shelfDist.addEventListener("input", triggerShelfNow);
document.querySelectorAll(".shelf-modes .pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    shelfMode = btn.dataset.shelf;
    document.querySelectorAll(".shelf-modes .pill").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    triggerShelfNow();
  });
});

// ==================== 04 节：出版历史时间轴（核实史料） ====================
const ERAS = [
  {
    meta: "1935 · 伦敦 · Penguin Books（Design Museum）",
    heading: "爱德华·杨的三段水平色带",
    body: "艾伦·莱恩创立企鹅平装书时，21 岁职员爱德华·杨画出了企鹅标，并确立经典的水平三段封面：上下两道纯色带直接按品类编码（橙色文学、绿色侦探、蓝色传记），中央白带干净印上书名与作者。在当时满街廉价花哨插画的平装书里，单靠这套克制的结构就建立了极高识别度。",
    legacy: "留给今天：系列化出版物不用靠「每本重新发明配色」，用固定色带与清晰书名区就能让整排书自带识别。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#D4662A"/><rect y="74" width="180" height="92" fill="#F5EFE2"/><line x1="20" y1="84" x2="160" y2="84" stroke="#16130F" stroke-width="1.5"/><line x1="20" y1="156" x2="160" y2="156" stroke="#16130F" stroke-width="1.5"/><text x="90" y="114" text-anchor="middle" font-size="14" font-weight="900" fill="#16130F">BOOK TITLE</text><text x="90" y="138" text-anchor="middle" font-size="10" fill="#4A4135">AUTHOR NAME</text><ellipse cx="90" cy="204" rx="14" ry="18" fill="#F5EFE2"/><ellipse cx="90" cy="204" rx="8" ry="11" fill="#16130F"/></svg>`,
  },
  {
    meta: "1934–1958 · 纽约 · Harper's Bazaar（Britannica）",
    heading: "布罗多维奇：用留白把封面做成序曲",
    body: "阿列克谢·布罗多维奇出任《时尚芭莎》艺术总监长达二十四年。他撤掉了当时盛行的繁复花边和满版插画，改用高反差衬线刊头、现代动态摄影与大片留白，把封面当作整期杂志的视觉序曲，而非塞满导语的目录单。",
    legacy: "留给今天：留白不是「没东西填」，而是让主图和刊头呼吸、提升第一印象气场的昂贵空间。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#F6EFE2"/><text x="90" y="42" text-anchor="middle" font-size="24" font-family="Playfair Display, serif" font-weight="700" fill="#16130F">BAZAAR</text><circle cx="104" cy="146" r="46" fill="#5F0F0C"/><path d="M56 184 Q92 98 136 164" fill="none" stroke="#E5B763" stroke-width="3"/><rect x="18" y="198" width="44" height="4" fill="#16130F"/></svg>`,
  },
  {
    meta: "1941–1948 · 纽约 · New Directions（Cooper Hewitt）",
    heading: "阿尔文·拉斯蒂格：用抽象符号替文学开口",
    body: "从 1941 年《心灵的智慧》到 1947 年《了不起的盖茨比》与 1948 年《帕特森》，美国现代主义设计师阿尔文·拉斯蒂格不再把书封画成故事插图，而是通读原稿后，用大胆色块、抽象线条与现代字形提炼作品的精神节奏。",
    legacy: "留给今天：好封面不必直白复述情节，一个切中气质的视觉隐喻（如 160 原海报的「敞开之门」）更耐久。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#1A1713"/><polygon points="24,18 156,18 120,126 24,110" fill="#C79545"/><circle cx="122" cy="162" r="38" fill="#7D1714"/><path d="M24 148 L150 218" stroke="#EFE3CE" stroke-width="4"/><text x="28" y="218" font-size="11" font-weight="700" fill="#EFE3CE">NEW CLASSICS</text></svg>`,
  },
  {
    meta: "1947–1949 · 伦敦 · Penguin Composition Rules（Design Museum）",
    heading: "扬·奇肖尔德：用排版纪律收紧企鹅经典",
    body: "二战后企鹅各印厂排版参差不齐。1947 年，德国排版大师扬·奇肖尔德受邀出任企鹅排版主管，撰写《企鹅排版规范》。他没有推翻爱德华·杨的三段结构，而是逐毫米校准线粗、字距、行距与主副标题层级，让廉价平装书拥有了经典精装书的秩序感。",
    legacy: "留给今天：好骨架还得靠细部字距与层级比例撑住——只差 10% 的字号比，精致与粗糙就会立分高下。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#F4EBDC"/><rect x="0" y="0" width="180" height="62" fill="#185C3E"/><rect x="0" y="176" width="180" height="64" fill="#185C3E"/><line x1="16" y1="68" x2="164" y2="68" stroke="#185C3E" stroke-width="1"/><line x1="16" y1="170" x2="164" y2="170" stroke="#185C3E" stroke-width="1"/><line x1="90" y1="68" x2="90" y2="170" stroke="#C79545" stroke-dasharray="3 3"/><text x="90" y="106" text-anchor="middle" font-size="11" letter-spacing="3" fill="#16130F">PRECISION</text><text x="90" y="132" text-anchor="middle" font-size="16" font-weight="900" fill="#16130F">GRID RULES</text></svg>`,
  },
  {
    meta: "1961–1962 · 伦敦 · Penguin Crime（Eye Magazine）",
    heading: "罗梅克·马伯：黄金比例的「马伯网格」",
    body: "1961 年，企鹅艺术总监杰尔马诺·法切蒂邀请波兰裔设计师罗梅克·马伯为侦探系列设计新网格，1962 年大举推开。马伯依据接近黄金分割的比例为 A 开本平装书划出严谨网格：上方固定排字区统一安放丛书标、书名与作者，下方约三分之二版面完全开放给摄影、拼贴与图形意象，随后推广至多个企鹅书系。",
    legacy: "留给今天：既要品牌统一、又要每本出彩？把识别与标题锁进上方固定网格，把下方舞台彻底让给视觉焦点。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#1E5B42"/><rect x="0" y="0" width="180" height="84" fill="#F6F0E4"/><line x1="0" y1="26" x2="180" y2="26" stroke="#1E5B42" stroke-width="1"/><line x1="0" y1="54" x2="180" y2="54" stroke="#1E5B42" stroke-width="1"/><text x="14" y="18" font-size="9" font-weight="700" fill="#1E5B42">CRIME</text><text x="14" y="45" font-size="13" font-weight="900" fill="#16130F">THE MARBER GRID</text><text x="14" y="72" font-size="10" fill="#4A4135">ROMEK MARBER · 1962</text><circle cx="96" cy="164" r="46" fill="#14120E"/><circle cx="114" cy="154" r="14" fill="#E5B763"/></svg>`,
  },
  {
    meta: "1962–1972 · 纽约 · Esquire / MoMA 特展（MoMA）",
    heading: "乔治·路易斯：把杂志封面做成观念炸弹",
    body: "1962 至 1972 年间，乔治·路易斯为《Esquire》创作了 92 期观念封面；纽约现代艺术博物馆（MoMA）将代表作收入馆藏，并于 2008–2009 年举办特展《George Lois: The Esquire Covers》。他敢在报摊竞争最白热化的年代砍掉满版小导语，只靠一个直击时代神经的单焦点画面配干净刊头，证明了「少即更响」。",
    legacy: "留给今天：当你的核心视觉焦点本身足够有戏，删掉多余卖点条反而能让点击与拿起率成倍放大。",
    svg: `<svg viewBox="0 0 180 240"><rect width="180" height="240" fill="#14120E"/><text x="90" y="40" text-anchor="middle" font-size="26" font-family="Playfair Display, serif" font-style="italic" font-weight="700" fill="#EFE3CE">Esquire</text><circle cx="90" cy="142" r="56" fill="#7D1714"/><rect x="70" y="106" width="40" height="72" fill="#EFE3CE"/><circle cx="90" cy="142" r="10" fill="#14120E"/></svg>`,
  },
];

function selectEra(idx) {
  const e = ERAS[idx];
  document.getElementById("era-blueprint").innerHTML = e.svg;
  document.getElementById("era-meta").textContent = e.meta;
  document.getElementById("era-heading").textContent = e.heading;
  document.getElementById("era-body").textContent = e.body;
  document.getElementById("era-legacy").textContent = e.legacy;
  document.querySelectorAll(".yr-btn").forEach((b, i) => {
    const on = i === idx;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
}

document.querySelectorAll(".yr-btn").forEach((btn) => {
  btn.addEventListener("click", () => selectEra(Number(btn.dataset.era)));
});
selectEra(0);

// ==================== 05 节：真实场景翻牌 ====================
document.querySelectorAll(".case-card").forEach((card) => {
  card.addEventListener("click", () => {
    const open = card.getAttribute("aria-expanded") === "true";
    card.setAttribute("aria-expanded", String(!open));
  });
});

// ==================== 06 节：四选一审稿实战 ====================
const QUIZ_FEEDBACK = {
  A: {
    ok: false,
    title: "选 A 会吃亏：主副标题字号比只有 1.25×，远看一片平",
    body: "虽然识别带安全、焦点也在让道，但《城市光学笔记》和下面两行副标字号太接近。打开上方「2.5 米远距缩略复验」看一眼：缩远后三行字立刻糊成一块，读者分不清哪句才是书名。",
  },
  B: {
    ok: false,
    title: "选 B 会吃亏：字够大，却直接压进了亮金日轮里",
    body: "象牙白大标横跨亮金圆盘与象牙白门扉，局部明暗对比度跌破 2.2:1，字体笔画在光晕里融化了。大字如果没有干净的高反差底场托着，远看照样认不出。",
  },
  C: {
    ok: true,
    title: "选对了！C 稿在 2.5 米远看与 30cm 细看下都稳稳立住",
    body: "左上安全区清晰给出丛书识别；主标字号拉到副标的约 2.7 倍并稳稳坐落在左侧深黑负空间（对比度 > 12:1）；右侧箔金门扉完整让道、零冗余腰封堵门。打开远距复验，一眼就能看清它和其余三稿的差距。",
  },
  D: {
    ok: false,
    title: "选 D 会吃亏：书名立住了，却用三条卖点把入口门洞堵死",
    body: "D 稿的主标字号、对比度与左上识别都和 C 稿完全一样，但下方塞进两块红底推荐贴和长腰封，把敞开的门洞与光毯切割得支离破碎。打开「2.5 米远距缩略复验」就能看出：多了三条「帮腔」字块后，整张封面反而失去了呼吸入口。",
  },
};

const quizGrid = document.getElementById("quiz-grid");
const quizVerdict = document.getElementById("quiz-verdict");
const qvTitle = document.getElementById("qv-title");
const qvBody = document.getElementById("qv-body");
const quizDistBtn = document.getElementById("quiz-dist-toggle");

quizDistBtn.addEventListener("click", () => {
  const on = quizGrid.classList.toggle("is-far");
  quizDistBtn.classList.toggle("is-active", on);
  quizDistBtn.setAttribute("aria-pressed", String(on));
  quizDistBtn.textContent = on ? "关闭 2.5 米远距复验" : "开启 2.5 米远距缩略复验";
});

document.querySelectorAll(".quiz-card").forEach((card) => {
  card.addEventListener("click", () => {
    const pick = card.dataset.choice;
    const fb = QUIZ_FEEDBACK[pick];
    document.querySelectorAll(".quiz-card").forEach((c) => {
      c.classList.remove("is-picked", "is-right", "is-wrong");
      c.setAttribute("aria-pressed", String(c === card));
      if (c.dataset.choice === "C") c.classList.add("is-right");
    });
    card.classList.add("is-picked", fb.ok ? "is-right" : "is-wrong");
    quizVerdict.classList.toggle("is-right", fb.ok);
    quizVerdict.classList.toggle("is-wrong", !fb.ok);
    qvTitle.textContent = fb.title;
    qvBody.textContent = fb.body;
  });
});

// ==================== 07 节：原海报放大与拖动灯箱 ====================
const posterImg = document.getElementById("poster");
const posterBtn = document.getElementById("poster-btn");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbStage = document.getElementById("lb-stage");
const lbReset = document.getElementById("lb-zoom-reset");
let lbScale = 1, lbX = 0, lbY = 0, lbDrag = null;

function applyLb() {
  lbImg.style.transform = `translate(${lbX}px, ${lbY}px) scale(${lbScale})`;
  lbReset.textContent = `${Math.round(lbScale * 100)}%`;
}
function openLb() {
  lbImg.src = posterImg.src;
  lbScale = 1; lbX = 0; lbY = 0;
  applyLb();
  lightbox.hidden = false;
  document.getElementById("lb-close").focus();
}
function closeLb() {
  lightbox.hidden = true;
  posterBtn.focus();
}
posterBtn.addEventListener("click", openLb);
document.getElementById("lb-close").addEventListener("click", closeLb);
document.getElementById("lb-zoom-in").addEventListener("click", () => { lbScale = clamp(lbScale + 0.35, 0.7, 3.2); applyLb(); });
document.getElementById("lb-zoom-out").addEventListener("click", () => { lbScale = clamp(lbScale - 0.35, 0.7, 3.2); applyLb(); });
lbReset.addEventListener("click", () => { lbScale = 1; lbX = 0; lbY = 0; applyLb(); });
lbStage.addEventListener("wheel", (e) => {
  e.preventDefault();
  lbScale = clamp(lbScale + (e.deltaY < 0 ? 0.2 : -0.2), 0.7, 3.2);
  applyLb();
}, { passive: false });
lbStage.addEventListener("pointerdown", (e) => {
  if (e.target === lbStage && lbScale <= 1.05) { closeLb(); return; }
  lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
  try { lbStage.setPointerCapture(e.pointerId); } catch {}
});
lbStage.addEventListener("pointermove", (e) => {
  if (!lbDrag) return;
  lbX = e.clientX - lbDrag.x;
  lbY = e.clientY - lbDrag.y;
  applyLb();
});
lbStage.addEventListener("pointerup", () => { lbDrag = null; });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLb();
});

// 初始同步一次界面并绘制第一帧
updateCover(true);
