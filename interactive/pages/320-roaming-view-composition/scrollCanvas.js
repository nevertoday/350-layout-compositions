// 320 游观式构图 — 原海报风格 2D Canvas 游观手卷绘制器
// 逐像素承袭 320 原海报的暖米宣纸、深靛墨蓝、珊瑚游径粉、松黛青绿与暖杏日晕
// 支持横向手卷模式（桌面/平板/横屏）与忠于原海报 3:4 竖势的竖屏 S 盘升模式，所有圆保持严格 1:1

export const PALETTE = {
  paper: "#FBF5EA",
  paperLight: "#FFFDF8",
  paperSand: "#F4EBD9",
  navy: "#071B44",
  navyDeep: "#051230",
  navyMid: "#22365E",
  rose: "#E891A3",
  roseDeep: "#DF758C",
  roseText: "#A32E4A",
  roseSoft: "#F2C6CF",
  sage: "#366E5B",
  sageLight: "#568774",
  sageText: "#1F5443",
  sun: "#F3DCB9",
  coralSun: "#E27D84",
  alert: "#B52626",
  alertSoft: "rgba(181, 38, 38, 0.14)",
  hairline: "rgba(7, 27, 68, 0.16)",
};

export function renderScrollCanvas(ctx, w, h, state, layout, gaze, diag, timeSec) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1. 暖米宣纸手卷底与微弱折痕
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, w, h);

  // 手卷上下细边框线与竖向装裱折痕（极淡，烘托手卷质感）
  ctx.strokeStyle = "rgba(7, 27, 68, 0.08)";
  ctx.lineWidth = 1;
  const foldCount = layout.orientation === "vertical" ? 4 : 6;
  for (let i = 1; i < foldCount; i++) {
    const fx = Math.round((w * i) / foldCount) + 0.5;
    ctx.beginPath();
    ctx.moveTo(fx, 10);
    ctx.lineTo(fx, h - 10);
    ctx.stroke();
  }

  // 原海报同款装饰点阵：右上 6×3 粉点阵 + 左下 3×7 松绿点阵（严格 1:1 圆）
  drawDotMatrix(ctx, w - (layout.orientation === "vertical" ? 66 : 94), 22, 6, 3, 10, 10, 2, PALETTE.rose);
  drawDotMatrix(ctx, 18, h - (layout.orientation === "vertical" ? 84 : 92), 3, 6, 10, 11, 1.9, PALETTE.sageLight);

  // 2. 路径层：珊瑚粉丝带（或死直/断脉错态警示）
  drawPathRibbon(ctx, w, h, state, layout, timeSec);

  // 3. 五幕场景层（依据实绘坐标与停留权重缩放）
  const baseScale = layout.orientation === "vertical"
    ? Math.min(w, h) * 0.115
    : Math.min(h * 0.20, w * 0.056);

  for (const st of layout.stations) {
    const px = st.x * w;
    const py = st.y * h;
    const sc = baseScale * (0.74 + 0.28 * st.weight);
    const isSelected = state.selectedSlot === st.slot;
    const isFocused = gaze.nearest.slot === st.slot && gaze.nearStation && !gaze.inGap;
    drawSceneVignette(ctx, px, py, sc, state.theme, st.sceneKey, timeSec, {
      isSelected,
      isFocused,
      lookback: state.revealMode === "veiledLookback" && st.slot === 4,
      mistEnd: state.revealMode === "mistResonance" && st.slot === 4,
    });
  }

  // 4. 藏露薄雾层（未入游观视窗区域的柔和宣纸藏露遮蔽，视窗内部清晰通透）
  drawRevealVeil(ctx, w, h, state, layout, gaze, timeSec);

  // 5. 路径节点标号、选中框与错态直指标签（画在薄雾之上保证永远清晰可读）
  drawStationCallouts(ctx, w, h, state, layout, gaze, diag);

  // 6. 起点 START 墨蓝大圆与终点箭头回望光弧
  drawStartAndEnd(ctx, w, h, state, layout, timeSec);

  // 7. 活体游观取景视窗（随拖动实时沿路径游走）
  drawGazeAperture(ctx, w, h, state, layout, gaze, diag, timeSec);

  ctx.restore();
}

function drawDotMatrix(ctx, x0, y0, cols, rows, dx, dy, r, color) {
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.arc(x0 + col * dx, y0 + row * dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPathRibbon(ctx, w, h, state, layout, timeSec) {
  const pts = layout.pathPts;
  const ribbonW = layout.orientation === "vertical" ? 9 : 11;

  // 若是死直线错态，先画一条警示红色直穿视线
  if (state.pathMode === "straight") {
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = "rgba(181, 38, 38, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
    ctx.stroke();
    ctx.restore();
  }

  // 绘制主珊瑚粉路径丝带
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawSegment = (fromIdx, toIdx, color, width) => {
    if (toIdx <= fromIdx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[fromIdx].x * w, pts[fromIdx].y * h);
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      ctx.lineTo(pts[i].x * w, pts[i].y * h);
    }
    ctx.stroke();
  };

  if (layout.gapSpan) {
    const gapA = Math.floor(layout.gapSpan[0] * (pts.length - 1));
    const gapB = Math.ceil(layout.gapSpan[1] * (pts.length - 1));
    drawSegment(0, gapA, PALETTE.rose, ribbonW);
    drawSegment(gapB, pts.length - 1, PALETTE.rose, ribbonW);

    // 断脉警示虚线与标签
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = PALETTE.alert;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[gapA].x * w, pts[gapA].y * h);
    ctx.lineTo(pts[gapB].x * w, pts[gapB].y * h);
    ctx.stroke();
    ctx.setLineDash([]);

    const mx = ((pts[gapA].x + pts[gapB].x) * 0.5) * w;
    const my = ((pts[gapA].y + pts[gapB].y) * 0.5) * h;
    drawPillLabel(ctx, mx, my, `断脉 ${layout.gapPct}% · 视线迷失`, PALETTE.alert, "#FFFDF8");
  } else {
    drawSegment(0, pts.length - 1, PALETTE.rose, ribbonW);
    // 丝带中心细微流动微光（极柔和，暗示视线方向）
    ctx.setLineDash([3, 18]);
    ctx.lineDashOffset = -timeSec * 22;
    ctx.strokeStyle = "rgba(255, 253, 248, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * w, pts[i].y * h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4 枚原海报同款白晕深靛里程碑圆点
  for (const m of layout.milestones) {
    if (m.hidden) continue;
    const mx = m.x * w;
    const my = m.y * h;
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(mx, my, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.arc(mx, my, 4.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStartAndEnd(ctx, w, h, state, layout, timeSec) {
  const start = layout.pathPts[0];
  const end = layout.pathPts[layout.pathPts.length - 1];
  const prev = layout.pathPts[layout.pathPts.length - 3];
  const sx = start.x * w;
  const sy = start.y * h;
  const ex = end.x * w;
  const ey = end.y * h;

  // 终点箭头（珊瑚粉，与原海报顶部大箭头一脉相承）
  const ang = Math.atan2(ey - prev.y * h, ex - prev.x * w);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(ang);
  ctx.fillStyle = state.revealMode === "exposed" ? PALETTE.alert : PALETTE.roseDeep;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -11);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 若为「适度藏露·回望」，画一道柔和回望虚弧从终景指向前半程
  if (state.revealMode === "veiledLookback") {
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(54, 110, 91, 0.42)";
    ctx.lineWidth = 1.4;
    const st0 = layout.stations[0];
    const st4 = layout.stations[4];
    ctx.beginPath();
    ctx.moveTo(st4.x * w - 8, st4.y * h - 18);
    ctx.quadraticCurveTo(w * 0.48, Math.max(16, Math.min(st0.y, st4.y) * h - 54), st0.x * w + 10, st0.y * h - 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 起点 START 深靛圆章（严格 1:1 圆）
  const r = layout.orientation === "vertical" ? 20 : (w < 620 ? 21 : 25);
  ctx.save();
  ctx.fillStyle = PALETTE.navy;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.paperLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${r <= 21 ? 10.5 : 12}px "Noto Serif SC", serif`;
  ctx.fillText("起点", sx, sy - 4.5);
  ctx.font = `500 8px "Sora", sans-serif`;
  ctx.fillStyle = "rgba(251, 245, 234, 0.88)";
  ctx.fillText("START", sx, sy + 8);
  ctx.restore();
}

// 绘制 3 套母题 × 5 种景致（纯平面几何插画，零惊悚五官，1:1 呼应原海报语言）
function drawSceneVignette(ctx, x, y, s, theme, sceneKey, timeSec, opts) {
  ctx.save();
  ctx.translate(x, y);

  // 选中站点的细线外框提示
  if (opts.isSelected) {
    ctx.strokeStyle = PALETTE.roseText;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (theme === "bianhe") {
    drawBianheScene(ctx, s, sceneKey, timeSec, opts);
  } else if (theme === "garden") {
    drawGardenScene(ctx, s, sceneKey, timeSec, opts);
  } else {
    drawPosterScene(ctx, s, sceneKey, timeSec, opts);
  }

  ctx.restore();
}

// 母题一：1:1 复刻 320 原海报五景（拱门 / 山峰 / 双拱楼阁 / 弧桥 / 灯塔）
function drawPosterScene(ctx, s, key, t, opts) {
  if (key === "arch") {
    // 拱门入景：深靛拱门 + 暖杏内框 + 珊瑚旭日 + 四层松绿台阶 + 两棵松树
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.arc(0, -s * 0.22, s * 0.56, Math.PI, 0);
    ctx.lineTo(s * 0.56, s * 0.62);
    ctx.lineTo(-s * 0.56, s * 0.62);
    ctx.closePath();
    ctx.fill();

    // 门洞内暖米留白
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, -s * 0.20, s * 0.34, Math.PI, 0);
    ctx.lineTo(s * 0.34, s * 0.42);
    ctx.lineTo(-s * 0.34, s * 0.42);
    ctx.closePath();
    ctx.fill();

    // 拱门内升起的珊瑚红半日
    ctx.fillStyle = PALETTE.coralSun;
    ctx.beginPath();
    ctx.arc(0, s * 0.26, s * 0.24, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // 阶梯层叠
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? PALETTE.sage : PALETTE.sageLight;
      const wStep = s * (0.82 + i * 0.14);
      ctx.fillRect(-wStep * 0.58, s * (0.34 + i * 0.085), wStep, s * 0.07);
    }
    // 右侧松绿双针叶树
    drawTriangle(ctx, s * 0.62, s * 0.56, s * 0.24, s * 0.66, PALETTE.sage);
    drawTriangle(ctx, s * 0.78, s * 0.56, s * 0.20, s * 0.46, PALETTE.sageLight);
  } else if (key === "peak") {
    // 山林移步：杏砂圆日 + 深靛尖峰 + 松绿柔坡 + 粉色圆树
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(-s * 0.30, -s * 0.34, s * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // 深靛三角主峰
    drawTriangle(ctx, s * 0.18, s * 0.52, s * 0.92, s * 1.12, PALETTE.navy);
    // 松绿前坡
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, s * 0.52);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.04, s * 0.78, s * 0.08);
    ctx.lineTo(s * 0.78, s * 0.52);
    ctx.closePath();
    ctx.fill();

    // 底基线
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.92, s * 0.52, s * 1.72, s * 0.08);

    // 左侧粉色圆冠树
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(1.8, s * 0.045);
    ctx.beginPath();
    ctx.moveTo(-s * 0.66, s * 0.52);
    ctx.lineTo(-s * 0.66, s * 0.14);
    ctx.stroke();
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.arc(-s * 0.66, s * 0.06, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === "tower") {
    // 双拱楼阁：双窗阁楼 + 绿丘 + 粉树 + 飞鸟 + 水平细线
    // 主楼暖米墙体
    ctx.fillStyle = PALETTE.sun;
    ctx.fillRect(-s * 0.32, -s * 0.34, s * 0.52, s * 0.76);
    // 深靛尖顶
    drawTriangle(ctx, -s * 0.06, -s * 0.34, s * 0.66, s * 0.34, PALETTE.navy);
    // 双拱窗
    ctx.fillStyle = PALETTE.navy;
    for (const wx of [-s * 0.16, s * 0.04]) {
      ctx.beginPath();
      ctx.arc(wx, -s * 0.14, s * 0.065, Math.PI, 0);
      ctx.lineTo(wx + s * 0.065, s * 0.06);
      ctx.lineTo(wx - s * 0.065, s * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    // 下层墨蓝阁座
    ctx.fillRect(-s * 0.44, s * 0.14, s * 0.64, s * 0.34);

    // 绿丘基底
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.moveTo(-s * 0.78, s * 0.56);
    ctx.quadraticCurveTo(-s * 0.08, s * 0.02, s * 0.84, s * 0.56);
    ctx.closePath();
    ctx.fill();

    // 右侧粉树
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(1.6, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(s * 0.56, s * 0.52);
    ctx.lineTo(s * 0.56, s * 0.22);
    ctx.stroke();
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.arc(s * 0.56, s * 0.14, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // 飞鸟两只（随时间微振）
    const flap = Math.sin(t * 2.2) * s * 0.03;
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 1.6;
    drawBird(ctx, s * 0.34, -s * 0.48 + flap, s * 0.13);
    drawBird(ctx, s * 0.52, -s * 0.34 - flap * 0.8, s * 0.10);

    // 水面细纹
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.76, s * 0.62, s * 1.44, 1.8);
    ctx.fillRect(-s * 0.46, s * 0.70, s * 0.82, 1.5);
  } else if (key === "bridge") {
    // 弧桥过渡：柔和淡云 + 珊瑚水面条纹倒影 + 深靛弯桥 + 侧柏树
    // 淡云
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(-s * 0.58, -s * 0.44, s * 0.18, Math.PI, 0);
    ctx.arc(-s * 0.38, -s * 0.42, s * 0.13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // 珊瑚粉半圆倒影池 + 水平奶白波纹
    ctx.save();
    ctx.beginPath();
    ctx.arc(-s * 0.08, s * 0.24, s * 0.66, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = PALETTE.coralSun;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1.6;
    for (let i = 1; i <= 4; i++) {
      const ry = s * (0.24 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(-s * 0.65, ry);
      ctx.lineTo(s * 0.52, ry);
      ctx.stroke();
    }
    ctx.restore();

    // 桥拱本体（深靛半圆拱）
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(5, s * 0.15);
    ctx.beginPath();
    ctx.arc(-s * 0.08, s * 0.26, s * 0.48, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();

    // 桥栏细柱
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-s * 0.08, s * 0.24, s * 0.62, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    for (let k = -2; k <= 2; k++) {
      const a = Math.PI * 1.5 + k * 0.24;
      ctx.beginPath();
      ctx.moveTo(-s * 0.08 + Math.cos(a) * s * 0.48, s * 0.26 + Math.sin(a) * s * 0.48);
      ctx.lineTo(-s * 0.08 + Math.cos(a) * s * 0.62, s * 0.24 + Math.sin(a) * s * 0.62);
      ctx.stroke();
    }

    // 桥右双青柏
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.ellipse(s * 0.62, -s * 0.08, s * 0.12, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sageLight;
    ctx.beginPath();
    ctx.ellipse(s * 0.80, s * 0.02, s * 0.09, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(s * 0.61, s * 0.16, 2, s * 0.16);
    ctx.fillRect(s * 0.79, s * 0.18, 2, s * 0.14);
  } else {
    // 灯塔抵达：珊瑚红日 + 墨蓝与珊瑚粉条纹灯塔 + 暖黄灯束 + 松绿海岸丘
    ctx.fillStyle = PALETTE.coralSun;
    ctx.beginPath();
    ctx.arc(-s * 0.64, -s * 0.24, s * 0.19, 0, Math.PI * 2);
    ctx.fill();

    // 灯塔暖光束（回望解时缓慢呼吸）
    const beamAlpha = opts.lookback ? 0.62 + 0.22 * Math.sin(t * 2.0) : 0.45;
    ctx.fillStyle = `rgba(243, 220, 185, ${beamAlpha.toFixed(2)})`;
    // 左光束（朝向来路回望！）
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.64);
    ctx.lineTo(-s * (opts.lookback ? 1.15 : 0.56), -s * 0.80);
    ctx.lineTo(-s * (opts.lookback ? 1.15 : 0.56), -s * 0.48);
    ctx.closePath();
    ctx.fill();
    // 右光束
    ctx.beginPath();
    ctx.moveTo(s * 0.28, -s * 0.64);
    ctx.lineTo(s * 0.72, -s * 0.76);
    ctx.lineTo(s * 0.72, -s * 0.52);
    ctx.closePath();
    ctx.fill();

    // 塔身条纹梯形
    const stripes = [
      { y0: -0.52, y1: -0.26, w0: 0.28, w1: 0.34, c: PALETTE.navy },
      { y0: -0.26, y1: -0.02, w0: 0.34, w1: 0.40, c: PALETTE.rose },
      { y0: -0.02, y1: 0.24,  w0: 0.40, w1: 0.46, c: PALETTE.navy },
      { y0: 0.24,  y1: 0.48,  w0: 0.46, w1: 0.52, c: PALETTE.rose },
    ];
    for (const st of stripes) {
      ctx.fillStyle = st.c;
      ctx.beginPath();
      ctx.moveTo(s * 0.10 - s * st.w0 * 0.5, s * st.y0);
      ctx.lineTo(s * 0.10 + s * st.w0 * 0.5, s * st.y0);
      ctx.lineTo(s * 0.10 + s * st.w1 * 0.5, s * st.y1);
      ctx.lineTo(s * 0.10 - s * st.w1 * 0.5, s * st.y1);
      ctx.closePath();
      ctx.fill();
    }
    // 灯房与帽顶
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(s * 0.10 - s * 0.16, -s * 0.70, s * 0.32, s * 0.18);
    ctx.fillStyle = PALETTE.sun;
    ctx.fillRect(s * 0.10 - s * 0.08, -s * 0.67, s * 0.16, s * 0.12);
    drawTriangle(ctx, s * 0.10, -s * 0.70, s * 0.38, s * 0.18, PALETTE.navy);

    // 海岸绿坡与深靛礁崖
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.moveTo(-s * 0.92, s * 0.56);
    ctx.quadraticCurveTo(-s * 0.36, s * 0.04, s * 0.26, s * 0.56);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, s * 0.56);
    ctx.quadraticCurveTo(s * 0.04, s * 0.14, s * 0.66, s * 0.26);
    ctx.lineTo(s * 0.66, s * 0.56);
    ctx.closePath();
    ctx.fill();
  }
}

// 母题二：汴河长卷·北宋五景（沿用 320 同色系）
function drawBianheScene(ctx, s, key, t) {
  if (key === "arch") {
    // 郊外柳岸
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.48);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.12, s * 0.85, s * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, s * 0.44);
    ctx.quadraticCurveTo(-s * 0.22, -s * 0.2, s * 0.04, -s * 0.42);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.sageLight;
    ctx.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.02 + i * s * 0.09, -s * 0.36);
      ctx.quadraticCurveTo(s * 0.08 + i * s * 0.11, -s * 0.02, s * 0.04 + i * s * 0.10, s * 0.28);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(s * 0.54, -s * 0.34, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === "peak") {
    // 汴河运舟
    ctx.fillStyle = PALETTE.roseSoft;
    ctx.fillRect(-s * 0.86, s * 0.28, s * 1.72, s * 0.26);
    // 船体
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-s * 0.62, s * 0.24);
    ctx.lineTo(s * 0.64, s * 0.20);
    ctx.lineTo(s * 0.44, s * 0.42);
    ctx.lineTo(-s * 0.46, s * 0.42);
    ctx.closePath();
    ctx.fill();
    // 船帆
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, -s * 0.56);
    ctx.quadraticCurveTo(s * 0.36, -s * 0.16, s * 0.26, s * 0.16);
    ctx.lineTo(-s * 0.18, s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, -s * 0.60);
    ctx.lineTo(-s * 0.04, s * 0.22);
    ctx.stroke();
    // 粉色船旗
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, -s * 0.60);
    ctx.lineTo(-s * 0.36, -s * 0.52);
    ctx.lineTo(-s * 0.04, -s * 0.44);
    ctx.closePath();
    ctx.fill();
  } else if (key === "tower") {
    // 虹桥盛景（无五官小剪影 + 大跨木拱桥）
    ctx.fillStyle = PALETTE.coralSun;
    ctx.fillRect(-s * 0.88, s * 0.32, s * 1.76, s * 0.24);
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(5.5, s * 0.15);
    ctx.beginPath();
    ctx.arc(0, s * 0.62, s * 0.82, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();
    // 桥上红伞华盖与简笔背影点（绝不画五官）
    for (const bx of [-s * 0.38, -s * 0.10, s * 0.18, s * 0.42]) {
      ctx.fillStyle = PALETTE.navy;
      ctx.beginPath();
      ctx.arc(bx, -s * 0.28, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx - s * 0.045, -s * 0.22, s * 0.09, s * 0.14);
    }
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.arc(-s * 0.10, -s * 0.36, s * 0.18, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.arc(s * 0.28, -s * 0.32, s * 0.14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  } else if (key === "bridge") {
    // 城门街市
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.68, -s * 0.02, s * 1.36, s * 0.58);
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, s * 0.36, s * 0.24, Math.PI, 0);
    ctx.lineTo(s * 0.24, s * 0.56);
    ctx.lineTo(-s * 0.24, s * 0.56);
    ctx.closePath();
    ctx.fill();
    // 城楼歇山顶
    ctx.fillStyle = PALETTE.sun;
    ctx.fillRect(-s * 0.42, -s * 0.34, s * 0.84, s * 0.32);
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-s * 0.66, -s * 0.30);
    ctx.lineTo(-s * 0.36, -s * 0.62);
    ctx.lineTo(s * 0.36, -s * 0.62);
    ctx.lineTo(s * 0.66, -s * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.fillRect(s * 0.56, -s * 0.54, s * 0.10, s * 0.42);
  } else {
    // 远山烟水
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(s * 0.36, -s * 0.34, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sageLight;
    ctx.beginPath();
    ctx.moveTo(-s * 0.90, s * 0.42);
    ctx.quadraticCurveTo(-s * 0.32, -s * 0.24, s * 0.18, s * 0.22);
    ctx.quadraticCurveTo(s * 0.52, -s * 0.14, s * 0.90, s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.78, s * 0.48, s * 1.56, 2);
    ctx.fillRect(-s * 0.46, s * 0.58, s * 0.96, 1.6);
    const flap = Math.sin(t * 2) * s * 0.03;
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = 1.5;
    drawBird(ctx, -s * 0.42, -s * 0.36 + flap, s * 0.12);
    drawBird(ctx, -s * 0.18, -s * 0.48 - flap, s * 0.09);
  }
}

// 母题三：江南园林·曲径五境
function drawGardenScene(ctx, s, key, t) {
  if (key === "arch") {
    // 月洞门
    ctx.fillStyle = PALETTE.paperSand;
    ctx.fillRect(-s * 0.76, -s * 0.56, s * 1.52, s * 1.12);
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.80, -s * 0.62, s * 1.60, s * 0.10);
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.arc(0, s * 0.04, s * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, s * 0.04, s * 0.37, 0, Math.PI * 2);
    ctx.fill();
    // 门内粉梅
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.arc(s * 0.10, -s * 0.04, s * 0.14, 0, Math.PI * 2);
    ctx.arc(-s * 0.08, s * 0.08, s * 0.10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sage;
    ctx.fillRect(-s * 0.24, s * 0.24, s * 0.48, s * 0.14);
  } else if (key === "peak") {
    // 叠石竹径
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, s * 0.52);
    ctx.lineTo(-s * 0.32, -s * 0.42);
    ctx.lineTo(s * 0.18, -s * 0.52);
    ctx.lineTo(s * 0.42, s * 0.08);
    ctx.lineTo(s * 0.32, s * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(-s * 0.02, -s * 0.04, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // 翠竹三竿
    ctx.strokeStyle = PALETTE.sage;
    ctx.lineWidth = Math.max(2, s * 0.055);
    for (const bx of [s * 0.48, s * 0.64]) {
      ctx.beginPath();
      ctx.moveTo(bx, s * 0.52);
      ctx.lineTo(bx + s * 0.06, -s * 0.54);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.sageLight;
    ctx.beginPath();
    ctx.ellipse(s * 0.58, -s * 0.34, s * 0.22, s * 0.08, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === "tower") {
    // 临水轩亭
    ctx.fillStyle = PALETTE.navy;
    ctx.beginPath();
    ctx.moveTo(-s * 0.72, -s * 0.14);
    ctx.quadraticCurveTo(0, -s * 0.46, 0, -s * 0.66);
    ctx.quadraticCurveTo(0, -s * 0.46, s * 0.72, -s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(2.2, s * 0.06);
    for (const px of [-s * 0.44, s * 0.44]) {
      ctx.beginPath();
      ctx.moveTo(px, -s * 0.14);
      ctx.lineTo(px, s * 0.38);
      ctx.stroke();
    }
    // 暖色亭灯
    ctx.fillStyle = PALETTE.roseDeep;
    ctx.beginPath();
    ctx.arc(0, s * 0.06, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // 荷池水线
    ctx.fillStyle = PALETTE.sage;
    ctx.fillRect(-s * 0.76, s * 0.38, s * 1.52, s * 0.12);
    ctx.fillStyle = PALETTE.coralSun;
    ctx.fillRect(-s * 0.56, s * 0.54, s * 1.12, 2);
  } else if (key === "bridge") {
    // 九曲石桥
    ctx.fillStyle = PALETTE.roseSoft;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.22, s * 0.82, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.navy;
    ctx.lineWidth = Math.max(4, s * 0.11);
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(-s * 0.78, s * 0.36);
    ctx.lineTo(-s * 0.32, s * 0.02);
    ctx.lineTo(s * 0.12, s * 0.32);
    ctx.lineTo(s * 0.56, -s * 0.04);
    ctx.lineTo(s * 0.82, s * 0.14);
    ctx.stroke();
    ctx.fillStyle = PALETTE.sage;
    ctx.beginPath();
    ctx.arc(-s * 0.54, -s * 0.24, s * 0.20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 借景远塔
    ctx.fillStyle = PALETTE.coralSun;
    ctx.beginPath();
    ctx.arc(-s * 0.44, -s * 0.32, s * 0.20, 0, Math.PI * 2);
    ctx.fill();
    // 四层檐塔
    for (let i = 0; i < 4; i++) {
      const tw = s * (0.58 - i * 0.10);
      const ty = s * (0.28 - i * 0.23);
      ctx.fillStyle = i % 2 === 0 ? PALETTE.navy : PALETTE.sage;
      ctx.beginPath();
      ctx.moveTo(-tw * 0.64, ty);
      ctx.lineTo(0, ty - s * 0.16);
      ctx.lineTo(tw * 0.64, ty);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.sun;
      ctx.fillRect(-tw * 0.32, ty, tw * 0.64, s * 0.11);
    }
    // 园墙遮脚（点明「借景」墙外见塔）
    ctx.fillStyle = PALETTE.paperSand;
    ctx.fillRect(-s * 0.86, s * 0.30, s * 1.72, s * 0.28);
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(-s * 0.86, s * 0.28, s * 1.72, s * 0.06);
  }
}

function drawTriangle(ctx, cx, baseY, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.5, baseY);
  ctx.lineTo(cx, baseY - height);
  ctx.lineTo(cx + width * 0.5, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawBird(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x - r * 0.45, y - r * 0.6, x, y);
  ctx.quadraticCurveTo(x + r * 0.45, y - r * 0.6, x + r, y);
  ctx.stroke();
}

// 藏露薄雾层：视窗内清晰通透，视窗外按当前遮蔽模式呈现「全敞 / 适度藏露 / 过度闷堵」
function drawRevealVeil(ctx, w, h, state, layout, gaze) {
  if (layout.veilPct <= 0) return;
  const gx = gaze.x * w;
  const gy = gaze.y * h;
  const isBlocked = layout.veilPct >= 75;
  const rx = isBlocked
    ? (layout.orientation === "vertical" ? w * 0.18 : w * 0.085)
    : (layout.orientation === "vertical" ? w * 0.36 : w * 0.18);
  const ry = isBlocked
    ? (layout.orientation === "vertical" ? h * 0.14 : h * 0.30)
    : (layout.orientation === "vertical" ? h * 0.26 : h * 0.44);

  const outerAlpha = isBlocked ? 0.88 : (layout.veilPct / 100) * 1.18;
  ctx.save();
  // 用径向渐变的暖宣纸薄雾（保留柔和透影，像宣纸手卷展卷到眼前）
  const maxR = Math.max(rx, ry);
  ctx.translate(gx, gy);
  ctx.scale(rx / maxR, ry / maxR);
  const grad = ctx.createRadialGradient(0, 0, maxR * 0.62, 0, 0, maxR * 1.55);
  grad.addColorStop(0, "rgba(251, 245, 234, 0)");
  grad.addColorStop(0.75, `rgba(251, 245, 234, ${(outerAlpha * 0.68).toFixed(2)})`);
  grad.addColorStop(1, `rgba(251, 245, 234, ${Math.min(0.92, outerAlpha).toFixed(2)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(-w * 2, -h * 2, w * 4, h * 4);
  ctx.restore();
}

function drawStationCallouts(ctx, w, h, state, layout, gaze) {
  const isVert = layout.orientation === "vertical";
  const compactH = !isVert && w < 620;
  for (const st of layout.stations) {
    const px = st.x * w;
    const py = st.y * h;
    const isNear = gaze.nearest.slot === st.slot && !gaze.inGap;
    const isMisplacedClimax = !state.monotone && st.slot === 0 && st.sceneKey === "beacon";
    const isReversedGate = !state.monotone && st.slot === 4 && st.sceneKey === "arch";
    const isAlert = isMisplacedClimax || isReversedGate || st.detached;

    const tagText = isMisplacedClimax
      ? `${st.actNum} ${st.scene.short}·高潮前置`
      : isReversedGate
        ? `${st.actNum} ${st.scene.short}·入口倒置`
        : `${st.actNum} ${st.scene.short}·${st.weightLabel}`;

    ctx.save();
    ctx.font = `600 ${isVert || compactH ? 10.5 : 11}px "Noto Serif SC", serif`;
    const halfW = ctx.measureText(tagText).width * 0.5 + 9;

    // 竖屏按左右外侧交错排布，彻底避免沿斜线碰撞；横屏上下交替并避开起点圆章
    let labelX = px;
    let labelY = py;
    if (isVert) {
      if (st.slot === 0) {
        labelX = px + 68;
        labelY = py + 24;
      } else if (st.slot === 4) {
        labelX = px - 58;
        labelY = py - 34;
      } else {
        labelX = st.slot % 2 === 1 ? px + 44 : px - 44;
        labelY = st.slot % 2 === 1 ? py + 34 : py - 36;
      }
    } else {
      labelY = py < h * 0.48 ? py - (compactH ? 38 : 44) : py + (compactH ? 38 : 46);
      if (st.slot === 0) {
        labelX = Math.max(px + (compactH ? 24 : 8), (compactH ? 74 : 96) + halfW);
      }
    }

    const clampedX = Math.max(halfW + 8, Math.min(w - halfW - 8, labelX));
    const clampedY = Math.max(36, Math.min(h - 18, labelY));

    // 珊瑚粉小虚线引标（复刻原海报每幕旁的粉色虚线）
    ctx.strokeStyle = isAlert ? PALETTE.alert : PALETTE.roseDeep;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, py + (clampedY < py ? -16 : 16));
    ctx.lineTo(clampedX, clampedY + (clampedY < py ? 10 : -10));
    ctx.stroke();
    ctx.setLineDash([]);

    const bg = isAlert
      ? PALETTE.alert
      : state.selectedSlot === st.slot
        ? PALETTE.roseText
        : isNear
          ? PALETTE.navy
          : "rgba(255, 253, 248, 0.96)";
    const fg = (isAlert || state.selectedSlot === st.slot || isNear) ? "#FFFDF8" : PALETTE.navy;
    const border = isAlert ? PALETTE.alert : (isNear ? PALETTE.navy : "rgba(7, 27, 68, 0.22)");
    drawPillLabel(ctx, clampedX, clampedY, tagText, bg, fg, border, isVert || compactH ? 10.5 : 11);
    ctx.restore();
  }

  // 顶部左上角统一状态条（永不压住画心景致与标牌）
  const hudY = 16;
  const statusLeft = isVert ? 12 : 16;
  if (state.pathMode === "straight" && state.revealMode === "exposed") {
    drawLeftPill(ctx, statusLeft, hudY, "死直全敞 · 从起点一眼穿到底", PALETTE.alert, "#FFFDF8");
  } else if (state.revealMode === "blocked") {
    drawLeftPill(ctx, statusLeft, hudY, "遮蔽 86% · 雾墙堵死下站引子", PALETTE.alert, "#FFFDF8");
  }
}

function drawLeftPill(ctx, x, cy, text, bg, fg) {
  ctx.save();
  ctx.font = `600 10.5px "Noto Serif SC", serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 14;
  const ph = 20;
  ctx.fillStyle = bg;
  ctx.fillRect(x, cy - ph / 2, pw, ph);
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 7, cy + 0.5);
  ctx.restore();
}

function drawPillLabel(ctx, cx, cy, text, bg, fg, border = null, size = 11) {
  ctx.save();
  ctx.font = `600 ${size}px "Noto Serif SC", serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 12;
  const ph = 19;
  const rx = cx - pw / 2;
  const ry = cy - ph / 2;
  ctx.fillStyle = bg;
  ctx.fillRect(rx, ry, pw, ph);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, pw - 1, ph - 1);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

// 活体游观取景视窗（随用户横向拖动平滑沿路径滑行，带精细四角画框括号与底部角标）
function drawGazeAperture(ctx, w, h, state, layout, gaze, diag, timeSec) {
  const gx = gaze.x * w;
  const gy = gaze.y * h;
  const isVert = layout.orientation === "vertical";
  const isBlocked = layout.veilPct >= 75;
  const bw = isBlocked ? (isVert ? 88 : 108) : (isVert ? 132 : Math.min(232, w * 0.20));
  const bh = isBlocked ? (isVert ? 86 : 114) : (isVert ? 118 : Math.min(204, h * 0.64));
  const x0 = Math.max(10, Math.min(w - bw - 10, gx - bw / 2));
  const y0 = Math.max(28, Math.min(h - bh - 10, gy - bh / 2));

  ctx.save();
  const frameColor = gaze.inGap || isBlocked ? PALETTE.alert : (diag.ok ? PALETTE.sage : PALETTE.navy);

  // 极细整框
  ctx.strokeStyle = frameColor;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
  ctx.globalAlpha = 1;

  // 四角 L 形手卷观景折角
  const arm = 12;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  // 左上
  ctx.moveTo(x0, y0 + arm); ctx.lineTo(x0, y0); ctx.lineTo(x0 + arm, y0);
  // 右上
  ctx.moveTo(x0 + bw - arm, y0); ctx.lineTo(x0 + bw, y0); ctx.lineTo(x0 + bw, y0 + arm);
  // 右下
  ctx.moveTo(x0 + bw, y0 + bh - arm); ctx.lineTo(x0 + bw, y0 + bh); ctx.lineTo(x0 + bw - arm, y0 + bh);
  // 左下
  ctx.moveTo(x0 + arm, y0 + bh); ctx.lineTo(x0, y0 + bh); ctx.lineTo(x0, y0 + bh - arm);
  ctx.stroke();

  // 路径上的实时游观眼点（温柔呼吸环，严格 1:1 圆）
  const pulse = 1 + 0.16 * Math.sin(timeSec * 3.4);
  ctx.fillStyle = "rgba(223, 117, 140, 0.26)";
  ctx.beginPath();
  ctx.arc(gx, gy, 11 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.paperLight;
  ctx.beginPath();
  ctx.arc(gx, gy, 5.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = frameColor;
  ctx.beginPath();
  ctx.arc(gx, gy, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // 固定右下角优雅游观读数徽，永不与画心景致和标牌重叠
  const cap = `视窗 ${Math.round(gaze.t * 100)}% · ${gaze.paceTier}`;
  ctx.font = `500 10.5px "DM Mono", "Noto Serif SC", monospace`;
  const cw = ctx.measureText(cap).width + 12;
  const cx = w - cw - 12;
  const cy = h - 24;
  ctx.fillStyle = frameColor;
  ctx.fillRect(cx, cy, cw, 18);
  ctx.fillStyle = "#FFFDF8";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(cap, cx + 6, cy + 9.5);
  ctx.restore();
}

// 命中检测：判断画布点击是否点中某处景致（用于点击互换站序）
export function hitTestStation(xNorm, yNorm, layout, aspect) {
  let best = -1;
  let bestD = Infinity;
  const hitR = layout.orientation === "vertical" ? 0.12 : 0.16;
  for (const st of layout.stations) {
    const d = Math.hypot((st.x - xNorm) * Math.min(aspect, 2.2), st.y - yNorm);
    if (d < hitR && d < bestD) {
      bestD = d;
      best = st.slot;
    }
  }
  return best;
}
