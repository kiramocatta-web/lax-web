import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBookingEmail } from "@/lib/email/sendBookingEmail";
import { sendAdminBookingNotification } from "@/lib/email/sendAdminBookingNotification";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function unixToISO(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return null;
  return new Date(value * 1000).toISOString();
}

function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase() || null;
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

function formatAmount(
  amount: number | null | undefined,
  currency?: string | null
) {
  if (amount == null) return "—";
  const dollars = amount / 100;
  const code = (currency || "AUD").toUpperCase();
  return `${code} $${dollars.toFixed(2)}`;
}

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

async function sendAdminBookingEmail(session: Stripe.Checkout.Session) {
  const notifyTo = process.env.BOOKING_NOTIFICATION_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!notifyTo || !fromEmail) {
    console.warn("Missing BOOKING_NOTIFICATION_EMAIL or RESEND_FROM_EMAIL");
    return;
  }

  const metadata = (session.metadata ?? {}) as Record<string, string>;

  const customerEmail = normalizeEmail(
  session.customer_details?.email ||
    session.customer_email ||
    metadata.customer_email ||
    null
);

const customerName =
  session.customer_details?.name ||
  metadata.customer_name ||
  metadata.full_name ||
  null;

const customerPhone =
  session.customer_details?.phone ||
  metadata.customer_phone ||
  null;

  

  const bookingDate = metadata.booking_date || metadata.date || "—";
  const startTime =
    metadata.start_time ||
    (metadata.start_minute
      ? minutesToTimeString(Number(metadata.start_minute))
      : "—");
  const duration = metadata.duration_minutes || metadata.duration || "—";
  const endTime =
    metadata.end_time ||
    (metadata.start_minute && metadata.duration_minutes
      ? addMinutesToTimeString(
          Number(metadata.start_minute),
          Number(metadata.duration_minutes)
        )
      : "—");
  const peopleCount = metadata.people_count || "—";
  const bookingType = metadata.booking_type || metadata.plan || session.mode || "—";

  const amountText = formatAmount(session.amount_total, session.currency);

  const subject =
    metadata.booking_date || startTime !== "—"
      ? `New booking made – ${bookingDate} ${startTime}`
      : `New checkout completed – Lax N Lounge`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: notifyTo,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New booking / checkout completed</h2>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Date:</strong> ${bookingDate}</p>
          <p><strong>Start time:</strong> ${startTime}</p>
          <p><strong>End time:</strong> ${endTime}</p>
          <p><strong>Duration:</strong> ${duration}</p>
          <p><strong>People:</strong> ${peopleCount}</p>
          <p><strong>Type:</strong> ${bookingType}</p>
          <p><strong>Amount:</strong> ${amountText}</p>
          <p><strong>Stripe session ID:</strong> ${session.id}</p>
          <hr />
          <p style="color:#666;">Sent automatically from Lax N Lounge webhook.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send admin booking email:", err);
  }
}

async function applyAffiliateCredit(affiliateUserId: string) {
  const { data: aff, error: affErr } = await supabaseAdmin
    .from("affiliates")
    .select("used_count,credit_cents")
    .eq("user_id", affiliateUserId)
    .single();

  if (affErr) {
    console.error("affiliate lookup failed:", affErr);
    return;
  }

  const used = Number(aff?.used_count ?? 0);
  const credit = Number(aff?.credit_cents ?? 0);

  const { error: updateAffiliateErr } = await supabaseAdmin
    .from("affiliates")
    .update({
      used_count: used + 1,
      credit_cents: credit + 500,
    })
    .eq("user_id", affiliateUserId);

  if (updateAffiliateErr) {
    console.error("affiliate credit update failed:", updateAffiliateErr);
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("affiliate_code_used_count,affiliate_credit_cents")
    .eq("id", affiliateUserId)
    .single();

  if (!profileErr && profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        affiliate_code_used_count:
          Number(profile.affiliate_code_used_count ?? 0) + 1,
        affiliate_credit_cents:
          Number(profile.affiliate_credit_cents ?? 0) + 500,
      })
      .eq("id", affiliateUserId);
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

    if (data && data.length > 0) matched = true;
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

    if (data && data.length > 0) matched = true;
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

async function handleSingleBookingCheckout(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};

  if ((md.booking_type ?? "").trim().toLowerCase() !== "single") {
    return;
  }

  const booking_date = md.booking_date;
  const start_minute = Number(md.start_minute);
  const duration_minutes = Number(md.duration_minutes);
  const people_count = Number(md.people_count ?? "1");
  const user_id = md.user_id?.trim() || null;
  const rescheduleBookingId = Number(md.reschedule_booking_id ?? "0") || null;

  const customerEmail = normalizeEmail(
    session.customer_details?.email ||
      session.customer_email ||
      md.customer_email ||
      null
  );

  const customerName =
  session.customer_details?.name ||
  md.customer_name ||
  md.full_name ||
  null;

  const customerPhone =
    session.customer_details?.phone ||
    md.customer_phone ||
    null;

  if (
    !booking_date ||
    !Number.isFinite(start_minute) ||
    !Number.isFinite(duration_minutes)
  ) {
    throw new Error("Missing booking metadata for single booking.");
  }

  if (!customerPhone) {
    throw new Error("Customer phone missing from checkout.");
  }

  const start_time = md.start_time || minutesToTimeString(start_minute);
  const end_time =
    md.end_time || addMinutesToTimeString(start_minute, duration_minutes);

  const { data: existing } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email"
    )
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existing) {
    return;
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
    const { data: originalBooking, error: originalBookingErr } =
      await supabaseAdmin
        .from("bookings")
        .select("id,booking_type,status,booking_date,start_time,user_id")
        .eq("id", rescheduleBookingId)
        .single();

    if (originalBookingErr || !originalBooking) {
      throw new Error("Original booking not found.");
    }

    if (String(originalBooking.booking_type ?? "").toLowerCase() !== "single") {
      throw new Error("Only single bookings can be rescheduled here.");
    }

    if (
      ["cancelled", "rescheduled"].includes(
        String(originalBooking.status ?? "").toLowerCase()
      )
    ) {
      throw new Error("This booking can no longer be rescheduled.");
    }

    if (
      user_id &&
      originalBooking.user_id &&
      originalBooking.user_id !== user_id
    ) {
      throw new Error("Original booking does not belong to this user.");
    }

    if (!originalBooking.booking_date || !originalBooking.start_time) {
      throw new Error("Original booking is missing date/time.");
    }

    const originalStart = getBookingStartDateTime(
      originalBooking.booking_date,
      originalBooking.start_time
    );

    if (
      Number.isNaN(originalStart.getTime()) ||
      originalStart.getTime() <= Date.now()
    ) {
      throw new Error("Past bookings cannot be rescheduled.");
    }

    originalBookingToReschedule = originalBooking;
  }

  const insertPayload = {
  booking_type: "single",
  status: "confirmed",
  booking_date,
  start_time,
  end_time,
  duration_minutes,
  people_count,
  customer_email: customerEmail,
  customer_name: customerName,
  customer_phone: customerPhone,
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
      "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email, customer_name, customer_phone"
    )
    .single();

  if (insertErr) {
    const { data: raceExisting } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time, people_count, status, booking_type, customer_email, customer_name, customer_phone"
      )
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (!raceExisting) {
      throw new Error(insertErr.message);
    }

    return;
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
      throw new Error(oldUpdateErr.message);
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
      customerPhone,
      totalAmountCents: session.amount_total ?? null,
      rescheduled: Boolean(originalBookingToReschedule),
    });
  } catch (e) {
    console.warn("sendAdminBookingNotification failed:", e);
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

      const isSingleBooking =
        expanded.mode === "payment" &&
        String(expanded.metadata?.booking_type ?? "").toLowerCase() === "single";

      if (isSingleBooking) {
        try {
          await handleSingleBookingCheckout(expanded);
        } catch (singleErr: any) {
          console.error("single booking webhook finalisation failed:", singleErr);
          return NextResponse.json(
            { error: singleErr?.message || "Single booking finalisation failed" },
            { status: 500 }
          );
        }
      }

      if (affiliateUserId) {
        await applyAffiliateCredit(affiliateUserId);
      }

      if (!isSingleBooking) {
        await sendAdminBookingEmail(expanded);
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