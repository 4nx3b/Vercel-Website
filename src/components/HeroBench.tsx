import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "../utils/cn";
import { PARTITIONS, TERMINAL_LINES, type PartitionKey } from "../lib/data";
import { prefersReducedMotion } from "../hooks/useInView";

/* Boot log: one rAF clock, one line every LOG_STEP ms */
const LOG_STEP = 220;

export function BootLog({ root, runId, onDone }: { root: string; runId: number; onDone: () => void }) {
  const lines = [...TERMINAL_LINES, { text: `✔ rooted · ${root}`, tone: "ok" as const }];
  const total = lines.length;
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? total : 1));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(total);
      onDone();
      return;
    }
    let raf = 0;
    let current = 1;
    setShown(1);
    const t0 = performance.now();
    const frame = (now: number) => {
      const n = Math.min(total, Math.floor((now - t0) / LOG_STEP) + 1);
      if (n !== current) {
        current = n;
        setShown(n);
      }
      if (n < total) raf = requestAnimationFrame(frame);
      else onDone();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // runId restarts the clock; a root change re-runs with the new final line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, root]);

  return (
    <div className="m-swap mt-5 overflow-hidden rounded-[var(--radius-md)] border border-rule-strong bg-paper">
      <div aria-hidden className="h-0.5 bg-rule">
        <span
          className="block h-full origin-left bg-vermilion transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)]"
          style={{ transform: `scaleX(${shown / total})` }}
        />
      </div>
      <ol aria-label="Boot log" className="flex flex-col gap-1 px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.slice(0, shown).map((l, i) => (
          <li
            key={`${runId}-${i}`}
            className={cn(
              "m-rise [overflow-wrap:anywhere]",
              l.tone === "ok" && "text-moss-ink",
              l.tone === "warn" && "text-vermilion-ink",
              l.tone === "prompt" && "text-ink"
            )}
            style={{ ["--rise-y" as string]: "4px", ["--m-dur" as string]: "var(--dur-3)" }}
          >
            {l.text}
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="sr-only">
        {shown === total ? lines[total - 1].text : ""}
      </p>
    </div>
  );
}

/** Partition buttons, Flash and the live readout under FIG. 1. */
export function PartitionBench({
  active,
  onPick,
  onFlash,
  flashing,
  flashed,
}: {
  active: PartitionKey | null;
  onPick: (k: PartitionKey) => void;
  onFlash: () => void;
  flashing: boolean;
  flashed: boolean;
}) {
  const note = PARTITIONS.find((x) => x.key === active);
  return (
    <div className="m-rise w-full" style={{ ["--m-delay" as string]: "1.1s" }}>
      <div role="group" aria-label="Inspect a partition" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {PARTITIONS.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={active === x.key}
            onClick={() => onPick(x.key)}
            className={cn(
              "min-h-11 rounded-full border px-3.5 font-mono text-xs transition-colors duration-[var(--dur-2)]",
              active === x.key ? "border-ink bg-ink text-paper" : "border-rule-strong text-ink-soft hover:border-ink hover:text-ink"
            )}
          >
            {x.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onFlash}
          disabled={flashing}
          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink px-4 text-sm font-medium text-ink transition-colors duration-[var(--dur-2)] hover:bg-vermilion disabled:cursor-wait disabled:opacity-60 sm:ml-auto"
        >
          <Zap aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          {flashing ? "Flashing…" : "Flash"}
        </button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-[1.5em] font-mono text-xs text-ink-soft">
        <span aria-hidden className="text-vermilion-ink">› </span>
        {flashing ? (
          "flashing · fastboot flash boot magisk_patched.img"
        ) : flashed ? (
          "flashed · boot patched ✓"
        ) : note ? (
          <>
            <span className="uppercase text-vermilion-ink">{note.label}</span> · {note.note}
          </>
        ) : (
          "hover or pick a partition"
        )}
      </p>
    </div>
  );
}
