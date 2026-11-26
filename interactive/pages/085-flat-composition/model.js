// 085 平面化构图 · 单真源几何投影与构图评估模型
// 渲染器、压画台诊断条、四枚原则圆徽和实测数值全部从此模块实时读取，无写死读数。

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// WCAG 相对亮度与对比度计算（用于真实核算色面边界是否融死）
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const l1 = luminance(hexA);
  const l2 = luminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 三个题材的色彩系统（均衍生自 085 原海报基因）
export const SCENES = {
  mediterranean: {
    id: "mediterranean",
    label: "原海报 · 地中海",
    subtitle: "蓝天红台 · 双屋黑瓶",
    names: {
      sky: "克莱因蓝天",
      table: "朱红台面",
      houseL: "左奶白小屋",
      houseR: "右拱门小屋",
      arch: "纯黑拱门",
      vase: "炭黑花瓶",
      bowl: "奶白蓝口碗",
      plant: "朱红七叶枝",
      decor: "黑白棋盘格",
    },
    palettes: {
      flat: {
        sky: "#0042AF",
        table: "#F13C1A",
        house: "#FCF2DA",
        roof: "#080808",
        roofAccent: "#F13C1A",
        arch: "#080808",
        vase: "#080808",
        bowl: "#FFF2DB",
        bowlRim: "#0042AF",
        plant: "#F13C1A",
        decorA: "#080808",
        decorB: "#FCF2DA",
        sideWall: "#D7CCB4",
      },
      triad: {
        sky: "#0042AF",
        table: "#FDCE21",
        house: "#FCF2DA",
        roof: "#080808",
        roofAccent: "#0042AF",
        arch: "#080808",
        vase: "#080808",
        bowl: "#F13C1A",
        bowlRim: "#FCF2DA",
        plant: "#F13C1A",
        decorA: "#080808",
        decorB: "#FCF2DA",
        sideWall: "#DCD1BA",
      },
      muted: {
        sky: "#5B6D82",
        table: "#8C6F5A",
        house: "#C8C1B4",
        roof: "#4A4844",
        roofAccent: "#8B5E4E",
        arch: "#3B3A38",
        vase: "#46433F",
        bowl: "#BDB6A7",
        bowlRim: "#6C7D8D",
        plant: "#7D5A4C",
        decorA: "#4E4B47",
        decorB: "#B5AEA0",
        sideWall: "#9F988C",
      },
      pastel: {
        sky: "#B8C4D4",
        table: "#D4B6AE",
        house: "#DDD8CE",
        roof: "#B4AFA6",
        roofAccent: "#CCACA4",
        arch: "#B2AEA8",
        vase: "#B6B2AC",
        bowl: "#D8D3C9",
        bowlRim: "#B9C5D4",
        plant: "#CEAEA6",
        decorA: "#B8B4AE",
        decorB: "#D6D1C8",
        sideWall: "#C8C3B9",
      },
    },
  },
  matisse: {
    id: "matisse",
    label: "马蒂斯 · 红室",
    subtitle: "红壁融界 · 窗景黑壶",
    names: {
      sky: "威尼斯红壁",
      table: "通铺红案",
      houseL: "左侧蓝窗景",
      houseR: "右墙画框",
      arch: "画内深黑影",
      vase: "炭黑长颈壶",
      bowl: "奶白瓷果盘",
      plant: "克莱因蓝枝",
      decor: "黑白织垫带",
    },
    palettes: {
      flat: {
        sky: "#D92B1C",
        table: "#B92013",
        house: "#FCF2DA",
        roof: "#0042AF",
        roofAccent: "#FDCE21",
        arch: "#080808",
        vase: "#080808",
        bowl: "#FCF2DA",
        bowlRim: "#FDCE21",
        plant: "#0042AF",
        decorA: "#080808",
        decorB: "#FDCE21",
        sideWall: "#A82419",
      },
      triad: {
        sky: "#F13C1A",
        table: "#FDCE21",
        house: "#FCF2DA",
        roof: "#0042AF",
        roofAccent: "#080808",
        arch: "#080808",
        vase: "#080808",
        bowl: "#0042AF",
        bowlRim: "#FCF2DA",
        plant: "#FCF2DA",
        decorA: "#080808",
        decorB: "#FCF2DA",
        sideWall: "#CC3117",
      },
      muted: {
        sky: "#8E5750",
        table: "#7A4C46",
        house: "#C4BCB0",
        roof: "#58687B",
        roofAccent: "#9E8D5E",
        arch: "#3E3B39",
        vase: "#44403D",
        bowl: "#BEB7AB",
        bowlRim: "#8E815B",
        plant: "#5A6B7D",
        decorA: "#4E4B47",
        decorB: "#B7AF9C",
        sideWall: "#724742",
      },
      pastel: {
        sky: "#D5B1AC",
        table: "#C9A8A3",
        house: "#DDD7CE",
        roof: "#B6C1D0",
        roofAccent: "#DCD2B1",
        arch: "#B2AEA8",
        vase: "#B7B2AC",
        bowl: "#DAD4CA",
        bowlRim: "#DDD4B7",
        plant: "#B5C0CE",
        decorA: "#B8B4AE",
        decorB: "#DCD4BA",
        sideWall: "#C1A39E",
      },
    },
  },
  ukiyoe: {
    id: "ukiyoe",
    label: "浮世绘 · 波桥",
    subtitle: "高视平海 · 朱桥黑松",
    names: {
      sky: "高视海天",
      table: "朱红岸带",
      houseL: "雪峰剪影",
      houseR: "海岸白亭",
      arch: "深黑亭影",
      vase: "炭黑古松",
      bowl: "奶白小舟",
      plant: "朱红枫枝",
      decor: "黑白浪格带",
    },
    palettes: {
      flat: {
        sky: "#0042AF",
        table: "#F13C1A",
        house: "#FCF2DA",
        roof: "#080808",
        roofAccent: "#FDCE21",
        arch: "#080808",
        vase: "#080808",
        bowl: "#FCF2DA",
        bowlRim: "#0042AF",
        plant: "#FDCE21",
        decorA: "#080808",
        decorB: "#FCF2DA",
        sideWall: "#CBD3DE",
      },
      triad: {
        sky: "#FCF2DA",
        table: "#0042AF",
        house: "#FDCE21",
        roof: "#080808",
        roofAccent: "#F13C1A",
        arch: "#080808",
        vase: "#080808",
        bowl: "#F13C1A",
        bowlRim: "#FCF2DA",
        plant: "#F13C1A",
        decorA: "#080808",
        decorB: "#FDCE21",
        sideWall: "#D7CCA7",
      },
      muted: {
        sky: "#5A6D80",
        table: "#8B5F52",
        house: "#C7C0B3",
        roof: "#4A4845",
        roofAccent: "#9D8B5B",
        arch: "#3B3937",
        vase: "#45423F",
        bowl: "#BDB6A9",
        bowlRim: "#697B8D",
        plant: "#9D8B5B",
        decorA: "#4E4B47",
        decorB: "#B9B2A5",
        sideWall: "#9EA5AE",
      },
      pastel: {
        sky: "#B8C4D4",
        table: "#D3B4AC",
        house: "#DDD8CF",
        roof: "#B3AEA6",
        roofAccent: "#DCD3B4",
        arch: "#B2AEA8",
        vase: "#B6B2AC",
        bowl: "#D8D3C9",
        bowlRim: "#BAC6D4",
        plant: "#DDD4B8",
        decorA: "#B8B4AE",
        decorB: "#D6D1C8",
        sideWall: "#C7CCD4",
      },
    },
  },
};

// 开场刻意停在 0/4 坏态：强透视未压平 + 立体明暗长投影 + 繁琐细节 + 灰浊杂色 + 器物未跨界重叠 + 无装饰节奏
export function createInitialState() {
  return {
    scene: "mediterranean",
    flatten: 0.22, // 0 = 强一点透视立体, 1 = 彻底正交平面
    shading: 0, // 0 = 写实明暗+投影, 1 = 半平涂残影, 2 = 纯色平涂
    simplify: 0, // 0 = 繁琐写实细节, 1 = 折中简化, 2 = 极简剪影
    colorMode: "muted", // 'muted' | 'flat' | 'triad' | 'pastel'
    decor: "none", // 'none' | 'rhythm' | 'chaos'
    vaseX: 0.48, // 落于两屋空隙中，未跨界左屋也未撞右门
    bowlX: 0.24, // 远离花瓶且未跨台沿
    plantX: 0.56,
    showGuides: true,
    activeProp: null, // 'vase' | 'bowl' | 'plant' | null
  };
}

// 多组合法解与主动试错预设（全部经由同一 evaluate() 核验）
export const PRESETS = {
  poster: {
    label: "原海报经典解",
    kind: "good",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "flat",
      decor: "rhythm",
      vaseX: 0.21,
      bowlX: 0.405,
      plantX: 0.54,
    },
  },
  triad: {
    label: "三色高对比解",
    kind: "good",
    patch: {
      flatten: 0.96,
      shading: 2,
      simplify: 2,
      colorMode: "triad",
      decor: "rhythm",
      vaseX: 0.65,
      bowlX: 0.24,
      plantX: 0.46,
    },
  },
  cluster: {
    label: "左重叠压解",
    kind: "good",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "flat",
      decor: "rhythm",
      vaseX: 0.175,
      bowlX: 0.315,
      plantX: 0.52,
    },
  },
  errMerge: {
    label: "试错：同色融死",
    kind: "bad",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "flat",
      decor: "rhythm",
      vaseX: 0.785, // 直接撞进右屋炭黑拱门
      bowlX: 0.40,
      plantX: 0.54,
    },
  },
  errSticker: {
    label: "试错：贴纸平铺",
    kind: "bad",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "flat",
      decor: "rhythm",
      vaseX: 0.535, // 彻底孤立于两屋之间空隙，既不跨界也不碰切线
      bowlX: 0.165, // 独立在左红台不叠花瓶
      plantX: 0.625, // 孤立不叠压
    },
  },
  errPastel: {
    label: "试错：灰糊失廓",
    kind: "bad",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "pastel",
      decor: "rhythm",
      vaseX: 0.21,
      bowlX: 0.405,
      plantX: 0.54,
    },
  },
  errChaos: {
    label: "试错：花纹失序",
    kind: "bad",
    patch: {
      flatten: 1,
      shading: 2,
      simplify: 2,
      colorMode: "flat",
      decor: "chaos",
      vaseX: 0.21,
      bowlX: 0.405,
      plantX: 0.54,
    },
  },
  reset: {
    label: "复原开场坏态",
    kind: "reset",
    patch: {
      flatten: 0.22,
      shading: 0,
      simplify: 0,
      colorMode: "muted",
      decor: "none",
      vaseX: 0.48,
      bowlX: 0.24,
      plantX: 0.56,
    },
  },
};

function rectOverlapArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}

// 计算归一化几何体（坐标 0..1），渲染与评估 100% 共用
export function computeGeometry(state) {
  const persp = 1 - clamp(state.flatten, 0, 1); // 1 = 强立体, 0 = 纯平面
  const horizonY = lerp(0.69, 0.55, persp);
  const tableTopY = horizonY;
  const tableInsetTop = 0.145 * persp; // 透视收束使桌面顶部收窄成梯形
  const tableAngleDeg = +(Math.atan2(tableInsetTop, 1 - tableTopY) * (180 / Math.PI)).toFixed(1);

  // 左屋与立体侧墙
  const houseL = {
    x: lerp(0.032, 0.085, persp),
    y: lerp(0.325, 0.365, persp),
    w: lerp(0.362, 0.275, persp),
    h: 0,
    sideW: 0.068 * persp,
    roofH: lerp(0.115, 0.095, persp),
  };
  houseL.h = tableTopY - houseL.y;

  // 右拱门屋与立体侧墙
  const houseR = {
    x: lerp(0.678, 0.695, persp),
    y: lerp(0.165, 0.24, persp),
    w: lerp(0.288, 0.23, persp),
    h: 0,
    sideW: 0.062 * persp,
  };
  houseR.h = tableTopY - houseR.y;

  // 右屋纯黑拱门
  const archW = houseR.w * 0.315;
  const archH = houseR.h * 0.57;
  const archDoor = {
    x: houseR.x + houseR.w * 0.21,
    y: tableTopY - archH,
    w: archW,
    h: archH,
  };

  // 炭黑花瓶（可拖）
  const vaseW = lerp(0.168, 0.142, persp);
  const vaseH = lerp(0.575, 0.45, persp);
  const vaseCx = clamp(state.vaseX, 0.09, 0.91);
  // 开场在未压平时稍微缩回桌内；压平后按原海报底部齐底缘
  const vaseBottom = lerp(0.995, 0.90, persp);
  const vase = {
    cx: vaseCx,
    x: vaseCx - vaseW / 2,
    y: vaseBottom - vaseH,
    w: vaseW,
    h: vaseH,
    bottom: vaseBottom,
  };

  // 奶白蓝口大碗（可拖）
  const bowlW = lerp(0.195, 0.165, persp);
  const bowlH = lerp(0.215, 0.175, persp);
  const bowlCx = clamp(state.bowlX, 0.11, 0.89);
  const bowlBottom = lerp(0.978, 0.86, persp);
  const bowl = {
    cx: bowlCx,
    x: bowlCx - bowlW / 2,
    y: bowlBottom - bowlH,
    w: bowlW,
    h: bowlH,
    bottom: bowlBottom,
  };

  // 朱红七叶枝（可拖）
  const plantW = lerp(0.155, 0.132, persp);
  const plantH = lerp(0.65, 0.49, persp);
  const plantCx = clamp(state.plantX, 0.09, 0.91);
  const plant = {
    cx: plantCx,
    x: plantCx - plantW / 2,
    y: tableTopY - plantH,
    w: plantW,
    h: plantH,
    bottom: tableTopY,
  };

  // 右下棋盘格带
  const checker = {
    x: lerp(0.585, 0.56, persp),
    y: lerp(0.822, 0.81, persp),
    w: lerp(0.415, 0.36, persp),
    h: lerp(0.178, 0.15, persp),
  };

  return {
    persp,
    horizonY,
    tableTopY,
    tableInsetTop,
    tableAngleDeg,
    vanishingPoint: { x: 0.5, y: horizonY - 0.13 * persp },
    houseL,
    houseR,
    archDoor,
    vase,
    bowl,
    plant,
    checker,
  };
}

// 单真源全面评估：输出 4 项原则、实测几何指标、主错态白话诊断与修复动作
export function evaluate(state) {
  const scene = SCENES[state.scene] || SCENES.mediterranean;
  const pal = scene.palettes[state.colorMode] || scene.palettes.flat;
  const g = computeGeometry(state);

  // 1. 透视与平面呈现
  const flattenPct = Math.round(clamp(state.flatten, 0, 1) * 100);
  const perspFlatOk = state.flatten >= 0.85;
  const shadingFlatOk = state.shading === 2;
  const planeOk = perspFlatOk && shadingFlatOk;

  // 2. 跨界重叠与空间压缩（核心：拒绝“零重叠贴纸平铺”，也拒绝“互相叠死”）
  const vaseOnHouseL = rectOverlapArea(g.vase, g.houseL) / (g.vase.w * g.vase.h);
  const vaseOnHouseR = rectOverlapArea(g.vase, g.houseR) / (g.vase.w * g.vase.h);
  const vaseOnTable = g.vase.y < g.tableTopY - 0.04 && g.vase.bottom > g.tableTopY + 0.08;
  const vaseOverlapsArch = rectOverlapArea(g.vase, g.archDoor) / Math.min(g.vase.w * g.vase.h, g.archDoor.w * g.archDoor.h);
  const vaseBowlOverlap = rectOverlapArea(g.vase, g.bowl) / Math.min(g.vase.w * g.vase.h, g.bowl.w * g.bowl.h);
  const plantOnHouseL = rectOverlapArea(g.plant, g.houseL) / (g.plant.w * g.plant.h);
  const plantOnHouseR = rectOverlapArea(g.plant, g.houseR) / (g.plant.w * g.plant.h);
  const bowlNearVase = Math.abs(g.bowl.cx - g.vase.cx) < (g.bowl.w + g.vase.w) * 0.62;
  const bowlOnChecker = state.decor === "rhythm" ? rectOverlapArea(g.bowl, g.checker) / (g.bowl.w * g.bowl.h) : 0;

  // 有效跨界重叠计数：花瓶跨建筑立面（形成中景-前景叠压）、花瓶跨天/台界线、红叶/碗产生空间层次咬合
  const archMerge = vaseOverlapsArch >= 0.14; // 黑瓶压黑拱门
  const vaseCrossHouse = (vaseOnHouseL >= 0.12) || (vaseOnHouseR >= 0.12 && !archMerge);
  const plantCross = plantOnHouseL >= 0.06 || plantOnHouseR >= 0.06 || Math.abs(g.plant.cx - g.houseL.x - g.houseL.w) < 0.18;
  const bowlGrouped = (vaseBowlOverlap > 0.01 && vaseBowlOverlap < 0.36) || bowlNearVase || bowlOnChecker > 0.08;

  // 切线粘连检测（黑花瓶左右边线与小屋立面边线几乎重合 < 0.014）
  const houseLEdgeDist = Math.min(
    Math.abs(g.vase.x - (g.houseL.x + g.houseL.w)),
    Math.abs(g.vase.x + g.vase.w - (g.houseL.x + g.houseL.w)),
    Math.abs(g.vase.x + g.vase.w - g.houseR.x)
  );
  const tangentTrap = houseLEdgeDist < 0.013 && !vaseCrossHouse;

  let overlapCount = 0;
  if (vaseCrossHouse) overlapCount += 1;
  if (vaseOnTable && vaseCrossHouse) overlapCount += 1;
  if (bowlGrouped && vaseBowlOverlap < 0.40) overlapCount += 1;
  if (plantCross && plantOnHouseL < 0.55 && plantOnHouseR < 0.55) overlapCount += 1;

  const fgClash = vaseBowlOverlap >= 0.42;
  const stickerFlat = !vaseCrossHouse && !bowlGrouped && overlapCount <= 1;
  const compressOk = overlapCount >= 2 && !fgClash && !tangentTrap;

  // 3. 清晰轮廓与色面对比（防止黑压黑融死、防止灰糊失廓、要求提炼简形）
  const vaseArchContrast = contrastRatio(pal.vase, pal.arch);
  const skyHouseContrast = contrastRatio(pal.sky, pal.house);
  const tableBowlContrast = contrastRatio(pal.table, pal.bowl);
  const vaseBgColor = vaseOnHouseL >= 0.12 || vaseOnHouseR >= 0.12 ? pal.house : pal.sky;
  const vaseContrast = archMerge ? vaseArchContrast : contrastRatio(pal.vase, vaseBgColor);
  const minEdgeContrast = +Math.min(skyHouseContrast, tableBowlContrast, vaseContrast).toFixed(2);

  const simplifyOk = state.simplify === 2;
  const contrastOk = minEdgeContrast >= 2.4 && state.colorMode !== "pastel" && state.colorMode !== "muted";
  const silhouetteOk = simplifyOk && !archMerge && !fgClash && contrastOk;

  // 4. 色彩大面积平涂与装饰秩序
  const colorFlatOk = state.colorMode === "flat" || state.colorMode === "triad";
  const decorOk = state.decor === "rhythm";
  const aestheticOk = colorFlatOk && decorOk;

  const passedCount = [planeOk, compressOk, silhouetteOk, aestheticOk].filter(Boolean).length;

  // 确定当前最优先的问题（按构图因果次序诊断）
  let issueKey = "pass";
  let badge = `${passedCount}/4 · 平面成立`;
  let headline = "二维秩序、纯色大面与清晰剪影全部站稳了";
  let body = "";
  let hint = "";
  let fixAction = null;

  if (archMerge) {
    const pct = Math.round(vaseOverlapsArch * 100);
    issueKey = "archMerge";
    badge = `${passedCount}/4 · 同色融死`;
    headline = `${scene.names.vase}压进了${scene.names.arch}（重叠 ${pct}%），轮廓直接融死`;
    body = `两者明度对比只有 ${vaseArchContrast.toFixed(2)}:1。平面化一旦去掉高光和反光，同色块叠在一起就没有边界，远看立刻糊成一块黑斑。`;
    hint = `把${scene.names.vase}向左拖回${scene.names.houseL}前，让纯黑轮廓压在奶白墙与朱红台面的交界上。`;
    fixAction = { label: `把${scene.names.vase}移到高对比白墙前`, patch: { vaseX: 0.21 } };
  } else if (!perspFlatOk) {
    issueKey = "persp";
    badge = `${passedCount}/4 · 桌倾 ${g.tableAngleDeg}°`;
    headline = `空间压平度只有 ${flattenPct}%，桌面还留着 ${g.tableAngleDeg}° 透视斜角`;
    body = "画面里的消失点透视线和小屋侧墙一直在把眼睛往深处拉，平面化的整体二维感根本立不起来。";
    hint = "直接在画布空白处向右拖动，把透视斜桌与立体侧墙压平到 85% 以上。";
    fixAction = { label: "一键压平至正交平面", patch: { flatten: 1, shading: 2, simplify: 2, colorMode: "flat", decor: "rhythm", vaseX: 0.21, bowlX: 0.405, plantX: 0.54 } };
  } else if (!shadingFlatOk) {
    issueKey = "shading";
    badge = `${passedCount}/4 · 残留投影`;
    headline = state.shading === 0 ? "立体高光与地面长投影还没剥离，画面夹生半立体" : "还留着一层半透明灰影，纯色块不够干脆";
    body = "透视虽然收平了，但花瓶球面高光和桌面投影还在暗示三维打光，二维纯色面的张力被折了一半。";
    hint = "在「如何实现平面化」第 1/2 格把光影剥离切到「纯色平涂」。";
    fixAction = { label: "彻底剥离光影为纯平", patch: { shading: 2 } };
  } else if (state.colorMode === "pastel" || state.colorMode === "muted") {
    issueKey = "contrast";
    badge = `${passedCount}/4 · 边界灰糊`;
    headline = state.colorMode === "pastel"
      ? `相邻色面最小对比度跌到 ${minEdgeContrast}:1，轮廓几乎隐身`
      : "色彩还停在写实灰浊调里，没拉开纯色平涂的大面关系";
    body = "原海报提过「纯色或低对比配色」，但低对比绝不等于把明度全拉平——去掉阴影后，形状全靠相邻色块的明度差和色相差互相托住。";
    hint = "切回「高对比纯色」或「三色极简」，立刻把蓝、红、白、黑的边界立起来。";
    fixAction = { label: "切回高对比纯色平涂", patch: { colorMode: "flat" } };
  } else if (!simplifyOk) {
    issueKey = "simplify";
    badge = `${passedCount}/4 · 细节过碎`;
    headline = "窗格、陶纹和叶脉细节太碎，剪影不够利落";
    body = "写实纹理会拖慢视线识别。把物体提炼成最本质的几何轮廓后，哪怕缩小到手机图标大小也能一眼认出。";
    hint = "把「简化形状」切到「极简几何剪影」。";
    fixAction = { label: "提炼极简几何剪影", patch: { simplify: 2 } };
  } else if (fgClash) {
    const pct = Math.round(vaseBowlOverlap * 100);
    issueKey = "fgClash";
    badge = `${passedCount}/4 · 器物叠死`;
    headline = `${scene.names.vase}与${scene.names.bowl}互挡达 ${pct}%，主体轮廓撞碎了`;
    body = "二维平面里需要「适度重叠」来分出前后，但重叠超过四成就会吃掉另一件器物的特征外轮廓。";
    hint = `把${scene.names.bowl}向旁边拖开半个身位，保留清晰独立轮廓。`;
    fixAction = { label: "拉开两件器物间距", patch: { vaseX: 0.21, bowlX: 0.405 } };
  } else if (tangentTrap) {
    issueKey = "tangent";
    badge = `${passedCount}/4 · 切线粘连`;
    headline = `${scene.names.vase}边缘刚好贴死小屋墙边，前后层粘住了`;
    body = "两个不同层级的轮廓刚好相切在同一条垂直线上，人眼分不清花瓶究竟在屋前还是和墙长在一起，这叫「切线雷区」。";
    hint = `把${scene.names.vase}果断向左推入白墙内，形成明确跨界遮挡。`;
    fixAction = { label: "推入白墙形成明确遮挡", patch: { vaseX: 0.21 } };
  } else if (stickerFlat || !compressOk) {
    issueKey = "sticker";
    badge = `${passedCount}/4 · 贴纸平铺`;
    headline = "所有元素各站各的互不跨界，退化成了呆板的「贴纸平铺」";
    body = "正如原海报底沿所说：平面化不是简单的平铺。去掉透视后，必须靠器物主动压过背景立面与台面交界，才能压缩出紧凑的前后层序。";
    hint = `按住${scene.names.vase}向左拖，让它跨骑在${scene.names.houseL}与${scene.names.table}的交界上。`;
    fixAction = { label: "建立跨界重叠层序", patch: { vaseX: 0.21, bowlX: 0.405, plantX: 0.54 } };
  } else if (state.decor === "chaos") {
    issueKey = "chaos";
    badge = `${passedCount}/4 · 花纹喧宾`;
    headline = "满屏碎花纹把大面积纯色底切碎了，整体感塌陷";
    body = "装饰美感靠的是局部重复与节奏（比如右下黑白棋盘格），铺满全图只会让主剪影淹没在噪点里。";
    hint = "把「排列与节奏」收回到「局部棋盘节奏」，留出大片纯色呼吸场。";
    fixAction = { label: "收敛为局部棋盘节奏", patch: { decor: "rhythm" } };
  } else if (state.decor === "none") {
    issueKey = "noDecor";
    badge = `${passedCount}/4 · 缺少节奏`;
    headline = "右下大块纯红空荡荡，缺少重复元素的秩序韵律";
    body = "纯色平涂需要一点紧凑的几何节奏去压秤——原海报在右下角放了一块 2×6 黑白棋盘格，瞬间平衡了左侧重黑花瓶的视觉重量。";
    hint = "开启「局部棋盘节奏」，看看右下角如何一下稳住整张画。";
    fixAction = { label: "加入右下棋盘节奏带", patch: { decor: "rhythm" } };
  } else {
    // 4/4 通过，按用户的摆法给出对应风格评语（认可多解）
    if (state.colorMode === "triad") {
      headline = "三色高对比平面解成立：克制色相，边界刀切般清楚";
      body = `桌面倾角归零（${g.tableAngleDeg}°）、相邻边界最小对比度 ${minEdgeContrast}:1，靠 ${overlapCount} 处有效跨界重叠在纯二维里稳稳锁出前后层次。`;
    } else if (vaseOnHouseR >= 0.12) {
      headline = "右重非对称平面解成立：躲开黑拱门，照样压出好层序";
      body = `你没有照搬原海报左放花瓶，而是让${scene.names.vase}稳压在白墙侧边并避开黑门，相邻边界对比度达 ${minEdgeContrast}:1，说明平面化不止一种唯一摆法。`;
    } else {
      headline = "原海报级平面构成成立：二维整体、剪影利落、节奏压秤";
      body = `透视倾角已压至 ${g.tableAngleDeg}°、零体积投影，黑花瓶跨骑白墙与红台形成 ${overlapCount} 处层序咬合，右下棋盘格稳稳托住整张画的韵律。`;
    }
    hint = "试试把黑花瓶向右拖进纯黑拱门，或者切「试错」按钮，亲手看平面化怎么翻车。";
  }

  // 四枚原海报核心特征实时探针标签
  const features = {
    plane: {
      ok: planeOk,
      tag: planeOk ? "纯平 0°" : !perspFlatOk ? `桌倾 ${g.tableAngleDeg}°` : "残余投影",
    },
    compress: {
      ok: compressOk,
      tag: compressOk
        ? `跨界 ${overlapCount} 处`
        : fgClash
        ? `互挡 ${Math.round(vaseBowlOverlap * 100)}%`
        : tangentTrap
        ? "切线粘连"
        : "贴纸平铺",
    },
    silhouette: {
      ok: silhouetteOk,
      tag: silhouetteOk
        ? `反差 ${minEdgeContrast}:1`
        : archMerge
        ? "黑瓶融门"
        : !simplifyOk
        ? "细节过碎"
        : `低反差 ${minEdgeContrast}:1`,
    },
    decor: {
      ok: aestheticOk,
      tag: aestheticOk
        ? "节奏均衡"
        : state.decor === "chaos"
        ? "花纹噪乱"
        : !colorFlatOk
        ? "灰浊杂色"
        : "缺少节奏",
    },
  };

  // 整体平面化态势（档位，不做假精确百分比得分）
  const posture =
    passedCount === 4
      ? "纯平构成成立（示意）"
      : passedCount >= 2
      ? "半平半立过渡（示意）"
      : "透视立体未压平（示意）";

  return {
    scene,
    pal,
    geom: g,
    flattenPct,
    tableAngleDeg: g.tableAngleDeg,
    overlapCount,
    minEdgeContrast,
    vaseOverlapsArch,
    vaseBowlOverlap,
    archMerge,
    fgClash,
    tangentTrap,
    stickerFlat,
    passedCount,
    issueKey,
    badge,
    headline,
    body,
    hint,
    fixAction,
    features,
    posture,
  };
}
