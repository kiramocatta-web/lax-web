"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function SecretWeeklyPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLoggedIn(!!session?.user);
      setCheckingSession(false);
    }

    checkSession();
  }, [supabase]);

  async function handleCheckout() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/membership/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "secret_weekly_15",
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
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#160d0a] px-4 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="text-sm uppercase tracking-[0.25em] text-pink-200/80">
          Secret Offer
        </div>

        <h1 className="mt-4 text-3xl font-semibold">
          $15 Weekly Membership
        </h1>

        <p className="mt-4 text-sm text-white/65">
          Unlimited weekly access to LAX N LOUNGE.
        </p>

        {checkingSession ? (
          <p className="mt-8 text-sm text-white/60">Checking account...</p>
        ) : loggedIn ? (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Join for $15/week"}
          </button>
        ) : (
          <a
            href="/login?redirect=/secret-weekly"
            className="mt-8 block w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:opacity-90"
          >
            Log in first
          </a>
        )}

        {error ? (
          <p className="mt-5 text-sm text-red-300">{error}</p>
        ) : null}
      </div>
    </main>
  );
}