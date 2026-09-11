// Scheduled-message data layer — a letter addressed to a Contact, to be
// delivered by email at a chosen moment.
//
// A scheduled message REUSES a Capsule for its content (letter body + media),
// so the whole existing editor/media/reveal machinery works unchanged. The
// ScheduledMessage row links that capsule 1:1 to a recipient Contact and holds
// the "when" and delivery lifecycle. Like the rest of the data layer, every
// function is scoped to an `ownerId` — you only ever touch your own rows.

import { db } from "./prisma";
import { addContact } from "./contacts";
import type { ScheduledMessage, Capsule, Contact, Recurrence } from "@prisma/client";

export type { ScheduledMessage } from "@prisma/client";

// A scheduled message with the two things a screen always needs alongside it:
// the capsule that holds its words + media, and the person it's for (which is
// null until the writer chooses a recipient).
export type ScheduledWithRelations = ScheduledMessage & {
  capsule: Capsule;
  contact: Contact | null;
};

/**
 * Start a new message: create the backing capsule and the ScheduledMessage that
 * points at it. The recipient is chosen later (compose-first flow), so no
 * contact is needed yet.
 */
export async function createScheduledDraft(
  ownerId: string,
  input?: { template?: string | null; recipient?: string | null },
): Promise<ScheduledWithRelations> {
  // Create the backing capsule first, then the message that links it — one row
  // after the other keeps the types simple.
  const capsule = await db.capsule.create({
    data: {
      ownerId,
      type: "solo",
      template: input?.template ?? null,
      recipient: input?.recipient ?? null,
    },
  });

  return db.scheduledMessage.create({
    data: { ownerId, capsuleId: capsule.id },
    include: { capsule: true, contact: true },
  });
}

/**
 * Choose (or change) the recipient of a draft. Either points at an existing
 * saved contact, or creates/updates one from a typed name+email. The contact is
 * always saved to the owner's address book. Returns the updated message.
 */
export async function setRecipient(
  id: string,
  ownerId: string,
  recipient: { contactId: string } | { name: string; email: string },
): Promise<ScheduledWithRelations | null> {
  const message = await db.scheduledMessage.findFirst({ where: { id, ownerId } });
  if (!message || message.status !== "draft") return null;

  let contact: Contact | null;
  if ("contactId" in recipient) {
    contact = await db.contact.findFirst({ where: { id: recipient.contactId, ownerId } });
  } else {
    contact = await addContact(ownerId, { name: recipient.name, email: recipient.email });
  }
  if (!contact) return null;

  await db.scheduledMessage.update({ where: { id }, data: { contactId: contact.id } });
  // Default the letter's "To —" line to the recipient's name if unset.
  await db.capsule.updateMany({
    where: { id: message.capsuleId, recipient: null },
    data: { recipient: contact.name },
  });
  return getScheduled(id, ownerId);
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
 * Look a message up by its public reveal token — NOT owner-scoped, because the
 * recipient who follows the emailed link isn't signed in. The token is the
 * capability. Only returns a message that has actually been sent (or is due),
 * so a link can't reveal a letter before its moment.
 */
export function getScheduledByToken(token: string): Promise<ScheduledWithRelations | null> {
  return db.scheduledMessage.findUnique({
    where: { token },
    include: { capsule: true, contact: true },
  });
}

// A `failed` send is retried automatically by the same cron sweep — not by
// the owner clicking a button — but only after this cooldown, so a
// permanently-bad address doesn't get hammered every cron tick.
const RETRY_COOLDOWN_MS = 30 * 60 * 1000;

function retryEligible(now: Date) {
  return { status: "failed" as const, updatedAt: { lte: new Date(now.getTime() - RETRY_COOLDOWN_MS) } };
}

/** Ids of messages due to go out right now: scheduled (or a past failed
 *  attempt past its retry cooldown), with a send time now or past. Just
 *  ids — claim each one individually before touching it. */
export async function listDueMessageIds(now: Date = new Date()): Promise<string[]> {
  const rows = await db.scheduledMessage.findMany({
    where: { sendAt: { lte: now }, OR: [{ status: "scheduled" }, retryEligible(now)] },
    select: { id: true },
    orderBy: { sendAt: "asc" },
  });
  return rows.map((r) => r.id);
}

/**
 * Atomically claim one due message for delivery — flips it to `sending` only
 * if it's still eligible (still `scheduled`, or `failed` past its retry
 * cooldown). If a delivery run is triggered more than once for the same
 * window (two overlapping cron calls, an external scheduler firing faster
 * than a run finishes, …), only the caller that wins this flip gets to send
 * it; everyone else sees count 0 and moves on. Returns the full row on a
 * win, or null if someone else already has it (or it's gone).
 */
export async function claimDueMessage(id: string): Promise<ScheduledWithRelations | null> {
  const now = new Date();
  const res = await db.scheduledMessage.updateMany({
    where: { id, OR: [{ status: "scheduled" }, retryEligible(now)] },
    data: { status: "sending" },
  });
  if (res.count === 0) return null;
  return db.scheduledMessage.findUnique({
    where: { id },
    include: { capsule: true, contact: true },
  });
}

/**
 * Mark a message delivered: stamp it sent, backfill its send time if it went
 * out immediately, and seal the backing capsule so the reveal link opens.
 */
export async function markSent(id: string, capsuleId: string, sendAt: Date): Promise<void> {
  await db.$transaction([
    db.scheduledMessage.update({
      where: { id },
      data: { status: "sent", sentAt: new Date(), sendAt },
    }),
    db.capsule.update({
      where: { id: capsuleId },
      data: { status: "sealed", sealedAt: new Date(), unlockType: "date", unlockDate: sendAt },
    }),
  ]);
}

/** Mark a delivery attempt failed (so it isn't retried in a tight loop). */
export function markFailed(id: string): Promise<ScheduledMessage> {
  return db.scheduledMessage.update({
    where: { id },
    data: { status: "failed" },
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
  if (!existing.contactId) return null; // must have a recipient first
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
