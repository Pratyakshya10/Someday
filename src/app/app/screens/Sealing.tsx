"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sealAction } from "../actions";
import type { CapsuleView } from "../types";
import { Doodle, PrimaryButton, ScreenFrame } from "../components/ui";

export function Sealing({ capsule }: { capsule: CapsuleView }) {
  const [stage, setStage] = useState(0); // 0 idle · 1 pressing · 2 closing · 3 done
  const [sealed, setSealed] = useState<boolean | null>(null); // action result
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const prettyDate = capsule.unlockDate
    ? new Date(capsule.unlockDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  // The line shown once it's sealed, tuned to how it unlocks.
  const sealedLine =
    capsule.unlockType === "location"
      ? `It'll open when you return to\n${capsule.unlockPlaceLabel?.trim() || "that place"}.`
      : capsule.unlockType === "milestone"
        ? `It'll open when —\n${capsule.unlockMilestone?.trim() || "the moment comes"}.`
        : prettyDate
          ? `It'll find you on\n${prettyDate}.`
          : "It's sealed and waiting.";

  const start = () => {
    if (stage !== 0) return;
    setStage(1);
    // Persist the seal while the wax animation plays.
    sealAction(capsule.id).then((r) => setSealed(r.ok));
    timers.current.push(setTimeout(() => setStage(2), 1400));
    timers.current.push(setTimeout(() => setStage(3), 2900));
  };

  return (
    <ScreenFrame>
      <div className="flex min-h-[calc(100vh-8vw)] flex-col items-center justify-center text-center">
        {/* stage: letter + wax seal */}
        <div className="relative mb-6 flex h-[220px] w-[220px] items-center justify-center">
          <div
            className="absolute h-[112px] w-[172px] rounded-lg border border-app-border bg-app-surface shadow-[0_24px_60px_rgba(43,38,33,0.12)] transition-all duration-[1200ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{
              opacity: stage >= 2 ? 0.25 : 1,
              transform: stage >= 2 ? "scale(0.82) translateY(10px)" : "none",
              filter: stage >= 2 ? "blur(3px)" : "none",
            }}
          >
            <div className="p-5 text-left font-serif text-[15px] leading-[1.5] text-app-dim">
              {capsule.recipient ? `To — ${capsule.recipient}` : "Your letter"}
              <br />
              {capsule.title || "sealed and waiting"}
            </div>
          </div>

          <button
            onClick={stage === 0 ? start : undefined}
            className={`relative z-[2] flex items-center justify-center rounded-full transition-all duration-[1300ms] ease-[cubic-bezier(.5,0,.1,1)] ${
              stage === 0 ? "cursor-pointer" : "cursor-default"
            }`}
            style={{
              width: stage >= 1 ? 84 : 94,
              height: stage >= 1 ? 84 : 94,
              background: "radial-gradient(circle at 38% 28%, #4c463e, #2b2621 60%, #16120e)",
              transform: stage >= 1 ? "scale(1) translateY(60px)" : "scale(1.15) translateY(-30px)",
              boxShadow: stage >= 1
                ? "0 10px 30px rgba(43,38,33,0.14), inset 0 3px 10px rgba(255,255,255,0.25)"
                : "0 30px 60px rgba(43,38,33,0.12)",
            }}
          >
            <span className="font-serif text-[26px] italic text-[#f3ecdf] [text-shadow:0_1px_1px_rgba(255,255,255,0.3)]">S</span>
          </button>
        </div>

        {/* caption */}
        {stage < 3 ? (
          <div className="animate-[sdFadeIn_0.6s_both]">
            <h1 className="mb-3 font-serif text-[clamp(24px,3vw,40px)] font-medium">
              {stage === 0 ? "Ready to seal?" : "Sealing…"}
            </h1>
            <p className="mx-auto mb-5 max-w-[400px] text-sm leading-[1.6] text-app-dim">
              {stage === 0
                ? "Once sealed, you won't be able to read or change it until the day arrives."
                : "Pressing the wax. Closing the capsule."}
            </p>
            {stage === 0 ? (
              <PrimaryButton onClick={start}>Press the seal</PrimaryButton>
            ) : (
              <div className="mx-auto h-[34px] w-[34px] animate-[sdSpin_0.9s_linear_infinite] rounded-full border-2 border-app-border border-t-app-accent" />
            )}
          </div>
        ) : sealed === false ? (
          <div className="animate-[sdRise_1s_both]">
            <h1 className="mb-3 font-serif text-[clamp(22px,3vw,38px)] font-medium">Something went wrong.</h1>
            <p className="mx-auto mb-5 max-w-[420px] text-sm text-app-dim">
              We couldn&rsquo;t seal this capsule — it may need a delivery date first.
            </p>
            <Link href={`/app/capsule/${capsule.id}/delivery`}>
              <PrimaryButton>Back to delivery</PrimaryButton>
            </Link>
          </div>
        ) : (
          <div className="animate-[sdRise_1s_both]">
            <Doodle className="mb-2 block !text-[22px]">sealed.</Doodle>
            <h1 className="mb-4 whitespace-pre-line font-serif text-[clamp(26px,3.4vw,44px)] font-medium italic leading-[1.05]">
              {sealedLine}
            </h1>
            <p className="mx-auto mb-6 max-w-[400px] text-sm text-app-dim">
              We&rsquo;ll keep it safe in your vault until then.
            </p>
            <Link href="/app/vault">
              <PrimaryButton>Go to your vault</PrimaryButton>
            </Link>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
