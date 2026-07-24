import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecret);

type MembershipPlan =
  | "weekly"
  | "secret_weekly_15"
  | "pass7"
  | "pack5"
  | "pack10"
  | "monthly";

function getTransferTrialEndUnix() {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  return Math.floor(trialEnd.getTime() / 1000);
}

function isFutureDate(value: string | null) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const plan = body?.plan as MembershipPlan | undefined;
    const transferOffer = body?.transfer_offer === true;

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    const allowedPlans: MembershipPlan[] = [
      "weekly",
      "secret_weekly_15",
      "pass7",
      "pack5",
      "pack10",
      "monthly",
    ];

    if (!allowedPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid membership plan" },
        { status: 400 }
      );
    }

    if (
      transferOffer &&
      plan !== "weekly" &&
      plan !== "secret_weekly_15"
    ) {
      return NextResponse.json(
        {
          error:
            "Transfer offer is only valid for weekly memberships.",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "phone,stripe_customer_id,membership_plan,membership_status,stripe_subscription_id,membership_expires_at"
        )
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            profileError?.message ||
            "Profile could not be found.",
        },
        { status: 500 }
      );
    }

    if (!profile.phone) {
      return NextResponse.json(
        {
          error:
            "Phone number is required before purchasing a membership.",
        },
        { status: 400 }
      );
    }

    const status = String(
      profile.membership_status ?? ""
    ).toLowerCase();

    const existingPlan = String(
      profile.membership_plan ?? ""
    ).toLowerCase();

    const hasFutureExpiry = isFutureDate(
      profile.membership_expires_at ?? null
    );

    const activeStatuses = [
      "active",
      "trialing",
      "cancellation_requested",
    ];

    const hasActiveWeekly =
      existingPlan === "weekly" &&
      activeStatuses.includes(status);

    const hasActiveFixedPass =
      (existingPlan === "pass7" ||
        existingPlan === "monthly") &&
      activeStatuses.includes(status) &&
      hasFutureExpiry;

    const isNewMembership =
      plan === "weekly" ||
      plan === "secret_weekly_15" ||
      plan === "pass7" ||
      plan === "monthly";

    /*
     * Prevent a new membership from overwriting
     * another active membership.
     *
     * Package purchases remain allowed because package
     * credits can exist alongside a membership.
     */
    if (
      isNewMembership &&
      (hasActiveWeekly || hasActiveFixedPass)
    ) {
      const message = hasActiveWeekly
        ? "You already have an active weekly membership."
        : "You already have active membership access. Please wait until it expires before purchasing another membership.";

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    const priceIdByPlan: Record<
      MembershipPlan,
      string | undefined
    > = {
      weekly: process.env.STRIPE_WEEKLY_PRICE_ID,
      secret_weekly_15:
        process.env.STRIPE_SECRET_WEEKLY_15_PRICE_ID,
      pass7: process.env.STRIPE_PASS7_PRICE_ID,
      pack5: process.env.STRIPE_PACK5_PRICE_ID,
      pack10: process.env.STRIPE_PACK10_PRICE_ID,
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
    };

    const selectedPriceId = priceIdByPlan[plan];

    if (!selectedPriceId) {
      return NextResponse.json(
        {
          error:
            `Missing Stripe price ID for ${plan}`,
        },
        { status: 500 }
      );
    }

    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan === "weekly" ||
      plan === "secret_weekly_15"
        ? "subscription"
        : "payment";

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.laxnlounge.com.au"
    ).trim();

    const normalizedPlan =
      plan === "secret_weekly_15"
        ? "weekly"
        : plan;

    const sessionParams: Stripe.Checkout.SessionCreateParams =
      {
        mode,
        allow_promotion_codes: true,
        phone_number_collection: {
          enabled: true,
        },
        line_items: [
          {
            price: selectedPriceId,
            quantity: 1,
          },
        ],
        success_url:
          `${siteUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${siteUrl}/pricing-membership-and-packages`,
        metadata: {
          user_id: user.id,
          plan: normalizedPlan,
          actual_plan: plan,
          secret_offer:
            plan === "secret_weekly_15"
              ? "true"
              : "false",
          flow: transferOffer
            ? "membership_transfer_offer"
            : "membership_purchase",
          transfer_offer:
            transferOffer ? "true" : "false",
        },
      };

    if (
      (plan === "weekly" ||
        plan === "secret_weekly_15") &&
      transferOffer
    ) {
      sessionParams.subscription_data = {
        trial_end: getTransferTrialEndUnix(),
      };
    }

    let validStripeCustomerId: string | null = null;

    if (profile.stripe_customer_id) {
      try {
        const customer =
          await stripe.customers.retrieve(
            profile.stripe_customer_id
          );

        if (!("deleted" in customer)) {
          validStripeCustomerId = customer.id;
        } else {
          await supabase
            .from("profiles")
            .update({
              stripe_customer_id: null,
            })
            .eq("id", user.id);
        }
      } catch {
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: null,
          })
          .eq("id", user.id);
      }
    }

    if (validStripeCustomerId) {
      sessionParams.customer = validStripeCustomerId;
    } else if (mode === "payment") {
      sessionParams.customer_creation = "always";
      sessionParams.customer_email =
        user.email ?? undefined;
    } else {
      sessionParams.customer_email =
        user.email ?? undefined;
    }

    const session =
      await stripe.checkout.sessions.create(
        sessionParams
      );

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe did not return a checkout URL.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: unknown) {
    console.error(
      "membership/checkout error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}