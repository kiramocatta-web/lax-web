// src/app/bookings-calendar/page.tsx
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type ProfileRow = {
  role: string | null;
  is_admin: boolean | null;
};

type BookingRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  total_amount_cents: number | null;
  booking_type: string | null;
  status: string | null;
  customer_name: string | null;
  customer_email: string | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return "—";

  const [hh, mm] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(hh), Number(mm), 0, 0);

  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function BookingsCalendarPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .single<ProfileRow>();

  const isAdmin = profile?.is_admin === true || profile?.role === "admin";

  if (!isAdmin) {
    redirect("/profile");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      people_count,
      total_amount_cents,
      booking_type,
      status,
      customer_name,
      customer_email
    `
    )
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-emerald-950 text-white px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl sm:text-4xl font-semibold">Bookings Calendar</h1>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80">
            Failed to load bookings.
          </div>
        </div>
      </main>
    );
  }

  const grouped = (bookings ?? []).reduce<Record<string, BookingRow[]>>((acc, booking) => {
    const dateKey = booking.booking_date ?? "No date";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(booking);
    return acc;
  }, {});

  const dateKeys = Object.keys(grouped);

  return (
    <main className="min-h-screen bg-emerald-950 text-white px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold">Bookings Calendar</h1>
          <p className="mt-2 text-white/70">
            Internal admin view of all bookings.
          </p>
        </div>

        {dateKeys.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/75">
            No bookings found yet.
          </div>
        ) : (
          <div className="space-y-8">
            {dateKeys.map((dateKey) => (
              <section
                key={dateKey}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6"
              >
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                  {dateKey === "No date" ? "No date" : formatDate(dateKey)}
                </h2>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-white/60 border-b border-white/10">
                      <tr>
                        <th className="py-3 pr-4">Time</th>
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Email</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">People</th>
                        <th className="py-3 pr-4">Duration</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[dateKey].map((booking) => (
                        <tr key={booking.id} className="border-b border-white/5">
                          <td className="py-4 pr-4">
                            {formatTime(booking.start_time)}{" "}
                            {booking.end_time ? `– ${formatTime(booking.end_time)}` : ""}
                          </td>
                          <td className="py-4 pr-4">{booking.customer_name || "—"}</td>
                          <td className="py-4 pr-4">{booking.customer_email || "—"}</td>
                          <td className="py-4 pr-4 capitalize">
                            {booking.booking_type || "—"}
                          </td>
                          <td className="py-4 pr-4">{booking.people_count ?? "—"}</td>
                          <td className="py-4 pr-4">
                            {booking.duration_minutes
                              ? `${booking.duration_minutes} min`
                              : "—"}
                          </td>
                          <td className="py-4 pr-4 capitalize">{booking.status || "—"}</td>
                          <td className="py-4 pr-4">
                            {formatMoney(booking.total_amount_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {grouped[dateKey].map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="text-lg font-medium">
                        {formatTime(booking.start_time)}
                        {booking.end_time ? ` – ${formatTime(booking.end_time)}` : ""}
                      </div>

                      <div className="mt-2 text-white/80">
                        {booking.customer_name || "No name"}
                      </div>

                      <div className="text-white/60 text-sm">
                        {booking.customer_email || "No email"}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/75">
                        <div>Type: {booking.booking_type || "—"}</div>
                        <div>People: {booking.people_count ?? "—"}</div>
                        <div>
                          Duration:{" "}
                          {booking.duration_minutes
                            ? `${booking.duration_minutes} min`
                            : "—"}
                        </div>
                        <div>Status: {booking.status || "—"}</div>
                        <div className="col-span-2">
                          Amount: {formatMoney(booking.total_amount_cents)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}