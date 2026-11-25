// Section 03 深梅紫暗室 · 2D Canvas 活体条件分支与跳步路径图
import { loop, pixelRatio } from "../../lib/stage.js";

export function mountBranchCanvas(canvas, { getBranch }) {
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    W = Math.max(260, Math.round(r.width));
    H = Math.max(210, Math.round(r.height));
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function render(t, _dt, { still }) {
    if (!W) resize();
    const data = getBranch();
    const { nodes, activeNodes } = data;
    const compact = W < 560;

    ctx.clearRect(0, 0, W, H);

    // 暗室底板网格点
    ctx.fillStyle = "rgba(253, 197, 182, 0.12)";
    const stepG = compact ? 22 : 28;
    for (let gx = 16; gx < W - 12; gx += stepG) {
      for (let gy = 16; gy < H - 12; gy += stepG) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }

    // 节点坐标：宽屏横向 6 列，窄屏 2 行×3 列蛇形展开（绝不压扁）
    const pts = [];
    if (!compact) {
      const pad = 54;
      const span = W - pad * 2;
      const baseY = H * 0.54;
      for (let i = 0; i < nodes.length; i++) {
        const x = pad + (span * i) / (nodes.length - 1);
        const y = nodes[i].active ? baseY : baseY + 34;
        pts.push({ x, y, node: nodes[i] });
      }
    } else {
      // 2×3 整齐网格
      const cols = 3;
      const padX = Math.max(46, W * 0.15);
      const spanX = W - padX * 2;
      const y1 = H * 0.30;
      const y2 = H * 0.72;
      for (let i = 0; i < nodes.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padX + (spanX * col) / (cols - 1);
        const y = row === 0 ? y1 : y2;
        pts.push({ x, y, node: nodes[i] });
      }
    }

    // 1. 底层灰色全流程基准虚线
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(253, 197, 182, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. 实际走过的亮珊瑚路径（跳步时向上画出优雅弧桥）
    const activePts = pts.filter((p) => p.node.active);
    const segments = [];
    for (let i = 0; i < activePts.length - 1; i++) {
      const a = activePts[i];
      const b = activePts[i + 1];
      const ai = pts.indexOf(a);
      const bi = pts.indexOf(b);
      const jumped = bi - ai > 1;
      const cx = (a.x + b.x) / 2;
      const cy = jumped
        ? Math.min(a.y, b.y) - (compact ? 26 : 56)
        : (a.y + b.y) / 2 - (compact && Math.abs(a.y - b.y) > 20 ? 8 : 0);
      segments.push({ a, b, cx, cy, jumped, skippedCount: bi - ai - 1 });

      ctx.strokeStyle = jumped ? "#FF9A70" : "#F47341";
      ctx.lineWidth = jumped ? 2.8 : 2.4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.stroke();

      if (jumped) {
        const midX = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
        const midY = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
        const lbl = `跳过 ${bi - ai - 1} 步`;
        roundRect(midX - 31, midY - 11, 62, 20, 10);
        ctx.fillStyle = "#5E1949";
        ctx.fill();
        ctx.strokeStyle = "#FF9A70";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#FFF3EE";
        ctx.font = `600 10px "Sora", "Noto Sans SC", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(lbl, midX, midY - 0.5);
      }
    }

    // 3. 沿实际路径缓缓流动的光点（still 时停在路径中段）
    if (segments.length > 0) {
      const phase = still ? 0.55 : (t * 0.38) % 1;
      const totalPos = phase * segments.length;
      const si = Math.min(segments.length - 1, Math.floor(totalPos));
      const u = totalPos - si;
      const seg = segments[si];
      const px = (1 - u) * (1 - u) * seg.a.x + 2 * (1 - u) * u * seg.cx + u * u * seg.b.x;
      const py = (1 - u) * (1 - u) * seg.a.y + 2 * (1 - u) * u * seg.cy + u * u * seg.b.y;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 154, 112, 0.30)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF3EE";
      ctx.fill();
    }

    // 4. 绘制 6 个步骤节点
    for (let i = 0; i < pts.length; i++) {
      const { x, y, node } = pts[i];
      const activeIdx = activeNodes.indexOf(node);
      const r = compact ? 18 : 22;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (node.active) {
        ctx.fillStyle = activeIdx === activeNodes.length - 1 ? "#1A6E4E" : activeIdx === 0 ? "#611A45" : "#D44E20";
        ctx.fill();
        ctx.strokeStyle = "#FDC5B6";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#3A122E";
        ctx.fill();
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(253, 197, 182, 0.38)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // 节点内编号或跳过符
      ctx.fillStyle = node.active ? "#FFFFFF" : "rgba(253, 197, 182, 0.55)";
      ctx.font = `700 ${compact ? 11 : 12}px "Sora", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.active ? String(activeIdx + 1) : "—", x, y + 0.5);

      // 节点下方标题与字段数
      const ty = y + r + 13;
      ctx.fillStyle = node.active ? "#FFF3EE" : "rgba(253, 197, 182, 0.58)";
      ctx.font = `600 ${compact ? 11 : 12}px "Noto Sans SC", sans-serif`;
      ctx.fillText(node.title, x, ty);

      ctx.fillStyle = node.active ? "#FF9A70" : "rgba(253, 197, 182, 0.48)";
      ctx.font = `500 10px "Sora", "Noto Sans SC", sans-serif`;
      ctx.fillText(node.active ? `${node.fields} 项` : `免填 ${node.fields} 项`, x, ty + 15);
    }

    // 5. 顶沿汇总条
    ctx.fillStyle = "rgba(253, 197, 182, 0.85)";
    ctx.font = `600 11px "Sora", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`实走 ${activeNodes.length} / ${nodes.length} 步 · 需填 ${data.activeFields} / ${data.totalFields} 项`, 14, 12);

    if (data.savedFields > 0) {
      ctx.fillStyle = "#7CE3B8";
      ctx.textAlign = "right";
      ctx.fillText(`动态省去 ${data.savedFields} 项`, W - 14, 12);
    }
    dirty = false;
  }

  const ro = new ResizeObserver(() => { resize(); ctl.draw(); });
  ro.observe(canvas);
  const ctl = loop(canvas, render);
  resize();

  return {
    redraw() {
      dirty = true;
      ctl.draw();
    },
  };
}
