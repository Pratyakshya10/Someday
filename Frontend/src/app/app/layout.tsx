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
  const invites: PendingInviteView[] = user?.email
    ? (await listPendingInvitesForEmail(user.email)).map((i) => ({
        id: i.id,
        token: i.token,
        role: i.role,
        capsuleTitle: i.capsuleTitle,
      }))
    : [];
  const unlocked: UnseenUnlockedView[] = user
    ? (await listUnseenUnlocked(user.id)).map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        unlockedAt: c.unlockedAt.toISOString(),
      }))
    : [];
  return (
    <AppChrome invites={invites} unlocked={unlocked}>
      {children}
    </AppChrome>
  );
}
