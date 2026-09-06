// Scheduled-message data layer — a letter addressed to a Contact, to be
// delivered by email at a chosen moment.
//
// A scheduled message REUSES a Capsule for its content (letter body + media),
// so the whole existing editor/media/reveal machinery works unchanged. The
// ScheduledMessage row links that capsule 1:1 to a recipient Contact and holds
// the "when" and delivery lifecycle. Like the rest of the data layer, every
// function is scoped to an `ownerId` — you only ever touch your own rows.

import { db } from "./prisma";
import type { ScheduledMessage, Capsule, Contact, Recurrence } from "@prisma/client";

export type { ScheduledMessage } from "@prisma/client";

// A scheduled message with the two things a screen always needs alongside it:
// the capsule that holds its words + media, and the person it's for.
export type ScheduledWithRelations = ScheduledMessage & {
  capsule: Capsule;
  contact: Contact;
};

/**
 * Start a new scheduled draft: create the backing capsule and the
 * ScheduledMessage that points at it and at the recipient. The contact must
 * belong to the owner. Returns the new row with its capsule + contact.
 */
export async function createScheduledDraft(
  ownerId: string,
  input: { contactId: string; template?: string | null; recipient?: string | null },
): Promise<ScheduledWithRelations | null> {
  const contact = await db.contact.findFirst({
    where: { id: input.contactId, ownerId },
  });
  if (!contact) return null;

  // Create the backing capsule first, then the message that links it to the
  // recipient — one row after the other keeps the types simple.
  const capsule = await db.capsule.create({
    data: {
      ownerId,
      type: "solo",
      template: input.template ?? null,
      // Default the "To —" line to the recipient's name.
      recipient: input.recipient ?? contact.name,
    },
  });

  return db.scheduledMessage.create({
    data: { ownerId, contactId: contact.id, capsuleId: capsule.id },
    include: { capsule: true, contact: true },
  });
}

/** One scheduled message you own (with capsule + contact), or null. */
export function getScheduled(
  id: string,
  ownerId: string,
): Promise<ScheduledWithRelations | null> {
  return db.scheduledMessage.findFirst({
    where: { id, ownerId },
    include: { capsule: true, contact: true },
  });
}

/** The scheduled message backed by a given capsule (used from the editor). */
export function getScheduledByCapsule(
  capsuleId: string,
  ownerId: string,
): Promise<ScheduledWithRelations | null> {
  return db.scheduledMessage.findFirst({
    where: { capsuleId, ownerId },
    include: { capsule: true, contact: true },
  });
}

/** Every scheduled message you own, newest first (with capsule + contact). */
export function listScheduled(ownerId: string): Promise<ScheduledWithRelations[]> {
  return db.scheduledMessage.findMany({
    where: { ownerId },
    include: { capsule: true, contact: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Lock in a send time. Moves the message to `scheduled` and seals the backing
 * capsule (unlock date = sendAt) so its words can't change after it's set to
 * go out. Only a draft can be scheduled. `sendAt` must be in the future.
 */
export async function scheduleMessage(
  id: string,
  ownerId: string,
  sendAt: Date,
  opts?: { occasion?: string | null; recurrence?: Recurrence },
): Promise<ScheduledWithRelations | null> {
  const existing = await db.scheduledMessage.findFirst({ where: { id, ownerId } });
  if (!existing || existing.status !== "draft") return null;
  if (sendAt.getTime() <= Date.now()) return null;

  await db.$transaction([
    db.scheduledMessage.update({
      where: { id },
      data: {
        sendAt,
        status: "scheduled",
        occasion: opts?.occasion ?? null,
        recurrence: opts?.recurrence ?? "none",
      },
    }),
    // Seal the backing capsule and mirror the send date onto it, so the reveal
    // link opens exactly when the message is delivered.
    db.capsule.update({
      where: { id: existing.capsuleId },
      data: {
        status: "sealed",
        sealedAt: new Date(),
        unlockType: "date",
        unlockDate: sendAt,
      },
    }),
  ]);

  return getScheduled(id, ownerId);
}

/**
 * Pull a scheduled message back to a draft so its time (or content) can change.
 * Re-opens the backing capsule for editing. Only a `scheduled` message can be
 * unscheduled — one already sent can't.
 */
export async function unscheduleMessage(
  id: string,
  ownerId: string,
): Promise<ScheduledWithRelations | null> {
  const existing = await db.scheduledMessage.findFirst({ where: { id, ownerId } });
  if (!existing || existing.status !== "scheduled") return null;

  await db.$transaction([
    db.scheduledMessage.update({
      where: { id },
      data: { sendAt: null, status: "draft", occasion: null, recurrence: "none" },
    }),
    db.capsule.update({
      where: { id: existing.capsuleId },
      data: { status: "draft", sealedAt: null, unlockDate: null },
    }),
  ]);

  return getScheduled(id, ownerId);
}

/**
 * Delete a scheduled message and its backing capsule (media cascades away with
 * it). Returns whether a row was removed.
 */
export async function deleteScheduled(id: string, ownerId: string): Promise<boolean> {
  const existing = await db.scheduledMessage.findFirst({
    where: { id, ownerId },
    select: { capsuleId: true },
  });
  if (!existing) return false;
  // Deleting the capsule cascades to the ScheduledMessage row and attachments.
  await db.capsule.deleteMany({ where: { id: existing.capsuleId, ownerId } });
  return true;
}
