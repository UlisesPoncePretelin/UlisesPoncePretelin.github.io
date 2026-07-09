(() => {
  "use strict";

  const prefetchOnIntent = (url) => {
    if (!url || url.startsWith("#") || url.startsWith("http")) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";
    document.head.appendChild(link);
  };

  document.querySelectorAll('a[href$=".html"]').forEach((anchor) => {
    anchor.addEventListener("mouseenter", () => prefetchOnIntent(anchor.getAttribute("href")), { passive: true });
    anchor.addEventListener("focus", () => prefetchOnIntent(anchor.getAttribute("href")), { passive: true });
  });
})();
