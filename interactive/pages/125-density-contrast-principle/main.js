import { initHero } from "./hero.js";
import { initSections } from "./sections.js";

const hero = initHero();
initSections();

// 暴露只读调试句柄供自动化验证核对单真源状态
window.__page125 = {
  getMetrics: () => hero?.getMetrics?.(),
  applyPreset: (id) => hero?.applyPreset?.(id, true),
};
