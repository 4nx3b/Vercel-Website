import { useCallback, useRef, useState } from "react";
import { ArrowRight, Check, Copy, Play, RotateCcw } from "lucide-react";
import { cn } from "../utils/cn";
import { HERO_CHIPS, type PartitionKey } from "../lib/data";
import { usePointerVars, type PointerFrame } from "../hooks/usePointerVars";
import { FigPhone, type FigPhoneHandle } from "./FigPhone";
import { BootLog, PartitionBench } from "./HeroBench";
import { ActionButton, Button, Figure, Kicker, Pill } from "./ui";

const ROOTS = [
  { key: "magisk", label: "Magisk" },
  { key: "kernelsu", label: "KernelSU" },
] as const;

type RootKey = (typeof ROOTS)[number]["key"];

const H1_LINES = ["The hardware answers", "to you, not its"];
const LENS = 320; // lens window (px), matches .lens
const DOT = 22; // .grid-paper pitch

export function Hero() {
  const [root, setRoot] = useState<RootKey>("magisk");
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<PartitionKey | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [flashed, setFlashed] = useState(false);
  const [runId, setRunId] = useState(0);
  const [running, setRunning] = useState(false);
  const cmd = `init /system/bin/reze --root=${root}`;

  const figRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const lensDots = useRef<HTMLElement>(null);
  const phone = useRef<FigPhoneHandle>(null);

  // FIG. 1 depth parallax: writes --px/--py, no re-renders
  usePointerVars(figRef);

  // Dot-grid lens: a composited window + counter-shifted dots, transforms only
  const moveLens = useCallback((f: PointerFrame) => {
    const lens = lensRef.current;
    const dots = lensDots.current;
    if (!lens || !dots) return;
    if (!f.inside) {
      lens.removeAttribute("data-on");
      return;
    }
    const x = f.x - LENS / 2;
    const y = f.y - LENS / 2;
    const mod = (n: number) => ((n % DOT) + DOT) % DOT;
    lens.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    dots.style.transform = `translate3d(${(-mod(x)).toFixed(1)}px, ${(-mod(y)).toFixed(1)}px, 0)`;
    lens.setAttribute("data-on", "");
  }, []);
  usePointerVars(heroRef, { onFrame: moveLens });

  const pick = useCallback((k: PartitionKey) => {
    setActive(k);
    setFlashed(false);
  }, []);

  const flash = async () => {
    if (flashing) return;
    setFlashing(true);
    setFlashed(false);
    await phone.current?.flash();
    setFlashing(false);
    setFlashed(true);
    setActive("boot");
  };

  const run = () => {
    setRunning(true);
    setRunId((n) => n + 1);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      /* clipboard unavailable — still flash confirmation */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section id="top" ref={heroRef} aria-labelledby="hero-title" className="relative overflow-x-clip">
      <div
        aria-hidden
        className="grid-paper pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_80%)]"
      />
      <div ref={lensRef} aria-hidden className="lens">
        <i ref={lensDots} className="grid-paper" />
      </div>

      <div className="page relative grid gap-x-10 gap-y-14 pt-14 pb-20 lg:grid-cols-12 lg:pt-20 lg:pb-24">
        {/* Copy */}
        <div className="lg:col-span-7">
          <div className="m-rise flex flex-wrap items-center gap-x-5 gap-y-3" style={{ ["--rise-y" as string]: "10px" }}>
            <p className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.18em]">
              <span className="text-vermilion-ink">§ 00</span>
              <span aria-hidden className="h-px w-8 bg-rule-strong" />
              <span className="text-graphite">Android root specialist</span>
            </p>
            <Pill badge="New">Lunaris OS 3.11 · Zephyr</Pill>
          </div>

          <h1
            id="hero-title"
            aria-label="The hardware answers to you, not its manufacturer."
            className="mt-7 font-display text-hero font-normal text-ink max-[359px]:text-[38px]"
          >
            {H1_LINES.map((line, i) => (
              <span
                key={line}
                aria-hidden
                className="m-focus block"
                style={{ ["--i" as string]: i, ["--rise-y" as string]: "22px", ["--m-dur" as string]: "var(--dur-hero)", ["--m-delay" as string]: "0.05s" }}
              >
                {line}
              </span>
            ))}
            <span
              aria-hidden
              className="m-focus block"
              style={{ ["--i" as string]: 2, ["--rise-y" as string]: "22px", ["--m-dur" as string]: "var(--dur-hero)", ["--m-delay" as string]: "0.05s" }}
            >
              <em className="ital">manufacturer</em>.
            </span>
          </h1>

          <p className="m-rise mt-7 max-w-[54ch] text-lede text-ink-soft" style={{ ["--m-delay" as string]: "0.32s" }}>
            I build root modules and custom ROMs that push Android devices past what stock firmware permits,
            then keep them stable enough to daily-drive.
          </p>

          <div className="m-rise mt-9 flex flex-wrap items-center gap-3" style={{ ["--m-delay" as string]: "0.4s" }}>
            <Button href="#work" variant="ink" className="min-h-[52px] px-7 text-[16px]">
              See the work
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button href="#ask" variant="outline" className="min-h-[52px] pl-2.5 pr-7 text-[16px]">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-vermilion">
                <Play className="h-3.5 w-3.5 translate-x-px fill-ink text-ink" strokeWidth={1.5} />
              </span>
              Ask me anything
            </Button>
          </div>

          <p className="m-rise mt-6 font-mono text-xs leading-relaxed text-graphite" style={{ ["--m-delay" as string]: "0.48s" }}>
            Magisk + KernelSU · AOSP &amp; LineageOS · IST, GMT+5:30 · Open for collabs
          </p>
        </div>

        {/* FIG. 1 */}
        <div ref={figRef} className="lg:col-span-5 lg:pt-4">
          <Figure caption="Fig. 1 — A stock device, taken apart" bodyClassName="flex flex-col items-center gap-5">
            <FigPhone ref={phone} active={active} onActive={pick} />
            <PartitionBench active={active} onPick={pick} onFlash={flash} flashing={flashing} flashed={flashed} />
          </Figure>
        </div>

        {/* Init card */}
        <div className="lg:col-span-7">
          <div
            className="m-settle max-w-[760px] rounded-[var(--radius-lg)] border border-ink bg-composer shadow-[var(--shadow-ink)]"
            style={{ ["--m-delay" as string]: "0.45s" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 sm:px-5">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-vermilion" />
                <Kicker className="text-ink-soft">New session</Kicker>
              </span>
              <div role="group" aria-label="Root method" className="flex rounded-full border border-rule-strong p-0.5">
                {ROOTS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    aria-pressed={root === r.key}
                    onClick={() => setRoot(r.key)}
                    className={cn(
                      "min-h-11 rounded-full px-3.5 font-mono text-xs transition-colors duration-[var(--dur-2)]",
                      root === r.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-6 sm:px-5">
              <code aria-label={`Init command: ${cmd}`} className="block break-words font-mono text-[15px] leading-relaxed text-ink">
                <span className="text-vermilion-ink">$</span> {cmd}
                <span aria-hidden className="m-caret ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] bg-ink" />
              </code>
              <p className="mt-2 text-sm text-graphite">Pick a root method, copy the line, run it in a rooted shell.</p>
              {runId > 0 && <BootLog root={root} runId={runId} onDone={() => setRunning(false)} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3 sm:px-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-3 py-1.5 font-mono text-xs text-ink-soft">
                Bootloader unlocked <span aria-hidden className="text-graphite">/</span> your device
              </span>
              <span className="flex flex-wrap items-center gap-2">
              <ActionButton variant="outline" onClick={run} disabled={running} className="min-h-11 px-5">
                {runId > 0 ? <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} /> : <Play aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
                {running ? "Running…" : runId > 0 ? "Re-run" : "Run"}
              </ActionButton>
              <ActionButton variant="accent" onClick={copy} aria-live="polite" className="min-h-11 px-5">
                {copied ? <Check aria-hidden className="h-4 w-4" strokeWidth={2} /> : <Copy aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
                {copied ? "Copied" : "Copy command"}
              </ActionButton>
              </span>
            </div>
          </div>

          <div className="m-rise mt-6 flex flex-wrap items-center gap-2" style={{ ["--m-delay" as string]: "0.7s" }}>
            <Kicker className="mr-2">Try</Kicker>
            {HERO_CHIPS.map((chip) => (
              <span key={chip} className="rounded-full border border-rule-strong px-3 py-1.5 text-sm text-ink-soft">
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Margin note */}
        <aside className="m-rise self-start lg:col-span-4 lg:col-start-9 lg:pt-6" style={{ ["--m-delay" as string]: "0.8s" }}>
          <p className="font-display text-title italic text-vermilion-ink">margin note</p>
          <p className="mt-3 max-w-[44ch] text-lg text-ink-soft">
            Back up before you flash anything. A full nandroid is the only undo button a bootloader
            will ever give you.
          </p>
        </aside>
      </div>
    </section>
  );
}
