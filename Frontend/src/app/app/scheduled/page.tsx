import { requireOwnerId } from "@/lib/auth";
import { listContacts } from "@someday/backend";
import { toContactView } from "@/lib/serialize";
import { Scheduled } from "../screens/Scheduled";

export const dynamic = "force-dynamic";

export default async function ScheduledPage() {
  const ownerId = await requireOwnerId();
  const contacts = await listContacts(ownerId);
  return <Scheduled contacts={contacts.map(toContactView)} />;
}
