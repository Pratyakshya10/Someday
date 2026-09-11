"use client";
import Link from "next/link";
import type { JournalEntryView } from "../types";
import { Kicker, ScreenFrame } from "../components/ui";
import { stripVoiceTokens } from "../letter";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function excerpt(body: string): string {
  const clean = stripVoiceTokens(body);
  return clean.length > 140 ? `${clean.slice(0, 140).trim()}…` : clean;
}

export function JournalBrowse({ entries }: { entries: JournalEntryView[] }) {
  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.8s_both]">
        <Kicker>Your journal</Kicker>
        <h1 className="mb-7 font-serif text-[clamp(22px,3vw,34px)] font-medium">Every day you kept.</h1>

        {entries.length === 0 ? (
          <p className="font-serif text-lg italic text-app-dim">Nothing written yet — your first entry starts today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((e) => {
              const text = excerpt(e.body);
              return (
                <Link
                  key={e.id}
                  href={`/app/journal/${e.id}`}
                  className="block rounded-lg border border-app-border bg-app-surface p-4 transition-colors hover:bg-app-accent/5"
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-app-faint">
                    {fmt(e.entryDate)}
                    {e.mood && <span className="text-sm normal-case tracking-normal">{e.mood}</span>}
                  </div>
                  <p className="font-serif text-[15px] italic text-app-dim">{text || "(A quiet day, no words.)"}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
