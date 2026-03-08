"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StickyCheckoutBar from "@/components/StickyCheckoutBar";
import TopNav from "@/components/TopNav";
import HeaderSpacer from "@/components/HeaderSpacer";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL_MINUTES = 15;
const MAX_CAPACITY = 8;
const WAIVER_STORAGE_KEY = "lax_health_waiver_ok";

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

function formatAUD(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

const PRICE_BY_DURATION_CENTS: Record<number, number> = {
  60: 1500,
  90: 2000,
  120: 2500,
};

function SingleEntryBookingPageContent() {
  const searchParams = useSearchParams();
  const rescheduleBookingId = searchParams.get("reschedule_booking_id");

  const waiverRef = useRef<HTMLDivElement | null>(null);

  const [selectedDate, setSelectedDate] = useState(getBrisbaneDateString());
  const [duration, setDuration] = useState<number>(60);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [selectedStartMinute, setSelectedStartMinute] = useState<number | null>(
    null
  );

  const [bookings, setBookings] = useState<AvailabilityBookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");
  const [paying, setPaying] = useState<boolean>(false);

  const [discountCode, setDiscountCode] = useState<string>("");
  const [waiverOk, setWaiverOk] = useState(false);
  const [waiverError, setWaiverError] = useState("");

  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [originalBooking, setOriginalBooking] =
    useState<ExistingBookingRow | null>(null);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showRescheduleSuccessModal, setShowRescheduleSuccessModal] =
    useState(false);

  const slotMinutes = useMemo(() => generateSlotMinutes(), []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(WAIVER_STORAGE_KEY);
      if (saved === "true") {
        setWaiverOk(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (waiverOk) {
        window.localStorage.setItem(WAIVER_STORAGE_KEY, "true");
      } else {
        window.localStorage.removeItem(WAIVER_STORAGE_KEY);
      }
    } catch {}
  }, [waiverOk]);

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

          if (booking.people_count) {
            setPeopleCount(Number(booking.people_count));
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

  const selectedTimeIsInvalid =
    selectedStartMinute !== null && !canStartAt(selectedStartMinute);

  const unit = PRICE_BY_DURATION_CENTS[duration] ?? 0;
  const total = unit * peopleCount;

  function scrollToWaiver() {
    waiverRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function getAvailabilityTextClass(left: number, isUnavailable: boolean) {
    if (isUnavailable) return "text-red-200";
    if (left <= 1) return "text-red-300";
    if (left <= 2) return "text-orange-300";
    if (left <= 4) return "text-yellow-200";
    return "text-white/80";
  }

  function getSlotClass(args: {
    isUnavailable: boolean;
    isSelected: boolean;
    left: number;
    isPast: boolean;
  }) {
    const { isUnavailable, isSelected, left, isPast } = args;

    if (isSelected) {
      return "bg-white text-black ring-2 ring-white";
    }

    if (isUnavailable) {
      if (isPast) {
        return "bg-white/5 text-white/35 cursor-not-allowed border border-white/5";
      }
      return "bg-red-900/35 text-white/50 cursor-not-allowed border border-red-400/10";
    }

    if (left <= 1) {
      return "bg-red-500/15 border border-red-400/30 hover:bg-red-500/20";
    }

    if (left <= 2) {
      return "bg-orange-500/15 border border-orange-400/30 hover:bg-orange-500/20";
    }

    return "bg-white/10 border border-white/10 hover:bg-white/20";
  }

  const handlePayAndConfirm = async () => {
    if (selectedStartMinute === null) return;

    if (selectedTimeIsInvalid) {
      return;
    }

    if (!waiverOk) {
      setWaiverError("Please agree to the Health Waiver before continuing.");
      scrollToWaiver();
      return;
    }

    setWaiverError("");
    setPaying(true);

    try {
      if (originalBooking) {
        const res = await fetch("/api/profile/bookings/reschedule-single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_date: selectedDate,
            start_minute: selectedStartMinute,
            duration_minutes: duration,
            people_count: peopleCount,
            reschedule_booking_id: originalBooking.id,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          alert(json?.error || "Failed to reschedule booking");
          return;
        }

        setShowRescheduleSuccessModal(true);

        window.setTimeout(() => {
          window.location.href = "/profile";
        }, 1400);

        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: selectedDate,
          start_minute: selectedStartMinute,
          duration_minutes: duration,
          people_count: peopleCount,
          discount_code: discountCode.trim(),
          reschedule_booking_id: null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        alert(json?.error || "Failed to start checkout");
        return;
      }

      if (!json?.url) {
        alert("No checkout URL returned");
        return;
      }

      setShowCheckoutModal(true);

      window.setTimeout(() => {
        window.location.href = json.url;
      }, 700);
    } catch (e: any) {
      alert(e?.message || "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  const stickySummaryLeft =
    selectedStartMinute !== null
      ? `${selectedDate} • ${minutesToLabel(selectedStartMinute)}`
      : "Pick a start time";

  const stickySummaryRight = `${duration} mins • ${peopleCount} ${
    peopleCount === 1 ? "person" : "people"
  }`;

  const title = originalBooking ? "Reschedule Single Entry" : "Single Entry";
  const buttonText = originalBooking ? "Confirm Reschedule" : "Pay & Confirm";

  return (
    <>
      <div className="min-h-screen bg-emerald-950 text-white pb-28">
        <TopNav />
        <HeaderSpacer />

        <div className="max-w-xl mx-auto px-4 py-6">
          <h1 className="text-3xl text-white text-center font-semibold">
            {title}
          </h1>

          <p className="mt-2 text-white/70">
            {originalBooking
              ? "Choose your new date, people and duration, then confirm your reschedule."
              : "Choose date, people, duration, then pay to confirm."}
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
              }}
              className="w-full bg-white text-black p-3 rounded-xl"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value));
                  setSelectedStartMinute(null);
                }}
                className="w-full bg-white text-black p-3 rounded-xl"
              >
                <option value={60}>1 hour — {formatAUD(1500)} pp</option>
                <option value={90}>1.5 hours — {formatAUD(2000)} pp</option>
                <option value={120}>2 hours — {formatAUD(2500)} pp</option>
              </select>

              <select
                value={peopleCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPeopleCount(v);
                  setSelectedStartMinute(null);
                }}
                className="w-full bg-white text-black p-3 rounded-xl"
              >
                {Array.from({ length: 8 }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "person" : "people"}
                    </option>
                  );
                })}
              </select>
            </div>

            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Discount code"
              className="w-full bg-white text-black p-3 rounded-xl uppercase"
            />

            <div className="text-xs text-white/60 -mt-2">
              Enter a code if you have one.
            </div>

            <div
              ref={waiverRef}
              className={`rounded-2xl p-4 transition ${
                waiverError
                  ? "bg-red-500/10 ring-1 ring-red-400/30"
                  : "bg-white/10"
              }`}
            >
              <label className="flex items-start gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={waiverOk}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWaiverOk(checked);

                    if (checked) {
                      setWaiverError("");
                    }
                  }}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I have read and agree to the{" "}
                  <a
                    href="/health-waiver"
                    className="underline hover:text-white"
                  >
                    Health Waiver
                  </a>
                  .
                </span>
              </label>

              <div className="mt-2 text-xs text-white/50">
                Once accepted, we’ll remember this on this device.
              </div>

              {waiverError ? (
                <p className="mt-3 text-sm text-red-300">{waiverError}</p>
              ) : null}
            </div>

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
                <span>
                  15-min start times • Capacity {MAX_CAPACITY}
                  {isTodaySelected ? " • Past times hidden/disabled automatically" : ""}
                </span>
              ) : null}
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-white/80">Total</div>
                <div className="text-lg font-semibold">{formatAUD(total)}</div>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {formatAUD(unit)} per person × {peopleCount}
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {slotMinutes
              .filter((m) => !isPastStartTime(m))
              .filter((m) => canFitBeforeClose(m))
              .map((m) => {
                const label = minutesToLabel(m);
                const left = spotsLeftForDuration(m);
                const isPast = isPastStartTime(m);
                const isUnavailable =
                  loading || rescheduleLoading || !canStartAt(m) || left <= 0;
                const isSelected = selectedStartMinute === m;

                let statusText = `${left} of ${MAX_CAPACITY} spots left`;

                if (isPast) {
                  statusText = "Passed";
                } else if (isUnavailable) {
                  statusText = "Full";
                } else if (left <= 1) {
                  statusText = `${left} spot left`;
                }

                return (
                  <button
                    key={m}
                    disabled={isUnavailable || paying}
                    onClick={() => setSelectedStartMinute(m)}
                    className={`w-full text-left p-4 rounded-xl transition ${getSlotClass(
                      {
                        isUnavailable,
                        isSelected,
                        left,
                        isPast,
                      }
                    )}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-lg font-medium">{label}</span>
                      <span
                        className={`text-sm ${getAvailabilityTextClass(
                          left,
                          isUnavailable
                        )}`}
                      >
                        {statusText}
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
            summaryLeft={stickySummaryLeft}
            summaryRight={stickySummaryRight}
            totalLabel={formatAUD(total)}
            disabled={
              selectedStartMinute === null ||
              loading ||
              rescheduleLoading ||
              paying ||
              selectedTimeIsInvalid
            }
            loading={paying}
            buttonText={buttonText}
            onClick={handlePayAndConfirm}
          />
        </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-black">
              Redirecting to secure checkout
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/60">
              Your booking details are ready. Taking you to payment now.
            </p>
          </div>
        </div>
      )}

      {showRescheduleSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-black">
              Booking updated
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/60">
              Your reschedule has been confirmed. Redirecting you back to your
              profile.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function SingleEntryBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 text-white">
          <TopNav />
          <HeaderSpacer />
          <div className="max-w-xl mx-auto px-4 py-10">
            <div className="text-white/80">Loading booking page...</div>
          </div>
        </div>
      }
    >
      <SingleEntryBookingPageContent />
    </Suspense>
  );
}