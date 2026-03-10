import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

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

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id,booking_date,start_time,end_time,duration_minutes,people_count,total_amount_cents,booking_type,status,customer_email,user_id,rescheduled_to_booking_id,rescheduled_from_booking_id"
      )
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingEmail = normalizeEmail((data as any).customer_email);
    const ownsBooking =
      (data as any).user_id === userId ||
      (!!userEmail && !!bookingEmail && bookingEmail === userEmail);

    if (!ownsBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!(data as any).user_id && bookingEmail === userEmail) {
      await supabase
        .from("bookings")
        .update({ user_id: userId })
        .eq("id", bookingId)
        .is("user_id", null);
      (data as any).user_id = userId;
    }

    return NextResponse.json({ booking: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load booking" },
      { status: 500 }
    );
  }
}