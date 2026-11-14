import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "theme";
const META = { light: "#f3efe6", dark: "#12110e" } as const;

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(t: Theme) {
  const root = document.documentElement;
  root.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[t]);
}

/**
 * Light / dark. The initial value is set before paint by the inline script in
 * index.html (stored choice, else the OS preference), so there is no flash.
 * Switching plays a circular reveal from the button that was pressed.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => (typeof document === "undefined" ? "light" : current()));

  // keep in sync if another tab changes it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) {
        apply(e.newValue);
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme, from?: HTMLElement | null) => {
    if (next === current()) return;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode */
    }
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const swap = () => {
      apply(next);
      setThemeState(next);
    };
    if (reduced) return swap();

    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) {
      if (from) {
        const r = from.getBoundingClientRect();
        root.style.setProperty("--tx", `${Math.round(r.left + r.width / 2)}px`);
        root.style.setProperty("--ty", `${Math.round(r.top + r.height / 2)}px`);
      }
      doc.startViewTransition(swap);
      return;
    }
    // fallback: a short crossfade
    root.classList.add("theme-fade");
    swap();
    window.setTimeout(() => root.classList.remove("theme-fade"), 300);
  }, []);

  return { theme, setTheme };
}
