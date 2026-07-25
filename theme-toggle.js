(function initThemeToggle() {
  const STORAGE_KEY = "portfolio-theme";

  const getPreferredTheme = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      /* ignore */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDark));
    });
  };

  const switchTheme = () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  applyTheme(getPreferredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!document.startViewTransition) {
        switchTheme();
        return;
      }

      const root = document.documentElement;
      root.classList.add("theme-transitioning");
      const transition = document.startViewTransition(switchTheme);
      transition.finished.finally(() => {
        root.classList.remove("theme-transitioning");
      });
    });
  });
})();
