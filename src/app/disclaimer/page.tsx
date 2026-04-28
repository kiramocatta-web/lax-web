import AuthFooterButton from "@/components/AuthFooterButton";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Disclaimer</h1>

        </div>

        <p className="mt-4 text-white/70 text-sm">
          Last updated: {new Date().toLocaleDateString("en-AU")}
        </p>

        <div className="mt-8 space-y-6 text-white/80 leading-relaxed text-sm">
          <section>
            <p>
              This Disclaimer (the “Disclaimer”), together with our Terms and
              Conditions and Privacy Policy, sets out the rules for how you may
              use this website (the “Site”), access our content and services,
              and engage with any Lax N Lounge social media profiles, whether as
              a paying customer or a general visitor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              1. Qualifications
            </h2>
            <p>
              Lax N Lounge and its operators make no representations about
              holding specific professional qualifications unless expressly
              stated in writing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              2. Not Professional Advice
            </h2>
            <p>
              Nothing shared on this Site or through Lax N Lounge channels is
              professional, medical, legal, or health advice. Our content and
              services are provided for general informational and promotional
              purposes only.
            </p>
            <p>
              Lax N Lounge services are not a substitute for professional
              advice, diagnosis, or treatment. You should seek professional
              advice before engaging with any recovery, sauna, ice bath, or
              related services, and you accept that you participate at your own
              risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. Content and Video Disclaimer
            </h2>
            <p>
              By accessing, viewing, participating in, or acting on content
              shared by Lax N Lounge (including videos), you agree that you are
              responsible for your own actions and decisions.
            </p>
            <p>
              You release Lax N Lounge from liability for any injuries, loss, or
              issues that may arise from engaging with our content. Content is
              educational and informational only, is not tailored to you, and we
              do not guarantee results or outcomes.
            </p>
            <p>
              If you have questions, please contact us at{" "}
              <strong>admin@laxnlounge.com.au</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Social Media</h2>
            <p>This Disclaimer applies to our Site, services, and social media, including:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Instagram: @laxnlounge</li>
              <li>TikTok: laxnlounge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. No Guarantees</h2>
            <p>
              Lax N Lounge makes no guarantees regarding any results based on
              actions you take (or do not take) based on information we share or
              services we provide. Outcomes depend on many factors outside our
              control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. No Client Relationship</h2>
            <p>
              By using the Site, no client-professional relationship is created
              between you and Lax N Lounge. You only become a client when we
              enter into a specific agreement with you, such as when you
              purchase a service or sign a contract provided by us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Accuracy and Mistakes</h2>
            <p>
              We aim to keep information accurate and helpful, but we are human
              and content may sometimes be incomplete, out of date, or contain
              errors. If we become aware of an issue, we will correct it as soon
              as reasonably possible.
            </p>
            <p>
              If you disagree with any content or do not wish to be bound by
              this Disclaimer, you should stop using the Site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. No Warranties</h2>
            <p>
              Lax N Lounge makes no promise that the Site or any third-party
              platforms we use will always be available, uninterrupted, secure,
              or error-free. To the maximum extent permitted by the laws of
              Queensland, Australia, we disclaim all warranties (express or
              implied) relating to the Site, content, products, and services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Contact</h2>
            <p>
              If you have questions about this Disclaimer, contact us at{" "}
              <strong>admin@laxnlounge.com.au</strong>.
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