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

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    const isAdmin =
      Boolean(adminProfile?.is_admin) ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const blockId = Number(body?.block_id);

    if (!Number.isFinite(blockId) || blockId <= 0) {
      return NextResponse.json({ error: "Invalid block_id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("booking_blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete booking block" },
      { status: 500 }
    );
  }
}