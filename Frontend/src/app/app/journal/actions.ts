"use server";
// Server Actions for the journal — a plain diary, no seal/delivery lifecycle.
// Autosave and deletion only.

import { revalidatePath } from "next/cache";
import { saveEntry, deleteEntry, removeObject } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";

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
