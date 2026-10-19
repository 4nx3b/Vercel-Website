import { useState } from "react";
import { BootFrame } from "./BootFrame";
import { ButtonDark, ButtonGhost, MonoTag, StatusDot } from "./ui";
import { CheckIcon, CopyIcon } from "./icons";
import { HERO_CHIPS, HERO_COPY } from "../lib/data";

const INIT_CMD = "init /system/bin/reze";

export function Hero() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INIT_CMD);
    } catch {
      /* clipboard unavailable — still flash confirmation */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section id="top" className="relative overflow-hidden">
      {/* The void, faintly gridded — an instrument sheet, not a blank page */}
      <div aria-hidden className="dotgrid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-[1200px] gap-14 px-6 pt-36 pb-24 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pt-40 lg:pb-28">
        {/* Dispatch copy */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <StatusDot tone="green" />
            <MonoTag className="text-pale-stone">status: open for collabs</MonoTag>
          </div>

          <h1 className="mt-6 font-geist text-[44px] leading-[1.05] tracking-[-0.035em] text-bone sm:text-[56px] lg:text-display">
            The hardware answers to you
            <span className="text-signal-orange">.</span>
          </h1>

          <p className="mt-6 max-w-md text-body text-warm-granite">{HERO_COPY}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonDark href="#work">View Work</ButtonDark>
            <ButtonGhost href="#ask">Ask Me Anything</ButtonGhost>
          </div>

          {/* Init strip with copy-to-clipboard */}
          <button
            type="button"
            onClick={copy}
            className="group mt-6 flex w-full max-w-md items-center justify-between gap-4 rounded-sm border border-carbon-lift bg-carbon-lift/30 px-4 py-3 text-left transition-colors duration-150 hover:border-ash-stroke"
            aria-label="Copy init command"
          >
            <code className="truncate font-geist-mono text-caption tracking-[-0.02em] text-pale-stone">
              <span className="text-signal-orange">$</span> {INIT_CMD}
            </code>
            <span className="flex shrink-0 items-center gap-1.5">
              <MonoTag className={copied ? "text-metric-green" : "text-graphite-mid transition-colors duration-150 group-hover:text-pale-stone"}>
                {copied ? "Copied" : "Copy"}
              </MonoTag>
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-metric-green" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5 text-graphite-mid transition-colors duration-150 group-hover:text-pale-stone" />
              )}
            </span>
          </button>

          {/* Discipline chips */}
          <div className="mt-8 flex flex-wrap gap-2">
            {HERO_CHIPS.map((chip) => (
              <span
                key={chip}
                className="border border-carbon-lift px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone"
              >
                {chip}
              </span>
            ))}
          </div>

          <MonoTag className="mt-8 block text-graphite-mid">
            IST · GMT+5:30<span className="mx-2">·</span>rooted since day one<span className="mx-2">·</span>magisk + kernelsu
          </MonoTag>
        </div>

        {/* FIG.01 — the boot panel is the imagery */}
        <div className="lg:col-span-7">
          <BootFrame />
          <div className="mt-3 flex items-center justify-between">
            <MonoTag className="text-graphite-mid">FIG.01 — Boot sequence</MonoTag>
            <MonoTag className="text-graphite-mid">Realme GT Neo 3 · OnePlus 10R</MonoTag>
          </div>
        </div>
      </div>
    </section>
  );
}
