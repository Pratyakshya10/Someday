import { notFound } from "next/navigation";
import { getEntry, listJournalAttachments } from "@someday/backend";
import { requireOwnerId } from "@/lib/auth";
import { toJournalEntryView } from "@/lib/serialize";
import { JournalEntryDetail } from "../../screens/JournalEntryDetail";

export default async function JournalEntryPage({ params }: PageProps<"/app/journal/[id]">) {
  const { id } = await params;
  const ownerId = await requireOwnerId();

  const entry = await getEntry(id, ownerId);
  if (!entry) notFound();

  const attachments = await listJournalAttachments(entry.id, ownerId);
  const entryView = await toJournalEntryView(entry, attachments);

  return <JournalEntryDetail entry={entryView} />;
}
