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
      .select("role,is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Admin profile not found" },
        { status: 403 }
      );
    }

    const isAdmin =
      Boolean(profile.is_admin) ||
      String(profile.role ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const notice_id = Number(body?.notice_id);

    if (!Number.isFinite(notice_id)) {
      return NextResponse.json(
        { error: "Invalid notice ID" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("booking_notices")
      .delete()
      .eq("id", notice_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete notice" },
      { status: 500 }
    );
  }
}