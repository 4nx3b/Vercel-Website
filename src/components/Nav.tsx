import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { NAV_LINKS } from "../lib/data";
import { ArrowRight } from "./icons";
import { useIstClock } from "../hooks/useInView";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const clock = useIstClock();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        scrolled || open
          ? "border-b border-carbon-lift bg-obsidian-canvas/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Wordmark */}
        <a href="#top" className="group flex items-center gap-2.5" aria-label="therealreze home">
          <span
            aria-hidden
            className="h-2 w-2 bg-signal-orange transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:rotate-45"
          />
          <span className="font-geist-mono text-caption uppercase tracking-[0.18em] text-bone">therealreze</span>
          <span className="hidden font-geist-mono text-caption uppercase tracking-[-0.02em] text-graphite-mid md:inline">
            v3.11
          </span>
        </a>

        {/* Links */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="group relative font-geist text-body-sm uppercase text-bone transition-colors duration-150 hover:text-chalk"
            >
              <span
                aria-hidden
                className="absolute -left-3 top-1/2 h-1 w-1 -translate-y-1/2 bg-signal-orange opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="hidden font-geist-mono text-caption uppercase tracking-[-0.02em] text-graphite-mid tabular xl:inline">
            IST {clock}
          </span>
          <a
            href="#ask"
            className="inline-flex h-8 items-center rounded-sm bg-chalk px-3.5 text-body-sm text-obsidian-canvas transition-colors duration-150 hover:bg-bone"
          >
            AMA
          </a>
          <a
            href="https://t.me/therealreze"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-8 items-center gap-2 border border-ash-stroke px-3.5 text-body-sm text-bone transition-colors duration-150 hover:border-pale-stone hover:text-chalk"
          >
            Telegram
            <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span className={cn("h-px w-5 bg-bone transition-transform duration-150", open && "translate-y-[3.5px] rotate-45")} />
          <span className={cn("h-px w-5 bg-bone transition-transform duration-150", open && "-translate-y-[3.5px] -rotate-45")} />
        </button>
      </nav>

      {/* Mobile panel */}
      <div
        className={cn(
          "overflow-hidden bg-obsidian-canvas transition-[max-height] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden",
          open ? "max-h-[420px] border-t border-carbon-lift" : "max-h-0"
        )}
      >
        <div className="flex flex-col px-6 py-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-carbon-lift py-3 font-geist text-body-sm uppercase text-bone last:border-b-0"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-4 pb-2">
            <a href="#ask" onClick={() => setOpen(false)} className="inline-flex h-9 flex-1 items-center justify-center rounded-sm bg-chalk px-4 text-body-sm text-obsidian-canvas">
              AMA
            </a>
            <a href="https://t.me/therealreze" target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center border border-ash-stroke px-4 text-body-sm text-bone">
              Telegram
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
