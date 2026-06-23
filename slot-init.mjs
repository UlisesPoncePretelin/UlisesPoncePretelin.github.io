import { buildSlotText, animateSlotText, chromatic } from "./vendor/slot-text/slotText.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const slotWords = {
  es: {
    hero: ["Arquitecto IA clínica", "Fisioterapeuta", "PoncePretelin", "Sistemas clínicos"],
    badge: ["Xalapa", "Veracruz", "2026", "IA clínica"],
    focus: ["PoncePretelin", "Expediente", "Terminología", "Seguridad clínica"],
    project: ["Gestor clínico", "Evidencia", "Integración openFDA", "IA clínica"],
  },
  en: {
    hero: ["Clinical AI Architect", "Physical Therapist", "PoncePretelin", "Clinical systems"],
    badge: ["Xalapa", "Veracruz", "2026", "Clinical AI"],
    focus: ["PoncePretelin", "Records", "Terminology", "Clinical safety"],
    project: ["Clinical manager", "Evidence", "openFDA integration", "Clinical AI"],
  },
};

const slotConfigs = [
  {
    selector: "[data-slot-hero]",
    key: "hero",
    interval: 3000,
    options: { direction: "up", stagger: 60, duration: 340, color: chromatic({ from: 12, spread: 280 }) },
  },
  {
    selector: "[data-slot-badge]",
    key: "badge",
    interval: 2600,
    options: { direction: "down", stagger: 40, duration: 280 },
  },
  {
    selector: "[data-slot-focus]",
    key: "focus",
    interval: 2800,
    options: { direction: "up", stagger: 45, duration: 300 },
  },
  {
    selector: "[data-slot-project]",
    key: "project",
    interval: 3200,
    options: { direction: "down", stagger: 50, duration: 320 },
  },
];

const timers = new Map();

const clearSlotTimer = (selector) => {
  const id = timers.get(selector);
  if (id) window.clearInterval(id);
  timers.delete(selector);
};

const initSlot = ({ selector, key, interval, options }) => {
  const el = document.querySelector(selector);
  if (!el) return;

  clearSlotTimer(selector);

  const lang = window.i18n?.getLang?.() || "es";
  const words = slotWords[lang]?.[key] || slotWords.es[key];
  const fallback = words.join(" · ");

  if (reduced) {
    el.textContent = fallback;
    return;
  }

  buildSlotText(el, words[0]);
  let index = 0;

  const id = window.setInterval(() => {
    index = (index + 1) % words.length;
    animateSlotText(el, words[index], options);
  }, interval);

  timers.set(selector, id);
};

const initAllSlots = () => slotConfigs.forEach(initSlot);

document.addEventListener("DOMContentLoaded", initAllSlots);
window.addEventListener("langchange", initAllSlots);
