import { FormEvent, useState } from "react";
import { ExternalLink, Send } from "lucide-react";
import { LIVE_SITE, SOCIALS } from "./data";
import { useClock } from "./hooks";
import { LineReveal, Magnetic, Reveal, SectionHead, SocialIcon } from "./ui";
import { cn } from "./utils/cn";

/* ---------- 08 Ask — final CTA ---------- */
function AskSection() {
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (handle.trim().length < 2 || msg.trim().length < 8) {
      setState("error");
      return;
    }
    setState("done");
  };

  return (
    <section id="ask" className="relative overflow-hidden border-t border-line py-28 md:py-36">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" aria-hidden />
      <div className="glow-breathe pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.06] blur-[130px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-lime">
                <span className="text-fog-dim">08 /</span> ask · anything
              </p>
            </Reveal>
            <h2 className="mt-6 font-display text-[clamp(2.6rem,8vw,6rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-snow">
              <LineReveal delay={80}>Let's root</LineReveal>
              <LineReveal delay={200}>
                <span className="text-lime">something</span> <span className="text-outline">real.</span>
              </LineReveal>
            </h2>
            <Reveal delay={300}>
              <p className="mt-7 max-w-md text-base leading-relaxed text-fog md:text-lg">
                Drop a question, a collab idea, a ROM request or a module bug report. Fastest reply on Telegram —
                usually within a day, unless a build is compiling.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Magnetic>
                  <a
                    href="https://t.me/therealreze"
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex skew-x-[-6deg] items-center gap-3 bg-lime px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.14em] text-ink-900 transition-all duration-300 hover:bg-lime-deep hover:shadow-[0_0_60px_-10px_rgba(200,240,79,0.6)] [&>*]:skew-x-[6deg]"
                  >
                    <span className="inline-flex items-center gap-3">
                      <SocialIcon kind="telegram" className="h-4 w-4" />
                      t.me/therealreze
                    </span>
                  </a>
                </Magnetic>
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fog-dim">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime pulse-dot" aria-hidden />
                  open for collabs
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal variant="right" delay={200}>
            {state === "done" ? (
              <div className="flex h-full flex-col items-start justify-center border border-mint/40 bg-mint/[0.06] p-8" role="status">
                <span className="flex h-12 w-12 items-center justify-center bg-mint text-ink-900">
                  <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden><path d="M2.5 8.5 6 12l7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
                <p className="mt-5 font-display text-2xl font-bold uppercase text-snow">Question routed.</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog">
                  Expect a reply on Telegram — usually within a day, unless a build is compiling.
                </p>
                <button type="button" onClick={() => { setState("idle"); setHandle(""); setMsg(""); }} className="link-sweep mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-lime">
                  send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="border border-line bg-ink-850/90 p-7 backdrop-blur-sm sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog-dim">$ new question --from you</p>
                <label htmlFor="ask-handle" className="mt-5 block font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog-dim">your handle</label>
                <input
                  id="ask-handle"
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value); if (state === "error") setState("idle"); }}
                  placeholder="@you"
                  className="mt-2 w-full border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim transition-colors focus:border-lime/60 focus:outline-none"
                />
                <label htmlFor="ask-msg" className="mt-5 block font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog-dim">the question</label>
                <textarea
                  id="ask-msg"
                  value={msg}
                  onChange={(e) => { setMsg(e.target.value); if (state === "error") setState("idle"); }}
                  placeholder="Why does my vendor partition hate me?"
                  rows={4}
                  className="mt-2 w-full resize-none border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim transition-colors focus:border-lime/60 focus:outline-none"
                />
                {state === "error" && (
                  <p className="mt-3 font-mono text-[11px] text-coral" role="alert">▲ handle + at least a sentence, please</p>
                )}
                <button
                  type="submit"
                  className="group mt-6 inline-flex skew-x-[-6deg] items-center gap-2.5 bg-lime px-7 py-3.5 font-mono text-[12.5px] font-bold uppercase tracking-[0.14em] text-ink-900 transition-all duration-300 hover:bg-lime-deep [&>*]:skew-x-[6deg]"
                >
                  <span className="inline-flex items-center gap-2.5">
                    Transmit
                    <Send className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </button>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">
                  live delivery via Telegram webhook on <a href={LIVE_SITE} target="_blank" rel="noreferrer" className="text-fog hover:text-lime">the site</a>
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

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
      <AskSection />
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
