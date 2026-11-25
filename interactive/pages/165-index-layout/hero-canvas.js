// 165 索引版式 · 活体辞书书口切口索引台（离屏文字层缓存 + 高帧率 2D Canvas 渲染与直接手势交互）
import { loop, pixelRatio } from "../../lib/stage.js";
import { computeLayout, evaluate, getActiveRefs, getDataset } from "./model.js";

const C = {
  paper: "#F7F7F3",
  paperAlt: "#F1F2EE",
  green: "#0C7854",
  greenDark: "#085A3F",
  greenTint: "#E3F2EC",
  greenLine: "rgba(12, 120, 84, 0.32)",
  ink: "#0E1110",
  inkSub: "#454E4B",
  inkMuted: "#69736F",
  grid: "#D4DAD7",
  err: "#B83227",
  errTint: "rgba(184, 50, 39, 0.12)",
  errLight: "#FBECEB",
  tabOff: "#CED5D2",
  tabOffText: "#55605C",
};

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawChamferedSpine(ctx, x, y, w, h, cut = 10) {
  ctx.beginPath();
  ctx.moveTo(x, y + cut);
  ctx.lineTo(x + cut, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.closePath();
}

function drawTierMarker(ctx, x, y, r, tier, mode, isSelected) {
  ctx.save();
  if (mode === "flat") {
    ctx.fillStyle = "#9BA4A0";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  } else if (mode === "overload") {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const col = isSelected ? C.greenDark : C.green;
    if (tier === "primary") {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (tier === "secondary") {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(x, y, r + 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

export function createHeroCanvas(canvas, getState, actions) {
  const ctx = canvas.getContext("2d");
  const baseCanvas = document.createElement("canvas");
  const baseCtx = baseCanvas.getContext("2d");

  let w = 720;
  let h = 418;
  let dpr = 1;
  let lastLayout = null;
  let lastEval = null;
  let badgeHit = null;
  let hoverRowId = null;
  let hoverTabKey = null;
  let dragState = null;

  let cachedBaseKey = "";
  let cachedEvalKey = "";
  let cachedSelectedId = "";

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(280, Math.round(rect.width));
    const nh = Math.max(240, Math.round(rect.height));
    // 窄屏触控设备像素比封顶 1.5（兼顾超清锐利与软件渲染满帧），桌面端最多 2
    const ndpr = pixelRatio(window.innerWidth <= 640 ? 1.5 : 2);
    if (nw !== w || nh !== h || ndpr !== dpr || canvas.width !== Math.round(nw * ndpr)) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      baseCanvas.width = canvas.width;
      baseCanvas.height = canvas.height;
      cachedBaseKey = "";
      cachedEvalKey = "";
    }
  }

  // 把不随每帧动画变化的高密度辞书底纸、组块、21 行词条文字与编码烘焙到离屏缓存层
  function rebuildBaseLayer(state, layout, ev) {
    const ds = getDataset(state);
    baseCtx.save();
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 典籍浅卡纸底
    baseCtx.fillStyle = C.paper;
    baseCtx.fillRect(0, 0, w, h);
    baseCtx.strokeStyle = C.grid;
    baseCtx.lineWidth = 1;
    baseCtx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // 2. 顶沿辞书眉
    const topBarH = layout.padTop - 4;
    baseCtx.fillStyle = C.paperAlt;
    baseCtx.fillRect(1, 1, w - 2, topBarH - 1);
    baseCtx.beginPath();
    baseCtx.moveTo(0, topBarH);
    baseCtx.lineTo(w, topBarH);
    baseCtx.strokeStyle = C.grid;
    baseCtx.stroke();

    const magX = layout.padX + 8;
    const magY = topBarH / 2;
    baseCtx.fillStyle = ev.allPass ? C.green : C.err;
    baseCtx.beginPath();
    baseCtx.arc(magX, magY, 8, 0, Math.PI * 2);
    baseCtx.fill();
    baseCtx.strokeStyle = "#FFFFFF";
    baseCtx.lineWidth = 1.6;
    baseCtx.beginPath();
    baseCtx.arc(magX - 1, magY - 1, 3.2, 0, Math.PI * 2);
    baseCtx.moveTo(magX + 1.5, magY + 1.5);
    baseCtx.lineTo(magX + 4, magY + 4);
    baseCtx.stroke();

    baseCtx.fillStyle = C.ink;
    baseCtx.font = `700 ${layout.compact ? 11 : 12.5}px "Noto Sans SC", sans-serif`;
    baseCtx.textAlign = "left";
    baseCtx.textBaseline = "middle";
    const firstRefId = ev.targetRow.term.refs[0];
    const firstRefTerm = ds.terms.find((x) => x.id === firstRefId);
    const taskStr = layout.compact
      ? `查「${ev.targetRow.term.zh}」→「${firstRefTerm ? firstRefTerm.zh : ""}」`
      : `当前查词：定位「${ev.targetRow.term.zh}」并溯联至「${firstRefTerm ? firstRefTerm.zh : ""}」`;
    baseCtx.fillText(taskStr, magX + 14, magY + 0.5);

    const badgeStr = ev.allPass
      ? `${ev.metrics.scanSteps} 步直达 · 4/4`
      : `扫 ${ev.metrics.scanSteps} 步 · ${ev.passed}/4`;
    baseCtx.font = `700 ${layout.compact ? 10 : 11}px "Space Mono", "Noto Sans SC", monospace`;
    const bw = baseCtx.measureText(badgeStr).width + 14;
    const bx = w - bw - 8;
    const by = (topBarH - 20) / 2;
    roundRect(baseCtx, bx, by, bw, 20, 3);
    baseCtx.fillStyle = ev.allPass ? C.green : C.errLight;
    baseCtx.fill();
    if (!ev.allPass) {
      baseCtx.strokeStyle = C.err;
      baseCtx.lineWidth = 1;
      baseCtx.stroke();
    }
    baseCtx.fillStyle = ev.allPass ? "#FFFFFF" : C.err;
    baseCtx.textAlign = "center";
    baseCtx.fillText(badgeStr, bx + bw / 2, topBarH / 2 + 0.5);

    // 3. 组块框 + 左侧翡翠绿柱与 A–G 字母
    for (const gb of layout.groupBoxes) {
      baseCtx.fillStyle = C.paper;
      baseCtx.fillRect(gb.x, gb.y, gb.w, gb.h);
      baseCtx.strokeStyle = C.grid;
      baseCtx.lineWidth = 1;
      baseCtx.strokeRect(gb.x + 0.5, gb.y + 0.5, gb.w - 1, gb.h - 1);

      if (gb.labelW > 0) {
        const barW = state.sortMode === "grouped" ? (layout.compact ? 5 : 8) : state.sortMode === "overcut" ? 4 : 3;
        baseCtx.fillStyle = state.sortMode === "overcut" ? C.err : C.green;
        baseCtx.fillRect(gb.x, gb.y, barW, gb.h);

        baseCtx.fillStyle = "rgba(12, 120, 84, 0.04)";
        baseCtx.fillRect(gb.x + barW, gb.y + 1, gb.labelW - barW, gb.h - 2);

        baseCtx.beginPath();
        baseCtx.moveTo(gb.x + gb.labelW, gb.y);
        baseCtx.lineTo(gb.x + gb.labelW, gb.y + gb.h);
        baseCtx.strokeStyle = C.grid;
        baseCtx.stroke();

        const lx = gb.x + barW + (layout.compact ? 5 : 9);
        const letterSize = state.sortMode === "grouped" ? Math.min(26, Math.max(14, gb.h * 0.44)) : state.sortMode === "overcut" ? Math.min(12, gb.h * 0.55) : 12.5;
        baseCtx.fillStyle = state.sortMode === "overcut" ? C.err : C.green;
        baseCtx.font = `900 ${letterSize}px "Archivo", sans-serif`;
        baseCtx.textAlign = "left";
        baseCtx.textBaseline = "top";
        const ly = gb.y + (state.sortMode === "grouped" ? Math.max(2, gb.h * 0.09) : Math.max(2, (gb.h - letterSize) / 2));
        baseCtx.fillText(gb.key, lx, ly);

        if (state.sortMode === "grouped" && gb.h >= 36) {
          baseCtx.fillStyle = C.ink;
          baseCtx.font = `700 ${layout.compact ? 9.5 : 10.5}px "Noto Sans SC", sans-serif`;
          baseCtx.fillText(gb.zh, lx, ly + letterSize + 1);
        }
      }
    }

    // 4. 逐行烘焙 21 词条、引导线、三态标记与定位码
    const labelByBucket = new Map(layout.groupBoxes.map((g) => [g.key, g.labelW]));
    for (const r of layout.rows) {
      const lblW = labelByBucket.get(r.bucketKey) || 0;
      const tTier = r.term.tier;
      if (state.hierarchyMode === "overload") {
        baseCtx.fillStyle = "rgba(12, 120, 84, 0.22)";
        baseCtx.fillRect(r.x + lblW + 1, r.y + 1, r.w - lblW - 2, r.h - 2);
      }

      const baseFontSize = layout.compact ? 10.5 : Math.min(12.5, Math.max(10.2, r.h * 0.6));
      let zhWeight = 500;
      let zhColor = C.ink;
      if (state.hierarchyMode === "flat") {
        zhWeight = 400;
        zhColor = C.inkSub;
      } else if (state.hierarchyMode === "overload") {
        zhWeight = 900;
        zhColor = C.greenDark;
      } else {
        zhWeight = tTier === "primary" ? 700 : tTier === "secondary" ? 500 : 400;
        zhColor = tTier === "primary" ? C.ink : tTier === "secondary" ? "#2E3533" : C.inkSub;
      }

      if (state.hierarchyMode === "indent" && r.indentPx > 0) {
        baseCtx.strokeStyle = C.greenLine;
        baseCtx.lineWidth = 1;
        baseCtx.beginPath();
        baseCtx.moveTo(r.textX - 8, r.cy - 4);
        baseCtx.lineTo(r.textX - 8, r.cy);
        baseCtx.lineTo(r.textX - 3, r.cy);
        baseCtx.stroke();
      }

      baseCtx.font = `${zhWeight} ${baseFontSize}px "Noto Sans SC", sans-serif`;
      baseCtx.fillStyle = zhColor;
      baseCtx.textAlign = "left";
      baseCtx.textBaseline = "middle";
      baseCtx.fillText(r.term.zh, r.textX, r.cy + 0.5);
      const zhActualW = baseCtx.measureText(r.term.zh).width;

      const enX = r.textX + zhActualW + (layout.compact ? 5 : 8);
      baseCtx.font = `500 ${Math.max(8.5, baseFontSize - 2.3)}px "Archivo", sans-serif`;
      baseCtx.fillStyle = state.hierarchyMode === "overload" ? C.green : C.inkMuted;
      const maxEnX = state.locatorMode === "glued" || state.locatorMode === "inline" ? r.codeX - 8 : r.dotX - 12;
      let enActualW = 0;
      if (enX < maxEnX - 18) {
        let enTxt = r.term.en;
        enActualW = baseCtx.measureText(enTxt).width;
        if (enX + enActualW > maxEnX) {
          enTxt = enTxt.slice(0, 7) + "…";
          enActualW = baseCtx.measureText(enTxt).width;
        }
        baseCtx.fillText(enTxt, enX, r.cy + 0.5);
      }

      const contentEnd = enX + enActualW + 6;
      if (state.locatorMode === "glued") {
        baseCtx.font = `400 ${Math.max(9.5, baseFontSize - 1.5)}px "Noto Sans SC", sans-serif`;
        baseCtx.fillStyle = C.inkMuted;
        baseCtx.fillText(r.term.id, Math.min(r.codeX, contentEnd - 3), r.cy + 0.5);
      } else if (state.locatorMode === "inline") {
        const inlineCodeX = Math.min(r.codeX, contentEnd + 6);
        baseCtx.font = `700 ${Math.max(9.5, baseFontSize - 1.5)}px "Space Mono", monospace`;
        baseCtx.fillStyle = C.green;
        baseCtx.fillText(r.term.id, inlineCodeX, r.cy + 0.5);
        drawTierMarker(baseCtx, r.x + r.w - 14, r.cy, r.dotR, tTier, state.hierarchyMode, false);
      } else {
        const lineStart = contentEnd + 2;
        const lineEnd = r.dotX - 10;
        if (lineEnd > lineStart + 6) {
          baseCtx.save();
          if (state.locatorMode === "heavy") {
            baseCtx.strokeStyle = "#181C1B";
            baseCtx.lineWidth = 2.4;
            baseCtx.setLineDash([]);
          } else {
            baseCtx.strokeStyle = "#9AA39F";
            baseCtx.lineWidth = 1.1;
            baseCtx.setLineDash([1.5, 4.5]);
          }
          baseCtx.beginPath();
          baseCtx.moveTo(lineStart, r.cy + 0.5);
          baseCtx.lineTo(lineEnd, r.cy + 0.5);
          baseCtx.stroke();
          baseCtx.restore();
        }
        drawTierMarker(baseCtx, r.dotX, r.cy, r.dotR, tTier, state.hierarchyMode, false);
        baseCtx.font = `500 ${Math.max(9.5, baseFontSize - 1.5)}px "Space Mono", monospace`;
        baseCtx.fillStyle = C.ink;
        baseCtx.textAlign = "right";
        baseCtx.fillText(r.term.id, r.x + r.w - 6, r.cy + 0.5);
        baseCtx.textAlign = "left";
      }

      if (r.term.id === state.targetId) {
        baseCtx.fillStyle = ev.allPass ? C.green : C.err;
        baseCtx.beginPath();
        baseCtx.arc(r.textX - 5, r.cy, 2.3, 0, Math.PI * 2);
        baseCtx.fill();
      }
    }

    // 5. 若为蜘蛛网滥连模式，静态背景蛛网也烘焙进底图（每帧 0 额外开销）
    if (state.xrefMode === "spaghetti") {
      const rowById = new Map(layout.rows.map((r) => [r.term.id, r]));
      baseCtx.strokeStyle = "rgba(184, 50, 39, 0.2)";
      baseCtx.lineWidth = 0.9;
      for (const r of layout.rows) {
        for (const ref of getActiveRefs(state, r.term)) {
          const dst = rowById.get(ref.toId);
          if (!dst) continue;
          const ctrlX = Math.min(w - 50, Math.max(r.dotX, dst.dotX) - 36 - Math.abs(r.cy - dst.cy) * 0.25);
          baseCtx.beginPath();
          baseCtx.moveTo(r.dotX, r.cy);
          baseCtx.quadraticCurveTo(ctrlX, (r.cy + dst.cy) / 2, dst.dotX, dst.cy);
          baseCtx.stroke();
        }
      }
    }

    // 6. 烘焙底部静态轨道底条
    const tr = layout.scrubTrack;
    const tabsEnabled = state.sortMode === "grouped" || state.sortMode === "overcut";
    baseCtx.fillStyle = "#E4E8E6";
    roundRect(baseCtx, tr.x, tr.y + 2, tr.w, 8, 4);
    baseCtx.fill();
    for (let i = 0; i < 7; i++) {
      const tx = tr.x + ((i + 0.5) / 7) * tr.w;
      baseCtx.fillStyle = tabsEnabled ? C.green : "#9AA39F";
      baseCtx.beginPath();
      baseCtx.arc(tx, tr.y + 6, 2, 0, Math.PI * 2);
      baseCtx.fill();
    }

    // 7. 若有内嵌书口脊，烘焙静止底槽
    if (layout.showInlineTabs) {
      const spineX = layout.tabRects[0].x;
      const spineY = layout.padTop;
      const spineW = layout.tabRects[0].w;
      const spineH = layout.innerH;
      baseCtx.save();
      drawChamferedSpine(baseCtx, spineX, spineY, spineW, spineH, 10);
      baseCtx.fillStyle = !tabsEnabled ? C.tabOff : state.sortMode === "overcut" ? "#8A2B22" : C.green;
      baseCtx.fill();
      baseCtx.clip();
      layout.tabRects.forEach((tab, idx) => {
        if (idx > 0) {
          baseCtx.strokeStyle = tabsEnabled ? "rgba(255,255,255,0.34)" : "rgba(14,17,16,0.14)";
          baseCtx.lineWidth = 1;
          baseCtx.beginPath();
          baseCtx.moveTo(tab.x + 4, tab.y);
          baseCtx.lineTo(tab.x + tab.w - 4, tab.y);
          baseCtx.stroke();
        }
        baseCtx.fillStyle = tabsEnabled ? "#FFFFFF" : C.tabOffText;
        const fs = state.sortMode === "overcut" ? 9.5 : layout.compact ? 12 : 14;
        baseCtx.font = `900 ${fs}px "Archivo", sans-serif`;
        baseCtx.textAlign = "center";
        baseCtx.textBaseline = "middle";
        baseCtx.fillText(tab.key, tab.x + tab.w / 2 + 1, tab.y + tab.h / 2);
      });
      baseCtx.restore();
    }

    // 8. 若有主要错态浮标，也直接烘焙进底图
    badgeHit = null;
    if (ev.primaryIssue) {
      const txt = `${ev.primaryIssue.badge} · 点此修复`;
      baseCtx.font = `700 ${layout.compact ? 10 : 11}px "Noto Sans SC", sans-serif`;
      const tw = baseCtx.measureText(txt).width + 20;
      const th = 24;
      const rightLimit = layout.showInlineTabs ? w - layout.tabRects[0].w - tw - 12 : w - tw - 14;
      const fx = Math.max(layout.padX + 6, Math.min(rightLimit, layout.padX + layout.innerW - tw - 8));
      const fy = layout.padTop + layout.innerH - th - 8;
      badgeHit = { x: fx, y: fy, w: tw, h: th, patch: ev.primaryIssue.fixPatch };

      roundRect(baseCtx, fx, fy, tw, th, 3);
      baseCtx.fillStyle = C.err;
      baseCtx.fill();
      baseCtx.fillStyle = "#FFFFFF";
      baseCtx.textAlign = "center";
      baseCtx.textBaseline = "middle";
      baseCtx.fillText(txt, fx + tw / 2, fy + th / 2 + 0.5);
    }

    baseCtx.restore();
  }

  function renderFrame(t, dt, { still }) {
    resize();
    const state = getState();
    const spineEl = document.getElementById("fore-edge-spine");
    const showInlineTabs = !spineEl || getComputedStyle(spineEl).display === "none";

    const baseKey = `${w}|${h}|${dpr}|${showInlineTabs}|${state.dataset}|${state.sortMode}|${state.hierarchyMode}|${state.locatorMode}|${state.xrefMode}|${state.targetId}`;
    const evalKey = `${baseKey}|${state.selectedId}`;

    if (evalKey !== cachedEvalKey || !lastLayout || !lastEval) {
      lastLayout = computeLayout(state, w, h, { showInlineTabs });
      lastEval = evaluate(state, lastLayout);
      cachedEvalKey = evalKey;
      // 仅在数据或选中项真正改变时同步外部 DOM，彻底杜绝动画期间每帧重排！
      if (baseKey !== cachedBaseKey) {
        rebuildBaseLayer(state, lastLayout, lastEval);
        cachedBaseKey = baseKey;
      }
      if (actions.onEvaluated) actions.onEvaluated(lastEval, lastLayout);
      cachedSelectedId = state.selectedId;
    }

    const layout = lastLayout;
    const ev = lastEval;
    const intro = still ? 1 : Math.min(1, t / 0.85);
    const pulse = still ? 0.65 : (t * 0.55) % 1;
    const tabsEnabled = state.sortMode === "grouped" || state.sortMode === "overcut";

    // ===== 超轻量前景帧：1 次 blit + 极少动态矢量 =====
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(baseCanvas, 0, 0);
    ctx.save();
    ctx.scale(dpr, dpr);

    // A. 当前选中行柔和底带
    const sel = ev.selectedRow;
    const selGb = layout.groupBoxes.find((g) => g.key === sel.bucketKey);
    const lblW = selGb ? selGb.labelW : 0;
    ctx.fillStyle = ev.allPass ? "rgba(12, 120, 84, 0.14)" : C.errTint;
    ctx.fillRect(sel.x + lblW + 1, sel.y + 0.5, sel.w - lblW - 2, sel.h - 1);

    // 悬停行反馈
    if (hoverRowId && hoverRowId !== state.selectedId) {
      const hr = layout.rows.find((r) => r.term.id === hoverRowId);
      if (hr) {
        const hGb = layout.groupBoxes.find((g) => g.key === hr.bucketKey);
        const hLbl = hGb ? hGb.labelW : 0;
        ctx.fillStyle = "rgba(14, 17, 16, 0.05)";
        ctx.fillRect(hr.x + hLbl + 1, hr.y + 0.5, hr.w - hLbl - 2, hr.h - 1);
      }
    }

    // B. 内嵌切口当前槽位高亮
    if (layout.showInlineTabs && tabsEnabled) {
      const curTab = layout.tabRects.find((tb) => tb.key === sel.bucketKey);
      if (curTab) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(curTab.x, curTab.y + 1, curTab.w, curTab.h - 2);
        ctx.fillStyle = state.sortMode === "overcut" ? C.err : C.greenDark;
        ctx.fillRect(curTab.x, curTab.y + 1, 4, curTab.h - 2);
        const fs = state.sortMode === "overcut" ? 9.5 : layout.compact ? 12 : 14;
        ctx.font = `900 ${fs}px "Archivo", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(curTab.key, curTab.x + curTab.w / 2 + 1, curTab.y + curTab.h / 2);
      }
    }

    // C. 当前选中词的动态交叉引用弧线与流光点
    if (state.xrefMode !== "none" && ev.selectedRefs.length) {
      const rowById = new Map(layout.rows.map((r) => [r.term.id, r]));
      ev.selectedRefs.forEach((ref, idx) => {
        const dst = rowById.get(ref.toId);
        if (!dst) return;
        const bulge = 26 + idx * 14 + Math.abs(sel.cy - dst.cy) * 0.16;
        const sx = state.locatorMode === "inline" ? sel.textEnd + 28 : sel.dotX;
        const dx = state.locatorMode === "inline" ? dst.textEnd + 28 : dst.dotX;
        const cx = Math.max(layout.padX + 40, Math.min(sx, dx) - bulge);
        const cy = (sel.cy + dst.cy) / 2;

        ctx.beginPath();
        ctx.moveTo(sx, sel.cy);
        ctx.quadraticCurveTo(cx, cy, dx, dst.cy);
        ctx.strokeStyle = ref.broken || state.xrefMode === "spaghetti" ? C.err : C.green;
        ctx.lineWidth = 1.7;
        ctx.setLineDash(ref.broken ? [4, 3] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        if (!still) {
          const u = (pulse + idx * 0.28) % 1;
          const px = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * dx;
          const py = (1 - u) * (1 - u) * sel.cy + 2 * (1 - u) * u * cy + u * u * dst.cy;
          ctx.fillStyle = ref.broken ? C.err : C.greenDark;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (ref.broken) {
          ctx.fillStyle = C.err;
          ctx.font = `700 10px "Space Mono", "Noto Sans SC", monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(`× 错指 ${ref.toId}`, cx - 10, cy - 6);
        }
      });
    }

    // D. 查词扫读折线（线性盲扫红线 vs 切口两跳绿流）
    const nodes = ev.scanPathNodes;
    if (nodes.length >= 2) {
      const segs = nodes.length - 1;
      const drawUpTo = Math.max(1, Math.ceil(segs * intro));
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i <= drawUpTo && i < nodes.length; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y);
      }
      const isGoodPath = ev.pillars.sort === "pass";
      ctx.strokeStyle = isGoodPath ? C.green : C.err;
      ctx.lineWidth = isGoodPath ? 2.1 : 1.5;
      ctx.setLineDash(isGoodPath ? [5, 3] : [3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      const endNode = nodes[Math.min(drawUpTo, nodes.length - 1)];
      ctx.fillStyle = isGoodPath ? C.green : C.err;
      ctx.beginPath();
      ctx.arc(endNode.x, endNode.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // E. 底部拇指翻槽扫描游标
    const tr = layout.scrubTrack;
    const knobX = tr.x + state.scrubPos * tr.w;
    ctx.fillStyle = ev.allPass ? C.green : C.err;
    roundRect(ctx, tr.x, tr.y + 2, Math.max(8, knobX - tr.x), 8, 4);
    ctx.fill();

    const handleW = layout.compact ? 48 : 58;
    const hx = Math.max(tr.x, Math.min(tr.x + tr.w - handleW, knobX - handleW / 2));
    roundRect(ctx, hx, tr.y - 4, handleW, 20, 4);
    ctx.fillStyle = ev.allPass ? C.greenDark : C.err;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(hx + 6, tr.y + 6);
    ctx.lineTo(hx + 10, tr.y + 3);
    ctx.lineTo(hx + 10, tr.y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + handleW - 6, tr.y + 6);
    ctx.lineTo(hx + handleW - 10, tr.y + 3);
    ctx.lineTo(hx + handleW - 10, tr.y + 9);
    ctx.closePath();
    ctx.fill();

    ctx.font = `700 10.5px "Space Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sel.term.id, hx + handleW / 2, tr.y + 6.5);

    ctx.restore();
  }

  function localPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function scrubToX(px) {
    if (!lastLayout) return;
    const tr = lastLayout.scrubTrack;
    const norm = Math.max(0, Math.min(1, (px - tr.x) / Math.max(1, tr.w)));
    const idx = Math.min(lastLayout.rows.length - 1, Math.floor(norm * lastLayout.rows.length));
    const row = lastLayout.rows[idx];
    if (row) actions.onScrub(norm, row.term.id);
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const p = localPoint(e);
    dragState = { id: e.pointerId, startX: p.x, startY: p.y, moved: false, lockedAxis: null };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = localPoint(e);
    if (dragState && dragState.id === e.pointerId) {
      const dx = p.x - dragState.startX;
      const dy = p.y - dragState.startY;
      if (!dragState.lockedAxis && Math.hypot(dx, dy) > 5) {
        dragState.lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (dragState.lockedAxis === "x") {
        dragState.moved = true;
        scrubToX(p.x);
      }
      return;
    }

    if (!lastLayout) return;
    let nextRow = null;
    let nextTab = null;
    if (lastLayout.showInlineTabs) {
      for (const tab of lastLayout.tabRects) {
        if (p.x >= tab.x && p.x <= tab.x + tab.w && p.y >= tab.y && p.y <= tab.y + tab.h) {
          nextTab = tab.key;
          break;
        }
      }
    }
    if (!nextTab) {
      for (const r of lastLayout.rows) {
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          nextRow = r.term.id;
          break;
        }
      }
    }
    if (nextRow !== hoverRowId || nextTab !== hoverTabKey) {
      hoverRowId = nextRow;
      hoverTabKey = nextTab;
      canvas.style.cursor = badgeHit && p.x >= badgeHit.x && p.x <= badgeHit.x + badgeHit.w && p.y >= badgeHit.y && p.y <= badgeHit.y + badgeHit.h ? "pointer" : nextTab || nextRow ? "pointer" : "ew-resize";
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!dragState || dragState.id !== e.pointerId) return;
    const wasDrag = dragState.moved;
    dragState = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    if (wasDrag || !lastLayout) return;

    const p = localPoint(e);
    if (badgeHit && p.x >= badgeHit.x && p.x <= badgeHit.x + badgeHit.w && p.y >= badgeHit.y && p.y <= badgeHit.y + badgeHit.h) {
      actions.onPatch(badgeHit.patch);
      return;
    }
    if (lastLayout.showInlineTabs) {
      for (const tab of lastLayout.tabRects) {
        if (p.x >= tab.x && p.x <= tab.x + tab.w && p.y >= tab.y && p.y <= tab.y + tab.h) {
          actions.onSelectGroup(tab.key);
          return;
        }
      }
    }
    const tr = lastLayout.scrubTrack;
    if (p.y >= tr.y - 10 && p.y <= tr.y + tr.h + 10) {
      scrubToX(p.x);
      return;
    }
    for (const r of lastLayout.rows) {
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        actions.onSelectTerm(r.term.id);
        return;
      }
    }
  });

  canvas.addEventListener("pointercancel", () => {
    dragState = null;
  });

  let touchStartX = null;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      touchStartX = e.touches[0].clientX - rect.left;
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && touchStartX !== null) {
      const rect = canvas.getBoundingClientRect();
      const px = e.touches[0].clientX - rect.left;
      if (Math.abs(px - touchStartX) > 3) scrubToX(px);
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    touchStartX = null;
  }, { passive: true });

  const ctl = loop(canvas, renderFrame);
  new ResizeObserver(() => {
    cachedBaseKey = "";
    ctl.draw();
  }).observe(canvas);

  return {
    redraw: () => {
      cachedEvalKey = "";
      ctl.draw();
    },
    getLastEval: () => lastEval,
    getLastLayout: () => lastLayout,
  };
}
