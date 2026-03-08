import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id,booking_date,start_time,end_time,duration_minutes,people_count,total_amount_cents,booking_type,status"
      )
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load booking" },
      { status: 500 }
    );
  }
}