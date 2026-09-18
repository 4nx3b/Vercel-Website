import { useCallback, useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const fn = () => setFine(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return fine;
}

/** Observe when an element enters the viewport (once). */
export function useInView<T extends HTMLElement>(threshold = 0.18, rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return { ref, inView };
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#______01345789";

/** Scramble-decode text animation, cycling through phrases.
 *  `enabled` gates the loop (pass the element's inView state) — otherwise
 *  this runs a rAF + re-render every frame forever, even scrolled away. */
export function useScramble(words: string[], holdMs = 2600, enabled = true) {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(words[0]);
  const idx = useRef(0);

  useEffect(() => {
    if (reduced || words.length <= 1 || !enabled) {
      setText(words[idx.current]);
      return;
    }
    let frame = 0;
    let raf = 0;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let phase: "scramble" | "hold" = "scramble";
    let from = words[idx.current];
    let to = words[idx.current];

    const textRef = { current: words[idx.current] };

    const scrambleTo = (next: string) => {
      from = textRef.current;
      to = next;
      frame = 0;
      phase = "scramble";
      raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      if (phase === "scramble") {
        frame++;
        const total = Math.max(14, to.length * 2.2);
        const progress = Math.min(1, frame / total);
        const settled = Math.floor(progress * to.length);
        let out = "";
        for (let i = 0; i < Math.max(to.length, from.length); i++) {
          if (i < settled) out += to[i] ?? "";
          else if (i < to.length) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          else if (i < from.length && Math.random() > 0.5)
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        textRef.current = out.slice(0, Math.max(to.length, settled));
        setText(textRef.current);
        if (progress >= 1) {
          textRef.current = to;
          setText(to);
          phase = "hold";
          // during hold: no rAF at all — a timer resumes the loop
          holdTimer = setTimeout(() => {
            idx.current = (idx.current + 1) % words.length;
            scrambleTo(words[idx.current]);
          }, holdMs);
          return;
        }
        raf = requestAnimationFrame(tick);
      }
    };

    scrambleTo(words[idx.current]);
    return () => {
      cancelAnimationFrame(raf);
      if (holdTimer) clearTimeout(holdTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, enabled, words.join("|"), holdMs]);

  return text;
}

/** Animated integer counter that runs when triggered. */
export function useCountUp(target: number, start: boolean, duration = 1600, decimals = 0) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(parseFloat((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration, decimals, reduced]);
  return value;
}

/** Terminal typing effect across multiple lines, loops.
 *  `enabled` gates the loop (pass inView) so it stops re-rendering
 *  ~30×/s once the terminal has scrolled out of the viewport. */
export function useTypedLines(lines: string[], speed = 26, pauseBetween = 420, holdEnd = 3400, enabled = true) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<{ done: string[]; current: string }>({ done: [], current: "" });

  useEffect(() => {
    if (reduced || !enabled) return; // keep current state, stop the loop
    let li = 0;
    let ci = 0;
    let cancelled = false;
    const done: string[] = [];
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;
      if (li >= lines.length) {
        timer = setTimeout(() => {
          done.length = 0;
          li = 0;
          ci = 0;
          setState({ done: [], current: "" });
          timer = setTimeout(step, 500);
        }, holdEnd);
        return;
      }
      const line = lines[li];
      if (ci <= line.length) {
        setState({ done: [...done], current: line.slice(0, ci) });
        ci++;
        timer = setTimeout(step, speed + Math.random() * 18);
      } else {
        done.push(line);
        setState({ done: [...done], current: "" });
        li++;
        ci = 0;
        timer = setTimeout(step, pauseBetween);
      }
    };
    timer = setTimeout(step, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lines, speed, pauseBetween, holdEnd, reduced, enabled]);

  return state;
}

/** Scroll progress of the whole page, 0..1 — imperatively.
 *  Returns a ref for the progress bar element; updates style.width directly
 *  in a rAF so scrolling never re-renders React (the old state version
 *  re-rendered the whole nav every scroll frame). */
export function useScrollProgressRef() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (ref.current) ref.current.style.width = `${(p * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/** Live clock string for a timezone label. */
export function useClock(tz: string) {
  const fmt = useCallback(() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: tz,
      }).format(new Date());
    } catch {
      return new Date().toLocaleTimeString();
    }
  }, [tz]);
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, [fmt]);
  return time;
}
