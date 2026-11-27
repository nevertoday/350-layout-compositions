// 350 全图页单真源状态与真像素测光模型
// 所有画面坐标、裁切边界、WCAG 2.1 对比度与 4 项支柱诊断均由本模块统一计算

export const SCENES = {
  valley: {
    id: "valley",
    name: "暮谷巨日",
    badge: "原海报",
    subtitle: "落日峡湾与荧光河道引导视线",
    focal: { u: 0.66, v: 0.45, name: "巨日与河湾交汇口" },
    leadPath: [
      { u: 0.56, v: 0.94 },
      { u: 0.66, v: 0.74 },
      { u: 0.56, v: 0.60 },
      { u: 0.66, v: 0.45 },
    ],
    copy: {
      bullets: {
        title: "2026 年度视觉叙事升级方案与演示模板规范",
        lines: [
          "• 传统幻灯片模板常因四周边框与项目符号列表分散听众注意力",
          "• 建议改用全幅图片配合精简文字强化现场情绪与记忆留存效果",
          "• 附：本页整理自第三季度视觉评审纪要与演讲设计规范草案 V2",
        ],
        chars: 68,
      },
      concise: {
        title: "让画面先于语言抵达",
        sub: "一张全幅主图，胜过半页项目符号",
        chars: 18,
      },
      minimal: {
        title: "让画面说话",
        sub: "",
        chars: 5,
      },
    },
  },
  harbor: {
    id: "harbor",
    name: "晨雾独舟",
    badge: "极简海岸",
    subtitle: "蓝调晨雾留白与独舟暗影",
    focal: { u: 0.67, v: 0.58, name: "晨光波道中的独舟" },
    leadPath: [
      { u: 0.90, v: 0.54 },
      { u: 0.77, v: 0.56 },
      { u: 0.67, v: 0.58 },
    ],
    copy: {
      bullets: {
        title: "年度品牌出海长线增长与用户留存策略汇报",
        lines: [
          "• 在竞争饱和周期内保持长期战略定力是品牌建立认知的核心前提",
          "• 本季度我们系统梳理了新客首周触点并持续压缩链路流失损耗",
          "• 详细渠道投放回报率与区域定价测算请参见附录数据汇总页",
        ],
        chars: 66,
      },
      concise: {
        title: "穿越迷雾，看清方向",
        sub: "在喧嚣的市场里留出安静的锚点",
        chars: 18,
      },
      minimal: {
        title: "静水深流",
        sub: "",
        chars: 4,
      },
    },
  },
  atrium: {
    id: "atrium",
    name: "中庭光柱",
    badge: "建筑叙事",
    subtitle: "斜射天光与背影构筑空间聚焦",
    focal: { u: 0.66, v: 0.56, name: "光柱落点与观者背影" },
    leadPath: [
      { u: 0.44, v: 0.08 },
      { u: 0.55, v: 0.34 },
      { u: 0.66, v: 0.56 },
    ],
    copy: {
      bullets: {
        title: "新一代空间计算架构设计与底层渲染管线演进",
        lines: [
          "• 端侧算力与实时光影模拟突破让多维空间叙事进入实用阶段",
          "• 新架构通过统一交互坐标系消除了跨端界面割裂与多余层级",
          "• 完整性能基准与设备兼容矩阵请参见第四章技术指标说明表",
        ],
        chars: 65,
      },
      concise: {
        title: "让光成为空间的骨骼",
        sub: "克制结构，把注意力交还给秩序",
        chars: 18,
      },
      minimal: {
        title: "以光构形",
        sub: "",
        chars: 4,
      },
    },
  },
};

export const BAD_INITIAL = {
  scene: "valley",
  bleedZoom: 0.74,
  panX: -0.02,
  panY: 0.0,
  textX: 0.61,
  textY: 0.46,
  copyMode: "bullets",
  scrim: "none",
  lighting: "flat",
};

export const SOLUTIONS = {
  poster: {
    label: "原海报磨砂解",
    patch: {
      bleedZoom: 1.18,
      panX: 0.04,
      panY: 0.0,
      textX: 0.25,
      textY: 0.34,
      copyMode: "concise",
      scrim: "glass",
      lighting: "guided",
    },
  },
  gradient: {
    label: "侧向渐变解",
    patch: {
      bleedZoom: 1.24,
      panX: 0.05,
      panY: -0.02,
      textX: 0.26,
      textY: 0.68,
      copyMode: "concise",
      scrim: "gradient",
      lighting: "guided",
    },
  },
  natural: {
    label: "天然暗区无罩解",
    patch: {
      bleedZoom: 1.24,
      panX: 0.04,
      panY: 0.02,
      textX: 0.23,
      textY: 0.25,
      copyMode: "concise",
      scrim: "none",
      lighting: "guided",
    },
  },
  minimal: {
    label: "极简大标解",
    patch: {
      bleedZoom: 1.28,
      panX: 0.04,
      panY: 0.0,
      textX: 0.24,
      textY: 0.34,
      copyMode: "minimal",
      scrim: "none",
      lighting: "guided",
    },
  },
};

export const WRONG_PRESETS = {
  overcrop: {
    label: "裁切过头",
    patch: {
      bleedZoom: 1.70,
      panX: -0.06,
      panY: 0.0,
      textX: 0.24,
      textY: 0.34,
      copyMode: "concise",
      scrim: "glass",
      lighting: "guided",
    },
  },
  heavyveil: {
    label: "死黑厚幕",
    patch: {
      bleedZoom: 1.18,
      panX: 0.04,
      panY: 0.0,
      textX: 0.25,
      textY: 0.34,
      copyMode: "concise",
      scrim: "heavy",
      lighting: "guided",
    },
  },
  coverfocal: {
    label: "文字压焦",
    patch: {
      bleedZoom: 1.18,
      panX: 0.04,
      panY: 0.0,
      textX: 0.69,
      textY: 0.45,
      copyMode: "concise",
      scrim: "glass",
      lighting: "guided",
    },
  },
  washed: {
    label: "过曝发灰",
    patch: {
      bleedZoom: 1.18,
      panX: 0.04,
      panY: 0.0,
      textX: 0.25,
      textY: 0.34,
      copyMode: "concise",
      scrim: "none",
      lighting: "washed",
    },
  },
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// W3C WCAG 2.1 相对亮度计算
export function relLuminance(r, g, b) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(L1, L2) {
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

// 统一计算底片视窗（归一化 0..1），按目标绘制区真实宽高比等比裁切，确保任意屏幕下太阳都是正圆
const PLATE_AR = 960 / 540;

export function getPlateWindow(state, dstAR = PLATE_AR) {
  const z = clamp(state.bleedZoom, 0.68, 1.75);
  const plateZoom = z < 1 ? 1.24 : 1.24 + (z - 1) * 1.15;
  const baseSpan = 1 / plateZoom;
  // 按目标矩形宽高比等比缩放底片窗口（cover 策略，绝不等比拉伸圆成椭圆）
  const safeAR = clamp(dstAR || PLATE_AR, 0.55, 4.2);
  let viewW = baseSpan;
  let viewH = baseSpan;
  if (safeAR > PLATE_AR) {
    viewH = clamp(baseSpan * (PLATE_AR / safeAR), 0.30, 1);
    viewW = clamp(viewH * (safeAR / PLATE_AR), 0.30, 1);
  } else if (safeAR < PLATE_AR) {
    // 窄屏竖构图适当放宽纵向视野，确保太阳保持正圆且同时装下暗区与主焦点
    viewH = clamp(baseSpan * 1.32, 0.48, 1);
    viewW = clamp(viewH * (safeAR / PLATE_AR), 0.36, 1);
    viewH = viewW * (PLATE_AR / safeAR);
  }
  const baseCenterU = safeAR < 1.35 ? 0.54 : 0.5;
  const maxPanLeft = Math.max(0, baseCenterU - viewW / 2);
  const maxPanRight = Math.max(0, 1 - (baseCenterU + viewW / 2));
  const maxPanY = Math.max(0, (1 - viewH) / 2);
  const clampedPanX = clamp(state.panX, -maxPanRight, maxPanLeft);
  const clampedPanY = clamp(state.panY, -maxPanY, maxPanY);
  const u0 = clamp(baseCenterU - viewW / 2 - clampedPanX, 0, 1 - viewW);
  const v0 = clamp((1 - viewH) / 2 - clampedPanY, 0, 1 - viewH);
  return { z, plateZoom, viewW, viewH, u0, v0, maxPanX: Math.min(maxPanLeft, maxPanRight), maxPanY, clampedPanX, clampedPanY };
}

// 统一计算画框几何（归一化到画布 0..1）
export function getFrameGeometry(state, canvasAR = PLATE_AR) {
  const z = clamp(state.bleedZoom, 0.68, 1.75);
  const isFullBleed = z >= 0.99;
  const bleedFrac = isFullBleed ? 1 : clamp((z - 0.68) / (1.0 - 0.68), 0, 1);
  // 未满幅时，图片缩在带有页眉与白边的模板框里
  const padX = isFullBleed ? 0 : (1 - bleedFrac) * 0.115;
  const padTop = isFullBleed ? 0 : (1 - bleedFrac) * 0.165;
  const padBot = isFullBleed ? 0 : (1 - bleedFrac) * 0.095;
  const imgRect = {
    x: padX,
    y: padTop,
    w: 1 - padX * 2,
    h: 1 - padTop - padBot,
  };
  const dstAR = canvasAR * (imgRect.w / Math.max(0.01, imgRect.h));
  const win = getPlateWindow(state, dstAR);
  const { viewW, viewH, u0, v0 } = win;
  const coveragePct = Math.round(imgRect.w * imgRect.h * 100);
  // 未裁过 1.07x 或底片视窗仍碰触左右杂物带（u <= 0.112 / u >= 0.888）均检出边缘杂物
  const clutterVisible = z < 1.07 || u0 < 0.112 || u0 + viewW > 0.888;
  const isOverCropped = z > 1.56;

  // 主焦点在画布中的实时坐标（与 drawCroppedPlate 完全同源）
  const sc = SCENES[state.scene] || SCENES.valley;
  const focalInImgU = (sc.focal.u - u0) / viewW;
  const focalInImgV = (sc.focal.v - v0) / viewH;
  const focalX = imgRect.x + imgRect.w * focalInImgU;
  const focalY = imgRect.y + imgRect.h * focalInImgV;
  const focalClipped =
    focalInImgU < 0.08 || focalInImgU > 0.92 || focalInImgV < 0.10 || focalInImgV > 0.90;

  return {
    z,
    win,
    isFullBleed,
    bleedFrac,
    imgRect,
    coveragePct,
    clutterVisible,
    isOverCropped,
    focalX,
    focalY,
    focalInImgU,
    focalInImgV,
    focalClipped,
  };
}

// 统一计算文字覆盖区（归一化到画布 0..1）
export function getTextBox(state, isNarrow = false) {
  const dims =
    state.copyMode === "bullets"
      ? isNarrow
        ? { w: 0.72, h: 0.42 }
        : { w: 0.50, h: 0.42 }
      : state.copyMode === "concise"
      ? isNarrow
        ? { w: 0.54, h: 0.24 }
        : { w: 0.37, h: 0.25 }
      : isNarrow
      ? { w: 0.44, h: 0.16 }
      : { w: 0.27, h: 0.16 };

  const cx = clamp(state.textX, dims.w / 2 + 0.04, 1 - dims.w / 2 - 0.04);
  const cy = clamp(state.textY, dims.h / 2 + 0.08, 1 - dims.h / 2 - 0.06);
  return {
    x: cx - dims.w / 2,
    y: cy - dims.h / 2,
    w: dims.w,
    h: dims.h,
    cx,
    cy,
  };
}

// 给定画布上的归一化点 (sx, sy)，反推对应底片 UV（若落在白边框内则返回 null）
export function slideToPlateUV(sx, sy, geom) {
  const { imgRect, win } = geom;
  if (
    sx < imgRect.x ||
    sx > imgRect.x + imgRect.w ||
    sy < imgRect.y ||
    sy > imgRect.y + imgRect.h
  ) {
    return null; // 在模板白边上
  }
  const iu = (sx - imgRect.x) / imgRect.w;
  const iv = (sy - imgRect.y) / imgRect.h;
  const mu = clamp(win.u0 + iu * win.viewW, 0.002, 0.998);
  const mv = clamp(win.v0 + iv * win.viewH, 0.002, 0.998);
  return { u: mu, v: mv };
}

// 叠加遮罩色并输出像素实际色彩
function applyScrimRGB(r, g, b, scrim, sx, sy, textBox) {
  if (scrim === "none") return [r, g, b];
  if (scrim === "glass") {
    // 原海报半透明午夜蓝磨砂卡 rgba(1, 12, 29, 0.72)
    const a = 0.72;
    return [r * (1 - a) + 1 * a, g * (1 - a) + 12 * a, b * (1 - a) + 29 * a];
  }
  if (scrim === "gradient") {
    // 跟随文字盒所在侧的平滑暗角渐变 rgba(1, 10, 25, 0.78 -> 0)
    const onRight = textBox.cx > 0.56;
    const onBottom = textBox.cy > 0.60;
    let factor = 0;
    if (onBottom) {
      factor = clamp((sy - 0.34) / 0.55, 0, 1);
    } else if (onRight) {
      factor = clamp((sx - 0.36) / 0.56, 0, 1);
    } else {
      factor = clamp((0.64 - sx) / 0.56, 0, 1);
    }
    const a = 0.76 * factor;
    return [r * (1 - a) + 1 * a, g * (1 - a) + 10 * a, b * (1 - a) + 25 * a];
  }
  if (scrim === "heavy") {
    // 全屏 80% 死黑幕
    const a = 0.80;
    return [r * (1 - a) + 0 * a, g * (1 - a) + 4 * a, b * (1 - a) + 10 * a];
  }
  return [r, g, b];
}

// 核心单真源评测：接收真实像素采样函数 samplePlateRGB(u, v) => [r, g, b]
export function evaluateSlide(state, samplePlateRGB, isNarrow = false, canvasAR = PLATE_AR) {
  const sc = SCENES[state.scene] || SCENES.valley;
  const geom = getFrameGeometry(state, canvasAR);
  const textBox = getTextBox(state, isNarrow);

  // 1. 真实 7×5 网格采样文字区下方像素亮度
  const textLum = relLuminance(248, 251, 255); // 覆盖白字 #F8FBFF
  const ratios = [];
  let sumLum = 0;
  const cols = 7;
  const rows = 5;
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const sx = textBox.x + textBox.w * ((ix + 0.5) / cols);
      const sy = textBox.y + textBox.h * ((iy + 0.5) / rows);
      const uv = slideToPlateUV(sx, sy, geom, state);
      let rgb;
      if (!uv) {
        rgb = [235, 240, 246]; // 模板白边极亮底
      } else {
        rgb = samplePlateRGB(uv.u, uv.v);
      }
      const [er, eg, eb] = applyScrimRGB(rgb[0], rgb[1], rgb[2], state.scrim, sx, sy, textBox);
      const L = relLuminance(er, eg, eb);
      sumLum += L;
      ratios.push(contrastRatio(textLum, L));
    }
  }
  ratios.sort((a, b) => a - b);
  // 取第 15 百分位（最棘手的亮斑区），避免单像素噪点，同时真实反映亮斑吞字
  const contrastWorst = ratios[Math.floor(ratios.length * 0.15)] ?? ratios[0];
  const contrastAvg = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  const requiredWCAG = state.copyMode === "minimal" ? 3.0 : 4.5;
  const contrastOk = contrastWorst >= requiredWCAG;
  const avgBgLum = sumLum / ratios.length;

  // 2. 检查文字盒是否直接压住画面主焦点
  const focalMargin = 0.035;
  const textHitsFocal =
    geom.focalX >= textBox.x - focalMargin &&
    geom.focalX <= textBox.x + textBox.w + focalMargin &&
    geom.focalY >= textBox.y - focalMargin &&
    geom.focalY <= textBox.y + textBox.h + focalMargin;

  // 3. 四条原海报支柱逐项判定
  const fullbleedOk = geom.isFullBleed && !geom.clutterVisible && !geom.isOverCropped;
  const overlayOk = state.copyMode !== "bullets" && contrastOk;
  const focalOk = !geom.focalClipped && !textHitsFocal && state.lighting === "guided";
  const immersionOk =
    geom.isFullBleed &&
    state.scrim !== "heavy" &&
    state.copyMode !== "bullets" &&
    state.lighting !== "washed";

  const score = [fullbleedOk, overlayOk, focalOk, immersionOk].filter(Boolean).length;

  // 4. 检出具体错态（按严重度排序，双向报错）
  const faults = [];
  if (!geom.isFullBleed) {
    faults.push({
      id: "boxed",
      pillar: "fullbleed",
      tag: `缩框 ${geom.coveragePct}%`,
      title: `主图还缩在企业白框里（仅占 ${geom.coveragePct}% 画面）`,
      body: "四周的模板白边与页眉把银幕生生切碎，观众先看到「这是一页 PPT」，而不是进入画面里的世界。全图页的第一步是把图推到四边出血。",
      next: "把下方「满幅裁切」向右拉过 108%（或直接点画面右上角「裁切」引注），扯破白边并裁掉边缘杂物。",
    });
  } else if (geom.clutterVisible) {
    faults.push({
      id: "clutter",
      pillar: "fullbleed",
      tag: "边角杂物",
      title: "虽然撑满边了，但画面边角还留着干扰杂物",
      body: "刚贴边（100%–106%）时，原始画面边缘的电线杆、警示墩或标识牌仍露在画框里，会默默把观众的视线往边角拽。",
      next: "把「满幅裁切」继续放大到 112%–135%，像原海报说的那样「大胆裁切画面，去除干扰元素」。",
    });
  } else if (geom.isOverCropped) {
    faults.push({
      id: "overcrop",
      pillar: "fullbleed",
      tag: `裁过头 ${Math.round(geom.z * 100)}%`,
      title: `裁切拉到 ${Math.round(geom.z * 100)}%，主景被切残且投影发虚`,
      body: "大胆裁切不是无限放大。超过 155% 后，地貌纵深和引导线被切得支离破碎，像素放大上大屏也会出现肉眼可见的发虚感。",
      next: "把「满幅裁切」回收到 112%–140% 区间，既去净边角杂物，又保住呼吸感与景深。",
    });
  }

  if (state.copyMode === "bullets") {
    faults.push({
      id: "bullets",
      pillar: "overlay",
      tag: `密字 ${sc.copy.bullets.chars} 字`,
      title: `图上压了 ${sc.copy.bullets.chars} 字项目符号，全图页退化成读稿文档`,
      body: "观众一翻页就埋头逐行扫字，既看不了图，也听不见你说话。全图页的字只负责立锚点，详细论述交给讲者口述。",
      next: "把「覆盖文字」切到「精炼主副标（18字）」或「极简大标（5字）」。",
    });
  }

  if (!contrastOk) {
    faults.push({
      id: "contrast",
      pillar: "overlay",
      tag: `对比 ${contrastWorst.toFixed(1)}:1`,
      title: `白字裸压在亮区上，实测对比度仅 ${contrastWorst.toFixed(1)}:1`,
      body: `实时测光显示文字盒下方存在高亮像素（需 ≥ ${requiredWCAG.toFixed(1)}:1，WCAG 2.1 AA 标准）。坐后排的听众几乎读不出字形轮廓。`,
      next: "把文字盒直接拖到画面左侧深暗处，或把「半透明遮罩」切到「半透明磨砂块 / 侧向渐变」。",
    });
  }

  if (state.scrim === "heavy") {
    faults.push({
      id: "heavyveil",
      pillar: "immersion",
      tag: "死黑厚幕",
      title: "80% 全屏黑幕虽然让字看清了，却把整张图的情绪糊死了",
      body: "这是全图页最常见的过度修正：怕字看不清就把整张照片刷成黑板。对比度飙上去了，可图片最值钱的光彩、层次与氛围全没了。",
      next: "把「半透明遮罩」换成局部「磨砂块」或「侧向渐变」，只托住文字背后，把其余画面还给照片。",
    });
  }

  if (geom.focalClipped) {
    faults.push({
      id: "focalClipped",
      pillar: "focal",
      tag: "焦点出画",
      title: `画面主角（${sc.focal.name}）被拖到了画框边缘之外`,
      body: "移景过度把原本承托故事的视觉中心推出了银幕，剩下的大面积只剩空背景，观众找不到眼睛该停在哪里。",
      next: "直接在画布上左右拖动画面，把主体拉回画面右半或左半三分之一处。",
    });
  } else if (textHitsFocal) {
    faults.push({
      id: "textHitsFocal",
      pillar: "focal",
      tag: "文字压焦",
      title: `覆盖文字正好压在「${sc.focal.name}」正上方`,
      body: "主图焦点和标题都是视觉重量最重的部分，叠在一起等于让主角和标题在台上打架，画面失去呼吸与引导流向。",
      next: "直接拖动画布上的文字卡移到安静暗部（或横向拖动底图把焦点错开到另一侧）。",
    });
  }

  if (state.lighting === "flat") {
    faults.push({
      id: "flatlight",
      pillar: "focal",
      tag: "明暗平淡",
      title: "画面明暗对比偏平，主焦点跳不出来",
      body: "没有明暗聚光与冷暖反差，前景、山体与天空抢成一片，眼睛进画后四处游移，难以在 1.5 秒内锁定视觉落点。",
      next: "把「焦点光影」切到「明暗聚焦」，压沉暗角、点亮引导线与主焦点。",
    });
  } else if (state.lighting === "washed") {
    faults.push({
      id: "washed",
      pillar: "immersion",
      tag: "过曝发灰",
      title: "画面整体过曝泛白，既损氛围又毁字底对比",
      body: "在暗场会议室里，发灰过曝的全图页像一块刺眼的白灯箱，层次和情绪迅速流失，白色覆盖字也失去落脚处。",
      next: "把「焦点光影」调回「明暗聚焦」，恢复深沉暗部与层次。",
    });
  }

  // 总结语（4/4 时区分不同合法解）
  let headline, explanation, nextStep, chipLabel;
  if (score === 4) {
    const modeLabel =
      state.scrim === "none"
        ? "天然暗区零遮罩成立"
        : state.scrim === "gradient"
        ? "侧向暗角渐变成立"
        : state.copyMode === "minimal"
        ? "极简情绪大标成立"
        : "原海报半透明磨砂解成立";
    chipLabel = `4/4 · 满幅沉浸`;
    headline = `${modeLabel}（实测对比度 ${contrastWorst.toFixed(1)}:1）`;
    explanation =
      state.scrim === "none"
        ? `你没有盖任何人工色块，而是借构图把精简标题稳稳放进底图天然暗区，实测最亮底像素对比度仍达 ${contrastWorst.toFixed(1)}:1；${sc.focal.name}畅通无阻，整幅画面一秒建立情绪。`
        : `四边零白框满幅出画，裁切在 ${Math.round(geom.z * 100)}% 恰好去净边角杂物；覆盖文字与${sc.focal.name}一左一右错落呼应，实测最弱对比度 ${contrastWorst.toFixed(1)}:1，既清晰又不伤画面氛围。`;
    nextStep = "按 Space（或点「影院翻页」）体验从传统项目符号页切入这一页的 1.5 秒现场震撼，也可以试试「反向试错」观察翻车边界。";
  } else {
    const top = faults[0];
    chipLabel = `${score}/4 · ${top.tag}`;
    headline = top.title;
    explanation = top.body;
    nextStep = top.next;
  }

  return {
    score,
    chipLabel,
    headline,
    explanation,
    nextStep,
    faults,
    geom,
    textBox,
    contrastWorst,
    contrastAvg,
    requiredWCAG,
    contrastOk,
    avgBgLum,
    textHitsFocal,
    pillars: {
      fullbleed: {
        ok: fullbleedOk,
        status: !geom.isFullBleed
          ? `缩框 ${geom.coveragePct}%`
          : geom.clutterVisible
          ? "残留杂物"
          : geom.isOverCropped
          ? `裁过头 ${Math.round(geom.z * 100)}%`
          : `满幅 ${Math.round(geom.z * 100)}%`,
      },
      overlay: {
        ok: overlayOk,
        status:
          state.copyMode === "bullets"
            ? `密字 ${sc.copy.bullets.chars} 字`
            : !contrastOk
            ? `${contrastWorst.toFixed(1)}:1 失读`
            : `${contrastWorst.toFixed(1)}:1 清晰`,
      },
      focal: {
        ok: focalOk,
        status: geom.focalClipped
          ? "焦点出画"
          : textHitsFocal
          ? "文字压焦"
          : state.lighting !== "guided"
          ? state.lighting === "flat"
            ? "光影平淡"
            : "过曝发灰"
          : "聚焦清晰",
      },
      immersion: {
        ok: immersionOk,
        status:
          state.scrim === "heavy"
            ? "死黑压死"
            : !geom.isFullBleed
            ? "白边破功"
            : state.lighting === "washed"
            ? "泛白失韵"
            : state.copyMode === "bullets"
            ? "文档既视"
            : "沉浸完整",
      },
    },
    callouts: {
      crop: {
        ok: fullbleedOk,
        label: "裁切",
        en: "CROP",
        status: !geom.isFullBleed
          ? `未满幅 ${geom.coveragePct}%`
          : geom.clutterVisible
          ? "边缘有杂物"
          : geom.isOverCropped
          ? `过度 ${Math.round(geom.z * 100)}%`
          : `满幅 ${Math.round(geom.z * 100)}%`,
      },
      focal: {
        ok: focalOk,
        label: "焦点",
        en: "FOCAL AREA",
        status: geom.focalClipped
          ? "偏出画框"
          : textHitsFocal
          ? "被文字挡住"
          : state.lighting !== "guided"
          ? "层次偏弱"
          : "流向明确",
      },
      overlay: {
        ok: overlayOk && state.scrim !== "heavy",
        label: "覆盖文字",
        en: "OVERLAY",
        status:
          state.scrim === "heavy"
            ? "黑幕太重"
            : state.copyMode === "bullets"
            ? "字墙过载"
            : !contrastOk
            ? `对比 ${contrastWorst.toFixed(1)}:1`
            : `WCAG ${contrastWorst.toFixed(1)}:1`,
      },
    },
  };
}
