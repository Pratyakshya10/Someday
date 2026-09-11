"use client";
// Shared renderer for a stored letter body → React nodes. Understands the same
// format the editor writes: leading `[[font:slug]]`/`[[size:slug]]` tokens,
// inline emphasis markers (**b**, *i*, __u__), and inline `[[voice:xxxx]]` / `[[media:xxxx]]`
// chips. Both the public reveal and the owner's capsule view render through
// this, so a letter reads the same everywhere.

import type { ReactNode } from "react";
import type { AttachmentView } from "../types";
import { splitLetter, parseFont, parseSize, parseInline } from "../letter";
import { fontCss, fontSizePx } from "../fonts";
import { MediaItem } from "./Attachments";

/** Render one text segment's emphasis runs into styled spans. */
function runs(text: string): ReactNode[] {
  return parseInline(text).map((r, i) => {
    let node: ReactNode = r.text;
    if (r.b) node = <strong key={`b${i}`}>{node}</strong>;
    if (r.i) node = <em key={`i${i}`}>{node}</em>;
    if (r.u) node = <u key={`u${i}`}>{node}</u>;
    return <span key={i}>{node}</span>;
  });
}

type Block =
  | { kind: "text"; node: ReactNode }
  | { kind: "voice"; node: ReactNode }
  | { kind: "visual"; att: AttachmentView };

/**
 * Turn a stored body into rendered blocks — paragraphs, inline voice pills,
 * and photos/films exactly where they were dropped (consecutive ones grouped
 * into a side-by-side polaroid row) — plus the font to show it in and any
 * media that never got an inline spot (older letters, shown as a gallery).
 */
export function renderLetterBody(rawBody: string, attachments: AttachmentView[]): {
  nodes: ReactNode[];
  gallery: AttachmentView[];
  fontFamily: string;
  fontSize: number;
} {
  const { font, body: afterFont } = parseFont(rawBody);
  const fontFamily = fontCss(font);
  const { size, body } = parseSize(afterFont);
  const fontSize = fontSizePx(size);
  const byShort = new Map(attachments.map((a) => [a.id.slice(0, 8), a]));
  const usedInline = new Set<string>();

  const blocks: Block[] = [];
  splitLetter(body).forEach((seg, i) => {
    if (seg.type === "text") {
      if (seg.text.trim()) {
        blocks.push({
          kind: "text",
          node: (
            <p key={`t${i}`} className="whitespace-pre-wrap leading-[1.65]" style={{ fontFamily, fontSize }}>
              {runs(seg.text)}
            </p>
          ),
        });
      }
      return;
    }
    const att = byShort.get(seg.id);
    if (!att) return;
    usedInline.add(att.id);
    if (att.kind === "voice") blocks.push({ kind: "voice", node: <MediaItem key={`v${i}`} a={att} /> });
    else blocks.push({ kind: "visual", att });
  });

  // Consecutive photos/films (dropped back-to-back) share one row, polaroid
  // beside polaroid, instead of each stretching full width down the page.
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "visual") {
      const group: AttachmentView[] = [];
      while (i < blocks.length) {
        const next = blocks[i];
        if (next.kind !== "visual") break;
        group.push(next.att);
        i++;
      }
      nodes.push(
        <div key={`g${key++}`} className="my-2 flex flex-wrap justify-center gap-4 sm:justify-start">
          {group.map((att) => (
            <MediaItem key={att.id} a={att} />
          ))}
        </div>,
      );
    } else {
      nodes.push(b.node);
      i++;
    }
  }

  return { nodes, gallery: attachments.filter((a) => !usedInline.has(a.id)), fontFamily, fontSize };
}
