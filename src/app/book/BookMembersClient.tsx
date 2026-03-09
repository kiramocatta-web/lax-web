"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StickyCheckoutBar from "@/components/StickyCheckoutBar";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL_MINUTES = 15;
const MAX_CAPACITY = 8;


type AvailabilityBookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
};

type ExistingBookingRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  total_amount_cents: number | null;
  booking_type: string | null;
  status: string | null;
};

function generateSlotMinutes() {
  const slots: number[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let min = 0; min < 60; min += INTERVAL_MINUTES) {
      slots.push(hour * 60 + min);
    }
  }
  return slots;
}

function minutesToLabel(totalMinutes: number) {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":");
  return Number(hh) * 60 + Number(mm);
}

function formatPausedUntil(pausedUntilISO: string) {
  const d = new Date(pausedUntilISO);
  if (Number.isNaN(d.getTime())) return pausedUntilISO;

  return d.toLocaleString("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBrisbaneDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getBrisbaneCurrentMinuteOfDay() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Brisbane",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

export default function BookMembersClient() {
  const searchParams = useSearchParams();
  const rescheduleBookingId = searchParams.get("reschedule_booking_id");

  const [selectedDate, setSelectedDate] = useState(getBrisbaneDateString());
  const [duration, setDuration] = useState<number>(60);
  const [selectedStartMinute, setSelectedStartMinute] = useState<number | null>(
    null
  );

  const [bookings, setBookings] = useState<AvailabilityBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);

  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [originalBooking, setOriginalBooking] =
    useState<ExistingBookingRow | null>(null);

  const slotMinutes = useMemo(() => generateSlotMinutes(), []);
  const peopleCount = 1;

  useEffect(() => {
    let cancelled = false;

    async function loadOriginalBooking() {
      if (!rescheduleBookingId) {
        setOriginalBooking(null);
        setRescheduleError("");
        return;
      }

      setRescheduleLoading(true);
      setRescheduleError("");

      try {
        const res = await fetch(`/api/profile/bookings/${rescheduleBookingId}`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load booking");
        }

        const booking = (json?.booking ?? null) as ExistingBookingRow | null;
        if (!booking) {
          throw new Error("Booking not found");
        }

        if (!cancelled) {
          setOriginalBooking(booking);

          if (booking.booking_date) {
            setSelectedDate(booking.booking_date);
          }

          if (booking.duration_minutes) {
            setDuration(Number(booking.duration_minutes));
          }

          if (booking.start_time) {
            setSelectedStartMinute(timeToMinutes(booking.start_time));
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setOriginalBooking(null);
          setRescheduleError(e?.message || "Failed to load booking");
        }
      } finally {
        if (!cancelled) {
          setRescheduleLoading(false);
        }
      }
    }

    loadOriginalBooking();

    return () => {
      cancelled = true;
    };
  }, [rescheduleBookingId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError("");

      try {
        const res = await fetch(`/api/bookings?date=${selectedDate}`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load bookings");
        }

        if (!cancelled) {
          setBookings(json?.bookings ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setBookings([]);
          setLoadError(e?.message || "Failed to load bookings");
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
  }, [selectedDate]);

  const occupancy = useMemo(() => {
    const occ: Record<number, number> = {};
    slotMinutes.forEach((m) => {
      occ[m] = 0;
    });

    bookings.forEach((b) => {
      if (!b.end_time) return;

      const start = timeToMinutes(b.start_time);
      const end = timeToMinutes(b.end_time);
      const size = b.people_count ?? 1;

      slotMinutes.forEach((slot) => {
        const slotStart = slot;
        const slotEnd = slot + INTERVAL_MINUTES;
        const overlaps = start < slotEnd && end > slotStart;

        if (overlaps) {
          occ[slot] = (occ[slot] ?? 0) + size;
        }
      });
    });

    return occ;
  }, [bookings, slotMinutes]);

  const isTodaySelected = selectedDate === getBrisbaneDateString();
  const currentMinuteOfDay = getBrisbaneCurrentMinuteOfDay();

  const isPastStartTime = (startMinute: number) => {
    if (!isTodaySelected) return false;
    return startMinute <= currentMinuteOfDay;
  };

  const canStartAt = (startMinute: number) => {
    if (isPastStartTime(startMinute)) return false;

    const blocks = duration / INTERVAL_MINUTES;

    for (let i = 0; i < blocks; i++) {
      const m = startMinute + i * INTERVAL_MINUTES;

      if (!(m in occupancy)) return false;

      const used = occupancy[m] ?? 0;
      if (used + peopleCount > MAX_CAPACITY) return false;
    }

    return true;
  };

  const canFitBeforeClose = (startMinute: number) => {
  return startMinute + duration <= CLOSE_HOUR * 60;
};

  const spotsLeftForDuration = (startMinute: number) => {
    const blocks = duration / INTERVAL_MINUTES;
    let minLeft = MAX_CAPACITY;

    for (let i = 0; i < blocks; i++) {
      const m = startMinute + i * INTERVAL_MINUTES;

      if (!(m in occupancy)) return 0;

      const used = occupancy[m] ?? 0;
      minLeft = Math.min(minLeft, MAX_CAPACITY - used);
    }

    return Math.max(0, minLeft);
  };

  const selectedEndMinute =
    selectedStartMinute !== null ? selectedStartMinute + duration : null;

  const handleBook = async () => {
    if (selectedStartMinute === null) return;

    setSubmitting(true);
    setPausedUntil(null);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: selectedDate,
          start_minute: selectedStartMinute,
          duration_minutes: duration,
          people_count: 1,
          reschedule_booking_id: originalBooking?.id ?? null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.paused_until) {
          setPausedUntil(json.paused_until);
        }

        throw new Error(json?.error || "Booking failed");
      }

      if (json?.booking_id) {
        window.location.href = `/book/success?booking_id=${json.booking_id}&booking_date=${selectedDate}&start_minute=${selectedStartMinute}&duration_minutes=${duration}`;
        return;
      }

      throw new Error("Missing booking reference");
    } catch (e: any) {
      alert(e?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const title = originalBooking ? "Reschedule Booking" : "Members Booking";
  const buttonText = originalBooking ? "Confirm reschedule" : "Book now";

  return (
    <div className="min-h-screen bg-emerald-950 text-white pb-28">

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">{title}</h1>

          <a
            href="/profile"
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl"
          >
            Profile →
          </a>
        </div>

        <p className="mt-2 text-white/70">
          {originalBooking
            ? "Choose a new date, duration, then pick a new start time."
            : "Choose date, duration, then pick a start time."}
        </p>

        {rescheduleError ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            {rescheduleError}
          </div>
        ) : null}

        <div className="space-y-4 mt-6 mb-6">
          <input
            type="date"
            min={getBrisbaneDateString()}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedStartMinute(null);
              setPausedUntil(null);
            }}
            className="w-full max-w-full  box-border bg-white text-black p-3 rounded-xl appearance-none"
          />

          <select
            value={duration}
            onChange={(e) => {
              setDuration(Number(e.target.value));
              setSelectedStartMinute(null);
              setPausedUntil(null);
            }}
            className="w-full bg-white text-black p-3 rounded-xl"
          >
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>

          {pausedUntil ? (
            <div className="bg-amber-500/15 border border-amber-300/20 rounded-2xl p-4">
              <div className="font-semibold text-amber-200">
                Membership Paused
              </div>

              <div className="text-sm text-white/80 mt-1">
                You can book again after{" "}
                <span className="text-white font-semibold">
                  {formatPausedUntil(pausedUntil)}
                </span>
                .
              </div>
            </div>
          ) : null}

          {originalBooking ? (
            <div className="bg-white/10 rounded-2xl p-4 text-sm text-white/80">
              Rescheduling booking #{originalBooking.id}
            </div>
          ) : null}

          <div className="text-sm text-white/70">
            {loading || rescheduleLoading ? "Loading availability..." : null}
            {!loading && !rescheduleLoading && loadError ? (
              <span className="text-red-300">{loadError}</span>
            ) : null}
            {!loading && !rescheduleLoading && !loadError ? (
              <span>15-min start times • Capacity {MAX_CAPACITY}</span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {slotMinutes
  .filter((m) => !isPastStartTime(m))
  .filter((m) => canFitBeforeClose(m))
  .map((m) => {
              const label = minutesToLabel(m);
              const isValid = canStartAt(m);
              const left = spotsLeftForDuration(m);
              const isFull = !isValid || left <= 0;
              const isSelected = selectedStartMinute === m;

              return (
                <button
                  key={m}
                  disabled={isFull || loading || submitting || rescheduleLoading}
                  onClick={() => setSelectedStartMinute(m)}
                  className={`w-full text-left p-4 rounded-xl transition ${
                    isFull || loading || submitting || rescheduleLoading
                      ? "bg-red-900/40 text-white/50 cursor-not-allowed"
                      : isSelected
                      ? "bg-white text-black"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">{label}</span>
                    <span className="text-sm">
                      {isFull ? "Full" : `${left} of ${MAX_CAPACITY} spots left`}
                    </span>
                  </div>

                  {isSelected && selectedEndMinute !== null ? (
                    <div className="mt-2 text-sm opacity-80">
                      {minutesToLabel(m)} → {minutesToLabel(selectedEndMinute)}
                    </div>
                  ) : null}
                </button>
              );
            })}
        </div>

        <StickyCheckoutBar
          title={selectedStartMinute !== null ? buttonText : "Select a time"}
          summaryLeft={
            selectedStartMinute !== null
              ? `${selectedDate} • ${minutesToLabel(selectedStartMinute)}`
              : "Pick a start time to continue"
          }
          summaryRight={`${duration} mins • 1 person`}
          totalLabel="Included"
          disabled={
            selectedStartMinute === null ||
            loading ||
            submitting ||
            rescheduleLoading
          }
          loading={submitting}
          buttonText={buttonText}
          onClick={handleBook}
        />
      </div>
    </div>
  );
}