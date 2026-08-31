"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveDraftAction, saveContributionAction } from "../actions";
import type { CapsuleView, AttachmentView, MemberView, InviteView } from "../types";
import { PrimaryButton, ScreenFrame } from "../components/ui";
import { MediaStudio } from "../components/Attachments";
import { Recorder } from "../components/Recorder";
import { RichLetter, type RichLetterHandle } from "../components/RichLetter";
import { useNoteEditing } from "../components/note";
import { SharePanel } from "../components/SharePanel";

export function GroupEditor({
  capsule,
  isOwner,
  myBody,
  myAttachments,
  members,
  invites,
}: {
  capsule: CapsuleView;
  isOwner: boolean;
  myBody: string;
  myAttachments: AttachmentView[];
  members: MemberView[];
  invites: InviteView[];
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const [title, setTitle] = useState(capsule.title ?? "");
  const [recipient, setRecipient] = useState(capsule.recipient ?? "");
  const [body, setBody] = useState(myBody);
  const [saved, setSaved] = useState(true);

  const letterRef = useRef<RichLetterHandle | null>(null);
  const note = useNoteEditing(capsule.id, myAttachments, letterRef);

  // Autosave the capsule meta (owner only).
  const metaFirst = useRef(true);
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isOwner) return;
    if (metaFirst.current) {
      metaFirst.current = false;
      return;
    }
    if (metaTimer.current) clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => void saveDraftAction(capsule.id, { title, recipient }), 700);
    return () => {
      if (metaTimer.current) clearTimeout(metaTimer.current);
    };
  }, [title, recipient, isOwner, capsule.id]);

  // Autosave this member's note.
  const bodyFirst = useRef(true);
  const bodyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (bodyFirst.current) {
      bodyFirst.current = false;
      return;
    }
    setSaved(false);
    if (bodyTimer.current) clearTimeout(bodyTimer.current);
    bodyTimer.current = setTimeout(async () => {
      await saveContributionAction(capsule.id, body);
      setSaved(true);
    }, 700);
    return () => {
      if (bodyTimer.current) clearTimeout(bodyTimer.current);
    };
  }, [body, capsule.id]);

  return (
    <ScreenFrame>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_320px]">
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs text-app-dim">
              <span className={`h-[7px] w-[7px] rounded-full ${saved ? "bg-app-accent" : "animate-[sdPulse_2s_infinite] bg-app-dim"}`} />
              {saved ? "Your note is saved" : "Saving…"}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-app-faint">Group draft</span>
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
            {isOwner ? (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled group capsule"
                  className="mb-3 w-full border-none bg-transparent font-serif text-[clamp(20px,2.4vw,30px)] font-medium text-app-text outline-none placeholder:text-app-faint"
                />
                <div className="mb-1.5 flex items-baseline gap-2 font-serif text-[clamp(18px,2.4vw,28px)] italic">
                  <span className="text-app-dim">To —</span>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="All of us"
                    className="min-w-0 flex-1 border-none bg-transparent italic text-app-text outline-none placeholder:text-app-faint"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 font-serif text-[clamp(20px,2.4vw,30px)] font-medium">{capsule.title || "A shared capsule"}</div>
                {capsule.recipient && <div className="mb-1.5 font-serif text-[clamp(18px,2.4vw,26px)] italic text-app-dim">To — {capsule.recipient}</div>}
              </>
            )}
            <div className="mb-5 font-script text-[18px] text-app-dim">your note · the {today}</div>

            <RichLetter
              ref={letterRef}
              initialBody={myBody}
              attachments={note.media.items}
              placeholder="Add your part of this capsule…"
              onChange={setBody}
              onRequestVoice={() => note.setRecording("voice")}
              onAttachFiles={note.onAttachFiles}
              onRemoveVoice={(id) => void note.media.remove(id)}
            />
          </div>
        </div>

        <div className="flex animate-[sdRise_0.9s_0.1s_both] flex-col gap-[22px] lg:sticky lg:top-[30px]">
          <MediaStudio media={note.media} onRecord={note.setRecording} onRemove={(id) => void note.media.remove(id)} />

          {isOwner ? (
            <>
              <SharePanel capsuleId={capsule.id} members={members} invites={invites} />
              <Link href={`/app/capsule/${capsule.id}/delivery`}>
                <PrimaryButton className="w-full justify-center">Set delivery &amp; seal</PrimaryButton>
              </Link>
            </>
          ) : (
            <div className="rounded-[10px] border border-app-border bg-app-panel p-4 text-sm text-app-dim">
              Add your note and media. The owner will seal this capsule for everyone when it&rsquo;s ready.
            </div>
          )}
        </div>
      </div>

      {note.recording && <Recorder mode={note.recording} onClose={() => note.setRecording(null)} onDone={note.onRecorderDone} />}
    </ScreenFrame>
  );
}
