import { redirect } from "next/navigation";
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
  const { token } = searchParams;
  const cleanToken = String(token ?? "").trim();

  if (!cleanToken) {
    redirect("/membership");
  }

  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnTo=/gift/claim?token=${cleanToken}`);
  }

  const { data: gift, error: giftErr } = await supabase
    .from("package_gifts")
    .select(
      "id,recipient_email,plan,total_sessions,remaining_sessions,status,claimed_by_user_id"
    )
    .eq("claim_token", cleanToken)
    .maybeSingle();

  if (giftErr || !gift) {
    redirect("/membership?gift=invalid");
  }

  if (gift.status === "claimed" || gift.claimed_by_user_id) {
    redirect("/profile?gift=already-claimed");
  }

  const userEmail = String(user.email ?? "").trim().toLowerCase();
  const recipientEmail = String(gift.recipient_email ?? "").trim().toLowerCase();

  if (recipientEmail && userEmail !== recipientEmail) {
    redirect("/profile?gift=email-mismatch");
  }

  const totalSessions =
    Number(gift.total_sessions ?? 0) || getTotalSessions(gift.plan);

  if (gift.plan === "pack5" || gift.plan === "pack10") {
    const { error: creditErr } = await supabase.from("package_credits").insert({
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

  if (gift.plan === "pass7" || gift.plan === "monthly") {
    const days = gift.plan === "monthly" ? 28 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        membership_plan: gift.plan,
        membership_status: "active",
        membership_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (profileErr) {
      redirect("/profile?gift=profile-error");
    }
  }

  const { error: claimErr } = await supabase
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