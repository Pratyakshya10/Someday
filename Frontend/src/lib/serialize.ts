// Turn a database Capsule (with real Date objects) into a plain, JSON-safe
// CapsuleView that a Server Component can hand to a Client Component.

import { signedUrl, type Capsule, type Attachment, type CapsuleMember, type Contribution } from "@someday/backend";
import type { CapsuleView, AttachmentView, MemberView, ContributionView } from "@/app/app/types";

export function toCapsuleView(c: Capsule): CapsuleView {
  return {
    id: c.id,
    type: c.type,
    status: c.status,
    unlockType: c.unlockType,
    unlockDate: c.unlockDate ? c.unlockDate.toISOString() : null,
    unlockLat: c.unlockLat,
    unlockLng: c.unlockLng,
    unlockRadiusM: c.unlockRadiusM,
    unlockPlaceLabel: c.unlockPlaceLabel,
    unlockMilestone: c.unlockMilestone,
    template: c.template,
    recipient: c.recipient,
    title: c.title,
    body: c.body,
    sealedAt: c.sealedAt ? c.sealedAt.toISOString() : null,
    unlockedAt: c.unlockedAt ? c.unlockedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Turn an Attachment row into a client view, minting a signed read URL. */
export async function toAttachmentView(a: Attachment): Promise<AttachmentView> {
  return {
    id: a.id,
    kind: a.kind,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    durationSec: a.durationSec,
    url: await signedUrl(a.storagePath),
  };
}

/** Sign a whole list of attachments in parallel. */
export function toAttachmentViews(rows: Attachment[]): Promise<AttachmentView[]> {
  return Promise.all(rows.map(toAttachmentView));
}

/** Group a capsule's attachments by uploader, then sign each list. */
async function signByAuthor(attachments: Attachment[]): Promise<Map<string, AttachmentView[]>> {
  const byAuthor = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const list = byAuthor.get(a.ownerId) ?? [];
    list.push(a);
    byAuthor.set(a.ownerId, list);
  }
  const out = new Map<string, AttachmentView[]>();
  for (const [author, rows] of byAuthor) out.set(author, await toAttachmentViews(rows));
  return out;
}

export function toMemberView(m: CapsuleMember, emails: Map<string, string>, meId: string): MemberView {
  return {
    userId: m.userId,
    email: emails.get(m.userId) ?? null,
    role: m.role,
    isYou: m.userId === meId,
  };
}

/** Build the per-member note views for a group reveal (signs each one's media). */
export async function toContributionViews(
  contributions: Contribution[],
  attachments: Attachment[],
  emails: Map<string, string>,
  meId: string,
): Promise<ContributionView[]> {
  const media = await signByAuthor(attachments);
  return contributions.map((c) => ({
    authorId: c.authorId,
    authorEmail: emails.get(c.authorId) ?? null,
    body: c.body,
    attachments: media.get(c.authorId) ?? [],
    isYou: c.authorId === meId,
  }));
}

/** Whole-number days from now until `iso` (negative if already past). */
export function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
