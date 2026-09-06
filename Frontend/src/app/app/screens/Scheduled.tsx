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
  const [busyId, setBusyId] = useState<string | null>(null);

  const add = () =>
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

  const write = (contactId: string) =>
    start(async () => {
      setBusyId(contactId);
      const res = await createScheduledDraftAction(contactId);
      setBusyId(null);
      if (res.ok && res.id) router.push(`/app/scheduled/${res.id}`);
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

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[920px] animate-[sdRise_0.7s_both]">
        <Kicker>Scheduled</Kicker>
        <h1 className="mb-2 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-none tracking-[-0.01em]">
          Write to someone, <span className="italic">later.</span>
        </h1>
        <p className="mb-8 max-w-[560px] text-sm text-app-dim">
          Add the people you want to reach, then schedule a letter to land on the perfect day —
          a birthday, an anniversary, a quiet Tuesday. It arrives in their inbox from Someday.
        </p>

        {/* scheduled + draft messages */}
        <div className="mb-10">
          <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Letters in flight</div>
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center text-sm text-app-dim">
              Nothing scheduled yet. Pick a contact below and write your first letter.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const editable = m.status === "draft" || m.status === "scheduled";
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-app-border bg-app-panel px-4 py-3 backdrop-blur-xl">
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${STATUS_STYLE[m.status]}`}>
                      {m.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-app-text">
                        {m.capsule.title?.trim() || "Untitled letter"}
                        <span className="text-app-dim"> · to {m.contact.name}</span>
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

        <div className="grid items-start gap-8 md:grid-cols-[340px_1fr]">
          {/* add a contact */}
          <div className="rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
            <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-app-faint">Add a contact</div>
            <div className="flex flex-col gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@email.com" className={inputCls} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
              {error && <p className="text-[13px] text-app-accent">{error}</p>}
              <button
                onClick={add}
                disabled={pending || !name.trim() || !email.trim()}
                className="mt-1 w-full rounded-full bg-app-accent px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-on-accent transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Add contact"}
              </button>
            </div>
          </div>

          {/* contact list */}
          <div>
            <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-app-faint">Your people</div>
            {contacts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center text-sm text-app-dim">
                No one yet. Add someone on the left to start.
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
                    <button
                      onClick={() => write(c.id)}
                      disabled={pending}
                      className="shrink-0 rounded-full bg-app-accent px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-app-on-accent transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {busyId === c.id ? "…" : "Write"}
                    </button>
                    <button onClick={() => removeContact(c.id)} disabled={pending} aria-label="Remove" className="text-app-faint transition-colors hover:text-app-accent">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
