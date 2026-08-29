import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
};

type BookingBlockRow = {
  id: number;
  block_date: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

type BookingNoticeRow = {
  id: number;
  notice_date: string;
  start_time: string | null;
  end_time: string | null;
  message: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid date. Use ?date=YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    /*
     * IMPORTANT:
     *
     * Availability must see EVERY booking for the selected
     * date, regardless of who is currently logged in.
     *
     * supabaseAdmin bypasses bookings-table RLS here.
     *
     * We deliberately return ONLY:
     * start_time
     * end_time
     * people_count
     *
     * No customer information is exposed.
     */
    const { data: bookingsData, error: bookingsError } =
      await supabaseAdmin
        .from("bookings")
        .select(
          "start_time,end_time,people_count,status,booking_date"
        )
        .eq("booking_date", date)
        .or("status.is.null,status.eq.confirmed")
        .order("start_time", { ascending: true });

    if (bookingsError) {
      console.error(
        "AVAILABILITY BOOKINGS ERROR:",
        bookingsError
      );

      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    const { data: blocksData, error: blocksError } =
      await supabaseAdmin
        .from("booking_blocks")
        .select(
          "id,block_date,is_full_day,start_time,end_time,reason"
        )
        .eq("block_date", date)
        .order("is_full_day", { ascending: false })
        .order("start_time", { ascending: true });

    if (blocksError) {
      console.error(
        "AVAILABILITY BLOCKS ERROR:",
        blocksError
      );

      return NextResponse.json(
        { error: blocksError.message },
        { status: 500 }
      );
    }

    const { data: noticesData, error: noticesError } =
      await supabaseAdmin
        .from("booking_notices")
        .select(
          "id,notice_date,start_time,end_time,message"
        )
        .eq("notice_date", date)
        .eq("is_active", true)
        .order("start_time", { ascending: true });

    if (noticesError) {
      console.error(
        "AVAILABILITY NOTICES ERROR:",
        noticesError
      );

      return NextResponse.json(
        { error: noticesError.message },
        { status: 500 }
      );
    }

    const bookings: BookingRow[] = (
      bookingsData ?? []
    ).map((row: any) => ({
      start_time: String(row.start_time ?? ""),
      end_time:
        row.end_time === null
          ? null
          : String(row.end_time),

      /*
       * UNIVERSAL COUNTER DEDUCTION
       *
       * Every booking deducts its people_count.
       * It does NOT matter whether it came from:
       *
       * - Single
       * - Weekly
       * - Secret weekly
       * - Monthly
       * - Pass7
       * - Pack5
       * - Pack10
       * - Gift
       * - Affiliate
       *
       * If it exists as an active booking, it counts.
       */
      people_count: Math.max(
        1,
        Number(row.people_count ?? 1)
      ),
    }));

    const bookingBlocks: BookingBlockRow[] = (
      blocksData ?? []
    ).map((row: any) => ({
      id: Number(row.id),
      block_date: String(row.block_date),
      is_full_day: Boolean(row.is_full_day),
      start_time:
        row.start_time === null
          ? null
          : String(row.start_time),
      end_time:
        row.end_time === null
          ? null
          : String(row.end_time),
      reason:
        row.reason === null
          ? null
          : String(row.reason),
    }));

    const bookingNotices: BookingNoticeRow[] = (
      noticesData ?? []
    ).map((row: any) => ({
      id: Number(row.id),
      notice_date: String(row.notice_date),
      start_time:
        row.start_time === null
          ? null
          : String(row.start_time),
      end_time:
        row.end_time === null
          ? null
          : String(row.end_time),
      message: String(row.message ?? ""),
    }));

    console.log(
      `AVAILABILITY ${date}:`,
      bookings.length,
      "active bookings",
      bookings
    );

    return NextResponse.json(
      {
        bookings,
        bookingBlocks,
        bookingNotices,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e: any) {
    console.error("AVAILABILITY API FAILED:", e);

    return NextResponse.json(
      {
        error:
          e?.message || "Failed to load bookings",
      },
      { status: 500 }
    );
  }
}