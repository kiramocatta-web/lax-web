"use client";

import Image from "next/image";
import { useState } from "react";
import HomePageHeader from "@/components/HomePageHeader";
import AuthFooterButton from "@/components/AuthFooterButton";

export default function HomePage() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback() {
    if (!feedback.trim()) return;

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedback }),
    });

    if (res.ok) {
      setSubmitted(true);
      setFeedback("");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="relative z-10">
        <HomePageHeader />

        {/* HERO */}
        <section className="relative h-[78svh] min-h-[560px] w-full overflow-hidden bg-black sm:h-[88svh] md:h-screen">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover object-center scale-[1.02] sm:scale-100"
          >
            <source src="/videos/lax-front-page.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 z-10 bg-black/40" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-transparent to-black/80" />

          <div className="relative z-20 flex h-full items-center justify-center px-5 pt-16 text-center sm:px-6 sm:pt-20">
            <div className="flex flex-col items-center justify-center gap-1 sm:gap-3">
              <h1 className="hero-line-1 block text-[2.2rem] font-light leading-none tracking-[0.01em] sm:text-5xl md:text-6xl lg:text-7xl">
                Train Hard.
              </h1>

              <h1 className="hero-line-2 block text-[2.5rem] font-bold italic leading-none tracking-[0.01em] sm:text-5xl md:text-6xl lg:text-7xl">
                Recover Harder.
              </h1>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-b from-transparent to-black sm:h-40" />
        </section>

        {/* INTRO */}
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

            <h2 className="mt-8 text-2xl font-light text-white sm:mt-10 sm:text-3xl md:text-4xl">
              Open 5am - 10pm Daily.
            </h2>

            <p className="mt-8 text-sm tracking-wide text-white/75 sm:mt-10 sm:text-base md:text-lg">
              Infrared Sauna • Ice Bath • Hot Magensium Plunge • Normatec Boots
            </p>

            <p className="mt-5 text-sm italic tracking-wide text-white/60 sm:text-base">
              Simply book & walk straight through. This recovery space is
              unstaffed however is monitored.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12 sm:gap-5">

              <a
  href="/pricing-membership-and-packages"
  className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
>
  Prices, Packages & Memberships
</a>

              <a
                href="/members"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Members Booking
              </a>

              <a
                href="/book/single"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Single Entry
              </a>

              <a
                href="/recovery-tools-and-faqs"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Recovery Tools & FAQs
              </a>

              <a
                href="/rush-physio-and-wellness"
                className="w-full max-w-[320px] rounded-full border border-white/30 bg-white/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:min-w-[270px] sm:text-lg"
              >
                Physio & Wellness
              </a>

              {/* PERFORMANCE PARTNERS */}
<div className="mt-20 w-full">
  <h3 className="text-center text-2xl font-light tracking-[0.25em] text-white/80 uppercase">
    Performance Partners
  </h3>

  <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-white/60">
    Businesses I personally trust and confidently recommend to every member of
    the LAX community.
  </p>

  <div className="mt-12 flex flex-wrap items-center justify-center gap-20">

    <a
      href="/rush-physio-and-wellness"
      className="transition duration-300 hover:scale-105 hover:opacity-100 opacity-90"
    >
      <Image
        src="/rushphysiologo.png"
        alt="Rush Physio & Wellness"
        width={360}
        height={180}
        className="h-auto w-auto max-h-32 object-contain"
      />
    </a>
  </div>
</div>
              <div className="mt-2 flex w-full max-w-[320px] gap-3">
                <a
                  href="tel:+61436474768"
                  className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white/85 transition hover:bg-white hover:text-black"
                >
                  Call Us
                </a>

                <a
                  href="sms:+61436474768"
                  className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white/85 transition hover:bg-white hover:text-black"
                >
                  Text Us
                </a>
              </div>

              {/* FEEDBACK */}
              <div className="mt-6 flex w-full flex-col items-center justify-center text-center">
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="text-sm text-neutral-400 underline underline-offset-4 transition hover:text-white"
                >
                  Leave anonymous feedback?
                </button>

                {showFeedback && (
                  <div className="mt-5 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    {!submitted ? (
                      <>
                        <p className="mb-4 text-sm text-neutral-300">
                          We take on board anything you say, and appreciate your
                          time. 
                        </p>

                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Your feedback..."
                          className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none placeholder:text-neutral-500"
                        />

                        <button
                          onClick={submitFeedback}
                          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 py-3 font-medium text-white transition hover:bg-white/20"
                        >
                          Submit Feedback
                        </button>
                      </>
                    ) : (
                      <p className="py-8 text-sm text-white/80">
                        Thank you! We genuinely appreciate your feedback.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* LOCATION */}
        <section id="location"></section>
        <section className="px-6 pb-28">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Location
              </p>

              <h3 className="mt-4 text-3xl font-light">Lax N Lounge</h3>

              <p className="mt-4 text-lg text-white/70">
                88 Cook Street
                <br />
                Northgate QLD 4013
                <br />
                Australia
              </p>

              <a
                href="https://maps.google.com/?q=88+Cook+Street+Northgate+QLD+4013"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full border border-white/20 px-6 py-3 text-sm uppercase tracking-[0.12em] transition hover:bg-white hover:text-black"
              >
                Open in Maps
              </a>
            </div>

            <div className="min-h-[350px] overflow-hidden rounded-3xl border border-white/10">
              <iframe
                title="Lax N Lounge Map"
                src="https://www.google.com/maps?q=88%20Cook%20Street%20Northgate%20QLD%204013&z=15&output=embed"
                width="100%"
                height="100%"
                className="h-[350px] w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* VISION + OWNER */}
        <section id="owners-vision"></section>
        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-light sm:text-4xl">
              The Vision of Lax
            </h2>

            <div className="mx-auto mt-5 max-w-4xl space-y-5 text-center text-sm leading-7 text-white/75 sm:text-base">
              <p className="text-xl leading-8 text-white sm:text-2xl">
                LAX exists to redefine what it means to support an athlete & the
                everyday.
              </p>

              <p>
                This is not just a recovery space, it's a community where
                athletes & the everyday train with purpose, recover with intent,
                and build toward something greater than themselves.
              </p>
            </div>

            <section className="mt-20">
              <h2 className="text-center text-3xl font-light">Owner</h2>

              <p className="mt-2 text-center text-sm tracking-wide text-white/50">
                Built by an athlete, for athletes.
              </p>

              <div className="mt-8 grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
                <div className="relative min-h-[520px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 md:h-full">
                  <Image
                    src="/Owner_of_lax.PNG"
                    alt="Owner of Lax"
                    fill
                    className="object-cover object-center"
                  />
                </div>

                <div className="flex items-center">
                  <div>
                    <p className="text-base uppercase tracking-[0.3em] text-white/45 sm:text-lg">
                      My Story
                    </p>

                    <div className="mt-5 space-y-4 text-sm leading-7 text-white/75 sm:text-base">
                      <p>
                        I was a semi-pro athlete with everything in ahead of me
                        — until a drunk driver broke my spine in three places.
                      </p>

                      <p>
                        For a long time, I let that moment define me. I wore it
                        as my story. My excuse. My reason for losing direction.
                      </p>

                      <p>I became a victim of what happened to me.</p>

                      <p>
                        Until one day, I decided I wasn’t going to live like
                        that anymore.
                      </p>

                      <p>
                        LAX was created from that turning point — built to
                        inspire, to motivate, and to create a community that
                        reminds people of one thing:
                      </p>

                      <p className="text-lg leading-8 text-white sm:text-xl">
                        It’s never too late.
                        <br />
                        What’s happened to you doesn’t define you — only you do.
                      </p>

                      <p>
                        This is the new era of LAX.
                        <br />
                        And it’s only the beginning.
                      </p>

                      <p className="font-semibold italic leading-8 text-white sm:text-xl">
                        “With man this is impossible, but with God all things
                        are possible.”
                        <br />
                        — Matthew 19:26 ✞
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
            <a className="hover:text-white" href="/everything-else">
              Vision &amp; Story
            </a>

            <AuthFooterButton />
          </div>
        </footer>
      </div>
    </main>
  );
}