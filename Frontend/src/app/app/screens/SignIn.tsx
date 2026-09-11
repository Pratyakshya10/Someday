"use client";
import { useActionState, useState } from "react";
import { authAction, signInWithGoogleAction, type AuthState } from "../actions";
import { Kicker } from "../components/ui";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium tracking-[0.02em] text-app-text">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-app-text outline-none transition-colors placeholder:text-app-faint focus:border-app-dim";

export function SignIn({ oauthError }: { oauthError?: string }) {
  const [signup, setSignup] = useState(true);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(authAction, {});

  return (
    <main className="relative z-[2] flex min-h-screen items-center justify-center p-[clamp(16px,4vw,48px)]">
      <div className="w-full max-w-[440px] animate-[sdRise_0.8s_both]">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Kicker>Someday</Kicker>
          </div>
          <h1 className="font-serif text-[clamp(26px,4vw,40px)] font-medium leading-[1.05] tracking-[-0.01em]">
            A letter you <span className="font-square-peg">can&rsquo;t open</span> yet.
          </h1>
          <p className="mx-auto mt-3 max-w-[360px] text-sm leading-[1.6] text-app-dim">
            Write it once. Seal it with your voice, your photographs, a short film. Choose the day it finds you again.
          </p>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-panel p-[clamp(20px,4vw,32px)] shadow-[0_30px_80px_rgba(43,38,33,0.12)] backdrop-blur-xl">
          {oauthError && (
            <p className="mb-4 text-center text-[13px] text-app-accent">
              {oauthError === "google" ? "Google sign-in isn't set up yet." : "That sign-in didn't complete. Try again."}
            </p>
          )}

          <form action={formAction}>
            <input type="hidden" name="mode" value={signup ? "signup" : "login"} />
            <div className="flex flex-col gap-4">
              <Field label="Email">
                <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={inputCls} />
              </Field>
              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>

              {state.error && <p className="text-[13px] text-app-accent">{state.error}</p>}
              {state.notice && <p className="text-[13px] text-app-dim">{state.notice}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-1 w-full rounded-full bg-app-accent px-6 py-3 text-[12px] font-medium uppercase tracking-[0.2em] text-app-on-accent shadow-[0_10px_30px_rgba(43,38,33,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(43,38,33,0.12)] disabled:opacity-60"
              >
                {pending ? "…" : signup ? "Create account" : "Log in"}
              </button>
            </div>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-app-faint">
            <span className="h-px flex-1 bg-app-border" />
            or
            <span className="h-px flex-1 bg-app-border" />
          </div>

          <form action={signInWithGoogleAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-app-border bg-app-surface px-6 py-3 text-[13px] font-medium text-app-text transition-colors hover:bg-app-panel"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.98h5.3c-.23 1.4-1.6 4.1-5.3 4.1-3.19 0-5.8-2.64-5.8-5.9s2.61-5.9 5.8-5.9c1.82 0 3.04.78 3.74 1.45l2.55-2.46C17.13 3.4 14.9 2.4 12.18 2.4 6.98 2.4 2.78 6.6 2.78 11.8s4.2 9.4 9.4 9.4c5.43 0 9.02-3.82 9.02-9.2 0-.62-.07-1.09-.15-1.6Z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-app-dim">
            {signup ? "Already have an account? " : "New here? "}
            <button type="button" onClick={() => setSignup(!signup)} className="text-app-text underline underline-offset-2">
              {signup ? "Log in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
