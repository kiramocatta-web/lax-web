import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-01-27.acacia" as any,
});

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

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("phone,stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    if (!profile?.phone) {
      return NextResponse.json(
        { error: "Phone number is required before purchasing a membership." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const plan = body?.plan as "weekly" | "pass7" | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const weeklyPriceId = process.env.STRIPE_WEEKLY_PRICE_ID;
    const pass7PriceId = process.env.STRIPE_PASS7_PRICE_ID;

    if (plan === "weekly" && !weeklyPriceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEEKLY_PRICE_ID" },
        { status: 500 }
      );
    }

    if (plan === "pass7" && !pass7PriceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PASS7_PRICE_ID" },
        { status: 500 }
      );
    }

    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan === "weekly" ? "subscription" : "payment";

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://lax-web.vercel.app"
    ).trim();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          price: plan === "weekly" ? weeklyPriceId! : pass7PriceId!,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/membership`,
      metadata: {
        user_id: user.id,
        plan,
        flow: "membership_purchase",
      },
    };

    if (profile.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
    } else if (mode === "payment") {
      sessionParams.customer_creation = "always";
      sessionParams.customer_email = user.email ?? undefined;
    } else {
      sessionParams.customer_email = user.email ?? undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("membership/checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}