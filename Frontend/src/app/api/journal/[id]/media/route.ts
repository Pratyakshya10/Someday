// Upload media to a journal entry. Mirrors /api/capsule/[id]/media — same
// multipart shape, same storage-then-record flow — but a journal entry has
// no draft/sealed lifecycle to gate on, just ownership.

import {
  addJournalAttachment,
  uploadObject,
  removeObject,
  signedUrl,
} from "@someday/backend";
import { getOwnerId } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, extFor } from "@/lib/media";
import type { AttachmentKind } from "@/app/app/types";

const KINDS: AttachmentKind[] = ["voice", "photo", "video"];

export async function POST(req: Request, { params }: RouteContext<"/api/journal/[id]/media">) {
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
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "File too large (max 50MB)" }, { status: 413 });

  const durationSec = durationRaw != null && durationRaw !== "" ? Math.round(Number(durationRaw)) : null;
  const mime = file.type || "application/octet-stream";
  const attachmentId = crypto.randomUUID();
  const path = `${ownerId}/journal/${id}/${attachmentId}.${extFor(mime, file.name)}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    await uploadObject(path, bytes, mime);
  } catch (err) {
    console.error("journal media upload failed", err);
    return Response.json({ error: "Storage upload failed" }, { status: 502 });
  }

  const row = await addJournalAttachment(ownerId, id, {
    kind,
    storagePath: path,
    mimeType: mime,
    sizeBytes: file.size,
    durationSec: Number.isFinite(durationSec) ? durationSec : null,
  });

  if (!row) {
    // Entry isn't ours — don't leave an orphan object.
    await removeObject(path).catch(() => {});
    return Response.json({ error: "Entry not found" }, { status: 403 });
  }

  return Response.json({
    attachment: {
      id: row.id,
      kind: row.kind,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      durationSec: row.durationSec,
      caption: row.caption,
      url: await signedUrl(path),
    },
  });
}
