// src/app/api/affiliates/create-invite/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // 1) Must be logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Must be admin (via profiles)
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    if (!prof?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Optional payload (email to lock invite to a specific email)
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase() || null;

    // 4) Create invite
    const expiresAt = addDaysISO(7);

    const { data: invite, error: invErr } = await supabaseAdmin
      .from("affiliate_invites")
      .insert({
        email,
        expires_at: expiresAt,
        is_used: false,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (invErr || !invite) {
      return NextResponse.json({ error: invErr?.message || "Failed to create invite" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.laxnlounge.com.au";
    const url = `${siteUrl}/affiliate-signup/${invite.id}`;

    return NextResponse.json({ id: invite.id, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}