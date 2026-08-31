// Attachment data layer — every read/write of a capsule's media goes through
// here, always scoped to an ownerId. Storage (the bytes) is handled separately
// in ./storage; this module owns only the database rows.

import { db } from "./prisma";
import type { Attachment, AttachmentKind } from "@prisma/client";

export type { Attachment } from "@prisma/client";

export interface NewAttachment {
  kind: AttachmentKind;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number | null;
}

/**
 * Record a freshly uploaded attachment — but only on a capsule you own that is
 * still a draft (you can't add media to something already sealed). Returns the
 * row, or null if the capsule isn't yours / isn't a draft.
 */
export async function addAttachment(
  ownerId: string,
  capsuleId: string,
  input: NewAttachment,
): Promise<Attachment | null> {
  const capsule = await db.capsule.findUnique({
    where: { id: capsuleId },
    select: { id: true, ownerId: true, status: true },
  });
  if (!capsule || capsule.status !== "draft") return null;

  // The uploader must be the owner, or an owner/editor member of a group capsule.
  let mayEdit = capsule.ownerId === ownerId;
  if (!mayEdit) {
    const member = await db.capsuleMember.findUnique({
      where: { capsuleId_userId: { capsuleId, userId: ownerId } },
      select: { role: true },
    });
    mayEdit = member?.role === "owner" || member?.role === "editor";
  }
  if (!mayEdit) return null;

  return db.attachment.create({
    data: {
      capsuleId,
      ownerId, // = the uploader; in a group this identifies whose note it's on
      kind: input.kind,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationSec: input.durationSec ?? null,
    },
  });
}

/** Attachments a specific person uploaded to a capsule (their own note's media). */
export function listAttachments(capsuleId: string, ownerId: string): Promise<Attachment[]> {
  return db.attachment.findMany({
    where: { capsuleId, ownerId },
    orderBy: { createdAt: "asc" },
  });
}

/** Every attachment on a capsule, regardless of uploader (for group reveal).
 *  The caller must have already verified the viewer may see this capsule. */
export function listCapsuleAttachments(capsuleId: string): Promise<Attachment[]> {
  return db.attachment.findMany({
    where: { capsuleId },
    orderBy: { createdAt: "asc" },
  });
}

/** One attachment you own, or null. */
export function getAttachment(id: string, ownerId: string): Promise<Attachment | null> {
  return db.attachment.findFirst({ where: { id, ownerId } });
}

/**
 * Delete an attachment row (only while its capsule is a draft) and return the
 * storagePath so the caller can remove the bytes too. Null if not found / not
 * a draft.
 */
export async function deleteAttachment(id: string, ownerId: string): Promise<string | null> {
  const found = await db.attachment.findFirst({
    where: { id, ownerId },
    include: { capsule: { select: { status: true } } },
  });
  if (!found || found.capsule.status !== "draft") return null;
  await db.attachment.delete({ where: { id: found.id } });
  return found.storagePath;
}
