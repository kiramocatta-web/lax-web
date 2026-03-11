import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL = 15;
const MAX_CAPACITY = 8;

type BookingRow = {
  id?: number;
  start_time: string;
  end_time: string | null;
  people_count: number;
};

type BookingBlockRow = {
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":");
  return Number(hh) * 60 + Number(mm);
}

function minutesToHHMMSS(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function isActivePass(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
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

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role,phone,full_name,membership_status,membership_expires_at,membership_paused_until")
      .eq("id", user.id)
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    if (!profile?.phone) {
      return NextResponse.json(
        { error: "Phone number is required. Please update your profile." },
        { status: 400 }
      );
    }

    const role = String(profile?.role ?? "").toLowerCase();

    if (role !== "affiliate") {
      const pausedUntilRaw = profile?.membership_paused_until ?? null;

      if (pausedUntilRaw) {
        const pausedUntil = new Date(pausedUntilRaw);

        if (pausedUntil.getTime() > Date.now()) {
          return NextResponse.json(
            {
              error: "Your membership is currently paused.",
              paused_until: pausedUntil.toISOString(),
            },
            { status: 403 }
          );
        }

        await supabase
          .from("profiles")
          .update({
            membership_paused_until: null,
            membership_status: "active",
          })
          .eq("id", user.id);
      }

      const status = String(profile?.membership_status ?? "inactive");
      const ok =
        status === "active" ||
        isActivePass(profile?.membership_expires_at ?? null);

      if (!ok) {
        return NextResponse.json(
          { error: "No active membership. Please join to book." },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => null);
    const booking_date: string | undefined = body?.booking_date;
    const start_minute: number | undefined = body?.start_minute;
    const duration_minutes: number | undefined = body?.duration_minutes;
    const rescheduleBookingId = Number(body?.reschedule_booking_id ?? 0) || null;

    const people_count = 1;

    if (!booking_date || typeof start_minute !== "number" || !duration_minutes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (![60, 90, 120].includes(duration_minutes)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const openMinute = OPEN_HOUR * 60;
    const closeMinute = CLOSE_HOUR * 60;
    const end_minute = start_minute + duration_minutes;

    if (start_minute < openMinute || start_minute >= closeMinute) {
      return NextResponse.json({ error: "Outside opening hours" }, { status: 400 });
    }

    if (end_minute > closeMinute) {
      return NextResponse.json(
        { error: "Booking exceeds closing time" },
        { status: 400 }
      );
    }

    if (start_minute % INTERVAL !== 0) {
      return NextResponse.json(
        { error: "Start time must be 15-minute aligned" },
        { status: 400 }
      );
    }

    const start_time = minutesToHHMMSS(start_minute);
    const end_time = minutesToHHMMSS(end_minute);

    let existingBookingToReschedule:
      | {
          id: number;
          booking_type: string | null;
          status: string | null;
          booking_date: string | null;
          start_time: string | null;
          user_id: string;
        }
      | null = null;

    if (rescheduleBookingId) {
      const { data: existingBooking, error: existingBookingErr } = await supabase
        .from("bookings")
        .select("id,booking_type,status,booking_date,start_time,user_id")
        .eq("id", rescheduleBookingId)
        .eq("user_id", user.id)
        .single();

      if (existingBookingErr || !existingBooking) {
        return NextResponse.json(
          { error: "Original booking not found." },
          { status: 404 }
        );
      }

      if (String(existingBooking.booking_type ?? "").toLowerCase() !== "member") {
        return NextResponse.json(
          { error: "Only member bookings can be rescheduled here." },
          { status: 403 }
        );
      }

      if (["cancelled", "rescheduled"].includes(String(existingBooking.status ?? "").toLowerCase())) {
        return NextResponse.json(
          { error: "This booking can no longer be rescheduled." },
          { status: 400 }
        );
      }

      if (!existingBooking.booking_date || !existingBooking.start_time) {
        return NextResponse.json(
          { error: "Original booking is missing date/time." },
          { status: 400 }
        );
      }

      const existingStart = getBookingStartDateTime(
        existingBooking.booking_date,
        existingBooking.start_time
      );

      if (Number.isNaN(existingStart.getTime()) || existingStart.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Past bookings cannot be rescheduled." },
          { status: 400 }
        );
      }

      existingBookingToReschedule = existingBooking;
    }

    const { data: blockRows, error: blockErr } = await supabase
      .from("booking_blocks")
      .select("is_full_day,start_time,end_time,reason")
      .eq("block_date", booking_date);

    if (blockErr) {
      return NextResponse.json({ error: blockErr.message }, { status: 500 });
    }

    const blocks = (blockRows ?? []) as BookingBlockRow[];

    for (const block of blocks) {
      if (block.is_full_day) {
        return NextResponse.json(
          {
            error: block.reason
              ? `This date is blocked: ${block.reason}`
              : "This date is unavailable.",
          },
          { status: 409 }
        );
      }

      if (!block.start_time || !block.end_time) continue;

      const blockStart = timeToMinutes(block.start_time);
      const blockEnd = timeToMinutes(block.end_time);

      const overlaps = blockStart < end_minute && blockEnd > start_minute;
      if (overlaps) {
        return NextResponse.json(
          {
            error: block.reason
              ? `This time is blocked: ${block.reason}`
              : "This time is unavailable.",
          },
          { status: 409 }
        );
      }
    }

    const { data: rows, error: fetchErr } = await supabase
      .from("bookings")
      .select("id,start_time,end_time,people_count")
      .eq("booking_date", booking_date)
      .neq("status", "cancelled")
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const bookings = (rows ?? []) as BookingRow[];

    for (let m = start_minute; m < end_minute; m += INTERVAL) {
      const slotStart = m;
      const slotEnd = m + INTERVAL;

      let used = 0;

      for (const b of bookings) {
        if (!b.end_time) continue;
        if (rescheduleBookingId && b.id === rescheduleBookingId) continue;

        const bStart = timeToMinutes(b.start_time);
        const bEnd = timeToMinutes(b.end_time);

        if (bStart < slotEnd && bEnd > slotStart) {
          used += b.people_count ?? 1;
        }
      }

      if (used + people_count > MAX_CAPACITY) {
        return NextResponse.json(
          { error: "This time is no longer available. Please choose another slot." },
          { status: 409 }
        );
      }
    }

    const booking_type = "member";

    const { data: inserted, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        customer_email: user.email ?? null,
        customer_phone: profile.phone,
        customer_name: profile.full_name ?? null,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        people_count,
        booking_type,
        total_amount_cents: 0,
        status: "confirmed",
        rescheduled_from_booking_id: existingBookingToReschedule?.id ?? null,
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    if (existingBookingToReschedule) {
      const { error: oldUpdateErr } = await supabase
        .from("bookings")
        .update({
          status: "rescheduled",
          rescheduled_to_booking_id: inserted.id,
        })
        .eq("id", existingBookingToReschedule.id)
        .eq("user_id", user.id);

      if (oldUpdateErr) {
        return NextResponse.json(
          { error: oldUpdateErr.message },
          { status: 500 }
        );
      }
    }

    if (role === "affiliate") {
      await supabase.rpc("increment_affiliate_visits", { p_user_id: user.id });
    }

    return NextResponse.json({
      ok: true,
      booking_id: inserted.id,
      rescheduled: Boolean(existingBookingToReschedule),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Booking failed" },
      { status: 500 }
    );
  }
}