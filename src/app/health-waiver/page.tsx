import AuthFooterButton from "@/components/AuthFooterButton";

// src/app/health-waiver/page.tsx
export default function HealthWaiverPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Health Waiver</h1>

        </div>

        <p className="mt-4 text-white/70 text-sm">
          Last updated: {new Date().toLocaleDateString("en-AU")}
        </p>

        <div className="mt-8 space-y-6 text-white/80 leading-relaxed text-sm">

          <section>
            <p>
              By accessing and using the facilities and services provided by{" "}
              <strong>Lax N Lounge</strong>, including ice baths, saunas,
              recovery equipment, and related services, you acknowledge and
              agree to the following terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              1. Voluntary Participation
            </h2>

            <p>
              Participation in recovery activities at Lax N Lounge is entirely
              voluntary. You understand that exposure to hot and cold
              environments, including saunas and ice baths, carries inherent
              risks.
            </p>

            <p>
              By using these facilities, you accept full responsibility for
              your participation and acknowledge that you are choosing to use
              these services at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              2. Health Responsibility
            </h2>

            <p>
              You confirm that you are physically able to participate in these
              recovery services. If you have any medical conditions, injuries,
              or concerns, you should seek advice from a qualified healthcare
              professional before using any Lax N Lounge facilities.
            </p>

            <p>
              Lax N Lounge does not provide medical advice or medical
              supervision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. Assumption of Risk
            </h2>

            <p>
              You acknowledge that the use of saunas, ice baths, and recovery
              equipment may involve risks including but not limited to:
            </p>

            <ul className="list-disc ml-6 space-y-1">
              <li>temperature stress</li>
              <li>dizziness or fainting</li>
              <li>dehydration</li>
              <li>muscle strain</li>
              <li>aggravation of existing medical conditions</li>
            </ul>

            <p>
              You voluntarily assume all risks associated with participation in
              these activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              4. Release of Liability
            </h2>

            <p>
              To the maximum extent permitted by law, you release and hold
              harmless Lax N Lounge, its owners, staff, affiliates, and
              partners from any liability, injury, loss, or damages that may
              arise from your participation in recovery activities or use of
              the facilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              5. Personal Responsibility
            </h2>

            <p>
              You agree to follow all safety instructions, facility guidelines,
              and posted rules while using Lax N Lounge facilities. Failure to
              follow safety instructions may increase the risk of injury.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              6. Changes to This Waiver
            </h2>

            <p>
              Lax N Lounge may update this Health Waiver from time to time.
              Continued use of the facilities indicates acceptance of the
              current version of this waiver.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              7. Contact
            </h2>

            <p>
              If you have questions regarding this Health Waiver, please{" "}
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