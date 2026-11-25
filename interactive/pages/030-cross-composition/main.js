import { initHero } from "./hero.js";
import { initSections } from "./sections.js";

const heroApi = initHero();
initSections();

// 暴露给只读调试/自动化测试读取（不影响离线使用）
window.__cross030 = heroApi;
