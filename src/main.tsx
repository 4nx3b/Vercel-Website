import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// One flag for every CSS loop: pause them all while the tab is hidden.
const syncHidden = () => document.documentElement.toggleAttribute("data-hidden", document.hidden);
document.addEventListener("visibilitychange", syncHidden);
syncHidden();

/* ------------------------------------------------------------------ *
 * Touch feedback: a 90ms press (scale .97, released over 180ms) and one
 * currentColor ripple from the touch point. Uses the `scale` property and a
 * fixed overlay, so it never fights a control's own transform or layout.
 * ------------------------------------------------------------------ */
const PRESSABLE =
  'button:not(:disabled), [role="tab"], [role="button"], a.rounded-full, a[class*="min-h-11"], a[class*="min-h-[52px]"], .pl-stack-card a, [data-ripple]';
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener(
  "pointerdown",
  (e) => {
    if (e.button !== 0) return;
    const el = (e.target as Element | null)?.closest?.(PRESSABLE) as HTMLElement | null;
    if (!el || el.closest("canvas, input, textarea, [contenteditable]")) return;

    const press = el.animate([{ scale: "1" }, { scale: "0.97" }], { duration: 90, easing: "ease-out", fill: "forwards" });
    const release = () => {
      press.cancel();
      el.animate([{ scale: "0.97" }, { scale: "1" }], { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" });
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    if (reducedMotion()) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    const cs = getComputedStyle(el);
    const wrap = document.createElement("span");
    wrap.className = "tap-ripple";
    wrap.setAttribute("aria-hidden", "true");
    Object.assign(wrap.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      borderRadius: cs.borderRadius,
      color: cs.color,
    });
    const dot = document.createElement("i");
    const size = Math.hypot(r.width, r.height) * 2;
    Object.assign(dot.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${e.clientX - r.left - size / 2}px`,
      top: `${e.clientY - r.top - size / 2}px`,
    });
    wrap.appendChild(dot);
    document.body.appendChild(wrap);
    dot.addEventListener("animationend", () => wrap.remove(), { once: true });
    window.setTimeout(() => wrap.remove(), 800);
  },
  { passive: true }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* ------------------------------------------------------------------ *
 * Boot loader hand-off. The loader itself is inline HTML/CSS in
 * index.html (it shows before this bundle runs). Dismiss once React has
 * mounted, fonts are ready and the hero portrait has decoded — no sooner
 * than 700ms, never later than 2.5s.
 * ------------------------------------------------------------------ */
const boot = document.getElementById("boot");
if (boot && document.documentElement.classList.contains("booting")) {
  const started = performance.now();
  const MIN = 700;
  const MAX = 2500;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    const wait = Math.max(0, MIN - (performance.now() - started));
    window.setTimeout(() => {
      try {
        sessionStorage.setItem("booted", "1");
      } catch {
        /* private mode */
      }
      boot.classList.add("boot-exit");
      const remove = () => {
        boot.remove();
        document.documentElement.classList.remove("booting");
      };
      boot.addEventListener("animationend", remove, { once: true });
      window.setTimeout(remove, 900);
    }, wait);
  };
  window.setTimeout(finish, MAX);
  requestAnimationFrame(() => {
    const img = document.querySelector<HTMLImageElement>(".hero-portrait img");
    const decoded = img?.decode ? img.decode().catch(() => undefined) : Promise.resolve();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    Promise.all([decoded, fonts]).then(finish, finish);
  });
}
