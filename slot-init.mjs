import { slotText } from "https://esm.sh/slot-text@0.3.1";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const initHeroSlot = () => {
  const el = document.querySelector("[data-slot-hero]");
  if (!el || reduced) return;

  const roles = [
    "Fisioterapeuta",
    "Dev clínico",
    "PoncePretelin",
    "IA clínica",
  ];
  let index = 0;
  const roller = slotText(el, roles[0]);

  window.setInterval(() => {
    index = (index + 1) % roles.length;
    roller.set(roles[index]);
  }, 3200);
};

const initMetricSlot = () => {
  const el = document.querySelector("[data-slot-metric]");
  if (!el || reduced) {
    if (el) el.textContent = el.dataset.slotTarget || el.textContent;
    return;
  }

  const roller = slotText(el, "0");
  const target = el.dataset.slotTarget || "980+";

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        roller.set(target);
        observer.disconnect();
      });
    },
    { threshold: 0.45 }
  );

  observer.observe(el);
};

const initHeroFallback = () => {
  const el = document.querySelector("[data-slot-hero]");
  if (!el || !reduced) return;
  el.textContent = "Fisioterapeuta · Dev clínico · PoncePretelin";
};

document.addEventListener("DOMContentLoaded", () => {
  initHeroSlot();
  initHeroFallback();
  initMetricSlot();
});
