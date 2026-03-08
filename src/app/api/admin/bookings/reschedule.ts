import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":");
  return Number(hh) * 60 + Number(mm);
}

function minutesToHHMMSS(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const bookingId = String(body?.booking_id ?? "").trim();
    const bookingDate = String(body?.booking_date ?? "").trim();
    const startTimeRaw = String(body?.start_time ?? "").trim();

    if (!bookingId || !bookingDate || !startTimeRaw) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id,duration_minutes,profiles(email)")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const startMinutes = timeToMinutes(startTimeRaw);
    const duration = Number((booking as any).duration_minutes ?? 60);
    const endTime = minutesToHHMMSS(startMinutes + duration);
    const startTime = minutesToHHMMSS(startMinutes);

    const { error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
      })
      .eq("id", bookingId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const email = Array.isArray((booking as any).profiles)
      ? (booking as any).profiles[0]?.email
      : (booking as any).profiles?.email;

    if (email && process.env.RESEND_FROM_EMAIL) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Your LAX N LOUNGE booking has been rescheduled",
        text: `Your booking has been moved to ${bookingDate} at ${startTimeRaw}.`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
