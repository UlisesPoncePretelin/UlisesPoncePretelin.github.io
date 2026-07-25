(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const narrowQuery = window.matchMedia("(max-width: 720px)");
  let isNarrow = narrowQuery.matches;
  const canAnimate = !prefersReduced;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (current, target, amount) => current + (target - current) * amount;
  const near = (a, b, epsilon = 0.08) => Math.abs(a - b) < epsilon;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const motion = {
    endcapScale: 0.88,
    endcapOpacity: 0.45,
    endcapScaleTarget: 0.88,
    endcapOpacityTarget: 0.45,
  };

  /* Preloader — fast reveal */
  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloader-fill");
  const preloaderPct = document.getElementById("preloader-pct");
  const loadStarted = performance.now();

  const finishLoad = () => {
    const revealSite = () => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      preloader?.classList.add("is-done");
      try {
        sessionStorage.setItem("portfolio-seen", "1");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent("portfolio:ready"));
      setTimeout(() => preloader?.remove(), 500);
    };

    const hasSeenSite = (() => {
      try {
        return sessionStorage.getItem("portfolio-seen") === "1";
      } catch {
        return false;
      }
    })();
    const minDelay = hasSeenSite ? 0 : canAnimate ? 320 : 0;
    const elapsed = performance.now() - loadStarted;
    const wait = Math.max(0, minDelay - elapsed);
    setTimeout(revealSite, wait);
  };

  if (canAnimate && preloader && preloaderFill && preloaderPct) {
    const hasSeenSite = (() => {
      try {
        return sessionStorage.getItem("portfolio-seen") === "1";
      } catch {
        return false;
      }
    })();

    if (hasSeenSite) {
      setTimeout(finishLoad, 0);
    } else {
      let progress = 0;
      const tick = () => {
        progress = Math.min(progress + Math.random() * 22 + 12, 100);
        preloaderFill.style.width = `${progress}%`;
        preloaderPct.textContent = `${Math.round(progress)}%`;
        if (progress < 100) {
          requestAnimationFrame(tick);
        } else {
          setTimeout(finishLoad, 80);
        }
      };
      if (document.readyState === "complete") {
        requestAnimationFrame(tick);
      } else {
        window.addEventListener("load", () => requestAnimationFrame(tick), { once: true });
      }
      setTimeout(finishLoad, 1100);
    }
  } else {
    finishLoad();
  }

  const portrait = document.querySelector(".portrait");
  portrait?.addEventListener("error", () => {
    portrait.closest(".portrait-stage")?.classList.add("portrait-missing");
  });

  const header = document.querySelector("[data-header]");
  const scrollProgress = document.getElementById("scroll-progress");
  const endcap = document.querySelector("[data-endcap]");
  const endcapContent = document.querySelector("[data-endcap-content]");
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  const navLinks = nav?.querySelectorAll('.nav-link[href^="#"]');
  const chapterLinks = document.querySelectorAll("[data-chapter]");
  const sectionIds = ["top", "sobre", "trayectoria", "certificaciones", "stack", "proyecto", "faq", "contacto"];
  const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  const computeEndcap = () => {
    if (!endcap || !endcapContent || isNarrow || !canAnimate) return false;

    const rect = endcap.getBoundingClientRect();
    const scrollable = endcap.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      motion.endcapScaleTarget = 1;
      motion.endcapOpacityTarget = 1;
      endcapContent.classList.add("is-active");
      return false;
    }

    const progress = clamp(-rect.top / scrollable, 0, 1);
    motion.endcapScaleTarget = 0.88 + progress * 0.12;
    motion.endcapOpacityTarget = 0.45 + progress * 0.55;

    if (progress > 0.55) endcapContent.classList.add("is-active");

    return (
      !near(motion.endcapScale, motion.endcapScaleTarget, 0.002) ||
      !near(motion.endcapOpacity, motion.endcapOpacityTarget, 0.01)
    );
  };

  const updateNav = () => {
    if (!navLinks?.length) return;
    let current = "top";
    const threshold = window.innerHeight * 0.38;
    for (const el of sectionEls) {
      if (el.getBoundingClientRect().top <= threshold) current = el.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
    chapterLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.chapter === current);
    });
  };

  let scrollScheduled = false;
  let heroParallaxActive = false;

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${progress}%`;
    const motionDirty = computeEndcap();
    updateNav();

    const heroLeft = document.querySelector(".hero-left");
    if (heroLeft && canAnimate && !isNarrow && window.scrollY < window.innerHeight * 0.85) {
      heroLeft.style.transform = `translate3d(0, ${window.scrollY * 0.045}px, 0)`;
      heroParallaxActive = true;
    } else if (heroParallaxActive && heroLeft) {
      heroLeft.style.transform = "";
      heroParallaxActive = false;
    }

    if (motionDirty) scheduleMotion();
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
  window.addEventListener("resize", scheduleScroll, { passive: true });
  narrowQuery.addEventListener("change", (event) => {
    isNarrow = event.matches;
    scheduleScroll();
  });

  if (endcapContent && (isNarrow || !canAnimate)) endcapContent.classList.add("is-active");

  let motionFrame = null;

  const scheduleMotion = () => {
    if (motionFrame != null) return;
    motionFrame = requestAnimationFrame(renderMotion);
  };

  const renderMotion = () => {
    motionFrame = null;
    let dirty = false;

    if (endcapContent && !isNarrow && canAnimate) {
      motion.endcapScale = lerp(motion.endcapScale, motion.endcapScaleTarget, 0.12);
      motion.endcapOpacity = lerp(motion.endcapOpacity, motion.endcapOpacityTarget, 0.12);
      endcapContent.style.transform = `scale(${motion.endcapScale})`;
      endcapContent.style.opacity = String(motion.endcapOpacity);

      dirty =
        !near(motion.endcapScale, motion.endcapScaleTarget, 0.002) ||
        !near(motion.endcapOpacity, motion.endcapOpacityTarget, 0.01);
    }

    if (dirty) scheduleMotion();
  };

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

  const glow = document.getElementById("cursor-glow");
  if (glow && canAnimate && canHover && window.matchMedia("(min-width: 721px)").matches) {
    document.body.classList.add("has-cursor");
    let gx = 0;
    let gy = 0;
    let tx = 0;
    let ty = 0;
    let glowActive = false;
    let glowTimer = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!glowActive) {
          glowActive = true;
          animateGlow();
        }
        window.clearTimeout(glowTimer);
        glowTimer = window.setTimeout(() => {
          glowActive = false;
        }, 180);
      },
      { passive: true }
    );

    const animateGlow = () => {
      if (!glowActive) return;
      gx = lerp(gx, tx, 0.16);
      gy = lerp(gy, ty, 0.16);
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      if (!near(gx, tx, 0.6) || !near(gy, ty, 0.6)) requestAnimationFrame(animateGlow);
    };
  }

  const bindTilt = (elements, max) => {
    elements.forEach((el) => {
      if (!canAnimate || !canHover) return;
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
  if (tiltEl && canAnimate && canHover) {
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
        span.style.animationDelay = `${0.32 + i * 0.022}s`;
        el.appendChild(span);
      });
    });
  };

  const bootPremiumMotion = () => {
    initHeroSplit();
  };

  window.addEventListener("portfolio:ready", bootPremiumMotion);
  if (document.body.classList.contains("is-loaded")) bootPremiumMotion();

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    if (!canAnimate || !canHover) return;
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

  let revealObserver;

  const initRevealSystem = () => {
    if (!canAnimate) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    document.querySelectorAll(".reveal.is-visible").forEach((el) => {
      el.classList.remove("is-visible");
    });

    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;

    revealObserver?.disconnect();
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

    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add("is-visible");
        revealObserver.unobserve(el);
      }
    });

    document.querySelectorAll(".hero-row .reveal, .loc-bar.reveal").forEach((el) => {
      el.classList.add("is-visible");
      revealObserver.unobserve(el);
    });
  };

  window.addEventListener("portfolio:ready", initRevealSystem, { once: true });
  if (document.body.classList.contains("is-loaded")) initRevealSystem();

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

  const initShareCopy = () => {
    const portfolioUrl = "https://ulisesponcepretelin.github.io/";
    const shareTitle = "Ulises Ponce Pretelin — Fisioterapeuta · salud digital";
    const btn = document.querySelector("[data-copy-url]");
    const nativeBtn = document.querySelector("[data-native-share]");

    const copyWithFallback = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        fallback.style.left = "-9999px";
        document.body.appendChild(fallback);
        fallback.select();
        const ok = document.execCommand("copy");
        fallback.remove();
        return ok;
      }
    };

    if (btn) {
      const hint = btn.querySelector(".share-copy-hint");
      const done = btn.querySelector(".share-copy-done");

      btn.addEventListener("click", async () => {
        await copyWithFallback(portfolioUrl);

        btn.classList.add("is-copied");
        if (hint) hint.hidden = true;
        if (done) done.hidden = false;

        window.setTimeout(() => {
          btn.classList.remove("is-copied");
          if (hint) hint.hidden = false;
          if (done) done.hidden = true;
        }, 2400);
      });
    }

    if (nativeBtn && typeof navigator.share === "function") {
      nativeBtn.hidden = false;
      nativeBtn.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareTitle,
            url: portfolioUrl,
          });
        } catch {
          /* user cancelled */
        }
      });
    }
  };

  const initImageFallback = () => {
    const applyNext = (img) => {
      const remaining = img.dataset.imgFallback;
      if (!remaining) return;
      const [next, ...rest] = remaining.split("|");
      img.dataset.imgFallback = rest.join("|");
      if (next === "remove") {
        img.remove();
        return;
      }
      if (next) img.src = next;
    };

    document.addEventListener(
      "error",
      (event) => {
        const target = event.target;
        if (target instanceof HTMLImageElement && target.dataset.imgFallback != null) {
          applyNext(target);
        }
      },
      true
    );

    document.querySelectorAll("img[data-img-fallback]").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) applyNext(img);
    });
  };

  initShareCopy();
  initImageFallback();
})();
