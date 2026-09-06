// Contacts data layer — the people a user can schedule messages to.
// Every function is scoped to an ownerId, so you only ever touch your own.

import { db } from "./prisma";
import type { Contact } from "@prisma/client";

export type { Contact } from "@prisma/client";

/** Your contacts, newest first. */
export function listContacts(ownerId: string): Promise<Contact[]> {
  return db.contact.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

/** One contact you own, or null. */
export function getContact(id: string, ownerId: string): Promise<Contact | null> {
  return db.contact.findFirst({ where: { id, ownerId } });
}

/**
 * Add a contact (or update the name/phone if this email already exists for you,
 * since [ownerId, email] is unique). Returns the row.
 */
export function addContact(
  ownerId: string,
  input: { name: string; email: string; phone?: string | null },
): Promise<Contact> {
  const email = input.email.trim().toLowerCase();
  return db.contact.upsert({
    where: { ownerId_email: { ownerId, email } },
    update: { name: input.name.trim(), phone: input.phone?.trim() || null },
    create: { ownerId, name: input.name.trim(), email, phone: input.phone?.trim() || null },
  });
}

/** Remove a contact you own. */
export async function deleteContact(id: string, ownerId: string): Promise<boolean> {
  const result = await db.contact.deleteMany({ where: { id, ownerId } });
  return result.count > 0;
}
