// Inline voice notes live inside the letter body as short markers like
// `[[voice:1a2b3c4d]]` (the 8-char prefix of an attachment id). These helpers
// insert, strip, and split them so a voice note can sit *amidst the text*.

export const VOICE_TOKEN_RE = /\[\[voice:([0-9a-f]{8})\]\]/g;

/** The marker to embed for a given attachment id. */
export function voiceToken(attachmentId: string): string {
  return `[[voice:${attachmentId.slice(0, 8)}]]`;
}

/** Insert a voice marker into `body` at `pos`, on its own line. */
export function insertVoiceToken(body: string, pos: number, attachmentId: string): string {
  const before = body.slice(0, pos);
  const after = body.slice(pos);
  const lead = before.length === 0 || before.endsWith("\n") ? "" : "\n";
  const trail = after.startsWith("\n") || after.length === 0 ? "" : "\n";
  return `${before}${lead}${voiceToken(attachmentId)}${trail}${after}`;
}

/** Remove the marker for a given attachment id (used when the note is deleted). */
export function removeVoiceToken(body: string, attachmentId: string): string {
  const short = attachmentId.slice(0, 8);
  return body
    .replace(new RegExp(`\\n?\\[\\[voice:${short}\\]\\]\\n?`, "g"), "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Body text with all voice markers stripped (for previews/excerpts). */
export function stripVoiceTokens(body: string): string {
  return body.replace(VOICE_TOKEN_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

export type LetterSegment = { type: "text"; text: string } | { type: "voice"; id: string };

/** Split a body into text runs and voice markers, in order. */
export function splitLetter(body: string): LetterSegment[] {
  const out: LetterSegment[] = [];
  const re = new RegExp(VOICE_TOKEN_RE);
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) out.push({ type: "text", text: body.slice(last, m.index) });
    out.push({ type: "voice", id: m[1] });
    last = m.index + m[0].length;
  }
  if (last < body.length) out.push({ type: "text", text: body.slice(last) });
  return out;
}
