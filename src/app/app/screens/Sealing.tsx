"use client";
import { useEffect, useRef, useState } from "react";
import type { AppApi } from "../types";
import { Doodle, PrimaryButton, ScreenFrame } from "../components/ui";

export function Sealing({ app }: { app: AppApi }) {
  const [stage, setStage] = useState(0); // 0 idle · 1 pressing · 2 closing · 3 done
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (stage !== 0) return;
    setStage(1);
    timers.current.push(setTimeout(() => setStage(2), 1400));
    timers.current.push(setTimeout(() => setStage(3), 2900));
  };

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="flex min-h-[calc(100vh-10vw)] flex-col items-center justify-center text-center">
        {/* stage: letter + wax seal */}
        <div className="relative mb-10 flex h-[300px] w-[300px] items-center justify-center">
          <div
            className="absolute h-[150px] w-[230px] rounded-lg border border-app-border bg-app-surface shadow-[0_24px_60px_rgba(0,0,0,0.5)] transition-all duration-[1200ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{
              opacity: stage >= 2 ? 0.25 : 1,
              transform: stage >= 2 ? "scale(0.82) translateY(10px)" : "none",
              filter: stage >= 2 ? "blur(3px)" : "none",
            }}
          >
            <div className="p-5 text-left font-serif text-[15px] leading-[1.5] text-app-dim">
              Dear future me,
              <br />
              by the time you read this…
            </div>
          </div>

          <button
            onClick={stage === 0 ? start : undefined}
            className={`relative z-[2] flex items-center justify-center rounded-full transition-all duration-[1300ms] ease-[cubic-bezier(.5,0,.1,1)] ${
              stage === 0 ? "cursor-pointer" : "cursor-default"
            }`}
            style={{
              width: stage >= 1 ? 108 : 120,
              height: stage >= 1 ? 108 : 120,
              background: "radial-gradient(circle at 38% 32%, #e05a4f, var(--color-app-accent) 60%, #7a1f1f)",
              transform: stage >= 1 ? "scale(1) translateY(60px)" : "scale(1.15) translateY(-30px)",
              boxShadow: stage >= 1
                ? "0 10px 30px rgba(0,0,0,0.55), inset 0 3px 10px rgba(255,255,255,0.25)"
                : "0 30px 60px rgba(0,0,0,0.5)",
            }}
          >
            <span className="font-serif text-[34px] italic text-[#f6e2d8] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">S</span>
          </button>
        </div>

        {/* caption */}
        {stage < 3 ? (
          <div className="animate-[sdFadeIn_0.6s_both]">
            <h1 className="mb-3.5 font-serif text-[clamp(32px,4.6vw,60px)] font-medium">
              {stage === 0 ? "Ready to seal?" : "Sealing…"}
            </h1>
            <p className="mx-auto mb-[26px] max-w-[420px] text-base leading-[1.6] text-app-dim">
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
        ) : (
          <div className="animate-[sdRise_1s_both]">
            <Doodle className="mb-2 block !text-[28px]">sealed.</Doodle>
            <h1 className="mb-[18px] whitespace-pre-line font-serif text-[clamp(34px,5vw,64px)] font-medium italic leading-[1.05]">
              {"It'll find you on\nJanuary 1, 2027."}
            </h1>
            <p className="mx-auto mb-[30px] max-w-[400px] text-base text-app-dim">
              We'll keep it safe in your vault until then.
            </p>
            <PrimaryButton onClick={() => app.go("vault")}>Go to your vault</PrimaryButton>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
