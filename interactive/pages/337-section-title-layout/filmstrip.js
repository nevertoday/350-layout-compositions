// 337 节标题转场片轨 2D Canvas 引擎
// 1:1 承袭 337 原海报视觉语言：深石油青暗底、炽橙弯轨、暖米圆球与三帧活体演讲胶片。
// 全部读数和点击热区与 model.js 严格共享同一几何单真源。

import { pixelRatio } from "../../lib/stage.js";
import {
  VIRTUAL_W,
  VIRTUAL_H,
  SAFE_X,
  SAFE_Y,
  NEIGHBOR_BG,
  sampleLoadCurve
} from "./model.js";

const FONT_ZH = '"Noto Sans SC", system-ui, sans-serif';
const FONT_SYNE = '"Syne", "Noto Sans SC", sans-serif';
const FONT_OUTFIT = '"Outfit", "Noto Sans SC", sans-serif';
const FONT_MONO = '"Space Mono", monospace';

export function createFilmstrip(canvas, { getState, getAudit, onScrub, onClickZone, onPlayEnd }) {
  const ctx = canvas.getContext("2d");
  let cw = 900;
  let ch = 400;
  let dpr = 1;
  let hoverZone = null;
  let dragging = false;
  let dragStartX = 0;
  let dragStartScrub = 0.5;
  let dragMoved = false;
  let playActive = false;
  let playElapsed = 0;
  let flashTimer = 0;
  let hitZones = []; // { id, x, y, w, h, label }
  let railRect = { x: 0, y: 0, w: 0, h: 0 };

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = pixelRatio(2);
    cw = r.width;
    ch = r.height;
    const bw = Math.round(cw * dpr);
    const bh = Math.round(ch * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }

  function roundedRectPath(x, y, w, h, rad) {
    const r = Math.min(rad, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 绘制前页 04（高密度数据收尾页）
  function drawPrevSlide(x, y, w, h, deck) {
    const s = w / VIRTUAL_W;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.rect(0, 0, VIRTUAL_W, VIRTUAL_H);
    ctx.clip();

    ctx.fillStyle = NEIGHBOR_BG;
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // 顶栏细标识条
    ctx.fillStyle = "#0A3A3D";
    ctx.fillRect(0, 0, VIRTUAL_W, 18);

    ctx.fillStyle = "#B53D04";
    ctx.font = `700 24px ${FONT_OUTFIT}`;
    ctx.fillText(`SLIDE ${deck.prevSlide.num}  ·  ${deck.prevSlide.chapter}`, SAFE_X, 82);

    ctx.fillStyle = "#072123";
    ctx.font = `900 44px ${FONT_ZH}`;
    ctx.fillText(deck.prevSlide.title, SAFE_X, 152, VIRTUAL_W - SAFE_X * 2);

    // 左侧四行密集文本条
    let by = 240;
    for (let i = 0; i < deck.prevSlide.bullets.length; i++) {
      ctx.fillStyle = "#B53D04";
      ctx.fillRect(SAFE_X, by - 20, 12, 12);
      ctx.fillStyle = "#183638";
      ctx.font = `400 27px ${FONT_ZH}`;
      ctx.fillText(deck.prevSlide.bullets[i], SAFE_X + 28, by, 760);
      // 模拟补充细行，强化内容高密度感
      ctx.fillStyle = "rgba(13, 36, 38, 0.22)";
      ctx.fillRect(SAFE_X + 28, by + 20, 620 - i * 42, 11);
      ctx.fillRect(SAFE_X + 28, by + 40, 480 + (i % 2) * 80, 10);
      by += 132;
    }

    // 右侧柱状图证据区
    const cx = 970, cy = 220, cw2 = 515, ch2 = 540;
    ctx.fillStyle = "#ECE3D5";
    ctx.fillRect(cx, cy, cw2, ch2);
    ctx.strokeStyle = "#C7BCAA";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw2, ch2);
    const bars = deck.prevSlide.bars;
    for (let i = 0; i < bars.length; i++) {
      const bw = 54;
      const gap = 34;
      const bx = cx + 48 + i * (bw + gap);
      const bh = bars[i] * 360;
      ctx.fillStyle = i === 0 ? "#0B464A" : i === 3 ? "#D9520E" : "#3E6B6E";
      ctx.fillRect(bx, cy + ch2 - 72 - bh, bw, bh);
      ctx.fillStyle = "#3E5456";
      ctx.font = `700 20px ${FONT_MONO}`;
      ctx.fillText(`Q${i + 1}`, bx + 12, cy + ch2 - 36);
    }

    // 底部页码
    ctx.fillStyle = "#5D7072";
    ctx.font = `400 22px ${FONT_MONO}`;
    ctx.fillText("HIGH DENSITY CONTENT", SAFE_X, VIRTUAL_H - 42);
    ctx.restore();
  }

  // 绘制后页 06（新章高密度开场页）
  function drawNextSlide(x, y, w, h, deck) {
    const s = w / VIRTUAL_W;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.rect(0, 0, VIRTUAL_W, VIRTUAL_H);
    ctx.clip();

    ctx.fillStyle = NEIGHBOR_BG;
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    ctx.fillStyle = "#F16318";
    ctx.fillRect(0, 0, VIRTUAL_W, 18);

    ctx.fillStyle = "#0B464A";
    ctx.font = `700 24px ${FONT_OUTFIT}`;
    ctx.fillText(`SLIDE ${deck.nextSlide.num}  ·  ${deck.nextSlide.chapter}`, SAFE_X, 82);

    ctx.fillStyle = "#072123";
    ctx.font = `900 44px ${FONT_ZH}`;
    ctx.fillText(deck.nextSlide.title, SAFE_X, 152, VIRTUAL_W - SAFE_X * 2);

    // 2×2 高密卡片网格
    const cards = deck.nextSlide.cards;
    for (let i = 0; i < cards.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const kx = SAFE_X + col * 704;
      const ky = 224 + row * 290;
      const kw = 668;
      const kh = 256;
      ctx.fillStyle = "#EFE7DA";
      ctx.fillRect(kx, ky, kw, kh);
      ctx.fillStyle = i === 0 ? "#F16318" : "#0B464A";
      ctx.fillRect(kx, ky, 10, kh);
      ctx.fillStyle = "#072123";
      ctx.font = `700 30px ${FONT_ZH}`;
      ctx.fillText(`0${i + 1}  ${cards[i]}`, kx + 34, ky + 66);
      ctx.fillStyle = "rgba(13, 36, 38, 0.25)";
      ctx.fillRect(kx + 34, ky + 104, 540, 14);
      ctx.fillRect(kx + 34, ky + 134, 480, 14);
      ctx.fillRect(kx + 34, ky + 164, 510, 14);
      ctx.fillRect(kx + 34, ky + 194, 340, 14);
    }

    ctx.fillStyle = "#5D7072";
    ctx.font = `400 22px ${FONT_MONO}`;
    ctx.fillText("NEXT CHAPTER CONTENT", SAFE_X, VIRTUAL_H - 42);
    ctx.restore();
  }

  // 绘制核心 05 号节标题页（完全由 model.js 单真源几何驱动，并登记真实点击热区）
  function drawSectionSlide(x, y, w, h, state, audit, t) {
    const g = audit.geom;
    const surf = g.surf;
    const s = w / VIRTUAL_W;

    // 登记画布坐标系内的点击热区（先底色，后精确前景，命中最上层）
    const toScreen = (vx, vy, vw, vh) => ({
      x: x + vx * s,
      y: y + vy * s,
      w: vw * s,
      h: vh * s
    });

    hitZones = [];
    hitZones.push({ id: "surface", ...toScreen(0, 0, VIRTUAL_W, VIRTUAL_H), label: "点底色切换转场反差" });

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.rect(0, 0, VIRTUAL_W, VIRTUAL_H);
    ctx.clip();

    // 1. 背景层
    if (state.surfaceMode === "noisy") {
      const grad = ctx.createLinearGradient(0, 0, VIRTUAL_W, VIRTUAL_H);
      grad.addColorStop(0, "#4B1C75");
      grad.addColorStop(0.5, "#B0226B");
      grad.addColorStop(1, "#186480");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
      // 杂乱几何噪纹，真实展示花哨背景如何破坏清晰度
      ctx.strokeStyle = "rgba(255, 224, 102, 0.28)";
      ctx.lineWidth = 6;
      for (let i = -2; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 140, 0);
        ctx.lineTo(i * 140 + 360, VIRTUAL_H);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,94,126,0.22)" : "rgba(69,232,210,0.2)";
        ctx.beginPath();
        ctx.arc(160 + i * 170, 140 + ((i * 197) % 620), 90 + (i % 3) * 35, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = surf.bg;
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    }

    // 2. 情绪版式视觉锚点（严格 1:1 呼应 337 原海报）
    const isOrangeBg = state.surfaceMode === "orange";
    const ribbonColor = isOrangeBg ? "#012527" : "#F16318";
    const orbColor = isOrangeBg ? "#FFF4E3" : "#F5E4CE";

    if (state.moodMode === "ribbon") {
      // 337 原海报核心母题：右侧竖带 + J形弯折横轨 + 深青三角 + 暖米圆球
      ctx.fillStyle = ribbonColor;
      ctx.fillRect(VIRTUAL_W - 186, 0, 186, VIRTUAL_H - 178);
      // J-bend 弯轨
      ctx.beginPath();
      ctx.moveTo(VIRTUAL_W - 186, VIRTUAL_H - 180);
      ctx.arc(VIRTUAL_W - 252, VIRTUAL_H - 180, 66, 0, Math.PI * 0.5, false);
      ctx.lineTo(0, VIRTUAL_H - 114);
      ctx.lineTo(0, VIRTUAL_H - 82);
      ctx.lineTo(VIRTUAL_W - 252, VIRTUAL_H - 82);
      ctx.arc(VIRTUAL_W - 252, VIRTUAL_H - 180, 98, Math.PI * 0.5, 0, true);
      ctx.lineTo(VIRTUAL_W - 88, VIRTUAL_H - 180);
      ctx.closePath();
      ctx.fill();

      // 深色裁切右向播放三角 ▶
      ctx.fillStyle = isOrangeBg ? "#F16318" : surf.bg;
      ctx.beginPath();
      ctx.moveTo(VIRTUAL_W - 150, 96);
      ctx.lineTo(VIRTUAL_W - 82, 148);
      ctx.lineTo(VIRTUAL_W - 150, 200);
      ctx.closePath();
      ctx.fill();

      // 弯轨内侧暖米圆球
      ctx.fillStyle = orbColor;
      ctx.beginPath();
      ctx.arc(VIRTUAL_W - 284, VIRTUAL_H - 164, 56, 0, Math.PI * 2);
      ctx.fill();

      // 竖带内侧文字标尺
      ctx.save();
      ctx.translate(VIRTUAL_W - 92, 260);
      ctx.fillStyle = isOrangeBg ? "#F5E4CE" : "#012527";
      ctx.font = `700 22px ${FONT_ZH}`;
      const vchars = ["章", "节", "转", "场", "／", "引", "导", "节", "奏"];
      vchars.forEach((ch, idx) => ctx.fillText(ch, -11, idx * 34));
      ctx.restore();

      hitZones.push({ id: "mood", ...toScreen(VIRTUAL_W - 240, 0, 240, VIRTUAL_H), label: "点切换情绪构图" });
    } else if (state.moodMode === "numeral") {
      // 巨号建筑衬底
      ctx.save();
      ctx.fillStyle = isOrangeBg ? "rgba(1, 37, 39, 0.22)" : (state.surfaceMode === "same" ? "rgba(181, 61, 4, 0.14)" : "rgba(241, 99, 24, 0.22)");
      ctx.font = `800 370px ${FONT_SYNE}`;
      ctx.fillText(g.sec.num, VIRTUAL_W - 560, 440);
      // 底部建筑细橙横尺与圆点
      ctx.strokeStyle = isOrangeBg ? "#012527" : "#F16318";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(SAFE_X, VIRTUAL_H - 118);
      ctx.lineTo(VIRTUAL_W - SAFE_X - 24, VIRTUAL_H - 118);
      ctx.stroke();
      ctx.fillStyle = isOrangeBg ? "#012527" : "#F16318";
      ctx.beginPath();
      ctx.arc(VIRTUAL_W - SAFE_X - 14, VIRTUAL_H - 118, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      hitZones.push({ id: "mood", ...toScreen(VIRTUAL_W - 520, 80, 440, 390), label: "点切换情绪构图" });
    } else if (state.moodMode === "horizon") {
      // 意境地平线（极简弧线 + 暖米圆日，呼应海报左下细弧与圆球）
      ctx.save();
      const hy = VIRTUAL_H - 162;
      ctx.strokeStyle = isOrangeBg ? "rgba(255,244,227,0.75)" : (state.surfaceMode === "same" ? "rgba(181,61,4,0.55)" : "rgba(245,228,206,0.62)");
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, hy + 54);
      ctx.quadraticCurveTo(VIRTUAL_W * 0.44, hy - 86, VIRTUAL_W * 0.86, hy + 96);
      ctx.stroke();
      ctx.fillStyle = isOrangeBg ? "#012527" : "#F16318";
      ctx.beginPath();
      ctx.arc(VIRTUAL_W * 0.86, hy + 96, 11, 0, Math.PI * 2);
      ctx.fill();
      // 右侧静默半圆
      ctx.fillStyle = isOrangeBg ? "rgba(1,37,39,0.22)" : "rgba(241,99,24,0.18)";
      ctx.beginPath();
      ctx.arc(VIRTUAL_W - 220, hy + 20, 140, Math.PI, 0);
      ctx.fill();
      ctx.restore();
      hitZones.push({ id: "mood", ...toScreen(VIRTUAL_W - 380, VIRTUAL_H - 280, 360, 260), label: "点切换情绪构图" });
    } else {
      // 平铺无主次：右列 4 个毫无情绪锚点的杂乱装饰卡片（严格避开左侧文字栏）
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const bx = VIRTUAL_W - 256;
        const by = 126 + i * 144;
        ctx.fillStyle = state.surfaceMode === "same" ? "rgba(13,36,38,0.12)" : "rgba(245,228,206,0.12)";
        ctx.fillRect(bx, by, 152, 112);
        ctx.strokeStyle = state.surfaceMode === "same" ? "rgba(13,36,38,0.28)" : "rgba(245,228,206,0.28)";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, 152, 112);
        ctx.fillStyle = state.surfaceMode === "same" ? "rgba(13,36,38,0.24)" : "rgba(245,228,206,0.24)";
        ctx.fillRect(bx + 18, by + 24, 72, 12);
        ctx.fillRect(bx + 18, by + 50, 110, 9);
        ctx.fillRect(bx + 18, by + 68, 92, 9);
      }
      ctx.restore();
      hitZones.push({ id: "mood", ...toScreen(VIRTUAL_W - 266, 118, 170, 568), label: "点替换平铺杂块为情绪锚点" });
    }

    // 3. 安全边距红框提示（当越界时高亮）
    if (g.overflowSafeEdge) {
      ctx.save();
      ctx.strokeStyle = "#FF5A45";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(SAFE_X, SAFE_Y, VIRTUAL_W - SAFE_X * 2, VIRTUAL_H - SAFE_Y * 2);
      ctx.restore();
    }

    // 4. 章号 / 进度锚点区
    if (g.cueBox) {
      if (state.cueMode === "progress") {
        // 顶部全流程进度条：已讲压暗，当前高亮橙点
        const chapters = g.sec.chapters;
        const segW = g.cueBox.w / chapters.length;
        chapters.forEach((ch, idx) => {
          const sx = g.cueBox.x + idx * segW;
          const isCur = idx === 1;
          ctx.fillStyle = isCur
            ? (isOrangeBg ? "#012527" : "#F16318")
            : (state.surfaceMode === "same" ? "rgba(13,36,38,0.18)" : "rgba(245,228,206,0.22)");
          ctx.fillRect(sx, g.cueBox.y + 34, segW - 18, isCur ? 6 : 3);
          ctx.fillStyle = isCur
            ? (isOrangeBg ? "#012527" : surf.accent)
            : surf.muted;
          ctx.font = `${isCur ? 700 : 400} 22px ${FONT_ZH}`;
          ctx.fillText(ch, sx, g.cueBox.y + 22, segW - 22);
        });
      } else {
        // 清晰章号 + 细橙引导线
        ctx.fillStyle = isOrangeBg ? "#012527" : surf.accent;
        ctx.font = `800 36px ${FONT_SYNE}`;
        const label = state.cueMode === "vague" ? "CHAPTER" : `SECTION ${g.sec.num} / ${g.sec.total}`;
        ctx.fillText(label, g.cueBox.x, g.cueBox.y + 38);
        ctx.fillStyle = isOrangeBg ? "#012527" : surf.accentGraphic;
        ctx.fillRect(g.cueBox.x, g.cueBox.y + 52, 84, 5);
      }
      hitZones.push({ id: "cue", ...toScreen(g.cueBox.x - 10, g.cueBox.y - 10, g.cueBox.w + 20, g.cueBox.h + 24), label: "点切换章节提示形态" });
    }

    // 5. 主标题（逐行严格按 model.js wrapText 绘制）
    ctx.fillStyle = surf.ink;
    ctx.font = `900 ${g.titleBox.fontSize}px ${FONT_ZH}`;
    ctx.textBaseline = "top";
    g.titleBox.lines.forEach((line, i) => {
      ctx.fillText(line.text, g.titleBox.x, g.titleBox.y + i * g.titleBox.lineHeight);
    });
    ctx.textBaseline = "alphabetic";

    // 若标题存在问题，画轻巧诊断虚框标明可直点改稿
    if (!audit.pillars.cue.ok) {
      ctx.save();
      ctx.strokeStyle = "#FF6A52";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.strokeRect(g.titleBox.x - 14, g.titleBox.y - 12, Math.min(g.colW + 20, g.titleBox.w + 28), g.titleBox.h + 24);
      // 紧凑红标签
      const pillTxt = `× ${audit.pillars.cue.tag} · 点此精修`;
      ctx.font = `700 22px ${FONT_ZH}`;
      const pw = ctx.measureText(pillTxt).width + 28;
      ctx.fillStyle = "#C9321C";
      ctx.fillRect(g.titleBox.x - 14, Math.max(18, g.titleBox.y - 52), pw, 36);
      ctx.fillStyle = "#FFF7F0";
      ctx.fillText(pillTxt, g.titleBox.x, Math.max(43, g.titleBox.y - 27));
      ctx.restore();
    }
    hitZones.push({
      id: "title",
      ...toScreen(g.titleBox.x - 16, g.titleBox.y - 16, Math.max(360, g.titleBox.w + 32), g.titleBox.h + 32),
      label: "点直接精修主标题"
    });

    // 6. 英文副标
    ctx.fillStyle = isOrangeBg ? "#012527" : surf.accent;
    ctx.font = `700 ${g.enBox.fontSize}px ${FONT_OUTFIT}`;
    ctx.fillText(g.enBox.text, g.enBox.x, g.enBox.y + g.enBox.fontSize * 0.9);

    // 7. 信息负荷区（议程字墙 / 两段正文 / 一句话导语 / 极简留空）
    if (g.payloadBox) {
      if (state.payloadMode === "bullets") {
        let py = g.payloadBox.y + 30;
        for (let bi = 0; bi < g.payloadLines.length; bi++) {
          const item = g.payloadLines[bi];
          ctx.fillStyle = isOrangeBg ? "#012527" : surf.accentGraphic;
          ctx.fillRect(g.payloadBox.x, py - 15, 11, 11);
          ctx.fillStyle = surf.ink;
          ctx.font = `700 ${g.payloadBox.fontSize}px ${FONT_ZH}`;
          ctx.fillText(item.text, g.payloadBox.x + 24, py, g.payloadBox.w - 30);
          // 每条议程下附带细目占位横条，直观呈现议程字墙占满版面的窒息感
          ctx.fillStyle = state.surfaceMode === "same" ? "rgba(13,36,38,0.2)" : "rgba(245,228,206,0.26)";
          ctx.fillRect(g.payloadBox.x + 24, py + 15, Math.min(g.payloadBox.w - 70, 740 - bi * 32), 10);
          ctx.fillRect(g.payloadBox.x + 24, py + 32, Math.min(g.payloadBox.w - 140, 560 + (bi % 2) * 80), 9);
          py += g.payloadBox.lineHeight;
        }
      } else if (state.payloadMode === "prose") {
        let py = g.payloadBox.y + 24;
        let lastPara = 0;
        for (const line of g.payloadLines) {
          if (line.para !== lastPara) { py += 16; lastPara = line.para; }
          ctx.fillStyle = surf.muted;
          ctx.font = `400 ${g.payloadBox.fontSize}px ${FONT_ZH}`;
          ctx.fillText(line.text, g.payloadBox.x, py);
          py += g.payloadBox.lineHeight;
        }
      } else if (state.payloadMode === "subline") {
        // 一句话导语 + 原海报细横线圆点
        ctx.fillStyle = surf.muted;
        ctx.font = `400 ${g.payloadBox.fontSize}px ${FONT_ZH}`;
        g.payloadLines.forEach((line, idx) => {
          ctx.fillText(line.text, g.payloadBox.x, g.payloadBox.y + 26 + idx * g.payloadBox.lineHeight);
        });
        const ly = g.payloadBox.y + g.payloadBox.h + 14;
        ctx.strokeStyle = isOrangeBg ? "rgba(1,37,39,0.55)" : "rgba(241,99,24,0.65)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(g.payloadBox.x, ly);
        ctx.lineTo(g.payloadBox.x + Math.min(420, g.payloadBox.w + 48), ly);
        ctx.stroke();
        ctx.fillStyle = isOrangeBg ? "#012527" : "#F16318";
        ctx.beginPath();
        ctx.arc(g.payloadBox.x + Math.min(420, g.payloadBox.w + 48), ly, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!audit.pillars.whitespace.ok) {
        ctx.save();
        ctx.strokeStyle = "#FF6A52";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 7]);
        ctx.strokeRect(g.payloadBox.x - 14, g.payloadBox.y - 10, g.payloadBox.w + 28, g.payloadBox.h + 18);
        const pillTxt = `× ${audit.pillars.whitespace.tag} · 点此清空留白`;
        ctx.font = `700 22px ${FONT_ZH}`;
        const pw = ctx.measureText(pillTxt).width + 28;
        ctx.fillStyle = "#C9321C";
        ctx.fillRect(g.payloadBox.x - 14, Math.min(VIRTUAL_H - 46, g.payloadBox.y + g.payloadBox.h + 4), pw, 36);
        ctx.fillStyle = "#FFF7F0";
        ctx.fillText(pillTxt, g.payloadBox.x, Math.min(VIRTUAL_H - 21, g.payloadBox.y + g.payloadBox.h + 29));
        ctx.restore();
      }

      hitZones.push({
        id: "payload",
        ...toScreen(g.payloadBox.x - 14, g.payloadBox.y - 12, g.payloadBox.w + 28, g.payloadBox.h + 28),
        label: "点删减正文恢复呼吸留白"
      });
    }

    // 8. 若背景同底隐形，给右上角轻巧告警浮签
    if (!audit.pillars.transition.ok) {
      const pillTxt = `× ${audit.pillars.transition.tag} · 点底色反色`;
      ctx.font = `700 22px ${FONT_ZH}`;
      const pw = ctx.measureText(pillTxt).width + 28;
      const px = Math.max(SAFE_X, VIRTUAL_W - pw - (state.moodMode === "ribbon" ? 210 : 48));
      ctx.fillStyle = "#C9321C";
      ctx.fillRect(px, 34, pw, 38);
      ctx.fillStyle = "#FFF7F0";
      ctx.fillText(pillTxt, px + 14, 60);
    }

    // 9. 点击瞬时微闪反馈（纯视觉反馈，不持续晃动）
    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(241, 99, 24, ${Math.min(0.18, flashTimer * 0.45)})`;
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    }

    ctx.restore();

    // 画 05 页外框与角标（悬停高亮）
    ctx.save();
    const isPass = audit.score === 4;
    ctx.strokeStyle = isPass ? "#5CE0B3" : (hoverZone ? "#FF9257" : "rgba(245, 228, 206, 0.38)");
    ctx.lineWidth = isPass ? 2.5 : 1.75;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function render(t, dt, { still }) {
    resize();
    if (cw < 10 || ch < 10) return;

    if (!still && flashTimer > 0) {
      flashTimer = Math.max(0, flashTimer - dt);
    }

    // 空格键或按钮触发的三页转场播放（04 → 05 停顿换气 → 06 → 回 05）
    if (!still && playActive) {
      playElapsed += dt;
      const dur = 3.8;
      let u = 0.5;
      if (playElapsed < 0.55) {
        u = 0.04;
      } else if (playElapsed < 1.25) {
        const p = (playElapsed - 0.55) / 0.7;
        const ease = p * p * (3 - 2 * p);
        u = 0.04 + (0.5 - 0.04) * ease;
      } else if (playElapsed < 2.35) {
        u = 0.5;
      } else if (playElapsed < 3.05) {
        const p = (playElapsed - 2.35) / 0.7;
        const ease = p * p * (3 - 2 * p);
        u = 0.5 + (0.96 - 0.5) * ease;
      } else if (playElapsed < dur) {
        const p = (playElapsed - 3.05) / (dur - 3.05);
        const ease = p * p * (3 - 2 * p);
        u = 0.96 - (0.96 - 0.5) * ease;
      } else {
        playActive = false;
        u = 0.5;
        onPlayEnd && onPlayEnd();
      }
      onScrub(u, true);
    }

    const state = getState();
    const audit = getAudit();
    const g = audit.geom;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. 深石油青投影暗槽底色
    ctx.fillStyle = "#011C1E";
    ctx.fillRect(0, 0, cw, ch);

    // 细微放映胶片上下齿孔线（极克制，呼应演示胶片隐喻）
    ctx.fillStyle = "rgba(245, 228, 206, 0.08)";
    const holeStep = 24;
    for (let hx = 10; hx < cw - 10; hx += holeStep) {
      ctx.fillRect(hx, 6, 10, 4);
    }

    // 2. 计算三帧严格 16:9 尺寸（绝不压扁！）
    const compact = cw < 520;
    const topPad = compact ? 24 : 26;
    const bottomHudH = compact ? 74 : 76;
    const availH = Math.max(120, ch - topPad - bottomHudH);
    const maxSlideW = compact ? cw * 0.78 : cw * 0.58;
    const slideHByW = maxSlideW * (9 / 16);
    const slideH = Math.min(availH, slideHByW);
    const slideW = slideH * (16 / 9);
    const gap = Math.max(14, slideW * 0.055);
    const stride = slideW + gap;

    // 根据 scrub (0..1) 连续平移三帧胶片：0 = 04 居中，0.5 = 05 居中，1 = 06 居中
    const scrub = state.scrub;
    const shiftFrames = (0.5 - scrub) * 2; // +1 at scrub=0, 0 at scrub=0.5, -1 at scrub=1
    const centerX = (cw - slideW) / 2;
    const slideY = topPad + (availH - slideH) / 2;

    const x04 = centerX + (shiftFrames - 1) * stride;
    const x05 = centerX + shiftFrames * stride;
    const x06 = centerX + (shiftFrames + 1) * stride;

    // 顶部帧号标尺（按各帧可见区间严格裁剪，窄屏绝不互相叠字）
    ctx.font = `700 ${compact ? 10 : 11}px ${FONT_MONO}`;
    const labels = [
      { x: x04, text: compact ? `SLIDE ${g.deck.prevSlide.num}` : `SLIDE ${g.deck.prevSlide.num} · 前章高密页`, active: scrub < 0.25 },
      { x: x05, text: compact ? `SLIDE 05 · 节标题 [点击改稿]` : `SLIDE 05 · 节标题页 [点击改稿]`, active: scrub >= 0.25 && scrub <= 0.75 },
      { x: x06, text: compact ? `SLIDE ${g.deck.nextSlide.num}` : `SLIDE ${g.deck.nextSlide.num} · 新章高密页`, active: scrub > 0.75 }
    ];
    for (const lb of labels) {
      const visLeft = Math.max(8, lb.x);
      const visRight = Math.min(cw - 8, lb.x + slideW);
      if (visRight - visLeft < 72) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(visLeft, slideY - 22, visRight - visLeft, 20);
      ctx.clip();
      ctx.fillStyle = lb.active ? "#FF8240" : "rgba(245, 228, 206, 0.58)";
      ctx.fillText(lb.text, lb.x, slideY - 8);
      ctx.restore();
    }

    // 侧页非聚焦时做轻柔透明度区分，主聚焦页 100% 锐利
    const drawWithFocus = (fn, sx, dist) => {
      if (sx + slideW < -20 || sx > cw + 20) return;
      ctx.save();
      const alpha = Math.max(0.46, 1 - Math.abs(dist) * 0.45);
      ctx.globalAlpha = alpha;
      fn(sx, slideY, slideW, slideH);
      ctx.restore();
    };

    drawWithFocus((sx, sy, sw, sh) => drawPrevSlide(sx, sy, sw, sh, g.deck), x04, shiftFrames - 1);
    drawWithFocus((sx, sy, sw, sh) => drawNextSlide(sx, sy, sw, sh, g.deck), x06, shiftFrames + 1);

    // 始终把 05 号节标题画在最上层（保持可点状态）
    if (x05 + slideW > -20 && x05 < cw + 20) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.7, 1 - Math.abs(shiftFrames) * 0.28);
      drawSectionSlide(x05, slideY, slideW, slideH, state, audit, t);
      ctx.restore();
    } else {
      hitZones = [];
    }

    // 3. 底部：认知负荷 / 换气波形 + 337 原海报炽橙横轨与暖米拖拽圆球
    const waveTop = slideY + slideH + 14;
    const waveH = 34;
    const railPad = compact ? 22 : 44;
    const railW = cw - railPad * 2;
    const railY = waveTop + waveH + 14;
    railRect = { x: railPad, y: waveTop - 4, w: railW, h: waveH + 28 };

    // 波形网格基准线
    ctx.strokeStyle = "rgba(245, 228, 206, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(railPad, waveTop + waveH);
    ctx.lineTo(railPad + railW, waveTop + waveH);
    ctx.stroke();

    // 填充认知负荷曲线（错态平顶呈红橙警色，成立深谷呈松碧换气色）
    const isBreathOpen = audit.score === 4 || g.sectionLoad < 0.36;
    const steps = 64;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const lx = railPad + u * railW;
      const load = sampleLoadCurve(u, g);
      const ly = waveTop + waveH - load * waveH;
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.strokeStyle = isBreathOpen ? "#5CE0B3" : "#FF7357";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.lineTo(railPad + railW, waveTop + waveH);
    ctx.lineTo(railPad, waveTop + waveH);
    ctx.closePath();
    ctx.fillStyle = isBreathOpen ? "rgba(92, 224, 179, 0.16)" : "rgba(255, 115, 87, 0.16)";
    ctx.fill();

    // 波形文字说明（左右各一，简洁清晰）
    ctx.font = `700 ${compact ? 10 : 11}px ${FONT_ZH}`;
    ctx.fillStyle = isBreathOpen ? "#5CE0B3" : "#FF8A70";
    const breathTxt = isBreathOpen
      ? `认知负荷（示意）：05页落出换气深谷`
      : `认知负荷（示意）：05页仍处高压，无喘息谷`;
    ctx.fillText(breathTxt, railPad, waveTop + 10);

    ctx.font = `700 10px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(245, 228, 206, 0.72)";
    const scrubTxt = scrub < 0.25 ? "04 前章" : scrub > 0.75 ? "06 新章" : "05 节标题";
    const stw = ctx.measureText(scrubTxt).width;
    ctx.fillText(scrubTxt, railPad + railW - stw, waveTop + 10);

    // 337 原海报同款炽橙横轨 + 暖米滑球
    ctx.fillStyle = "rgba(241, 99, 24, 0.34)";
    roundedRectPath(railPad, railY - 3, railW, 6, 3);
    ctx.fill();

    const orbX = railPad + scrub * railW;
    ctx.fillStyle = "#F16318";
    roundedRectPath(railPad, railY - 3, Math.max(6, orbX - railPad), 6, 3);
    ctx.fill();

    // 三帧刻度钉
    for (const mark of [0, 0.5, 1]) {
      const mx = railPad + mark * railW;
      ctx.fillStyle = mark === 0.5 ? "#F16318" : "rgba(245, 228, 206, 0.5)";
      ctx.beginPath();
      ctx.arc(mx, railY, mark === 0.5 ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 暖米圆球把手（1:1 致敬原海报弯轨中的暖米圆球）
    ctx.fillStyle = "#F5E4CE";
    ctx.beginPath();
    ctx.arc(orbX, railY, dragging ? 11.5 : 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F16318";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 当前读数竖线落入波形
    const curLoad = sampleLoadCurve(scrub, g);
    const curY = waveTop + waveH - curLoad * waveH;
    ctx.strokeStyle = "rgba(245, 228, 206, 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(orbX, curY);
    ctx.lineTo(orbX, railY - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function findHit(px, py) {
    // 逆序命中，保证前景标题/正文优先于底色
    for (let i = hitZones.length - 1; i >= 0; i--) {
      const z = hitZones[i];
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) return z;
    }
    return null;
  }

  function localXY(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  // 指针交互：横拖推演三页胶片，短点直修 05 页元素
  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button > 0) return;
    playActive = false;
    const pt = localXY(ev);
    dragging = true;
    dragMoved = false;
    dragStartX = pt.x;
    dragStartScrub = getState().scrub;
    // 若直接点在底部橙轨上，立即跳到对应胶片位置
    if (pt.y >= railRect.y && pt.y <= railRect.y + railRect.h && railRect.w > 20) {
      const u = Math.max(0, Math.min(1, (pt.x - railRect.x) / railRect.w));
      dragStartScrub = u;
      dragMoved = true;
      onScrub(u, false);
    }
    try { canvas.setPointerCapture(ev.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pt = localXY(ev);
    if (dragging) {
      const dx = pt.x - dragStartX;
      if (Math.abs(dx) > 5) dragMoved = true;
      if (dragMoved) {
        // 如果是在轨道上拖，直接跟手；在画布上横拖，拖动整幅宽即扫过三帧
        const inRail = pt.y >= railRect.y - 10;
        let next;
        if (inRail && railRect.w > 20) {
          next = (pt.x - railRect.x) / railRect.w;
        } else {
          const span = Math.max(220, cw * 0.65);
          next = dragStartScrub - dx / span;
        }
        onScrub(Math.max(0, Math.min(1, next)), false);
      }
      return;
    }
    const z = findHit(pt.x, pt.y);
    hoverZone = z ? z.id : null;
    canvas.style.cursor = pt.y >= railRect.y ? "ew-resize" : (z ? "pointer" : "grab");
  });

  function finishPointer(ev) {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(ev.pointerId); } catch {}
    const pt = localXY(ev);
    if (!dragMoved) {
      const z = findHit(pt.x, pt.y);
      if (z) {
        flashTimer = 0.35;
        onClickZone(z.id);
      }
    } else {
      // 松手时轻吸向 05 节标题中心，但允许停在 04 或 06 任意处观察对比
      const cur = getState().scrub;
      if (Math.abs(cur - 0.5) < 0.045) onScrub(0.5, false);
    }
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  return {
    render,
    triggerFlash() { flashTimer = 0.32; },
    startPlay() {
      playActive = true;
      playElapsed = 0;
    },
    stopPlay() {
      playActive = false;
    },
    isPlaying() { return playActive; }
  };
}
