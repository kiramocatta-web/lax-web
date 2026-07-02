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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLoggedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
      setCheckingSession(false);
    }

    checkSession();
  }, [supabase]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginErr) {
        throw loginErr;
      }

      setLoggedIn(true);
    } catch (e: any) {
      setError(e?.message || "Unable to log in");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCheckout() {
    setError("");
    setCheckoutLoading(true);

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
      setCheckoutLoading(false);
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
            disabled={checkoutLoading}
            className="mt-8 w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {checkoutLoading ? "Loading..." : "Join for $15/week"}
          </button>
        ) : (
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-white/40 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-white/40 outline-none"
            />

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loginLoading ? "Logging in..." : "Log in to continue"}
            </button>

            <a
              href="/pricing-membership-and-packages"
              className="block text-sm text-white/60 hover:text-white"
            >
              Need an account? Create one here →
            </a>
          </form>
        )}

        {error ? (
          <p className="mt-5 text-sm text-red-300">{error}</p>
        ) : null}
      </div>
    </main>
  );
}