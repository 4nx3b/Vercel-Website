import { useEffect, useState } from "react";
import { LogOut, PenLine, RotateCcw, Send, Undo2 } from "lucide-react";
import { cn } from "../utils/cn";
import { announceOwner, setOwnerAuth } from "../lib/owner";
import { useContent } from "./store";

/**
 * Owner-only toolbar. Lazy-loaded (see App.tsx), so visitors never download it.
 * Edit toggles inline editing; Escape leaves edit mode.
 */
export default function AdminBar() {
  const { editing, setEditing, dirty, status, publish, discard, reset } = useContent();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editing && !(e.target as HTMLElement)?.isContentEditable) setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, setEditing]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-editing", editing);
    return () => document.documentElement.removeAttribute("data-editing");
  }, [editing]);

  const msg =
    status.kind === "saving" ? "Saving…" : status.kind === "saved" ? status.msg : status.kind === "error" ? status.msg : dirty ? "Unpublished changes" : editing ? "Editing" : "Owner";

  return (
    <div role="toolbar" aria-label="Site editor" className="admin-bar frost">
      <button type="button" aria-pressed={editing} onClick={() => setEditing(!editing)} className={cn("admin-btn", editing && "admin-btn-on")}>
        <PenLine aria-hidden className="h-4 w-4" strokeWidth={1.75} /> {editing ? "Done" : "Edit"}
      </button>
      <button type="button" disabled={!dirty || status.kind === "saving"} onClick={() => void publish()} className="admin-btn admin-btn-accent">
        <Send aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Publish
      </button>
      <button type="button" disabled={!dirty} onClick={discard} className="admin-btn">
        <Undo2 aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Discard
      </button>
      {confirmReset ? (
        <button type="button" onClick={() => { setConfirmReset(false); void reset(); }} className="admin-btn admin-btn-danger">
          Really reset?
        </button>
      ) : (
        <button type="button" onClick={() => setConfirmReset(true)} onBlur={() => setConfirmReset(false)} className="admin-btn">
          <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Reset
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setOwnerAuth(null);
          announceOwner();
        }}
        aria-label="Sign out"
        className="admin-btn"
      >
        <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <span aria-live="polite" className={cn("admin-msg", status.kind === "error" && "admin-msg-err")}>
        {msg}
      </span>
    </div>
  );
}
