// Delete or caption one journal attachment. Mirrors /api/media/[id] — a
// journal entry has no draft/sealed lifecycle, so there's no "locked" case,
// just ownership.

import { deleteJournalAttachment, setJournalAttachmentCaption, removeObject } from "@someday/backend";
import { getOwnerId } from "@/lib/auth";

const MAX_CAPTION = 140;

export async function DELETE(_req: Request, { params }: RouteContext<"/api/journal-media/[id]">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const storagePath = await deleteJournalAttachment(id, ownerId);
  if (!storagePath) return Response.json({ error: "Not found" }, { status: 404 });

  await removeObject(storagePath).catch(() => {});
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: RouteContext<"/api/journal-media/[id]">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const raw = typeof body?.caption === "string" ? body.caption.trim() : "";
  const caption = raw ? raw.slice(0, MAX_CAPTION) : null;

  const row = await setJournalAttachmentCaption(id, ownerId, caption);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ok: true, caption: row.caption });
}
