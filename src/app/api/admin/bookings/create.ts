import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const OPEN_HOUR = 5;
const CLOSE_HOUR = 22;
const INTERVAL = 15;
const MAX_CAPACITY = 8;

type BookingRow = {
  start_time: string;
  end_time: string | null;
  people_count: number;
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
      .select("role,phone,membership_status,membership_expires_at,membership_paused_until")
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
          .update({ membership_paused_until: null, membership_status: "active" })
          .eq("id", user.id);
      }

      const status = String(profile?.membership_status ?? "inactive");
      const ok = status === "active" || isActivePass(profile?.membership_expires_at ?? null);

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
      return NextResponse.json({ error: "Booking exceeds closing time" }, { status: 400 });
    }

    if (start_minute % INTERVAL !== 0) {
      return NextResponse.json(
        { error: "Start time must be 15-minute aligned" },
        { status: 400 }
      );
    }

    const start_time = minutesToHHMMSS(start_minute);
    const end_time = minutesToHHMMSS(end_minute);

    const { data: rows, error: fetchErr } = await supabase
      .from("bookings")
      .select("start_time,end_time,people_count")
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

    // Must match your DB check constraint
    const booking_type = "single";

    const { data: inserted, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        people_count,
        booking_type,
        customer_phone: profile.phone,
        customer_email: user.email,
        total_amount_cents: 0,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    if (role === "affiliate") {
      await supabase.rpc("increment_affiliate_visits", { p_user_id: user.id });
    }

    return NextResponse.json({ ok: true, booking_id: inserted.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Booking failed" },
      { status: 500 }
    );
  }
}