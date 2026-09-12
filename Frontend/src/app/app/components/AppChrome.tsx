"use client";
// The visual shell shared by every /app page: the themed background, the film
// grain + vignette overlays, and the fixed sidebar. Pages render their own
// <ScreenFrame> for the scrolling content area beside the sidebar.

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PendingInviteView, UnseenUnlockedView } from "../types";
import { ChromeProvider } from "./ChromeContext";
import { Grain } from "./ui";
import { Sidebar } from "./Sidebar";

function Shell({
  children,
  invitesPromise,
  unlockedPromise,
}: {
  children: ReactNode;
  invitesPromise: Promise<PendingInviteView[]>;
  unlockedPromise: Promise<UnseenUnlockedView[]>;
}) {
  const pathname = usePathname();
  // Sign-in is shown before there's a session, so it stands alone — no sidebar.
  const bare = pathname === "/app/signin";
  return (
    <div className={`app-gradient relative font-sans text-app-text ${bare ? "min-h-screen" : "h-screen overflow-hidden"}`}>
      <Grain />
      {!bare && <Sidebar invitesPromise={invitesPromise} unlockedPromise={unlockedPromise} />}
      {children}
    </div>
  );
}

export function AppChrome({
  children,
  invitesPromise,
  unlockedPromise,
}: {
  children: ReactNode;
  invitesPromise: Promise<PendingInviteView[]>;
  unlockedPromise: Promise<UnseenUnlockedView[]>;
}) {
  return (
    <ChromeProvider>
      <Shell invitesPromise={invitesPromise} unlockedPromise={unlockedPromise}>
        {children}
      </Shell>
    </ChromeProvider>
  );
}
