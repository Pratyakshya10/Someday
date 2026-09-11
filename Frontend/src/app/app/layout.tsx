import type { Metadata } from "next";
import type { ReactNode } from "react";
import { listPendingInvitesForEmail } from "@someday/backend";
import { getCurrentUser } from "@/lib/auth";
import { AppChrome } from "./components/AppChrome";
import type { PendingInviteView } from "./types";

export const metadata: Metadata = {
  title: "Someday · App",
};

// Every request re-checks pending invites for the signed-in user, so the
// sidebar notification shows up as soon as an owner adds them.
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
  return <AppChrome invites={invites}>{children}</AppChrome>;
}
