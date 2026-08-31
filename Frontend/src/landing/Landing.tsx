// Landing — composes every section in top-to-bottom order.
// Each section is a full-height scroll-snap frame; the final CTA and the
// footer share the last frame.

import { ScrollReveal } from "./ScrollReveal";
import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { WhatItIs } from "./sections/WhatItIs";
import { Examples } from "./sections/Examples";
import { Together } from "./sections/Together";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";

export function Landing() {
  return (
    <>
      <ScrollReveal />
      <Nav />
      <main>
        <Hero />
        <WhatItIs />
        <Examples />
        <Together />
      </main>
      <div className="flex min-h-screen frame-fade snap-start flex-col">
        <FinalCta />
        <Footer />
      </div>
    </>
  );
}
