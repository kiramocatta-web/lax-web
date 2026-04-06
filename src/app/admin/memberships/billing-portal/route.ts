import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile, error: adminErr } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    if (
      adminErr ||
      (!adminProfile?.is_admin &&
        String(adminProfile?.role ?? "").toLowerCase() !== "admin")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const targetUserId = String(body?.userId ?? "").trim();

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", targetUserId)
      .single();

    if (targetErr || !targetProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "This member does not have a Stripe customer yet." },
        { status: 404 }
      );
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au"
    ).trim();

    const session = await stripe.billingPortal.sessions.create({
      customer: targetProfile.stripe_customer_id,
      return_url: `${siteUrl}/admin/members`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: any) {
    console.error("admin billing portal error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}