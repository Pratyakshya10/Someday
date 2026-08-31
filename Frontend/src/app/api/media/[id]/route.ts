// Delete one media attachment (only while its capsule is still a draft).
// Removes the DB row first, then the stored bytes.

import { deleteAttachment, removeObject } from "@someday/backend";
import { getOwnerId } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const storagePath = await deleteAttachment(id, ownerId);
  if (!storagePath) return Response.json({ error: "Not found or locked" }, { status: 404 });

  await removeObject(storagePath).catch(() => {});
  return Response.json({ ok: true });
}
