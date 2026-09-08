"use client";
// The public reveal a recipient sees after following the emailed link. It has
// no sidebar or app chrome — it stands alone on the themed background — so it
// carries its own wrapper rather than using ScreenFrame.

import { useState } from "react";
import type { AttachmentView } from "../types";
import { Doodle, Grain, PrimaryButton } from "../components/ui";
import { MediaGallery, MediaItem } from "../components/Attachments";
import { splitLetter } from "../letter";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Body text with any inline voice notes rendered where they were placed. */
function renderLetter(body: string, attachments: AttachmentView[]) {
  const byShort = new Map(attachments.map((a) => [a.id.slice(0, 8), a]));
  const usedInline = new Set<string>();
  const nodes = splitLetter(body).map((seg, i) => {
    if (seg.type === "text") {
      const t = seg.text.trim();
      return t ? (
        <p key={i} className="whitespace-pre-wrap font-serif text-lg leading-[1.65]">{t}</p>
      ) : null;
    }
    const att = byShort.get(seg.id);
    if (!att) return null;
    usedInline.add(att.id);
    return (
      <div key={i} className="my-4">
        <MediaItem a={att} />
      </div>
    );
  });
  return { nodes, gallery: attachments.filter((a) => !usedInline.has(a.id)) };
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-gradient relative min-h-screen font-sans text-app-text">
      <Grain />
      <main className="relative z-[2] p-[clamp(16px,4vw,48px)]">{children}</main>
    </div>
  );
}

export function RevealLetter({
  senderName,
  recipientName,
  occasion,
  writtenAt,
  body,
  attachments,
}: {
  senderName: string;
  recipientName: string;
  occasion: string | null;
  writtenAt: string | null;
  body: string;
  attachments: AttachmentView[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Frame>
        <div className="flex min-h-[calc(100vh-8vw)] flex-col items-center justify-center text-center">
          <Doodle className="mb-1.5 block animate-[sdPulse_3s_infinite] !text-[22px]">for you</Doodle>
          <div className="relative my-3 mb-6 h-[112px] w-[112px]">
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(43,38,33,0.12),inset_0_3px_10px_rgba(255,255,255,0.25)]"
              style={{ background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)" }}
            >
              <span className="font-serif text-[34px] italic text-[#f3ecdf]">S</span>
            </div>
          </div>
          <h1 className="mb-3 font-serif text-[clamp(26px,3.4vw,44px)] font-medium">
            {senderName} left you <span className="italic">a letter.</span>
          </h1>
          <p className="mx-auto mb-6 max-w-[420px] text-sm text-app-dim">
            {occasion ? `${occasion}. ` : ""}It was written {writtenAt ? fmt(writtenAt) : "a while ago"} and kept until today.
          </p>
          <PrimaryButton onClick={() => setOpen(true)}>Open your letter</PrimaryButton>
        </div>
      </Frame>
    );
  }

  const { nodes, gallery } = renderLetter(body, attachments);
  const hasAnything = nodes.some(Boolean) || gallery.length > 0;

  return (
    <Frame>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.9s_both]">
        <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-app-faint">A letter kept for you</div>
        <div className="rounded-[10px] border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
          <div className="mb-1.5 font-serif text-[clamp(22px,3vw,36px)] italic">To — {recipientName}</div>
          {writtenAt && <div className="mb-5 font-script text-[18px] text-app-dim">written {fmt(writtenAt)}</div>}
          {hasAnything ? (
            <div className="flex flex-col gap-3">{nodes}</div>
          ) : (
            <p className="font-serif text-lg italic leading-[1.65] text-app-dim">(This one was sent without words.)</p>
          )}
          <MediaGallery items={gallery} />
          <div className="mt-8 border-t border-app-border pt-5 font-script text-[20px] text-app-dim">— {senderName}</div>
        </div>
        <p className="mt-7 text-center text-xs text-app-faint">
          Kept and delivered by Someday.
        </p>
      </div>
    </Frame>
  );
}

/** Shown when a link is opened before the letter's moment has arrived. */
export function RevealNotYet({ sendAt }: { sendAt: string | null }) {
  return (
    <Frame>
      <div className="flex min-h-[calc(100vh-8vw)] flex-col items-center justify-center text-center">
        <div className="relative my-3 mb-6 h-[96px] w-[96px]">
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(43,38,33,0.12),inset_0_3px_10px_rgba(255,255,255,0.25)]"
            style={{ background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)" }}
          >
            <span className="font-serif text-[28px] italic text-[#f3ecdf]">S</span>
          </div>
        </div>
        <h1 className="mb-3 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-[1.05]">
          This letter isn&rsquo;t <span className="italic">ready yet.</span>
        </h1>
        <p className="mx-auto max-w-[420px] text-sm text-app-dim">
          It&rsquo;s meant to arrive {sendAt ? `on ${fmt(sendAt)}` : "soon"}. Come back then — it&rsquo;ll be here.
        </p>
      </div>
    </Frame>
  );
}
