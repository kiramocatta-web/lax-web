export default function PricingAndLocationPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <section className="px-6 pt-28 pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs tracking-[0.25em] text-white/50 uppercase">
            Pricing & Location
          </p>

          <h1 className="mt-4 text-4xl sm:text-5xl font-light leading-tight">
            Choose the recovery option
            <br />
            that fits you best.
          </h1>

          <p className="mt-6 text-white/70 text-lg">
            Simple pricing. No stress. Just recovery.
          </p>
        </div>
      </section>


      {/* SINGLE BOOKINGS */}
      <section className="px-6 pb-20 text-center">
        <h2 className="text-3xl font-light">
          Single Bookings
        </h2>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* 60 MIN */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm tracking-[0.2em] text-white/50 uppercase">
              60 Minutes
            </p>

            <p className="mt-3 text-3xl font-medium">
              $15
            </p>

            <a
              href="/book/single"
              className="mt-6 inline-block text-sm uppercase tracking-[0.15em] text-white underline underline-offset-4"
            >
              Say less →
            </a>
          </div>


          {/* 90 MIN */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm tracking-[0.2em] text-white/50 uppercase">
              90 Minutes
            </p>

            <p className="mt-3 text-3xl font-medium">
              $20
            </p>

            <a
              href="/book/single"
              className="mt-6 inline-block text-sm uppercase tracking-[0.15em] text-white underline underline-offset-4"
            >
              Say less →
            </a>
          </div>


          {/* 120 MIN */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm tracking-[0.2em] text-white/50 uppercase">
              120 Minutes
            </p>

            <p className="mt-3 text-3xl font-medium">
              $25
            </p>

            <a
              href="/book/single"
              className="mt-6 inline-block text-sm uppercase tracking-[0.15em] text-white underline underline-offset-4"
            >
              Say less →
            </a>
          </div>

        </div>
      </section>


      {/* MEMBERSHIPS */}
      <section className="px-6 pb-24 text-center">
        <h2 className="text-3xl font-light">
          Memberships
        </h2>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">

          {/* 7 DAY PASS */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm tracking-[0.2em] text-white/50 uppercase">
              7-Day Pass
            </p>

            <p className="mt-3 text-3xl font-medium">
              $25
            </p>

            <p className="mt-4 text-white/70">
              Unlimited recovery for 7 days.
            </p>

            <a
              href="/membership"
              className="mt-6 inline-block text-sm uppercase tracking-[0.15em] text-white underline underline-offset-4"
            >
              Sign me up!
            </a>
          </div>


          {/* GENERAL MEMBERSHIP */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm tracking-[0.2em] text-white/50 uppercase">
              General Membership
            </p>

            <p className="mt-3 text-3xl font-medium">
              $20 / week
            </p>

            <p className="mt-4 text-white/70">
              Unlimited recovery access every week.
            </p>

            <a
              href="/membership"
              className="mt-6 inline-block text-sm uppercase tracking-[0.15em] text-white underline underline-offset-4"
            >
              Sign me up!
            </a>
          </div>

        </div>
      </section>


      {/* LOCATION */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-2 items-center">

          <div className="text-center lg:text-left">
            <p className="text-xs tracking-[0.25em] text-white/50 uppercase">
              Location
            </p>

            <h3 className="mt-4 text-3xl font-light">
              Lax N Lounge
            </h3>

            <p className="mt-4 text-white/70 text-lg">
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


          <div className="overflow-hidden rounded-3xl border border-white/10 min-h-[350px]">
            <iframe
              title="Lax N Lounge Map"
              src="https://www.google.com/maps?q=88%20Cook%20Street%20Northgate%20QLD%204013&z=15&output=embed"
              width="100%"
              height="100%"
              className="w-full h-[350px]"
              loading="lazy"
            />
          </div>
          

        </div>
        <footer className="sticky bottom-0 relative z-10 mt-auto border-t border-white/10 bg-black/20 backdrop-blur">
                <div className="max-w-3xl mx-auto px-6 py-4 flex flex-wrap justify-center text-center gap-x-6 gap-y-2 text-sm text-white/70">
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
                </div>
              </footer>
      </section>

    </main>
  );
}