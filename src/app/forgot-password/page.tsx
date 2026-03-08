"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import TopNav from "@/components/TopNav";

export default function ForgotPasswordPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const sendReset = async () => {
    setSending(true);
    setErr("");
    setMsg("");

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) throw error;

      setMsg("If that email exists, reset instructions have been sent.");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold">Forgot Password</h1>
        <p className="mt-2 text-white/70">
          Enter your email and we’ll send you instructions to reset your password.
        </p>

        <div className="mt-6 bg-white/10 rounded-2xl p-5 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-white text-black p-3 rounded-xl"
          />

          <button
            onClick={sendReset}
            disabled={sending || !email.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 transition text-white py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send reset instructions"}
          </button>

          {msg ? <div className="text-sm text-emerald-200">{msg}</div> : null}
          {err ? <div className="text-sm text-red-300">{err}</div> : null}
        </div>
      </div>
    </div>
  );
}