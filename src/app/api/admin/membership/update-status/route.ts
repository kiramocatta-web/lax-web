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
  const v = String(value ?? "").trim().toLowerCase();

  if (v === "none" || v === "no membership") return "none";
  if (v === "active") return "active";
  if (v === "cancellation_requested") return "cancellation_requested";
  if (v === "cancelled" || v === "canceled") return "cancelled";

  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: adminProfile, error: adminErr } = await supabaseAdmin
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      !!adminProfile?.is_admin ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (adminErr || !isAdmin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const profileId = String(body?.profile_id ?? "").trim();
    const membershipStatus = normalizeStatus(String(body?.membership_status ?? ""));

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    if (!membershipStatus) {
      return NextResponse.json(
        { error: "Invalid membership_status" },
        { status: 400 }
      );
    }

    const { data: memberProfile, error: memberErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .single();

    if (memberErr || !memberProfile) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    const updatePayload: Record<string, any> = {};

    if (membershipStatus === "none") {
      updatePayload.membership_status = null;
      updatePayload.membership_plan = null;
      updatePayload.membership_expires_at = null;
      updatePayload.stripe_current_period_end = null;
    } else {
      updatePayload.membership_status = membershipStatus;

      if (membershipStatus === "active") {
        updatePayload.membership_expires_at = null;
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", profileId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      membership_status: membershipStatus === "none" ? null : membershipStatus,
    });
  } catch (err: any) {
    console.error("admin membership update-status error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update membership status" },
      { status: 500 }
    );
  }
}