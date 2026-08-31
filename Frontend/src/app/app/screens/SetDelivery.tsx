"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDeliveryAction, setLocationAction, setMilestoneAction } from "../actions";
import type { CapsuleView, UnlockType } from "../types";
import { Kicker, PrimaryButton, Countdown, ScreenFrame } from "../components/ui";
import { Calendar } from "../components/Calendar";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const RADII = [
  { m: 100, l: "100 m" },
  { m: 500, l: "500 m" },
  { m: 1000, l: "1 km" },
  { m: 5000, l: "5 km" },
];

const MILESTONE_EXAMPLES = ["When I graduate", "On my wedding day", "When I hit 30", "When the baby arrives"];

export function SetDelivery({ capsule }: { capsule: CapsuleView }) {
  const router = useRouter();
  const [ut, setUt] = useState<UnlockType>(capsule.unlockType ?? "date");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Date ──────────────────────────────────────────────
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoDay(d);
  }, []);
  const defaultDate = useMemo(() => {
    if (capsule.unlockDate) return isoDay(new Date(capsule.unlockDate));
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return isoDay(d);
  }, [capsule.unlockDate]);
  const [date, setDate] = useState(defaultDate);

  const [days, setDays] = useState(0);
  useEffect(() => {
    const compute = () => {
      const ms = new Date(`${date}T00:00:00`).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24))));
    };
    const kick = setTimeout(compute, 0);
    return () => clearTimeout(kick);
  }, [date]);

  const pretty = useMemo(
    () => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    [date],
  );

  // ── Location ──────────────────────────────────────────
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(
    capsule.unlockLat != null && capsule.unlockLng != null
      ? { lat: capsule.unlockLat, lng: capsule.unlockLng, acc: 0 }
      : null,
  );
  const [radiusM, setRadiusM] = useState(capsule.unlockRadiusM ?? 500);
  const [placeLabel, setPlaceLabel] = useState(capsule.unlockPlaceLabel ?? "");
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This device can't share a location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Allow location access and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Milestone ─────────────────────────────────────────
  const [milestone, setMilestone] = useState(capsule.unlockMilestone ?? "");

  // ── Seal ──────────────────────────────────────────────
  const radiusLabel = RADII.find((r) => r.m === radiusM)?.l ?? `${radiusM} m`;

  const seal = () =>
    startTransition(async () => {
      setError(null);
      let res: { ok: boolean };
      if (ut === "date") {
        res = await setDeliveryAction(capsule.id, date);
        if (!res.ok) return setError("Couldn't save that date. Pick a future day and try again.");
      } else if (ut === "location") {
        if (!coords) return setError("Set a place first — use your current location.");
        res = await setLocationAction(capsule.id, { lat: coords.lat, lng: coords.lng, radiusM, label: placeLabel });
        if (!res.ok) return setError("Couldn't save that place. Try again.");
      } else {
        if (!milestone.trim()) return setError("Describe the milestone to wait for.");
        res = await setMilestoneAction(capsule.id, milestone);
        if (!res.ok) return setError("Couldn't save that milestone. Try again.");
      }
      router.push(`/app/capsule/${capsule.id}/seal`);
    });

  const canSeal = ut === "date" ? true : ut === "location" ? !!coords : milestone.trim().length > 0;

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[960px] animate-[sdRise_0.8s_both]">
        <Kicker>Set delivery</Kicker>
        <h1 className="mb-2 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-none tracking-[-0.01em]">
          How should it <span className="italic">find you?</span>
        </h1>
        <p className="mb-5 max-w-[520px] text-sm text-app-dim">
          Choose what unlocks this letter — a date, a place you return to, or a moment in your life.
        </p>

        {/* unlock-type pills */}
        <div className="mb-6 inline-flex gap-1 rounded-[10px] border border-app-border bg-app-surface p-1">
          {(["date", "location", "milestone"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setUt(v); setError(null); }}
              className={`rounded-[7px] px-[22px] py-2.5 text-sm capitalize tracking-[0.03em] transition-all duration-200 ${
                ut === v ? "bg-app-accent text-app-on-accent" : "bg-transparent text-app-dim"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-11">
          {/* left — the picker */}
          {ut === "date" ? (
            <div>
              <Calendar value={date} min={tomorrow} onChange={setDate} label="Delivered on" />
              <p className="mt-3 max-w-[360px] text-center font-script text-xl text-app-dim">→ {pretty}</p>
            </div>
          ) : ut === "location" ? (
            <div className="w-full max-w-[380px] rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
              <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-app-faint">Unlock at a place</div>
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-app-border bg-app-surface px-4 py-2.5 text-sm text-app-text transition-colors hover:bg-black/[0.04] disabled:opacity-60"
              >
                {locating ? "Locating…" : coords ? "Update to my current location" : "Use my current location"}
              </button>

              {coords && (
                <div className="mb-4 rounded-lg border border-app-border bg-app-surface p-3 text-[13px] text-app-dim">
                  Pinned at <span className="text-app-text">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
                  {coords.acc > 0 && <> · ±{coords.acc} m</>}
                </div>
              )}

              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-app-faint">Unlock radius</div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {RADII.map((r) => (
                  <button
                    key={r.m}
                    onClick={() => setRadiusM(r.m)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      radiusM === r.m ? "border-app-accent bg-app-accent-dim text-app-text" : "border-app-border text-app-dim"
                    }`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>

              <input
                value={placeLabel}
                onChange={(e) => setPlaceLabel(e.target.value)}
                placeholder="Name this place (optional) — e.g. our old street"
                className="w-full rounded-md border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-app-text outline-none placeholder:text-app-faint"
              />
            </div>
          ) : (
            <div className="w-full max-w-[380px] rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
              <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-app-faint">Unlock at a milestone</div>
              <textarea
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                rows={3}
                placeholder="What are you waiting for?"
                className="w-full resize-none rounded-md border border-app-border bg-app-surface px-3.5 py-2.5 font-serif text-lg text-app-text outline-none placeholder:text-app-faint"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {MILESTONE_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setMilestone(ex)}
                    className="rounded-full border border-app-border px-3 py-1.5 text-xs text-app-dim transition-colors hover:text-app-text"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* right — summary + seal */}
          <div className="flex-1 basis-[300px]">
            {ut === "date" ? (
              <>
                <div className="mb-3.5 text-[11px] uppercase tracking-[0.2em] text-app-faint">It will open in</div>
                <Countdown days={days} />
              </>
            ) : (
              <>
                <div className="mb-2.5 text-[11px] uppercase tracking-[0.2em] text-app-faint">It will open when</div>
                <p className="max-w-[300px] font-serif text-[22px] leading-[1.35]">
                  {ut === "location"
                    ? <>you&rsquo;re within {radiusLabel} of {placeLabel.trim() ? <span className="italic">{placeLabel.trim()}</span> : "this spot"}.</>
                    : milestone.trim()
                      ? <span className="italic">{milestone.trim()}.</span>
                      : "the moment you choose."}
                </p>
              </>
            )}

            {error && <p className="mt-4 text-sm text-app-accent">{error}</p>}

            <PrimaryButton
              onClick={seal}
              className={`mt-5 ${pending || !canSeal ? "pointer-events-none opacity-60" : ""}`}
            >
              {pending ? "Saving…" : "Seal it"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
