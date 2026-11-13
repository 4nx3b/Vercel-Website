import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Type } from "lucide-react";
import { cn } from "../utils/cn";
import { FIREBASE } from "../lib/data";
import { refreshTokenIfNeeded } from "../lib/owner";
import { getPath, loadSiteImageData, useContent, useField, type Block, type SectionId } from "./store";

/* ------------------------------------------------------------------ *
 * Inline editing primitives. For visitors they render exactly what the
 * page rendered before (plain text / plain lists); the editing chrome only
 * appears while the signed-in owner has Edit mode on. Text is always
 * plain text (contentEditable="plaintext-only"), never HTML.
 * ------------------------------------------------------------------ */

/** Editable text. */
export function EText({ path, as: Tag = "span", className, label, multiline = false, fallback }: { path: string; as?: ElementType; className?: string; label?: string; multiline?: boolean; fallback?: string }) {
  const { editing } = useContent();
  const [value, setValue] = useField<string | null>(path);
  const shown = value ?? fallback ?? "";
  const ref = useRef<HTMLElement>(null);

  // Keep the DOM text in sync when not focused (e.g. after Discard).
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== shown) el.textContent = shown;
  }, [shown, editing]);

  if (!editing) return <Tag className={className}>{shown}</Tag>;
  return (
    <Tag
      ref={ref}
      role="textbox"
      aria-label={label ?? `Edit ${path}`}
      aria-multiline={multiline || undefined}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      className={cn(className, "editable")}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).textContent = shown;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim();
        if (text !== shown) setValue(text);
      }}
    >
      {shown}
    </Tag>
  );
}

/** A compact owner-only editor for URLs, placeholders, and other attributes. */
export function EField({ path, label, type = "text" }: { path: string; label: string; type?: "text" | "url" }) {
  const { editing } = useContent();
  const [value, setValue] = useField<string>(path);
  const [draft, setDraft] = useState(value ?? "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== input.current) setDraft(value ?? "");
  }, [value]);

  if (!editing) return null;
  const commit = (raw = draft) => {
    const next = raw.trim();
    if (next !== value) setValue(next);
  };
  return (
    <label className="edit-field">
      <span>{label}</span>
      <input
        ref={input}
        type={type}
        inputMode={type === "url" ? "url" : undefined}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            const original = value ?? "";
            setDraft(original);
            event.currentTarget.value = original;
            event.currentTarget.blur();
          }
        }}
        className="edit-input"
        aria-label={label}
      />
    </label>
  );
}

/** Editable string arrays with semantic list markup and owner-only controls. */
export function EStringList({
  path,
  as: Tag = "ul",
  className,
  itemClassName,
  textClassName,
  itemLabel = "item",
  numbered = false,
  bullet = false,
}: {
  path: string;
  as?: ElementType;
  className?: string;
  itemClassName?: string;
  textClassName?: string;
  itemLabel?: string;
  numbered?: boolean;
  bullet?: boolean;
}) {
  const { editing } = useContent();
  const [items, setItems] = useField<string[]>(path);
  const list = Array.isArray(items) ? items : [];
  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    const next = [...list];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setItems(next);
  };

  return (
    <>
      <Tag className={className}>
        {list.map((_, index) => (
          <li key={`${path}-${index}`} className={cn("edit-list-item", itemClassName)}>
            {numbered && <span aria-hidden className="edit-list-number">{String(index + 1).padStart(2, "0")}</span>}
            {bullet && <span aria-hidden className="edit-list-bullet" />}
            <EText
              path={`${path}.${index}`}
              className={cn("edit-list-text", textClassName)}
              label={`Edit ${itemLabel} ${index + 1}`}
              multiline
            />
            {editing && (
              <div className="edit-list-tools" role="group" aria-label={`${itemLabel} ${index + 1} controls`}>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${itemLabel} ${index + 1} up`}>
                  <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === list.length - 1} aria-label={`Move ${itemLabel} ${index + 1} down`}>
                  <ArrowDown aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" onClick={() => setItems(list.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${itemLabel} ${index + 1}`}>
                  <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            )}
          </li>
        ))}
      </Tag>
      {editing && (
        <button type="button" onClick={() => setItems([...list, `New ${itemLabel}`])} className="edit-add">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add {itemLabel}
        </button>
      )}
    </>
  );
}

/** Editable list: items rendered by the caller; edit mode adds move / remove / add. */
export function EList<T>({
  path,
  newItem,
  children,
  as: Tag = "ul",
  className,
  itemLabel = "item",
}: {
  path: string;
  newItem: () => T;
  children: (item: T, i: number, path: string) => ReactNode;
  as?: ElementType;
  className?: string;
  itemLabel?: string;
}) {
  const { editing } = useContent();
  const [items, setItems] = useField<T[]>(path);
  const list = Array.isArray(items) ? items : [];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  return (
    <>
      <Tag className={className}>
        {list.map((it, i) =>
          editing ? (
            <EditableRow key={i} onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => setItems(list.filter((_, k) => k !== i))} first={i === 0} last={i === list.length - 1} label={`${itemLabel} ${i + 1}`}>
              {children(it, i, `${path}.${i}`)}
            </EditableRow>
          ) : (
            children(it, i, `${path}.${i}`)
          )
        )}
      </Tag>
      {editing && (
        <button type="button" onClick={() => setItems([...list, newItem()])} className="edit-add">
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add {itemLabel}
        </button>
      )}
    </>
  );
}

function EditableRow({ children, onUp, onDown, onRemove, first, last, label }: { children: ReactNode; onUp: () => void; onDown: () => void; onRemove: () => void; first: boolean; last: boolean; label: string }) {
  return (
    <div className="edit-row">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="edit-tools" role="group" aria-label={`${label} controls`}>
        <button type="button" onClick={onUp} disabled={first} aria-label={`Move ${label} up`}>
          <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onDown} disabled={last} aria-label={`Move ${label} down`}>
          <ArrowDown aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
          <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- images ---------------- */

const MAX_W = 1600;
const MAX_BYTES = 700 * 1024;

/** `fs:siteImages/<id>` resolves through the host API, then shared Firestore on static hosts. */
export function resolveSrc(src: string | undefined) {
  if (!src) return src;
  if (src.startsWith("fs:siteImages/")) return `/api/site-content?image=${encodeURIComponent(src.slice("fs:siteImages/".length))}`;
  return src;
}
export function useResolvedSrc(src: string | undefined) {
  const [resolved, setResolved] = useState<string | undefined>(() => src?.startsWith("fs:siteImages/") ? undefined : src);
  useEffect(() => {
    if (!src?.startsWith("fs:siteImages/")) {
      setResolved(src);
      return;
    }
    let active = true;
    setResolved(undefined);
    const id = src.slice("fs:siteImages/".length);
    const apiUrl = resolveSrc(src)!;
    const useFirestore = () => loadSiteImageData(id).then((data) => {
      if (active) setResolved(data);
    });
    void fetch(apiUrl, { method: "HEAD", cache: "force-cache", headers: { Accept: "image/*" } })
      .then((response) => {
        if (response.ok && (response.headers.get("content-type") || "").startsWith("image/")) {
          if (active) setResolved(apiUrl);
          return;
        }
        return useFirestore();
      })
      .catch(useFirestore)
      .catch(() => { if (active) setResolved(undefined); });
    return () => { active = false; };
  }, [src]);
  return resolved;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("This browser could not process the image."))), "image/webp", quality);
  });
}

function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the compressed image.")));
    reader.onerror = () => reject(new Error("Could not read the compressed image."));
    reader.readAsDataURL(blob);
  });
}

async function toWebp(file: File): Promise<string> {
  if (typeof createImageBitmap !== "function") throw new Error("Image uploads need a browser with image compression support. Try using an https image URL instead.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare this image for upload.");
  }

  try {
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let quality = 0.82;
    let blob = await canvasBlob(canvas, quality);
    while (blob.size > MAX_BYTES && quality > 0.4) {
      quality = Math.max(0.4, quality - 0.12);
      blob = await canvasBlob(canvas, quality);
    }
    if (blob.size > MAX_BYTES) throw new Error("Image is too large after compression (maximum 700 KB).");
    return await blobDataUrl(blob);
  } finally {
    bitmap.close();
    canvas.width = 1;
    canvas.height = 1;
  }
}

const IMAGE_DATA_URL = /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

async function uploadImageDirect(dataUrl: string, token: string): Promise<string> {
  if (!IMAGE_DATA_URL.test(dataUrl) || new TextEncoder().encode(dataUrl).length > 1_000_000) {
    throw new Error("Image must be a PNG, JPEG, or WebP smaller than 700 KB after compression.");
  }
  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "")
    : `img${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const createdAt = new Date().toISOString();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteImages/${id}?key=${encodeURIComponent(FIREBASE.apiKey)}&updateMask.fieldPaths=data&updateMask.fieldPaths=createdAt`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { data: { stringValue: dataUrl }, createdAt: { stringValue: createdAt } } }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your owner session has expired. Sign in again before uploading.");
    if (response.status === 403) throw new Error("Firestore denied direct image publishing. Deploy firestore.rules and confirm the verified owner account.");
    throw new Error(result?.error?.message || `Firestore image upload failed (${response.status})`);
  }
  return `fs:siteImages/${id}`;
}

async function uploadImage(dataUrl: string): Promise<string> {
  const token = await refreshTokenIfNeeded();
  let response: Response | null = null;
  let data: any = null;
  try {
    response = await fetch("/api/site-content?image=1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: dataUrl }),
    });
    data = await response.json().catch(() => null);
  } catch {
    // Static hosts without an API can write the owner-only Firestore media document directly.
  }

  if (response?.ok && typeof data?.id === "string") return `fs:siteImages/${data.id}`;
  if (response?.status === 401) throw new Error("Your owner session has expired. Sign in again before uploading.");
  const apiMissing = !response || response.status === 404 || response.status === 405 || response.status === 503 || response.status >= 500 ||
    !(response.headers.get("content-type") || "").includes("json") || (response.ok && typeof data?.id !== "string");
  if (apiMissing || response?.status === 403) return uploadImageDirect(dataUrl, token);
  const detail = String(data?.error || "");
  if (response?.status === 400 || response?.status === 413) throw new Error(detail || "Image upload failed because the image is invalid or too large.");
  throw new Error(detail || `Image upload failed (${response?.status ?? "unknown"})`);
}

/** Compress and upload a builder image using the same immutable WebP media store. */
export async function uploadSiteImage(file: File): Promise<string> {
  return uploadImage(await toWebp(file));
}

/** Wraps an image; in edit mode adds a "Replace image" button that opens a small dialog. */
export function EImage({ srcPath, altPath, className, children }: { srcPath: string; altPath: string; className?: string; children: (src: string, alt: string) => ReactNode }) {
  const { editing, content, set } = useContent();
  const rawSrc = getPath(content, srcPath) as string;
  const alt = getPath(content, altPath) as string;
  const src = useResolvedSrc(rawSrc) ?? rawSrc;
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative", className)}>
      {children(src, alt)}
      {editing && (
        <>
          <button type="button" onClick={() => setOpen(true)} className="edit-img-btn">
            <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Replace image
          </button>
          {open && (
            <ImageDialog
              initialAlt={alt}
              onClose={() => setOpen(false)}
              onSave={(newSrc, newAlt) => {
                set(srcPath, newSrc);
                set(altPath, newAlt);
                setOpen(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function ImageDialog({ initialAlt, onClose, onSave }: { initialAlt: string; onClose: () => void; onSave: (src: string, alt: string) => void }) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(initialAlt);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const save = async () => {
    setErr("");
    if (!alt.trim()) return setErr("Alt text is required.");
    if (!file && !/^https:\/\//.test(url.trim())) return setErr("Pick a file or paste an https:// image URL.");
    setBusy(true);
    try {
      const src = file ? await uploadImage(await toWebp(file)) : url.trim();
      onSave(src, alt.trim());
    } catch (e) {
      setErr((e as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="edit-dialog-scrim" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Replace image" className="edit-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="kicker text-ink-soft">Replace image</p>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-file">Upload (resized to 1600px, webp)</label>
        <input ref={first} id="ei-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm text-ink-soft" />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-url">…or image URL</label>
        <input id="ei-url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!!file} className="edit-input" />
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="ei-alt">Alt text (required)</label>
        <input id="ei-alt" type="text" value={alt} onChange={(e) => setAlt(e.target.value)} className="edit-input" />
        {err && <p role="alert" className="mt-3 font-mono text-xs text-vermilion-ink">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="edit-btn">Cancel</button>
          <button type="button" onClick={save} disabled={busy} className="edit-btn edit-btn-primary">{busy ? "Saving…" : "Use image"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- custom blocks ---------------- */

/** Owner-added text / image blocks at the end of a section. Renders nothing when empty. */
export function Blocks({ section, className }: { section: SectionId; className?: string }) {
  const { editing } = useContent();
  const [blocks, setBlocks] = useField<Block[]>(`blocks.${section}`);
  const list = Array.isArray(blocks) ? blocks : [];
  if (!list.length && !editing) return null;
  const add = (type: Block["type"]) =>
    setBlocks([...list, type === "text" ? { id: `b${Date.now()}`, type, text: "New text block" } : { id: `b${Date.now()}`, type, src: "", alt: "" }]);
  return (
    <div className={cn("mt-10 flex flex-col gap-6", className)}>
      {list.map((b, i) => {
        const body =
          b.type === "text" ? (
            <EText path={`blocks.${section}.${i}.text`} as="p" multiline className="max-w-[64ch] text-lg text-[var(--text-2)]" label={`Text block ${i + 1}`} />
          ) : (
            <EImage srcPath={`blocks.${section}.${i}.src`} altPath={`blocks.${section}.${i}.alt`}>
              {(src, alt) =>
                src ? (
                  <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto max-w-full rounded-[var(--radius-md)]" />
                ) : (
                  <div className="grid h-40 place-items-center rounded-[var(--radius-md)] border border-dashed border-rule-strong font-mono text-xs text-graphite">empty image block</div>
                )
              }
            </EImage>
          );
        return editing ? (
          <EditableRow
            key={b.id}
            label={`block ${i + 1}`}
            first={i === 0}
            last={i === list.length - 1}
            onUp={() => i > 0 && setBlocks(list.map((x, k) => (k === i - 1 ? list[i] : k === i ? list[i - 1] : x)))}
            onDown={() => i < list.length - 1 && setBlocks(list.map((x, k) => (k === i + 1 ? list[i] : k === i ? list[i + 1] : x)))}
            onRemove={() => setBlocks(list.filter((_, k) => k !== i))}
          >
            {body}
          </EditableRow>
        ) : (
          <div key={b.id}>{body}</div>
        );
      })}
      {editing && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => add("text")} className="edit-add">
            <Type aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add text
          </button>
          <button type="button" onClick={() => add("image")} className="edit-add">
            <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.75} /> Add image
          </button>
        </div>
      )}
    </div>
  );
}
