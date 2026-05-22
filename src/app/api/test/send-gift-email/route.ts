import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { giftEmail } from "@/lib/email/templates/giftEmail";
import { renderTemplate } from "@/lib/email/templates/renderTemplate";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  const { data: gift, error } = await supabaseAdmin
    .from("package_gifts")
    .select("recipient_email,gift_message,plan,claim_token")
    .eq("status", "unclaimed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !gift) {
    return NextResponse.json(
      { error: error?.message || "No unclaimed gift found" },
      { status: 404 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au";

  const giftPlanLabel =
    gift.plan === "pack5"
      ? "a 5 Pack"
      : gift.plan === "pack10"
      ? "a 10 Pack"
      : gift.plan === "monthly"
      ? "Monthly Unlimited"
      : gift.plan === "pass7"
      ? "a 7-Day Pass"
      : "a Recovery Package";

  const html = renderTemplate(giftEmail, {
    CLAIM_URL: `${siteUrl}/gift/claim?token=${gift.claim_token}`,
    gift_plan_label: giftPlanLabel,
    gift_message:
      gift.gift_message || "No message included — just good recovery vibes.",
  });

  const { error: sendErr } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "LAX N LOUNGE <admin@laxnlounge.com.au>",
    to: gift.recipient_email,
    subject: "Someone gifted you recovery 🎁",
    html,
  });

  if (sendErr) {
    return NextResponse.json({ error: sendErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: gift.recipient_email });
}