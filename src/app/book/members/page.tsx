import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import BookMembersClient from "../BookMembersClient";

function isFutureDate(value: string | null) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export default async function BookMembersPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/pricing-membership-and-packages");
  }

  const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select(
    "role,membership_plan,membership_status,membership_expires_at,membership_paused_until"
  )
  .eq("id", user.id)
  .single();

  if (profileError || !profile) {
    redirect("/pricing-membership-and-packages");
  }

  const role = String(profile.role ?? "").toLowerCase();

  /*
   * Affiliates receive booking access without a membership
   * or package.
   */
  if (role === "affiliate") {
    return <BookMembersClient membershipExpiresAt={null} />;
  }

  const pausedUntil = profile.membership_paused_until ?? null;

  /*
   * Paused recurring memberships cannot make bookings.
   */
  if (isFutureDate(pausedUntil)) {
    redirect("/profile");
  }

  const { data: packageCredit, error: packageCreditError } = await supabase
    .from("package_credits")
    .select("id,remaining_sessions,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("remaining_sessions", 0)
    .order("purchased_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (packageCreditError) {
    redirect("/pricing-membership-and-packages");
  }

  const membershipPlan = String(
    profile.membership_plan ?? ""
  ).toLowerCase();

  const membershipStatus = String(
    profile.membership_status ?? "inactive"
  ).toLowerCase();

  const membershipExpiresAt =
    profile.membership_expires_at ?? null;

  const hasFutureExpiry = isFutureDate(membershipExpiresAt);

  const activeMembershipStatuses = [
    "active",
    "trialing",
    "cancellation_requested",
  ];

  /*
   * A normal weekly membership is an ongoing Stripe
   * subscription.
   */
  const recurringWeeklyPlans = [
  "weekly",
  "secret_weekly_15",
];

const isRecurringWeekly =
  recurringWeeklyPlans.includes(
    membershipPlan
  );

  /*
   * These plans grant unlimited access only until their
   * membership_expires_at date.
   *
   * Keep both current and gifted plan names here so the
   * booking system supports either naming approach.
   */
  const isFixedDurationPlan =
    membershipPlan === "pass7" ||
    membershipPlan === "monthly" ||
    membershipPlan === "gift_weekly" ||
    membershipPlan === "gift_monthly";

  /*
   * Packs receive access through package_credits only.
   */
  const isPackagePlan =
    membershipPlan === "pack5" ||
    membershipPlan === "pack10";

  const hasPackageCredit = Boolean(packageCredit?.id);

  let hasMembershipAccess = false;

  if (isRecurringWeekly) {
    hasMembershipAccess =
      activeMembershipStatuses.includes(membershipStatus) ||
      (
        ["cancelled", "canceled"].includes(membershipStatus) &&
        hasFutureExpiry
      );
  } else if (isFixedDurationPlan) {
    hasMembershipAccess =
      activeMembershipStatuses.includes(membershipStatus) &&
      hasFutureExpiry;
  } else if (isPackagePlan) {
    hasMembershipAccess = false;
  }

  const hasAccess =
    hasMembershipAccess ||
    hasPackageCredit;

  if (!hasAccess) {
    /*
     * Clean up an expired fixed-duration plan.
     *
     * Access is denied even if this database update fails.
     */
    if (isFixedDurationPlan && !hasFutureExpiry) {
      await supabase
        .from("profiles")
        .update({
          membership_status: "inactive",
          membership_paused_until: null,
          stripe_subscription_id: null,
          stripe_current_period_end: null,
        })
        .eq("id", user.id);
    }

    redirect("/pricing-membership-and-packages");
  }

  /*
   * Only timed plans need an expiry passed into the client.
   * Package users and ongoing weekly subscribers do not need
   * a maximum booking date.
   */
  const bookingExpiry =
    isFixedDurationPlan
      ? membershipExpiresAt
      : null;

  return (
    <BookMembersClient
      membershipExpiresAt={bookingExpiry}
    />
  );
}