"use server";
// Server Actions for the Scheduled feature. Each re-checks the signed-in user
// and scopes every change to them.

import { revalidatePath } from "next/cache";
import {
  addContact,
  deleteContact,
  createScheduledDraft,
  scheduleMessage,
  unscheduleMessage,
  deleteScheduled,
} from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Add (or update) a contact. */
export async function addContactAction(input: {
  name: string;
  email: string;
  phone?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const ownerId = await requireOwnerId();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, error: "Give the contact a name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };

  await addContact(ownerId, { name, email, phone: input.phone });
  revalidatePath("/app/scheduled");
  return { ok: true };
}

/** Remove a contact. */
export async function deleteContactAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const ok = await deleteContact(id, ownerId);
  if (ok) revalidatePath("/app/scheduled");
  return { ok };
}

/** Start a new letter to a contact; returns the new message id to open. */
export async function createScheduledDraftAction(
  contactId: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const ownerId = await requireOwnerId();
  const msg = await createScheduledDraft(ownerId, { contactId });
  if (!msg) return { ok: false, error: "That contact wasn't found." };
  revalidatePath("/app/scheduled");
  return { ok: true, id: msg.id };
}

/** Lock in the send date/time; moves the message to `scheduled`. */
export async function scheduleMessageAction(
  id: string,
  input: { sendAt: string; occasion?: string },
): Promise<{ ok: boolean; error?: string }> {
  const ownerId = await requireOwnerId();
  const when = new Date(input.sendAt);
  if (Number.isNaN(when.getTime())) return { ok: false, error: "Pick a valid date and time." };
  if (when.getTime() <= Date.now()) return { ok: false, error: "Choose a moment in the future." };

  const res = await scheduleMessage(id, ownerId, when, { occasion: input.occasion?.trim() || null });
  if (!res) return { ok: false, error: "This letter can't be scheduled." };
  revalidatePath("/app/scheduled");
  return { ok: true };
}

/** Pull a scheduled message back to a draft so it can be edited or rescheduled. */
export async function unscheduleMessageAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const res = await unscheduleMessage(id, ownerId);
  if (res) revalidatePath("/app/scheduled");
  return { ok: !!res };
}

/** Delete a scheduled message and its backing letter + media. */
export async function deleteScheduledAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const ok = await deleteScheduled(id, ownerId);
  if (ok) revalidatePath("/app/scheduled");
  return { ok };
}
