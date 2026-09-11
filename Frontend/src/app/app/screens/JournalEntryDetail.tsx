"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JournalEntryView } from "../types";
import { Kicker, GhostButton, ScreenFrame } from "../components/ui";
import { MediaGallery } from "../components/Attachments";
import { renderLetterBody } from "../components/LetterBody";
import { deleteJournalEntryAction } from "../journal/actions";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function JournalEntryDetail({ entry }: { entry: JournalEntryView }) {
  const router = useRouter();
  const [deleting, startDeleting] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remove = () =>
    startDeleting(async () => {
      const r = await deleteJournalEntryAction(entry.id);
      if (r.ok) router.push("/app/journal/browse");
    });

  const { nodes, gallery } = renderLetterBody(entry.body ?? "", entry.attachments);
  const hasAnything = nodes.some(Boolean) || gallery.length > 0;

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.9s_both]">
        <Kicker>Journal{entry.mood ? ` · ${entry.mood}` : ""}</Kicker>
        <div className="rounded-[10px] border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
          <div className="mb-5 font-serif text-[clamp(20px,2.4vw,30px)] italic text-app-text">{fmt(entry.entryDate)}</div>
          {hasAnything ? (
            <div className="flex flex-col gap-3">{nodes}</div>
          ) : (
            <p className="font-serif text-lg italic leading-[1.65] text-app-dim">(A quiet day, no words.)</p>
          )}
          <MediaGallery items={gallery} />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link href="/app/journal/browse">
            <GhostButton>Back to entries</GhostButton>
          </Link>
          {confirmingDelete ? (
            <span className="inline-flex items-center gap-2 text-sm text-app-dim">
              Delete this entry for good?
              <button onClick={remove} disabled={deleting} className="text-app-accent underline underline-offset-2">
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-app-dim underline underline-offset-2">
                Cancel
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} className="text-sm text-app-faint underline underline-offset-2 hover:text-app-dim">
              Delete entry
            </button>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}
