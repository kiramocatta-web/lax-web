"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  function validatePhone(value: string) {
    return /^04\d{8}$/.test(value);
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !password.trim() || !cleanPhone) {
      setError("Please enter email, password, and phone number.");
      return;
    }

    if (!validatePhone(cleanPhone)) {
      setError("Phone must be a valid Australian mobile (04xxxxxxxx).");
      return;
    }

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

      if (signUpErr) {
        throw signUpErr;
      }

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

        if (profileError) {
          throw profileError;
        }
      }

      const hasSession = !!data.session;

      if (hasSession) {
        router.push("/dashboard");
        return;
      }

      setShowSuccessModal(true);
    } catch (e: any) {
      setError(e?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  function handleGoToLogin() {
    setShowSuccessModal(false);
    router.push("/login");
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-emerald-950 px-4">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-4"
        >
          <div>
            <h1 className="text-2xl font-semibold text-black">Create Account</h1>
            <p className="mt-1 text-sm text-black/60">
              Create your account to manage bookings and memberships.
            </p>
          </div>

          <input
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-xl border p-3 text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            autoComplete="new-password"
            className="w-full rounded-xl border p-3 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="tel"
            placeholder="Phone (04xxxxxxxx)"
            required
            autoComplete="tel"
            className="w-full rounded-xl border p-3 text-black"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <a
            href="/login"
            className="block text-center text-sm text-black/60 hover:text-black"
          >
            Already have an account? Log in →
          </a>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <h2 className="text-2xl font-semibold text-black">
              Account Created
            </h2>

            <p className="mt-3 text-sm text-black/60">
              Please confirm your email if required, then log in.
            </p>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="mt-6 w-full rounded-xl bg-black py-3 text-white font-semibold"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
}