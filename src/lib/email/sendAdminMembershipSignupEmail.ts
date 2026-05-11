import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type MembershipSignupEmailInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  membershipPlan?: string | null;
  amount?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export async function sendAdminMembershipSignupEmail({
  name,
  email,
  phone,
  membershipPlan,
  amount,
  stripeCustomerId,
  stripeSubscriptionId,
}: MembershipSignupEmailInput) {
  const to = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!to || !from) {
    console.warn("Missing admin membership email env vars.");
    return;
  }

  const planLabel =
    membershipPlan === "weekly"
      ? "Weekly Unlimited Membership"
      : membershipPlan === "pass7"
        ? "7-Day Unlimited Pass"
        : membershipPlan || "Unknown membership";

  await resend.emails.send({
    from,
    to,
    subject: `New membership signup — ${planLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a17;">
        <h2>New Membership Signup</h2>

        <p><strong>Plan:</strong> ${planLabel}</p>
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
