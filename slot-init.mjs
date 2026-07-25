import { buildSlotText, animateSlotText, chromatic } from "./vendor/slot-text/slotText.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const slotWords = {
  es: {
    preloader: ["Fisioterapeuta", "Salud digital", "IA aplicada"],
    focus: ["Rehabilitación", "Evidencia", "Herramientas clínicas"],
    project: ["Fisioterapia", "Salud digital"],
  },
  en: {
    preloader: ["Physical therapist", "Digital health", "Applied AI"],
    focus: ["Rehabilitation", "Evidence", "Clinical tools"],
    project: ["Physical therapy", "Digital health"],
  },
};

const chromaticRainbow = chromatic({ from: 0, spread: 320, saturation: 90, lightness: 48 });
const chromaticTeal = chromatic({ from: 168, spread: 80, saturation: 62, lightness: 42 });

const slotConfigs = [
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
    options: { direction: "down", stagger: 42, duration: 300, color: chromaticRainbow },
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
