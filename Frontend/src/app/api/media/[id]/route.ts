// Delete or caption one media attachment (only while its capsule is a draft).
// DELETE removes the DB row first, then the stored bytes. PATCH sets/clears
// the handwritten caption shown under a photo/video on the reveal.

import { deleteAttachment, setAttachmentCaption, removeObject } from "@someday/backend";
import { getOwnerId } from "@/lib/auth";

const MAX_CAPTION = 140;

export async function DELETE(_req: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const storagePath = await deleteAttachment(id, ownerId);
  if (!storagePath) return Response.json({ error: "Not found or locked" }, { status: 404 });

  await removeObject(storagePath).catch(() => {});
  return Response.json({ ok: true });
}

export async function PATCH(req: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const raw = typeof body?.caption === "string" ? body.caption.trim() : "";
  const caption = raw ? raw.slice(0, MAX_CAPTION) : null;

  const row = await setAttachmentCaption(id, ownerId, caption);
  if (!row) return Response.json({ error: "Not found or locked" }, { status: 404 });

  return Response.json({ ok: true, caption: row.caption });
}
