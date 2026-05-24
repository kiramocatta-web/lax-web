import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time,end_time,people_count")
      .eq("booking_date", date)
      .or("status.is.null,status.neq.cancelled");

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const { data: bookingBlocks, error: blocksError } = await supabase
      .from("booking_blocks")
      .select("is_full_day,start_time,end_time")
      .eq("block_date", date);

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    return NextResponse.json({
      bookings: bookings ?? [],
      bookingBlocks: bookingBlocks ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load bookings" },
      { status: 500 }
    );
  }
}