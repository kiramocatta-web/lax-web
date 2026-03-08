"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifyResponse = {
  id: string;
  payment_status: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string> | null;
  customer_email: string | null;
  booking_created?: boolean;
};

export default function BookSuccessClient() {
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");

  const fallbackBookingDate = searchParams.get("booking_date");
  const fallbackStartMinute = searchParams.get("start_minute");
  const fallbackDurationMinutes = searchParams.get("duration_minutes");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSuccessState() {
      if (!sessionId && !bookingId) {
        throw new Error("Missing booking reference");
      }

      if (!sessionId && bookingId) {
        return {
          id: bookingId,
          payment_status: "paid",
          amount_total: null,
          currency: null,
          metadata: {
            booking_date: fallbackBookingDate ?? "",
            start_minute: fallbackStartMinute ?? "",
            duration_minutes: fallbackDurationMinutes ?? "",
          },
          customer_email: null,
          booking_created: true,
        } satisfies VerifyResponse;
      }

      const res = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(json?.error || text || "Failed to verify session");
      }

      return json as VerifyResponse;
    }

    (async () => {
      setLoading(true);
      setError("");

      try {
        let latest: VerifyResponse | null = null;

        if (!sessionId && bookingId) {
          latest = await loadSuccessState();
        } else {
          for (let i = 0; i < 12; i++) {
            latest = await loadSuccessState();

            if (!latest) break;

            if (
              latest.payment_status === "paid" ||
              latest.payment_status === "unpaid"
            ) {
              break;
            }

            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!cancelled) {
          setData(latest);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    bookingId,
    fallbackBookingDate,
    fallbackStartMinute,
    fallbackDurationMinutes,
  ]);

  useEffect(() => {
    if (loading || error) return;

    const isSuccess = data?.payment_status === "paid" || Boolean(bookingId);
    if (!isSuccess) return;

    const params = new URLSearchParams();

    if (sessionId) params.set("session_id", sessionId);
    if (bookingId) params.set("booking_id", bookingId);
    if (fallbackBookingDate) params.set("booking_date", fallbackBookingDate);
    if (fallbackStartMinute) params.set("start_minute", fallbackStartMinute);
    if (fallbackDurationMinutes) {
      params.set("duration_minutes", fallbackDurationMinutes);
    }

    const timer = setTimeout(() => {
      window.location.href = `/thank-you/booking?${params.toString()}`;
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    loading,
    error,
    data,
    sessionId,
    bookingId,
    fallbackBookingDate,
    fallbackStartMinute,
    fallbackDurationMinutes,
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/booking-thankyou.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          {error ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-red-900/40 p-5 backdrop-blur">
              <div className="text-2xl font-semibold">
                Couldn’t confirm booking
              </div>
              <div className="mt-2 text-sm text-white/80">{error}</div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-semibold sm:text-5xl">
                Confirming booking...
              </h1>

              <p className="mt-4 text-lg text-white/90 sm:text-xl">
                Please wait while we finalise your booking.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}