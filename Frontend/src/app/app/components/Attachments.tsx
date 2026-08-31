"use client";
// Media for a capsule:
//   • useMedia()     — the upload/delete/list logic (shared by the editor).
//   • <MediaStudio>  — the editor's presentational manager.
//   • <MediaGallery> — read-only display, used on the opened letter.

import { useCallback, useEffect, useRef, useState } from "react";
import type { AttachmentView, AttachmentKind } from "../types";
import { Icon } from "./ui";
import { VoicePlayer } from "./VoicePlayer";
import { ICONS } from "../data";

/** Best-effort read of a media file's duration, for the metadata we store. */
export function readDuration(file: File, kind: AttachmentKind): Promise<number | null> {
  if (kind === "photo") return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
      URL.revokeObjectURL(el.src);
    };
    el.onerror = () => resolve(null);
    el.src = URL.createObjectURL(file);
  });
}

export interface Media {
  items: AttachmentView[];
  busy: boolean;
  error: string | null;
  upload: (file: File, kind: AttachmentKind, durationSec: number | null) => Promise<AttachmentView | null>;
  pickFiles: (files: FileList | null, kind: AttachmentKind) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** All the upload/delete plumbing for one capsule's media. `onUploaded` fires
 *  once per successful upload (used to drop voice notes inline). */
export function useMedia(
  capsuleId: string,
  initial: AttachmentView[],
  onUploaded?: (att: AttachmentView) => void,
): Media {
  const [items, setItems] = useState<AttachmentView[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadedCb = useRef(onUploaded);
  useEffect(() => {
    uploadedCb.current = onUploaded;
  }, [onUploaded]);

  const upload = useCallback(
    async (file: File, kind: AttachmentKind, durationSec: number | null) => {
      setBusy(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        if (durationSec != null) fd.append("durationSec", String(durationSec));
        const res = await fetch(`/api/capsule/${capsuleId}/media`, { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        const att = json.attachment as AttachmentView;
        setItems((prev) => [...prev, att]);
        uploadedCb.current?.(att);
        return att;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [capsuleId],
  );

  const pickFiles = useCallback(
    async (files: FileList | null, kind: AttachmentKind) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const dur = await readDuration(file, kind);
        await upload(file, kind, dur);
      }
    },
    [upload],
  );

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await fetch(`/api/media/${id}`, { method: "DELETE" });
    } catch {
      // Gone from view; a reload would restore it if the request failed.
    }
  }, []);

  return { items, busy, error, upload, pickFiles, remove };
}

/** One media item, read-only. */
export function MediaItem({ a }: { a: AttachmentView }) {
  if (a.kind === "voice") return <VoicePlayer url={a.url} durationSec={a.durationSec} />;
  if (a.kind === "photo")
    return (
      // Polaroid-style white frame, matching the reveal aesthetic.
      <div className="rounded-[3px] bg-white p-2 pb-3 shadow-[0_12px_30px_rgba(43,38,33,0.16)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt="A photograph sealed with this letter" className="block max-h-[280px] w-full rounded-[1px] object-cover" />
      </div>
    );
  return (
    // Polaroid frame + vintage film filter, matching the photo look.
    <div className="rounded-[3px] bg-white p-2 pb-3 shadow-[0_12px_30px_rgba(43,38,33,0.16)]">
      <video src={a.url} controls className="sd-film block max-h-[300px] w-full rounded-[1px] bg-black" />
    </div>
  );
}

export function MediaGallery({ items }: { items: AttachmentView[] }) {
  if (items.length === 0) return null;
  const voices = items.filter((i) => i.kind === "voice");
  const visuals = items.filter((i) => i.kind !== "voice");
  return (
    <div className="mt-6 flex flex-col gap-4">
      {voices.map((a) => (
        <MediaItem key={a.id} a={a} />
      ))}
      {visuals.length > 0 && (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
          {visuals.map((a) => (
            <MediaItem key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The editor's media manager. State + recording live in the parent editor. */
export function MediaStudio({
  media,
  onRecord,
  onRemove,
}: {
  media: Media;
  onRecord: (mode: "voice" | "video") => void;
  onRemove: (id: string) => void;
}) {
  const { items, busy, error, pickFiles } = media;

  const btn =
    "inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3.5 py-2 text-[12px] text-app-text transition-colors hover:bg-black/[0.04] disabled:opacity-50";

  return (
    <div className="rounded-[10px] border border-app-border bg-app-panel p-4 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-app-faint">Add to your letter</div>
        {busy && <span className="text-[11px] text-app-dim">Uploading…</span>}
      </div>
      <p className="mb-3 text-[11px] text-app-faint">
        Voice notes drop into the letter where your cursor is — from{" "}
        <span className="text-app-dim">Record voice</span> or by pressing{" "}
        <kbd className="rounded border border-app-border px-1">Ctrl</kbd>+
        <kbd className="rounded border border-app-border px-1">V</kbd> while writing.
      </p>

      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={busy} onClick={() => onRecord("voice")}>
          <span className="text-app-accent"><Icon d={ICONS.voice} className="h-4 w-4" /></span> Record voice
        </button>
        <button className={btn} disabled={busy} onClick={() => onRecord("video")}>
          <span className="text-app-accent"><Icon d={ICONS.film} className="h-4 w-4" /></span> Record film
        </button>
        <label className={`${btn} cursor-pointer`}>
          <span className="text-app-accent"><Icon d={ICONS.photos} className="h-4 w-4" /></span> Photos
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { pickFiles(e.target.files, "photo"); e.target.value = ""; }} />
        </label>
        <label className={`${btn} cursor-pointer`}>
          Upload video
          <input type="file" accept="video/*" hidden onChange={(e) => { pickFiles(e.target.files, "video"); e.target.value = ""; }} />
        </label>
        <label className={`${btn} cursor-pointer`}>
          Upload audio
          <input type="file" accept="audio/*" hidden onChange={(e) => { pickFiles(e.target.files, "voice"); e.target.value = ""; }} />
        </label>
      </div>

      {error && <p className="mt-3 text-[13px] text-app-accent">{error}</p>}

      {/* Voice notes live inline in the letter; the studio lists photos & films. */}
      {(() => {
        const visuals = items.filter((a) => a.kind !== "voice");
        if (visuals.length === 0) return null;
        return (
          <div className="mt-4 flex flex-col gap-3">
            {visuals.map((a) => (
              <div key={a.id} className="group relative">
                <MediaItem a={a} />
                <button
                  onClick={() => onRemove(a.id)}
                  aria-label="Remove"
                  className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-app-text opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
