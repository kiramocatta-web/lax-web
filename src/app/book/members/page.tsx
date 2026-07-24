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
   * Affiliates are allowed to use the members booking page
   * without a membership or package.
   */
  if (role === "affiliate") {
    return <BookMembersClient />;
  }

  /*
   * Check whether the customer has an active package credit.
   */
  const { data: packageCredit, error: packageCreditError } = await supabase
    .from("package_credits")
    .select("id,remaining_sessions,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("remaining_sessions", 0)
    .limit(1)
    .maybeSingle();

  if (packageCreditError) {
    redirect("/pricing-membership-and-packages");
  }

  /*
   * Paused memberships cannot make member bookings.
   */
  const pausedUntil = profile.membership_paused_until ?? null;

  if (isFutureDate(pausedUntil)) {
    redirect("/profile");
  }

  const status = String(
    profile.membership_status ?? "inactive"
  ).toLowerCase();

  const membershipPlan = String(
    profile.membership_plan ?? ""
  ).toLowerCase();

  const hasFutureExpiry = isFutureDate(
    profile.membership_expires_at ?? null
  );

  const hasPackageCredit = Boolean(packageCredit?.id);

  const activeMembershipStatuses = [
    "active",
    "trialing",
    "cancellation_requested",
  ];

  const isWeeklyMembership =
  membershipPlan === "weekly";

const isFixedDurationPlan =
  membershipPlan === "pass7" ||
  membershipPlan === "monthly";

const isPackagePlan =
  membershipPlan === "pack5" ||
  membershipPlan === "pack10";

  let hasMembershipAccess = false;

if (isFixedDurationPlan) {
  /*
   * 7-day and monthly passes require both:
   * - an accepted active status
   * - a future expiry date
   */
  hasMembershipAccess =
    activeMembershipStatuses.includes(status) &&
    hasFutureExpiry;
} else if (isWeeklyMembership) {
  /*
   * Weekly is an ongoing Stripe subscription.
   */
  hasMembershipAccess =
    activeMembershipStatuses.includes(status) ||
    (status === "cancelled" && hasFutureExpiry);
} else if (isPackagePlan) {
  /*
   * Packages receive access only from remaining credits.
   * membership_status must not grant unlimited access.
   */
  hasMembershipAccess = false;
}

  const hasAccess =
    hasMembershipAccess ||
    hasPackageCredit;

  if (!hasAccess) {
    /*
     * Clean up an expired fixed-duration membership.
     *
     * Access is denied regardless of whether this
     * database update succeeds.
     */
    if (isFixedDurationPlan && !hasFutureExpiry) {
      await supabase
        .from("profiles")
        .update({
          membership_status: "inactive",
        })
        .eq("id", user.id);
    }

    redirect("/pricing-membership-and-packages");
  }

  return <BookMembersClient />;
}