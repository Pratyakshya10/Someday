// Group capsules — membership, invites, and per-member notes.
//
// Roles: owner (edits meta, manages people, seals), editor (writes their own
// note + media), viewer (reads it once opened). Authorization for every group
// operation runs through getMemberRole here.

import { randomUUID } from "node:crypto";
import { db } from "./prisma";
import type { CapsuleMember, CapsuleInvite, Contribution, MemberRole } from "@prisma/client";

export type { CapsuleMember, CapsuleInvite, Contribution, MemberRole } from "@prisma/client";

// ── Roles / access ──────────────────────────────────────────

/** A user's role on a capsule, or null if they're not a member. */
export async function getMemberRole(capsuleId: string, userId: string): Promise<MemberRole | null> {
  const m = await db.capsuleMember.findUnique({
    where: { capsuleId_userId: { capsuleId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

/** Can this user contribute (owner or editor) — used before edits. */
export function canEditRole(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

/** Every member of a capsule, owner first. */
export function listMembers(capsuleId: string): Promise<CapsuleMember[]> {
  return db.capsuleMember.findMany({
    where: { capsuleId },
    orderBy: { createdAt: "asc" },
  });
}

/** Add or update a membership (idempotent on capsule+user). */
export function upsertMember(capsuleId: string, userId: string, role: MemberRole): Promise<CapsuleMember> {
  return db.capsuleMember.upsert({
    where: { capsuleId_userId: { capsuleId, userId } },
    update: { role },
    create: { capsuleId, userId, role },
  });
}

/** Remove a member (and their note) from a capsule. Owners can't be removed. */
export async function removeMember(capsuleId: string, userId: string): Promise<void> {
  const m = await db.capsuleMember.findUnique({ where: { capsuleId_userId: { capsuleId, userId } } });
  if (!m || m.role === "owner") return;
  await db.$transaction([
    db.capsuleMember.delete({ where: { id: m.id } }),
    db.contribution.deleteMany({ where: { capsuleId, authorId: userId } }),
  ]);
}

/** Change a member's role (never the owner's). */
export async function setMemberRole(capsuleId: string, userId: string, role: MemberRole): Promise<void> {
  const m = await db.capsuleMember.findUnique({ where: { capsuleId_userId: { capsuleId, userId } } });
  if (!m || m.role === "owner") return;
  await db.capsuleMember.update({ where: { id: m.id }, data: { role } });
}

// ── Invites ─────────────────────────────────────────────────

/** Create (or reuse) the shareable link invite for a capsule at a given role. */
export async function createLinkInvite(capsuleId: string, role: MemberRole): Promise<CapsuleInvite> {
  const existing = await db.capsuleInvite.findFirst({ where: { capsuleId, email: null } });
  if (existing) {
    if (existing.role !== role) return db.capsuleInvite.update({ where: { id: existing.id }, data: { role } });
    return existing;
  }
  return db.capsuleInvite.create({ data: { capsuleId, token: randomUUID(), email: null, role } });
}

/** Invite a specific email at a given role (idempotent per capsule+email). */
export async function createEmailInvite(capsuleId: string, email: string, role: MemberRole): Promise<CapsuleInvite> {
  const norm = email.trim().toLowerCase();
  const existing = await db.capsuleInvite.findFirst({ where: { capsuleId, email: norm } });
  if (existing) return db.capsuleInvite.update({ where: { id: existing.id }, data: { role } });
  return db.capsuleInvite.create({ data: { capsuleId, token: randomUUID(), email: norm, role } });
}

export function listInvites(capsuleId: string): Promise<CapsuleInvite[]> {
  return db.capsuleInvite.findMany({ where: { capsuleId }, orderBy: { createdAt: "asc" } });
}

export function getInviteByToken(token: string): Promise<CapsuleInvite | null> {
  return db.capsuleInvite.findUnique({ where: { token } });
}

export async function revokeInvite(id: string, capsuleId: string): Promise<void> {
  await db.capsuleInvite.deleteMany({ where: { id, capsuleId } });
}

/**
 * Accept a link/token invite: add the user as a member at the invite's role
 * (never downgrading an existing higher role). Returns the capsule id joined.
 */
export async function acceptInvite(token: string, userId: string, userEmail: string | null): Promise<string | null> {
  const invite = await getInviteByToken(token);
  if (!invite) return null;
  // Email invites are only for the matching address.
  if (invite.email && invite.email !== (userEmail ?? "").toLowerCase()) return null;

  const current = await getMemberRole(invite.capsuleId, userId);
  if (!current) {
    await upsertMember(invite.capsuleId, userId, invite.role);
    if (canEditRole(invite.role)) await getOrCreateContribution(invite.capsuleId, userId);
  }
  if (invite.email) await db.capsuleInvite.update({ where: { id: invite.id }, data: { acceptedBy: userId } });
  return invite.capsuleId;
}

/**
 * When a user signs in, claim any pending email invites for their address.
 * Called on capsule access so shared capsules appear without a manual step.
 */
export async function resolveEmailInvites(userId: string, userEmail: string): Promise<void> {
  const email = userEmail.trim().toLowerCase();
  const pending = await db.capsuleInvite.findMany({ where: { email, acceptedBy: null } });
  for (const invite of pending) {
    const current = await getMemberRole(invite.capsuleId, userId);
    if (!current) {
      await upsertMember(invite.capsuleId, userId, invite.role);
      if (canEditRole(invite.role)) await getOrCreateContribution(invite.capsuleId, userId);
    }
    await db.capsuleInvite.update({ where: { id: invite.id }, data: { acceptedBy: userId } });
  }
}

// ── Contributions (per-member notes) ────────────────────────

export async function getOrCreateContribution(capsuleId: string, authorId: string): Promise<Contribution> {
  const existing = await db.contribution.findUnique({
    where: { capsuleId_authorId: { capsuleId, authorId } },
  });
  if (existing) return existing;
  return db.contribution.create({ data: { capsuleId, authorId, body: "" } });
}

export function listContributions(capsuleId: string): Promise<Contribution[]> {
  return db.contribution.findMany({ where: { capsuleId }, orderBy: { createdAt: "asc" } });
}

/** Save a member's note — only while the capsule is a draft and they may edit. */
export async function saveContribution(capsuleId: string, authorId: string, body: string): Promise<boolean> {
  const capsule = await db.capsule.findUnique({ where: { id: capsuleId }, select: { status: true } });
  if (!capsule || capsule.status !== "draft") return false;
  const role = await getMemberRole(capsuleId, authorId);
  if (!canEditRole(role)) return false;
  await db.contribution.upsert({
    where: { capsuleId_authorId: { capsuleId, authorId } },
    update: { body },
    create: { capsuleId, authorId, body },
  });
  return true;
}
