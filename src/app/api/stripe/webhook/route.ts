import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,
);

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function unixToISO(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return null;
  return new Date(value * 1000).toISOString();
}

function mapSubStatus(
  status: Stripe.Subscription.Status | string | null | undefined
) {
  if (!status) return "inactive";

  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    case "paused":
      return "paused";
    default:
      return "inactive";
  }
}

function getSubscriptionCurrentPeriodEndISO(sub: Stripe.Subscription | null) {
  if (!sub) return null;
  return unixToISO((sub as any).current_period_end);
}

async function applyAffiliateCredit(affiliateUserId: string) {
  const { data: aff, error: affErr } = await supabaseAdmin
    .from("profiles")
    .select("affiliate_code_used_count,affiliate_credit_cents")
    .eq("id", affiliateUserId)
    .single();

  if (affErr) {
    console.error("affiliate lookup failed:", affErr);
    return;
  }

  const used = Number((aff as any)?.affiliate_code_used_count ?? 0);
  const credit = Number((aff as any)?.affiliate_credit_cents ?? 0);

  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({
      affiliate_code_used_count: used + 1,
      affiliate_credit_cents: credit + 500,
    })
    .eq("id", affiliateUserId);

  if (updateErr) {
    console.error("affiliate credit update failed:", updateErr);
  }
}

async function syncProfileFromSubscription(
  sub: Stripe.Subscription,
  customerId?: string | null
) {
  const currentPeriodEnd = getSubscriptionCurrentPeriodEndISO(sub);

  const payload = {
    membership_status: mapSubStatus(sub.status),
    stripe_current_period_end: currentPeriodEnd,
    stripe_subscription_id: sub.id,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
  };

  let matched = false;

  if (customerId) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("stripe_customer_id", customerId)
      .select("id");

    if (error) {
      console.error("sync by customer_id failed:", error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      matched = true;
    }
  }

  if (!matched) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("stripe_subscription_id", sub.id)
      .select("id");

    if (error) {
      console.error("sync by subscription_id failed:", error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      matched = true;
    }
  }

  if (!matched) {
    console.warn("No profile matched subscription sync", {
      subscription_id: sub.id,
      customer_id: customerId ?? null,
    });
  }
}

async function updateProfileByStripeIds(
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  payload: Record<string, any>
) {
  let matched = false;

  if (stripeCustomerId) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("stripe_customer_id", stripeCustomerId)
      .select("id");

    if (error) throw new Error(error.message);
    if (data && data.length > 0) matched = true;
  }

  if (!matched && stripeSubscriptionId) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(payload)
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .select("id");

    if (error) throw new Error(error.message);
    if (data && data.length > 0) matched = true;
  }

  if (!matched) {
    console.warn("No profile matched updateProfileByStripeIds", {
      stripeCustomerId,
      stripeSubscriptionId,
    });
  }
}

export async function POST(req: Request) {
  try {
    const stripeSignature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSignature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing stripe signature or webhook secret" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        webhookSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err?.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = String(session.metadata?.user_id ?? "").trim() || null;
      const plan = String(session.metadata?.plan ?? "").trim() || null;
      const affiliateUserId =
        String(session.metadata?.affiliate_user_id ?? "").trim() || null;

      const expanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["customer", "subscription", "payment_intent"],
      });

      const customerId =
        typeof expanded.customer === "string"
          ? expanded.customer
          : expanded.customer?.id ?? null;

      if (userId && expanded.mode === "subscription") {
        let subscription: Stripe.Subscription | null = null;

        if (typeof expanded.subscription === "string") {
          subscription = await stripe.subscriptions.retrieve(expanded.subscription);
        } else if (
          expanded.subscription &&
          !("deleted" in expanded.subscription)
        ) {
          subscription = expanded.subscription as Stripe.Subscription;
        }

        const subscriptionId = subscription?.id ?? null;
        const subStatus = subscription?.status ?? null;
        const currentPeriodEnd = getSubscriptionCurrentPeriodEndISO(subscription);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            membership_plan: plan || "weekly",
            membership_status: mapSubStatus(subStatus),
            membership_expires_at: null,
            stripe_current_period_end: currentPeriodEnd,
          })
          .eq("id", userId);

        if (error) {
          console.error("profile update on checkout.session.completed failed:", error);
          return NextResponse.json(
            { error: "DB update failed" },
            { status: 500 }
          );
        }

        if (subscription) {
          try {
            await syncProfileFromSubscription(subscription, customerId);
          } catch (syncErr: any) {
            console.error("subscription sync after checkout failed:", syncErr);
          }
        }
      }

      if (userId && expanded.mode === "payment" && plan === "pass7") {
        const expiresAt = addDaysISO(7);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            membership_plan: "pass7",
            membership_status: "active",
            membership_expires_at: expiresAt,
            stripe_current_period_end: null,
          })
          .eq("id", userId);

        if (error) {
          console.error("profile update for pass7 failed:", error);
          return NextResponse.json(
            { error: "DB update failed" },
            { status: 500 }
          );
        }
      }

      if (affiliateUserId) {
        await applyAffiliateCredit(affiliateUserId);
      }

      return NextResponse.json({ received: true });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;

      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : sub.customer?.id ?? null;

      try {
        await syncProfileFromSubscription(sub, customerId);
        return NextResponse.json({ received: true });
      } catch (err: any) {
        console.error("subscription sync event failed:", err);
        return NextResponse.json(
          { error: err?.message || "DB update failed" },
          { status: 500 }
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const customerId =
        typeof sub.customer === "string"
          ? sub.customer
          : sub.customer?.id ?? null;

      try {
        const { data: matchedProfile, error: profileErr } = await supabaseAdmin
          .from("profiles")
          .select("id,membership_expires_at,membership_status")
          .or(
            [
              customerId ? `stripe_customer_id.eq.${customerId}` : null,
              `stripe_subscription_id.eq.${sub.id}`,
            ]
              .filter(Boolean)
              .join(",")
          )
          .limit(1)
          .maybeSingle();

        if (profileErr) {
          throw new Error(profileErr.message);
        }

        const hasFutureExpiry =
          !!matchedProfile?.membership_expires_at &&
          new Date(matchedProfile.membership_expires_at).getTime() > Date.now();

        await updateProfileByStripeIds(customerId, sub.id, {
          membership_status: "cancelled",
          stripe_subscription_id: null,
          stripe_current_period_end: null,
          membership_expires_at: hasFutureExpiry
            ? matchedProfile?.membership_expires_at
            : null,
        });

        return NextResponse.json({ received: true });
      } catch (err: any) {
        console.error("subscription delete sync failed:", err);
        return NextResponse.json(
          { error: err?.message || "DB update failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("webhook route error:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}