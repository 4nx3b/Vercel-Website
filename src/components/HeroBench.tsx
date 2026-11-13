import { Zap } from "lucide-react";
import { cn } from "../utils/cn";
import type { PartitionKey } from "../lib/data";
import { useContent } from "../content/store";
import { EText } from "../content/Editable";

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
  const { content } = useContent();
  const partitions = content.hero.partitions;
  const noteIndex = partitions.findIndex((item) => item.key === active);
  const note = partitions[noteIndex];
  return (
    <div className="m-rise w-full" style={{ ["--m-delay" as string]: "1.1s" }}>
      <div role="group" aria-label="Inspect a partition" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {partitions.map((x, index) => (
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
            <EText path={`hero.partitions.${index}.label`} label={`Partition ${x.key} label`} />
          </button>
        ))}
        <button
          type="button"
          onClick={onFlash}
          disabled={flashing}
          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink px-4 text-sm font-medium text-ink transition-colors duration-[var(--dur-2)] hover:bg-vermilion hover:text-on-accent disabled:cursor-wait disabled:opacity-60 sm:ml-auto"
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
            <span className="uppercase text-vermilion-ink"><EText path={`hero.partitions.${noteIndex}.label`} label={`Partition ${note.key} label`} /></span> · <EText path={`hero.partitions.${noteIndex}.note`} label={`Partition ${note.key} note`} />
          </>
        ) : (
          "hover or pick a partition"
        )}
      </p>
    </div>
  );
}
