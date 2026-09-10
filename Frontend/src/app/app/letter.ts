// Inline voice notes and photos/videos live inside the letter body as short
// markers — `[[voice:1a2b3c4d]]` or `[[media:1a2b3c4d]]` (the 8-char prefix of
// an attachment id). These helpers insert, strip, and split them so a voice
// note or a photo can sit *amidst the text*, exactly where the writer put it.

export const VOICE_TOKEN_RE = /\[\[voice:([0-9a-f]{8})\]\]/g;
export const MEDIA_TOKEN_RE = /\[\[media:([0-9a-f]{8})\]\]/g;
const ANY_TOKEN_RE = /\[\[(voice|media):([0-9a-f]{8})\]\]/g;

// The whole-letter font choice rides at the very start of the body as a
// `[[font:slug]]` token, so a font can be stored without a DB column. Only a
// leading token counts — text elsewhere is left alone.
export const FONT_TOKEN_RE = /^\s*\[\[font:([a-z0-9-]+)\]\]\n?/;

/** Pull a leading font token off a body, returning the slug and the remainder. */
export function parseFont(body: string): { font: string | null; body: string } {
  const m = body.match(FONT_TOKEN_RE);
  if (!m) return { font: null, body };
  return { font: m[1], body: body.slice(m[0].length) };
}

/** Re-attach (or drop, when default/null) a font token at the start of a body. */
export function withFont(font: string | null, body: string): string {
  const { body: rest } = parseFont(body);
  const clean = rest.replace(/^\n+/, "");
  return font && font !== "default" ? `[[font:${font}]]\n${clean}` : clean;
}

// Inline emphasis is stored as lightweight markdown: **bold**, *italic*,
// __underline__. A run is a stretch of text sharing the same emphasis.
export interface TextRun {
  text: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
}

/** Split a text segment into emphasis runs. The markers act as toggles, which
 *  mirrors how the editor serializes nested <b>/<i>/<u>. */
export function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let b = false;
  let i = false;
  let u = false;
  let buf = "";
  const flush = () => {
    if (buf) runs.push({ text: buf, b, i, u });
    buf = "";
  };
  let k = 0;
  while (k < text.length) {
    const two = text.slice(k, k + 2);
    if (two === "**") { flush(); b = !b; k += 2; continue; }
    if (two === "__") { flush(); u = !u; k += 2; continue; }
    if (text[k] === "*") { flush(); i = !i; k += 1; continue; }
    buf += text[k];
    k += 1;
  }
  flush();
  return runs;
}

/** Drop the inline emphasis markers, leaving just the words. */
export function stripInline(text: string): string {
  return parseInline(text).map((r) => r.text).join("");
}

/** The marker to embed for a given attachment id. */
export function voiceToken(attachmentId: string): string {
  return `[[voice:${attachmentId.slice(0, 8)}]]`;
}

/** The marker to embed for a photo/video attachment id. */
export function mediaToken(attachmentId: string): string {
  return `[[media:${attachmentId.slice(0, 8)}]]`;
}

function insertToken(body: string, pos: number, token: string): string {
  const before = body.slice(0, pos);
  const after = body.slice(pos);
  const lead = before.length === 0 || before.endsWith("\n") ? "" : "\n";
  const trail = after.startsWith("\n") || after.length === 0 ? "" : "\n";
  return `${before}${lead}${token}${trail}${after}`;
}

/** Insert a voice marker into `body` at `pos`, on its own line. */
export function insertVoiceToken(body: string, pos: number, attachmentId: string): string {
  return insertToken(body, pos, voiceToken(attachmentId));
}

/** Insert a photo/video marker into `body` at `pos`, on its own line. */
export function insertMediaToken(body: string, pos: number, attachmentId: string): string {
  return insertToken(body, pos, mediaToken(attachmentId));
}

function removeToken(body: string, kind: "voice" | "media", attachmentId: string): string {
  const short = attachmentId.slice(0, 8);
  return body
    .replace(new RegExp(`\\n?\\[\\[${kind}:${short}\\]\\]\\n?`, "g"), "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Remove the marker for a given attachment id (used when the note is deleted). */
export function removeVoiceToken(body: string, attachmentId: string): string {
  return removeToken(body, "voice", attachmentId);
}

/** Remove a photo/video's marker (used when it's deleted or was never inline). */
export function removeMediaToken(body: string, attachmentId: string): string {
  return removeToken(body, "media", attachmentId);
}

/** Plain body text — voice/media markers, the font token, and emphasis markers
 *  all stripped (for previews/excerpts). */
export function stripVoiceTokens(body: string): string {
  const { body: noFont } = parseFont(body);
  return stripInline(noFont.replace(ANY_TOKEN_RE, "")).replace(/\n{3,}/g, "\n\n").trim();
}

export type LetterSegment = { type: "text"; text: string } | { type: "voice" | "media"; id: string };

/** Split a body into text runs and voice/media markers, in order. */
export function splitLetter(body: string): LetterSegment[] {
  const out: LetterSegment[] = [];
  const re = new RegExp(ANY_TOKEN_RE);
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push({ type: "text", text: body.slice(last, m.index) });
    out.push({ type: m[1] === "voice" ? "voice" : "media", id: m[2] });
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push({ type: "text", text: body.slice(last) });
  return out;
}
