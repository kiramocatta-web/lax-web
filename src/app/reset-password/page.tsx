"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const updatePassword = async () => {
    setErr("");
    setMsg("");

    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("Password updated successfully. You can now log in.");
    } catch (e: any) {
      setErr(e?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-white/70">Enter your new password below.</p>

        <div className="mt-6 bg-white/10 rounded-2xl p-5 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-white text-black p-3 rounded-xl"
          />

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-white text-black p-3 rounded-xl"
          />

          <button
            onClick={updatePassword}
            disabled={saving || !password || !confirm}
            className="w-full bg-emerald-600 hover:bg-emerald-500 transition text-white py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update password"}
          </button>

          {msg ? <div className="text-sm text-emerald-200">{msg}</div> : null}
          {err ? <div className="text-sm text-red-300">{err}</div> : null}

          {msg ? (
            <a href="/login" className="block text-center text-sm text-white/70 hover:text-white">
              Go to login →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}