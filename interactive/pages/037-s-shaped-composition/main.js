// 037 S 形构图 · 主入口（main.js）
import { initHero } from "./hero.js";
import {
  initAntiPatterns,
  initHistoryLineage,
  initHogarthRuler,
  initNodeAssembler,
  initPosterLightbox,
  initQuiz,
  initTrackRace,
} from "./sections.js";

initHero();
initTrackRace();
initHistoryLineage();
initHogarthRuler();
initNodeAssembler();
initAntiPatterns();
initQuiz();
initPosterLightbox();
