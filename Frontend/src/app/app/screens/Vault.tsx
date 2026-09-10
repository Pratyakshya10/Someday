"use client";
import Link from "next/link";
import type { CapsuleView } from "../types";
import { Kicker, PrimaryButton, GhostButton, Icon, ScreenFrame } from "../components/ui";
import { stripVoiceTokens } from "../letter";

function statusOf(c: CapsuleView): "draft" | "locked" | "open" {
  if (c.status === "draft") return "draft";
  const due = c.unlockDate != null && new Date(c.unlockDate).getTime() <= Date.now();
  if (c.status === "unlocked" || due) return "open";
  return "locked";
}

function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function fmtShort(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// A warm, varied palette for the grid's color blocks — stable per capsule id,
// tuned to sit comfortably next to the app's dawn-gradient background rather
// than reusing it, so each capsule reads as its own little keepsake.
const GRADIENTS: [string, string][] = [
  ["#eab35c", "#c2632a"], // amber → rust
  ["#69808f", "#2f3a46"], // slate → ink
  ["#c1503a", "#82291e"], // terracotta → dark rust
  ["#8fae6a", "#3f7d6e"], // sage → teal
  ["#cf9a44", "#3f6b5e"], // gold → teal
  ["#c97b86", "#7a3b46"], // dusty rose → wine
  ["#7c8f5a", "#39432a"], // olive → moss
  ["#b5763f", "#5a3a28"], // clay → espresso
];

function gradientFor(id: string): string {
  const [a, b] = GRADIENTS[hash(id) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

function initialFor(c: CapsuleView): string {
  const src = c.recipient?.trim() || c.title?.trim() || "?";
  return src.charAt(0).toUpperCase();
}

/** What the hero card (and any teaser) is allowed to say about a capsule's
 *  contents — a locked one keeps its "no peeking" promise even from its own
 *  owner; only drafts and opened letters get to preview real words. */
function teaserFor(c: CapsuleView): string {
  const st = statusOf(c);
  if (st === "draft") return "Not sealed yet — pick up where you left off.";
  if (st === "open") {
    const clean = stripVoiceTokens(c.body ?? "");
    const excerpt = clean.slice(0, 160);
    return excerpt ? `${excerpt}${clean.length > 160 ? "…" : ""}` : "Opened — and kept without words.";
  }
  if (c.unlockType === "location") return `Opens at ${c.unlockPlaceLabel?.trim() || "a place you chose"}.`;
  if (c.unlockType === "milestone") return `Opens when: ${c.unlockMilestone?.trim() || "a milestone"}.`;
  return `It can't be opened until ${fmtShort(c.unlockDate)}. That's the whole point — no peeking.`;
}

function statusLabel(c: CapsuleView): string {
  const st = statusOf(c);
  if (st === "draft") return "Draft";
  if (st === "open") return `Opened · ${fmtShort(c.unlockedAt ?? c.unlockDate)}`;
  return `Sealed · ${fmtShort(c.sealedAt)}`;
}

export function Vault({ capsules }: { capsules: CapsuleView[] }) {
  if (capsules.length === 0) {
    return (
      <ScreenFrame>
        <div className="mx-auto max-w-[1180px] animate-[sdRise_0.7s_both]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker>Someday · Vault</Kicker>
              <h1 className="font-serif text-[clamp(26px,3.4vw,40px)] font-medium leading-none tracking-[-0.01em]">
                The Vault
              </h1>
            </div>
            <Link href="/app/new">
              <PrimaryButton>New capsule</PrimaryButton>
            </Link>
          </div>
          <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-[80px_30px] text-center">
            <div className="mb-2.5 font-square-peg text-[28px] text-app-text">nothing sealed yet</div>
            <div className="mb-4 font-serif text-3xl">Your vault is empty</div>
            <Link href="/app/new">
              <PrimaryButton className="mt-1">Write your first letter</PrimaryButton>
            </Link>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  // The catalog number ("no. 007") reflects real creation order, oldest first.
  const byCreated = [...capsules].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const catalogNo = new Map(byCreated.map((c, i) => [c.id, i + 1]));

  const drafts = capsules.filter((c) => statusOf(c) === "draft");
  const locked = capsules
    .filter((c) => statusOf(c) === "locked")
    .sort((a, b) => new Date(a.unlockDate ?? 0).getTime() - new Date(b.unlockDate ?? 0).getTime());
  const opened = capsules.filter((c) => statusOf(c) === "open");
  const featured = locked[0] ?? drafts[0] ?? opened[0] ?? capsules[0];
  const featuredSt = statusOf(featured);

  const sealedCount = capsules.filter((c) => c.status !== "draft").length;
  const openedCount = opened.length;
  const waitingCount = locked.length;
  const dueThisWeek = locked.filter((c) => daysUntil(c.unlockDate) <= 7).length;

  // Timeline: each year gets its most relevant story — how many opened later
  // that year (forward-looking, if any are due), else how many were sealed in
  // it (looking back). A capsule can count in both a sealed year and a due year.
  const currentYear = new Date().getFullYear();
  const sealedByYear = new Map<number, number>();
  const dueByYear = new Map<number, number>();
  for (const c of capsules) {
    if (c.status !== "draft") {
      const y = new Date(c.sealedAt ?? c.createdAt).getFullYear();
      sealedByYear.set(y, (sealedByYear.get(y) ?? 0) + 1);
    }
    if (statusOf(c) === "locked" && c.unlockDate) {
      const y = new Date(c.unlockDate).getFullYear();
      dueByYear.set(y, (dueByYear.get(y) ?? 0) + 1);
    }
  }
  const years = Array.from(new Set([...sealedByYear.keys(), ...dueByYear.keys()])).sort((a, b) => a - b);

  // Newest activity first — sealed/opened dates when there are any, else
  // creation order for drafts.
  const grid = [...capsules].sort((a, b) => {
    const ta = new Date(a.sealedAt ?? a.createdAt).getTime();
    const tb = new Date(b.sealedAt ?? b.createdAt).getTime();
    return tb - ta;
  });

  const heroHref = featuredSt === "draft" ? `/app/capsule/${featured.id}/editor` : `/app/capsule/${featured.id}`;

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[1180px] animate-[sdRise_0.7s_both]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker>Someday · Vault</Kicker>
            <h1 className="font-serif text-[clamp(20px,2.4vw,28px)] font-medium leading-none tracking-[-0.01em]">
              The Vault
            </h1>
            <p className="mt-1.5 text-[13px] text-app-dim">
              Sealed and opened capsules, kept like letters you&rsquo;re not done{" "}
              <span className="font-square-peg text-[16px] text-app-text">writing.</span>
            </p>
          </div>
          <Link href="/app/new">
            <PrimaryButton>New capsule</PrimaryButton>
          </Link>
        </div>

        {/* hero: the most urgent capsule + at-a-glance stats */}
        <div className="mb-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-app-border bg-app-surface p-4 shadow-[0_14px_34px_rgba(43,38,33,0.08)] sm:p-5">
            <span className="absolute right-4 top-4 font-square-peg text-[14px] text-app-dim">no. {String(catalogNo.get(featured.id)).padStart(3, "0")}</span>
            <div>
              <span
                className={`mb-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                  featuredSt === "draft" ? "bg-app-accent-dim text-app-dim" : "bg-app-bg2 text-app-text"
                }`}
              >
                <Icon
                  d={featuredSt === "draft" ? "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" : featuredSt === "open" ? "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" : "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z"}
                  className="h-[10px] w-[10px]"
                />
                {featuredSt === "draft" ? "Draft" : featuredSt === "open" ? "Opened" : `Sealed${featured.unlockDate ? ` · opens ${fmtShort(featured.unlockDate)}` : ""}`}
              </span>
              <h2 className="mb-1.5 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight">
                {featured.title || "Untitled capsule"}
              </h2>
              <p className="max-w-[520px] text-[13px] leading-[1.5] text-app-dim">{teaserFor(featured)}</p>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <Link href={heroHref}>
                <PrimaryButton>{featuredSt === "draft" ? "Continue writing" : "View capsule"}</PrimaryButton>
              </Link>
              {featuredSt === "draft" && (
                <Link href={`/app/capsule/${featured.id}/editor`}>
                  <GhostButton>Edit</GhostButton>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-app-border bg-app-panel p-4 backdrop-blur-xl sm:p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-app-faint">At a glance</div>
            <div className="mb-2.5 font-serif text-[30px] font-medium leading-none">
              {sealedCount}
              <span className="ml-2 align-middle text-[11px] font-sans font-normal uppercase tracking-[0.14em] text-app-faint">sealed</span>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="font-serif text-lg font-medium leading-none">{openedCount}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-app-faint">opened</div>
              </div>
              <div>
                <div className="font-serif text-lg font-medium leading-none">{waitingCount}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-app-faint">waiting</div>
              </div>
            </div>
            {dueThisWeek > 0 && (
              <p className="mt-auto pt-3 font-square-peg text-[14px] text-app-accent">
                {dueThisWeek === 1 ? "one opens this week" : `${dueThisWeek} open this week`}
              </p>
            )}
          </div>
        </div>

        {/* memory timeline */}
        {years.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-[16px] font-medium">Memory timeline</h3>
              <span className="font-square-peg text-[14px] text-app-text">what&rsquo;s kept, and what&rsquo;s coming</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-surface p-3">
              <div className="relative flex min-w-max gap-10">
                <div className="absolute left-0 right-0 top-[5px] h-px bg-app-border" />
                {years.map((year) => {
                  const isNow = year === currentYear;
                  const due = dueByYear.get(year);
                  const label = due != null ? "due" : "sealed";
                  const count = due ?? sealedByYear.get(year) ?? 0;
                  return (
                    <div key={year} className="relative min-w-[76px]">
                      <span className={`absolute left-0 top-0 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-2 border-app-surface ${isNow ? "bg-app-accent" : "bg-app-faint"}`} />
                      <div className={`pt-2.5 font-serif text-[15px] font-medium ${isNow ? "text-app-accent" : "text-app-text"}`}>{year}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-app-faint">
                        {count} {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* all capsules */}
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-serif text-[16px] font-medium">All capsules</h3>
          <span className="text-[12px] text-app-faint">{capsules.length} kept</span>
        </div>
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
          {grid.map((c) => {
            const st = statusOf(c);
            const href = st === "draft" ? `/app/capsule/${c.id}/editor` : `/app/capsule/${c.id}`;
            return (
              <Link
                key={c.id}
                href={href}
                className="group block overflow-hidden rounded-lg border border-app-border bg-app-surface transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_20px_40px_rgba(43,38,33,0.12)]"
              >
                <div className="relative aspect-[4/3]" style={{ background: gradientFor(c.id) }}>
                  <div className="sd-grain-static" />
                  <div className="absolute inset-0 flex items-center justify-center font-serif text-2xl font-medium text-white/90">
                    {initialFor(c)}
                  </div>
                  {st !== "draft" && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                      <Icon d={st === "open" ? "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" : "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z"} className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {c.type === "group" && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/35 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                      Group
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <div className="truncate font-serif text-[13px] font-medium leading-tight">{c.title || "Untitled capsule"}</div>
                  <div className="mt-0.5 truncate text-[11px] text-app-faint">{statusLabel(c)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </ScreenFrame>
  );
}
