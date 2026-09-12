import type { Metadata } from "next";
import type { ReactNode } from "react";
import { listPendingInvitesForEmail, listUnseenUnlocked } from "@someday/backend";
import { getCurrentUser } from "@/lib/auth";
import { AppChrome } from "./components/AppChrome";
import type { PendingInviteView, UnseenUnlockedView } from "./types";

export const metadata: Metadata = {
  title: "Someday · App",
};

// Every request re-checks pending invites and freshly-unlocked capsules for
// the signed-in user, so both sidebar notifications show up as soon as
// they're true — an owner adding them, or a capsule's day arriving.
export const dynamic = "force-dynamic";

// Every /app/* page renders inside the themed shell (background + sidebar).
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Deliberately NOT awaited here — these two queries have real latency
  // (each a full DB round trip) and gate nothing about the page itself, so
  // blocking every single navigation on them would make the whole app feel
  // slow for a sidebar badge. Handed down as promises; the notification
  // components unwrap them with use() inside their own <Suspense>, so the
  // page streams in immediately and the bells pop in a beat later.
  const invitesPromise: Promise<PendingInviteView[]> = user?.email
    ? listPendingInvitesForEmail(user.email).then((rows) =>
        rows.map((i) => ({ id: i.id, token: i.token, role: i.role, capsuleTitle: i.capsuleTitle })),
      )
    : Promise.resolve([]);
  const unlockedPromise: Promise<UnseenUnlockedView[]> = user
    ? listUnseenUnlocked(user.id).then((rows) =>
        rows.map((c) => ({ id: c.id, title: c.title, type: c.type, unlockedAt: c.unlockedAt.toISOString() })),
      )
    : Promise.resolve([]);
  return (
    <AppChrome invitesPromise={invitesPromise} unlockedPromise={unlockedPromise}>
      {children}
    </AppChrome>
  );
}
