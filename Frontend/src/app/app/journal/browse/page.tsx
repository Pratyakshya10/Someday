import { listAllEntries } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { toJournalEntryView } from "@/lib/serialize";
import { JournalBrowse } from "../../screens/JournalBrowse";

export const dynamic = "force-dynamic";

export default async function JournalBrowsePage() {
  const ownerId = await requireOwnerId();
  const entries = await listAllEntries(ownerId);

  // Excerpts don't need attachments — the browse list is text-only.
  const views = await Promise.all(entries.map((e) => toJournalEntryView(e, [])));

  return <JournalBrowse entries={views} />;
}
