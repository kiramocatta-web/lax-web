"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Booking = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  people_count: number;
  status: string;
  booking_type: string;
  customer_email: string | null;
};

type VerifyResponse = {
  id: string;
  payment_status: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string>;
  customer_email: string | null;
  booking_created?: boolean;
  booking?: Booking;
};

function formatTime(t: string) {
  const [hh, mm] = t.split(":");
  const d = new Date();
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function BookSuccessPageContent() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sessionId) {
        setErr("Missing session_id");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Failed to verify session");

        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to verify session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const amount =
    data?.amount_total != null
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
        }).format(data.amount_total / 100)
      : "—";

  const paid =
    data?.payment_status === "paid" ||
    data?.payment_status === "no_payment_required";

  const b = data?.booking;

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-white/80">Verifying payment…</div>
        ) : err ? (
          <div className="text-red-300">
            {err}
            <div className="mt-6">
              <a
                href="/book/single"
                className="inline-block bg-white text-black px-5 py-3 rounded-xl font-semibold"
              >
                Back to Single Entry
              </a>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold">
              {paid ? "Membership Started ✅" : "Payment pending"}
            </h1>

            <p className="mt-2 text-white/70">
              Status: {data?.payment_status ?? "—"}
            </p>

            <div className="mt-6 bg-white/10 rounded-2xl p-4 space-y-2">
              {b ? (
                <>
                  <div className="text-sm text-white/70">
                    Date: <span className="text-white">{b.booking_date}</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Time:{" "}
                    <span className="text-white">
                      {formatTime(b.start_time)} → {formatTime(b.end_time)}
                    </span>
                  </div>
                  <div className="text-sm text-white/70">
                    People: <span className="text-white">{b.people_count}</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Amount: <span className="text-white">{amount}</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Email: <span className="text-white">
                      {b.customer_email ?? "—"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-white/70">
                    Session: <span className="text-white">{data?.id}</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Amount: <span className="text-white">{amount}</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Email: <span className="text-white">
                      {data?.customer_email ?? "—"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <a
                href="/book/single"
                className="bg-white text-black px-5 py-3 rounded-xl font-semibold"
              >
                Book another session
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 text-white">
          <div className="max-w-xl mx-auto px-4 py-10">
            <div className="text-white/80">Loading...</div>
          </div>
        </div>
      }
    >
      <BookSuccessPageContent />
    </Suspense>
  );
}