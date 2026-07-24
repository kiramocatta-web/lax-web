"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type BookingEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: {
    bookingType?: string;
    customerName?: string | null;
    customerEmail?: string | null;
    peopleCount?: number | null;
    status?: string | null;
    amount?: number | null;
    notes?: string | null;
  };
};

function formatMoney(amount?: number | null) {
  if (amount == null) return "-";

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export default function BookingsCalendarClient() {
  const [selectedEvent, setSelectedEvent] =
    useState<BookingEvent | null>(null);

  const [search, setSearch] = useState("");

  const eventsUrl = useMemo(() => {
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      return "/api/admin/bookings-calendar";
    }

    return `/api/admin/bookings-calendar?search=${encodeURIComponent(
      trimmedSearch
    )}`;
  }, [search]);

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Internal Bookings Calendar
          </h1>

          <p className="mt-2 text-white/70">
            Admin-only master view of all bookings.
          </p>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
          <label
            htmlFor="booking-search"
            className="mb-2 block text-sm font-medium text-white/80"
          >
            Search bookings
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="booking-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name or email"
              className="w-full rounded-2xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-2xl border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur sm:p-5">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="calendar-shell p-2 text-slate-900 sm:p-4">
              <FullCalendar
                key={eventsUrl}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                ]}
                initialView="timeGridWeek"
                firstDay={1}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                height="auto"
                nowIndicator={true}
                allDaySlot={false}
                slotMinTime="05:00:00"
                slotMaxTime="22:00:00"
                expandRows={true}
                events={eventsUrl}
                eventClick={(info) => {
                  setSelectedEvent({
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.startStr,
                    end: info.event.endStr,
                    extendedProps: info.event.extendedProps,
                  });
                }}
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                dayMaxEvents={true}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-emerald-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {selectedEvent.title}
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Booking details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">Type</div>

                <div className="mt-1 font-medium">
                  {selectedEvent.extendedProps?.bookingType ?? "-"}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">Customer</div>

                <div className="mt-1 font-medium">
                  {selectedEvent.extendedProps?.customerName ?? "Guest"}
                </div>

                <div className="text-white/70">
                  {selectedEvent.extendedProps?.customerEmail ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60">People</div>

                  <div className="mt-1 font-medium">
                    {selectedEvent.extendedProps?.peopleCount ?? "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60">Status</div>

                  <div className="mt-1 font-medium">
                    {selectedEvent.extendedProps?.status ?? "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">Amount</div>

                <div className="mt-1 font-medium">
                  {formatMoney(selectedEvent.extendedProps?.amount)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">Start</div>

                <div className="mt-1 font-medium">
                  {selectedEvent.start}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">End</div>

                <div className="mt-1 font-medium">
                  {selectedEvent.end}
                </div>
              </div>

              {selectedEvent.extendedProps?.notes ? (
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60">Notes</div>

                  <div className="mt-1 whitespace-pre-wrap font-medium">
                    {selectedEvent.extendedProps.notes}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}