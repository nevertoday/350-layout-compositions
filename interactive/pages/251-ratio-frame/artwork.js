// 251 比例框 · 三套与原海报血统一致的纯 2D 矢量画幅素材
// 严守人物无五官规矩（仅侧影剪影）；每个题材声明真实固有比例与核心主体安全盒（0..1），供 model.js 单真源核算可见率。

export const PALETTE = {
  paper: "#F7EDE3",
  paperBright: "#FBF5EE",
  blush: "#F4E6DB",
  blushDeep: "#EADAD2",
  crimson: "#A43C45",
  crimsonDeep: "#862430",
  crimsonBanner: "#9F3942",
  seal: "#D75156",
  tag: "#B73B4D",
  sky: "#F7E3DB",
  sun: "#E5A6A2",
  mtnFar: "#EBB6B1",
  mtnMid: "#DE9693",
  mtnMidDeep: "#A43E4E",
  mtnDark: "#4B1A22",
  darkRoom: "#36131A",
  ink: "#211719",
  inkMuted: "#554447",
  ok: "#1A6B4A",
  okSoft: "#DDF0E6",
  err: "#A8242E",
  errSoft: "#FCE4E6",
};

export const SCENES = {
  sunset: {
    id: "sunset",
    name: "原海报 · 霞山",
    short: "霞山落日",
    naturalRatio: 4 / 3,
    naturalLabel: "4:3",
    subjectName: "落日与主峰",
    // 核心主体安全盒（覆盖暖粉柔日与主山脊视觉中心）
    subjectBox: { x: 0.42, y: 0.14, w: 0.44, h: 0.48 },
    // 圆形检验标记（用于可视化 fill 形变）
    circleAnchor: { x: 0.74, y: 0.27, r: 0.085 },
    draw: drawSunset,
  },
  silhouette: {
    id: "silhouette",
    name: "画廊 · 侧影",
    short: "竖幅侧影",
    naturalRatio: 3 / 4,
    naturalLabel: "3:4",
    subjectName: "人物头肩剪影",
    // 竖幅人像头肩安全区（演示横框裁切若焦心偏下会切头）
    subjectBox: { x: 0.28, y: 0.12, w: 0.44, h: 0.40 },
    circleAnchor: { x: 0.50, y: 0.29, r: 0.105 },
    draw: drawSilhouette,
  },
  arch: {
    id: "arch",
    name: "器物 · 拱窗",
    short: "宽幅静物",
    naturalRatio: 16 / 9,
    naturalLabel: "16:9",
    subjectName: "月窗与主陶瓶",
    subjectBox: { x: 0.24, y: 0.20, w: 0.52, h: 0.58 },
    circleAnchor: { x: 0.50, y: 0.42, r: 0.135 },
    draw: drawArch,
  },
};

// 1:1 复刻 251 原海报的五重霞山落日版画
function drawSunset(ctx, x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);

  // 杏桃天光底
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  sky.addColorStop(0, "#F8E6DE");
  sky.addColorStop(1, "#F3D9CE");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // 右上暖粉柔日（按原图坐标缩放；当 w/h 被 fill 强拉时自然压扁，直观暴露畸变！）
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  const sx = w * 0.725;
  const sy = h * 0.265;
  const rx = w * 0.068;
  const ry = h * 0.068 * (4 / 3);
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // 最远浅雾山（右侧）
  ctx.fillStyle = PALETTE.mtnFar;
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.72);
  ctx.lineTo(w * 0.89, h * 0.44);
  ctx.lineTo(w, h * 0.50);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.52, h);
  ctx.closePath();
  ctx.fill();

  // 中左玫瑰主峰
  ctx.fillStyle = PALETTE.mtnMid;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.40);
  ctx.lineTo(w * 0.22, h * 0.28);
  ctx.lineTo(w * 0.62, h * 0.58);
  ctx.lineTo(w * 0.86, h * 0.72);
  ctx.lineTo(0, h * 0.84);
  ctx.closePath();
  ctx.fill();

  // 中景绛红重山（左倾）
  ctx.fillStyle = PALETTE.mtnMidDeep;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.53);
  ctx.lineTo(w * 0.14, h * 0.55);
  ctx.lineTo(w * 0.56, h * 0.77);
  ctx.lineTo(w, h * 0.84);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 前景深绛紫褐重山（右下抬升至左侧弧落）
  ctx.fillStyle = PALETTE.mtnDark;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.94);
  ctx.quadraticCurveTo(w * 0.46, h * 0.74, w * 0.88, h * 0.60);
  ctx.lineTo(w, h * 0.59);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 竖幅画廊侧影人像（纯优雅剪影，绝不画五官！）
function drawSilhouette(ctx, x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);

  // 暖杏纸墙与斜光窗
  ctx.fillStyle = "#F6E4DA";
  ctx.fillRect(0, 0, w, h);

  // 左侧淡玫瑰斜射墙影
  ctx.fillStyle = "#ECC3BB";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.54, 0);
  ctx.lineTo(w * 0.24, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 背后圆镜（天然检验 fill 拉伸畸变）
  ctx.fillStyle = "#DF9C97";
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.29, w * 0.21, h * 0.21 * (3 / 4), 0, 0, Math.PI * 2);
  ctx.fill();

  // 远景绛红拱门弧线
  ctx.strokeStyle = PALETTE.crimson;
  ctx.lineWidth = Math.max(1, w * 0.008);
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.34, w * 0.36, h * 0.26, 0, Math.PI, 0);
  ctx.stroke();

  // 人物背侧剪影（平滑轮廓，零五官）
  ctx.fillStyle = PALETTE.mtnDark;
  // 头部圆润剪影（带低发髻）
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.27, w * 0.105, h * 0.088, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.405, h * 0.305, w * 0.048, h * 0.042, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 颈肩与大衣长裙剪影
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.34);
  ctx.lineTo(w * 0.54, h * 0.34);
  ctx.quadraticCurveTo(w * 0.56, h * 0.40, w * 0.67, h * 0.44);
  ctx.quadraticCurveTo(w * 0.74, h * 0.48, w * 0.76, h * 0.92);
  ctx.lineTo(w * 0.79, h);
  ctx.lineTo(w * 0.22, h);
  ctx.lineTo(w * 0.26, h * 0.88);
  ctx.quadraticCurveTo(w * 0.29, h * 0.48, w * 0.37, h * 0.43);
  ctx.quadraticCurveTo(w * 0.45, h * 0.40, w * 0.46, h * 0.34);
  ctx.closePath();
  ctx.fill();

  // 绛红披肩斜折色块
  ctx.fillStyle = PALETTE.mtnMidDeep;
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.43);
  ctx.quadraticCurveTo(w * 0.51, h * 0.47, w * 0.67, h * 0.45);
  ctx.lineTo(w * 0.72, h * 0.66);
  ctx.quadraticCurveTo(w * 0.50, h * 0.61, w * 0.30, h * 0.67);
  ctx.closePath();
  ctx.fill();

  // 下方展台线
  ctx.fillStyle = "#B85560";
  ctx.fillRect(0, h * 0.90, w, h * 0.10);

  ctx.restore();
}

// 宽幅建筑拱窗与器物静物（16:9 固有宽图）
function drawArch(ctx, x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);

  // 杏白墙面
  ctx.fillStyle = "#F8E7DF";
  ctx.fillRect(0, 0, w, h);

  // 左右对称拱廊剪影
  ctx.fillStyle = "#ECC0B9";
  ctx.fillRect(0, 0, w * 0.18, h * 0.76);
  ctx.fillRect(w * 0.82, 0, w * 0.18, h * 0.76);

  // 中央大月窗（天然检验宽图被切或压扁）
  ctx.fillStyle = "#DF9793";
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.42, w * 0.135, h * 0.135 * (16 / 9), 0, 0, Math.PI * 2);
  ctx.fill();

  // 窗内淡光圆环
  ctx.fillStyle = "#F6E2DA";
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.42, w * 0.088, h * 0.088 * (16 / 9), 0, 0, Math.PI * 2);
  ctx.fill();

  // 桌面台板
  ctx.fillStyle = "#A43E4E";
  ctx.fillRect(0, h * 0.74, w, h * 0.26);

  // 桌面深影
  ctx.fillStyle = PALETTE.mtnDark;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.76);
  ctx.lineTo(w * 0.84, h * 0.76);
  ctx.lineTo(w * 0.92, h * 0.86);
  ctx.lineTo(w * 0.30, h * 0.86);
  ctx.closePath();
  ctx.fill();

  // 左中低陶钵
  ctx.fillStyle = PALETTE.mtnDark;
  ctx.beginPath();
  ctx.ellipse(w * 0.34, h * 0.67, w * 0.075, h * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(w * 0.265, h * 0.58, w * 0.15, h * 0.09);

  // 中央细颈主陶瓶
  ctx.fillStyle = "#8C2C3A";
  ctx.beginPath();
  ctx.moveTo(w * 0.47, h * 0.28);
  ctx.lineTo(w * 0.53, h * 0.28);
  ctx.lineTo(w * 0.525, h * 0.44);
  ctx.quadraticCurveTo(w * 0.59, h * 0.54, w * 0.56, h * 0.75);
  ctx.lineTo(w * 0.44, h * 0.75);
  ctx.quadraticCurveTo(w * 0.41, h * 0.54, w * 0.475, h * 0.44);
  ctx.closePath();
  ctx.fill();

  // 右侧方石与细枝
  ctx.fillStyle = "#D75156";
  ctx.fillRect(w * 0.62, h * 0.50, w * 0.085, h * 0.25);

  ctx.restore();
}
