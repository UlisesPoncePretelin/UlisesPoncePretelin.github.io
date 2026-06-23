import { slotText } from "https://esm.sh/slot-text@0.3.1";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const initHeroSlot = () => {
  const el = document.querySelector("[data-slot-hero]");
  if (!el || reduced) return;

  const roles = ["Fisioterapeuta", "DEV", "PoncePretelin", "IA clínica"];
  let index = 0;
  const roller = slotText(el, roles[0]);

  window.setInterval(() => {
    index = (index + 1) % roles.length;
    roller.set(roles[index]);
  }, 3200);
};

const initHeroFallback = () => {
  const el = document.querySelector("[data-slot-hero]");
  if (!el || !reduced) return;
  el.textContent = "Fisioterapeuta · DEV · PoncePretelin";
};

document.addEventListener("DOMContentLoaded", () => {
  initHeroSlot();
  initHeroFallback();
});
