import { useEffect, useState } from "react";
import { Layers, Loader2, LogOut, PenLine, RotateCcw, Send, Undo2 } from "lucide-react";
import { cn } from "../utils/cn";
import { announceOwner, setOwnerAuth } from "../lib/owner";
import { useContent } from "./store";
import { SiteBuilder } from "./SiteBuilder";

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

/** Owner controls, shown inside the sidebar sheet (all breakpoints) once signed in. */
export function OwnerPanel() {
  const { owner, editing, setEditing, dirty, status, publish, discard, reset, publishedAt } = useContent();
  const [confirmReset, setConfirmReset] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!owner) return null;

  const busy = status.kind === "saving";
  return (
    <section aria-label="Owner" className="owner-panel flex flex-col gap-3 border-b border-rule pb-5">
      <div className="flex items-center justify-between">
        <span className="kicker text-ink-soft">Owner</span>
        {dirty && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-vermilion-ink">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-vermilion" /> unsaved
          </span>
        )}
      </div>

      <button
        type="button"
        aria-pressed={editing}
        onClick={() => setEditing(!editing)}
        className={cn("owner-btn justify-between", editing && "owner-btn-on")}
      >
        <span className="inline-flex items-center gap-2">
          <PenLine aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Edit mode
        </span>
        <span aria-hidden className={cn("owner-switch", editing && "owner-switch-on")} />
      </button>

      <button type="button" onClick={() => { setEditing(true); setBuilderOpen(true); }} className="owner-btn owner-btn-builder">
        <Layers aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Open page builder
      </button>

      <button type="button" disabled={!dirty || busy} onClick={() => void publish()} className="owner-btn owner-btn-accent">
        {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <Send aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
        {busy ? "Publishing…" : "Publish"}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={!dirty || busy} onClick={discard} className="owner-btn">
          <Undo2 aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Discard
        </button>
        {confirmReset ? (
          <button type="button" onClick={() => { setConfirmReset(false); void reset(); }} onBlur={() => setConfirmReset(false)} className="owner-btn owner-btn-danger">
            Really reset?
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => setConfirmReset(true)} className="owner-btn">
            <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Reset
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setOwnerAuth(null);
          announceOwner();
        }}
        className="owner-btn"
      >
        <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Sign out
      </button>

      <p aria-live="polite" className={cn("font-mono text-xs", status.kind === "error" || status.kind === "warn" ? "text-vermilion-ink" : "text-graphite")}>
        {status.msg ? status.msg : `Last published ${ago(publishedAt)}`}
      </p>
      <SiteBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </section>
  );
}

/** Slim cue under the header while editing (not floating). */
export function EditingBanner({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { editing, dirty } = useContent();
  if (!editing) return null;
  return (
    <div role="status" className="editing-banner">
      <span>
        <strong>Editing</strong>
        {dirty ? " · unsaved changes" : " · tap any outlined text or image"}
      </span>
      <button type="button" onClick={onOpenMenu} className="underline underline-offset-4">
        Open menu
      </button>
    </div>
  );
}
