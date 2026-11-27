// 096 开场主角玩具：主次引力盘 · 推拉赋权台（2D Canvas + 单真源联动全部控件）
import { loop, pixelRatio, reducedMotion } from "../../lib/stage.js";
import {
  PALETTE,
  SCENES,
  LEVER_META,
  LEVEL_LABELS,
  PRESETS,
  createInitialState,
  applyPreset,
  computeLayout,
  mixHex,
} from "./model.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 预先做一块 128×128 手工陶土颗粒底纹（只生成一次，60fps 零负担）
function createClayPattern(ctx) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const g = tile.getContext("2d");
  let seed = 96041;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 620; i++) {
    const x = rand() * 128;
    const y = rand() * 128;
    const r = 0.5 + rand() * 1.3;
    g.fillStyle = rand() > 0.5 ? "rgba(255,244,225,0.095)" : "rgba(50,33,23,0.065)";
    g.fillRect(x, y, r, r);
  }
  return ctx.createPattern(tile, "repeat");
}

function drawPolygon(ctx, cx, cy, r, sides, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r * 1.08 : r * 0.58;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSquircle(ctx, cx, cy, r) {
  const s = r * 0.94;
  const rad = s * 0.36;
  ctx.beginPath();
  ctx.roundRect(cx - s, cy - s, s * 2, s * 2, rad);
  ctx.closePath();
}

function traceNodeShape(ctx, shape, cx, cy, r) {
  if (shape === "diamond") drawPolygon(ctx, cx, cy, r * 1.12, 4, 0);
  else if (shape === "hex") drawPolygon(ctx, cx, cy, r * 1.05, 6, Math.PI / 6);
  else if (shape === "oct") drawPolygon(ctx, cx, cy, r * 1.03, 8, Math.PI / 8);
  else if (shape === "star") drawStar(ctx, cx, cy, r);
  else if (shape === "squircle") drawSquircle(ctx, cx, cy, r);
  else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
}

export function initHeroStage() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const clayPattern = createClayPattern(ctx);

  const state = createInitialState();

  // DOM 绑定
  const elTopBadge = document.getElementById("hero-top-badge");
  const elCanvasBadge = document.getElementById("canvas-status-badge");
  const elHudMeta = document.getElementById("canvas-hud-meta");
  const elDiagBadge = document.getElementById("diag-badge");
  const elDiagTier = document.getElementById("diag-tier");
  const elDiagHead = document.getElementById("diag-headline");
  const elDiagWhy = document.getElementById("diag-why");
  const elDiagAction = document.getElementById("diag-action");
  const elMobileDiag = document.getElementById("mobile-diag-text");
  const elTipDynamic = document.getElementById("tip-dynamic");

  const elDomRange = document.getElementById("ctrl-dominance");
  const elDomVal = document.getElementById("val-dominance");
  const elFadeRange = document.getElementById("ctrl-fade");
  const elFadeVal = document.getElementById("val-fade");
  const elHarmonyBtn = document.getElementById("btn-harmony");
  const elRivalBtn = document.getElementById("btn-rival");
  const elWeightBtn = document.getElementById("btn-weights");
  const elScanBtn = document.getElementById("btn-scan");
  const elMobileScanBtn = document.getElementById("btn-mobile-scan");
  const elCalibrateBtns = document.querySelectorAll("[data-action='calibrate']");
  const elResetChaosBtns = document.querySelectorAll("[data-action='reset-chaos']");
  const elSceneBtns = document.querySelectorAll("[data-scene]");
  const elPresetBtns = document.querySelectorAll("[data-preset]");
  const elLeverRows = document.querySelectorAll("[data-lever]");
  const elRuleItems = document.querySelectorAll("[data-rule]");
  const elLiveCompareState = document.getElementById("live-compare-state");
  const elLiveCompareMeta = document.getElementById("live-compare-meta");

  // 动画插值状态（平滑过渡几何位置与半径）
  let animNodes = null;
  let dirty = true;
  let introProgress = reducedMotion.matches ? 1 : 0;
  let scanTime = -1; // >= 0 时正在放飞视线验径光珠
  let lastLayout = null;
  let viewW = 720;
  let viewH = 440;
  let hoverIdx = -1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    viewW = Math.round(rect.width);
    viewH = Math.round(rect.height);
    const pw = Math.round(viewW * dpr);
    const ph = Math.round(viewH * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function syncUI(audit) {
    // 顶部与画布角标
    const okClass = audit.isClear ? "is-ok" : "is-warn";
    for (const el of [elTopBadge, elCanvasBadge, elDiagBadge]) {
      if (!el) continue;
      el.textContent = audit.badge;
      el.classList.toggle("is-ok", audit.isClear);
      el.classList.toggle("is-warn", !audit.isClear);
    }

    if (elHudMeta) {
      elHudMeta.textContent = `主导 ${Math.round(audit.primaryShare)}% · 主/次 ${audit.topRatio.toFixed(2)}× · ${audit.activeLevers} 维对比`;
    }
    if (elDiagTier) elDiagTier.textContent = `关系档位：${audit.tier}（示意）`;
    if (elDiagHead) elDiagHead.textContent = audit.headline;
    if (elDiagWhy) elDiagWhy.textContent = audit.why;
    if (elDiagAction) elDiagAction.textContent = audit.action;
    if (elMobileDiag) elMobileDiag.textContent = `${audit.badge} — ${audit.headline}`;
    if (elTipDynamic) {
      elTipDynamic.textContent = audit.isClear
        ? `当前已达成 4/4 主次清晰（主导 ${Math.round(audit.primaryShare)}%，主/次 ${audit.topRatio.toFixed(2)}×）。`
        : `待调提示：${audit.action}`;
    }

    // 同步滑杆读数
    if (elDomRange) elDomRange.value = String(Math.round(state.dominance));
    if (elDomVal) elDomVal.textContent = `${Math.round(state.dominance)}%`;
    if (elFadeRange) elFadeRange.value = String(Math.round(100 - state.secondaryFade));
    if (elFadeVal) elFadeVal.textContent = `${Math.round(100 - state.secondaryFade)}%`;

    // 同步协调、抢戏与标尺开关
    if (elHarmonyBtn) {
      elHarmonyBtn.textContent = state.harmony ? "风格协调：同族统一" : "风格协调：异色割裂";
      elHarmonyBtn.setAttribute("aria-pressed", String(state.harmony));
      elHarmonyBtn.classList.toggle("is-alert", !state.harmony);
      elHarmonyBtn.classList.toggle("is-on", state.harmony);
    }
    if (elRivalBtn) {
      const hasRival = state.rivalIndex >= 0 && state.rivalIndex !== state.primaryIndex;
      elRivalBtn.textContent = hasRival ? "次角抢戏：开（点此卸除）" : "次角抢戏：关";
      elRivalBtn.setAttribute("aria-pressed", String(hasRival));
      elRivalBtn.classList.toggle("is-alert", hasRival);
    }
    if (elWeightBtn) {
      elWeightBtn.textContent = state.showWeights ? "重量环：开" : "重量环：关";
      elWeightBtn.setAttribute("aria-pressed", String(state.showWeights));
    }

    // 同步三语境切签
    elSceneBtns.forEach((btn) => {
      const active = btn.dataset.scene === state.scene;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    // 同步右侧深焙咖啡四原则竖轴
    elRuleItems.forEach((el) => {
      const rule = audit.rules.find((r) => r.key === el.dataset.rule);
      if (!rule) return;
      el.classList.toggle("is-pass", rule.pass);
      el.classList.toggle("is-fail", !rule.pass);
      const chip = el.querySelector(".rule-chip");
      if (chip) chip.textContent = rule.chip;
    });

    // 同步下段窑红六对比工具箱
    elLeverRows.forEach((row) => {
      const key = row.dataset.lever;
      const lvl = state.levers[key] ?? 0;
      row.dataset.level = String(lvl);
      row.querySelectorAll("[data-lv]").forEach((btn) => {
        const active = Number(btn.dataset.lv) === lvl;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    });

    // 同步右下暖沙「对比示例」实时映射状态
    if (elLiveCompareState && elLiveCompareMeta) {
      elLiveCompareState.textContent = audit.isClear ? "当前舞台已对齐「✓ 主次清晰」" : "当前舞台偏向「× 主次混乱」";
      elLiveCompareState.className = `compare-live-pill ${okClass}`;
      elLiveCompareMeta.textContent = `实绘顺位 ${audit.ranked.map((n) => n.item.name.slice(0, 2)).join(" → ")}`;
    }
  }

  function refreshAndMark() {
    lastLayout = computeLayout(state, viewW, viewH);
    syncUI(lastLayout);
    dirty = true;
    renderer.draw();
  }

  // ---------- 绘制主舞台 ----------
  function drawScene(t, dt, { still }) {
    if (!lastLayout) {
      resizeCanvas();
      lastLayout = computeLayout(state, viewW, viewH);
      syncUI(lastLayout);
    }

    // 开场入场动画（0..0.75s 迅速饱满就位，确保 0.9s 截图清晰完整）
    const introActive = introProgress < 1 && !still;
    if (introActive) {
      introProgress = Math.min(1, introProgress + Math.max(dt, 0.016) * 1.45);
    } else if (still) {
      introProgress = 1;
    }

    // 插值追赶目标位置与半径
    const targets = lastLayout.nodes;
    if (!animNodes || animNodes.length !== targets.length || still) {
      animNodes = targets.map((n) => ({ cx: n.cx, cy: n.cy, r: n.r }));
    }
    let moving = false;
    const ease = still ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 14);
    for (let i = 0; i < targets.length; i++) {
      const a = animNodes[i];
      const b = targets[i];
      a.cx += (b.cx - a.cx) * ease;
      a.cy += (b.cy - a.cy) * ease;
      a.r += (b.r - a.r) * ease;
      if (Math.abs(b.cx - a.cx) > 0.35 || Math.abs(b.cy - a.cy) > 0.35 || Math.abs(b.r - a.r) > 0.25) {
        moving = true;
      } else {
        a.cx = b.cx;
        a.cy = b.cy;
        a.r = b.r;
      }
    }

    // 视线验径光珠进度
    const scanDur = 2.6;
    if (scanTime >= 0) {
      scanTime += still ? scanDur : Math.max(dt, 0.016);
      if (scanTime > scanDur + 0.5) scanTime = -1;
    }

    if (!dirty && !moving && !introActive && scanTime < 0) return;
    dirty = false;

    const W = viewW;
    const H = viewH;
    const compact = W < 440;
    const reveal = 1 - Math.pow(1 - introProgress, 3);

    // 1. 羊皮暖奶纸底 + 096 原海报招牌曲线沙丘弧面
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, H * 0.88);
    ctx.bezierCurveTo(W * 0.28, H * 0.78, W * 0.36, H * 0.14, W, H * 0.06);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = PALETTE.sandWave;
    ctx.fill();
    ctx.restore();

    // 左侧边缘极细同心弧纹（1:1 承袭 096 原海报）
    ctx.save();
    ctx.strokeStyle = "rgba(181, 132, 84, 0.24)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(-W * 0.04, H * 0.22, 42 + k * 14, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }
    ctx.restore();

    // 若开启位置对比，轻描一条隐约的主辅分界弧，帮用户直觉看到「左主右辅」的空间势场
    if (state.levers.position > 0 && state.dominance > 36) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(150, 56, 20, 0.16)";
      ctx.lineWidth = 1;
      const pNode = animNodes[lastLayout.primaryNode.index];
      ctx.beginPath();
      ctx.arc(pNode.cx, pNode.cy, pNode.r + (state.levers.density > 0 ? 22 : 12), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. 在 4 枚模块背后先绘制轻盈的连接节奏线（仅清晰态或演播视线时）
    const ranked = lastLayout.ranked;
    if (lastLayout.isClear || scanTime >= 0) {
      ctx.save();
      ctx.beginPath();
      ranked.forEach((n, idx) => {
        const a = animNodes[n.index];
        if (idx === 0) ctx.moveTo(a.cx, a.cy);
        else ctx.lineTo(a.cx, a.cy);
      });
      ctx.strokeStyle = lastLayout.isClear ? "rgba(196, 85, 40, 0.22)" : "rgba(184, 37, 28, 0.36)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. 逐枚绘制 4 枚图形与排版文杠
    for (let i = 0; i < targets.length; i++) {
      const n = targets[i];
      const a = animNodes[i];
      const drawR = Math.max(6, a.r * (0.72 + 0.28 * reveal));

      // 悬停柔光外环
      if (hoverIdx === i) {
        ctx.save();
        traceNodeShape(ctx, n.shape, a.cx, a.cy, drawR + 7);
        ctx.strokeStyle = "rgba(50, 33, 23, 0.32)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 错态外圈警示（抢戏配角 / 异色失协 / 主角贴边）
      const isBadNode =
        n.isRival ||
        n.isClashColor ||
        (n.isPrimary && lastLayout.errors.includes("edge")) ||
        (n.isPrimary && lastLayout.errors.includes("inverted"));

      if (isBadNode) {
        ctx.save();
        traceNodeShape(ctx, n.shape, a.cx, a.cy, drawR + 8);
        ctx.strokeStyle = PALETTE.alert;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // 柔和的接地影（极克制，保留纸面印刷感）
      ctx.save();
      traceNodeShape(ctx, n.shape, a.cx, a.cy + 2.5, drawR);
      ctx.fillStyle = "rgba(50, 33, 23, 0.08)";
      ctx.fill();
      ctx.restore();

      // 实体色块 + 陶土手工颗粒叠印
      ctx.save();
      traceNodeShape(ctx, n.shape, a.cx, a.cy, drawR);
      ctx.fillStyle = n.fill;
      ctx.fill();
      if (clayPattern) {
        ctx.fillStyle = clayPattern;
        ctx.fill();
      }
      ctx.restore();

      // 主角内标（在陶艺展 / 器物志语境下，巨圆内沉静落字，原海报语境下保持纯粹窑红巨圆 + 极淡中心标识）
      const onDark = n.crPaper > 2.3 || n.fill === PALETTE.espresso;
      const innerInk = onDark ? "#FAF0DE" : PALETTE.espresso;
      if (n.isPrimary && drawR >= 44) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (state.scene !== "poster") {
          ctx.fillStyle = innerInk;
          ctx.font = `700 ${Math.round(clamp(drawR * 0.24, 13, 24))}px "Noto Serif SC", serif`;
          ctx.fillText(n.item.name, a.cx, a.cy - 6);
          ctx.font = `500 ${Math.round(clamp(drawR * 0.13, 10, 12))}px "Outfit", sans-serif`;
          ctx.fillStyle = onDark ? "rgba(250,240,222,0.86)" : "rgba(50,33,23,0.78)";
          ctx.fillText(n.item.sub.slice(0, 18), a.cx, a.cy + 16);
        } else if (state.showWeights) {
          ctx.fillStyle = onDark ? "rgba(250,240,222,0.92)" : PALETTE.espresso;
          ctx.font = `700 ${compact ? 13 : 15}px "Noto Serif SC", serif`;
          ctx.fillText("主", a.cx, a.cy - 8);
          ctx.font = `600 ${compact ? 11 : 12}px "Outfit", sans-serif`;
          ctx.fillText(`${Math.round(n.share)}%`, a.cx, a.cy + 11);
        }
        ctx.restore();
      }

      // 旁侧排版文本杠（忠实复刻 096 原海报中三个次圆旁边的实线+虚线排文杠）
      if (n.showSideBars && n.maxBarW >= 26 && a.cx + drawR + 28 < W) {
        const bx = a.cx + drawR + Math.max(10, drawR * 0.26);
        const bw = Math.max(24, Math.min(n.maxBarW, W - bx - 12));
        const lines = n.item.lines;
        const lineGap = compact ? 9 : 11;
        const startY = a.cy - ((lines.length - 1) * lineGap) / 2;

        ctx.save();
        // 在非原海报语境下，第一行直接排真实中文小标题，下面配结构线杠
        if (state.scene !== "poster" && bw >= 62) {
          ctx.fillStyle = n.isRival ? PALETTE.terracottaDeep : mixHex(PALETTE.espresso, PALETTE.paper, clamp((state.secondaryFade - 50) / 55, 0, 0.78));
          ctx.font = `700 ${n.isRival ? 13 : compact ? 11 : 12}px "Noto Serif SC", serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(n.item.name, bx, startY - 3);
          for (let li = 1; li < lines.length; li++) {
            const ly = startY + li * lineGap + 2;
            const lw = bw * lines[li];
            ctx.strokeStyle = n.barColor;
            ctx.lineWidth = li === 1 ? 2.6 : 2;
            if (li === lines.length - 1) ctx.setLineDash([2.5, 4]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(bx, ly);
            ctx.lineTo(bx + lw, ly);
            ctx.stroke();
          }
        } else {
          for (let li = 0; li < lines.length; li++) {
            const ly = startY + li * lineGap;
            const lw = bw * lines[li];
            ctx.strokeStyle = n.barColor;
            ctx.lineWidth = li === 0 ? 3.4 : li === 1 ? 2.4 : 2;
            if (li === lines.length - 1) ctx.setLineDash([2.5, 4]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(bx, ly);
            ctx.lineTo(bx + lw, ly);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 初看顺位角标与重量百分比（仅在重量环开关开启时轻巧标出，矮屏下紧贴顶部不侵占下行）
      const shortH = H < 260;
      if (state.showWeights) {
        const ordChar = ["①", "②", "③", "④"][n.eyeOrder - 1] || String(n.eyeOrder);
        const tagText = n.isPrimary && drawR >= 44 && state.scene === "poster" ? `${ordChar}` : `${ordChar} ${Math.round(n.share)}%`;
        ctx.save();
        ctx.font = `600 ${compact || shortH ? 10 : 11}px "Outfit", "Noto Serif SC", sans-serif`;
        const tw = ctx.measureText(tagText).width + 11;
        const tx = clamp(a.cx - tw / 2, 6, W - tw - 6);
        const ty = clamp(a.cy - drawR - (shortH ? 16 : 22), 6, H - 22);
        ctx.fillStyle = n.isPrimary ? PALETTE.espresso : isBadNode ? PALETTE.alert : "rgba(50, 33, 23, 0.84)";
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, shortH ? 15 : 18, 2);
        ctx.fill();
        ctx.fillStyle = "#FAF0DE";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, tx + tw / 2, ty + (shortH ? 8 : 9.5));
        ctx.restore();
      }

      // 错态可点小签（矮屏下嵌入图形中心避免与下行角标碰撞）
      if (n.isRival || n.isClashColor) {
        const lbl = n.isRival ? (shortH ? "× 抢戏" : "× 抢戏 · 点此降权") : "× 异色失协";
        ctx.save();
        ctx.font = `600 ${shortH ? 10 : 11}px "Noto Serif SC", serif`;
        const lw = ctx.measureText(lbl).width + 12;
        const lx = clamp(a.cx - lw / 2, 6, W - lw - 6);
        const ly = shortH ? a.cy - 9 : clamp(a.cy + drawR + 7, 26, H - 23);
        ctx.fillStyle = PALETTE.alert;
        ctx.beginPath();
        ctx.roundRect(lx, ly, lw, shortH ? 18 : 20, 2);
        ctx.fill();
        ctx.fillStyle = "#FFF8EE";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, lx + lw / 2, ly + (shortH ? 9.5 : 10.5));
        ctx.restore();
      }
    }

    // 4. 视线验径光珠动画（Space 触发，沿单真源 ranked 顺序飞掠；混乱态会明显来回折返）
    if (scanTime >= 0) {
      const seq = lastLayout.isClear
        ? [ranked[0], ranked[1], ranked[2], ranked[3]]
        : [ranked[0], ranked[1], ranked[0], ranked[2], ranked[1], ranked[3]];
      const segs = seq.length - 1;
      const p = clamp(scanTime / scanDur, 0, 1);
      const exact = p * segs;
      const idx = Math.min(segs - 1, Math.floor(exact));
      const frac = exact - idx;
      const pA = animNodes[seq[idx].index];
      const pB = animNodes[seq[idx + 1].index];
      const gx = pA.cx + (pB.cx - pA.cx) * frac;
      const gy = pA.cy + (pB.cy - pA.cy) * frac;

      ctx.save();
      ctx.beginPath();
      for (let k = 0; k <= idx; k++) {
        const pt = animNodes[seq[k].index];
        if (k === 0) ctx.moveTo(pt.cx, pt.cy);
        else ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.lineTo(gx, gy);
      ctx.strokeStyle = lastLayout.isClear ? PALETTE.terracotta : PALETTE.alert;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // 光珠
      ctx.beginPath();
      ctx.arc(gx, gy, 11, 0, Math.PI * 2);
      ctx.fillStyle = lastLayout.isClear ? "rgba(196,85,40,0.28)" : "rgba(184,37,28,0.32)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF7EA";
      ctx.fill();
      ctx.strokeStyle = lastLayout.isClear ? PALETTE.terracottaDeep : PALETTE.alert;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 5. 底部极简推拉提示刻度线（不遮挡图形）
    const barW = Math.min(200, W * 0.44);
    const barX = 14;
    const barY = H - 14;
    ctx.save();
    ctx.fillStyle = "rgba(50, 33, 23, 0.14)";
    ctx.fillRect(barX, barY, barW, 3);
    ctx.fillStyle = lastLayout.isClear ? PALETTE.terracotta : PALETTE.alert;
    ctx.fillRect(barX, barY, barW * (state.dominance / 100), 3);
    ctx.restore();
  }

  const renderer = loop(canvas, drawScene);

  // ---------- 指针交互（横拖推拉势差 + 直点模块立主/卸抢戏；触屏竖滑不劫持页面滚动） ----------
  let drag = null;

  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hitNode(pt) {
    if (!animNodes) return -1;
    // 从小到大检测避免小圆被大圆挡住
    let hit = -1;
    let bestD = Infinity;
    for (let i = 0; i < animNodes.length; i++) {
      const a = animNodes[i];
      const d = Math.hypot(pt.x - a.cx, pt.y - a.cy);
      if (d <= Math.max(a.r + 14, 28) && d < bestD) {
        bestD = d;
        hit = i;
      }
    }
    return hit;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    const pt = canvasPoint(e);
    drag = {
      id: e.pointerId,
      startX: pt.x,
      startY: pt.y,
      startDom: state.dominance,
      moved: false,
      axisLocked: null,
      hitIdx: hitNode(pt),
    };
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    const pt = canvasPoint(e);
    if (!drag) {
      const h = hitNode(pt);
      if (h !== hoverIdx) {
        hoverIdx = h;
        canvas.style.cursor = h >= 0 ? "pointer" : "ew-resize";
        dirty = true;
        renderer.draw();
      }
      return;
    }
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (!drag.axisLocked && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      drag.axisLocked = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    if (drag.axisLocked === "x") {
      drag.moved = true;
      const next = Math.max(0, Math.min(100, drag.startDom + (dx / Math.max(220, viewW * 0.58)) * 100));
      state.dominance = next;
      // 如果向右拖到高位且当前大小对比还关着，自动点亮大小对比让手感有物理响应（用户仍可手动关掉）
      if (next > 45 && state.levers.size === 0) state.levers.size = 2;
      if (next > 58 && state.levers.position === 0) state.levers.position = 2;
      refreshAndMark();
    }
  });

  function endDrag(e) {
    if (!drag) return;
    const wasMoved = drag.moved;
    const targetIdx = drag.hitIdx;
    drag = null;
    if (!wasMoved && targetIdx >= 0) {
      // 点击标红抢戏模块 → 一键卸除抢戏；否则点击任意非主模块 → 立为主角
      if (targetIdx === state.rivalIndex && targetIdx !== state.primaryIndex) {
        state.rivalIndex = -1;
      } else if (targetIdx !== state.primaryIndex) {
        state.primaryIndex = targetIdx;
        if (state.rivalIndex === targetIdx) state.rivalIndex = -1;
      } else {
        // 点击当前主角本身：触发一次视线验径
        scanTime = 0;
      }
      refreshAndMark();
    }
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });

  // 触屏：同时兼容 perf.mjs 发出的原始 touchStart / touchMove 事件
  let touchDrag = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      const t0 = e.touches[0];
      touchDrag = { x: t0.clientX, y: t0.clientY, startDom: state.dominance, axis: null };
    },
    { passive: true },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchDrag || !e.touches.length) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - touchDrag.x;
      const dy = t0.clientY - touchDrag.y;
      if (!touchDrag.axis && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        touchDrag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchDrag.axis === "x") {
        e.preventDefault();
        state.dominance = Math.max(0, Math.min(100, touchDrag.startDom + (dx / Math.max(180, viewW * 0.55)) * 100));
        if (state.dominance > 45 && state.levers.size === 0) state.levers.size = 2;
        refreshAndMark();
      }
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => {
    touchDrag = null;
  });

  // 键盘操作画布（方向键调主次势差，1-4 立主，Space 视线验径）
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      state.dominance = Math.min(100, state.dominance + 6);
      if (state.dominance > 45 && state.levers.size === 0) state.levers.size = 2;
      refreshAndMark();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      state.dominance = Math.max(0, state.dominance - 6);
      refreshAndMark();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      scanTime = 0;
      dirty = true;
      renderer.draw();
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      state.primaryIndex = Number(e.key) - 1;
      if (state.rivalIndex === state.primaryIndex) state.rivalIndex = -1;
      refreshAndMark();
    }
  });

  // 全局 Space 快捷键（非输入框聚焦时触发视线验径）
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON|SELECT/.test(document.activeElement?.tagName || "")) {
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
        e.preventDefault();
        scanTime = 0;
        dirty = true;
        renderer.draw();
      }
    }
  });

  // ---------- 绑定全部外部按钮、滑轨与窑红六对比工具箱 ----------
  elDomRange?.addEventListener("input", () => {
    state.dominance = Number(elDomRange.value);
    if (state.dominance > 45 && state.levers.size === 0) state.levers.size = 2;
    refreshAndMark();
  });

  elFadeRange?.addEventListener("input", () => {
    state.secondaryFade = 100 - Number(elFadeRange.value);
    refreshAndMark();
  });

  elHarmonyBtn?.addEventListener("click", () => {
    state.harmony = !state.harmony;
    refreshAndMark();
  });

  elRivalBtn?.addEventListener("click", () => {
    const hasRival = state.rivalIndex >= 0 && state.rivalIndex !== state.primaryIndex;
    state.rivalIndex = hasRival ? -1 : (state.primaryIndex + 1) % 4;
    refreshAndMark();
  });

  elWeightBtn?.addEventListener("click", () => {
    state.showWeights = !state.showWeights;
    refreshAndMark();
  });

  const triggerScan = () => {
    scanTime = 0;
    dirty = true;
    renderer.draw();
  };
  elScanBtn?.addEventListener("click", triggerScan);
  elMobileScanBtn?.addEventListener("click", triggerScan);

  elCalibrateBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      applyPreset(state, "poster");
      refreshAndMark();
    }),
  );

  elResetChaosBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      applyPreset(state, "chaos");
      refreshAndMark();
    }),
  );

  elSceneBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      state.scene = btn.dataset.scene;
      refreshAndMark();
    }),
  );

  elPresetBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      applyPreset(state, btn.dataset.preset);
      refreshAndMark();
    }),
  );

  elLeverRows.forEach((row) => {
    const key = row.dataset.lever;
    row.querySelectorAll("[data-lv]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.levers[key] = Number(btn.dataset.lv);
        refreshAndMark();
      });
    });
  });

  // 响应尺寸变化
  const ro = new ResizeObserver(() => {
    resizeCanvas();
    lastLayout = computeLayout(state, viewW, viewH);
    syncUI(lastLayout);
    renderer.draw();
  });
  ro.observe(canvas);

  resizeCanvas();
  refreshAndMark();

  // 暴露只读检测钩子方便测试脚本校验单真源一致（不改变任何页面行为）
  window.__p096Hero = () => ({ state: structuredClone(state), audit: lastLayout });
}
