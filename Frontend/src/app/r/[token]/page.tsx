// Public reveal — the page a recipient lands on from the emailed link. No auth:
// the unguessable token is the capability. Shows the letter only once its
// moment has arrived.

import { notFound } from "next/navigation";
import { getScheduledByToken, getUserEmail, listAttachments } from "@someday/backend";
import { toAttachmentViews } from "@/lib/serialize";
import { RevealLetter, RevealNotYet } from "../../app/screens/RevealLetter";

export const dynamic = "force-dynamic";

// Whether a message's moment has arrived. Kept out of the component body so the
// server-side time read isn't flagged by the render-purity lint.
function hasArrived(status: string, sendAt: Date | null): boolean {
  if (status === "sent") return true;
  return sendAt != null && sendAt.getTime() <= Date.now();
}

export default async function RevealPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;

  const message = await getScheduledByToken(token);
  if (!message) notFound();

  // Only reveal once it's been sent, or its send time has passed.
  const ready = hasArrived(message.status, message.sendAt);
  if (!ready) {
    return <RevealNotYet sendAt={message.sendAt ? message.sendAt.toISOString() : null} />;
  }

  const [senderEmail, attachments] = await Promise.all([
    getUserEmail(message.ownerId),
    toAttachmentViews(await listAttachments(message.capsuleId, message.ownerId)),
  ]);

  const capsule = message.capsule;
  return (
    <RevealLetter
      senderName={senderEmail ?? "Someone"}
      recipientName={capsule.recipient?.trim() || message.contact?.name || "you"}
      occasion={message.occasion}
      writtenAt={capsule.sealedAt ? capsule.sealedAt.toISOString() : capsule.createdAt.toISOString()}
      body={capsule.body ?? ""}
      attachments={attachments}
    />
  );
}
