import Image from "next/image";
import HomePageHeader from "@/components/HomePageHeader";
import AuthFooterButton from "@/components/AuthFooterButton";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="relative z-10">
        <HomePageHeader />

        {/* HERO */}
        <section className="relative h-[78svh] min-h-[560px] w-full overflow-hidden bg-black sm:h-[88svh] md:h-screen">
          {/* Background Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover object-center scale-[1.02] sm:scale-100"
          >
            <source src="/videos/lax-front-page.mp4" type="video/mp4" />
          </video>

          {/* overlays */}
          <div className="absolute inset-0 z-10 bg-black/40" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-transparent to-black/80" />

          {/* content */}
          <div className="relative z-20 flex h-full items-center justify-center px-5 pt-16 text-center sm:px-6 sm:pt-20">
            <div className="flex flex-col items-center justify-center gap-1 sm:gap-3">
              <h1 className="hero-line-1 block text-[2.2rem] font-light leading-none tracking-[0.01em] sm:text-5xl md:text-6xl lg:text-7xl">
                Train Hard
              </h1>

              <h1 className="hero-line-2 block text-[2.5rem] font-bold italic leading-none tracking-[0.01em] sm:text-5xl md:text-6xl lg:text-7xl">
                Recover Harder.
              </h1>
            </div>
          </div>

          {/* fade into next section */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-b from-transparent to-black sm:h-40" />
        </section>

        {/* SECOND SECTION */}
        <section className="relative bg-black px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-8 w-full max-w-[260px] sm:mb-10 sm:max-w-sm">
              <Image
                src="/logo-home.png"
                alt="Lax N Lounge"
                width={1400}
                height={800}
                priority
                className="h-auto w-full"
              />
            </div>

            <h2 className="text-2xl font-light sm:text-4xl md:text-5xl">
              Affordable Recovery Starts Here.
            </h2>

            <h2 className="mt-8 text-white font-light text-2xl sm:mt-10 sm:text-3xl md:text-4xl">
              Open 5am - 10pm Daily.
            </h2>

            <p className="mt-8 text-sm tracking-wide text-white/75 sm:mt-10 sm:text-base md:text-lg">
              Infrared Sauna • Ice Bath • Hot Plunge • Normatec Boots
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12 sm:gap-5">
              <a
                href="/members"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Members Portal
              </a>

              <a
                href="/book/single"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Single Entry
              </a>

              <a
                href="/pricing-and-location"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Pricing & Location
              </a>

              <a
                href="/everything-else"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
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