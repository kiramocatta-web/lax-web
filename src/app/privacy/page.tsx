import AuthFooterButton from "@/components/AuthFooterButton";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>

          
        </div>

        <p className="mt-4 text-white/70 text-sm">
          Last updated: {new Date().toLocaleDateString("en-AU")}
        </p>

        <div className="mt-8 space-y-6 text-white/80 leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              Lax N Lounge ("Lax N Lounge", "we", "our", or "us") understands how
              important your privacy is. This Privacy Policy explains how we
              collect, use, disclose and protect your personal information when
              you use our website, services, and facilities.
            </p>
            <p>
              This policy applies to all personal information collected through
              the Lax N Lounge website, booking systems, and associated digital
              services (the “Site”).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              2. Personal Information
            </h2>

            <p>
              “Personal Information” means information or an opinion about an
              identifiable individual as defined under the{" "}
              <strong>Privacy Act 1988 (Cth)</strong>.
            </p>

            <p>
              Lax N Lounge is committed to handling your Personal Information
              in accordance with the Australian Privacy Principles (APPs).
            </p>

            <p>We aim to:</p>

            <ul className="list-disc ml-6 space-y-1">
              <li>manage Personal Information transparently and responsibly</li>
              <li>only collect information necessary to provide services</li>
              <li>inform you how your information is used</li>
              <li>securely store and protect your data</li>
              <li>allow access and correction of your Personal Information</li>
              <li>respond promptly to security incidents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              3. Information We Collect
            </h2>

            <p>We may collect the following information:</p>

            <ul className="list-disc ml-6 space-y-1">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Booking or membership information</li>
              <li>Messages submitted through contact forms</li>
            </ul>

            <p>
              Payment details such as credit card information are never stored
              by Lax N Lounge and are processed securely by third-party payment
              providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              4. How We Use Your Information
            </h2>

            <p>Your information may be used to:</p>

            <ul className="list-disc ml-6 space-y-1">
              <li>process bookings and memberships</li>
              <li>communicate important service updates</li>
              <li>respond to enquiries or support requests</li>
              <li>send optional promotional or informational emails</li>
              <li>improve our services and website performance</li>
            </ul>

            <p>
              You may unsubscribe from marketing emails at any time by using
              the unsubscribe link or contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              5. Third-Party Services
            </h2>

            <p>
              Lax N Lounge may use trusted third-party providers to operate
              parts of our services. These providers may collect information
              necessary to perform their services.
            </p>

            <p>Examples include:</p>

            <ul className="list-disc ml-6 space-y-1">
              <li>
                Stripe (payments) –{" "}
                <a
                  className="underline"
                  href="https://stripe.com/privacy"
                  target="_blank"
                >
                  stripe.com/privacy
                </a>
              </li>
              <li>
                Instagram –{" "}
                <a
                  className="underline"
                  href="https://help.instagram.com/402411646841720"
                  target="_blank"
                >
                  Instagram Privacy
                </a>
              </li>
            </ul>

            <p>
              Lax N Lounge is not responsible for the privacy practices of
              third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              6. Cookies and Analytics
            </h2>

            <p>
              Our website may use cookies and analytics tools to understand how
              visitors interact with the Site.
            </p>

            <p>This may include:</p>

            <ul className="list-disc ml-6 space-y-1">
              <li>pages visited</li>
              <li>time spent on the website</li>
              <li>device or browser type</li>
              <li>IP address for security purposes</li>
            </ul>

            <p>
              Cookies help improve functionality and user experience. You may
              disable cookies in your browser settings, though some features of
              the Site may not function correctly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              7. Data Security
            </h2>

            <p>
              We take reasonable steps to protect Personal Information from
              misuse, interference, loss, unauthorised access, modification or
              disclosure.
            </p>

            <p>
              However, transmission of information over the internet is not
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              8. Access and Correction
            </h2>

            <p>
              You may request access to the Personal Information we hold about
              you or request corrections if it is inaccurate.
            </p>

            <p>
              To do so, please contact us at:
              <br />
              <strong>admin@laxnlounge.com.au</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              9. Children Under 18
            </h2>

            <p>
              Our services are not intended for individuals under the age of
              18. We do not knowingly collect Personal Information from minors.
              If we become aware that such information has been collected, we
              will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              10. Changes to This Policy
            </h2>

            <p>
              Lax N Lounge may update this Privacy Policy from time to time.
              Updates will be posted on this page and will take effect
              immediately upon publication.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">
              11. Contact
            </h2>

            <p>
              If you have questions about this Privacy Policy or how your
              Personal Information is handled, please{" "}
  <a href="/contact" className="underline hover:text-white">
    contact us
  </a>.
            </p>

            <p>
              <strong>Email:</strong> admin@laxnlounge.com.au
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