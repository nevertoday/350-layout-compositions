import { initHero } from "./hero.js";
import {
  initPosterLightbox,
  initSec01,
  initSec02,
  initSec03,
  initSec04,
  initSec05,
  initSec06,
  initSec07,
} from "./sections.js";

function boot() {
  initHero();
  initSec01();
  initSec02();
  initSec03();
  initSec04();
  initSec05();
  initSec06();
  initSec07();
  initPosterLightbox();
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(boot);
} else {
  boot();
}
