// FinalCta — closing beat. "Someday is a date." over a full-bleed background.
// Rendered inside the last snap frame together with the Footer (see Landing).

import Image from "next/image";

export function FinalCta() {
  return (
    <section
      id="start"
      className="relative flex flex-1 items-center justify-center overflow-hidden px-6 text-center"
    >
      <Image
        src="/landing/last.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover ken-burns"
      />
      <div className="absolute inset-0 bg-canvas/50" />

      <div className="relative z-10">
        <p data-reveal className="text-[11px] tracking-[0.35em] text-ink/75">
          FREE TO SEAL. YOURS TO OPEN.
        </p>
        <h2
          data-reveal
          style={{ transitionDelay: "130ms" }}
          className="mt-6 font-serif text-5xl leading-[0.98] text-ink md:text-8xl"
        >
          Someday <span className="italic">is</span> a date.
        </h2>
        <p
          style={{ animationDelay: "-1.5s" }}
          className="float-slow mt-4 rotate-1 font-script text-2xl text-doodle-2"
        >
          take your time ~
        </p>
        <a
          data-reveal
          style={{ transitionDelay: "280ms" }}
          href="/app/new"
          className="group mt-10 inline-flex items-center gap-3 bg-accent px-8 py-4 text-[11px] tracking-[0.2em] text-ink transition-colors hover:bg-accent-strong"
        >
          START YOUR CAPSULE
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </section>
  );
}
