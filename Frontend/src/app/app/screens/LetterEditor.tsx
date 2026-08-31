"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROMPTS } from "../data";
import { saveDraftAction } from "../actions";
import type { CapsuleView, AttachmentView, TemplateKey } from "../types";
import { PrimaryButton, ScreenFrame } from "../components/ui";
import { MediaStudio } from "../components/Attachments";
import { Recorder } from "../components/Recorder";
import { RichLetter, type RichLetterHandle } from "../components/RichLetter";
import { useNoteEditing } from "../components/note";

type SaveState = "idle" | "saving" | "saved";

export function LetterEditor({ capsule, attachments }: { capsule: CapsuleView; attachments: AttachmentView[] }) {
  const router = useRouter();
  const prompt = PROMPTS[(capsule.template as TemplateKey) ?? "blank"] ?? "";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const [title, setTitle] = useState(capsule.title ?? "");
  const [recipient, setRecipient] = useState(capsule.recipient ?? "");
  const [body, setBody] = useState(capsule.body ?? "");
  const [save, setSave] = useState<SaveState>("idle");
  const [leaving, startLeaving] = useTransition();

  const letterRef = useRef<RichLetterHandle | null>(null);
  const note = useNoteEditing(capsule.id, attachments, letterRef);

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
      await saveDraftAction(capsule.id, { title, recipient, body });
      setSave("saved");
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [title, recipient, body, capsule.id]);

  const toDelivery = () =>
    startLeaving(async () => {
      await saveDraftAction(capsule.id, { title, recipient, body });
      router.push(`/app/capsule/${capsule.id}/delivery`);
    });

  const saveLabel = save === "saving" ? "Saving…" : save === "saved" ? "Autosaved" : "Draft";

  return (
    <ScreenFrame>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_300px]">
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs text-app-dim">
              <span className={`h-[7px] w-[7px] rounded-full ${save === "saving" ? "animate-[sdPulse_2s_infinite] bg-app-dim" : "bg-app-accent"}`} />
              {saveLabel}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-app-faint">Solo draft</span>
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled capsule"
              className="mb-3 w-full border-none bg-transparent font-serif text-[clamp(20px,2.4vw,30px)] font-medium text-app-text outline-none placeholder:text-app-faint"
            />
            <div className="mb-1.5 flex items-baseline gap-2 font-serif text-[clamp(18px,2.4vw,28px)] italic">
              <span className="text-app-dim">To —</span>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Future Me"
                className="min-w-0 flex-1 border-none bg-transparent italic text-app-text outline-none placeholder:text-app-faint"
              />
            </div>
            <div className="mb-5 font-script text-[18px] text-app-dim">the {today}</div>

            <RichLetter
              ref={letterRef}
              initialBody={capsule.body ?? ""}
              attachments={note.media.items}
              placeholder={prompt || "Start writing…"}
              onChange={setBody}
              onRequestVoice={() => note.setRecording("voice")}
              onAttachFiles={note.onAttachFiles}
              onRemoveVoice={(id) => void note.media.remove(id)}
            />
          </div>
        </div>

        <div className="flex animate-[sdRise_0.9s_0.1s_both] flex-col gap-[22px] lg:sticky lg:top-[30px]">
          <MediaStudio media={note.media} onRecord={note.setRecording} onRemove={(id) => void note.media.remove(id)} />
          <PrimaryButton onClick={toDelivery} className={`w-full justify-center ${leaving ? "pointer-events-none opacity-70" : ""}`}>
            {leaving ? "Saving…" : "Set delivery"}
          </PrimaryButton>
        </div>
      </div>

      {note.recording && <Recorder mode={note.recording} onClose={() => note.setRecording(null)} onDone={note.onRecorderDone} />}
    </ScreenFrame>
  );
}
