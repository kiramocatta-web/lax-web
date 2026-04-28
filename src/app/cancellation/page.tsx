// src/app/cancellation/page.tsx
import AuthFooterButton from "@/components/AuthFooterButton";

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Cancellation Policy</h1>

          
        </div>

        <p className="mt-4 text-white/70 text-sm">
          Last updated: {new Date().toLocaleDateString("en-AU")}
        </p>

        <div className="mt-8 space-y-6 text-white/80 leading-relaxed text-sm">

          <section>
            <p>
              This Cancellation Policy explains the rules for cancelling or
              modifying bookings and memberships at <strong>Lax N Lounge</strong>.
              By purchasing a booking, pass, or membership through our website
              or booking system, you agree to the terms outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              1. Booking Cancellations
            </h2>

            <p>
              Individual bookings may be cancelled or rescheduled through the
              booking system prior to the scheduled session time.
            </p>

            <p>
              If you cancel within the permitted timeframe, your booking credit
              may be reused for a future booking. Late cancellations or missed
              bookings may result in the booking being forfeited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              2. Membership Cancellations
            </h2>

            <p>
              Memberships can be cancelled at any time through the membership
              management portal or by contacting Lax N Lounge.
            </p>

            <p>
              Cancellation will prevent future billing but does not provide
              refunds for payments that have already been processed.
            </p>

            <p>
              Access to membership services will remain active until the end of
              the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. 7-Day Passes
            </h2>

            <p>
              7-Day Passes provide unlimited access to the recovery space for
              the seven (7) days following activation. Once purchased, passes
              are non-refundable and cannot be paused or extended.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              4. Refunds
            </h2>

            <p>
              Unless required by Australian Consumer Law, payments made for
              memberships, passes, or bookings are non-refundable.
            </p>

            <p>
              If a service cannot be delivered due to circumstances within the
              control of Lax N Lounge, we may provide a credit or alternative
              solution at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              5. Changes to This Policy
            </h2>

            <p>
              Lax N Lounge may update this Cancellation Policy from time to
              time. Any updates will be published on this page and will apply
              immediately upon posting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              6. Contact
            </h2>

            <p>
              If you have questions regarding cancellations, please {" "}
  <a href="/contact" className="underline hover:text-white">
    contact us
  </a>.
            </p>
          </section>

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
            <a className="hover:text-white" href="/everything-else">
                    Vision & Story
                  </a>
          </div>
        </footer>
    </div>
  );
}