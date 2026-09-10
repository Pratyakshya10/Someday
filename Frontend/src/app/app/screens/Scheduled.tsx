"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactView, ScheduledView } from "../types";
import { Kicker, ScreenFrame } from "../components/ui";
import {
  addContactAction,
  deleteContactAction,
  createScheduledDraftAction,
  unscheduleMessageAction,
  deleteScheduledAction,
  sendNowAction,
} from "../scheduled/actions";

const inputCls =
  "w-full rounded-md border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-app-text outline-none placeholder:text-app-faint focus:border-app-dim";

function whenLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<ScheduledView["status"], string> = {
  draft: "bg-app-surface text-app-dim border-app-border",
  scheduled: "bg-app-accent/10 text-app-accent border-app-accent/30",
  sent: "bg-app-accent text-app-on-accent border-app-accent",
  failed: "bg-app-surface text-app-accent border-app-accent/40",
  canceled: "bg-app-surface text-app-faint border-app-border",
};

export function Scheduled({
  contacts,
  messages,
}: {
  contacts: ContactView[];
  messages: ScheduledView[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);

  const write = () =>
    start(async () => {
      const res = await createScheduledDraftAction();
      if (res.ok) router.push(`/app/scheduled/${res.id}`);
    });

  const addContact = () =>
    start(async () => {
      setError(null);
      const res = await addContactAction({ name, email, phone });
      if (!res.ok) return setError(res.error ?? "Couldn't add that contact.");
      setName("");
      setEmail("");
      setPhone("");
      router.refresh();
    });

  const removeContact = (id: string) =>
    start(async () => {
      await deleteContactAction(id);
      router.refresh();
    });

  const cancel = (id: string) =>
    start(async () => {
      await unscheduleMessageAction(id);
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteScheduledAction(id);
      router.refresh();
    });

  const sendNow = (id: string) =>
    start(async () => {
      setFlash(null);
      const res = await sendNowAction(id);
      setFlash(res.ok ? "Sent — check the recipient's inbox." : res.error ?? "Couldn't send that.");
      router.refresh();
    });

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[920px] animate-[sdRise_0.7s_both]">
        <Kicker>Scheduled messages</Kicker>
        <h1 className="mb-2 font-serif text-[clamp(20px,2.4vw,30px)] font-medium leading-none tracking-[-0.01em]">
          Write to someone, <span className="font-square-peg">later.</span>
        </h1>
        <p className="mb-5 max-w-[560px] text-[13px] text-app-dim">
          Write a letter, choose who it&rsquo;s for, and pick the day it should land in their inbox —
          a birthday, an anniversary, a quiet Tuesday. It arrives by email from Someday.
        </p>

        <button
          onClick={write}
          disabled={pending}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-app-accent px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-on-accent transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <span className="text-lg leading-none">✎</span> Write a message
        </button>

        {/* scheduled + draft messages */}
        <div className="mb-7">
          <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Letters in flight</div>
          {flash && <p className="mb-3 text-[13px] text-app-accent">{flash}</p>}
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center text-sm text-app-dim">
              Nothing here yet. Hit <span className="text-app-text">Write a message</span> to start your first letter.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const editable = m.status === "draft" || m.status === "scheduled";
                const retryable = m.status === "scheduled" || m.status === "failed";
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-app-border bg-app-panel px-4 py-3 backdrop-blur-xl">
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${STATUS_STYLE[m.status]}`}>
                      {m.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-app-text">
                        {m.capsule.title?.trim() || "Untitled letter"}
                        <span className="text-app-dim">{m.contact ? ` · to ${m.contact.name}` : " · no recipient yet"}</span>
                      </div>
                      <div className="truncate text-xs text-app-dim">
                        {m.sendAt ? `Sends ${whenLabel(m.sendAt)}${m.occasion ? ` · ${m.occasion}` : ""}` : "Not scheduled yet"}
                      </div>
                    </div>
                    {editable && (
                      <button
                        onClick={() => router.push(`/app/scheduled/${m.id}`)}
                        disabled={pending}
                        className="rounded-full border border-app-border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-app-dim transition-colors hover:text-app-text"
                      >
                        {m.status === "scheduled" ? "View" : "Continue"}
                      </button>
                    )}
                    {retryable && (
                      <button onClick={() => sendNow(m.id)} disabled={pending} className="rounded-full border border-app-accent/30 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-app-accent transition-colors hover:bg-app-accent/10">
                        {m.status === "failed" ? "Retry" : "Send now"}
                      </button>
                    )}
                    {m.status === "scheduled" && (
                      <button onClick={() => cancel(m.id)} disabled={pending} className="text-[11px] uppercase tracking-[0.14em] text-app-faint transition-colors hover:text-app-accent">
                        Cancel
                      </button>
                    )}
                    {m.status !== "sent" && (
                      <button onClick={() => remove(m.id)} disabled={pending} aria-label="Delete" className="text-app-faint transition-colors hover:text-app-accent">
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* address book — secondary, collapsed by default */}
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-5 backdrop-blur-xl">
          <button
            onClick={() => setShowBook((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-[11px] uppercase tracking-[0.22em] text-app-faint">
              Address book{contacts.length ? ` · ${contacts.length}` : ""}
            </span>
            <span className="text-app-faint">{showBook ? "▲" : "▼"}</span>
          </button>

          {showBook && (
            <div className="mt-5 grid items-start gap-8 md:grid-cols-[320px_1fr]">
              <div>
                <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Add someone</div>
                <div className="flex flex-col gap-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@email.com" className={inputCls} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
                  {error && <p className="text-[13px] text-app-accent">{error}</p>}
                  <button
                    onClick={addContact}
                    disabled={pending || !name.trim() || !email.trim()}
                    className="mt-1 w-full rounded-full border border-app-border px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-dim transition-colors hover:text-app-text disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Save contact"}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Saved people</div>
                {contacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-6 text-center text-sm text-app-dim">
                    No one saved yet. You can also add a recipient while composing.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {contacts.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-accent text-[13px] font-medium uppercase text-app-on-accent">
                          {c.name.trim().charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-app-text">{c.name}</div>
                          <div className="truncate text-xs text-app-dim">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                        </div>
                        <button onClick={() => removeContact(c.id)} disabled={pending} aria-label="Remove" className="text-app-faint transition-colors hover:text-app-accent">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}
