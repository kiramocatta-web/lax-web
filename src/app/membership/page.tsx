"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import MembershipPerks from "@/components/MembershipPerks";

type Plan = "weekly" | "pass7" | "pack5" | "pack10" | "monthly" | null;

export default function SignupPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [selectedPlan, setSelectedPlan] = useState<Plan>(null);

  const [recipientType, setRecipientType] = useState<"self" | "gift">("self");

const [giftEmail, setGiftEmail] = useState("");
const [giftName, setGiftName] = useState("");
const [giftMessage, setGiftMessage] = useState("");
const [giftPhone, setGiftPhone] = useState("");

  const accountSectionRef = useRef<HTMLDivElement | null>(null);
  const waiverSectionRef = useRef<HTMLDivElement | null>(null);
  const letsGoButtonRef = useRef<HTMLButtonElement | null>(null);
  const giftSectionRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [accountCreated, setAccountCreated] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setAccountCreated(true);
          setEmail(session.user.email ?? "");

          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!mounted) return;

          if (profile?.phone) {
            setPhone(profile.phone);
          }
        }
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  function validatePhone(value: string) {
    return /^04\d{8}$/.test(value);
  }

  function normaliseAustralianMobile(value: string) {
  const cleaned = value.replace(/\s+/g, "");

  if (/^04\d{8}$/.test(cleaned)) return cleaned;
  if (/^\+614\d{8}$/.test(cleaned)) return `0${cleaned.slice(3)}`;
  if (/^614\d{8}$/.test(cleaned)) return `0${cleaned.slice(2)}`;

  return cleaned;
}

  function scrollToRef(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handlePlanSelect(plan: Plan) {
    setSelectedPlan(plan);
    setError("");

    setTimeout(() => {
  if (recipientType === "gift") {
    scrollToRef(giftSectionRef);
    return;
  }

  if (accountCreated) {
    scrollToRef(waiverSectionRef);
  } else {
    scrollToRef(accountSectionRef);
  }
}, 150);
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normaliseAustralianMobile(phone.trim());

    if (!selectedPlan) {
      setError("Please select a membership option first.");
      return;
    }

    if (!cleanEmail || !password.trim() || !cleanPhone) {
      setError("Please enter email, password, and phone number.");
      return;
    }

    if (!validatePhone(cleanPhone)) {
      setError("Phone must be a valid Australian mobile (04xxxxxxxx).");
      return;
    }
    setPhone(cleanPhone);

    setLoading(true);

    try {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            phone: cleanPhone,
          },
        },
      });

      if (signUpErr) throw signUpErr;

      const userId = data.user?.id ?? data.session?.user?.id;

      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: userId,
            email: cleanEmail,
            phone: cleanPhone,
          },
          { onConflict: "id" }
        );

        if (profileError) throw profileError;
      }

      const hasSession = !!data.session;

      if (!hasSession) {
        setShowSuccessModal(true);
        return;
      }

      setAccountCreated(true);
      setError("");

      setTimeout(() => {
        scrollToRef(waiverSectionRef);
      }, 150);
    } catch (e: any) {
      setError(e?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setError("");

    if (!selectedPlan) {
      setError("Please choose a membership option.");
      return;
    }

    if (recipientType === "self" && !accountCreated) {
      setError("Please create your account first.");
      return;
    }

    if (recipientType === "gift") {
  if (!giftName.trim() || !giftEmail.trim() || !giftPhone.trim()) {
    setError("Please enter the recipient name, email and phone number.");
    return;
  }
}

    if (recipientType === "self" && !waiverAccepted) {
      setError("Please confirm you have read the health waiver.");
      return;
    }


    setCheckoutLoading(true);

    try {
      const endpoint =
  recipientType === "gift"
    ? "/api/stripe/membership/gift-checkout"
    : "/api/stripe/membership/checkout";

const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  plan: selectedPlan,
  recipientType,
  giftEmail,
  giftName,
  giftPhone,
  giftMessage,
}),
});

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Unable to start checkout");
      }

      if (!json?.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || "Unable to start checkout");
      setCheckoutLoading(false);
    }
  }

  function handleGoToLogin() {
    setShowSuccessModal(false);
    window.location.href = "/login";
  }

  const showAccountSection =
    !!selectedPlan && !checkingSession && !accountCreated;
  const showWaiverSection =
    !!selectedPlan && !checkingSession && accountCreated;

  return (
  <>
    <div className="min-h-screen bg-emerald-950 px-4 pb-12 text-white">
  <div className="mx-auto max-w-4xl pt-8 sm:pt-14">
    <div className="pb-10 text-center">
      <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
        Membership & Packages
      </h1>

      <p className="mt-5 text-base sm:text-lg text-white/70">
        Choose what fits your recovery rhythm.
      </p>
    </div>

   {/* PACKAGES */}
<section>
  <h2 className="text-center text-2xl font-semibold">
    Packages
  </h2>

  <p className="mt-2 text-center text-white/60">
    Flexible options without the ongoing commitment.
  </p>

  {/* WHO IS IT FOR */}
<div className="mt-8">
  <div className="flex justify-center">
    <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
        onClick={() => setRecipientType("self")}
        className={`rounded-xl px-5 py-2 text-sm transition ${
          recipientType === "self"
            ? "bg-white text-black"
            : "text-white/70 hover:text-white"
        }`}
      >
        Myself
      </button>

      <button
        type="button"
        onClick={() => setRecipientType("gift")}
        className={`rounded-xl px-5 py-2 text-sm transition ${
          recipientType === "gift"
            ? "bg-white text-black"
            : "text-white/70 hover:text-white"
        }`}
      >
        Someone else
      </button>
    </div>
  </div>

  {recipientType === "gift" && selectedPlan ? (
    <div
  ref={giftSectionRef}
  className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/10 bg-white p-6 text-black shadow-2xl"
>
      <h3 className="text-2xl font-semibold">
        Who are you sending it to?
      </h3>

      <p className="mt-1 text-sm text-black/60">
        We’ll email them a redemption link so they can claim it on their account.
      </p>

      <div className="mt-5 space-y-4">
        <input
          type="text"
          placeholder="Recipient name"
          value={giftName}
          onChange={(e) => setGiftName(e.target.value)}
          className="w-full rounded-2xl border border-black/10 p-3 outline-none"
        />

        <input
          type="email"
          placeholder="Recipient email"
          value={giftEmail}
          onChange={(e) => setGiftEmail(e.target.value)}
          className="w-full rounded-2xl border border-black/10 p-3 outline-none"
        />

        <input
          type="tel"
          placeholder="Recipient phone"
          value={giftPhone}
          onChange={(e) => setGiftPhone(e.target.value)}
          className="w-full rounded-2xl border border-black/10 p-3 outline-none"
        />

        <div>
  <label className="text-sm font-semibold text-black/70">
    Leave a note? optional
  </label>

  <textarea
    placeholder="Example: Hope this helps you recover after training — enjoy!"
    rows={3}
    value={giftMessage}
    onChange={(e) => setGiftMessage(e.target.value)}
    className="mt-2 w-full rounded-2xl border border-black/10 p-3 outline-none"
  />
</div>
      </div>
    </div>
  ) : null}
</div>
</section>


  <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
    <button
      type="button"
      onClick={() => handlePlanSelect("pass7")}
      className={`min-h-[220px] rounded-3xl border p-6 text-center md:text-left transition-all duration-300 ${
        selectedPlan === "pass7"
          ? "border-sky-300 bg-sky-500/20 ring-2 ring-sky-300 shadow-2xl scale-[1.01]"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.2em] text-sky-200/80">
        7-Day Pass
      </div>

      <div className="mt-4 text-5xl font-semibold text-sky-300">
        $25
      </div>

      <div className="mt-3 text-xl text-white/85">
        Unlimited
      </div>

      <div className="mt-6 text-sm leading-relaxed text-white/55">
        Unlimited recovery for 7 days.
      </div>
    </button>

    <button
      type="button"
      onClick={() => handlePlanSelect("pack5")}
      className={`min-h-[220px] rounded-3xl border p-6 text-center md:text-left transition-all duration-300 ${
        selectedPlan === "pack5"
          ? "border-emerald-300 bg-emerald-500/20 ring-2 ring-emerald-300 shadow-2xl scale-[1.01]"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
        5 Pack
      </div>

      <div className="mt-4 text-5xl font-semibold text-emerald-300">
        $50
      </div>

      <div className="mt-3 text-xl text-white/85">
        5 × 1hr sessions
      </div>

      <div className="mt-6 text-sm leading-relaxed text-white/55">
        Save $15 compared to casual bookings.
      </div>
    </button>

    <button
      type="button"
      onClick={() => handlePlanSelect("pack10")}
      className={`min-h-[220px] rounded-3xl border p-6 text-center md:text-left transition-all duration-300 ${
        selectedPlan === "pack10"
          ? "border-amber-300 bg-amber-500/20 ring-2 ring-amber-300 shadow-2xl scale-[1.01]"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.2em] text-amber-200/80">
        10 Pack
      </div>

      <div className="mt-4 text-5xl font-semibold text-amber-300">
        $95
      </div>

      <div className="mt-3 text-xl text-white/85">
        10 × 1hr sessions
      </div>

      <div className="mt-6 text-sm leading-relaxed text-white/55">
        Save $55 compared to casual bookings.
      </div>
    </button>

    <button
      type="button"
      onClick={() => handlePlanSelect("monthly")}
      className={`min-h-[220px] rounded-3xl border p-6 text-center md:text-left transition-all duration-300 ${
        selectedPlan === "monthly"
          ? "border-violet-300 bg-violet-500/20 ring-2 ring-violet-300 shadow-2xl scale-[1.01]"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
        Monthly Unlimited
      </div>

      <div className="mt-4 text-5xl font-semibold text-violet-300">
        $50
      </div>

      <div className="mt-3 text-xl text-white/85">
        4 weeks access
      </div>

      <div className="mt-6 text-sm leading-relaxed text-white/55">
        One single payment. Unlimited recovery for 4 weeks.
      </div>
    </button>
  </div>

  
        {/* MEMBERSHIP */}
<section className="mt-20">
  <h2 className="text-center text-2xl font-semibold">Membership</h2>

  <p className="mt-2 text-center text-white/60">
    For consistent recovery and unlimited access.
  </p>

  <div className="mt-8">
    <MembershipPerks />
  </div>

  <div className="mt-8 flex justify-center">
    <button
      type="button"
      onClick={() => handlePlanSelect("weekly")}
      className={`w-full max-w-xl min-h-[220px] rounded-3xl border p-8 text-center transition-all duration-300 ${
        selectedPlan === "weekly"
          ? "border-pink-300 bg-pink-500/20 ring-2 ring-pink-300 shadow-2xl scale-[1.01]"
          : "border-white/15 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="text-sm uppercase tracking-[0.25em] text-pink-200/80">
        Weekly Unlimited
      </div>

      <div className="mt-4 text-5xl font-semibold text-pink-300">
        $20 p/w
      </div>

      <div className="mt-3 text-2xl text-white/90">
        Unlimited
      </div>

      <div className="mt-6 text-sm leading-relaxed text-white/55">
        Ongoing weekly access to your recovery space.
      </div>
    </button>
  </div>
</section>



        {selectedPlan && accountCreated && !checkingSession ? (
          <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
            <p className="font-semibold text-emerald-200">
              You’re already signed in.
            </p>
            <p className="mt-1 text-sm text-white/75">
              Great — just confirm the waiver and continue to payment.
            </p>
          </div>
        ) : null}

        <div
          ref={accountSectionRef}
          className={`mt-8 overflow-hidden transition-all duration-500 ${
            showAccountSection
              ? "max-h-[1000px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-black">
                Now let’s create an account
              </h2>
              <p className="mt-1 text-sm text-black/60">
                Create your account to manage bookings and memberships.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-black/10 p-3 text-black outline-none focus:border-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                required
                autoComplete="new-password"
                className="w-full rounded-2xl border border-black/10 p-3 text-black outline-none focus:border-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <input
                type="tel"
                placeholder="Phone (04xxxxxxxx)"
                required
                autoComplete="tel"
                className="w-full rounded-2xl border border-black/10 p-3 text-black outline-none focus:border-black"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black py-3 text-white font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>

              <a
                href="/login"
                className="block text-center text-sm text-black/60 hover:text-black"
              >
                Already have an account? Log in →
              </a>
            </form>
          </div>
        </div>

        <div
          ref={waiverSectionRef}
          className={`mt-8 overflow-hidden transition-all duration-500 ${
            showWaiverSection
              ? "max-h-[800px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Read our health waiver?
                </h3>
                <p className="mt-1 text-sm text-white/65">
                  Please confirm before continuing to payment.
                </p>
              </div>

              <label className="mt-1 inline-flex items-center">
                <input
                  type="checkbox"
                  checked={waiverAccepted}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWaiverAccepted(checked);

                    if (checked) {
                      setTimeout(() => {
                        letsGoButtonRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 150);
                    }
                  }}
                  className="h-5 w-5 rounded border-white/30 bg-transparent accent-white"
                />
              </label>
            </div>

            <div className="mt-5">
              <a
                href="/health-waiver"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
              >
                Open health waiver
              </a>
            </div>

            <button
              ref={letsGoButtonRef}
              type="button"
              onClick={handleCheckout}
              disabled={!waiverAccepted || checkoutLoading}
              className="mt-8 w-full rounded-3xl bg-white py-4 text-lg font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutLoading ? "Loading..." : "Let’s go!"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-6 text-center text-sm text-red-300">{error}</p>
        ) : null}
      </div>
    </div>

    {showSuccessModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-2xl font-semibold text-black">
            Account Created
          </h2>

          <p className="mt-3 text-sm text-black/60">
            Please confirm your email if required, then log in to continue.
          </p>

          <button
            type="button"
            onClick={handleGoToLogin}
            className="mt-6 w-full rounded-2xl bg-black py-3 text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )}
  </>
);
}