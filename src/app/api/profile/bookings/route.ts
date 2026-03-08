import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
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
        rescheduled_to_booking_id,
        rescheduled_from_booking_id
      `
      )
      .eq("user_id", user.id)
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bookings: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load bookings" },
      { status: 500 }
    );
  }
}