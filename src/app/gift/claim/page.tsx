import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

function getTotalSessions(plan: string | null) {
  if (plan === "pack5") return 5;
  if (plan === "pack10") return 10;
  return null;
}

export default async function GiftClaimPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const cleanToken = String(searchParams.token ?? "").trim();

  if (!cleanToken) {
    redirect("/membership?gift=missing-token");
  }

  const { data: gift, error: giftErr } = await supabaseAdmin
    .from("package_gifts")
    .select("id,recipient_email,plan,total_sessions,status,claimed_by_user_id")
    .eq("claim_token", cleanToken)
    .maybeSingle();

  if (giftErr) {
  redirect(`/membership?gift=query-error&message=${encodeURIComponent(giftErr.message)}`);
}

if (!gift) {
  redirect(`/membership?gift=no-gift-found&token=${encodeURIComponent(cleanToken)}`);
}

  if (gift.status === "claimed" || gift.claimed_by_user_id) {
    redirect("/profile?gift=already-claimed");
  }

  const auth = await supabaseServer();

  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    redirect(`/gift/redeem?token=${cleanToken}`);
  }

  const userEmail = String(user.email ?? "").trim().toLowerCase();
  const recipientEmail = String(gift.recipient_email ?? "").trim().toLowerCase();

  if (recipientEmail && userEmail !== recipientEmail) {
    redirect("/profile?gift=email-mismatch");
  }

  const totalSessions =
    Number(gift.total_sessions ?? 0) || getTotalSessions(gift.plan);

  if (gift.plan === "pack5" || gift.plan === "pack10") {
    if (!totalSessions) {
      redirect("/profile?gift=credit-error");
    }

    const { error: creditErr } = await supabaseAdmin
      .from("package_credits")
      .insert({
        user_id: user.id,
        plan: gift.plan,
        total_sessions: totalSessions,
        remaining_sessions: totalSessions,
        status: "active",
      });

    if (creditErr) {
      redirect("/profile?gift=credit-error");
    }
  }

  const { error: claimErr } = await supabaseAdmin
    .from("package_gifts")
    .update({
      status: "claimed",
      claimed_by_user_id: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", gift.id)
    .eq("status", "unclaimed");

  if (claimErr) {
    redirect("/profile?gift=claim-error");
  }

  redirect("/profile?gift=claimed");
}