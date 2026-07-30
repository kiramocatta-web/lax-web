import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

function getTotalSessions(plan: string | null) {
  if (plan === "pack5") return 5;
  if (plan === "pack10") return 10;

  return null;
}

function getAccessDays(
  plan: string | null,
  storedAccessDays: number | null
) {
  if (
    Number.isInteger(storedAccessDays) &&
    Number(storedAccessDays) > 0
  ) {
    return Number(storedAccessDays);
  }

  /*
   * Fallbacks for older gifts created before access_days
   * was added to package_gifts.
   */
  if (plan === "weekly" || plan === "gift_weekly") {
    return 7;
  }

  if (plan === "monthly" || plan === "gift_monthly") {
    return 28;
  }

  return null;
}

function getGiftMembershipPlan(plan: string | null) {
  if (plan === "weekly" || plan === "gift_weekly") {
    return "gift_weekly";
  }

  if (plan === "monthly" || plan === "gift_monthly") {
    return "gift_monthly";
  }

  return null;
}

function addDaysToNow(days: number) {
  const expiry = new Date();

  expiry.setUTCDate(expiry.getUTCDate() + days);

  return expiry.toISOString();
}

export default async function GiftClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const cleanToken = String(token ?? "").trim();

  if (!cleanToken) {
    redirect(
      "/pricing-membership-and-packages?gift=missing-token"
    );
  }

  const { data: gift, error: giftError } =
    await supabaseAdmin
      .from("package_gifts")
      .select(
  "id,recipient_email,plan,total_sessions,access_days,status,claimed_by_user_id"
)
      .eq("claim_token", cleanToken)
      .maybeSingle();

  if (giftError) {
    redirect(
      `/pricing-membership-and-packages?gift=query-error&message=${encodeURIComponent(
        giftError.message
      )}`
    );
  }

  if (!gift) {
    redirect(
      `/pricing-membership-and-packages?gift=no-gift-found&token=${encodeURIComponent(
        cleanToken
      )}`
    );
  }

  if (
    gift.status === "claimed" ||
    gift.claimed_by_user_id
  ) {
    redirect("/profile?gift=already-claimed");
  }

  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/gift/redeem?token=${encodeURIComponent(
        cleanToken
      )}`
    );
  }

  const userEmail = String(
    user.email ?? ""
  )
    .trim()
    .toLowerCase();

  const recipientEmail = String(
    gift.recipient_email ?? ""
  )
    .trim()
    .toLowerCase();

  if (
    recipientEmail &&
    userEmail !== recipientEmail
  ) {
    redirect("/profile?gift=email-mismatch");
  }

  const plan = String(
    gift.plan ?? ""
  ).toLowerCase();

  const isPackageGift =
    plan === "pack5" ||
    plan === "pack10";

  const giftedMembershipPlan =
    getGiftMembershipPlan(plan);

  const isUnlimitedGift =
    Boolean(giftedMembershipPlan);

  if (!isPackageGift && !isUnlimitedGift) {
    redirect("/profile?gift=invalid-plan");
  }

  /*
   * Reserve the gift first.
   *
   * The conditional status check prevents two requests
   * from successfully claiming the same gift.
   */
  const claimedAt =
    new Date().toISOString();

  const {
    data: reservedGift,
    error: reserveError,
  } = await supabaseAdmin
    .from("package_gifts")
    .update({
      status: "claimed",
      claimed_by_user_id: user.id,
      claimed_at: claimedAt,
    })
    .eq("id", gift.id)
    .eq("status", "unclaimed")
    .is("claimed_by_user_id", null)
    .select("id")
    .maybeSingle();

  if (reserveError) {
    redirect("/profile?gift=claim-error");
  }

  if (!reservedGift) {
    redirect("/profile?gift=already-claimed");
  }

  /*
   * Package gifts create session credits.
   */
  if (isPackageGift) {
    const totalSessions =
      Number(gift.total_sessions ?? 0) ||
      getTotalSessions(plan);

    if (!totalSessions) {
      await supabaseAdmin
        .from("package_gifts")
        .update({
          status: "unclaimed",
          claimed_by_user_id: null,
          claimed_at: null,
        })
        .eq("id", gift.id)
        .eq("claimed_by_user_id", user.id);

      redirect("/profile?gift=credit-error");
    }

    const { error: creditError } =
      await supabaseAdmin
        .from("package_credits")
        .insert({
          user_id: user.id,
          plan,
          total_sessions: totalSessions,
          remaining_sessions: totalSessions,
          status: "active",
        });

    if (creditError) {
      await supabaseAdmin
        .from("package_gifts")
        .update({
          status: "unclaimed",
          claimed_by_user_id: null,
          claimed_at: null,
        })
        .eq("id", gift.id)
        .eq("claimed_by_user_id", user.id);

      redirect("/profile?gift=credit-error");
    }
  }

  /*
   * Unlimited gifts activate fixed-duration access.
   *
   * The expiry begins when the recipient claims the gift,
   * not when it was purchased.
   */
  if (
    isUnlimitedGift &&
    giftedMembershipPlan
  ) {
    const accessDays =
      getAccessDays(
        plan,
        gift.access_days === null
          ? null
          : Number(gift.access_days)
      );

    if (!accessDays) {
      await supabaseAdmin
        .from("package_gifts")
        .update({
          status: "unclaimed",
          claimed_by_user_id: null,
          claimed_at: null,
        })
        .eq("id", gift.id)
        .eq("claimed_by_user_id", user.id);

      redirect("/profile?gift=access-error");
    }

    const membershipExpiresAt =
      addDaysToNow(accessDays);

    const { error: profileUpdateError } =
      await supabaseAdmin
        .from("profiles")
        .update({
          membership_plan:
            giftedMembershipPlan,
          membership_status: "active",
          membership_expires_at:
            membershipExpiresAt,
          membership_paused_until: null,

          /*
           * Gifted memberships are not recurring Stripe
           * subscriptions.
           */
          stripe_subscription_id: null,
          stripe_current_period_end: null,
        })
        .eq("id", user.id);

    if (profileUpdateError) {
      await supabaseAdmin
        .from("package_gifts")
        .update({
          status: "unclaimed",
          claimed_by_user_id: null,
          claimed_at: null,
        })
        .eq("id", gift.id)
        .eq("claimed_by_user_id", user.id);

      redirect("/profile?gift=access-error");
    }

    /*
     * Optional but useful for seeing the actual access
     * expiry directly in package_gifts.
     *
     * Only include this update if you added an
     * access_expires_at column.
     */
    // await supabaseAdmin
    //   .from("package_gifts")
    //   .update({
    //     access_expires_at: membershipExpiresAt,
    //   })
    //   .eq("id", gift.id);
  }

  redirect("/profile?gift=claimed");
}