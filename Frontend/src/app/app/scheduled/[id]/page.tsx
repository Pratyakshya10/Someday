import { notFound } from "next/navigation";
import { getScheduled, listAttachments } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { toScheduledView, toAttachmentViews } from "@/lib/serialize";
import { ScheduledCompose } from "../../screens/ScheduledCompose";

export const dynamic = "force-dynamic";

export default async function ScheduledComposePage({ params }: PageProps<"/app/scheduled/[id]">) {
  const { id } = await params;
  const ownerId = await requireOwnerId();

  const message = await getScheduled(id, ownerId);
  if (!message) notFound();

  const attachments = await toAttachmentViews(await listAttachments(message.capsuleId, ownerId));

  return (
    <ScheduledCompose
      message={toScheduledView(message)}
      attachments={attachments}
    />
  );
}
