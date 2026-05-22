import { Resend } from "resend";

import { weeklyMembershipTemplate } from "./templates/weeklyMembership";
import { pass7MembershipTemplate } from "./templates/pass7Membership";
import { fivePack } from "./templates/fivePack";
import { tenPack } from "./templates/tenPack";
import { monthlyUnlimited } from "./templates/monthlyUnlimited";
import { renderTemplate } from "./templates/renderTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

type MembershipPlan = "weekly" | "pass7" | "pack5" | "pack10" | "monthly";

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "LAX N LOUNGE <admin@laxnlounge.com.au>"
  );
}

function getTemplate(plan: MembershipPlan) {
  switch (plan) {
    case "weekly":
      return weeklyMembershipTemplate;
    case "pass7":
      return pass7MembershipTemplate;
    case "pack5":
      return fivePack;
    case "pack10":
      return tenPack;
    case "monthly":
      return monthlyUnlimited;
  }
}

function getSubject(plan: MembershipPlan) {
  switch (plan) {
    case "weekly":
      return "Welcome to your LAX Membership 🔥";
    case "pass7":
      return "Your 7-Day Pass is live 🔥";
    case "pack5":
      return "Your 5 Pack is ready 🔥";
    case "pack10":
      return "Your 10 Pack is ready 🔥";
    case "monthly":
      return "Your Monthly Unlimited access is live 🔥";
  }
}

export async function sendMembershipEmail(args: {
  to: string;
  plan: MembershipPlan;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const template = getTemplate(args.plan);

  const html = renderTemplate(template, {
    BOOK_URL: "https://www.laxnlounge.com.au/book",
  });

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: args.to,
    subject: getSubject(args.plan),
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}