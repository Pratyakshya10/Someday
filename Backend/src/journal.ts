// Journal data layer — daily entries + their media, "on this day", streaks.
//
// Same authorization model as every other data-layer file here: every
// function takes an ownerId and scopes its query to it. Unlike a Capsule, a
// journal entry has no lifecycle (no draft/sealed/unlocked) — it's always
// editable, so writes here are simpler than the capsule equivalents.

import { db } from "./prisma";
import type { JournalEntry, JournalAttachment, AttachmentKind } from "@prisma/client";

export type { JournalEntry, JournalAttachment } from "@prisma/client";

export interface JournalEdits {
  body?: string;
  mood?: string | null;
}

export interface NewJournalAttachment {
  kind: AttachmentKind;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number | null;
}

/** Local-midnight Date from a "YYYY-MM-DD" string — the client sends its own
 *  local day, same convention as a capsule's delivery date. */
function dayOf(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** Today's (or any given day's) entry for this owner — created empty on
 *  first visit if it doesn't exist yet. Never returns null; this is the
 *  primary entry point for the journal home screen. */
export async function getOrCreateEntry(ownerId: string, isoDate: string): Promise<JournalEntry> {
  const entryDate = dayOf(isoDate);
  return db.journalEntry.upsert({
    where: { ownerId_entryDate: { ownerId, entryDate } },
    update: {},
    create: { ownerId, entryDate, body: "" },
  });
}

/** One entry you own, by id, or null. */
export function getEntry(id: string, ownerId: string): Promise<JournalEntry | null> {
  return db.journalEntry.findFirst({ where: { id, ownerId } });
}

/** Every entry you own, newest first — powers the browse list. */
export function listAllEntries(ownerId: string): Promise<JournalEntry[]> {
  return db.journalEntry.findMany({ where: { ownerId }, orderBy: { entryDate: "desc" } });
}

/** Save edits to an entry you own. Always editable — no seal/lock gate,
 *  unlike a capsule draft. Returns the updated row, or null if not yours. */
export async function saveEntry(id: string, ownerId: string, edits: JournalEdits): Promise<JournalEntry | null> {
  const result = await db.journalEntry.updateMany({ where: { id, ownerId }, data: edits });
  if (result.count === 0) return null;
  return getEntry(id, ownerId);
}

/** Delete an entry you own, returning its attachments' storage paths for
 *  best-effort bucket cleanup (mirrors deleteCapsule). Null if not yours. */
export async function deleteEntry(id: string, ownerId: string): Promise<string[] | null> {
  const entry = await db.journalEntry.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!entry) return null;
  const attachments = await db.journalAttachment.findMany({ where: { entryId: id }, select: { storagePath: true } });
  await db.journalEntry.deleteMany({ where: { id, ownerId } });
  return attachments.map((a) => a.storagePath);
}

// ── Attachments ──────────────────────────────────────────

/** Record a freshly uploaded attachment on an entry you own. No lifecycle
 *  gate to check — just ownership. */
export async function addJournalAttachment(
  ownerId: string,
  entryId: string,
  input: NewJournalAttachment,
): Promise<JournalAttachment | null> {
  const entry = await db.journalEntry.findFirst({ where: { id: entryId, ownerId }, select: { id: true } });
  if (!entry) return null;
  return db.journalAttachment.create({
    data: {
      entryId,
      ownerId,
      kind: input.kind,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationSec: input.durationSec ?? null,
    },
  });
}

export function listJournalAttachments(entryId: string, ownerId: string): Promise<JournalAttachment[]> {
  return db.journalAttachment.findMany({ where: { entryId, ownerId }, orderBy: { createdAt: "asc" } });
}

/** Set (or clear) an attachment's caption. Only yours. */
export async function setJournalAttachmentCaption(
  id: string,
  ownerId: string,
  caption: string | null,
): Promise<JournalAttachment | null> {
  const result = await db.journalAttachment.updateMany({ where: { id, ownerId }, data: { caption } });
  if (result.count === 0) return null;
  return db.journalAttachment.findUnique({ where: { id } });
}

/** Delete an attachment you own, returning its storage path so the caller
 *  can remove the bytes too. Null if not found. */
export async function deleteJournalAttachment(id: string, ownerId: string): Promise<string | null> {
  const found = await db.journalAttachment.findFirst({ where: { id, ownerId } });
  if (!found) return null;
  await db.journalAttachment.delete({ where: { id: found.id } });
  return found.storagePath;
}

// ── "On this day" ──────────────────────────────────────────

export interface OnThisDayEntry {
  entry: JournalEntry;
  yearsAgo: number;
}

/** Past entries whose calendar day matches today's month/day, in any earlier
 *  year — the "the past reaching into today" resurfacing feature. Raw SQL
 *  because Prisma has no date-part filter; every value is parameterized. */
export async function onThisDay(ownerId: string, isoToday: string): Promise<OnThisDayEntry[]> {
  const today = dayOf(isoToday);
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  const currentYear = today.getUTCFullYear();
  // $queryRaw returns raw column names (snake_case), not the camelCase
  // Prisma field names JournalEntry's type implies — alias them explicitly
  // so the rest of this file can treat rows as real JournalEntry objects.
  const rows = await db.$queryRaw<JournalEntry[]>`
    SELECT
      id, owner_id AS "ownerId", entry_date AS "entryDate", body, mood,
      created_at AS "createdAt", updated_at AS "updatedAt"
    FROM journal_entries
    WHERE owner_id = ${ownerId}::uuid
      AND EXTRACT(MONTH FROM entry_date) = ${month}
      AND EXTRACT(DAY FROM entry_date) = ${day}
      AND entry_date < ${today}
    ORDER BY entry_date DESC
  `;
  return rows.map((entry) => ({ entry, yearsAgo: currentYear - new Date(entry.entryDate).getUTCFullYear() }));
}

// ── Streak ──────────────────────────────────────────

/** Current consecutive-day writing streak, ending today or yesterday — so
 *  writing late in the day doesn't show a "broken" streak before there's
 *  been a chance to write today's entry. Empty (auto-created, unwritten)
 *  entries don't count. */
export async function currentStreak(ownerId: string, isoToday: string): Promise<number> {
  const rows = await db.journalEntry.findMany({
    where: { ownerId, body: { not: "" } },
    select: { entryDate: true },
    orderBy: { entryDate: "desc" },
    take: 400,
  });
  if (rows.length === 0) return 0;
  const oneDay = 86_400_000;
  let cursor = dayOf(isoToday).getTime();
  const hasToday = rows[0].entryDate.getTime() === cursor;
  if (!hasToday) cursor -= oneDay; // allow "yesterday" as the streak's anchor
  let streak = 0;
  for (const { entryDate } of rows) {
    const t = entryDate.getTime();
    if (t === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (t < cursor) {
      break;
    }
  }
  return streak;
}
