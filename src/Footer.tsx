import { ExternalLink } from "lucide-react";
import { LIVE_SITE, SOCIALS } from "./data";
import { useClock } from "./hooks";
import { Reveal, SectionHead, SocialIcon } from "./ui";
import { cn } from "./utils/cn";

/* ---------- 09 Links ---------- */
function LinksSection() {
  return (
    <section id="links" className="relative border-t border-line bg-ink-950/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="09"
          kicker="links · presence"
          title={
            <>
              Everywhere the <span className="text-lime">signal</span> reaches.
            </>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s, i) => (
            <Reveal key={s.name} delay={i * 40}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="hover-sweep group flex items-center gap-4 border border-line bg-ink-850 p-4.5 transition-all duration-400 hover:-translate-y-0.5 hover:border-lime/45"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-ink-800 text-fog transition-all duration-400 group-hover:border-lime/50 group-hover:text-lime">
                  <SocialIcon kind={s.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-bold tracking-tight text-snow transition-colors group-hover:text-lime">{s.name}</span>
                  <span className="block truncate font-mono text-[11px] text-fog-dim">{s.handle}</span>
                </span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-fog-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export default function Footer() {
  const ist = useClock("Asia/Kolkata");
  return (
    <>
      <LinksSection />

      <footer className="relative border-t border-line bg-ink-950">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim">
            <span className="flex items-center gap-2 text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" aria-hidden />
              all partitions mounted
            </span>
            <span>
              ist <span className="tabular-nums text-snow">{ist}</span>
            </span>
            <span>signal v3.0</span>
            <span className={cn("ml-auto hidden sm:inline")}>SIGNAL data system · dark-first</span>
          </div>
        </div>

        <div className="relative overflow-hidden border-t border-line" aria-hidden>
          <p className="select-none whitespace-nowrap text-center font-display text-[clamp(3.6rem,15vw,12rem)] font-extrabold uppercase leading-[0.85] tracking-tight text-snow/[0.05] transition-colors duration-700 hover:text-lime/10">
            thereal<span className="text-lime/10">reze</span>
          </p>
        </div>

        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim sm:px-8">
            <span>© 2026 therealreze — hardware answers to you</span>
            <span className="flex gap-6">
              <a href={LIVE_SITE} target="_blank" rel="noreferrer" className="link-sweep text-fog hover:text-snow">live site</a>
              <a href="https://github.com/4nx3b" target="_blank" rel="noreferrer" className="link-sweep text-fog hover:text-snow">source</a>
              <a href="#top" className="transition-colors hover:text-lime">↑ back to boot</a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
