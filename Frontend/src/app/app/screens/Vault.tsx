"use client";
import Link from "next/link";
import type { CapsuleView } from "../types";
import { type CapsuleShape } from "../data";
import { Kicker, PrimaryButton, Photo, Countdown, Icon, ScreenFrame } from "../components/ui";
import { stripVoiceTokens } from "../letter";

// We don't store a cover shape/tint per capsule, so derive a stable one from
// its id — the same capsule always looks the same.
const TINTS = ["#2b2b2e", "#343434", "#26262a", "#2f2d2a", "#38352f"];
const SHAPES: CapsuleShape[] = ["envelope", "box", "reel"];
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** A locked object — envelope, box, or film reel — over a tinted photo. */
function CapsuleObject({ obj, tint }: { obj: CapsuleShape; tint: string }) {
  return (
    <div className="relative aspect-[1.2] w-full overflow-hidden rounded-[10px]">
      <Photo tint={tint} />
      {obj === "reel" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex aspect-square w-[46%] items-center justify-center rounded-full border-[3px] border-[rgba(240,230,216,0.5)]">
            <div className="aspect-square w-[34%] rounded-full border-[3px] border-[rgba(240,230,216,0.5)]" />
          </div>
        </div>
      )}
      {obj === "box" && (
        <>
          <div className="absolute inset-y-0 left-1/2 w-[14px] -translate-x-1/2 bg-[rgba(240,230,216,0.16)]" />
          <div className="absolute inset-x-0 top-[40%] h-[14px] bg-[rgba(240,230,216,0.16)]" />
        </>
      )}
      {obj === "envelope" && (
        <div className="absolute inset-x-0 top-0 h-[56%] border-b-2 border-[rgba(240,230,216,0.28)] bg-[rgba(240,230,216,0.06)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      )}
    </div>
  );
}

function statusOf(c: CapsuleView): "draft" | "locked" | "open" {
  if (c.status === "draft") return "draft";
  const due = c.unlockDate != null && new Date(c.unlockDate).getTime() <= Date.now();
  if (c.status === "unlocked" || due) return "open";
  return "locked";
}

export function Vault({ capsules }: { capsules: CapsuleView[] }) {
  const active = capsules.filter((c) => statusOf(c) !== "open");
  const opened = capsules.filter((c) => statusOf(c) === "open");

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[1180px] animate-[sdRise_0.7s_both]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>Your vault</Kicker>
            <h1 className="font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-none tracking-[-0.01em]">
              Sealed, and <span className="italic">waiting.</span>
            </h1>
          </div>
          <Link href="/app/new">
            <PrimaryButton>New capsule</PrimaryButton>
          </Link>
        </div>

        {active.length === 0 && opened.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-[80px_30px] text-center">
            <div className="mb-2.5 font-script text-[28px] text-app-dim">nothing sealed yet</div>
            <div className="mb-4 font-serif text-3xl">Your vault is empty</div>
            <Link href="/app/new">
              <PrimaryButton className="mt-1">Write your first letter</PrimaryButton>
            </Link>
          </div>
        ) : (
          <div className="[column-gap:22px] [column-width:290px]">
            {active.map((c) => {
              const st = statusOf(c);
              const obj = SHAPES[hash(c.id) % SHAPES.length];
              const tint = TINTS[hash(c.id) % TINTS.length];
              const href = st === "draft" ? `/app/capsule/${c.id}/editor` : `/app/capsule/${c.id}`;
              return (
                <Link
                  key={c.id}
                  href={href}
                  className="mb-[22px] block cursor-pointer overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[0_14px_34px_rgba(43,38,33,0.09)] transition-all duration-300 [break-inside:avoid] hover:-translate-y-[5px] hover:shadow-[0_26px_60px_rgba(43,38,33,0.12)]"
                >
                  <div className="relative">
                    <CapsuleObject obj={obj} tint={tint} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/55" />
                    {c.type === "group" && (
                      <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/50 px-2.5 py-[5px] text-[10px] uppercase tracking-[0.14em] text-[#f0e6d8]">
                        Group
                      </div>
                    )}
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-[5px] text-[10px] uppercase tracking-[0.14em] text-[#f0e6d8]">
                      <Icon
                        d={st === "draft" ? "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" : "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z"}
                        className="h-[11px] w-[11px]"
                      />
                      {st === "draft" ? "Draft" : "Sealed"}
                    </div>
                  </div>
                  <div className="p-[18px_18px_20px]">
                    <div className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-app-faint">
                      {c.recipient ? `To — ${c.recipient}` : " "}
                    </div>
                    <div className="mb-3.5 font-serif text-[26px] font-medium">{c.title || "Untitled capsule"}</div>
                    {st === "draft" ? (
                      <p className="text-sm leading-[1.55] text-app-dim">Not sealed yet — pick up where you left off.</p>
                    ) : c.unlockType === "location" ? (
                      <p className="text-sm leading-[1.55] text-app-dim">
                        Opens at {c.unlockPlaceLabel?.trim() || "a place you chose"}.
                      </p>
                    ) : c.unlockType === "milestone" ? (
                      <p className="text-sm leading-[1.55] text-app-dim">
                        Opens when: <span className="italic text-app-text">{c.unlockMilestone?.trim() || "a milestone"}</span>
                      </p>
                    ) : (
                      <Countdown days={daysUntil(c.unlockDate)} gap="gap-2.5" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {opened.length > 0 && (
          <div className="mt-14">
            <div className="mb-[22px] flex items-center gap-4">
              <span className="font-serif text-[28px] italic text-app-dim">Opened</span>
              <span className="h-px flex-1 bg-app-border" />
            </div>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {opened.map((c) => {
                const tint = TINTS[hash(c.id) % TINTS.length];
                const clean = stripVoiceTokens(c.body ?? "");
                const excerpt = clean.slice(0, 90);
                return (
                  <Link
                    key={c.id}
                    href={`/app/capsule/${c.id}`}
                    className="flex cursor-pointer gap-3.5 overflow-hidden rounded-[10px] border border-app-border bg-app-surface"
                  >
                    <div className="w-[92px] shrink-0">
                      <Photo tint={tint} />
                    </div>
                    <div className="p-[14px_14px_14px_4px]">
                      <div className="mb-1 text-[11px] text-app-faint">{c.recipient ? `To — ${c.recipient}` : ""}</div>
                      <div className="mb-1.5 font-serif text-xl">{c.title || "Untitled capsule"}</div>
                      <p className="text-[13px] leading-[1.5] text-app-dim">
                        {excerpt ? `${excerpt}${clean.length > 90 ? "…" : ""}` : "Opened."}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
