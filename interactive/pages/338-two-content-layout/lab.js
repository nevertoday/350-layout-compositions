import { loop, pixelRatio } from "../../lib/stage.js";

// Section 03 Darkroom Lab: 2D Canvas "Eye-Ping-Pong Simulator" (Chandler & Sweller 1992 Split-Attention vs Integrated Dual-Module)

const LAB_W = 860;
const LAB_H = 420;

export function createPingPongLab(canvas, getLabState, onMetrics) {
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  let cssW = LAB_W;
  let dirty = true;
  let phase = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(r.width));
    const h = Math.round((w * LAB_H) / LAB_W);
    dpr = pixelRatio(w < 560 ? 1.5 : 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
    }
    cssW = w;
    dirty = true;
  }

  function buildPath(mode, pacing) {
    // mode: 'split' (chart with A/B/C codes on left + legend text wall on right) vs 'integrated' (in-place labeled chart + synthesis takeaways on right)
    // pacing: 'all' (both appear simultaneously) vs 'staged' (01 first, then 02)
    if (mode === "split") {
      // Classic eye ping-pong across the gutter!
      const pts = [
        { x: 165, y: 120, n: "看柱A" },
        { x: 560, y: 146, n: "查右图例A" },
        { x: 235, y: 175, n: "折返柱B" },
        { x: 560, y: 204, n: "查右图例B" },
        { x: 305, y: 140, n: "折返柱C" },
        { x: 560, y: 262, n: "查右图例C" },
        { x: 235, y: 235, n: "再核对" },
        { x: 590, y: 312, n: "找结论" },
      ];
      return {
        pts,
        crossings: pacing === "staged" ? 5 : 7,
        loadTier: pacing === "staged" ? "较高外在负荷" : "严重分离注意",
        verdict:
          pacing === "staged"
            ? "即使分步显现，只要左图只写代号 A/B/C、说明藏在右侧，视线仍被迫跨缝往返 5 次来回查表。"
            : "两栏同时出现且图例分离，观众眼球跨过中缝反复乒乓扫视 7 次，工作记忆被「找对应」耗干（Chandler & Sweller, 1992）。",
      };
    }
    const pts =
      pacing === "staged"
        ? [
            { x: 160, y: 112, n: "① 先读01趋势" },
            { x: 295, y: 190, n: "就地看数" },
            { x: 430, y: 210, n: "② 亮出02" },
            { x: 585, y: 155, n: "直读结论" },
            { x: 610, y: 280, n: "收口动作" },
          ]
        : [
            { x: 165, y: 120, n: "扫读01直标图" },
            { x: 300, y: 190, n: "确认增幅" },
            { x: 430, y: 210, n: "单次跨缝" },
            { x: 590, y: 168, n: "直读02结论" },
            { x: 615, y: 285, n: "收口" },
          ];
    return {
      pts,
      crossings: 1,
      loadTier: pacing === "staged" ? "最低负荷 · 听讲同步" : "低负荷 · 单次扫通",
      verdict:
        pacing === "staged"
          ? "数据标签就地贴在图形旁，且演讲时先讲清左卡 01 再亮出右卡 02：跨缝仅 1 次，观众耳朵听到的和眼睛看到完全同步。"
          : "数据数值直接标在左卡图形上，右卡只放独立归纳的 3 条行动结论：视线只需跨缝 1 次即可读透整页。",
    };
  }

  function roundBox(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render(t, dt, { still }) {
    const st = getLabState();
    const sim = buildPath(st.mode, st.pacing);

    if (still) {
      phase = 1;
    } else {
      phase = (phase + Math.max(dt, 0.016) * 0.28) % 1;
      dirty = true;
    }
    if (!dirty && !still) return;
    dirty = false;

    const scale = cssW / LAB_W;
    ctx.save();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    // Darkroom velvet wine projection surface
    ctx.fillStyle = "#2A0910";
    ctx.fillRect(0, 0, LAB_W, LAB_H);

    // Projected 16:9 Slide inside Darkroom
    const sx = 28;
    const sy = 22;
    const sw = LAB_W - 56;
    const sh = LAB_H - 44;
    roundBox(sx, sy, sw, sh, 12);
    ctx.fillStyle = "#FBE9E5";
    ctx.fill();
    ctx.strokeStyle = "#8D4650";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Slide header
    ctx.fillStyle = "#1D1315";
    ctx.font = `900 17px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(
      st.mode === "split" ? "反例：左图只标代号，说明藏在右栏" : "正解：左图就地直标，右栏独立收口",
      sx + 26,
      sy + 36
    );

    const c1 = { x: sx + 26, y: sy + 56, w: 356, h: sh - 78 };
    const c2 = { x: sx + 422, y: sy + 56, w: 356, h: sh - 78 };

    // Left Card 01 (Cream)
    roundBox(c1.x, c1.y, c1.w, c1.h, 12);
    ctx.fillStyle = "#FFF8F0";
    ctx.fill();
    ctx.strokeStyle = "#D9C3AD";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = "#6D1E29";
    ctx.font = `700 12px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText("01 季度渠道转化柱图", c1.x + 18, c1.y + 28);

    // Bars inside Card 01
    const bars = [
      { code: "系列 A", direct: "自然搜索 61%", h: 146, col: "#6D1E29" },
      { code: "系列 B", direct: "老客裂变 24%", h: 92, col: "#BB4C56" },
      { code: "系列 C", direct: "投放引流 15%", h: 58, col: "#D7B293" },
    ];
    const baseY = c1.y + c1.h - 46;
    bars.forEach((b, i) => {
      const bx = c1.x + 38 + i * 102;
      ctx.fillStyle = b.col;
      roundBox(bx, baseY - b.h, 58, b.h, 5);
      ctx.fill();
      ctx.fillStyle = "#1D1315";
      ctx.textAlign = "center";
      ctx.font = `600 11.5px "Noto Sans SC", sans-serif`;
      if (st.mode === "split") {
        ctx.fillText(b.code, bx + 29, baseY + 18);
      } else {
        ctx.fillStyle = "#6D1E29";
        ctx.fillText(b.direct.split(" ")[1], bx + 29, baseY - b.h - 8);
        ctx.fillStyle = "#3E2A2E";
        ctx.fillText(b.direct.split(" ")[0], bx + 29, baseY + 18);
      }
    });

    // Right Card 02 (Burgundy, dimmed during first half of staged reveal)
    const stagedDim = st.pacing === "staged" && !still && phase < 0.42;
    ctx.save();
    ctx.globalAlpha = stagedDim ? 0.28 : 1;
    roundBox(c2.x, c2.y, c2.w, c2.h, 12);
    ctx.fillStyle = "#6D1E29";
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#F0D6BC";
    ctx.font = `700 12px "DM Mono", "Noto Sans SC", sans-serif`;
    ctx.fillText(st.mode === "split" ? "02 图例说明（离开左图看不懂）" : "02 独立行动结论（与左图互补）", c2.x + 20, c2.y + 28);

    const rows =
      st.mode === "split"
        ? [
            "■ 系列 A：指代自然搜索渠道占比 61%",
            "■ 系列 B：指代老客裂变转化占比 24%",
            "■ 系列 C：指代付费信息流占比 15%",
            "注：需对照左侧三根柱子自行换算差值",
          ]
        : [
            "• 预算重心：停投低效信息流，聚焦自然内容",
            "• 复利动作：老客裂变激励下月扩容两倍",
            "• 财务结果：综合获客成本环比下降 14%",
          ];
    ctx.fillStyle = "#FFF8F0";
    ctx.font = `400 13px "Noto Sans SC", sans-serif`;
    rows.forEach((line, idx) => {
      ctx.fillText(line, c2.x + 20, c2.y + 74 + idx * 54);
    });
    ctx.restore();

    // Central gutter dashed line
    const midX = (c1.x + c1.w + c2.x) / 2;
    ctx.save();
    ctx.strokeStyle = st.mode === "split" ? "rgba(184,32,42,0.55)" : "rgba(24,96,67,0.45)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(midX, c1.y + 10);
    ctx.lineTo(midX, c1.y + c1.h - 10);
    ctx.stroke();
    ctx.restore();

    // Draw Gaze Saccade Path
    const pts = sim.pts;
    const totalSegs = pts.length - 1;
    const progress = still ? totalSegs : phase * totalSegs;
    const doneIdx = Math.min(totalSegs - 1, Math.floor(progress));
    const frac = progress - doneIdx;

    ctx.save();
    ctx.strokeStyle = st.mode === "split" ? "#D6303A" : "#186043";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= doneIdx; i++) ctx.lineTo(pts[i].x, pts[i].y);
    const curX = pts[doneIdx].x + (pts[doneIdx + 1].x - pts[doneIdx].x) * frac;
    const curY = pts[doneIdx].y + (pts[doneIdx + 1].y - pts[doneIdx].y) * frac;
    if (!still) ctx.lineTo(curX, curY);
    else ctx.lineTo(pts[totalSegs].x, pts[totalSegs].y);
    ctx.stroke();

    // Fixation nodes
    pts.forEach((p, idx) => {
      if (!still && idx > doneIdx + 0.01) return;
      ctx.fillStyle = st.mode === "split" ? "#D6303A" : "#186043";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFF8F0";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });

    // Moving gaze dot
    if (!still) {
      ctx.fillStyle = st.mode === "split" ? "#FF5C66" : "#22A06B";
      ctx.beginPath();
      ctx.arc(curX, curY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFF8F0";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
    if (onMetrics) onMetrics(sim);
  }

  resize();
  new ResizeObserver(() => {
    resize();
    ctl.draw();
  }).observe(canvas);
  const ctl = loop(canvas, render);

  return {
    refresh() {
      phase = 0;
      dirty = true;
      ctl.draw();
    },
  };
}
