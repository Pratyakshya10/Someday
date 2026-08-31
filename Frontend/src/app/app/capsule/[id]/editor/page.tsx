import { notFound, redirect } from "next/navigation";
import {
  getAccessibleCapsule,
  listAttachments,
  getMemberRole,
  getOrCreateContribution,
  listMembers,
  listInvites,
  resolveEmailInvites,
  getUserEmails,
} from "@someday/backend";
import { requireUser } from "@/lib/auth";
import { toCapsuleView, toAttachmentViews, toMemberView } from "@/lib/serialize";
import type { InviteView } from "../../../types";
import { LetterEditor } from "../../../screens/LetterEditor";
import { GroupEditor } from "../../../screens/GroupEditor";

export default async function EditorPage({ params }: PageProps<"/app/capsule/[id]/editor">) {
  const { id } = await params;
  const user = await requireUser();
  if (user.email) await resolveEmailInvites(user.id, user.email);

  const access = await getAccessibleCapsule(id, user.id);
  if (!access) notFound();
  const { capsule, isOwner } = access;
  if (capsule.status !== "draft") redirect(`/app/capsule/${id}`);

  // Solo capsule: only the owner reaches it.
  if (capsule.type === "solo") {
    if (!isOwner) notFound();
    const attachments = await toAttachmentViews(await listAttachments(id, user.id));
    return <LetterEditor capsule={toCapsuleView(capsule)} attachments={attachments} />;
  }

  // Group capsule: viewers can't edit — send them to view it.
  const role = await getMemberRole(id, user.id);
  if (role === "viewer") redirect(`/app/capsule/${id}`);

  const contribution = await getOrCreateContribution(id, user.id);
  const myAttachments = await toAttachmentViews(await listAttachments(id, user.id));

  let members = null;
  let invites: InviteView[] = [];
  if (isOwner) {
    const rows = await listMembers(id);
    const emails = await getUserEmails(rows.map((m) => m.userId));
    members = rows.map((m) => toMemberView(m, emails, user.id));
    invites = (await listInvites(id)).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      accepted: i.acceptedBy != null,
    }));
  }

  return (
    <GroupEditor
      capsule={toCapsuleView(capsule)}
      isOwner={isOwner}
      myBody={contribution.body}
      myAttachments={myAttachments}
      members={members ?? []}
      invites={invites}
    />
  );
}
