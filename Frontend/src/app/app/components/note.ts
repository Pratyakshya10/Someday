"use client";
// Shared wiring for a "note" writing surface (RichLetter + MediaStudio +
// Recorder): media state, the recorder modal's mode, inline voice insertion,
// and file-drop handling. Both the solo letter and each group note use it; the
// parent lays out the pieces and owns the body text + autosave.
//
// Voice notes drop in as an inline chip right at the cursor — they're spoken
// asides, so where they land in the text matters. Photos/films are different:
// they always show as small cards at the end of the letter (LetterGallery),
// never mid-paragraph, so uploading one never touches the text or the cursor.

import { useState, type RefObject } from "react";
import type { AttachmentView } from "../types";
import { useMedia } from "./Attachments";
import type { RichLetterHandle } from "./RichLetter";

// The parent owns `letterRef` (and uses it for <RichLetter ref>); we take it as
// a param so nothing returned here is a ref — that keeps render-time access to
// the returned values clean.
export function useNoteEditing(
  entityId: string,
  initialAttachments: AttachmentView[],
  letterRef: RefObject<RichLetterHandle | null>,
  resource: "capsule" | "journal" = "capsule",
) {
  const media = useMedia(entityId, initialAttachments, (att) => {
    if (att.kind === "voice") letterRef.current?.insertVoice(att);
  }, resource);
  const [recording, setRecording] = useState<null | "voice" | "video">(null);

  const onRecorderDone = async (file: File, duration: number) => {
    const mode = recording;
    setRecording(null);
    await media.upload(file, mode === "video" ? "video" : "voice", duration);
  };

  const onAttachFiles = (files: FileList) => {
    for (const f of Array.from(files)) {
      const kind = f.type.startsWith("audio/") ? "voice" : f.type.startsWith("video/") ? "video" : "photo";
      void media.upload(f, kind, null);
    }
  };

  // A voice chip's own ✕ already removes itself from the text before calling
  // this; for a photo/film card there's no chip to strip, so this just covers
  // both — harmless no-op on the DOM side when there's nothing to find.
  const removeAttachment = (id: string) => {
    letterRef.current?.removeChip(id);
    void media.remove(id);
  };

  return { media, recording, setRecording, onRecorderDone, onAttachFiles, removeAttachment };
}
