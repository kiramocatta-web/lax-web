import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const session_id = body?.session_id as string | undefined;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secret, {
      apiVersion: "2025-01-27.acacia" as any,
    });

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

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email, user_id"
      )
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (bookingErr) {
      return NextResponse.json(
        { ...baseResponse, error: bookingErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...baseResponse,
      booking_created: Boolean(booking),
      booking: booking ?? null,
    });
  } catch (err: any) {
    console.error("verify-session error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}