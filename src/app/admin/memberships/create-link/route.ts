import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

function getTransferTrialEndUnix() {
  const now = new Date();
  now.setDate(now.getDate() + 14);
  return Math.floor(now.getTime() / 1000);
}

function normalizePlan(plan: unknown): "weekly" | "pass7" | null {
  return plan === "weekly" || plan === "pass7" ? plan : null;
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

    const { data: adminProfile, error: adminErr } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    if (
      adminErr ||
      (!adminProfile?.is_admin &&
        String(adminProfile?.role ?? "").toLowerCase() !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const targetUserId = String(body?.userId ?? "").trim();
    const plan = normalizePlan(body?.plan);
    const transferOffer = body?.transfer_offer === true;
    const sendEmail = body?.send_email === true;

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (transferOffer && plan !== "weekly") {
      return NextResponse.json(
        { error: "Transfer offer is only valid for weekly memberships." },
        { status: 400 }
      );
    }

    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,email,phone,full_name,membership_plan,membership_status,stripe_customer_id"
      )
      .eq("id", targetUserId)
      .single();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (!targetProfile.email) {
      return NextResponse.json(
        { error: "Member has no email address." },
        { status: 400 }
      );
    }


    if (plan === "weekly") {
      const status = String(targetProfile.membership_status ?? "").toLowerCase();
      const existingPlan = String(targetProfile.membership_plan ?? "").toLowerCase();

      const alreadyHasWeekly =
        existingPlan === "weekly" &&
        ["active", "trialing", "cancellation_requested"].includes(status);

      if (alreadyHasWeekly) {
        return NextResponse.json(
          { error: "This member already has an active weekly membership." },
          { status: 409 }
        );
      }
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

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au"
    ).trim();

    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan === "weekly" ? "subscription" : "payment";

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
        user_id: targetProfile.id,
        plan,
        flow: transferOffer
          ? "admin_membership_transfer_offer"
          : "admin_membership_checkout_link",
        transfer_offer: transferOffer ? "true" : "false",
        created_by_admin_id: user.id,
      },
      customer_email: targetProfile.email,
    };

    if (plan === "weekly" && transferOffer) {
      sessionParams.subscription_data = {
        trial_end: getTransferTrialEndUnix(),
      };
    }

    if (targetProfile.stripe_customer_id) {
      try {
        const existingCustomer = await stripe.customers.retrieve(
          targetProfile.stripe_customer_id
        );

        if (!("deleted" in existingCustomer)) {
          sessionParams.customer = existingCustomer.id;
          delete sessionParams.customer_email;
        }
      } catch {
      }
    }

    if (mode === "payment" && !sessionParams.customer) {
      sessionParams.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (sendEmail) {
      const fromEmail = process.env.RESEND_FROM_EMAIL;

      if (!fromEmail) {
        return NextResponse.json(
          { error: "Missing RESEND_FROM_EMAIL" },
          { status: 500 }
        );
      }

      await resend.emails.send({
        from: fromEmail,
        to: targetProfile.email,
        subject:
          plan === "weekly"
            ? "Complete your Lax N Lounge membership"
            : "Complete your Lax N Lounge 7-Day Pass",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hi${targetProfile.full_name ? ` ${targetProfile.full_name}` : ""},</p>
            <p>Here is your secure link to complete your ${
              plan === "weekly" ? "weekly membership" : "7-Day Pass"
            }.</p>
            <p>
              <a href="${session.url}" target="_blank" rel="noopener noreferrer">
                Complete checkout
              </a>
            </p>
            <p>See you at Lax N Lounge.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: any) {
    console.error("admin membership create-link error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}