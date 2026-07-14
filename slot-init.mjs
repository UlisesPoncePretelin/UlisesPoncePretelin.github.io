import { buildSlotText, animateSlotText, chromatic } from "./vendor/slot-text/slotText.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const slotWords = {
  es: {
    badge: ["Xalapa", "Veracruz", "2026", "Salud digital"],
    preloader: ["Fisioterapeuta", "Salud digital", "Sistemas clínicos"],
    focus: ["Rehabilitación", "Evidencia", "Herramientas clínicas"],
    project: ["Fisioterapia", "Salud digital"],
  },
  en: {
    badge: ["Xalapa", "Veracruz", "2026", "Digital health"],
    preloader: ["Physical therapist", "Digital health", "Clinical systems"],
    focus: ["Rehabilitation", "Evidence", "Clinical tools"],
    project: ["Physical therapy", "Digital health"],
  },
};

const chromaticTeal = chromatic({ from: 168, spread: 260, saturation: 62, lightness: 42 });

const slotConfigs = [
  {
    selector: "[data-slot-badge]",
    key: "badge",
    interval: 2600,
    options: { direction: "down", stagger: 40, duration: 280 },
  },
  {
    selector: "[data-slot-preloader]",
    key: "preloader",
    interval: 2400,
    options: { direction: "up", stagger: 35, duration: 320, color: chromaticTeal },
  },
  {
    selector: "[data-slot-focus]",
    key: "focus",
    interval: 3000,
    options: { direction: "down", stagger: 42, duration: 300 },
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

const boot = () => {
  initAllSlots();
  window.addEventListener("portfolio:ready", initAllSlots, { once: false });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("langchange", initAllSlots);
