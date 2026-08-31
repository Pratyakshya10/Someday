"use client";
// Catches unexpected errors anywhere under /app and shows a calm recovery
// screen instead of a broken page.

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center p-8 text-center">
      <div className="max-w-[420px]">
        <h1 className="mb-3 font-serif text-3xl font-medium">Something slipped.</h1>
        <p className="mb-6 text-sm text-app-dim">
          A hiccup on our end — your capsules are safe. Try again, or head back to your vault.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-app-accent px-6 py-3 text-[12px] uppercase tracking-[0.16em] text-app-on-accent"
          >
            Try again
          </button>
          <Link href="/app/vault" className="rounded-full border border-app-border px-6 py-3 text-[12px] uppercase tracking-[0.16em] text-app-text">
            Your vault
          </Link>
        </div>
      </div>
    </main>
  );
}
