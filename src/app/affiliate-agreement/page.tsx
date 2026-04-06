// app/affiliate-agreement/page.tsx
export default function AffiliateAgreementPage() {
  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            LAX Affiliate Agreement
          </h1>

          <p className="mt-4 text-white/75 leading-relaxed">
            By joining the LAX affiliate program, you agree to represent LAX N
            Lounge professionally and consistently across your content and
            profile.
          </p>

          <div className="mt-8 space-y-5 text-white/85 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Affiliate requirements
              </h2>
              <ul className="mt-3 space-y-3 list-disc pl-5">
                <li>
                  Your social media bio must include <strong>@laxnlounge</strong>{" "}
                  and your affiliate code.
                </li>
                <li>
                  Your affiliate code must be used a minimum of{" "}
                  <strong>4 times per month</strong>.
                </li>
                <li>
                  You must post <strong>a story when using </strong> 
                  LAX.
                </li>
                <li>
                  You must post a minimum of <strong>1 feed post per month</strong>.
                  This can include collaborative posts, interviews with LAX,
                  photoshoots, training content, or recovery content at LAX.
                </li>
              </ul>
            </div>

<div className="mt-8 space-y-5 text-white/85 leading-relaxed"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                General expectations
              </h2>
              <ul className="mt-3 space-y-3 list-disc pl-5">
                <li>
                  Affiliates are expected to represent the LAX brand in a
                  positive, respectful, and professional manner.
                </li>
                <li>
                  If affiliate requirements are not maintained, LAX may review,
                  pause, or remove affiliate access at any time.
                </li>
                <li>
                  This agreement may be updated from time to time. The latest
                  version will always be available on your affiliate profile.
                </li>
                <li>
                  If this contract is redacted, you will recieve a $5 lifetime 
                  discount code as a thank you.
                </li>
              </ul>
            </div>

<div className="mt-8 space-y-5 text-white/85 leading-relaxed"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Monetary Terms
              </h2>
              <ul className="mt-3 space-y-3 list-disc pl-5">
                <li>
                  You will recieve $5 from every time your code is used.
                </li>
              </ul>
            </div>
          </div>


          <div className="mt-8 rounded-2xl bg-black/10 border border-white/5 p-4 text-sm text-white/65">
            Last updated: 8 March 2026
          </div>
        </div>
      </div>
    </div>
  );
}