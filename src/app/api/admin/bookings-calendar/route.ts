import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  is_admin: boolean | null;
  role: string | null;
};

type BookingRow = {
  id: number;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  people_count: number | null;
  booking_type: string | null;
  status: string | null;
  total_amount_cents: number | null;
  customer_email: string | null;
  customer_name?: string | null;
};

function buildEndTime(startTime: string, durationMinutes: number) {
  const [h, m, s] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, s || 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${hh}:${mm}:00`;
}

export async function GET() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,is_admin,role")
      .eq("id", user.id)
      .single<ProfileRow>();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const isAdmin =
      profile?.is_admin === true || profile?.role?.toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        people_count,
        booking_type,
        status,
        total_amount_cents,
        customer_email,
        customer_name,
      `)
      .or("status.is.null,status.neq.cancelled")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookings = (data ?? []) as unknown as BookingRow[];

const events = bookings.flatMap((booking) => {
  if (!booking.booking_date || !booking.start_time) return [];

  const endTime =
    booking.end_time ||
    (booking.duration_minutes
      ? buildEndTime(booking.start_time, booking.duration_minutes)
      : null);

  if (!endTime) return [];

  return [
    {
      id: String(booking.id),
      title: `${booking.customer_name ?? "Guest"} • ${booking.people_count ?? 1} ${booking.booking_type}`,
      start: `${booking.booking_date}T${booking.start_time}`,
      end: `${booking.booking_date}T${endTime}`,
      extendedProps: {
        bookingType: booking.booking_type,
        customerName: booking.customer_name ?? null,
        customerEmail: booking.customer_email ?? null,
        peopleCount: booking.people_count,
        status: booking.status ?? null,
        amount:
          typeof booking.total_amount_cents === "number"
            ? booking.total_amount_cents / 100
            : null,
      },
    },
  ];
});

    return NextResponse.json(events);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}