"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CapsuleView, AttachmentView, ContributionView } from "../types";
import { Kicker, Doodle, PrimaryButton, GhostButton, Countdown, ScreenFrame } from "../components/ui";
import { MediaGallery, MediaItem } from "../components/Attachments";
import { splitLetter } from "../letter";
import { openByLocationAction, openByMilestoneAction } from "../actions";

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}
function radiusLabel(m: number | null): string {
  if (m == null) return "this place";
  return m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${m} m`;
}

/** A wax medallion, reused across the gate screens. */
function Medallion({ size = 112 }: { size?: number }) {
  return (
    <div className="relative my-3 mb-6" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(43,38,33,0.12),inset_0_3px_10px_rgba(255,255,255,0.25)]"
        style={{ background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)" }}
      >
        <span className="font-serif italic text-[#f3ecdf]" style={{ fontSize: size * 0.3 }}>S</span>
      </div>
    </div>
  );
}

/** Render a letter body as text runs with voice notes sitting inline. Returns
 *  the rendered nodes and which attachment ids were consumed inline. */
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

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** A sealed capsule that isn't due yet — the waiting room. */
function Waiting({ capsule }: { capsule: CapsuleView }) {
  return (
    <ScreenFrame>
      <div className="mx-auto flex min-h-[calc(100vh-8vw)] max-w-[640px] flex-col items-center justify-center text-center animate-[sdRise_0.8s_both]">
        <div className="relative my-3 mb-6 h-[96px] w-[96px]">
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(43,38,33,0.12),inset_0_3px_10px_rgba(255,255,255,0.25)]"
            style={{ background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)" }}
          >
            <span className="font-serif text-[28px] italic text-[#f3ecdf]">S</span>
          </div>
        </div>
        <Kicker>Sealed{capsule.sealedAt ? ` ${daysSince(capsule.sealedAt)} days ago` : ""}</Kicker>
        <h1 className="mb-3 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-[1.05]">
          {capsule.title || "Your letter"} is <span className="italic">still waiting.</span>
        </h1>
        <p className="mx-auto mb-6 max-w-[420px] text-sm text-app-dim">
          It can&rsquo;t be opened until {fmt(capsule.unlockDate)}. That&rsquo;s the whole point — no peeking.
        </p>
        <div className="mb-6">
          <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.2em] text-app-faint">It will open in</div>
          <Countdown days={daysUntil(capsule.unlockDate)} />
        </div>
        <Link href="/app/vault">
          <GhostButton>Back to your vault</GhostButton>
        </Link>
      </div>
    </ScreenFrame>
  );
}

/** An unlocked capsule — break the seal, then read the letter as it was sealed. */
function Reveal({ capsule, attachments }: { capsule: CapsuleView; attachments: AttachmentView[] }) {
  const [open, setOpen] = useState(false);
  const sealedAgo = capsule.sealedAt ? daysSince(capsule.sealedAt) : null;

  if (!open) {
    return (
      <ScreenFrame>
        <div className="flex min-h-[calc(100vh-8vw)] flex-col items-center justify-center text-center">
          <Doodle className="mb-1.5 block animate-[sdPulse_3s_infinite] !text-[22px]">it&rsquo;s time</Doodle>
          <div className="relative my-3 mb-6 h-[112px] w-[112px]">
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(43,38,33,0.12),inset_0_3px_10px_rgba(255,255,255,0.25)]"
              style={{ background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)" }}
            >
              <span className="font-serif text-[34px] italic text-[#f3ecdf]">S</span>
            </div>
          </div>
          <h1 className="mb-3 font-serif text-[clamp(26px,3.4vw,44px)] font-medium">
            A capsule has <span className="italic">unlocked.</span>
          </h1>
          <p className="mx-auto mb-6 max-w-[400px] text-sm text-app-dim">
            {sealedAgo != null ? `Sealed ${sealedAgo} days ago. ` : ""}Written by you, for today.
          </p>
          <PrimaryButton onClick={() => setOpen(true)}>Break the seal</PrimaryButton>
        </div>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.9s_both]">
        <Kicker>Opened{sealedAgo != null ? ` · sealed ${sealedAgo} days ago` : ""}</Kicker>
        <div className="rounded-[10px] border border-app-border bg-app-surface p-[clamp(20px,3vw,40px)] shadow-[0_24px_60px_rgba(43,38,33,0.1)] backdrop-blur-xl">
          <div className="mb-1.5 font-serif text-[clamp(22px,3vw,36px)] italic">
            To — {capsule.recipient || "Future Me"}
          </div>
          {capsule.sealedAt && (
            <div className="mb-5 font-script text-[18px] text-app-dim">written {fmt(capsule.sealedAt)}</div>
          )}
          {(() => {
            const { nodes, gallery } = renderLetter(capsule.body ?? "", attachments);
            const hasAnything = nodes.some(Boolean) || gallery.length > 0;
            return (
              <>
                {hasAnything ? (
                  <div className="flex flex-col gap-3">{nodes}</div>
                ) : (
                  <p className="font-serif text-lg italic leading-[1.65] text-app-dim">
                    (This one was sealed without words.)
                  </p>
                )}
                <MediaGallery items={gallery} />
              </>
            );
          })()}
        </div>
        <div className="mt-7 flex items-center gap-4">
          <Link href="/app/vault">
            <PrimaryButton>Keep in archive</PrimaryButton>
          </Link>
          <Link href="/app/new">
            <GhostButton>Reply to yourself</GhostButton>
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}

/** Sealed by place — check whether the reader is standing there yet. */
function LocationGate({ capsule }: { capsule: CapsuleView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const check = () => {
    setMsg(null);
    if (!("geolocation" in navigator)) {
      setMsg("This device can't share a location.");
      return;
    }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setChecking(false);
        start(async () => {
          const r = await openByLocationAction(capsule.id, pos.coords.latitude, pos.coords.longitude);
          if (r.ok) router.refresh();
          else if (r.reason === "too_far") setMsg(`You're about ${fmtDist(r.distanceM ?? 0)} away. Get closer to open it.`);
          else setMsg("This capsule can't be opened here.");
        });
      },
      () => {
        setChecking(false);
        setMsg("Allow location access to open this one.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const busy = checking || pending;
  return (
    <ScreenFrame>
      <div className="mx-auto flex min-h-[calc(100vh-8vw)] max-w-[560px] flex-col items-center justify-center text-center animate-[sdRise_0.8s_both]">
        <Medallion />
        <Kicker>Sealed to a place</Kicker>
        <h1 className="mb-3 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-[1.05]">
          Open it {capsule.unlockPlaceLabel?.trim() ? <>at <span className="italic">{capsule.unlockPlaceLabel.trim()}</span></> : "where you left it"}.
        </h1>
        <p className="mx-auto mb-6 max-w-[420px] text-sm text-app-dim">
          This letter unlocks when you&rsquo;re within {radiusLabel(capsule.unlockRadiusM)} of the spot you chose. Be there, then check.
        </p>
        <PrimaryButton onClick={check} className={busy ? "pointer-events-none opacity-70" : ""}>
          {busy ? "Checking…" : "Check my location"}
        </PrimaryButton>
        {msg && <p className="mt-4 text-sm text-app-accent">{msg}</p>}
        <Link href="/app/vault" className="mt-6">
          <GhostButton>Back to your vault</GhostButton>
        </Link>
      </div>
    </ScreenFrame>
  );
}

/** Sealed to a milestone — the reader attests it happened. */
function MilestoneGate({ capsule }: { capsule: CapsuleView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const open = () =>
    start(async () => {
      const r = await openByMilestoneAction(capsule.id);
      if (r.ok) router.refresh();
    });

  return (
    <ScreenFrame>
      <div className="mx-auto flex min-h-[calc(100vh-8vw)] max-w-[560px] flex-col items-center justify-center text-center animate-[sdRise_0.8s_both]">
        <Medallion />
        <Kicker>Sealed to a milestone</Kicker>
        <h1 className="mb-4 font-serif text-[clamp(24px,3.2vw,40px)] font-medium italic leading-[1.15]">
          {capsule.unlockMilestone?.trim() || "When the moment comes."}
        </h1>
        <p className="mx-auto mb-6 max-w-[420px] text-sm text-app-dim">
          Only open this once it&rsquo;s truly happened — that&rsquo;s the pact you made with your past self.
        </p>
        <PrimaryButton onClick={open} className={pending ? "pointer-events-none opacity-70" : ""}>
          {pending ? "Opening…" : "It's happened — open it"}
        </PrimaryButton>
        <Link href="/app/vault" className="mt-6">
          <GhostButton>Not yet</GhostButton>
        </Link>
      </div>
    </ScreenFrame>
  );
}

/** A member waiting for the owner to open a place/milestone group capsule. */
function LockedForMember({ capsule }: { capsule: CapsuleView }) {
  return (
    <ScreenFrame>
      <div className="mx-auto flex min-h-[calc(100vh-8vw)] max-w-[560px] flex-col items-center justify-center text-center animate-[sdRise_0.8s_both]">
        <Medallion />
        <Kicker>Sealed together</Kicker>
        <h1 className="mb-3 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-[1.05]">
          {capsule.title || "This capsule"} is <span className="italic">still sealed.</span>
        </h1>
        <p className="mx-auto mb-6 max-w-[420px] text-sm text-app-dim">
          {capsule.unlockType === "location"
            ? "It opens at a place the group chose — the owner will open it when they're there."
            : "It opens at a milestone the group chose — the owner will open it when it happens."}{" "}
          You&rsquo;ll see everyone&rsquo;s notes then.
        </p>
        <Link href="/app/vault">
          <GhostButton>Back to your vault</GhostButton>
        </Link>
      </div>
    </ScreenFrame>
  );
}

/** An opened group capsule — everyone's notes, in order. */
function GroupReveal({ capsule, contributions }: { capsule: CapsuleView; contributions: ContributionView[] }) {
  const withContent = contributions.filter((c) => c.body.trim() || c.attachments.length > 0);
  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.9s_both]">
        <Kicker>Opened · a shared capsule</Kicker>
        <h1 className="mb-6 font-serif text-[clamp(24px,3.4vw,42px)] font-medium">
          {capsule.title || "For all of us"}
        </h1>
        {withContent.length === 0 ? (
          <p className="font-serif text-lg italic text-app-dim">(No one wrote anything in time.)</p>
        ) : (
          <div className="flex flex-col gap-5">
            {withContent.map((c) => {
              const { nodes, gallery } = renderLetter(c.body, c.attachments);
              return (
                <div key={c.authorId} className="rounded-[10px] border border-app-border bg-app-surface p-[clamp(18px,3vw,32px)] shadow-[0_18px_50px_rgba(43,38,33,0.1)] backdrop-blur-xl">
                  <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-app-faint">
                    From {c.isYou ? "you" : c.authorEmail ?? "a member"}
                  </div>
                  <div className="flex flex-col gap-3">{nodes.length ? nodes : <p className="font-serif text-lg italic text-app-dim">(Only media.)</p>}</div>
                  <MediaGallery items={gallery} />
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-7">
          <Link href="/app/vault">
            <PrimaryButton>Keep in archive</PrimaryButton>
          </Link>
        </div>
      </div>
    </ScreenFrame>
  );
}

export type DetailMode = "waiting" | "reveal" | "location" | "milestone" | "locked";

export function CapsuleDetail({
  capsule,
  mode,
  isGroup,
  attachments,
  contributions,
}: {
  capsule: CapsuleView;
  mode: DetailMode;
  isGroup: boolean;
  attachments: AttachmentView[];
  contributions: ContributionView[];
}) {
  if (mode === "reveal") {
    return isGroup ? (
      <GroupReveal capsule={capsule} contributions={contributions} />
    ) : (
      <Reveal capsule={capsule} attachments={attachments} />
    );
  }
  if (mode === "location") return <LocationGate capsule={capsule} />;
  if (mode === "milestone") return <MilestoneGate capsule={capsule} />;
  if (mode === "locked") return <LockedForMember capsule={capsule} />;
  return <Waiting capsule={capsule} />;
}
