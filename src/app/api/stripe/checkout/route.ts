import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecret);

const PRICE_BY_DURATION_CENTS: Record<number, number> = {
  60: 1500,
  90: 2000,
  120: 2500,
};

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
    const supabase = await supabaseServer();
    const body = await req.json().catch(() => null);

    const booking_date: string | undefined = body?.booking_date;
    const start_minute: number | undefined = body?.start_minute;
    const duration_minutes: number | undefined = body?.duration_minutes;
    const people_count: number = Number(body?.people_count ?? 1);
    const rescheduleBookingId =
      Number(body?.reschedule_booking_id ?? 0) || null;

    const discount_code_raw: string = String(body?.discount_code ?? "");
    const discount_code = discount_code_raw.trim().toUpperCase();

    if (!booking_date || typeof start_minute !== "number" || !duration_minutes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const unitAmount = PRICE_BY_DURATION_CENTS[duration_minutes];
    if (!unitAmount) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    if (!Number.isInteger(people_count) || people_count < 1 || people_count > 8) {
      return NextResponse.json({ error: "Invalid people count" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profilePhone: string | null = null;
    let profileEmail: string | null = user?.email ?? null;

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      profilePhone = profile?.phone ?? null;
    }

    const start_time = minutesToTimeString(start_minute);
    const end_time = addMinutesToTimeString(start_minute, duration_minutes);

    if (rescheduleBookingId) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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

      if (String(existingBooking.booking_type ?? "").toLowerCase() !== "single") {
        return NextResponse.json(
          { error: "Only single bookings can be rescheduled here." },
          { status: 403 }
        );
      }

      if (String(existingBooking.status ?? "").toLowerCase() === "cancelled") {
        return NextResponse.json(
          { error: "This booking has already been cancelled." },
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

      if (
        Number.isNaN(existingStart.getTime()) ||
        existingStart.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { error: "Past bookings cannot be rescheduled." },
          { status: 400 }
        );
      }
    }

    let affiliate_user_id: string | null = null;

    if (discount_code) {
      const { data: aff, error: affErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "affiliate")
        .eq("affiliate_code", discount_code)
        .maybeSingle();

      if (affErr) {
        return NextResponse.json({ error: affErr.message }, { status: 500 });
      }

      if (!aff?.id) {
        return NextResponse.json(
          { error: "Invalid discount code." },
          { status: 400 }
        );
      }

      affiliate_user_id = aff.id;

      if (!process.env.STRIPE_COUPON_5OFF) {
        return NextResponse.json(
          { error: "Missing STRIPE_COUPON_5OFF" },
          { status: 500 }
        );
      }
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au"
    ).trim();

    const discounts =
      affiliate_user_id && process.env.STRIPE_COUPON_5OFF
        ? [{ coupon: process.env.STRIPE_COUPON_5OFF }]
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      customer_email: profileEmail ?? undefined,
      phone_number_collection: {
        enabled: true,
      },
      discounts,
      line_items: [
        {
          quantity: people_count,
          price_data: {
            currency: "aud",
            unit_amount: unitAmount,
            product_data: {
              name: `Lax N Lounge — Single Entry (${duration_minutes} mins)`,
            },
          },
        },
      ],
      success_url: `${siteUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/book/single`,
      metadata: {
        booking_type: "single",
        booking_date,
        start_minute: String(start_minute),
        start_time,
        end_time,
        duration_minutes: String(duration_minutes),
        people_count: String(people_count),
        discount_code: discount_code || "",
        affiliate_user_id: affiliate_user_id || "",
        user_id: user?.id ?? "",
        customer_email: profileEmail ?? "",
        customer_phone: profilePhone ?? "",
        reschedule_booking_id: rescheduleBookingId
          ? String(rescheduleBookingId)
          : "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Stripe checkout failed" },
      { status: 500 }
    );
  }
}