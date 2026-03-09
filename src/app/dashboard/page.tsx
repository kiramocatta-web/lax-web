import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) redirect("/signup");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, start_time, end_time, booking_type, people_count, payment_status, total_amount_cents")
    .eq("user_id", user.id)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-emerald-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold">My Bookings</h1>
        <p className="text-white/70 mt-1">Upcoming + past sessions.</p>

        <div className="mt-6 space-y-3">
          {(bookings ?? []).length === 0 ? (
            <div className="bg-white/10 p-4 rounded-2xl">No bookings yet.</div>
          ) : (
            bookings!.map((b) => (
              <div key={b.id} className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {b.booking_date} • {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}
                  </div>
                  <div className="text-sm text-white/70">
                    {b.booking_type} • {b.people_count} {b.people_count === 1 ? "person" : "people"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${((b.total_amount_cents ?? 0) / 100).toFixed(2)} AUD
                  </div>
                  <div className="text-xs text-white/60">{b.payment_status}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <a href="/book/single" className="inline-block bg-white text-black px-4 py-3 rounded-xl font-semibold">
            Book another session
          </a>
        </div>
      </div>
    </div>
  );
}