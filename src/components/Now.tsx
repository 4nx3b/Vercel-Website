import { useEffect, useState } from "react";
import { INTERESTS, QUOTES } from "../lib/data";
import { ArrowRight, SkillGlyphs } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

export function Now() {
  const [i, setI] = useState(0);

  // Quotes rotate on a slow fuse; clicking advances immediately.
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[i];

  return (
    <section id="now" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="06" title="Now" note="Currently orbiting" />

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Rotating quote — the one bright object in the room */}
        <Reveal>
          <button
            type="button"
            onClick={() => setI((n) => (n + 1) % QUOTES.length)}
            className="grain group block w-full rounded-lg bg-bone p-8 text-left sm:p-10"
            aria-label="Next quote"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <StatusDot tone="orange" />
                <MonoTag className="text-obsidian-canvas">Now playing — thought</MonoTag>
              </span>
              <MonoTag className="text-graphite-mid tabular">{String(i + 1).padStart(2, "0")} / {String(QUOTES.length).padStart(2, "0")}</MonoTag>
            </div>

            <blockquote key={i} className="animate-log-in mt-10 min-h-[120px] font-geist text-heading tracking-[-0.031em] text-obsidian-canvas sm:min-h-[100px]">
              “{q.text}”
            </blockquote>
            <MonoTag className="mt-6 block text-graphite-mid">— {q.author}</MonoTag>

            <span className="mt-10 flex items-center gap-2 border-t border-obsidian-canvas/15 pt-5">
              <MonoTag className="text-obsidian-canvas transition-colors duration-150 group-hover:text-carbon-lift">Next transmission</MonoTag>
              <ArrowRight className="h-3 w-3 text-obsidian-canvas transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </button>
        </Reveal>

        {/* Interests */}
        <div className="flex flex-col gap-6">
          {INTERESTS.map((item, idx) => {
            const Glyph = SkillGlyphs[item.glyph];
            return (
              <Reveal key={item.title} delay={idx * 70} className="flex-1">
                <div className="group flex h-full items-start gap-5 rounded-lg border border-carbon-lift p-5 transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-ash-stroke hover:bg-carbon-lift/40">
                  <Glyph className="mt-0.5 h-5 w-5 shrink-0 text-pale-stone transition-colors duration-150 group-hover:text-signal-orange" />
                  <div>
                    <h3 className="font-geist text-[20px] tracking-[-0.02em] text-bone">{item.title}</h3>
                    <p className="mt-1.5 text-body-sm text-warm-granite">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
