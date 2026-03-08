import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import AuthFooterButton from "@/components/AuthFooterButton";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="relative z-10">
        <SiteHeader />

        {/* HERO */}
        <section className="relative min-h-screen w-full overflow-hidden bg-black">
          {/* Background Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 z-0 h-full w-full object-cover"
          >
            <source src="/videos/lax-front-page.mp4" type="video/mp4" />
          </video>

          {/* overlays */}
          <div className="absolute inset-0 z-10 bg-black/35" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-transparent to-black/80" />

          {/* content */}
          <div className="relative z-20 flex min-h-screen items-center justify-center px-6 text-center">
            <div className="max-w-5xl">
              <h1 className="text-4xl font-light tracking-[0.02em] sm:text-5xl md:text-6xl lg:text-7xl">
                Train Hard. Recover Harder.
              </h1>
            </div>
          </div>

          {/* fade into next section */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40 bg-gradient-to-b from-transparent to-black" />
        </section>

        {/* SECOND SECTION */}
        <section className="relative bg-black px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-10 w-full max-w-sm">
              <Image
                src="/logo-home.png"
                alt="Lax N Lounge"
                width={1400}
                height={800}
                priority
                className="h-auto w-full"
              />
            </div>

            <h2 className="text-3xl font-light sm:text-4xl md:text-5xl">
              Affordable Recovery Starts Here.
            </h2>


            <h2 className="mt-10 text-white font-light sm:text-3xl md:text-4xl">
  Open 5am - 10pm Daily.
</h2>

            <p className="mt-10 text-sm tracking-wide text-white/75 sm:text-base md:text-lg">
              Infrared Sauna • Ice Bath • Hot Plunge • Normatec Boots
            </p>

            <div className="mt-12 flex flex-col items-center gap-5">
              <a
                href="/members"
                className="min-w-[270px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-base font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:text-lg"
              >
                Members Portal
              </a>

              <a
                href="/book/single"
                className="min-w-[270px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-base font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:text-lg"
              >
                Single Entry
              </a>

              <a
                href="/pricing-and-location"
                className="min-w-[270px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-base font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:text-lg"
              >
                Pricing & Location
              </a>

              <a
                href="/everything-else"
                className="min-w-[270px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-base font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:text-lg"
              >
                Everything Else
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-2 px-6 py-4 text-center text-sm text-white/70">
            <a className="hover:text-white" href="/contact">
              Contact Us
            </a>
            <a className="hover:text-white" href="/privacy">
              Privacy Policy
            </a>
            <a className="hover:text-white" href="/disclaimer">
              Disclaimer
            </a>
            <a className="hover:text-white" href="/terms">
              Terms & Conditions
            </a>
            <a className="hover:text-white" href="/cancellation">
              Cancellation Policy
            </a>
            <a className="hover:text-white" href="/health-waiver">
              Health Waiver
            </a>

            <AuthFooterButton />
          </div>
        </footer>
      </div>
    </main>
  );
}