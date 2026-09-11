import { requireOwnerId } from "@/lib/auth";
import { getOrCreateEntry, listJournalAttachments, onThisDay, currentStreak } from "@someday/backend";
import { toJournalEntryView, toOnThisDayView } from "@/lib/serialize";
import { JournalToday } from "../screens/JournalToday";
import { JOURNAL_PROMPTS } from "../data";

// Always fetch fresh — "today" changes daily and autosave must land on the
// right entry.
export const dynamic = "force-dynamic";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function JournalPage() {
  const ownerId = await requireOwnerId();
  const isoToday = todayIso();

  const entry = await getOrCreateEntry(ownerId, isoToday);
  const [attachments, matches, streak] = await Promise.all([
    listJournalAttachments(entry.id, ownerId),
    onThisDay(ownerId, isoToday),
    currentStreak(ownerId, isoToday),
  ]);

  const matchAttachments = await Promise.all(matches.map((m) => listJournalAttachments(m.entry.id, ownerId)));
  const [entryView, onThisDayViews] = await Promise.all([
    toJournalEntryView(entry, attachments),
    Promise.all(matches.map((m, i) => toOnThisDayView(m, matchAttachments[i]))),
  ]);

  const today = new Date(`${isoToday}T00:00:00.000Z`);
  const startOfYear = Date.UTC(today.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear) / 86_400_000);
  const prompt = JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];

  return <JournalToday entry={entryView} onThisDay={onThisDayViews} streak={streak} prompt={prompt} />;
}
