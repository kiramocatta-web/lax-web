"use client";

import TopNav from "@/components/TopNav";
import AuthFooterButton from "@/components/AuthFooterButton";

export default function TermsPage() {
  return (
    <div>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
          <h1 className="text-3xl text-white font-semibold">Terms &amp; Conditions</h1>
          <p className="mt-2 text-white/70">
            Please read these Terms &amp; Conditions carefully before using this website.
          </p>

          <div className="mt-8 space-y-8 text-white/80 leading-relaxed">
            <section className="space-y-3">
              <p>
                The material appearing on this website (this <strong>&ldquo;Site&rdquo;</strong>) is
                provided as information about Lax N Lounge business, community, and people, and as a
                platform for online connection. The owner of this Site, Lax N Lounge, assumes no
                responsibility or liability for any consequence resulting directly or indirectly
                from any action or inaction you take based on the information found on the Site or
                material linked to this Site.
              </p>
              <p>
                Any information on this Site is provided for promotional or informational purposes
                only and is not to be relied upon as a professional opinion. By using this Site, you
                accept and agree that following and using any information or recommendation provided
                on this Site is at your own risk.
              </p>
              <p className="font-semibold text-white">
                Please read the following carefully. Your access to and use of this Site is subject
                to legally binding terms and conditions which you accept and agree to by accessing
                this Site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">1. Agreement</h2>
              <p>
                These terms and conditions (<strong>&ldquo;Terms and Conditions&rdquo;</strong>) form a
                binding agreement (<strong>&ldquo;Agreement&rdquo;</strong>) between you and{" "}
                <strong>LAXNLOUNGE</strong>, a Proprietary Limited Company operating out of the State
                of Queensland, Australia (<strong>&ldquo;Lax N Lounge&rdquo;</strong>).
              </p>
              <p>
                Lax N Lounge may modify, amend, supplement and replace these Terms and Conditions at
                any time without providing you with advance notice. Your continued use of this Site
                after any change means you have accepted the changed Terms and Conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">2. Copyright</h2>
              <p>
                All materials created by Lax N Lounge on the Site are protected by Australian
                copyright laws as original works (including the Copyright Act 1968). The absence of a
                registered copyright symbol does not mean that such materials are not protected as
                belonging to Lax N Lounge.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">3. Links to Third Party Websites</h2>
              <p>
                This Site may contain links to third party websites. All such linked sites, materials
                and pages are not under the control of Lax N Lounge and Lax N Lounge is not responsible
                for the content contained in any linked website nor for any losses or damages you may
                incur as a result of the use of any third party website. Lax N Lounge accepts no
                liability for any errors or omissions contained in third party websites.
              </p>
              <p>
                These links are provided to improve your use of this Site, enable you to connect with
                Lax N Lounge on various platforms, help Lax N Lounge offer the easiest services for you
                and conduct transactions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">4. Use License</h2>
              <p>
                If Lax N Lounge has materials on the Site which you can download, permission is granted
                to download copies of the materials for personal, non-commercial viewing only. This is
                the grant of a license, not a transfer of title.
              </p>

              <p>Under this license you may not:</p>

              <ul className="list-disc pl-6 space-y-1 text-white/80">
                <li>Modify or copy the materials;</li>
                <li>
                  Use the materials for any commercial purpose or for any public display (commercial or
                  non-commercial);
                </li>
                <li>Transfer the materials to another person; or</li>
                <li>&ldquo;Mirror&rdquo; the materials on any other server.</li>
              </ul>

              <p>
                This license shall automatically terminate if you violate any of these restrictions and
                may be terminated by Lax N Lounge at any time. Upon terminating your viewing of these
                materials or upon the termination of this license, you must destroy any downloaded
                materials in your possession, whether in electronic or printed format.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">5. Bookings &amp; Memberships</h2>
              <p>
                Booking, refund, rescheduling, and cancellation rules may vary by service and will be
                communicated at the time of booking or membership purchase. Where permitted, cancellations
                may be issued as credit rather than refunds. No refunds are provided for memberships or
                single entry purchases except where required by law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">6. Conditions of Entry</h2>
              <p>
                The right of entry is reserved at the discretion of Lax N Lounge. You must comply with
                venue rules, safety instructions, and any age verification requirements. Security cameras
                may operate on-site for security and operational purposes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">7. Disclaimer &amp; No Guarantees</h2>
              <p>
                Information and services provided on or through the Site are for informational and
                educational purposes only and are not intended to replace professional advice. Lax N
                Lounge makes no guarantees about any results or benefits from using the Site, products,
                or services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Lax N Lounge and its affiliates will not be
                liable for any damages arising out of the use or inability to use the Site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">9. Governing Law</h2>
              <p>
                These Terms &amp; Conditions are governed by the laws of Queensland, Australia. The
                parties agree to submit to the exclusive jurisdiction of the courts of Queensland,
                Australia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">10. Contact</h2>
              <p>
                Questions about these Terms &amp; Conditions can be sent via the{" "}
                <a className="underline hover:text-white" href="/contact">
                  Contact Us
                </a>{" "}
                page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-white/10 bg-black/20 backdrop-blur">
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
            Terms &amp; Conditions
          </a>
          <a className="hover:text-white" href="/cancellation">
            Cancellation Policy
          </a>
          <a className="hover:text-white" href="/health-waiver">
            Health Waiver
          </a>
        </div>
      </footer>
    </div>
  );
}