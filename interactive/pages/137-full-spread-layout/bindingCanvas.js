// 02 节：跨缝陷阱 · 实体书脊翻页透视与爬移补偿实验室（2D Canvas）
// 纯 2D 物理几何模拟，不画任何人物五官，人物仅用简约深影轮廓表达。

import { loop, pixelRatio } from "../../lib/stage.js";
import { BINDINGS, PALETTE, clamp } from "./model.js";

const FONT_ZH = '"Noto Sans SC", sans-serif';
const FONT_MONO = '"DM Mono", "Noto Sans SC", monospace';

export const BINDING_SUBJECTS = {
  headline: {
    id: "headline",
    label: "跨页大字",
    note: "汉字横跨书脊时，胶装 14mm 暗谷会把正中字符压窄吞噬；若把词间隙对准中缝或换锁线平摊，就能轻松可读。",
  },
  portrait: {
    id: "portrait",
    label: "人物侧影",
    note: "永远不要把人像正面轮廓压在胶装中缝上！折弯会把侧影生硬劈成两半，人物应整体移至左页或右页腹地。",
  },
  facade: {
    id: "facade",
    label: "建筑立面",
    note: "连续重复的立面柱列对 3–6mm 的装订损耗宽容度较高，开启跨缝外推补偿后视觉衔接最自然。",
  },
  route: {
    id: "route",
    label: "折线地图",
    note: "斜穿书脊的航线或公路色带能借助格式塔连续性自动「脑补」跨越暗谷，但关键地名站点必须避开中缝 15mm。",
  },
};

export function mountBindingLab(canvas, getLabState, onReadout) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0;
  let H = 0;
  let dpr = 1;
  let dirty = true;
  let lastReadoutKey = "";

  function resize() {
    const r = canvas.getBoundingClientRect();
    const cw = Math.max(260, Math.round(r.width));
    const ch = Math.max(220, Math.round(r.height));
    const cap = cw <= 480 ? 1.5 : 2;
    const nd = pixelRatio(cap);
    if (cw !== W || ch !== H || nd !== dpr) {
      W = cw;
      H = ch;
      dpr = nd;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dirty = true;
    }
  }

  function computeMetrics(st) {
    const bind = BINDINGS[st.binding] || BINDINGS.perfect;
    // 开合角越大，有效折谷越小；胶装极限角度受物理限制
    const maxAngle = bind.id === "perfect" ? 150 : bind.id === "saddle" ? 172 : 180;
    const effectiveAngle = Math.min(st.openAngle, maxAngle);
    const angleFactor = clamp((180 - effectiveAngle) / 56, 0.08, 1.35);
    const rawLossMm = Number((bind.gutterMm * angleFactor).toFixed(1));
    // 爬移补偿（印前在左/右页内侧各向外复制/推让补偿毫米数）可部分缓解连续图形的视觉错位，但救不了压在中缝的细字或人脸
    const compEffect = st.subject === "facade" || st.subject === "route" ? st.creepMm * 0.72 : st.creepMm * 0.25;
    const netDistortMm = Number(Math.max(0.5, rawLossMm - compEffect).toFixed(1));

    let verdict = "";
    let level = "ok";
    if (netDistortMm >= 9 || (st.subject === "portrait" && rawLossMm >= 7)) {
      level = "danger";
      verdict =
        st.subject === "portrait"
          ? `高危劈裂：${bind.label}在 ${effectiveAngle}° 下折谷约 ${rawLossMm}mm，人物剪影直接被书脊拦腰折断。`
          : `严重吞缝：有效折谷约 ${rawLossMm}mm（补偿后仍损 ${netDistortMm}mm），中段笔画被暗谷挤压失真。`;
    } else if (netDistortMm >= 4.2) {
      level = "warn";
      verdict = `轻度折损：有效折谷约 ${rawLossMm}mm，${st.creepMm > 0 ? `外推补偿 ${st.creepMm}mm 已缓解部分错位，` : ""}仍需避开细小正文与关键节点。`;
    } else {
      level = "ok";
      verdict = `平顺贯通：${effectiveAngle}° 展开下净视觉折损仅约 ${netDistortMm}mm，画面跨越书脊几乎无阻。`;
    }
    return { bind, effectiveAngle, rawLossMm, netDistortMm, verdict, level };
  }

  function drawSubject(sp, st, m) {
    const midX = sp.x + sp.w * 0.5;
    const valleyHalfPx = clamp((m.rawLossMm / 420) * sp.w * 1.15, 2, sp.w * 0.09);
    const shiftPx = (st.creepMm / 420) * sp.w * 1.6; // 印前补偿外移量

    if (st.subject === "headline") {
      const fs = Math.max(20, Math.round(sp.h * 0.24));
      ctx.font = `900 ${fs}px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const chars = ["全", "景", "叙", "事", "跨", "页"];
      const step = sp.w * 0.12;
      const start = midX - ((chars.length - 1) * step) / 2;
      chars.forEach((ch, i) => {
        const cx = start + i * step;
        const side = cx < midX ? -1 : 1;
        const distSpine = Math.abs(cx - midX);
        const inside = distSpine < valleyHalfPx + fs * 0.34;
        const squeeze = inside ? clamp(1 - (1 - distSpine / (valleyHalfPx + fs * 0.34)) * (m.rawLossMm / 19), 0.36, 1) : 1;
        ctx.save();
        ctx.translate(cx + side * shiftPx * 0.35, sp.y + sp.h * 0.48);
        ctx.scale(squeeze, 1);
        ctx.fillStyle = inside && m.rawLossMm >= 7 ? "#FFB3BE" : PALETTE.cream;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      return;
    }

    if (st.subject === "portrait") {
      // 简约无五官侧影剪影（严格遵守不画眼嘴五官的规范！）
      const cy = sp.y + sp.h * 0.54;
      const r = Math.min(sp.w, sp.h) * 0.16;
      const drawHalf = (side) => {
        ctx.save();
        ctx.beginPath();
        if (side < 0) ctx.rect(sp.x, sp.y, sp.w * 0.5, sp.h);
        else ctx.rect(midX, sp.y, sp.w * 0.5, sp.h);
        ctx.clip();

        const pinch = m.rawLossMm > 4 ? (m.rawLossMm / 18) * (r * 0.48) : 0;
        const ox = midX - side * pinch + side * shiftPx * 0.2;
        ctx.fillStyle = PALETTE.rose;
        // 头部圆润剪影（无五官）
        ctx.beginPath();
        ctx.arc(ox, cy - r * 0.72, r * 0.62, 0, Math.PI * 2);
        ctx.fill();
        // 颈肩剪影
        ctx.beginPath();
        ctx.moveTo(ox - r * 1.35, sp.y + sp.h);
        ctx.quadraticCurveTo(ox - r * 1.15, cy + r * 0.02, ox - r * 0.28, cy - r * 0.12);
        ctx.lineTo(ox + r * 0.28, cy - r * 0.12);
        ctx.quadraticCurveTo(ox + r * 1.15, cy + r * 0.02, ox + r * 1.35, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawHalf(-1);
      drawHalf(1);
      return;
    }

    if (st.subject === "facade") {
      // 连续建筑拱廊立面
      const cols = 10;
      const pad = sp.w * 0.07;
      const colW = (sp.w - pad * 2) / cols;
      const topY = sp.y + sp.h * 0.22;
      const botY = sp.y + sp.h * 0.80;
      ctx.strokeStyle = PALETTE.mint;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(sp.x + pad, topY, sp.w - pad * 2, botY - topY);
      for (let i = 0; i < cols; i++) {
        const ax = sp.x + pad + i * colW + colW * 0.18;
        const aw = colW * 0.64;
        const side = ax + aw * 0.5 < midX ? -1 : 1;
        const distSpine = Math.abs(ax + aw * 0.5 - midX);
        const squeeze = distSpine < valleyHalfPx + colW * 0.5 ? clamp(1 - m.netDistortMm / 24, 0.52, 1) : 1;
        ctx.save();
        ctx.translate(ax + aw * 0.5 + side * shiftPx * 0.2, botY);
        ctx.scale(squeeze, 1);
        ctx.fillStyle = "rgba(244, 109, 159, 0.78)";
        ctx.beginPath();
        ctx.moveTo(-aw * 0.5, 0);
        ctx.lineTo(-aw * 0.5, -(botY - topY) * 0.55);
        ctx.arc(0, -(botY - topY) * 0.55, aw * 0.5, Math.PI, 0);
        ctx.lineTo(aw * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    // route：斜穿书脊的折线航路与站点
    ctx.strokeStyle = PALETTE.rose;
    ctx.lineWidth = Math.max(6, sp.h * 0.07);
    ctx.lineCap = "round";
    const gapShift = Math.max(0, (m.netDistortMm / 18) * (sp.h * 0.08));
    ctx.beginPath();
    ctx.moveTo(sp.x + sp.w * 0.05, sp.y + sp.h * 0.76);
    ctx.lineTo(midX, sp.y + sp.h * 0.48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, sp.y + sp.h * 0.48 + gapShift);
    ctx.lineTo(sp.x + sp.w * 0.95, sp.y + sp.h * 0.24 + gapShift);
    ctx.stroke();

    // 关键站点标注（展示中缝站点受威胁 vs 侧区站点清晰）
    const pts = [
      { x: sp.x + sp.w * 0.20, y: sp.y + sp.h * 0.66, name: "起点港" },
      { x: midX, y: sp.y + sp.h * 0.48, name: "中缝站", risky: m.rawLossMm >= 7 },
      { x: sp.x + sp.w * 0.80, y: sp.y + sp.h * 0.32 + gapShift, name: "终岬角" },
    ];
    pts.forEach((p) => {
      ctx.fillStyle = p.risky ? PALETTE.danger : PALETTE.mint;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `600 10px ${FONT_ZH}`;
      ctx.textAlign = "center";
      ctx.fillStyle = p.risky ? "#FFB3BE" : PALETTE.cream;
      ctx.fillText(p.name, p.x, p.y - 13);
    });
  }

  function render(_t, _dt, { still }) {
    resize();
    if (!dirty && !still) return;
    dirty = false;

    const st = getLabState();
    const m = computeMetrics(st);
    const key = `${st.binding}-${st.subject}-${m.effectiveAngle}-${st.creepMm}`;
    if (key !== lastReadoutKey && onReadout) {
      lastReadoutKey = key;
      onReadout(m);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#160734";
    ctx.fillRect(0, 0, W, H);

    const padX = W < 500 ? 12 : 18;
    const topPad = 14;
    const profH = 72;
    const availW = W - padX * 2;
    const availH = H - topPad - profH - 18;
    let sw = availW;
    let sh = sw / 1.94;
    if (sh > availH) {
      sh = availH;
      sw = sh * 1.94;
    }
    const sp = {
      x: Math.round((W - sw) * 0.5),
      y: Math.round(topPad + (availH - sh) * 0.5),
      w: sw,
      h: sh,
    };
    const midX = sp.x + sp.w * 0.5;

    // 跨页底板
    ctx.fillStyle = PALETTE.indigo;
    ctx.fillRect(sp.x, sp.y, sp.w, sp.h);

    // 绘制选定测试题材
    ctx.save();
    ctx.beginPath();
    ctx.rect(sp.x, sp.y, sp.w, sp.h);
    ctx.clip();
    drawSubject(sp, st, m);

    // 真实折谷光照阴影
    const vPx = clamp((m.rawLossMm / 420) * sp.w * 1.6, 3, sp.w * 0.11);
    const dark = clamp(m.rawLossMm / 20, 0.1, 0.72);
    const grad = ctx.createLinearGradient(midX - vPx, 0, midX + vPx, 0);
    grad.addColorStop(0, "rgba(8, 2, 22, 0)");
    grad.addColorStop(0.5, `rgba(6, 1, 16, ${dark})`);
    grad.addColorStop(1, "rgba(8, 2, 22, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(midX - vPx, sp.y, vPx * 2, sp.h);

    // 中缝红/绿虚线
    ctx.strokeStyle = m.level === "danger" ? PALETTE.danger : m.level === "warn" ? PALETTE.warn : PALETTE.mint;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, sp.y);
    ctx.lineTo(midX, sp.y + sp.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.strokeStyle = PALETTE.indigoBorder;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sp.x + 0.5, sp.y + 0.5, sp.w - 1, sp.h - 1);

    // 底部书页剖面物理曲率图
    const py = sp.y + sp.h + 10;
    const baseY = py + profH * 0.54;
    const dipPx = clamp((m.rawLossMm / 16) * 26, 2, 28);
    ctx.strokeStyle = PALETTE.indigoBorder;
    ctx.strokeRect(sp.x + 0.5, py + 0.5, sp.w - 1, profH - 4);

    // 绘制开合剖面曲线
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      const x = sp.x + 12 + u * (sp.w - 24);
      const d = Math.abs(u - 0.5) * 2;
      const y = baseY - Math.sin(d * Math.PI) * (dipPx * 0.25) + Math.exp(-Math.pow(d / 0.22, 1.5)) * dipPx;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 剖面标签
    ctx.font = `500 10px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.mint;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`OPEN ${m.effectiveAngle}° · 折谷 ${m.rawLossMm}mm`, sp.x + 10, py + 7);
    ctx.textAlign = "right";
    ctx.fillStyle = m.level === "danger" ? "#FFB3BE" : m.level === "warn" ? PALETTE.warn : PALETTE.ok;
    ctx.fillText(`补偿 ${st.creepMm}mm → 净损 ${m.netDistortMm}mm`, sp.x + sp.w - 10, py + 7);

    ctx.restore();
  }

  const ro = new ResizeObserver(() => {
    resize();
    dirty = true;
    ctrl.draw();
  });
  ro.observe(canvas);

  const ctrl = loop(canvas, render);
  resize();
  ctrl.draw();

  return {
    redraw() {
      dirty = true;
      ctrl.draw();
    },
  };
}
