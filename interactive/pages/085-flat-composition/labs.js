// 085 平面化构图 · 01–06 节独立交互组件（相邻两节控件形态与交互机制完全不同）
import { clamp } from "./model.js";
import { pixelRatio } from "../../lib/stage.js";

// =========================================================================
// 01 节：双联刮幕对比器（透视空间 VS 平面化表达）+ 5米退后远距缩略检视
// =========================================================================
export function mountCompareCurtain() {
  const wrap = document.getElementById("curtain-wrap");
  const canvas = document.getElementById("curtain-canvas");
  const range = document.getElementById("curtain-range");
  const distBtn = document.getElementById("curtain-dist");
  const readout = document.getElementById("curtain-readout");
  if (!wrap || !canvas) return;

  const ctx = canvas.getContext("2d");
  let split = 0.5;
  let farView = false;
  let dragging = false;

  function drawSceneSide(c, W, H, isFlat) {
    // 背景蓝墙与灰/奶白壁
    if (isFlat) {
      c.fillStyle = "#FCF2DA";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#0042AF";
      c.fillRect(0, 0, W * 0.25, H * 0.72);
      // 右蓝拱门
      const ax = W * 0.73, aw = W * 0.17, ah = H * 0.44, ay = H * 0.72 - ah;
      c.beginPath();
      c.moveTo(ax, ay + ah);
      c.lineTo(ax, ay + aw * 0.5);
      c.arc(ax + aw * 0.5, ay + aw * 0.5, aw * 0.5, Math.PI, 0, false);
      c.lineTo(ax + aw, ay + ah);
      c.closePath();
      c.fill();
      // 纯红台面
      c.fillStyle = "#F13C1A";
      c.fillRect(0, H * 0.72, W, H * 0.28);
      // 纯黑花瓶剪影
      c.fillStyle = "#080808";
      const vx = W * 0.34, vy = H * 0.26, vw = W * 0.17, vh = H * 0.64;
      c.beginPath();
      c.moveTo(vx - vw * 0.32, vy + vh);
      c.bezierCurveTo(vx - vw * 0.62, vy + vh * 0.68, vx - vw * 0.5, vy + vh * 0.36, vx - vw * 0.16, vy + vh * 0.2);
      c.lineTo(vx - vw * 0.26, vy);
      c.lineTo(vx + vw * 0.26, vy);
      c.lineTo(vx + vw * 0.16, vy + vh * 0.2);
      c.bezierCurveTo(vx + vw * 0.5, vy + vh * 0.36, vx + vw * 0.62, vy + vh * 0.68, vx + vw * 0.32, vy + vh);
      c.closePath();
      c.fill();
      // 纯奶白碗 + 蓝口
      const bx = W * 0.61, by = H * 0.72, bw = W * 0.24, bh = H * 0.2;
      c.fillStyle = "#FFF2DB";
      c.beginPath();
      c.moveTo(bx - bw * 0.5, by);
      c.bezierCurveTo(bx - bw * 0.42, by + bh * 1.15, bx + bw * 0.42, by + bh * 1.15, bx + bw * 0.5, by);
      c.closePath();
      c.fill();
      c.fillStyle = "#0042AF";
      c.beginPath();
      c.ellipse(bx, by, bw * 0.49, bh * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 透视写实房间（灰墙明暗渐变、透视倾斜木桌、花瓶球面反光与长投影）
      const bg = c.createLinearGradient(0, 0, W, H * 0.75);
      bg.addColorStop(0, "#BDB9B0");
      bg.addColorStop(0.5, "#D9D5CC");
      bg.addColorStop(1, "#A8A49B");
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      // 左侧带阴影蓝壁
      const bwL = c.createLinearGradient(0, 0, W * 0.26, 0);
      bwL.addColorStop(0, "#1A3E86");
      bwL.addColorStop(1, "#3B5E9C");
      c.fillStyle = bwL;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(W * 0.24, H * 0.08);
      c.lineTo(W * 0.24, H * 0.67);
      c.lineTo(0, H * 0.78);
      c.closePath();
      c.fill();
      // 右拱门透视内壁
      const ax = W * 0.74, aw = W * 0.16, ah = H * 0.4, ay = H * 0.67 - ah;
      c.fillStyle = "#2A4C8C";
      c.beginPath();
      c.moveTo(ax, ay + ah);
      c.lineTo(ax, ay + aw * 0.5);
      c.arc(ax + aw * 0.5, ay + aw * 0.5, aw * 0.5, Math.PI, 0, false);
      c.lineTo(ax + aw, ay + ah);
      c.closePath();
      c.fill();
      // 透视木桌
      const tGrad = c.createLinearGradient(0, H * 0.64, 0, H);
      tGrad.addColorStop(0, "#9E8975");
      tGrad.addColorStop(0.5, "#7F6B59");
      tGrad.addColorStop(1, "#554537");
      c.fillStyle = tGrad;
      c.beginPath();
      c.moveTo(W * 0.12, H * 0.67);
      c.lineTo(W * 0.89, H * 0.67);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
      // 写实桌面侧厚与阴影
      c.fillStyle = "rgba(25,20,16,0.34)";
      c.beginPath();
      c.ellipse(W * 0.44, H * 0.85, W * 0.15, H * 0.06, -0.05, 0, Math.PI * 2);
      c.ellipse(W * 0.67, H * 0.85, W * 0.13, H * 0.045, 0.05, 0, Math.PI * 2);
      c.fill();
      // 立体高光花瓶
      const vx = W * 0.34, vy = H * 0.31, vw = W * 0.16, vh = H * 0.56;
      const vg = c.createRadialGradient(vx - vw * 0.14, vy + vh * 0.5, vw * 0.06, vx, vy + vh * 0.6, vw * 0.68);
      vg.addColorStop(0, "#918E88");
      vg.addColorStop(0.52, "#44423E");
      vg.addColorStop(1, "#1D1C1A");
      c.fillStyle = vg;
      c.beginPath();
      c.moveTo(vx - vw * 0.3, vy + vh);
      c.bezierCurveTo(vx - vw * 0.58, vy + vh * 0.68, vx - vw * 0.46, vy + vh * 0.38, vx - vw * 0.15, vy + vh * 0.22);
      c.lineTo(vx - vw * 0.23, vy);
      c.lineTo(vx + vw * 0.23, vy);
      c.lineTo(vx + vw * 0.15, vy + vh * 0.22);
      c.bezierCurveTo(vx + vw * 0.46, vy + vh * 0.38, vx + vw * 0.58, vy + vh * 0.68, vx + vw * 0.3, vy + vh);
      c.closePath();
      c.fill();
      // 立体灰瓷碗
      const bx = W * 0.61, by = H * 0.72, bw = W * 0.22, bh = H * 0.16;
      const bgBowl = c.createLinearGradient(bx - bw * 0.5, by, bx + bw * 0.5, by + bh);
      bgBowl.addColorStop(0, "#B7B4AC");
      bgBowl.addColorStop(0.55, "#83827C");
      bgBowl.addColorStop(1, "#494945");
      c.fillStyle = bgBowl;
      c.beginPath();
      c.moveTo(bx - bw * 0.5, by);
      c.bezierCurveTo(bx - bw * 0.4, by + bh * 1.1, bx + bw * 0.4, by + bh * 1.1, bx + bw * 0.5, by);
      c.closePath();
      c.fill();
      c.fillStyle = "#5B6D83";
      c.beginPath();
      c.ellipse(bx, by, bw * 0.48, bh * 0.24, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  function draw() {
    const r = canvas.getBoundingClientRect();
    const dpr = pixelRatio(2);
    const W = Math.max(260, Math.round(r.width));
    const H = Math.max(170, Math.round(r.height));
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // 远距 5 米模拟：将两张图并排缩成小幅挂在街墙上，实测远看辨识度
    if (farView) {
      ctx.fillStyle = "#E6DEC9";
      ctx.fillRect(0, 0, W, H);
      const pw = Math.min(W * 0.34, 150);
      const ph = pw * 0.64;
      const y0 = (H - ph) * 0.5;
      const lx = W * 0.27 - pw * 0.5;
      const rx = W * 0.73 - pw * 0.5;
      // 左图：透视写实缩小版（模糊灰糊）
      ctx.save();
      ctx.translate(lx, y0);
      ctx.beginPath();
      ctx.rect(0, 0, pw, ph);
      ctx.clip();
      drawSceneSide(ctx, pw, ph, false);
      ctx.fillStyle = "rgba(180,175,165,0.22)";
      ctx.fillRect(0, 0, pw, ph);
      ctx.restore();
      ctx.strokeStyle = "#080808";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx, y0, pw, ph);

      // 右图：平面化缩小版（远距照样一眼认出）
      ctx.save();
      ctx.translate(rx, y0);
      ctx.beginPath();
      ctx.rect(0, 0, pw, ph);
      ctx.clip();
      drawSceneSide(ctx, pw, ph, true);
      ctx.restore();
      ctx.strokeRect(rx, y0, pw, ph);

      ctx.fillStyle = "#080808";
      ctx.font = '700 12px "Noto Sans SC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("透视写实 · 退后 5 米（灰调融成一团）", lx + pw * 0.5, y0 + ph + 20);
      ctx.fillText("平面化表达 · 退后 5 米（轮廓一眼立住）", rx + pw * 0.5, y0 + ph + 20);
      ctx.textAlign = "left";
      ctx.restore();
      return;
    }

    // 刮幕模式：左侧透视空间，右侧平面化表达
    const sx = W * split;
    drawSceneSide(ctx, W, H, false);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, 0, W - sx, H);
    ctx.clip();
    drawSceneSide(ctx, W, H, true);
    ctx.restore();

    // 分割线 + 原海报黑圆黄字 VS 标
    ctx.fillStyle = "#080808";
    ctx.fillRect(sx - 1.5, 0, 3, H);
    ctx.beginPath();
    ctx.arc(sx, H * 0.5, 19, 0, Math.PI * 2);
    ctx.fillStyle = "#080808";
    ctx.fill();
    ctx.fillStyle = "#FDCE21";
    ctx.font = '800 13px "Syne", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", sx, H * 0.5 + 0.5);

    // 左右角落底签
    ctx.textAlign = "left";
    ctx.font = '700 12px "Noto Sans SC", sans-serif';
    if (sx > 86) {
      ctx.fillStyle = "#080808";
      ctx.fillRect(10, 10, 82, 24);
      ctx.fillStyle = "#FCF2DA";
      ctx.fillText("透视空间", 22, 22);
    }
    if (W - sx > 96) {
      ctx.fillStyle = "#080808";
      ctx.fillRect(W - 96, 10, 86, 24);
      ctx.fillStyle = "#FDCE21";
      ctx.fillText("平面化表达", W - 84, 22);
    }
    ctx.restore();
  }

  function updateReadout() {
    const pct = Math.round((1 - split) * 100);
    if (farView) {
      readout.textContent = "5 米远距模拟：写实明暗缩小后灰调粘在一起，平面化靠纯色块与剪影仍能瞬间辨认。";
    } else if (pct < 20) {
      readout.textContent = "当前主要看「透视空间」：渐进明暗和斜桌面交代了立体体积，但也吃掉了远距离的图形识别速度。";
    } else if (pct > 80) {
      readout.textContent = "当前主要看「平面化表达」：去掉投影与斜桌，只留蓝、红、白、黑四个纯平色块，视觉冲击直接翻倍。";
    } else {
      readout.textContent = `中缝停在 ${Math.round(split * 100)}%：左右一刀对照，看花瓶如何从灰调球体变成纯黑剪影、木桌如何收平成纯红横带。`;
    }
  }

  function setSplit(v) {
    split = clamp(v, 0.08, 0.92);
    if (range) range.value = String(Math.round(split * 100));
    if (farView) {
      farView = false;
      if (distBtn) distBtn.setAttribute("aria-pressed", "false");
    }
    updateReadout();
    draw();
  }

  if (range) {
    range.addEventListener("input", () => setSplit(Number(range.value) / 100));
  }
  if (distBtn) {
    distBtn.addEventListener("click", () => {
      farView = !farView;
      distBtn.setAttribute("aria-pressed", String(farView));
      distBtn.textContent = farView ? "回到刮幕近看" : "退后 5 米缩略检视";
      updateReadout();
      draw();
    });
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    const r = canvas.getBoundingClientRect();
    setSplit((e.clientX - r.left) / r.width);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    setSplit((e.clientX - r.left) / r.width);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  window.addEventListener("resize", draw);

  updateReadout();
  draw();
}

// =========================================================================
// 02 节：剪纸图层叠压堆栈（调换 Z 序 + 切换 贴边平铺 / 跨界遮挡 / 切线相撞）
// =========================================================================
export function mountLayerDeck() {
  const stackEl = document.getElementById("layer-stack");
  const svg = document.getElementById("layer-svg");
  const noteEl = document.getElementById("layer-note");
  const modeBtns = document.querySelectorAll("[data-layer-mode]");
  if (!stackEl || !svg || !noteEl) return;

  let order = ["house", "plant", "vase"]; // 从后到前（sky 永远在最底）
  let mode = "overlap"; // 'tile' | 'overlap' | 'tangent'

  const META = {
    house: { name: "奶白拱门屋", color: "#FCF2DA", stroke: "#080808", role: "中景建筑面" },
    plant: { name: "朱红七叶枝", color: "#F13C1A", stroke: "#080808", role: "垂直节奏层" },
    vase: { name: "炭黑花瓶", color: "#080808", stroke: "#FDCE21", role: "前景主剪影" },
  };

  function render() {
    // 1. 重画左侧图层顺序卡
    stackEl.innerHTML = "";
    const topFirst = [...order].reverse();
    topFirst.forEach((id, idx) => {
      const m = META[id];
      const item = document.createElement("div");
      item.className = "layer-card";
      item.innerHTML = `
        <span class="layer-swatch" style="background:${m.color};border-color:${m.stroke}"></span>
        <div class="layer-info">
          <strong>第 ${idx + 1} 层 · ${m.name}</strong>
          <span>${idx === 0 ? "最前" : idx === 2 ? "靠后" : "中间"} · ${m.role}</span>
        </div>
        <div class="layer-ops">
          <button type="button" class="btn-mini" data-move="up" data-id="${id}" ${idx === 0 ? "disabled" : ""}>上移</button>
          <button type="button" class="btn-mini" data-move="down" data-id="${id}" ${idx === topFirst.length - 1 ? "disabled" : ""}>下移</button>
        </div>
      `;
      stackEl.append(item);
    });

    stackEl.querySelectorAll("[data-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const dir = btn.dataset.move;
        const i = order.indexOf(id);
        if (dir === "up" && i < order.length - 1) {
          [order[i], order[i + 1]] = [order[i + 1], order[i]];
        } else if (dir === "down" && i > 0) {
          [order[i], order[i - 1]] = [order[i - 1], order[i]];
        }
        render();
      });
    });

    // 2. 重画右侧剪纸 SVG
    const pos =
      mode === "tile"
        ? { houseX: 28, plantX: 230, vaseX: 332 }
        : mode === "tangent"
        ? { houseX: 52, plantX: 256, vaseX: 202 } // 花瓶左缘刚好死贴白屋右缘 202px！
        : { houseX: 48, plantX: 254, vaseX: 146 }; // 花瓶果断跨压白屋边缘

    const shapes = {
      house: `<g>
        <rect x="${pos.houseX}" y="68" width="154" height="148" fill="#FCF2DA" />
        <polygon points="${pos.houseX},68 ${pos.houseX + 38},34 ${pos.houseX + 120},34 ${pos.houseX + 120},68" fill="#080808" />
        <rect x="${pos.houseX + 24}" y="102" width="26" height="26" fill="#080808" />
      </g>`,
      plant: `<g>
        <rect x="${pos.plantX + 22}" y="54" width="6" height="162" fill="#F13C1A" />
        <ellipse cx="${pos.plantX + 6}" cy="92" rx="22" ry="11" transform="rotate(-32 ${pos.plantX + 6} 92)" fill="#F13C1A" />
        <ellipse cx="${pos.plantX + 44}" cy="116" rx="22" ry="11" transform="rotate(32 ${pos.plantX + 44} 116)" fill="#F13C1A" />
        <ellipse cx="${pos.plantX + 6}" cy="146" rx="22" ry="11" transform="rotate(-32 ${pos.plantX + 6} 146)" fill="#F13C1A" />
        <ellipse cx="${pos.plantX + 44}" cy="170" rx="22" ry="11" transform="rotate(32 ${pos.plantX + 44} 170)" fill="#F13C1A" />
      </g>`,
      vase: `<g>
        <path d="M ${pos.vaseX + 24} 288 C ${pos.vaseX - 10} 238, ${pos.vaseX - 4} 172, ${pos.vaseX + 28} 138 L ${pos.vaseX + 26} 100 L ${pos.vaseX + 74} 100 L ${pos.vaseX + 72} 138 C ${pos.vaseX + 104} 172, ${pos.vaseX + 110} 238, ${pos.vaseX + 76} 288 Z" fill="#080808" />
      </g>`,
    };

    const tangentOverlay =
      mode === "tangent"
        ? `<line x1="202" y1="54" x2="202" y2="294" stroke="#FDCE21" stroke-width="3" stroke-dasharray="6 4" />
           <rect x="132" y="16" width="144" height="26" fill="#080808" />
           <text x="204" y="33" fill="#FDCE21" font-size="12" font-weight="700" text-anchor="middle">切线刚好相撞 · 层序粘死</text>`
        : "";

    svg.innerHTML = `
      <rect width="460" height="300" fill="#0042AF" />
      <rect y="216" width="460" height="84" fill="#F13C1A" />
      ${order.map((id) => shapes[id]).join("")}
      ${tangentOverlay}
    `;

    // 3. 实时白话解析
    const vaseFront = order.indexOf("vase") > order.indexOf("house");
    if (mode === "tile") {
      noteEl.textContent = "【贴边平铺】三件元素彼此不碰边，哪怕你在左侧怎么调换图层顺序，画面里完全看不出谁在前、谁在后——这就是呆板的「简单平铺」。";
    } else if (mode === "tangent") {
      noteEl.textContent = "【切线相撞雷区】炭黑花瓶的外轮廓刚好和奶白屋右墙落在同一条竖线上。人眼会在交界处卡壳，把前后两层误读成拼在同一平面的两块积木。";
    } else if (vaseFront) {
      noteEl.textContent = "【跨界遮挡 · 成立】没有一丝阴影和透视，仅凭炭黑花瓶完整切过白墙与红台交界，大脑立刻自动判读出「花瓶在前、小屋居中、蓝天退后」三层空间（阿恩海姆，1954）。";
    } else {
      noteEl.textContent = "【层序倒置 · 亲眼看遮挡的威力】把奶白屋挪到花瓶前面后，花瓶立刻被「推」到了房子背后！这证明在纯平画面里，谁的轮廓完整，谁就站到最前面。";
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.layerMode;
      modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });

  render();
}

// =========================================================================
// 03 节：浮世绘到现代海报 · 四时期历史几何演进展台
// =========================================================================
export function mountHistoryStage() {
  const btns = document.querySelectorAll("[data-era]");
  const svg = document.getElementById("era-svg");
  const titleEl = document.getElementById("era-title");
  const descEl = document.getElementById("era-desc");
  const srcEl = document.getElementById("era-source");
  if (!svg || !btns.length) return;

  const ERAS = {
    ukiyoe: {
      title: "1850s 以后 · 浮世绘木版画撼动单点透视",
      desc: "喜多川歌麿、葛饰北斋与歌川广重的浮世绘传入巴黎后，西方画家第一次见识到：不画高光投影、不用单一消失点，仅凭大面积平涂色块、清晰墨线与拉高的视点，画面反而更干净有力。",
      source: "核实来源：Colta Ives, 'Japonisme', The Metropolitan Museum of Art (2004)",
      svg: `
        <rect width="520" height="280" fill="#FCF2DA" />
        <rect y="0" width="520" height="72" fill="#F13C1A" opacity="0.92" />
        <rect y="72" width="520" height="128" fill="#0042AF" />
        <path d="M 330 142 Q 365 128 400 142 T 470 142" fill="none" stroke="#FCF2DA" stroke-width="4" />
        <path d="M 355 166 Q 390 152 425 166 T 495 166" fill="none" stroke="#FCF2DA" stroke-width="4" />
        <polygon points="48,200 185,92 315,200" fill="#080808" />
        <polygon points="154,118 185,92 216,118 196,112 185,122 172,112" fill="#FCF2DA" />
        <rect y="200" width="520" height="80" fill="#FDCE21" />
        <path d="M 320 280 Q 375 180 480 205 L 480 280 Z" fill="#F13C1A" stroke="#080808" stroke-width="4" />
        <rect x="20" y="18" width="24" height="88" fill="#FCF2DA" stroke="#080808" stroke-width="2" />
        <text x="32" y="45" fill="#080808" font-size="11" font-weight="700" text-anchor="middle">高</text>
        <text x="32" y="65" fill="#080808" font-size="11" font-weight="700" text-anchor="middle">视</text>
        <text x="32" y="85" fill="#080808" font-size="11" font-weight="700" text-anchor="middle">平</text>
        <text x="32" y="101" fill="#080808" font-size="11" font-weight="700" text-anchor="middle">涂</text>
      `,
    },
    denis: {
      title: "1890–1891 · 莫里斯·德尼宣言与《红磨坊》招贴",
      desc: "1890 年 8 月，莫里斯·德尼在《新传统主义的定义》中点破：画作首先是一块按秩序涂满色彩的平面。次年，图卢兹-洛特雷克在《红磨坊：拉·古吕》石版海报里用巨幅炭黑前景剪影配平涂亮黄与朱红，改写了街头海报的远距读图效率。",
      source: "核实来源：Maurice Denis (Art et critique, 1890); Toulouse-Lautrec (1891, MoMA/Met)",
      svg: `
        <rect width="520" height="280" fill="#FDCE21" />
        <rect x="0" y="0" width="520" height="58" fill="#F13C1A" />
        <text x="260" y="38" fill="#FCF2DA" font-size="22" font-weight="800" text-anchor="middle" letter-spacing="4">SURFACE PLANE · 1891</text>
        <circle cx="155" cy="148" r="54" fill="#FCF2DA" />
        <circle cx="332" cy="140" r="46" fill="#0042AF" />
        <path d="M 0 280 L 0 184 Q 95 142 175 186 Q 230 218 290 176 L 340 280 Z" fill="#080808" />
        <path d="M 380 280 C 370 210 398 164 432 164 C 466 164 494 210 484 280 Z" fill="#080808" />
      `,
    },
    matisse: {
      title: "1911 · 马蒂斯《红色画室》用纯色吞并墙地分界",
      desc: "1911 年秋，马蒂斯把原本画着蓝墙粉地的画室彻底覆盖成一整片浓烈威尼斯红，只在家具边缘留出极细底色线。墙壁与地板的纵深夹角消失了，画室里的画作与陶瓷全部被拉到同一张炽热的二维平面上。",
      source: "核实来源：Henri Matisse, The Red Studio (1911), MoMA Object 8.1949",
      svg: `
        <rect width="520" height="280" fill="#C92818" />
        <line x1="0" y1="210" x2="155" y2="158" stroke="#FDCE21" stroke-width="2" />
        <line x1="155" y1="158" x2="520" y2="158" stroke="#FDCE21" stroke-width="2" />
        <rect x="44" y="38" width="96" height="112" fill="#0042AF" stroke="#FCF2DA" stroke-width="3" />
        <rect x="194" y="28" width="124" height="94" fill="#FDCE21" stroke="#080808" stroke-width="3" />
        <rect x="356" y="44" width="112" height="114" fill="#FCF2DA" stroke="#080808" stroke-width="3" />
        <rect x="382" y="70" width="60" height="88" fill="#080808" />
        <ellipse cx="145" cy="232" rx="64" ry="24" fill="none" stroke="#FDCE21" stroke-width="2.2" />
        <path d="M 278 264 C 254 228 260 194 282 178 L 280 156 L 310 156 L 308 178 C 330 194 336 228 312 264 Z" fill="#080808" />
      `,
    },
    modern: {
      title: "1960s 至今 · 平面性理论、瑞士海报与数字界面",
      desc: "1960 年克莱门特·格林伯格在《现代主义绘画》中把「平面性」界定为二维媒介最诚实的语言。此后从现代主义招贴、插画到今天的包装与图标系统，平面化成为远距离快速识别与跨尺寸复用最可靠的视觉秩序。",
      source: "核实来源：Clement Greenberg, 'Modernist Painting' (1960/1961); Tate 'Picture Plane'",
      svg: `
        <rect width="520" height="280" fill="#FDCE21" />
        <rect x="28" y="28" width="464" height="224" fill="#0042AF" />
        <rect x="28" y="182" width="464" height="70" fill="#F13C1A" />
        <rect x="52" y="102" width="128" height="80" fill="#FCF2DA" />
        <polygon points="52,102 88,68 144,68 144,102" fill="#080808" />
        <rect x="342" y="68" width="124" height="114" fill="#FCF2DA" />
        <path d="M 378 182 L 378 134 A 24 24 0 0 1 426 134 L 426 182 Z" fill="#080808" />
        <path d="M 114 252 C 88 214 92 162 118 136 L 116 112 L 154 112 L 152 136 C 178 162 182 214 156 252 Z" fill="#080808" />
        <rect x="304" y="212" width="30" height="20" fill="#080808" />
        <rect x="334" y="212" width="30" height="20" fill="#FCF2DA" />
        <rect x="364" y="212" width="30" height="20" fill="#080808" />
        <rect x="394" y="212" width="30" height="20" fill="#FCF2DA" />
        <rect x="304" y="232" width="30" height="20" fill="#FCF2DA" />
        <rect x="334" y="232" width="30" height="20" fill="#080808" />
        <rect x="364" y="232" width="30" height="20" fill="#FCF2DA" />
        <rect x="394" y="232" width="30" height="20" fill="#080808" />
      `,
    },
  };

  function show(key) {
    const e = ERAS[key] || ERAS.ukiyoe;
    svg.innerHTML = e.svg;
    titleEl.textContent = e.title;
    descEl.textContent = e.desc;
    srcEl.textContent = e.source;
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === key)));
  }

  btns.forEach((b) => b.addEventListener("click", () => show(b.dataset.era)));
  show("ukiyoe");
}

// =========================================================================
// 04 节：四个应用场景实样工坊 + 色数压测 + 纯黑白剪影检视镜
// =========================================================================
export function mountAppGallery() {
  const appBtns = document.querySelectorAll("[data-app-kind]");
  const swatchBtns = document.querySelectorAll("[data-swatch-mode]");
  const silToggle = document.getElementById("app-sil-toggle");
  const svg = document.getElementById("app-svg");
  const verdict = document.getElementById("app-verdict");
  if (!svg || !verdict) return;

  let kind = "poster"; // 'poster' | 'editorial' | 'packaging' | 'pattern'
  let swatch = "four"; // 'three' | 'four' | 'seven'
  let silMode = false;

  const SWATCHES = {
    three: { bg: "#FDCE21", a: "#0042AF", b: "#080808", c: "#FCF2DA", d: "#0042AF", e: "#FDCE21", label: "3 色极简" },
    four: { bg: "#FDCE21", a: "#0042AF", b: "#F13C1A", c: "#FCF2DA", d: "#080808", e: "#F13C1A", label: "4 色原海报" },
    seven: { bg: "#E6C775", a: "#5E9187", b: "#D6689E", c: "#B8D96B", d: "#8C63C9", e: "#E08843", label: "7 色杂乱溢出" },
  };

  function render() {
    const p = silMode
      ? { bg: "#FCF2DA", a: "#080808", b: "#080808", c: "#FCF2DA", d: "#080808", e: "#080808" }
      : SWATCHES[swatch];

    let inner = "";
    if (kind === "poster") {
      inner = `
        <rect width="460" height="300" fill="${p.bg}" />
        <rect x="135" y="18" width="190" height="264" fill="${p.d}" />
        <rect x="150" y="34" width="160" height="12" fill="${p.bg}" />
        <rect x="150" y="54" width="110" height="8" fill="${p.c}" />
        <circle cx="242" cy="190" r="68" fill="${p.a}" />
        <path d="M 164 268 C 164 218 210 198 258 214 L 310 268 Z" fill="${p.b}" />
        <circle cx="204" cy="146" r="24" fill="${p.bg}" />
        ${swatch === "seven" && !silMode ? `<rect x="152" y="110" width="44" height="44" fill="${p.e}" /><polygon points="270,84 306,138 242,138" fill="${p.c}" />` : ""}
      `;
    } else if (kind === "editorial") {
      inner = `
        <rect width="460" height="300" fill="${p.c}" />
        <rect x="26" y="26" width="196" height="248" fill="${p.a}" />
        <rect x="238" y="26" width="196" height="248" fill="${p.bg}" />
        <path d="M 76 274 C 54 220 62 158 98 134 L 96 102 L 152 102 L 150 134 C 186 158 194 220 172 274 Z" fill="${p.d}" />
        <circle cx="336" cy="112" r="52" fill="${p.b}" />
        <rect x="274" y="196" width="124" height="14" fill="${p.d}" />
        <rect x="274" y="220" width="96" height="10" fill="${p.d}" />
        <rect x="274" y="240" width="110" height="10" fill="${p.d}" />
      `;
    } else if (kind === "packaging") {
      inner = `
        <rect width="460" height="300" fill="${p.c}" />
        <rect x="130" y="64" width="200" height="202" fill="${p.a}" />
        <rect x="122" y="42" width="216" height="26" fill="${p.d}" />
        <rect x="154" y="92" width="152" height="144" fill="${p.bg}" />
        <circle cx="230" cy="154" r="42" fill="${p.b}" />
        <path d="M 196 236 A 46 46 0 0 1 264 236 Z" fill="${p.d}" />
        <rect x="172" y="106" width="116" height="12" fill="${p.d}" />
      `;
    } else {
      // 无缝棋盘几何图案
      inner = `<rect width="460" height="300" fill="${p.bg}" />`;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const x = 22 + c * 70;
          const y = 20 + r * 66;
          const col = (r + c) % 3 === 0 ? p.a : (r + c) % 3 === 1 ? p.b : p.d;
          inner += `<rect x="${x}" y="${y}" width="62" height="58" fill="${(r + c) % 2 === 0 ? p.c : p.bg}" />`;
          inner += (r + c) % 2 === 0
            ? `<circle cx="${x + 31}" cy="${y + 29}" r="18" fill="${col}" />`
            : `<polygon points="${x + 31},${y + 10} ${x + 52},${y + 48} ${x + 10},${y + 48}" fill="${col}" />`;
        }
      }
    }

    svg.innerHTML = inner;

    if (silMode) {
      verdict.textContent = "【纯黑白剪影检视开启】抽掉全部颜色后，好的平面化构图靠轮廓形状本身依然一眼能认出主体与版面秩序；如果一变黑白就糊成一块，说明过度依赖色相救场。";
    } else if (swatch === "seven") {
      verdict.textContent = "【7 色杂乱溢出 · 失控】经验值上，平面化单幅主色一旦超过 5 种且缺乏主次面积比，大面积平涂的整体感立刻散架，变成花哨补丁。";
    } else if (swatch === "three") {
      verdict.textContent = "【3 色极简 · 极高识别】仅用 3 种高区分纯色（经验值推荐的印刷与海报黄金上限），哪怕远在十米外或缩成货架小罐，依然稳稳抓住视线。";
    } else {
      verdict.textContent = "【4 色原海报体系 · 饱满且有序】用「1 主底 + 2 高纯撞色 + 1 炭黑锚点」四色分工，兼顾海报冲击力与插画/包装的装饰丰富度。";
    }
  }

  appBtns.forEach((b) =>
    b.addEventListener("click", () => {
      kind = b.dataset.appKind;
      appBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    })
  );
  swatchBtns.forEach((b) =>
    b.addEventListener("click", () => {
      swatch = b.dataset.swatchMode;
      swatchBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    })
  );
  if (silToggle) {
    silToggle.addEventListener("click", () => {
      silMode = !silMode;
      silToggle.setAttribute("aria-pressed", String(silMode));
      silToggle.textContent = silMode ? "退出剪影检视" : "纯黑白剪影检视";
      render();
    });
  }

  render();
}

// =========================================================================
// 05 节：什么时候别用平面化 · 需求排查决策器
// =========================================================================
export function mountAntiChecklist() {
  const checks = document.querySelectorAll("[data-anti-check]");
  const outTitle = document.getElementById("anti-title");
  const outBody = document.getElementById("anti-body");
  const outLink = document.getElementById("anti-link");
  if (!checks.length || !outTitle) return;

  const ADVICE = {
    material: {
      title: "慎用平面化：你要卖的是「真实材质与三维体积」",
      body: "珠宝折光、汽车曲面、建筑室内空间一旦拍扁成纯色剪影，客户最关心的质感与体量信息会瞬间蒸发。",
      linkText: "改看 084 深焦构图（清晰交代前中远实景）→",
      href: "https://layout.xiaoxiaodong.ai/084/play/",
    },
    scale: {
      title: "别用平面化：你要玩的是「近大远小的视觉戏剧」",
      body: "平面化天生负责抹平近大远小；如果想让近处人物与远处地标产生夸张错位或借位趣味，透视差才是主角。",
      linkText: "改看 081 强制透视构图 →",
      href: "https://layout.xiaoxiaodong.ai/081/play/",
    },
    portrait: {
      title: "慎用平面化：实景人像靠光影虚实托出情绪",
      body: "拍摄自然人像或杂乱街景时，强行拉平背景会让人物死贴在墙上，既生硬又显脏。",
      linkText: "改看 083 浅景深构图（虚化背景突出主角）→",
      href: "https://layout.xiaoxiaodong.ai/083/play/",
    },
    navigation: {
      title: "别用平面化：复杂三维装配与路线导航不能去纵深",
      body: "多层立交、机械剖面或室内导览需要前后距离与纵深空气感来消除歧义，过度平面化会让人分不清远近层级。",
      linkText: "改看 086 深空间构图 →",
      href: "https://layout.xiaoxiaodong.ai/086/play/",
    },
  };

  function update() {
    const picked = [...checks].filter((c) => c.checked).map((c) => c.dataset.antiCheck);
    if (!picked.length) {
      outTitle.textContent = "目前无冲突信号 · 很适合用平面化构图";
      outBody.textContent = "你的画面优先追求远距辨识度、品牌色面记忆、插画情绪或装饰秩序。勾选上方任意一条你当前项目的真实需求，看看平面化会不会帮倒忙。";
      outLink.textContent = "同小类参照：若想俯拍平铺实景物体，可搭配 079 顶视构图 →";
      outLink.href = "https://layout.xiaoxiaodong.ai/079/play/";
      return;
    }
    const first = ADVICE[picked[0]];
    outTitle.textContent = picked.length > 1
      ? `命中 ${picked.length} 项忌用场景 · 强烈建议换构图`
      : first.title;
    outBody.textContent = picked.map((k) => ADVICE[k].body).join(" ");
    outLink.textContent = first.linkText;
    outLink.href = first.href;
  }

  checks.forEach((c) => c.addEventListener("change", update));
  update();
}

// =========================================================================
// 06 节：单变量小练习（两题，A/B/C/D 中性标签，纯矢量精准绘制）
// =========================================================================
export function mountQuiz() {
  const root = document.getElementById("quiz-root");
  if (!root) return;

  const QUESTIONS = [
    {
      id: "q1",
      prompt: "第 1 题（唯一变量：元素重叠与接触方式）—— 下面四张图的色彩、形状、纯平程度完全一致，哪一张的二维层次与剪影识别最稳？",
      answer: "B",
      options: [
        {
          id: "A",
          reason: "方案 A 把小屋、花瓶、白碗一字排开互不碰边，虽然很平，但丢掉了跨界遮挡关系，沦为散乱的「贴纸平铺」。",
          svg: quizSvg({ vaseX: 136, bowlX: 204, archHit: false, persp: false, shade: false, pastel: false, houseLW: 76 }),
        },
        {
          id: "B",
          reason: "选对了！方案 B 让炭黑花瓶果断压过左奶白屋与朱红台面的交界，既建立起明确的前中后三层遮挡，又与白碗、右屋黑拱门保持了独立清晰的轮廓。",
          svg: quizSvg({ vaseX: 64, bowlX: 138, archHit: false, persp: false, shade: false, pastel: false, houseLW: 96 }),
        },
        {
          id: "C",
          reason: "方案 C 把炭黑花瓶摆到贴进右侧纯黑拱门里，纯黑撞纯黑（对比度 1:1），轮廓边界直接融死，剪影识别塌掉了。",
          svg: quizSvg({ vaseX: 214, bowlX: 112, archHit: true, persp: false, shade: false, pastel: false, houseLW: 96 }),
        },
        {
          id: "D",
          reason: "方案 D 把花瓶和白碗硬叠在同一纵轴中心，彼此遮掉大半，破坏了两件器物各自完整的特征轮廓。",
          svg: quizSvg({ vaseX: 96, bowlX: 106, archHit: false, persp: false, shade: false, pastel: false, houseLW: 96 }),
        },
      ],
    },
    {
      id: "q2",
      prompt: "第 2 题（唯一变量：视觉语法纯度）—— 四张图的构图位置完全一致，哪一张真正守住了平面化构图的整体性？",
      answer: "A",
      options: [
        {
          id: "A",
          reason: "选对了！方案 A 彻底去除透视斜线和球面投影，且蓝、红、白、黑明度反差清晰，全画统一在干脆的二维平面语法里。",
          svg: quizSvg({ vaseX: 64, bowlX: 138, archHit: false, persp: false, shade: false, pastel: false, houseLW: 96 }),
        },
        {
          id: "B",
          reason: "方案 B 的器物是平的，但桌面留着明显的透视斜边和向远方收缩的斜格子，平面剪影与立体透视互相打架。",
          svg: quizSvg({ vaseX: 64, bowlX: 138, archHit: false, persp: true, shade: false, pastel: false, houseLW: 96 }),
        },
        {
          id: "C",
          reason: "方案 C 虽去掉了透视斜边，却给花瓶和白碗留了球面高光与桌面长投影，把画面重新拉回半立体的夹生状态。",
          svg: quizSvg({ vaseX: 64, bowlX: 138, archHit: false, persp: false, shade: true, pastel: false, houseLW: 96 }),
        },
        {
          id: "D",
          reason: "方案 D 确实全图纯平无阴影，但把所有色块的明度拉成接近的灰雾调，边界失去远距辨识力，画面发虚。",
          svg: quizSvg({ vaseX: 64, bowlX: 138, archHit: false, persp: false, shade: false, pastel: true, houseLW: 96 }),
        },
      ],
    },
  ];

  function quizSvg({ vaseX, bowlX, persp, shade, pastel, houseLW }) {
    const sky = pastel ? "#B9C5D4" : "#0042AF";
    const tbl = pastel ? "#D4B6AE" : "#F13C1A";
    const wall = pastel ? "#DDD8CF" : "#FCF2DA";
    const dark = pastel ? "#B2AEA8" : "#080808";
    const bowl = pastel ? "#D8D3C9" : "#FFF2DB";
    const tablePoly = persp
      ? `<polygon points="34,116 246,116 280,170 0,170" fill="${tbl}" />
         <line x1="34" y1="116" x2="0" y2="170" stroke="#FDCE21" stroke-width="2" />
         <line x1="246" y1="116" x2="280" y2="170" stroke="#FDCE21" stroke-width="2" />
         <line x1="140" y1="90" x2="40" y2="170" stroke="#FCF2DA" stroke-dasharray="4 4" stroke-width="1" opacity="0.6" />
         <line x1="140" y1="90" x2="240" y2="170" stroke="#FCF2DA" stroke-dasharray="4 4" stroke-width="1" opacity="0.6" />`
      : `<rect y="116" width="280" height="54" fill="${tbl}" />`;

    const shadow = shade
      ? `<ellipse cx="${vaseX + 26}" cy="158" rx="30" ry="7" fill="rgba(8,8,8,0.38)" />
         <ellipse cx="${bowlX + 18}" cy="158" rx="26" ry="6" fill="rgba(8,8,8,0.32)" />`
      : "";
    const highlight = shade
      ? `<ellipse cx="${vaseX - 5}" cy="126" rx="5" ry="14" fill="rgba(255,255,255,0.42)" />
         <ellipse cx="${bowlX - 10}" cy="144" rx="8" ry="4" fill="rgba(255,255,255,0.42)" />`
      : "";

    return `<svg viewBox="0 0 280 170" aria-hidden="true">
      <rect width="280" height="170" fill="${sky}" />
      <rect x="10" y="58" width="${houseLW}" height="58" fill="${wall}" />
      <polygon points="10,58 32,38 72,38 72,58" fill="${dark}" />
      <rect x="192" y="36" width="78" height="80" fill="${wall}" />
      <path d="M 206 116 L 206 84 A 15 15 0 0 1 236 84 L 236 116 Z" fill="${dark}" />
      ${tablePoly}
      ${shadow}
      <path d="M ${vaseX - 14} 162 C ${vaseX - 30} 138 ${vaseX - 24} 102 ${vaseX - 8} 88 L ${vaseX - 12} 72 L ${vaseX + 12} 72 L ${vaseX + 8} 88 C ${vaseX + 24} 102 ${vaseX + 30} 138 ${vaseX + 14} 162 Z" fill="${dark}" />
      <path d="M ${bowlX - 28} 132 C ${bowlX - 24} 166 ${bowlX + 24} 166 ${bowlX + 28} 132 Z" fill="${bowl}" />
      <ellipse cx="${bowlX}" cy="132" rx="27" ry="5" fill="${sky}" />
      ${highlight}
    </svg>`;
  }

  let activeIdx = 0;
  const answers = {};

  function render() {
    const q = QUESTIONS[activeIdx];
    const picked = answers[q.id] || null;
    root.innerHTML = `
      <div class="quiz-tabs" role="tablist" aria-label="练习题目切换">
        ${QUESTIONS.map((item, i) => `
          <button type="button" class="quiz-tab" data-qtab="${i}" aria-selected="${i === activeIdx}">
            第 ${i + 1} 题 ${answers[item.id] ? (answers[item.id] === item.answer ? "· 已答对" : "· 已作答") : ""}
          </button>
        `).join("")}
      </div>
      <p class="quiz-prompt">${q.prompt}</p>
      <div class="quiz-grid">
        ${q.options.map((opt) => {
          const isPicked = picked === opt.id;
          const isRight = picked && opt.id === q.answer;
          const cls = [
            "quiz-opt",
            isPicked ? "is-picked" : "",
            isRight ? "is-right" : "",
            isPicked && !isRight ? "is-wrong" : "",
          ].filter(Boolean).join(" ");
          return `
            <button type="button" class="${cls}" data-opt="${opt.id}" aria-pressed="${isPicked}">
              <div class="quiz-fig">${opt.svg}</div>
              <span class="quiz-label">方案 ${opt.id}</span>
            </button>
          `;
        }).join("")}
      </div>
      <div class="quiz-feedback" aria-live="polite">
        ${
          picked
            ? `<strong>${picked === q.answer ? "判断准确" : `你选了方案 ${picked}，最稳的是方案 ${q.answer}`}</strong>
               <p>${q.options.find((o) => o.id === picked).reason}</p>
               ${picked !== q.answer ? `<p class="quiz-right-note">对照正确解：${q.options.find((o) => o.id === q.answer).reason}</p>` : ""}`
            : `<p>点击上面四张方案卡中的任意一张作答。四张图只差一个变量，仔细看轮廓、重叠与空间线索。</p>`
        }
      </div>
    `;

    root.querySelectorAll("[data-qtab]").forEach((b) =>
      b.addEventListener("click", () => {
        activeIdx = Number(b.dataset.qtab);
        render();
      })
    );
    root.querySelectorAll("[data-opt]").forEach((b) =>
      b.addEventListener("click", () => {
        answers[q.id] = b.dataset.opt;
        render();
      })
    );
  }

  render();
}
