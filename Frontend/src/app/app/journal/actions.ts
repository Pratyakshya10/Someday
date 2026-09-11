"use server";
// Server Actions for the journal — autosave, mood, deletion, and the
// "seal this for future-you" bridge into a capsule draft.

import { revalidatePath } from "next/cache";
import {
  saveEntry,
  deleteEntry,
  getEntry,
  createDraft,
  saveDraft,
  removeObject,
} from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { stripVoiceTokens } from "../letter";

/** Autosave an entry's text and/or mood. Always editable — no lifecycle gate. */
export async function saveJournalEntryAction(
  id: string,
  edits: { body?: string; mood?: string | null },
): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const updated = await saveEntry(id, ownerId, edits);
  return { ok: updated !== null };
}

/** Delete an entry you own, and best-effort clean up its attachment bytes. */
export async function deleteJournalEntryAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const storagePaths = await deleteEntry(id, ownerId);
  if (storagePaths === null) return { ok: false };
  await Promise.all(storagePaths.map((p) => removeObject(p).catch(() => {})));
  revalidatePath("/app/journal");
  revalidatePath("/app/journal/browse");
  return { ok: true };
}

/** Turn a journal entry into a fresh capsule draft — words carried over
 *  (photos/voice are not, in v1; the writer can add them fresh in the
 *  capsule editor). Lands the caller in the ordinary capsule editor. */
export async function sealEntryAsCapsuleAction(entryId: string): Promise<{ ok: boolean; capsuleId?: string }> {
  const ownerId = await requireOwnerId();
  const entry = await getEntry(entryId, ownerId);
  if (!entry) return { ok: false };

  const capsule = await createDraft(ownerId, { type: "solo", template: "blank", recipient: "Future Me" });
  const dateLabel = entry.entryDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  await saveDraft(capsule.id, ownerId, {
    body: stripVoiceTokens(entry.body),
    title: `Journal — ${dateLabel}`,
  });

  revalidatePath("/app/vault");
  return { ok: true, capsuleId: capsule.id };
}
