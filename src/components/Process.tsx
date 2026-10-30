import { PROCESS_STEPS } from "../lib/data";
import { useInView } from "../hooks/useInView";
import { cn } from "../utils/cn";
import { Reveal } from "./Reveal";
import { SectionHead } from "./ui";

export function Process() {
  const { ref, inView } = useInView<HTMLOListElement>(0.05);

  return (
    <section id="process" aria-labelledby="process-title" className="border-t border-rule bg-paper">
      <div className="page py-24 lg:py-32">
        <SectionHead
          num="02"
          label="Process"
          className="mx-auto max-w-[760px] lg:text-center lg:[&>p:first-child]:justify-center lg:[&>p:last-child]:mx-auto"
          title={
            <span id="process-title">
              From a locked bootloader
              <br />
              to a <em className="ital">daily</em> driver.
            </span>
          }
          lede="Same order on every device: back up first, read the boot log, and ship nothing I haven't lived with for a week."
        />

        <ol ref={ref} className="relative mt-16 lg:mt-20">
          {/* spine */}
          <span
            aria-hidden
            data-armed=""
            data-inview={inView ? "" : undefined}
            className="spine absolute top-0 bottom-0 left-[15px] w-px bg-ink lg:left-1/2 lg:-translate-x-1/2"
          />
          {PROCESS_STEPS.map((step, i) => {
            const right = i % 2 === 1;
            return (
              <li key={step.phase} className="relative pb-14 pl-14 last:pb-0 lg:grid lg:grid-cols-2 lg:gap-x-20 lg:pl-0">
                <span
                  aria-hidden
                  className="absolute top-0 left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-ink bg-paper font-mono text-xs text-ink tabular lg:left-1/2 lg:-translate-x-1/2"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Reveal
                  delay={80}
                  className={cn("lg:max-w-[460px]", right ? "lg:col-start-2" : "lg:col-start-1 lg:justify-self-end lg:text-right")}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-graphite">
                    {step.phase} <span aria-hidden>·</span> <span className="text-vermilion-ink">{step.version}</span>
                  </p>
                  <h3 className="mt-2 text-[20px] font-semibold leading-snug text-ink">{step.title}</h3>
                  <p className="mt-3 text-lg text-ink-soft">{step.desc}</p>
                  <ul
                    className={cn(
                      "mt-5 inline-flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-rule-strong bg-card px-3.5 py-3 text-left font-mono text-xs text-ink-soft"
                    )}
                  >
                    {step.log.map((l) => (
                      <li key={l.text} className="flex gap-2">
                        <span aria-hidden className={l.marker === "→" ? "text-vermilion-ink" : l.marker === "+" ? "text-moss-ink" : "text-graphite"}>
                          {l.marker}
                        </span>
                        <span>{l.text}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
