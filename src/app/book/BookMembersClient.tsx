"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StickyCheckoutBar from "@/components/StickyCheckoutBar";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL_MINUTES = 15;
const MAX_CAPACITY = 8;

type BookMembersClientProps = {
  membershipExpiresAt?: string | null;
};

type AvailabilityBookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
};

type BookingBlockRow = {
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

type BookingNoticeRow = {
  id: number;
  notice_date: string;
  start_time: string | null;
  end_time: string | null;
  message: string;
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
    for (
      let minute = 0;
      minute < 60;
      minute += INTERVAL_MINUTES
    ) {
      slots.push(hour * 60 + minute);
    }
  }

  return slots;
}

function minutesToLabel(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = ((hour24 + 11) % 12) + 1;
  const formattedMinute = String(minute).padStart(2, "0");

  return `${hour12}:${formattedMinute} ${ampm}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBrisbaneDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getBrisbaneDateInputValue(
  value: string | null | undefined
) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return getBrisbaneDateString(date);
}

function getBrisbaneCurrentMinuteOfDay() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Brisbane",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? "0"
  );

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0"
  );

  return hour * 60 + minute;
}

function getNextDateString(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day + 1)
  );

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function BookMembersClient({
  membershipExpiresAt = null,
}: BookMembersClientProps) {
  const searchParams = useSearchParams();

  const rescheduleBookingId =
    searchParams.get("reschedule_booking_id");

  const today = getBrisbaneDateString();

  const maximumBookingDate =
    getBrisbaneDateInputValue(membershipExpiresAt);

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [duration, setDuration] =
    useState<number>(60);

  const [
    selectedStartMinute,
    setSelectedStartMinute,
  ] = useState<number | null>(null);

  const [
    autoMovedToNextDay,
    setAutoMovedToNextDay,
  ] = useState(false);

  const [bookings, setBookings] = useState<
    AvailabilityBookingRow[]
  >([]);

  const [bookingBlocks, setBookingBlocks] =
    useState<BookingBlockRow[]>([]);

  const [bookingNotices, setBookingNotices] =
    useState<BookingNoticeRow[]>([]);

  const [
    dismissedBlockNoticeKey,
    setDismissedBlockNoticeKey,
  ] = useState("");

  const [
    dismissedNoticeKey,
    setDismissedNoticeKey,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [pausedUntil, setPausedUntil] =
    useState<string | null>(null);

  const [
    rescheduleLoading,
    setRescheduleLoading,
  ] = useState(false);

  const [
    rescheduleError,
    setRescheduleError,
  ] = useState("");

  const [
    originalBooking,
    setOriginalBooking,
  ] = useState<ExistingBookingRow | null>(null);

  const slotMinutes = useMemo(
    () => generateSlotMinutes(),
    []
  );

  const peopleCount = 1;

  /*
   * Ensure the selected date cannot remain later than
   * the membership expiry date.
   */
  useEffect(() => {
    if (
      maximumBookingDate &&
      selectedDate > maximumBookingDate
    ) {
      setSelectedDate(maximumBookingDate);
      setSelectedStartMinute(null);
    }
  }, [maximumBookingDate, selectedDate]);

  /*
   * Load the original booking when rescheduling.
   */
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
        const response = await fetch(
          `/api/profile/bookings/${rescheduleBookingId}`,
          {
            cache: "no-store",
          }
        );

        const json = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            json?.error ||
              "Failed to load booking"
          );
        }

        const booking =
          (json?.booking ??
            null) as ExistingBookingRow | null;

        if (!booking) {
          throw new Error(
            "Booking not found"
          );
        }

        if (cancelled) {
          return;
        }

        setOriginalBooking(booking);

        if (booking.booking_date) {
          const originalDate =
            maximumBookingDate &&
            booking.booking_date >
              maximumBookingDate
              ? maximumBookingDate
              : booking.booking_date;

          setSelectedDate(originalDate);
        }

        if (booking.duration_minutes) {
          setDuration(
            Number(booking.duration_minutes)
          );
        }

        if (booking.start_time) {
          setSelectedStartMinute(
            timeToMinutes(
              booking.start_time
            )
          );
        }
      } catch (error: any) {
        if (!cancelled) {
          setOriginalBooking(null);

          setRescheduleError(
            error?.message ||
              "Failed to load booking"
          );
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
  }, [
    rescheduleBookingId,
    maximumBookingDate,
  ]);

  /*
   * Load bookings, blocks and notices for the
   * selected date.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `/api/bookings?date=${selectedDate}`,
          {
            cache: "no-store",
          }
        );

        const json = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            json?.error ||
              "Failed to load bookings"
          );
        }

        if (cancelled) {
          return;
        }

        setBookings(
          json?.bookings ?? []
        );

        setBookingBlocks(
          json?.bookingBlocks ?? []
        );

        setBookingNotices(
          json?.bookingNotices ?? []
        );
      } catch (error: any) {
        if (!cancelled) {
          setBookings([]);
          setBookingBlocks([]);
          setBookingNotices([]);

          setLoadError(
            error?.message ||
              "Failed to load bookings"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  /*
   * Calculate capacity usage for every
   * 15-minute period.
   */
  const occupancy = useMemo(() => {
    const occupancyByMinute: Record<
      number,
      number
    > = {};

    slotMinutes.forEach((minute) => {
      occupancyByMinute[minute] = 0;
    });

    bookings.forEach((booking) => {
      if (!booking.end_time) {
        return;
      }

      const bookingStart =
        timeToMinutes(
          booking.start_time
        );

      const bookingEnd =
        timeToMinutes(
          booking.end_time
        );

      const bookingSize =
        booking.people_count ?? 1;

      slotMinutes.forEach((slot) => {
        const slotStart = slot;
        const slotEnd =
          slot + INTERVAL_MINUTES;

        const overlaps =
          bookingStart < slotEnd &&
          bookingEnd > slotStart;

        if (overlaps) {
          occupancyByMinute[slot] =
            (occupancyByMinute[slot] ??
              0) + bookingSize;
        }
      });
    });

    return occupancyByMinute;
  }, [bookings, slotMinutes]);

  const isTodaySelected =
    selectedDate === today;

  const currentMinuteOfDay =
    getBrisbaneCurrentMinuteOfDay();

  function isPastStartTime(
    startMinute: number
  ) {
    if (!isTodaySelected) {
      return false;
    }

    return (
      startMinute <= currentMinuteOfDay
    );
  }

  function canFitBeforeClose(
    startMinute: number
  ) {
    return (
      startMinute + duration <=
      CLOSE_HOUR * 60
    );
  }

  function canStartAt(
    startMinute: number
  ) {
    if (
      isPastStartTime(startMinute)
    ) {
      return false;
    }

    const endMinute =
      startMinute + duration;

    const slotIsBlocked =
      bookingBlocks.some((block) => {
        if (block.is_full_day) {
          return true;
        }

        if (
          !block.start_time ||
          !block.end_time
        ) {
          return false;
        }

        const blockStart =
          timeToMinutes(
            block.start_time
          );

        const blockEnd =
          timeToMinutes(
            block.end_time
          );

        return (
          startMinute < blockEnd &&
          endMinute > blockStart
        );
      });

    if (slotIsBlocked) {
      return false;
    }

    const numberOfBlocks =
      duration / INTERVAL_MINUTES;

    for (
      let index = 0;
      index < numberOfBlocks;
      index++
    ) {
      const minute =
        startMinute +
        index * INTERVAL_MINUTES;

      if (!(minute in occupancy)) {
        return false;
      }

      const usedCapacity =
        occupancy[minute] ?? 0;

      if (
        usedCapacity + peopleCount >
        MAX_CAPACITY
      ) {
        return false;
      }
    }

    return true;
  }

  function spotsLeftForDuration(
    startMinute: number
  ) {
    const numberOfBlocks =
      duration / INTERVAL_MINUTES;

    let minimumSpotsLeft =
      MAX_CAPACITY;

    for (
      let index = 0;
      index < numberOfBlocks;
      index++
    ) {
      const minute =
        startMinute +
        index * INTERVAL_MINUTES;

      if (!(minute in occupancy)) {
        return 0;
      }

      const usedCapacity =
        occupancy[minute] ?? 0;

      minimumSpotsLeft = Math.min(
        minimumSpotsLeft,
        MAX_CAPACITY - usedCapacity
      );
    }

    return Math.max(
      0,
      minimumSpotsLeft
    );
  }

  const activeBlockNotice =
    useMemo(() => {
      const nowMinute =
        getBrisbaneCurrentMinuteOfDay();

      const currentDate =
        getBrisbaneDateString();

      return bookingBlocks.find(
        (block) => {
          if (!block.reason) {
            return false;
          }

          if (block.is_full_day) {
            return (
              selectedDate !==
                currentDate ||
              nowMinute <
                CLOSE_HOUR * 60
            );
          }

          if (
            !block.start_time ||
            !block.end_time
          ) {
            return false;
          }

          const blockEnd =
            timeToMinutes(
              block.end_time
            );

          if (
            selectedDate ===
              currentDate &&
            nowMinute >= blockEnd
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      bookingBlocks,
      selectedDate,
    ]);

  const activeNotice =
    useMemo(() => {
      const nowMinute =
        getBrisbaneCurrentMinuteOfDay();

      const currentDate =
        getBrisbaneDateString();

      return bookingNotices.find(
        (notice) => {
          if (!notice.message) {
            return false;
          }

          const hasTimedRange =
            Boolean(
              notice.start_time &&
                notice.end_time
            );

          if (!hasTimedRange) {
            return (
              selectedDate !==
                currentDate ||
              nowMinute <
                CLOSE_HOUR * 60
            );
          }

          if (
            !notice.start_time ||
            !notice.end_time
          ) {
            return false;
          }

          const noticeEnd =
            timeToMinutes(
              notice.end_time
            );

          if (
            selectedDate ===
              currentDate &&
            nowMinute >= noticeEnd
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      bookingNotices,
      selectedDate,
    ]);

  /*
   * Move from today to tomorrow automatically
   * when today has no remaining available slots.
   *
   * Do not move past the user's membership expiry.
   */
  useEffect(() => {
    const currentDate =
      getBrisbaneDateString();

    if (
      selectedDate !== currentDate
    ) {
      setAutoMovedToNextDay(false);
      return;
    }

    const hasAvailableSlot =
      slotMinutes.some(
        (startMinute) =>
          canFitBeforeClose(
            startMinute
          ) &&
          canStartAt(startMinute)
      );

    if (hasAvailableSlot) {
      setAutoMovedToNextDay(false);
      return;
    }

    const tomorrow =
      getNextDateString(
        selectedDate
      );

    if (
      maximumBookingDate &&
      tomorrow > maximumBookingDate
    ) {
      setAutoMovedToNextDay(false);
      return;
    }

    if (tomorrow !== selectedDate) {
      setSelectedDate(tomorrow);

      setSelectedStartMinute(null);

      setAutoMovedToNextDay(true);
    }
  }, [
    selectedDate,
    duration,
    bookings,
    bookingBlocks,
    slotMinutes,
    maximumBookingDate,
  ]);

  const selectedEndMinute =
    selectedStartMinute !== null
      ? selectedStartMinute + duration
      : null;

  async function handleBook() {
    if (
      selectedStartMinute === null
    ) {
      return;
    }

    setSubmitting(true);
    setPausedUntil(null);

    try {
      const response = await fetch(
        "/api/bookings/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            booking_date:
              selectedDate,
            start_minute:
              selectedStartMinute,
            duration_minutes:
              duration,
            people_count: 1,
            reschedule_booking_id:
              originalBooking?.id ??
              null,
          }),
        }
      );

      const json = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        if (json?.paused_until) {
          setPausedUntil(
            json.paused_until
          );
        }

        throw new Error(
          json?.error ||
            "Booking failed"
        );
      }

      if (!json?.booking_id) {
        throw new Error(
          "Missing booking reference"
        );
      }

      const params =
        new URLSearchParams({
          booking_id: String(
            json.booking_id
          ),
          booking_date:
            selectedDate,
          start_minute: String(
            selectedStartMinute
          ),
          duration_minutes:
            String(duration),
        });

      window.location.href =
        `/book/success?${params.toString()}`;
    } catch (error: any) {
      alert(
        error?.message ||
          "Booking failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title = originalBooking
    ? "Reschedule Booking"
    : "Members Booking";

  const buttonText =
    originalBooking
      ? "Confirm reschedule"
      : "Book now";

  const blockNoticeKey =
    activeBlockNotice
      ? `${selectedDate}-${activeBlockNotice.start_time ?? "full"}-${activeBlockNotice.end_time ?? "day"}`
      : "";

  const bookingNoticeKey =
    activeNotice
      ? `${selectedDate}-${activeNotice.id}-${activeNotice.start_time ?? "full"}-${activeNotice.end_time ?? "day"}`
      : "";

  return (
    <>
      {activeBlockNotice &&
      dismissedBlockNoticeKey !==
        blockNoticeKey ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center text-black shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-black/50">
              Notice
            </div>

            <h2 className="mt-3 text-2xl font-semibold">
              Booking notice for{" "}
              {selectedDate}
            </h2>

            <p className="mt-4 text-sm leading-6 text-black/70">
              {activeBlockNotice.reason}
            </p>

            <button
              type="button"
              onClick={() =>
                setDismissedBlockNoticeKey(
                  blockNoticeKey
                )
              }
              className="mt-6 w-full rounded-2xl bg-black py-4 font-semibold text-white"
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}

      {activeNotice &&
      dismissedNoticeKey !==
        bookingNoticeKey ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center text-black shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-black/50">
              Important Information
            </div>

            <h2 className="mt-3 text-2xl font-semibold">
              Please read before
              booking
            </h2>

            <p className="mt-4 text-sm leading-6 text-black/70">
              {activeNotice.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setDismissedNoticeKey(
                  bookingNoticeKey
                )
              }
              className="mt-6 w-full rounded-2xl bg-black py-4 font-semibold text-white"
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative min-h-screen overflow-hidden bg-[#160d0a] pb-28 text-[#fff7ec]">
        <div className="pointer-events-none fixed inset-0 opacity-70">
          <div className="absolute left-[-20%] top-[-10%] h-96 w-96 rounded-full bg-[#5b392a]/35 blur-3xl" />

          <div className="absolute bottom-[-20%] right-[-15%] h-[28rem] w-[28rem] rounded-full bg-emerald-900/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto max-w-xl px-6 py-10">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl font-semibold">
                {title}
              </h1>

              <a
                href="/profile"
                className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
              >
                Profile →
              </a>
            </div>

            <p className="mt-2 text-center text-white/70">
              {originalBooking
                ? "Choose a new date, duration, then pick a new start time."
                : "Choose date, duration, then pick a start time."}
            </p>

            {rescheduleError ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
                {rescheduleError}
              </div>
            ) : null}

            <div className="mt-6 mb-6 space-y-4">
              {membershipExpiresAt ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                  <div className="font-semibold text-amber-100">
                    Access expiry
                  </div>

                  <div className="mt-1 text-sm text-white/80">
                    Your unlimited
                    access expires on{" "}
                    <span className="font-semibold text-white">
                      {formatDateTime(
                        membershipExpiresAt
                      )}
                    </span>
                    . Your booking must
                    begin before this
                    time.
                  </div>
                </div>
              ) : null}

              <input
                type="date"
                min={today}
                max={
                  maximumBookingDate
                }
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(
                    event.target.value
                  );

                  setSelectedStartMinute(
                    null
                  );

                  setPausedUntil(null);
                  setAutoMovedToNextDay(
                    false
                  );
                }}
                className="w-full max-w-full box-border appearance-none rounded-xl bg-white p-3 text-black"
              />

              <select
                value={duration}
                onChange={(event) => {
                  setDuration(
                    Number(
                      event.target.value
                    )
                  );

                  setSelectedStartMinute(
                    null
                  );

                  setPausedUntil(null);
                }}
                className="w-full rounded-xl bg-white p-3 text-black"
              >
                <option value={60}>
                  1 hour
                </option>

                <option value={90}>
                  1.5 hours
                </option>

                <option value={120}>
                  2 hours
                </option>
              </select>

              {pausedUntil ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-500/15 p-4">
                  <div className="font-semibold text-amber-200">
                    Membership Paused
                  </div>

                  <div className="mt-1 text-sm text-white/80">
                    You can book again
                    after{" "}
                    <span className="font-semibold text-white">
                      {formatDateTime(
                        pausedUntil
                      )}
                    </span>
                    .
                  </div>
                </div>
              ) : null}

              {originalBooking ? (
                <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">
                  Rescheduling booking #
                  {originalBooking.id}
                </div>
              ) : null}

              <div className="text-sm text-white/70">
                {loading ||
                rescheduleLoading
                  ? "Loading availability..."
                  : null}

                {!loading &&
                !rescheduleLoading &&
                loadError ? (
                  <span className="text-red-300">
                    {loadError}
                  </span>
                ) : null}

                {!loading &&
                !rescheduleLoading &&
                !loadError ? (
                  <span>
                    15-min start times •
                    Capacity{" "}
                    {MAX_CAPACITY}
                  </span>
                ) : null}
              </div>
            </div>

            {autoMovedToNextDay ? (
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
                No slots remained for
                today, so we moved you
                to tomorrow’s
                availability.
              </div>
            ) : null}

            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {slotMinutes
                .filter(
                  (minute) =>
                    !isPastStartTime(
                      minute
                    )
                )
                .filter(
                  (minute) =>
                    canFitBeforeClose(
                      minute
                    )
                )
                .map((minute) => {
                  const label =
                    minutesToLabel(
                      minute
                    );

                  const isValid =
                    canStartAt(minute);

                  const spotsLeft =
                    spotsLeftForDuration(
                      minute
                    );

                  const isFull =
                    !isValid ||
                    spotsLeft <= 0;

                  const isSelected =
                    selectedStartMinute ===
                    minute;

                  return (
                    <button
                      key={minute}
                      type="button"
                      disabled={
                        isFull ||
                        loading ||
                        submitting ||
                        rescheduleLoading
                      }
                      onClick={() =>
                        setSelectedStartMinute(
                          minute
                        )
                      }
                      className={`w-full rounded-xl p-4 text-left transition ${
                        isFull ||
                        loading ||
                        submitting ||
                        rescheduleLoading
                          ? "cursor-not-allowed bg-red-900/40 text-white/50"
                          : isSelected
                            ? "bg-white text-black"
                            : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">
                          {label}
                        </span>

                        <span className="text-sm">
                          {isFull
                            ? "Full"
                            : `${spotsLeft} of ${MAX_CAPACITY} spots left`}
                        </span>
                      </div>

                      {isSelected &&
                      selectedEndMinute !==
                        null ? (
                        <div className="mt-2 text-sm opacity-80">
                          {minutesToLabel(
                            minute
                          )}{" "}
                          →{" "}
                          {minutesToLabel(
                            selectedEndMinute
                          )}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
            </div>

            <StickyCheckoutBar
              title={
                selectedStartMinute !==
                null
                  ? buttonText
                  : "Select a time"
              }
              summaryLeft={
                selectedStartMinute !==
                null
                  ? `${selectedDate} • ${minutesToLabel(
                      selectedStartMinute
                    )}`
                  : "Pick a start time to continue"
              }
              summaryRight={`${duration} mins • 1 person`}
              totalLabel="Included"
              disabled={
                selectedStartMinute ===
                  null ||
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
      </div>
    </>
  );
}