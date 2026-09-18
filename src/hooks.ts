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

/** Scramble-decode text animation, cycling through phrases. */
export function useScramble(words: string[], holdMs = 2600) {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(words[0]);
  const idx = useRef(0);

  useEffect(() => {
    if (reduced || words.length <= 1) {
      setText(words[0]);
      return;
    }
    let frame = 0;
    let raf = 0;
    let hold = 0;
    let phase: "scramble" | "hold" = "scramble";
    let from = words[0];
    let to = words[1 % words.length];

    const scrambleTo = (next: string) => {
      from = textRef.current;
      to = next;
      frame = 0;
      phase = "scramble";
    };

    const textRef = { current: words[0] };

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
          hold = 0;
        }
      } else {
        hold += 16;
        if (hold >= holdMs) {
          idx.current = (idx.current + 1) % words.length;
          scrambleTo(words[idx.current]);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    // initial decode from glyphs into the first word
    scrambleTo(words[0]);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, words.join("|"), holdMs]);

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

/** Terminal typing effect across multiple lines, loops. */
export function useTypedLines(lines: string[], speed = 26, pauseBetween = 420, holdEnd = 3400) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<{ done: string[]; current: string }>({ done: [], current: "" });

  useEffect(() => {
    if (reduced) {
      setState({ done: lines, current: "" });
      return;
    }
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
  }, [lines, speed, pauseBetween, holdEnd, reduced]);

  return state;
}

/** Scroll progress of the whole page, 0..1 (rAF-throttled). */
export function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setP(max > 0 ? h.scrollTop / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return p;
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
