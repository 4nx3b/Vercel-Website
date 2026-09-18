import { REPOS, PROJECTS } from "./data";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

const ACCENT_TEXT: Record<string, string> = {
  lime: "text-lime",
  mint: "text-mint",
  skyy: "text-skyy",
  coral: "text-coral",
};
const ACCENT_BORDER: Record<string, string> = {
  lime: "border-lime/45",
  mint: "border-mint/45",
  skyy: "border-skyy/45",
  coral: "border-coral/45",
};
const ACCENT_BG: Record<string, string> = {
  lime: "bg-lime/10",
  mint: "bg-mint/10",
  skyy: "bg-skyy/10",
  coral: "bg-coral/10",
};
const LANG_DOT: Record<string, string> = {
  Kotlin: "bg-[#a97bff]",
  JavaScript: "bg-[#f1e05a]",
  Python: "bg-[#6da3e8]",
  Makefile: "bg-[#7fb069]",
};

export default function Work() {
  return (
    <section id="work" className="relative border-t border-line bg-ink-950/50 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" aria-hidden />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="03"
          kicker="work · selected releases"
          title={
            <>
              Shipped to real devices —<br className="hidden md:block" /> and still <span className="text-lime">com&shy;pounding.</span>
            </>
          }
          note="Every build below is named, dated and reproducible. No vapor, no private-mirror mystique."
        />

        {/* stacked cards */}
        <div className="relative">
          {PROJECTS.map((p, i) => (
            <article key={p.client} className="sticky mb-8 md:mb-12" style={{ top: `calc(96px + ${i * 26}px)`, zIndex: i + 1 }}>
              <div className="group grid overflow-hidden border border-line bg-ink-850 shadow-[0_-18px_60px_-30px_rgba(0,0,0,0.9)] transition-colors duration-500 hover:border-lime/30 lg:grid-cols-[1fr_1.05fr]">
                <div className="relative flex flex-col justify-between p-7 sm:p-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      <span className={cn("border px-2.5 py-1", ACCENT_BORDER[p.accent], ACCENT_TEXT[p.accent], ACCENT_BG[p.accent])}>{p.version}</span>
                      <span className="text-fog-dim">
                        {p.client} — {p.sector}
                      </span>
                    </div>
                    <h3 className="mt-6 max-w-md font-display text-2xl font-bold leading-[1.08] tracking-tight text-snow sm:text-3xl">{p.title}</h3>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fog">{p.desc}</p>

                    <div className="mt-7 grid grid-cols-3 gap-4">
                      {p.metrics.map((m) => (
                        <div key={m.label} className="border-l border-line pl-3">
                          <p className={cn("font-display text-xl font-extrabold tracking-tight sm:text-2xl", ACCENT_TEXT[p.accent])}>{m.value}</p>
                          <p className="mt-0.5 font-mono text-[9.5px] uppercase leading-snug tracking-[0.14em] text-fog-dim">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <ul className="flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <li key={t} className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                          {t}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className={cn("inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 hover:opacity-80", ACCENT_TEXT[p.accent])}
                    >
                      {p.linkLabel}
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>

                  <span className="pointer-events-none absolute -bottom-6 right-4 select-none font-display text-[7rem] font-extrabold leading-none text-snow/[0.04] sm:text-[9rem]" aria-hidden>
                    {p.index}
                  </span>
                </div>

                <div className="relative min-h-[240px] overflow-hidden border-t border-line lg:min-h-[420px] lg:border-l lg:border-t-0">
                  <img src={p.image} alt={`${p.client} — ${p.title}`} className="kenburns absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent lg:bg-gradient-to-r" aria-hidden />
                  <span className={cn("absolute right-4 top-4 border bg-ink-950/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-sm", ACCENT_BORDER[p.accent], ACCENT_TEXT[p.accent])}>
                    {p.sector}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* repo index */}
        <div className="mt-16">
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-snow">Repo index</h3>
              <a href="https://github.com/4nx3b" target="_blank" rel="noreferrer" className="link-sweep font-mono text-[11px] uppercase tracking-[0.2em] text-lime">
                github.com/4nx3b ↗
              </a>
            </div>
          </Reveal>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.22em] text-fog-dim">
                  <th className="py-3 pr-4 font-medium">repository</th>
                  <th className="py-3 pr-4 font-medium">language</th>
                  <th className="py-3 pr-4 font-medium">stars</th>
                  <th className="py-3 pr-4 font-medium">updated</th>
                  <th className="py-3 font-medium">origin</th>
                </tr>
              </thead>
              <tbody>
                {REPOS.map((r, i) => (
                  <Reveal key={r.name} delay={i * 40}>
                    <tr className="group border-b border-line transition-colors duration-300 hover:bg-ink-850/70">
                      <td className="py-3.5 pr-4">
                        <a href={r.url} target="_blank" rel="noreferrer" className="font-mono text-[13px] font-bold text-snow transition-colors group-hover:text-lime">
                          {r.name}
                        </a>
                        <span className="ml-3 hidden max-w-[380px] truncate align-middle font-body text-[12.5px] text-fog-dim lg:inline">{r.desc}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="flex items-center gap-2 font-mono text-[11px] text-fog">
                          <span className={cn("h-2 w-2 rounded-full", LANG_DOT[r.lang] ?? "bg-fog-dim")} aria-hidden />
                          {r.lang}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-[12px] tabular-nums text-fog">{r.stars > 0 ? `★ ${r.stars}` : "—"}</td>
                      <td className="py-3.5 pr-4 font-mono text-[12px] tabular-nums text-fog-dim">{r.updated}</td>
                      <td className="py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">{r.fork ? "fork" : "own"}</td>
                    </tr>
                  </Reveal>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
