// Upload media to a capsule. The browser POSTs multipart form-data with the
// file, its kind (voice|photo|video), and an optional duration. We verify the
// session, push the bytes to storage, and record the row — cleaning up storage
// if the DB write is rejected (e.g. the capsule is already sealed).

import {
  addAttachment,
  uploadObject,
  removeObject,
  signedUrl,
} from "@someday/backend";
import { getOwnerId } from "@/lib/auth";
import type { AttachmentKind } from "@/app/app/types";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB per file
const KINDS: AttachmentKind[] = ["voice", "photo", "video"];

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

function extFor(mime: string, filename: string): string {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  const fromName = filename.includes(".") ? filename.split(".").pop() : "";
  return (fromName || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
}

export async function POST(req: Request, { params }: RouteContext<"/api/capsule/[id]/media">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "") as AttachmentKind;
  const durationRaw = form.get("durationSec");

  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (!KINDS.includes(kind)) return Response.json({ error: "Bad kind" }, { status: 400 });
  if (file.size === 0) return Response.json({ error: "Empty file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large (max 50MB)" }, { status: 413 });

  const durationSec = durationRaw != null && durationRaw !== "" ? Math.round(Number(durationRaw)) : null;
  const mime = file.type || "application/octet-stream";
  const attachmentId = crypto.randomUUID();
  const path = `${ownerId}/${id}/${attachmentId}.${extFor(mime, file.name)}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    await uploadObject(path, bytes, mime);
  } catch (err) {
    console.error("media upload failed", err);
    return Response.json({ error: "Storage upload failed" }, { status: 502 });
  }

  const row = await addAttachment(ownerId, id, {
    kind,
    storagePath: path,
    mimeType: mime,
    sizeBytes: file.size,
    durationSec: Number.isFinite(durationSec) ? durationSec : null,
  });

  if (!row) {
    // Capsule isn't ours or is already sealed — don't leave an orphan object.
    await removeObject(path).catch(() => {});
    return Response.json({ error: "Capsule not open for edits" }, { status: 403 });
  }

  return Response.json({
    attachment: {
      id: row.id,
      kind: row.kind,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      durationSec: row.durationSec,
      url: await signedUrl(path),
    },
  });
}
