import { reducedMotion } from "../../lib/stage.js";
import { initFigures } from "./figures.js";
import { initHero } from "./hero.js";

if (!reducedMotion.matches) document.documentElement.classList.add("motion");
initHero();
initFigures();
