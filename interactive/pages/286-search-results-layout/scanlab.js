// Section 02 2D Canvas：三代搜索结果眼动扫视路径播放器（示意模型）
// 对比 F 型纵扫（Nielsen 2006）、首位强化金三角（Granka 2004）与富媒体弹球模式（NN/g 2019）
import { loop, pixelRatio } from "../../lib/stage.js";

export const SCAN_MODES = {
  "f-pattern": {
    id: "f-pattern",
    label: "纯文字十条蓝链 · F 型纵扫",
    badge: "Nielsen (2006) F 型规律示意",
    summary: "当每条结果长得一模一样、没有图片和强色差时，眼睛先横向扫过第 1 条和第 2 条标题，随后贴着左缘一路向下掠读开头三四个字，右侧大段文字几乎被跳过。",
    layout: "list",
    fixations: [
      { t: 0.0, x: 0.14, y: 0.19, r: 16, tag: "扫第 1 条开头" },
      { t: 0.6, x: 0.44, y: 0.19, r: 13, tag: "读完第 1 标题" },
      { t: 1.2, x: 0.66, y: 0.21, r: 10, tag: "瞥一眼摘要" },
      { t: 1.9, x: 0.15, y: 0.37, r: 14, tag: "折返第 2 条" },
      { t: 2.6, x: 0.46, y: 0.37, r: 11, tag: "横扫前半句" },
      { t: 3.3, x: 0.14, y: 0.54, r: 12, tag: "左脊下掠 #3" },
      { t: 4.1, x: 0.15, y: 0.70, r: 11, tag: "左脊下掠 #4" },
      { t: 4.9, x: 0.14, y: 0.85, r: 10, tag: "左脊下掠 #5" },
    ],
  },
  golden: {
    id: "golden",
    label: "首位强化卡片 · 节奏停顿",
    badge: "286 原海报结构示意",
    summary: "第 1 条用焦陶细框、折角星标和 4 枚关键词签构成高对比入口，眼睛先稳稳停在首位确认相关性；若不满足，再沿统一左缘顺滑下移检查 #2、#3，既不盲跳也不拉锯。",
    layout: "featured",
    fixations: [
      { t: 0.0, x: 0.15, y: 0.18, r: 18, tag: "锁定首位标题" },
      { t: 0.7, x: 0.48, y: 0.18, r: 15, tag: "核验高亮词" },
      { t: 1.4, x: 0.26, y: 0.27, r: 13, tag: "扫网址与摘要" },
      { t: 2.1, x: 0.42, y: 0.36, r: 11, tag: "扫关键词标签" },
      { t: 2.9, x: 0.78, y: 0.27, r: 10, tag: "确认图示形态" },
      { t: 3.7, x: 0.16, y: 0.56, r: 13, tag: "顺滑移至 #2" },
      { t: 4.5, x: 0.38, y: 0.56, r: 10, tag: "快速比对 #2" },
      { t: 5.3, x: 0.16, y: 0.77, r: 11, tag: "核对 #3 基准" },
    ],
  },
  pinball: {
    id: "pinball",
    label: "富媒体混排页 · 弹球折返",
    badge: "NN/g (2019) 弹球模式示意",
    summary: "现代搜索页叠加右侧知识卡、中间图集与折叠追问框后，视线像弹珠一样在左右强信号块间反复折返；这提高了直达答案的机会，但一旦视觉权重失控，反而让人眼花缭乱。",
    layout: "rich",
    fixations: [
      { t: 0.0, x: 0.18, y: 0.20, r: 15, tag: "落眼顶部直答" },
      { t: 0.7, x: 0.78, y: 0.26, r: 16, tag: "弹向右侧知识卡" },
      { t: 1.5, x: 0.46, y: 0.44, r: 14, tag: "折返中部图集" },
      { t: 2.3, x: 0.22, y: 0.27, r: 12, tag: "回看第 1 摘要" },
      { t: 3.1, x: 0.76, y: 0.52, r: 12, tag: "再瞥右侧属性" },
      { t: 3.9, x: 0.20, y: 0.66, r: 13, tag: "下跳追问折叠" },
      { t: 4.7, x: 0.48, y: 0.83, r: 11, tag: "落到自然结果 #2" },
      { t: 5.4, x: 0.18, y: 0.83, r: 11, tag: "回到左缘标题" },
    ],
  },
};

export function createScanLab(canvas, { onTimeUpdate }) {
  const ctx = canvas.getContext("2d");
  let w = 680;
  let h = 360;
  let modeId = "f-pattern";
  let playing = true;
  let simTime = 2.4; // 开场直接停在有完整轨迹可读的 2.4s，绝不空白！
  const DURATION = 6.0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = pixelRatio(2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rrect(x, y, rw, rh, r) {
    const rr = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
    ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
    ctx.arcTo(x, y + rh, x, y, rr);
    ctx.arcTo(x, y, x + rw, y, rr);
    ctx.closePath();
  }

  function drawWireframe(layout) {
    const pad = 16;
    const innerW = w - pad * 2;
    // 顶部迷你搜索条
    rrect(pad, 12, innerW, 24, 12);
    ctx.fillStyle = "#FFFDF8";
    ctx.fill();
    ctx.strokeStyle = "#D8CFC0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#2A508E";
    rrect(pad + innerW - 50, 12, 50, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#7D756A";
    ctx.fillRect(pad + 14, 21, Math.min(120, innerW * 0.28), 6);

    if (layout === "list") {
      // 5 条等高无图蓝链
      const startY = 48;
      const rowH = (h - startY - 14) / 5;
      for (let i = 0; i < 5; i++) {
        const y = startY + i * rowH;
        rrect(pad, y, innerW, rowH - 7, 5);
        ctx.fillStyle = "#FFFDF8";
        ctx.fill();
        ctx.strokeStyle = "#E4DDD0";
        ctx.stroke();
        ctx.fillStyle = "#2A508E";
        ctx.fillRect(pad + 14, y + 10, innerW * (0.46 + (i % 2) * 0.08), 8);
        ctx.fillStyle = "#275A3A";
        ctx.fillRect(pad + 14, y + 23, innerW * 0.26, 4);
        ctx.fillStyle = "#C6BFAF";
        ctx.fillRect(pad + 14, y + 32, innerW * 0.72, 5);
      }
    } else if (layout === "featured") {
      // #1 红框星标大卡 + #2 #3 标准卡
      const topY = 48;
      const topH = (h - topY - 14) * 0.44;
      rrect(pad, topY, innerW, topH, 8);
      ctx.fillStyle = "#FFFDF8";
      ctx.fill();
      ctx.strokeStyle = "#B6481E";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.lineWidth = 1;
      // 首位标题/URL/摘要/标签/缩略图
      const thumbW = Math.min(96, innerW * 0.22);
      ctx.fillStyle = "#B6481E";
      ctx.beginPath();
      ctx.arc(pad + 18, topY + 20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1E3E78";
      ctx.fillRect(pad + 34, topY + 14, innerW - thumbW - 60, 10);
      ctx.fillStyle = "#275A3A";
      ctx.fillRect(pad + 34, topY + 30, (innerW - thumbW) * 0.42, 5);
      ctx.fillStyle = "#B8B0A0";
      ctx.fillRect(pad + 34, topY + 43, innerW - thumbW - 56, 6);
      ctx.fillRect(pad + 34, topY + 54, (innerW - thumbW) * 0.65, 6);
      // 3 枚淡蓝标签
      for (let t = 0; t < 3; t++) {
        rrect(pad + 34 + t * 52, topY + topH - 26, 44, 14, 7);
        ctx.fillStyle = "#E4EBF4";
        ctx.fill();
      }
      // 缩略图
      rrect(pad + innerW - thumbW - 12, topY + 14, thumbW, topH - 28, 6);
      ctx.fillStyle = "#D8DFE8";
      ctx.fill();

      // #2 & #3 统一卡
      const remY = topY + topH + 10;
      const cardH = (h - remY - 12) / 2;
      for (let i = 0; i < 2; i++) {
        const y = remY + i * cardH;
        rrect(pad, y, innerW, cardH - 8, 7);
        ctx.fillStyle = "#FFFDF8";
        ctx.fill();
        ctx.strokeStyle = "#DDD5C6";
        ctx.stroke();
        ctx.fillStyle = "#2A508E";
        ctx.beginPath();
        ctx.arc(pad + 18, y + 18, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(pad + 34, y + 13, (innerW - thumbW) * 0.68, 8);
        ctx.fillStyle = "#275A3A";
        ctx.fillRect(pad + 34, y + 26, (innerW - thumbW) * 0.36, 4);
        ctx.fillStyle = "#C6BFAF";
        ctx.fillRect(pad + 34, y + 36, (innerW - thumbW) * 0.78, 5);
        rrect(pad + innerW - thumbW - 12, y + 10, thumbW, cardH - 28, 5);
        ctx.fillStyle = "#DCE2EA";
        ctx.fill();
      }
    } else {
      // rich pinball: 左 62% 精选 + 图集 + 追问 + 列表，右 34% 知识面板
      const topY = 48;
      const bodyH = h - topY - 14;
      const leftW = innerW * 0.62;
      const rightX = pad + leftW + 12;
      const rightW = innerW - leftW - 12;
      // 右侧知识卡
      rrect(rightX, topY, rightW, bodyH * 0.64, 7);
      ctx.fillStyle = "#EEF2F7";
      ctx.fill();
      ctx.strokeStyle = "#C8D3E3";
      ctx.stroke();
      rrect(rightX + 10, topY + 10, rightW - 20, 48, 5);
      ctx.fillStyle = "#C3D0E3";
      ctx.fill();
      ctx.fillStyle = "#2A508E";
      ctx.fillRect(rightX + 10, topY + 68, rightW * 0.6, 8);
      ctx.fillStyle = "#9BA8BD";
      ctx.fillRect(rightX + 10, topY + 84, rightW * 0.8, 5);
      ctx.fillRect(rightX + 10, topY + 96, rightW * 0.65, 5);

      // 左侧四异构块
      const blocks = [
        { h: 0.28, bg: "#FFFDF8", bd: "#B6481E" },
        { h: 0.22, bg: "#F4EDE0", bd: "#D8CFC0" },
        { h: 0.20, bg: "#FFFDF8", bd: "#DDD5C6" },
        { h: 0.22, bg: "#FFFDF8", bd: "#DDD5C6" },
      ];
      let y = topY;
      blocks.forEach((b, idx) => {
        const bh = bodyH * b.h;
        rrect(pad, y, leftW, bh - 6, 6);
        ctx.fillStyle = b.bg;
        ctx.fill();
        ctx.strokeStyle = b.bd;
        ctx.stroke();
        if (idx === 1) {
          // 3 格小图集
          const cw = (leftW - 28) / 3;
          for (let k = 0; k < 3; k++) {
            rrect(pad + 8 + k * (cw + 6), y + 8, cw, bh - 22, 4);
            ctx.fillStyle = "#CAD5E4";
            ctx.fill();
          }
        } else {
          ctx.fillStyle = idx === 2 ? "#5E574E" : "#1E3E78";
          ctx.fillRect(pad + 12, y + 10, leftW * 0.64, 7);
          ctx.fillStyle = "#C0B8A8";
          ctx.fillRect(pad + 12, y + 24, leftW * 0.82, 5);
        }
        y += bh + 4;
      });
    }
  }

  function render(t, dt, { still }) {
    resize();
    const mode = SCAN_MODES[modeId];
    if (still) {
      simTime = 5.4;
    } else if (playing && dt > 0) {
      simTime = (simTime + dt) % DURATION;
      onTimeUpdate?.(simTime);
    }

    ctx.fillStyle = "#F4EDE0";
    ctx.fillRect(0, 0, w, h);

    drawWireframe(mode.layout);

    // 找截至 simTime 的所有注视点
    const pts = mode.fixations.map((f, idx) => ({
      ...f,
      idx: idx + 1,
      px: f.x * w,
      py: f.y * h,
    }));
    const reached = pts.filter((p) => p.t <= simTime);
    const nextPt = pts.find((p) => p.t > simTime);

    // 柔和热区底晕
    for (const p of reached) {
      const grad = ctx.createRadialGradient(p.px, p.py, 2, p.px, p.py, p.r * 2.2);
      grad.addColorStop(0, "rgba(182, 72, 30, 0.24)");
      grad.addColorStop(1, "rgba(182, 72, 30, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 眼跳路径（虚线连接）
    if (reached.length > 1) {
      ctx.strokeStyle = "#B6481E";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(reached[0].px, reached[0].py);
      for (let i = 1; i < reached.length; i++) {
        ctx.lineTo(reached[i].px, reached[i].py);
      }
      // 若正在前往下一个点，画前进中线段
      if (nextPt) {
        const prev = reached[reached.length - 1];
        const frac = Math.max(0, Math.min(1, (simTime - prev.t) / Math.max(0.01, nextPt.t - prev.t)));
        ctx.lineTo(prev.px + (nextPt.px - prev.px) * frac, prev.py + (nextPt.py - prev.py) * frac);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 注视圆环与序号
    for (let i = 0; i < reached.length; i++) {
      const p = reached[i];
      const isCurrent = i === reached.length - 1;
      ctx.beginPath();
      ctx.arc(p.px, p.py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? "#B6481E" : "rgba(42, 80, 142, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "#FFFDF8";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#FFFDF8";
      ctx.font = `700 11px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(p.idx), p.px, p.py + 0.5);
    }

    // 当前注视说明标签
    const cur = reached[reached.length - 1];
    if (cur) {
      const label = `${cur.idx}. ${cur.tag}`;
      ctx.font = `600 11px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(label).width + 16;
      const lx = Math.max(12, Math.min(w - tw - 12, cur.px - tw / 2));
      const ly = cur.py > h * 0.78 ? cur.py - cur.r - 28 : cur.py + cur.r + 8;
      rrect(lx, ly, tw, 22, 4);
      ctx.fillStyle = "#141311";
      ctx.fill();
      ctx.fillStyle = "#FAF5EC";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + 8, ly + 11);
    }
  }

  const ctrl = loop(canvas, render);
  const ro = new ResizeObserver(() => ctrl.draw());
  ro.observe(canvas);

  return {
    setMode(id) {
      if (!SCAN_MODES[id]) return;
      modeId = id;
      simTime = 2.6;
      ctrl.draw();
    },
    setPlaying(v) {
      playing = !!v;
      ctrl.draw();
    },
    setTime(sec) {
      simTime = Math.max(0, Math.min(DURATION, Number(sec) || 0));
      playing = false;
      ctrl.draw();
    },
    getState: () => ({ modeId, playing, simTime }),
    draw: () => ctrl.draw(),
  };
}
