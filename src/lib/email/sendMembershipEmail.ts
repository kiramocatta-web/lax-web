import { Resend } from "resend";
import { weeklyMembershipTemplate } from "./templates/weeklyMembership";
import { pass7MembershipTemplate } from "./templates/pass7Membership";
import { renderTemplate } from "./templates/renderTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "LAX N LOUNGE <admin@laxnlounge.com.au>";
}

export async function sendMembershipEmail(args: {
  to: string;
  plan: "weekly" | "pass7";
}) {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const template =
    args.plan === "weekly" ? weeklyMembershipTemplate : pass7MembershipTemplate;

  const html = renderTemplate(template, {
    BOOK_URL: "https://www.laxnlounge.com.au/book",
  });

  const subject =
    args.plan === "weekly"
      ? "Welcome to your LAX Membership 🔥"
      : "Your 7-Day Pass is live 🔥";

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: args.to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
}