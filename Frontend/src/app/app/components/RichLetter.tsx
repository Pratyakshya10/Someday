"use client";
// The letter writing surface — a rich contenteditable that holds words, inline
// media "chips" (voice notes, photos, films), and light emphasis (bold /
// italic / underline). Text is stored as a plain string: emphasis serializes
// to markdown (**b**, *i*, __u__), each chip to a `[[voice:xxxxxxxx]]` or
// `[[media:xxxxxxxx]]` marker, and the whole-letter font to a leading
// `[[font:slug]]` token. So the persisted body stays a simple string that the
// reveal parses back — and a photo dropped mid-paragraph shows up mid-paragraph
// there too. The editor is uncontrolled (the DOM is the source of truth) to
// keep the caret stable; every edit re-serializes and reports the new body up.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AttachmentView, AttachmentKind } from "../types";
import { splitLetter, parseFont, withFont, parseInline, type TextRun } from "../letter";
import { LETTER_FONTS, fontCss } from "../fonts";
import { Select } from "./Select";

export interface RichLetterHandle {
  insertVoice: (att: AttachmentView) => void;
  /** Drop a photo/video into the letter, right where the cursor is. */
  insertMedia: (att: AttachmentView) => void;
  /** Strip a chip (by full attachment id) from the letter, wherever it sits. */
  removeChip: (fullId: string) => void;
  focus: () => void;
}

interface Props {
  initialBody: string;
  attachments: AttachmentView[];
  placeholder: string;
  onChange: (body: string) => void;
  onRequestVoice: () => void;
  onAttachFiles: (files: FileList) => void;
  /** A chip (voice, photo, or video) was removed from the text. */
  onRemoveAttachment: (fullId: string) => void;
}

// A small, warm set of emoji for the picker — enough to sign off a letter with,
// without pulling in a whole emoji library.
const EMOJI = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤",
  "😊", "🥹", "🥰", "😌", "😢", "🥲", "😭", "🤗",
  "😂", "😍", "😘", "😅", "🙃", "😇", "🤍", "😴",
  "✨", "🌙", "⭐", "🔥", "🌸", "🌼", "🍂", "🌊",
  "🎉", "🎂", "🥂", "🎁", "💌", "📷", "🕰️", "☕",
  "🙏", "👋", "🤞", "💫", "🫶", "👀", "💭", "🍀",
];

function mmss(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "voice";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const RichLetter = forwardRef<RichLetterHandle, Props>(function RichLetter(
  { initialBody, attachments, placeholder, onChange, onRequestVoice, onAttachFiles, onRemoveAttachment },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  // shortId -> { url, dur, fullId, kind }
  const info = useRef<Map<string, { url: string; dur: number | null; fullId: string; kind: AttachmentKind }>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingShort = useRef<string | null>(null);

  // The whole-letter font. Mirrored in a ref so serialize() (called from stable
  // handlers) always reads the current value.
  const [font, setFontState] = useState("default");
  const fontRef = useRef("default");
  // Which toolbar buttons are "on" for the caret/selection right now, so
  // bold/italic/underline read as toggles instead of one-shot actions.
  const [active, setActive] = useState({ b: false, i: false, u: false });
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const [emojiPos, setEmojiPos] = useState<{ left: number; bottom: number } | null>(null);

  useEffect(() => {
    const m = new Map<string, { url: string; dur: number | null; fullId: string; kind: AttachmentKind }>();
    attachments.forEach((a) => m.set(a.id.slice(0, 8), { url: a.url, dur: a.durationSec, fullId: a.id, kind: a.kind }));
    info.current = m;
  }, [attachments]);

  const buildChip = (short: string, hintKind?: AttachmentKind): HTMLElement => {
    const meta = info.current.get(short);
    const kind = meta?.kind ?? hintKind ?? "voice";
    const chip = document.createElement("span");
    chip.dataset.chip = short;
    chip.dataset.kind = kind;
    if (meta) chip.dataset.id = meta.fullId;
    chip.contentEditable = "false";
    chip.className =
      "sd-chip mx-1 inline-flex select-none items-center gap-2 rounded-full border border-app-border bg-app-surface px-2.5 py-1 align-middle text-[13px] text-app-text";
    if (kind === "voice") {
      // A static waveform silhouette (varied bar heights) so a voice chip
      // reads as audio at a glance; each bar's own sdWave animation plays
      // only while this note is actually playing (toggled in setChipPlaying).
      const heights = [40, 90, 60, 100, 55, 75];
      const bars = heights
        .map(
          (h, i) =>
            `<span class="sd-wavebar w-[2px] rounded-sm bg-app-accent/70" style="height:${h}%;animation:sdWave ${0.8 + i * 0.05}s ease-in-out infinite;animation-play-state:paused;"></span>`,
        )
        .join("");
      chip.innerHTML =
        `<button type="button" data-play class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-accent text-[10px] text-app-on-accent">▶</button>` +
        `<span class="flex h-4 items-end gap-[2px]">${bars}</span>` +
        `<span class="text-app-dim">${mmss(meta?.dur ?? null)}</span>` +
        `<button type="button" data-del aria-label="Remove voice note" class="text-app-faint hover:text-app-text">✕</button>`;
    } else {
      const label = kind === "video" ? "film clip" : "photo";
      // A real thumbnail for photos so it's obvious this is the actual image,
      // shown at the small size it'll render at — not just an icon standing in.
      const thumb =
        meta?.url && kind === "photo"
          ? `<img src="${meta.url}" alt="" class="h-6 w-6 shrink-0 rounded-[4px] object-cover" />`
          : `<span class="text-[13px]">${kind === "video" ? "🎬" : "🖼"}</span>`;
      chip.innerHTML =
        thumb +
        `<span class="text-app-dim">${label}</span>` +
        `<button type="button" data-del aria-label="Remove ${label}" class="text-app-faint hover:text-app-text">✕</button>`;
    }
    return chip;
  };

  // Wrap a text run in the <b>/<i>/<u> tags its emphasis calls for.
  const runNode = (r: TextRun): Node => {
    let node: Node = document.createTextNode(r.text);
    if (r.u) { const x = document.createElement("u"); x.appendChild(node); node = x; }
    if (r.i) { const x = document.createElement("i"); x.appendChild(node); node = x; }
    if (r.b) { const x = document.createElement("b"); x.appendChild(node); node = x; }
    return node;
  };

  const build = (raw: string) => {
    const el = elRef.current;
    if (!el) return;
    const { font: f, body } = parseFont(raw);
    fontRef.current = f ?? "default";
    setFontState(f ?? "default");
    el.textContent = "";
    for (const seg of splitLetter(body)) {
      if (seg.type === "text") {
        for (const r of parseInline(seg.text)) el.appendChild(runNode(r));
      } else {
        el.appendChild(buildChip(seg.id, seg.type === "voice" ? "voice" : "photo"));
      }
    }
  };

  // Build once from the initial body. (Uncontrolled thereafter.)
  useEffect(() => {
    build(initialBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which emphasis, if any, an element introduces — by tag or by inline style,
  // so it survives whichever markup the browser's execCommand produced.
  const emphasisOf = (el: HTMLElement) => {
    const n = el.nodeName;
    const s = el.style;
    const b = n === "B" || n === "STRONG" || /^(bold|[6-9]00)$/.test(s.fontWeight || "");
    const i = n === "I" || n === "EM" || s.fontStyle === "italic";
    const deco = `${s.textDecorationLine || ""} ${s.textDecoration || ""}`;
    const u = n === "U" || deco.includes("underline");
    return { b, i, u };
  };

  const serialize = (node: Node): string => {
    let out = "";
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        out += n.textContent ?? "";
      } else if (n.nodeName === "BR") {
        out += "\n";
      } else if (n instanceof HTMLElement) {
        if (n.dataset.chip) {
          const prefix = n.dataset.kind === "voice" ? "voice" : "media";
          out += `[[${prefix}:${n.dataset.chip}]]`;
          return;
        }
        const isBlock = /^(DIV|P)$/.test(n.nodeName);
        if (isBlock && out && !out.endsWith("\n")) out += "\n";
        let inner = serialize(n);
        if (inner) {
          const { b, i, u } = emphasisOf(n);
          if (u) inner = `__${inner}__`;
          if (i) inner = `*${inner}*`;
          if (b) inner = `**${inner}**`;
        }
        out += inner;
      }
    });
    return out;
  };

  const emit = () => {
    const el = elRef.current;
    if (el) onChange(withFont(fontRef.current, serialize(el)));
  };

  const saveSelection = () => {
    const el = elRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) savedRange.current = range.cloneRange();
  };

  // Reflect the caret/selection's current formatting on the toolbar. Only
  // trusts the browser's state while this editor actually has focus, so a
  // stale "on" doesn't linger after clicking elsewhere (the title, a select).
  const updateActive = () => {
    const el = elRef.current;
    const sel = window.getSelection();
    const focused =
      el && document.activeElement === el && sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (!focused) return setActive({ b: false, i: false, u: false });
    setActive({
      b: document.queryCommandState("bold"),
      i: document.queryCommandState("italic"),
      u: document.queryCommandState("underline"),
    });
  };

  const insertChip = (short: string, hintKind: AttachmentKind) => {
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
    const chip = buildChip(short, hintKind);
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
      info.current.set(att.id.slice(0, 8), { url: att.url, dur: att.durationSec, fullId: att.id, kind: att.kind });
      insertChip(att.id.slice(0, 8), "voice");
    },
    insertMedia: (att: AttachmentView) => {
      info.current.set(att.id.slice(0, 8), { url: att.url, dur: att.durationSec, fullId: att.id, kind: att.kind });
      insertChip(att.id.slice(0, 8), att.kind);
    },
    removeChip: (fullId: string) => {
      const chip = elRef.current?.querySelector<HTMLElement>(`[data-id="${fullId}"]`);
      if (!chip) return;
      chip.remove();
      emit();
    },
    focus: () => elRef.current?.focus(),
  }));

  // ── Toolbar actions ────────────────────────────────────────────────
  // Buttons use onMouseDown + preventDefault so the editor keeps focus and the
  // current selection, letting execCommand act on the highlighted words.
  const exec = (cmd: "bold" | "italic" | "underline") => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    try { document.execCommand("styleWithCSS", false, "false"); } catch { /* not supported */ }
    document.execCommand(cmd);
    saveSelection();
    updateActive();
    emit();
  };

  const ensureCaret = () => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && el.contains(savedRange.current.commonAncestorContainer)) {
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    } else if (!sel || sel.rangeCount === 0 || !el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const insertEmoji = (emo: string) => {
    ensureCaret();
    document.execCommand("insertText", false, emo);
    saveSelection();
    emit();
  };

  const changeFont = (slug: string) => {
    fontRef.current = slug;
    setFontState(slug);
    emit();
  };

  // Open the emoji panel just above its button, positioned in the viewport (via
  // a portal) so no scroll container or backdrop-filter can clip it.
  const toggleEmoji = () => {
    if (showEmoji) return setShowEmoji(false);
    saveSelection();
    const r = emojiBtnRef.current?.getBoundingClientRect();
    if (r) {
      setEmojiPos({
        left: Math.max(12, Math.min(r.left, window.innerWidth - 300)),
        bottom: window.innerHeight - r.top + 8,
      });
    }
    setShowEmoji(true);
  };

  useEffect(() => {
    if (!showEmoji) return;
    const close = () => setShowEmoji(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [showEmoji]);

  // Flip a voice chip's play button label and its waveform bars' animation
  // together, so the little waveform actually moves while it's playing.
  const setChipPlaying = (short: string, playing: boolean) => {
    const chip = elRef.current?.querySelector<HTMLElement>(`[data-chip="${short}"]`);
    if (!chip) return;
    const btn = chip.querySelector<HTMLElement>("[data-play]");
    if (btn) btn.textContent = playing ? "❚❚" : "▶";
    chip.querySelectorAll<HTMLElement>(".sd-wavebar").forEach((bar) => {
      bar.style.animationPlayState = playing ? "running" : "paused";
    });
  };

  const togglePlay = (short: string) => {
    const meta = info.current.get(short);
    if (!meta) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    if (playingShort.current === short && !audio.paused) {
      audio.pause();
      setChipPlaying(short, false);
      return;
    }
    if (playingShort.current && playingShort.current !== short) setChipPlaying(playingShort.current, false);
    audio.src = meta.url;
    audio.play().then(() => {
      playingShort.current = short;
      setChipPlaying(short, true);
    }).catch(() => {});
    audio.onended = () => setChipPlaying(short, false);
  };

  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>(".sd-chip");
    if (!chip) return;
    if (target.closest("[data-play]")) {
      e.preventDefault();
      if (chip.dataset.chip) togglePlay(chip.dataset.chip);
    } else if (target.closest("[data-del]")) {
      e.preventDefault();
      const fullId = chip.dataset.id;
      chip.remove();
      emit();
      if (fullId) onRemoveAttachment(fullId);
    }
  };

  // Where a drop (or paste, below) landed in the text, as a Range — Chrome/
  // Safari via caretRangeFromPoint, Firefox via caretPositionFromPoint.
  const caretRangeAt = (x: number, y: number): Range | null => {
    const doc = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
    const pos = doc.caretPositionFromPoint?.(x, y);
    if (!pos) return null;
    const range = document.createRange();
    range.setStart(pos.offsetNode, pos.offset);
    range.collapse(true);
    return range;
  };

  // Left unhandled, a browser's DEFAULT drop behavior on a contenteditable is
  // to insert a dropped image as a raw, untracked <img> — full-size, never
  // uploaded, and invisible to serialize()/the reveal. So every drop is taken
  // over: files go through the same upload+chip pipeline as a paste, and any
  // other drop content inserts as plain text only.
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const range = caretRangeAt(e.clientX, e.clientY);
    if (range) {
      elRef.current?.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      savedRange.current = range.cloneRange();
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onAttachFiles(files);
      return;
    }
    const text = e.dataTransfer.getData("text/plain");
    if (text) {
      elRef.current?.focus();
      document.execCommand("insertText", false, text);
      saveSelection();
      emit();
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
    // Always paste as plain text — keeps out foreign markup/styles, so the only
    // formatting in the editor is what the toolbar produced.
    e.preventDefault();
    if (text) {
      document.execCommand("insertText", false, text);
      saveSelection();
      emit();
    } else {
      onRequestVoice();
    }
  };

  const toolBtn =
    "flex h-8 w-8 items-center justify-center rounded-md border border-app-border bg-app-surface text-app-dim transition-colors hover:text-app-text";
  const toolBtnActive = "border-app-accent bg-app-accent-dim text-app-text";

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-app-border pb-3">
        <button type="button" aria-label="Bold" aria-pressed={active.b} title="Bold" className={`${toolBtn} font-serif text-[15px] font-bold ${active.b ? toolBtnActive : ""}`} onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>B</button>
        <button type="button" aria-label="Italic" aria-pressed={active.i} title="Italic" className={`${toolBtn} font-serif text-[15px] italic ${active.i ? toolBtnActive : ""}`} onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}>i</button>
        <button type="button" aria-label="Underline" aria-pressed={active.u} title="Underline" className={`${toolBtn} font-serif text-[15px] underline ${active.u ? toolBtnActive : ""}`} onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}>U</button>

        <span className="mx-1 h-6 w-px bg-app-border" />

        <Select value={font} onChange={changeFont} options={LETTER_FONTS.map((f) => ({ value: f.slug, label: f.label, style: { fontFamily: f.css } }))} className="h-8 min-w-[128px]" previewFont />

        <span className="mx-1 h-6 w-px bg-app-border" />

        <button
          ref={emojiBtnRef}
          type="button"
          aria-label="Insert emoji"
          title="Emoji"
          className={`${toolBtn} text-[15px]`}
          onMouseDown={(e) => { e.preventDefault(); toggleEmoji(); }}
        >
          🙂
        </button>

        {showEmoji && emojiPos &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[60]" onMouseDown={() => setShowEmoji(false)} />
              <div
                style={{ position: "fixed", left: emojiPos.left, bottom: emojiPos.bottom }}
                className="z-[61] grid w-[288px] grid-cols-8 gap-1 rounded-xl border border-app-border bg-app-panel p-2.5 shadow-[0_20px_50px_rgba(43,38,33,0.18)] backdrop-blur-xl"
              >
                {EMOJI.map((emo, i) => (
                  <button
                    key={`${emo}-${i}`}
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[18px] transition-colors hover:bg-app-surface"
                    onMouseDown={(e) => { e.preventDefault(); insertEmoji(emo); }}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )}
      </div>

      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        style={{ fontFamily: fontCss(font) }}
        onInput={emit}
        onKeyUp={() => { saveSelection(); updateActive(); }}
        onMouseUp={() => { saveSelection(); updateActive(); }}
        onFocus={updateActive}
        onBlur={updateActive}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={onClick}
        className="sd-letter min-h-[48px] w-full whitespace-pre-wrap text-lg leading-[1.65] text-app-text outline-none"
      />
    </div>
  );
});
