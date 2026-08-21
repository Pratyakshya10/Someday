"use client";
import { useState } from "react";
import type { AppApi } from "../types";
import { ICONS } from "../data";
import { Kicker, Doodle, PrimaryButton, Photo, ScreenFrame } from "../components/ui";

export function SignIn({ app }: { app: AppApi }) {
  const [signup, setSignup] = useState(true);

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto grid min-h-[calc(100vh-10vw)] max-w-[1180px] items-center gap-[clamp(30px,5vw,80px)] md:grid-cols-[1.05fr_0.95fr]">
        {/* left — the form */}
        <div className="animate-[sdRise_0.9s_both]">
          <Kicker>Someday · your capsules</Kicker>
          <h1 className="mb-[22px] font-serif text-[clamp(40px,5.6vw,78px)] font-medium leading-[0.98] tracking-[-0.01em]">
            A letter you <span className="italic">can&rsquo;t open</span> yet.
          </h1>
          <p className="mb-[34px] max-w-[400px] text-base leading-[1.65] text-app-dim">
            Write it once. Seal it with your voice, your photographs, a short film. Choose the day it finds you again.
          </p>

          <div className="flex max-w-[400px] flex-col gap-3.5">
            <button className="flex items-center justify-center gap-3 rounded border border-app-border bg-app-surface px-4 py-3.5 text-sm text-app-text">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
                <path fill="#e0e0e0" d={ICONS.google} />
              </svg>
              Continue with Google
            </button>

            <div className="my-0.5 flex items-center gap-3.5 text-xs text-app-faint">
              <span className="h-px flex-1 bg-app-border" />
              or
              <span className="h-px flex-1 bg-app-border" />
            </div>

            <input placeholder="you@email.com" className="rounded border border-app-border bg-app-surface px-4 py-3.5 text-[15px] text-app-text outline-none" />
            <input type="password" placeholder="Password" className="rounded border border-app-border bg-app-surface px-4 py-3.5 text-[15px] text-app-text outline-none" />

            <PrimaryButton onClick={() => app.go("new")} className="mt-1 w-full justify-center">
              {signup ? "Create account" : "Log in"}
            </PrimaryButton>

            <div className="mt-1.5 text-center text-sm text-app-dim">
              {signup ? "Already have an account? " : "New here? "}
              <button onClick={() => setSignup(!signup)} className="text-app-accent underline">
                {signup ? "Log in" : "Sign up"}
              </button>
            </div>
          </div>
        </div>

        {/* right — image panel */}
        <div className="relative h-[min(76vh,640px)] overflow-hidden rounded-md border border-app-border shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 animate-[sdZoom_24s_ease-in-out_infinite_alternate]">
            <Photo tint="#4a3a44" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/60" />
          <Doodle className="absolute bottom-[26px] left-[26px] -rotate-[4deg] whitespace-pre-line !text-[#f0e6d8]">
            {"open me on\na day that matters ↓"}
          </Doodle>
        </div>
      </div>
    </ScreenFrame>
  );
}
