import Image from "next/image";
import Link from "next/link";

export default function RushPhysioPage() {
  return (
    <main className="min-h-screen bg-[#211711] text-[#f4eadf]">
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        {/* LOGO */}
        <div className="mb-10 flex justify-center">
          <Image
            src="/rushphysiologo.png"
            alt="Rush Physio"
            width={220}
            height={100}
            className="h-auto w-52 md:w-60"
            priority
          />
        </div>

        {/* HERO */}
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1fr]">
          {/* HEADSHOT */}
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-[#d8b98f]/30 bg-[#2b1d16] p-3 shadow-2xl">
            <Image
              src="/rushlee.png"
              alt="Rush Physio"
              width={700}
              height={900}
              className="h-auto w-full rounded-[1.5rem] object-cover"
              priority
            />
          </div>

          <div className="text-center md:text-left">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#c9a985]">
              Local Northgate Physiotherapy
            </p>

            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Rush Physio
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#e7d8c8]">
              Professional physiotherapy, wellness massage, injury management,
              and movement support just minutes from LAX.
            </p>

            {/* LOCATION */}
            <div className="mt-6 rounded-2xl border border-[#d8b98f]/30 bg-[#3a281e] p-5">
              <p className="text-xl font-bold text-[#fff2df]">
                Not located at LAX.
              </p>

              <p className="mt-2 text-[#e7d8c8]">
                Located inside <strong>MONT HEALTH</strong>
              </p>

              <p className="mt-1 text-[#d9c8b8]">
                1/62 Crockford Street, Northgate
              </p>
            </div>

            {/* LAX OFFER */}
            <div className="mt-4 rounded-2xl border border-[#d8b98f]/30 bg-[#2b1d16] p-5">
              <p className="text-lg font-semibold text-[#fff2df]">
                Exclusive LAX Offer
              </p>

              <p className="mt-2 text-[#e3d2c1]">
                Mention <span className="font-bold text-white">LAX10</span>{" "}
                during your appointment or leave it in the booking notes to
                receive{" "}
                <span className="font-bold text-white">
                  $10 off your first treatment.
                </span>
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="https://rush-physio.au4.cliniko.com/bookings#service"
                target="_blank"
                className="rounded-full bg-[#f4eadf] px-7 py-3 text-center font-semibold text-[#211711] transition hover:opacity-90"
              >
                Book now
              </Link>

              <Link
                href="https://rushphysio.com.au/services/"
                target="_blank"
                className="rounded-full border border-[#f4eadf]/40 px-7 py-3 text-center font-semibold text-[#f4eadf] transition hover:bg-[#f4eadf]/10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <section className="mt-16">
          <div className="mb-7 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-[#c9a985]">
              Services & Pricing
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-[#2b1d16] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[#c9a985]">
                Standard Physio
              </p>

              <h2 className="mt-2 text-3xl font-semibold">$94</h2>

              <p className="mt-3 text-[#d9c8b8]">
                30 minute physiotherapy consultation & treatment.
              </p>
            </div>

            <div className="rounded-2xl bg-[#2b1d16] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[#c9a985]">
                Long Consultation
              </p>

              <h2 className="mt-2 text-3xl font-semibold">$129</h2>

              <p className="mt-3 text-[#d9c8b8]">
                60 minute extended physiotherapy consultation.
              </p>
            </div>

            <div className="rounded-2xl bg-[#2b1d16] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[#c9a985]">
                Wellness Massage
              </p>

              <h2 className="mt-2 text-3xl font-semibold">$129</h2>

              <p className="mt-3 text-[#d9c8b8]">
                60 minute wellness & recovery massage session.
              </p>
            </div>
          </div>
        </section>

        {/* WHY BOOK + MAP */}
        <section className="mt-16 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-[#2b1d16] p-7">
            <h2 className="text-2xl font-semibold">
              Why pair physio with recovery?
            </h2>

            <div className="mt-5 space-y-4 text-[#e3d2c1]">
              <p>
                Perfect for gym goers, athletes, runners, fighters, busy workers,
                or anyone wanting their body feeling and moving better.
              </p>

              <p>
                Use physio to identify and treat issues — then continue your
                recovery routine with sauna, hot plunge, ice bath, or compression
                boots at LAX.
              </p>

              <p>
                A great option if you are dealing with tightness, pain,
                recurring niggles, injuries, poor mobility, or heavy training
                loads.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#d8b98f]/30 bg-[#2b1d16]">
            <iframe
              title="Rush Physio Map"
              src="https://www.google.com/maps?q=1%2F62%20Crockford%20Street%2C%20Northgate%20QLD%204013&output=embed"
              className="h-[360px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </section>
    </main>
  );
}