import { buildSlotText, animateSlotText, chromatic } from "./vendor/slot-text/slotText.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const slotConfigs = [
  {
    selector: "[data-slot-hero]",
    words: ["Fisioterapeuta", "DEV", "PoncePretelin", "IA clínica"],
    interval: 3000,
    options: { direction: "up", stagger: 60, duration: 340, color: chromatic({ from: 12, spread: 280 }) },
    fallback: "Fisioterapeuta · DEV · PoncePretelin",
  },
  {
    selector: "[data-slot-badge]",
    words: ["Xalapa", "Veracruz", "2026", "DEV"],
    interval: 2600,
    options: { direction: "down", stagger: 40, duration: 280 },
    fallback: "Xalapa · Veracruz",
  },
  {
    selector: "[data-slot-focus]",
    words: ["PoncePretelin", "Expediente", "Terminología", "IA clínica"],
    interval: 2800,
    options: { direction: "up", stagger: 45, duration: 300 },
    fallback: "PoncePretelin",
  },
  {
    selector: "[data-slot-project]",
    words: ["Gestor clínico", "Evidencia", "Módulos IA", "v1 activa"],
    interval: 3200,
    options: { direction: "down", stagger: 50, duration: 320 },
    fallback: "Gestor clínico",
  },
];

const initSlot = ({ selector, words, interval, options, fallback }) => {
  const el = document.querySelector(selector);
  if (!el) return;

  if (reduced) {
    el.textContent = fallback;
    return;
  }

  buildSlotText(el, words[0]);
  let index = 0;

  window.setInterval(() => {
    index = (index + 1) % words.length;
    animateSlotText(el, words[index], options);
  }, interval);
};

document.addEventListener("DOMContentLoaded", () => {
  slotConfigs.forEach(initSlot);
});
