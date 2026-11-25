import { mountHero } from "./hero.js";
import { mountLabs } from "./labs.js";

const hero = mountHero();
mountLabs();

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    hero?.redraw();
  });
}
