import { useEffect, useState } from "react";
import { NAV_LINKS, TICKER_ITEMS } from "./data";
import { useScrollProgressRef } from "./hooks";
import { Marquee } from "./ui";
import { cn } from "./utils/cn";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const progressRef = useScrollProgressRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["about", "skills", "work", "process", "proof", "music", "play", "ask", "links"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-38% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* status ticker */}
      <div className="relative z-[60] border-b border-line bg-ink-950">
        <Marquee duration={42} className="py-1.5">
          {TICKER_ITEMS.map((t) => (
            <span key={t} className="flex items-center gap-3 pr-3 font-mono text-[10px] uppercase tracking-[0.22em] text-fog">
              <span className="h-1 w-1 rotate-45 bg-lime" aria-hidden />
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled ? "border-b border-line bg-ink-900/85 backdrop-blur-md" : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-transparent" aria-hidden>
          <div ref={progressRef} className="h-full w-0 bg-gradient-to-r from-lime via-mint to-skyy transition-[width] duration-150 ease-out" />
        </div>

        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Primary">
          <a href="#top" className="group flex items-baseline gap-2 font-display text-xl font-extrabold tracking-tight text-snow">
            <span>
              thereal<span className="text-lime transition-colors duration-300 group-hover:text-mint">reze</span>
            </span>
            <span className="hidden font-mono text-[10px] font-medium tracking-[0.18em] text-fog-dim transition-colors duration-300 group-hover:text-fog sm:inline">
              @4nx3b
            </span>
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={active === l.href ? "true" : undefined}
                  className={cn(
                    "link-sweep font-mono text-[12px] uppercase tracking-[0.18em] transition-colors duration-300",
                    active === l.href ? "text-lime" : "text-fog hover:text-snow"
                  )}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href="#ask"
              className="group hidden items-center gap-2 border border-lime/50 px-5 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-lime transition-all duration-300 hover:bg-lime hover:text-ink-900 hover:shadow-[0_0_30px_-6px_rgba(200,240,79,0.5)] sm:inline-flex"
            >
              Ask me
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current pulse-dot" aria-hidden />
            </a>

            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border border-line lg:hidden"
            >
              <span className={cn("h-[2px] w-5 bg-snow transition-all duration-300", open && "translate-y-[7px] rotate-45 bg-lime")} />
              <span className={cn("h-[2px] w-5 bg-snow transition-all duration-300", open && "opacity-0")} />
              <span className={cn("h-[2px] w-5 bg-snow transition-all duration-300", open && "-translate-y-[7px] -rotate-45 bg-lime")} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col justify-end bg-ink-950/97 backdrop-blur-xl transition-all duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <nav className="relative px-8 pb-16 pt-28" aria-label="Mobile">
          <ul className="space-y-2">
            {[...NAV_LINKS, { label: "Ask", href: "#ask" }, { label: "Links", href: "#links" }].map((l, i) => (
              <li
                key={l.href}
                className="transition-all duration-500"
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms", opacity: open ? 1 : 0, transform: open ? "none" : "translateY(24px)" }}
              >
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-line py-4 font-display text-4xl font-bold uppercase tracking-tight text-snow transition-colors hover:text-lime"
                >
                  <span className="font-mono text-xs text-fog-dim">0{i + 1}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center font-mono text-[11px] tracking-[0.2em] text-fog-dim">T.ME/THEREALREZE — IST · GMT+5:30</p>
        </nav>
      </div>
    </>
  );
}
