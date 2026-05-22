import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type GiftPlan = "pass7" | "pack5" | "pack10" | "monthly";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const plan = body?.plan as GiftPlan | undefined;
    const giftEmail = String(body?.giftEmail ?? "").trim().toLowerCase();
    const giftName = String(body?.giftName ?? "").trim();
    const giftMessage = String(body?.giftMessage ?? "").trim();

    if (!plan) {
      return NextResponse.json({ error: "Missing plan." }, { status: 400 });
    }

    if (!giftEmail || !giftEmail.includes("@")) {
      return NextResponse.json(
        { error: "Recipient email is required." },
        { status: 400 }
      );
    }

    const priceIdByPlan = {
      pass7: process.env.STRIPE_PASS7_PRICE_ID,
      pack5: process.env.STRIPE_PACK5_PRICE_ID,
      pack10: process.env.STRIPE_PACK10_PRICE_ID,
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
    } as const;

    const selectedPriceId = priceIdByPlan[plan];

    if (!selectedPriceId) {
      return NextResponse.json(
        { error: `Missing Stripe price ID for ${plan}` },
        { status: 500 }
      );
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au"
    ).trim();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/membership`,
      metadata: {
        flow: "package_gift",
        plan,
        recipient_email: giftEmail,
        recipient_name: giftName,
        gift_message: giftMessage,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("gift-checkout error:", err);

    return NextResponse.json(
      { error: err?.message || "Unable to start gift checkout" },
      { status: 500 }
    );
  }
}