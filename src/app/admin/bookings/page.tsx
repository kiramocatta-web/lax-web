import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = await supabaseServer();

  const date = searchParams.date ?? getBrisbaneDateString();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signup");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  function getBrisbaneDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, end_time, people_count, booking_type, status, customer_email, customer_phone, user_id"
    )
    .eq("booking_date", date)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-emerald-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Bookings</h1>
          <a
            href="/admin"
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl"
          >
            Back to Admin
          </a>
        </div>

        <form className="mt-6">
          <label className="text-sm text-white/70">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="block mt-2 bg-white text-black rounded-xl p-3"
          />
          <button className="mt-3 bg-white text-black px-4 py-2 rounded-xl font-semibold">
            Load
          </button>
        </form>

        <div className="mt-8 bg-white/5 rounded-2xl p-4">
          {error ? <div className="text-red-300">{error.message}</div> : null}

          {!bookings?.length ? (
            <div className="text-white/70">No bookings for {date}.</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="text-lg font-semibold">
                      {b.start_time} → {b.end_time} ({b.people_count})
                    </div>
                    <div className="text-sm text-white/70">
                      {b.booking_type} • {b.status} • {b.customer_email ?? "—"} •{" "}
                      {b.customer_phone ?? "—"}
                    </div>
                  </div>
                  <div className="text-sm text-white/60">#{b.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}