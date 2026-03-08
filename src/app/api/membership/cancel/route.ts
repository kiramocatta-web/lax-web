import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
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

    const { data: adminProfile, error: adminErr } = await supabaseAdmin
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      !!adminProfile?.is_admin ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (adminErr || !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const profileId = String(body?.profile_id ?? "").trim();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    const { data: memberProfile, error: memberErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,email,membership_plan,membership_status,stripe_customer_id,stripe_subscription_id"
      )
      .eq("id", profileId)
      .single();

    if (memberErr || !memberProfile) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    const stripeCustomerId = String(memberProfile.stripe_customer_id ?? "").trim();
    const stripeSubscriptionId = String(
      memberProfile.stripe_subscription_id ?? ""
    ).trim();

    if (!stripeCustomerId || !stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Missing Stripe customer or subscription on this member" },
        { status: 400 }
      );
    }

    const membershipPlan = String(memberProfile.membership_plan ?? "").toLowerCase();

    if (membershipPlan !== "weekly") {
      return NextResponse.json(
        {
          error:
            "Admin cancel flow is currently only set up for weekly memberships",
        },
        { status: 400 }
      );
    }

    const finalChargeCents = 4000; // 2 weeks x $20

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: finalChargeCents,
      currency: "aud",
      description: "Final 2 weeks membership access",
    });

    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      auto_advance: true,
      collection_method: "charge_automatically",
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    const paidInvoice =
      finalizedInvoice.status === "paid"
        ? finalizedInvoice
        : await stripe.invoices.pay(finalizedInvoice.id);

    if (paidInvoice.status !== "paid") {
      return NextResponse.json(
        { error: "Final 2-week payment failed" },
        { status: 400 }
      );
    }

    await stripe.subscriptions.cancel(stripeSubscriptionId);

    const membershipExpiresAt = addDaysISO(14);

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({
        membership_status: "cancelled",
        membership_expires_at: membershipExpiresAt,
        stripe_current_period_end: null,
      })
      .eq("id", profileId);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      membership_expires_at: membershipExpiresAt,
    });
  } catch (e: any) {
    console.error("admin membership cancel error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}