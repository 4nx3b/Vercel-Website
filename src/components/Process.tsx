import { cn } from "../utils/cn";
import { PROCESS_STEPS } from "../lib/data";
import { MonoTag, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

const MARKER_TONE: Record<string, string> = {
  "+": "text-metric-green",
  "~": "text-signal-orange",
  "→": "text-pale-stone",
};

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="04" title="Process" note="05 stages · v0.0.1 → v1.x" />

      <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <h2 className="max-w-xl font-geist text-heading-lg tracking-[-0.025em] text-bone">
            From locked bootloader to daily driver.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-sm text-body-sm text-warm-granite">
            The same pipeline every time — versioned like software, because that's what it is.
          </p>
        </Reveal>
      </div>

      {/* Version rail */}
      <div className="mt-10 border-t border-carbon-lift">
        {PROCESS_STEPS.map((step, i) => (
          <Reveal key={step.version} delay={i * 60}>
            <div className="group grid gap-6 border-b border-carbon-lift py-8 transition-colors duration-150 hover:bg-carbon-lift/20 md:grid-cols-[200px_1fr] md:gap-10 md:px-4">
              <div className="flex items-start gap-4 md:flex-col md:gap-2">
                <div className="mt-1.5 flex items-center gap-3 md:gap-0 md:flex-col md:items-start">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 bg-signal-orange transition-transform duration-150 group-hover:rotate-45" />
                  <MonoTag className="text-signal-orange tabular">{step.version}</MonoTag>
                </div>
                <MonoTag className="text-graphite-mid">{step.phase}</MonoTag>
              </div>

              <div>
                <h3 className="font-geist text-[24px] tracking-[-0.025em] text-bone">{step.title}</h3>
                <p className="mt-2 max-w-2xl text-body text-warm-granite">{step.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {step.log.map((line, j) => (
                    <li key={j} className="font-geist-mono text-caption tracking-[-0.02em]">
                      <span className={cn("mr-2", MARKER_TONE[line.marker])}>{line.marker}</span>
                      <span className="text-warm-granite">{line.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
