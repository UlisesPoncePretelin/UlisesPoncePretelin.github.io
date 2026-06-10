document.getElementById("year").textContent = new Date().getFullYear();

const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

toggle?.addEventListener("click", () => {
  const open = links?.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});

links?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => links.classList.remove("open"));
});

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.dataset.tab;
    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    panels.forEach((panel) => {
      const match = panel.id === id;
      panel.hidden = !match;
      panel.classList.toggle("active", match);
    });
  });
});
