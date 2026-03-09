"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";

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
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  const eventsUrl = useMemo(() => "/api/admin/bookings-calendar", []);

  return (
    <div className="min-h-screen bg-emerald-950 text-white">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Internal Bookings Calendar
          </h1>
          <p className="mt-2 text-white/70">
            Admin-only master view of all bookings.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur sm:p-5">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="calendar-shell p-2 sm:p-4 text-slate-900">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-emerald-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedEvent.title}</h2>
                <p className="mt-1 text-sm text-white/60">
                  Booking details
                </p>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
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
                <div className="mt-1 font-medium">{selectedEvent.start}</div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-white/60">End</div>
                <div className="mt-1 font-medium">{selectedEvent.end}</div>
              </div>

              {selectedEvent.extendedProps?.notes ? (
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60">Notes</div>
                  <div className="mt-1 font-medium whitespace-pre-wrap">
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