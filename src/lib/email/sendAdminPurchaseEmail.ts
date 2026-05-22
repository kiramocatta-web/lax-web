import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type AdminPurchaseEmailInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  plan?: string | null;
  amount?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export async function sendAdminPurchaseEmail({
  name,
  email,
  phone,
  plan,
  amount,
  stripeCustomerId,
  stripeSubscriptionId,
}: AdminPurchaseEmailInput) {
  const to = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!to || !from) {
    console.warn("Missing admin purchase email env vars.");
    return;
  }

  const planLabel =
    plan === "weekly"
      ? "Weekly Unlimited Membership"
      : plan === "pass7"
        ? "7-Day Unlimited Pass"
        : plan === "pack5"
          ? "5 Pack"
          : plan === "pack10"
            ? "10 Pack"
            : plan === "monthly"
              ? "Monthly Unlimited"
              : plan || "Unknown purchase";

  const isWeekly = plan === "weekly";

  await resend.emails.send({
    from,
    to,
    subject: isWeekly
      ? `Weekly Membership Purchased — ${name || email || "New customer"}`
      : `Package Purchased — ${planLabel} — ${name || email || "New customer"}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a17;">
        <h2>${isWeekly ? "Weekly Membership Purchased" : "Package Purchased"}</h2>

        <p><strong>Purchase:</strong> ${planLabel}</p>
        <p><strong>Name:</strong> ${name || "—"}</p>
        <p><strong>Email:</strong> ${email || "—"}</p>
        <p><strong>Phone:</strong> ${phone || "—"}</p>
        <p><strong>Amount:</strong> ${amount || "—"}</p>

        <hr />

        <p><strong>Stripe Customer:</strong> ${stripeCustomerId || "—"}</p>
        <p><strong>Stripe Subscription:</strong> ${stripeSubscriptionId || "—"}</p>
      </div>
    `,
  });
}