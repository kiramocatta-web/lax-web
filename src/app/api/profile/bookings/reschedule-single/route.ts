import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function minutesToTimeString(startMinute: number) {
  const hh = String(Math.floor(startMinute / 60)).padStart(2, "0");
  const mm = String(startMinute % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function addMinutesToTimeString(startMinute: number, duration: number) {
  return minutesToTimeString(startMinute + duration);
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

function getBookingStartDateTime(bookingDate: string, startTime: string) {
  return new Date(`${bookingDate}T${startTime}`);
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

    const booking_date: string | undefined = body?.booking_date;
    const start_minute: number | undefined = body?.start_minute;
    const duration_minutes: number | undefined = body?.duration_minutes;
    const people_count: number = Number(body?.people_count ?? 1);
    const rescheduleBookingId = Number(body?.reschedule_booking_id ?? 0) || null;

    if (!booking_date || typeof start_minute !== "number" || !duration_minutes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!rescheduleBookingId) {
      return NextResponse.json(
        { error: "Missing reschedule_booking_id" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(people_count) || people_count < 1 || people_count > 8) {
      return NextResponse.json({ error: "Invalid people count" }, { status: 400 });
    }

    const start_time = minutesToTimeString(start_minute);
    const end_time = addMinutesToTimeString(start_minute, duration_minutes);

    const { data: originalBooking, error: originalBookingErr } = await supabase
      .from("bookings")
     .select(
  "id,booking_type,status,booking_date,start_time,user_id,customer_email,customer_phone,customer_name"
)
      .eq("id", rescheduleBookingId)
      .eq("user_id", user.id)
      .single();

    if (originalBookingErr || !originalBooking) {
      return NextResponse.json(
        { error: "Original booking not found." },
        { status: 404 }
      );
    }

    if (String(originalBooking.booking_type ?? "").toLowerCase() !== "single") {
      return NextResponse.json(
        { error: "Only single bookings can be rescheduled here." },
        { status: 403 }
      );
    }

    if (
      ["cancelled", "rescheduled"].includes(
        String(originalBooking.status ?? "").toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "This booking can no longer be rescheduled." },
        { status: 400 }
      );
    }

    if (!originalBooking.booking_date || !originalBooking.start_time) {
      return NextResponse.json(
        { error: "Original booking is missing date/time." },
        { status: 400 }
      );
    }

    const originalStart = getBookingStartDateTime(
      originalBooking.booking_date,
      originalBooking.start_time
    );

    const brisbaneNow = getBrisbaneNow();

    if (
      Number.isNaN(originalStart.getTime()) ||
      originalStart.getTime() <= brisbaneNow.getTime()
    ) {
      return NextResponse.json(
        { error: "Past bookings cannot be rescheduled." },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        booking_type: "single",
        status: "confirmed",
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        people_count,
        customer_email: originalBooking.customer_email ?? user.email ?? null,
        customer_phone: originalBooking.customer_phone ?? null,
        customer_name: originalBooking.customer_name ?? null,   
        user_id: user.id,
        total_amount_cents: 0,
        rescheduled_from_booking_id: originalBooking.id,
      })
      .select(
  "id,booking_type,status,booking_date,start_time,user_id,customer_email,customer_phone,customer_name"
)
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create rescheduled booking." },
        { status: 500 }
      );
    }

    const { error: updateOldErr } = await supabase
      .from("bookings")
      .update({
        status: "rescheduled",
        rescheduled_to_booking_id: inserted.id,
      })
      .eq("id", originalBooking.id)
      .eq("user_id", user.id);

    if (updateOldErr) {
      return NextResponse.json(
        { error: updateOldErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      booking: inserted,
      rescheduled: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}