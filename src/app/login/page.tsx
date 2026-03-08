"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function LoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/members";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [supabase, router, next]);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.replace(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/10 rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-center">Members Portal</h1>
        <p className="mt-2 text-white/70 text-lg text-center">Log in</p>

        <div className="mt-6 grid gap-3">
          <input
            className="w-full bg-white text-black p-3 rounded-xl"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="w-full bg-white text-black p-3 rounded-xl"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-white text-black py-4 rounded-xl text-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Lets go!"}
          </button>

          <a
            href="/forgot-password"
            className="text-sm text-center text-white/70 hover:text-white underline"
          >
            Forgot password?
          </a>

          <a
            href="/"
            className="text-center text-sm text-white/70 hover:text-white underline"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-white/10 rounded-2xl p-6 text-center">
            Loading...
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}