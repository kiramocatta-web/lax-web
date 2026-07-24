import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AllowedStatus =
  | "none"
  | "active"
  | "cancellation_requested"
  | "cancelled";

function normalizeStatus(value: string): AllowedStatus | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "none" ||
    normalized === "no membership"
  ) {
    return "none";
  }

  if (normalized === "active") {
    return "active";
  }

  if (normalized === "cancellation_requested") {
    return "cancellation_requested";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "cancelled";
  }

  return null;
}

function isFutureDate(value: string | null) {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const {
      data: adminProfile,
      error: adminError,
    } = await supabaseAdmin
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      Boolean(adminProfile?.is_admin) ||
      String(adminProfile?.role ?? "")
        .toLowerCase() === "admin";

    if (adminError || !isAdmin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);

    const profileId = String(
      body?.profile_id ?? ""
    ).trim();

    const membershipStatus = normalizeStatus(
      String(body?.membership_status ?? "")
    );

    if (!profileId) {
      return NextResponse.json(
        { error: "Missing profile_id" },
        { status: 400 }
      );
    }

    if (!membershipStatus) {
      return NextResponse.json(
        { error: "Invalid membership_status" },
        { status: 400 }
      );
    }

    const {
      data: memberProfile,
      error: memberError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,membership_plan,membership_expires_at"
      )
      .eq("id", profileId)
      .single();

    if (memberError || !memberProfile) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    const existingPlan = String(
      memberProfile.membership_plan ?? ""
    )
      .trim()
      .toLowerCase();

    const existingExpiry =
      memberProfile.membership_expires_at ?? null;

    const hasFutureExpiry =
      isFutureDate(existingExpiry);

    const isWeeklyPlan =
      existingPlan === "weekly";

    const isFixedDurationPlan =
      existingPlan === "pass7" ||
      existingPlan === "monthly";

    const updatePayload: Record<string, unknown> = {};

    if (membershipStatus === "none") {
      updatePayload.role = "guest";
      updatePayload.membership_status = "inactive";
      updatePayload.membership_plan = null;
      updatePayload.membership_expires_at = null;
      updatePayload.membership_paused_until = null;
      updatePayload.stripe_current_period_end = null;
      updatePayload.stripe_subscription_id = null;
    } else {
      if (!isWeeklyPlan && !isFixedDurationPlan) {
        return NextResponse.json(
          {
            error:
              "Cannot set membership status without a valid membership plan.",
          },
          { status: 400 }
        );
      }

      /*
       * A fixed-duration pass cannot be manually activated
       * after its expiry unless a new expiry is supplied
       * through a proper purchase or renewal process.
       */
      if (
        membershipStatus === "active" &&
        isFixedDurationPlan &&
        !hasFutureExpiry
      ) {
        return NextResponse.json(
          {
            error:
              existingPlan === "pass7"
                ? "This 7-day pass has expired. A new pass must be purchased before it can be activated."
                : "This monthly pass has expired. A new pass must be purchased before it can be activated.",
          },
          { status: 400 }
        );
      }

      updatePayload.role = "member";
      updatePayload.membership_status =
        membershipStatus;

      /*
       * Weekly memberships do not use membership_expires_at
       * while actively subscribed.
       */
      if (
        membershipStatus === "active" &&
        isWeeklyPlan
      ) {
        updatePayload.membership_expires_at = null;
      }

      /*
       * For pass7 and monthly, preserve the existing expiry.
       * Never erase it when changing the status.
       */
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", profileId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      role: updatePayload.role,
      membership_status:
        updatePayload.membership_status,
      membership_plan:
        membershipStatus === "none"
          ? null
          : existingPlan,
      membership_expires_at:
        membershipStatus === "none"
          ? null
          : existingExpiry,
    });
  } catch (error: unknown) {
    console.error(
      "admin membership update-status error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update membership status";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}