import { initHero } from "./hero.js";
import { initFigures } from "./figures.js";

const heroApi = initHero();
initFigures(heroApi);
