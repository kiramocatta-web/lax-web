import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getBookingStartDateTime(bookingDate: string, startTime: string) {
  return new Date(`${bookingDate}T${startTime}`);
}

function getBrisbaneNow() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
      "minute"
    )}:${get("second")}`
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const bookingId = Number(body?.booking_id);

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id,user_id,booking_type,status,booking_date,start_time")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookingType = String(booking.booking_type ?? "").toLowerCase();

    if (!["member", "affiliate"].includes(bookingType)) {
      return NextResponse.json(
        { error: "Only member or affiliate bookings can be cancelled." },
        { status: 403 }
      );
    }

    if (String(booking.status ?? "").toLowerCase() === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled." },
        { status: 400 }
      );
    }

    if (!booking.booking_date || !booking.start_time) {
      return NextResponse.json(
        { error: "Booking is missing date/time." },
        { status: 400 }
      );
    }

    const start = getBookingStartDateTime(
      booking.booking_date,
      booking.start_time
    );

    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "Invalid booking date/time." },
        { status: 400 }
      );
    }

    const brisbaneNow = getBrisbaneNow();

if (start.getTime() <= brisbaneNow.getTime()) {
      return NextResponse.json(
        { error: "Past bookings cannot be cancelled." },
        { status: 400 }
      );
    }

    const { data: updatedRows, error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .select("id,status");

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (!updatedRows?.length) {
      return NextResponse.json(
        { error: "Booking could not be cancelled." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}