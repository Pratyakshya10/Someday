import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import {
  getAccessibleCapsule,
  getMemberRole,
  openIfDue,
  notifyUnlock,
  markCapsuleViewed,
  listAttachments,
  listCapsuleAttachments,
  listContributions,
  getUserEmails,
} from "@someday/backend";
import { requireUser } from "@/lib/auth";
import { appOrigin } from "@/lib/origin";
import { toCapsuleView, toAttachmentViews, toContributionViews } from "@/lib/serialize";
import type { AttachmentView, ContributionView } from "../../types";
import { CapsuleDetail, type DetailMode } from "../../screens/CapsuleDetail";

export const dynamic = "force-dynamic";

export default async function CapsulePage({ params }: PageProps<"/app/capsule/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const access = await getAccessibleCapsule(id, user.id);
  if (!access) notFound();
  let { capsule } = access;
  const { isOwner } = access;

  const role = capsule.type === "group" ? await getMemberRole(id, user.id) : isOwner ? "owner" : null;
  const canEdit = isOwner || role === "editor";

  // A draft goes back to its editor (for people who can edit); viewers wait.
  if (capsule.status === "draft") {
    if (canEdit) redirect(`/app/capsule/${id}/editor`);
    redirect("/app/vault");
  }

  // A sealed DATE capsule opens itself once due (any member can trigger it).
  if (capsule.status === "sealed" && capsule.unlockType === "date") {
    const opened = await openIfDue(id);
    if (opened) {
      capsule = opened;
      if (opened.status === "unlocked") {
        const baseUrl = await appOrigin();
        after(() => notifyUnlock(opened, baseUrl));
      }
    }
  }

  let mode: DetailMode;
  if (capsule.status === "unlocked") mode = "reveal";
  else if (capsule.unlockType === "location") mode = isOwner ? "location" : "locked";
  else if (capsule.unlockType === "milestone") mode = isOwner ? "milestone" : "locked";
  else mode = "waiting";

  let attachments: AttachmentView[] = [];
  let contributions: ContributionView[] = [];
  if (mode === "reveal") {
    after(() => markCapsuleViewed(id, user.id, capsule.type === "group"));
    if (capsule.type === "group") {
      const contribs = await listContributions(id);
      const allAttachments = await listCapsuleAttachments(id);
      const emails = await getUserEmails(contribs.map((c) => c.authorId));
      contributions = await toContributionViews(contribs, allAttachments, emails, user.id);
    } else {
      attachments = await toAttachmentViews(await listAttachments(id, user.id));
    }
  }

  return (
    <CapsuleDetail
      capsule={toCapsuleView(capsule)}
      mode={mode}
      isGroup={capsule.type === "group"}
      attachments={attachments}
      contributions={contributions}
    />
  );
}
