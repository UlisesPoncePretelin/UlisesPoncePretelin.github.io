const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const header = document.querySelector("[data-header]");
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

const setScrolledHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

setScrolledHeader();
window.addEventListener("scroll", setScrolledHeader, { passive: true });

toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menú");
  });
});

document.addEventListener("click", (event) => {
  if (!nav?.classList.contains("open")) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (nav.contains(target) || toggle?.contains(target)) return;
  nav.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Abrir menú");
});

const portrait = document.querySelector(".portrait");
portrait?.addEventListener("error", () => {
  portrait.removeAttribute("src");
  portrait.alt = "";
  portrait.closest(".portrait-wrap")?.classList.add("portrait-missing");
});

const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}
