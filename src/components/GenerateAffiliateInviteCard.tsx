"use client";

import { useState } from "react";

export default function GenerateAffiliateInviteCard() {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [err, setErr] = useState("");

  const generate = async () => {
    setLoading(true);
    setErr("");
    setInviteUrl("");

    try {
      const res = await fetch("/api/affiliates/create-invite", {
        method: "POST"
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(json?.error || "Failed to create invite");
        return;
      }

      setInviteUrl(json.url);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    alert("Invite copied ✅");
  };

  return (
    <div className="bg-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-semibold">Affiliate Invites</h2>
      <p className="text-white/70 text-sm mt-1">
        Generate a private affiliate signup link.
      </p>

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 w-fit bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold disabled:opacity-50 px-6"
      >
        {loading ? "Generating…" : "Generate Invite Link"}
      </button>

      {err && (
        <div className="text-red-300 text-sm mt-3">
          {err}
        </div>
      )}

      {inviteUrl && (
        <div className="mt-4 bg-black/30 p-4 rounded-xl">
          <div className="text-xs text-white/60">Invite URL</div>

          <div className="text-sm break-all mt-1">
            {inviteUrl}
          </div>

          <button
            onClick={copy}
            className="mt-3 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}