(() => {
  "use strict";

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const header = document.querySelector("[data-header]");
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");

  let scrollScheduled = false;
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  const scheduleScroll = () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      onScroll();
    });
  };

  onScroll();
  window.addEventListener("scroll", scheduleScroll, { passive: true });

  menuBtn?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
    });
  });

  if (document.body.classList.contains("cv-page")) {
    const certTabs = document.querySelectorAll("[data-cert-filter]");
    const certGroups = document.querySelectorAll("[data-cert-category]");

    certTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.certFilter;
        certTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        certGroups.forEach((group) => {
          const show = filter === "all" || group.dataset.certCategory === filter;
          group.hidden = !show;
        });
      });
    });
  }
})();
