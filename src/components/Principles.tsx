import { ABOUT_PARAS, PROOF_CARDS } from "../lib/data";
import { useCountUp, useInView } from "../hooks/useInView";
import { Reveal } from "./Reveal";
import { Kicker, SectionMark } from "./ui";

const STATS = [
  { target: 12, decimals: 0, suffix: "", label: "skills loaded across five layers of the stack" },
  { target: 9, decimals: 0, suffix: "", label: "public repositories, each one buildable from source" },
  { target: 40, decimals: 0, suffix: "★", label: "stars on ArchiveTune, the music player" },
  { target: 2, decimals: 0, suffix: "", label: "devices Lunaris OS 3.11 ships for today" },
];

function Stat({ target, decimals, suffix, label, start }: (typeof STATS)[number] & { start: boolean }) {
  const v = useCountUp(start, target, decimals);
  return (
    <div className="flex flex-col-reverse border-b border-rule p-6 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:[&:not(:last-child)]:border-r">
      <dt className="mt-3 max-w-[26ch] text-sm text-ink-soft">{label}</dt>
      <dd className="font-display text-[clamp(48px,3vw+28px,72px)] leading-none text-ink tabular">
        <span aria-hidden>{v}{suffix}</span>
        <span className="sr-only">{target}{suffix}</span>
      </dd>
    </div>
  );
}

const PICKS = [PROOF_CARDS[0], PROOF_CARDS[2]];

export function Principles() {
  const { ref, inView } = useInView<HTMLDListElement>(0.3);

  return (
    <section id="principles" aria-labelledby="principles-title" className="sunk-scope border-t border-rule">
      <div className="page py-24 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionMark num="05" label="Principles" />
            <Reveal as="h2" id="principles-title" variant="focus" delay={60} className="mt-6 font-display text-display font-normal text-ink">
              Root is a
              <br />
              <em className="ital">responsibility</em>.
            </Reveal>
          </Reveal>
          <Reveal delay={80}>
            <Kicker className="text-ink-soft">How every build gets shipped</Kicker>
          </Reveal>
        </div>

        <Reveal delay={100} className="mt-12">
          <dl ref={ref} className="grid border-y border-ink bg-paper sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <Stat key={s.label} {...s} start={inView} />
            ))}
          </dl>
        </Reveal>

        <div className="mt-20 grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <figure className="m-0">
              <blockquote className="relative pl-0 lg:pl-12">
                <span aria-hidden className="absolute -top-2 left-0 hidden font-display text-[64px] leading-none text-vermilion-ink lg:block">
                  “
                </span>
                <p className="font-display text-[clamp(30px,1.8vw+20px,48px)] leading-[1.12] tracking-[-0.01em] text-ink">
                  Your hardware should answer to you, not its manufacturer.
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 lg:pl-12">
                <span aria-hidden className="font-display text-title text-vermilion-ink">§</span>
                <span className="kicker text-ink-soft">Rule zero</span>
              </figcaption>
            </figure>

            <div className="mt-12 max-w-[64ch] space-y-5 lg:pl-12">
              {ABOUT_PARAS.map((para, i) => (
                <p key={i} className={i === 0 ? "text-lg text-ink" : "text-lg text-ink-soft"}>
                  {para}
                </p>
              ))}
            </div>
          </Reveal>

          <ul className="flex flex-col border-t border-ink">
            {PICKS.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 70} className="border-b border-rule py-8">
                <span className="font-mono text-xs text-ink-soft tabular">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-title font-semibold leading-tight text-ink">{c.title}.</h3>
                <p className="mt-3 max-w-[48ch] text-lg text-ink-soft">{c.desc}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
