import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBookingEmail } from "@/lib/email/sendBookingEmail";


export const runtime = "nodejs";

function minutesToTimeString(startMinute: number) {
  const hh = String(Math.floor(startMinute / 60)).padStart(2, "0");
  const mm = String(startMinute % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function addMinutesToTimeString(startMinute: number, duration: number) {
  return minutesToTimeString(startMinute + duration);
}

function getBookingStartDateTime(bookingDate: string, startTime: string) {
  return new Date(`${bookingDate}T${startTime}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const session_id = body?.session_id as string | undefined;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripe = new Stripe(secret, { apiVersion: "2025-01-27.acacia" as any });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["customer", "payment_intent"],
    });

    const customerFromExpand =
      session.customer &&
      typeof session.customer !== "string" &&
      "email" in session.customer
        ? (session.customer.email as string | null)
        : null;

    const customerEmail =
      session.customer_details?.email ??
      session.customer_email ??
      customerFromExpand ??
      null;

    const baseResponse = {
      id: session.id,
      payment_status: session.payment_status ?? null,
      status: session.status ?? null,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      metadata: (session.metadata ?? {}) as Record<string, string>,
      customer_email: customerEmail,
      mode: session.mode ?? null,
    };

    const isPaid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";

    if (!isPaid) {
      return NextResponse.json({ ...baseResponse, booking_created: false });
    }

    const md = baseResponse.metadata;

    const booking_type = "single";
    const booking_date = md.booking_date;
    const start_minute = Number(md.start_minute);
    const duration_minutes = Number(md.duration_minutes);
    const people_count = Number(md.people_count ?? "1");
    const customer_phone =
      session.customer_details?.phone ??
      md.customer_phone ??
      null;
    const user_id = md.user_id?.trim() || null;
    const rescheduleBookingId = Number(md.reschedule_booking_id ?? "0") || null;

    if (!customer_phone) {
      return NextResponse.json(
        { ...baseResponse, error: "Customer phone missing from checkout." },
        { status: 400 }
      );
    }

    if (!booking_date || !Number.isFinite(start_minute) || !Number.isFinite(duration_minutes)) {
      return NextResponse.json(
        {
          ...baseResponse,
          booking_created: false,
          error: "Missing booking metadata",
        },
        { status: 400 }
      );
    }

    const start_time = minutesToTimeString(start_minute);
    const end_time = addMinutesToTimeString(start_minute, duration_minutes);

    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email"
      )
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ...baseResponse,
        booking_created: false,
        booking: existing,
      });
    }

    let originalBookingToReschedule:
      | {
          id: number;
          booking_type: string | null;
          status: string | null;
          booking_date: string | null;
          start_time: string | null;
          user_id: string | null;
        }
      | null = null;

    if (rescheduleBookingId) {
      const { data: originalBooking, error: originalBookingErr } = await supabaseAdmin
        .from("bookings")
        .select("id,booking_type,status,booking_date,start_time,user_id")
        .eq("id", rescheduleBookingId)
        .single();

      if (originalBookingErr || !originalBooking) {
        return NextResponse.json(
          { ...baseResponse, error: "Original booking not found." },
          { status: 404 }
        );
      }

      if (String(originalBooking.booking_type ?? "").toLowerCase() !== "single") {
        return NextResponse.json(
          { ...baseResponse, error: "Only single bookings can be rescheduled here." },
          { status: 403 }
        );
      }

      if (["cancelled", "rescheduled"].includes(String(originalBooking.status ?? "").toLowerCase())) {
        return NextResponse.json(
          { ...baseResponse, error: "This booking can no longer be rescheduled." },
          { status: 400 }
        );
      }

      if (user_id && originalBooking.user_id && originalBooking.user_id !== user_id) {
        return NextResponse.json(
          { ...baseResponse, error: "Original booking does not belong to this user." },
          { status: 403 }
        );
      }

      if (!originalBooking.booking_date || !originalBooking.start_time) {
        return NextResponse.json(
          { ...baseResponse, error: "Original booking is missing date/time." },
          { status: 400 }
        );
      }

      const originalStart = getBookingStartDateTime(
        originalBooking.booking_date,
        originalBooking.start_time
      );

      if (
        Number.isNaN(originalStart.getTime()) ||
        originalStart.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { ...baseResponse, error: "Past bookings cannot be rescheduled." },
          { status: 400 }
        );
      }

      originalBookingToReschedule = originalBooking;
    }

    const insertPayload = {
      booking_type,
      status: "confirmed",
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      people_count,
      customer_email: customerEmail,
      customer_phone,
      user_id,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      total_amount_cents: session.amount_total ?? null,
      rescheduled_from_booking_id: originalBookingToReschedule?.id ?? null,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("bookings")
      .insert(insertPayload)
      .select(
        "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email"
      )
      .single();

    if (insertErr) {
      const { data: raceExisting } = await supabaseAdmin
        .from("bookings")
        .select(
          "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email"
        )
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (raceExisting) {
        return NextResponse.json({
          ...baseResponse,
          booking_created: false,
          booking: raceExisting,
        });
      }

      return NextResponse.json(
        { ...baseResponse, error: insertErr.message },
        { status: 500 }
      );
    }

    if (originalBookingToReschedule) {
      const { error: oldUpdateErr } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "rescheduled",
          rescheduled_to_booking_id: inserted.id,
        })
        .eq("id", originalBookingToReschedule.id);

      if (oldUpdateErr) {
        return NextResponse.json(
          { ...baseResponse, error: oldUpdateErr.message },
          { status: 500 }
        );
      }
    }

    try {
  if (customerEmail) {
    await sendBookingEmail({
      to: customerEmail,
      bookingDate: booking_date,
      startTime: start_time,
      endTime: end_time,
      peopleCount: people_count,
    });
  }
} catch (e) {
  console.warn("sendBookingEmail failed:", e);
}

try {
  await sendAdminBookingNotification({
    bookingId: inserted.id,
    bookingDate: booking_date,
    startTime: start_time,
    endTime: end_time,
    peopleCount: people_count,
    customerEmail,
    customerPhone: customer_phone,
    totalAmountCents: session.amount_total ?? null,
    rescheduled: Boolean(originalBookingToReschedule),
  });
} catch (e) {
  console.warn("sendAdminBookingNotification failed:", e);
}

    return NextResponse.json({
      ...baseResponse,
      booking_created: true,
      booking: inserted,
      rescheduled: Boolean(originalBookingToReschedule),
    });
  } catch (err: any) {
    console.error("verify-session error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}