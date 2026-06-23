(() => {
  "use strict";

  const STORAGE_KEY = "portfolio-lang";
  const DEFAULT_LANG = "es";
  let currentLang = DEFAULT_LANG;
  let messages = {};

  const getNested = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);

  const loadLocale = async (lang) => {
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) throw new Error(`Locale ${lang} not found`);
    return response.json();
  };

  const applyMeta = () => {
    const title = getNested(messages, "meta.title") || getNested(messages, "cv.title");
    const description = getNested(messages, "meta.description") || getNested(messages, "cv.description");
    const ogTitle = getNested(messages, "meta.ogTitle");
    const ogDescription = getNested(messages, "meta.ogDescription");

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

    const schemaEl = document.getElementById("schema-person");
    if (schemaEl) {
      try {
        const data = JSON.parse(schemaEl.textContent);
        const jobTitle = getNested(messages, "meta.jobTitle");
        if (jobTitle) data.jobTitle = jobTitle;
        schemaEl.textContent = JSON.stringify(data);
      } catch {
        /* ignore */
      }
    }
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
