import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type BookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Missing or invalid date. Use ?date=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time,end_time,people_count,status,booking_date")
      .eq("booking_date", date)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    const { data: blocksData, error: blocksError } = await supabase
      .from("booking_blocks")
      .select("id,block_date,is_full_day,start_time,end_time,reason")
      .eq("block_date", date)
      .order("is_full_day", { ascending: false })
      .order("start_time", { ascending: true });

    if (blocksError) {
      return NextResponse.json(
        { error: blocksError.message },
        { status: 500 }
      );
    }

    const bookings: BookingRow[] = (bookingsData ?? []).map((row: any) => ({
      start_time: String(row.start_time ?? ""),
      end_time: row.end_time === null ? null : String(row.end_time),
      people_count: Number(row.people_count ?? 1),
    }));

    const blocks = (blocksData ?? []).map((row: any) => ({
      id: Number(row.id),
      block_date: String(row.block_date),
      is_full_day: Boolean(row.is_full_day),
      start_time: row.start_time === null ? null : String(row.start_time),
      end_time: row.end_time === null ? null : String(row.end_time),
      reason: row.reason === null ? null : String(row.reason),
    }));

    return NextResponse.json({ bookings, blocks });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load bookings" },
      { status: 500 }
    );
  }
}