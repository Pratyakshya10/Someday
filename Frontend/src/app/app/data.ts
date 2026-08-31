// Static data + icon paths for the Someday app.
import type { TemplateKey } from "./types";

export const ICONS: Record<string, string> = {
  auth: "M12 3a4 4 0 0 0-4 4v3H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V7a4 4 0 0 0-4-4Zm-2 7V7a2 2 0 1 1 4 0v3Z",
  new: "M12 5v14M5 12h14",
  editor: "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z",
  delivery: "M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  sealing: "M12 2a5 5 0 0 1 5 5c0 2.5-2 4.2-3 5l1 8-3-2-3 2 1-8c-1-.8-3-2.5-3-5a5 5 0 0 1 5-5Z",
  vault: "M4 5h16v14H4zM4 9h16M9 13h6",
  reveal: "M12 3l2.2 5.6L20 10l-5.8 1.4L12 17l-2.2-5.6L4 10l5.8-1.4Z",
  voice: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v4",
  photos: "M4 5h16v14H4zM4 16l4-4 4 4 3-3 5 5",
  film: "M4 6h12v12H4zM16 10l4-2v8l-4-2",
  google:
    "M21.35 11.1h-9.17v2.98h5.3c-.23 1.4-1.6 4.1-5.3 4.1-3.19 0-5.8-2.64-5.8-5.9s2.61-5.9 5.8-5.9c1.82 0 3.04.78 3.74 1.45l2.55-2.46C17.13 3.4 14.9 2.4 12.18 2.4 6.98 2.4 2.78 6.6 2.78 11.8s4.2 9.4 9.4 9.4c5.43 0 9.02-3.82 9.02-9.2 0-.62-.07-1.09-.15-1.6Z",
};

// The real sidebar navigation — each entry is a route.
export const NAV: { href: string; label: string; icon: string }[] = [
  { href: "/app/vault", label: "Your vault", icon: ICONS.vault },
  { href: "/app/new", label: "New capsule", icon: ICONS.new },
];

// The three cover shapes a vault card can wear (chosen deterministically per id).
export type CapsuleShape = "envelope" | "box" | "reel";

export const TEMPLATES: { key: TemplateKey; label: string; hint: string }[] = [
  { key: "future", label: "To future me", hint: "a note across the years" },
  { key: "miss", label: "To someone I miss", hint: "the letter you never sent" },
  { key: "predict", label: "A prediction", hint: "guess where life goes" },
  { key: "confess", label: "A confession", hint: "say the quiet thing" },
  { key: "blank", label: "Blank", hint: "start from nothing" },
];

// The default "To —" line each template starts with (the writer can change it).
export const DEFAULT_RECIPIENT: Record<TemplateKey, string> = {
  future: "Future Me",
  miss: "Someone I Miss",
  predict: "Future Me",
  confess: "Future Me",
  blank: "",
};

export const PROMPTS: Record<TemplateKey, string> = {
  future: "Dear future me, by the time you read this…",
  miss: "There is something I keep meaning to tell you…",
  predict: "A year from now, I think my life will look like…",
  confess: "I have never said this out loud, but…",
  blank: "",
};
