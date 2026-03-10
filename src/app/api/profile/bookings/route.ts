import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

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

    const userId = user.id;
    const userEmail = normalizeEmail(user.email);

    if (!userEmail) {
      return NextResponse.json(
        { error: "No email found on your account." },
        { status: 400 }
      );
    }

    await supabase
      .from("bookings")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("customer_email", userEmail);

    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select(
        [
          "id",
          "booking_date",
          "start_time",
          "end_time",
          "duration_minutes",
          "people_count",
          "total_amount_cents",
          "booking_type",
          "status",
          "rescheduled_to_booking_id",
          "rescheduled_from_booking_id",
          "customer_email",
          "user_id",
        ].join(",")
      )
      .or(`user_id.eq.${userId},customer_email.ilike.${userEmail}`)
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (bookingsErr) {
      return NextResponse.json(
        { error: bookingsErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: bookings ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load profile bookings" },
      { status: 500 }
    );
  }
}