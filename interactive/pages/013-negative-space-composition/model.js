// 开场「负空间雕刻台」的状态模型：只存 0..1 的核心参数 u、标本类型与正负极性。
// 渲染层、控件、读数、键盘共用这一份模型。

export const SPECIMENS = {
  cat: {
    id: "cat",
    label: "绿圆与猫",
    en: "Poster Motif",
    sweet: 0.56,
    snapRadius: 0.055,
    sliderLabel: "切入深度",
    sliderEn: "Carve Depth",
    axisLow: "只是缺口",
    axisMid: "猫影成形",
    axisHigh: "边界散掉",
    describe(u, inverted) {
      const pol = inverted
        ? "极性已反转：底纸变成深墨，绿圆依旧，但猫影转成暗色剪影——图底一换，沉静感完全变了。"
        : "底纸（米白）直接连进绿圆内部，没有画外框，大脑替你补出了整只白猫。";
      if (u < 0.24) {
        return {
          badge: "还没成形",
          status: "weak",
          title: "只是圆边缺了一口",
          text: `空白切入太浅（${pct(u)}），大脑仍把绿圆当完整主角，那一点凹痕只像残缺。往右拖，让底色切得更深。`,
          note: pol,
        };
      }
      if (Math.abs(u - 0.56) <= 0.075) {
        return {
          badge: "负形成立",
          status: "sweet",
          title: "空白长出了一只猫",
          text: `切入到 ${pct(u)}，绿圆和底纸共享一条精准的侧影边界。哪怕底边完全敞开，大脑也会自动闭合出一只完整的猫。`,
          note: pol,
        };
      }
      if (u < 0.485) {
        return {
          badge: "正在显形",
          status: "mid",
          title: "耳朵和鼻尖刚露头",
          text: `切入到 ${pct(u)}，轮廓已经开始有方向感，但头颈比例偏局促。再往右一点，就能吸进最清晰的位置。`,
          note: pol,
        };
      }
      if (u <= 0.78) {
        return {
          badge: "偏空",
          status: "mid",
          title: "绿圆变薄，猫变大",
          text: `切入到 ${pct(u)}，绿圆退成一道新月般的弧带。主体还能辨认，但圆本身的块面重量开始变轻。`,
          note: pol,
        };
      }
      return {
        badge: "边界溃散",
        status: "broken",
        title: "留白过头，变成了「空」",
        text: `切入到 ${pct(u)}，正形被吃得只剩零星碎边，托不住共享轮廓，猫影重新溶回一片空白里。`,
        note: pol,
      };
    },
  },
  vase: {
    id: "vase",
    label: "花瓶 / 侧脸",
    en: "Rubin Vase",
    sweet: 0.52,
    snapRadius: 0.055,
    sliderLabel: "双影间距",
    sliderEn: "Profile Gap",
    axisLow: "各看各的",
    axisMid: "图底双关",
    axisHigh: "挤成一团",
    describe(u, inverted) {
      const pol = inverted
        ? "现在中间更暗、两侧更亮：暗色常被优先看作实体，多数人会先看到一只深色花瓶。"
        : "现在两侧是实色、中间是底纸：面积更小、对称闭合的中间空白会和两侧侧影反复争夺「图」的位置。";
      if (u < 0.25) {
        return {
          badge: "空隙太宽",
          status: "weak",
          title: "两张侧脸，中间只是空",
          text: `两侧离得太远（${pct(u)}），中间那块留白宽而松散，无法收束成器皿轮廓，眼睛只看到左右两个剪影。`,
          note: pol,
        };
      }
      if (Math.abs(u - 0.52) <= 0.075) {
        return {
          badge: "图底互换",
          status: "sweet",
          title: "花瓶与对望的侧脸同时成立",
          text: `靠拢到 ${pct(u)}，左右边界的距离恰好收出杯口、细颈与底座。盯着中间是花瓶，扫向两边是对望的侧影——两者共用同一条线。`,
          note: pol,
        };
      }
      if (u < 0.445) {
        return {
          badge: "将合未合",
          status: "mid",
          title: "花瓶偏胖，侧脸占上风",
          text: `距离 ${pct(u)}，中间已经隐约像器皿，但比例过宽，大脑还是更倾向把两侧实块当成主体。`,
          note: pol,
        };
      }
      if (u <= 0.78) {
        return {
          badge: "偏窄",
          status: "mid",
          title: "花瓶瘦成一道缝",
          text: `挤到 ${pct(u)}，花瓶颈部被压得很细，器皿感减弱，更像两张贴得极近的剪影。`,
          note: pol,
        };
      }
      return {
        badge: "负形闭合",
        status: "broken",
        title: "空白被夹断，花瓶消失",
        text: `挤到 ${pct(u)}，两侧轮廓几乎碰在一起，中间的负空间彻底断掉，双关不再成立。`,
        note: pol,
      };
    },
  },
  arrow: {
    id: "arrow",
    label: "E × 隐箭",
    en: "Hidden Arrow",
    sweet: 0.62,
    snapRadius: 0.055,
    sliderLabel: "字距咬合",
    sliderEn: "Kerning Lock",
    axisLow: "松散字距",
    axisMid: "箭头显现",
    axisHigh: "字形相撞",
    describe(u, inverted) {
      const pol = inverted
        ? "深底浅字同样成立：负空间不是「白色空间」，只要底色干净连贯，深色底也能雕出向前的箭头。"
        : "没有多画一笔箭头，只是把大写 E 的右端和小写 x 的左角靠紧，字间的空白自己变成了方向符号。";
      if (u < 0.28) {
        return {
          badge: "只是字距",
          status: "weak",
          title: "两个分开的字母",
          text: `字距偏松（${pct(u)}），E 和 x 之间只是一条普通通道，空白是开放的，大脑不会把它读成独立图形。`,
          note: pol,
        };
      }
      if (Math.abs(u - 0.62) <= 0.075) {
        return {
          badge: "隐箭锁定",
          status: "sweet",
          title: "空白咬合成一支右向箭头",
          text: `咬合到 ${pct(u)}，E 的横臂撑出箭杆，x 的左斜角切出箭尖。这正是 1994 年 FedEx 标志最核心的负形机关。`,
          note: pol,
        };
      }
      if (u < 0.545) {
        return {
          badge: "接近咬合",
          status: "mid",
          title: "箭尖已经隐约出现",
          text: `字距收紧到 ${pct(u)}，三角形的缺口开始聚拢，再往右推一点，上下边缘一合拢，箭头就会跳出来。`,
          note: pol,
        };
      }
      if (u <= 0.8) {
        return {
          badge: "过挤",
          status: "mid",
          title: "箭杆被压短",
          text: `挤到 ${pct(u)}，字母已经略微贴死，负空间箭头变扁，字母本身的识别度也开始受损。`,
          note: pol,
        };
      }
      return {
        badge: "字形粘连",
        status: "broken",
        title: "字母相撞，空白被吃光",
        text: `挤到 ${pct(u)}，E 和 x 叠到了一起。正形互相侵犯时，负形和文字会一起失效。`,
        note: pol,
      };
    },
  },
};

export const clamp01 = (x) => Math.max(0.04, Math.min(0.96, x));
export const pct = (x) => `${Math.round(x * 100)}%`;

export function snapU(specimenId, rawU) {
  const s = SPECIMENS[specimenId];
  const u = clamp01(rawU);
  if (Math.abs(u - s.sweet) <= s.snapRadius) return { u: s.sweet, snapped: true };
  return { u, snapped: false };
}
