"use client";
// Shared chrome state (just sidebar collapse now) for every /app page.
// It lives in a context so the Sidebar can set it and ScreenFrame can read it
// to leave room for the sidebar. The choice is remembered in localStorage.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ChromeApi } from "../types";

const ChromeContext = createContext<ChromeApi | null>(null);

export function useChrome(): ChromeApi {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used inside <ChromeProvider>");
  return ctx;
}

export function ChromeProvider({ children }: { children: ReactNode }) {
  // Start collapsed=false so the server and first client render agree; the
  // stored choice is applied just after mount.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const kick = setTimeout(() => {
      try {
        setCollapsed(localStorage.getItem("someday.collapsed") === "1");
      } catch {
        // localStorage can throw (private mode); the default is fine.
      }
    }, 0);
    return () => clearTimeout(kick);
  }, []);

  const update: ChromeApi = {
    collapsed,
    setCollapsed: (c) => {
      setCollapsed(c);
      try {
        localStorage.setItem("someday.collapsed", c ? "1" : "0");
      } catch {}
    },
  };

  return <ChromeContext.Provider value={update}>{children}</ChromeContext.Provider>;
}
