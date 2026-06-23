const DEFAULTS = {
  direction: "down",
  stagger: 45,
  duration: 300,
  exitOffset: 50,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: 0.6,
  colorFade: 280,
  skipUnchanged: true,
  interrupt: true,
};

const NBSP = "\u00A0";
const glyph = (char) => (char === " " ? NBSP : char);

export function chromatic({ from = 0, spread = 320, saturation = 92, lightness = 60 } = {}) {
  return (index, total) => {
    const t = total <= 1 ? 0 : index / (total - 1);
    return `hsl(${(from + t * spread) % 360} ${saturation}% ${lightness}%)`;
  };
}

const states = new WeakMap();

function settle(container) {
  const state = states.get(container);
  if (!state) return;
  state.timers.forEach((t) => window.clearTimeout(t));
  states.delete(container);
  buildSlotText(container, state.target);
}

function makeFace(char) {
  const face = document.createElement("span");
  face.className = "char-face";
  face.textContent = glyph(char);
  return face;
}

function buildSlot(char) {
  const slot = document.createElement("span");
  slot.className = "char-slot";
  slot.dataset.char = char;
  const sizer = document.createElement("span");
  sizer.className = "char-sizer";
  sizer.textContent = glyph(char);
  slot.append(sizer, makeFace(char));
  return slot;
}

export function buildSlotText(container, text) {
  container.classList.add("slot-text");
  container.replaceChildren(...Array.from(text, buildSlot));
}

export function animateSlotText(container, toText, options = {}) {
  const { direction, stagger, duration, exitOffset, easing, bounce, color, colorFade, skipUnchanged, interrupt } = {
    ...DEFAULTS,
    ...options,
  };

  const running = states.get(container);
  if (running && !interrupt) {
    if (toText !== running.target) running.pending = { text: toText, options };
    return;
  }

  settle(container);

  if (!container.querySelector(".char-slot")) {
    buildSlotText(container, toText);
    return;
  }

  const slots = Array.from(container.querySelectorAll(".char-slot"));
  const fromText = slots.map((s) => s.dataset.char ?? "").join("");
  if (!interrupt && fromText === toText) return;

  const maxLen = Math.max(fromText.length, toText.length);
  const sample = slots.find((s) => (s.dataset.char ?? "") !== "") ?? slots[0];
  const cs = getComputedStyle(container);
  const H =
    Math.ceil(
      sample?.getBoundingClientRect().height ||
        sample?.offsetHeight ||
        container.getBoundingClientRect().height ||
        parseFloat(cs.lineHeight) ||
        0
    ) ||
    Math.ceil(parseFloat(cs.fontSize) * 1.3) ||
    18;

  const restColor = color ? cs.color : "";

  for (let i = slots.length; i < maxLen; i++) {
    const slot = buildSlot("");
    container.appendChild(slot);
    slots.push(slot);
  }

  const timers = [];
  const state = { timers, target: toText };
  states.set(container, state);

  const outY = direction === "down" ? H : -H;
  const inStart = direction === "down" ? -H : H;
  const wobble = (i, salt) => {
    const n = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  };

  let maxEnd = 0;

  for (let i = 0; i < maxLen; i++) {
    const fromChar = fromText[i] || "";
    const toChar = toText[i] || "";
    if (fromChar === toChar && (skipUnchanged || fromChar === "")) continue;

    const slot = slots[i];
    const sizer = slot.querySelector(".char-sizer");
    const oldFace = slot.querySelector(".char-face");
    const oldW = slot.getBoundingClientRect().width;
    sizer.textContent = glyph(toChar);
    const newW = sizer.getBoundingClientRect().width;
    const widthChanges = Math.abs(newW - oldW) > 0.5;
    if (widthChanges) slot.style.width = `${oldW}px`;
    if (fromChar === "" || toChar === "") slot.classList.add("is-resizing");

    const tint = typeof color === "function" ? color(i, maxLen) : color;
    const isTail = toChar === "";
    const d = Math.round(duration * (isTail ? 0.75 : 1) * (1 + bounce * 0.45 * wobble(i, 1)));
    const staggerIndex = isTail ? toText.length * 0.5 + (i - toText.length) * 0.25 : i;
    const base = Math.round(staggerIndex * stagger * (1 + bounce * 0.25 * wobble(i, 2)));
    const tilt = (bounce * 5 * wobble(i, 3)).toFixed(2);
    const rollTrans = `transform ${d}ms ${easing}`;
    const trans = color ? `${rollTrans}, color ${colorFade}ms linear ${d}ms` : rollTrans;
    const newFace = makeFace(toChar);
    newFace.style.transformOrigin = "50% 50%";
    newFace.style.transform = `translateY(${inStart}px) rotate(${tilt}deg)`;
    if (tint) newFace.style.color = tint;
    slot.appendChild(newFace);
    void slot.offsetWidth;

    if (widthChanges) {
      let wDelay = base;
      let wDur = d;
      if (isTail) {
        wDelay = base + Math.round(d * 0.55);
        wDur = Math.max(140, Math.round(d * 0.6));
      } else if (fromChar === "") {
        wDur = Math.max(140, Math.round(d * 0.45));
      }
      timers.push(
        window.setTimeout(() => {
          slot.style.transition = `width ${wDur}ms cubic-bezier(0.2, 0, 0, 1)`;
          slot.style.width = `${newW}px`;
        }, wDelay)
      );
      maxEnd = Math.max(maxEnd, wDelay + wDur);
    }

    maxEnd = Math.max(maxEnd, base + exitOffset + d + (color ? colorFade : 0));

    if (oldFace) {
      timers.push(
        window.setTimeout(() => {
          oldFace.style.transition = rollTrans;
          oldFace.style.transform = `translateY(${outY}px) rotate(${-Number(tilt)}deg)`;
        }, base)
      );
    }

    timers.push(
      window.setTimeout(() => {
        newFace.style.transition = trans;
        newFace.style.transform = "translateY(0) rotate(0deg)";
        if (color) newFace.style.color = restColor;
        const done = (e) => {
          if (e.propertyName !== "transform") return;
          newFace.removeEventListener("transitionend", done);
          slot.dataset.char = toChar;
          slot.style.removeProperty("transition");
          slot.style.removeProperty("width");
          slot.classList.remove("is-resizing");
          slot.querySelectorAll(".char-face").forEach((f) => {
            if (f !== newFace) f.remove();
          });
        };
        newFace.addEventListener("transitionend", done);
      }, base + exitOffset)
    );
  }

  const total = maxEnd + 80;
  timers.push(
    window.setTimeout(() => {
      const pending = state.pending;
      states.delete(container);
      buildSlotText(container, toText);
      if (pending) animateSlotText(container, pending.text, pending.options);
    }, total)
  );
}

export function clearSlotText(container, text = "") {
  settle(container);
  container.classList.remove("slot-text");
  container.textContent = text;
}
