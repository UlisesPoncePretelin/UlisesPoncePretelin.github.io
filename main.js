(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const canAnimate = !prefersReduced;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Preloader */
  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloader-fill");
  const preloaderPct = document.getElementById("preloader-pct");

  const finishLoad = () => {
    document.body.classList.add("is-loaded");
    preloader?.classList.add("is-done");
    setTimeout(() => preloader?.remove(), 700);
  };

  if (canAnimate && preloader && preloaderFill && preloaderPct) {
    let progress = 0;
    const tick = () => {
      progress = Math.min(progress + Math.random() * 18 + 8, 100);
      preloaderFill.style.width = `${progress}%`;
      preloaderPct.textContent = `${Math.round(progress)}%`;
      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(finishLoad, 250);
      }
    };
    window.addEventListener("load", () => requestAnimationFrame(tick), { once: true });
    setTimeout(finishLoad, 3500);
  } else {
    finishLoad();
  }

  /* Portrait fallback */
  const portrait = document.querySelector(".portrait");
  portrait?.addEventListener("error", () => {
    portrait.closest(".portrait-stage")?.classList.add("portrait-missing");
  });

  /* Header scroll */
  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    const bar = document.getElementById("scroll-progress");
    if (bar) bar.style.width = `${progress}%`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  menuBtn?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
    });
  });

  /* Cursor glow */
  const glow = document.getElementById("cursor-glow");
  if (glow && canAnimate && !isCoarse && window.matchMedia("(min-width: 721px)").matches) {
    document.body.classList.add("has-cursor");
    let gx = 0;
    let gy = 0;
    let tx = 0;
    let ty = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
      },
      { passive: true }
    );

    const animateGlow = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(animateGlow);
    };
    animateGlow();
  }

  /* 3D tilt — portrait */
  const tiltEl = document.querySelector("[data-tilt]");
  if (tiltEl && canAnimate && !isCoarse) {
    const max = 14;
    tiltEl.addEventListener("mousemove", (e) => {
      const rect = tiltEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tiltEl.style.transform = `perspective(1200px) rotateY(${x * max}deg) rotateX(${-y * max}deg) scale3d(1.02,1.02,1.02)`;
    });
    tiltEl.addEventListener("mouseleave", () => {
      tiltEl.style.transform = "";
    });
  }

  /* 3D tilt — cards */
  document.querySelectorAll("[data-tilt-card]").forEach((card) => {
    if (!canAnimate || isCoarse) return;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  /* Magnetic buttons */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    if (!canAnimate || isCoarse) return;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  /* Reveal on scroll */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && canAnimate) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.setProperty("--delay", `${Math.min(i * 40, 200)}ms`);
      observer.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Counter animation */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && canAnimate) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count || 0);
          const suffix = el.dataset.suffix || "";
          const counterEl = el.querySelector(".counter");
          if (!counterEl) return;
          let current = 0;
          const step = Math.max(1, Math.floor(target / 60));
          const run = () => {
            current = Math.min(current + step, target);
            counterEl.textContent = `${current}${suffix}`;
            if (current < target) requestAnimationFrame(run);
          };
          run();
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  }

  /* Horizontal project scroll — wheel to scroll */
  const projectScroll = document.querySelector("[data-project-scroll]");
  if (projectScroll && canAnimate) {
    projectScroll.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        projectScroll.scrollLeft += e.deltaY * 0.8;
      },
      { passive: false }
    );
  }
})();
