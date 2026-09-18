import { useRef, useState } from "react";
import { SKILLS, SKILL_CATS } from "./data";
import { useFinePointer, usePrefersReducedMotion } from "./hooks";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

export default function Skills() {
  const [cat, setCat] = useState("ALL");
  const [active, setActive] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const started = useRef(false);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const showPreview = fine && !reduced;

  const items = cat === "ALL" ? SKILLS : SKILLS.filter((s) => s.cat === cat);

  const onLeave = () => {
    setActive(null);
    started.current = false;
  };

  const onMove = (e: React.MouseEvent) => {
    if (!showPreview || !previewRef.current) return;
    target.current = { x: e.clientX, y: e.clientY };
    if (!started.current) {
      pos.current = { ...target.current };
      started.current = true;
    }
    cancelAnimationFrame(raf.current);
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (previewRef.current) {
        previewRef.current.style.transform = `translate(${pos.current.x + 28}px, ${pos.current.y - 110}px) rotate(3deg)`;
      }
      if (Math.abs(target.current.x - pos.current.x) > 0.5 || Math.abs(target.current.y - pos.current.y) > 0.5) {
        raf.current = requestAnimationFrame(loop);
      }
    };
    raf.current = requestAnimationFrame(loop);
  };

  return (
    <section id="skills" className="relative border-t border-line py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            index="02"
            kicker="skills · toolbox"
            title={
              <>
                Twelve ways to open <span className="text-lime">a bootloader.</span>
              </>
            }
          />
          <Reveal delay={200} className="mb-14 hidden lg:mb-20 lg:block">
            <p className="max-w-[260px] border-l-2 border-lime/50 pl-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-fog-dim">
              Hover a line —<br />
              every skill carries a capture
            </p>
          </Reveal>
        </div>

        {/* category tabs */}
        <Reveal className="mb-10">
          <div role="tablist" aria-label="Skill categories" className="flex flex-wrap gap-2">
            {SKILL_CATS.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => { setCat(c); setActive(null); }}
                className={cn(
                  "skew-x-[-6deg] border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-300 [&>span]:inline-block [&>span]:skew-x-[6deg]",
                  cat === c ? "border-lime bg-lime text-ink-900" : "border-line text-fog hover:border-lime/50 hover:text-lime"
                )}
              >
                <span>{c}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="relative border-t border-line" onMouseMove={onMove} onMouseLeave={onLeave}>
          {items.map((c, i) => (
            <Reveal key={c.name} delay={i * 50}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cn(
                  "group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-line px-2 py-6 text-left transition-all duration-500 sm:gap-8 sm:px-4 md:py-7",
                  active === i ? "bg-ink-850/70" : "hover:bg-ink-850/50"
                )}
                aria-expanded={active === i}
              >
                <span className={cn("font-mono text-xs tracking-[0.2em] transition-colors duration-300", active === i ? "text-lime" : "text-fog-dim")}>
                  /{String(i + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden>{c.icon}</span>
                    <span className="block font-display text-2xl font-bold uppercase tracking-tight text-snow transition-all duration-500 group-hover:translate-x-2 group-hover:text-lime sm:text-3xl">
                      {c.name}
                    </span>
                  </span>
                  <span className={cn("mt-1.5 block max-w-2xl overflow-hidden font-mono text-[12px] leading-relaxed text-fog transition-all duration-500", active === i ? "max-h-16 opacity-100" : "max-h-0 opacity-0 md:max-h-16 md:opacity-70")}>
                    {c.sub}
                  </span>
                </span>

                <span className="flex items-center gap-5">
                  <span className={cn("border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-300", active === i ? "border-lime/40 text-lime" : "border-line text-fog-dim")}>
                    {c.cat}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    className={cn("h-5 w-5 shrink-0 transition-all duration-500", active === i ? "text-lime" : "-translate-x-2 translate-y-2 text-fog-dim group-hover:translate-x-0 group-hover:-translate-y-0 group-hover:text-snow")}
                    aria-hidden
                  >
                    <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </Reveal>
          ))}

          {showPreview && (
            <div
              ref={previewRef}
              className={cn(
                "pointer-events-none fixed left-0 top-0 z-30 hidden w-[300px] overflow-hidden border border-line shadow-[0_30px_70px_-20px_rgba(0,0,0,0.85)] transition-opacity duration-300 lg:block",
                active !== null ? "opacity-100" : "opacity-0"
              )}
              aria-hidden
            >
              {active !== null && items[active] && (
                <>
                  <img src={items[active].image} alt="" className="h-[190px] w-full object-cover" loading="lazy" />
                  <div className="flex items-center justify-between bg-ink-850 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                    <span>{items[active].name}</span>
                    <span className="text-fog-dim">{items[active].cat}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <Reveal className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fog-dim">
            {items.length} / {SKILLS.length} modules loaded — filter: <span className="text-lime">{cat.toLowerCase()}</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
