"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROMPTS } from "../data";
import { saveDraftAction } from "../actions";
import { scheduleMessageAction, unscheduleMessageAction, setRecipientAction, sendNowAction } from "../scheduled/actions";
import type { ScheduledView, ContactView, AttachmentView, TemplateKey } from "../types";
import { PrimaryButton, ScreenFrame } from "../components/ui";
import { MediaStudio } from "../components/Attachments";
import { renderLetterBody } from "../components/LetterBody";
import { Select } from "../components/Select";
import { DateTimeField } from "../components/DateTimeField";
import { Recorder } from "../components/Recorder";
import { RichLetter, type RichLetterHandle } from "../components/RichLetter";
import { useNoteEditing } from "../components/note";

type SaveState = "idle" | "saving" | "saved";

// Local Date -> the "YYYY-MM-DDTHH:mm" string a datetime-local input expects.
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function whenLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The "Sending to" card — pick a saved contact or type a new recipient. */
function RecipientPicker({
  messageId,
  contact,
  contacts,
}: {
  messageId: string;
  contact: ContactView | null;
  contacts: ContactView[];
}) {
  const router = useRouter();
  const [working, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const pick = (contactId: string) =>
    start(async () => {
      setErr(null);
      await setRecipientAction(messageId, { contactId });
      router.refresh();
    });

  const addNew = () =>
    start(async () => {
      setErr(null);
      const res = await setRecipientAction(messageId, { name, email });
      if (!res.ok) return setErr(res.error ?? "Couldn't set that recipient.");
      setName("");
      setEmail("");
      setAdding(false);
      router.refresh();
    });

  return (
    <div className="rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
      <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Sending to</div>

      {contact ? (
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent text-sm font-medium uppercase text-app-on-accent">
            {contact.name.trim().charAt(0) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-app-text">{contact.name}</div>
            <div className="truncate text-xs text-app-dim">{contact.email}</div>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-app-dim">No one yet — choose who this letter is for.</p>
      )}

      {!adding && (
        <div className="flex flex-col gap-2">
          {contacts.length > 0 && (
            <Select
              value={contact?.id ?? ""}
              onChange={(id) => id && pick(id)}
              disabled={working}
              placeholder={contact ? "Change recipient…" : "Pick a saved contact…"}
              className="w-full"
              options={contacts.map((c) => ({ value: c.id, label: `${c.name} · ${c.email}` }))}
            />
          )}
          <button
            onClick={() => setAdding(true)}
            disabled={working}
            className="text-left text-[12px] uppercase tracking-[0.14em] text-app-dim transition-colors hover:text-app-text"
          >
            ＋ New recipient
          </button>
        </div>
      )}

      {adding && (
        <div className="flex flex-col gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-faint focus:border-app-dim" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@email.com" className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-faint focus:border-app-dim" />
          {err && <p className="text-[13px] text-app-accent">{err}</p>}
          <div className="flex gap-2">
            <button onClick={addNew} disabled={working || !name.trim() || !email.trim()} className="flex-1 rounded-full bg-app-accent px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-app-on-accent transition-all hover:-translate-y-0.5 disabled:opacity-50">
              {working ? "Saving…" : "Use recipient"}
            </button>
            <button onClick={() => { setAdding(false); setErr(null); }} disabled={working} className="rounded-full border border-app-border px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-app-dim transition-colors hover:text-app-text">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScheduledCompose({
  message,
  attachments,
  contacts,
}: {
  message: ScheduledView;
  attachments: AttachmentView[];
  contacts: ContactView[];
}) {
  const router = useRouter();
  const capsule = message.capsule;
  const locked = message.status !== "draft"; // scheduled/sent → read-only
  const prompt = PROMPTS[(capsule.template as TemplateKey) ?? "blank"] ?? "";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const recipientName = message.contact?.name ?? "your recipient";

  const [title, setTitle] = useState(capsule.title ?? "");
  const [recipient, setRecipient] = useState(capsule.recipient ?? "");
  const [body, setBody] = useState(capsule.body ?? "");
  const [save, setSave] = useState<SaveState>("idle");

  // Delivery panel state.
  const [sendAt, setSendAt] = useState(message.sendAt ? toLocalInput(new Date(message.sendAt)) : "");
  const [occasion, setOccasion] = useState(message.occasion ?? "");
  const [minDt, setMinDt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [working, startWork] = useTransition();

  const letterRef = useRef<RichLetterHandle | null>(null);
  const note = useNoteEditing(capsule.id, attachments, letterRef);

  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Earliest selectable moment — computed off-render to stay pure.
  useEffect(() => {
    const t = setTimeout(() => setMinDt(toLocalInput(new Date(Date.now() + 60_000))), 0);
    return () => clearTimeout(t);
  }, []);

  // Autosave the letter while it's still a draft.
  useEffect(() => {
    if (locked) return;
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
  }, [title, recipient, body, capsule.id, locked]);

  const schedule = () =>
    startWork(async () => {
      setError(null);
      if (!message.contact) return setError("Choose who this letter is for first.");
      if (!sendAt) return setError("Pick when it should arrive.");
      await saveDraftAction(capsule.id, { title, recipient, body });
      const iso = new Date(sendAt).toISOString();
      const res = await scheduleMessageAction(message.id, { sendAt: iso, occasion });
      if (!res.ok) return setError(res.error ?? "Couldn't schedule that.");
      // Confirm on the button itself, then move on to the list.
      setDone(true);
      setTimeout(() => router.push("/app/scheduled"), 1100);
    });

  const reschedule = () =>
    startWork(async () => {
      await unscheduleMessageAction(message.id);
      router.refresh();
    });

  // Send the letter right now, ignoring the date. Stays on the page so the
  // panel flips to its "Sent" state.
  const sendNow = () =>
    startWork(async () => {
      setError(null);
      if (!message.contact) return setError("Choose who this letter is for first.");
      if (!locked) await saveDraftAction(capsule.id, { title, recipient, body });
      const res = await sendNowAction(message.id);
      if (!res.ok) return setError(res.error ?? "Couldn't send that.");
      router.refresh();
    });

  const saveLabel = save === "saving" ? "Saving…" : save === "saved" ? "Autosaved" : "Draft";

  return (
    <ScreenFrame>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_320px]">
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <button onClick={() => router.push("/app/scheduled")} className="text-xs uppercase tracking-[0.16em] text-app-faint transition-colors hover:text-app-text">
              ← Scheduled
            </button>
            {!locked && (
              <span className="inline-flex items-center gap-2 text-xs text-app-dim">
                <span className={`h-[7px] w-[7px] rounded-full ${save === "saving" ? "animate-[sdPulse_2s_infinite] bg-app-dim" : "bg-app-accent"}`} />
                {saveLabel}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
            {locked ? (
              <>
                <h1 className="mb-3 font-serif text-[clamp(20px,2.4vw,30px)] font-medium text-app-text">{title || "Untitled letter"}</h1>
                <div className="mb-1.5 font-serif text-[clamp(18px,2.4vw,28px)] italic text-app-dim">To — {recipient || recipientName}</div>
                <div className="mb-5 font-square-peg text-[18px] text-app-text">the {today}</div>
                {(() => {
                  const { nodes } = renderLetterBody(body, note.media.items);
                  return nodes.some(Boolean) ? (
                    <div className="flex flex-col gap-3">{nodes}</div>
                  ) : (
                    <div className="text-app-dim">—</div>
                  );
                })()}
              </>
            ) : (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled letter"
                  className="mb-3 w-full border-none bg-transparent font-serif text-[clamp(20px,2.4vw,30px)] font-medium text-app-text outline-none placeholder:text-app-faint"
                />
                <div className="mb-1.5 flex items-baseline gap-2 font-serif text-[clamp(18px,2.4vw,28px)] italic">
                  <span className="text-app-dim">To —</span>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={recipientName}
                    className="min-w-0 flex-1 border-none bg-transparent italic text-app-text outline-none placeholder:text-app-faint"
                  />
                </div>
                <div className="mb-5 font-square-peg text-[18px] text-app-text">the {today}</div>

                <RichLetter
                  ref={letterRef}
                  initialBody={capsule.body ?? ""}
                  attachments={note.media.items}
                  placeholder={prompt || "Start writing…"}
                  onChange={setBody}
                  onRequestVoice={() => note.setRecording("voice")}
                  onAttachFiles={note.onAttachFiles}
                  onRemoveAttachment={(id) => void note.media.remove(id)}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex animate-[sdRise_0.9s_0.1s_both] flex-col gap-[22px] lg:sticky lg:top-[30px]">
          {locked ? (
            <div className="rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-app-faint">
                  {message.status === "sent" ? "Sent to" : "Sending to"}
                </span>
                {message.status === "sent" && (
                  <span className="rounded-full bg-app-accent px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-app-on-accent">✓ Sent</span>
                )}
                {message.status === "failed" && (
                  <span className="rounded-full border border-app-accent/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-app-accent">Failed</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent text-sm font-medium uppercase text-app-on-accent">
                  {message.contact?.name.trim().charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm text-app-text">{message.contact?.name ?? "—"}</div>
                  <div className="truncate text-xs text-app-dim">{message.contact?.email ?? ""}</div>
                </div>
              </div>
            </div>
          ) : (
            <RecipientPicker messageId={message.id} contact={message.contact} contacts={contacts} />
          )}

          {!locked && <MediaStudio media={note.media} onRecord={note.setRecording} onRemove={note.removeAttachment} />}

          {/* deliver-when panel */}
          <div className="rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
            <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Deliver on</div>
            {locked ? (
              <>
                {message.status === "sent" ? (
                  <p className="mb-1 text-sm text-app-text">Delivered {whenLabel(message.sentAt)}</p>
                ) : (
                  message.sendAt && <p className="mb-1 text-sm text-app-text">{whenLabel(message.sendAt)}</p>
                )}
                {message.occasion && <p className="mb-3 text-xs text-app-dim">{message.occasion}</p>}
                <p className="mb-4 text-xs text-app-faint">
                  {message.status === "sent"
                    ? "This letter has been sent — it can't be changed."
                    : message.status === "failed"
                      ? "The last attempt didn't go through. Check the recipient's address and try again."
                      : "Locked in. Reschedule to change the words or the time."}
                </p>
                {error && <p className="mb-3 text-[13px] text-app-accent">{error}</p>}
                {(message.status === "scheduled" || message.status === "failed") && (
                  <div className="flex flex-col gap-2">
                    <PrimaryButton onClick={sendNow} className={`w-full justify-center ${working ? "pointer-events-none opacity-70" : ""}`}>
                      {working ? "Sending…" : message.status === "failed" ? "Retry send" : "Send now"}
                    </PrimaryButton>
                    {message.status === "scheduled" && (
                      <button onClick={reschedule} disabled={working} className="w-full rounded-full border border-app-border px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-dim transition-colors hover:text-app-text disabled:opacity-50">
                        {working ? "…" : "Reschedule"}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <DateTimeField value={sendAt} min={minDt} onChange={setSendAt} />
                <input
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Occasion (e.g. Mom's birthday)"
                  className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-faint focus:border-app-dim"
                />
                {error && <p className="text-[13px] text-app-accent">{error}</p>}
                {!message.contact && <p className="text-[12px] text-app-faint">Choose a recipient above to schedule.</p>}
                <PrimaryButton onClick={schedule} showArrow={!done} className={`w-full justify-center ${done ? "pointer-events-none !bg-app-accent opacity-100" : working || !message.contact ? "pointer-events-none opacity-50" : ""}`}>
                  {done ? "✓ Sent" : working ? "Working…" : "Schedule letter"}
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {note.recording && <Recorder mode={note.recording} onClose={() => note.setRecording(null)} onDone={note.onRecorderDone} />}
    </ScreenFrame>
  );
}
