import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import BookMembersClient from "../BookMembersClient";

function isFutureDate(value: string | null) {
  if (!value) return false;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) && ts > Date.now();
}

export default async function BookMembersPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to membership signup
  if (!user) {
    redirect("/membership");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "role,membership_plan,membership_status,membership_expires_at,membership_paused_until"
    )
    .eq("id", user.id)
    .single();

  const role = String(profile?.role ?? "").toLowerCase();

  // Affiliates can access bookings
  if (role === "affiliate") {
    return <BookMembersClient />;
  }

  const pausedUntil = profile?.membership_paused_until ?? null;

  if (isFutureDate(pausedUntil)) {
    redirect("/profile");
  }

  const status = String(profile?.membership_status ?? "inactive").toLowerCase();
  const membershipPlan = String(profile?.membership_plan ?? "").toLowerCase();
  const hasFutureExpiry = isFutureDate(profile?.membership_expires_at ?? null);

  const hasAccess =
    status === "active" ||
    status === "trialing" ||
    status === "cancellation_requested" ||
    (status === "cancelled" && hasFutureExpiry) ||
    (membershipPlan === "pass7" && hasFutureExpiry);

  if (!hasAccess) {
    redirect("/membership");
  }

  return <BookMembersClient />;
}