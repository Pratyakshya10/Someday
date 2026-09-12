// Capsule data layer — every read and write of a capsule goes through here.
//
// Keeping the queries in one place (rather than scattered across the frontend)
// means the "shape" of a capsule and the rules around it — you can only touch
// your own, a sealed capsule can't be edited — live in exactly one file.
//
// Every function takes an `ownerId` and scopes its query to it. That is the
// whole authorization model: you can only ever see or change rows you own.

import { db } from "./prisma";
import { getUserEmails } from "./admin";
import { sendEmail } from "./email";
import type { Capsule, CapsuleType } from "@prisma/client";

export type { Capsule } from "@prisma/client";

// The fields a writer can edit while a capsule is still a draft.
export interface DraftEdits {
  recipient?: string | null;
  title?: string | null;
  body?: string | null;
}

/** Every capsule you own, newest first. */
export function listCapsules(ownerId: string): Promise<Capsule[]> {
  return db.capsule.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Every capsule you can see in the vault — ones you own, plus group capsules
 * you're in. Capsules that back a scheduled message (`scheduled` is set) are the
 * content of a letter addressed to someone else and live on the Scheduled page,
 * so they're excluded here.
 */
export function listUserCapsules(userId: string): Promise<Capsule[]> {
  return db.capsule.findMany({
    where: {
      scheduled: null,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

/** One capsule you own, or null if it doesn't exist / isn't yours. */
export function getCapsule(id: string, ownerId: string): Promise<Capsule | null> {
  return db.capsule.findFirst({ where: { id, ownerId } });
}

export interface UnseenUnlockedCapsule {
  id: string;
  title: string | null;
  type: CapsuleType;
  unlockedAt: Date;
}

/**
 * Capsules you can access that are unlocked and you haven't looked at since
 * — surfaced as a "ready to open" sidebar notification. A solo capsule has
 * no CapsuleMember row for its owner, so it checks ownerViewedUnlockAt
 * instead of a member's viewedAt.
 */
export async function listUnseenUnlocked(userId: string): Promise<UnseenUnlockedCapsule[]> {
  const rows = await db.capsule.findMany({
    where: {
      status: "unlocked",
      scheduled: null,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: { members: { where: { userId }, select: { viewedAt: true } } },
    orderBy: { unlockedAt: "desc" },
  });
  return rows
    .filter((c) => {
      if (!c.unlockedAt) return false;
      if (c.type === "group") {
        const viewedAt = c.members[0]?.viewedAt ?? null;
        return !viewedAt || viewedAt < c.unlockedAt;
      }
      return !c.ownerViewedUnlockAt || c.ownerViewedUnlockAt < c.unlockedAt;
    })
    .map((c) => ({ id: c.id, title: c.title, type: c.type, unlockedAt: c.unlockedAt! }));
}

/** Record that this viewer has looked at a capsule right now — clears it
 *  from their "newly unlocked" list. Harmless to call on one that isn't
 *  (yet) unlocked. */
export async function markCapsuleViewed(capsuleId: string, userId: string, isGroup: boolean): Promise<void> {
  if (isGroup) {
    await db.capsuleMember.updateMany({ where: { capsuleId, userId }, data: { viewedAt: new Date() } });
  } else {
    await db.capsule.updateMany({ where: { id: capsuleId, ownerId: userId }, data: { ownerViewedUnlockAt: new Date() } });
  }
}

/** One capsule you can access (own it, or are a member) — plus your role. */
export async function getAccessibleCapsule(
  id: string,
  userId: string,
): Promise<{ capsule: Capsule; isOwner: boolean } | null> {
  const capsule = await db.capsule.findUnique({ where: { id } });
  if (!capsule) return null;
  if (capsule.ownerId === userId) return { capsule, isOwner: true };
  const member = await db.capsuleMember.findUnique({
    where: { capsuleId_userId: { capsuleId: id, userId } },
    select: { id: true },
  });
  return member ? { capsule, isOwner: false } : null;
}

/**
 * Start a new draft and return it. For a group capsule the creator is recorded
 * as the owner member and given an (empty) note to fill in.
 */
export function createDraft(
  ownerId: string,
  input: { type: CapsuleType; template?: string | null; recipient?: string | null },
): Promise<Capsule> {
  const group = input.type === "group";
  return db.capsule.create({
    data: {
      ownerId,
      type: input.type,
      template: input.template ?? null,
      recipient: input.recipient ?? null,
      ...(group
        ? {
            members: { create: { userId: ownerId, role: "owner" } },
            contributions: { create: { authorId: ownerId, body: "" } },
          }
        : {}),
    },
  });
}

/**
 * Save edits to a draft. Refuses to touch a capsule that is already sealed —
 * the whole promise of Someday is that a sealed letter can't be changed.
 * Returns the updated capsule, or null if it wasn't found / not a draft.
 */
export async function saveDraft(
  id: string,
  ownerId: string,
  edits: DraftEdits,
): Promise<Capsule | null> {
  const result = await db.capsule.updateMany({
    where: { id, ownerId, status: "draft" },
    data: edits,
  });
  if (result.count === 0) return null;
  return getCapsule(id, ownerId);
}

/** Set (or change) the delivery date on a draft (switches unlock type to date). */
export async function setDeliveryDate(
  id: string,
  ownerId: string,
  unlockDate: Date,
): Promise<Capsule | null> {
  const result = await db.capsule.updateMany({
    where: { id, ownerId, status: "draft" },
    data: {
      unlockType: "date",
      unlockDate,
      // Clear any other unlock config so the type is unambiguous.
      unlockLat: null,
      unlockLng: null,
      unlockRadiusM: null,
      unlockPlaceLabel: null,
      unlockMilestone: null,
    },
  });
  if (result.count === 0) return null;
  return getCapsule(id, ownerId);
}

/** Set a place-based unlock on a draft (switches unlock type to location). */
export async function setDeliveryLocation(
  id: string,
  ownerId: string,
  place: { lat: number; lng: number; radiusM: number; label?: string | null },
): Promise<Capsule | null> {
  const result = await db.capsule.updateMany({
    where: { id, ownerId, status: "draft" },
    data: {
      unlockType: "location",
      unlockLat: place.lat,
      unlockLng: place.lng,
      unlockRadiusM: place.radiusM,
      unlockPlaceLabel: place.label ?? null,
      unlockDate: null,
      unlockMilestone: null,
    },
  });
  if (result.count === 0) return null;
  return getCapsule(id, ownerId);
}

/** Set a milestone-based unlock on a draft (switches unlock type to milestone). */
export async function setDeliveryMilestone(
  id: string,
  ownerId: string,
  milestone: string,
): Promise<Capsule | null> {
  const result = await db.capsule.updateMany({
    where: { id, ownerId, status: "draft" },
    data: {
      unlockType: "milestone",
      unlockMilestone: milestone,
      unlockDate: null,
      unlockLat: null,
      unlockLng: null,
      unlockRadiusM: null,
      unlockPlaceLabel: null,
    },
  });
  if (result.count === 0) return null;
  return getCapsule(id, ownerId);
}

/** Whether a draft has enough unlock config for its type to be sealed. */
function hasUnlockConfig(c: Capsule): boolean {
  if (c.unlockType === "date") return c.unlockDate != null;
  if (c.unlockType === "location") return c.unlockLat != null && c.unlockLng != null && c.unlockRadiusM != null;
  if (c.unlockType === "milestone") return !!c.unlockMilestone;
  return false;
}

/**
 * Seal a draft: lock it shut and stamp the moment. Only a draft whose unlock
 * condition is fully configured (a date, a place, or a milestone) can be sealed.
 */
export async function sealCapsule(id: string, ownerId: string): Promise<Capsule | null> {
  const capsule = await db.capsule.findFirst({ where: { id, ownerId, status: "draft" } });
  if (!capsule || !hasUnlockConfig(capsule)) return null;
  await db.capsule.updateMany({
    where: { id, ownerId, status: "draft" },
    data: { status: "sealed", sealedAt: new Date() },
  });
  return getCapsule(id, ownerId);
}

/** Flip a sealed capsule to unlocked (internal helper). */
async function markUnlocked(id: string, ownerId: string): Promise<Capsule | null> {
  await db.capsule.updateMany({
    where: { id, ownerId, status: "sealed" },
    data: { status: "unlocked", unlockedAt: new Date() },
  });
  return getCapsule(id, ownerId);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/**
 * Email everyone with access (the owner, plus every member for a group
 * capsule) that a capsule is ready to open. Idempotent via
 * unlockNotifiedAt — whichever unlock path actually flips the status (a
 * visit, an owner action, the cron sweep) calls this, but only the first
 * caller wins the race and only one round of emails ever goes out.
 */
export async function notifyUnlock(capsule: Capsule, baseUrl: string): Promise<void> {
  // A capsule backing a scheduled message is delivered by its own /r/[token]
  // email — never notify about it here too, regardless of which caller got
  // this far (defense in depth: the cron sweep also excludes these up front).
  const backsScheduled = await db.scheduledMessage.findUnique({ where: { capsuleId: capsule.id }, select: { id: true } });
  if (backsScheduled) return;

  const claimed = await db.capsule.updateMany({
    where: { id: capsule.id, unlockNotifiedAt: null },
    data: { unlockNotifiedAt: new Date() },
  });
  if (claimed.count === 0) return; // already notified (or lost the race to another path)

  const recipientIds = [capsule.ownerId];
  if (capsule.type === "group") {
    const members = await db.capsuleMember.findMany({ where: { capsuleId: capsule.id }, select: { userId: true } });
    for (const m of members) if (!recipientIds.includes(m.userId)) recipientIds.push(m.userId);
  }
  const emails = await getUserEmails(recipientIds);
  if (emails.size === 0) return;

  const title = capsule.title || "Untitled capsule";
  const url = `${baseUrl.replace(/\/$/, "")}/app/capsule/${capsule.id}`;
  const subject = `"${title}" is ready to open`;
  const text = `${title} has unlocked and is ready to read.\n\nOpen it here: ${url}\n\n— Someday`;
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;background:#f7ecde;font-family:Georgia,'Times New Roman',serif;color:#2b2621;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffaf3;border:1px solid #e7dccb;border-radius:16px;padding:40px;">
          <tr><td style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#a99a86;padding-bottom:20px;">Someday</td></tr>
          <tr><td style="font-size:24px;line-height:1.3;padding-bottom:16px;">&ldquo;${escapeHtml(title)}&rdquo; is ready</td></tr>
          <tr><td style="font-size:16px;line-height:1.6;color:#5b5348;padding-bottom:28px;">
            It just unlocked and is ready to read.
          </td></tr>
          <tr><td>
            <a href="${url}" style="display:inline-block;background:#2b2621;color:#f8f2e8;text-decoration:none;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Open it</a>
          </td></tr>
          <tr><td style="font-size:13px;color:#a99a86;padding-top:28px;line-height:1.5;">
            If the button doesn't work, paste this link into your browser:<br>
            <a href="${url}" style="color:#8a7d68;">${url}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  await Promise.all([...emails.values()].map((to) => sendEmail({ to, subject, html, text })));
}

/**
 * Sweep every sealed date-capsule whose day has come and open it — the cron
 * counterpart to openIfDue, for capsules nobody has happened to visit yet.
 * Each one that actually flips is notified the same way any other unlock
 * path would.
 */
export async function unlockDueCapsules(baseUrl: string): Promise<{ opened: number }> {
  const due = await db.capsule.findMany({
    // scheduled: null excludes a capsule that backs a scheduled message —
    // markSent() stamps one of those with status "sealed" + unlockDate =
    // sendAt as pure bookkeeping (it's delivered by email via its own
    // /r/[token] link, never through this vault-unlock path), so without
    // this it reads as just another due capsule and gets wrongly re-opened.
    where: { status: "sealed", unlockType: "date", unlockDate: { lte: new Date() }, scheduled: null },
    select: { id: true },
  });
  let opened = 0;
  for (const { id } of due) {
    const claimed = await db.capsule.updateMany({
      where: { id, status: "sealed" },
      data: { status: "unlocked", unlockedAt: new Date() },
    });
    if (claimed.count === 0) continue; // a page visit beat the sweep to it
    const fresh = await db.capsule.findUnique({ where: { id } });
    if (!fresh) continue;
    await notifyUnlock(fresh, baseUrl);
    opened++;
  }
  return { opened };
}

/**
 * Open a DATE capsule once its delivery date has arrived. Idempotent: opening
 * an already-open capsule just returns it; not-yet-due capsules are unchanged.
 */
export async function openCapsule(id: string, ownerId: string): Promise<Capsule | null> {
  const capsule = await getCapsule(id, ownerId);
  if (!capsule) return null;
  if (capsule.status === "unlocked") return capsule;
  const due = capsule.unlockDate != null && capsule.unlockDate.getTime() <= Date.now();
  if (capsule.status !== "sealed" || capsule.unlockType !== "date" || !due) return capsule;
  return markUnlocked(id, ownerId);
}

/**
 * Open a sealed DATE capsule if its day has arrived — WITHOUT owner scoping.
 * The caller must have already verified the viewer may access this capsule
 * (used so any group member triggers the date unlock, not just the owner).
 */
export async function openIfDue(id: string): Promise<Capsule | null> {
  const capsule = await db.capsule.findUnique({ where: { id }, include: { scheduled: { select: { id: true } } } });
  if (!capsule) return null;
  if (capsule.status === "unlocked") return capsule;
  // A capsule backing a scheduled message has its own /r/[token] delivery —
  // this vault-unlock path is never the right one for it.
  if (capsule.scheduled) return capsule;
  const due = capsule.unlockType === "date" && capsule.unlockDate != null && capsule.unlockDate.getTime() <= Date.now();
  if (capsule.status !== "sealed" || !due) return capsule;
  await db.capsule.updateMany({ where: { id, status: "sealed" }, data: { status: "unlocked", unlockedAt: new Date() } });
  return db.capsule.findUnique({ where: { id } });
}

/** Metres between two lat/lng points (haversine). */
function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export type LocationOpenResult =
  | { ok: true; capsule: Capsule }
  | { ok: false; reason: "not_found" | "wrong_type" | "too_far"; distanceM?: number };

/**
 * Open a LOCATION capsule if the reader's reported coordinates are within the
 * unlock radius. The server re-checks the distance itself, so a client can't
 * open it just by asking.
 */
export async function openByLocation(
  id: string,
  ownerId: string,
  lat: number,
  lng: number,
): Promise<LocationOpenResult> {
  const capsule = await getCapsule(id, ownerId);
  if (!capsule) return { ok: false, reason: "not_found" };
  if (capsule.status === "unlocked") return { ok: true, capsule };
  if (capsule.status !== "sealed" || capsule.unlockType !== "location" || capsule.unlockLat == null || capsule.unlockLng == null) {
    return { ok: false, reason: "wrong_type" };
  }
  const dist = distanceM(lat, lng, capsule.unlockLat, capsule.unlockLng);
  if (dist > (capsule.unlockRadiusM ?? 0)) return { ok: false, reason: "too_far", distanceM: Math.round(dist) };
  const opened = await markUnlocked(id, ownerId);
  return opened ? { ok: true, capsule: opened } : { ok: false, reason: "not_found" };
}

/** Open a MILESTONE capsule — the reader attests the event has happened. */
export async function openByMilestone(id: string, ownerId: string): Promise<Capsule | null> {
  const capsule = await getCapsule(id, ownerId);
  if (!capsule) return null;
  if (capsule.status === "unlocked") return capsule;
  if (capsule.status !== "sealed" || capsule.unlockType !== "milestone") return capsule;
  return markUnlocked(id, ownerId);
}

/**
 * Delete a capsule you own, for good — its letter, media rows, members,
 * invites, and any scheduled message all cascade away with it at the DB
 * level. Returns the storage paths of its attachments (still yours to clean
 * up from the bucket — this layer only owns the database), or null if there
 * was no such capsule of yours to delete.
 */
export async function deleteCapsule(id: string, ownerId: string): Promise<string[] | null> {
  const capsule = await db.capsule.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!capsule) return null;
  const attachments = await db.attachment.findMany({ where: { capsuleId: id }, select: { storagePath: true } });
  await db.capsule.deleteMany({ where: { id, ownerId } });
  return attachments.map((a) => a.storagePath);
}
