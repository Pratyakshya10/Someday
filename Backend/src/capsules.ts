// Capsule data layer — every read and write of a capsule goes through here.
//
// Keeping the queries in one place (rather than scattered across the frontend)
// means the "shape" of a capsule and the rules around it — you can only touch
// your own, a sealed capsule can't be edited — live in exactly one file.
//
// Every function takes an `ownerId` and scopes its query to it. That is the
// whole authorization model: you can only ever see or change rows you own.

import { db } from "./prisma";
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

/** Every capsule you can see — ones you own, plus group capsules you're in. */
export function listUserCapsules(userId: string): Promise<Capsule[]> {
  return db.capsule.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    orderBy: { createdAt: "desc" },
  });
}

/** One capsule you own, or null if it doesn't exist / isn't yours. */
export function getCapsule(id: string, ownerId: string): Promise<Capsule | null> {
  return db.capsule.findFirst({ where: { id, ownerId } });
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
  const capsule = await db.capsule.findUnique({ where: { id } });
  if (!capsule) return null;
  if (capsule.status === "unlocked") return capsule;
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
