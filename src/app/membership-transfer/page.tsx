"use client";

import { useState } from "react";

export default function MembershipTransferPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "weekly",
          transfer_offer: true,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to start checkout");
      }

      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-emerald-950 text-white px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-semibold">Transfer Your Membership</h1>
        <p className="mt-4 text-white/80">
          Existing members can transfer across now and enjoy 2 weeks free before billing starts.
        </p>

        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-8 rounded-2xl bg-white px-6 py-4 text-black font-medium"
        >
          {loading ? "Loading..." : "Claim 2 Weeks Free"}
        </button>

        {error ? <p className="mt-4 text-red-300">{error}</p> : null}
      </div>
    </main>
  );
}