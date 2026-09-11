"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JournalEntryView, OnThisDayView } from "../types";
import { PrimaryButton, GhostButton, ScreenFrame, Kicker } from "../components/ui";
import { MediaStudio, LetterGallery } from "../components/Attachments";
import { Recorder } from "../components/Recorder";
import { RichLetter, type RichLetterHandle } from "../components/RichLetter";
import { useNoteEditing } from "../components/note";
import { saveJournalEntryAction, sealEntryAsCapsuleAction } from "../journal/actions";

type SaveState = "idle" | "saving" | "saved";

const MOODS = ["😊", "😌", "😔", "😤", "😴", "🥲", "🤔", "✨"];

export function JournalToday({
  entry,
  onThisDay,
  streak,
  prompt,
}: {
  entry: JournalEntryView;
  onThisDay: OnThisDayView[];
  streak: number;
  prompt: string;
}) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [body, setBody] = useState(entry.body ?? "");
  const [mood, setMood] = useState<string | null>(entry.mood);
  const [save, setSave] = useState<SaveState>("idle");
  const [sealing, startSealing] = useTransition();

  const letterRef = useRef<RichLetterHandle | null>(null);
  const note = useNoteEditing(entry.id, entry.attachments, letterRef, "journal");

  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await saveJournalEntryAction(entry.id, { body, mood });
      setSave("saved");
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [body, mood, entry.id]);

  const saveLabel = save === "saving" ? "Saving…" : save === "saved" ? "Autosaved" : "Today";

  const sealForFuture = () =>
    startSealing(async () => {
      await saveJournalEntryAction(entry.id, { body, mood });
      const r = await sealEntryAsCapsuleAction(entry.id);
      if (r.ok && r.capsuleId) router.push(`/app/capsule/${r.capsuleId}/editor`);
    });

  return (
    <ScreenFrame>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_300px]">
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs text-app-dim">
              <span className={`h-[7px] w-[7px] rounded-full ${save === "saving" ? "animate-[sdPulse_2s_infinite] bg-app-dim" : "bg-app-accent"}`} />
              {saveLabel}
            </span>
            {streak > 0 && (
              <span className="font-square-peg text-[15px] text-app-dim">
                {streak} day{streak === 1 ? "" : "s"}, quietly kept
              </span>
            )}
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
            <div className="mb-1.5 font-serif text-[clamp(18px,2.4vw,28px)] italic text-app-text">{today}</div>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? null : m)}
                  className={`rounded-full px-2 py-1 text-lg transition-transform duration-150 hover:scale-110 ${mood === m ? "bg-app-accent/20 ring-1 ring-app-accent" : ""}`}
                  aria-label={`Mood: ${m}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <RichLetter
              ref={letterRef}
              initialBody={entry.body ?? ""}
              attachments={note.media.items}
              placeholder={prompt}
              onChange={setBody}
              onRequestVoice={() => note.setRecording("voice")}
              onAttachFiles={note.onAttachFiles}
              onRemoveAttachment={(id) => void note.media.remove(id)}
            />
            <LetterGallery media={note.media} onRemove={note.removeAttachment} />
          </div>

          {onThisDay.length > 0 && (
            <div className="mt-8">
              <Kicker>On this day</Kicker>
              <div className="flex flex-col gap-3">
                {onThisDay.map((m) => (
                  <Link
                    key={m.entry.id}
                    href={`/app/journal/${m.entry.id}`}
                    className="block rounded-lg border border-app-border bg-app-surface p-4 transition-colors hover:bg-app-accent/5"
                  >
                    <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-app-faint">
                      {m.yearsAgo} year{m.yearsAgo === 1 ? "" : "s"} ago
                    </div>
                    <p className="line-clamp-2 font-serif text-[15px] italic text-app-dim">
                      {m.entry.body.trim() || "(A quiet day, no words.)"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex animate-[sdRise_0.9s_0.1s_both] flex-col gap-[22px] lg:sticky lg:top-[30px]">
          <MediaStudio media={note.media} onRecord={note.setRecording} />
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={sealForFuture} className={`w-full justify-center ${sealing ? "pointer-events-none opacity-70" : ""}`}>
              {sealing ? "Sealing…" : "Seal this for future-you"}
            </PrimaryButton>
            <p className="px-1 text-center text-xs text-app-faint">Carries the words over — add any photos or voice again there.</p>
            <Link href="/app/journal/browse">
              <GhostButton className="w-full justify-center">Browse past entries</GhostButton>
            </Link>
          </div>
        </div>
      </div>

      {note.recording && <Recorder mode={note.recording} onClose={() => note.setRecording(null)} onDone={note.onRecorderDone} />}
    </ScreenFrame>
  );
}
