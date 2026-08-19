// Nav — fixed, transparent site header over the hero.

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-canvas via-canvas/80 to-transparent backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <a href="#hero" className="font-serif text-2xl italic text-ink">
          Someday
        </a>
        <nav className="flex items-center gap-6 text-[11px] tracking-[0.2em] text-ink/70 md:gap-8">
          <a href="#how-it-works" className="hidden transition-colors hover:text-ink sm:inline">
            HOW IT WORKS
          </a>
          <a href="#examples" className="hidden transition-colors hover:text-ink sm:inline">
            PINBOARD
          </a>
          <a href="#together" className="hidden transition-colors hover:text-ink sm:inline">
            TOGETHER
          </a>
          <a
            href="/capsule/new"
            className="border border-ink/40 px-5 py-2.5 text-ink transition-colors hover:bg-ink hover:text-canvas"
          >
            GET STARTED
          </a>
        </nav>
      </div>
    </header>
  );
}
