// 关掉 WebGL 后的 2D SVG 降级舞台：和 3D 版读完全同一份 model.js 状态，还原海报的几何形与粉红节奏弧。
import { PALETTE } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const VW = 640;
const VH = 480;

function shapeMarkup(it, cx, cy, r) {
  const glow = it.isDom ? ` filter="url(#dom-glow)"` : "";
  switch (it.shape) {
    case "cube":
      return `<rect x="${(cx - r * 0.92).toFixed(1)}" y="${(cy - r * 0.92).toFixed(1)}" width="${(r * 1.84).toFixed(1)}" height="${(r * 1.84).toFixed(1)}" rx="${(r * 0.12).toFixed(1)}" fill="${it.color}"${glow}/>`;
    case "cone": {
      const top = `${cx.toFixed(1)},${(cy - r * 1.05).toFixed(1)}`;
      const bl = `${(cx - r * 1.02).toFixed(1)},${(cy + r * 0.88).toFixed(1)}`;
      const br = `${(cx + r * 1.02).toFixed(1)},${(cy + r * 0.88).toFixed(1)}`;
      return `<polygon points="${top} ${br} ${bl}" fill="${it.color}"${glow}/>`;
    }
    case "cylinder":
      return `<rect x="${(cx - r * 0.72).toFixed(1)}" y="${(cy - r * 0.96).toFixed(1)}" width="${(r * 1.44).toFixed(1)}" height="${(r * 1.92).toFixed(1)}" rx="${(r * 0.28).toFixed(1)}" fill="${it.color}"${glow}/>`;
    case "octa": {
      const pts = `${cx.toFixed(1)},${(cy - r * 1.05).toFixed(1)} ${(cx + r * 0.9).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + r * 1.05).toFixed(1)} ${(cx - r * 0.9).toFixed(1)},${cy.toFixed(1)}`;
      return `<polygon points="${pts}" fill="${it.color}"${glow}/>`;
    }
    case "capsule":
      return `<rect x="${(cx - r * 0.56).toFixed(1)}" y="${(cy - r * 1.04).toFixed(1)}" width="${(r * 1.12).toFixed(1)}" height="${(r * 2.08).toFixed(1)}" rx="${(r * 0.56).toFixed(1)}" fill="${it.color}"${glow}/>`;
    case "torus":
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.72).toFixed(1)}" fill="none" stroke="${it.color}" stroke-width="${(r * 0.42).toFixed(1)}"${glow}/>`;
    case "sphere":
    default:
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${it.color}"${glow}/>`;
  }
}

export function createSceneFlat(stage, { onFrame } = {}) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("stage-flat");
  stage.prepend(svg);

  let layoutData = null;
  let showPath = true;

  const toXY = (u, v) => ({ x: 40 + u * (VW - 80), y: 40 + v * (VH - 80) });

  function draw() {
    if (!layoutData) return;
    const L = layoutData;
    const parts = [
      `<defs><filter id="dom-glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="${PALETTE.pink}" flood-opacity="0.35"/></filter></defs>`,
      `<rect width="${VW}" height="${VH}" fill="${PALETTE.bg}"/>`,
      `<ellipse cx="${VW / 2}" cy="356" rx="255" ry="26" fill="${PALETTE.plinth}"/>`,
      `<ellipse cx="${VW / 2}" cy="356" rx="255" ry="26" fill="none" stroke="${PALETTE.pink}" stroke-opacity="0.22" stroke-width="1.2"/>`,
    ];

    const pts = L.items.map((it) => {
      const p = toXY(it.u, it.v);
      const r = 46 * it.scale;
      return { ...it, x: p.x, y: p.y, r };
    });

    // 底部基准线
    for (const p of pts) {
      parts.push(
        `<line x1="${p.x.toFixed(1)}" y1="354" x2="${p.x.toFixed(1)}" y2="378" stroke="${p.isDom ? PALETTE.pink : "rgba(240,108,146,0.45)"}" stroke-width="1.5" stroke-dasharray="3 3"/>`
      );
    }

    // 几何主体
    for (const p of pts) {
      parts.push(shapeMarkup(p, p.x, p.y, p.r));
    }

    // 视觉辅助线
    if (L.isCrowd) {
      const topY = Math.min(...pts.map((p) => p.y - p.r)) - 22;
      parts.push(
        `<path d="M${(pts[0].x - 20).toFixed(1)},${(topY + 14).toFixed(1)} L${(pts[0].x - 20).toFixed(1)},${topY.toFixed(1)} L${(pts[pts.length - 1].x + 20).toFixed(1)},${topY.toFixed(1)} L${(pts[pts.length - 1].x + 20).toFixed(1)},${(topY + 14).toFixed(1)}" fill="none" stroke="${PALETTE.lavender}" stroke-width="1.8" stroke-dasharray="5 4"/>`,
        `<text x="${VW / 2}" y="${(topY - 8).toFixed(1)}" text-anchor="middle" fill="${PALETTE.muted}" font-size="13">超过 7 个：读成一整片群组轮廓</text>`
      );
    } else if (L.inEvenSeam && pts.length >= 2) {
      const half = pts.length / 2;
      const midX = (pts[half - 1].x + pts[half].x) / 2;
      const topY = Math.min(...pts.map((p) => p.y - p.r)) - 26;
      parts.push(
        `<line x1="${midX.toFixed(1)}" y1="${topY.toFixed(1)}" x2="${midX.toFixed(1)}" y2="386" stroke="${PALETTE.lavender}" stroke-width="1.8" stroke-dasharray="5 5"/>`,
        `<line x1="${(pts[0].x - 20).toFixed(1)}" y1="${(topY + 10).toFixed(1)}" x2="${(pts[pts.length - 1].x + 20).toFixed(1)}" y2="${(topY + 10).toFixed(1)}" stroke="rgba(147,110,196,0.6)" stroke-width="1.4" stroke-dasharray="4 4"/>`
      );
    } else if (L.hasDominant && pts.length >= 3) {
      const dom = pts[L.domIndex];
      const left = pts[0];
      const right = pts[pts.length - 1];
      const apexY = dom.y - dom.r - 34;
      const arcD = `M${left.x.toFixed(1)},${(left.y - left.r - 10).toFixed(1)} Q${((left.x + dom.x) / 2).toFixed(1)},${(apexY - 4).toFixed(1)} ${dom.x.toFixed(1)},${apexY.toFixed(1)} Q${((dom.x + right.x) / 2).toFixed(1)},${(apexY - 4).toFixed(1)} ${right.x.toFixed(1)},${(right.y - right.r - 10).toFixed(1)}`;
      parts.push(
        `<path d="${arcD}" fill="none" stroke="${PALETTE.pink}" stroke-width="2" stroke-dasharray="5 5"/>`,
        `<circle cx="${dom.x.toFixed(1)}" cy="${apexY.toFixed(1)}" r="5" fill="${PALETTE.pink}"/>`,
        `<text x="${dom.x.toFixed(1)}" y="${(apexY - 12).toFixed(1)}" text-anchor="middle" fill="${PALETTE.pinkSoft}" font-size="13" font-weight="700">主导焦点</text>`
      );
      if (showPath) {
        parts.push(`<circle cx="${dom.x.toFixed(1)}" cy="${(dom.y - dom.r - 10).toFixed(1)}" r="5" fill="${PALETTE.cream}" stroke="${PALETTE.pink}" stroke-width="2"/>`);
      }
    }

    svg.innerHTML = parts.join("");
    if (onFrame) onFrame();
  }

  return {
    kind: "flat",
    set(nextLayout, opts = {}) {
      layoutData = nextLayout;
      if (typeof opts.showPath === "boolean") showPath = opts.showPath;
      draw();
    },
    projectFocus(u, v) {
      const r = stage.getBoundingClientRect();
      const scale = Math.min(r.width / VW, r.height / VH);
      const ox = (r.width - VW * scale) / 2;
      const oy = (r.height - VH * scale) / 2;
      const p = toXY(u, v);
      return { x: ox + p.x * scale, y: oy + p.y * scale };
    },
    hitTest(clientX, clientY) {
      if (!layoutData) return -1;
      const r = stage.getBoundingClientRect();
      const scale = Math.min(r.width / VW, r.height / VH);
      const ox = (r.width - VW * scale) / 2;
      const oy = (r.height - VH * scale) / 2;
      const vx = (clientX - r.left - ox) / scale;
      const vy = (clientY - r.top - oy) / scale;
      let best = -1;
      let minD = 56;
      for (const it of layoutData.items) {
        const p = toXY(it.u, it.v);
        const d = Math.hypot(p.x - vx, p.y - vy);
        if (d < minD) {
          minD = d;
          best = it.index;
        }
      }
      return best;
    },
    stageWidth: () => stage.clientWidth || 360,
  };
}
