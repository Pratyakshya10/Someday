// Shared helpers for media upload routes (capsule + journal attachments).

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB per file

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

/** A safe file extension for a stored object, from its mime type or (as a
 *  fallback) the original filename. */
export function extFor(mime: string, filename: string): string {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  const fromName = filename.includes(".") ? filename.split(".").pop() : "";
  return (fromName || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
}
