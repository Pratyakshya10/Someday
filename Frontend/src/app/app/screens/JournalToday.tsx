"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { JournalEntryView, OnThisDayView } from "../types";
import { GhostButton, ScreenFrame, Kicker } from "../components/ui";
import { MediaStudio, LetterGallery } from "../components/Attachments";
import { Recorder } from "../components/Recorder";
import { RichLetter, type RichLetterHandle } from "../components/RichLetter";
import { useNoteEditing } from "../components/note";
import { saveJournalEntryAction } from "../journal/actions";

type SaveState = "idle" | "saving" | "saved";

const MOODS = ["😊", "😌", "😔", "😤", "😴", "🥲", "🤔", "✨"];

/** A little basket with today's pages tucked inside — the streak, made
 *  physical. Each page is a day written; the basket never empties out. */
function JournalBucket({ streak }: { streak: number }) {
  const pages = Math.max(1, Math.min(streak, 7));
  const mid = (pages - 1) / 2;
  return (
    <div className="relative mx-auto h-[112px] w-[130px]">
      {Array.from({ length: pages }).map((_, i) => {
        const rot = (i - mid) * 8;
        const dx = (i - mid) * 11;
        const lift = 7 - Math.abs(i - mid) * 2;
        return (
          <div
            key={i}
            className="absolute bottom-[44px] left-1/2 h-[46px] w-[33px] rounded-[2px] border border-app-border/60 bg-[#f7f1e4] shadow-[0_5px_12px_rgba(43,38,33,0.2)]"
            style={{ transform: `translateX(calc(-50% + ${dx}px)) rotate(${rot}deg) translateY(${-lift}px)`, zIndex: i }}
          />
        );
      })}
      <svg viewBox="0 0 130 100" className="absolute bottom-0 left-1/2 h-[80px] w-[108px] -translate-x-1/2" style={{ zIndex: pages + 1 }}>
        <defs>
          <linearGradient id="bucketGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5c5044" />
            <stop offset="100%" stopColor="#2b2621" />
          </linearGradient>
        </defs>
        <path d="M16 24 L114 24 L100 90 a12 12 0 0 1 -11 9 L41 99 a12 12 0 0 1 -11 -9 Z" fill="url(#bucketGrad)" />
        <ellipse cx="65" cy="24" rx="49" ry="11" fill="#3a332c" />
        <ellipse cx="65" cy="22" rx="49" ry="11" fill="none" stroke="#6b5f52" strokeWidth="2" />
        <path d="M34 16 Q65 -6 96 16" fill="none" stroke="#4c463e" strokeWidth="5" strokeLinecap="round" />
        <path d="M20 40 h90 M18 55 h94 M23 70 h84" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

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
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [body, setBody] = useState(entry.body ?? "");
  const [mood, setMood] = useState<string | null>(entry.mood);
  const [save, setSave] = useState<SaveState>("idle");

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

  return (
    <ScreenFrame>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_300px]">
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs text-app-dim">
              <span className={`h-[7px] w-[7px] rounded-full ${save === "saving" ? "animate-[sdPulse_2s_infinite] bg-app-dim" : "bg-app-accent"}`} />
              {saveLabel}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-app-faint">Your diary</span>
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
          <div className="rounded-lg border border-app-border bg-app-surface p-6 text-center shadow-[0_18px_50px_rgba(43,38,33,0.08)] backdrop-blur-xl">
            <JournalBucket streak={streak} />
            <div className="mt-3 font-square-peg text-[16px] text-app-text">
              {streak > 0 ? (
                <>
                  {streak} day{streak === 1 ? "" : "s"}, quietly kept
                </>
              ) : (
                "Your first page starts today"
              )}
            </div>
          </div>
          <MediaStudio media={note.media} onRecord={note.setRecording} />
          <Link href="/app/journal/browse">
            <GhostButton className="w-full justify-center">Browse past entries</GhostButton>
          </Link>
        </div>
      </div>

      {note.recording && <Recorder mode={note.recording} onClose={() => note.setRecording(null)} onDone={note.onRecorderDone} />}
    </ScreenFrame>
  );
}
