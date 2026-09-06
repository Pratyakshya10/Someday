"use server";
// Server Actions for the Scheduled feature. Each re-checks the signed-in user
// and scopes every change to them.

import { revalidatePath } from "next/cache";
import { addContact, deleteContact } from "@someday/backend";
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
