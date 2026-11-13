import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CircleUserRound, ImagePlus, Layers, Loader2, LogIn, LogOut, PenLine, RotateCcw, Send, Undo2, X } from "lucide-react";
import { cn } from "../utils/cn";
import { announceOwner, setOwnerAuth } from "../lib/owner";
import { cachedOwnerAvatar, loadOwnerAvatar, saveOwnerAvatar, useContent } from "./store";
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

const MAX_AVATAR_FILE_BYTES = 12 * 1024 * 1024;
const MAX_AVATAR_BLOB_BYTES = 150 * 1024;

async function imageFileToAvatar(file: File): Promise<string> {
  if (file.size > MAX_AVATAR_FILE_BYTES) throw new Error("Choose an image smaller than 12 MB.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  }
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the image.");

    for (const edge of [512, 384, 256, 192, 128]) {
      const scale = Math.min(1, edge / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const [type, quality] of [["image/webp", 0.84], ["image/webp", 0.68], ["image/png", 1]] as const) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
        if (!blob || !["image/png", "image/jpeg", "image/webp"].includes(blob.type) || blob.size > MAX_AVATAR_BLOB_BYTES) continue;
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the prepared image."));
          reader.onerror = () => reject(new Error("Could not read the prepared image."));
          reader.readAsDataURL(blob);
        });
      }
    }
    throw new Error("Could not resize that image enough. Try a smaller picture.");
  } finally {
    image.close();
  }
}

/** Owner controls and the owner-only sign-in entry, inside the sidebar sheet. */
export function OwnerPanel() {
  const { owner, editing, setEditing, dirty, status, publish, discard, reset, publishedAt } = useContent();
  const [confirmReset, setConfirmReset] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [avatar, setAvatar] = useState(() => cachedOwnerAvatar());
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!owner) {
      setAvatar(cachedOwnerAvatar());
      setProfileBusy(false);
      setProfileStatus("");
      return;
    }
    let active = true;
    setAvatar(cachedOwnerAvatar());
    setProfileBusy(true);
    setProfileStatus("Loading saved icon…");
    void loadOwnerAvatar().then((savedAvatar) => {
      if (!active) return;
      setAvatar(savedAvatar);
      setProfileStatus("");
    }).catch((error) => {
      if (active) setProfileStatus((error as Error).message || "Could not load the saved profile icon.");
    }).finally(() => {
      if (active) setProfileBusy(false);
    });
    return () => { active = false; };
  }, [owner]);

  const openOwnerLogin = () => window.dispatchEvent(new Event("v3:open-owner"));
  const saveAvatarFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setProfileBusy(true);
    setProfileStatus("Preparing and saving your icon…");
    try {
      const next = await imageFileToAvatar(file);
      await saveOwnerAvatar(next);
      setAvatar(next);
      setProfileStatus("Icon saved for all site domains.");
    } catch (error) {
      setProfileStatus((error as Error).message || "Could not save the profile icon.");
    } finally {
      setProfileBusy(false);
    }
  };
  const removeAvatar = async () => {
    setProfileBusy(true);
    setProfileStatus("Removing saved icon…");
    try {
      await saveOwnerAvatar("");
      setAvatar("");
      setProfileStatus("Custom icon removed.");
    } catch (error) {
      setProfileStatus((error as Error).message || "Could not remove the profile icon.");
    } finally {
      setProfileBusy(false);
    }
  };

  if (!owner) {
    return (
      <section aria-label="Owner access" className="owner-panel flex flex-col gap-3 border-b border-rule pb-5">
        <button type="button" onClick={openOwnerLogin} className="owner-btn w-full justify-start">
          <LogIn aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Owner login
        </button>
      </section>
    );
  }

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

      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-rule-strong bg-card" aria-label={avatar ? "Owner profile icon" : "Default owner profile icon"}>
          {avatar ? (
            <img src={avatar} alt="Owner profile icon" className="h-full w-full object-cover" />
          ) : (
            <CircleUserRound aria-hidden className="h-7 w-7 text-graphite" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="kicker text-ink-soft">Profile icon</p>
          <p className="truncate font-mono text-xs text-graphite">asaxxhiii@gmail.com</p>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label="Choose a profile icon image"
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => void saveAvatarFile(event)}
      />
      <div className="flex gap-2">
        <button type="button" disabled={profileBusy} onClick={() => fileInput.current?.click()} className="owner-btn min-w-0 flex-1">
          {profileBusy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.75} />}
          {avatar ? "Change icon" : "Set profile icon"}
        </button>
        {avatar && (
          <button type="button" disabled={profileBusy} onClick={() => void removeAvatar()} aria-label="Remove profile icon" className="owner-btn w-11 shrink-0 px-0">
            <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <p className={cn("min-h-4 font-mono text-[10px] leading-relaxed", profileStatus && /could not|choose|denied|failed|error|reject|permission|verify|expired|unauthor|forbidden|not allowed|403/i.test(profileStatus) ? "text-vermilion-ink" : "text-graphite")} role="status" aria-live="polite">
        {profileStatus || "Your profile icon is shared across the published site domains."}
      </p>

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
