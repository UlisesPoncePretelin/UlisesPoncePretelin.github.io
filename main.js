(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const narrowQuery = window.matchMedia("(max-width: 720px)");
  let isNarrow = narrowQuery.matches;
  const canAnimate = !prefersReduced;
  const usePinLerp = canAnimate;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (current, target, amount) => current + (target - current) * amount;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const motion = {
    pinX: 0,
    pinTarget: 0,
    pinProgress: 0,
    pinProgressTarget: 0,
    endcapScale: 0.82,
    endcapOpacity: 0.35,
    endcapBlur: 6,
    endcapScaleTarget: 0.82,
    endcapOpacityTarget: 0.35,
    endcapBlurTarget: 6,
  };

  /* Preloader */
  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloader-fill");
  const preloaderPct = document.getElementById("preloader-pct");
  const loadStarted = performance.now();

  const finishLoad = () => {
    const revealSite = () => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      preloader?.classList.add("is-done");
      window.dispatchEvent(new CustomEvent("portfolio:ready"));
      revealInView();
      setTimeout(() => preloader?.remove(), 900);
    };

    const minDelay = 2200;
    const elapsed = performance.now() - loadStarted;
    const wait = Math.max(0, minDelay - elapsed);
    setTimeout(revealSite, wait);
  };

  if (canAnimate && preloader && preloaderFill && preloaderPct) {
    let progress = 0;
    const tick = () => {
      progress = Math.min(progress + Math.random() * 14 + 6, 100);
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

  /* Header + scroll targets */
  const header = document.querySelector("[data-header]");
  const scrollProgress = document.getElementById("scroll-progress");
  const projectPin = document.querySelector("[data-project-pin]");
  const pinTrack = document.querySelector("[data-pin-track]");
  const pinProgress = document.querySelector("[data-pin-progress]");
  const pinCards = document.querySelectorAll("[data-card-index]");
  const pinCurrent = document.querySelector("[data-pin-current]");
  const endcap = document.querySelector("[data-endcap]");
  const endcapContent = document.querySelector("[data-endcap-content]");
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  const navLinks = nav?.querySelectorAll('.nav-link[href^="#"]');
  const chapterLinks = document.querySelectorAll("[data-chapter]");
  const sectionIds = ["top", "sobre", "trayectoria", "proyecto", "certificaciones", "stack", "contacto"];

  const applyPinTransform = () => {
    if (!pinTrack || isNarrow) return;
    pinTrack.style.transform = `translate3d(${motion.pinX}px, 0, 0)`;
    if (pinProgress) pinProgress.style.width = `${motion.pinProgress}%`;
  };

  const computePin = () => {
    if (!projectPin || !pinTrack || isNarrow) return;

    const rect = projectPin.getBoundingClientRect();
    const viewport = pinTrack.parentElement;
    if (!viewport) return;

    const scrollable = projectPin.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = clamp(-rect.top / scrollable, 0, 1);
    const maxShift = Math.max(0, pinTrack.scrollWidth - viewport.clientWidth);
    motion.pinTarget = -progress * maxShift;
    motion.pinProgressTarget = progress * 100;

    if (!usePinLerp) {
      motion.pinX = motion.pinTarget;
      motion.pinProgress = motion.pinProgressTarget;
      applyPinTransform();
    }

    if (pinCards.length) {
      const activeIdx = Math.min(pinCards.length - 1, Math.round(progress * (pinCards.length - 1)));
      pinCards.forEach((card, i) => card.classList.toggle("is-active", i === activeIdx));
      if (pinCurrent) pinCurrent.textContent = String(activeIdx + 1).padStart(2, "0");
    }
  };

  const computeEndcap = () => {
    if (!endcap || !endcapContent || isNarrow || !canAnimate) return;

    const rect = endcap.getBoundingClientRect();
    const scrollable = endcap.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      motion.endcapScaleTarget = 1;
      motion.endcapOpacityTarget = 1;
      motion.endcapBlurTarget = 0;
      endcapContent.classList.add("is-active");
      return;
    }

    const progress = clamp(-rect.top / scrollable, 0, 1);
    motion.endcapScaleTarget = 0.82 + progress * 0.18;
    motion.endcapOpacityTarget = 0.35 + progress * 0.65;
    motion.endcapBlurTarget = (1 - progress) * 6;

    if (progress > 0.55) endcapContent.classList.add("is-active");
  };

  const updateNav = () => {
    if (!navLinks?.length) return;
    let current = "top";
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.38) {
        current = id;
      }
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
    chapterLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.chapter === current);
    });
  };

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${progress}%`;
    computePin();
    computeEndcap();
    updateNav();
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  narrowQuery.addEventListener("change", (event) => {
    isNarrow = event.matches;
    if (isNarrow && pinTrack) {
      pinTrack.style.transform = "";
      if (pinProgress) pinProgress.style.width = "0%";
    }
    onScroll();
  });
  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      onScroll();
      setTimeout(onScroll, 120);
    });
  });

  if (pinCards.length) pinCards[0]?.classList.add("is-active");
  if (endcapContent && (isNarrow || !canAnimate)) endcapContent.classList.add("is-active");

  const renderMotion = () => {
    if (pinTrack && !isNarrow && usePinLerp) {
      motion.pinX = lerp(motion.pinX, motion.pinTarget, 0.11);
      motion.pinProgress = lerp(motion.pinProgress, motion.pinProgressTarget, 0.11);
      applyPinTransform();
    }

    if (endcapContent && !isNarrow && canAnimate) {
      motion.endcapScale = lerp(motion.endcapScale, motion.endcapScaleTarget, 0.09);
      motion.endcapOpacity = lerp(motion.endcapOpacity, motion.endcapOpacityTarget, 0.09);
      motion.endcapBlur = lerp(motion.endcapBlur, motion.endcapBlurTarget, 0.09);
      endcapContent.style.transform = `scale(${motion.endcapScale})`;
      endcapContent.style.opacity = String(motion.endcapOpacity);
      endcapContent.style.filter = `blur(${motion.endcapBlur}px)`;
    }

    requestAnimationFrame(renderMotion);
  };

  if (canAnimate) requestAnimationFrame(renderMotion);

  /* Hero typing roles — slot-text en slot-init.mjs */

  /* Mobile menu */
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
      gx = lerp(gx, tx, 0.14);
      gy = lerp(gy, ty, 0.14);
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(animateGlow);
    };
    animateGlow();
  }

  /* 3D tilt helpers */
  const bindTilt = (elements, max) => {
    elements.forEach((el) => {
      if (!canAnimate || isCoarse) return;
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  };

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

  bindTilt(document.querySelectorAll("[data-tilt-card]"), 8);
  bindTilt(document.querySelectorAll("[data-tilt-chip]"), 6);

  /* Hero name split + premium motion */
  const initHeroSplit = () => {
    if (!canAnimate) return;
    document.querySelectorAll("[data-split]").forEach((el) => {
      if (el.dataset.splitReady) return;
      const text = el.textContent.trim();
      el.dataset.splitReady = "1";
      el.setAttribute("aria-label", text);
      el.textContent = "";
      el.classList.remove("word");
      [...text].forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "split-char";
        span.textContent = char === " " ? "\u00a0" : char;
        span.style.animationDelay = `${0.52 + i * 0.028}s`;
        el.appendChild(span);
      });
    });
  };

  const initDemoTopicCycle = () => {
    const topics = document.querySelectorAll(".demo-showcase-topics li");
    if (!topics.length || !canAnimate) return;
    let index = 0;
    topics[0]?.classList.add("is-active");
    window.setInterval(() => {
      index = (index + 1) % topics.length;
      topics.forEach((li, i) => li.classList.toggle("is-active", i === index));
    }, 2600);
  };

  const initHeroParallax = () => {
    const heroLeft = document.querySelector(".hero-left");
    if (!heroLeft || !canAnimate || isNarrow) return;
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > window.innerHeight * 0.85) return;
        heroLeft.style.transform = `translate3d(0, ${window.scrollY * 0.045}px, 0)`;
      },
      { passive: true }
    );
  };

  const bootPremiumMotion = () => {
    initHeroSplit();
    initDemoTopicCycle();
    initHeroParallax();
  };

  window.addEventListener("portfolio:ready", bootPremiumMotion);
  if (document.body.classList.contains("is-loaded")) bootPremiumMotion();

  /* Magnetic buttons */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    if (!canAnimate || isCoarse) return;
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  /* Reveal on scroll */
  const prepareStaggerReveals = () => {
    document.querySelectorAll(".reveal-stagger").forEach((container) => {
      container.classList.remove("reveal", "is-visible");
      [...container.children].forEach((child, i) => {
        child.classList.add("reveal");
        child.style.setProperty("--delay", `${Math.min(i * 95, 570)}ms`);
      });
    });

    document.querySelectorAll(".reveal-stagger-list").forEach((list) => {
      list.classList.remove("reveal", "is-visible");
      list.querySelectorAll(":scope > *").forEach((child, i) => {
        child.classList.add("reveal", "reveal-left");
        child.style.setProperty("--delay", `${Math.min(i * 72, 430)}ms`);
      });
    });
  };

  prepareStaggerReveals();
  const reveals = document.querySelectorAll(".reveal");
  let revealObserver;

  const revealInView = () => {
    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add("is-visible");
        revealObserver?.unobserve(el);
      }
    });
  };

  if (reveals.length && canAnimate) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -4% 0px" }
    );
    reveals.forEach((el, i) => {
      if (!el.style.getPropertyValue("--delay")) {
        el.style.setProperty("--delay", `${Math.min(i * 35, 280)}ms`);
      }
      revealObserver.observe(el);
    });
    revealInView();
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
          const step = Math.max(1, Math.floor(target / 70));
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

  /* CV cert filters */
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
