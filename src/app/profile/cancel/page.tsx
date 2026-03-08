"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function CancelMembershipPage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [checkingRole, setCheckingRole] = useState(true);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        router.replace("/profile");
        return;
      }

      const role = String(prof?.role ?? "").toLowerCase();

      if (role === "affiliate") {
        router.replace("/profile/enquiry");
        return;
      }

      setCheckingRole(false);
    })();
  }, [router, supabase]);

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center">
        <div className="text-white/70">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-xl mx-auto px-6 py-10 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-red-300">
            Cancel Membership
          </h1>
          <a
            href="/profile"
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl"
          >
            Back →
          </a>
        </div>

        <div className="mt-6 bg-white/5 rounded-2xl p-5">
          <p className="text-white/80">
            We’re sorry to see you go. Before we process your cancellation,
            please let us know why.
          </p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 w-full bg-white text-black rounded-xl p-3 min-h-[120px]"
            placeholder="Why are you cancelling?"
          />

          <button
            disabled={loading || reason.trim().length === 0}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/membership/cancel-request", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reason: reason.trim() }),
                });

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                  throw new Error(json?.error || "Couldn’t send request");
                }

                setReason("");
                window.location.href = "/thank-you/enquiry?from=cancel";
              } catch (e: any) {
                alert(e?.message || "Something went wrong.");
              } finally {
                setLoading(false);
              }
            }}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {loading ? "Sending…" : "Submit cancellation request"}
          </button>
        </div>

        <p className="mt-4 text-xs text-center italic text-white/50">
          Memberships remain active until confirmed by our team. If you're unsure,
          remember you can pause up to 6 weeks per year instead of cancelling.
        </p>
      </div>
    </div>
  );
}