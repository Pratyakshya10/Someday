"use client";
// Shared wiring for a "note" writing surface (RichLetter + MediaStudio +
// Recorder): media state, the recorder modal's mode, inline voice insertion,
// and file-drop handling. Both the solo letter and each group note use it; the
// parent lays out the pieces and owns the body text + autosave.

import { useState, type RefObject } from "react";
import type { AttachmentView } from "../types";
import { useMedia } from "./Attachments";
import type { RichLetterHandle } from "./RichLetter";

// The parent owns `letterRef` (and uses it for <RichLetter ref>); we take it as
// a param so nothing returned here is a ref — that keeps render-time access to
// the returned values clean.
export function useNoteEditing(
  capsuleId: string,
  initialAttachments: AttachmentView[],
  letterRef: RefObject<RichLetterHandle | null>,
) {
  const media = useMedia(capsuleId, initialAttachments, (att) => {
    if (att.kind === "voice") letterRef.current?.insertVoice(att);
    else letterRef.current?.insertMedia(att);
  });
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

  // Every attachment now lives inline (its chip is the only place it sits in
  // the letter), so removing one — from the Studio's list or the chip's own ✕
  // — always strips the matching token too, no orphans.
  const removeAttachment = (id: string) => {
    letterRef.current?.removeChip(id);
    void media.remove(id);
  };

  return { media, recording, setRecording, onRecorderDone, onAttachFiles, removeAttachment };
}
