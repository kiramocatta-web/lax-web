import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (String(profile?.role ?? "").toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const notice_date = String(body?.notice_date ?? "");
    const start_time = body?.start_time ? String(body.start_time) : null;
    const end_time = body?.end_time ? String(body.end_time) : null;
    const message = String(body?.message ?? "").trim();

    if (!notice_date || !/^\d{4}-\d{2}-\d{2}$/.test(notice_date)) {
      return NextResponse.json({ error: "Invalid notice date" }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Notice message is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("booking_notices")
      .insert({
        notice_date,
        start_time,
        end_time,
        message,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, notice_id: data.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create notice" },
      { status: 500 }
    );
  }
}