{/* PRICING HEADER */}
        <section className="px-6 pb-16 pt-16 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">
              Choose the recovery option
              <br />
              that fits you best.
            </h1>

            <p className="mt-6 text-lg text-white/70">
              Simple pricing. No stress. Just recovery.
            </p>
          </div>
        </section>

        {/* SINGLE BOOKINGS */}
        <section className="px-6 pb-20 text-center">
          <h2 className="text-3xl font-light">Single Bookings</h2>

          <a
            href="/book/single"
            className="mt-3 inline-block text-sm text-white/70 underline underline-offset-4 hover:text-white"
          >
            Say less →
          </a>

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["60 Minutes", "$15"],
              ["90 Minutes", "$20"],
              ["120 Minutes", "$25"],
            ].map(([title, price]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-white/5 p-8"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">
                  {title}
                </p>
                <p className="mt-3 text-3xl font-medium">{price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MEMBERSHIPS */}
        <section className="px-6 pb-24 text-center">
          <h2 className="text-3xl font-light">Memberships & Packages</h2>

          <a
            href="/pricing-membership-and-packages"
            className="mt-3 inline-block text-sm text-white/70 underline underline-offset-4 hover:text-white"
          >
            I'm ready →
          </a>

          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">
                7-Day Pass
              </p>
              <p className="mt-3 text-3xl font-medium">$25</p>
              <p className="mt-4 text-white/70">
                Unlimited recovery for 7 days.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
  <p className="text-sm uppercase tracking-[0.2em] text-white/50">
    5 Pack
  </p>
  <p className="mt-3 text-3xl font-medium">$50</p>
  <p className="mt-4 text-white/70">
    5 × 1hr sessions. Save $15.
  </p>
</div>

<div className="rounded-3xl border border-white/10 bg-white/5 p-8">
  <p className="text-sm uppercase tracking-[0.2em] text-white/50">
    10 Pack
  </p>
  <p className="mt-3 text-3xl font-medium">$95</p>
  <p className="mt-4 text-white/70">
    10 × 1hr sessions. Save $55.
  </p>
</div>

<div className="rounded-3xl border border-white/10 bg-white/5 p-8">
  <p className="text-sm uppercase tracking-[0.2em] text-white/50">
    Monthly Unlimited
  </p>
  <p className="mt-3 text-3xl font-medium">$55</p>
  <p className="mt-4 text-white/70">
    Unlimited recovery access for 4 weeks. (Non-reoccuring)
  </p>
</div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">
                Weekly Membership
              </p>
              <p className="mt-3 text-3xl font-medium">$20 / week</p>
              <p className="mt-4 text-white/70">
                Unlimited recovery access every week.
              </p>
            </div>
          </div>
        </section>