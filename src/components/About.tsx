import { ABOUT_PARAS } from "../lib/data";
import { MonoTag, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-[1200px] px-6 py-24 lg:py-28">
      <SectionHead index="01" title="About" note="Operator profile · IST" />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-geist text-heading-lg tracking-[-0.025em] text-bone">
              Rooted since day one<span className="text-signal-orange">.</span>
            </h2>
          </Reveal>
          <div className="mt-7 space-y-5">
            {ABOUT_PARAS.map((para, i) => (
              <Reveal key={i} delay={i * 70}>
                <p className={i === 0 ? "text-body text-pale-stone" : "text-body text-warm-granite"}>{para}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={220}>
            <MonoTag className="mt-8 block text-graphite-mid">— therealreze · Android root specialist · IST GMT+5:30</MonoTag>
          </Reveal>
        </div>

        {/* Compact identity readout */}
        <Reveal delay={140}>
          <div className="lift w-full rounded-lg border border-carbon-lift bg-carbon-lift/20 backdrop-blur-sm lg:w-[260px]">
            {[
              ["callsign", "therealreze"],
              ["discipline", "android root / rom"],
              ["timezone", "IST · GMT+5:30"],
              ["status", "open for collabs"],
            ].map(([k, v], i) => (
              <div key={k} className={`flex items-baseline justify-between gap-6 px-5 py-3.5 ${i > 0 ? "border-t border-carbon-lift" : ""}`}>
                <MonoTag className="text-graphite-mid">{k}</MonoTag>
                <MonoTag className={k === "status" ? "text-metric-green" : "text-pale-stone"}>{v}</MonoTag>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
