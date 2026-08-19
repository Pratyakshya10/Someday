// Examples — "Waiting to be opened." A row of staggered sealed-capsule cards.
// IMAGE SLOT: each card's poster image.

import Image from "next/image";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
    </svg>
  );
}

const capsules = [
  { no: "01", title: "Days in\nmy life", sub: "a year, folded into one letter", opens: "OPENS 01 JAN 2027", img: "/landing/daysinmylife.jpeg" },
  { no: "02", title: "Waiting", sub: "the art of trusting time", opens: "OPENS ON YOUR 30TH", img: "/landing/waiting.jpeg" },
  { no: "03", title: "One\nworld", sub: "notes from the road", opens: "OPENS 12 AUG 2030", img: "/landing/oneworld.jpeg" },
  { no: "04", title: "To be a star,\nyou must burn", sub: "for someone not yet born", opens: "OPENS · SOMEDAY", img: "/landing/fornotborn.jpeg" },
];

export function Examples() {
  return (
    <section
      id="examples"
      className="flex min-h-screen frame-fade snap-start items-center bg-canvas px-6 pb-14 pt-28 md:px-10"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div data-reveal className="flex items-center gap-4">
          <span className="h-px w-10 bg-accent" />
          <p className="text-[11px] tracking-[0.35em] text-ink/65">
            A FEW SEALED CAPSULES
          </p>
        </div>
        <div
          data-reveal
          className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end"
        >
          <h2 className="font-serif text-4xl leading-tight text-ink md:text-6xl">
            Waiting to be <span className="italic">opened.</span>
          </h2>
          <div className="max-w-sm">
            <p className="text-sm text-ink/75">
              Each one stays locked until the date its author chose. This is all
              you see until then.
            </p>
            <p className="mt-2 -rotate-1 font-script text-lg text-doodle">
              no peeking till it&rsquo;s time ✦
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {capsules.map((c, i) => (
            <article
              key={c.no}
              data-reveal
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`group relative flex h-[46vh] flex-col justify-between overflow-hidden border border-ink/10 p-4 lg:h-[52vh] ${
                i % 2 === 1 ? "lg:mt-8" : ""
              }`}
            >
              <Image
                src={c.img}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-canvas/30 transition-colors duration-500 group-hover:bg-canvas/10" />

              <div className="relative flex items-start justify-between">
                <span className="text-[10px] tracking-[0.2em] text-ink/80">
                  ARCHIVE NO. {c.no}
                </span>
                <span className="flex items-center gap-1.5 rounded border border-glass-border bg-glass backdrop-blur-sm px-2 py-1 text-[9px] tracking-[0.2em] text-ink/90">
                  <LockIcon />
                  SEALED
                </span>
              </div>

              <div className="relative">
                <h3 className="whitespace-pre-line font-serif text-2xl leading-tight text-ink">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-xs text-ink/75">{c.sub}</p>
                <p className="mt-2 text-[11px] tracking-[0.15em] text-accent">
                  {c.opens}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
