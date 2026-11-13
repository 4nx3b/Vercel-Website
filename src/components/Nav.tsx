import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "../utils/cn";
import { useIstClock } from "../hooks/useInView";
import { supportsViewTimeline } from "../hooks/useScrollVar";
import { Wordmark } from "./Wordmark";
import { buttonClass } from "./ui";
import { HeaderPlayer } from "./MusicPlayer";
import { useTheme, type Theme } from "../hooks/useTheme";
import { useContent } from "../content/store";
import { EditingBanner, OwnerPanel } from "../content/OwnerPanel";
import { EText } from "../content/Editable";

/** Two-option Sun / Moon switch for the sidebar. */
function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const opts: { v: Theme; label: string; Icon: typeof Sun }[] = [
    { v: "light", label: "Light", Icon: Sun },
    { v: "dark", label: "Dark", Icon: Moon },
  ];
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="kicker text-ink-soft">Theme</span>
      <div role="group" aria-label="Colour theme" className="flex rounded-full border border-rule-strong p-1">
        {opts.map(({ v, label, Icon }) => (
          <button
            key={v}
            type="button"
            data-ripple
            aria-pressed={theme === v}
            onClick={(e) => setTheme(v, e.currentTarget)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-[var(--dur-2)]",
              theme === v ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            )}
          >
            <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Compact icon toggle for the desktop header. */
function ThemeIconButton() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      data-ripple
      onClick={(e) => setTheme(dark ? "light" : "dark", e.currentTarget)}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className="nav-menu-btn flex h-10 w-10 items-center justify-center rounded-full border border-rule-strong text-[var(--text)] transition-colors duration-[var(--dur-2)] hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]"
    >
      {dark ? <Sun aria-hidden className="h-4 w-4" strokeWidth={1.75} /> : <Moon aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  );
}

export function Nav() {
  const { owner, dirty, editing, content } = useContent();
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const clock = useIstClock();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Frost state with hysteresis, rAF-coalesced; setState only on change.
  // --sp is only written when CSS scroll timelines are missing, because a
  // per-frame custom property on <html> restyles the whole document.
  useEffect(() => {
    const needsVar = !supportsViewTimeline();
    let raf = 0;
    let on = false;
    const root = document.documentElement;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      const next = on ? y > 4 : y > 12;
      if (next !== on) {
        on = next;
        setScrolled(next);
      }
      if (needsVar) {
        const max = Math.max(1, root.scrollHeight - window.innerHeight);
        root.style.setProperty("--sp", Math.min(1, y / max).toFixed(4));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Close on desktop resize
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && !ownerRef.current && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = sheetRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        menuBtn.current?.focus();
      }
      if (e.key === "Tab" && sheetRef.current) {
        const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>("a, button"));
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Header tone: dark frost + light text while a dark (.panel-scope) section sits
  // under the 64px header band. One IntersectionObserver, rebuilt on resize.
  const [tone, setTone] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    let io: IntersectionObserver | null = null;
    const under = new Set<Element>();
    const build = () => {
      io?.disconnect();
      under.clear();
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) under.add(e.target);
            else under.delete(e.target);
          }
          setTone(under.size ? "dark" : "light");
        },
        { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - 64)}px 0px` }
      );
      document.querySelectorAll(".panel-scope").forEach((el) => io!.observe(el));
    };
    build();
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(build, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      io?.disconnect();
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <>
    <header
      data-scrolled={scrolled || undefined}
      data-tone={tone}
      className={cn("site-header sticky top-0 z-50 border-b", scrolled ? "border-rule" : "border-transparent")}
    >
      {/* Permanently mounted: only its opacity changes, so the backdrop never pops in */}
      <div aria-hidden className="nav-frost" />
      <div aria-hidden className="nav-progress" />
      <nav aria-label="Primary" className="page flex h-16 items-center justify-between gap-6">
        <a href="#top" onClick={(event) => editing && event.preventDefault()} aria-label={`${content.brand.name}, back to top`} className="flex min-h-11 items-center rounded-[var(--radius-sm)]">
          <Wordmark />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {content.nav.links.map((l, index) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(event) => editing && event.preventDefault()}
                className="text-[15px] text-[var(--text-2)] transition-colors duration-[var(--dur-2)] hover:text-[var(--text)]"
              >
                <EText path={`nav.links.${index}.label`} label={`Navigation link ${index + 1}`} />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <HeaderPlayer />
          <span className="hidden font-mono text-xs text-[var(--text-3)] tabular 2xl:inline">IST {clock}</span>
          <ThemeIconButton />
          <a href="#ask" onClick={(event) => editing && event.preventDefault()} className={buttonClass("ink", "nav-cta min-h-10 px-5 text-[15px]")}>
            <EText path="nav.cta" label="Header call to action" />
            <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </a>
        </div>

        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <span className="hidden sm:block">
            <HeaderPlayer />
          </span>
          <span className="sm:hidden">
            <HeaderPlayer compact />
          </span>
        </div>
        <button
          ref={menuBtn}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "nav-menu-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rule-strong text-[var(--text)] transition-colors duration-[var(--dur-2)] hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]",
            !owner && "lg:hidden"
          )}
        >
          <Menu aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          {owner && dirty && <span aria-label="Unsaved changes" className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-vermilion" />}
        </button>
      </nav>

    </header>
      <EditingBanner onOpenMenu={() => setOpen(true)} />

      {/* Mobile sheet: outside the header, whose backdrop-filter would trap fixed children */}
      <div
        aria-hidden
        data-open={open}
        onClick={close}
        className={cn("scrim fixed inset-0 z-[60] bg-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]", !owner && "lg:hidden")}
      />
      <div
        id="mobile-sheet"
        ref={sheetRef}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn("sheet fixed inset-y-0 right-0 z-[70] flex w-[min(340px,88vw)] flex-col overflow-y-auto border-l border-ink bg-paper", !owner && "lg:hidden")}
      >
        <div className="flex h-16 items-center justify-between border-b border-rule px-5">
          <span className="kicker">Menu</span>
          <button
            type="button"
            onClick={() => {
              close();
              menuBtn.current?.focus();
            }}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-rule-strong text-ink transition-colors duration-[var(--dur-2)] hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]"
          >
            <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <ul className="flex flex-col px-5 py-4">
          {content.nav.links.map((l, index) => (
            <li key={l.href} className="border-b border-rule">
              <a
                href={l.href}
                onClick={(event) => {
                  if (editing) event.preventDefault();
                  else close();
                }}
                className="flex min-h-14 items-baseline gap-4 py-3 font-display text-page text-ink transition-colors duration-[var(--dur-2)] hover:text-vermilion-ink"
              >
                <span className="font-mono text-xs text-graphite tabular">{String(index + 1).padStart(2, "0")}</span>
                <EText path={`nav.links.${index}.label`} label={`Navigation link ${index + 1}`} />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-4 border-t border-rule p-5">
          <OwnerPanel />
          <ThemeSwitch />
          <span className="font-mono text-xs text-graphite tabular">IST {clock}</span>
          <a href="#ask" onClick={(event) => (editing ? event.preventDefault() : close())} className={buttonClass("ink", "w-full")}>
            <EText path="nav.cta" label="Header call to action" />
            <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </>
  );
}
