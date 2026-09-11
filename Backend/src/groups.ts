// Group capsules — membership, invites, and per-member notes.
//
// Roles: owner (edits meta, manages people, seals), editor (writes their own
// note + media), viewer (reads it once opened). Authorization for every group
// operation runs through getMemberRole here.

import { randomUUID } from "node:crypto";
import { db } from "./prisma";
import { sendEmail, type EmailResult } from "./email";
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

export function getInviteById(id: string, capsuleId: string): Promise<CapsuleInvite | null> {
  return db.capsuleInvite.findFirst({ where: { id, capsuleId } });
}

export async function revokeInvite(id: string, capsuleId: string): Promise<void> {
  await db.capsuleInvite.deleteMany({ where: { id, capsuleId } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** The email a directly-added member receives, with a link to join. */
function renderInviteEmail(input: {
  inviterName: string;
  capsuleTitle: string;
  role: MemberRole;
  url: string;
}): { subject: string; html: string; text: string } {
  const { inviterName, capsuleTitle, role, url } = input;
  const title = capsuleTitle || "a capsule";
  const access = role === "viewer" ? "view" : "add to";
  const subject = `${inviterName} added you to "${title}" on Someday`;

  const text =
    `Hi,\n\n${inviterName} added you to the group capsule "${title}" on Someday. ` +
    `You can ${access} it once you join.\n\nJoin here: ${url}\n\n— Someday`;

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
          <tr><td style="font-size:24px;line-height:1.3;padding-bottom:16px;">You&rsquo;ve been added to a capsule</td></tr>
          <tr><td style="font-size:16px;line-height:1.6;color:#5b5348;padding-bottom:28px;">
            ${escapeHtml(inviterName)} added you to the group capsule &ldquo;${escapeHtml(title)}&rdquo; on Someday. You can ${access} it once you join.
          </td></tr>
          <tr><td>
            <a href="${url}" style="display:inline-block;background:#2b2621;color:#f8f2e8;text-decoration:none;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Join the capsule</a>
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

  return { subject, html, text };
}

/** Email the invite link to a directly-added member (owner action, on invite + resend). */
export async function sendInviteEmail(input: {
  to: string;
  inviterName: string;
  capsuleTitle: string;
  role: MemberRole;
  url: string;
}): Promise<EmailResult> {
  const { subject, html, text } = renderInviteEmail(input);
  return sendEmail({ to: input.to, subject, html, text });
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

export interface PendingInvite {
  id: string;
  token: string;
  role: MemberRole;
  capsuleId: string;
  capsuleTitle: string | null;
}

/**
 * Pending (unaccepted) email invites for an address, across every capsule —
 * surfaced as a "you've been invited" notification. Joining still requires
 * the explicit accept step in `acceptInvite`.
 */
export async function listPendingInvitesForEmail(email: string): Promise<PendingInvite[]> {
  const norm = email.trim().toLowerCase();
  const invites = await db.capsuleInvite.findMany({
    where: { email: norm, acceptedBy: null },
    include: { capsule: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });
  return invites.map((i) => ({
    id: i.id,
    token: i.token,
    role: i.role,
    capsuleId: i.capsuleId,
    capsuleTitle: i.capsule.title,
  }));
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
