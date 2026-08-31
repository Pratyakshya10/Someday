"use client";
// The letter writing surface — a plain-text contenteditable that also holds
// inline voice-note "chips". Text is stored as a normal string; each chip
// serializes back to a `[[voice:xxxxxxxx]]` marker, so the persisted body is
// identical to what the reveal parses. The editor is uncontrolled (the DOM is
// the source of truth) to keep the caret stable; every edit re-serializes and
// reports the new body upward.

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { AttachmentView } from "../types";
import { splitLetter } from "../letter";

export interface RichLetterHandle {
  insertVoice: (att: AttachmentView) => void;
  focus: () => void;
}

interface Props {
  initialBody: string;
  attachments: AttachmentView[];
  placeholder: string;
  onChange: (body: string) => void;
  onRequestVoice: () => void;
  onAttachFiles: (files: FileList) => void;
  onRemoveVoice: (fullId: string) => void;
}

function mmss(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "voice";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const RichLetter = forwardRef<RichLetterHandle, Props>(function RichLetter(
  { initialBody, attachments, placeholder, onChange, onRequestVoice, onAttachFiles, onRemoveVoice },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  // shortId -> { url, dur, fullId }
  const info = useRef<Map<string, { url: string; dur: number | null; fullId: string }>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingShort = useRef<string | null>(null);

  useEffect(() => {
    const m = new Map<string, { url: string; dur: number | null; fullId: string }>();
    attachments.forEach((a) => m.set(a.id.slice(0, 8), { url: a.url, dur: a.durationSec, fullId: a.id }));
    info.current = m;
  }, [attachments]);

  const buildChip = (short: string): HTMLElement => {
    const meta = info.current.get(short);
    const chip = document.createElement("span");
    chip.dataset.voice = short;
    if (meta) chip.dataset.id = meta.fullId;
    chip.contentEditable = "false";
    chip.className =
      "sd-chip mx-1 inline-flex select-none items-center gap-2 rounded-full border border-app-border bg-app-surface px-2.5 py-1 align-middle text-[13px] text-app-text";
    chip.innerHTML =
      `<button type="button" data-play class="flex h-6 w-6 items-center justify-center rounded-full bg-app-accent text-[10px] text-app-on-accent">▶</button>` +
      `<span class="text-app-dim">voice · ${mmss(meta?.dur ?? null)}</span>` +
      `<button type="button" data-del aria-label="Remove voice note" class="text-app-faint hover:text-app-text">✕</button>`;
    return chip;
  };

  const build = (body: string) => {
    const el = elRef.current;
    if (!el) return;
    el.textContent = "";
    for (const seg of splitLetter(body)) {
      if (seg.type === "text") el.appendChild(document.createTextNode(seg.text));
      else el.appendChild(buildChip(seg.id));
    }
  };

  // Build once from the initial body. (Uncontrolled thereafter.)
  useEffect(() => {
    build(initialBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serialize = (node: Node): string => {
    let out = "";
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        out += n.textContent ?? "";
      } else if (n.nodeName === "BR") {
        out += "\n";
      } else if (n instanceof HTMLElement) {
        if (n.dataset.voice) {
          out += `[[voice:${n.dataset.voice}]]`;
        } else {
          const isBlock = /^(DIV|P)$/.test(n.nodeName);
          if (isBlock && out && !out.endsWith("\n")) out += "\n";
          out += serialize(n);
        }
      }
    });
    return out;
  };

  const emit = () => {
    const el = elRef.current;
    if (el) onChange(serialize(el));
  };

  const saveSelection = () => {
    const el = elRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) savedRange.current = range.cloneRange();
  };

  const insertChip = (short: string) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    let range = savedRange.current;
    if (!range || !el.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // end
    }
    range.deleteContents();
    const chip = buildChip(short);
    // A trailing space makes it easy to keep typing after the chip.
    const space = document.createTextNode(" ");
    range.insertNode(space);
    range.insertNode(chip);
    range.setStartAfter(space);
    range.collapse(true);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRange.current = range.cloneRange();
    emit();
  };

  useImperativeHandle(ref, () => ({
    insertVoice: (att: AttachmentView) => {
      // Make sure the chip can resolve its url/duration immediately.
      info.current.set(att.id.slice(0, 8), { url: att.url, dur: att.durationSec, fullId: att.id });
      insertChip(att.id.slice(0, 8));
    },
    focus: () => elRef.current?.focus(),
  }));

  const togglePlay = (short: string) => {
    const meta = info.current.get(short);
    if (!meta) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    const setLabel = (s: string, label: string) => {
      const chip = elRef.current?.querySelector(`[data-voice="${s}"] [data-play]`);
      if (chip) chip.textContent = label;
    };
    if (playingShort.current === short && !audio.paused) {
      audio.pause();
      setLabel(short, "▶");
      return;
    }
    if (playingShort.current && playingShort.current !== short) setLabel(playingShort.current, "▶");
    audio.src = meta.url;
    audio.play().then(() => {
      playingShort.current = short;
      setLabel(short, "❚❚");
    }).catch(() => {});
    audio.onended = () => setLabel(short, "▶");
  };

  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>(".sd-chip");
    if (!chip) return;
    if (target.closest("[data-play]")) {
      e.preventDefault();
      if (chip.dataset.voice) togglePlay(chip.dataset.voice);
    } else if (target.closest("[data-del]")) {
      e.preventDefault();
      const fullId = chip.dataset.id;
      chip.remove();
      emit();
      if (fullId) onRemoveVoice(fullId);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const cd = e.clipboardData;
    const text = cd.getData("text");
    const files = cd.files;
    saveSelection();
    if (files && files.length > 0) {
      e.preventDefault();
      onAttachFiles(files);
      return;
    }
    if (!text) {
      e.preventDefault();
      onRequestVoice();
    }
    // else: let plaintext-only paste happen; onInput will re-serialize.
  };

  return (
    <div
      ref={elRef}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      onInput={emit}
      onKeyUp={saveSelection}
      onMouseUp={saveSelection}
      onPaste={onPaste}
      onClick={onClick}
      className="sd-letter min-h-[220px] w-full whitespace-pre-wrap font-serif text-lg leading-[1.65] text-app-text outline-none"
    />
  );
});
