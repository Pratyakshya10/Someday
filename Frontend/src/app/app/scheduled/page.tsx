import { requireOwnerId } from "@/lib/auth";
import { listContacts, listScheduled } from "@someday/backend";
import { toContactView, toScheduledView } from "@/lib/serialize";
import { Scheduled } from "../screens/Scheduled";

export const dynamic = "force-dynamic";

export default async function ScheduledPage() {
  const ownerId = await requireOwnerId();
  const [contacts, messages] = await Promise.all([
    listContacts(ownerId),
    listScheduled(ownerId),
  ]);
  return (
    <Scheduled
      contacts={contacts.map(toContactView)}
      messages={messages.map(toScheduledView)}
    />
  );
}
