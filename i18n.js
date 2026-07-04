(() => {
  "use strict";

  const STORAGE_KEY = "portfolio-lang";
  const DEFAULT_LANG = "es";
  const SITE_ORIGIN = "https://ulisesponcepretelin.github.io";
  let currentLang = DEFAULT_LANG;
  let messages = {};

  const getNested = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);

  const loadLocale = async (lang) => {
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) throw new Error(`Locale ${lang} not found`);
    return response.json();
  };

  const isHomePage = () => {
    const path = window.location.pathname;
    return path === "/" || path.endsWith("/index.html");
  };

  const buildLangUrl = (lang) => {
    const path = window.location.pathname;
    if (isHomePage()) {
      return lang === "en" ? `${SITE_ORIGIN}/?lang=en` : `${SITE_ORIGIN}/`;
    }
    return lang === "en" ? `${SITE_ORIGIN}${path}?lang=en` : `${SITE_ORIGIN}${path}`;
  };

  const syncSeoUrls = () => {
    const canonical = buildLangUrl(currentLang);
    document.getElementById("canonical-link")?.setAttribute("href", canonical);
    document.getElementById("hreflang-es")?.setAttribute("href", buildLangUrl("es"));
    document.getElementById("hreflang-en")?.setAttribute("href", buildLangUrl("en"));
    document.getElementById("hreflang-default")?.setAttribute("href", buildLangUrl("es"));
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", currentLang === "en" ? "en_US" : "es_MX");
    document.querySelector('meta[property="og:locale:alternate"]')?.setAttribute(
      "content",
      currentLang === "en" ? "es_MX" : "en_US"
    );

    const url = new URL(window.location.href);
    if (currentLang === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState({}, "", url);
  };

  const applyMeta = () => {
    const isCv = document.body.classList.contains("cv-page");
    const title = getNested(messages, isCv ? "cv.title" : "meta.title");
    const description = getNested(messages, isCv ? "cv.description" : "meta.description");
    const ogTitle = getNested(messages, isCv ? "cv.title" : "meta.ogTitle") || title;
    const ogDescription = getNested(messages, isCv ? "cv.description" : "meta.ogDescription") || description;
    const portraitAlt = getNested(messages, "hero.portraitAlt");

    if (title) document.title = title;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", ogDescription || description);
    }
    if (ogTitle) {
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", ogTitle);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", ogTitle);
    }
    if (ogDescription) {
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", ogDescription);
    }
    if (portraitAlt) {
      document.querySelector('meta[property="og:image:alt"]')?.setAttribute("content", portraitAlt);
      document.querySelector('meta[name="twitter:image:alt"]')?.setAttribute("content", portraitAlt);
    }

    const schemaPerson = document.getElementById("schema-person");
    if (schemaPerson) {
      try {
        const data = JSON.parse(schemaPerson.textContent);
        const jobTitle = getNested(messages, "meta.jobTitle");
        if (jobTitle) data.jobTitle = jobTitle;
        schemaPerson.textContent = JSON.stringify(data);
      } catch {
        /* ignore */
      }
    }

    const schemaCv = document.getElementById("schema-cv");
    if (schemaCv) {
      try {
        const data = JSON.parse(schemaCv.textContent);
        if (title) data.name = title;
        data.inLanguage = currentLang;
        data.url = buildLangUrl(currentLang);
        const jobTitle = getNested(messages, "meta.jobTitle");
        if (jobTitle && data.mainEntity) data.mainEntity.jobTitle = jobTitle;
        schemaCv.textContent = JSON.stringify(data);
      } catch {
        /* ignore */
      }
    }

    const schemaProduct = document.getElementById("schema-product");
    if (schemaProduct) {
      try {
        const data = JSON.parse(schemaProduct.textContent);
        const desc = getNested(messages, "geo.productDescription");
        if (desc) data.description = desc;
        data.inLanguage = currentLang;
        schemaProduct.textContent = JSON.stringify(data);
      } catch {
        /* ignore */
      }
    }

    const schemaFaq = document.getElementById("schema-faq");
    if (schemaFaq) {
      const mainEntity = [];
      for (let i = 1; i <= 6; i += 1) {
        const name = getNested(messages, `faq.q${i}`);
        const text = getNested(messages, `faq.a${i}`);
        if (!name || !text) continue;
        mainEntity.push({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        });
      }
      if (mainEntity.length) {
        schemaFaq.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity,
        });
      }
    }

    syncSeoUrls();
  };

  const applyToDom = () => {
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const value = getNested(messages, key);
      if (value == null) return;
      el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.dataset.i18nHtml;
      const value = getNested(messages, key);
      if (value == null) return;
      el.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.dataset.i18nAttr;
      if (!spec) return;
      spec.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const value = getNested(messages, key);
        if (attr && value != null) el.setAttribute(attr, value);
      });
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const value = getNested(messages, key);
      if (value != null) el.setAttribute("placeholder", value);
    });

    const pdfLink = document.querySelector("[data-cv-pdf]");
    if (pdfLink) {
      const href = getNested(messages, currentLang === "en" ? "cv.pdfEn" : "cv.pdfEs");
      if (href) pdfLink.setAttribute("href", href);
    }

    document.querySelectorAll(".lang-toggle-btn").forEach((btn) => {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    applyMeta();
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: currentLang } }));
  };

  const setLang = async (lang) => {
    if (lang !== "es" && lang !== "en") return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    messages = await loadLocale(lang);
    applyToDom();
  };

  const init = async () => {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const saved = localStorage.getItem(STORAGE_KEY);
    const lang =
      urlLang === "en" || urlLang === "es"
        ? urlLang
        : saved === "en" || saved === "es"
          ? saved
          : DEFAULT_LANG;
    await setLang(lang);

    document.querySelectorAll(".lang-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.lang;
        if (next && next !== currentLang) setLang(next);
      });
    });
  };

  window.i18n = { init, setLang, getLang: () => currentLang, t: (key) => getNested(messages, key) };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
